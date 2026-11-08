/**
 * tooltip-init: Initialize native tooltips using Popover API
 *
 * Discovers tooltips via two mechanisms:
 * 1. [data-tooltip] — progressive enhancement from title attribute
 *    - No value: creates popover from title text (Tier 1)
 *    - With value: connects trigger to existing popover element (Tier 2)
 * 2. [aria-describedby] — legacy path, connects to existing popover
 *
 * When interestfor is available (native or polyfill), sets the
 * interestfor attribute on triggers. Falls back to JS event listeners.
 *
 * @example
 * // Tier 1: Simple text tooltip from title
 * <button title="Save your changes" data-tooltip>Save</button>
 *
 * @example
 * // Tier 2: Rich tooltip referencing existing popover
 * <button title="Save (Ctrl+S)" data-tooltip="save-tip">Save</button>
 * <div id="save-tip" popover="hint" role="tooltip">
 *   <strong>Save document</strong><br>
 *   <kbd>Ctrl</kbd>+<kbd>S</kbd>
 *   <span class="tooltip-arrow" aria-hidden="true"></span>
 * </div>
 *
 * @example
 * // Legacy: aria-describedby path
 * <button aria-describedby="tip1">Hover me</button>
 * <div id="tip1" popover="hint" role="tooltip">Tooltip content</div>
 */

const SHOW_DELAY = 200;
const HIDE_DELAY = 100;

// Check CSS Anchor Positioning support once
const supportsAnchor = CSS.supports('anchor-name', '--test');

// Elements that support native interestfor (spec-defined)
const INTERESTFOR_TAGS = new Set(['BUTTON', 'A', 'AREA']);

/* popover="hint" is newer than the Popover API. An unsupported value acts
   as manual: no Escape, no light dismiss (WCAG 1.4.13). Created tooltips
   use "manual" there, and every managed tooltip gets Escape + outside
   dismiss from the document listeners below. ("auto" is avoided on
   purpose: opening one closes every other open auto popover.) */
const supportsHint = (() => {
  const probe = document.createElement('span');
  probe.setAttribute('popover', 'hint');
  return /** @type {any} */ (probe).popover === 'hint';
})();

/** Tooltips (and their triggers) wired by this module. @type {Map<Element, Element>} */
const managed = new Map();
let dismissWired = false;

/** Escape and outside-pointer dismissal for non-hint browsers. */
function wireDismiss() {
  if (dismissWired || supportsHint) return;
  dismissWired = true;
  const hideOpen = (/** @type {(tip: Element, trigger: Element) => boolean} */ keep) => {
    managed.forEach((trigger, tip) => {
      if (tip.matches(':popover-open') && !keep(tip, trigger)) {
        /** @type {HTMLElement} */ (tip).hidePopover();
      }
    });
  };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideOpen(() => false);
  });
  document.addEventListener('pointerdown', (e) => {
    const t = /** @type {Node} */ (e.target);
    hideOpen((tip, trigger) => tip.contains(t) || trigger.contains(t));
  });
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
 * Append an id to an IDREF list attribute (keeps authored ids).
 * @param {Element} el
 * @param {string} attr
 * @param {string} id
 */
function addIdRef(el, attr, id) {
  const ids = (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);
  if (!ids.includes(id)) el.setAttribute(attr, [...ids, id].join(' '));
}

/** Check if interestfor can be used on a specific trigger element */
function canUseInterestFor(trigger) {
  if (document.documentElement.hasAttribute('data-interest-polyfill')) return true;
  if ('interestForElement' in HTMLButtonElement.prototype) {
    return INTERESTFOR_TAGS.has(trigger.tagName);
  }
  return false;
}

/**
 * Connect a trigger to a tooltip via interestfor or JS events.
 * Shared by all discovery paths.
 * @param {Element} trigger
 * @param {Element} tip
 */
