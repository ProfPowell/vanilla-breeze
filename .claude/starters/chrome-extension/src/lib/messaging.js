/**
 * Messaging Utilities
 * Helpers for message passing between extension components
 */

export const messaging = {
  /**
   * Send message to background script
   * @param {Object} message
   * @returns {Promise<*>}
   */
  async sendToBackground(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      console.error('Send to background error:', error);
      throw error;
    }
  },

  /**
   * Send message to a specific tab
   * @param {number} tabId
   * @param {Object} message
   * @returns {Promise<*>}
   */
  async sendToTab(tabId, message) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      console.error('Send to tab error:', error);
      throw error;
    }
  },

  /**
   * Send message to the active tab
   * @param {Object} message
   * @returns {Promise<*>}
   */
  async sendToActiveTab(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab');
      }
      return await this.sendToTab(tab.id, message);
    } catch (error) {
      console.error('Send to active tab error:', error);
      throw error;
    }
  },

  /**
   * Send message to all tabs
   * @param {Object} message
   * @returns {Promise<Array>}
   */
  async sendToAllTabs(message) {
    try {
      const tabs = await chrome.tabs.query({});
      const results = await Promise.allSettled(
        tabs.map(tab =>
          tab.id ? this.sendToTab(tab.id, message) : Promise.resolve(null)
        )
      );
      return results.map(r => r.status === 'fulfilled' ? r.value : null);
    } catch (error) {
      console.error('Send to all tabs error:', error);
      throw error;
    }
  },

  /**
   * Listen for messages
   * @param {Function} handler - (message, sender) => response
   * @returns {Function} Unsubscribe function
   */
  onMessage(handler) {
    const listener = (message, sender, sendResponse) => {
      const result = handler(message, sender);

      if (result instanceof Promise) {
        result.then(sendResponse).catch(error => {
          console.error('Message handler error:', error);
          sendResponse({ error: error.message });
        });
        return true; // Keep channel open
      }

      if (result !== undefined) {
        sendResponse(result);
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  },

  /**
   * Create a connection for long-lived messaging
   * @param {string} name
   * @returns {chrome.runtime.Port}
   */
  connect(name) {
    return chrome.runtime.connect({ name });
  },

  /**
   * Listen for connections
   * @param {Function} handler - (port) => void
   * @returns {Function} Unsubscribe function
   */
  onConnect(handler) {
    chrome.runtime.onConnect.addListener(handler);

    return () => {
      chrome.runtime.onConnect.removeListener(handler);
    };
  }
};
