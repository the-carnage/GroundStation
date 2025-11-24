#!/usr/bin/env node

/**
 * Demo Data Generator for Ground Station
 * Simulates various serial data formats to test the flexible parser
 */

import io from 'socket.io-client';

const socket = io('http://localhost:5001');

// Demo data generators
const generators = {
    // JSON Format - Weather Station
    weatherStation: () => ({
        temperature: parseFloat((20 + Math.random() * 10).toFixed(2)),
        humidity: parseFloat((40 + Math.random() * 30).toFixed(2)),
        pressure: parseFloat((1000 + Math.random() * 50).toFixed(2)),
        windSpeed: parseFloat((Math.random() * 20).toFixed(2)),
        rainfall: parseFloat((Math.random() * 5).toFixed(2)),
    }),

    // JSON Format - Drone Telemetry
    droneTelemetry: () => ({
        altitude: parseFloat((Math.random() * 100).toFixed(2)),
        latitude: parseFloat((37.7749 + (Math.random() - 0.5) * 0.01).toFixed(6)),
        longitude: parseFloat((-122.4194 + (Math.random() - 0.5) * 0.01).toFixed(6)),
        battery: Math.floor(70 + Math.random() * 30),
        heading: Math.floor(Math.random() * 360),
        speed: parseFloat((Math.random() * 25).toFixed(2)),
        satellites: Math.floor(8 + Math.random() * 5),
    }),

    // JSON Format - IoT Sensor
    iotSensor: () => ({
        deviceId: 'ESP32-001',
        temp_c: parseFloat((18 + Math.random() * 15).toFixed(1)),
        light_lux: Math.floor(200 + Math.random() * 800),
        motion: Math.random() > 0.7,
        rssi: Math.floor(-90 + Math.random() * 40),
    }),

    // CSV Format - Simple Sensor
    simpleCsv: () => {
        const values = [
            (20 + Math.random() * 10).toFixed(2),
            (60 + Math.random() * 20).toFixed(2),
            (1013 + Math.random() * 20).toFixed(2),
        ];
        return values.join(',');
    },

    // CSV Format - Legacy 20-field format
    legacyFormat: () => {
        const t = Date.now() % 10000;
        const values = [
            Math.floor(500 + Math.sin(t / 1000) * 200),           // ota
            (3.3 + Math.random() * 1.7).toFixed(2),               // voltage
            (Math.random() * 2 - 1).toFixed(2),                   // accel_x
            (Math.random() * 2 - 1).toFixed(2),                   // accel_y
            (Math.random() * 2 - 1).toFixed(2),                   // accel_z
            (Math.random() * 10 - 5).toFixed(2),                  // gyro_x
            (Math.random() * 10 - 5).toFixed(2),                  // gyro_y
            (Math.random() * 10 - 5).toFixed(2),                  // gyro_z
            (1013 + Math.random() * 20).toFixed(2),               // pressure
            (22 + Math.random() * 8).toFixed(2),                  // temperature
            (37.7749 + (Math.random() - 0.5) * 0.001).toFixed(6), // lat
            (-122.4194 + (Math.random() - 0.5) * 0.001).toFixed(6), // long
            Math.floor(8 + Math.random() * 5),                    // sats
            (11.1 + Math.random() * 1.5).toFixed(2),              // batt_voltage
            (2.5 + Math.random() * 1.5).toFixed(2),               // batt_current
            Math.floor(75 + Math.random() * 25),                  // battery %
            Math.floor(1000 + Math.random() * 500),               // esc1_rpm
            Math.floor(1000 + Math.random() * 500),               // esc2_rpm
            Math.floor(1000 + Math.random() * 500),               // esc3_rpm
            Math.floor(1000 + Math.random() * 500),               // esc4_rpm
        ];
        return values.join(',');
    },
};

// Current mode
let currentMode = 'weatherStation';
let intervalId = null;
let updateRate = 1000; // 1 second

// Mode menu
const modes = {
    '1': 'weatherStation',
    '2': 'droneTelemetry',
    '3': 'iotSensor',
    '4': 'simpleCsv',
    '5': 'legacyFormat',
};

