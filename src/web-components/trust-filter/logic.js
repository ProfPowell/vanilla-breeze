import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * trust-filter: Provenance lens — filter pages by vb:provenance, vb:review,
 * vb:status, and whether a signature is declared.
 *
 * Reads pages.json (data-lens-src) and renders checkbox groups across the
 * four dimensions plus a results list. Multiple values combine with OR
 * within a dimension and AND across dimensions.
 *
 * The "Has signature" dimension reflects pages.json `signed`, which the
 * build sets when a page carries a vb:signature meta. It is NOT a verified
 * trust claim — verification happens client-side in <page-info>.
 *
 * Only the count is a live region (<output>); the list renders beside it,
 * so a change announces "N of M pages" rather than every title. Nothing is
 * announced and no event fires on the initial render.
 *
 * @attr {string} data-lens-src   URL to pages.json (or compatible)
 * @attr {string} src             Alias for data-lens-src
 * @attr {string} data-label-*    Text overrides (see DEFAULT_LABELS keys)
 *
 * @fires trust-filter:change   detail: { selected, count } — reader changes or clears a filter
 *
 * @example
 *   <trust-filter data-lens-src="/pages.json"></trust-filter>
 */

const DEFAULT_LABELS = {
  form: 'Filter pages',
  provenance: 'How was it made',
  review: 'Review',
  status: 'Status',
  signed: 'Has signature',
  yes: 'Yes',
  no: 'No',
  clear: 'Clear all',
  page: '{count} of {total} page',
  pages: '{count} of {total} pages',
  'has-signature': 'has signature',
  error: 'Pages could not be loaded.',
  'no-source': 'No data source set.',
};

const DIMENSIONS = /** @type {const} */ (['provenance', 'review', 'status', 'signed']);

/**
 * Pure: return the href if it is http(s) or relative, else null.
 * Mirrors author-index's safeHref.
 * @param {unknown} raw
 * @returns {string | null} The safe href, or null.
 */
export function safeHref(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  try {
    const { protocol } = new URL(s, 'https://trust-filter.invalid/');
    return protocol === 'http:' || protocol === 'https:' ? s : null;
  } catch {
    return null;
  }
}

/** Pure: space-separated provenance tokens. @param {unknown} v */
function tokens(v) {
  return String(v ?? '').split(/\s+/).filter(Boolean);
}

/**
 * Pure: does a page match the selection? OR within a dimension, AND across.
 * @param {any} p
 * @param {Record<string, Set<string>>} selected
 * @returns {boolean} True when the page passes every active dimension.
 */
export function matchesSelection(p, selected) {
  if (selected.provenance?.size) {
    if (!tokens(p.provenance).some((t) => selected.provenance.has(t))) return false;
  }
  if (selected.review?.size && !selected.review.has(p.review)) return false;
  if (selected.status?.size && !selected.status.has(p.status)) return false;
  /* Both "yes" and "no" (or neither) means no constraint. */
  if (selected.signed?.size === 1) {
    const want = selected.signed.has('yes');
    if (!!p.signed !== want) return false;
  }
  return true;
}

class TrustFilter extends VBElement {
  /** @type {any[]} */
  #pages = [];
  /** @type {Record<string, Set<string>>} */
  #selected = emptySelection();
  /** Bumped per setup/teardown so stale fetches never render. */
  #gen = 0;

  setup() {
    const gen = ++this.#gen;
    /* Controls are rebuilt unchecked, so the selection must start empty too. */
    this.#selected = emptySelection();
    const src = this.getAttribute('data-lens-src') || this.getAttribute('src');
    if (!src) {
      this.#renderError(this.#label('no-source'));
      return;
    }
    this.#loadFromSrc(src, gen);
  }

  teardown() {
    this.#gen++;
  }

