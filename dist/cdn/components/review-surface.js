var v=`
  :host {
    display: block;
    position: relative;
    font-family: var(--_font-sans);
    line-height: 1.5;
    color: var(--_text);
    container-type: inline-size;

    --_bg:          var(--review-surface-bg, var(--color-surface, #ffffff));
    --_card:        var(--review-surface-card, var(--color-surface-raised, #f8f9fa));
    --_border:      var(--review-surface-border, var(--color-border, #e0e0e0));
    --_text:        var(--review-surface-text, var(--color-text, #1a1a1a));
    --_muted:       var(--review-surface-muted, var(--color-text-muted, #666666));
    --_accent:      var(--review-surface-accent, var(--color-interactive, #0066cc));
    --_pin-bg:      var(--review-surface-pin-bg, var(--color-interactive, #0066cc));
    --_pin-text:    var(--review-surface-pin-text, #ffffff);
    --_pin-size:    var(--review-surface-pin-size, 28px);
    --_resolved:    var(--review-surface-resolved, var(--color-success, #16a34a));
    --_radius:      var(--review-surface-radius, var(--radius-xl, 1rem));
    --_radius-m:    var(--review-surface-radius-m, var(--radius-m, 0.5rem));
    --_radius-full: var(--review-surface-radius-full, var(--radius-full, 9999px));
    --_font-sans:   var(--review-surface-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_font-xs:     var(--review-surface-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:     var(--review-surface-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:     var(--review-surface-font-md, var(--font-size-md, 1rem));
    --_space-2xs:   var(--review-surface-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:    var(--review-surface-space-xs, var(--size-xs, 0.5rem));
    --_space-s:     var(--review-surface-space-s, var(--size-s, 0.75rem));
    --_space-m:     var(--review-surface-space-m, var(--size-m, 1rem));
    --_space-l:     var(--review-surface-space-l, var(--size-l, 1.5rem));
    --_duration:    var(--review-surface-duration, var(--duration-normal, 200ms));
    --_duration-fast: var(--review-surface-duration-fast, var(--duration-fast, 100ms));
    --_ease:        var(--review-surface-ease, var(--ease-default, ease));
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  /* \u2500\u2500 Container \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-container {
    position: relative;
    display: grid;
  }

  .rs-container > ::slotted(*),
  .rs-container > .rs-overlay {
    grid-area: 1 / 1;
  }

  /* \u2500\u2500 Overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-overlay {
    position: relative;
    z-index: 10;
    pointer-events: none;
    cursor: default;
  }

  :host([data-annotating]) .rs-overlay {
    pointer-events: auto;
    cursor: crosshair;
  }

  /* \u2500\u2500 Pin markers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-pin {
    position: absolute;
    transform: translate(-50%, -50%);
    width: var(--_pin-size);
    height: var(--_pin-size);
    border-radius: var(--_radius-full);
    background: var(--_pin-bg);
    color: var(--_pin-text);
    border: 2px solid var(--_pin-text);
    font-size: var(--_font-xs);
    font-weight: 700;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    padding: 0;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: transform var(--_duration-fast) var(--_ease),
                box-shadow var(--_duration-fast) var(--_ease);
    z-index: 11;
  }

  .rs-pin:hover {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  }

  .rs-pin:focus-visible {
    outline: 2px solid var(--_accent);
    outline-offset: 2px;
  }

  .rs-pin[data-resolved] {
    background: var(--_resolved);
  }

  .rs-pin[data-active] {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--_pin-bg) 30%, transparent);
  }

  /* \u2500\u2500 Popover \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-popover {
    position: absolute;
    z-index: 20;
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-m);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 0;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity var(--_duration) var(--_ease), transform var(--_duration) var(--_ease);
    pointer-events: none;
  }

  .rs-popover[data-open] {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .rs-popover__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 8px;
    border-block-end: 1px solid var(--_border);
  }

  .rs-popover__title {
    font-size: var(--_font-sm);
    font-weight: 700;
    color: var(--_text);
  }

  .rs-popover__actions {
    display: flex;
    gap: 4px;
  }

  .rs-popover__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--_muted);
    cursor: pointer;
    padding: 0;
    transition: background var(--_duration-fast) var(--_ease), color var(--_duration-fast) var(--_ease);
  }

  .rs-popover__btn svg {
    width: 14px;
    height: 14px;
  }

  .rs-popover__btn:hover {
    background: var(--_border);
    color: var(--_text);
  }

  .rs-popover__btn--resolve {
    color: var(--_resolved);
  }

  .rs-popover__btn--resolve:hover {
    background: color-mix(in srgb, var(--_resolved) 15%, transparent);
  }

  .rs-popover__btn--delete {
    color: var(--color-error-text, var(--color-error, #dc2626));
  }

  .rs-popover__btn--delete:hover {
    background: color-mix(in oklch, var(--color-error, #dc2626) 8%, var(--_card));
    color: var(--color-error-text, var(--color-error, #dc2626));
  }

  /* \u2500\u2500 Comment thread \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-comment {
    padding: 10px 12px;
  }

  .rs-comment__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-block-end: 4px;
  }

  .rs-comment__avatar {
    width: 22px;
    height: 22px;
    border-radius: var(--_radius-full);
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-inverted, #fff);
    flex-shrink: 0;
  }

  .rs-comment__author {
    font-size: var(--_font-xs);
    font-weight: 600;
    color: var(--_text);
  }

  .rs-comment__time {
    font-size: 11px;
    color: var(--_muted);
  }

  .rs-comment__text {
    font-size: var(--_font-sm);
    color: var(--_text);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Replies */
  .rs-replies {
    border-block-start: 1px solid var(--_border);
  }

  .rs-reply {
    padding: 8px 12px;
    border-block-end: 1px solid color-mix(in srgb, var(--_border) 50%, transparent);
  }

  .rs-reply:last-child {
    border-block-end: none;
  }

  /* \u2500\u2500 Input area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-input {
    display: flex;
    gap: 6px;
    padding: 8px 12px;
    border-block-start: 1px solid var(--_border);
    background: var(--_card);
    border-radius: 0 0 var(--_radius-m) var(--_radius-m);
  }

  .rs-input__field {
    flex: 1;
    min-height: 32px;
    max-height: 80px;
    padding: 6px 10px;
    border: 1px solid var(--_border);
    border-radius: 6px;
    font-family: inherit;
    font-size: var(--_font-xs);
    line-height: 1.4;
    color: var(--_text);
    background: var(--_bg);
    resize: none;
  }

  .rs-input__field:focus {
    outline: 2px solid var(--_accent);
    outline-offset: -1px;
    border-color: var(--_accent);
  }

  .rs-input__field::placeholder {
    color: var(--_muted);
  }

  .rs-input__submit {
    align-self: flex-end;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: var(--_accent);
    color: var(--color-text-inverted, #fff);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background var(--_duration-fast) var(--_ease);
  }

  .rs-input__submit svg {
    width: 14px;
    height: 14px;
  }

  .rs-input__submit:hover {
    background: color-mix(in srgb, var(--_accent) 85%, #000);
  }

  .rs-input__submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* \u2500\u2500 Toolbar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-toolbar {
    display: flex;
    align-items: center;
    gap: var(--_space-xs);
    padding: var(--_space-xs) var(--_space-s);
    background: var(--_card);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-m);
    margin-block-start: var(--_space-xs);
  }

  .rs-toolbar__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: 1px solid var(--_border);
    border-radius: 6px;
    background: var(--_bg);
    color: var(--_text);
    font-family: inherit;
    font-size: var(--_font-xs);
    font-weight: 600;
    cursor: pointer;
    line-height: 1;
    transition: background var(--_duration-fast) var(--_ease),
                border-color var(--_duration-fast) var(--_ease);
  }

  .rs-toolbar__btn svg {
    width: 14px;
    height: 14px;
  }

  .rs-toolbar__btn:hover {
    background: var(--_border);
  }

  .rs-toolbar__btn[aria-pressed="true"] {
    background: var(--_accent);
    color: var(--color-text-inverted, #fff);
    border-color: var(--_accent);
  }

  .rs-toolbar__count {
    font-size: var(--_font-xs);
    color: var(--_muted);
    margin-inline-start: auto;
  }

  /* \u2500\u2500 Resolved badge \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-resolved-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--_resolved);
    padding: 2px 8px;
    border-radius: var(--_radius-full);
    background: color-mix(in srgb, var(--_resolved) 12%, transparent);
  }

  .rs-resolved-badge svg {
    width: 12px;
    height: 12px;
  }

  /* \u2500\u2500 Live region \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  /* \u2500\u2500 Compact \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([compact]) {
    --_pin-size: 22px;
  }

  :host([compact]) .rs-popover {
    width: 250px;
    max-height: 300px;
  }

  :host([compact]) .rs-toolbar {
    padding: 3px var(--_space-xs);
  }

  :host([compact]) .rs-toolbar__btn {
    font-size: 11px;
    padding: 3px 8px;
  }

  /* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @container (max-width: 400px) {
    .rs-popover {
      width: 240px;
    }

    .rs-toolbar {
      flex-wrap: wrap;
    }
  }

  /* \u2500\u2500 Motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media (prefers-reduced-motion: reduce) {
    .rs-pin,
    .rs-popover,
    .rs-toolbar__btn,
    .rs-popover__btn,
    .rs-input__submit {
      transition: none;
    }
  }

  /* \u2500\u2500 Print \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media print {
    .rs-overlay,
    .rs-toolbar,
    .rs-popover {
      display: none;
    }
  }

  /* \u2500\u2500 Utility \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .state-msg        { padding: var(--_space-l); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
  .state-msg--error { color: var(--color-error-text, var(--color-error, #dc2626)); }
`;var S=window.matchMedia("(prefers-reduced-motion: reduce)");var k=new Map;function $(a,e,t={}){let r=t.priority??10,s={impl:e,bundle:t.bundle,contract:t.contract,priority:r},o=k.get(a);if(customElements.get(a)){if(!o||o.priority>=r){o&&o.priority===r&&o.impl!==e&&console.warn(`[VB Bundle] Tag <${a}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${a}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=r){o.priority===r&&console.warn(`[VB Bundle] Tag <${a}> already registered by "${o.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}k.set(a,s),customElements.define(a,e)}function n(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function g(a){return a.split(" ").map(e=>e[0]).join("").toUpperCase().slice(0,2)}function y(a){let e=0;for(let r=0;r<a.length;r++)e=a.charCodeAt(r)+((e<<5)-e);return`hsl(${(e%360+360)%360}, 65%, 55%)`}function l(a){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a}</svg>`}var c={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',mapPin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>'},R={says:{label:"Says",icon:c.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:c.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:c.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:c.heart,color:"#ef4444"}};function P(){let a=globalThis.localStorage;if(!a)throw new Error("VBStore: localStorage is not available in this environment");return{async getRaw(e){return a.getItem(e)},async setRaw(e,t){a.setItem(e,t)},async removeRaw(e){a.removeItem(e)},async keys(e){let t=[];for(let r=0;r<a.length;r++){let s=a.key(r);s&&s.startsWith(e)&&t.push(s)}return t}}}var f=null;function p(){return f||(f=P()),f}function x(a,e){if(typeof a!="string"||!a)throw new TypeError("VBStore: namespace must be a non-empty string");if(typeof e!="string"||!e)throw new TypeError("VBStore: key must be a non-empty string");return`vb:${a}:${e}`}function E(a){if(typeof a!="string"||!a)throw new TypeError("VBStore: namespace must be a non-empty string");return`vb:${a}:`}function A(a){try{let e=JSON.parse(a);if(e&&typeof e=="object"&&typeof e.timestamp=="number")return e}catch{}return null}var _={configure(a={}){f=a.backend??null},async set(a,e,t){let r={data:t,timestamp:Date.now()};await p().setRaw(x(a,e),JSON.stringify(r))},async get(a,e,t){let r=await p().getRaw(x(a,e));if(r==null)return null;let s=A(r);return!s||t?.maxAge!=null&&Date.now()-s.timestamp>t.maxAge?null:s.data},async remove(a,e){await p().removeRaw(x(a,e))},async list(a){let e=E(a),t=await p().keys(e),r=[];for(let s of t){let o=await p().getRaw(s);if(o==null)continue;let i=A(o);i&&r.push({key:s.slice(e.length),data:i.data,timestamp:i.timestamp})}return r},async clear(a){let e=E(a),t=await p().keys(e);for(let r of t)await p().removeRaw(r)},async clearAll(){let a=await p().keys("vb:");for(let e of a)await p().removeRaw(e)},async setMany(a,e){for(let[t,r]of e)await _.set(a,t,r)}};var h=class{#e=new Map;async load(){return[...this.#e.values()]}async save(e){return e.id||(e.id=crypto.randomUUID()),this.#e.set(e.id,e),e}async update(e,t){let r=this.#e.get(e);if(!r)throw new Error(`Pin ${e} not found`);return Object.assign(r,t),r}async remove(e){this.#e.delete(e)}},b=class{#e;constructor(e="default"){this.#e=e}async#r(){let e=await _.get("reviews",this.#e);return Array.isArray(e)?e:[]}async#a(e){await _.set("reviews",this.#e,e)}async load(){return this.#r()}async save(e){e.id||(e.id=crypto.randomUUID());let t=await this.#r();return t.push(e),await this.#a(t),e}async update(e,t){let r=await this.#r(),s=r.findIndex(o=>o.id===e);if(s===-1)throw new Error(`Pin ${e} not found`);return Object.assign(r[s],t),await this.#a(r),r[s]}async remove(e){let t=(await this.#r()).filter(r=>r.id!==e);await this.#a(t)}},m=class{#e;constructor(e){if(!e)throw new Error("RestAdapter requires an endpoint URL");this.#e=e.replace(/\/$/,"")}async load(){let e=await fetch(this.#e);if(!e.ok)throw new Error(`HTTP ${e.status}`);let t=await e.json();return Array.isArray(t)?t:t.pins||[]}async save(e){let t=await fetch(this.#e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP ${t.status}`);return t.json()}async update(e,t){let r=await fetch(`${this.#e}/${encodeURIComponent(e)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}async remove(e){let t=await fetch(`${this.#e}/${encodeURIComponent(e)}`,{method:"DELETE"});if(!t.ok)throw new Error(`HTTP ${t.status}`)}},w=class extends HTMLElement{static get observedAttributes(){return["src","editable","adapter","endpoint","storage-key","author","compact","show-resolved"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__pins=[],this.__adapter=null,this._activePin=null,this._annotating=!1}get pins(){return this.__pins}set pins(e){let t=Array.isArray(e)?e:[];this.__pins!==t&&(this.__pins=t,this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("review-surface:pins-changed",{detail:{pins:t,source:"property"},bubbles:!0,composed:!0})))}get adapter(){return this.__adapter}set adapter(e){this.__adapter=e,this.isConnected&&this._loadFromAdapter()}#r(){for(let e of this.children){let t=e.getAttribute("slot");t&&this.#e.set(t,e.textContent.trim())}}_resolve(e){return this.getAttribute(e)||this.#e.get(e)||""}connectedCallback(){this.#r(),this.setAttribute("data-upgraded",""),this.#a(),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._loadFromAdapter()}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.removeAttribute("data-annotating")}attributeChangedCallback(e){this.isConnected&&(e==="src"?this._loadSrc(this.getAttribute("src")):e==="adapter"||e==="endpoint"||e==="storage-key"?(this.#a(),this._loadFromAdapter()):this._render())}#a(){if(this.__adapter&&!(this.__adapter instanceof h)&&!(this.__adapter instanceof b)&&!(this.__adapter instanceof m))return;switch(this.getAttribute("adapter")||"memory"){case"local":this.__adapter=new b(this.getAttribute("storage-key")||"default");break;case"rest":try{this.__adapter=new m(this.getAttribute("endpoint"))}catch{this.__adapter=new h}break;default:this.__adapter=new h}}async _loadSrc(e){if(e){this.shadowRoot.innerHTML=`<style>${v}</style><div class="state-msg">Loading\u2026</div>`;try{let t=await fetch(e);if(!t.ok)throw new Error(`HTTP ${t.status}`);let r=await t.json();this.__pins=Array.isArray(r)?r:r.pins||[],this._render()}catch(t){this.shadowRoot.innerHTML=`<style>${v}</style><div class="state-msg state-msg--error">Could not load pins: ${n(t.message)}</div>`}}}async _loadFromAdapter(){if(this.__adapter){try{this.__pins=await this.__adapter.load()}catch{this.__pins=[]}this._render()}}async addPin(e){let t={id:crypto.randomUUID(),x:Math.max(0,Math.min(100,e.x)),y:Math.max(0,Math.min(100,e.y)),text:e.text||"",author:e.author||this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString(),resolved:!1,resolvedBy:null,resolvedAt:null,replies:[]};return this.__adapter&&await this.__adapter.save(t),this.__pins.push(t),this._render(),this.#t(`Pin ${this.#s().length} added`),this.dispatchEvent(new CustomEvent("review-surface:add",{bubbles:!0,composed:!0,detail:{pin:t}})),t}async removePin(e){let t=this.__pins.find(r=>r.id===e);t&&(this.__adapter&&await this.__adapter.remove(e),this.__pins=this.__pins.filter(r=>r.id!==e),this._activePin===e&&(this._activePin=null),this._render(),this.#t("Pin removed"),this.dispatchEvent(new CustomEvent("review-surface:remove",{bubbles:!0,composed:!0,detail:{pin:t}})))}async resolvePin(e){let t=this.__pins.find(s=>s.id===e);if(!t)return;let r={resolved:!0,resolvedBy:this.getAttribute("author")||"Anonymous",resolvedAt:new Date().toISOString()};this.__adapter&&await this.__adapter.update(e,r),Object.assign(t,r),this._render(),this.#t("Pin resolved"),this.dispatchEvent(new CustomEvent("review-surface:resolve",{bubbles:!0,composed:!0,detail:{pin:t}}))}async unresolvePin(e){let t=this.__pins.find(s=>s.id===e);if(!t)return;let r={resolved:!1,resolvedBy:null,resolvedAt:null};this.__adapter&&await this.__adapter.update(e,r),Object.assign(t,r),this._render(),this.#t("Pin re-opened"),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:t,changes:r}}))}exportPins(){return structuredClone(this.__pins)}importPins(e){this.__pins=Array.isArray(e)?structuredClone(e):[],this._activePin=null,this._render()}#s(){let e=this.hasAttribute("show-resolved");return this.__pins.filter(t=>e||!t.resolved).sort((t,r)=>new Date(t.createdAt)-new Date(r.createdAt))}_render(){let e=this.hasAttribute("editable"),t=this.#s(),r=this._activePin?this.__pins.find(s=>s.id===this._activePin):null;this.setAttribute("pin-count",String(t.length)),this.shadowRoot.innerHTML=`<style>${v}</style>
      <div class="rs-container">
        <slot></slot>
        <div class="rs-overlay" role="img" aria-label="Review annotation surface">
          ${t.map((s,o)=>this._renderPin(s,o+1)).join("")}
        </div>
        ${r?this._renderPopover(r,e):""}
      </div>
      ${e?this._renderToolbar(t.length):""}
      <div class="rs-live" aria-live="polite" aria-atomic="true"></div>`,this._bindListeners(e),this.dispatchEvent(new CustomEvent("review-surface:ready",{bubbles:!0,composed:!0,detail:{pinCount:t.length}}))}_renderPin(e,t){let r=e.text?e.text.slice(0,50):"Empty pin";return`<button class="rs-pin"
      data-pin-id="${n(e.id)}"
      ${e.resolved?"data-resolved":""}
      ${this._activePin===e.id?"data-active":""}
      style="left:${e.x}%;top:${e.y}%"
      aria-label="Pin ${t}: ${n(r)}"
      aria-expanded="${this._activePin===e.id}"
      aria-haspopup="dialog">
      <span class="rs-pin__number">${t}</span>
    </button>`}_renderPopover(e,t){let r=this.#s().findIndex(s=>s.id===e.id)+1;return`<div class="rs-popover" data-open
      style="left:${Math.min(e.x,70)}%;top:${e.y}%"
      role="dialog"
      aria-labelledby="rs-popover-title-${n(e.id)}">

      <div class="rs-popover__header">
        <span class="rs-popover__title" id="rs-popover-title-${n(e.id)}">
          Pin ${r}
          ${e.resolved?`<span class="rs-resolved-badge">${l(c.checkCircle)} Resolved</span>`:""}
        </span>
        <div class="rs-popover__actions">
          ${t&&!e.resolved?`
            <button class="rs-popover__btn rs-popover__btn--resolve" data-action="resolve" data-pin-id="${n(e.id)}"
              aria-label="Resolve pin" title="Resolve">${l(c.checkCircle)}</button>`:""}
          ${t&&e.resolved?`
            <button class="rs-popover__btn" data-action="unresolve" data-pin-id="${n(e.id)}"
              aria-label="Re-open pin" title="Re-open">${l(c.messageCircle)}</button>`:""}
          ${t?`
            <button class="rs-popover__btn rs-popover__btn--delete" data-action="delete" data-pin-id="${n(e.id)}"
              aria-label="Delete pin" title="Delete">${l(c.x)}</button>`:""}
          <button class="rs-popover__btn" data-action="close"
            aria-label="Close">${l(c.x)}</button>
        </div>
      </div>

      <div class="rs-comment">
        <div class="rs-comment__meta">
          <span class="rs-comment__avatar" style="background:${y(e.author||"Anonymous")}">${g(e.author||"Anonymous")}</span>
          <span class="rs-comment__author">${n(e.author||"Anonymous")}</span>
          <span class="rs-comment__time">${this.#i(e.createdAt)}</span>
        </div>
        <div class="rs-comment__text">${n(e.text)}</div>
      </div>

      ${e.replies?.length?`
        <div class="rs-replies">
          ${e.replies.map(s=>`
            <div class="rs-reply">
              <div class="rs-comment__meta">
                <span class="rs-comment__avatar" style="background:${y(s.author||"Anonymous")}">${g(s.author||"Anonymous")}</span>
                <span class="rs-comment__author">${n(s.author||"Anonymous")}</span>
                <span class="rs-comment__time">${this.#i(s.createdAt)}</span>
              </div>
              <div class="rs-comment__text">${n(s.text)}</div>
            </div>
          `).join("")}
        </div>`:""}

      ${t?`
        <div class="rs-input">
          <textarea class="rs-input__field" placeholder="Reply\u2026" rows="1"
            aria-label="Reply to pin ${r}"></textarea>
          <button class="rs-input__submit" data-action="reply" data-pin-id="${n(e.id)}"
            aria-label="Send reply">${l(c.send)}</button>
        </div>`:""}

    </div>`}_renderToolbar(e){return`<div class="rs-toolbar" role="toolbar" aria-label="Review tools">
      <button class="rs-toolbar__btn" data-action="toggle-mode"
        aria-pressed="${this._annotating}"
        title="Toggle annotate mode">
        ${l(c.mapPin)} Annotate
      </button>
      <button class="rs-toolbar__btn" data-action="export"
        title="Export pins as JSON">
        ${l(c.download)} Export
      </button>
      <output class="rs-toolbar__count">${e} pin${e!==1?"s":""}</output>
    </div>`}_bindListeners(e){let t=this.shadowRoot;t.querySelectorAll(".rs-pin").forEach(o=>{o.addEventListener("click",i=>{i.stopPropagation();let d=o.dataset.pinId;this._activePin=this._activePin===d?null:d,this._render(),this._activePin&&this.dispatchEvent(new CustomEvent("review-surface:select",{bubbles:!0,composed:!0,detail:{pin:this.__pins.find(u=>u.id===d)}}))})});let r=t.querySelector(".rs-overlay");r&&e&&r.addEventListener("click",o=>{if(!this._annotating||o.target.closest(".rs-pin"))return;let i=r.getBoundingClientRect(),d=(o.clientX-i.left)/i.width*100,u=(o.clientY-i.top)/i.height*100;this.#n(d,u)}),t.querySelectorAll("[data-action]").forEach(o=>{o.addEventListener("click",i=>{i.stopPropagation();let d=o.dataset.action,u=o.dataset.pinId;switch(d){case"close":this._activePin=null,this._render();break;case"resolve":this.resolvePin(u);break;case"unresolve":this.unresolvePin(u);break;case"delete":this.removePin(u);break;case"toggle-mode":this._annotating=!this._annotating,this._annotating?this.setAttribute("data-annotating",""):this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:this._annotating?"annotate":"view"}}));break;case"export":this.#c();break;case"reply":this.#o(u);break}})});let s=t.querySelector(".rs-input__field");s&&s.addEventListener("keydown",o=>{if(o.key==="Enter"&&!o.shiftKey){o.preventDefault();let i=t.querySelector('[data-action="reply"]')?.dataset.pinId;i&&this.#o(i)}}),t.addEventListener("keydown",o=>{o.key==="Escape"&&(this._activePin?(this._activePin=null,this._render()):this._annotating&&(this._annotating=!1,this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:"view"}}))))})}async#n(e,t){let r=this.getAttribute("author")||"Anonymous",s=await this.addPin({x:e,y:t,text:"",author:r});this._activePin=s.id,this._render(),requestAnimationFrame(()=>{let o=this.shadowRoot.querySelector(".rs-input__field");o&&o.focus()})}async#o(e){let t=this.shadowRoot.querySelector(".rs-input__field");if(!t)return;let r=t.value.trim();if(!r)return;let s=this.__pins.find(i=>i.id===e);if(!s)return;let o={id:crypto.randomUUID(),text:r,author:this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString()};s.replies||(s.replies=[]),s.text?(s.replies.push(o),this.__adapter&&await this.__adapter.update(e,{replies:s.replies})):(s.text=r,this.__adapter&&await this.__adapter.update(e,{text:r})),this._render(),this.#t("Reply added"),requestAnimationFrame(()=>{let i=this.shadowRoot.querySelector(".rs-input__field");i&&i.focus()}),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:s,changes:{replies:s.replies}}}))}async#c(){let e=JSON.stringify(this.exportPins(),null,2);try{await navigator.clipboard.writeText(e),this.#t("Pins copied to clipboard")}catch{let t=new Blob([e],{type:"application/json"}),r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download="review-pins.json",s.click(),URL.revokeObjectURL(r),this.#t("Pins exported as file")}}#i(e){if(!e)return"";try{let t=new Date(e),s=new Date-t,o=Math.floor(s/6e4);if(o<1)return"just now";if(o<60)return`${o}m ago`;let i=Math.floor(o/60);if(i<24)return`${i}h ago`;let d=Math.floor(i/24);return d<7?`${d}d ago`:t.toLocaleDateString()}catch{return""}}#t(e){let t=this.shadowRoot.querySelector(".rs-live");t&&(t.textContent=e)}};$("review-surface",w);export{b as LocalStorageAdapter,h as MemoryAdapter,m as RestAdapter,w as ReviewSurface};
//# sourceMappingURL=review-surface.js.map
