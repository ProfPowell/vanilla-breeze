/**
 * site-map-wc: Information architecture tree component
 *
 * Light DOM component that progressively enhances a nested <nav> with
 * <ul>/<li> structure into an interactive IA tree with page-type badges,
 * expand/collapse, and visual hierarchy. Without JS, the nested list
 * renders normally as a readable site structure.
 *
 * @attr {string} title - Site map heading
 * @attr {string} src - URL to JSON data for the site tree
 * @attr {boolean} collapsed - Start all nodes collapsed
 * @attr {boolean} compact - Reduced spacing variant
 *
 * Children use:
 * @attr {string} data-page-type - layout | section | dashboard | page | modal | redirect
 * @attr {string} data-template - Template/view name (shown as badge)
 * @attr {string} data-status - draft | ready | live | deprecated
 *
 * @fires site-map-wc:ready - After setup with { nodeCount, depth }
 * @fires site-map-wc:select - Node clicked with { href, pageType, template }
 *
 * @example
 * <site-map-wc title="Site Architecture">
 *   <nav>
 *     <ul>
 *       <li data-page-type="layout" data-template="app-shell">
 *         <a href="/">Home</a>
 *         <ul>
 *           <li data-page-type="page"><a href="/about">About</a></li>
 *         </ul>
 *       </li>
 *     </ul>
 *   </nav>
 * </site-map-wc>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/** Page-type display config */
const PAGE_TYPES = {
  layout:    { label: 'Layout',    cssClass: 'sm-badge--layout' },
  section:   { label: 'Section',   cssClass: 'sm-badge--section' },
  dashboard: { label: 'Dashboard', cssClass: 'sm-badge--dashboard' },
  page:      { label: 'Page',      cssClass: 'sm-badge--page' },
  modal:     { label: 'Modal',     cssClass: 'sm-badge--modal' },
  redirect:  { label: 'Redirect',  cssClass: 'sm-badge--redirect' },
};

/** Status display config */
const STATUS_META = {
  draft:      { label: 'Draft',      cssClass: 'sm-status--draft' },
  ready:      { label: 'Ready',      cssClass: 'sm-status--ready' },
  live:       { label: 'Live',       cssClass: 'sm-status--live' },
  deprecated: { label: 'Deprecated', cssClass: 'sm-status--deprecated' },
};

class SiteMapWc extends VBElement {
  static get observedAttributes() { return ['src', 'collapsed', 'compact', 'title', 'data-view', 'data-orientation', 'data-detail']; }

  static #instanceCount = 0;

  /** @type {HTMLElement | null} */
  #treeContainer = null;
  /** @type {HTMLDivElement | null} */
  #headerEl = null;
  /** @type {HTMLElement | null} */
  #visualContainer = null;
  /** @type {HTMLElement | null} */
  #focusedNode = null;
  /** @type {number} */
  #nodeCount = 0;
  /** @type {number} */
  #maxDepth = 0;

  setup() {
    SiteMapWc.#instanceCount++;

    // Handle src attribute — load JSON and build HTML first
    const src = this.getAttribute('src');
    if (src && !this.querySelector('nav')) {
      this._loadSrc(src);
      return;
    }

    const nav = this.querySelector(':scope > nav');
    if (!nav) return;

    // 1. Snapshot and measure tree
    this.#nodeCount = 0;
    this.#maxDepth = 0;
    this.#measureTree(nav.querySelector('ul'), 0);

    // 2. Check for visual mode
    if (this.dataset.view === 'visual') {
      this.#buildHeader();
      this.#buildVisualTree(/** @type {HTMLElement} */ (nav));
      this.dispatchEvent(new CustomEvent('site-map-wc:ready', {
        bubbles: true,
        detail: { nodeCount: this.#nodeCount, depth: this.#maxDepth },
      }));
      return;
    }

    // 3. Enhance each <li> node (tree mode)
    this.#enhanceList(nav.querySelector('ul'), 0);

    // 4. Build header
    this.#buildHeader();

    // 5. Add tree container class
    nav.classList.add('sm-tree');
    nav.setAttribute('role', 'tree');
    nav.setAttribute('aria-label', this.getAttribute('title') || 'Site map');
    this.#treeContainer = /** @type {HTMLElement} */ (nav);

    // 6. Apply collapsed state
    if (this.hasAttribute('collapsed')) {
      this.#collapseAll();
    }

    // 7. Keyboard navigation
    this.listen(nav, 'keydown', (e) => this.#handleKeydown(/** @type {KeyboardEvent} */ (e)));

    // 8. Click handler for node selection
    this.listen(nav, 'click', (e) => this.#handleClick(/** @type {MouseEvent} */ (e)));

    // 9. Dispatch ready
    this.dispatchEvent(new CustomEvent('site-map-wc:ready', {
      bubbles: true,
      detail: {
        nodeCount: this.#nodeCount,
        depth: this.#maxDepth,
      },
    }));
  }

  teardown() {
    if (this.#visualContainer) {
      this.#visualContainer.remove();
      this.#visualContainer = null;
      // Restore hidden nav
      const nav = this.querySelector('nav');
      if (nav) { nav.style.display = ''; nav.removeAttribute('aria-hidden'); }
    }
    if (this.#headerEl) {
      this.#headerEl.remove();
      this.#headerEl = null;
    }
    if (this.#treeContainer) {
      this.#treeContainer.classList.remove('sm-tree');
      this.#treeContainer.removeAttribute('role');
      this.#treeContainer.removeAttribute('aria-label');
    }
    // Remove all generated badges and toggle buttons
    this.querySelectorAll('.sm-node-content, .sm-toggle').forEach(el => el.remove());
    // Restore li roles
    this.querySelectorAll('li[role="treeitem"]').forEach(li => {
      li.removeAttribute('role');
      li.removeAttribute('aria-expanded');
      li.removeAttribute('tabindex');
    });
    this.querySelectorAll('ul[role="group"]').forEach(ul => {
      ul.removeAttribute('role');
      ul.classList.remove('sm-subtree', 'sm-collapsed');
    });
    this.#treeContainer = null;
    this.#focusedNode = null;
    this.#nodeCount = 0;
    this.#maxDepth = 0;
  }

  // ── Attribute changes ────────────────────────────────

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) return;
    if (name === 'src') this._loadSrc(newValue);
  }

  // ── Tree measurement ────────────────────────────────

  /**
   * Count nodes and measure max depth.
   * @param {Element | null} ul
   * @param {number} depth
   */
  #measureTree(ul, depth) {
    if (!ul) return;
    const items = ul.querySelectorAll(':scope > li');
    for (const li of items) {
      this.#nodeCount++;
      const currentDepth = depth + 1;
      if (currentDepth > this.#maxDepth) this.#maxDepth = currentDepth;
      const childUl = li.querySelector(':scope > ul');
      if (childUl) this.#measureTree(childUl, currentDepth);
    }
  }

  // ── Tree enhancement ────────────────────────────────

  /**
   * Enhance list items with badges, toggles, and ARIA.
   * @param {Element | null} ul
   * @param {number} depth
   */
  #enhanceList(ul, depth) {
    if (!ul) return;

    if (depth > 0) {
      ul.setAttribute('role', 'group');
      ul.classList.add('sm-subtree');
    }

    const items = /** @type {HTMLElement[]} */ ([...ul.querySelectorAll(':scope > li')]);

    for (const li of items) {
      const hasChildren = !!li.querySelector(':scope > ul');
      const anchor = li.querySelector(':scope > a');
      const pageType = li.getAttribute('data-page-type') || 'page';
      const template = li.getAttribute('data-template') || '';
      const status = li.getAttribute('data-status') || '';

      // Set ARIA role
      li.setAttribute('role', 'treeitem');
      li.setAttribute('tabindex', '-1');

      // Build node content wrapper
      const content = document.createElement('span');
      content.className = 'sm-node-content';

      // Toggle button for nodes with children
      if (hasChildren) {
        li.setAttribute('aria-expanded', 'true');
        const toggle = document.createElement('button');
        toggle.className = 'sm-toggle';
        toggle.setAttribute('type', 'button');
        toggle.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('tabindex', '-1');
        toggle.textContent = '\u25BE'; // ▾
        content.appendChild(toggle);
      } else {
        // Leaf node indent marker
        const leaf = document.createElement('span');
        leaf.className = 'sm-leaf-marker';
        leaf.setAttribute('aria-hidden', 'true');
        content.appendChild(leaf);
      }

      // Status dot
      if (status && STATUS_META[status]) {
        const dot = document.createElement('span');
        dot.className = `sm-status-dot ${STATUS_META[status].cssClass}`;
        dot.setAttribute('title', STATUS_META[status].label);
        dot.setAttribute('aria-label', STATUS_META[status].label);
        content.appendChild(dot);
      }

      // Move anchor into content wrapper
      if (anchor) {
        content.appendChild(anchor);
      }

      // Page type badge
      if (PAGE_TYPES[pageType]) {
        const badge = document.createElement('span');
        badge.className = `sm-badge ${PAGE_TYPES[pageType].cssClass}`;
        badge.textContent = PAGE_TYPES[pageType].label;
        content.appendChild(badge);
      }

      // Template badge
      if (template) {
        const tBadge = document.createElement('span');
        tBadge.className = 'sm-badge sm-badge--template';
        tBadge.textContent = template;
        content.appendChild(tBadge);
      }

      // Insert content wrapper as first child
      li.insertBefore(content, li.firstChild);

      // Recurse into child list
      const childUl = li.querySelector(':scope > ul');
      if (childUl) {
        this.#enhanceList(childUl, depth + 1);
      }
    }
  }

