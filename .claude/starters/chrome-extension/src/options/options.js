/**
 * Options Script
 * Settings page logic
 */

import { storage } from '../lib/storage.js';
import { messaging } from '../lib/messaging.js';

const DEFAULT_SETTINGS = {
  enabled: true,
  apiKey: '',
};

/**
 * Initialize options page
 */
async function init() {
  // Load saved settings
  const settings = await storage.get('settings', DEFAULT_SETTINGS);

  // Populate form
  document.getElementById('enabled').checked = settings.enabled;
  document.getElementById('api-key').value = settings.apiKey || '';

  // Handle form submission
  document.getElementById('options-form').addEventListener('submit', handleSubmit);

  // Apply i18n
  localizeElements();
}

/**
 * Handle form submission
 * @param {Event} event
 */
async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('save-status');

  button.disabled = true;

  try {
    const settings = {
      enabled: form.enabled.checked,
      apiKey: form.apiKey.value.trim(),
    };

    await storage.set('settings', settings);

    // Notify background script
    await messaging.sendToBackground({
      type: 'SETTINGS_CHANGED',
      data: settings
    });

    // Show success
    status.textContent = chrome.i18n.getMessage('savedMessage') || 'Saved';
    status.dataset.state = 'success';

    setTimeout(() => {
      status.textContent = '';
      delete status.dataset.state;
    }, 3000);
  } catch (error) {
    status.textContent = 'Error saving settings';
    status.dataset.state = 'error';
  } finally {
    button.disabled = false;
  }
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
