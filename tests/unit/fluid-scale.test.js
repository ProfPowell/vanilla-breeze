/**
 * Fluid type scale: no step may get smaller as the viewport widens, in any
 * preset, and the a11y-large-text theme must restate every preset (its
 * `[data-fluid]` rule would otherwise replace compact and spacious).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postcss from 'postcss';

const repo = resolve(import.meta.dirname, '../..');
const files = ['src/tokens/fluid.css', 'src/tokens/themes/_access-large-text.css'];

/** @returns {{ file: string, selector: string, prop: string, value: string }[]} */
function fluidDecls(file) {
  const out = [];
  postcss.parse(readFileSync(resolve(repo, file), 'utf8')).walkRules((rule) => {
    if (!rule.selector.includes('[data-fluid')) return;
    rule.walkDecls(/^--(font-size-|size-unit)/, (d) => {
      out.push({ file, selector: rule.selector, prop: d.prop, value: d.value });
    });
  });
  return out;
}

test('no fluid type or spacing step shrinks as the viewport widens', () => {
  const decls = files.flatMap(fluidDecls);
  assert.ok(decls.length > 50, `only ${decls.length} fluid declarations found`);
  for (const { file, selector, prop, value } of decls) {
    const m = value.match(/^clamp\(\s*([\d.]+)rem\s*,\s*(-?[\d.]+)vi\s*\+\s*-?[\d.]+rem\s*,\s*([\d.]+)rem\s*\)$/);
    if (!m) {
      assert.match(value, /^[\d.]+rem$/, `${file} ${selector} ${prop}: unexpected value ${value}`);
      continue;
    }
    const where = `${file} "${selector.split(',')[0]}" ${prop}`;
    assert.ok(Number(m[2]) >= 0, `${where} has a negative slope: ${value}`);
    assert.ok(Number(m[1]) <= Number(m[3]), `${where} has min above max: ${value}`);
  }
});

test('a11y-large-text restates the compact and spacious presets', () => {
  const decls = fluidDecls('src/tokens/themes/_access-large-text.css').filter((d) => d.prop === '--font-size-5xl');
  const base = decls.findIndex((d) => d.selector.includes('[data-fluid]'));
  assert.ok(base >= 0, 'the any-value [data-fluid] rule is missing');
  for (const preset of ['compact', 'spacious']) {
    const at = decls.findIndex((d) => d.selector.includes(`[data-fluid="${preset}"]`));
    assert.ok(at >= 0, `no large-text rule for data-fluid="${preset}"`);
    assert.notEqual(decls[at].value, decls[base].value);
    // Same specificity as the any-value rule, so it must come later to win.
    assert.ok(at > base, `the ${preset} rule must follow the [data-fluid] rule`);
  }
});
