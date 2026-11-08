/**
 * image-gallery: Thumbnail grid with lightbox viewer
 *
 * Progressively enhances a grid of linked thumbnails into a lightbox
 * gallery with navigation, swipe, keyboard, and View Transitions.
 * The lightbox is a native <dialog> built by JS; caption details toggle
 * a `hidden` region in the dialog footer.
 *
 * No-JS baseline: thumbnails link directly to full images via <a href>.
 *
 * @attr {string}  columns    - Min column width: "100px"-"300px" (default: "200px")
 * @attr {string}  gap        - Grid gap token: none, xs, s, m, l, xl (default: "s")
 * @attr {string}  ratio      - Thumbnail aspect-ratio: 1, 4:3, 3:2, 16:9, 3:4, auto
 * @attr {string}  controls   - Lightbox control layout: "edge", "bar", "minimal" (default: "edge")
 * @attr {boolean} loop       - Wrap navigation at ends
 * @attr {string}  captions   - Caption mode: "auto" (info toggle), "overlay", "hidden"
 * @attr {string}  transition - VT mode: "morph", "fade", "none" (default: "morph")
 * @attr {string}  data-label-dialog        - Lightbox name (default "Image viewer")
 * @attr {string}  data-label-close         - Close button name (default "Close gallery")
 * @attr {string}  data-label-prev          - Previous button name (default "Previous image")
 * @attr {string}  data-label-next          - Next button name (default "Next image")
 * @attr {string}  data-label-show-details  - Info button name, collapsed (default "Show image details")
 * @attr {string}  data-label-hide-details  - Info button name, expanded (default "Hide image details")
 * @attr {string}  data-label-counter       - Counter template; {n}/{total} (default "Image {n} of {total}")
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
let warnedMissingAlt = false;

/** @type {Record<string, string>} */
const LABELS = {
  Dialog: 'Image viewer',
  Close: 'Close gallery',
  Prev: 'Previous image',
  Next: 'Next image',
  ShowDetails: 'Show image details',
  HideDetails: 'Hide image details',
  Counter: 'Image {n} of {total}',
};

/**
 * Turn a caption value into nodes without ever parsing strings as HTML.
 * Strings become text; Nodes are cloned; <template> contributes its content.
 * @param {unknown} caption
 * @returns {Node[]}
 */
function captionNodes(caption) {
  if (caption == null || caption === '') return [];
  if (caption instanceof HTMLTemplateElement) return [caption.content.cloneNode(true)];
  if (caption instanceof Node) return [caption.cloneNode(true)];
  return [document.createTextNode(String(caption))];
}

/**
 * Clone the child nodes of an element (authored figcaption content).
 * @param {Element | null} el
 * @returns {Node[]}
 */
function cloneChildren(el) {
  return el ? [...el.childNodes].map(n => n.cloneNode(true)) : [];
}

class ImageGallery extends VBElement {
  static get observedAttributes() { return ['captions', 'controls']; }

  /** @type {{ href: string, thumbSrc: string, alt: string, captionEl: Element|null, thumbEl: HTMLImageElement }[]} */
  #items = [];
  #currentIndex = 0;

  /** @type {HTMLDialogElement|null} */
  #dialog = null;
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
  #captionText = null;

  /** @type {Function|null} */
  #swipeCleanup = null;
  #id = '';
  #vtSupported = false;

