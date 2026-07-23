/**
 * Autoload manifest completeness.
 *
 * dist/cdn/components/manifest.json is the tag → chunk map the autoloader
 * (src/lib/autoloader.js) uses to upgrade custom elements on demand. A tag
 * missing from it simply never upgrades: no error, no warning, the element
 * just stays inert on any page that relies on autoloading rather than the
 * eager bundle.
 *
 * That has bitten twice. The builder matched only customElements.define, so
 * anything registered via registerComponent (icon-wc) was absent; and it
 * recorded only the FIRST tag a chunk defined, so image-map — which registers
 * map-area first — was absent while its own child tag was present.
 *
 * This test asserts the shipped manifest covers every tag the source
 * registers. The manifest is a tracked build artifact, so it is expected to be
 * present and current; if this fails after adding or renaming a component, run
 * `npm run build`.
 *
 * Run: node --test tests/unit/autoload-manifest.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const wcDir = join(root, 'src/web-components');
const manifestPath = join(root, 'dist/cdn/components/manifest.json');

/** Mirrors extractTagNames() in scripts/build-cdn.js. */
const extractTagNames = (source) => [
  ...new Set(
    [
      ...source.matchAll(/(?:customElements\.define|registerComponent)\(\s*['"]([^'"]+)['"]/g),
    ].map((m) => m[1]),
  ),
];

/** @returns {Map<string, string>} tag → source file that registers it */
function registeredTags() {
  const tags = new Map();
  for (const entry of readdirSync(wcDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // logic.js is the convention; icon-wc uses a same-named entry file.
    for (const candidate of ['logic.js', `${entry.name}.js`]) {
      const file = join(wcDir, entry.name, candidate);
      if (!existsSync(file)) continue;
      for (const tag of extractTagNames(readFileSync(file, 'utf8'))) {
        if (!tags.has(tag)) tags.set(tag, `${entry.name}/${candidate}`);
      }
    }
  }
  return tags;
}

describe('autoload component manifest', () => {
  it('exists (build artifact is tracked)', () => {
    assert.ok(existsSync(manifestPath), `${manifestPath} missing — run \`npm run build\``);
  });

  it('lists every custom element tag the web components register', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const missing = [...registeredTags()]
      .filter(([tag]) => !manifest[tag])
      .map(([tag, src]) => `<${tag}> (registered in ${src})`);

    assert.deepEqual(
      missing,
      [],
      'These tags cannot autoload — they are registered in source but absent ' +
        'from the manifest. Run `npm run build`; if they are still missing, ' +
        'check the tag extraction in scripts/build-cdn.js.',
    );
  });

  it('points every entry at a chunk that was actually emitted', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const chunkDir = dirname(manifestPath);
    const broken = Object.entries(manifest)
      .filter(([, entry]) => !existsSync(join(chunkDir, entry.file)))
      .map(([tag, entry]) => `${tag} → ${entry.file}`);
    assert.deepEqual(broken, [], 'Manifest references chunks that do not exist.');
  });
});
