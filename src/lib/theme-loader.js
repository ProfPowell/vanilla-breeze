/**
 * ThemeLoader — on-demand CSS loading for externalized themes
 *
 * Decorative themes (brand-*, extreme-*) are no longer in the core CSS bundle.
 * This module fetches them as individual CSS files and injects <link> elements.
 *
 * Base URL detection priority:
 *   1. window.__VB_THEME_BASE (explicit config)
 *   2. Auto-detect from <script src> containing "vanilla-breeze"
 *   3. Fallback to "/cdn"
 *
 * @example
 * import { ensureThemeLoaded, preloadTheme, setThemeBase } from './theme-loader.js';
 *
 * // Load theme CSS before applying
 * await ensureThemeLoaded('ocean');
 *
 * // Preload for instant switching
 * preloadTheme('forest');
 *
 * // Override base URL
 * setThemeBase('https://cdn.example.com/themes');
 */

/** @type {Map<string, Promise<void>>} */
const loadCache = new Map();

/** @type {Map<string, Promise<void>>} */
const packScriptCache = new Map();

/** @type {object|null} */
let manifestCache = null;

/** @type {object|null} */
let bundleManifestCache = null;

/** @type {string|null} */
let baseOverride = null;

/**
 * Set explicit base URL for theme files
 * @param {string} url - Base URL (directory containing themes/)
 */
export function setThemeBase(url) {
  baseOverride = url.replace(/\/$/, '');
}

/**
 * Detect the base URL for theme files
 * @returns {string}
 */
function detectBase() {
  // 1. Explicit global
  if (typeof window !== 'undefined' && window.__VB_THEME_BASE) {
    return String(window.__VB_THEME_BASE).replace(/\/$/, '');
  }

  // 2. Explicit override via setThemeBase()
  if (baseOverride) return baseOverride;

  // 3. Auto-detect from script src
  if (typeof document !== 'undefined') {
    const scripts = document.querySelectorAll('script[src*="vanilla-breeze"]');
    for (const script of scripts) {
      const src = script.getAttribute('src');
      if (src) {
        // e.g. "/cdn/vanilla-breeze-core.js" → "/cdn"
        const idx = src.lastIndexOf('/');
        if (idx !== -1) return src.slice(0, idx);
      }
    }
  }

  // 4. Fallback
  return '/cdn';
}

/**
 * Fetch and cache the themes manifest
 * @returns {Promise<object>}
 */
