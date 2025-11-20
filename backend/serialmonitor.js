// import { SerialPort, ReadlineParser } from "serialport";
// import { PrismaClient } from "@prisma/client";

// export default function startSerial(io) {
//   const prisma = new PrismaClient();

//   // Test database connection
//   prisma.$connect()
//     .then(() => console.log("✅ Database connected!"))
//     .catch((err) => {
//       console.error("❌ Database connection failed:", err.message);
//       process.exit(1);
//     });

//   const serialPort = new SerialPort({
//     path: "/dev/cu.usbmodem101",
//     baudRate: 9600    
//   });

//   serialPort.on("open", () => {
//     console.log("✅ Serial port opened successfully!");
//     console.log("🔌 Listening to Arduino (OTA + Voltage)...");
//   });

//   serialPort.on("error", (err) => {
//     console.error("Serial Port Error:", err.message);
//     if (err.message.includes("cannot open")) {
//       console.error("⚠️  Port may be in use or device not connected");
//        console.log("💡 Switching to TEST MODE - waiting for manual data input");
//        console.log("📡 You can send test data via: curl -X POST http://localhost:5001/test-data -d 'ota=512&voltage=5.0'");
//     }
//   });

//   serialPort.on("close", () => {
//     console.log("⚠️  Serial port closed");
//   });

//   const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

//   parser.on("data", async (line) => {
   
    
//     const parts = line.trim().split(",");
//     if (parts.length === 2) {
//       const ota = parseInt(parts[0]);
//       const voltage = parseFloat(parts[1]);

     

//       if (!isNaN(ota) && !isNaN(voltage)) {
//         try {
          
//           const savedData = await prisma.hw233Ota.create({
//             data: {
//               ota_value: ota,
//               ota_voltage: voltage,
//             },
//           });

          

//           io.emit("new_data", { ota, voltage });

          
//         } catch (dbError) {
          
//           io.emit("new_data", { ota, voltage });
//         }
//       } else {
//         console.log(`Invalid data - OTA: ${ota}, Voltage: ${voltage}`);
//       }
//     } else {
//       console.log(`Wrong format - Expected 2 values, got ${parts.length}`);
//     }
//   });

  

  
// }
// import { SerialPort, ReadlineParser } from "serialport";
// import { PrismaClient } from "@prisma/client";
// import fs from "fs";

// let isSerialConnected = false; 

// export default function startSerial(io) {
//   const prisma = new PrismaClient();

//   // Toggle raw logging by setting env var: SERIAL_DEBUG_RAW=1
//   const DEBUG_RAW = process.env.SERIAL_DEBUG_RAW === "1";
//   const RAW_LOG_PATH = "serial_raw.log";

//   prisma.$connect()
//     .then(() => console.log("✅ Database connected!"))
//     .catch((err) => {
//       console.error("❌ Database connection failed:", err.message);
//       process.exit(1);
//     });

//   const serialPort = new SerialPort({
//     path: "/dev/cu.usbserial-A5069RR4",
//     baudRate: 9600    
//   });

//   serialPort.on("open", () => {
//     console.log("✅ Serial port opened successfully!");
//     console.log("🔌 Listening to Arduino (Multi-Sensor Schema)...");
//     isSerialConnected = true;
//     io.emit("serial_status", { serial_connected: isSerialConnected });
//   });

//   serialPort.on("error", (err) => {
//     console.error("Serial Port Error:", err.message);
//     isSerialConnected = false;
//     io.emit("serial_status", { serial_connected: isSerialConnected });
//     if (err.message.includes("cannot open")) {
//       console.error("⚠️  Port may be in use or device not connected");
//        console.log("💡 Ensure Arduino is connected and uploading data.");
//     }
//   });

//   serialPort.on("close", () => {
//     console.log("⚠️  Serial port closed");
//     isSerialConnected = false;
//     io.emit("serial_status", { serial_connected: isSerialConnected });
//   });

//   const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

//   // Also listen for raw chunks so we can inspect encoding/garbage when needed
//   serialPort.on("data", (chunk) => {
//     if (!DEBUG_RAW) return;
//     try {
//       const hex = Buffer.from(chunk).toString("hex");
//       const now = new Date().toISOString();
//       const entry = `${now} len=${chunk.length} hex=${hex}\n`;
//       console.log("[SERIAL RAW]", entry);
//       fs.appendFile(RAW_LOG_PATH, entry, (err) => { if (err) console.error("Write raw log failed:", err.message); });
//     } catch (err) {
//       console.error("Failed to log raw chunk:", err.message);
//     }
//   });

