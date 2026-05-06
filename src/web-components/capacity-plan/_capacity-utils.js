/**
 * Pure helpers for <capacity-plan>.
 *
 * Sums: capacity (from iron-triangle) − quality spend (from
 * quality-target's criticalSum) − feature spend (from slotted
 * work-items by data-capacity-cost) = slack.
 */

/** Read a numeric data-capacity-cost from one element; default 0. */
export function workItemCost(el) {
  if (!el) return 0;
  const raw = el.dataset?.capacityCost ?? el.getAttribute?.('data-capacity-cost');
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Sum capacity-cost across an iterable of elements (work-items, etc.). */
export function sumWorkCosts(elements) {
  let total = 0;
  for (const el of elements || []) total += workItemCost(el);
  return total;
}

/** Compute the ledger numbers given the three inputs. */
export function computeLedger({ capacityPoints, qualitySum, featureSum }) {
  const cap = Number.isFinite(capacityPoints) ? capacityPoints : Infinity;
  const q = Math.max(0, Number(qualitySum) || 0);
  const f = Math.max(0, Number(featureSum) || 0);
  const slack = Number.isFinite(cap) ? cap - q - f : Infinity;
  return { capacity: cap, quality: q, features: f, slack };
}

/**
 * Compute proportional bar widths (as percentages 0..100) for the
 * stacked bar visualization. When over budget, the chunks normalize
 * against the actual spend so the bars overflow visibly.
 */
export function barProportions({ capacity, quality, features }) {
  if (!Number.isFinite(capacity) || capacity <= 0) {
    // Unbounded budget: scale against spend so chunks have any width at all
    const total = quality + features;
    if (total <= 0) return { quality: 0, features: 0, slack: 100 };
    return {
      quality:  (quality / total) * 100,
      features: (features / total) * 100,
      slack:    0,
    };
  }
  const spend = quality + features;
  const denom = Math.max(capacity, spend);
  return {
    quality:  (quality  / denom) * 100,
    features: (features / denom) * 100,
    slack:    Math.max(0, (capacity - spend) / denom * 100),
  };
}
