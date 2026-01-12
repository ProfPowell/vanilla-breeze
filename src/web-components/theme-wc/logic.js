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

class ThemePicker extends HTMLElement {
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

  // Delay before auto-dismissing after selection (ms)
  static #AUTO_DISMISS_DELAY = 200;

  #trigger;
  #panel;
  #isOpen = false;
  #isInline = false;
  #autoDismissTimer = null;

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
    this.#panel.className = 'theme-wc-panel';
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
      <fieldset class="theme-wc-section">
        <legend>Color Mode</legend>
        <div class="theme-wc-options" role="radiogroup" aria-label="Color mode">
          ${ThemePicker.#MODES.map(m => `
            <label class="theme-wc-option">
              <input
                type="radio"
                name="theme-mode"
                value="${m.id}"
                ${mode === m.id ? 'checked' : ''}
              />
              <span class="theme-wc-option-content">
                <x-icon name="${m.icon}"></x-icon>
                <span>${m.name}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="theme-wc-section">
        <legend>Brand Theme</legend>
        <div class="theme-wc-options theme-wc-options--themes" role="radiogroup" aria-label="Brand theme">
          ${ThemePicker.#THEMES.map(t => `
            <label class="theme-wc-option theme-wc-option--theme">
              <input
                type="radio"
                name="theme-brand"
                value="${t.id}"
                ${brand === t.id ? 'checked' : ''}
              />
              <span class="theme-wc-option-content">
                <span class="theme-wc-swatch" style="--swatch-hue: ${t.hue}"></span>
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
    this.#autoDismiss();
  };

  #handleBrandChange = (e) => {
    ThemeManager.setBrand(e.target.value);
    this.#autoDismiss();
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

    this.#panel.style.setProperty('--theme-wc-top', `${top}px`);
    this.#panel.style.setProperty('--theme-wc-left', `${left}px`);
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
