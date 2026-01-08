# Scaffold Documentation Site

Create a documentation site with sidebar navigation, search, and code highlighting.

## Usage

```
/scaffold-docs
```

## What This Command Does

1. **Collects configuration** via prompts:
   - Project name (folder name)
   - Site name (display title)
   - Description (for SEO)
   - Production URL
   - Framework choice (Astro or Eleventy)
   - Search enabled (yes/no)
   - Sidebar style (collapsible/fixed/minimal)
   - Code highlighting (Shiki/highlight.js/none)
   - Theme color

2. **Generates project files** from `.claude/starters/docs-site/`

3. **Sets up documentation structure**:
   - Getting Started section
   - Guides section
   - API Reference section
   - Sample content in each

4. **Runs post-scaffold commands**:
   - `npm install`

## Framework Options

### Astro (default)
- TypeScript support
- Content collections with schema validation
- Built-in image optimization
- Island architecture for interactive components
- Shiki syntax highlighting

### Eleventy
- Zero JavaScript by default
- Flexible templating (Nunjucks)
- Data cascade for configuration
- Simpler learning curve
- highlight.js for syntax highlighting

## Starter Location

`.claude/starters/docs-site/`

## Skills Invoked

- `markdown-author` - Documentation content patterns
- `xhtml-author` - Semantic HTML
- `typography` - Readable text hierarchy
- `metadata` - SEO and Open Graph
- `accessibility-checker` - WCAG2AA compliance
- `performance` - Core Web Vitals
- `layout-grid` - Sidebar + content layout
- `astro` or `eleventy` - Framework-specific patterns

## Example

```
User: /scaffold-docs

Claude: I'll help you create a documentation site.

What's the project folder name?
> my-project-docs

What's the site name?
> My Project Documentation

Description (max 160 chars)?
> Complete documentation for My Project including guides, tutorials, and API reference.

Production URL?
> https://docs.myproject.com

Which framework would you like?
○ Astro (Recommended)
○ Eleventy

Include site search?
○ Yes
○ No

Sidebar style?
○ Collapsible (Recommended)
○ Fixed
○ Minimal

Code syntax highlighting?
○ Shiki (Recommended)
○ highlight.js
○ None

Primary theme color?
> #1e40af

[Creates project files]

Claude: Documentation site created!

Structure:
├── src/
│   ├── content/docs/    # Your documentation
│   ├── layouts/         # Page layouts
│   ├── components/      # UI components
│   └── styles/          # CSS
├── astro.config.mjs
└── package.json

Next steps:
1. cd my-project-docs
2. npm install
3. npm run dev

Add documentation by creating .md files in src/content/docs/
```