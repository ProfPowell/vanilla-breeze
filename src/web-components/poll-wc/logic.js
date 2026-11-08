/**
 * poll-wc: Voting + live results with single / multi-choice and closed state.
 *
 * Two authoring forms:
 *
 * 1. Buttons — `<button data-option data-count [data-mine]>` children with an
 *    optional `<span slot="question">…</span>`.
 * 2. Native form (no-JS fallback) — a `<form>` whose `<fieldset>` holds a
 *    `<legend>` and `<input type="radio|checkbox" value data-count [checked]>`
 *    inputs inside `<label>`s. Without JS it submits to the form's action;
 *    with JS it is replaced by the button form (legend → question, value →
 *    data-option, checked → data-mine, checkbox → data-multi,
 *    fieldset[disabled] → data-closed).
 *
 * Presentational, like reaction-bar: emits `poll-wc:vote`, and the author
 * calls `setCount(option, count, { mine })` once their server confirms.
 * De-duplication and vote persistence are the author's server's job. While a
 * vote is in flight the option carries `data-pending` and further clicks are
 * ignored (single-choice: the whole poll; multi-choice: that option) until
 * setCount / setCounts reports back.
 *
 * @attr {boolean} data-multi        - Allow multiple selections (default: single)
 * @attr {boolean} data-closed       - Read-only — show results, no voting
 * @attr {boolean} data-hide-counts  - Hide counts, percentages and bars (visual and AT)
 * @attr {boolean} disabled          - Disable voting
 * @attr {string}  aria-label        - Group label (moved onto the option group)
 * @attr {string}  data-label-vote / data-label-votes / data-label-your-choice /
 *                 data-label-closed / data-label-poll - text overrides
 *
 * Per-option attributes (on `<button data-option>`):
 *   data-option (required), data-count, data-mine, data-pending (output)
 *
 * @fires poll-wc:vote          - { option, action: 'add'|'remove', count, mine }
 *                                Single-choice: switching options emits a remove
 *                                for the previously-selected option BEFORE the add.
 * @fires poll-wc:closed-change - { closed }
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

const LABELS = {
  vote: 'vote',
  votes: 'votes',
  'your-choice': 'your choice',
  closed: 'closed',
  poll: 'Poll',
};

let seq = 0;

class PollWc extends VBElement {
  static observedAttributes = ['data-closed', 'data-multi', 'data-hide-counts', 'disabled'];

  /** @type {HTMLElement | null} */ #questionEl = null;
  /** @type {HTMLElement | null} */ #optionsList = null;
  /** @type {HTMLOutputElement | null} */ #total = null;

  setup() {
    // Reconnect: the rendered structure is already in place — reuse it.
    this.#optionsList = this.querySelector(':scope > .poll-options');
    if (this.#optionsList) {
      this.#questionEl = this.querySelector(':scope > .poll-question');
      this.#total = this.querySelector(':scope > output.poll-total');
    } else {
      this.#adoptForm();
      this.#build();
    }

    const group = this.#optionsList;
    if (!group) return false;
    this.#updateGroupRole();
    this.#scanOptions().forEach((opt) => this.#decorateOption(opt));
    this.listen(group, 'click', (e) => {
      const option = /** @type {Element} */ (e.target).closest?.('button[data-option]');
      if (option && option.parentElement === this.#optionsList) this.#onOptionClick(/** @type {HTMLButtonElement} */ (option));
    });
    this.listen(group, 'keydown', (e) => {
      const option = /** @type {Element} */ (e.target).closest?.('button[data-option]');
      if (option && option.parentElement === this.#optionsList) this.#onOptionKeydown(/** @type {KeyboardEvent} */ (e), /** @type {HTMLButtonElement} */ (option));
    });
    this.#refresh();
    return true;
  }

  teardown() {
    this.#questionEl = null;
    this.#optionsList = null;
    this.#total = null;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.#optionsList || oldVal === newVal) return;
    if (name === 'data-multi') this.#updateGroupRole();
    this.#refresh();
    if (name === 'data-closed') {
      this.dispatchEvent(new CustomEvent('poll-wc:closed-change', {
        bubbles: true,
        detail: { closed: this.hasAttribute('data-closed') },
      }));
    }
  }

  // ── Setup helpers ──────────────────────────────────────────────────

  /** Convert native `<form><fieldset>` radio/checkbox markup into button options. */
  #adoptForm() {
    const form = this.querySelector(':scope > form');
    if (!form || this.querySelector(':scope > button[data-option]')) return;
    const inputs = /** @type {HTMLInputElement[]} */ ([...form.querySelectorAll('input[type="radio"], input[type="checkbox"]')]);
    if (!inputs.length) return;

    const fieldset = form.querySelector('fieldset');
    const legend = fieldset?.querySelector(':scope > legend');
    const nodes = [];
    if (legend && !this.querySelector(':scope > [slot="question"]')) {
      const q = document.createElement('span');
      q.slot = 'question';
      q.append(...legend.childNodes);
      nodes.push(q);
    }
    if (inputs.some((i) => i.type === 'checkbox')) this.setAttribute('data-multi', '');
    if (fieldset?.disabled) this.setAttribute('data-closed', '');

    for (const input of inputs) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.option = input.value;
      btn.dataset.count = input.dataset.count || '0';
      if (input.checked) btn.setAttribute('data-mine', '');
      const label = input.closest('label') || (input.id ? form.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null);
      if (label) {
        input.remove();
        btn.append(...label.childNodes);
        normalizeWhitespace(btn);
      } else {
        btn.textContent = input.value;
      }
      nodes.push(btn);
    }
    form.replaceWith(...nodes);
  }

  #build() {
    const questionSlot = this.querySelector(':scope > [slot="question"]');
    const options = [...this.querySelectorAll(':scope > button[data-option]')];

    if (questionSlot) {
      this.#questionEl = document.createElement('div');
      this.#questionEl.className = 'poll-question';
      this.#questionEl.id = `poll-q-${++seq}`;
      this.#questionEl.appendChild(questionSlot);
    }

    this.#optionsList = document.createElement('div');
    this.#optionsList.className = 'poll-options';
    // The group carries the accessible name; the host is a generic element
    // and cannot be named, so an author aria-label moves onto the group.
    const authorLabel = this.getAttribute('aria-label');
    if (authorLabel) {
      this.#optionsList.setAttribute('aria-label', authorLabel);
      this.removeAttribute('aria-label');
    } else if (this.#questionEl) {
      this.#optionsList.setAttribute('aria-labelledby', this.#questionEl.id);
    } else {
      this.#optionsList.setAttribute('aria-label', this.#label('poll'));
    }
    this.#optionsList.append(...options);

    this.#total = document.createElement('output');
    this.#total.className = 'poll-total';
    this.#total.setAttribute('aria-live', 'polite');

    const children = [];
    if (this.#questionEl) children.push(this.#questionEl);
    children.push(this.#optionsList, this.#total);
    this.replaceChildren(...children);
  }

  #scanOptions() {
    if (!this.#optionsList) return [];
    return /** @type {HTMLButtonElement[]} */ ([...this.#optionsList.querySelectorAll(':scope > button[data-option]')]);
  }

  #updateGroupRole() {
    this.#optionsList?.setAttribute('role', this.hasAttribute('data-multi') ? 'group' : 'radiogroup');
  }

  /** Idempotent: wraps the authored label markup once, keeps it intact. */
  #decorateOption(option) {
    option.type = 'button';
    option.classList.add('poll-option');
    if (option.querySelector(':scope > .poll-option-label')) return;

    const label = document.createElement('span');
    label.className = 'poll-option-label';
    label.append(...option.childNodes);

    const bar = document.createElement('span');
    bar.className = 'poll-option-bar';
    bar.setAttribute('aria-hidden', 'true');

    const count = document.createElement('span');
    count.className = 'poll-option-count';
    count.setAttribute('aria-hidden', 'true');

    option.append(label, bar, count);
  }

  // ── Voting ─────────────────────────────────────────────────────────

  #inactive() {
    return this.hasAttribute('data-closed') || this.hasAttribute('disabled');
  }

  #onOptionClick(option) {
    if (this.#inactive()) return;
    const multi = this.hasAttribute('data-multi');
    const opts = this.#scanOptions();
    // In-flight guard: ignore until setCount/setCounts confirms.
    if (multi ? option.hasAttribute('data-pending') : opts.some((o) => o.hasAttribute('data-pending'))) return;

    const id = option.dataset.option;
    const count = Number(option.dataset.count) || 0;
    const mine = option.hasAttribute('data-mine');

    // Single-choice: if the user is switching to a NEW option, emit remove
    // for the previously-selected option BEFORE the add.
    if (!multi && !mine) {
      const prev = opts.find((o) => o.hasAttribute('data-mine') && o !== option);
      if (prev) {
        prev.setAttribute('data-pending', '');
        this.dispatchEvent(new CustomEvent('poll-wc:vote', {
          bubbles: true,
          detail: { option: prev.dataset.option, action: 'remove', count: Number(prev.dataset.count) || 0, mine: true },
        }));
      }
    }

    option.setAttribute('data-pending', '');
    this.#refreshBusy();
    this.dispatchEvent(new CustomEvent('poll-wc:vote', {
      bubbles: true,
      detail: { option: id, action: mine ? 'remove' : 'add', count, mine },
    }));
  }

  #onOptionKeydown(e, option) {
    // Multi-choice follows the APG checkbox pattern: every option is a Tab
    // stop, Space/Enter toggles (native button activation). No arrows.
    if (this.hasAttribute('data-multi')) return;

    const opts = this.#scanOptions();
    const i = opts.indexOf(option);
    const rtl = getComputedStyle(this).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next;
    switch (e.key) {
      case 'ArrowDown': case forward: next = (i + 1) % opts.length; break;
      case 'ArrowUp': case back: next = (i - 1 + opts.length) % opts.length; break;
      case 'Home': next = 0; break;
      case 'End': next = opts.length - 1; break;
      default: return;
    }
    e.preventDefault();
    const target = opts[next];
    this.#setRoving(target);
    target.focus();
    // APG radio group: moving focus also checks the option.
    if (!target.hasAttribute('data-mine')) this.#onOptionClick(target);
  }

  #setRoving(target) {
    for (const o of this.#scanOptions()) o.tabIndex = o === target ? 0 : -1;
  }

  // ── Render ─────────────────────────────────────────────────────────

  #label(key) {
    return this.getAttribute(`data-label-${key}`) || LABELS[key];
  }

  #locale() {
    const lang = this.closest('[lang]')?.getAttribute('lang') || undefined;
    try {
      return Intl.getCanonicalLocales(lang)[0];
    } catch {
      return undefined;
    }
  }

  #refreshBusy() {
    const busy = this.#scanOptions().some((o) => o.hasAttribute('data-pending'));
    if (busy) this.#optionsList?.setAttribute('aria-busy', 'true');
    else this.#optionsList?.removeAttribute('aria-busy');
  }

  #refresh() {
    const opts = this.#scanOptions();
    if (!opts.length) return;
    const total = opts.reduce((s, o) => s + (Number(o.dataset.count) || 0), 0);
    const closed = this.hasAttribute('data-closed');
    const inactive = this.#inactive();
    const multi = this.hasAttribute('data-multi');
    const hideCounts = this.hasAttribute('data-hide-counts');

    const locale = this.#locale();
    const num = new Intl.NumberFormat(locale);
    const pctFmt = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    const plural = new Intl.PluralRules(locale);
    const votes = (n) => `${num.format(n)} ${plural.select(n) === 'one' ? this.#label('vote') : this.#label('votes')}`;

    // Roving tabindex (single-choice): the selected option, else the one
    // that currently holds the tab stop, else the first.
    const tabStop = multi ? null
      : opts.find((o) => o.hasAttribute('data-mine'))
        || opts.find((o) => o.getAttribute('tabindex') === '0')
        || opts[0];

    for (const option of opts) {
      const count = Number(option.dataset.count) || 0;
      const mine = option.hasAttribute('data-mine');
      const share = total > 0 ? count / total : 0;

      option.style.setProperty('--option-pct', hideCounts ? '0' : String(Math.round(share * 1000) / 10));
      option.setAttribute('aria-checked', mine ? 'true' : 'false');
      option.setAttribute('role', multi ? 'checkbox' : 'radio');
      if (inactive) option.setAttribute('aria-disabled', 'true');
      else option.removeAttribute('aria-disabled');
      option.tabIndex = multi || option === tabStop ? 0 : -1;

      const countEl = option.querySelector(':scope > .poll-option-count');
      if (countEl) {
        countEl.textContent = hideCounts ? '' : `${num.format(count)} · ${pctFmt.format(share)}`;
      }

      const label = option.querySelector(':scope > .poll-option-label')?.textContent.replace(/\s+/g, ' ').trim() || option.dataset.option;
      const parts = [label];
      if (!hideCounts) parts.push(votes(count), pctFmt.format(share));
      if (mine) parts.push(this.#label('your-choice'));
      option.setAttribute('aria-label', parts.join(', '));
    }

    if (this.#total) {
      this.#total.textContent = closed ? `${votes(total)} · ${this.#label('closed')}` : votes(total);
    }
    this.#refreshBusy();
  }

  // ── Public API ─────────────────────────────────────────────────────

  /** Clear in-flight flags: one option (multi) or the whole poll (single). */
  #settle(option) {
    const multi = this.hasAttribute('data-multi');
    for (const o of this.#scanOptions()) {
      if (!multi || o === option) o.removeAttribute('data-pending');
    }
  }

  /**
   * Update a single option's count (and optionally its mine flag). Also
   * clears the pending flag — call it on failure too, with the old values,
   * to roll back.
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
    this.#settle(el);
    this.#refresh();
  }

  /**
   * Bulk-update counts. `mine` may be a string (single-choice) or string[] (multi).
   * Clears every pending flag.
   *
   * @param {Record<string, number>} counts
   * @param {{ mine?: string|string[] }} [opts]
   */
  setCounts(counts, opts = {}) {
    const mineList = Array.isArray(opts.mine) ? opts.mine : (opts.mine ? [opts.mine] : null);
    for (const el of this.#scanOptions()) {
      const id = el.dataset.option ?? '';
      if (counts[id] != null) el.dataset.count = String(Math.max(0, Number(counts[id]) || 0));
      if (mineList) {
        if (mineList.includes(id)) el.setAttribute('data-mine', '');
        else el.removeAttribute('data-mine');
      }
      el.removeAttribute('data-pending');
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

/** Trim the leading/trailing whitespace text left behind by a removed input. */
function normalizeWhitespace(el) {
  const first = el.firstChild;
  if (first?.nodeType === Node.TEXT_NODE) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last?.nodeType === Node.TEXT_NODE) last.textContent = last.textContent.replace(/\s+$/, '');
}

registerComponent('poll-wc', PollWc);

export { PollWc };
