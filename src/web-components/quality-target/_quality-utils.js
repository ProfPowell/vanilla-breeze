/**
 * Pure helpers + SVG builder for <quality-target>.
 *
 * Combines the prior _nfr-utils.js (default ilities, default cost
 * weights, validation invariants) with _radar-geometry.js (axis
 * angles, vector/envelope points, SVG builder), with the addition
 * of click-to-edit dialog state helpers.
 *
 * Domain-neutral schema property names are unchanged: vector,
 * rationales, costWeights, capacityPoints, capacitySource,
 * overrunRationale, ironTriangleHash. Only the front-door labels move
 * from "NFR" to "quality".
 */

// ── Defaults ──────────────────────────────────────────────────────

export const DEFAULT_ILITIES = Object.freeze([
  'performance',
  'accessibility',
  'security',
  'reliability',
  'maintainability',
  'observability',
  'compatibility',
  'scalability',
  'portability',
  'internationalization',
  'privacy',
]);

export const LEVELS = Object.freeze(['critical', 'important', 'acceptable', 'not-relevant']);
export const LEVEL_LABELS = Object.freeze({
  'critical':     'Critical',
  'important':    'Important',
  'acceptable':   'Acceptable',
  'not-relevant': 'Not relevant',
});

/** Default cost weights when picking an ility as Critical. Sum = 40. */
export const DEFAULT_COST_WEIGHTS = Object.freeze({
  accessibility: 3,
  performance: 5,
  security: 5,
  reliability: 4,
  observability: 3,
  internationalization: 4,
  compatibility: 2,
  portability: 3,
  privacy: 4,
  scalability: 5,
  maintainability: 2,
});

const ILITY_LABELS = Object.freeze({
  performance: 'Performance',
  accessibility: 'Accessibility',
  security: 'Security',
  reliability: 'Reliability',
  maintainability: 'Maintainability',
  observability: 'Observability',
  compatibility: 'Compatibility',
  scalability: 'Scalability',
  portability: 'Portability',
  internationalization: 'Internationalization',
  privacy: 'Privacy',
});

const ILITY_ABBR = Object.freeze({
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
});

const LEVEL_RATIO = Object.freeze({
  critical:       1,
  important:      0.6,
  acceptable:     0.3,
  'not-relevant': 0,
});

// ── Labels ────────────────────────────────────────────────────────

export function ilityLabel(ility) {
  if (ILITY_LABELS[ility]) return ILITY_LABELS[ility];
  return String(ility)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function ilityAbbr(ility) {
  return ILITY_ABBR[ility] || ility;
}

// ── Cost weights ──────────────────────────────────────────────────

export function mergeCostWeights(ilities, overrides = {}) {
  const out = {};
  for (const ility of ilities) {
    if (Object.prototype.hasOwnProperty.call(overrides, ility) &&
        Number.isFinite(Number(overrides[ility]))) {
      out[ility] = Math.max(0, Math.floor(Number(overrides[ility])));
    } else if (Object.prototype.hasOwnProperty.call(DEFAULT_COST_WEIGHTS, ility)) {
      out[ility] = DEFAULT_COST_WEIGHTS[ility];
    } else {
      out[ility] = 1;
    }
  }
  return Object.freeze(out);
}

export function criticalSum(vector, costWeights) {
  let sum = 0;
  for (const [ility, level] of Object.entries(vector || {})) {
    if (level === 'critical') sum += Number(costWeights?.[ility] ?? 0);
  }
  return sum;
}

export function criticalKeys(vector) {
  return Object.keys(vector || {}).filter(k => vector[k] === 'critical');
}

// ── Validation ────────────────────────────────────────────────────

/**
 * Return { valid, errors, criticalSum } for a candidate vector. Used
 * by the component's checkValidity() and (mirror) by uucd-core's
 * validateQualityVector() so both surfaces apply identical rules.
 */
export function validateVector(input) {
  const {
    vector = {}, rationales = {}, costWeights = {},
    capacityPoints = Infinity, overrunRationale = '',
    minRationale = 10, minOverrunRationale = 10,
  } = input || {};

  const errors = [];
  const crits = criticalKeys(vector);

  for (const k of crits) {
    const r = rationales[k];
    if (typeof r !== 'string' || r.trim().length < minRationale) {
      errors.push(`Critical "${k}" needs a rationale of at least ${minRationale} characters.`);
    }
  }

  const sum = criticalSum(vector, costWeights);
  if (Number.isFinite(capacityPoints) && sum > capacityPoints) {
    if (typeof overrunRationale !== 'string' || overrunRationale.trim().length < minOverrunRationale) {
      errors.push(
        `Over budget by ${sum - capacityPoints} points (${sum}/${capacityPoints}); ` +
        `overrunRationale of at least ${minOverrunRationale} characters required.`
      );
    }
  }

  return { valid: errors.length === 0, errors, criticalSum: sum };
}

/**
 * Per-axis dialog state machine: can the user save THIS axis's edit?
 * Critical needs a rationale; other levels just need to be picked.
 * The over-budget rationale is a vector-level concern handled by
 * validateVector — not gated here.
 */
export function canSaveAxis({ level, rationale, minRationale = 10 }) {
  if (!LEVELS.includes(level)) return { ok: false, reason: 'pick-level' };
  if (level === 'critical') {
    if (typeof rationale !== 'string' || rationale.trim().length < minRationale) {
      return { ok: false, reason: 'rationale-too-short' };
    }
  }
  return { ok: true };
}

/** Tooltip text used both in the SVG <title> and aria-label. */
export function formatAxisTooltip({ ility, level, costWeight }) {
  const name = ilityLabel(ility);
  const lvl = level ? LEVEL_LABELS[level] || level : 'unset';
  const n = Number(costWeight);
  const cost = Number.isFinite(n) ? `${n} pts` : '? pts';
  return `${name} — ${lvl} · ${cost}`;
}

// ── JSON attribute parsing (data-cost-weights) ───────────────────

export function parseJsonAttr(raw) {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch {
    return {};
  }
}

// ── Geometry ──────────────────────────────────────────────────────

/** N axis angles, evenly spaced, starting at the top. */
export function axisAngles(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(-Math.PI / 2 + (2 * Math.PI * i) / n);
  }
  return out;
}

