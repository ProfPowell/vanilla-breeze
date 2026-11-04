import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { buildCanonicalDocument, serializeCanonical, canonicalLinkHref } from '../../lib/canonicalize.js';
import {
  collectReadableText, countWords, readingMinutes,
  resolveLang, parseDateValue, absoluteDate, relativeTime
} from '../page-stats/stats-core.js';

/**
 * page-info: Document provenance disclosure panel
 *
 * Displays a trust bar summary with expandable detail panel showing
 * authorship, history, provenance, and verification information.
 *
 * In static mode, enhances existing light DOM markup: localized relative
 * times on time[data-relative] (absolute date kept in `title`), reading
 * time in [data-reading-time], and the trust tier on .page-info-badge.
 *
 * In auto mode, reads <meta> tags from <head> per the meta-tag contract v1
 * (admin/specs/meta-tag-contract-v1.md) and renders the full panel. All
 * metadata is inserted as text (never parsed as HTML); link targets are
 * only used when they resolve to http(s).
 *
 * @attr {boolean} auto               - Render from <meta> tags instead of light DOM
 * @attr {string}  data-concept-base  - Base path for concept links (default "/topics/")
 * @attr {number}  data-heading-level - Heading level for auto-mode section headings (2–6, default 2)
 * @attr {string}  data-label-*       - Override any UI string (see api.json)
 *
 * @fires page-info:verified - Once with the declared tier, then again with the
 *   verification result when the page carries a signature.
 *   detail: { status, tier, reason? }
 */

/* Default UI strings. Every key can be overridden with data-label-{key}. */
const LABELS = {
  author: 'Author',
  history: 'History',
  provenance: 'How this was made',
  topic: 'Topic',
  published: 'Published',
  updated: 'Last updated',
  version: 'Version',
  authorship: 'Authorship',
  'ai-tools': 'AI tools used',
  review: 'Review',
  status: 'Status',
  license: 'License',
  concepts: 'Concepts',
  keywords: 'Keywords',
  'reading-time': '~{n}',
  'tier-declared': 'Self-declared',
  'tier-verified': 'Verified',
  'tier-failed': 'Signature failed',
  'tier-key-unavailable': 'Key unavailable',
  /* Vocabularies (meta-tag contract v1, §B) */
  'provenance-human': 'Human written',
  'provenance-ai-assisted': 'Human-written, AI-assisted',
  'provenance-ai-generated': 'AI-generated',
  'provenance-translated': 'Translated',
  'provenance-synthesized': 'Synthesized from sources',
  'provenance-migrated': 'Migrated content',
  'review-unreviewed': 'Unreviewed',
  'review-fact-checked': 'Fact-checked',
  'review-editor-reviewed': 'Editor-reviewed',
  'status-draft': 'Draft',
  'status-published': 'Published',
  'status-archived': 'Archived'
};

const TIERS = { undeclared: 0, declared: 1, verified: 3, failed: -1, 'key-unavailable': -2 };

/**
 * Tiny element builder: attributes via setAttribute, children appended as
 * nodes or text (strings never become markup).
 * @param {string} tag
 * @param {Record<string, string | null | undefined>} [attrs]
 * @param {...(Node | string | null | undefined | false)} children
 */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null) el.setAttribute(k, v);
  }
  for (const c of children) {
    if (c != null && c !== false) el.append(c);
  }
  return el;
}

/**
 * Return the URL as authored when it resolves to http(s), else null.
 * Rejects javascript:, data:, vbscript: and anything unparseable.
 * @param {string | null | undefined} raw
 */
