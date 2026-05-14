/**
 * layout-specimen: Visual specimen of VB layout primitives for design-system docs.
 *
 * Renders each layout custom element with a labeled mini-example and the
 * canonical HTML snippet. Lets docs readers see the pattern + copy it.
 *
 * @attr {string} data-only - Comma-separated subset (e.g. "cluster,grid,stack").
 *                            Defaults to all primitives below.
 *
 * Adjacent: spacing-specimen, type-specimen, motion-specimen, breakpoint-specimen,
 *           token-specimen — each visualizes a different design-system axis.
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * Each entry: { name, desc, snippet, render(box) }
 *  - snippet is the source HTML to display in the code block
 *  - render() returns a DOM tree for the live mini-example
 */
const PRIMITIVES = [
  {
    name: 'layout-stack',
    desc: 'Vertical stack with consistent gap between children.',
    snippet: `<layout-stack data-layout-gap="m">
  <p>One</p>
  <p>Two</p>
  <p>Three</p>
</layout-stack>`,
    render: () => el('layout-stack', { 'data-layout-gap': 's' }, [box('One'), box('Two'), box('Three')]),
  },
  {
    name: 'layout-cluster',
    desc: 'Horizontal cluster that wraps; for tag rows, button groups.',
    snippet: `<layout-cluster data-layout-gap="s">
  <button>One</button> <button>Two</button> <button>Three</button>
</layout-cluster>`,
    render: () => el('layout-cluster', { 'data-layout-gap': 's' }, [chip('One'), chip('Two'), chip('Three'), chip('Four')]),
  },
  {
    name: 'layout-grid',
    desc: 'Auto-fit responsive grid; columns flow based on min-item-size.',
    snippet: `<layout-grid data-layout-min="12rem">
  <div>1</div> <div>2</div> <div>3</div> <div>4</div>
</layout-grid>`,
    render: () => el('layout-grid', { 'data-layout-min': '6rem', 'data-layout-gap': 's' }, [box('1'), box('2'), box('3'), box('4'), box('5'), box('6')]),
  },
  {
    name: 'layout-center',
    desc: 'Center a block horizontally with optional max-width.',
    snippet: `<layout-center data-layout-max="readable">
  <p>Centered prose.</p>
</layout-center>`,
    render: () => el('layout-center', { 'data-layout-max': 'narrow', style: 'border: 1px dashed var(--color-border); padding: var(--size-2xs)' }, [box('Centered')]),
  },
  {
    name: 'layout-cover',
    desc: 'Vertical cover layout: optional header + main area + optional footer, with main filling available space.',
    snippet: `<layout-cover style="block-size: 12rem">
  <header>Top</header>
  <main>Center</main>
  <footer>Bottom</footer>
</layout-cover>`,
    render: () => el('layout-cover', { style: 'block-size: 9rem; border: 1px dashed var(--color-border); padding: var(--size-2xs)' }, [
      el('header', {}, [box('Top')]),
      el('main', {}, [box('Center', 'main')]),
      el('footer', {}, [box('Bottom')]),
    ]),
  },
  {
    name: 'layout-imposter',
    desc: 'Absolute centering — child sits in the dead center of the parent.',
    snippet: `<div style="position:relative; block-size:8rem">
  <layout-imposter><span>Centered</span></layout-imposter>
</div>`,
    render: () => el('div', { style: 'position:relative; block-size: 6rem; border: 1px dashed var(--color-border)' }, [
      el('layout-imposter', {}, [box('Imposter')]),
    ]),
  },
  {
    name: 'layout-columns',
    desc: 'Multi-column text layout (CSS columns); good for newspapery prose.',
    snippet: `<layout-columns data-layout-columns="3">
  <p>Long prose flows across columns…</p>
</layout-columns>`,
    render: () => el('layout-columns', { 'data-layout-columns': '3' }, [
      el('p', { style: 'margin: 0; font-size: 0.85em' }, ['One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen.']),
    ]),
  },
  {
    name: 'layout-card',
    desc: 'Stack of header + body + actions with card chrome (border + padding).',
    snippet: `<layout-card>
  <h3>Title</h3>
  <p>Body text.</p>
  <div data-layout-card-actions><button>OK</button></div>
</layout-card>`,
    render: () => el('layout-card', {}, [
      el('h3', { style: 'margin: 0; font-size: 0.9em' }, ['Card title']),
      el('p', { style: 'margin: 0; font-size: 0.85em' }, ['Card body content.']),
    ]),
  },
  {
    name: 'layout-canvas',
    desc: 'Full-bleed canvas section that breaks the centered max-width.',
    snippet: `<layout-canvas>
  <p>Edge-to-edge content.</p>
</layout-canvas>`,
    render: () => el('layout-canvas', { style: 'background: var(--color-surface-sunken, oklch(94% 0 0)); padding: var(--size-2xs)' }, [box('Full-bleed')]),
  },
  {
    name: 'layout-badge',
    desc: 'Tiny inline badge / pill for inline labels.',
    snippet: `<layout-badge>NEW</layout-badge>`,
    render: () => el('layout-cluster', { 'data-layout-gap': 'xs' }, [
      el('layout-badge', {}, ['NEW']),
      el('layout-badge', {}, ['BETA']),
      el('layout-badge', {}, ['v2.0']),
    ]),
  },
  {
    name: 'layout-reel',
    desc: 'Horizontal scrollable reel with snap points.',
    snippet: `<layout-reel>
  <article>1</article> <article>2</article> <article>3</article>
</layout-reel>`,
    render: () => el('layout-reel', {}, [box('1', 'reel'), box('2', 'reel'), box('3', 'reel'), box('4', 'reel'), box('5', 'reel'), box('6', 'reel')]),
  },
  {
    name: 'layout-sidebar',
    desc: 'Sidebar + main split that collapses to a stack on narrow viewports.',
    snippet: `<layout-sidebar>
  <aside>Side</aside>
  <main>Main</main>
</layout-sidebar>`,
    render: () => el('layout-sidebar', {}, [
      el('aside', { style: 'background: var(--color-surface-sunken, oklch(94% 0 0)); padding: var(--size-2xs)' }, ['Side']),
      el('main', {}, [box('Main')]),
    ]),
  },
  {
    name: 'layout-switcher',
    desc: 'Container that switches from a row to a stack at a configurable threshold.',
    snippet: `<layout-switcher data-layout-threshold="30rem">
  <div>One</div> <div>Two</div>
</layout-switcher>`,
    render: () => el('layout-switcher', { 'data-layout-threshold': '20rem' }, [box('One'), box('Two')]),
  },
  {
    name: 'layout-text',
    desc: 'Constrains line length to a readable measure (~60ch).',
    snippet: `<layout-text>
  <p>Constrained-measure prose for comfortable reading.</p>
</layout-text>`,
    render: () => el('layout-text', {}, [
      el('p', { style: 'margin: 0; font-size: 0.85em' }, ['This paragraph is constrained to a comfortable reading measure (~60ch) regardless of the parent width.']),
    ]),
  },
];

