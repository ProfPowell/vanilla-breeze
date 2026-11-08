/**
 * responsive-init: sizes from layout width, and srcset from a widths shorthand
 *
 * `img[data-responsive]` measures the image's rendered width and writes it to
 * `sizes`, so the browser picks the right `w` candidate without a
 * hand-written sizes list. A value (`data-responsive="400,800,1200"`)
 * generates the `srcset` from the `src` file name.
 *
 * Rules:
 * - An authored `srcset` wins over the shorthand.
 * - An authored `sizes` wins, unless it starts with `auto`. `auto` on a
 *   `loading="lazy"` image is left to the browser (native sizes=auto);
 *   on an eager image `auto` is invalid, so the width is measured instead.
 * - `sizes` only ever grows (the width is written when it exceeds the last
 *   written width). Shrinking the slot keeps the larger candidate, which is
 *   already cached, and it breaks the feedback loop where a new `sizes`
 *   picks a new source whose box changes the width again.
 * - An image that fails to load is no longer measured.
 * - The script runs after the parser has requested `src`, so the shorthand
 *   costs a second request when the generated candidate differs from `src`,
 *   and `loading`/`decoding` must be written in markup to have any effect.
 *
 * @attr {string} data-responsive - Comma-separated widths that generate the
 *   srcset (e.g. "400,800,1200"), or empty for measured sizes only.
 * @attr {boolean} data-responsive-debug - Show a dev badge naming the chosen source
 *
 * @example Measured sizes (srcset written in markup)
 * <img data-responsive
 *      src="hero-800.jpg"
 *      srcset="hero-400.jpg 400w, hero-800.jpg 800w"
 *      alt="Hero image">
 *
 * @example Shorthand (generate srcset from widths)
 * <img data-responsive="400,800,1200" src="hero.jpg" alt="Hero image">
 * <!-- srcset="…/hero-400.jpg 400w, …/hero-800.jpg 800w, …/hero-1200.jpg 1200w" -->
 */

import { registerInit } from './_init-registry.js';

const SELECTOR = 'img[data-responsive]';
const ENHANCED = new WeakSet();
/** Last width written to `sizes`, per image. @type {WeakMap<HTMLImageElement, number>} */
const WRITTEN = new WeakMap();
const WIDTH_DESCRIPTOR = /\s\d+w\s*(?:,|$)/;
/** A `sizes` this script wrote (copied onto a clone): a single px length. */
const GENERATED_SIZES = /^\d+px$/;

/**
 * Build a srcset from a source URL and a list of widths: `-{width}` goes
 * before the extension of the LAST path segment. Query and hash are kept.
 * Returns '' when the file name has no extension (nothing safe to insert).
 * "/img/photo.jpg?v=2" + [400] → "https://host/img/photo-400.jpg?v=2 400w"
 *
 * @param {string} src - Absolute or relative URL
 * @param {number[]} widths
 * @param {string} [base] - Base URL for relative sources
 * @returns {string}
 */
export function buildSrcset(src, widths, base = document.baseURI) {
  let url;
  try { url = new URL(src, base); } catch { return ''; }
  const slash = url.pathname.lastIndexOf('/');
  const file = url.pathname.slice(slash + 1);
  const dot = file.lastIndexOf('.');
  if (dot <= 0) return '';
  const dir = url.pathname.slice(0, slash + 1);
  const stem = file.slice(0, dot);
  const ext = file.slice(dot);
  return widths.map((w) => {
    const candidate = new URL(url.href);
    candidate.pathname = `${dir}${stem}-${w}${ext}`;
    return `${candidate.href} ${w}w`;
  }).join(', ');
}

/** @param {string} value */
function parseWidths(value) {
  return value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n > 0);
}

/** One observer for every measured image. */
const resizeObserver = typeof ResizeObserver === 'function'
  ? new ResizeObserver((entries) => {
    for (const entry of entries) {
      const img = /** @type {HTMLImageElement} */ (entry.target);
      const width = Math.round(entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
      if (width > (WRITTEN.get(img) ?? 0)) {
        WRITTEN.set(img, width);
        img.sizes = `${width}px`;
      }
    }
  })
  : null;

/** @param {HTMLImageElement} img */
function stopMeasuring(img) {
  resizeObserver?.unobserve(img);
}

/**
 * Whether this script should measure the image (see the rules above).
 * @param {HTMLImageElement} img
 */
function wantsMeasuredSizes(img) {
  if (!WIDTH_DESCRIPTOR.test(img.getAttribute('srcset') || '')) return false;
  const sizes = (img.getAttribute('sizes') || '').trim();
  if (!sizes || GENERATED_SIZES.test(sizes)) return true;
  if (/^auto\b/i.test(sizes)) return img.loading !== 'lazy';
  return false;
}

/**
 * Dev badge naming the selected source. Positioned by responsive.css;
 * placed beside the image (or beside its <picture>), never inside <picture>.
 * @param {HTMLImageElement} img
 */
function createBadge(img) {
  const badge = document.createElement('span');
  badge.setAttribute('data-responsive-badge', '');
  badge.setAttribute('aria-hidden', 'true');

  const update = () => {
    const current = img.currentSrc || img.src;
    badge.textContent = `${current.split('/').pop()} (${img.naturalWidth}px)`;
  };
  img.addEventListener('load', update);
  if (img.complete) update();

  const anchor = img.parentElement instanceof HTMLPictureElement ? img.parentElement : img;
  anchor.before(badge);
}

/** Enhance a single img[data-responsive] element */
function enhance(img) {
  if (ENHANCED.has(img)) return;
  ENHANCED.add(img);

  const value = img.getAttribute('data-responsive') || '';
  const src = img.getAttribute('src');

  // Shorthand → srcset, unless the author wrote one. A clone carries the
  // generated srcset over; regenerating gives the same string.
  if (value && src) {
    const widths = parseWidths(value);
    const generated = widths.length ? buildSrcset(src, widths) : '';
    const authored = img.getAttribute('srcset');
    if (!generated) {
      if (widths.length) console.warn('[data-responsive] No file extension to insert widths before:', src);
    } else if (!authored) {
      img.srcset = generated;
    }
  }

  if (!img.hasAttribute('decoding')) img.decoding = 'async';

  // A broken image would otherwise keep re-measuring its alt box.
  img.addEventListener('error', () => stopMeasuring(img));
  const broken = img.complete && img.naturalWidth === 0 && !!img.currentSrc;
  if (!broken && wantsMeasuredSizes(img)) {
    WRITTEN.delete(img);
    resizeObserver?.observe(img);
  }

  if (img.hasAttribute('data-responsive-debug')) createBadge(img);
}

registerInit(SELECTOR, enhance);

export { enhance as initResponsiveImages };
