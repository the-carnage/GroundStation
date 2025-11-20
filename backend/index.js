// <!DOCTYPE html>
// <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <title>HW-233 OTA Live (Red Glow Edition)</title>
//     <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
//     <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
//     <style>
//       :root {
//         --bg-dark: #121212;
//         --card-dark: #1e1e1e;
//         --text-light: #ffffff;
//         --text-muted: #aaaaaa;
//         --glow-red: #ff004c;
//         --glow-red-light: #ff3377;
//         --chart-line-color: #ff004c;
//         --chart-fill-color: rgba(255, 0, 76, 0.15);
//         --success-green: #00e676;
//         --error-red: #ff3d00;
//         --border-color: #333333;
//         --input-bg: #2a2a2a;
//       }

//       body {
//         font-family: "Inter", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
//         background-color: var(--bg-dark);
//         color: var(--text-light);
//         margin: 0;
//         padding: 0;
//         min-height: 100vh;
//         display: flex;
//       }

//       .sidebar {
//         width: 250px;
//         background-color: var(--card-dark);
//         padding: 30px 20px;
//         box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
//         display: flex;
//         flex-direction: column;
//         gap: 20px;
//         border-right: 1px solid var(--border-color);
//       }

//       .logo {
//         font-size: 1.8rem;
//         font-weight: 700;
//         color: var(--glow-red);
//         text-align: center;
//         margin-bottom: 30px;
//         letter-spacing: 1px;
//       }

//       .nav-item {
//         display: flex;
//         align-items: center;
//         gap: 15px;
//         padding: 12px 15px;
//         border-radius: 8px;
//         color: var(--text-muted);
//         text-decoration: none;
//         font-size: 0.95rem;
//         transition: background-color 0.2s, color 0.2s, transform 0.2s;
//       }

//       .nav-item:hover,
//       .nav-item.active {
//         background-color: var(--glow-red);
//         color: var(--text-light);
//         transform: translateX(5px);
//         box-shadow: 0 0 10px rgba(255, 0, 76, 0.4);
//       }

//       .nav-item i {
//         font-size: 1.2rem;
//       }

//       .dashboard-layout {
//         flex-grow: 1;
//         display: grid;
//         grid-template-rows: auto 1fr;
//         grid-template-columns: 1fr;
//         gap: 20px;
//         padding: 30px;
//       }

//       .header-bar {
//         display: flex;
//         justify-content: space-between;
//         align-items: center;
//         background-color: var(--card-dark);
//         padding: 15px 30px;
//         border-radius: 12px;
//         box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
//         border: 1px solid var(--border-color);
//       }

//       .header-left {
//         display: flex;
//         align-items: center;
//         gap: 20px;
//       }

//       .search-bar {
//         position: relative;
//         display: flex;
//         align-items: center;
//       }

//       .search-bar input {
//         background-color: var(--input-bg);
//         border: 1px solid var(--border-color);
//         border-radius: 8px;
//         padding: 10px 15px 10px 40px;
//         color: var(--text-light);
//         font-size: 0.9rem;
//         outline: none;
//         width: 250px;
//       }

//       .search-bar input::placeholder {
//         color: var(--text-muted);
//       }

//       .search-bar i {
//         position: absolute;
//         left: 15px;
//         color: var(--text-muted);
//       }

//       .weather-info {
//         display: flex;
//         align-items: center;
//         gap: 10px;
//         font-size: 0.9rem;
//         color: var(--text-muted);
//       }

//       .header-right {
//         display: flex;
//         align-items: center;
//         gap: 20px;
//       }

//       .user-profile {
//         display: flex;
//         align-items: center;
//         gap: 10px;
//         color: var(--text-light);
//       }

//       .user-profile img {
//         width: 40px;
//         height: 40px;
//         border-radius: 50%;
//         border: 2px solid var(--glow-red);
//       }

//       .main-grid {
//         /* CHANGED: Single column stacking layout */
//         display: flex;
//         flex-direction: column; 
//         gap: 20px;
//       }

//       .overview-card,
//       .sensor-card,
//       .chart-card,
//       .info-card {
//         background-color: var(--card-dark);
//         border-radius: 12px;
//         padding: 20px;
//         box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
//         border: 1px solid var(--border-color);
//         display: flex;
//         flex-direction: column;
//         overflow: hidden;
//       }

