/**
 * Shadow DOM styles for <adr-wc>
 *
 * 3-tier token pattern:
 *   var(--adr-wc-*, var(--color-*, fallback))
 *
 * MADR-format Architectural Decision Record card.
 * Sibling to user-story and work-item in the UX Planning Pack.
 */
const styles = `
:host {
  --_bg:        var(--adr-wc-bg, var(--color-surface, #ffffff));
  --_text:      var(--adr-wc-text, var(--color-text, #1a1a1a));
  --_muted:     var(--adr-wc-muted, var(--color-text-muted, #666));
  --_border:    var(--adr-wc-border, var(--color-border, #e0e0e0));
  --_accent:    var(--adr-wc-accent, var(--color-interactive, #0066cc));
  --_card-bg:   var(--adr-wc-card-bg, var(--color-surface-raised, #f8f9fa));
  --_highlight: var(--adr-wc-highlight, color-mix(in srgb, var(--_accent) 8%, transparent));
  --_radius:    var(--adr-wc-radius, var(--radius-l, 0.75rem));
  --_shadow:       var(--adr-wc-shadow, var(--shadow-sm));
  --_shadow-hover: var(--adr-wc-shadow-hover, var(--shadow-md));
  --_duration:     var(--adr-wc-duration, var(--duration-normal, 200ms));
  --_ease:         var(--adr-wc-ease, var(--ease-default, ease));
  --_space-2xs:    var(--adr-wc-space-2xs, var(--size-2xs, 0.25rem));
  --_space-xs:     var(--adr-wc-space-xs, var(--size-xs, 0.5rem));
  --_space-s:      var(--adr-wc-space-s, var(--size-s, 0.75rem));
  --_space-m:      var(--adr-wc-space-m, var(--size-m, 1rem));
  --_font-xs:      var(--adr-wc-font-xs, var(--font-size-xs, 0.75rem));
  --_font-sm:      var(--adr-wc-font-sm, var(--font-size-sm, 0.875rem));
  --_font-md:      var(--adr-wc-font-md, var(--font-size-md, 1rem));
  --_font-lg:      var(--adr-wc-font-lg, var(--font-size-lg, 1.125rem));
  --_font-mono:    var(--adr-wc-font-mono, var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace));
  --_radius-s:     var(--adr-wc-radius-s, var(--radius-s, 0.25rem));
  --_radius-full:  var(--adr-wc-radius-full, var(--radius-full, 9999px));

  display: block;
  font-family: var(--adr-wc-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
}

*, *::before, *::after { box-sizing: border-box; margin: 0; }

/* ── Card ──────────────────────────────────────────── */
.adr-card {
  background: var(--_bg);
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  overflow: hidden;
  box-shadow: var(--_shadow);
  transition: box-shadow var(--_duration) var(--_ease);
}

.adr-card:hover {
  box-shadow: var(--_shadow-hover);
}

/* ── Header ────────────────────────────────────────── */
.adr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--_space-s) var(--_space-m);
  background: var(--_card-bg);
  border-block-end: 1px solid var(--_border);
  gap: var(--_space-s);
  flex-wrap: wrap;
}

.adr-meta {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  flex-wrap: wrap;
  min-width: 0;
}

.adr-id {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  font-family: var(--_font-mono);
}

/* ── Status badge ──────────────────────────────────── */
.adr-badges {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
}

.adr-status {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: var(--_radius-full);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ── Date (slotted <time>) ─────────────────────────── */
.adr-date-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--_font-xs);
  color: var(--_muted);
}

.adr-date-wrap svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

::slotted([slot="date"]) {
  font-size: var(--_font-xs);
  font-family: var(--_font-mono);
  color: var(--_muted);
}

/* ── Body ──────────────────────────────────────────── */
.adr-body {
  padding: 16px 20px;
}

/* ── Title (slotted heading) ───────────────────────── */
.adr-title-wrap {
  margin-block-end: 0;
}

::slotted([slot="title"]) {
  font-size: var(--_font-lg) !important;
  font-weight: 700 !important;
  color: var(--_text) !important;
  line-height: 1.4 !important;
  margin: 0 !important;
}

/* Fallback title when no slot content */
.adr-title-fallback {
  font-size: var(--_font-lg);
  font-weight: 700;
  color: var(--_text);
  line-height: 1.4;
}

/* ── Supersedes / Superseded-by links ──────────────── */
.adr-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-block-start: var(--_space-s);
}

.adr-links-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--_muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-inline-end: var(--_space-2xs);
  align-self: center;
}

.adr-link {
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

.adr-link:hover {
  text-decoration: underline;
}

.adr-link svg {
  width: 11px;
  height: 11px;
}

/* ── Sections ──────────────────────────────────────── */
.adr-sections {
  border-block-start: 1px solid var(--_border);
}

.adr-section {
  padding: 14px 20px;
  border-block-end: 1px solid var(--_border);
}

.adr-section:last-child {
  border-block-end: none;
}

.adr-section-header {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  margin-block-end: var(--_space-s);
}

.adr-section-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.adr-section-icon svg {
  width: 13px;
  height: 13px;
  fill: var(--color-text-inverted, #fff);
}

.adr-section-icon.context      { background: var(--color-accent,  #8b5cf6); }
.adr-section-icon.decision     { background: var(--color-success, #22c55e); }
.adr-section-icon.consequences { background: var(--color-warning, #f59e0b); }

.adr-section-title {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.adr-section-content {
  color: var(--_text);
  font-size: var(--_font-sm);
  line-height: 1.6;
}

.adr-section-content ::slotted(ul),
.adr-section-content ::slotted(ol) {
  margin: 0;
  padding-inline-start: 20px;
}

.adr-section-content ::slotted(p) {
  margin: 0;
}

.slot-fallback {
  color: var(--_muted);
  font-style: italic;
}

/* ── Minimal detail ────────────────────────────────── */
.adr-card--minimal {
  padding: var(--_space-xs);
  cursor: pointer;
}

.adr-card--minimal:hover {
  box-shadow: var(--_shadow-hover);
}

.adr-card--minimal:focus-visible {
  outline: 2px solid var(--_accent);
  outline-offset: 2px;
}

.adr-card--minimal .adr-header { display: none; }
.adr-card--minimal .adr-sections { display: none; }
.adr-card--minimal .adr-links { display: none; }
.adr-card--minimal .adr-date-wrap { display: none; }

.adr-card--minimal .adr-body {
  padding: var(--_space-xs) var(--_space-s);
}

.adr-card--minimal .adr-title-fallback,
.adr-card--minimal ::slotted([slot="title"]) {
  font-size: var(--_font-sm) !important;
  font-weight: 600 !important;
}

.adr-card--minimal .adr-id {
  display: block;
  margin-block-end: var(--_space-2xs);
}

.adr-card--minimal .adr-status {
  font-size: 10px;
  padding: 2px 6px;
}

/* ── Compact detail — hide empty sections ──────────── */
.adr-card--compact .adr-section[data-empty] {
  display: none;
}

.adr-card--compact .slot-fallback {
  display: none;
}

.adr-card--compact .adr-body {
  padding: var(--_space-s) var(--_space-m);
}

/* ── Responsive ────────────────────────────────────── */
@media (max-width: 480px) {
  .adr-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .adr-badges {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .adr-card {
    transition: none;
  }
}

@media print {
  .adr-card {
    box-shadow: none;
    break-inside: avoid;
  }
}

.state-msg        { padding: var(--_space-m); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
.state-msg--error { color: var(--color-error-text, var(--color-error, #dc2626)); }
`;

export { styles };
