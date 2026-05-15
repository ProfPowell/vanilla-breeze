/**
 * Creates responsive queries for scale label density.
 * X-axis: uses @container queries (responds to chart-canvas width).
 * Y-axis: uses @media queries (height containment would break grid).
 * @param {object} obj.config - the user supplied config
 * @return {string} CSS queries as a string
 */
function createMediaQueries({config}) {
  const minFontSize = config.scale.minFontSize;
  const maxTicks = config.scale.maxItems;

  let compiledQueries = '';

  // Base: hide all labels/guides, set responsive font sizing
  compiledQueries += `
    .svc-scale-label-x,
    .svc-scale-label-y,
    .svc-guides-x,
    .svc-guides-y,
    .svc-ticks-x,
    .svc-ticks-y {
      opacity: 0;
    }
    .svc-scale-label-x, .svc-scale-label-y, chart-label {
      font-size: calc(${minFontSize}px + 1vmin);
      padding: calc(4px + 0.1vmin);
      box-sizing: border-box;
    }
    chart-label[position="y"] {
      padding: calc(5px + 0.1vmin);
      padding-right: 10px;
    }
  `;

  // Standard scale-x width for ellipsis
  const width = parseFloat(((100 / maxTicks) - 1).toFixed(2));
  compiledQueries += `
    .svc-scale-label-x {
      width: calc(${width}% - 5px);
      max-width: calc(${width}%);
    }`;

  const queries = {
    '0': 2,
    '250': 4,
    '600': 6,
    '800': 10,
    '1000': maxTicks,
  };

  // X-axis: @container queries (responds to chart-canvas inline size)
  const xKeys = Object.keys(queries);
  xKeys.forEach((query, index) => {
    let rule;
    const numTicks = Math.floor(maxTicks / queries[query]);
    const minPoint = parseInt(query);
    const maxPoint = parseInt(xKeys[index + 1]) - 1;

    if (index === 0) {
      rule = `
        @container chart-canvas (max-width: ${maxPoint}px) {
          .svc-scale-label-x:first-child,
          .svc-scale-label-x:nth-last-child(2),
          .svc-guides-x:first-child,
          .svc-guides-x:nth-last-child(2),
          .svc-ticks-x:first-child,
          .svc-ticks-x:nth-last-child(2) {
            opacity: 1;
          }
          .svc-scale-label-x {
            width: calc(50% - 5px);
            max-width: 50%;
          }
        }
      `;
    } else if (index === xKeys.length - 1) {
      rule = `
        @container chart-canvas (min-width: ${query}px) {
          .svc-scale-label-x,
          .svc-guides-x,
          .svc-ticks-x {
            opacity: 1;
          }
        }
      `;
    } else {
      const length = parseFloat(
        (100 / (numTicks + 1)).toFixed(2),
      );
      rule = `
        @container chart-canvas (min-width: ${minPoint}px) and (max-width: ${maxPoint}px) {
          .svc-scale-label-x:nth-child(${numTicks}n + 1),
          .svc-guides-x:nth-child(${numTicks}n),
          .svc-ticks-x:nth-child(${numTicks}n + 1) {
            opacity: 1;
          }
          .svc-scale-label-x {
            width: calc(${length}% - 5px);
            max-width: calc(${length}%);
          }
        }
      `;
    }
    compiledQueries += rule;
  });

  // Y-axis: @media queries (container height containment breaks grid)
  const yKeys = Object.keys(queries);
  yKeys.forEach((query, index) => {
    let rule;
    const numTicks = Math.floor(maxTicks / queries[query]);
    const minPoint = parseInt(query);
    const maxPoint = parseInt(yKeys[index + 1]) - 1;

    if (index === 0) {
      rule = `
        @media(max-height: ${maxPoint}px) {
          .svc-scale-label-y:first-child,
          .svc-scale-label-y:nth-last-child(2),
          .svc-guides-y:first-child,
          .svc-guides-y:nth-last-child(2),
          .svc-ticks-y:first-child,
          .svc-ticks-y:nth-last-child(2) {
            opacity: 1;
          }
        }
      `;
    } else if (index === yKeys.length - 1) {
      rule = `
        @media(min-height: ${query}px) {
          .svc-scale-label-y,
          .svc-guides-y,
          .svc-ticks-y {
            opacity: 1;
          }
        }
      `;
    } else {
      const guideQuantifier = ' + 1';
      rule = `
        @media(min-height: ${minPoint}px) and (max-height: ${maxPoint}px) {
          .svc-scale-label-y:nth-child(${numTicks}n + 1),
          .svc-guides-y:nth-child(${numTicks}n${guideQuantifier}),
          .svc-ticks-y:nth-child(${numTicks}n + 1) {
            opacity: 1;
          }
        }
      `;
    }
    compiledQueries += rule;
  });

  return compiledQueries;
}

export { createMediaQueries };
