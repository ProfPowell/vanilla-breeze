// ONE-SHOT BACKFILL SCRIPT — safe to delete after initial run.
//
// Generates missing api.json and static.html files for web components.
// Usage:
//   node scripts/generators/backfill-component-files.js          # both files
//   node scripts/generators/backfill-component-files.js --api     # only api.json
//   node scripts/generators/backfill-component-files.js --static  # only static.html
//   node scripts/generators/backfill-component-files.js --dry-run # preview, no writes

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');
const WC_DIR = join(ROOT, 'src/web-components');
const SCHEMA_PATH = join(ROOT, 'src/schemas/api.schema.json');

// ── CLI flags ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const onlyApi = args.includes('--api');
const onlyStatic = args.includes('--static');
const dryRun = args.includes('--dry-run');
const doApi = !onlyStatic;
const doStatic = !onlyApi;

// ── Standard HTML attribute names ──────────────────────────────────
const NATIVE_ATTRS = new Set([
  'disabled', 'required', 'name', 'value', 'type', 'hidden', 'open',
  'readonly', 'checked', 'selected', 'placeholder', 'min', 'max', 'step',
  'pattern', 'autocomplete', 'autofocus', 'multiple', 'form', 'for',
  'href', 'src', 'alt', 'title', 'tabindex', 'role', 'lang', 'dir',
  'id', 'slot', 'is',
]);

// ── Kind inference ─────────────────────────────────────────────────
function inferKind(attrName) {
  if (attrName.startsWith('data-')) return 'data';
  if (attrName.startsWith('aria-')) return 'aria';
  if (NATIVE_ATTRS.has(attrName)) return 'native';
  return 'host-api';
}

// ── Type inference from JSDoc type hint ─────────────────────────────
function inferType(rawType) {
  if (!rawType) return {};
  const trimmed = rawType.trim();

  // Boolean
  if (trimmed === 'boolean') return { type: 'boolean' };
  // String
  if (trimmed === 'string') return { type: 'string' };
  // Number
  if (trimmed === 'number') return { type: 'number' };

  // Union of quoted strings: 'auto'|'manual'|'button'
  const unionMatch = trimmed.match(/^'([^']+)'(?:\|'([^']+)')+$/);
  if (unionMatch) {
    const values = trimmed.match(/'([^']+)'/g).map(v => v.replace(/'/g, ''));
    return { type: 'enum', values };
  }

  return {};
}

// ── camelCase to kebab-case ─────────────────────────────────────────
function camelToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// ── Attribute extraction from JS source ─────────────────────────────

function extractFromObservedAttributes(source) {
  const attrs = [];

  // Pattern 1: static get observedAttributes() { return ['a', 'b']; }
  const getterMatch = source.match(
    /static\s+get\s+observedAttributes\s*\(\s*\)\s*\{[^}]*return\s*\[([^\]]*)\]/s
  );
  if (getterMatch) {
    const items = getterMatch[1].match(/'([^']+)'|"([^"]+)"/g);
    if (items) {
      for (const item of items) {
        const name = item.replace(/['"]/g, '');
        attrs.push({ name, source: 'observedAttributes' });
      }
    }
  }

  // Pattern 2: static observedAttributes = ['a', 'b'];
  const fieldMatch = source.match(
    /static\s+observedAttributes\s*=\s*\[([^\]]*)\]/s
  );
  if (fieldMatch) {
    const items = fieldMatch[1].match(/'([^']+)'|"([^"]+)"/g);
    if (items) {
      for (const item of items) {
        const name = item.replace(/['"]/g, '');
        attrs.push({ name, source: 'observedAttributes' });
      }
    }
  }

  return attrs;
}

function extractFromJSDocAttrs(source) {
  const attrs = [];
  // @attr {type} name - description
  // Note: [^}]+ handles union types like 'auto'|'manual'|'button'
  const regex = /@attr\s+\{([^}]+)\}\s+([\w-]+)\s*-?\s*(.*)/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const rawType = match[1].trim();
    const name = match[2];
    const description = match[3].trim() || undefined;
    attrs.push({ name, rawType, description, source: '@attr' });
  }
  return attrs;
}

