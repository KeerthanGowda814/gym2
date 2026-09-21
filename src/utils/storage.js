/**
 * APEX ATHLETICS - SAFE LOCAL STORAGE UTILITY
 * Prevents QuotaExceededError crashes when storing client state or base64 files
 */

/**
 * Recursively sanitizes data before writing to LocalStorage.
 * Truncates base64 data URLs, raw image/pdf strings, and massive blobs.
 */
export function sanitizeForStorage(data, maxStringLength = 1000) {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Check if string is a data URL (e.g. data:image/jpeg;base64,... or data:application/pdf;base64,...)
    if (data.startsWith('data:') && data.length > maxStringLength) {
      const mimeMatch = data.match(/^data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      return `[BASE64_TRUNCATED:${mime}:${data.length}_bytes]`;
    }
    // Check if string is a long base64 string without spaces
    if (data.length > 5000 && !data.includes(' ') && !data.includes('\n')) {
      return `[BASE64_TRUNCATED:raw:${data.length}_bytes]`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForStorage(item, maxStringLength));
  }

  if (typeof data === 'object') {
    const cleaned = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = sanitizeForStorage(data[key], maxStringLength);
    }
    return cleaned;
  }

  return data;
}

/**
 * Safely sets an item in LocalStorage with automatic error handling,
 * quota check, and data sanitization.
 */
export function safeSetItem(key, value) {
  try {
    let stringVal;
    if (typeof value === 'string') {
      // If setting a raw string that is a data URI, sanitize it if huge
      if (value.startsWith('data:') && value.length > 5000) {
        stringVal = sanitizeForStorage(value, 500);
      } else {
        stringVal = value;
      }
    } else {
      // Object/Array: check if pre-sanitization is needed for huge payloads
      const sanitized = sanitizeForStorage(value, 2000);
      stringVal = JSON.stringify(sanitized);
    }

    localStorage.setItem(key, stringVal);
    return true;
  } catch (err) {
    if (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014
    ) {
      try {
        // Attempt aggressive sanitization (limit string length to 100 chars)
        const aggressivelySanitized = sanitizeForStorage(value, 100);
        const stringVal = typeof value === 'string' ? String(aggressivelySanitized) : JSON.stringify(aggressivelySanitized);
        localStorage.setItem(key, stringVal);
        return true;
      } catch (innerErr) {
        // Silently swallow to prevent app crash and console flooding
        return false;
      }
    }
    return false;
  }
}

/**
 * Safely retrieves an item from LocalStorage
 */
export function safeGetItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? item : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

/**
 * Safely removes an item from LocalStorage
 */
export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    return false;
  }
}
