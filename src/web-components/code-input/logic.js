/**
 * code-input - Web component for verification code entry
 *
 * Features:
 * - Auto-advance on digit entry
 * - Backspace navigation
 * - Paste handling (distributes digits)
 * - Hidden input for form submission
 * - Fires code-change event
 *
 * Usage:
 * <code-input name="code" data-length="6"></code-input>
 */

class CodeInput extends HTMLElement {
  #inputs = [];
  #hiddenInput;
  #length;

  connectedCallback() {
    this.#length = parseInt(this.dataset.length || '6', 10);
    this.#render();
    this.#setupListeners();
  }

  #render() {
    const name = this.getAttribute('name') || 'code';

    // Create hidden input for form submission
    this.#hiddenInput = document.createElement('input');
    this.#hiddenInput.type = 'hidden';
    this.#hiddenInput.name = name;
    this.appendChild(this.#hiddenInput);

    // Create wrapper for inputs
    const wrapper = document.createElement('div');
    wrapper.className = 'code-input-wrapper';
    wrapper.setAttribute('data-layout', 'cluster');
    wrapper.setAttribute('data-justify', 'center');
    wrapper.setAttribute('data-gap', 's');

    // Create individual inputs
    for (let i = 0; i < this.#length; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.pattern = '[0-9]';
      input.required = this.hasAttribute('required');
      input.setAttribute('aria-label', `Digit ${i + 1}`);
      input.className = 'code-input-digit';
      this.#inputs.push(input);
      wrapper.appendChild(input);
    }

    this.appendChild(wrapper);
  }

  #setupListeners() {
    this.#inputs.forEach((input, index) => {
      // Handle input
      input.addEventListener('input', (e) => {
        const value = e.target.value;

        // Only allow digits
        if (value && !/^\d$/.test(value)) {
          e.target.value = '';
          return;
        }

        // Move to next input on digit entry
        if (value && index < this.#inputs.length - 1) {
          this.#inputs[index + 1].focus();
        }

        this.#updateHiddenInput();
      });

      // Handle keydown
      input.addEventListener('keydown', (e) => {
        // Move to previous input on backspace when empty
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          this.#inputs[index - 1].focus();
        }

        // Allow arrow key navigation
        if (e.key === 'ArrowLeft' && index > 0) {
          e.preventDefault();
          this.#inputs[index - 1].focus();
        }
        if (e.key === 'ArrowRight' && index < this.#inputs.length - 1) {
          e.preventDefault();
          this.#inputs[index + 1].focus();
        }
      });

      // Handle paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const digits = paste.replace(/\D/g, '').slice(0, this.#length).split('');

        digits.forEach((digit, i) => {
          if (this.#inputs[i]) {
            this.#inputs[i].value = digit;
          }
        });

        // Focus the next empty input or the last one
        const nextEmpty = this.#inputs.findIndex(inp => !inp.value);
        if (nextEmpty !== -1) {
          this.#inputs[nextEmpty].focus();
        } else if (digits.length > 0) {
          this.#inputs[Math.min(digits.length - 1, this.#length - 1)].focus();
        }

        this.#updateHiddenInput();
      });

      // Select all on focus for easy replacement
      input.addEventListener('focus', () => {
        input.select();
      });
    });
  }

  #updateHiddenInput() {
    const value = this.#inputs.map(i => i.value).join('');
    this.#hiddenInput.value = value;

    this.dispatchEvent(new CustomEvent('code-change', {
      detail: {
        value,
        complete: value.length === this.#length
      },
      bubbles: true
    }));
  }

  // Public API
  get value() {
    return this.#hiddenInput?.value || '';
  }

  set value(val) {
    const digits = String(val).replace(/\D/g, '').slice(0, this.#length).split('');
    this.#inputs.forEach((input, i) => {
      input.value = digits[i] || '';
    });
    this.#updateHiddenInput();
  }

  clear() {
    this.#inputs.forEach(input => {
      input.value = '';
    });
    this.#hiddenInput.value = '';
    this.#inputs[0]?.focus();
  }

  focus() {
    this.#inputs[0]?.focus();
  }
}

customElements.define('code-input', CodeInput);

export { CodeInput };
