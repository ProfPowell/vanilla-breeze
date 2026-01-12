#!/usr/bin/env node
/**
 * Transform element documentation pages to the new layout structure
 * with tree navigation, page-toc, and heading-links.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS_ELEMENTS = join(ROOT, 'docs', 'elements');

// Skip these files (already updated or index files)
const SKIP_FILES = ['nav.html'];

// Tree navigation structure (from nav.html)
const TREE_NAV = `        <nav class="tree" id="nav-drawer" data-density="compact" aria-label="Elements navigation">
          <label for="nav-drawer-toggle" class="nav-drawer-close" aria-label="Close navigation">
            <icon-wc name="x"></icon-wc>
          </label>
          <details open>
            <summary>Native Elements</summary>
            <details>
              <summary>Sectioning</summary>
              <ul>
                <li><a href="/docs/elements/native/article.html">article</a></li>
                <li><a href="/docs/elements/native/aside.html">aside</a></li>
                <li><a href="/docs/elements/native/footer.html">footer</a></li>
                <li><a href="/docs/elements/native/header.html">header</a></li>
                <li><a href="/docs/elements/native/hgroup.html">hgroup</a></li>
                <li><a href="/docs/elements/native/main.html">main</a></li>
                <li><a href="/docs/elements/native/nav.html">nav</a></li>
                <li><a href="/docs/elements/native/section.html">section</a></li>
                <li><a href="/docs/elements/native/address.html">address</a></li>
              </ul>
            </details>
            <details>
              <summary>Headings</summary>
              <ul>
                <li><a href="/docs/elements/native/headings.html">headings</a></li>
                <li><a href="/docs/elements/native/h1.html">h1</a></li>
                <li><a href="/docs/elements/native/h2.html">h2</a></li>
                <li><a href="/docs/elements/native/h3.html">h3</a></li>
                <li><a href="/docs/elements/native/h4.html">h4</a></li>
                <li><a href="/docs/elements/native/h5.html">h5</a></li>
                <li><a href="/docs/elements/native/h6.html">h6</a></li>
              </ul>
            </details>
            <details>
              <summary>Text Content</summary>
              <ul>
                <li><a href="/docs/elements/native/p.html">p</a></li>
                <li><a href="/docs/elements/native/blockquote.html">blockquote</a></li>
                <li><a href="/docs/elements/native/pre.html">pre</a></li>
                <li><a href="/docs/elements/native/hr.html">hr</a></li>
                <li><a href="/docs/elements/native/figure.html">figure</a></li>
                <li><a href="/docs/elements/native/figcaption.html">figcaption</a></li>
              </ul>
            </details>
            <details>
              <summary>Text Semantics</summary>
              <ul>
                <li><a href="/docs/elements/native/text.html">text overview</a></li>
                <li><a href="/docs/elements/native/a.html">a</a></li>
                <li><a href="/docs/elements/native/strong.html">strong</a></li>
                <li><a href="/docs/elements/native/em.html">em</a></li>
                <li><a href="/docs/elements/native/code.html">code</a></li>
                <li><a href="/docs/elements/native/mark.html">mark</a></li>
                <li><a href="/docs/elements/native/kbd.html">kbd</a></li>
                <li><a href="/docs/elements/native/abbr.html">abbr</a></li>
                <li><a href="/docs/elements/native/time.html">time</a></li>
                <li><a href="/docs/elements/native/cite.html">cite</a></li>
                <li><a href="/docs/elements/native/q.html">q</a></li>
              </ul>
            </details>
            <details>
              <summary>Lists</summary>
              <ul>
                <li><a href="/docs/elements/native/lists.html">lists overview</a></li>
                <li><a href="/docs/elements/native/ul.html">ul</a></li>
                <li><a href="/docs/elements/native/ol.html">ol</a></li>
                <li><a href="/docs/elements/native/li.html">li</a></li>
                <li><a href="/docs/elements/native/dl.html">dl</a></li>
                <li><a href="/docs/elements/native/dt.html">dt</a></li>
                <li><a href="/docs/elements/native/dd.html">dd</a></li>
              </ul>
            </details>
            <details>
              <summary>Tables</summary>
              <ul>
                <li><a href="/docs/elements/native/tables.html">tables overview</a></li>
                <li><a href="/docs/elements/native/table.html">table</a></li>
                <li><a href="/docs/elements/native/thead.html">thead</a></li>
                <li><a href="/docs/elements/native/tbody.html">tbody</a></li>
                <li><a href="/docs/elements/native/tfoot.html">tfoot</a></li>
                <li><a href="/docs/elements/native/tr.html">tr</a></li>
                <li><a href="/docs/elements/native/th.html">th</a></li>
                <li><a href="/docs/elements/native/td.html">td</a></li>
                <li><a href="/docs/elements/native/caption.html">caption</a></li>
              </ul>
            </details>
            <details>
              <summary>Forms</summary>
              <ul>
                <li><a href="/docs/elements/native/forms.html">forms overview</a></li>
                <li><a href="/docs/elements/native/form.html">form</a></li>
                <li><a href="/docs/elements/native/input.html">input</a></li>
                <li><a href="/docs/elements/native/button.html">button</a></li>
                <li><a href="/docs/elements/native/select.html">select</a></li>
                <li><a href="/docs/elements/native/textarea.html">textarea</a></li>
                <li><a href="/docs/elements/native/label.html">label</a></li>
                <li><a href="/docs/elements/native/fieldset.html">fieldset</a></li>
                <li><a href="/docs/elements/native/legend.html">legend</a></li>
                <li><a href="/docs/elements/native/output.html">output</a></li>
                <li><a href="/docs/elements/native/datalist.html">datalist</a></li>
              </ul>
            </details>
            <details>
              <summary>Media</summary>
              <ul>
                <li><a href="/docs/elements/native/media.html">media overview</a></li>
                <li><a href="/docs/elements/native/img.html">img</a></li>
                <li><a href="/docs/elements/native/picture.html">picture</a></li>
                <li><a href="/docs/elements/native/video.html">video</a></li>
                <li><a href="/docs/elements/native/audio.html">audio</a></li>
                <li><a href="/docs/elements/native/source.html">source</a></li>
                <li><a href="/docs/elements/native/track.html">track</a></li>
              </ul>
            </details>
            <details>
              <summary>Interactive</summary>
              <ul>
                <li><a href="/docs/elements/native/interactive.html">interactive overview</a></li>
                <li><a href="/docs/elements/native/details.html">details</a></li>
                <li><a href="/docs/elements/native/summary.html">summary</a></li>
                <li><a href="/docs/elements/native/dialog.html">dialog</a></li>
                <li><a href="/docs/elements/native/menu.html">menu</a></li>
              </ul>
            </details>
            <details>
              <summary>Other</summary>
              <ul>
                <li><a href="/docs/elements/native/meter.html">meter</a></li>
                <li><a href="/docs/elements/native/progress.html">progress</a></li>
                <li><a href="/docs/elements/native/data.html">data</a></li>
                <li><a href="/docs/elements/native/del.html">del</a></li>
                <li><a href="/docs/elements/native/ins.html">ins</a></li>
                <li><a href="/docs/elements/native/canvas.html">canvas</a></li>
                <li><a href="/docs/elements/native/iframe.html">iframe</a></li>
                <li><a href="/docs/elements/native/svg.html">svg</a></li>
              </ul>
            </details>
          </details>
          <details>
            <summary>Custom Elements</summary>
            <ul>
              <li><a href="/docs/elements/custom-elements/stack.html">layout-stack</a></li>
              <li><a href="/docs/elements/custom-elements/grid.html">layout-grid</a></li>
              <li><a href="/docs/elements/custom-elements/sidebar.html">layout-sidebar</a></li>
              <li><a href="/docs/elements/custom-elements/cluster.html">layout-cluster</a></li>
              <li><a href="/docs/elements/custom-elements/center.html">layout-center</a></li>
              <li><a href="/docs/elements/custom-elements/cover.html">layout-cover</a></li>
              <li><a href="/docs/elements/custom-elements/reel.html">layout-reel</a></li>
              <li><a href="/docs/elements/custom-elements/switcher.html">layout-switcher</a></li>
              <li><a href="/docs/elements/custom-elements/imposter.html">layout-imposter</a></li>
              <li><a href="/docs/elements/custom-elements/prose.html">prose</a></li>
              <li><a href="/docs/elements/custom-elements/card.html">card</a></li>
              <li><a href="/docs/elements/custom-elements/alert.html">alert</a></li>
              <li><a href="/docs/elements/custom-elements/avatar.html">avatar</a></li>
              <li><a href="/docs/elements/custom-elements/badge.html">badge</a></li>
              <li><a href="/docs/elements/custom-elements/form-field.html">form-field</a></li>
            </ul>
          </details>
          <details>
            <summary>Web Components</summary>
            <ul>
              <li><a href="/docs/elements/web-components/accordion.html">accordion-wc</a></li>
              <li><a href="/docs/elements/web-components/tabs.html">tabs-wc</a></li>
              <li><a href="/docs/elements/web-components/dropdown.html">dropdown-wc</a></li>
              <li><a href="/docs/elements/web-components/tooltip.html">tooltip-wc</a></li>
              <li><a href="/docs/elements/web-components/toast.html">toast-wc</a></li>
              <li><a href="/docs/elements/web-components/theme-picker.html">theme-picker</a></li>
              <li><a href="/docs/elements/web-components/icons.html">icon-wc</a></li>
              <li><a href="/docs/elements/web-components/footnotes.html">footnotes-wc</a></li>
            </ul>
          </details>
        </nav>`;

const NAV_DRAWER_TOGGLE = `      <input type="checkbox" id="nav-drawer-toggle" class="nav-drawer-checkbox"/>
      <label for="nav-drawer-toggle" class="nav-drawer-toggle">
        <icon-wc name="list-tree" size="sm"></icon-wc>
        Navigation
      </label>
      <label for="nav-drawer-toggle" class="nav-drawer-backdrop"></label>`;

// Map file paths to tree nav category to set open state
const CATEGORY_MAP = {
  'native/article.html': 'Sectioning',
  'native/aside.html': 'Sectioning',
  'native/footer.html': 'Sectioning',
  'native/header.html': 'Sectioning',
  'native/hgroup.html': 'Sectioning',
  'native/main.html': 'Sectioning',
  'native/nav.html': 'Sectioning',
  'native/section.html': 'Sectioning',
  'native/address.html': 'Sectioning',
  'native/headings.html': 'Headings',
  'native/h1.html': 'Headings',
  'native/h2.html': 'Headings',
  'native/h3.html': 'Headings',
  'native/h4.html': 'Headings',
  'native/h5.html': 'Headings',
  'native/h6.html': 'Headings',
  'native/p.html': 'Text Content',
  'native/blockquote.html': 'Text Content',
  'native/pre.html': 'Text Content',
  'native/hr.html': 'Text Content',
  'native/figure.html': 'Text Content',
  'native/figcaption.html': 'Text Content',
  'native/text.html': 'Text Semantics',
  'native/a.html': 'Text Semantics',
  'native/strong.html': 'Text Semantics',
  'native/em.html': 'Text Semantics',
  'native/code.html': 'Text Semantics',
  'native/mark.html': 'Text Semantics',
  'native/kbd.html': 'Text Semantics',
  'native/abbr.html': 'Text Semantics',
  'native/time.html': 'Text Semantics',
  'native/cite.html': 'Text Semantics',
  'native/q.html': 'Text Semantics',
  'native/lists.html': 'Lists',
  'native/ul.html': 'Lists',
  'native/ol.html': 'Lists',
  'native/li.html': 'Lists',
  'native/dl.html': 'Lists',
  'native/dt.html': 'Lists',
  'native/dd.html': 'Lists',
  'native/tables.html': 'Tables',
  'native/table.html': 'Tables',
  'native/thead.html': 'Tables',
  'native/tbody.html': 'Tables',
  'native/tfoot.html': 'Tables',
  'native/tr.html': 'Tables',
  'native/th.html': 'Tables',
  'native/td.html': 'Tables',
  'native/caption.html': 'Tables',
  'native/forms.html': 'Forms',
  'native/form.html': 'Forms',
  'native/input.html': 'Forms',
  'native/button.html': 'Forms',
  'native/select.html': 'Forms',
  'native/textarea.html': 'Forms',
  'native/label.html': 'Forms',
  'native/fieldset.html': 'Forms',
  'native/legend.html': 'Forms',
  'native/output.html': 'Forms',
  'native/datalist.html': 'Forms',
  'native/media.html': 'Media',
  'native/img.html': 'Media',
  'native/picture.html': 'Media',
  'native/video.html': 'Media',
  'native/audio.html': 'Media',
  'native/source.html': 'Media',
  'native/track.html': 'Media',
  'native/interactive.html': 'Interactive',
  'native/details.html': 'Interactive',
  'native/summary.html': 'Interactive',
  'native/dialog.html': 'Interactive',
  'native/menu.html': 'Interactive',
  'native/meter.html': 'Other',
  'native/progress.html': 'Other',
  'native/data.html': 'Other',
  'native/del.html': 'Other',
  'native/ins.html': 'Other',
  'native/canvas.html': 'Other',
  'native/iframe.html': 'Other',
  'native/svg.html': 'Other',
};

function getFilesRecursively(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else if (entry.endsWith('.html') && entry !== 'index.html') {
      files.push(fullPath);
    }
  }

  return files;
}

function getRelativePath(filePath) {
  return relative(DOCS_ELEMENTS, filePath);
}

function getFileLinkPath(filePath) {
  const rel = getRelativePath(filePath);
  return `/docs/elements/${rel}`;
}

function setCurrentPageAndOpenCategory(treeNav, filePath, category) {
  let result = treeNav;
  const linkPath = getFileLinkPath(filePath);

  // Set aria-current="page" on the current file's link
  result = result.replace(
    new RegExp(`(<a href="${linkPath.replace(/\//g, '\\/')}")>`),
    '$1 aria-current="page">'
  );

  // Open the parent category details (use flexible whitespace matching)
  if (category) {
    // Open "Native Elements" for all native files (it's already open in template, but we ensure it)
    // The Native Elements is the first <details open> in the template

    // Open the specific category (sub-details inside Native Elements)
    result = result.replace(
      new RegExp(`(<details>\\s*<summary>${category}</summary>)`),
      `<details open>\n              <summary>${category}</summary>`
    );
  }

  // Open Custom Elements section for custom element files
  if (filePath.includes('/custom-elements/')) {
    result = result.replace(
      /(<details>\s*<summary>Custom Elements<\/summary>)/,
      '<details open>\n            <summary>Custom Elements</summary>'
    );
  }

  // Open Web Components section for web component files
  if (filePath.includes('/web-components/')) {
    result = result.replace(
      /(<details>\s*<summary>Web Components<\/summary>)/,
      '<details open>\n            <summary>Web Components</summary>'
    );
  }

  return result;
}

function extractMainContent(html) {
  // Find content between <main> and </main>
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (!mainMatch) {
    return null;
  }
  return mainMatch[1].trim();
}

function extractContentWithoutSubnav(mainContent) {
  // Remove .subnav elements
  let content = mainContent.replace(/<nav class="subnav"[^>]*>[\s\S]*?<\/nav>/g, '');

  // Remove existing nav-drawer elements if present
  content = content.replace(/<input type="checkbox" id="nav-drawer-toggle"[^>]*\/>/g, '');
  content = content.replace(/<label for="nav-drawer-toggle"[^>]*>[\s\S]*?<\/label>/g, '');

  // Remove existing layout-sidebar wrappers if present
  content = content.replace(/<layout-sidebar[^>]*>[\s\S]*?(?=<h1)/g, '');

  return content.trim();
}

function extractHeadAndLeadParagraph(content) {
  // Extract h1 and optional lead paragraph
  const h1Match = content.match(/<h1[^>]*>[\s\S]*?<\/h1>/);
  const leadMatch = content.match(/<p class="lead"[^>]*>[\s\S]*?<\/p>/);

  let h1 = h1Match ? h1Match[0] : '';
  let lead = leadMatch ? leadMatch[0] : '';

  // Get remaining content after h1 and lead
  let remaining = content;
  if (h1) {
    remaining = remaining.replace(h1, '');
  }
  if (lead) {
    remaining = remaining.replace(lead, '');
  }

  return { h1, lead, remaining: remaining.trim() };
}

function wrapSectionsWithHeadingLinks(content) {
  // Check if heading-links is already present
  if (content.includes('<heading-links')) {
    return content;
  }

  // Wrap all sections in heading-links
  return `          <heading-links data-levels="h2,h3">
${content}
          </heading-links>`;
}

function transformFile(filePath) {
  const filename = basename(filePath);

  if (SKIP_FILES.includes(filename)) {
    console.log(`Skipping ${filename}`);
    return;
  }

  const html = readFileSync(filePath, 'utf-8');

  // Check if already transformed (has page-toc) - re-transform to fix categories
  const alreadyTransformed = html.includes('<page-toc');
  if (alreadyTransformed) {
    // Still need to re-process to fix category open states
    // We'll extract just the content from the article element
  }

  const mainContent = extractMainContent(html);
  if (!mainContent) {
    console.log(`Could not find main content in ${filename}`);
    return;
  }

  const cleanContent = extractContentWithoutSubnav(mainContent);
  const { h1, lead, remaining } = extractHeadAndLeadParagraph(cleanContent);

  if (!h1) {
    console.log(`Could not find h1 in ${filename}`);
    return;
  }

  // Get category for this file
  const relPath = getRelativePath(filePath);
  const category = CATEGORY_MAP[relPath];

  // Set current page and open correct category in tree nav
  const treeNav = setCurrentPageAndOpenCategory(TREE_NAV, filePath, category);

  // Wrap remaining content with heading-links
  const wrappedContent = wrapSectionsWithHeadingLinks(remaining);

  // Build the new main content
  const newMainContent = `    <main>
${NAV_DRAWER_TOGGLE}

      <layout-sidebar data-gap="xl" data-sidebar-width="narrow" data-content-min="60">
${treeNav}

        <layout-sidebar data-side="end" data-sidebar-width="narrow" data-gap="xl">
        <aside>
          <page-toc data-levels="h2,h3" data-scope="article"></page-toc>
        </aside>
        <article>
          ${h1}
          ${lead}

${wrappedContent}
        </article>
        </layout-sidebar>
      </layout-sidebar>
    </main>`;

  // Replace main content in original HTML
  const newHtml = html.replace(/<main[^>]*>[\s\S]*?<\/main>/, newMainContent);

  writeFileSync(filePath, newHtml);
  console.log(`Transformed: ${filename}`);
}

// Main execution
const files = getFilesRecursively(DOCS_ELEMENTS);
console.log(`Found ${files.length} files to process`);

for (const file of files) {
  try {
    transformFile(file);
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }
}

console.log('Done!');
