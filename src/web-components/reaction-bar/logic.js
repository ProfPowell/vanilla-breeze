/**
 * reaction-bar: GitHub-style emoji reaction picker.
 *
 * Persistent in-flow bar of reaction chips (with counts + own-reaction flag)
 * plus a single auto-rendered trigger that opens a curated palette popover.
 * Composes <pop-over> for the palette surface (mirrors the selection-menu /
 * combo-box / context-menu / drop-down / tool-tip consolidation).
 *
 * Authors provide:
 *   1. Existing chips as `<button data-reaction data-count [data-mine]>` children
 *   2. Available reactions in a `<template data-palette>` child
 *   Either may carry `data-label` (or `aria-label`) to name the reaction for
 *   assistive tech; otherwise the emoji itself is the name.
 *
 * The component is presentational. Authors hook `reaction-bar:toggle` to make
 * the backend call, then update the bar via `setCount(reaction, count, opts)`.
 * The chip is marked `data-pending` / `aria-busy` from the click until that
 * `setCount` call, and further clicks on it are ignored meanwhile.
 *
 * Lifecycle: setup() re-runs on every reconnect. The DOM it builds (chip
 * decoration, trigger, palette) is guarded so it is built once, but every
 * listener is (re)wired on every setup() — they are delegated to the host and
 * the palette, and listen() drops them on disconnect.
 *
 * @attr {string} data-trigger-icon  - Text content of the trigger (default 😀)
 * @attr {string} data-trigger-label - aria-label for the trigger (default "Add reaction")
 * @attr {string} aria-label         - Label for the toolbar (default data-label-toolbar, then "Reactions")
 * @attr {string} data-label-toolbar - Default toolbar label (default "Reactions")
 * @attr {string} data-label-dialog  - Palette dialog label (default "Choose a reaction")
 * @attr {string} data-label-count-one   - Count phrase for the "one" plural category (default "{count} reaction")
 * @attr {string} data-label-count-other - Count phrase for every other category (default "{count} reactions")
 * @attr {boolean} data-disabled     - Read-only mode (no toggles, no palette); observed
 *
 * @fires reaction-bar:toggle - detail: { reaction, action: 'add'|'remove', count, mine } (count/mine are pre-toggle)
 * @fires reaction-bar:palette-open
 * @fires reaction-bar:palette-close
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
// Ensure <pop-over> is registered — reaction-bar composes it for the palette.
import '../pop-over/logic.js';

let reactionBarSeq = 0;

const DEFAULT_COUNT_LABELS = /** @type {Record<string, string>} */ ({
  one: '{count} reaction',
  other: '{count} reactions',
});

class ReactionBar extends VBElement {
  static get observedAttributes() { return ['data-disabled']; }

  /** @type {HTMLTemplateElement | null} */
  #template = null;
  /** @type {HTMLButtonElement | null} */
  #trigger = null;
  /** @type {any} */
  #popover = null;
  /** @type {HTMLElement | null} */
  #paletteList = null;
  /** Reactions picked from the palette with no chip yet, awaiting setCount. */
  #pendingNew = new Set();

  setup() {
    this.setAttribute('role', 'toolbar');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', this.getAttribute('data-label-toolbar') || 'Reactions');
    }

    // Capture the palette template (don't render its content into flow).
    this.#template = this.querySelector(':scope > template[data-palette]');

    // DOM building — each step is guarded so a reconnect does not duplicate.
    this.#scanChips().forEach((chip) => this.#decorateChip(chip));
    this.#buildTrigger();
    this.#buildPopover();
    this.#syncDisabled();
    this.#refreshTabindex();

