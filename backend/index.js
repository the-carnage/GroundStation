import 'dotenv/config';
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import startSerial from "./serialmonitor.js";
import { getPortSnapshot, performInitialScan, scanPortsOnDemand } from "./port.js";
import { exportCSV, exportXLSX, getCacheStatsHandler, clearCacheHandler } from "./exportController.js";
import { getCachedData } from "./dataCache.js";
import configManager from "./configManager.js";

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

// Perform initial port scan on startup
console.log('🔍 Performing initial port scan on startup...');
performInitialScan().then((snapshot) => {
  console.log(`✅ Initial scan complete: ${snapshot.ports.length} port(s) found`);
}).catch((err) => {
  console.error('❌ Initial port scan failed:', err.message);
});

app.use(express.json());

// Serve the new modern interface by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

// Legacy interface available at /legacy
app.get('/legacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Static files AFTER specific routes to prevent index.html from overriding
app.use(express.static(path.join(__dirname)));

// Get current port snapshot (cached)
app.get("/api/serial-ports", (req, res) => {
  const snapshot = getPortSnapshot();
  if (snapshot.error && snapshot.ports.length === 0) {
    return res.status(500).json({ error: snapshot.error.message, ports: [] });
  }
  res.json({ ports: snapshot.ports });
});

// Manual port scan endpoint (triggered by scan button)
app.post("/api/serial-ports/scan", async (req, res) => {
  try {
    console.log('🔍 Manual port scan triggered by client');
    const snapshot = await scanPortsOnDemand();
    // Broadcast updated port list to all connected clients
    io.emit("serial_port_list", snapshot.ports);
    if (snapshot.error) {
      io.emit("serial_port_list_error", { message: snapshot.error.message });
    }
    res.json({ ports: snapshot.ports, success: true });
  } catch (error) {
    console.error('❌ Manual port scan failed:', error.message);
    res.status(500).json({ error: error.message, ports: [], success: false });
  }
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

// Get current data schema
app.get("/api/schema", (req, res) => {
  const schema = configManager.getSchema();
  const stats = configManager.getStats();
  res.json({ schema, stats });
});

// Get default configuration based on current schema
app.get("/api/config/default", (req, res) => {
  const defaultConfig = configManager.getDefaultConfig();
  res.json(defaultConfig);
});

// Get schema statistics
app.get("/api/schema/stats", (req, res) => {
  const stats = configManager.getStats();
  res.json(stats);
});

// Clear/reset schema (for testing/debugging)
app.post("/api/schema/reset", (req, res) => {
  configManager.clearSchema();
  res.json({ success: true, message: "Schema reset successfully" });
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

  // Handle manual port scan request via socket
  socket.on("scan_serial_ports", async () => {
    try {
      console.log('🔍 Manual port scan requested via socket');
      const snapshot = await scanPortsOnDemand();
      io.emit("serial_port_list", snapshot.ports);
      if (snapshot.error) {
        io.emit("serial_port_list_error", { message: snapshot.error.message });
      }
    } catch (error) {
      console.error('❌ Socket port scan failed:', error.message);
      socket.emit("serial_port_list_error", { message: error.message });
    }
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

  // Handle demo/test data from demo generator
  socket.on("test_data", async (data) => {
    console.log('📊 Test data received:', data.raw.substring(0, 100));

    // Import the parser dynamically
    const { parseFlexibleData } = await import('./dataParser.js');
    const configManagerModule = await import('./configManager.js');
    const configMgr = configManagerModule.default;

    try {
      // Parse using flexible parser
      const parsed = parseFlexibleData(data.raw);

      if (parsed.data && Object.keys(parsed.data).length > 0) {
        // Update schema
        configMgr.updateSchema(parsed.data);

        // Emit events as if from serial port
        io.emit("serial_data", {
          raw: data.raw,
          timestamp: data.timestamp || new Date().toISOString(),
        });

        io.emit("schema_update", {
          schema: configMgr.getSchema(),
          format: parsed.format,
        });

        io.emit("telemetry_update", {
          ...parsed.data,
          serial_connected: true,
          timestamp: parsed.timestamp.toISOString(),
          format: parsed.format,
        });
      }
    } catch (error) {
      console.error('Error processing test data:', error.message);
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