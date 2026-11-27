# <hour-view>

CSS-only container for calendar events within a single hour slot. Provides half-hour positioning, vertical stacking and double-booking columns.

- CSS-only custom element. Works without JavaScript.
- Documentation: https://vanilla-breeze.com/docs/elements/custom-elements/hour-view/
- Vanilla Breeze 0.7.4

## Example

```html
<li>
  <time datetime="09:00">9 AM</time>
  <hour-view>
    <calendar-event data-category="meeting">
      <time datetime="09:00">9:00</time>
      Sprint standup
    </calendar-event>
  </hour-view>
</li>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-overlap` | boolean |  |  |
