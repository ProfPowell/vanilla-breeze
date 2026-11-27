# <progress-tracker>

Multi-step progress bar for wizards / checkout / onboarding flows. Distinct from <slide-accept> (slide-to-confirm). Author writes a native <ol> of <li> steps inside the element; the component decorates each with circle + connector + status (complete | current | upcoming | error) and visually hidden status text. With data-clickable, completed steps become native buttons.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/progress-tracker/
- Vanilla Breeze 0.7.4

## Example

```html
<progress-tracker data-current="profile" data-label-list="Sign-up progress">
  <ol>
    <li data-step="account">Account</li>
    <li data-step="profile">Profile</li>
    <li data-step="prefs">Preferences</li>
    <li data-step="confirm">Confirm</li>
  </ol>
</progress-tracker>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-current` | string |  | Active step: matched against data-step ids first, then as a 1-based index. Defaults to the first step. |
| `data-clickable` | boolean |  | Completed steps render their label inside a native <button> (keyboard and pointer) that navigates back. The current and upcoming steps are not activatable. |
| `data-direction` | `horizontal`, `vertical` | `horizontal` | vertical stacks the steps with a vertical connector (narrow screens, long labels, 5+ steps). |
| `data-label-list` | string | `Progress` | Accessible name set on the <ol> when it has no aria-label / aria-labelledby of its own. |
| `data-label-step` | string | `Step {n} of {total}:` | Visually hidden position prefix read before each label; {n} and {total}. Empty string removes it. |
| `data-label-complete` | string | `(completed)` | Visually hidden status text for completed steps. |
| `data-label-current` | string | `` | Visually hidden status text for the current step (empty by default: aria-current="step" already conveys it). |
| `data-label-upcoming` | string | `(not started)` | Visually hidden status text for upcoming steps. |
| `data-label-error` | string | `(error)` | Visually hidden status text for errored steps. |
| `data-label-announce` | string | `Step {n} of {total}: {label}` | Text announced to screen readers when the current step changes; {n}, {total} and {label} (the step's label text). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-step` | li | string |  | Stable step id (any string; defaults to the 1-based position). data-current matches it before trying an index, so numeric ids like "2024" are safe. |
| `data-error` | li | boolean |  | Marks this step as errored regardless of position. |
| `data-status` | li | `complete`, `current`, `upcoming`, `error` |  | Set by the component; style hook. |
| `aria-current` | li | string |  | Set by the component to "step" on the current step. |

## Structure

| Child | Description |
| --- | --- |
| `ol` | Required native ordered list of steps (renders as a plain numbered list without JS). |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `progress-tracker:step` | `{ step, previousStep, source: 'attr'\|'click' }` | Bubbles when data-current changes after upgrade (source 'attr') or a completed step is activated in data-clickable mode (source 'click', one event only). Not fired on upgrade or when the current step is activated. |

## CSS custom properties

| Property | Description |
| --- | --- |
| `--pt-circle-size` | Diameter of the step circle (default 1.75rem). |
| `--pt-line-thickness` | Connector and circle border thickness (default 2px). |
| `--pt-color-complete` | Fill / connector colour for completed steps (default --color-success). |
| `--pt-color-current` | Outline / ring colour for the active step (default --color-interactive). |
| `--pt-color-upcoming` | Outline / connector colour for upcoming steps (default --color-border). |
| `--pt-color-error` | Fill / connector colour for errored steps (default --color-error). |
| `--pt-color-text-on-fill` | Glyph colour on filled (complete / error) circles (default --color-text-on-interactive-auto). |

## Accessibility

- Pattern: Native ordered list of steps
- You provide: An <ol> whose items carry a text label for each step
- The component manages: `aria-current`, `aria-label`, `aria-hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Go back to the focused completed step | Native behaviour of button; completed steps with data-clickable |