  // ── Header ──────────────────────────────────────────

  #buildHeader() {
    const title = this.getAttribute('title');
    if (!title && this.#nodeCount === 0) return;

    this.#headerEl = document.createElement('div');
    this.#headerEl.className = 'sm-header';

    if (title) {
      const h2 = document.createElement('h2');
      h2.className = 'sm-title';
      h2.textContent = title;
      this.#headerEl.appendChild(h2);
    }

    // Node count + depth summary
    const summary = document.createElement('span');
    summary.className = 'sm-summary';
    summary.textContent = `${this.#nodeCount} pages \u00B7 ${this.#maxDepth} levels deep`;
    this.#headerEl.appendChild(summary);

    // Expand/Collapse all button
    const toggleAll = document.createElement('button');
    toggleAll.className = 'sm-toggle-all';
    toggleAll.setAttribute('type', 'button');
    toggleAll.textContent = 'Collapse all';
    toggleAll.addEventListener('click', () => {
      const allExpanded = this.querySelectorAll('li[aria-expanded="true"]').length > 0;
      if (allExpanded) {
        this.#collapseAll();
        toggleAll.textContent = 'Expand all';
      } else {
        this.#expandAll();
        toggleAll.textContent = 'Collapse all';
      }
    });
    this.#headerEl.appendChild(toggleAll);

    this.insertBefore(this.#headerEl, this.firstChild);
  }

  // ── Expand/Collapse ─────────────────────────────────

  #collapseAll() {
    const items = this.querySelectorAll('li[aria-expanded]');
    for (const li of items) {
      li.setAttribute('aria-expanded', 'false');
      const ul = li.querySelector(':scope > ul');
      if (ul) ul.classList.add('sm-collapsed');
      const toggle = li.querySelector(':scope > .sm-node-content > .sm-toggle');
      if (toggle) toggle.textContent = '\u25B8'; // ▸
    }
  }

