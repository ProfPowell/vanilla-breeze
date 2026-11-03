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
 * @attr {string}  persist    - VBStore key suffix for position persistence (vb:layout:split:{key})
 * @attr {boolean} collapsible - Double-click divider to collapse first panel
 * @attr {string}  data-label-resize - Accessible name of the divider (default "Resize panels")
 *
 * Direction-aware: in RTL the first panel sits on the right, so pointer
 * math and arrow keys flip (arrows move the divider in their visual
 * direction).
 *
 * @example
 * <split-surface>
 *   <nav>Sidebar</nav>
 *   <main>Content</main>
 * </split-surface>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { VBStore } from '../../lib/vb-store.js';

let panelIdCounter = 0;

class SplitSurface extends VBElement {
  #divider;
  #first;
  #second;
  #position = 50;
  #collapsed = false;
  #preCollapsePosition = 50;
  /** Bumped on every setup/teardown so a stale async init (remove +
   *  reinsert before the persisted position resolved) never injects a
   *  second divider. */
  #generation = 0;

  get #vertical() {
    return this.getAttribute('direction') === 'vertical';
  }

  get #rtl() {
    return getComputedStyle(this).direction === 'rtl';
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
    // Drop a stale divider (cloned markup carries no listeners), then
    // select the panels.
    for (const stale of this.querySelectorAll(':scope > .split-divider')) stale.remove();
    const panels = [...this.children].filter(el => !el.classList.contains('split-divider'));
    if (panels.length < 2) return false;

    this.#first = /** @type {HTMLElement} */ (panels[0]);
    this.#second = /** @type {HTMLElement} */ (panels[1]);

    this.#initAsync(++this.#generation);
    return true;
  }

  async #initAsync(generation) {
    // Read initial position (authored attribute wins over persisted)
    const posAttr = this.getAttribute('position');
    const posVal = Number(posAttr);
    const authored = posAttr !== null && !isNaN(posVal) ? posVal : null;
    const persisted = await this.#readPersist();
    if (generation !== this.#generation || !this.isConnected) return false;
    const initial = authored ?? persisted ?? 50;

    // Create divider
    this.#divider = document.createElement('div');
    this.#divider.className = 'split-divider';
    this.#divider.setAttribute('role', 'separator');
    // aria-orientation names the divider's own axis: side-by-side panels
    // (direction="horizontal") have a vertical bar.
    this.#divider.setAttribute('aria-orientation', this.#vertical ? 'horizontal' : 'vertical');
    this.#divider.setAttribute('aria-valuenow', String(Math.round(initial)));
    this.#divider.setAttribute('aria-valuemin', String(this.#min));
    this.#divider.setAttribute('aria-valuemax', String(this.#max));
    this.#divider.setAttribute('aria-label', this.getAttribute('data-label-resize') || 'Resize panels');
    if (!this.#first.id) this.#first.id = `vb-split-panel-${++panelIdCounter}`;
    this.#divider.setAttribute('aria-controls', this.#first.id);
    this.#divider.setAttribute('tabindex', '0');
    this.insertBefore(this.#divider, this.#second);

    this.#setPosition(initial);

    // Events
    this.listen(this.#divider, 'pointerdown', this.#onPointerDown);
    this.listen(this.#divider, 'keydown', this.#onKeyDown);

    if (this.hasAttribute('collapsible')) {
      this.listen(this.#divider, 'dblclick', this.#onDblClick);
    }
    return true;
  }

  teardown() {
    this.#generation++;
    if (this.#divider) {
      this.#divider.remove();
      this.#divider = null;
    }
  }

  #onPointerDown = (e) => {
    e.preventDefault();
    this.setState('divider-dragging', true);
    this.#divider.setPointerCapture(e.pointerId);
    this.#divider.addEventListener('pointermove', this.#onPointerMove);
    this.#divider.addEventListener('pointerup', this.#onPointerUp);
    this.#divider.addEventListener('pointercancel', this.#onPointerUp);
    this.#divider.addEventListener('lostpointercapture', this.#onPointerUp);
  };

  #onPointerMove = (e) => {
    if (!this.matches(':state(divider-dragging)')) return;
    const rect = this.getBoundingClientRect();
    let percent;
    if (this.#vertical) {
      percent = ((e.clientY - rect.top) / rect.height) * 100;
    } else {
      const offset = this.#rtl ? rect.right - e.clientX : e.clientX - rect.left;
      percent = (offset / rect.width) * 100;
    }
    if (this.#collapsed) {
      this.#collapsed = false;
    }
    this.#setPosition(percent);
  };

  // Also handles pointercancel / lostpointercapture, so a cancelled drag
  // never leaves the dragging state (and user-select: none) stuck on.
  #onPointerUp = (e) => {
    if (!this.#divider) return;
    const wasDragging = this.matches(':state(divider-dragging)');
    this.setState('divider-dragging', false);
    if (this.#divider.hasPointerCapture(e.pointerId)) this.#divider.releasePointerCapture(e.pointerId);
    this.#divider.removeEventListener('pointermove', this.#onPointerMove);
    this.#divider.removeEventListener('pointerup', this.#onPointerUp);
    this.#divider.removeEventListener('pointercancel', this.#onPointerUp);
    this.#divider.removeEventListener('lostpointercapture', this.#onPointerUp);
    if (wasDragging) this.#writePersist();
  };

  #onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 1;
    const current = this.#position;
    const rtl = !this.#vertical && this.#rtl;
    const dec = this.#vertical ? ['ArrowUp'] : [rtl ? 'ArrowRight' : 'ArrowLeft'];
    const inc = this.#vertical ? ['ArrowDown'] : [rtl ? 'ArrowLeft' : 'ArrowRight'];

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

  async #readPersist() {
    const key = this.getAttribute('persist');
    if (!key) return null;
    const val = await VBStore.get('layout', `split:${key}`);
    return typeof val === 'number' ? val : null;
  }

  #writePersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    VBStore.set('layout', `split:${key}`, Math.round(this.#position)).catch(() => { /* ignore */ });
  }

  #clearPersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    VBStore.remove('layout', `split:${key}`).catch(() => { /* ignore */ });
  }
}

registerComponent('split-surface', SplitSurface);

export { SplitSurface };