    // Listener wiring — NOT guarded: listen() drops these on disconnect, so
    // they must be re-added on every setup().
    this.listen(this, 'click', this.#onClick);
    this.listen(this, 'keydown', this.#onKeydown);
    if (this.#popover) {
      this.listen(this.#popover, 'pop-over:show', this.#onPaletteShow);
      this.listen(this.#popover, 'pop-over:hide', this.#onPaletteHide);
      // Native toggle fires after the popover is rendered (pop-over:show is
      // dispatched from beforetoggle, while it is still display:none).
      this.listen(this.#popover, 'toggle', this.#onPaletteToggle);
    }
  }

  /**
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.hasAttribute('data-upgraded')) return;
    if (name === 'data-disabled') {
      this.#syncDisabled();
      this.#refreshTabindex();
    }
  }

  // ── i18n helpers ─────────────────────────────────────────────────────

  #locale() {
    return /** @type {HTMLElement | null} */ (this.closest('[lang]'))?.lang || undefined;
  }

  /** @param {number} n */
  #formatNumber(n) {
    try { return new Intl.NumberFormat(this.#locale()).format(n); } catch { return String(n); }
  }

  /** @param {number} n */
  #countLabel(n) {
    let cat = 'other';
    try { cat = new Intl.PluralRules(this.#locale()).select(n); } catch { /* keep other */ }
    // Author template for this CLDR category, else the author's "other",
    // else the English defaults.
    const tpl = this.getAttribute(`data-label-count-${cat}`)
      ?? this.getAttribute('data-label-count-other')
      ?? DEFAULT_COUNT_LABELS[cat]
      ?? DEFAULT_COUNT_LABELS.other;
    return tpl.replaceAll('{count}', this.#formatNumber(n));
  }

  // ── Chip decoration ──────────────────────────────────────────────────

  #scanChips() {
    return /** @type {HTMLButtonElement[]} */ ([...this.querySelectorAll(':scope > button[data-reaction]')]);
  }

  /** @param {HTMLButtonElement} chip */
  #decorateChip(chip) {
    if (chip.dataset.decorated === '') return;
    chip.dataset.decorated = '';
    chip.type = 'button';

    // Keep the author's name for the reaction (aria-label → data-label) so
    // the derived aria-label below can include it instead of overwriting it.
    const authorLabel = chip.dataset.label || chip.getAttribute('aria-label');
    if (authorLabel) chip.dataset.label = authorLabel;

    // Wrap original text content as the emoji slot, append a count span.
    const emojiText = chip.textContent?.trim() ?? '';
    chip.replaceChildren();
    const emoji = document.createElement('span');
    emoji.className = 'reaction-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = emojiText;
    const count = document.createElement('span');
    count.className = 'reaction-count';
    count.setAttribute('aria-hidden', 'true');
    chip.append(emoji, count);

    this.#refreshChip(chip);
  }

  /**
   * Update count + mine state + ARIA on a chip without re-decorating.
   * @param {HTMLButtonElement} chip
   */
  #refreshChip(chip) {
    const countN = Number(chip.dataset.count) || 0;
    const mine = chip.hasAttribute('data-mine');
    const name = chip.dataset.label || chip.querySelector('.reaction-emoji')?.textContent || chip.dataset.reaction || '';
    const countEl = chip.querySelector('.reaction-count');
    if (countEl) countEl.textContent = countN > 0 ? this.#formatNumber(countN) : '';
    // aria-pressed carries the own-reaction state; the label carries name + count.
    chip.setAttribute('aria-pressed', mine ? 'true' : 'false');
    chip.setAttribute('aria-label', `${name}, ${this.#countLabel(countN)}`);
  }

  // ── Events ───────────────────────────────────────────────────────────

  /** @param {MouseEvent} e */
  #onClick = (e) => {
    const btn = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target)?.closest?.('button[data-reaction]'));
    if (!btn) return;
    if (btn.parentElement === this) this.#onChipClick(/** @type {HTMLButtonElement} */ (btn));
    else if (this.#paletteList?.contains(btn)) this.#onPaletteClick(btn);
  };

  /** @param {KeyboardEvent} e */
  #onKeydown = (e) => {
    const target = /** @type {Node} */ (e.target);
    if (this.#paletteList?.contains(target)) this.#onPaletteKeydown(e);
    else this.#onBarKeydown(e);
  };

  /** @param {HTMLButtonElement} chip */
  #onChipClick(chip) {
    if (this.hasAttribute('data-disabled')) return;
    // In-flight guard: ignore until setCount() confirms.
    if (chip.hasAttribute('data-pending')) return;
    const reaction = chip.dataset.reaction ?? '';
    const count = Number(chip.dataset.count) || 0;
    const mine = chip.hasAttribute('data-mine');
    chip.setAttribute('data-pending', '');
    chip.setAttribute('aria-busy', 'true');
    this.dispatchEvent(new CustomEvent('reaction-bar:toggle', {
      bubbles: true,
      detail: { reaction, action: mine ? 'remove' : 'add', count, mine },
    }));
  }

  /** @param {HTMLElement} btn */
  #onPaletteClick(btn) {
    if (this.hasAttribute('data-disabled')) return;
    const reaction = btn.dataset.reaction ?? '';

