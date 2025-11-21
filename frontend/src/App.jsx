import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { 
  LayoutDashboard, 
  Sprout, 
  ClipboardList, 
  FileText, 
  Cpu, 
  Store, 
  Users, 
  Search, 
  MapPin, 
  AlertCircle,
  Activity,
  Settings
} from "lucide-react";

export default function GroundStation() {
  // Refs
  const chartRef = useRef(null);
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // State
  const [ports, setPorts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [lastUpdate, setLastUpdate] = useState("Waiting...");
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Data States
  const [telemetry, setTelemetry] = useState({
    ota: "--",
    voltage: "--",
    charge: "--",
    current: "--",
    temp: "--",
    pressure: "--",
    sats: "--",
    lat: "--",
    lon: "--",
    alt: "--",
    date: "--",
    time: "--"
  });

  // Chart Data Buffer
  const [dataPoints, setDataPoints] = useState(Array(50).fill(null)); // null for empty startup

  // --------------------------
  // SOCKET / DATA SIMULATION
  // --------------------------
  useEffect(() => {
    if (typeof window.io !== 'undefined') {
      // Real Socket Connection
      socketRef.current = window.io({ transports: ["websocket"] });
      const socket = socketRef.current;

      socket.on("connect", () => setConnectionStatus("Connected"));
      socket.on("disconnect", () => setConnectionStatus("Disconnected"));
      
      socket.on("telemetry_update", (data) => {
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString());
        setTotalRecords(prev => prev + 1);

        setTelemetry({
          ota: data.ota || "--",
          voltage: data.voltage?.toFixed(2) || "--",
          charge: data.battery || "--",
          current: data.batt_current?.toFixed(2) || "--",
          temp: data.temperature?.toFixed(1) || "--",
          pressure: data.humidity?.toFixed(1) || "--", // Assuming humidity/pressure field
          sats: data.gps_sats || "--",
          lat: data.gps_lat?.toFixed(5) || "--",
          lon: data.gps_lon?.toFixed(5) || "--",
          alt: data.gps_alt?.toFixed(1) || "--",
          date: data.gps_date || "--",
          time: data.gps_time || "--"
        });

        setDataPoints((prev) => {
          const newData = [...prev, data.ota || 0];
          if (newData.length > 100) newData.shift();
          return newData;
        });
      });

      return () => socket.disconnect();
    } else {
      // Simulation for Preview
      const interval = setInterval(() => {
        setConnectionStatus("Simulating...");
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString());
        setTotalRecords(prev => prev + 1);
        
        const val = 0; // change here
        
        setTelemetry(prev => ({
          ...prev,
          ota: val,
          voltage: "--", // change here
          charge: "--", // change here
          current: "--", // change here
          temp: "--", // change here
          pressure: "--", // change here
          sats: "--", // change here
          lat: "--", // change here
          lon: "--", // change here
          alt: "--", // change here
          date: "--", // change here
          time: now.toLocaleTimeString()
        }));

        setDataPoints((prev) => {
          const newData = [...prev, val];
          if (newData.length > 100) newData.shift();
          return newData;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // --------------------------
  // GOOGLE MAP INIT
  // --------------------------
  useEffect(() => {
    if (!window.google || !window.google.maps) return;
    
    const mapOptions = {
      zoom: 15,
      center: { lat: 0, lng: 0 },
      disableDefaultUI: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#212121" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
        { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#383838" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
      ]
    };

    mapRef.current = new window.google.maps.Map(document.getElementById("googleMap"), mapOptions);
  }, []);

  // --------------------------
  // CHART INIT
  // --------------------------
  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;

    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    
    chartInstanceRef.current = new window.Chart(chartRef.current, {
      type: "line",
      data: {
        labels: Array(100).fill(""),
        datasets: [{
          label: "Primary Sensor (OTA Value)",
          data: dataPoints,
          borderColor: "#ff0055", // Pink/Red color from screenshot
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: "#ccc", boxWidth: 10 }
          }
        },
        scales: {
          x: {
            grid: { color: "#333" },
            ticks: { display: false }
          },
          y: {
            grid: { color: "#333" },
            ticks: { color: "#666" },
            min: 0,
            max: 1200
          }
        },
        animation: { duration: 0 }
      }
    });
  }, []);

  // Update Chart
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    const chart = chartInstanceRef.current;
    chart.data.datasets[0].data = dataPoints;
    chart.update("none");
  }, [dataPoints]);

  return (
    <div className="gs-app">
      {/* ---------------- SIDEBAR ---------------- */}
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

      {/* ---------------- MAIN CONTENT ---------------- */}
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

          {/* ---------------- MAP SECTION ---------------- */}
          <div className="gs-map-card">
            <div className="gs-map-view">
              <div id="googleMap" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}></div>
            </div>

            <div className="gs-data-strip">
              <DataStripItem label="Latitude" value={telemetry.lat} />
              <DataStripItem label="Longitude" value={telemetry.lon} />
              <DataStripItem label="Date" value={telemetry.date} />
              <DataStripItem label="Altitude" value={telemetry.alt} unit="m" />
              <DataStripItem label="Time" value={telemetry.time} />
            </div>
          </div>

          {/* ---------------- CHART SECTION ---------------- */}
          <div className="gs-chart-card">
            <h2 className="gs-chart-title">Real-time Data Stream</h2>
            
            <div className="gs-chart-container">
              <canvas ref={chartRef} />
            </div>

            <div className="gs-chart-footer">
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span>Connection:</span>
                <span className={connectionStatus === 'Connected' ? 'gs-status-badge gs-status-connected' : 'gs-status-badge gs-status-disconnected'}>
                  {connectionStatus}
                </span>
              </div>
              <div>Last Update: <strong>{lastUpdate}</strong></div>
              <div>Total Records: <strong>{totalRecords}</strong></div>
            </div>
          </div>

          {/* ---------------- SENSOR GRIDS ---------------- */}
          <div className="gs-grid-layout">
            
            {/* Power & Core Column */}
            <div>
              <h3 className="gs-column-title">Power & Core</h3>
              <div className="gs-sensor-list">
                <SensorCard label="Primary Sensor (OTA)" value={telemetry.ota} unit="units" />
                <SensorCard label="Battery Voltage" value={telemetry.voltage} unit="V" />
                <SensorCard label="Battery Charge (%)" value={telemetry.charge} unit="%" subtext={`Current: ${telemetry.current} A`} />
              </div>
            </div>

            {/* Environment & GPS Column */}
            <div>
              <h3 className="gs-column-title">Environment & GPS</h3>
              <div className="gs-sensor-list">
                <SensorCard label="Air Temperature (BMP280)" value={telemetry.temp} unit="°C" />
                <SensorCard label="Air Pressure (BMP280)" value={telemetry.pressure} unit="hPa" />
                <SensorCard label="GPS Satellites" value={telemetry.sats} unit="Sats" />
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

// ---------------------------
// SUBCOMPONENTS
// ---------------------------

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