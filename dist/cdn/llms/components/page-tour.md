# <page-tour>

Progressive-enhancement guided tour. Renders as an in-page step list without JS; enhances to an interactive spotlight overlay with the web component.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/page-tour/
- Vanilla Breeze 0.7.4

## Example

```html
<page-tour
  id="demo-tour"
  data-title="Getting Started"
  data-trigger="manual"
  data-mode="passive"
  data-persist="none"
>
  <details class="page-tour-guide" open>
    <summary class="page-tour-summary">
      <span>Getting Started Tour</span>
      <span class="page-tour-count">3 steps</span>
    </summary>
    <ol class="page-tour-list">
      <li>
        <tour-step data-target="#site-header">
          <h3>Header</h3>
          <p>The main navigation lives here.</p>
        </tour-step>
      </li>
      <li>
        <tour-step data-target="#search-input" data-placement="bottom">
          <h3>Search</h3>
          <p>Search across all content.</p>
        </tour-step>
      </li>
      <li>
        <tour-step data-target="#theme-picker" data-placement="bottom">
          <h3>Theme Picker</h3>
          <p>Change the visual style.</p>
        </tour-step>
      </li>
    </ol>
    <button class="page-tour-start-btn" type="button">Start Tour</button>
  </details>
</page-tour>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-title` | string | `Page Tour` | Tour name; the accessible name of the tour card |
| `data-trigger` | `auto`, `manual`, `button` | `manual` | How the tour is initiated |
| `data-mode` | `passive`, `active`, `forced` | `passive` | Skip behaviour: passive and active allow skipping (Skip button, Escape, backdrop click); forced removes all three. Action gates come from each step's data-action, not the mode |
| `data-persist` | `none`, `session`, `local` | `session` | Where to store progress |
| `data-persist-key` | string |  | Storage key override (defaults to page path) |
| `data-spotlight-padding` | number |  | Pixel padding around the spotlight; overrides the --tour-spotlight-padding token |
| `data-label-step` | string | `Step {n} of {total}` | Step counter template; {n} and {total} are replaced |
| `data-label-skip` | string | `Skip tour` | Skip button text |
| `data-label-close` | string | `Close` | Skip button text on the last step |
| `data-label-prev` | string | `Previous` | Previous button text |
| `data-label-next` | string | `Next` | Next button text |
| `data-label-finish` | string | `Finish` | Next button text on the last step |
| `data-label-nav` | string | `Tour navigation` | Accessible name of the card's button group |
| `data-label-ready` | string | `Done. Next is available.` | Announced when a step's required action completes |
| `data-step` | number | `0` | Current step index (0-based), reflects state |
| `data-active` | boolean |  | Present while tour is running |
| `data-complete` | boolean |  | Present after tour finishes or is skipped |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-target` | tour-step | string |  | CSS selector for the element to highlight |
| `data-placement` | tour-step | `top`, `bottom`, `inline-start`, `inline-end`, `auto` | `auto` | Preferred card side; inline-start/inline-end follow the text direction. Flips when there is no room |
| `data-action` | tour-step | `none`, `click`, `focus`, `input`, `change`, `custom` | `none` | Required user action on the target before Next is enabled (custom: the page dispatches tour:action on the <page-tour>) |
| `data-action-hint` | tour-step | string |  | Instructional text shown while waiting for action |
| `data-skippable` | tour-step | `true`, `false` | `true` | false hides Skip and ignores Escape and backdrop clicks on this step (forced mode already does this for every step) |
| `data-scroll` | tour-step | `auto`, `smooth`, `none` | `smooth` | Scroll-into-view behaviour for target |

## Structure

| Child | Description |
| --- | --- |
| `<tour-step>` | Individual tour step — contains heading and description |
| `<details class="page-tour-guide">` | Layer 3 collapsible wrapper (optional) |
| `<button class="page-tour-start-btn">` | Start button inside details (optional, auto-wired) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `tour:start` | `{ step }` | Fired once when tour begins |
| `tour:step` | `{ step, target, direction }` | Fired on each step change |
| `tour:action` | `{ step, action }` | Fired when a required action completes |
| `tour:complete` | `{ steps }` | Fired when last step is finished |
| `tour:skip` | `{ step }` | Fired when user skips the tour |

## Methods

| Method | Description |
| --- | --- |
| `start(step?)` | Start at a step index (default 0). While already running, moves to that step instead |
| `stop()` | End the tour silently (no event) |
| `next()` | Advance; ignored while the step's action gate is waiting. On the last step, completes the tour |
| `prev()` | Go to the previous step |
| `goto(index)` | Jump to a step (0-based); steps whose target is missing are skipped |
| `skip()` | Skip the tour (fires tour:skip); ignored when the current step is not skippable |
| `reset()` | Clear persisted progress and reset data-step to 0 |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--tour-backdrop-color` | Overlay colour (default oklch(0% 0 0 / 0.5)) |
| `--tour-spotlight-ring` | Spotlight ring and active pip colour (default var(--color-primary)) |
| `--tour-spotlight-padding` | Space between the target and the spotlight edge (default 8px) |
| `--tour-spotlight-radius` | Spotlight corner radius |
| `--tour-card-max-width` | Maximum card width (default 22rem) |
| `--tour-card-min-width` | Minimum card width (default 16rem) |
| `--tour-card-offset` | Gap between the spotlight and the card |
| `--tour-transition-duration` | Spotlight and backdrop transition duration |
| `--tour-z-index` | Stacking level of the backdrop and spotlight |

## Accessibility

- Pattern: Dialog (modal)
- You provide: A heading (h2 to h4) in each tour-step; it receives focus and is announced
- The component manages: `role="dialog"`, `aria-modal`, `aria-label`, `tabindex`, `aria-hidden`, `aria-live`, `aria-atomic`, `aria-disabled`, `aria-describedby`, `popover`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Escape` | End the tour and return focus to where it started | Current step is skippable |
| `ArrowRight` / `ArrowDown` | Go to the next step (ArrowRight and ArrowLeft are reversed in right-to-left) | Focus in the tour card or on nothing, not in a form field |
| `ArrowLeft` / `ArrowUp` | Go to the previous step (ArrowRight and ArrowLeft are reversed in right-to-left) | Focus in the tour card or on nothing, not in a form field |
| `Home` | Go to the first step | Focus in the tour card or on nothing, not in a form field |
| `End` | Go to the last step | Focus in the tour card or on nothing, not in a form field |
| `Tab` | Move to the next control in the card, wrapping; on a gated step the target joins the cycle |  |
| `Shift+Tab` | Move to the previous control in the card, wrapping; on a gated step the target joins the cycle |  |
