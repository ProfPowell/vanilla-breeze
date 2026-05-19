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

import { sanitizeHTML } from '../../lib/sanitize-html.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { diffByKey } from '../../lib/diff-by-key.js';

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
 * Parse attribute mapping string like "href: url, title: name"
 */
function parseAttrMapping(str) {
  if (!str) return [];

  return str.split(',').map(pair => {
    const [attr, path] = pair.split(':').map(s => s.trim());
    return { attr, path };
  }).filter(({ attr, path }) => attr && path);
}

class CardList extends VBElement {
  /** @type {HTMLTemplateElement | null} */
  #template = null;
  #items = [];
  #keyProp = 'id';
  /** Map<key, root Element> for the keyed diff. */
  #nodes = new Map();

  static get observedAttributes() {
    return ['src', 'data-items', 'data-key'];
  }

  setup() {
    this.#template = this.querySelector('template');
    if (!this.#template) {
      console.warn('[card-list] No template found');
      return false;
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
    return true;
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

  /**
   * Render or reconcile rendered cards against the current #items.
   * Uses diffByKey to preserve existing nodes whose key persists across
   * updates (focus, animation, scroll position survive). For preserved
   * nodes, data is re-bound in place — assignment of new field values
   * for the same key still updates the displayed text.
   *
   * Falls back to wholesale re-render if the template has multiple root
   * elements per card (diff requires a single root per item).
   *
   * @param {'api' | 'attribute' | 'internal'} [source='internal']
   */
  #render(source = 'internal') {
    if (!this.#template) return;

    const roots = [...this.#template.content.children];
    if (roots.length !== 1) {
      // Multi-root templates can't be diffed by key — wholesale re-render.
      const existing = this.querySelectorAll(':scope > :not(template)');
      existing.forEach(el => el.remove());
      this.#nodes.clear();
      const fragment = document.createDocumentFragment();
      for (const item of this.#items) {
        const clone = this.#template.content.cloneNode(true);
        this.#bindData(clone, item);
        fragment.appendChild(clone);
      }
      this.appendChild(fragment);
    } else {
      const result = diffByKey({
        newItems: this.#items,
        nodes: this.#nodes,
        keyOf: (item) => item?.[this.#keyProp],
        renderItem: (item) => {
          if (!this.#template) throw new Error('card-list: missing template');
          const clone = /** @type {DocumentFragment} */ (this.#template.content.cloneNode(true));
          const wrapper = /** @type {HTMLElement} */ (clone.firstElementChild);
          this.#bindData(wrapper, item);
          return wrapper;
        },
        containerFor: () => this,
      });
      // Re-bind data on preserved nodes so updated field values for the
      // same key still propagate. New nodes were already bound in renderItem.
      const addedSet = new Set(result.added);
      for (const item of this.#items) {
        const key = item?.[this.#keyProp];
        if (addedSet.has(key)) continue;
        const node = this.#nodes.get(key);
        if (node) this.#bindData(node, item);
      }
    }

    // Legacy event preserved for back-compat.
    this.dispatchEvent(new CustomEvent('card-list:rendered', {
      detail: { count: this.#items.length },
      bubbles: true
    }));
    // New tagged event for the dual-API contract.
    this.dispatchEvent(new CustomEvent('card-list:items-changed', {
      detail: { items: this.#items, source },
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
   * The current items array. After upgrade, reflects the parsed
   * data-items / src JSON; after assignment, reflects what was passed in.
   */
  get items() {
    return this.#items;
  }

  /**
   * Replace the items list. Runs a keyed diff against existing rendered
   * cards: nodes whose key (per data-key) persists across assignments
   * are preserved (focus, animation, scroll position survive). New keys
   * trigger a fresh template clone; dropped keys are removed.
   */
  set items(value) {
    this.#items = Array.isArray(value) ? value : [];
    this.#render('api');
  }

  /** @deprecated use `.items = [...]` instead. */
  setItems(items) {
    this.items = items;
  }

  /** @deprecated use `.items` getter instead. */
  getItems() {
    return [...this.#items];
  }
}

registerComponent('card-list', CardList);

// Export for testing
export { CardList, isValidPath, getValueByPath };
export { sanitizeHTML } from '../../lib/sanitize-html.js';
