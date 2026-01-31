# Page Context, Persona & Analytics Ideas

> This is a summary of ChatGPT conversation exploring how to encode page context in HTML for styling, analytics, and progressive enhancement. Highly relevant to Vanilla Breeze's existing `data-page`, `data-theme`, and `data-mode` attributes.

## Core Concept

Encode page metadata directly in HTML so that:
1. **CSS can read it** via attribute selectors
2. **JavaScript can read it** for analytics/features
3. **No duplication** - single source of truth (JSON manifest) derives everything

## Current Vanilla Breeze Approach

```html
<html data-page="docs" data-theme="default" data-mode="light">
```

This already captures some context, but could be extended to include:
- Page type (home, docs, product, pricing, etc.)
- Intended audience (developer, student, prospect)
- Primary task (learn, buy, compare, sign-up)
- Content topics (css, layout, subgrid)
- User journey stage (awareness, consideration, decision)

## Proposed Enhancement

### Data Attributes on `<html>`

```html
<html lang="en"
      data-page-type="docs"
      data-task="learn"
      data-audience="developer student"
      data-topics="css layout subgrid"
      data-journey="consideration">
```

**Why on `<html>`:**
- CSS can target any descendant: `html[data-page-type="docs"] main { max-width: 70ch; }`
- Available immediately at parse time
- No FOUC - styles apply before paint

### JSON Manifest (Source of Truth)

```html
<script id="page-manifest" type="application/json">
{
  "version": "1.0",
  "page": { "type": "docs", "template": "docs-article" },
  "audience": { "intended": ["developer", "student"] },
  "tasks": { "primary": "learn", "supporting": ["download"] },
  "topics": ["css", "layout", "subgrid"],
  "journey": { "stage": "consideration" },
  "experiments": {}
}
</script>
```

**Benefits:**
- Machine-readable, validatable
- Can be extracted by build tools
- Analytics gets structured data
- `data-*` attributes derived from this (no duplication)

## Controlled Vocabulary

Keep enums small and versioned:

| Dimension | Values |
|-----------|--------|
| page.type | home, landing, product, pricing, docs, guide, blog, support, account, checkout, search, legal |
| audience | prospect, customer, developer, student, press, investor, admin |
| task | learn, compare, buy, sign-up, sign-in, contact, troubleshoot, download, search |
| journey.stage | awareness, consideration, decision, onboarding, retention |

**Topics are freeform kebab-case tokens** (e.g., `css`, `layout`, `subgrid`, `web-components`)

## CSS Usage with Modern Selectors

### Basic Attribute Selectors
```css
html[data-page-type="docs"] main {
  max-width: 70ch;
}

html[data-page-type="product"] main {
  max-width: 110ch;
}
```

### Token Matching (space-separated values)
```css
/* Matches if "student" is in the space-separated list */
html[data-audience~="student"] .extra-scaffold {
  display: block;
}

html[data-topics~="subgrid"] .topic-badge::after {
  content: " (subgrid)";
}
```

### Using :is() and :where()
```css
html:is([data-page-type="product"], [data-page-type="pricing"]) .cta {
  position: sticky;
  bottom: 0;
}

/* Zero specificity version */
html:where([data-audience~="student"]) .hint {
  display: block;
}
```

### Combining with :has()
```css
/* Docs page with expanded nav */
html[data-page-type="docs"]:has(nav[aria-expanded="true"]) {
  overflow: hidden;
}
```

## JavaScript Usage

```javascript
export function getPageContext() {
  const root = document.documentElement;
  const manifestEl = document.getElementById("page-manifest");
  const manifest = manifestEl ? JSON.parse(manifestEl.textContent) : null;

  return {
    // Fast access via dataset
    pageType: root.dataset.pageType,
    task: root.dataset.task,
    audience: (root.dataset.audience || "").split(/\s+/).filter(Boolean),
    topics: (root.dataset.topics || "").split(/\s+/).filter(Boolean),
    journey: root.dataset.journey || null,
    // Full manifest for rich context
    manifest
  };
}

// Analytics example
const ctx = getPageContext();
track("page_view", {
  pageType: ctx.pageType,
  task: ctx.task,
  topics: ctx.topics
});
```

## Astro Integration

