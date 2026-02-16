# `<geo-map>` Web Component

A dependency-free, progressively enhanced map web component for the Vanilla Breeze ecosystem. Follows the facade pattern pioneered by `<lite-youtube>`: static image on load, interactive map on click.

## Goals

- Zero dependencies — vanilla custom element, no build step
- SSR/SSG safe — meaningful HTML before JS runs
- Progressive enhancement — three rendering layers
- Semantic data binding — sources coordinates from `<address>`, JSON-LD, or attributes
- Free by default — uses OpenStreetMap tiles (no API key)
- Small — target under 5 KB compressed for the static layer

## Element Name

`<geo-map>` — short, semantic, clearly communicates purpose.

## Rendering Layers

### Layer 0: No JS (HTML fallback)

The component's light DOM is the fallback. Authors slot an `<address>` element containing a link to an external map provider. Before JS, users see a styled address block with a clickable link.

```html
<geo-map lat="40.7484" lng="-73.9857" zoom="15">
  <address>
    <a href="https://www.openstreetmap.org/?mlat=40.7484&mlon=-73.9857#map=15/40.7484/-73.9857">
      Empire State Building<br>
      20 W 34th St, New York, NY 10001
    </a>
  </address>
</geo-map>
```

Minimum CSS shipped with the component makes this look presentable as a card/block even without JS.

### Layer 1: Static Tile Image (connectedCallback)

On upgrade, the component:

1. Reads coordinates from attributes or slotted `<address>` data
2. Calculates OSM tile coordinates from lat/lng/zoom
3. Renders a grid of `<img>` tiles clipped to the component dimensions
4. Overlays a marker pin (SVG, inline) at the center point
5. Shows a subtle "Click to interact" affordance
6. Keeps the `<address>` visible as a caption/overlay

Tile URL scheme (free, no key): `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

Tile math (lat/lng to tile x/y):

```
x = floor((lng + 180) / 360 * 2^z)
y = floor((1 - ln(tan(lat_rad) + sec(lat_rad)) / pi) / 2 * 2^z)
```

The pixel offset within the tile positions the map center precisely.

### Layer 2: Interactive Map (click to activate)

On user click/tap, the component:

1. Replaces the static tile grid with a pannable/zoomable tile viewer
2. Handles touch and mouse drag for panning
3. Handles wheel/pinch for zoom level changes
4. Fetches new tiles as the viewport moves
5. Maintains the marker position

This is a minimal slippy map implementation — no external library. Target ~200 lines of JS for pan/zoom/tile-fetch.

#### Optional: External Provider Upgrade

If the author sets `interactive="leaflet"`, the component lazy-loads Leaflet from CDN on activation instead of using the built-in viewer. This gives full Leaflet features (popups, layers, routing) at the cost of ~40 KB.

```html
<geo-map lat="40.7484" lng="-73.9857" interactive="leaflet">
```

## Attribute API

| Attribute | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `lat` | Number | — | Latitude of map center |
| `lng` | Number | — | Longitude of map center |
| `zoom` | Number | `15` | Tile zoom level (1–19) |
| `marker` | Boolean | `true` | Show pin at center |
| `marker-color` | String | `#e74c3c` | Pin fill color |
| `interactive` | String | `click` | `click`, `eager`, `none`, `leaflet` |
| `provider` | String | `osm` | Tile source: `osm`, `carto-light`, `carto-dark` |
| `place` | String | — | Match name against page JSON-LD |
| `src` | String | — | ID reference to a source `<address>` or `<script type="application/ld+json">` |
| `width` | String | — | Explicit width (prefer CSS) |
| `height` | String | `300px` | Explicit height (prefer CSS) |
| `static-only` | Boolean | `false` | Never activate interactive mode |

### Observed Attributes

`lat`, `lng`, `zoom`, `marker`, `provider` — changing these re-renders the static view.

## Data Source Resolution

The component resolves coordinates in this priority order:

### 1. Explicit Attributes (highest priority)

```html
<geo-map lat="40.7484" lng="-73.9857"></geo-map>
```

### 2. `src` ID Reference

Points to an element on the page that contains coordinate data.