  #expandAll() {
    const items = this.querySelectorAll('li[aria-expanded]');
    for (const li of items) {
      li.setAttribute('aria-expanded', 'true');
      const ul = li.querySelector(':scope > ul');
      if (ul) ul.classList.remove('sm-collapsed');
      const toggle = li.querySelector(':scope > .sm-node-content > .sm-toggle');
      if (toggle) toggle.textContent = '\u25BE'; // ▾
    }
  }

  /**
   * Toggle expand/collapse on a single node.
   * @param {HTMLElement} li
   */
  #toggleNode(li) {
    const expanded = li.getAttribute('aria-expanded') === 'true';
    li.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    const ul = li.querySelector(':scope > ul');
    if (ul) {
      ul.classList.toggle('sm-collapsed', expanded);
    }
    const toggle = li.querySelector(':scope > .sm-node-content > .sm-toggle');
    if (toggle) toggle.textContent = expanded ? '\u25B8' : '\u25BE';
  }

  // ── Click handling ──────────────────────────────────

  /**
   * @param {MouseEvent} e
   */
  #handleClick(e) {
    const target = /** @type {HTMLElement} */ (e.target);

    // Toggle button clicked
    if (target.closest('.sm-toggle')) {
      e.preventDefault();
      const li = target.closest('li[role="treeitem"]');
      if (li) this.#toggleNode(/** @type {HTMLElement} */ (li));
      return;
    }

    // Node content clicked (not a link)
    const li = target.closest('li[role="treeitem"]');
    if (!li) return;

    // Focus the node
    this.#setFocus(/** @type {HTMLElement} */ (li));

    // If an anchor was clicked, dispatch select event
    const anchor = target.closest('a');
    if (anchor) {
      this.dispatchEvent(new CustomEvent('site-map-wc:select', {
        bubbles: true,
        detail: {
          href: anchor.getAttribute('href') || '',
          pageType: li.getAttribute('data-page-type') || 'page',
          template: li.getAttribute('data-template') || '',
        },
      }));
    }
  }

  // ── Keyboard navigation ─────────────────────────────

  /**
   * @param {KeyboardEvent} e
   */
  #handleKeydown(e) {
    const li = /** @type {HTMLElement | null} */ (
      (/** @type {HTMLElement} */ (e.target)).closest('li[role="treeitem"]')
    );
    if (!li) return;

    const key = e.key;
    let handled = false;

    switch (key) {
      case 'ArrowDown':
        handled = true;
        this.#focusNext(li);
        break;
      case 'ArrowUp':
        handled = true;
        this.#focusPrev(li);
        break;
      case 'ArrowRight':
        handled = true;
        if (li.getAttribute('aria-expanded') === 'false') {
          this.#toggleNode(li);
        } else if (li.getAttribute('aria-expanded') === 'true') {
          // Focus first child
          const firstChild = li.querySelector(':scope > ul > li[role="treeitem"]');
          if (firstChild) this.#setFocus(/** @type {HTMLElement} */ (firstChild));
        }
        break;
      case 'ArrowLeft':
        handled = true;
        if (li.getAttribute('aria-expanded') === 'true') {
          this.#toggleNode(li);
        } else {
          // Focus parent
          const parentLi = li.parentElement?.closest('li[role="treeitem"]');
          if (parentLi) this.#setFocus(/** @type {HTMLElement} */ (parentLi));
        }
        break;
      case 'Enter':
        handled = true;
        if (li.hasAttribute('aria-expanded')) {
          this.#toggleNode(li);
        }
        break;
      case ' ':
        handled = true;
        {
          const anchor = li.querySelector(':scope > .sm-node-content > a');
          if (anchor) {
            /** @type {HTMLAnchorElement} */ (anchor).click();
          }
        }
        break;
      case 'Home':
        handled = true;
        {
          const first = this.querySelector('li[role="treeitem"]');
          if (first) this.#setFocus(/** @type {HTMLElement} */ (first));
        }
        break;
      case 'End':
        handled = true;
        {
          const all = this.#getVisibleNodes();
          if (all.length) this.#setFocus(all[all.length - 1]);
        }
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Get all visible (not collapsed) tree items in DOM order.
   * @returns {HTMLElement[]}
   */
  #getVisibleNodes() {
    const nodes = /** @type {HTMLElement[]} */ ([]);
    const walk = (/** @type {Element | null} */ ul) => {
      if (!ul) return;
      const items = /** @type {HTMLElement[]} */ ([...ul.querySelectorAll(':scope > li[role="treeitem"]')]);
      for (const li of items) {
        nodes.push(li);
        if (li.getAttribute('aria-expanded') === 'true') {
          const childUl = li.querySelector(':scope > ul');
          if (childUl) walk(childUl);
        }
      }
    };
    const rootUl = this.querySelector('nav > ul');
    walk(rootUl);
    return nodes;
  }

  /**
   * @param {HTMLElement} current
   */
  #focusNext(current) {
    const visible = this.#getVisibleNodes();
    const idx = visible.indexOf(current);
    if (idx >= 0 && idx < visible.length - 1) {
      this.#setFocus(visible[idx + 1]);
    }
  }

  /**
   * @param {HTMLElement} current
   */
  #focusPrev(current) {
    const visible = this.#getVisibleNodes();
    const idx = visible.indexOf(current);
    if (idx > 0) {
      this.#setFocus(visible[idx - 1]);
    }
  }

  /**
   * @param {HTMLElement} li
   */
  #setFocus(li) {
    if (this.#focusedNode) {
      this.#focusedNode.setAttribute('tabindex', '-1');
    }
    li.setAttribute('tabindex', '0');
    li.focus();
    this.#focusedNode = li;
  }

  // ── Visual tree mode (SVG) ───────────────────────────

  /** SVG namespace */
  static #NS = 'http://www.w3.org/2000/svg';

  /** Node sizing constants */
  static #NODE_W = 150;
  static #NODE_H = 70;
  static #H_GAP = 30;
  static #V_GAP = 50;
  static #PAD = 20;

  /** Page-type colors */
  static #TYPE_COLORS = {
    layout:    { stroke: '#8b5cf6', fill: '#f5f3ff', text: '#6d28d9' },
    section:   { stroke: '#3b82f6', fill: '#eff6ff', text: '#1d4ed8' },
    dashboard: { stroke: '#22c55e', fill: '#f0fdf4', text: '#15803d' },
    page:      { stroke: '#94a3b8', fill: '#f8fafc', text: '#475569' },
    modal:     { stroke: '#f59e0b', fill: '#fffbeb', text: '#b45309' },
    redirect:  { stroke: '#ef4444', fill: '#fef2f2', text: '#b91c1c' },
  };

  /** Status colors */
  static #STATUS_COLORS = { draft: '#94a3b8', ready: '#f59e0b', live: '#22c55e', deprecated: '#ef4444' };

  /**
   * Parse the nav tree into a node hierarchy for layout.
   * @param {Element} ul
   * @returns {Object[]}
   */
  #parseVisualTree(ul) {
    const nodes = [];
    for (const li of ul.querySelectorAll(':scope > li')) {
      const anchor = li.querySelector(':scope > a');
      const childUl = li.querySelector(':scope > ul');
      nodes.push({
        label: anchor?.textContent?.trim() || li.firstChild?.textContent?.trim() || '',
        href: anchor?.getAttribute('href') || '',
        pageType: li.getAttribute('data-page-type') || 'page',
        template: li.getAttribute('data-template') || '',
        status: li.getAttribute('data-status') || '',
        children: childUl ? this.#parseVisualTree(childUl) : [],
        // Layout fields (filled by #layoutTree)
        x: 0, y: 0, subtreeWidth: 0, collapsed: false, childCount: 0,
      });
    }
    return nodes;
  }

  /**
   * Compute subtree widths bottom-up, then assign x,y positions top-down.
   * @param {Object[]} nodes
   * @param {number} depth
   */
  #layoutTree(nodes, depth = 0) {
    const W = SiteMapWc.#NODE_W;
    const H = SiteMapWc.#NODE_H;
    const HG = SiteMapWc.#H_GAP;
    const VG = SiteMapWc.#V_GAP;

    for (const node of nodes) {
      node.childCount = this.#countDescendants(node);
      if (node.children.length > 0 && !node.collapsed) {
        this.#layoutTree(node.children, depth + 1);
        node.subtreeWidth = node.children.reduce((sum, c) => sum + c.subtreeWidth, 0)
          + HG * (node.children.length - 1);
      } else {
        node.subtreeWidth = W;
      }
      node.subtreeWidth = Math.max(node.subtreeWidth, W);
    }
  }

  /**
   * Count all descendants of a node.
   * @param {Object} node
   * @returns {number}
   */
  #countDescendants(node) {
    let count = 0;
    for (const child of node.children) {
      count += 1 + this.#countDescendants(child);
    }
    return count;
  }

  /**
   * Assign absolute x,y positions.
   * @param {Object[]} nodes
   * @param {number} x - left edge of available space
   * @param {number} y - top of this row
   */
  #assignPositions(nodes, x, y) {
    const W = SiteMapWc.#NODE_W;
    const H = SiteMapWc.#NODE_H;
    const HG = SiteMapWc.#H_GAP;
    const VG = SiteMapWc.#V_GAP;

    let cursor = x;
    for (const node of nodes) {
      node.x = cursor + (node.subtreeWidth - W) / 2;
      node.y = y;
      if (node.children.length > 0 && !node.collapsed) {
        this.#assignPositions(node.children, cursor, y + H + VG);
      }
      cursor += node.subtreeWidth + HG;
    }
  }

  /**
   * Build the SVG visual tree and mount it.
   * @param {HTMLElement} nav
   */
  #buildVisualTree(nav) {
    nav.style.display = 'none';
    nav.setAttribute('aria-hidden', 'true');

    const rootUl = nav.querySelector('ul');
    if (!rootUl) return;

    this.#visualData = this.#parseVisualTree(rootUl);
    this.#renderSvg();
  }

  /** @type {Object[]|null} */
  #visualData = null;
  /** @type {number} zoom scale (1 = 100%) */
  #zoom = 1;
  /** @type {'vertical'|'horizontal'} */
  get #orientation() { return this.dataset.orientation === 'horizontal' ? 'horizontal' : 'vertical'; }
  /** @type {number} detail level 0-4 */
  get #detail() { return Math.min(4, Math.max(0, parseInt(this.dataset.detail || '2', 10))); }

  /** Lucide icon SVG fragments */
  static #ICONS = {
    zoomIn:  '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',
    zoomOut: '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>',
    reset:   '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',
    flip:    '<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/>',
  };

  static #DETAIL_LABELS = ['Shape', 'Shape + Title', 'Full', 'Full + Status', 'Wireframe'];

  /** @type {number} */
  static #vtCounter = 0;

  /**
   * Capture the visual anchor state of an existing render so we can restore
   * the user's place after a re-render. We pin the toggled (or focused) node
   * to its current pixel position — that's the most natural mental model
   * after expand/collapse: the node you clicked stays where it was.
   *
   * @param {string|null} anchorId - Preferred anchor node (the toggled node).
   *   Falls back to the focused node, then the SVG center.
   * @returns {{ nodeId: string|null, rectTop: number, rectLeft: number,
   *             focusId: string|null }}
   */
  #captureAnchor(anchorId) {
    const scroller = this.#visualContainer?.querySelector('.sm-visual-scroll');
    const svg = this.#visualContainer?.querySelector('svg[role="tree"]');
    /** @type {{ nodeId: string | null, rectTop: number, rectLeft: number, focusId: string | null }} */
    const anchor = { nodeId: null, rectTop: 0, rectLeft: 0, focusId: this.#visualFocusId };
    if (!scroller || !svg) return anchor;

    const targetId = anchorId || this.#visualFocusId;
    if (!targetId) return anchor;

    const g = svg.querySelector(`[data-node-id="${targetId}"]`);
    const rect = g?.querySelector('rect');
    if (!rect) return anchor;

    const r = rect.getBoundingClientRect();
    const c = scroller.getBoundingClientRect();
    anchor.nodeId = targetId;
    anchor.rectTop = r.top - c.top;
    anchor.rectLeft = r.left - c.left;
    return anchor;
  }

  /**
   * After a re-render, scroll the new SVG so the anchor node ends up at the
   * same pixel position relative to the scroller, and restore keyboard focus.
   *
   * @param {{ nodeId: string|null, rectTop: number, rectLeft: number, focusId: string|null }} anchor
   */
  #restoreAnchor(anchor) {
    const scroller = this.#visualContainer?.querySelector('.sm-visual-scroll');
    const svg = this.#visualContainer?.querySelector('svg[role="tree"]');
    if (!scroller || !svg) return;

    if (anchor.nodeId) {
      const g = svg.querySelector(`[data-node-id="${anchor.nodeId}"]`);
      const rect = g?.querySelector('rect');
      if (rect) {
        const r = rect.getBoundingClientRect();
        const c = scroller.getBoundingClientRect();
        const dy = (r.top - c.top) - anchor.rectTop;
        const dx = (r.left - c.left) - anchor.rectLeft;
        scroller.scrollTop += dy;
        scroller.scrollLeft += dx;
      }
    }

    if (anchor.focusId) {
      this.#focusVisualNode(anchor.focusId);
      /** @type {SVGElement} */ (svg).focus({ preventScroll: true });
    }
  }

  /**
   * Render (or re-render) the SVG from the current visual data + collapse state.
   * @param {{ anchorId?: string }} [opts] - When set, pins this node's pixel
   *   position across the re-render so the user stays anchored at the node
   *   they just toggled.
   */
  #renderSvg(opts = {}) {
    if (!this.#visualData) return;

    // Capture user position BEFORE replacing the container.
    const anchor = this.#captureAnchor(opts.anchorId || null);
    const priorContainer = this.#visualContainer;

    const NS = SiteMapWc.#NS;
    const W = SiteMapWc.#NODE_W;
    const H = SiteMapWc.#NODE_H;
    const PAD = SiteMapWc.#PAD;
    const horiz = this.#orientation === 'horizontal';

    // Layout
    this.#layoutTree(this.#visualData);
    this.#assignPositions(this.#visualData, PAD, PAD);

    // Calculate total bounds
    const bounds = this.#calcBounds(this.#visualData);
    let svgW = bounds.maxX + W + PAD;
    let svgH = bounds.maxY + H + PAD;

    // For horizontal, swap the coordinate space (SVG transform handles rotation)
    if (horiz) [svgW, svgH] = [svgH, svgW];

    // Outer frame — toolbar/summary stay fixed, scroller lives in the middle
    this.#visualContainer = document.createElement('div');
    this.#visualContainer.className = 'sm-visual';
    this.#visualContainer.setAttribute('tabindex', '-1'); // not keyboard-focusable; SVG inside handles keys

    // Toolbar (sibling of scroller — fixed in the frame)
    this.#visualContainer.appendChild(this.#buildToolbar());

    // Inner scroller — only this element scrolls when panning
    const scroller = document.createElement('div');
    scroller.className = 'sm-visual-scroll';

    // SVG element — fixed size, zoom via CSS transform on a wrapper
    const svg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, 'svg'));
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('width', String(svgW));
    svg.setAttribute('height', String(svgH));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Site map${this.getAttribute('title') ? ': ' + this.getAttribute('title') : ''}`);

    // Zoom wrapper — transform: scale() for zoom, wrapper sized to match
    const zoomWrap = document.createElement('div');
    zoomWrap.className = 'sm-visual-zoom';
    zoomWrap.style.width = `${Math.round(svgW * this.#zoom)}px`;
    zoomWrap.style.height = `${Math.round(svgH * this.#zoom)}px`;
    svg.style.transform = `scale(${this.#zoom})`;
    svg.style.transformOrigin = '0 0';

    // Apply rotation for horizontal orientation
    if (horiz) {
      const g = /** @type {SVGGElement} */ (document.createElementNS(NS, 'g'));
      g.setAttribute('transform', `rotate(90 0 0) translate(0 -${svgH})`);
      this.#renderEdges(g, this.#visualData);
      this.#renderNodes(g, this.#visualData);
      svg.appendChild(g);
    } else {
      this.#renderEdges(svg, this.#visualData);
      this.#renderNodes(svg, this.#visualData);
    }

    zoomWrap.appendChild(svg);
    scroller.appendChild(zoomWrap);
    this.#visualContainer.appendChild(scroller);

    // Summary (sibling of scroller — fixed in the frame)
    const summary = document.createElement('div');
    summary.className = 'sm-visual-summary';
    const zoomPct = Math.round(this.#zoom * 100);
    summary.textContent = `${this.#nodeCount} pages \u00B7 ${this.#maxDepth} levels \u00B7 ${zoomPct}%`;
    this.#visualContainer.appendChild(summary);

    // Atomic swap: replace the prior container in one DOM operation, wrapped
    // in a View Transition so the browser crossfades old → new instead of
    // showing a hard snap. Same pattern as diagram-wc. The prior container's
    // DOM listeners are torn down implicitly when it's removed; new
    // listeners are bound to the new svg below.
    const newContainer = this.#visualContainer;
    const swap = () => {
      if (priorContainer && priorContainer.isConnected) {
        priorContainer.replaceWith(newContainer);
      } else {
        this.appendChild(newContainer);
      }
    };

    if (priorContainer?.isConnected
        && 'startViewTransition' in document
        && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const name = `sm-vt-${++SiteMapWc.#vtCounter}`;
      priorContainer.style.viewTransitionName = name;
      newContainer.style.viewTransitionName = name;
      const tx = document.startViewTransition(swap);
      tx.finished.finally(() => {
        newContainer.style.viewTransitionName = '';
      });
      // Restore the anchor and focus after the transition finishes so the
      // user's clicked node lands at the same pixel position.
      tx.updateCallbackDone.then(() => this.#restoreAnchor(anchor));
    } else {
      swap();
      this.#restoreAnchor(anchor);
    }

    // Drag-to-pan on the scroll container (mouse + touch)
    this.#initDragPan(this.#visualContainer, svg);

    // Click handler via event delegation on SVG
    this.listen(svg, 'click', (e) => {
      const target = /** @type {Element} */ (e.target);

      const toggle = target.closest('[data-toggle]');
      if (toggle) {
        const nodeId = toggle.getAttribute('data-toggle');
        if (nodeId) this.#toggleCollapse(nodeId);
        return;
      }

      const nodeG = target.closest('[data-node-id]');
      if (nodeG) {
        const id = nodeG.getAttribute('data-node-id');
        if (id) this.#focusVisualNode(id);
        this.dispatchEvent(new CustomEvent('site-map-wc:select', {
          bubbles: true,
          detail: {
            href: nodeG.getAttribute('data-href') || '',
            pageType: nodeG.getAttribute('data-page-type') || 'page',
            template: nodeG.getAttribute('data-template') || '',
          },
        }));
      }
    });

    // Make SVG focusable — keyboard listener directly on SVG (must re-register each render)
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('role', 'tree');
    svg.setAttribute('aria-label', `Site map${this.getAttribute('title') ? ': ' + this.getAttribute('title') : ''} — use arrow keys to navigate`);
    svg.addEventListener('keydown', (e) => this.#handleVisualKeydown(/** @type {KeyboardEvent} */ (e)));

    // Focus the root node visually (don't auto-steal DOM focus)
    requestAnimationFrame(() => {
      const first = svg.querySelector('[data-node-id]');
      if (first) this.#markFocused(first);
    });
  }

  /**
   * Build the visual mode toolbar with zoom, orientation, and detail controls.
   * @returns {HTMLElement}
   */
  #buildToolbar() {
    const bar = document.createElement('div');
    bar.className = 'sm-vtoolbar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Site map controls');

    const icon = (svg) =>
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>`;

    // Zoom in
    const zoomIn = this.#toolbarBtn(icon(SiteMapWc.#ICONS.zoomIn), 'Zoom in', () => {
      this.#zoom = Math.min(3, this.#zoom + 0.25);
      this.#renderSvg();
    });
    bar.appendChild(zoomIn);

    // Zoom out
    const zoomOut = this.#toolbarBtn(icon(SiteMapWc.#ICONS.zoomOut), 'Zoom out', () => {
      this.#zoom = Math.max(0.25, this.#zoom - 0.25);
      this.#renderSvg();
    });
    bar.appendChild(zoomOut);

    // Reset zoom
    const reset = this.#toolbarBtn(icon(SiteMapWc.#ICONS.reset), 'Reset zoom', () => {
      this.#zoom = 1;
      this.#renderSvg();
    });
    bar.appendChild(reset);

    // Separator
    const sep = document.createElement('span');
    sep.className = 'sm-vtoolbar-sep';
    bar.appendChild(sep);

    // Orientation toggle
    const flipLabel = this.#orientation === 'horizontal' ? 'Vertical' : 'Horizontal';
    const flip = this.#toolbarBtn(icon(SiteMapWc.#ICONS.flip), flipLabel, () => {
      this.dataset.orientation = this.#orientation === 'horizontal' ? 'vertical' : 'horizontal';
      this.#renderSvg();
    });
    bar.appendChild(flip);

    // Separator
    bar.appendChild(sep.cloneNode());

    // Detail level
    const detail = this.#detail;
    const detailWrap = document.createElement('label');
    detailWrap.className = 'sm-vtoolbar-detail';
    detailWrap.textContent = 'Detail ';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '4';
    slider.value = String(detail);
    slider.setAttribute('aria-label', 'Detail level');
    slider.className = 'sm-vtoolbar-slider';
    detailWrap.appendChild(slider);

    const detailLabel = document.createElement('span');
    detailLabel.className = 'sm-vtoolbar-detail-label';
    detailLabel.textContent = SiteMapWc.#DETAIL_LABELS[detail];
    detailWrap.appendChild(detailLabel);

    slider.addEventListener('input', () => {
      this.dataset.detail = slider.value;
      detailLabel.textContent = SiteMapWc.#DETAIL_LABELS[parseInt(slider.value, 10)];
      this.#renderSvg();
    });

    bar.appendChild(detailWrap);

    return bar;
  }

  /**
   * Create a toolbar button.
   * @param {string} iconHtml
   * @param {string} label
   * @param {() => void} onClick
   * @returns {HTMLButtonElement}
   */
  #toolbarBtn(iconHtml, label, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sm-vtoolbar-btn';
    btn.innerHTML = iconHtml;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.addEventListener('click', onClick);
    return btn;
  }

  // ── Visual keyboard navigation ───────────────────────

  /** @type {string|null} ID of the currently focused visual node */
  #visualFocusId = null;

  /**
   * Get flat list of visible node IDs in depth-first order.
   * @param {Object[]} nodes
   * @param {string} [parentId]
   * @returns {string[]}
   */
  #getVisibleNodeIds(nodes, parentId = '') {
    const ids = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeId = parentId ? `${parentId}-${i}` : String(i);
      ids.push(nodeId);
      if (node.children.length > 0 && !node.collapsed) {
        ids.push(...this.#getVisibleNodeIds(node.children, nodeId));
      }
    }
    return ids;
  }

  /**
   * Get the parent ID from a node ID path.
   * @param {string} nodeId
   * @returns {string|null}
   */
  #parentNodeId(nodeId) {
    const last = nodeId.lastIndexOf('-');
    return last > 0 ? nodeId.slice(0, last) : null;
  }

  /**
   * Get the first child ID of a node, if it has visible children.
   * @param {string} nodeId
   * @returns {string|null}
   */
  #firstChildId(nodeId) {
    const node = this.#findNodeById(nodeId, this.#visualData);
    if (!node || node.collapsed || node.children.length === 0) return null;
    return `${nodeId}-0`;
  }

  /**
   * Focus a visual node by ID — add visual ring and aria attribute.
   * @param {string|null} nodeId
   */
  #focusVisualNode(nodeId) {
    if (!nodeId || !this.#visualContainer) return;
    const svg = this.#visualContainer.querySelector('svg[role="tree"]');
    if (!svg) return;

    const g = svg.querySelector(`[data-node-id="${nodeId}"]`);
    if (!g) return;

    this.#markFocused(g);
    this.#visualFocusId = nodeId;

    // Scroll the node into view within the scroller
    const box = g.querySelector('rect');
    const scroller = this.#visualContainer?.querySelector('.sm-visual-scroll');
    if (box && scroller) {
      const r = box.getBoundingClientRect();
      const c = scroller.getBoundingClientRect();
      if (r.left < c.left || r.right > c.right || r.top < c.top || r.bottom > c.bottom) {
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }

  /**
   * Mark a <g> element as focused — update visual ring and ARIA.
   * @param {Element} g
   */
  #markFocused(g) {
    const svg = g.closest('svg');
    if (!svg) return;

    // Remove previous focus ring
    svg.querySelectorAll('.sm-vfocus-ring').forEach(r => r.remove());
    svg.querySelectorAll('[data-node-id]').forEach(el => el.removeAttribute('aria-current'));

    // Add focus ring rect behind the node
    const NS = SiteMapWc.#NS;
    const rect = g.querySelector('rect');
    if (rect) {
      const ring = document.createElementNS(NS, 'rect');
      ring.setAttribute('x', String(parseFloat(rect.getAttribute('x') ?? '0') - 3));
      ring.setAttribute('y', String(parseFloat(rect.getAttribute('y') ?? '0') - 3));
      ring.setAttribute('width', String(parseFloat(rect.getAttribute('width') ?? '0') + 6));
      ring.setAttribute('height', String(parseFloat(rect.getAttribute('height') ?? '0') + 6));
      ring.setAttribute('rx', '11');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#3b82f6');
      ring.setAttribute('stroke-width', '2');
      ring.setAttribute('class', 'sm-vfocus-ring');
      // Insert before the group so it's behind
      g.parentNode?.insertBefore(ring, g);
    }

    g.setAttribute('aria-current', 'true');
    this.#visualFocusId = g.getAttribute('data-node-id');
  }

  /**
   * Handle keyboard events in the visual SVG tree.
   * @param {KeyboardEvent} e
   */
  #handleVisualKeydown(e) {
    if (!this.#visualData) return;

    const current = this.#visualFocusId || '0';
    let handled = false;

    switch (e.key) {
      case 'ArrowDown': {
        // Move into first child (visual: down the tree)
        handled = true;
        const node = this.#findNodeById(current, this.#visualData);
        if (node && node.children.length > 0 && !node.collapsed) {
          this.#focusVisualNode(`${current}-0`);
        }
        break;
      }
      case 'ArrowUp': {
        // Move to parent (visual: up the tree)
        handled = true;
        const parentId = this.#parentNodeId(current);
        if (parentId) this.#focusVisualNode(parentId);
        break;
      }
      case 'ArrowRight': {
        // Move to next sibling
        handled = true;
        const nextSibling = this.#siblingNodeId(current, 1);
        if (nextSibling) this.#focusVisualNode(nextSibling);
        break;
      }
      case 'ArrowLeft': {
        // Move to previous sibling
        handled = true;
        const prevSibling = this.#siblingNodeId(current, -1);
        if (prevSibling) this.#focusVisualNode(prevSibling);
        break;
      }
      case 'Enter':
      case ' ': {
        // Toggle collapse/expand
        handled = true;
        const node = this.#findNodeById(current, this.#visualData);
        if (node && node.children.length > 0) {
          this.#toggleCollapse(current);
        }
        break;
      }
      case 'Home': {
        handled = true;
        this.#focusVisualNode('0');
        break;
      }
      case 'End': {
        handled = true;
        const ids = this.#getVisibleNodeIds(this.#visualData);
        if (ids.length) this.#focusVisualNode(ids[ids.length - 1]);
        break;
      }
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Get a sibling node ID (next or previous at same level).
   * @param {string} nodeId
   * @param {number} delta - +1 for next, -1 for previous
   * @returns {string|null}
   */
  #siblingNodeId(nodeId, delta) {
    const parts = nodeId.split('-').map(Number);
    const lastIdx = parts[parts.length - 1] + delta;
    if (lastIdx < 0) return null;

    // Check that the sibling exists
    const parentId = parts.length > 1 ? parts.slice(0, -1).join('-') : null;
    const parent = parentId
      ? this.#findNodeById(parentId, this.#visualData)
      : null;
    const siblings = parent ? parent.children : this.#visualData;
    if (!siblings || lastIdx >= siblings.length) return null;

    const siblingParts = [...parts];
    siblingParts[siblingParts.length - 1] = lastIdx;
    return siblingParts.join('-');
  }

  /** @type {boolean} */
  #dragPanBound = false;
  /** @type {{ dragging: boolean, startX: number, startY: number, scrollLeft: number, scrollTop: number, moved: boolean }} */
  #dragState = { dragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false };

  /**
   * Enable drag-to-pan on the visual container.
   * Binds to `this` (component) once — survives re-renders.
   * @param {HTMLElement} container - scrollable wrapper
   * @param {SVGElement} svg - the SVG element (for cursor styling)
   */
  #initDragPan(container, svg) {
    svg.style.cursor = 'grab';

    if (this.#dragPanBound) return;
    this.#dragPanBound = true;

    const ds = this.#dragState;

    this.listen(this, 'pointerdown', (/** @type {Event} */ e) => {
      const pe = /** @type {PointerEvent} */ (e);
      if (/** @type {HTMLElement} */ (pe.target).closest('button, [data-toggle], .sm-vtoolbar, input')) return;
      const cont = this.querySelector('.sm-visual-scroll');
      if (!cont) return;
      ds.dragging = true;
      ds.moved = false;
      ds.startX = pe.clientX;
      ds.startY = pe.clientY;
      ds.scrollLeft = cont.scrollLeft;
      ds.scrollTop = cont.scrollTop;
      const s = this.querySelector('svg[role="tree"]');
      if (s) /** @type {SVGElement} */ (s).style.cursor = 'grabbing';
    });

    this.listen(window, 'pointermove', (/** @type {Event} */ e) => {
      if (!ds.dragging) return;
      const pe = /** @type {PointerEvent} */ (e);
      const dx = pe.clientX - ds.startX;
      const dy = pe.clientY - ds.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) ds.moved = true;
      const cont = this.querySelector('.sm-visual-scroll');
      if (cont) {
        cont.scrollLeft = ds.scrollLeft - dx;
        cont.scrollTop = ds.scrollTop - dy;
      }
    });

    this.listen(window, 'pointerup', () => {
      if (!ds.dragging) return;
      ds.dragging = false;
      const s = this.querySelector('svg[role="tree"]');
      if (s) /** @type {SVGElement} */ (s).style.cursor = 'grab';
    });

    // Suppress click if we dragged
    this.listen(this, 'click', (e) => {
      if (ds.moved) {
        e.stopPropagation();
        ds.moved = false;
      }
    }, { capture: true });
  }

  /**
   * Get bounding box of all positioned nodes.
   * @param {Object[]} nodes
   * @returns {{ maxX: number, maxY: number }}
   */
  #calcBounds(nodes) {
    let maxX = 0, maxY = 0;
    for (const node of nodes) {
      if (node.x + SiteMapWc.#NODE_W > maxX) maxX = node.x + SiteMapWc.#NODE_W;
      if (node.y + SiteMapWc.#NODE_H > maxY) maxY = node.y + SiteMapWc.#NODE_H;
      if (node.children.length > 0 && !node.collapsed) {
        const cb = this.#calcBounds(node.children);
        if (cb.maxX > maxX) maxX = cb.maxX;
        if (cb.maxY > maxY) maxY = cb.maxY;
      }
    }
    return { maxX, maxY };
  }

  /**
   * Render connecting edges (lines from parent bottom-center to child top-center).
   * @param {SVGElement} svg
   * @param {Object[]} nodes
   */
  #renderEdges(svg, nodes) {
    const NS = SiteMapWc.#NS;
    const W = SiteMapWc.#NODE_W;
    const H = SiteMapWc.#NODE_H;
    const VG = SiteMapWc.#V_GAP;

    for (const node of nodes) {
      if (node.children.length === 0 || node.collapsed) continue;
      const px = node.x + W / 2;
      const py = node.y + H;
      const midY = py + VG / 2;

      for (const child of node.children) {
        const cx = child.x + W / 2;
        const cy = child.y;

        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#cbd5e1');
        path.setAttribute('stroke-width', '1.5');
        svg.appendChild(path);
      }

      this.#renderEdges(svg, node.children);
    }
  }

  /**
   * Render node rectangles with labels, badges, and collapse toggles.
   * Respects detail level: 0=shape, 1=+title, 2=+badge+template, 3=+status, 4=wireframe
   * @param {SVGElement|Element} svg
   * @param {Object[]} nodes
   * @param {string} [parentId]
   */
  #renderNodes(svg, nodes, parentId = '') {
    const NS = SiteMapWc.#NS;
    const W = SiteMapWc.#NODE_W;
    const H = SiteMapWc.#NODE_H;
    const detail = this.#detail;
    const wireframe = detail >= 4;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeId = parentId ? `${parentId}-${i}` : String(i);
      const colors = wireframe
        ? { stroke: '#94a3b8', fill: '#ffffff', text: '#475569' }
        : (SiteMapWc.#TYPE_COLORS[node.pageType] || SiteMapWc.#TYPE_COLORS.page);

      const g = /** @type {SVGGElement} */ (document.createElementNS(NS, 'g'));
      g.setAttribute('data-node-id', nodeId);
      g.setAttribute('data-href', node.href);
      g.setAttribute('data-page-type', node.pageType);
      g.setAttribute('data-template', node.template);
      g.style.cursor = 'pointer';

      // Box
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', String(node.x));
      rect.setAttribute('y', String(node.y));
      rect.setAttribute('width', String(W));
      rect.setAttribute('height', String(H));
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', colors.fill);
      rect.setAttribute('stroke', colors.stroke);
      rect.setAttribute('stroke-width', wireframe ? '1' : '2');
      if (wireframe || node.pageType === 'modal') rect.setAttribute('stroke-dasharray', '6 3');
      g.appendChild(rect);

      // Detail >= 1: Title
      if (detail >= 1) {
        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', String(node.x + W / 2));
        text.setAttribute('y', String(detail === 1 ? node.y + H / 2 + 5 : node.y + 24));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '13');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', colors.text);
        text.setAttribute('font-family', 'system-ui, sans-serif');
        text.textContent = node.label.length > 18 ? node.label.slice(0, 17) + '\u2026' : node.label;
        g.appendChild(text);
      }

      // Detail >= 2: Type badge + template
      if (detail >= 2) {
        const badge = document.createElementNS(NS, 'text');
        badge.setAttribute('x', String(node.x + W / 2));
        badge.setAttribute('y', String(node.y + 40));
        badge.setAttribute('text-anchor', 'middle');
        badge.setAttribute('font-size', '9');
        badge.setAttribute('font-weight', '700');
        badge.setAttribute('fill', colors.stroke);
        badge.setAttribute('font-family', 'system-ui, sans-serif');
        badge.textContent = (PAGE_TYPES[node.pageType]?.label || node.pageType).toUpperCase();
        g.appendChild(badge);

        if (node.template) {
          const tmpl = document.createElementNS(NS, 'text');
          tmpl.setAttribute('x', String(node.x + W / 2));
          tmpl.setAttribute('y', String(node.y + 54));
          tmpl.setAttribute('text-anchor', 'middle');
          tmpl.setAttribute('font-size', '9');
          tmpl.setAttribute('fill', wireframe ? '#94a3b8' : '#94a3b8');
          tmpl.setAttribute('font-family', 'system-ui, sans-serif');
          tmpl.textContent = node.template;
          g.appendChild(tmpl);
        }
      }

      // Detail >= 3: Status dot
      if (detail >= 3 && node.status && SiteMapWc.#STATUS_COLORS[node.status]) {
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', String(node.x + W / 2));
        dot.setAttribute('cy', String(node.y + H - 8));
        dot.setAttribute('r', '4');
        dot.setAttribute('fill', wireframe ? '#94a3b8' : SiteMapWc.#STATUS_COLORS[node.status]);
        g.appendChild(dot);
      }

      // Detail 4 (wireframe): add cross lines inside the box to suggest wireframe content
      if (wireframe) {
        for (let ly = 0; ly < 2; ly++) {
          const wfLine = document.createElementNS(NS, 'line');
          wfLine.setAttribute('x1', String(node.x + 12));
          wfLine.setAttribute('x2', String(node.x + W - 12));
          wfLine.setAttribute('y1', String(node.y + H - 22 + ly * 8));
          wfLine.setAttribute('y2', String(node.y + H - 22 + ly * 8));
          wfLine.setAttribute('stroke', '#cbd5e1');
          wfLine.setAttribute('stroke-width', '1');
          wfLine.setAttribute('stroke-dasharray', '3 2');
          g.appendChild(wfLine);
        }
      }

      // Collapse/expand toggle (if has children)
      if (node.children.length > 0) {
        const tg = /** @type {SVGGElement} */ (document.createElementNS(NS, 'g'));
        tg.setAttribute('data-toggle', nodeId);
        tg.style.cursor = 'pointer';

        const toggleCircle = document.createElementNS(NS, 'circle');
        toggleCircle.setAttribute('cx', String(node.x + W / 2));
        toggleCircle.setAttribute('cy', String(node.y + H + 10));
        toggleCircle.setAttribute('r', '10');
        toggleCircle.setAttribute('fill', wireframe ? '#fff' : '#f1f5f9');
        toggleCircle.setAttribute('stroke', '#cbd5e1');
        toggleCircle.setAttribute('stroke-width', '1');
        tg.appendChild(toggleCircle);

        const toggleText = document.createElementNS(NS, 'text');
        toggleText.setAttribute('x', String(node.x + W / 2));
        toggleText.setAttribute('y', String(node.y + H + 14));
        toggleText.setAttribute('text-anchor', 'middle');
        toggleText.setAttribute('font-size', '11');
        toggleText.setAttribute('font-weight', '700');
        toggleText.setAttribute('fill', '#64748b');
        toggleText.setAttribute('font-family', 'system-ui, sans-serif');
        toggleText.textContent = node.collapsed ? `+${node.childCount}` : '\u2212';
        tg.appendChild(toggleText);

        g.appendChild(tg);
      }

      svg.appendChild(g);

      if (node.children.length > 0 && !node.collapsed) {
        this.#renderNodes(svg, node.children, nodeId);
      }
    }
  }

  /**
   * Toggle collapsed state on a node and re-render SVG. The toggled node
   * is pinned to its current pixel position via the anchor mechanism in
   * #renderSvg/#restoreAnchor, so the user stays anchored where they
   * clicked rather than having the whole tree shift around them.
   * @param {string} nodeId - Dot-separated path like "0-1-2"
   */
  #toggleCollapse(nodeId) {
    const node = this.#findNodeById(nodeId, this.#visualData);
    if (!node) return;
    node.collapsed = !node.collapsed;
    // Keep the toggled node anchored at the same pixel position. If the
    // user had a different node focused, that one keeps focus too (handled
    // inside #restoreAnchor via the captured focusId).
    if (!this.#visualFocusId) this.#visualFocusId = nodeId;
    this.#renderSvg({ anchorId: nodeId });
  }

  /**
   * Find node by path ID.
   * @param {string} id
   * @param {Object[]|null} nodes
   * @returns {Object|null}
   */
  #findNodeById(id, nodes) {
    if (!nodes) return null;
    const parts = id.split('-').map(Number);
    let current = nodes;
    let node = null;
    for (const idx of parts) {
      if (!current || idx >= current.length) return null;
      node = current[idx];
      current = node.children;
    }
    return node;
  }

  // ── JSON loading ────────────────────────────────────

  async _loadSrc(url) {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.title && !this.getAttribute('title')) {
        this.setAttribute('title', data.title);
      }
      this._setPages(data.pages || []);
    } catch (err) {
      console.warn(`[site-map-wc] Failed to load src="${url}":`, err);
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the current page tree as a nested array.
   * Each page: `{ label, href?, pageType?, template?, status?, children? }`.
   */
  get pages() {
    const nav = this.querySelector(':scope > nav');
    const ul = nav?.querySelector('ul');
    return ul ? this.#serializeListToJson(ul) : [];
  }

  /**
   * Replace the page tree and re-render. Accepts the same nested-pages
   * shape that the JSON `src` mode uses. v1 is record-shaped — the whole
   * tree rebuilds on assignment, so per-node collapse state is lost.
   * Preserving collapse state across re-assignments is on the roadmap
   * if consumers report it as a felt need.
   *
   * Emits site-map-wc:pages-changed { pages, source: 'property' }.
   */
  set pages(value) {
    this._setPages(Array.isArray(value) ? value : []);
    this.dispatchEvent(new CustomEvent('site-map-wc:pages-changed', {
      detail: { pages: this.pages, source: 'property' },
      bubbles: true,
    }));
  }

  /**
   * Internal: rebuild the nav>ul structure from a pages array and re-run
   * setup. Shared between _loadSrc and the .pages setter.
   * @param {Array<any>} pages
   */
  _setPages(pages) {
    while (this.firstChild) this.firstChild.remove();
    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    this.#buildListFromJson(ul, pages);
    nav.appendChild(ul);
    this.appendChild(nav);
    this.teardown();
    this.removeAttribute('data-upgraded');
    this.setup();
  }

  /**
   * Recursive serializer: nav>ul tree → nested pages array. Inverse of
   * #buildListFromJson so .pages getter round-trips through the setter.
   * @param {HTMLUListElement} ul
   */
  #serializeListToJson(ul) {
    const pages = [];
    for (const li of ul.querySelectorAll(':scope > li')) {
      const a = li.querySelector(':scope > a');
      const childUl = li.querySelector(':scope > ul');
      const page = {
        label: a?.textContent?.trim() || '',
        href: a?.getAttribute('href') || undefined,
        pageType: li.getAttribute('data-page-type') || undefined,
        template: li.getAttribute('data-template') || undefined,
        status: li.getAttribute('data-status') || undefined,
      };
      if (childUl) page.children = this.#serializeListToJson(/** @type {HTMLUListElement} */ (childUl));
      pages.push(page);
    }
    return pages;
  }

  /**
   * Recursively build <ul>/<li> from JSON pages array.
   * @param {HTMLUListElement} ul
   * @param {Array<{label: string, href?: string, pageType?: string, template?: string, status?: string, children?: any[]}>} pages
   */
  #buildListFromJson(ul, pages) {
    for (const page of pages) {
      const li = document.createElement('li');
      if (page.pageType) li.setAttribute('data-page-type', page.pageType);
      if (page.template) li.setAttribute('data-template', page.template);
      if (page.status) li.setAttribute('data-status', page.status);

      const a = document.createElement('a');
      a.href = page.href || '#';
      a.textContent = page.label || '';
      li.appendChild(a);

      if (page.children && page.children.length > 0) {
        const childUl = document.createElement('ul');
        this.#buildListFromJson(childUl, page.children);
        li.appendChild(childUl);
      }

      ul.appendChild(li);
    }
  }
}

registerComponent('site-map-wc', SiteMapWc);
export { SiteMapWc };