  setup() {
    if (!this.#id) this.#id = `gallery-lb-${++galleryId}`;
    this.#vtSupported = !!document.startViewTransition;
    this.#collectItems();

    // Always listen — an empty gallery stays interactive once items arrive
    // (markup appended later or the .images setter).
    this.listen(this, 'click', this.#onThumbnailClick);
    return true;
  }

  teardown() {
    this.#destroyDialog();
    for (const item of this.#items) item.thumbEl.style.viewTransitionName = '';
    this.#items = [];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // captions/controls shape the dialog — drop it so the next open rebuilds.
    if (oldValue !== newValue && this.#dialog) this.#destroyDialog();
  }

  // --- Data API (HTML-first / JS-first dual contract) ---

  /**
   * Read the current image set as a plain data array. Each entry is
   * `{ href, thumbSrc, alt, caption }`. `caption` is a string for
   * text-only captions, a DocumentFragment (cloned) when the figcaption
   * holds markup, or null.
   *
   * @returns {any[]} Image records.
   */
  get images() {
    return this.#items.map(it => {
      let caption = null;
      if (it.captionEl) {
        if (it.captionEl.children.length) {
          const frag = document.createDocumentFragment();
          frag.append(...cloneChildren(it.captionEl));
          caption = frag;
        } else {
          caption = it.captionEl.textContent;
        }
      }
      return { href: it.href, thumbSrc: it.thumbSrc, alt: it.alt, caption };
    });
  }

  /**
   * Replace the gallery with a new image set. Each entry needs at least
   * `href` and `thumbSrc`; `alt` and `caption` are optional. A string
   * caption is rendered as text (never parsed as HTML); pass a Node,
   * DocumentFragment or <template> for rich captions. Rebuilds the
   * thumbnails and re-runs the lifecycle (an open lightbox closes).
   * Emits image-gallery:images-changed { images, source: 'property' }.
   */
  set images(value) {
    const next = Array.isArray(value) ? value : [];

    for (const child of [...this.children]) {
      if (child.tagName === 'FIGURE' || child.tagName === 'A') child.remove();
    }

    const valid = next.filter(img => img?.href && img?.thumbSrc);
    valid.forEach((img, i) => {
      const nodes = captionNodes(img.caption);
      const wrapper = nodes.length ? document.createElement('figure') : document.createElement('a');
      const anchor = /** @type {HTMLAnchorElement} */ (
        wrapper.tagName === 'FIGURE' ? document.createElement('a') : wrapper
      );
      anchor.href = img.href;
      const imgEl = document.createElement('img');
      imgEl.src = img.thumbSrc;
      imgEl.alt = img.alt || '';
      imgEl.loading = 'lazy';
      if (!img.alt) {
        if (!warnedMissingAlt) {
          warnedMissingAlt = true;
          console.warn('[image-gallery] .images entries should include alt text; falling back to a generic link name.');
        }
        const text = typeof img.caption === 'string' ? img.caption.trim() : '';
        anchor.setAttribute('aria-label', text || this.#counterText(i + 1, valid.length));
      }
      anchor.appendChild(imgEl);
      if (wrapper.tagName === 'FIGURE') {
        wrapper.appendChild(anchor);
        const cap = document.createElement('figcaption');
        cap.append(...nodes);
        wrapper.appendChild(cap);
      }
      this.appendChild(wrapper);
    });

    this._reinit();

    this.dispatchEvent(new CustomEvent('image-gallery:images-changed', {
      detail: { images: this.images, source: 'property' },
      bubbles: true,
    }));
  }

  // --- Public API ---

  /** Open the lightbox at a given index */
  open(index) {
    if (!this.#items.length) this.#collectItems();
    if (!(index >= 0 && index < this.#items.length)) return;
    if (!this.#dialog) this.#buildDialog();

    this.#loadImage(index);

    const item = this.#items[index];
    const transition = this.getAttribute('transition') || 'morph';

    if (this.#dialog?.open) {
      this.#preloadAdjacent(index);
      return;
    }

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
        if (dialog.isConnected && !dialog.open) dialog.showModal();
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

    if (item && this.#vtSupported && transition === 'morph' && this.#frame && this.#dialog) {
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

  /**
   * Author-overridable UI string from a data-label-* attribute.
   * @param {string} key dataset suffix, e.g. 'Close' for data-label-close
   */
  #label(key) {
    return this.dataset[`label${key}`] || LABELS[key];
  }

  #counterText(n, total) {
    return this.#label('Counter').replace('{n}', String(n)).replace('{total}', String(total));
  }

  #isRtl() {
    return getComputedStyle(this).direction === 'rtl';
  }

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

      this.#items.push({
        href: anchor.href,
        thumbSrc: img.src,
        alt: img.alt || '',
        captionEl: isFigure ? child.querySelector(':scope > figcaption') : null,
        thumbEl: img,
      });
    }
  }

  /** @type {(e: Event) => void} */
  #onThumbnailClick = (e) => {
    const target = /** @type {Element | null} */ (e.target);
    const anchor = target?.closest('a[href]');
    if (!anchor || !this.contains(anchor) || this.#dialog?.contains(anchor)) return;

    // Markup may have been appended after upgrade — refresh lazily.
    const img = anchor.querySelector('img');
    let index = this.#items.findIndex(item => item.thumbEl === img);
    if (index === -1) {
      this.#collectItems();
      index = this.#items.findIndex(item => item.thumbEl === img);
    }
    if (index === -1) return;

    e.preventDefault();
    this.open(index);
  };

  /**
   * @param {string} className
   * @param {string} label
   * @param {string} icon
   */
  #button(className, label, icon) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('aria-label', label);
    const iconEl = document.createElement('icon-wc');
    iconEl.setAttribute('name', icon);
    iconEl.setAttribute('size', 'sm');
    btn.append(iconEl);
    return btn;
  }

  #buildDialog() {
    const dialog = document.createElement('dialog');
    dialog.id = this.#id;
    dialog.className = 'gallery-lightbox';
    dialog.dataset.size = 'full';
    dialog.setAttribute('aria-label', this.#label('Dialog'));

    // Forward the controls attribute to the dialog for CSS
    dialog.dataset.controls = this.getAttribute('controls') || 'edge';

    // Header — counter, close
    const header = document.createElement('header');

    const counter = document.createElement('span');
    counter.className = 'gallery-counter';
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-atomic', 'true');
    this.#counter = counter;

    // Close button — a plain button (no invoker attributes) so the
    // view-transition snapshot is taken before the dialog closes.
    const closeBtn = this.#button('gallery-close', this.#label('Close'), 'x');
    this.listen(closeBtn, 'click', () => this.close());

    header.append(counter, closeBtn);

    // Stage — prev, image frame, next
    const stage = document.createElement('section');
    stage.className = 'gallery-stage';

    const prevBtn = this.#button('gallery-prev', this.#label('Prev'), 'chevron-left');
    this.#prevBtn = prevBtn;

    const frame = document.createElement('figure');
    frame.className = 'gallery-frame';
    this.#frame = frame;

    const nextBtn = this.#button('gallery-next', this.#label('Next'), 'chevron-right');
    this.#nextBtn = nextBtn;

    stage.append(prevBtn, frame, nextBtn);

    const captionMode = this.getAttribute('captions') || 'auto';

    // Caption footer (auto mode) — info toggle + collapsible text
    if (captionMode === 'auto') {
      const captionFooter = document.createElement('footer');
      captionFooter.className = 'gallery-caption';
      captionFooter.hidden = true; // hidden until an image with caption is shown

      const infoBtn = this.#button('gallery-info-btn', this.#label('ShowDetails'), 'info');
      infoBtn.setAttribute('aria-expanded', 'false');
      this.#infoBtn = infoBtn;

      const captionText = document.createElement('div');
      captionText.className = 'gallery-caption-text';
      captionText.id = `${this.#id}-caption`;
      captionText.hidden = true;
      infoBtn.setAttribute('aria-controls', captionText.id);
      this.#captionText = captionText;

      captionFooter.append(infoBtn, captionText);
      dialog.append(header, stage, captionFooter);

      this.listen(infoBtn, 'click', () => {
        const showing = !captionText.hidden;
        captionText.hidden = showing;
        infoBtn.setAttribute('aria-expanded', String(!showing));
        infoBtn.setAttribute('aria-label', this.#label(showing ? 'ShowDetails' : 'HideDetails'));
      });
    } else {
      dialog.append(header, stage);
    }

    this.append(dialog);
    this.#dialog = dialog;

    this.listen(prevBtn, 'click', () => this.prev());
    this.listen(nextBtn, 'click', () => this.next());
    this.listen(dialog, 'keydown', this.#onKeyDown);

    // Close on backdrop click
    this.listen(dialog, 'click', (e) => {
      if (e.target === dialog) this.close();
    });

    // Native close (Escape) — clean up VT state
    this.listen(dialog, 'close', () => {
      const item = this.#items[this.#currentIndex];
      if (item) item.thumbEl.style.viewTransitionName = '';
      const img = this.#frame?.querySelector('img');
      if (img) img.style.viewTransitionName = '';
    });

    // Swipe — lazy-load gesture module; the dialog may be gone (or the host
    // disconnected) by the time it resolves.
    import('../../lib/vb-gestures.js').then(({ addSwipeListener }) => {
      if (!this.isConnected || this.#dialog !== dialog) return;
      this.#swipeCleanup = addSwipeListener(stage, { threshold: 40 });
      // Swipe toward the reading direction's start = forward.
      this.listen(stage, 'swipe-left', () => (this.#isRtl() ? this.prev() : this.next()));
      this.listen(stage, 'swipe-right', () => (this.#isRtl() ? this.next() : this.prev()));
    });
  }

  #destroyDialog() {
    if (this.#swipeCleanup) {
      this.#swipeCleanup();
      this.#swipeCleanup = null;
    }
    if (this.#dialog) {
      if (this.#dialog.open) this.#dialog.close();
      this.#dialog.remove();
    }
    this.#dialog = null;
    this.#frame = null;
    this.#counter = null;
    this.#prevBtn = null;
    this.#nextBtn = null;
    this.#infoBtn = null;
    this.#captionText = null;
  }

  #loadImage(index) {
    const item = this.#items[index];
    if (!item || !this.#frame) return;
    this.#currentIndex = index;

    const img = document.createElement('img');
    img.src = item.href;
    img.alt = item.alt;

    const frame = this.#frame;
    frame.replaceChildren(img);

    const captionMode = this.getAttribute('captions') || 'auto';
    const nodes = cloneChildren(item.captionEl);
    const hasCaption = !!item.captionEl?.textContent?.trim() || nodes.some(n => n.nodeType === 1);

    if (captionMode === 'overlay' && hasCaption) {
      const figcaption = document.createElement('figcaption');
      figcaption.append(...nodes);
      frame.append(figcaption);
    } else if (captionMode === 'auto') {
      const footer = this.#captionText?.parentElement;
      if (this.#captionText && this.#infoBtn && footer) {
        if (hasCaption) {
          this.#captionText.replaceChildren(...nodes);
          footer.hidden = false;
          // Collapse text when navigating to a new image
          this.#captionText.hidden = true;
          this.#infoBtn.setAttribute('aria-expanded', 'false');
          this.#infoBtn.setAttribute('aria-label', this.#label('ShowDetails'));
        } else {
          this.#captionText.replaceChildren();
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
      this.#counter.textContent = this.#counterText(this.#currentIndex + 1, this.#items.length);
    }
  }

  #onKeyDown = (e) => {
    // Ignore keys aimed at interactive caption content (links, etc.).
    if (e.target instanceof Element && e.target.closest('.gallery-caption-text, figcaption')) return;
    const rtl = this.#isRtl();
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
