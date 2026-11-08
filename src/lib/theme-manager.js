/**
 * Theme Manager
 * Handles theme persistence, application, and system preference detection.
 *
 * Persistence goes through VBStore (namespace `theme`, key `current`).
 * State is cached in memory after init() so the synchronous getters
 * (load/getState/getEffectiveMode/apply) stay synchronous for callers —
 * settings-panel, theme-picker, external-theme-sync all continue to read
 * state without awaiting. Writes go fire-and-forget to VBStore through the
 * cache, which is the same semantics the old localStorage path had
 * (failures were silent there too).
 *
 * Integrates with ThemeLoader for on-demand CSS loading of externalized themes.
 * init() and setBrand() are async — they ensure theme CSS is loaded before applying.
 *
 * Authored root attributes are page defaults. A page that ships
 * `<html data-fluid data-accent="ocean" data-border-style="sketch">` keeps
 * them until the visitor picks something else (a setter call, or a stored
 * preference); reset() restores them. Same rule as a pinned data-theme.
 *
 * Public API: `window.VB.themeManager`, or the `ThemeManager` export of the
 * bundles (vanilla-breeze.js / -core.js / -autoload.js). Every bundle runs
 * init() on load, so pages call the setters directly.
 *
 * @example
 * const { themeManager: ThemeManager } = window.VB;
 *
 * // Change mode
 * ThemeManager.setMode('dark');
 *
 * // Change brand theme (loads CSS if needed)
 * await ThemeManager.setBrand('swiss');
 *
 * // Change color accent
 * ThemeManager.setAccent('ocean');
 *
 * // Listen for changes
 * window.addEventListener('vb:theme-change', (e) => {
 *   console.log(e.detail); // { mode: 'dark', brand: 'swiss', accent: 'ocean' }
 * });
 */

import { ensureThemeLoaded } from './theme-loader.js';
import { COLOR_ACCENTS } from './theme-data.js';
import { VBStore } from './vb-store.js';

const NS = 'theme';
const KEY = 'current';

/**
 * Storage schema. v2: a root-attribute key holding null means "no choice —
 * use the page's authored attribute". v1 blobs wrote every key on every
 * save ('' / accent 'default'), so those values never recorded a choice.
 */
const STATE_VERSION = 2;

/** Root attributes a page may author as its own defaults, by pref key. */
export const ROOT_ATTRS = /** @type {const} */ ({
  accent: 'data-accent',
  borderStyle: 'data-border-style',
  iconSet: 'data-icon-set',
  fluid: 'data-fluid',
  backdrop: 'data-backdrop',
  backdropChrome: 'data-backdrop-chrome',
});

/** @type {VBThemePrefs} */
const DEFAULTS = { mode: 'auto', brand: 'default', accent: null, borderStyle: null, iconSet: null, fluid: null, backdrop: null, backdropChrome: null, pageBgType: '', pageBgColor: '', pageBgGradStart: '', pageBgGradEnd: '', pageBgGradDir: '' };

/**
 * Upgrade a stored blob to the current schema: v1 '' / accent 'default'
 * values become null (= page default). Pure.
 *
 * @param {any} stored
 * @returns {Partial<VBThemePrefs>|null}
 */
export function normalizeStored(stored) {
  if (!stored || typeof stored !== 'object') return null;
  const out = { ...stored };
  if (!(Number(out.v) >= STATE_VERSION)) {
    for (const key of Object.keys(ROOT_ATTRS)) {
      if (out[key] === '' || (key === 'accent' && out[key] === 'default')) out[key] = null;
    }
  }
  return out;
}

/**
 * Resolve a root-attribute preference against the page's authored value:
 * no preference (null/undefined) → the authored value; any string —
 * including '' (explicitly off) — wins. Pure.
 *
 * @param {string|null|undefined} pref
 * @param {string|null} [authored]
 * @returns {string}
 */
export function resolveRootPref(pref, authored) {
  return pref == null ? (authored ?? '') : pref;
}

/** @type {Record<string, string|null>|null} */
let _authored = null;

/**
 * The root attributes as the page authored them. The docs boot script
 * writes stored prefs onto <html> before any module runs, so it snapshots
 * the authored values first (window.__vbAuthoredRoot, keyed by attribute
 * name, null = absent); without a boot script the live attributes are
 * still the authored ones. Values are null when the attribute is absent.
 * @returns {Record<string, string|null>}
 */
