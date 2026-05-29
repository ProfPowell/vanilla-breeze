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
    // The closing Z draws a straight line back to start, so a trailing line that
    // returns to start is redundant. An open trailing line must still be drawn.
    if (i === segments.length - 1 && s.kind === 'line') {
      const end = s.at(1);
      if (Math.abs(end[0] - start[0]) < 1e-6 && Math.abs(end[1] - start[1]) < 1e-6) return;
    }
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
  // A corner needs BOTH radii to form an arc; if either is 0 (e.g. inset zeroed
  // one component), the corner is square so edges meet with no offset.
  c = c.map(([rx, ry]) => (rx > 0 && ry > 0 ? [rx, ry] : [0, 0]));

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

// ---------- polygon ----------

// points = [[x,y],…] already resolved to px. Closed.
export function polygonShape(points) {
  if (!points || points.length < 2) return { start: points?.[0]?.slice() ?? [0, 0], segments: [] };
  const start = points[0].slice();
  const segments = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    segments.push(lineSeg(a, b));
  }
  return { start, segments };
}

// ---------- circle / ellipse ----------

// Two clockwise arcs from the top (12 o'clock). rx/ry equal → circle.
function ellipseSegments({ cx, cy, rx, ry }) {
  const top = [cx, cy - ry];
  const bottom = [cx, cy + ry];
  const half = (a0deg, end) => {
    const pt = (adeg) => [cx + rx * Math.cos(deg(adeg)), cy + ry * Math.sin(deg(adeg))];
    const d = `A${n(rx)} ${n(ry)} 0 0 1 ${n(end[0])} ${n(end[1])}`;
    if (rx === ry) return { kind: 'arc', len: Math.PI * rx, at: (u) => pt(a0deg + 180 * u), d };
    const N = 48;
    const poly = [];
    for (let i = 0; i <= N; i++) poly.push(pt(a0deg + 180 * (i / N)));
    return { kind: 'arc', ...flattenedWalker(poly), d };
  };
  // top (−90°) → bottom (+90°) → top (+270°). cos(−90)=0, sin(−90)=−1 → (cx,cy−ry)=top.
  return { start: top, segments: [half(-90, bottom), half(90, top)] };
}

export function circleShape({ cx, cy, r }) {
  return ellipseSegments({ cx, cy, rx: r, ry: r });
}
export function ellipseShape({ cx, cy, rx, ry }) {
  return ellipseSegments({ cx, cy, rx, ry });
}

// ---------- inset() ----------

// edges in px from each side; corners as for roundedRectShape (raw radii).
export function insetShape({ top = 0, right = 0, bottom = 0, left = 0, corners = [[0, 0], [0, 0], [0, 0], [0, 0]] }, { width, height }) {
  const w = Math.max(0, width - left - right);
  const h = Math.max(0, height - top - bottom);
  const shape = roundedRectShape({ width: w, height: h, corners });
  return shiftShape(shape, left, top);
}

function shiftShape({ start, segments }, dx, dy) {
  if (dx === 0 && dy === 0) return { start, segments };
  const shift = (p) => [p[0] + dx, p[1] + dy];
  const newSegs = segments.map((s) => ({ ...s, at: (u) => shift(s.at(u)), d: shiftPathCommand(s.d, dx, dy) }));
  return { start: shift(start), segments: newSegs };
}

// Shift the absolute coordinates inside a single-command `d` (H/V/L/A) by dx,dy.
function shiftPathCommand(d, dx, dy) {
  const cmd = d[0];
  if (cmd === 'H') return `H${n(parseFloat(d.slice(1)) + dx)}`;
  if (cmd === 'V') return `V${n(parseFloat(d.slice(1)) + dy)}`;
  if (cmd === 'L') {
    const [x, y] = d.slice(1).split(' ').map(parseFloat);
    return `L${n(x + dx)} ${n(y + dy)}`;
  }
  if (cmd === 'A') {
    const [rx, ry, rot, laf, sf, x, y] = d.slice(1).trim().split(/\s+/).map(Number);
    return `A${n(rx)} ${n(ry)} ${n(rot)} ${laf} ${sf} ${n(x + dx)} ${n(y + dy)}`;
  }
  return d;
}

