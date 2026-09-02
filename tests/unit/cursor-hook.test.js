/**
 * Theme cursor hook (vanilla-breeze-vjpn).
 *
 * src/base/reset.css wires `cursor: var(--cursor-custom-pointer)` so a theme
 * can ship its own pointer (cyber and magna document SVG cursors in
 * tokens/extensions/cursors.css). Every component that hardcoded
 * `cursor: pointer` in a higher layer silently switched the theme cursor
 * off for that control — which was every form control and every
 * web-component button. Framework CSS must reach the pointer through the
 * hook, with `pointer` as the fallback:
 *
 *   cursor: var(--cursor-custom-pointer, pointer);
 *
 * Run: node --test tests/unit/cursor-hook.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ROOTS = ['src/native-elements', 'src/custom-elements', 'src/web-components', 'src/utils', 'src/base'];

const cssFiles = (dir) =>
  readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? cssFiles(join(dir, e.name)) : e.name.endsWith('.css') ? [join(dir, e.name)] : [],
  );

describe('framework CSS reaches the pointer cursor through the theme hook', () => {
  for (const dir of ROOTS) {
    it(`${dir}/** has no hardcoded cursor: pointer`, () => {
      const offenders = [];
      for (const file of cssFiles(dir)) {
        const css = readFileSync(resolve(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
        for (const m of css.matchAll(/cursor\s*:\s*pointer\s*(?:!important)?\s*;/g)) {
          const line = css.slice(0, m.index).split('\n').length;
          offenders.push(`${relative(root, resolve(root, file))}:${line}`);
        }
      }
      assert.deepEqual(
        offenders,
        [],
        'Write `cursor: var(--cursor-custom-pointer, pointer);` so themes can restyle the pointer:\n  ' +
          offenders.join('\n  '),
      );
    });
  }

  it('the reset still declares the hook', () => {
    const reset = readFileSync(resolve(root, 'src/base/reset.css'), 'utf8');
    assert.match(reset, /cursor:\s*var\(--cursor-custom-pointer\)/);
  });
});
