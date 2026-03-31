/**
 * vb-forms: Mobile form utilities
 *
 * Currently a minimal module. Browser-native focus scrolling handles
 * keyboard-aware input positioning. CSS env(keyboard-inset-height)
 * in footer[data-sticky] handles sticky submit positioning.
 *
 * This module exists as a hook for future mobile form enhancements
 * (e.g., step validation coordination, input masking).
 *
 * Lazy-loaded when [data-keyboard-aware] forms are present.
 *
 * @module vb-forms
 */

/**
 * Auto-initialize mobile forms
 *
 * Scans for [data-keyboard-aware] forms. Currently a no-op —
 * browsers handle focus scrolling natively and CSS handles
 * keyboard-inset layout via env().
 *
 * @param {Document|HTMLElement} [root=document] - Root to scan
 * @returns {Function} cleanup
 */
export function initMobileForms(root = document) {
  // Placeholder — future enhancements can add listeners here
  return () => {};
}

// Auto-init on load (triggered by lazy-load guard in main.js)
if (typeof document !== 'undefined') initMobileForms();
