/**
 * Catalog regression test: every vendored public-token-set DTCG file
 * deserializes cleanly, has complete provenance metadata, and survives
 * a Phase-1+3 round-trip without dropping its primary brand color.
 *
 * Phase 4 of vanilla-breeze-jxlv (DTCG theme pipeline).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { deserializeDTCG } from '../../src/web-components/theme-import/dtcg-deserialize.js';
import { serializeDTCG } from '../../src/web-components/theme-export/dtcg-serialize.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_DIR = join(__dirname, '..', '..', 'src', 'web-components', 'theme-import', 'catalog');

const VB_NS = 'com.vanilla-breeze';
const manifest = JSON.parse(readFileSync(join(CATALOG_DIR, 'manifest.json'), 'utf-8'));

describe('DTCG catalog — manifest', () => {
  it('targets stable spec 2025.10', () => {
    assert.equal(manifest.spec, '2025.10');
  });

  it('has at least 8 entries', () => {
    assert.ok(manifest.entries.length >= 8, `expected ≥8 entries, got ${manifest.entries.length}`);
  });

  it('every entry has full provenance fields', () => {
    const required = ['id', 'name', 'summary', 'homepage', 'source', 'license', 'attribution', 'file'];
    const incomplete = manifest.entries.filter(
      (e) => required.some((k) => !e[k])
    );
    assert.deepEqual(incomplete, [], `entries missing fields: ${incomplete.map(e => e.id).join(', ')}`);
  });

  it('every entry has a recognized OSI license', () => {
    const allowed = new Set(['MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC']);
    const bad = manifest.entries.filter((e) => !allowed.has(e.license));
    assert.deepEqual(bad, [], `non-OSI licenses: ${bad.map(e => `${e.id}:${e.license}`).join(', ')}`);
  });
});

for (const entry of manifest.entries) {
  describe(`catalog: ${entry.id}`, () => {
    const filePath = join(CATALOG_DIR, entry.file);
    const doc = JSON.parse(readFileSync(filePath, 'utf-8'));

    it('declares spec and source provenance in $extensions', () => {
      const ext = doc.$extensions[VB_NS];
      assert.equal(ext.spec, '2025.10');
      assert.equal(ext.catalog, true);
      assert.equal(ext.source.name, entry.name);
      assert.equal(ext.source.license, entry.license);
    });

    it('deserializes to at least 15 tokens', () => {
      const result = deserializeDTCG(doc);
      assert.ok(result.tokens.length >= 15, `${entry.id}: ${result.tokens.length} tokens`);
    });

    it('produces a --color-primary that round-trips through serialize→deserialize', () => {
      const r1 = deserializeDTCG(doc);
      const map1 = Object.fromEntries(r1.tokens);
      const primary1 = map1['--color-primary'];
      assert.ok(primary1, `${entry.id}: missing --color-primary`);

      const dtcg2 = serializeDTCG(r1.tokens);
      const r2 = deserializeDTCG(dtcg2);
      const map2 = Object.fromEntries(r2.tokens);
      assert.equal(
        String(map2['--color-primary']).toLowerCase(),
        String(primary1).toLowerCase(),
        `${entry.id}: primary lost during round-trip`,
      );
    });

    it('produces a usable --font-sans family list', () => {
      const result = deserializeDTCG(doc);
      const map = Object.fromEntries(result.tokens);
      const sans = map['--font-sans'];
      assert.ok(sans, `${entry.id}: missing --font-sans`);
      assert.match(sans, /(sans-serif|monospace|system-ui)/);
    });

    it('does not generate any ignored entries (pure VB-mappable file)', () => {
      const result = deserializeDTCG(doc);
      assert.deepEqual(result.ignored, [], `${entry.id} ignored: ${result.ignored.join(', ')}`);
    });
  });
}
