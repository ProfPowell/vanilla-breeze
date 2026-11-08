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
    if (el.matches(selector)) /** @type {any} */ (fn)(el);
    el.querySelectorAll(selector).forEach(/** @type {any} */ (fn));
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
    document.querySelectorAll(selector).forEach(/** @type {any} */ (enhanceFn));
  } else if (registry.size === 1) {
    // First registration — set up the DOMContentLoaded listener once
    document.addEventListener('DOMContentLoaded', onReady);
  }
}
/** @type {WeakMap<Element, Set<Function>>} */
const resetHandlers = new WeakMap();
let resetListening = false;

/**
 * Run `fn` after the form that owns `el` is reset.
 *
 * The `reset` event fires BEFORE the browser restores default values, so
 * enhancers that mirror a control's value (fills, bubbles, swatches, counts,
 * conditional sections) re-read it one task later, when the reset is done.
 * A cancelled reset (preventDefault) runs nothing. Works for controls inside
 * the form and for controls associated through the `form` attribute.
 * One document-level listener serves every registration; handlers are held
 * in a WeakMap, so removed elements are collected.
 *
 * @example
 * import { onFormReset } from './_init-registry.js';
 * onFormReset(input, () => sync(input));
 *
 * @param {Element} el - The enhanced control (or a wrapper inside the form)
 * @param {Function} fn - Called with `el` after the reset has been applied
 */
export function onFormReset(el, fn) {
  let set = resetHandlers.get(el);
  if (!set) resetHandlers.set(el, set = new Set());
  set.add(fn);
  if (resetListening) return;
  resetListening = true;
  document.addEventListener('reset', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    setTimeout(() => {
      if (event.defaultPrevented) return;
      const seen = new Set();
      const candidates = [...form.querySelectorAll('*'), ...Array.from(form.elements)];
      for (const node of candidates) {
        if (seen.has(node)) continue;
        seen.add(node);
        const handlers = resetHandlers.get(node);
        if (handlers) for (const handler of handlers) handler(node);
      }
    }, 0);
  }, true);
}
