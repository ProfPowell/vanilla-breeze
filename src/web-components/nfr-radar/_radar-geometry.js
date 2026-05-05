/**
 * Pure geometry helpers + SVG builder for <nfr-radar>.
 *
 * 11 (or N) evenly-spaced axes starting at the top, going clockwise.
 * Two layers: a capacity envelope (semi-transparent polygon) and a
 * vector overlay (opaque polygon with per-axis dot markers).
 *
 * Pure functions are unit-tested without DOM. The buildRadarSvg()
 * builder is exercised in browser tests.
 */

const LEVEL_RATIO = Object.freeze({
  critical:       1,
  important:      0.6,
  acceptable:     0.3,
  'not-relevant': 0,
});

/** N axis angles starting at the top, equally spaced, clockwise. */
export function axisAngles(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(-Math.PI / 2 + (2 * Math.PI * i) / n);
  }
  return out;
}

/**
 * Fraction of `radius` the capacity envelope reaches on each axis.
 * Returns null when capacity is unbounded (no enforceable envelope).
 */
export function envelopeRatio({ costWeights = {}, capacityPoints, ilities }) {
  if (!Number.isFinite(capacityPoints)) return null;
  const total = ilities.reduce((s, k) => {
    const w = Number(costWeights[k]);
    return s + (Number.isFinite(w) && w > 0 ? w : 0);
  }, 0);
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, capacityPoints / total));
}

/** Per-ility {x, y, ility, level} points for the chosen vector. */
export function vectorPoints({ ilities, vector = {}, radius }) {
  const angles = axisAngles(ilities.length);
  return ilities.map((k, i) => {
    const level = vector[k] || null;
    const ratio = LEVEL_RATIO[level] ?? 0;
    return {
      ility: k,
      level,
      x: round(Math.cos(angles[i]) * radius * ratio),
      y: round(Math.sin(angles[i]) * radius * ratio),
    };
  });
}

/** Per-ility {x, y, ility} points for the capacity envelope. */
export function envelopePoints({ ilities, costWeights, capacityPoints, radius }) {
  const ratio = envelopeRatio({ costWeights, capacityPoints, ilities });
  if (ratio == null) return null;
  const angles = axisAngles(ilities.length);
  return ilities.map((k, i) => ({
    ility: k,
    x: round(Math.cos(angles[i]) * radius * ratio),
    y: round(Math.sin(angles[i]) * radius * ratio),
  }));
}

/** Outer axis endpoints (label anchors) for `radius`. */
export function axisOuterPoints({ ilities, radius }) {
  const angles = axisAngles(ilities.length);
  return ilities.map((k, i) => ({
    ility: k,
    x: round(Math.cos(angles[i]) * radius),
    y: round(Math.sin(angles[i]) * radius),
  }));
}

/**
 * Build a complete inline <svg> for the radar. DOM-required.
 * Layers (back to front): grid spokes → envelope polygon → vector
 * polygon → vector dot markers (with <title> for native tooltips).
 */
export function buildRadarSvg({
  ilities,
  vector,
  costWeights,
  capacityPoints,
  radius = 90,
  showEnvelope = true,
} = {}) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const labelRadius = radius + 14;
  const viewBoxPad = labelRadius + 12;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox',
    `${-viewBoxPad} ${-viewBoxPad} ${viewBoxPad * 2} ${viewBoxPad * 2}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', radarAriaLabel({ ilities, vector }));

  // 1. Grid spokes — one line from origin to each axis tip.
  const spokes = axisOuterPoints({ ilities, radius });
  for (const p of spokes) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 'spoke');
    line.setAttribute('x1', '0'); line.setAttribute('y1', '0');
    line.setAttribute('x2', String(p.x)); line.setAttribute('y2', String(p.y));
    svg.append(line);
  }

  // 2. Envelope polygon (under the vector).
  if (showEnvelope) {
    const env = envelopePoints({ ilities, costWeights, capacityPoints, radius });
    if (env) {
      const env_poly = document.createElementNS(SVG_NS, 'polygon');
      env_poly.setAttribute('class', 'envelope');
      env_poly.setAttribute('points', env.map(p => `${p.x},${p.y}`).join(' '));
      svg.append(env_poly);
    }
  }

  // 3. Vector polygon.
  const vec = vectorPoints({ ilities, vector, radius });
  const poly = document.createElementNS(SVG_NS, 'polygon');
  poly.setAttribute('class', 'vector');
  poly.setAttribute('points', vec.map(p => `${p.x},${p.y}`).join(' '));
  svg.append(poly);

  // 4. Vector dot markers + native <title> tooltips.
  for (const p of vec) {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'marker');
    g.dataset.ility = p.ility;
    if (p.level) g.dataset.level = p.level;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(p.x));
    dot.setAttribute('cy', String(p.y));
    dot.setAttribute('r', '3');
    g.append(dot);
    const title = document.createElementNS(SVG_NS, 'title');
    const cost = Number(costWeights?.[p.ility] ?? 0);
    title.textContent = `${p.ility} — ${p.level || 'unset'} (cost ${cost} pts)`;
    g.append(title);
    svg.append(g);
  }

  // 5. Outer axis labels.
  const labelPoints = axisOuterPoints({ ilities, radius: labelRadius });
  for (const p of labelPoints) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('class', 'axis-label');
    text.setAttribute('x', String(p.x));
    text.setAttribute('y', String(p.y));
    text.setAttribute('text-anchor', anchorFor(p));
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = abbreviate(p.ility);
    svg.append(text);
  }

  return svg;
}

// ── helpers ────────────────────────────────────────────────────────

function round(n) { return Math.round(n * 100) / 100; }

function anchorFor({ x }) {
  if (Math.abs(x) < 1e-3) return 'middle';
  return x > 0 ? 'start' : 'end';
}

function abbreviate(ility) {
  // The default ility names get long; keep the radar legible.
  const aliases = {
    accessibility: 'a11y',
    internationalization: 'i18n',
    maintainability: 'maint',
    observability: 'obs',
    compatibility: 'compat',
    portability: 'porta',
    performance: 'perf',
    reliability: 'rely',
    scalability: 'scale',
    security: 'sec',
    privacy: 'priv',
  };
  return aliases[ility] || ility;
}

function radarAriaLabel({ ilities, vector }) {
  const crits = ilities.filter(k => vector?.[k] === 'critical');
  if (crits.length === 0) return 'NFR radar — no critical ilities chosen';
  return `NFR radar — ${crits.length} critical: ${crits.join(', ')}`;
}
