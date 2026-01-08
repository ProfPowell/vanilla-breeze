/**
 * State Management Store
 * Simple reactive store for application state
 */

class Store {
  constructor() {
    this.state = {};
    this.listeners = new Map();
  }

  /**
   * Get a value from the store
   * @param {string} key - State key
   * @returns {*} Value
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set a value in the store
   * @param {string} key - State key
   * @param {*} value - New value
   */
  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Notify listeners
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((callback) => {
        callback(value, oldValue);
      });
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Called with (newValue, oldValue)
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key).delete(callback);
    };
  }

  /**
   * Update a value using a function
   * @param {string} key - State key
   * @param {Function} updater - Function that receives current value and returns new value
   */
  update(key, updater) {
    const currentValue = this.get(key);
    const newValue = updater(currentValue);
    this.set(key, newValue);
  }

  /**
   * Reset a key to undefined
   * @param {string} key - State key
   */
  reset(key) {
    this.set(key, undefined);
  }

  /**
   * Get all state (for debugging)
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }
}

// Singleton instance
export const store = new Store();

// Initialize default state
store.set('isLoading', false);
store.set('user', null);
