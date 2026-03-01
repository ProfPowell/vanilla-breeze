/**
 * Mock image URL utility
 *
 * Generates placeholder image URLs from popular services.
 * Useful for JS-driven scenarios (dynamic galleries, programmatic mockups).
 *
 * @example
 * VanillaBreeze.mock.imageUrl({ service: 'picsum', width: 400, height: 300, seed: 42 });
 * // → 'https://picsum.photos/seed/42/400/300'
 *
 * VanillaBreeze.mock.imageUrl({ service: 'placehold', width: 400, height: 300, text: 'Hero' });
 * // → 'https://placehold.co/400x300?text=Hero'
 */

/**
 * Generate a placeholder image URL
 * @param {object} options
 * @param {'picsum'|'placehold'} [options.service='picsum'] - Image service
 * @param {number} [options.width=400] - Image width
 * @param {number} [options.height=300] - Image height
 * @param {string|number} [options.seed] - Reproducible seed (picsum)
 * @param {string} [options.text] - Label text (placehold.co)
 * @param {string} [options.bg] - Background color hex without # (placehold.co)
 * @param {string} [options.color] - Text color hex without # (placehold.co)
 * @returns {string} Placeholder image URL
 */
function imageUrl(options = {}) {
  const {
    service = 'picsum',
    width = 400,
    height = 300,
    seed,
    text,
    bg,
    color,
  } = options;

  if (service === 'placehold') {
    const params = new URLSearchParams();
    if (text) params.set('text', text);
    if (color) params.set('color', color);
    const query = params.toString();
    const base = bg
      ? `https://placehold.co/${width}x${height}/${bg}`
      : `https://placehold.co/${width}x${height}`;
    return query ? `${base}?${query}` : base;
  }

  // Default: picsum
  if (seed != null) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
  }
  return `https://picsum.photos/${width}/${height}`;
}

const mock = { imageUrl };

// Expose on VanillaBreeze namespace
if (typeof window !== 'undefined') {
  window.VanillaBreeze = window.VanillaBreeze || {};
  window.VanillaBreeze.mock = mock;
}

export { mock, imageUrl };
