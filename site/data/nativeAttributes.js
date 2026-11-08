/**
 * @file nativeAttributes.js
 * @description Build-time source for the native-attribute groups in the
 * attribute index (/docs/attributes/, /docs/attributes/native/) and the
 * "Native Attributes" sidebar.
 *
 * The grouping is NOT written here. Each native attribute page declares it in
 * its own frontmatter:
 *
 *   attributeType: native
 *   nativeGroup: Forms            (one of NATIVE_GROUPS)
 *   attributeName: "min / max / step"
 *
 * readNativePages() scans site/src/pages/docs/attributes/*.html for those
 * keys, and buildNativeCategories() turns them into index categories in the
 * fixed group order below, alphabetical within a group. The only hand-written
 * parts are the one-line index copy (INDEX_COPY, keyed by page slug) and a few
 * alias rows (ALIASES) for attributes documented on another attribute's page
 * (fetchpriority on loading, command on commandfor…).
 *
 * tests/unit/native-attribute-index.test.js fails when a native page has no
 * group or no index copy, when copy exists for a page that doesn't, or when an
 * alias points at a page or anchor that doesn't exist.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '../..');
export const PAGES_DIR = 'site/src/pages/docs/attributes';

/** Group labels in display order, with their category keys. */
export const NATIVE_GROUPS = [
  ['global', 'Global'],
  ['internationalization', 'Internationalization'],
  ['accessibility', 'Accessibility'],
  ['forms', 'Forms'],
  ['interactivity', 'Interactivity'],
  ['links-security', 'Links & Security'],
  ['embeds', 'Embeds'],
  ['media', 'Media'],
  ['performance', 'Performance'],
  ['structure', 'Structure'],
];

/** One-line index descriptions (<= ~90 chars), keyed by page slug. */
export const INDEX_COPY = {
  // Global
  accesskey: 'Browser shortcut (modifier + key) to focus or activate an element; data-hotkey is usually better',
  autocapitalize: 'How virtual keyboards and voice input capitalize text; set per field or on the form',
  autocorrect: 'Automatic spelling and punctuation correction on or off; Baseline 2026, inherits from form',
  autofocus: 'Focus on page load or when a dialog or popover opens; the first one in a scope wins',
  class: "VB's element-scoped variants (button.secondary, nav.pills); state lives in data-*/ARIA",
  is: 'Customized built-in elements; no Safari support, VB uses data-* enhancers instead',
  spellcheck: 'Browser spell-checking on or off for editable text; inherited; off for code and secrets',
  tabindex: 'Focusability and Tab order: 0 for a stop, -1 for script focus, never positive',
  title: 'Mouse-only tooltip and last-resort accessible name; VB styles abbr[title], tool-tip upgrades it',
  // Internationalization
  dir: 'Text direction (ltr, rtl, auto); VB mirrors direction-specific UI via :dir(rtl)',
  lang: 'Content language: pronunciation, quotes, script typography, hyphenation, number/date locale',
  translate: 'Keep code, brand names and translatable attributes out of machine translation',
  // Accessibility
  'aria-states': 'aria-current, -pressed, -expanded, -disabled, -busy, -invalid, -sort: what VB styles and sets',
  // Forms
  accept: 'File types a file input offers; data-upload applies it to drops too',
  autocomplete: 'Autofill tokens for names, addresses, cards, passwords, passkeys and codes',
  dirname: "Submit a field's text direction (ltr/rtl) alongside its value",
  disabled: 'Turn a control or fieldset off: no focus, no validation, not submitted',
  enterkeyhint: "Label on the virtual keyboard's Enter key: next, done, search, send",
  form: 'Associate a control with a form by id, from anywhere in the page',
  formaction: 'Per-button action, method, enctype, target and novalidate overrides',
  inputmode: 'Choose the virtual keyboard without changing the input type',
  list: 'Datalist suggestions for text, range, colour and date inputs',
  'min-max-step': 'Ranges and increments for number, range, date and time inputs',
  'minlength-maxlength': 'Length limits for text fields and textareas, with a live counter',
  multiple: 'Several values in a select, email or file input; select size',
  novalidate: 'Skip submit-time validation for a form or one button (formnovalidate)',
  pattern: 'Regex constraint on text inputs, compiled with the v flag',
  placeholder: 'Short format example shown in an empty field; not a label',
  readonly: 'Non-editable but focusable and submitted; dashed VB styling',
  required: 'The control must have a value; VB adds the asterisk and messages',
  wrap: "Whether a textarea's submitted value gets its visual line breaks",
  // Interactivity
  commandfor: 'Invoker buttons: open dialogs and popovers or send custom commands, no script',
  contenteditable: 'Edit an element in place as rich or plain text; add role, name and sanitising',
  draggable: "Native drag and drop, VB's drag state hooks, and the alternatives drags need",
  hidden: 'Remove content from rendering, or collapse it with hidden="until-found"',
  inert: 'Make a visible subtree unfocusable, unclickable and hidden from screen readers',
  interestfor: 'Open a popover on hover or focus; hint tooltips, polyfilled by VB',
  open: 'Expanded state of details and shown state of dialog, with closedby and VB animation',
  popover: 'Top-layer popovers: auto, manual and hint, opened by buttons, commands or interest',
  // Links & Security
  crossorigin: 'CORS mode for scripts, styles, images and media; required for SRI and font preloads',
  download: "Save a link's target as a file instead of navigating, with a suggested name",
  integrity: "Subresource Integrity: block scripts and styles whose hash doesn't match",
  nonce: "Per-response CSP token on every trusted script; pair with 'strict-dynamic'",
  ping: 'POST a notification to listed URLs when a link is followed (off in Firefox)',
  referrerpolicy: 'How much of the page URL a request or link sends as the Referer',
  rel: 'Link types: resources and hints, opener/referrer control, meaning VB styles',
  target: 'Where a link or form opens: same tab, new tab, parent, top or a named frame',
  // Embeds
  allow: 'Iframe Permissions Policy: camera, microphone, fullscreen, payment and more',
  sandbox: 'Restrict an iframe, then grant back scripts, forms, popups and more by token',
  srcdoc: 'Inline HTML document for an iframe; same-origin unless sandboxed',
  // Media
  controls: 'Native audio/video controls; when to use video-player or audio-player instead',
  poster: 'Image shown before video playback; pairs with preload=none and VB players',
  preload: 'How much media loads before play: none, metadata or auto',
  srcset: 'Responsive image candidates with sizes, sizes=auto, picture and data-responsive',
  // Performance
  'async-defer': 'When scripts download and run: async, defer, and deferred-by-default modules',
  blocking: 'Hold first paint for module, async or script-inserted resources; rel=expect',
  loading: 'Lazy loading, fetchpriority and decoding for images, iframes and scripts',
  // Structure
  cite: 'Source URL on blockquote, q, del and ins; pair with visible attribution',
  datetime: 'Machine-readable dates, times and durations on time, del and ins',
  reversed: 'Ordered-list numbering: reversed, start, li value and type',
};

