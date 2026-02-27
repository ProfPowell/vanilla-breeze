#!/usr/bin/env node

/**
 * Generate isolated HTML fixture files from the compendium.
 *
 * Reads compendium.json and writes one HTML file per variant into generated/.
 * Also writes a manifest.json listing all generated fixtures with metadata.
 *
 * Run: node tests/element-visual/fixtures/generate-fixtures.js
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const dir = import.meta.dirname;
const compendiumPath = join(dir, '../compendium/compendium.json');
const outputDir = join(dir, 'generated');
const compendium = JSON.parse(readFileSync(compendiumPath, 'utf8'));

// Clean and recreate output directory
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const manifest = [];

for (const element of compendium.elements) {
  for (const variant of element.variants) {
    const fixtureId = `${element.id}--${variant.id}`;
    const filename = `${fixtureId}.html`;
    const fixtureWidth = variant.fixtureWidth || 'default';

    const mainJsTag = element.jsRequired
      ? '  <script type="module" src="/src/main.js"></script>\n'
      : '';

    const setupCode = variant.setup ? `\n    ${variant.setup}` : '';

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${element.id} / ${variant.name}</title>
  <link rel="stylesheet" href="/src/main.css">
  <style>
    body { padding: var(--size-l); min-height: auto; }
    [data-fixture-label] {
      font-size: 11px; font-family: system-ui; color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--size-2xs); margin-bottom: var(--size-s);
    }
    [data-fixture-target] { max-inline-size: 480px; }
    [data-fixture-target][data-fixture-width="wide"] { max-inline-size: 720px; }
  </style>
</head>
<body>
  <p data-fixture-label>${element.id} / ${variant.name}</p>
  <div data-fixture-target${fixtureWidth !== 'default' ? ` data-fixture-width="${fixtureWidth}"` : ''}>
    ${variant.html}
  </div>
${mainJsTag}  <script type="module">
    import { ThemeManager } from '/src/lib/theme-manager.js';
    import { ensureThemeLoaded } from '/src/lib/theme-loader.js';
    const params = new URLSearchParams(location.search);
    const theme = params.get('theme');
    const mode = params.get('mode');
    if (theme || mode) {
      if (theme) await ensureThemeLoaded(theme);
      ThemeManager.apply({
        brand: theme || 'default',
        mode: mode || 'light',
      });
    }${setupCode}
  </script>
</body>
</html>
`;

    writeFileSync(join(outputDir, filename), html);

    manifest.push({
      fixtureId,
      filename,
      elementId: element.id,
      elementTag: element.tag,
      variantId: variant.id,
      variantName: variant.name,
      interactive: variant.interactive || false,
      setup: variant.setup || null,
      fixtureWidth,
    });
  }
}

// Write manifest
writeFileSync(
  join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`✓ Generated ${manifest.length} fixtures in ${outputDir}`);
