# Static Website Starter

A multi-page static website with semantic HTML, design tokens, and built-in accessibility.

## Features

- Semantic HTML5 structure
- CSS @layer cascade organization
- Design tokens for consistent styling
- Responsive, mobile-first layout
- WCAG2AA accessibility
- SEO-optimized metadata
- PWA-ready manifest
- Error pages (404, 500)

## Structure

```
project/
├── index.html              # Homepage
├── about.html              # About page
├── contact.html            # Contact page
├── 404.html                # Not found error
├── 500.html                # Server error
├── robots.txt              # Search engine directives
├── sitemap.xml             # XML sitemap
├── manifest.json           # PWA manifest
├── styles/
│   ├── main.css            # Entry point with @layer
│   ├── _reset.css          # CSS reset
│   └── _tokens.css         # Design tokens
├── scripts/
│   └── main.js             # Progressive enhancement
├── components/
│   └── icon-wc/             # Icon component
└── images/
    ├── favicon.svg         # Vector favicon
    ├── logo.svg            # Site logo
    └── og-image.png        # Social sharing image
```

## Usage

### Create with command

```bash
/scaffold-site my-company
```

### Prompts

| Prompt | Description |
|--------|-------------|
| Project name | Folder name (lowercase, hyphens) |
| Site name | Display name |
| Production URL | Full URL with https:// |
| Description | SEO description (max 160 chars) |
| Author | Author or organization |
| Theme color | Brand color (#hex) |
| Pages | Comma-separated page list |

### Development

```bash
# Serve locally
npx serve src

# Or use any static server
python -m http.server 8000 --directory src
```

## Customization

### Adding Pages

1. Copy an existing page as template
2. Update the `<title>` and meta description
3. Update navigation `aria-current` attributes
4. Add to sitemap.xml

### Changing Theme

Edit `styles/_tokens.css`:

```css
:root {
  --hue-primary: 200;  /* Change brand hue */
  --primary: oklch(0.55 0.2 var(--hue-primary));
}
```

Or import a theme:

```css
@import "../../styles/tokens/themes/_brand-ocean.css" layer(tokens.theme);
```

### Adding Icons

Use the icon-wc component:

```html
<script type="module" src="/components/icon-wc/icon-wc.js"></script>
<icon-wc name="menu" size="md"></icon-wc>
```

## Skills Invoked

- `xhtml-author` - Semantic HTML patterns
- `css-author` - CSS organization
- `metadata` - SEO and social meta tags
- `accessibility-checker` - WCAG2AA compliance
- `i18n` - Internationalization ready
- `performance` - Core Web Vitals optimization
