# <calendar-wc>

Standalone calendar display with rich cell content

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/calendar-wc/
- Vanilla Breeze 0.7.4

## Example

```html
<calendar-wc
  data-month="4" data-year="2026"
  data-events='{"2026-04-10":"Sprint review","2026-04-15":"Deadline"}'
  data-selection="single">
</calendar-wc>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-month` | string |  | Month to display (1-12). Defaults to the current month. Observed; reflected back as the view changes. |
| `data-year` | string |  | Year to display. Defaults to the current year. Observed; reflected back as the view changes. |
| `data-events` | string |  | JSON: events keyed by start ISO date. Values may be a string, an object, or an array of events. Each event accepts optional `end` (ISO date, inclusive) or `days` (count) to span multiple days; spans render as continuous bars in data-size="large". Observed: changes re-render and fire calendar-wc:events-changed with source "attribute". |
| `data-selection` | `none`, `single`, `range`, `multi` | `none` | Selection mode: "none" (default), "single", "range", "multi" |
| `data-size` | `compact`, `default`, `large` | `default` | Size: "compact", "default", "large" |
| `data-min-date` | string |  | Earliest selectable/navigable date (ISO string, e.g. 2026-01-01) |
| `data-max-date` | string |  | Latest selectable/navigable date (ISO string, e.g. 2026-12-31) |
| `data-disabled-dates` | string |  | Comma-separated ISO dates to disable |
| `data-highlight-dates` | string |  | Comma-separated ISO dates to highlight (optionally with :category) |
| `data-months` | number |  | Number of adjacent months to display side by side (1-12). Defaults to 1. |
| `data-year-range` | number | `10` | Years listed either side of the current year in the year select (0-200). data-min-date / data-max-date bound that side instead, and the displayed year is always listed. |
| `data-heading-level` | number |  | Multi-month views: render each month title as <h1>-<h6> at this level. Default: plain text (no heading). |
| `data-label-prev` | string | `Previous month` | Accessible name override (default "Previous month"). |
| `data-label-next` | string | `Next month` | Accessible name override (default "Next month"). |
| `data-label-year` | string | `Year` | Accessible name override (default "Year"). |
| `data-label-close` | string | `Close` | Accessible name override (default "Close"). |
| `data-label-more` | string | `+{n} more` | Large-view overflow text; {n} is replaced with the hidden event count. |
| `name` | string |  | Form participation name. Enables ElementInternals form value sync on selection. |
| `data-tentative` | string |  | Range mode: the ISO start date while the second click is pending. Removed when the range completes. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-date` | button | string |  | ISO date of an in-month day button (runtime) |
| `data-day` | button | number |  | Day-of-month number on every day button, including outside-month ones (runtime) |
| `data-highlight` | button | string |  | Highlight category from data-highlight-dates (runtime) |
| `aria-current` | button | `date` |  | Marks today (runtime) |
| `aria-selected` | td | `true`, `false` |  | Selection state of the gridcell in selection modes (runtime) |
| `data-selected` | td | boolean |  | Selected day (single/multi) — styling hook (runtime) |
| `data-range-start` | td | boolean |  | First day of the range (runtime) |
| `data-range-end` | td | boolean |  | Last day of the range (runtime) |
| `data-in-range` | td | boolean |  | Day inside the range, inclusive (runtime) |
| `data-today` | td | boolean |  | Today's cell (runtime) |
| `data-outside-month` | td | boolean |  | Leading/trailing day from an adjacent month (runtime) |
| `data-events` | td | boolean |  | Cell has at least one event (runtime) |
| `data-event-count` | td | number |  | Number of events covering the day, spans included (runtime) |
| `data-day-part` | td | string |  | Space-separated tokens returned by getDayParts (runtime) |
| `data-week` | tr | number |  | 1-based week row index (runtime) |
| `data-row-lanes` | tr | number |  | Large view: number of span-bar lanes in the row (runtime) |
| `data-event-dot` | span | boolean |  | One event dot in compact/default views (runtime) |
| `data-continues-start` | span.event-span | boolean |  | Span bar continues from the previous row (runtime) |
| `data-continues-end` | span.event-span | boolean |  | Span bar continues into the next row (runtime) |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `calendar:select` | `{ value, date } (single) \| { value, start, end, startDate, endDate } (range) \| { values, dates } (multi)` | Fired when the selection changes |
| `calendar:navigate` | `{ year, month }` | Fired on month/year navigation |
| `calendar:day-open` | `{ date, events }` | Fired when the day-detail dialog opens (display mode) |
| `calendar-wc:events-changed` | `{ events, source: 'property' \| 'attribute' }` | Fired after the event data changes via the events property or the data-events attribute |

## Methods

| Method | Description |
| --- | --- |
| `refresh()` | Re-render the current view (e.g. after data read by a callback changes) |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `value` | `string \| null` | Read-only selection: ISO date (single), ISO interval start/end (range), space-separated ISO dates (multi), or null |
| `events` | `{ [isoDate]: Event[] } \| Array<Event & { date }>` | Get the date-keyed event map, or assign a date-keyed object or flat array (grouped by date) to re-render; fires calendar-wc:events-changed with source 'property' |
| `isDateDisallowed` | `((date: Date) => boolean) \| null` | Callback; return true to disable a date. Additive with data-min/max-date and data-disabled-dates |
| `getDayParts` | `((date: Date) => string \| string[] \| null) \| null` | Callback; returned tokens are set as data-day-part on the cell's <td> |

## Accessibility

- Pattern: Grid
- The component manages: `role="grid"`, `role="dialog"`, `aria-label`, `aria-labelledby`, `aria-selected`, `aria-multiselectable`, `aria-current`, `aria-disabled`, `aria-live`, `aria-hidden`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowRight` | Move focus to the next day (reversed in right-to-left) | Focus on a day |
| `ArrowLeft` | Move focus to the previous day (reversed in right-to-left) | Focus on a day |
| `ArrowDown` | Move focus to the same weekday in the next week | Focus on a day |
| `ArrowUp` | Move focus to the same weekday in the previous week | Focus on a day |
| `Home` | Move focus to the first day of the week row within the month | Focus on a day |
| `End` | Move focus to the last day of the week row within the month | Focus on a day |
| `PageUp` | Move focus to the same day in the previous month | Focus on a day |
| `PageDown` | Move focus to the same day in the next month | Focus on a day |
| `Shift+PageUp` | Move focus to the same day in the previous year | Focus on a day |
| `Shift+PageDown` | Move focus to the same day in the next year | Focus on a day |
| `Enter` / `Space` | Select the day, or open its event detail when selection is off | Native behaviour of <button> |
| `Escape` | Close the day detail and return focus to the day | Day detail open |
