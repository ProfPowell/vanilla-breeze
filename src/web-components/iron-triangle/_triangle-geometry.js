/**
 * Pure geometry + SVG builder for the click-to-edit `<iron-triangle>`.
 *
 * Triangle layout matches the design sketch:
 *   - SCOPE at the top (angle -π/2)
 *   - TIME at the bottom-left (5π/6)
 *   - COST at the bottom-right (π/6)
 *
 * Each vertex is pushed outward from the centroid by a per-constraint
 * stretch factor in [MIN_STRETCH, MAX_STRETCH]. The capacity number
 * sits at the centroid. The whole SVG is the UI: each vertex group
 * is a clickable hit target that opens a per-axis dialog; the center
 * "Quality" group fires `iron-triangle:open-quality` (and optionally
 * navigates to data-quality-href).
 */

const MIN_STRETCH = 0.55;
const MAX_STRETCH = 1.45;

/**
 * Reduce each constraint's snapshot to one comparable scalar.
 * @param {{ time?: any, cost?: any, scope?: any }} [value]
 */
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
 * Returns three SVG-coordinate vertices.
 *   scope at top, time bottom-left, cost bottom-right.
 */
export function triangleVertices(value, radius = 80) {
  const baseAngles = {
    scope: -Math.PI / 2,    // top
    time:  5 * Math.PI / 6, // bottom-left
    cost:  Math.PI / 6,     // bottom-right (SVG-y down)
  };
  const fs = stretchFactors(relativeMagnitudes(value));
  const at = key => ({
    x: Math.cos(baseAngles[key]) * radius * fs[key],
    y: Math.sin(baseAngles[key]) * radius * fs[key],
    factor: fs[key],
  });
  return { scope: at('scope'), time: at('time'), cost: at('cost') };
}

// ── Per-vertex summary formatters ─────────────────────────────────

export function formatTimeSummary(time = {}) {
  const sprintCount = numeric(time.sprintCount, 0);
  const sprintWeeks = numeric(time.sprintWeeks, 0);
  if (sprintCount > 0 && sprintWeeks > 0) {
    const total = sprintCount * sprintWeeks;
    return sprintCount > 1
      ? `${total} weeks (${sprintCount} × ${sprintWeeks}wk)`
      : `${total} week${total === 1 ? '' : 's'}`;
  }
  if (sprintWeeks > 0) return `${sprintWeeks} week${sprintWeeks === 1 ? '' : 's'}`;
  if (time.deadline) return `until ${time.deadline}`;
  return 'TBD';
}

export function formatCostSummary(cost = {}) {
  const fte = Number(cost.teamFTE);
  const tier = cost.budgetTier;
  const parts = [];
  if (Number.isFinite(fte) && fte > 0) parts.push(`${fte} FTE`);
  if (tier && tier !== 'unset') parts.push(tier);
  return parts.length > 0 ? parts.join(' · ') : 'TBD';
}

export function formatScopeSummary(scope = {}) {
  const must = numeric(scope.mustHaveCount, 0);
  const should = numeric(scope.shouldHaveCount, 0);
  if (must > 0 && should > 0) return `${must} must · ${should} should`;
  if (must > 0) return `${must} must-have`;
  if (should > 0) return `${should} should-have`;
  return 'TBD';
}

export function formatQualitySummary(qualitySummary) {
  if (typeof qualitySummary === 'string' && qualitySummary.trim().length > 0) {
    return qualitySummary;
  }
  return 'TBD — click to set';
}

// ── SVG builder ───────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

const VERTEX_LABEL_OFFSETS = {
  scope: { dx: 0,    dy: -22, anchor: 'middle' },
  time:  { dx: -10,  dy: 14,  anchor: 'end' },
  cost:  { dx: 10,   dy: 14,  anchor: 'start' },
};

const VERTEX_SUMMARY_OFFSETS = {
  scope: { dx: 0,   dy: -8,  anchor: 'middle' },
  time:  { dx: -10, dy: 28,  anchor: 'end' },
  cost:  { dx: 10,  dy: 28,  anchor: 'start' },
};

