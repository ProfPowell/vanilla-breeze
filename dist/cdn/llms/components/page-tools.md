# <page-tools>

Configurable toolbar for page-level utilities

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/page-tools/
- Vanilla Breeze 0.7.4

## Example

```html
<aside>
  <page-toc levels="h2,h3" scope="article"></page-toc>
  <page-tools data-position="sticky">
    <print-page></print-page>
    <share-wc variant="icon" size="s"></share-wc>
  </page-tools>
</aside>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-position` | `sticky`, `fixed`, `inline` | `sticky` | Positioning strategy |
| `data-orientation` | `auto`, `vertical`, `horizontal` | `auto` | Tool strip direction; auto resolves to horizontal for inline, vertical otherwise. Re-resolved when changed |
| `data-gap` | `2xs`, `xs`, `s`, `m`, `l` | `s` | Gap token between tools |
| `data-fab-icon` | string | `ellipsis-vertical` | Icon name for the mobile FAB |
| `data-fab-label` | string | `Page tools` | Accessible label for the FAB and its popover panel |
| `data-breakpoint` | string | `48rem` | Viewport width at or below which the toolbar collapses to a FAB |
| `data-resolved-orientation` | `vertical`, `horizontal` |  | Reflected effective orientation (data-orientation resolved against data-position) |
| `data-collapsed` | boolean |  | Present while the toolbar is collapsed to the FAB (viewport at or below data-breakpoint) |

## Structure

| Child | Description |
| --- | --- |
| `button.page-tools-fab` | Generated FAB (popovertarget → panel); visible only while collapsed. Internal (data-page-tools-internal) |
| `section.page-tools-popover[popover]` | Generated popover panel that holds the tools while collapsed. Internal (data-page-tools-internal) |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `tools` | `Element[]` | The tool elements (author children, excluding the generated FAB and popover; read from the popover while collapsed) |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--page-tools-gap` | Gap between tools (set by data-gap) |
| `--page-tools-offset` | Sticky top offset / fixed inline-end offset |
| `--page-tools-button-padding` | Padding of normalised icon tool buttons |
| `--page-tools-icon-size` | Icon size inside tool buttons (default 1.25rem) |
| `--page-tools-fab-size` | FAB diameter (default 3rem) |
| `--page-tools-fab-bottom` | FAB distance from the viewport block-end edge |
| `--page-tools-fab-end` | FAB distance from the viewport inline-end edge |

## Accessibility

- Pattern: Toolbar
- You provide: Child controls that each have an accessible name
- The component manages: `role="toolbar"`, `aria-label`, `aria-orientation`, `tabindex`, `aria-hidden`, `popover`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowRight` | Move to the next tool, wrapping (reversed in right-to-left) | Horizontal toolbar |
| `ArrowLeft` | Move to the previous tool, wrapping (reversed in right-to-left) | Horizontal toolbar |
| `ArrowDown` | Move to the next tool, wrapping | Vertical toolbar or collapsed panel |
| `ArrowUp` | Move to the previous tool, wrapping | Vertical toolbar or collapsed panel |
| `Home` | Move to the first tool |  |
| `End` | Move to the last tool |  |
| `Escape` | Close the collapsed panel and return focus to the floating button | Native behaviour of popover |
