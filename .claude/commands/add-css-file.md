# Add CSS File

Create a new CSS file in the appropriate location based on its scope, and add the `@import` to the main stylesheet.

## Arguments
- `$ARGUMENTS` - The scope and name: `<scope> <name>`
  - Scopes: `component`, `section`, `page`

## Instructions

1. Parse the scope and name from arguments
2. Create the CSS file in the correct directory:
   - `component` → `styles/components/_<name>.css`
   - `section` → `styles/sections/_<name>.css`
   - `page` → `styles/pages/_<name>.css`
3. Add a starter template with the appropriate layer
4. Add the `@import` statement to `main.css` in the correct location
5. Report what was created

## Directory Structure

```
styles/
├── main.css                 # Entry point
├── _reset.css
├── _tokens.css
├── _layout.css
├── components/
│   ├── _gallery.css
│   ├── _tag-list.css
│   └── _<new-component>.css
├── sections/
│   ├── _header.css
│   ├── _footer.css
│   └── _<new-section>.css
└── pages/
    ├── _home.css
    ├── _blog.css
    └── _<new-page>.css
```

## Component Template

```css
/**
 * <Name> Component
 * Description of what this component does
 */

<name>-element {
  /* Base styles */
}

<name>-element > * {
  /* Child element styles */
}
```

## Section Template

```css
/**
 * <Name> Section
 * Site-wide section styles
 */

.<name>-section {
  /* Layout */
}

.<name>-section > * {
  /* Content styles */
}
```

## Page Template

```css
/**
 * <Name> Page Styles
 * Styles specific to the <name> page
 */

.page-<name> {
  /* Page-specific styles */
}
```

## Import Statement

Add to `main.css`:
```css
@import "components/_<name>.css" layer(components);
@import "sections/_<name>.css" layer(sections);
@import "pages/_<name>.css" layer(pages);
```

## Usage Examples

```
/add-css-file component card-grid
/add-css-file section hero
/add-css-file page product-detail
```

## Notes

- Use the underscore prefix (`_`) for partials
- Files are automatically assigned to the appropriate layer
- The layer order is defined in `main.css`: reset, tokens, layout, sections, components, pages, responsive
