# Blog Starter

A full-featured blog with markdown posts, RSS feed, categories, and tags.

## Features

- **Markdown posts** with frontmatter metadata
- **RSS/Atom feed** for subscribers
- **Tags and categories** with archive pages
- **Responsive design** with mobile-first approach
- **SEO optimized** with Open Graph and Twitter cards
- **Accessible** following WCAG 2.1 AA guidelines
- **Fast** with optimized images and minimal JavaScript

## Framework Options

### Astro (Default)
- Islands architecture for optimal performance
- TypeScript support
- Content collections for type-safe posts
- Built-in image optimization

### Eleventy
- Zero JavaScript by default
- Nunjucks templating
- Lightweight and fast builds
- Maximum flexibility

## Project Structure

### Astro
```
src/
├── content/
│   └── posts/           # Markdown blog posts
├── layouts/
│   ├── BaseLayout.astro # HTML wrapper
│   └── PostLayout.astro # Single post template
├── components/
│   ├── PostCard.astro   # Post preview card
│   ├── TagList.astro    # Tag display
│   └── Pagination.astro # Page navigation
├── pages/
│   ├── index.astro      # Home/post list
│   ├── blog/[...slug].astro
│   ├── tags/[tag].astro
│   └── rss.xml.js       # RSS feed
└── styles/
    └── blog.css
```

### Eleventy
```
src/
├── posts/               # Markdown blog posts
├── _includes/
│   ├── layouts/
│   │   ├── base.njk     # HTML wrapper
│   │   └── post.njk     # Single post template
│   └── components/
│       └── post-card.njk
├── _data/
│   └── site.json        # Site configuration
├── index.njk            # Home page
├── tags.njk             # Tag archive
└── feed.njk             # RSS feed
```

## Writing Posts

Create markdown files with frontmatter:

```markdown
---
title: "My First Post"
date: 2024-01-15
description: "A brief introduction to my blog"
tags:
  - introduction
  - personal
image: /images/hero.jpg
draft: false
---

Your post content here...
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `date` | Yes | Publication date (YYYY-MM-DD) |
| `description` | Yes | SEO description (max 160 chars) |
| `tags` | No | Array of tag names |
| `image` | No | Featured image path |
| `draft` | No | Set true to hide from production |
| `author` | No | Override default author |

## Customization

### Adding Pages

Create new `.astro` or `.njk` files in the pages/src directory.

### Styling

Edit `src/styles/blog.css` for custom styles. The design uses CSS custom properties for easy theming.

### Comments

If comments were enabled, integrate with:
- [Giscus](https://giscus.app/) (GitHub Discussions)
- [Utterances](https://utteranc.es/) (GitHub Issues)
- [Disqus](https://disqus.com/)

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Skills Used

- `markdown-author` - Quality markdown content
- `metadata` - SEO and social sharing
- `responsive-images` - Optimized images
- `i18n` - Internationalization ready
- `performance` - Core Web Vitals optimization
- `accessibility-checker` - WCAG compliance