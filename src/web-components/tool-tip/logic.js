import { VBElement } from '../../lib/vb-element.js';
import { registerComponent } from '../../lib/bundle-registry.js';
// Ensure <pop-over> is registered — tool-tip composes it for its popover surface.
import '../pop-over/logic.js';

/**
 * tool-tip: Enhanced tooltip with Popover API + interestfor
 *
 * Composes <pop-over> for the popover surface (popover attribute, anchor
 * positioning, light-dismiss, display:none cascade re-assertion) and
 * layers tooltip-specific behavior on top: interestfor wiring, hover/focus
 * delay, ARIA describedby, title attribute hand-off, and centered
 * anchor positioning via the [role="tooltip"][popover] cascade.
 *
 * Variants:
 *   - default: classic text tooltip (popover="hint", center-aligned).
 *   - card:    rich hover card (popover="manual", corner-aligned via
 *              <pop-over data-position>).
 *
 * @attr {string} content - Simple text tooltip content
 * @attr {string} position - 'top' (default), 'bottom', 'left', 'right'
 * @attr {number} delay - Show delay in ms (default: 200)
 * @attr {string} variant - omit for tooltip (default), 'card' for hover card
 *
 * @example Simple text tooltip
 * <tool-tip content="Save your changes">
 *   <button>Save</button>
 * </tool-tip>
 *
 * @example Rich content tooltip (use template for HTML)
 * <tool-tip position="top">
 *   <button>Hover me</button>
 *   <template data-tooltip>
 *     <strong>Formatted</strong> content with <kbd>Ctrl+S</kbd>
 *   </template>
 * </tool-tip>
 *
 * @example Card variant (rich hover card)
 * <tool-tip variant="card">
 *   <a href="/user/jane" data-trigger>Jane Smith</a>
 *   <section data-content>
 *     <h4>Jane Smith</h4>
 *     <p>Senior Developer</p>
 *   </section>
 * </tool-tip>
 */

// Elements that support native interestfor (spec-defined)
const INTERESTFOR_TAGS = new Set(['BUTTON', 'A', 'AREA']);

const supportsAnchor = CSS.supports('anchor-name', '--x');

/* popover="hint" is newer than the Popover API. Where it is missing,
   pop-over would fall back to "auto", and showing an auto popover closes
   every other open auto popover (drop-down, combo-box listbox…). Tooltips
   fall back to "manual" instead and supply Escape + outside-dismiss here. */
const supportsHint = (() => {
  const probe = document.createElement('span');
  probe.setAttribute('popover', 'hint');
  return /** @type {any} */ (probe).popover === 'hint';
})();

const VIEWPORT_GUTTER = 8;

/**
 * Check if interestfor can be used on a specific trigger element.
 * Native interestfor only works on button/a/area; our polyfill supports any element.
 */
function canUseInterestFor(trigger) {
  if (document.documentElement.hasAttribute('data-interest-polyfill')) return true;
  if ('interestForElement' in HTMLButtonElement.prototype) {
    return INTERESTFOR_TAGS.has(trigger.tagName);
  }
  return false;
}

/**
 * True when the element has an accessible name that doesn't come from
 * its title attribute.
 * @param {HTMLElement} el
 */
function hasOwnName(el) {
  if (el.getAttribute('aria-label')?.trim()) return true;
  if (el.hasAttribute('aria-labelledby')) return true;
  if (/** @type {any} */ (el).labels?.length) return true;
  if (el.textContent?.trim()) return true;
  if (el instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(el.type) && el.value) return true;
  return !!el.querySelector('img[alt]:not([alt=""]), [aria-label]:not([aria-hidden="true"])');
}

/**
 * @param {Element} el
 * @param {string} attr
 * @param {string} id
 */
function addIdRef(el, attr, id) {
  const ids = (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);
  if (ids.includes(id)) return false;
  el.setAttribute(attr, [...ids, id].join(' '));
  return true;
}

/**
 * @param {Element} el
 * @param {string} attr
 * @param {string} id
 */
function removeIdRef(el, attr, id) {
  const ids = (el.getAttribute(attr) || '').split(/\s+/).filter((t) => t && t !== id);
  if (ids.length) el.setAttribute(attr, ids.join(' '));
  else el.removeAttribute(attr);
}

let toolTipSeq = 0;

