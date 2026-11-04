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
 * @attr {string} data-label-* - i18n overrides for generated strings (see LABELS)
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
import { preloadTheme } from '../../lib/theme-loader.js';
import {
  MODES, COLOR_ACCENTS, PERSONALITY_THEMES,
  COMMUNITY_THEMES, FLUID_PRESETS, ACCESSIBILITY_THEMES,
  EXTENSIONS, THEME_GROUPS
} from '../../lib/theme-data.js';
import { VBStore } from '../../lib/vb-store.js';
// SoundManager is lazy-loaded when sounds are enabled
let _SoundManager = null;

// Shared VBStore namespace with settings-panel — both components keep
// extension and a11y-theme state in sync via the same key.
const SETTINGS_NS = 'settings';
const EXTENSION_DEFAULTS = { motionFx: true, sounds: false };

/** English fallbacks for every generated string; override with data-label-<key>. */
const LABELS = {
  panel: 'Theme settings',
  trigger: 'Theme settings',
  mode: 'Color Mode',
  accent: 'Color Accent',
  style: 'Style',
  featured: 'Featured',
  'more-themes': 'More Themes',
  theme: 'Theme',
  a11y: 'Accessibility',
  sizing: 'Sizing',
  extensions: 'Extensions',
  download: 'Download {name} as DTCG tokens',
};

/** @param {unknown} v */
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

let _instanceCount = 0;

