# Documentation Site Starter

Static documentation/knowledge base with sidebar navigation, search, and code highlighting.

## Features

- **Framework choice**: Astro (default) or Eleventy
- **Sidebar navigation**: Collapsible, fixed, or minimal styles
- **Site search**: Client-side search with Pagefind or Lunr
- **Code highlighting**: Shiki (VS Code themes) or highlight.js
- **Markdown content**: Write docs in Markdown with frontmatter
- **Responsive**: Mobile-friendly sidebar that collapses to menu

## Usage

```bash
/scaffold-docs
```

Or use the `/init` or `/scaffold` wizards and select "Documentation Site".

## Prompts

| Prompt | Type | Default | Description |
|--------|------|---------|-------------|
| PROJECT_NAME | string | - | Folder name (lowercase, hyphens) |
| SITE_NAME | string | - | Display name for the docs site |
| DESCRIPTION | string | - | SEO description (max 160 chars) |
| SITE_URL | string | https://docs.example.com | Production URL |
| FRAMEWORK | select | astro | astro or eleventy |
| ENABLE_SEARCH | boolean | true | Include site search |
| SIDEBAR_STYLE | select | collapsible | collapsible, fixed, or minimal |
| CODE_HIGHLIGHTING | select | shiki | shiki, highlight.js, or none |
| THEME_COLOR | string | #1e40af | Primary brand color |

## Structure (Astro)

```
src/
├── pages/
│   ├── index.astro          # Docs home/landing
│   └── docs/
│       └── [...slug].astro  # Dynamic doc pages
├── layouts/
│   ├── BaseLayout.astro     # HTML wrapper
│   └── DocsLayout.astro     # Sidebar + content
├── components/
│   ├── Sidebar.astro        # Navigation sidebar
│   ├── TOC.astro            # Table of contents
│   └── Search.astro         # Search component
├── content/
│   ├── config.ts            # Content collection schema
│   └── docs/                # Markdown documentation
│       ├── index.md
│       ├── getting-started/
│       └── guides/
└── styles/
    ├── _reset.css
    ├── _tokens.css
    └── docs.css
```

## Structure (Eleventy)

```
src/
├── _includes/
│   ├── layouts/
│   │   ├── base.njk         # HTML wrapper
│   │   └── docs.njk         # Sidebar + content
│   └── components/
│       ├── sidebar.njk      # Navigation sidebar
│       └── toc.njk          # Table of contents
├── _data/
│   ├── site.json            # Site metadata
│   └── navigation.js        # Sidebar structure
├── docs/
│   ├── index.md             # Docs home
│   ├── getting-started/
│   └── guides/
└── assets/
    └── styles/
```

## Skills Invoked

- `markdown-author` - Documentation writing patterns
- `xhtml-author` - Semantic HTML structure
- `typography` - Readable text hierarchy
- `metadata` - SEO and Open Graph tags
- `accessibility-checker` - WCAG2AA compliance
- `performance` - Core Web Vitals optimization
- `layout-grid` - Sidebar + main content layout
- `astro` or `eleventy` - Framework-specific patterns