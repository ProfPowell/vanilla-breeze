import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { VBStore } from '../../lib/vb-store.js';

/**
 * consent-banner: Cookie/privacy consent banner
 *
 * A non-modal banner (bottom/top) or modal dialog (center) that records
 * user consent preferences via VBStore (namespace `consent`, localStorage
 * key `vb:consent:<persist>`). Supports simple accept/reject and granular
 * checkbox-based preferences.
 *
 * Bottom/top positions use dialog.show() (non-modal — page remains
 * interactive). Center uses dialog.showModal() (modal — user must choose).
 *
 * If storage is unavailable (privacy mode, blocked localStorage) the banner
 * still opens and still fires its change event; the choice just is not
 * remembered across loads.
 *
 * @attr {string} persist   - VBStore key under namespace `consent` (default: 'banner')
 * @attr {string} position  - 'bottom' (default), 'top', 'center'
 * @attr {string} trigger   - CSS selector for a "manage cookies" re-open button
 * @attr {string} expires   - Days until consent expires (default: 365, 0 = never)
 *
 * @fires consent-banner:change - When user makes a consent choice
 *   detail: { preferences: Object, action: string }
 */

const DEFAULT_KEY = 'banner';
const DEFAULT_EXPIRY_DAYS = 365;
const DAY_MS = 86_400_000;

/**
 * Parse an `expires` value (days) into a maxAge in ms; undefined = never.
 * @param {string | number | null | undefined} val
 * @returns {number | undefined}
 */
function expiresToMaxAge(val) {
  if (val === 0 || val === '0' || val === 'never') return undefined;
  const days = val == null || val === '' ? DEFAULT_EXPIRY_DAYS : Number.parseFloat(String(val));
  if (!Number.isFinite(days)) return DEFAULT_EXPIRY_DAYS * DAY_MS;
  return days > 0 ? days * DAY_MS : undefined;
}

let nameSeq = 0;

class ConsentBanner extends VBElement {
  /** @type {HTMLDialogElement} */
  #dialog = /** @type {*} */ (null);

  static get observedAttributes() {
    return ['position'];
  }

  get #key() {
    return this.getAttribute('persist') || DEFAULT_KEY;
  }

  get #maxAge() {
    return expiresToMaxAge(this.getAttribute('expires'));
  }

  get #isCenter() {
    return this.getAttribute('position') === 'center';
  }

  setup() {
    this.#dialog = /** @type {HTMLDialogElement} */ (this.querySelector('dialog'));
    if (!this.#dialog) return false;

    this.#nameDialog();

    if (this.getAttribute('trigger')) {
      this.listen(document, 'click', this.#onTriggerClick);
    }
    this.listen(this, 'click', this.#onClick);
    this.listen(this.#dialog, 'cancel', this.#onCancel);

    this.#initStored();
    return true;
  }

  /**
   * Re-show in the new mode when `position` changes while the banner is open
   * (modal ↔ non-modal needs a close + show/showModal).
   * @param {string} _name
   * @param {string | null} oldVal
   * @param {string | null} newVal
   */
  attributeChangedCallback(_name, oldVal, newVal) {
    if (oldVal === newVal || !this.#dialog?.open) return;
    this.#dialog.close();
    this.#show();
  }

  /** Give the dialog an accessible name unless the author already did. */
  #nameDialog() {
    const dialog = this.#dialog;
    if (dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby')) return;
    const heading = dialog.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      if (!heading.id) heading.id = `consent-banner-title-${++nameSeq}`;
      dialog.setAttribute('aria-labelledby', heading.id);
    } else {
      dialog.setAttribute('aria-label', 'Cookie consent');
    }
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

  #show() {
    if (this.#isCenter) this.#dialog.showModal();
    else this.#dialog.show();
  }

  #open() {
    if (!this.isConnected || this.#dialog.open) return;
    this.#show();
  }

  #close() {
    this.#dialog.close();

    if (this.getAttribute('trigger')) {
      this.hidden = true;
    } else {
      this.remove();
    }
  }

  /* Prevent ESC on center (consent wall) */
  #onCancel = (e) => {
    if (this.#isCenter) e.preventDefault();
  };

  #onClick = async (e) => {
    if (!this.#dialog.open) return;
    const btn = /** @type {HTMLButtonElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('button[value]'));
    if (!btn || !this.#dialog.contains(btn)) return;

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

  /* Storage failures (no localStorage, quota, SecurityError) are treated as
     "no stored consent" so the banner still opens. */
  async #read() {
    const maxAge = this.#maxAge;
    try {
      return await VBStore.get('consent', this.#key, maxAge ? { maxAge } : undefined);
    } catch {
      return null;
    }
  }

  async #write(data) {
    try {
      await VBStore.set('consent', this.#key, data);
    } catch {
      /* Not persisted — the choice still applies for this page view. */
    }
  }

  /* ── Static API ── */

  /**
   * Clear stored consent so the banner reappears on next page load.
   * @param {string} [key='banner'] - VBStore key under namespace `consent`
   * @returns {Promise<void>}
   */
  static async reset(key = DEFAULT_KEY) {
    try {
      await VBStore.remove('consent', key);
    } catch {
      /* storage unavailable — nothing stored to clear */
    }
  }

  /**
   * Read stored consent preferences, honouring expiry.
   *
   * Expiry comes from `options.expires` (days; 0 or 'never' disables). When
   * omitted it is read from a `<consent-banner>` in the document with the
   * same `persist` key, else the banner default of 365 days. Banners without
   * `trigger` remove themselves after a choice, so pass `expires` explicitly
   * if you use a non-default value.
   *
   * @param {string} [key='banner'] - VBStore key under namespace `consent`
   * @param {{ expires?: number | string }} [options]
   * @returns {Promise<{ preferences: Record<string, boolean>, action: string } | null>}
   *   null when nothing is stored, the entry expired, or storage is unavailable
   */
  static async getConsent(key = DEFAULT_KEY, options = {}) {
    let expires = options.expires;
    if (expires === undefined && typeof document !== 'undefined') {
      const banner = [...document.querySelectorAll('consent-banner')]
        .find(el => (el.getAttribute('persist') || DEFAULT_KEY) === key);
      expires = banner?.getAttribute('expires') ?? undefined;
    }
    const maxAge = expiresToMaxAge(expires);
    try {
      return /** @type {*} */ (await VBStore.get('consent', key, maxAge ? { maxAge } : undefined));
    } catch {
      return null;
    }
  }
}

registerComponent('consent-banner', ConsentBanner);

export { ConsentBanner };
