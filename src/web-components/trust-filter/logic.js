import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * trust-filter: Provenance lens — filter pages by vb:provenance, vb:review,
 * vb:status, and signed status.
 *
 * Reads pages.json (data-lens-src) and renders interactive checkbox chips
 * across the four dimensions plus a results list. Multiple chips combine
 * with OR within a dimension and AND across dimensions.
 *
 * @attr {string} data-lens-src   URL to pages.json (or compatible)
 * @attr {string} src             Alias for data-lens-src
 *
 * @fires trust-filter:change   detail: { selected, count }
 *
 * @example
 *   <trust-filter data-lens-src="/pages.json"></trust-filter>
 */
class TrustFilter extends VBElement {
  /** @type {Array} */
  #pages = [];
  /** @type {{ provenance: Set<string>, review: Set<string>, status: Set<string>, signed: Set<string> }} */
  #selected = {
    provenance: new Set(),
    review: new Set(),
    status: new Set(),
    signed: new Set()
  };

  setup() {
    const src = this.getAttribute('data-lens-src') || this.getAttribute('src');
    if (!src) {
      this.#renderError('No data source — set data-lens-src or src to a pages.json URL.');
      return;
    }
    this.#loadFromSrc(src).catch(() => { /* error rendered by loader */ });
  }

  async #loadFromSrc(src) {
    let payload;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`status ${res.status}`);
      payload = await res.json();
    } catch (err) {
      this.#renderError(`Could not load ${src}: ${err.message}`);
      return;
    }
    this.#pages = Array.isArray(payload) ? payload : (payload.pages || []);
    this.#renderShell();
    this.#renderResults();
  }

  #renderShell() {
    const dims = [
      { key: 'provenance', label: 'How was it made', values: this.#unique('provenance') },
      { key: 'review', label: 'Review', values: this.#unique('review') },
      { key: 'status', label: 'Status', values: this.#unique('status') },
      { key: 'signed', label: 'Signed', values: ['yes', 'no'] }
    ];

    const html = ['<form data-trust-filter-controls aria-label="Filter pages">'];
    for (const dim of dims) {
      if (dim.values.length === 0) continue;
      html.push(`<fieldset data-dim="${dim.key}"><legend>${escapeHtml(dim.label)}</legend>`);
      for (const v of dim.values) {
        const id = `tf-${dim.key}-${slugify(v)}`;
        html.push(`<label for="${id}"><input type="checkbox" id="${id}" data-dim="${escapeAttr(dim.key)}" value="${escapeAttr(v)}"> <span>${escapeHtml(humanize(v))}</span></label>`);
      }
      html.push(`</fieldset>`);
    }
    html.push(`<button type="reset" class="ghost">Clear all</button>`);
    html.push('</form>');
    html.push('<output data-trust-filter-results aria-live="polite"></output>');
    this.innerHTML = html.join('\n');

    const form = /** @type {HTMLFormElement} */ (this.querySelector('form'));
    form.addEventListener('change', (e) => {
      const target = /** @type {HTMLInputElement | null} */ (e.target);
      if (target && target.matches('input[type="checkbox"]')) {
        const dim = target.getAttribute('data-dim');
        const val = target.value;
        const set = dim ? this.#selected[dim] : null;
        if (!set) return;
        if (target.checked) set.add(val);
        else set.delete(val);
        this.#renderResults();
      }
    });

    form.addEventListener('reset', () => {
      for (const set of Object.values(this.#selected)) set.clear();
      /* Defer until reset clears native checked state */
      setTimeout(() => this.#renderResults(), 0);
    });
  }

  #unique(field) {
    const out = new Set();
    for (const p of this.#pages) {
      const v = p[field];
      if (!v) continue;
      /* provenance is space-composable */
      if (field === 'provenance') {
        for (const tok of String(v).split(/\s+/).filter(Boolean)) out.add(tok);
      } else {
        out.add(v);
      }
    }
    return [...out].sort();
  }

  #matches(p) {
    if (this.#selected.provenance.size) {
      const tokens = (p.provenance || '').split(/\s+/).filter(Boolean);
      if (!tokens.some((t) => this.#selected.provenance.has(t))) return false;
    }
    if (this.#selected.review.size && !this.#selected.review.has(p.review)) return false;
    if (this.#selected.status.size && !this.#selected.status.has(p.status)) return false;
    if (this.#selected.signed.size) {
      const want = this.#selected.signed;
      const isSigned = !!p.signed;
      if (want.has('yes') && !isSigned) return false;
      if (want.has('no') && isSigned) return false;
      if (want.has('yes') && want.has('no')) { /* both — no filter */ }
    }
    return true;
  }

  #renderResults() {
    const out = this.querySelector('[data-trust-filter-results]');
    if (!out) return;
    const matched = this.#pages.filter((p) => this.#matches(p));

    const parts = [];
    parts.push(`<p class="trust-filter-count">${matched.length} of ${this.#pages.length} pages</p>`);
    if (matched.length) {
      parts.push('<ul class="trust-filter-list">');
      for (const p of matched) {
        const labels = [
          p.provenance ? `<span class="trust-filter-prov" data-provenance="${escapeAttr(p.provenance)}">${escapeHtml(p.provenance)}</span>` : '',
          p.review && p.review !== 'unreviewed' ? `<span>${escapeHtml(p.review)}</span>` : '',
          p.status && p.status !== 'published' ? `<span>${escapeHtml(p.status)}</span>` : '',
          p.signed ? `<span class="trust-filter-signed">signed</span>` : ''
        ].filter(Boolean).join(' · ');
        parts.push(`<li><a href="${escapeAttr(p.url)}">${escapeHtml(p.title || p.url)}</a>${labels ? `<small>${labels}</small>` : ''}</li>`);
      }
      parts.push('</ul>');
    }
    out.innerHTML = parts.join('\n');

    const selectedFlat = {};
    for (const [k, v] of Object.entries(this.#selected)) selectedFlat[k] = [...v];

    this.dispatchEvent(new CustomEvent('trust-filter:change', {
      detail: { selected: selectedFlat, count: matched.length },
      bubbles: true
    }));
  }

  #renderError(message) {
    const p = document.createElement('p');
    p.setAttribute('data-trust-filter-error', '');
    p.textContent = message;
    this.innerHTML = '';
    this.append(p);
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function humanize(s) {
  return String(s).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

registerComponent('trust-filter', TrustFilter);

export { TrustFilter };
