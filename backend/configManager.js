
class ConfigManager {
    constructor() {
        this.dataSchema = new Map(); 
        this.userConfig = null; 
    }

    updateSchema(dataObject) {
        const timestamp = new Date();

        for (const [key, value] of Object.entries(dataObject)) {
            if (!this.dataSchema.has(key)) {
                this.dataSchema.set(key, {
                    key,
                    type: this.inferType(value),
                    firstSeen: timestamp,
                    lastSeen: timestamp,
                    sampleValues: [value],
                    min: typeof value === 'number' ? value : null,
                    max: typeof value === 'number' ? value : null,
                });
                console.log(`📊 New data key discovered: "${key}" (${this.inferType(value)})`);
            } else {
                const schema = this.dataSchema.get(key);
                schema.lastSeen = timestamp;

                schema.sampleValues.push(value);
                if (schema.sampleValues.length > 5) {
                    schema.sampleValues.shift();
                }

                if (typeof value === 'number') {
                    if (schema.min === null || value < schema.min) schema.min = value;
                    if (schema.max === null || value > schema.max) schema.max = value;
                }
            }
        }
    }

    inferType(value) {
        if (value === null || value === undefined) return 'unknown';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'string') {
            if (!isNaN(parseFloat(value)) && isFinite(value)) return 'number';
            if (!isNaN(Date.parse(value))) return 'date';
            return 'string';
        }
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        return 'unknown';
    }

    getSchema() {
        return Array.from(this.dataSchema.values()).map(schema => ({
            key: schema.key,
            type: schema.type,
            firstSeen: schema.firstSeen,
            lastSeen: schema.lastSeen,
            sampleValue: schema.sampleValues[schema.sampleValues.length - 1],
            min: schema.min,
            max: schema.max,
        }));
    }

    getDefaultConfig() {
        const widgets = [];

        for (const schema of this.dataSchema.values()) {
            const { key, type } = schema;

            let widgetType = 'value-card';
            let graphType = null;

            if (type === 'number') {
                const keyLower = key.toLowerCase();

                if (keyLower.includes('temp') || keyLower.includes('pressure') ||
                    keyLower.includes('voltage') || keyLower.includes('current') ||
                    keyLower.includes('speed') || keyLower.includes('rpm')) {
                    widgetType = 'graph';
                    graphType = 'line';
                } else if (keyLower.includes('battery') || keyLower.includes('percentage') ||
                    keyLower.includes('percent') || keyLower.includes('%')) {
                    widgetType = 'gauge';
                } else if (keyLower.includes('accel') || keyLower.includes('gyro')) {
                    widgetType = 'graph';
                    graphType = 'line';
                }
            }

            widgets.push({
                key,
                label: this.generateLabel(key),
                enabled: true,
                widgetType,
                graphType,
                color: this.generateColor(key),
                unit: this.inferUnit(key),
                min: schema.min,
                max: schema.max,
            });
        }

        return {
            version: '1.0',
            widgets,
            layout: 'auto',
        };
    }

    generateLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1') 
            .replace(/_/g, ' ')          
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    }

    generateColor(key) {
        const keyLower = key.toLowerCase();

        if (keyLower.includes('temp')) return 'hsl(348, 100%, 61%)'; 
        if (keyLower.includes('pressure') || keyLower.includes('altitude')) return 'hsl(217, 71%, 53%)'; 
        if (keyLower.includes('humidity')) return 'hsl(187, 100%, 50%)'; 
        if (keyLower.includes('battery') || keyLower.includes('voltage')) return 'hsl(142, 76%, 50%)'; 
        if (keyLower.includes('current')) return 'hsl(48, 100%, 67%)'; 
        if (keyLower.includes('gps') || keyLower.includes('lat') || keyLower.includes('lon')) return 'hsl(271, 86%, 60%)'; 
        if (keyLower.includes('accel')) return 'hsl(340, 100%, 50%)'; 
        if (keyLower.includes('gyro')) return 'hsl(291, 64%, 42%)'; 
        if (keyLower.includes('rpm') || keyLower.includes('esc')) return 'hsl(187, 100%, 50%)'; 

        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = key.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 55%)`;
    }

    inferUnit(key) {
        const keyLower = key.toLowerCase();

        if (keyLower.includes('temp')) return '°C';
        if (keyLower.includes('pressure')) return 'hPa';
        if (keyLower.includes('humidity')) return '%';
        if (keyLower.includes('voltage')) return 'V';
        if (keyLower.includes('current')) return 'A';
        if (keyLower.includes('battery') || keyLower.includes('percent')) return '%';
        if (keyLower.includes('altitude')) return 'm';
        if (keyLower.includes('speed')) return 'km/h';
        if (keyLower.includes('rpm')) return 'RPM';
        if (keyLower.includes('lat') || keyLower.includes('lon')) return '°';
        if (keyLower.includes('sats') || keyLower.includes('satellites')) return '';

        return '';
    }

    clearSchema() {
        this.dataSchema.clear();
        console.log('📊 Schema cleared');
    }

    getStats() {
        return {
            totalKeys: this.dataSchema.size,
            numericKeys: Array.from(this.dataSchema.values()).filter(s => s.type === 'number').length,
            stringKeys: Array.from(this.dataSchema.values()).filter(s => s.type === 'string').length,
            oldestKey: Array.from(this.dataSchema.values()).sort((a, b) => a.firstSeen - b.firstSeen)[0],
            newestKey: Array.from(this.dataSchema.values()).sort((a, b) => b.firstSeen - a.firstSeen)[0],
        };
    }
}

const configManager = new ConfigManager();

export default configManager;
export { ConfigManager };
