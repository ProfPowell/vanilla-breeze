/**
 * heading-links: Add anchor links to headings
 *
 * Scans descendant headings and adds a permalink anchor to each. The anchor
 * shows on hover, keyboard focus and always on touch (hover: none) devices.
 * Activating it follows the fragment (:target, history, focus, reduced-motion
 * aware scroll — via _shared/fragment-link.js) and copies the absolute URL
 * to the clipboard. Every click writes to the clipboard.
 *
 * Ids: an existing id is kept; otherwise one is generated from the heading
 * text with headingSlug() below. scripts/check-links.mjs mirrors headingSlug()
 * and the "-1", "-2" dedupe so links to generated ids validate at build time —
 * CHANGE BOTH TOGETHER.
 *
 * Accessible names: the heading text is wrapped in a span the heading is
 * labelled by, so the heading's name stays its own text ("Usage", not
 * "Usage Copy link to Usage"). The anchor is named "<data-label-anchor>
 * <heading text>" (default "Copy link to Usage") through aria-labelledby, so it
 * follows text changes and can be localised.
 *
 * Skipped headings: [data-toc-ignore] (on the heading or an ancestor),
 * headings inside <dialog>, inside <browser-window> (demo content, not page
 * sections) and inside a nested <heading-links> (that host owns them).
 *
 * @attr {string} levels - Heading levels to process, comma separated h1–h6 (default: 'h2,h3'). Invalid tokens are ignored.
 * @attr {string} data-label-anchor - Anchor name prefix (default: 'Copy link to')
 * @attr {string} data-label-copied - Screen-reader announcement after copy (default: 'Link copied to clipboard')
 *
 * @fires heading-links:navigate - { id, url, heading } after an anchor is activated
 *
 * @example
 * <heading-links>
 *   <h2 id="usage">Usage</h2>
 *   <p>Content...</p>
 *   <h3>Example</h3>
 * </heading-links>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { copyText } from '../../utils/copy-init.js';
import { goToFragment } from '../_shared/fragment-link.js';
import { isSkippedHeading } from '../_shared/toc-skip.js';

const DEFAULT_LEVELS = ['h2', 'h3'];
const COPIED_DURATION = 1500;

let seq = 0;

/**
 * Heading text → id slug. Unicode-aware: letters (any script, diacritics
 * kept), marks, numbers, "_" and "-" survive; whitespace runs become one
 * hyphen; leading/trailing hyphens go; max 50 code points. Empty (e.g.
 * emoji-only) → "section". Mirrored in scripts/check-links.mjs headingSlug().
 * @param {string} text
 * @returns {string}
 */
export function headingSlug(text) {
  const slug = String(text).normalize('NFC').toLowerCase().trim()
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cut = Array.from(slug).slice(0, 50).join('').replace(/-$/, '');
  return cut || 'section';
}

/**
 * First free id: base, base-1, base-2… Mirrored in scripts/check-links.mjs.
 * @param {string} base
 * @param {(id: string) => boolean} taken
 * @returns {string}
 */
export function uniqueSlug(base, taken) {
  let id = base;
  let counter = 1;
  while (taken(id)) id = `${base}-${counter++}`;
  return id;
}

/**
 * levels attribute → validated selector list (h1–h6 only).
 * @param {string | null} value
 * @returns {string[]}
 */
export function parseLevels(value) {
  const tokens = (value ?? '').split(',').map((t) => t.trim().toLowerCase()).filter((t) => /^h[1-6]$/.test(t));
  return tokens.length ? [...new Set(tokens)] : DEFAULT_LEVELS;
}

class HeadingLinks extends VBElement {
  static get observedAttributes() { return ['levels', 'data-label-anchor']; }

  /** @type {MutationObserver | undefined} */
  #observer;
  /** @type {WeakMap<Element, ReturnType<typeof setTimeout>>} */
  #timers = new WeakMap();

