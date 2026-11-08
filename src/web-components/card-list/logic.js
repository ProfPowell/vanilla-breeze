/**
 * card-list: Template-based list rendering with safe data binding
 *
 * Security:
 * - Only simple property paths are allowed - no expressions, methods, or
 *   template literals.
 * - data-field-html is passed through the shared sanitizer.
 * - data-field-attr refuses event-handler attributes (on*, plus srcdoc and
 *   style) and only writes URL-bearing attributes (href, src, action,
 *   formaction, xlink:href, poster, cite, background, ping, data, srcset)
 *   when the URL is http(s), mailto, tel, relative, or a fragment.
 *
 * Attributes:
 * - src: URL to fetch JSON data from
 * - data-items: Inline JSON data
 * - data-key: Property to use as unique key for items (falls back to the
 *   item index when the key is missing or duplicated)
 * - data-loading / data-error: state reflected by the component
 *
 * Binding Attributes (on elements inside the template):
 * - data-field="path" - Set textContent from property path
 * - data-field-attr="href: url, title: name" - Set attributes from property
 *   paths; null/undefined (or false, except aria-*) removes the attribute,
 *   true sets it empty (boolean attributes)
 * - data-field-html="richContent" - Set innerHTML (sanitized)
 * - data-field-if="propertyPath" - Hidden unless truthy
 * - data-field-unless="propertyPath" - Hidden when truthy
 *
 * Children with [data-fallback] are static no-JS content, removed on the
 * first successful render.
 */

import { sanitizeToFragment } from '../../lib/sanitize-html.js';
import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { diffByKey } from '../../lib/diff-by-key.js';

// Strict regex for safe property paths only
// Allows: name, user.email, items[0].title
// Rejects: price.toFixed(2), `${price}`, price * 1.1
const SAFE_PATH_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;

/**
 * Validate that a path is safe (no expressions, only property access)
 *
 * @param {*} path - Candidate property path.
 * @returns {boolean} True when the path is a safe property-access path.
 */
function isValidPath(path) {
  if (!path || typeof path !== 'string') return false;
  return SAFE_PATH_REGEX.test(path.trim());
}

/**
 * Safely get a value from an object using a property path
 * Returns undefined for invalid paths or missing properties
 *
 * @param {*} obj - Source object.
 * @param {string | null} path - Property path (dot and/or bracket-index notation).
 * @returns {*} The resolved value, or undefined.
 */
