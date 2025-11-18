import "dotenv/config.js";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import startSerial from "./serialmonitor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

app.use(express.static(path.join(__dirname, "../frontend")));

startSerial(io);
app.use(express.urlencoded({ extended: true }));

app.post("/test-data", (req, res) => {
  const { ota, voltage } = req.body;
  if (!ota || !voltage) {
    return res.status(400).json({ error: "Missing ota or voltage" });
  }
  const otaVal = parseInt(ota);
  const voltageVal = parseFloat(voltage);
  if (isNaN(otaVal) || isNaN(voltageVal)) {
    return res.status(400).json({ error: "Invalid values" });
  }
  io.emit("new_data", { ota: otaVal, voltage: voltageVal });
  console.log(`📊 Test data: OTA=${otaVal}, Voltage=${voltageVal.toFixed(2)}V`);
  res.json({ success: true, ota: otaVal, voltage: voltageVal });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 HW233 OTA + Prisma server running at http://localhost:${PORT}`);
  console.log(`📊 Frontend available at http://localhost:${PORT}`);
});
