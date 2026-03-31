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

const BORDER_STYLES = [
  { name: 'clean', desc: 'Default' },
  { name: 'sharp', desc: 'Crisp 2px, zero radius' },
  { name: 'soft', desc: 'Large radius, thin' },
  { name: 'sketch', desc: 'Wavy hand-drawn' },
  { name: 'rough', desc: 'Heavy hand, dashed' },
  { name: 'marker', desc: 'Marker strokes' },
  { name: 'kawaii', desc: 'Scalloped cloud' },
  { name: 'pixel', desc: 'Stepped staircase' },
  { name: 'neon', desc: 'Glowing box-shadow' },
  { name: 'double', desc: 'Classic double-line' },
  { name: 'organic', desc: 'Wavy irregular' },
  { name: 'bubbly', desc: 'Dotted + glow' },
];

const COMPARE_ICONS = ['home', 'heart', 'search', 'settings', 'zap'];

const VIGNETTES = [
  {
    id: 'swiss',
    name: 'Swiss',
    border: 'sharp',
    icons: 'lucide',
    quote: 'Grid-based precision. Helvetica heritage. Red accent.',
    iconNames: ['home', 'settings', 'search', 'user'],
    placeholder: 'Enter data...',
    button: 'Submit',
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    border: 'rough',
    icons: 'bold',
    quote: 'Raw structure. No polish. Zero compromise.',
    iconNames: ['home', 'lock', 'zap', 'settings'],
    placeholder: 'ENTER TEXT',
    button: 'GO',
  },
  {
    id: 'cyber',
    name: 'Cyber',
    border: 'neon',
    icons: 'phosphor',
    quote: 'Neon lights in the digital void. Future is now.',
    iconNames: ['zap', 'globe', 'lock', 'settings'],
    placeholder: '// enter command...',
    button: 'Execute',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    border: 'sharp',
    icons: 'lucide',
    quote: 'root@system:~# Green phosphor on CRT black.',
    iconNames: ['home', 'search', 'settings', 'mail'],
    placeholder: '> type command...',
    button: 'Run',
  },
  {
    id: 'organic',
    name: 'Organic',
    border: 'organic',
    icons: 'mage',
    quote: 'Soft curves, natural flow, warm earthy tones.',
    iconNames: ['globe', 'heart', 'calendar', 'bell'],
    placeholder: 'Plant a thought...',
    button: 'Grow',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    border: 'sharp',
    icons: 'lucide',
    quote: 'Clean lines, sharp edges, timeless typography.',
    iconNames: ['bookmark', 'mail', 'globe', 'search'],
    placeholder: 'Search articles...',
    button: 'Find',
  },
  {
    id: 'kawaii',
    name: 'Kawaii',
    border: 'kawaii',
    icons: 'mage',
    quote: 'Everything is cuter with pastel pink and scalloped borders!',
    iconNames: ['heart', 'star', 'music', 'camera'],
    placeholder: 'Type something kawaii...',
    button: 'Send',
  },
  {
    id: '8bit',
    name: '8-Bit',
    border: 'pixel',
    icons: 'bold',
    quote: 'PRESS START TO CONTINUE. Chunky pixels ahead.',
    iconNames: ['star', 'heart', 'zap', 'home'],
    placeholder: 'ENTER NAME...',
    button: 'START',
  },
  {
    id: 'nes',
    name: 'NES',
    border: 'pixel',
    icons: 'bold',
    quote: '4-color palette. Beveled frames. Console pixels.',
    iconNames: ['star', 'heart', 'home', 'settings'],
    placeholder: 'Player 1...',
    button: 'SELECT',
  },
  {
    id: 'win9x',
    name: 'Win9x',
    border: 'sharp',
    icons: 'lucide',
    quote: 'Classic desktop computing. 3D bevels. System gray.',
    iconNames: ['home', 'search', 'settings', 'mail'],
    placeholder: 'C:\\>',
    button: 'OK',
  },
];

const ICON_SETS = ['lucide', 'phosphor', 'tabler', 'bold', 'mage'];

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

function renderThemeLabExtremeOptions(themeRegistry = []) {
  return themeRegistry
    .filter((theme) => theme.category === 'extreme')
    .map((theme) => `<option value="${escapeHtml(theme.id)}">${escapeHtml(theme.name)}</option>`)
    .join('\n');
}

function renderThemeLabBorderGallery() {
  return BORDER_STYLES.map((style) => `<article class="border-card" data-border-style="${style.name}">
      <icon-wc name="star"></icon-wc>
      <h3>${escapeHtml(style.name)}</h3>
      <p>${escapeHtml(style.desc)}</p>
    </article>`).join('\n');
}

