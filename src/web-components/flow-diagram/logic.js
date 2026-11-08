/**
 * <flow-diagram> — User flow and sequence visualization
 *
 * Light DOM component that progressively enhances an <ol> of steps
 * into a connected node graph with typed shapes (start, action,
 * decision, process, wait, end). Decisions support branching paths.
 *
 * Without JS: renders as a normal ordered list.
 * With JS: the source <ol> is hidden and re-rendered as a labelled
 * <figure> holding a nested list (ol > li, branch sublists) styled as a
 * flow chart, so assistive tech reads the same structure in order.
 * Nodes are buttons with one roving tab stop (arrow keys, Home/End).
 *
 * @attr {string}  data-title         - Diagram heading (rendered as a heading, no tooltip)
 * @attr {string}  data-heading-level - Heading level 1–6 for data-title (default 2)
 * @attr {string}  src                - URL to JSON flow data ({ title?, steps })
 * @attr {string}  data-direction     - "vertical" (default) or "horizontal"
 * @attr {boolean} compact            - Reduced spacing (CSS only)
 * @attr {string}  data-label         - Accessible name when there is no data-title (default "Flow diagram")
 * @attr {string}  data-label-selected - Live-region text on select; {text} is replaced (default "Selected: {text}")
 * @attr {string}  data-label-steps-one / data-label-steps-other (any Intl.PluralRules category)
 *                                     - Step-count summary; {count} is replaced (default "{count} step" / "{count} steps")
 * @attr {string}  data-label-type-start … data-label-type-end (any type)
 *                                     - Spoken type prefix for nodes of that type (default "Start", "Action", …)
 *
 * Child <li> attributes:
 * @attr {string} data-type       - start | action | decision | process | wait | end
 * @attr {string} data-annotation - Note text displayed below the node
 * @attr {string} data-branch     - Branch label when inside a decision's <ol>
 *
 * Decision branching: nest an <ol> inside a decision <li> for each branch.
 * Use <li data-branch="Yes"> and <li data-branch="No"> as branch containers,
 * each containing their own <ol> of steps.
 *
 * @fires flow-diagram:ready         - After every render (initial, attribute change, src load, .steps) with { nodeCount }
 * @fires flow-diagram:select        - Node activated (click, Enter, Space) with { type, text }
 * @fires flow-diagram:steps-changed - After .steps assignment with { steps, source: 'property' }
 *
 * @example
 * <flow-diagram data-title="Login Flow">
 *   <ol>
 *     <li data-type="start">User visits login page</li>
 *     <li data-type="action">Enter credentials</li>
 *     <li data-type="decision">Valid credentials?
 *       <ol>
 *         <li data-branch="Yes">
 *           <ol>
 *             <li data-type="action">Create session</li>
 *             <li data-type="end">Redirect to dashboard</li>
 *           </ol>
 *         </li>
 *         <li data-branch="No">
 *           <ol>
 *             <li data-type="action">Show error message</li>
 *             <li data-type="end">Return to login</li>
 *           </ol>
 *         </li>
 *       </ol>
 *     </li>
 *   </ol>
 * </flow-diagram>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { viewTransitionSwap } from '../../lib/vb-view-transition.js';

/** @typedef {{ label: string, steps: Step[] }} Branch */
/** @typedef {{ type: string, text: string, annotation: string, branches: Branch[] }} Step */

const TYPE_LABELS = /** @type {Record<string, string>} */ ({
  start: 'Start',
  action: 'Action',
  decision: 'Decision',
  process: 'Process',
  wait: 'Wait',
  end: 'End',
});

const STEP_COUNT = /** @type {Record<string, string>} */ ({
  one: '{count} step',
  other: '{count} steps',
});

let uid = 0;

/**
 * Coerce arbitrary input into well-formed Step records. Strings become
 * action steps; non-objects are dropped; missing/invalid branches → [].
 * @param {unknown} value
 * @returns {Step[]}
 */
function normalizeSteps(value) {
  if (!Array.isArray(value)) return [];
  /** @type {Step[]} */
  const out = [];
  for (const raw of value) {
    if (typeof raw === 'string') {
      out.push({ type: 'action', text: raw, annotation: '', branches: [] });
      continue;
    }
    if (!raw || typeof raw !== 'object') continue;
    const r = /** @type {Record<string, any>} */ (raw);
    const branches = Array.isArray(r.branches)
      ? r.branches
        .filter((b) => b && typeof b === 'object')
        .map((b) => ({ label: String(b.label ?? ''), steps: normalizeSteps(b.steps) }))
      : [];
    out.push({
      type: typeof r.type === 'string' && r.type.trim() ? r.type.trim() : 'action',
      text: String(r.text ?? ''),
      annotation: r.annotation ? String(r.annotation) : '',
      branches,
    });
  }
  return out;
}

