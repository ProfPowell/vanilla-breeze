import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * settings-panel: Compact settings panel
 *
 * A gear-button-triggered settings panel using <details> accordion sections,
 * <select> dropdowns, and toggle switches. Runs in parallel with theme-picker
 * and shares state through ThemeManager, VBStore, and custom events.
 *
 * @example Footer integration (auto-generates gear trigger)
 * <settings-panel></settings-panel>
 *
 * @attr {boolean} open - Reflected state only — set by open()/close()/toggle() methods, not intended as initial markup
 *
 * @example With custom trigger
 * <settings-panel>
 *   <button data-trigger>Settings</button>
 * </settings-panel>
 */

import { ThemeManager } from '../../lib/theme-manager.js';
import { EnvironmentManager } from '../../lib/environment-manager.js';
import { getVBVersion, getSWStatus, clearSWCache, checkForUpdate } from '../../lib/sw-register.js';
import { THEME_GROUPS } from '../../lib/theme-data.js';
import { VBStore } from '../../lib/vb-store.js';
// SoundManager is lazy-loaded when sounds are enabled
let _SoundManager = null;

const SETTINGS_NS = 'settings';
const EXTENSION_DEFAULTS = { motionFx: true, sounds: false };

class SettingsPanel extends VBElement {
  /** @type {HTMLElement} */
  #trigger = /** @type {*} */ (null);
  /** @type {HTMLDivElement} */
  #panel = /** @type {*} */ (null);
  #isOpen = false;

  // VBStore-backed state cached for synchronous render reads
  /** @type {string[]} */
  #a11yThemes = [];
  /** @type {{ motionFx: boolean, sounds: boolean }} */
  #extensions = { ...EXTENSION_DEFAULTS };
  #stickyOn = false;

  setup() {
    this.#initAsync();
    return true;
  }

  async #initAsync() {
    await this.#hydrateFromStore();
    this.#render();
    this.#bindEvents();
    this.#syncState();

    this.listen(window, 'vb:theme-change', this.#handleExternalChange);
    this.listen(window, 'vb:extensions-change', this.#handleExternalChange);
    this.listen(window, 'vb:a11y-themes-change', this.#handleExternalChange);
  }

  teardown() {
    // Remove the rendered panel so a reconnect's setup() doesn't stack a
    // second one (the trigger is find-or-create and safely reused)
    this.#panel?.remove();
    this.#panel = null;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current settings as a plain data object combining all the
   * VBStore-backed state the panel manages. Reactive consumers can use
   * this to mirror the user's settings into framework state.
   */
  get data() {
    return {
      a11yThemes: [...this.#a11yThemes],
      extensions: { ...this.#extensions },
      sticky: this.#stickyOn,
    };
  }

  /**
   * Replace the panel's settings in one assignment. Writes through to
   * VBStore for each non-undefined field, then re-syncs the UI.
   * Setter returns synchronously; the VBStore writes complete in the
   * background. Emits settings-panel:data-changed { data, source: 'property' }
   * once the writes finish.
   */
  set data(value) {
    if (!value || typeof value !== 'object') return;
    const writes = [];
    if (Array.isArray(value.a11yThemes)) {
      this.#a11yThemes = [...value.a11yThemes];
      writes.push(VBStore.set(SETTINGS_NS, 'a11y', this.#a11yThemes));
    }
    if (value.extensions && typeof value.extensions === 'object') {
      this.#extensions = { ...EXTENSION_DEFAULTS, ...value.extensions };
      writes.push(VBStore.set(SETTINGS_NS, 'extensions', this.#extensions));
    }
    if (value.sticky != null) {
      this.#stickyOn = !!value.sticky;
      writes.push(VBStore.set(SETTINGS_NS, 'sticky', this.#stickyOn ? 'on' : 'off'));
    }
    Promise.all(writes).then(() => {
      this.#syncState?.();
      this.dispatchEvent(new CustomEvent('settings-panel:data-changed', {
        detail: { data: this.data, source: 'property' },
        bubbles: true,
      }));
    });
  }

  /** Pre-load all VBStore-backed state into instance fields so render is sync. */
  async #hydrateFromStore() {
    const [a11y, ext, sticky] = await Promise.all([
      VBStore.get(SETTINGS_NS, 'a11y'),
      VBStore.get(SETTINGS_NS, 'extensions'),
      VBStore.get(SETTINGS_NS, 'sticky'),
    ]);
    this.#a11yThemes = Array.isArray(a11y) ? a11y : [];
    this.#extensions = { ...EXTENSION_DEFAULTS, ...(ext ?? {}) };
    this.#stickyOn = sticky === 'on';
  }

  // --- Mapping helpers ---

  /** Is fluid scaling enabled? (any non-empty fluid value) */
  #isFluidOn(fluid) {
    return fluid !== '' && fluid !== undefined;
  }

  /** Get the density preset from a fluid value */
  #getDensity(fluid) {
    if (fluid === 'compact') return 'compact';
    if (fluid === 'spacious') return 'spacious';
    return 'default';
  }

  /** Build the fluid value from toggle + density */
  #buildFluidValue(fluidOn, density) {
    if (!fluidOn) return '';
    if (density === 'compact') return 'compact';
    if (density === 'spacious') return 'spacious';
    return 'default';
  }

  /** Is sticky navigation enabled? */
  #isStickyOn() {
    return this.#stickyOn;
  }

  /** Is backdrop enabled? (any non-empty backdrop value) */
  #isBackdropOn(backdrop) {
    return backdrop !== '' && backdrop !== undefined;
  }

  /** Get the backdrop preset from a backdrop value */
  #getBackdropPreset(backdrop) {
    if (backdrop === 'flush') return 'flush';
    if (backdrop === 'elevated') return 'elevated';
    return 'default';
  }

  /** Build the backdrop value from toggle + preset */
  #buildBackdropValue(backdropOn, preset) {
    if (!backdropOn) return '';
    if (preset === 'flush') return 'flush';
    if (preset === 'elevated') return 'elevated';
    return 'default';
  }

  /** Extract the chrome mode (card/stretch/integrated) from a space-separated value */
  #getChromeMode(chromeValue) {
    if (!chromeValue) return 'card';
    const parts = chromeValue.split(/\s+/);
    for (const p of parts) {
      if (p === 'stretch' || p === 'integrated') return p;
    }
    return 'card';
  }

  /** Check if 'fixed' is present in the chrome value */
  #isFixedOn(chromeValue) {
    if (!chromeValue) return false;
    return chromeValue.split(/\s+/).includes('fixed');
  }

  /** Build the chrome value from mode + fixed flag */
  #buildChromeValue(mode, fixed) {
    const parts = [];
    if (mode && mode !== 'card') parts.push(mode);
    if (fixed) parts.push('fixed');
    return parts.join(' ') || 'card';
  }

