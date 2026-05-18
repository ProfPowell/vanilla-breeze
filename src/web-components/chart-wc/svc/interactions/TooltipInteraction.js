/**
 * Shared tooltip interaction handler for all chart types.
 * Self-contained named function — compatible with SVC._createScripts() stringification.
 *
 * @param {Object} state - internal interaction state
 * @param {Element|Document} instance - the chart container or document
 * @param {Object} chart - the chart instance (stats, data, config, hooks)
 */
export function tooltipInteraction(state, instance, chart) {
  let HIDE_DELAY_MS = (chart.config && chart.config.tooltip &&
    chart.config.tooltip.hideDelay) || 2000;

  const targetRaw = instance.querySelector('chart-plot');
  const tooltipElementRaw = instance.querySelector('#svc-tooltip-box');
  const tooltipTextElementRaw = instance.querySelector('#svc-tooltip-label');
  const crosshairElementRaw = instance.querySelector('.svc-tooltip-crosshair');
  if (!targetRaw || !tooltipElementRaw || !tooltipTextElementRaw || !crosshairElementRaw) return;
  /** @type {Element} */
  const target = targetRaw;
  /** @type {Element} */
  const tooltipElement = tooltipElementRaw;
  /** @type {Element} */
  const tooltipTextElement = tooltipTextElementRaw;
  /** @type {Element} */
  const crosshairElement = crosshairElementRaw;

  /** @type {Element[]} */
  let activeNodes = [];
  /** @type {ReturnType<typeof setTimeout> | null} */
  let hideTimeoutId = null;
  let cachedTargetBbox = null;

  function invalidateBboxCache() {
    cachedTargetBbox = null;
  }

  // Invalidate cached bbox on scroll/resize/container resize
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', invalidateBboxCache, {passive: true});
    window.addEventListener('resize', invalidateBboxCache, {passive: true});
  }
  // Also invalidate on container resize via ResizeObserver
  let resizeObserver = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(invalidateBboxCache);
    resizeObserver.observe(target);
  }

  function hideTooltip() {
    tooltipTextElement.setAttribute('class', 'svc-tooltip-label svc-hide');
    tooltipElement.setAttribute('class', 'svc-tooltip svc-hide');
    // Move crosshair off-screen so it's not visible after dismiss
    crosshairElement.setAttribute('x1', '-10%');
    crosshairElement.setAttribute('x2', '-10%');
    crosshairElement.setAttribute('y1', '-10%');
    crosshairElement.setAttribute('y2', '-10%');
    for (let i = 0; i < activeNodes.length; i++) {
      activeNodes[i].classList.remove('svc-plot-node-active-' + i);
    }
    activeNodes = [];
  }

  function resetHideTimer() {
    if (hideTimeoutId) clearTimeout(hideTimeoutId);
    hideTimeoutId = setTimeout(hideTooltip, HIDE_DELAY_MS);
  }

  target.addEventListener('mousedown', execute);
  target.addEventListener('mousemove', execute);

  // Store cleanup references on state for destroy()
  state._tooltipCleanup = function() {
    if (hideTimeoutId) clearTimeout(hideTimeoutId);
    target.removeEventListener('mousedown', execute);
    target.removeEventListener('mousemove', execute);
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', invalidateBboxCache);
      window.removeEventListener('resize', invalidateBboxCache);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  };

  /**
   * The event handler for tooltips.
   * @param {Object} e - the Event object
   */
  function execute(e) {
    resetHideTimer();
    let info = state.functions.tooltipLocation(e, state, instance, chart);
    if (!info) return;

    // Set which nodes are active, and deactivate old ones
    let nodes = instance.querySelectorAll('.svc-plot-node[node="' + info.index + '"]');
    for (let i = 0; i < activeNodes.length; i++) {
      activeNodes[i].classList.remove('svc-plot-node-active-' + i);
    }
    activeNodes = [];
    for (let j = 0; j < nodes.length; j++) {
      nodes[j].classList.add('svc-plot-node-active-' + j);
      activeNodes.push(nodes[j]);
    }

    // Update crosshair position
    crosshairElement.setAttribute('x1', info.crosshair.x1 + '%');
    crosshairElement.setAttribute('x2', info.crosshair.x2 + '%');
    crosshairElement.setAttribute('y1', info.crosshair.y1 + '%');
    crosshairElement.setAttribute('y2', info.crosshair.y2 + '%');

    // Update text FIRST so the tooltip has correct dimensions for positioning
    tooltipTextElement.innerHTML = info.tooltip.text;

    // Show the tooltip elements
    tooltipTextElement.setAttribute('class', 'svc-tooltip-label');
    tooltipElement.setAttribute('class', 'svc-tooltip');

    // Now measure and position — text is set, so bbox is accurate
    if (!cachedTargetBbox) {
      cachedTargetBbox = target.getBoundingClientRect();
    }
    let targetBbox = cachedTargetBbox;
    let tooltipBbox = tooltipTextElement.getBoundingClientRect();
    let tooltipWidthPercent = (tooltipBbox.width / targetBbox.width) * 100;
    let tooltipHeightPercent = (tooltipBbox.height / targetBbox.height) * 100;

    // Use provided position as starting point
    let xPos = info.tooltip.x;
    let yPos = info.tooltip.y;

    // Flip horizontally if tooltip would overflow the right edge
    let tooltipOffset = 1;
    if (xPos + tooltipWidthPercent > 98) {
      xPos = xPos - tooltipWidthPercent - tooltipOffset;
    }
    // Clamp to left edge
    if (xPos < 0) {
      xPos = 0;
    }
    // Clamp vertically — don't let tooltip go below chart
    if (yPos + tooltipHeightPercent > 98) {
      yPos = 98 - tooltipHeightPercent;
    }
    if (yPos < 0) {
      yPos = 0;
    }

    // Position tooltip — SVG foreignObject or HTML div
    let fo = tooltipElement.querySelector('foreignObject');
    if (fo) {
      fo.setAttribute('x', xPos + '%');
      fo.setAttribute('y', yPos + '%');
    } else {
      let container = tooltipTextElement.parentElement;
      if (container) {
        container.style.left = xPos + '%';
        container.style.top = yPos + '%';
      }
    }

    if (chart.hooks && chart.hooks.run) {
      chart.hooks.run('onInteraction', {
        type: 'tooltip',
        event: e,
        data: {index: info.index, tooltip: info.tooltip},
        element: tooltipElement,
      });
    }
  }
}
