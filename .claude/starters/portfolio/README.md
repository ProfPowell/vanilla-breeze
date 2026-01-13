# {{SITE_NAME}} Portfolio

Personal portfolio site built with Vanilla Breeze.

## Getting Started

```bash
npm install
npm run dev
```

## Structure

```
src/
├── _includes/         # Templates and partials
│   ├── layouts/       # Page layouts
│   └── components/    # Reusable components
├── _data/             # Site data (site.json)
├── projects/          # Project case studies (markdown)
├── styles/            # CSS files
├── images/            # Image assets
├── index.njk          # Homepage
├── about.njk          # About page
└── contact.njk        # Contact page
```

## Adding Projects

Create new markdown files in `src/projects/` with the following frontmatter:

```yaml
---
title: "Project Title"
description: "Brief project description"
image: "/images/project-image.jpg"
tags:
  - Design
  - Development
order: 1
year: 2024
client: "Client Name"
role: "Your Role"
---

Project content goes here...
```

## Customization

### Site Data

Edit `src/_data/site.json` to update:
- Site name and tagline
- Social links
- Contact information

### Styling

Modify design tokens in `src/styles/_tokens.css`:

```css
:root {
  --color-primary: {{THEME_COLOR}};
}
```

### Adding Images

Place images in `src/images/` and reference them with `/images/filename.jpg`.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## License

MIT
