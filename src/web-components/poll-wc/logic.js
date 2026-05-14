/**
 * poll-wc: Voting + live results with single / multi-choice and closed state.
 *
 * Author renders options as `<button data-option data-count [data-mine]>` children;
 * optional `<span slot="question">…</span>` for the question. Mirrors the
 * reaction-bar pattern: presentational, emits a single `poll-wc:vote` event,
 * authors call back via `setCount(option, count, { mine })` after the server
 * confirms.
 *
 * @attr {boolean} data-multi        - Allow multiple selections (default: single)
 * @attr {boolean} data-closed       - Read-only — show results, no voting
 * @attr {boolean} data-hide-counts  - Suppress the numeric counts beside bars
 * @attr {string}  aria-label        - Group label
 *
 * Per-option attributes (on `<button data-option>`):
 *   data-option (required), data-count, data-mine
 *
 * @fires poll-wc:vote          - { option, action: 'add'|'remove', count, mine }
 *                                Single-choice: switching options emits a remove
 *                                for the previously-selected option BEFORE the add.
 * @fires poll-wc:closed-change - { closed }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

class PollWc extends VBElement {
  static observedAttributes = ['data-closed', 'data-multi'];

  #questionEl;       // .poll-question
  #questionSlot;     // [slot="question"] author element (if any)
  #optionsList;      // .poll-options container (the radio/checkbox group)
  #total;            // .poll-total live region
  #wiredOptions = new WeakSet();

  setup() {
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.#questionText() || 'Poll');
    }

    // Capture authored question slot + options before rebuilding.
    this.#questionSlot = this.querySelector(':scope > [slot="question"]');
    const options = this.#scanOptions();

    // Build the rendered structure.
    if (this.#questionSlot) {
      this.#questionEl = document.createElement('div');
      this.#questionEl.className = 'poll-question';
      this.#questionEl.id = `poll-q-${this.#seq()}`;
      this.#questionEl.appendChild(this.#questionSlot);
    }

    this.#optionsList = document.createElement('div');
    this.#optionsList.className = 'poll-options';
    this.#updateGroupRole();
    if (this.#questionEl) this.#optionsList.setAttribute('aria-labelledby', this.#questionEl.id);

    options.forEach((opt) => this.#optionsList.appendChild(opt));

    this.#total = document.createElement('output');
    this.#total.className = 'poll-total';
    this.#total.setAttribute('aria-live', 'polite');

    const children = [];
    if (this.#questionEl) children.push(this.#questionEl);
    children.push(this.#optionsList, this.#total);
    this.replaceChildren(...children);

    options.forEach((opt) => this.#decorateOption(opt));
    this.#refresh();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;
    if (name === 'data-closed') {
      this.#refresh();
      this.dispatchEvent(new CustomEvent('poll-wc:closed-change', {
        bubbles: true,
        detail: { closed: this.hasAttribute('data-closed') },
      }));
    } else if (name === 'data-multi') {
      this.#updateGroupRole();
      this.#refresh();
    }
  }

  // ── Setup helpers ──────────────────────────────────────────────────

  #scanOptions() {
    // Before setup completes, buttons are direct host children. After setup,
    // they live inside the .poll-options container that wraps them with the
    // radiogroup / checkboxgroup role.
    if (this.#optionsList) {
      return [...this.#optionsList.querySelectorAll(':scope > button[data-option]')];
    }
    return [...this.querySelectorAll(':scope > button[data-option]')];
  }

  #questionText() {
    return this.querySelector(':scope > [slot="question"]')?.textContent.trim();
  }

  #updateGroupRole() {
    if (!this.#optionsList) return;
    this.#optionsList.setAttribute('role', this.hasAttribute('data-multi') ? 'group' : 'radiogroup');
  }

  #seq() {
    return Math.random().toString(36).slice(2, 8);
  }

  #decorateOption(option) {
    if (this.#wiredOptions.has(option)) return;
    this.#wiredOptions.add(option);
    option.type = 'button';
    option.classList.add('poll-option');

    // Save the original label, then rebuild the inner structure with bar + count.
    const labelText = option.textContent;
    option.replaceChildren();

    const label = document.createElement('span');
    label.className = 'poll-option-label';
    label.textContent = labelText;

    const bar = document.createElement('span');
    bar.className = 'poll-option-bar';
    bar.setAttribute('aria-hidden', 'true');

    const count = document.createElement('span');
    count.className = 'poll-option-count';
    count.setAttribute('aria-hidden', 'true');

    option.append(label, bar, count);

    this.listen(option, 'click', () => this.#onOptionClick(option));
    this.listen(option, 'keydown', (e) => this.#onOptionKeydown(e, option));
  }

  // ── Voting ─────────────────────────────────────────────────────────

  #onOptionClick(option) {
    if (this.hasAttribute('data-closed') || this.hasAttribute('disabled')) return;
    const reaction = option.dataset.option;
    const count = Number(option.dataset.count) || 0;
    const mine = option.hasAttribute('data-mine');
    const multi = this.hasAttribute('data-multi');

    // Single-choice: if the user is switching to a NEW option, emit remove
    // for the previously-selected option BEFORE the add.
    if (!multi && !mine) {
      const prev = this.#scanOptions().find((o) => o.hasAttribute('data-mine') && o !== option);
      if (prev) {
        this.dispatchEvent(new CustomEvent('poll-wc:vote', {
          bubbles: true,
          detail: { option: prev.dataset.option, action: 'remove', count: Number(prev.dataset.count) || 0, mine: true },
        }));
      }
    }

    this.dispatchEvent(new CustomEvent('poll-wc:vote', {
      bubbles: true,
      detail: { option: reaction, action: mine ? 'remove' : 'add', count, mine },
    }));
  }

  #onOptionKeydown = (e, option) => {
    const opts = this.#scanOptions();
    const i = opts.indexOf(option);
    const multi = this.hasAttribute('data-multi');
    let next = i;
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight':
        e.preventDefault(); next = (i + 1) % opts.length; break;
      case 'ArrowUp': case 'ArrowLeft':
        e.preventDefault(); next = (i - 1 + opts.length) % opts.length; break;
      case 'Home':
        e.preventDefault(); next = 0; break;
      case 'End':
        e.preventDefault(); next = opts.length - 1; break;
      default:
        return;
    }
    opts[next].focus();
    // For radiogroup convention: focus + activate moves selection.
    if (!multi && !this.hasAttribute('data-closed')) {
      // Don't activate on arrow nav; only Space/Enter activates.
      // (Respects the WAI-ARIA pattern where users can browse without committing.)
    }
  };

  // ── Render ─────────────────────────────────────────────────────────

  #refresh() {
    const opts = this.#scanOptions();
    const total = opts.reduce((s, o) => s + (Number(o.dataset.count) || 0), 0);
    const closed = this.hasAttribute('data-closed');
    const multi = this.hasAttribute('data-multi');
    const hideCounts = this.hasAttribute('data-hide-counts');

    opts.forEach((option, idx) => {
      const count = Number(option.dataset.count) || 0;
      const mine = option.hasAttribute('data-mine');
      const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;

      option.style.setProperty('--option-pct', String(pct));
      option.setAttribute('aria-checked', mine ? 'true' : 'false');
      option.setAttribute('role', multi ? 'checkbox' : 'radio');
      if (closed || this.hasAttribute('disabled')) {
        option.setAttribute('aria-disabled', 'true');
      } else {
        option.removeAttribute('aria-disabled');
      }

      // Roving tabindex for radiogroup: only the selected (or first) option
      // is in the tab sequence. Multi: every checkbox is tabbable.
      if (!multi) {
        const firstSelected = opts.find((o) => o.hasAttribute('data-mine')) || opts[0];
        option.setAttribute('tabindex', option === firstSelected ? '0' : '-1');
      } else {
        option.setAttribute('tabindex', '0');
      }

      const countEl = option.querySelector('.poll-option-count');
      if (countEl) {
        countEl.textContent = hideCounts ? '' : `${count}`;
      }

      const noun = count === 1 ? 'vote' : 'votes';
      const own = mine ? ', your choice' : '';
      const label = option.querySelector('.poll-option-label')?.textContent || option.dataset.option;
      option.setAttribute('aria-label', `${label}, ${count} ${noun} (${pct}%)${own}`);
    });

    if (this.#total) {
      this.#total.textContent = `${total} ${total === 1 ? 'vote' : 'votes'}`;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Update a single option's count (and optionally its mine flag).
   *
   * @param {string} option
   * @param {number} count
   * @param {{ mine?: boolean }} [opts]
   */
  setCount(option, count, opts = {}) {
    const el = this.#scanOptions().find((o) => o.dataset.option === option);
    if (!el) return;
    el.dataset.count = String(Math.max(0, Number(count) || 0));
    if (opts.mine === true) el.setAttribute('data-mine', '');
    else if (opts.mine === false) el.removeAttribute('data-mine');
    this.#refresh();
  }

  /**
   * Bulk-update counts. `mine` may be a string (single-choice) or string[] (multi).
   *
   * @param {Object<string, number>} counts
   * @param {{ mine?: string|string[] }} [opts]
   */
  setCounts(counts, opts = {}) {
    const mineList = Array.isArray(opts.mine) ? opts.mine : (opts.mine ? [opts.mine] : null);
    for (const el of this.#scanOptions()) {
      const id = el.dataset.option;
      if (counts[id] != null) el.dataset.count = String(Math.max(0, Number(counts[id])));
      if (mineList) {
        if (mineList.includes(id)) el.setAttribute('data-mine', '');
        else el.removeAttribute('data-mine');
      }
    }
    this.#refresh();
  }

  close() { this.setAttribute('data-closed', ''); }
  open()  { this.removeAttribute('data-closed'); }

  get totalVotes() {
    return this.#scanOptions().reduce((s, o) => s + (Number(o.dataset.count) || 0), 0);
  }

  get myVotes() {
    return this.#scanOptions()
      .filter((o) => o.hasAttribute('data-mine'))
      .map((o) => o.dataset.option);
  }
}

registerComponent('poll-wc', PollWc);

export { PollWc };
