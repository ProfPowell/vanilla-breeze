/**
 * @file render-dynamic-pages.js
 * @description Renders a small set of pages that still depend on genuine Nunjucks
 * control-flow instead of simple string substitution.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { marked } from '../../src/vendor/marked/marked.esm.js';
import { parseChangelog, groupBadge } from '../../scripts/lib/changelog.js';

const CHANGELOG_PATH = resolve(import.meta.dirname, '../../CHANGELOG.md');
const CHANGELOG_MARKER = '<!-- changelog:releases -->';

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

function formatReleaseDate(release) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(release.rawDate)) return escapeHtml(release.rawDate);
  return new Date(`${release.rawDate}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/**
 * Render CHANGELOG.md as the /changelog/ timeline. The page source carries
 * only frontmatter + chrome and a marker comment; every release comes from
 * the markdown so the page cannot drift from what was published.
 */
function renderChangelog(markdown) {
  const releases = parseChangelog(markdown, { includeUnreleased: true });

  const jumpLinks = releases
    .filter((r) => r.anchor !== 'unreleased')
    .map((r) => `<li><a href="#${r.anchor}" class="version-tag">v${escapeHtml(r.version)}</a></li>`)
    .join('\n        ');

  // The newest published release: named at the top of the page (with the
  // install command) and marked in the list, so "which version is current"
  // never has to be worked out from dates.
  const latest = releases.find((r) => r.anchor !== 'unreleased');
  const latestBlock = latest ? `<p class="latest-release">
      <strong>Latest release:</strong>
      <a href="#${latest.anchor}" class="version-tag">v${escapeHtml(latest.version)}</a>${latest.date ? `, released <time datetime="${escapeHtml(latest.date)}">${formatReleaseDate(latest)}</time>` : ''}.
      Install it with <code>npm install vanilla-breeze@${escapeHtml(latest.version)}</code>.
    </p>

    ` : '';

  const articles = releases.map((r) => {
    const label = r.anchor === 'unreleased' ? 'Unreleased' : `v${escapeHtml(r.version)}`;
    const headingId = `${r.anchor}-heading`;
    const badges = [...new Map(
      r.groups.map((g) => groupBadge(g.heading)).filter(Boolean).map((b) => [b.label, b]),
    ).values()];
    const badgeList = badges.length
      ? `<ul class="inline change-badges" aria-label="What changed">${badges
        .map((b) => `<li><mark class="${b.cls}">${b.label}</mark></li>`).join('')}</ul>`
      : '';
    const current = r === latest ? ' <layout-badge data-variant="subtle" data-color="green">Latest release</layout-badge>' : '';
    const released = r.date
      ? `<p>Released <time datetime="${escapeHtml(r.date)}">${formatReleaseDate(r)}</time>${current}</p>`
      : `<p>In development: not yet released${current}</p>`;
    // Releases are <section>s, not <article>s: several themes (swiss,
    // editorial, organic) style every article as a prose column with a drop
    // cap, which a release list is not.
    const groups = r.groups.map((g) => `<h3>${escapeHtml(g.heading)}</h3>
          ${marked.parse(g.markdown)}`).join('\n          ');

    return `<section id="${r.anchor}" aria-labelledby="${headingId}">
          <header class="version-header">
            <hgroup>
              <h2 id="${headingId}"><a href="#${r.anchor}">${label}</a></h2>
              ${released}
            </hgroup>
            ${badgeList}
          </header>
          ${r.summary ? marked.parse(r.summary) : ''}
          ${groups}
        </section>`;
  }).join('\n\n        ');

  return `${latestBlock}<nav aria-label="Jump to version">
      <ol class="inline version-list">
        ${jumpLinks}
      </ol>
    </nav>

    <section class="changelog-entries" aria-label="Releases">
        ${articles}
    </section>`;
}

// --- Accessibility tables -------------------------------------------------
// Generated from the a11y block in each component's api.json (see
// scripts/build-api-registry.js for the shape). api-drift-check verifies every
// key and attribute named there against the component's source.

const A11Y_KEYBOARD_MARKER = '<!-- generated:a11y-keyboard -->';
const A11Y_ARIA_MARKER = '<!-- generated:a11y-aria -->';
const A11Y_ANNOUNCE_MARKER = '<!-- generated:a11y-announcements -->';
const REGISTRY_PATH = resolve(import.meta.dirname, '../src/_data/apiRegistry.js');

const KEY_LABELS = {
  // No-break spaces keep a two-word key on one line in a narrow column.
  ArrowUp: 'Up Arrow', ArrowDown: 'Down Arrow', ArrowLeft: 'Left Arrow', ArrowRight: 'Right Arrow',
  PageUp: 'Page Up', PageDown: 'Page Down', Escape: 'Esc', Meta: 'Cmd', ContextMenu: 'Menu key',
};

/** "Shift+Tab" becomes nested <kbd>; a bare "+" or a trailing "++" is the plus key. */
function renderKey(key) {
  if (key === 'Printable character') return 'Any character';
  const parts = key === '+' ? ['+'] : key.endsWith('++') ? [...key.slice(0, -2).split('+'), '+'] : key.split('+');
  const caps = parts.map((part) => `<kbd>${escapeHtml(KEY_LABELS[part] ?? part)}</kbd>`);
  return caps.length > 1 ? `<kbd>${caps.join('+')}</kbd>` : caps[0];
}

