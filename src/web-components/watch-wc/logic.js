/**
 * watch-wc: drop-in wrapper for the data-watch-page button.
 *
 * Renders a properly-styled, accessible button that toggles whether
 * the current page is in the user's VBStore('watches') list. State
 * lives in src/utils/page-watch-init.js — this component is a
 * one-tag wrapper that authors can use instead of the verbose
 *
 *   <button type="button" data-watch-page class="ghost icon-only"
 *           aria-label="Watch this page for updates">
 *     <icon-wc name="eye" size="sm"></icon-wc>
 *   </button>
 *
 * markup. The internal button still carries `data-watch-page`, so
 * page-watch-init's MutationObserver picks it up and runs the same
 * state machine.
 *
 * @attr {string}  [variant="icon"]  - "icon" | "compact" | "button"
 *                                    Visual preset:
 *                                      icon    → 2.25rem ghost icon button
 *                                      compact → small icon + text label
 *                                      button  → full ghost button with label
 * @attr {string}  [label]           - Override the visible text in `compact`
 *                                    and `button` variants. Defaults to
 *                                    "Watch for updates" / "Watching".
 * @attr {boolean} [server-sync]     - Per-instance opt-in for server-side
 *                                    sync via VBService('notify'). Sets
 *                                    window.vbPageWatch.serverSync = true
 *                                    before the page-watch script runs.
 *
 * Sibling instances stay in sync — the component listens for
 * page-watch:add and page-watch:remove on document and re-syncs
 * its own button.
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const WATCH_LABEL = 'Watch for updates';
const WATCHING_LABEL = 'Watching';

class WatchWc extends VBElement {
  /** @type {HTMLButtonElement|null} */
  #button = null;

  setup() {
    if (this.hasAttribute('server-sync')) {
      // Set the global flag before page-watch-init evaluates it.
      const w = /** @type {*} */ (window);
      w.vbPageWatch = { ...(w.vbPageWatch ?? {}), serverSync: true };
    }

    const variant = this.#variant();
    this.dataset.variant = variant;
    this.#button = this.#renderButton(variant);
    this.appendChild(this.#button);

    // Sibling sync: when ANY watch button changes the page-watch state,
    // re-read VBStore so this instance's button matches.
    this.listen(document, 'page-watch:add', this.#syncFromStore);
    this.listen(document, 'page-watch:remove', this.#syncFromStore);
  }

  #variant() {
    const v = this.getAttribute('variant');
    return v === 'compact' || v === 'button' ? v : 'icon';
  }

  #renderButton(variant) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-watch-page', '');
    btn.className = variant === 'icon' ? 'ghost icon-only' : 'ghost';
    btn.setAttribute('aria-label', 'Watch this page for updates');

    const iconSize = variant === 'icon' ? 'sm' : 'xs';
    const labelText = this.getAttribute('label') ?? WATCH_LABEL;

    if (variant === 'icon') {
      btn.innerHTML = `<icon-wc name="eye" size="${iconSize}"></icon-wc>`;
    } else {
      btn.innerHTML = `<icon-wc name="eye" size="${iconSize}"></icon-wc><span>${this.#escape(labelText)}</span>`;
      // Lock the label so page-watch-init doesn't rewrite it; we manage it here.
      btn.setAttribute('data-watch-label-locked', '');
    }

    return btn;
  }

  /**
   * Re-read VBStore via dynamic import so we don't pull page-watch-init
   * into the eager bundle. The script is lazy-loaded in main.js once a
   * [data-watch-page] is on the page — by the time we get here it's
   * already imported.
   */
  #syncFromStore = async () => {
    if (!this.#button) return;
    try {
      const { readWatch } = await import('../../utils/page-watch-init.js');
      const entry = await readWatch();
      const watching = !!entry;
      this.#button.setAttribute('aria-pressed', watching ? 'true' : 'false');
      const icon = this.#button.querySelector('icon-wc');
      if (icon) icon.setAttribute('name', watching ? 'eye-off' : 'eye');
      const labelSpan = this.#button.querySelector('span');
      if (labelSpan && this.#variant() !== 'icon') {
        const customLabel = this.getAttribute('label');
        labelSpan.textContent = customLabel
          ? customLabel
          : (watching ? WATCHING_LABEL : WATCH_LABEL);
      }
      this.#button.setAttribute(
        'title',
        watching ? 'Stop watching this page' : 'Watch this page for content updates',
      );
    } catch {
      // page-watch-init not yet loaded — fine, it'll set state when it does
    }
  };

  /** @param {string} str */
  #escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

registerComponent('watch-wc', WatchWc);

export { WatchWc };