function renderThemeLabIconRows() {
  return COMPARE_ICONS.map((name) => `<span class="label">${escapeHtml(name)}</span>
    <span><icon-wc name="${escapeHtml(name)}" set="lucide"></icon-wc></span>
    <span><icon-wc name="${escapeHtml(name)}" set="phosphor"></icon-wc></span>
    <span><icon-wc name="${escapeHtml(name)}" set="tabler"></icon-wc></span>
    <span><icon-wc name="${escapeHtml(name)}" set="bold"></icon-wc></span>
    <span><icon-wc name="${escapeHtml(name)}" set="mage"></icon-wc></span>`).join('\n');
}

function renderThemeLabVignettes() {
  return VIGNETTES.map((vignette) => {
    const icons = vignette.iconNames
      .map((iconName) => `<icon-wc name="${escapeHtml(iconName)}" set="${escapeHtml(vignette.icons)}"></icon-wc>`)
      .join('\n        ');

    return `<article class="vignette" data-theme="${escapeHtml(vignette.id)}" data-border-style="${escapeHtml(vignette.border)}">
      <h3>${escapeHtml(vignette.name)}</h3>
      <span class="icon-row">
        ${icons}
      </span>
      <blockquote>${escapeHtml(vignette.quote)}</blockquote>
      <form onsubmit="return false">
        <input type="text" placeholder="${escapeHtml(vignette.placeholder)}">
        <button type="button">${escapeHtml(vignette.button)}</button>
      </form>
      <button type="button" class="open-in-composer" data-composer-theme="${escapeHtml(vignette.id)}">Open in Composer</button>
    </article>`;
  }).join('\n');
}

function renderThemeComposerOptions(themeRegistry = []) {
  const groups = [
    { category: 'color', label: 'Color Themes' },
    { category: 'personality', label: 'Personality Themes' },
    { category: 'extreme', label: 'Extreme Themes' },
  ];

  return groups.map(({ category, label }) => {
    const items = themeRegistry.filter((theme) => theme.category === category);
    if (!items.length) return '';

    const options = items
      .map((theme) => `<option value="${escapeHtml(theme.id)}">${escapeHtml(theme.name)}</option>`)
      .join('\n');

    return `<optgroup label="${label}">
${options}
            </optgroup>`;
  }).filter(Boolean).join('\n');
}

function renderThemeComposerPreset(values, inputName, defaultValue) {
  return values.map((value) => {
    const checked = value === defaultValue ? ' checked' : '';
    return `<label><input type="radio" name="${inputName}" value="${escapeHtml(value)}"${checked}><span>${escapeHtml(value)}</span></label>`;
  }).join('\n');
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

    if (path.includes('docs/tools/theme-lab/index')) {
      this.file.src = this.file.src
        .replace(
          /(<optgroup label="Extreme">)[\s\S]*?(<\/optgroup>)/,
          `$1\n${renderThemeLabExtremeOptions(this.data.themeRegistry)}\n      $2`,
        )
        .replace(
          /(<section class="border-gallery">)[\s\S]*?(<\/section>)/,
          `$1\n${renderThemeLabBorderGallery()}\n  $2`,
        )
        .replace(
          /(<section class="icon-compare-grid">)[\s\S]*?(<\/section>)/,
          `$1
    <span class="header label">Name</span>
    <span class="header">Lucide</span>
    <span class="header">Phosphor</span>
    <span class="header">Tabler</span>
    <span class="header">Bold</span>
    <span class="header">Mage</span>
${renderThemeLabIconRows()}
  $2`,
        )
        .replace(
          /(<section class="vignettes-grid">)[\s\S]*?(<\/section>)/,
          `$1\n${renderThemeLabVignettes()}\n  $2`,
        );
    }

    if (path.includes('lab/experiments/theme-composer')) {
      this.file.src = this.file.src
        .replace(
          /\s*\{% for theme in themeRegistry %\}[\s\S]*?\{% endfor %\}\s*/,
          `\n${renderThemeComposerOptions(this.data.themeRegistry)}\n`,
        )
        .replace(
          /\s*\{% for bs in borderStyles %\}[\s\S]*?\{% endfor %\}\s*/,
          `\n${renderThemeComposerPreset(BORDER_STYLES.map((style) => style.name), 'border-style', 'clean')}\n`,
        )
        .replace(
          /\s*\{% for is in iconSets %\}[\s\S]*?\{% endfor %\}\s*/,
          `\n${renderThemeComposerPreset(ICON_SETS, 'icon-set', 'lucide')}\n`,
        );
    }
  }
}
