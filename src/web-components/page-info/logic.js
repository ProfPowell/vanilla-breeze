import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * page-info: Document provenance disclosure panel
 *
 * Displays a trust bar summary with expandable detail panel showing
 * authorship, history, provenance, and verification information.
 *
 * In static mode, enhances existing light DOM markup with relative
 * time rendering and reading time computation.
 *
 * In auto mode, reads <meta> tags from <head> per the
 * meta-tag contract v1 (admin/specs/meta-tag-contract-v1.md) and
 * renders the full panel from page metadata.
 *
 * @attr {boolean} auto       - Render from <meta> tags instead of light DOM
 * @attr {boolean} og-preview - Show Open Graph social preview card
 *
 * @fires page-info:verified - When trust assessment completes
 *   detail: { status: 'declared', tier: 1 }
 *
 * @example Static markup (CMS-rendered)
 * <page-info>
 *   <details>
 *     <summary>
 *       <span class="page-info-author">
 *         <a href="/team/jane" rel="author">Jane Doe</a>
 *       </span>
 *       <span class="page-info-sep" aria-hidden="true">&middot;</span>
 *       <time datetime="2026-03-15" data-relative>15 March 2026</time>
 *       <span class="page-info-sep" aria-hidden="true">&middot;</span>
 *       <span class="page-info-badge" data-trust="declared">
 *         Human-written, AI-assisted
 *       </span>
 *     </summary>
 *     <div class="page-info-panel">
 *       <!-- sections: authors, history, provenance -->
 *     </div>
 *   </details>
 * </page-info>
 *
 * @example Auto mode
 * <page-info auto></page-info>
 */
class PageInfo extends VBElement {

  setup() {
    if (this.hasAttribute('auto')) {
      this.#renderFromMeta();
    }

    this.#renderRelativeTimes();
    this.#computeReadingTime();
    this.#assessTrust();
  }

  /* ── Relative time rendering ── */

