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
 *   1. spokes (orientation grid)
 *   2. envelope polygon (capacity ring)
 *   3. vector polygon (chosen levels)
 *   4. axis hit groups: invisible hit-rect + label + dot marker + <title>
 *   5. center capacity readout
 */
export function buildTargetSvg({
  ilities,
  vector,
  rationales,
  costWeights,
  capacityPoints,
  radius = 100,
  showEnvelope = true,
} = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const labelRadius = radius + 18;
  const pad = labelRadius + 26;
  svg.setAttribute('viewBox', `${-pad} ${-pad} ${pad * 2} ${pad * 2}`);
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label',
    `Quality target. ${criticalKeys(vector || {}).length} critical of ${ilities.length} ilities. Click any axis to edit.`);

  // 1. Spokes.
  const outer = axisOuterPoints({ ilities, radius });
  for (const p of outer) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 'spoke');
    line.setAttribute('x1', '0'); line.setAttribute('y1', '0');
    line.setAttribute('x2', String(p.x)); line.setAttribute('y2', String(p.y));
    svg.append(line);
  }

  // 2. Envelope.
  if (showEnvelope) {
    const env = envelopePoints({ ilities, costWeights, capacityPoints, radius });
    if (env) {
      const env_poly = document.createElementNS(SVG_NS, 'polygon');
      env_poly.setAttribute('class', 'envelope');
      env_poly.setAttribute('points', env.map(p => `${p.x},${p.y}`).join(' '));
      svg.append(env_poly);
    }
  }

  // 3. Vector polygon — only when at least 3 non-origin points exist.
  // Build from only the picked axes so unset ilities don't drag the
  // shape through the centroid.
  const vec = vectorPoints({ ilities, vector, radius });
  const nonZero = vec.filter(p => Math.hypot(p.x, p.y) > 0.5);
  if (nonZero.length >= 3) {
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('class', 'vector');
    poly.setAttribute('points', nonZero.map(p => `${p.x},${p.y}`).join(' '));
    svg.append(poly);
  } else if (nonZero.length > 0) {
    // 1–2 picks: draw a small line/dot accent without the closed polygon.
    for (const p of nonZero) {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'vector-spoke');
      line.setAttribute('x1', '0'); line.setAttribute('y1', '0');
      line.setAttribute('x2', String(p.x)); line.setAttribute('y2', String(p.y));
      svg.append(line);
    }
  }

  // 4. Axis hit groups.
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
    if (level) g.setAttribute('data-level', level);
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label',
      `${formatAxisTooltip({ ility, level, costWeight: cost })}. Activate to edit.`);

    // Invisible hit area centered on the label.
    const hit = document.createElementNS(SVG_NS, 'rect');
    hit.setAttribute('class', 'hit');
    const anchor = anchorFor(label);
    const hitW = 64;
    const hitH = 26;
    const hitX = label.x + (anchor === 'end' ? -hitW : anchor === 'start' ? 0 : -hitW / 2);
    const hitY = label.y - hitH / 2;
    hit.setAttribute('x', String(round(hitX)));
    hit.setAttribute('y', String(round(hitY)));
    hit.setAttribute('width', String(hitW));
    hit.setAttribute('height', String(hitH));
    hit.setAttribute('rx', '6');
    g.append(hit);

    // Marker dot at the level point.
    const marker = document.createElementNS(SVG_NS, 'circle');
    marker.setAttribute('class', 'marker');
    marker.setAttribute('cx', String(dot.x));
    marker.setAttribute('cy', String(dot.y));
    marker.setAttribute('r', '4');
    g.append(marker);

    // Label outside the polygon.
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('class', 'axis-label');
    text.setAttribute('x', String(label.x));
    text.setAttribute('y', String(label.y));
    text.setAttribute('text-anchor', anchor);
    text.setAttribute('dominant-baseline', 'middle');
    text.textContent = ilityAbbr(ility);
    g.append(text);

    // Tooltip.
    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = formatAxisTooltip({ ility, level, costWeight: cost });
    g.append(title);

    svg.append(g);
  }

  // 5. Center capacity readout.
  const center = document.createElementNS(SVG_NS, 'g');
  center.setAttribute('class', 'center');
  const sum = criticalSum(vector, costWeights);
  const overBudget = Number.isFinite(capacityPoints) && sum > capacityPoints;
  if (overBudget) center.setAttribute('data-over', '');

  const sumText = document.createElementNS(SVG_NS, 'text');
  sumText.setAttribute('class', 'capacity-sum');
  sumText.setAttribute('x', '0');
  sumText.setAttribute('y', '-2');
  sumText.setAttribute('text-anchor', 'middle');
  sumText.setAttribute('dominant-baseline', 'middle');
  sumText.textContent = `${sum}${Number.isFinite(capacityPoints) ? ` / ${capacityPoints}` : ''}`;
  center.append(sumText);

  const label = document.createElementNS(SVG_NS, 'text');
  label.setAttribute('class', 'capacity-label');
  label.setAttribute('x', '0');
  label.setAttribute('y', '14');
  label.setAttribute('text-anchor', 'middle');
  label.textContent = 'pts spent';
  center.append(label);

  svg.append(center);

  return svg;
}

// ── helpers ────────────────────────────────────────────────────────

function round(n) { return Math.round(n * 100) / 100; }

function anchorFor(p) {
  if (Math.abs(p.x) < 4) return 'middle';
  return p.x > 0 ? 'start' : 'end';
}
