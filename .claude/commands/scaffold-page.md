# Scaffold Page

Create a new page using pattern compositions.

## Arguments
- `$ARGUMENTS` - Page type (e.g., `homepage`, `about`, `login`, `dashboard`)

## Instructions

1. Identify the page type and look up its composition in `patterns-plan.md`

2. Create the page file at the appropriate location:
   - Marketing pages: `src/{page-name}.html` or `.claude/patterns/pages/{page-name}.html`
   - App pages: `src/app/{page-name}.html` or `.claude/patterns/pages/{page-name}.html`

3. Include the standard page structure:
   - DOCTYPE and lang attribute
   - Meta tags (viewport, description)
   - Link to main.css
   - Semantic HTML structure (header, main, footer)

4. Compose the page using patterns from `.claude/schemas/patterns.json`:
   - Use pattern custom elements where available
   - Fall back to semantic HTML structure
   - Include appropriate ARIA landmarks

5. Add placeholder content using the `fake-content` patterns

## Page Templates Reference

### Marketing Pages

| Template | Patterns Used |
|----------|---------------|
| homepage | hero, feature-grid, testimonial, stats, cta |
| about | hero, team-grid, timeline, stats |
| contact | hero, contact-form |
| pricing | hero, pricing-table, faq-list |
| product-listing | hero, filter-form, product-card grid |
| blog-listing | hero, blog-card grid, pagination |
| faq | hero, faq-list |

### Application Pages

| Template | Patterns Used |
|----------|---------------|
| login | centered login-form |
| signup | centered signup-form |
| dashboard | dashboard-layout, stats, data-table |
| settings | sidebar-layout, settings-form |
| list-view | filter-form, data-table, pagination |
| error-404 | error-page |
| error-500 | error-page |

## Base Structure

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{Page Title}</title>
  <meta name="description" content="{Page description}"/>
  <link rel="stylesheet" href="/styles/main.css"/>
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>

  <site-header>
    <!-- Navigation -->
  </site-header>

  <main id="main">
    <!-- Page content using patterns -->
  </main>

  <site-footer>
    <!-- Footer content -->
  </site-footer>
</body>
</html>
```

## Notes

- Run html-validate after creation to verify structure
- Check accessibility with pa11y
- Use placeholder images from /add-picture for demos