    // If a chip already exists for this reaction, defer to the chip-toggle
    // path so the action semantics (add vs remove) match the chip's state.
    const existing = this.#chipFor(reaction);
    if (existing) {
      this.#onChipClick(existing);
    } else if (!this.#pendingNew.has(reaction)) {
      this.#pendingNew.add(reaction);
      this.dispatchEvent(new CustomEvent('reaction-bar:toggle', {
        bubbles: true,
        detail: { reaction, action: 'add', count: 0, mine: false },
      }));
    }
    this.#popover?.hide();
    this.#trigger?.focus();
  }

  #onPaletteShow = () => {
    this.#trigger?.setAttribute('aria-expanded', 'true');
    this.dispatchEvent(new CustomEvent('reaction-bar:palette-open', { bubbles: true }));
  };

  #onPaletteHide = () => {
    this.#trigger?.setAttribute('aria-expanded', 'false');
    this.dispatchEvent(new CustomEvent('reaction-bar:palette-close', { bubbles: true }));
  };

  /** @param {Event} e */
  #onPaletteToggle = (e) => {
    if (/** @type {any} */ (e).newState !== 'open') return;
    // Focus the first palette option for keyboard users.
    /** @type {HTMLElement | null | undefined} */ (this.#paletteList?.querySelector('button'))?.focus();
  };

  // ── Trigger + palette ────────────────────────────────────────────────

  #buildTrigger() {
    // Reconnect guard: the trigger moved back with the host — rebuilding
    // would append a duplicate.
    if (this.#trigger?.parentNode === this) return;

    this.#trigger = document.createElement('button');
    this.#trigger.type = 'button';
    this.#trigger.className = 'reaction-trigger';
    this.#trigger.textContent = this.getAttribute('data-trigger-icon') || '😀';
    this.#trigger.setAttribute('aria-label', this.getAttribute('data-trigger-label') || 'Add reaction');
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    this.appendChild(this.#trigger);
  }

  #buildPopover() {
    if (!this.#template || !this.#trigger) return;
    // Reconnect guard — see #buildTrigger.
    if (this.#popover?.parentNode === this) return;

    const popoverId = `reaction-bar-palette-${++reactionBarSeq}`;
    this.#trigger.setAttribute('popovertarget', popoverId);

    this.#popover = document.createElement('pop-over');
    this.#popover.id = popoverId;
    this.#popover.className = 'reaction-palette';
    this.#popover.dataset.position = 'top';
    this.#popover.setAttribute('role', 'dialog');
    this.#popover.setAttribute('aria-label', this.getAttribute('data-label-dialog') || 'Choose a reaction');

    this.#paletteList = document.createElement('div');
    this.#paletteList.className = 'reaction-palette-list';
    this.#paletteList.setAttribute('role', 'group');
    this.#paletteList.setAttribute('aria-label', this.getAttribute('aria-label') || 'Reactions');

    // Clone palette buttons from the template. Clicks are delegated to the host.
    const fragment = this.#template.content.cloneNode(true);
    /** @type {HTMLButtonElement[]} */ ([.../** @type {DocumentFragment} */ (fragment).querySelectorAll('button[data-reaction]')]).forEach((btn) => {
      btn.type = 'button';
      btn.classList.add('reaction-palette-option');
      // Name: author aria-label, else data-label, else the emoji content.
      if (!btn.hasAttribute('aria-label') && btn.dataset.label) btn.setAttribute('aria-label', btn.dataset.label);
      this.#paletteList?.appendChild(btn);
    });

    this.#popover.appendChild(this.#paletteList);
    this.appendChild(this.#popover);
  }

  #syncDisabled() {
    const disabled = this.hasAttribute('data-disabled');
    if (this.#trigger) this.#trigger.disabled = disabled;
    for (const chip of this.#scanChips()) {
      if (disabled) chip.setAttribute('aria-disabled', 'true');
      else chip.removeAttribute('aria-disabled');
    }
    if (disabled && this.#popover?.matches(':popover-open')) this.#popover.hide();
  }

  /** @param {KeyboardEvent} e */
  #onPaletteKeydown(e) {
    if (!this.#paletteList) return;
    const opts = /** @type {HTMLElement[]} */ ([...this.#paletteList.querySelectorAll('button')]);
    const i = opts.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    if (i === -1) return;
    const step = this.#arrowStep(e.key, true);
    let next;
    if (step) next = (i + step + opts.length) % opts.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = opts.length - 1;
    else return;
    e.preventDefault();
    opts[next].focus();
  }

  /**
   * +1 / -1 for an arrow key in reading order (mirrored in RTL), 0 otherwise.
   * @param {string} key
   * @param {boolean} vertical  also accept ArrowUp / ArrowDown
   */
  #arrowStep(key, vertical) {
    const rtl = getComputedStyle(this).direction === 'rtl';
    if (key === 'ArrowRight') return rtl ? -1 : 1;
    if (key === 'ArrowLeft') return rtl ? 1 : -1;
    if (vertical && key === 'ArrowDown') return 1;
    if (vertical && key === 'ArrowUp') return -1;
    return 0;
  }

  // ── Roving tabindex across the toolbar ───────────────────────────────

  #toolbarFocusables() {
    return /** @type {HTMLButtonElement[]} */ ([...this.querySelectorAll(':scope > button[data-reaction], :scope > .reaction-trigger')])
      .filter((el) => !el.disabled);
  }

  /**
   * Keep exactly one tab stop. The current tab stop is kept when it is still
   * a toolbar item; otherwise `preferred`, otherwise the first item.
   * @param {HTMLElement | null} [preferred]
   */
  #refreshTabindex(preferred = null) {
    const items = this.#toolbarFocusables();
    const current = preferred && items.includes(/** @type {HTMLButtonElement} */ (preferred))
      ? preferred
      : items.find((el) => el.getAttribute('tabindex') === '0') ?? items[0];
    items.forEach((el) => el.setAttribute('tabindex', el === current ? '0' : '-1'));
    if (this.#trigger?.disabled) this.#trigger.removeAttribute('tabindex');
  }

  /** @param {KeyboardEvent} e */
  #onBarKeydown(e) {
    const items = this.#toolbarFocusables();
    const i = items.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
    if (i === -1) return;
    const step = this.#arrowStep(e.key, false);
    let next;
    if (step) next = (i + step + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    this.#refreshTabindex(items[next]);
    items[next].focus();
  }

  /** @param {string} reaction */
  #chipFor(reaction) {
    return /** @type {HTMLButtonElement | null} */ (this.querySelector(`:scope > button[data-reaction="${CSS.escape(reaction)}"]`));
  }

  // ── Public API ───────────────────────────────────────────────────────

  /**
   * Update a chip's count and/or own-reaction state, and clear its pending
   * flag (call it on failure too, with the old values, to roll back).
   * Creates the chip from the palette template if it doesn't exist yet;
   * removes the chip when count drops to 0.
   *
   * @param {string} reaction
   * @param {number} count
   * @param {{ mine?: boolean }} [opts]
   */
  setCount(reaction, count, opts = {}) {
    const n = Number(count) || 0;
    this.#pendingNew.delete(reaction);
    let chip = this.#chipFor(reaction);

    if (n <= 0) {
      if (chip) {
        const items = this.#toolbarFocusables();
        const idx = items.indexOf(chip);
        const neighbour = items[idx + 1] ?? items[idx - 1] ?? null;
        const hadFocus = chip.contains(document.activeElement);
        const wasTabStop = chip.getAttribute('tabindex') === '0';
        chip.remove();
        this.#refreshTabindex(wasTabStop || hadFocus ? neighbour : null);
        if (hadFocus) neighbour?.focus();
      }
      return;
    }

    if (!chip) {
      // Author the new chip from the palette template button so it keeps the
      // author's data-label / aria-label / title.
      const source = /** @type {HTMLButtonElement | null | undefined} */ (
        this.#template?.content.querySelector(`button[data-reaction="${CSS.escape(reaction)}"]`));
      if (source) {
        chip = /** @type {HTMLButtonElement} */ (source.cloneNode(true));
      } else {
        chip = document.createElement('button');
        chip.dataset.reaction = reaction;
        chip.textContent = reaction;
      }
      // Insert before the trigger so the trigger stays at the end.
      this.insertBefore(chip, this.#trigger?.parentNode === this ? this.#trigger : null);
      this.#decorateChip(chip);
      if (this.hasAttribute('data-disabled')) chip.setAttribute('aria-disabled', 'true');
    }

    chip.dataset.count = String(n);
    if (opts.mine === true) chip.setAttribute('data-mine', '');
    else if (opts.mine === false) chip.removeAttribute('data-mine');
    chip.removeAttribute('data-pending');
    chip.removeAttribute('aria-busy');
    this.#refreshChip(chip);
    this.#refreshTabindex();
  }

  openPalette() {
    if (this.hasAttribute('data-disabled')) return;
    this.#popover?.show();
  }

  closePalette() { this.#popover?.hide(); }
}

registerComponent('reaction-bar', ReactionBar);

export { ReactionBar };
