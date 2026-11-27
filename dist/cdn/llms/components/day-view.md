# <day-view>

Hour-grid schedule for a single day, using hour-view and calendar-event children

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/day-view/
- Vanilla Breeze 0.7.4

## Example

```html
<day-view data-date="2026-04-10">
  <ol>
    <li>
      <time datetime="09:00">9 AM</time>
      <hour-view>
        <calendar-event data-category="meeting">
          <time datetime="09:00">9:00</time>
          <icon-wc name="users" size="sm"></icon-wc>
          Sprint standup
        </calendar-event>
      </hour-view>
    </li>
    <li>
      <time datetime="10:00">10 AM</time>
      <hour-view>
        <calendar-event data-category="meeting" data-duration="2h">
          <time datetime="10:00">10:00</time>
          Design review
        </calendar-event>
      </hour-view>
    </li>
    <li>
      <time datetime="11:00">11 AM</time>
      <hour-view></hour-view>
    </li>
  </ol>
</day-view>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-date` | string |  | ISO date for this day view (e.g., 2026-04-10). Names the hour list (aria-label) and is passed as detail.date in day-view:event-click. |
| `data-start-hour` | string | `7` | First hour (0-23) of the grid the component generates when there is no authored <ol>, or 'auto' for a sparse range (first event hour - 1 to last event hour + 1). The range grows to fit events outside it. Ignored when you author the <ol>. |
| `data-end-hour` | number | `19` | Last hour (0-23) of the generated grid. Ignored when data-start-hour is 'auto' or the <ol> is authored. |
| `data-compact` | boolean |  | Compact presentation for dialog or overlay embedding |
| `data-label-continues` | string | `continues after the visible hours` | Text appended to the accessible name of a spanning event that runs past the last visible hour (localisation hook). |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-duration` | calendar-event | string |  | Makes the event span hour rows. Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour. Overlapping spans are laid out side by side. |
| `data-start` | calendar-event | `30` |  | Minute offset within the hour row; set automatically in generated grids for :30+ start times. |
| `data-continues` | calendar-event | boolean |  | Set by the component (not authored) on a spanning event clipped at the last visible hour; styled with a dashed end edge. |

## Structure

| Child | Description |
| --- | --- |
| `ol` | Ordered list of hour slots |
| `li` | Single hour slot containing time label + hour-view |
| `time` | Hour label with datetime='HH:00' |
| `hour-view` | Container for calendar-event elements within the hour |
| `calendar-event` | Individual event with time, category, and optional duration |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `day-view:event-click` | `{ date, time, text, element, category, duration }` | Fired when a calendar-event is clicked, or activated with Enter/Space while focused |
| `day-view:events-changed` | `{ events, source: 'property' }` | Fired after the events property rebuilds the view |

## Methods

| Method | Description |
| --- | --- |
| `refresh()` | Re-measure and re-position spanning events now (they also re-position automatically when the view resizes) |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `events` | `Array<{ time?, text, category?, duration?, href? }>` | Get the day's events as data, or assign an array to rebuild the view (sets data-start-hour="auto"). time is HH:MM or a full ISO datetime (wall-clock as written); omit it for an all-day event. Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour. |

## Accessibility

- Pattern: Native list with roving tabindex
- You provide: Each <calendar-event> needs a <time datetime> and a text title, from which its label is built
- The component manages: `role="button"`, `role="group"`, `aria-label`, `tabindex`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `ArrowDown` | Move to the next event |  |
| `ArrowUp` | Move to the previous event |  |
| `Home` | Move to the first event |  |
| `End` | Move to the last event |  |
| `Enter` / `Space` | Fire day-view:event-click for the focused event | Focus on the event itself, not a link or button inside it |
