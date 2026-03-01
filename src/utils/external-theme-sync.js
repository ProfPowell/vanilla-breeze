/**
 * External Theme Sync
 *
 * Syncs theme changes to external web components that don't automatically
 * respond to the page's color scheme.
 *
 * Supported components:
 * - browser-window: Uses `mode` attribute ('light' | 'dark')
 * - code-block: Uses `theme` attribute ('light' | 'dark')
 */

import { ThemeManager } from '../lib/theme-manager.js';

/**
 * Update all external components to match the current theme
 * @param {'light' | 'dark'} mode - The effective mode to apply
 */
function syncComponents(mode) {
  // Sync browser-window components
  document.querySelectorAll('browser-window').forEach(el => {
    el.setAttribute('mode', mode);
  });

  // Sync code-block components
  document.querySelectorAll('code-block').forEach(el => {
    el.setAttribute('theme', mode);
  });
}

/**
 * Initialize external theme sync
 * - Applies current theme to existing components
 * - Listens for theme changes
 * - Watches for new components via MutationObserver
 */
export function initExternalThemeSync() {
  // Apply current theme to existing components
  const { effectiveMode } = ThemeManager.getState();
  syncComponents(/** @type {'light' | 'dark'} */ (effectiveMode));

  // Listen for theme changes
  window.addEventListener('theme-change', (/** @type {CustomEvent} */ e) => {
    syncComponents(e.detail.effectiveMode);
  });

  // Watch for dynamically added components
  const observer = new MutationObserver((mutations) => {
    const { effectiveMode } = ThemeManager.getState();

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {Element} */ (node);

        // Check if the added node is a component we care about
        if (el.tagName === 'BROWSER-WINDOW') {
          el.setAttribute('mode', effectiveMode);
        } else if (el.tagName === 'CODE-BLOCK') {
          el.setAttribute('theme', effectiveMode);
        }

        // Also check descendants
        el.querySelectorAll('browser-window').forEach(child => {
          child.setAttribute('mode', effectiveMode);
        });
        el.querySelectorAll('code-block').forEach(child => {
          child.setAttribute('theme', effectiveMode);
        });
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
