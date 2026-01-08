/**
 * Storage Wrapper
 * Async wrapper for chrome.storage.local
 */

export const storage = {
  /**
   * Get a value from storage
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] ?? defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  /**
   * Set a value in storage
   * @param {string} key
   * @param {*} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },

  /**
   * Remove a value from storage
   * @param {string} key
   * @returns {Promise<void>}
   */
  async remove(key) {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  },

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  },

  /**
   * Get all stored data
   * @returns {Promise<Object>}
   */
  async getAll() {
    try {
      return await chrome.storage.local.get(null);
    } catch (error) {
      console.error('Storage getAll error:', error);
      return {};
    }
  },

  /**
   * Listen for storage changes
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    const listener = (changes, areaName) => {
      if (areaName === 'local') {
        const processed = {};
        for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
          processed[key] = { oldValue, newValue };
        }
        callback(processed);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }
};
