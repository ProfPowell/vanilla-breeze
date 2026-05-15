/**
 * theme-catalog: Browse and apply curated public design-system token sets.
 *
 * Renders a tile grid of vendored DTCG entries (Material, IBM Carbon,
 * Salesforce Lightning, GOV.UK, Atlassian, Tailwind, Bootstrap,
 * Catppuccin Mocha). Clicking a tile fetches the entry's .tokens.json,
 * deserializes it via the Phase 3 deserializer, and writes the resulting
 * custom properties to a target scope (default #preview).
 *
 * Companion to <theme-import>. theme-import handles ad-hoc paste/file/URL
 * imports; theme-catalog is the curated quick-start surface.
 *
 * @attr {string} target  - CSS selector for the scope to apply tokens to (default: "#preview").
 * @attr {string} catalog-base - Base URL for the catalog files. Default auto-detects from the
 *                               component path; override for hosted contexts.
 *
 * @fires theme-catalog:applied - When an entry is applied. detail: { id, applied, ignored, tokens, source }
 * @fires theme-catalog:error   - On fetch / parse / apply failure. detail: { id, error, phase }
 *
 * @example
 *   <theme-catalog target="#preview"></theme-catalog>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { deserializeDTCG } from '../theme-import/dtcg-deserialize.js';

class ThemeCatalog extends VBElement {
  static observedAttributes = ['target', 'catalog-base'];

  /** @type {any[] | null} */
  #entries = null;
  #lastAppliedId = '';

  setup() {
    this.#renderShell();
    this.#loadAndRender();
  }

  attributeChangedCallback() {
    if (this.isConnected && this.hasAttribute('data-upgraded')) {
      this.#renderShell();
      this.#loadAndRender();
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

  /**
   * Resolve the catalog base URL. The component is bundled into the VB
   * core so it ships from the same origin as `dist/cdn/components/theme-catalog.js`.
   * Catalog files live in src/web-components/theme-import/catalog/ — the
   * publish pipeline copies them under dist/cdn/themes/catalog/ (Phase 4
   * build step). Auto-detect from a known sibling import or accept an
   * explicit `catalog-base` attribute override.
   */
  #base() {
    const explicit = this.getAttribute('catalog-base');
    if (explicit) return explicit.replace(/\/$/, '');
    if (typeof window !== 'undefined' && /** @type {any} */ (window).__VB_CATALOG_BASE) {
      return String(/** @type {any} */ (window).__VB_CATALOG_BASE).replace(/\/$/, '');
    }
    return '/cdn/themes/catalog';
  }

  #renderShell() {
    const card  = `border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);background:var(--color-surface,#fff);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem);min-block-size:0`;
    const grid  = `display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:var(--size-s,0.75rem)`;
    const muted = `font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666)`;
    const title = `margin:0;font-size:var(--font-size-md,1rem);font-weight:600;color:var(--color-text,#222)`;
    const btn   = `align-self:flex-start;padding:0.375rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-primary,#0066cc);color:var(--color-text-on-primary,#fff);cursor:pointer;font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const tag   = `display:inline-block;padding:0.125rem 0.375rem;border-radius:0.25rem;background:var(--color-surface-raised,#f3f3f3);${muted};margin-inline-end:0.25rem`;

    this.innerHTML = `
      <div class="tc-head" style="display:flex;align-items:baseline;gap:var(--size-s,0.75rem);margin-block-end:var(--size-s,0.75rem);flex-wrap:wrap">
        <strong style="font-size:var(--font-size-sm,0.875rem)">Start from a known system</strong>
        <span class="tc-target" style="${muted}"></span>
      </div>
      <div class="tc-grid" style="${grid}" role="list"></div>
      <output class="tc-result" style="display:block;margin-block-start:var(--size-s,0.75rem);${muted}"></output>
      <p class="tc-attribution" style="margin-block-start:var(--size-2xs,0.375rem);${muted}" hidden></p>
      <details class="tc-ignored" style="margin-block-start:var(--size-2xs,0.375rem)" hidden>
        <summary style="${muted};cursor:pointer">Ignored tokens</summary>
        <ul class="tc-ignored-list" style="margin:var(--size-2xs,0.375rem) 0 0;padding-inline-start:1.25rem;${muted}"></ul>
      </details>
      <style>
        :host ._card { ${card} }
        :host ._title { ${title} }
        :host ._btn { ${btn} }
        :host ._tag { ${tag} }
      </style>
    `;

    this.#refreshTargetLabel();
  }

  #refreshTargetLabel() {
    const span = this.querySelector('.tc-target');
    if (!span) return;
    const sel = this.getAttribute('target') || '#preview';
    const found = this.#targetEl();
    span.textContent = found ? `Target: ${sel}` : `Target ${sel} not found`;
  }

  async #loadAndRender() {
    const grid = this.querySelector('.tc-grid');
    if (!grid) return;
    try {
      const res = await fetch(`${this.#base()}/manifest.json`);
      if (!res.ok) throw new Error(`Catalog manifest fetch failed: ${res.status}`);
      const manifest = await res.json();
      this.#entries = manifest.entries || [];
      this.#renderTiles();
    } catch (err) {
      grid.innerHTML = '';
      const out = this.querySelector('.tc-result');
      if (out) out.textContent = `Couldn't load catalog manifest: ${err && err.message ? err.message : String(err)}`;
    }
  }

  #renderTiles() {
    const grid = this.querySelector('.tc-grid');
    if (!grid || !this.#entries) return;
    const card = `border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);background:var(--color-surface,#fff);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-2xs,0.375rem)`;
    const title = `margin:0;font-size:var(--font-size-md,1rem);font-weight:600;color:var(--color-text,#222)`;
    const btn   = `align-self:flex-start;margin-block-start:auto;padding:0.375rem 0.75rem;border:1px solid var(--color-border,#ccc);border-radius:var(--radius-s,0.25rem);background:var(--color-primary,#0066cc);color:var(--color-text-on-primary,#fff);cursor:pointer;font:inherit;font-size:var(--font-size-xs,0.75rem)`;
    const muted = `font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666)`;
    const tag   = `display:inline-block;padding:0.125rem 0.375rem;border-radius:0.25rem;background:var(--color-surface-raised,#f3f3f3);${muted};margin-inline-end:0.25rem`;

    grid.innerHTML = '';
    for (const entry of this.#entries) {
      const tile = document.createElement('article');
      tile.setAttribute('role', 'listitem');
      tile.setAttribute('data-id', entry.id);
      tile.style.cssText = card;
      tile.innerHTML = `
        <h3 style="${title}">${escapeHTML(entry.name)}</h3>
        <p style="${muted};margin:0">${escapeHTML(entry.summary || '')}</p>
        <p style="${muted};margin:0">License: ${escapeHTML(entry.license)}</p>
        <p style="margin:0">${(entry.tags || []).map((t) => `<span style="${tag}">${escapeHTML(t)}</span>`).join('')}</p>
        <button type="button" class="tc-apply" style="${btn}" data-id="${escapeAttr(entry.id)}" aria-label="Apply ${escapeAttr(entry.name)} tokens">
          Apply
        </button>
      `;
      const btnEl = /** @type {HTMLButtonElement|null} */ (tile.querySelector('button.tc-apply'));
      if (btnEl) this.listen(btnEl, 'click', () => this.#applyEntry(entry));
      grid.appendChild(tile);
    }
  }

  /**
   * @param {{ id: string, name: string, file: string, attribution: string, source: string, license: string }} entry
   */
  async #applyEntry(entry) {
    const target = this.#targetEl();
    if (!target) {
      this.#fail(entry.id, new Error(`Target ${this.getAttribute('target') || '#preview'} not found`), 'apply');
      return;
    }
    try {
      const res = await fetch(`${this.#base()}/${entry.file}`);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const doc = await res.json();
      const result = deserializeDTCG(doc);
      for (const [name, value] of result.tokens) {
        target.style.setProperty(name, value);
      }
      this.#showResult(entry, result);
      this.#lastAppliedId = entry.id;
      this.dispatchEvent(new CustomEvent('theme-catalog:applied', {
        bubbles: true,
        detail: { id: entry.id, applied: result.stats.applied, ignored: result.ignored, tokens: result.tokens, source: 'catalog' },
      }));
    } catch (err) {
      this.#fail(entry.id, err, 'fetch-or-apply');
    }
  }

  #showResult(entry, result) {
    const out = this.querySelector('.tc-result');
    if (out) {
      out.textContent = `Applied ${result.stats.applied} token${result.stats.applied === 1 ? '' : 's'} from ${entry.name}${result.stats.ignored ? ` · ${result.stats.ignored} ignored` : ''}.`;
    }
    const att = /** @type {HTMLElement|null} */ (this.querySelector('.tc-attribution'));
    if (att) {
      att.hidden = false;
      att.textContent = entry.attribution;
    }
    const ig = /** @type {HTMLDetailsElement|null} */ (this.querySelector('.tc-ignored'));
    const list = this.querySelector('.tc-ignored-list');
    if (ig && list) {
      if (result.ignored.length === 0) {
        ig.hidden = true;
        list.innerHTML = '';
      } else {
        ig.hidden = false;
        list.innerHTML = result.ignored.map((p) => `<li>${escapeHTML(p)}</li>`).join('');
      }
    }
  }

  #fail(id, err, phase) {
    const out = this.querySelector('.tc-result');
    if (out) out.textContent = `Error (${phase}): ${err && err.message ? err.message : String(err)}`;
    this.dispatchEvent(new CustomEvent('theme-catalog:error', {
      bubbles: true,
      detail: { id, error: err, phase },
    }));
  }
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (ch) => /** @type {Record<string,string>} */ ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}
function escapeAttr(s) { return escapeHTML(s); }

registerComponent('theme-catalog', ThemeCatalog);

export { ThemeCatalog };
