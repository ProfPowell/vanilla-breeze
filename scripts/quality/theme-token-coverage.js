/**
 * Theme Token Coverage Auditor
 *
 * Checks that each theme's mode variants (dark/light) define all required
 * design tokens, either directly in the variant block or inherited from
 * the base theme block.
 *
 * Usage:  node scripts/quality/theme-token-coverage.js
 * Exit:   0 if all themes pass, 1 if any critical gaps found
 */

import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const THEMES_DIR = join(__dirname, "../../src/tokens/themes");

// ── Required tokens ────────────────────────────────────────────────────
const REQUIRED_TOKENS = [
  "--color-surface",
  "--color-surface-raised",
  "--color-surface-sunken",
  "--color-background",
  "--color-text",
  "--color-text-muted",
  "--color-border",
  "--color-border-strong",
  "--shadow-sm",
  "--shadow-md",
];

// ── Terminal colors ────────────────────────────────────────────────────
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ── CSS block extraction ───────────────────────────────────────────────

/**
 * Extract the content of top-level CSS blocks that match a given selector
 * pattern.  Handles nested braces so we grab the full block even when it
 * contains nested `& :is(…) { … }` rules.
 */
function extractBlocks(css, selectorPattern) {
  const blocks = [];
  let searchFrom = 0;

  while (searchFrom < css.length) {
    const idx = css.indexOf(selectorPattern, searchFrom);
    if (idx === -1) break;

    // Find the opening brace after the selector
    const braceStart = css.indexOf("{", idx);
    if (braceStart === -1) break;

    // Walk forward counting braces to find the matching close
    let depth = 1;
    let pos = braceStart + 1;
    while (pos < css.length && depth > 0) {
      if (css[pos] === "{") depth++;
      else if (css[pos] === "}") depth--;
      pos++;
    }

    blocks.push(css.slice(braceStart + 1, pos - 1));
    searchFrom = pos;
  }

  return blocks.join("\n");
}

/**
 * Pull every custom property *definition* from a CSS block string.
 * A definition looks like `--token-name:` (with colon).
 */
function extractTokens(blockContent) {
  const tokens = new Set();
  const re = /(--[\w-]+)\s*:/g;
  let match;
  while ((match = re.exec(blockContent)) !== null) {
    tokens.add(match[1]);
  }
  return tokens;
}

// ── Theme name extraction ──────────────────────────────────────────────

/**
 * Derive the theme name from the file's base selector.
 * Looks for `data-theme~="<name>"` in the CSS.
 */
