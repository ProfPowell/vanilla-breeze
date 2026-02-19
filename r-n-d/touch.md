# Touch & Mobile Drag Support

Future plans for adding touch/mobile support to the drag-and-drop system built in `<drag-surface>`. See also: [draggable-poc.md](./draggable-poc.md).

## Problem

The native HTML Drag and Drop API has poor touch device support. Most mobile browsers don't fire `dragstart`/`dragover`/`drop` events from touch interactions. The `<drag-surface>` component currently works with mouse and keyboard — touch is the missing input method.

## Approach: Pointer Events

Rather than using Touch Events (which have their own quirks), the preferred path is the Pointer Events API — it normalizes mouse, touch, and pen into a single event model.

### Detection Strategy

```js
// Detect if the primary input is coarse (touch)
const isTouch = window.matchMedia('(pointer: coarse)').matches;

// Or detect at interaction time via pointerType
element.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') {
    // Use pointer-based drag path
  }
  // Mouse/pen can use native drag-and-drop
});
```

### Press-and-Hold to Initiate

Touch drag should require a deliberate press-and-hold (~300ms) to distinguish from scroll/tap:

1. `pointerdown` — start a timer
2. If the pointer moves significantly before the timer fires → it's a scroll, cancel
3. Timer fires → enter drag mode, prevent scrolling with `touch-action: none`
4. `pointermove` — update position, calculate drop target
5. `pointerup` — drop at calculated position

### Touch Scroll vs Drag Disambiguation

The hardest UX problem. Options:

- **Press-and-hold**: Most common pattern (iOS/Android native). ~300ms delay before drag activates. Risk: feels slow.
- **Drag handle only**: On touch devices, require `data-drag-handle` to initiate. The handle gets `touch-action: none`. Rest of item scrolls normally.
- **Hybrid**: Items auto-get drag handles on touch devices (injected by the component).

### Visual Feedback for Touch

- Scale transform on the dragged item (1.02–1.05x) to lift it above siblings
- Drop shadow increase during drag
- Haptic feedback via `navigator.vibrate(10)` on grab and drop (if available)
- The item follows the finger directly (no ghost image like native DnD)

### Mobile Viewport Considerations

- Auto-scroll when the dragged item is near viewport edges
- Prevent accidental page refresh (pull-to-refresh) during vertical drag
- Handle viewport resize events (keyboard showing/hiding on mobile)
- Ensure the dragged element stays visible even during scroll

## Architecture Options

### Option A: Unified `<drag-surface>`

Add touch support directly to the existing component. Pros: single element, no API surface expansion. Cons: complexity increase, potential code size.

### Option B: Separate `<touch-sortable>`

A dedicated element for touch reorder. Pros: clean separation, easier to maintain. Cons: two APIs for the same concept, confusing for consumers.

### Recommendation

**Option A** — keep it unified. The `<drag-surface>` already abstracts over mouse and keyboard; adding touch as a third input path fits the existing architecture. The component can detect the pointer type and switch code paths internally.

## Implementation Phases

1. **Phase 1**: Basic pointer-event drag on touch devices (reorder within single surface)
2. **Phase 2**: Cross-surface transfer via touch
3. **Phase 3**: Auto-scroll near edges, haptic feedback
4. **Phase 4**: Polish — handle orientation changes, prevent pull-to-refresh conflicts

## Open Questions

- Should the component inject visual drag handles on touch-only devices?
- What's the right press-and-hold duration? 200ms? 300ms? Should it be configurable?
- Do we need to support drag-and-drop between `<drag-surface>` and native drop targets (file uploads, etc.)?