function sendData() {
    const generator = generators[currentMode];
    if (!generator) return;

    const data = generator();
    const isJson = typeof data === 'object';

    // Format for display
    const formatted = isJson ? JSON.stringify(data) : data;

    console.log(`\x1b[36m[${new Date().toLocaleTimeString()}]\x1b[0m ${formatted}`);

    // Send as if it came from serial port
    // The backend will parse it through the flexible parser
    socket.emit('test_data', {
        raw: formatted,
        timestamp: new Date().toISOString(),
    });
}

function startGenerator() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(sendData, updateRate);
    console.log(`\x1b[32m✅ Started ${currentMode} generator at ${updateRate}ms intervals\x1b[0m`);
}

function stopGenerator() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('\x1b[33m⏸️  Generator stopped\x1b[0m');
    }
}

function showMenu() {
    console.log('\n\x1b[1m' + '═'.repeat(60) + '\x1b[0m');
    console.log('\x1b[1m🎮 Ground Station Demo Data Generator\x1b[0m');
    console.log('\x1b[1m' + '═'.repeat(60) + '\x1b[0m\n');

    console.log('📊 Available Data Formats:\n');
    console.log('  \x1b[36m1.\x1b[0m Weather Station (JSON) - temp, humidity, pressure, wind, rain');
    console.log('  \x1b[36m2.\x1b[0m Drone Telemetry (JSON) - GPS, altitude, battery, heading');
    console.log('  \x1b[36m3.\x1b[0m IoT Sensor (JSON) - device ID, temp, light, motion');
    console.log('  \x1b[36m4.\x1b[0m Simple CSV - 3 numeric fields');
    console.log('  \x1b[36m5.\x1b[0m Legacy Format (CSV) - 20-field format');

    console.log('\n⚙️  Commands:\n');
    console.log('  \x1b[33ms\x1b[0m - Start/Resume generator');
    console.log('  \x1b[33mp\x1b[0m - Pause generator');
    console.log('  \x1b[33mf\x1b[0m - Fast mode (100ms)');
    console.log('  \x1b[33mn\x1b[0m - Normal mode (1000ms)');
    console.log('  \x1b[33mw\x1b[0m - Slow mode (3000ms)');
    console.log('  \x1b[33mq\x1b[0m - Quit\n');

    console.log('\x1b[1m' + '═'.repeat(60) + '\x1b[0m\n');
    console.log(`Current mode: \x1b[32m${currentMode}\x1b[0m`);
    console.log(`Update rate: \x1b[32m${updateRate}ms\x1b[0m\n`);
}

// Socket connection handlers
socket.on('connect', () => {
    console.log('\x1b[32m✅ Connected to Ground Station\x1b[0m\n');
    showMenu();
    startGenerator();
});

socket.on('disconnect', () => {
    console.log('\x1b[31m❌ Disconnected from Ground Station\x1b[0m');
    stopGenerator();
});

socket.on('connect_error', (error) => {
    console.log('\x1b[31m❌ Connection error:\x1b[0m', error.message);
    console.log('\x1b[33m💡 Make sure the Ground Station app is running on port 5001\x1b[0m');
    process.exit(1);
});

// Keyboard input handling
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
    // Ctrl+C to exit
    if (key === '\u0003') {
        console.log('\n\x1b[33m👋 Exiting...\x1b[0m');
        process.exit();
    }

    // Mode selection
    if (modes[key]) {
        currentMode = modes[key];
        console.log(`\x1b[32m✅ Switched to ${currentMode}\x1b[0m`);
        if (intervalId) startGenerator();
    }

    // Commands
    switch (key.toLowerCase()) {
        case 's':
            startGenerator();
            break;
        case 'p':
            stopGenerator();
            break;
        case 'f':
            updateRate = 100;
            console.log('\x1b[32m⚡ Fast mode: 100ms\x1b[0m');
            if (intervalId) startGenerator();
            break;
        case 'n':
            updateRate = 1000;
            console.log('\x1b[32m🕐 Normal mode: 1000ms\x1b[0m');
            if (intervalId) startGenerator();
            break;
        case 'w':
            updateRate = 3000;
            console.log('\x1b[32m🐌 Slow mode: 3000ms\x1b[0m');
            if (intervalId) startGenerator();
            break;
        case 'q':
            console.log('\n\x1b[33m👋 Exiting...\x1b[0m');
            process.exit();
            break;
        case 'h':
        case '?':
            showMenu();
            break;
    }
});

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n\x1b[33m👋 Shutting down gracefully...\x1b[0m');
    stopGenerator();
    socket.disconnect();
    process.exit();
});
