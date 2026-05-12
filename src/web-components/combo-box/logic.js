import { registerComponent } from '../../lib/bundle-registry.js';

/**
 * combo-box: Form-associated autocomplete combobox
 *
 * Light DOM combobox following the W3C ARIA combobox pattern.
 * Participates in native form submission via ElementInternals. Supports
 * single-select (default) and multi-select (`multiple`) modes.
 *
 * Composes <pop-over data-mode="manual"> for the listbox surface. pop-over
 * owns the popover attribute, anchor-name wiring to the input (single) or
 * the tags-input-area (multi), and the display:none cascade re-assertion
 * (popover_display_gotcha). combo-box keeps ARIA, filtering, keyboard
 * navigation, ElementInternals form integration, and tag management.
 *
 * @attr {string} name - Form field name
 * @attr {boolean} required - Makes selection required
 * @attr {string} filter - Filter mode: "startsWith" | "contains" (default: "contains")
 * @attr {string} value - Get/set selected value programmatically (single mode)
 * @attr {string} placeholder - Input placeholder text
 * @attr {boolean} multiple - Enable multi-select tag mode
 * @attr {number} max - Maximum number of tags (multi mode)
 * @attr {boolean} custom - Allow typed entries (multi mode)
 */

import { VBElement } from '../../lib/vb-element.js';
import { setRole } from '../../utils/form-internals.js';
// Ensure <pop-over> is registered — combo-box composes it for its listbox surface.
import '../pop-over/logic.js';

let comboBoxSeq = 0;

class ComboBox extends VBElement {
  static formAssociated = true;

  #internals;
  /** @type {HTMLInputElement} */ #input;
  /** @type {HTMLElement} */ #listbox;
  /** @type {HTMLElement} */ #popover;
  /** @type {Element[]} */ #options = [];
  /** @type {Element[]} */ #filteredOptions = [];
  #activeIndex = -1;
  #isOpen = false;

  // Single mode state
  #selectedValue = '';
  #selectedLabel = '';
  #initialValue = '';

  // Multi mode state
  /** @type {HTMLElement} */ #inputArea;
  /** @type {HTMLElement} */ #liveRegion;
  #selectedTags = []; // { value, label }

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this._adoptInternals(this.#internals);
  }

