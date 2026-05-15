/**
 * theme-import: Apply a DTCG tokens.json file to a preview scope.
 *
 * Sibling of <theme-export>. Three input modes — paste, file, URL — feed a
 * pure deserializer that reverses VB's prefix mapping and rebuilds CSS
 * values. Tokens land on the host's preview scope (default #preview),
 * never on :root, so import experiments don't leak into the live site.
 *
 * Round-trip lossless for VB-authored DTCG: $extensions["com.vanilla-breeze"]
 * preserves relative-color expressions, light-dark() literals, and em/% units.
 *
 * @attr {string} target - CSS selector for the scope to apply tokens to (default: "#preview").
 * @attr {string} placeholder - Textarea placeholder. Default 'Paste DTCG tokens.json here…'.
 *
 * @fires theme-import:applied - When tokens are applied.
 *   detail: { tokens, applied, ignored, source: 'paste'|'file'|'url' }
 * @fires theme-import:error   - When parsing or fetch fails.
 *   detail: { error, phase }
 *
 * @example
 *   <theme-import target="#preview"></theme-import>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { deserializeDTCG } from './dtcg-deserialize.js';

class ThemeImport extends VBElement {
  static observedAttributes = ['target', 'placeholder'];

  setup() {
    this.#render();
    this.#wire();
  }

  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute('data-upgraded')) {
      this.#render();
      this.#wire();
    }
  }

  #targetEl() {
    const sel = this.getAttribute('target') || '#preview';
    try {
      return /** @type {HTMLElement|null} */ (document.querySelector(sel));
    } catch {
      return null;
    }
  }

  #render() {
    const placeholder = this.getAttribute('placeholder') || 'Paste DTCG tokens.json here…';
    const btn = `padding:0.375rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);cursor:pointer;font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const inp = `padding:0.375rem 0.5rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface,#fff);color:var(--color-text,#222);font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const ta = `inline-size:100%;block-size:10rem;padding:var(--size-s,0.75rem);border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-surface-sunken,#f8f8f8);color:var(--color-text,#222);font-family:var(--font-mono,monospace);font-size:var(--font-size-xs,0.75rem);white-space:pre;overflow:auto;tab-size:2;resize:vertical;box-sizing:border-box`;
    const row = `display:flex;flex-wrap:wrap;gap:var(--size-2xs,0.375rem);align-items:center;margin-block-end:var(--size-s,0.5rem)`;
    const muted = `font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666)`;

    this.innerHTML = `
      <div class="ti-modes" role="tablist" aria-label="Import source" style="${row}">
        <button type="button" class="ti-mode" data-mode="paste" style="${btn}" role="tab" aria-selected="true">Paste</button>
        <button type="button" class="ti-mode" data-mode="file"  style="${btn}" role="tab" aria-selected="false">File</button>
        <button type="button" class="ti-mode" data-mode="url"   style="${btn}" role="tab" aria-selected="false">URL</button>
        <span style="${muted};margin-inline-start:auto" class="ti-target"></span>
      </div>

      <div class="ti-pane ti-pane-paste" role="tabpanel">
        <textarea class="ti-paste" aria-label="DTCG JSON" placeholder="${placeholder}" style="${ta}"></textarea>
        <div style="${row};margin-block-start:var(--size-2xs,0.375rem)">
          <button type="button" class="ti-apply-paste" style="${btn}">Apply</button>
        </div>
      </div>

      <div class="ti-pane ti-pane-file" role="tabpanel" hidden>
        <label style="display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem);${muted}">
          <span>DTCG file (.tokens.json or .json)</span>
          <input class="ti-file" type="file" accept=".json,.tokens,.tokens.json,application/json,application/design-tokens+json" style="${inp}">
        </label>
      </div>

      <div class="ti-pane ti-pane-url" role="tabpanel" hidden>
        <label style="display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem);${muted}">
          <span>DTCG URL (CORS-permitted host)</span>
          <input class="ti-url" type="url" placeholder="https://example.com/theme.tokens.json" style="${inp}">
        </label>
        <div style="${row};margin-block-start:var(--size-2xs,0.375rem)">
          <button type="button" class="ti-apply-url" style="${btn}">Fetch &amp; apply</button>
        </div>
      </div>

      <output class="ti-result" style="display:block;margin-block-start:var(--size-s,0.5rem);${muted}"></output>

      <details class="ti-ignored" style="margin-block-start:var(--size-2xs,0.375rem)" hidden>
        <summary style="${muted};cursor:pointer">Ignored tokens</summary>
        <ul class="ti-ignored-list" style="margin:var(--size-2xs,0.375rem) 0 0;padding-inline-start:1.25rem;${muted}"></ul>
      </details>

      <div style="${row};margin-block-start:var(--size-s,0.5rem)">
        <button type="button" class="ti-reset" style="${btn}">Reset preview scope</button>
      </div>
    `;

    this.#refreshTargetLabel();
  }

  #refreshTargetLabel() {
    const span = this.querySelector('.ti-target');
    if (!span) return;
    const sel = this.getAttribute('target') || '#preview';
    const found = this.#targetEl();
    span.textContent = found ? `Target: ${sel}` : `Target ${sel} not found`;
  }

  #wire() {
    for (const tab of this.querySelectorAll('.ti-mode')) {
      this.listen(tab, 'click', () => this.#switchMode(/** @type {HTMLElement} */ (tab).dataset.mode || 'paste'));
    }
    const apply = this.querySelector('.ti-apply-paste');
    if (apply) this.listen(apply, 'click', () => this.#applyFromPaste());
    const file = /** @type {HTMLInputElement|null} */ (this.querySelector('.ti-file'));
    if (file) this.listen(file, 'change', () => this.#applyFromFile(file));
    const applyUrl = this.querySelector('.ti-apply-url');
    if (applyUrl) this.listen(applyUrl, 'click', () => this.#applyFromURL());
    const reset = this.querySelector('.ti-reset');
    if (reset) this.listen(reset, 'click', () => this.#reset());
  }

  #switchMode(mode) {
    for (const tab of this.querySelectorAll('.ti-mode')) {
      const t = /** @type {HTMLElement} */ (tab);
      const active = t.dataset.mode === mode;
      t.setAttribute('aria-selected', String(active));
    }
    for (const pane of this.querySelectorAll('.ti-pane')) {
      const p = /** @type {HTMLElement} */ (pane);
      p.hidden = !p.classList.contains(`ti-pane-${mode}`);
    }
  }

  #applyFromPaste() {
    const ta = /** @type {HTMLTextAreaElement|null} */ (this.querySelector('.ti-paste'));
    if (!ta) return;
    this.#applyJSON(ta.value, 'paste');
  }

  /** @param {HTMLInputElement} input */
  async #applyFromFile(input) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      this.#applyJSON(text, 'file');
    } catch (err) {
      this.#fail(err, 'file');
    }
  }

  async #applyFromURL() {
    const input = /** @type {HTMLInputElement|null} */ (this.querySelector('.ti-url'));
    const url = input?.value?.trim();
    if (!url) return;
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      const text = await res.text();
      this.#applyJSON(text, 'url');
    } catch (err) {
      this.#fail(err, 'url');
    }
  }

  /**
   * @param {string} text
   * @param {'paste'|'file'|'url'} source
   */
  #applyJSON(text, source) {
    let doc;
    try {
      doc = JSON.parse(text);
    } catch (err) {
      this.#fail(err, 'parse');
      return;
    }
    const result = deserializeDTCG(doc);
    const target = this.#targetEl();
    if (!target) {
      this.#fail(new Error(`Target ${this.getAttribute('target') || '#preview'} not found`), 'apply');
      return;
    }
    for (const [name, value] of result.tokens) {
      target.style.setProperty(name, value);
    }
    this.#showResult(result, source);
    this.dispatchEvent(new CustomEvent('theme-import:applied', {
      bubbles: true,
      detail: {
        tokens: result.tokens,
        applied: result.stats.applied,
        ignored: result.ignored,
        source,
      },
    }));
  }

  #reset() {
    const target = this.#targetEl();
    if (!target) return;
    // Strip any inline custom properties — anything starting with --.
    const style = target.style;
    const remove = [];
    for (let i = 0; i < style.length; i++) {
      const name = style.item(i);
      if (name.startsWith('--')) remove.push(name);
    }
    for (const name of remove) style.removeProperty(name);

    const out = this.querySelector('.ti-result');
    if (out) out.textContent = `Cleared ${remove.length} custom properties from ${this.getAttribute('target') || '#preview'}.`;
    const ig = this.querySelector('.ti-ignored');
    if (ig) /** @type {HTMLDetailsElement} */ (ig).hidden = true;
  }

  #showResult(result, source) {
    const out = this.querySelector('.ti-result');
    if (out) {
      out.textContent = `Applied ${result.stats.applied} token${result.stats.applied === 1 ? '' : 's'} from ${source}${result.stats.ignored ? ` · ${result.stats.ignored} ignored` : ''}.`;
    }
    const ig = this.querySelector('.ti-ignored');
    const list = this.querySelector('.ti-ignored-list');
    if (ig && list) {
      const det = /** @type {HTMLDetailsElement} */ (ig);
      if (result.ignored.length === 0) {
        det.hidden = true;
        list.innerHTML = '';
      } else {
        det.hidden = false;
        list.innerHTML = result.ignored
          .map((p) => `<li>${escapeHTML(p)}</li>`)
          .join('');
      }
    }
  }

  #fail(err, phase) {
    const out = this.querySelector('.ti-result');
    if (out) out.textContent = `Error (${phase}): ${err && err.message ? err.message : String(err)}`;
    this.dispatchEvent(new CustomEvent('theme-import:error', {
      bubbles: true,
      detail: { error: err, phase },
    }));
  }
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (ch) => /** @type {Record<string,string>} */ ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

registerComponent('theme-import', ThemeImport);

export { ThemeImport };
