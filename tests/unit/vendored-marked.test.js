/**
 * src/vendor/marked must be a verbatim copy of the installed package.
 *
 * markdown-viewer and markdown-editable-init import marked by relative path
 * so the raw /src module graph loads in a browser (kdkb). The copy is kept
 * honest here: bump the dependency, run `npm run vendor:marked`, and this
 * passes again.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pairs = [
  ['node_modules/marked/lib/marked.esm.js', 'src/vendor/marked/marked.esm.js'],
  ['node_modules/marked/lib/marked.d.ts', 'src/vendor/marked/marked.esm.d.ts'],
];

for (const [installed, vendored] of pairs) {
  test(`${vendored} matches ${installed}`, () => {
    assert.equal(readFileSync(vendored, 'utf8'), readFileSync(installed, 'utf8'),
      `${vendored} drifted from the installed package — run: npm run vendor:marked`);
  });
}

test('no source file imports the bare specifier "marked"', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (name === 'vendor' || name === 'htmlvalidate') continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.js') && /from\s+['"]marked['"]/.test(readFileSync(p, 'utf8'))) offenders.push(p);
    }
  };
  walk('src');
  assert.deepEqual(offenders, []);
});
