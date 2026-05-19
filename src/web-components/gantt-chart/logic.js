/**
 * <gantt-chart> — HTML-first project schedule visualization
 *
 * Progressively enhances a semantic <table> with <time>, <progress>,
 * and <data> elements into an interactive Gantt timeline.
 *
 * Without JS: renders as a readable data table with progress bars.
 * With JS: visual timeline with bars, groups, milestones, and today line.
 *
 * @attr {string} title - Chart heading
 * @attr {string} src - URL to JSON task data
 * @attr {string} view - Timeline granularity: auto|day|week|month|quarter
 * @attr {boolean} show-today - Show vertical today marker
 * @attr {boolean} show-progress - Show progress fill in bars
 * @attr {boolean} show-dependencies - Draw dependency arrows
 * @attr {boolean} compact - Reduced spacing variant
 *
 * Child <tr> attributes:
 * @attr {string} data-task-id - Unique task identifier
 * @attr {string} data-group - Swim lane group
 * @attr {string} data-depends - Comma-separated dependency task IDs
 * @attr {string} data-status - not-started|in-progress|done|blocked
 * @attr {string} data-assignee - Assignee name
 * @attr {boolean} data-milestone - Render as diamond instead of bar
 * @attr {string} data-color - Custom bar color
 * @attr {string} data-story-ids - Comma-separated linked user-story IDs
 * @attr {string} data-item-ids - Comma-separated linked work-item IDs
 *
 * @fires gantt-chart:ready - After initial render
 * @fires gantt-chart:task-click - Task bar clicked
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/* ── Date helpers (adapted from chart-wc TimeScale) ── */

const DAY  = 86_400_000;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const QUARTER = DAY * 91;
const YEAR = DAY * 365;

function toTimestamp(value) {
  if (typeof value === 'number') return value;
  const d = new Date(value);
  return d.getTime();
}

