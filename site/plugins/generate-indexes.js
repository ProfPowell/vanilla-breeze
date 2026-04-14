/**
 * @file generate-indexes.js
 * @description Per-file plugin that replaces {% for %} loops in index/listing pages
 * with HTML generated from data files.
 *
 * Each index page has a unique data structure and loop pattern. This plugin
 * detects which page is being processed (by path) and generates the appropriate HTML.
 */

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function packBadge(item) {
  if (!item.pack) return '';
  return `<span class="pack-badge"><icon-wc name="package"></icon-wc>${esc(item.pack)}</span>`;
}

// --- Element Index: alphabetical ---
function generateElementIndex(data) {
  const byLetter = data.elements?.byLetter;
  if (!byLetter) return null;
  let html = '';
  for (const [letter, items] of Object.entries(byLetter)) {
    html += `<h2 class="letter-heading">${letter}</h2>\n`;
    for (const item of items) {
      html += `<a href="${item.href}" class="element-entry" data-type="${item.type}">`;
      html += `<code>&lt;${esc(item.name)}&gt;</code>`;
      html += `<span class="element-badge" data-type="${item.type}">${item.type}</span>`;
      html += packBadge(item);
      html += `</a>\n`;
    }
  }
  return html;
}

// --- Native Elements by category ---
function generateNativeIndex(data) {
  const cats = data.nativeCategories;
  if (!cats) return null;
  let html = '';
  for (const [category, items] of Object.entries(cats)) {
    html += `<section>\n<h2>${esc(category)}</h2>\n`;
    html += `<layout-grid data-layout-min="200px" data-layout-gap="s">\n`;
    for (const item of items) {
      html += `<a href="${item.href}" class="section-card"><h3><code>&lt;${esc(item.name)}&gt;</code></h3><p>${esc(item.desc)}</p></a>\n`;
    }
    html += `</layout-grid>\n</section>\n`;
  }
  return html;
}

// --- Web Components list (categorized object or flat array) ---
function generateWebComponentsIndex(data) {
  const items = data.webComponents;
  if (!items) return null;

  // Support categorized object: { 'Category': [...], ... }
  if (!Array.isArray(items) && typeof items === 'object') {
    let html = '';
    for (const [category, entries] of Object.entries(items)) {
      html += `<h3>${esc(category)} <small style="font-weight:400;color:var(--color-text-muted,#666)">(${entries.length})</small></h3>\n`;
      html += `<layout-grid data-layout-min="250px" data-layout-gap="s" style="margin-block-end:var(--size-l,1.5rem)">\n`;
      for (const item of entries) {
        html += `<a href="${item.href}" class="section-card"><h4><code>&lt;${esc(item.name)}&gt;</code></h4><p>${esc(item.desc)}</p></a>\n`;
      }
      html += `</layout-grid>\n`;
    }
    return html;
  }

  // Fallback: flat array
  let html = '';
  for (const item of items) {
    html += `<a href="${item.href}" class="section-card"><h3><code>&lt;${esc(item.name)}&gt;</code></h3><p>${esc(item.desc)}</p></a>\n`;
  }
  return html;
}

// --- Custom Elements list ---
function generateCustomElementsIndex(data) {
  const ce = data.customElements;
  if (!ce) return null;
  let html = { layoutPrimitives: '', uiElements: '' };
  if (ce.layoutPrimitives) {
    for (const item of ce.layoutPrimitives) {
      html.layoutPrimitives += `<a href="${item.href}" class="section-card"><h3><code>&lt;${esc(item.name)}&gt;</code></h3><p>${esc(item.desc)}</p></a>\n`;
    }
  }
  if (ce.uiElements) {
    for (const item of ce.uiElements) {
      html.uiElements += `<a href="${item.href}" class="section-card"><h3><code>&lt;${esc(item.name)}&gt;</code></h3><p>${esc(item.desc)}</p></a>\n`;
    }
  }
  return html;
}