/** Inline code for anything that looks like markup or an attribute. */
function codeify(text) {
  return escapeHtml(text).replace(/&lt;[a-z][\w-]*(?:(?!&gt;).)*?&gt;|\b(?:aria|data)-[\w-]+(?:=&quot;[^&]*&quot;)?|\brole=&quot;[^&]*&quot;/g, (m) => `<code>${m}</code>`);
}

function a11yComponents(registry, webComponents) {
  const hrefs = new Map();
  for (const group of Object.values(webComponents ?? {})) {
    for (const item of Array.isArray(group) ? group : []) hrefs.set(item.name, item.href);
  }
  return Object.values(registry)
    .filter((m) => m.a11y)
    .sort((a, b) => a.element.localeCompare(b.element))
    .map((m) => ({ name: m.element, href: hrefs.get(m.element), ...m.a11y }));
}

function componentLabel(c) {
  const tag = `<code>&lt;${escapeHtml(c.name)}&gt;</code>`;
  return c.href ? `<a href="${c.href}">${tag}</a>` : tag;
}

function patternLabel(c) {
  return c.patternUrl ? `<a href="${escapeHtml(c.patternUrl)}">${escapeHtml(c.pattern)}</a>` : escapeHtml(c.pattern);
}

function renderA11yKeyboard(components) {
  const withKeys = components.filter((c) => c.keyboard?.length);
  const blocks = withKeys.map((c) => {
    const hasWhen = c.keyboard.some((row) => row.when);
    const rows = c.keyboard.map((row) => (
      `<tr><td>${row.keys.map(renderKey).join(' or ')}</td><td>${codeify(row.action)}</td>${hasWhen ? `<td>${row.when ? codeify(row.when) : '&mdash;'}</td>` : ''}</tr>`
    )).join('\n');
    return `<details id="keys-${escapeHtml(c.name)}">
  <summary><code>&lt;${escapeHtml(c.name)}&gt;</code> <small>${escapeHtml(c.pattern)}</small></summary>
  <table>
    <thead><tr><th>Key</th><th>Action</th>${hasWhen ? '<th>When</th>' : ''}</tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
  ${c.href ? `<p><a href="${c.href}">${escapeHtml(c.name)} documentation</a></p>` : ''}
</details>`;
  }).join('\n');
  return `<p>${withKeys.length} components handle keys of their own. Open one to see them.</p>
<layout-stack data-layout-gap="xs">
${blocks}
</layout-stack>`;
}

function renderA11yAria(components) {
  const rows = components.map((c) => {
    const manages = c.manages?.length ? c.manages.map((item) => `<code>${escapeHtml(item)}</code>`).join(', ') : '&mdash;';
    return `<tr><td>${componentLabel(c)}</td><td>${patternLabel(c)}</td><td>${manages}</td><td>${c.provide ? codeify(c.provide) : '&mdash;'}</td></tr>`;
  }).join('\n');
  return `<data-table>
  <table>
    <thead><tr><th>Component</th><th>Pattern</th><th>Sets for you</th><th>You provide</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
</data-table>`;
}

function renderA11yAnnouncements(components) {
  const rows = components.filter((c) => c.announces).map((c) => (
    `<tr><td>${componentLabel(c)}</td><td>${codeify(c.announces)}</td></tr>`
  )).join('\n');
  return `<table>
  <thead><tr><th>Component</th><th>Announces</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>`;
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

    if (path.includes('docs/architecture/resilience-matrix')) {
      const rendered = renderResilienceSections(this.data.resilience);
      this.file.src = this.file.src
        .replace(/<section>\s*<h2>Component Matrix<\/h2>[\s\S]*?<\/section>/, rendered.matrix)
        .replace(/<section>\s*<h2>Dimensions<\/h2>[\s\S]*?<\/section>/, rendered.dimensions)
        .replace(/<section>\s*<h2>Component Notes<\/h2>[\s\S]*?<\/section>/, rendered.notes);
    }

    if ([A11Y_KEYBOARD_MARKER, A11Y_ARIA_MARKER, A11Y_ANNOUNCE_MARKER].some((marker) => this.file.src.includes(marker))) {
      const { default: registry } = await import(REGISTRY_PATH);
      const components = a11yComponents(registry, this.data.webComponents);
      this.file.src = this.file.src
        .replace(A11Y_KEYBOARD_MARKER, () => renderA11yKeyboard(components))
        .replace(A11Y_ARIA_MARKER, () => renderA11yAria(components))
        .replace(A11Y_ANNOUNCE_MARKER, () => renderA11yAnnouncements(components));
    }

    if (this.file.src.includes(CHANGELOG_MARKER)) {
      this.file.src = this.file.src.replace(
        CHANGELOG_MARKER,
        renderChangelog(readFileSync(CHANGELOG_PATH, 'utf-8')),
      );
    }

  }
}