// ---------- bezier flattening ----------

function flattenCubic(p0, p1, p2, p3, N = 24) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const mt = 1 - t;
    const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, e = t * t * t;
    pts.push([a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1]]);
  }
  return pts;
}
function flattenQuad(p0, p1, p2, N = 24) {
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const mt = 1 - t;
    const a = mt * mt, b = 2 * mt * t, c = t * t;
    pts.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]);
  }
  return pts;
}

// ---------- path() ----------

function tokenizePath(d) {
  const tokens = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let m;
  /** @type {{ cmd: string, args: number[] } | null} */
  let cur = null;
  while ((m = re.exec(d))) {
    if (m[1]) {
      cur = { cmd: m[1], args: [] };
      tokens.push(cur);
    } else if (cur) {
      cur.args.push(parseFloat(m[2]));
    }
  }
  return tokens;
}

// Parse SVG path data `d` into a traced shape. Supports M L H V C S Q T Z (abs+rel).
// The `A` arc command is NOT implemented (clip-path: path() rarely uses it) — such
// segments are skipped. Coordinates are taken as-is (px); the DOM layer resolves units.
export function pathShape(d) {
  const toks = tokenizePath(d);
  let cur = [0, 0];
  let startPt = [0, 0];
  let prevCubicCtrl = null;
  let prevQuadCtrl = null;
  const segments = [];
  const push = (seg) => segments.push(seg);
  const rel = (cmd) => cmd === cmd.toLowerCase();
  for (const { cmd, args } of toks) {
    const C = cmd.toUpperCase();
    const r = rel(cmd);
    const ax = (x) => (r ? cur[0] + x : x);
    const ay = (y) => (r ? cur[1] + y : y);
    if (C === 'M') {
      cur = [ax(args[0]), ay(args[1])];
      startPt = cur.slice();
      for (let i = 2; i + 1 < args.length; i += 2) {
        const p = [r ? cur[0] + args[i] : args[i], r ? cur[1] + args[i + 1] : args[i + 1]];
        push(lineSeg(cur, p));
        cur = p;
      }
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (C === 'L') {
      for (let i = 0; i + 1 < args.length; i += 2) {
        const p = [r ? cur[0] + args[i] : args[i], r ? cur[1] + args[i + 1] : args[i + 1]];
        push(lineSeg(cur, p));
        cur = p;
      }
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (C === 'H') {
      for (const xv of args) {
        const p = [r ? cur[0] + xv : xv, cur[1]];
        push(lineSeg(cur, p));
        cur = p;
      }
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (C === 'V') {
      for (const yv of args) {
        const p = [cur[0], r ? cur[1] + yv : yv];
        push(lineSeg(cur, p));
        cur = p;
      }
      prevCubicCtrl = prevQuadCtrl = null;
    } else if (C === 'C' || C === 'S') {
      const step = C === 'C' ? 6 : 4;
      for (let i = 0; i + step - 1 < args.length; i += step) {
        let c1, c2, end;
        if (C === 'C') {
          c1 = [ax(args[i]), ay(args[i + 1])];
          c2 = [ax(args[i + 2]), ay(args[i + 3])];
          end = [ax(args[i + 4]), ay(args[i + 5])];
        } else {
          c1 = prevCubicCtrl ? [2 * cur[0] - prevCubicCtrl[0], 2 * cur[1] - prevCubicCtrl[1]] : cur.slice();
          c2 = [ax(args[i]), ay(args[i + 1])];
          end = [ax(args[i + 2]), ay(args[i + 3])];
        }
        const poly = flattenCubic(cur, c1, c2, end);
        push({ kind: 'curve', ...flattenedWalker(poly), d: `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(end[0])} ${n(end[1])}` });
        prevCubicCtrl = c2;
        prevQuadCtrl = null;
        cur = end;
      }
    } else if (C === 'Q' || C === 'T') {
      const step = C === 'Q' ? 4 : 2;
      for (let i = 0; i + step - 1 < args.length; i += step) {
        let c1, end;
        if (C === 'Q') {
          c1 = [ax(args[i]), ay(args[i + 1])];
          end = [ax(args[i + 2]), ay(args[i + 3])];
        } else {
          c1 = prevQuadCtrl ? [2 * cur[0] - prevQuadCtrl[0], 2 * cur[1] - prevQuadCtrl[1]] : cur.slice();
          end = [ax(args[i]), ay(args[i + 1])];
        }
        const poly = flattenQuad(cur, c1, end);
        push({ kind: 'curve', ...flattenedWalker(poly), d: `Q${n(c1[0])} ${n(c1[1])} ${n(end[0])} ${n(end[1])}` });
        prevQuadCtrl = c1;
        prevCubicCtrl = null;
        cur = end;
      }
    } else if (C === 'Z') {
      if (cur[0] !== startPt[0] || cur[1] !== startPt[1]) push(lineSeg(cur, startPt));
      cur = startPt.slice();
      prevCubicCtrl = prevQuadCtrl = null;
    }
  }
  return { start: startPt, segments };
}

// ---------- CSS shape() ----------

// commands = ordered verbs with px-resolved coords:
//   { verb:'from', to:[x,y] }
//   { verb:'line', to:[x,y] }
//   { verb:'hline', x } | { verb:'vline', y }
//   { verb:'curve', to:[x,y], via:[[cx,cy]] }   // 1 control = quadratic, 2 = cubic
//   { verb:'close' }
export function shapeShape(commands) {
  let cur = [0, 0];
  let startPt = [0, 0];
  const segments = [];
  for (const c of commands) {
    if (c.verb === 'from') {
      cur = c.to.slice();
      startPt = cur.slice();
    } else if (c.verb === 'line') {
      segments.push(lineSeg(cur, c.to));
      cur = c.to.slice();
    } else if (c.verb === 'hline') {
      const p = [c.x, cur[1]];
      segments.push(lineSeg(cur, p));
      cur = p;
    } else if (c.verb === 'vline') {
      const p = [cur[0], c.y];
      segments.push(lineSeg(cur, p));
      cur = p;
    } else if (c.verb === 'curve') {
      const end = c.to;
      if (c.via.length === 2) {
        const [c1, c2] = c.via;
        const poly = flattenCubic(cur, c1, c2, end);
        segments.push({ kind: 'curve', ...flattenedWalker(poly), d: `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(end[0])} ${n(end[1])}` });
      } else {
        const c1 = c.via[0];
        const poly = flattenQuad(cur, c1, end);
        segments.push({ kind: 'curve', ...flattenedWalker(poly), d: `Q${n(c1[0])} ${n(c1[1])} ${n(end[0])} ${n(end[1])}` });
      }
      cur = end.slice();
    } else if (c.verb === 'close') {
      if (cur[0] !== startPt[0] || cur[1] !== startPt[1]) segments.push(lineSeg(cur, startPt));
      cur = startPt.slice();
    }
  }
  return { start: startPt, segments };
}

// ---------- clip-path parsing ----------

// Resolve a CSS length/percentage token against a reference length (px).
function resolveLen(tok, ref) {
  const t = String(tok).trim();
  if (t.endsWith('%')) return (parseFloat(t) / 100) * ref;
  return parseFloat(t) || 0;
}

// True when a token is a CSS length/percentage (not a keyword like closest-side).
function isLen(tok) {
  return tok != null && /^-?\d*\.?\d/.test(String(tok).trim());
}

// Parse a computed clip-path value into a traced shape, resolving against {width,height}.
// Returns null for 'none' / unsupported so callers fall back to border-radius.
export function parseClipPath(value, box) {
  if (!value || value === 'none') return null;
  const v = value.trim();
  const { width, height } = box;
  const fnMatch = v.match(/^([a-z-]+)\((.*)\)$/i);
  if (!fnMatch) return null;
  const fn = fnMatch[1].toLowerCase();
  const inner = fnMatch[2].trim();

  if (fn === 'polygon') {
    const body = inner.replace(/^(nonzero|evenodd)\s*,?\s*/i, '');
    const pts = body.split(',').map((pair) => {
      const [xs, ys] = pair.trim().split(/\s+/);
      return [resolveLen(xs, width), resolveLen(ys, height)];
    });
    return polygonShape(pts);
  }
  if (fn === 'circle') {
    const at = inner.split(/\bat\b/i);
    const r = at[0].trim();
    const [cxs, cys] = (at[1] || '50% 50%').trim().split(/\s+/);
    const cx = resolveLen(cxs ?? '50%', width);
    const cy = resolveLen(cys ?? '50%', height);
    // A length/percentage radius, else a keyword (closest-side, etc.) → default
    // to closest-side (half the shorter dimension).
    const radius = isLen(r) ? resolveLen(r, Math.hypot(width, height) / Math.SQRT2) : Math.min(width, height) / 2;
    return circleShape({ cx, cy, r: radius });
  }
  if (fn === 'ellipse') {
    const at = inner.split(/\bat\b/i);
    const radii = at[0].trim().split(/\s+/);
    const [cxs, cys] = (at[1] || '50% 50%').trim().split(/\s+/);
    const rx = isLen(radii[0]) ? resolveLen(radii[0], width) : width / 2;
    const ry = isLen(radii[1]) ? resolveLen(radii[1], height) : height / 2;
    return ellipseShape({ cx: resolveLen(cxs ?? '50%', width), cy: resolveLen(cys ?? '50%', height), rx, ry });
  }
  if (fn === 'inset') {
    const [edgesPart, roundPart] = inner.split(/\bround\b/i);
    const e = edgesPart.trim().split(/\s+/);
    const top = resolveLen(e[0], height);
    const right = resolveLen(e[1] ?? e[0], width);
    const bottom = resolveLen(e[2] ?? e[0], height);
    const left = resolveLen(e[3] ?? e[1] ?? e[0], width);
    let corners = [[0, 0], [0, 0], [0, 0], [0, 0]];
    if (roundPart) {
      // 1–4 value border-radius shorthand: TL / TL TR / TL TR BR / TL TR BR BL.
      // (Elliptical "rx / ry" form is rare in computed clip-path; first group used.)
      const rr = roundPart.trim().split('/')[0].trim().split(/\s+/);
      const ref = Math.min(width, height);
      const tl = resolveLen(rr[0], ref);
      const tr = resolveLen(rr[1] ?? rr[0], ref);
      const br = resolveLen(rr[2] ?? rr[0], ref);
      const bl = resolveLen(rr[3] ?? rr[1] ?? rr[0], ref);
      corners = [[tl, tl], [tr, tr], [br, br], [bl, bl]];
    }
    return insetShape({ top, right, bottom, left, corners }, box);
  }
  if (fn === 'path') {
    const d = inner.replace(/^(nonzero|evenodd)\s*,?\s*/i, '').replace(/^["']|["']$/g, '');
    return pathShape(d);
  }
  return null;
}

// ---------- DOM wrappers (shape detection) ----------

// Read one corner radius computed value ("10px" or "10px 20px") → [rx, ry] in px.
function readCorner(cs, prop) {
  const v = (cs[prop] || '').trim();
  if (!v) return [0, 0];
  const parts = v.split(/\s+/).map((p) => parseFloat(p) || 0);
  return parts.length >= 2 ? [parts[0], parts[1]] : [parts[0], parts[0]];
}

function readShape(host, inset) {
  const rect = host.getBoundingClientRect();
  const cs = getComputedStyle(host);
  const clip = parseClipPath(cs.clipPath, { width: rect.width, height: rect.height });
  if (clip) return clip; // clip-path wins; inset not applied to an explicit shape
  const tl = readCorner(cs, 'borderTopLeftRadius');
  const hasPerCorner =
    cs.borderTopRightRadius != null || cs.borderBottomRightRadius != null || cs.borderBottomLeftRadius != null;
  const corners = hasPerCorner
    ? [tl, readCorner(cs, 'borderTopRightRadius'), readCorner(cs, 'borderBottomRightRadius'), readCorner(cs, 'borderBottomLeftRadius')]
    : [tl, tl, tl, tl];
  return roundedRectShape({ width: rect.width, height: rect.height, corners, inset });
}

export function perimeterPath(host, inset = 0) {
  return tracePath(readShape(host, inset));
}
export function perimeterSampler(host, inset = 0) {
  return traceSampler(readShape(host, inset));
}