function authoredRoot() {
  if (_authored) return _authored;
  const root = document.documentElement;
  const boot = /** @type {any} */ (window).__vbAuthoredRoot;
  /** @param {string} attr */
  const read = (attr) => (boot && typeof boot === 'object' && attr in boot)
    ? (boot[attr] ?? null)
    : root.getAttribute(attr);
  /** @type {Record<string, string|null>} */
  const snap = { theme: read('data-theme'), mode: read('data-mode'), themeSource: read('data-theme-source') };
  for (const [key, attr] of Object.entries(ROOT_ATTRS)) snap[key] = read(attr);
  _authored = snap;
  return snap;
}

/**
 * Convert any CSS colour the browser computed (rgb(), oklch(), …) to
 * #rrggbb — the form every browser accepts in <meta name="theme-color">.
 * @param {string} color
 * @returns {string}
 */
function toHexColor(color) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return color;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
  } catch {
    return color;
  }
}

/**
 * The brand token a page pinned via `<html data-theme="…">`, ignoring a11y
 * modifiers. Empty string when nothing is pinned. Pure (no DOM).
 *
 * @param {string} [domTheme] - the authored `data-theme` attribute value
 * @returns {string}
 */
export function pinnedBrandFrom(domTheme) {
  return (domTheme || '').split(/\s+/).find((t) => t && !t.startsWith('a11y-')) || '';
}

/**
 * Rebuild the `data-theme` token list for a brand change. Removes the token
 * the manager last wrote (`managed`) and the new brand, keeps every other
 * token (a11y ids, a site's adjustment id, …) in order, and puts the brand
 * first unless it is `'default'`. Pure.
 *
 * @param {string} current - the live `data-theme` value
 * @param {string} managed - the brand the manager last wrote ('' if none)
 * @param {string} brand - the brand to apply
 * @returns {string}
 */
export function mergeThemeTokens(current, managed, brand) {
  const rest = (current || '').split(/\s+/).filter((t) => t && t !== managed && t !== brand);
  return (brand !== 'default' ? [brand, ...rest] : rest).join(' ');
}

/**
 * A page-authored `data-mode` that forces a scheme: only light/dark count.
 * Pure.
 *
 * @param {string|null|undefined} authoredMode
 * @returns {'light'|'dark'|null}
 */
export function pageModeFrom(authoredMode) {
  return authoredMode === 'light' || authoredMode === 'dark' ? authoredMode : null;
}

/**
 * The scheme to show: a page-forced mode wins unless the visitor chose a
 * mode this session (setMode clears the page mode); else the stored
 * preference, with `auto` following the system. Pure.
 *
 * @param {'auto'|'light'|'dark'} prefMode
 * @param {'light'|'dark'|null} pageMode
 * @param {boolean} systemDark
 * @returns {'light'|'dark'}
 */
export function effectiveModeFor(prefMode, pageMode, systemDark) {
  if (pageMode) return pageMode;
  if (prefMode === 'light' || prefMode === 'dark') return prefMode;
  return systemDark ? 'dark' : 'light';
}

/**
 * Resolve the brand to apply on init(). A brand the page pinned via
 * `<html data-theme="…">` (theme-showcase demos, a site built on one theme)
 * is that page's default: it is replaced only by a stored preference that
 * names a different, explicit brand. A stored preference with no brand (a
 * visitor only toggled light/dark) or with the generic `default` (a reset,
 * or a pick made on another page of the same origin) falls through to the
 * pin, then to the framework default. Pure (no DOM) for unit testing.
 *
 * With `source === 'site'` (`<html data-theme-source="site">`: the site
 * owner chose the theme) a pinned brand wins over any stored brand.
 *
 * @param {Partial<VBThemePrefs>|null} stored - persisted prefs, or null if none
 * @param {string} [domTheme] - the authored `data-theme` attribute value
 * @param {string|null} [source] - the authored `data-theme-source` value
 * @returns {string} the brand id to apply
 */
export function resolveInitialBrand(stored, domTheme, source) {
  if (source === 'site' && pinnedBrandFrom(domTheme)) return pinnedBrandFrom(domTheme);
  if (stored?.brand && stored.brand !== DEFAULTS.brand) return stored.brand;
  return pinnedBrandFrom(domTheme) || DEFAULTS.brand;
}

