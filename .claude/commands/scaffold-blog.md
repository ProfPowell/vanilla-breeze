# Scaffold Blog

Create a new blog project with markdown posts, RSS feed, categories, and tags.

## Usage

```
/scaffold-blog [project-name]
```

## Arguments

- `project-name` (optional): Name for the project directory. If not provided, will prompt for it.

## What This Creates

A complete blog with:

- **Framework choice**: Astro (default) or Eleventy
- **Markdown posts** with frontmatter (title, date, tags, description)
- **RSS/Atom feed** for subscribers
- **Tag system** with archive pages
- **Responsive design** with dark mode support
- **SEO optimized** with Open Graph and Twitter cards

### Astro Version

```
project-name/
├── astro.config.mjs
├── package.json
├── src/
│   ├── content/
│   │   ├── config.ts
│   │   └── posts/
│   │       ├── welcome.md
│   │       └── getting-started-with-markdown.md
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   ├── components/
│   │   ├── PostCard.astro
│   │   ├── TagList.astro
│   │   └── Pagination.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── blog/[...slug].astro
│   │   ├── tags/index.astro
│   │   ├── tags/[tag].astro
│   │   └── rss.xml.js
│   └── styles/
│       └── blog.css
└── README.md
```

### Eleventy Version

```
project-name/
├── eleventy.config.js
├── package.json
├── src/
│   ├── _data/
│   │   └── site.json
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── base.njk
│   │   │   └── post.njk
│   │   └── components/
│   │       └── post-card.njk
│   ├── posts/
│   │   ├── posts.json
│   │   ├── welcome.md
│   │   └── getting-started-with-markdown.md
│   ├── index.njk
│   ├── tags.njk
│   ├── tags-index.njk
│   ├── feed.njk
│   └── styles/
│       └── blog.css
└── README.md
```

## Instructions

1. Read the manifest at `.claude/starters/blog/manifest.yaml`
2. Collect configuration using AskUserQuestion:
   - Project name (lowercase, hyphens)
   - Blog name (display name)
   - Description (max 160 chars)
   - Author name
   - Author email (optional)
   - Framework (Astro or Eleventy)
   - Theme color (default: #1e40af)
   - Site URL (default: https://example.com)
   - Enable comments placeholder (yes/no)
3. Create project directory
4. Copy template files based on framework choice
5. Replace all `{{PLACEHOLDER}}` variables with collected values
6. Handle conditional blocks:
   - `{{#IF_ASTRO}}...{{/IF_ASTRO}}` for Astro-only content
   - `{{#IF_ELEVENTY}}...{{/IF_ELEVENTY}}` for Eleventy-only content
   - `{{#IF_ENABLE_COMMENTS}}...{{/IF_ENABLE_COMMENTS}}` for comments section
7. Copy shared resources from `_shared/`
8. Display success message with next steps

## Skills Used

This starter activates these skills:
- `markdown-author` - Quality markdown content
- `metadata` - SEO and social sharing
- `responsive-images` - Optimized images
- `i18n` - Internationalization ready
- `performance` - Core Web Vitals optimization
- `accessibility-checker` - WCAG compliance

## Example

```
User: /scaffold-blog

Claude: Let's create a new blog! I'll need some information:

[Asks for project name]
User: my-tech-blog

[Asks for blog name]
User: My Tech Blog

[Asks for description]
User: Thoughts on web development and technology

[Asks for author]
User: Jane Developer

[Asks for framework]
User: Astro

[Creates project]

Claude: Blog created successfully!

Your blog is ready at: ./my-tech-blog/

Next steps:
1. cd my-tech-blog
2. npm install
3. npm run dev

Write new posts by adding markdown files to src/content/posts/
```

## Post Frontmatter

When writing blog posts, use this frontmatter:

```markdown
---
title: "Post Title"
description: "Brief description for SEO (max 160 chars)"
date: 2024-01-15
tags:
  - topic
  - category
image: /images/hero.jpg  # Optional featured image
imageAlt: "Image description"  # Required if image provided
author: "Author Name"  # Optional, defaults to site author
draft: false  # Set true to hide in production
---

Post content here...
```