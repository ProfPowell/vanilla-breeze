# Description List Pattern

Display key-value pairs using semantic HTML description lists. Perfect for detail panels, settings displays, and profile information.

- Documentation: https://vanilla-breeze.com/docs/patterns/data/description-list/
- Vanilla Breeze 0.7.4

## Overview

Description lists provide a structured way to present pairs of labels and values. Using the semantic `<dl>`, `<dt>`, and `<dd>` elements ensures proper accessibility and document structure while providing flexibility for visual styling.

Key features:
- Semantic HTML for accessibility and SEO
- Flexible layouts: vertical stacking or horizontal rows
- Grouped sections for organized data presentation
- Consistent styling with muted labels and clear values
- Responsive design that adapts to screen size
- Uses `@scope` for encapsulated, semantic CSS selectors

## Simple Vertical Layout

A basic vertical description list with terms stacked above their descriptions, using `data-variant="stacked"`. A `<div>` groups each `<dt>`/`<dd>` pair.

No custom CSS: `data-variant="stacked"` mutes and shrinks each `<dt>`, drops the `<dd>` indent and spaces the groups.

Simple vertical description list:

```html
<dl data-variant="stacked">
  <div>
    <dt>Full Name</dt>
    <dd>Alexandra Chen</dd>
  </div>

  <div>
    <dt>Email Address</dt>
    <dd>alexandra.chen@example.com</dd>
  </div>

  <div>
    <dt>Phone Number</dt>
    <dd>+1 (555) 123-4567</dd>
  </div>

  <div>
    <dt>Status</dt>
    <dd>
      <layout-badge data-color="success" data-variant="subtle" data-size="l">Active</layout-badge>
    </dd>
  </div>
</dl>
```

## Horizontal Layout

A horizontal layout with labels on the left and values on the right. This format works well for detail panels, settings pages, and profile information where you want to scan labels quickly.

No custom CSS: `data-variant="horizontal"` puts terms and descriptions in two columns that line up across every row (each `<div>` is a subgrid), and falls back to a stacked flow below 16rem of available width. `data-bordered` draws the row separators; swap it for `data-striped` to alternate row backgrounds, or add `data-density="compact"` for dense data.

Horizontal description list:

```html
<dl data-variant="horizontal" data-bordered>
  <div>
    <dt>Full Name</dt>
    <dd>Alexandra Chen</dd>
  </div>

  <div>
    <dt>Email</dt>
    <dd>alexandra.chen@example.com</dd>
  </div>

  <div>
    <dt>Phone</dt>
    <dd>+1 (555) 123-4567</dd>
  </div>

  <div>
    <dt>Status</dt>
    <dd>
      <layout-badge data-color="success" data-variant="subtle" data-size="l">Active</layout-badge>
    </dd>
  </div>
</dl>
```

## Grouped Sections

Multiple description lists organized into logical sections with headings. Each section is a `<layout-card>` whose `<header>` child gives it a divided title bar. Ideal for profile pages, order details, or settings displays.

No custom CSS: a `<layout-card>` with a `<header>` child switches to its structured mode, which pads the header, sizes its heading and draws the divider.

Grouped description lists:

```html
<layout-stack data-layout-gap="l">
  <!-- Personal Information Section -->
  <layout-card data-padding="l">
    <header>
      <h2>Personal Information</h2>
    </header>
    <dl data-variant="horizontal" data-bordered>
      <div>
        <dt>Full Name</dt>
        <dd>Alexandra Chen</dd>
      </div>
      <div>
        <dt>Date of Birth</dt>
        <dd>March 15, 1992</dd>
      </div>
    </dl>
  </layout-card>

  <!-- Contact Details Section -->
  <layout-card data-padding="l">
    <header>
      <h2>Contact Details</h2>
    </header>
    <dl data-variant="horizontal" data-bordered>
      <div>
        <dt>Email</dt>
        <dd>alexandra.chen@example.com</dd>
      </div>
      <div>
        <dt>Phone</dt>
        <dd>+1 (555) 123-4567</dd>
      </div>
    </dl>
  </layout-card>
</layout-stack>
```

## Configuration

Description list patterns use these elements and CSS techniques:

## Usage Notes

- Semantic HTML: Always use `<dl>`, `<dt>`, and `<dd>` elements for proper accessibility. Screen readers announce these as description lists.
- No classes: The layouts are `data-variant` values on the `<dl>` itself, so the list stays plain `<dl>`/`<dt>`/`<dd>` markup.
- Item grouping: A `<div>` groups each term/description pair. This is valid HTML5 and enables grid layout for horizontal display.
- Multiple values: A single `<dt>` can have multiple `<dd>` elements for multiple values (e.g., multiple phone numbers).
- Responsive design: The horizontal variant is a container query: it stacks when the list itself is narrower than 16rem, wherever it sits on the page.
- Value formatting: Use badges, icons, or formatted text in `<dd>` elements to enhance readability.
- Empty values: Display a dash or "Not provided" for empty values rather than leaving blank.
- Long values: For long text values, consider truncation with a "show more" toggle or allowing text to wrap naturally.
- Actions: You can include edit links or buttons within `<dd>` elements for inline editing capabilities.

## Related

Metric cards and stat displays

User profile pages with description lists

Settings pages with grouped options
