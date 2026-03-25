/**
 * split-surface: Resizable panel splitter
 *
 * Two-panel container with a draggable divider. Supports persistence,
 * collapsible panels, keyboard navigation, and full ARIA.
 *
 * @attr {string}  direction  - "horizontal" | "vertical" (default: horizontal)
 * @attr {number}  position   - Initial split position 0-100 (default: 50)
 * @attr {number}  min        - Minimum panel size % (default: 10)
 * @attr {number}  max        - Maximum panel size % (default: 90)
 * @attr {string}  persist    - localStorage key for position persistence
 * @attr {boolean} collapsible - Double-click divider to collapse first panel
 *
 * @example
 * <split-surface>
 *   <nav>Sidebar</nav>
 *   <main>Content</main>
 * </split-surface>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class SplitSurface extends VBElement {
  #divider;
  #first;
  #second;
  #dragging = false;
  #position = 50;
  #collapsed = false;
  #preCollapsePosition = 50;

  get #vertical() {
    return this.getAttribute('direction') === 'vertical';
  }

  get #min() {
    const attr = this.getAttribute('min');
    const val = Number(attr);
    return attr !== null && !isNaN(val) ? val : 10;
  }

  get #max() {
    const attr = this.getAttribute('max');
    const val = Number(attr);
    return attr !== null && !isNaN(val) ? val : 90;
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
    const attr = this.getAttribute('position');
    const val = Number(attr);
    const initial = attr !== null && !isNaN(val) ? val : 50;
    this.#collapsed = false;
    this.#setPosition(initial);
    this.#clearPersist();
  }

  setup() {
    // Select panels: exclude any previously-generated divider
    const panels = [...this.children].filter(el => !el.classList.contains('split-divider'));
    if (panels.length < 2) return false;

    this.#first = panels[0];
    this.#second = panels[1];

    // Read initial position (authored attribute wins over persisted)
    const posAttr = this.getAttribute('position');
    const posVal = Number(posAttr);
    const authored = posAttr !== null && !isNaN(posVal) ? posVal : null;
    const persisted = this.#readPersist();
    const initial = authored ?? persisted ?? 50;

    // Create divider
    this.#divider = document.createElement('div');
    this.#divider.className = 'split-divider';
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
    this.listen(this.#divider, 'pointerdown', this.#onPointerDown);
    this.listen(this.#divider, 'keydown', this.#onKeyDown);

    if (this.hasAttribute('collapsible')) {
      this.listen(this.#divider, 'dblclick', this.#onDblClick);
    }
  }

  teardown() {
    if (this.#divider) {
      this.#divider.remove();
      this.#divider = null;
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
    this.dispatchEvent(new CustomEvent('split-surface:collapse', {
      detail: { collapsed: true }, bubbles: true
    }));
  }

  #expand() {
    this.#collapsed = false;
    this.#first.style.overflow = 'auto';
    this.#setPosition(this.#preCollapsePosition);
    this.dispatchEvent(new CustomEvent('split-surface:collapse', {
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

    this.dispatchEvent(new CustomEvent('split-surface:resize', {
      detail: { position: clamped }, bubbles: true
    }));
  }

  #readPersist() {
    const key = this.getAttribute('persist');
    if (!key) return null;
    try {
      const val = localStorage.getItem(`split-surface:${key}`);
      return val !== null ? Number(val) : null;
    } catch { return null; }
  }

  #writePersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    try {
      localStorage.setItem(`split-surface:${key}`, String(Math.round(this.#position)));
    } catch { /* storage full or blocked */ }
  }

  #clearPersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    try { localStorage.removeItem(`split-surface:${key}`); } catch {}
  }
}

registerComponent('split-surface', SplitSurface);

export { SplitSurface };
