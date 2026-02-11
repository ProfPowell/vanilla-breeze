/**
 * carousel-wc: Scroll carousel with controls, indicators, and autoplay
 *
 * Scroll-snap carousel with prev/next buttons, dot indicators, autoplay,
 * keyboard navigation, and full ARIA. Progressive enhancement: renders
 * as a simple flex scroll without JS.
 *
 * @attr {boolean} data-autoplay       - Enable autoplay
 * @attr {number}  data-autoplay-delay - Autoplay interval in ms (default: 5000)
 * @attr {boolean} data-loop           - Wrap around at ends
 * @attr {string}  data-indicators     - Show dot indicators ("true"/"false", default: "true")
 * @attr {string}  data-item-width     - Slide width: "full", "auto", or CSS length (default: "full")
 * @attr {string}  data-gap            - Gap token: xs, s, m, l, xl
 * @attr {number}  data-start          - Initial slide index (default: 0)
 * @attr {string}  data-persist        - localStorage key for slide persistence
 *
 * @example
 * <carousel-wc>
 *   <div>Slide 1</div>
 *   <div>Slide 2</div>
 *   <div>Slide 3</div>
 * </carousel-wc>
 */
class CarouselWc extends HTMLElement {
  #track;
  #slides = [];
  #prevBtn;
  #nextBtn;
  #indicators;
  #liveRegion;
  #observer;
  #autoplayTimer = null;
  #currentIndex = 0;
  #reducedMotion = false;

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
    const children = [...this.children];
    if (children.length === 0) return;

    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    // Indicators
    const showIndicators = this.dataset.indicators !== 'false';
    if (showIndicators) {
      this.#indicators = document.createElement('div');
      this.#indicators.className = 'carousel-indicators';
      this.#indicators.setAttribute('role', 'tablist');
      this.#indicators.setAttribute('aria-label', 'Slide indicators');

      this.#slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        dot.addEventListener('click', () => this.goTo(i));
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

    // Events
    this.#prevBtn.addEventListener('click', () => this.prev());
    this.#nextBtn.addEventListener('click', () => this.next());
    this.#track.addEventListener('keydown', this.#onKeyDown);

    // IntersectionObserver to detect current slide
    this.#observer = new IntersectionObserver(this.#onIntersect, {
      root: this.#track,
      threshold: 0.5,
    });
    this.#slides.forEach(slide => this.#observer.observe(slide));

    // Initial slide (persisted > attribute > 0)
    const persisted = this.#readPersist();
    const start = persisted ?? (Number(this.dataset.start) || 0);
    if (start > 0 && start < this.#slides.length) {
      this.goTo(start, false);
    }

    this.#updateControls();

    // Autoplay
    if (this.hasAttribute('data-autoplay') && !this.#reducedMotion) {
      this.#setupAutoplay();
    }
  }

  disconnectedCallback() {
    this.pause();
    if (this.#observer) {
      this.#observer.disconnect();
    }
    if (this.#track) {
      this.#track.removeEventListener('keydown', this.#onKeyDown);
    }
  }

  next() {
    const loop = this.hasAttribute('data-loop');
    if (this.#currentIndex < this.#slides.length - 1) {
      this.goTo(this.#currentIndex + 1);
    } else if (loop) {
      this.goTo(0);
    }
  }

  prev() {
    const loop = this.hasAttribute('data-loop');
    if (this.#currentIndex > 0) {
      this.goTo(this.#currentIndex - 1);
    } else if (loop) {
      this.goTo(this.#slides.length - 1);
    }
  }

  goTo(index, smooth = true) {
    if (index < 0 || index >= this.#slides.length) return;

    const behavior = smooth && !this.#reducedMotion ? 'smooth' : 'instant';
    this.#slides[index].scrollIntoView({ behavior, inline: 'start', block: 'nearest' });

    this.#setCurrentIndex(index);
  }

  play() {
    if (this.#autoplayTimer || this.#reducedMotion) return;
    const delay = Number(this.dataset.autoplayDelay) || 5000;
    this.#autoplayTimer = setInterval(() => this.next(), delay);
    this.dispatchEvent(new CustomEvent('carousel-play', { bubbles: true }));
  }

  pause() {
    if (!this.#autoplayTimer) return;
    clearInterval(this.#autoplayTimer);
    this.#autoplayTimer = null;
    this.dispatchEvent(new CustomEvent('carousel-pause', { bubbles: true }));
  }

  reset() {
    const initial = Number(this.dataset.start) || 0;
    this.goTo(initial, false);
    this.#clearPersist();
  }

  #setCurrentIndex(index) {
    this.#currentIndex = index;
    this.#updateControls();
    this.#writePersist();

    // Update live region
    this.#liveRegion.textContent = `Slide ${index + 1} of ${this.#slides.length}`;

    this.dispatchEvent(new CustomEvent('carousel-change', {
      detail: { index, slide: this.#slides[index] },
      bubbles: true,
    }));
  }

  #updateControls() {
    const loop = this.hasAttribute('data-loop');
    const atStart = this.#currentIndex === 0;
    const atEnd = this.#currentIndex === this.#slides.length - 1;

    if (!loop) {
      this.#prevBtn.disabled = atStart;
      this.#nextBtn.disabled = atEnd;
    } else {
      this.#prevBtn.disabled = false;
      this.#nextBtn.disabled = false;
    }

    // Update indicators
    if (this.#indicators) {
      const dots = this.#indicators.children;
      for (let i = 0; i < dots.length; i++) {
        const active = i === this.#currentIndex;
        dots[i].setAttribute('aria-selected', active ? 'true' : 'false');
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

    // Pause on hover/focus/touch
    this.addEventListener('mouseenter', () => this.pause());
    this.addEventListener('mouseleave', () => {
      if (this.hasAttribute('data-autoplay')) this.play();
    });
    this.addEventListener('focusin', () => this.pause());
    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget) && this.hasAttribute('data-autoplay')) {
        this.play();
      }
    });
    this.addEventListener('touchstart', () => this.pause(), { passive: true });
  }

  #readPersist() {
    const key = this.dataset.persist;
    if (!key) return null;
    try {
      const val = localStorage.getItem(`carousel:${key}`);
      return val !== null ? Number(val) : null;
    } catch { return null; }
  }

  #writePersist() {
    const key = this.dataset.persist;
    if (!key) return;
    try {
      localStorage.setItem(`carousel:${key}`, String(this.#currentIndex));
    } catch { /* storage full or blocked */ }
  }

  #clearPersist() {
    const key = this.dataset.persist;
    if (!key) return;
    try { localStorage.removeItem(`carousel:${key}`); } catch {}
  }
}

customElements.define('carousel-wc', CarouselWc);

export { CarouselWc };
