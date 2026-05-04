/**
 * Shadow DOM styles for <score-card>
 *
 * Theme integration:
 *   --score-card-*  per-instance author override
 *   --color-*       VB theme tokens (auto-adapt across themes + color-scheme)
 *
 * No @media (prefers-color-scheme) overrides — VB tokens already swap.
 * Logical properties used throughout for RTL.
 */
const styles = `
  :host {
    --_padding:         var(--score-card-padding, var(--size-l, 1.5rem));
    --_radius:          var(--score-card-radius, var(--radius-m, 0.5rem));
    --_gap:             var(--score-card-gap, var(--size-s, 0.75rem));
    --_value-size:      var(--score-card-value-size, var(--font-size-3xl, 2rem));
    --_value-weight:    var(--score-card-value-weight, var(--font-weight-bold, 700));
    --_title-size:      var(--score-card-title-size, var(--font-size-sm, 0.875rem));
    --_meta-size:       var(--score-card-meta-size, var(--font-size-sm, 0.875rem));
    --_sparkline-h:     var(--score-card-sparkline-height, 40px);
    --_surface:         var(--score-card-surface, var(--color-surface, #fff));
    --_border:          var(--score-card-border, 1px solid var(--color-border-subtle, var(--color-border, #e5e7eb)));
    --_text:            var(--score-card-text, var(--color-text, #1a1a1a));
    --_muted:           var(--score-card-muted, var(--color-text-muted, #6b7280));
    --_accent:          var(--score-card-tone-accent, var(--color-interactive, var(--color-primary, #6366f1)));
    --_trend-up:        var(--score-card-trend-up, var(--color-success, #16a34a));
    --_trend-down:      var(--score-card-trend-down, var(--color-error, #dc2626));
    --_trend-flat:      var(--score-card-trend-flat, var(--color-text-muted, #6b7280));
    --_focus:           var(--color-focus-ring, var(--color-interactive, currentColor));
    --_duration:        var(--score-card-duration, var(--duration-fast, 150ms));
    --_ease:            var(--score-card-ease, var(--ease-default, ease));

    display: block;
    box-sizing: border-box;
    color: var(--_text);
    background: var(--_surface);
    border: var(--_border);
    border-radius: var(--_radius);
    padding: var(--_padding);
    container-type: inline-size;
  }

  *, *::before, *::after { box-sizing: border-box; }

  /* ── Tone accent ──────────────────────────────────── */
  :host([tone="success"]) { --_accent: var(--color-success, #16a34a); }
  :host([tone="warning"]) { --_accent: var(--color-warning, #d97706); }
  :host([tone="error"])   { --_accent: var(--color-error,   #dc2626); }
  :host([tone="info"])    { --_accent: var(--color-info,    #2563eb); }

  /* ── Layout grid ──────────────────────────────────── */
  .card {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "title       icon"
      "value       icon"
      "change      change"
      "sparkline   sparkline"
      "description description";
    gap: var(--_gap);
    align-items: start;
  }

  /* cluster: icon stays right, value+change wrap on the left */
  :host([layout="cluster"]) .card {
    grid-template-areas:
      "title       icon"
      "value       icon"
      "change      icon"
      "sparkline   sparkline"
      "description description";
  }

  /* compact: dense vertical, smaller value */
  :host([layout="compact"]) {
    --_padding: var(--size-m, 1rem);
    --_value-size: var(--font-size-2xl, 1.5rem);
    --_gap: var(--size-2xs, 0.25rem);
  }

  /* ── Slot regions ─────────────────────────────────── */
  .title       { grid-area: title; }
  .value       { grid-area: value; }
  .change      { grid-area: change; }
  .sparkline   { grid-area: sparkline; }
  .description { grid-area: description; }
  .icon        { grid-area: icon; }

  .title ::slotted(*) {
    margin: 0;
    font-size: var(--_title-size);
    font-weight: var(--font-weight-medium, 500);
    color: var(--_muted);
    line-height: 1.3;
  }

  .value ::slotted(*) {
    font-size: var(--_value-size);
    font-weight: var(--_value-weight);
    line-height: 1.1;
    color: var(--_text);
    font-variant-numeric: tabular-nums;
  }

  .change ::slotted(*) {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2xs, 0.25rem);
    font-size: var(--_meta-size);
    color: var(--_muted);
    line-height: 1.4;
  }

  .description ::slotted(*) {
    font-size: var(--_meta-size);
    color: var(--_muted);
    line-height: 1.4;
    margin: 0;
  }

  /* Empty optional slots collapse to zero so they don't reserve grid rows.
     :state(has-*) is set by JS when slotchange fires with assigned nodes. */
  .change, .sparkline, .description, .icon { display: none; }
  :host(:state(has-change))      .change      { display: block; }
  :host(:state(has-sparkline))   .sparkline   { display: block; min-block-size: var(--_sparkline-h); overflow: hidden; }
  :host(:state(has-description)) .description { display: block; }
  :host(:state(has-icon))        .icon        { display: inline-flex; align-items: center; justify-content: center; }

  .sparkline ::slotted(*) {
    display: block;
    inline-size: 100%;
    block-size: var(--_sparkline-h);
    max-block-size: var(--_sparkline-h);
  }

  /* icon region — accent color from tone */
  .icon ::slotted(*) {
    color: var(--_accent);
    --icon-color: var(--_accent);
  }

  /* ── Trend coloring (drives change row) ──────────── */
  :host(:state(trend-up))   .change ::slotted(*) { color: var(--_trend-up); }
  :host(:state(trend-down)) .change ::slotted(*) { color: var(--_trend-down); }
  :host(:state(trend-flat)) .change ::slotted(*) { color: var(--_trend-flat); }

  /* ── Interactive (wrapped in <a>) ─────────────────── */
  :host(:state(interactive)) {
    cursor: pointer;
    transition: transform var(--_duration) var(--_ease),
                box-shadow var(--_duration) var(--_ease),
                border-color var(--_duration) var(--_ease);
  }

  /* Lift on hover of the wrapping anchor. We can't reach the anchor from
     shadow CSS, so consumers should use the :has() partner rule in their
     light-DOM stylesheet (documented in the spec). The transition above
     still applies to any state changes the consumer drives. */

  /* ── Loading skeleton ─────────────────────────────── */
  :host(:state(loading)) .value,
  :host(:state(loading)) .sparkline,
  :host(:state(loading)) .change {
    background: linear-gradient(
      90deg,
      color-mix(in oklch, var(--_muted) 12%, transparent),
      color-mix(in oklch, var(--_muted) 24%, transparent),
      color-mix(in oklch, var(--_muted) 12%, transparent)
    );
    background-size: 200% 100%;
    border-radius: var(--radius-s, 0.25rem);
    color: transparent;
    animation: score-card-shimmer 1.4s var(--_ease) infinite;
  }
  :host(:state(loading)) .value ::slotted(*),
  :host(:state(loading)) .change ::slotted(*),
  :host(:state(loading)) .sparkline ::slotted(*) {
    visibility: hidden;
  }
  :host(:state(loading)) .value { min-block-size: var(--_value-size); }
  :host(:state(loading)) .change { min-block-size: 1.4em; }

  @keyframes score-card-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    :host(:state(loading)) .value,
    :host(:state(loading)) .sparkline,
    :host(:state(loading)) .change {
      animation: none;
      background: color-mix(in oklch, var(--_muted) 18%, transparent);
    }
  }
`;

export { styles };
