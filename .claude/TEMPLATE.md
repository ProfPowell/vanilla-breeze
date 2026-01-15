# Project Template

A web project template with validation, automation, and AI-assisted development for building accessible, semantic HTML websites and webapps.

## What This Template Provides

### AI Skills Integration

**54 Skills** - Guidance that activates when AI recognizes relevant context:

| Skill | Purpose |
|-------|---------|
| `xhtml-author` | XHTML-strict syntax, semantic HTML5 |
| `css-author` | `@layer`, `@import`, nesting, container queries, design tokens |
| `typography` | Type scale, hierarchy, rhythm, text-wrap, font pairing |
| `layout-grid` | Fluid grid systems, responsive columns, resolution-independent |
| `javascript-author` | Web Components, JSDoc, functional core |
| `typescript-author` | TypeScript patterns for Web Components and Node.js |
| `markdown-author` | Markdown structure and formatting |
| `content-author` | Quality content writing, spelling, grammar |
| `accessibility-checker` | WCAG2AA patterns |
| `custom-elements` | Custom element definitions |
| `forms` | Accessible form patterns with `<output>` |
| `data-attributes` | State management with `data-*` |
| `responsive-images` | `<picture>`, `srcset`, modern formats |
| `placeholder-images` | SVG placeholder generation for prototypes |
| `fake-content` | Realistic fake content with @faker-js/faker |
| `progressive-enhancement` | CSS-only interactivity, noscript patterns |
| `animation-motion` | Animations with prefers-reduced-motion |
| `performance` | Resource hints, Core Web Vitals |
| `print-styles` | `@media print` patterns for printable pages |
| `security` | CSP, SRI, XSS prevention |
| `metadata` | SEO, Open Graph, social sharing |
| `i18n` | Internationalization, lang, RTL |
| `patterns` | Reusable page patterns |
| `icons` | Lucide icon library with `<icon-wc>` |
| `service-worker` | Offline support, caching strategies, PWA |
| `unit-testing` | Node.js native test runner patterns |
| `e2e-testing` | Playwright browser testing patterns |
| `vitest` | Vitest testing framework patterns |
| `git-workflow` | Conventional commits, branching |
| `pre-flight-check` | Checklists and auto-invoke rules |
| `site-scaffold` | Standard site structure |
| `rest-api` | HTTP methods, status codes, versioning, OpenAPI |
| `nodejs-backend` | Express/Fastify, PostgreSQL, services pattern |
| `api-client` | Fetch API patterns, retry logic, caching |
| `data-storage` | localStorage, IndexedDB, SQLite WASM |
| `state-management` | Client-side state patterns for Web Components |
| `authentication` | JWT, sessions, OAuth, password hashing |
| `observability` | Error tracking, performance monitoring |
| `error-handling` | Consistent error patterns frontend and backend |
| `logging` | Structured client-side logging |
| `dependency-wrapper` | Testable wrappers for third-party libs |
| `database` | PostgreSQL schemas, migrations, seeding |
| `backend-testing` | API testing, database mocking, integration tests |
| `env-config` | Environment variable handling |
| `containerization` | Docker, docker-compose patterns |
| `deployment` | Deployment strategies and patterns |
| `ci-cd` | CI/CD pipeline patterns |
| `build-tooling` | Build tool configuration |
| `cli-author` | Zero-dependency CLI patterns (parseArgs, colors, exit codes) |
| `astro` | Astro framework patterns |
| `eleventy` | 11ty static site generator |
| `sanity-cms` | Sanity CMS integration |
| `open-props` | Open Props CSS framework |

**50 Slash Commands**:

