/**
 * Wizard Forms - Progressive enhancement for multi-step forms
 *
 * Transforms forms with [data-wizard] into step-by-step wizards while
 * maintaining full functionality without JavaScript.
 *
 * Behaviour summary
 * - Enter in a text field before the last step means "Next", never submit.
 * - Steps hidden by data-wizard-if get data-wizard-hidden and their controls
 *   are disabled (marked data-conditional-disabled, same contract as
 *   data-show-when), so they neither block validation nor get submitted.
 * - On a submit attempt, an invalid control in another step takes the user
 *   to that step and reports it (covers data-wizard-validate="none").
 * - Validation, conditions and the summary read form-associated custom
 *   elements through form.elements.
 * - After a step change, focus moves to the new step's <legend>.
 * - Strings: data-label-back / -next / -submit / -step / -status /
 *   -completed on the form; numbers use Intl.NumberFormat for the nearest
 *   [lang].
 * - data-wizard-persist stores through VBStore ("wizard" namespace) with an
 *   expiry (data-wizard-persist-hours, default 24) and skips controls that
 *   isPersistable() rejects (passwords, hidden, file, secrets, ignored).
 * - data-wizard-history keeps #step=N in the URL and pushes a history
 *   entry per step change, so the browser Back button steps back.
 * - data-wizard-steps may point at a nav.steps list or a <progress-tracker>.
 *
 * @example
 * import { WizardController } from './wizard.js';
 * const wizard = new WizardController(document.querySelector('form[data-wizard]'));
 */

import { VBStore } from './vb-store.js';
import { getLocale } from './i18n.js';
import {
  evaluateCondition, readField, controlName, controlValues,
  syncSectionControls, DISABLED_MARK,
} from './form-conditions.js';
import { isPersistable } from '../utils/_persist-filter.js';
import { registerInit } from '../utils/_init-registry.js';

const STORE_NS = 'wizard';
const SESSION_KEY = 'vb:wizard-session';
const DEFAULT_PERSIST_HOURS = 24;

/** Default UI strings; override with data-label-{key} on the form. */
const LABELS = {
  back: 'Back',
  next: 'Next',
  submit: 'Submit',
  step: 'Step {n}',
  status: 'Now on step {current} of {total}: {name}',
  completed: 'Go to {name} (completed)',
};

/** Inputs where Enter triggers implicit submission. */
const NON_TEXT_INPUTS = new Set([
  'button', 'submit', 'reset', 'image', 'checkbox', 'radio', 'file', 'color', 'range',
]);

/** Per-tab id that ties "session" persistence to the browsing session. */
function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}

/**
 * Valid without side effects beyond the `invalid` event.
 * @param {Element} el
 */
function isValid(el) {
  const anyEl = /** @type {any} */ (el);
  if (typeof anyEl.checkValidity === 'function') return anyEl.checkValidity();
  return !el.matches(':invalid');
}

/** @param {Element} el */
function report(el) {
  const anyEl = /** @type {any} */ (el);
  if (typeof anyEl.reportValidity === 'function') anyEl.reportValidity();
  else anyEl.focus?.();
}

/**
 * WizardController - Manages a single wizard form
 */
class WizardController {
  /** @type {HTMLFormElement} */
  #form;

  /** @type {HTMLFieldSetElement[]} */
  #steps = [];

  /** @type {number} */
  #currentIndex = 0;

  /** @type {HTMLProgressElement|null} */
  #progress = null;

  /** @type {HTMLElement|null} */
  #statusRegion = null;

  /** @type {HTMLElement|null} */
  #stepNav = null;

  /** @type {boolean} */
  #useHistory = false;

  /** @type {string} */
  #validateMode = 'step';

  /** @type {''|'session'|'local'} */
  #persist = '';

  /** @type {number} */
  #persistMaxAge = DEFAULT_PERSIST_HOURS * 3600_000;

  /** @type {boolean} */
  #restoring = false;

  /** @type {number} */
  #conditionRafId = 0;

  /** @type {number} */
  #saveRafId = 0;

  /** @type {AbortController} */
  #windowListeners = new AbortController();

