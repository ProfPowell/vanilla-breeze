/**
 * _init-registry: Shared MutationObserver + DOMContentLoaded handler
 *
 * Instead of each utility spinning up its own MutationObserver, they
 * register a { selector, enhanceFn } pair here. One shared observer
 * walks added nodes and dispatches to every registered enhancer.
 *
 * @example
 * import { registerInit } from './_init-registry.js';
 * registerInit('input[data-mask]', enhanceMask);
 */

/** @type {Map<string, Function>} */
const registry = new Map();
let observer = null;
let domReady = false;

function runEnhancers(root) {
  for (const [selector, fn] of registry) {
    root.querySelectorAll(selector).forEach(fn);
  }
}

function processNode(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = /** @type {Element} */ (node);
  for (const [selector, fn] of registry) {
    if (el.matches(selector)) fn(el);
    el.querySelectorAll(selector).forEach(fn);
  }
}

function ensureObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        processNode(node);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function onReady() {
  if (domReady) return;
  domReady = true;
  runEnhancers(document);
}

/**
 * Register a selector + enhance function pair.
 * The enhance function is called for each matching element on
 * DOMContentLoaded and whenever matching elements are added to the DOM.
 *
 * @param {string} selector - CSS selector to match
 * @param {Function} enhanceFn - Called once per matching element
 */
export function registerInit(selector, enhanceFn) {
  registry.set(selector, enhanceFn);
  ensureObserver();

  // If DOM is already ready, scan immediately for this selector
  if (domReady || document.readyState !== 'loading') {
    domReady = true;
    document.querySelectorAll(selector).forEach(enhanceFn);
  } else if (registry.size === 1) {
    // First registration — set up the DOMContentLoaded listener once
    document.addEventListener('DOMContentLoaded', onReady);
  }
}