function connectTrigger(trigger, tip) {
  managed.set(tip, trigger);
  wireDismiss();

  if (canUseInterestFor(trigger)) {
    trigger.setAttribute('interestfor', tip.id);
    // Position on show for JS fallback positioning
    tip.addEventListener('toggle', (/** @type {ToggleEvent} */ e) => {
      if (e.newState === 'open') positionTooltip(trigger, tip);
    });
    return;
  }

  // Fallback path: JS event listeners
  let showTimer = null;
  let hideTimer = null;

  const htmlTip = /** @type {HTMLElement} */ (tip);

  const scheduleShow = () => {
    clearTimeout(hideTimer);
    showTimer = setTimeout(() => {
      htmlTip.showPopover();
      positionTooltip(trigger, tip);
    }, SHOW_DELAY);
  };

  const scheduleHide = () => {
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      htmlTip.hidePopover();
    }, HIDE_DELAY);
  };

  const showImmediate = () => {
    clearTimeout(hideTimer);
    htmlTip.showPopover();
    positionTooltip(trigger, tip);
  };

  const hideImmediate = () => {
    clearTimeout(showTimer);
    htmlTip.hidePopover();
  };

  // Hover events with delay
  trigger.addEventListener('mouseenter', scheduleShow);
  trigger.addEventListener('mouseleave', scheduleHide);

  // Focus events are immediate
  trigger.addEventListener('focus', showImmediate);
  trigger.addEventListener('blur', hideImmediate);

  // Allow hovering over tooltip itself
  tip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  tip.addEventListener('mouseleave', scheduleHide);
}

/**
 * Set up CSS Anchor Positioning on a trigger/tooltip pair.
 * Falls back gracefully — JS positioning handles non-anchor browsers.
 * @param {Element} trigger
 * @param {Element} tip
 */
function setupAnchor(trigger, tip) {
  if (!supportsAnchor) return;
  const anchorName = `--tooltip-anchor-${tip.id}`;
  /** @type {HTMLElement} */ (trigger).style.anchorName = anchorName;
  /** @type {HTMLElement} */ (tip).style.positionAnchor = anchorName;
  tip.setAttribute('data-anchor', '');
}

/**
 * Tier 1: Create a popover tooltip from the trigger's title attribute.
 * @param {Element} trigger
 */
function initTitleTooltip(trigger) {
  const titleText = trigger.getAttribute('title');
  if (!titleText) return;

  /* The title may be the trigger's only accessible name (icon-only
     button): keep it as aria-label before removing it. Then the tooltip
     only repeats the name, so it isn't also wired as a description. */
  const titleIsName = !hasOwnName(/** @type {HTMLElement} */ (trigger));
  if (titleIsName) trigger.setAttribute('aria-label', titleText);

  // Remove title to prevent native double-tooltip
  trigger.removeAttribute('title');

  // Create tooltip element
  const tip = document.createElement('div');
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('popover', supportsHint ? 'hint' : 'manual');
  tip.id = `tooltip-${crypto.randomUUID().slice(0, 8)}`;
  tip.textContent = titleText;

  // Position from trigger's data-tooltip-position
  const position = /** @type {HTMLElement} */ (trigger).dataset.tooltipPosition || 'top';
  tip.dataset.tooltipPosition = position;

  // Add arrow
  const arrow = document.createElement('span');
  arrow.className = 'tooltip-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  tip.appendChild(arrow);

  // Insert after trigger in DOM
  trigger.after(tip);

  // ARIA — appended, so authored describedby ids (form hints) survive
  if (!titleIsName) addIdRef(trigger, 'aria-describedby', tip.id);

  // Anchor positioning
  setupAnchor(trigger, tip);

  // Connect events
  connectTrigger(trigger, tip);
}

/**
 * Tier 2: Connect a trigger to an existing popover element by ID.
 * @param {Element} trigger
 * @param {string} id - The ID of the existing popover element
 */
function initReferencedTooltip(trigger, id) {
  const tip = document.getElementById(id);
  if (!tip?.hasAttribute('popover')) return;

  // Remove title from trigger if present (prevent double-tooltip),
  // keeping it as the name when it was the only one.
  const title = trigger.getAttribute('title');
  if (title) {
    if (!hasOwnName(/** @type {HTMLElement} */ (trigger))) trigger.setAttribute('aria-label', title);
    trigger.removeAttribute('title');
  }

  // ARIA — appended to any authored ids
  addIdRef(trigger, 'aria-describedby', id);

  // Anchor positioning
  setupAnchor(trigger, tip);

  // Connect events
  connectTrigger(trigger, tip);
}

