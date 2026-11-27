/**
 * LLM-facing documentation builders (scripts/lib/llms.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, firstHtmlExample, componentMarkdown, linkList, pageReference, indexText } from '../../scripts/lib/llms.js';

test('parseFrontmatter reads quoted and bare values and ignores the body', () => {
  const meta = parseFrontmatter('---\nlayout: element\ntitle: "tab-set"\ndescription: "Tabs: with \\"quotes\\"."\ncurrentPath: /docs/x/\n\ncrumbLabel: \'It\'\'s\'\n---\n<h1>title: no</h1>');
  assert.deepEqual(meta, { layout: 'element', title: 'tab-set', description: 'Tabs: with "quotes".', currentPath: '/docs/x/', crumbLabel: "It's" });
  assert.deepEqual(parseFrontmatter('<h1>No frontmatter</h1>'), {});
});

test('firstHtmlExample takes the first escaped HTML code block', () => {
  const page = `<code-block language="bash" data-escape>npm i</code-block>
    <code-block language="html" show-lines label="Basic" data-escape><tab-set>
  <details><summary>A</summary></details>
</tab-set></code-block>
    <code-block language="html" data-escape><p>second</p></code-block>`;
  assert.equal(firstHtmlExample(page), '<tab-set>\n  <details><summary>A</summary></details>\n</tab-set>');
});

test('firstHtmlExample skips pages with no usable example', () => {
  assert.equal(firstHtmlExample('<p>none</p>'), undefined);
  assert.equal(firstHtmlExample('<code-block language="html" data-escape>{{ value }}</code-block>'), undefined);
  assert.equal(firstHtmlExample('<code-block language="css">a { }</code-block>'), undefined);
});

test('firstHtmlExample reads raw and entity-escaped blocks and can look for one element', () => {
  assert.equal(firstHtmlExample('<code-block language="html" label="x">\n<nav-bar>\n  <a href="/">Home</a>\n</nav-bar>\n</code-block>'), '<nav-bar>\n  <a href="/">Home</a>\n</nav-bar>');
  assert.equal(firstHtmlExample('<code-block language="html">&lt;p title=&quot;a &amp;amp; b&quot;&gt;x&lt;/p&gt;</code-block>'), '<p title="a &amp; b">x</p>');
  const page = `<code-block language="html"><foot-notes></foot-notes></code-block>
    <code-block language="html"><p>Text<foot-note>Note</foot-note></p></code-block>`;
  assert.equal(firstHtmlExample(page, 'foot-note'), '<p>Text<foot-note>Note</foot-note></p>');
  assert.equal(firstHtmlExample(page, 'foot'), undefined);
});

const ENTRY = {
  element: 'tab-set',
  type: 'web-component',
  description: 'Tab container\nbuilt on details.',
  attributes: [
    { name: 'data-orientation', type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', description: 'Row | column' },
    { name: 'data-bare', type: 'enum', values: ['', 'on'], description: 'Presence' },
    { name: 'aria-label', type: 'string', description: 'Names the set' },
  ],
  childAttributes: [{ name: 'data-x', on: 'details', type: 'boolean', description: 'On a child' }],
  structure: [{ element: '<details>', description: 'One per tab' }],
  events: [{ name: 'tab-set:change', detail: '{ index }', description: 'Fired once' }],
  a11y: { pattern: 'Tabs', provide: 'details', manages: ['aria-controls'], keyboard: [{ keys: ['ArrowRight', 'ArrowDown'], action: 'Next', when: 'On a tab' }] },
};

test('componentMarkdown renders every section the entry has, and none it lacks', () => {
  const md = componentMarkdown(ENTRY, {
    page: { path: '/docs/tabs/', title: 'tab-set', description: 'Page text', example: '<tab-set></tab-set>' },
    siteUrl: 'https://example.test',
    version: '1.2.3',
  });
  assert.match(md, /^# <tab-set>\n\nTab container built on details\.\n/);
  assert.match(md, /Needs the Vanilla Breeze script/);
  assert.match(md, /- Documentation: https:\/\/example\.test\/docs\/tabs\/\n- Vanilla Breeze 1\.2\.3/);
  assert.match(md, /## Example\n\n```html\n<tab-set><\/tab-set>\n```/);
  assert.match(md, /\| `data-orientation` \| `horizontal`, `vertical` \| `horizontal` \| Row \\\| column \|/);
  assert.match(md, /\| `data-bare` \| \(no value\), `on` \|  \| Presence \|/);
  assert.match(md, /\| `aria-label` \| string \|  \| Names the set \|/);
  assert.match(md, /## Attributes on children\n\n\| Attribute \| On \|/);
  assert.match(md, /\| `data-x` \| details \| boolean \|/);
  assert.match(md, /## Events\n\n.*\n.*\n\| `tab-set:change` \| `\{ index \}` \| Fired once \|/);
  assert.match(md, /- The component manages: `aria-controls`/);
  assert.match(md, /\| `ArrowRight` \/ `ArrowDown` \| Next \| On a tab \|/);
  assert.doesNotMatch(md, /## (Methods|Properties|Slots|Parts|Custom states|CSS custom properties)/);
  assert.ok(md.endsWith('|\n'));
});

test('componentMarkdown falls back to the page description and works without a page', () => {
  const md = componentMarkdown({ element: 'dl-item', type: 'custom-element', attributes: [] }, {
    page: { path: '/docs/dl-item/', title: 'dl-item', description: 'From the page.' },
    siteUrl: 'https://example.test',
    version: '1.0.0',
  });
  assert.match(md, /# <dl-item>\n\nFrom the page\.\n/);
  assert.match(md, /CSS-only custom element/);
  assert.doesNotMatch(md, /## (Example|Attributes)/);

  const bare = componentMarkdown({ element: 'x-y', type: 'web-component', attributes: [] }, { siteUrl: 'https://example.test', version: '1.0.0' });
  assert.doesNotMatch(bare, /Documentation:/);
});

test('linkList and pageReference build grouped link lists', () => {
  assert.equal(linkList([{ name: 'a', href: 'a.md', description: 'One\n two' }, { name: 'b', href: 'b.md' }]), '- [a](a.md): One two\n- [b](b.md)');
  const md = pageReference({
    title: 'Attributes',
    intro: 'Intro.',
    siteUrl: 'https://example.test',
    label: (page) => page.attributeName ?? page.title,
    groups: [
      { heading: 'Responsive', pages: [{ path: '/docs/attributes/data-visible/', title: 't', description: 'Show or hide.', attributeName: 'data-visible' }] },
      { heading: 'Empty', pages: [] },
    ],
  });
  assert.equal(md, '# Attributes\n\nIntro.\n\n## Responsive\n\n- [data-visible](https://example.test/docs/attributes/data-visible/): Show or hide.\n');
});

test('indexText fills placeholders, quotes the lead and prefixes only relative links', () => {
  const text = indexText({
    preamble: 'Lead\nsentence.\n\n## Load it\n\nVersion {{version}}. Layouts: {{layouts}}.\n',
    version: '1.2.3',
    layouts: ['stack', 'grid'],
    base: 'https://example.test/cdn/llms/',
    sections: [
      { heading: 'Components', items: [{ name: '<tab-set>', href: 'components/tab-set.md', description: 'Tabs.' }] },
      { heading: 'Guides', items: [{ name: 'Quick start', href: 'https://example.test/docs/quick-start/' }] },
      { heading: 'Nothing', items: [] },
    ],
  });
  assert.equal(text, [
    '# Vanilla Breeze 1.2.3',
    '',
    '> Lead sentence.',
    '',
    '## Load it',
    '',
    'Version 1.2.3. Layouts: `stack`, `grid`.',
    '',
    '## Components',
    '',
    '- [<tab-set>](https://example.test/cdn/llms/components/tab-set.md): Tabs.',
    '',
    '## Guides',
    '',
    '- [Quick start](https://example.test/docs/quick-start/)',
    '',
  ].join('\n'));
});
