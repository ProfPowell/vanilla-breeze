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
 * In data-auto mode, reads <meta> tags from <head> and renders
 * the full panel from page metadata.
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

  /* ── Auto-render from <meta> tags ── */

  #renderFromMeta() {
    const meta = (name) =>
      document.querySelector(`meta[name="${name}"]`)?.content;
    const prop = (name) =>
      document.querySelector(`meta[property="${name}"]`)?.content;

    const author = meta('author');
    const authorUrl = prop('article:author');
    const modified = meta('last-modified');
    const version = meta('content-version');
    const versionUrl = meta('content-version-url');
    const provenance = meta('content-provenance');
    const aiTools = meta('ai-tools');
    const humanReview = meta('human-review');
    const license = meta('license');
    const licenseUrl = meta('license-url');

    /* Build provenance label from vocabulary */
    const provenanceLabels = {
      'human': 'Human written',
      'human-ai-assisted': 'Human-written, AI-assisted',
      'ai-human-edited': 'AI draft, human edited',
      'ai-human-reviewed': 'AI-generated, human-reviewed',
      'ai-generated': 'AI-generated',
      'synthesized': 'Synthesized from sources',
      'translated': 'Translated',
      'migrated': 'Migrated content'
    };

    const provenanceLabel = provenanceLabels[provenance] || provenance || '';

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
          <section>
            <h2 class="page-info-section-heading">History</h2>
            <dl>
              ${modified ? `<div><dt>Last updated</dt><dd><time datetime="${modified}" data-relative>${modified}</time></dd></div>` : ''}
              ${version ? `<div><dt>Version</dt><dd>${versionUrl ? `<a href="${versionUrl}">${version}</a>` : version}</dd></div>` : ''}
            </dl>
          </section>
          ${provenance ? `
            <section>
              <h2 class="page-info-section-heading">How this was made</h2>
              <dl>
                <div><dt>Authorship</dt><dd>${provenanceLabel}</dd></div>
                ${aiTools ? `<div><dt>AI tools used</dt><dd>${aiTools}</dd></div>` : ''}
                ${humanReview ? `<div><dt>Human review</dt><dd>${humanReview}</dd></div>` : ''}
                ${license ? `<div><dt>License</dt><dd>${licenseUrl ? `<a href="${licenseUrl}" rel="license">${license}</a>` : license}</dd></div>` : ''}
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
