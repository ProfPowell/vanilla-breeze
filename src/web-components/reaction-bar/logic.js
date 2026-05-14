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
 *
 * The component is presentational. Authors hook `reaction-bar:toggle` to make
 * the backend call, then update the bar via `setCount(reaction, count, opts)`.
 *
 * @attr {string} data-trigger-icon  - Text content of the trigger (default 😀)
 * @attr {string} data-trigger-label - aria-label for the trigger (default "Add reaction")
 * @attr {string} aria-label         - Label for the toolbar (default "Reactions")
 * @attr {boolean} data-disabled     - Read-only mode (no toggles, no palette)
 *
 * @fires reaction-bar:toggle - detail: { reaction, action: 'add'|'remove', count, mine }
 * @fires reaction-bar:palette-open
 * @fires reaction-bar:palette-close
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
// Ensure <pop-over> is registered — reaction-bar composes it for the palette.
import '../pop-over/logic.js';

let reactionBarSeq = 0;

class ReactionBar extends VBElement {
  #template;     // <template data-palette> reference (kept in slot, not rendered)
  #trigger;      // auto-rendered trigger button
  #popover;      // auto-rendered <pop-over>
  #paletteList;  // inner container in the popover

  setup() {
    this.setAttribute('role', 'toolbar');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Reactions');
    }

    // Capture the palette template (don't render its content into flow).
    this.#template = this.querySelector(':scope > template[data-palette]');

    // Decorate existing chips authored as direct <button> children.
    this.#scanChips().forEach((chip) => this.#decorateChip(chip));

    // Auto-render the trigger + popover.
    this.#buildTrigger();
    this.#buildPopover();

    // Keyboard nav across chips and trigger (roving tabindex).
    this.#refreshTabindex();
    this.listen(this, 'keydown', this.#onBarKeydown);
  }

  // ── Chip decoration ──────────────────────────────────────────────────

