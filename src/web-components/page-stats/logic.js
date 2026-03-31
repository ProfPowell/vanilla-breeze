/**
 * page-stats: Lightweight reading statistics
 *
 * Displays word count, reading time, and last-modified date for a target
 * content element. SSR-adoptable: if existing <dl> markup is found on
 * connect, the component adopts it without re-rendering.
 *
 * @attr {string} data-for  - ID of the target content element to analyze
 * @attr {number} data-wpm  - Words per minute for reading time (default: 238)
 * @attr {string} data-show - Comma-separated stats to display:
 *   reading-time, word-count, last-modified (default: 'reading-time')
 *
 * @example SSR-adopted (pre-rendered by SSG)
 * <page-stats>
 *   <dl class="page-stats-list">
 *     <dl-item>
 *       <dt class="sr-only">Reading time</dt>
 *       <dd><time datetime="PT5M">5 min read</time></dd>
 *     </dl-item>
 *   </dl>
 * </page-stats>
 *
 * @example CSR (auto-computed from target)
 * <page-stats data-for="article-content" data-show="reading-time,word-count"></page-stats>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class PageStats extends VBElement {

  setup() {
    /* SSR adoption: if a <dl> already exists, keep it */
    if (this.querySelector('dl')) return;

    const targetId = this.dataset.for;
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    const wpm = parseInt(this.dataset.wpm, 10) || 238;
    const show = (this.dataset.show || 'reading-time')
      .split(',')
      .map(s => s.trim());

    const text = target.textContent?.trim() || '';
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.max(1, Math.ceil(wordCount / wpm));

    const dl = document.createElement('dl');
    dl.className = 'page-stats-list';

    if (show.includes('reading-time')) {
      dl.appendChild(this.#statItem(
        'Reading time',
        `<time datetime="PT${minutes}M">${minutes} min read</time>`
      ));
    }

    if (show.includes('word-count')) {
      dl.appendChild(this.#statItem(
        'Word count',
        `${wordCount.toLocaleString()} words`
      ));
    }

    if (show.includes('last-modified')) {
      const modified = this.#getLastModified();
      if (modified) {
        const iso = modified.toISOString().split('T')[0];
        const relative = PageStats.#formatRelative(modified);
        dl.appendChild(this.#statItem(
          'Last updated',
          `<time datetime="${iso}" data-relative>${relative}</time>`
        ));
      }
    }

    this.appendChild(dl);
  }

  #statItem(label, valueHTML) {
    const item = document.createElement('dl-item');
    const dt = document.createElement('dt');
    dt.className = 'sr-only';
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.innerHTML = valueHTML;
    item.appendChild(dt);
    item.appendChild(dd);
    return item;
  }

  #getLastModified() {
    const meta = document.querySelector('meta[name="last-modified"]');
    if (meta?.content) {
      const d = new Date(meta.content);
      if (!isNaN(d)) return d;
    }
    const docMod = new Date(document.lastModified);
    if (!isNaN(docMod)) return docMod;
    return null;
  }

  static #formatRelative(date) {
    const diff = Date.now() - date.getTime();
    if (diff < 0) return date.toLocaleDateString();

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
}

registerComponent('page-stats', PageStats);

export { PageStats };
