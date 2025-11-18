import { SerialPort, ReadlineParser } from "serialport";
import { PrismaClient } from "@prisma/client";

export default function startSerial(io) {
  const prisma = new PrismaClient();

  // Test database connection
  prisma.$connect()
    .then(() => console.log("✅ Database connected!"))
    .catch((err) => {
      console.error("❌ Database connection failed:", err.message);
      process.exit(1);
    });

  const serialPort = new SerialPort({
    path: "/dev/cu.usbmodem101",
    baudRate: 9600    
  });

  serialPort.on("open", () => {
    console.log("✅ Serial port opened successfully!");
    console.log("🔌 Listening to Arduino (OTA + Voltage)...");
  });

  serialPort.on("error", (err) => {
    console.error("Serial Port Error:", err.message);
    if (err.message.includes("cannot open")) {
      console.error("⚠️  Port may be in use or device not connected");
       console.log("💡 Switching to TEST MODE - waiting for manual data input");
       console.log("📡 You can send test data via: curl -X POST http://localhost:5001/test-data -d 'ota=512&voltage=5.0'");
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

          

          io.emit("new_data", { ota, voltage });

          
        } catch (dbError) {
          
          io.emit("new_data", { ota, voltage });
        }
      } else {
        console.log(`Invalid data - OTA: ${ota}, Voltage: ${voltage}`);
      }
    } else {
      console.log(`Wrong format - Expected 2 values, got ${parts.length}`);
    }
  });

  

  
}
