A chat with Claude was performed about if it makes more sense to port the docs to 11ty.  According to this information Astro isn't as natural fit for Vanilla Breeze as 11ty may be.  Read this over and see if we can do a port of our site to 11ty and verify this.

# 11ty + Vanilla Breeze: Project Scaffold

An 11ty-based static site architecture that integrates Vanilla Breeze custom elements, native CSS layers, and content negotiation for LLM agents.

## Design Principles

This scaffold combines three ideas into a single coherent stack:

1. **11ty as a markdown compiler** — content goes in as `.md`, comes out as HTML, with no intermediate framework runtime competing with the platform
2. **Vanilla Breeze as the design system** — custom elements, CSS `@layer` cascade, `data-*` attribute state, progressive enhancement
3. **Markdown for Agents** — same URL serves HTML to browsers and clean markdown to LLM agents via `Accept` header content negotiation

The output is static files. No SSR. No hydration. The browser gets semantic HTML with custom elements that progressively enhance. Agents get source markdown with frontmatter metadata.


## Project Structure

```
site/
├── .eleventy.js                  # 11ty configuration
├── package.json
├── netlify.toml                  # Edge function config (or _worker.js for CF)
│
├── src/                          # 11ty input directory
│   ├── _data/                    # Global data cascade
│   │   ├── site.js               # Site metadata (name, url, description)
│   │   ├── navigation.js         # Nav structure
│   │   └── theme.js              # Vanilla Breeze design tokens
│   │
│   ├── _includes/                # Layouts and partials
│   │   ├── layouts/
│   │   │   ├── base.njk          # HTML shell, <head>, skip link, scripts
│   │   │   ├── page.njk          # Static pages (about, contact)
│   │   │   └── post.njk          # Blog posts / articles
│   │   └── partials/
│   │       ├── head.njk          # <meta>, <link>, tokens
│   │       ├── header.njk        # <site-header> component
│   │       ├── footer.njk        # <site-footer> component
│   │       └── post-meta.njk     # Date, tags, reading time
│   │
│   ├── assets/                   # Passthrough copy
│   │   ├── css/
│   │   │   ├── main.css          # @import hub, @layer declaration
│   │   │   ├── _reset.css
│   │   │   ├── _tokens.css       # Generated from _data/theme.js
│   │   │   ├── _base.css         # Element defaults
│   │   │   ├── _layout.css       # Page grid, content width
│   │   │   ├── sections/
│   │   │   │   ├── _header.css
│   │   │   │   └── _footer.css
│   │   │   ├── components/       # Vanilla Breeze component styles
│   │   │   │   ├── _callout.css  # <ui-callout>
│   │   │   │   ├── _card.css     # <content-card>
│   │   │   │   └── _code.css     # <code-block>
│   │   │   └── pages/
│   │   │       ├── _home.css
│   │   │       └── _post.css
│   │   ├── js/
│   │   │   ├── main.js           # Progressive enhancement entry
│   │   │   └── components/       # Web Component definitions
│   │   │       ├── site-header.js
│   │   │       ├── ui-callout.js
│   │   │       └── code-block.js
│   │   └── images/
│   │
│   ├── content/                  # Markdown content collections
│   │   ├── posts/                # Blog posts
│   │   │   ├── posts.json        # Collection defaults (layout, tags)
│   │   │   ├── first-post.md
│   │   │   └── second-post.md
│   │   └── docs/                 # Documentation
│   │       ├── docs.json
│   │       └── getting-started.md
│   │
│   ├── pages/                    # Static pages
│   │   ├── index.njk             # Homepage
│   │   ├── about.md
│   │   └── contact.njk
│   │
│   ├── feeds/                    # Generated feeds
│   │   ├── rss.njk               # RSS/Atom feed
│   │   ├── sitemap.njk           # XML sitemap
│   │   └── llms.njk              # llms.txt index
│   │
│   └── agent/                    # Markdown-for-agents output
│       ├── md-posts.11ty.js      # Generates /md/posts/*/index.md
│       └── md-docs.11ty.js       # Generates /md/docs/*/index.md
│
├── netlify/                      # Netlify edge functions
│   └── edge-functions/
│       └── content-negotiate.ts  # Accept header negotiation
│
├── errors/
│   ├── 404.njk
│   └── offline.html
│
└── _dist/                        # 11ty output (gitignored)
```


