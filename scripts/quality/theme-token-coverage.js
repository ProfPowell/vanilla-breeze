/**
 * Theme Token Coverage Auditor
 *
 * Checks that each theme's mode variants (dark/light) define all required
 * design tokens, either directly in the variant block or inherited from
 * the base theme block.
 *
 * Tier-aware auditing:
 *   - core:          personality + a11y themes, bundled in core CSS
 *   - accent:        OKLCH inline-only presets — should NOT have CSS files
 *   - showcase:      on-demand CSS, must have full surface/text/border tokens
 *   - community:     on-demand CSS, must have full surface/text/border tokens
 *   - accessibility: must have complete coverage in all mode variants
 *
 * Token naming enforcement:
 *   Flags any custom property declaration that doesn't match a recognised
 *   pattern (public contract, --theme-*, --_<name>-*, bridge tokens, etc.)
 *
 * Usage:  node scripts/quality/theme-token-coverage.js
 * Exit:   0 if all themes pass, 1 if any critical gaps found
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const THEMES_DIR = join(__dirname, "../../src/tokens/themes");

// ── Theme Registry (inline) ───────────────────────────────────────────
// We import the registry dynamically so the auditor stays self-contained
// even when run outside the site build.
let REGISTRY = [];
try {
  const registryPath = join(__dirname, "../../site/data/themeRegistry.js");
  const mod = await import(registryPath);
  REGISTRY = mod.default ?? [];
} catch {
  // Fallback: continue without registry — skip tier checks
  console.warn("⚠  Could not load themeRegistry.js — tier checks disabled\n");
}

// Build a lookup: themeId → { tier, category }
const REGISTRY_MAP = new Map();
for (const entry of REGISTRY) {
  REGISTRY_MAP.set(entry.id, { tier: entry.tier, category: entry.category });
}

// ── Required tokens ────────────────────────────────────────────────────
// Must exist in base + each variant combined.
const REQUIRED_TOKENS = [
  "--color-surface",
  "--color-surface-raised",
  "--color-surface-sunken",
  "--color-surface-alt",
  "--color-background",
  "--color-text",
  "--color-text-muted",
  "--color-border",
  "--color-border-strong",
  "--color-border-muted",
  "--shadow-sm",
  "--shadow-md",
];

// ── Mode-sensitive token detection ────────────────────────────────────
// Instead of listing individual tokens, we detect mode-sensitivity by
// PREFIX.  Any token matching these prefixes contains color or shadow
// information that differs between light and dark modes.  If a theme
// defines such a token in its BASE block with a hardcoded value, mode
// variants must re-declare it.
//
// Mode-INDEPENDENT prefixes (font families, radii, spacing, durations,
// easings, border widths, sizes, measures) are NOT matched.
const MODE_SENSITIVE_PREFIXES = [
  "--color-",           // ALL color tokens (surface, text, border, primary, status, etc.)
  "--shadow-",          // ALL shadow tokens (opacity differs between modes)
  "--input-",           // Form input backgrounds/borders
  "--control-",         // Checkbox/radio borders and fills
  "--range-",           // Range slider track/thumb
  "--progress-",        // Progress bar track/fill
  "--scrollbar-",       // Scrollbar track/thumb
  "--page-bg-",         // Page background color/gradient
  "--focus-ring-",      // Focus indicator colors
  "--focus-",           // Focus state colors (legacy prefix)
  "--cb-",              // Code-block bridge tokens (syntax highlight colors)
  "--browser-window-",  // Browser-window bridge tokens (chrome colors)
  "--glass-",           // Glassmorphism opacity/blur tokens
  "--lightness-",       // OKLCH lightness seeds (differ between modes)
  "--chroma-",          // OKLCH chroma seeds (differ between modes)
];

// Tokens that look mode-sensitive by prefix but are actually
// mode-independent (they don't contain color/shadow information).
const MODE_INSENSITIVE_EXCEPTIONS = new Set([
  "--color-scheme",          // CSS keyword, not a color value
  "--input-height",          // dimension
  "--input-padding-inline",  // dimension
  "--input-radius",          // dimension
  "--input-text",            // may be mode-sensitive but typically derived
  "--input-placeholder",     // typically derived via var()
  "--control-size",          // dimension
  "--control-radius-check",  // dimension
  "--control-radius-radio",  // dimension
  "--range-track-h",         // dimension
  "--range-thumb-size",      // dimension
  "--progress-h",            // dimension
  "--shadow-sketch-offset",  // dimension, not a color
  "--cb-border-radius",      // dimension
  "--cb-font-family",        // font family, not a color
  "--cb-ui-font-family",     // font family
  "--cb-button-radius",      // dimension
  "--cb-menu-radius",        // dimension
  "--cb-margin",             // dimension
  "--cb-header-padding",     // dimension
  "--browser-window-border-radius", // dimension
  "--browser-window-font-family",   // font family
  "--browser-window-mono-font",     // font family
  "--glass-blur",            // dimension (px)
  "--glass-saturate",        // filter value, not a color
]);

/**
 * Returns true if the token name is mode-sensitive (its value likely
 * differs between light and dark modes).
 */