//       .sensor-grid {
//         /* CHANGED: Now spans full width and uses grid for inner layout */
//         display: grid;
//         grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
//         gap: 20px;
//       }
      
//       .sensor-group {
//           background-color: var(--card-dark);
//           padding: 20px;
//           border-radius: 12px;
//           border: 1px solid var(--border-color);
//           box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
//       }

//       .sensor-group h2 {
//           font-size: 1.1rem;
//           color: var(--glow-red-light);
//           margin: 0 0 15px 0;
//           padding-bottom: 5px;
//           border-bottom: 1px solid var(--input-bg);
//       }

//       .sensor-group .sensor-value-item {
//           background-color: var(--input-bg);
//           margin-bottom: 10px;
//           padding: 12px 15px;
//       }

//       .sensor-group .sensor-value-item:last-child {
//           margin-bottom: 0;
//       }

//       .current-values-section {
//         grid-column: 1 / 2;
//         display: grid;
//         grid-template-columns: repeat(3, 1fr);
//         gap: 20px;
//       }

//       .status-card {
//         padding: 15px 20px;
//         background-color: var(--input-bg);
//         border-radius: 10px;
//         text-align: left;
//         border: 1px solid var(--border-color);
//         display: flex;
//         flex-direction: column;
//         justify-content: space-between;
//       }
//       .status-card .label {
//         color: var(--text-muted);
//         font-size: 0.85rem;
//         margin-bottom: 5px;
//       }
//       .status-card .value {
//         font-size: 1.5rem;
//         font-weight: 600;
//         color: var(--glow-red-light);
//       }
//       .status-card .unit {
//         font-size: 0.9rem;
//         color: var(--text-muted);
//       }

//       .status-indicator {
//         font-size: 0.8rem;
//         padding: 4px 10px;
//         border-radius: 20px;
//         display: inline-block;
//         margin-top: 10px;
//       }
//       .status-indicator.connected {
//         background-color: var(--success-green);
//         color: var(--bg-dark);
//       }
//       .status-indicator.disconnected {
//         background-color: var(--error-red);
//         color: var(--text-light);
//       }

//       .map-card {
//         padding: 0;
//         grid-column: unset;
//         grid-row: unset;
//       }

//       .map-image {
//         width: 100%;
//         height: 350px;
//         object-fit: cover;
//         border-top-left-radius: 12px;
//         border-top-right-radius: 12px;
//       }

//       .map-details {
//         padding: 20px;
//         display: grid;
//         grid-template-columns: repeat(3, 1fr);
//         gap: 15px;
//         background-color: var(--card-dark);
//         border-bottom-left-radius: 12px;
//         border-bottom-right-radius: 12px;
//       }
//       .map-detail-item {
//         text-align: left;
//       }
//       .map-detail-item .label {
//         font-size: 0.8rem;
//         color: var(--text-muted);
//         margin-bottom: 5px;
//       }
//       .map-detail-item .value {
//         font-size: 1.1rem;
//         font-weight: 500;
//         color: var(--text-light);
//       }
//       .map-detail-item:last-child {
//         text-align: right;
//       }
//       .map-detail-item .value.health-good {
//         color: var(--success-green);
//       }

//       .chart-section {
//         grid-column: unset;
//         background-color: var(--card-dark);
//         border-radius: 12px;
//         padding: 20px;
//         border: 1px solid var(--border-color);
//         display: flex;
//         flex-direction: column;
//       }

//       .chart-header {
//         display: flex;
//         justify-content: space-between;
//         align-items: center;
//         margin-bottom: 15px;
//         border-bottom: 1px solid var(--border-color);
//         padding-bottom: 10px;
//       }
//       .chart-header h3 {
//         margin: 0;
//         color: var(--glow-red);
//         font-size: 1.2rem;
//       }
//       .chart-controls {
//         display: flex;
//         gap: 10px;
//         align-items: center;
//       }
//       .chart-controls label {
//         color: var(--text-muted);
//         font-size: 0.85rem;
//       }
//       .chart-controls select,
//       .chart-controls button {
//         background-color: var(--input-bg);
//         border: 1px solid var(--border-color);
//         border-radius: 6px;
//         color: var(--text-light);
//         padding: 8px 12px;
//         font-size: 0.85rem;
//         cursor: pointer;
//         outline: none;
//         transition: border-color 0.2s;
//       }
//       .chart-controls select:focus,
//       .chart-controls button:hover {
//         border-color: var(--glow-red-light);
//       }
//       .chart-controls button {
//         background-color: var(--glow-red);
//         border-color: var(--glow-red);
//         box-shadow: 0 0 8px rgba(255, 0, 76, 0.4);
//       }
//       .chart-controls button:hover {
//         background-color: var(--glow-red-light);
//         border-color: var(--glow-red-light);
//       }