/**
 * Write Step records into an <ol> using the same markup the parser reads.
 * @param {Step[]} steps
 * @param {HTMLOListElement} ol
 */
function buildOl(steps, ol) {
  for (const step of steps) {
    const li = document.createElement('li');
    li.dataset.type = step.type;
    if (step.annotation) li.dataset.annotation = step.annotation;
    li.textContent = step.text;

    if (step.branches.length > 0) {
      const branchOl = document.createElement('ol');
      for (const branch of step.branches) {
        const branchLi = document.createElement('li');
        branchLi.dataset.branch = branch.label;
        const innerOl = document.createElement('ol');
        buildOl(branch.steps, innerOl);
        branchLi.appendChild(innerOl);
        branchOl.appendChild(branchLi);
      }
      li.appendChild(branchOl);
    }
    ol.appendChild(li);
  }
}

class FlowDiagram extends VBElement {
  static get observedAttributes() {
    return ['src', 'data-title', 'data-heading-level', 'data-label'];
  }

  /** @type {HTMLElement|null} */
  #titleEl = null;
  /** @type {HTMLElement|null} */
  #container = null;
  /** @type {HTMLElement|null} */
  #liveRegion = null;
  /** @type {number} */
  #nodeCount = 0;
  /** @type {Step[]} */
  #cachedSteps = [];
  /** @type {string|null} URL currently being fetched */
  #loading = null;
  #id = `fd-${++uid}`;