//   parser.on("data", async (line) => {
//     if (!isSerialConnected) return;

//     const rawLine = typeof line === "string" ? line : String(line);
//     const parts = rawLine.trim().split(",");
//     const EXPECTED_PARTS = 20;

//     // Helper to flush a bad packet to a file for offline analysis
//     const dumpBadPacket = (reason) => {
//       try {
//         const dump = `${new Date().toISOString()} reason=${reason} len=${rawLine.length} data=${rawLine.replace(/\r?\n/g, "\\n")}\n`;
//         fs.appendFile("serial_bad_packets.log", dump, () => {});
//       } catch (e) { /* ignore */ }
//     };

//     // If we have the expected CSV, proceed as before
//     if (parts.length === EXPECTED_PARTS) {
//       // 1. OTA Data
//       const ota_value = parseInt(parts[0]);
//       const ota_voltage = parseFloat(parts[1]);

//       // 2. IMU Data
//       const accel_x = parseFloat(parts[2]);
//       const accel_y = parseFloat(parts[3]);
//       const accel_z = parseFloat(parts[4]);
//       const gyro_x = parseFloat(parts[5]);
//       const gyro_y = parseFloat(parts[6]);
//       const gyro_z = parseFloat(parts[7]);

//       // 3. BMP280 Data (Pressure/Temp)
//       const pressure = parseFloat(parts[8]);
//       const temp = parseFloat(parts[9]);

//       // 4. GPS Data
//       const lat = parseFloat(parts[10]);
//       const long = parseFloat(parts[11]);
//       const sats = parseInt(parts[12]);

//       // 5. Battery Data
//       const batt_voltage = parseFloat(parts[13]);
//       const batt_current = parseFloat(parts[14]);
//       const percentage = parseInt(parts[15]);

//       // 6. ESC Data
//       const esc1_rpm = parseInt(parts[16]);
//       const esc2_rpm = parseInt(parts[17]);
//       const esc3_rpm = parseInt(parts[18]);
//       const esc4_rpm = parseInt(parts[19]);


//       if (!isNaN(ota_value) && !isNaN(ota_voltage) && !isNaN(lat) && !isNaN(long)) {
//         try {
//           // --- Database Saving (Batch operations recommended in production) ---
//           await prisma.hw233Ota.create({ 
//             data: { 
//               ota_value, ota_voltage 
//             } });
//           await prisma.imu6050.create({ data: { accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z } });
//           await prisma.bmp280.create({ data: { pressure, temp } });
//           await prisma.gpsModule.create({ data: { lat, long, sats } });
//           await prisma.batteryStatus.create({ data: { voltage: batt_voltage, current: batt_current, percentage } });
//           await prisma.escData.create({ data: { esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm } });
//           io.emit("new_data", { 
//             // Core Status
//             serial_connected: isSerialConnected, 
            
//             // OTA
//             ota: ota_value, 
//             voltage: ota_voltage, // Using the OTA Voltage for the main display

//             // BMP280/Temp
//             temperature: temp, 
//             humidity: pressure, // Frontend uses humidity, but BMP data is pressure, we'll map pressure to the humidity slot for display consistency.
            
//             // Battery
//             battery: percentage,
//             batt_voltage: batt_voltage,
//             batt_current: batt_current,

//             // GPS
//             gps_lat: lat,
//             gps_lon: long,
//             gps_sats: sats,
//             // Time/Date must be derived or sent from Arduino, here we derive locally for GPS data accuracy display
//             gps_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
//             gps_date: new Date().toLocaleDateString('en-US'),
            
//             // IMU
//             accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,

//             // ESC
//             esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm,
//           });
//           // --------------------------------------------------------------------

//         } catch (dbError) {
//           console.error("Database error:", dbError.message);
//           io.emit("new_data", { 
//             // Send default error packet if DB fails, using placeholders for other required keys
//             serial_connected: isSerialConnected, 
//             ota: ota_value, voltage: ota_voltage, 
//             temperature: temp, humidity: 0, battery: 0,
//             gps_lat: lat, gps_lon: long, gps_time: '--', gps_date: '--'
//           });
//         }
//       } else {
//         console.log(`Invalid data types in serial packet. Data: ${line}`);
//       }
//     } else {
//       // Try a tolerant numeric extraction fallback: grab all floats/ints present
//       const numberRegex = /-?\d+(?:\.\d+)?/g;
//       const nums = rawLine.match(numberRegex) || [];

