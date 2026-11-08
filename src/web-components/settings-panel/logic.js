import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * settings-panel: Compact site settings panel
 *
 * A gear-button-triggered, non-modal settings dialog built from <details>
 * accordion sections (Appearance, Accessibility, Layout, Effects,
 * Environment, System), <select> dropdowns and toggle switches. Runs in
 * parallel with theme-picker and shares state through ThemeManager, VBStore
 * and window events.
 *
 * Focus: open() moves focus into the panel; Escape and the close button
 * close it and return focus to the trigger; tabbing out of the panel closes
 * it. There is no focus trap (the dialog is non-modal).
 *
 * @example Footer integration (auto-generates gear trigger)
 * <settings-panel></settings-panel>
 *
 * @attr {boolean} open - Reflected state only — set by open()/close()/toggle() methods, not intended as initial markup
 * @attr {string} data-label-* - English string overrides, see LABELS
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
import { authoredCharShortcuts, charShortcutsEnabled, setCharShortcutsEnabled } from '../../lib/char-shortcuts.js';
// SoundManager is lazy-loaded when sounds are enabled
let _SoundManager = null;

const SETTINGS_NS = 'settings';
const EXTENSION_DEFAULTS = { motionFx: true, sounds: false, charShortcuts: true };
/** Defaults with the page's current single-key shortcut state (an authored
 *  <html data-char-shortcuts="off"> stands until the user chooses). */
const currentExtensionDefaults = () => ({ ...EXTENSION_DEFAULTS, charShortcuts: charShortcutsEnabled() });

/** Was <html data-sticky> present when this module loaded (authored or restored by the head script)? */
const ROOT_STICKY_AT_LOAD = document.documentElement.hasAttribute('data-sticky');
/** The authored (pre-preference) sticky state, resolved on first hydrate; Reset restores it. */
let authoredSticky = /** @type {boolean | null} */ (null);

/** Default English strings; each is overridable with data-label-<key> on the host. */
const LABELS = {
  trigger: 'Site settings',
  dialog: 'Site settings',
  title: 'Settings',
  close: 'Close settings',
  appearance: 'Appearance',
  'color-mode': 'Color mode',
  'mode-auto': 'Auto',
  'mode-light': 'Light',
  'mode-dark': 'Dark',
  theme: 'Theme',
  accessibility: 'Accessibility',
  'high-contrast': 'High Contrast',
  'large-text': 'Large Text',
  dyslexia: 'Dyslexia-Friendly',
  'char-shortcuts': 'Single-Key Shortcuts',
  layout: 'Layout',
  fluid: 'Fluid Scaling',
  density: 'Density',
  'density-compact': 'Compact',
  'density-default': 'Default',
  'density-spacious': 'Spacious',
  backdrop: 'Canvas Backdrop',
  'backdrop-style': 'Style',
  'backdrop-default': 'Default',
  'backdrop-flush': 'Flush',
  'backdrop-elevated': 'Elevated',
  chrome: 'Chrome',
  'chrome-card': 'Card',
  'chrome-stretch': 'Stretch',
  'chrome-integrated': 'Integrated',
  'fixed-header': 'Fixed Header',
  'page-bg': 'Page Background',
  'page-bg-default': 'Theme Default',
  'page-bg-color': 'Solid Color',
  'page-bg-gradient': 'Gradient',
  'bg-color': 'Color',
  'grad-start': 'Start',
  'grad-end': 'End',
  'grad-direction': 'Direction',
  'dir-to-bottom': 'Top → Bottom',
  'dir-to-right': 'Left → Right',
  'dir-135deg': 'Diagonal ↘',
  'dir-45deg': 'Diagonal ↗',
  sticky: 'Sticky Navigation',
  effects: 'Effects',
  motion: 'Motion Effects',
  sounds: 'Sound Effects',
  environment: 'Environment',
  'time-of-day': 'Time-of-Day Shifts',
  seasonal: 'Seasonal Tinting',
  system: 'System',
  'sw-label': 'Service Worker:',
  'sw-checking': 'checking…',
  'sw-unsupported': 'Not supported',
  'sw-active': 'Active ({n} cached files)',
  'sw-unregistered': 'Not registered',
  'clear-cache': 'Clear Cache',
  clearing: 'Clearing…',
  cleared: 'Cache cleared',
  'check-update': 'Check for Updates',
  checking: 'Checking…',
  'update-available': 'Update available',
  'up-to-date': 'Up to date',
  failed: 'Failed',
  reset: 'Reset to Defaults',
  'reset-confirm': 'Reset all settings to defaults?',
  'reset-yes': 'Reset',
  'reset-cancel': 'Cancel',
  'reset-done': 'Settings reset to defaults',
};