**From `<address>` with `data-*` attributes:**

```html
<address id="office" data-lat="40.7484" data-lng="-73.9857">
  20 W 34th St, New York, NY 10001
</address>

<geo-map src="office"></geo-map>
```

**From JSON-LD script:**

```html
<script type="application/ld+json" id="place-data">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "The Hi-Dive",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 39.7156,
    "longitude": -104.9874
  }
}
</script>

<geo-map src="place-data"></geo-map>
```

### 3. Slotted `<address>` Child

The component checks its own light DOM children for an `<address>` with `data-lat`/`data-lng`.

```html
<geo-map>
  <address data-lat="40.7484" data-lng="-73.9857">
    Empire State Building<br>
    20 W 34th St, New York, NY 10001
  </address>
</geo-map>
```

### 4. `place` Attribute (JSON-LD scan)

Scans all `<script type="application/ld+json">` on the page for a `Place` or `LocalBusiness` with a matching `name`.

```html
<geo-map place="The Hi-Dive"></geo-map>
```

### 5. Page `<meta>` Geo Tags (lowest priority)

Falls back to standard geo meta tags when no other source is found:

```html
<meta name="geo.position" content="40.7484;-73.9857">
```

**No runtime geocoding.** The component never converts address text to coordinates. Coordinates must be provided explicitly through one of the above mechanisms.

## Shadow DOM Structure

```html
<div part="container">
  <div part="tiles" role="img" aria-label="Map centered on {lat}, {lng}">
    <!-- tile <img> elements positioned absolutely -->
  </div>
  <svg part="marker" aria-hidden="true"><!-- pin icon --></svg>
  <div part="overlay">
    <button part="activate" aria-label="Activate interactive map">
      <!-- expand/interact icon -->
    </button>
  </div>
  <div part="caption">
    <slot></slot>
  </div>
  <div part="attribution">
    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">
      © OpenStreetMap
    </a>
  </div>
</div>
```

## CSS Custom Properties

```css
geo-map {
  --geo-map-height: 300px;
  --geo-map-border-radius: 0.5rem;
  --geo-map-marker-color: #e74c3c;
  --geo-map-marker-size: 32px;
  --geo-map-overlay-bg: rgba(0, 0, 0, 0.3);
  --geo-map-overlay-color: #fff;
  --geo-map-caption-bg: rgba(255, 255, 255, 0.9);
  --geo-map-caption-padding: 0.5rem 0.75rem;
  --geo-map-attribution-font-size: 0.625rem;
}
```

## CSS Parts

| Part | Element | Purpose |
|:-----|:--------|:--------|
| `container` | Outer wrapper | Overall sizing and border radius |
| `tiles` | Tile grid area | Map image area |
| `marker` | SVG pin | Marker styling |
| `overlay` | Click-to-activate layer | Hover/focus state |
| `activate` | Button inside overlay | The interaction trigger |
| `caption` | Slot wrapper | Address/label display |
| `attribution` | OSM credit | Required attribution link |

## Events

| Event | Detail | When |
|:------|:-------|:-----|
| `geo-map:activate` | `{ lat, lng, zoom }` | User clicks to activate interactive mode |
| `geo-map:move` | `{ lat, lng, zoom }` | Map panned or zoomed (interactive mode) |
| `geo-map:ready` | `{ lat, lng, zoom }` | Static tiles finished loading |
| `geo-map:error` | `{ message }` | Tile load failure or missing coordinates |

## File Structure

```
geo-map/
  geo-map.js          — custom element definition
  geo-map.css         — default styles (imported as string or inline)
  geo-map-interact.js — interactive pan/zoom module (lazy loaded)
  README.md
  demo/
    index.html        — all usage patterns
    address.html      — <address> binding demo
    jsonld.html       — JSON-LD binding demo
    providers.html    — tile provider comparison
```

## Implementation Plan

### Phase 1: Static Facade

