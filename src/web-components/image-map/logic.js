/**
 * image-map + map-area: Modern responsive image map with percentage coordinates
 *
 * Replaces native <map>/<area> with percentage-based coordinates that scale
 * with the image. SVG overlay handles hit testing, focus anchors provide
 * keyboard navigation, and a tooltip container shows rich HTML content.
 *
 * Without JS: <img> renders normally, <map-area> elements display as a
 * labeled list below the image (label + content). Put an authored
 * <a href> inside the content to keep the destination reachable without JS.
 *
 * @attr {string} src            - Image URL when no child <img> is authored
 * @attr {string} alt            - Alt text for the generated image
 * @attr {string} data-label-map - Group name fallback when the image has no alt (default "Image map")
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

let uid = 0;
const HIDE_DELAY = 300;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Normalise region content to nodes without parsing strings as HTML.
 * @param {unknown} content
 * @returns {Node[]}
 */
function contentNodes(content) {
  if (content == null || content === '') return [];
  if (content instanceof HTMLTemplateElement) return [content.content.cloneNode(true)];
  if (content instanceof Node) return [content.cloneNode(true)];
  return [document.createTextNode(String(content))];
}

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
  /** @type {SVGSVGElement | null} */
  #svg = null;
  /** @type {HTMLElement | null} */
  #tooltip = null;
  /** @type {HTMLElement[]} */
  #focusAnchors = [];
  /** @type {any[]} */
  #areaData = [];
  /** @type {any} */
  #activeArea = null;
  /** @type {ResizeObserver | null} */
  #resizeObs = null;
  /** @type {object | null} */
  #touchedArea = null;
  /** @type {ReturnType<typeof setTimeout> | 0} */
  #hideTimer = 0;
  #rafId = 0;
  /** @type {Element[]} map-area elements we assigned an id to */
  #assignedIds = [];

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

    // Wait for image to load before building overlay. listen() releases the
    // pending listener on disconnect so a late load can't build a stale map.
    if (this.#img.complete) {
      this.#build();
    } else {
      this.listen(this.#img, 'load', () => this.#build(), { once: true });
    }
    return true;
  }

  teardown() {
    this.#resizeObs?.disconnect();
    this.#resizeObs = null;
    this.#hideTooltip();
    clearTimeout(this.#hideTimer);
    cancelAnimationFrame(this.#rafId);

    // Remove generated DOM
    this.#svg?.remove();
    this.#tooltip?.remove();
    for (const data of this.#areaData) {
      data.anchor?.remove();
    }
    for (const el of this.#assignedIds) el.removeAttribute('id');

    this.#svg = null;
    this.#tooltip = null;
    this.#areaData = [];
    this.#focusAnchors = [];
    this.#assignedIds = [];
    this.#touchedArea = null;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current map regions as plain data. Each entry mirrors a
   * `<map-area>` child: `{ shape, coords, label?, href?, target?, tooltip?,
   * disabled?, content? }`. `content` is a string for text-only content or
   * a cloned DocumentFragment when the area holds markup.
   *
   * @returns {Array<{ shape?: string, coords?: string, label?: string, href?: string, target?: string, tooltip?: string, disabled?: boolean, content?: string | DocumentFragment }>} Region records.
   */
  get regions() {
    return [...this.querySelectorAll(':scope > map-area')].map(a => {
      let content;
      if (a.children.length) {
        const frag = document.createDocumentFragment();
        frag.append(...[...a.childNodes].map(n => n.cloneNode(true)));
        content = frag;
      } else {
        content = a.textContent?.trim() || undefined;
      }
      return {
        shape: a.getAttribute('shape') || undefined,
        coords: a.getAttribute('coords') || undefined,
        label: a.getAttribute('label') || a.textContent?.trim().replace(/\s+/g, ' ') || undefined,
        href: a.getAttribute('href') || undefined,
        target: a.getAttribute('target') || undefined,
        tooltip: a.getAttribute('tooltip') || undefined,
        disabled: a.hasAttribute('disabled') || undefined,
        content,
      };
    });
  }

  /**
   * Replace the map regions and rebuild the overlay. Each entry is a
   * `<map-area>` shape; `coords` is the percentage-coords string. String
   * `content` is rendered as text; pass a Node/DocumentFragment/<template>
   * for rich tooltip content.
   *
   * Emits image-map:regions-changed { regions, source: 'property' }.
   */
  set regions(value) {
    const next = Array.isArray(value) ? value : [];
    // Remove existing map-area children but keep the <img>.
    for (const a of [...this.querySelectorAll(':scope > map-area')]) a.remove();
    for (const r of next) {
      if (!r) continue;
      const a = document.createElement('map-area');
      if (r.shape)   a.setAttribute('shape', r.shape);
      if (r.coords)  a.setAttribute('coords', r.coords);
      if (r.label)   a.setAttribute('label', r.label);
      if (r.href)    a.setAttribute('href', r.href);
      if (r.target)  a.setAttribute('target', r.target);
      if (r.tooltip) a.setAttribute('tooltip', r.tooltip);
      if (r.disabled) a.setAttribute('disabled', '');
      a.append(...contentNodes(r.content));
      this.appendChild(a);
    }
    this._reinit();
    this.dispatchEvent(new CustomEvent('image-map:regions-changed', {
      detail: { regions: this.regions, source: 'property' },
      bubbles: true,
    }));
  }

  #build() {
    // Once per lifecycle: a late load event or a duplicate call must not
    // stack a second overlay, and a disconnected host builds nothing.
    if (!this.isConnected || this.#svg) return;

    // Collect <map-area> children
    const areas = [...this.querySelectorAll(':scope > map-area')];
    if (areas.length === 0) return;

    // Create SVG overlay
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('image-map-overlay');
    this.#svg = svg;

    // Shared visual tooltip container. Hidden (out of the a11y tree and tab
    // order) unless showing; it is moved after the active anchor so Tab
    // flows anchor → tooltip content → next anchor.
    const tooltip = document.createElement('div');
    tooltip.className = 'image-map-tooltip';
    tooltip.id = `imap-tip-${++uid}`;
    tooltip.hidden = true;
    this.#tooltip = tooltip;

    for (const area of areas) {
      const mapArea = /** @type {MapAreaWc} */ (area);
      const parsed = parseCoords(mapArea.shape, mapArea.coords);
      const svgShape = createSvgShape(parsed);
      if (!svgShape) continue;

      const bbox = calcBoundingBox(parsed);
      const href = area.getAttribute('href');
      const target = area.getAttribute('target') || '';
      const mode = area.getAttribute('tooltip') || 'hover';
      const disabled = area.hasAttribute('disabled');
      const textContent = area.textContent?.trim().replace(/\s+/g, ' ') || '';
      const label = area.getAttribute('label') || textContent;

      // Focus anchor
      const anchor = href ? document.createElement('a') : document.createElement('button');
      if (href) {
        /** @type {HTMLAnchorElement} */ (anchor).href = href;
        if (target) /** @type {HTMLAnchorElement} */ (anchor).target = target;
      } else {
        /** @type {HTMLButtonElement} */ (anchor).type = 'button';
      }

      anchor.className = 'image-map-anchor';
      anchor.textContent = label;

      // Per-area description: point at the (hidden) map-area itself, but only
      // when its content adds something beyond the label.
      const hasContent = mode !== 'none' && (area.children.length > 0 || (textContent && textContent !== label));
      if (hasContent) {
        if (!area.id) {
          area.id = `imap-area-${++uid}`;
          this.#assignedIds.push(area);
        }
        if (mode === 'click') {
          anchor.setAttribute('aria-expanded', 'false');
          anchor.setAttribute('aria-controls', tooltip.id);
        } else {
          anchor.setAttribute('aria-describedby', area.id);
        }
      }

      // Position anchor over the bounding box (image percentages are physical)
      anchor.style.left = `${bbox.x}%`;
      anchor.style.top = `${bbox.y}%`;
      anchor.style.width = `${bbox.width}%`;
      anchor.style.height = `${bbox.height}%`;

      if (disabled) {
        svgShape.setAttribute('data-disabled', '');
        anchor.setAttribute('tabindex', '-1');
        anchor.setAttribute('aria-disabled', 'true');
      }

      const data = { area, parsed, svgShape, anchor, href, target, mode, hasContent, keyboardOpen: false };

      if (!disabled) this.#wireArea(data);

      svg.appendChild(svgShape);
      this.#areaData.push(data);
      this.#focusAnchors.push(anchor);
    }

    // Append generated DOM
    this.appendChild(svg);
    for (const anchor of this.#focusAnchors) {
      this.appendChild(anchor);
    }
    this.appendChild(tooltip);

    // Hoverable tooltip (WCAG 1.4.13): entering it cancels the pending hide.
    this.listen(tooltip, 'pointerenter', () => clearTimeout(this.#hideTimer));
    this.listen(tooltip, 'pointerleave', () => {
      if (this.#activeArea?.mode === 'hover' && !this.#focusWithinActive()) this.#scheduleHide();
    });
    this.listen(tooltip, 'focusout', (e) => {
      const next = /** @type {Node | null} */ (/** @type {FocusEvent} */ (e).relatedTarget);
      if (next && (tooltip.contains(next) || next === this.#activeArea?.anchor)) return;
      this.#hideTooltip();
    });

    // Keyboard navigation on host
    this.listen(this, 'keydown', this.#onKeyDown);

    // Dismissal from anywhere: Escape while visible, tap/click outside.
    this.listen(document, 'keydown', this.#onDocumentKeyDown);
    this.listen(document, 'pointerdown', this.#onDocumentPointerDown);

    // Fixed-position tooltip: follow scroll/resize.
    this.listen(window, 'scroll', this.#queueReposition, { passive: true, capture: true });
    this.#resizeObs = new ResizeObserver(this.#queueReposition);
    this.#resizeObs.observe(this.#img);

    // ARIA
    this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
      this.setAttribute('aria-label', this.#img.alt || this.dataset.labelMap || 'Image map');
    }
  }

  /** Wire pointer, touch, focus and activation handlers for one area. */
  #wireArea(data) {
    const { svgShape, anchor, area, mode } = data;

    this.listen(svgShape, 'pointerenter', () => {
      clearTimeout(this.#hideTimer);
      if (mode === 'hover') this.#showTooltip(data);
      svgShape.setAttribute('data-hover', '');
      this.#dispatch('image-map:area-enter', area);
    });

    this.listen(svgShape, 'pointerleave', () => {
      if (mode === 'hover' && this.#activeArea === data && !this.#focusWithinActive()) {
        this.#scheduleHide();
      }
      if (document.activeElement !== anchor) svgShape.removeAttribute('data-hover');
      this.#dispatch('image-map:area-leave', area);
    });

    this.listen(svgShape, 'click', () => {
      const evt = this.#activate(data, false);
      // Pointer on the shape: navigate unless click-mode or the event was cancelled.
      if (data.href && mode !== 'click' && !evt.defaultPrevented) {
        if (data.target === '_blank') {
          window.open(data.href, '_blank', 'noopener');
        } else {
          window.location.href = data.href;
        }
      }
    });

    // Touch: two-tap pattern for hover mode
    this.listen(svgShape, 'touchstart', (e) => {
      if (mode === 'hover') {
        if (this.#touchedArea !== data) {
          e.preventDefault();
          this.#touchedArea = data;
          this.#showTooltip(data);
        } else {
          this.#touchedArea = null;
        }
      }
    }, { passive: false });

    // Keyboard / AT activation lands here (Enter on links, Enter/Space on buttons).
    this.listen(anchor, 'click', (e) => {
      const keyboard = /** @type {MouseEvent} */ (e).detail === 0;
      const evt = this.#activate(data, keyboard);
      // Click-mode with a link toggles the tooltip instead of navigating, matching the pointer path.
      if (mode === 'click' || evt.defaultPrevented) e.preventDefault();
    });

    // Space on a link: activate like a button for consistency.
    if (data.href) {
      this.listen(anchor, 'keydown', (e) => {
        if (/** @type {KeyboardEvent} */ (e).key === ' ') {
          e.preventDefault();
          anchor.click();
        }
      });
    }

    this.listen(anchor, 'focus', () => {
      clearTimeout(this.#hideTimer);
      if (mode === 'hover') this.#showTooltip(data);
      svgShape.setAttribute('data-hover', '');
      this.#dispatch('image-map:area-enter', area);
    });

    this.listen(anchor, 'blur', (e) => {
      svgShape.removeAttribute('data-hover');
      this.#dispatch('image-map:area-leave', area);
      const next = /** @type {Node | null} */ (/** @type {FocusEvent} */ (e).relatedTarget);
      if (this.#activeArea === data && !(next && this.#tooltip?.contains(next))) {
        this.#hideTooltip();
      }
    });
  }

  /**
   * Shared activation for pointer and keyboard. Toggles click-mode tooltips
   * and dispatches a cancelable image-map:area-activate.
   * @returns {CustomEvent}
   */
  #activate(data, keyboard) {
    if (data.mode === 'click' && data.hasContent) {
      if (this.#activeArea === data) {
        this.#hideTooltip();
      } else {
        this.#showTooltip(data);
        if (keyboard) {
          data.keyboardOpen = true;
          const first = /** @type {HTMLElement | null} */ (this.#tooltip?.querySelector(FOCUSABLE));
          if (first) first.focus();
        }
      }
    }
    return this.#dispatch('image-map:area-activate', data.area, true);
  }

  #focusWithinActive() {
    const active = document.activeElement;
    return !!(active && this.#tooltip?.contains(active));
  }

  #scheduleHide() {
    clearTimeout(this.#hideTimer);
    this.#hideTimer = setTimeout(() => this.#hideTooltip(), HIDE_DELAY);
  }

  #showTooltip(data) {
    const tooltip = this.#tooltip;
    if (!tooltip || data.mode === 'none' || !data.hasContent) return;
    clearTimeout(this.#hideTimer);
    if (this.#activeArea && this.#activeArea !== data) this.#hideTooltip();

    this.#activeArea = data;
    tooltip.replaceChildren(...[...data.area.childNodes].map(n => n.cloneNode(true)));
    // Hover tooltips describe; click-mode content is a disclosed region.
    if (data.mode === 'click') {
      tooltip.removeAttribute('role');
      tooltip.setAttribute('role', 'group');
      tooltip.setAttribute('aria-label', data.anchor.textContent || '');
      data.anchor.setAttribute('aria-expanded', 'true');
    } else {
      tooltip.setAttribute('role', 'tooltip');
      tooltip.removeAttribute('aria-label');
    }
    // Keep reading/tab order: tooltip follows its anchor.
    if (data.anchor.nextSibling !== tooltip) data.anchor.after(tooltip);
    tooltip.hidden = false;
    tooltip.setAttribute('data-visible', '');
    this.#positionTooltip(data.svgShape);
  }

  /** @param {{ restoreFocus?: boolean }} [opts] */
  #hideTooltip({ restoreFocus = false } = {}) {
    clearTimeout(this.#hideTimer);
    const data = this.#activeArea;
    const tooltip = this.#tooltip;
    if (!tooltip || !data) return;

    const hadFocus = this.#focusWithinActive();
    this.#activeArea = null;
    data.keyboardOpen = false;
    if (data.mode === 'click' && data.anchor.hasAttribute('aria-expanded')) {
      data.anchor.setAttribute('aria-expanded', 'false');
    }
    tooltip.removeAttribute('data-visible');
    tooltip.hidden = true;
    tooltip.replaceChildren();
    if (restoreFocus || hadFocus) data.anchor.focus();
  }

  #queueReposition = () => {
    if (!this.#activeArea || this.#rafId) return;
    this.#rafId = requestAnimationFrame(() => {
      this.#rafId = 0;
      if (this.#activeArea) this.#positionTooltip(this.#activeArea.svgShape);
    });
  };

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
    // Arrow roving applies between anchors only, not inside tooltip content.
    if (this.#tooltip?.contains(/** @type {Node} */ (e.target))) return;
    const anchors = this.#focusAnchors.filter(a => !a.hasAttribute('aria-disabled'));
    const current = anchors.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    if (current === -1) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight': {
        e.preventDefault();
        anchors[current < anchors.length - 1 ? current + 1 : 0]?.focus();
        break;
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        e.preventDefault();
        anchors[current > 0 ? current - 1 : anchors.length - 1]?.focus();
        break;
      }
    }
  };

  /** Escape dismisses a visible tooltip wherever focus is (WCAG 1.4.13). */
  #onDocumentKeyDown = (e) => {
    if (e.key !== 'Escape') return;
    this.#touchedArea = null;
    if (!this.#activeArea) return;
    e.preventDefault();
    this.#hideTooltip();
  };

  /** Tap/click outside the host and tooltip closes it. */
  #onDocumentPointerDown = (e) => {
    if (!this.#activeArea) return;
    const t = /** @type {Node} */ (e.target);
    if (this.#tooltip?.contains(t)) return;
    // The SVG shapes and anchors handle their own toggling.
    if (this.contains(t) && t !== this && t !== this.#img) return;
    this.#touchedArea = null;
    this.#hideTooltip();
  };

  /**
   * @param {string} name
   * @param {Element} area
   * @param {boolean} [cancelable]
   */
  #dispatch(name, area, cancelable = false) {
    const evt = new CustomEvent(name, {
      detail: { area },
      bubbles: true,
      cancelable,
    });
    this.dispatchEvent(evt);
    return evt;
  }
}

registerComponent('map-area', MapAreaWc);
registerComponent('image-map', ImageMapWc);

export { ImageMapWc, MapAreaWc };