const GEAR_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`;

/** @param {unknown} str */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Apply the sticky-navigation preference: the panel owns only <html data-sticky>; sticky-manager owns the banner header. */
async function applySticky(on) {
  const root = document.documentElement;
  if (on) root.dataset.sticky = '';
  else delete root.dataset.sticky;
  try {
    const mod = await import('../../lib/sticky-manager.js');
    if (on) mod.initStickyManager();
    else mod.destroyStickyManager();
  } catch { /* sticky manager unavailable: the root attribute still applies */ }
}

class SettingsPanel extends VBElement {
  /** @type {HTMLElement} */
  #trigger = /** @type {*} */ (null);
  /** @type {HTMLDivElement} */
  #panel = /** @type {*} */ (null);
  #isOpen = false;
  /** open() called before the panel rendered (e.g. before connect) */
  #openQueued = false;
  /** Setup generation: bumped by setup() and teardown() so stale async work bails. */
  #gen = 0;
  #uid = '';
  /** Fields written by the data setter whose VBStore writes are still in flight (hydrate must not clobber them). */
  #dirty = new Set();
  /** @type {ReturnType<typeof setTimeout>[]} */
  #timers = [];

  // VBStore-backed state cached for synchronous render reads
  /** @type {string[]} */
  #a11yThemes = [];
  /** @type {{ motionFx: boolean, sounds: boolean, charShortcuts: boolean }} */
  #extensions = { ...EXTENSION_DEFAULTS, charShortcuts: charShortcutsEnabled() };
  #stickyOn = document.documentElement.hasAttribute('data-sticky');

  setup() {
    const gen = ++this.#gen;
    this.#uid ||= crypto.randomUUID().slice(0, 8);

    // Render synchronously from the cached state so the trigger, panel and
    // every listener exist as soon as the element upgrades; the VBStore
    // values are hydrated afterwards and re-synced into the controls.
    this.#render();
    this.#bindEvents();
    this.#syncState();

    this.listen(window, 'vb:theme-change', this.#handleExternalChange);
    this.listen(window, 'vb:extensions-change', this.#handleExternalChange);
    this.listen(window, 'vb:a11y-themes-change', this.#handleExternalChange);

    if (this.#openQueued) {
      this.#openQueued = false;
      this.open();
    }

    this.#hydrateFromStore().then(() => {
      if (!this.#alive(gen)) return;
      this.#syncState();
    });
    return true;
  }

  teardown() {
    this.#gen++;
    for (const t of this.#timers) clearTimeout(t);
    this.#timers = [];
    // Reset open state so a reconnect starts closed with a matching trigger
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    // Remove the rendered panel so a reconnect's setup() doesn't stack a
    // second one (the trigger is find-or-create and safely reused)
    this.#panel?.remove();
    this.#panel = /** @type {*} */ (null);
  }

  /** @param {number} gen */
  #alive(gen) {
    return gen === this.#gen && this.isConnected;
  }

  /**
   * Resolve a string: data-label-<key> override, else the English default.
   * @param {string} key
   * @param {Record<string, unknown>} [vars] {name} placeholders to fill
   * @returns {string}
   */
  #label(key, vars = {}) {
    let text = this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? key;
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  }

  /** Escaped label for innerHTML templates. @param {string} key */
  #t(key) {
    return escapeHtml(this.#label(key));
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current settings as a plain data object combining all the
   * VBStore-backed state the panel manages.
   *
   * @returns {{ a11yThemes: any[], extensions: Record<string, any>, sticky: boolean }} Settings snapshot.
   */
  get data() {
    return {
      a11yThemes: [...this.#a11yThemes],
      extensions: { ...this.#extensions },
      sticky: this.#stickyOn,
    };
  }

  /**
   * Replace the panel's settings in one assignment. Each non-undefined
   * field is applied to the page immediately (a11y themes on <html
   * data-theme>, extensions, sticky navigation), written through to VBStore,
   * and reflected in the controls. Safe before the panel renders. Emits
   * settings-panel:data-changed { data, source: 'property' } once the
   * writes finish.
   */
  set data(value) {
    if (!value || typeof value !== 'object') return;
    const writes = [];
    const keys = [];
    if (Array.isArray(value.a11yThemes)) {
      this.#a11yThemes = value.a11yThemes.map(String);
      keys.push('a11y');
      writes.push(VBStore.set(SETTINGS_NS, 'a11y', this.#a11yThemes));
      this.#applyA11yThemes();
      window.dispatchEvent(new CustomEvent('vb:a11y-themes-change', { detail: [...this.#a11yThemes] }));
    }
    if (value.extensions && typeof value.extensions === 'object') {
      this.#extensions = { ...currentExtensionDefaults(), ...value.extensions };
      keys.push('extensions');
      writes.push(VBStore.set(SETTINGS_NS, 'extensions', this.#extensions));
      this.#applyExtensions();
    }
    if (value.sticky != null) {
      this.#stickyOn = !!value.sticky;
      keys.push('sticky');
      writes.push(VBStore.set(SETTINGS_NS, 'sticky', this.#stickyOn ? 'on' : 'off'));
      applySticky(this.#stickyOn);
    }
    for (const k of keys) this.#dirty.add(k);
    if (this.#panel) this.#syncState();
    Promise.allSettled(writes).then(() => {
      for (const k of keys) this.#dirty.delete(k);
      if (this.#panel) this.#syncState();
      this.dispatchEvent(new CustomEvent('settings-panel:data-changed', {
        detail: { data: this.data, source: 'property' },
        bubbles: true,
      }));
    });
  }

  /** Load the VBStore-backed state into the instance caches. */
  async #hydrateFromStore() {
    const [a11y, ext, sticky] = await Promise.all([
      VBStore.get(SETTINGS_NS, 'a11y'),
      VBStore.get(SETTINGS_NS, 'extensions'),
      VBStore.get(SETTINGS_NS, 'sticky'),
    ]);
    if (authoredSticky === null) authoredSticky = ROOT_STICKY_AT_LOAD && sticky !== 'on';
    if (!this.#dirty.has('a11y')) this.#a11yThemes = Array.isArray(a11y) ? a11y : [];
    if (!this.#dirty.has('extensions')) {
      // No stored charShortcuts choice: the page's state (authored or default) stands.
      this.#extensions = { ...currentExtensionDefaults(), ...(ext ?? {}) };
    }
    // The root attribute is the truth on the page (the head script restores
    // a stored "on" before paint; an authored <html data-sticky> also counts).
    if (!this.#dirty.has('sticky')) this.#stickyOn = document.documentElement.hasAttribute('data-sticky');
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

  /** @param {string} selector @returns {any} */
  #q(selector) {
    return this.#panel?.querySelector(selector) ?? null;
  }

  // --- Render ---

  #render() {
    // Find or create trigger
    this.#trigger = /** @type {HTMLElement} */ (this.querySelector(':scope > [data-trigger]') || this.querySelector(':scope > button'));
    if (!this.#trigger) {
      this.#trigger = document.createElement('button');
      this.#trigger.setAttribute('type', 'button');
      this.#trigger.setAttribute('data-trigger', '');
      this.#trigger.setAttribute('data-minted', '');
      this.#trigger.className = 'settings-trigger';
      this.#trigger.innerHTML = GEAR_SVG;
      this.prepend(this.#trigger);
    }
    if (this.#trigger.hasAttribute('data-minted')) {
      this.#trigger.setAttribute('aria-label', this.#label('trigger'));
    }

    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');

    // Create panel
    this.#panel = document.createElement('div');
    this.#panel.className = 'settings-panel';
    this.#panel.setAttribute('role', 'dialog');
    this.#panel.setAttribute('aria-label', this.#label('dialog'));
    this.#panel.tabIndex = -1;

    const panelId = `settings-panel-${this.#uid}`;
    this.#panel.id = panelId;
    this.#trigger.setAttribute('aria-controls', panelId);

    this.#panel.innerHTML = this.#renderPanel();
    this.appendChild(this.#panel);
  }

  #renderPanel() {
    const { mode, brand, fluid, backdrop, backdropChrome, pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir } = ThemeManager.getState();
    const a11yThemes = [...this.#a11yThemes];
    const extensions = { ...this.#extensions };
    const env = EnvironmentManager.load();
    const fluidOn = this.#isFluidOn(fluid);
    const density = this.#getDensity(fluid);
    const backdropOn = this.#isBackdropOn(backdrop);
    const backdropPreset = this.#getBackdropPreset(backdrop);
    const u = this.#uid;
    const t = (k) => this.#t(k);

    /** Segmented radio group. @param {string} field @param {string} legend @param {string[]} values @param {string} current @param {string} prefix */
    const segmented = (field, legend, values, current, prefix, icons = {}) => `
      <fieldset data-segmented>
        <legend class="visually-hidden">${legend}</legend>
        ${values.map(v => `
          <label>
            <input type="radio" name="settings-${field}-${u}" data-field="${field}" value="${v}" ${current === v ? 'checked' : ''} />
            ${icons[v] ? `<icon-wc name="${icons[v]}" size="xs"></icon-wc> ` : ''}${t(`${prefix}-${v}`)}
          </label>
        `).join('')}
      </fieldset>`;

    /** Toggle switch row. @param {string} key @param {string} attrs @param {boolean} on */
    const toggle = (key, attrs, on) => `
      <label class="toggle-row">
        <span>${t(key)}</span>
        <input type="checkbox" name="settings-${key}-${u}" data-switch="s" ${attrs} ${on ? 'checked' : ''} />
      </label>`;

    const dirs = [['to bottom', 'dir-to-bottom'], ['to right', 'dir-to-right'], ['135deg', 'dir-135deg'], ['45deg', 'dir-45deg']];

    return `
      <header class="settings-header">
        <strong>${t('title')}</strong>
        <button type="button" class="settings-close" aria-label="${t('close')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      <div class="settings-body">
        <details name="settings-${u}" open>
          <summary>${t('appearance')}</summary>
          <div class="settings-section">
            <span class="settings-label" aria-hidden="true">${t('color-mode')}</span>
            ${segmented('mode', t('color-mode'), ['auto', 'light', 'dark'], mode, 'mode', { auto: 'monitor', light: 'sun', dark: 'moon' })}

            <label class="settings-label" for="settings-theme-${u}">${t('theme')}</label>
            <select id="settings-theme-${u}" name="settings-theme-${u}" data-field="theme">
              ${THEME_GROUPS.map(group => `
                <optgroup label="${escapeHtml(group.label)}">
                  ${group.themes.map(th => `
                    <option value="${escapeHtml(th.id)}" ${brand === th.id ? 'selected' : ''}>${escapeHtml(th.name)}</option>
                  `).join('')}
                </optgroup>
              `).join('')}
            </select>
          </div>
        </details>

        <details name="settings-${u}">
          <summary>${t('accessibility')}</summary>
          <div class="settings-section">
            ${toggle('high-contrast', 'data-a11y="a11y-high-contrast"', a11yThemes.includes('a11y-high-contrast'))}
            ${toggle('large-text', 'data-a11y="a11y-large-text"', a11yThemes.includes('a11y-large-text'))}
            ${toggle('dyslexia', 'data-a11y="a11y-dyslexia"', a11yThemes.includes('a11y-dyslexia'))}
            ${toggle('char-shortcuts', 'data-ext="charShortcuts"', extensions.charShortcuts !== false)}
          </div>
        </details>

        <details name="settings-${u}">
          <summary>${t('layout')}</summary>
          <div class="settings-section">
            ${toggle('fluid', 'data-fluid-toggle', fluidOn)}
            <div class="density-row" ${fluidOn ? '' : 'hidden'}>
              <span class="settings-label" aria-hidden="true">${t('density')}</span>
              ${segmented('density', t('density'), ['compact', 'default', 'spacious'], density, 'density')}
            </div>

            ${toggle('backdrop', 'data-backdrop-toggle', backdropOn)}
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              <span class="settings-label" aria-hidden="true">${t('backdrop-style')}</span>
              ${segmented('backdrop', t('backdrop-style'), ['default', 'flush', 'elevated'], backdropPreset, 'backdrop')}
            </div>
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              <span class="settings-label" aria-hidden="true">${t('chrome')}</span>
              ${segmented('chrome', t('chrome'), ['card', 'stretch', 'integrated'], this.#getChromeMode(backdropChrome), 'chrome')}
            </div>
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              ${toggle('fixed-header', 'data-backdrop-fixed', this.#isFixedOn(backdropChrome))}
            </div>
            <div class="backdrop-row" ${backdropOn ? '' : 'hidden'}>
              <label class="settings-label" for="settings-page-bg-${u}">${t('page-bg')}</label>
              <select id="settings-page-bg-${u}" name="settings-page-bg-${u}" data-field="page-bg">
                <option value="" ${pageBgType === '' ? 'selected' : ''}>${t('page-bg-default')}</option>
                <option value="color" ${pageBgType === 'color' ? 'selected' : ''}>${t('page-bg-color')}</option>
                <option value="gradient" ${pageBgType === 'gradient' ? 'selected' : ''}>${t('page-bg-gradient')}</option>
              </select>
            </div>
            <div class="page-bg-color-row backdrop-row" ${pageBgType === 'color' && backdropOn ? '' : 'hidden'}>
              <label class="settings-label" for="settings-bg-color-${u}">${t('bg-color')}</label>
              <input type="color" id="settings-bg-color-${u}" name="settings-bg-color-${u}" data-field="page-bg-color" value="${escapeHtml(pageBgColor || '#1a1a2e')}" />
            </div>
            <div class="page-bg-grad-row backdrop-row" ${pageBgType === 'gradient' && backdropOn ? '' : 'hidden'}>
              <label class="settings-label" for="settings-grad-start-${u}">${t('grad-start')}</label>
              <input type="color" id="settings-grad-start-${u}" name="settings-grad-start-${u}" data-field="grad-start" value="${escapeHtml(pageBgGradStart || '#1a1a2e')}" />
              <label class="settings-label" for="settings-grad-end-${u}">${t('grad-end')}</label>
              <input type="color" id="settings-grad-end-${u}" name="settings-grad-end-${u}" data-field="grad-end" value="${escapeHtml(pageBgGradEnd || '#16213e')}" />
            </div>
            <div class="page-bg-grad-dir-row backdrop-row" ${pageBgType === 'gradient' && backdropOn ? '' : 'hidden'}>
              <label class="settings-label" for="settings-grad-dir-${u}">${t('grad-direction')}</label>
              <select id="settings-grad-dir-${u}" name="settings-grad-dir-${u}" data-field="grad-dir">
                ${dirs.map(([v, k]) => `<option value="${v}" ${(pageBgGradDir || 'to bottom') === v ? 'selected' : ''}>${t(k)}</option>`).join('')}
              </select>
            </div>

            ${toggle('sticky', 'data-sticky-toggle', this.#stickyOn)}
          </div>
        </details>

        <details name="settings-${u}">
          <summary>${t('effects')}</summary>
          <div class="settings-section">
            ${toggle('motion', 'data-ext="motionFx"', !!extensions.motionFx)}
            ${toggle('sounds', 'data-ext="sounds"', !!extensions.sounds)}
          </div>
        </details>

        <details name="settings-${u}">
          <summary>${t('environment')}</summary>
          <div class="settings-section">
            ${toggle('time-of-day', 'data-env="timeOfDay"', !!env.timeOfDay)}
            ${toggle('seasonal', 'data-env="seasonal"', !!env.seasonal)}
          </div>
        </details>

        <details name="settings-${u}">
          <summary>${t('system')}</summary>
          <div class="settings-section system-info">
            <p class="system-version">Vanilla Breeze <code>v${escapeHtml(getVBVersion())}</code></p>
            <p class="system-sw-status" data-sw-status role="status">${t('sw-label')} <span>${t('sw-checking')}</span></p>
            <footer class="system-actions">
              <button type="button" data-action="clear-cache">${t('clear-cache')}</button>
              <button type="button" data-action="check-update">${t('check-update')}</button>
            </footer>
          </div>
        </details>
      </div>

      <footer class="settings-footer">
        <button type="button" class="settings-reset">${t('reset')}</button>
        <p class="settings-reset-confirm" role="group" aria-labelledby="settings-reset-q-${u}" hidden>
          <span id="settings-reset-q-${u}">${t('reset-confirm')}</span>
          <button type="button" data-action="reset-confirm">${t('reset-yes')}</button>
          <button type="button" data-action="reset-cancel">${t('reset-cancel')}</button>
        </p>
      </footer>
      <p class="visually-hidden" data-live role="status"></p>
    `;
  }

  // --- Event binding ---

  #bindEvents() {
    const panel = this.#panel;
    this.listen(this.#trigger, 'click', this.#handleTriggerClick);
    this.listen(document, 'click', this.#handleOutsideClick);
    this.listen(document, 'keydown', this.#handleEscape);
    this.listen(this, 'focusout', this.#handleFocusOut);

    // Panel-internal listeners die with the panel element (teardown removes it)
    panel.querySelector('.settings-close')?.addEventListener('click', () => this.close({ returnFocus: true }));

    panel.querySelectorAll('input[data-field="mode"]').forEach(input => input.addEventListener('change', this.#handleModeChange));
    this.#q('[data-field="theme"]')?.addEventListener('change', this.#handleThemeChange);
    this.#q('input[data-fluid-toggle]')?.addEventListener('change', this.#handleFluidToggle);
    panel.querySelectorAll('input[data-field="density"]').forEach(input => input.addEventListener('change', this.#handleDensityChange));
    this.#q('input[data-backdrop-toggle]')?.addEventListener('change', this.#handleBackdropToggle);
    panel.querySelectorAll('input[data-field="backdrop"]').forEach(input => input.addEventListener('change', this.#handleBackdropPreset));
    panel.querySelectorAll('input[data-field="chrome"]').forEach(input => input.addEventListener('change', this.#handleBackdropChrome));
    this.#q('input[data-backdrop-fixed]')?.addEventListener('change', this.#handleBackdropFixed);
    this.#q('input[data-sticky-toggle]')?.addEventListener('change', this.#handleStickyToggle);
    this.#q('[data-field="page-bg"]')?.addEventListener('change', this.#handlePageBgType);
    this.#q('[data-field="page-bg-color"]')?.addEventListener('input', this.#handlePageBgChange);
    this.#q('[data-field="grad-start"]')?.addEventListener('input', this.#handlePageBgChange);
    this.#q('[data-field="grad-end"]')?.addEventListener('input', this.#handlePageBgChange);
    this.#q('[data-field="grad-dir"]')?.addEventListener('change', this.#handlePageBgChange);
    panel.querySelectorAll('input[data-a11y]').forEach(input => input.addEventListener('change', this.#handleA11yChange));
    panel.querySelectorAll('input[data-ext]').forEach(input => input.addEventListener('change', this.#handleExtensionChange));
    panel.querySelectorAll('input[data-env]').forEach(input => input.addEventListener('change', this.#handleEnvironmentChange));

    // Reset (in-panel confirm step)
    this.#q('.settings-reset')?.addEventListener('click', this.#showResetConfirm);
    this.#q('[data-action="reset-confirm"]')?.addEventListener('click', this.#handleReset);
    this.#q('[data-action="reset-cancel"]')?.addEventListener('click', () => this.#hideResetConfirm(true));

    // System section
    this.#q('[data-action="clear-cache"]')?.addEventListener('click', this.#handleClearCache);
    this.#q('[data-action="check-update"]')?.addEventListener('click', this.#handleCheckUpdate);
    this.#refreshSWStatus(this.#gen);
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
      this.close({ returnFocus: true });
    }
  };

  /** Tabbing (or programmatic focus) out of the open panel closes it; a window blur does not. */
  #handleFocusOut = (e) => {
    if (!this.#isOpen) return;
    const next = /** @type {Node | null} */ (e.relatedTarget);
    if (next && !this.contains(next)) this.close();
  };

  #handleModeChange = (e) => {
    ThemeManager.setMode(e.target.value);
  };

  #handleThemeChange = async (e) => {
    const select = e.target;
    select.disabled = true;

    try {
      await ThemeManager.setBrand(select.value);
      this.#applyA11yThemes();
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

  #handleStickyToggle = (e) => {
    const on = e.target.checked;
    this.#stickyOn = on;
    VBStore.set(SETTINGS_NS, 'sticky', on ? 'on' : 'off').catch(() => { /* ignore */ });
    applySticky(on);
  };

  #pageBgValue() {
    const type = this.#q('[data-field="page-bg"]')?.value || '';
    if (type === 'color') {
      return { type, color: this.#q('[data-field="page-bg-color"]')?.value || '#1a1a2e' };
    }
    if (type === 'gradient') {
      return {
        type,
        gradStart: this.#q('[data-field="grad-start"]')?.value || '#1a1a2e',
        gradEnd: this.#q('[data-field="grad-end"]')?.value || '#16213e',
        gradDir: this.#q('[data-field="grad-dir"]')?.value || 'to bottom',
      };
    }
    return null;
  }

  #handlePageBgType = (e) => {
    this.#updatePageBgVisibility(e.target.value);
    ThemeManager.setPageBg(this.#pageBgValue() ?? {});
  };

  #handlePageBgChange = () => {
    const value = this.#pageBgValue();
    if (value) ThemeManager.setPageBg(value);
  };

  #handleA11yChange = (e) => {
    const themeId = e.target.dataset.a11y;
    const current = [...this.#a11yThemes];

    if (e.target.checked && !current.includes(themeId)) {
      current.push(themeId);
    } else if (!e.target.checked) {
      const idx = current.indexOf(themeId);
      if (idx !== -1) current.splice(idx, 1);
    }

    this.#saveA11yThemes(current);
    this.#applyA11yThemes();
    window.dispatchEvent(new CustomEvent('vb:a11y-themes-change', { detail: [...current] }));
  };

  #handleExtensionChange = (e) => {
    const extId = e.target.dataset.ext;
    this.#extensions = { ...this.#extensions, [extId]: e.target.checked };
    VBStore.set(SETTINGS_NS, 'extensions', this.#extensions).catch(() => { /* ignore */ });
    this.#applyExtensions();
  };

  #handleEnvironmentChange = (e) => {
    EnvironmentManager.setSource(e.target.dataset.env, e.target.checked);
  };

  #showResetConfirm = () => {
    const confirmRow = this.#q('.settings-reset-confirm');
    const resetBtn = this.#q('.settings-reset');
    if (!confirmRow || !resetBtn) return;
    confirmRow.hidden = false;
    resetBtn.hidden = true;
    this.#q('[data-action="reset-cancel"]')?.focus();
  };

  /** @param {boolean} [refocus] move focus back to the Reset button */
  #hideResetConfirm(refocus = false) {
    const confirmRow = this.#q('.settings-reset-confirm');
    const resetBtn = this.#q('.settings-reset');
    if (confirmRow) confirmRow.hidden = true;
    if (resetBtn) {
      resetBtn.hidden = false;
      if (refocus) resetBtn.focus();
    }
  }

  #handleReset = () => {
    // ThemeManager.reset() fires vb:theme-change, whose re-hydration reads
    // the store before the removals below: keep it off these keys until the
    // reset has settled, or the controls show the pre-reset values.
    const keys = ['a11y', 'extensions', 'sticky'];
    for (const k of keys) this.#dirty.add(k);
    setTimeout(() => { for (const k of keys) this.#dirty.delete(k); }, 0);

    ThemeManager.reset();

    // Clear a11y themes
    this.#saveA11yThemes([]);
    this.#applyA11yThemes();
    window.dispatchEvent(new CustomEvent('vb:a11y-themes-change', { detail: [] }));

    // Reset extensions (single-key shortcuts return to the page's authored state)
    this.#extensions = { ...EXTENSION_DEFAULTS, charShortcuts: authoredCharShortcuts() };
    VBStore.remove(SETTINGS_NS, 'extensions').catch(() => { /* ignore */ });
    this.#applyExtensions();

    // Reset sticky navigation to the authored state (sticky-manager restores
    // any header attribute it added; authored header[data-sticky] is kept)
    this.#stickyOn = !!authoredSticky;
    VBStore.remove(SETTINGS_NS, 'sticky').catch(() => { /* ignore */ });
    applySticky(this.#stickyOn);

    // Reset environment
    EnvironmentManager.setSource('timeOfDay', false);
    EnvironmentManager.setSource('seasonal', false);

    this.#hideResetConfirm(true);
    this.#syncState();
    this.#announce(this.#label('reset-done'));
  };

  #handleExternalChange = (e) => {
    // Apply the other component's new values before re-syncing, so the
    // controls show them and the next toggle here doesn't write stale state.
    if (e.type === 'vb:a11y-themes-change' && Array.isArray(e.detail)) {
      this.#a11yThemes = e.detail.map(String);
    } else if (e.type === 'vb:extensions-change' && e.detail && typeof e.detail === 'object') {
      this.#extensions = { ...currentExtensionDefaults(), ...e.detail };
    } else if (e.type === 'vb:theme-change') {
      const gen = this.#gen;
      this.#hydrateFromStore().then(() => { if (this.#alive(gen)) this.#syncState(); });
    }
    this.#syncState();
  };

  // --- State sync ---

  #syncState() {
    if (!this.#panel) return;
    const { mode, brand, fluid, backdrop, backdropChrome, pageBgType, pageBgColor, pageBgGradStart, pageBgGradEnd, pageBgGradDir } = ThemeManager.getState();
    const a11yThemes = this.#a11yThemes;
    const extensions = this.#extensions;
    const fluidOn = this.#isFluidOn(fluid);
    const density = this.#getDensity(fluid);
    const backdropOn = this.#isBackdropOn(backdrop);
    const backdropPreset = this.#getBackdropPreset(backdrop);
    const panel = this.#panel;

    const check = (selector, on) => { const el = this.#q(selector); if (el) el.checked = on; };
    const setValue = (selector, value) => { const el = this.#q(selector); if (el && value) el.value = value; };

    check(`input[data-field="mode"][value="${mode}"]`, true);
    const themeSelect = this.#q('[data-field="theme"]');
    if (themeSelect) themeSelect.value = brand || 'default';

    check('input[data-fluid-toggle]', fluidOn);
    check(`input[data-field="density"][value="${density}"]`, true);
    this.#updateDensityVisibility(fluidOn);

    check('input[data-backdrop-toggle]', backdropOn);
    check(`input[data-field="backdrop"][value="${backdropPreset}"]`, true);
    check(`input[data-field="chrome"][value="${this.#getChromeMode(backdropChrome)}"]`, true);
    check('input[data-backdrop-fixed]', this.#isFixedOn(backdropChrome));
    this.#updateBackdropVisibility(backdropOn);

    const pageBgSelect = this.#q('[data-field="page-bg"]');
    if (pageBgSelect) pageBgSelect.value = pageBgType || '';
    setValue('[data-field="page-bg-color"]', pageBgColor);
    setValue('[data-field="grad-start"]', pageBgGradStart);
    setValue('[data-field="grad-end"]', pageBgGradEnd);
    setValue('[data-field="grad-dir"]', pageBgGradDir);
    if (backdropOn) this.#updatePageBgVisibility(pageBgType || '');

    panel.querySelectorAll('input[data-a11y]').forEach(el => {
      const input = /** @type {HTMLInputElement} */ (el);
      input.checked = a11yThemes.includes(input.dataset.a11y || '');
    });

    panel.querySelectorAll('input[data-ext]').forEach(el => {
      const input = /** @type {HTMLInputElement} */ (el);
      const key = /** @type {string} */ (input.dataset.ext);
      input.checked = extensions[key] ?? EXTENSION_DEFAULTS[key];
    });

    check('input[data-sticky-toggle]', this.#stickyOn);

    const envPrefs = EnvironmentManager.load();
    panel.querySelectorAll('input[data-env]').forEach(el => {
      const input = /** @type {HTMLInputElement} */ (el);
      input.checked = envPrefs[/** @type {string} */ (input.dataset.env)] ?? false;
    });
  }

  #updateDensityVisibility(show) {
    const row = this.#q('.density-row');
    if (row) row.hidden = !show;
  }

  #updateBackdropVisibility(show) {
    this.#panel?.querySelectorAll('.backdrop-row').forEach(el => {
      /** @type {HTMLElement} */ (el).hidden = !show;
    });
    if (show) this.#updatePageBgVisibility(this.#q('[data-field="page-bg"]')?.value || '');
  }

  #updatePageBgVisibility(type) {
    const colorRow = this.#q('.page-bg-color-row');
    const gradRow = this.#q('.page-bg-grad-row');
    const gradDirRow = this.#q('.page-bg-grad-dir-row');
    if (colorRow) colorRow.hidden = type !== 'color';
    if (gradRow) gradRow.hidden = type !== 'gradient';
    if (gradDirRow) gradDirRow.hidden = type !== 'gradient';
  }

  // --- Page application (document-level; safe without a rendered panel) ---

  #saveA11yThemes(themes) {
    this.#a11yThemes = [...themes];
    VBStore.set(SETTINGS_NS, 'a11y', this.#a11yThemes).catch(() => { /* ignore */ });
  }

  #applyA11yThemes() {
    const a11yThemes = [...this.#a11yThemes];
    const { brand } = ThemeManager.getState();
    const root = document.documentElement;
    const parts = brand !== 'default' ? [brand, ...a11yThemes] : [...a11yThemes];

    if (parts.length) {
      root.dataset.theme = parts.join(' ');
    } else {
      delete root.dataset.theme;
    }
  }

  async #applyExtensions() {
    const prefs = { ...this.#extensions };
    const root = document.documentElement;

    if (prefs.motionFx) {
      delete root.dataset.motionReduced;
    } else {
      root.dataset.motionReduced = '';
    }

    // WCAG 2.1.4: single-character shortcuts on/off (hotkey-bind reads the root attribute).
    setCharShortcutsEnabled(prefs.charShortcuts !== false);

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

  // --- Live announcements ---

  /** @param {string} message */
  #announce(message) {
    const live = this.#q('[data-live]');
    if (!live) return;
    live.textContent = '';
    // Next frame so a repeated identical message is still announced
    requestAnimationFrame(() => { live.textContent = message; });
  }

  // --- System section ---

  /** @param {number} gen */
  async #refreshSWStatus(gen) {
    const statusEl = this.#q('[data-sw-status] span');
    if (!statusEl) return;

    if (!('serviceWorker' in navigator)) {
      statusEl.textContent = this.#label('sw-unsupported');
      return;
    }

    try {
      const status = await getSWStatus();
      if (!this.#alive(gen)) return;
      const count = status.cachedURLs?.length ?? 0;
      statusEl.textContent = this.#label('sw-active', { n: count });
    } catch {
      if (this.#alive(gen)) statusEl.textContent = this.#label('sw-unregistered');
    }
  }

  /**
   * Run a System action with busy text, announce the result, then restore.
   * @param {HTMLButtonElement} btn
   * @param {string} idleKey label key for the resting text
   * @param {string} busyKey label key shown while running
   * @param {() => Promise<string>} run resolves to the result message
   */
  async #runAction(btn, idleKey, busyKey, run) {
    const gen = this.#gen;
    btn.disabled = true;
    btn.textContent = this.#label(busyKey);
    let result;
    try {
      result = await run();
    } catch {
      result = this.#label('failed');
    }
    if (!this.#alive(gen)) return;
    btn.textContent = result;
    this.#announce(result);
    this.#timers.push(setTimeout(() => {
      btn.textContent = this.#label(idleKey);
      btn.disabled = false;
    }, 2000));
  }

  #handleClearCache = (e) => {
    const gen = this.#gen;
    this.#runAction(e.currentTarget, 'clear-cache', 'clearing', async () => {
      await clearSWCache();
      this.#refreshSWStatus(gen);
      return this.#label('cleared');
    });
  };

  #handleCheckUpdate = (e) => {
    this.#runAction(e.currentTarget, 'check-update', 'checking', async () => {
      const { updated } = await checkForUpdate();
      return this.#label(updated ? 'update-available' : 'up-to-date');
    });
  };

  // --- Open/close ---

  /**
   * Open the panel and move focus into it. Before the panel has rendered
   * (element not yet connected) the call is queued.
   */
  open() {
    if (!this.#panel) {
      this.#openQueued = true;
      return;
    }
    if (this.#isOpen) return;
    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.#syncState();
    this.#positionPanel();
    this.#panel.focus({ preventScroll: true });
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

  /**
   * Close the panel.
   * @param {{ returnFocus?: boolean }} [options] move focus back to the trigger
   */
  close({ returnFocus = false } = {}) {
    this.#openQueued = false;
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.#hideResetConfirm();
    if (returnFocus) this.#trigger?.focus();
  }

  /** Toggle the panel open/closed. */
  toggle() {
    this.#isOpen ? this.close() : this.open();
  }
}

registerComponent('settings-panel', SettingsPanel);

export { SettingsPanel };