| Command | Purpose |
|---------|---------|
| `/scaffold` | Interactive project scaffolding wizard |
| `/scaffold-site` | Scaffold static HTML/CSS/JS website |
| `/scaffold-astro` | Scaffold Astro site with content collections |
| `/scaffold-spa` | Scaffold PWA/SPA with Web Components |
| `/scaffold-api` | Scaffold Node.js REST API |
| `/scaffold-dashboard` | Scaffold admin dashboard |
| `/scaffold-extension` | Scaffold Chrome extension |
| `/scaffold-cli` | Scaffold Node.js CLI tool |
| `/scaffold-docs` | Scaffold documentation site |
| `/scaffold-blog` | Scaffold markdown blog |
| `/scaffold-form-builder` | Scaffold form builder app |
| `/scaffold-design-system` | Scaffold Web Component library |
| `/add-element` | Define custom HTML elements |
| `/add-pattern` | Create new UI pattern with documentation |
| `/scaffold-page` | Create page using pattern compositions |
| `/add-word` | Add words to spelling dictionary |
| `/add-picture` | Convert `<img>` to `<picture>` |
| `/placeholder-image` | Generate SVG placeholder images |
| `/fake-content` | Generate realistic fake content |
| `/fake-product` | Generate product data |
| `/fake-testimonial` | Generate testimonials |
| `/add-css-tokens` | Generate design token system |
| `/add-theme` | Create new brand theme with hue-based generation |
| `/switch-theme` | Apply theme or generate toggle component |
| `/list-themes` | Display available themes and configuration |
| `/add-css-file` | Create scoped CSS file |
| `/add-form-field` | Generate accessible form field |
| `/add-toc` | Generate table of contents |
| `/add-frontmatter` | Add YAML frontmatter |
| `/add-callout` | Insert callout block |
| `/add-code-block` | Insert fenced code block |
| `/scaffold-icons` | Set up Lucide icon library |
| `/health` | Project health dashboard |
| `/uat` | User acceptance testing workflow |
| `/add-endpoint` | Scaffold REST API endpoint with OpenAPI |
| `/add-error-boundary` | Add error boundary component |
| `/scaffold-backend` | Generate Node.js backend project |
| `/add-storage` | Generate client-side storage module |
| `/wrap-dependency` | Wrap third-party library for testing |
| `/add-noscript` | Add noscript fallback patterns |
| `/add-migration` | Create database migration file |
| `/scaffold-database` | Initialize database structure |
| `/add-seed` | Create database seed file |
| `/add-test` | Scaffold test file for a script |
| `/add-auth` | Scaffold JWT authentication flow |
| `/add-oauth` | Add OAuth provider integration |
| `/add-openapi` | Generate OpenAPI specification |
| `/add-schema` | Create JSON Schema for validation |
| `/add-proxy` | Scaffold third-party API proxy |
| `/add-rate-limit` | Add rate limiting to endpoints |

**PostToolUse Hooks** - Run automatically when Claude edits files:

- **Skill Injection**: Injects relevant skill guidance based on file type + content patterns
  - Detects forms, icons, fetch calls, Web Components, animations
  - Suggests supplementary skills when patterns match
- **HTML**: html-validate, htmlhint, pa11y (accessibility), semantic checks
- **CSS**: stylelint
- **JavaScript**: eslint, API checks
- **Markdown**: markdownlint, cspell
- **Config**: JSON/YAML validation

### Validation Scripts

| Command | Purpose |
|---------|---------|
| `npm run lint` | HTML validation |
| `npm run lint:css` | CSS linting + Baseline checking |
| `npm run lint:js` | JavaScript linting |
| `npm run lint:markdown` | Markdown linting |
| `npm run lint:spelling` | Spell check |
| `npm run lint:grammar` | Grammar check |
| `npm run lint:readability` | Readability scoring |
| `npm run lint:content` | Combined spelling+grammar+readability |
| `npm run lint:images` | Image optimization check |
| `npm run lint:links` | Local link validation |
| `npm run lint:links:remote` | Remote URL validation |
| `npm run lint:meta` | Metadata validation |
| `npm run lint:jsonld` | JSON-LD structured data |
| `npm run lint:seo` | SEO content analysis |
| `npm run lint:complexity` | JavaScript complexity |
| `npm run lint:budget` | Resource budget checks |
| `npm run lint:vitals` | Web Vitals analysis |
| `npm run lint:site` | Site-wide checks |
| `npm run lint:manifest` | PWA manifest validation |
| `npm run lint:darkmode` | Dark mode token coverage |
| `npm run lint:fonts` | Web font loading validation |
| `npm run lint:api` | REST API endpoint checks |
| `npm run lint:schema` | Database schema validation |
| `npm run lint:observability` | Error handling patterns |
| `npm run lint:noscript` | Noscript fallback checks |
| `npm run a11y` | Accessibility testing |
| `npm run lint:all` | All validators |
| `npm run lint:changed` | Incremental (changed files) |
| `npm run lint:staged` | Staged files only |
| `npm run health` | Health dashboard |
| `npm run lighthouse` | Lighthouse CI |
| `npm test` | Run test suite |
| `npm run test:watch` | Test with watch mode |
| `npm run test:coverage` | Test coverage check |
| `npm run optimize:images` | Optimize images |
| `npm run generate:tokens` | Document design tokens |
| `npm run generate:a11y` | Generate a11y statement |
| `npm run generate:patterns` | Generate pattern docs |
| `npm run generate:placeholder` | Generate SVG placeholders |
| `npm run generate:fake-content` | Generate fake content data |

