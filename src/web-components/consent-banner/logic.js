import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { VBStore } from '../../lib/vb-store.js';

/**
 * consent-banner: Cookie/privacy consent banner
 *
 * A non-modal banner (bottom/top) or modal dialog (center) that records
 * user consent preferences via VBStore (namespace `consent`). Supports
 * simple accept/reject and granular checkbox-based preferences.
 *
 * Bottom/top positions use dialog.show() (non-modal — page remains
 * interactive). Center uses dialog.showModal() (modal — user must choose).
 *
 * @attr {string} persist   - VBStore key under namespace `consent` (default: 'banner')
 * @attr {string} position  - 'bottom' (default), 'top', 'center'
 * @attr {string} trigger   - CSS selector for a "manage cookies" re-open button
 * @attr {string} expires   - Days until consent expires (default: 365, 0 = never)
 *
 * @fires consent-banner:change - When user makes a consent choice
 *   detail: { preferences: Object, action: string }
 */
class ConsentBanner extends VBElement {
  /** @type {HTMLDialogElement} */
  #dialog = /** @type {*} */ (null);

  static get observedAttributes() {
    return ['position'];
  }

  get #key() {
    return this.getAttribute('persist') || 'banner';
  }

  get #expiryDays() {
    const val = this.getAttribute('expires');
    if (val === '0' || val === 'never') return 0;
    return val ? parseInt(val, 10) : 365;
  }

  get #maxAge() {
    const days = this.#expiryDays;
    return days > 0 ? days * 86_400_000 : undefined;
  }

  setup() {
    this.#dialog = /** @type {HTMLDialogElement} */ (this.querySelector('dialog'));
    if (!this.#dialog) return false;

    if (this.getAttribute('trigger')) {
      this.listen(document, 'click', this.#onTriggerClick);
    }

    this.#initStored();
    return true;
  }

  async #initStored() {
    const stored = await this.#read();
    if (stored) {
      if (this.getAttribute('trigger')) {
        this.hidden = true;
      } else {
        this.remove();
      }
      return;
    }

    this.#open();
  }

  #open() {
    const position = this.getAttribute('position') || 'bottom';

    if (position === 'center') {
      this.#dialog.showModal();
      this.#dialog.addEventListener('cancel', this.#onCancel);
    } else {
      this.#dialog.show();
    }

    this.addEventListener('click', this.#onClick);
  }

  #close() {
    this.#dialog.removeEventListener('cancel', this.#onCancel);
    this.removeEventListener('click', this.#onClick);
    this.#dialog.close();

    if (this.getAttribute('trigger')) {
      this.hidden = true;
    } else {
      this.remove();
    }
  }

  /* Prevent ESC on center (consent wall) */
  #onCancel = (e) => {
    e.preventDefault();
  };

  #onClick = async (e) => {
    const btn = /** @type {HTMLButtonElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('button[value]'));
    if (!btn) return;

    const action = btn.value;
    if (!['accept', 'reject', 'save'].includes(action)) return;

    const checkboxes = /** @type {HTMLInputElement[]} */ ([...this.querySelectorAll('input[type="checkbox"]')]);
    const preferences = {};

    if (action === 'accept') {
      checkboxes.forEach(cb => { preferences[cb.name] = true; });
    } else if (action === 'reject') {
      checkboxes.forEach(cb => { preferences[cb.name] = !!cb.disabled; });
    } else {
      checkboxes.forEach(cb => { preferences[cb.name] = cb.checked; });
    }

    await this.#write({ preferences, action });

    this.dispatchEvent(new CustomEvent('consent-banner:change', {
      bubbles: true,
      detail: { preferences, action }
    }));

    this.#close();
  };

  #onTriggerClick = async (e) => {
    const sel = this.getAttribute('trigger');
    if (!sel) return;

    const trigger = /** @type {HTMLElement} */ (e.target).closest(sel);
    if (!trigger) return;

    e.preventDefault();

    /* Restore stored preferences to checkboxes */
    const stored = /** @type {any} */ (await this.#read());
    if (stored?.preferences) {
      for (const [name, checked] of Object.entries(stored.preferences)) {
        const cb = /** @type {HTMLInputElement | null} */ (this.querySelector(
          `input[type="checkbox"][name="${CSS.escape(name)}"]`
        ));
        if (cb && !cb.disabled) cb.checked = /** @type {boolean} */ (checked);
      }
    }

    this.hidden = false;
    this.#open();
  };

  /* ── VBStore ── */

  async #read() {
    const maxAge = this.#maxAge;
    return await VBStore.get('consent', this.#key, maxAge ? { maxAge } : undefined);
  }

  async #write(data) {
    await VBStore.set('consent', this.#key, data);
  }

  /* ── Static API ── */

  /**
   * Clear stored consent so the banner reappears on next page load.
   * @param {string} [key='banner'] - VBStore key under namespace `consent`
   */
  static async reset(key = 'banner') {
    await VBStore.remove('consent', key);
  }

  /**
   * Read stored consent preferences.
   * @param {string} [key='banner'] - VBStore key under namespace `consent`
   * @returns {Promise<{ preferences: Record<string, boolean>, action: string } | null>}
   */
  static async getConsent(key = 'banner') {
    return /** @type {*} */ (await VBStore.get('consent', key));
  }
}

registerComponent('consent-banner', ConsentBanner);

export { ConsentBanner };
