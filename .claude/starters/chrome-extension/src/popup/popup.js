/**
 * Popup Script
 * Main popup UI logic
 */

import { storage } from '../lib/storage.js';
import { messaging } from '../lib/messaging.js';

/**
 * Initialize popup
 */
async function init() {
  // Load saved settings
  const settings = await storage.get('settings', { enabled: true });

  const enabledToggle = document.getElementById('enabled');
  enabledToggle.checked = settings.enabled;

  // Handle toggle change
  enabledToggle.addEventListener('change', async () => {
    const enabled = enabledToggle.checked;
    await storage.set('settings', { ...settings, enabled });

    // Notify background script
    await messaging.sendToBackground({
      type: 'SETTINGS_CHANGED',
      data: { enabled }
    });

    updateStatus(enabled ? 'Enabled' : 'Disabled');
  });

  // Options button
  document.getElementById('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Apply i18n
  localizeElements();
}

/**
 * Update status display
 * @param {string} text
 */
function updateStatus(text) {
  const status = document.getElementById('status');
  status.textContent = text;
  status.dataset.state = 'updated';
  setTimeout(() => delete status.dataset.state, 1000);
}

/**
 * Apply localization to elements with data-i18n attribute
 */
function localizeElements() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
