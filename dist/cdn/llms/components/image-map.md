# <image-map>

Responsive image map: <map-area> children define percentage-coordinate hotspots (rect, circle, poly) over a child <img>, with an SVG hit-testing overlay, keyboard-focusable anchors, and rich HTML tooltips. Without JS the image renders and each map-area shows as a labeled list item.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/image-map/
- Vanilla Breeze 0.7.4

## Example

```html
<image-map>
  <img src="/maps/floor-plan.svg" alt="Office floor plan" />

  <map-area shape="rect" coords="5 8 40 44"
    label="Conference Hall" href="/rooms/conference">
    <p>Seats 120 people. AV equipment available.</p>
  </map-area>

  <map-area shape="circle" coords="62.5 32 10"
    label="Server Room" href="/rooms/server">
    <p>24 racks, climate controlled.</p>
  </map-area>

  <map-area shape="rect" coords="60 56 95 92"
    label="Open Office" href="/rooms/office">
    <p>80 hot-desk workstations.</p>
  </map-area>
</image-map>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | string |  | Image URL used to create the <img> when no child <img> is authored. |
| `alt` | string |  | Alt text for the generated <img>. |
| `data-label-map` | string | `Image map` | Group name fallback when there is no aria-label/aria-labelledby and the image has no alt. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `shape` | map-area | `rect`, `circle`, `poly` |  | Hotspot shape (default rect). |
| `coords` | map-area | string |  | Percentage coordinates (0-100), space or comma separated: rect x1 y1 x2 y2, circle cx cy r, poly x1 y1 x2 y2 ... |
| `label` | map-area | string |  | Accessible name of the hotspot; falls back to the area's text content. Shown as the list label without JS. |
| `href` | map-area | string |  | Navigation target; the hotspot becomes an <a> focus anchor. Not a link without JS: also author an <a href> in the content for no-JS reachability. |
| `target` | map-area | string |  | Link target for href (e.g. _blank). |
| `tooltip` | map-area | `hover`, `click`, `none` |  | Tooltip mode: hover (default; on hover/focus, hoverable), click (toggle on click/Enter/Space, focus moves into interactive content, Escape returns), none. |
| `disabled` | map-area | boolean |  | Removes the hotspot from interaction and the tab order. |

## Structure

| Child | Description |
| --- | --- |
| `<img>` | Direct child image the overlay is laid over (or use src/alt on the host). |
| `<map-area>` | Hotspot definition; its child content becomes the tooltip (and the no-JS list item body). |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `image-map:area-enter` | `{ area }` | Pointer entered or focus moved onto an area; area is the <map-area> element. |
| `image-map:area-leave` | `{ area }` | Pointer left or focus moved off an area. |
| `image-map:area-activate` | `{ area }` | Area clicked, tapped, or activated with Enter/Space. Cancelable: preventDefault() stops link navigation. |
| `image-map:regions-changed` | `{ regions, source: 'property' }` | Fired after the regions setter rebuilds the map. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `regions` | `Array<{ shape, coords, label?, href?, target?, tooltip?, disabled?, content? }>` | Get the regions from the <map-area> children (content is a string for text-only areas or a cloned DocumentFragment for markup) or assign to rebuild them. String content renders as text, never HTML; pass a Node, DocumentFragment or <template> for rich tooltips. Fires image-map:regions-changed with source 'property'. |

## Accessibility

- Pattern: Group of links and buttons with tooltips
- You provide: An <img> with alt text (used as the group name) and a label or text content on each <map-area>
- The component manages: `role="group"`, `role="tooltip"`, `aria-label`, `aria-describedby`, `aria-expanded`, `aria-controls`, `aria-disabled`, `aria-hidden`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Tab` | Move to the next hotspot in source order; every hotspot is a tab stop | Native behaviour of a and button |
| `ArrowDown` | Move to the nearest hotspot below; focus stays when there is none | Focus on a hotspot |
| `ArrowUp` | Move to the nearest hotspot above; focus stays when there is none | Focus on a hotspot |
| `ArrowRight` | Move to the nearest hotspot to the right; focus stays when there is none | Focus on a hotspot |
| `ArrowLeft` | Move to the nearest hotspot to the left; focus stays when there is none | Focus on a hotspot |
| `Space` | Activate the hotspot as Enter does | Focus on a hotspot that is a link |
| `Enter` | Follow the link or, for click-mode hotspots, toggle the tooltip and focus its first control | Native behaviour of a and button |
| `Escape` | Hide the visible tooltip and, when focus was inside it, return focus to its hotspot | A tooltip is showing |