//       .chart-area {
//         position: relative;
//         flex-grow: 1;
//         height: 350px;
//         margin-top: 15px;
//       }
//       canvas {
//         background-color: transparent;
//         border-radius: 8px;
//       }

//       .sensor-value-item {
//         background-color: var(--input-bg);
//         padding: 15px 20px;
//         border-radius: 10px;
//         text-align: left;
//         border: 1px solid var(--border-color);
//       }
//       .sensor-value-item .label {
//         color: var(--text-muted);
//         font-size: 0.85rem;
//         margin-bottom: 5px;
//       }
//       .sensor-value-item .value {
//         font-size: 1.6rem;
//         font-weight: 600;
//         color: var(--glow-red-light);
//       }
//       .sensor-value-item .unit {
//         font-size: 1rem;
//         color: var(--text-muted);
//         margin-left: 5px;
//       }

//       .info-panel {
//         font-size: 0.85rem;
//         color: var(--text-muted);
//         margin-top: 15px;
//         text-align: center;
//       }
//       .info-panel strong {
//         color: var(--text-light);
//       }

//       @import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css");
//       @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
//     </style>
//   </head>
//   <body>
//     <aside class="sidebar">
//       <div class="logo">Ground Station</div>
//       <nav>
//         <a href="#" class="nav-item active"
//           ><i class="fas fa-home"></i> Dashboard</a
//         >
//         <a href="#" class="nav-item"><i class="fas fa-leaf"></i> My Fields</a>
//         <a href="#" class="nav-item"><i class="fas fa-tasks"></i> Tasks</a>
//         <a href="#" class="nav-item"
//           ><i class="fas fa-edit"></i> CRS/PM Modification</a
//         >
//         <a href="#" class="nav-item"
//           ><i class="fas fa-chart-line"></i> Reports</a
//         >
//         <a href="#" class="nav-item"><i class="fas fa-cogs"></i> Automation</a>
//         <a href="#" class="nav-item"
//           ><i class="fas fa-store"></i> Marketplace</a
//         >
//         <a href="#" class="nav-item"><i class="fas fa-users"></i> Community</a>
//       </nav>
//     </aside>

//     <div class="dashboard-layout">
//       <header class="header-bar">
//         <div class="header-left">
//           <div class="weather-info">
//             <i class="fas fa-cloud-sun"></i> 25° Today is partly sunny day!
//           </div>
//           <div class="search-bar">
//             <i class="fas fa-search"></i>
//             <input type="text" placeholder="Search" />
//           </div>
//         </div>
//         <div class="header-right">
//           <div class="user-profile">
//             <img src="https://via.placeholder.com/40" alt="User" />
//             <span>Hi John Doe</span>
//             <i class="fas fa-chevron-down"></i>
//           </div>
//         </div>
//       </header>

//       <main class="main-grid">
//         <div class="map-card">
//           <div id="googleMap" class="map-image"></div>

