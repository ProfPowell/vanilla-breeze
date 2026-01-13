/**
 * tooltip-init: Initialize native tooltips using Popover API
 *
 * Binds hover/focus events to elements with aria-describedby
 * pointing to a popover tooltip element.
 *
 * @example
 * // In your main.js:
 * import { initTooltips } from './utils/tooltip-init.js';
 *
 * // Or import for side effects (auto-init):
 * import './utils/tooltip-init.js';
 *
 * @example
 * // HTML structure:
 * <button aria-describedby="tip1">Hover me</button>
 * <div id="tip1" popover="hint" role="tooltip">Tooltip content</div>
 */

const SHOW_DELAY = 200;
const HIDE_DELAY = 100;

/**
 * Initialize tooltips within a root element
 * @param {Element|Document} root - Root element to search within
 */
function initTooltips(root = document) {
  // Initialize hover tooltips (aria-describedby)
  root.querySelectorAll('[aria-describedby]').forEach(trigger => {
    const tipId = trigger.getAttribute('aria-describedby');
    const tip = document.getElementById(tipId);

    // Only init if it's a popover tooltip
    if (!tip?.hasAttribute('popover') || !tip.matches('[role="tooltip"]')) return;

    // Skip triggers inside tooltip-wc (they have their own event handling)
    if (trigger.closest('tooltip-wc')) return;

    // Skip if already initialized
    if (trigger.hasAttribute('data-tooltip-init')) return;
    trigger.setAttribute('data-tooltip-init', '');

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
  });

  // Initialize click tooltips (popovertarget)
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
  const triggerRect = trigger.getBoundingClientRect();
  const position = tooltip.dataset.position || 'top';
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