  #renderRelativeTimes() {
    for (const time of this.querySelectorAll('time[data-relative]')) {
      const dt = time.getAttribute('datetime');
      if (!dt) continue;
      const relative = PageInfo.#formatRelative(new Date(dt));
      if (relative) time.textContent = relative;
    }
  }

  static #formatRelative(date) {
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 0) return null;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) !== 1 ? 's' : ''} ago`;
    if (days > 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'just now';
  }

  /* ── Reading time ── */

  #computeReadingTime() {
    const target = this.querySelector('[data-reading-time]');
    if (!target) return;

    const signableEls = document.querySelectorAll('[data-signable]');
    if (!signableEls.length) return;

    let wordCount = 0;
    for (const el of signableEls) {
      const text = el.textContent?.trim() || '';
      wordCount += text.split(/\s+/).filter(Boolean).length;
    }

    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    target.textContent = `~${minutes} min`;
  }

  /* ── Trust assessment ── */

  #assessTrust() {
    /* Crypto verification deferred — always report 'declared' for now */
    const status = 'declared';
    const tier = 1;

    const badge = this.querySelector('.page-info-badge');
    if (badge) {
      badge.setAttribute('data-trust', status);
    }

    this.dispatchEvent(new CustomEvent('page-info:verified', {
      detail: { status, tier },
      bubbles: true
    }));
  }

  /* ── Vocabularies (meta-tag contract v1, §B and §C) ── */

  static #PROVENANCE_LABELS = {
    'human': 'Human written',
    'ai-assisted': 'Human-written, AI-assisted',
    'ai-generated': 'AI-generated',
    'translated': 'Translated',
    'synthesized': 'Synthesized from sources',
    'migrated': 'Migrated content'
  };

  static #REVIEW_LABELS = {
    'unreviewed': 'Unreviewed',
    'fact-checked': 'Fact-checked',
    'editor-reviewed': 'Editor-reviewed'
  };

  static #STATUS_LABELS = {
    'draft': 'Draft',
    'published': 'Published',
    'archived': 'Archived'
  };

  static #provenanceLabel(value) {
    if (!value) return '';
    const tokens = String(value).trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return '';
    const labels = tokens.map((t) => PageInfo.#PROVENANCE_LABELS[t] || t);
    return labels.join(' · ');
  }

  /* ── Auto-render from <meta> tags ── */

  #renderFromMeta() {
    const meta = (name) =>
      document.querySelector(`meta[name="${name}"]`)?.content;
    const prop = (name) =>
      document.querySelector(`meta[property="${name}"]`)?.content;
    const itemprop = (name) =>
      document.querySelector(`meta[itemprop="${name}"]`)?.content;
    const linkHref = (rel) =>
      document.querySelector(`link[rel="${rel}"]`)?.href;

    /* Section A — public-standard fields */
    const author = meta('author');
    const authorUrl = prop('article:author') || linkHref('author');
    const modified = meta('last-modified') || prop('article:modified_time');
    const published = prop('article:published_time');
    const keywords = meta('keywords');
    const license = meta('license');
    const licenseUrl = linkHref('license');
    const version = itemprop('version');

    /* Section B — vb:* namespace */
    const provenance = meta('vb:provenance');
    const review = meta('vb:review');
    const status = meta('vb:status');
    const aiTools = meta('vb:ai-tools');
    const topic = meta('vb:topic');
    const versionUrl = meta('vb:version-url');

    const provenanceLabel = PageInfo.#provenanceLabel(provenance);
    const reviewLabel = PageInfo.#REVIEW_LABELS[review] || review || '';
    const statusLabel = PageInfo.#STATUS_LABELS[status] || status || '';

    const showProvenanceSection = provenance || aiTools || review || license;
    const showHistorySection = modified || published || version;

    /* Build the disclosure panel */
    this.innerHTML = `
      <details>
        <summary>
          ${author ? `
            <span class="page-info-author">
              ${authorUrl
                ? `<a href="${authorUrl}" rel="author">${author}</a>`
                : author
              }
            </span>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          ` : ''}
          ${modified ? `
            <time datetime="${modified}" data-relative>${modified}</time>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          ` : ''}
          ${provenanceLabel ? `
            <span class="page-info-badge"
                  data-provenance="${provenance || ''}"
                  data-trust="declared"
                  aria-label="Content provenance: ${provenanceLabel}">
              ${provenanceLabel}
            </span>
          ` : ''}
          ${status && status !== 'published' ? `
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
            <span class="page-info-badge" data-status="${status}">${statusLabel}</span>
          ` : ''}
        </summary>
        <div class="page-info-panel">
          ${author ? `
            <section>
              <h2 class="page-info-section-heading">Author</h2>
              <p>${authorUrl
                ? `<a href="${authorUrl}" rel="author">${author}</a>`
                : author
              }</p>
            </section>
          ` : ''}
          ${showHistorySection ? `
            <section>
              <h2 class="page-info-section-heading">History</h2>
              <dl>
                ${published ? `<dl-item><dt>Published</dt><dd><time datetime="${published}" data-relative>${published}</time></dd></dl-item>` : ''}
                ${modified ? `<dl-item><dt>Last updated</dt><dd><time datetime="${modified}" data-relative>${modified}</time></dd></dl-item>` : ''}
                ${version ? `<dl-item><dt>Version</dt><dd>${versionUrl ? `<a href="${versionUrl}">${version}</a>` : version}</dd></dl-item>` : ''}
              </dl>
            </section>
          ` : ''}
          ${showProvenanceSection ? `
            <section>
              <h2 class="page-info-section-heading">How this was made</h2>
              <dl>
                ${provenance ? `<dl-item><dt>Authorship</dt><dd>${provenanceLabel}</dd></dl-item>` : ''}
                ${aiTools ? `<dl-item><dt>AI tools used</dt><dd>${aiTools}</dd></dl-item>` : ''}
                ${reviewLabel ? `<dl-item><dt>Review</dt><dd>${reviewLabel}</dd></dl-item>` : ''}
                ${statusLabel ? `<dl-item><dt>Status</dt><dd>${statusLabel}</dd></dl-item>` : ''}
                ${license ? `<dl-item><dt>License</dt><dd>${licenseUrl ? `<a href="${licenseUrl}" rel="license">${license}</a>` : license}</dd></dl-item>` : ''}
              </dl>
            </section>
          ` : ''}
          ${(keywords || topic) ? `
            <section>
              <h2 class="page-info-section-heading">Topic</h2>
              <dl>
                ${topic ? `<dl-item><dt>Subject</dt><dd>${topic}</dd></dl-item>` : ''}
                ${keywords ? `<dl-item><dt>Keywords</dt><dd>${keywords}</dd></dl-item>` : ''}
              </dl>
            </section>
          ` : ''}
        </div>
      </details>
    `;
  }
}

registerComponent('page-info', PageInfo);

export { PageInfo };
