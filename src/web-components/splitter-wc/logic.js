/**
 * splitter-wc: Resizable panel splitter
 *
 * Two-panel container with a draggable divider. Supports persistence,
 * collapsible panels, keyboard navigation, and full ARIA.
 *
 * @attr {string}  data-direction  - "horizontal" | "vertical" (default: horizontal)
 * @attr {number}  data-position   - Initial split position 0-100 (default: 50)
 * @attr {number}  data-min        - Minimum panel size % (default: 10)
 * @attr {number}  data-max        - Maximum panel size % (default: 90)
 * @attr {string}  data-persist    - localStorage key for position persistence
 * @attr {boolean} data-collapsible - Double-click divider to collapse first panel
 *
 * @example
 * <splitter-wc>
 *   <nav>Sidebar</nav>
 *   <main>Content</main>
 * </splitter-wc>
 */
class SplitterWc extends HTMLElement {
  #divider;
  #first;
  #second;
  #dragging = false;
  #position = 50;
  #collapsed = false;
  #preCollapsePosition = 50;

  get #vertical() {
    return this.dataset.direction === 'vertical';
  }

  get #min() {
    return Number(this.dataset.min) || 10;
  }

  get #max() {
    return Number(this.dataset.max) || 90;
  }

  get position() {
    return this.#position;
  }

  set position(val) {
    this.#setPosition(Number(val));
  }

  get collapsed() {
    return this.#collapsed;
  }

  set collapsed(val) {
    if (val) this.#collapse();
    else this.#expand();
  }

  reset() {
    const initial = Number(this.dataset.position) || 50;
    this.#collapsed = false;
    this.#setPosition(initial);
    this.#clearPersist();
  }

  connectedCallback() {
    const children = [...this.children];
    if (children.length < 2) return;

    this.#first = children[0];
    this.#second = children[1];

    // Read initial position (persisted > attribute > 50)
    const persisted = this.#readPersist();
    const initial = persisted ?? (Number(this.dataset.position) || 50);

    // Create divider
    this.#divider = document.createElement('div');
    this.#divider.className = 'splitter-divider';
    this.#divider.setAttribute('role', 'separator');
    this.#divider.setAttribute('aria-orientation', this.#vertical ? 'vertical' : 'horizontal');
    this.#divider.setAttribute('aria-valuenow', String(Math.round(initial)));
    this.#divider.setAttribute('aria-valuemin', String(this.#min));
    this.#divider.setAttribute('aria-valuemax', String(this.#max));
    this.#divider.setAttribute('aria-label', 'Resize panels');
    this.#divider.setAttribute('tabindex', '0');
    this.insertBefore(this.#divider, this.#second);

    this.#setPosition(initial);

    // Events
    this.#divider.addEventListener('pointerdown', this.#onPointerDown);
    this.#divider.addEventListener('keydown', this.#onKeyDown);

    if (this.hasAttribute('data-collapsible')) {
      this.#divider.addEventListener('dblclick', this.#onDblClick);
    }
  }

  disconnectedCallback() {
    if (this.#divider) {
      this.#divider.removeEventListener('pointerdown', this.#onPointerDown);
      this.#divider.removeEventListener('keydown', this.#onKeyDown);
      this.#divider.removeEventListener('dblclick', this.#onDblClick);
    }
  }

  #onPointerDown = (e) => {
    e.preventDefault();
    this.#dragging = true;
    this.#divider.setPointerCapture(e.pointerId);
    this.style.userSelect = 'none';
    this.#divider.addEventListener('pointermove', this.#onPointerMove);
    this.#divider.addEventListener('pointerup', this.#onPointerUp);
  };

  #onPointerMove = (e) => {
    if (!this.#dragging) return;
    const rect = this.getBoundingClientRect();
    let percent;
    if (this.#vertical) {
      percent = ((e.clientY - rect.top) / rect.height) * 100;
    } else {
      percent = ((e.clientX - rect.left) / rect.width) * 100;
    }
    if (this.#collapsed) {
      this.#collapsed = false;
    }
    this.#setPosition(percent);
  };

  #onPointerUp = (e) => {
    this.#dragging = false;
    this.#divider.releasePointerCapture(e.pointerId);
    this.style.userSelect = '';
    this.#divider.removeEventListener('pointermove', this.#onPointerMove);
    this.#divider.removeEventListener('pointerup', this.#onPointerUp);
    this.#writePersist();
  };

  #onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    const current = this.#position;
    const dec = this.#vertical ? ['ArrowUp'] : ['ArrowLeft'];
    const inc = this.#vertical ? ['ArrowDown'] : ['ArrowRight'];

    if (dec.includes(e.key)) {
      e.preventDefault();
      this.#setPosition(current - step);
      this.#writePersist();
    } else if (inc.includes(e.key)) {
      e.preventDefault();
      this.#setPosition(current + step);
      this.#writePersist();
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.#setPosition(this.#min);
      this.#writePersist();
    } else if (e.key === 'End') {
      e.preventDefault();
      this.#setPosition(this.#max);
      this.#writePersist();
    }
  };

  #onDblClick = () => {
    if (this.#collapsed) {
      this.#expand();
    } else {
      this.#collapse();
    }
    this.#writePersist();
  };

  #collapse() {
    this.#preCollapsePosition = this.#position;
    this.#collapsed = true;
    this.#first.style.flexBasis = '0%';
    this.#first.style.overflow = 'hidden';
    this.#divider.setAttribute('aria-valuenow', '0');
    this.#position = 0;
    this.dispatchEvent(new CustomEvent('splitter-collapse', {
      detail: { collapsed: true }, bubbles: true
    }));
  }

  #expand() {
    this.#collapsed = false;
    this.#first.style.overflow = 'auto';
    this.#setPosition(this.#preCollapsePosition);
    this.dispatchEvent(new CustomEvent('splitter-collapse', {
      detail: { collapsed: false }, bubbles: true
    }));
  }

  #setPosition(percent) {
    const clamped = this.#collapsed ? 0 : Math.min(this.#max, Math.max(this.#min, percent));
    this.#position = clamped;

    this.#first.style.flexBasis = `${clamped}%`;
    this.#first.style.flexGrow = '0';
    this.#first.style.flexShrink = '0';
    this.#first.style.overflow = 'auto';
    this.#second.style.flexGrow = '1';
    this.#second.style.overflow = 'auto';

    this.#divider.setAttribute('aria-valuenow', String(Math.round(clamped)));

    this.dispatchEvent(new CustomEvent('splitter-resize', {
      detail: { position: clamped }, bubbles: true
    }));
  }

  #readPersist() {
    const key = this.dataset.persist;
    if (!key) return null;
    try {
      const val = localStorage.getItem(`splitter:${key}`);
      return val !== null ? Number(val) : null;
    } catch { return null; }
  }

  #writePersist() {
    const key = this.dataset.persist;
    if (!key) return;
    try {
      localStorage.setItem(`splitter:${key}`, String(Math.round(this.#position)));
    } catch { /* storage full or blocked */ }
  }

  #clearPersist() {
    const key = this.dataset.persist;
    if (!key) return;
    try { localStorage.removeItem(`splitter:${key}`); } catch {}
  }
}

customElements.define('splitter-wc', SplitterWc);

export { SplitterWc };
