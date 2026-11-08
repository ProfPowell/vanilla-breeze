import { startSwapTransition } from '../../utils/swap-transition.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

let tabsVtId = 0;
let tabsNameId = 0;

class TabSet extends VBElement {
  #details = [];
  #summaries = [];
  #vtEnabled = false;
  /** Index of the open tab as last reported (or set during setup). */
  #activeIndex = 0;
  /** True when setup() added role="group" (so teardown() removes only ours). */
  #ownsRole = false;

  setup() {
    this.#details = [...this.querySelectorAll(':scope > details')];
    this.#summaries = this.#details.map(d => d.querySelector(':scope > summary'));

    if (this.#details.length === 0) return false;

    // Vertical orientation sizes its grid rows from the tab count.
    this.style.setProperty('--_tab-count', String(this.#details.length));

    // aria-label/-labelledby are prohibited on a role-less (generic) host;
    // a labelled tab-set is a named group of tabs.
    if (!this.hasAttribute('role')
      && (this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby'))) {
      this.setAttribute('role', 'group');
      this.#ownsRole = true;
    }

    this.#ensureGroupName();
    this.#setup();
    this.#ensureOneOpen();
    this.#activeIndex = Math.max(0, this.#details.findIndex(d => d.open));
    this.#updateAriaStates();
    this.#initVT();
    return true;
  }

  teardown() {
    this.style.removeProperty('--_tab-count');
    if (this.#ownsRole) this.removeAttribute('role');
    this.#ownsRole = false;
    this.#details = [];
    this.#summaries = [];
    this.#vtEnabled = false;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  get tabs() {
    return this.#details.map((d, i) => ({
      id: d.id || undefined,
      label: d.querySelector(':scope > summary')?.textContent?.trim() || `Tab ${i + 1}`,
      content: d.querySelector(':scope > :not(summary)')?.innerHTML || '',
      active: d.hasAttribute('open'),
    }));
  }

  /**
   * Replace the tab set and re-render. Each entry needs `label` (text)
   * and `content` (trusted HTML — written with innerHTML, never pass user
   * input). Optional `id` becomes the <details>'s id; optional
   * `active: true` opens that tab. Defaults to first tab open if none
   * specified. Panels are <section> elements; setup() gives the <details>
   * a per-instance `name` so they stay exclusive.
   *
   * v1 is record-shaped — full rebuild on assignment.
   *
   * Emits tab-set:tabs-changed { tabs, source: 'property' }.
   */
  set tabs(value) {
    const next = Array.isArray(value) ? value : [];
    while (this.firstChild) this.firstChild.remove();
    let activeFound = false;
    for (const t of next) {
      const details = document.createElement('details');
      if (t.id) details.id = t.id;
      if (t.active && !activeFound) {
        details.setAttribute('open', '');
        activeFound = true;
      }
      const summary = document.createElement('summary');
      summary.textContent = t.label || '';
      details.appendChild(summary);
      const panel = document.createElement('section');
      panel.innerHTML = t.content || '';
      details.appendChild(panel);
      this.appendChild(details);
    }
    if (!activeFound && this.firstElementChild) {
      this.firstElementChild.setAttribute('open', '');
    }

    this._reinit();

    this.dispatchEvent(new CustomEvent('tab-set:tabs-changed', {
      detail: { tabs: next, source: 'property' },
      bubbles: true,
    }));
  }

  /**
   * Exclusivity comes from a shared <details name>. Keep the authored name
   * when every tab carries the same one and no other <details> in this tree
   * uses it; otherwise (missing, mixed, or shared with another tab-set)
   * give the set its own name, or two tab-sets would close each other's tabs.
   */
  #ensureGroupName() {
    const names = new Set(this.#details.map(d => d.getAttribute('name') || ''));
    let name = names.size === 1 ? [...names][0] : '';
    if (name) {
      const root = /** @type {Document | ShadowRoot} */ (this.getRootNode());
      const others = root.querySelectorAll?.(`details[name="${CSS.escape(name)}"]`) ?? [];
      for (const d of others) {
        if (!this.#details.includes(/** @type {HTMLDetailsElement} */ (d))) { name = ''; break; }
      }
    }
    if (name) return;
    name = `tab-set-${++tabsNameId}`;
    for (const d of this.#details) d.setAttribute('name', name);
  }

  #initVT() {
    if (!this.hasAttribute('transition') || !document.startViewTransition) return;

    this.#vtEnabled = true;
    const id = ++tabsVtId;
    const type = this.getAttribute('transition') || 'fade';
    const vtClass = type === 'slide' ? 'vt-tabs-slide' : type === 'scale' ? 'vt-tabs-scale' : 'vt-tabs';

    this.#details.forEach((detail) => {
      const panel = /** @type {HTMLElement | null} */ (detail.querySelector(':scope > :not(summary)'));
      if (!panel) return;
      panel.style.viewTransitionName = `tabs-${id}`;
      // @ts-ignore — viewTransitionClass is not in every lib.dom yet
      panel.style.viewTransitionClass = vtClass;
    });
  }

  #switchTab(newIndex) {
    if (newIndex === this.#activeIndex) return;

    const direction = newIndex > this.#activeIndex ? 'forward' : 'backward';
    document.documentElement.dataset.vtDirection = direction;

    const vt = startSwapTransition(() => {
      this.#details[newIndex].open = true;
    });

    vt.finished?.then(() => {
      delete document.documentElement.dataset.vtDirection;
    });
  }

  #setup() {
    this.#details.forEach((detail, i) => {
      const summary = this.#summaries[i];
      const panel = detail.querySelector(':scope > :not(summary)');

      // Sync ARIA state when details toggles (also for a summary-less tab,
      // so the rest of the set stays consistent)
      this.listen(detail, 'toggle', () => this.#handleToggle(i));

      if (!summary || !panel) return;

      // Generate IDs for programmatic relationships
      const tabId = summary.id || `tab-${crypto.randomUUID().slice(0, 8)}`;
      const panelId = panel.id || `panel-${crypto.randomUUID().slice(0, 8)}`;

      // Link summary ↔ panel (no ARIA role overrides — <summary> already
      // has implicit button role; <details name="..."> provides accessible
      // exclusive-accordion behavior natively)
      summary.id = tabId;
      summary.setAttribute('aria-controls', panelId);

      // A <section> panel named by its tab becomes a region; on a generic
      // <div> the name is ignored (documented: use <section> panels).
      panel.id = panelId;
      panel.setAttribute('aria-labelledby', tabId);

      this.listen(summary, 'click', (e) => {
        // Clicking (or Enter/Space on) the active tab is a no-op. Without
        // this, the native <summary> toggle closed it and left no panel.
        if (detail.open) {
          e.preventDefault();
          return;
        }
        // VT click interception — intercepts only when VT is active
        if (!this.#vtEnabled) return;
        e.preventDefault();
        this.#switchTab(i);
      });

      // Keyboard navigation
      this.listen(summary, 'keydown', (e) => this.#handleKey(e, i));
    });
  }

  #ensureOneOpen() {
    if (!this.#details.some(d => d.open)) this.#details[0].open = true;
  }

  /**
   * An exclusive switch fires `toggle` on both the opening and the closing
   * <details>. Only the opening one is an activation: emit tab-set:change
   * once from it, and never for the tab that was already active (setup's
   * own toggles land here asynchronously with index === #activeIndex).
   */
  #handleToggle(index) {
    const details = this.#details[index];
    this.#updateAriaStates();
    if (!details?.open) return;

    const previousIndex = this.#activeIndex;
    if (previousIndex === index) return;
    this.#activeIndex = index;

    this.dispatchEvent(new CustomEvent('tab-set:change', {
      detail: {
        index,
        previousIndex,
        tab: details,
        panel: details.querySelector(':scope > :not(summary)'),
      },
      bubbles: true,
    }));
  }