//       if (nums.length >= EXPECTED_PARTS) {
//         // Use the first EXPECTED_PARTS numbers found
//         const partsFromNums = nums.slice(0, EXPECTED_PARTS);
//         console.log(`Recovered ${partsFromNums.length} numeric values from noisy packet.`);
//         // Replace parts with recovered numeric strings and continue processing
//         for (let i = 0; i < EXPECTED_PARTS; i++) parts[i] = partsFromNums[i];
//         // Now fall through to the same handling as the expected CSV branch
//         // (duplicate minimal parsing logic to avoid restructuring large block)
//         const ota_value = parseInt(parts[0]);
//         const ota_voltage = parseFloat(parts[1]);
//         const accel_x = parseFloat(parts[2]);
//         const accel_y = parseFloat(parts[3]);
//         const accel_z = parseFloat(parts[4]);
//         const gyro_x = parseFloat(parts[5]);
//         const gyro_y = parseFloat(parts[6]);
//         const gyro_z = parseFloat(parts[7]);
//         const pressure = parseFloat(parts[8]);
//         const temp = parseFloat(parts[9]);
//         const lat = parseFloat(parts[10]);
//         const long = parseFloat(parts[11]);
//         const sats = parseInt(parts[12]);
//         const batt_voltage = parseFloat(parts[13]);
//         const batt_current = parseFloat(parts[14]);
//         const percentage = parseInt(parts[15]);
//         const esc1_rpm = parseInt(parts[16]);
//         const esc2_rpm = parseInt(parts[17]);
//         const esc3_rpm = parseInt(parts[18]);
//         const esc4_rpm = parseInt(parts[19]);

//         try {
//           await prisma.hw233Ota.create({ data: { ota_value, ota_voltage } });
//           await prisma.imu6050.create({ data: { accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z } });
//           await prisma.bmp280.create({ data: { pressure, temp } });
//           await prisma.gpsModule.create({ data: { lat: lat, long: long, sats: sats } });
//           await prisma.batteryStatus.create({ data: { voltage: batt_voltage, current: batt_current, percentage } });
//           await prisma.escData.create({ data: { esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm } });
//           io.emit("new_data", {
//             serial_connected: isSerialConnected,
//             ota: ota_value,
//             voltage: ota_voltage,
//             temperature: temp,
//             humidity: pressure,
//             battery: percentage,
//             batt_voltage,
//             batt_current,
//             gps_lat: lat,
//             gps_lon: long,
//             gps_sats: sats,
//             gps_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
//             gps_date: new Date().toLocaleDateString('en-US'),
//             accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,
//             esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm,
//           });
//         } catch (dbError) {
//           console.error("Database error (recovered packet):", dbError.message);
//           io.emit("new_data", { serial_connected: isSerialConnected, ota: ota_value, voltage: ota_voltage });
//         }
//         return;
//       }
//       if (nums.length >= 2) {
//         const n = nums.map((s) => Number(s));
//         const telemetry = {
//           serial_connected: isSerialConnected,
//           ota: Number.isFinite(n[0]) ? n[0] : null,
//           voltage: Number.isFinite(n[1]) ? n[1] : null,
//           // optional fields if present
//           accel_x: Number.isFinite(n[2]) ? n[2] : null,
//           accel_y: Number.isFinite(n[3]) ? n[3] : null,
//           accel_z: Number.isFinite(n[4]) ? n[4] : null,
//           gyro_x: Number.isFinite(n[5]) ? n[5] : null,
//           gyro_y: Number.isFinite(n[6]) ? n[6] : null,
//           gyro_z: Number.isFinite(n[7]) ? n[7] : null,
//           pressure: Number.isFinite(n[8]) ? n[8] : null,
//           temperature: Number.isFinite(n[9]) ? n[9] : null,
//           gps_lat: Number.isFinite(n[10]) ? n[10] : null,
//           gps_lon: Number.isFinite(n[11]) ? n[11] : null,
//           gps_sats: Number.isFinite(n[12]) ? n[12] : null,
//           batt_voltage: Number.isFinite(n[13]) ? n[13] : null,
//           batt_current: Number.isFinite(n[14]) ? n[14] : null,
//           battery: Number.isFinite(n[15]) ? n[15] : null,
//           esc1_rpm: Number.isFinite(n[16]) ? n[16] : null,
//           esc2_rpm: Number.isFinite(n[17]) ? n[17] : null,
//           esc3_rpm: Number.isFinite(n[18]) ? n[18] : null,
//           esc4_rpm: Number.isFinite(n[19]) ? n[19] : null,
//         };

