# Ground Station - Demo Data Generator

## Quick Start

**Terminal 1 - Run the Ground Station app:**
```bash
cd /Users/mehebubalom/Desktop/GroundStation/backend
npm run electron
```

**Terminal 2 - Run the demo generator:**
```bash
cd /Users/mehebubalom/Desktop/GroundStation/backend
node demo-generator.js
```

## Demo Modes

The demo generator supports 5 different data formats to showcase the app's flexibility:

### 1. Weather Station (JSON) - **Default**
```json
{
  "temperature": 23.37,
  "humidity": 63.77,
  "pressure": 1022.13,
  "windSpeed": 5.95,
  "rainfall": 1.78
}
```

### 2. Drone Telemetry (JSON)
```json
{
  "altitude": 45.23,
  "latitude": 37.775234,
  "longitude": -122.418967,
  "battery": 85,
  "heading": 127,
  "speed": 12.45,
  "satellites": 11
}
```

### 3. IoT Sensor (JSON)
```json
{
  "deviceId": "ESP32-001",
  "temp_c": 24.5,
  "light_lux": 650,
  "motion": true,
  "rssi": -67
}
```

### 4. Simple CSV (3 fields)
```csv
25.50,65.20,1015.30
```

### 5. Legacy Format (20-field CSV)
Compatible with the old hardcoded dashboard - 20 comma-separated values

## Interactive Commands

While the demo generator is running, you can use these keyboard commands:

### Switch Data Formats
- Press `1` - Weather Station
- Press `2` - Drone Telemetry
- Press `3` - IoT Sensor
- Press `4` - Simple CSV
- Press `5` - Legacy 20-field CSV

### Control Playback
- Press `s` - Start/Resume data generation
- Press `p` - Pause data generation
- Press `f` - Fast mode (100ms updates)
- Press `n` - Normal mode (1000ms updates)
- Press `w` - Slow mode (3000ms updates)

### Other Commands
- Press `h` or `?` - Show menu again
- Press `q` or `Ctrl+C` - Quit

## Testing the App

### Step 1: Start with Weather Station Data
1. Run the demo generator (it starts in Weather Station mode)
2. In the Ground Station app, switch to **Serial Monitor** tab
3. Watch JSON data stream in real-time
4. Check the **Schema** section to see detected fields

### Step 2: Configure Dashboard
1. Switch to **Configuration** tab
2. You should see 5 cards (temperature, humidity, pressure, windSpeed, rainfall)
3. Customize each:
   - Rename labels (e.g., "temperature" → "Ambient Temp")
   - Select widget type (Value Card or Line Graph)
   - Add units ("°C", "%", "hPa", "km/h", "mm")
4. Click **💾 Save Configuration**

### Step 3: View Live Dashboard
1. Switch to **Dashboard** tab
2. See your configured widgets with live data
3. Graphs update in real-time every second

### Step 4: Try Different Formats
1. Go back to Terminal 2 (demo generator)
2. Press `2` to switch to Drone Telemetry
3. Watch the app automatically detect new fields
4. Go to Configuration tab to see new keys
5. Configure the drone data widgets
6. View the new dashboard

## What to Observe

### ✨ Automatic Adaptation
- The app **automatically detects** whatever data structure you send
- No configuration needed - just send data!
- Works with JSON, CSV, or mixed formats

### 🎨 Schema Detection
- New keys appear immediately in the Configuration tab
- Auto-generated labels (e.g., "windSpeed" → "Wind Speed")
- Type inference (number, string, boolean)
- Smart color assignment based on data type

### 📊 Real-time Updates
- Serial Monitor shows raw data as it arrives
- Dashboard widgets update every second
- Graphs show trending data (last 20 points)
- Smooth animations without lag

### 🔄 Format Switching
- Switch between JSON and CSV on the fly
- App adapts without restart
- Previous configurations are preserved separately

## Tips

- **First Time**: Start with Weather Station (mode 1) to get familiar
- **Compare Formats**: Try switching between modes to see how the app adapts
- **Graph Performance**: Use Fast mode (press `f`) to see smooth 10Hz updates
- **Configuration**: Save different configs for different data formats
- **Legacy Mode**: Mode 5 tests backwards compatibility with old 20-field format

## Troubleshooting

**Demo generator won't start:**
- Make sure Ground Station app is running first
- Check that port 5001 is available

**No data appearing:**
- Press `s` to start the generator if paused
- Check the demo generator terminal for connection status

**Schema not updating:**
- Click the 🔄 Refresh button in Serial Monitor
- Or switch to Configuration tab to trigger update

## Example Workflow

```bash
# Terminal 1
cd backend
npm run electron

# Terminal 2 (wait for app to load)
cd backend
node demo-generator.js

# Press these keys in sequence:
# 1. Let it run for 10 seconds (Weather Station)
# 2. Press 'p' to pause
# 3. Go configure the dashboard in the app
# 4. Press 's' to resume
# 5. Watch the dashboard update
# 6. Press '2' to switch to Drone mode
# 7. Configure drone widgets
# 8. Press 'f' for fast updates
# 9. Enjoy the show! 🎉
```

Enjoy testing your flexible Ground Station! 🚀
