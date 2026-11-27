# <geo-map>

A zero-dependency map component using OpenStreetMap / CARTO raster tiles or your own tile proxy, with a lazy-loaded interactive pan / zoom mode.

- Web component. Needs the Vanilla Breeze script; its children are the fallback when script has not run.
- Documentation: https://vanilla-breeze.com/docs/elements/web-components/geo-map/
- Vanilla Breeze 0.7.4

## Example

```html
<geo-map lat="40.7484" lng="-73.9857" zoom="15">
  <address>
    <strong>Empire State Building</strong><br/>
    20 W 34th St, New York, NY 10001
  </address>
</geo-map>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `lat` | number |  | Latitude of the map centre. With lng, highest-priority coordinate source. |
| `lng` | number |  | Longitude of the map centre. |
| `zoom` | number | `15` | Tile zoom level 1–19; out-of-range values fall back to 15. |
| `marker` | (no value), `true`, `false` | `true` | Show the pin at the centre (bare or "true"); "false" hides it. |
| `marker-color` | string |  | Pin fill, any CSS colour. Invalid values are ignored (the pin falls back to --geo-map-marker-color, then --color-error). |
| `provider` | `osm`, `carto-light`, `carto-dark`, `carto-auto` | `osm` | Built-in tile source. carto-auto picks carto-dark or carto-light from the nearest data-mode (else prefers-color-scheme) and follows changes. Each provider shows its required credit. |
| `tile-url` | string |  | Tile URL template overriding provider: {z} {x} {y}, {s} (a/b/c subdomain rotation) and {r} ("@2x" on high-density screens). Set attribution for the credit. See /docs/extensibility/service-facade/. |
| `attribution` | string |  | Credit text shown for a tile-url source (built-in providers always show their own). A child with slot="attribution" replaces it. |
| `attribution-href` | string |  | Link for the attribution credit (http/https only). |
| `interactive` | `click`, `eager`, `none` | `click` | click: the map surface is an activation button; eager: interactive on load (without moving focus); none: static view only. |
| `static-only` | boolean |  | Never activate (same as interactive="none"). |
| `loading` | `lazy`, `eager`, `consent` | `lazy` | Tile loading. consent: request nothing from the tile host until the user presses "Load map" (shows a placeholder naming the host; the slotted address stays visible). |
| `label` | string |  | Accessible name of the map. Default: "Map of …" from the slotted <address> text, the src address / JSON-LD name, or place; else "Map". |
| `src` | string |  | ID of an <address data-lat data-lng> or a <script type="application/ld+json"> with geo.latitude / geo.longitude to read coordinates (and the name) from. |
| `place` | string |  | Name matched against JSON-LD scripts on the page (data.name); the match's geo supplies coordinates. |
| `data-ready` | boolean |  | Set when the static tiles have finished loading (with geo-map:ready); removed on each re-render. |
| `data-label-map` | string | `Map` | Accessible name when nothing names the place. |
| `data-label-map-of` | string | `Map of {name}` | Accessible name template; {name} is the address text, src name or place. |
| `data-label-activate` | string | `Activate interactive map` | Visible text (and name) of the activation button. |
| `data-label-consent` | string | `Load map` | Consent button text (loading="consent"). |
| `data-label-consent-note` | string | `Loads map images from {host}` | Consent note; {host} is the tile host. |
| `data-label-zoom-in` | string | `Zoom in` | Zoom-in button name. |
| `data-label-zoom-out` | string | `Zoom out` | Zoom-out button name. |
| `data-label-recenter` | string | `Recenter map` | Recenter button name. |
| `data-label-exit` | string | `Exit map` | Exit button name (returns to the static view). |
| `data-label-controls` | string | `Map controls` | Name of the control button group. |
| `data-label-instructions` | string |  | Key / gesture instructions referenced by aria-describedby in interactive mode. |
| `data-label-moved` | string | `Map centred on {lat}, {lng}, zoom {zoom}` | Polite live-region announcement after pan / zoom. |
| `data-label-error-coords` | string | `Map location unavailable` | On-screen text when no coordinates resolve. |
| `data-label-error-tiles` | string | `Map images failed to load` | On-screen text when every tile fails. |

## Attributes on children

| Attribute | On | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `data-lat` | address | number |  | Latitude on a slotted (or src-referenced) <address>. |
| `data-lng` | address | number |  | Longitude on a slotted (or src-referenced) <address>. |
| `slot` | * | `attribution` |  | slot="attribution" replaces the credit line. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `geo-map:ready` | `{ lat, lng, zoom }` | Static tiles finished loading (data-ready is set). |
| `geo-map:activate` | `{ lat, lng, zoom }` | Interactive mode started. |
| `geo-map:move` | `{ lat, lng, zoom }` | After a pan or zoom in interactive mode (new centre, 6 decimal places). |
| `geo-map:data-changed` | `{ data, source: 'property' }` | After a .data assignment that changed something. |
| `geo-map:error` | `{ message }` | No coordinates resolved, or every tile failed to load. |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `data` | `{ lat?: number, lng?: number, zoom: number, marker: boolean, markerColor: string }` | Get the map state, or assign a partial object: attributes are written as one batch and the map re-renders once. Assigning the current state is a no-op; an invalid markerColor is ignored, '' clears it. Emits geo-map:data-changed. |
| `markers` | `Array<{ lat: number, lng: number, color: string }>` | The centre marker as a one-element array when coordinates resolve, else []. |
| `active` | `boolean` | True while interactive mode is on (also the :state(active) custom state). |

## Accessibility

- Pattern: Image, then an application-like region once activated
- You provide: A place name (label attribute or caption content) so the map image has a meaningful name
- The component manages: `role="img"`, `role="region"`, `role="group"`, `role="status"`, `aria-label`, `aria-roledescription`, `aria-describedby`, `aria-hidden`, `aria-live`, `tabindex`, `hidden`

## Keyboard

| Keys | Action | When |
| --- | --- | --- |
| `Enter` / `Space` | Switch the static map to interactive mode and focus the map | Native behaviour of button (the activate button) |
| `ArrowLeft` / `ArrowRight` / `ArrowUp` / `ArrowDown` | Pan the map | Focus on the interactive map |
| `+` / `=` | Zoom in | Focus on the interactive map |
| `-` / `_` | Zoom out | Focus on the interactive map |
| `Home` / `0` | Return to the original centre | Focus on the interactive map |
| `Escape` | Leave interactive mode and return focus to the activate button | Focus on the interactive map |
