#!/usr/bin/env node

/**
 * Build a static HTML gallery page from screenshot baselines.
 *
 * Reads the baselines directory + manifest.json to generate a filterable
 * thumbnail grid with lightbox for reviewing element visual tests.
 *
 * Run: node tests/element-visual/gallery/build-gallery.js
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';

const dir = import.meta.dirname;
const baseDir = join(dir, '..');
const baselinesDir = join(baseDir, 'baselines/desktop/element-visual.spec.js');
const manifestPath = join(baseDir, 'fixtures/generated/manifest.json');
const outputPath = join(dir, 'gallery.html');

// Read manifest for metadata
let manifest = [];
if (existsSync(manifestPath)) {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
}

// Build lookup from fixtureId to manifest entry
const manifestMap = new Map();
for (const entry of manifest) {
  manifestMap.set(entry.fixtureId, entry);
}

// Discover baseline screenshots
let screenshots = [];
if (existsSync(baselinesDir)) {
  screenshots = readdirSync(baselinesDir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(filename => {
      // Parse: button--default--swiss--dark.png
      const base = filename.replace('.png', '');
      const parts = base.split('--');
      // elementId--variantId--theme--mode
      const elementId = parts[0];
      const variantId = parts[1];
      const theme = parts[2];
      const mode = parts[3];
      const fixtureId = `${elementId}--${variantId}`;
      const meta = manifestMap.get(fixtureId);

      return {
        filename,
        path: relative(dir, join(baselinesDir, filename)),
        elementId,
        variantId,
        variantName: meta?.variantName || variantId,
        theme,
        mode,
        fixtureId,
      };
    });
}

// Collect unique values for filters
const elements = [...new Set(screenshots.map(s => s.elementId))].sort();
const themes = [...new Set(screenshots.map(s => s.theme))].sort();
const modes = [...new Set(screenshots.map(s => s.mode))].sort();

function option(value, label) {
  return `<option value="${value}">${label || value}</option>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Element Visual Gallery</title>
  <link rel="stylesheet" href="gallery.css">
</head>
<body>
  <h1>Element Visual Gallery</h1>
  <p class="gallery-meta">${screenshots.length} screenshots across ${elements.length} elements, ${themes.length} themes, ${modes.length} modes</p>

  <div class="gallery-filters">
    <label>
      Element
      <select id="filter-element">
        <option value="">All</option>
        ${elements.map(e => option(e)).join('\n        ')}
      </select>
    </label>
    <label>
      Theme
      <select id="filter-theme">
        <option value="">All</option>
        ${themes.map(t => option(t)).join('\n        ')}
      </select>
    </label>
    <label>
      Mode
      <select id="filter-mode">
        <option value="">All</option>
        ${modes.map(m => option(m)).join('\n        ')}
      </select>
    </label>
    <span class="gallery-count" id="count"></span>
  </div>

  <div class="gallery-grid" id="grid">
    ${screenshots
      .map(
        s => `<article class="gallery-item" data-element="${s.elementId}" data-theme="${s.theme}" data-mode="${s.mode}" data-src="${s.path}" data-caption="${s.elementId} / ${s.variantName} — ${s.theme} ${s.mode}">
      <img src="${s.path}" alt="${s.elementId} ${s.variantId} ${s.theme} ${s.mode}" loading="lazy" width="220">
      <div class="gallery-item-info">
        <p class="gallery-item-title">${s.variantName}</p>
        <p class="gallery-item-meta">${s.theme} / ${s.mode}</p>
      </div>
    </article>`
      )
      .join('\n    ')}
  </div>

  <dialog class="gallery-lightbox" id="lightbox">
    <button id="lightbox-close" aria-label="Close">&times;</button>
    <figure>
      <img id="lightbox-img" src="" alt="">
      <figcaption id="lightbox-caption"></figcaption>
    </figure>
  </dialog>

  <script>
    // Filtering
    const grid = document.getElementById('grid');
    const items = [...grid.querySelectorAll('.gallery-item')];
    const countEl = document.getElementById('count');
    const filters = {
      element: document.getElementById('filter-element'),
      theme: document.getElementById('filter-theme'),
      mode: document.getElementById('filter-mode'),
    };

    function applyFilters() {
      let visible = 0;
      for (const item of items) {
        const show =
          (!filters.element.value || item.dataset.element === filters.element.value) &&
          (!filters.theme.value || item.dataset.theme === filters.theme.value) &&
          (!filters.mode.value || item.dataset.mode === filters.mode.value);
        item.hidden = !show;
        if (show) visible++;
      }
      countEl.textContent = visible + ' / ' + items.length;
    }

    for (const f of Object.values(filters)) f.addEventListener('change', applyFilters);
    applyFilters();

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    grid.addEventListener('click', (e) => {
      const item = e.target.closest('.gallery-item');
      if (!item) return;
      lightboxImg.src = item.dataset.src;
      lightboxImg.alt = item.dataset.caption;
      lightboxCaption.textContent = item.dataset.caption;
      lightbox.showModal();
    });

    document.getElementById('lightbox-close').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.close();
    });
  </script>
</body>
</html>
`;

writeFileSync(outputPath, html);
console.log(`✓ Gallery built: ${outputPath} (${screenshots.length} screenshots)`);
