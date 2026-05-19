/**
 * Tiny CSS parser for VB theme files.
 *
 * Pulls token declarations out of the `:root[data-theme~="{slug}"]` and
 * the dark-mode override block from a single theme CSS file. Used by
 * the build (Phase 2) to emit DTCG artifacts and by the round-trip
 * regression tests.
 *
 * No DOM, no css parser dep. Walks braces to find block boundaries;
 * uses a small regex over the block body for `--name: value;`
 * declarations. Doesn't resolve `var()`, doesn't expand `light-dark()` —
 * preserves the source-literal form which is exactly what DTCG export
 * wants (the literal goes into $extensions, the resolved form into
 * $value).
 */

/**
 * Extract the body of `:root[data-theme~="{slug}"]` (without the dark-mode
 * variant). Walks braces so nested rules don't confuse the boundary.
 * Returns '' if no matching block is found.
 *
 * @param {string} css
 * @param {string} slug
 * @returns {string}
 */
export function extractBaseBlock(css, slug) {
  return findBlock(css, `data-theme~="${slug}"]`, { excludeMode: true });
}

/**
 * Extract the body of `[data-theme~="{slug}"][data-mode="dark"]` if present.
 * Returns '' if no dark override block exists.
 *
 * @param {string} css
 * @param {string} slug
 * @returns {string}
 */
export function extractDarkBlock(css, slug) {
  return findBlock(css, `data-theme~="${slug}"][data-mode="dark"]`, {});
}

/**
 * Pull `--name: value;` declarations out of a CSS block body.
 * Stops a value at the next `;`, `{`, or `}` so nested rules are skipped
 * cleanly. Brand themes don't nest token declarations; extreme themes
 * occasionally do — this handles both.
 *
 * @param {string} blockBody
 * @returns {Array<[string, string]>}
 */
export function parseDeclarations(blockBody) {
  /** @type {[string, string][]} */
  const out = [];
  const re = /(--[\w-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = re.exec(blockBody)) !== null) {
    out.push([m[1], m[2].trim()]);
  }
  return out;
}

/* ---------- internals ---------- */

function findBlock(css, selectorPattern, { excludeMode = false } = {}) {
  let searchFrom = 0;
  while (searchFrom < css.length) {
    const idx = css.indexOf(selectorPattern, searchFrom);
    if (idx === -1) return '';

    // When extracting the base block, skip variants like
    // [data-theme~="x"][data-mode="dark"] and any other compound selector.
    if (excludeMode) {
      const after = css.slice(idx + selectorPattern.length, idx + selectorPattern.length + 3);
      if (after.startsWith('[')) {
        searchFrom = idx + selectorPattern.length;
        continue;
      }
    }

    const braceStart = css.indexOf('{', idx);
    if (braceStart === -1) return '';

    let depth = 1;
    let pos = braceStart + 1;
    while (pos < css.length && depth > 0) {
      if (css[pos] === '{') depth++;
      else if (css[pos] === '}') depth--;
      pos++;
    }
    return css.slice(braceStart + 1, pos - 1);
  }
  return '';
}
