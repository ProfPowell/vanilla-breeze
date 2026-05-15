/**
 * Click interaction for chart data points.
 * Fires the chart's onClick hook when a data point is clicked.
 * Self-contained named function — compatible with SVC._createScripts().
 *
 * @param {Object} state - internal interaction state
 * @param {Element|Document} instance - the chart container
 * @param {Object} chart - the chart instance
 */
export function dataClickInteraction(
  state, instance, chart,
) {
  let plotarea = instance.querySelector('chart-plot');
  if (!plotarea) return;

  function handleClick(e) {
    let node = e.target.closest('[role="graphics-symbol"]');
    if (!node) return;

    let info = {
      type: 'click',
      event: e,
      element: node,
      seriesIndex: parseInt(node.getAttribute('plot') ||
        node.getAttribute('data-series') || '0', 10),
      dataIndex: parseInt(node.getAttribute('node') ||
        node.getAttribute('data-index') ||
        node.getAttribute('index') || '0', 10),
      key: node.getAttribute('data-key') || null,
      value: node.getAttribute('data-value') || null,
      label: node.getAttribute('aria-label') || '',
    };

    if (chart.hooks && chart.hooks.run) {
      chart.hooks.run('onClick', info);
    }
  }

  plotarea.addEventListener('click', handleClick);

  // Extend cleanup
  let existingCleanup = state._dataClickCleanup;
  state._dataClickCleanup = function() {
    if (existingCleanup) existingCleanup();
    plotarea.removeEventListener('click', handleClick);
  };
}
