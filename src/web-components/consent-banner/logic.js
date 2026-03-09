/**
 * consent-banner: Cookie/privacy consent banner
 *
 * A non-modal banner (bottom/top) or modal dialog (center) that records
 * user consent preferences to localStorage. Supports simple accept/reject
 * and granular checkbox-based preferences.
 *
 * Bottom/top positions use dialog.show() (non-modal — page remains
 * interactive). Center uses dialog.showModal() (modal — user must choose).
 *
 * @attr {string} data-persist   - localStorage key (default: 'consent-banner')
 * @attr {string} data-position  - 'bottom' (default), 'top', 'center'
 * @attr {string} data-trigger   - CSS selector for a "manage cookies" re-open button
 * @attr {string} data-expires   - Days until consent expires (default: 365, 0 = never)
 *
 * @fires consent-banner:change - When user makes a consent choice
 *   detail: { preferences: Object, action: string }
 *
 * @example Simple banner
 * <consent-banner>
 *   <dialog>
 *     <p>We use cookies. <a href="/privacy">Privacy Policy</a></p>
 *     <footer>
 *       <button value="reject" class="secondary">Reject All</button>
 *       <button value="accept">Accept All</button>
 *     </footer>
 *   </dialog>
 * </consent-banner>
 *
 * @example Granular preferences with trigger
 * <consent-banner data-persist="cookie-prefs" data-trigger="#manage-cookies">
 *   <dialog>
 *     <header><h2>Cookie Preferences</h2></header>
 *     <section>
 *       <p>We use cookies. <a href="/privacy">Learn more</a></p>
 *       <fieldset>
 *         <label><input type="checkbox" name="necessary" checked disabled> Necessary</label>
 *         <label><input type="checkbox" name="analytics"> Analytics</label>
 *         <label><input type="checkbox" name="marketing"> Marketing</label>
 *       </fieldset>
 *     </section>
 *     <footer>
 *       <button value="reject" class="secondary">Reject All</button>
 *       <button value="save" class="secondary">Save Preferences</button>
 *       <button value="accept">Accept All</button>
 *     </footer>
 *   </dialog>
 * </consent-banner>
 */
class ConsentBanner extends HTMLElement {
  #dialog;

  static get observedAttributes() {
    return ['data-position'];
  }

  get #key() {
    return this.dataset.persist || 'consent-banner';
  }

  get #expiryDays() {
    const val = this.dataset.expires;
    if (val === '0' || val === 'never') return 0;
    return val ? parseInt(val, 10) : 365;
  }

  connectedCallback() {
    this.#dialog = this.querySelector('dialog');
    if (!this.#dialog) return;

    if (this.dataset.trigger) {
      document.addEventListener('click', this.#onTriggerClick);
    }

    const stored = this.#read();
    if (stored && !this.#isExpired(stored)) {
      if (this.dataset.trigger) {
        this.hidden = true;
      } else {
        this.remove();
      }
      return;
    }

    this.#open();
    this.setAttribute('data-upgraded', '');
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.#onTriggerClick);
    this.removeAttribute('data-upgraded');
  }

  #open() {
    const position = this.dataset.position || 'bottom';

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

    if (this.dataset.trigger) {
      this.hidden = true;
    } else {
      this.remove();
    }
  }

  /* Prevent ESC on center (consent wall) */
  #onCancel = (e) => {
    e.preventDefault();
  };

  #onClick = (e) => {
    const btn = e.target.closest('button[value]');
    if (!btn) return;

    const action = btn.value;
    if (!['accept', 'reject', 'save'].includes(action)) return;

    const checkboxes = [...this.querySelectorAll('input[type="checkbox"]')];
    const preferences = {};

    if (action === 'accept') {
      checkboxes.forEach(cb => { preferences[cb.name] = true; });
    } else if (action === 'reject') {
      checkboxes.forEach(cb => { preferences[cb.name] = !!cb.disabled; });
    } else {
      checkboxes.forEach(cb => { preferences[cb.name] = cb.checked; });
    }

    this.#write({ preferences, action, timestamp: Date.now() });

    this.dispatchEvent(new CustomEvent('consent-banner:change', {
      bubbles: true,
      detail: { preferences, action }
    }));

    this.#close();
  };

  #onTriggerClick = (e) => {
    const sel = this.dataset.trigger;
    if (!sel) return;

    const trigger = e.target.closest(sel);
    if (!trigger) return;

    e.preventDefault();

    /* Restore stored preferences to checkboxes */
    const stored = this.#read();
    if (stored?.preferences) {
      for (const [name, checked] of Object.entries(stored.preferences)) {
        const cb = this.querySelector(
          `input[type="checkbox"][name="${CSS.escape(name)}"]`
        );
        if (cb && !cb.disabled) cb.checked = checked;
      }
    }

    this.hidden = false;
    this.#open();
  };

  /* ── localStorage ── */

  #read() {
    try {
      const raw = localStorage.getItem(this.#key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  #write(data) {
    try {
      localStorage.setItem(this.#key, JSON.stringify(data));
    } catch {
      /* localStorage unavailable or full */
    }
  }

  #isExpired(stored) {
    const days = this.#expiryDays;
    if (days === 0) return false;
    const elapsed = Date.now() - (stored.timestamp || 0);
    return elapsed > days * 86_400_000;
  }

  /* ── Static API ── */

  /**
   * Clear stored consent so the banner reappears on next page load.
   * @param {string} [key='consent-banner'] - localStorage key
   */
  static reset(key = 'consent-banner') {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }

  /**
   * Read stored consent preferences.
   * @param {string} [key='consent-banner'] - localStorage key
   * @returns {object|null} { preferences, action, timestamp } or null
   */
  static getConsent(key = 'consent-banner') {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

customElements.define('consent-banner', ConsentBanner);

export { ConsentBanner };