## 11ty Configuration

```js
// .eleventy.js
module.exports = function (eleventyConfig) {

  // --- Passthrough ---
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy('src/errors');

  // --- Collections ---
  eleventyConfig.addCollection('posts', collection =>
    collection
      .getFilteredByGlob('src/content/posts/*.md')
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection('docs', collection =>
    collection.getFilteredByGlob('src/content/docs/*.md')
  );

  // --- Shortcodes: Vanilla Breeze components in markdown ---
  eleventyConfig.addPairedShortcode('callout', (content, variant = 'note') =>
    `<ui-callout data-variant="${variant}">\n${content}\n</ui-callout>`
  );

  eleventyConfig.addPairedShortcode('card', (content, heading) =>
    `<content-card>\n<h3>${heading}</h3>\n${content}\n</content-card>`
  );

  eleventyConfig.addShortcode('icon', (name, label) =>
    label
      ? `<x-icon name="${name}" aria-label="${label}"></x-icon>`
      : `<x-icon name="${name}" aria-hidden="true"></x-icon>`
  );

  // --- Filters ---
  eleventyConfig.addFilter('readingTime', content => {
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 220);
  });

  eleventyConfig.addFilter('tokenEstimate', content =>
    Math.ceil(content.length / 4)
  );

  eleventyConfig.addFilter('isoDate', date =>
    date.toISOString().split('T')[0]
  );

  // --- Markdown config ---
  const md = require('markdown-it')({
    html: true,        // Allow custom elements in markdown
    typographer: true,
  });
  eleventyConfig.setLibrary('md', md);

  return {
    dir: {
      input: 'src',
      output: '_dist',
      includes: '_includes',
      data: '_data',
    },
  };
};
```


## Global Data

### `src/_data/site.js`

```js
module.exports = {
  name: 'Site Name',
  url: process.env.URL || 'https://example.com',
  description: 'Site description for meta tags and feeds',
  author: 'Author Name',
  language: 'en',
};
```

### `src/_data/theme.js`

Design tokens that feed both CSS generation and template logic:

```js
module.exports = {
  colors: {
    primary: '#2563eb',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    xl: '4rem',
  },
  fonts: {
    body: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
  },
  layout: {
    maxWidth: '65ch',
    wideWidth: '90rem',
  },
};
```


## Layouts

### `src/_includes/layouts/base.njk`

The HTML shell. Every page extends this.

```html
<!doctype html>
<html lang="{{ site.language }}">
<head>
  {% include "partials/head.njk" %}
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  {% include "partials/header.njk" %}

  <main id="main">
    {{ content | safe }}
  </main>

  {% include "partials/footer.njk" %}

  <script src="/assets/js/main.js" type="module"></script>
</body>
</html>
```

### `src/_includes/partials/head.njk`

```html
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<title>{{ title }} - {{ site.name }}</title>
<meta name="description" content="{{ description or site.description }}"/>
<link rel="canonical" href="{{ site.url }}{{ page.url }}"/>

<!-- Content negotiation discoverability -->
<link rel="alternate" type="text/markdown" href="{{ page.url }}"/>

<!-- Open Graph -->
<meta property="og:title" content="{{ title }}"/>
<meta property="og:description" content="{{ description or site.description }}"/>
<meta property="og:url" content="{{ site.url }}{{ page.url }}"/>
<meta property="og:type" content="{% if layout == 'post' %}article{% else %}website{% endif %}"/>

<!-- Styles — no build step, native @import + @layer -->
<link rel="stylesheet" href="/assets/css/main.css"/>
```

The `<link rel="alternate" type="text/markdown">` tag is the discoverability mechanism. An agent visiting the HTML version programmatically discovers that markdown is available at the same URL.


## Vanilla Breeze Integration

### CSS Entry Point: `src/assets/css/main.css`

```css
@layer reset, tokens, base, layout, sections, components, pages;

@import "_reset.css" layer(reset);
@import "_tokens.css" layer(tokens);
@import "_base.css" layer(base);
@import "_layout.css" layer(layout);

@import "sections/_header.css" layer(sections);
@import "sections/_footer.css" layer(sections);

@import "components/_callout.css" layer(components);
@import "components/_card.css" layer(components);
@import "components/_code.css" layer(components);

@import "pages/_home.css" layer(pages);
@import "pages/_post.css" layer(pages);
```

