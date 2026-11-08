/**
 * Theme files are long, hand-nested CSS. A missing or extra `}` does not
 * break the build (browsers recover), it silently re-scopes every rule after
 * it. Parse each theme and assert:
 *   - the file parses (postcss throws on an unclosed block or a stray `}`);
 *   - a theme-root rule (`[data-theme…]` / `:root…`) never nests inside
 *     another style rule, which is what a missing `}` produces when the next
 *     theme block (e.g. the dark variant) gets swallowed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import postcss from 'postcss';

const repo = resolve(import.meta.dirname, '../..');
const themeDir = join(repo, 'src/tokens/themes');
const packDir = join(repo, 'src/packs');

const files = [
  ...readdirSync(themeDir).filter((f) => f.endsWith('.css')).map((f) => join(themeDir, f)),
  ...readdirSync(packDir, { recursive: true })
    .filter((f) => String(f).endsWith('.theme.css'))
    .map((f) => join(packDir, String(f))),
];

test('found theme files', () => {
  assert.ok(files.length > 40, `only ${files.length} theme files`);
});

for (const file of files) {
  const rel = file.slice(repo.length + 1);
  test(`${rel} parses with balanced braces and no nested theme roots`, () => {
    // postcss throws on an unclosed block or a stray `}`.
    const root = postcss.parse(readFileSync(file, 'utf8'), { from: file });
    root.walkRules((rule) => {
      if (!/^\s*(:root|\[data-theme)/.test(rule.selector)) return;
      for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
        const outer = p.type === 'rule' ? /** @type {import('postcss').Rule} */ (p).selector : '';
        assert.notEqual(p.type, 'rule',
          `${rel}:${rule.source?.start?.line} theme root "${rule.selector.split(',')[0]}" is nested inside "${outer.split(',')[0]}" (missing "}"?)`);
      }
    });
  });
}
