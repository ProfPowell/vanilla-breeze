import { PieChart } from './Pie.js';

/**
 * Ring (donut) Chart — pie chart with a transparent center hole.
 *
 * Internally this is a PieChart subclass so all SVC pie-shape branches
 * (Legend, Tooltip, instance count) keep working. The class only overrides
 * defaults so plot.ring is true out of the box.
 *
 * The hole size is controlled by `center.size` (default "40%"). The hole
 * fill is rendered with var(--color-surface, #fff) by Pie.js so it follows
 * the theme automatically — override via the --color-surface custom property
 * or by passing data-config='{"center":{"style":{"fill":"#000"}}}'.
 */
class RingChart extends PieChart {
  /**
   * Keep type as 'pie' so SVC's internal pie branches (Legend, Tooltip,
   * instance counting in Chart.compileStyles) match without modification.
   * The user-facing data-type="ring" is resolved at the chart-wc layer.
   * @return {string}
   */
  static get type() {
    return 'pie';
  }

  /**
   * Defaults merge over PieChart's via Chart.applyConfigToDefaults's
   * prototype-chain walk. We only need to flip plot.ring on.
   * @return {object}
   */
  static get defaults() {
    return {
      plot: {
        ring: true,
      },
    };
  }
}

export { RingChart };
