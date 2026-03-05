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
 * Core themes that are always in the core CSS bundle (accessibility themes).
 * These never need loading.
 */
const CORE_THEMES = new Set([
  'default',
  'a11y-high-contrast',
  'a11y-large-text',
  'a11y-dyslexia',
]);

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
      loadCache.set(themeName, Promise.resolve());
      return;
    }
  }

  const promise = loadThemeCSS(themeName);
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
  const href = `${base}/themes/${themeName}.css`;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.setAttribute('data-vb-theme-preload', themeName);
  document.head.appendChild(link);
}

/**
 * Fetch and cache the bundles manifest
 * @returns {Promise<object>}
 */
async function getBundleManifest() {
  if (bundleManifestCache) return bundleManifestCache;

  const base = detectBase();
  try {
    const res = await fetch(`${base}/bundles/manifest.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bundleManifestCache = await res.json();
  } catch {
    bundleManifestCache = {};
  }
  return bundleManifestCache;
}

/**
 * Internal: load and inject theme CSS
 * Checks themes/ first, then bundles/ for bundle themes.
 * @param {string} themeName
 * @returns {Promise<void>}
 */
async function loadThemeCSS(themeName) {
  const base = detectBase();

  // Check if this is a bundle theme
  const bundleManifest = await getBundleManifest();
  if (bundleManifest[themeName]) {
    return loadBundleCSS(themeName, base);
  }

  // Standard theme loading: try manifest first for correct filename, fall back to convention
  const manifest = await getThemeManifest();
  const entry = manifest[themeName];
  const file = entry ? entry.file : `${themeName}.css`;
  const href = `${base}/themes/${file}`;

  return new Promise((resolve, reject) => {
    // Remove any preload hint for this theme
    const preload = document.querySelector(`link[data-vb-theme-preload="${themeName}"]`);
    if (preload) preload.remove();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-vb-theme', themeName);

    link.onload = () => resolve();
    link.onerror = () => {
      // Remove failed link, clear cache so retry is possible
      link.remove();
      loadCache.delete(themeName);
      reject(new Error(`Failed to load theme: ${themeName}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Internal: load bundle CSS (full.css) and JS (full.js)
 * @param {string} bundleName
 * @param {string} base - CDN base URL
 * @returns {Promise<void>}
 */
function loadBundleCSS(bundleName, base) {
  const cssHref = `${base}/bundles/${bundleName}.full.css`;
  const jsHref = `${base}/bundles/${bundleName}.full.js`;

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    link.setAttribute('data-vb-theme', bundleName);
    link.setAttribute('data-vb-bundle', bundleName);

    link.onload = () => {
      // Also load bundle JS (non-blocking — resolve immediately after CSS)
      import(jsHref).catch(() => {
        // JS effects are optional — CSS tokens are enough for the theme
      });
      resolve();
    };
    link.onerror = () => {
      link.remove();
      loadCache.delete(bundleName);
      reject(new Error(`Failed to load bundle: ${bundleName}`));
    };

    document.head.appendChild(link);
  });
}
