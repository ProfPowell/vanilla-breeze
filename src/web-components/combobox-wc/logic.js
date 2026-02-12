/**
 * combobox-wc: Form-associated autocomplete combobox
 *
 * Light DOM combobox following the W3C ARIA combobox pattern.
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string} name - Form field name
 * @attr {boolean} data-required - Makes selection required
 * @attr {string} data-filter - Filter mode: "startsWith" | "contains" (default: "contains")
 * @attr {string} data-value - Get/set selected value programmatically
 * @attr {string} data-placeholder - Input placeholder text
 *
 * @example
 * <combobox-wc name="country" data-required>
 *   <input type="text" placeholder="Search countries...">
 *   <ul>
 *     <li data-value="us">United States</li>
 *     <li data-value="gb">United Kingdom</li>
 *   </ul>
 * </combobox-wc>
 */

import { setRole } from '../../utils/form-internals.js';

class ComboboxWc extends HTMLElement {
  static formAssociated = true;

  #internals;
  #input;
  #listbox;
  #options = [];
  #filteredOptions = [];
  #activeIndex = -1;
  #isOpen = false;
  #selectedValue = '';
  #selectedLabel = '';
  #initialValue = '';

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  connectedCallback() {
    this.#setup();
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  #setup() {
    // Find input
    this.#input = this.querySelector(':scope > input');
    if (!this.#input) return;

    // Find listbox
    this.#listbox = this.querySelector(':scope > ul, :scope > ol');
    if (!this.#listbox) return;

    // Apply placeholder from attribute
    const placeholder = this.getAttribute('data-placeholder');
    if (placeholder && !this.#input.getAttribute('placeholder')) {
      this.#input.setAttribute('placeholder', placeholder);
    }

    // Generate IDs
    const uid = crypto.randomUUID().slice(0, 8);
    if (!this.#listbox.id) {
      this.#listbox.id = `combobox-listbox-${uid}`;
    }

    // Set up ARIA on input
    setRole(this.#input, this.#internals, 'combobox');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#input.setAttribute('aria-autocomplete', 'list');
    this.#input.setAttribute('aria-controls', this.#listbox.id);
    this.#input.setAttribute('autocomplete', 'off');

    // Set up listbox
    this.#listbox.setAttribute('role', 'listbox');

    // Collect and set up options
    this.#collectOptions();

    // Read initial value
    const initialDataValue = this.getAttribute('data-value');
    if (initialDataValue) {
      this.#selectByValue(initialDataValue, false);
    }
    this.#initialValue = this.#selectedValue;

    // Bind events
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleKeyDown);
    this.#input.addEventListener('focus', this.#handleFocus);
    this.#input.addEventListener('click', this.#handleInputClick);
    this.#listbox.addEventListener('click', this.#handleOptionClick);
    this.#listbox.addEventListener('pointerdown', this.#handleOptionPointerDown);
    document.addEventListener('click', this.#handleOutsideClick);

    // Initial form sync
    this.#syncFormValue();
    this.#validate();

    // Close listbox initially
    this.#close();
  }

  #cleanup() {
    if (this.#input) {
      this.#input.removeEventListener('input', this.#handleInput);
      this.#input.removeEventListener('keydown', this.#handleKeyDown);
      this.#input.removeEventListener('focus', this.#handleFocus);
      this.#input.removeEventListener('click', this.#handleInputClick);
    }
    if (this.#listbox) {
      this.#listbox.removeEventListener('click', this.#handleOptionClick);
      this.#listbox.removeEventListener('pointerdown', this.#handleOptionPointerDown);
    }
    document.removeEventListener('click', this.#handleOutsideClick);
  }

  #collectOptions() {
    this.#options = Array.from(this.#listbox.querySelectorAll(':scope > li[data-value]'));
    this.#options.forEach((option, index) => {
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', 'false');
      if (!option.id) {
        option.id = `${this.#listbox.id}-option-${index}`;
      }
    });
    this.#filteredOptions = [...this.#options];
  }

  // --- Event handlers ---

  #handleInput = () => {
    const query = this.#input.value.trim();

    // Clear selection when user types
    if (this.#selectedValue) {
      this.#selectedValue = '';
      this.#selectedLabel = '';
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
        if (!this.#isOpen) {
          this.#open();
        }
        this.#focusOption(this.#activeIndex + 1);
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!this.#isOpen) {
          this.#open();
        }
        this.#focusOption(this.#activeIndex - 1);
        break;

      case 'Home':
        if (this.#isOpen) {
          e.preventDefault();
          this.#focusOption(0);
        }
        break;

