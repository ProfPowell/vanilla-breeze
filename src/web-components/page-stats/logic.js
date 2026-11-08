/**
 * page-stats: Lightweight reading statistics
 *
 * Displays word count, reading time, and last-modified date for a target
 * content element. SSR-adoptable: if author-rendered <dl> markup is found
 * on connect, the component adopts it without re-rendering. The <dl> the
 * component renders itself carries `data-generated`, so it is replaced
 * (not adopted) when a config attribute changes or the element reconnects.
 *
 * Counting rules live in ./stats-core.js (shared with <page-info>):
 * Intl.Segmenter word segmentation, CJK timed by characters per minute,
 * script/style/template/[hidden]/[aria-hidden]/[inert]/[data-stats-ignore]
 * skipped; code blocks and closed <details> content counted.
 *
 * @attr {string} data-for  - ID of the target content element to analyze
 * @attr {number} data-wpm  - Words per minute (default: 238, READING_WPM)
 * @attr {string} data-show - Comma-separated list of stats:
 *   reading-time, word-count, last-modified (default: 'reading-time')
 * @attr {string} data-label-reading-time  - dt label (default "Reading time")
 * @attr {string} data-label-word-count    - dt label (default "Word count")
 * @attr {string} data-label-last-modified - dt label (default "Last updated")
 * @attr {string} data-label-min-read      - reading-time template, {n} = localized minutes (default "{n} read")
 * @attr {string} data-label-words         - word-count template, {n} = localized count (default "{n} words");
 *   data-label-words-one / -two / -few / -many / -zero override per Intl.PluralRules category
 *
 * @example SSR-adopted (pre-rendered by SSG)
 * <page-stats>
 *   <dl class="page-stats-list">
 *     <dl-item>
 *       <dt class="visually-hidden">Reading time</dt>
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
import {
  READING_WPM, collectReadableText, countWords, readingMinutes,
  resolveLang, parseDateValue, absoluteDate, relativeTime
} from './stats-core.js';

const SHOW_VALUES = ['reading-time', 'word-count', 'last-modified'];

class PageStats extends VBElement {
  static observedAttributes = [
    'data-for', 'data-wpm', 'data-show',
    'data-label-reading-time', 'data-label-word-count', 'data-label-last-modified',
    'data-label-min-read', 'data-label-words'
  ];

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    this._reinit();
  }

  setup() {
    /* SSR adoption: an author-rendered <dl> is kept as-is. Our own output
       (data-generated) is dropped and recomputed. */
    for (const dl of this.querySelectorAll(':scope > dl[data-generated]')) dl.remove();
    if (this.querySelector(':scope > dl')) return;

    const targetId = this.dataset.for;
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    const lang = resolveLang(this);
    const wpm = parseInt(this.dataset.wpm || '', 10) || READING_WPM;
    const show = (this.dataset.show || 'reading-time')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => SHOW_VALUES.includes(s));

    const counts = countWords(collectReadableText([target]), resolveLang(target) ?? lang);
    const minutes = readingMinutes(counts, wpm);

    const dl = document.createElement('dl');
    dl.className = 'page-stats-list';
    dl.dataset.generated = '';

    if (show.includes('reading-time')) {
      const time = document.createElement('time');
      time.setAttribute('datetime', `PT${minutes}M`);
      const n = new Intl.NumberFormat(lang, { style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(minutes);
      const fallback = (lang ?? 'en').toLowerCase().startsWith('en') ? '{n} read' : '{n}';
      time.textContent = this.#template('data-label-min-read', fallback, n);
      dl.append(this.#statItem(this.dataset.labelReadingTime || 'Reading time', time));
    }

    if (show.includes('word-count')) {
      const count = counts.words;
      const category = new Intl.PluralRules(lang).select(count);
      const attr = this.hasAttribute(`data-label-words-${category}`) ? `data-label-words-${category}` : 'data-label-words';
      const fallback = category === 'one' ? '{n} word' : '{n} words';
      const text = this.#template(attr, fallback, new Intl.NumberFormat(lang).format(count));
      dl.append(this.#statItem(this.dataset.labelWordCount || 'Word count', text));
    }

    if (show.includes('last-modified')) {
      const parsed = this.#getLastModified();
      if (parsed) {
        const time = document.createElement('time');
        time.setAttribute('datetime', parsed.raw);
        time.title = absoluteDate(parsed, lang);
        time.textContent = relativeTime(parsed, lang);
        dl.append(this.#statItem(this.dataset.labelLastModified || 'Last updated', time));
      }
    }

    this.append(dl);
  }

  #template(attr, fallback, n) {
    const tpl = this.getAttribute(attr) ?? fallback;
    return tpl.includes('{n}') ? tpl.replaceAll('{n}', n) : `${n} ${tpl}`;
  }

  /**
   * @param {string} label
   * @param {Node | string} value
   */
  #statItem(label, value) {
    const item = document.createElement('dl-item');
    const dt = document.createElement('dt');
    dt.className = 'visually-hidden';
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.append(value);
    item.append(dt, dd);
    return item;
  }

  /* Declared modification date only — document.lastModified is the
     response time for any dynamically served page, so it is not used. */
  #getLastModified() {
    const raw = /** @type {HTMLMetaElement | null} */ (document.querySelector('meta[name="last-modified"]'))?.content
      || /** @type {HTMLMetaElement | null} */ (document.querySelector('meta[property="article:modified_time"]'))?.content;
    const parsed = parseDateValue(raw);
    return parsed ? { ...parsed, raw: String(raw).trim() } : null;
  }
}

registerComponent('page-stats', PageStats);

export { PageStats };
