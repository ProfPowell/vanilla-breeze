# Add Pattern

Create a new pattern in the pattern library.

## Arguments
- `$ARGUMENTS` - Pattern name in kebab-case (e.g., `hero`, `pricing-table`, `login-form`)

## Instructions

1. Ask which category the pattern belongs to:
   - `form` - Input and form components
   - `navigation` - Wayfinding elements
   - `content` - Display and presentation
   - `feedback` - Status and communication
   - `layout` - Structural organization
   - `data` - Data display patterns

2. Read `.claude/schemas/patterns.json` to check for existing patterns

3. Create the pattern documentation file at `.claude/patterns/{category}/{pattern-name}.md` using the template structure

4. Add the pattern entry to `.claude/schemas/patterns.json` with:
   - Basic metadata (name, category, description, status: "draft")
   - Anatomy parts
   - States (at minimum: default, hover, focus)
   - Basic accessibility requirements

5. If the pattern needs a custom element:
   - Add it to `.claude/schemas/elements.json` using the add-element pattern
   - Link it in the pattern definition

6. Create an example HTML file at `.claude/patterns/components/{pattern-name}.html`

## Pattern Documentation Template

```markdown
# {Pattern Name}

## Description

{What this pattern is and when to use it}

## Anatomy

- **{Part 1}**: {Description}
- **{Part 2}**: {Description}

## States

| State | Description |
|-------|-------------|
| Default | Normal resting state |
| Hover | Mouse over state |
| Focus | Keyboard focus state |

## Baseline HTML

\`\`\`html
<!-- Semantic HTML that works without JS -->
\`\`\`

## CSS

\`\`\`css
/* Component styles using design tokens */
\`\`\`

## Accessibility

- ARIA requirements
- Keyboard navigation

## Examples

### Basic Usage

\`\`\`html
<!-- Example -->
\`\`\`
```

## Pattern Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| form | Data input | text-field, login-form, search-field |
| navigation | Wayfinding | site-header, breadcrumbs, tabs |
| content | Display | hero, card, testimonial, faq-list |
| feedback | Status | alert, toast, modal, skeleton |
| layout | Structure | page-shell, sidebar-layout, card-grid |
| data | Data display | data-table, tree-view, calendar |

## Notes

- All patterns should work without JavaScript (baseline HTML)
- Use design tokens for all styling values
- Follow WCAG2AA accessibility requirements
- Include at least one complete example
