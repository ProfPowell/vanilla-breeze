/**
 * Service Worker Registration — opt-in only
 *
 * Only registers when consumer opts in via:
 *   <meta name="vb-service-worker" content="true">
 *   or: window.__VB_SERVICE_WORKER = true
 *
 * @example In HTML head:
 * <meta name="vb-service-worker" content="true">
 *
 * @example In JS:
 * window.__VB_SERVICE_WORKER = true;
 * import './lib/sw-register.js';
 *
 * @example Programmatic use:
 * import { getSWStatus, clearSWCache, checkForUpdate } from './lib/sw-register.js';
 * const status = await getSWStatus();
 */

/* global __VB_VERSION__ */

/** Stored registration promise for reuse */
let registrationPromise = null;

/**
 * Get the current VB version (build-injected)
 */
export function getVBVersion() {
  return typeof __VB_VERSION__ !== 'undefined' ? __VB_VERSION__ : 'dev';
}

/**
 * Detect the SW file path from script tags on the page
 */
function detectSWPath() {
  const scripts = document.querySelectorAll('script[src*="vanilla-breeze"]');
  let swPath = '/cdn/sw.js';

  for (const script of scripts) {
    const src = script.getAttribute('src');
    if (src) {
      const idx = src.lastIndexOf('/');
      if (idx !== -1) {
        swPath = src.slice(0, idx) + '/sw.js';
        break;
      }
    }
  }
  return swPath;
}

/**
 * Get or create the SW registration
 */
function getRegistration() {
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker?.ready ?? Promise.reject(new Error('SW not supported'));
  }
  return registrationPromise;
}

/**
 * Send a message to the active service worker via MessageChannel
 */
function sendMessage(type) {
  return new Promise((resolve, reject) => {
    navigator.serviceWorker?.controller
      ? doSend(navigator.serviceWorker.controller, type, resolve, reject)
      : getRegistration()
          .then(reg => {
            const sw = reg.active || reg.waiting || reg.installing;
            if (sw) {
              doSend(sw, type, resolve, reject);
            } else {
              reject(new Error('No active service worker'));
            }
          })
          .catch(reject);
  });
}

function doSend(sw, type, resolve, reject) {
  const channel = new MessageChannel();
  channel.port1.onmessage = (event) => resolve(event.data);
  channel.port1.onmessageerror = () => reject(new Error('Message error'));
  sw.postMessage({ type }, [channel.port2]);

  // Timeout after 5s
  setTimeout(() => reject(new Error('SW message timeout')), 5000);
}

/**
 * Get SW status: version, cache name, cached URLs
 */
export async function getSWStatus() {
  return sendMessage('GET_STATUS');
}

/**
 * Clear all VB caches
 */
export async function clearSWCache() {
  return sendMessage('CLEAR_CACHE');
}

/**
 * Check for a SW update
 */
export async function checkForUpdate() {
  const reg = await getRegistration();
  await reg.update();
  return { updated: !!reg.waiting };
}

/**
 * Tell a waiting SW to skip waiting and activate immediately
 */
export async function skipWaiting() {
  const reg = await getRegistration();
  reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

// --- Auto-registration side effect (backwards compat) ---

function shouldRegister() {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;

  if (window.__VB_SERVICE_WORKER) return true;

  const meta = document.querySelector('meta[name="vb-service-worker"]');
  return meta?.content === 'true';
}

if (shouldRegister()) {
  const swPath = detectSWPath();
  window.addEventListener('load', () => {
    registrationPromise = navigator.serviceWorker.register(swPath).catch(err => {
      console.warn('[VB] Service worker registration failed:', err);
    });
  });
}