  async #loadFromSrc(src, gen) {
    let payload;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`status ${res.status}`);
      payload = await res.json();
    } catch (err) {
      if (gen !== this.#gen) return;
      console.warn(`[trust-filter] could not load ${src}:`, err);
      this.#renderError(this.#label('error'));
      return;
    }
    if (gen !== this.#gen) return;
    const pages = Array.isArray(payload) ? payload : payload?.pages;
    this.#pages = Array.isArray(pages) ? pages.filter((p) => p && typeof p === 'object') : [];
    this.#renderShell();
    this.#renderResults();
  }

  #renderShell() {
    const values = {
      provenance: this.#unique('provenance'),
      review: this.#unique('review'),
      status: this.#unique('status'),
      signed: ['yes', 'no'],
    };

    const form = document.createElement('form');
    form.setAttribute('data-trust-filter-controls', '');
    form.setAttribute('aria-label', this.#label('form'));

    for (const dim of DIMENSIONS) {
      if (values[dim].length === 0) continue;
      const fieldset = document.createElement('fieldset');
      fieldset.dataset.dim = dim;
      const legend = document.createElement('legend');
      legend.textContent = this.#label(dim);
      fieldset.append(legend);
      for (const v of values[dim]) {
        /* Input nested in its label: no ids, so no cross-instance collisions. */
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.dim = dim;
        input.value = v;
        const span = document.createElement('span');
        span.textContent = dim === 'signed' ? this.#label(v) : humanize(v);
        label.append(input, ' ', span);
        fieldset.append(label);
      }
      form.append(fieldset);
    }

    const reset = document.createElement('button');
    reset.type = 'reset';
    reset.className = 'ghost';
    reset.textContent = this.#label('clear');
    form.append(reset);

    const count = document.createElement('output');
    count.setAttribute('data-trust-filter-count', '');
    count.setAttribute('aria-live', 'polite');

    const list = document.createElement('ul');
    list.setAttribute('data-trust-filter-results', '');

    this.replaceChildren(form, count, list);

    form.addEventListener('change', (e) => {
      const target = /** @type {HTMLInputElement | null} */ (e.target);
      if (!target?.matches('input[type="checkbox"]')) return;
      const set = this.#selected[target.dataset.dim || ''];
      if (!set) return;
      if (target.checked) set.add(target.value);
      else set.delete(target.value);
      this.#renderResults();
      this.#emitChange();
    });

    form.addEventListener('reset', () => {
      /* Selection is the source of truth, so the results can update now;
         the native reset unchecks the boxes right after this handler. */
      this.#selected = emptySelection();
      this.#renderResults();
      this.#emitChange();
    });
  }

  #unique(field) {
    const out = new Set();
    for (const p of this.#pages) {
      const v = p[field];
      if (!v || typeof v !== 'string') continue;
      /* provenance is space-composable */
      if (field === 'provenance') for (const t of tokens(v)) out.add(t);
      else out.add(v);
    }
    return [...out].sort();
  }

  #renderResults() {
    const count = this.querySelector('[data-trust-filter-count]');
    const list = /** @type {HTMLUListElement | null} */ (this.querySelector('[data-trust-filter-results]'));
    if (!count || !list) return;
    const matched = this.#pages.filter((p) => matchesSelection(p, this.#selected));

    const locale = this.#locale();
    const total = this.#pages.length;
    const fmt = new Intl.NumberFormat(locale);
    const key = new Intl.PluralRules(locale).select(total) === 'one' ? 'page' : 'pages';
    count.textContent = this.#label(key)
      .replaceAll('{count}', fmt.format(matched.length))
      .replaceAll('{total}', fmt.format(total));

    const items = matched.map((p) => {
      const li = document.createElement('li');
      const text = String(p.title || p.url || '');
      const href = safeHref(p.url);
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        li.append(a);
      } else {
        li.append(text);
      }

      const labels = [];
      if (typeof p.provenance === 'string' && p.provenance) {
        const chip = document.createElement('span');
        chip.className = 'trust-filter-prov';
        chip.dataset.provenance = p.provenance;
        chip.textContent = p.provenance;
        labels.push(chip);
      }
      if (p.review && p.review !== 'unreviewed') labels.push(String(p.review));
      if (p.status && p.status !== 'published') labels.push(String(p.status));
      if (p.signed) {
        const sig = document.createElement('span');
        sig.className = 'trust-filter-signature';
        sig.textContent = this.#label('has-signature');
        labels.push(sig);
      }
      if (labels.length) {
        const small = document.createElement('small');
        labels.forEach((l, i) => { if (i) small.append(' · '); small.append(l); });
        li.append(small);
      }
      return li;
    });
    list.replaceChildren(...items);
    list.hidden = items.length === 0;
  }

  #emitChange() {
    const selected = {};
    for (const [k, v] of Object.entries(this.#selected)) selected[k] = [...v];
    const count = this.#pages.filter((p) => matchesSelection(p, this.#selected)).length;
    this.dispatchEvent(new CustomEvent('trust-filter:change', {
      detail: { selected, count },
      bubbles: true,
    }));
  }

  #renderError(message) {
    const p = document.createElement('p');
    p.setAttribute('data-trust-filter-error', '');
    p.textContent = message;
    this.replaceChildren(p);
  }

  #label(key) {
    return this.getAttribute(`data-label-${key}`) || DEFAULT_LABELS[key];
  }

  #locale() {
    const lang = this.closest('[lang]')?.getAttribute('lang') || undefined;
    try {
      return Intl.getCanonicalLocales(lang)[0];
    } catch {
      return undefined;
    }
  }
}

function emptySelection() {
  return Object.fromEntries(DIMENSIONS.map((d) => [d, new Set()]));
}

/** Display form of a data token: hyphens become spaces (case left to CSS). */
function humanize(s) {
  return String(s).replace(/-/g, ' ');
}

registerComponent('trust-filter', TrustFilter);

export { TrustFilter };
