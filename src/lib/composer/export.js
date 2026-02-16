/**
 * Export — JSON → HTML + CSS strings.
 */

/**
 * Generate HTML + CSS using inline placement vars.
 * @param {{ grid: object, blocks: object[] }} data
 * @returns {{ html: string, css: string }}
 */
export function exportPlacementVars(data) {
  const { grid, blocks } = data;

  const htmlLines = blocks.map(b => {
    const vars = `--col:${b.col};--cspan:${b.cspan};--row:${b.row};--rspan:${b.rspan}`;
    const sub = b.subgrid ? ' data-subgrid' : '';
    return `  <${b.tag} style="${vars}"${sub}></${b.tag}>`;
  });

  const html = `<body class="layout">\n${htmlLines.join('\n')}\n</body>`;

  const css = `.layout {
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

  return { html, css };
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
  const names = blocks.map(b => {
    tagCounts[b.tag] = (tagCounts[b.tag] || 0) + 1;
    return tagCounts[b.tag] > 1 ? `${b.tag}-${tagCounts[b.tag]}` : b.tag;
  });
  // Second pass: if a tag appeared more than once, suffix the first occurrence too
  const totalCounts = { ...tagCounts };
  let idx = 0;
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
      for (let c = b.col; c < b.col + b.cspan && c <= grid.cols; c++) {
        row[c - 1] = areaNames[i];
      }
    });
    rows.push(row);
  }

  // Filter to only rows that are within a block's span
  const areaLines = [];
  for (let r = 1; r <= maxRow; r++) {
    const inBlock = blocks.some(b => r >= b.row && r < b.row + b.rspan);
    if (inBlock) {
      // Pad area names for alignment
      const maxLen = Math.max(...rows[r - 1].map(n => n.length));
      areaLines.push(`    "${rows[r - 1].map(n => n.padEnd(maxLen)).join(' ')}"`);
    }
  }

  const htmlLines = blocks.map((b, i) => {
    const sub = b.subgrid ? ' data-subgrid' : '';
    return `  <${b.tag}${sub}></${b.tag}>`;
  });

  const html = `<body class="layout">\n${htmlLines.join('\n')}\n</body>`;

  const areaRules = blocks.map((b, i) =>
    `${b.tag === areaNames[i] ? b.tag : `${b.tag}:nth-of-type(${areaNames[i].split('-')[1]})`} { grid-area: ${areaNames[i]}; }`
  ).join('\n');

  const css = `.layout {
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

  return { html, css };
}
