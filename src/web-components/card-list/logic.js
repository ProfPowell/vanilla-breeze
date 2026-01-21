/**
 * card-list: Template-based list rendering with SAFE data binding
 *
 * Security: Only simple property paths are allowed - no expressions, methods, or template literals.
 *
 * Attributes:
 * - src: URL to fetch JSON data from
 * - data-items: Inline JSON data
 * - data-key: Property to use as unique key for items
 *
 * Binding Attributes:
 * - data-field="path" - Set textContent from property path
 * - data-field-attr="href: url, title: name" - Set attributes from property paths
 * - data-field-html="richContent" - Set innerHTML (sanitized)
 * - data-field-if="propertyPath" - Show element if truthy
 * - data-field-unless="propertyPath" - Hide element if truthy
 */

// Strict regex for safe property paths only
// Allows: name, user.email, items[0].title
// Rejects: price.toFixed(2), `${price}`, price * 1.1
const SAFE_PATH_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;

/**
 * Validate that a path is safe (no expressions, only property access)
 */
function isValidPath(path) {
  if (!path || typeof path !== 'string') return false;
  return SAFE_PATH_REGEX.test(path.trim());
}

/**
 * Safely get a value from an object using a property path
 * Returns undefined for invalid paths or missing properties
 */
function getValueByPath(obj, path) {
  if (!isValidPath(path)) {
    console.warn(`[card-list] Unsafe property path rejected: "${path}"`);
    return undefined;
  }

  // Convert bracket notation to dot notation for splitting
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const parts = normalizedPath.split('.');

  let value = obj;
  for (const part of parts) {
    if (value == null) return undefined;
    value = value[part];
  }

  return value;
}

/**
 * Basic HTML sanitization - strips dangerous elements and attributes
 * For production use, consider DOMPurify
 */
function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';

  const template = document.createElement('template');
  template.innerHTML = html;

  // Remove dangerous elements
  const dangerous = template.content.querySelectorAll('script, iframe, object, embed, form');
  dangerous.forEach(el => el.remove());

  // Remove event handlers and dangerous attributes
  const allElements = template.content.querySelectorAll('*');
  allElements.forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}

/**
 * Parse attribute mapping string like "href: url, title: name"
 */
function parseAttrMapping(str) {
  if (!str) return [];

  return str.split(',').map(pair => {
    const [attr, path] = pair.split(':').map(s => s.trim());
    return { attr, path };
  }).filter(({ attr, path }) => attr && path);
}

class CardList extends HTMLElement {
  #template = null;
  #items = [];
  #keyProp = 'id';

  static get observedAttributes() {
    return ['src', 'data-items', 'data-key'];
  }

  connectedCallback() {
    this.#template = this.querySelector('template');
    if (!this.#template) {
      console.warn('[card-list] No template found');
      return;
    }

    this.#keyProp = this.getAttribute('data-key') || 'id';

    // Try inline data first
    const inlineData = this.getAttribute('data-items');
    if (inlineData) {
      try {
        this.#items = JSON.parse(inlineData);
        this.#render();
      } catch (e) {
        console.error('[card-list] Invalid JSON in data-items:', e);
      }
      return;
    }

    // Otherwise fetch from src
    const src = this.getAttribute('src');
    if (src) {
      this.#fetchData(src);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'data-items' && newValue) {
      try {
        this.#items = JSON.parse(newValue);
        this.#render();
      } catch (e) {
        console.error('[card-list] Invalid JSON in data-items:', e);
      }
    } else if (name === 'src' && newValue) {
      this.#fetchData(newValue);
    } else if (name === 'data-key') {
      this.#keyProp = newValue || 'id';
      this.#render();
    }
  }

  async #fetchData(url) {
    try {
      this.setAttribute('data-loading', '');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.#items = Array.isArray(data) ? data : data.items || data.data || [];
      this.#render();
    } catch (e) {
      console.error('[card-list] Fetch error:', e);
      this.setAttribute('data-error', e.message);
    } finally {
      this.removeAttribute('data-loading');
    }
  }

  #render() {
    if (!this.#template) return;

    // Clear existing rendered items (keep template)
    const existing = this.querySelectorAll(':scope > :not(template)');
    existing.forEach(el => el.remove());

    // Render each item
    const fragment = document.createDocumentFragment();

    for (const item of this.#items) {
      const clone = this.#template.content.cloneNode(true);
      this.#bindData(clone, item);
      fragment.appendChild(clone);
    }

    this.appendChild(fragment);

    // Dispatch event
    this.dispatchEvent(new CustomEvent('card-list-render', {
      detail: { count: this.#items.length },
      bubbles: true
    }));
  }

  #bindData(root, item) {
    // data-field: Set textContent
    root.querySelectorAll('[data-field]').forEach(el => {
      const path = el.getAttribute('data-field');
      const value = getValueByPath(item, path);
      el.textContent = value ?? '';
    });

    // data-field-attr: Set multiple attributes
    root.querySelectorAll('[data-field-attr]').forEach(el => {
      const mapping = parseAttrMapping(el.getAttribute('data-field-attr'));
      for (const { attr, path } of mapping) {
        if (!isValidPath(path)) continue;
        const value = getValueByPath(item, path);
        if (value != null) {
          el.setAttribute(attr, value);
        }
      }
    });

    // data-field-html: Set innerHTML (sanitized)
    root.querySelectorAll('[data-field-html]').forEach(el => {
      const path = el.getAttribute('data-field-html');
      const value = getValueByPath(item, path);
      el.innerHTML = sanitizeHTML(value);
    });

    // data-field-if: Show if truthy
    root.querySelectorAll('[data-field-if]').forEach(el => {
      const path = el.getAttribute('data-field-if');
      const value = getValueByPath(item, path);
      if (!value) {
        el.remove();
      }
    });

    // data-field-unless: Hide if truthy
    root.querySelectorAll('[data-field-unless]').forEach(el => {
      const path = el.getAttribute('data-field-unless');
      const value = getValueByPath(item, path);
      if (value) {
        el.remove();
      }
    });
  }

  /**
   * Programmatically set items
   */
  setItems(items) {
    this.#items = Array.isArray(items) ? items : [];
    this.#render();
  }

  /**
   * Get current items
   */
  getItems() {
    return [...this.#items];
  }
}

customElements.define('card-list', CardList);

// Export for testing
export { CardList, isValidPath, getValueByPath, sanitizeHTML };