No build tools. The browser resolves `@import` natively. Layers control the cascade so specificity never fights you.

### Custom Elements as CSS Hooks

Most Vanilla Breeze components work as CSS-only custom elements — semantic tags styled without JavaScript:

```css
/* components/_callout.css */
ui-callout {
  display: block;
  padding: var(--space-md) var(--space-lg);
  border-inline-start: 4px solid var(--color-primary);
  background: var(--color-surface-alt);
  border-radius: var(--radius-sm);

  &[data-variant="warning"] {
    border-color: var(--color-warning);
  }

  &[data-variant="tip"] {
    border-color: var(--color-success);
  }
}
```

```css
/* components/_card.css */
content-card {
  display: block;
  padding: var(--space-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  & h3 {
    margin-block-start: 0;
  }
}
```

The reset handles undefined custom elements:

```css
/* _reset.css (excerpt) */
:not(:defined) {
  display: block;
}
```

### Shortcodes Bridge Markdown to Components

In markdown content, authors use shortcodes that emit custom elements:

```md
---
title: Getting Started
---

Welcome to the project.

{% callout "warning" %}
This API is experimental and may change.
{% endcallout %}

{% callout "tip" %}
Check the docs for the latest patterns.
{% endcallout %}
```

This renders as semantic HTML with Vanilla Breeze custom elements. No class soup, no framework runtime. The CSS targets the element names directly.

### Progressive Enhancement with JS

Components that need interactivity register via `customElements.define()`:

```js
// assets/js/components/code-block.js
class CodeBlock extends HTMLElement {
  connectedCallback() {
    const pre = this.querySelector('pre');
    if (!pre) return;

    const button = document.createElement('button');
    button.textContent = 'Copy';
    button.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.textContent);
      button.textContent = 'Copied';
      setTimeout(() => (button.textContent = 'Copy'), 2000);
    });
    this.prepend(button);
  }
}

customElements.define('code-block', CodeBlock);
```

Without JS, the code block still renders — the button just isn't there.


## Markdown for Agents

### How It Works

At build time, 11ty generates two parallel output trees:

```
_dist/
├── posts/first-post/index.html    ← browser gets this
├── md/posts/first-post/index.md   ← agent gets this
```

An edge function checks the `Accept` header and rewrites to the right file. Same URL, different representation. The `Vary: Accept` header ensures CDN caches keep them separate.

### Agent Markdown Generator

```js
// src/agent/md-posts.11ty.js
class AgentMarkdown {
  data() {
    return {
      pagination: {
        data: 'collections.posts',
        size: 1,
        alias: 'post',
      },
      permalink: data => `/md${data.post.url}index.md`,
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const { post } = data;
    const fm = [
      '---',
      `title: "${post.data.title}"`,
      post.data.description
        ? `description: "${post.data.description}"`
        : null,
      post.data.date
        ? `date: ${post.data.date.toISOString().split('T')[0]}`
        : null,
      `url: ${data.site.url}${post.url}`,
      post.data.tags
        ? `tags: [${post.data.tags.join(', ')}]`
        : null,
      '---',
    ]
      .filter(Boolean)
      .join('\n');

    // Raw markdown body, no shortcode expansion
    return `${fm}\n\n${post.template.frontMatter.content}`;
  }
}

module.exports = AgentMarkdown;
```

This outputs the **source markdown** — the original content the author wrote. No HTML-to-markdown round-trip. Shortcodes remain as-is in the agent output since they carry semantic intent that an LLM can interpret.

Duplicate this pattern for each collection (`md-docs.11ty.js`, etc.).

### Edge Function: Content Negotiation

**Netlify:**

```ts
// netlify/edge-functions/content-negotiate.ts
export default async (request: Request, context) => {
  const accept = request.headers.get('accept') || '';
  const types = accept.split(',').map(t => t.trim().split(';')[0]);
  const mdIdx = types.findIndex(
    t => t === 'text/markdown' || t === 'text/plain'
  );
  const htmlIdx = types.findIndex(t => t === 'text/html');

  if (mdIdx === -1 || (htmlIdx !== -1 && htmlIdx < mdIdx)) {
    return context.next();
  }

  const url = new URL(request.url);
  const mdPath = `/md${url.pathname}${url.pathname.endsWith('/') ? '' : '/'}index.md`;

  try {
    const response = await context.next(new Request(new URL(mdPath, request.url)));
    if (!response.ok) return context.next();

    const body = await response.text();
    return new Response(body, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Markdown-Tokens': String(Math.ceil(body.length / 4)),
        'Vary': 'Accept',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return context.next();
  }
};

export const config = { path: '/*' };
```

