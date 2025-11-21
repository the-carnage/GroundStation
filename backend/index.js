import 'dotenv/config';
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import startSerial from "./serialmonitor.js";
import { getPortSnapshot, startPortMonitor } from "./port.js";
import { exportCSV, exportXLSX, getCacheStatsHandler, clearCacheHandler } from "./exportController.js";
import { getCachedData } from "./dataCache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const serialRefreshMs = Math.max(2000, parseInt(process.env.SERIAL_PORT_REFRESH_MS ?? "5000", 10));
console.log(`🔄 Starting port monitor (refresh every ${serialRefreshMs}ms)`);
startPortMonitor({
  intervalMs: serialRefreshMs,
  onUpdate: (snapshot) => {
    console.log(`🔄 Port monitor update: ${snapshot.ports.length} ports, broadcasting to clients`);
    io.emit("serial_port_list", snapshot.ports);
    if (snapshot.error) {
      io.emit("serial_port_list_error", { message: snapshot.error.message });
    }
  },
});

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get("/api/serial-ports", (req, res) => {
  const snapshot = getPortSnapshot();
  if (snapshot.error && snapshot.ports.length === 0) {
    return res.status(500).json({ error: snapshot.error.message, ports: [] });
  }
  res.json({ ports: snapshot.ports });
});

// Export endpoints
app.get("/api/export/csv", exportCSV);
app.get("/api/export/xlsx", exportXLSX);

// Cache management endpoints
app.get("/api/cache/stats", getCacheStatsHandler);
app.post("/api/cache/clear", clearCacheHandler);

// Get cached telemetry data (for frontend graphs)
app.get("/api/telemetry", (req, res) => {
  const minutes = parseInt(req.query.minutes) || 0;
  const type = req.query.type || 'all';
  const data = getCachedData(type, minutes);
  res.json(data);
});

function emitPortSnapshot(socket) {
  const snapshot = getPortSnapshot();
  console.log(`📤 Emitting port snapshot to client: ${snapshot.ports.length} ports`);
  socket.emit("serial_port_list", snapshot.ports);
  if (snapshot.error) {
    socket.emit("serial_port_list_error", { message: snapshot.error.message });
  }
}

// start serial monitor and keep controller handle
const serialController = startSerial(io);

io.on("connection", (socket) => {
  emitPortSnapshot(socket);

  socket.on("request_serial_ports", () => {
    emitPortSnapshot(socket);
  });

  socket.on("change_serial_settings", (payload) => {
    console.info("Serial settings change requested:", payload);
    // apply to serial controller if available
    if (serialController && typeof serialController.setPortAndBaud === 'function') {
      const result = serialController.setPortAndBaud(payload.port, payload.baud);
      socket.emit("serial_settings_ack", result);
      // broadcast new baud to all clients
      if (result && result.success) {
        io.emit('serial_baud', { baud: Number(payload.baud) });
      }
    } else {
      socket.emit("serial_settings_ack", { success: false, error: 'serial controller unavailable' });
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

//// sir code


//   const now = new Date();
//   const telemetry = {
//     ota: otaVal,
//     voltage: voltageVal,
//     temperature: 25 + (otaVal % 5),
//     humidity: 1013 + (otaVal % 10),
//     battery: Math.min(100, Math.max(0, Math.floor((voltageVal / 5) * 100))),
//     batt_current: (voltageVal / 5).toFixed(2),
//     gps_sats: Math.min(12, Math.max(0, Math.floor(otaVal / 80))),
//     gps_lat: 37.7749 + (otaVal - 512) * 0.00001,
//     gps_lon: -122.4194 + (otaVal - 512) * 0.00001,
//     gps_time: now.toISOString().split('T')[1].split('.')[0],
//     gps_date: now.toISOString().split('T')[0],
//     gps_alt: (otaVal * 0.1).toFixed(2),
//     gps_speed: (otaVal % 50).toFixed(1),
//     accel_x: (Math.random() * 2 - 1).toFixed(2),
//     accel_y: (Math.random() * 2 - 1).toFixed(2),
//     accel_z: (Math.random() * 2 - 1).toFixed(2),
//     gyro_x: (Math.random() * 10 - 5).toFixed(2),
//     gyro_y: (Math.random() * 10 - 5).toFixed(2),
//     gyro_z: (Math.random() * 10 - 5).toFixed(2),
//     esc1_rpm: otaVal * 2,
//     esc2_rpm: otaVal * 2 + 5,
//     esc3_rpm: otaVal * 2 + 10,
//     esc4_rpm: otaVal * 2 + 15,
//   };

//   io.emit("new_data", telemetry);
//   console.log(`📊 Test telemetry emitted: OTA=${otaVal}, Voltage=${voltageVal.toFixed(2)}V`);
//   res.json({ success: true, telemetry });
// });

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => {
//   console.log(`📊 Frontend available at http://localhost:${PORT}`);
// });