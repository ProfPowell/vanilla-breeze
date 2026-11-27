/**
 * Pure builders for the LLM-facing documentation (scripts/build-llms.js).
 *
 * Everything here turns data that already exists (api.json registry entries,
 * docs page frontmatter, the layout vocabulary) into Markdown. No file or
 * network access, so it is unit-testable.
 */

/**
 * @typedef {object} DocPage
 * @property {string} path - site path, e.g. /docs/elements/web-components/tabs/
 * @property {string} title
 * @property {string} description
 * @property {string} [elementName]
 * @property {string} [attributeName]
 * @property {string} [category]
 * @property {string} [layout]
 * @property {string} [example] - first HTML example on the page
 * @property {string} [source] - the page source, for finding an example of another element
 */

/**
 * Read the YAML-ish frontmatter block of a docs page (flat `key: value` lines).
 * @param {string} source
 * @returns {Record<string, string>}
 */
export function parseFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  /** @type {Record<string, string>} */
  const out = {};
  if (!match) return out;
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!pair) continue;
    let value = pair[2].trim();
    if (/^".*"$/.test(value)) {
      try { value = JSON.parse(value); } catch { value = value.slice(1, -1); }
    } else if (/^'.*'$/.test(value)) {
      value = value.slice(1, -1).replaceAll("''", "'");
    }
    out[pair[1]] = value;
  }
  return out;
}

/** @param {string} text */
const decodeEntities = (text) => text
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&');

/**
 * The first HTML example on a docs page: the body of the first
 * `<code-block language="html">`. Pages write the markup raw or
 * entity-escaped; both come back as plain HTML. With `tag`, the first
 * example that uses that element.
 * @param {string} source
 * @param {string} [tag]
 * @returns {string | undefined}
 */