// ── Tiny element-builder helper (no JSX, no template literal HTML parsing) ────

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'style') node.setAttribute('style', v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) {
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else if (c) node.appendChild(c);
  }
  return node;
}

function box(label, variant) {
  const b = el('div', { class: `ls-box${variant ? ` ls-box-${variant}` : ''}` }, [label]);
  return b;
}

function chip(label) {
  return el('span', { class: 'ls-chip' }, [label]);
}

class LayoutSpecimen extends VBElement {
  setup() {
    const only = this.getAttribute('data-only');
    const allowed = only ? new Set(only.split(',').map((s) => s.trim())) : null;
    const list = PRIMITIVES.filter((p) => !allowed || allowed.has(p.name) || allowed.has(p.name.replace(/^layout-/, '')));

    this.replaceChildren();
    for (const prim of list) {
      this.appendChild(this.#renderEntry(prim));
    }
  }

  #renderEntry(prim) {
    const section = el('section', { class: 'ls-entry' });

    const head = el('header', { class: 'ls-entry-head' }, [
      el('h3', { class: 'ls-entry-name' }, [prim.name]),
      el('p', { class: 'ls-entry-desc' }, [prim.desc]),
    ]);

    const live = el('div', { class: 'ls-live' });
    live.appendChild(prim.render());

    const code = el('pre', { class: 'ls-snippet' }, [el('code', {}, [prim.snippet])]);

    section.append(head, live, code);
    return section;
  }
}

registerComponent('layout-specimen', LayoutSpecimen);

export { LayoutSpecimen };
