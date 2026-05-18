/**
 * image-gallery: Thumbnail grid with lightbox viewer
 *
 * Progressively enhances a grid of linked thumbnails into a lightbox
 * gallery with navigation, swipe, keyboard, and View Transitions.
 * Uses native <dialog> with Invokers API for close, and Popover API
 * for caption details.
 *
 * No-JS baseline: thumbnails link directly to full images via <a href>.
 *
 * @attr {string}  columns    - Min column width: "100px"-"300px" (default: "200px")
 * @attr {string}  gap        - Grid gap token: xs, s, m, l, xl (default: "s")
 * @attr {string}  ratio      - Thumbnail aspect-ratio: 1, 4:3, 3:2, 16:9, 3:4, auto
 * @attr {boolean} loop       - Wrap navigation at ends
 * @attr {string}  captions   - Caption mode: "auto" (popover), "overlay", "hidden"
 * @attr {string}  transition - VT mode: "morph", "fade", "none" (default: "morph")
 *
 * @example
 * <image-gallery>
 *   <a href="full.jpg"><img src="thumb.jpg" alt="Photo" /></a>
 * </image-gallery>
 *
 * @example
 * <image-gallery>
 *   <figure>
 *     <a href="full.jpg"><img src="thumb.jpg" alt="Photo" /></a>
 *     <figcaption>Caption with <a href="/link">link</a></figcaption>
 *   </figure>
 * </image-gallery>
 */
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { startSwapTransition } from '../../utils/swap-transition.js';

let galleryId = 0;

class ImageGallery extends VBElement {
  /** @type {{ href: string, thumbSrc: string, alt: string, caption: string|null, thumbEl: HTMLImageElement }[]} */
  #items = [];
  #currentIndex = 0;

  /** @type {HTMLDialogElement|null} */
  #dialog = null;
  /** @type {HTMLElement|null} */
  #stage = null;
  /** @type {HTMLElement|null} */
  #frame = null;
  /** @type {HTMLElement|null} */
  #counter = null;
  /** @type {HTMLButtonElement|null} */
  #prevBtn = null;
  /** @type {HTMLButtonElement|null} */
  #nextBtn = null;
  /** @type {HTMLButtonElement|null} */
  #infoBtn = null;
  /** @type {HTMLElement|null} */
  #detailsPopover = null;

  /** @type {Function|null} */
  #swipeCleanup = null;
  #id = '';
  #vtSupported = false;

