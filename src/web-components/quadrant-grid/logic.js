/**
 * quadrant-grid: Generic 2x2 quadrant grid primitive
 *
 * Backs SWOT, stakeholder-map, custom 2x2 visualizations. Sister to
 * <impact-effort> (which keeps its hardcoded quick-wins/big-bets API
 * for backward compatibility).
 *
 * Children are placed by either:
 *   - data-quadrant="0..3" — explicit bucket (Cartesian: Q1=top-right,
 *     Q2=top-left, Q3=bottom-left, Q4=bottom-right; numbers 0..3 map to
 *     Q1..Q4)
 *   - data-x="0..1" data-y="0..1" — normalized coordinates; component
 *     computes the quadrant AND positions the child as a labelled dot
 *     inside the cell
 *
 * Optional drag-and-drop via the `draggable` host attribute; composes
 * <drag-surface> the same way <impact-effort> does. Children become
 * draggable cards that can be moved between quadrants.
 *
 * Progressive enhancement:
 *   1. HTML — children with data-quadrant remain visible without JS;
 *      a <dl> static fallback enumerates each quadrant.
 *   2. CSS  — :not(:defined) selector keeps the layout sensible
 *      pre-upgrade; the grid layout is applied once the component
 *      defines.
 *   3. JS   — adds axis labels, computes quadrants for data-x/data-y
 *      children, wires up drag-and-drop when requested, fires
 *      `quadrant-grid:move`.
 *
 * @attr {string} x-label  - X-axis label (default: "")
 * @attr {string} y-label  - Y-axis label (default: "")
 * @attr {string} x-low    - X-axis low-end marker (default: "Low")
 * @attr {string} x-high   - X-axis high-end marker (default: "High")
 * @attr {string} y-low    - Y-axis low-end marker (default: "Low")
 * @attr {string} y-high   - Y-axis high-end marker (default: "High")
 * @attr {string} q1-label - Top-right quadrant title
 * @attr {string} q2-label - Top-left quadrant title
 * @attr {string} q3-label - Bottom-left quadrant title
 * @attr {string} q4-label - Bottom-right quadrant title
 * @attr {boolean} draggable - Enable DnD between quadrants
 *
 * Children attributes:
 * @attr {number} data-quadrant - 0..3 mapping to Q1..Q4
 * @attr {number} data-x        - 0..1 normalized x coordinate
 * @attr {number} data-y        - 0..1 normalized y coordinate
 * @attr {string} data-id       - Stable identifier for moves
 *
 * @fires quadrant-grid:move - { item, itemId, from, to, x?, y? }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class QuadrantGrid extends VBElement {
  static #instanceCount = 0;

  setup() {
    this.#groupId = `qg-${++QuadrantGrid.#instanceCount}`;

    const xLabel = this.getAttribute('x-label') || '';
    const yLabel = this.getAttribute('y-label') || '';
    const xLow   = this.getAttribute('x-low')   || 'Low';
    const xHigh  = this.getAttribute('x-high')  || 'High';
    const yLow   = this.getAttribute('y-low')   || 'Low';
    const yHigh  = this.getAttribute('y-high')  || 'High';
    const qLabels = [
      this.getAttribute('q1-label') || 'Q1',
      this.getAttribute('q2-label') || 'Q2',
      this.getAttribute('q3-label') || 'Q3',
      this.getAttribute('q4-label') || 'Q4',
    ];
    const draggable = this.hasAttribute('draggable');

    const children = [...this.querySelectorAll(':scope > [data-quadrant], :scope > [data-x][data-y]')];

    const wrapper = document.createElement('section');
    wrapper.className = 'qg-wrapper';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', `${yLabel} × ${xLabel} quadrant grid`);

    const yLabelEl = document.createElement('header');
    yLabelEl.className = 'qg-y-label';
    yLabelEl.setAttribute('aria-hidden', 'true');
    yLabelEl.textContent = `↑ ${yLabel}`;

    const yScale = document.createElement('aside');
    yScale.className = 'qg-y-scale';
    yScale.setAttribute('aria-hidden', 'true');
    yScale.innerHTML = `<span>${yHigh}</span><span>${yLow}</span>`;

    const grid = document.createElement('div');
    grid.className = 'qg-grid';

    const xScale = document.createElement('aside');
    xScale.className = 'qg-x-scale';
    xScale.setAttribute('aria-hidden', 'true');
    xScale.innerHTML = `<span>${xLow}</span><span>${xHigh}</span>`;

    const xLabelEl = document.createElement('footer');
    xLabelEl.className = 'qg-x-label';
    xLabelEl.setAttribute('aria-hidden', 'true');
    xLabelEl.textContent = `${xLabel} →`;

    /* Cartesian DOM order: place sections in the visual grid by index.
       Indices 0..3 correspond to Q1..Q4. CSS grid-area positions them. */
    for (let q = 0; q < 4; q++) {
      const section = document.createElement('section');
      section.className = 'qg-quadrant';
      section.dataset.quadrantZone = String(q);
      section.setAttribute('aria-label', qLabels[q]);

      const header = document.createElement('header');
      header.className = 'qg-quadrant-label';
      header.textContent = qLabels[q];

      section.appendChild(header);

      if (draggable) {
        const surface = document.createElement('drag-surface');
        surface.setAttribute('group', this.#groupId);
        surface.setAttribute('aria-label', qLabels[q]);
        surface.setAttribute('data-layout', 'stack');
        surface.setAttribute('data-layout-gap', 'xs');
        section.appendChild(surface);
        this.#surfaces[q] = surface;
      } else {
        const list = document.createElement('ul');
        list.className = 'qg-items';
        section.appendChild(list);
        this.#lists[q] = list;
      }

      grid.appendChild(section);
      this.#sections[q] = section;
    }

    /* Distribute captured children into matching quadrants. */
    children.forEach((child, i) => {
      const q = this.#resolveQuadrant(child);
      const target = draggable ? this.#surfaces[q] : this.#lists[q];

      if (draggable) {
        if (!child.hasAttribute('draggable')) child.setAttribute('draggable', 'true');
      }
      if (!child.hasAttribute('data-id')) child.dataset.id = `qg-item-${i}`;

      // Coordinate-positioned children: compute section-local coords
      // (each quadrant spans half the grid; convert document 0..1 to
      // section 0..1) and pin via --qg-local-x / --qg-local-y.
      if (child.hasAttribute('data-x') && child.hasAttribute('data-y')) {
        const x = parseFloat(child.getAttribute('data-x'));
        const y = parseFloat(child.getAttribute('data-y'));
        if (Number.isFinite(x) && Number.isFinite(y)) {
          const localX = q === 0 || q === 3 ? (x - 0.5) * 2 : x * 2;
          const localY = q === 0 || q === 1 ? (y - 0.5) * 2 : y * 2;
          child.style.setProperty('--qg-local-x', localX.toFixed(4));
          child.style.setProperty('--qg-local-y', localY.toFixed(4));
          child.classList.add('qg-pinned');
        }
      }

      // Wrap non-drag children in <li> so list semantics hold.
      if (draggable) {
        target.appendChild(child);
      } else {
        const li = document.createElement('li');
        li.appendChild(child);
        target.appendChild(li);
      }
    });

    /* Live region for screen-reader announcements on move. */
    const liveRegion = document.createElement('div');
    liveRegion.className = 'qg-live-region visually-hidden';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');

    /* Assembly: 3-col grid (y-scale | grid | spacer) over 3 rows (label | grid | x-scale + label) */
    wrapper.appendChild(yLabelEl);
    wrapper.appendChild(yScale);
    wrapper.appendChild(grid);
    wrapper.appendChild(xScale);
    wrapper.appendChild(xLabelEl);
    this.appendChild(wrapper);
    this.appendChild(liveRegion);

    this.#grid = grid;
    this.#liveRegion = liveRegion;
    this.#qLabels = qLabels;

    if (draggable) {
      this.listen(this, 'drag-surface:transfer', this.#onTransfer);
    }
  }

  #onTransfer = (e) => {
    const { item, fromSurface, toSurface } = e.detail;
    const from = this.#findQuadrantForSurface(fromSurface);
    const to = this.#findQuadrantForSurface(toSurface);
    if (from == null || to == null) return;

    item.setAttribute('data-quadrant', String(to));
    this.#announce(`Moved ${this.#itemLabel(item)} to ${this.#qLabels[to]}`);

    this.dispatchEvent(new CustomEvent('quadrant-grid:move', {
      bubbles: true,
      detail: {
        item,
        itemId: item.dataset.id,
        from,
        to,
      },
    }));
  };

  #resolveQuadrant(child) {
    const q = parseInt(child.getAttribute('data-quadrant'), 10);
    if (q >= 0 && q <= 3) return q;
    if (child.hasAttribute('data-x') && child.hasAttribute('data-y')) {
      const x = parseFloat(child.getAttribute('data-x'));
      const y = parseFloat(child.getAttribute('data-y'));
      return QuadrantGrid.quadrantFor(x, y);
    }
    return 0;
  }

  /**
   * Map normalized (x, y) coordinates in [0..1] to a Cartesian quadrant
   * index 0..3 (Q1=top-right, Q2=top-left, Q3=bottom-left, Q4=bottom-right).
   * The midpoint (0.5) belongs to the higher quadrant.
   */
  static quadrantFor(x, y) {
    const right = x >= 0.5;
    const top   = y >= 0.5;
    if (top && right)  return 0;
    if (top && !right) return 1;
    if (!top && !right) return 2;
    return 3;
  }

  #findQuadrantForSurface(surface) {
    for (let q = 0; q < 4; q++) {
      if (this.#surfaces[q] === surface) return q;
    }
    return null;
  }

  #itemLabel(item) {
    return (item.textContent || '').trim().split('\n')[0] || 'item';
  }

  #announce(message) {
    if (this.#liveRegion) this.#liveRegion.textContent = message;
  }

  #groupId = '';
  /** @type {Record<number, HTMLElement>} */
  #surfaces = {};
  /** @type {Record<number, HTMLElement>} */
  #lists = {};
  /** @type {Record<number, HTMLElement>} */
  #sections = {};
  /** @type {HTMLElement | null} */
  #grid = null;
  /** @type {HTMLElement | null} */
  #liveRegion = null;
  /** @type {string[]} */
  #qLabels = [];
}

registerComponent('quadrant-grid', QuadrantGrid);

export { QuadrantGrid };
