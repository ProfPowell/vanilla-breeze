/**
 * theme-picker-wc: Theme selection component
 *
 * Provides controls for selecting color mode (auto/light/dark) and
 * brand theme (default/ocean/forest/sunset). Integrates with ThemeManager
 * for persistence and system preference detection.
 *
 * @attr {string} data-variant - Display variant: 'popover' (default), 'inline'
 * @attr {boolean} data-open - Whether popover is open (reflected, popover variant only)
 *
 * @example Popover variant (default)
 * <theme-picker-wc>
 *   <button data-trigger>
 *     <x-icon name="palette"></x-icon>
 *     Theme
 *   </button>
 * </theme-picker-wc>
 *
 * @example Inline variant (for settings pages)
 * <theme-picker-wc data-variant="inline"></theme-picker-wc>
 *
 * @example Icon-only trigger
 * <theme-picker-wc>
 *   <button data-trigger aria-label="Change theme">
 *     <x-icon name="sun" label="Theme"></x-icon>
 *   </button>
 * </theme-picker-wc>
 */

import { ThemeManager } from '../../lib/theme-manager.js';

class ThemePickerWc extends HTMLElement {
  static #MODES = [
    { id: 'auto', name: 'Auto', icon: 'monitor' },
    { id: 'light', name: 'Light', icon: 'sun' },
    { id: 'dark', name: 'Dark', icon: 'moon' }
  ];

  static #THEMES = [
    { id: 'default', name: 'Default', hue: 260 },
    { id: 'ocean', name: 'Ocean', hue: 200 },
    { id: 'forest', name: 'Forest', hue: 145 },
    { id: 'sunset', name: 'Sunset', hue: 25 }
  ];

  #trigger;
  #panel;
  #isOpen = false;
  #isInline = false;

  connectedCallback() {
    this.#isInline = this.getAttribute('data-variant') === 'inline';
    this.#render();
    this.#bindEvents();
    this.#syncState();

    // Listen for external theme changes
    window.addEventListener('theme-change', this.#handleThemeChange);
  }

  disconnectedCallback() {
    window.removeEventListener('theme-change', this.#handleThemeChange);
    document.removeEventListener('click', this.#handleOutsideClick);
    document.removeEventListener('keydown', this.#handleEscape);
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
    this.#panel.className = 'theme-picker-panel';
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
    const { mode, brand } = ThemeManager.getState();

    return `
      <fieldset class="theme-picker-section">
        <legend>Color Mode</legend>
        <div class="theme-picker-options" role="radiogroup" aria-label="Color mode">
          ${ThemePickerWc.#MODES.map(m => `
            <label class="theme-picker-option">
              <input
                type="radio"
                name="theme-mode"
                value="${m.id}"
                ${mode === m.id ? 'checked' : ''}
              />
              <span class="theme-picker-option-content">
                <x-icon name="${m.icon}"></x-icon>
                <span>${m.name}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="theme-picker-section">
        <legend>Brand Theme</legend>
        <div class="theme-picker-options theme-picker-options--themes" role="radiogroup" aria-label="Brand theme">
          ${ThemePickerWc.#THEMES.map(t => `
            <label class="theme-picker-option theme-picker-option--theme">
              <input
                type="radio"
                name="theme-brand"
                value="${t.id}"
                ${brand === t.id ? 'checked' : ''}
              />
              <span class="theme-picker-option-content">
                <span class="theme-picker-swatch" style="--swatch-hue: ${t.hue}"></span>
                <span>${t.name}</span>
              </span>
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

    // Brand change
    this.#panel.querySelectorAll('input[name="theme-brand"]').forEach(input => {
      input.addEventListener('change', this.#handleBrandChange);
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
  };

  #handleBrandChange = (e) => {
    ThemeManager.setBrand(e.target.value);
  };

  #handleThemeChange = () => {
    this.#syncState();
  };

  #syncState() {
    const { mode, brand } = ThemeManager.getState();

    // Update mode radios
    const modeInput = this.#panel.querySelector(`input[name="theme-mode"][value="${mode}"]`);
    if (modeInput) modeInput.checked = true;

    // Update brand radios
    const brandInput = this.#panel.querySelector(`input[name="theme-brand"][value="${brand}"]`);
    if (brandInput) brandInput.checked = true;
  }

  open() {
    if (this.#isInline || this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('data-open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');

    // Focus first option
    const firstInput = this.#panel.querySelector('input[type="radio"]:checked');
    firstInput?.focus();

    this.dispatchEvent(new CustomEvent('theme-picker-open', { bubbles: true }));
  }

  close() {
    if (this.#isInline || !this.#isOpen) return;

    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');

    this.dispatchEvent(new CustomEvent('theme-picker-close', { bubbles: true }));
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

customElements.define('theme-picker-wc', ThemePickerWc);

export { ThemePickerWc };
