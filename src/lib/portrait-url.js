/**
 * Portrait URL utility
 *
 * Generates deterministic portrait image URLs from the faker-js
 * person-portrait CDN assets (CC0 licensed, AI-generated).
 *
 * 200 unique portraits (100 male, 100 female) at 5 sizes:
 *   32, 64, 128, 256, 512 px (square).
 *
 * @example
 * portraitUrl('Sarah Chen');
 * // → 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/128/37.jpg'
 *
 * portraitUrl('Marcus Johnson', 256);
 * // → 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/256/82.jpg'
 */

const CDN = 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait';
const SIZES = [32, 64, 128, 256, 512];

/**
 * Simple string hash (same algorithm as _ux-base.js hashColor).
 * @param {string} str
 * @returns {number}
 */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  return h;
}

/**
 * Snap a pixel value to the nearest available portrait size.
 * @param {number} px - Desired size in pixels
 * @returns {number} Closest available size (32, 64, 128, 256, or 512)
 */
function snapSize(px) {
  let best = SIZES[0];
  let bestDist = Math.abs(px - best);
  for (let i = 1; i < SIZES.length; i++) {
    const dist = Math.abs(px - SIZES[i]);
    if (dist < bestDist) {
      best = SIZES[i];
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Generate a deterministic portrait URL from a seed string.
 *
 * The same seed always produces the same portrait. Sex and index are
 * derived from the seed hash, so names cluster naturally — different
 * names get different faces.
 *
 * @param {string} seed  - Any string (name, ID, index, etc.)
 * @param {number} [size=128] - Desired image size in px (snapped to nearest available)
 * @returns {string} CDN URL for the portrait JPEG
 */
export function portraitUrl(seed, size = 128) {
  const h = hash(String(seed));
  const index = ((h % 100) + 100) % 100;
  const sex = ((h >>> 16) & 1) === 0 ? 'female' : 'male';
  const snapped = snapSize(size);
  return `${CDN}/${sex}/${snapped}/${index}.jpg`;
}

/**
 * Get a portrait URL by explicit numeric index (0–199).
 * 0–99 = female, 100–199 = male.
 *
 * @param {number} index - Portrait index (0–199)
 * @param {number} [size=128] - Desired image size in px
 * @returns {string} CDN URL
 */
export function portraitByIndex(index, size = 128) {
  const i = ((index % 200) + 200) % 200;
  const sex = i < 100 ? 'female' : 'male';
  const fileIndex = i < 100 ? i : i - 100;
  const snapped = snapSize(size);
  return `${CDN}/${sex}/${snapped}/${fileIndex}.jpg`;
}

export { SIZES as PORTRAIT_SIZES, CDN as PORTRAIT_CDN };
