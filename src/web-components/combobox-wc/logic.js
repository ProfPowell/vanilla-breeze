/**
 * combobox-wc: Form-associated autocomplete combobox
 *
 * Light DOM combobox following the W3C ARIA combobox pattern.
 * Participates in native form submission via ElementInternals.
 * Supports single-select (default) and multi-select (data-multiple) modes.
 *
 * @attr {string} name - Form field name
 * @attr {boolean} data-required - Makes selection required
 * @attr {string} data-filter - Filter mode: "startsWith" | "contains" (default: "contains")
 * @attr {string} data-value - Get/set selected value programmatically (single mode)
 * @attr {string} data-placeholder - Input placeholder text
 * @attr {boolean} data-multiple - Enable multi-select tag mode
 * @attr {number} data-max - Maximum number of tags (multi mode)
 * @attr {boolean} data-allow-custom - Allow typed entries (multi mode)
 *
 * @example Single select
 * <combobox-wc name="country" data-required>
 *   <input type="text" placeholder="Search countries...">
 *   <ul>
 *     <li data-value="us">United States</li>
 *     <li data-value="gb">United Kingdom</li>
 *   </ul>
 * </combobox-wc>
 *
 * @example Multi select
 * <combobox-wc name="topics" data-multiple data-max="5">
 *   <input type="text" placeholder="Search topics...">
 *   <ul>
 *     <li data-value="js">JavaScript</li>
 *     <li data-value="css">CSS</li>
 *   </ul>
 * </combobox-wc>
 */

import { setRole } from '../../utils/form-internals.js';
import { supportsPopover } from '../../utils/popover-support.js';

class ComboboxWc extends HTMLElement {
  static formAssociated = true;

  #internals;
  #input;
  #listbox;
  #options = [];
  #filteredOptions = [];
  #activeIndex = -1;
  #isOpen = false;
  #usePopover = false;

  // Single mode state
  #selectedValue = '';
  #selectedLabel = '';
  #initialValue = '';

  // Multi mode state
  #inputArea;
  #liveRegion;
  #selectedTags = []; // { value, label }

  constructor() {
    super();
    this.#internals = this.attachInternals();
  }

  get #isMultiple() {
    return this.hasAttribute('data-multiple');
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

    // Progressive enhancement: use Popover API when available
    this.#usePopover = supportsPopover;
    if (this.#usePopover) {
      this.#listbox.setAttribute('popover', 'manual');
    }

