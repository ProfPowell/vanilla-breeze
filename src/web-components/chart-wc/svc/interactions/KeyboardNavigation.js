/**
 * Keyboard navigation for chart data points.
 * Self-contained named function — compatible with SVC._createScripts() stringification.
 *
 * Arrow keys navigate between data points. Escape blurs.
 * Focused data points get a visual focus ring and announce via aria-live.
 *
 * @param {Object} state - internal interaction state
 * @param {Element|Document} instance - the chart container or document
 * @param {Object} chart - the chart instance
 */
export function keyboardNavigation(state, instance, _chart) {
  let nodes = instance.querySelectorAll('[role="graphics-symbol"]');
  if (nodes.length === 0) return;

  let currentIndex = -1;
  let plotarea = instance.querySelector('chart-plot');
  if (!plotarea) return;

  plotarea.setAttribute('tabindex', '0');

  plotarea.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      currentIndex = Math.min(currentIndex + 1, nodes.length - 1);
      focusNode(currentIndex);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      currentIndex = Math.max(currentIndex - 1, 0);
      focusNode(currentIndex);
    } else if (e.key === 'Escape') {
      blurAll();
      let tooltip = instance.querySelector('#svc-tooltip-label');
      if (tooltip) tooltip.classList.add('svc-hide');
      currentIndex = -1;
    }
  });

  function focusNode(index) {
    blurAll();
    let node = nodes[index];
    if (!node) return;
    node.classList.add('svc-focus');
    // Announce to screen readers via aria-live region
    let label = node.getAttribute('aria-label');
    let tooltip = instance.querySelector('#svc-tooltip-label');
    if (tooltip && label) {
      tooltip.textContent = label;
      tooltip.classList.remove('svc-hide');
    }
  }

  function blurAll() {
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove('svc-focus');
    }
  }
}
