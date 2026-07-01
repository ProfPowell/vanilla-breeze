// tests/unit/gen-icon-css.test.js
// Run with: node --test tests/unit/gen-icon-css.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSetCss } from '../../scripts/gen-icon-css.js';

describe('generateSetCss', () => {
  it('emits unscoped rules with relative url for the default set', () => {
    const css = generateSetCss('lucide', ['star', 'x'], { isDefault: true });
    assert.match(css, /\[data-icon="star"\]\{--vb-icon:url\("lucide\/star\.svg"\)\}/);
    assert.match(css, /\[data-icon="x"\]\{--vb-icon:url\("lucide\/x\.svg"\)\}/);
    assert.doesNotMatch(css, /data-icon-set/);
  });

  it('emits set-scoped rules for a non-default set', () => {
    const css = generateSetCss('phosphor', ['star'], { isDefault: false });
    assert.match(
      css,
      /\[data-icon-set="phosphor"\] \[data-icon="star"\],\[data-icon-set="phosphor"\]\[data-icon="star"\]\{--vb-icon:url\("phosphor\/star\.svg"\)\}/
    );
  });

  it('escapes nothing unusual and is deterministic (sorted)', () => {
    const css = generateSetCss('lucide', ['x', 'a'], { isDefault: true });
    assert.ok(css.indexOf('data-icon="a"') < css.indexOf('data-icon="x"'));
  });
});
