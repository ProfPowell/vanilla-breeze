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

  /** @type {HTMLElement|null} */
  #stepNav = null;

  /** @type {boolean} */
  #useHistory = false;

  /** @type {string} */
  #validateMode = 'step';

  /** @type {Storage|null} */
  #storage = null;

  /** @type {string} */
  #storageKey = '';

  /** @type {number} */
  #conditionRafId = 0;

  /** @type {number} */
  #saveRafId = 0;

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

    // Read configuration attributes
    this.#useHistory = this.#form.hasAttribute('data-wizard-history');
    this.#validateMode = this.#form.getAttribute('data-wizard-validate') || 'step';

    // Set up persistence
    this.#initPersistence();

    // Find progress element
    this.#progress = this.#form.querySelector('[data-wizard-progress]');

    // Discover nav.steps element for visual step indicator sync
    this.#discoverStepNav();

    // Auto-populate step nav items from legends if nav is empty
    this.#autoPopulateStepNav();

    // Create status region for screen readers
    this.#createStatusRegion();

    // Mark form as enhanced
    this.#form.setAttribute('data-wizard-enhanced', '');
    this.#form.setAttribute('data-wizard-total', String(this.#steps.length));

    // Auto-inject navigation if missing
    this.#injectAutoNav();

    // Bind navigation buttons
    this.#bindNavigation();

    // Keyboard navigation in step indicator
    this.#bindKeyboardNav();

    // Bind form field changes for conditional logic (input + change, debounced)
    const scheduleConditionEval = () => {
      cancelAnimationFrame(this.#conditionRafId);
      this.#conditionRafId = requestAnimationFrame(() => this.#evaluateConditions());
    };
    this.#form.addEventListener('change', scheduleConditionEval);
    this.#form.addEventListener('input', scheduleConditionEval);

    // Save state on field changes (debounced)
    if (this.#storage) {
      this.#form.addEventListener('change', () => this.#scheduleSave());
      this.#form.addEventListener('input', () => this.#scheduleSave());
    }

    // Handle form submit — fire wizard:complete on last step
    this.#form.addEventListener('submit', (e) => this.#handleSubmit(e));

    // Handle native form.reset()
    this.#form.addEventListener('reset', () => {
      requestAnimationFrame(() => this.reset());
    });

    // Hash sync (opt-in via data-wizard-history)
    if (this.#useHistory) {
      const stepFromHash = this.#getStepFromHash();
      if (stepFromHash !== null && stepFromHash >= 0 && stepFromHash < this.#steps.length) {
        this.#currentIndex = stepFromHash;
      }

      window.addEventListener('hashchange', () => {
        const step = this.#getStepFromHash();
        if (step !== null && step !== this.#currentIndex) {
          this.goTo(step);
        }
      });
    }

    // Restore persisted state (before updateVisibility)
    this.#restoreState();

    // Initial evaluation of conditions
    this.#evaluateConditions();

    // Show the initial step
    this.#updateVisibility();
  }

  // ============================================
  // PERSISTENCE
  // ============================================

  /**
   * Initialize persistence storage
   */
  #initPersistence() {
    const persist = this.#form.getAttribute('data-wizard-persist');
    if (!persist) return;

    if (!this.#form.id) {
      console.warn('Wizard persistence requires an id on the form element');
      return;
    }

    this.#storageKey = `vb-wizard:${this.#form.id}`;

    if (persist === 'local') {
      this.#storage = localStorage;
    } else {
      this.#storage = sessionStorage;
    }
  }

  /**
   * Save current step and form data to storage
   */
  #saveState() {
    if (!this.#storage) return;

    const data = {};
    const formData = new FormData(this.#form);
    for (const [key, value] of formData.entries()) {
      if (data[key] !== undefined) {
        // Handle multiple values (checkboxes)
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    try {
      this.#storage.setItem(this.#storageKey, JSON.stringify({
        step: this.#currentIndex,
        data,
      }));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }

  /**
   * Schedule a debounced save
   */
  #scheduleSave() {
    if (!this.#storage) return;
    cancelAnimationFrame(this.#saveRafId);
    this.#saveRafId = requestAnimationFrame(() => this.#saveState());
  }

  /**
   * Restore step and form data from storage
   */
  #restoreState() {
    if (!this.#storage) return;

    try {
      const raw = this.#storage.getItem(this.#storageKey);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;

      // Restore form field values
      if (saved.data && typeof saved.data === 'object') {
        for (const [name, value] of Object.entries(saved.data)) {
          const field = this.#form.elements.namedItem(name);
          if (!field) continue;

          if (field instanceof RadioNodeList) {
            field.value = /** @type {string} */ (value);
          } else if (field instanceof HTMLInputElement) {
            if (field.type === 'checkbox') {
              const values = Array.isArray(value) ? value : [value];
              field.checked = values.includes(field.value || 'on');
            } else if (field.type === 'radio') {
              field.checked = field.value === value;
            } else {
              field.value = /** @type {string} */ (value);
            }
          } else if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
            field.value = /** @type {string} */ (value);
          }
        }
      }

      // Restore step index
      if (typeof saved.step === 'number' && saved.step >= 0 && saved.step < this.#steps.length) {
        this.#currentIndex = saved.step;
      }
    } catch {
      // Corrupted data — ignore
    }
  }

  /**
   * Clear persisted state
   */
  #clearState() {
    if (!this.#storage) return;
    this.#storage.removeItem(this.#storageKey);
  }

  // ============================================
  // INTERNALS
  // ============================================

  /**
   * Handle form submit event
   * @param {SubmitEvent} _e
   */
  #handleSubmit(_e) {
    const visibleSteps = this.#getVisibleSteps();
    if (this.#currentIndex === visibleSteps.length - 1) {
      this.#dispatchEvent('wizard:complete');
      this.#clearState();
    }
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
   * Discover a nav.steps element to sync with step changes
   */
  #discoverStepNav() {
    // 1. Explicit selector via data-wizard-steps attribute
    const stepsSelector = this.#form.getAttribute('data-wizard-steps');
    if (stepsSelector) {
      this.#stepNav = document.querySelector(stepsSelector);
      return;
    }

    // 2. Fallback: nav.steps inside the form
    this.#stepNav = this.#form.querySelector('nav.steps');
  }

  /**
   * Auto-populate nav.steps from step legends when the list is empty
   */
  #autoPopulateStepNav() {
    if (!this.#stepNav) return;

    const ol = this.#stepNav.querySelector('ol');
    if (!ol || ol.children.length > 0) return;

    for (const step of this.#steps) {
      const legend = step.querySelector('legend');
      const li = document.createElement('li');
      li.textContent = legend?.textContent || `Step ${this.#steps.indexOf(step) + 1}`;
      ol.appendChild(li);
    }
  }

  /**
   * Sync nav.steps <li> elements with current wizard state
   */
  #syncStepNav() {
    if (!this.#stepNav) return;

    const navItems = Array.from(this.#stepNav.querySelectorAll('ol > li'));
    const visibleSteps = this.#getVisibleSteps();

    // Map each step fieldset to its corresponding nav li by index
    let navIndex = 0;
    for (let i = 0; i < this.#steps.length; i++) {
      const step = this.#steps[i];
      const navItem = navItems[navIndex];
      if (!navItem) break;

      // Sync hidden conditional steps
      if (step.hasAttribute('data-wizard-hidden')) {
        navItem.setAttribute('hidden', '');
        continue;
      } else {
        navItem.removeAttribute('hidden');
      }

      // Determine step state relative to visible index
      const visibleIdx = visibleSteps.indexOf(step);

      // Clear previous state
      navItem.removeAttribute('data-completed');
      navItem.removeAttribute('aria-current');
      navItem.removeAttribute('aria-disabled');

      if (visibleIdx < this.#currentIndex) {
        // Completed — clickable
        navItem.setAttribute('data-completed', '');
        this.#bindNavItemClick(navItem, visibleIdx);
        const link = navItem.querySelector('a');
        if (link) {
          const legend = step.querySelector('legend');
          const stepName = legend?.textContent || `Step ${visibleIdx + 1}`;
          link.setAttribute('aria-label', `Go to ${stepName} (completed)`);
        }
      } else if (visibleIdx === this.#currentIndex) {
        // Active
        navItem.setAttribute('aria-current', 'step');
      } else {
        // Future — not clickable
        navItem.setAttribute('aria-disabled', 'true');
      }

      navIndex++;
    }

    // Roving tabindex: current step item is tab-focusable, others are not
    for (const item of navItems) {
      if (item.hasAttribute('hidden')) continue;
      const focusTarget = item.querySelector('a, button') || item;
      const isCurrent = item.hasAttribute('aria-current');
      /** @type {HTMLElement} */ (focusTarget).setAttribute('tabindex', isCurrent ? '0' : '-1');
    }
  }

  /**
   * Bind click handler on a nav item for step navigation
   * @param {HTMLElement} navItem
   * @param {number} stepIndex
   */
  #bindNavItemClick(navItem, stepIndex) {
    if (navItem.hasAttribute('data-wizard-nav-bound')) return;
    navItem.setAttribute('data-wizard-nav-bound', '');

    const target = navItem.querySelector('a, button') || navItem;

    target.addEventListener('click', (e) => {
      e.preventDefault();
      this.goTo(stepIndex);
    });

    // Keyboard support if the target isn't natively interactive
    if (target === navItem && !navItem.getAttribute('tabindex')) {
      navItem.setAttribute('tabindex', '0');
      navItem.setAttribute('role', 'button');
      navItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.goTo(stepIndex);
        }
      });
    }
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
   * Auto-inject navigation when [data-wizard-nav] is missing
   */
  #injectAutoNav() {
    if (this.#form.querySelector('[data-wizard-nav]')) return;

    const nav = document.createElement('nav');
    nav.setAttribute('data-wizard-nav', '');

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.setAttribute('data-wizard-prev', '');
    prevBtn.textContent = 'Back';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.setAttribute('data-wizard-next', '');
    nextBtn.textContent = 'Next';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Submit';

    nav.append(prevBtn, nextBtn, submitBtn);
    this.#form.appendChild(nav);
  }

  /**
   * Bind arrow-key navigation in the step indicator (roving tabindex)
   */
  #bindKeyboardNav() {
    if (!this.#stepNav) return;

    this.#stepNav.addEventListener('keydown', (e) => {
      const items = Array.from(this.#stepNav.querySelectorAll('ol > li:not([hidden])'));
      const current = /** @type {HTMLElement} */ (e.target).closest('li');
      const currentIdx = items.indexOf(current);
      if (currentIdx === -1) return;

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

      // Update roving tabindex
      const currentTarget = items[currentIdx].querySelector('a, button') || items[currentIdx];
      const nextTarget = items[nextIdx].querySelector('a, button') || items[nextIdx];
      /** @type {HTMLElement} */ (currentTarget).setAttribute('tabindex', '-1');
      /** @type {HTMLElement} */ (nextTarget).setAttribute('tabindex', '0');
      /** @type {HTMLElement} */ (nextTarget).focus();
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

    // Sync nav.steps indicator
    this.#syncStepNav();

    // Update URL hash (opt-in)
    if (this.#useHistory) {
      this.#syncURL();
    }

    // Announce step change
    this.#announceStep();

    // Populate summary step if active
    this.#populateSummary();
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
    // Skip validation if mode is 'none'
    if (this.#validateMode === 'none') return true;

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
      const formControl = /** @type {HTMLInputElement} */ (input);
      if (!formControl.checkValidity()) {
        formControl.reportValidity();
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
   * Evaluate a condition string with optional AND/OR operators
   * Supports compound expressions: "a:x && b:y", "a:x || b:y"
   * AND (&&) has higher precedence than OR (||)
   * @param {string} condition
   * @returns {boolean}
   */
  #evaluateCondition(condition) {
    // Handle OR groups (lower precedence)
    if (condition.includes('||')) {
      return condition.split('||').some(part => this.#evaluateCondition(part.trim()));
    }

    // Handle AND groups (higher precedence)
    if (condition.includes('&&')) {
      return condition.split('&&').every(part => this.#evaluateSingleCondition(part.trim()));
    }

    return this.#evaluateSingleCondition(condition);
  }

  /**
   * Evaluate a single condition token
   * Supports: "fieldName:value", "fieldName:!value", "fieldName", "!fieldName"
   * @param {string} condition
   * @returns {boolean}
   */
  #evaluateSingleCondition(condition) {
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
   * Populate a summary step with form field values
   */
  #populateSummary() {
    const currentStep = this.#getCurrentStep();
    if (!currentStep || !currentStep.hasAttribute('data-wizard-summary')) return;

    // Manual mode: populate elements with data-wizard-field
    const fieldEls = currentStep.querySelectorAll('[data-wizard-field]');
    if (fieldEls.length > 0) {
      for (const el of fieldEls) {
        const fieldName = el.getAttribute('data-wizard-field');
        el.textContent = this.#getFieldValue(fieldName) || '\u2014';
      }
      return;
    }

    // Auto mode: generate a <dl> from all visible step fields
    let dl = currentStep.querySelector('[data-wizard-summary-list]');
    if (!dl) {
      dl = document.createElement('dl');
      dl.setAttribute('data-wizard-summary-list', '');
      currentStep.appendChild(dl);
    }
    dl.innerHTML = '';

    const seen = new Set();
    for (const step of this.#steps) {
      if (step === currentStep || step.hasAttribute('data-wizard-hidden')) continue;

      const inputs = step.querySelectorAll('input, select, textarea');
      for (const input of inputs) {
        const name = /** @type {HTMLInputElement} */ (input).name;
        if (!name || seen.has(name)) continue;
        seen.add(name);

        const value = this.#getFieldValue(name);
        if (!value) continue;

        const label = this.#findFieldLabel(/** @type {HTMLInputElement} */ (input));

        const dt = document.createElement('dt');
        dt.textContent = label || name;
        const dd = document.createElement('dd');
        dd.textContent = value;
        dl.append(dt, dd);
      }
    }
  }

  /**
   * Find the label text for a form field
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} input
   * @returns {string}
   */
  #findFieldLabel(input) {
    // Check for associated label via for attribute
    if (input.id) {
      const label = this.#form.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (label) return label.textContent.trim();
    }

    // Check for wrapping label
    const parentLabel = input.closest('label');
    if (parentLabel) {
      const clone = /** @type {HTMLElement} */ (parentLabel.cloneNode(true));
      clone.querySelectorAll('input, select, textarea').forEach(el => el.remove());
      const text = clone.textContent.trim();
      if (text) return text;
    }

    // Check for form-field custom element with label child
    const formField = input.closest('form-field');
    if (formField) {
      const label = formField.querySelector('label');
      if (label) return label.textContent.trim();
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

    this.#dispatchEvent('wizard:step-change', {
      from: fromIndex,
      to: index,
    });

    this.#scheduleSave();

    return true;
  }

  /**
   * Advance to the next step
   * @returns {boolean} - Whether the navigation was successful
   */
  next() {
    const visibleSteps = this.#getVisibleSteps();

    // On last step, next() is a no-op (submit handles completion)
    if (this.#currentIndex >= visibleSteps.length - 1) {
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
    this.#clearState();

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
 * Enhance a single wizard form
 * @param {HTMLFormElement} form
 */
function enhanceWizardForm(form) {
  if (form.hasAttribute('data-wizard-enhanced')) return;

  const controller = new WizardController(form);

  // Attach controller to form element for external access
  /** @type {VBWizardForm} */ (form).wizardController = controller;

  // Add convenience methods directly to form
  /** @type {VBWizardForm} */ (form).wizardGoTo = (index) => controller.goTo(index);
  /** @type {VBWizardForm} */ (form).wizardNext = () => controller.next();
  /** @type {VBWizardForm} */ (form).wizardPrev = () => controller.prev();
  /** @type {VBWizardForm} */ (form).wizardReset = () => controller.reset();
}

/**
 * Auto-initialize wizards on DOM ready
 */
function initWizards() {
  document.querySelectorAll('form[data-wizard]').forEach((form) => {
    enhanceWizardForm(/** @type {HTMLFormElement} */ (form));
  });
}

/**
 * Watch for dynamically added wizard forms
 */
function observeNewWizards() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = /** @type {Element} */ (node);
        if (el.matches('form[data-wizard]')) {
          enhanceWizardForm(/** @type {HTMLFormElement} */ (el));
        }
        el.querySelectorAll?.('form[data-wizard]:not([data-wizard-enhanced])').forEach((f) => {
          enhanceWizardForm(/** @type {HTMLFormElement} */ (f));
        });
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

// Auto-init when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initWizards();
      observeNewWizards();
    });
  } else {
    initWizards();
    observeNewWizards();
  }
}

// Export for ES modules
export { WizardController, initWizards };
