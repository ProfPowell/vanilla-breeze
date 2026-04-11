/**
 * Shadow DOM styles for <work-item>
 *
 * 3-tier token pattern:
 *   var(--work-item-*, var(--color-*, fallback))
 *
 * Sibling component to user-story — shares visual language
 * but displays engineering work (tasks, bugs, chores, spikes)
 * instead of agile stories.
 */
const styles = `
:host {
  --_bg:        var(--work-item-bg, var(--color-surface, #ffffff));
  --_text:      var(--work-item-text, var(--color-text, #1a1a1a));
  --_muted:     var(--work-item-muted, var(--color-text-muted, #666));
  --_border:    var(--work-item-border, var(--color-border, #e0e0e0));
  --_accent:    var(--work-item-accent, var(--color-interactive, #0066cc));
  --_card-bg:   var(--work-item-card-bg, var(--color-surface-raised, #f8f9fa));
  --_highlight: var(--work-item-highlight, color-mix(in srgb, var(--_accent) 8%, transparent));
  --_radius:    var(--work-item-radius, var(--radius-l, 0.75rem));
  --_shadow:       var(--work-item-shadow, var(--shadow-sm));
  --_shadow-hover: var(--work-item-shadow-hover, var(--shadow-md));
  --_duration:     var(--work-item-duration, var(--duration-normal, 200ms));
  --_ease:         var(--work-item-ease, var(--ease-default, ease));
  --_space-2xs:    var(--work-item-space-2xs, var(--size-2xs, 0.25rem));
  --_space-xs:     var(--work-item-space-xs, var(--size-xs, 0.5rem));
  --_space-s:      var(--work-item-space-s, var(--size-s, 0.75rem));
  --_space-m:      var(--work-item-space-m, var(--size-m, 1rem));
  --_font-xs:      var(--work-item-font-xs, var(--font-size-xs, 0.75rem));
  --_font-sm:      var(--work-item-font-sm, var(--font-size-sm, 0.875rem));
  --_font-md:      var(--work-item-font-md, var(--font-size-md, 1rem));
  --_font-lg:      var(--work-item-font-lg, var(--font-size-lg, 1.125rem));
  --_font-mono:    var(--work-item-font-mono, var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace));
  --_radius-s:     var(--work-item-radius-s, var(--radius-s, 0.25rem));
  --_radius-full:  var(--work-item-radius-full, var(--radius-full, 9999px));

  display: block;
  font-family: var(--work-item-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
}

*, *::before, *::after { box-sizing: border-box; margin: 0; }

/* ── Card ──────────────────────────────────────────── */
.wi-card {
  background: var(--_bg);
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  overflow: hidden;
  box-shadow: var(--_shadow);
  transition: box-shadow var(--_duration) var(--_ease);
}

.wi-card:hover {
  box-shadow: var(--_shadow-hover);
}

/* ── Header ────────────────────────────────────────── */
.wi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--_space-s) var(--_space-m);
  background: var(--_card-bg);
  border-block-end: 1px solid var(--_border);
  gap: var(--_space-s);
  flex-wrap: wrap;
}

.wi-meta {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  flex-wrap: wrap;
  min-width: 0;
}

.wi-id {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  font-family: var(--_font-mono);
}

/* ── Type badge ────────────────────────────────────── */
.wi-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--_radius-s);
  text-transform: capitalize;
}

.wi-type svg {
  width: 12px;
  height: 12px;
}

/* Type colors */
.wi-type[data-type="task"]    { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.wi-type[data-type="bug"]     { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
.wi-type[data-type="chore"]   { color: #6b7280; background: rgba(107, 114, 128, 0.1); }
.wi-type[data-type="spike"]   { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }
.wi-type[data-type="feature"] { color: #059669; background: rgba(5, 150, 105, 0.1); }

/* ── Badges ────────────────────────────────────────── */
.wi-badges {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
}

.wi-priority,
.wi-status {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: var(--_radius-full);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.wi-estimate {
  width: 28px;
  height: 28px;
  border-radius: var(--_radius-full);
  background: var(--_accent);
  color: white;
  font-size: var(--_font-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Body ──────────────────────────────────────────── */
.wi-body {
  padding: 16px 20px;
}

.wi-title-wrap {
  margin-block-end: var(--_space-xs);
}

.wi-title-wrap:last-child {
  margin-block-end: 0;
}

::slotted([slot="title"]) {
  font-size: var(--_font-lg) !important;
  font-weight: 700 !important;
  color: var(--_text) !important;
  line-height: 1.4 !important;
  margin: 0 !important;
}

.wi-title-fallback {
  font-size: var(--_font-lg);
  font-weight: 700;
  color: var(--_text);
  line-height: 1.4;
}

.wi-title:last-child {
  margin-block-end: 0;
}

/* ── Assignee ──────────────────────────────────────── */
.wi-assignee {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--_font-xs);
  color: var(--_muted);
  margin-block-start: var(--_space-xs);
}

.wi-assignee__avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--_radius-full);
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

/* ── Linked stories ────────────────────────────────── */
.wi-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-block-start: var(--_space-s);
}

.wi-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--_radius-s);
  background: var(--_highlight);
  color: var(--_accent);
  text-decoration: none;
}

.wi-link:hover {
  text-decoration: underline;
}

.wi-link svg {
  width: 11px;
  height: 11px;
}

/* ── Sections ──────────────────────────────────────── */
.wi-sections {
  border-block-start: 1px solid var(--_border);
}

.wi-section {
  padding: 14px 20px;
  border-block-end: 1px solid var(--_border);
}

.wi-section:last-child {
  border-block-end: none;
}

.wi-section-header {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  margin-block-end: var(--_space-s);
}

.wi-section-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wi-section-icon svg {
  width: 13px;
  height: 13px;
  fill: white;
}

.wi-section-icon.description { background: #3b82f6; }
.wi-section-icon.checklist   { background: #22c55e; }
.wi-section-icon.notes       { background: #f59e0b; }

.wi-section-title {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wi-section-content {
  color: var(--_text);
  font-size: var(--_font-sm);
  line-height: 1.6;
}

.wi-section-content ::slotted(ul),
.wi-section-content ::slotted(ol) {
  margin: 0;
  padding-inline-start: 20px;
}

.wi-section-content ::slotted(p) {
  margin: 0;
}

.slot-fallback {
  color: var(--_muted);
  font-style: italic;
}

/* ── Minimal detail ────────────────────────────────── */
.wi-card--minimal {
  padding: var(--_space-xs);
  cursor: pointer;
}

.wi-card--minimal:hover {
  box-shadow: var(--_shadow-hover);
}

.wi-card--minimal:focus-visible {
  outline: 2px solid var(--_accent);
  outline-offset: 2px;
}

.wi-card--minimal .wi-header { display: none; }
.wi-card--minimal .wi-sections { display: none; }
.wi-card--minimal .wi-links { display: none; }
.wi-card--minimal .wi-assignee { display: none; }

.wi-card--minimal .wi-body {
  padding: var(--_space-xs) var(--_space-s);
}

.wi-card--minimal .wi-title-fallback,
.wi-card--minimal ::slotted([slot="title"]) {
  font-size: var(--_font-sm) !important;
  font-weight: 600 !important;
}

.wi-card--minimal .wi-id {
  display: block;
  margin-block-end: var(--_space-2xs);
}

.wi-card--minimal .wi-type {
  font-size: 10px;
  padding: 2px 6px;
}

/* ── Compact detail — hide empty sections ──────────── */
.wi-card--compact .wi-section[data-empty] {
  display: none;
}

.wi-card--compact .slot-fallback {
  display: none;
}

.wi-card--compact .wi-body {
  padding: var(--_space-s) var(--_space-m);
}

/* ── Responsive ────────────────────────────────────── */
@media (max-width: 480px) {
  .wi-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .wi-badges {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wi-card {
    transition: none;
  }
}

@media print {
  .wi-card {
    box-shadow: none;
    break-inside: avoid;
  }
}

.state-msg        { padding: var(--_space-m); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
.state-msg--error { color: #dc2626; }
`;

export { styles };
