/**
 * roadmap: Interactive themes × quarters product roadmap
 *
 * Renders a horizontal time axis (quarters or months) with one
 * swimlane per <section data-lane>. Each <article data-start data-end>
 * inside a lane becomes an absolutely-positioned bar spanning its
 * date range.
 *
 * Distinct from <gantt-chart>: roadmap is theme-centric (initiatives
 * in lanes, status as enum, no dependency arrows). Gantt is task-
 * scheduling. Use roadmap for quarterly product roadmaps; gantt for
 * project plans.
 *
 * @attr {string} start         - First date in the range (ISO 8601 or "YYYY-Qn"; required)
 * @attr {string} end           - Last date in the range (ISO 8601 or "YYYY-Qn"; required, inclusive)
 * @attr {string} view          - "quarter" (default) or "month" axis granularity
 * @attr {boolean} editable     - Wires drag-to-reschedule, drag-to-resize, lane drop
 * @attr {boolean} today-marker - Render a vertical line at today's date if it falls in range
 *
 * Children:
 *   <section data-lane="...">                — one swimlane row
 *     <article data-start="..." data-end="..." data-status="..."> — one initiative bar
 *       <h3>Title</h3>
 *       <p>Optional description (visible in detail / tooltip)</p>
 *     </article>
 *   </section>
 *
 * @fires roadmap:select     - { initiative, lane, start, end, status } on click
 * @fires roadmap:reschedule - { initiative, lane, start, end } when bar dragged along time
 * @fires roadmap:resize     - { initiative, lane, start, end } when right edge dragged
 * @fires roadmap:move       - { initiative, fromLane, toLane, start, end } when bar dropped on another lane
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const MS_PER_DAY = 86_400_000;

class Roadmap extends VBElement {
  setup() {
    const startAttr = this.getAttribute('start');
    const endAttr   = this.getAttribute('end');
    if (!startAttr || !endAttr) {
      console.warn('product-roadmap: start and end attributes required');
      return false;
    }
    const start = Roadmap.#parseDate(startAttr, 'start');
    const end   = Roadmap.#parseDate(endAttr,   'end');
    if (!start || !end || end <= start) {
      console.warn('product-roadmap: invalid start/end', startAttr, endAttr);
      return false;
    }
    this.#start = start;
    this.#end = end;
    this.#totalMs = end.getTime() - start.getTime();
    this.#view = (this.getAttribute('view') === 'month') ? 'month' : 'quarter';
    this.#editable = this.hasAttribute('editable');

    /* Snapshot original lane sections (auto-discovery) before we wipe
       the host. We do not modify the original elements until/unless
       drag interactions change their data-* attributes. */
    const lanes = [...this.querySelectorAll(':scope > section[data-lane]')];
    if (!lanes.length) {
      console.warn('product-roadmap: no <section data-lane> children found');
      return false;
    }
    this.#sourceLanes = lanes;
    this.#render();
    return true;
  }

  attributeChangedCallback() {
    if (this.isConnected && this.#sourceLanes.length) this.#render();
  }

  #render() {
    /* Wipe everything except the source lanes (which we re-read on
       each render so author edits to data-start/data-end are picked up). */
    [...this.children].forEach((c) => {
      if (!this.#sourceLanes.includes(c)) c.remove();
    });
    /* Move source lanes out of the host so they don't display directly. */
    this.#sourceLanes.forEach((lane) => { /** @type {HTMLElement} */ (lane).hidden = true; });

    const wrapper = document.createElement('div');
    wrapper.className = 'rm-wrapper';

    /* --- time axis header --- */
    const axis = this.#buildAxis();
    wrapper.appendChild(axis);

    /* --- lanes --- */
    const lanesEl = document.createElement('div');
    lanesEl.className = 'rm-lanes';

    for (const sourceLane of this.#sourceLanes) {
      const laneName = sourceLane.getAttribute('data-lane') || '';
      const laneEl = document.createElement('section');
      laneEl.className = 'rm-lane';
      laneEl.dataset.lane = laneName;

      const laneLabel = document.createElement('header');
      laneLabel.className = 'rm-lane-label';
      laneLabel.textContent = laneName;
      laneEl.appendChild(laneLabel);

      const track = document.createElement('div');
      track.className = 'rm-track';
      track.dataset.lane = laneName;

      /* For each <article> in the source lane, build a bar. */
      const initiatives = [...sourceLane.querySelectorAll(':scope > article[data-start][data-end]')];
      for (const init of initiatives) {
        const bar = this.#buildBar(init, laneName);
        if (bar) track.appendChild(bar);
      }

      if (this.#editable) {
        track.addEventListener('dragover', this.#onTrackDragOver);
        track.addEventListener('drop', this.#onTrackDrop);
      }

      laneEl.appendChild(track);
      lanesEl.appendChild(laneEl);
    }

    wrapper.appendChild(lanesEl);

    if (this.hasAttribute('today-marker') && this.#start && this.#end) {
      const today = new Date();
      if (today >= this.#start && today <= this.#end) {
        const marker = document.createElement('div');
        marker.className = 'rm-today';
        marker.style.setProperty('--rm-x', this.#fractionFor(today).toFixed(4));
        marker.title = `Today: ${Roadmap.#toISO(today)}`;
        lanesEl.appendChild(marker);
      }
    }

    this.appendChild(wrapper);
    this.#wrapper = wrapper;
  }

  #buildAxis() {
    const axis = document.createElement('header');
    axis.className = 'rm-axis';
    const ticks = this.#enumerateTicks();
    for (const tick of ticks) {
      const cell = document.createElement('div');
      cell.className = 'rm-tick';
      cell.style.setProperty('--rm-x', tick.startFraction.toFixed(4));
      cell.style.setProperty('--rm-w', (tick.endFraction - tick.startFraction).toFixed(4));
      cell.textContent = tick.label;
      axis.appendChild(cell);
    }
    return axis;
  }

  #buildBar(initiative, laneName) {
    const start = Roadmap.#parseDate(initiative.getAttribute('data-start'), 'start');
    const end   = Roadmap.#parseDate(initiative.getAttribute('data-end'),   'end');
    if (!start || !end || !this.#start || !this.#end) return null;

    /* Clip to visible range. */
    const clipStart = start < this.#start ? this.#start : start;
    const clipEnd   = end > this.#end ? this.#end : end;
    if (clipStart >= clipEnd) return null;

    const x = this.#fractionFor(clipStart);
    const w = this.#fractionFor(clipEnd) - x;

    const bar = document.createElement('article');
    bar.className = 'rm-bar';
    bar.style.setProperty('--rm-x', x.toFixed(4));
    bar.style.setProperty('--rm-w', w.toFixed(4));
    bar.dataset.lane = laneName;
    bar.dataset.start = Roadmap.#toISO(start);
    bar.dataset.end = Roadmap.#toISO(end);
    if (initiative.dataset.status) bar.dataset.status = initiative.dataset.status;
    if (initiative.id) bar.dataset.sourceId = initiative.id;
    if (this.#editable) bar.setAttribute('draggable', 'true');

    /* Inner content: clone the title and details. */
    const title = initiative.querySelector('h1, h2, h3, h4, h5, h6');
    const heading = document.createElement('span');
    heading.className = 'rm-bar-title';
    heading.textContent = title ? title.textContent.trim() : (initiative.textContent || '').trim().split('\n')[0];
    bar.appendChild(heading);

    bar.setAttribute('aria-label', `${heading.textContent} — ${bar.dataset.start} to ${bar.dataset.end} in ${laneName}`);

    /* Click to select. */
    bar.addEventListener('click', (e) => {
      if (this.#dragInfo) return;
      this.dispatchEvent(new CustomEvent('product-roadmap:select', {
        bubbles: true,
        detail: {
          initiative: initiative,
          lane: laneName,
          start: bar.dataset.start,
          end: bar.dataset.end,
          status: bar.dataset.status || null,
        },
      }));
    });

    if (this.#editable) {
      /* Resize handle. */
      const handle = document.createElement('span');
      handle.className = 'rm-bar-handle';
      handle.setAttribute('aria-label', 'Resize end date');
      bar.appendChild(handle);

      handle.addEventListener('pointerdown', (e) => this.#startResize(e, bar, initiative));
      bar.addEventListener('pointerdown', (e) => {
        if (e.target === handle) return;
        this.#startMove(e, bar, initiative);
      });

      /* HTML5 DnD for cross-lane drops. */
      bar.addEventListener('dragstart', (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', initiative.id || bar.dataset.sourceId || '');
        }
        this.#draggingInitiative = initiative;
        this.#draggingFromLane = laneName;
      });
      bar.addEventListener('dragend', () => {
        this.#draggingInitiative = null;
        this.#draggingFromLane = null;
      });
    }

    return bar;
  }

  /* --- pointer drag (move along time axis) --- */
  #startMove(e, bar, initiative) {
    if (e.button !== 0) return;
    e.preventDefault();
    const trackRect = bar.parentElement.getBoundingClientRect();
    const startX = e.clientX;
    const startFraction = parseFloat(bar.style.getPropertyValue('--rm-x')) || 0;
    const widthFraction = parseFloat(bar.style.getPropertyValue('--rm-w')) || 0;

    this.#dragInfo = { kind: 'move', bar, initiative, trackRect, startX, startFraction, widthFraction };
    bar.setPointerCapture(e.pointerId);
    bar.addEventListener('pointermove', this.#onPointerMove);
    bar.addEventListener('pointerup',   this.#onPointerUp);
    bar.addEventListener('pointercancel', this.#onPointerUp);
  }

  #startResize(e, bar, initiative) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const trackRect = bar.parentElement.getBoundingClientRect();
    const startX = e.clientX;
    const startFraction = parseFloat(bar.style.getPropertyValue('--rm-x')) || 0;
    const widthFraction = parseFloat(bar.style.getPropertyValue('--rm-w')) || 0;

    this.#dragInfo = { kind: 'resize', bar, initiative, trackRect, startX, startFraction, widthFraction };
    bar.setPointerCapture(e.pointerId);
    bar.addEventListener('pointermove', this.#onPointerMove);
    bar.addEventListener('pointerup',   this.#onPointerUp);
    bar.addEventListener('pointercancel', this.#onPointerUp);
  }

  #onPointerMove = (e) => {
    if (!this.#dragInfo) return;
    const { kind, bar, trackRect, startX, startFraction, widthFraction } = this.#dragInfo;
    const dxFraction = (e.clientX - startX) / trackRect.width;

    if (kind === 'move') {
      const newStart = Math.max(0, Math.min(1 - widthFraction, startFraction + dxFraction));
      bar.style.setProperty('--rm-x', newStart.toFixed(4));
    } else if (kind === 'resize') {
      const newWidth = Math.max(0.02, Math.min(1 - startFraction, widthFraction + dxFraction));
      bar.style.setProperty('--rm-w', newWidth.toFixed(4));
    }
  };

  #onPointerUp = (e) => {
    if (!this.#dragInfo) return;
    const { kind, bar, initiative } = this.#dragInfo;
    bar.releasePointerCapture(e.pointerId);
    bar.removeEventListener('pointermove', this.#onPointerMove);
    bar.removeEventListener('pointerup',   this.#onPointerUp);
    bar.removeEventListener('pointercancel', this.#onPointerUp);

    /* Snap to grid (quarter or month boundary) and update dates. */
    const xFrac = parseFloat(bar.style.getPropertyValue('--rm-x')) || 0;
    const wFrac = parseFloat(bar.style.getPropertyValue('--rm-w')) || 0;
    const snappedStart = this.#snapDate(this.#dateForFraction(xFrac));
    const snappedEnd   = this.#snapDate(this.#dateForFraction(xFrac + wFrac));

    bar.dataset.start = Roadmap.#toISO(snappedStart);
    bar.dataset.end   = Roadmap.#toISO(snappedEnd);
    /* Re-snap visual to grid after drag. */
    const snappedX = this.#fractionFor(snappedStart);
    const snappedW = this.#fractionFor(snappedEnd) - snappedX;
    bar.style.setProperty('--rm-x', snappedX.toFixed(4));
    bar.style.setProperty('--rm-w', snappedW.toFixed(4));

    /* Mirror back to the source <article> so the author's data is updated. */
    if (initiative) {
      initiative.setAttribute('data-start', bar.dataset.start ?? '');
      initiative.setAttribute('data-end',   bar.dataset.end ?? '');
    }

    this.dispatchEvent(new CustomEvent(kind === 'move' ? 'product-roadmap:reschedule' : 'product-roadmap:resize', {
      bubbles: true,
      detail: {
        initiative,
        lane: bar.dataset.lane,
        start: bar.dataset.start,
        end: bar.dataset.end,
      },
    }));

    /* Clear dragInfo on next tick so any pending click event sees it
       and skips select. */
    setTimeout(() => { this.#dragInfo = null; }, 0);
  };

  #onTrackDragOver = (e) => {
    if (!this.#draggingInitiative) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  #onTrackDrop = (e) => {
    if (!this.#draggingInitiative) return;
    e.preventDefault();
    const targetLane = e.currentTarget.dataset.lane;
    const initiative = this.#draggingInitiative;
    const fromLane = this.#draggingFromLane;
    if (targetLane === fromLane) return;

    /* Move the source <article> to the new <section data-lane>. */
    const newSourceLane = this.#sourceLanes.find((l) => l.getAttribute('data-lane') === targetLane);
    if (newSourceLane) newSourceLane.appendChild(initiative);

    this.dispatchEvent(new CustomEvent('product-roadmap:move', {
      bubbles: true,
      detail: {
        initiative,
        fromLane,
        toLane: targetLane,
        start: initiative.getAttribute('data-start'),
        end: initiative.getAttribute('data-end'),
      },
    }));

    this.#render();
  };

  /* --- date math --- */
  #fractionFor(date) {
    if (!this.#start) return 0;
    const ms = date.getTime() - this.#start.getTime();
    return Math.max(0, Math.min(1, ms / this.#totalMs));
  }

  #dateForFraction(frac) {
    const start = this.#start ?? new Date();
    return new Date(start.getTime() + frac * this.#totalMs);
  }

  #snapDate(date) {
    if (this.#view === 'month') {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    /* Quarter snap: round to nearest quarter boundary. */
    const month = date.getMonth();
    const qStartMonth = Math.floor(month / 3) * 3;
    return new Date(date.getFullYear(), qStartMonth, 1);
  }

  #enumerateTicks() {
    const ticks = [];
    const start = this.#start;
    const end = this.#end;
    if (!start || !end) return ticks;
    if (this.#view === 'quarter') {
      let cursor = this.#snapDate(start);
      while (cursor < end) {
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
        const startFraction = this.#fractionFor(cursor < start ? start : cursor);
        const endFraction   = this.#fractionFor(next > end ? end : next);
        const q = Math.floor(cursor.getMonth() / 3) + 1;
        ticks.push({ startFraction, endFraction, label: `Q${q} ${cursor.getFullYear()}` });
        cursor = next;
      }
    } else {
      let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor < end) {
        const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        const startFraction = this.#fractionFor(cursor < start ? start : cursor);
        const endFraction   = this.#fractionFor(next > end ? end : next);
        const m = cursor.toLocaleString(undefined, { month: 'short' });
        ticks.push({ startFraction, endFraction, label: `${m} ${cursor.getFullYear()}` });
        cursor = next;
      }
    }
    return ticks;
  }

  /** Parse "2026-Q3", "2026-Q3-end", or ISO date. `kind` decides how
      "YYYY-Qn" without explicit position resolves: 'start' → first day
      of the quarter; 'end' → last day. */
  static #parseDate(value, kind) {
    if (!value) return null;
    const q = String(value).match(/^(\d{4})-Q([1-4])$/i);
    if (q) {
      const year = Number(q[1]);
      const quarter = Number(q[2]);
      const monthStart = (quarter - 1) * 3;
      if (kind === 'end') {
        /* Last day of last month of the quarter */
        return new Date(year, monthStart + 3, 0);
      }
      return new Date(year, monthStart, 1);
    }
    const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  static #toISO(d) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  /** @type {Date | null} */
  #start = null;
  /** @type {Date | null} */
  #end = null;
  #totalMs = 0;
  /** @type {"quarter" | "month"} */
  #view = 'quarter';
  #editable = false;
  /** @type {Element[]} */
  #sourceLanes = [];
  /** @type {HTMLElement | null} */
  #wrapper = null;
  /** @type {{ kind: string, bar: HTMLElement, initiative?: Element, trackRect: DOMRect, startX: number, startFraction: number, widthFraction: number } | null} */
  #dragInfo = null;
  /** @type {Element | null} */
  #draggingInitiative = null;
  /** @type {Element | null} */
  #draggingFromLane = null;
}

registerComponent('product-roadmap', Roadmap);

export { Roadmap };