function extractFromGetAttribute(source) {
  const attrs = [];
  const seen = new Set();

  // getAttribute('name') and hasAttribute('name')
  const regex = /(?:get|has|remove|set|toggle)Attribute\s*\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const name = match[1];
    // Skip aria-* attributes set programmatically (not part of the host API)
    // and skip common internal-only attributes
    if (seen.has(name)) continue;
    seen.add(name);
    attrs.push({ name, source: 'getAttribute' });
  }
  return attrs;
}

function extractFromDataset(source) {
  const attrs = [];
  const seen = new Set();

  // this.dataset.propName
  const regex = /this\.dataset\.(\w+)/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const camel = match[1];
    const kebab = `data-${camelToKebab(camel)}`;
    if (seen.has(kebab)) continue;
    seen.add(kebab);
    attrs.push({ name: kebab, source: 'dataset' });
  }
  return attrs;
}

function extractEvents(source) {
  const events = [];
  const seen = new Set();

  // 1. dispatchEvent(new CustomEvent('eventname' ...))
  const directRegex = /dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = directRegex.exec(source)) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    events.push({ name });
  }

  // 2. @fires eventname (JSDoc tags)
  const firesRegex = /@fires\s+([\w:.-]+)/g;
  while ((match = firesRegex.exec(source)) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    events.push({ name });
  }

  // 3. Indirect dispatch: this.#dispatch('eventname' ...) or this.dispatch('eventname' ...)
  const indirectRegex = /(?:this\.#?dispatch|this\._dispatch)\s*\(\s*['"]([^'"]+)['"]/g;
  while ((match = indirectRegex.exec(source)) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    events.push({ name });
  }

  return events;
}

function extractDescription(source) {
  // Look for JSDoc header comment: first line after the class/component name
  // Pattern: /** \n * component-name: Description text
  const blockMatch = source.match(/\/\*\*\s*\n\s*\*\s*[\w-]+(?:\s*[:\u2014—-]+\s*)(.+)/);
  if (blockMatch) return blockMatch[1].trim();

  // Fallback: @description tag
  const descMatch = source.match(/@description\s+(.+)/);
  if (descMatch) return descMatch[1].trim();

  return undefined;
}

// ── Merge and deduplicate attributes ────────────────────────────────

function mergeAttributes(sources) {
  const map = new Map();

  for (const attr of sources) {
    const existing = map.get(attr.name);
    if (existing) {
      // Merge: prefer richer source (JSDoc > observedAttributes > getAttribute)
      if (attr.rawType && !existing.rawType) existing.rawType = attr.rawType;
      if (attr.description && !existing.description) existing.description = attr.description;
      existing.sources.push(attr.source);
    } else {
      map.set(attr.name, {
        name: attr.name,
        rawType: attr.rawType || undefined,
        description: attr.description || undefined,
        sources: [attr.source],
      });
    }
  }

  return [...map.values()];
}

// ── Filter out internal-only attributes ─────────────────────────────
// Attributes that are set by the component itself (output state) but
// are not authored by users. We still include them but they come from
// getAttribute/setAttribute calls.
const INTERNAL_ATTRS = new Set([
  'data-upgraded', 'data-error', 'data-visible', 'data-active',
  'data-complete', 'data-tour-target', 'aria-hidden', 'aria-live',
  'aria-atomic', 'aria-label', 'aria-invalid', 'aria-selected',
  'aria-expanded', 'aria-controls', 'aria-labelledby', 'aria-current',
  'aria-disabled', 'aria-modal', 'aria-describedby',
  'popover', 'tabindex', 'scope', 'abbr',
]);

function isLikelyInternal(name) {
  return INTERNAL_ATTRS.has(name);
}

// ── Build api.json object ───────────────────────────────────────────

