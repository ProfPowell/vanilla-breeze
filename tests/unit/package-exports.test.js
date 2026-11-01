/**
 * Every package.json `exports` target must exist in the committed dist/.
 *
 * The ux-planning pack was removed (Workstream D) but its two export entries
 * lived on for months; a consumer importing `vanilla-breeze/ux-planning-css`
 * would have hit a resolution error. Patterns (`./themes/*`) are checked by
 * resolving their directory.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const targets = [];
const collect = (key, value) => {
  if (typeof value === 'string') targets.push([key, value]);
  else for (const v of Object.values(value)) collect(key, v);
};
for (const [key, value] of Object.entries(pkg.exports)) collect(key, value);

for (const [key, target] of targets) {
  test(`exports[${key}] → ${target} exists`, () => {
    const path = target.includes('*') ? dirname(target) : target;
    assert.ok(existsSync(path), `${key} points at ${target}, which is not in dist/`);
  });
}

test('main and module entries exist', () => {
  for (const f of [pkg.main, pkg.module]) assert.ok(existsSync(f), f);
});
