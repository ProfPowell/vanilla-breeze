/**
 * color-picker: Form-associated color picker with HSL color space
 *
 * Progressive enhancement over <input type="color">.
 * Renders a trigger button and popup with saturation/lightness area,
 * hue slider, text inputs (hex/RGB), preset swatches, and EyeDropper.
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string}  name     - Form field name
 * @attr {boolean} disabled - Disables the picker
 * @attr {boolean} required - Makes selection required
 *
 * The wrapped <input type="color"> provides the initial value.
 * An optional <datalist> provides preset swatches.
 *
 * @example
 * <color-picker name="brand">
 *   <input type="color" value="#6366f1">
 *   <datalist>
 *     <option value="#ef4444">Red</option>
 *     <option value="#3b82f6">Blue</option>
 *   </datalist>
 * </color-picker>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { supportsPopover } from '../../utils/popover-support.js';
import { copyText } from '../../utils/copy-init.js';
import {
  hexToHsl, hslToHex, hslToRgb, hexToRgb, rgbToHex, rgbToHsl, clamp,
  hslToOklch, oklchToHsl, formatColor,
} from './_color-utils.js';

const FORMATS = ['hex', 'rgb', 'hsl', 'oklch'];
const DEFAULT_FORMAT = 'hex';

class ColorPicker extends VBElement {
  static formAssociated = true;

  #internals;
  #input;
  #trigger;
  #triggerSwatch;
  #triggerHex;
  #panel;
  #colorArea;
  #colorAreaThumb;
  #hueStrip;
  #hueThumb;
  #formatSelect;
  #inputGroups = {};   // { hex: {wrapper, inputs:[{el, channel}]}, rgb: {...}, ... }
  #activeFormat = DEFAULT_FORMAT;
  #swatchBar;
  #eyedropperBtn;
  #copyBtn;
  #isOpen = false;
  #usePopover = false;

  // Internal HSL state
  #h = 0;
  #s = 100;
  #l = 50;
  #initialValue;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  setup() {
    this.#input = this.querySelector(':scope > input[type="color"]');
    if (!this.#input) return false;

    // Initial format (default hex). Reflected from the format attribute so
    // authors can land users in HSL or OkLCH directly.
    const fmtAttr = this.getAttribute('format');
    if (fmtAttr && FORMATS.includes(fmtAttr)) this.#activeFormat = fmtAttr;

    // Parse initial value
    const initHex = this.#input.value || '#000000';
    this.#initialValue = initHex;
    const hsl = hexToHsl(initHex);
    this.#h = hsl.h;
    this.#s = hsl.s;
    this.#l = hsl.l;

    // Hide native input
    this.#input.setAttribute('tabindex', '-1');
    this.#input.setAttribute('aria-hidden', 'true');
    this.#input.style.cssText = 'position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';

    this.#buildTrigger();
    this.#buildPanel();
    this.#updateAll();
    this.#syncFormValue();

    this.#usePopover = supportsPopover;
    if (this.#usePopover) {
      this.#panel.setAttribute('popover', 'manual');
    }

    this.listen(document, 'click', this.#handleOutsideClick);

    if (this.#input.disabled || this.hasAttribute('disabled')) {
      this.setAttribute('data-disabled', '');
    }
    return true;
  }

  teardown() {
    window.removeEventListener('scroll', this.#onReposition, { capture: true });
    window.removeEventListener('resize', this.#onReposition);
  }

  // --- Build UI ---

  #buildTrigger() {
    this.#trigger = document.createElement('button');
    this.#trigger.type = 'button';
    this.#trigger.className = 'color-trigger';
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');

    this.#triggerSwatch = document.createElement('span');
    this.#triggerSwatch.className = 'color-swatch';

    this.#triggerHex = document.createElement('span');
    this.#triggerHex.className = 'color-hex';

    this.#trigger.appendChild(this.#triggerSwatch);
    this.#trigger.appendChild(this.#triggerHex);
    this.appendChild(this.#trigger);

    this.listen(this.#trigger, 'click', () => {
      this.#isOpen ? this.#close() : this.#open();
    });
  }

  #buildPanel() {
    this.#panel = document.createElement('div');
    this.#panel.className = 'color-panel';
    this.#panel.setAttribute('role', 'dialog');
    this.#panel.setAttribute('aria-label', 'Color picker');

    // Saturation/Lightness area
    this.#colorArea = document.createElement('div');
    this.#colorArea.className = 'color-area';
    this.#colorArea.setAttribute('role', 'slider');
    this.#colorArea.setAttribute('aria-label', 'Saturation and lightness');
    this.#colorArea.setAttribute('tabindex', '0');

    this.#colorAreaThumb = document.createElement('div');
    this.#colorAreaThumb.className = 'color-area-thumb';
    this.#colorArea.appendChild(this.#colorAreaThumb);
    this.#panel.appendChild(this.#colorArea);

    // Hue strip
    const hueWrap = document.createElement('div');
    hueWrap.className = 'color-hue-wrap';

    this.#hueStrip = document.createElement('div');
    this.#hueStrip.className = 'color-hue';
    this.#hueStrip.setAttribute('role', 'slider');
    this.#hueStrip.setAttribute('aria-label', 'Hue');
    this.#hueStrip.setAttribute('aria-valuemin', '0');
    this.#hueStrip.setAttribute('aria-valuemax', '360');
    this.#hueStrip.setAttribute('tabindex', '0');

    this.#hueThumb = document.createElement('div');
    this.#hueThumb.className = 'color-hue-thumb';
    this.#hueStrip.appendChild(this.#hueThumb);
    hueWrap.appendChild(this.#hueStrip);
    this.#panel.appendChild(hueWrap);

    // Format selector — controls which inputs are visible AND what Copy writes
    const formatRow = document.createElement('div');
    formatRow.className = 'color-format-row';

    const formatLabel = document.createElement('label');
    formatLabel.className = 'color-format-label';
    const formatLabelText = document.createElement('span');
    formatLabelText.textContent = 'Format';
    this.#formatSelect = document.createElement('select');
    this.#formatSelect.className = 'color-format-select';
    for (const f of FORMATS) {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f.toUpperCase();
      this.#formatSelect.appendChild(opt);
    }
    this.#formatSelect.value = this.#activeFormat;
    formatLabel.appendChild(formatLabelText);
    formatLabel.appendChild(this.#formatSelect);
    formatRow.appendChild(formatLabel);
    this.#panel.appendChild(formatRow);
    this.listen(this.#formatSelect, 'change', this.#handleFormatChange);

    // Text inputs — one group per format, only the active one is visible.
    this.#inputGroups.hex = this.#buildInputGroup('hex', [
      { label: 'Hex', channel: 'hex', kind: 'text', maxLength: 7 },
    ]);
    this.#inputGroups.rgb = this.#buildInputGroup('rgb', [
      { label: 'R', channel: 'r', kind: 'number', min: 0, max: 255, step: 1 },
      { label: 'G', channel: 'g', kind: 'number', min: 0, max: 255, step: 1 },
      { label: 'B', channel: 'b', kind: 'number', min: 0, max: 255, step: 1 },
    ]);
    this.#inputGroups.hsl = this.#buildInputGroup('hsl', [
      { label: 'H', channel: 'h', kind: 'number', min: 0, max: 360, step: 1 },
      { label: 'S', channel: 's', kind: 'number', min: 0, max: 100, step: 1 },
      { label: 'L', channel: 'l', kind: 'number', min: 0, max: 100, step: 1 },
    ]);
    this.#inputGroups.oklch = this.#buildInputGroup('oklch', [
      { label: 'L%', channel: 'oL', kind: 'number', min: 0, max: 100, step: 0.1 },
      { label: 'C',  channel: 'oC', kind: 'number', min: 0, max: 0.4, step: 0.001 },
      { label: 'H°', channel: 'oH', kind: 'number', min: 0, max: 360, step: 0.1 },
    ]);
    for (const f of FORMATS) this.#panel.appendChild(this.#inputGroups[f].wrapper);
    this.#applyFormatVisibility();

    // Swatches from datalist
    const datalist = this.querySelector(':scope > datalist');
    if (datalist) {
      this.#swatchBar = document.createElement('div');
      this.#swatchBar.className = 'color-swatches';
      this.#swatchBar.setAttribute('role', 'listbox');
      this.#swatchBar.setAttribute('aria-label', 'Preset colors');

      for (const opt of /** @type {NodeListOf<HTMLOptionElement>} */ (datalist.querySelectorAll('option[value]'))) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'option');
        btn.style.background = opt.value;
        btn.setAttribute('aria-label', opt.textContent || opt.value);
        btn.setAttribute('data-color', opt.value);
        this.#swatchBar.appendChild(btn);
      }
      this.#panel.appendChild(this.#swatchBar);
      this.listen(this.#swatchBar, 'click', this.#handleSwatchClick);
    }

    // Actions row
    const actions = document.createElement('div');
    actions.className = 'color-actions';

    // EyeDropper
    if ('EyeDropper' in window) {
      this.#eyedropperBtn = document.createElement('button');
      this.#eyedropperBtn.type = 'button';
      this.#eyedropperBtn.className = 'color-eyedropper';
      this.#eyedropperBtn.setAttribute('aria-label', 'Pick color from screen');
      this.#eyedropperBtn.textContent = '\u{1F4A7}'; // droplet emoji as fallback
      actions.appendChild(this.#eyedropperBtn);
      this.listen(this.#eyedropperBtn, 'click', this.#handleEyeDropper);
    }

    // Copy button
    this.#copyBtn = document.createElement('button');
    this.#copyBtn.type = 'button';
    this.#copyBtn.className = 'color-copy';
    this.#copyBtn.setAttribute('aria-label', 'Copy hex value');
    this.#copyBtn.textContent = 'Copy';
    actions.appendChild(this.#copyBtn);
    this.listen(this.#copyBtn, 'click', this.#handleCopy);

    this.#panel.appendChild(actions);
    this.appendChild(this.#panel);

    // Event handlers for color area and hue strip
    this.listen(this.#colorArea, 'pointerdown', this.#handleAreaPointerDown);
    this.listen(this.#colorArea, 'keydown', this.#handleAreaKeydown);
    this.listen(this.#hueStrip, 'pointerdown', this.#handleHuePointerDown);
    this.listen(this.#hueStrip, 'keydown', this.#handleHueKeydown);

    // Text input change handlers wired per group
    for (const f of FORMATS) {
      const handler = f === 'hex' ? this.#handleHexChange
                    : f === 'rgb' ? this.#handleRgbChange
                    : f === 'hsl' ? this.#handleHslChange
                    :               this.#handleOklchChange;
      for (const { el } of this.#inputGroups[f].inputs) {
        this.listen(el, 'change', handler);
      }
    }
  }

  #buildInputGroup(format, fields) {
    const wrapper = document.createElement('div');
    wrapper.className = `color-inputs color-inputs-${format}`;
    wrapper.setAttribute('data-format', format);
    const inputs = [];
    for (const f of fields) {
      const label = document.createElement('label');
      label.className = 'color-input-label';
      const span = document.createElement('span');
      span.textContent = f.label;
      const input = document.createElement('input');
      input.type = f.kind;
      input.setAttribute('data-channel', f.channel);
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');
      if (f.kind === 'text' && f.maxLength) input.setAttribute('maxlength', String(f.maxLength));
      if (f.kind === 'number') {
        input.min = String(f.min);
        input.max = String(f.max);
        if (f.step != null) input.step = String(f.step);
      }
      label.appendChild(span);
      label.appendChild(input);
      wrapper.appendChild(label);
      inputs.push({ el: input, channel: f.channel });
    }
    return { wrapper, inputs };
  }

  #applyFormatVisibility() {
    for (const f of FORMATS) {
      this.#inputGroups[f].wrapper.hidden = (f !== this.#activeFormat);
    }
    if (this.#copyBtn) {
      this.#copyBtn.setAttribute('aria-label', `Copy ${this.#activeFormat.toUpperCase()} value`);
    }
  }

  #handleFormatChange = () => {
    const next = this.#formatSelect.value;
    if (!FORMATS.includes(next)) return;
    this.#activeFormat = next;
    this.#applyFormatVisibility();
    this.#updateAll();
  };

  // --- Color Area (Saturation/Lightness) ---

  #handleAreaPointerDown = (e) => {
    e.preventDefault();
    this.#colorArea.setPointerCapture(e.pointerId);
    this.#updateAreaFromPointer(e);

    const move = (ev) => this.#updateAreaFromPointer(ev);
    const up = (ev) => {
      this.#colorArea.releasePointerCapture(ev.pointerId);
      this.#colorArea.removeEventListener('pointermove', move);
      this.#colorArea.removeEventListener('pointerup', up);
    };

    this.#colorArea.addEventListener('pointermove', move);
    this.#colorArea.addEventListener('pointerup', up);
  };

  #updateAreaFromPointer(e) {
    const rect = this.#colorArea.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    this.#s = Math.round(x * 100);
    this.#l = Math.round((1 - y) * 100);
    this.#commit();
  }

  #handleAreaKeydown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); this.#s = clamp(this.#s + step, 0, 100); break;
      case 'ArrowLeft':  e.preventDefault(); this.#s = clamp(this.#s - step, 0, 100); break;
      case 'ArrowUp':    e.preventDefault(); this.#l = clamp(this.#l + step, 0, 100); break;
      case 'ArrowDown':  e.preventDefault(); this.#l = clamp(this.#l - step, 0, 100); break;
      default: return;
    }
    this.#commit();
  };

  // --- Hue Strip ---

  #handleHuePointerDown = (e) => {
    e.preventDefault();
    this.#hueStrip.setPointerCapture(e.pointerId);
    this.#updateHueFromPointer(e);

    const move = (ev) => this.#updateHueFromPointer(ev);
    const up = (ev) => {
      this.#hueStrip.releasePointerCapture(ev.pointerId);
      this.#hueStrip.removeEventListener('pointermove', move);
      this.#hueStrip.removeEventListener('pointerup', up);
    };

    this.#hueStrip.addEventListener('pointermove', move);
    this.#hueStrip.addEventListener('pointerup', up);
  };

  #updateHueFromPointer(e) {
    const rect = this.#hueStrip.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    this.#h = Math.round(x * 360);
    this.#commit();
  }

  #handleHueKeydown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp':
        e.preventDefault();
        this.#h = (this.#h + step) % 361;
        break;
      case 'ArrowLeft': case 'ArrowDown':
        e.preventDefault();
        this.#h = (this.#h - step + 361) % 361;
        break;
      default: return;
    }
    this.#commit();
  };

  // --- Text Input Handlers ---

  #channelInput(format, channel) {
    return this.#inputGroups[format].inputs.find(i => i.channel === channel)?.el;
  }

  #handleHexChange = () => {
    const inp = this.#channelInput('hex', 'hex');
    if (!inp) return;
    let val = inp.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
      const hsl = hexToHsl(val);
      this.#h = hsl.h;
      this.#s = hsl.s;
      this.#l = hsl.l;
      this.#commit();
    }
  };

  #handleRgbChange = () => {
    const r = clamp(Number(this.#channelInput('rgb', 'r').value) || 0, 0, 255);
    const g = clamp(Number(this.#channelInput('rgb', 'g').value) || 0, 0, 255);
    const b = clamp(Number(this.#channelInput('rgb', 'b').value) || 0, 0, 255);
    const hsl = rgbToHsl(r, g, b);
    this.#h = hsl.h;
    this.#s = hsl.s;
    this.#l = hsl.l;
    this.#commit();
  };

  #handleHslChange = () => {
    const h = clamp(Number(this.#channelInput('hsl', 'h').value) || 0, 0, 360) % 361;
    const s = clamp(Number(this.#channelInput('hsl', 's').value) || 0, 0, 100);
    const l = clamp(Number(this.#channelInput('hsl', 'l').value) || 0, 0, 100);
    this.#h = h;
    this.#s = s;
    this.#l = l;
    this.#commit();
  };

  #handleOklchChange = () => {
    const L = clamp(Number(this.#channelInput('oklch', 'oL').value) || 0, 0, 100) / 100;
    const C = clamp(Number(this.#channelInput('oklch', 'oC').value) || 0, 0, 0.4);
    const H = clamp(Number(this.#channelInput('oklch', 'oH').value) || 0, 0, 360);
    const hsl = oklchToHsl(L, C, H);
    this.#h = hsl.h;
    this.#s = hsl.s;
    this.#l = hsl.l;
    this.#commit();
  };

  // --- Swatches ---

  #handleSwatchClick = (e) => {
    const btn = e.target.closest('button[data-color]');
    if (!btn) return;
    const hex = btn.getAttribute('data-color');
    const hsl = hexToHsl(hex);
    this.#h = hsl.h;
    this.#s = hsl.s;
    this.#l = hsl.l;
    this.#commit();
  };

  // --- EyeDropper ---

  #handleEyeDropper = async () => {
    try {
      const dropper = new (/** @type {any} */ (window).EyeDropper)();
      const result = await dropper.open();
      const hsl = hexToHsl(result.sRGBHex);
      this.#h = hsl.h;
      this.#s = hsl.s;
      this.#l = hsl.l;
      this.#commit();
    } catch { /* user cancelled */ }
  };

  // --- Copy ---

  #handleCopy = () => {
    const value = formatColor(/** @type {any} */ (this.#activeFormat), this.#h, this.#s, this.#l);
    copyText(value, { button: this.#copyBtn, announceMessage: 'Color copied' });
  };

  // --- Update/Commit ---

  /**
   * Commit the current HSL state and emit a tagged change event.
   * @param {'internal' | 'api' | 'pointer' | 'keyboard'} [source='internal']
   *   Where the change originated. Lets framework consumers filter their
   *   own .value assignments out of the event stream.
   */
  #commit(source = 'internal') {
    this.#updateAll();
    this.#syncFormValue();

    const hex = hslToHex(this.#h, this.#s, this.#l);
    const rgb = hslToRgb(this.#h, this.#s, this.#l);
    this.dispatchEvent(new CustomEvent('color-picker:change', {
      bubbles: true,
      detail: {
        hex,
        rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
        hsl: { h: this.#h, s: this.#s, l: this.#l },
        source,
      },
    }));
  }

  #updateAll() {
    const hex = hslToHex(this.#h, this.#s, this.#l);
    const rgb = hslToRgb(this.#h, this.#s, this.#l);
    const pureHue = hslToHex(this.#h, 100, 50);

    // Trigger
    this.#triggerSwatch.style.background = hex;
    this.#triggerHex.textContent = hex;

    // Color area background
    this.#colorArea.style.setProperty('--area-hue', pureHue);

    // Area thumb position (x=saturation, y=inverse lightness)
    this.#colorAreaThumb.style.insetInlineStart = `${this.#s}%`;
    this.#colorAreaThumb.style.insetBlockStart = `${100 - this.#l}%`;
    this.#colorAreaThumb.style.background = hex;

    // Area ARIA
    this.#colorArea.setAttribute('aria-valuetext',
      `Saturation ${this.#s}%, Lightness ${this.#l}%`);

    // Hue thumb
    this.#hueThumb.style.insetInlineStart = `${(this.#h / 360) * 100}%`;
    this.#hueStrip.setAttribute('aria-valuenow', String(this.#h));
    this.#hueStrip.setAttribute('aria-valuetext', `Hue ${this.#h}°`);

    // Text inputs — populate every format group so switching formats
    // immediately shows the right channel values for the current color.
    const setVal = (format, channel, v) => {
      const el = this.#channelInput(format, channel);
      if (el) el.value = String(v);
    };
    setVal('hex', 'hex', hex);
    setVal('rgb', 'r', rgb.r);
    setVal('rgb', 'g', rgb.g);
    setVal('rgb', 'b', rgb.b);
    setVal('hsl', 'h', this.#h);
    setVal('hsl', 's', this.#s);
    setVal('hsl', 'l', this.#l);
    const oklch = hslToOklch(this.#h, this.#s, this.#l);
    setVal('oklch', 'oL', (oklch.L * 100).toFixed(1));
    setVal('oklch', 'oC', oklch.C.toFixed(3));
    setVal('oklch', 'oH', oklch.H.toFixed(1));
  }

  // --- Open/Close ---

  #open() {
    if (this.#isOpen) return;
    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#trigger.setAttribute('aria-expanded', 'true');

    if (this.#usePopover) {
      this.#positionPanel();
      try { this.#panel.showPopover(); } catch { /* already open */ }
      window.addEventListener('scroll', this.#onReposition, { capture: true, passive: true });
      window.addEventListener('resize', this.#onReposition, { passive: true });
    }

    requestAnimationFrame(() => this.#colorArea.focus());
    this.dispatchEvent(new CustomEvent('color-picker:open', { bubbles: true }));
  }

  #close() {
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#trigger.setAttribute('aria-expanded', 'false');

    if (this.#usePopover) {
      try { this.#panel.hidePopover(); } catch { /* already closed */ }
      window.removeEventListener('scroll', this.#onReposition, { capture: true });
      window.removeEventListener('resize', this.#onReposition);
    }

    this.dispatchEvent(new CustomEvent('color-picker:close', { bubbles: true }));
  }

  #positionPanel() {
    if (!this.#usePopover) return;
    const rect = this.#trigger.getBoundingClientRect();
    this.#panel.style.setProperty('--panel-top', `${rect.bottom + 4}px`);
    this.#panel.style.setProperty('--panel-left', `${rect.left}px`);
  }

  #onReposition = () => {
    if (this.#isOpen) this.#positionPanel();
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) {
      this.#close();
    }
  };

  // --- Form Integration ---

  #syncFormValue() {
    const hex = hslToHex(this.#h, this.#s, this.#l);
    this.#internals.setFormValue(hex);
    this.#input.value = hex;
    this.#input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  formResetCallback() {
    const hsl = hexToHsl(this.#initialValue);
    this.#h = hsl.h;
    this.#s = hsl.s;
    this.#l = hsl.l;
    this.#updateAll();
    this.#syncFormValue();
  }

  formStateRestoreCallback(state) {
    if (!state) return;
    const hsl = hexToHsl(state);
    this.#h = hsl.h;
    this.#s = hsl.s;
    this.#l = hsl.l;
    this.#updateAll();
    this.#syncFormValue();
  }

  get value() {
    return hslToHex(this.#h, this.#s, this.#l);
  }

  set value(val) {
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) return;
    // Idempotent short-circuit: skip if the assignment matches current state.
    const currentHex = hslToHex(this.#h, this.#s, this.#l).toLowerCase();
    const incoming = val.toLowerCase();
    if (currentHex === incoming || currentHex === incoming.toLowerCase()) return;
    const hsl = hexToHsl(val);
    this.#h = hsl.h;
    this.#s = hsl.s;
    this.#l = hsl.l;
    this.#commit('api');
  }
}

registerComponent('color-picker', ColorPicker);

export { ColorPicker };
