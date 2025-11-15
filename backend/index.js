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

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 HW233 OTA + Prisma server running at http://localhost:${PORT}`);
  console.log(`📊 Frontend available at http://localhost:${PORT}`);
});
