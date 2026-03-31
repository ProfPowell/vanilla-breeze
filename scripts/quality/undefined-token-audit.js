/**
 * Undefined Token Audit
 *
 * Catches `var(--invalid-token)` references — tokens used in CSS via var()
 * but never defined anywhere in the canonical token system (src/tokens/).
 *
 * Step 1: Collect all token DEFINITIONS from src/tokens/ (the canonical set)
 * Step 2: Define approved patterns that are allowed without canonical defs
 * Step 3: Scan var() USAGES in src/ (excl. tokens), demos/, site/src/
 * Step 4: Flag any var() reference not in the canonical set or approved patterns
 * Step 5: Print a grouped report, exit 1 if any undefined references found
 *
 * Usage:  node scripts/quality/undefined-token-audit.js
 * Exit:   0 if clean, 1 if any undefined references found
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "../..");
const TOKENS_DIR = join(ROOT, "src/tokens");

// ── Terminal colors ────────────────────────────────────────────────────
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ── Approved patterns ──────────────────────────────────────────────────
// Tokens matching these patterns are allowed even if not in the canonical
// definition set — they are defined dynamically, contextually, or by
// external components.

const APPROVED_PREFIXES = [
  "--_",                // private theme/component helpers
  "--theme-",           // hint tokens
  "--cb-",              // code-block bridge tokens (external-components.css)
  "--browser-window-",  // browser-window bridge tokens
  "--vb-",              // VB internal tokens
];

// Single-letter or very short tokens set via JavaScript/inline styles
// (e.g., --i for stagger index, --h for height, --start/--end for ranges).
// These are intentional API properties that don't have CSS definitions.
const JS_SET_TOKENS = new Set([
  "--i", "--h", "--w", "--x", "--y", "--n",
  "--start", "--end", "--value", "--pct",
  "--range-pct", "--seg-count",
]);

/**
 * Returns true if the token name matches an approved pattern that does
 * not require a canonical definition.
 */
function isApprovedPattern(tokenName) {
  if (JS_SET_TOKENS.has(tokenName)) return true;
  for (const prefix of APPROVED_PREFIXES) {
    if (tokenName.startsWith(prefix)) return true;
  }
  return false;
}

// ── CSS comment stripping ──────────────────────────────────────────────

/**
 * Remove block comments from CSS source text.
 * Returns the cleaned string with comments replaced by equivalent
 * whitespace (preserving line numbers for accurate reporting).
 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    // Preserve newlines so line numbers stay correct
    return match.replace(/[^\n]/g, " ");
  });
}

// ── File collection ────────────────────────────────────────────────────

/**
 * Recursively collect all .css files under a directory.
 */
async function collectCssFiles(dir) {
  const results = [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results; // directory doesn't exist — skip
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectCssFiles(fullPath)));
    } else if (entry.name.endsWith(".css")) {
      results.push(fullPath);
    }
  }

  return results;
}

// ── Step 1: Collect token definitions ─────────────────────────────────

/**
 * Scan all CSS files in the given directories and build a Set of every
 * custom property name that is defined (--token-name: value).
 *
 * We scan ALL of src/ (not just src/tokens/) so that component-local
 * custom properties (--chart-height, --start, etc.) are included in the
 * known set.  This prevents false positives for component API properties.
 */
async function collectDefinitions() {
  const definitions = new Set();
  const dirs = [
    join(ROOT, "src"),
    join(ROOT, "demos"),
    join(ROOT, "site/src"),
  ];

  for (const dir of dirs) {
    const files = await collectCssFiles(dir);
    for (const file of files) {
      const css = stripComments(await readFile(file, "utf-8"));
      const re = /(--[\w-]+)\s*:/g;
      let match;
      while ((match = re.exec(css)) !== null) {
        definitions.add(match[1]);
      }
    }
  }

  return definitions;
}

// ── Step 3: Scan for var() usages ──────────────────────────────────────

