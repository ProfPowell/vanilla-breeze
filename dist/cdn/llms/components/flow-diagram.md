# <flow-diagram>

User flow and sequence visualization — progressively enhances an ol into a labelled figure holding a nested list drawn as a connected node graph with actions, decisions, and branches

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/flow-diagram/
- Vanilla Breeze 0.7.4

## Example

```html
<flow-diagram data-title="Login Flow">
  <ol>
    <li data-type="start">User visits login page</li>
    <li data-type="action">Enter credentials</li>
    <li data-type="decision">Valid credentials?
      <ol>
        <li data-branch="Yes">
          <ol>
            <li data-type="action">Create session</li>
            <li data-type="end">Redirect to dashboard</li>
          </ol>
        </li>
        <li data-branch="No">
          <ol>
            <li data-type="action">Show error</li>
            <li data-type="end">Return to login</li>
          </ol>
        </li>
      </ol>
    </li>
  </ol>
</flow-diagram>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-title` | string |  | Diagram heading, rendered as a real heading that labels the figure. Observed. |
| `data-heading-level` | number | `2` | Heading level (1-6) for data-title. Observed. |
| `src` | string |  | URL to JSON flow data: { title?, steps }. Loaded on connect when there is no inline <ol>, and whenever it changes. |
| `data-direction` | `vertical`, `horizontal` | `vertical` | Layout direction. Horizontal follows the writing direction (arrows point toward inline-end in RTL). CSS only. |
| `compact` | boolean |  | Reduced spacing and node sizes. CSS only (no re-render). |
| `data-label` | string | `Flow diagram` | Accessible name of the figure when there is no data-title. Observed. |
| `data-label-selected` | string | `Selected: {text}` | Live-region announcement on select; {text} is replaced with the node text. |
| `data-label-steps-one` | string | `{count} step` | Step-count summary for the Intl.PluralRules "one" category ({count} is replaced). Any category works: data-label-steps-few, -many, -zero, -two. |
| `data-label-steps-other` | string | `{count} steps` | Step-count summary for the "other" category and the fallback for unset categories. |
| `data-label-type-start` | string | `Start` | Spoken type prefix for start nodes ("Start: …"). |
| `data-label-type-action` | string | `Action` | Spoken type prefix for action nodes. |
| `data-label-type-decision` | string | `Decision` | Spoken type prefix for decision nodes. |
| `data-label-type-process` | string | `Process` | Spoken type prefix for process nodes. |
| `data-label-type-wait` | string | `Wait` | Spoken type prefix for wait nodes. |
| `data-label-type-end` | string | `End` | Spoken type prefix for end nodes. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-type` | li | `start`, `action`, `decision`, `process`, `wait`, `end` |  | Node type (default action). Other values render with action styling and the raw type as the spoken prefix unless data-label-type-<type> is set. |
| `data-annotation` | li | string |  | Note shown under the node; also the node button's accessible description |
| `data-branch` | li | string |  | Branch label on a decision's nested <li>, which holds its own <ol> of steps. "Yes"/"No" get success/error colouring. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `flow-diagram:ready` | `{ nodeCount }` | After every render: initial upgrade, observed attribute change, src load, and .steps assignment |
| `flow-diagram:select` | `{ type, text }` | Node activated by click, Enter or Space |
| `flow-diagram:steps-changed` | `{ steps, source: 'property' }` | After .steps assignment (fires after the render's ready) |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `steps` | `Array<{ type, text, annotation?, branches?: Array<{ label, steps }> }>` | Get the parsed flow, or assign one to rebuild. Input is normalized (branches default to [], strings become action steps, malformed entries are dropped) and written into the source <ol>, so it survives re-renders and moves. |

## Accessibility

- Pattern: Figure with a list of buttons (roving tabindex)
- You provide: A data-title to name the diagram; otherwise data-label or the default "Flow diagram" is used
- The component manages: `aria-labelledby`, `aria-label`, `aria-describedby`, `aria-hidden`, `role="status"`, `aria-live`, `aria-atomic`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` / `ArrowRight` | Move to the next step (ArrowRight reversed in right-to-left) |  |
| `ArrowUp` / `ArrowLeft` | Move to the previous step (ArrowLeft reversed in right-to-left) |  |
| `Home` | Move to the first step |  |
| `End` | Move to the last step |  |
| `Enter` / `Space` | Select the focused step | Native behaviour of button |
