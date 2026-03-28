const fs = require('fs');
const path = require('path');

const SITE_ROOT = '/Users/tpowell/src/vanilla-breeze/site-cook/dist/pages';
const IGNORE_PREFIXES = ['/cdn/', '/src/', '/pagefind/'];

// Collect all HTML files
function findHtmlFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = findHtmlFiles(SITE_ROOT);
console.log(`Found ${htmlFiles.length} HTML files\n`);

// Extract href values from <a> tags using regex
const hrefRegex = /<a\s[^>]*?href\s*=\s*["']([^"']*?)["'][^>]*>/gi;

let totalLinks = 0;
let totalBroken = 0;

// Map: target URL -> array of source pages
const brokenByTarget = new Map();
// Map: source page -> array of broken targets
const brokenBySource = new Map();

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = '/' + path.relative(SITE_ROOT, file).replace(/\/index\.html$/, '/').replace(/^index\.html$/, '/');

  let match;
  hrefRegex.lastIndex = 0;
  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1].trim();

    // Skip empty, anchor-only, external, mailto, tel, javascript links
    if (!href || href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') ||
        href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      continue;
    }

    // Only check internal links starting with /
    if (!href.startsWith('/')) {
      continue;
    }

    // Strip anchor fragment
    const cleanHref = href.split('#')[0];

    // Skip known external/asset prefixes
    if (IGNORE_PREFIXES.some(p => cleanHref.startsWith(p))) {
      continue;
    }

    totalLinks++;

    // Resolve the target path
    let targetPath;
    if (cleanHref.endsWith('/')) {
      targetPath = path.join(SITE_ROOT, cleanHref, 'index.html');
    } else if (cleanHref.endsWith('.html')) {
      targetPath = path.join(SITE_ROOT, cleanHref);
    } else {
      // Could be a directory without trailing slash - try both
      targetPath = path.join(SITE_ROOT, cleanHref, 'index.html');
      if (!fs.existsSync(targetPath)) {
        // Try as a file
        targetPath = path.join(SITE_ROOT, cleanHref);
      }
    }

    if (!fs.existsSync(targetPath)) {
      totalBroken++;
      if (!brokenByTarget.has(cleanHref)) {
        brokenByTarget.set(cleanHref, []);
      }
      brokenByTarget.get(cleanHref).push(relPath);

      if (!brokenBySource.has(relPath)) {
        brokenBySource.set(relPath, []);
      }
      brokenBySource.get(relPath).push(cleanHref);
    }
  }
}

console.log('='.repeat(70));
console.log('BROKEN LINK REPORT');
console.log('='.repeat(70));
console.log(`Total internal links checked: ${totalLinks}`);
console.log(`Total broken links found:     ${totalBroken}`);
console.log(`Unique broken targets:        ${brokenByTarget.size}`);
console.log(`Pages with broken links:      ${brokenBySource.size}`);
console.log('='.repeat(70));

if (brokenByTarget.size > 0) {
  console.log('\nBROKEN LINKS GROUPED BY TARGET URL:\n');

  // Sort by number of referring pages (most common broken links first)
  const sorted = [...brokenByTarget.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [target, sources] of sorted) {
    console.log(`  ${target}  (${sources.length} page${sources.length > 1 ? 's' : ''} link here)`);
    for (const src of sources.slice(0, 15)) {
      console.log(`    <- ${src}`);
    }
    if (sources.length > 15) {
      console.log(`    ... and ${sources.length - 15} more`);
    }
    console.log('');
  }
}

if (brokenBySource.size > 0) {
  console.log('\n' + '='.repeat(70));
  console.log('BROKEN LINKS BY SOURCE PAGE:\n');
  const sortedSources = [...brokenBySource.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [source, targets] of sortedSources) {
    console.log(`  ${source}`);
    for (const t of targets) {
      console.log(`    -> ${t}`);
    }
    console.log('');
  }
}
