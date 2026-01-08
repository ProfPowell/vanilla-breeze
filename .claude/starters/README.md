# Project Starters

Boilerplate templates for common project types. Each starter is designed to integrate with the project-template's skills, patterns, and design tokens.

## Available Starters

| Starter | Command | Description |
|---------|---------|-------------|
| [Static Website](./static-standard/) | `/scaffold-site` | Multi-page static site with semantic HTML |
| [Astro Site](./static-astro/) | `/scaffold-astro` | Static site with Astro framework |
| [PWA/SPA](./pwa-spa/) | `/scaffold-spa` | Single-page app with Web Components + router |
| [REST API](./rest-api/) | `/scaffold-api` | Node.js backend with Express/PostgreSQL |
| [Dashboard](./dashboard/) | `/scaffold-dashboard` | Admin interface with sidebar layout |
| [Chrome Extension](./chrome-extension/) | `/scaffold-extension` | Browser extension (Manifest V3) |
| [CLI Tool](./cli-tool/) | `/scaffold-cli` | Node.js CLI with zero dependencies |
| [Documentation Site](./docs-site/) | `/scaffold-docs` | Static docs with sidebar, search, code highlighting |
| [Blog](./blog/) | `/scaffold-blog` | Markdown blog with RSS, tags, social sharing |
| [Form Builder](./form-builder/) | `/scaffold-form-builder` | Dynamic forms with validation, conditional logic |
| [Design System](./design-system/) | `/scaffold-design-system` | Web Component library with tokens and docs |
| [E-commerce](./ecommerce/) | `/scaffold-ecommerce` | Product catalog with cart, checkout, orders |

## Usage

### Interactive Wizard

```bash
/scaffold
```

Presents a menu to choose the starter type interactively.

### Direct Commands

```bash
/scaffold-site my-company-site
/scaffold-spa task-manager
/scaffold-api user-service
```

## Shared Resources

All starters reference common resources from [`_shared/`](./_shared/):

- **Styles**: CSS reset and design tokens
- **Templates**: HTML head, header, footer, error pages
- **Components**: x-icon Web Component

## Design Principles

All starters follow the project-template philosophy:

- **HTML-first**: Semantic, accessible markup
- **Progressive enhancement**: Works without JavaScript
- **Design tokens**: Consistent styling via CSS custom properties
- **WCAG2AA**: Built-in accessibility
- **i18n-ready**: Proper lang attributes and text handling
- **Performance**: Optimized for Core Web Vitals

## Starter Structure

Each starter includes:

```
starter-name/
├── manifest.yaml       # Prompts, includes, skills
├── README.md           # Usage documentation
└── src/                # Template files with {{PLACEHOLDERS}}
```

### manifest.yaml

Defines the scaffold configuration:

```yaml
name: starter-name
displayName: "Human Readable Name"
description: "What this starter creates"

prompts:
  - key: PROJECT_NAME
    label: "Project name"
    required: true
  - key: THEME_COLOR
    label: "Theme color"
    default: "#1e40af"

includes:
  - from: _shared/styles/_reset.css
    to: styles/_reset.css

skills:
  - xhtml-author
  - css-author
  - accessibility-checker
```

## Template Variables

Templates use `{{PLACEHOLDER}}` syntax:

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Folder/package name |
| `{{SITE_NAME}}` | Display name |
| `{{DESCRIPTION}}` | Project description |
| `{{THEME_COLOR}}` | Brand color (hex) |
| `{{SITE_URL}}` | Production URL |
| `{{AUTHOR}}` | Author/organization |
| `{{CURRENT_YEAR}}` | Current year |

### Conditionals

```html
{{#IF_ENABLE_AUTH}}
<script src="/src/app/auth.js" type="module"></script>
{{/IF_ENABLE_AUTH}}
```

## Customization

### Adding a New Starter

1. Create directory: `starters/my-starter/`
2. Add `manifest.yaml` with prompts and configuration
3. Create template files with `{{PLACEHOLDER}}` syntax
4. Create command: `.claude/commands/scaffold-my-starter.md`
5. Update this README

### Extending Tokens

Import the full token system for themes:

```css
@import "../../styles/tokens/_base.css" layer(tokens.base);
@import "../../styles/tokens/_semantic.css" layer(tokens.semantic);
@import "../../styles/tokens/themes/_brand-ocean.css" layer(tokens.theme);
```
