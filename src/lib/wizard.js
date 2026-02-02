/**
 * Wizard Forms - Progressive enhancement for multi-step forms
 *
 * Transforms forms with [data-wizard] into step-by-step wizards while
 * maintaining full functionality without JavaScript.
 *
 * @example
 * // Auto-initialization happens on DOMContentLoaded
 * // Manual initialization:
 * import { WizardController } from './wizard.js';
 * const wizard = new WizardController(document.querySelector('form[data-wizard]'));
 */

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
    // Gather all step fieldsets
    this.#steps = Array.from(
      this.#form.querySelectorAll('fieldset[data-wizard-step]')
    );

    if (this.#steps.length === 0) {
      console.warn('Wizard form has no steps');
      return;
    }

    // Find progress element
    this.#progress = this.#form.querySelector('[data-wizard-progress]');

    // Create status region for screen readers
    this.#createStatusRegion();

    // Mark form as enhanced
    this.#form.setAttribute('data-wizard-enhanced', '');
    this.#form.setAttribute('data-wizard-total', String(this.#steps.length));

    // Bind navigation buttons
    this.#bindNavigation();

    // Bind form field changes for conditional logic
    this.#form.addEventListener('change', () => this.#evaluateConditions());

    // Check URL hash for initial step
    const stepFromHash = this.#getStepFromHash();
    if (stepFromHash !== null && stepFromHash >= 0 && stepFromHash < this.#steps.length) {
      this.#currentIndex = stepFromHash;
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const step = this.#getStepFromHash();
      if (step !== null && step !== this.#currentIndex) {
        this.goTo(step);
      }
    });

    // Initial evaluation of conditions
    this.#evaluateConditions();

    // Show the initial step
    this.#updateVisibility();
  }

  /**
   * Create a live region for screen reader announcements
   */
  #createStatusRegion() {
    this.#statusRegion = document.createElement('div');
    this.#statusRegion.setAttribute('role', 'status');
    this.#statusRegion.setAttribute('aria-live', 'polite');
    this.#statusRegion.setAttribute('aria-atomic', 'true');
    this.#statusRegion.setAttribute('data-wizard-status', '');
    this.#form.prepend(this.#statusRegion);
  }

  /**
   * Bind click handlers to navigation buttons
   */
  #bindNavigation() {
    const prevBtn = this.#form.querySelector('[data-wizard-prev]');
    const nextBtn = this.#form.querySelector('[data-wizard-next]');

    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.prev();
    });

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.next();
    });
  }

  /**
   * Get visible steps (excluding hidden conditional steps)
   * @returns {HTMLFieldSetElement[]}
   */
  #getVisibleSteps() {
    return this.#steps.filter(
      (step) => !step.hasAttribute('data-wizard-hidden')
    );
  }

  /**
   * Get the current step element
   * @returns {HTMLFieldSetElement}
   */
  #getCurrentStep() {
    return this.#getVisibleSteps()[this.#currentIndex];
  }

  /**
   * Update step visibility and form attributes
   */
  #updateVisibility() {
    const visibleSteps = this.#getVisibleSteps();

    // Update all steps
    this.#steps.forEach((step) => {
      step.removeAttribute('data-wizard-active');
    });

    // Mark current step as active
    const currentStep = visibleSteps[this.#currentIndex];
    if (currentStep) {
      currentStep.setAttribute('data-wizard-active', '');
    }

    // Update form attributes
    const displayIndex = this.#currentIndex + 1;
    this.#form.setAttribute('data-wizard-current', String(displayIndex));
    this.#form.setAttribute('data-wizard-total', String(visibleSteps.length));

    // Update last step indicator
    if (this.#currentIndex === visibleSteps.length - 1) {
      this.#form.setAttribute('data-wizard-last', '');
    } else {
      this.#form.removeAttribute('data-wizard-last');
    }

    // Sync progress element
    this.#syncProgress();

    // Update URL hash
    this.#syncURL();

    // Announce step change
    this.#announceStep();
  }

  /**
   * Sync progress element with current step
   */
  #syncProgress() {
    if (!this.#progress) return;

    const visibleSteps = this.#getVisibleSteps();
    this.#progress.max = visibleSteps.length;
    this.#progress.value = this.#currentIndex + 1;
  }

  /**
   * Update URL hash with current step
   */
  #syncURL() {
    const newHash = `#step=${this.#currentIndex + 1}`;
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  /**
   * Get step index from URL hash
   * @returns {number|null}
   */
  #getStepFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/step=(\d+)/);
    if (match) {
      return parseInt(match[1], 10) - 1;
    }
    return null;
  }

  /**
   * Announce current step to screen readers
   */
  #announceStep() {
    if (!this.#statusRegion) return;

    const currentStep = this.#getCurrentStep();
    const legend = currentStep?.querySelector('legend');
    const stepName = legend?.textContent || `Step ${this.#currentIndex + 1}`;
    const visibleSteps = this.#getVisibleSteps();

    this.#statusRegion.textContent = `Now on step ${this.#currentIndex + 1} of ${visibleSteps.length}: ${stepName}`;
  }

  /**
   * Validate the current step's fields
   * @returns {boolean}
   */
  #validateCurrentStep() {
    const currentStep = this.#getCurrentStep();
    if (!currentStep) return true;

    // Check if step is optional
    if (currentStep.hasAttribute('data-wizard-optional')) {
      return true;
    }

    // Get all form controls in this step
    const inputs = currentStep.querySelectorAll(
      'input, select, textarea'
    );

    let isValid = true;

    for (const input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        isValid = false;
        break;
      }
    }

    return isValid;
  }

  /**
   * Evaluate conditional step visibility
   */
  #evaluateConditions() {
    this.#steps.forEach((step) => {
      const condition = step.getAttribute('data-wizard-if');
      if (!condition) return;

      const isVisible = this.#evaluateCondition(condition);

      if (isVisible) {
        step.removeAttribute('data-wizard-hidden');
      } else {
        step.setAttribute('data-wizard-hidden', '');
      }
    });

    // Recalculate visible steps after condition change
    const visibleSteps = this.#getVisibleSteps();
    if (this.#currentIndex >= visibleSteps.length) {
      this.#currentIndex = Math.max(0, visibleSteps.length - 1);
    }

    this.#updateVisibility();
  }

  /**
   * Evaluate a single condition string
   * Supports: "fieldName:value", "fieldName:!value", "fieldName", "!fieldName"
   * @param {string} condition
   * @returns {boolean}
   */
  #evaluateCondition(condition) {
    // Check for negation
    const isNegated = condition.startsWith('!');
    const cleanCondition = isNegated ? condition.slice(1) : condition;

    // Check for value comparison
    const hasValue = cleanCondition.includes(':');

    if (hasValue) {
      const [fieldName, expectedValue] = cleanCondition.split(':');
      const isNegatedValue = expectedValue.startsWith('!');
      const cleanValue = isNegatedValue ? expectedValue.slice(1) : expectedValue;

      const fieldValue = this.#getFieldValue(fieldName);

      if (isNegatedValue) {
        return fieldValue !== cleanValue;
      }
      return fieldValue === cleanValue;
    }

    // Truthy/falsy check
    const fieldValue = this.#getFieldValue(cleanCondition);
    const isTruthy = Boolean(fieldValue);

    return isNegated ? !isTruthy : isTruthy;
  }

  /**
   * Get the value of a form field by name
   * @param {string} fieldName
   * @returns {string}
   */
  #getFieldValue(fieldName) {
    const field = this.#form.elements.namedItem(fieldName);

    if (!field) return '';

    // Handle radio buttons and checkboxes
    if (field instanceof RadioNodeList) {
      return field.value;
    }

    if (field instanceof HTMLInputElement) {
      if (field.type === 'checkbox') {
        return field.checked ? field.value || 'true' : '';
      }
      return field.value;
    }

    if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
      return field.value;
    }

    return '';
  }

  /**
   * Dispatch a custom event
   * @param {string} eventName
   * @param {object} detail
   */
  #dispatchEvent(eventName, detail = {}) {
    this.#form.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        detail,
      })
    );
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Go to a specific step
   * @param {number} index - Zero-based step index
   * @returns {boolean} - Whether the navigation was successful
   */
  goTo(index) {
    const visibleSteps = this.#getVisibleSteps();

    if (index < 0 || index >= visibleSteps.length) {
      return false;
    }

    // If moving forward, validate current step
    if (index > this.#currentIndex && !this.#validateCurrentStep()) {
      return false;
    }

    const fromIndex = this.#currentIndex;
    this.#currentIndex = index;
    this.#updateVisibility();

    this.#dispatchEvent('wizard:stepchange', {
      from: fromIndex,
      to: index,
    });

    return true;
  }

  /**
   * Advance to the next step
   * @returns {boolean} - Whether the navigation was successful
   */
  next() {
    const visibleSteps = this.#getVisibleSteps();

    if (this.#currentIndex >= visibleSteps.length - 1) {
      // On last step, dispatch complete event
      if (this.#validateCurrentStep()) {
        this.#dispatchEvent('wizard:complete');
      }
      return false;
    }

    return this.goTo(this.#currentIndex + 1);
  }

  /**
   * Go back to the previous step
   * @returns {boolean} - Whether the navigation was successful
   */
  prev() {
    if (this.#currentIndex <= 0) {
      return false;
    }

    return this.goTo(this.#currentIndex - 1);
  }

  /**
   * Reset the wizard to the first step
   */
  reset() {
    this.#currentIndex = 0;
    this.#updateVisibility();

    this.#dispatchEvent('wizard:reset');
  }

  /**
   * Get the current step index (zero-based)
   * @returns {number}
   */
  get currentStep() {
    return this.#currentIndex;
  }

  /**
   * Get the total number of visible steps
   * @returns {number}
   */
  get totalSteps() {
    return this.#getVisibleSteps().length;
  }

  /**
   * Get the form element
   * @returns {HTMLFormElement}
   */
  get form() {
    return this.#form;
  }
}

/**
 * Auto-initialize wizards on DOM ready
 */
function initWizards() {
  const wizardForms = document.querySelectorAll('form[data-wizard]');

  wizardForms.forEach((form) => {
    // Skip if already enhanced
    if (form.hasAttribute('data-wizard-enhanced')) return;

    const controller = new WizardController(form);

    // Attach controller to form element for external access
    form.wizardController = controller;

    // Add convenience methods directly to form
    form.wizardGoTo = (index) => controller.goTo(index);
    form.wizardNext = () => controller.next();
    form.wizardPrev = () => controller.prev();
    form.wizardReset = () => controller.reset();
  });
}

// Auto-init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWizards);
  } else {
    initWizards();
  }
}

// Export for ES modules
export { WizardController, initWizards };
