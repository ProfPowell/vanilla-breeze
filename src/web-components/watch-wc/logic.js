/**
 * watch-wc: drop-in wrapper for the data-watch-page button.
 *
 * Renders a styled, accessible toggle button that adds or removes the
 * current page from the user's VBStore('watches') list. The state machine
 * lives in src/utils/page-watch-init.js; this component renders
 *
 *   <button type="button" data-watch-page aria-pressed="false">
 *     <icon-wc name="bookmark"></icon-wc>
 *   </button>
 *
 * and repaints its label, icon and title from the button's aria-pressed,
 * which page-watch-init keeps in sync with the store (on load, on click,
 * and whenever any watch button or the notification panel changes it).
 *
 * Accessible name: the icon variant is named by aria-label
 * (data-label-action). The compact and button variants are named by their
 * visible text (no aria-label, so the visible label is the name, WCAG 2.5.3);
 * aria-pressed carries the state in every variant.
 *
 * No-JS fallback: authored children (e.g. a "subscribe by email" link) show
 * until the component upgrades, then are hidden.
 *
 * @attr {string}  [variant="icon"]  - "icon" | "compact" | "button"
 * @attr {string}  [label]           - Constant visible text for compact/button
 *                                    (overrides data-label-watch/-watching)
 * @attr {boolean} [server-sync]     - Turns on server-side sync for the whole
 *                                    page (sets window.vbPageWatch.serverSync)
 * @attr {string}  [data-label-watch="Watch for updates"]    - Text when not watching
 * @attr {string}  [data-label-watching="Watching"]          - Text when watching
 * @attr {string}  [data-label-action="Watch this page for updates"] - Icon variant name + tooltip
 * @attr {string}  [data-label-stop="Stop watching this page"]       - Icon variant tooltip when watching
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/** Default English strings; each is overridable with data-label-<key>. */
const LABELS = {
  watch: 'Watch for updates',
  watching: 'Watching',
  action: 'Watch this page for updates',
  stop: 'Stop watching this page',
};

class WatchWc extends VBElement {
  static observedAttributes = [
    'variant', 'label',
    'data-label-watch', 'data-label-watching', 'data-label-action', 'data-label-stop',
  ];

  /** @type {HTMLButtonElement|null} */
  #button = null;
  /** @type {MutationObserver|null} */
  #observer = null;

  setup() {
    if (this.hasAttribute('server-sync')) {
      // Page-global: page-watch-init reads this flag on every (un)subscribe.
      const w = /** @type {*} */ (window);
      w.vbPageWatch = { ...(w.vbPageWatch ?? {}), serverSync: true };
    }

    const variant = this.#variant();
    this.dataset.variant = variant;

    // Defensive: drop a stale generated button (never authored fallback).
    this.querySelectorAll(':scope > [data-watch-wc]').forEach((el) => el.remove());

    const btn = this.#renderButton(variant);
    this.#button = btn;
    this.appendChild(btn);
    this.#paint();

    // page-watch-init owns aria-pressed; repaint label/title when it changes.
    this.#observer = new MutationObserver(() => this.#paint());
    this.#observer.observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });

    // Make sure the state machine is running (its guard only fires at boot).
    // A second copy is inert, see page-watch-init's sentinel.
    import('../../utils/page-watch-init.js').catch(() => {});
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#button?.remove();
    this.#button = null;
  }

  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    this._reinit();
  }

  /** @param {keyof typeof LABELS} key */
  #label(key) {
    return this.getAttribute(`data-label-${key}`) ?? LABELS[key];
  }

  #variant() {
    const v = this.getAttribute('variant');
    return v === 'compact' || v === 'button' ? v : 'icon';
  }

  /** @param {string} variant */
  #renderButton(variant) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ghost';
    btn.setAttribute('data-watch-page', '');
    btn.setAttribute('data-watch-wc', '');
    // We manage text + title; page-watch-init only sets aria-pressed + icon.
    btn.setAttribute('data-watch-label-locked', '');
    btn.setAttribute('aria-pressed', 'false');

    const icon = document.createElement('icon-wc');
    icon.setAttribute('name', 'bookmark');
    icon.setAttribute('size', variant === 'icon' ? 'sm' : 'xs');
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);

    if (variant === 'icon') {
      btn.setAttribute('aria-label', this.#label('action'));
    } else {
      btn.appendChild(document.createElement('span'));
    }
    return btn;
  }

  #paint() {
    const btn = this.#button;
    if (!btn) return;
    const watching = btn.getAttribute('aria-pressed') === 'true';
    btn.querySelector('icon-wc')?.setAttribute('name', watching ? 'bookmark-check' : 'bookmark');
    const span = btn.querySelector(':scope > span');
    if (span) {
      span.textContent = this.getAttribute('label') ?? this.#label(watching ? 'watching' : 'watch');
      btn.removeAttribute('title');
    } else {
      btn.setAttribute('title', watching ? this.#label('stop') : this.#label('action'));
    }
  }
}

registerComponent('watch-wc', WatchWc);

export { WatchWc };