function isModeSensitiveToken(tokenName) {
  if (MODE_INSENSITIVE_EXCEPTIONS.has(tokenName)) return false;
  return MODE_SENSITIVE_PREFIXES.some((p) => tokenName.startsWith(p));
}

// ── Token naming patterns ─────────────────────────────────────────────
// Public contract prefixes that any theme may define
const PUBLIC_TOKEN_PREFIXES = [
  "--color-",
  "--font-",
  "--radius-",
  "--shadow-",
  "--border-",
  "--duration-",
  "--ease-",
  "--line-height-",
  "--letter-spacing-",
  "--hue-",
  "--lightness-",
  "--chroma-",
  "--text-",        // --text-heading-*, --text-body
  "--size-",        // --size-unit, --size-xs, etc.
  "--opacity-",     // opacity tokens
  "--space-",       // space tokens
  "--content-",     // --content-narrow, --content-normal, --content-wide
  "--measure-",     // --measure-narrow, --measure-normal, --measure-wide
  "--focus-",       // --focus-ring-width, --focus-ring-offset
];

// Hint tokens: --theme-*
const HINT_PREFIX = "--theme-";

// Private helpers: --_<theme>-* (underscore convention)
const PRIVATE_RE = /^--_\w+-/;

// Known bridge / extension token prefixes
const BRIDGE_PREFIXES = [
  "--cb-",               // code-block bridge
  "--browser-window-",   // browser-window bridge
  "--motion-",           // motion extension
  "--surface-",          // surface extension
  "--glass-",            // glassmorphism extension
  "--glow-",             // glow/neon effects
  "--page-bg-",          // page background gradient
  "--control-",          // form control tokens
  "--input-",            // form input tokens
  "--range-",            // range slider tokens
  "--progress-",         // progress bar tokens
  "--scrollbar-",        // scrollbar customization
  "--cursor-custom-",    // cursor override tokens
  "--word-",             // word-spacing etc.
  "--filter-",           // filter tokens (e.g. --filter-rough)
  "--shape-",            // shape tokens (e.g. --shape-depth, --shape-bevel)
];

/**
 * Returns true if the token name matches any known naming pattern.
 */
function isRecognisedToken(tokenName) {
  // Public contract
  for (const prefix of PUBLIC_TOKEN_PREFIXES) {
    if (tokenName.startsWith(prefix)) return true;
  }
  // Hint tokens
  if (tokenName.startsWith(HINT_PREFIX)) return true;
  // Private helpers
  if (PRIVATE_RE.test(tokenName)) return true;
  // Bridge / extension tokens
  for (const prefix of BRIDGE_PREFIXES) {
    if (tokenName.startsWith(prefix)) return true;
  }
  return false;
}

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

/**
 * Extract tokens WITH their values from a CSS block string.
 * Returns a Map of tokenName → value (trimmed, first occurrence wins).
 */
