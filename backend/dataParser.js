/**
 * Data Parser Module
 * Flexible parser for JSON and CSV serial data formats
 */

/**
 * Detect the format of incoming data
 * @param {string} line - Raw data line
 * @returns {string} - Format type: 'json', 'csv', or 'unknown'
 */
export function detectDataFormat(line) {
    const trimmed = line.trim();

    // Check for JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            JSON.parse(trimmed);
            return 'json';
        } catch {
            // Not valid JSON
        }
    }

    // Check for CSV (contains commas and looks like numeric data)
    if (trimmed.includes(',')) {
        const parts = trimmed.split(',');
        // If at least half of the parts are numbers, assume CSV
        const numericParts = parts.filter(p => {
            const val = p.trim();
            return val !== '' && !isNaN(parseFloat(val)) && isFinite(val);
        });

        if (numericParts.length >= parts.length * 0.5) {
            return 'csv';
        }
    }

    return 'unknown';
}

/**
 * Parse CSV data into key-value object
 * @param {string} line - CSV data line
 * @param {Array<string>} headers - Optional header names
 * @returns {Object} - Parsed data object
 */
export function parseCSV(line, headers = null) {
    const parts = line.trim().split(',').map(p => p.trim());
    const data = {};

    if (headers && headers.length === parts.length) {
        // Use provided headers
        parts.forEach((value, index) => {
            const key = headers[index];
            data[key] = parseValue(value);
        });
    } else {
        // Auto-generate keys
        parts.forEach((value, index) => {
            data[`field_${index}`] = parseValue(value);
        });
    }

    return data;
}

/**
 * Parse JSON data
 * @param {string} line - JSON data line
 * @returns {Object|null} - Parsed data object or null if invalid
 */
export function parseJSON(line) {
    try {
        const parsed = JSON.parse(line.trim());
        // Flatten if it's a nested object (one level deep)
        return flattenObject(parsed);
    } catch (error) {
        console.error('JSON parse error:', error.message);
        return null;
    }
}

/**
 * Flatten nested object (one level deep)
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Prefix for nested keys
 * @returns {Object} - Flattened object
 */
function flattenObject(obj, prefix = '') {
    const flattened = {};

    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Recursively flatten nested objects
            Object.assign(flattened, flattenObject(value, newKey));
        } else {
            flattened[newKey] = value;
        }
    }

    return flattened;
}

/**
 * Parse a single value to appropriate type
 * @param {string} value - String value
 * @returns {number|boolean|string} - Parsed value
 */
function parseValue(value) {
    if (value === '' || value === null || value === undefined) return null;

    // Try boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Try number
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
        return num;
    }

    // Return as string
    return value;
}

/**
 * Parse flexible data based on auto-detected format
 * @param {string} line - Raw data line
 * @param {Object} options - Parsing options
 * @returns {Object} - { format, data, raw }
 */
export function parseFlexibleData(line, options = {}) {
    const {
        csvHeaders = null,
        forceFormat = null,
    } = options;

    const format = forceFormat || detectDataFormat(line);
    let data = null;

    switch (format) {
        case 'json':
            data = parseJSON(line);
            break;

        case 'csv':
            data = parseCSV(line, csvHeaders);
            break;

        case 'unknown':
            // Try to extract any numbers found
            const numberRegex = /-?\d+(?:\.\d+)?/g;
            const nums = line.match(numberRegex) || [];
            if (nums.length > 0) {
                data = {};
                nums.forEach((num, idx) => {
                    data[`value_${idx}`] = parseFloat(num);
                });
            } else {
                // Store as raw text
                data = { raw_text: line.trim() };
            }
            break;
    }

    return {
        format,
        data: data || {},
        raw: line,
        timestamp: new Date(),
    };
}

/**
 * Extract CSV headers from a header line
 * @param {string} line - CSV header line
 * @returns {Array<string>} - Header names
 */
export function extractCSVHeaders(line) {
    return line.trim().split(',').map(h => h.trim().replace(/"/g, ''));
}

/**
 * Validate data object
 * @param {Object} data - Data object to validate
 * @returns {boolean} - True if valid
 */
export function validateData(data) {
    if (!data || typeof data !== 'object') return false;
    if (Object.keys(data).length === 0) return false;
    return true;
}