function buildApiJson(elementName, source) {
  // Extract from all sources
  const fromObserved = extractFromObservedAttributes(source);
  const fromJSDoc = extractFromJSDocAttrs(source);
  const fromGetAttr = extractFromGetAttribute(source);
  const fromDataset = extractFromDataset(source);

  // Merge all sources (priority: JSDoc first, then observedAttributes, then rest)
  const allRaw = [...fromJSDoc, ...fromObserved, ...fromGetAttr, ...fromDataset];
  const merged = mergeAttributes(allRaw);

  // Filter out internal-only attributes
  const filtered = merged.filter(a => !isLikelyInternal(a.name));

  // Build attribute objects
  const attributes = filtered.map(attr => {
    const obj = {
      name: attr.name,
      kind: inferKind(attr.name),
      purpose: 'config',
    };

    // Infer type from JSDoc
    const typeInfo = inferType(attr.rawType);
    if (typeInfo.type) obj.type = typeInfo.type;
    if (typeInfo.values) obj.values = typeInfo.values;

    // Add description if available
    if (attr.description) obj.description = attr.description;

    return obj;
  });

  // Extract events
  const events = extractEvents(source);

  // Extract description
  const description = extractDescription(source);

  // Build the manifest
  const api = {
    $schema: '../../../schemas/api.schema.json',
    element: elementName,
    type: 'web-component',
  };

  if (description) api.description = description;

  api.attributes = attributes;

  if (events.length > 0) api.events = events;

  api.childAttributes = [];
  api.structure = [];

  return {
    api,
    stats: {
      total: attributes.length,
      fromObserved: fromObserved.length,
      fromJSDoc: fromJSDoc.length,
      fromGetAttr: fromGetAttr.length,
      fromDataset: fromDataset.length,
      events: events.length,
      ambiguous: merged.filter(a => a.sources.length > 1).map(a => a.name),
    },
  };
}

// ── Schema validation (manual, no Ajv dependency) ───────────────────

