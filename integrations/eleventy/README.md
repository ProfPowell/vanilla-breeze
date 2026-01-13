# Vanilla Breeze Eleventy Integration

Nunjucks templates and partials for building Eleventy sites with Vanilla Breeze.

## Installation

1. Copy the `eleventy/` directory contents into your Eleventy project
2. Copy `.eleventy.js` to your project root (or merge with existing config)
3. Copy `_data/`, `_includes/`, and `_layouts/` into your `src/` directory

## Directory Structure

```
eleventy/
├── _includes/          # Nunjucks partials
│   ├── base.njk        # Base HTML template
│   ├── nav-tree.njk    # Tree navigation
│   ├── nav-main.njk    # Main header nav
│   ├── page-toc.njk    # Table of contents
│   ├── code-block.njk  # Code highlighting
│   ├── browser-window.njk
│   └── theme-toggle.njk
├── _data/              # Global data files
│   ├── site.json       # Site metadata
│   └── navigation.json # Navigation structure
├── _layouts/           # Page layouts
│   ├── page.njk        # Basic page
│   ├── docs.njk        # Documentation page
│   └── blog.njk        # Blog post
├── assets/
│   └── vb-eleventy.css # 11ty-specific styles
└── .eleventy.js        # Starter config
```

## Configuration

### Data Files

**`_data/site.json`** - Site metadata:
```json
{
  "title": "Site Name",
  "description": "Site description",
  "url": "https://example.com"
}
```

**`_data/navigation.json`** - Navigation structure:
```json
{
  "main": [
    { "label": "Home", "href": "/" },
    { "label": "Docs", "href": "/docs/" }
  ],
  "items": [
    { "label": "Getting Started", "href": "/docs/start/" },
    {
      "label": "Components",
      "children": [
        { "label": "Button", "href": "/docs/button/" }
      ]
    }
  ]
}
```

## Templates

### base.njk

Base HTML template. Extend with blocks:

```njk
{% extends "base.njk" %}

{% block content %}
  <h1>{{ title }}</h1>
  {{ content | safe }}
{% endblock %}
```

### Layouts

Use via front matter:

```md
---
layout: docs.njk
title: Page Title
description: Page description
---

# Content here
```

## Partials

### nav-tree.njk

Include in templates:
```njk
{% include "nav-tree.njk" %}
```

Override navigation data:
```njk
{% set navItems = customNavigation %}
{% include "nav-tree.njk" %}
```

### page-toc.njk

Requires `toc` data (use with eleventy-plugin-toc):
```njk
{% include "page-toc.njk" %}
```

## Shortcodes

### codeBlock

```njk
{% codeBlock "javascript", "example.js" %}
const greeting = "Hello";
{% endcodeBlock %}
```

### browserWindow

```njk
{% browserWindow "/demos/example.html", "https://example.com", "Demo" %}
```

### icon

```njk
{% icon "search", "sm" %}
```

## Filters

| Filter | Description |
|--------|-------------|
| `dateFormat` | Format date as "January 15, 2024" |
| `dateToISO` | Convert to ISO 8601 string |
| `slugify` | Convert string to URL slug |
| `startsWith` | Check if string starts with prefix |

## Styles

Import `vb-eleventy.css` after `main.css`:

```css
@import 'vanilla-breeze/main.css';
@import './assets/vb-eleventy.css';
```
