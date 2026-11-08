/**
 * Stamp effect — injects the SVG noise filter (#vb-stamp-noise) that the
 * stamp CSS references with `filter: url(#vb-stamp-noise)`. One filter per
 * document, shared by every stamp. Without it the browser drops the filter
 * and the stamp renders clean (no ink texture), so this module must ship in
 * every JS bundle whose CSS bundle carries the stamp rules.
 */

import { VB } from '../lib/vb.js'

const FILTER_ID = 'vb-stamp-noise'
const SVG_NS = 'http://www.w3.org/2000/svg'

function ensureFilter() {
  if (document.getElementById(FILTER_ID)) return
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.style.overflow = 'hidden'

  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.id = FILTER_ID
  for (const [k, v] of Object.entries({ x: '-5%', y: '-5%', width: '110%', height: '110%' })) filter.setAttribute(k, v)

  const turbulence = document.createElementNS(SVG_NS, 'feTurbulence')
  for (const [k, v] of Object.entries({ type: 'fractalNoise', baseFrequency: '0.75', numOctaves: '4', stitchTiles: 'stitch', result: 'noise' })) turbulence.setAttribute(k, v)
  const matrix = document.createElementNS(SVG_NS, 'feColorMatrix')
  for (const [k, v] of Object.entries({ type: 'saturate', values: '0', in: 'noise', result: 'greyNoise' })) matrix.setAttribute(k, v)
  const composite = document.createElementNS(SVG_NS, 'feComposite')
  for (const [k, v] of Object.entries({ in: 'SourceGraphic', in2: 'greyNoise', operator: 'in' })) composite.setAttribute(k, v)

  filter.append(turbulence, matrix, composite)
  const defs = document.createElementNS(SVG_NS, 'defs')
  defs.append(filter)
  svg.append(defs)
  document.body.prepend(svg)
}

VB.effect('stamp', () => {
  ensureFilter()
  // The filter is shared, so removing one stamp never removes it.
  return { cleanup() {} }
})
