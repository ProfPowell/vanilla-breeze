#!/usr/bin/env node
/**
 * Fix stub pages to have proper sidebar layout structure
 *
 * Updates the 39 new stub pages to match the existing page structure
 * with tree navigation, page-toc, and proper layout wrappers.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const NATIVE_ELEMENTS = join(ROOT, 'docs', 'elements', 'native');

// Get the navigation from an existing page
function getNavFromExistingPage() {
  const existingPage = readFileSync(join(NATIVE_ELEMENTS, 'abbr.html'), 'utf-8');

  // Extract the nav element
  const navStart = existingPage.indexOf('<nav class="tree"');
  const navEnd = existingPage.indexOf('</nav>', navStart) + 6;

  return existingPage.substring(navStart, navEnd);
}

// Stub pages that need fixing (created by add-missing-elements.js)
const STUB_PAGES = [
  'html', 'head', 'title', 'base', 'link', 'meta', 'style', 'body',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'b', 'bdi', 'bdo', 'br', 'em', 'i', 'pre', 'rp', 'rt', 'samp', 'small', 'span', 'strong', 'var', 'wbr',
  'map', 'area',
  'embed', 'object', 'math',
  'script', 'noscript', 'template', 'slot',
  'div'
];

// Element metadata for updating titles and descriptions
const ELEMENT_INFO = {
  // Document
  'html': { title: 'HTML Root', desc: 'The root element of an HTML document, containing all other elements.', category: 'Document' },
  'head': { title: 'Document Head', desc: 'Container for document metadata, scripts, and stylesheets.', category: 'Document' },
  'title': { title: 'Document Title', desc: 'Defines the document title shown in browser tabs and bookmarks.', category: 'Document' },
  'base': { title: 'Base URL', desc: 'Specifies the base URL for all relative URLs in the document.', category: 'Document' },
  'link': { title: 'External Resource Link', desc: 'Links external resources like stylesheets, icons, and preload hints.', category: 'Document' },
  'meta': { title: 'Metadata', desc: 'Provides metadata about the document for browsers and search engines.', category: 'Document' },
  'style': { title: 'Embedded Styles', desc: 'Contains CSS styles for the document.', category: 'Document' },
  'body': { title: 'Document Body', desc: 'Contains the visible content of the document.', category: 'Document' },
  // Headings
  'h1': { title: 'Heading Level 1', desc: 'Top-level heading representing the main topic of the page.', category: 'Headings' },
  'h2': { title: 'Heading Level 2', desc: 'Second-level heading for major sections.', category: 'Headings' },
  'h3': { title: 'Heading Level 3', desc: 'Third-level heading for subsections.', category: 'Headings' },
  'h4': { title: 'Heading Level 4', desc: 'Fourth-level heading for sub-subsections.', category: 'Headings' },
  'h5': { title: 'Heading Level 5', desc: 'Fifth-level heading for fine-grained sections.', category: 'Headings' },
  'h6': { title: 'Heading Level 6', desc: 'Sixth-level heading, the lowest level.', category: 'Headings' },
  // Text
  'b': { title: 'Bring Attention', desc: 'Draws attention to text without conveying extra importance.', category: 'Text Semantics' },
  'bdi': { title: 'Bidirectional Isolate', desc: 'Isolates bidirectional text that might be formatted differently.', category: 'Text Semantics' },
  'bdo': { title: 'Bidirectional Override', desc: 'Overrides the current text direction explicitly.', category: 'Text Semantics' },
  'br': { title: 'Line Break', desc: 'Produces a line break in text content.', category: 'Text Semantics' },
  'em': { title: 'Emphasis', desc: 'Marks text with stress emphasis, typically rendered as italic.', category: 'Text Semantics' },
  'i': { title: 'Idiomatic Text', desc: 'Represents text in an alternate voice, mood, or language.', category: 'Text Semantics' },
  'pre': { title: 'Preformatted Text', desc: 'Preformatted text preserving whitespace and line breaks.', category: 'Text Content' },
  'rp': { title: 'Ruby Parentheses', desc: 'Provides fallback parentheses for ruby annotations in unsupported browsers.', category: 'Text Semantics' },
  'rt': { title: 'Ruby Text', desc: 'Specifies the ruby text component of a ruby annotation.', category: 'Text Semantics' },
  'samp': { title: 'Sample Output', desc: 'Represents sample or quoted output from a computer program.', category: 'Text Semantics' },
  'small': { title: 'Small Text', desc: 'Represents side comments, disclaimers, and small print.', category: 'Text Semantics' },
  'span': { title: 'Inline Container', desc: 'Generic inline container for phrasing content.', category: 'Text Semantics' },
  'strong': { title: 'Strong Importance', desc: 'Indicates strong importance, seriousness, or urgency.', category: 'Text Semantics' },
  'var': { title: 'Variable', desc: 'Represents a variable in mathematics or programming.', category: 'Text Semantics' },
  'wbr': { title: 'Word Break Opportunity', desc: 'Suggests where a line break may occur if needed.', category: 'Text Semantics' },
  // Media
  'map': { title: 'Image Map', desc: 'Defines an image map with clickable regions.', category: 'Media' },
  'area': { title: 'Image Map Area', desc: 'Defines a clickable area within an image map.', category: 'Media' },
  // Embedded
  'embed': { title: 'Embed Object', desc: 'Embeds external content from plugins or applications.', category: 'Embedded' },
  'object': { title: 'External Object', desc: 'Embeds external resources like images, videos, or plugins.', category: 'Embedded' },
  'math': { title: 'MathML Container', desc: 'Container for MathML mathematical notation.', category: 'Embedded' },
  // Scripting
  'script': { title: 'Script', desc: 'Contains or references executable JavaScript code.', category: 'Scripting' },
  'noscript': { title: 'No Script', desc: 'Defines content to show when JavaScript is disabled.', category: 'Scripting' },
  'template': { title: 'Content Template', desc: 'Holds HTML that is not rendered but can be cloned via JavaScript.', category: 'Scripting' },
  'slot': { title: 'Shadow DOM Slot', desc: 'Placeholder inside a web component for projected content.', category: 'Scripting' },
  // Other
  'div': { title: 'Content Division', desc: 'Generic block-level container with no semantic meaning.', category: 'Text Content' }
};

// Void elements (self-closing, no content)
const VOID_ELEMENTS = ['area', 'base', 'br', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];

// Generate the example content for an element
function generateExample(element) {
  if (VOID_ELEMENTS.includes(element)) {
    return `<${element}>`;
  }
  return `<${element}>Example ${element} content</${element}>`;
}

// Generate code block example
function generateCodeExample(element) {
  if (VOID_ELEMENTS.includes(element)) {
    return `&lt;${element}&gt;`;
  }
  return `&lt;${element}&gt;...&lt;/${element}&gt;`;
}

// Create the fixed page content
function createFixedPage(element, navHtml) {
  const info = ELEMENT_INFO[element] || { title: element, desc: `The ${element} HTML element.`, category: 'Other' };

  return `<!DOCTYPE html>
<html lang="en" data-page="docs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${info.title} (&lt;${element}&gt;) - ${info.category} - Vanilla Breeze</title>
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
          <li><a href="/docs/elements/">Elements</a></li>
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
      <input type="checkbox" id="nav-drawer-toggle" class="nav-drawer-checkbox"/>
      <label for="nav-drawer-toggle" class="nav-drawer-toggle">
        <icon-wc name="list-tree" size="sm"></icon-wc>
        Navigation
      </label>
      <label for="nav-drawer-toggle" class="nav-drawer-backdrop"></label>

      <layout-sidebar data-gap="xl" data-sidebar-width="narrow" data-content-min="60">
        ${navHtml}

        <layout-sidebar data-side="end" data-sidebar-width="narrow" data-gap="xl">
        <aside>
          <page-toc data-levels="h2,h3" data-scope="article"></page-toc>
        </aside>
        <article>
          <h1><code>&lt;${element}&gt;</code></h1>
          <p class="lead">${info.desc}</p>

          <heading-links data-levels="h2,h3">
      <!-- Description Section -->
      <section>
        <h2>Description</h2>
        <p>The <code>&lt;${element}&gt;</code> element is part of the ${info.category} category in HTML.</p>
      </section>

      <!-- Basic Example Section -->
      <section>
        <h2>Basic Example</h2>
        <div class="example">
          ${generateExample(element)}
        </div>
        <code-block language="html" label="Basic ${element} example">${generateCodeExample(element)}</code-block>
      </section>

      <!-- Attributes Section -->
      <section>
        <h2>Attributes</h2>
        <p>This element supports <a href="/docs/elements/native/states.html">global attributes</a>.</p>
      </section>

      <!-- Accessibility Section -->
      <section>
        <h2>Accessibility</h2>
        <p>Accessibility considerations for the <code>&lt;${element}&gt;</code> element will be documented here.</p>
      </section>

      <!-- Related Elements Section -->
      <section>
        <h2>Related Elements</h2>
        <p>Related elements will be documented here.</p>
      </section>
          </heading-links>
        </article>
        </layout-sidebar>
      </layout-sidebar>
    </main>

    <footer>
      <p>Vanilla Breeze - A layered HTML component system</p>
    </footer>

  <script type="module" src="/src/main.js"></script>
  <script type="module">
    import '@profpowell/code-block';
    import '@profpowell/browser-window';
  </script>
</body>
</html>`;
}

// Main execution
console.log('=== Fixing Stub Pages ===\n');

// Get navigation from existing page
const navHtml = getNavFromExistingPage();

let fixed = 0;
for (const element of STUB_PAGES) {
  const pagePath = join(NATIVE_ELEMENTS, `${element}.html`);

  if (!existsSync(pagePath)) {
    console.log(`  Skipped: ${element}.html (not found)`);
    continue;
  }

  // Check if page needs fixing (missing tree nav)
  const content = readFileSync(pagePath, 'utf-8');
  if (content.includes('<nav class="tree"')) {
    console.log(`  Skipped: ${element}.html (already has nav)`);
    continue;
  }

  // Create fixed page with proper nav
  // We need to update nav to mark current page
  let pageNav = navHtml.replace(
    new RegExp(`<a href="/docs/elements/native/${element}\\.html">`),
    `<a href="/docs/elements/native/${element}.html" aria-current="page">`
  );

  // Also need to open the correct category details
  const info = ELEMENT_INFO[element];
  if (info) {
    // Find the category and mark its details as open
    pageNav = pageNav.replace(
      new RegExp(`(<details>\\s*<summary>${info.category}</summary>)`),
      '<details open>\n              <summary>' + info.category + '</summary>'
    );
  }

  const fixedContent = createFixedPage(element, pageNav);
  writeFileSync(pagePath, fixedContent);
  console.log(`  Fixed: ${element}.html`);
  fixed++;
}

console.log(`\n✓ Fixed ${fixed} stub pages`);
