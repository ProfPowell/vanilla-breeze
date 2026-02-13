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
  if (canUseInterestFor(trigger)) {
    trigger.setAttribute('interestfor', tip.id);
    // Position on show for JS fallback positioning
    tip.addEventListener('toggle', (e) => {
      if (e.newState === 'open') positionTooltip(trigger, tip);
    });
    return;
  }

  // Fallback path: JS event listeners
  let showTimer = null;
  let hideTimer = null;

  const scheduleShow = () => {
    clearTimeout(hideTimer);
    showTimer = setTimeout(() => {
      tip.showPopover();
      positionTooltip(trigger, tip);
    }, SHOW_DELAY);
  };

  const scheduleHide = () => {
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      tip.hidePopover();
    }, HIDE_DELAY);
  };

  const showImmediate = () => {
    clearTimeout(hideTimer);
    tip.showPopover();
    positionTooltip(trigger, tip);
  };

  const hideImmediate = () => {
    clearTimeout(showTimer);
    tip.hidePopover();
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
  trigger.style.anchorName = anchorName;
  tip.style.positionAnchor = anchorName;
  tip.setAttribute('data-anchor', '');
}

/**
 * Tier 1: Create a popover tooltip from the trigger's title attribute.
 * @param {Element} trigger
 */
function initTitleTooltip(trigger) {
  const titleText = trigger.getAttribute('title');
  if (!titleText) return;

  // Remove title to prevent native double-tooltip
  trigger.removeAttribute('title');

  // Create tooltip element
  const tip = document.createElement('div');
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('popover', 'hint');
  tip.id = `tooltip-${crypto.randomUUID().slice(0, 8)}`;
  tip.textContent = titleText;

  // Position from trigger's data-tooltip-position
  const position = trigger.dataset.tooltipPosition || 'top';
  tip.dataset.tooltipPosition = position;

  // Add arrow
  const arrow = document.createElement('span');
  arrow.className = 'tooltip-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  tip.appendChild(arrow);

  // Insert after trigger in DOM
  trigger.after(tip);

  // ARIA
  trigger.setAttribute('aria-describedby', tip.id);

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

  // Remove title from trigger if present (prevent double-tooltip)
  if (trigger.hasAttribute('title')) {
    trigger.removeAttribute('title');
  }

  // ARIA
  if (!trigger.hasAttribute('aria-describedby')) {
    trigger.setAttribute('aria-describedby', id);
  }

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
    // Skip triggers inside tooltip-wc (they have their own handling)
    if (trigger.closest('tooltip-wc')) return;

    // Skip if already initialized
    if (trigger.hasAttribute('data-tooltip-init')) return;
    trigger.setAttribute('data-tooltip-init', '');

    const tooltipId = trigger.dataset.tooltip;

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
    const tipId = trigger.getAttribute('aria-describedby');
    const tip = document.getElementById(tipId);

    // Only init if it's a popover tooltip
    if (!tip?.hasAttribute('popover') || !tip.matches('[role="tooltip"]')) return;

    // Skip triggers inside tooltip-wc (they have their own event handling)
    if (trigger.closest('tooltip-wc')) return;

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
    const tipId = trigger.getAttribute('popovertarget');
    const tip = document.getElementById(tipId);

    // Only init if it's a popover tooltip
    if (!tip?.hasAttribute('popover') || !tip.matches('[role="tooltip"]')) return;

    // Skip if already initialized
    if (tip.hasAttribute('data-tooltip-click-init')) return;
    tip.setAttribute('data-tooltip-click-init', '');

    // Position tooltip when it opens via toggle event
    tip.addEventListener('toggle', (event) => {
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
  // Skip if anchor positioning is handling it
  if (tooltip.hasAttribute('data-anchor')) return;

  const triggerRect = trigger.getBoundingClientRect();
  const position = tooltip.dataset.tooltipPosition || 'top';
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

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initTooltips());
} else {
  initTooltips();
}

export { initTooltips, positionTooltip };
