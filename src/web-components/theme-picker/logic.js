/**
 * theme-picker: Theme selection component
 *
 * Two controls: color mode (auto/light/dark) and theme. The theme chooser
 * has two forms: a grid of swatches for every theme (default), or one
 * grouped <select> (`compact`) for tight spots. Everything else a visitor
 * can set (sizing, accessibility themes, motion, sounds) lives in
 * <settings-panel>. Integrates with ThemeManager for persistence and
 * system preference detection.
 *
 * @attr {string} variant - Display variant: 'popover' (default), 'inline'
 * @attr {boolean} compact - Theme chooser is a grouped <select> instead of the swatch grid
 * @attr {boolean} open - Reflected state only — set by open()/close()/toggle() methods, not intended as initial markup (popover variant only)
 * @attr {string} data-label-* - i18n overrides for generated strings (see LABELS)
 *
 * @example Popover variant (default): every theme as a swatch
 * <theme-picker>
 *   <button data-trigger>
 *     <icon-wc name="palette"></icon-wc>
 *     Theme
 *   </button>
 * </theme-picker>
 *
 * @example Compact: mode buttons and one select
 * <theme-picker compact></theme-picker>
 *
 * @example Inline variant (for settings pages)
 * <theme-picker variant="inline"></theme-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { ThemeManager } from '../../lib/theme-manager.js';
import { preloadTheme } from '../../lib/theme-loader.js';
import { MODES, THEME_GROUPS } from '../../lib/theme-data.js';

/** Theme id → display name, for the name shown beside the swatch grid. */
/** @type {Map<string, string>} */
const THEME_NAMES = new Map();
for (const group of THEME_GROUPS) for (const t of group.themes) THEME_NAMES.set(t.id, t.name);

/** English fallbacks for every generated string; override with data-label-<key>. */
const LABELS = {
  panel: 'Theme settings',
  trigger: 'Theme settings',
  mode: 'Color Mode',
  theme: 'Theme',
};

/** @param {unknown} v */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

