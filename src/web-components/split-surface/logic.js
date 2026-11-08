/**
 * split-surface: Resizable panel splitter
 *
 * Two-panel container with a draggable divider. Supports persistence,
 * collapsible panels, keyboard navigation, and full ARIA (APG window
 * splitter: role="separator" with a value, Enter toggles collapse).
 *
 * @attr {string}  direction  - "horizontal" | "vertical" (default: horizontal). Observed
 * @attr {number}  position   - Default split position 0-100 (default: 50). Observed; a
 *                              persisted value wins over it on load
 * @attr {number}  min        - Minimum panel size % (default: 10). Observed
 * @attr {number}  max        - Maximum panel size % (default: 90). Observed
 * @attr {string}  persist    - VBStore key suffix for position + collapsed persistence
 *                              (vb:layout:split:{key})
 * @attr {boolean} collapsible - Enter or double-click on the divider collapses the first panel
 * @attr {string}  data-label-resize    - Divider accessible name (default "Resize panels")
 * @attr {string}  data-label-collapsed - Divider value text while collapsed (default "Collapsed")
 *
 * Direction-aware: in RTL the first panel sits on the right, so pointer
 * math and arrow keys flip (arrows move the divider in their visual
 * direction).
 *
 * @fires split-surface:resize   - { position, source } source: pointer | keyboard | api | attribute
 * @fires split-surface:collapse - { collapsed, source }
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

/**
 * @param {string | null} attr
 * @param {number} fallback
 * @returns {number}
 */
function numAttr(attr, fallback) {
  if (attr === null || attr.trim() === '') return fallback;
  const val = Number(attr);
  return Number.isFinite(val) ? val : fallback;
}

class SplitSurface extends VBElement {
  static observedAttributes = ['position', 'min', 'max', 'direction', 'collapsible',
    'data-label-resize', 'data-label-collapsed'];

