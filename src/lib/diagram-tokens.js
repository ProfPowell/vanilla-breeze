/**
 * diagram-tokens — Map Vanilla Breeze design tokens onto external diagram
 * libraries' theme variables. Read at render time via getComputedStyle so
 * theme switches (data-theme, data-mode) propagate without hardcoding.
 *
 * Precedent for runtime token reading: src/web-components/token-specimen/logic.js,
 * src/web-components/semantic-palette/logic.js.
 */

/**
 * Read a CSS custom property from the element's resolved style with a fallback.
 * @param {CSSStyleDeclaration} cs
 * @param {string} name
 * @param {string} fallback
 * @returns {string}
 */
function tok(cs, name, fallback) {
  const v = cs.getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Resolve a color (in any CSS color format the browser understands — including
 * oklch, color-mix, var()) to a canonical `rgb(...)` / `rgba(...)` string.
 * Mermaid's color parser doesn't accept oklch, and modern browsers preserve
 * the original color space through getComputedStyle, so we force-convert via
 * canvas pixel readback.
 *
 * @param {Element} ctx - element whose stacking context defines `--*` lookups
 * @param {string} value - any CSS color value
 * @returns {string}
 */
function rgbify(ctx, value) {
  if (!value) return value;

  // Step 1: resolve var() / color-mix() / etc. in the right scope
  const probe = document.createElement('span');
  probe.style.color = value;
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  (ctx.parentElement || document.body).appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  if (!resolved) return value;

  // Step 2: force RGB via canvas fillStyle + getImageData. This works even
  // when computed style preserves the source color space (oklch/oklab/lch).
  const canvas = rgbify._canvas || (rgbify._canvas = document.createElement('canvas'));
  canvas.width = canvas.height = 1;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 1, 1);
  c.fillStyle = resolved;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = c.getImageData(0, 0, 1, 1).data;
  return a === 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

/**
 * Build the Mermaid `themeVariables` object from VB tokens resolved on `el`.
 * Mermaid bakes these into the SVG at render time, so call this immediately
 * before each `mermaid.render()` and after every `vb:theme-change`.
 *
 * @param {Element} el
 * @returns {Record<string, string>}
 */
export function readMermaidTokens(el) {
  const cs = getComputedStyle(el);

  // Color tokens — pass through rgbify so oklch/color-mix/etc. land as rgb()
  const text       = rgbify(el, tok(cs, '--color-text',           '#1a1a1a'));
  const surface    = rgbify(el, tok(cs, '--color-surface',        '#ffffff'));
  const raised     = rgbify(el, tok(cs, '--color-surface-raised', tok(cs, '--color-surface', '#ffffff')));
  const border     = rgbify(el, tok(cs, '--color-border',         '#e0e0e0'));
  const primary    = rgbify(el, tok(cs, '--color-primary',        tok(cs, '--color-interactive', '#3b82f6')));
  const secondary  = rgbify(el, tok(cs, '--color-secondary',      tok(cs, '--color-surface-raised', '#f8f9fa')));
  const accent     = rgbify(el, tok(cs, '--color-accent',         tok(cs, '--color-primary', '#3b82f6')));
  const muted      = rgbify(el, tok(cs, '--color-text-muted',     tok(cs, '--color-text', '#1a1a1a')));

  const fontFamily = tok(cs, '--font-sans',            'system-ui, -apple-system, "Segoe UI", sans-serif');
  const fontSize   = tok(cs, '--font-size-md',         '14px');

  return {
    // Primary nodes
    primaryColor: primary,
    primaryBorderColor: border,
    primaryTextColor: text,

    // Secondary / tertiary
    secondaryColor: secondary,
    secondaryBorderColor: border,
    secondaryTextColor: text,
    tertiaryColor: accent,
    tertiaryBorderColor: border,
    tertiaryTextColor: text,

    // Backgrounds
    background: surface,
    mainBkg: surface,
    secondBkg: raised,
    tertiaryBkg: raised,

    // Edges & lines
    lineColor: border,
    nodeBorder: border,
    gridColor: border,
    defaultLinkColor: muted,

    // Clusters / subgraphs
    clusterBkg: raised,
    clusterBorder: border,

    // Sequence diagrams
    actorBkg: surface,
    actorBorder: border,
    actorTextColor: text,
    actorLineColor: border,
    signalColor: text,
    signalTextColor: text,
    labelBoxBkgColor: raised,
    labelBoxBorderColor: border,
    labelTextColor: text,
    loopTextColor: text,

    // Notes
    noteBkgColor: raised,
    noteBorderColor: border,
    noteTextColor: text,

    // Edge labels
    edgeLabelBackground: surface,

    // Titles
    titleColor: text,

    // Typography
    fontFamily,
    fontSize,
  };
}

/**
 * Standard Mermaid initialize options used by VB. Combines token-driven
 * themeVariables with VB-safe defaults (strict security, manual run).
 *
 * @param {Element} el
 * @param {{ themeBase?: string }} [opts]
 * @returns {object}
 */
export function buildMermaidConfig(el, opts = {}) {
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: opts.themeBase || 'base',
    themeVariables: readMermaidTokens(el),
  };
}
