/**
 * Build a plain HTML data table from resolved chart data.
 *
 * chart-wc renders its SVG aria-hidden; for sources that are not an
 * authored <table> (.data, data-values, <script>, <template>) this table is
 * the text alternative. It is the inverse of table-extractor.js:
 *
 *   Cartesian  [{name, values: {label: v}}] | [{name, values: [v, ...]}]
 *              → one row per label, one column per series
 *   Pie/ring   {label: v} → one row per label, a single value column
 *   Scatter    [{name, values: [[x, y, size?], ...]}]
 *              → one row per point: series, x, y (, size)
 */

/** @param {unknown} v */
function formatValue(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v.toLocaleString();
  if (v == null) return '';
  return String(v);
}

/**
 * @param {HTMLTableRowElement} row
 * @param {'th' | 'td'} tag
 * @param {unknown} text
 * @param {string} [scope]
 */
function cell(row, tag, text, scope) {
  const el = document.createElement(tag);
  el.textContent = formatValue(text);
  if (scope) el.scope = scope;
  row.append(el);
  return el;
}

/**
 * @param {HTMLTableElement} table
 * @param {unknown[]} headers
 */
function headerRow(table, headers) {
  const row = table.createTHead().insertRow();
  headers.forEach((h) => cell(row, 'th', h, 'col'));
}

/**
 * @param {object} opts
 * @param {*} opts.data - Resolved chart data.
 * @param {string} opts.type - Chart type (bar, line, pie, scatter, ...).
 * @param {string} [opts.caption] - Table caption (chart title).
 * @param {string} [opts.labelX] - Category / x axis label.
 * @param {string} [opts.labelY] - Value / y axis label.
 * @returns {HTMLTableElement | null} The table, or null for unusable data.
 */
export function buildDataTable({ data, type, caption, labelX, labelY }) {
  if (data == null || typeof data !== 'object') return null;

  const table = document.createElement('table');
  table.createCaption().textContent = caption || 'Chart data';
  const body = table.createTBody();

  if (!Array.isArray(data)) {
    // Pie / ring: {label: value}
    headerRow(table, [labelX || 'Label', labelY || 'Value']);
    for (const [label, value] of Object.entries(data)) {
      const row = body.insertRow();
      cell(row, 'th', label, 'row');
      cell(row, 'td', value);
    }
    return table;
  }

  const series = data.filter((s) => s && typeof s === 'object');
  if (!series.length) return null;

  if (type === 'scatter' || type === 'bubble') {
    const hasSize = series.some((s) => Array.isArray(s.values) && s.values.some((p) => Array.isArray(p) && p.length > 2));
    headerRow(table, ['Series', labelX || 'X', labelY || 'Y', ...(hasSize ? ['Size'] : [])]);
    series.forEach((s, i) => {
      for (const point of Array.isArray(s.values) ? s.values : []) {
        if (!Array.isArray(point)) continue;
        const row = body.insertRow();
        cell(row, 'th', s.name ?? `Series ${i + 1}`, 'row');
        cell(row, 'td', point[0]);
        cell(row, 'td', point[1]);
        if (hasSize) cell(row, 'td', point[2]);
      }
    });
    return table;
  }

  // Cartesian: union of category labels in first-seen order.
  /** @type {string[]} */
  const labels = [];
  const seen = new Set();
  for (const s of series) {
    const values = s.values ?? {};
    const keys = Array.isArray(values) ? values.map((_, i) => String(i + 1)) : Object.keys(values);
    for (const k of keys) {
      if (!seen.has(k)) { seen.add(k); labels.push(k); }
    }
  }

  headerRow(table, [labelX || '', ...series.map((s, i) => s.name ?? `Series ${i + 1}`)]);
  for (const label of labels) {
    const row = body.insertRow();
    cell(row, 'th', label, 'row');
    for (const s of series) {
      const values = s.values ?? {};
      cell(row, 'td', Array.isArray(values) ? values[Number(label) - 1] : values[label]);
    }
  }
  return table;
}
