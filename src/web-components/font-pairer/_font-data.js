/**
 * Curated font list and pairing suggestions for the font-pairer component.
 * Each font includes metadata for categorization and pairing logic.
 */

/**
 * @typedef {{ name: string, category: string, weights: string, style: string }} FontEntry
 */

/** @type {FontEntry[]} */
export const FONTS = [
  // Serif
  { name: 'Playfair Display', category: 'serif', weights: '400;600;700;900', style: 'elegant' },
  { name: 'Merriweather',     category: 'serif', weights: '300;400;700;900', style: 'readable' },
  { name: 'Lora',             category: 'serif', weights: '400;500;600;700', style: 'elegant' },
  { name: 'Source Serif 4',   category: 'serif', weights: '300;400;600;700', style: 'neutral' },
  { name: 'Libre Baskerville',category: 'serif', weights: '400;700',         style: 'classic' },
  { name: 'Crimson Text',     category: 'serif', weights: '400;600;700',     style: 'classic' },
  { name: 'DM Serif Display', category: 'serif', weights: '400',             style: 'bold' },
  { name: 'Cormorant Garamond', category: 'serif', weights: '300;400;500;600;700', style: 'elegant' },

  // Sans-Serif
  { name: 'Inter',            category: 'sans-serif', weights: '300;400;500;600;700', style: 'neutral' },
  { name: 'Open Sans',        category: 'sans-serif', weights: '300;400;600;700',     style: 'friendly' },
  { name: 'Roboto',           category: 'sans-serif', weights: '300;400;500;700',     style: 'neutral' },
  { name: 'Lato',             category: 'sans-serif', weights: '300;400;700;900',     style: 'warm' },
  { name: 'Nunito',           category: 'sans-serif', weights: '300;400;600;700',     style: 'friendly' },
  { name: 'Work Sans',        category: 'sans-serif', weights: '300;400;500;600;700', style: 'geometric' },
  { name: 'DM Sans',          category: 'sans-serif', weights: '400;500;700',         style: 'geometric' },
  { name: 'Plus Jakarta Sans',category: 'sans-serif', weights: '300;400;500;600;700', style: 'modern' },
  { name: 'Space Grotesk',    category: 'sans-serif', weights: '300;400;500;600;700', style: 'technical' },
  { name: 'Manrope',          category: 'sans-serif', weights: '300;400;500;600;700', style: 'geometric' },
  { name: 'IBM Plex Sans',    category: 'sans-serif', weights: '300;400;500;600',     style: 'technical' },
  { name: 'Outfit',           category: 'sans-serif', weights: '300;400;500;600;700', style: 'modern' },

  // Display
  { name: 'Bebas Neue',       category: 'display', weights: '400',             style: 'bold' },
  { name: 'Abril Fatface',    category: 'display', weights: '400',             style: 'elegant' },
  { name: 'Oswald',           category: 'display', weights: '300;400;500;600;700', style: 'condensed' },
  { name: 'Sora',             category: 'display', weights: '300;400;500;600;700', style: 'modern' },
  { name: 'Fraunces',         category: 'display', weights: '300;400;500;600;700;900', style: 'elegant' },

  // Monospace
  { name: 'JetBrains Mono',   category: 'monospace', weights: '400;500;600;700', style: 'technical' },
  { name: 'Fira Code',        category: 'monospace', weights: '300;400;500;600;700', style: 'technical' },
  { name: 'IBM Plex Mono',    category: 'monospace', weights: '400;500;600',     style: 'technical' },
  { name: 'Source Code Pro',  category: 'monospace', weights: '300;400;500;600;700', style: 'neutral' },
];

/** Curated pairings: [heading, body] */
export const SUGGESTED_PAIRINGS = [
  ['Playfair Display', 'Inter'],
  ['DM Serif Display', 'DM Sans'],
  ['Fraunces',         'Plus Jakarta Sans'],
  ['Lora',             'Open Sans'],
  ['Merriweather',     'Roboto'],
  ['Oswald',           'Lato'],
  ['Cormorant Garamond', 'Work Sans'],
  ['Sora',             'Inter'],
  ['Abril Fatface',    'Nunito'],
  ['Source Serif 4',   'Source Code Pro'],
  ['Space Grotesk',    'IBM Plex Sans'],
  ['Outfit',           'Manrope'],
];

/**
 * Build a Google Fonts URL for a font.
 * @param {string} family
 * @param {string} weights
 * @returns {string}
 */
export function googleFontsUrl(family, weights = '400;700') {
  const encoded = family.replace(/\s+/g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights}&display=swap`;
}

/**
 * Load a Google Font by injecting a <link> tag (deduplicates).
 * @param {string} family
 * @param {string} weights
 * @returns {Promise<void>}
 */
export async function loadFont(family, weights = '400;700') {
  const id = `gf-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) {
    await document.fonts.ready;
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = googleFontsUrl(family, weights);
  document.head.appendChild(link);
  await document.fonts.ready;
}
