# <tab-set>

Tab container built on native details/summary with keyboard navigation and view transitions

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/tabs/
- Vanilla Breeze 0.7.4

## Example

```html
<tab-set aria-label="Feature tabs">
  <details name="feature-tabs" open>
    <summary>Overview</summary>
    <section>Content for Overview tab</section>
  </details>
  <details name="feature-tabs">
    <summary>Features</summary>
    <section>Content for Features tab</section>
  </details>
  <details name="feature-tabs">
    <summary>Usage</summary>
    <section>Content for Usage tab</section>
  </details>
</tab-set>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | string |  | Names the set of tabs. When the host has aria-label or aria-labelledby (and no role of its own) it gets role="group" on upgrade, so the name is exposed; an unlabelled tab-set stays role-less. Read at upgrade. |
| `data-orientation` | `horizontal`, `vertical` | `horizontal` | Vertical puts the tabs in a column at the inline start with the panel beside them, and moves between tabs with ArrowUp/ArrowDown in place of ArrowLeft/ArrowRight. Horizontal tabs wrap onto further rows when they don't fit. |
| `transition` | `fade`, `slide`, `scale` |  | View Transition animation between tab panels |

## Structure

| Child | Description |
| --- | --- |
| `<details>` | One per tab — native disclosure element provides open/close state. Give every tab the same name for no-JS exclusivity; on upgrade a missing, mixed or page-shared name is replaced with a per-instance one |
| `<summary>` | Tab label inside each <details> |
| `<section>` | Exactly one panel element per <details>, after the summary. Use <section>: it is named by its tab (aria-labelledby) and exposed as a region; a <div> panel's name is ignored |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `tab-set:change` | `{ index, previousIndex, tab, panel }` | Fired once per activation (click, arrow key or setting details.open), from the newly opened tab. index is the new tab, previousIndex the one it replaced, tab its <details>, panel its panel element. Not fired during setup or when the active tab is re-selected |
| `tab-set:tabs-changed` | `{ tabs, source: 'property' }` | Fired after the tabs property rebuilds the set |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `tabs` | `Array<{ id?, label, content, active? }>` | Get the tabs as data, or assign an array to rebuild the set (<details> + <summary> + <section> panel per entry; first tab opens unless one has active: true). content is trusted HTML written with innerHTML — never pass unsanitised user input |

## Accessibility

- Pattern: Native details/summary (exclusive group)
- You provide: Child <details> elements, each with a <summary> and a <section> panel
- The component manages: `role="group"`, `aria-controls`, `aria-labelledby`, `aria-expanded`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowRight` | Open and focus the next tab, wrapping to the first (reversed in right-to-left) | Focus on a tab, horizontal orientation |
| `ArrowLeft` | Open and focus the previous tab, wrapping to the last (reversed in right-to-left) | Focus on a tab, horizontal orientation |
| `ArrowDown` | Open and focus the next tab, wrapping to the first | Focus on a tab, data-orientation="vertical" |
| `ArrowUp` | Open and focus the previous tab, wrapping to the last | Focus on a tab, data-orientation="vertical" |
| `Home` | Open and focus the first tab | Focus on a tab |
| `End` | Open and focus the last tab | Focus on a tab |