  #updateAriaStates() {
    this.#details.forEach((detail, i) => {
      const summary = this.#summaries[i];
      if (!summary) return;
      // <summary> exposes an implicit button role; aria-expanded is the
      // supported state attribute for it. aria-selected belongs to tab/
      // option roles, which this component deliberately does not apply.
      summary.setAttribute('tabindex', detail.open ? '0' : '-1');
      summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
    });
  }

  #handleKey(e, currentIndex) {
    const count = this.#details.length;
    const next = (currentIndex + 1) % count;
    const prev = (currentIndex - 1 + count) % count;
    // Arrows follow the visual tab order: in RTL the row runs right to left.
    const rtl = getComputedStyle(this).direction === 'rtl';
    const vertical = this.getAttribute('data-orientation') === 'vertical';
    let newIndex;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = rtl ? prev : next;
        break;
      case 'ArrowLeft':
        newIndex = rtl ? next : prev;
        break;
      case 'ArrowDown':
        if (!vertical) return;
        newIndex = next;
        break;
      case 'ArrowUp':
        if (!vertical) return;
        newIndex = prev;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = count - 1;
        break;
      default:
        return;
    }

    e.preventDefault();

    if (this.#vtEnabled) {
      this.#switchTab(newIndex);
    } else {
      this.#details[newIndex].open = true;
    }
    this.#summaries[newIndex]?.focus();
  }
}

registerComponent('tab-set', TabSet);

export { TabSet };