/**
 * Fraction of `radius` the capacity envelope reaches per axis.
 * Returns null when capacity is unbounded.
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

/** Outer axis endpoints — used for the spoke + label positions. */
export function axisOuterPoints({ ilities, radius }) {
  const angles = axisAngles(ilities.length);
  return ilities.map((k, i) => ({
    ility: k,
    x: round(Math.cos(angles[i]) * radius),
    y: round(Math.sin(angles[i]) * radius),
  }));
}

// ── SVG builder ───────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Build the inline polygon-as-UI <svg>. Each axis marker is a clickable
 * <g class="axis" data-ility="…" tabindex="0"> hit target the component
 * wires to a per-axis editor dialog.
 *
 * Layers (back to front):
 *   1. three reference rings (Critical 1.0 / Important 0.6 / Acceptable 0.3
 *      level radii) — the ONLY background; no envelope polygon.
 *   2. spokes from origin to outer ring
 *   3. vector polygon (picked axes only)
 *   4. axis hit groups: invisible hit-rect + dot marker + label + <title>
 *   5. center capacity readout in a small reserved hole
 */
const LEVEL_RING_RATIOS = Object.freeze([
  { ratio: 1.00, label: 'Critical',   className: 'ring-critical' },
  { ratio: 0.60, label: 'Important',  className: 'ring-important' },
  { ratio: 0.30, label: 'Acceptable', className: 'ring-acceptable' },
]);

const CENTER_HOLE_RADIUS_RATIO = 0.22;   // fraction of `radius` reserved for capacity readout

/**
 * @param {{ ilities?: any[], vector?: Record<string, string>, costWeights?: Record<string, number>, capacityPoints?: number, radius?: number }} [opts]
 */
