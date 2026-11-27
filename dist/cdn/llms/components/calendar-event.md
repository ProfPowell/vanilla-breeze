# <calendar-event>

CSS-only event block for <day-view>, <week-view> and the <calendar-wc> day detail: category colour, inline-start accent bar, half-hour placement. Multi-hour spans are positioned by the parent view's JavaScript.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/calendar-event/
- Vanilla Breeze 0.7.4

## Example

```html
<calendar-event data-category="meeting">
  <time datetime="09:00">9:00</time>
  <icon-wc name="users" size="sm"></icon-wc>
  Sprint standup
</calendar-event>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-category` | string |  | Sets --event-color. Built in: meeting, deadline, personal, focus; any other value works with your own [data-category] rule. |
| `data-start` | `30` |  | Minute offset within the hour row. "30" places a single-hour event in the bottom half; day-view and week-view auto mode set it from the <time> when minutes >= 30. |
| `data-duration` | string |  | Length of a spanning event as hours and/or minutes, e.g. 2h, 45m, 1h30m, 90m. Read by <day-view>/<week-view> JS, which positions the event absolutely across hour rows. Unparseable values fall back to 1 hour. |
| `data-date` | string |  | ISO date (YYYY-MM-DD) of the event. Required for <week-view> auto mode, which places the event in that day's column; ignored by <day-view>. |

## Structure

| Child | Description |
| --- | --- |
| `<time datetime="HH:MM">` | Start time label. The first <time datetime> is what day-view/week-view auto mode use to place the event; without one, day-view auto mode moves the event to its all-day list and week-view auto mode skips it. |
| `<time datetime="PT…">` | Optional human-readable duration. Visually hidden, still read by assistive tech. Not used for positioning: use data-duration. |
| `<a href> or <button>` | Put interactive content inside when the event is actionable; the block shows a pointer cursor and hover tint only then. The event element itself is not interactive. |