### Issue Tracking

Beads (`bd`) for AI-native issue tracking:

```bash
bd create --title="Add feature" --type=feature
bd ready                # Find work
bd update <id> --status in_progress
bd close <id>
```

### Pattern Library

**50+ UI Patterns** defined in `.claude/schemas/patterns.json` with examples in `.claude/patterns/`:

| Category | Patterns |
|----------|----------|
| **Navigation** | site-header, site-footer, breadcrumbs, skip-link |
| **Layout** | layout-stack, layout-sidebar, dashboard-layout, split-layout, card-grid, masonry, stack, cluster, content-width, full-bleed, divider, spacer |
| **Content** | hero, card, blog-card, product-card, testimonial, stats, cta, logo-cloud, feature-grid, faq-list |
| **Feedback** | alert, banner, toast, modal, popover, empty-state, skeleton, progress-bar |
| **Data** | data-table, data-list, definition-list, key-value, comparison-table, tree-view, calendar, chart-wrapper |

Each pattern includes:
- Semantic HTML structure with custom element wrappers
- Anatomy documentation (required/optional parts)
- State definitions (default, hover, loading, etc.)
- Variants via `data-*` attributes
- Accessibility requirements (ARIA, keyboard navigation)
- Related patterns for composition

**20 Page Templates** in `.claude/patterns/pages/`:

| Type | Templates |
|------|-----------|
| **Marketing** | homepage, about, contact, pricing, faq, legal, product-listing, product-detail, blog-listing, blog-post, press |
| **Application** | login, signup, dashboard, settings, profile, list-view, detail-view, error-404, error-500 |

Templates demonstrate pattern composition with shared CSS in `templates.css`.

**Usage:**

```bash
# Generate pattern documentation
npm run generate:patterns

# Create a new pattern
/add-pattern

# Scaffold a page using patterns
/scaffold-page
```

### Component Library

**Atomic UI Components** in `.claude/patterns/components/` bridging design tokens and patterns:

```
Templates (pages)
    ↓ composed of
Patterns (card, hero, sidebar)
    ↓ composed of
Components (button, badge, input)   ← Component Library
    ↓ styled by
Tokens (colors, spacing, type)
```

| Category | Components |
|----------|------------|
| **Core** | button, link, badge, avatar |
| **Forms** | input, select, textarea, checkbox, radio, toggle |
| **Data Display** | tag, spinner, progress-bar |
| **Interactive** | tabs, pagination |

**Key Principles:**

- **HTML-first**: Native elements work without JavaScript
- **Data Attributes**: Variants via `data-*` not CSS classes (e.g., `data-button="primary"`)
- **Token-based**: All values from design tokens
- **Accessible**: WCAG2AA, keyboard navigation, screen reader support
- **Custom Elements**: Semantic wrappers like `<user-avatar>`, `<tag-item>`, `<tab-group>`

**Usage:**

```html
<!-- Button variants -->
<button data-button="primary">Save</button>
<button data-button="secondary">Cancel</button>
<button data-button="ghost">Reset</button>

<!-- Status badge -->
<status-badge data-status="success">Active</status-badge>

<!-- Avatar with status -->
<user-avatar data-size="large" data-status="online">JD</user-avatar>

<!-- Toggle switch -->
<form-field data-type="toggle">
  <label>
    <span>Enable notifications</span>
    <input type="checkbox" role="switch" />
    <span data-toggle-track>
      <span data-toggle-thumb></span>
    </span>
  </label>
</form-field>
```

Browse the [Component Gallery](.claude/patterns/components/index.html) for all components with examples.

### Project Scaffolds

**12 Project Starters** in `.claude/starters/` for quickly scaffolding new projects:

