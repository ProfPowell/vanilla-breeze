/**
 * theme-wc: Theme selection component
 *
 * Provides controls for selecting color mode (auto/light/dark) and
 * brand theme (default/ocean/forest/sunset). Integrates with ThemeManager
 * for persistence and system preference detection.
 *
 * @attr {string} data-variant - Display variant: 'popover' (default), 'inline'
 * @attr {boolean} data-open - Whether popover is open (reflected, popover variant only)
 *
 * @example Popover variant (default)
 * <theme-wc>
 *   <button data-trigger>
 *     <x-icon name="palette"></x-icon>
 *     Theme
 *   </button>
 * </theme-wc>
 *
 * @example Inline variant (for settings pages)
 * <theme-wc data-variant="inline"></theme-wc>
 *
 * @example Icon-only trigger
 * <theme-wc>
 *   <button data-trigger aria-label="Change theme">
 *     <x-icon name="sun" label="Theme"></x-icon>
 *   </button>
 * </theme-wc>
 */

import { ThemeManager } from '../../lib/theme-manager.js';
import { SoundManager } from '../../lib/sound-manager.js';

// Extension preferences storage key
const EXTENSIONS_KEY = 'vb-extensions';
const EXTENSION_DEFAULTS = { motionFx: true, sounds: false };

// Accessibility themes storage key
const A11Y_THEMES_KEY = 'vb-a11y-themes';