- [ ] Custom element registration with observed attributes
- [ ] Tile coordinate math (lat/lng/zoom → tile x/y + pixel offset)
- [ ] Tile grid rendering (3×3 tile grid, clipped to component bounds)
- [ ] SVG marker pin overlay
- [ ] `<address>` slot rendering as caption
- [ ] OSM attribution
- [ ] CSS custom properties and parts
- [ ] No-JS fallback styling (`:not(:defined)` selector)

### Phase 2: Data Binding

- [ ] Attribute-based coordinates
- [ ] `src` ID reference resolution (address and JSON-LD)
- [ ] Slotted `<address>` with `data-lat`/`data-lng`
- [ ] `place` attribute JSON-LD page scan
- [ ] `<meta name="geo.position">` fallback
- [ ] Error state when no coordinates found

### Phase 3: Interactive Mode

- [ ] Click-to-activate with preconnect on hover
- [ ] Minimal pan handler (mouse drag + touch)
- [ ] Zoom handler (wheel + pinch)
- [ ] Dynamic tile loading on viewport change
- [ ] Momentum/inertia scrolling
- [ ] Keyboard navigation (arrow keys to pan, +/- to zoom)

### Phase 4: Provider Support and Polish

- [ ] Carto Light/Dark tile URLs
- [ ] Optional Leaflet lazy-load path
- [ ] `static-only` mode
- [ ] Print styles (ensure tiles render)
- [ ] Reduced motion: disable animations
- [ ] High contrast: ensure marker visibility

## Accessibility

- Static mode: `role="img"` with `aria-label` describing the location
- Activate button: focusable, labeled, responds to Enter/Space
- Interactive mode: arrow key panning, +/- zooming, Escape to deactivate
- Caption (`<address>` content) remains visible and readable in all states
- Respect `prefers-reduced-motion` for transitions

## Tile Providers (no API key required)

| Provider | URL Pattern | Style |
|:---------|:-----------|:------|
| OSM | `tile.openstreetmap.org/{z}/{x}/{y}.png` | Standard |
| Carto Light | `basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png` | Minimal light |
| Carto Dark | `basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` | Minimal dark |

> **Note:** All providers require attribution. OSM and Carto both have tile usage policies that prohibit heavy automated usage. This component is designed for typical web page embeds, not bulk tile scraping.

## Open Questions

- Should the component generate a fallback `<a>` link automatically if none is slotted? (Leaning yes — build the OSM permalink from lat/lng.)
- Should `src` support CSS selector syntax instead of bare IDs? (Leaning no — keep it simple, IDs are fine.)
- Should there be a `directions` attribute that links to routing? (Nice to have, not MVP.)
- Should the interactive viewer support GeoJSON overlays? (Post-MVP — scope creep risk.)
- Canvas-based tile compositing vs. CSS grid of `<img>` elements? (CSS grid is simpler, more debuggable, better for print. Canvas gives pixel-perfect positioning. Start with CSS grid.)

## Usage Examples

### Minimal

```html
<geo-map lat="48.8566" lng="2.3522" zoom="13"></geo-map>
```

### With Address Fallback

```html
<geo-map lat="48.8566" lng="2.3522" zoom="16">
  <address>
    <strong>Eiffel Tower</strong><br>
    <a href="https://www.openstreetmap.org/?mlat=48.8566&mlon=2.3522">
      Champ de Mars, 5 Av. Anatole France<br>
      75007 Paris, France
    </a>
  </address>
</geo-map>
```

### From JSON-LD

```html
<script type="application/ld+json" id="my-business">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "My Coffee Shop",
  "geo": { "@type": "GeoCoordinates", "latitude": 34.0522, "longitude": -118.2437 },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Los Angeles",
    "addressRegion": "CA"
  }
}
</script>

<geo-map src="my-business">
  <address>
    <strong>My Coffee Shop</strong><br>
    123 Main St, Los Angeles, CA
  </address>
</geo-map>
```

### Static Only (contact page)

```html
<geo-map lat="34.0195" lng="-117.8107" zoom="14" static-only>
  <address>
    <strong>Our Office</strong><br>
    Diamond Bar, CA
  </address>
</geo-map>
```

### Dark Theme

```html
<geo-map lat="51.5074" lng="-0.1278" provider="carto-dark"></geo-map>
```