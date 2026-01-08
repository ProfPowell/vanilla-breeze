# Astro Static Site Starter

A static site built with Astro, featuring content collections, component islands, and optimal performance.

## Features

- Astro 4.x with content collections
- TypeScript support
- Markdown/MDX content
- Component islands for interactivity
- Automatic sitemap generation
- SEO-optimized
- Design tokens integration

## Structure

```
project/
├── astro.config.mjs        # Astro configuration
├── package.json
├── tsconfig.json
├── src/
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── 404.astro
│   │   └── blog/
│   │       ├── index.astro
│   │       └── [...slug].astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── Card.astro
│   ├── content/
│   │   ├── config.ts
│   │   └── blog/
│   │       └── first-post.md
│   └── styles/
│       ├── global.css
│       ├── _reset.css
│       └── _tokens.css
└── public/
    ├── favicon.svg
    └── robots.txt
```

## Usage

### Create with command

```bash
/scaffold-astro my-blog
```

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview
```

## Content Collections

Add content to `src/content/blog/`:

```markdown
---
title: "My First Post"
description: "An introduction to the blog"
pubDate: 2024-01-01
tags: ["intro"]
---

# Hello World

This is my first blog post!
```

## Customization

### Adding Pages

Create `.astro` files in `src/pages/`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="New Page">
  <h1>New Page</h1>
</BaseLayout>
```

### Adding Components

Create components in `src/components/`:

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<article class="card">
  <h2>{title}</h2>
  <slot />
</article>
```

## Skills Invoked

- `astro` - Astro framework patterns
- `xhtml-author` - Semantic HTML
- `css-author` - CSS organization
- `metadata` - SEO meta tags
- `accessibility-checker` - WCAG2AA