export function firstHtmlExample(source, tag) {
  for (const open of source.matchAll(/<code-block\b[^>]*\blanguage="html"[^>]*>/g)) {
    const start = open.index + open[0].length;
    const end = source.indexOf('</code-block>', start);
    if (end === -1) continue;
    let body = source.slice(start, end).replace(/^\n+|\s+$/g, '');
    if (!body.includes('<') && body.includes('&lt;')) body = decodeEntities(body);
    // Template tags would be noise (and wrong) for a reader of plain HTML.
    if (!body || /\{[{%]/.test(body)) continue;
    if (tag && !new RegExp(`<${tag}[\\s>]`).test(body)) continue;
    return body;
  }
  return undefined;
}

/** @param {unknown} value */
const cell = (value) => String(value ?? '').replaceAll('|', '\\|').replace(/\s*\n\s*/g, ' ').trim();

/** @param {string} text */
const oneLine = (text) => text.replace(/\s+/g, ' ').trim();

/**
 * @param {string[]} head
 * @param {unknown[][]} rows
 */
function table(head, rows) {
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');
}

/** @param {any} attr */
function attributeValues(attr) {
  if (Array.isArray(attr.values) && attr.values.length) {
    return attr.values.map((/** @type {string} */ v) => (v === '' ? '(no value)' : `\`${v}\``)).join(', ');
  }
  return attr.type ?? '';
}

/** @param {any[]} attrs @param {boolean} withTarget */
function attributeTable(attrs, withTarget = false) {
  const head = withTarget ? ['Attribute', 'On', 'Values', 'Default', 'Description'] : ['Attribute', 'Values', 'Default', 'Description'];
  return table(head, attrs.map((a) => {
    const row = [`\`${a.name}\``, attributeValues(a), a.default === undefined ? '' : `\`${a.default}\``, a.description ?? ''];
    if (withTarget) row.splice(1, 0, a.on ?? '');
    return row;
  }));
}

/** @param {string} title @param {any[] | undefined} items @param {(item: any) => unknown[]} row @param {string[]} head */
function section(title, items, head, row) {
  if (!Array.isArray(items) || !items.length) return '';
  return `## ${title}\n\n${table(head, items.map(row))}\n`;
}

const KIND = {
  'web-component': 'Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.',
  'custom-element': 'CSS-only custom element. Works without JavaScript.',
  native: 'Native HTML element with Vanilla Breeze additions.',
};

/**
 * Markdown reference for one registry entry.
 * @param {any} entry - an api.json registry entry
 * @param {{ page?: DocPage, siteUrl: string, version: string, kind?: string }} context - `kind` replaces the line derived from the entry type
 * @returns {string}
 */
export function componentMarkdown(entry, { page, siteUrl, version, kind }) {
  const tag = entry.element;
  const description = entry.description || page?.description || '';
  const parts = [`# <${tag}>\n`];
  if (description) parts.push(`${oneLine(description)}\n`);

  const facts = [`- ${kind ?? KIND[/** @type {keyof typeof KIND} */ (entry.type)] ?? entry.type}`];
  if (entry.formAssociated) facts.push('- Form-associated: takes part in form submission and validation.');
  if (page) facts.push(`- Documentation: ${siteUrl}${page.path}`);
  facts.push(`- Vanilla Breeze ${version}`);
  parts.push(`${facts.join('\n')}\n`);

  if (page?.example) parts.push(`## Example\n\n\`\`\`html\n${page.example}\n\`\`\`\n`);

  if (entry.attributes?.length) parts.push(`## Attributes\n\n${attributeTable(entry.attributes)}\n`);
  if (entry.childAttributes?.length) parts.push(`## Attributes on children\n\n${attributeTable(entry.childAttributes, true)}\n`);

  parts.push(section('Structure', entry.structure, ['Child', 'Description'], (s) => [`\`${s.element}\``, s.description]));
  parts.push(section('Slots', entry.slots, ['Slot', 'Description'], (s) => [`\`${s.name}\``, s.description]));
  parts.push(section('Events', entry.events, ['Event', 'Detail', 'Description'], (e) => [`\`${e.name}\``, e.detail ? `\`${e.detail}\`` : '', e.description]));
  parts.push(section('Methods', entry.methods, ['Method', 'Description'], (m) => [`\`${m.name}\``, m.description]));
  parts.push(section('Properties', entry.properties, ['Property', 'Type', 'Description'], (p) => [`\`${p.name}\``, p.type ? `\`${p.type}\`` : '', p.description]));
  parts.push(section('CSS custom properties', [...(entry.cssProperties ?? []), ...(entry.css?.tokens ?? [])], ['Property', 'Description'], (p) => [`\`${p.name}\``, p.description]));
  parts.push(section('Parts', entry.parts, ['Part', 'Description'], (p) => [`\`${p.name}\``, p.description]));
  parts.push(section('Custom states', entry.states, ['State', 'Description'], (s) => [`\`:state(${s.name})\``, s.description]));

  const a11y = entry.a11y;
  if (a11y) {
    const lines = [];
    if (a11y.pattern) lines.push(`- Pattern: ${a11y.pattern}`);
    if (a11y.provide) lines.push(`- You provide: ${a11y.provide}`);
    if (a11y.manages?.length) lines.push(`- The component manages: ${a11y.manages.map((/** @type {string} */ m) => `\`${m}\``).join(', ')}`);
    if (lines.length) parts.push(`## Accessibility\n\n${lines.join('\n')}\n`);
    parts.push(section('Keyboard', a11y.keyboard, ['Keys', 'Action', 'When'], (k) => [k.keys.map((/** @type {string} */ key) => `\`${key}\``).join(' / '), k.action, k.when ?? '']));
  }

  return `${parts.filter(Boolean).join('\n').trimEnd()}\n`;
}

/**
 * A Markdown list of links with descriptions.
 * @param {{ name: string, href: string, description?: string }[]} items
 */
export function linkList(items) {
  return items
    .map(({ name, href, description }) => `- [${name}](${href})${description ? `: ${oneLine(description)}` : ''}`)
    .join('\n');
}

/**
 * A reference file made of docs pages (attributes, native elements).
 * @param {{ title: string, intro: string, groups: { heading?: string, pages: DocPage[] }[], siteUrl: string, label: (page: DocPage) => string }} options
 */
export function pageReference({ title, intro, groups, siteUrl, label }) {
  const out = [`# ${title}\n`, `${intro}\n`];
  for (const group of groups) {
    if (!group.pages.length) continue;
    if (group.heading) out.push(`## ${group.heading}\n`);
    out.push(`${linkList(group.pages.map((page) => ({ name: label(page), href: `${siteUrl}${page.path}`, description: page.description })))}\n`);
  }
  return `${out.join('\n').trimEnd()}\n`;
}

/**
 * The llms.txt index.
 * @param {object} options
 * @param {string} options.preamble - Markdown with {{version}} and {{layouts}} placeholders
 * @param {string} options.version
 * @param {string[]} options.layouts
 * @param {string} options.base - prefix for links to the generated files ('' for relative links)
 * @param {{ heading: string, items: { name: string, href: string, description?: string }[] }[]} options.sections
 */
export function indexText({ preamble, version, layouts, base, sections }) {
  const [lead, ...rest] = preamble.trim().split(/\n\n/);
  const fill = (/** @type {string} */ text) => text
    .replaceAll('{{version}}', version)
    .replaceAll('{{layouts}}', layouts.map((name) => `\`${name}\``).join(', '));
  const out = [`# Vanilla Breeze ${version}\n`, `> ${fill(oneLine(lead))}\n`, `${fill(rest.join('\n\n'))}\n`];
  for (const { heading, items } of sections) {
    if (!items.length) continue;
    out.push(`## ${heading}\n`);
    out.push(`${linkList(items.map((item) => ({ ...item, href: /^https?:/.test(item.href) ? item.href : `${base}${item.href}` })))}\n`);
  }
  return `${out.join('\n').trimEnd()}\n`;
}

/** @param {string} html */
const plainText = (html) => oneLine(decodeEntities(html.replace(/<code>([\s\S]*?)<\/code>/g, '`$1`').replace(/<[^>]+>/g, '')));

/**
 * Markdown for one pattern page: each section's heading, its prose, and its
 * code examples (HTML and the CSS that goes with it).
 * @param {string} source - the docs page source
 * @param {{ page: DocPage, siteUrl: string, version: string }} context
 * @returns {string | undefined} undefined when the page has no HTML example
 */
export function patternMarkdown(source, { page, siteUrl, version }) {
  const body = source.replace(/^---[\s\S]*?\n---/, '');
  const out = [`# ${page.title}\n`];
  if (page.description) out.push(`${oneLine(page.description)}\n`);
  out.push(`- Documentation: ${siteUrl}${page.path}\n- Vanilla Breeze ${version}\n`);

  let examples = 0;
  const chunks = body.split(/<h2[^>]*>/).slice(1);
  for (const chunk of chunks) {
    const close = chunk.indexOf('</h2>');
    if (close === -1) continue;
    const heading = plainText(chunk.slice(0, close));
    const rest = chunk.slice(close + 5);
    const blocks = [];
    for (const open of rest.matchAll(/<code-block\b([^>]*)>/g)) {
      const language = /\blanguage="([a-z]+)"/.exec(open[1])?.[1] ?? '';
      if (!['html', 'css', 'javascript', 'js'].includes(language)) continue;
      const start = open.index + open[0].length;
      const end = rest.indexOf('</code-block>', start);
      if (end === -1) continue;
      let code = rest.slice(start, end).replace(/^\n+|\s+$/g, '');
      if (language === 'html' ? !code.includes('<') && code.includes('&lt;') : !/\bdata-escape\b/.test(open[1])) code = decodeEntities(code);
      if (!code || /\{[{%]/.test(code)) continue;
      const label = /\blabel="([^"]*)"/.exec(open[1])?.[1];
      blocks.push({ language: language === 'js' ? 'javascript' : language, label, code });
    }
    const prose = [...rest.replace(/<code-block\b[\s\S]*?<\/code-block>/g, '').matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)]
      .map(([, tag, text]) => (tag === 'li' ? `- ${plainText(text)}` : plainText(text)))
      .filter((text) => text && text !== '-');
    if (!blocks.length && !prose.length) continue;
    examples += blocks.filter((b) => b.language === 'html').length;
    out.push(`## ${heading}\n`);
    if (prose.length) out.push(`${prose.join('\n\n').replace(/\n\n- /g, '\n- ')}\n`);
    for (const { language, label, code } of blocks) {
      out.push(`${label ? `${label}:\n\n` : ''}\`\`\`${language}\n${code}\n\`\`\`\n`);
    }
  }
  if (!examples) return undefined;
  return `${out.join('\n').trimEnd()}\n`;
}
