/**
 * Export — JSON → HTML + CSS strings.
 */

/**
 * Render a block to HTML with inline placement vars.
 * Recurses into children for subgrid blocks.
 */
function blockToHtml(b, indent = 2) {
  const pad = ' '.repeat(indent);
  const vars = `--col:${b.col};--cspan:${b.cspan};--row:${b.row};--rspan:${b.rspan}`;
  const sub = b.subgrid ? ' data-subgrid' : '';
  if (b.children?.length) {
    const inner = b.children.map(c => blockToHtml(c, indent + 2)).join('\n');
    return `${pad}<${b.tag} style="${vars}"${sub}>\n${inner}\n${pad}</${b.tag}>`;
  }
  return `${pad}<${b.tag} style="${vars}"${sub}></${b.tag}>`;
}

/**
 * Check if any block in the tree has children (nested blocks).
 */
function hasNesting(blocks) {
  return blocks.some(b => b.children?.length);
}

/**
 * Generate HTML + CSS using inline placement vars.
 * @param {{ grid: object, blocks: object[] }} data
 * @returns {{ html: string, css: string }}
 */
export function exportPlacementVars(data) {
  const { grid, blocks } = data;

  const htmlLines = blocks.map(b => blockToHtml(b, 2));
  const html = `<body class="layout">\n${htmlLines.join('\n')}\n</body>`;

  let css = `.layout {
  display: grid;
  grid-template-columns: repeat(${grid.cols}, minmax(0, 1fr));
  grid-auto-rows: ${grid.rowSize};
  gap: ${grid.gap};
  max-inline-size: ${grid.maxWidth};
  margin-inline: auto;
}

.layout > * {
  grid-column: var(--col) / span var(--cspan);
  grid-row: var(--row) / span var(--rspan);
}`;

  if (hasNesting(blocks)) {
    css += `

[data-subgrid] {
  display: grid;
  grid-template-columns: subgrid;
  grid-auto-rows: ${grid.rowSize};
  gap: ${grid.gap};
}

[data-subgrid] > * {
  grid-column: var(--col) / span var(--cspan);
  grid-row: var(--row) / span var(--rspan);
}`;
  }

  return { html, css };
}

/**
 * Render a block to HTML for named-areas export.
 * Children use placement vars inside the subgrid (hybrid approach).
 */
function blockToAreasHtml(b, areaName, indent = 2) {
  const pad = ' '.repeat(indent);
  const sub = b.subgrid ? ' data-subgrid' : '';
  if (b.children?.length) {
    const inner = b.children.map(c => blockToHtml(c, indent + 2)).join('\n');
    return `${pad}<${b.tag}${sub}>\n${inner}\n${pad}</${b.tag}>`;
  }
  return `${pad}<${b.tag}${sub}></${b.tag}>`;
}

/**
 * Generate HTML + CSS using grid-template-areas.
 * @param {{ grid: object, blocks: object[] }} data
 * @returns {{ html: string, css: string }}
 */
export function exportNamedAreas(data) {
  const { grid, blocks } = data;

  // Assign unique area names — suffix duplicates
  const tagCounts = {};
  blocks.forEach(b => { tagCounts[b.tag] = (tagCounts[b.tag] || 0) + 1; });
  const totalCounts = { ...tagCounts };
  const tagSeen = {};
  const areaNames = blocks.map(b => {
    tagSeen[b.tag] = (tagSeen[b.tag] || 0) + 1;
    if (totalCounts[b.tag] > 1) {
      return `${b.tag}-${tagSeen[b.tag]}`;
    }
    return b.tag;
  });

  // Find the total row count
  const maxRow = blocks.reduce((max, b) => Math.max(max, b.row + b.rspan - 1), 0);

  // Build the areas grid (row × col filled with ".")
  const rows = [];
  for (let r = 1; r <= maxRow; r++) {
    const row = new Array(grid.cols).fill('.');
    blocks.forEach((b, i) => {
      if (r >= b.row && r < b.row + b.rspan) {
        for (let c = b.col; c < b.col + b.cspan && c <= grid.cols; c++) {
          row[c - 1] = areaNames[i];
        }
      }
    });
    rows.push(row);
  }

  // Build area lines for CSS output
  const areaLines = rows.map(row => {
    const maxLen = Math.max(...row.map(n => n.length));
    return `    "${row.map(n => n.padEnd(maxLen)).join(' ')}"`;
  });

  const htmlLines = blocks.map((b, i) => blockToAreasHtml(b, areaNames[i], 2));
  const html = `<body class="layout">\n${htmlLines.join('\n')}\n</body>`;

  const areaRules = blocks.map((b, i) =>
    `${b.tag === areaNames[i] ? b.tag : `${b.tag}:nth-of-type(${areaNames[i].split('-')[1]})`} { grid-area: ${areaNames[i]}; }`
  ).join('\n');

  let css = `.layout {
  display: grid;
  grid-template-columns: repeat(${grid.cols}, minmax(0, 1fr));
  grid-template-areas:
${areaLines.join('\n')};
  grid-auto-rows: ${grid.rowSize};
  gap: ${grid.gap};
  max-inline-size: ${grid.maxWidth};
  margin-inline: auto;
}

${areaRules}`;

  if (hasNesting(blocks)) {
    css += `

[data-subgrid] {
  display: grid;
  grid-template-columns: subgrid;
  grid-auto-rows: ${grid.rowSize};
  gap: ${grid.gap};
}

[data-subgrid] > * {
  grid-column: var(--col) / span var(--cspan);
  grid-row: var(--row) / span var(--rspan);
}`;
  }

  return { html, css };
}
