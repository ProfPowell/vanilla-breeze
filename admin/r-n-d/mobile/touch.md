# Touch Input Notes (Current State + Future Work)

This file tracks touch-related behavior in Vanilla Breeze and the remaining work for eventual implementation.

## What Is Already Implemented

### Global touch foundations

- Pointer-aware sizing tokens already exist (`--size-touch-min`).
- Base reset already applies larger minimum target sizes for coarse pointers.
- Pointer media queries are already part of the core CSS setup.

### Components that already support touch drag/gesture interaction

- `<split-surface>`: pointer capture drag, keyboard support, touch-safe divider behavior.
- `data-splitter`: attribute-level splitter with mouse/touch/keyboard support.
- `<compare-surface>`: pointer capture drag on divider plus keyboard controls.
- `<slide-accept>`: pointer capture drag on handle plus keyboard controls.
- `<carousel-wc>`: native touch scrolling via scroll-snap and touch scrolling behaviors.
- `interest-polyfill`: long-press touch handling logic already exists.

## Where The Gap Still Is

The main missing piece is `<drag-surface>` touch drag for reorder/transfer.

Current `<drag-surface>` behavior:

- Uses native HTML DnD (`dragstart`, `dragover`, `drop`) for pointer drag.
- Uses keyboard reorder path for accessibility.
- Uses `pointerdown` only to remember the original target for `data-drag-handle` checks.
- Does not yet run a true pointer-driven touch drag path.

## Recommended Direction

Keep a single `<drag-surface>` component and add a touch pointer path internally. Do not create a separate component.

### Interaction model

1. Keep existing native DnD path for mouse.
2. Keep existing keyboard path unchanged.
3. Add a touch path for `pointerType === "touch"`:
   - Start with handle-first behavior on touch when a handle exists.
   - Optional press-and-hold fallback (default ~250-300ms) when no handle exists.
   - Cancel if move exceeds threshold before activation (treat as scroll).
   - On activation, switch into drag mode, set pointer capture, update drop target on move, commit on pointerup.
4. Reuse current reorder and transfer internals so events remain consistent.

### API ideas (backward-compatible)

- `data-touch-mode="auto|handle|press-hold|off"` (`auto` default).
- `data-touch-delay="300"` (ms for press-hold path).
- `data-touch-threshold="8"` (px movement tolerance before cancel).
- Optional haptics flag (`data-touch-haptics`) with guarded `navigator.vibrate`.

### UX and a11y constraints

- Preserve vertical scrolling unless drag mode is explicitly active.
- Apply `touch-action` narrowly (handle/active item), not on the entire surface.
- Keep keyboard as the primary accessible fallback and parity path.
- Use existing live region model for grab/move/drop announcements where useful.
- Keep motion subtle and respect reduced-motion preferences.

## Suggested Implementation Phases

1. Single-surface touch reorder (vertical orientation first).
2. Horizontal orientation support parity.
3. Cross-surface touch transfer parity (`data-group` behavior).
4. Auto-scroll near edges and polish (haptics, visual lift, cancellation edge cases).
5. Docs + examples + mobile test matrix.

## Practical Test Matrix

- iOS Safari (recent iOS)
- Android Chrome (recent Android)
- Desktop Chrome/Firefox/Safari touch emulation for regression checks
- Keyboard-only regression (must remain unchanged)
- Screen reader smoke test for live-region announcements

## Future Extension Opportunity

After touch support lands in `<drag-surface>`, consider extracting a tiny shared pointer-drag utility for repeated patterns used by split/compare/slide/drag components. This can reduce duplicated pointer lifecycle logic while keeping each component API independent.
