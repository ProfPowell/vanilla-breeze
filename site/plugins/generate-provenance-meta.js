/**
 * @file generate-provenance-meta.js
 * @description Reads per-page provenance frontmatter and emits the §A
 * public-standard meta tags + §B vb:* meta tags + JSON-LD mirror per
 * meta-tag-contract-v1 (admin/specs/meta-tag-contract-v1.md).
 *
 * Runs as a default Cook plugin before applyTemplate, so it writes generated
 * HTML strings back to file.frontMatter.{provenanceMeta, provenanceJsonLd,
 * provenanceHtmlAttrs} which the layouts reference via ${var} substitution.
 *
 * Frontmatter contract (all optional):
 *
 *   author        : "Thomas A. Powell"
 *   authorUrl     : "/team/tpowell"
 *   published     : "2026-04-24"          → article:published_time, JSON-LD datePublished
 *   lastModified  : "2026-04-24"          → last-modified, article:modified_time
 *   version       : "1.4.0"               → meta[itemprop=version]
 *   versionUrl    : "/changelog#v1-4-0"   → vb:version-url
 *   versionsManifest: "/data/versions/migration.json"
 *                                          → vb:versions-manifest
 *                                            (URL of the per-page versions
 *                                            JSON manifest consumed by
 *                                            <version-switcher>)
 *   keywords      : ["a", "b"] or "a, b"
 *   license       : "CC BY 4.0"
 *   licenseUrl    : "https://creativecommons.org/licenses/by/4.0/"
 *   provenance    : "ai-assisted"         → vb:provenance (space-separated tokens compose)
 *   review        : "editor-reviewed"     → vb:review
 *   status        : "published"           → vb:status
 *   aiTools       : "Claude Opus 4.7"     → vb:ai-tools
 *   concepts      : ["data-provenance",   → repeated <meta name="concept">,
 *                    "page-info"]            <link rel="tag" href="/topics/{id}">,
 *                                            and JSON-LD `about` array (DefinedTerm)
 *   ogImage       : "/og/page.jpg"        → og:image
 *   ogType        : "article"             → og:type (default)
 *
 * v1.1 (2026-04-27): replaced `topic` (single dotted-path string) with
 * `concepts` (array of SKOS concept @ids resolved against vocabulary.json).
 * See admin/specs/meta-tag-contract-v1.md and admin/reference/decisions.md.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __pluginDir = dirname(fileURLToPath(import.meta.url));
const VOCAB_PATH = resolve(__pluginDir, '../src/_data/vocabulary.json');

let vocabularyLabelCache = null;
function vocabularyLabels() {
  if (vocabularyLabelCache) return vocabularyLabelCache;
  vocabularyLabelCache = new Map();
  if (!existsSync(VOCAB_PATH)) return vocabularyLabelCache;
  try {
    const vocab = JSON.parse(readFileSync(VOCAB_PATH, 'utf-8'));
    for (const c of vocab.concepts || []) {
      if (c['@id'] && c['skos:prefLabel']) {
        vocabularyLabelCache.set(c['@id'], c['skos:prefLabel']);
      }
    }
  } catch {
    /* leave cache empty; labels fall back to slug */
  }
  return vocabularyLabelCache;
}

