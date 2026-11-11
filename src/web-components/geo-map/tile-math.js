/**
 * tile-math.js — Pure coordinate math for geo-map
 *
 * Standard OSM slippy map tile calculations.
 * Zero DOM dependency, easily testable.
 */

/**
 * Convert lat/lng/zoom to tile coordinates and sub-tile pixel offset.
 *
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} zoom - Zoom level (1–19)
 * @returns {{ tileX: number, tileY: number, pixelX: number, pixelY: number }}
 */
export function latLngToTile(lat, lng, zoom) {
    const n = Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;

    const xFloat = ((lng + 180) / 360) * n;
    const yFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

    const tileX = Math.floor(xFloat);
    const tileY = Math.floor(yFloat);

    // Sub-tile pixel offset (tiles are 256×256)
    const pixelX = Math.round((xFloat - tileX) * 256);
    const pixelY = Math.round((yFloat - tileY) * 256);

    return { tileX, tileY, pixelX, pixelY };
}

/**
 * Convert world pixel coordinates back to lat/lng.
 * Inverse of the Mercator projection used by OSM tiles.
 *
 * @param {number} worldX - World pixel X at the given zoom
 * @param {number} worldY - World pixel Y at the given zoom
 * @param {number} zoom - Zoom level
 * @returns {{ lat: number, lng: number }}
 */
export function worldPixelToLatLng(worldX, worldY, zoom) {
    const worldSize = 256 * Math.pow(2, zoom);
    const lng = (worldX / worldSize) * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * worldY) / worldSize)));
    const lat = (latRad * 180) / Math.PI;
    return { lat, lng };
}

/**
 * Convert lat/lng to world pixel coordinates at a zoom level (fractional).
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} zoom
 * @returns {{ x: number, y: number }}
 */
export function latLngToWorldPixel(lat, lng, zoom) {
    const worldSize = 256 * Math.pow(2, zoom);
    const latRad = (lat * Math.PI) / 180;
    return {
        x: ((lng + 180) / 360) * worldSize,
        y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * worldSize,
    };
}

/**
 * Built-in providers: URL template, origin (for preconnect / CSP img-src)
 * and the credit each provider's terms require.
 */
export const PROVIDERS = {
    osm: {
        template: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        origin: 'https://tile.openstreetmap.org',
        credits: [{ text: '\u00A9 OpenStreetMap contributors', href: 'https://www.openstreetmap.org/copyright' }],
    },
    'carto-light': {
        template: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        origin: 'https://basemaps.cartocdn.com',
        credits: [
            { text: '\u00A9 OpenStreetMap contributors', href: 'https://www.openstreetmap.org/copyright' },
            { text: '\u00A9 CARTO', href: 'https://carto.com/attributions' },
        ],
    },
    'carto-dark': {
        template: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        origin: 'https://basemaps.cartocdn.com',
        credits: [
            { text: '\u00A9 OpenStreetMap contributors', href: 'https://www.openstreetmap.org/copyright' },
            { text: '\u00A9 CARTO', href: 'https://carto.com/attributions' },
        ],
    },
};

/**
 * Fill a tile URL template. Every occurrence of each placeholder is
 * replaced: {z} {x} {y}, {s} (subdomain a/b/c, rotated per tile so a
 * browser spreads requests) and {r} ("@2x" on high-density screens, else "").
 *
 * @param {string} template
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @param {number} [dpr] - Device pixel ratio (defaults to window.devicePixelRatio)
 * @returns {string}
 */
export function fillTemplate(template, z, x, y, dpr) {
    const ratio = dpr ?? (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
    const sub = 'abc'[Math.abs(x + y) % 3];
    return template
        .replaceAll('{z}', String(z))
        .replaceAll('{x}', String(x))
        .replaceAll('{y}', String(y))
        .replaceAll('{s}', sub)
        .replaceAll('{r}', ratio > 1 ? '@2x' : '');
}

/**
 * Build a tile URL for the given provider and coordinates.
 *
 * @param {string} provider - 'osm', 'carto-light' or 'carto-dark'
 *   (resolve 'carto-auto' before calling)
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {string} [tileUrlTemplate] - Optional URL template. When set it
 *   wins over `provider` — used by the first-party tile proxy pattern
 *   (see /docs/extensibility/service-facade/).
 * @returns {string} Tile image URL
 */
export function getTileUrl(provider, z, x, y, tileUrlTemplate) {
    const template = tileUrlTemplate || (PROVIDERS[provider] ?? PROVIDERS.osm).template;
    return fillTemplate(template, z, x, y);
}
