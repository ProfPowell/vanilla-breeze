/**
 * Deterministic Mermaid stand-in for element-visual fixtures (no network).
 * Lives in tests/element-visual/fixtures/static/ (copied into generated/ by
 * generate-fixtures.js; also served to the demos suite). Fixtures point
 * window.VB_MERMAID_URL at it. Draws N boxes (one per "X --> Y" node, max 4)
 * coloured from the themeVariables diagram-wc passes in, so theme/mode
 * baselines still reflect token mapping. Sources containing INVALID throw.
 */
let cfg = { themeVariables: {} };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export default {
  initialize(c) { cfg = c; },
  async render(id, src) {
    if (/INVALID/.test(src)) throw new Error('Parse error on line 2:\nINVALID\n^');
    const v = cfg.themeVariables || {};
    const title = /accTitle:\s*(.+)/.exec(src)?.[1].trim();
    const nodes = [];
    const body0 = src.split("\n").slice(1).filter((l) => !/^\s*acc(Title|Descr)\s*:/.test(l)).join("\n");
    for (const m of body0.matchAll(/([A-Za-z0-9]+)(?:\[([^\]]+)\]|\{([^}]+)\})?/g)) {
      if (/^(flowchart|LR|TB|accTitle|accDescr)$/.test(m[1])) continue;
      if (!nodes.some((n) => n.id === m[1])) nodes.push({ id: m[1], label: m[2] || m[3] || m[1] });
      if (nodes.length === 4) break;
    }
    const w = 120, gap = 40, h = 44;
    const width = nodes.length * w + (nodes.length - 1) * gap;
    let body = '';
    nodes.forEach((n, i) => {
      const x = i * (w + gap);
      body += `<rect x="${x}" y="8" width="${w}" height="${h}" rx="6" fill="${v.primaryColor}" stroke="${v.primaryBorderColor}"/>`;
      body += `<text x="${x + w / 2}" y="35" text-anchor="middle" fill="${v.primaryTextColor}" font-family="${esc(v.fontFamily)}" font-size="14">${esc(n.label)}</text>`;
      if (i) body += `<line x1="${x - gap}" y1="30" x2="${x}" y2="30" stroke="${v.lineColor}" stroke-width="2"/>`;
    });
    const t = title ? `<title id="chart-title-${id}">${esc(title)}</title>` : '';
    const lab = title ? ` aria-labelledby="chart-title-${id}"` : '';
    return {
      svg: `<svg id="${id}" xmlns="http://www.w3.org/2000/svg" role="graphics-document document" aria-roledescription="flowchart-v2"${lab} viewBox="0 0 ${width} 60" width="${width}" height="60">${t}${body}</svg>`,
    };
  },
};