const VERTEX_LABELS = {
  scope: { name: 'Scope', unit: '# features / story points' },
  time:  { name: 'Time',  unit: 'hours / days / weeks' },
  cost:  { name: 'Cost',  unit: 'FTE / $' },
};

/**
 * Build the entire interactive triangle SVG. Each vertex group is
 * `<g class="vertex" data-axis="…" tabindex="0">` so click + keyboard
 * activation work; the center group is `<g class="center"
 * data-target="quality" tabindex="0">`.
 *
 * The component (logic.js) attaches click/keydown listeners to these
 * groups by `data-axis` / `data-target`.
 */
/**
 * @param {{ value?: any, vertices?: any, capacityPoints?: number, capacitySource?: string, qualitySummary?: string }} [options]
 */
export function buildTriangleSvg({
  value = {},
  vertices,
  capacityPoints = 0,
  capacitySource = 'formula',
  qualitySummary = '',
} = {}) {
  const v = vertices || triangleVertices(value);
  const svg = document.createElementNS(SVG_NS, 'svg');
  // viewBox padded generously so even the longest summary
  // ("6 weeks (3 × 2wk)") rendered at TIME's bottom-left vertex
  // (max stretched to x ≈ -116) plus its ~80px text width never
  // clips the left edge.
  svg.setAttribute('viewBox', '-220 -170 440 340');
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label',
    `Project shape: ${capacityPoints || 0} capacity points. Click each corner to edit, or the center to open the quality compass.`);

  // 1. The triangle polygon — decorative; hit-targets are the vertex groups.
  const tri = document.createElementNS(SVG_NS, 'polygon');
  tri.setAttribute('class', 'triangle');
  tri.setAttribute('points', [
    `${round(v.scope.x)},${round(v.scope.y)}`,
    `${round(v.time.x)},${round(v.time.y)}`,
    `${round(v.cost.x)},${round(v.cost.y)}`,
  ].join(' '));
  svg.append(tri);

  // 2. Center "Quality" hit target. Order top→bottom:
  //    "Quality" header (small) → big capacity number → "pts" subtitle.
  //    A backdrop circle keeps the polygon stroke out of the text area.
  const center = document.createElementNS(SVG_NS, 'g');
  center.setAttribute('class', 'center');
  center.setAttribute('data-target', 'quality');
  center.setAttribute('tabindex', '0');
  center.setAttribute('role', 'button');
  center.setAttribute(
    'aria-label',
    `Quality — ${formatQualitySummary(qualitySummary)}. Activate to open the NFR compass.`,
  );

  // Backdrop circle — sits behind the text, masks the polygon stroke.
  const backdrop = document.createElementNS(SVG_NS, 'circle');
  backdrop.setAttribute('class', 'capacity-backdrop');
  backdrop.setAttribute('cx', '0');
  backdrop.setAttribute('cy', '4');
  backdrop.setAttribute('r', '32');
  center.append(backdrop);

  // Hit-rect overlays the backdrop so the entire center is clickable.
  const centerHit = document.createElementNS(SVG_NS, 'rect');
  centerHit.setAttribute('class', 'hit');
  centerHit.setAttribute('x', '-36');
  centerHit.setAttribute('y', '-30');
  centerHit.setAttribute('width', '72');
  centerHit.setAttribute('height', '68');
  centerHit.setAttribute('rx', '34');
  center.append(centerHit);

  // "Quality" header (small, top of stack).
  const quality = document.createElementNS(SVG_NS, 'text');
  quality.setAttribute('class', 'quality-label');
  quality.setAttribute('x', '0');
  quality.setAttribute('y', '-15');
  quality.setAttribute('text-anchor', 'middle');
  quality.textContent = 'Quality';
  center.append(quality);

  // Capacity number (hero).
  const cap = document.createElementNS(SVG_NS, 'text');
  cap.setAttribute('class', 'capacity');
  cap.setAttribute('x', '0');
  cap.setAttribute('y', '7');
  cap.setAttribute('text-anchor', 'middle');
  cap.setAttribute('dominant-baseline', 'middle');
  cap.textContent = capacityPoints > 0 ? String(capacityPoints) : '—';
  center.append(cap);

  // "pts" subtitle.
  const unit = document.createElementNS(SVG_NS, 'text');
  unit.setAttribute('class', 'capacity-unit');
  unit.setAttribute('x', '0');
  unit.setAttribute('y', '26');
  unit.setAttribute('text-anchor', 'middle');
  unit.textContent = capacitySource === 'manual' ? 'pts (manual)' : 'pts';
  center.append(unit);

  // Native <title> tooltip — the quality summary.
  const centerTitle = document.createElementNS(SVG_NS, 'title');
  centerTitle.textContent = formatQualitySummary(qualitySummary);
  center.append(centerTitle);
  svg.append(center);

  // 3. Three vertex hit targets.
  for (const axis of ['scope', 'time', 'cost']) {
    svg.append(buildVertex(axis, v[axis], value));
  }

  return svg;
}

