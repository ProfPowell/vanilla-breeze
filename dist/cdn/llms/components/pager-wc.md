# <pager-wc>

Standalone pagination controls element targeting any [data-paged] container. The element form of the data-paged primitive — same shape as the layout-grid / data-layout-* element-attribute symmetry across VB. Authors pick the surface that fits the markup; both feed the same engine. Multiple <pager-wc> instances pointing at the same target stay in sync via paged:change; a target inserted later is picked up.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/pager-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<header data-layout="cluster" data-layout-justify="between">
  <h2>Setup steps</h2>
  <pager-wc target="#steps" data-style="prev-next" data-label-nav="Setup steps pages"></pager-wc>
</header>
<ol id="steps" data-paged data-paged-size="4" data-paged-controls="none">
  <li>Set up your account</li>
  <li>Pick a theme</li>
  ...
</ol>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | string |  | CSS selector for the [data-paged] container (preferred form). Only an element carrying data-paged counts; resolution is retried when a paged:change fires and on click. |
| `for` | string |  | ID of the target container (HTML-form-style alternative to target). |
| `data-style` | `numbered`, `prev-next`, `load-more` | `numbered` | Control style. load-more needs a progressive target (data-paged-style="load-more" on the container, plus data-paged-controls="none" to drop its own button). Infinite is intentionally unsupported — a sentinel pattern doesn't make sense for decoupled controls. |
| `data-label-nav` | string | `Pagination` | Accessible name of the rendered <nav> landmark. Give top and bottom pagers distinct names. |
| `data-label-prev` | string | `Previous` | Previous button text. |
| `data-label-next` | string | `Next` | Next button text. |
| `data-label-page` | string | `Page {page}` | Accessible name of each page-number button; {page} is the number. |
| `data-label-status` | string | `Page {page} of {total}` | prev-next status text (polite live region); {page} and {total}. |
| `data-label-load-more` | string | `Load more ({n})` | Load-more button text; {n} is the number of items still hidden. |
| `data-label-no-more` | string | `No more` | Load-more button text once every item is shown. |
| `data-label-missing` | string | `No paginated target found` | Visible note rendered while no [data-paged] target resolves (not a live region). |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `pager-wc:navigate` | `{ page }` | Bubbles from the pager before it dispatches paged:goto on the target. Fired for page navigations only (numbered / prev-next), not for load-more. Not cancelable. Use for analytics / scroll-restore hooks; listen for paged:change on the target for after-navigation work. |

## Accessibility

- Pattern: Landmark navigation
- You provide: An aria-label on the host when the default name "Pagination" is not specific enough
- The component manages: `aria-label`, `aria-current`, `aria-live`, `aria-hidden`, `role="list"`, `disabled`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Go to the page the focused button names; focus stays on the equivalent button after the controls re-render | Native behaviour of button |
