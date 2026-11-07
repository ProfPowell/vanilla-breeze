/**
 * Every CSS-only custom element is defined (inertly) by
 * src/custom-elements/register.js.
 *
 * [hide-until-ready]:not(:defined) used to hide <layout-stack>, <layout-card>
 * and the rest for good: nothing ever defined them. register.js now lists
 * every src/custom-elements/<name>/ without a JS definition. A tag that
 * gets real JS must leave the list (an inert definition would win the race
 * and block it).
 *
 * Run: node --test tests/unit/inert-custom-elements.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CE = 'src/custom-elements';
const registerSrc = readFileSync(join(CE, 'register.js'), 'utf8');
const listed = [...(registerSrc.match(/INERT_ELEMENTS = \[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]);

/** Every tag some JS file in src/ defines. */
function definedTags(dir, out = new Set()) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'vendor') definedTags(p, out); continue; }
    if (!name.endsWith('.js') || p === join(CE, 'register.js')) continue;
    for (const m of readFileSync(p, 'utf8').matchAll(/(?:registerComponent|customElements\.define)\(\s*['"]([a-z0-9-]+)['"]/g)) out.add(m[1]);
  }
  return out;
}

const defined = definedTags('src');
const dirs = readdirSync(CE).filter(n => n.includes('-') && statSync(join(CE, n)).isDirectory());

test('every CSS-only custom element directory is registered inertly', () => {
  const expected = dirs.filter(n => !defined.has(n)).sort();
  assert.deepEqual([...listed].sort(), expected);
});

test('no inert definition shadows a real one', () => {
  for (const name of listed) assert.ok(!defined.has(name), `${name} has a JS definition`);
});
