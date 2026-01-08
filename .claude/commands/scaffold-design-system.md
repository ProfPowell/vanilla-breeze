# Scaffold Design System

Create a Web Component library with design tokens, documentation, and npm publishing setup.

## Usage

```
/scaffold-design-system [project-name]
```

## Arguments

- `project-name` (optional): Name for the project directory. If not provided, will prompt for it.

## What This Creates

A complete design system library with:

- **Design Tokens** - Colors, spacing, typography, effects as CSS custom properties
- **Primitive Components** - Button, Input, Card, Badge, Icon
- **Composite Components** - Dialog, Dropdown
- **Documentation Site** - Live examples and token reference
- **Visual Testing** - Playwright-based screenshot testing
- **npm Publishing** - Package.json with proper exports and build config

### Project Structure

```
project-name/
├── package.json            # npm publishing setup
├── vite.config.js          # Build configuration
├── vitest.config.js        # Unit test config
├── playwright.config.js    # Visual test config
├── README.md
├── src/
│   ├── index.js            # Main entry, exports all
│   ├── tokens/
│   │   ├── colors.css      # Color palette
│   │   ├── spacing.css     # Spacing scale
│   │   ├── typography.css  # Font properties
│   │   ├── effects.css     # Shadows, borders, transitions
│   │   └── index.css       # Imports all tokens
│   ├── primitives/
│   │   ├── button/         # Button component
│   │   ├── input/          # Input component
│   │   ├── card/           # Card component
│   │   ├── badge/          # Badge component
│   │   └── icon/           # Icon component
│   └── composites/
│       ├── dialog/         # Modal dialog
│       └── dropdown/       # Dropdown menu
├── docs/
│   ├── index.html          # Documentation home
│   └── tokens.html         # Token reference
└── test/
    ├── visual/             # Visual regression tests
    └── unit/               # Unit tests
```

## Instructions

1. Read the manifest at `.claude/starters/design-system/manifest.yaml`
2. Collect configuration using AskUserQuestion:
   - Project name (lowercase, hyphens)
   - Library name (npm package name, e.g., "acme-ui" or "@acme/design-system")
   - Display name (human-readable)
   - Description (max 160 chars)
   - Component prefix (e.g., "ds", "acme")
   - Theme color (default: #2563eb)
   - Include documentation site? (yes/no)
   - Include visual tests? (yes/no)
   - Author name (optional)
   - Author email (optional)
3. Create project directory
4. Copy template files
5. Replace all `{{PLACEHOLDER}}` variables with collected values
6. Copy shared resources from `_shared/`
7. Display success message with next steps

## Skills Used

This starter activates these skills:
- `custom-elements` - Web Component patterns
- `javascript-author` - Vanilla JS best practices
- `typography` - Type scale and fonts
- `open-props` - Design token patterns
- `layout-grid` - Layout systems
- `icons` - Icon integration
- `unit-testing` - Component unit tests
- `e2e-testing` - Visual regression testing
- `accessibility-checker` - WCAG compliance

## Example

```
User: /scaffold-design-system

Claude: Let's create a design system library! I'll need some information:

[Asks for project name]
User: acme-design-system

[Asks for library name]
User: @acme/design-system

[Asks for display name]
User: Acme Design System

[Asks for description]
User: Reusable UI components for Acme products

[Asks for component prefix]
User: acme

[Asks for theme color]
User: #0066cc

[Creates project]

Claude: Design system created successfully!

Your project is ready at: ./acme-design-system/

Next steps:
1. cd acme-design-system
2. npm install
3. npm run dev

Open http://localhost:3000/docs/ to see the documentation.
```

## Component API

### Button

```html
<ds-button variant="primary" size="md">Click me</ds-button>
```

| Attribute | Values | Description |
|-----------|--------|-------------|
| `variant` | primary, secondary, outline, ghost, danger | Visual style |
| `size` | sm, md, lg | Button size |
| `disabled` | boolean | Disabled state |
| `loading` | boolean | Loading state |
| `type` | button, submit, reset | Button type |

### Input

```html
<ds-input label="Email" type="email" required></ds-input>
```

| Attribute | Description |
|-----------|-------------|
| `label` | Label text |
| `type` | Input type (text, email, password, etc.) |
| `hint` | Helper text |
| `error` | Error message (shows error state) |
| `required` | Required field |
| `disabled` | Disabled state |

### Card

```html
<ds-card variant="elevated">
  <div slot="header">Title</div>
  <p>Content</p>
  <div slot="footer">Actions</div>
</ds-card>
```

| Attribute | Description |
|-----------|-------------|
| `variant` | default, outlined, elevated |
| `clickable` | Makes card interactive |
| `href` | Makes card a link |

### Badge

```html
<ds-badge variant="success" pill>Active</ds-badge>
```

| Attribute | Description |
|-----------|-------------|
| `variant` | default, primary, success, warning, error, info |
| `size` | sm, md, lg |
| `pill` | Rounded pill shape |
| `dot` | Dot indicator only |
| `solid` | Solid background |

### Dialog

```html
<ds-dialog id="my-dialog" label="Confirm">
  <div slot="header">Title</div>
  <p>Content</p>
  <div slot="footer">Buttons</div>
</ds-dialog>
```

Methods: `show()`, `close()`, `toggle()`

### Dropdown

```html
<ds-dropdown placement="bottom-start">
  <button slot="trigger">Menu</button>
  <button>Option 1</button>
  <button>Option 2</button>
</ds-dropdown>
```

| Attribute | Description |
|-----------|-------------|
| `placement` | bottom-start, bottom-end, top-start, top-end |
| `open` | Controls visibility |
