/**
 * Background Service Worker
 * Handles events and background tasks
 */

import { storage } from '../lib/storage.js';

/**
 * Extension install/update handler
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install - set default settings
    await storage.set('settings', {
      enabled: true,
      apiKey: '',
    });

    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('Message handler error:', error);
      sendResponse({ error: error.message });
    });

  return true; // Keep channel open for async response
});

/**
 * Handle incoming messages
 * @param {Object} message
 * @param {chrome.runtime.MessageSender} sender
 * @returns {Promise<*>}
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'SETTINGS_CHANGED':
      return handleSettingsChanged(message.data);

    case 'CONTENT_SCRIPT_READY':
      return handleContentScriptReady(message.data, sender);

    case 'GET_PAGE_DATA':
      return getPageData(sender.tab?.id);

    default:
      return { error: 'Unknown message type' };
  }
}

/**
 * Handle settings change
 * @param {Object} settings
 */
async function handleSettingsChanged(settings) {
  // Perform any actions needed when settings change
  console.log('Settings changed:', settings);

  // Update badge based on enabled state
  if (settings.enabled) {
    await chrome.action.setBadgeText({ text: '' });
  } else {
    await chrome.action.setBadgeText({ text: 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
  }

  return { success: true };
}

/**
 * Handle content script ready
 * @param {Object} data
 * @param {chrome.runtime.MessageSender} sender
 */
async function handleContentScriptReady(data, sender) {
  console.log('Content script ready on:', data.url);

  // Could perform initial setup for the page here
  return { acknowledged: true };
}

/**
 * Get data from the current page
 * @param {number} tabId
 */
async function getPageData(tabId) {
  if (!tabId) {
    return { error: 'No tab ID' };
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'GET_PAGE_INFO'
    });
    return response;
  } catch (error) {
    return { error: 'Content script not available' };
  }
}

/**
 * Context menu setup (optional)
 */
function setupContextMenu() {
  chrome.contextMenus.create({
    id: 'extension-action',
    title: 'Extension Action',
    contexts: ['page', 'selection']
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extension-action') {
      console.log('Context menu clicked:', info, tab);
    }
  });
}

// Uncomment to enable context menu
// setupContextMenu();
