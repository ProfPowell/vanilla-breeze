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

// Round to 3 decimals for stable, compact path strings.
const n = (v) => (Math.round(v * 1000) / 1000).toString();

export function roundedRectPath(dims) {
  const { ox, oy, w, h, r } = box(dims);
  if (w <= 0 || h <= 0) return '';
  if (r <= 0) {
    return `M${n(ox)} ${n(oy)}H${n(ox + w)}V${n(oy + h)}H${n(ox)}Z`;
  }
  const a = (x, y) => `A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y)}`;
  return (
    `M${n(ox + r)} ${n(oy)}` +
    `H${n(ox + w - r)}` + a(ox + w, oy + r) +
    `V${n(oy + h - r)}` + a(ox + w - r, oy + h) +
    `H${n(ox + r)}` + a(ox, oy + h - r) +
    `V${n(oy + r)}` + a(ox + r, oy) +
    'Z'
  );
}

export function roundedRectSampler(dims) {
  const { ox, oy, w, h, r } = box(dims);
  if (w <= 0 || h <= 0) return () => [ox, oy];
  const edgeH = w - 2 * r;
  const edgeV = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  const deg = (d) => (d * Math.PI) / 180;
  const onArc = (cx, cy, a0deg) => (u) => {
    const th = deg(a0deg + 90 * u);
    return [cx + r * Math.cos(th), cy + r * Math.sin(th)];
  };
  const segs = [
    { len: edgeH, at: (u) => [ox + r + edgeH * u, oy] },
    { len: arc, at: onArc(ox + w - r, oy + r, -90) },
    { len: edgeV, at: (u) => [ox + w, oy + r + edgeV * u] },
    { len: arc, at: onArc(ox + w - r, oy + h - r, 0) },
    { len: edgeH, at: (u) => [ox + w - r - edgeH * u, oy + h] },
    { len: arc, at: onArc(ox + r, oy + h - r, 90) },
    { len: edgeV, at: (u) => [ox, oy + h - r - edgeV * u] },
    { len: arc, at: onArc(ox + r, oy + r, 180) },
  ];
  const total = segs.reduce((acc, s) => acc + s.len, 0) || 1;
  return (t) => {
    let d = (((t % 1) + 1) % 1) * total;
    for (const s of segs) {
      if (s.len <= 0) continue;
      if (d <= s.len) return s.at(d / s.len);
      d -= s.len;
    }
    return segs[0].at(0);
  };
}

function readDims(host) {
  const rect = host.getBoundingClientRect();
  const cs = getComputedStyle(host);
  // Assumes the computed value is in px (getComputedStyle normally resolves radii to px).
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;
  return { width: rect.width, height: rect.height, radius };
}

export function perimeterPath(host, inset = 0) {
  return roundedRectPath({ ...readDims(host), inset });
}

export function perimeterSampler(host, inset = 0) {
  return roundedRectSampler({ ...readDims(host), inset });
}
