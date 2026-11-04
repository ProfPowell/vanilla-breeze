/**
 * progress-tracker: Multi-step progress bar for wizards / checkout / onboarding.
 *
 * Distinct from `<slide-accept>` (slide-to-confirm UX). progress-tracker is
 * for non-accept multi-step progress where the user moves between steps and
 * may return to completed ones. Presentational: emits `progress-tracker:step`
 * when the current step changes (programmatically via attr or by activating a
 * completed step). Authors own form state; this component just renders +
 * announces progress.
 *
 * Authors write a native ordered list inside the element, so the steps are
 * a real list (and read as one) before and without JavaScript:
 *
 * ```html
 * <progress-tracker data-current="profile">
 *   <ol>
 *     <li data-step="account">Account</li>
 *     <li data-step="profile">Profile</li>
 *     <li data-step="prefs">Preferences</li>
 *     <li data-step="confirm">Confirm</li>
 *   </ol>
 * </progress-tracker>
 * ```
 *
 * Each step gets `data-status="complete|current|upcoming|error"` based on
 * its position relative to data-current (and an explicit data-error on the
 * step). The component adds a numbered circle and visually hidden status
 * text; the author's label nodes are kept as they are (wrapped, not copied).
 *
 * @attr {string}  data-current        - Step id (matched against data-step first) or 1-based index
 * @attr {boolean} data-clickable      - Completed steps become buttons that navigate back
 * @attr {string}  data-direction      - "vertical" stacks the steps
 * @attr {string}  data-label-list     - List name when the <ol> has none (default "Progress")
 * @attr {string}  data-label-step     - Hidden position prefix, {n}/{total} (default "Step {n} of {total}:")
 * @attr {string}  data-label-complete - Hidden status text (default "(completed)")
 * @attr {string}  data-label-current  - Hidden status text (default "" — aria-current="step" conveys it)
 * @attr {string}  data-label-upcoming - Hidden status text (default "(not started)")
 * @attr {string}  data-label-error    - Hidden status text (default "(error)")
 *
 * Per-step attributes (on `<li>`):
 *   data-step  (stable id; defaults to the 1-based position)
 *   data-error (optional, marks this step as errored regardless of position)
 *
 * @fires progress-tracker:step - { step, previousStep, source: 'attr'|'click' }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const STATUS_DEFAULTS = {
  complete: '(completed)',
  current: '',
  upcoming: '(not started)',
  error: '(error)',
};

class ProgressTracker extends VBElement {
  static observedAttributes = [
    'data-current', 'data-clickable', 'data-label-list', 'data-label-step',
    'data-label-complete', 'data-label-current', 'data-label-upcoming', 'data-label-error',
  ];

  #suppressStepEvent = false;
  /** @type {MutationObserver | null} */
  #observer = null;

  setup() {
    this.listen(this, 'click', (e) => this.#onClick(/** @type {MouseEvent} */ (e)));
    this.#refresh();
    this.#observer = new MutationObserver((records) => {
      // Only author changes matter: steps added/removed (host or list
      // childList) and step attributes. Our own decoration happens inside
      // each <li> and is ignored here.
      const list = this.#list();
      if (records.some((r) => r.type === 'attributes' || r.target === this || r.target === list)) {
        this.#refresh();
      }
    });
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-step', 'data-error'],
    });
  }

  teardown() {
    this.#observer?.disconnect();
    this.#observer = null;
  }

  attributeChangedCallback(/** @type {string} */ name, /** @type {string|null} */ oldVal, /** @type {string|null} */ newVal) {
    // Ignore the attribute replay that precedes the first connect (upgrade).
    if (oldVal === newVal || !this.hasAttribute('data-upgraded')) return;
    this.#refresh();
    if (name !== 'data-current' || this.#suppressStepEvent) return;
    this.dispatchEvent(new CustomEvent('progress-tracker:step', {
      bubbles: true,
      detail: {
        step: this.#currentStepId(),
        previousStep: this.#stepIdAt(oldVal),
        source: 'attr',
      },
    }));
  }

  // ── Structure ─────────────────────────────────────────────────────

  /** @returns {HTMLOListElement | null} */
  #list() {
    return this.querySelector(':scope > ol');
  }

  /** @returns {HTMLLIElement[]} */
  #steps() {
    const list = this.#list();
    return list ? /** @type {HTMLLIElement[]} */ ([...list.children].filter((n) => n.localName === 'li')) : [];
  }

  /**
   * @param {HTMLLIElement} li
   * @param {number} i
   */
  #stepId(li, i) {
    return li.dataset.step || String(i + 1);
  }

  /**
   * Wrap the author's nodes once: circle + .pt-body(position, label, status).
   * Existing markup (links, <small>, icons) is moved, never flattened.
   * @param {HTMLLIElement} li
   */
  #decorate(li) {
    if (li.querySelector(':scope > .pt-circle')) return;
    const label = document.createElement('span');
    label.className = 'pt-label';
    label.append(...li.childNodes);

    const circle = document.createElement('span');
    circle.className = 'pt-circle';
    circle.setAttribute('aria-hidden', 'true');

    const pos = document.createElement('span');
    pos.className = 'pt-sr pt-position';
    const status = document.createElement('span');
    status.className = 'pt-sr pt-status';

    const body = document.createElement('span');
    body.className = 'pt-body';
    body.append(pos, label, status);
    li.append(circle, body);
    li.dataset.decorated = '';
  }

  /**
   * Put the step body inside a native <button> when it can be activated,
   * and back into a plain <span> when it can't.
   * @param {HTMLLIElement} li
   * @param {boolean} actionable
   */
  #setActionable(li, actionable) {
    const body = /** @type {HTMLElement | null} */ (li.querySelector(':scope > .pt-body'));
    if (!body) return;
    // A button can't contain interactive author content (links etc.).
    const hasInteractive = !!body.querySelector('.pt-label :is(a[href], button, input, select, textarea, [tabindex])');
    const want = actionable && !hasInteractive ? 'button' : 'span';
    if (body.localName === want) return;
    const next = document.createElement(want);
    next.className = 'pt-body';
    if (want === 'button') /** @type {HTMLButtonElement} */ (next).type = 'button';
    const hadFocus = body.contains(document.activeElement);
    next.append(...body.childNodes);
    body.replaceWith(next);
    if (hadFocus && want === 'button') next.focus();
  }

  // ── Refresh: assign data-status + hidden text + circle content ────

  #refresh() {
    const list = this.#list();
    if (!list) return;
    if (!list.hasAttribute('aria-label') && !list.hasAttribute('aria-labelledby')) {
      list.setAttribute('aria-label', this.getAttribute('data-label-list') || 'Progress');
    }
    const steps = this.#steps();
    const currentIdx = this.#currentIndex(steps);
    const clickable = this.hasAttribute('data-clickable');
    const stepTpl = this.getAttribute('data-label-step') ?? 'Step {n} of {total}:';

    steps.forEach((li, i) => {
      this.#decorate(li);
      let status;
      if (li.hasAttribute('data-error')) status = 'error';
      else if (i < currentIdx) status = 'complete';
      else if (i === currentIdx) status = 'current';
      else status = 'upcoming';

      li.dataset.status = status;
      if (status === 'current') li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
      // Earlier markup put these on the <li>; the hidden text replaces them.
      li.removeAttribute('aria-label');
      li.removeAttribute('tabindex');

      const circle = li.querySelector(':scope > .pt-circle');
      if (circle) {
        circle.textContent = status === 'complete' ? '✓'
                           : status === 'error'    ? '!'
                           : String(i + 1);
      }
      const pos = li.querySelector('.pt-position');
      if (pos) pos.textContent = stepTpl ? `${fill(stepTpl, i + 1, steps.length)} ` : '';
      const statusEl = li.querySelector('.pt-status');
      if (statusEl) {
        const text = this.getAttribute(`data-label-${status}`) ?? STATUS_DEFAULTS[status];
        statusEl.textContent = text ? ` ${text}` : '';
      }

      this.#setActionable(li, clickable && i < currentIdx);
    });
  }

  /**
   * data-current matches a data-step id first, then a 1-based index.
   * @param {HTMLLIElement[]} steps
   */
  #currentIndex(steps) {
    return this.#indexOf(steps, this.getAttribute('data-current')) ?? 0;
  }

  /**
   * @param {HTMLLIElement[]} steps
   * @param {string | null} raw
   * @returns {number | null}
   */
  #indexOf(steps, raw) {
    if (raw == null || !steps.length) return null;
    const idMatch = steps.findIndex((li, i) => this.#stepId(li, i) === raw);
    if (idMatch !== -1) return idMatch;
    const numeric = Number(raw);
    if (Number.isInteger(numeric) && numeric > 0) return Math.min(steps.length - 1, numeric - 1);
    return null;
  }

  #currentStepId() {
    const steps = this.#steps();
    const i = this.#currentIndex(steps);
    return steps[i] ? this.#stepId(steps[i], i) : null;
  }

  /**
   * @param {string | null} raw
   */
  #stepIdAt(raw) {
    const steps = this.#steps();
    const i = this.#indexOf(steps, raw);
    return i == null ? null : this.#stepId(steps[i], i);
  }

  // ── Activation (delegated) ────────────────────────────────────────

  /**
   * @param {MouseEvent} e
   */
  #onClick(e) {
    if (!this.hasAttribute('data-clickable')) return;
    const li = /** @type {Element} */ (e.target).closest?.('li');
    const steps = this.#steps();
    const idx = li ? steps.indexOf(/** @type {HTMLLIElement} */ (li)) : -1;
    if (idx === -1) return;
    // Author links inside a label keep their own behaviour.
    if (/** @type {Element} */ (e.target).closest('.pt-label a[href]')) return;

    const currentIdx = this.#currentIndex(steps);
    // Only completed steps (going back). Forward needs the wizard to set
    // data-current after validation; the current step is a no-op.
    if (idx >= currentIdx) return;

    const id = this.#stepId(steps[idx], idx);
    const previousStep = this.#currentStepId();
    // One event with source='click' instead of an extra 'attr' one.
    this.#suppressStepEvent = true;
    try {
      this.setAttribute('data-current', id);
    } finally {
      this.#suppressStepEvent = false;
    }
    this.dispatchEvent(new CustomEvent('progress-tracker:step', {
      bubbles: true,
      detail: { step: id, previousStep, source: 'click' },
    }));
  }
}

/**
 * @param {string} tpl
 * @param {number} n
 * @param {number} total
 */
function fill(tpl, n, total) {
  return tpl.replace(/\{n\}/g, String(n)).replace(/\{total\}/g, String(total));
}

registerComponent('progress-tracker', ProgressTracker);

export { ProgressTracker };
