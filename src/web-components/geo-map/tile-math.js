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
 * Build a tile URL for the given provider and coordinates.
 *
 * @param {string} provider - 'osm', 'carto-light', or 'carto-dark'
 * @param {number} z - Zoom level
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @returns {string} Tile image URL
 */
export function getTileUrl(provider, z, x, y) {
    switch (provider) {
        case 'carto-light':
            return `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;
        case 'carto-dark':
            return `https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`;
        case 'osm':
        default:
            return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
}