/**
 * Attributes without their own page, documented on another attribute's page.
 * Listed in the index (search finds them) but not in the sidebar.
 */
export const ALIASES = [
  { name: 'popovertarget', group: 'Interactivity', href: '/docs/attributes/popover/', description: 'Button that toggles, shows or hides a popover; see popover' },
  { name: 'command', group: 'Interactivity', href: '/docs/attributes/commandfor/', description: 'The action an invoker button sends: show-modal, close, toggle-popover or --custom' },
  { name: 'closedby', group: 'Interactivity', href: '/docs/attributes/open/', description: 'Which user actions close a dialog: any (light dismiss), closerequest or none' },
  { name: 'formnovalidate', group: 'Forms', href: '/docs/attributes/novalidate/', description: 'Submit button that skips validation, e.g. Save draft' },
  { name: 'formmethod / formtarget / formenctype', group: 'Forms', href: '/docs/attributes/formaction/', description: 'Per-button method, target and encoding overrides; see formaction' },
  { name: 'sizes', group: 'Media', href: '/docs/attributes/srcset/', description: 'Slot widths for srcset w descriptors, including sizes=auto' },
  { name: 'controlslist', group: 'Media', href: '/docs/attributes/controls/', description: 'Chromium-only list of native media buttons to hide' },
  { name: 'fetchpriority', group: 'Performance', href: '/docs/attributes/loading/#fetchpriority', description: 'Fetch priority hint for img, link and script' },
  { name: 'decoding', group: 'Performance', href: '/docs/attributes/loading/#decoding', description: 'Image decoding hint: async, sync or auto' },
  { name: 'start', group: 'Structure', href: '/docs/attributes/reversed/', description: 'First number of an ordered list' },
  { name: 'value (li)', group: 'Structure', href: '/docs/attributes/reversed/', description: 'Number of one ordered-list item; later items continue from it' },
];

/**
 * Read top-level `key: value` scalars from a page's YAML frontmatter.
 * @param {string} src
 * @returns {Record<string, string>}
 */
export function readFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    out[kv[1]] = value;
  }
  return out;
}

/**
 * @typedef {object} NativePage
 * @property {string} slug      file name without .html
 * @property {string} name      attributeName (h1 / breadcrumb)
 * @property {string} href      /docs/attributes/<slug>/
 * @property {string} group     nativeGroup label ('' when missing)
 * @property {string} file      repo-relative path
 */

/**
 * Every native attribute page (frontmatter attributeType: native).
 * @param {string} [root] repo root
 * @returns {NativePage[]}
 */
export function readNativePages(root = DEFAULT_ROOT) {
  const dir = join(root, PAGES_DIR);
  const pages = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith('.html') || file === 'index.html') continue;
    const fm = readFrontmatter(readFileSync(join(dir, file), 'utf8'));
    if (fm.attributeType !== 'native') continue;
    const slug = file.slice(0, -'.html'.length);
    pages.push({
      slug,
      name: fm.attributeName || slug,
      href: `/docs/attributes/${slug}/`,
      group: fm.nativeGroup || '',
      file: `${PAGES_DIR}/${file}`,
    });
  }
  return pages;
}

/**
 * Index categories for the native attributes, keyed like the data-* ones.
 * Rows (pages and aliases) are alphabetical within a group.
 * Pages with an unknown/missing group or no index copy are left out here and
 * reported by the drift test.
 * @param {NativePage[]} [pages]
 */
export function buildNativeCategories(pages = readNativePages()) {
  const byName = (a, b) => a.name.localeCompare(b.name, 'en');
  /** @type {Record<string, {label: string, items: object[]}>} */
  const categories = {};
  for (const [key, label] of NATIVE_GROUPS) {
    const items = pages
      .filter((p) => p.group === label && INDEX_COPY[p.slug])
      .map((p) => ({ name: p.name, type: 'native', href: p.href, description: INDEX_COPY[p.slug] }));
    const aliases = ALIASES
      .filter((a) => a.group === label)
      .map(({ name, href, description }) => ({ name, type: 'native', href, description, alias: true }));
    categories[key] = { label, items: [...items, ...aliases].sort(byName) };
  }
  return categories;
}
