// test-data-generator.js - Generate test telemetry data for testing cache & export
import { addToCache, getCacheStats } from "./dataCache.js";

console.log("🧪 Generating test telemetry data...\n");

// Generate 100 test data points spanning last 15 minutes
const now = new Date();
const testDataPoints = 100;

for (let i = 0; i < testDataPoints; i++) {
  // Spread data across last 15 minutes
  const timestamp = new Date(now - (15 * 60 * 1000) * (1 - i / testDataPoints));
  
  // Generate realistic sensor values
  const ota = Math.floor(400 + Math.random() * 200);
  const voltage = 4.5 + Math.random() * 0.5;
  
  const accelX = (Math.random() - 0.5) * 2;
  const accelY = (Math.random() - 0.5) * 2;
  const accelZ = 9.8 + (Math.random() - 0.5) * 0.5;
  
  const gyroX = (Math.random() - 0.5) * 0.1;
  const gyroY = (Math.random() - 0.5) * 0.1;
  const gyroZ = (Math.random() - 0.5) * 0.1;
  
  const pressure = 1010 + Math.random() * 10;
  const temperature = 20 + Math.random() * 10;
  
  const latitude = 37.7749 + (Math.random() - 0.5) * 0.01;
  const longitude = -122.4194 + (Math.random() - 0.5) * 0.01;
  const satellites = Math.floor(6 + Math.random() * 6);
  
  const battVoltage = 11.5 + Math.random() * 1.5;
  const battCurrent = 1.5 + Math.random() * 1.0;
  const battPercentage = Math.floor(70 + Math.random() * 30);
  
  const esc1Rpm = Math.floor(1000 + Math.random() * 500);
  const esc2Rpm = Math.floor(1000 + Math.random() * 500);
  const esc3Rpm = Math.floor(1000 + Math.random() * 500);
  const esc4Rpm = Math.floor(1000 + Math.random() * 500);
  
  // Add to cache
  addToCache('ota', { value: ota, voltage, timestamp });
  addToCache('imu', { 
    accelX, accelY, accelZ, 
    gyroX, gyroY, gyroZ, 
    timestamp 
  });
  addToCache('bmp', { pressure, temperature, timestamp });
  addToCache('gps', { latitude, longitude, satellites, timestamp });
  addToCache('battery', { 
    voltage: battVoltage, 
    current: battCurrent, 
    percentage: battPercentage, 
    timestamp 
  });
  addToCache('esc', { 
    esc1Rpm, esc2Rpm, esc3Rpm, esc4Rpm, 
    timestamp 
  });
}

console.log("✅ Test data generation complete!\n");
console.log("📊 Cache Statistics:");
const stats = getCacheStats();
for (const [type, stat] of Object.entries(stats)) {
  if (stat.count > 0) {
    console.log(`  ${type}: ${stat.count} entries`);
    console.log(`    Oldest: ${stat.oldest}`);
    console.log(`    Newest: ${stat.newest}`);
  }
}

console.log("\n🧪 Test the export:");
console.log("  curl 'http://localhost:5001/api/export/csv?minutes=10' -o test.csv");
console.log("  curl 'http://localhost:5001/api/cache/stats'");