let _instanceCount = 0;

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
  /** Per-instance suffix for radio-group names (two pickers on one page
   *  must not share a group — same-name radios with no form owner do). */
  #uid = ++_instanceCount;
  /** Bumped on every setup()/teardown(); a stale async init bails out. */
  #gen = 0;
  /** Last interaction with the panel was a pointer (vs. keyboard). Only
   *  pointer selections auto-dismiss; arrow-key browsing never does. */
  #pointerIntent = false;
  /** Bound handler for scroll/resize repositioning */
  #onReposition = () => this.#positionPanel();

  setup() {
    this.#isInline = this.getAttribute('variant') === 'inline';
    this.#isCompact = this.hasAttribute('compact');
    this.#initAsync(++this.#gen);
    return true;
  }

  /** @param {number} gen */
  async #initAsync(gen) {
    // When loaded from the ui pack bundle, this file's ThemeManager import is
    // a separate singleton from the core bundle's — so its _state stays null
    // until we init it ourselves. init() is idempotent.
    await ThemeManager.init();
    // Disconnected (or disconnected and reconnected) while awaiting: a newer
    // setup() owns the element now, or nobody does. Rendering here would
    // orphan a second panel and leak listeners pushed after teardown.
    if (!this.isConnected || gen !== this.#gen || this.#panel) return;
    this.#render();
    this.#bindEvents();
    this.#syncState();
    // Listen for external theme changes (another picker, settings-panel)
    this.listen(window, 'vb:theme-change', this.#handleThemeChange);
  }

  teardown() {
    this.#gen++;
    window.removeEventListener('scroll', this.#onReposition, { capture: true });
    window.removeEventListener('resize', this.#onReposition);
    this.#clearAutoDismiss();
    // Reset open state so a reinserted picker starts closed and consistent
    this.#isOpen = false;
    this.#pointerIntent = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    // Remove rendered DOM so a reconnect's setup() doesn't stack a second
    // panel (setup re-runs after disconnect clears data-upgraded)
    this.#panel?.remove();
    this.#panel = null;
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
        this.#trigger.type = 'button';
        this.#trigger.setAttribute('data-trigger', '');
        this.#trigger.innerHTML = `
          <icon-wc name="palette" label="${esc(this.#label('trigger'))}"></icon-wc>
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
    this.#panel.setAttribute('aria-label', this.#label('panel'));

    if (!this.#isInline) {
      this.#panel.id = `theme-panel-${crypto.randomUUID().slice(0, 8)}`;
      this.#trigger.setAttribute('aria-controls', this.#panel.id);
    }

    this.#panel.innerHTML = this.#renderContent();
    this.appendChild(this.#panel);
  }

  /** @param {keyof typeof LABELS} key */
  #label(key) {
    return this.getAttribute(`data-label-${key}`) || LABELS[key];
  }

  /** Per-instance radio-group name for a field. @param {string} field */
  #name(field) {
    return `theme-${field}-${this.#uid}`;
  }

  #renderContent() {
    const { mode, brand } = ThemeManager.getState();
    const modeLabel = esc(this.#label('mode'));
    const themeLabel = esc(this.#label('theme'));

    return `
      <fieldset class="section">
        <legend>${modeLabel}</legend>
        <div class="segmented" role="radiogroup" aria-label="${modeLabel}">
          ${MODES.map(m => `
            <label class="seg">
              <input type="radio" name="${this.#name('mode')}" data-field="mode" value="${m.id}" ${mode === m.id ? 'checked' : ''} />
              <span class="seg-visual">
                <icon-wc name="${m.icon}" size="xs"></icon-wc>
                <span class="seg-label">${m.name}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>${themeLabel}${this.#isCompact ? '' : ' <span class="theme-name" aria-hidden="true"></span>'}</legend>
        ${this.#isCompact ? this.#renderThemeSelect(brand, themeLabel) : this.#renderThemeGrid(brand)}
      </fieldset>
    `;
  }

  /** Compact: every theme in one grouped <select>. */
  #renderThemeSelect(brand, label) {
    return `
      <select class="theme-select" name="theme-brand-select" aria-label="${label}">
        ${THEME_GROUPS.map(group => `
          <optgroup label="${esc(group.label)}">
            ${group.themes.map(t => `
              <option value="${esc(t.id)}" ${brand === t.id ? 'selected' : ''}>${esc(t.name)}</option>
            `).join('')}
          </optgroup>
        `).join('')}
      </select>
    `;
  }

  /** Default: every theme as a swatch, grouped, in a scrolling region. */
  #renderThemeGrid(brand) {
    return `
      <div class="themes">
        ${THEME_GROUPS.filter(group => group.themes.length).map(group => `
          <div class="theme-category">
            <span class="category-label">${esc(group.label)}</span>
            <div class="swatch-grid" role="radiogroup" aria-label="${esc(group.label)}">
              ${group.themes.map(t => this.#renderSwatch(t, brand)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  #renderSwatch(t, brand) {
    const fg = t.swatchFg || 'white';
    const label = t.character ? `${t.name} — ${t.character}` : t.name;
    return `
      <label class="swatch-cell" title="${esc(label)}">
        <input
          type="radio"
          name="${this.#name('brand')}"
          data-field="brand"
          value="${esc(t.id)}"
          ${brand === t.id ? 'checked' : ''}
        />
        <span class="swatch-visual" style="--swatch-bg: ${esc(t.swatchBg)}; --swatch-fg: ${esc(fg)}">
          ${t.icon ? `<icon-wc name="${esc(t.icon)}"></icon-wc>` : ''}
          <span class="visually-hidden">${esc(t.name)}</span>
        </span>
      </label>
    `;
  }

  #bindEvents() {
    // Mode change
    this.#panel.querySelectorAll('input[data-field="mode"]').forEach(input => {
      input.addEventListener('change', this.#handleModeChange);
    });

    // Brand change — swatch grid (radio buttons)
    this.#panel.querySelectorAll('input[data-field="brand"]').forEach(input => {
      input.addEventListener('change', this.#handleBrandChange);
      // Preload theme CSS on hover/focus so selection applies instantly
      input.addEventListener('focus', this.#handleBrandPreload);
      input.closest('label')?.addEventListener('pointerenter', this.#handleBrandPreload);
    });
    // The swatches carry no visible text: name the one under the pointer or
    // focus beside the legend, and the current theme otherwise.
    const themes = this.#panel.querySelector('.themes');
    themes?.addEventListener('pointerleave', () => this.#showThemeName());
    themes?.addEventListener('focusout', () => this.#showThemeName());

    // Brand change — compact select
    const brandSelect = this.#panel.querySelector('select[name="theme-brand-select"]');
    if (brandSelect) {
      brandSelect.addEventListener('change', this.#handleBrandSelect);
    }

    // Pointer vs keyboard intent: only pointer picks auto-dismiss. Native
    // radio groups fire change on every arrow key, so dismissing on change
    // would close the popover on the first arrow press.
    this.#panel.addEventListener('pointerdown', () => { this.#pointerIntent = true; });
    this.#panel.addEventListener('keydown', () => { this.#pointerIntent = false; });

    // Popover controls
    if (!this.#isInline) {
      this.listen(this.#trigger, 'click', this.#handleTriggerClick);
      this.listen(document, 'click', this.#handleOutsideClick);
      this.listen(document, 'keydown', this.#handleEscape);
      // Non-modal: tabbing out of the picker closes it (no focus trap)
      this.listen(this, 'focusout', this.#handleFocusOut);
    }
  }

  #handleFocusOut = (e) => {
    const next = /** @type {FocusEvent} */ (e).relatedTarget;
    if (this.#isOpen && next instanceof Node && !this.contains(next)) this.close();
  };

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

  #handleBrandPreload = (e) => {
    const el = /** @type {HTMLElement} */ (e.currentTarget);
    const input = el instanceof HTMLInputElement
      ? el
      : /** @type {HTMLInputElement|null} */ (el.querySelector('input[data-field="brand"]'));
    if (input?.value) {
      preloadTheme(input.value);
      this.#showThemeName(input.value);
    }
  };

  /** @param {string} [id] - theme to name; the current theme when omitted */
  #showThemeName(id = ThemeManager.getState().brand) {
    const name = this.#panel?.querySelector('.theme-name');
    if (name) name.textContent = THEME_NAMES.get(id) ?? id;
  }

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

    this.#autoDismiss();
  };

  #autoDismiss() {
    // Only auto-dismiss in popover mode, and only for pointer selections:
    // keyboard users browse with arrows and close with Escape.
    if (this.#isInline || !this.#pointerIntent) return;

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
    if (!this.#panel) return;
    const { mode, brand } = ThemeManager.getState();

    // Update mode radios
    const modeInput = this.#panel.querySelector(`input[data-field="mode"][value="${mode}"]`);
    if (modeInput) modeInput.checked = true;

    // Update brand radios (swatch mode)
    const brandInput = this.#panel.querySelector(`input[data-field="brand"][value="${brand}"]`);
    if (brandInput) brandInput.checked = true;

    this.#showThemeName();

    // Update brand select (compact)
    const brandSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('select[name="theme-brand-select"]'));
    if (brandSelect) brandSelect.value = brand;

    // Keep the selected swatch in view inside the scrolling theme list
    if (brandInput && this.#isOpen) brandInput.closest('.swatch-cell')?.scrollIntoView({ block: 'nearest' });
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

      // Move focus into the panel: the checked mode radio, else the first control
      if (!this.#isOpen || !this.#panel) return;
      const firstInput = this.#panel.querySelector('input[type="radio"]:checked')
        || this.#panel.querySelector('input, select, button, summary, a[href]');
      /** @type {HTMLElement | null} */ (firstInput)?.focus();
      // Bring the current theme's swatch into view in the scrolling list
      this.#panel.querySelector('input[data-field="brand"]:checked')?.closest('.swatch-cell')?.scrollIntoView({ block: 'nearest' });
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

    // Horizontal position — default anchor is right: 0 (panel grows
    // leftward from the trigger's right edge). Re-anchor to a left
    // offset only if right-anchoring would push the panel off the
    // LEFT viewport edge (i.e. the trigger is near the left edge and
    // the panel is wider than the trigger's left position).
    const triggerRightFromViewport = viewportWidth - triggerRect.right;
    const panelLeftIfRightAnchored = triggerRect.right - panelRect.width;

    this.#panel.style.setProperty('--panel-top', `${top}px`);

    if (panelLeftIfRightAnchored < edgeMargin) {
      // Right-anchor would clip the left edge — flip to left-anchor and
      // compute the offset that keeps the panel inside the viewport.
      let left = 0;
      const panelRightEdge = triggerRect.left + panelRect.width + edgeMargin;
      if (panelRightEdge > viewportWidth) {
        left = viewportWidth - panelRightEdge;
      }
      if (triggerRect.left + left < edgeMargin) {
        left = edgeMargin - triggerRect.left;
      }
      this.#panel.style.setProperty('--panel-left', `${left}px`);
      this.#panel.style.setProperty('--panel-right', 'auto');
    } else {
      // Default — anchor to trigger's right edge. Pull inward when the
      // trigger sits past the right edge with edge-margin clearance.
      const rightOffset = Math.max(0, edgeMargin - triggerRightFromViewport);
      this.#panel.style.setProperty('--panel-left', 'auto');
      this.#panel.style.setProperty('--panel-right', `${rightOffset}px`);
    }
  }

  close() {
    if (this.#isInline || !this.#isOpen) return;

    this.#clearAutoDismiss();
    this.#pointerIntent = false;
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