      case 'End':
        if (this.#isOpen) {
          e.preventDefault();
          this.#focusOption(this.#filteredOptions.length - 1);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (this.#isOpen && this.#activeIndex >= 0 && this.#filteredOptions[this.#activeIndex]) {
          this.#selectOption(this.#filteredOptions[this.#activeIndex]);
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
        if (this.#isOpen) {
          this.#close();
        }
        break;
    }
  };

  #handleFocus = () => {
    if (this.#input.value || !this.#selectedValue) {
      this.#filterOptions(this.#input.value.trim());
      this.#open();
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
      this.#selectOption(option);
    }
  };

  #handleOptionPointerDown = (e) => {
    // Prevent input blur when clicking options
    e.preventDefault();
  };

  #handleOutsideClick = (e) => {
    if (this.#isOpen && !this.contains(e.target)) {
      this.#close();
    }
  };

  // --- Filtering ---

  #filterOptions(query) {
    const mode = this.getAttribute('data-filter') || 'contains';
    const lowerQuery = query.toLowerCase();

    this.#filteredOptions = [];

    this.#options.forEach(option => {
      const text = option.textContent.trim().toLowerCase();
      let matches;

      if (!query) {
        matches = true;
      } else if (mode === 'startsWith') {
        matches = text.startsWith(lowerQuery);
      } else {
        matches = text.includes(lowerQuery);
      }

      option.hidden = !matches;
      if (matches) {
        this.#filteredOptions.push(option);
      }
    });

    this.#activeIndex = -1;
    this.#clearActiveDescendant();
  }

  // --- Option navigation ---

  #focusOption(index) {
    if (this.#filteredOptions.length === 0) return;

    // Wrap around
    if (index < 0) index = this.#filteredOptions.length - 1;
    if (index >= this.#filteredOptions.length) index = 0;

    // Remove previous active
    if (this.#activeIndex >= 0 && this.#filteredOptions[this.#activeIndex]) {
      this.#filteredOptions[this.#activeIndex].removeAttribute('data-active');
    }

    this.#activeIndex = index;
    const option = this.#filteredOptions[index];
    option.setAttribute('data-active', '');
    option.scrollIntoView({ block: 'nearest' });

    // Set aria-activedescendant
    this.#input.setAttribute('aria-activedescendant', option.id);
  }

  #clearActiveDescendant() {
    this.#options.forEach(opt => opt.removeAttribute('data-active'));
    this.#input.removeAttribute('aria-activedescendant');
  }

  // --- Selection ---

  #selectOption(option) {
    const value = option.getAttribute('data-value');
    const label = option.textContent.trim();

    // Clear previous selection
    this.#options.forEach(opt => opt.setAttribute('aria-selected', 'false'));

    // Set new selection
    option.setAttribute('aria-selected', 'true');
    this.#selectedValue = value;
    this.#selectedLabel = label;
    this.#input.value = label;
    this.setAttribute('data-value', value);

    this.#syncFormValue();
    this.#validate();
    this.#close();
    this.#input.focus();

    this.dispatchEvent(new CustomEvent('combobox-change', {
      bubbles: true,
      detail: { value, label }
    }));
  }

  #selectByValue(value, fireEvent = true) {
    const option = this.#options.find(opt => opt.getAttribute('data-value') === value);
    if (option) {
      if (fireEvent) {
        this.#selectOption(option);
      } else {
        option.setAttribute('aria-selected', 'true');
        this.#selectedValue = value;
        this.#selectedLabel = option.textContent.trim();
        this.#input.value = this.#selectedLabel;
        this.setAttribute('data-value', value);
      }
    }
  }

  // --- Open / Close ---

  #open() {
    if (this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('data-open', '');
    this.#input.setAttribute('aria-expanded', 'true');
    this.#listbox.hidden = false;

    this.dispatchEvent(new CustomEvent('combobox-open', { bubbles: true }));
  }

  #close() {
    if (!this.#isOpen && !this.#listbox.hidden === false) return;

    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#listbox.hidden = true;
    this.#activeIndex = -1;
    this.#clearActiveDescendant();

    this.dispatchEvent(new CustomEvent('combobox-close', { bubbles: true }));
  }

  // --- Form integration ---

  #syncFormValue() {
    if (this.#selectedValue) {
      this.#internals.setFormValue(this.#selectedValue, this.#selectedLabel);
    } else {
      this.#internals.setFormValue(null);
    }
  }

  #validate() {
    if (this.hasAttribute('data-required')) {
      if (!this.#selectedValue) {
        this.#internals.setValidity(
          { valueMissing: true },
          'Please select an option',
          this.#input
        );
      } else {
        this.#internals.setValidity({});
      }
    } else {
      this.#internals.setValidity({});
    }
  }

  formResetCallback() {
    // Clear selection
    this.#options.forEach(opt => {
      opt.setAttribute('aria-selected', 'false');
      opt.hidden = false;
    });
    this.#filteredOptions = [...this.#options];

    this.#selectedValue = '';
    this.#selectedLabel = '';
    this.#input.value = '';
    this.removeAttribute('data-value');
    this.#activeIndex = -1;
    this.#clearActiveDescendant();
    this.#close();

    // Restore initial value if set
    if (this.#initialValue) {
      this.#selectByValue(this.#initialValue, false);
      this.#syncFormValue();
    } else {
      this.#syncFormValue();
    }
    this.#validate();
  }

  formStateRestoreCallback(state) {
    if (!state) return;
    this.#selectByValue(state, false);
    this.#syncFormValue();
    this.#validate();
  }

  // --- Public API ---

  get value() {
    return this.#selectedValue;
  }

  set value(val) {
    if (val) {
      this.#selectByValue(val);
    } else {
      this.#options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
      this.#selectedValue = '';
      this.#selectedLabel = '';
      this.#input.value = '';
      this.removeAttribute('data-value');
      this.#syncFormValue();
      this.#validate();
    }
  }

  get label() {
    return this.#selectedLabel;
  }

  static get observedAttributes() {
    return ['data-value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-value' && this.#input && newValue !== this.#selectedValue) {
      if (newValue) {
        this.#selectByValue(newValue, false);
        this.#syncFormValue();
        this.#validate();
      }
    }
  }
}

customElements.define('combobox-wc', ComboboxWc);

export { ComboboxWc };
