/**
 * text-diff is public API: the guide tells authors to import diffLines and
 * renderDiffFragment from the package, so every entry must re-export them.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diffLines } from '../../src/utils/text-diff.js';

test('diffLines reports kept, removed and added lines in order', () => {
  assert.deepEqual(diffLines('a\nb\nc', 'a\nx\nc'), [
    { type: 'eq', text: 'a' },
    { type: 'del', text: 'b' },
    { type: 'add', text: 'x' },
    { type: 'eq', text: 'c' },
  ]);
});

for (const entry of ['src/main.js', 'src/main-core.js', 'src/main-autoload.js']) {
  test(`${entry} exports diffLines and renderDiffFragment`, () => {
    assert.match(
      readFileSync(entry, 'utf8'),
      /^export \{ diffLines, renderDiffFragment \} from '\.\/utils\/text-diff\.js';$/m,
    );
  });
}
