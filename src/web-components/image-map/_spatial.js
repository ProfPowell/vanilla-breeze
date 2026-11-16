/**
 * Spatial arrow-key navigation for image-map hotspots. Pure: no DOM.
 */

// Off-axis distance counts double, so a direct neighbour beats a diagonal one.
const OFF_AXIS_WEIGHT = 2;

/**
 * Index of the nearest box in a direction, measured centre to centre.
 * Only boxes whose centre lies in the pressed direction's half-plane are
 * candidates. Ties go to the earlier box.
 *
 * @param {Array<{ x: number, y: number, width: number, height: number } | null | undefined>} boxes
 *   Bounding boxes in one coordinate space (y grows downward). Empty slots are skipped.
 * @param {number} current Index of the box to move from.
 * @param {'left' | 'right' | 'up' | 'down'} direction
 * @returns {number} Index of the target box, or -1 when there is none in that direction.
 */
export function nearestInDirection(boxes, current, direction) {
  const from = boxes[current];
  if (!from) return -1;
  const fx = from.x + from.width / 2;
  const fy = from.y + from.height / 2;
  const horizontal = direction === 'left' || direction === 'right';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;

  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    if (i === current || !box) continue;
    const dx = box.x + box.width / 2 - fx;
    const dy = box.y + box.height / 2 - fy;
    const along = (horizontal ? dx : dy) * sign;
    if (!(along > 0)) continue;
    const across = (horizontal ? dy : dx) * OFF_AXIS_WEIGHT;
    const score = Math.hypot(along, across);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}
