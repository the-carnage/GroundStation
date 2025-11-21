import { SerialPort } from "serialport";

const state = {
  ports: [],
  error: null,
};

let monitorHandle = null;

async function refreshPorts() {
  try {
    const ports = await SerialPort.list();
    state.ports = ports;
    state.error = null;
    console.log(`📡 Found ${ports.length} serial port(s):`, ports.map(p => p.path).join(', ') || 'none');
  } catch (error) {
    console.error('❌ Serial port scan error:', error.message);
    state.ports = [];
    state.error = error;
  }
  return { ports: [...state.ports], error: state.error };
}

export function getPortSnapshot() {
  return { ports: [...state.ports], error: state.error };
}

export function startPortMonitor({ intervalMs = 5000, onUpdate } = {}) {
  if (monitorHandle) {
    return () => {
      clearInterval(monitorHandle);
      monitorHandle = null;
    };
  }

  const runner = async () => {
    const snapshot = await refreshPorts();
    if (typeof onUpdate === "function") {
      onUpdate(snapshot);
    }
  };

  runner();
  monitorHandle = setInterval(runner, intervalMs);

  return () => {
    clearInterval(monitorHandle);
    monitorHandle = null;
  };
}
