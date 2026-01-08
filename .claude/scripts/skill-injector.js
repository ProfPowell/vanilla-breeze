#!/usr/bin/env node
/**
 * Skill Injector for PostToolUse Hooks
 *
 * Detects file type from Edit/Write operations and outputs relevant skill guidance.
 * Runs BEFORE validators so Claude has context for applying standards.
 *
 * Usage: Receives hook input via stdin (JSON with tool_input.file_path)
 * Output: Condensed skill guidance to stdout
 */

import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', '.claude', 'skills');

// Map file extensions to skill names
const SKILL_MAP = {
  '.css': 'css-author',
  '.html': 'xhtml-author',
  '.xhtml': 'xhtml-author',
  '.htm': 'xhtml-author',
  '.js': 'javascript-author',
  '.mjs': 'javascript-author',
  '.md': 'markdown-author',
  // SSG file types
  '.astro': 'astro',
  '.njk': 'eleventy',
  '.liquid': 'eleventy',
  // TypeScript
  '.ts': 'typescript-author',
  '.tsx': 'typescript-author',
  '.mts': 'typescript-author',
  '.cts': 'typescript-author',
};

// Special filename patterns that override extension-based matching
const FILENAME_PATTERNS = [
  // CLI entry points
  { pattern: /bin\/.*\.js$/, skill: 'cli-author' },
  // Eleventy
  { pattern: /\.11ty\.js$/, skill: 'eleventy' },
  { pattern: /\.11ty\.cjs$/, skill: 'eleventy' },
  { pattern: /eleventy\.config\.(js|mjs|cjs)$/, skill: 'eleventy' },
  // Astro
  { pattern: /astro\.config\.(js|mjs|ts)$/, skill: 'astro' },
  // TypeScript configuration
  { pattern: /tsconfig(\..+)?\.json$/, skill: 'typescript-author' },
  // Containerization
  { pattern: /Dockerfile(\..*)?$/, skill: 'containerization' },
  { pattern: /docker-compose(\..*)?\.ya?ml$/, skill: 'containerization' },
  { pattern: /\.dockerignore$/, skill: 'containerization' },
  // Build tooling
  { pattern: /vite\.config\.(js|ts|mjs)$/, skill: 'build-tooling' },
  { pattern: /vitest\.config\.(js|ts|mjs)$/, skill: 'vitest' },
  // Environment config
  { pattern: /\.env(\..+)?$/, skill: 'env-config' },
  // CI/CD
  { pattern: /\.github\/workflows\/.*\.ya?ml$/, skill: 'ci-cd' },
  // Database
  { pattern: /migrations?\/.*\.(js|ts|sql)$/, skill: 'database' },
  { pattern: /seeds?\/.*\.(js|ts)$/, skill: 'database' },
  // Metadata
  { pattern: /robots\.txt$/, skill: 'metadata' },
  { pattern: /sitemap\.xml$/, skill: 'metadata' },
  { pattern: /manifest\.json$/, skill: 'performance' },
  // Security
  { pattern: /security\.txt$/, skill: 'security' },
];