  #scanChips() {
    return [...this.querySelectorAll(':scope > button[data-reaction]')];
  }

  #decorateChip(chip) {
    if (chip.dataset.decorated === '') return;
    chip.dataset.decorated = '';
    chip.type = 'button';
    chip.setAttribute('role', 'button');

    // Wrap original text content as the emoji slot, append a count span.
    const emojiText = chip.textContent;
    chip.replaceChildren();
    const emoji = document.createElement('span');
    emoji.className = 'reaction-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = emojiText;
    const count = document.createElement('span');
    count.className = 'reaction-count';
    count.setAttribute('aria-hidden', 'true');
    chip.appendChild(emoji);
    chip.appendChild(count);

    this.#refreshChip(chip);
    this.listen(chip, 'click', () => this.#onChipClick(chip));
  }

  /** Update count + mine state + ARIA on a chip without re-decorating. */
  #refreshChip(chip) {
    const countN = Number(chip.dataset.count) || 0;
    const mine = chip.hasAttribute('data-mine');
    const emoji = chip.querySelector('.reaction-emoji')?.textContent ?? '';
    chip.querySelector('.reaction-count').textContent = countN > 0 ? String(countN) : '';
    chip.setAttribute('aria-pressed', mine ? 'true' : 'false');
    const noun = countN === 1 ? 'reaction' : 'reactions';
    const own = mine ? ', you reacted' : '';
    chip.setAttribute('aria-label', `${emoji}, ${countN} ${noun}${own}`);
  }

  #onChipClick(chip) {
    if (this.hasAttribute('data-disabled')) return;
    const reaction = chip.dataset.reaction;
    const count = Number(chip.dataset.count) || 0;
    const mine = chip.hasAttribute('data-mine');
    this.dispatchEvent(new CustomEvent('reaction-bar:toggle', {
      bubbles: true,
      detail: { reaction, action: mine ? 'remove' : 'add', count, mine },
    }));
  }

  // ── Trigger + palette ────────────────────────────────────────────────

  #buildTrigger() {
    this.#trigger = document.createElement('button');
    this.#trigger.type = 'button';
    this.#trigger.className = 'reaction-trigger';
    this.#trigger.textContent = this.getAttribute('data-trigger-icon') || '😀';
    this.#trigger.setAttribute('aria-label', this.getAttribute('data-trigger-label') || 'Add reaction');
    this.#trigger.setAttribute('aria-haspopup', 'dialog');
    this.#trigger.setAttribute('aria-expanded', 'false');
    if (this.hasAttribute('data-disabled')) this.#trigger.disabled = true;
    this.appendChild(this.#trigger);
  }

  #buildPopover() {
    if (!this.#template) return;

    const popoverId = `reaction-bar-palette-${++reactionBarSeq}`;
    this.#trigger.setAttribute('popovertarget', popoverId);

    this.#popover = document.createElement('pop-over');
    this.#popover.id = popoverId;
    this.#popover.className = 'reaction-palette';
    this.#popover.dataset.position = 'top';
    this.#popover.setAttribute('role', 'dialog');
    this.#popover.setAttribute('aria-label', 'Choose a reaction');

    this.#paletteList = document.createElement('div');
    this.#paletteList.className = 'reaction-palette-list';
    this.#paletteList.setAttribute('role', 'group');

    // Clone palette buttons from the template; wire click handlers.
    const fragment = this.#template.content.cloneNode(true);
    [...fragment.querySelectorAll('button[data-reaction]')].forEach((btn) => {
      btn.type = 'button';
      btn.classList.add('reaction-palette-option');
      const emoji = btn.textContent;
      btn.setAttribute('aria-label', emoji);
      this.listen(btn, 'click', () => this.#onPaletteClick(btn));
      this.#paletteList.appendChild(btn);
    });

    this.#popover.appendChild(this.#paletteList);
    this.appendChild(this.#popover);

    // Track open/close to mirror aria-expanded and dispatch friendly events.
    this.listen(this.#popover, 'pop-over:show', () => {
      this.#trigger.setAttribute('aria-expanded', 'true');
      this.dispatchEvent(new CustomEvent('reaction-bar:palette-open', { bubbles: true }));
      // Focus first palette option for keyboard users.
      this.#paletteList.querySelector('button')?.focus();
    });
    this.listen(this.#popover, 'pop-over:hide', () => {
      this.#trigger.setAttribute('aria-expanded', 'false');
      this.dispatchEvent(new CustomEvent('reaction-bar:palette-close', { bubbles: true }));
    });

    // Keyboard nav inside the palette
    this.listen(this.#paletteList, 'keydown', this.#onPaletteKeydown);
  }

  #onPaletteClick(btn) {
    if (this.hasAttribute('data-disabled')) return;
    const reaction = btn.dataset.reaction;

    // If a chip already exists for this reaction, defer to the chip-toggle
    // path so the action semantics (add vs remove) match the chip's state.
    const existing = this.querySelector(`:scope > button[data-reaction="${CSS.escape(reaction)}"]`);
    if (existing) {
      this.#onChipClick(existing);
    } else {
      this.dispatchEvent(new CustomEvent('reaction-bar:toggle', {
        bubbles: true,
        detail: { reaction, action: 'add', count: 0, mine: false },
      }));
    }
    this.#popover?.hide();
    this.#trigger.focus();
  }

  #onPaletteKeydown = (e) => {
    const opts = [...this.#paletteList.querySelectorAll('button')];
    const i = opts.indexOf(document.activeElement);
    if (i === -1) return;
    let next = i;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown':
        e.preventDefault(); next = (i + 1) % opts.length; break;
      case 'ArrowLeft': case 'ArrowUp':
        e.preventDefault(); next = (i - 1 + opts.length) % opts.length; break;
      case 'Home':
        e.preventDefault(); next = 0; break;
      case 'End':
        e.preventDefault(); next = opts.length - 1; break;
      default: return;
    }
    opts[next].focus();
  };

  // ── Roving tabindex across the toolbar ───────────────────────────────

  #toolbarFocusables() {
    return [...this.querySelectorAll(':scope > button[data-reaction], :scope > .reaction-trigger')];
  }

  #refreshTabindex() {
    const items = this.#toolbarFocusables();
    items.forEach((el, idx) => el.setAttribute('tabindex', idx === 0 ? '0' : '-1'));
  }

  #onBarKeydown = (e) => {
    // Only handle keys on direct toolbar items (chips + trigger), not the popover.
    const items = this.#toolbarFocusables();
    const i = items.indexOf(document.activeElement);
    if (i === -1) return;
    let next = i;
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault(); next = (i + 1) % items.length; break;
      case 'ArrowLeft':
        e.preventDefault(); next = (i - 1 + items.length) % items.length; break;
      case 'Home':
        e.preventDefault(); next = 0; break;
      case 'End':
        e.preventDefault(); next = items.length - 1; break;
      default: return;
    }
    items.forEach((el, idx) => el.setAttribute('tabindex', idx === next ? '0' : '-1'));
    items[next].focus();
  };

  // ── Public API ───────────────────────────────────────────────────────

  /**
   * Update a chip's count and/or own-reaction state. Creates the chip from
   * the palette template if it doesn't exist yet. Removes the chip when
   * count drops to 0.
   *
   * @param {string} reaction
   * @param {number} count
   * @param {{ mine?: boolean }} [opts]
   */
  setCount(reaction, count, opts = {}) {
    const n = Number(count) || 0;
    let chip = this.querySelector(`:scope > button[data-reaction="${CSS.escape(reaction)}"]`);

    if (n <= 0) {
      if (chip) {
        chip.remove();
        this.#refreshTabindex();
      }
      return;
    }

    if (!chip) {
      // Find the emoji from the palette template to author the new chip.
      const palette = this.#template?.content.querySelector(`button[data-reaction="${CSS.escape(reaction)}"]`);
      const emoji = palette ? palette.textContent : reaction;
      chip = document.createElement('button');
      chip.dataset.reaction = reaction;
      chip.textContent = emoji;
      // Insert before the trigger so trigger stays at the end.
      this.insertBefore(chip, this.#trigger);
      this.#decorateChip(chip);
    }

    chip.dataset.count = String(n);
    if (opts.mine === true) chip.setAttribute('data-mine', '');
    else if (opts.mine === false) chip.removeAttribute('data-mine');
    this.#refreshChip(chip);
    this.#refreshTabindex();
  }

  openPalette() { this.#popover?.show(); }
  closePalette() { this.#popover?.hide(); }
}

registerComponent('reaction-bar', ReactionBar);

export { ReactionBar };
