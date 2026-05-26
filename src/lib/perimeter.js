/**
 * perimeter — uniform rounded-rect geometry primitive (Decorated Layers).
 * Pure core (DOM-free) + thin DOM wrappers. Canonical source in vanilla-breeze;
 * bg-wc / border-wc embed a copy. MVP: axis-aligned rect, uniform border-radius.
 * Perimeter is walked clockwise from t=0 at the top edge (just past the top-left
 * corner).
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Resolve the inset box: origin (ox,oy), inner size (w,h), clamped radius r.
function box({ width, height, radius = 0, inset = 0 }) {
  const w = Math.max(0, width - 2 * inset);
  const h = Math.max(0, height - 2 * inset);
  const r = clamp(radius - inset, 0, Math.min(w, h) / 2);
  return { ox: inset, oy: inset, w, h, r };
}

export function roundedRectPerimeter(dims) {
  const { w, h, r } = box(dims);
  if (w <= 0 || h <= 0) return 0;
  return 2 * w + 2 * h - 8 * r + 2 * Math.PI * r;
}