  // --- Render ---

  #render() {
    // Find or create trigger
    this.#trigger = /** @type {HTMLElement} */ (this.querySelector(':scope > [data-trigger]') || this.querySelector(':scope > button'));
    if (!this.#trigger) {
      this.#trigger = document.createElement('button');
      this.#trigger.setAttribute('data-trigger', '');
      this.#trigger.setAttribute('aria-label', 'Site settings');
      this.#trigger.className = 'settings-trigger';
      this.#trigger.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;
      this.prepend(this.#trigger);
    }

    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');

    // Create panel
    this.#panel = document.createElement('div');
    this.#panel.className = 'settings-panel';
    this.#panel.setAttribute('role', 'dialog');
    this.#panel.setAttribute('aria-label', 'Site settings');

    const panelId = `settings-panel-${crypto.randomUUID().slice(0, 8)}`;
    this.#panel.id = panelId;
    this.#trigger.setAttribute('aria-controls', panelId);

    this.#panel.innerHTML = this.#renderPanel();
    this.appendChild(this.#panel);
  }

  #renderPanel() {
    const { mode, brand, fluid, backdrop, backdropChrome, pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir } = ThemeManager.getState();
    const a11yThemes = this.#loadA11yThemes();
    const extensions = this.#loadExtensions();
    const fluidOn = this.#isFluidOn(fluid);
    const density = this.#getDensity(fluid);
    const backdropOn = this.#isBackdropOn(backdrop);
    const backdropPreset = this.#getBackdropPreset(backdrop);

    return `
      <header class="settings-header">
        <strong>Settings</strong>
        <button type="button" class="settings-close" aria-label="Close settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      <div class="settings-body">
        <!-- Appearance -->
        <details name="settings" open>
          <summary>Appearance</summary>
          <div class="settings-section">
            <span class="settings-label">Color Mode</span>
            <fieldset data-segmented>
              <legend class="visually-hidden">Color mode</legend>
              ${[
                { id: 'auto', name: 'Auto', icon: 'monitor' },
                { id: 'light', name: 'Light', icon: 'sun' },
                { id: 'dark', name: 'Dark', icon: 'moon' },
              ].map(m => `
                <label>
                  <input type="radio" name="settings-mode" value="${m.id}" ${mode === m.id ? 'checked' : ''} />
                  <icon-wc name="${m.icon}" size="xs"></icon-wc> ${m.name}
                </label>
              `).join('')}
            </fieldset>

            <label class="settings-label" for="settings-theme">Theme</label>
            <select id="settings-theme" name="settings-theme">
              ${THEME_GROUPS.map(group => `
                <optgroup label="${group.label}">
                  ${group.themes.map(t => `
                    <option value="${t.id}" ${brand === t.id ? 'selected' : ''}>${t.name}</option>
                  `).join('')}
                </optgroup>
              `).join('')}
            </select>
          </div>
        </details>

        <!-- Accessibility -->
        <details name="settings">
          <summary>Accessibility</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>High Contrast</span>
              <input type="checkbox" name="a11y-high-contrast" data-switch="sm" data-a11y="a11y-high-contrast" ${a11yThemes.includes('a11y-high-contrast') ? 'checked' : ''} />
            </label>
            <label class="toggle-row">
              <span>Large Text</span>
              <input type="checkbox" name="a11y-large-text" data-switch="sm" data-a11y="a11y-large-text" ${a11yThemes.includes('a11y-large-text') ? 'checked' : ''} />
            </label>
            <label class="toggle-row">
              <span>Dyslexia-Friendly</span>
              <input type="checkbox" name="a11y-dyslexia" data-switch="sm" data-a11y="a11y-dyslexia" ${a11yThemes.includes('a11y-dyslexia') ? 'checked' : ''} />
            </label>
          </div>
        </details>

        <!-- Layout -->
        <details name="settings">
          <summary>Layout</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Fluid Scaling</span>
              <input type="checkbox" name="fluid-scaling" data-switch="sm" data-fluid-toggle ${fluidOn ? 'checked' : ''} />
            </label>
            <div class="density-row" ${fluidOn ? '' : 'hidden'}>
              <span class="settings-label">Density</span>
              <fieldset data-segmented>
                <legend class="visually-hidden">Density</legend>
                ${['compact', 'default', 'spacious'].map(d => `
                  <label>
                    <input type="radio" name="settings-density" value="${d}" ${density === d ? 'checked' : ''} />
                    ${d[0].toUpperCase() + d.slice(1)}
                  </label>
                `).join('')}
              </fieldset>
            </div>

            <label class="toggle-row">
              <span>Canvas Backdrop</span>
              <input type="checkbox" name="canvas-backdrop" data-switch="sm" data-backdrop-toggle ${backdropOn ? 'checked' : ''} />
            </label>
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              <span class="settings-label">Style</span>
              <fieldset data-segmented>
                <legend class="visually-hidden">Backdrop style</legend>
                ${['default', 'flush', 'elevated'].map(p => `
                  <label>
                    <input type="radio" name="settings-backdrop" value="${p}" ${backdropPreset === p ? 'checked' : ''} />
                    ${p[0].toUpperCase() + p.slice(1)}
                  </label>
                `).join('')}
              </fieldset>
            </div>
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              <span class="settings-label">Chrome</span>
              <fieldset data-segmented>
                <legend class="visually-hidden">Backdrop chrome mode</legend>
                ${['card', 'stretch', 'integrated'].map(c => `
                  <label>
                    <input type="radio" name="settings-backdrop-chrome" value="${c}" ${this.#getChromeMode(backdropChrome) === c ? 'checked' : ''} />
                    ${c[0].toUpperCase() + c.slice(1)}
                  </label>
                `).join('')}
              </fieldset>
            </div>
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              <label class="toggle-row">
                <span>Fixed Header</span>
                <input type="checkbox" name="settings-backdrop-fixed" data-switch="sm" data-backdrop-fixed ${this.#isFixedOn(backdropChrome) ? 'checked' : ''} />
              </label>
            </div>
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              <label class="settings-label" for="settings-page-bg">Page Background</label>
              <select id="settings-page-bg" name="settings-page-bg">
                <option value="" ${pageBgType === '' ? 'selected' : ''}>Theme Default</option>
                <option value="color" ${pageBgType === 'color' ? 'selected' : ''}>Solid Color</option>
                <option value="gradient" ${pageBgType === 'gradient' ? 'selected' : ''}>Gradient</option>
              </select>
            </div>
            <div class="page-bg-color-row backdrop-row" ${pageBgType === 'color' && backdropOn ? '' : 'hidden'}>
              <span class="settings-label">Color</span>
              <input type="color" name="settings-page-bg-color" value="${pageBgColor || '#1a1a2e'}" />
            </div>
            <div class="page-bg-grad-row backdrop-row" ${pageBgType === 'gradient' && backdropOn ? '' : 'hidden'}>
              <span class="settings-label">Start</span>
              <input type="color" name="settings-page-bg-grad-start" value="${pageBgGradStart || '#1a1a2e'}" />
              <span class="settings-label">End</span>
              <input type="color" name="settings-page-bg-grad-end" value="${pageBgGradEnd || '#16213e'}" />
            </div>
            <div class="page-bg-grad-dir-row backdrop-row" ${pageBgType === 'gradient' && backdropOn ? '' : 'hidden'}>
              <span class="settings-label">Direction</span>
              <select name="settings-page-bg-grad-dir">
                <option value="to bottom" ${(pageBgGradDir || 'to bottom') === 'to bottom' ? 'selected' : ''}>Top → Bottom</option>
                <option value="to right" ${pageBgGradDir === 'to right' ? 'selected' : ''}>Left → Right</option>
                <option value="135deg" ${pageBgGradDir === '135deg' ? 'selected' : ''}>Diagonal ↘</option>
                <option value="45deg" ${pageBgGradDir === '45deg' ? 'selected' : ''}>Diagonal ↗</option>
              </select>
            </div>

            <label class="toggle-row">
              <span>Sticky Navigation</span>
              <input type="checkbox" name="sticky-nav" data-switch="sm" data-sticky-toggle ${this.#isStickyOn() ? 'checked' : ''} />
            </label>
          </div>
        </details>

        <!-- Effects -->
        <details name="settings">
          <summary>Effects</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Motion Effects</span>
              <input type="checkbox" name="ext-motionFx" data-switch="sm" data-ext="motionFx" ${extensions.motionFx ? 'checked' : ''} />
            </label>
            <label class="toggle-row">
              <span>Sound Effects</span>
              <input type="checkbox" name="ext-sounds" data-switch="sm" data-ext="sounds" ${extensions.sounds ? 'checked' : ''} />
            </label>
          </div>
        </details>

        <!-- Environment -->
        <details name="settings">
          <summary>Environment</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Time-of-Day Shifts</span>
              <input type="checkbox" name="env-timeOfDay" data-switch="sm" data-env="timeOfDay" ${this.#loadEnvPrefs().timeOfDay ? 'checked' : ''} />
            </label>
            <label class="toggle-row">
              <span>Seasonal Tinting</span>
              <input type="checkbox" name="env-seasonal" data-switch="sm" data-env="seasonal" ${this.#loadEnvPrefs().seasonal ? 'checked' : ''} />
            </label>
          </div>
        </details>

        <!-- System -->
        <details name="settings">
          <summary>System</summary>
          <div class="settings-section system-info">
            <p class="system-version">Vanilla Breeze <code>v${getVBVersion()}</code></p>
            <p class="system-sw-status" data-sw-status>Service Worker: <span>checking…</span></p>
            <footer class="system-actions">
              <button type="button" data-action="clear-cache">Clear Cache</button>
              <button type="button" data-action="check-update">Check for Updates</button>
            </footer>
          </div>
        </details>
      </div>

      <footer class="settings-footer">
        <button type="button" class="settings-reset">Reset to Defaults</button>
      </footer>
    `;
  }

  // --- Event binding ---

  #bindEvents() {
    // Trigger
    this.#trigger.addEventListener('click', this.#handleTriggerClick);
    this.listen(document, 'click', this.#handleOutsideClick);
    this.listen(document, 'keydown', this.#handleEscape);

    // Close button
    this.#panel.querySelector('.settings-close')?.addEventListener('click', () => this.close());

    // Mode (segmented control)
    this.#panel.querySelectorAll('input[name="settings-mode"]').forEach(input => {
      input.addEventListener('change', this.#handleModeChange);
    });

    // Theme select
    this.#panel.querySelector('#settings-theme')?.addEventListener('change', this.#handleThemeChange);

    // Fluid toggle
    this.#panel.querySelector('input[data-fluid-toggle]')?.addEventListener('change', this.#handleFluidToggle);

    // Density segmented control
    this.#panel.querySelectorAll('input[name="settings-density"]').forEach(input => {
      input.addEventListener('change', this.#handleDensityChange);
    });

    // Backdrop toggle
    this.#panel.querySelector('input[data-backdrop-toggle]')?.addEventListener('change', this.#handleBackdropToggle);

    // Backdrop preset segmented control
    this.#panel.querySelectorAll('input[name="settings-backdrop"]').forEach(input => {
      input.addEventListener('change', this.#handleBackdropPreset);
    });