  get #isMultiple() {
    return this.hasAttribute('multiple');
  }

  setup() {
    this.#input = this.querySelector(':scope > input') ||
                  this.querySelector(':scope > .tags-input-area > input');
    if (!this.#input) return false;

    // Find listbox (may already be wrapped in pop-over from a prior upgrade)
    this.#listbox = this.querySelector('ul, ol');
    if (!this.#listbox) return false;

    // Multi mode: ensure .tags-input-area wrapper exists and input is inside.
    if (this.#isMultiple) {
      this.#inputArea = this.querySelector(':scope > .tags-input-area');
      if (!this.#inputArea) {
        this.#inputArea = document.createElement('div');
        this.#inputArea.className = 'tags-input-area';
        // Insert before the listbox or its pop-over wrapper.
        const beforeNode = this.querySelector(':scope > pop-over[data-combobox-host]') || this.#listbox;
        this.insertBefore(this.#inputArea, beforeNode);
      }
      if (this.#input.parentNode !== this.#inputArea) {
        this.#inputArea.appendChild(this.#input);
      }

      this.#liveRegion = this.querySelector(':scope > [data-combobox-live]');
      if (!this.#liveRegion) {
        this.#liveRegion = document.createElement('div');
        this.#liveRegion.setAttribute('aria-live', 'polite');
        this.#liveRegion.setAttribute('aria-atomic', 'true');
        this.#liveRegion.setAttribute('data-combobox-live', '');
        this.#liveRegion.className = 'visually-hidden';
        this.appendChild(this.#liveRegion);
      }
    }

    const placeholder = this.getAttribute('placeholder');
    if (placeholder && !this.#input.getAttribute('placeholder')) {
      this.#input.setAttribute('placeholder', placeholder);
    }

    const uid = `cb${++comboBoxSeq}`;
    if (!this.#listbox.id) this.#listbox.id = `combobox-listbox-${uid}`;

    // ARIA
    setRole(this.#input, this.#internals, 'combobox');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#input.setAttribute('aria-autocomplete', 'list');
    this.#input.setAttribute('aria-controls', this.#listbox.id);
    this.#input.setAttribute('autocomplete', 'off');

    this.#listbox.setAttribute('role', 'listbox');
    if (this.#isMultiple) this.#listbox.setAttribute('aria-multiselectable', 'true');

    // Compose pop-over: ensure the listbox lives inside a manual-mode
    // pop-over anchored to the visible input/tags area. Configure pop-over
    // attributes BEFORE connecting it so its setup() reads them.
    const anchorEl = this.#isMultiple ? this.#inputArea : this.#input;
    if (!anchorEl.id) anchorEl.id = `combobox-anchor-${uid}`;

    const existing = /** @type {HTMLElement | null} */ (
      this.querySelector(':scope > pop-over[data-combobox-host]'));
    if (existing) {
      this.#popover = existing;
    } else {
      this.#popover = document.createElement('pop-over');
      this.#popover.setAttribute('data-combobox-host', '');
      this.#popover.id = `combobox-pop-${uid}`;
      this.#popover.dataset.mode = 'manual';
      this.#popover.dataset.position = 'bottom-start';
      this.#popover.dataset.anchor = anchorEl.id;
      this.#popover.appendChild(this.#listbox);
      this.appendChild(this.#popover);
    }
    // Idempotent reconfiguration on re-setup.
    this.#popover.dataset.anchor = anchorEl.id;
    if (this.#listbox.parentElement !== this.#popover) {
      this.#popover.appendChild(this.#listbox);
    }

    this.#collectOptions();

    if (!this.#isMultiple) {
      const initialValue = this.getAttribute('value');
      if (initialValue) this.#selectByValue(initialValue, false);
      this.#initialValue = this.#selectedValue;
    }

    this.listen(this.#input, 'input', this.#handleInput);
    this.listen(this.#input, 'keydown', this.#handleKeyDown);
    this.listen(this.#input, 'focus', this.#handleFocus);
    this.listen(this.#input, 'click', this.#handleInputClick);
    this.listen(this.#listbox, 'click', this.#handleOptionClick);
    this.listen(this.#listbox, 'pointerdown', this.#handleOptionPointerDown);
    this.listen(document, 'click', this.#handleOutsideClick);

    // Sync close state if pop-over hides (e.g. external .hide() call).
    this.listen(this.#popover, 'pop-over:hide', this.#handlePopoverHide);

    this.#syncFormValue();
    this.#validate();
    this.#close();
  }

  teardown() {}

  #collectOptions() {
    this.#options = Array.from(this.#listbox.querySelectorAll(':scope > li[data-value]'));
    this.#options.forEach((option, index) => {
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      if (!option.id) option.id = `${this.#listbox.id}-option-${index}`;
    });
    this.#filteredOptions = [...this.#options];
  }

  // --- Multi mode: Tag management ---

  #addTag(value, label) {
    if (this.#selectedTags.some(t => t.value === value)) return;

    const max = this.#getMax();
    if (max && this.#selectedTags.length >= max) return;

    this.#selectedTags.push({ value, label });

    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.dataset.value = value;
    tag.textContent = label + ' ';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.setAttribute('aria-label', `Remove ${label}`);
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.#removeTag(value);
    });
    tag.appendChild(removeBtn);

    this.#inputArea.insertBefore(tag, this.#input);

    const option = this.#options.find(o => o.getAttribute('data-value') === value);
    if (option) option.setAttribute('aria-selected', 'true');

    this.#announce(`${label} added`);

    this.#input.value = '';
    this.#filterOptions('');
    this.#syncFormValue();
    this.#validate();
    this.#fireChange();

    if (max && this.#selectedTags.length >= max) {
      this.#input.disabled = true;
      this.#close();
    }
  }

  #removeTag(value) {
    const index = this.#selectedTags.findIndex(t => t.value === value);
    if (index === -1) return;

    const removed = this.#selectedTags.splice(index, 1)[0];

    const tagEl = this.#inputArea.querySelector(`.tag[data-value="${CSS.escape(value)}"]`);
    if (tagEl) tagEl.remove();

    const option = this.#options.find(o => o.getAttribute('data-value') === value);
    if (option) option.setAttribute('aria-selected', 'false');

    this.#announce(`${removed.label} removed`);

    const max = this.#getMax();
    if (max && this.#input.disabled) this.#input.disabled = false;

    this.#filterOptions(this.#input.value.trim());
    this.#syncFormValue();
    this.#validate();
    this.#fireChange();
    this.#input.focus();
  }

  #getMax() {
    const val = this.getAttribute('max');
    return val ? parseInt(val, 10) : 0;
  }

  #announce(message) {
    if (!this.#liveRegion) return;
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => { this.#liveRegion.textContent = message; });
  }

  // --- Event handlers ---

  #handleInput = () => {
    const query = this.#input.value.trim();

    if (!this.#isMultiple && this.#selectedValue) {
      const prev = this.#listbox.querySelector('[aria-selected="true"]');
      if (prev) prev.setAttribute('aria-selected', 'false');
      this.#selectedValue = '';
      this.#selectedLabel = '';
      this.removeAttribute('value');
      this.#syncFormValue();
      this.#validate();
    }

    this.#filterOptions(query);
    this.#open();
  };

  #handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.#isOpen) this.#open();
        this.#focusOption(this.#activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.#isOpen) this.#open();
        this.#focusOption(this.#activeIndex - 1);
        break;
      case 'Home':
        if (this.#isOpen) { e.preventDefault(); this.#focusOption(0); }
        break;
      case 'End':
        if (this.#isOpen) { e.preventDefault(); this.#focusOption(this.#filteredOptions.length - 1); }
        break;
      case 'Enter':
        e.preventDefault();
        if (this.#isOpen && this.#activeIndex >= 0 && this.#filteredOptions[this.#activeIndex]) {
          const option = this.#filteredOptions[this.#activeIndex];
          if (this.#isMultiple) this.#addTag(option.getAttribute('data-value'), option.textContent.trim());
          else this.#selectOption(option);
        } else if (this.#isMultiple && this.hasAttribute('custom') && this.#input.value.trim()) {
          const text = this.#input.value.trim();
          this.#addTag(text, text);
        }
        break;
      case 'Backspace':
        if (this.#isMultiple && !this.#input.value && this.#selectedTags.length > 0) {
          const lastTag = this.#selectedTags[this.#selectedTags.length - 1];
          this.#removeTag(lastTag.value);
        }
        break;
      case ',':
        if (this.#isMultiple && this.hasAttribute('custom') && this.#input.value.trim()) {
          e.preventDefault();
          const text = this.#input.value.trim();
          this.#addTag(text, text);
        }
        break;
      case 'Escape':
        if (this.#isOpen) {
          e.preventDefault();
          e.stopPropagation();
          this.#close();
          this.#input.focus();
        }
        break;
      case 'Tab':
        if (this.#isOpen) this.#close();
        break;
    }
  };

  #handleFocus = () => {
    if (this.#isMultiple) {
      this.#filterOptions(this.#input.value.trim());
      this.#open();
    } else {
      if (this.#input.value || !this.#selectedValue) {
        this.#filterOptions(this.#input.value.trim());
        this.#open();
      }
    }
  };

  #handleInputClick = () => {
    if (!this.#isOpen) {
      this.#filterOptions(this.#input.value.trim());
      this.#open();
    }
  };

  #handleOptionClick = (e) => {
    const option = e.target.closest('li[data-value]');
    if (option && this.#filteredOptions.includes(option)) {
      if (this.#isMultiple) this.#addTag(option.getAttribute('data-value'), option.textContent.trim());
      else this.#selectOption(option);
    }
  };

  #handleOptionPointerDown = (e) => {
    // Prevent input blur when clicking options
    e.preventDefault();
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) this.#close();
  };

  // --- Filtering ---

  #filterOptions(query) {
    const mode = this.getAttribute('filter') || 'contains';
    const lowerQuery = query.toLowerCase();
    const selectedValues = this.#isMultiple
      ? new Set(this.#selectedTags.map(t => t.value))
      : null;

    this.#filteredOptions = [];

    this.#options.forEach(option => {
      const value = option.getAttribute('data-value');
      const text = option.textContent.trim().toLowerCase();

      if (selectedValues && selectedValues.has(value)) {
        option.hidden = true;
        return;
      }

      let matches;
      if (!query) matches = true;
      else if (mode === 'startsWith') matches = text.startsWith(lowerQuery);
      else matches = text.includes(lowerQuery);

      option.hidden = !matches;
      if (matches) this.#filteredOptions.push(option);
    });

    this.#activeIndex = -1;
    this.#clearActiveDescendant();
    this.setState('no-matches', this.#filteredOptions.length === 0);
  }

  // --- Option navigation ---

  #focusOption(index) {
    if (this.#filteredOptions.length === 0) return;
    if (index < 0) index = this.#filteredOptions.length - 1;
    if (index >= this.#filteredOptions.length) index = 0;

    if (this.#activeIndex >= 0 && this.#filteredOptions[this.#activeIndex]) {
      this.#filteredOptions[this.#activeIndex].removeAttribute('data-active');
    }

    this.#activeIndex = index;
    const option = this.#filteredOptions[index];
    option.setAttribute('data-active', '');
    option.scrollIntoView({ block: 'nearest' });
    this.#input.setAttribute('aria-activedescendant', option.id);
  }

  #clearActiveDescendant() {
    this.#options.forEach(opt => opt.removeAttribute('data-active'));
    this.#input.removeAttribute('aria-activedescendant');
  }

  // --- Selection (single mode) ---

  /** @param {Element} option */
  #selectOption(option, source = 'internal') {
    const value = option.getAttribute('data-value');
    const label = option.textContent.trim();
    if (this.#selectedValue === value) return;

    this.#options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
    option.setAttribute('aria-selected', 'true');
    this.#selectedValue = value;
    this.#selectedLabel = label;
    this.#input.value = label;
    this.setAttribute('value', value);

    this.#syncFormValue();
    this.#validate();
    this.#close();
    this.#input.focus();

    this.dispatchEvent(new CustomEvent('combo-box:change', {
      bubbles: true,
      detail: { value, label, source }
    }));
  }

  #selectByValue(value, fireEvent = true, source = 'api') {
    const option = this.#options.find(opt => opt.getAttribute('data-value') === value);
    if (option) {
      if (fireEvent) {
        this.#selectOption(option, source);
      } else {
        option.setAttribute('aria-selected', 'true');
        this.#selectedValue = value;
        this.#selectedLabel = option.textContent.trim();
        this.#input.value = this.#selectedLabel;
        this.setAttribute('value', value);
      }
    }
  }

  // --- Open / Close ---

  #open() {
    if (this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('open', '');
    this.#input.setAttribute('aria-expanded', 'true');

    /** @type {any} */ (this.#popover)?.show();

    this.dispatchEvent(new CustomEvent('combo-box:open', { bubbles: true }));
  }

  #close() {
    if (!this.#isOpen) return;

    this.#isOpen = false;
    this.removeAttribute('open');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;
    this.#clearActiveDescendant();

    /** @type {any} */ (this.#popover)?.hide();

    this.dispatchEvent(new CustomEvent('combo-box:close', { bubbles: true }));
  }

  #handlePopoverHide = () => {
    // Sync state if pop-over closed for any other reason (defensive).
    if (!this.#isOpen) return;
    this.#isOpen = false;
    this.removeAttribute('open');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#activeIndex = -1;
    this.#clearActiveDescendant();
    this.dispatchEvent(new CustomEvent('combo-box:close', { bubbles: true }));
  };

  // --- Form integration ---

  #syncFormValue() {
    if (this.#isMultiple) {
      if (this.#selectedTags.length > 0) {
        const formData = new FormData();
        const name = this.getAttribute('name') || '';
        for (const tag of this.#selectedTags) formData.append(name, tag.value);
        this.#internals.setFormValue(formData);
      } else {
        this.#internals.setFormValue(null);
      }
    } else {
      if (this.#selectedValue) this.#internals.setFormValue(this.#selectedValue, this.#selectedLabel);
      else this.#internals.setFormValue(null);
    }
  }

  #validate() {
    if (this.hasAttribute('required')) {
      if (this.#isMultiple) {
        if (this.#selectedTags.length === 0) {
          this.#internals.setValidity({ valueMissing: true }, 'Please select at least one option', this.#input);
        } else {
          this.#internals.setValidity({});
        }
      } else {
        if (!this.#selectedValue) {
          this.#internals.setValidity({ valueMissing: true }, 'Please select an option', this.#input);
        } else {
          this.#internals.setValidity({});
        }
      }
    } else {
      this.#internals.setValidity({});
    }
  }

  #fireChange() {
    this.dispatchEvent(new CustomEvent('combo-box:change', {
      bubbles: true,
      detail: {
        values: this.#selectedTags.map(t => t.value),
        labels: this.#selectedTags.map(t => t.label),
      }
    }));
  }

  formResetCallback() {
    if (this.#isMultiple) {
      this.#inputArea.querySelectorAll('.tag').forEach(t => t.remove());
      this.#selectedTags = [];
      this.#input.value = '';
      this.#input.disabled = false;
    } else {
      this.#selectedValue = '';
      this.#selectedLabel = '';
      this.#input.value = '';
      this.removeAttribute('value');
    }

    this.#options.forEach(opt => {
      opt.setAttribute('aria-selected', 'false');
      opt.hidden = false;
    });
    this.#filteredOptions = [...this.#options];
    this.#activeIndex = -1;
    this.#clearActiveDescendant();
    this.#close();

    if (!this.#isMultiple && this.#initialValue) {
      this.#selectByValue(this.#initialValue, false);
    }

    this.#syncFormValue();
    this.#validate();
  }

  formStateRestoreCallback(state) {
    if (!state) return;
    if (this.#isMultiple) return;
    this.#selectByValue(state, false);
    this.#syncFormValue();
    this.#validate();
  }

  // --- Public API ---

  get value() { return this.#selectedValue; }

  set value(val) {
    if (val) {
      this.#selectByValue(val);
    } else {
      this.#options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
      this.#selectedValue = '';
      this.#selectedLabel = '';
      this.#input.value = '';
      this.removeAttribute('value');
      this.#syncFormValue();
      this.#validate();
    }
  }

  get label() { return this.#selectedLabel; }
  get values() { return this.#selectedTags.map(t => t.value); }
  get labels() { return this.#selectedTags.map(t => t.label); }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && this.#input && newValue !== this.#selectedValue) {
      if (newValue) {
        this.#selectByValue(newValue, false);
        this.#syncFormValue();
        this.#validate();
      }
    }
  }
}

registerComponent('combo-box', ComboBox);

export { ComboBox };
