/**
 * Starter templates for the grid composer.
 * Each template matches the serialize() data format.
 */

export const TEMPLATES = {
  'holy-grail': {
    name: 'Holy Grail',
    grid: { cols: 12, gap: '0.75rem', rowSize: '3rem', maxWidth: '1100px' },
    blocks: [
      { tag: 'header',  col: 1, cspan: 12, row: 1, rspan: 2, subgrid: false },
      { tag: 'nav',     col: 1, cspan: 2,  row: 3, rspan: 6, subgrid: false },
      { tag: 'main',    col: 3, cspan: 8,  row: 3, rspan: 6, subgrid: false },
      { tag: 'aside',   col: 11, cspan: 2, row: 3, rspan: 6, subgrid: false },
      { tag: 'footer',  col: 1, cspan: 12, row: 9, rspan: 2, subgrid: false },
    ],
  },

  'blog': {
    name: 'Blog',
    grid: { cols: 12, gap: '0.75rem', rowSize: '3rem', maxWidth: '1100px' },
    blocks: [
      { tag: 'header',  col: 1, cspan: 12, row: 1, rspan: 2, subgrid: false },
      {
        tag: 'main', col: 1, cspan: 9, row: 3, rspan: 8, subgrid: true,
        children: [
          { tag: 'article', col: 1, cspan: 9, row: 1, rspan: 6, subgrid: false },
          { tag: 'nav',     col: 1, cspan: 9, row: 7, rspan: 2, subgrid: false },
        ],
      },
      { tag: 'aside',   col: 10, cspan: 3, row: 3, rspan: 8, subgrid: false },
      { tag: 'footer',  col: 1, cspan: 12, row: 11, rspan: 2, subgrid: false },
    ],
  },

  'marketing': {
    name: 'Marketing',
    grid: { cols: 12, gap: '0.75rem', rowSize: '3rem', maxWidth: '1100px' },
    blocks: [
      { tag: 'header',  col: 1,  cspan: 12, row: 1,  rspan: 2, subgrid: false },
      { tag: 'section', col: 1,  cspan: 12, row: 3,  rspan: 4, subgrid: false },
      { tag: 'section', col: 1,  cspan: 4,  row: 7,  rspan: 4, subgrid: false },
      { tag: 'section', col: 5,  cspan: 4,  row: 7,  rspan: 4, subgrid: false },
      { tag: 'section', col: 9,  cspan: 4,  row: 7,  rspan: 4, subgrid: false },
      { tag: 'section', col: 1,  cspan: 12, row: 11, rspan: 3, subgrid: false },
      { tag: 'footer',  col: 1,  cspan: 12, row: 14, rspan: 2, subgrid: false },
    ],
  },
};