    // Multi mode: wrap input in tags-input-area
    if (this.#isMultiple) {
      this.#inputArea = document.createElement('div');
      this.#inputArea.className = 'tags-input-area';
      this.insertBefore(this.#inputArea, this.#listbox);
      this.#inputArea.appendChild(this.#input);

      // Live region for announcements
      this.#liveRegion = document.createElement('div');
      this.#liveRegion.setAttribute('aria-live', 'polite');
      this.#liveRegion.setAttribute('aria-atomic', 'true');
      this.#liveRegion.className = 'sr-only';
      this.appendChild(this.#liveRegion);
    }

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
    if (this.#isMultiple) {
      this.#listbox.setAttribute('aria-multiselectable', 'true');
    }

    // Collect and set up options
    this.#collectOptions();

    // Read initial value (single mode only)
    if (!this.#isMultiple) {
      const initialDataValue = this.getAttribute('data-value');
      if (initialDataValue) {
        this.#selectByValue(initialDataValue, false);
      }
      this.#initialValue = this.#selectedValue;
    }

    // Bind events
    this.#input.addEventListener('input', this.#handleInput);
    this.#input.addEventListener('keydown', this.#handleKeyDown);
    this.#input.addEventListener('focus', this.#handleFocus);
    this.#input.addEventListener('click', this.#handleInputClick);
    this.#listbox.addEventListener('click', this.#handleOptionClick);
    this.#listbox.addEventListener('pointerdown', this.#handleOptionPointerDown);
    document.addEventListener('click', this.#handleOutsideClick);

    if (this.#usePopover) {
      this.#listbox.addEventListener('toggle', this.#handlePopoverToggle);
    }

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
      this.#listbox.removeEventListener('toggle', this.#handlePopoverToggle);
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

  // --- Multi mode: Tag management ---

  #addTag(value, label) {
    if (this.#selectedTags.some(t => t.value === value)) return;

    const max = this.#getMax();
    if (max && this.#selectedTags.length >= max) return;

    this.#selectedTags.push({ value, label });

    // Create tag element
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

    // Mark option as selected
    const option = this.#options.find(o => o.getAttribute('data-value') === value);
    if (option) {
      option.setAttribute('aria-selected', 'true');
    }

    // Announce
    this.#announce(`${label} added`);

    // Clear input and update
    this.#input.value = '';
    this.#filterOptions('');
    this.#syncFormValue();
    this.#validate();
    this.#fireChange();

    // Disable input if max reached
    if (max && this.#selectedTags.length >= max) {
      this.#input.disabled = true;
      this.#close();
    }
  }

  #removeTag(value) {
    const index = this.#selectedTags.findIndex(t => t.value === value);
    if (index === -1) return;

    const removed = this.#selectedTags.splice(index, 1)[0];

    // Remove tag element
    const tagEl = this.#inputArea.querySelector(`.tag[data-value="${CSS.escape(value)}"]`);
    if (tagEl) tagEl.remove();

    // Unmark option
    const option = this.#options.find(o => o.getAttribute('data-value') === value);
    if (option) {
      option.setAttribute('aria-selected', 'false');
    }

    // Announce
    this.#announce(`${removed.label} removed`);

    // Re-enable input if was at max
    const max = this.#getMax();
    if (max && this.#input.disabled) {
      this.#input.disabled = false;
    }

    this.#filterOptions(this.#input.value.trim());
    this.#syncFormValue();
    this.#validate();
    this.#fireChange();
    this.#input.focus();
  }

  #getMax() {
    const val = this.getAttribute('data-max');
    return val ? parseInt(val, 10) : 0;
  }

  #announce(message) {
    if (!this.#liveRegion) return;
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => {
      this.#liveRegion.textContent = message;
    });
  }

  // --- Event handlers ---

  #handleInput = () => {
    const query = this.#input.value.trim();

    // Single mode: clear selection when user types
    if (!this.#isMultiple && this.#selectedValue) {
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
          const option = this.#filteredOptions[this.#activeIndex];
          if (this.#isMultiple) {
            this.#addTag(option.getAttribute('data-value'), option.textContent.trim());
          } else {
            this.#selectOption(option);
          }
        } else if (this.#isMultiple && this.hasAttribute('data-allow-custom') && this.#input.value.trim()) {
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
        if (this.#isMultiple && this.hasAttribute('data-allow-custom') && this.#input.value.trim()) {
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
        if (this.#isOpen) {
          this.#close();
        }
        break;
    }
  };

  #handleFocus = () => {
    if (this.#isMultiple) {
      // Multi mode: always open on focus
      this.#filterOptions(this.#input.value.trim());
      this.#open();
    } else {
      // Single mode: open unless value already selected and input empty
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
      if (this.#isMultiple) {
        this.#addTag(option.getAttribute('data-value'), option.textContent.trim());
      } else {
        this.#selectOption(option);
      }
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
    const selectedValues = this.#isMultiple
      ? new Set(this.#selectedTags.map(t => t.value))
      : null;

    this.#filteredOptions = [];

    this.#options.forEach(option => {
      const value = option.getAttribute('data-value');
      const text = option.textContent.trim().toLowerCase();

      // Multi mode: hide already-selected options
      if (selectedValues && selectedValues.has(value)) {
        option.hidden = true;
        return;
      }

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

  // --- Selection (single mode) ---

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

    if (this.#usePopover) {
      this.#positionListbox();
      try { this.#listbox.showPopover(); } catch { /* already open */ }
    }

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

    if (this.#usePopover) {
      try { this.#listbox.hidePopover(); } catch { /* already closed */ }
    }

    this.dispatchEvent(new CustomEvent('combobox-close', { bubbles: true }));
  }

  #positionListbox() {
    if (!this.#usePopover || !this.#input) return;
    const rect = this.#input.getBoundingClientRect();
    this.#listbox.style.setProperty('--combobox-top', `${rect.bottom + 2}px`);
    this.#listbox.style.setProperty('--combobox-left', `${rect.left}px`);
    this.#listbox.style.setProperty('--combobox-width', `${rect.width}px`);
  }

  #handlePopoverToggle = (e) => {
    if (e.newState === 'closed' && this.#isOpen) {
      this.#isOpen = false;
      this.removeAttribute('data-open');
      this.#input.setAttribute('aria-expanded', 'false');
      this.#listbox.hidden = true;
      this.#activeIndex = -1;
      this.#clearActiveDescendant();
      this.dispatchEvent(new CustomEvent('combobox-close', { bubbles: true }));
    }
  };

  // --- Form integration ---

  #syncFormValue() {
    if (this.#isMultiple) {
      if (this.#selectedTags.length > 0) {
        const formData = new FormData();
        const name = this.getAttribute('name') || '';
        for (const tag of this.#selectedTags) {
          formData.append(name, tag.value);
        }
        this.#internals.setFormValue(formData);
      } else {
        this.#internals.setFormValue(null);
      }
    } else {
      if (this.#selectedValue) {
        this.#internals.setFormValue(this.#selectedValue, this.#selectedLabel);
      } else {
        this.#internals.setFormValue(null);
      }
    }
  }

  #validate() {
    if (this.hasAttribute('data-required')) {
      if (this.#isMultiple) {
        if (this.#selectedTags.length === 0) {
          this.#internals.setValidity(
            { valueMissing: true },
            'Please select at least one option',
            this.#input
          );
        } else {
          this.#internals.setValidity({});
        }
      } else {
        if (!this.#selectedValue) {
          this.#internals.setValidity(
            { valueMissing: true },
            'Please select an option',
            this.#input
          );
        } else {
          this.#internals.setValidity({});
        }
      }
    } else {
      this.#internals.setValidity({});
    }
  }

  #fireChange() {
    this.dispatchEvent(new CustomEvent('combobox-change', {
      bubbles: true,
      detail: {
        values: this.#selectedTags.map(t => t.value),
        labels: this.#selectedTags.map(t => t.label),
      }
    }));
  }

  formResetCallback() {
    if (this.#isMultiple) {
      // Remove all tag elements
      this.#inputArea.querySelectorAll('.tag').forEach(t => t.remove());
      this.#selectedTags = [];
      this.#input.value = '';
      this.#input.disabled = false;
    } else {
      this.#selectedValue = '';
      this.#selectedLabel = '';
      this.#input.value = '';
      this.removeAttribute('data-value');
    }

    // Reset options
    this.#options.forEach(opt => {
      opt.setAttribute('aria-selected', 'false');
      opt.hidden = false;
    });
    this.#filteredOptions = [...this.#options];
    this.#activeIndex = -1;
    this.#clearActiveDescendant();
    this.#close();

    // Restore initial value if set (single mode)
    if (!this.#isMultiple && this.#initialValue) {
      this.#selectByValue(this.#initialValue, false);
    }

    this.#syncFormValue();
    this.#validate();
  }

  formStateRestoreCallback(state) {
    if (!state) return;
    // FormData restore not supported for multi mode
    if (this.#isMultiple) return;
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

  get values() {
    return this.#selectedTags.map(t => t.value);
  }

  get labels() {
    return this.#selectedTags.map(t => t.label);
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