  /** @type {HTMLElement | null} */
  #divider = null;
  /** @type {HTMLElement | undefined} */
  #first;
  /** @type {HTMLElement | undefined} */
  #second;
  #position = 50;
  #collapsed = false;
  #preCollapsePosition = 50;
  /** True once a first init has resolved: later inits (reconnect) keep the
   *  live position / collapsed state instead of re-reading attribute/store. */
  #hasState = false;
  /** JS API calls made before the divider exists (async init) are queued. */
  /** @type {{ position?: number, collapsed?: boolean, reset?: boolean }} */
  #pending = {};
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
    return numAttr(this.getAttribute('min'), 10);
  }

  get #max() {
    return numAttr(this.getAttribute('max'), 90);
  }

  get #collapsible() {
    return this.hasAttribute('collapsible');
  }

  get #authoredPosition() {
    return numAttr(this.getAttribute('position'), 50);
  }

  get position() {
    return this.#divider ? this.#position : (this.#pending.position ?? this.#position);
  }

  set position(val) {
    const n = Number(val);
    if (!Number.isFinite(n)) return;
    if (!this.#divider) {
      this.#pending.position = n;
      delete this.#pending.reset;
      return;
    }
    if (this.#collapsed) this.#uncollapse();
    this.#setPosition(n, 'api');
  }

  get collapsed() {
    return this.#divider ? this.#collapsed : (this.#pending.collapsed ?? this.#collapsed);
  }

  set collapsed(val) {
    if (!this.#divider) {
      this.#pending.collapsed = Boolean(val);
      return;
    }
    if (val) this.#collapse('api');
    else this.#expand('api');
  }

  reset() {
    if (!this.#divider) {
      this.#pending = { reset: true };
      this.#clearPersist();
      return;
    }
    if (this.#collapsed) this.#uncollapse();
    this.#setPosition(this.#authoredPosition, 'api');
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

  /** @param {number} generation */
  async #initAsync(generation) {
    // Precedence on first load: a persisted value (the user's last layout)
    // wins over the authored position attribute, which is the default.
    /** @type {{ position: number, collapsed?: boolean } | null} */
    let persisted = null;
    if (!this.#hasState) persisted = await this.#readPersist();
    if (generation !== this.#generation || !this.isConnected) return false;
    const first = /** @type {HTMLElement} */ (this.#first);

    // Create divider
    const divider = document.createElement('div');
    divider.className = 'split-divider';
    divider.setAttribute('role', 'separator');
    if (!first.id) first.id = `vb-split-panel-${++panelIdCounter}`;
    divider.setAttribute('aria-controls', first.id);
    divider.setAttribute('tabindex', '0');
    this.#divider = divider;
    this.#syncStaticAria();
    this.insertBefore(divider, /** @type {HTMLElement} */ (this.#second));

    // Events
    this.listen(divider, 'pointerdown', this.#onPointerDown);
    this.listen(divider, 'keydown', this.#onKeyDown);
    this.listen(divider, 'dblclick', this.#onDblClick);

    // Reconnect keeps the live layout; a collapsed panel remembers its size.
    let position = this.#collapsed ? this.#preCollapsePosition : this.#position;
    let collapsed = this.#collapsed;
    if (!this.#hasState) {
      // A persisted collapsed state stores the pre-collapse size as position.
      position = persisted?.position ?? this.#authoredPosition;
      collapsed = Boolean(persisted?.collapsed) && this.#collapsible;
    }

    // Queued JS API calls made before the divider existed.
    const pending = this.#pending;
    this.#pending = {};
    if (pending.reset) { position = this.#authoredPosition; collapsed = false; }
    if (pending.position !== undefined) { position = pending.position; collapsed = false; }
    if (pending.collapsed !== undefined) collapsed = pending.collapsed;

    this.#hasState = true;
    this.#uncollapse();
    if (collapsed) {
      this.#preCollapsePosition = this.#clamp(position);
      this.#applyCollapsed();
    } else {
      this.#setPosition(position, null);
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

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.#divider) return;
    if (name === 'position') {
      if (this.#collapsed) this.#preCollapsePosition = this.#clamp(this.#authoredPosition);
      else this.#setPosition(this.#authoredPosition, 'attribute');
      return;
    }
    if (name === 'collapsible' && !this.#collapsible && this.#collapsed) {
      this.#expand('attribute');
    }
    this.#syncStaticAria();
    if (!this.#collapsed && (name === 'min' || name === 'max')) {
      this.#setPosition(this.#position, 'attribute');
    }
  }

  /** @param {number} percent */
  #clamp(percent) {
    return Math.min(this.#max, Math.max(this.#min, percent));
  }

  /** ARIA that depends on attributes only (orientation, range, name). */
  #syncStaticAria() {
    const divider = this.#divider;
    if (!divider) return;
    // aria-orientation names the divider's own axis: side-by-side panels
    // (direction="horizontal") have a vertical bar.
    divider.setAttribute('aria-orientation', this.#vertical ? 'horizontal' : 'vertical');
    // A collapsible panel can reach 0, so the range must include it.
    divider.setAttribute('aria-valuemin', String(this.#collapsible ? 0 : this.#min));
    divider.setAttribute('aria-valuemax', String(this.#max));
    divider.setAttribute('aria-label', this.getAttribute('data-label-resize') || 'Resize panels');
    this.#syncValue();
  }

  #syncValue() {
    const divider = this.#divider;
    if (!divider) return;
    const now = Math.round(this.#position);
    divider.setAttribute('aria-valuenow', String(now));
    divider.setAttribute('aria-valuetext', this.#collapsed
      ? (this.getAttribute('data-label-collapsed') || 'Collapsed')
      : `${now}%`);
  }

  #onPointerDown = (/** @type {PointerEvent} */ e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const divider = /** @type {HTMLElement} */ (this.#divider);
    this.setState('divider-dragging', true);
    try { divider.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    divider.addEventListener('pointermove', this.#onPointerMove);
    divider.addEventListener('pointerup', this.#onPointerUp);
    divider.addEventListener('pointercancel', this.#onPointerUp);
    divider.addEventListener('lostpointercapture', this.#onPointerUp);
  };

  #onPointerMove = (/** @type {PointerEvent} */ e) => {
    if (!this.matches(':state(divider-dragging)')) return;
    const rect = this.getBoundingClientRect();
    let percent;
    if (this.#vertical) {
      percent = ((e.clientY - rect.top) / rect.height) * 100;
    } else {
      const offset = this.#rtl ? rect.right - e.clientX : e.clientX - rect.left;
      percent = (offset / rect.width) * 100;
    }
    if (this.#collapsed) this.#uncollapse();
    this.#setPosition(percent, 'pointer');
  };

  // Also handles pointercancel / lostpointercapture, so a cancelled drag
  // never leaves the dragging state (and user-select: none) stuck on.
  #onPointerUp = (/** @type {PointerEvent} */ e) => {
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

  #onKeyDown = (/** @type {KeyboardEvent} */ e) => {
    if (e.key === 'Enter') {
      if (!this.#collapsible) return;
      e.preventDefault();
      if (this.#collapsed) this.#expand('keyboard');
      else this.#collapse('keyboard');
      this.#writePersist();
      return;
    }

    const step = e.shiftKey ? 10 : 1;
    const rtl = !this.#vertical && this.#rtl;
    const dec = this.#vertical ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft');
    const inc = this.#vertical ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight');

    /** @type {number | null} */
    let target = null;
    if (e.key === dec) target = this.#position - step;
    else if (e.key === inc) target = this.#position + step;
    else if (e.key === 'Home') target = this.#min;
    else if (e.key === 'End') target = this.#max;
    if (target === null) return;

    e.preventDefault();
    // Any movement key leaves the collapsed state (no keyboard trap): from
    // collapsed (0) the panel grows back to at least min.
    if (this.#collapsed) {
      this.#uncollapse();
      this.dispatchEvent(new CustomEvent('split-surface:collapse', {
        detail: { collapsed: false, source: 'keyboard' }, bubbles: true
      }));
    }
    this.#setPosition(target, 'keyboard');
    this.#writePersist();
  };

  #onDblClick = () => {
    if (!this.#collapsible) return;
    if (this.#collapsed) this.#expand('pointer');
    else this.#collapse('pointer');
    this.#writePersist();
  };

  /** @param {string} source */
  #collapse(source) {
    if (this.#collapsed || !this.#divider) return;
    this.#preCollapsePosition = this.#position;
    this.#applyCollapsed();
    this.dispatchEvent(new CustomEvent('split-surface:collapse', {
      detail: { collapsed: true, source }, bubbles: true
    }));
  }

  #applyCollapsed() {
    const first = /** @type {HTMLElement} */ (this.#first);
    this.#collapsed = true;
    this.#position = 0;
    first.style.flexBasis = '0%';
    first.style.flexGrow = '0';
    first.style.flexShrink = '0';
    first.style.overflow = 'hidden';
    // The hidden panel's controls must leave the tab order and the a11y tree.
    first.inert = true;
    this.setState('collapsed', true);
    this.#syncValue();
  }

  /** Leave the collapsed state without moving (caller sets the position). */
  #uncollapse() {
    this.#collapsed = false;
    if (this.#first) this.#first.inert = false;
    this.setState('collapsed', false);
  }

  /** @param {string} source */
  #expand(source) {
    if (!this.#collapsed || !this.#divider) return;
    this.#uncollapse();
    this.#setPosition(this.#preCollapsePosition, null);
    this.dispatchEvent(new CustomEvent('split-surface:collapse', {
      detail: { collapsed: false, source }, bubbles: true
    }));
  }

  /**
   * @param {number} percent
   * @param {string | null} source - null = silent (init / expand)
   */
  #setPosition(percent, source) {
    if (!Number.isFinite(percent) || !this.#first || !this.#second) return;
    const clamped = this.#clamp(percent);
    this.#position = clamped;

    this.#first.style.flexBasis = `${clamped}%`;
    this.#first.style.flexGrow = '0';
    this.#first.style.flexShrink = '0';
    this.#first.style.overflow = 'auto';
    this.#second.style.flexGrow = '1';
    this.#second.style.overflow = 'auto';

    this.#syncValue();

    if (source === null) return;
    this.dispatchEvent(new CustomEvent('split-surface:resize', {
      detail: { position: clamped, source }, bubbles: true
    }));
  }

  /** @returns {Promise<{ position: number, collapsed?: boolean } | null>} */
  async #readPersist() {
    const key = this.getAttribute('persist');
    if (!key) return null;
    try {
      const val = /** @type {any} */ (await VBStore.get('layout', `split:${key}`));
      if (val && typeof val === 'object' && typeof val.position === 'number') return val;
    } catch { /* storage unavailable */ }
    return null;
  }

  #writePersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    const value = this.#collapsed
      ? { position: Math.round(this.#preCollapsePosition), collapsed: true }
      : { position: Math.round(this.#position), collapsed: false };
    VBStore.set('layout', `split:${key}`, value).catch(() => { /* ignore */ });
  }

  #clearPersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    VBStore.remove('layout', `split:${key}`).catch(() => { /* ignore */ });
  }
}

registerComponent('split-surface', SplitSurface);

export { SplitSurface };
