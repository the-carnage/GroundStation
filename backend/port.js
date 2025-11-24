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

// Perform initial scan only
export async function performInitialScan() {
  console.log('🔍 Performing initial port scan...');
  return await refreshPorts();
}

// Scan ports on demand (for manual button click)
export async function scanPortsOnDemand() {
  console.log('🔍 Manual port scan requested...');
  return await refreshPorts();
}

// Keep for backward compatibility but make it do nothing
export function startPortMonitor({ intervalMs = 5000, onUpdate } = {}) {
  console.log('⚠️  Continuous port monitoring disabled. Use manual scan instead.');
  return () => {};
}