function safeUrl(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  try {
    const { protocol } = new URL(value, document.baseURI);
    return protocol === 'http:' || protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

class PageInfo extends VBElement {
  /** @type {AbortController | null} */
  #abort = null;

  /* Authored aria-label of a static badge, so the tier suffix is rebuilt
     from it instead of being appended again on every reconnect. */
  static #baseLabels = new WeakMap();

  setup() {
    this.#abort = new AbortController();
    const lang = resolveLang(this);

    if (this.hasAttribute('auto')) {
      this.#renderFromMeta();
    }

    this.#renderTimes(lang);
    this.#computeReadingTime(lang);
    this.#assessTrust();
    /* Async; the badge starts at `declared` and is upgraded to verified /
       failed / key-unavailable when the work completes. Aborted in teardown. */
    this.#verifySignature(this.#abort.signal);
  }

  teardown() {
    this.#abort?.abort();
    this.#abort = null;
  }

  /** @param {string} key */
  #label(key) {
    return this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? key;
  }

  /* ── Relative time rendering ── */

  /** @param {string | undefined} lang */
  #renderTimes(lang) {
    for (const time of this.querySelectorAll('time[data-relative]')) {
      const parsed = parseDateValue(time.getAttribute('datetime'));
      if (!parsed) continue;
      const absolute = absoluteDate(parsed, lang);
      if (!time.hasAttribute('title') || time.hasAttribute('data-title-generated')) {
        time.setAttribute('title', absolute);
        time.setAttribute('data-title-generated', '');
      }
      time.textContent = relativeTime(parsed, lang);
    }
  }

  /* ── Reading time ── */

  /** @param {string | undefined} lang */
  #computeReadingTime(lang) {
    const target = this.querySelector('[data-reading-time]');
    if (!target) return;

    const roots = document.querySelectorAll('[data-signable]');
    if (!roots.length) return;

    const counts = countWords(collectReadableText(roots), lang);
    const minutes = readingMinutes(counts);
    const n = new Intl.NumberFormat(lang, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(minutes);
    const tpl = this.#label('reading-time');
    target.textContent = tpl.includes('{n}') ? tpl.replaceAll('{n}', n) : `${tpl} ${n}`;
  }

  /* ── Trust assessment ── */

  #badge() {
    return this.querySelector('.page-info-badge:not([data-status])');
  }

  #assessTrust() {
    /* Initial state — `declared` if any provenance metadata is present,
       `undeclared` otherwise. #verifySignature upgrades the badge later. */
    const hasMetadata = !!document.querySelector(
      'meta[name="vb:provenance"], meta[name="author"]'
    );
    this.#setTrust(hasMetadata ? 'declared' : 'undeclared');
  }

  /* ── Cryptographic signature verification (Stage 4) ── */

  /** @param {AbortSignal} signal */
  async #verifySignature(signal) {
    const signature = /** @type {HTMLMetaElement | null} */ (document.querySelector('meta[name="vb:signature"]'))?.content;
    if (!signature) return; /* nothing to verify; stay at `declared` */

    const algorithm = /** @type {HTMLMetaElement | null} */ (document.querySelector('meta[name="vb:signature-algorithm"]'))?.content;
    if (algorithm && algorithm !== 'ECDSA-P256-SHA256') {
      this.#setTrust('failed', { reason: `unsupported-algorithm:${algorithm}` });
      return;
    }

    const keyHref = document.querySelector('link[rel~="author-key" i]')?.getAttribute('href');
    if (!keyHref) {
      this.#setTrust('failed', { reason: 'missing-author-key' });
      return;
    }

    let publicKey;
    try {
      const url = new URL(keyHref, document.baseURI);
      const res = await fetch(url, { credentials: 'omit', signal });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const jwk = await res.json();
      publicKey = await crypto.subtle.importKey(
        'jwk',
        { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, use: jwk.use || 'sig', key_ops: ['verify'] },
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );
    } catch (err) {
      if (signal.aborted) return;
      this.#setTrust('key-unavailable', { reason: err.message });
      return;
    }
    if (signal.aborted) return;

    let canonical;
    try {
      /* Same `url` input as scripts/sign-pages.js — the raw canonical href. */
      canonical = serializeCanonical(buildCanonicalDocument(document, { url: canonicalLinkHref(document) }));
    } catch (err) {
      this.#setTrust('failed', { reason: `canonicalize:${err.message}` });
      return;
    }

    let isValid;
    try {
      const data = new TextEncoder().encode(canonical);
      const sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
      isValid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, sig, data);
    } catch (err) {
      if (signal.aborted) return;
      this.#setTrust('failed', { reason: `verify:${err.message}` });
      return;
    }
    if (signal.aborted) return;

    this.#setTrust(isValid ? 'verified' : 'failed', { reason: isValid ? 'ok' : 'mismatch' });
  }

  /**
   * @param {keyof typeof TIERS} status
   * @param {{ reason?: string }} [detail]
   */
  #setTrust(status, detail = {}) {
    const tier = TIERS[status] ?? 0;
    const badge = this.#badge();
    if (badge) {
      badge.setAttribute('data-trust', status);
      const text = status === 'undeclared' ? '' : this.#label(`tier-${status}`);

      /* Visible tier text — the tier is never conveyed by colour alone. */
      let tierEl = badge.querySelector(':scope > .page-info-tier');
      if (text) {
        if (!tierEl) {
          tierEl = h('span', { class: 'page-info-tier' });
          badge.append(tierEl);
        }
        tierEl.setAttribute('data-tier', status);
        tierEl.textContent = text;
      } else {
        tierEl?.remove();
      }

      /* Authored aria-label (static markup): rebuild from the stored base. */
      if (!PageInfo.#baseLabels.has(badge)) {
        PageInfo.#baseLabels.set(badge, badge.getAttribute('aria-label'));
      }
      const base = PageInfo.#baseLabels.get(badge);
      if (base) badge.setAttribute('aria-label', text ? `${base} — ${text}` : base);
    }

    this.dispatchEvent(new CustomEvent('page-info:verified', {
      detail: { status, tier, ...detail },
      bubbles: true
    }));
  }

  /* ── Auto-render from <meta> tags ── */

  /** @param {string | undefined} value */
  #provenanceLabel(value) {
    if (!value) return '';
    return String(value).trim().split(/\s+/).filter(Boolean)
      .map((t) => this.getAttribute(`data-label-provenance-${t}`) ?? LABELS[`provenance-${t}`] ?? t)
      .join(' · ');
  }

  /**
   * @param {'review' | 'status'} kind
   * @param {string | undefined} value
   */
  #vocabLabel(kind, value) {
    if (!value) return '';
    const key = `${kind}-${value.trim()}`;
    return this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? value.trim();
  }

  #renderFromMeta() {
    const meta = (name) =>
      /** @type {HTMLMetaElement | null} */ (document.querySelector(`meta[name="${name}"]`))?.content?.trim() || '';
    const prop = (name) =>
      /** @type {HTMLMetaElement | null} */ (document.querySelector(`meta[property="${name}"]`))?.content?.trim() || '';
    const itemprop = (name) =>
      /** @type {HTMLMetaElement | null} */ (document.querySelector(`meta[itemprop="${name}"]`))?.content?.trim() || '';
    const linkHref = (rel) =>
      document.querySelector(`link[rel~="${rel}" i]`)?.getAttribute('href') || '';

    /* Section A — public-standard fields */
    const author = meta('author');
    const authorUrl = safeUrl(prop('article:author') || linkHref('author'));
    const modified = meta('last-modified') || prop('article:modified_time');
    const published = prop('article:published_time');
    const keywords = meta('keywords');
    const license = meta('license');
    const licenseUrl = safeUrl(linkHref('license'));
    const version = itemprop('version');

    /* Section B — vb:* namespace */
    const provenance = meta('vb:provenance');
    const review = meta('vb:review');
    const status = meta('vb:status');
    const aiTools = meta('vb:ai-tools');
    const versionUrl = safeUrl(meta('vb:version-url'));

    /* meta-tag-contract v1.1: repeated meta name="concept" (SKOS @ids). */
    const concepts = [...document.querySelectorAll('meta[name="concept"]')]
      .map((m) => m.getAttribute('content')?.trim() || '')
      .filter(Boolean);
    const conceptBase = safeUrl(this.dataset.conceptBase ?? '/topics/');

    const provenanceLabel = this.#provenanceLabel(provenance);
    const reviewLabel = this.#vocabLabel('review', review);
    const statusLabel = this.#vocabLabel('status', status);

    const level = Math.min(6, Math.max(2, parseInt(this.dataset.headingLevel || '', 10) || 2));
    const heading = (key) => h(`h${level}`, { class: 'page-info-section-heading' }, this.#label(key));
    const sep = () => h('span', { class: 'page-info-sep', 'aria-hidden': 'true' }, '·');
    const time = (value) => h('time', { datetime: value, 'data-relative': '' }, value);
    const link = (href, text, rel) => (href ? h('a', { href, rel }, text) : text);
    const item = (key, ...value) => h('dl-item', {}, h('dt', {}, this.#label(key)), h('dd', {}, ...value));

    /* Summary (trust bar). The author is plain text here — interactive
       content inside <summary> would fight the disclosure toggle; the
       link lives in the panel's Author section. */
    const summaryParts = [];
    const push = (node) => {
      if (summaryParts.length) summaryParts.push(sep());
      summaryParts.push(node);
    };
    if (author) push(h('span', { class: 'page-info-author' }, author));
    if (modified) push(time(modified));
    if (provenanceLabel) {
      push(h('span', {
        class: 'page-info-badge',
        'data-provenance': provenance,
        'data-trust': 'declared'
      }, provenanceLabel));
    }
    if (status && status !== 'published') {
      push(h('span', { class: 'page-info-badge', 'data-status': status }, statusLabel));
    }

    const sections = [];
    if (author) {
      sections.push(h('section', {}, heading('author'), h('p', {}, link(authorUrl, author, 'author'))));
    }
    if (modified || published || version) {
      sections.push(h('section', {}, heading('history'), h('dl', {},
        published && item('published', time(published)),
        modified && item('updated', time(modified)),
        version && item('version', link(versionUrl, version))
      )));
    }
    if (provenance || aiTools || review || license || statusLabel) {
      sections.push(h('section', {}, heading('provenance'), h('dl', {},
        provenance && item('authorship', provenanceLabel),
        aiTools && item('ai-tools', aiTools),
        reviewLabel && item('review', reviewLabel),
        statusLabel && item('status', statusLabel),
        license && item('license', link(licenseUrl, license, 'license'))
      )));
    }
    if (keywords || concepts.length) {
      const conceptNodes = [];
      concepts.forEach((id, i) => {
        if (i) conceptNodes.push(', ');
        conceptNodes.push(conceptBase
          ? h('a', { href: `${conceptBase}${encodeURIComponent(id)}/`, rel: 'tag', 'data-concept': id }, id)
          : id);
      });
      sections.push(h('section', {}, heading('topic'), h('dl', {},
        concepts.length > 0 && item('concepts', ...conceptNodes),
        keywords && item('keywords', keywords)
      )));
    }

    this.replaceChildren(h('details', {},
      h('summary', {}, ...summaryParts),
      h('div', { class: 'page-info-panel' }, ...sections)
    ));
  }
}

registerComponent('page-info', PageInfo);

export { PageInfo };
