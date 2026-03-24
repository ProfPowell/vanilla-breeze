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
 * @attr {string}  item-width     - Slide width: "full", "auto", or CSS length (default: "full")
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
import { startSwapTransition } from '../../utils/swap-transition.js';

let carouselVtId = 0;

class CarouselWc extends HTMLElement {
  #track;
  #slides = [];
  #prevBtn;
  #nextBtn;
  #indicators;
  #liveRegion;
  #observer;
  /** @type {ReturnType<typeof setInterval> | null} */
  #autoplayTimer = null;
  #currentIndex = 0;
  #reducedMotion = false;
  #vtMode = false;
  #cleanups = [];

  get currentIndex() {
    return this.#currentIndex;
  }

  get slideCount() {
    return this.#slides.length;
  }

  get playing() {
    return this.#autoplayTimer !== null;
  }

  connectedCallback() {
    // Guard: don't double-setup on reconnect
    if (this.hasAttribute('data-upgraded')) return;

    const children = [...this.children];
    if (children.length === 0) return;

    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#vtMode = this.hasAttribute('transition') && !!document.startViewTransition;

    // Region ARIA
    this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', 'carousel');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Carousel');
    }

    // Build track
    this.#track = document.createElement('div');
    this.#track.className = 'carousel-track';
    this.#track.setAttribute('tabindex', '0');
    this.#track.setAttribute('aria-label', 'Slides');

    // Move children into track as slides
    children.forEach((child, i) => {
      child.setAttribute('role', 'group');
      child.setAttribute('aria-roledescription', 'slide');
      child.setAttribute('aria-label', `${i + 1} of ${children.length}`);
      this.#track.appendChild(child);
    });

    this.#slides = [...this.#track.children];

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
      this.#indicators.setAttribute('aria-label', 'Slide indicators');

      this.#slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        this.#listen(dot, 'click', () => this.goTo(i));
        this.#indicators.appendChild(dot);
      });
    }

    // Live region for screen readers
    this.#liveRegion = document.createElement('div');
    this.#liveRegion.className = 'carousel-live';
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');

    // Assemble DOM
    this.appendChild(this.#prevBtn);
    this.appendChild(this.#track);
    this.appendChild(this.#nextBtn);
    if (this.#indicators) this.appendChild(this.#indicators);
    this.appendChild(this.#liveRegion);

    // Events — all tracked for cleanup
    this.#listen(this.#prevBtn, 'click', () => this.prev());
    this.#listen(this.#nextBtn, 'click', () => this.next());
    this.#listen(this.#track, 'keydown', this.#onKeyDown);

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
      import('../../lib/vb-gestures.js').then(({ addSwipeListener }) => {
        const cleanup = /** @type {() => void} */ (addSwipeListener(this.#track, { threshold: 40 }));
        this.#cleanups.push(cleanup);
        this.#listen(this.#track, 'swipe-left', () => this.next());
        this.#listen(this.#track, 'swipe-right', () => this.prev());
      });
    }

    // Non-VT mode: IntersectionObserver to detect current slide
    if (!this.#vtMode) {
      this.#observer = new IntersectionObserver(this.#onIntersect, {
        root: this.#track,
        threshold: 0.5,
      });
      this.#slides.forEach(slide => this.#observer.observe(slide));
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

    // Autoplay
    if (this.hasAttribute('autoplay') && !this.#reducedMotion) {
      this.#setupAutoplay();
    }
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    this.pause();
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
    // Remove all tracked listeners
    for (const cleanup of this.#cleanups) cleanup();
    this.#cleanups = [];
    this.#slides = [];
    this.#vtMode = false;
    this.removeAttribute('data-upgraded');
  }

  /** Track an event listener for cleanup on disconnect */
  #listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.#cleanups.push(() => target.removeEventListener(event, handler, options));
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
      const target = this.#slides[index].offsetLeft - this.#track.offsetLeft;
      const behavior = smooth && !this.#reducedMotion ? 'smooth' : 'instant';
      this.#track.scrollTo({ left: target, behavior });
    }

    this.#setCurrentIndex(index);
  }

  #showSlide(index) {
    this.#slides.forEach((slide, i) => {
      slide.hidden = i !== index;
    });
  }

  play() {
    if (this.#autoplayTimer || this.#reducedMotion) return;
    const delay = Number(this.getAttribute('autoplay-delay')) || 5000;
    this.#autoplayTimer = setInterval(() => this.next(), delay);
    this.dispatchEvent(new CustomEvent('carousel-wc:play', { bubbles: true }));
  }

  pause() {
    if (!this.#autoplayTimer) return;
    clearInterval(this.#autoplayTimer);
    this.#autoplayTimer = null;
    this.dispatchEvent(new CustomEvent('carousel-wc:pause', { bubbles: true }));
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

    this.dispatchEvent(new CustomEvent('carousel-wc:change', {
      detail: { index, slide: this.#slides[index] },
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
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.next();
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

  #setupAutoplay() {
    this.play();

    // Pause on hover/focus/touch — all tracked for cleanup
    this.#listen(this, 'mouseenter', () => this.pause());
    this.#listen(this, 'mouseleave', () => {
      if (this.hasAttribute('autoplay')) this.play();
    });
    this.#listen(this, 'focusin', () => this.pause());
    this.#listen(this, 'focusout', (e) => {
      if (!this.contains(/** @type {Node} */ (e.relatedTarget)) && this.hasAttribute('autoplay')) {
        this.play();
      }
    });
    this.#listen(this, 'touchstart', () => this.pause(), { passive: true });
  }

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
