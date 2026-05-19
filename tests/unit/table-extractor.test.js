// @ts-nocheck -- unit test fakes intentionally diverge from DOM types
/**
 * Unit tests for chart-wc table-extractor module
 *
 * Tests data extraction from HTML tables into SVC-compatible data formats.
 * Uses minimal DOM mock since the project doesn't use jsdom.
 *
 * Run with: node --test tests/unit/table-extractor.test.js
 */

import {describe, it} from 'node:test';
import assert from 'node:assert/strict';

// --- Minimal DOM mock ---

class MockElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this._attributes = new Map();
    this._children = [];
    this.textContent = '';
    this._classList = new Set();
  }

  get cells() {
    return this._children.filter((c) => c.tagName === 'TD' || c.tagName === 'TH');
  }

  get classList() {
    const self = this;
    return {
      add(cls) { self._classList.add(cls); },
      remove(cls) { self._classList.delete(cls); },
      contains(cls) { return self._classList.has(cls); },
    };
  }

  getAttribute(name) {
    return this._attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this._attributes.set(name, String(value));
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  querySelector(selector) {
    return this._findOne(selector);
  }

  querySelectorAll(selector) {
    return this._findAll(selector);
  }

  _findOne(selector) {
    const results = this._findAll(selector);
    return results[0] || null;
  }

  _findAll(selector) {
    const results = [];
    const match = (el) => matchesSelector(el, selector);

    const walk = (el) => {
      if (match(el)) results.push(el);
      for (const child of el._children) walk(child);
    };

    for (const child of this._children) walk(child);
    return results;
  }

  appendChild(child) {
    this._children.push(child);
    return child;
  }
}

