/**
 * Shadow DOM styles for <requirement-card>
 *
 * Display-only card for one ility's prioritization decision.
 * Theme tokens swap automatically across light/dark and brand themes.
 */
export const styles = `
  :host {
    --_padding:        var(--requirement-card-padding, var(--size-m, 1rem));
    --_radius:         var(--requirement-card-radius, var(--radius-m, 0.5rem));
    --_gap:            var(--requirement-card-gap, var(--size-2xs, 0.25rem));
    --_surface:        var(--requirement-card-surface, var(--color-surface, #fff));
    --_border:         var(--requirement-card-border, 1px solid var(--color-border, #e5e7eb));
    --_text:           var(--requirement-card-text, var(--color-text, #1a1a1a));
    --_muted:          var(--requirement-card-muted, var(--color-text-muted, #6b7280));
    --_critical-bg:    var(--requirement-card-critical-bg,    var(--color-error-subtle, oklch(95% 0.05 27)));
    --_critical-fg:    var(--requirement-card-critical-fg,    var(--color-error, #dc2626));
    --_important-bg:   var(--requirement-card-important-bg,   var(--color-warning-subtle, oklch(95% 0.05 80)));
    --_important-fg:   var(--requirement-card-important-fg,   var(--color-warning, #b45309));
    --_acceptable-bg:  var(--requirement-card-acceptable-bg,  var(--color-success-subtle, oklch(95% 0.05 145)));
    --_acceptable-fg:  var(--requirement-card-acceptable-fg,  var(--color-success, #15803d));
    --_skipped-bg:     var(--requirement-card-skipped-bg,     var(--color-surface-raised, var(--color-surface, #f5f5f5)));
    --_skipped-fg:     var(--requirement-card-skipped-fg,     var(--color-text-muted, #6b7280));
    --_conflict:       var(--requirement-card-conflict-color, var(--color-error, #dc2626));

    display: block;
    padding: var(--_padding);
    border-radius: var(--_radius);
    background: var(--_surface);
    border: var(--_border);
    color: var(--_text);
    container-type: inline-size;
  }

  .card {
    display: grid;
    gap: var(--_gap);
  }

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--size-s, 0.75rem);
  }

  .name {
    font-weight: var(--font-weight-semibold, 600);
    font-size: var(--font-size-md, 1rem);
  }

  .badge ::slotted([slot="badge"]) {
    font-size: var(--font-size-xs, 0.75em);
    color: var(--_muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pill ::slotted([slot="priority-pill"]),
  .priority-default {
    display: inline-block;
    padding: 0.15em 0.6em;
    border-radius: var(--radius-pill, 999px);
    font-size: var(--font-size-xs, 0.75em);
    font-weight: var(--font-weight-semibold, 600);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Priority-driven surface tinting on the card itself (when no slotted pill) */
  :host(:state(priority-critical))     { border-color: var(--_critical-fg); }
  :host(:state(priority-important))    { border-color: var(--_important-fg); }
  :host(:state(priority-acceptable))   { border-color: var(--_acceptable-fg); }
  :host(:state(priority-not-relevant)) { opacity: 0.6; }

  :host(:state(priority-critical))     .priority-default { background: var(--_critical-bg);    color: var(--_critical-fg); }
  :host(:state(priority-important))    .priority-default { background: var(--_important-bg);   color: var(--_important-fg); }
  :host(:state(priority-acceptable))   .priority-default { background: var(--_acceptable-bg);  color: var(--_acceptable-fg); }
  :host(:state(priority-not-relevant)) .priority-default { background: var(--_skipped-bg);     color: var(--_skipped-fg); text-decoration: line-through; }

  /* Hide the default pill when the author supplied one via slot */
  :host(:state(has-priority-pill)) .priority-default { display: none; }

  .rationale ::slotted([slot="rationale"]) {
    color: var(--_muted);
    font-size: var(--font-size-sm, 0.875rem);
    line-height: 1.45;
  }

  .conflicts ::slotted([slot="conflicts"]) {
    color: var(--_conflict);
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-semibold, 600);
  }

  /* When no rationale or conflicts content, collapse the slot row */
  :host(:not(:state(has-rationale))) .rationale,
  :host(:not(:state(has-conflicts))) .conflicts { display: none; }

  /* Conflict flag */
  :host([data-conflict]) {
    border-color: var(--_conflict);
    box-shadow: inset 0 0 0 1px var(--_conflict);
  }

  /* Interactive: bubble click event so parents can wire up navigation */
  :host { cursor: default; }
  :host(:state(interactive)) { cursor: pointer; }
  :host(:state(interactive)):hover { background: color-mix(in oklab, var(--_surface) 92%, currentColor 8%); }
  :host(:focus-visible) {
    outline: 2px solid var(--color-focus-ring, var(--color-interactive, currentColor));
    outline-offset: 2px;
  }
`;