  setup() {
    this.#processHeadings();
    this.listen(this, 'click', this.#onClick);

    this.#observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.type === 'childList')) this.#processHeadings();
    });
    this.#observer.observe(this, { childList: true, subtree: true });
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = undefined;
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    this.#processHeadings();
  }

  get #anchorLabel() {
    return this.getAttribute('data-label-anchor') || 'Copy link to';
  }

  /** @param {Element} heading */
  #owns(heading) {
    if (heading.closest('heading-links') !== this) return false;
    return !isSkippedHeading(heading);
  }

  #processHeadings() {
    const selector = parseLevels(this.getAttribute('levels')).join(',');
    const label = this.#anchorLabel;

    // Drop enhancement from headings no longer in scope (levels changed,
    // data-toc-ignore added, moved into a skipped context).
    for (const anchor of this.querySelectorAll('.heading-anchor[data-heading-links]')) {
      if (anchor.closest('heading-links') !== this) continue; // a nested host's
      const heading = anchor.parentElement;
      if (!heading || !heading.matches(selector) || !this.#owns(heading)) this.#unenhance(heading, anchor);
      else if (anchor.getAttribute('aria-label') !== label) anchor.setAttribute('aria-label', label);
    }

    for (const heading of this.querySelectorAll(selector)) {
      if (this.#owns(heading)) this.#enhanceHeading(heading);
    }
  }

  /** @param {Element} heading */
  #enhanceHeading(heading) {
    if (!heading.id) {
      heading.id = uniqueSlug(headingSlug(heading.textContent ?? ''), (id) => !!document.getElementById(id));
    }
    // Author-provided anchor or already enhanced
    if (heading.querySelector(':scope > .heading-anchor')) return;

    const n = ++seq;
    // Wrap the heading's own content so the heading (and the anchor) can be
    // labelled by the text alone.
    const text = document.createElement('span');
    text.className = 'heading-text';
    text.id = `heading-links-text-${n}`;
    text.append(...heading.childNodes);
    heading.append(text);
    if (!heading.hasAttribute('aria-label') && !heading.hasAttribute('aria-labelledby')) {
      heading.setAttribute('aria-labelledby', text.id);
      heading.setAttribute('data-heading-links-labelled', '');
    }

    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.id = `heading-links-anchor-${n}`;
    anchor.dataset.headingLinks = '';
    anchor.href = `#${heading.id}`;
    anchor.setAttribute('aria-label', this.#anchorLabel);
    anchor.setAttribute('aria-labelledby', `${anchor.id} ${text.id}`);
    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'link');
    icon.setAttribute('size', 'sm');
    anchor.append(icon);
    heading.append(anchor);

    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  }

  /**
   * @param {Element | null} heading
   * @param {Element} anchor
   */
  #unenhance(heading, anchor) {
    anchor.remove();
    if (!heading) return;
    const text = heading.querySelector(':scope > .heading-text');
    if (text) text.replaceWith(...text.childNodes);
    if (heading.hasAttribute('data-heading-links-labelled')) {
      heading.removeAttribute('aria-labelledby');
      heading.removeAttribute('data-heading-links-labelled');
    }
  }

  /** @param {Event} event */
  #onClick = (event) => {
    const e = /** @type {MouseEvent} */ (event);
    const origin = e.target instanceof Element ? e.target : null;
    const anchor = /** @type {HTMLAnchorElement | null} */ (origin?.closest('a.heading-anchor[data-heading-links]'));
    if (!anchor || anchor.closest('heading-links') !== this) return;
    // Modified / non-primary clicks keep native behaviour (new tab, etc.)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const heading = anchor.parentElement;
    if (!heading?.id) return;

    e.preventDefault();
    this.#activate(heading, anchor);
  };

  /**
   * @param {HTMLElement} heading
   * @param {HTMLAnchorElement} anchor
   */
  async #activate(heading, anchor) {
    goToFragment(heading, heading.id);

    // Document URL, never resolved against <base href>.
    const url = new URL(document.URL);
    url.hash = heading.id;

    this.dispatchEvent(new CustomEvent('heading-links:navigate', {
      bubbles: true,
      detail: { id: heading.id, url: url.href, heading },
    }));

    // No `button`: copyText would append its live region inside the link.
    // Without one it announces from <body>; the visual state is ours.
    const ok = await copyText(url.href, {
      announceMessage: this.getAttribute('data-label-copied') || 'Link copied to clipboard',
    });
    if (!ok) return;

    const icon = anchor.querySelector('icon-wc');
    anchor.dataset.state = 'copied';
    icon?.setAttribute('name', 'check');
    clearTimeout(this.#timers.get(anchor));
    this.#timers.set(anchor, setTimeout(() => {
      delete anchor.dataset.state;
      icon?.setAttribute('name', 'link');
      this.#timers.delete(anchor);
    }, COPIED_DURATION));
  }
}

registerComponent('heading-links', HeadingLinks);

export { HeadingLinks };