//         console.log(`Partial telemetry emitted (${n.length} numbers)`);
//         io.emit("new_data", telemetry);
//         // also save minimal ota record if present
//         try {
//           if (Number.isFinite(n[0])) {
//             await prisma.hw233Ota.create({ data: { ota_value: n[0], ota_voltage: Number.isFinite(n[1]) ? n[1] : 0 } });
//           }
//         } catch (e) {
//           console.error("DB save failed for partial packet:", e.message);
//         }
//         return;
//       }

//       // If we couldn't recover, dump the bad packet for offline analysis and log concise info
//       dumpBadPacket(`expected_${EXPECTED_PARTS}_got_${parts.length}`);
//       console.log(`Wrong format - Expected ${EXPECTED_PARTS} values, got ${parts.length}. Data (trimmed): ${rawLine.slice(0,200)}`);
//     }
//   });


  
// }
// module.exports = serialPort;
import { SerialPort, ReadlineParser } from "serialport";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

let isSerialConnected = false; 

export default function startSerial(io) {
  const prisma = new PrismaClient();

  // Toggle raw logging by setting env var: SERIAL_DEBUG_RAW=1
  const DEBUG_RAW = process.env.SERIAL_DEBUG_RAW === "1";
  const RAW_LOG_PATH = "serial_raw.log";

  prisma.$connect()
    .then(() => console.log("✅ Database connected!"))
    .catch((err) => {
      console.error("❌ Database connection failed:", err.message);
      process.exit(1);
    });

  const serialPort = new SerialPort({
    path: "/dev/cu.usbserial-A5069RR4",
    baudRate: 9600    
  });

  serialPort.on("open", () => {
    console.log("✅ Serial port opened successfully!");
    console.log("🔌 Listening to Arduino (Multi-Sensor Schema)...");
    isSerialConnected = true;
    io.emit("serial_status", { serial_connected: isSerialConnected });
  });

  serialPort.on("error", (err) => {
    console.error("Serial Port Error:", err.message);
    isSerialConnected = false;
    io.emit("serial_status", { serial_connected: isSerialConnected });
    if (err.message.includes("cannot open")) {
      console.error("⚠️  Port may be in use or device not connected");
       console.log("💡 Ensure Arduino is connected and uploading data.");
    }
  });

  serialPort.on("close", () => {
    console.log("⚠️  Serial port closed");
    isSerialConnected = false;
    io.emit("serial_status", { serial_connected: isSerialConnected });
  });

  const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

  // Also listen for raw chunks so we can inspect encoding/garbage when needed
  serialPort.on("data", (chunk) => {
    if (!DEBUG_RAW) return;
    try {
      const hex = Buffer.from(chunk).toString("hex");
      const now = new Date().toISOString();
      const entry = `${now} len=${chunk.length} hex=${hex}\n`;
      console.log("[SERIAL RAW]", entry);
      fs.appendFile(RAW_LOG_PATH, entry, (err) => { if (err) console.error("Write raw log failed:", err.message); });
    } catch (err) {
      console.error("Failed to log raw chunk:", err.message);
    }
  });

  parser.on("data", async (line) => {
    if (!isSerialConnected) return;

    const rawLine = typeof line === "string" ? line : String(line);
    const parts = rawLine.trim().split(",");
    const EXPECTED_PARTS = 20;

    // Helper to flush a bad packet to a file for offline analysis
    const dumpBadPacket = (reason) => {
      try {
        const dump = `${new Date().toISOString()} reason=${reason} len=${rawLine.length} data=${rawLine.replace(/\r?\n/g, "\\n")}\n`;
        fs.appendFile("serial_bad_packets.log", dump, () => {});
      } catch (e) { /* ignore */ }
    };

    // If we have the expected CSV, proceed as before
    if (parts.length === EXPECTED_PARTS) {
      // 1. OTA Data
      const ota_value = parseInt(parts[0]);
      const ota_voltage = parseFloat(parts[1]);

      // 2. IMU Data
      const accel_x = parseFloat(parts[2]);
      const accel_y = parseFloat(parts[3]);
      const accel_z = parseFloat(parts[4]);
      const gyro_x = parseFloat(parts[5]);
      const gyro_y = parseFloat(parts[6]);
      const gyro_z = parseFloat(parts[7]);

      // 3. BMP280 Data (Pressure/Temp)
      const pressure = parseFloat(parts[8]);
      const temp = parseFloat(parts[9]);

      // 4. GPS Data
      const lat = parseFloat(parts[10]);
      const long = parseFloat(parts[11]);
      const sats = parseInt(parts[12]);

      // 5. Battery Data
      const batt_voltage = parseFloat(parts[13]);
      const batt_current = parseFloat(parts[14]);
      const percentage = parseInt(parts[15]);

      // 6. ESC Data
      const esc1_rpm = parseInt(parts[16]);
      const esc2_rpm = parseInt(parts[17]);
      const esc3_rpm = parseInt(parts[18]);
      const esc4_rpm = parseInt(parts[19]);


      if (!isNaN(ota_value) && !isNaN(ota_voltage) && !isNaN(lat) && !isNaN(long)) {
        try {
          // --- Database Saving (Batch operations recommended in production) ---
          await prisma.hw233Ota.create({ 
            data: { 
              ota_value, ota_voltage 
            } });
          await prisma.imu6050.create({ data: { accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z } });
          await prisma.bmp280.create({ data: { pressure, temp } });
          await prisma.gpsModule.create({ data: { lat, long, sats } });
          await prisma.batteryStatus.create({ data: { voltage: batt_voltage, current: batt_current, percentage } });
          await prisma.escData.create({ data: { esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm } });
          io.emit("new_data", { 
            // Core Status
            serial_connected: isSerialConnected, 
            
            // OTA
            ota: ota_value, 
            voltage: ota_voltage, // Using the OTA Voltage for the main display

            // BMP280/Temp
            temperature: temp, 
            humidity: pressure, // Frontend uses humidity slot for Pressure data display (hPa)
            
            // Battery
            battery: percentage,
            batt_voltage: batt_voltage,
            batt_current: batt_current,

            // GPS
            gps_lat: lat,
            gps_lon: long,
            gps_sats: sats,
            // Time/Date must be derived or sent from Arduino, here we derive locally for GPS data accuracy display
            gps_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            gps_date: new Date().toLocaleDateString('en-US'),
            
            // IMU
            accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,

            // ESC
            esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm,
          });
          // --------------------------------------------------------------------

        } catch (dbError) {
          console.error("Database error:", dbError.message);
          io.emit("new_data", { 
            // Send default error packet if DB fails, using placeholders for other required keys
            serial_connected: isSerialConnected, 
            ota: ota_value, voltage: ota_voltage, 
            temperature: temp, humidity: 0, battery: 0,
            gps_lat: lat, gps_lon: long, gps_time: '--', gps_date: '--'
          });
        }
      } else {
        console.log(`Invalid data types in serial packet. Data: ${line}`);
      }
    } else {
      // Try a tolerant numeric extraction fallback: grab all floats/ints present
      const numberRegex = /-?\d+(?:\.\d+)?/g;
      const nums = rawLine.match(numberRegex) || [];

      if (nums.length >= EXPECTED_PARTS) {
        // Use the first EXPECTED_PARTS numbers found
        const partsFromNums = nums.slice(0, EXPECTED_PARTS);
        console.log(`Recovered ${partsFromNums.length} numeric values from noisy packet.`);
        // Replace parts with recovered numeric strings and continue processing
        for (let i = 0; i < EXPECTED_PARTS; i++) parts[i] = partsFromNums[i];
        // Now fall through to the same handling as the expected CSV branch
        // (duplicate minimal parsing logic to avoid restructuring large block)
        const ota_value = parseInt(parts[0]);
        const ota_voltage = parseFloat(parts[1]);
        const accel_x = parseFloat(parts[2]);
        const accel_y = parseFloat(parts[3]);
        const accel_z = parseFloat(parts[4]);
        const gyro_x = parseFloat(parts[5]);
        const gyro_y = parseFloat(parts[6]);
        const gyro_z = parseFloat(parts[7]);
        const pressure = parseFloat(parts[8]);
        const temp = parseFloat(parts[9]);
        const lat = parseFloat(parts[10]);
        const long = parseFloat(parts[11]);
        const sats = parseInt(parts[12]);
        const batt_voltage = parseFloat(parts[13]);
        const batt_current = parseFloat(parts[14]);
        const percentage = parseInt(parts[15]);
        const esc1_rpm = parseInt(parts[16]);
        const esc2_rpm = parseInt(parts[17]);
        const esc3_rpm = parseInt(parts[18]);
        const esc4_rpm = parseInt(parts[19]);

        try {
          await prisma.hw233Ota.create({ data: { ota_value, ota_voltage } });
          await prisma.imu6050.create({ data: { accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z } });
          await prisma.bmp280.create({ data: { pressure, temp } });
          await prisma.gpsModule.create({ data: { lat: lat, long: long, sats: sats } });
          await prisma.batteryStatus.create({ data: { voltage: batt_voltage, current: batt_current, percentage } });
          await prisma.escData.create({ data: { esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm } });
          io.emit("new_data", {
            serial_connected: isSerialConnected,
            ota: ota_value,
            voltage: ota_voltage,
            temperature: temp,
            humidity: pressure,
            battery: percentage,
            batt_voltage,
            batt_current,
            gps_lat: lat,
            gps_lon: long,
            gps_sats: sats,
            gps_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            gps_date: new Date().toLocaleDateString('en-US'),
            accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z,
            esc1_rpm, esc2_rpm, esc3_rpm, esc4_rpm,
          });
        } catch (dbError) {
          console.error("Database error (recovered packet):", dbError.message);
          io.emit("new_data", { serial_connected: isSerialConnected, ota: ota_value, voltage: ota_voltage });
        }
        return;
      }
      if (nums.length >= 2) {
        const n = nums.map((s) => Number(s));
        const telemetry = {
          serial_connected: isSerialConnected,
          ota: Number.isFinite(n[0]) ? n[0] : null,
          voltage: Number.isFinite(n[1]) ? n[1] : null,
          // optional fields if present
          accel_x: Number.isFinite(n[2]) ? n[2] : null,
          accel_y: Number.isFinite(n[3]) ? n[3] : null,
          accel_z: Number.isFinite(n[4]) ? n[4] : null,
          gyro_x: Number.isFinite(n[5]) ? n[5] : null,
          gyro_y: Number.isFinite(n[6]) ? n[6] : null,
          gyro_z: Number.isFinite(n[7]) ? n[7] : null,
          pressure: Number.isFinite(n[8]) ? n[8] : null,
          temperature: Number.isFinite(n[9]) ? n[9] : null,
          gps_lat: Number.isFinite(n[10]) ? n[10] : null,
          gps_lon: Number.isFinite(n[11]) ? n[11] : null,
          gps_sats: Number.isFinite(n[12]) ? n[12] : null,
          batt_voltage: Number.isFinite(n[13]) ? n[13] : null,
          batt_current: Number.isFinite(n[14]) ? n[14] : null,
          battery: Number.isFinite(n[15]) ? n[15] : null,
          esc1_rpm: Number.isFinite(n[16]) ? n[16] : null,
          esc2_rpm: Number.isFinite(n[17]) ? n[17] : null,
          esc3_rpm: Number.isFinite(n[18]) ? n[18] : null,
          esc4_rpm: Number.isFinite(n[19]) ? n[19] : null,
        };

        console.log(`Partial telemetry emitted (${n.length} numbers)`);
        io.emit("new_data", telemetry);
        // also save minimal ota record if present
        try {
          if (Number.isFinite(n[0])) {
            await prisma.hw233Ota.create({ data: { ota_value: n[0], ota_voltage: Number.isFinite(n[1]) ? n[1] : 0 } });
          }
        } catch (e) {
          console.error("DB save failed for partial packet:", e.message);
        }
        return;
      }

      // If we couldn't recover, dump the bad packet for offline analysis and log concise info
      dumpBadPacket(`expected_${EXPECTED_PARTS}_got_${parts.length}`);
      console.log(`Wrong format - Expected ${EXPECTED_PARTS} values, got ${parts.length}. Data (trimmed): ${rawLine.slice(0,200)}`);
    }
  });


  
}