  setup() {
    this.#id = `gallery-lb-${++galleryId}`;
    this.#vtSupported = !!document.startViewTransition;
    this.#collectItems();
    if (this.#items.length === 0) return false;

    // Intercept clicks on thumbnail links
    this.listen(this, 'click', this.#onThumbnailClick);
    return true;
  }

  teardown() {
    if (this.#swipeCleanup) {
      this.#swipeCleanup();
      this.#swipeCleanup = null;
    }
    if (this.#dialog) {
      this.#dialog.remove();
      this.#dialog = null;
    }
    this.#items = [];
  }

  // --- Data API (HTML-first / JS-first dual contract) ---

  /**
   * Read the current image set as a plain data array. Each entry is
   * `{ href, thumbSrc, alt, caption }` mirroring what was either parsed
   * from <a><img></a> markup at upgrade or assigned via the setter.
   */
  get images() {
    return this.#items.map(it => ({
      href: it.href,
      thumbSrc: it.thumbSrc,
      alt: it.alt,
      caption: it.caption,
    }));
  }

  /**
   * Replace the gallery with a new image set. Each entry needs at least
   * `href` and `thumbSrc`; `alt` and `caption` are optional. Rebuilds
   * the thumbnail children, preserves the lightbox chrome (which lives
   * outside the gallery's child slot), and refreshes internal state.
   * Emits image-gallery:images-changed { images, source: 'property' }.
   */
  set images(value) {
    const next = Array.isArray(value) ? value : [];

    // Remove existing thumbnail children. Preserve any non-thumbnail
    // children the consumer may have added (the lightbox dialog lives
    // outside `this` so it isn't touched).
    for (const child of [...this.children]) {
      if (child.tagName === 'FIGURE' || child.tagName === 'A') child.remove();
    }

    // Build fresh <figure><a href><img></a><figcaption></figure> per image.
    for (const img of next) {
      if (!img?.href || !img?.thumbSrc) continue;
      const wrapper = img.caption ? document.createElement('figure') : document.createElement('a');
      const anchor = /** @type {HTMLAnchorElement} */ (
        wrapper.tagName === 'FIGURE' ? document.createElement('a') : wrapper
      );
      anchor.href = img.href;
      const imgEl = document.createElement('img');
      imgEl.src = img.thumbSrc;
      imgEl.alt = img.alt || '';
      anchor.appendChild(imgEl);
      if (wrapper.tagName === 'FIGURE') {
        wrapper.appendChild(anchor);
        const cap = document.createElement('figcaption');
        cap.innerHTML = img.caption ?? '';
        wrapper.appendChild(cap);
      }
      this.appendChild(wrapper);
    }

    // Re-collect from the freshly built DOM so #items + thumbEl refs are valid.
    this.#collectItems();

    this.dispatchEvent(new CustomEvent('image-gallery:images-changed', {
      detail: { images: this.images, source: 'property' },
      bubbles: true,
    }));
  }

  // --- Public API ---

  /** Open the lightbox at a given index */
  open(index) {
    if (index < 0 || index >= this.#items.length) return;
    if (!this.#dialog) this.#buildDialog();

    this.#loadImage(index);

    const item = this.#items[index];
    const transition = this.getAttribute('transition') || 'morph';

    if (this.#vtSupported && transition === 'morph' && this.#frame && this.#dialog) {
      const vtName = `gallery-morph-${this.#id}`;
      item.thumbEl.style.viewTransitionName = vtName;
      const frame = this.#frame;
      const dialog = this.#dialog;

      startSwapTransition(() => {
        // Move the VT name from thumbnail to full image for the "new" snapshot
        item.thumbEl.style.viewTransitionName = '';
        const img = /** @type {HTMLImageElement | null} */ (frame.querySelector('img'));
        if (img) img.style.viewTransitionName = vtName;
        dialog.showModal();
      }).finished?.then(() => {
        const img = /** @type {HTMLImageElement | null} */ (frame.querySelector('img'));
        if (img) img.style.viewTransitionName = '';
      });
    } else {
      this.#dialog?.showModal();
    }

    this.#preloadAdjacent(index);
  }

  /** Close the lightbox */
  close() {
    if (!this.#dialog?.open) return;

    const item = this.#items[this.#currentIndex];
    const transition = this.getAttribute('transition') || 'morph';

    if (this.#vtSupported && transition === 'morph' && this.#frame && this.#dialog) {
      const vtName = `gallery-morph-${this.#id}`;
      const img = /** @type {HTMLImageElement | null} */ (this.#frame.querySelector('img'));
      if (img) img.style.viewTransitionName = vtName;
      const dialog = this.#dialog;

      startSwapTransition(() => {
        // Move the VT name from full image to thumbnail for the "new" snapshot
        if (img) img.style.viewTransitionName = '';
        item.thumbEl.style.viewTransitionName = vtName;
        dialog.close();
      }).finished?.then(() => {
        item.thumbEl.style.viewTransitionName = '';
      });
    } else {
      this.#dialog?.close();
    }
  }

  next() {
    const loop = this.hasAttribute('loop');
    if (this.#currentIndex < this.#items.length - 1) {
      this.#navigate(this.#currentIndex + 1);
    } else if (loop) {
      this.#navigate(0);
    }
  }

  prev() {
    const loop = this.hasAttribute('loop');
    if (this.#currentIndex > 0) {
      this.#navigate(this.#currentIndex - 1);
    } else if (loop) {
      this.#navigate(this.#items.length - 1);
    }
  }

  // --- Private ---

  #collectItems() {
    this.#items = [];
    for (const child of this.children) {
      const isFigure = child.tagName === 'FIGURE';
      const anchor = /** @type {HTMLAnchorElement | null} */ (
        isFigure ? child.querySelector('a[href]') : (child.matches('a[href]') ? child : null)
      );
      if (!anchor) continue;

      const img = /** @type {HTMLImageElement | null} */ (anchor.querySelector('img'));
      if (!img) continue;

      const caption = isFigure ? child.querySelector('figcaption')?.innerHTML ?? null : null;

      this.#items.push({
        href: anchor.href,
        thumbSrc: img.src,
        alt: img.alt || '',
        caption,
        thumbEl: img,
      });
    }
  }

  /** @type {(e: Event) => void} */
  #onThumbnailClick = (e) => {
    const target = /** @type {Element | null} */ (e.target);
    const anchor = target?.closest('a[href]');
    if (!anchor || !this.contains(anchor)) return;

    // Find which item was clicked
    const img = anchor.querySelector('img');
    const index = this.#items.findIndex(item => item.thumbEl === img);
    if (index === -1) return;

    e.preventDefault();
    this.open(index);
  };

  #buildDialog() {
    const dialog = document.createElement('dialog');
    dialog.id = this.#id;
    dialog.className = 'gallery-lightbox';
    dialog.dataset.size = 'full';

    // Forward the controls attribute to the dialog for CSS
    const controls = this.getAttribute('controls') || 'edge';
    dialog.dataset.controls = controls;

    // Header — counter, info, close
    const header = document.createElement('header');

    const counter = document.createElement('span');
    counter.className = 'gallery-counter';
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-atomic', 'true');
    this.#counter = counter;

    // Close button — Invokers API with JS fallback
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'gallery-close';
    closeBtn.setAttribute('commandfor', this.#id);
    closeBtn.setAttribute('command', 'close');
    closeBtn.setAttribute('aria-label', 'Close gallery');
    closeBtn.innerHTML = '<icon-wc name="x" size="sm"></icon-wc>';
    this.listen(closeBtn, 'click', () => this.close());

    header.append(counter);

    const captionMode = this.getAttribute('captions') || 'auto';

    header.append(closeBtn);

    // Stage — prev, image frame, next
    const stage = document.createElement('section');
    stage.className = 'gallery-stage';
    this.#stage = stage;

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'gallery-prev';
    prevBtn.setAttribute('aria-label', 'Previous image');
    prevBtn.innerHTML = '<icon-wc name="chevron-left" size="sm"></icon-wc>';
    this.#prevBtn = prevBtn;

    const frame = document.createElement('figure');
    frame.className = 'gallery-frame';
    this.#frame = frame;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'gallery-next';
    nextBtn.setAttribute('aria-label', 'Next image');
    nextBtn.innerHTML = '<icon-wc name="chevron-right" size="sm"></icon-wc>';
    this.#nextBtn = nextBtn;

    stage.append(prevBtn, frame, nextBtn);

    // Caption footer (auto mode) — button + collapsible text, always in place
    if (captionMode === 'auto') {
      const captionFooter = document.createElement('footer');
      captionFooter.className = 'gallery-caption';
      captionFooter.hidden = true; // hidden until an image with caption is shown

      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.className = 'gallery-info-btn';
      infoBtn.setAttribute('aria-label', 'Show image details');
      infoBtn.setAttribute('aria-expanded', 'false');
      infoBtn.innerHTML = '<icon-wc name="info" size="sm"></icon-wc>';
      this.#infoBtn = infoBtn;

      const captionText = document.createElement('div');
      captionText.className = 'gallery-caption-text';
      captionText.hidden = true;

      captionFooter.append(infoBtn, captionText);
      this.#detailsPopover = captionText; // the text container

      dialog.append(header, stage, captionFooter);

      // Info button toggles just the text — footer stays in place
      this.listen(infoBtn, 'click', () => {
        const showing = !captionText.hidden;
        captionText.hidden = showing;
        infoBtn.setAttribute('aria-expanded', String(!showing));
        infoBtn.setAttribute('aria-label', showing ? 'Show image details' : 'Hide image details');
      });
    } else {
      dialog.append(header, stage);
    }

    this.append(dialog);
    this.#dialog = dialog;

    // Event listeners
    this.listen(prevBtn, 'click', () => this.prev());
    this.listen(nextBtn, 'click', () => this.next());
    this.listen(dialog, 'keydown', this.#onKeyDown);

    // Close on backdrop click
    this.listen(dialog, 'click', (e) => {
      if (e.target === dialog) this.close();
    });

    // Handle native close (Escape key, Invokers API) — clean up VT state
    this.listen(dialog, 'close', () => {
      const item = this.#items[this.#currentIndex];
      if (item) item.thumbEl.style.viewTransitionName = '';
      const img = this.#frame?.querySelector('img');
      if (img) img.style.viewTransitionName = '';
    });

    // Swipe — lazy-load gesture module
    import('../../lib/vb-gestures.js').then(({ addSwipeListener }) => {
      this.#swipeCleanup = addSwipeListener(stage, { threshold: 40 });
      this.listen(stage, 'swipe-left', () => this.next());
      this.listen(stage, 'swipe-right', () => this.prev());
    });
  }

  #loadImage(index) {
    const item = this.#items[index];
    this.#currentIndex = index;

    // Build image
    const img = document.createElement('img');
    img.src = item.href;
    img.alt = item.alt;

    // Clear and populate frame
    if (!this.#frame) return;
    const frame = this.#frame;
    frame.innerHTML = '';
    frame.append(img);

    // Caption handling
    const captionMode = this.getAttribute('captions') || 'auto';

    if (captionMode === 'overlay' && item.caption) {
      const figcaption = document.createElement('figcaption');
      figcaption.innerHTML = item.caption;
      frame.append(figcaption);
    } else if (captionMode === 'auto') {
      // Update caption footer — show footer when caption exists, collapse text on nav
      const footer = this.#detailsPopover?.parentElement;
      if (this.#detailsPopover && this.#infoBtn && footer) {
        if (item.caption) {
          this.#detailsPopover.innerHTML = item.caption;
          footer.hidden = false;
          // Collapse text when navigating to a new image
          this.#detailsPopover.hidden = true;
          this.#infoBtn.setAttribute('aria-expanded', 'false');
          this.#infoBtn.setAttribute('aria-label', 'Show image details');
        } else {
          // No caption — hide the entire footer
          this.#detailsPopover.innerHTML = '';
          footer.hidden = true;
        }
      }
    }

    this.#updateControls();
  }

  #navigate(index) {
    const transition = this.getAttribute('transition') || 'morph';
    const useFade = this.#vtSupported && transition !== 'none';

    if (useFade) {
      startSwapTransition(() => {
        this.#loadImage(index);
      });
    } else {
      this.#loadImage(index);
    }

    this.#preloadAdjacent(index);
  }

  #updateControls() {
    const loop = this.hasAttribute('loop');
    const atStart = this.#currentIndex === 0;
    const atEnd = this.#currentIndex === this.#items.length - 1;

    if (this.#prevBtn) this.#prevBtn.disabled = !loop && atStart;
    if (this.#nextBtn) this.#nextBtn.disabled = !loop && atEnd;
    if (this.#counter) {
      this.#counter.textContent = `${this.#currentIndex + 1} of ${this.#items.length}`;
    }
  }

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
        this.#navigate(0);
        break;
      case 'End':
        e.preventDefault();
        this.#navigate(this.#items.length - 1);
        break;
    }
  };

  #preloadAdjacent(index) {
    const preload = (i) => {
      if (i >= 0 && i < this.#items.length) {
        const img = new Image();
        img.src = this.#items[i].href;
      }
    };
    preload(index - 1);
    preload(index + 1);
  }
}

registerComponent('image-gallery', ImageGallery);

export { ImageGallery };
