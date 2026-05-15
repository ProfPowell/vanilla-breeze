/**
 * text-diff: line-level LCS diff helper + change-set fragment renderer.
 *
 * Promoted from `<version-switcher>`'s private _diff.js so any author
 * can compose runtime text diffs into a `<change-set>` without going
 * through the version-switcher.
 *
 * See `/docs/concepts/diff-display/` for the recipe that explains when
 * to reach for this helper vs the existing diff-shaped primitives
 * (`<change-set>` for authored markup, `<compare-surface>` for image
 * before/after, `<review-surface>` for editorial review,
 * `<version-switcher data-action="diff">` for page-version diffs).
 *
 * Markup-aware diffing is intentionally out of scope — for prose-level
 * use cases the line-level LCS is good enough up to the low thousands
 * of lines. For richer use cases, post-process the ops yourself or
 * compose with a dedicated diff library.
 *
 * @example Build a diff inside <change-set> from two strings
 *   import { diffLines, renderDiffFragment } from '/src/utils/text-diff.js';
 *
 *   const ops = diffLines(oldText, newText);
 *   const cs = document.createElement('change-set');
 *   cs.appendChild(renderDiffFragment(ops));
 *   document.body.appendChild(cs);
 *   // <change-set> renders tracking / final / original view toggles automatically
 */

/**
 * @param {string} oldText
 * @param {string} newText
 * @returns {{ type: 'eq' | 'add' | 'del', text: string }[]}
 */
export function diffLines(oldText, newText) {
  const oldLines = String(oldText ?? '').split('\n');
  const newLines = String(newText ?? '').split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS-length table.
  const lcs = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to construct ops.
  const ops = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      ops.unshift({ type: 'eq', text: oldLines[i - 1] });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      ops.unshift({ type: 'add', text: newLines[j - 1] });
      j -= 1;
    } else {
      ops.unshift({ type: 'del', text: oldLines[i - 1] });
      i -= 1;
    }
  }

  return ops;
}

/**
 * Render a diff op list into a DocumentFragment suitable for mounting
 * inside a <change-set>. Each op becomes one line: equal lines are
 * unwrapped text, deletes get <del>, adds get <ins>. Wrapped in a <pre>
 * so newlines are preserved without extra block flow.
 *
 * @param {ReturnType<typeof diffLines>} ops
 * @returns {DocumentFragment}
 */
export function renderDiffFragment(ops) {
  const frag = document.createDocumentFragment();
  const pre = document.createElement('pre');
  pre.className = 'text-diff';

  for (const op of ops) {
    if (op.type === 'eq') {
      pre.appendChild(document.createTextNode(`${op.text}\n`));
    } else if (op.type === 'add') {
      const ins = document.createElement('ins');
      ins.textContent = `${op.text}\n`;
      pre.appendChild(ins);
    } else if (op.type === 'del') {
      const del = document.createElement('del');
      del.textContent = `${op.text}\n`;
      pre.appendChild(del);
    }
  }

  frag.appendChild(pre);
  return frag;
}
