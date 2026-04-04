/**
 * responsive-init: Upscale srcset/sizes with auto-sizes and shorthand generation
 *
 * Simplifies responsive images by auto-calculating `sizes` from layout width
 * and optionally generating `srcset` from a compact widths shorthand.
 *
 * @attr {string} data-responsive - Comma-separated widths to generate srcset
 *   (e.g. "400,800,1200"), or empty for auto-sizes only on existing srcset.
 * @attr {boolean} data-responsive-debug - Show dev overlay with current source
 *
 * @example Auto-sizes only (srcset already provided)
 * <img data-responsive
 *      src="hero.jpg"
 *      srcset="hero-400.jpg 400w, hero-800.jpg 800w"
 *      alt="Hero image">
 *
 * @example Shorthand (generate srcset from widths)
 * <img data-responsive="400,800,1200"
 *      src="hero.jpg"
 *      alt="Hero image">
 * <!-- Generates: srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1200.jpg 1200w" -->
 */

import { registerInit } from './_init-registry.js';

const SELECTOR = 'img[data-responsive]';
const ENHANCED = new WeakSet();

/**
 * Build srcset from a base src and a list of widths.
 * Inserts -{width} before the file extension.
 * "photo.jpg" + [400,800] → "photo-400.jpg 400w, photo-800.jpg 800w"
 */
function buildSrcset(src, widths) {
  const dot = src.lastIndexOf('.');
  if (dot === -1) return '';
  const base = src.substring(0, dot);
  const ext = src.substring(dot);
  return widths.map(w => `${base}-${w}${ext} ${w}w`).join(', ');
}

/**
 * Create the dev overlay badge showing which source was selected.
 */
function createOverlay(img) {
  const badge = document.createElement('span');
  badge.setAttribute('aria-hidden', 'true');
  Object.assign(badge.style, {
    position: 'absolute',
    top: '4px',
    left: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    fontFamily: 'monospace',
    lineHeight: '1.4',
    background: 'oklch(0.15 0 0 / 0.8)',
    color: '#0f0',
    borderRadius: '3px',
    zIndex: '1',
    pointerEvents: 'none',
  });

  function update() {
    const current = img.currentSrc || img.src;
    const name = current.split('/').pop();
    const w = img.naturalWidth;
    badge.textContent = `${name} (${w}px)`;
  }

  img.addEventListener('load', update);
  if (img.complete) update();

  // Wrap in relative container if needed
  const parent = img.parentElement;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }
  parent.insertBefore(badge, img);

  return badge;
}

/**
 * Auto-calculate sizes from the image's rendered CSS pixel width.
 * Uses ResizeObserver for accuracy across layout changes.
 */
function observeSizes(img) {
  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = Math.round(entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
      if (width > 0) {
        img.sizes = `${width}px`;
      }
    }
  });
  ro.observe(img);
}

/** Enhance a single img[data-responsive] element */
function enhance(img) {
  if (ENHANCED.has(img)) return;
  ENHANCED.add(img);

  const value = img.getAttribute('data-responsive');

  // Generate srcset from widths shorthand
  if (value) {
    const widths = value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n > 0);
    if (widths.length && img.src) {
      img.srcset = buildSrcset(img.src, widths);
    }
  }

  // Auto-sizes: only if srcset uses width descriptors
  if (img.srcset && img.srcset.includes('w')) {
    observeSizes(img);
  }

  // Performance defaults
  if (!img.hasAttribute('loading')) img.loading = 'lazy';
  if (!img.hasAttribute('decoding')) img.decoding = 'async';

  // Dev overlay
  if (img.hasAttribute('data-responsive-debug')) {
    createOverlay(img);
  }
}

registerInit(SELECTOR, enhance);

export { enhance as initResponsiveImages };
