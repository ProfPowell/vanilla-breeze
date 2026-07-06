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
 * @example
 * import { ThemeManager } from './lib/theme-manager.js';
 *
 * // Initialize on page load (loads saved theme CSS)
 * await ThemeManager.init();
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
const DEFAULTS = { mode: 'auto', brand: 'default', accent: 'default', borderStyle: '', iconSet: '', fluid: '', backdrop: '', backdropChrome: '', pageBgType: '', pageBgColor: '', pageBgGradStart: '', pageBgGradEnd: '', pageBgGradDir: '' };

/**
 * Resolve the brand to apply on init(). A stored user preference always wins
 * (even a partial one without a `brand` resolves to the default, never falling
 * through to the page); otherwise honor a brand the page pinned via
 * `<html data-theme="…">` (e.g.
 * theme-showcase demos) so init() doesn't clobber it with the default;
 * otherwise fall back to the default brand. Pure (no DOM) for unit testing.
 *
 * @param {Partial<VBThemePrefs>|null} stored - persisted prefs, or null if none
 * @param {string} [domTheme] - the current `data-theme` attribute value
 * @returns {string} the brand id to apply
 */
export function resolveInitialBrand(stored, domTheme) {
  if (stored) return stored.brand || DEFAULTS.brand;
  const pinned = (domTheme || '').split(/\s+/).find((t) => t && !t.startsWith('a11y-'));
  return pinned || DEFAULTS.brand;
}

const SEED_PROPERTIES = [
  '--hue-primary', '--hue-secondary', '--hue-accent',
  '--lightness-primary', '--chroma-primary',
  '--lightness-secondary', '--chroma-secondary',
  '--lightness-accent', '--chroma-accent'
];