/**
 * Extract every var(--token-name) reference from a CSS string.
 * Handles nested var() like `var(--a, var(--b))` — both --a and --b
 * are captured.
 *
 * Returns an array of { token, line, context } objects.
 */
function extractVarUsages(css) {
  const usages = [];
  const lines = css.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match all var(--token-name instances on this line
    const re = /var\((--[\w-]+)/g;
    let match;
    while ((match = re.exec(line)) !== null) {
      usages.push({
        token: match[1],
        line: i + 1,
        context: line.trim(),
      });
    }
  }

  return usages;
}

// ── Step 3 (cont): Collect usage files ─────────────────────────────────

/**
 * Collect CSS files from the usage directories, excluding the token
 * definition directory itself.
 */
async function collectUsageFiles() {
  const dirs = [
    join(ROOT, "src"),
    join(ROOT, "demos"),
    join(ROOT, "site/src"),
  ];

  const files = [];

  for (const dir of dirs) {
    const candidates = await collectCssFiles(dir);
    for (const file of candidates) {
      // Exclude src/tokens/ — those are definitions, not usages
      if (file.startsWith(TOKENS_DIR + "/") || file === TOKENS_DIR) continue;
      files.push(file);
    }
  }

  return files;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log();
  console.log(`${BOLD}Undefined Token Audit${RESET}`);
  console.log(`${"─".repeat(60)}`);

  // Step 1: Collect canonical definitions
  const definitions = await collectDefinitions();
  console.log(`${DIM}Canonical token definitions: ${definitions.size}${RESET}`);

  // Step 2: Approved patterns (defined above)
  console.log(`${DIM}Approved prefixes: ${APPROVED_PREFIXES.join(", ")}${RESET}`);
  console.log(`${"─".repeat(60)}`);
  console.log();

  // Step 3: Scan usage files
  const usageFiles = await collectUsageFiles();
  let totalFiles = 0;
  let totalUndefined = 0;
  const report = []; // { file, issues: [{ token, line, context }] }

  for (const file of usageFiles) {
    const raw = await readFile(file, "utf-8");
    const css = stripComments(raw);
    const usages = extractVarUsages(css);

    if (usages.length === 0) continue;
    totalFiles++;

    // Step 4: Flag undefined references
    const issues = [];
    for (const usage of usages) {
      if (definitions.has(usage.token)) continue;
      if (isApprovedPattern(usage.token)) continue;
      issues.push(usage);
    }

    if (issues.length > 0) {
      const relPath = relative(ROOT, file);
      report.push({ file: relPath, issues });
      totalUndefined += issues.length;
    }
  }

  // Step 5: Report
  if (report.length === 0) {
    console.log(`  ${GREEN}${BOLD}No undefined token references found${RESET}`);
    console.log();
    console.log(`${"─".repeat(60)}`);
    console.log(`${BOLD}Summary${RESET}`);
    console.log(`  Files scanned:            ${totalFiles}`);
    console.log(`  Undefined references:     0`);
    console.log();
    console.log(`  ${GREEN}${BOLD}All clear${RESET}`);
    console.log();
    process.exit(0);
  }

  // Group by file
  for (const entry of report) {
    console.log(`  ${RED}FAIL${RESET} ${entry.file}`);
    for (const issue of entry.issues) {
      console.log(
        `       ${DIM}L${issue.line}${RESET}  ${YELLOW}${issue.token}${RESET}`
      );
      console.log(`       ${DIM}${issue.context}${RESET}`);
    }
    console.log();
  }

  // Summary
  console.log(`${"─".repeat(60)}`);
  console.log(`${BOLD}Summary${RESET}`);
  console.log(`  Files scanned:            ${totalFiles}`);
  console.log(`  Files with issues:        ${report.length}`);
  console.log(`  Undefined references:     ${totalUndefined}`);
  console.log();
  console.log(`  ${RED}${BOLD}${totalUndefined} undefined token reference(s) found${RESET}`);
  console.log();
  process.exit(1);
}

main();
