#!/usr/bin/env node
/**
 * Add missing HTML elements to documentation
 *
 * Creates stub pages for missing elements with proper navigation
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS = join(ROOT, 'docs');
const NATIVE_ELEMENTS = join(DOCS, 'elements', 'native');

// All standard HTML elements organized by category
const HTML_ELEMENTS = {
  'Document': ['html', 'head', 'title', 'base', 'link', 'meta', 'style', 'body'],
  'Sectioning': ['article', 'aside', 'footer', 'header', 'hgroup', 'main', 'nav', 'section', 'address'],
  'Headings': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  'Text': ['p', 'a', 'abbr', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd', 'mark', 'pre', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'],
  'Lists': ['ul', 'ol', 'li', 'dl', 'dt', 'dd', 'menu'],
  'Tables': ['table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'col', 'colgroup'],
  'Forms': ['form', 'input', 'button', 'select', 'option', 'optgroup', 'textarea', 'label', 'fieldset', 'legend', 'datalist', 'output', 'progress', 'meter'],
  'Interactive': ['details', 'summary', 'dialog'],
  'Media': ['img', 'picture', 'source', 'audio', 'video', 'track', 'figure', 'figcaption', 'map', 'area'],
  'Embedded': ['iframe', 'embed', 'object', 'canvas', 'svg', 'math'],
  'Scripting': ['script', 'noscript', 'template', 'slot'],
  'Editing': ['del', 'ins'],
  'Other': ['div', 'hr', 'search']
};

// Category pages (not individual elements)
const CATEGORY_PAGES = ['forms', 'text', 'states', 'interactive', 'sectioning', 'media', 'headings', 'tables', 'lists', 'index'];

// Element metadata
const ELEMENT_INFO = {
  // Document
  'html': { title: 'HTML Root', desc: 'The root element of an HTML document, containing all other elements.' },
  'head': { title: 'Document Head', desc: 'Container for document metadata, scripts, and stylesheets.' },
  'title': { title: 'Document Title', desc: 'Defines the document title shown in browser tabs and bookmarks.' },
  'base': { title: 'Base URL', desc: 'Specifies the base URL for all relative URLs in the document.' },
  'link': { title: 'External Resource Link', desc: 'Links external resources like stylesheets, icons, and preload hints.' },
  'meta': { title: 'Metadata', desc: 'Provides metadata about the document for browsers and search engines.' },
  'style': { title: 'Embedded Styles', desc: 'Contains CSS styles for the document.' },
  'body': { title: 'Document Body', desc: 'Contains the visible content of the document.' },

  // Headings
  'h1': { title: 'Heading Level 1', desc: 'Top-level heading representing the main topic of the page.' },
  'h2': { title: 'Heading Level 2', desc: 'Second-level heading for major sections.' },
  'h3': { title: 'Heading Level 3', desc: 'Third-level heading for subsections.' },
  'h4': { title: 'Heading Level 4', desc: 'Fourth-level heading for sub-subsections.' },
  'h5': { title: 'Heading Level 5', desc: 'Fifth-level heading for fine-grained sections.' },
  'h6': { title: 'Heading Level 6', desc: 'Sixth-level heading, the lowest level.' },

  // Text
  'b': { title: 'Bring Attention', desc: 'Draws attention to text without conveying extra importance.' },
  'bdi': { title: 'Bidirectional Isolate', desc: 'Isolates bidirectional text that might be formatted differently.' },
  'bdo': { title: 'Bidirectional Override', desc: 'Overrides the current text direction explicitly.' },
  'br': { title: 'Line Break', desc: 'Produces a line break in text content.' },
  'em': { title: 'Emphasis', desc: 'Marks text with stress emphasis, typically rendered as italic.' },
  'i': { title: 'Idiomatic Text', desc: 'Represents text in an alternate voice, mood, or language.' },
  'pre': { title: 'Preformatted Text', desc: 'Preformatted text preserving whitespace and line breaks.' },
  'rp': { title: 'Ruby Parentheses', desc: 'Provides fallback parentheses for ruby annotations in unsupported browsers.' },
  'rt': { title: 'Ruby Text', desc: 'Specifies the ruby text component of a ruby annotation.' },
  'samp': { title: 'Sample Output', desc: 'Represents sample or quoted output from a computer program.' },
  'small': { title: 'Small Text', desc: 'Represents side comments, disclaimers, and small print.' },
  'span': { title: 'Inline Container', desc: 'Generic inline container for phrasing content.' },
  'strong': { title: 'Strong Importance', desc: 'Indicates strong importance, seriousness, or urgency.' },
  'var': { title: 'Variable', desc: 'Represents a variable in mathematics or programming.' },
  'wbr': { title: 'Word Break Opportunity', desc: 'Suggests where a line break may occur if needed.' },

  // Media
  'map': { title: 'Image Map', desc: 'Defines an image map with clickable regions.' },
  'area': { title: 'Image Map Area', desc: 'Defines a clickable area within an image map.' },

  // Embedded
  'embed': { title: 'Embed Object', desc: 'Embeds external content from plugins or applications.' },
  'object': { title: 'External Object', desc: 'Embeds external resources like images, videos, or plugins.' },
  'math': { title: 'MathML Container', desc: 'Container for MathML mathematical notation.' },

  // Scripting
  'script': { title: 'Script', desc: 'Contains or references executable JavaScript code.' },
  'noscript': { title: 'No Script', desc: 'Defines content to show when JavaScript is disabled.' },
  'template': { title: 'Content Template', desc: 'Holds HTML that is not rendered but can be cloned via JavaScript.' },
  'slot': { title: 'Shadow DOM Slot', desc: 'Placeholder inside a web component for projected content.' },

  // Other
  'div': { title: 'Content Division', desc: 'Generic block-level container with no semantic meaning.' }
};

// Get existing element pages
function getExistingElements() {
  return readdirSync(NATIVE_ELEMENTS)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''))
    .filter(f => !CATEGORY_PAGES.includes(f));
}

// Get category for element
function getCategory(element) {
  for (const [category, elements] of Object.entries(HTML_ELEMENTS)) {
    if (elements.includes(element)) {
      return category;
    }
  }
  return 'Other';
}

// Generate navigation HTML
function generateNavigation(currentElement) {
  let nav = '';

  // Native Elements
  nav += '          <details open>\n';
  nav += '            <summary>Native Elements</summary>\n';

  for (const [category, elements] of Object.entries(HTML_ELEMENTS)) {
    if (category === 'Document') continue; // Skip document-level elements in nav

    nav += '            <details>\n';
    nav += `              <summary>${category}</summary>\n`;
    nav += '              <ul>\n';

    for (const el of elements) {
      const isCurrent = el === currentElement;
      const ariaCurrent = isCurrent ? ' aria-current="page"' : '';
      nav += `                <li><a href="/docs/elements/native/${el}.html"${ariaCurrent}>${el}</a></li>\n`;
    }

    nav += '              </ul>\n';
    nav += '            </details>\n';
  }

  nav += '          </details>\n';

  return nav;
}

// Create stub page HTML
function createStubPage(element) {
  const info = ELEMENT_INFO[element] || { title: element, desc: `The ${element} HTML element.` };
  const category = getCategory(element);

  return `<!DOCTYPE html>
<html lang="en" data-page="docs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${info.title} (${element}) - Elements - Vanilla Breeze</title>
  <link rel="stylesheet" href="/src/main.css" />
  <link rel="stylesheet" href="/docs/docs.css" />
</head>
<body>
    <header>
      <a href="/docs/" class="logo">Vanilla Breeze</a>
      <nav class="horizontal pills" aria-label="Main navigation">
        <ul>
          <li><a href="/docs/">Home</a></li>
          <li><a href="/docs/tokens/">Tokens</a></li>
          <li><a href="/docs/elements/" aria-current="page">Elements</a></li>
          <li><a href="/docs/examples/">Examples</a></li>
          <li><a href="/docs/integrations/">Integrations</a></li>
        </ul>
      </nav>
      <div class="header-actions">
        <search-wc>
          <button data-trigger class="ghost">
            <x-icon name="search" size="sm"></x-icon>
            Search
          </button>
        </search-wc>
        <theme-wc>
          <button data-trigger class="ghost">
            <icon-wc name="palette" size="sm"></icon-wc>
            Theme
          </button>
        </theme-wc>
      </div>
      <button class="mobile-menu-toggle" popovertarget="mobile-menu" aria-label="Menu">
        <icon-wc name="menu"></icon-wc>
      </button>
      <nav popover id="mobile-menu" class="mobile-menu">
        <button class="mobile-menu-close" popovertarget="mobile-menu" popovertargetaction="hide" aria-label="Close menu">
          <icon-wc name="x"></icon-wc>
        </button>
        <div class="mobile-menu-search">
          <search-wc>
            <button data-trigger class="ghost" style="width: 100%">
              <x-icon name="search" size="sm"></x-icon>
              Search
            </button>
          </search-wc>
        </div>
        <ul>
          <li><a href="/docs/">Home</a></li>
          <li><a href="/docs/tokens/">Tokens</a></li>
          <li><a href="/docs/elements/">Elements</a></li>
          <li><a href="/docs/examples/">Examples</a></li>
          <li><a href="/docs/integrations/">Integrations</a></li>
        </ul>
        <div class="mobile-menu-theme">
          <theme-wc>
            <button data-trigger class="ghost">
              <icon-wc name="palette" size="sm"></icon-wc>
              Theme
            </button>
          </theme-wc>
        </div>
      </nav>
    </header>

    <main data-pagefind-body>
      <article>
        <h1>${element}</h1>
        <p class="lead">${info.desc}</p>

        <section>
          <h2>Overview</h2>
          <p>The <code>&lt;${element}&gt;</code> element is part of the ${category} category in HTML.</p>

          <div class="example">
            <${element}>${element === 'br' || element === 'hr' || element === 'wbr' || element === 'area' || element === 'base' || element === 'link' || element === 'meta' || element === 'embed' || element === 'img' || element === 'input' || element === 'source' || element === 'track' ? '' : `Example ${element} content`}</${element}>
          </div>

          <code-block language="html" show-lines label="Basic ${element} example">&lt;${element}&gt;${element === 'br' || element === 'wbr' ? '' : `...`}&lt;/${element}&gt;</code-block>
        </section>

        <section>
          <h2>Attributes</h2>
          <p>This element supports <a href="/docs/elements/native/states.html">global attributes</a>.</p>
        </section>

        <section>
          <h2>Accessibility</h2>
          <p>Accessibility considerations for the <code>&lt;${element}&gt;</code> element will be documented here.</p>
        </section>
      </article>
    </main>

    <footer>
      <p>Vanilla Breeze Documentation</p>
    </footer>

  <script type="module" src="/src/main.js"></script>
</body>
</html>`;
}

// Main execution
console.log('=== Adding Missing HTML Elements ===\n');

const allElements = Object.values(HTML_ELEMENTS).flat();
const existing = getExistingElements();
const missing = allElements.filter(el => !existing.includes(el));

console.log(`Total HTML elements: ${allElements.length}`);
console.log(`Existing pages: ${existing.length}`);
console.log(`Missing: ${missing.length}\n`);

if (missing.length === 0) {
  console.log('All elements already have pages!');
  process.exit(0);
}

console.log('Missing elements:');
console.log(missing.join(', '));
console.log('\nCreating stub pages...\n');

for (const element of missing) {
  const pagePath = join(NATIVE_ELEMENTS, `${element}.html`);
  const content = createStubPage(element);
  writeFileSync(pagePath, content);
  console.log(`  Created: ${element}.html`);
}

console.log(`\n✓ Created ${missing.length} stub pages`);
console.log('\nNext: Run update-element-nav.js to add new elements to all page navigations.');
