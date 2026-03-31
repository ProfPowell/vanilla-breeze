/**
 * page-tools: Configurable toolbar for page-level utilities
 *
 * Aggregates per-page tools (print, share, reading stats, etc.) into a
 * cohesive toolbar with configurable positioning. On small viewports,
 * collapses to a floating action button (FAB) with a native popover panel.
 *
 * Auto-discovers children as tools — any direct child element counts.
 * No registry or allow-list needed.
 *
 * @attr {string} data-position    - Positioning: 'sticky' (default), 'fixed', 'inline'
 * @attr {string} data-orientation - Direction: 'auto' (default), 'vertical', 'horizontal'
 * @attr {string} data-gap         - Gap token: 's' (default)
 * @attr {string} data-fab-icon    - Icon name for FAB (default: 'ellipsis-vertical')
 * @attr {string} data-fab-label   - Accessible label for FAB (default: 'Page tools')
 * @attr {string} data-breakpoint  - Collapse width (default: '48rem')
 *
 * @example Sticky sidebar
 * <page-tools data-position="sticky">
 *   <print-page></print-page>
 *   <share-wc variant="icon" size="s"></share-wc>
 * </page-tools>
 *
 * @example Inline horizontal
 * <page-tools data-position="inline">
 *   <page-stats data-for="article-content"></page-stats>
 *   <print-page></print-page>
 * </page-tools>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

let idCounter = 0;

class PageTools extends VBElement {

  #fab = null;
  #popover = null;
  #mql = null;
  #collapsed = false;
  #observer = null;

  setup() {
    /* Toolbar semantics */
    if (!this.hasAttribute('role')) this.setAttribute('role', 'toolbar');
    if (!this.getAttribute('aria-label')) this.setAttribute('aria-label', 'Page tools');

    /* Resolve auto orientation */
    this.#resolveOrientation();

    /* Create FAB + popover infrastructure (hidden until needed) */
    this.#createCollapse();

    /* Watch breakpoint */
    const bp = this.dataset.breakpoint || '48rem';
    this.#mql = matchMedia(`(max-width: ${bp})`);
    this.#handleBreakpoint(this.#mql);
    this.listen(this.#mql, 'change', (e) => this.#handleBreakpoint(e));

    /* Watch for child mutations */
    this.#observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          if (this.#collapsed) this.#syncPopover();
        }
      }
    });
    this.#observer.observe(this, { childList: true });
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;
    /* Restore tools from popover if collapsed */
    if (this.#collapsed) this.#expand();
    this.#fab?.remove();
    this.#popover?.remove();
    this.#fab = null;
    this.#popover = null;
  }

  /** Tools = direct children that are not internal infrastructure */
  get tools() {
    return Array.from(this.children).filter(
      el => !el.hasAttribute('data-page-tools-internal')
    );
  }

  /* ── Orientation ── */

  #resolveOrientation() {
    const orientation = this.dataset.orientation || 'auto';
    if (orientation !== 'auto') return;

    const position = this.dataset.position || 'sticky';
    const resolved = position === 'inline' ? 'horizontal' : 'vertical';
    this.dataset.resolvedOrientation = resolved;
  }

  /* ── FAB + Popover ── */

  #createCollapse() {
    const id = `pt-${++idCounter}`;
    const iconName = this.dataset.fabIcon || 'ellipsis-vertical';
    const label = this.dataset.fabLabel || 'Page tools';

    /* FAB trigger */
    this.#fab = document.createElement('button');
    this.#fab.className = 'page-tools-fab';
    this.#fab.setAttribute('data-page-tools-internal', '');
    this.#fab.setAttribute('popovertarget', id);
    this.#fab.setAttribute('aria-label', label);
    this.#fab.hidden = true;
    this.#fab.innerHTML = `<icon-wc name="${iconName}" size="md"></icon-wc>`;

    /* Popover panel */
    this.#popover = document.createElement('section');
    this.#popover.className = 'page-tools-popover';
    this.#popover.setAttribute('data-page-tools-internal', '');
    this.#popover.id = id;
    this.#popover.setAttribute('popover', '');
    this.#popover.setAttribute('aria-label', label);
    this.#popover.hidden = true;

    this.appendChild(this.#fab);
    this.appendChild(this.#popover);

    /* Return focus to FAB when popover closes */
    this.listen(this.#popover, 'toggle', (e) => {
      if (e.newState === 'closed') this.#fab.focus();
    });
  }

  #handleBreakpoint(mql) {
    const matches = mql.matches ?? mql;
    if (matches) {
      this.#collapse();
    } else {
      this.#expand();
    }
  }

  #collapse() {
    if (this.#collapsed) return;
    this.#collapsed = true;

    /* Move tools into popover */
    const tools = this.tools;
    for (const tool of tools) {
      this.#popover.appendChild(tool);
    }

    this.#fab.hidden = false;
    this.#popover.hidden = false;
    this.dataset.collapsed = '';
  }

  #expand() {
    if (!this.#collapsed) return;
    this.#collapsed = false;

    /* Close popover if open */
    if (this.#popover.matches(':popover-open')) {
      this.#popover.hidePopover();
    }

    /* Move tools back before FAB */
    const tools = Array.from(this.#popover.children);
    for (const tool of tools) {
      this.insertBefore(tool, this.#fab);
    }

    this.#fab.hidden = true;
    this.#popover.hidden = true;
    delete this.dataset.collapsed;
  }

  #syncPopover() {
    /* If collapsed, ensure new non-internal children go into popover */
    const stray = this.tools;
    for (const tool of stray) {
      this.#popover.appendChild(tool);
    }
  }
}

registerComponent('page-tools', PageTools);

export { PageTools };
