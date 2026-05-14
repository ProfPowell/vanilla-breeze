/**
 * progress-tracker: Multi-step progress bar for wizards / checkout / onboarding.
 *
 * Distinct from `<slide-accept>` (slide-to-confirm UX). progress-tracker is
 * for non-accept multi-step progress where the user moves between steps and
 * may return to completed ones. Presentational: emits `progress-tracker:step`
 * when the current step changes (programmatically via attr or by clicking a
 * step). Authors own form state; this component just renders + announces
 * progress.
 *
 * Author authors `<li data-step>` children inside the component:
 *
 * ```html
 * <progress-tracker data-current="2">
 *   <li data-step="1">Account</li>
 *   <li data-step="2">Profile</li>
 *   <li data-step="3">Preferences</li>
 *   <li data-step="4">Confirm</li>
 * </progress-tracker>
 * ```
 *
 * Each step gets `data-status="complete|current|upcoming|error"` based on
 * its position relative to data-current (and an explicit data-error on the
 * step). The component renders the connector line + numbered circle + label.
 *
 * @attr {string|number} data-current   - 1-based index of the active step
 * @attr {boolean}       data-clickable - Allow clicks on completed steps to navigate back
 * @attr {string}        aria-label     - List label (default "Progress")
 *
 * Per-step attributes (on `<li data-step>`):
 *   data-step  (required, stable id; usually 1-based number, can be any string)
 *   data-error (optional, marks this step as errored regardless of position)
 *
 * @fires progress-tracker:step - { step, previousStep, source: 'attr'|'click' }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class ProgressTracker extends VBElement {
  static observedAttributes = ['data-current'];

  #steps = [];   // [{ el, id, label }]
  #suppressNextStepEvent = false; // set when click handler also dispatches manually

  setup() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'list');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Progress');

    this.#scanSteps().forEach((li) => this.#decorateStep(li));
    this.#refresh();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;
    if (name === 'data-current') {
      this.#refresh();
      if (this.#suppressNextStepEvent) {
        this.#suppressNextStepEvent = false;
        return;
      }
      this.dispatchEvent(new CustomEvent('progress-tracker:step', {
        bubbles: true,
        detail: {
          step: this.#currentStepId(),
          previousStep: this.#stepIdAt(oldVal),
          source: 'attr',
        },
      }));
    }
  }

  // ── Scan + decorate ───────────────────────────────────────────────

  #scanSteps() {
    return [...this.querySelectorAll(':scope > li[data-step]')];
  }

  #decorateStep(li) {
    if (li.dataset.decorated === '') return;
    li.dataset.decorated = '';
    li.setAttribute('role', 'listitem');

    // Wrap original label in a span so we can prepend the index circle without
    // disturbing it.
    const labelText = li.textContent;
    li.replaceChildren();

    const circle = document.createElement('span');
    circle.className = 'pt-circle';
    circle.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'pt-label';
    label.textContent = labelText;

    li.append(circle, label);

    if (this.hasAttribute('data-clickable')) {
      li.addEventListener('click', () => this.#onStepClick(li));
      li.style.cursor = 'pointer';
    }
  }

  // ── Refresh: assign data-status + ARIA + circle content ───────────

  #refresh() {
    const steps = this.#scanSteps();
    const currentIdx = this.#currentIndex(steps);

    steps.forEach((li, i) => {
      const errored = li.hasAttribute('data-error');
      let status;
      if (errored) status = 'error';
      else if (i < currentIdx) status = 'complete';
      else if (i === currentIdx) status = 'current';
      else status = 'upcoming';

      li.dataset.status = status;
      li.setAttribute('aria-current', status === 'current' ? 'step' : 'false');

      const circle = li.querySelector(':scope > .pt-circle');
      const label = li.querySelector(':scope > .pt-label')?.textContent || '';
      if (circle) {
        circle.textContent = status === 'complete' ? '✓'
                            : status === 'error'    ? '!'
                            : String(i + 1);
      }

      const ariaLabel = `Step ${i + 1} of ${steps.length}: ${label} (${status})`;
      li.setAttribute('aria-label', ariaLabel);

      // Roving tabindex when clickable: only the current step is in the tab sequence.
      if (this.hasAttribute('data-clickable')) {
        li.setAttribute('tabindex', i === currentIdx ? '0' : '-1');
      } else {
        li.removeAttribute('tabindex');
      }
    });
  }

  #currentIndex(steps) {
    const cur = this.getAttribute('data-current');
    if (cur == null) return 0;
    // data-current may be 1-based numeric ("2") or a step id ("profile").
    const numeric = Number(cur);
    if (Number.isFinite(numeric) && numeric > 0) return Math.min(steps.length - 1, numeric - 1);
    const idMatch = steps.findIndex((li) => li.dataset.step === cur);
    return idMatch === -1 ? 0 : idMatch;
  }

  #currentStepId() {
    const steps = this.#scanSteps();
    return steps[this.#currentIndex(steps)]?.dataset.step ?? null;
  }

  #stepIdAt(rawValue) {
    if (rawValue == null) return null;
    const steps = this.#scanSteps();
    const numeric = Number(rawValue);
    if (Number.isFinite(numeric) && numeric > 0) {
      return steps[Math.min(steps.length - 1, numeric - 1)]?.dataset.step ?? null;
    }
    return steps.find((li) => li.dataset.step === rawValue)?.dataset.step ?? null;
  }

  #onStepClick(li) {
    const id = li.dataset.step;
    if (!id) return;
    const idx = this.#scanSteps().indexOf(li);
    const currentIdx = this.#currentIndex(this.#scanSteps());

    // Only allow clicking on completed steps (going back). Going forward
    // requires the wizard to set data-current after validation.
    if (idx > currentIdx) return;

    const previousStep = this.#currentStepId();
    // Suppress the attr-source event that setAttribute would trigger so we
    // emit one event with source='click' rather than two events.
    this.#suppressNextStepEvent = true;
    this.setAttribute('data-current', id);
    this.dispatchEvent(new CustomEvent('progress-tracker:step', {
      bubbles: true,
      detail: { step: id, previousStep, source: 'click' },
    }));
  }
}

registerComponent('progress-tracker', ProgressTracker);

export { ProgressTracker };
