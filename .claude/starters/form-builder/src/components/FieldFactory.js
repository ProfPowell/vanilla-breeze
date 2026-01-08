/**
 * Field Factory
 * Creates field components from schema definitions
 * @module components/FieldFactory
 */

/**
 * @typedef {Object} FieldSchema
 * @property {string} name - Field name
 * @property {string} type - Field type
 * @property {string} label - Field label
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [required] - Is required
 * @property {Object} [validation] - Validation rules
 * @property {Array} [options] - Options for select/radio/checkbox
 * @property {Object} [showWhen] - Conditional visibility
 */

/**
 * @typedef {Object} FieldOptions
 * @property {Function} onChange - Change callback
 * @property {Function} onBlur - Blur callback
 */

export class FieldFactory {
  /**
   * Create a field element from schema
   * @param {FieldSchema} schema - Field schema
   * @param {FieldOptions} options - Field options
   * @returns {HTMLElement}
   */
  static create(schema, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = `form-field form-field--${schema.type}`;
    wrapper.dataset.field = schema.name;

    switch (schema.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
      case 'password':
      case 'number':
      case 'date':
      case 'time':
        wrapper.appendChild(this.createTextInput(schema, options));
        break;

      case 'textarea':
        wrapper.appendChild(this.createTextarea(schema, options));
        break;

      case 'select':
        wrapper.appendChild(this.createSelect(schema, options));
        break;

      case 'radio':
        wrapper.appendChild(this.createRadioGroup(schema, options));
        break;

      case 'checkbox':
        if (schema.options) {
          wrapper.appendChild(this.createCheckboxGroup(schema, options));
        } else {
          wrapper.appendChild(this.createSingleCheckbox(schema, options));
        }
        break;

      case 'file':
        wrapper.appendChild(this.createFileInput(schema, options));
        break;

      case 'range':
        wrapper.appendChild(this.createRangeInput(schema, options));
        break;

      case 'hidden':
        wrapper.appendChild(this.createHiddenInput(schema));
        wrapper.hidden = true;
        break;

      default:
        console.warn(`Unknown field type: ${schema.type}`);
        wrapper.appendChild(this.createTextInput({ ...schema, type: 'text' }, options));
    }

    return wrapper;
  }

