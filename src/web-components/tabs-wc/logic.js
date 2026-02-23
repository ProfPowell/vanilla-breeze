import { startSwapTransition } from '../../utils/swap-transition.js';

let tabsVtId = 0;

class TabsWc extends HTMLElement {
  #details;
  #summaries;
  #vtEnabled = false;
  #previousIndex = 0;

  connectedCallback() {
    this.#details = [...this.querySelectorAll(':scope > details')];
    this.#summaries = this.#details.map(d => d.querySelector('summary'));

    if (this.#details.length === 0) return;

    this.#setup();
    this.#ensureOneOpen();
    this.#initVT();
  }

  #initVT() {
    if (!this.hasAttribute('data-transition') || !document.startViewTransition) return;

    this.#vtEnabled = true;
    const id = ++tabsVtId;
    const type = this.dataset.transition || 'fade';
    const vtClass = type === 'slide' ? 'vt-tabs-slide' : type === 'scale' ? 'vt-tabs-scale' : 'vt-tabs';

    this.#details.forEach((detail) => {
      const panel = detail.querySelector(':scope > :not(summary)');
      if (!panel) return;
      panel.style.viewTransitionName = `tabs-${id}`;
      panel.style.viewTransitionClass = vtClass;
    });

    this.#previousIndex = this.#details.findIndex(d => d.open);
    if (this.#previousIndex === -1) this.#previousIndex = 0;
  }

  #switchTab(newIndex) {
    if (newIndex === this.#previousIndex) return;

    const direction = newIndex > this.#previousIndex ? 'forward' : 'backward';
    document.documentElement.dataset.vtDirection = direction;

    const vt = startSwapTransition(() => {
      this.#details[newIndex].open = true;
    });

    vt.finished?.then(() => {
      delete document.documentElement.dataset.vtDirection;
    });
  }

  #setup() {
    // Add ARIA roles
    this.setAttribute('role', 'tablist');

    this.#details.forEach((detail, i) => {
      const summary = this.#summaries[i];
      const panel = detail.querySelector(':scope > :not(summary)');

      if (!summary || !panel) return;

      // Generate IDs
      const tabId = summary.id || `tab-${crypto.randomUUID().slice(0, 8)}`;
      const panelId = panel.id || `panel-${crypto.randomUUID().slice(0, 8)}`;

      // Set up summary as tab
      summary.id = tabId;
      summary.setAttribute('role', 'tab');
      summary.setAttribute('aria-controls', panelId);
      summary.setAttribute('aria-selected', detail.open ? 'true' : 'false');
      summary.setAttribute('tabindex', detail.open ? '0' : '-1');

      // Set up panel
      panel.id = panelId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tabId);

      // VT click interception — intercepts only when VT is active
      summary.addEventListener('click', (e) => {
        if (!this.#vtEnabled) return;
        e.preventDefault();
        this.#switchTab(i);
      });

      // Keyboard navigation
      summary.addEventListener('keydown', (e) => this.#handleKey(e, i));

      // Sync ARIA state when details toggles
      detail.addEventListener('toggle', () => this.#handleToggle(i));
    });
  }

  #ensureOneOpen() {
    // If none open, open the first one
    const hasOpen = this.#details.some(d => d.open);
    if (!hasOpen && this.#details.length > 0) {
      this.#details[0].open = true;
      this.#updateAriaStates();
    }
  }

  #handleToggle(index) {
    if (this.#details[index].open) {
      this.#previousIndex = index;
    }

    this.#updateAriaStates();

    this.dispatchEvent(new CustomEvent('tabs-wc:change', {
      detail: { index },
      bubbles: true
    }));
  }

  #updateAriaStates() {
    this.#details.forEach((detail, i) => {
      const summary = this.#summaries[i];
      const isOpen = detail.open;
      summary.setAttribute('aria-selected', String(isOpen));
      summary.setAttribute('tabindex', isOpen ? '0' : '-1');
    });
  }

  #handleKey(e, currentIndex) {
    const { key } = e;
    let newIndex;

    switch (key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % this.#details.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + this.#details.length) % this.#details.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.#details.length - 1;
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
    this.#summaries[newIndex].focus();
  }
}

customElements.define('tabs-wc', TabsWc);

export { TabsWc };
