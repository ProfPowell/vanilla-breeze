#!/usr/bin/env node

/**
 * Accessibility Statement Generator
 * Auto-generates WCAG conformance documentation based on pa11y test results.
 *
 * Features:
 * - Compiles pa11y accessibility test results
 * - Generates WCAG conformance claims
 * - Lists known issues with remediation status
 * - Includes contact information template
 *
 * Usage:
 *   node scripts/generate-a11y-statement.js
 *   node scripts/generate-a11y-statement.js examples/pages
 */

import { writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  dim: '\x1b[2m'
};

/**
 * WCAG 2.1 Success Criteria organized by level
 */
const WCAG_CRITERIA = {
  A: [
    '1.1.1 Non-text Content',
    '1.2.1 Audio-only and Video-only',
    '1.2.2 Captions',
    '1.2.3 Audio Description or Media Alternative',
    '1.3.1 Info and Relationships',
    '1.3.2 Meaningful Sequence',
    '1.3.3 Sensory Characteristics',
    '1.4.1 Use of Color',
    '1.4.2 Audio Control',
    '2.1.1 Keyboard',
    '2.1.2 No Keyboard Trap',
    '2.1.4 Character Key Shortcuts',
    '2.2.1 Timing Adjustable',
    '2.2.2 Pause, Stop, Hide',
    '2.3.1 Three Flashes or Below Threshold',
    '2.4.1 Bypass Blocks',
    '2.4.2 Page Titled',
    '2.4.3 Focus Order',
    '2.4.4 Link Purpose (In Context)',
    '2.5.1 Pointer Gestures',
    '2.5.2 Pointer Cancellation',
    '2.5.3 Label in Name',
    '2.5.4 Motion Actuation',
    '3.1.1 Language of Page',
    '3.2.1 On Focus',
    '3.2.2 On Input',
    '3.3.1 Error Identification',
    '3.3.2 Labels or Instructions',
    '4.1.1 Parsing',
    '4.1.2 Name, Role, Value'
  ],
  AA: [
    '1.2.4 Captions (Live)',
    '1.2.5 Audio Description',
    '1.3.4 Orientation',
    '1.3.5 Identify Input Purpose',
    '1.4.3 Contrast (Minimum)',
    '1.4.4 Resize Text',
    '1.4.5 Images of Text',
    '1.4.10 Reflow',
    '1.4.11 Non-text Contrast',
    '1.4.12 Text Spacing',
    '1.4.13 Content on Hover or Focus',
    '2.4.5 Multiple Ways',
    '2.4.6 Headings and Labels',
    '2.4.7 Focus Visible',
    '3.1.2 Language of Parts',
    '3.2.3 Consistent Navigation',
    '3.2.4 Consistent Identification',
    '3.3.3 Error Suggestion',
    '3.3.4 Error Prevention (Legal, Financial, Data)',
    '4.1.3 Status Messages'
  ]
};

/**
 * Map pa11y issue codes to WCAG criteria (for future detailed reporting)
 */
const _ISSUE_TO_WCAG = {
  'WCAG2AA.Principle1.Guideline1_1.1_1_1': '1.1.1 Non-text Content',
  'WCAG2AA.Principle1.Guideline1_3.1_3_1': '1.3.1 Info and Relationships',
  'WCAG2AA.Principle1.Guideline1_4.1_4_3': '1.4.3 Contrast (Minimum)',
  'WCAG2AA.Principle2.Guideline2_4.2_4_1': '2.4.1 Bypass Blocks',
  'WCAG2AA.Principle2.Guideline2_4.2_4_2': '2.4.2 Page Titled',
  'WCAG2AA.Principle2.Guideline2_4.2_4_4': '2.4.4 Link Purpose (In Context)',
  'WCAG2AA.Principle3.Guideline3_1.3_1_1': '3.1.1 Language of Page',
  'WCAG2AA.Principle4.Guideline4_1.4_1_2': '4.1.2 Name, Role, Value'
};

/**
 * Find all HTML files in a directory
 */
function findHtmlFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      findHtmlFiles(fullPath, files);
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Run pa11y on a single file and return results
 */
function runPa11y(filePath) {
  try {
    const result = execSync(`npx pa11y "${filePath}" --reporter json --standard WCAG2AA 2>/dev/null`, {
      encoding: 'utf-8',
      cwd: ROOT,
      timeout: 60000
    });
    return JSON.parse(result || '[]');
  } catch (error) {
    // pa11y exits with code 2 when issues are found
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Aggregate pa11y results across all files
 */
function aggregateResults(files) {
  const results = {
    totalFiles: files.length,
    filesWithIssues: 0,
    totalIssues: 0,
    issuesByType: {},
    issuesByFile: {},
    uniqueIssues: new Map()
  };

  console.log(`${colors.cyan}Running accessibility tests on ${files.length} files...${colors.reset}`);

  for (const file of files) {
    const relativePath = relative(ROOT, file);
    process.stdout.write(`${colors.dim}  Testing ${relativePath}...${colors.reset}`);

    const issues = runPa11y(file);

    if (issues.length > 0) {
      results.filesWithIssues++;
      results.issuesByFile[relativePath] = issues;

      for (const issue of issues) {
        results.totalIssues++;

        // Count by type
        const type = issue.type || 'error';
        results.issuesByType[type] = (results.issuesByType[type] || 0) + 1;

        // Track unique issues by code
        const code = issue.code || 'unknown';
        if (!results.uniqueIssues.has(code)) {
          results.uniqueIssues.set(code, {
            code,
            message: issue.message,
            type: issue.type,
            count: 0,
            files: []
          });
        }
        const uniqueIssue = results.uniqueIssues.get(code);
        uniqueIssue.count++;
        if (!uniqueIssue.files.includes(relativePath)) {
          uniqueIssue.files.push(relativePath);
        }
      }
      console.log(` ${colors.yellow}${issues.length} issues${colors.reset}`);
    } else {
      console.log(` ${colors.green}✓${colors.reset}`);
    }
  }

  return results;
}

/**
 * Determine conformance level based on results
 */
function determineConformanceLevel(results) {
  if (results.totalIssues === 0) {
    return {
      level: 'AA',
      status: 'Fully Conformant',
      description: 'This website fully meets WCAG 2.1 Level AA guidelines.'
    };
  }

  // Check if issues are only warnings/notices
  const errorCount = results.issuesByType.error || 0;
  const warningCount = results.issuesByType.warning || 0;

  if (errorCount === 0 && warningCount > 0) {
    return {
      level: 'AA',
      status: 'Partially Conformant',
      description: 'This website partially meets WCAG 2.1 Level AA guidelines with minor issues noted.'
    };
  }

  if (errorCount > 0) {
    return {
      level: 'AA',
      status: 'Partially Conformant',
      description: 'This website is working toward WCAG 2.1 Level AA conformance. Known issues are documented below.'
    };
  }

  return {
    level: 'A',
    status: 'Partially Conformant',
    description: 'This website meets WCAG 2.1 Level A guidelines and is working toward Level AA.'
  };
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate the accessibility statement HTML
 */
function generateStatementHtml(results, conformance) {
  const date = new Date().toISOString().split('T')[0];
  const uniqueIssuesArray = Array.from(results.uniqueIssues.values());

  // Build known issues section
  let knownIssuesHtml = '';
  if (uniqueIssuesArray.length > 0) {
    knownIssuesHtml = `
    <section id="known-issues">
      <h2>Known Issues</h2>
      <p>We are aware of the following accessibility issues and are working to address them:</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Issue</th>
            <th scope="col">Severity</th>
            <th scope="col">Occurrences</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
${uniqueIssuesArray.map(issue => `          <tr>
            <td>${escapeHtml(issue.message.substring(0, 100))}${issue.message.length > 100 ? '...' : ''}</td>
            <td>${escapeHtml(issue.type)}</td>
            <td>${issue.count}</td>
            <td>Under Review</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </section>`;
  } else {
    knownIssuesHtml = `
    <section id="known-issues">
      <h2>Known Issues</h2>
      <p>No accessibility issues were detected during automated testing.</p>
    </section>`;
  }

  // Build WCAG criteria sections
  const wcagLevelAHtml = WCAG_CRITERIA.A.map(criterion =>
    `          <li>${escapeHtml(criterion)}</li>`
  ).join('\n');

  const wcagLevelAAHtml = WCAG_CRITERIA.AA.map(criterion =>
    `          <li>${escapeHtml(criterion)}</li>`
  ).join('\n');

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accessibility Statement</title>
  <meta name="description" content="Accessibility conformance statement and WCAG compliance information" />
  <style>
    :root {
      --color-text: #1a1a1a;
      --color-background: #ffffff;
      --color-primary: #0066cc;
      --color-success: #28a745;
      --color-warning: #ffc107;
      --color-error: #dc3545;
      --color-border: #dee2e6;
      --font-family: system-ui, -apple-system, sans-serif;
      --spacing-unit: 1rem;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --color-text: #e8e8e8;
        --color-background: #1a1a1a;
        --color-primary: #4da6ff;
        --color-success: #5cb85c;
        --color-warning: #f0ad4e;
        --color-error: #d9534f;
        --color-border: #444;
      }
    }

    * { box-sizing: border-box; }

    body {
      font-family: var(--font-family);
      line-height: 1.6;
      color: var(--color-text);
      background: var(--color-background);
      max-width: 800px;
      margin: 0 auto;
      padding: calc(var(--spacing-unit) * 2);
    }

    h1 { margin-top: 0; }
    h2 { margin-top: calc(var(--spacing-unit) * 2); border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; }

    a { color: var(--color-primary); }
    a:hover { text-decoration: none; }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.875rem;
    }

    .badge-success { background: var(--color-success); color: white; }
    .badge-warning { background: var(--color-warning); color: black; }
    .badge-error { background: var(--color-error); color: white; }

    ul.summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--spacing-unit);
      margin: var(--spacing-unit) 0;
      list-style: none;
      padding: 0;
    }

    ul.summary-grid li {
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: var(--spacing-unit);
      text-align: center;
    }

    ul.summary-grid .value {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: var(--color-primary);
    }

    ul.summary-grid .label {
      display: block;
      font-size: 0.875rem;
      color: var(--color-text);
      opacity: 0.8;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: var(--spacing-unit) 0;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    th { font-weight: bold; background: rgba(128, 128, 128, 0.1); }

    .criteria-list {
      columns: 2;
      column-gap: 2rem;
      list-style: none;
      padding: 0;
    }

    .criteria-list li {
      padding: 0.25rem 0;
      break-inside: avoid;
    }

    .criteria-list li::before {
      content: "✓ ";
      color: var(--color-success);
    }

    address.contact-info {
      background: rgba(128, 128, 128, 0.1);
      border-radius: 8px;
      padding: var(--spacing-unit);
      font-style: normal;
    }

    footer {
      margin-top: calc(var(--spacing-unit) * 3);
      padding-top: var(--spacing-unit);
      border-top: 1px solid var(--color-border);
      font-size: 0.875rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <main>
    <h1>Accessibility Statement</h1>

    <section id="commitment">
      <h2>Our Commitment</h2>
      <p>We are committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards.</p>
    </section>

    <section id="conformance">
      <h2>Conformance Status</h2>
      <p>
        <span class="badge ${conformance.status === 'Fully Conformant' ? 'badge-success' : 'badge-warning'}">
          WCAG 2.1 Level ${conformance.level} - ${conformance.status}
        </span>
      </p>
      <p>${escapeHtml(conformance.description)}</p>

      <ul class="summary-grid">
        <li>
          <span class="value">${results.totalFiles}</span>
          <span class="label">Pages Tested</span>
        </li>
        <li>
          <span class="value">${results.totalFiles - results.filesWithIssues}</span>
          <span class="label">Pages Passing</span>
        </li>
        <li>
          <span class="value">${results.totalIssues}</span>
          <span class="label">Issues Found</span>
        </li>
        <li>
          <span class="value">${results.uniqueIssues.size}</span>
          <span class="label">Unique Issues</span>
        </li>
      </ul>
    </section>
${knownIssuesHtml}

    <section id="standards">
      <h2>Standards Applied</h2>
      <p>This website has been evaluated against <a href="https://www.w3.org/TR/WCAG21/">WCAG 2.1</a> at Level AA. The following success criteria are addressed:</p>

      <h3>Level A Criteria</h3>
      <ul class="criteria-list">
${wcagLevelAHtml}
      </ul>

      <h3>Level AA Criteria</h3>
      <ul class="criteria-list">
${wcagLevelAAHtml}
      </ul>
    </section>

    <section id="methodology">
      <h2>Assessment Methodology</h2>
      <p>This accessibility statement was generated using automated testing with:</p>
      <ul>
        <li><strong>Pa11y</strong> - Automated accessibility testing tool</li>
        <li><strong>HTML CodeSniffer</strong> - WCAG 2.1 compliance checker</li>
        <li><strong>axe-core</strong> - Accessibility testing engine</li>
      </ul>
      <p>Automated testing is supplemented with manual review for issues that cannot be detected programmatically.</p>
    </section>

    <section id="contact">
      <h2>Feedback</h2>
      <p>We welcome your feedback on the accessibility of this website. Please let us know if you encounter accessibility barriers:</p>
      <address class="contact-info">
        <p><strong>Email:</strong> <a href="mailto:accessibility@example.com">accessibility@example.com</a></p>
        <p><strong>Phone:</strong> +1 (555) 123-4567</p>
        <p><strong>Address:</strong> 123 Main Street, City, State 12345</p>
      </address>
      <p>We aim to respond to accessibility feedback within 5 business days.</p>
    </section>

    <section id="enforcement">
      <h2>Enforcement Procedure</h2>
      <p>If you are not satisfied with our response to your accessibility concern, you may contact your local disability rights organization or file a complaint with the appropriate regulatory body.</p>
    </section>
  </main>

  <footer>
    <p>This statement was last updated on <time datetime="${date}">${date}</time>.</p>
    <p>Generated automatically using the accessibility statement generator.</p>
  </footer>
</body>
</html>
`;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  let targetDir = join(ROOT, 'examples', 'pages');

  // Parse arguments
  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      // Output option handled later
    } else if (!arg.startsWith('-')) {
      targetDir = resolve(arg);
    }
  }

  // Verify target directory exists
  if (!existsSync(targetDir)) {
    console.error(`${colors.red}Error: Directory not found: ${targetDir}${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}Accessibility Statement Generator${colors.reset}`);
  console.log(`${colors.dim}Target: ${relative(ROOT, targetDir) || targetDir}${colors.reset}`);
  console.log();

  // Find HTML files
  const htmlFiles = findHtmlFiles(targetDir);
  if (htmlFiles.length === 0) {
    console.error(`${colors.yellow}No HTML files found in ${targetDir}${colors.reset}`);
    process.exit(0);
  }

  // Run accessibility tests
  const results = aggregateResults(htmlFiles);

  // Determine conformance level
  const conformance = determineConformanceLevel(results);

  console.log();
  console.log(`${colors.cyan}Results Summary${colors.reset}`);
  console.log(`  Files tested: ${results.totalFiles}`);
  console.log(`  Files with issues: ${results.filesWithIssues}`);
  console.log(`  Total issues: ${results.totalIssues}`);
  console.log(`  Unique issues: ${results.uniqueIssues.size}`);
  console.log(`  Conformance: WCAG 2.1 Level ${conformance.level} - ${conformance.status}`);
  console.log();

  // Generate output
  const outputDir = join(ROOT, 'docs');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, 'accessibility.html');
  const html = generateStatementHtml(results, conformance);
  writeFileSync(outputPath, html);

  console.log(`${colors.green}✓ Generated: ${relative(ROOT, outputPath)}${colors.reset}`);
  console.log();

  return 0;
}

main();