//           <div class="map-details">
//             <div class="map-detail-item">
//               <div class="label">Latitude</div>
//               <div class="value" id="gpsLatitude">--</div>
//             </div>
//             <div class="map-detail-item">
//               <div class="label">Longitude</div>
//               <div class="value" id="gpsLongitude">--</div>
//             </div>
//             <div class="map-detail-item">
//               <div class="label">Time (UTC)</div>
//               <div class="value health-good" id="gpsTime">--</div>
//             </div>
//             <div class="map-detail-item">
//               <div class="label">Date</div>
//               <div class="value" id="gpsDate">--</div>
//             </div>
//             <div class="map-detail-item">
//               <div class="label">Altitude</div>
//               <div class="value" id="gpsAltitude">
//                 --<span class="unit">m</span>
//               </div>
//             </div>
//             <div class="map-detail-item">
//               <div class="label">Speed</div>
//               <div class="value" id="gpsSpeed">
//                 --<span class="unit">km/h</span>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div class="chart-section">
//           <div class="chart-header">
//             <h3>Real-time Data Stream</h3>
//             <div class="chart-controls">
//               <label for="chartDataWindow">Show Last:</label>
//               <select id="chartDataWindow">
//                 <option value="10">10 Pts</option>
//                 <option value="30" selected>30 Pts</option>
//                 <option value="60">60 Pts</option>
//                 <option value="120">120 Pts</option>
//               </select>
//               <label for="serialPort">Port:</label>
//               <select id="serialPort" disabled>
//                 <option value="/dev/ttyUSB0">/dev/ttyUSB0</option>
//                 <option value="COM3">COM3</option>
//               </select>
//               <label for="baudRate">Baud:</label>
//               <select id="baudRate" disabled>
//                 <option value="9600">9600</option>
//                 <option value="115200" selected>115200</option>
//               </select>
//               <button id="applySettings" disabled>Apply Settings</button>
//               <button onclick="saveDataAsCsv()">
//                 <i class="fas fa-download"></i> Export CSV
//               </button>
//             </div>
//           </div>
//           <div class="chart-area">
//             <canvas id="liveChart"></canvas>
//           </div>
//           <div class="info-panel">
//             Connection:
//             <span class="status-indicator disconnected" id="connectionStatus"
//               >Disconnected</span
//             >
//             &bull; Last Update:
//             <strong id="lastDataUpdate">Waiting...</strong> &bull; Total
//             Records: <strong id="totalDataRecords">0</strong>
//           </div>
//         </div>
//         <div class="sensor-grid">
//           <div class="sensor-group">
//               <h2>Power & Core</h2>
//               <div class="sensor-value-item">
//                   <div class="label">Primary Sensor (OTA)</div>
//                   <div class="value">
//                       <span id="primarySensorValue">--</span><span class="unit">units</span>
//                   </div>
//               </div>
//               <div class="sensor-value-item">
//                   <div class="label">Battery Voltage</div>
//                   <div class="value">
//                       <span id="systemVoltage">--</span><span class="unit">V</span>
//                   </div>
//               </div>
//               <div class="sensor-value-item">
//                   <div class="label">Battery Charge (%)</div>
//                   <div class="value">
//                       <span id="batteryCharge">--</span><span class="unit">%</span>
//                   </div>
//                   <div class="info-panel">
//                       Current: <span id="battCurrent">--</span> A
//                   </div>
//               </div>
//           </div>

//           <div class="sensor-group">
//               <h2>Environment & GPS</h2>
//               <div class="sensor-value-item">
//                   <div class="label">Air Temperature (BMP280)</div>
//                   <div class="value">
//                       <span id="temperatureValue">--</span><span class="unit">°C</span>
//                   </div>
//               </div>
//               <div class="sensor-value-item">
//                   <div class="label">Air Pressure (BMP280)</div>
//                   <div class="value">
//                       <span id="pressureValue">--</span><span class="unit">hPa</span>
//                   </div>
//               </div>
//               <div class="sensor-value-item">
//                   <div class="label">GPS Satellites</div>
//                   <div class="value">
//                       <span id="gpsSats">--</span><span class="unit">Sats</span>
//                   </div>
//               </div>
//           </div>

//           <div class="sensor-group">
//               <h2>Motion & Control</h2>
//               <div class="sensor-value-item">
//                   <div class="label">Accel X / Y / Z</div>
//                   <div class="value">
//                       <span id="accelX">--</span>/<span id="accelY">--</span>/<span id="accelZ">--</span>
//                   </div>
//               </div>
//               <div class="sensor-value-item">
//                   <div class="label">Gyro X (Yaw Rate)</div>
//                   <div class="value">
//                       <span id="gyroX">--</span><span class="unit">°/s</span>
//                   </div>
//               </div>
//               <div class="sensor-value-item">
//                   <div class="label">ESC RPM (1 & 2)</div>
//                   <div class="value">
//                       <span id="esc1Rpm">--</span>/<span id="esc2Rpm">--</span>
//                   </div>
//                   <div class="info-panel">
//                       ESC (3/4): <span id="esc3Rpm">--</span>/<span id="esc4Rpm">--</span>
//                   </div>
//               </div>
//           </div>
//         </div>
//       </main>
//     </div>

//     <script
//       async
//       defer
//       src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"
//     ></script>

//     <script>
//       const dataStreamSocket = io();