export async function getThemeManifest() {
  if (manifestCache) return manifestCache;

  const base = detectBase();
  try {
    const res = await fetch(`${base}/themes/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifestCache = await res.json();
  } catch {
    // Return empty manifest on failure — all themes will use fallback naming
    manifestCache = {};
  }
  return manifestCache;
}

/**
 * Core themes that are always in the core CSS bundle.
 * Includes default, personality themes, and accessibility themes.
 * Color accents are NOT here — they use ThemeManager.setAccent() inline styles.
 * These never need loading — they switch instantly with zero network requests.
 */
const CORE_THEMES = new Set([
  'default',
  'a11y-high-contrast',
  'a11y-large-text',
  'a11y-dyslexia',
  'modern', 'minimal', 'classic',
]);

/**
 * Pack-backed themes that load from /cdn/packs/*.full.css
 * These also have optional JS enhancements.
 */
const PACK_THEMES = new Set([
  'kawaii',
  'retro',
  'memphis',
]);

function isPackTheme(themeName) {
  return PACK_THEMES.has(themeName);
}

function getThemeHref(themeName, base) {
  return isPackTheme(themeName)
    ? `${base}/packs/${themeName}.full.css`
    : `${base}/themes/${themeName}.css`;
}

function ensurePackScriptLoaded(packName, base) {
  if (!isPackTheme(packName)) return Promise.resolve();
  if (packScriptCache.has(packName)) return packScriptCache.get(packName);

  const promise = import(`${base}/packs/${packName}.full.js`).catch(() => {
    // JS effects are optional — CSS tokens are enough for the theme
  });

  packScriptCache.set(packName, promise);
  return promise;
}

function waitForExistingThemeLink(link, themeName) {
  const base = detectBase();
  const loadPackScript = () => {
    if (isPackTheme(themeName) || link.hasAttribute('data-vb-pack')) {
      void ensurePackScriptLoaded(themeName, base);
    }
  };

  if (link.getAttribute('data-vb-theme-state') === 'error') {
    return Promise.reject(new Error(`Failed to load theme: ${themeName}`));
  }

  if (link.getAttribute('data-vb-theme-state') === 'ready' || link.sheet) {
    loadPackScript();
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const handleLoad = () => {
      link.setAttribute('data-vb-theme-state', 'ready');
      cleanup();
      loadPackScript();
      resolve();
    };
    const handleError = () => {
      link.setAttribute('data-vb-theme-state', 'error');
      loadCache.delete(themeName);
      cleanup();
      reject(new Error(`Failed to load theme: ${themeName}`));
    };
    const cleanup = () => {
      link.removeEventListener('load', handleLoad);
      link.removeEventListener('error', handleError);
    };

    link.addEventListener('load', handleLoad, { once: true });
    link.addEventListener('error', handleError, { once: true });
  });
}

/**
 * Ensure a theme's CSS is loaded and available
 *
 * Returns immediately for core/cached themes.
 * Fetches CSS, injects <link data-vb-theme>, and awaits load for external themes.
 *
 * @param {string} themeName - Theme identifier (e.g. 'ocean', 'cyber')
 * @returns {Promise<void>}
 */
export async function ensureThemeLoaded(themeName) {
  // Core themes are always available
  if (!themeName || CORE_THEMES.has(themeName)) return;

  // Already loaded or loading
  if (loadCache.has(themeName)) return loadCache.get(themeName);

  // Check if a <link data-vb-theme> for this theme already exists in DOM
  // (user may have pre-loaded it manually)
  if (typeof document !== 'undefined') {
    const existing = document.querySelector(`link[data-vb-theme="${themeName}"]`);
    if (existing) {
      const promise = waitForExistingThemeLink(existing, themeName);
      loadCache.set(themeName, promise);
      return promise;
    }
  }

  const base = detectBase();
  const promise = isPackTheme(themeName)
    ? loadPackCSS(themeName, base)
    : loadThemeCSS(themeName, base);
  loadCache.set(themeName, promise);
  return promise;
}

/**
 * Preload a theme CSS file without blocking
 * Uses <link rel="preload"> for non-blocking fetch
 *
 * @param {string} themeName - Theme identifier
 */
export function preloadTheme(themeName) {
  if (!themeName || CORE_THEMES.has(themeName)) return;
  if (loadCache.has(themeName)) return;
  if (typeof document === 'undefined') return;

  // Check if already preloaded or loaded
  const existing = document.querySelector(`link[data-vb-theme="${themeName}"]`);
  if (existing) return;

  const base = detectBase();
  const href = getThemeHref(themeName, base);

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.setAttribute('data-vb-theme-preload', themeName);
  document.head.appendChild(link);
}

/**
 * Fetch and cache the packs manifest
 * @returns {Promise<object>}
 */
async function getPackManifest() {
  if (bundleManifestCache) return bundleManifestCache;

  const base = detectBase();
  try {
    const res = await fetch(`${base}/packs/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bundleManifestCache = await res.json();
  } catch {
    // Fallback to legacy bundles/ path for backwards compat
    try {
      const res = await fetch(`${base}/bundles/manifest.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      bundleManifestCache = await res.json();
    } catch {
      bundleManifestCache = {};
    }
  }
  return bundleManifestCache;
}

/**
 * Internal: load and inject theme CSS
 * @param {string} themeName
 * @param {string} base
 * @returns {Promise<void>}
 */
async function loadThemeCSS(themeName, base) {
  const href = getThemeHref(themeName, base);
  return new Promise((resolve, reject) => {
    // Remove any preload hint for this theme
    const preload = document.querySelector(`link[data-vb-theme-preload="${themeName}"]`);
    if (preload) preload.remove();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-vb-theme', themeName);
    link.setAttribute('data-vb-theme-state', 'loading');

    link.onload = () => {
      link.setAttribute('data-vb-theme-state', 'ready');
      resolve();
    };
    link.onerror = () => {
      // Remove failed link, clear cache so retry is possible
      link.setAttribute('data-vb-theme-state', 'error');
      link.remove();
      loadCache.delete(themeName);
      reject(new Error(`Failed to load theme: ${themeName}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Internal: load pack CSS (full.css) and JS (full.js)
 * @param {string} packName
 * @param {string} base - CDN base URL
 * @returns {Promise<void>}
 */
function loadPackCSS(packName, base) {
  const cssHref = `${base}/packs/${packName}.full.css`;

  return new Promise((resolve, reject) => {
    const preload = document.querySelector(`link[data-vb-theme-preload="${packName}"]`);
    if (preload) preload.remove();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.setAttribute('data-vb-theme', packName);
    link.setAttribute('data-vb-pack', packName);
    link.setAttribute('data-vb-theme-state', 'loading');

    link.onload = () => {
      link.setAttribute('data-vb-theme-state', 'ready');
      void ensurePackScriptLoaded(packName, base);
      resolve();
    };
    link.onerror = () => {
      link.setAttribute('data-vb-theme-state', 'error');
      link.remove();
      loadCache.delete(packName);
      reject(new Error(`Failed to load pack: ${packName}`));
    };

    document.head.appendChild(link);
  });
}
