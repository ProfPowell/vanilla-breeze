# <drag-surface>

Accessible drag-and-drop reorder surface with keyboard reorder, optional single-pointer move controls, live announcements and cross-surface transfer

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/drag-surface/
- Vanilla Breeze 0.7.4

## Example

```html
<drag-surface data-layout="stack" data-layout-gap="xs">
  <article class="card" draggable="true" data-id="task-1">Design review</article>
  <article class="card" draggable="true" data-id="task-2">Code audit</article>
  <article class="card" draggable="true" data-id="task-3">Deploy staging</article>
</drag-surface>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `group` | string |  | Transfer group; items move between surfaces sharing a group |
| `orientation` | `vertical`, `horizontal` | `vertical` | "horizontal" switches keyboard reorder to Left/Right and drop maths to the inline axis; both follow the computed direction (RTL-aware) |
| `disabled` | boolean |  | Disables dragging out, dropping in, keyboard reorder and move controls; reflected as aria-disabled and skipped as a transfer target |
| `data-move-controls` | boolean |  | Renders per-item Move buttons (up/down or inline start/end, plus Move to <adjacent surface> for grouped surfaces) — the single-pointer alternative to dragging (WCAG 2.5.7) |
| `data-label-instructions` | string | `Press Space or Enter to grab, then use the arrow keys to move` | Description set on each item (aria-description) that tells screen reader users how to move it |
| `role` |  |  | Managed: always "list" |
| `aria-disabled` | string |  | Managed: "true" while disabled is present |
| `data-drag-over` | boolean |  | Present while a dragged item from an accepted source hovers the surface |
| `data-reorder-mode` | boolean |  | Present while one of the surface's items is grabbed for keyboard reorder |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `draggable` | direct child | `true` |  | Native attribute; marks a direct child as a reorderable item (gets role=listitem, tabindex=0 and an aria-description with the move instructions, including items added later) |
| `data-id` | direct child | string |  | Stable identifier reported in event details and sortedOrder |
| `data-sort-order` | direct child | number |  | 1-based position, rewritten by the component after each move |
| `data-drag-handle` | descendant of an item | boolean |  | Only this element starts a pointer drag; a focusable button handle also accepts reorder keys and gets aria-pressed while grabbed |
| `data-grabbed` | direct child | boolean |  | Output: present while the item is grabbed for keyboard reorder (aria-description changes to "Grabbed" unless the item has its own description) |
| `data-dragging` | direct child | boolean |  | Output: present on the item during a pointer drag |
| `data-drop-target` | direct child | `before`, `after` |  | Output: insertion indicator during a pointer drag (drawn on the block or inline edge, RTL-aware) |
| `data-just-dropped` | direct child | boolean |  | Output: briefly present after a drop or move to trigger the flash animation |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `drag-surface:reorder-start` |  | A pointer drag or keyboard grab began |
| `drag-surface:reorder` | `{ item: HTMLElement, itemId: string \| undefined, oldIndex: number, newIndex: number, order: (string \| undefined)[] }` | Items within this surface were reordered (pointer drag, keyboard drop or move control) |
| `drag-surface:transfer` | `{ item: HTMLElement, itemId: string \| undefined, fromSurface: DragSurface, toSurface: DragSurface, newIndex: number, fromOrder: (string \| undefined)[], toOrder: (string \| undefined)[] }` | An item moved to another surface in the same group; fired on the receiving surface |
| `drag-surface:reorder-end` |  | A pointer drag or keyboard grab ended (dropped, cancelled or abandoned); for pointer drags it fires on the source surface |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `sortedOrder` | `(string \| undefined)[]` | data-id of each draggable child in DOM order |
| `draggableChildren` | `HTMLElement[]` | Direct children with draggable="true" (a new array on each read) |
| `group` | `string \| null` | The group attribute, or null |
| `orientation` | `'vertical' \| 'horizontal'` | Normalised orientation attribute |
| `disabled` | `boolean` | Reflects the disabled attribute |

## Accessibility

- Pattern: Sortable list
- You provide: An aria-label on the surface (used in announcements) and readable text or an aria-label in each draggable item. Every item is a tab stop and is described with how to move it
- The component manages: `role="list"`, `role="listitem"`, `role="status"`, `tabindex`, `aria-disabled`, `aria-pressed`, `aria-description`, `aria-label`, `aria-live`, `aria-atomic`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Grab the item, or drop it when already grabbed | Focus on an item or its drag handle |
| `ArrowDown` / `ArrowUp` | Move focus to the next or previous item, or move the grabbed item one position | Vertical orientation |
| `ArrowRight` / `ArrowLeft` | Move focus to the next or previous item, or move the grabbed item one position (reversed in right-to-left) | Horizontal orientation |
| `ArrowRight` / `ArrowLeft` | Move the grabbed item to the next or previous surface in the group | Vertical orientation, item grabbed |
| `ArrowDown` / `ArrowUp` | Move the grabbed item to the next or previous surface in the group | Horizontal orientation, item grabbed |
| `Escape` | Cancel the grab and return the item to where it started, or blur the item when nothing is grabbed |  |
