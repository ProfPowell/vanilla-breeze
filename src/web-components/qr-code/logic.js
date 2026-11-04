/**
 * qr-code: QR code generator web component
 *
 * Encodes text or a URL as a QR code drawn on a canvas, using the vendored
 * Project Nayuki qrcodegen library (versions 1-40, numeric / alphanumeric /
 * byte modes, ISO/IEC 18004). Progressive enhancement: the element's
 * children (text, or an <a href> to the same URL) are the no-JS fallback,
 * and after upgrade they stay in place as the code's caption, visually
 * hidden unless `data-caption="visible"`.
 *
 * Output is black modules on an opaque white background with a 4-module
 * quiet zone, drawn at a whole number of device pixels per module. It does
 * not follow the theme, dark mode or forced colours, because inverted or
 * low-contrast codes do not scan. `color` / `background` are explicit
 * opt-ins and log a console warning when the pair is risky.
 *
 * @attr {string} value - The text/URL to encode (falls back to the text content). Reactive.
 * @attr {number} size - Edge of the drawn box in CSS pixels, quiet zone included (default: 200). Reactive.
 * @attr {string} color - Module colour (default: #000). Reactive.
 * @attr {string} background - Background colour, always painted (default: #fff). Reactive.
 * @attr {string} error-correction - L, M, Q, H or 0-3 (default: M). Reactive.
 * @attr {string} data-caption - "visible" shows the caption under the code (default: visually hidden).
 * @attr {string} data-label-prefix - Accessible name of the canvas (default: "QR code").
 * @attr {string} data-label-copied - Announcement after copy() (default: "QR code copied").
 * @attr {string} data-error - (output) "capacity" or "encoding" when no code could be drawn.
 *
 * @fires qr-code:error - detail { reason: 'capacity' | 'encoding', value, errorCorrection, message }
 *
 * @example
 * <qr-code value="https://example.com"><a href="https://example.com">example.com</a></qr-code>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { copyRich } from '../../utils/copy-init.js';
import { encodeQR, parseErrorCorrection, layout, colorProblems, EC_LEVELS } from './encode.js';

const DEFAULT_SIZE = 200;
const DEFAULT_FG = '#000';
const DEFAULT_BG = '#fff';

class QrCodeWc extends VBElement {
  /** @type {HTMLCanvasElement | null} */
  #canvas = null;
  /** @type {HTMLElement | null} Wrapper holding the author's children (the caption). */
  #caption = null;
  /** Text content captured at first upgrade; the value when no `value` attribute. */
  #sourceText = '';
  /** Whether the caption was generated from the value (so it may be rewritten). */
  #generatedCaption = false;
  /** Value the canvas currently shows ('' = none). */
  #rendered = '';
  /** Last colour pair warned about, so re-renders do not repeat the warning. */
  #warnedPair = '';

  static get observedAttributes() {
    return ['value', 'size', 'color', 'background', 'error-correction', 'data-label-prefix'];
  }

  /**
   * The encoded text: the `value` attribute, else the original text content.
   * @returns {string}
   */
  get value() {
    return this.getAttribute('value') || this.#sourceText;
  }

  set value(v) {
    if (v == null || v === '') this.removeAttribute('value');
    else this.setAttribute('value', String(v));
  }

  setup() {
    if (!this.#caption) {
      this.#sourceText = (this.textContent ?? '').trim();
      const caption = document.createElement('span');
      caption.setAttribute('data-qr-caption', '');
      caption.append(...this.childNodes);
      // No author content: the caption mirrors the value (kept in sync by #render).
      if (!this.#sourceText && !caption.children.length) {
        caption.textContent = this.value;
        this.#generatedCaption = true;
      }
      this.#caption = caption;
    }
    if (!this.#canvas) {
      this.#canvas = document.createElement('canvas');
      this.#canvas.setAttribute('role', 'img');
    }
    if (this.#canvas.parentNode !== this) this.prepend(this.#canvas);
    if (this.#caption.parentNode !== this) this.append(this.#caption);
    this.#render();
    this.#watchPixelRatio();
    return true;
  }

  /**
   * Redraw when devicePixelRatio changes (browser zoom, moving to another
   * monitor) so modules stay whole device pixels. A resolution query only
   * matches the ratio it was built for, so re-arm after every change.
   */
  #watchPixelRatio() {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    this.listen(mql, 'change', () => {
      if (!this.isConnected) return;
      this.#render();
      this.#watchPixelRatio();
    }, { once: true });
  }

  attributeChangedCallback() {
    // Before upgrade (or while disconnected) connectedCallback renders.
    if (!this.hasAttribute('data-upgraded') || !this.isConnected) return;
    this.#render();
  }

  #render() {
    const canvas = /** @type {HTMLCanvasElement} */ (this.#canvas);
    const text = this.value;
    canvas.setAttribute('aria-label', this.getAttribute('data-label-prefix') || 'QR code');

    if (this.#generatedCaption && this.#caption && this.#caption.textContent !== text) {
      this.#caption.textContent = text;
    }

    this.removeAttribute('data-error');
    if (!text) {
      this.#clear();
      return;
    }

    const rawEcl = this.getAttribute('error-correction');
    let ecl = parseErrorCorrection(rawEcl);
    if (ecl === null) {
      console.warn(`<qr-code>: error-correction="${rawEcl}" is not L, M, Q, H or 0-3; using M.`);
      ecl = 1;
    }

    let qr;
    try {
      qr = encodeQR(text, ecl);
    } catch (err) {
      const reason = /** @type {any} */ (err).reason || 'encoding';
      this.#clear();
      this.setAttribute('data-error', reason);
      this.dispatchEvent(new CustomEvent('qr-code:error', {
        bubbles: true,
        detail: { reason, value: text, errorCorrection: EC_LEVELS[ecl], message: err.message },
      }));
      return;
    }

    const cssSize = Math.max(1, parseInt(this.getAttribute('size') ?? '', 10) || DEFAULT_SIZE);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const { cell, offset, edge } = layout(qr.size, Math.round(cssSize * dpr));

    canvas.hidden = false;
    canvas.width = edge;
    canvas.height = edge;
    canvas.style.inlineSize = `${cssSize}px`;

    const fg = this.#resolveColor(this.getAttribute('color'), DEFAULT_FG);
    const bg = this.#resolveColor(this.getAttribute('background'), DEFAULT_BG);
    this.#checkColors(fg, bg);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, edge, edge);
    ctx.fillStyle = bg.css;
    ctx.fillRect(0, 0, edge, edge);
    ctx.fillStyle = fg.css;
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) {
        if (qr.modules[y][x]) ctx.fillRect(offset + x * cell, offset + y * cell, cell, cell);
      }
    }
    this.#rendered = text;
  }

  #clear() {
    const canvas = /** @type {HTMLCanvasElement} */ (this.#canvas);
    canvas.hidden = true;
    canvas.width = 0;
    canvas.height = 0;
    this.#rendered = '';
  }

  /**
   * Resolve any CSS colour (tokens, var(), named) to rgba channels by letting
   * the canvas compute it. The canvas has forced-color-adjust: none, so forced
   * colours do not rewrite the result.
   *
   * @param {string | null} raw
   * @param {string} fallback
   * @returns {{ css: string, rgba: number[] }}
   */
  #resolveColor(raw, fallback) {
    const canvas = /** @type {HTMLCanvasElement} */ (this.#canvas);
    const value = raw?.trim() || fallback;
    const prev = canvas.style.color;
    canvas.style.color = '';
    canvas.style.color = value;
    if (!canvas.style.color) {
      console.warn(`<qr-code>: "${value}" is not a valid colour; using ${fallback}.`);
      canvas.style.color = fallback;
    }
    const css = getComputedStyle(canvas).color;
    canvas.style.color = prev;
    const nums = (css.match(/[\d.]+/g) || []).map(Number);
    const rgba = [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0, nums[3] ?? 1];
    return { css, rgba };
  }

  /** Warn once per colour pair when a custom pair is unlikely to scan. */
  #checkColors(fg, bg) {
    if (!this.hasAttribute('color') && !this.hasAttribute('background')) return;
    const key = `${fg.css}|${bg.css}`;
    if (key === this.#warnedPair) return;
    this.#warnedPair = key;
    const problems = colorProblems(fg.rgba, bg.rgba);
    if (problems.length) {
      console.warn(`<qr-code>: color="${fg.css}" on background="${bg.css}" may not scan: ${problems.join('; ')}.`, this);
    }
  }

  /**
   * Get the QR code as a data URL (opaque, quiet zone included).
   *
   * @param {string} [type='image/png'] - Image MIME type.
   * @returns {string} The data URL, or '' when no code is drawn.
   */
  toDataURL(type = 'image/png') {
    if (!this.#canvas || !this.#rendered) return '';
    return this.#canvas.toDataURL(type);
  }

  /**
   * Copy the QR code to the clipboard as both the encoded text and a PNG
   * image. Pastes as text into text fields and as an image into design
   * tools and chat clients. Falls back to text-only on browsers without
   * ClipboardItem support.
   *
   * @param {object} [options]
   * @param {HTMLElement} [options.button] - Trigger button for data-state + copy event.
   * @returns {Promise<boolean>} False when no code is drawn or the write failed.
   */
  async copy({ button } = {}) {
    const canvas = this.#canvas;
    if (!canvas || !this.#rendered) return false;
    const text = this.#rendered;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return copyRich(
      { text, blob: blob || undefined },
      { button, announceMessage: this.getAttribute('data-label-copied') || 'QR code copied' },
    );
  }
}

registerComponent('qr-code', QrCodeWc);

export { QrCodeWc };
