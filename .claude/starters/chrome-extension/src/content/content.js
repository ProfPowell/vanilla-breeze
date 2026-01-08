/**
 * Content Script
 * Runs in the context of web pages
 */

import { messaging } from '../lib/messaging.js';

/**
 * Initialize content script
 */
function init() {
  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PAGE_INFO':
        sendResponse(getPageInfo());
        break;

      case 'EXECUTE_ACTION':
        executeAction(message.data);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }

    return true; // Keep channel open for async response
  });

  // Notify background that content script is ready
  chrome.runtime.sendMessage({
    type: 'CONTENT_SCRIPT_READY',
    data: { url: window.location.href }
  });
}

/**
 * Get information about the current page
 * @returns {Object}
 */
function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    lang: document.documentElement.lang || 'en',
  };
}

/**
 * Execute an action on the page
 * @param {Object} data - Action data
 */
function executeAction(data) {
  switch (data.action) {
    case 'highlight':
      highlightElements(data.selector);
      break;

    case 'extract':
      return extractContent(data.selector);

    default:
      console.warn('Unknown action:', data.action);
  }
}

/**
 * Highlight elements matching a selector
 * @param {string} selector
 */
function highlightElements(selector) {
  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.style.outline = '2px solid #1e40af';
      el.style.outlineOffset = '2px';
    });
  } catch (error) {
    console.error('Invalid selector:', selector);
  }
}

/**
 * Extract content from elements matching a selector
 * @param {string} selector
 * @returns {string[]}
 */
function extractContent(selector) {
  try {
    const elements = document.querySelectorAll(selector);
    return Array.from(elements).map(el => el.textContent?.trim() || '');
  } catch (error) {
    console.error('Invalid selector:', selector);
    return [];
  }
}

// Initialize
init();
