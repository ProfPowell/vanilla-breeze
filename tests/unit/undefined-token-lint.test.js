/**
 * Unit tests for scripts/quality/undefined-token-lint.js — the gate that
 * fails on `var(--token)` with no fallback when a public design token is
 * declared nowhere (the --color-on-primary bug).
 *
 * Run: node --test tests/unit/undefined-token-lint.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  declaredIn,
  declaredInJs,
  familyOf,
  references,
  isThemeFile,
  lintTokens,
} from '../../scripts/quality/undefined-token-lint.js';

const TOKENS = `:root {
  --color-primary: blue;
  --color-text-on-primary: white;
  --size-m: 1rem;
  --font-size-s: 0.875rem;
}`;

describe('helpers', () => {
  it('collects declarations and @property, ignoring comments', () => {
    const got = declaredIn('/* --color-ghost: x; */ a { --color-a: 1; } @property --shape-bevel { syntax: "*"; }');
    assert.deepEqual([...got].sort(), ['--color-a', '--shape-bevel']);
  });

  it('collects JS-set custom properties', () => {
    const got = declaredInJs(`el.style.setProperty('--color-live', v); const s = { '--size-x': '1px' };`);
    assert.deepEqual([...got].sort(), ['--color-live', '--size-x']);
  });

  it('families: first segment, private names have none', () => {
    assert.equal(familyOf('--color-text-muted'), 'color');
    assert.equal(familyOf('--_callout-bg'), null);
  });

  it('references report fallback and skip ignored lines', () => {
    const refs = references(`a { color: var(--color-x); }\nb { color: var( --color-y , red); }\nc { color: var(--color-z); } /* undefined-token-ok */`);
    assert.deepEqual(refs.map((r) => [r.token, r.line, r.hasFallback]), [
      ['--color-x', 1, false],
      ['--color-y', 2, true],
    ]);
  });

  it('recognises theme and pack files', () => {
    assert.ok(isThemeFile('src/tokens/themes/_extreme-magna.css'));
    assert.ok(isThemeFile('src/packs/journal/journal.effects.css'));
    assert.ok(!isThemeFile('src/shapes/badges.css'));
  });
});

describe('lintTokens', () => {
  it('fails on the --color-on-primary regression (defined only by a theme)', () => {
    const { errors } = lintTokens({
      tokenCss: [TOKENS],
      css: [
        { file: 'src/tokens/themes/_extreme-magna.css', text: '[data-theme~="magna"] { --color-on-primary: white; color: var(--color-on-primary); }' },
        { file: 'src/shapes/bubbles.css', text: '[data-bubble="outgoing"] { color: var(--color-on-primary); }' },
      ],
    });
    assert.deepEqual(errors.map((e) => [e.file, e.token]), [['src/shapes/bubbles.css', '--color-on-primary']]);
  });

  it('passes defined tokens, private helpers and unknown families', () => {
    const { errors, warnings } = lintTokens({
      tokenCss: [TOKENS],
      css: [{
        file: 'src/shapes/callouts.css',
        text: `[data-callout] {
          --_callout-bg: var(--callout-bg, var(--color-primary));
          background: var(--_callout-bg);
          color: var(--color-text-on-primary);
          padding: var(--size-m);
          inline-size: var(--chat-width);
        }`,
      }],
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
  });

  it('a component may define its own core-family token', () => {
    const { errors } = lintTokens({
      tokenCss: [TOKENS],
      css: [
        { file: 'src/web-components/x/styles.css', text: 'x-el { --color-x-accent: red; border-color: var(--color-x-accent); }' },
      ],
    });
    assert.deepEqual(errors, []);
  });

  it('a token set from JS counts as defined', () => {
    const { errors } = lintTokens({
      tokenCss: [TOKENS],
      css: [{ file: 'src/a.css', text: 'a { color: var(--color-live); }' }],
      js: [`el.style.setProperty('--color-live', 'red')`],
    });
    assert.deepEqual(errors, []);
  });

  it('a fallback turns an undefined core token into a warning', () => {
    const { errors, warnings } = lintTokens({
      tokenCss: [TOKENS],
      css: [{ file: 'src/a.css', text: 'a { outline-color: var(--color-focus, blue); }' }],
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings.map((w) => w.token), ['--color-focus']);
  });
});