| Starter | Description | Command |
|---------|-------------|---------|
| **Static Website** | Multi-page HTML/CSS/JS site | `/scaffold-site` |
| **Astro Site** | Astro framework with content collections | `/scaffold-astro` |
| **PWA/SPA** | Single-page app with Web Components + router | `/scaffold-spa` |
| **REST API** | Node.js backend with Express/PostgreSQL | `/scaffold-api` |
| **Dashboard** | Admin interface with sidebar layout | `/scaffold-dashboard` |
| **Chrome Extension** | Browser extension with Manifest V3 | `/scaffold-extension` |
| **CLI Tool** | Node.js command-line tool | `/scaffold-cli` |
| **Documentation Site** | Static docs with sidebar and search | `/scaffold-docs` |
| **Blog** | Markdown blog with RSS, tags, social sharing | `/scaffold-blog` |
| **Form Builder** | Dynamic forms with validation, conditional logic | `/scaffold-form-builder` |
| **Design System** | Web Component library with tokens and docs | `/scaffold-design-system` |
| **E-commerce** | Product catalog with cart, checkout, orders | `/scaffold-ecommerce` |

Each starter includes:
- `manifest.yaml` defining prompts and configuration
- Template files with `{{PLACEHOLDER}}` variables
- Shared resources from `.claude/starters/_shared/`
- Skills integration for consistent development

**Usage:**

```bash
/init               # Project initialization wizard
/scaffold           # Interactive scaffold wizard
/scaffold-site      # Static website
/scaffold-spa       # PWA/SPA application
```

See the [starters/README.md](.claude/starters/README.md) for detailed documentation.

### Design Token System

**Layered token architecture** in `.claude/styles/tokens/` providing a neutral foundation with multi-theme support:

```
.claude/styles/tokens/
├── _base.css           # Neutral primitives (grays, spacing, typography)
├── _semantic.css       # Purpose-driven aliases using light-dark()
├── _components.css     # Component-specific tokens
├── themes/
│   ├── _light.css      # Light mode (default)
│   ├── _dark.css       # Dark mode + system preference
│   ├── _brand-ocean.css    # Teal-blue theme
│   ├── _brand-forest.css   # Green/earthy theme
│   └── _brand-sunset.css   # Warm orange theme
└── tokens.json         # Programmatic access
```

**Token Layers:**

| Layer | Purpose |
|-------|---------|
| Base | Neutral primitives - vanilla foundation with no opinions |
| Semantic | Purpose-driven aliases (`--primary`, `--text`, `--surface`) |
| Components | Derived tokens for specific UI components |
| Theme | Brand variants that override semantic tokens |

**Key Features:**

- **OKLCH colors** for perceptual uniformity
- **`light-dark()` function** for automatic theme switching
- **Hue variables** (`--hue-primary`) for easy theme generation
- **CSS `:has()` selector** for JavaScript-free theme toggling
- **Data attributes** (`data-theme`, `data-mode`) for theme application

**Available Themes:**

| Theme | Attribute | Description |
|-------|-----------|-------------|
| Light | `data-mode="light"` | Force light color scheme |
| Dark | `data-mode="dark"` | Force dark color scheme |
| Auto | (default) | Follow system preference |
| Ocean | `data-theme="ocean"` | Calm teal-blue (hue: 200) |
| Forest | `data-theme="forest"` | Natural green (hue: 145) |
| Sunset | `data-theme="sunset"` | Warm orange (hue: 25) |

**Usage:**

```html
<!-- Default (system preference) -->
<html lang="en">

<!-- Force dark mode -->
<html lang="en" data-mode="dark">

<!-- Brand theme with dark mode -->
<html lang="en" data-theme="ocean" data-mode="dark">
```

**Commands:**

```bash
/list-themes          # Show available themes
/add-theme {name}     # Create new brand theme
/switch-theme {name}  # Apply theme or generate toggle
```

## Quick Start

1. **Clone this template**

```bash
git clone <this-repo> my-project
cd my-project
npm install
```

2. **Initialize your project**

```bash
/init
```

The initialization wizard will:
- Ask what type of project you want to create
- Collect project configuration
- Scaffold the appropriate files
- Display next steps

3. **Start building**

Open with an AI assistant. The skills and hooks will guide your development.