class ThemePicker extends HTMLElement {
  static #MODES = [
    { id: 'auto', name: 'Auto', icon: 'monitor' },
    { id: 'light', name: 'Light', icon: 'sun' },
    { id: 'dark', name: 'Dark', icon: 'moon' }
  ];

  // Color themes - override hue values only
  static #COLOR_THEMES = [
    { id: 'default', name: 'Default', hue: 260, swatchBg: '#3b82f6' },
    { id: 'ocean', name: 'Ocean', hue: 200, swatchBg: '#0891b2' },
    { id: 'forest', name: 'Forest', hue: 145, swatchBg: '#059669' },
    { id: 'sunset', name: 'Sunset', hue: 25, swatchBg: '#ea580c' },
    { id: 'rose', name: 'Rose', hue: 350, swatchBg: '#e11d48' },
    { id: 'lavender', name: 'Lavender', hue: 280, swatchBg: '#a855f7' },
    { id: 'coral', name: 'Coral', hue: 15, swatchBg: '#f97316' },
    { id: 'slate', name: 'Slate', hue: 220, swatchBg: '#64748b' },
    { id: 'emerald', name: 'Emerald', hue: 160, swatchBg: '#10b981' },
    { id: 'amber', name: 'Amber', hue: 45, swatchBg: '#f59e0b' },
    { id: 'indigo', name: 'Indigo', hue: 250, swatchBg: '#6366f1' }
  ];

  // Personality themes - comprehensive design systems
  static #PERSONALITY_THEMES = [
    { id: 'modern', name: 'Modern', hue: 270, shape: 'rounded', character: 'Vibrant & elevated', swatchBg: '#6366f1' },
    { id: 'minimal', name: 'Minimal', hue: 240, shape: 'sharp', character: 'Clean & flat', swatchBg: '#71717a' },
    { id: 'classic', name: 'Classic', hue: 220, shape: 'subtle', character: 'Serif & elegant', swatchBg: '#92400e' }
  ];

  // Extreme themes - dramatic visual transformations
  static #EXTREME_THEMES = [
    { id: 'swiss', name: 'Swiss', icon: 'grid-3x3', character: 'Precision grid', swatchBg: '#ff3e00', swatchFg: 'white' },
    { id: 'brutalist', name: 'Brutalist', icon: 'square', character: 'Raw, industrial', swatchBg: '#1a1a1a', swatchFg: '#f5f5f5' },
    { id: 'cyber', name: 'Cyber', icon: 'zap', character: 'Neon futuristic', swatchBg: '#0a0a1a', swatchFg: '#00ff88' },
    { id: 'terminal', name: 'Terminal', icon: 'terminal', character: 'Retro CRT', swatchBg: '#0d1117', swatchFg: '#00ff00' },
    { id: 'organic', name: 'Organic', icon: 'leaf', character: 'Natural, handcrafted', swatchBg: '#2d5016', swatchFg: '#faf5e6' },
    { id: 'editorial', name: 'Editorial', icon: 'newspaper', character: 'Magazine elegance', swatchBg: '#1a1a1a', swatchFg: '#c9a227' },
    { id: 'kawaii', name: 'Kawaii', icon: 'heart', character: 'Cute aesthetic', swatchBg: '#ffb7c5', swatchFg: '#ff69b4' },
    { id: '8bit', name: '8-Bit', icon: 'gamepad-2', character: 'Retro pixel art', swatchBg: '#000080', swatchFg: '#ffff00' },
    { id: 'nes', name: 'NES', icon: 'joystick', character: 'Console pixels', swatchBg: '#bcbcbc', swatchFg: '#e40521' },
    { id: 'win9x', name: 'Win9x', icon: 'monitor', character: 'Classic desktop', swatchBg: '#008080', swatchFg: '#c0c0c0' }
  ];

  // Fluid scaling presets
  static #FLUID_PRESETS = [
    { id: '', name: 'Fixed', icon: 'ruler', description: 'Static token values' },
    { id: 'default', name: 'Fluid', icon: 'move-diagonal-2', description: 'Smooth viewport scaling' },
    { id: 'compact', name: 'Compact', icon: 'minimize-2', description: 'Tighter fluid range' },
    { id: 'spacious', name: 'Spacious', icon: 'maximize-2', description: 'Generous fluid range' }
  ];

  // Accessibility themes - composable with other themes
  static #ACCESSIBILITY_THEMES = [
    { id: 'a11y-high-contrast', name: 'High Contrast', icon: 'contrast', description: 'AAA contrast (7:1+)' },
    { id: 'a11y-large-text', name: 'Large Text', icon: 'type', description: '25% larger fonts' },
    { id: 'a11y-dyslexia', name: 'Dyslexia', icon: 'book-open', description: 'Readable typography' }
  ];

  // Combined list for backwards compatibility
  static #THEMES = [
    ...ThemePicker.#COLOR_THEMES,
    ...ThemePicker.#PERSONALITY_THEMES,
    ...ThemePicker.#EXTREME_THEMES
  ];

  // Extension toggles
  static #EXTENSIONS = [
    { id: 'motionFx', name: 'Motion Effects', icon: 'sparkles', description: 'Hover & enter animations' },
    { id: 'sounds', name: 'Sound Effects', icon: 'volume-2', description: 'Audio feedback' }
  ];

  // Delay before auto-dismissing after selection (ms)
  static #AUTO_DISMISS_DELAY = 200;

  #trigger;
  #panel;
  #isOpen = false;
  #isInline = false;
  #autoDismissTimer = null;
  #extensionsExpanded = false;

  connectedCallback() {
    this.#isInline = this.getAttribute('data-variant') === 'inline';
    this.#render();
    this.#bindEvents();
    this.#syncState();

    // Listen for external theme changes
    window.addEventListener('theme-change', this.#handleThemeChange);

    // Apply extension preferences on load
    this.#applyExtensions();

    // Apply accessibility themes on load
    this.#applyA11yThemes();
  }

  disconnectedCallback() {
    window.removeEventListener('theme-change', this.#handleThemeChange);
    document.removeEventListener('click', this.#handleOutsideClick);
    document.removeEventListener('keydown', this.#handleEscape);
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
          <x-icon name="palette" label="Theme settings"></x-icon>
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
    const { mode, brand, fluid } = ThemeManager.getState();
    const allBrands = [
      ...ThemePicker.#COLOR_THEMES,
      ...ThemePicker.#PERSONALITY_THEMES,
      ...ThemePicker.#EXTREME_THEMES
    ];

    return `
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${ThemePicker.#MODES.map(m => `
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${m.id}"
                ${mode === m.id ? 'checked' : ''}
              />
              <span class="option-content">
                <x-icon name="${m.icon}"></x-icon>
                <span>${m.name}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Theme">
          ${allBrands.map(t => {
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
                ${icon ? `<x-icon name="${icon}"></x-icon>` : ''}
                <span class="sr-only">${t.name}</span>
              </span>
            </label>
          `}).join('')}
        </div>
      </fieldset>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${ThemePicker.#ACCESSIBILITY_THEMES.map(t => {
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
                <x-icon name="${t.icon}"></x-icon>
                <span class="option-label">${t.name}</span>
              </span>
            </label>
          `}).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <div class="options options--sizing" role="radiogroup" aria-label="Fluid sizing">
          ${ThemePicker.#FLUID_PRESETS.map(f => `
            <label class="option option--sizing">
              <input
                type="radio"
                name="theme-fluid"
                value="${f.id}"
                ${fluid === f.id ? 'checked' : ''}
              />
              <span class="option-content">
                <x-icon name="${f.icon}"></x-icon>
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
          <x-icon name="sliders-horizontal"></x-icon>
          <span>Extensions</span>
          <x-icon name="chevron-down" class="chevron"></x-icon>
        </summary>
        <div class="extensions-content">
          ${ThemePicker.#EXTENSIONS.map(ext => {
            const prefs = this.#loadExtensions();
            const isChecked = prefs[ext.id] ?? EXTENSION_DEFAULTS[ext.id];
            return `
            <label class="extension-toggle">
              <span class="extension-info">
                <x-icon name="${ext.icon}"></x-icon>
                <span class="extension-name">${ext.name}</span>
              </span>
              <input
                type="checkbox"
                name="ext-${ext.id}"
                data-extension="${ext.id}"
                ${isChecked ? 'checked' : ''}
              />
              <span class="toggle-switch"></span>
            </label>
          `}).join('')}
        </div>
      </details>
    `;
  }

  #bindEvents() {
    // Mode change
    this.#panel.querySelectorAll('input[name="theme-mode"]').forEach(input => {
      input.addEventListener('change', this.#handleModeChange);
    });

    // Brand change
    this.#panel.querySelectorAll('input[name="theme-brand"]').forEach(input => {
      input.addEventListener('change', this.#handleBrandChange);
    });

    // Fluid change
    this.#panel.querySelectorAll('input[name="theme-fluid"]').forEach(input => {
      input.addEventListener('change', this.#handleFluidChange);
    });

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
      this.#trigger.addEventListener('click', this.#handleTriggerClick);
      document.addEventListener('click', this.#handleOutsideClick);
      document.addEventListener('keydown', this.#handleEscape);
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

  #handleBrandChange = (e) => {
    ThemeManager.setBrand(e.target.value);
    // Reapply a11y themes to combine with new brand
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
   * @returns {Object}
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
  #applyExtensions() {
    const prefs = this.#loadExtensions();
    const root = document.documentElement;

    // Motion effects - toggle via data attribute
    if (prefs.motionFx) {
      delete root.dataset.motionReduced;
    } else {
      root.dataset.motionReduced = '';
    }

    // Sound effects - toggle via SoundManager
    if (prefs.sounds) {
      SoundManager.init();
      SoundManager.enable();
    } else {
      SoundManager.disable();
    }

    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('extensions-change', {
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

    // Update brand radios
    const brandInput = this.#panel.querySelector(`input[name="theme-brand"][value="${brand}"]`);
    if (brandInput) brandInput.checked = true;

    // Update fluid radios
    const fluidInput = this.#panel.querySelector(`input[name="theme-fluid"][value="${fluid}"]`);
    if (fluidInput) fluidInput.checked = true;
  }

  open() {
    if (this.#isInline || this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('data-open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');

    // Position panel after browser renders it (needs accurate dimensions)
    requestAnimationFrame(() => {
      this.#positionPanel();

      // Focus first option after positioning
      const firstInput = this.#panel.querySelector('input[type="radio"]:checked');
      firstInput?.focus();
    });

    this.dispatchEvent(new CustomEvent('theme-wc-open', { bubbles: true }));
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
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');

    this.dispatchEvent(new CustomEvent('theme-wc-close', { bubbles: true }));
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

customElements.define('theme-wc', ThemePicker);

export { ThemePicker };
