/**
 * nav-bar: Top-level site/app navigation primitive.
 *
 * Two modes:
 * 1. HTML-first — wrap existing `<a>` children. The component sets
 *    `aria-current="page"` on the link best matching `location.pathname`
 *    (exact wins, longest-prefix breaks ties). A popstate listener
 *    keeps the active state fresh.
 * 2. JS-first — assign `.items = [{ href, label, ... }]` to rebuild
 *    children with the default renderer. Idempotent.
 *
 * `.current` (string|null) is an explicit-ownership escape hatch:
 * setting it disables popstate auto-sync. Call `.releaseCurrent()` to
 * return to auto mode.
 *
 * @attr {string} data-match - "exact" to require exact pathname match
 *   (default: exact wins, longest prefix breaks ties).
 *
 * @example HTML-first
 * <nav-bar aria-label="Main">
 *   <a href="/">Home</a>
 *   <a href="/dashboard">Dashboard</a>
 *   <a href="/settings">Settings</a>
 * </nav-bar>
 *
 * @example JS-first
 * nav.items = [
 *   { href: '/', label: 'Home' },
 *   { href: '/dashboard', label: 'Dashboard', icon: 'gauge' },
 * ];
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class NavBar extends VBElement {
  #items = null;          // Last assigned .items array (deep-cloned)
  #explicit = false;      // Did consumer assign .current?
  #current = null;        // Current value (only meaningful when #explicit)

  setup() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'navigation');
    this.#syncActive('pathname');
    this.listen(window, 'popstate', this.#onPopstate);
  }

  // ── Data API ─────────────────────────────────────────────────────────

  /**
   * Read the link list. Returns the last assigned array (round-trip)
   * if `.items` was set, otherwise infers `{ href, label }` from
   * current `<a>` children.
   */
  get items() {
    if (this.#items) return this.#items.map(i => ({ ...i }));
    return Array.from(this.#linkChildren()).map(a => ({
      href: a.getAttribute('href') || '',
      label: a.textContent?.trim() || '',
    }));
  }

  /**
   * Replace children with the default renderer. Idempotent: a
   * deep-equal assignment is a no-op (no event re-fire). Emits
   * `nav-bar:items-changed` { items, source: 'property' }.
   */
  set items(value) {
    if (!Array.isArray(value)) return;
    const next = value.map(i => ({ ...i }));
    if (this.#items && this.#deepEqualItems(this.#items, next)) return;

    this.#items = next;
    this.#renderItems(next);
    this.#syncActive(this.#explicit ? 'property' : 'pathname');

    this.dispatchEvent(new CustomEvent('nav-bar:items-changed', {
      detail: { items: this.items, source: 'property' },
      bubbles: true, composed: true,
    }));
  }

  /**
   * Read the current route. Returns the explicit value if one was
   * assigned, otherwise the `data-route` (or `href`) of the link
   * currently carrying `aria-current="page"`, or null.
   */
  get current() {
    if (this.#explicit) return this.#current;
    for (const link of this.#linkChildren()) {
      if (link.getAttribute('aria-current') === 'page') {
        return link.getAttribute('data-route') || link.getAttribute('href') || null;
      }
    }
    return null;
  }

  /**
   * Take ownership of the active state. Setting (even to null) disables
   * popstate auto-sync. Call `.releaseCurrent()` to return to auto.
   * Emits `nav-bar:current-changed`
   * { current, previous, source: 'property' } when the value changes.
   */
  set current(value) {
    const previous = this.current;
    const normalized = value == null ? null : String(value);
    this.#explicit = true;
    this.#current = normalized;

    this.#applyCurrent(normalized);

    if (previous !== normalized) {
      this.dispatchEvent(new CustomEvent('nav-bar:current-changed', {
        detail: { current: normalized, previous, source: 'property' },
        bubbles: true, composed: true,
      }));
    }
  }

  /**
   * Restore auto mode (pathname matching + popstate sync).
   * The documented escape hatch from explicit ownership.
   */
  releaseCurrent() {
    if (!this.#explicit) return;
    this.#explicit = false;
    this.#current = null;
    this.#syncActive('pathname');
  }

  /**
   * Manually re-run pathname matching. Useful for AJAX frameworks
   * (e.g. HTML-Star) that change the URL without firing popstate.
   * No-op when `.current` is explicitly owned.
   */
  refresh() {
    if (this.#explicit) return;
    this.#syncActive('pathname');
  }

  // ── Internals ────────────────────────────────────────────────────────

  /**
   * The links nav-bar manages.
   *
   * Default: direct `<a>` children — the HTML-first "wrap your links"
   * shape. If any descendant link carries `data-nav-link`, those are
   * used instead — for cases where the link list is wrapped in
   * `<li>`/`<drop-down>`/etc. This keeps the simple case tight and
   * lets nested layouts opt in without a config knob.
   */
  #linkChildren() {
    const tagged = this.querySelectorAll('a[data-nav-link]');
    if (tagged.length > 0) return tagged;
    return this.querySelectorAll(':scope > a');
  }

  #onPopstate = () => {
    if (this.#explicit) return;
    this.#syncActive('popstate');
  };

  #syncActive(source) {
    const previous = this.current;
    const next = this.#matchPathname();
    this.#applyCurrent(next);
    if (previous !== next) {
      this.dispatchEvent(new CustomEvent('nav-bar:current-changed', {
        detail: { current: next, previous, source },
        bubbles: true, composed: true,
      }));
    }
  }

  /**
   * Find the link whose href best matches `location.pathname`.
   * Exact wins; otherwise longest prefix wins; ties broken by
   * first-in-DOM-order. Returns the link's data-route or href, or null.
   */
  #matchPathname() {
    const path = window.location.pathname;
    const links = Array.from(this.#linkChildren());
    if (links.length === 0) return null;

    const exactOnly = this.getAttribute('data-match') === 'exact';

    let exact = null;
    let bestPrefix = null;
    let bestPrefixLen = -1;

    for (const link of links) {
      const href = link.getAttribute('href');
      // Skip absolute external URLs and protocol-relative links
      if (!href || /^[a-z]+:/i.test(href) || href.startsWith('//')) continue;

      // Normalize: strip query/hash for matching purposes
      const linkPath = href.split('?')[0].split('#')[0];

      if (linkPath === path && exact == null) {
        exact = link;
        continue;
      }

      if (!exactOnly && linkPath !== '/' &&
          (path === linkPath || path.startsWith(linkPath.replace(/\/$/, '') + '/'))) {
        if (linkPath.length > bestPrefixLen) {
          bestPrefix = link;
          bestPrefixLen = linkPath.length;
        }
      }
    }

    const match = exact || bestPrefix;
    if (!match) return null;
    return match.getAttribute('data-route') || match.getAttribute('href');
  }

  #applyCurrent(value) {
    const links = this.#linkChildren();
    for (const link of links) {
      const route = link.getAttribute('data-route') || link.getAttribute('href');
      if (value != null && route === value) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  #renderItems(items) {
    // Replace direct <a> children only; preserve other slotted content.
    const existing = this.#linkChildren();
    existing.forEach(el => el.remove());

    const frag = document.createDocumentFragment();
    for (const item of items) {
      frag.appendChild(this.#renderItem(item));
    }
    this.appendChild(frag);
  }

  #renderItem(item) {
    const a = document.createElement('a');
    a.href = item.href || '#';
    if (item.route) a.setAttribute('data-route', item.route);

    if (item.external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }

    if (item.icon) {
      const icon = document.createElement('icon-wc');
      icon.setAttribute('name', String(item.icon));
      icon.setAttribute('size', 'sm');
      a.appendChild(icon);
    }

    a.appendChild(document.createTextNode(item.label || ''));

    if (item.external) {
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = ' (opens in new tab)';
      a.appendChild(sr);
    }

    if (item.badge != null) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = String(item.badge);
      a.appendChild(badge);
    }

    return a;
  }

  #deepEqualItems(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const ka = Object.keys(a[i]).sort();
      const kb = Object.keys(b[i]).sort();
      if (ka.length !== kb.length) return false;
      for (let j = 0; j < ka.length; j++) {
        if (ka[j] !== kb[j]) return false;
        if (a[i][ka[j]] !== b[i][kb[j]]) return false;
      }
    }
    return true;
  }
}

registerComponent('nav-bar', NavBar);

export { NavBar };