function escAttr(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function jsonForScript(value) {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026');
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

const PROVENANCE_LABELS = {
  'human': 'Human-written',
  'ai-assisted': 'Human-written, AI-assisted',
  'ai-generated': 'AI-generated',
  'translated': 'Translated',
  'synthesized': 'Synthesized from sources',
  'migrated': 'Migrated content'
};

const STATUS_LD = {
  'draft': 'Draft',
  'published': 'Published',
  'archived': 'Archived'
};

function provenanceCreditText(provenance, aiTools, review) {
  if (!provenance) return null;
  const tokens = String(provenance).trim().split(/\s+/).filter(Boolean);
  const labels = tokens.map((t) => PROVENANCE_LABELS[t] || t);
  const parts = [labels.join(' · ')];
  if (aiTools) parts.push(`tools: ${aiTools}`);
  if (review && review !== 'unreviewed') parts.push(review.replace(/-/g, ' '));
  return parts.join(' — ');
}

function buildMetaTags(fm) {
  const lines = [];
  const push = (line) => lines.push(line);

  /* Section A — public standards */
  if (fm.author) push(`<meta name="author" content="${escAttr(fm.author)}">`);
  if (fm.authorUrl) {
    push(`<link rel="author" href="${escAttr(fm.authorUrl)}">`);
    push(`<meta property="article:author" content="${escAttr(fm.authorUrl)}">`);
  }

  if (fm.published) {
    push(`<meta property="article:published_time" content="${escAttr(toIso(fm.published))}">`);
  }
  if (fm.lastModified) {
    push(`<meta name="last-modified" content="${escAttr(toDate(fm.lastModified))}">`);
    push(`<meta property="article:modified_time" content="${escAttr(toIso(fm.lastModified))}">`);
  }

  const keywords = asList(fm.keywords);
  if (keywords.length) {
    push(`<meta name="keywords" content="${escAttr(keywords.join(', '))}">`);
    for (const tag of keywords) {
      push(`<meta property="article:tag" content="${escAttr(tag)}">`);
    }
  }

  if (fm.license) push(`<meta name="license" content="${escAttr(fm.license)}">`);
  if (fm.licenseUrl) push(`<link rel="license" href="${escAttr(fm.licenseUrl)}">`);

  if (fm.version) push(`<meta itemprop="version" content="${escAttr(fm.version)}">`);

  if (fm.ogImage) push(`<meta property="og:image" content="${escAttr(fm.ogImage)}">`);
  push(`<meta property="og:type" content="${escAttr(fm.ogType || 'article')}">`);

  /* Section B — vb:* namespace */
  if (fm.provenance) push(`<meta name="vb:provenance" content="${escAttr(fm.provenance)}">`);
  if (fm.review) push(`<meta name="vb:review" content="${escAttr(fm.review)}">`);
  if (fm.status) push(`<meta name="vb:status" content="${escAttr(fm.status)}">`);
  if (fm.aiTools) push(`<meta name="vb:ai-tools" content="${escAttr(fm.aiTools)}">`);
  const concepts = asList(fm.concepts);
  if (concepts.length) {
    for (const c of concepts) {
      push(`<meta name="concept" content="${escAttr(c)}">`);
    }
    for (const c of concepts) {
      push(`<link rel="tag" href="/topics/${escAttr(c)}/">`);
    }
    push(`<link rel="glossary" href="/glossary/">`);
  }
  if (fm.versionUrl) push(`<meta name="vb:version-url" content="${escAttr(fm.versionUrl)}">`);
  if (fm.versionsManifest) push(`<meta name="vb:versions-manifest" content="${escAttr(fm.versionsManifest)}">`);

  return lines.join('\n  ');
}

function buildJsonLd(fm, opts) {
  /* Skip JSON-LD if no provenance metadata is present at all */
  if (!fm.author && !fm.published && !fm.lastModified && !fm.version && !fm.provenance) {
    return '';
  }

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle'
  };

  if (opts.title) ld.headline = opts.title;
  if (opts.description) ld.description = opts.description;

  if (fm.author) {
    ld.author = fm.authorUrl
      ? { '@type': 'Person', name: fm.author, url: fm.authorUrl }
      : { '@type': 'Person', name: fm.author };
  }

  if (fm.published) ld.datePublished = toDate(fm.published);
  if (fm.lastModified) ld.dateModified = toDate(fm.lastModified);
  if (fm.version) ld.version = fm.version;

  const keywords = asList(fm.keywords);
  if (keywords.length) ld.keywords = keywords.join(', ');
  const concepts = asList(fm.concepts);
  if (concepts.length) {
    ld.about = concepts.map((c) => ({
      '@type': 'DefinedTerm',
      termCode: c,
      inDefinedTermSet: '/vocabulary.json'
    }));
  }
  if (fm.licenseUrl) ld.license = fm.licenseUrl;
  else if (fm.license) ld.license = fm.license;

  if (fm.status) ld.creativeWorkStatus = STATUS_LD[fm.status] || fm.status;

  const credit = provenanceCreditText(fm.provenance, fm.aiTools, fm.review);
  if (credit) ld.creditText = credit;

  const additional = [];
  if (fm.provenance) {
    additional.push({ '@type': 'PropertyValue', name: 'contentProvenance', value: String(fm.provenance) });
  }
  if (fm.review) {
    additional.push({ '@type': 'PropertyValue', name: 'humanReview', value: String(fm.review) });
  }
  if (fm.aiTools) {
    additional.push({ '@type': 'PropertyValue', name: 'aiTools', value: String(fm.aiTools) });
  }
  if (additional.length) ld.additionalProperty = additional;

  return `<script type="application/ld+json">\n${jsonForScript(ld)}\n</script>`;
}

function buildArticleTagsFooter(fm) {
  const concepts = asList(fm.concepts);
  if (!concepts.length) return '';
  const labels = vocabularyLabels();
  const items = concepts.map((id) => {
    const label = labels.get(id) || id;
    return `      <li><a href="/topics/${escAttr(id)}/" rel="tag" data-concept="${escAttr(id)}">${escAttr(label)}</a></li>`;
  }).join('\n');
  return `<footer data-article-tags>
  <h2 class="visually-hidden">Topics</h2>
  <ul>
${items}
  </ul>
</footer>`;
}

function buildHtmlAttrs(fm) {
  const attrs = [];
  if (fm.provenance) attrs.push(`data-provenance="${escAttr(fm.provenance)}"`);
  if (fm.review && fm.review !== 'unreviewed') attrs.push(`data-review="${escAttr(fm.review)}"`);
  if (fm.status && fm.status !== 'published') attrs.push(`data-status="${escAttr(fm.status)}"`);
  return attrs.length ? ' ' + attrs.join(' ') : '';
}

function toIso(value) {
  /* Accept "2026-04-24" or full ISO; emit full ISO with Z for og/article fields */
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00:00Z`;
  return s;
}

function toDate(value) {
  /* Accept "2026-04-24" or full ISO; emit YYYY-MM-DD for last-modified / JSON-LD */
  const s = String(value);
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s;
}

export class GenerateProvenanceMeta {
  constructor({ file }) {
    this.file = file;
  }

  async init() {
    const file = this.file;
    if (!file?.path?.endsWith('.html')) return;
    const fm = file.frontMatter;
    if (!fm) return;

    /* Compute the three template placeholders the layouts reference. Always
       set them — even if empty — so layouts don't render literal ${vars}. */
    const meta = buildMetaTags(fm);
    const jsonLd = buildJsonLd(fm, { title: fm.title, description: fm.description });
    const htmlAttrs = buildHtmlAttrs(fm);

    fm.provenanceMeta = meta;
    fm.provenanceJsonLd = jsonLd;
    fm.provenanceHtmlAttrs = htmlAttrs;
    fm.articleTagsBlock = buildArticleTagsFooter(fm);

    /* Only render <page-info auto> when there is provenance metadata to surface,
       so pages without frontmatter don't sprout an empty divider. */
    const hasAny = fm.author || fm.published || fm.lastModified || fm.version
      || fm.provenance || fm.review || fm.aiTools || fm.license;
    fm.pageInfoBlock = hasAny ? '<page-info auto></page-info>' : '';

    /* Pages with provenance frontmatter become signable — the Stage 4
       signer (scripts/sign-pages.js) skips pages with no [data-signable]
       descendants. Layouts inject this attribute onto <article> (article
       layouts) or <main> (docs/base layouts). */
    fm.signableAttr = hasAny ? ' data-signable=""' : '';
  }
}
