var m=`
  :host {
    display: block;
    font-family: var(--_font-sans);
    line-height: 1.6;
    color: var(--_text);
    container-type: inline-size;

    --_bg:     var(--empathy-map-bg, var(--color-surface, #ffffff));
    --_card:   var(--empathy-map-card, var(--color-surface-raised, #f8f9fa));
    --_border: var(--empathy-map-border, var(--color-border, #e0e0e0));
    --_muted:  var(--empathy-map-muted, var(--color-text-muted, #666666));
    --_text:   var(--empathy-map-text, var(--color-text, #1a1a1a));
    --_radius: var(--empathy-map-radius, var(--radius-xl, 1rem));
    --_accent: var(--empathy-map-accent, var(--color-interactive, #0066cc));
    --_says:   var(--empathy-map-says, #3b82f6);
    --_thinks: var(--empathy-map-thinks, #8b5cf6);
    --_does:   var(--empathy-map-does, #f59e0b);
    --_feels:  var(--empathy-map-feels, #ef4444);
    --_font-sans:    var(--empathy-map-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_font-xs:      var(--empathy-map-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:      var(--empathy-map-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:      var(--empathy-map-font-md, var(--font-size-md, 1rem));
    --_font-xl:      var(--empathy-map-font-xl, var(--font-size-xl, 1.25rem));
    --_space-2xs:    var(--empathy-map-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:     var(--empathy-map-space-xs, var(--size-xs, 0.5rem));
    --_space-s:      var(--empathy-map-space-s, var(--size-s, 0.75rem));
    --_space-m:      var(--empathy-map-space-m, var(--size-m, 1rem));
    --_space-l:      var(--empathy-map-space-l, var(--size-l, 1.5rem));
    --_radius-m:     var(--empathy-map-radius-m, var(--radius-m, 0.5rem));
    --_radius-full:  var(--empathy-map-radius-full, var(--radius-full, 9999px));
    --_duration:     var(--empathy-map-duration, var(--duration-normal, 200ms));
    --_duration-fast: var(--empathy-map-duration-fast, var(--duration-fast, 100ms));
    --_ease:         var(--empathy-map-ease, var(--ease-default, ease));
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  /* \u2500\u2500 Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map {
    background: var(--_card);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    overflow: hidden;
  }

  /* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__header {
    padding: 20px 24px 16px 28px;
    border-block-end: 1px solid var(--_border);
    position: relative;
  }

  /* Left accent bar */
  .empathy-map__header::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 4px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  .empathy-map__header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--_space-s);
    flex-wrap: wrap;
    margin-block-end: var(--_space-xs);
  }

  .empathy-map__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  /* \u2500\u2500 Chips \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .chip {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 2px 9px;
    border-radius: var(--_radius-full);
    text-decoration: none;
    line-height: 1.6;
  }

  .chip--type {
    color: #6366f1;
    background: #ede9fe;
  }

  @media (prefers-color-scheme: dark) {
    .chip--type { color: #a78bfa; background: #2e1065; }
  }

  /* \u2500\u2500 Persona ref \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

  .persona-ref svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  a.persona-ref:hover { color: #6366f1; text-decoration: underline; }

  /* \u2500\u2500 Title & summary \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__title {
    font-size: var(--_font-xl);
    font-weight: 700;
    color: var(--_text);
    margin-block-end: var(--_space-2xs);
  }

  .empathy-map__summary {
    font-size: var(--_font-sm);
    color: var(--_muted);
    max-width: 72ch;
  }

  /* \u2500\u2500 Grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--_border);
  }

  /* \u2500\u2500 Quadrant \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant {
    background: var(--_card);
    padding: 0;
    position: relative;
    display: grid;
  }

  .quadrant::before {
    content: '';
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    height: 3px;
  }

  .quadrant--says::before   { background: var(--_says); }
  .quadrant--thinks::before { background: var(--_thinks); }
  .quadrant--does::before   { background: var(--_does); }
  .quadrant--feels::before  { background: var(--_feels); }

  .quadrant__inner {
    display: grid;
    padding: 16px 20px;
    padding-block-start: 19px; /* 16 + 3px top border */
  }

  /* \u2500\u2500 Quadrant header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-block-end: var(--_space-s);
  }

  .quadrant__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--_radius-m);
    flex-shrink: 0;
  }

  .quadrant__icon svg {
    width: 16px;
    height: 16px;
  }

  .quadrant--says   .quadrant__icon { background: #dbeafe; color: var(--_says); }
  .quadrant--thinks .quadrant__icon { background: #ede9fe; color: var(--_thinks); }
  .quadrant--does   .quadrant__icon { background: #fef3c7; color: var(--_does); }
  .quadrant--feels  .quadrant__icon { background: #fee2e2; color: var(--_feels); }

  @media (prefers-color-scheme: dark) {
    .quadrant--says   .quadrant__icon { background: #1e3a5f; }
    .quadrant--thinks .quadrant__icon { background: #2e1065; }
    .quadrant--does   .quadrant__icon { background: #451a03; }
    .quadrant--feels  .quadrant__icon { background: #450a0a; }
  }

  .quadrant__label {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--_muted);
    flex: 1;
  }

  /* \u2500\u2500 Quadrant content / faces \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__face {
    grid-area: 1 / 1;
    transition: opacity var(--_duration) var(--_ease), transform var(--_duration) var(--_ease);
  }

  .quadrant__face--front {
    opacity: 1;
    transform: scale(1);
  }

  .quadrant__face--back {
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
  }

  [data-editing] .quadrant__face--front {
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
  }

  [data-editing] .quadrant__face--back {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  .quadrant__content {
    font-size: 14px;
    line-height: 1.55;
    color: var(--_text);
  }

  .quadrant__content p {
    margin-block: 0 6px;
  }

  .quadrant__content p:last-child {
    margin-block-end: 0;
  }

  /* \u2500\u2500 Slot fallback / placeholder \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .placeholder {
    font-size: 13px;
    color: var(--_muted);
    font-style: italic;
  }

  ::slotted(ul),
  ::slotted(ol) {
    margin: 0;
    padding-inline-start: 1.4em;
    font-size: 14px;
    line-height: 1.55;
  }

  /* \u2500\u2500 Emotion tags \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .emotion-tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: var(--_radius-full);
    margin-block-end: 6px;
    margin-inline-end: 4px;
    background: color-mix(in srgb, var(--ec, #94a3b8) 15%, transparent);
    color: var(--ec, #94a3b8);
    border: 1px solid color-mix(in srgb, var(--ec, #94a3b8) 30%, transparent);
  }

  /* \u2500\u2500 Edit / Done buttons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__edit-btn,
  .quadrant__done-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--_border);
    border-radius: 6px;
    background: var(--_bg);
    color: var(--_muted);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    flex-shrink: 0;
    transition: background var(--_duration-fast) var(--_ease), color var(--_duration-fast) var(--_ease);
  }

  .quadrant__edit-btn svg,
  .quadrant__done-btn svg {
    width: 14px;
    height: 14px;
  }

  .quadrant__edit-btn:hover,
  .quadrant__done-btn:hover {
    background: var(--_border);
    color: var(--_text);
  }

  .quadrant__done-btn {
    margin-block-start: 8px;
    width: auto;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 600;
    gap: 4px;
  }

  /* \u2500\u2500 Editor textarea \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__editor {
    width: 100%;
    min-height: 100px;
    padding: 10px 12px;
    border: 1px solid var(--_border);
    border-radius: var(--_radius-m);
    font-family: inherit;
    font-size: 13px;
    line-height: 1.55;
    color: var(--_text);
    background: var(--_bg);
    resize: vertical;
  }

  .quadrant__editor:focus {
    outline: 2px solid var(--_accent);
    outline-offset: -1px;
    border-color: var(--_accent);
  }

  /* \u2500\u2500 Footer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__footer {
    display: flex;
    gap: 1px;
    background: var(--_border);
    border-block-start: 1px solid var(--_border);
  }

  .summary-row {
    flex: 1;
    background: var(--_card);
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .summary-row__icon {
    line-height: 1;
    flex-shrink: 0;
    margin-block-start: 2px;
    color: var(--_muted);
  }

  .summary-row__icon svg {
    width: 18px;
    height: 18px;
  }

  .summary-row__body {
    flex: 1;
    min-width: 0;
  }

  .summary-row__label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--_muted);
    margin-block-end: 4px;
  }

  .summary-row__content {
    font-size: 14px;
    line-height: 1.55;
    color: var(--_text);
  }

  .summary-row__content p {
    margin-block: 0 4px;
  }

  .summary-row__content p:last-child {
    margin-block-end: 0;
  }

  /* \u2500\u2500 Compact variant \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([compact]) .empathy-map__header {
    padding: 14px 18px 12px 22px;
  }

  :host([compact]) .empathy-map__title {
    font-size: 16px;
  }

  :host([compact]) .empathy-map__summary {
    font-size: 12px;
  }

  :host([compact]) .quadrant__inner {
    padding: 12px 14px;
    padding-block-start: 15px;
  }

  :host([compact]) .quadrant__icon {
    width: 26px;
    height: 26px;
    font-size: 13px;
    border-radius: 6px;
  }

  :host([compact]) .quadrant__label {
    font-size: 11px;
  }

  :host([compact]) .quadrant__content {
    font-size: 12px;
  }

  :host([compact]) .summary-row {
    padding: 12px 14px;
  }

  :host([compact]) .summary-row__content {
    font-size: 12px;
  }

  /* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @container (max-width: 500px) {
    .empathy-map__grid {
      grid-template-columns: 1fr;
    }

    .empathy-map__header {
      padding: 14px 16px 12px 20px;
    }

    .empathy-map__title {
      font-size: 17px;
    }

    .empathy-map__footer {
      flex-direction: column;
    }
  }

  /* \u2500\u2500 Motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media (prefers-reduced-motion: reduce) {
    .quadrant__face {
      transition: none;
    }

    .quadrant__edit-btn,
    .quadrant__done-btn {
      transition: none;
    }
  }

  /* \u2500\u2500 Print \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media print {
    .empathy-map {
      break-inside: avoid;
      border-color: #ccc;
    }

    .quadrant__edit-btn,
    .quadrant__done-btn {
      display: none;
    }

    .quadrant__face--back {
      display: none;
    }

    .empathy-map__footer {
      flex-direction: column;
    }
  }

  /* \u2500\u2500 Utility \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .state-msg        { padding: var(--_space-l); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
  .state-msg--error { color: #dc2626; }
  code { font-family: Monaco, Menlo, monospace; font-size: 0.88em; }
`;var k=window.matchMedia("(prefers-reduced-motion: reduce)");var v=new Map;function y(d,e,t={}){let a=t.priority??10,n={impl:e,bundle:t.bundle,contract:t.contract,priority:a},r=v.get(d);if(customElements.get(d)){if(!r||r.priority>=a){r&&r.priority===a&&r.impl!==e&&console.warn(`[VB Bundle] Tag <${d}> already registered by "${r.bundle}" (priority ${r.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${d}> defined by "${r.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(r&&r.priority>=a){r.priority===a&&console.warn(`[VB Bundle] Tag <${d}> already registered by "${r.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}v.set(d,n),customElements.define(d,e)}function i(d){return String(d).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function p(d){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`}var l={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>'},_={says:{label:"Says",icon:l.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:l.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:l.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:l.heart,color:"#ef4444"}},x={delighted:{emoji:"\u{1F604}",score:.95,color:"#16a34a"},satisfied:{emoji:"\u{1F60A}",score:.8,color:"#22c55e"},hopeful:{emoji:"\u{1F642}",score:.68,color:"#84cc16"},curious:{emoji:"\u{1F914}",score:.55,color:"#eab308"},neutral:{emoji:"\u{1F610}",score:.5,color:"#94a3b8"},uncertain:{emoji:"\u{1F615}",score:.4,color:"#f97316"},confused:{emoji:"\u{1F635}",score:.3,color:"#fb923c"},frustrated:{emoji:"\u{1F624}",score:.18,color:"#ef4444"},angry:{emoji:"\u{1F620}",score:.05,color:"#dc2626"}};var h=["says","thinks","does","feels"],f=class extends HTMLElement{static get observedAttributes(){return["title","persona","persona-id","summary","src","editable","compact"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__quadrants=null,this.__goals=null,this.__painPoints=null,this._editingQuadrants=new Set}get quadrants(){return this.__quadrants}set quadrants(e){this.__quadrants=e,this.isConnected&&this._render()}get goals(){return this.__goals}set goals(e){this.__goals=e,this.isConnected&&this._render()}get painPoints(){return this.__painPoints}set painPoints(e){this.__painPoints=e,this.isConnected&&this._render()}#t(){for(let e of this.children){let t=e.getAttribute("slot");t&&this.#e.set(t,e.textContent.trim())}}_resolve(e){return this.getAttribute(e)||this.#e.get(e)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(e){this.isConnected&&(e==="src"?this._loadSrc(this.getAttribute("src")):this._render())}editQuadrant(e){h.includes(e)&&this.hasAttribute("editable")&&this._openEdit(e)}closeQuadrant(e){h.includes(e)&&this._closeEdit(e)}async _loadSrc(e){if(e){this.shadowRoot.innerHTML=`<style>${m}</style><div class="state-msg">Loading\u2026</div>`;try{let t=await fetch(e);if(!t.ok)throw new Error(`HTTP ${t.status}`);let a=await t.json();a.title&&this.setAttribute("title",a.title),a.persona&&this.setAttribute("persona",a.persona),a.personaId&&this.setAttribute("persona-id",a.personaId),a.summary&&this.setAttribute("summary",a.summary),this.__quadrants=a.quadrants||null,this.__goals=a.goals||null,this.__painPoints=a.painPoints||null,this._render()}catch(t){this.shadowRoot.innerHTML=`<style>${m}</style><div class="state-msg state-msg--error">Could not load empathy map: ${i(t.message)}</div>`}}}_render(){let e=this._resolve("title")||"Empathy Map",t=this._resolve("persona")||"",a=this._resolve("persona-id")||"",n=this._resolve("summary")||"",r=this.hasAttribute("compact"),s=this.hasAttribute("editable"),c=this.__goals?.length||this.querySelector('[slot="goals"]'),o=this.__painPoints?.length||this.querySelector('[slot="pain-points"]');this.shadowRoot.innerHTML=`<style>${m}</style>
      <article class="empathy-map${r?" empathy-map--compact":""}">

        <header class="empathy-map__header">
          <div class="empathy-map__header-top">
            <div class="empathy-map__chips">
              <span class="chip chip--type">Empathy Map</span>
            </div>
            ${t?`
              <div class="empathy-map__persona">
                ${a?`<a class="persona-ref" href="#${i(a)}">${p(l.user)} ${i(t)}</a>`:`<span class="persona-ref">${p(l.user)} ${i(t)}</span>`}
              </div>`:""}
          </div>
          <h2 class="empathy-map__title">${i(e)}</h2>
          ${n?`<p class="empathy-map__summary">${i(n)}</p>`:""}
        </header>

        <div class="empathy-map__grid">
          ${h.map(u=>this._renderQuadrant(u,s)).join("")}
        </div>

        ${c||o?`
          <footer class="empathy-map__footer">
            ${this._renderSummaryRow("goals",p(l.target),"Goals")}
            ${this._renderSummaryRow("pain-points",p(l.alertTriangle),"Pain Points")}
          </footer>
        `:""}

      </article>`,s&&this._bindEditListeners(),this.dispatchEvent(new CustomEvent("empathy-map:ready",{bubbles:!0,composed:!0,detail:{title:e,persona:t}}))}_renderQuadrant(e,t){let a=_[e],n=this.__quadrants?.[e],r=this._editingQuadrants.has(e),s=n&&n.length?e==="feels"?n.map(o=>this._renderEmotion(o)).join(""):n.map(o=>`<p>${i(o)}</p>`).join(""):`<slot name="${e}"><p class="placeholder">Add ${a.label.toLowerCase()} items\u2026</p></slot>`,c=n?.length?n.join(`
`):"";return`
      <section class="quadrant quadrant--${e}"${r?" data-editing":""}>
        <div class="quadrant__inner">
          <div class="quadrant__header">
            <div class="quadrant__icon" aria-hidden="true">${p(a.icon)}</div>
            <span class="quadrant__label">${a.label}</span>
            ${t?`<button class="quadrant__edit-btn" data-quadrant="${e}"
              aria-label="Edit ${a.label}" title="Edit ${a.label}">${p(l.pencil)}</button>`:""}
          </div>
          <div class="quadrant__faces">
            <div class="quadrant__face quadrant__face--front"${r?" inert":""}>
              <div class="quadrant__content">
                ${s}
              </div>
            </div>
            ${t?`
              <div class="quadrant__face quadrant__face--back"${r?"":" inert"}>
                <textarea class="quadrant__editor" data-quadrant="${e}"
                  placeholder="One item per line\u2026"
                  aria-label="Edit ${a.label} items">${i(c)}</textarea>
                <button class="quadrant__done-btn" data-quadrant="${e}"
                  aria-label="Done editing ${a.label}">${p(l.check)} Done</button>
              </div>
            `:""}
          </div>
        </div>
      </section>`}_renderEmotion(e){let t=e.toLowerCase().trim(),a=x[t];return a?`<span class="emotion-tag" style="--ec:${a.color}"><span role="img" aria-label="${i(e)}">${a.emoji}</span> ${i(e)}</span>`:`<p>${i(e)}</p>`}_renderSummaryRow(e,t,a){let r=(e==="pain-points"?"painPoints":e)==="painPoints"?this.__painPoints:this.__goals,s=r?.length?r.map(c=>`<p>${i(c)}</p>`).join(""):`<slot name="${e}"><p class="placeholder">No ${a.toLowerCase()} specified.</p></slot>`;return`
      <div class="summary-row">
        <span class="summary-row__icon" aria-hidden="true">${t}</span>
        <div class="summary-row__body">
          <div class="summary-row__label">${a}</div>
          <div class="summary-row__content">${s}</div>
        </div>
      </div>`}_bindEditListeners(){let e=this.shadowRoot;e.querySelectorAll(".quadrant__edit-btn").forEach(t=>{t.addEventListener("click",()=>{this._openEdit(t.dataset.quadrant)})}),e.querySelectorAll(".quadrant__done-btn").forEach(t=>{t.addEventListener("click",()=>{this._closeEdit(t.dataset.quadrant)})}),e.querySelectorAll(".quadrant__editor").forEach(t=>{t.addEventListener("keydown",a=>{a.key==="Escape"&&(a.preventDefault(),this._closeEdit(t.dataset.quadrant))})})}_openEdit(e){this._editingQuadrants.add(e);let t=this.shadowRoot.querySelector(`.quadrant--${e}`);if(!t)return;t.setAttribute("data-editing","");let a=t.querySelector(".quadrant__face--front"),n=t.querySelector(".quadrant__face--back");a&&a.setAttribute("inert",""),n&&n.removeAttribute("inert");let r=t.querySelector(".quadrant__editor");if(r){let s=this.__quadrants?.[e];if(s?.length)r.value=s.join(`
`);else{let c=t.querySelector(`slot[name="${e}"]`);if(c){let o=c.assignedElements();if(o.length){let u=[];o.forEach(b=>{let g=b.querySelectorAll("li");g.length?g.forEach(q=>u.push(q.textContent.trim())):u.push(b.textContent.trim())}),r.value=u.filter(Boolean).join(`
`)}}}r.focus()}}_closeEdit(e){let t=this.shadowRoot.querySelector(`.quadrant--${e}`);if(!t)return;let a=t.querySelector(".quadrant__editor");if(a){let s=a.value.split(`
`).map(o=>o.trim()).filter(Boolean);this.__quadrants||(this.__quadrants={}),this.__quadrants[e]=s;let c=t.querySelector(".quadrant__content");if(c)if(s.length)c.innerHTML=e==="feels"?s.map(o=>this._renderEmotion(o)).join(""):s.map(o=>`<p>${i(o)}</p>`).join("");else{let o=_[e];c.innerHTML=`<p class="placeholder">Add ${o.label.toLowerCase()} items\u2026</p>`}}this._editingQuadrants.delete(e),t.removeAttribute("data-editing");let n=t.querySelector(".quadrant__face--front"),r=t.querySelector(".quadrant__face--back");n&&n.removeAttribute("inert"),r&&r.setAttribute("inert",""),this.dispatchEvent(new CustomEvent("empathy-map:update",{bubbles:!0,composed:!0,detail:{quadrant:e,items:this.__quadrants?.[e]||[]}}))}};y("empathy-map",f);export{f as EmpathyMap};
//# sourceMappingURL=empathy-map.js.map
