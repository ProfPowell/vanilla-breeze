/**
 * Shadow DOM styles for <user-journey>
 *
 * Theme integration:
 *   --user-journey-*  (per-instance author override)
 *   --color-*         (VB theme token — adapts to data-theme and color mode)
 *   #fallback         (last-resort hex for component used outside VB)
 *
 * VB tokens already swap on color-scheme change and across themes, so we
 * deliberately DO NOT define our own @media (prefers-color-scheme: dark)
 * overrides — those would override the user's chosen VB theme. Semantic
 * tints (positive/neutral/negative emotion zones, painpoint/opportunity
 * row tints) are derived via color-mix from the corresponding theme
 * tokens (--color-success/--color-warning/--color-error) so they shift
 * automatically with the active theme.
 */
const styles = `
  :host {
    display: block;
    font-family: var(--_font-sans);
    line-height: 1.6;
    color: var(--_text);
    container-type: inline-size;

    --_bg:        var(--user-journey-bg, var(--color-surface-raised, #f8f9fa));
    --_card:      var(--user-journey-card, var(--color-surface, #ffffff));
    --_border:    var(--user-journey-border, var(--color-border, #e0e0e0));
    --_muted:     var(--user-journey-muted, var(--color-text-muted, #666666));
    --_text:      var(--user-journey-text, var(--color-text, #1a1a1a));
    --_inverted:  var(--user-journey-text-inverted, var(--color-text-inverted, #ffffff));
    --_primary:   var(--user-journey-primary, var(--color-primary, var(--color-interactive, #6366f1)));
    --_accent:    var(--user-journey-accent, var(--color-accent, #8b5cf6));
    --_link:      var(--user-journey-link, var(--color-interactive, var(--color-primary, #6366f1)));
    --_curve-stroke: var(--user-journey-curve-stroke, var(--_primary));
    --_radius:    var(--user-journey-radius, var(--radius-l, 0.75rem));

    --_font-sans: var(--user-journey-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_font-mono: var(--user-journey-font-mono, var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace));
    --_font-xs:   var(--user-journey-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:   var(--user-journey-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:   var(--user-journey-font-md, var(--font-size-md, 1rem));
    --_font-xl:   var(--user-journey-font-xl, var(--font-size-xl, 1.25rem));
    --_space-2xs: var(--user-journey-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:  var(--user-journey-space-xs, var(--size-xs, 0.5rem));
    --_space-s:   var(--user-journey-space-s, var(--size-s, 0.75rem));
    --_space-m:   var(--user-journey-space-m, var(--size-m, 1rem));
    --_space-l:   var(--user-journey-space-l, var(--size-l, 1.5rem));

    /* Semantic tints derived from theme tokens via color-mix.
       Subtle backgrounds (10–14%) for body cells, header at 22%. */
    --_tint-pos:  color-mix(in oklch, var(--color-success, #22c55e) 14%, var(--_card));
    --_tint-neu:  color-mix(in oklch, var(--color-warning, #f59e0b) 12%, var(--_card));
    --_tint-neg:  color-mix(in oklch, var(--color-error,   #ef4444) 12%, var(--_card));
    --_tint-row-pain: color-mix(in oklch, var(--color-error,   #ef4444) 8%,  var(--_card));
    --_tint-row-opp:  color-mix(in oklch, var(--color-success, #22c55e) 8%,  var(--_card));
    --_chip-type-bg:  color-mix(in oklch, var(--_accent)  18%, var(--_card));
    --_chip-type-fg:  var(--color-accent-text, var(--_accent));
    --_chip-story-bg: color-mix(in oklch, var(--_link)    18%, var(--_card));
    --_chip-story-bg-hover: color-mix(in oklch, var(--_link) 28%, var(--_card));
    --_chip-story-fg: var(--_link);
    --_grid-head-bg:  color-mix(in oklch, var(--_primary) 85%, var(--color-text, #000));
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  /* Card */
  .journey {
    background: var(--_card);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    overflow: hidden;
  }

  /* Header */
  .journey__header {
    padding: 20px 24px 16px 28px;
    border-block-end: 1px solid var(--_border);
    position: relative;
  }

  /* Left accent bar */
  .journey__header::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 4px;
    background: linear-gradient(135deg, var(--_primary), var(--_accent));
  }

  .journey__header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--_space-s);
    flex-wrap: wrap;
    margin-block-end: var(--_space-xs);
  }

  .journey__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  /* Chips */
  .chip {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 2px 9px;
    border-radius: 99px;
    text-decoration: none;
    line-height: 1.6;
  }

  .chip--type {
    color: var(--_chip-type-fg);
    background: var(--_chip-type-bg);
  }

  .chip--story {
    color: var(--_chip-story-fg);
    background: var(--_chip-story-bg);
  }

  .chip--story:hover { background: var(--_chip-story-bg-hover); }

  /* Persona ref */
  .persona-ref {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--_muted);
    text-decoration: none;
    white-space: nowrap;
  }
  .persona-ref svg { width: 14px; height: 14px; flex-shrink: 0; }
  a.persona-ref:hover { color: var(--_link); text-decoration: underline; }

  /* Title & summary (slotted content) */
  .journey__title-wrap {
    margin-block-end: var(--_space-2xs);
  }

  .journey__title {
    font-size: var(--_font-xl);
    font-weight: 700;
    color: var(--_text);
    margin: 0;
  }

  ::slotted([slot="title"]) {
    font-size: var(--_font-xl) !important;
    font-weight: 700 !important;
    color: var(--_text) !important;
    margin: 0 !important;
  }

  .journey--compact .journey__title,
  .journey--compact ::slotted([slot="title"]) { font-size: var(--_font-md) !important; }

  .journey__summary-wrap {
    max-width: 72ch;
  }

  ::slotted([slot="summary"]) {
    font-size: var(--_font-sm) !important;
    color: var(--_muted) !important;
    margin: 0 !important;
  }

  /* Emotion curve */
  .journey__curve {
    background: var(--_bg);
    border-block-end: 1px solid var(--_border);
    overflow: hidden;
  }

  .curve-svg {
    display: block;
    width: 100%;
    height: 80px;
  }

  .journey--compact .curve-svg { height: 54px; }

  .zone { opacity: 0.55; }
  .zone--pos { fill: var(--_tint-pos); }
  .zone--neu { fill: var(--_tint-neu); }
  .zone--neg { fill: var(--_tint-neg); }

  .vline      { stroke: var(--_border); stroke-width: 1; stroke-dasharray: 3 4; }
  .curve-line { stroke: var(--_curve-stroke); stroke-width: 2.5; stroke-linecap: round; }
  .dot        { stroke: var(--_card); stroke-width: 2.5; }

  /* Grid */
  .journey__grid-wrap { overflow-x: auto; }

  .journey__grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  /* Head row */
  .journey__grid thead tr {
    background: var(--_grid-head-bg);
    color: var(--_inverted);
  }

  .corner {
    padding: 10px 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.55;
    text-align: left;
    white-space: nowrap;
    min-width: 100px;
    position: sticky;
    left: 0;
    background: var(--_grid-head-bg);
    z-index: 2;
  }

  .phase-head {
    padding: 10px 14px;
    text-align: left;
    vertical-align: top;
    border-inline-start: 1px solid color-mix(in oklch, var(--_inverted) 12%, transparent);
    min-width: 160px;
    position: relative;
  }

  /* Emotion-coloured top accent per phase */
  .phase-head::before {
    content: '';
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    height: 3px;
    background: var(--ec, var(--_primary));
  }

  .ph-num   { display: block; font-size: 10px; opacity: 0.5; margin-block-end: 2px; }
  .ph-name  { display: block; font-size: var(--_font-sm); font-weight: 700; line-height: 1.2; }
  .ph-emoji { display: block; font-size: var(--_font-xl); line-height: 1; margin-block: 4px 2px; }

  .ph-stories { display: flex; flex-wrap: wrap; gap: var(--_space-2xs); margin-block-start: var(--_space-2xs); }

  /* Body rows */
  .grid-row th,
  .grid-row td {
    padding: 10px 12px;
    border-block-end: 1px solid var(--_border);
    border-inline-start: 1px solid var(--_border);
    vertical-align: top;
  }

  .grid-row th:first-child { border-inline-start: none; }

  .row-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--_muted);
    white-space: nowrap;
    background: var(--_bg);
    text-align: left;
    position: sticky;
    left: 0;
    z-index: 1;
  }

  .data-cell          { font-size: 13px; line-height: 1.45; }
  .data-cell p        { margin-block: 0 4px; }
  .data-cell p:last-child { margin-block-end: 0; }
  .data-cell--empty   { color: var(--_muted); opacity: 0.35; }

  /* Semantic row tints */
  .grid-row--painpoints    .data-cell { background: var(--_tint-row-pain); }
  .grid-row--opportunities .data-cell { background: var(--_tint-row-opp); }

  /* Compact */
  .journey--compact .phase-head { min-width: 120px; padding: 8px 10px; }
  .journey--compact .data-cell  { font-size: 12px; padding: 7px 10px; }
  .journey--compact .corner     { min-width: 80px; }

  /* Utility */
  .state-msg           { padding: var(--_space-l); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
  .state-msg--error    { color: var(--color-error-text, var(--color-error, #dc2626)); }
  .journey__placeholder { padding: 20px 24px; font-size: var(--_font-sm); color: var(--_muted); }
  code { font-family: var(--_font-mono); font-size: 0.88em; }

  /* Responsive */
  @container (max-width: 500px) {
    .journey__header   { padding: 14px 16px 12px 20px; }
    .journey__title    { font-size: 17px; }
    .corner, .row-label { min-width: 72px; font-size: 9px; }
    .phase-head        { min-width: 110px; padding: 8px 10px; }
    .data-cell         { font-size: 12px; padding: 8px 10px; }
  }

  @media print {
    .journey__grid-wrap { overflow: visible; }
    .row-label, .corner { position: relative; }
  }
`;

export { styles };
