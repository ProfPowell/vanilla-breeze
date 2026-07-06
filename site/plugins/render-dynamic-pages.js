/**
 * @file render-dynamic-pages.js
 * @description Renders a small set of pages that still depend on genuine Nunjucks
 * control-flow instead of simple string substitution.
 */

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatKb(value) {
  return `${(Number(value || 0) / 1024).toFixed(1)} KB`;
}

function truncate(text, max = 50) {
  const value = String(text ?? '');
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function renderPerformanceSection(report = {}) {
  const artifacts = Object.entries(report.artifacts || {});
  const topLevel = artifacts.filter(([name]) => !name.startsWith('themes/') && !name.startsWith('components/'));
  const themes = artifacts.filter(([name]) => name.startsWith('themes/'));
  const components = artifacts.filter(([name]) => name.startsWith('components/'));

  const renderMainRows = () => topLevel.map(([name, data]) => {
    const budget = data.budget ? formatKb(data.budget) : '--';
    const status = data.status === 'ok'
      ? 'OK'
      : data.status === 'exceeded'
        ? '<strong>OVER</strong>'
        : '--';

    return `<tr>
        <td><code>${escapeHtml(name)}</code></td>
        <td>${formatKb(data.raw)}</td>
        <td>${formatKb(data.gzip)}</td>
        <td>${formatKb(data.brotli)}</td>
        <td>${budget}</td>
        <td>${status}</td>
      </tr>`;
  }).join('\n');

  const renderSimpleRows = (rows) => rows.map(([name, data]) => `<tr>
          <td><code>${escapeHtml(name)}</code></td>
          <td>${formatKb(data.gzip)}</td>
          <td>${formatKb(data.brotli)}</td>
        </tr>`).join('\n');

  const inventory = artifacts.length
    ? `<table>
    <thead>
      <tr>
        <th>Artifact</th>
        <th>Raw</th>
        <th>Gzip</th>
        <th>Brotli</th>
        <th>Budget</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
${renderMainRows()}
    </tbody>${report.totals && Object.keys(report.totals).length ? `
    <tfoot>
      <tr>
        <th>Total</th>
        <td>${formatKb(report.totals.raw)}</td>
        <td>${formatKb(report.totals.gzip)}</td>
        <td>${formatKb(report.totals.brotli)}</td>
        <td></td>
        <td></td>
      </tr>
    </tfoot>` : ''}
  </table>`
    : `<p><em>Budget report not available. Run <code>npm run build:cdn &amp;&amp; npm run budget</code> to generate.</em></p>`;

  const themed = themes.length
    ? `<table>
      <thead>
        <tr>
          <th>Theme</th>
          <th>Gzip</th>
          <th>Brotli</th>
        </tr>
      </thead>
      <tbody>
${renderSimpleRows(themes)}
      </tbody>
    </table>`
    : '<p><em>No data available.</em></p>';

  const componentRows = components.length
    ? `<table>
      <thead>
        <tr>
          <th>Component</th>
          <th>Gzip</th>
          <th>Brotli</th>
        </tr>
      </thead>
      <tbody>
${renderSimpleRows(components)}
      </tbody>
    </table>`
    : '<p><em>No data available.</em></p>';

  return `<section>
  <h2>Bundle Inventory</h2>
  <p>Every CDN artifact with raw, gzip, and brotli sizes. Data from the latest build.</p>

  ${inventory}

  <details>
    <summary>Theme sizes</summary>
    ${themed}
  </details>

  <details>
    <summary>Individual component sizes</summary>
    ${componentRows}
  </details>
</section>`;
}

function renderResilienceSections(resilience = {}) {
  const dimensions = resilience.dimensions || [];
  const components = resilience.components || [];

  const thead = dimensions.map((dim) => (
    `<th><tool-tip>${escapeHtml(dim.label)}<span role="tooltip">${escapeHtml(dim.description)}</span></tool-tip></th>`
  )).join('');

  const tbody = components.map((comp) => {
    const cells = dimensions.map((dim) => {
      const status = comp[dim.key] || 'none';
      const label = status === 'full' ? 'Full' : status === 'partial' ? 'Partial' : 'None';
      return `<td data-status="${status}">${label}</td>`;
    }).join('');

    const notesCell = comp.notes
      ? `<td><a href="#note-${escapeHtml(comp.name)}">${escapeHtml(truncate(comp.notes))}</a></td>`
      : '<td>&mdash;</td>';

    return `<tr><td><code>&lt;${escapeHtml(comp.name)}&gt;</code></td>${cells}${notesCell}</tr>`;
  }).join('\n');

  const dimensionList = dimensions.map((dim) => (
    `<dt>${escapeHtml(dim.label)}</dt>
    <dd>${escapeHtml(dim.description)}</dd>`
  )).join('\n');

  const notesList = components
    .filter((comp) => comp.notes)
    .map((comp) => (
      `<dt id="note-${escapeHtml(comp.name)}"><code>&lt;${escapeHtml(comp.name)}&gt;</code></dt>
    <dd>${escapeHtml(comp.notes)}</dd>`
    ))
    .join('\n');

  return {
    matrix: `<section>
  <h2>Component Matrix</h2>

  <data-table>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          ${thead}
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
${tbody}
      </tbody>
    </table>
  </data-table>
</section>`,
    dimensions: `<section>
  <h2>Dimensions</h2>

  <dl>
${dimensionList}
  </dl>
</section>`,
    notes: `<section>
  <h2>Component Notes</h2>
  <p>Detailed notes for components with <strong>Partial</strong> or <strong>None</strong> ratings.</p>

  <dl>
${notesList}
  </dl>
</section>`,
  };
}

export class RenderDynamicPages {
  constructor({ file, data }) {
    this.file = file;
    this.data = data;
  }

  async init() {
    if (!this.file?.src || !this.file.path?.endsWith('.html')) return;

    const path = this.file.path;

    if (path.includes('docs/performance/index')) {
      this.file.src = this.file.src.replace(
        /<section>\s*<h2>Bundle Inventory<\/h2>[\s\S]*?<\/section>/,
        renderPerformanceSection(this.data.budgetReport),
      );
    }

    if (path.includes('docs/concepts/resilience-matrix')) {
      const rendered = renderResilienceSections(this.data.resilience);
      this.file.src = this.file.src
        .replace(/<section>\s*<h2>Component Matrix<\/h2>[\s\S]*?<\/section>/, rendered.matrix)
        .replace(/<section>\s*<h2>Dimensions<\/h2>[\s\S]*?<\/section>/, rendered.dimensions)
        .replace(/<section>\s*<h2>Component Notes<\/h2>[\s\S]*?<\/section>/, rendered.notes);
    }

  }
}