//       const connectionStatusDisplay = document.getElementById("connectionStatus");
//       const lastDataUpdateDisplay = document.getElementById("lastDataUpdate");
//       const totalDataRecordsDisplay = document.getElementById("totalDataRecords");

//       const primarySensorDisplay = document.getElementById("primarySensorValue");
//       const systemVoltageDisplay = document.getElementById("systemVoltage");
//       const temperatureDisplay = document.getElementById("temperatureValue");
//       // REMOVED: const humidityDisplay = document.getElementById("humidityValue"); // No dedicated humidity field in UI
//       const batteryChargeDisplay = document.getElementById("batteryCharge");
      
//       const pressureDisplay = document.getElementById("pressureValue"); // Used for Pressure (BMP280 data)
//       const battCurrentDisplay = document.getElementById("battCurrent");
//       const gpsSatsDisplay = document.getElementById("gpsSats");

//       const accelXDisplay = document.getElementById("accelX");
//       const accelYDisplay = document.getElementById("accelY");
//       const accelZDisplay = document.getElementById("accelZ");
//       const gyroXDisplay = document.getElementById("gyroX");
//       const esc1RpmDisplay = document.getElementById("esc1Rpm");
//       const esc2RpmDisplay = document.getElementById("esc2Rpm");
//       const esc3RpmDisplay = document.getElementById("esc3Rpm");
//       const esc4RpmDisplay = document.getElementById("esc4Rpm");

//       const gpsLatitudeDisplay = document.getElementById("gpsLatitude");
//       const gpsLongitudeDisplay = document.getElementById("gpsLongitude");
//       const gpsTimeDisplay = document.getElementById("gpsTime");
//       const gpsDateDisplay = document.getElementById("gpsDate");
//       const gpsAltitudeDisplay = document.getElementById("gpsAltitude");
//       const gpsSpeedDisplay = document.getElementById("gpsSpeed");

//       const chartDataWindowSelect = document.getElementById("chartDataWindow");

//       const serialPortSelect = document.getElementById("serialPort");
//       const baudRateSelect = document.getElementById("baudRate");
//       const applySettingsButton = document.getElementById("applySettings");

//       let dataPointCounter = 0;
//       let liveChartInstance = null;
//       let fullHistoricalData = [];
//       let maxChartDataPoints = parseInt(chartDataWindowSelect.value);

//       let map;
//       let marker;
//       const defaultCenter = { lat: 0, lng: 0 };

//       function var_to_js(cssVar) {
//         return getComputedStyle(document.documentElement).getPropertyValue(
//           cssVar
//         );
//       }

//       window.initMap = function () {
//         const mapElement = document.getElementById("googleMap");
//         if (!mapElement) return;

//         map = new google.maps.Map(mapElement, {
//           zoom: 15,
//           center: defaultCenter,
//           mapId: "8097b6a655af4e91",
//           disableDefaultUI: true,
//           gestureHandling: "cooperative",
//         });

//         marker = new google.maps.Marker({
//           position: defaultCenter,
//           map: map,
//           title: "Device Location",
//           icon: {
//             path: google.maps.SymbolPath.CIRCLE,
//             fillColor: var_to_js("--glow-red"),
//             fillOpacity: 0.9,
//             strokeWeight: 0,
//             scale: 8,
//           },
//         });
//         console.log("Google Map Initialized.");
//       };

//       chartDataWindowSelect.addEventListener("change", (event) => {
//         maxChartDataPoints = parseInt(event.target.value);
//         updateChartDisplay();
//       });

//       dataStreamSocket.on("connect", () => {
//         serialPortSelect.disabled = false;
//         baudRateSelect.disabled = false;
//         applySettingsButton.disabled = false;

//         if (!connectionStatusDisplay.textContent.includes("Arduino")) {
//           connectionStatusDisplay.textContent = "Server Connected";
//           connectionStatusDisplay.className = "status-indicator connected";
//         }
//       });

//       dataStreamSocket.on("disconnect", () => {
//         connectionStatusDisplay.textContent = "Disconnected";
//         connectionStatusDisplay.className = "status-indicator disconnected";
//         serialPortSelect.disabled = true;
//         baudRateSelect.disabled = true;
//         applySettingsButton.disabled = true;
//       });

//       dataStreamSocket.on("serial_status", (status) => {
//         if (status.serial_connected === true) {
//           connectionStatusDisplay.textContent = "Arduino Connected";
//           connectionStatusDisplay.className = "status-indicator connected";
//         } else {
//           connectionStatusDisplay.textContent = "Serial Port Error";
//           connectionStatusDisplay.className = "status-indicator disconnected";
//         }
//       });


