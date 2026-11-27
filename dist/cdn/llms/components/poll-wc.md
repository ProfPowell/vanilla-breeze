# <poll-wc>

Voting + live results. Per-option counts, visible percentages and own-vote flag, single or multi-choice, optional closed (results-only) state. Presentational (reaction-bar pattern): emits poll-wc:vote, marks the option data-pending until the author calls setCount after the server confirms. Can enhance a native <form><fieldset> of radios/checkboxes as a no-JS fallback.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/poll-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<poll-wc>
  <span slot="question">When should we ship?</span>
  <button data-option="friday"   data-count="12">Friday</button>
  <button data-option="next-mon" data-count="33" data-mine>Next Monday</button>
  <button data-option="next-fri" data-count="8">Next Friday</button>
  <button data-option="never"    data-count="2">Never</button>
</poll-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `aria-label` | string |  | Group label when there is no question slot; moved onto the option group (the host has no role) |
| `data-multi` | boolean |  | Allow multiple selections (default: single choice) |
| `data-closed` | boolean |  | Read-only — show results, no voting |
| `data-hide-counts` | boolean |  | Hide per-option counts, percentages and bars, visually and from assistive tech |
| `disabled` | boolean |  | Disable voting; observed, so toggling it updates aria-disabled immediately |
| `data-label-vote` | string | `vote` | Singular count noun (Intl.PluralRules "one") |
| `data-label-votes` | string | `votes` | Count noun for other plural categories |
| `data-label-your-choice` | string | `your choice` | Appended to the accessible name of the user's own option |
| `data-label-closed` | string | `closed` | Appended to the total when data-closed is set |
| `data-label-poll` | string | `Poll` | Fallback group name with no question and no aria-label |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-option` | button | string |  | Stable identifier sent in events |
| `data-count` | button | number |  | Current vote count |
| `data-mine` | button | boolean |  | Current user voted for this option |
| `data-pending` | button | boolean |  | Output: a vote for this option is in flight; further clicks are ignored until setCount/setCounts |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `poll-wc:vote` | `{ option, action: 'add'\|'remove', count, mine }` | Single-choice: switching options emits a remove for the previously-selected option BEFORE the add. |
| `poll-wc:closed-change` | `{ closed }` | Fires when data-closed is toggled |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `setCount` | `(option, count, opts?) => void` | Update a single option after the server confirms (or roll back on failure); clears data-pending |
| `setCounts` | `(counts, opts?) => void` | Bulk-update counts; opts.mine accepts a string or string[]; clears every data-pending |
| `open` | `() => void` |  |
| `close` | `() => void` |  |
| `totalVotes` | `number` |  |
| `myVotes` | `string[]` |  |

## Accessibility

- Pattern: Radio group
- You provide: A question element or an aria-label on the host to name the option group
- The component manages: `role="radiogroup"`, `role="radio"`, `role="group"`, `role="checkbox"`, `aria-checked`, `aria-disabled`, `aria-busy`, `aria-label`, `aria-labelledby`, `aria-live`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` / `ArrowRight` | Move focus to the next option without voting, wrapping (left and right reversed in right-to-left) | Single choice |
| `ArrowUp` / `ArrowLeft` | Move focus to the previous option without voting, wrapping (left and right reversed in right-to-left) | Single choice |
| `Home` | Move focus to the first option without voting | Single choice |
| `End` | Move focus to the last option without voting | Single choice |
| `Enter` / `Space` | Vote for the focused option, or withdraw the vote | Native behaviour of button |
