/**
 * perimeter — shape geometry primitive (Decorated Layers).
 * Pure core (DOM-free) + thin DOM wrappers. Canonical source in vanilla-breeze;
 * bg-wc / border-wc embed a copy.
 *
 * A traced shape is { start:[x,y], segments:[Segment] }, where
 *   Segment = { kind:'line'|'arc'|'curve', len:number, at:(u)=>[x,y], d:string }
 *   - len: arc length of the segment
 *   - at(u): point at fraction u∈[0,1] along the segment (arc-length within it)
 *   - d: SVG path commands continuing from the previous point (no leading M)
 * Lines and circular arcs are analytic (exact); elliptical arcs and beziers are
 * flattened to fixed-N polylines for length/sampling while keeping exact curve
 * commands in `d`.
 *
 * t-contract for the sampler:
 *   - rounded rects (incl. asymmetric/elliptical): t=0 at the top edge just
 *     clockwise of the top-left corner; clockwise.
 *   - circle/ellipse: t=0 at the top (12 o'clock); clockwise.
 *   - polygon/path/shape: t=0 at the declared start; declaration order.
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const n = (v) => (Math.round(v * 1000) / 1000).toString();
const deg = (d) => (d * Math.PI) / 180;

// ---------- generic operations over { start, segments } ----------

export function tracePath({ start, segments }) {
  if (!segments.length) return '';
  let out = `M${n(start[0])} ${n(start[1])}`;
  segments.forEach((s, i) => {
    if (s.len <= 0 && s.kind !== 'line') return; // skip degenerate (e.g. zero-radius arc)
    // Z draws a straight line back to start, so a trailing straight segment is redundant.
    if (i === segments.length - 1 && s.kind === 'line') return;
    out += s.d;
  });
  return out + 'Z';
}

export function traceLength({ segments }) {
  return segments.reduce((acc, s) => acc + s.len, 0);
}

export function traceSampler({ start, segments }) {
  const total = segments.reduce((acc, s) => acc + s.len, 0);
  if (total <= 0) return () => start.slice();
  return (t) => {
    let d = (((t % 1) + 1) % 1) * total;
    for (const s of segments) {
      if (s.len <= 0) continue;
      if (d <= s.len) return s.at(d / s.len);
      d -= s.len;
    }
    for (let i = segments.length - 1; i >= 0; i--) if (segments[i].len > 0) return segments[i].at(1);
    return start.slice();
  };
}

// ---------- segment constructors ----------

function lineSeg(p0, p1) {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const len = Math.hypot(x1 - x0, y1 - y0);
  let d;
  if (y0 === y1) d = `H${n(x1)}`;
  else if (x0 === x1) d = `V${n(y1)}`;
  else d = `L${n(x1)} ${n(y1)}`;
  return { kind: 'line', len, at: (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u], d };
}

// Walk a polyline [[x,y],…] by arc length → { len, at }.
function flattenedWalker(poly) {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  }
  const len = cum[cum.length - 1];
  const at = (u) => {
    if (len <= 0) return poly[0].slice();
    const target = clamp(u, 0, 1) * len;
    let i = 1;
    while (i < cum.length && cum[i] < target) i++;
    if (i >= cum.length) return poly[poly.length - 1].slice();
    const seg = cum[i] - cum[i - 1] || 1;
    const f = (target - cum[i - 1]) / seg;
    return [
      poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * f,
      poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * f,
    ];
  };
  return { len, at };
}

// A 90° corner arc sweeping clockwise from a0deg to a0deg+90, center (cx,cy),
// radii (rx,ry), explicit endpoint `end` (for the `d` string).
function cornerArcSeg({ cx, cy, rx, ry, a0deg, end }) {
  const pt = (adeg) => [cx + rx * Math.cos(deg(adeg)), cy + ry * Math.sin(deg(adeg))];
  const d = `A${n(rx)} ${n(ry)} 0 0 1 ${n(end[0])} ${n(end[1])}`;
  if (rx === ry) {
    const r = rx;
    return { kind: 'arc', len: (Math.PI / 2) * r, at: (u) => pt(a0deg + 90 * u), d };
  }
  const N = 24;
  const poly = [];
  for (let i = 0; i <= N; i++) poly.push(pt(a0deg + 90 * (i / N)));
  return { kind: 'arc', ...flattenedWalker(poly), d };
}

// ---------- rounded rect (uniform for now; per-corner in Task 2) ----------

// corners = [[rxTL,ryTL],[rxTR,ryTR],[rxBR,ryBR],[rxBL,ryBL]] (raw, pre-inset).
export function roundedRectShape({ width, height, corners, inset = 0 }) {
  const ox = inset;
  const oy = inset;
  const w = Math.max(0, width - 2 * inset);
  const h = Math.max(0, height - 2 * inset);
  if (w <= 0 || h <= 0) return { start: [ox, oy], segments: [] };

  // Reduce each radius by the inset, clamp ≥ 0.
  let c = corners.map(([rx, ry]) => [Math.max(0, rx - inset), Math.max(0, ry - inset)]);
  // CSS corner-overlap clamp: scale all radii by the tightest side ratio.
  const ratio = (avail, sum) => (sum > 0 ? avail / sum : Infinity);
  const f = Math.min(
    1,
    ratio(w, c[0][0] + c[1][0]), // top:    rxTL + rxTR
    ratio(w, c[3][0] + c[2][0]), // bottom: rxBL + rxBR
    ratio(h, c[0][1] + c[3][1]), // left:   ryTL + ryBL
    ratio(h, c[1][1] + c[2][1]) // right:  ryTR + ryBR
  );
  if (f < 1) c = c.map(([rx, ry]) => [rx * f, ry * f]);

  const [[rxTL, ryTL], [rxTR, ryTR], [rxBR, ryBR], [rxBL, ryBL]] = c;
  const start = [ox + rxTL, oy];
  const segments = [];
  // top edge → TR corner
  segments.push(lineSeg([ox + rxTL, oy], [ox + w - rxTR, oy]));
  if (rxTR > 0 && ryTR > 0)
    segments.push(
      cornerArcSeg({ cx: ox + w - rxTR, cy: oy + ryTR, rx: rxTR, ry: ryTR, a0deg: -90, end: [ox + w, oy + ryTR] })
    );
  // right edge → BR corner
  segments.push(lineSeg([ox + w, oy + ryTR], [ox + w, oy + h - ryBR]));
  if (rxBR > 0 && ryBR > 0)
    segments.push(
      cornerArcSeg({ cx: ox + w - rxBR, cy: oy + h - ryBR, rx: rxBR, ry: ryBR, a0deg: 0, end: [ox + w - rxBR, oy + h] })
    );
  // bottom edge → BL corner
  segments.push(lineSeg([ox + w - rxBR, oy + h], [ox + rxBL, oy + h]));
  if (rxBL > 0 && ryBL > 0)
    segments.push(
      cornerArcSeg({ cx: ox + rxBL, cy: oy + h - ryBL, rx: rxBL, ry: ryBL, a0deg: 90, end: [ox, oy + h - ryBL] })
    );
  // left edge → TL corner
  segments.push(lineSeg([ox, oy + h - ryBL], [ox, oy + ryTL]));
  if (rxTL > 0 && ryTL > 0)
    segments.push(
      cornerArcSeg({ cx: ox + rxTL, cy: oy + ryTL, rx: rxTL, ry: ryTL, a0deg: 180, end: [ox + rxTL, oy] })
    );
  return { start, segments };
}

function uniformCorners({ width, height, radius = 0, inset = 0 }) {
  const c = [radius, radius];
  return { width, height, inset, corners: [c, c, c, c] };
}

export function roundedRectPath(dims) {
  return tracePath(roundedRectShape(uniformCorners(dims)));
}
export function roundedRectPerimeter(dims) {
  return traceLength(roundedRectShape(uniformCorners(dims)));
}
export function roundedRectSampler(dims) {
  return traceSampler(roundedRectShape(uniformCorners(dims)));
}

// ---------- DOM wrappers ----------

function readDims(host) {
  const rect = host.getBoundingClientRect();
  const cs = getComputedStyle(host);
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;
  return { width: rect.width, height: rect.height, radius };
}

export function perimeterPath(host, inset = 0) {
  return roundedRectPath({ ...readDims(host), inset });
}
export function perimeterSampler(host, inset = 0) {
  return roundedRectSampler({ ...readDims(host), inset });
}