//       window.addEventListener("DOMContentLoaded", function () {
//         const chartCanvas = document.getElementById("liveChart");
//         if (!chartCanvas) return;

//         Chart.defaults.color = "#ffffff";
//         Chart.defaults.borderColor = "#333333";

//         liveChartInstance = new Chart(chartCanvas.getContext("2d"), {
//           type: "line",
//           data: {
//             labels: [],
//             datasets: [
//               {
//                 label: "Primary Sensor (OTA Value)",
//                 data: [],
//                 borderColor: var_to_js("--chart-line-color"),
//                 backgroundColor: var_to_js("--chart-fill-color"),
//                 borderWidth: 3,
//                 fill: true,
//                 tension: 0.4,
//                 pointRadius: 4,
//                 pointHoverRadius: 6,
//                 pointBackgroundColor: var_to_js("--chart-line-color"),
//                 pointBorderColor: "#fff",
//                 pointBorderWidth: 2,
//                 stepped: false,
//               },
//             ],
//           },
//           options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             animation: {
//               duration: 0,
//             },
//             plugins: {
//               legend: {
//                 display: true,
//                 position: "top",
//                 labels: {
//                   color: var_to_js("--text-light"),
//                 },
//               },
//               tooltip: {
//                 mode: "index",
//                 intersect: false,
//                 backgroundColor: var_to_js("--bg-dark"),
//                 titleColor: var_to_js("--glow-red"),
//                 bodyColor: var_to_js("--text-light"),
//                 borderColor: var_to_js("--border-color"),
//                 borderWidth: 1,
//               },
//             },
//             scales: {
//               x: {
//                 title: {
//                   display: true,
//                   text: "Time",
//                   color: var_to_js("--text-light"),
//                 },
//                 ticks: {
//                   maxRotation: 45,
//                   minRotation: 0,
//                   color: var_to_js("--text-muted"),
//                 },
//                 grid: { color: var_to_js("--border-color") },
//               },
//               y: {
//                 beginAtZero: false,
//                 min: 0,
//                 max: 1023,
//                 title: {
//                   display: true,
//                   text: "Sensor Value (0-1023)",
//                   color: var_to_js("--text-light"),
//                 },
//                 ticks: { color: var_to_js("--text-muted") },
//                 grid: { color: var_to_js("--border-color") },
//               },
//             },
//           },
//         });
//       });

//       dataStreamSocket.on("new_data", (receivedData) => {
//         if (!liveChartInstance) return;

//         const currentTime = new Date().toLocaleTimeString();
//         dataPointCounter++;

//         primarySensorDisplay.textContent = receivedData.ota || "--";
//         systemVoltageDisplay.textContent = receivedData.voltage
//           ? receivedData.voltage.toFixed(2)
//           : "--";
//         temperatureDisplay.textContent = receivedData.temperature
//           ? receivedData.temperature.toFixed(1)
//           : "--";
//         // NOTE: receivedData.humidity is mapped to 'pressure' value in serialmonitor.js
//         pressureDisplay.textContent = receivedData.humidity 
//             ? receivedData.humidity.toFixed(1) 
//             : "--";
//         batteryChargeDisplay.textContent = receivedData.battery || "--";
//         battCurrentDisplay.textContent = receivedData.batt_current
//             ? receivedData.batt_current.toFixed(2)
//             : "--";
//         gpsSatsDisplay.textContent = receivedData.gps_sats || "--";

//         accelXDisplay.textContent = receivedData.accel_x
//           ? receivedData.accel_x.toFixed(2)
//           : "--";
//         accelYDisplay.textContent = receivedData.accel_y
//           ? receivedData.accel_y.toFixed(2)
//           : "--";
//         accelZDisplay.textContent = receivedData.accel_z
//           ? receivedData.accel_z.toFixed(2)
//           : "--";
//         gyroXDisplay.textContent = receivedData.gyro_x
//           ? receivedData.gyro_x.toFixed(2)
//           : "--";

//         esc1RpmDisplay.textContent = receivedData.esc1_rpm || "--";
//         esc2RpmDisplay.textContent = receivedData.esc2_rpm || "--";
//         esc3RpmDisplay.textContent = receivedData.esc3_rpm || "--";
//         esc4RpmDisplay.textContent = receivedData.esc4_rpm || "--";

