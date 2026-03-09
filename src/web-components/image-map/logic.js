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

class ImageMapWc extends HTMLElement {
  #img;
  #svg;
  #tooltip;
  #focusAnchors = [];
  #areaData = []; // { area, parsed, svgShape, anchor, contentHTML }
  #activeArea = null;
  #resizeObs;
  #touchedArea = null;

  connectedCallback() {
    // Find child <img> or create from src/alt attrs
    this.#img = this.querySelector(':scope > img');
    if (!this.#img) {
      const src = this.getAttribute('src');
      const alt = this.getAttribute('alt');
      if (src) {
        this.#img = document.createElement('img');
        this.#img.src = src;
        this.#img.alt = alt || '';
        this.prepend(this.#img);
      } else {
        return; // Nothing to work with
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

  disconnectedCallback() {
    this.removeAttribute('data-upgraded');
    this.#resizeObs?.disconnect();
    this.#hideTooltip();

    // Clean up event listeners on SVG shapes
    for (const data of this.#areaData) {
      data.svgShape?.removeEventListener('pointerenter', data._onEnter);
      data.svgShape?.removeEventListener('pointerleave', data._onLeave);
      data.svgShape?.removeEventListener('click', data._onClick);
      data.svgShape?.removeEventListener('touchstart', data._onTouch);
      data.anchor?.removeEventListener('focus', data._onFocus);
      data.anchor?.removeEventListener('blur', data._onBlur);
    }

    // Remove generated DOM
    this.#svg?.remove();
    this.#tooltip?.remove();
    for (const data of this.#areaData) {
      data.anchor?.remove();
    }

    this.#areaData = [];
    this.#focusAnchors = [];
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
      const shape = area.shape;
      const coords = area.coords;
      const parsed = parseCoords(shape, coords);
      const svgShape = createSvgShape(parsed);
      if (!svgShape) continue;

      const bbox = calcBoundingBox(parsed);

      // Create focus anchor
      const anchor = area.href
        ? document.createElement('a')
        : document.createElement('button');

      if (area.href) {
        anchor.href = area.href;
        if (area.target) anchor.target = area.target;
      }

      anchor.className = 'image-map-anchor';
      anchor.setAttribute('aria-label', area.label);
      anchor.setAttribute('aria-describedby', this.#tooltip.id);
      anchor.textContent = area.label;

      // Position anchor over the bounding box
      anchor.style.left = `${bbox.x}%`;
      anchor.style.top = `${bbox.y}%`;
      anchor.style.width = `${bbox.width}%`;
      anchor.style.height = `${bbox.height}%`;

      if (area.disabled) {
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
        _onEnter: null,
        _onLeave: null,
        _onClick: null,
        _onTouch: null,
        _onFocus: null,
        _onBlur: null,
      };

      // Pointer events on SVG shape
      if (!area.disabled) {
        const tooltipMode = area.tooltipMode;

        data._onEnter = () => {
          if (tooltipMode === 'hover') {
            this.#showTooltip(data);
          }
          svgShape.setAttribute('data-hover', '');
          this.#dispatch('image-map:area-enter', area);
        };

        data._onLeave = () => {
          if (tooltipMode === 'hover') {
            this.#hideTooltip();
          }
          svgShape.removeAttribute('data-hover');
          this.#dispatch('image-map:area-leave', area);
        };

        data._onClick = (e) => {
          if (tooltipMode === 'click') {
            if (this.#activeArea === data) {
              this.#hideTooltip();
            } else {
              this.#showTooltip(data);
            }
          }
          this.#dispatch('image-map:area-activate', area);

          // Navigate if has href and not click-mode tooltip
          if (area.href && tooltipMode !== 'click') {
            if (area.target === '_blank') {
              window.open(area.href, '_blank', 'noopener');
            } else {
              window.location.href = area.href;
            }
          }
        };

        // Touch: two-tap pattern for hover mode
        data._onTouch = (e) => {
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
        };

        svgShape.addEventListener('pointerenter', data._onEnter);
        svgShape.addEventListener('pointerleave', data._onLeave);
        svgShape.addEventListener('click', data._onClick);
        svgShape.addEventListener('touchstart', data._onTouch, { passive: false });

        // Focus/blur on anchor
        data._onFocus = () => {
          this.#showTooltip(data);
          svgShape.setAttribute('data-hover', '');
        };

        data._onBlur = () => {
          this.#hideTooltip();
          svgShape.removeAttribute('data-hover');
        };

        anchor.addEventListener('focus', data._onFocus);
        anchor.addEventListener('blur', data._onBlur);
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
    this.addEventListener('keydown', this.#onKeyDown);

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

customElements.define('map-area', MapAreaWc);
customElements.define('image-map', ImageMapWc);

export { ImageMapWc, MapAreaWc };
