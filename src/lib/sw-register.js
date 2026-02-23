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
 */

function shouldRegister() {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator)) return false;

  // Check global flag
  if (window.__VB_SERVICE_WORKER) return true;

  // Check meta tag
  const meta = document.querySelector('meta[name="vb-service-worker"]');
  return meta?.content === 'true';
}

if (shouldRegister()) {
  // Detect SW path from script location
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

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swPath).catch(err => {
      console.warn('[VB] Service worker registration failed:', err);
    });
  });
}