// Module-level singleton fetch of /cdn/themes/manifest.json. Shared
// across every <theme-picker> instance on the page (per vanilla-breeze-hojq).
// Returns the parsed manifest or null on failure (component degrades to
// no DTCG download links — the picker still works).
let _dtcgManifestPromise = null;
function loadDtcgManifest() {
  if (!_dtcgManifestPromise) {
    _dtcgManifestPromise = fetch('/cdn/themes/manifest.json', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  }
  return _dtcgManifestPromise;
}

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
  /** Per-instance suffix for radio-group names (two pickers on one page
   *  must not share a group — same-name radios with no form owner do). */
  #uid = ++_instanceCount;
  /** Bumped on every setup()/teardown(); a stale async init bails out. */
  #gen = 0;
  /** True while this instance dispatches a shared window event, so its
   *  own listener ignores it. */
  #emitting = false;
  /** Last interaction with the panel was a pointer (vs. keyboard). Only
   *  pointer selections auto-dismiss; arrow-key browsing never does. */
  #pointerIntent = false;
  /** VBStore had an a11y list. Without one, authored a11y-* tokens rule. */
  #a11yStored = false;

  // VBStore-backed state cached for synchronous render reads
  /** @type {string[]} */
  #a11yThemes = [];
  /** @type {{ motionFx: boolean, sounds: boolean }} */
  #extensions = { ...EXTENSION_DEFAULTS };

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
    // until we init it ourselves. Without this, #applyA11yThemes below reads
    // brand='default' (DEFAULTS), finds a mismatch with the boot-applied
    // data-theme, and wipes it. init() is idempotent.
    await Promise.all([ThemeManager.init(), this.#hydrateFromStore()]);
    // Disconnected (or disconnected and reconnected) while awaiting: a newer
    // setup() owns the element now, or nobody does. Rendering here would
    // orphan a second panel and leak listeners pushed after teardown.
    if (!this.isConnected || gen !== this.#gen || this.#panel) return;
    this.#render();
    this.#bindEvents();
    this.#syncState();
    // Per-theme DTCG download links from /cdn/themes/manifest.json. Async
    // and non-blocking — the picker is fully usable before the manifest
    // resolves; links materialize when it does.
    this.#enhanceWithDtcg();

    // Listen for external theme changes, and for a11y/extension changes
    // made by sibling controls (another picker, settings-panel)
    this.listen(window, 'vb:theme-change', this.#handleThemeChange);
    this.listen(window, 'vb:a11y-themes-change', this.#handleExternalA11y);
    this.listen(window, 'vb:extensions-change', this.#handleExternalExtensions);

    // Apply extension preferences on load
    this.#applyExtensions();

    // Apply stored accessibility themes on load. With nothing stored the
    // page's authored a11y-* tokens stand (seeded in #hydrateFromStore), so
    // there is nothing to rewrite.
    if (this.#a11yStored) this.#applyA11yThemes();
  }

  /** Pre-load shared settings state into instance fields so render is sync. */
  async #hydrateFromStore() {
    const [a11y, ext] = await Promise.all([
      VBStore.get(SETTINGS_NS, 'a11y'),
      VBStore.get(SETTINGS_NS, 'extensions'),
    ]);
    this.#a11yStored = Array.isArray(a11y);
    this.#a11yThemes = this.#a11yStored
      ? /** @type {unknown[]} */ (a11y).map(String)
      // No visitor preference: reflect the a11y tokens already on <html>
      // (authored, or restored by the boot script) instead of stripping them
      : (document.documentElement.dataset.theme || '').split(/\s+/).filter(t => t.startsWith('a11y-'));
    this.#extensions = { ...EXTENSION_DEFAULTS, ...(ext ?? {}) };
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
          name="${this.#name('brand')}"
          data-field="brand"
          value="${t.id}"
          ${brand === t.id ? 'checked' : ''}
        />
        <span class="swatch-visual" style="--swatch-bg: ${bg}; --swatch-fg: ${fg}">
          ${icon ? `<icon-wc name="${icon}"></icon-wc>` : ''}
          <span class="visually-hidden">${t.name}</span>
        </span>
      </label>
    `;
  }

  #renderFullContent() {
    const { mode, brand, fluid, accent } = ThemeManager.getState();
    const showcaseGroups = THEME_GROUPS.filter(g => g.tier === 'showcase');

    return `
      <fieldset class="section">
        <legend>${esc(this.#label('mode'))}</legend>
        <div class="options" role="radiogroup" aria-label="${esc(this.#label('mode'))}">
          ${MODES.map(m => `
            <label class="option">
              <input
                type="radio"
                name="${this.#name('mode')}"
                data-field="mode"
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
        <legend>${esc(this.#label('accent'))}</legend>
        <div class="options options--accent-dots" role="radiogroup" aria-label="${esc(this.#label('accent'))}">
          ${COLOR_ACCENTS.map(a => `
            <label class="accent-dot" title="${a.name}">
              <input type="radio" name="${this.#name('accent')}" data-field="accent" value="${a.id}" ${accent === a.id ? 'checked' : ''} />
              <span class="accent-dot-visual" style="background: ${a.swatchBg}"></span>
              <span class="visually-hidden">${a.name}</span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>${esc(this.#label('style'))}</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="${esc(this.#label('style'))}">
          ${PERSONALITY_THEMES.map(t => this.#renderSwatch(t, brand)).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>${esc(this.#label('featured'))}</legend>
        ${showcaseGroups.map(group => `
          <div class="theme-category">
            <span class="category-label">${group.label}</span>
            <div class="options options--swatch-grid" role="radiogroup" aria-label="${esc(group.label)}">
              ${group.themes.map(t => this.#renderSwatch(t, brand)).join('')}
            </div>
          </div>
        `).join('')}
      </fieldset>

      <details class="section section--more-themes">
        <summary class="more-themes-toggle">
          <span>${esc(this.#label('more-themes'))}</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="${esc(this.#label('more-themes'))}">
          ${COMMUNITY_THEMES.map(t => this.#renderSwatch(t, brand)).join('')}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>${esc(this.#label('a11y'))}</legend>
        <div class="options options--a11y">
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
        <legend>${esc(this.#label('sizing'))}</legend>
        <div class="options options--sizing" role="radiogroup" aria-label="${esc(this.#label('sizing'))}">
          ${FLUID_PRESETS.map(f => `
            <label class="option option--sizing">
              <input
                type="radio"
                name="${this.#name('fluid')}"
                data-field="fluid"
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
          <span>${esc(this.#label('extensions'))}</span>
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
    const { mode, brand, fluid, accent } = ThemeManager.getState();
    const a11yThemes = this.#loadA11yThemes();
    const prefs = this.#loadExtensions();

    return `
      <fieldset class="section">
        <legend>${esc(this.#label('mode'))}</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="${esc(this.#label('mode'))}">
          ${MODES.map(m => `
            <label class="compact-seg">
              <input type="radio" name="${this.#name('mode')}" data-field="mode" value="${m.id}" ${mode === m.id ? 'checked' : ''} />
              <span class="compact-seg-visual">
                <icon-wc name="${m.icon}" size="xs"></icon-wc>
                <span class="compact-seg-label">${m.name}</span>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>${esc(this.#label('accent'))}</legend>
        <select class="compact-select" name="theme-accent-select" aria-label="${esc(this.#label('accent'))}">
          ${COLOR_ACCENTS.map(a => `
            <option value="${a.id}" ${accent === a.id ? 'selected' : ''}>${a.name}</option>
          `).join('')}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>${esc(this.#label('theme'))}</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="${esc(this.#label('theme'))}">
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
        <legend>${esc(this.#label('sizing'))}</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="${esc(this.#label('sizing'))}">
          ${FLUID_PRESETS.map(f => `
            <option value="${f.id}" ${fluid === f.id ? 'selected' : ''}>${f.name}</option>
          `).join('')}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>${esc(this.#label('a11y'))}</legend>
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
        <legend>${esc(this.#label('extensions'))}</legend>
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

    // Brand change — compact select
    const brandSelect = this.#panel.querySelector('select[name="theme-brand-select"]');
    if (brandSelect) {
      brandSelect.addEventListener('change', this.#handleBrandSelect);
    }

    // Fluid change — radio buttons (full mode)
    this.#panel.querySelectorAll('input[data-field="fluid"]').forEach(input => {
      input.addEventListener('change', this.#handleFluidChange);
    });

    // Fluid change — select (compact mode)
    const fluidSelect = this.#panel.querySelector('select[name="theme-fluid-select"]');
    if (fluidSelect) {
      fluidSelect.addEventListener('change', this.#handleFluidChange);
    }

    // Accent change — dot radios (full mode)
    this.#panel.querySelectorAll('input[data-field="accent"]').forEach(input => {
      input.addEventListener('change', this.#handleAccentChange);
    });

    // Accent change — select (compact mode)
    const accentSelect = this.#panel.querySelector('select[name="theme-accent-select"]');
    if (accentSelect) {
      accentSelect.addEventListener('change', this.#handleAccentChange);
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
    if (input?.value) preloadTheme(input.value);
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

  #handleAccentChange = (e) => {
    ThemeManager.setAccent(e.target.value);
    this.#autoDismiss();
  };

  #handleExtensionChange = (e) => {
    const extId = e.target.dataset.extension;
    const isEnabled = e.target.checked;
    this.#saveExtension(extId, isEnabled);
    this.#applyExtensions();
  };

  /**
   * Load extension preferences from the in-memory cache.
   * @returns {object}
   */
  #loadExtensions() {
    return { ...this.#extensions };
  }

  /**
   * Save a single extension preference. Updates the cache and writes through
   * to VBStore (fire-and-forget — matches old localStorage silent-fail).
   * @param {string} id
   * @param {boolean} enabled
   */
  #saveExtension(id, enabled) {
    this.#extensions = { ...this.#extensions, [id]: enabled };
    VBStore.set(SETTINGS_NS, 'extensions', this.#extensions).catch(() => { /* ignore */ });
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

    // Dispatch event for listeners (sibling pickers, settings-panel)
    this.#emitWindow('vb:extensions-change', prefs);
  }

  /** Dispatch a shared window event without reacting to it ourselves. */
  #emitWindow(name, detail) {
    this.#emitting = true;
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } finally {
      this.#emitting = false;
    }
  }

  /** Another control changed the a11y themes: adopt the list, re-sync checkboxes. */
  #handleExternalA11y = (e) => {
    if (this.#emitting || !Array.isArray(e.detail)) return;
    this.#a11yThemes = e.detail.map(String);
    this.#a11yStored = true;
    this.#syncToggles();
  };

  /** Another control changed extensions: adopt them, re-sync checkboxes. */
  #handleExternalExtensions = (e) => {
    if (this.#emitting || !e.detail || typeof e.detail !== 'object') return;
    this.#extensions = { ...EXTENSION_DEFAULTS, ...e.detail };
    this.#syncToggles();
  };

  #syncToggles() {
    if (!this.#panel) return;
    for (const input of this.#panel.querySelectorAll('input[data-a11y-theme]')) {
      /** @type {HTMLInputElement} */ (input).checked = this.#a11yThemes.includes(input.dataset.a11yTheme || '');
    }
    for (const input of this.#panel.querySelectorAll('input[data-extension]')) {
      const id = input.dataset.extension || '';
      /** @type {HTMLInputElement} */ (input).checked = !!(this.#extensions[id] ?? EXTENSION_DEFAULTS[id]);
    }
  }

  /**
   * Load accessibility theme preferences from the in-memory cache.
   * @returns {string[]} Array of active a11y theme IDs
   */
  #loadA11yThemes() {
    return [...this.#a11yThemes];
  }

  /**
   * Save accessibility theme preferences. Updates the cache and writes
   * through to VBStore (fire-and-forget).
   * @param {string[]} themes Array of active a11y theme IDs
   */
  #saveA11yThemes(themes) {
    this.#a11yThemes = [...themes];
    this.#a11yStored = true;
    VBStore.set(SETTINGS_NS, 'a11y', this.#a11yThemes).catch(() => { /* ignore */ });
    // Keep sibling controls (settings-panel, other pickers) in sync.
    this.#emitWindow('vb:a11y-themes-change', [...this.#a11yThemes]);
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
    const { mode, brand, fluid, accent } = ThemeManager.getState();

    // Update mode radios
    const modeInput = this.#panel.querySelector(`input[data-field="mode"][value="${mode}"]`);
    if (modeInput) modeInput.checked = true;

    // Update brand radios (swatch mode)
    const brandInput = this.#panel.querySelector(`input[data-field="brand"][value="${brand}"]`);
    if (brandInput) brandInput.checked = true;

    // Update brand select (compact mode)
    const brandSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('select[name="theme-brand-select"]'));
    if (brandSelect) brandSelect.value = brand;

    // Update fluid radios (full mode)
    const fluidInput = this.#panel.querySelector(`input[data-field="fluid"][value="${fluid}"]`);
    if (fluidInput) fluidInput.checked = true;

    // Update fluid select (compact mode)
    const fluidSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('select[name="theme-fluid-select"]'));
    if (fluidSelect) fluidSelect.value = fluid;

    // Update accent radios (full mode)
    const accentInput = this.#panel.querySelector(`input[data-field="accent"][value="${accent || 'default'}"]`);
    if (accentInput) accentInput.checked = true;

    // Update accent select (compact mode)
    const accentSelect = this.#panel.querySelector('select[name="theme-accent-select"]');
    if (accentSelect) accentSelect.value = accent || 'default';

    // Re-target DTCG download links to the right (light/dark) variant for
    // the current mode. Cheap query — links may not exist yet (manifest
    // still loading) which is fine.
    this.#panel.querySelectorAll('.swatch-dtcg').forEach((link) => this.#updateDtcgLinkHref(link));
  }

  // ── DTCG download enhancement (vanilla-breeze-hojq) ────────────────

  async #enhanceWithDtcg() {
    const manifest = await loadDtcgManifest();
    if (!manifest || !this.#panel?.isConnected) return;

    for (const input of this.#panel.querySelectorAll('input[data-field="brand"]')) {
      const id = input.value;
      const entry = manifest[id];
      if (!entry?.dtcg) continue;

      const label = input.closest('.swatch-cell');
      if (!label || label.parentElement?.classList.contains('swatch-cell-group')) continue;

      // Wrap the label in a positioning context so the absolute-positioned
      // link doesn't activate the radio (which would happen if it were
      // inside the <label>).
      const wrapper = document.createElement('span');
      wrapper.className = 'swatch-cell-group';
      label.parentNode.insertBefore(wrapper, label);
      wrapper.appendChild(label);

      const link = document.createElement('a');
      link.className = 'swatch-dtcg';
      link.dataset.dtcg = entry.dtcg;
      if (entry.dtcgDark) link.dataset.dtcgDark = entry.dtcgDark;
      link.setAttribute('download', '');
      const themeName = label.getAttribute('title') || id;
      const downloadLabel = this.#label('download').replace('{name}', themeName);
      link.setAttribute('aria-label', downloadLabel);
      link.setAttribute('title', downloadLabel);
      link.innerHTML = '<icon-wc name="download" size="xs"></icon-wc>';

      this.#updateDtcgLinkHref(link);
      // Native <a download> handles the file save; emit a sibling custom
      // event for analytics consumers (matches api.json contract).
      link.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('theme-picker:dtcg-download', {
          bubbles: true,
          detail: { themeId: id, href: link.href },
        }));
      });
      wrapper.appendChild(link);
    }
  }

  #updateDtcgLinkHref(link) {
    const mode = ThemeManager.getState().mode;
    const isDark = mode === 'dark'
      || (mode === 'auto' && typeof matchMedia === 'function'
          && matchMedia('(prefers-color-scheme: dark)').matches);
    const file = isDark && link.dataset.dtcgDark ? link.dataset.dtcgDark : link.dataset.dtcg;
    link.href = `/cdn/themes/${file}`;
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