function extractThemeName(css) {
  const m = css.match(/data-theme~="([^"]+)"/);
  return m ? m[1] : null;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const files = (await readdir(THEMES_DIR))
    .filter((f) => f.endsWith(".css") && f.startsWith("_") && !f.includes("template"))
    .sort();

  let totalThemes = 0;
  let themesWithGaps = 0;
  const report = [];

  for (const file of files) {
    const css = await readFile(join(THEMES_DIR, file), "utf-8");
    const themeName = extractThemeName(css);
    if (!themeName) continue;

    totalThemes++;

    // Build selector patterns for this theme
    const baseSelector = `data-theme~="${themeName}"]`;
    const darkSelector = `data-theme~="${themeName}"][data-mode="dark"]`;
    const lightSelector = `data-theme~="${themeName}"][data-mode="light"]`;

    const hasDark = css.includes(darkSelector);
    const hasLight = css.includes(lightSelector);

    // If no mode variants at all, nothing to audit (base-only theme is fine)
    if (!hasDark && !hasLight) {
      report.push({ file, themeName, status: "ok", note: "base only (no variants)" });
      continue;
    }

    // Extract token sets
    // For the base block we need to exclude mode-variant content.  The
    // simplest approach: extract base tokens from the full file, then
    // subtract variant-only tokens.  But that's fragile.  Instead, build
    // a version of the CSS with mode blocks removed, then extract from
    // the base selector.
    const baseBlockContent = extractBaseBlockContent(css, themeName);
    const baseTokens = extractTokens(baseBlockContent);

    const gaps = [];

    if (hasDark) {
      const darkContent = extractBlocks(css, darkSelector);
      const darkTokens = extractTokens(darkContent);
      const combined = new Set([...baseTokens, ...darkTokens]);
      const missing = REQUIRED_TOKENS.filter((t) => !combined.has(t));
      if (missing.length > 0) {
        gaps.push({ mode: "dark", missing });
      }
    }

    if (hasLight) {
      const lightContent = extractBlocks(css, lightSelector);
      const lightTokens = extractTokens(lightContent);
      const combined = new Set([...baseTokens, ...lightTokens]);
      const missing = REQUIRED_TOKENS.filter((t) => !combined.has(t));
      if (missing.length > 0) {
        gaps.push({ mode: "light", missing });
      }
    }

    if (gaps.length > 0) {
      themesWithGaps++;
      report.push({ file, themeName, status: "gap", gaps });
    } else {
      report.push({ file, themeName, status: "ok", note: "all variants covered" });
    }
  }

  // ── Print report ───────────────────────────────────────────────────
  console.log();
  console.log(`${BOLD}Theme Token Coverage Report${RESET}`);
  console.log(`${"─".repeat(50)}`);
  console.log(`${DIM}Required tokens: ${REQUIRED_TOKENS.join(", ")}${RESET}`);
  console.log(`${"─".repeat(50)}`);
  console.log();

  for (const entry of report) {
    if (entry.status === "ok") {
      const note = entry.note ? ` ${DIM}(${entry.note})${RESET}` : "";
      console.log(`  ${GREEN}OK${RESET}  ${entry.themeName}${note}`);
    } else {
      console.log(`  ${RED}GAP${RESET} ${entry.themeName}`);
      for (const gap of entry.gaps ?? []) {
        console.log(
          `       ${YELLOW}${gap.mode}${RESET} missing: ${gap.missing.join(", ")}`
        );
      }
    }
  }

  console.log();
  console.log(`${"─".repeat(50)}`);
  console.log(`  Total themes scanned: ${totalThemes}`);

  if (themesWithGaps > 0) {
    console.log(`  ${RED}${BOLD}Critical gaps: ${themesWithGaps} theme(s)${RESET}`);
    console.log();
    process.exit(1);
  } else {
    console.log(`  ${GREEN}${BOLD}All themes pass — no critical gaps${RESET}`);
    console.log();
    process.exit(0);
  }
}

/**
 * Extract the base block content for a theme, excluding any mode-variant
 * blocks.  We find the first top-level block whose selector contains the
 * theme name but does NOT contain `data-mode`.
 */
function extractBaseBlockContent(css, themeName) {
  const themeAttr = `data-theme~="${themeName}"`;
  let searchFrom = 0;
  const baseChunks = [];

  while (searchFrom < css.length) {
    const idx = css.indexOf(themeAttr, searchFrom);
    if (idx === -1) break;

    // Check if this selector also has data-mode (i.e., a variant block)
    // Look backwards to the start of the selector (previous `}` or start of file)
    // and forwards to the `{`
    const braceStart = css.indexOf("{", idx);
    if (braceStart === -1) break;

    const selectorRegion = css.slice(Math.max(0, idx - 10), braceStart);
    const isVariant = selectorRegion.includes("data-mode");

    if (!isVariant) {
      // Walk forward counting braces to find the matching close
      let depth = 1;
      let pos = braceStart + 1;
      while (pos < css.length && depth > 0) {
        if (css[pos] === "{") depth++;
        else if (css[pos] === "}") depth--;
        pos++;
      }
      baseChunks.push(css.slice(braceStart + 1, pos - 1));
    }

    searchFrom = css.indexOf("{", idx);
    if (searchFrom === -1) break;
    // Skip past this block
    let depth = 1;
    searchFrom++;
    while (searchFrom < css.length && depth > 0) {
      if (css[searchFrom] === "{") depth++;
      else if (css[searchFrom] === "}") depth--;
      searchFrom++;
    }
  }

  return baseChunks.join("\n");
}

main();
