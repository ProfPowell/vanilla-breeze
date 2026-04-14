/**
 * font-pairer — Interactive font pairing tool
 *
 * Pick up to 4 font roles (heading, body, code, display) from a curated
 * Google Fonts list, preview in multiple contexts, edit sample text live,
 * and export as CSS custom properties.
 *
 * @attr {string}  heading-font  - Initial heading font family
 * @attr {string}  body-font     - Initial body font family
 * @attr {string}  code-font     - Initial code/monospace font family
 * @attr {string}  display-font  - Initial display/decorative font family
 * @attr {boolean} show-export   - Show Copy CSS / Copy @import toolbar
 * @attr {boolean} show-suggestions - Show curated pairing suggestions
 * @attr {string}  preview       - Preview mode: "combined" (default), "article", "card", "hero"
 *
 * @fires font-pairer:change - { heading, body, code, display }
 *
 * @example
 * <font-pairer heading-font="Playfair Display" body-font="Inter" show-export show-suggestions></font-pairer>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { FONTS, SUGGESTED_PAIRINGS, loadFont, googleFontsUrl } from './_font-data.js';

const PREVIEWS = {
  combined: {
    label: 'Combined',
    render: (f, t) => `
      <h3 style="font-family:${f.heading};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0"
          contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="heading">${t.heading}</h3>
      <p style="font-family:${f.body};font-size:var(--font-size-md,1rem);line-height:1.65;margin:0;color:var(--color-text-muted,#666)"
         contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="body">${t.body}</p>
      <pre style="font-family:${f.code};font-size:var(--font-size-sm,0.875rem);line-height:1.5;margin:0;padding:var(--size-s,0.75rem);background:var(--color-surface-sunken,#eee);border-radius:var(--radius-s,0.25rem);overflow-x:auto"><code contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="code">${t.code}</code></pre>`,
  },
  article: {
    label: 'Article',
    render: (f, t) => `
      <small style="font-family:${f.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.08em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600">Design Systems</small>
      <h2 style="font-family:${f.heading};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0;line-height:1.2"
          contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="heading">${t.heading}</h2>
      <p style="font-family:${f.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0">By Jamie Chen · April 14, 2026 · 8 min read</p>
      <p style="font-family:${f.body};line-height:1.7;margin:0"
         contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="body">${t.body}</p>
      <blockquote style="font-family:${f.display};font-style:italic;font-size:var(--font-size-lg,1.125rem);border-inline-start:3px solid var(--color-interactive,oklch(55% .2 260));padding-inline-start:var(--size-m,1rem);margin:0;color:var(--color-text-muted,#666)">"Good typography is invisible — it lets the content breathe."</blockquote>`,
  },
  card: {
    label: 'Card UI',
    render: (f, t) => `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--size-m,1rem)">
        <div style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)">
          <h4 style="font-family:${f.heading};font-weight:600;margin:0">Premium Plan</h4>
          <p style="font-family:${f.display};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0">$49<small style="font-size:0.5em;font-weight:400">/mo</small></p>
          <p style="font-family:${f.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0">Everything you need to build faster.</p>
          <code style="font-family:${f.code};font-size:var(--font-size-xs,0.75rem);background:var(--color-surface-sunken,#eee);padding:0.2rem 0.4rem;border-radius:0.25rem">npm install acme</code>
        </div>
        <div style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)">
          <h4 style="font-family:${f.heading};font-weight:600;margin:0">Enterprise</h4>
          <p style="font-family:${f.display};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0">Custom</p>
          <p style="font-family:${f.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0">Dedicated support and SLA.</p>
          <code style="font-family:${f.code};font-size:var(--font-size-xs,0.75rem);background:var(--color-surface-sunken,#eee);padding:0.2rem 0.4rem;border-radius:0.25rem">contact@acme.dev</code>
        </div>
      </div>`,
  },
  hero: {
    label: 'Hero',
    render: (f, t) => `
      <div style="text-align:center;padding:var(--size-xl,2rem) 0">
        <p style="font-family:${f.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.1em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600;margin:0 0 var(--size-xs,0.5rem)">Introducing</p>
        <h1 style="font-family:${f.display};font-size:clamp(2rem,5vw,3rem);font-weight:800;margin:0;line-height:1.1"
            contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="heading">${t.heading}</h1>
        <p style="font-family:${f.body};font-size:var(--font-size-lg,1.125rem);color:var(--color-text-muted,#666);margin:var(--size-s,0.75rem) auto 0;max-width:40ch"
           contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="body">${t.body}</p>
      </div>`,
  },
};

class FontPairer extends VBElement {
  static observedAttributes = ['heading-font', 'body-font', 'code-font', 'display-font', 'sample', 'show-export', 'show-suggestions', 'preview'];

  #fonts = { heading: '', body: '', code: '', display: '' };
  #preview = 'combined';
  #sampleText = {
    heading: 'The Art of Typography',
    body: 'Good typography is invisible — it lets the content speak without distraction. The best font pairings create harmony between heading impact and body readability.',
    code: 'const theme = { font: "Inter", size: 16 };',
  };

  setup() {
    this.#fonts.heading = this.getAttribute('heading-font') || 'Playfair Display';
    this.#fonts.body = this.getAttribute('body-font') || 'Inter';
    this.#fonts.code = this.getAttribute('code-font') || 'JetBrains Mono';
    this.#fonts.display = this.getAttribute('display-font') || this.#fonts.heading;
    this.#preview = this.getAttribute('preview') || 'combined';
    this.#render();
    this.#loadAllFonts();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === 'heading-font') this.#fonts.heading = newVal || 'Playfair Display';
    if (name === 'body-font') this.#fonts.body = newVal || 'Inter';
    if (name === 'code-font') this.#fonts.code = newVal || 'JetBrains Mono';
    if (name === 'display-font') this.#fonts.display = newVal || this.#fonts.heading;
    if (name === 'preview') this.#preview = newVal || 'combined';
    this.#render();
    this.#loadAllFonts();
  }

  async #loadAllFonts() {
    const loads = Object.values(this.#fonts).filter(Boolean).map(name => {
      const f = FONTS.find(x => x.name === name);
      return loadFont(name, f?.weights || '400;700');
    });
    await Promise.all(loads);
    this.#updateFonts();
  }

  #render() {
    const showExport = this.hasAttribute('show-export');
    const showSuggestions = this.hasAttribute('show-suggestions');

    const gap = 'var(--size-m, 1rem)';
    const smGap = 'var(--size-s, 0.75rem)';
    const xsGap = 'var(--size-xs, 0.5rem)';
    const radius = 'var(--radius-m, 0.5rem)';
    const border = 'var(--color-border, #ddd)';
    const surface = 'var(--color-surface, #fff)';
    const raised = 'var(--color-surface-raised, #f5f5f5)';
    const muted = 'var(--color-text-muted, #666)';
    const smFont = 'var(--font-size-sm, 0.875rem)';
    const xsFont = 'var(--font-size-xs, 0.75rem)';
    const selectStyle = `font:inherit;font-size:${smFont};padding:0.35rem 0.5rem;border:1px solid ${border};border-radius:4px;background:${surface}`;

    // Font role selects — 2×2 grid
    const roles = [
      { key: 'heading', label: 'Heading' },
      { key: 'body',    label: 'Body' },
      { key: 'code',    label: 'Code' },
      { key: 'display', label: 'Display' },
    ];
    const selects = roles.map(r => `
      <label style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:9rem;font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em">
        ${r.label}
        <select class="fp-select" data-role="${r.key}" style="${selectStyle}">
          ${this.#buildOptions(this.#fonts[r.key])}
        </select>
      </label>
    `).join('');

    // Preview mode tabs
    const previewTabs = Object.entries(PREVIEWS).map(([key, { label }]) =>
      `<button type="button" class="fp-tab" data-mode="${key}"
        style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.75rem;border-radius:999px;${key === this.#preview ? `background:var(--color-interactive,oklch(55% .2 260));color:white` : `border:1px solid ${border}`}">${label}</button>`
    ).join('');

    // Preview content
    const fontStyles = {
      heading: `'${this.#fonts.heading}', serif`,
      body: `'${this.#fonts.body}', sans-serif`,
      code: `'${this.#fonts.code}', monospace`,
      display: `'${this.#fonts.display}', serif`,
    };
    const previewHTML = PREVIEWS[this.#preview]?.render(fontStyles, this.#sampleText) || '';

    // Suggestions
    let suggestions = '';
    if (showSuggestions) {
      const pills = SUGGESTED_PAIRINGS.map(([h, b]) =>
        `<button type="button" class="fp-suggestion" data-h="${h}" data-b="${b}"
          style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.25rem 0.5rem;border:1px solid ${border};border-radius:999px;white-space:nowrap">${h} + ${b}</button>`
      ).join('');
      suggestions = `<div style="display:flex;flex-direction:column;gap:${xsGap}">
        <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em">Suggested Pairings</span>
        <div style="display:flex;flex-wrap:wrap;gap:0.375rem">${pills}</div>
      </div>`;
    }

    // CSS code output
    const cssCode = this.#buildCSS();
    const codeSection = `<details class="fp-code-details" style="border:1px solid ${border};border-radius:${radius};overflow:hidden"${showExport ? ' open' : ''}>
      <summary style="padding:${xsGap} ${smGap};cursor:pointer;font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em;background:${raised}">Code</summary>
      <div style="padding:${smGap}">
        <pre style="font-family:var(--font-mono,monospace);font-size:${xsFont};margin:0;white-space:pre-wrap;word-break:break-all" class="fp-css-output">${cssCode}</pre>
        <div style="display:flex;gap:${xsGap};margin-block-start:${smGap}">
          <button type="button" class="fp-copy-css"
            style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.65rem;border:1px solid ${border};border-radius:4px;background:${surface}">Copy CSS</button>
          <button type="button" class="fp-copy-import"
            style="all:unset;cursor:pointer;font-size:${xsFont};padding:0.3rem 0.65rem;border:1px solid ${border};border-radius:4px;background:${surface}">Copy @import</button>
        </div>
      </div>
    </details>`;

    this.innerHTML = `<div style="display:flex;flex-direction:column;gap:${gap}">
      <div style="display:flex;flex-wrap:wrap;gap:${xsGap}">${selects}</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.375rem;align-items:center">
        <span style="font-size:${xsFont};font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.04em;margin-inline-end:${xsGap}">Preview</span>
        ${previewTabs}
      </div>
      <div class="fp-preview" style="padding:var(--size-l,1.5rem);background:${raised};border-radius:${radius};border:1px solid ${border};display:flex;flex-direction:column;gap:${smGap}">
        ${previewHTML}
      </div>
      ${suggestions}
      ${codeSection}
    </div>`;

    this.#wire();
  }

  #buildOptions(selected) {
    const categories = ['serif', 'sans-serif', 'display', 'monospace'];
    return categories.map(cat => {
      const fonts = FONTS.filter(f => f.category === cat);
      const opts = fonts.map(f =>
        `<option value="${f.name}"${f.name === selected ? ' selected' : ''}>${f.name}</option>`
      ).join('');
      return `<optgroup label="${cat}">${opts}</optgroup>`;
    }).join('');
  }

  #buildCSS() {
    const lines = [];
    const roles = { heading: 'serif', body: 'sans-serif', code: 'monospace', display: 'serif' };
    for (const [role, fallback] of Object.entries(roles)) {
      const name = this.#fonts[role];
      if (!name) continue;
      const f = FONTS.find(x => x.name === name);
      lines.push(`--font-${role}: "${name}", ${f?.category || fallback};`);
    }
    return lines.join('\n');
  }

  #buildImports() {
    const seen = new Set();
    const lines = [];
    for (const name of Object.values(this.#fonts)) {
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const f = FONTS.find(x => x.name === name);
      lines.push(`@import url('${googleFontsUrl(name, f?.weights || '400;700')}');`);
    }
    return lines.join('\n');
  }

  #wire() {
    // Font role selects
    this.querySelectorAll('.fp-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        this.#fonts[e.target.dataset.role] = e.target.value;
        this.#loadAllFonts();
        this.#renderPreview();
        this.#updateCode();
        this.#emit();
      });
    });

    // Preview mode tabs
    this.querySelectorAll('.fp-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#preview = btn.dataset.mode;
        this.#render();
        this.#loadAllFonts();
      });
    });

    // Suggestion pills
    this.querySelectorAll('.fp-suggestion').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#fonts.heading = btn.dataset.h;
        this.#fonts.body = btn.dataset.b;
        this.#fonts.display = btn.dataset.h;
        this.#render();
        this.#loadAllFonts();
        this.#emit();
      });
    });

    // Editable text — save changes
    this.querySelectorAll('.fp-editable').forEach(el => {
      el.addEventListener('blur', () => {
        const role = el.dataset.role;
        if (role && el.textContent.trim()) {
          this.#sampleText[role] = el.textContent.trim();
        }
      });
    });

    // Copy CSS
    this.querySelector('.fp-copy-css')?.addEventListener('click', (e) => {
      navigator.clipboard?.writeText(this.#buildCSS());
      this.#copyFeedback(e.target);
    });

    // Copy @import
    this.querySelector('.fp-copy-import')?.addEventListener('click', (e) => {
      navigator.clipboard?.writeText(this.#buildImports());
      this.#copyFeedback(e.target);
    });
  }

  #renderPreview() {
    const container = this.querySelector('.fp-preview');
    if (!container) return;
    const fontStyles = {
      heading: `'${this.#fonts.heading}', serif`,
      body: `'${this.#fonts.body}', sans-serif`,
      code: `'${this.#fonts.code}', monospace`,
      display: `'${this.#fonts.display}', serif`,
    };
    container.innerHTML = PREVIEWS[this.#preview]?.render(fontStyles, this.#sampleText) || '';
    // Re-wire editable listeners
    container.querySelectorAll('.fp-editable').forEach(el => {
      el.addEventListener('blur', () => {
        const role = el.dataset.role;
        if (role && el.textContent.trim()) {
          this.#sampleText[role] = el.textContent.trim();
        }
      });
    });
  }

  #updateFonts() {
    this.#renderPreview();
    this.#updateCode();
  }

  #updateCode() {
    const output = this.querySelector('.fp-css-output');
    if (output) output.textContent = this.#buildCSS();
  }

  #copyFeedback(btn) {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  }

  #emit() {
    this.dispatchEvent(new CustomEvent('font-pairer:change', {
      bubbles: true,
      detail: { ...this.#fonts },
    }));
  }
}

registerComponent('font-pairer', FontPairer);
export { FontPairer };