### Define manifest shape once
```javascript
// src/lib/page-manifest.js
export function makePageManifest(input = {}) {
  return {
    version: "1.0",
    page: { type: input.page?.type ?? "docs" },
    audience: { intended: input.audience?.intended ?? ["developer"] },
    tasks: { primary: input.tasks?.primary ?? "learn" },
    topics: input.topics ?? [],
    journey: input.journey ?? {},
    experiments: input.experiments ?? {}
  };
}

export function manifestToRootDataset(m) {
  const joinTokens = arr => Array.isArray(arr) ? arr.filter(Boolean).join(" ") : "";
  return {
    "data-page-type": m.page.type,
    "data-task": m.tasks.primary,
    "data-audience": joinTokens(m.audience.intended),
    "data-topics": joinTokens(m.topics),
    "data-journey": m.journey?.stage ?? ""
  };
}
```

### Base layout derives data-* from manifest
```astro
---
import { makePageManifest, manifestToRootDataset } from "../lib/page-manifest.js";
const manifest = makePageManifest(Astro.props.pageManifest);
const rootAttrs = manifestToRootDataset(manifest);
---
<!doctype html>
<html lang="en" {...rootAttrs}>
<head>
  <script id="page-manifest" type="application/json">
    {JSON.stringify(manifest)}
  </script>
</head>
<body>
  <slot />
</body>
</html>
```

### Per-page usage
```astro
---
const pageManifest = {
  page: { type: "docs" },
  audience: { intended: ["developer", "student"] },
  tasks: { primary: "learn" },
  topics: ["css", "subgrid"]
};
---
<BaseLayout pageManifest={pageManifest}>
  <h1>Subgrid Tutorial</h1>
</BaseLayout>
```

## Relation to Vanilla Breeze

### Current Usage
- `data-page` - Already exists, could map to `data-page-type`
- `data-theme` - Theme identifier (default, brutalist, swiss, etc.)
- `data-mode` - Color mode (light, dark, auto)

### Potential Additions
| Attribute | Purpose | VB Use Case |
|-----------|---------|-------------|
| `data-page-type` | Page category | Style layouts differently for docs vs. landing |
| `data-task` | User's goal | Emphasize CTA on "buy" pages |
| `data-audience` | Target readers | Show beginner hints for "student" |
| `data-topics` | Content tags | Topic-specific styling, filtering |
| `data-layout` | Layout variant | Already being explored in layout-attributes POC |

### CSS Possibilities
```css
/* Docs pages get reading-optimized layout */
html[data-page-type="docs"] {
  --content-max-width: 70ch;
}

/* Product pages get wider layout with sticky CTA */
html[data-page-type="product"] {
  --content-max-width: 110ch;
}
html[data-page-type="product"] .cta {
  position: sticky;
  bottom: var(--size-m);
}

/* Developer audience sees code blocks by default */
html[data-audience~="developer"] .code-example {
  display: block;
}

/* Student audience gets extra scaffolding */
html[data-audience~="student"] .prerequisite-check {
  display: block;
}
```

## Build-Time Validation

Validate manifests at build time to catch errors early:

```javascript
// scripts/validate-page-manifest.mjs
const ENUMS = {
  pageType: new Set(["home", "landing", "product", "pricing", "docs", "guide", "blog", "support", "account", "checkout", "search", "legal"]),
  audience: new Set(["prospect", "customer", "developer", "student", "press", "investor", "admin"]),
  task: new Set(["learn", "compare", "buy", "sign-up", "sign-in", "contact", "troubleshoot", "download", "search"]),
  journey: new Set(["awareness", "consideration", "decision", "onboarding", "retention"])
};

// Validate all HTML files in dist/ have valid manifests
```

## Operational Constraints

1. **Single source of truth**: Manifest object in template data
2. **Generate data-* from it**: Never hand-edit both
3. **Lint in CI**: Fail build if manifest is missing/invalid
4. **Audience = intended audience**: Not visitor segmentation (privacy)
5. **Keep enums tiny**: Add values only when needed

## Limitations

CSS cannot:
- Read `<meta>` tag content values
- Parse JSON
- Do numeric comparisons beyond pattern matching
- Access head content for styling decisions

Solution: Project metadata into `data-*` attributes on `<html>`, then use attribute selectors.

## Next Steps for VB

1. **Audit existing `data-page` usage** - Align with proposed vocabulary
2. **Consider page manifest** - Would benefit docs site for consistent context
3. **Explore CSS hooks** - Page-type-specific layouts via existing cascade
4. **Integrate with theme system** - Some themes might only apply to certain page types

