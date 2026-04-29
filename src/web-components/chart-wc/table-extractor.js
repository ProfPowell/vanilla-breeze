/**
 * Table-to-SVC data extractor
 *
 * Reads a semantic HTML <table> and converts it into the data format
 * expected by SVC chart constructors.
 *
 * Cartesian charts: [{name, values: [...]}] or [{name, values: {key: val}}]
 * Pie charts: {label: value}
 */

/**
 * Parse a cell's text content into a numeric value.
 * Strips currency symbols, commas, percent signs, and whitespace.
 * @param {HTMLTableCellElement} td
 * @returns {number|null}
 */
function parseCellValue(td) {
  const text = td.textContent.trim();
  if (!text) return null;
  const cleaned = text.replace(/[$€£¥,% ]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Determine which columns to include based on header attributes.
 * Returns an array of {index, name} for included data columns.
 * @param {HTMLTableRowElement} headerRow
 * @returns {{labelIndex: number, columns: Array<{index: number, name: string}>}}
 */
function resolveColumns(headerRow) {
  const ths = [...headerRow.cells];
  let labelIndex = -1;
  const columns = [];

  for (let i = 0; i < ths.length; i++) {
    const th = ths[i];

    if (th.hasAttribute('data-chart-ignore')) continue;

    if (th.hasAttribute('data-chart-label') || th.getAttribute('scope') === 'row') {
      labelIndex = i;
      continue;
    }

    if (th.hasAttribute('data-chart-series') || !th.hasAttribute('data-chart-ignore')) {
      columns.push({index: i, name: th.textContent.trim()});
    }
  }

  // If no explicit label column found, assume first <th> in thead is the label
  if (labelIndex === -1 && ths.length > 0) {
    const first = ths[0];
    if (!first.textContent.trim() || first.tagName === 'TH') {
      labelIndex = 0;
      // Remove it from data columns if accidentally included
      const idx = columns.findIndex((c) => c.index === 0);
      if (idx !== -1) columns.splice(idx, 1);
    }
  }

  return {labelIndex, columns};
}

/**
 * Extract data from a table for cartesian chart types (bar, column, line, area, scatter).
 * @param {HTMLTableElement} table
 * @returns {{data: Array, config: object}}
 */
function extractCartesian(table) {
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody') || table;
  const headerRow = thead?.querySelector('tr');
  const rows = [...tbody.querySelectorAll('tr')];

  if (!headerRow || rows.length === 0) {
    return {data: [], config: {}};
  }

  const {labelIndex, columns} = resolveColumns(headerRow);

  // Determine if data should be associative (has labels) or plain arrays
  const hasLabels = labelIndex !== -1;
  const series = columns.map((col) => ({name: col.name, values: hasLabels ? {} : []}));

  for (const row of rows) {
    const cells = [...row.cells];
    const label = hasLabels ? (cells[labelIndex]?.textContent.trim() || '') : null;

    for (let s = 0; s < columns.length; s++) {
      const cell = cells[columns[s].index];
      const value = cell ? parseCellValue(cell) : null;

      if (hasLabels && label) {
        series[s].values[label] = value ?? 0;
      } else {
        series[s].values.push(value ?? 0);
      }
    }
  }

  const config = {};
  const caption = table.querySelector('caption');
  if (caption) {
    config.title = {text: caption.textContent.trim(), enabled: true};
  }

  return {data: series, config};
}

/**
 * Extract data from a table for pie charts.
 * Expects rows with [label, value] cells.
 * @param {HTMLTableElement} table
 * @returns {{data: object, config: object}}
 */
function extractPie(table) {
  const tbody = table.querySelector('tbody') || table;
  const rows = [...tbody.querySelectorAll('tr')];
  const data = {};

  for (const row of rows) {
    const cells = [...row.cells];
    const th = row.querySelector('th');
    const label = th ? th.textContent.trim() : cells[0]?.textContent.trim();
    const valueCell = th ? cells[1] || cells[0] : cells[1];
    const value = valueCell ? parseCellValue(valueCell) : null;

    if (label && value != null) {
      data[label] = value;
    }
  }

  const config = {};
  const caption = table.querySelector('caption');
  if (caption) {
    config.title = {text: caption.textContent.trim(), enabled: true};
  }

  return {data, config};
}

/**
 * Extract scatter/bubble data from a table.
 * Expects rows with [label, x, y] or [label, x, y, size] cells.
 * @param {HTMLTableElement} table
 * @returns {{data: Array, config: object}}
 */
function extractScatter(table) {
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody') || table;
  const headerRow = thead?.querySelector('tr');
  const rows = [...tbody.querySelectorAll('tr')];

  // For scatter, we group rows by a series column or treat all as one series
  const seriesMap = new Map();

  for (const row of rows) {
    const cells = [...row.cells];
    const th = row.querySelector('th');
    const seriesName = th ? th.textContent.trim() : 'Data';
    const dataCells = th ? [...row.querySelectorAll('td')] : cells.slice(1);

    if (!seriesMap.has(seriesName)) {
      seriesMap.set(seriesName, []);
    }

    const values = dataCells.map((td) => parseCellValue(td)).filter((v) => v != null);
    if (values.length >= 2) {
      seriesMap.get(seriesName).push(values);
    }
  }

  const data = [...seriesMap.entries()].map(([name, values]) => ({name, values}));
  const config = {};
  const caption = table.querySelector('caption');
  if (caption) {
    config.title = {text: caption.textContent.trim(), enabled: true};
  }

  return {data, config};
}

/**
 * Main extraction function. Determines chart type and delegates.
 * @param {HTMLTableElement} table
 * @param {string} chartType - One of: bar, column, line, area, pie, ring, scatter, bubble
 * @returns {{data: Array|object, config: object}}
 */
export function extractTableData(table, chartType) {
  if (!table || !table.querySelector('tbody, tr')) {
    return {data: null, config: {}};
  }

  const type = (chartType || '').toLowerCase();

  if (type === 'pie' || type === 'ring') {
    return extractPie(table);
  }

  if (type === 'scatter' || type === 'bubble') {
    return extractScatter(table);
  }

  return extractCartesian(table);
}

/**
 * Read config hints from table data attributes.
 * Maps VB chart attributes to SVC config equivalents.
 * @param {HTMLTableElement} table
 * @returns {object} SVC config fragment
 */
export function extractTableConfig(table) {
  const config = {};

  if (table.hasAttribute('data-tooltip')) {
    config.tooltip = {enabled: true};
  }
  if (table.hasAttribute('data-legend')) {
    config.legend = {enabled: true};
  }
  if (table.hasAttribute('data-grid')) {
    config.guides = {x: {enabled: true}, y: {enabled: true}};
  }
  if (table.hasAttribute('data-labels')) {
    config.plot = {node: {label: {enabled: true}}};
  }

  return config;
}
