/**
 * Wireframe labeling utility
 *
 * Adds contextual labels to elements in wireframe mode.
 * Labels are rendered via CSS using custom properties or data attributes.
 *
 * @example
 * // Auto-label all elements with data-wf-label
 * VanillaBreeze.wireframe.labelElements();
 *
 * // Manual labeling
 * VanillaBreeze.wireframe.label(element, 'Hero Image');
 * VanillaBreeze.wireframe.label('.primary-nav', 'Primary Navigation');
 */

export const wireframe = {
  /**
   * Auto-label all elements with data-wf-label attribute.
   * Also labels images using their alt text if no label is set.
   * For images, adds dimension info to the overlay.
   */
  labelElements() {
    // Wrap standalone images so pseudo-elements work for labels
    this.wrapStandaloneImages();

    // Apply labels to elements with data-wf-label
    document.querySelectorAll('[data-wf-label]').forEach((el) => {
      this.applyLabel(el, /** @type {HTMLElement} */ (el).dataset.wfLabel ?? '');
    });

    // Use alt text for images without explicit labels, then add dimensions
    document.querySelectorAll('img[alt]').forEach((rawImg) => {
      const img = /** @type {HTMLImageElement} */ (rawImg);
      if (!img.dataset.wfLabel && img.alt) {
        this.applyLabel(img, img.alt);
      }
      // Add dimension info — must run after applyLabel so dims merge with label
      this.applyImageDimensions(img);
    });
  },

  /**
   * Apply label to a specific element
   * @param {string|Element} target - CSS selector or element
   * @param {string} text - Label text to display
   */
  label(target, text) {
    const el = typeof target === 'string'
      ? document.querySelector(target)
      : target;

    if (el) {
      /** @type {HTMLElement} */ (el).dataset.wfLabel = text;
      this.applyLabel(el, text);
    }
  },

  /**
   * Apply label via CSS custom property or data attribute
   * @param {Element} el - Target element
   * @param {string} text - Label text
   */
  applyLabel(el, text) {
    if (!text) return;
    // Escape quotes for CSS content
    const escaped = text.replace(/"/g, '\\"');
    /** @type {HTMLElement} */ (el).style.setProperty('--wf-label-text', `"${escaped}"`);

    // For images, we need to propagate the label to the parent figure
    // since <img> elements cannot have ::before/::after pseudo-elements
    if (el.tagName === 'IMG') {
      const figure = el.closest('figure');
      if (figure) {
        figure.setAttribute('data-wf-img-label', text);
      }
    }
  },

  /**
   * Add dimension overlay to images
   * Propagates dimensions to parent <figure> so CSS can render them.
   * @param {HTMLImageElement} img - Image element
   */
  applyImageDimensions(img) {
    const updateDimensions = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const dims = `${img.naturalWidth}\u00d7${img.naturalHeight}`;
        const figure = img.closest('figure');
        if (figure) {
          figure.setAttribute('data-wf-img-dims', dims);
          // Merge dims into label if one exists
          const existing = figure.getAttribute('data-wf-img-label');
          if (existing) {
            figure.setAttribute('data-wf-img-label', `${existing} \u2014 ${dims}`);
          }
        }
      }
    };

    if (img.complete) {
      updateDimensions();
    } else {
      img.addEventListener('load', updateDimensions, { once: true });
    }
  },

  /**
   * Set wireframe fidelity level
   * @param {'lo'|'mid'|'hi'|'annotate'|''} level - Fidelity level
   */
  setFidelity(level) {
    const html = document.documentElement;
    if (level) {
      html.dataset.wireframe = level;
    } else {
      delete html.dataset.wireframe;
    }
  },

  /**
   * Toggle wireframe mode on/off
   * @param {string} [level='mid'] - Fidelity level when enabling
   * @returns {boolean} - Whether wireframe mode is now enabled
   */
  toggle(level = 'mid') {
    const html = document.documentElement;
    if (html.hasAttribute('data-wireframe')) {
      delete html.dataset.wireframe;
      return false;
    }
    html.dataset.wireframe = level;
    return true;
  },

  /**
   * Check if wireframe mode is active
   * @returns {boolean}
   */
  isActive() {
    return document.documentElement.hasAttribute('data-wireframe');
  },

  /**
   * Get current fidelity level
   * @returns {string|null}
   */
  getFidelity() {
    return document.documentElement.dataset.wireframe || null;
  },

  /**
   * Toggle composable annotations on/off.
   * Unlike annotate fidelity, this layers on top of any fidelity level.
   * @returns {boolean} Whether annotations are now enabled
   */
  toggleAnnotations() {
    const html = document.documentElement;
    if (html.hasAttribute('data-wf-annotate')) {
      html.removeAttribute('data-wf-annotate');
      return false;
    }
    html.setAttribute('data-wf-annotate', '');
    return true;
  },

  /**
   * Wrap standalone images (not in <figure>) so labels can render via pseudo-elements.
   * Called automatically by labelElements().
   */
  wrapStandaloneImages() {
    document.querySelectorAll('img:not(figure img):not([data-wf-wrapped])').forEach((img) => {
      const wrap = document.createElement('span');
      wrap.setAttribute('data-wf-img-wrap', '');
      wrap.style.cssText = 'position:relative;display:inline-block';
      img.setAttribute('data-wf-wrapped', '');
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    });
  },

  /**
   * Add a callout comment to an element.
   * @param {string|Element} target - CSS selector or element
   * @param {string} text - Callout comment text
   */
  addCallout(target, text) {
    const el = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    if (!el) return;
    /** @type {HTMLElement} */ (el).dataset.wfCallout = text;
  },

  /**
   * Remove a callout from an element.
   * @param {string|Element} target - CSS selector or element
   */
  removeCallout(target) {
    const el = typeof target === 'string'
      ? document.querySelector(target)
      : target;
    if (!el) return;
    delete /** @type {HTMLElement} */ (el).dataset.wfCallout;
    // Remove any existing marker
    const marker = el.querySelector('[data-wf-callout-marker]');
    if (marker) marker.remove();
  },

  /**
   * Render callouts using the <foot-note> / <foot-notes> system.
   * Discovers [data-wf-callout] elements, injects a numbered <mark> marker
   * and a <foot-note> next to each one, then appends a <foot-notes> container.
   * Numbering, linking, and back-references are handled by the footnotes component.
   */
  renderCallouts() {
    // Clear previous callout artifacts
    document.querySelectorAll('[data-wf-callout-marker]').forEach((m) => m.remove());
    document.querySelectorAll('foot-note[data-wf-generated]').forEach((f) => f.remove());
    document.querySelectorAll('[data-wf-callout-panel]').forEach((p) => p.remove());

    let index = 0;
    document.querySelectorAll('[data-wf-callout]').forEach((el) => {
      index++;
      const text = /** @type {HTMLElement} */ (el).dataset.wfCallout;

      // Numbered marker badge
      const marker = document.createElement('mark');
      marker.setAttribute('data-wf-callout-marker', '');
      marker.textContent = String(index);
      marker.title = text;
      el.appendChild(marker);

      // foot-note element for the footnotes system to collect
      const fn = document.createElement('foot-note');
      fn.setAttribute('data-wf-generated', '');
      fn.textContent = text;
      el.appendChild(fn);
    });
  },

  /**
   * Render the callout panel as a <foot-notes> container.
   * The <foot-notes> web component auto-collects <foot-note> elements
   * and renders a numbered, linked list with back-references.
   * @param {Element} [container] - Where to append. Defaults to <main> or <body>.
   */
  renderCalloutPanel(container) {
    // Remove existing panel
    document.querySelectorAll('[data-wf-callout-panel]').forEach((p) => p.remove());

    const callouts = document.querySelectorAll('[data-wf-callout]');
    if (callouts.length === 0) return;

    const panel = document.createElement('foot-notes');
    panel.setAttribute('data-wf-callout-panel', '');
    panel.setAttribute('data-back-label', 'Back to callout');

    const target = container || document.querySelector('main') || document.body;
    target.appendChild(panel);
  },

  /**
   * Toggle visibility of callout markers and panel.
   * @returns {boolean} Whether callouts are now visible
   */
  toggleCallouts() {
    const markers = document.querySelectorAll('[data-wf-callout-marker]');
    const panel = document.querySelector('[data-wf-callout-panel]');

    if (markers.length === 0 && !panel) {
      // Not rendered yet — render them
      this.renderCallouts();
      this.renderCalloutPanel();
      return true;
    }

    // Toggle hidden state
    const isHidden = markers.length > 0 && /** @type {HTMLElement} */ (markers[0]).hidden;
    markers.forEach((m) => { /** @type {HTMLElement} */ (m).hidden = !isHidden; });
    if (panel) /** @type {HTMLElement} */ (panel).hidden = !isHidden;
    return !isHidden;
  }
};

/**
 * Register Ctrl/Cmd+Shift+W keyboard shortcut to toggle wireframe.
 * Auto-registered on module init.
 */
function registerKeyboardShortcut() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'W') {
      e.preventDefault();
      wireframe.toggle();
    }
  });
}

// Expose on VanillaBreeze namespace and register shortcut
if (typeof window !== 'undefined') {
  window.VanillaBreeze = window.VanillaBreeze || {};
  window.VanillaBreeze.wireframe = wireframe;
  registerKeyboardShortcut();
}
