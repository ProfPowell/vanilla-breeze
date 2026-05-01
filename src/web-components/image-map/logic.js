/**
 * image-map + map-area: Modern responsive image map with percentage coordinates
 *
 * Replaces native <map>/<area> with percentage-based coordinates that scale
 * with the image. SVG overlay handles hit testing, focus anchors provide
 * keyboard navigation, and a tooltip container shows rich HTML content.
 *
 * Without JS: <img> renders normally, <map-area> elements display as a
 * labeled list below the image.
 *
 * @example
 * <image-map>
 *   <img src="/maps/world.jpg" alt="World map" />
 *   <map-area shape="rect" coords="10 20 45 60" label="Europe" href="/europe">
 *     <strong>European Region</strong>
 *     <p>14 offices across 9 countries.</p>
 *   </map-area>
 * </image-map>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// --- Coordinate parsing ---

/**
 * Parse a coords string into numbers.
 * Accepts space or comma separators.
 */
function parseNums(str) {
  return str.trim().split(/[\s,]+/).map(Number);
}

/**
 * Parse coords for a given shape type.
 * Returns a descriptor object for SVG creation.
 */
function parseCoords(shape, str) {
  const nums = parseNums(str);
  switch (shape) {
    case 'rect': {
      const [x1, y1, x2, y2] = nums;
      return { type: 'rect', x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    }
    case 'circle': {
      const [cx, cy, r] = nums;
      return { type: 'circle', cx, cy, r };
    }
    case 'poly': {
      const points = [];
      for (let i = 0; i < nums.length; i += 2) {
        points.push([nums[i], nums[i + 1]]);
      }
      return { type: 'poly', points };
    }
    default:
      return null;
  }
}

/**
 * Create a namespaced SVG shape element from parsed coords.
 */
function createSvgShape(parsed) {
  if (!parsed) return null;
  switch (parsed.type) {
    case 'rect': {
      const el = document.createElementNS(SVG_NS, 'rect');
      el.setAttribute('x', String(parsed.x));
      el.setAttribute('y', String(parsed.y));
      el.setAttribute('width', String(parsed.width));
      el.setAttribute('height', String(parsed.height));
      return el;
    }
    case 'circle': {
      const el = document.createElementNS(SVG_NS, 'circle');
      el.setAttribute('cx', String(parsed.cx));
      el.setAttribute('cy', String(parsed.cy));
      el.setAttribute('r', String(parsed.r));
      return el;
    }
    case 'poly': {
      const el = document.createElementNS(SVG_NS, 'polygon');
      el.setAttribute('points', parsed.points.map(p => p.join(',')).join(' '));
      return el;
    }
    default:
      return null;
  }
}

/**
 * Calculate bounding box (percentage) from parsed coords.
 * Used for positioning focus anchors.
 */
function calcBoundingBox(parsed) {
  if (!parsed) return { x: 0, y: 0, width: 0, height: 0 };
  switch (parsed.type) {
    case 'rect':
      return { x: parsed.x, y: parsed.y, width: parsed.width, height: parsed.height };
    case 'circle':
      return {
        x: parsed.cx - parsed.r,
        y: parsed.cy - parsed.r,
        width: parsed.r * 2,
        height: parsed.r * 2,
      };
    case 'poly': {
      let minX = 100, minY = 100, maxX = 0, maxY = 0;
      for (const [px, py] of parsed.points) {
        if (px < minX) minX = px;
        if (py < minY) minY = py;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

// --- MapAreaWc ---

class MapAreaWc extends HTMLElement {
  get shape() { return this.getAttribute('shape') || 'rect'; }
  get coords() { return this.getAttribute('coords') || ''; }
  get label() { return this.getAttribute('label') || ''; }
  get href() { return this.getAttribute('href'); }
  get target() { return this.getAttribute('target') || ''; }
  get tooltipMode() { return this.getAttribute('tooltip') || 'hover'; }
  get disabled() { return this.hasAttribute('disabled'); }

  connectedCallback() {
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
  }
}

// --- ImageMapWc ---

class ImageMapWc extends VBElement {
  /** @type {HTMLImageElement} */
  #img = /** @type {*} */ (null);
  /** @type {SVGSVGElement} */
  #svg = /** @type {*} */ (null);
  /** @type {HTMLDivElement} */
  #tooltip = /** @type {*} */ (null);
  /** @type {any[]} */
  #focusAnchors = [];
  /** @type {any[]} */
  #areaData = [];
  /** @type {any} */
  #activeArea = null;
  /** @type {ResizeObserver | null} */
  #resizeObs = null;
  /** @type {object | null} */
  #touchedArea = null;

  setup() {
    // Find child <img> or create from src/alt attrs
    this.#img = /** @type {HTMLImageElement} */ (this.querySelector(':scope > img'));
    if (!this.#img) {
      const src = this.getAttribute('src');
      const alt = this.getAttribute('alt');
      if (src) {
        this.#img = document.createElement('img');
        this.#img.src = src;
        this.#img.alt = alt || '';
        this.prepend(this.#img);
      } else {
        return false; // Nothing to work with
      }
    }

    this.#img.classList.add('image-map-img');

    // Wait for image to load before building overlay
    if (this.#img.complete) {
      this.#build();
    } else {
      this.#img.addEventListener('load', () => this.#build(), { once: true });
    }
  }

  teardown() {
    this.#resizeObs?.disconnect();
    this.#hideTooltip();

    // Remove generated DOM
    this.#svg?.remove();
    this.#tooltip?.remove();
    for (const data of this.#areaData) {
      data.anchor?.remove();
    }

    this.#areaData = [];
    this.#focusAnchors = [];
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current map regions as plain data. Each entry mirrors a
   * `<map-area>` child: `{ shape, coords, label?, href?, target? }`.
   */
  get regions() {
    return [...this.querySelectorAll(':scope > map-area')].map(a => ({
      shape: a.getAttribute('shape') || undefined,
      coords: a.getAttribute('coords') || undefined,
      label: a.getAttribute('label') || a.textContent?.trim() || undefined,
      href: a.getAttribute('href') || undefined,
      target: a.getAttribute('target') || undefined,
    }));
  }

  /**
   * Replace the map regions and rebuild the overlay. Each entry is a
   * `<map-area>` shape; `coords` is the percentage-coords string.
   *
   * Emits image-map:regions-changed { regions, source: 'property' }.
   */
  set regions(value) {
    const next = Array.isArray(value) ? value : [];
    // Remove existing map-area children but keep the <img>.
    for (const a of [...this.querySelectorAll(':scope > map-area')]) a.remove();
    for (const r of next) {
      const a = document.createElement('map-area');
      if (r.shape)  a.setAttribute('shape', r.shape);
      if (r.coords) a.setAttribute('coords', r.coords);
      if (r.label)  a.setAttribute('label', r.label);
      if (r.href)   a.setAttribute('href', r.href);
      if (r.target) a.setAttribute('target', r.target);
      this.appendChild(a);
    }
    this.teardown();
    this.removeAttribute('data-upgraded');
    this.setup();
    this.dispatchEvent(new CustomEvent('image-map:regions-changed', {
      detail: { regions: next, source: 'property' },
      bubbles: true,
    }));
  }

  #build() {
    // Collect <map-area> children
    const areas = [...this.querySelectorAll(':scope > map-area')];
    if (areas.length === 0) {
      this.setAttribute('data-upgraded', '');
      return;
    }

    // Create SVG overlay
    this.#svg = document.createElementNS(SVG_NS, 'svg');
    this.#svg.setAttribute('viewBox', '0 0 100 100');
    this.#svg.setAttribute('preserveAspectRatio', 'none');
    this.#svg.setAttribute('aria-hidden', 'true');
    this.#svg.classList.add('image-map-overlay');

    // Create tooltip container
    this.#tooltip = document.createElement('div');
    this.#tooltip.className = 'image-map-tooltip';
    this.#tooltip.setAttribute('role', 'tooltip');
    this.#tooltip.setAttribute('aria-live', 'polite');
    this.#tooltip.id = `imap-tip-${crypto.randomUUID().slice(0, 8)}`;

    // Process each area
    for (const area of areas) {
      const /** @type {MapAreaWc} */ mapArea = /** @type {MapAreaWc} */ (area);
      const shape = mapArea.shape;
      const coords = mapArea.coords;
      const parsed = parseCoords(shape, coords);
      const svgShape = createSvgShape(parsed);
      if (!svgShape) continue;

      const bbox = calcBoundingBox(parsed);

      // Create focus anchor
      const anchor = mapArea.href
        ? document.createElement('a')
        : document.createElement('button');

      if (mapArea.href) {
        /** @type {HTMLAnchorElement} */ (anchor).href = mapArea.href;
        if (mapArea.target) /** @type {HTMLAnchorElement} */ (anchor).target = mapArea.target;
      }

      anchor.className = 'image-map-anchor';
      anchor.setAttribute('aria-label', mapArea.label);
      anchor.setAttribute('aria-describedby', this.#tooltip.id);
      anchor.textContent = mapArea.label;

      // Position anchor over the bounding box
      anchor.style.left = `${bbox.x}%`;
      anchor.style.top = `${bbox.y}%`;
      anchor.style.width = `${bbox.width}%`;
      anchor.style.height = `${bbox.height}%`;

      if (mapArea.disabled) {
        svgShape.setAttribute('data-disabled', '');
        anchor.setAttribute('tabindex', '-1');
        anchor.setAttribute('aria-disabled', 'true');
      }

      // Store tooltip content HTML
      const contentHTML = area.innerHTML;

      const data = {
        area,
        parsed,
        svgShape,
        anchor,
        contentHTML,
      };

      // Pointer events on SVG shape
      if (!mapArea.disabled) {
        const tooltipMode = mapArea.tooltipMode;

        this.listen(svgShape, 'pointerenter', () => {
          if (tooltipMode === 'hover') {
            this.#showTooltip(data);
          }
          svgShape.setAttribute('data-hover', '');
          this.#dispatch('image-map:area-enter', mapArea);
        });

        this.listen(svgShape, 'pointerleave', () => {
          if (tooltipMode === 'hover') {
            this.#hideTooltip();
          }
          svgShape.removeAttribute('data-hover');
          this.#dispatch('image-map:area-leave', mapArea);
        });

        this.listen(svgShape, 'click', () => {
          if (tooltipMode === 'click') {
            if (this.#activeArea === data) {
              this.#hideTooltip();
            } else {
              this.#showTooltip(data);
            }
          }
          this.#dispatch('image-map:area-activate', mapArea);

          // Navigate if has href and not click-mode tooltip
          if (mapArea.href && tooltipMode !== 'click') {
            if (mapArea.target === '_blank') {
              window.open(mapArea.href, '_blank', 'noopener');
            } else {
              window.location.href = mapArea.href;
            }
          }
        });

        // Touch: two-tap pattern for hover mode
        this.listen(svgShape, 'touchstart', (e) => {
          if (tooltipMode === 'hover') {
            if (this.#touchedArea !== data) {
              e.preventDefault();
              this.#touchedArea = data;
              this.#showTooltip(data);
            } else {
              // Second tap — allow default (navigation)
              this.#touchedArea = null;
            }
          }
        }, { passive: false });

        // Focus/blur on anchor
        this.listen(anchor, 'focus', () => {
          this.#showTooltip(data);
          svgShape.setAttribute('data-hover', '');
        });

        this.listen(anchor, 'blur', () => {
          this.#hideTooltip();
          svgShape.removeAttribute('data-hover');
        });
      }

      this.#svg.appendChild(svgShape);
      this.#areaData.push(data);
      this.#focusAnchors.push(anchor);
    }

    // Append generated DOM
    this.appendChild(this.#svg);
    for (const anchor of this.#focusAnchors) {
      this.appendChild(anchor);
    }
    this.appendChild(this.#tooltip);

    // Keyboard navigation on host
    this.listen(this, 'keydown', this.#onKeyDown);

    // ResizeObserver for tooltip repositioning
    this.#resizeObs = new ResizeObserver(() => {
      if (this.#activeArea) {
        this.#positionTooltip(this.#activeArea.svgShape);
      }
    });
    this.#resizeObs.observe(this.#img);

    // ARIA
    this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.#img.alt || 'Image map');
    }

    this.setAttribute('data-upgraded', '');
  }

  #showTooltip(data) {
    if (!this.#tooltip) return;

    this.#activeArea = data;
    this.#tooltip.innerHTML = data.contentHTML;
    this.#tooltip.setAttribute('data-visible', '');
    this.#positionTooltip(data.svgShape);
  }

  #hideTooltip() {
    if (!this.#tooltip) return;

    this.#activeArea = null;
    this.#tooltip.removeAttribute('data-visible');
  }

  #positionTooltip(svgShape) {
    if (!this.#tooltip || !svgShape) return;

    const shapeRect = svgShape.getBoundingClientRect();
    const tooltipRect = this.#tooltip.getBoundingClientRect();
    const gap = 8;
    const padding = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top, left;

    // Try above
    const aboveTop = shapeRect.top - tooltipRect.height - gap;
    if (aboveTop >= padding) {
      top = aboveTop;
      left = shapeRect.left + (shapeRect.width - tooltipRect.width) / 2;
    }
    // Try below
    else if (shapeRect.bottom + gap + tooltipRect.height <= vh - padding) {
      top = shapeRect.bottom + gap;
      left = shapeRect.left + (shapeRect.width - tooltipRect.width) / 2;
    }
    // Try right
    else if (shapeRect.right + gap + tooltipRect.width <= vw - padding) {
      top = shapeRect.top + (shapeRect.height - tooltipRect.height) / 2;
      left = shapeRect.right + gap;
    }
    // Try left
    else {
      top = shapeRect.top + (shapeRect.height - tooltipRect.height) / 2;
      left = shapeRect.left - tooltipRect.width - gap;
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, vw - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, vh - tooltipRect.height - padding));

    this.#tooltip.style.top = `${top}px`;
    this.#tooltip.style.left = `${left}px`;
  }

  #onKeyDown = (e) => {
    const anchors = this.#focusAnchors.filter(a => !a.hasAttribute('aria-disabled'));
    const current = anchors.indexOf(document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight': {
        e.preventDefault();
        const next = current < anchors.length - 1 ? current + 1 : 0;
        anchors[next]?.focus();
        break;
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        e.preventDefault();
        const prev = current > 0 ? current - 1 : anchors.length - 1;
        anchors[prev]?.focus();
        break;
      }
      case 'Escape':
        this.#hideTooltip();
        this.#touchedArea = null;
        break;
    }
  };

  #dispatch(name, area) {
    this.dispatchEvent(new CustomEvent(name, {
      detail: { area },
      bubbles: true,
    }));
  }
}

registerComponent('map-area', MapAreaWc);
registerComponent('image-map', ImageMapWc);

export { ImageMapWc, MapAreaWc };
