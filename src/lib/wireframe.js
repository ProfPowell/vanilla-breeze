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
    // Apply labels to elements with data-wf-label
    document.querySelectorAll('[data-wf-label]').forEach((el) => {
      this.applyLabel(el, el.dataset.wfLabel);
    });

    // Use alt text for images without explicit labels
    document.querySelectorAll('img[alt]').forEach((img) => {
      if (!img.dataset.wfLabel && img.alt) {
        this.applyLabel(img, img.alt);
      }
      // Add dimension info for images
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
      el.dataset.wfLabel = text;
      this.applyLabel(el, text);
    }
  },

  /**
   * Apply label via CSS custom property
   * @param {Element} el - Target element
   * @param {string} text - Label text
   */
  applyLabel(el, text) {
    if (!text) return;
    // Escape quotes for CSS content
    const escaped = text.replace(/"/g, '\\"');
    el.style.setProperty('--wf-label-text', `"${escaped}"`);
  },

  /**
   * Add dimension overlay to images
   * @param {HTMLImageElement} img - Image element
   */
  applyImageDimensions(img) {
    const updateDimensions = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const dims = `${img.naturalWidth}×${img.naturalHeight}`;
        img.style.setProperty('--wf-img-overlay', `"${dims}"`);
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
  }
};

// Expose on VanillaBreeze namespace if available
if (typeof window !== 'undefined') {
  window.VanillaBreeze = window.VanillaBreeze || {};
  window.VanillaBreeze.wireframe = wireframe;
}

export default wireframe;
