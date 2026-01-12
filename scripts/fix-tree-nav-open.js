#!/usr/bin/env node
/**
 * Fix tree navigation category open states
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DOCS_ELEMENTS = join(ROOT, 'docs', 'elements');

// Skip these files (already correct)
const SKIP_FILES = ['nav.html', 'index.html'];

// Map file paths to tree nav category
const CATEGORY_MAP = {
  'native/article.html': 'Sectioning',
  'native/aside.html': 'Sectioning',
  'native/footer.html': 'Sectioning',
  'native/header.html': 'Sectioning',
  'native/hgroup.html': 'Sectioning',
  'native/main.html': 'Sectioning',
  'native/section.html': 'Sectioning',
  'native/address.html': 'Sectioning',
  'native/sectioning.html': 'Sectioning',
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
  'native/dfn.html': 'Text Semantics',
  'native/s.html': 'Text Semantics',
  'native/u.html': 'Text Semantics',
  'native/sub.html': 'Text Semantics',
  'native/sup.html': 'Text Semantics',
  'native/ruby.html': 'Text Semantics',
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
  'native/col.html': 'Tables',
  'native/colgroup.html': 'Tables',
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
  'native/optgroup.html': 'Forms',
  'native/option.html': 'Forms',
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
  'native/search.html': 'Interactive',
  'native/meter.html': 'Other',
  'native/progress.html': 'Other',
  'native/data.html': 'Other',
  'native/del.html': 'Other',
  'native/ins.html': 'Other',
  'native/canvas.html': 'Other',
  'native/iframe.html': 'Other',
  'native/svg.html': 'Other',
  'native/states.html': 'Other',
};

function getFilesRecursively(dir) {
  const files = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

function getRelativePath(filePath) {
  return relative(DOCS_ELEMENTS, filePath);
}

function fixFile(filePath) {
  const filename = basename(filePath);
  const relPath = getRelativePath(filePath);

  if (SKIP_FILES.includes(filename)) {
    console.log(`Skipping ${filename}`);
    return;
  }

  let html = readFileSync(filePath, 'utf-8');

  // Check if this file has tree nav
  if (!html.includes('<nav class="tree"')) {
    console.log(`No tree nav in ${filename}`);
    return;
  }

  // Get category for this file
  const category = CATEGORY_MAP[relPath];
  let modified = false;

  // For native element files, open the specific category
  if (category && filePath.includes('/native/')) {
    const categoryPattern = new RegExp(
      `(<details)>\\s*\\n\\s*(<summary>${category}</summary>)`
    );
    if (html.match(categoryPattern)) {
      html = html.replace(categoryPattern, '$1 open>\n              $2');
      modified = true;
    }
  }

  // For custom-elements files, open Custom Elements section
  if (filePath.includes('/custom-elements/')) {
    const customPattern = /(<details)>\s*\n\s*(<summary>Custom Elements<\/summary>)/;
    if (html.match(customPattern)) {
      html = html.replace(customPattern, '$1 open>\n            $2');
      modified = true;
    }
  }

  // For web-components files, open Web Components section
  if (filePath.includes('/web-components/')) {
    const wcPattern = /(<details)>\s*\n\s*(<summary>Web Components<\/summary>)/;
    if (html.match(wcPattern)) {
      html = html.replace(wcPattern, '$1 open>\n            $2');
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(filePath, html);
    console.log(`Fixed: ${relPath}`);
  } else {
    console.log(`No changes needed: ${relPath}`);
  }
}

// Main execution
const files = getFilesRecursively(DOCS_ELEMENTS);
console.log(`Found ${files.length} files to check`);

for (const file of files) {
  try {
    fixFile(file);
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }
}

console.log('Done!');
