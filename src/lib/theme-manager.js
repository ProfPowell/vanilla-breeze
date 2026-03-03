/**
 * Theme Manager
 * Handles theme persistence, application, and system preference detection.
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
 * await ThemeManager.setBrand('ocean');
 *
 * // Listen for changes
 * window.addEventListener('theme-change', (e) => {
 *   console.log(e.detail); // { mode: 'dark', brand: 'ocean' }
 * });
 */

import { ensureThemeLoaded } from './theme-loader.js';

const STORAGE_KEY = 'vb-theme';
const DEFAULTS = { mode: 'auto', brand: 'default', borderStyle: '', iconSet: '', fluid: '', backdrop: '' };

export const ThemeManager = {
  /**
   * Initialize theme from storage or defaults
   * Loads saved brand CSS before applying (prevents FOUC for returning visitors)
   * Falls back to default on network error.
   * @returns {Promise<VBThemePrefs>}
   */
  async init() {
    const saved = this.load();

    // Load saved brand CSS before applying
    try {
      await ensureThemeLoaded(saved.brand);
    } catch {
      // Network error — fall back to default
      saved.brand = 'default';
    }

    this.apply(saved);
    this._watchSystemPreference();
    return saved;
  },

  /**
   * Load theme preferences from localStorage
   * @returns {VBThemePrefs}
   */
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  },

  /**
   * Save theme preferences to localStorage
   * @param {Partial<VBThemePrefs>} prefs - Partial preferences to update
   * @returns {VBThemePrefs} - Updated full preferences
   */
  save(prefs) {
    const current = this.load();
    const updated = { ...current, ...prefs };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable, continue without persistence
    }
    return updated;
  },

  /**
   * Apply theme to document root
   * @param {Partial<VBThemePrefs>} prefs
   */
  apply({ mode = 'auto', brand = 'default', borderStyle = '', iconSet = '', fluid = '', backdrop = '' } = {}) {
    const root = document.documentElement;

    // Apply mode
    if (mode === 'auto') {
      delete root.dataset.mode;
    } else {
      root.dataset.mode = mode;
    }

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

    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('theme-change', {
      detail: { mode, brand, borderStyle: borderPref, iconSet: iconPref, fluid, backdrop, effectiveMode: this.getEffectiveMode() }
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
    const { mode, brand, borderStyle, iconSet, fluid, backdrop } = this.load();
    return { mode, brand, borderStyle, iconSet, fluid, backdrop, effectiveMode: this.getEffectiveMode() };
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
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
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
   * Watch for system preference changes
   * @private
   */
  _watchSystemPreference() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const { mode, brand } = this.load();
      // Only dispatch event if in auto mode (system preference matters)
      if (mode === 'auto') {
        window.dispatchEvent(new CustomEvent('theme-change', {
          detail: { mode, brand, effectiveMode: this.getEffectiveMode() }
        }));
      }
    });
  }
};
