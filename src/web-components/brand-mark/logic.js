/**
 * brand-mark — brand/logo display with optional image logo, dark-mode and
 * compact variants.
 *
 * Content contract: the author's children (text, <img>, <svg>, <em>/<small>
 * taglines, anything) are content and are NEVER removed, replaced, reordered
 * or flattened. The component only ever touches ONE element it owns:
 *
 *   <picture data-brand-mark-img>
 *     <source media="(width < 48rem)" srcset="{src-compact}">   (optional)
 *     <img src="{src | src-dark}" alt="…" decoding="async">
 *   </picture>
 *
 * which it prepends when `src` is set, keeps up to date, and removes when
 * `src` is removed. "Image only" vs "image + wordmark" is pure CSS (see
 * styles.css): without `wordmark`, authored content is visually hidden but
 * stays in the DOM as the accessible name.
 *
 * Accessible name rules (owned <img> alt):
 *   - image only + `alt` attribute → img alt = alt; CSS hides the authored
 *     content from AT too (visibility), so the name is announced once.
 *   - otherwise, if authored text exists → img alt="" (decorative); the
 *     authored text is the name (visually hidden in image-only mode).
 *   - no authored text → img alt = `alt` attribute (or "" if absent).
 *
 * Attributes:
 *   src           — logo URL (light mode / default). Without it, nothing is inserted.
 *   src-dark      — dark-mode logo URL; follows <html data-mode> then the
 *                   resolved color-scheme then prefers-color-scheme.
 *   src-compact   — compact/icon logo used when `compact-media` matches.
 *   compact-media — media query for src-compact (default "(width < 48rem)", --bp-m).
 *   alt           — image text alternative (see rules above).
 *   wordmark      — boolean; show authored content alongside the image.
 *   height        — logo height: a number (px) or any CSS length; sets
 *                   --brand-mark-height on the host.
 */
import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';

const OWNED = 'data-brand-mark-img';
const DEFAULT_COMPACT_MEDIA = '(width < 48rem)';

class BrandMark extends VBElement {
  static observedAttributes = ['src', 'src-dark', 'src-compact', 'compact-media', 'alt', 'wordmark', 'height'];

  /** @type {MutationObserver|null} */
  #modeObserver = null;
  /** @type {MutationObserver|null} */
  #contentObserver = null;
  /** @type {MediaQueryList|null} */
  #darkMql = null;
  /** @type {boolean} */
  #watchingMode = false;

  setup() {
    this.#syncHeight();
    if (this.hasAttribute('src-dark')) this.#watchColorMode();
    this.#render();

    // Authored text may change after upgrade; the owned img alt depends on
    // whether authored text exists. Only attributes of the owned img are
    // touched in response, so this cannot loop.
    this.#contentObserver = new MutationObserver(() => this.#syncAlt());
    this.#contentObserver.observe(this, { childList: true, characterData: true, subtree: true });
  }

  teardown() {
    // The owned image is deliberately kept: a move/reconnect re-runs setup()
    // which finds and updates it instead of building a second one.
    this.#modeObserver?.disconnect();
    this.#modeObserver = null;
    this.#contentObserver?.disconnect();
    this.#contentObserver = null;
    this.#darkMql = null;
    this.#watchingMode = false; // listen() handlers are released by VBElement
  }

  /**
   * @param {string} name
   * @param {string|null} oldVal
   * @param {string|null} newVal
   */
  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (!this.isConnected || !this.hasAttribute('data-upgraded')) return;

