/**
 * Shared legend interaction handler for all chart types.
 * Self-contained named function — compatible with SVC._createScripts() stringification.
 *
 * Handles both Cartesian charts (toggles plot path + nodes) and Pie charts (nodes only)
 * by checking whether the plot path element exists before toggling.
 *
 * @param {Object} state - internal interaction state
 * @param {Element|Document} instance - the chart container or document
 * @param {Object} chart - the chart instance (hooks)
 */
export function legendInteraction(state, instance, chart) {
  state.toggles = Array.from(instance.querySelectorAll('chart-legend input'));
  state.toggles.forEach(function(toggle) {
    toggle.removeAttribute('onclick');
    toggle.addEventListener('click', function(e) {
      let series = e.target.getAttribute('data-series');
      state.toggles[series] = e.target.checked;
      let isVisible = state.toggles[series] !== false;
      let opacity = isVisible ? 1 : 0;

      // Toggle plot path (exists on Cartesian charts, not on Pie)
      let plot = instance.getElementsByClassName('svc-plot-' + series)[0];
      if (plot) plot.style.opacity = opacity;

      // Toggle nodes
      let nodes = instance.getElementsByClassName('svc-plot-node-' + series);
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].style.opacity = opacity;
      }

      if (chart && chart.hooks && chart.hooks.run) {
        chart.hooks.run('onInteraction', {
          type: 'legend-toggle',
          event: e,
          data: {series: series, visible: isVisible},
          element: toggle,
        });
      }
    });
  });
}