// TDD detection for new testable files
const TDD_DETECTION = {
  testablePatterns: [
    /^src\//,
    /^lib\//,
    /^components\//,
    /^services\//,
    /^scripts\//,
    /\.claude\/scripts\//
  ],
  skipPatterns: [
    /\.config\.(js|ts|mjs|cjs)$/,
    /\.d\.ts$/,
    /\.(test|spec)\.(js|ts|mjs|mts)$/,
    /\.generated\./,
    /\.g\.ts$/,
    /^dist\//,
    /^build\//,
    /node_modules\//,
    /fixtures?\//,
    /__mocks__\//,
    /^(index|main)\.(js|ts|mjs|mts)$/
  ],
  testableExtensions: ['.js', '.ts', '.mjs', '.mts', '.cjs', '.cts'],

  isTestableFile(filePath) {
    const ext = extname(filePath).toLowerCase();
    const basename = filePath.split('/').pop();

    // Check extension
    if (!this.testableExtensions.includes(ext)) return false;

    // Check skip patterns
    for (const pattern of this.skipPatterns) {
      if (pattern.test(filePath) || pattern.test(basename)) return false;
    }

    // Check testable patterns
    for (const pattern of this.testablePatterns) {
      if (pattern.test(filePath)) return true;
    }

    return false;
  },

  getTestPath(filePath) {
    // .claude/scripts/foo.js -> .claude/test/validators/foo.test.js
    if (filePath.includes('.claude/scripts/')) {
      const basename = filePath.split('/').pop();
      const name = basename.replace(/\.(js|ts|mjs|mts)$/, '');
      const ext = basename.match(/\.(js|ts|mjs|mts)$/)?.[0] || '.js';
      return `.claude/test/validators/${name}.test${ext}`;
    }

    // src/foo.js -> test/foo.test.js
    const ext = extname(filePath);
    const withoutExt = filePath.replace(ext, '');
    const relativePath = withoutExt.replace(/^src\//, '');
    return `test/${relativePath}.test${ext}`;
  }
};

// Content patterns that trigger supplementary skills
// These are checked against file content to suggest additional relevant skills
const CONTENT_PATTERNS = [
  // HTML content patterns
  { pattern: /<form[\s>]/i, skill: 'forms', reason: 'Form detected - use <form-field> pattern' },
  { pattern: /<x-icon|lucide-|icon/i, skill: 'icons', reason: 'Icon pattern detected - use <x-icon> component' },
  { pattern: /<picture[\s>]/i, skill: 'responsive-images', reason: 'Picture element detected' },
  { pattern: /<img[\s>]/i, skill: 'responsive-images', reason: 'Image detected - consider responsive patterns' },
  { pattern: /<nav[\s>]/i, skill: 'accessibility-checker', reason: 'Navigation detected - ensure aria-label' },
  { pattern: /<table[\s>]/i, skill: 'accessibility-checker', reason: 'Table detected - ensure proper headers' },
  { pattern: /<meta\s/i, skill: 'metadata', reason: 'Metadata detected' },
  { pattern: /lang=/i, skill: 'i18n', reason: 'Language attribute detected' },

  // JavaScript content patterns
  { pattern: /parseArgs|process\.argv/i, skill: 'cli-author', reason: 'CLI argument parsing detected' },
  { pattern: /class\s+\w+\s+extends\s+HTMLElement/i, skill: 'custom-elements', reason: 'Web Component detected' },
  { pattern: /fetch\s*\(/i, skill: 'api-client', reason: 'Fetch API detected - add retry/error handling' },
  { pattern: /localStorage|sessionStorage|IndexedDB/i, skill: 'data-storage', reason: 'Storage API detected' },
  { pattern: /describe\s*\(|it\s*\(|test\s*\(/i, skill: 'unit-testing', reason: 'Test file detected' },
  { pattern: /express\(\)|fastify\(\)/i, skill: 'nodejs-backend', reason: 'Server framework detected' },
  { pattern: /router\.(get|post|put|delete|patch)/i, skill: 'rest-api', reason: 'REST endpoint detected' },
  { pattern: /jwt\.sign|jwt\.verify/i, skill: 'authentication', reason: 'JWT detected' },

  // CSS content patterns
  { pattern: /@keyframes|animation:/i, skill: 'animation-motion', reason: 'Animation detected - check reduced-motion' },
  { pattern: /@media\s+print/i, skill: 'print-styles', reason: 'Print styles detected' },
  { pattern: /@media\s*\(\s*prefers-reduced-motion/i, skill: 'animation-motion', reason: 'Motion preference detected' },
  { pattern: /font-size:|line-height:|text-wrap:|font-family:/i, skill: 'typography', reason: 'Typography detected - consider type scale and rhythm' },
  { pattern: /grid-template|auto-fit|auto-fill|minmax\(/i, skill: 'layout-grid', reason: 'Grid layout detected - use fluid scaling patterns' },
];

/**
 * Extract key sections from skill content (first 2 major sections after frontmatter)
 */
function extractSkillSummary(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let passedFrontmatter = false;
  const summary = [];
  let sectionCount = 0;

  for (const line of lines) {
    // Handle frontmatter
    if (line === '---' && !passedFrontmatter) {
      inFrontmatter = !inFrontmatter;
      if (!inFrontmatter) passedFrontmatter = true;
      continue;
    }
    if (inFrontmatter) continue;

    // Count sections (## headings)
    if (line.startsWith('## ')) {
      sectionCount++;
      if (sectionCount > 2) break; // Stop after 2 sections
    }

    summary.push(line);
  }

  return summary.join('\n').trim();
}

/**
 * Extract a brief excerpt from skill content (3-5 key points)
 * Used for supplementary skill suggestions
 */
function extractSkillExcerpt(content) {
  const lines = content.split('\n');
  let inFrontmatter = false;
  let passedFrontmatter = false;
  const excerpt = [];
  let inList = false;
  let listItems = 0;
  let foundFirstSection = false;

  for (const line of lines) {
    // Handle frontmatter
    if (line === '---' && !passedFrontmatter) {
      inFrontmatter = !inFrontmatter;
      if (!inFrontmatter) passedFrontmatter = true;
      continue;
    }
    if (inFrontmatter) continue;

    // Skip until we find first ## section
    if (!foundFirstSection) {
      if (line.startsWith('## ')) {
        foundFirstSection = true;
        excerpt.push(line);
      }
      continue;
    }

    // Stop at second ## section
    if (line.startsWith('## ') && excerpt.length > 1) {
      break;
    }

    // Collect list items (up to 5)
    if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
      if (listItems < 5) {
        excerpt.push(line);
        listItems++;
        inList = true;
      }
    } else if (line.startsWith('|') && excerpt.length < 8) {
      // Include table rows (for quick reference tables)
      excerpt.push(line);
    } else if (!inList && excerpt.length < 6) {
      // Include non-list content up to a limit
      excerpt.push(line);
    }
  }

  return excerpt.join('\n').trim();
}

/**
 * Load supplementary skill excerpt
 */
function loadSkillExcerpt(skillName, reason) {
  const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');

  try {
    const content = readFileSync(skillPath, 'utf-8');
    const excerpt = extractSkillExcerpt(content);

    return `
--- Also consider: ${skillName} ---
${reason}

${excerpt}
`;
  } catch {
    return `\n--- Also consider: ${skillName} ---\n${reason}\n`;
  }
}

/**
 * Load and format skill guidance
 */
function loadSkillGuidance(skillName) {
  const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');

  try {
    const content = readFileSync(skillPath, 'utf-8');
    const summary = extractSkillSummary(content);

    return `
=== ${skillName.toUpperCase()} SKILL ACTIVE ===
Apply these guidelines when writing this file:

${summary}

=== END ${skillName.toUpperCase()} GUIDANCE ===
`;
  } catch {
    // Skill file not found - silent fail
    return null;
  }
}

/**
 * Check file content for patterns and return supplementary skills
 */
function detectSupplementarySkills(content, primarySkill) {
  const supplementary = [];
  const seenSkills = new Set([primarySkill]);

  for (const { pattern, skill, reason } of CONTENT_PATTERNS) {
    if (seenSkills.has(skill)) continue;
    if (pattern.test(content)) {
      supplementary.push({ skill, reason });
      seenSkills.add(skill);
    }
  }

  return supplementary;
}

/**
 * Main entry point
 */
async function main() {
  // Read hook input from stdin
  let input = '';
  const rl = createInterface({
    input: process.stdin,
    terminal: false
  });

  for await (const line of rl) {
    input += line;
  }

  if (!input.trim()) return;

  try {
    const hookData = JSON.parse(input);
    const filePath = hookData.tool_input?.file_path;

    if (!filePath) return;

    // Check filename patterns first (for special cases like .11ty.js)
    let skillName = null;
    for (const { pattern, skill } of FILENAME_PATTERNS) {
      if (pattern.test(filePath)) {
        skillName = skill;
        break;
      }
    }

    // Fall back to extension-based matching
    if (!skillName) {
      const ext = extname(filePath).toLowerCase();
      skillName = SKILL_MAP[ext];
    }

    if (!skillName) return;

    // Output primary skill guidance
    const guidance = loadSkillGuidance(skillName);
    if (guidance) {
      console.log(guidance);
    }

    // TDD check for new testable files (Write operations only)
    const toolName = hookData.tool;
    if (toolName === 'Write' && TDD_DETECTION.isTestableFile(filePath)) {
      const testPath = TDD_DETECTION.getTestPath(filePath);
      console.log(`
=== TDD SKILL: TEST-FIRST REMINDER ===
You are creating: ${filePath}
Expected test at: ${testPath}

Consider writing the test FIRST (Red-Green-Refactor):
1. Create ${testPath} with a failing test
2. Run: npm test (should fail)
3. Then implement ${filePath} to make it pass

Quick test template:
\`\`\`javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('ModuleName', () => {
  it('should handle expected behavior', () => {
    // const result = functionUnderTest(input);
    // assert.strictEqual(result, expected);
  });
});
\`\`\`

Mode: Advisory (use /tdd strict to require tests first)
=== END TDD REMINDER ===
`);
    }

    // Check content for supplementary skills
    // Content may be in new_string (Edit) or content (Write)
    const fileContent = hookData.tool_input?.new_string ||
                        hookData.tool_input?.content ||
                        '';

    if (fileContent) {
      const supplementary = detectSupplementarySkills(fileContent, skillName);

      if (supplementary.length > 0) {
        console.log('\n=== SUPPLEMENTARY SKILLS DETECTED ===');
        for (const { skill, reason } of supplementary) {
          const excerpt = loadSkillExcerpt(skill, reason);
          console.log(excerpt);
        }
        console.log('=== END SUPPLEMENTARY SKILLS ===\n');
      }
    }
  } catch {
    // JSON parse error or other issue - silent fail to not break hook chain
  }
}

main();