const SEED_PROPERTIES = [
  '--hue-primary', '--hue-secondary', '--hue-accent',
  '--lightness-primary', '--chroma-primary',
  '--lightness-secondary', '--chroma-secondary',
  '--lightness-accent', '--chroma-accent'
];

/** @type {VBThemePrefs|null} In-memory cache populated on init() */
let _state = null;

/** Brand the page pinned via `<html data-theme>` before init() rewrote it. */
let _pinnedBrand = '';

/** Brand token the manager last wrote into `data-theme` ('' = none). */
let _appliedBrand = '';

/** @type {'light'|'dark'|null} Scheme the page forced via an authored `data-mode`. */
let _pageMode = null;

/** @type {string|null} The authored `data-theme-source` ('site' = the site owner chose the theme). */
let _themeSource = null;

export const ThemeManager = {
  /**
   * Initialize theme from storage or defaults
   * Loads saved brand CSS before applying (prevents FOUC for returning visitors)
   * Falls back to default on network error.
   * @returns {Promise<VBThemePrefs>}
   */
  /** @type {Promise<VBThemePrefs>|null} */
  _initPromise: null,

  async init() {
    // Idempotent — second call awaits the first
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      const stored = normalizeStored(await VBStore.get(NS, KEY));
      _state = stored ? { ...DEFAULTS, ...stored } : { ...DEFAULTS };
      // A brand the page pinned via <html data-theme="…"> is this page's
      // default; only an explicit, different stored brand replaces it.
      // Read from the authored snapshot: the boot script may already have
      // written the stored brand onto <html>.
      _pinnedBrand = pinnedBrandFrom(authoredRoot().theme ?? '');
      _appliedBrand = _pinnedBrand;
      _themeSource = authoredRoot().themeSource ?? null;
      // _state.mode stays the stored preference, never the page's, so
      // save() cannot persist a page-forced mode.
      _pageMode = pageModeFrom(authoredRoot().mode);
      _state.brand = resolveInitialBrand(stored, _pinnedBrand, _themeSource);

      // Load saved brand CSS before applying
      try {
        await ensureThemeLoaded(_state.brand);
      } catch {
        // Load failed. A pinned brand stays: the page ships its own CSS for
        // it (a site theme VB has no file for would 404 here and used to
        // lose its data-theme on every first load). A stored brand that
        // fails is a network error — fall back to the pin, then default.
        if (_state.brand !== _pinnedBrand) _state.brand = _pinnedBrand || DEFAULTS.brand;
      }

      this.apply(_state);
      this._watchSystemPreference();
      this._watchRootAttributes();
      this._watchCrossDocumentStorage();
      return _state;
    })();

    return this._initPromise;
  },

  /**
   * Cross-document theme sync via the localStorage `storage` event.
   *
   * When a parent page changes the theme, VBStore writes to localStorage
   * under `vb:theme:current`. Same-origin sibling documents (notably
   * iframes inside <browser-window> demos) receive a `storage` event for
   * that key. Without this listener, those iframes keep rendering the
   * stale theme until a manual reload — the bug the user reports as
   * "browser-window content doesn't follow the parent's theme switch."
   *
   * The writer's own window does NOT receive this event, so this never
   * loops back on the page that initiated the change.
   *
   * @private
   */
  _watchCrossDocumentStorage() {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', async (e) => {
      if (e.key !== `vb:${NS}:${KEY}` || !e.newValue) return;

      let next;
      try {
        const envelope = JSON.parse(e.newValue);
        next = normalizeStored(envelope?.data);
      } catch {
        return;
      }
      if (!next) return;

      const merged = { ...DEFAULTS, ..._state, ...next };
      // Same precedence as init(): this document's pinned brand beats a
      // sibling's `default` or a mode-only change.
      merged.brand = resolveInitialBrand(next, _pinnedBrand, _themeSource);

      /* Brand CSS pack may not be loaded in this document yet — fetch
         before applying so the new tokens land before the data-theme
         attribute swap. Failures fall back to the pin, then default, to
         avoid leaving the document in a half-themed state. */
      if (merged.brand && merged.brand !== _state?.brand) {
        try {
          await ensureThemeLoaded(merged.brand);
        } catch {
          merged.brand = _pinnedBrand || DEFAULTS.brand;
        }
      }

      _state = merged;
      this.apply(/** @type {Partial<VBThemePrefs>} */ (_state || {}));
    });
  },

  /**
   * Load theme preferences from the in-memory cache (populated by init()).
   * Synchronous for caller convenience; reflects the latest committed state.
   * @returns {VBThemePrefs}
   */
  load() {
    return _state ? { ..._state } : { ...DEFAULTS };
  },

  /**
   * Save theme preferences. Updates the in-memory cache synchronously and
   * fires the VBStore write asynchronously (errors swallowed, matching the
   * historical localStorage behavior).
   * @param {Partial<VBThemePrefs>} prefs - Partial preferences to update
   * @returns {VBThemePrefs} - Updated full preferences
   */
  save(prefs) {
    const updated = { ...(_state ?? DEFAULTS), ...prefs, v: STATE_VERSION };
    _state = updated;
    VBStore.set(NS, KEY, updated).catch(() => { /* ignore */ });
    return updated;
  },

  /**
   * Apply theme to document root.
   *
   * Root-attribute prefs (fluid, backdrop, backdropChrome, borderStyle,
   * iconSet, and the cached accent) that are null/undefined fall back to
   * the page's authored attribute, so a page's own `<html data-fluid>` is
   * never stripped just because the visitor has no preference.
   * @param {Partial<VBThemePrefs>} prefs
   */
  apply({ mode = 'auto', brand = 'default', borderStyle = null, iconSet = null, fluid = null, backdrop = null, backdropChrome = null, pageBgType = '', pageBgColor = '', pageBgGradStart = '', pageBgGradEnd = '', pageBgGradDir = '' } = {}) {
    const root = document.documentElement;
    const authored = authoredRoot();

    // Apply mode — always set data-mode to effective value so theme
    // light/dark selectors match even in auto mode (OS-preference-driven)
    const effectiveMode = effectiveModeFor(/** @type {'auto'|'light'|'dark'} */ (mode), _pageMode, window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.mode = effectiveMode;

    // Brand — replace only the token the manager wrote; a11y ids and any
    // ids the page set (a site's adjustment theme) survive.
    const merged = mergeThemeTokens(root.dataset.theme || '', _appliedBrand, brand);
    if (merged) {
      root.dataset.theme = merged;
    } else {
      delete root.dataset.theme;
    }
    _appliedBrand = brand === 'default' ? '' : brand;

    // Border style / icon set — a chosen value, else the page's authored
    // attribute, else the theme's CSS hint. 'clean' / 'lucide' are the
    // framework defaults and need no attribute.
    const borderPref = borderStyle || authored.borderStyle || this._readCSSHint('--theme-border-style');
    this._setRootAttr('data-border-style', borderPref && borderPref !== 'clean' ? borderPref : '');

    const iconPref = iconSet || authored.iconSet || this._readCSSHint('--theme-icon-set');
    this._setRootAttr('data-icon-set', iconPref && iconPref !== 'lucide' ? iconPref : '');

    // Fluid scaling, canvas backdrop, backdrop chrome: pref → authored.
    // An explicit '' (setFluid('')) turns an authored value off.
    const fluidVal = resolveRootPref(fluid, authored.fluid);
    this._setRootAttr('data-fluid', fluidVal, true);

    const backdropVal = resolveRootPref(backdrop, authored.backdrop);
    this._setRootAttr('data-backdrop', backdropVal, true);

    const chromeVal = resolveRootPref(backdropChrome, authored.backdropChrome);
    this._setRootAttr('data-backdrop-chrome', chromeVal && chromeVal !== 'card' ? chromeVal : '');

    // Page background overrides
    if (pageBgType === 'color' && pageBgColor) {
      root.style.setProperty('--page-bg-color', pageBgColor);
      root.style.removeProperty('--page-bg-gradient');
    } else if (pageBgType === 'gradient' && pageBgGradStart && pageBgGradEnd) {
      const dir = pageBgGradDir || 'to bottom';
      root.style.setProperty('--page-bg-gradient', `linear-gradient(${dir}, ${pageBgGradStart}, ${pageBgGradEnd})`);
      root.style.removeProperty('--page-bg-color');
    } else {
      root.style.removeProperty('--page-bg-color');
      root.style.removeProperty('--page-bg-gradient');
    }

    // Colour accent (data-accent on <html>): cached pref → authored
    this._applyAccent(this.load().accent);
    const accent = this.getState().accent;

    this._syncThemeColor();

    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('vb:theme-change', {
      detail: { mode, brand, accent, borderStyle: borderPref, iconSet: iconPref, fluid: fluidVal, backdrop: backdropVal, backdropChrome: chromeVal, pageBgType, effectiveMode }
    }));
  },

  /**
   * Set or remove a root attribute. With `keepEmpty`, a present-but-empty
   * authored attribute (`<html data-fluid>`) is kept as such.
   * @param {string} attr
   * @param {string} value - '' removes the attribute
   * @param {boolean} [keepEmpty]
   * @private
   */
  _setRootAttr(attr, value, keepEmpty = false) {
    const root = document.documentElement;
    if (value) {
      root.setAttribute(attr, value);
    } else if (keepEmpty && this._authoredHas(attr)) {
      root.setAttribute(attr, '');
    } else {
      root.removeAttribute(attr);
    }
  },

  /**
   * Was `attr` authored on <html> as a bare boolean attribute? (`data-fluid`
   * with no value is the documented "default preset" form.) Only true when
   * no preference turned it off explicitly.
   * @param {string} attr
   * @returns {boolean}
   * @private
   */
  _authoredHas(attr) {
    const key = Object.keys(ROOT_ATTRS).find((k) => ROOT_ATTRS[/** @type {keyof typeof ROOT_ATTRS} */ (k)] === attr);
    if (!key) return false;
    const pref = /** @type {any} */ (this.load())[key];
    return pref == null && authoredRoot()[key] != null;
  },

  /**
   * Point <meta name="theme-color"> at the page's painted background (the
   * <html> background: --page-bg-color, else --color-surface; falls back to
   * --color-background), so the browser chrome follows mode / brand
   * changes — the docs boot script only seeds it. The media-scoped
   * light/dark pair collapses to one value: the mode is known now. No-op
   * when the page has no theme-color meta.
   * @private
   */
  _syncThemeColor() {
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (!metas.length) return;
    /** @param {string} c */
    const isClear = (c) => !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c);
    let computed = getComputedStyle(document.documentElement).backgroundColor;
    if (isClear(computed)) {
      const probe = document.createElement('span');
      probe.style.setProperty('position', 'absolute');
      probe.style.setProperty('background-color', 'var(--color-background)');
      (document.body || document.documentElement).append(probe);
      computed = getComputedStyle(probe).backgroundColor;
      probe.remove();
    }
    if (isClear(computed)) return;
    const hex = toHexColor(computed);
    metas.forEach((meta) => {
      meta.removeAttribute('media');
      meta.setAttribute('content', hex);
    });
  },

  /**
   * Set color mode preference
   * @param {'auto' | 'light' | 'dark'} mode
   */
  setMode(mode) {
    _pageMode = null; // the visitor's choice beats the page's forced mode
    const updated = this.save({ mode });
    this.apply(updated);
  },

  /**
   * Set brand theme
   * Loads theme CSS if needed before applying.
   * @param {string} brand - Theme name (e.g., 'ocean', 'forest', 'sunset')
   * @returns {Promise<void>}
   */
  async setBrand(brand) {
    try {
      await ensureThemeLoaded(brand);
    } catch (err) {
      console.warn(`[VB] Theme "${brand}" failed to load, using default`, err);
      brand = 'default';
    }
    const updated = this.save({ brand });
    this.apply(updated);
  },

  /**
   * Set color accent
   * @param {string} accentId - Accent ID from COLOR_ACCENTS (e.g., 'ocean', 'forest', 'sunset')
   */
  setAccent(accentId) {
    this.save({ accent: accentId });
    this._applyAccent(accentId);
    this._syncThemeColor();
    // Dispatch event
    window.dispatchEvent(new CustomEvent('vb:theme-change', {
      detail: { ...this.getState() }
    }));
  },

  /**
   * Set border style preference
   * @param {string} borderStyle - Border style name (e.g., 'sharp', 'sketch', 'kawaii')
   */
  setBorderStyle(borderStyle) {
    const updated = this.save({ borderStyle });
    this.apply(updated);
  },

  /**
   * Set icon set preference
   * @param {string} iconSet - Icon set name (e.g., 'lucide', 'phosphor', 'tabler')
   */
  setIconSet(iconSet) {
    const updated = this.save({ iconSet });
    this.apply(updated);
  },

  /**
   * Set fluid scaling preference
   * @param {string} fluid - Fluid preset ('' | 'default' | 'compact' | 'spacious')
   */
  setFluid(fluid) {
    const updated = this.save({ fluid });
    this.apply(updated);
  },

  /**
   * Set canvas backdrop preference
   * @param {string} backdrop - Backdrop preset ('' | 'default' | 'flush' | 'elevated')
   */
  setBackdrop(backdrop) {
    const updated = this.save({ backdrop });
    this.apply(updated);
  },

  /**
   * Set backdrop chrome mode
   * @param {string} chrome - Chrome mode, space-separated ('' | 'card' | 'stretch' | 'integrated' | 'fixed' | 'stretch fixed' | etc.)
   */
  setBackdropChrome(chrome) {
    const updated = this.save({ backdropChrome: chrome });
    this.apply(updated);
  },

  /**
   * Set page background override
   * @param {{ type?: string, color?: string, gradStart?: string, gradEnd?: string, gradDir?: string }} opts
   */
  setPageBg({ type = '', color = '', gradStart = '', gradEnd = '', gradDir = '' } = {}) {
    const updated = this.save({ pageBgType: type, pageBgColor: color, pageBgGradStart: gradStart, pageBgGradEnd: gradEnd, pageBgGradDir: gradDir });
    this.apply(updated);
  },

  /**
   * Get current effective mode (resolves 'auto' to actual mode)
   * @returns {'light' | 'dark'}
   */
  getEffectiveMode() {
    const { mode } = this.load();
    return effectiveModeFor(/** @type {'auto'|'light'|'dark'} */ (mode), _pageMode, window.matchMedia('(prefers-color-scheme: dark)').matches);
  },

  /**
   * Get current theme state
   * @returns {VBThemeState}
   */
  getState() {
    const { mode, brand, accent, borderStyle, iconSet, fluid, backdrop, backdropChrome, pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir } = this.load();
    // Root-attribute keys resolve to what the page shows: the visitor's
    // choice, else the authored attribute.
    /** @type {Record<string, string|null>} */
    const a = typeof document === 'undefined' ? {} : authoredRoot();
    // A bare authored `<html data-fluid>` / `data-backdrop` is the default
    // preset, not "off": report it as 'default' so UIs show it switched on.
    /**
     * @param {'fluid'|'backdrop'} key
     * @param {string|null} pref
     */
    const preset = (key, pref) => (pref == null && a[key] === '') ? 'default' : resolveRootPref(pref, a[key]);
    return {
      mode, brand,
      accent: resolveRootPref(accent, a.accent) || 'default',
      borderStyle: resolveRootPref(borderStyle, a.borderStyle),
      iconSet: resolveRootPref(iconSet, a.iconSet),
      fluid: preset('fluid', fluid),
      backdrop: preset('backdrop', backdrop),
      backdropChrome: resolveRootPref(backdropChrome, a.backdropChrome),
      pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir,
      effectiveMode: this.getEffectiveMode(),
    };
  },

  /**
   * Toggle between light and dark modes
   * If currently 'auto', switches to opposite of system preference
   */
  toggleMode() {
    const effectiveMode = this.getEffectiveMode();
    const newMode = effectiveMode === 'dark' ? 'light' : 'dark';
    this.setMode(newMode);
  },

  /**
   * Reset to the default theme — for a page that pinned a brand via
   * `<html data-theme>`, that pin is its default, and authored root
   * attributes (data-fluid, data-accent, …) come back.
   */
  reset() {
    _state = { ...DEFAULTS, brand: _pinnedBrand || DEFAULTS.brand };
    _pageMode = pageModeFrom(authoredRoot().mode);
    VBStore.remove(NS, KEY).catch(() => { /* ignore */ });
    const root = document.documentElement;
    root.style.removeProperty('--page-bg-color');
    root.style.removeProperty('--page-bg-gradient');
    // Clear accent seed inline styles
    for (const prop of SEED_PROPERTIES) {
      root.style.removeProperty(prop);
    }
    this.apply(_state);
  },

  /**
   * Read a CSS custom property hint from the computed style of :root
   * Themes declare hints like --theme-border-style: sketch
   * @param {string} property - CSS custom property name
   * @returns {string} Trimmed value or empty string
   * @private
   */
  _readCSSHint(property) {
    return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
  },

  /**
   * Apply a colour accent by setting data-accent on <html>. The seeds and
   * their dark-mode variants live in src/tokens/themes/_accents.css
   * (generated from COLOR_ACCENTS), so the same accent also works on any
   * element (vanilla-breeze-5z8i). Inline seeds from older versions are
   * cleared.
   *
   * No preference (null) keeps the page's authored data-accent, verbatim
   * (a site may define its own accent in CSS). A chosen id applies only if
   * it is a known accent; 'default' or an unknown id removes it.
   * @param {string|null|undefined} accentId - Accent ID from COLOR_ACCENTS
   * @private
   */
  _applyAccent(accentId) {
    const root = document.documentElement;
    for (const prop of SEED_PROPERTIES) {
      root.style.removeProperty(prop);
    }
    if (accentId == null) {
      const authored = authoredRoot().accent;
      if (authored) root.dataset.accent = authored;
      else delete root.dataset.accent;
      return;
    }
    const entry = COLOR_ACCENTS.find(a => a.id === accentId);
    if (!entry || !entry.seeds || Object.keys(entry.seeds).length === 0) {
      delete root.dataset.accent;
      return;
    }
    root.dataset.accent = entry.id;
  },

  /**
   * Watch for external edits to data-theme / data-mode on <html>.
   *
   * When someone (DevTools, a userscript, a server-rendered attribute, a
   * test harness) changes these attributes directly, we react: lazy-load
   * the brand stylesheet if needed, update the in-memory cache, and fire
   * vb:theme-change so UI (theme-picker, external-theme-sync, etc.) reflects
   * the new state. We do NOT write through to VBStore — session-scoped by
   * design. Callers that want persistence should use setBrand()/setMode().
   *
   * Feedback-loop guard: the handler is a no-op when the attribute value
   * already matches the cached state, which is exactly what apply() leaves
   * after every internal write.
   * @private
   */
  _watchRootAttributes() {
    if (this._rootObserver) return;
    this._rootObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') this._syncFromDataTheme();
        else if (m.attributeName === 'data-mode') this._syncFromDataMode();
      }
    });
    this._rootObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-mode'],
    });
  },

  /**
   * Pick up a brand change driven from outside the API.
   * @private
   */
  _syncFromDataTheme() {
    if (!_state) return;
    const raw = document.documentElement.dataset.theme || '';
    const tokens = raw.split(/\s+/).filter(Boolean);
    const brand = tokens.find(t => !t.startsWith('a11y-')) || 'default';
    if (brand === _state.brand) return; // our own write or a no-op edit
    _state.brand = brand;
    // Fire-and-forget lazy-load. A bogus brand ("made-up") 404s and the
    // page falls back to the already-applied tokens — no crash.
    ensureThemeLoaded(brand).catch(() => { /* bad brand name — ignore */ });
    window.dispatchEvent(new CustomEvent('vb:theme-change', {
      detail: { ...this.getState() }
    }));
  },

  /**
   * Pick up a mode change driven from outside the API.
   * Modes are pure CSS (no lazy-load), so this is just state + event sync.
   * @private
   */
  _syncFromDataMode() {
    if (!_state) return;
    const raw = document.documentElement.dataset.mode || 'auto';
    const effective = this.getEffectiveMode();
    if (raw === effective) return; // our own write or a no-op edit
    _pageMode = null; // an outside write is an explicit override
    // Treat the attribute as an explicit session-scoped override. 'auto'
    // can't be expressed directly on the attribute (we always write the
    // effective value), so we only see concrete 'light'/'dark' here.
    _state.mode = /** @type {'light' | 'dark'} */ (raw);
    this._syncThemeColor();
    window.dispatchEvent(new CustomEvent('vb:theme-change', {
      detail: { ...this.getState() }
    }));
  },

  /**
   * Watch for system preference changes
   * @private
   */
  _watchSystemPreference() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const saved = this.load();
      if (saved.mode === 'auto') {
        // Re-apply to update data-mode and dispatch theme-change event
        this.apply(saved);
      }
    });
  }
};

// Public entry point for sites: window.VB.themeManager (vb.js keeps it when
// it installs the effects runtime on window.VB; VB.theme is the effects
// runtime's own token helper).
if (typeof window !== 'undefined') {
  const ns = /** @type {any} */ (window).VB ?? (/** @type {any} */ (window).VB = {});
  ns.themeManager ??= ThemeManager;
}