function extractTokenValues(blockContent) {
  const tokens = new Map();
  // Match: --token-name: <value until ; or } or next --prop>
  const re = /(--[\w-]+)\s*:\s*([^;{}]+)/g;
  let match;
  while ((match = re.exec(blockContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    if (!tokens.has(name)) tokens.set(name, value);
  }
  return tokens;
}

/**
 * Determine if a CSS value is "hardcoded" (mode-sensitive) vs "derived"
 * (mode-safe).  Derived values adapt automatically when upstream tokens
 * change in a mode variant.
 *
 * Mode-safe patterns:
 *   - `var(--other-token)` or `var(--other-token, fallback)` — re-resolves
 *   - `oklch(from var(…) …)` — relative color syntax, derives from another token
 *   - `none`, `initial`, `inherit`, `unset`, `revert` — mode-independent keywords
 *   - `transparent` — mode-independent
 *   - Pure numbers, lengths, or zero values — mode-independent
 */
function isHardcodedValue(value) {
  const v = value.trim().toLowerCase();
  // CSS keywords that are mode-independent
  if (/^(none|initial|inherit|unset|revert|revert-layer|transparent|auto|0)$/.test(v)) return false;
  // Pure var() reference (may include fallback) — derived
  if (/^var\(/.test(v)) return false;
  // Relative color syntax: oklch(from var(...) ...) — derived
  if (/oklch\(\s*from\s+var\(/.test(v)) return false;
  // If it contains oklch(), rgb(), hsl(), hex, or named colors — hardcoded
  if (/oklch\(|rgb|hsl|#[0-9a-f]/i.test(v)) return true;
  // Shadow values with color components — hardcoded
  if (/\d+px.*oklch|0\s+\d/i.test(v)) return true;
  // Everything else (e.g., pure var() already caught, numbers, etc.) — safe
  return false;
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

// ── File-to-tier mapping ──────────────────────────────────────────────

/**
 * Attempt to map a CSS theme file name to a registry ID so we can look
 * up its tier.  File naming convention:
 *   _brand-{id}.css     → core personality
 *   _access-{id}.css    → core accessibility (id prefixed with a11y-)
 *   _extreme-{id}.css   → showcase or community
 */
function fileToRegistryId(fileName) {
  const base = fileName.replace(/^_/, "").replace(/\.css$/, "");
  // _brand-modern → modern
  if (base.startsWith("brand-")) return base.slice("brand-".length);
  // _access-high-contrast → a11y-high-contrast
  if (base.startsWith("access-")) return `a11y-${base.slice("access-".length)}`;
  // _extreme-swiss → swiss
  if (base.startsWith("extreme-")) return base.slice("extreme-".length);
  return base;
}

// ── Check for accent themes with CSS files ────────────────────────────

/**
 * Accent themes should be inline-only (no CSS file in themes dir).
 * Returns an array of warning strings.
 */
function checkAccentThemeFiles(themeFiles) {
  const warnings = [];
  for (const file of themeFiles) {
    const id = fileToRegistryId(file);
    const info = REGISTRY_MAP.get(id);
    if (info && info.tier === "accent") {
      warnings.push(
        `Accent theme "${id}" has CSS file (${file}) — accent themes should be inline-only`
      );
    }
  }
  return warnings;
}

/**
 * Check for accent themes that are registered but lack expected inline-only status.
 * Also check for showcase/community themes missing CSS files.
 */
async function checkMissingCssFiles(themeFiles) {
  const warnings = [];
  const existingIds = new Set(themeFiles.map(fileToRegistryId));

  for (const [id, info] of REGISTRY_MAP) {
    if (info.tier === "accent" || (info.tier === "core" && info.category === "personality" && id === "default")) {
      // Accent themes and the default personality should NOT have CSS files — skip
      continue;
    }
    // Pack-backed themes live in src/packs/, not src/tokens/themes/ — skip
    if (["memphis", "retro"].includes(id)) continue;
    if (info.tier === "showcase" || info.tier === "community") {
      if (!existingIds.has(id)) {
        warnings.push(
          `${info.tier} theme "${id}" is in registry but has no CSS file`
        );
      }
    }
  }
  return warnings;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const allFiles = (await readdir(THEMES_DIR)).sort();
  const themeFiles = allFiles
    .filter((f) => f.endsWith(".css") && f.startsWith("_") && !f.includes("template"));

  let totalThemes = 0;
  let themesWithGaps = 0;
  let totalWarnings = 0;
  const report = [];

  // ── Phase 1: Tier-level structural checks ───────────────────────────
  const accentWarnings = REGISTRY_MAP.size > 0 ? checkAccentThemeFiles(themeFiles) : [];
  const missingWarnings = REGISTRY_MAP.size > 0 ? await checkMissingCssFiles(themeFiles) : [];

  // ── Phase 2: Per-file token auditing ────────────────────────────────
  for (const file of themeFiles) {
    const css = await readFile(join(THEMES_DIR, file), "utf-8");
    const themeName = extractThemeName(css);
    if (!themeName) continue;

    totalThemes++;

    const registryId = fileToRegistryId(file);
    const registryInfo = REGISTRY_MAP.get(registryId);
    const tier = registryInfo?.tier ?? "unknown";
    const category = registryInfo?.category ?? "unknown";

    // Build selector patterns for this theme
    const baseSelector = `data-theme~="${themeName}"]`;
    const darkSelector = `data-theme~="${themeName}"][data-mode="dark"]`;
    const lightSelector = `data-theme~="${themeName}"][data-mode="light"]`;

    const hasDark = css.includes(darkSelector);
    const hasLight = css.includes(lightSelector);

    // Extract all tokens in the file for naming checks
    const allTokensInFile = extractTokens(css);
    const nonStandardTokens = [];
    for (const token of allTokensInFile) {
      if (!isRecognisedToken(token)) {
        nonStandardTokens.push(token);
      }
    }

    // Token coverage checks (existing logic)
    const baseBlockContent = extractBaseBlockContent(css, themeName);
    const baseTokens = extractTokens(baseBlockContent);
    const gaps = [];

    // Determine required tokens based on tier
    // Accessibility themes must have full coverage
    // Showcase/community (full-surface themes) must have full coverage
    // Core personality themes must have full coverage
    const requiredTokens = REQUIRED_TOKENS;

    if (hasDark) {
      const darkContent = extractBlocks(css, darkSelector);
      const darkTokens = extractTokens(darkContent);
      const combined = new Set([...baseTokens, ...darkTokens]);
      const missing = requiredTokens.filter((t) => !combined.has(t));
      if (missing.length > 0) {
        gaps.push({ mode: "dark", missing });
      }
    }

    if (hasLight) {
      const lightContent = extractBlocks(css, lightSelector);
      const lightTokens = extractTokens(lightContent);
      const combined = new Set([...baseTokens, ...lightTokens]);
      const missing = requiredTokens.filter((t) => !combined.has(t));
      if (missing.length > 0) {
        gaps.push({ mode: "light", missing });
      }
    }

    // Mode-sensitive token inheritance: if the base defines any
    // mode-sensitive token (detected by prefix) with a HARDCODED value
    // (not derived from var() or relative color syntax), mode variants
    // must re-declare them — otherwise base values leak across modes.
    //
    // Derived values like `oklch(from var(--color-primary) ...)` or
    // pure `var()` references auto-adapt when upstream tokens change
    // in a variant, so they don't need re-declaration.
    const baseTokenValues = extractTokenValues(baseBlockContent);
    const baseSensitive = [...baseTokenValues.keys()].filter(
      (t) => isModeSensitiveToken(t) && isHardcodedValue(baseTokenValues.get(t))
    );
    if (baseSensitive.length > 0) {
      if (hasDark) {
        const darkContent = extractBlocks(css, darkSelector);
        const darkTokens = extractTokens(darkContent);
        const missing = baseSensitive.filter((t) => !darkTokens.has(t));
        if (missing.length > 0) {
          gaps.push({ mode: "dark (mode-sensitive)", missing });
        }
      }
      if (hasLight) {
        const lightContent = extractBlocks(css, lightSelector);
        const lightTokens = extractTokens(lightContent);
        const missing = baseSensitive.filter((t) => !lightTokens.has(t));
        if (missing.length > 0) {
          gaps.push({ mode: "light (mode-sensitive)", missing });
        }
      }
    }

    // For accessibility themes: if no mode variants exist but theme is
    // a11y, verify that base block covers all required tokens
    if (category === "accessibility" && !hasDark && !hasLight) {
      const missing = requiredTokens.filter((t) => !baseTokens.has(t));
      // a11y themes may intentionally skip surface tokens (e.g., large-text
      // only adjusts sizing). Only flag if the theme defines ANY color tokens.
      const definesColorTokens = [...baseTokens].some((t) => t.startsWith("--color-"));
      if (missing.length > 0 && definesColorTokens) {
        gaps.push({ mode: "base", missing });
      }
    }

    // If no mode variants and not a11y, nothing to audit for token coverage
    // (base-only theme is fine)
    const hasTokenGaps = gaps.length > 0;
    const hasNamingIssues = nonStandardTokens.length > 0;

    if (hasTokenGaps) themesWithGaps++;
    if (hasNamingIssues) totalWarnings += nonStandardTokens.length;

    const entry = {
      file,
      themeName,
      registryId,
      tier,
      category,
      status: hasTokenGaps ? "gap" : "ok",
      gaps: hasTokenGaps ? gaps : undefined,
      nonStandardTokens: hasNamingIssues ? nonStandardTokens : undefined,
      note: !hasDark && !hasLight && !hasTokenGaps ? "base only (no variants)" : undefined,
    };

    if (!hasTokenGaps && (hasDark || hasLight)) {
      entry.note = "all variants covered";
    }

    report.push(entry);
  }

  // ── Print report ───────────────────────────────────────────────────
  console.log();
  console.log(`${BOLD}Theme Token Coverage Report${RESET}`);
  console.log(`${"─".repeat(60)}`);
  console.log(`${DIM}Required tokens: ${REQUIRED_TOKENS.join(", ")}${RESET}`);
  console.log(`${"─".repeat(60)}`);
  console.log();

  // ── Tier structural warnings ────────────────────────────────────────
  if (accentWarnings.length > 0 || missingWarnings.length > 0) {
    console.log(`${BOLD}Tier Structure Checks${RESET}`);
    console.log();
    for (const w of accentWarnings) {
      console.log(`  ${RED}WARN${RESET} ${w}`);
    }
    for (const w of missingWarnings) {
      console.log(`  ${YELLOW}WARN${RESET} ${w}`);
    }
    console.log();
    console.log(`${"─".repeat(60)}`);
    console.log();
  }

  // ── Per-theme results ───────────────────────────────────────────────
  console.log(`${BOLD}Per-Theme Results${RESET}`);
  console.log();

  for (const entry of report) {
    const tierTag = entry.tier !== "unknown"
      ? ` ${DIM}[${entry.tier}]${RESET}`
      : "";

    if (entry.status === "ok" && !entry.nonStandardTokens) {
      const note = entry.note ? ` ${DIM}(${entry.note})${RESET}` : "";
      console.log(`  ${GREEN}PASS${RESET} ${entry.themeName}${tierTag}${note}`);
    } else if (entry.status === "ok" && entry.nonStandardTokens) {
      console.log(`  ${YELLOW}WARN${RESET} ${entry.themeName}${tierTag}`);
      console.log(
        `       ${DIM}Non-standard tokens (${entry.nonStandardTokens.length}):${RESET} ${entry.nonStandardTokens.join(", ")}`
      );
    } else {
      console.log(`  ${RED}FAIL${RESET} ${entry.themeName}${tierTag}`);
      for (const gap of entry.gaps ?? []) {
        console.log(
          `       ${RED}${gap.mode}${RESET} missing: ${gap.missing.join(", ")}`
        );
      }
      if (entry.nonStandardTokens) {
        console.log(
          `       ${YELLOW}Non-standard tokens (${entry.nonStandardTokens.length}):${RESET} ${entry.nonStandardTokens.join(", ")}`
        );
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────
  console.log();
  console.log(`${"─".repeat(60)}`);
  console.log(`${BOLD}Summary${RESET}`);
  console.log(`  Themes scanned:         ${totalThemes}`);
  console.log(`  Tier checks:            ${accentWarnings.length + missingWarnings.length} warning(s)`);
  console.log(`  Token coverage gaps:    ${themesWithGaps} theme(s)`);
  console.log(`  Non-standard tokens:    ${totalWarnings} warning(s)`);

  const passCount = report.filter((e) => e.status === "ok" && !e.nonStandardTokens).length;
  const warnCount = report.filter((e) => e.status === "ok" && e.nonStandardTokens).length;
  const failCount = report.filter((e) => e.status !== "ok").length;

  console.log();
  console.log(`  ${GREEN}PASS${RESET} ${passCount}  ${YELLOW}WARN${RESET} ${warnCount}  ${RED}FAIL${RESET} ${failCount}`);

  if (themesWithGaps > 0) {
    console.log();
    console.log(`  ${RED}${BOLD}Critical gaps found — ${themesWithGaps} theme(s) missing required tokens${RESET}`);
    console.log();
    process.exit(1);
  } else {
    console.log();
    console.log(`  ${GREEN}${BOLD}All themes pass token coverage — no critical gaps${RESET}`);
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
