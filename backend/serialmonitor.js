import { SerialPort, ReadlineParser } from "serialport";
import { PrismaClient } from "@prisma/client";

export default function startSerial(io) {
  const prisma = new PrismaClient();

  const serialPort = new SerialPort({
  path: "/dev/tty.usbmodem101",  // 👈 your Arduino port
  baudRate: 9600    
    });

  // Connection status handlers
  serialPort.on("open", () => {
    console.log("✅ Serial port opened successfully!");
    console.log("🔌 Listening to Arduino (OTA + Voltage)...");
  });

  serialPort.on("error", (err) => {
    console.error("❌ Serial Port Error:", err.message);
    if (err.message.includes("cannot open")) {
      console.error("⚠️  Port may be in use or device not connected");
    }
  });

  serialPort.on("close", () => {
    console.log("⚠️  Serial port closed");
  });

  const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

  parser.on("data", async (line) => {
   
    
    const parts = line.trim().split(",");
    if (parts.length === 2) {
      const ota = parseInt(parts[0]);
      const voltage = parseFloat(parts[1]);

     

      if (!isNaN(ota) && !isNaN(voltage)) {
        try {
          
          const savedData = await prisma.hw233Ota.create({
            data: {
              ota_value: ota,
              ota_voltage: voltage,
            },
          });

          

          // Emit to frontend
          io.emit("new_data", { ota, voltage });

          
        } catch (dbError) {
          
          // Still emit to frontend even if DB save fails
          io.emit("new_data", { ota, voltage });
        }
      } else {
        console.log(`⚠️  Invalid data - OTA: ${ota}, Voltage: ${voltage}`);
      }
    } else {
      console.log(`⚠️  Wrong format - Expected 2 values, got ${parts.length}`);
    }
  });

  

  
}
