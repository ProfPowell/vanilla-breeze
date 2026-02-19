/**
 * Theme Manager
 * Handles theme persistence, application, and system preference detection
 *
 * @example
 * import { ThemeManager } from './lib/theme-manager.js';
 *
 * // Initialize on page load
 * ThemeManager.init();
 *
 * // Change mode
 * ThemeManager.setMode('dark');
 *
 * // Change brand theme
 * ThemeManager.setBrand('ocean');
 *
 * // Listen for changes
 * window.addEventListener('theme-change', (e) => {
 *   console.log(e.detail); // { mode: 'dark', brand: 'ocean' }
 * });
 */

const STORAGE_KEY = 'vb-theme';
const DEFAULTS = { mode: 'auto', brand: 'default', borderStyle: '', iconSet: '', fluid: '' };

export const ThemeManager = {
  /**
   * Initialize theme from storage or defaults
   * Should be called early in page load
   * @returns {{ mode: string, brand: string }}
   */
  init() {
    const saved = this.load();
    this.apply(saved);
    this._watchSystemPreference();
    return saved;
  },

  /**
   * Load theme preferences from localStorage
   * @returns {{ mode: string, brand: string }}
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
   * @param {{ mode?: string, brand?: string }} prefs - Partial preferences to update
   * @returns {{ mode: string, brand: string }} - Updated full preferences
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
   * @param {{ mode?: string, brand?: string }} prefs
   */
  apply({ mode = 'auto', brand = 'default', borderStyle = '', iconSet = '', fluid = '' } = {}) {
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

    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('theme-change', {
      detail: { mode, brand, borderStyle: borderPref, iconSet: iconPref, fluid, effectiveMode: this.getEffectiveMode() }
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
   * @param {string} brand - Theme name (e.g., 'ocean', 'forest', 'sunset')
   */
  setBrand(brand) {
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
   * Get current effective mode (resolves 'auto' to actual mode)
   * @returns {'light' | 'dark'}
   */
  getEffectiveMode() {
    const { mode } = this.load();
    if (mode !== 'auto') return mode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  /**
   * Get current theme state
   * @returns {{ mode: string, brand: string, effectiveMode: string }}
   */
  getState() {
    const { mode, brand, borderStyle, iconSet, fluid } = this.load();
    return { mode, brand, borderStyle, iconSet, fluid, effectiveMode: this.getEffectiveMode() };
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

export default ThemeManager;