```bash
npm run dev        # Start development
npm run lint       # Validate code
npm run test       # Run tests
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.config/htmlvalidate.json` | XHTML validation rules |
| `.config/htmlhint.json` | HTML linting |
| `.config/pa11yci.json` | Accessibility (WCAG2AA) |
| `.config/stylelint.json` | CSS linting |
| `.config/eslint.config.js` | JavaScript linting |
| `.config/cspell.json` | Spell checking |
| `.config/textlint.json` | Grammar checking |
| `.config/markdownlint.json` | Markdown linting |
| `.config/lighthouserc.json` | Lighthouse CI |
| `.config/project-words.txt` | Custom dictionary |
| `.claude/schemas/elements.json` | Custom element definitions |
| `.claude/schemas/patterns.json` | UI pattern definitions |

## Customization

### Add Custom Elements

Edit `.claude/schemas/elements.json`:

```json
{
  "my-component": {
    "flow": true,
    "permittedContent": ["@flow"],
    "attributes": {
      "variant": { "enum": ["primary", "secondary"] }
    }
  }
}
```

### Add Dictionary Words

Edit `.config/project-words.txt` or use `/add-word`:

```
MyBrandName
kubernetes
microservice
```

### Adjust Accessibility Standard

Edit `.config/pa11yci.json`:

```json
{
  "defaults": {
    "standard": "WCAG2AAA"
  }
}
```

## Philosophy

**For sites, HTML first, CSS for enhancement, JavaScript when necessary.**

- Use semantic HTML5 elements
- Apply XHTML-strict syntax (self-closing tags, lowercase, quoted attributes)
- Use custom elements as semantic wrappers
- Enforce WCAG2AA accessibility
- Design with i18n in mind as much as possible
- Use `data-*` attributes for state (not classes)
- Apply CSS `@layer` for cascade control
- Build responsive images with `<picture>` and `srcset`
- Front-end is always considered insecure, so validation on user input is for the interface, and real validation is server-side.  State and storage are assumed to be tampered with, so only low-importance data is generally stored locally, such as user visual settings.
- JavaScript is used to enhance primarily, and if it is required, we substitute or warn properly
- Web components are used to extend functionality when needed

**For apps, JavaScript can be first, but should never reinvent HTML or CSS, but emit quality versions of it and always gracefully degrade or fail.**

- Utilize modern JavaScript with reasonable decomposition
- JSDocs used throughout for type hints and documentation
- Functional core with imperative shell philosophy using declarative JSON structures for configuration
- Unit tests for quality of core functions
- E2E tests for quality for executed features
- Network is considered a progressive enhancement (offline possibility)
- Backends are decoupled where possible.
	- Backends written in NodeJS (preferred) or PHP (acceptable)
	- Backend data stores are assumed to PostgeSQL ([https://www.postgresql.org/](https://www.postgresql.org/)) unless otherwise stated.
		- Front-end data stores use an abstraction utilizing a simple key-value system for setting like localStorage or something more signification like SQLite (WASM based for browsers) for large data sets.
	- REST endpoints
		- This our assumed solution and not GraphQL.  If we see network cascade or significant spread we refactor or consolidate
			- We allow for a RPC style where it makes sense
		- REST endpoints should support `x-www-form-urlencoded` and JSON requests
		- REST endpoints generally rely on the full HTTP method / verb list, but in degraded GET and POST only situations such as progressive enhancement use a special sent value of `API_METHOD` to represent the methods that can't be set in non-JavaScript enhancement HTML forms (`PUT`, `DELETE`, and `PATCH`) or may be blocked for security reasons.
		- REST endpoints use appropriate status HTTP status codes
		- REST endpoints are versioned using headers, unless major changes and then a URL change may be allowed
		- REST endpoints respond with JSON or fully rendered HTML
			- For large JSON use we may use a streamed JSON format
		- REST endpoints are documented with OpenAPI and JSON Schema
		- First party REST endpoints may front 3rd Party dependencies as proxies to keep secrets safe and allow for replacements
		- REST endpoints have rate limitation and access controls such as token authentication
	- Authentication
		- We aim for simplicity in authentication and avoiding common security issues
		- Use known systems
		- Allow for OAuth but carefully
- Favor the use of platform APIs first - use what the platform gives us
- When using a dependency wrap the dependency for testing and replacement purposes with dependency injection style or wrapped approach
- Favor low dependency or free of dependencies solutions
- Use of `<noscript>`, JS polyfills, and capability detection for no support or degraded support situations
- Observability scripts to catch run-time errors, user issues, and performance problems

## Requirements

- Node.js 18+
- npm
- AI assistant with `.claude/` support (for skill and hook integration)
- bd (beads) for issue tracking: `brew install steveyegge/beads/bd`
