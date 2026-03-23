import { registerComponent } from '../../lib/bundle-registry.js';

/**
 * page-meta: Document metadata display with JSON-LD injection
 *
 * Displays a styled definition list of document metadata (author, dates,
 * version, keywords, trust) and emits Schema.org JSON-LD structured data
 * from the visible content.
 *
 * @example Basic usage
 * <page-meta>
 *   <dl>
 *     <dt>Author</dt>
 *     <dd><address><a href="/team/tpowell" rel="author">T. Powell</a></address></dd>
 *     <dt>Published</dt>
 *     <dd><time datetime="2026-01-15">January 15, 2026</time></dd>
 *     <dt>Updated</dt>
 *     <dd><time datetime="2026-02-20">February 20, 2026</time></dd>
 *     <dt>Version</dt>
 *     <dd>2.1.0</dd>
 *   </dl>
 * </page-meta>
 *
 * @example Compact variant
 * <page-meta class="compact">
 *   <dl>
 *     <dt>Author</dt><dd>T. Powell</dd>
 *     <dt>Updated</dt><dd><time datetime="2026-02-20">Feb 20, 2026</time></dd>
 *   </dl>
 * </page-meta>
 */
class PageMeta extends HTMLElement {
  connectedCallback() {
    this.#injectStructuredData();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
  }

  #injectStructuredData() {
    /* Don't inject twice */
    if (this.querySelector('script[type="application/ld+json"]')) return;

    const data = this.#extractMetadata();
    if (!data.author && !data.datePublished) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      ...data
    });
    this.append(script);
  }

  #extractMetadata() {
    const meta = {};
    const dts = this.querySelectorAll('dt');

    for (const dt of dts) {
      const dd = dt.nextElementSibling;
      if (!dd || dd.tagName !== 'DD') continue;

      const key = dt.textContent.trim().toLowerCase();
      switch (key) {
        case 'author': {
          const link = dd.querySelector('a');
          meta.author = {
            '@type': 'Person',
            name: dd.textContent.trim(),
            ...(link?.href ? { url: link.href } : {})
          };
          break;
        }
        case 'published':
          meta.datePublished = dd.querySelector('time')?.dateTime;
          break;
        case 'updated':
          meta.dateModified = dd.querySelector('time')?.dateTime;
          break;
        case 'version':
          meta.version = dd.textContent.trim();
          break;
        case 'keywords':
          meta.keywords = [...dd.querySelectorAll('li')]
            .map(li => li.textContent.trim())
            .join(', ');
          break;
        case 'trust': {
          const trust = dd.dataset.trust || dd.textContent.trim();
          meta.creditText = trust;
          break;
        }
      }
    }

    return meta;
  }
}

registerComponent('page-meta', PageMeta);

export { PageMeta };