// --- Attribute index (combined native + data) ---
function generateAttributeNativeItems(data) {
  const cats = data.attributeIndex?.nativeCategories;
  if (!cats) return null;
  let html = '';
  for (const [key, category] of Object.entries(cats)) {
    html += `<h3 class="category-heading">${esc(category.label)}</h3>\n`;
    for (const item of category.items) {
      html += `<a href="${item.href}" class="attribute-entry" data-type="${item.type || 'native'}">`;
      html += `<code>${esc(item.name)}</code>`;
      if (item.type) html += `<span class="attribute-badge" data-type="${item.type}">${item.type}</span>`;
      html += packBadge(item);
      if (item.description) html += `<p class="description">${esc(item.description)}</p>`;
      html += `</a>\n`;
    }
  }
  return html;
}

function generateAttributeDataItems(data) {
  const cats = data.attributeIndex?.dataCategories;
  if (!cats) return null;
  let html = '';
  for (const [key, category] of Object.entries(cats)) {
    html += `<h3 class="category-heading">${esc(category.label)}</h3>\n`;
    for (const item of category.items) {
      html += `<a href="${item.href}" class="attribute-entry" data-type="${item.type || 'data'}">`;
      html += `<code>${esc(item.name)}</code>`;
      if (item.type) html += `<span class="attribute-badge" data-type="${item.type}">${item.type}</span>`;
      html += packBadge(item);
      if (item.description) html += `<p class="description">${esc(item.description)}</p>`;
      html += `</a>\n`;
    }
  }
  return html;
}

// --- Attribute sub-indexes (native-only, data-only) ---
function generateAttributeSubIndex(categories) {
  if (!categories) return null;
  let html = '';
  for (const [key, category] of Object.entries(categories)) {
    html += `<section>\n<h2>${esc(category.label)}</h2>\n`;
    html += `<layout-grid data-layout-min="280px" data-layout-gap="s">\n`;
    for (const item of category.items) {
      html += `<a href="${item.href}" class="section-card"><h3><code>${esc(item.name)}</code></h3><p>${esc(item.description)}</p></a>\n`;
    }
    html += `</layout-grid>\n</section>\n`;
  }
  return html;
}

// --- Resilience Matrix ---
function generateResilienceMatrix(data) {
  const r = data.resilience;
  if (!r?.dimensions || !r?.components) return null;

  // Table headers
  let thead = '<tr><th>Component</th>';
  for (const dim of r.dimensions) {
    thead += `<th><tool-tip>${esc(dim.label)}<span role="tooltip">${esc(dim.description)}</span></tool-tip></th>`;
  }
  thead += '<th>Notes</th></tr>';

  // Table body
  let tbody = '';
  for (const comp of r.components) {
    tbody += `<tr><td><code>&lt;${esc(comp.name)}&gt;</code></td>`;
    for (const dim of r.dimensions) {
      const status = comp.status?.[dim.id] || 'none';
      const label = status === 'full' ? 'Full' : status === 'partial' ? 'Partial' : 'None';
      tbody += `<td data-status="${status}">${label}</td>`;
    }
    const hasNote = comp.notes && comp.notes.trim();
    if (hasNote) {
      const truncated = comp.notes.length > 50 ? comp.notes.substring(0, 50) + '...' : comp.notes;
      tbody += `<td><a href="#note-${comp.name}">${esc(truncated)}</a></td>`;
    } else {
      tbody += '<td>&mdash;</td>';
    }
    tbody += '</tr>\n';
  }

  return { thead, tbody };
}


// --- Plugin entry point ---
export class GenerateIndexes {
  constructor({ file, data }) {
    this.file = file;
    this.data = data;
  }

