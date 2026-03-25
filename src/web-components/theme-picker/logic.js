/**
 * theme-picker: Theme selection component
 *
 * Provides controls for selecting color mode (auto/light/dark) and
 * brand theme (default/ocean/forest/sunset). Integrates with ThemeManager
 * for persistence and system preference detection.
 *
 * @attr {string} variant - Display variant: 'popover' (default), 'inline'
 * @attr {boolean} compact - Render theme section as grouped select dropdown
 * @attr {boolean} open - Reflected state only — set by open()/close()/toggle() methods, not intended as initial markup (popover variant only)
 *
 * @example Popover variant (default)
 * <theme-picker>
 *   <button data-trigger>
 *     <icon-wc name="palette"></icon-wc>
 *     Theme
 *   </button>
 * </theme-picker>
 *
 * @example Inline variant (for settings pages)
 * <theme-picker variant="inline"></theme-picker>
 *
 * @example Compact variant (select dropdown)
 * <theme-picker compact></theme-picker>
 *
 * @example Icon-only trigger
 * <theme-picker>
 *   <button data-trigger aria-label="Change theme">
 *     <icon-wc name="sun" label="Theme"></icon-wc>
 *   </button>
 * </theme-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { ThemeManager } from '../../lib/theme-manager.js';
import {
  MODES, COLOR_THEMES, PERSONALITY_THEMES,
  COMMUNITY_THEMES, FLUID_PRESETS, ACCESSIBILITY_THEMES,
  EXTENSIONS, THEME_GROUPS
} from '../../lib/theme-data.js';
// SoundManager is lazy-loaded when sounds are enabled
let _SoundManager = null;

// Extension preferences storage key
const EXTENSIONS_KEY = 'vb-extensions';
const EXTENSION_DEFAULTS = { motionFx: true, sounds: false };

// Accessibility themes storage key
const A11Y_THEMES_KEY = 'vb-a11y-themes';

class ThemePicker extends VBElement {
  // Delay before auto-dismissing after selection (ms)
  static #AUTO_DISMISS_DELAY = 200;

  #trigger;
  #panel;
  #isOpen = false;
  #isInline = false;
  #isCompact = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #autoDismissTimer = null;
  #extensionsExpanded = false;

  /** Bound handler for scroll/resize repositioning */
  #onReposition = () => this.#positionPanel();

  setup() {
    this.#isInline = this.getAttribute('variant') === 'inline';
    this.#isCompact = this.hasAttribute('compact');
    this.#render();
    this.#bindEvents();
    this.#syncState();

    // Listen for external theme changes
    this.listen(window, 'vb:theme-change', this.#handleThemeChange);

    // Apply extension preferences on load
    this.#applyExtensions();

    // Apply accessibility themes on load
    this.#applyA11yThemes();
  }

  teardown() {
    window.removeEventListener('scroll', this.#onReposition, { capture: true });
    window.removeEventListener('resize', this.#onReposition);
    this.#clearAutoDismiss();
  }

  #render() {
    // For popover variant, find or create trigger
    if (!this.#isInline) {
      this.#trigger = this.querySelector(':scope > [data-trigger]');
      if (!this.#trigger) {
        this.#trigger = this.querySelector(':scope > button');
      }

      // If no trigger provided, create default one
      if (!this.#trigger) {
        this.#trigger = document.createElement('button');
        this.#trigger.setAttribute('data-trigger', '');
        this.#trigger.innerHTML = `
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `;
        this.prepend(this.#trigger);
      }

      // Set up ARIA for trigger
      this.#trigger.setAttribute('aria-haspopup', 'dialog');
      this.#trigger.setAttribute('aria-expanded', 'false');
    }

    // Create panel
    this.#panel = document.createElement('div');
    this.#panel.className = 'panel';
    this.#panel.setAttribute('role', 'dialog');
    this.#panel.setAttribute('aria-label', 'Theme settings');

    if (!this.#isInline) {
      this.#panel.id = `theme-panel-${crypto.randomUUID().slice(0, 8)}`;
      this.#trigger.setAttribute('aria-controls', this.#panel.id);
    }

    this.#panel.innerHTML = this.#renderContent();
    this.appendChild(this.#panel);
  }

  #renderContent() {
    return this.#isCompact ? this.#renderCompactContent() : this.#renderFullContent();
  }

  #renderSwatch(t, brand) {
    const bg = t.swatchBg;
    const fg = t.swatchFg || 'white';
    const icon = t.icon || '';
    const label = t.character ? `${t.name} — ${t.character}` : t.name;
    return `
      <label class="swatch-cell" title="${label}">
        <input
          type="radio"
          name="theme-brand"
          value="${t.id}"
          ${brand === t.id ? 'checked' : ''}
        />
        <span class="swatch-visual" style="--swatch-bg: ${bg}; --swatch-fg: ${fg}">
          ${icon ? `<icon-wc name="${icon}"></icon-wc>` : ''}
          <span class="sr-only">${t.name}</span>
        </span>
      </label>
    `;
  }

  #renderFullContent() {
    const { mode, brand, fluid } = ThemeManager.getState();
    const showcaseGroups = THEME_GROUPS.filter(g => g.tier === 'showcase');

    return `
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${MODES.map(m => `
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${m.id}"
                ${mode === m.id ? 'checked' : ''}
              />
              <span class="option-content">
                <icon-wc name="${m.icon}"></icon-wc>
                <span>${m.name}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Colors</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Color theme">
          ${COLOR_THEMES.map(t => this.#renderSwatch(t, brand)).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Style</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Style">
          ${PERSONALITY_THEMES.map(t => this.#renderSwatch(t, brand)).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Featured</legend>
        ${showcaseGroups.map(group => `
          <div class="theme-category">
            <span class="category-label">${group.label}</span>
            <div class="options options--swatch-grid">
              ${group.themes.map(t => this.#renderSwatch(t, brand)).join('')}
            </div>
          </div>
        `).join('')}
      </fieldset>

      <details class="section section--more-themes">
        <summary class="more-themes-toggle">
          <span>More Themes</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="options options--swatch-grid">
          ${COMMUNITY_THEMES.map(t => this.#renderSwatch(t, brand)).join('')}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${ACCESSIBILITY_THEMES.map(t => {
            const a11yThemes = this.#loadA11yThemes();
            const isChecked = a11yThemes.includes(t.id);
            return `
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${t.id}"
                data-a11y-theme="${t.id}"
                ${isChecked ? 'checked' : ''}
              />
              <span class="option-content">
                <icon-wc name="${t.icon}"></icon-wc>
                <span class="option-label">${t.name}</span>
              </span>
            </label>
          `}).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <div class="options options--sizing" role="radiogroup" aria-label="Fluid sizing">
          ${FLUID_PRESETS.map(f => `
            <label class="option option--sizing">
              <input
                type="radio"
                name="theme-fluid"
                value="${f.id}"
                ${fluid === f.id ? 'checked' : ''}
              />
              <span class="option-content">
                <icon-wc name="${f.icon}"></icon-wc>
                <span class="option-text">
                  <span>${f.name}</span>
                  <small>${f.description}</small>
                </span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <details class="section section--extensions" ${this.#extensionsExpanded ? 'open' : ''}>
        <summary class="extensions-toggle">
          <icon-wc name="sliders-horizontal"></icon-wc>
          <span>Extensions</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="extensions-content">
          ${EXTENSIONS.map(ext => {
            const prefs = this.#loadExtensions();
            const isChecked = prefs[ext.id] ?? EXTENSION_DEFAULTS[ext.id];
            return `
            <label class="extension-toggle">
              <span class="extension-info">
                <icon-wc name="${ext.icon}"></icon-wc>
                <span class="extension-name">${ext.name}</span>
              </span>
              <input
                type="checkbox"
                name="ext-${ext.id}"
                data-extension="${ext.id}"
                data-switch="sm"
                ${isChecked ? 'checked' : ''}
              />
            </label>
          `}).join('')}
        </div>
      </details>
    `;
  }

  #renderCompactContent() {
    const { mode, brand, fluid } = ThemeManager.getState();
    const a11yThemes = this.#loadA11yThemes();
    const prefs = this.#loadExtensions();

    return `
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${MODES.map(m => `
            <label class="compact-seg">
              <input type="radio" name="theme-mode" value="${m.id}" ${mode === m.id ? 'checked' : ''} />
              <span><icon-wc name="${m.icon}" size="xs"></icon-wc> ${m.name}</span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${THEME_GROUPS.map(group => `
            <optgroup label="${group.label}">
              ${group.themes.map(t => `
                <option value="${t.id}" ${brand === t.id ? 'selected' : ''}>${t.name}</option>
              `).join('')}
            </optgroup>
          `).join('')}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="Sizing">
          ${FLUID_PRESETS.map(f => `
            <option value="${f.id}" ${fluid === f.id ? 'selected' : ''}>${f.name}</option>
          `).join('')}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${ACCESSIBILITY_THEMES.map(t => `
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${t.name}</span>
              </span>
              <input type="checkbox" name="a11y-theme" value="${t.id}" data-a11y-theme="${t.id}" data-switch="sm" ${a11yThemes.includes(t.id) ? 'checked' : ''} />
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Extensions</legend>
        <div class="compact-toggles">
          ${EXTENSIONS.map(ext => `
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${ext.name}</span>
              </span>
              <input type="checkbox" name="ext-${ext.id}" data-extension="${ext.id}" data-switch="sm" ${prefs[ext.id] ?? EXTENSION_DEFAULTS[ext.id] ? 'checked' : ''} />
            </label>
          `).join('')}
        </div>
      </fieldset>
    `;
  }

  #bindEvents() {
    // Mode change
    this.#panel.querySelectorAll('input[name="theme-mode"]').forEach(input => {
      input.addEventListener('change', this.#handleModeChange);
    });

    // Brand change — swatch grid (radio buttons)
    this.#panel.querySelectorAll('input[name="theme-brand"]').forEach(input => {
      input.addEventListener('change', this.#handleBrandChange);
    });

    // Brand change — compact select
    const brandSelect = this.#panel.querySelector('select[name="theme-brand-select"]');
    if (brandSelect) {
      brandSelect.addEventListener('change', this.#handleBrandSelect);
    }

    // Fluid change — radio buttons (full mode)
    this.#panel.querySelectorAll('input[name="theme-fluid"]').forEach(input => {
      input.addEventListener('change', this.#handleFluidChange);
    });

    // Fluid change — select (compact mode)
    const fluidSelect = this.#panel.querySelector('select[name="theme-fluid-select"]');
    if (fluidSelect) {
      fluidSelect.addEventListener('change', this.#handleFluidChange);
    }

    // Extension toggles
    this.#panel.querySelectorAll('input[data-extension]').forEach(input => {
      input.addEventListener('change', this.#handleExtensionChange);
    });

    // Accessibility theme toggles
    this.#panel.querySelectorAll('input[data-a11y-theme]').forEach(input => {
      input.addEventListener('change', this.#handleA11yThemeChange);
    });

    // Extensions details toggle
    const extensionsDetails = this.#panel.querySelector('.section--extensions');
    extensionsDetails?.addEventListener('toggle', (e) => {
      this.#extensionsExpanded = e.target.open;
    });

    // Popover controls
    if (!this.#isInline) {
      this.listen(this.#trigger, 'click', this.#handleTriggerClick);
      this.listen(document, 'click', this.#handleOutsideClick);
      this.listen(document, 'keydown', this.#handleEscape);
    }
  }

  #handleTriggerClick = (e) => {
    e.stopPropagation();
    this.toggle();
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) {
      this.close();
    }
  };

  #handleEscape = (e) => {
    if (e.key === 'Escape' && this.#isOpen) {
      e.preventDefault();
      this.close();
      this.#trigger?.focus();
    }
  };

  #handleModeChange = (e) => {
    ThemeManager.setMode(e.target.value);
    this.#autoDismiss();
  };

  #handleBrandChange = async (e) => {
    const cell = e.target.closest('.swatch-cell');
    if (cell) cell.setAttribute('aria-busy', 'true');

    try {
      await ThemeManager.setBrand(e.target.value);
    } catch {
      // Graceful degradation — page renders with default colors
      console.warn('[VB] Theme load failed, using default');
    } finally {
      if (cell) cell.removeAttribute('aria-busy');
    }

    // Reapply a11y themes to combine with new brand
    this.#applyA11yThemes();
    this.#autoDismiss();
  };

  #handleBrandSelect = async (e) => {
    const select = e.target;
    select.disabled = true;

    try {
      await ThemeManager.setBrand(select.value);
    } catch {
      console.warn('[VB] Theme load failed, using default');
    } finally {
      select.disabled = false;
    }

    this.#applyA11yThemes();
    this.#autoDismiss();
  };

  #handleFluidChange = (e) => {
    ThemeManager.setFluid(e.target.value);
    this.#autoDismiss();
  };

  #handleExtensionChange = (e) => {
    const extId = e.target.dataset.extension;
    const isEnabled = e.target.checked;
    this.#saveExtension(extId, isEnabled);
    this.#applyExtensions();
  };

  /**
   * Load extension preferences from localStorage
   * @returns {object}
   */
  #loadExtensions() {
    try {
      const stored = localStorage.getItem(EXTENSIONS_KEY);
      return stored ? { ...EXTENSION_DEFAULTS, ...JSON.parse(stored) } : { ...EXTENSION_DEFAULTS };
    } catch {
      return { ...EXTENSION_DEFAULTS };
    }
  }

  /**
   * Save a single extension preference
   * @param {string} id
   * @param {boolean} enabled
   */
  #saveExtension(id, enabled) {
    try {
      const current = this.#loadExtensions();
      current[id] = enabled;
      localStorage.setItem(EXTENSIONS_KEY, JSON.stringify(current));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Apply extension preferences to the page
   */
  async #applyExtensions() {
    const prefs = this.#loadExtensions();
    const root = document.documentElement;

    // Motion effects - toggle via data attribute
    if (prefs.motionFx) {
      delete root.dataset.motionReduced;
    } else {
      root.dataset.motionReduced = '';
    }

    // Sound effects - lazy-load SoundManager only when needed
    if (prefs.sounds) {
      if (!_SoundManager) {
        const mod = await import('../../lib/sound-manager.js');
        _SoundManager = mod.SoundManager;
      }
      _SoundManager.init();
      _SoundManager.enable();
    } else if (_SoundManager) {
      _SoundManager.disable();
    }

    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('vb:extensions-change', {
      detail: prefs
    }));
  }

  /**
   * Load accessibility theme preferences from localStorage
   * @returns {string[]} Array of active a11y theme IDs
   */
  #loadA11yThemes() {
    try {
      const stored = localStorage.getItem(A11Y_THEMES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save accessibility theme preferences
   * @param {string[]} themes Array of active a11y theme IDs
   */
  #saveA11yThemes(themes) {
    try {
      localStorage.setItem(A11Y_THEMES_KEY, JSON.stringify(themes));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Apply accessibility themes to the page
   * Combines brand theme with a11y themes in data-theme attribute
   */
  #applyA11yThemes() {
    const a11yThemes = this.#loadA11yThemes();
    const { brand } = ThemeManager.getState();
    const root = document.documentElement;

    // Build combined theme value: "brand a11y-theme1 a11y-theme2"
    const themeValue = brand === 'default'
      ? a11yThemes.join(' ')
      : [brand, ...a11yThemes].join(' ');

    // Only update if value actually changed (avoid redundant reflows)
    const current = root.dataset.theme || '';
    if (themeValue === current) return;

    if (themeValue) {
      root.dataset.theme = themeValue;
    } else {
      delete root.dataset.theme;
    }
  }

  #handleA11yThemeChange = (e) => {
    const themeId = e.target.dataset.a11yTheme;
    const isEnabled = e.target.checked;
    const current = this.#loadA11yThemes();

    if (isEnabled && !current.includes(themeId)) {
      current.push(themeId);
    } else if (!isEnabled && current.includes(themeId)) {
      const index = current.indexOf(themeId);
      current.splice(index, 1);
    }

    this.#saveA11yThemes(current);
    this.#applyA11yThemes();
  };

  #autoDismiss() {
    // Only auto-dismiss in popover mode
    if (this.#isInline) return;

    // Clear any pending timer
    this.#clearAutoDismiss();

    // Close after brief delay so user sees selection
    this.#autoDismissTimer = setTimeout(() => {
      this.close();
      this.#trigger?.focus();
    }, ThemePicker.#AUTO_DISMISS_DELAY);
  }

  #clearAutoDismiss() {
    if (this.#autoDismissTimer) {
      clearTimeout(this.#autoDismissTimer);
      this.#autoDismissTimer = null;
    }
  }

  #handleThemeChange = () => {
    this.#syncState();
  };

  #syncState() {
    const { mode, brand, fluid } = ThemeManager.getState();

    // Update mode radios
    const modeInput = this.#panel.querySelector(`input[name="theme-mode"][value="${mode}"]`);
    if (modeInput) modeInput.checked = true;

    // Update brand radios (swatch mode)
    const brandInput = this.#panel.querySelector(`input[name="theme-brand"][value="${brand}"]`);
    if (brandInput) brandInput.checked = true;

    // Update brand select (compact mode)
    const brandSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('select[name="theme-brand-select"]'));
    if (brandSelect) brandSelect.value = brand;

    // Update fluid radios (full mode)
    const fluidInput = this.#panel.querySelector(`input[name="theme-fluid"][value="${fluid}"]`);
    if (fluidInput) fluidInput.checked = true;

    // Update fluid select (compact mode)
    const fluidSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('select[name="theme-fluid-select"]'));
    if (fluidSelect) fluidSelect.value = fluid;
  }

  open() {
    if (this.#isInline || this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');

    // Position panel after browser renders it (needs accurate dimensions)
    requestAnimationFrame(() => {
      this.#positionPanel();

      // Keep panel anchored during scroll/resize
      window.addEventListener('scroll', this.#onReposition, { capture: true, passive: true });
      window.addEventListener('resize', this.#onReposition, { passive: true });

      // Focus first option after positioning
      const firstInput = this.#panel.querySelector('input[type="radio"]:checked');
      firstInput?.focus();
    });

    this.dispatchEvent(new CustomEvent('theme-picker:open', { bubbles: true }));
  }

  #positionPanel() {
    if (!this.#trigger || !this.#panel) return;

    const triggerRect = this.#trigger.getBoundingClientRect();
    const panelRect = this.#panel.getBoundingClientRect();

    // Use visual viewport for accurate dimensions (accounts for on-screen keyboards, etc.)
    const viewport = window.visualViewport || { width: window.innerWidth, height: window.innerHeight };
    const viewportHeight = viewport.height;
    const viewportWidth = viewport.width;

    // Tolerance values for better spacing
    const gap = 8; // Gap between trigger and panel
    const edgeMargin = 16; // Minimum margin from viewport edges

    // Calculate available space (accounting for edge margin)
    const spaceBelow = viewportHeight - triggerRect.bottom - edgeMargin;
    const spaceAbove = triggerRect.top - edgeMargin;

    // Vertical position - flip if not enough space below and more space above
    let top = triggerRect.height + gap;

    if (spaceBelow < panelRect.height && spaceAbove > spaceBelow) {
      // Flip to above
      top = -panelRect.height - gap;
      this.#panel.dataset.position = 'top';
    } else {
      delete this.#panel.dataset.position;
    }

    // Horizontal position - shift to stay within viewport with margin
    let left = 0;
    const panelRightEdge = triggerRect.left + panelRect.width + edgeMargin;
    const panelLeftEdge = triggerRect.left + left;

    if (panelRightEdge > viewportWidth) {
      // Shift left to stay in viewport with margin
      left = viewportWidth - panelRightEdge;
    }

    // Also check if it overflows left edge
    if (panelLeftEdge + left < edgeMargin) {
      left = edgeMargin - triggerRect.left;
    }

    this.#panel.style.setProperty('--panel-top', `${top}px`);
    this.#panel.style.setProperty('--panel-left', `${left}px`);
  }

  close() {
    if (this.#isInline || !this.#isOpen) return;

    this.#clearAutoDismiss();
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');

    window.removeEventListener('scroll', this.#onReposition, { capture: true });
    window.removeEventListener('resize', this.#onReposition);

    this.dispatchEvent(new CustomEvent('theme-picker:close', { bubbles: true }));
  }

  toggle() {
    if (this.#isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  get isOpen() {
    return this.#isOpen;
  }
}

registerComponent('theme-picker', ThemePicker);

export { ThemePicker };