export function buildTargetSvg({
  ilities = /** @type {any[]} */ ([]),
  vector = /** @type {Record<string, string>} */ ({}),
  costWeights = /** @type {Record<string, number>} */ ({}),
  capacityPoints = 0,
  radius = 100,
} = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  // Generous viewBox padding so full ility names ("Internationalization"
  // is the longest at 20 chars) never clip. Labels render at radius + 14;
  // longest label ≈ 130px wide at the 0.625rem default font.
  const labelRadius = radius + 14;
  const padX = labelRadius + 140;
  const padY = labelRadius + 30;
  svg.setAttribute('viewBox', `${-padX} ${-padY} ${padX * 2} ${padY * 2}`);
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label',
    `Quality target. ${criticalKeys(vector || {}).length} critical of ${ilities.length} ilities. Click any axis to edit.`);

  // 1. Three concentric reference rings (level ratios).
  for (const r of LEVEL_RING_RATIOS) {
    const ring = document.createElementNS(SVG_NS, 'polygon');
    ring.setAttribute('class', `ring ${r.className}`);
    const points = axisOuterPoints({ ilities, radius: radius * r.ratio });
    ring.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
    svg.append(ring);
  }

  // 2. Spokes from origin to outer ring.
  const outer = axisOuterPoints({ ilities, radius });
  for (const p of outer) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 'spoke');
    line.setAttribute('x1', '0'); line.setAttribute('y1', '0');
    line.setAttribute('x2', String(p.x)); line.setAttribute('y2', String(p.y));
    svg.append(line);
  }

  // 3. Vector polygon — built from picked axes only so unset ilities
  // don't drag the shape through the centroid.
  const vec = vectorPoints({ ilities, vector, radius });
  const nonZero = vec.filter(p => Math.hypot(p.x, p.y) > 0.5);
  if (nonZero.length >= 3) {
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('class', 'vector');
    poly.setAttribute('points', nonZero.map(p => `${p.x},${p.y}`).join(' '));
    svg.append(poly);
  } else if (nonZero.length > 0) {
    for (const p of nonZero) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'vector-spoke');
      line.setAttribute('x1', '0'); line.setAttribute('y1', '0');
      line.setAttribute('x2', String(p.x)); line.setAttribute('y2', String(p.y));
      svg.append(line);
    }
  }

  // 4. Axis hit groups (markers + full labels).
  const labels = axisOuterPoints({ ilities, radius: labelRadius });
  for (let i = 0; i < ilities.length; i++) {
    const ility = ilities[i];
    const dot = vec[i];
    const label = labels[i];
    const cost = Number(costWeights?.[ility] ?? 0);
    const level = vector?.[ility] ?? null;

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'axis');
    g.setAttribute('data-ility', ility);
    if (level) g.setAttribute('data-level', String(level));
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label',
      `${formatAxisTooltip({ ility, level, costWeight: cost })}. Activate to edit.`);

    // Invisible hit area sized to the label width.
    const hit = document.createElementNS(SVG_NS, 'rect');
    hit.setAttribute('class', 'hit');
    const anchor = anchorFor(label);
    const hitW = 100;
    const hitH = 22;
    const hitX = label.x + (anchor === 'end' ? -hitW : anchor === 'start' ? 0 : -hitW / 2);
    const hitY = label.y - hitH / 2;
    hit.setAttribute('x', String(round(hitX)));
    hit.setAttribute('y', String(round(hitY)));
    hit.setAttribute('width', String(hitW));
    hit.setAttribute('height', String(hitH));
    hit.setAttribute('rx', '4');
    g.append(hit);

    // Marker dot at the level point (only when the axis is set —
    // otherwise it sits at origin and would obscure the capacity readout).
    if (level) {
      const marker = document.createElementNS(SVG_NS, 'circle');
      marker.setAttribute('class', 'marker');
      marker.setAttribute('cx', String(dot.x));
      marker.setAttribute('cy', String(dot.y));
      marker.setAttribute('r', '4');
      g.append(marker);
    }

    // Full ility label.
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('class', 'axis-label');
    text.setAttribute('x', String(label.x));
    text.setAttribute('y', String(label.y));
    text.setAttribute('text-anchor', anchor);
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = ilityLabel(ility);
    g.append(text);

    // Tooltip.
    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = formatAxisTooltip({ ility, level, costWeight: cost });
    g.append(title);

    svg.append(g);
  }

  // 5. Center capacity readout — sits in a reserved hole the polygon
  // visually clears.
  const center = document.createElementNS(SVG_NS, 'g');
  center.setAttribute('class', 'center');
  const sum = criticalSum(vector, costWeights);
  const overBudget = Number.isFinite(capacityPoints) && sum > capacityPoints;
  if (overBudget) center.setAttribute('data-over', '');
  const holeRadius = radius * CENTER_HOLE_RADIUS_RATIO;

  // Backdrop circle so the polygon stroke under the number doesn't bleed in.
  const backdrop = document.createElementNS(SVG_NS, 'circle');
  backdrop.setAttribute('class', 'capacity-backdrop');
  backdrop.setAttribute('cx', '0');
  backdrop.setAttribute('cy', '0');
  backdrop.setAttribute('r', String(round(holeRadius)));
  center.append(backdrop);

  const sumText = document.createElementNS(SVG_NS, 'text');
  sumText.setAttribute('class', 'capacity-sum');
  sumText.setAttribute('x', '0');
  sumText.setAttribute('y', '-3');
  sumText.setAttribute('text-anchor', 'middle');
  sumText.setAttribute('dominant-baseline', 'middle');
  sumText.textContent = String(sum);
  center.append(sumText);

  const denom = document.createElementNS(SVG_NS, 'text');
  denom.setAttribute('class', 'capacity-denom');
  denom.setAttribute('x', '0');
  denom.setAttribute('y', '11');
  denom.setAttribute('text-anchor', 'middle');
  denom.textContent = Number.isFinite(capacityPoints) ? `of ${capacityPoints}` : 'unbounded';
  center.append(denom);

  svg.append(center);

  return svg;
}

// ── helpers ────────────────────────────────────────────────────────

function round(n) { return Math.round(n * 100) / 100; }

function anchorFor(p) {
  if (Math.abs(p.x) < 4) return 'middle';
  return p.x > 0 ? 'start' : 'end';
}
