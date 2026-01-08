class TabsWc extends HTMLElement {
  #details;
  #summaries;

  connectedCallback() {
    this.#details = [...this.querySelectorAll(':scope > details')];
    this.#summaries = this.#details.map(d => d.querySelector('summary'));

    if (this.#details.length === 0) return;

    this.#setup();
    this.#ensureOneOpen();
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
    // When a details opens, update ARIA states
    // The name attribute handles closing others automatically
    this.#updateAriaStates();

    this.dispatchEvent(new CustomEvent('tab-change', {
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

    // Open the new tab (name attribute closes the current one)
    this.#details[newIndex].open = true;
    this.#summaries[newIndex].focus();
  }
}

customElements.define('tabs-wc', TabsWc);

export { TabsWc };