  /**
   * @param {HTMLFormElement} form - Form element with data-wizard attribute
   */
  constructor(form) {
    if (!form || !(form instanceof HTMLFormElement)) {
      throw new Error('WizardController requires a form element');
    }

    this.#form = form;
    this.#init();
  }

  /**
   * Initialize the wizard
   */
  #init() {
    this.#steps = Array.from(
      this.#form.querySelectorAll('fieldset[data-wizard-step]')
    );

    if (this.#steps.length === 0) {
      console.warn('Wizard form has no steps');
      return;
    }

    this.#useHistory = this.#form.hasAttribute('data-wizard-history');
    this.#validateMode = this.#form.getAttribute('data-wizard-validate') || 'step';

    this.#initPersistence();

    this.#progress = this.#form.querySelector('[data-wizard-progress]');

    this.#discoverStepNav();
    this.#autoPopulateStepNav();
    this.#createStatusRegion();

    this.#form.setAttribute('data-wizard-enhanced', '');
    this.#form.setAttribute('data-wizard-total', String(this.#steps.length));

    this.#injectAutoNav();
    this.#bindNavigation();
    this.#bindStepNav();

    // Conditional logic (input + change, debounced to one frame)
    const scheduleConditionEval = () => {
      cancelAnimationFrame(this.#conditionRafId);
      this.#conditionRafId = requestAnimationFrame(() => this.#evaluateConditions());
    };
    this.#form.addEventListener('change', scheduleConditionEval);
    this.#form.addEventListener('input', scheduleConditionEval);

    if (this.#persist) {
      this.#form.addEventListener('change', () => this.#scheduleSave());
      this.#form.addEventListener('input', () => this.#scheduleSave());
    }

    // Enter before the last step = Next; submit attempts jump to the
    // first invalid step.
    this.#form.addEventListener('keydown', (e) => this.#handleKeydown(e));
    this.#form.addEventListener('click', (e) => this.#handleSubmitClick(e));
    this.#form.addEventListener('submit', (e) => this.#handleSubmit(e));

    // Native form.reset(): runs after the browser restored the defaults;
    // a cancelled reset runs nothing.
    this.#form.addEventListener('reset', (event) => {
      setTimeout(() => { if (!event.defaultPrevented) this.reset(); }, 0);
    });

    if (this.#useHistory) {
      const stepFromHash = this.#getStepFromHash();
      if (stepFromHash !== null && stepFromHash >= 0 && stepFromHash < this.#steps.length) {
        this.#currentIndex = stepFromHash;
      }

      window.addEventListener('hashchange', () => {
        if (!this.#form.isConnected) { this.#windowListeners.abort(); return; }
        const step = this.#getStepFromHash();
        if (step === null || step === this.#currentIndex) return;
        // A blocked forward move (invalid step) puts the URL back.
        if (!this.#go(step, { push: false })) this.#syncURL(false);
      }, { signal: this.#windowListeners.signal });
    }

    this.#evaluateConditions();

    if (this.#persist) {
      const hashWins = this.#useHistory && this.#getStepFromHash() !== null;
      this.#restoring = true;
      this.#restoreState(hashWins).finally(() => { this.#restoring = false; });
    }
  }

  // ============================================
  // STRINGS
  // ============================================

  /**
   * @param {keyof typeof LABELS} key
   * @param {Record<string, string>} [vars]
   */
  #label(key, vars = {}) {
    const tpl = this.#form.getAttribute(`data-label-${key}`) ?? LABELS[key];
    return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  }

  /** @param {number} n */
  #num(n) {
    try {
      return new Intl.NumberFormat(getLocale(this.#form)).format(n);
    } catch {
      return String(n);
    }
  }

  /**
   * Accessible name of a step: its legend, else "Step N".
   * @param {Element|undefined} step
   * @param {number} visibleIndex
   */
  #stepName(step, visibleIndex) {
    const legend = step?.querySelector(':scope > legend');
    return legend?.textContent?.trim() || this.#label('step', { n: this.#num(visibleIndex + 1) });
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  #initPersistence() {
    const persist = this.#form.getAttribute('data-wizard-persist');
    if (persist === null) return;

    if (!this.#form.id) {
      console.warn('Wizard persistence requires an id on the form element');
      return;
    }

    this.#persist = persist === 'local' ? 'local' : 'session';
    const hours = Number(this.#form.getAttribute('data-wizard-persist-hours'));
    if (hours > 0) this.#persistMaxAge = hours * 3600_000;
  }

  /**
   * Values of every persistable named control, as arrays.
   * @returns {Record<string, string[]>}
   */
  #collect() {
    /** @type {Record<string, string[]>} */
    const data = {};
    for (const el of this.#form.elements) {
      const name = controlName(el);
      if (!name || !isPersistable(el)) continue;
      (data[name] ??= []).push(...controlValues(el));
    }
    return data;
  }

  #saveState() {
    if (!this.#persist || this.#restoring) return;
    const record = {
      step: this.#currentIndex,
      data: this.#collect(),
      session: this.#persist === 'session' ? sessionId() : null,
    };
    VBStore.set(STORE_NS, this.#form.id, record).catch(() => { /* storage full/unavailable */ });
  }

  #scheduleSave() {
    if (!this.#persist) return;
    cancelAnimationFrame(this.#saveRafId);
    this.#saveRafId = requestAnimationFrame(() => this.#saveState());
  }

  /**
   * Restore step and field values; fires wizard:restore when anything was
   * restored.
   * @param {boolean} keepStep - the URL hash already chose the step
   */
  async #restoreState(keepStep) {
    let saved;
    try {
      saved = await VBStore.get(STORE_NS, this.#form.id, { maxAge: this.#persistMaxAge });
    } catch {
      return;
    }
    if (!saved || typeof saved !== 'object') return;
    const record = /** @type {{ step?: unknown, data?: Record<string, unknown>, session?: string|null }} */ (saved);
    if (this.#persist === 'session' && record.session !== sessionId()) {
      VBStore.remove(STORE_NS, this.#form.id).catch(() => {});
      return;
    }

    const restored = this.#applyValues(record.data && typeof record.data === 'object' ? record.data : {});

    if (!keepStep && typeof record.step === 'number' && record.step >= 0 && record.step < this.#steps.length) {
      this.#currentIndex = record.step;
    }
    this.#evaluateConditions();

    this.#dispatchEvent('wizard:restore', { step: this.#currentIndex, fields: restored });
  }

  /**
   * Write stored values into the form. Skips controls the filter rejects,
   * read-only controls and author-disabled controls.
   * @param {Record<string, unknown>} data
   * @returns {string[]} names that were restored
   */
  #applyValues(data) {
    /** @type {Set<string>} */
    const names = new Set();
    /** @type {Map<string, number>} */
    const cursor = new Map();
    /** @type {Element[]} */
    const touched = [];

    for (const el of this.#form.elements) {
      const name = controlName(el);
      if (!name || !Object.hasOwn(data, name) || !isPersistable(el)) continue;
      if (el.hasAttribute('readonly')) continue;
      if (el.hasAttribute('disabled') && !el.hasAttribute(DISABLED_MARK)) continue;

      const raw = data[name];
      const values = (Array.isArray(raw) ? raw : [raw]).map(String);
      const anyEl = /** @type {any} */ (el);

      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        el.checked = values.includes(el.value || 'on');
      } else if (el instanceof HTMLSelectElement && el.multiple) {
        for (const opt of el.options) opt.selected = values.includes(opt.value);
      } else if (Array.isArray(anyEl.value)) {
        anyEl.value = values;
      } else if ('value' in anyEl) {
        // Several text controls sharing a name take the values in order.
        const i = cursor.get(name) ?? 0;
        cursor.set(name, i + 1);
        anyEl.value = values[i] ?? '';
      } else {
        continue;
      }
      names.add(name);
      touched.push(el);
    }

    // Let mirrors (counters, show-when, validation surfaces) catch up.
    for (const el of touched) el.dispatchEvent(new Event('input', { bubbles: true }));
    return [...names];
  }

  #clearState() {
    if (!this.#persist) return;
    // Cancel any pending debounced save — it would re-persist the state
    // this clear is removing (e.g. a field input just before wizardReset())
    cancelAnimationFrame(this.#saveRafId);
    VBStore.remove(STORE_NS, this.#form.id).catch(() => {});
  }

  // ============================================
  // SUBMISSION
  // ============================================

  #isLastStep() {
    return this.#currentIndex >= this.#getVisibleSteps().length - 1;
  }

  /**
   * Enter in a text field: Next before the last step; on the last step,
   * route to the first invalid step if there is one.
   * @param {KeyboardEvent} e
   */
  #handleKeydown(e) {
    if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing) return;
    if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || NON_TEXT_INPUTS.has(target.type)) return;
    if (!this.#isLastStep()) {
      e.preventDefault();
      this.next();
      return;
    }
    if (!this.#form.noValidate && this.#routeToInvalidStep()) e.preventDefault();
  }

  /**
   * Submit-button click: check the whole form first so an invalid control
   * in a hidden (inactive) step is shown instead of failing silently.
   * @param {MouseEvent} e
   */
  #handleSubmitClick(e) {
    const btn = /** @type {Element} */ (e.target)?.closest?.('button, input');
    if (!btn || /** @type {HTMLButtonElement} */ (btn).type !== 'submit') return;
    if (/** @type {HTMLButtonElement} */ (btn).form !== this.#form) return;
    if (this.#form.noValidate || btn.hasAttribute('formnovalidate')) return;
    if (this.#routeToInvalidStep()) e.preventDefault();
  }

  /**
   * If the first invalid control sits in a step other than the active one,
   * go there and report it.
   * @returns {boolean} whether it navigated
   */
  #routeToInvalidStep() {
    const visible = this.#getVisibleSteps();
    for (const el of this.#form.elements) {
      if (el.matches(':disabled')) continue;
      const step = /** @type {HTMLFieldSetElement|null} */ (el.closest('fieldset[data-wizard-step]'));
      if (!step || !visible.includes(step)) continue;
      if (isValid(el)) continue;
      if (step.hasAttribute('data-wizard-active')) return false;
      this.#go(visible.indexOf(step), { validate: false, focus: false });
      report(el);
      return true;
    }
    return false;
  }

  /**
   * @param {SubmitEvent} e
   */
  #handleSubmit(e) {
    // requestSubmit() or a novalidate form submitting early: advance.
    if (!this.#isLastStep()) {
      e.preventDefault();
      this.next();
      return;
    }
    cancelAnimationFrame(this.#saveRafId);
    this.#dispatchEvent('wizard:complete');
    this.#clearState();
  }

  // ============================================
  // STRUCTURE
  // ============================================

  #createStatusRegion() {
    // A cloned wizard carries the original's region; replace it.
    this.#form.querySelectorAll(':scope > [data-wizard-status]').forEach((n) => n.remove());
    const region = document.createElement('p');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('data-wizard-status', '');
    this.#statusRegion = region;
    this.#form.prepend(region);
  }

  #discoverStepNav() {
    const stepsSelector = this.#form.getAttribute('data-wizard-steps');
    if (stepsSelector) {
      this.#stepNav = document.querySelector(stepsSelector);
      return;
    }
    this.#stepNav = this.#form.querySelector('nav.steps');
  }

  #isTracker() {
    return this.#stepNav?.localName === 'progress-tracker';
  }

  /** @returns {HTMLLIElement[]} */
  #navItems() {
    if (!this.#stepNav) return [];
    return /** @type {HTMLLIElement[]} */ ([...this.#stepNav.querySelectorAll(':scope ol > li')]);
  }

  /**
   * Auto-populate the step list from legends when it is empty.
   */
  #autoPopulateStepNav() {
    if (!this.#stepNav) return;

    const ol = this.#stepNav.querySelector('ol');
    if (!ol || ol.children.length > 0) return;

    this.#steps.forEach((step, i) => {
      const li = document.createElement('li');
      li.textContent = this.#stepName(step, i);
      ol.appendChild(li);
    });
  }

  /**
   * Sync the step list: one <li> per step fieldset, in order.
   */
  #syncStepNav() {
    if (!this.#stepNav) return;
    const items = this.#navItems();
    const visibleSteps = this.#getVisibleSteps();

    if (this.#isTracker()) {
      const tracker = this.#stepNav;
      this.#steps.forEach((step, i) => {
        items[i]?.toggleAttribute('hidden', step.hasAttribute('data-wizard-hidden'));
      });
      const abs = this.#steps.indexOf(this.#getCurrentStep());
      const li = items[abs];
      if (li) {
        const id = li.dataset.step || String(abs + 1);
        if (tracker.getAttribute('data-current') !== id) tracker.setAttribute('data-current', id);
      }
      return;
    }

    this.#steps.forEach((step, i) => {
      const navItem = items[i];
      if (!navItem) return;

      navItem.removeAttribute('data-completed');
      navItem.removeAttribute('aria-current');
      navItem.removeAttribute('aria-disabled');

      if (step.hasAttribute('data-wizard-hidden')) {
        navItem.setAttribute('hidden', '');
        return;
      }
      navItem.removeAttribute('hidden');

      const visibleIdx = visibleSteps.indexOf(step);
      const link = navItem.querySelector('a, button');
      const plain = !link;

      if (visibleIdx < this.#currentIndex) {
        navItem.setAttribute('data-completed', '');
        if (plain) navItem.setAttribute('role', 'button');
        (link || navItem).setAttribute('aria-label', this.#label('completed', { name: this.#stepName(step, visibleIdx) }));
      } else {
        if (plain) navItem.removeAttribute('role');
        (link || navItem).removeAttribute('aria-label');
        if (visibleIdx === this.#currentIndex) navItem.setAttribute('aria-current', 'step');
        else navItem.setAttribute('aria-disabled', 'true');
      }
    });

    // Roving tabindex: current step item is tab-focusable, others are not
    for (const item of items) {
      if (item.hasAttribute('hidden')) continue;
      const focusTarget = item.querySelector('a, button') || item;
      focusTarget.setAttribute('tabindex', item.hasAttribute('aria-current') ? '0' : '-1');
    }
  }

  /**
   * Step index (visible) for a nav item, or -1.
   * @param {Element|null} li
   */
  #visibleIndexOfItem(li) {
    if (!li) return -1;
    const i = this.#navItems().indexOf(/** @type {HTMLLIElement} */ (li));
    const step = this.#steps[i];
    return step ? this.#getVisibleSteps().indexOf(step) : -1;
  }

  /**
   * Delegated listeners on the step list: completed items navigate back;
   * arrow keys move focus (roving tabindex). A <progress-tracker> reports
   * clicks through its own event.
   */
  #bindStepNav() {
    const nav = this.#stepNav;
    if (!nav) return;
    const signal = this.#windowListeners.signal;

    if (this.#isTracker()) {
      nav.addEventListener('progress-tracker:step', (e) => {
        const detail = /** @type {CustomEvent} */ (e).detail;
        if (detail?.source !== 'click') return;
        const li = this.#navItems().find((item, i) => (item.dataset.step || String(i + 1)) === String(detail.step));
        const idx = this.#visibleIndexOfItem(li ?? null);
        if (idx >= 0) this.goTo(idx);
      }, { signal });
      return;
    }

    nav.addEventListener('click', (e) => {
      const li = /** @type {Element} */ (e.target).closest('li');
      if (!li || !li.hasAttribute('data-completed')) {
        // Future/current items with links must not jump the hash.
        if (li && /** @type {Element} */ (e.target).closest('a')) e.preventDefault();
        return;
      }
      e.preventDefault();
      const idx = this.#visibleIndexOfItem(li);
      if (idx >= 0) this.goTo(idx);
    }, { signal });

    nav.addEventListener('keydown', (e) => {
      const items = this.#navItems().filter((li) => !li.hasAttribute('hidden'));
      const current = /** @type {Element} */ (e.target).closest('li');
      const currentIdx = current ? items.indexOf(/** @type {HTMLLIElement} */ (current)) : -1;
      if (currentIdx === -1) return;

      if ((e.key === 'Enter' || e.key === ' ') && current?.getAttribute('role') === 'button') {
        e.preventDefault();
        const idx = this.#visibleIndexOfItem(current);
        if (idx >= 0) this.goTo(idx);
        return;
      }

      let nextIdx;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIdx = Math.min(currentIdx + 1, items.length - 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIdx = Math.max(currentIdx - 1, 0);
          break;
        case 'Home':
          nextIdx = 0;
          break;
        case 'End':
          nextIdx = items.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      const currentTarget = items[currentIdx].querySelector('a, button') || items[currentIdx];
      const nextTarget = /** @type {HTMLElement} */ (items[nextIdx].querySelector('a, button') || items[nextIdx]);
      currentTarget.setAttribute('tabindex', '-1');
      nextTarget.setAttribute('tabindex', '0');
      nextTarget.focus();
    }, { signal });
  }

  /**
   * Delegated Back/Next buttons (works for clones and late-added buttons).
   */
  #bindNavigation() {
    this.#form.addEventListener('click', (e) => {
      const btn = /** @type {Element} */ (e.target)?.closest?.('[data-wizard-prev], [data-wizard-next]');
      if (!btn || !this.#form.contains(btn)) return;
      e.preventDefault();
      if (btn.hasAttribute('data-wizard-prev')) this.prev();
      else this.next();
    });
  }

  /**
   * Auto-inject navigation when [data-wizard-nav] is missing
   */
  #injectAutoNav() {
    if (this.#form.querySelector('[data-wizard-nav]')) return;

    const nav = document.createElement('nav');
    nav.setAttribute('data-wizard-nav', '');

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.setAttribute('data-wizard-prev', '');
    prevBtn.textContent = this.#label('back');

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.setAttribute('data-wizard-next', '');
    nextBtn.textContent = this.#label('next');

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = this.#label('submit');

    nav.append(prevBtn, nextBtn, submitBtn);
    this.#form.appendChild(nav);
  }

  // ============================================
  // STATE
  // ============================================

  /**
   * @returns {HTMLFieldSetElement[]}
   */
  #getVisibleSteps() {
    return this.#steps.filter((step) => !step.hasAttribute('data-wizard-hidden'));
  }

  /**
   * @returns {HTMLFieldSetElement}
   */
  #getCurrentStep() {
    return this.#getVisibleSteps()[this.#currentIndex];
  }

  /**
   * Update step visibility and form attributes
   * @param {{ push?: boolean }} [options]
   */
  #updateVisibility({ push = false } = {}) {
    const visibleSteps = this.#getVisibleSteps();
    const currentStep = visibleSteps[this.#currentIndex];

    this.#steps.forEach((step) => {
      step.toggleAttribute('data-wizard-active', step === currentStep);
    });

    this.#form.setAttribute('data-wizard-current', String(this.#currentIndex + 1));
    this.#form.setAttribute('data-wizard-total', String(visibleSteps.length));
    this.#form.toggleAttribute('data-wizard-last', this.#currentIndex === visibleSteps.length - 1);

    this.#syncProgress();
    this.#syncStepNav();
    if (this.#useHistory) this.#syncURL(push);
    this.#announceStep();
    this.#populateSummary();
  }

  #syncProgress() {
    if (!this.#progress) return;
    const visibleSteps = this.#getVisibleSteps();
    this.#progress.max = visibleSteps.length;
    this.#progress.value = this.#currentIndex + 1;
  }

  /**
   * Keep #step=N in the URL. A user step change pushes an entry so the
   * browser Back button steps back; other syncs replace.
   * @param {boolean} push
   */
  #syncURL(push) {
    const newHash = `#step=${this.#currentIndex + 1}`;
    if (window.location.hash === newHash) return;
    if (push) history.pushState(null, '', newHash);
    else history.replaceState(null, '', newHash);
  }

  /**
   * @returns {number|null}
   */
  #getStepFromHash() {
    const match = window.location.hash.match(/step=(\d+)/);
    return match ? parseInt(match[1], 10) - 1 : null;
  }

  #announceStep() {
    if (!this.#statusRegion) return;
    const total = this.#getVisibleSteps().length;
    const text = this.#label('status', {
      current: this.#num(this.#currentIndex + 1),
      total: this.#num(total),
      name: this.#stepName(this.#getCurrentStep(), this.#currentIndex),
    });
    // Re-evaluations on every keystroke must not re-announce.
    if (this.#statusRegion.textContent !== text) this.#statusRegion.textContent = text;
  }

  /**
   * Move focus to the active step's legend (or the step itself).
   */
  #focusStep() {
    const step = this.#getCurrentStep();
    if (!step) return;
    const target = /** @type {HTMLElement} */ (step.querySelector(':scope > legend') || step);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: false });
  }

  /**
   * Should a step change move focus? Only when focus is in the wizard (or
   * its step list) or nowhere — never steal it from elsewhere on the page.
   */
  #ownsFocus() {
    const active = document.activeElement;
    if (!active || active === document.body) return true;
    return this.#form.contains(active) || Boolean(this.#stepNav?.contains(active));
  }

  /**
   * Validate the current step's controls, including form-associated
   * custom elements.
   * @returns {boolean}
   */
  #validateCurrentStep() {
    if (this.#validateMode === 'none') return true;

    const currentStep = this.#getCurrentStep();
    if (!currentStep || currentStep.hasAttribute('data-wizard-optional')) return true;

    for (const el of this.#form.elements) {
      if (!currentStep.contains(el) || el.matches(':disabled')) continue;
      if (!isValid(el)) {
        report(el);
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate data-wizard-if on every step; hidden steps' controls are
   * disabled (and re-enabled when the step returns).
   */
  #evaluateConditions() {
    for (const step of this.#steps) {
      const condition = step.getAttribute('data-wizard-if');
      if (!condition) continue;
      const visible = evaluateCondition(condition, this.#form);
      step.toggleAttribute('data-wizard-hidden', !visible);
      syncSectionControls(step, visible);
    }

    const visibleSteps = this.#getVisibleSteps();
    if (this.#currentIndex >= visibleSteps.length) {
      this.#currentIndex = Math.max(0, visibleSteps.length - 1);
    }

    this.#updateVisibility();
  }

  /**
   * Current value of a named field for display (several values joined).
   * @param {string} name
   */
  #displayValue(name) {
    return readField(this.#form, name).join(', ');
  }

  #populateSummary() {
    const currentStep = this.#getCurrentStep();
    if (!currentStep || !currentStep.hasAttribute('data-wizard-summary')) return;

    // Manual mode: populate elements with data-wizard-field
    const fieldEls = currentStep.querySelectorAll('[data-wizard-field]');
    if (fieldEls.length > 0) {
      for (const el of fieldEls) {
        el.textContent = this.#displayValue(el.getAttribute('data-wizard-field') || '') || '—';
      }
      return;
    }

    // Auto mode: a <dl> from every named control in the other visible steps
    let dl = currentStep.querySelector('[data-wizard-summary-list]');
    if (!dl) {
      dl = document.createElement('dl');
      dl.setAttribute('data-wizard-summary-list', '');
      currentStep.appendChild(dl);
    }
    dl.replaceChildren();

    const seen = new Set();
    for (const el of this.#form.elements) {
      const step = el.closest('fieldset[data-wizard-step]');
      if (!step || step === currentStep || step.hasAttribute('data-wizard-hidden')) continue;
      if (el instanceof HTMLInputElement && (el.type === 'hidden' || el.type === 'password')) continue;
      if (el instanceof HTMLButtonElement || el instanceof HTMLFieldSetElement || el instanceof HTMLOutputElement) continue;
      const name = controlName(el);
      if (!name || seen.has(name)) continue;
      seen.add(name);

      const value = this.#displayValue(name);
      if (!value) continue;

      const dt = document.createElement('dt');
      dt.textContent = this.#findFieldLabel(el) || name;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dl.append(dt, dd);
    }
  }

  /**
   * @param {Element} input
   * @returns {string}
   */
  #findFieldLabel(input) {
    // Checkbox/radio groups: the group's legend names the field
    if (input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio')) {
      const group = input.closest('fieldset:not([data-wizard-step])');
      const legend = group?.querySelector(':scope > legend');
      if (legend) return legend.textContent.trim();
    }

    const labels = /** @type {any} */ (input).labels;
    if (labels?.length) {
      const clone = /** @type {HTMLElement} */ (labels[0].cloneNode(true));
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const text = clone.textContent.trim();
      if (text) return text;
    }

    const formField = input.closest('form-field');
    const label = formField?.querySelector('label');
    if (label) return label.textContent.trim();

    return input.getAttribute('aria-label') || '';
  }

  /**
   * @param {string} eventName
   * @param {object} detail
   */
  #dispatchEvent(eventName, detail = {}) {
    this.#form.dispatchEvent(new CustomEvent(eventName, { bubbles: true, detail }));
  }

  /**
   * Move to a visible step.
   * @param {number} index
   * @param {{ validate?: boolean, focus?: boolean, push?: boolean }} [options]
   * @returns {boolean}
   */
  #go(index, { validate = true, focus = true, push = true } = {}) {
    const visibleSteps = this.#getVisibleSteps();
    if (index < 0 || index >= visibleSteps.length) return false;
    if (validate && index > this.#currentIndex && !this.#validateCurrentStep()) return false;

    const moveFocus = focus && this.#ownsFocus();
    const fromIndex = this.#currentIndex;
    this.#currentIndex = index;
    this.#updateVisibility({ push });
    if (moveFocus && index !== fromIndex) this.#focusStep();

    this.#dispatchEvent('wizard:step-change', { from: fromIndex, to: index });
    this.#scheduleSave();
    return true;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Go to a specific step (validates the current step when moving forward)
   * @param {number} index - Zero-based index among visible steps
   * @returns {boolean} - Whether the navigation was successful
   */
  goTo(index) {
    return this.#go(index);
  }

  /**
   * Advance to the next step
   * @returns {boolean}
   */
  next() {
    if (this.#isLastStep()) return false;
    return this.#go(this.#currentIndex + 1);
  }

  /**
   * Go back to the previous step
   * @returns {boolean}
   */
  prev() {
    if (this.#currentIndex <= 0) return false;
    return this.#go(this.#currentIndex - 1);
  }

  /**
   * Reset the wizard to the first step and clear persisted state
   */
  reset() {
    this.#currentIndex = 0;
    this.#evaluateConditions();
    this.#clearState();
    this.#dispatchEvent('wizard:reset');
  }

  /** @returns {number} current step index (zero-based, among visible steps) */
  get currentStep() {
    return this.#currentIndex;
  }

  /** @returns {number} number of visible steps */
  get totalSteps() {
    return this.#getVisibleSteps().length;
  }

  /** @returns {HTMLFormElement} */
  get form() {
    return this.#form;
  }
}

/**
 * Enhance a single wizard form. The guard is the controller property, not
 * the data-wizard-enhanced attribute, so a cloned wizard (which copies the
 * attribute but not the property) is wired.
 * @param {Element} node
 */
function enhanceWizardForm(node) {
  if (!(node instanceof HTMLFormElement)) return;
  const form = /** @type {VBWizardForm} */ (node);
  const existing = /** @type {any} */ (form).wizardController;
  if (existing instanceof WizardController && existing.form === form) return;

  const controller = new WizardController(form);
  /** @type {any} */ (form).wizardController = controller;
  form.wizardGoTo = (index) => controller.goTo(index);
  form.wizardNext = () => controller.next();
  form.wizardPrev = () => controller.prev();
  form.wizardReset = () => controller.reset();
}

/**
 * Initialise every wizard form in the document.
 */
function initWizards() {
  document.querySelectorAll('form[data-wizard]').forEach(enhanceWizardForm);
}

if (typeof document !== 'undefined') {
  registerInit('form[data-wizard]', enhanceWizardForm);
}

export { WizardController, initWizards };
