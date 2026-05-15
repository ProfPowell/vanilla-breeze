/**
 * Build-output regression test: every theme in dist/cdn/themes/manifest.json
 * has a valid DTCG sibling artifact next to its CSS file.
 *
 * Walks the manifest, asserts:
 *   - manifest.{slug}.dtcg points to a file that exists
 *   - that file is valid JSON
 *   - the file declares spec="2025.10" in $extensions["com.vanilla-breeze"]
 *   - if .dtcgDark is present, same checks apply
 *
 * Phase 2 of vanilla-breeze-jxlv (DTCG theme pipeline).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = join(__dirname, '..', '..', 'dist', 'cdn', 'themes');

const VB_NS = 'com.vanilla-breeze';

const manifestPath = join(THEMES_DIR, 'manifest.json');
const hasManifest = existsSync(manifestPath);

describe('DTCG artifacts — manifest', { skip: !hasManifest }, () => {
  const manifest = hasManifest ? JSON.parse(readFileSync(manifestPath, 'utf-8')) : {};
  const themes = Object.keys(manifest);

  it('has at least 40 themes', () => {
    assert.ok(themes.length >= 40, `expected ≥40 themes in manifest, got ${themes.length}`);
  });

  it('every theme entry declares a dtcg field', () => {
    const missing = themes.filter((id) => !manifest[id].dtcg);
    assert.deepEqual(missing, [], `themes missing .dtcg: ${missing.join(', ')}`);
  });

  for (const id of themes.length ? themes : ['__none__']) {
    if (id === '__none__') continue;
    describe(`theme: ${id}`, () => {
      const entry = manifest[id];

      it('has a base .tokens.json file on disk', () => {
        const path = join(THEMES_DIR, entry.dtcg);
        assert.ok(existsSync(path), `missing: ${entry.dtcg}`);
      });

      it('base .tokens.json is valid JSON', () => {
        const text = readFileSync(join(THEMES_DIR, entry.dtcg), 'utf-8');
        // assert.doesNotThrow doesn't accept JSON.parse cleanly; do it inline.
        let doc;
        try { doc = JSON.parse(text); }
        catch (e) { assert.fail(`JSON parse failed for ${entry.dtcg}: ${e.message}`); }
        assert.ok(doc && typeof doc === 'object', 'expected an object root');
        assert.equal(doc.$extensions[VB_NS].spec, '2025.10');
      });

      if (entry.dtcgDark) {
        it('dark .tokens.json file exists and is valid JSON', () => {
          const path = join(THEMES_DIR, entry.dtcgDark);
          assert.ok(existsSync(path), `missing: ${entry.dtcgDark}`);
          const text = readFileSync(path, 'utf-8');
          let doc;
          try { doc = JSON.parse(text); }
          catch (e) { assert.fail(`JSON parse failed for ${entry.dtcgDark}: ${e.message}`); }
          assert.equal(doc.$extensions[VB_NS].spec, '2025.10');
        });
      }
    });
  }
});