  /**
   * Create text-like input (text, email, tel, etc.)
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createTextInput(schema, options) {
    const container = document.createElement('div');
    container.className = 'field-container';

    const label = this.createLabel(schema);
    container.appendChild(label);

    const input = document.createElement('input');
    input.type = schema.type;
    input.id = schema.name;
    input.name = schema.name;

    if (schema.placeholder) input.placeholder = schema.placeholder;
    if (schema.required) input.required = true;
    if (schema.validation?.minLength) input.minLength = schema.validation.minLength;
    if (schema.validation?.maxLength) input.maxLength = schema.validation.maxLength;
    if (schema.validation?.pattern) input.pattern = schema.validation.pattern;
    if (schema.validation?.min !== undefined) input.min = schema.validation.min;
    if (schema.validation?.max !== undefined) input.max = schema.validation.max;
    if (schema.validation?.step) input.step = schema.validation.step;
    if (schema.autocomplete) input.autocomplete = schema.autocomplete;

    input.addEventListener('input', (e) => options.onChange?.(schema.name, e.target.value));
    input.addEventListener('blur', () => options.onBlur?.(schema.name));

    container.appendChild(input);

    if (schema.hint) {
      container.appendChild(this.createHint(schema));
    }

    return container;
  }

  /**
   * Create textarea
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createTextarea(schema, options) {
    const container = document.createElement('div');
    container.className = 'field-container';

    container.appendChild(this.createLabel(schema));

    const textarea = document.createElement('textarea');
    textarea.id = schema.name;
    textarea.name = schema.name;
    textarea.rows = schema.rows || 4;

    if (schema.placeholder) textarea.placeholder = schema.placeholder;
    if (schema.required) textarea.required = true;
    if (schema.validation?.minLength) textarea.minLength = schema.validation.minLength;
    if (schema.validation?.maxLength) textarea.maxLength = schema.validation.maxLength;

    textarea.addEventListener('input', (e) => options.onChange?.(schema.name, e.target.value));
    textarea.addEventListener('blur', () => options.onBlur?.(schema.name));

    container.appendChild(textarea);

    if (schema.hint) {
      container.appendChild(this.createHint(schema));
    }

    return container;
  }

  /**
   * Create select dropdown
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createSelect(schema, options) {
    const container = document.createElement('div');
    container.className = 'field-container';

    container.appendChild(this.createLabel(schema));

    const select = document.createElement('select');
    select.id = schema.name;
    select.name = schema.name;

    if (schema.required) select.required = true;
    if (schema.multiple) select.multiple = true;

    // Add placeholder option
    if (schema.placeholder) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = schema.placeholder;
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);
    }

    // Add options
    schema.options?.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.disabled) option.disabled = true;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const value = schema.multiple
        ? Array.from(e.target.selectedOptions).map(o => o.value)
        : e.target.value;
      options.onChange?.(schema.name, value);
    });
    select.addEventListener('blur', () => options.onBlur?.(schema.name));

    container.appendChild(select);

    if (schema.hint) {
      container.appendChild(this.createHint(schema));
    }

    return container;
  }

  /**
   * Create radio button group
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createRadioGroup(schema, options) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'field-group';

    const legend = document.createElement('legend');
    legend.textContent = schema.label;
    if (schema.required) {
      legend.innerHTML += ' <span class="required-marker" aria-hidden="true">*</span>';
    }
    fieldset.appendChild(legend);

    const group = document.createElement('div');
    group.className = 'radio-group';
    group.setAttribute('role', 'radiogroup');

    schema.options?.forEach((opt, index) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'radio-option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = schema.name;
      input.id = `${schema.name}-${index}`;
      input.value = opt.value;
      if (schema.required && index === 0) input.required = true;

      input.addEventListener('change', (e) => options.onChange?.(schema.name, e.target.value));

      wrapper.appendChild(input);
      wrapper.appendChild(document.createTextNode(opt.label));
      group.appendChild(wrapper);
    });

    fieldset.appendChild(group);

    if (schema.hint) {
      fieldset.appendChild(this.createHint(schema));
    }

    return fieldset;
  }

  /**
   * Create checkbox group
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createCheckboxGroup(schema, options) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'field-group';

    const legend = document.createElement('legend');
    legend.textContent = schema.label;
    fieldset.appendChild(legend);

    const group = document.createElement('div');
    group.className = 'checkbox-group';

    const selectedValues = new Set();

    schema.options?.forEach((opt, index) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'checkbox-option';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = `${schema.name}[]`;
      input.id = `${schema.name}-${index}`;
      input.value = opt.value;

      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          selectedValues.add(e.target.value);
        } else {
          selectedValues.delete(e.target.value);
        }
        options.onChange?.(schema.name, Array.from(selectedValues));
      });

      wrapper.appendChild(input);
      wrapper.appendChild(document.createTextNode(opt.label));
      group.appendChild(wrapper);
    });

    fieldset.appendChild(group);

    if (schema.hint) {
      fieldset.appendChild(this.createHint(schema));
    }

    return fieldset;
  }

  /**
   * Create single checkbox
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createSingleCheckbox(schema, options) {
    const container = document.createElement('div');
    container.className = 'field-container field-container--checkbox';

    const wrapper = document.createElement('label');
    wrapper.className = 'checkbox-single';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = schema.name;
    input.name = schema.name;
    if (schema.required) input.required = true;

    input.addEventListener('change', (e) => options.onChange?.(schema.name, e.target.checked));

    wrapper.appendChild(input);
    wrapper.appendChild(document.createTextNode(schema.label));
    container.appendChild(wrapper);

    if (schema.hint) {
      container.appendChild(this.createHint(schema));
    }

    return container;
  }

  /**
   * Create file input
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createFileInput(schema, options) {
    const container = document.createElement('div');
    container.className = 'field-container';

    container.appendChild(this.createLabel(schema));

    const input = document.createElement('input');
    input.type = 'file';
    input.id = schema.name;
    input.name = schema.name;

    if (schema.required) input.required = true;
    if (schema.accept) input.accept = schema.accept;
    if (schema.multiple) input.multiple = true;

    input.addEventListener('change', (e) => {
      const files = e.target.multiple ? Array.from(e.target.files) : e.target.files[0];
      options.onChange?.(schema.name, files);
    });

    container.appendChild(input);

    if (schema.hint) {
      container.appendChild(this.createHint(schema));
    }

    return container;
  }

  /**
   * Create range slider
   * @param {FieldSchema} schema
   * @param {FieldOptions} options
   * @returns {HTMLElement}
   */
  static createRangeInput(schema, options) {
    const container = document.createElement('div');
    container.className = 'field-container';

    container.appendChild(this.createLabel(schema));

    const wrapper = document.createElement('div');
    wrapper.className = 'range-wrapper';

    const input = document.createElement('input');
    input.type = 'range';
    input.id = schema.name;
    input.name = schema.name;
    input.min = schema.validation?.min ?? 0;
    input.max = schema.validation?.max ?? 100;
    input.step = schema.validation?.step ?? 1;
    input.value = schema.defaultValue ?? input.min;

    const output = document.createElement('output');
    output.htmlFor = schema.name;
    output.textContent = input.value;

    input.addEventListener('input', (e) => {
      output.textContent = e.target.value;
      options.onChange?.(schema.name, Number(e.target.value));
    });

    wrapper.appendChild(input);
    wrapper.appendChild(output);
    container.appendChild(wrapper);

    if (schema.hint) {
      container.appendChild(this.createHint(schema));
    }

    return container;
  }

  /**
   * Create hidden input
   * @param {FieldSchema} schema
   * @returns {HTMLElement}
   */
  static createHiddenInput(schema) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.id = schema.name;
    input.name = schema.name;
    input.value = schema.value || '';
    return input;
  }

  /**
   * Create label element
   * @param {FieldSchema} schema
   * @returns {HTMLElement}
   */
  static createLabel(schema) {
    const label = document.createElement('label');
    label.htmlFor = schema.name;
    label.className = 'field-label';
    label.textContent = schema.label;

    if (schema.required) {
      const marker = document.createElement('span');
      marker.className = 'required-marker';
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = ' *';
      label.appendChild(marker);
    }

    return label;
  }

  /**
   * Create hint text
   * @param {FieldSchema} schema
   * @returns {HTMLElement}
   */
  static createHint(schema) {
    const hint = document.createElement('div');
    hint.className = 'field-hint';
    hint.id = `${schema.name}-hint`;
    hint.textContent = schema.hint;
    return hint;
  }
}