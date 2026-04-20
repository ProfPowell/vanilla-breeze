/**
 * theme-export: Collect VB custom property overrides from a scope and emit them as CSS or JSON.
 *
 * The assembly glue for the Theme Composer: editable specimens write CSS
 * custom properties on a scope (usually :root); this component scans those
 * overrides and produces a ready-to-paste theme.css block.
 *
 * @attr {string} scope - CSS selector for the scope to read from (default: ":root")
 * @attr {string} selector - CSS selector to emit in the output (default: ":root")
 * @attr {string} include - Comma-separated prefixes to collect
 *   (default: "--color-,--hue-,--lightness-,--chroma-,--font-,--size-,--radius-,--shadow-,--border-width-,--ease-,--duration-")
 * @attr {string} format - "css" (default) or "json"
 * @attr {string} label - Optional heading label
 * @attr {boolean} live - Re-scan whenever an editable specimen fires a :change event
 *
 * @fires theme-export:change - When the output is regenerated. detail: { output, format, tokens }
 *
 * @example
 * <theme-export></theme-export>
 * <theme-export scope="#preview" label="Your Theme" live></theme-export>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const DEFAULT_INCLUDE = '--color-,--hue-,--lightness-,--chroma-,--font-,--size-,--radius-,--shadow-,--border-width-,--ease-,--duration-';

const LIVE_EVENTS = [
  'type-specimen:change',
  'spacing-specimen:change',
  'token-specimen:change',
  'semantic-palette:change',
];

class ThemeExport extends VBElement {
  static observedAttributes = ['scope', 'selector', 'include', 'format', 'label', 'live'];

  setup() {
    this.#render();
    this.#refresh();
    this.#wireButtons();
    this.#wireLive();
  }

  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute('data-upgraded')) {
      this.#render();
      this.#refresh();
      this.#wireButtons();
      this.#wireLive();
    }
  }

  #scopeEl() {
    const sel = this.getAttribute('scope') || ':root';
    try {
      return sel === ':root' ? document.documentElement : document.querySelector(sel);
    } catch {
      return document.documentElement;
    }
  }

  #prefixes() {
    const raw = this.getAttribute('include') || DEFAULT_INCLUDE;
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  #collect() {
    const scope = this.#scopeEl();
    if (!scope) return [];
    const prefixes = this.#prefixes();
    const style = /** @type {HTMLElement} */ (scope).style;
    const entries = [];
    for (let i = 0; i < style.length; i++) {
      const name = style.item(i);
      if (!name.startsWith('--')) continue;
      if (!prefixes.some((p) => name.startsWith(p))) continue;
      const value = style.getPropertyValue(name).trim();
      if (value) entries.push([name, value]);
    }
    return entries;
  }

  #format(entries) {
    const format = this.getAttribute('format') || 'css';
    if (format === 'json') {
      const obj = Object.fromEntries(entries);
      return JSON.stringify(obj, null, 2);
    }
    const selector = this.getAttribute('selector') || ':root';
    if (!entries.length) {
      return `${selector} {\n  /* No theme overrides detected yet. Edit a specimen to populate. */\n}\n`;
    }
    const lines = entries.map(([name, value]) => `  ${name}: ${value};`).join('\n');
    return `${selector} {\n${lines}\n}\n`;
  }

  #render() {
    const label = this.getAttribute('label') || '';
    const labelHTML = label ? `<p style="font-weight:600;margin:0 0 var(--size-xs,0.5rem)">${label}</p>` : '';
    const toolbarStyle = `display:flex;gap:var(--size-2xs,0.375rem);margin-block-end:var(--size-xs,0.5rem)`;
    const btn = `padding:0.375rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);cursor:pointer;font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const ta = `inline-size:100%;block-size:16rem;padding:var(--size-s,0.75rem);border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface-sunken,#f8f8f8);color:var(--color-text,#222);font-family:var(--font-mono,monospace);font-size:var(--font-size-xs,0.75rem);white-space:pre;overflow:auto;tab-size:2;resize:vertical;box-sizing:border-box`;

    this.innerHTML = `
      ${labelHTML}
      <div class="te-toolbar" style="${toolbarStyle}">
        <button type="button" class="te-refresh" style="${btn}" aria-label="Refresh">Refresh</button>
        <button type="button" class="te-copy" style="${btn}">Copy</button>
        <button type="button" class="te-download" style="${btn}">Download</button>
        <span class="te-count" style="align-self:center;font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);margin-inline-start:auto"></span>
      </div>
      <textarea class="te-output" readonly aria-label="Theme output" style="${ta}"></textarea>
    `;
  }

  #refresh() {
    const entries = this.#collect();
    const output = this.#format(entries);
    const ta = this.querySelector('.te-output');
    const count = this.querySelector('.te-count');
    if (ta) /** @type {HTMLTextAreaElement} */ (ta).value = output;
    if (count) count.textContent = `${entries.length} token${entries.length === 1 ? '' : 's'}`;
    this.dispatchEvent(new CustomEvent('theme-export:change', {
      bubbles: true,
      detail: { output, format: this.getAttribute('format') || 'css', tokens: Object.fromEntries(entries) },
    }));
  }

  #wireButtons() {
    const refresh = this.querySelector('.te-refresh');
    const copy = this.querySelector('.te-copy');
    const download = this.querySelector('.te-download');
    if (refresh) this.listen(refresh, 'click', () => this.#refresh());
    if (copy) {
      this.listen(copy, 'click', () => {
        const ta = /** @type {HTMLTextAreaElement} */ (this.querySelector('.te-output'));
        if (!ta) return;
        navigator.clipboard?.writeText(ta.value);
        const original = copy.textContent;
        copy.textContent = 'Copied!';
        setTimeout(() => { copy.textContent = original; }, 1500);
      });
    }
    if (download) {
      this.listen(download, 'click', () => this.#download());
    }
  }

  #download() {
    const ta = /** @type {HTMLTextAreaElement} */ (this.querySelector('.te-output'));
    if (!ta) return;
    const format = this.getAttribute('format') || 'css';
    const ext = format === 'json' ? 'json' : 'css';
    const blob = new Blob([ta.value], { type: format === 'json' ? 'application/json' : 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  #wireLive() {
    if (!this.hasAttribute('live')) return;
    for (const ev of LIVE_EVENTS) {
      this.listen(document, ev, () => this.#refresh());
    }
  }
}

registerComponent('theme-export', ThemeExport);