  setup() {
    const ol = /** @type {HTMLOListElement | null} */ (this.querySelector(':scope > ol'));
    if (!ol) {
      // No inline markup: fetch the flow if src is set (covers src assigned
      // before connect, where attributeChangedCallback skipped the load).
      const src = this.getAttribute('src');
      if (src) this._loadSrc(src);
      return false;
    }

    const steps = this.#parseSteps(ol);
    if (steps.length === 0) return false;
    this.#cachedSteps = steps;

    // Heading (data-title). A heading child replaces the old title
    // attribute, which doubled as a native hover tooltip.
    const title = this.dataset.title;
    if (title) {
      const level = Math.min(6, Math.max(1, parseInt(this.dataset.headingLevel || '2', 10) || 2));
      this.#titleEl = document.createElement(`h${level}`);
      this.#titleEl.className = 'fd-title';
      this.#titleEl.id = `${this.#id}-title`;
      this.#titleEl.textContent = title;
      this.insertBefore(this.#titleEl, ol);
    }

    // Visual + accessible layer: a labelled figure holding a nested list.
    const figure = document.createElement('figure');
    figure.className = 'fd-container';
    if (this.#titleEl) figure.setAttribute('aria-labelledby', this.#titleEl.id);
    else figure.setAttribute('aria-label', this.#label('', 'Flow diagram'));
    this.#container = figure;

    this.#nodeCount = 0;
    figure.appendChild(this.#buildList(steps));

    const summary = document.createElement('p');
    summary.className = 'fd-summary';
    summary.textContent = this.#stepCountLabel(this.#nodeCount);
    figure.appendChild(summary);

    this.insertBefore(figure, ol);

    // Single roving tab stop: first node.
    const first = figure.querySelector('.fd-node-shape');
    if (first) first.setAttribute('tabindex', '0');

    this.#liveRegion = document.createElement('p');
    this.#liveRegion.className = 'fd-live';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.appendChild(this.#liveRegion);

    this.listen(figure, 'click', (e) => {
      const shape = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('.fd-node-shape'));
      if (!shape) return;
      this.#rove(shape, false);
      const type = shape.dataset.type || 'action';
      const text = shape.dataset.text || '';
      this.#announce(this.#label('selected', 'Selected: {text}').replaceAll('{text}', text));
      this.dispatchEvent(new CustomEvent('flow-diagram:select', {
        bubbles: true,
        detail: { type, text },
      }));
    });

    this.listen(figure, 'keydown', (e) => this.#onKeydown(/** @type {KeyboardEvent} */ (e)));

    this.dispatchEvent(new CustomEvent('flow-diagram:ready', {
      bubbles: true,
      detail: { nodeCount: this.#nodeCount },
    }));
    return true;
  }

  teardown() {
    if (this.#titleEl) { this.#titleEl.remove(); this.#titleEl = null; }
    if (this.#container) { this.#container.remove(); this.#container = null; }
    if (this.#liveRegion) { this.#liveRegion.remove(); this.#liveRegion = null; }
    this.#nodeCount = 0;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected || this.#loading) return;
    if (name === 'src') {
      this._loadSrc(newValue);
    } else if (this.hasAttribute('data-upgraded')) {
      this.#refresh();
    }
  }

  /**
   * Tear down and re-setup, wrapped in a View Transition so the swap
   * crossfades instead of flashing. Same pattern as diagram-wc and
   * site-map.
   */
  #refresh() {
    const swap = () => { this._reinit(); };
    if (this.hasAttribute('data-upgraded')) {
      viewTransitionSwap(this, swap, 'fd-vt');
    } else {
      swap();
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current step structure:
   * `{ type, text, annotation, branches: [{ label, steps }] }[]`.
   * Reflects the parsed <ol> source after upgrade, or the last assignment.
   *
   * @returns {Step[]}
   */
  get steps() {
    return this.#cachedSteps;
  }

  /**
   * Replace the flow. Input is normalized (`branches` defaults to [];
   * malformed entries are dropped), written into the source <ol> so it
   * survives re-renders and moves, then the lifecycle re-runs (which fires
   * flow-diagram:ready). Emits flow-diagram:steps-changed afterwards.
   *
   * @param {unknown} value
   */
  set steps(value) {
    const next = normalizeSteps(value);
    this.#cachedSteps = next;

    const fresh = document.createElement('ol');
    buildOl(next, fresh);
    const old = this.querySelector(':scope > ol');
    if (old) old.replaceWith(fresh);
    else this.appendChild(fresh);

    this._reinit();

    this.dispatchEvent(new CustomEvent('flow-diagram:steps-changed', {
      detail: { steps: this.#cachedSteps, source: 'property' },
      bubbles: true,
    }));
  }

  /* ── Labels ────────────────────────────────────── */

  /**
   * Author-overridable UI string from data-label[-key].
   * @param {string} key
   * @param {string} fallback
   */
  #label(key, fallback) {
    return this.getAttribute(key ? `data-label-${key}` : 'data-label') ?? fallback;
  }

  #lang() {
    return this.closest('[lang]')?.getAttribute('lang') || 'en';
  }

  /** @param {string} type */
  #typeLabel(type) {
    return this.getAttribute(`data-label-type-${type}`) ?? TYPE_LABELS[type] ?? type;
  }

  /** @param {number} n */
  #stepCountLabel(n) {
    const lang = this.#lang();
    let category = 'other';
    let count = String(n);
    try {
      category = new Intl.PluralRules(lang).select(n);
      count = new Intl.NumberFormat(lang).format(n);
    } catch { /* invalid lang tag: English fallback */ }
    const tpl = this.getAttribute(`data-label-steps-${category}`)
      ?? STEP_COUNT[category]
      ?? this.getAttribute('data-label-steps-other')
      ?? STEP_COUNT.other;
    return tpl.replaceAll('{count}', count);
  }

  /* ── Parse steps from <ol> ─────────────────────── */

  /** @param {Element} ol @returns {Step[]} */
  #parseSteps(ol) {
    const steps = [];
    for (const li of ol.querySelectorAll(':scope > li')) {
      steps.push(this.#parseStep(/** @type {HTMLElement} */ (li)));
    }
    return steps;
  }

  /** @param {HTMLElement} li @returns {Step} */
  #parseStep(li) {
    const type = (li.dataset.type || '').trim() || 'action';
    const annotation = li.dataset.annotation || '';

    /** @type {Branch[]} */
    const branches = [];
    for (const branchLi of li.querySelectorAll(':scope > ol > li[data-branch]')) {
      const label = /** @type {HTMLElement} */ (branchLi).dataset.branch || '';
      const branchOl = branchLi.querySelector(':scope > ol');
      branches.push({ label, steps: branchOl ? this.#parseSteps(branchOl) : [] });
    }

    // Text content excluding nested <ol>
    let text = '';
    for (const child of li.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE && /** @type {Element} */ (child).tagName !== 'OL') {
        text += child.textContent;
      }
    }

    return { type, text: text.trim().replace(/\s+/g, ' '), annotation, branches };
  }

  /* ── Build the rendered list ───────────────────── */

  /** @param {Step[]} steps */
  #buildList(steps) {
    const ol = document.createElement('ol');
    ol.className = 'fd-flow';
    steps.forEach((step, i) => ol.appendChild(this.#buildNode(step, i > 0)));
    return ol;
  }

  /**
   * @param {Step} step
   * @param {boolean} withConnector - draw the incoming connector
   */
  #buildNode(step, withConnector) {
    this.#nodeCount++;
    const n = this.#nodeCount;

    const li = document.createElement('li');
    li.className = 'fd-node';
    li.dataset.type = step.type;

    if (withConnector) li.appendChild(this.#buildConnector());

    const body = document.createElement('span');
    body.className = 'fd-step';

    const shape = document.createElement('button');
    shape.type = 'button';
    shape.className = 'fd-node-shape';
    shape.tabIndex = -1;
    shape.dataset.type = step.type;
    shape.dataset.text = step.text;

    const typeEl = document.createElement('span');
    typeEl.className = 'fd-type';
    typeEl.textContent = `${this.#typeLabel(step.type)}: `;
    shape.append(typeEl, step.text);
    body.appendChild(shape);

    if (step.annotation) {
      const ann = document.createElement('small');
      ann.className = 'fd-annotation';
      ann.id = `${this.#id}-ann-${n}`;
      ann.textContent = step.annotation;
      shape.setAttribute('aria-describedby', ann.id);
      body.appendChild(ann);
    }
    li.appendChild(body);

    const branches = Array.isArray(step.branches) ? step.branches : [];
    if (branches.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'fd-branches';
      ul.dataset.branchCount = String(branches.length);

      for (const branch of branches) {
        const bli = document.createElement('li');
        bli.className = 'fd-branch';
        bli.appendChild(this.#buildConnector());

        const label = document.createElement('span');
        label.className = 'fd-branch-label';
        label.textContent = branch.label;
        label.dataset.branch = branch.label.toLowerCase();
        bli.appendChild(label);

        const branchSteps = Array.isArray(branch.steps) ? branch.steps : [];
        if (branchSteps.length) bli.appendChild(this.#buildList(branchSteps));
        ul.appendChild(bli);
      }
      li.appendChild(ul);
    }

    return li;
  }

  #buildConnector() {
    const connector = document.createElement('span');
    connector.className = 'fd-connector';
    connector.setAttribute('aria-hidden', 'true');
    const line = document.createElement('span');
    line.className = 'fd-connector-line';
    const arrow = document.createElement('span');
    arrow.className = 'fd-connector-arrow';
    connector.append(line, arrow);
    return connector;
  }

  /* ── Keyboard (roving tabindex) ────────────────── */

  /**
   * @param {HTMLElement} shape
   * @param {boolean} focus
   */
  #rove(shape, focus) {
    if (!this.#container) return;
    for (const s of this.#container.querySelectorAll('.fd-node-shape')) {
      s.setAttribute('tabindex', s === shape ? '0' : '-1');
    }
    if (focus) shape.focus();
  }

  /** @param {KeyboardEvent} e */
  #onKeydown(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    if (!this.#container || !target.classList?.contains('fd-node-shape')) return;
    const shapes = /** @type {HTMLElement[]} */ ([...this.#container.querySelectorAll('.fd-node-shape')]);
    const i = shapes.indexOf(target);
    const rtl = getComputedStyle(this).direction === 'rtl';
    let next = -1;
    switch (e.key) {
      case 'ArrowDown': next = i + 1; break;
      case 'ArrowUp': next = i - 1; break;
      case 'ArrowRight': next = rtl ? i - 1 : i + 1; break;
      case 'ArrowLeft': next = rtl ? i + 1 : i - 1; break;
      case 'Home': next = 0; break;
      case 'End': next = shapes.length - 1; break;
      default: return;
    }
    e.preventDefault();
    next = Math.max(0, Math.min(shapes.length - 1, next));
    this.#rove(shapes[next], true);
  }

  /* ── JSON loading ──────────────────────────────── */

  /** @param {string|null} url */
  async _loadSrc(url) {
    if (!url || this.#loading === url) return;
    this.#loading = url;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (this.getAttribute('src') !== url) return; // superseded

      const fresh = document.createElement('ol');
      buildOl(normalizeSteps(data?.steps), fresh);
      const old = this.querySelector(':scope > ol');
      if (old) old.replaceWith(fresh);
      else this.appendChild(fresh);
      if (typeof data?.title === 'string') this.dataset.title = data.title;
    } catch (err) {
      console.warn(`[flow-diagram] Failed to load src="${url}":`, err);
      return;
    } finally {
      if (this.#loading === url) this.#loading = null;
    }
    if (this.isConnected) this.#refresh();
  }

  /* ── Live region ───────────────────────────────── */

  /** @param {string} msg */
  #announce(msg) {
    if (!this.#liveRegion) return;
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (this.#liveRegion) this.#liveRegion.textContent = msg;
    });
  }
}

registerComponent('flow-diagram', FlowDiagram);
export { FlowDiagram };