class ToolTip extends VBElement {
  /** @type {HTMLElement | null} */ #trigger = null;
  /** @type {HTMLElement | null} */ #popover = null;
  #showTimer;
  #hideTimer;
  #isCard = false;
  #useInterestFor = false;
  /** @type {string | undefined} */ #savedTitle;
  /** aria-label this instance copied from title (removed in teardown). */
  /** @type {string | undefined} */ #addedLabel;
  /** Id refs this instance added: [attr, id] pairs, removed in teardown. */
  /** @type {Array<[string, string]>} */ #addedRefs = [];
  /** Card content moved into the pop-over, with how to put it back. */
  /** @type {{ node: HTMLElement, next: Node | null, hidden: boolean } | null} */ #movedContent = null;
  #ownsExpanded = false;
  /** Set while Escape hands focus back to the trigger (don't reopen). */
  #returningFocus = false;

  setup() {
    this.#isCard = this.getAttribute('variant') === 'card';
    return this.#isCard ? this.#setupCard() : this.#setupTooltip();
  }

  // --- Regular tooltip setup ---
  #setupTooltip() {
    // Find trigger (first non-template child that isn't our own surface)
    this.#trigger = /** @type {HTMLElement | null} */ (
      this.querySelector(':scope > :not(template):not(pop-over.tooltip)'));
    if (!this.#trigger) return false;

    this.#useInterestFor = canUseInterestFor(this.#trigger);

    // Content priority: template > content attribute > title on trigger
    const template = this.querySelector(':scope > template[data-tooltip]');
    const dataContent = this.getAttribute('content');
    const titleContent = this.#trigger.getAttribute('title');

    if (!template && !dataContent && !titleContent) return false;

    let titleIsName = false;
    // Remove title to prevent native double-tooltip; restore on teardown.
    if (titleContent) {
      /* The title may be the trigger's only name (icon-only button). Keep
         it as aria-label, otherwise removing title would leave it unnamed. */
      if (!hasOwnName(this.#trigger)) {
        this.#trigger.setAttribute('aria-label', titleContent);
        this.#addedLabel = titleContent;
        titleIsName = !template && !dataContent;
      }
      this.#savedTitle = titleContent;
      this.#trigger.removeAttribute('title');
    }

    const position = this.getAttribute('position') || 'top';
    if (!this.#trigger.id) this.#trigger.id = `tooltip-trigger-${++toolTipSeq}`;

    /* Compose <pop-over> as the popover surface. pop-over owns:
       - the popover attribute (from data-mode)
       - anchor-name wiring on the trigger
       - display:none cascade re-assertion (popover_display_gotcha)
       - JS-driven positioning fallback when anchor-positioning is unavailable
       tool-tip's responsibility: tooltip-specific role/visual classes, the
       data-tooltip-position hook the native tooltip cascade uses for
       center alignment, and centring the JS fallback. */
    const tip = document.createElement('pop-over');
    tip.className = 'tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.dataset.mode = supportsHint ? 'hint' : 'manual';
    tip.dataset.anchor = this.#trigger.id;
    tip.dataset.tooltipPosition = position;
    // pop-over's no-anchor fallback reads data-position for the side.
    if (!supportsAnchor) tip.dataset.position = position;
    tip.id = `tooltip-${++toolTipSeq}`;

    // Content
    if (template) tip.innerHTML = template.innerHTML;
    else tip.textContent = dataContent || titleContent;

    // Arrow
    const arrow = document.createElement('span');
    arrow.className = 'tooltip-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    tip.appendChild(arrow);

    this.appendChild(tip);
    this.#popover = tip;

    /* The tip describes the trigger — unless it only repeats the name we
       just moved into aria-label. Appended to (not replacing) authored
       describedby ids such as form hints. */
    if (!titleIsName) this.#addRef('aria-describedby', tip.id);

    if (this.#useInterestFor) {
      this.#trigger.setAttribute('interestfor', tip.id);
    } else {
      // JS-fallback hover/focus listeners
      this.listen(this.#trigger, 'mouseenter', this.#scheduleShow);
      this.listen(this.#trigger, 'mouseleave', this.#scheduleHide);
      this.listen(this.#trigger, 'focus', this.#showImmediate);
      this.listen(this.#trigger, 'blur', this.#hideImmediate);
      this.listen(tip, 'mouseenter', this.#cancelHide);
      this.listen(tip, 'mouseleave', this.#scheduleHide);
    }
    if (!supportsHint) this.#listenDismiss();

    if (!supportsAnchor) {
      this.listen(tip, 'toggle', (/** @type {any} */ e) => {
        if (e.newState === 'open') this.#centerFallback();
      });
      const recenter = () => { if (this.isVisible) this.#centerFallback(); };
      this.listen(window, 'resize', recenter);
      this.listen(window, 'scroll', recenter, { capture: true, passive: true });
    }

    this.#relayEvents(tip);
    return true;
  }

  // --- Card variant setup ---
  #setupCard() {
    this.#trigger = /** @type {HTMLElement | null} */ (this.querySelector(':scope > [data-trigger]'));
    const content = /** @type {HTMLElement | null} */ (this.querySelector(':scope > [data-content]'));
    if (!this.#trigger || !content) return false;

    this.#useInterestFor = canUseInterestFor(this.#trigger);
    if (!this.#trigger.id) this.#trigger.id = `tooltip-trigger-${++toolTipSeq}`;

    /* Cards need explicit show/hide (interactive content), so mode=manual.
       Corner-aligned via pop-over's data-position (defaults to bottom). */
    const card = document.createElement('pop-over');
    card.className = 'hover-card';
    card.dataset.mode = 'manual';
    card.dataset.anchor = this.#trigger.id;
    card.dataset.position = this.getAttribute('position') || 'bottom';
    card.id = `hc-${++toolTipSeq}`;

    /* Move content into the card; teardown() puts it back exactly, so a
       remove + re-insert finds [data-content] again. */
    this.#movedContent = { node: content, next: content.nextSibling, hidden: content.hidden };
    card.appendChild(content);
    content.removeAttribute('data-content');
    content.hidden = false;

    this.appendChild(card);
    this.#popover = card;

    // ARIA: the trigger controls an expandable card.
    this.#addRef('aria-controls', card.id);
    if (!this.#trigger.hasAttribute('aria-expanded')) {
      this.#trigger.setAttribute('aria-expanded', 'false');
      this.#ownsExpanded = true;
    }

    if (this.#useInterestFor) {
      this.#trigger.setAttribute('interestfor', card.id);
    } else {
      this.listen(this.#trigger, 'mouseenter', this.#scheduleShow);
      this.listen(this.#trigger, 'mouseleave', this.#scheduleHide);
      this.listen(this.#trigger, 'focus', this.#showImmediate);
      this.listen(this.#trigger, 'blur', this.#scheduleHide);
      this.listen(card, 'mouseenter', this.#cancelHide);
      this.listen(card, 'mouseleave', this.#scheduleHide);
      // Keyboard: tabbing into the card keeps it open; leaving closes it.
      this.listen(card, 'focusin', this.#cancelHide);
      this.listen(card, 'focusout', (/** @type {FocusEvent} */ e) => {
        if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
        this.#scheduleHide();
      });
    }
    this.#listenDismiss();

    this.listen(card, 'pop-over:show', () => {
      if (this.#ownsExpanded) this.#trigger?.setAttribute('aria-expanded', 'true');
    });
    this.listen(card, 'pop-over:hide', () => {
      if (this.#ownsExpanded) this.#trigger?.setAttribute('aria-expanded', 'false');
    });
    this.#relayEvents(card);
    return true;
  }

  teardown() {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    const trigger = this.#trigger;
    if (trigger) {
      if (this.#useInterestFor) trigger.removeAttribute('interestfor');
      for (const [attr, id] of this.#addedRefs) removeIdRef(trigger, attr, id);
      if (this.#addedLabel !== undefined && trigger.getAttribute('aria-label') === this.#addedLabel) {
        trigger.removeAttribute('aria-label');
      }
      if (this.#ownsExpanded) trigger.removeAttribute('aria-expanded');
      if (this.#savedTitle) trigger.setAttribute('title', this.#savedTitle);
    }
    this.#addedRefs = [];
    this.#addedLabel = undefined;
    this.#savedTitle = undefined;
    this.#ownsExpanded = false;

    // Card: hand the content back to the host before dropping the card.
    if (this.#movedContent) {
      const { node, next, hidden } = this.#movedContent;
      node.setAttribute('data-content', '');
      node.hidden = hidden;
      if (next && next.parentNode === this) this.insertBefore(node, next);
      else this.insertBefore(node, this.#popover?.parentNode === this ? this.#popover : null);
      this.#movedContent = null;
    }
    if (this.#popover) {
      this.#popover.remove();
      this.#popover = null;
    }
    this.#trigger = null;
    this.setState('show-pending', false);
  }

  /**
   * @param {string} attr
   * @param {string} id
   */
  #addRef(attr, id) {
    if (this.#trigger && addIdRef(this.#trigger, attr, id)) this.#addedRefs.push([attr, id]);
  }

  /** @param {HTMLElement} surface */
  #relayEvents(surface) {
    // Re-emit pop-over's show/hide under tool-tip's namespace
    this.listen(surface, 'pop-over:show', () => {
      this.dispatchEvent(new CustomEvent('tool-tip:show', { bubbles: true }));
    });
    this.listen(surface, 'pop-over:hide', () => {
      this.dispatchEvent(new CustomEvent('tool-tip:hide', { bubbles: true }));
    });
  }

  /** Manual popovers get no UA Escape / light dismiss: supply both. */
  #listenDismiss() {
    this.listen(document, 'keydown', this.#handleEscape);
    this.listen(document, 'pointerdown', (/** @type {PointerEvent} */ e) => {
      if (this.isVisible && !(e.target instanceof Node && this.contains(e.target))) this.hide();
    });
  }

  /** No anchor positioning: pop-over start-aligns; tooltips centre. */
  #centerFallback() {
    const tip = this.#popover;
    const trigger = this.#trigger;
    if (!tip || !trigger || this.#isCard) return;
    const side = tip.dataset.position || 'top';
    const r = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const clamp = (v, size, max) => Math.max(VIEWPORT_GUTTER, Math.min(v, max - size - VIEWPORT_GUTTER));
    /* The native tooltip cascade's centring translate (meant for anchor())
       isn't @supports-guarded; with pixel insets it would shift us twice. */
    tip.style.translate = 'none';
    if (side === 'left' || side === 'right') {
      tip.style.top = `${Math.round(clamp(r.top + (r.height - tip.offsetHeight) / 2, tip.offsetHeight, vh))}px`;
    } else {
      tip.style.left = `${Math.round(clamp(r.left + (r.width - tip.offsetWidth) / 2, tip.offsetWidth, vw))}px`;
    }
  }

  #scheduleShow = () => {
    clearTimeout(this.#hideTimer);
    const defaultDelay = this.#isCard ? 300 : 200;
    const delay = parseInt(this.getAttribute('delay') || String(defaultDelay), 10);
    this.setState('show-pending', true);
    this.#showTimer = setTimeout(() => {
      this.setState('show-pending', false);
      this.show();
    }, delay);
  };

  #scheduleHide = () => {
    clearTimeout(this.#showTimer);
    this.setState('show-pending', false);
    const hideDelay = this.#isCard ? 200 : 100;
    this.#hideTimer = setTimeout(() => this.hide(), hideDelay);
  };

  #showImmediate = () => {
    if (this.#returningFocus) return;
    clearTimeout(this.#hideTimer);
    this.show();
  };

  #hideImmediate = () => {
    clearTimeout(this.#showTimer);
    this.setState('show-pending', false);
    this.hide();
  };

  #cancelHide = () => {
    clearTimeout(this.#hideTimer);
  };

  #handleEscape = (/** @type {KeyboardEvent} */ e) => {
    if (e.key !== 'Escape' || !this.isVisible) return;
    clearTimeout(this.#showTimer);
    const focusInCard = this.#isCard && this.#popover?.contains(document.activeElement);
    this.hide();
    // Escape from inside the card returns focus to its trigger.
    if (focusInCard) {
      this.#returningFocus = true;
      this.#trigger?.focus({ preventScroll: true });
      this.#returningFocus = false;
    }
  };

  /** Show the tooltip / card now. */
  show() {
    if (!this.#popover || this.isVisible) return;
    // Prefer pop-over's imperative API; falls back to showPopover().
    if (typeof /** @type {any} */ (this.#popover).show === 'function') {
      /** @type {any} */ (this.#popover).show();
    } else {
      /** @type {any} */ (this.#popover).showPopover();
    }
    if (!supportsAnchor) this.#centerFallback();
  }

  /** Hide the tooltip / card now. */
  hide() {
    if (!this.#popover || !this.isVisible) return;
    if (typeof /** @type {any} */ (this.#popover).hide === 'function') {
      /** @type {any} */ (this.#popover).hide();
    } else {
      /** @type {any} */ (this.#popover).hidePopover();
    }
  }

  /**
   * Whether the tooltip / card is currently open.
   * @returns {boolean} True while open.
   */
  get isVisible() {
    return this.#popover?.matches(':popover-open') ?? false;
  }
}

registerComponent('tool-tip', ToolTip);

export { ToolTip };
