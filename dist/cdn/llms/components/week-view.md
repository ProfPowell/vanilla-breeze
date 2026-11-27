# <week-view>

Week time grid composing day-view-style columns in a semantic table. Defaults to the current week (locale first day); today's header has aria-current="date". Changing data-start-date, data-days, data-start-hour, data-end-hour or a data-label-* after upgrade rebuilds a generated table.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/week-view/
- Vanilla Breeze 0.7.4

## Example

```html
<week-view data-start-date="2026-04-06">
  <calendar-event data-date="2026-04-06" data-category="meeting">
    <time datetime="09:00">9:00 AM</time>
    Sprint standup
  </calendar-event>
  <calendar-event data-date="2026-04-07" data-category="focus" data-duration="2h">
    <time datetime="10:00">10:00 AM</time>
    Design review
  </calendar-event>
  <calendar-event data-date="2026-04-09" data-category="deadline">
    <time datetime="16:00">4:00 PM</time>
    Sprint deadline
  </calendar-event>
</week-view>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-start-date` | string |  | ISO date for the first day of the view (e.g., 2026-04-06). Default: the current week, starting on the locale's first day of week (Intl.Locale weekInfo, closest [lang]). |
| `data-days` | number | `7` | Number of day columns, clamped to 1-14 (e.g., 5 for a workweek). Invalid values fall back to 7. |
| `data-start-hour` | string | `auto` | First visible hour (0-23), or 'auto' to scan events. A fixed range grows to fit events outside it. |
| `data-end-hour` | number | `19` | Last visible hour (0-23). Ignored when data-start-hour is 'auto'. |
| `data-label-continues` | string | `continues after the visible hours` | Text appended to the accessible name of a spanning event that runs past the last visible hour (localisation hook). |
| `data-label-time` | string | `Time` | Visually hidden name of the corner header over the hour labels (localisation hook). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-date` | calendar-event | string |  | ISO date assigning this event to a day column (auto mode). Events outside the range, or without a time, are not placed and are hidden. |
| `data-duration` | calendar-event | string |  | Makes the event span hour rows. Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour. Overlapping spans in one day column are laid out side by side. |
| `data-continues` | calendar-event | boolean |  | Set by the component (not authored) on a spanning event clipped at the last visible hour. |

## Structure

| Child | Description |
| --- | --- |
| `table` | Semantic table: hours (rows) × days (columns) |
| `thead > tr > th` | Day column headers: <time datetime> with a short visible date (month added when the range crosses one) and a visually hidden full date; today's has aria-current="date" |
| `tbody > tr > th` | Hour row headers with <time datetime='HH:00'> |
| `tbody > tr > td` | Day/hour cell containing hour-view and calendar-event elements |
| `hour-view` | Subgrid container for events within a cell |
| `calendar-event` | Individual event with time, category, and optional duration |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `week-view:event-click` | `{ date, time, text, element, category, duration }` | Fired when a calendar-event is clicked, or activated with Enter/Space while focused |
| `week-view:events-changed` | `{ events, source: 'property' }` | Fired after the events property rebuilds the view |

## Methods

| Method | Description |
| --- | --- |
| `refresh()` | Re-measure and re-position spanning events now (they also re-position automatically when the view resizes) |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `events` | `Array<{ date?, time, text, category?, duration? }>` | Get the week's events as data (including unplaced ones outside the range), or assign an array to rebuild the table. time is HH:MM or a full ISO datetime (its date is used when date is omitted). Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour. |

## Accessibility

- Pattern: Native table with roving focus across events
- You provide: Child <calendar-event> elements with a data-date and a <time>, each with text that names the event
- The component manages: `role="button"`, `role="group"`, `aria-label`, `aria-current`, `aria-hidden`, `tabindex roving`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` | Move to the next event in the same day | Focus on an event |
| `ArrowUp` | Move to the previous event in the same day | Focus on an event |
| `ArrowRight` | Move to the closest event in time in the next day that has events (reversed in right-to-left) | Focus on an event |
| `ArrowLeft` | Move to the closest event in time in the previous day that has events (reversed in right-to-left) | Focus on an event |
| `Home` | Move to the first event in the view | Focus on an event |
| `End` | Move to the last event in the view | Focus on an event |
| `Enter` / `Space` | Fire week-view:event-click for the event | Focus on the event itself, not a link or button inside it |
