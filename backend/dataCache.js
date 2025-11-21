// dataCache.js - In-memory storage for live telemetry data
// Data is stored temporarily in RAM and can be exported to CSV/XLSX

const MAX_CACHE_SIZE = 10000; // Maximum entries per sensor type

// In-memory cache structure
const liveCache = {
  ota: [],
  imu: [],
  bmp: [],
  gps: [],
  battery: [],
  esc: [],
  contour: []
};

/**
 * Add data to cache with automatic timestamp
 * @param {string} type - Sensor type (ota, imu, bmp, gps, battery, esc, contour)
 * @param {object} data - Sensor data object
 */
function addToCache(type, data) {
  if (!liveCache[type]) {
    console.error(`❌ Invalid cache type: ${type}`);
    return;
  }

  // Add timestamp if not present
  if (!data.timestamp) {
    data.timestamp = new Date();
  }

  // Add to cache
  liveCache[type].push(data);

  // Prevent memory overflow - keep only last MAX_CACHE_SIZE entries
  if (liveCache[type].length > MAX_CACHE_SIZE) {
    liveCache[type].shift(); // Remove oldest entry
  }

  console.log(`📊 Cache update [${type}]: ${liveCache[type].length} entries`);
}

/**
 * Get cached data with optional time filtering
 * @param {string} type - Sensor type or 'all' for all data
 * @param {number} minutes - Get data from last N minutes (0 = all data)
 * @returns {object|array} Filtered data
 */
function getCachedData(type = 'all', minutes = 0) {
  const now = new Date();
  const cutoffTime = minutes > 0 ? new Date(now - minutes * 60 * 1000) : null;

  const filterByTime = (arr) => {
    if (!cutoffTime) return arr;
    return arr.filter(item => new Date(item.timestamp) >= cutoffTime);
  };

  if (type === 'all') {
    // Return all sensor data
    const result = {};
    for (const key in liveCache) {
      result[key] = filterByTime(liveCache[key]);
    }
    return result;
  } else if (liveCache[type]) {
    // Return specific sensor data
    return filterByTime(liveCache[type]);
  } else {
    console.error(`❌ Invalid cache type: ${type}`);
    return [];
  }
}

/**
 * Clear cache for specific type or all
 * @param {string} type - Sensor type or 'all' to clear everything
 */
function clearCache(type = 'all') {
  if (type === 'all') {
    for (const key in liveCache) {
      liveCache[key] = [];
    }
    console.log('🗑️  All cache cleared');
  } else if (liveCache[type]) {
    liveCache[type] = [];
    console.log(`🗑️  Cache cleared [${type}]`);
  }
}

/**
 * Get cache statistics
 * @returns {object} Stats for each sensor type
 */
function getCacheStats() {
  const stats = {};
  for (const key in liveCache) {
    stats[key] = {
      count: liveCache[key].length,
      oldest: liveCache[key].length > 0 ? liveCache[key][0].timestamp : null,
      newest: liveCache[key].length > 0 ? liveCache[key][liveCache[key].length - 1].timestamp : null
    };
  }
  return stats;
}

/**
 * Get data formatted for CSV export
 * @param {number} minutes - Filter by time range (0 = all)
 * @returns {object} Data organized by sensor type ready for CSV
 */
function getDataForExport(minutes = 0) {
  return getCachedData('all', minutes);
}

export {
  addToCache,
  getCachedData,
  clearCache,
  getCacheStats,
  getDataForExport
};