    if (name === 'height') {
      this.#syncHeight();
      return;
    }
    if (name === 'src-dark' && newVal !== null) this.#watchColorMode();
    this.#render();
  }

  /**
   * Determine if dark mode is active.
   *
   * Priority order (matches social-embed and other VB components):
   *   1. Explicit data-mode on <html> — set by VB's theme-manager
   *   2. The host element's resolved CSS color-scheme — driven by the
   *      active VB theme tokens, catches theme changes that don't go
   *      through data-mode
   *   3. System preference (prefers-color-scheme) as a last resort
   */
  #isDark() {
    const mode = document.documentElement.getAttribute('data-mode');
    if (mode === 'dark') return true;
    if (mode === 'light') return false;

    const cs = getComputedStyle(this).colorScheme || '';
    if (/\bdark\b/.test(cs) && !/\blight\b/.test(cs)) return true;
    if (/\blight\b/.test(cs) && !/\bdark\b/.test(cs)) return false;

    return (this.#darkMql ?? matchMedia('(prefers-color-scheme: dark)')).matches;
  }

  /** Watch color mode changes (idempotent; released on disconnect). */
  #watchColorMode() {
    if (this.#watchingMode) return;
    this.#watchingMode = true;

    this.#darkMql = matchMedia('(prefers-color-scheme: dark)');
    this.listen(this.#darkMql, 'change', this.#onModeChange);
    // VB theme-manager events — catches changes that don't mutate data-mode
    // (e.g. brand-only theme swaps that change tokens but keep mode auto).
    this.listen(window, 'vb:theme-change', this.#onModeChange);

    this.#modeObserver = new MutationObserver(this.#onModeChange);
    this.#modeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode', 'data-theme'],
    });
  }

  #onModeChange = () => {
    if (this.isConnected) this.#render();
  };

  /** --brand-mark-height from the height attribute (number → px). */
  #syncHeight() {
    const h = this.getAttribute('height')?.trim();
    if (!h) {
      this.style.removeProperty('--brand-mark-height');
      if (!this.getAttribute('style')) this.removeAttribute('style');
      return;
    }
    this.style.setProperty('--brand-mark-height', /^\d+(\.\d+)?$/.test(h) ? `${h}px` : h);
  }

  /** @returns {HTMLElement|null} */
  #owned() {
    return this.querySelector(`:scope > [${OWNED}]`);
  }

  #render() {
    const srcLight = this.getAttribute('src');
    let owned = this.#owned();

    if (!srcLight) {
      owned?.remove();
      return;
    }

    const srcDark = this.getAttribute('src-dark');
    const src = (srcDark && this.#isDark()) ? srcDark : srcLight;

    if (!(owned instanceof HTMLPictureElement) || !owned.querySelector(':scope > img')) {
      owned?.remove();
      owned = document.createElement('picture');
      owned.setAttribute(OWNED, '');
      const img = document.createElement('img');
      img.decoding = 'async';
      owned.append(img);
      this.prepend(owned);
    }

    const img = /** @type {HTMLImageElement} */ (owned.querySelector(':scope > img'));
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);

    // Compact variant: a <source> the browser switches natively.
    const compact = this.getAttribute('src-compact');
    let source = owned.querySelector(':scope > source');
    if (compact) {
      if (!source) {
        source = document.createElement('source');
        owned.prepend(source);
      }
      const media = this.getAttribute('compact-media') || DEFAULT_COMPACT_MEDIA;
      if (source.getAttribute('media') !== media) source.setAttribute('media', media);
      if (source.getAttribute('srcset') !== compact) source.setAttribute('srcset', compact);
    } else {
      source?.remove();
    }

    this.#syncAlt();
  }

  /** Apply the accessible-name rules (see file header) to the owned img. */
  #syncAlt() {
    const img = this.#owned()?.querySelector(':scope > img');
    if (!img) return;
    const alt = this.getAttribute('alt');
    const imageOnly = !this.hasAttribute('wordmark');
    let value;
    if (imageOnly && alt) value = alt;
    else if (this.#hasAuthoredText()) value = '';
    else value = alt ?? '';
    if (img.getAttribute('alt') !== value) img.setAttribute('alt', value);
  }

  /** Whether the author's content (everything but the owned image) has text. */
  #hasAuthoredText() {
    for (const node of this.childNodes) {
      if (node instanceof Element && node.hasAttribute(OWNED)) continue;
      if (node.textContent?.trim()) return true;
    }
    return false;
  }
}

registerComponent('brand-mark', BrandMark);
