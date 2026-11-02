import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * content-lens: Universal switchable host for VB lens components.
 *
 * Wraps a set of light-DOM lens children (each with `data-lens-name`) and
 * exposes reader controls to switch which one is active. Mirrors the
 * <layout-switcher> attribute precedent — `data-lens-*` is the family.
 *
 * Each lens child is a fully-functional standalone component
 * (<author-index>, <trust-filter>, etc.). content-lens just shows/hides
 * them and propagates the shared `data-lens-src` so they can fetch the
 * same aggregated source. Forwarding is order-independent: children that
 * upgraded before the host (e.g. their definitions registered first) are
 * re-initialised after the attribute is forwarded so they pick it up.
 *
 * @attr {string}  data-lens-default    Lens name to show on first load
 * @attr {string}  data-lens-controls   "on" (default) | "off" — render reader controls
 * @attr {string}  data-lens-src        Shared JSON source URL forwarded to children
 * @attr {string}  data-lens-storage    Key for sessionStorage persistence (default: pathname)
 *
 * @fires content-lens:change  detail: { lens: 'trust' } — on reader or
 *        setLens() switches only; never on the initial / restored selection.
 *
 * @example
 *   <content-lens data-lens-default="time"
 *                 data-lens-src="/pages.json">
 *     <time-index data-lens-name="time">…</time-index>
 *     <author-index data-lens-name="author"></author-index>
 *     <topic-map data-lens-name="topic"></topic-map>
 *     <trust-filter data-lens-name="trust"></trust-filter>
 *   </content-lens>
 */
class ContentLens extends VBElement {
  /** @type {Map<string, Element>} */
  #lenses = new Map();
  /** @type {string} */
  #activeLens = '';
  /** @type {HTMLElement|null} */
  #controls = null;

  setup() {
    this.#discoverLenses();
    if (this.#lenses.size === 0) return false;

    this.#forwardSharedSource();
    this.#renderControls();

    const initial = this.#initialLens();
    this.#activate(initial, { persist: false, notify: false });
    return true;
  }

  #discoverLenses() {
    for (const child of this.children) {
      const name = child.getAttribute('data-lens-name');
      if (!name) continue;
      this.#lenses.set(name, child);
    }
  }

  #forwardSharedSource() {
    const src = this.getAttribute('data-lens-src');
    if (!src) return;
    /* Children already carrying their own data-lens-src or src win. */
    for (const child of this.#lenses.values()) {
      if (child.hasAttribute('data-lens-src') || child.hasAttribute('src')) continue;
      child.setAttribute('data-lens-src', src);
      /* Upgrade order is not guaranteed (definition order, lazy autoload,
       * reconnects). A child that already ran setup() read no source, so
       * re-run its lifecycle now that the attribute is present. Children
       * that upgrade later simply read it in their own setup(). */
      const lens = /** @type {any} */ (child);
      if (child.hasAttribute('data-upgraded') && typeof lens._reinit === 'function') {
        lens._reinit();
      }
    }
  }

  #renderControls() {
    if (this.getAttribute('data-lens-controls') === 'off') return;
    // Reconnect guard: VBElement re-runs setup() on every reconnect, which
    // would prepend a second control group. Skip if ours is already in place.
    if (this.#controls?.parentNode === this) return;

    /* A plain fieldset/legend groups and names the radios; no landmark —
     * a <nav> per lens host would litter the landmark list. */
    const fieldset = document.createElement('fieldset');
    fieldset.setAttribute('data-content-lens-controls', '');
    const legend = document.createElement('legend');
    legend.textContent = 'View';
    fieldset.append(legend);

    const groupName = `content-lens-${Math.random().toString(36).slice(2, 8)}`;

    for (const [name, el] of this.#lenses) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = groupName;
      input.value = name;
      input.addEventListener('change', () => {
        if (input.checked) this.#activate(name, { persist: true, notify: true });
      });
      const text = document.createElement('span');
      text.textContent = el.getAttribute('data-lens-label') || this.#humanize(name);
      label.append(input, text);
      fieldset.append(label);
    }

    this.prepend(fieldset);
    this.#controls = fieldset;
  }

  #humanize(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  #storageKey() {
    const explicit = this.getAttribute('data-lens-storage');
    return `vb:content-lens:${explicit || (typeof location !== 'undefined' ? location.pathname : 'default')}`;
  }

  #initialLens() {
    const stored = (() => {
      try {
        return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.#storageKey()) : null;
      } catch {
        return null;
      }
    })();
    if (stored && this.#lenses.has(stored)) return stored;
    const def = this.getAttribute('data-lens-default');
    if (def && this.#lenses.has(def)) return def;
    return [...this.#lenses.keys()][0];
  }

  /**
   * @param {string} name
   * @param {{ persist: boolean, notify: boolean }} opts
   */
  #activate(name, { persist, notify }) {
    if (!this.#lenses.has(name)) return;
    const changed = name !== this.#activeLens;

    for (const [key, el] of this.#lenses) {
      const isActive = key === name;
      el.toggleAttribute('hidden', !isActive);
      el.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    }

    if (this.#controls) {
      const input = /** @type {HTMLInputElement | null} */ (this.#controls.querySelector(`input[value="${CSS.escape(name)}"]`));
      if (input) input.checked = true;
    }

    this.#activeLens = name;
    this.setAttribute('data-active-lens', name);

    if (persist) {
      try {
        sessionStorage.setItem(this.#storageKey(), name);
      } catch { /* ignore quota / privacy mode */ }
    }

    if (notify && changed) {
      this.dispatchEvent(new CustomEvent('content-lens:change', {
        detail: { lens: name },
        bubbles: true
      }));
    }
  }

  /* Programmatic API */

  /** @returns {string} Name of the visible lens ('' before upgrade). */
  get activeLens() {
    return this.#activeLens;
  }

  /**
   * Switch to the named lens (ignored if unknown). Persists the choice and
   * fires content-lens:change when the lens actually changes.
   * @param {string} name
   */
  setLens(name) {
    this.#activate(name, { persist: true, notify: true });
  }
}

registerComponent('content-lens', ContentLens);

export { ContentLens };