//         lastDataUpdateDisplay.textContent = currentTime;
//         totalDataRecordsDisplay.textContent = dataPointCounter;

//         if (map && receivedData.gps_lat && receivedData.gps_lon) {
//           const newPosition = {
//             lat: Number(receivedData.gps_lat),
//             lng: Number(receivedData.gps_lon),
//           };

//           marker.setPosition(newPosition);
//           map.panTo(newPosition);

//           gpsLatitudeDisplay.textContent = receivedData.gps_lat.toFixed(5);
//           gpsLongitudeDisplay.textContent = receivedData.gps_lon.toFixed(5);
//           // NOTE: gps_time and gps_date are derived locally in serialmonitor.js
//           gpsTimeDisplay.textContent = receivedData.gps_time || "--";
//           gpsDateDisplay.textContent = receivedData.gps_date || "--";
//           gpsAltitudeDisplay.textContent = receivedData.gps_alt
//             ? receivedData.gps_alt.toFixed(1)
//             : "--";
//           gpsSpeedDisplay.textContent = receivedData.gps_speed
//             ? receivedData.gps_speed.toFixed(1)
//             : "--";
//         } else if (map) {
//           gpsLatitudeDisplay.textContent = "--";
//           gpsLongitudeDisplay.textContent = "--";
//           gpsTimeDisplay.textContent = "--";
//           gpsDateDisplay.textContent = "--";
//           gpsAltitudeDisplay.textContent = "--";
//           gpsSpeedDisplay.textContent = "--";
//         }

//         fullHistoricalData.push({
//           timestamp: new Date().toISOString(),
//           ota: receivedData.ota,
//           voltage: receivedData.voltage,
//           temperature: receivedData.temperature,
//           // NOTE: Using 'pressure' to save the BMP280 data, as it's correctly named in the CSV/DB.
//           pressure: receivedData.humidity, 
//           battery: receivedData.battery,
//           gps_sats: receivedData.gps_sats,
//           gps_lat: receivedData.gps_lat,
//           gps_lon: receivedData.gps_lon,
//           gps_time: receivedData.gps_time,
//           gps_date: receivedData.gps_date,
//           gps_alt: receivedData.gps_alt,
//           gps_speed: receivedData.gps_speed,
//           accel_x: receivedData.accel_x,
//           accel_y: receivedData.accel_y,
//           accel_z: receivedData.accel_z,
//           gyro_x: receivedData.gyro_x,
//           gyro_y: receivedData.gyro_y,
//           gyro_z: receivedData.gyro_z,
//           batt_current: receivedData.batt_current,
//           esc1_rpm: receivedData.esc1_rpm,
//           esc2_rpm: receivedData.esc2_rpm,
//           esc3_rpm: receivedData.esc3_rpm,
//           esc4_rpm: receivedData.esc4_rpm,
//         });

//         updateChartDisplay();
//       });

//       function updateChartDisplay() {
//         if (!liveChartInstance) return;

//         const displayedData = fullHistoricalData.slice(-maxChartDataPoints);

//         liveChartInstance.data.labels = displayedData.map((item) =>
//           new Date(item.timestamp).toLocaleTimeString()
//         );
//         // THIS IS THE CORE CHART UPDATE: Uses the 'ota' value from the received packet
//         liveChartInstance.data.datasets[0].data = displayedData.map((item) =>
//           Number(item.ota)
//         );

//         liveChartInstance.update("none");
//       }

//       function saveDataAsCsv() {
//         if (fullHistoricalData.length === 0) {
//           alert("No data collected yet to export!");
//           return;
//         }

//         const headers = [
//           "Timestamp",
//           "OTA_Value",
//           "Voltage_V",
//           "Temperature_C",
//           "Pressure_hPa", // Corrected header for CSV
//           "Battery_Pct",
//           "Battery_Current_A",
//           "GPS_Satellites",
//           "GPS_Lat",
//           "GPS_Lon",
//           "GPS_Time",
//           "GPS_Date",
//           "GPS_Altitude_m",
//           "GPS_Speed_kmh",
//           "Accel_X",
//           "Accel_Y",
//           "Accel_Z",
//           "Gyro_X",
//           "Gyro_Y",
//           "Gyro_Z",
//           "ESC1_RPM",
//           "ESC2_RPM",
//           "ESC3_RPM",
//           "ESC4_RPM",
//         ];
//         const csvRows = [];

