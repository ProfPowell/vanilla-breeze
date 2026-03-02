/**
 * Component Autoloader — lazy-load web components on demand
 *
 * Detects undefined custom elements in the DOM and dynamically imports
 * their modules. Uses MutationObserver for elements added after page load.
 *
 * @example
 * import { initAutoloader } from './lib/autoloader.js';
 * await initAutoloader();
 *
 * // Now <geo-map> added to DOM will auto-load its JS module
 */

/** @type {Map<string, string> | null} tag-name → file path */
let componentMap = null;

/** @type {Map<string, Promise<void>>} tag-name → loading promise */
const loadingPromises = new Map();

/** @type {MutationObserver|null} */
let observer = null;

/**
 * Detect the base URL for component files
 * @returns {string}
 */
function detectBase() {
  if (typeof window !== 'undefined' && window.__VB_COMPONENT_BASE) {
    return String(window.__VB_COMPONENT_BASE).replace(/\/$/, '');
  }

  if (typeof document !== 'undefined') {
    const scripts = document.querySelectorAll('script[src*="vanilla-breeze"]');
    for (const script of scripts) {
      const src = script.getAttribute('src');
      if (src) {
        const idx = src.lastIndexOf('/');
        if (idx !== -1) return src.slice(0, idx);
      }
    }
  }

  return '/cdn';
}

/**
 * Fetch component manifest and build tag → file map
 * @returns {Promise<Map<string, string>>}
 */
async function loadManifest() {
  if (componentMap) return componentMap;

  const base = detectBase();
  componentMap = new Map();

  try {
    const res = await fetch(`${base}/components/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();

    for (const [tagName, entry] of Object.entries(manifest)) {
      componentMap.set(tagName, `${base}/components/${entry.file}`);
    }
  } catch {
    console.warn('[VB] Component manifest unavailable — autoloader disabled');
  }

  return componentMap;
}

/**
 * Load a single component if it's in the manifest and not yet defined
 * @param {string} tagName - Custom element tag name
 * @returns {Promise<void>}
 */
async function loadComponent(tagName) {
  // Already defined — nothing to do
  if (customElements.get(tagName)) return;

  // Already loading
  if (loadingPromises.has(tagName)) return loadingPromises.get(tagName);

  // Not in manifest
  const url = componentMap?.get(tagName);
  if (!url) return;

  /** @type {Promise<void>} */
  const promise = import(/* webpackIgnore: true */ url)
    .then(() => customElements.whenDefined(tagName))
    .then(() => {})
    .catch(err => {
      console.warn(`[VB] Failed to autoload ${tagName}:`, err);
      loadingPromises.delete(tagName);
    });

  loadingPromises.set(tagName, promise);
  return promise;
}

/**
 * Scan a root element for undefined custom elements and load them
 * @param {Element|Document} root
 */
function scanForComponents(root) {
  if (!componentMap) return;

  // Find all elements with hyphens in their tag name (custom elements)
  const elements = (root === document)
    ? document.querySelectorAll('*')
    : root.querySelectorAll?.('*') || [];

  const tagsToLoad = new Set();

  for (const el of elements) {
    const tag = el.localName;
    if (tag.includes('-') && !customElements.get(tag) && componentMap.has(tag)) {
      tagsToLoad.add(tag);
    }
  }

  for (const tag of tagsToLoad) {
    loadComponent(tag);
  }
}

/**
 * Initialize the autoloader
 *
 * - Fetches the component manifest
 * - Scans existing DOM for undefined custom elements
 * - Sets up MutationObserver for dynamically added elements
 *
 * @returns {Promise<void>}
 */
export async function initAutoloader() {
  await loadManifest();

  // Scan existing DOM
  scanForComponents(document);

  // Watch for dynamically added elements
  if (observer) return; // Already watching

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const el = /** @type {Element} */ (node);
        const tag = el.localName;
        if (tag.includes('-') && componentMap?.has(tag)) {
          loadComponent(tag);
        }

        // Also scan children of added nodes
        // @ts-ignore — defensive check for non-Element nodes
        if (el.querySelectorAll) {
          scanForComponents(el);
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
