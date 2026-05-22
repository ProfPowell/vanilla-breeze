/**
 * @class SuperMarquee
 * @extends HTMLElement
 * @description Vanilla Breeze marquee component. Modern replacement for the
 *   deprecated <marquee> element. Light DOM, themeable, accessible,
 *   constant-velocity, and pauses when offscreen or tab-hidden.
 *
 * @attr direction - left | right | up | down  (default: left)
 * @attr speed - number, pixels per second  (default: 50)
 * @attr behavior - loop | slide | alternate  (default: loop)
 * @attr gap - CSS length between repeats  (default: 2rem)
 * @attr pause-on-hover - boolean; also pauses on focus-within
 * @attr play-state - running | paused
 * @attr autofill - boolean (default true)
 * @attr fade - boolean or length for edge mask
 * @attr reduced-motion - respect | ignore  (default: respect)
 *
 * @fires marquee-start
 * @fires marquee-pause
 * @fires marquee-cycle - fires on each animation iteration
 */
class SuperMarquee extends HTMLElement {
  static get observedAttributes() {
    return [
      'direction', 'speed', 'behavior', 'gap',
      'play-state', 'pause-on-hover', 'fade',
      'autofill', 'reduced-motion'
    ];
  }

  // ── Functional core: pure getters ──────────────────────────────────────
  get direction()    { return this.getAttribute('direction') || 'left'; }
  get speed()        { return Number(this.getAttribute('speed')) || 50; }
  get behavior()     { return this.getAttribute('behavior') || 'loop'; }
  get gap()          { return this.getAttribute('gap') || '2rem'; }
  get playState()    { return this.getAttribute('play-state') || 'running'; }
  get autofill()     { return this.getAttribute('autofill') !== 'false'; }
  get axis()         { return ['up', 'down'].includes(this.direction) ? 'y' : 'x'; }
  get isReverse()    { return ['right', 'down'].includes(this.direction); }

  // ── Imperative shell ───────────────────────────────────────────────────
  connectedCallback() {
    if (this._built) return;
    this._build();
    this._observe();
    this._update();
    this._built = true;
    this._dispatch('marquee-start');
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._intersectionObserver?.disconnect();
    this._track?.removeEventListener('animationiteration', this._onIteration);
    document.removeEventListener('visibilitychange', this._onVisibility);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this._built) return;
    this._update();
    if (name === 'play-state') {
      this._dispatch(newValue === 'paused' ? 'marquee-pause' : 'marquee-start');
    }
  }

  // ── Public API (legacy <marquee> compat) ───────────────────────────────
  start()   { this.setAttribute('play-state', 'running'); }
  stop()    { this.setAttribute('play-state', 'paused'); }
  toggle()  { this.playState === 'paused' ? this.start() : this.stop(); }
  refresh() { this._update(); }

  // ── Private ────────────────────────────────────────────────────────────
  _build() {
    const items = [...this.childNodes];
    this.textContent = '';

    const viewport = document.createElement('div');
    viewport.className = 'marquee-viewport';

    const track = document.createElement('div');
    track.className = 'marquee-track';

    const original = document.createElement('div');
    original.className = 'marquee-item';
    items.forEach(n => original.appendChild(n));

    track.appendChild(original);
    viewport.appendChild(track);
    this.appendChild(viewport);

    this._original = original;
    this._track = track;
    this._viewport = viewport;
  }

  _observe() {
    this._resizeObserver = new ResizeObserver(() => this._update());
    this._resizeObserver.observe(this);
    this._resizeObserver.observe(this._original);

    this._intersectionObserver = new IntersectionObserver(
      entries => entries.forEach(e => {
        this.dataset.visible = String(e.isIntersecting);
      }),
      { rootMargin: '100px' }
    );
    this._intersectionObserver.observe(this);

    this._onVisibility = () => {
      this.dataset.tabVisible = String(!document.hidden);
    };
    document.addEventListener('visibilitychange', this._onVisibility);
    this.dataset.tabVisible = String(!document.hidden);

    this._onIteration = () => this._dispatch('marquee-cycle');
    this._track.addEventListener('animationiteration', this._onIteration);
  }

  _clearClones() {
    while (this._track.children.length > 1) {
      this._track.lastChild.remove();
    }
  }

  _makeClone() {
    const clone = this._original.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.dataset.clone = '';
    // strip ids — they'd duplicate
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    // remove from tab order & semantic flow
    clone.setAttribute('inert', '');
    return clone;
  }

  _update() {
    if (!this._built && !this._original) return;

    // Reflect state to data-* hooks
    this.dataset.axis = this.axis;
    this.dataset.direction = this.isReverse ? 'reverse' : 'forward';
    this.dataset.behavior = this.behavior;
    this.dataset.state = this.playState;
    this.dataset.ready = '';

    this._clearClones();

    const isHorizontal = this.axis === 'x';
    const viewportSize = isHorizontal
      ? this._viewport.offsetWidth
      : this._viewport.offsetHeight;
    const itemSize = isHorizontal
      ? this._original.offsetWidth
      : this._original.offsetHeight;

    if (itemSize === 0 || viewportSize === 0) return;

    // Resolve gap to pixels using a temporary measurement
    const gapPx = this._resolveGapPx();

    // Decide how many clones we need
    let cloneCount = 0;
    if (this.behavior === 'loop' && this.autofill) {
      // Need total track >= 2x viewport for seamless loop
      const cycleSize = itemSize + gapPx;
      cloneCount = Math.max(1, Math.ceil((viewportSize * 2) / cycleSize));
    } else if (this.behavior === 'loop') {
      cloneCount = 1; // one clone for the seamless wrap
    }
    // slide & alternate need no clones

    for (let i = 0; i < cloneCount; i++) {
      this._track.appendChild(this._makeClone());
    }

    // Compute scroll distance and duration for constant velocity
    let scrollDistance;
    if (this.behavior === 'loop') {
      scrollDistance = itemSize + gapPx;             // one cycle = one item
    } else if (this.behavior === 'alternate') {
      scrollDistance = Math.max(0, itemSize - viewportSize);
    } else { // slide
      scrollDistance = itemSize;
    }

    const duration = scrollDistance > 0 ? scrollDistance / this.speed : 0;

    this.style.setProperty('--marquee-duration', `${duration}s`);
    this.style.setProperty('--marquee-gap', this.gap);
    this.style.setProperty('--marquee-item-size', `${itemSize}px`);
    this.style.setProperty('--marquee-cycle-distance', `${scrollDistance}px`);
    this.style.setProperty('--marquee-viewport-size', `${viewportSize}px`);
  }

  _resolveGapPx() {
    // Read computed gap from the track element (works for any CSS length unit)
    const cs = getComputedStyle(this._track);
    const gap = this.axis === 'x' ? cs.columnGap : cs.rowGap;
    const n = parseFloat(gap);
    return Number.isFinite(n) ? n : 0;
  }

  _dispatch(name) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true }));
  }
}

customElements.define('super-marquee', SuperMarquee);

export { SuperMarquee };
