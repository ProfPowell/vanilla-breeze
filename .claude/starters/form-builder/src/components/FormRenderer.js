/**
 * Form Renderer Component
 * Renders forms from JSON schema with validation and submission handling
 * @module components/FormRenderer
 */

import { FieldFactory } from './FieldFactory.js';
import { validateField, validateForm } from '../lib/validation.js';
import { evaluateCondition } from '../lib/conditions.js';

/**
 * @typedef {Object} FormSchema
 * @property {string} id - Unique form identifier
 * @property {string} title - Form title
 * @property {string} [description] - Form description
 * @property {Array<FieldSchema>} fields - Form fields
 * @property {Array<StepSchema>} [steps] - Multi-step configuration
 * @property {string} [submitButton] - Submit button text
 * @property {string} [successMessage] - Success message after submission
 */

/**
 * @typedef {Object} FormRendererOptions
 * @property {Object} storage - Storage adapter
 * @property {Function} onSubmit - Submit callback
 * @property {Function} onError - Error callback
 */

export class FormRenderer {
  /**
   * @param {FormSchema} schema - Form schema
   * @param {FormRendererOptions} options - Renderer options
   */
  constructor(schema, options = {}) {
    this.schema = schema;
    this.options = options;
    this.formData = {};
    this.errors = {};
    this.currentStep = 0;
    this.fieldElements = new Map();
  }

  /**
   * Render the complete form
   * @returns {HTMLElement}
   */
  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-wrapper';

    // Header
    const header = document.createElement('header');
    header.className = 'form-header';
    header.innerHTML = `
      <h1>${this.schema.title}</h1>
      ${this.schema.description ? `<p>${this.schema.description}</p>` : ''}
    `;
    wrapper.appendChild(header);

    // Form element
    this.form = document.createElement('form');
    this.form.className = 'form';
    this.form.setAttribute('novalidate', '');
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Render fields or steps
    if (this.schema.steps) {
      this.renderSteps();
    } else {
      this.renderFields(this.schema.fields);
    }

    // Submit button
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    if (this.schema.steps) {
      actions.innerHTML = `
        <button type="button" class="btn btn--secondary" data-action="prev" hidden>Previous</button>
        <button type="button" class="btn btn--primary" data-action="next">Next</button>
        <button type="submit" class="btn btn--primary" hidden>${this.schema.submitButton || 'Submit'}</button>
      `;
      this.setupStepNavigation(actions);
    } else {
      actions.innerHTML = `
        <button type="submit" class="btn btn--primary">${this.schema.submitButton || 'Submit'}</button>
      `;
    }

    this.form.appendChild(actions);
    wrapper.appendChild(this.form);