function pickFormatter(rangeMs) {
  if (rangeMs <= WEEK * 3) {
    return (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (rangeMs <= MONTH * 3) {
    return (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  if (rangeMs <= YEAR) {
    return (d) => d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  }
  return (d) => d.toLocaleDateString(undefined, { year: 'numeric' });
}

function resolveView(rangeMs) {
  if (rangeMs <= WEEK * 3) return 'day';
  if (rangeMs <= MONTH * 3) return 'week';
  if (rangeMs <= YEAR) return 'month';
  return 'quarter';
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Component ─────────────────────────────────────── */

class GanttChart extends VBElement {
  static get observedAttributes() {
    return ['src', 'title', 'view', 'show-today', 'show-progress', 'show-dependencies', 'compact'];
  }

  /** @type {HTMLDivElement|null} */
  #container = null;
  /** @type {HTMLDivElement|null} */
  #liveRegion = null;
  /** @type {HTMLElement|null} */
  #titleEl = null;
  /** @type {Array<Object>} */
  #tasks = [];
  /** @type {number} */
  #rangeStart = 0;
  /** @type {number} */
  #rangeEnd = 0;
  /** @type {number} */
  #rangeTotal = 0;

  setup() {
    const table = this.querySelector(':scope > table');
    if (!table) return false;

    // 1. Parse tasks from table
    this.#tasks = this.#parseTasks(table);
    if (this.#tasks.length === 0) return false;

    // 2. Calculate date range
    this.#rangeStart = Math.min(...this.#tasks.map(t => t.start));
    this.#rangeEnd = Math.max(...this.#tasks.map(t => t.end));
    this.#rangeTotal = this.#rangeEnd - this.#rangeStart;
    if (this.#rangeTotal <= 0) this.#rangeTotal = DAY; // minimum 1 day

    // 3. Build enhanced DOM
    this.#build(table);

    // 4. Dispatch ready
    this.dispatchEvent(new CustomEvent('gantt-chart:ready', {
      bubbles: true,
      detail: {
        taskCount: this.#tasks.length,
        dateRange: {
          start: new Date(this.#rangeStart).toISOString(),
          end: new Date(this.#rangeEnd).toISOString(),
        },
      },
    }));
    return true;
  }

  teardown() {
    if (this.#titleEl) { this.#titleEl.remove(); this.#titleEl = null; }
    if (this.#container) { this.#container.remove(); this.#container = null; }
    if (this.#liveRegion) { this.#liveRegion.remove(); this.#liveRegion = null; }

    // Restore the table visibility
    const table = this.querySelector('table.gc-sr-only');
    if (table) table.classList.remove('gc-sr-only');

    this.#tasks = [];
  }

  /** @type {number} */
  static #vtCounter = 0;

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'src') {
      this._loadSrc(newValue);
    } else if (this.hasAttribute('data-upgraded')) {
      this.#refresh();
    }
  }

  /**
   * Tear down and re-setup, wrapped in a View Transition so the swap
   * crossfades instead of flashing. Same pattern as diagram-wc and
   * site-map-wc.
   */
  #refresh() {
    const swap = () => {
      this.teardown();
      this.removeAttribute('data-upgraded');
      this.setup();
    };
    if (this.hasAttribute('data-upgraded')
        && 'startViewTransition' in document
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const name = `gc-vt-${++GanttChart.#vtCounter}`;
      this.style.viewTransitionName = name;
      const tx = document.startViewTransition(swap);
      tx.finished.finally(() => { this.style.viewTransitionName = ''; });
    } else {
      swap();
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current task list. After upgrade this reflects the parsed
   * <table> rows; after assignment, it reflects whatever was passed in.
   * Each entry: { id, name, start, end, progress?, group?, depends?,
   * status?, assignee?, milestone?, color?, storyIds?, itemIds? }.
   */
  get tasks() { return this.#tasks; }

  /**
   * Replace the task set and re-render. Accepts plain task objects with
   * start/end as ISO strings or timestamps; both are normalized.
   *
   * Note: v1 is record-shaped (full rebuild on assignment). Per-bar
   * preservation across diffs is on the roadmap for when drag-resize
   * state preservation becomes a felt need.
   */
  set tasks(value) {
    const next = (value || []).map((t, i) => ({
      id: t.id ?? `gc-task-${i}`,
      name: t.name ?? `Task ${i + 1}`,
      start: typeof t.start === 'number' ? t.start : toTimestamp(t.start),
      end: typeof t.end === 'number' ? t.end : (t.end != null ? toTimestamp(t.end) : (typeof t.start === 'number' ? t.start : toTimestamp(t.start))),
      progress: t.progress ?? 0,
      group: t.group ?? null,
      depends: Array.isArray(t.depends) ? t.depends : (t.depends ? String(t.depends).split(',').map(s => s.trim()) : []),
      status: t.status ?? null,
      assignee: t.assignee ?? null,
      milestone: !!t.milestone,
      color: t.color ?? null,
      storyIds: t.storyIds ?? [],
      itemIds: t.itemIds ?? [],
    }));

    // Tear down existing chrome and re-render from the new task list.
    if (this.#container || this.#titleEl || this.#liveRegion) {
      if (this.#titleEl) { this.#titleEl.remove(); this.#titleEl = null; }
      if (this.#container) { this.#container.remove(); this.#container = null; }
      if (this.#liveRegion) { this.#liveRegion.remove(); this.#liveRegion = null; }
    }

    this.#tasks = next;

    if (next.length > 0) {
      this.#rangeStart = Math.min(...next.map(t => t.start));
      this.#rangeEnd = Math.max(...next.map(t => t.end));
      this.#rangeTotal = this.#rangeEnd - this.#rangeStart;
      if (this.#rangeTotal <= 0) this.#rangeTotal = DAY;

      // Source <table> may not exist (JS-first scaffold). Find or create one
      // for the build path; we hide it via gc-sr-only either way.
      let table = this.querySelector(':scope > table');
      if (!table) {
        table = document.createElement('table');
        table.classList.add('gc-sr-only');
        this.appendChild(table);
      }
      this.#build(table);
    }

    this.dispatchEvent(new CustomEvent('gantt-chart:tasks-changed', {
      detail: { tasks: next, source: 'property' },
      bubbles: true,
    }));
  }

  /* ── Table parsing ─────────────────────────────── */

  #parseTasks(table) {
    const rows = table.querySelectorAll('tbody tr');
    const tasks = [];

    for (let i = 0; i < rows.length; i++) {
      const row = /** @type {HTMLTableRowElement} */ (rows[i]);
      const times = row.querySelectorAll('time[datetime]');
      if (times.length < 2 && !row.hasAttribute('data-milestone')) continue;

      const startStr = times[0]?.getAttribute('datetime');
      const endStr = times.length > 1 ? times[1].getAttribute('datetime') : startStr;
      if (!startStr) continue;

      const progressEl = row.querySelector('progress');
      const progressValue = progressEl ? (progressEl.value / (progressEl.max || 100)) : 0;

      const name = row.cells[0]?.textContent?.trim() || `Task ${i + 1}`;

      tasks.push({
        id: row.dataset.taskId || `gc-task-${i}`,
        name,
        start: toTimestamp(startStr),
        end: toTimestamp(endStr),
        progress: progressValue,
        group: row.dataset.group || null,
        depends: row.dataset.depends ? row.dataset.depends.split(',').map(s => s.trim()) : [],
        status: row.dataset.status || null,
        assignee: row.dataset.assignee || null,
        milestone: row.hasAttribute('data-milestone'),
        color: row.dataset.color || null,
        storyIds: row.dataset.storyIds ? row.dataset.storyIds.split(',').map(s => s.trim()) : [],
        itemIds: row.dataset.itemIds ? row.dataset.itemIds.split(',').map(s => s.trim()) : [],
      });
    }

    return tasks;
  }

  /* ── Build enhanced DOM ────────────────────────── */

  #build(table) {
    const title = this.getAttribute('title');
    const showToday = this.hasAttribute('show-today');
    const showProgress = this.hasAttribute('show-progress');
    const showDeps = this.hasAttribute('show-dependencies');

    // Title
    if (title) {
      this.#titleEl = document.createElement('h2');
      this.#titleEl.className = 'gc-title';
      this.#titleEl.textContent = title;
      this.insertBefore(this.#titleEl, table);
    }

    // Container
    this.#container = document.createElement('div');
    this.#container.className = 'gc-container';
    this.#container.setAttribute('role', 'region');
    this.#container.setAttribute('aria-label', `Gantt chart${title ? ': ' + title : ''}`);

    // Timeline header
    const header = this.#buildTimelineHeader();
    this.#container.appendChild(header);

    // Body: task list + bars
    const body = document.createElement('div');
    body.className = 'gc-body';

    const taskList = document.createElement('div');
    taskList.className = 'gc-task-list';

    const barsPanel = document.createElement('div');
    barsPanel.className = 'gc-bars';

    // Grid lines
    const gridLines = this.#buildGridLines();
    barsPanel.appendChild(gridLines);

    // Group tasks
    const grouped = this.#groupTasks();

    for (const [groupName, groupTasks] of grouped) {
      // Group header (if there are multiple groups)
      if (grouped.size > 1 && groupName) {
        const groupHeader = document.createElement('div');
        groupHeader.className = 'gc-group-header';
        const label = document.createElement('span');
        label.className = 'gc-group-label';
        label.textContent = groupName;
        groupHeader.appendChild(label);
        taskList.appendChild(groupHeader);

        const spacer = document.createElement('div');
        spacer.className = 'gc-group-spacer';
        barsPanel.appendChild(spacer);
      }

      for (const task of groupTasks) {
        // Task row (left)
        const taskRow = document.createElement('div');
        taskRow.className = 'gc-task-row';
        taskRow.setAttribute('data-task-id', task.id);

        const taskName = document.createElement('span');
        taskName.className = 'gc-task-name';
        taskName.textContent = task.name;
        taskRow.appendChild(taskName);

        // SR-only date range
        const taskDates = document.createElement('span');
        taskDates.className = 'gc-task-dates';
        taskDates.textContent = `${new Date(task.start).toLocaleDateString()} to ${new Date(task.end).toLocaleDateString()}`;
        taskRow.appendChild(taskDates);

        taskList.appendChild(taskRow);

        // Bar row (right)
        const barRow = document.createElement('div');
        barRow.className = 'gc-bar-row';

        if (task.milestone) {
          barRow.appendChild(this.#buildMilestone(task));
        } else {
          barRow.appendChild(this.#buildBar(task, showProgress));
        }

        barsPanel.appendChild(barRow);
      }
    }

    // Today line
    if (showToday) {
      const todayLine = this.#buildTodayLine();
      if (todayLine) barsPanel.appendChild(todayLine);
    }

    // Dependency arrows
    if (showDeps) {
      // Defer to after DOM is in place for position calculation
      requestAnimationFrame(() => {
        const svg = this.#buildDependencyArrows(barsPanel);
        if (svg) barsPanel.appendChild(svg);
      });
    }

    body.appendChild(taskList);
    body.appendChild(barsPanel);
    this.#container.appendChild(body);

    // Insert container before table
    this.insertBefore(this.#container, table);

    // Hide original table (keep for screen readers)
    table.classList.add('gc-sr-only');

    // Live region
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'gc-sr-only';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.appendChild(this.#liveRegion);

    // Event listeners
    this.listen(this.#container, 'click', (e) => {
      const bar = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('.gc-bar, .gc-milestone'));
      if (!bar) return;
      const taskId = bar.dataset.taskId;
      const task = this.#tasks.find(t => t.id === taskId);
      if (!task) return;

      this.#announce(`Selected: ${task.name}`);
      this.dispatchEvent(new CustomEvent('gantt-chart:task-click', {
        bubbles: true,
        detail: { task },
      }));
    });

    this.listen(this.#container, 'keydown', (e) => {
      const ke = /** @type {KeyboardEvent} */ (e);
      if (ke.key === 'Enter' || ke.key === ' ') {
        const bar = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (ke.target).closest('.gc-bar, .gc-milestone'));
        if (bar) {
          ke.preventDefault();
          bar.click();
        }
      }
    });
  }

  /* ── Timeline header ───────────────────────────── */

  #buildTimelineHeader() {
    const header = document.createElement('div');
    header.className = 'gc-timeline-header';

    // Spacer matching task list width
    const spacer = document.createElement('div');
    spacer.className = 'gc-timeline-spacer';
    header.appendChild(spacer);

    // Date labels
    const dates = document.createElement('div');
    dates.className = 'gc-timeline-dates';

    const labels = this.#generateDateLabels();
    for (const { position, text } of labels) {
      const label = document.createElement('span');
      label.className = 'gc-date-label';
      label.style.left = `${position}%`;
      label.textContent = text;
      dates.appendChild(label);
    }

    header.appendChild(dates);
    return header;
  }

  /* ── Date labels ───────────────────────────────── */

  #generateDateLabels() {
    const viewAttr = this.getAttribute('view') || 'auto';
    const view = viewAttr === 'auto' ? resolveView(this.#rangeTotal) : viewAttr;
    const formatter = pickFormatter(this.#rangeTotal);
    const labels = [];

    let stepMs;
    switch (view) {
      case 'day': stepMs = DAY; break;
      case 'week': stepMs = WEEK; break;
      case 'month': stepMs = MONTH; break;
      case 'quarter': stepMs = QUARTER; break;
      default: stepMs = MONTH;
    }

    // Align to calendar boundaries
    let cursor = new Date(this.#rangeStart);
    if (view === 'week') {
      // Align to Monday
      const dayOfWeek = cursor.getDay();
      const daysToMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
      cursor.setDate(cursor.getDate() + daysToMonday);
    } else if (view === 'month') {
      cursor.setDate(1);
      if (cursor.getTime() < this.#rangeStart) {
        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else if (view === 'quarter') {
      const month = cursor.getMonth();
      const nextQuarterMonth = Math.ceil((month + 1) / 3) * 3;
      cursor.setMonth(nextQuarterMonth);
      cursor.setDate(1);
    }

    const cursorTs = cursor.getTime();
    // Add first label at start if it's before the first aligned cursor
    if (cursorTs > this.#rangeStart + stepMs * 0.5) {
      labels.push({
        position: 0,
        text: formatter(new Date(this.#rangeStart)),
      });
    }

    let current = cursorTs;
    while (current <= this.#rangeEnd) {
      const pct = ((current - this.#rangeStart) / this.#rangeTotal) * 100;
      if (pct >= 0 && pct <= 100) {
        labels.push({
          position: pct,
          text: formatter(new Date(current)),
        });
      }

      // Step forward
      if (view === 'month') {
        const d = new Date(current);
        d.setMonth(d.getMonth() + 1);
        current = d.getTime();
      } else if (view === 'quarter') {
        const d = new Date(current);
        d.setMonth(d.getMonth() + 3);
        current = d.getTime();
      } else {
        current += stepMs;
      }
    }

    return labels;
  }

  /* ── Grid lines ────────────────────────────────── */

  #buildGridLines() {
    const container = document.createElement('div');
    container.className = 'gc-grid-lines';

    const labels = this.#generateDateLabels();
    for (const { position } of labels) {
      if (position <= 0) continue;
      const line = document.createElement('div');
      line.className = 'gc-grid-line';
      line.style.left = `${position}%`;
      container.appendChild(line);
    }

    return container;
  }

  /* ── Group tasks ───────────────────────────────── */

  #groupTasks() {
    /** @type {Map<string|null, Object[]>} */
    const groups = new Map();

    for (const task of this.#tasks) {
      const key = task.group || '';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(task);
    }

    return groups;
  }

  /* ── Build bar ─────────────────────────────────── */

  #buildBar(task, showProgress) {
    const leftPct = ((task.start - this.#rangeStart) / this.#rangeTotal) * 100;
    const widthPct = ((task.end - task.start) / this.#rangeTotal) * 100;

    const bar = document.createElement('div');
    bar.className = 'gc-bar';
    bar.setAttribute('data-task-id', task.id);
    bar.setAttribute('role', 'img');
    bar.setAttribute('tabindex', '0');
    bar.setAttribute('aria-label',
      `${esc(task.name)}: ${new Date(task.start).toLocaleDateString()} to ${new Date(task.end).toLocaleDateString()}` +
      (task.progress > 0 ? `, ${Math.round(task.progress * 100)}% complete` : '')
    );

    bar.style.left = `${leftPct}%`;
    bar.style.width = `${Math.max(widthPct, 0.5)}%`;

    if (task.status) bar.setAttribute('data-status', task.status);
    if (task.color) bar.style.setProperty('--gc-bar-color', task.color);

    // Progress fill
    if (showProgress && task.progress > 0) {
      const fill = document.createElement('div');
      fill.className = 'gc-bar-fill';
      fill.style.width = `${Math.round(task.progress * 100)}%`;
      bar.appendChild(fill);
    }

    // Label (show name if bar is wide enough)
    if (widthPct > 8) {
      const label = document.createElement('span');
      label.className = 'gc-bar-label';
      label.textContent = task.name;
      bar.appendChild(label);
    }

    return bar;
  }

  /* ── Build milestone ───────────────────────────── */

  #buildMilestone(task) {
    const leftPct = ((task.start - this.#rangeStart) / this.#rangeTotal) * 100;

    const diamond = document.createElement('div');
    diamond.className = 'gc-milestone';
    diamond.setAttribute('data-task-id', task.id);
    diamond.setAttribute('role', 'img');
    diamond.setAttribute('tabindex', '0');
    diamond.setAttribute('aria-label', `Milestone: ${esc(task.name)}, ${new Date(task.start).toLocaleDateString()}`);
    diamond.style.left = `${leftPct}%`;

    if (task.status) diamond.setAttribute('data-status', task.status);
    if (task.color) diamond.style.setProperty('--gc-bar-color', task.color);

    return diamond;
  }

  /* ── Today line ────────────────────────────────── */

  #buildTodayLine() {
    const now = Date.now();
    if (now < this.#rangeStart || now > this.#rangeEnd) return null;

    const pct = ((now - this.#rangeStart) / this.#rangeTotal) * 100;

    const line = document.createElement('div');
    line.className = 'gc-today-line';
    line.style.left = `${pct}%`;

    const label = document.createElement('span');
    label.className = 'gc-today-label';
    label.textContent = 'Today';
    line.appendChild(label);

    return line;
  }

  /* ── Dependency arrows ─────────────────────────── */

  #buildDependencyArrows(barsPanel) {
    const depsExist = this.#tasks.some(t => t.depends.length > 0);
    if (!depsExist) return null;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'gc-deps');
    svg.style.width = '100%';
    svg.style.height = '100%';

    // Arrowhead marker
    const defs = document.createElementNS(ns, 'defs');
    const marker = document.createElementNS(ns, 'marker');
    marker.setAttribute('id', 'gc-arrowhead');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const arrow = document.createElementNS(ns, 'polygon');
    arrow.setAttribute('points', '0 0, 8 3, 0 6');
    arrow.setAttribute('fill', 'var(--color-text-muted, #666666)');
    marker.appendChild(arrow);
    defs.appendChild(marker);
    svg.appendChild(defs);

    for (const task of this.#tasks) {
      for (const depId of task.depends) {
        const source = this.#tasks.find(t => t.id === depId);
        if (!source) continue;

        const sourceRight = ((source.end - this.#rangeStart) / this.#rangeTotal) * 100;
        const targetLeft = ((task.start - this.#rangeStart) / this.#rangeTotal) * 100;

        // Find row indices for vertical positioning
        const sourceIdx = this.#getVisualRowIndex(source.id, barsPanel);
        const targetIdx = this.#getVisualRowIndex(task.id, barsPanel);
        if (sourceIdx === -1 || targetIdx === -1) continue;

        const rowHeight = 36; // default --gc-row-height
        const sourceY = sourceIdx * rowHeight + rowHeight / 2;
        const targetY = targetIdx * rowHeight + rowHeight / 2;

        const path = document.createElementNS(ns, 'path');
        const midX = sourceRight + (targetLeft - sourceRight) / 2;
        path.setAttribute('d', `M ${sourceRight}% ${sourceY} C ${midX}% ${sourceY}, ${midX}% ${targetY}, ${targetLeft}% ${targetY}`);
        path.setAttribute('class', 'gc-dep-line');
        svg.appendChild(path);
      }
    }

    return svg;
  }

  #getVisualRowIndex(taskId, barsPanel) {
    const rows = barsPanel.querySelectorAll('.gc-bar-row');
    for (let i = 0; i < rows.length; i++) {
      const bar = rows[i].querySelector('[data-task-id]');
      if (bar && bar.dataset.taskId === taskId) return i;
    }
    return -1;
  }

  /* ── JSON loading ──────────────────────────────── */

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Clear existing children
      while (this.firstChild) this.firstChild.remove();

      // Build a table from JSON
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      for (const label of ['Task', 'Start', 'End', 'Progress']) {
        const th = document.createElement('th');
        th.textContent = label;
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      for (const task of (data.tasks || [])) {
        const tr = document.createElement('tr');
        if (task.id) tr.dataset.taskId = task.id;
        if (task.group) tr.dataset.group = task.group;
        if (task.depends) tr.dataset.depends = Array.isArray(task.depends) ? task.depends.join(',') : task.depends;
        if (task.status) tr.dataset.status = task.status;
        if (task.assignee) tr.dataset.assignee = task.assignee;
        if (task.milestone) tr.setAttribute('data-milestone', '');
        if (task.color) tr.dataset.color = task.color;
        if (task.storyIds) tr.dataset.storyIds = Array.isArray(task.storyIds) ? task.storyIds.join(',') : task.storyIds;
        if (task.itemIds) tr.dataset.itemIds = Array.isArray(task.itemIds) ? task.itemIds.join(',') : task.itemIds;

        const tdName = document.createElement('td');
        tdName.textContent = task.name || '';
        tr.appendChild(tdName);

        const tdStart = document.createElement('td');
        const timeStart = document.createElement('time');
        timeStart.setAttribute('datetime', task.start);
        timeStart.textContent = new Date(task.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        tdStart.appendChild(timeStart);
        tr.appendChild(tdStart);

        const tdEnd = document.createElement('td');
        const timeEnd = document.createElement('time');
        timeEnd.setAttribute('datetime', task.end || task.start);
        timeEnd.textContent = new Date(task.end || task.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        tdEnd.appendChild(timeEnd);
        tr.appendChild(tdEnd);

        const tdProgress = document.createElement('td');
        const progress = document.createElement('progress');
        progress.value = task.progress || 0;
        progress.max = 100;
        progress.textContent = `${task.progress || 0}%`;
        tdProgress.appendChild(progress);
        tr.appendChild(tdProgress);

        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      this.appendChild(table);

      // Apply title from JSON
      if (data.title) this.setAttribute('title', data.title);

      this.#refresh();
    } catch (err) {
      console.warn(`[gantt-chart] Failed to load src="${url}":`, err);
    }
  }

  /* ── Live region ───────────────────────────────── */

  #announce(msg) {
    if (!this.#liveRegion) return;
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (this.#liveRegion) this.#liveRegion.textContent = msg;
    });
  }
}

registerComponent('gantt-chart', GanttChart);
export { GanttChart };