function buildVertex(axis, vertex, value) {
  const labelMeta = VERTEX_LABEL_OFFSETS[axis];
  const summaryMeta = VERTEX_SUMMARY_OFFSETS[axis];
  const labels = VERTEX_LABELS[axis];

  const summary = axis === 'scope'
    ? formatScopeSummary(value.scope)
    : axis === 'cost'
      ? formatCostSummary(value.cost)
      : formatTimeSummary(value.time);

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('class', 'vertex');
  g.setAttribute('data-axis', axis);
  g.setAttribute('tabindex', '0');
  g.setAttribute('role', 'button');
  g.setAttribute('aria-label', `${labels.name} — ${summary}. Activate to edit.`);

  // Invisible hit area: a roomy rect that fully contains the
  // {label, summary} text cluster. The longest summary
  // ("6 weeks (3 × 2wk)") needs ≈ 130px at 0.7rem.
  const hit = document.createElementNS(SVG_NS, 'rect');
  hit.setAttribute('class', 'hit');
  const hitW = 160;
  const hitH = 50;
  // Position the hit rect by aligning its inner edge with the vertex
  // and accounting for each label's anchor offset.
  let hitX;
  if (labelMeta.anchor === 'end') {
    // Right edge of hit aligns with vertex (text grows leftward).
    hitX = vertex.x - hitW + 6;
  } else if (labelMeta.anchor === 'start') {
    // Left edge of hit aligns with vertex (text grows rightward).
    hitX = vertex.x - 6;
  } else {
    // Centered on vertex for the SCOPE corner.
    hitX = vertex.x - hitW / 2;
  }
  // Vertical position depends on whether the labels render above
  // (scope, top corner) or below (time/cost, bottom corners) the vertex.
  const hitY = axis === 'scope'
    ? vertex.y - hitH + 6
    : vertex.y - 6;
  hit.setAttribute('x', String(round(hitX)));
  hit.setAttribute('y', String(round(hitY)));
  hit.setAttribute('width', String(hitW));
  hit.setAttribute('height', String(hitH));
  hit.setAttribute('rx', '6');
  g.append(hit);

  // Vertex name (Scope / Time / Cost).
  const name = document.createElementNS(SVG_NS, 'text');
  name.setAttribute('class', 'vertex-name');
  name.setAttribute('x', String(round(vertex.x + labelMeta.dx)));
  name.setAttribute('y', String(round(vertex.y + labelMeta.dy)));
  name.setAttribute('text-anchor', labelMeta.anchor);
  name.textContent = labels.name;
  g.append(name);

  // Computed summary or "TBD".
  const summaryEl = document.createElementNS(SVG_NS, 'text');
  summaryEl.setAttribute('class', 'vertex-summary');
  summaryEl.setAttribute('x', String(round(vertex.x + summaryMeta.dx)));
  summaryEl.setAttribute('y', String(round(vertex.y + summaryMeta.dy)));
  summaryEl.setAttribute('text-anchor', summaryMeta.anchor);
  summaryEl.textContent = summary;
  g.append(summaryEl);

  // Native <title> tooltip — unit hint.
  const title = document.createElementNS(SVG_NS, 'title');
  title.textContent = `${labels.name}: ${summary} — ${labels.unit}`;
  g.append(title);

  return g;
}

// ── helpers ────────────────────────────────────────────────────────

function numeric(value, fallback) {
  if (value === '' || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function round(n) { return Math.round(n * 100) / 100; }