    return wrapper;
  }

  /**
   * Render form fields
   * @param {Array<FieldSchema>} fields - Field schemas
   * @param {HTMLElement} [container] - Container element
   */
  renderFields(fields, container = this.form) {
    fields.forEach(field => {
      const fieldElement = FieldFactory.create(field, {
        onChange: (name, value) => this.handleFieldChange(name, value),
        onBlur: (name) => this.handleFieldBlur(name)
      });

      this.fieldElements.set(field.name, fieldElement);

      // Check initial visibility
      if (field.showWhen) {
        this.updateFieldVisibility(field);
      }

      container.appendChild(fieldElement);
    });
  }

  /**
   * Render multi-step form
   */
  renderSteps() {
    // Progress indicator
    const progress = document.createElement('div');
    progress.className = 'form-progress';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', this.schema.steps.length.toString());
    progress.innerHTML = this.schema.steps.map((step, i) => `
      <div class="progress-step ${i === 0 ? 'progress-step--active' : ''}" data-step="${i}">
        <span class="progress-step-number">${i + 1}</span>
        <span class="progress-step-title">${step.title}</span>
      </div>
    `).join('');
    this.form.appendChild(progress);

    // Step containers
    this.schema.steps.forEach((step, index) => {
      const stepContainer = document.createElement('fieldset');
      stepContainer.className = 'form-step';
      stepContainer.dataset.step = index.toString();
      stepContainer.hidden = index !== 0;

      const legend = document.createElement('legend');
      legend.textContent = step.title;
      stepContainer.appendChild(legend);

      if (step.summary) {
        // Summary step - shows all collected data
        stepContainer.innerHTML += '<div class="form-summary" id="form-summary"></div>';
      } else {
        // Get fields for this step
        const stepFields = this.schema.fields.filter(f =>
          step.fields.includes(f.name)
        );
        this.renderFields(stepFields, stepContainer);
      }

      this.form.appendChild(stepContainer);
    });
  }

  /**
   * Setup step navigation buttons
   * @param {HTMLElement} actions - Actions container
   */
  setupStepNavigation(actions) {
    const prevBtn = actions.querySelector('[data-action="prev"]');
    const nextBtn = actions.querySelector('[data-action="next"]');
    const submitBtn = actions.querySelector('[type="submit"]');

    prevBtn.addEventListener('click', () => this.goToStep(this.currentStep - 1));
    nextBtn.addEventListener('click', () => {
      if (this.validateCurrentStep()) {
        this.goToStep(this.currentStep + 1);
      }
    });

    this.updateStepButtons = () => {
      const isFirst = this.currentStep === 0;
      const isLast = this.currentStep === this.schema.steps.length - 1;

      prevBtn.hidden = isFirst;
      nextBtn.hidden = isLast;
      submitBtn.hidden = !isLast;
    };
  }

  /**
   * Navigate to a specific step
   * @param {number} step - Step index
   */
  goToStep(step) {
    if (step < 0 || step >= this.schema.steps.length) return;

    // Hide current step
    const currentStepEl = this.form.querySelector(`[data-step="${this.currentStep}"]`);
    if (currentStepEl) currentStepEl.hidden = true;

    // Show new step
    const newStepEl = this.form.querySelector(`[data-step="${step}"]`);
    if (newStepEl) {
      newStepEl.hidden = false;

      // Update summary if applicable
      if (this.schema.steps[step].summary) {
        this.renderSummary();
      }
    }

    // Update progress
    this.form.querySelectorAll('.progress-step').forEach((el, i) => {
      el.classList.toggle('progress-step--active', i === step);
      el.classList.toggle('progress-step--completed', i < step);
    });

    this.currentStep = step;
    this.updateStepButtons?.();
  }

  /**
   * Validate current step fields
   * @returns {boolean}
   */
  validateCurrentStep() {
    const step = this.schema.steps[this.currentStep];
    const stepFields = this.schema.fields.filter(f => step.fields.includes(f.name));

    let isValid = true;
    stepFields.forEach(field => {
      const error = validateField(field, this.formData[field.name]);
      if (error) {
        this.showFieldError(field.name, error);
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Render form summary
   */
  renderSummary() {
    const summary = this.form.querySelector('#form-summary');
    if (!summary) return;

    const items = this.schema.fields
      .filter(f => this.formData[f.name] !== undefined)
      .map(field => {
        let value = this.formData[field.name];

        // Format value for display
        if (Array.isArray(value)) {
          value = value.join(', ');
        } else if (typeof value === 'boolean') {
          value = value ? 'Yes' : 'No';
        }

        return `
          <div class="summary-item">
            <dt>${field.label}</dt>
            <dd>${value || '<em>Not provided</em>'}</dd>
          </div>
        `;
      }).join('');

    summary.innerHTML = `<dl class="summary-list">${items}</dl>`;
  }

  /**
   * Handle field value change
   * @param {string} name - Field name
   * @param {*} value - New value
   */
  handleFieldChange(name, value) {
    this.formData[name] = value;

    // Clear error on change
    this.clearFieldError(name);

    // Update conditional fields
    this.schema.fields.forEach(field => {
      if (field.showWhen) {
        this.updateFieldVisibility(field);
      }
    });
  }

  /**
   * Handle field blur (validate on blur)
   * @param {string} name - Field name
   */
  handleFieldBlur(name) {
    const field = this.schema.fields.find(f => f.name === name);
    if (!field) return;

    const error = validateField(field, this.formData[name]);
    if (error) {
      this.showFieldError(name, error);
    }
  }

  /**
   * Update field visibility based on conditions
   * @param {FieldSchema} field - Field schema with showWhen
   */
  updateFieldVisibility(field) {
    const element = this.fieldElements.get(field.name);
    if (!element) return;

    const isVisible = evaluateCondition(field.showWhen, this.formData);
    element.hidden = !isVisible;

    // Also toggle required if hidden
    const input = element.querySelector('input, select, textarea');
    if (input) {
      if (isVisible && field.required) {
        input.setAttribute('required', '');
      } else {
        input.removeAttribute('required');
      }
    }
  }

  /**
   * Show field error
   * @param {string} name - Field name
   * @param {string} message - Error message
   */
  showFieldError(name, message) {
    this.errors[name] = message;
    const element = this.fieldElements.get(name);
    if (!element) return;

    element.classList.add('field--error');

    const errorEl = element.querySelector('.field-error') || document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = message;

    if (!element.querySelector('.field-error')) {
      element.appendChild(errorEl);
    }

    // Set aria-invalid
    const input = element.querySelector('input, select, textarea');
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `${name}-error`);
      errorEl.id = `${name}-error`;
    }
  }

  /**
   * Clear field error
   * @param {string} name - Field name
   */
  clearFieldError(name) {
    delete this.errors[name];
    const element = this.fieldElements.get(name);
    if (!element) return;

    element.classList.remove('field--error');
    element.querySelector('.field-error')?.remove();

    const input = element.querySelector('input, select, textarea');
    if (input) {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Submit event
   */
  async handleSubmit(event) {
    event.preventDefault();

    // Validate all fields
    const validationResult = validateForm(this.schema, this.formData);
    if (!validationResult.valid) {
      Object.entries(validationResult.errors).forEach(([name, message]) => {
        this.showFieldError(name, message);
      });

      // Focus first error field
      const firstError = Object.keys(validationResult.errors)[0];
      this.fieldElements.get(firstError)?.querySelector('input, select, textarea')?.focus();
      return;
    }

    // Submit form
    try {
      const submitBtn = this.form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      // Store response
      await this.options.storage?.save(this.schema.id, {
        ...this.formData,
        submittedAt: new Date().toISOString()
      });

      // Call success callback
      this.options.onSubmit?.(this.formData, this.schema);
    } catch (error) {
      this.options.onError?.(error, this.schema);

      const submitBtn = this.form.querySelector('[type="submit"]');
      submitBtn.disabled = false;
      submitBtn.textContent = this.schema.submitButton || 'Submit';
    }
  }
}