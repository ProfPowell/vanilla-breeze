# Shared Resources

Common templates, styles, and components used across all project scaffolds.

## Contents

### Styles

- `styles/_reset.css` - Minimal CSS reset
- `styles/_tokens.css` - Core design tokens (subset of project-template's full system)

### Templates

HTML templates with `{{PLACEHOLDER}}` variables:

- `templates/html-head.html` - Common `<head>` content (meta, favicon, OG, styles)
- `templates/site-header.html` - Standard site header with skip link and nav
- `templates/site-footer.html` - Standard site footer
- `templates/error-pages/404.html` - Not found page
- `templates/error-pages/500.html` - Server error page (inline styles, no deps)
- `templates/error-pages/offline.html` - Offline fallback for PWAs

### Components

- `components/x-icon/` - Icon Web Component using Lucide icons

## Template Variables

All templates use `{{PLACEHOLDER}}` syntax:

| Variable | Description |
|----------|-------------|
| `{{SITE_NAME}}` | Site display name |
| `{{SITE_URL}}` | Production URL |
| `{{DESCRIPTION}}` | Site description (max 160 chars) |
| `{{AUTHOR}}` | Author or organization |
| `{{THEME_COLOR}}` | Brand color (hex) |
| `{{PAGE_TITLE}}` | Current page title |
| `{{SITE_TAGLINE}}` | Short tagline |
| `{{CURRENT_YEAR}}` | Current year for copyright |

### Conditional Sections

```html
{{#IF_HOME}}page{{/IF_HOME}}
{{#IF_ENABLE_AUTH}}...auth code...{{/IF_ENABLE_AUTH}}
```

## Extending Tokens

For the full design token system including themes, import from the project-template:

```css
@import "../../styles/tokens/_base.css" layer(tokens.base);
@import "../../styles/tokens/_semantic.css" layer(tokens.semantic);
@import "../../styles/tokens/themes/_brand-ocean.css" layer(tokens.theme);
```