async function loadSchema() {
  const raw = await readFile(SCHEMA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function validateApiJson(api, schema) {
  const errors = [];

  // Check required top-level fields
  for (const req of schema.required || []) {
    if (!(req in api)) errors.push(`Missing required field: ${req}`);
  }

  // Check no extra top-level fields
  const allowedTop = new Set(Object.keys(schema.properties || {}));
  for (const key of Object.keys(api)) {
    if (!allowedTop.has(key)) errors.push(`Extra top-level field: ${key}`);
  }

  // Check element pattern
  if (api.element && !/^[a-z][a-z0-9-]*$/.test(api.element)) {
    errors.push(`Invalid element name: ${api.element}`);
  }

  // Check type enum
  const typeEnum = schema.properties?.type?.enum || [];
  if (api.type && !typeEnum.includes(api.type)) {
    errors.push(`Invalid type: ${api.type}`);
  }

  // Validate each attribute
  const attrSchema = schema.$defs?.attribute;
  if (attrSchema && Array.isArray(api.attributes)) {
    const allowedAttrKeys = new Set(Object.keys(attrSchema.properties || {}));
    const kindEnum = attrSchema.properties?.kind?.enum || [];
    const purposeEnum = attrSchema.properties?.purpose?.enum || [];
    const typeAttrEnum = attrSchema.properties?.type?.enum || [];

    for (const attr of api.attributes) {
      // Check required attribute fields
      for (const req of attrSchema.required || []) {
        if (!(req in attr)) errors.push(`Attribute "${attr.name}": missing required field "${req}"`);
      }
      // Check no extra attribute fields
      for (const key of Object.keys(attr)) {
        if (!allowedAttrKeys.has(key)) errors.push(`Attribute "${attr.name}": extra field "${key}"`);
      }
      // Check kind enum
      if (attr.kind && !kindEnum.includes(attr.kind)) {
        errors.push(`Attribute "${attr.name}": invalid kind "${attr.kind}"`);
      }
      // Check purpose enum
      if (attr.purpose && !purposeEnum.includes(attr.purpose)) {
        errors.push(`Attribute "${attr.name}": invalid purpose "${attr.purpose}"`);
      }
      // Check type enum
      if (attr.type && !typeAttrEnum.includes(attr.type)) {
        errors.push(`Attribute "${attr.name}": invalid type "${attr.type}"`);
      }
    }
  }

  // Validate each event
  const eventSchema = schema.$defs?.event;
  if (eventSchema && Array.isArray(api.events)) {
    const allowedEventKeys = new Set(Object.keys(eventSchema.properties || {}));
    for (const evt of api.events) {
      for (const req of eventSchema.required || []) {
        if (!(req in evt)) errors.push(`Event: missing required field "${req}"`);
      }
      for (const key of Object.keys(evt)) {
        if (!allowedEventKeys.has(key)) errors.push(`Event "${evt.name}": extra field "${key}"`);
      }
    }
  }

  return errors;
}

// ── static.html template ────────────────────────────────────────────

function buildStaticHtml(elementName) {
  // Convert kebab-case to Title Case for heading
  const titleName = elementName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titleName} (Static Fallback)</title>
  <style>
    /*
      Minimal baseline styling for the no-JS fallback.
      A production page would load the project stylesheet instead;
      these rules exist only so the file is self-contained.
    */
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: system-ui, sans-serif;
      line-height: 1.5;
      max-inline-size: 40rem;
      margin-inline: auto;
      padding: 2rem 1rem;
    }
  </style>
</head>
<body>

  <!--
    Upgrade relationship
    ====================
    This static HTML IS the baseline that <${elementName}> enhances.

    When JavaScript loads and the <${elementName}> custom element is
    defined, the markup is progressively enhanced with additional
    interactivity, ARIA attributes, and keyboard navigation.

    Without JS the core content remains accessible and functional.
  -->

  <h1>${titleName}</h1>

  <noscript>
    <p>This component works best with JavaScript enabled.</p>
  </noscript>

  <!-- TODO: Add meaningful static fallback markup for <${elementName}> -->

</body>
</html>
`;
}

// ── Find JS entry file ──────────────────────────────────────────────

async function findJsEntry(dirPath, dirName) {
  const logicPath = join(dirPath, 'logic.js');
  const namedPath = join(dirPath, `${dirName}.js`);

  try {
    await stat(logicPath);
    return logicPath;
  } catch { /* not found */ }

  try {
    await stat(namedPath);
    return namedPath;
  } catch { /* not found */ }

  return null;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const schema = await loadSchema();
  const entries = await readdir(WC_DIR, { withFileTypes: true });
  const dirs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(n => !n.startsWith('_'))  // skip _private dirs
    .sort();

  /** @type {{
    total: number,
    apiGenerated: Array<{name: string, attrs: number, events: number, fromObserved: number, fromJSDoc: number, fromGetAttr: number, fromDataset: number}>,
    apiSkipped: string[],
    apiNoJs: string[],
    staticGenerated: string[],
    staticSkipped: string[],
    zeroAttributes: string[],
    validationErrors: Array<{component: string, errors: string[]}>,
    ambiguous: Array<{component: string, attrs: any[]}>,
  }} */
  const summary = {
    total: dirs.length,
    apiGenerated: [],
    apiSkipped: [],
    apiNoJs: [],
    staticGenerated: [],
    staticSkipped: [],
    zeroAttributes: [],
    validationErrors: [],
    ambiguous: [],
  };

  console.log(`\nScanning ${dirs.length} web component directories...\n`);

  for (const dirName of dirs) {
    const dirPath = join(WC_DIR, dirName);

    // ── api.json ──────────────────────────────────────────────────
    if (doApi) {
      const apiPath = join(dirPath, 'api.json');
      let hasApi = false;
      try {
        await stat(apiPath);
        hasApi = true;
      } catch { /* not found */ }

      if (hasApi) {
        summary.apiSkipped.push(dirName);
      } else {
        const jsEntry = await findJsEntry(dirPath, dirName);
        if (!jsEntry) {
          summary.apiNoJs.push(dirName);
          console.log(`  SKIP  ${dirName}/api.json — no JS entry file`);
        } else {
          const source = await readFile(jsEntry, 'utf-8');
          const { api, stats } = buildApiJson(dirName, source);

          // Validate
          const errors = validateApiJson(api, schema);
          if (errors.length > 0) {
            summary.validationErrors.push({ component: dirName, errors });
            console.log(`  WARN  ${dirName}/api.json — ${errors.length} validation error(s):`);
            for (const err of errors) console.log(`         ${err}`);
          }

          if (stats.total === 0) {
            summary.zeroAttributes.push(dirName);
          }

          if (stats.ambiguous.length > 0) {
            summary.ambiguous.push({ component: dirName, attrs: stats.ambiguous });
          }

          const json = JSON.stringify(api, null, 2) + '\n';

          if (dryRun) {
            console.log(`  DRY   ${dirName}/api.json — ${stats.total} attrs, ${stats.events} events`);
          } else {
            await writeFile(apiPath, json, 'utf-8');
            console.log(`  WRITE ${dirName}/api.json — ${stats.total} attrs, ${stats.events} events`);
          }

          summary.apiGenerated.push({
            name: dirName,
            attrs: stats.total,
            events: stats.events,
            fromObserved: stats.fromObserved,
            fromJSDoc: stats.fromJSDoc,
            fromGetAttr: stats.fromGetAttr,
            fromDataset: stats.fromDataset,
          });
        }
      }
    }

    // ── static.html ───────────────────────────────────────────────
    if (doStatic) {
      const staticPath = join(dirPath, 'static.html');
      let hasStatic = false;
      try {
        await stat(staticPath);
        hasStatic = true;
      } catch { /* not found */ }

      if (hasStatic) {
        summary.staticSkipped.push(dirName);
      } else {
        const html = buildStaticHtml(dirName);

        if (dryRun) {
          console.log(`  DRY   ${dirName}/static.html`);
        } else {
          await writeFile(staticPath, html, 'utf-8');
          console.log(`  WRITE ${dirName}/static.html`);
        }

        summary.staticGenerated.push(dirName);
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Components scanned: ${summary.total}`);

  if (doApi) {
    console.log(`\napi.json:`);
    console.log(`  Generated:  ${summary.apiGenerated.length}`);
    console.log(`  Skipped:    ${summary.apiSkipped.length} (already exist)`);
    console.log(`  No JS file: ${summary.apiNoJs.length}`);

    if (summary.apiGenerated.length > 0) {
      console.log(`\n  Attributes per component:`);
      for (const c of summary.apiGenerated) {
        const sources = [];
        if (c.fromJSDoc) sources.push(`${c.fromJSDoc} @attr`);
        if (c.fromObserved) sources.push(`${c.fromObserved} observed`);
        if (c.fromGetAttr) sources.push(`${c.fromGetAttr} getAttribute`);
        if (c.fromDataset) sources.push(`${c.fromDataset} dataset`);
        console.log(`    ${c.name}: ${c.attrs} attrs, ${c.events} events [${sources.join(', ')}]`);
      }
    }

    if (summary.zeroAttributes.length > 0) {
      console.log(`\n  Zero-attribute components (may need manual review):`);
      for (const name of summary.zeroAttributes) {
        console.log(`    ${name}`);
      }
    }

    if (summary.ambiguous.length > 0) {
      console.log(`\n  Ambiguous extractions (multiple sources for same attr):`);
      for (const { component, attrs } of summary.ambiguous) {
        console.log(`    ${component}: ${attrs.join(', ')}`);
      }
    }

    if (summary.validationErrors.length > 0) {
      console.log(`\n  Validation errors:`);
      for (const { component, errors } of summary.validationErrors) {
        console.log(`    ${component}: ${errors.join('; ')}`);
      }
    }
  }

  if (doStatic) {
    console.log(`\nstatic.html:`);
    console.log(`  Generated: ${summary.staticGenerated.length}`);
    console.log(`  Skipped:   ${summary.staticSkipped.length} (already exist)`);
  }

  console.log('\n' + (dryRun ? '(DRY RUN — no files written)\n' : 'Done.\n'));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
