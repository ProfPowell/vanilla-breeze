/**
 * tags-wc: Form-associated multi-select tag input
 *
 * Light DOM tag/chip input for selecting multiple items from a list.
 * Participates in native form submission via ElementInternals.
 *
 * @attr {string} name - Form field name
 * @attr {boolean} data-required - Require at least one tag
 * @attr {number} data-max - Maximum number of tags
 * @attr {boolean} data-allow-custom - Allow typing custom tags
 * @attr {string} data-filter - Filter mode: "startsWith" | "contains" (default: "contains")
 *
 * @example
 * <tags-wc name="topics">
 *   <input type="text" placeholder="Search topics...">
 *   <ul>
 *     <li data-value="js">JavaScript</li>
 *     <li data-value="css">CSS</li>
 *     <li data-value="html">HTML</li>
 *   </ul>
 * </tags-wc>
 */

import { setRole } from '../../utils/form-internals.js';

class TagsWc extends HTMLElement {
  static formAssociated = true;

  #internals;
  #input;
  #listbox;
  #inputArea;
  #liveRegion;
  #options = [];
  #filteredOptions = [];
  #selectedTags = []; // { value, label }
  #activeIndex = -1;
  #isOpen = false;
  #initialTags = [];

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
    this.#input = this.querySelector(':scope > input');
    if (!this.#input) return;

    this.#listbox = this.querySelector(':scope > ul, :scope > ol');
    if (!this.#listbox) return;

    // Build input area wrapper
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

    // Generate IDs
    const uid = crypto.randomUUID().slice(0, 8);
    if (!this.#listbox.id) {
      this.#listbox.id = `tags-listbox-${uid}`;
    }

    // Set up ARIA on input
    setRole(this.#input, this.#internals, 'combobox');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#input.setAttribute('aria-autocomplete', 'list');
    this.#input.setAttribute('aria-controls', this.#listbox.id);
    this.#input.setAttribute('autocomplete', 'off');

    // Set up listbox
    this.#listbox.setAttribute('role', 'listbox');
    this.#listbox.setAttribute('aria-multiselectable', 'true');

    // Collect options
    this.#collectOptions();

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

  // --- Tag management ---

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
    this.#liveRegion.textContent = '';
    requestAnimationFrame(() => {
      this.#liveRegion.textContent = message;
    });
  }

  // --- Event handlers ---

  #handleInput = () => {
    const query = this.#input.value.trim();
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

      case 'Enter':
        e.preventDefault();
        if (this.#isOpen && this.#activeIndex >= 0 && this.#filteredOptions[this.#activeIndex]) {
          const option = this.#filteredOptions[this.#activeIndex];
          this.#addTag(option.getAttribute('data-value'), option.textContent.trim());
        } else if (this.hasAttribute('data-allow-custom') && this.#input.value.trim()) {
          const text = this.#input.value.trim();
          this.#addTag(text, text);
        }
        break;

      case 'Backspace':
        if (!this.#input.value && this.#selectedTags.length > 0) {
          const lastTag = this.#selectedTags[this.#selectedTags.length - 1];
          this.#removeTag(lastTag.value);
        }
        break;

      case ',':
        if (this.hasAttribute('data-allow-custom') && this.#input.value.trim()) {
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
    this.#filterOptions(this.#input.value.trim());
    this.#open();
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
      this.#addTag(option.getAttribute('data-value'), option.textContent.trim());
    }
  };

  #handleOptionPointerDown = (e) => {
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
    const selectedValues = new Set(this.#selectedTags.map(t => t.value));

    this.#filteredOptions = [];

    this.#options.forEach(option => {
      const value = option.getAttribute('data-value');
      const text = option.textContent.trim().toLowerCase();

      // Hide already selected
      if (selectedValues.has(value)) {
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

  // --- Open / Close ---

  #open() {
    if (this.#isOpen) return;

    this.#isOpen = true;
    this.setAttribute('data-open', '');
    this.#input.setAttribute('aria-expanded', 'true');
    this.#listbox.hidden = false;
  }

  #close() {
    if (!this.#isOpen && this.#listbox.hidden !== false) return;

    this.#isOpen = false;
    this.removeAttribute('data-open');
    this.#input.setAttribute('aria-expanded', 'false');
    this.#listbox.hidden = true;
    this.#activeIndex = -1;
    this.#clearActiveDescendant();
  }

  // --- Form integration ---

  #syncFormValue() {
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
  }

  #validate() {
    if (this.hasAttribute('data-required')) {
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
      this.#internals.setValidity({});
    }
  }

  #fireChange() {
    this.dispatchEvent(new CustomEvent('tags-change', {
      bubbles: true,
      detail: {
        values: this.#selectedTags.map(t => t.value),
        labels: this.#selectedTags.map(t => t.label),
      }
    }));
  }

  formResetCallback() {
    // Remove all tag elements
    this.#inputArea.querySelectorAll('.tag').forEach(t => t.remove());

    // Clear state
    this.#selectedTags = [];
    this.#input.value = '';
    this.#input.disabled = false;

    // Reset options
    this.#options.forEach(opt => {
      opt.setAttribute('aria-selected', 'false');
      opt.hidden = false;
    });
    this.#filteredOptions = [...this.#options];
    this.#activeIndex = -1;
    this.#clearActiveDescendant();
    this.#close();
    this.#syncFormValue();
    this.#validate();
  }

  formStateRestoreCallback(state) {
    // state may be FormData
    if (!state) return;
  }

  // --- Public API ---

  get values() {
    return this.#selectedTags.map(t => t.value);
  }

  get labels() {
    return this.#selectedTags.map(t => t.label);
  }
}

customElements.define('tags-wc', TagsWc);

export { TagsWc };
