/**
 * Line-level LCS diff for version-switcher's diff action.
 *
 * Returns an array of operations:
 *   { type: 'eq' | 'add' | 'del', text: string }
 *
 * Markup-aware diffing is the plan's open question for a future phase
 * (admin/r-n-d/version-switcher.md). Phase 2 ships line-level only —
 * splits textContent on \n and computes the longest-common-subsequence,
 * good enough for typical doc-page sizes (~hundreds of lines).
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
 * Render a diff op list into a DOM fragment suitable for mounting inside
 * a <change-set>. Each op becomes one line: equal lines unwrapped, deletes
 * wrapped in <del>, adds wrapped in <ins>. Wrapped in a <pre> so newlines
 * are preserved without extra block flow.
 *
 * @param {ReturnType<typeof diffLines>} ops
 * @returns {DocumentFragment}
 */
export function renderDiffFragment(ops) {
  const frag = document.createDocumentFragment();
  const pre = document.createElement('pre');
  pre.className = 'version-switcher-diff';

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