    // Backdrop chrome mode segmented control
    this.#panel.querySelectorAll('input[name="settings-backdrop-chrome"]').forEach(input => {
      input.addEventListener('change', this.#handleBackdropChrome);
    });

    // Backdrop fixed header toggle
    this.#panel.querySelector('input[data-backdrop-fixed]')?.addEventListener('change', this.#handleBackdropFixed);

    // Sticky navigation toggle
    this.#panel.querySelector('input[data-sticky-toggle]')?.addEventListener('change', this.#handleStickyToggle);

    // Page background type
    this.#panel.querySelector('[name="settings-page-bg"]')?.addEventListener('change', this.#handlePageBgType);

    // Page background color/gradient inputs
    this.#panel.querySelector('[name="settings-page-bg-color"]')?.addEventListener('input', this.#handlePageBgChange);
    this.#panel.querySelector('[name="settings-page-bg-grad-start"]')?.addEventListener('input', this.#handlePageBgChange);
    this.#panel.querySelector('[name="settings-page-bg-grad-end"]')?.addEventListener('input', this.#handlePageBgChange);
    this.#panel.querySelector('[name="settings-page-bg-grad-dir"]')?.addEventListener('change', this.#handlePageBgChange);

    // Accessibility toggles
    this.#panel.querySelectorAll('input[data-a11y]').forEach(input => {
      input.addEventListener('change', this.#handleA11yChange);
    });

    // Extension toggles
    this.#panel.querySelectorAll('input[data-ext]').forEach(input => {
      input.addEventListener('change', this.#handleExtensionChange);
    });

    // Environment toggles
    this.#panel.querySelectorAll('input[data-env]').forEach(input => {
      input.addEventListener('change', this.#handleEnvironmentChange);
    });

    // Reset button
    this.#panel.querySelector('.settings-reset')?.addEventListener('click', this.#handleReset);

    // System section
    this.#panel.querySelector('[data-action="clear-cache"]')?.addEventListener('click', this.#handleClearCache);
    this.#panel.querySelector('[data-action="check-update"]')?.addEventListener('click', this.#handleCheckUpdate);
    this.#refreshSWStatus();
  }

  // --- Event handlers ---

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

  #handleThemeChange = async (e) => {
    const select = e.target;
    select.disabled = true;

    try {
      await ThemeManager.setBrand(select.value);
      this.#reapplyA11yThemes();
    } catch {
      console.warn('[VB] Theme load failed, using default');
    } finally {
      select.disabled = false;
    }
  };

  #handleFluidToggle = (e) => {
    const fluidOn = e.target.checked;
    const density = this.#getDensity(ThemeManager.getState().fluid) || 'default';
    ThemeManager.setFluid(this.#buildFluidValue(fluidOn, density));
    this.#updateDensityVisibility(fluidOn);
  };

  #handleDensityChange = (e) => {
    ThemeManager.setFluid(this.#buildFluidValue(true, e.target.value));
  };

  #handleBackdropToggle = (e) => {
    const backdropOn = e.target.checked;
    const preset = this.#getBackdropPreset(ThemeManager.getState().backdrop) || 'default';
    ThemeManager.setBackdrop(this.#buildBackdropValue(backdropOn, preset));
    this.#updateBackdropVisibility(backdropOn);
  };

  #handleBackdropPreset = (e) => {
    ThemeManager.setBackdrop(this.#buildBackdropValue(true, e.target.value));
  };

  #handleBackdropChrome = (e) => {
    const fixed = this.#isFixedOn(ThemeManager.getState().backdropChrome);
    ThemeManager.setBackdropChrome(this.#buildChromeValue(e.target.value, fixed));
  };

  #handleBackdropFixed = (e) => {
    const mode = this.#getChromeMode(ThemeManager.getState().backdropChrome);
    ThemeManager.setBackdropChrome(this.#buildChromeValue(mode, e.target.checked));
  };

  #handleStickyToggle = async (e) => {
    const on = e.target.checked;
    this.#stickyOn = on;
    await VBStore.set(SETTINGS_NS, 'sticky', on ? 'on' : 'off');

    const header = document.querySelector('header');

    if (on) {
      document.documentElement.dataset.sticky = '';
      if (header) header.dataset.sticky = '';
      const { initStickyManager } = await import('../../lib/sticky-manager.js');
      initStickyManager();
    } else {
      delete document.documentElement.dataset.sticky;
      if (header) delete header.dataset.sticky;
      const { destroyStickyManager } = await import('../../lib/sticky-manager.js');
      destroyStickyManager();
    }
  };

  #handlePageBgType = (e) => {
    const type = e.target.value;
    this.#updatePageBgVisibility(type);
    if (type === 'color') {
      const color = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-color"]'))?.value || '#1a1a2e';
      ThemeManager.setPageBg({ type, color });
    } else if (type === 'gradient') {
      const gradStart = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-start"]'))?.value || '#1a1a2e';
      const gradEnd = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-end"]'))?.value || '#16213e';
      const gradDir = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-dir"]'))?.value || 'to bottom';
      ThemeManager.setPageBg({ type, gradStart, gradEnd, gradDir });
    } else {
      ThemeManager.setPageBg({});
    }
  };

  #handlePageBgChange = () => {
    const type = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('[name="settings-page-bg"]'))?.value || '';
    if (type === 'color') {
      const color = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-color"]'))?.value || '';
      ThemeManager.setPageBg({ type, color });
    } else if (type === 'gradient') {
      const gradStart = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-start"]'))?.value || '';
      const gradEnd = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-end"]'))?.value || '';
      const gradDir = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-dir"]'))?.value || 'to bottom';
      ThemeManager.setPageBg({ type, gradStart, gradEnd, gradDir });
    }
  };

  #handleA11yChange = (e) => {
    const themeId = e.target.dataset.a11y;
    const current = this.#loadA11yThemes();

    if (e.target.checked && !current.includes(themeId)) {
      current.push(themeId);
    } else if (!e.target.checked) {
      const idx = current.indexOf(themeId);
      if (idx !== -1) current.splice(idx, 1);
    }

    this.#saveA11yThemes(current);
    this.#applyA11yThemes();
    window.dispatchEvent(new CustomEvent('vb:a11y-themes-change', { detail: current }));
  };

  #handleExtensionChange = (e) => {
    const extId = e.target.dataset.ext;
    const enabled = e.target.checked;
    this.#saveExtension(extId, enabled);
    this.#applyExtensions();
  };

  #handleEnvironmentChange = (e) => {
    const source = e.target.dataset.env;
    const enabled = e.target.checked;
    EnvironmentManager.setSource(source, enabled);
  };

  #handleReset = () => {
    if (!confirm('Reset all settings to defaults?')) return;

    ThemeManager.reset();

    // Clear a11y themes
    this.#saveA11yThemes([]);
    this.#applyA11yThemes();
    window.dispatchEvent(new CustomEvent('vb:a11y-themes-change', { detail: [] }));

    // Reset extensions
    this.#extensions = { ...EXTENSION_DEFAULTS };
    VBStore.remove(SETTINGS_NS, 'extensions').catch(() => { /* ignore */ });
    this.#applyExtensions();

    // Reset sticky navigation
    this.#stickyOn = false;
    VBStore.remove(SETTINGS_NS, 'sticky').catch(() => { /* ignore */ });
    delete document.documentElement.dataset.sticky;
    import('../../lib/sticky-manager.js').then(m => m.destroyStickyManager()).catch(() => {});

    // Reset environment
    EnvironmentManager.setSource('timeOfDay', false);
    EnvironmentManager.setSource('seasonal', false);

    // Re-sync UI
    this.#syncState();
  };

  #handleExternalChange = () => {
    this.#syncState();
  };

  // --- State sync ---

  #syncState() {
    const { mode, brand, fluid, backdrop, backdropChrome, pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir } = ThemeManager.getState();
    const a11yThemes = this.#loadA11yThemes();
    const extensions = this.#loadExtensions();
    const fluidOn = this.#isFluidOn(fluid);
    const density = this.#getDensity(fluid);
    const backdropOn = this.#isBackdropOn(backdrop);
    const backdropPreset = this.#getBackdropPreset(backdrop);

    // Mode
    const modeInput = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector(`input[name="settings-mode"][value="${mode}"]`));
    if (modeInput) modeInput.checked = true;

    // Theme select
    const themeSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('#settings-theme'));
    if (themeSelect) themeSelect.value = brand || 'default';

    // Fluid toggle
    const fluidToggle = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('input[data-fluid-toggle]'));
    if (fluidToggle) fluidToggle.checked = fluidOn;

    // Density
    const densityInput = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector(`input[name="settings-density"][value="${density}"]`));
    if (densityInput) densityInput.checked = true;
    this.#updateDensityVisibility(fluidOn);

    // Backdrop toggle
    const backdropToggle = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('input[data-backdrop-toggle]'));
    if (backdropToggle) backdropToggle.checked = backdropOn;

    // Backdrop preset
    const backdropInput = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector(`input[name="settings-backdrop"][value="${backdropPreset}"]`));
    if (backdropInput) backdropInput.checked = true;

    // Backdrop chrome mode (parse space-separated value)
    const chromeMode = this.#getChromeMode(backdropChrome);
    const chromeInput = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector(`input[name="settings-backdrop-chrome"][value="${chromeMode}"]`));
    if (chromeInput) chromeInput.checked = true;

    // Backdrop fixed header toggle
    const fixedToggle = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('input[data-backdrop-fixed]'));
    if (fixedToggle) fixedToggle.checked = this.#isFixedOn(backdropChrome);
    this.#updateBackdropVisibility(backdropOn);

    // Page background
    const pageBgSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('[name="settings-page-bg"]'));
    if (pageBgSelect) pageBgSelect.value = pageBgType || '';
    const pageBgColorInput = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-color"]'));
    if (pageBgColorInput && pageBgColor) pageBgColorInput.value = pageBgColor;
    const gradStartInput = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-start"]'));
    if (gradStartInput && pageBgGradStart) gradStartInput.value = pageBgGradStart;
    const gradEndInput = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-end"]'));
    if (gradEndInput && pageBgGradEnd) gradEndInput.value = pageBgGradEnd;
    const gradDirSelect = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('[name="settings-page-bg-grad-dir"]'));
    if (gradDirSelect && pageBgGradDir) gradDirSelect.value = pageBgGradDir;
    if (backdropOn) this.#updatePageBgVisibility(pageBgType || '');

    // A11y toggles
    this.#panel.querySelectorAll('input[data-a11y]').forEach(el => {
      const input = /** @type {HTMLInputElement} */ (el);
      input.checked = a11yThemes.includes(input.dataset.a11y || '');
    });

    // Extension toggles
    this.#panel.querySelectorAll('input[data-ext]').forEach(el => {
      const input = /** @type {HTMLInputElement} */ (el);
      const key = /** @type {string} */ (input.dataset.ext);
      const val = extensions[key];
      input.checked = val ?? EXTENSION_DEFAULTS[key];
    });

    // Sticky navigation toggle
    const stickyToggle = /** @type {HTMLInputElement | null} */ (this.#panel.querySelector('input[data-sticky-toggle]'));
    if (stickyToggle) stickyToggle.checked = this.#isStickyOn();

    // Environment toggles
    const envPrefs = this.#loadEnvPrefs();
    this.#panel.querySelectorAll('input[data-env]').forEach(el => {
      const input = /** @type {HTMLInputElement} */ (el);
      const key = /** @type {string} */ (input.dataset.env);
      input.checked = envPrefs[key] ?? false;
    });
  }

  #updateDensityVisibility(show) {
    const row = /** @type {HTMLElement | null} */ (this.#panel.querySelector('.density-row'));
    if (row) row.hidden = !show;
  }

  #updateBackdropVisibility(show) {
    this.#panel.querySelectorAll('.backdrop-row').forEach(el => {
      /** @type {HTMLElement} */ (el).hidden = !show;
    });
    if (show) {
      const pageBgType = /** @type {HTMLSelectElement | null} */ (this.#panel.querySelector('[name="settings-page-bg"]'))?.value || '';
      this.#updatePageBgVisibility(pageBgType);
    }
  }

  #updatePageBgVisibility(type) {
    const colorRow = /** @type {HTMLElement | null} */ (this.#panel.querySelector('.page-bg-color-row'));
    const gradRow = /** @type {HTMLElement | null} */ (this.#panel.querySelector('.page-bg-grad-row'));
    const gradDirRow = /** @type {HTMLElement | null} */ (this.#panel.querySelector('.page-bg-grad-dir-row'));
    if (colorRow) colorRow.hidden = type !== 'color';
    if (gradRow) gradRow.hidden = type !== 'gradient';
    if (gradDirRow) gradDirRow.hidden = type !== 'gradient';
  }

  // --- VBStore-backed state helpers (read from cache, write through) ---

  #loadA11yThemes() {
    return [...this.#a11yThemes];
  }

  #saveA11yThemes(themes) {
    this.#a11yThemes = [...themes];
    VBStore.set(SETTINGS_NS, 'a11y', this.#a11yThemes).catch(() => { /* ignore */ });
  }

  #applyA11yThemes() {
    const a11yThemes = this.#loadA11yThemes();
    const { brand } = ThemeManager.getState();
    const root = document.documentElement;
    const parts = brand !== 'default' ? [brand, ...a11yThemes] : [...a11yThemes];

    if (parts.length) {
      root.dataset.theme = parts.join(' ');
    } else {
      delete root.dataset.theme;
    }
  }

  #reapplyA11yThemes() {
    this.#applyA11yThemes();
  }

  #loadEnvPrefs() {
    return EnvironmentManager.load();
  }

  #loadExtensions() {
    return { ...this.#extensions };
  }

  #saveExtension(id, enabled) {
    this.#extensions = { ...this.#extensions, [id]: enabled };
    VBStore.set(SETTINGS_NS, 'extensions', this.#extensions).catch(() => { /* ignore */ });
  }

  async #applyExtensions() {
    const prefs = this.#loadExtensions();
    const root = document.documentElement;

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

    window.dispatchEvent(new CustomEvent('vb:extensions-change', { detail: prefs }));
  }

  // --- System section ---

  async #refreshSWStatus() {
    const statusEl = this.#panel.querySelector('[data-sw-status] span');
    if (!statusEl) return;

    if (!('serviceWorker' in navigator)) {
      statusEl.textContent = 'Not supported';
      return;
    }

    try {
      const status = await getSWStatus();
      const count = status.cachedURLs?.length ?? 0;
      statusEl.textContent = `Active (${count} cached files)`;
    } catch {
      statusEl.textContent = 'Not registered';
    }
  }

  #handleClearCache = async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Clearing…';
    try {
      await clearSWCache();
      btn.textContent = 'Cleared!';
      this.#refreshSWStatus();
      setTimeout(() => { btn.textContent = 'Clear Cache'; btn.disabled = false; }, 2000);
    } catch {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = 'Clear Cache'; btn.disabled = false; }, 2000);
    }
  };

  #handleCheckUpdate = async (e) => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = 'Checking…';
    try {
      const { updated } = await checkForUpdate();
      btn.textContent = updated ? 'Update available!' : 'Up to date';
      setTimeout(() => { btn.textContent = 'Check for Updates'; btn.disabled = false; }, 2000);
    } catch {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = 'Check for Updates'; btn.disabled = false; }, 2000);
    }
  };

  // --- Open/close ---

  open() {
    if (this.#isOpen) return;
    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#syncState();
    this.#positionPanel();
  }

  #positionPanel() {
    const trigger = this.getBoundingClientRect();
    const panel = this.#panel;

    // Reset to measure natural size
    panel.style.removeProperty('top');
    panel.style.removeProperty('bottom');
    panel.style.removeProperty('left');
    panel.style.removeProperty('right');

    const panelRect = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Vertical: prefer upward, fall back to downward
    const spaceAbove = trigger.top;
    const spaceBelow = vh - trigger.bottom;
    if (spaceAbove < panelRect.height && spaceBelow > spaceAbove) {
      panel.style.top = 'calc(100% + 8px)';
      panel.style.bottom = 'auto';
    } else {
      panel.style.bottom = 'calc(100% + 8px)';
      panel.style.top = 'auto';
    }

    // Horizontal: prefer right-aligned, fall back to left-aligned
    const spaceRight = vw - trigger.right;
    const spaceLeft = trigger.left;
    const panelWidth = panelRect.width;
    if (trigger.right < panelWidth && spaceLeft < spaceRight) {
      panel.style.left = '0';
      panel.style.right = 'auto';
    } else {
      panel.style.right = '0';
      panel.style.left = 'auto';
    }
  }

  close() {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
  }

  toggle() {
    this.#isOpen ? this.close() : this.open();
  }
}

registerComponent('settings-panel', SettingsPanel);

export { SettingsPanel };
