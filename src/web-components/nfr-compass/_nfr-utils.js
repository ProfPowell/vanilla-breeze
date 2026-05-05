/**
 * Pure helpers for <nfr-compass>.
 *
 * No DOM access. Everything that's policy (default ilities, default
 * cost weights, level enum, sum/validation logic) lives here so the
 * component stays slim and the math is unit-testable in isolation.
 */

/** Default 11 ilities. `cost` is intentionally absent — that's <iron-triangle>'s job. */
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

/** Default cost weights for picking an ility as Critical. Sum at all-Critical = 40. */
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

/**
 * Title-case an ility name. Falls back to a humanized version of the
 * raw key (so custom slotted ilities still get a reasonable legend).
 */
export function ilityLabel(ility) {
  if (ILITY_LABELS[ility]) return ILITY_LABELS[ility];
  return String(ility)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Merge default cost weights with overrides. Returns a new frozen
 * object containing weights for every key in `ilities` (filling in
 * defaults for any key not in `overrides`; falling back to 1 for
 * custom ilities the defaults don't know about).
 */
export function mergeCostWeights(ilities, overrides = {}) {
  const out = {};
  for (const ility of ilities) {
    if (Object.prototype.hasOwnProperty.call(overrides, ility) &&
        Number.isFinite(Number(overrides[ility]))) {
      out[ility] = Math.max(0, Math.floor(Number(overrides[ility])));
    } else if (Object.prototype.hasOwnProperty.call(DEFAULT_COST_WEIGHTS, ility)) {
      out[ility] = DEFAULT_COST_WEIGHTS[ility];
    } else {
      // Unknown custom ility — neutral default of 1 point.
      out[ility] = 1;
    }
  }
  return Object.freeze(out);
}

/** Sum the cost weights of every ility currently set to 'critical'. */
export function criticalSum(vector, costWeights) {
  let sum = 0;
  for (const [ility, level] of Object.entries(vector || {})) {
    if (level === 'critical') sum += Number(costWeights?.[ility] ?? 0);
  }
  return sum;
}

/** Keys in `vector` whose value is 'critical'. */
export function criticalKeys(vector) {
  return Object.keys(vector || {}).filter(k => vector[k] === 'critical');
}

/**
 * Validate a vector before saving. Returns { valid, errors } where
 * each error is a human-readable string.
 *
 * Rules enforced (mirrors the schema validator in uucd-core):
 * - Every Critical needs a rationale of at least minRationale chars.
 * - If criticalSum > capacityPoints, overrunRationale must be at
 *   least minOverrunRationale chars.
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
 * Parse a JSON object attribute (e.g. data-cost-weights) safely.
 * Returns {} on parse failure.
 */
export function parseJsonAttr(raw) {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch {
    return {};
  }
}
