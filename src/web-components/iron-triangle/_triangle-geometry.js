/**
 * Pure geometry helpers for <iron-triangle>'s deformable SVG viz.
 *
 * Equilateral baseline triangle with TIME at top, COST at bottom-left,
 * SCOPE at bottom-right. Each vertex is pushed outward from the centroid
 * along its centroid-to-vertex ray by a stretch factor in
 * [MIN_STRETCH, MAX_STRETCH] derived from that constraint's relative
 * magnitude. Centroid stays at the origin so the capacity number's
 * anchor point is stable.
 */

const MIN_STRETCH = 0.55;
const MAX_STRETCH = 1.45;

/** Reduce each constraint's snapshot to one comparable scalar. */
export function relativeMagnitudes({ time = {}, cost = {}, scope = {} } = {}) {
  return {
    t: numeric(time.sprintCount, 1) * numeric(time.sprintWeeks, 1),
    c: numeric(cost.teamFTE, 0) * numeric(cost.hoursPerWeek, 40),
    s: numeric(scope.mustHaveCount, 0) + 0.5 * numeric(scope.shouldHaveCount, 0),
  };
}

/** Map magnitudes to per-vertex stretch factors clamped to [0.55, 1.45]. */
export function stretchFactors(mag) {
  const positives = [mag.t, mag.c, mag.s].filter(v => v > 0);
  if (positives.length === 0) return { time: 1, cost: 1, scope: 1 };
  const max = Math.max(...positives);
  const norm = v => v <= 0
    ? MIN_STRETCH
    : MIN_STRETCH + (MAX_STRETCH - MIN_STRETCH) * (v / max);
  return { time: norm(mag.t), cost: norm(mag.c), scope: norm(mag.s) };
}

/**
 * Returns three SVG-coordinate vertices for the triangle. Each vertex
 * lies on the equilateral baseline ray scaled by its stretch factor.
 */
export function triangleVertices(value, radius = 80) {
  const baseAngles = {
    time:  -Math.PI / 2,    // top
    cost:  5 * Math.PI / 6, // bottom-left
    scope: Math.PI / 6,     // bottom-right (CSS-y down)
  };
  const fs = stretchFactors(relativeMagnitudes(value));
  const at = key => ({
    x: Math.cos(baseAngles[key]) * radius * fs[key],
    y: Math.sin(baseAngles[key]) * radius * fs[key],
    factor: fs[key],
  });
  return { time: at('time'), cost: at('cost'), scope: at('scope') };
}

/** Build a complete inline <svg> from a vertices snapshot. DOM-required. */
export function buildTriangleSvg({ vertices, capacityPoints, capacitySource } = {}) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '-110 -110 220 220');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    `Project shape — ${capacityPoints || 0} capacity points`);

  if (vertices) {
    const tri = document.createElementNS(SVG_NS, 'polygon');
    tri.setAttribute('class', 'triangle');
    tri.setAttribute('points', [
      `${round(vertices.time.x)},${round(vertices.time.y)}`,
      `${round(vertices.cost.x)},${round(vertices.cost.y)}`,
      `${round(vertices.scope.x)},${round(vertices.scope.y)}`,
    ].join(' '));
    svg.append(tri);

    appendLabel(svg, 'TIME',  vertices.time.x,        vertices.time.y - 8,  'middle');
    appendLabel(svg, 'COST',  vertices.cost.x - 4,    vertices.cost.y + 14, 'end');
    appendLabel(svg, 'SCOPE', vertices.scope.x + 4,   vertices.scope.y + 14, 'start');
  }

  const cap = document.createElementNS(SVG_NS, 'text');
  cap.setAttribute('class', 'capacity');
  cap.setAttribute('x', '0');
  cap.setAttribute('y', '4');
  cap.setAttribute('text-anchor', 'middle');
  cap.setAttribute('dominant-baseline', 'middle');
  cap.textContent = capacityPoints > 0 ? String(capacityPoints) : '—';
  svg.append(cap);

  const unit = document.createElementNS(SVG_NS, 'text');
  unit.setAttribute('class', 'capacity-unit');
  unit.setAttribute('x', '0');
  unit.setAttribute('y', '28');
  unit.setAttribute('text-anchor', 'middle');
  unit.textContent = capacitySource === 'manual' ? 'points (manual)' : 'points';
  svg.append(unit);

  return svg;
}

// ── helpers ────────────────────────────────────────────────────────

function numeric(value, fallback) {
  if (value === '' || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function round(n) { return Math.round(n * 100) / 100; }

function appendLabel(svg, text, x, y, anchor) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const t = document.createElementNS(SVG_NS, 'text');
  t.setAttribute('class', 'vertex-label');
  t.setAttribute('x', String(round(x)));
  t.setAttribute('y', String(round(y)));
  t.setAttribute('text-anchor', anchor);
  t.textContent = text;
  svg.append(t);
}
