/**
 * carousel-wc: Scroll carousel with controls, indicators, and autoplay
 *
 * Scroll-snap carousel with prev/next buttons, dot indicators, autoplay,
 * keyboard navigation, and full ARIA. Progressive enhancement: renders
 * as a simple flex scroll without JS.
 *
 * When transition is set and View Transitions API is supported,
 * switches to stacked-grid layout with animated slide transitions.
 *
 * @attr {boolean} autoplay       - Enable autoplay
 * @attr {number}  autoplay-delay - Autoplay interval in ms (default: 5000)
 * @attr {boolean} loop           - Wrap around at ends
 * @attr {string}  indicators     - Show dot indicators ("true"/"false", default: "true")
 * @attr {string}  item-width     - Slide width: "full", "auto", or a CSS length such as "18rem" (default: "full")
 * @attr {string}  gap            - Gap token: xs, s, m, l, xl
 * @attr {number}  start          - Initial slide index (default: 0)
 * @attr {string}  persist        - localStorage key for slide persistence
 * @attr {string}  transition     - VT type: "fade" (default), "slide", "scale"
 *
 * @example
 * <carousel-wc>
 *   <div>Slide 1</div>
 *   <div>Slide 2</div>
 *   <div>Slide 3</div>
 * </carousel-wc>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { startSwapTransition } from '../../utils/swap-transition.js';

let carouselVtId = 0;

class CarouselWc extends VBElement {
  #track;
  #slides = [];
  #rotateBtn;
  #prevBtn;
  #nextBtn;
  #indicators;
  #liveRegion;
  #observer;
  /** @type {ReturnType<typeof setInterval> | null} */
  #autoplayTimer = null;
  #currentIndex = 0;
  #announcedIndex = 0;
  #scrollSettling = false;
  #reducedMotion = false;
  #vtMode = false;
  /** @type {(() => void) | null} */
  #swipeCleanup = null;
  /** Rotation is wanted: autoplay set or play() called, not explicitly paused. */
  #rotating = false;
  /** An explicit pause (rotation control or pause()) sticks across reconnects. */
  #userPaused = false;
  /** Hover/touch suspends rotation while the user is on the carousel. */
  #hovered = false;
  /** Keyboard focus inside suspends rotation while it stays inside. */
  #focused = false;
  /** Slides whose aria-label setup() generated (removed again on teardown). */
  #autoLabelled = new WeakSet();

  get currentIndex() {
    return this.#currentIndex;
  }

  get slideCount() {
    return this.#slides.length;
  }

  get playing() {
    return this.#autoplayTimer !== null;
  }

  setup() {
    const children = [...this.children];
    if (children.length === 0) return false;

    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.hasAttribute('data-motion-reduced');
    this.#vtMode = this.hasAttribute('transition') && !!document.startViewTransition;

    // If transition requested but VT API unavailable, remove attribute
    // so CSS falls back to scroll layout instead of broken stacked grid
    if (this.hasAttribute('transition') && !this.#vtMode) {
      this.removeAttribute('transition');
    }

    // Region ARIA — an authored aria-label / aria-labelledby wins; the
    // "Carousel" fallback is only a last resort (pages with several
    // carousels should label each one so the landmarks are distinguishable).
    this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', 'carousel');
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
      this.setAttribute('aria-label', 'Carousel');
    }

    // Build track. It is focusable so arrow keys work, but it is a plain
    // scroll container: no role, so no aria-label (names on generics are
    // ignored or flagged by assistive tech).
    this.#track = document.createElement('div');
    this.#track.className = 'carousel-track';
    this.#track.setAttribute('tabindex', '0');

    // item-width as a CSS length → custom property consumed by styles.css
    const itemWidth = this.getAttribute('item-width');
    if (itemWidth && itemWidth !== 'auto' && itemWidth !== 'full'
      && CSS.supports('inline-size', itemWidth)) {
      this.#track.style.setProperty('--_item-width', itemWidth);
    }

    // Move children into track as slides. An authored (or `slides` record)
    // aria-label is kept; otherwise generate "n of total".
    children.forEach((child, i) => {
      child.setAttribute('role', 'group');
      child.setAttribute('aria-roledescription', 'slide');
      if (!child.hasAttribute('aria-label')) {
        child.setAttribute('aria-label', `${i + 1} of ${children.length}`);
        this.#autoLabelled.add(child);
      }
      this.#track.appendChild(child);
    });

    this.#slides = [...this.#track.children];

    // Rotation control (WCAG 2.2.2 / APG): first in reading order so a
    // screen reader or keyboard user reaches it before the moving content.
    // Not rendered under reduced motion, where autoplay never starts.
    if (this.hasAttribute('autoplay') && !this.#reducedMotion) {
      this.#createRotateButton();
    }

    // Prev button
    this.#prevBtn = document.createElement('button');
    this.#prevBtn.className = 'carousel-prev';
    this.#prevBtn.setAttribute('aria-label', 'Previous slide');
    this.#prevBtn.innerHTML = '<icon-wc name="chevron-left" size="sm"></icon-wc>';

    // Next button
    this.#nextBtn = document.createElement('button');
    this.#nextBtn.className = 'carousel-next';
    this.#nextBtn.setAttribute('aria-label', 'Next slide');
    this.#nextBtn.innerHTML = '<icon-wc name="chevron-right" size="sm"></icon-wc>';

    // Indicators — simple buttons, not tab semantics
    const showIndicators = this.getAttribute('indicators') !== 'false';
    if (showIndicators) {
      this.#indicators = document.createElement('div');
      this.#indicators.className = 'carousel-indicators';
      this.#indicators.setAttribute('role', 'group');
      this.#indicators.setAttribute('aria-label', 'Slide indicators');

      this.#slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        this.listen(dot, 'click', () => this.goTo(i));
        this.#indicators.appendChild(dot);
      });
    }

    // Live region for screen readers. Silent ("off") while rotating so every
    // autoplay tick is not announced; "polite" when paused or manual.
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'carousel-live';
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');

    // Assemble DOM
    if (this.#rotateBtn) this.appendChild(this.#rotateBtn);
    this.appendChild(this.#prevBtn);
    this.appendChild(this.#track);
    this.appendChild(this.#nextBtn);
    if (this.#indicators) this.appendChild(this.#indicators);
    this.appendChild(this.#liveRegion);

    // Events — all tracked for cleanup
    this.listen(this.#prevBtn, 'click', () => this.prev());
    this.listen(this.#nextBtn, 'click', () => this.next());
    this.listen(this.#track, 'keydown', this.#onKeyDown);

    // Hover / focus / touch suspend rotation while the user is engaged. They
    // never change the rotation intent, so an explicit pause sticks.
    this.listen(this, 'mouseenter', () => { this.#hovered = true; this.#syncTimer(); });
    this.listen(this, 'mouseleave', () => { this.#hovered = false; this.#syncTimer(); });
    this.listen(this, 'touchstart', () => { this.#hovered = true; this.#syncTimer(); }, { passive: true });
    this.listen(this, 'focusin', () => { this.#focused = true; this.#syncTimer(); });
    this.listen(this, 'focusout', (e) => {
      if (this.contains(/** @type {Node} */ (/** @type {FocusEvent} */ (e).relatedTarget))) return;
      this.#focused = false;
      this.#syncTimer();
    });

    // VT mode: assign view-transition-name/class to track
    if (this.#vtMode) {
      const id = ++carouselVtId;
      const type = this.getAttribute('transition') || 'fade';
      const vtClass = type === 'slide' ? 'vt-carousel-slide' : type === 'scale' ? 'vt-carousel-scale' : 'vt-carousel';
      this.#track.style.viewTransitionName = `carousel-${id}`;
      this.#track.style.viewTransitionClass = vtClass;
    }

    // VT mode: add swipe navigation via gesture module
    if (this.#vtMode) {
      const track = this.#track;
      import('../../lib/vb-gestures.js').then(({ addSwipeListener }) => {
        // The import resolves async: bail if this setup's track is gone
        // (disconnected, or torn down and rebuilt by a reconnect/_reinit).
        if (!this.isConnected || this.#track !== track) return;
        this.#swipeCleanup = /** @type {() => void} */ (addSwipeListener(track, { threshold: 40 }));
        // Swipe toward the reading direction's "back" side advances.
        this.listen(track, 'swipe-left', () => (this.#isRtl() ? this.prev() : this.next()));
        this.listen(track, 'swipe-right', () => (this.#isRtl() ? this.next() : this.prev()));
      });
    }

    // Non-VT mode: IntersectionObserver to detect current slide
    if (!this.#vtMode) {
      this.#observer = new IntersectionObserver(this.#onIntersect, {
        root: this.#track,
        threshold: 0.5,
      });
      this.#slides.forEach(slide => this.#observer.observe(slide));

      // Smooth scroll + snap can oscillate past the target, making the
      // observer report transient indexes (1 → 0 → 1 for a single next()).
      // Announce the first index change immediately, suppress the
      // transitional flapping, and reconcile once the scroll settles.
      // #setCurrentIndex still updates controls/persistence throughout.
      if ('onscrollend' in window) {
        this.listen(this.#track, 'scrollend', () => {
          this.#scrollSettling = false;
          this.#announceChange();
        });
      }
    }

    // Initial slide (persisted > attribute > 0)
    const persisted = this.#readPersist();
    const start = persisted ?? (Number(this.getAttribute('start')) || 0);

    if (this.#vtMode) {
      // VT mode: hide all but starting slide
      const startIdx = (start > 0 && start < this.#slides.length) ? start : 0;
      this.#slides.forEach((slide, i) => {
        slide.hidden = i !== startIdx;
      });
      this.#setCurrentIndex(startIdx);
    } else if (start > 0 && start < this.#slides.length) {
      this.goTo(start, false);
    }

    this.#updateControls();

    // Autoplay (never under reduced motion; an explicit pause survives
    // reconnects and `slides` rebuilds)
    this.#hovered = this.#focused = false;
    this.#rotating = this.hasAttribute('autoplay') && !this.#reducedMotion && !this.#userPaused;
    this.#syncTimer();
    return true;
  }

  teardown() {
    this.#rotating = false;
    this.#stopTimer();
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
    if (this.#swipeCleanup) {
      this.#swipeCleanup();
      this.#swipeCleanup = null;
    }
    // Restore the authored children and drop the rendered chrome so a
    // reconnect's setup() rebuilds from a clean slate instead of stacking
    // a second set of controls around the old track. Skip when the track
    // was already detached (the .slides setter clears all children before
    // calling teardown — restoring from the detached track would resurrect
    // the old slides alongside the new ones).
    if (this.#track?.parentElement === this) {
      [...this.#track.children].forEach(child => this.appendChild(child));
    }
    this.#slides.forEach((slide) => {
      if (this.#autoLabelled.has(slide)) slide.removeAttribute('aria-label');
    });
    this.#track?.remove();
    this.#rotateBtn?.remove();
    this.#prevBtn?.remove();
    this.#nextBtn?.remove();
    this.#indicators?.remove();
    this.#liveRegion?.remove();
    this.#track = this.#rotateBtn = this.#prevBtn = this.#nextBtn = this.#indicators = this.#liveRegion = null;
    this.#slides = [];
    this.#vtMode = false;
    this.#currentIndex = 0;
    this.#announcedIndex = 0;
    this.#scrollSettling = false;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The current slides as a plain data array.
   * Each entry: `{ id?, html, label? }`.
   *
   * @returns {Array<{ id?: string, html: string, label?: string }>} Slide records.
   */
  get slides() {
    return this.#slides.map((s, i) => ({
      id: s.id || undefined,
      html: s.innerHTML,
      label: s.getAttribute('aria-label') || `${i + 1} of ${this.#slides.length}`,
    }));
  }

  /**
   * Replace the slide set and re-render. Each entry needs `html` (slide
   * content as HTML string). Optional `id` becomes the slide element's
   * id; optional `label` overrides the default ARIA label.
   *
   * v1 is record-shaped — full rebuild on assignment. The carousel resets
   * to slide 0 (or `start` attribute if set). Assigned before the element
   * is connected, the records are rendered as children and built on connect.
   *
   * Emits carousel-wc:slides-changed { slides, source: 'property' }.
   */
  set slides(value) {
    const next = Array.isArray(value) ? value : [];
    // Drop rendered chrome and old slides; _reinit's teardown then skips the
    // child restore because the track is already detached.
    while (this.firstChild) this.firstChild.remove();
    for (const s of next) {
      const div = document.createElement('div');
      if (s.id) div.id = s.id;
      if (s.label) div.setAttribute('aria-label', s.label);
      div.innerHTML = s.html || '';
      this.appendChild(div);
    }

    // Releases listen() handlers, tears down, and rebuilds only when
    // connected (otherwise connectedCallback builds once).
    this._reinit();

    this.dispatchEvent(new CustomEvent('carousel-wc:slides-changed', {
      detail: { slides: next, source: 'property' },
      bubbles: true,
    }));
  }

  next() {
    const loop = this.hasAttribute('loop');
    if (this.#currentIndex < this.#slides.length - 1) {
      this.goTo(this.#currentIndex + 1);
    } else if (loop) {
      this.goTo(0);
    }
  }

  prev() {
    const loop = this.hasAttribute('loop');
    if (this.#currentIndex > 0) {
      this.goTo(this.#currentIndex - 1);
    } else if (loop) {
      this.goTo(this.#slides.length - 1);
    }
  }

  goTo(index, smooth = true) {
    if (index < 0 || index >= this.#slides.length) return;

    if (this.#vtMode) {
      if (smooth && index !== this.#currentIndex) {
        const direction = index > this.#currentIndex ? 'forward' : 'backward';
        document.documentElement.dataset.vtDirection = direction;

        const vt = startSwapTransition(() => {
          this.#showSlide(index);
        });

        vt.finished?.then(() => {
          delete document.documentElement.dataset.vtDirection;
        });
      } else {
        this.#showSlide(index);
      }
    } else {
      // Rect delta from the track's start edge: correct for LTR and for RTL
      // (where scrollLeft runs negative) and for auto/length item widths.
      const slideRect = this.#slides[index].getBoundingClientRect();
      const trackRect = this.#track.getBoundingClientRect();
      const delta = this.#isRtl()
        ? slideRect.right - trackRect.right
        : slideRect.left - trackRect.left;
      const behavior = smooth && !this.#reducedMotion ? 'smooth' : 'instant';
      this.#track.scrollTo({ left: this.#track.scrollLeft + delta, behavior });
    }

    this.#setCurrentIndex(index);
  }

  #showSlide(index) {
    this.#slides.forEach((slide, i) => {
      slide.hidden = i !== index;
    });
  }

  /**
   * Start (or resume) rotation. An explicit request: it overrides a
   * hover/focus suspension. No-op under reduced motion. Renders the
   * rotation control if the carousel did not have one yet.
   */
  play() {
    if (this.#reducedMotion || !this.#track) return;
    this.#userPaused = false;
    this.#rotating = true;
    this.#hovered = this.#focused = false;
    if (!this.#rotateBtn) {
      this.#createRotateButton();
      this.insertBefore(/** @type {HTMLButtonElement} */ (this.#rotateBtn), this.firstChild);
    }
    this.#syncTimer();
  }

  /** Stop rotation until play() / the rotation control resumes it. */
  pause() {
    this.#userPaused = true;
    this.#rotating = false;
    this.#syncTimer();
  }

  #createRotateButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'carousel-rotate';
    this.listen(btn, 'click', () => {
      if (this.#rotating) this.pause();
      else this.play();
    });
    this.#rotateBtn = btn;
    this.#updateRotateButton();
  }

  /** The control names the action it performs (APG rotation control). */
  #updateRotateButton() {
    const btn = this.#rotateBtn;
    if (!btn) return;
    const label = this.#rotating ? 'Pause automatic slide show' : 'Start automatic slide show';
    if (btn.getAttribute('aria-label') === label) return;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = `<icon-wc name="${this.#rotating ? 'pause' : 'play'}" size="sm"></icon-wc>`;
  }

  /** Run the timer iff rotation is wanted and the user is not engaged. */
  #syncTimer() {
    const run = this.#rotating && !this.#hovered && !this.#focused
      && !this.#reducedMotion && this.isConnected && !!this.#track;
    if (run) this.#startTimer();
    else this.#stopTimer();
    this.#updateRotateButton();
  }

  #startTimer() {
    if (this.#autoplayTimer) return;
    const delay = Number(this.getAttribute('autoplay-delay')) || 5000;
    this.#autoplayTimer = setInterval(() => this.next(), delay);
    this.#liveRegion?.setAttribute('aria-live', 'off');
    this.dispatchEvent(new CustomEvent('carousel-wc:play', { bubbles: true }));
  }

  #stopTimer() {
    this.#liveRegion?.setAttribute('aria-live', 'polite');
    if (!this.#autoplayTimer) return;
    clearInterval(this.#autoplayTimer);
    this.#autoplayTimer = null;
    this.dispatchEvent(new CustomEvent('carousel-wc:pause', { bubbles: true }));
  }

  #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

  reset() {
    const initial = Number(this.getAttribute('start')) || 0;
    this.goTo(initial, false);
    this.#clearPersist();
  }

  #setCurrentIndex(index) {
    this.#currentIndex = index;
    this.#updateControls();
    this.#writePersist();

    // Update live region
    if (this.#liveRegion) {
      this.#liveRegion.textContent = `Slide ${index + 1} of ${this.#slides.length}`;
    }

    if (this.#scrollSettling) return; // reconciled on scrollend
    this.#announceChange();
    // Suppress transitional announcements until the scroll settles (only
    // when scrollend support armed the settle listener)
    if (!this.#vtMode && 'onscrollend' in window) this.#scrollSettling = true;
  }

  /** Dispatch carousel-wc:change for the current index, once per change. */
  #announceChange() {
    if (this.#currentIndex === this.#announcedIndex) return;
    this.#announcedIndex = this.#currentIndex;
    this.dispatchEvent(new CustomEvent('carousel-wc:change', {
      detail: { index: this.#currentIndex, slide: this.#slides[this.#currentIndex] },
      bubbles: true,
    }));
  }

  #updateControls() {
    const loop = this.hasAttribute('loop');
    const atStart = this.#currentIndex === 0;
    const atEnd = this.#currentIndex === this.#slides.length - 1;

    if (this.#prevBtn) {
      this.#prevBtn.disabled = !loop && atStart;
    }
    if (this.#nextBtn) {
      this.#nextBtn.disabled = !loop && atEnd;
    }

    // Update indicators
    if (this.#indicators) {
      const dots = this.#indicators.children;
      for (let i = 0; i < dots.length; i++) {
        const active = i === this.#currentIndex;
        dots[i].setAttribute('aria-current', active ? 'true' : 'false');
        if (active) dots[i].setAttribute('data-active', '');
        else dots[i].removeAttribute('data-active');
      }
    }
  }

  #onIntersect = (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const index = this.#slides.indexOf(entry.target);
        if (index !== -1 && index !== this.#currentIndex) {
          this.#setCurrentIndex(index);
        }
      }
    }
  };

  #onKeyDown = (e) => {
    // Arrow keys follow the visual direction: in RTL the next slide is on
    // the left.
    const rtl = (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && this.#isRtl();
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (rtl) this.next(); else this.prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (rtl) this.prev(); else this.next();
        break;
      case 'Home':
        e.preventDefault();
        this.goTo(0);
        break;
      case 'End':
        e.preventDefault();
        this.goTo(this.#slides.length - 1);
        break;
    }
  };

  #readPersist() {
    const key = this.getAttribute('persist');
    if (!key) return null;
    try {
      const val = localStorage.getItem(`carousel:${key}`);
      return val !== null ? Number(val) : null;
    } catch { return null; }
  }

  #writePersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    try {
      localStorage.setItem(`carousel:${key}`, String(this.#currentIndex));
    } catch { /* storage full or blocked */ }
  }

  #clearPersist() {
    const key = this.getAttribute('persist');
    if (!key) return;
    try { localStorage.removeItem(`carousel:${key}`); } catch {}
  }
}

registerComponent('carousel-wc', CarouselWc);

export { CarouselWc };
