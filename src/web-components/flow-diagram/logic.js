/**
 * <flow-diagram> — User flow and sequence visualization
 *
 * Light DOM component that progressively enhances an <ol> of steps
 * into a connected node graph with typed shapes (start, action,
 * decision, process, wait, end). Decisions support branching paths.
 *
 * Without JS: renders as a normal ordered list.
 * With JS: visual flow chart with connectors and branches.
 *
 * @attr {string}  title          - Diagram heading
 * @attr {string}  src            - URL to JSON flow data
 * @attr {string}  data-direction - "vertical" (default) or "horizontal"
 * @attr {boolean} compact        - Reduced spacing
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
 * @fires flow-diagram:ready  - After setup with { nodeCount }
 * @fires flow-diagram:select - Node clicked with { type, text }
 *
 * @example
 * <flow-diagram title="Login Flow">
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

class FlowDiagram extends VBElement {
  static get observedAttributes() { return ['src', 'title', 'compact']; }

  /** @type {HTMLElement|null} */
  #container = null;
  /** @type {HTMLElement|null} */
  #titleEl = null;
  /** @type {HTMLElement|null} */
  #liveRegion = null;
  /** @type {number} */
  #nodeCount = 0;
  /** @type {Array<any>} */
  #cachedSteps = [];

  setup() {
    const ol = /** @type {HTMLElement | null} */ (this.querySelector(':scope > ol'));
    if (!ol) return false;

    // 1. Parse the flow from the <ol>
    const steps = this.#parseSteps(ol);
    if (steps.length === 0) return false;
    this.#cachedSteps = steps;

    // 2. Hide the original <ol>
    ol.style.display = 'none';
    ol.setAttribute('aria-hidden', 'true');

    // 3. Build title
    const title = this.getAttribute('title');
    if (title) {
      this.#titleEl = document.createElement('h2');
      this.#titleEl.className = 'fd-title';
      this.#titleEl.textContent = title;
      this.insertBefore(this.#titleEl, ol);
    }

    // 4. Build visual container
    this.#container = document.createElement('div');
    this.#container.className = 'fd-container';
    this.#container.setAttribute('role', 'img');
    this.#container.setAttribute('aria-label', `Flow diagram${title ? ': ' + title : ''}`);

    this.#nodeCount = 0;
    this.#buildNodes(steps, this.#container);

    // Summary
    const summary = document.createElement('div');
    summary.className = 'fd-summary';
    summary.textContent = `${this.#nodeCount} step${this.#nodeCount !== 1 ? 's' : ''}`;
    this.#container.appendChild(summary);

    this.insertBefore(this.#container, ol);

    // 5. Live region
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'fd-live';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.appendChild(this.#liveRegion);

    // 6. Click handler
    this.listen(this.#container, 'click', (e) => {
      const shape = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('.fd-node-shape'));
      if (!shape) return;
      const node = /** @type {HTMLElement | null} */ (shape.closest('.fd-node'));
      const type = node?.dataset.type || 'action';
      const text = shape.textContent?.trim() || '';
      this.#announce(`Selected: ${text}`);
      this.dispatchEvent(new CustomEvent('flow-diagram:select', {
        bubbles: true,
        detail: { type, text },
      }));
    });

    // 7. Ready
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

    // Restore original <ol>
    const ol = this.querySelector('ol');
    if (ol) {
      ol.style.display = '';
      ol.removeAttribute('aria-hidden');
    }
    this.#nodeCount = 0;
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
      const name = `fd-vt-${++FlowDiagram.#vtCounter}`;
      this.style.viewTransitionName = name;
      const tx = document.startViewTransition(swap);
      tx.finished.finally(() => { this.style.viewTransitionName = ''; });
    } else {
      swap();
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current parsed step structure. Each step is
   * `{ type, text, annotation, branches: [{ label, steps }] }`.
   * After upgrade this reflects the parsed <ol> source; after
   * assignment, reflects what was passed in.
   */
  get steps() {
    return this.#cachedSteps;
  }

  /**
   * Replace the diagram with a new step list and re-render. Each step
   * matches the shape the parser produces. Auto-creates the source <ol>
   * scaffold if none exists (so JS-first usage doesn't need any markup).
   * Emits flow-diagram:steps-changed { steps, source: 'property' }.
   */
  set steps(value) {
    const next = Array.isArray(value) ? value : [];
    this.#cachedSteps = next;

    // Tear down existing chrome.
    if (this.#titleEl) { this.#titleEl.remove(); this.#titleEl = null; }
    if (this.#container) { this.#container.remove(); this.#container = null; }
    if (this.#liveRegion) { this.#liveRegion.remove(); this.#liveRegion = null; }

    // Ensure a source <ol> exists (hidden) so attribute-driven re-render
    // and accessibility fallbacks behave consistently.
    let ol = /** @type {HTMLOListElement | null} */ (this.querySelector(':scope > ol'));
    if (!ol) {
      ol = document.createElement('ol');
      ol.style.display = 'none';
      ol.setAttribute('aria-hidden', 'true');
      this.appendChild(ol);
    }

    if (next.length === 0) {
      this.dispatchEvent(new CustomEvent('flow-diagram:steps-changed', {
        detail: { steps: next, source: 'property' }, bubbles: true,
      }));
      return;
    }

    // Title
    const title = this.getAttribute('title');
    if (title) {
      this.#titleEl = document.createElement('h2');
      this.#titleEl.className = 'fd-title';
      this.#titleEl.textContent = title;
      this.insertBefore(this.#titleEl, ol);
    }

    // Visual container
    this.#container = document.createElement('div');
    this.#container.className = 'fd-container';
    this.#container.setAttribute('role', 'img');
    this.#container.setAttribute('aria-label', `Flow diagram${title ? ': ' + title : ''}`);

    this.#nodeCount = 0;
    this.#buildNodes(next, this.#container);

    const summary = document.createElement('div');
    summary.className = 'fd-summary';
    summary.textContent = `${this.#nodeCount} step${this.#nodeCount !== 1 ? 's' : ''}`;
    this.#container.appendChild(summary);

    this.insertBefore(this.#container, ol);

    // Live region
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'fd-live';
    this.#liveRegion.setAttribute('role', 'status');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.appendChild(this.#liveRegion);

    this.dispatchEvent(new CustomEvent('flow-diagram:steps-changed', {
      detail: { steps: next, source: 'property' },
      bubbles: true,
    }));
  }

  /* ── Parse steps from <ol> ─────────────────────── */

  #parseSteps(ol) {
    const steps = [];
    for (const li of ol.querySelectorAll(':scope > li')) {
      const step = this.#parseStep(li);
      if (step) steps.push(step);
    }
    return steps;
  }

  #parseStep(li) {
    const type = li.dataset.type || 'action';
    const annotation = li.dataset.annotation || '';

    // For decisions with branches: find nested <ol> children
    const branches = [];
    const nestedOls = li.querySelectorAll(':scope > ol > li[data-branch]');
    if (nestedOls.length > 0) {
      for (const branchLi of nestedOls) {
        const label = branchLi.dataset.branch || '';
        const branchOl = branchLi.querySelector(':scope > ol');
        const branchSteps = branchOl ? this.#parseSteps(branchOl) : [];
        branches.push({ label, steps: branchSteps });
      }
    }

    // Get the text content (excluding nested <ol>)
    let text = '';
    for (const child of li.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'OL') {
        text += /** @type {HTMLElement} */ (child).textContent;
      }
    }
    text = text.trim();

    return { type, text, annotation, branches };
  }

  /* ── Build visual nodes ────────────────────────── */

  #buildNodes(steps, parent) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Add connector before each node (except first)
      if (i > 0) {
        parent.appendChild(this.#buildConnector());
      }

      // Build the node
      const node = this.#buildNode(step);
      parent.appendChild(node);

      // If decision with branches, render branch paths with connecting lines
      if (step.branches.length > 0) {
        const branchContainer = document.createElement('div');
        branchContainer.className = 'fd-branches';
        branchContainer.setAttribute('data-branch-count', String(step.branches.length));

        // Horizontal split line connecting all branch tops
        const splitLine = document.createElement('div');
        splitLine.className = 'fd-split-line';
        splitLine.setAttribute('aria-hidden', 'true');
        branchContainer.appendChild(splitLine);

        // Branch columns with drop-down connectors
        const branchColumns = document.createElement('div');
        branchColumns.className = 'fd-branch-columns';
        // Inset = 50% / N so the bar spans center-to-center of the branches
        const inset = (50 / step.branches.length).toFixed(2);
        branchColumns.style.setProperty('--fd-inset', `${inset}%`);

        for (const branch of step.branches) {
          const branchEl = document.createElement('div');
          branchEl.className = 'fd-branch';

          // Vertical drop from split line into branch
          branchEl.appendChild(this.#buildConnector());

          const label = document.createElement('span');
          label.className = 'fd-branch-label';
          label.textContent = branch.label;
          label.setAttribute('data-branch', branch.label.toLowerCase());
          branchEl.appendChild(label);

          this.#buildNodes(branch.steps, branchEl);
          branchColumns.appendChild(branchEl);
        }

        branchContainer.appendChild(branchColumns);
        parent.appendChild(branchContainer);
      }
    }
  }

  #buildNode(step) {
    this.#nodeCount++;

    const node = document.createElement('div');
    node.className = 'fd-node';
    node.dataset.type = step.type;

    const shape = document.createElement('div');
    shape.className = 'fd-node-shape';
    shape.setAttribute('tabindex', '0');
    shape.setAttribute('role', 'img');
    shape.setAttribute('aria-label', `${step.type}: ${step.text}`);
    shape.textContent = step.text;
    node.appendChild(shape);

    if (step.annotation) {
      const ann = document.createElement('div');
      ann.className = 'fd-annotation';
      ann.textContent = step.annotation;
      node.appendChild(ann);
    }

    return node;
  }

  #buildConnector(label) {
    const connector = document.createElement('div');
    connector.className = 'fd-connector';
    connector.setAttribute('aria-hidden', 'true');

    const line = document.createElement('div');
    line.className = 'fd-connector-line';
    connector.appendChild(line);

    if (label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'fd-connector-label';
      labelEl.textContent = label;
      connector.appendChild(labelEl);
    }

    const arrow = document.createElement('div');
    arrow.className = 'fd-connector-arrow';
    connector.appendChild(arrow);

    return connector;
  }

  /* ── JSON loading ──────────────────────────────── */

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Clear and rebuild
      while (this.firstChild) this.firstChild.remove();

      if (data.title) this.setAttribute('title', data.title);

      const ol = document.createElement('ol');
      this.#buildOlFromJson(data.steps || [], ol);
      this.appendChild(ol);

      this.#refresh();
    } catch (err) {
      console.warn(`[flow-diagram] Failed to load src="${url}":`, err);
    }
  }

  #buildOlFromJson(steps, ol) {
    for (const step of steps) {
      const li = document.createElement('li');
      if (step.type) li.dataset.type = step.type;
      if (step.annotation) li.dataset.annotation = step.annotation;
      li.textContent = step.text || '';

      if (step.branches && step.branches.length > 0) {
        const branchOl = document.createElement('ol');
        for (const branch of step.branches) {
          const branchLi = document.createElement('li');
          branchLi.dataset.branch = branch.label || '';
          const innerOl = document.createElement('ol');
          this.#buildOlFromJson(branch.steps || [], innerOl);
          branchLi.appendChild(innerOl);
          branchOl.appendChild(branchLi);
        }
        li.appendChild(branchOl);
      }

      ol.appendChild(li);
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

registerComponent('flow-diagram', FlowDiagram);
export { FlowDiagram };