function getValueByPath(obj, path) {
  if (!isValidPath(path)) {
    console.warn(`[card-list] Unsafe property path rejected: "${path}"`);
    return undefined;
  }

  // Convert bracket notation to dot notation for splitting
  const normalizedPath = String(path).replace(/\[(\d+)\]/g, '.$1');
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
 *
 * @param {string | null} str - Mapping string.
 * @returns {Array<{ attr: string, path: string }>} Parsed pairs.
 */
function parseAttrMapping(str) {
  if (!str) return [];

  return str.split(',').map(pair => {
    const [attr, path] = pair.split(':').map(s => s.trim());
    return { attr: (attr || '').toLowerCase(), path };
  }).filter(({ attr, path }) => attr && path);
}

/** Attributes whose value is fetched or navigated to. */
const URL_ATTRS = new Set([
  'href', 'src', 'action', 'formaction', 'xlink:href', 'poster', 'cite',
  'background', 'ping', 'data', 'manifest', 'longdesc', 'codebase',
]);

/** Attributes that are never written from data: script sinks. */
const BLOCKED_ATTRS = new Set(['srcdoc', 'style', 'is']);

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Is this URL safe to put in a URL-bearing attribute? Allows http(s),
 * mailto, tel, relative URLs and fragments; refuses javascript:, data:,
 * vbscript:, blob: and anything else with a scheme.
 *
 * @param {*} raw - Candidate URL.
 * @returns {boolean} True when the URL is safe.
 */
function isSafeUrl(raw) {
  // Strip whitespace and control characters the URL parser also ignores
  // (so "java\tscript:" can't sneak past a scheme sniff).
  const s = String(raw).replace(/[\u0000-\u0020\u007f]+/g, '');
  if (!s) return true;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(s);
  if (!scheme) return true; // relative, root-relative, query or fragment
  return SAFE_SCHEMES.has(`${scheme[1].toLowerCase()}:`);
}

/**
 * Is a srcset value made only of safe URLs?
 *
 * @param {*} raw - Candidate srcset.
 * @returns {boolean} True when every candidate URL is safe.
 */
function isSafeSrcset(raw) {
  return String(raw).split(',').every((part) => isSafeUrl(part.trim().split(/\s+/)[0] || ''));
}

/**
 * Decide whether data may be written to an attribute.
 *
 * @param {string} attr - Lower-cased attribute name.
 * @param {*} value - Data value (non-null).
 * @returns {boolean} True when writing the attribute is safe.
 */
function isSafeAttrBinding(attr, value) {
  if (attr.startsWith('on') || BLOCKED_ATTRS.has(attr)) return false;
  if (!/^[a-z_][a-z0-9_.:-]*$/.test(attr)) return false;
  if (attr === 'srcset' || attr === 'imagesrcset') return isSafeSrcset(value);
  if (URL_ATTRS.has(attr)) return isSafeUrl(value);
  return true;
}

/**
 * Compute a unique key per item: the data-key property when present and
 * unique, otherwise the item's index (so keyless or duplicate-keyed data
 * still renders every item).
 *
 * @param {any[]} items - Items to key.
 * @param {string} keyProp - Key property name.
 * @returns {unknown[]} One unique key per item.
 */
function keysFor(items, keyProp) {
  const seen = new Set();
  return items.map((item, i) => {
    const raw = item != null && typeof item === 'object' ? item[keyProp] : undefined;
    const key = raw == null ? null : `k:${String(raw)}`;
    if (key == null || seen.has(key)) return `i:${i}`;
    seen.add(key);
    return key;
  });
}

const STATUS_SELECTOR = ':scope > [data-card-list-status]';

class CardList extends VBElement {
  /** @type {HTMLTemplateElement | null} */
  #template = null;
  /** @type {any[]} */
  #items = [];
  #keyProp = 'id';
  /** Map<key, root Element> for the keyed diff. */
  #nodes = new Map();
  /** True once items came from any source; reconnects keep them. */
  #loaded = false;
  /** Render source waiting for the template (items set before upgrade). */
  /** @type {'attribute' | 'api' | null} */
  #pendingSource = null;
  /** @type {AbortController | null} */
  #abort = null;

  static get observedAttributes() {
    return ['src', 'data-items', 'data-key'];
  }

  setup() {
    this.#template = this.querySelector(':scope > template') || this.querySelector('template');
    if (!this.#template) {
      console.warn('[card-list] No template found');
      return false;
    }

    this.#keyProp = this.getAttribute('data-key') || 'id';

    // Reconnect (or items assigned before upgrade): the rendered DOM and
    // items survive a disconnect, so don't re-read attributes or re-fetch.
    if (this.#loaded) {
      if (this.#pendingSource) this.#render(this.#pendingSource);
      this.#pendingSource = null;
      return true;
    }

    // Inline data takes priority over src.
    const inlineData = this.getAttribute('data-items');
    if (inlineData) {
      this.#applyJson(inlineData);
      return true;
    }

    const src = this.getAttribute('src');
    if (src) this.#fetchData(src);
    return true;
  }

  teardown() {
    // An in-flight fetch is abandoned; #loaded stays false so the next
    // connect fetches again.
    this.#abortFetch();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    // Before upgrade, setup() reads the attributes itself — reacting here
    // too would fetch/render twice.
    if (!this.hasAttribute('data-upgraded')) return;

    if (name === 'data-items') {
      if (newValue) this.#applyJson(newValue);
    } else if (name === 'src') {
      if (newValue) this.#fetchData(newValue);
      else this.#abortFetch();
    } else if (name === 'data-key') {
      this.#keyProp = newValue || 'id';
      this.#render('attribute');
    }
  }

  /** @param {string} json */
  #applyJson(json) {
    this.#abortFetch();
    try {
      const parsed = JSON.parse(json);
      this.#items = Array.isArray(parsed) ? parsed : [];
      this.#loaded = true;
      this.#render('attribute');
    } catch (e) {
      console.error('[card-list] Invalid JSON in data-items:', e);
    }
  }

  #abortFetch() {
    if (!this.#abort) return;
    this.#abort.abort();
    this.#abort = null;
    this.removeAttribute('data-loading');
    this.removeAttribute('aria-busy');
    this.#setStatus('');
  }

  /**
   * The live status element (created lazily, only for src fetches).
   *
   * @returns {HTMLElement} The role="status" element.
   */
  #statusEl() {
    let el = /** @type {HTMLElement | null} */ (this.querySelector(STATUS_SELECTOR));
    if (!el) {
      el = document.createElement('p');
      el.setAttribute('role', 'status');
      el.setAttribute('data-card-list-status', '');
      this.append(el);
    }
    return el;
  }

  /** @param {string} text */
  #setStatus(text) {
    const el = /** @type {HTMLElement | null} */ (this.querySelector(STATUS_SELECTOR));
    if (!el && !text) return;
    (el || this.#statusEl()).textContent = text;
  }

  /** @param {string} url */
  async #fetchData(url) {
    this.#abortFetch();
    const controller = new AbortController();
    this.#abort = controller;

    this.removeAttribute('data-error');
    this.setAttribute('data-loading', '');
    this.setAttribute('aria-busy', 'true');
    this.#statusEl().textContent = 'Loading…';

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (controller.signal.aborted) return;

      this.#items = Array.isArray(data) ? data : data?.items || data?.data || [];
      this.#loaded = true;
      this.#setStatus('');
      this.#render('attribute');
    } catch (e) {
      if (controller.signal.aborted) return;
      const message = e instanceof Error ? e.message : String(e);
      console.error('[card-list] Fetch error:', e);
      this.setAttribute('data-error', message);
      this.#setStatus(`Error: ${message}`);
    } finally {
      if (this.#abort === controller) {
        this.#abort = null;
        this.removeAttribute('data-loading');
        this.removeAttribute('aria-busy');
      }
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
   * @param {'api' | 'attribute'} source - What changed the items.
   */
  #render(source) {
    if (!this.#template) return;

    // Static no-JS content is replaced by the rendered cards.
    this.querySelectorAll(':scope > [data-fallback]').forEach(el => el.remove());

    const template = this.#template;
    const roots = [...template.content.children];
    if (roots.length !== 1) {
      // Multi-root templates can't be diffed by key — wholesale re-render.
      this.querySelectorAll(':scope > :not(template, [data-card-list-status])').forEach(el => el.remove());
      this.#nodes.clear();
      const fragment = document.createDocumentFragment();
      for (const item of this.#items) {
        const clone = /** @type {DocumentFragment} */ (template.content.cloneNode(true));
        this.#bindData(clone, item);
        fragment.appendChild(clone);
      }
      this.prepend(fragment);
    } else {
      const keys = keysFor(this.#items, this.#keyProp);
      const entries = this.#items.map((item, i) => ({ item, key: keys[i] }));
      const result = diffByKey({
        newItems: entries,
        nodes: this.#nodes,
        keyOf: (entry) => entry.key,
        renderItem: (entry) => {
          const clone = /** @type {DocumentFragment} */ (template.content.cloneNode(true));
          const wrapper = /** @type {HTMLElement} */ (clone.firstElementChild);
          this.#bindData(wrapper, entry.item);
          return wrapper;
        },
        containerFor: () => this,
      });
      // Re-bind data on preserved nodes so updated field values for the
      // same key still propagate. New nodes were already bound in renderItem.
      const addedSet = new Set(result.added);
      for (const { item, key } of entries) {
        if (addedSet.has(key)) continue;
        const node = this.#nodes.get(key);
        if (node) this.#bindData(node, item);
      }
    }

    this.dispatchEvent(new CustomEvent('card-list:rendered', {
      detail: { count: this.#items.length },
      bubbles: true
    }));
    this.dispatchEvent(new CustomEvent('card-list:items-changed', {
      detail: { items: this.#items, source },
      bubbles: true
    }));
  }

  /**
   * Bind one item's data into a card (or a multi-root fragment).
   *
   * @param {ParentNode} root - Card root or fragment.
   * @param {*} item - Item data.
   */
  #bindData(root, item) {
    /** @param {string} sel */
    const all = (sel) => {
      const list = [...root.querySelectorAll(sel)];
      if (root instanceof Element && root.matches(sel)) list.unshift(root);
      return list;
    };

    // data-field: Set textContent
    all('[data-field]').forEach(el => {
      const value = getValueByPath(item, el.getAttribute('data-field'));
      el.textContent = value ?? '';
    });

    // data-field-attr: Set attributes; null/undefined removes them.
    all('[data-field-attr]').forEach(el => {
      for (const { attr, path } of parseAttrMapping(el.getAttribute('data-field-attr'))) {
        if (!isValidPath(path)) continue;
        const value = getValueByPath(item, path);
        if (attr.startsWith('on') || BLOCKED_ATTRS.has(attr)) {
          console.warn(`[card-list] Refusing to bind "${attr}" from data`);
          continue;
        }
        const isAria = attr.startsWith('aria-');
        if (value == null || (value === false && !isAria)) {
          el.removeAttribute(attr);
        } else if (isSafeAttrBinding(attr, value)) {
          el.setAttribute(attr, value === true && !isAria ? '' : String(value));
        } else {
          console.warn(`[card-list] Unsafe value refused for "${attr}"`);
          el.removeAttribute(attr);
        }
      }
    });

    // data-field-html: Set innerHTML (sanitized)
    all('[data-field-html]').forEach(el => {
      el.replaceChildren(sanitizeToFragment(getValueByPath(item, el.getAttribute('data-field-html'))));
    });

    // data-field-if / data-field-unless toggle [hidden] so re-binding a
    // preserved card can bring the element back.
    all('[data-field-if]').forEach(el => {
      /** @type {HTMLElement} */ (el).hidden = !getValueByPath(item, el.getAttribute('data-field-if'));
    });
    all('[data-field-unless]').forEach(el => {
      /** @type {HTMLElement} */ (el).hidden = !!getValueByPath(item, el.getAttribute('data-field-unless'));
    });
  }

  /**
   * The current items array. After upgrade, reflects the parsed
   * data-items / src JSON; after assignment, reflects what was passed in.
   *
   * @returns {any[]} The items array.
   */
  get items() {
    return this.#items;
  }

  /**
   * Replace the items list. Runs a keyed diff against existing rendered
   * cards: nodes whose key (per data-key) persists across assignments
   * are preserved (focus, animation, scroll position survive). New keys
   * trigger a fresh template clone; dropped keys are removed. Cancels any
   * in-flight src fetch (the latest write wins).
   */
  set items(value) {
    this.#abortFetch();
    this.#items = Array.isArray(value) ? value : [];
    this.#loaded = true;
    if (this.#template && this.hasAttribute('data-upgraded')) {
      this.#render('api');
    } else {
      this.#pendingSource = 'api';
    }
  }
}

registerComponent('card-list', CardList);

// Export for testing
export { CardList, isValidPath, getValueByPath, isSafeUrl, isSafeAttrBinding };
export { sanitizeHTML } from '../../lib/sanitize-html.js';