//         csvRows.push(headers.join(","));

//         fullHistoricalData.forEach((row) => {
//           const values = [
//             row.timestamp,
//             row.ota,
//             row.voltage,
//             row.temperature,
//             row.pressure, // This field holds the pressure value sent as 'humidity'
//             row.battery,
//             row.batt_current,
//             row.gps_sats,
//             row.gps_lat,
//             row.gps_lon,
//             row.gps_time,
//             row.gps_date,
//             row.gps_alt,
//             row.gps_speed,
//             row.accel_x,
//             row.accel_y,
//             row.accel_z,
//             row.gyro_x,
//             row.gyro_y,
//             row.gyro_z,
//             row.esc1_rpm,
//             row.esc2_rpm,
//             row.esc3_rpm,
//             row.esc4_rpm,
//           ];
//           csvRows.push(
//             values
//               .map((val) => (val === undefined || val === null ? "" : val))
//               .join(",")
//           );
//         });

//         const csvString = csvRows.join("\n");
//         const dataBlob = new Blob([csvString], {
//           type: "text/csv;charset=utf-8;",
//         });
//         const downloadLink = document.createElement("a");
//         const fileUrl = URL.createObjectURL(dataBlob);

//         downloadLink.setAttribute("href", fileUrl);
//         downloadLink.setAttribute(
//           "download",
//           `HW-233_Data_Export_${new Date()
//             .toISOString()
//             .replace(/:/g, "-")}.csv`
//         );
//         document.body.appendChild(downloadLink);
//         downloadLink.click();
//         document.body.removeChild(downloadLink);
//         alert(
//           `Successfully exported ${fullHistoricalData.length} records to CSV!`
//         );
//       }
//       window.saveDataAsCsv = saveDataAsCsv;

//       applySettingsButton.addEventListener("click", () => {
//         const port = serialPortSelect.value;
//         const baud = baudRateSelect.value;

//         dataStreamSocket.emit("change_serial_settings", { port, baud });
//         alert(
//           `Requesting server to change settings to Port: ${port}, Baud: ${baud}. Check your server console for status.`
//         );
//       });
//     </script>
//   </body>
// </html>
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

// Assuming the frontend files are in a folder named 'frontend' one level up
// app.use(express.static(path.join(__dirname, "../frontend"))); // original path
// Corrected to:
app.use(express.static(path.join(__dirname, '..', 'frontend')));

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

  // Build a full telemetry packet that matches frontend expectations
  const now = new Date();
  const telemetry = {
    ota: otaVal,
    voltage: voltageVal,
    temperature: 25 + (otaVal % 5),
    humidity: 1013 + (otaVal % 10), // mapped to pressure display in UI
    battery: Math.min(100, Math.max(0, Math.floor((voltageVal / 5) * 100))),
    batt_current: (voltageVal / 5).toFixed(2),
    gps_sats: Math.min(12, Math.max(0, Math.floor(otaVal / 80))),
    gps_lat: 37.7749 + (otaVal - 512) * 0.00001,
    gps_lon: -122.4194 + (otaVal - 512) * 0.00001,
    gps_time: now.toISOString().split('T')[1].split('.')[0],
    gps_date: now.toISOString().split('T')[0],
    gps_alt: (otaVal * 0.1).toFixed(2),
    gps_speed: (otaVal % 50).toFixed(1),
    accel_x: (Math.random() * 2 - 1).toFixed(2),
    accel_y: (Math.random() * 2 - 1).toFixed(2),
    accel_z: (Math.random() * 2 - 1).toFixed(2),
    gyro_x: (Math.random() * 10 - 5).toFixed(2),
    gyro_y: (Math.random() * 10 - 5).toFixed(2),
    gyro_z: (Math.random() * 10 - 5).toFixed(2),
    esc1_rpm: otaVal * 2,
    esc2_rpm: otaVal * 2 + 5,
    esc3_rpm: otaVal * 2 + 10,
    esc4_rpm: otaVal * 2 + 15,
  };

  io.emit("new_data", telemetry);
  console.log(`📊 Test telemetry emitted: OTA=${otaVal}, Voltage=${voltageVal.toFixed(2)}V`);
  res.json({ success: true, telemetry });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`📊 Frontend available at http://localhost:${PORT}`);
});