/** @type {VBThemePrefs|null} In-memory cache populated on init() */
let _state = null;

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
      const stored = /** @type {Partial<VBThemePrefs>|null} */ (await VBStore.get(NS, KEY));
      _state = stored ? { ...DEFAULTS, ...stored } : { ...DEFAULTS };
      // With no saved preference, honor a brand the page pinned via
      // <html data-theme="…"> (theme-showcase demos) instead of clobbering it.
      _state.brand = resolveInitialBrand(stored, document.documentElement.dataset.theme);

      // Load saved brand CSS before applying
      try {
        await ensureThemeLoaded(_state.brand);
      } catch {
        // Network error — fall back to default
        _state.brand = 'default';
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
        next = envelope?.data;
      } catch {
        return;
      }
      if (!next || typeof next !== 'object') return;

      const merged = { ...DEFAULTS, ..._state, ...next };

      /* Brand CSS pack may not be loaded in this document yet — fetch
         before applying so the new tokens land before the data-theme
         attribute swap. Failures fall back to default to avoid leaving
         the document in a half-themed state. */
      if (merged.brand && merged.brand !== _state?.brand) {
        try {
          await ensureThemeLoaded(merged.brand);
        } catch {
          merged.brand = 'default';
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
    const updated = { ...(_state ?? DEFAULTS), ...prefs };
    _state = updated;
    VBStore.set(NS, KEY, updated).catch(() => { /* ignore */ });
    return updated;
  },

  /**
   * Apply theme to document root
   * @param {Partial<VBThemePrefs>} prefs
   */
  apply({ mode = 'auto', brand = 'default', borderStyle = '', iconSet = '', fluid = '', backdrop = '', backdropChrome = '', pageBgType = '', pageBgColor = '', pageBgGradStart = '', pageBgGradEnd = '', pageBgGradDir = '' } = {}) {
    const root = document.documentElement;

    // Apply mode — always set data-mode to effective value so theme
    // light/dark selectors match even in auto mode (OS-preference-driven)
    root.dataset.mode = mode === 'auto' ? this.getEffectiveMode() : mode;

    // Brand — preserve a11y theme suffixes
    const current = root.dataset.theme || '';
    const a11yParts = current.split(' ').filter(t => t.startsWith('a11y-'));
    const parts = brand !== 'default' ? [brand, ...a11yParts] : [...a11yParts];

    if (parts.length) {
      root.dataset.theme = parts.join(' ');
    } else {
      delete root.dataset.theme;
    }

    // Border style — read CSS hint if user hasn't explicitly set one
    const borderPref = borderStyle || this._readCSSHint('--theme-border-style');
    if (borderPref && borderPref !== 'clean') {
      root.dataset.borderStyle = borderPref;
    } else {
      delete root.dataset.borderStyle;
    }

    // Icon set — read CSS hint if user hasn't explicitly set one
    const iconPref = iconSet || this._readCSSHint('--theme-icon-set');
    if (iconPref && iconPref !== 'lucide') {
      root.dataset.iconSet = iconPref;
    } else {
      delete root.dataset.iconSet;
    }

    // Fluid scaling
    if (fluid) {
      root.dataset.fluid = fluid;
    } else {
      delete root.dataset.fluid;
    }

    // Canvas backdrop
    if (backdrop) {
      root.dataset.backdrop = backdrop;
    } else {
      delete root.dataset.backdrop;
    }

    // Backdrop chrome mode
    if (backdropChrome && backdropChrome !== 'card') {
      root.dataset.backdropChrome = backdropChrome;
    } else {
      delete root.dataset.backdropChrome;
    }

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

    // Apply color accent (inline styles on :root for hue/lightness/chroma seeds)
    const accent = this.load().accent || 'default';
    this._applyAccent(accent);

    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('vb:theme-change', {
      detail: { mode, brand, accent, borderStyle: borderPref, iconSet: iconPref, fluid, backdrop, backdropChrome, pageBgType, effectiveMode: this.getEffectiveMode() }
    }));
  },

  /**
   * Set color mode preference
   * @param {'auto' | 'light' | 'dark'} mode
   */
  setMode(mode) {
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
    if (mode !== 'auto') return /** @type {'light' | 'dark'} */ (mode);
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  /**
   * Get current theme state
   * @returns {VBThemeState}
   */
  getState() {
    const { mode, brand, accent, borderStyle, iconSet, fluid, backdrop, backdropChrome, pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir } = this.load();
    return { mode, brand, accent, borderStyle, iconSet, fluid, backdrop, backdropChrome, pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir, effectiveMode: this.getEffectiveMode() };
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
   * Reset to default theme
   */
  reset() {
    _state = { ...DEFAULTS };
    VBStore.remove(NS, KEY).catch(() => { /* ignore */ });
    const root = document.documentElement;
    root.style.removeProperty('--page-bg-color');
    root.style.removeProperty('--page-bg-gradient');
    // Clear accent seed inline styles
    for (const prop of SEED_PROPERTIES) {
      root.style.removeProperty(prop);
    }
    this.apply(DEFAULTS);
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
   * Apply color accent seeds to :root inline styles
   * @param {string} accentId - Accent ID from COLOR_ACCENTS
   * @private
   */
  _applyAccent(accentId) {
    const root = document.documentElement;
    const entry = COLOR_ACCENTS.find(a => a.id === accentId);

    // Clear all seed inline styles first
    for (const prop of SEED_PROPERTIES) {
      root.style.removeProperty(prop);
    }

    // 'default' or unknown: just clear — let CSS defaults or theme values apply
    if (!entry || !entry.seeds || Object.keys(entry.seeds).length === 0) return;

    // Apply light mode seeds
    for (const [prop, value] of Object.entries(entry.seeds)) {
      root.style.setProperty(prop, String(value));
    }

    // Apply dark mode overrides if in dark mode
    if (entry.seedsDark && this.getEffectiveMode() === 'dark') {
      for (const [prop, value] of Object.entries(entry.seedsDark)) {
        root.style.setProperty(prop, String(value));
      }
    }
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
    const effective = _state.mode === 'auto' ? this.getEffectiveMode() : _state.mode;
    if (raw === effective) return; // our own write or a no-op edit
    // Treat the attribute as an explicit session-scoped override. 'auto'
    // can't be expressed directly on the attribute (we always write the
    // effective value), so we only see concrete 'light'/'dark' here.
    _state.mode = /** @type {'light' | 'dark'} */ (raw);
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