function matchesSelector(el, selector) {
  // Very basic selector matching for our test needs
  // Handle comma-separated selectors (e.g. "tbody, tr")
  if (selector.includes(',')) {
    return selector.split(',').some((s) => matchesSelector(el, s.trim()));
  }

  const tag = selector.replace(/\[.*\]/, '').replace(/[.#].*/, '').trim().toLowerCase();
  const attrMatch = selector.match(/\[(.+?)(?:=["']?(.+?)["']?)?\]/);

  if (tag && el.tagName.toLowerCase() !== tag) return false;
  if (attrMatch) {
    const attr = attrMatch[1];
    if (attrMatch[2]) {
      if (el.getAttribute(attr) !== attrMatch[2]) return false;
    } else {
      if (!el.hasAttribute(attr)) return false;
    }
  }
  return true;
}

// Helper to build a table element from arrays
function buildTable({caption, headers, rows, type, attrs = {}}) {
  const table = new MockElement('table');

  for (const [key, val] of Object.entries(attrs)) {
    table.setAttribute(key, val);
  }
  if (type) table.setAttribute('data-type', type);

  if (caption) {
    const cap = new MockElement('caption');
    cap.textContent = caption;
    table.appendChild(cap);
  }

  if (headers) {
    const thead = new MockElement('thead');
    const tr = new MockElement('tr');
    for (const h of headers) {
      const th = new MockElement('th');
      th.textContent = typeof h === 'string' ? h : h.text;
      if (typeof h === 'object') {
        for (const [k, v] of Object.entries(h.attrs || {})) {
          th.setAttribute(k, v);
        }
      }
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  }

  const tbody = new MockElement('tbody');
  for (const row of rows) {
    const tr = new MockElement('tr');
    for (let i = 0; i < row.length; i++) {
      // First column is a header (th) if the first header cell is empty or has no text
      const firstHeaderEmpty = headers && (
        (typeof headers[0] === 'string' && headers[0] === '') ||
        (typeof headers[0] === 'object' && !headers[0].text)
      );
      const isHeader = i === 0 && firstHeaderEmpty;
      const cell = new MockElement(isHeader ? 'th' : 'td');
      cell.textContent = String(row[i]);
      tr.appendChild(cell);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  return table;
}

// --- Dynamic import with globalThis mock ---

let extractTableData, extractTableConfig;

// We need to import the module — it uses no DOM globals at top level
const mod = await import('../../src/web-components/chart-wc/table-extractor.js');
extractTableData = mod.extractTableData;
extractTableConfig = mod.extractTableConfig;

// ---------------------------------------------------------------------------
// extractTableData — cartesian
// ---------------------------------------------------------------------------

describe('extractTableData — cartesian', () => {

  it('extracts bar chart data from table', () => {
    const table = buildTable({
      headers: ['', 'Revenue'],
      rows: [
        ['Q1', '100'],
        ['Q2', '150'],
        ['Q3', '130'],
      ],
      type: 'bar',
    });

    const {data} = extractTableData(table, 'bar');
    assert.equal(data.length, 1);
    assert.equal(data[0].name, 'Revenue');
    assert.deepEqual(data[0].values, {Q1: 100, Q2: 150, Q3: 130});
  });

  it('extracts multi-series data', () => {
    const table = buildTable({
      headers: ['', 'Online', 'In-Store'],
      rows: [
        ['Jan', '12000', '8000'],
        ['Feb', '15000', '9000'],
      ],
      type: 'line',
    });

    const {data} = extractTableData(table, 'line');
    assert.equal(data.length, 2);
    assert.equal(data[0].name, 'Online');
    assert.equal(data[1].name, 'In-Store');
    assert.deepEqual(data[0].values, {Jan: 12000, Feb: 15000});
    assert.deepEqual(data[1].values, {Jan: 8000, Feb: 9000});
  });

  it('extracts caption as title config', () => {
    const table = buildTable({
      caption: 'Sales Report',
      headers: ['', 'Value'],
      rows: [['A', '10']],
      type: 'column',
    });

    const {config} = extractTableData(table, 'column');
    assert.equal(config.title.text, 'Sales Report');
    assert.equal(config.title.enabled, true);
  });

  it('handles currency-formatted values', () => {
    const table = buildTable({
      headers: ['', 'Amount'],
      rows: [
        ['Item A', '$1,234'],
        ['Item B', '$2,567'],
      ],
      type: 'bar',
    });

    const {data} = extractTableData(table, 'bar');
    assert.deepEqual(data[0].values, {'Item A': 1234, 'Item B': 2567});
  });

  it('returns empty data for empty table', () => {
    const {data} = extractTableData(null, 'bar');
    assert.equal(data, null);
  });
});

// ---------------------------------------------------------------------------
// extractTableData — pie
// ---------------------------------------------------------------------------

describe('extractTableData — pie', () => {

  it('extracts pie data as key-value object', () => {
    const table = buildTable({
      headers: ['Browser', 'Share'],
      rows: [
        ['Chrome', '65'],
        ['Safari', '18'],
        ['Firefox', '8'],
      ],
      type: 'pie',
    });

    const {data} = extractTableData(table, 'pie');
    assert.deepEqual(data, {Chrome: 65, Safari: 18, Firefox: 8});
  });
});

// ---------------------------------------------------------------------------
// extractTableData — scatter
// ---------------------------------------------------------------------------

describe('extractTableData — scatter', () => {

  it('extracts scatter data as tuple arrays', () => {
    const table = buildTable({
      headers: ['', 'X', 'Y'],
      rows: [
        ['A', '10', '20'],
        ['A', '15', '25'],
        ['B', '12', '22'],
      ],
      type: 'scatter',
    });

    const {data} = extractTableData(table, 'scatter');
    assert.equal(data.length, 2); // Two groups: A and B
    assert.equal(data[0].name, 'A');
    assert.deepEqual(data[0].values, [[10, 20], [15, 25]]);
    assert.equal(data[1].name, 'B');
    assert.deepEqual(data[1].values, [[12, 22]]);
  });
});

// ---------------------------------------------------------------------------
// extractTableConfig
// ---------------------------------------------------------------------------

describe('extractTableConfig', () => {

  it('extracts data-tooltip attribute', () => {
    const table = new MockElement('table');
    table.setAttribute('data-tooltip', '');
    const config = extractTableConfig(table);
    assert.deepEqual(config.tooltip, {enabled: true});
  });

  it('extracts data-legend attribute', () => {
    const table = new MockElement('table');
    table.setAttribute('data-legend', '');
    const config = extractTableConfig(table);
    assert.deepEqual(config.legend, {enabled: true});
  });

  it('extracts data-grid attribute', () => {
    const table = new MockElement('table');
    table.setAttribute('data-grid', '');
    const config = extractTableConfig(table);
    assert.deepEqual(config.guides, {x: {enabled: true}, y: {enabled: true}});
  });

  it('returns empty config when no attributes', () => {
    const table = new MockElement('table');
    const config = extractTableConfig(table);
    assert.deepEqual(config, {});
  });
});
