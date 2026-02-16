/**
 * Serialize — DOM → JSON for the grid composer.
 * Pure functions, no side effects.
 */

export const BLOCK_TAGS = [
  'header', 'main', 'aside', 'footer',
  'section', 'article', 'nav', 'figure', 'form',
];

/** Direct-child selector (scoped to parent). */
export const BLOCK_SELECTOR =
  ':scope > :is(header, main, aside, footer, section, article, nav, figure, form)';

/**
 * Serialize a single block element into a data object.
 * Recurses into subgrid children.
 */
function serializeBlock(el) {
  const data = {
    tag:     el.localName,
    col:     parseInt(el.style.getPropertyValue('--col'),   10) || 1,
    cspan:   parseInt(el.style.getPropertyValue('--cspan'), 10) || 12,
    row:     parseInt(el.style.getPropertyValue('--row'),   10) || 1,
    rspan:   parseInt(el.style.getPropertyValue('--rspan'), 10) || 2,
    subgrid: el.hasAttribute('data-subgrid'),
  };
  if (data.subgrid) {
    const children = [...el.querySelectorAll(BLOCK_SELECTOR)];
    if (children.length) data.children = children.map(serializeBlock);
  }
  return data;
}

/**
 * Read the canvas DOM into a plain data object.
 * @param {HTMLElement} canvas - The vb-canvas element
 * @returns {{ grid: object, blocks: object[] }}
 */
export function serialize(canvas) {
  const cs = getComputedStyle(canvas);
  const blocks = [...canvas.querySelectorAll(BLOCK_SELECTOR)];

  return {
    grid: {
      cols:    parseInt(cs.getPropertyValue('--cols'), 10) || 12,
      rowSize: cs.getPropertyValue('--row-size').trim() || '3rem',
      gap:     cs.getPropertyValue('--gap').trim()      || '1rem',
      maxWidth: cs.getPropertyValue('--max-w').trim()   || '1100px',
    },
    blocks: blocks.map(serializeBlock),
  };
}