```toml
# netlify.toml
[[edge_functions]]
  function = "content-negotiate"
  path = "/*"
```

**Cloudflare Pages** alternative — same logic in `_worker.js`:

```js
export default {
  async fetch(request, env) {
    const accept = request.headers.get('accept') || '';
    const types = accept.split(',').map(t => t.trim().split(';')[0]);
    const mdIdx = types.findIndex(
      t => t === 'text/markdown' || t === 'text/plain'
    );
    const htmlIdx = types.findIndex(t => t === 'text/html');

    if (mdIdx === -1 || (htmlIdx !== -1 && htmlIdx < mdIdx)) {
      return env.ASSETS.fetch(request);
    }

    const url = new URL(request.url);
    const mdPath = `/md${url.pathname}${url.pathname.endsWith('/') ? '' : '/'}index.md`;

    try {
      const mdResponse = await env.ASSETS.fetch(
        new Request(new URL(mdPath, request.url))
      );
      if (!mdResponse.ok) return env.ASSETS.fetch(request);

      const body = await mdResponse.text();
      return new Response(body, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'X-Markdown-Tokens': String(Math.ceil(body.length / 4)),
          'Vary': 'Accept',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      return env.ASSETS.fetch(request);
    }
  },
};
```


### llms.txt Index

An `llms.txt` file at the root gives agents a directory of available content:

```
// src/feeds/llms.njk
---
permalink: /llms.txt
eleventyExcludeFromCollections: true
---
# {{ site.name }}

> {{ site.description }}

## Posts
{% for post in collections.posts %}
- [{{ post.data.title }}]({{ site.url }}{{ post.url }}): {{ post.data.description }}
{% endfor %}

## Docs
{% for doc in collections.docs %}
- [{{ doc.data.title }}]({{ site.url }}{{ doc.url }}): {{ doc.data.description }}
{% endfor %}
```


## The Shortcode Question

A design decision worth making explicit: **should agent markdown expand shortcodes or leave them raw?**

| Approach | Pros | Cons |
|----------|------|------|
| Raw shortcodes | Source of truth, no conversion needed | LLM sees `{% callout "warning" %}` syntax |
| Expand to HTML | Agent sees rendered custom elements | HTML in markdown defeats the purpose |
| Expand to markdown conventions | Agent sees `> **Warning:**` blockquotes | Lossy, but idiomatic markdown |

The pragmatic choice is **raw shortcodes** for now. LLMs handle Nunjucks template syntax fine — the semantic intent (`callout`, `warning`) is clear. If this becomes a problem, add a filter that converts shortcodes to markdown blockquote conventions.

An alternative: use markdown-native patterns from the start and style them with CSS:

```md
> [!WARNING]
> This API is experimental.
```

GitHub-style admonitions are increasingly understood by both renderers and LLMs. This avoids the shortcode question entirely and keeps content portable. The trade-off is less control over the HTML output — you're relying on the markdown renderer to produce something your CSS can target.


## Testing

```bash
# Build the site
npx @11ty/eleventy

# Verify HTML output
curl http://localhost:8080/posts/first-post/

# Verify markdown negotiation (via edge function)
curl -H "Accept: text/markdown" http://localhost:8080/posts/first-post/

# Check token estimate header
curl -sI -H "Accept: text/markdown" http://localhost:8080/posts/first-post/ \
  | grep X-Markdown-Tokens

# Verify discoverability
curl -s http://localhost:8080/posts/first-post/ \
  | grep 'rel="alternate".*text/markdown'
```


## What This Stack Does Not Need

- **No framework runtime** — custom elements self-upgrade via standard `customElements.define()`
- **No CSS build step** — native `@import`, `@layer`, nesting
- **No hydration** — HTML is the component; JS enhances, doesn't enable
- **No SSR mode** — everything is static files + thin edge function
- **No HTML-to-markdown conversion** — source markdown goes straight to agent output