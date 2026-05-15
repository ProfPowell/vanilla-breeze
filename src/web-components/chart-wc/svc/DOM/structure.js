import { VElement } from './VElement.js';

/**
  Creates the chart skeleton using custom element tag names and CSS Grid layout.

  SVG mode (toString/toFile):
  +---svg
  |    +---foreignObject
  |    |   +---body
  |    |   |   +---chart-figure
  |    |   |   |   +---chart-title
  |    |   |   |   +---chart-body
  |    |   |   |   |   +---chart-canvas (CSS Grid)
  |    |   |   |   |   |   +---chart-label[position=y]
  |    |   |   |   |   |   +---chart-axis[position=y]
  |    |   |   |   |   |   +---svg.ticks-y
  |    |   |   |   |   |   +---chart-plot
  |    |   |   |   |   |   |   +---svg.plotarea
  |    |   |   |   |   |   +---svg.ticks-x
  |    |   |   |   |   |   +---chart-axis[position=x]
  |    |   |   |   |   |   +---chart-label[position=x]
  |    |   |   |   |   +---chart-legend

  HTML mode (toHTML/mount):
  Same tree from chart-figure down, no svg/foreignObject wrapper.

  @param {Object} options
  @param {boolean} [options.interactive=false]
  @return {Object} Structure object with named references to key elements
*/
function createSVGContainer({interactive = false} = {}) {
  // SVG root for toString()/toFile() path
  const root = new VElement('svg');
  root.setAttrs({
    'width': '100%',
    'height': '100%',
    'xmlns': 'http://www.w3.org/2000/svg',
    'role': interactive ? 'graphics-document' : 'img',
    'aria-roledescription': 'chart',
  });

  // foreignObject wraps HTML content inside SVG
  const fo = new VElement('foreignObject', {
    width: '100%',
    height: '100%',
  });
  root.appendChild(fo);
  const foBody = new VElement('body', {
    xmlns: 'http://www.w3.org/1999/xhtml',
    style: 'width:100%;height:100%;',
  });
  fo.appendChild(foBody);
  foBody.appendChild(new VElement('meta', {
    name: 'viewport',
    content: 'width=device-width, initial-scale=1',
  }));

  // ── chart-figure ─────────────────────────────────────
  // The top-level chart wrapper (Grid: title row + body row)
  const wrap = new VElement('figure');
  foBody.appendChild(wrap);

  // ── chart-title ──────────────────────────────────────
  const top = new VElement('chart-title');
  wrap.appendChild(top);

  // ── chart-body ───────────────────────────────────────
  // Grid: canvas column + legend column
  const body = new VElement('chart-body');
  wrap.appendChild(body);

  // ── chart-canvas ─────────────────────────────────────
  // CSS Grid places axes, ticks, plot, and labels without row wrappers
  const canvas = new VElement('chart-canvas');
  body.appendChild(canvas);

  // Y-axis label (grid: row 1, col 1)
  const layoutYAxisLabel = new VElement('chart-label', {
    position: 'y',
  });
  canvas.appendChild(layoutYAxisLabel);

  // Y-axis scale labels (grid: row 1, col 2)
  const layoutYAxis = new VElement('chart-axis', {
    position: 'y',
  });
  canvas.appendChild(layoutYAxis);

  // Y-axis tick marks (grid: row 1, col 3)
  const layoutYTicks = new VElement('svg', {
    'width': '100%',
    'xmlns': 'http://www.w3.org/2000/svg',
    'class': ['ticks-y'],
  });
  canvas.appendChild(layoutYTicks);

  // Plot area (grid: row 1, col 4)
  const plotarea = new VElement('chart-plot');
  canvas.appendChild(plotarea);

  const layoutChart = new VElement('svg');
  layoutChart.setAttrs({
    'width': '100%',
    'height': '100%',
    'xmlns': 'http://www.w3.org/2000/svg',
    'class': ['plotarea'],
  });
  plotarea.appendChild(layoutChart);

  // Origin spacer cells — not appended to DOM (Grid doesn't need them),
  // but kept as VElements since Cartesian.js references them for dummy labels.
  const layoutOriginLeft = new VElement('div');
  const layoutOriginCenter = new VElement('div');
  const layoutOriginRight = new VElement('div');

  // X-axis tick marks (grid: row 2, col 4)
  const layoutXTicks = new VElement('svg', {
    'width': '100%',
    'xmlns': 'http://www.w3.org/2000/svg',
    'class': ['ticks-x'],
  });
  canvas.appendChild(layoutXTicks);

  // X-axis scale labels (grid: row 3, col 4)
  const layoutXAxis = new VElement('chart-axis', {
    position: 'x',
  });
  canvas.appendChild(layoutXAxis);

  // X-axis label (grid: row 4, col 4)
  const layoutXAxisLabel = new VElement('chart-label', {
    position: 'x',
  });
  canvas.appendChild(layoutXAxisLabel);

  // ── Plotarea SVG content ─────────────────────────────
  layoutChart.appendChild(new VElement('rect', {
    x: '0%',
    y: '0%',
    width: '100%',
    height: '100%',
    class: ['plotarea'],
  }));

  const loading = new VElement('text', {
    x: '50%',
    y: '50%',
    class: ['loading'],
  });
  loading.innerHTML = 'Loading Chart...';
  layoutChart.appendChild(loading);

  // ── chart-legend ─────────────────────────────────────
  // Created empty — Legend component fills it in parseComponents()

  return {
    root,
    wrap,
    top,
    body,
    plotarea,
    layoutChart,
    layoutXAxis,
    layoutYTicks,
    layoutXTicks,
    layoutYAxis,
    layoutOriginRight,
    layoutOriginCenter,
    layoutXAxisLabel,
    layoutYAxisLabel,
    layoutOriginLeft,
  };
}

export { createSVGContainer };