  async init() {
    // Only process files with {% for %} loops
    if (!this.file.src.includes('{% for')) return;

    const path = this.file.path;

    // Element indexes
    if (path.includes('docs/elements/index')) {
      this.replaceForBlock(generateElementIndex(this.data));
    }
    else if (path.includes('docs/elements/native/index')) {
      this.replaceForBlock(generateNativeIndex(this.data));
    }
    else if (path.includes('docs/elements/web-components/index')) {
      this.replaceForBlock(generateWebComponentsIndex(this.data));
    }
    else if (path.includes('docs/elements/custom-elements/index')) {
      const html = generateCustomElementsIndex(this.data);
      if (html) {
        this.replaceForLoop('customElements.layoutPrimitives', html.layoutPrimitives);
        this.replaceForLoop('customElements.uiElements', html.uiElements);
      }
    }
    // Attribute indexes
    else if (path.includes('docs/attributes/index') && !path.includes('native') && !path.includes('data/')) {
      const nativeHtml = generateAttributeNativeItems(this.data);
      const dataHtml = generateAttributeDataItems(this.data);
      if (nativeHtml) this.replaceForLoop('attributeIndex.nativeCategories', nativeHtml);
      if (dataHtml) this.replaceForLoop('attributeIndex.dataCategories', dataHtml);
    }
    else if (path.includes('docs/attributes/native/index')) {
      this.replaceForBlock(generateAttributeSubIndex(this.data.attributeIndex?.nativeCategories));
    }
    else if (path.includes('docs/attributes/data/index')) {
      this.replaceForBlock(generateAttributeSubIndex(this.data.attributeIndex?.dataCategories));
    }
    // Resilience matrix
    else if (path.includes('resilience-matrix')) {
      const html = generateResilienceMatrix(this.data);
      if (html) {
        this.replaceForLoop('resilience.dimensions', html.thead, 'thead');
        this.replaceForLoop('resilience.components', html.tbody, 'tbody');
      }
    }
  }

  /**
   * Replace the entire {% for %}...{% endfor %} block(s) with generated HTML.
   * Used when the whole for-block section should be replaced.
   */
  replaceForBlock(html) {
    if (!html) return;
    // Replace the outermost {% for %}...{% endfor %} block with generated HTML.
    // For nested loops, we need to match from the first {% for %} to the LAST {% endfor %}.
    // Strategy: find the first {% for %} and count nesting to find its matching {% endfor %}.
    const src = this.file.src;
    const firstFor = src.search(/\{%[-\s]*for\s/);
    if (firstFor === -1) return;

    let depth = 0;
    let endPos = -1;
    const forPattern = /\{%[-\s]*(?:for|endfor)[-\s]*[^%]*%\}/g;
    forPattern.lastIndex = firstFor;
    let m;
    while ((m = forPattern.exec(src)) !== null) {
      if (/\{%[-\s]*for\s/.test(m[0])) depth++;
      else if (/\{%[-\s]*endfor/.test(m[0])) {
        depth--;
        if (depth === 0) { endPos = m.index + m[0].length; break; }
      }
    }

    if (endPos === -1) return;
    this.file.src = src.substring(0, firstFor) + html + src.substring(endPos);
    // Clean up any remaining {% if/elif/else/endif %} from the template
    this.file.src = this.file.src.replace(/\{%[-\s]*(if|elif|else|endif)[^%]*%\}/g, '');
  }

  /**
   * Replace a specific {% for ... in COLLECTION %}...{% endfor %} loop.
   * Used when there are multiple for-loops in one page.
   */
  replaceForLoop(collection, html, scope) {
    if (!html) return;
    const collectionEsc = collection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Use depth-aware matching like replaceForBlock to handle nested loops
    const startPattern = new RegExp(`\\{%[-\\s]*for\\s+\\w+(?:\\s*,\\s*\\w+)?\\s+in\\s+${collectionEsc}\\s*%\\}`);
    const startMatch = this.file.src.match(startPattern);
    if (!startMatch) return;

    const startPos = this.file.src.indexOf(startMatch[0]);
    let depth = 0;
    let endPos = -1;
    const forPattern = /\{%[-\s]*(?:for|endfor)[-\s]*[^%]*%\}/g;
    forPattern.lastIndex = startPos;
    let m;
    while ((m = forPattern.exec(this.file.src)) !== null) {
      if (/\{%[-\s]*for\s/.test(m[0])) depth++;
      else if (/\{%[-\s]*endfor/.test(m[0])) {
        depth--;
        if (depth === 0) { endPos = m.index + m[0].length; break; }
      }
    }

    if (endPos === -1) return;
    this.file.src = this.file.src.substring(0, startPos) + html + this.file.src.substring(endPos);
    // Clean up remaining conditionals
    this.file.src = this.file.src.replace(/\{%[-\s]*(if|elif|else|endif)[^%]*%\}/g, '');
  }
}