/**
 * Initialize tooltips within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initTooltips(root = document) {
  // --- [data-tooltip] discovery (Tier 1 + Tier 2) ---
  root.querySelectorAll('[data-tooltip]').forEach(trigger => {
    // Skip triggers inside tool-tip (they have their own handling)
    if (trigger.closest('tool-tip')) return;

    // Skip if already initialized
    if (trigger.hasAttribute('data-tooltip-init')) return;
    trigger.setAttribute('data-tooltip-init', '');

    const tooltipId = /** @type {HTMLElement} */ (trigger).dataset.tooltip;

    if (tooltipId) {
      // Tier 2: Reference to existing popover element
      initReferencedTooltip(trigger, tooltipId);
    } else {
      // Tier 1: Create popover from title text
      initTitleTooltip(trigger);
    }
  });

  // --- [aria-describedby] discovery (legacy path) ---
  root.querySelectorAll('[aria-describedby]').forEach(trigger => {
    const tipId = trigger.getAttribute('aria-describedby') ?? '';
    const tip = document.getElementById(tipId);

    // Only init if it's a popover tooltip
    if (!tip?.hasAttribute('popover') || !tip.matches('[role="tooltip"]')) return;

    // Skip triggers inside tool-tip (they have their own event handling)
    if (trigger.closest('tool-tip')) return;

    // Skip if already initialized (by data-tooltip path or previous run)
    if (trigger.hasAttribute('data-tooltip-init')) return;
    trigger.setAttribute('data-tooltip-init', '');

    // Anchor positioning
    setupAnchor(trigger, tip);

    // Connect events
    connectTrigger(trigger, tip);
  });

  // --- Click tooltips (popovertarget) ---
  root.querySelectorAll('[popovertarget]').forEach(trigger => {
    const tipId = trigger.getAttribute('popovertarget') ?? '';
    const tip = document.getElementById(tipId);

    // Only init if it's a popover tooltip
    if (!tip?.hasAttribute('popover') || !tip.matches('[role="tooltip"]')) return;

    // Skip if already initialized
    if (tip.hasAttribute('data-tooltip-click-init')) return;
    tip.setAttribute('data-tooltip-click-init', '');

    // Position tooltip when it opens via toggle event
    tip.addEventListener('toggle', (/** @type {ToggleEvent} */ event) => {
      if (event.newState === 'open') {
        positionTooltip(trigger, tip);
      }
    });
  });
}

/**
 * Position tooltip relative to trigger using JavaScript
 * @param {Element} trigger - The trigger element
 * @param {Element} tooltip - The tooltip element
 */
function positionTooltip(trigger, tooltip) {
  /* Skip where CSS anchor positioning places it: [data-anchor] tips use
     the anchor-name pair from setupAnchor(), and the rest (click tips
     opened by popovertarget) use the invoker as their implicit anchor
     (native-elements/tooltip/styles.css). Inline top/left would fight
     the anchor() insets. */
  if (supportsAnchor || tooltip.hasAttribute('data-anchor')) return;

  const triggerRect = trigger.getBoundingClientRect();
  const position = /** @type {HTMLElement} */ (tooltip).dataset.tooltipPosition || 'top';
  const gap = 8;

  // Get tooltip dimensions (need to show first to measure)
  const tooltipRect = tooltip.getBoundingClientRect();

  let top, left;

  switch (position) {
    case 'bottom':
      top = triggerRect.bottom + gap;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.left - tooltipRect.width - gap;
      break;
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      left = triggerRect.right + gap;
      break;
    case 'top':
    default:
      top = triggerRect.top - tooltipRect.height - gap;
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
      break;
  }

  // Keep within viewport
  const padding = 8;
  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
  top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

  /** @type {HTMLElement} */ (tooltip).style.top = `${top}px`;
  /** @type {HTMLElement} */ (tooltip).style.left = `${left}px`;
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initTooltips());
} else {
  initTooltips();
}

export { initTooltips, positionTooltip };
