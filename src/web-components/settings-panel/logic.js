/**
 * settings-panel: Compact settings panel
 *
 * A gear-button-triggered settings panel using <details> accordion sections,
 * <select> dropdowns, and toggle switches. Runs in parallel with theme-picker
 * and shares state through ThemeManager, localStorage, and custom events.
 *
 * @example Footer integration (auto-generates gear trigger)
 * <settings-panel></settings-panel>
 *
 * @example With custom trigger
 * <settings-panel>
 *   <button data-trigger>Settings</button>
 * </settings-panel>
 */

import { ThemeManager } from '../../lib/theme-manager.js';
import { getVBVersion, getSWStatus, clearSWCache, checkForUpdate } from '../../lib/sw-register.js';
// SoundManager is lazy-loaded when sounds are enabled
let _SoundManager = null;

const EXTENSIONS_KEY = 'vb-extensions';
const EXTENSION_DEFAULTS = { motionFx: true, sounds: false };
const A11Y_THEMES_KEY = 'vb-a11y-themes';

// Color accent themes — hue variants of the default base theme
const COLOR_ACCENTS = [
  { id: 'ocean', name: 'Ocean', color: '#0891b2' },
  { id: 'forest', name: 'Forest', color: '#059669' },
  { id: 'sunset', name: 'Sunset', color: '#ea580c' },
  { id: 'rose', name: 'Rose', color: '#e11d48' },
  { id: 'lavender', name: 'Lavender', color: '#a855f7' },
  { id: 'coral', name: 'Coral', color: '#f97316' },
  { id: 'slate', name: 'Slate', color: '#64748b' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
  { id: 'indigo', name: 'Indigo', color: '#6366f1' }
];

const ACCENT_IDS = new Set(COLOR_ACCENTS.map(a => a.id));

class SettingsPanel extends HTMLElement {
  #trigger;
  #panel;
  #isOpen = false;

  connectedCallback() {
    this.#render();
    this.#bindEvents();
    this.#syncState();

    window.addEventListener('theme-change', this.#handleExternalChange);
    window.addEventListener('extensions-change', this.#handleExternalChange);
    window.addEventListener('a11y-themes-change', this.#handleExternalChange);
  }

  disconnectedCallback() {
    window.removeEventListener('theme-change', this.#handleExternalChange);
    window.removeEventListener('extensions-change', this.#handleExternalChange);
    window.removeEventListener('a11y-themes-change', this.#handleExternalChange);
    document.removeEventListener('click', this.#handleOutsideClick);
    document.removeEventListener('keydown', this.#handleEscape);
  }

  // --- Mapping helpers ---

  /** Map a brand value to the select dropdown value */
  #getSelectValue(brand) {
    if (!brand || brand === 'default') return 'default';
    if (ACCENT_IDS.has(brand)) return 'default';
    return brand;
  }

  /** Map a brand value to the accent id (or empty) */
  #getAccent(brand) {
    if (ACCENT_IDS.has(brand)) return brand;
    return '';
  }

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

  // --- Render ---

  #render() {
    // Find or create trigger
    this.#trigger = this.querySelector(':scope > [data-trigger]') || this.querySelector(':scope > button');
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
    const { mode, brand, fluid } = ThemeManager.getState();
    const selectValue = this.#getSelectValue(brand);
    const accent = this.#getAccent(brand);
    const a11yThemes = this.#loadA11yThemes();
    const extensions = this.#loadExtensions();
    const showAccents = selectValue === 'default';
    const fluidOn = this.#isFluidOn(fluid);
    const density = this.#getDensity(fluid);

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
            <div class="segmented-control" role="radiogroup" aria-label="Color mode">
              ${['auto', 'light', 'dark'].map(m => `
                <label class="segment">
                  <input type="radio" name="settings-mode" value="${m}" ${mode === m ? 'checked' : ''} />
                  <span>${m[0].toUpperCase() + m.slice(1)}</span>
                </label>
              `).join('')}
            </div>

            <label class="settings-label" for="settings-theme">Theme</label>
            <select id="settings-theme" name="settings-theme">
              <optgroup label="Base">
                <option value="default" ${selectValue === 'default' ? 'selected' : ''}>Default</option>
              </optgroup>
              <optgroup label="Personality">
                <option value="modern" ${selectValue === 'modern' ? 'selected' : ''}>Modern</option>
                <option value="minimal" ${selectValue === 'minimal' ? 'selected' : ''}>Minimal</option>
                <option value="classic" ${selectValue === 'classic' ? 'selected' : ''}>Classic</option>
              </optgroup>
              <optgroup label="Extreme">
                <option value="swiss" ${selectValue === 'swiss' ? 'selected' : ''}>Swiss</option>
                <option value="brutalist" ${selectValue === 'brutalist' ? 'selected' : ''}>Brutalist</option>
                <option value="cyber" ${selectValue === 'cyber' ? 'selected' : ''}>Cyber</option>
                <option value="terminal" ${selectValue === 'terminal' ? 'selected' : ''}>Terminal</option>
                <option value="organic" ${selectValue === 'organic' ? 'selected' : ''}>Organic</option>
                <option value="editorial" ${selectValue === 'editorial' ? 'selected' : ''}>Editorial</option>
                <option value="kawaii" ${selectValue === 'kawaii' ? 'selected' : ''}>Kawaii</option>
                <option value="8bit" ${selectValue === '8bit' ? 'selected' : ''}>8-Bit</option>
                <option value="nes" ${selectValue === 'nes' ? 'selected' : ''}>NES</option>
                <option value="win9x" ${selectValue === 'win9x' ? 'selected' : ''}>Win9x</option>
                <option value="rough" ${selectValue === 'rough' ? 'selected' : ''}>Rough</option>
                <option value="nord" ${selectValue === 'nord' ? 'selected' : ''}>Nord</option>
                <option value="solarized" ${selectValue === 'solarized' ? 'selected' : ''}>Solarized</option>
                <option value="dracula" ${selectValue === 'dracula' ? 'selected' : ''}>Dracula</option>
                <option value="catppuccin-mocha" ${selectValue === 'catppuccin-mocha' ? 'selected' : ''}>Catppuccin Mocha</option>
                <option value="glassmorphism" ${selectValue === 'glassmorphism' ? 'selected' : ''}>Glassmorphism</option>
                <option value="art-deco" ${selectValue === 'art-deco' ? 'selected' : ''}>Art Deco</option>
                <option value="genai" ${selectValue === 'genai' ? 'selected' : ''}>GenAI</option>
                <option value="gruvbox" ${selectValue === 'gruvbox' ? 'selected' : ''}>Gruvbox</option>
                <option value="tokyo-night" ${selectValue === 'tokyo-night' ? 'selected' : ''}>Tokyo Night</option>
                <option value="rose-pine" ${selectValue === 'rose-pine' ? 'selected' : ''}>Rosé Pine</option>
                <option value="vaporwave" ${selectValue === 'vaporwave' ? 'selected' : ''}>Vaporwave</option>
                <option value="neumorphism" ${selectValue === 'neumorphism' ? 'selected' : ''}>Neumorphism</option>
                <option value="catppuccin-latte" ${selectValue === 'catppuccin-latte' ? 'selected' : ''}>Catppuccin Latte</option>
                <option value="catppuccin-frappe" ${selectValue === 'catppuccin-frappe' ? 'selected' : ''}>Catppuccin Frappé</option>
                <option value="catppuccin-macchiato" ${selectValue === 'catppuccin-macchiato' ? 'selected' : ''}>Catppuccin Macchiato</option>
                <option value="bauhaus" ${selectValue === 'bauhaus' ? 'selected' : ''}>Bauhaus</option>
                <option value="memphis" ${selectValue === 'memphis' ? 'selected' : ''}>Memphis</option>
                <option value="cottagecore" ${selectValue === 'cottagecore' ? 'selected' : ''}>Cottagecore</option>
                <option value="claymorphism" ${selectValue === 'claymorphism' ? 'selected' : ''}>Claymorphism</option>
                <option value="clinical" ${selectValue === 'clinical' ? 'selected' : ''}>Clinical</option>
                <option value="financial" ${selectValue === 'financial' ? 'selected' : ''}>Financial</option>
                <option value="government" ${selectValue === 'government' ? 'selected' : ''}>Government</option>
                <option value="startup" ${selectValue === 'startup' ? 'selected' : ''}>Startup</option>
                <option value="dawn" ${selectValue === 'dawn' ? 'selected' : ''}>Dawn</option>
                <option value="dusk" ${selectValue === 'dusk' ? 'selected' : ''}>Dusk</option>
                <option value="midnight" ${selectValue === 'midnight' ? 'selected' : ''}>Midnight</option>
                <option value="high-noon" ${selectValue === 'high-noon' ? 'selected' : ''}>High Noon</option>
              </optgroup>
            </select>

            <div class="accent-row" ${showAccents ? '' : 'hidden'}>
              <span class="settings-label">Accent Color</span>
              <div class="accent-swatches" role="radiogroup" aria-label="Accent color">
                <label class="accent-swatch accent-swatch--none" title="None (default blue)">
                  <input type="radio" name="settings-accent" value="" ${accent === '' ? 'checked' : ''} />
                  <span class="accent-dot" style="background: var(--color-interactive, #3b82f6)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                </label>
                ${COLOR_ACCENTS.map(a => `
                  <label class="accent-swatch" title="${a.name}">
                    <input type="radio" name="settings-accent" value="${a.id}" ${accent === a.id ? 'checked' : ''} />
                    <span class="accent-dot" style="background: ${a.color}"></span>
                  </label>
                `).join('')}
              </div>
            </div>
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
              <div class="segmented-control" role="radiogroup" aria-label="Density">
                ${['compact', 'default', 'spacious'].map(d => `
                  <label class="segment">
                    <input type="radio" name="settings-density" value="${d}" ${density === d ? 'checked' : ''} />
                    <span>${d[0].toUpperCase() + d.slice(1)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
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
    document.addEventListener('click', this.#handleOutsideClick);
    document.addEventListener('keydown', this.#handleEscape);

    // Close button
    this.#panel.querySelector('.settings-close')?.addEventListener('click', () => this.close());

    // Mode (segmented control)
    this.#panel.querySelectorAll('input[name="settings-mode"]').forEach(input => {
      input.addEventListener('change', this.#handleModeChange);
    });

    // Theme select
    this.#panel.querySelector('#settings-theme')?.addEventListener('change', this.#handleThemeChange);

    // Accent swatches
    this.#panel.querySelectorAll('input[name="settings-accent"]').forEach(input => {
      input.addEventListener('change', this.#handleAccentChange);
    });

    // Fluid toggle
    this.#panel.querySelector('input[data-fluid-toggle]')?.addEventListener('change', this.#handleFluidToggle);

    // Density segmented control
    this.#panel.querySelectorAll('input[name="settings-density"]').forEach(input => {
      input.addEventListener('change', this.#handleDensityChange);
    });

    // Accessibility toggles
    this.#panel.querySelectorAll('input[data-a11y]').forEach(input => {
      input.addEventListener('change', this.#handleA11yChange);
    });

    // Extension toggles
    this.#panel.querySelectorAll('input[data-ext]').forEach(input => {
      input.addEventListener('change', this.#handleExtensionChange);
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
      const theme = select.value;
      if (theme === 'default') {
        const accentInput = this.#panel.querySelector('input[name="settings-accent"]:checked');
        const accent = accentInput?.value || '';
        await ThemeManager.setBrand(accent || 'default');
      } else {
        await ThemeManager.setBrand(theme);
      }
      this.#updateAccentVisibility(select.value === 'default');
      this.#reapplyA11yThemes();
    } catch {
      console.warn('[VB] Theme load failed, using default');
    } finally {
      select.disabled = false;
    }
  };

  #handleAccentChange = async (e) => {
    const accent = e.target.value;
    try {
      await ThemeManager.setBrand(accent || 'default');
    } catch {
      console.warn('[VB] Theme load failed');
    }
    this.#reapplyA11yThemes();
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
    window.dispatchEvent(new CustomEvent('a11y-themes-change', { detail: current }));
  };

  #handleExtensionChange = (e) => {
    const extId = e.target.dataset.ext;
    const enabled = e.target.checked;
    this.#saveExtension(extId, enabled);
    this.#applyExtensions();
  };

  #handleReset = () => {
    if (!confirm('Reset all settings to defaults?')) return;

    ThemeManager.reset();

    // Clear a11y themes
    this.#saveA11yThemes([]);
    this.#applyA11yThemes();
    window.dispatchEvent(new CustomEvent('a11y-themes-change', { detail: [] }));

    // Reset extensions
    try { localStorage.removeItem(EXTENSIONS_KEY); } catch { /* ignore */ }
    this.#applyExtensions();

    // Re-sync UI
    this.#syncState();
  };

  #handleExternalChange = () => {
    this.#syncState();
  };

  // --- State sync ---

  #syncState() {
    const { mode, brand, fluid } = ThemeManager.getState();
    const selectValue = this.#getSelectValue(brand);
    const accent = this.#getAccent(brand);
    const a11yThemes = this.#loadA11yThemes();
    const extensions = this.#loadExtensions();
    const fluidOn = this.#isFluidOn(fluid);
    const density = this.#getDensity(fluid);

    // Mode
    const modeInput = this.#panel.querySelector(`input[name="settings-mode"][value="${mode}"]`);
    if (modeInput) modeInput.checked = true;

    // Theme select
    const themeSelect = this.#panel.querySelector('#settings-theme');
    if (themeSelect) themeSelect.value = selectValue;

    // Accent
    const accentInput = this.#panel.querySelector(`input[name="settings-accent"][value="${accent}"]`);
    if (accentInput) accentInput.checked = true;
    this.#updateAccentVisibility(selectValue === 'default');

    // Fluid toggle
    const fluidToggle = this.#panel.querySelector('input[data-fluid-toggle]');
    if (fluidToggle) fluidToggle.checked = fluidOn;

    // Density
    const densityInput = this.#panel.querySelector(`input[name="settings-density"][value="${density}"]`);
    if (densityInput) densityInput.checked = true;
    this.#updateDensityVisibility(fluidOn);

    // A11y toggles
    this.#panel.querySelectorAll('input[data-a11y]').forEach(input => {
      input.checked = a11yThemes.includes(input.dataset.a11y);
    });

    // Extension toggles
    this.#panel.querySelectorAll('input[data-ext]').forEach(input => {
      const val = extensions[input.dataset.ext];
      input.checked = val ?? EXTENSION_DEFAULTS[input.dataset.ext];
    });
  }

  #updateAccentVisibility(show) {
    const row = this.#panel.querySelector('.accent-row');
    if (row) row.hidden = !show;
  }

  #updateDensityVisibility(show) {
    const row = this.#panel.querySelector('.density-row');
    if (row) row.hidden = !show;
  }

  // --- localStorage helpers ---

  #loadA11yThemes() {
    try {
      const stored = localStorage.getItem(A11Y_THEMES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  #saveA11yThemes(themes) {
    try { localStorage.setItem(A11Y_THEMES_KEY, JSON.stringify(themes)); }
    catch { /* ignore */ }
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

  #loadExtensions() {
    try {
      const stored = localStorage.getItem(EXTENSIONS_KEY);
      return stored ? { ...EXTENSION_DEFAULTS, ...JSON.parse(stored) } : { ...EXTENSION_DEFAULTS };
    } catch { return { ...EXTENSION_DEFAULTS }; }
  }

  #saveExtension(id, enabled) {
    try {
      const current = this.#loadExtensions();
      current[id] = enabled;
      localStorage.setItem(EXTENSIONS_KEY, JSON.stringify(current));
    } catch { /* ignore */ }
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

    window.dispatchEvent(new CustomEvent('extensions-change', { detail: prefs }));
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
    this.setAttribute('data-open', '');
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
    this.removeAttribute('data-open');
    this.#trigger?.setAttribute('aria-expanded', 'false');
  }

  toggle() {
    this.#isOpen ? this.close() : this.open();
  }
}

customElements.define('settings-panel', SettingsPanel);

export { SettingsPanel };
