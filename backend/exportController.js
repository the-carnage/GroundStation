// exportController.js - Export cached data to CSV/XLSX
import { getDataForExport, clearCache, getCacheStats } from "./dataCache.js";

/**
 * Convert cache data to CSV format
 * @param {object} data - Cached sensor data
 * @returns {string} CSV content
 */
function convertToCSV(data) {
  let csv = '';
  
  // Export each sensor type separately
  for (const sensorType in data) {
    const entries = data[sensorType];
    
    if (entries.length === 0) continue;
    
    // Add sensor type header
    csv += `\n=== ${sensorType.toUpperCase()} DATA ===\n`;
    
    // Get column headers from first entry
    const headers = Object.keys(entries[0]);
    csv += headers.join(',') + '\n';
    
    // Add data rows
    entries.forEach(entry => {
      const row = headers.map(header => {
        const value = entry[header];
        // Format timestamp
        if (header === 'timestamp' && value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      csv += row.join(',') + '\n';
    });
  }
  
  return csv;
}

/**
 * Convert cache data to JSON format (for XLSX libraries)
 * @param {object} data - Cached sensor data
 * @returns {object} Structured data for XLSX export
 */
function convertToJSON(data) {
  const sheets = {};
  
  for (const sensorType in data) {
    const entries = data[sensorType];
    
    if (entries.length === 0) continue;
    
    // Format timestamps for Excel
    sheets[sensorType] = entries.map(entry => ({
      ...entry,
      timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : ''
    }));
  }
  
  return sheets;
}

/**
 * Export handler for CSV
 */
export function exportCSV(req, res) {
  try {
    const minutes = parseInt(req.query.minutes) || 0; // 0 = all data
    const clearAfter = req.query.clear === 'true';
    
    console.log(`📤 CSV Export requested - Time range: ${minutes ? `${minutes} min` : 'All'}`);
    
    const data = getDataForExport(minutes);
    const csv = convertToCSV(data);
    
    if (!csv.trim()) {
      return res.status(404).json({ error: 'No data available to export' });
    }
    
    // Set headers for file download
    const filename = `telemetry_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(csv);
    
    if (clearAfter) {
      clearCache('all');
      console.log('🗑️  Cache cleared after export');
    }
    
  } catch (error) {
    console.error('Export CSV error:', error.message);
    res.status(500).json({ error: 'Export failed' });
  }
}

/**
 * Export handler for XLSX (returns JSON for frontend to process)
 */
export function exportXLSX(req, res) {
  try {
    const minutes = parseInt(req.query.minutes) || 0;
    const clearAfter = req.query.clear === 'true';
    
    console.log(`📤 XLSX Export requested - Time range: ${minutes ? `${minutes} min` : 'All'}`);
    
    const data = getDataForExport(minutes);
    const jsonData = convertToJSON(data);
    
    if (Object.keys(jsonData).length === 0) {
      return res.status(404).json({ error: 'No data available to export' });
    }
    
    // Return JSON for frontend to convert to XLSX using SheetJS
    res.json({
      success: true,
      data: jsonData,
      stats: getCacheStats(),
      filename: `telemetry_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`
    });
    
    if (clearAfter) {
      clearCache('all');
      console.log('🗑️  Cache cleared after export');
    }
    
  } catch (error) {
    console.error('Export XLSX error:', error.message);
    res.status(500).json({ error: 'Export failed' });
  }
}

/**
 * Get cache statistics
 */
export function getCacheStatsHandler(req, res) {
  try {
    const stats = getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ error: 'Failed to get stats' });
  }
}

/**
 * Clear cache manually
 */
export function clearCacheHandler(req, res) {
  try {
    const type = req.query.type || 'all';
    clearCache(type);
    res.json({ success: true, message: `Cache cleared: ${type}` });
  } catch (error) {
    console.error('Clear cache error:', error.message);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
}
