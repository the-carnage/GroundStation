import React, { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { Chart } from "chart.js/auto";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";
import { 
  Activity,
  Search, 
  AlertCircle,
  Download,
  FileSpreadsheet
} from "lucide-react";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map component to update center
function MapUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position[0] !== 0 && position[1] !== 0) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
}

export default function GroundStation() {
  const chartRef = useRef(null);
  const socketRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Serial Configuration
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedBaud, setSelectedBaud] = useState("9600");
  const [baudRates] = useState([9600, 19200, 38400, 57600, 115200]);
  
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  
  // Data State
  const [lastUpdate, setLastUpdate] = useState("--");
  const [totalRecords, setTotalRecords] = useState(0);
  const [timeFilter, setTimeFilter] = useState(0); // 0 = all, 10, 30, 60 minutes
  
  // Sensor Data
  const [sensorData, setSensorData] = useState({
    // OTA
    ota: { value: 0, voltage: 0 },
    // IMU
    imu: { accelX: 0, accelY: 0, accelZ: 0, gyroX: 0, gyroY: 0, gyroZ: 0 },
    // BMP280
    bmp: { pressure: 0, temperature: 0 },
    // GPS
    gps: { latitude: 0, longitude: 0, satellites: 0, time: "--", date: "--" },
    // Battery
    battery: { voltage: 0, current: 0, percentage: 0 },
    // ESC
    esc: { esc1Rpm: 0, esc2Rpm: 0, esc3Rpm: 0, esc4Rpm: 0 }
  });

  // Chart Data
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);

  // GPS Position for Map
  const [gpsPosition, setGpsPosition] = useState([37.7749, -122.4194]); // Default: San Francisco

  // ============================================
  // SOCKET.IO CONNECTION & REAL DATA
  // ============================================
  useEffect(() => {
    const socket = io("http://localhost:5001", {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
      setConnectionStatus("Connected");
      socket.emit("request_serial_ports");
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
      setConnectionStatus("Disconnected");
    });

    // Receive available serial ports
    socket.on("serial_port_list", (portList) => {
      console.log("📡 Received ports:", portList);
      setPorts(portList);
      if (portList.length > 0 && !selectedPort) {
        setSelectedPort(portList[0].path);
      }
    });

    // Receive serial port errors
    socket.on("serial_port_list_error", (error) => {
      console.error("❌ Port list error:", error);
    });

    // Receive serial status updates
    socket.on("serial_status", (status) => {
      console.log("🔌 Serial status:", status);
      if (status.serial_connected) {
        setConnectionStatus("Connected");
      } else {
        setConnectionStatus("Disconnected");
      }
    });

    // Receive baud rate updates
    socket.on("serial_baud", (data) => {
      console.log("📊 Baud rate:", data.baud);
      setSelectedBaud(data.baud.toString());
    });

    // **MAIN DATA STREAM - REAL SENSOR DATA**
    socket.on("telemetry_update", (data) => {
      console.log("📊 Telemetry update:", data);
      
      const now = new Date();
      setLastUpdate(now.toLocaleTimeString());
      setTotalRecords(prev => prev + 1);

      // Update all sensor data
      setSensorData({
        ota: {
          value: data.ota || 0,
          voltage: data.voltage || 0
        },
        imu: {
          accelX: data.accel_x || 0,
          accelY: data.accel_y || 0,
          accelZ: data.accel_z || 0,
          gyroX: data.gyro_x || 0,
          gyroY: data.gyro_y || 0,
          gyroZ: data.gyro_z || 0
        },
        bmp: {
          pressure: data.humidity || 0, // Backend maps pressure to humidity field
          temperature: data.temperature || 0
        },
        gps: {
          latitude: data.gps_lat || 0,
          longitude: data.gps_lon || 0,
          satellites: data.gps_sats || 0,
          time: data.gps_time || "--",
          date: data.gps_date || "--"
        },
        battery: {
          voltage: data.batt_voltage || 0,
          current: data.batt_current || 0,
          percentage: data.battery || 0
        },
        esc: {
          esc1Rpm: data.esc1_rpm || 0,
          esc2Rpm: data.esc2_rpm || 0,
          esc3Rpm: data.esc3_rpm || 0,
          esc4Rpm: data.esc4_rpm || 0
        }
      });

      // Update GPS position for map
      if (data.gps_lat && data.gps_lon) {
        setGpsPosition([data.gps_lat, data.gps_lon]);
      }

      // Update chart
      setChartData(prev => {
        const newData = [...prev, data.ota || 0];
        if (newData.length > 100) newData.shift();
        return newData;
      });
      
      setChartLabels(prev => {
        const newLabels = [...prev, now.toLocaleTimeString()];
        if (newLabels.length > 100) newLabels.shift();
        return newLabels;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedPort]);

  // ============================================
  // CHART.JS INITIALIZATION
  // ============================================
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [{
          label: "Primary Sensor (OTA Value)",
          data: chartData,
          borderColor: "#ff0055",
          backgroundColor: "rgba(255, 0, 85, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: "#9ca3af" }
          }
        },
        scales: {
          x: {
            ticks: { color: "#9ca3af", maxTicksLimit: 10 },
            grid: { color: "#222" }
          },
          y: {
            ticks: { color: "#9ca3af" },
            grid: { color: "#222" },
            beginAtZero: true,
            max: 1023
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartData, chartLabels]);

  // ============================================
  // SERIAL PORT CONTROL
  // ============================================
  const applySerialSettings = useCallback(() => {
    if (!socketRef.current || !selectedPort) {
      alert("Please select a port first");
      return;
    }

    console.log(`🔧 Applying settings: ${selectedPort} @ ${selectedBaud}`);
    socketRef.current.emit("change_serial_settings", {
      port: selectedPort,
      baud: parseInt(selectedBaud)
    });
  }, [selectedPort, selectedBaud]);

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================
  const exportCSV = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/export/csv?minutes=${timeFilter}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `telemetry_${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export CSV");
    }
  }, [timeFilter]);

  const exportXLSX = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/export/xlsx?minutes=${timeFilter}`);
      if (!response.ok) throw new Error("Export failed");
      
      const result = await response.json();
      const dataStr = JSON.stringify(result.data, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename.replace('.xlsx', '.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export XLSX");
    }
  }, [timeFilter]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="gs-app">
      {/* SIDEBAR */}
      <aside className="gs-sidebar">
        <div className="gs-sidebar-header">
          <div className="gs-logo">Ground<br />Station</div>
        </div>

        <nav className="gs-nav">
          <SidebarItem label="Dashboard" active />
          <SidebarItem label="My Fields" />
          <SidebarItem label="Tasks" />
          <SidebarItem label="CRS/PM Modification" />
          <SidebarItem label="Reports" />
          <SidebarItem label="Automation" />
          <SidebarItem label="Marketplace" />
          <SidebarItem label="Community" />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="gs-main">
        {/* HEADER */}
        <header className="gs-header">
          <div className="gs-search-wrapper">
            <span className="gs-weather-text">
              <Activity size={14} />
              25° Today is partly sunny day!
            </span>
            <div className="gs-divider"></div>
            <Search size={14} style={{color: '#6b7280'}} />
            <input 
              type="text" 
              placeholder="Search" 
              className="gs-search-input"
            />
          </div>
        </header>

        <div className="gs-content">
          {/* MAP SECTION */}
          <div className="gs-map-card">
            <div className="gs-map-view">
              <MapContainer 
                center={gpsPosition} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                  attribution='&copy; Google Maps'
                />
                <Marker position={gpsPosition} />
                <MapUpdater position={gpsPosition} />
              </MapContainer>
            </div>

            <div className="gs-data-strip">
              <DataStripItem label="Latitude" value={sensorData.gps.latitude.toFixed(5)} />
              <DataStripItem label="Longitude" value={sensorData.gps.longitude.toFixed(5)} />
              <DataStripItem label="Date" value={sensorData.gps.date} />
              <DataStripItem label="Time" value={sensorData.gps.time} />
              <DataStripItem label="Satellites" value={sensorData.gps.satellites} unit="sats" />
            </div>
          </div>

          {/* CHART SECTION WITH CONTROLS */}
          <div className="gs-chart-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h2 className="gs-chart-title">Real-time Data Stream</h2>
              
              <div style={{display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem'}}>
                <label style={{color: '#9ca3af'}}>Port:</label>
                <select 
                  value={selectedPort} 
                  onChange={(e) => setSelectedPort(e.target.value)}
                  style={{padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: '#1e1e1e', color: 'white', border: '1px solid #333'}}
                >
                  {ports.length === 0 ? (
                    <option>Scanning...</option>
                  ) : (
                    ports.map(port => (
                      <option key={port.path} value={port.path}>{port.path}</option>
                    ))
                  )}
                </select>

                <label style={{color: '#9ca3af'}}>Baud:</label>
                <select 
                  value={selectedBaud} 
                  onChange={(e) => setSelectedBaud(e.target.value)}
                  style={{padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: '#1e1e1e', color: 'white', border: '1px solid #333'}}
                >
                  {baudRates.map(baud => (
                    <option key={baud} value={baud}>{baud}</option>
                  ))}
                </select>

                <button 
                  onClick={applySerialSettings}
                  style={{padding: '0.25rem 0.75rem', borderRadius: '0.25rem', background: '#ff0055', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600'}}
                >
                  Apply
                </button>

                <label style={{color: '#9ca3af'}}>Filter:</label>
                <select 
                  value={timeFilter} 
                  onChange={(e) => setTimeFilter(parseInt(e.target.value))}
                  style={{padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: '#1e1e1e', color: 'white', border: '1px solid #333'}}
                >
                  <option value={0}>All Data</option>
                  <option value={10}>Last 10 min</option>
                  <option value={30}>Last 30 min</option>
                  <option value={60}>Last 60 min</option>
                </select>

                <button 
                  onClick={exportCSV}
                  style={{padding: '0.25rem 0.75rem', borderRadius: '0.25rem', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}
                >
                  <Download size={14} /> CSV
                </button>

                <button 
                  onClick={exportXLSX}
                  style={{padding: '0.25rem 0.75rem', borderRadius: '0.25rem', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}
                >
                  <FileSpreadsheet size={14} /> XLSX
                </button>
              </div>
            </div>
            
            <div className="gs-chart-container">
              <canvas ref={chartRef} />
            </div>

            <div className="gs-chart-footer">
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span>Connection:</span>
                <span className={isConnected ? 'gs-status-badge gs-status-connected' : 'gs-status-badge gs-status-disconnected'}>
                  {connectionStatus}
                </span>
              </div>
              <div>Last Update: <strong>{lastUpdate}</strong></div>
              <div>Total Records: <strong>{totalRecords}</strong></div>
            </div>
          </div>

          {/* SENSOR GRIDS */}
          <div className="gs-grid-layout">
            {/* Column 1: OTA & Battery */}
            <div>
              <h3 className="gs-column-title">Power & Core</h3>
              <div className="gs-sensor-list">
                <SensorCard label="OTA Value" value={sensorData.ota.value} unit="units" />
                <SensorCard label="OTA Voltage" value={sensorData.ota.voltage.toFixed(2)} unit="V" />
                <SensorCard label="Battery Voltage" value={sensorData.battery.voltage.toFixed(2)} unit="V" />
                <SensorCard label="Battery Current" value={sensorData.battery.current.toFixed(2)} unit="A" />
                <SensorCard label="Battery Charge" value={sensorData.battery.percentage} unit="%" />
              </div>
            </div>

            {/* Column 2: IMU & BMP */}
            <div>
              <h3 className="gs-column-title">Sensors</h3>
              <div className="gs-sensor-list">
                <SensorCard label="Accel X" value={sensorData.imu.accelX.toFixed(2)} unit="m/s²" />
                <SensorCard label="Accel Y" value={sensorData.imu.accelY.toFixed(2)} unit="m/s²" />
                <SensorCard label="Accel Z" value={sensorData.imu.accelZ.toFixed(2)} unit="m/s²" />
                <SensorCard label="Temperature (BMP280)" value={sensorData.bmp.temperature.toFixed(1)} unit="°C" />
                <SensorCard label="Pressure (BMP280)" value={sensorData.bmp.pressure.toFixed(1)} unit="hPa" />
              </div>
            </div>

            {/* Column 3: Gyro */}
            <div>
              <h3 className="gs-column-title">Gyroscope</h3>
              <div className="gs-sensor-list">
                <SensorCard label="Gyro X" value={sensorData.imu.gyroX.toFixed(2)} unit="°/s" />
                <SensorCard label="Gyro Y" value={sensorData.imu.gyroY.toFixed(2)} unit="°/s" />
                <SensorCard label="Gyro Z" value={sensorData.imu.gyroZ.toFixed(2)} unit="°/s" />
              </div>
            </div>

            {/* Column 4: ESC */}
            <div>
              <h3 className="gs-column-title">ESC Motors</h3>
              <div className="gs-sensor-list">
                <SensorCard label="ESC 1 RPM" value={sensorData.esc.esc1Rpm} unit="RPM" />
                <SensorCard label="ESC 2 RPM" value={sensorData.esc.esc2Rpm} unit="RPM" />
                <SensorCard label="ESC 3 RPM" value={sensorData.esc.esc3Rpm} unit="RPM" />
                <SensorCard label="ESC 4 RPM" value={sensorData.esc.esc4Rpm} unit="RPM" />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ============================================
// SUBCOMPONENTS
// ============================================

function SidebarItem({ label, active }) {
  return (
    <div className={`gs-nav-item ${active ? 'active' : ''}`}>
      {label}
    </div>
  );
}

function DataStripItem({ label, value, unit }) {
  return (
    <div className="gs-data-item">
      <span className="gs-data-label">{label}</span>
      <span className="gs-data-value">
        {value} {unit && <span className="gs-unit-accent">{unit}</span>}
      </span>
    </div>
  );
}

function SensorCard({ label, value, unit, subtext }) {
  return (
    <div className="gs-sensor-card">
      <div className="gs-sensor-label">{label}</div>
      <div className="gs-sensor-readout">
        <div className="gs-sensor-value">
          {value} <span className="gs-sensor-unit">{unit}</span>
        </div>
        {subtext && <div className="gs-sensor-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
