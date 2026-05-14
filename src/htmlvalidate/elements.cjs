// @generated from api.json manifests — do not edit by hand
module.exports = {
  // ── Layout Custom Elements ──────────────────────────────────────

  "layout-text": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "layout-switcher": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-threshold": {},
      "data-gap": { enum: ["none", "xs", "s", "m", "l", "xl"] },
      "data-limit": { enum: ["2", "3", "4", "5"] }
    }
  },

  "layout-stack": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-align": { enum: ["start", "center", "end", "stretch"] }
    }
  },

  "layout-sidebar": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": { enum: ["xs", "s", "m", "l", "xl"] },
      "data-side": { enum: ["start", "end"] },
      "data-sidebar-width": { enum: ["narrow", "normal", "wide"] },
      "data-content-min": { enum: ["40", "50", "60"] },
      "data-nowrap": { boolean: true }
    }
  },

  "layout-reel": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": { enum: ["none", "xs", "s", "m", "l", "xl"] },
      "data-padding": { enum: ["none", "s", "m", "l"] },
      "data-item-width": { enum: ["auto", "s", "m", "l", "xl", "full"] },
      "data-align": { enum: ["start", "center", "end", "stretch"] },
      "data-scrollbar": { boolean: true }
    }
  },

  "layout-imposter": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-fixed": { boolean: true },
      "data-contain": { boolean: true }
    }
  },

  "layout-grid": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-min": {},
      "data-gap": { enum: ["none", "xs", "s", "m", "l", "xl"] }
    }
  },

  "layout-cover": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-min-block": {},
      "data-gap": { enum: ["none", "xs", "s", "m", "l", "xl"] },
      "data-npad": { boolean: true }
    }
  },

  "layout-cluster": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": { enum: ["xs", "s", "m", "l", "xl"] },
      "data-justify": { enum: ["start", "end", "center", "between"] },
      "data-align": { enum: ["start", "end", "center", "stretch", "baseline"] },
      "data-nowrap": { boolean: true }
    }
  },

  "layout-center": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-max": { enum: ["narrow", "normal", "wide"] },
      "data-intrinsic": { boolean: true },
      "data-text": { boolean: true },
      "data-gutter": { enum: ["none", "s", "l"] }
    }
  },

  "layout-card": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-variant": { enum: ["elevated", "outlined", "ghost"] },
      "data-padding": { enum: ["none", "s", "m", "l", "xl"] }
    }
  },

  "layout-badge": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "data-size": { enum: ["sm", "lg"] },
      "data-color": { enum: ["primary", "success", "warning", "danger", "info"] },
      "data-variant": {}
    }
  },

  "brand-mark": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-size": { enum: ["s", "l", "xl"] },
      "data-stack": { boolean: true }
    }
  },

  "dl-item": {
    flow: true,
    permittedContent: ["dt", "dd"]
  },

  "fab-stack": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-float": { enum: ["top-left", "top-center", "top-right", "center-left", "center-right", "bottom-left", "bottom-center", "bottom-right"] }
    }
  },

  "loading-spinner": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "data-size": { enum: ["xs", "s", "m", "l", "xl"] },
      "data-variant": {},
      "data-overlay": { boolean: true }
    }
  },

  "mobile-menu": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "breakpoint": {}
    }
  },

  "site-legal": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "site-tools": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "status-message": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "text-divider": {
    flow: true,
    permittedContent: ["@phrasing"]
  },

  "user-avatar": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "dl": {
    flow: true,
    permittedContent: ["@script", "dt", "dd", "div", "dl-item"]
  },

  "form-field": {
    attributes: {
      "data-valid": {},
      "data-invalid": {}
    }
  },

  // ── Web Components ──────────────────────────────────────────────

  "accordion-wc": {
    flow: true,
    permittedContent: ["details"],
    attributes: {
      "single": { boolean: true },
      "bordered": { boolean: true },
      "flush": { boolean: true },
      "compact": { boolean: true },
      "indicator": { enum: ["plus-minus", "none", "custom"] },
      "transition": { enum: ["fade", "slide", "scale"] }
    }
  },

  "activity-feed": {
    attributes: {
      "aria-label": {},
      "data-group": {},
      "data-infinite": { boolean: true },
      "data-empty-text": {},
      "role": {},
      "aria-busy": {}
    }
  },

  "adr-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "adr-id": {},
      "status": {},
      "supersedes": {},
      "superseded-by": {},
      "detail": {},
      "compact": { boolean: true },
      "src": {}
    }
  },

  "ai-chat": {
    flow: true,
    permittedContent: ["template", "@flow"],
    attributes: {
      "context": {},
      "context-label": {},
      "system": {},
      "placeholder": {},
      "endpoint": {},
      "fallback-url": {},
      "fallback-label": {},
      "fallback-prompt": {},
      "data-state": { enum: ["checking", "ready", "downloading", "streaming", "error", "unavailable"] }
    }
  },

  "ai-summary": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "type": { enum: ["key-points", "tldr", "teaser", "headline"] },
      "length": { enum: ["short", "medium", "long"] },
      "format": { enum: ["markdown", "plain-text"] },
      "shared-context": {},
      "endpoint": {},
      "fallback-url": {},
      "fallback-label": {},
      "fallback-prompt": {},
      "data-state": { enum: ["checking", "ready", "downloading", "streaming", "complete", "error", "unavailable", "deep-link"] }
    }
  },

  "analytics-panel": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "title": {},
      "compact": { boolean: true }
    }
  },

  "audio-player": {
    attributes: {
      "autoplay": { boolean: true },
      "loop": { boolean: true },
      "shuffle": { boolean: true },
      "controls": {},
      "state": {},
      "data-audio-played": {},
      "muted": {},
      "data-audio-active": {}
    }
  },

  "audio-visualizer": {
    attributes: {
      "for": {},
      "data-mode": {},
      "data-fft-size": {}
    }
  },

  "author-index": {
    attributes: {
      "data-lens-src": {},
      "src": {},
      "placeholder": {},
      "sort": {}
    }
  },

  "bread-crumb": {
    attributes: {
      "data-from-pathname": { boolean: true },
      "data-current-label": {},
      "data-separator": {},
      "data-collapsed": { boolean: true },
      "data-jsonld": {}
    }
  },

  "breakpoint-specimen": {
    attributes: {
      "tokens": {},
      "prefix": {},
      "label": {},
      "data-observe": {}
    }
  },

  "burndown-chart": {
    attributes: {
      "start": {},
      "end": {},
      "total": {},
      "unit": {},
      "label": {},
      "weekends": { enum: ["include", "exclude"] }
    }
  },

  "calendar-wc": {
    attributes: {
      "data-month": {},
      "data-year": {},
      "data-events": {},
      "data-selection": {},
      "data-size": {},
      "data-min-date": {},
      "data-max-date": {},
      "data-disabled-dates": {},
      "data-highlight-dates": {},
      "data-months": {},
      "role": {},
      "data-date": {},
      "data-selected": {},
      "data-range-start": {},
      "data-range-end": {},
      "data-in-range": {},
      "data-week": {},
      "data-outside-month": {},
      "data-day": {},
      "data-today": {},
      "data-highlight": {},
      "data-event-count": {},
      "name": {},
      "size": {},
      "data-event-dot": {},
      "title": {}
    }
  },

  "capacity-plan": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-bind-triangle": {},
      "data-bind-quality": {}
    }
  },

  "card-list": {
    attributes: {
      "src": {},
      "data-items": {},
      "data-key": {},
      "data-loading": {},
      "data-field": {},
      "data-field-attr": {},
      "data-field-html": {},
      "data-field-if": {},
      "data-field-unless": {}
    }
  },

  "carousel-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "autoplay": { boolean: true },
      "autoplay-delay": {},
      "loop": { boolean: true },
      "indicators": {},
      "item-width": {},
      "gap": { enum: ["xs", "s", "m", "l", "xl"] },
      "start": {},
      "persist": {},
      "transition": { enum: ["fade", "slide", "scale"] }
    }
  },

  "change-set": {
    attributes: {
      "view": {},
      "datetime": {},
      "author": {},
      "data-controls": {},
      "aria-pressed": {}
    }
  },

  "chart-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-type": { enum: ["bar", "column", "line", "area", "pie", "ring", "scatter", "bubble"] },
      "data-values": {},
      "data-config": {},
      "data-title": {},
      "data-legend": { boolean: true },
      "data-tooltip": { boolean: true },
      "data-palette": {},
      "data-chart": { enum: ["replace", "enhance"] },
      "data-size": { enum: ["sparkline"] }
    }
  },

  "chat-input": {
    attributes: {
      "name": {},
      "maxlength": {},
      "minlength": {},
      "disabled": { boolean: true },
      "autofocus": { boolean: true }
    }
  },

  "chat-window": {
    attributes: {
      "endpoint": {},
      "model": {},
      "empty-message": {},
      "data-from": {},
      "data-from-label": {},
      "data-status": {},
      "data-role": {},
      "data-model": {},
      "data-chat-empty": {}
    }
  },

  "color-palette": {
    attributes: {
      "colors": {},
      "names": {},
      "layout": {},
      "show-values": { boolean: true },
      "show-names": { boolean: true },
      "size": {},
      "editable": { boolean: true }
    }
  },

  "color-picker": {
    attributes: {
      "name": {},
      "disabled": { boolean: true },
      "required": { boolean: true },
      "data-disabled": {},
      "aria-haspopup": {},
      "role": {},
      "aria-valuemin": {},
      "aria-valuemax": {},
      "data-color": {},
      "data-channel": {},
      "maxlength": {},
      "spellcheck": {},
      "autocomplete": {},
      "aria-valuetext": {},
      "aria-valuenow": {},
      "open": {},
      "format": { enum: ["hex", "rgb", "hsl", "oklch"] }
    }
  },

  "combo-box": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "required": { boolean: true },
      "filter": { enum: ["contains", "startsWith"] },
      "value": {},
      "placeholder": {},
      "multiple": { boolean: true },
      "max": {},
      "custom": { boolean: true }
    }
  },

  "command-group": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "label": {}
    }
  },

  "command-item": {
    flow: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "value": {},
      "data-shortcut": {}
    }
  },

  "command-palette": {
    attributes: {
      "hotkey": {},
      "placeholder": {},
      "discover": { boolean: true },
      "role": {},
      "label": {},
      "value": {},
      "data-hotkey": {},
      "name": {}
    }
  },

  "comment-box": {
    attributes: {
      "name": {},
      "value": {},
      "placeholder": {},
      "submit-label": {},
      "cancel-label": {},
      "data-show-cancel": { boolean: true },
      "data-min-length": {},
      "data-max-length": {},
      "required": { boolean: true },
      "disabled": { boolean: true }
    }
  },

  "comment-thread": {
    attributes: {
      "aria-label": {},
      "data-disabled": { boolean: true },
      "role": {}
    }
  },

  "comment-wc": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "compare-surface": {
    attributes: {
      "position": {},
      "role": {},
      "aria-valuemin": {},
      "aria-valuemax": {},
      "aria-valuenow": {}
    }
  },

  "component-sampler": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "components": {},
      "label": {},
      "compact": { boolean: true }
    }
  },

  "consent-banner": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "persist": {},
      "position": { enum: ["bottom", "top", "center"] },
      "trigger": {},
      "expires": {}
    }
  },

  "content-lens": {
    attributes: {
      "data-lens-default": {},
      "data-lens-controls": {},
      "data-lens-src": {},
      "data-lens-storage": {},
      "data-active-lens": {}
    }
  },

  "content-swap": {
    attributes: {
      "transition": {},
      "swapped": { boolean: true },
      "card": { boolean: true },
      "data-face": {},
      "data-swap": { boolean: true },
      "role": {},
      "data-swap-init": {}
    }
  },

  "context-menu": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "data-table": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-filterable": { boolean: true },
      "data-paginate": {}
    }
  },

  "date-picker": {
    attributes: {
      "name": {},
      "disabled": { boolean: true },
      "required": { boolean: true },
      "data-disabled-dates": {},
      "data-highlight-dates": {},
      "min": {},
      "max": {},
      "data-disabled": {},
      "role": {},
      "aria-haspopup": {},
      "autocomplete": {},
      "placeholder": {},
      "size": {},
      "data-date": {},
      "data-disabled-reason": {},
      "data-highlight": {},
      "data-focused": {},
      "open": {}
    }
  },

  "day-view": {
    attributes: {
      "data-date": {},
      "data-start-hour": {},
      "data-end-hour": {},
      "data-compact": { boolean: true }
    }
  },

  "diagram-wc": {
    attributes: {
      "type": {},
      "src": {},
      "caption": {},
      "loading": {},
      "data-theme-base": {},
      "min-height": {}
    }
  },

  "drag-surface": {
    attributes: {
      "group": {},
      "orientation": {},
      "disabled": { boolean: true },
      "draggable": { boolean: true },
      "data-id": {},
      "data-sort-order": {},
      "data-drag-handle": { boolean: true },
      "role": {},
      "aria-grabbed": {},
      "data-dragging": {},
      "data-drag-over": {},
      "data-reorder-mode": {},
      "data-just-dropped": {},
      "data-drop-target": {}
    }
  },

  "drop-down": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "position": { enum: ["bottom-start", "bottom-end", "top-start", "top-end"] },
      "hover": { boolean: true },
      "no-flip": { boolean: true },
      "open": { boolean: true }
    }
  },

  "emoji-picker": {
    attributes: {
      "for": {},
      "recent-limit": {},
      "data-trigger": {},
      "aria-haspopup": {},
      "role": {},
      "data-group": {},
      "data-group-heading": {},
      "data-shortcode": {},
      "open": {}
    }
  },

  "empathy-map": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "title": {},
      "persona": {},
      "persona-id": {},
      "summary": {},
      "src": {},
      "editable": { boolean: true },
      "compact": { boolean: true }
    }
  },

  "flow-diagram": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "title": {},
      "src": {},
      "data-direction": {},
      "compact": { boolean: true }
    }
  },

  "font-pairer": {
    attributes: {
      "heading-font": {},
      "body-font": {},
      "sample": {},
      "show-export": { boolean: true },
      "show-suggestions": { boolean: true }
    }
  },

  "foot-note": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"]
  },

  "foot-notes": {
    attributes: {
      "data-back-label": {},
      "data-mode": {},
      "data-enhanced": {},
      "data-side": {},
      "role": {},
      "data-backref": {}
    }
  },

  "gantt-chart": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "title": {},
      "src": {},
      "view": {},
      "show-today": { boolean: true },
      "show-progress": { boolean: true },
      "show-dependencies": { boolean: true },
      "compact": { boolean: true }
    }
  },

  "geo-map": {
    attributes: {
      "lat": {},
      "lng": {},
      "zoom": {},
      "marker": {},
      "marker-color": {},
      "provider": {},
      "tile-url": {},
      "interactive": {},
      "static-only": {},
      "src": {},
      "place": {},
      "content": {},
      "data-has-caption": {},
      "data-interactive-active": {},
      "data-state": {}
    }
  },

  "glossary-index": {
    attributes: {
      "placeholder": {},
      "data-glossary-search": {},
      "href": {}
    }
  },

  "glossary-wc": {
    flow: true,
    permittedContent: ["dl", "@flow"],
    attributes: {
      "title": {},
      "src": {},
      "searchable": { boolean: true },
      "compact": { boolean: true }
    }
  },

  "gradient-builder": {
    attributes: {
      "colors": {},
      "type": {},
      "angle": {},
      "interpolation": {},
      "show-export": { boolean: true },
      "show-controls": { boolean: true }
    }
  },

  "heading-links": {
    attributes: {
      "levels": {},
      "data-toc-ignore": {},
      "role": {}
    }
  },

  "highlight-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "colors": {},
      "readonly": { boolean: true },
      "storage-key": {}
    }
  },

  "icon-wc": {
    flow: true,
    phrasing: true,
    attributes: {
      "name": {},
      "set": {},
      "size": {},
      "label": {},
      "base-path": {},
      "width": {},
      "height": {},
      "role": {}
    }
  },

  "image-gallery": {
    flow: true,
    permittedContent: ["a", "figure"],
    attributes: {
      "columns": { enum: ["100px", "150px", "200px", "250px", "300px"] },
      "gap": { enum: ["none", "xs", "s", "m", "l", "xl"] },
      "ratio": { enum: ["1", "4:3", "3:2", "16:9", "3:4", "auto"] },
      "controls": { enum: ["edge", "bar", "minimal"] },
      "loop": { boolean: true },
      "captions": { enum: ["auto", "overlay", "hidden"] },
      "transition": { enum: ["morph", "fade", "none"] }
    }
  },

  "image-map": {
    attributes: {
      "x": {},
      "y": {},
      "width": {},
      "height": {},
      "cx": {},
      "cy": {},
      "r": {},
      "points": {},
      "shape": {},
      "coords": {},
      "label": {},
      "href": {},
      "target": {},
      "tooltip": {},
      "disabled": {},
      "src": {},
      "alt": {},
      "viewBox": {},
      "preserveAspectRatio": {},
      "role": {},
      "data-disabled": {},
      "data-hover": {}
    }
  },

  "impact-effort": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "title": {},
      "compact": { boolean: true }
    }
  },

  "include-file": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "mode": { enum: ["replace", "append", "prepend"] },
      "lazy": { boolean: true },
      "allow-scripts": { boolean: true }
    }
  },

  "iron-triangle": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "data-focus-factor": {},
      "data-min-capacity": {},
      "data-quality-href": {},
      "data-quality-summary": {},
      "disabled": { boolean: true },
      "locked": { boolean: true }
    }
  },

  "kanban-board": {
    flow: true,
    permittedContent: ["section"],
    attributes: {
      "src": {},
      "title": {},
      "compact": { boolean: true }
    }
  },

  "markdown-editor": {
    flow: true,
    permittedContent: ["textarea", "@flow"],
    attributes: {
      "name": {},
      "placeholder": {},
      "rows": {},
      "highlight": { boolean: true },
      "data-tab-indent": { boolean: true },
      "data-theme": {}
    }
  },

  "markdown-viewer": {
    flow: true,
    permittedContent: ["pre", "script", "template", "@flow"],
    attributes: {
      "src": {},
      "loading": { enum: ["eager", "lazy"] },
      "highlight": { boolean: true },
      "ping": {},
      "data-theme": {}
    }
  },

  "motion-specimen": {
    attributes: {
      "type": { enum: ["easing", "duration", "both"] },
      "tokens": {},
      "prefix": {},
      "duration": {},
      "show-values": { boolean: true },
      "label": {}
    }
  },

  "nav-bar": {
    attributes: {
      "aria-label": {},
      "data-match": { enum: ["exact"] }
    }
  },

  "note-wc": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "notification-wc": {
    attributes: {
      "mode": { enum: ["banner", "panel"] },
      "persist": {},
      "variant": { enum: ["info", "success", "warning", "error"] },
      "position": { enum: ["top", "bottom"] },
      "expires": {},
      "src": {},
      "poll": {},
      "toast-new": { boolean: true },
      "storage-key": {},
      "data-trigger": {}
    }
  },

  "page-info": {
    attributes: {
      "auto": { boolean: true },
      "og-preview": { boolean: true },
      "datetime": {},
      "data-trust": {}
    }
  },

  "page-stats": {
    attributes: {
      "data-for": {},
      "data-wpm": {},
      "data-show": {}
    }
  },

  "page-toc": {
    attributes: {
      "levels": {},
      "title": {},
      "href": {},
      "data-toc-ignore": {}
    }
  },

  "page-tools": {
    attributes: {
      "data-position": {},
      "data-orientation": {},
      "data-gap": {},
      "data-fab-icon": {},
      "data-fab-label": {},
      "data-breakpoint": {},
      "role": {},
      "data-page-tools-internal": {},
      "popovertarget": {},
      "data-resolved-orientation": {},
      "data-collapsed": {}
    }
  },

  "page-tour": {
    flow: true,
    permittedContent: ["tour-step", "details", "@flow"],
    attributes: {
      "data-title": {},
      "data-trigger": { enum: ["auto", "manual", "button"] },
      "data-mode": { enum: ["passive", "active", "forced"] },
      "data-persist": { enum: ["none", "session", "local"] },
      "data-persist-key": {},
      "data-spotlight-padding": {},
      "data-step": {},
      "data-active": { boolean: true },
      "data-complete": { boolean: true }
    }
  },

  "palette-generator": {
    attributes: {
      "seed": {},
      "harmony": {},
      "include-seed": { boolean: true },
      "show-export": { boolean: true },
      "layout": {},
      "size": {},
      "show-values": { boolean: true },
      "show-names": { boolean: true },
      "role": {}
    }
  },

  "poll-wc": {
    attributes: {
      "aria-label": {},
      "data-multi": { boolean: true },
      "data-closed": { boolean: true },
      "data-hide-counts": { boolean: true },
      "disabled": { boolean: true }
    }
  },

  "pop-over": {
    attributes: {
      "data-mode": { enum: ["auto", "manual", "hint"] },
      "data-anchor": {},
      "data-position": { enum: ["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end", "left-start", "left-end", "right-start", "right-end"] },
      "data-offset": { enum: ["none", "xs", "s", "m", "l"] }
    }
  },

  "popularity-index": {
    attributes: {
      "data-lens-src": {},
      "data-meta-src": {},
      "limit": {},
      "window": {}
    }
  },

  "print-page": {
    attributes: {
      "raw-toggle": { boolean: true },
      "label": {},
      "role": {},
      "data-print-raw": {}
    }
  },

  "product-roadmap": {
    attributes: {
      "start": {},
      "end": {},
      "view": { enum: ["quarter", "month"] },
      "editable": { boolean: true },
      "today-marker": { boolean: true }
    }
  },

  "qr-code": {
    attributes: {
      "value": {},
      "size": {},
      "color": {},
      "background": {},
      "error-correction": {},
      "role": {}
    }
  },

  "quadrant-grid": {
    attributes: {
      "x-label": {},
      "y-label": {},
      "x-low": {},
      "x-high": {},
      "y-low": {},
      "y-high": {},
      "q1-label": {},
      "q2-label": {},
      "q3-label": {},
      "q4-label": {},
      "draggable": { boolean: true }
    }
  },

  "quality-target": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "data-bind-to": {},
      "data-capacity-points": {},
      "data-cost-weights": {},
      "data-radius": {},
      "data-show-envelope": { boolean: true },
      "data-min-rationale": {},
      "data-max-rationale": {},
      "data-min-overrun-rationale": {},
      "data-max-overrun-rationale": {},
      "disabled": { boolean: true },
      "locked": { boolean: true }
    }
  },

  "reaction-bar": {
    attributes: {
      "aria-label": {},
      "data-trigger-icon": {},
      "data-trigger-label": {},
      "data-disabled": { boolean: true },
      "role": {}
    }
  },

  "reader-view": {
    attributes: {
      "upgraded": {},
      "mode": {},
      "columns": {},
      "role": {},
      "font-controls": {},
      "col-controls": {},
      "reader-title": {},
      "disabled": {},
      "persist": {},
      "storage-key": {},
      "data-reader-state": {},
      "aria-pressed": {}
    }
  },

  "reading-progress": {
    attributes: {
      "data-for": {},
      "data-position": {}
    }
  },

  "recently-visited": {
    attributes: {
      "limit": {},
      "no-track": { boolean: true },
      "empty-text": {}
    }
  },

  "requirement-card": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-priority": { enum: ["critical", "important", "acceptable", "not-relevant"] },
      "data-conflict": { boolean: true },
      "tabindex": {}
    }
  },

  "review-surface": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "editable": { boolean: true },
      "adapter": {},
      "endpoint": {},
      "storage-key": {},
      "author": {},
      "compact": { boolean: true },
      "show-resolved": { boolean: true },
      "pin-count": {}
    }
  },

  "risk-register": {
    attributes: {
      "src": {},
      "label": {}
    }
  },

  "score-card": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "trend": { enum: ["up", "down", "flat"] },
      "tone": { enum: ["default", "success", "warning", "error", "info"] },
      "layout": { enum: ["stack", "cluster", "compact"] },
      "loading": { boolean: true }
    }
  },

  "selection-menu": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {}
    }
  },

  "semantic-palette": {
    attributes: {
      "colors": {},
      "roles": {},
      "show-export": { boolean: true },
      "label": {}
    }
  },

  "settings-panel": {
    attributes: {
      "open": { boolean: true },
      "data-trigger": {},
      "aria-haspopup": {},
      "role": {}
    }
  },

  "share-wc": {
    attributes: {
      "url": {},
      "title": {},
      "text": {},
      "platforms": {},
      "variant": {},
      "size": {},
      "label": {},
      "color": { boolean: true },
      "mastodon-instance": {},
      "tier": {},
      "data-tier-resolved": {},
      "href": {},
      "content": {}
    }
  },

  "short-cuts": {

  },

  "site-index": {
    attributes: {
      "placeholder": {},
      "letters": {},
      "filter": {},
      "sort": {},
      "limit": {},
      "src": {},
      "data-index-controls": {},
      "data-index-search": {},
      "href": {},
      "data-index-overflow": {},
      "data-index-expand": {}
    }
  },

  "site-map": {
    attributes: {
      "current": {},
      "src": {},
      "data-sitemap-controls": {}
    }
  },

  "site-map-wc": {
    flow: true,
    permittedContent: ["nav"],
    attributes: {
      "title": {},
      "src": {},
      "collapsed": { boolean: true },
      "compact": { boolean: true }
    }
  },

  "site-search": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "open": { boolean: true }
    }
  },

  "slide-accept": {
    attributes: {
      "label": {},
      "activated-label": {},
      "attention": {},
      "threshold": {},
      "role": {},
      "aria-valuemin": {},
      "aria-valuemax": {},
      "aria-valuenow": {},
      "data-activated": {},
      "transitioning": {},
      "data-dragging": {}
    }
  },

  "social-embed": {
    attributes: {
      "url": {},
      "provider": {},
      "theme": {},
      "activate": {},
      "state": {},
      "role": {},
      "data-embed-live": {},
      "style": {}
    }
  },

  "spacing-specimen": {
    attributes: {
      "tokens": {},
      "prefix": {},
      "show-values": { boolean: true },
      "label": {},
      "editable": { boolean: true },
      "target": {}
    }
  },

  "split-surface": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "direction": { enum: ["horizontal", "vertical"] },
      "position": {},
      "min": {},
      "max": {},
      "persist": {},
      "collapsible": { boolean: true }
    }
  },

  "star-rating": {
    attributes: {
      "name": {},
      "value": {},
      "max": {},
      "label": {},
      "allow-half": { boolean: true },
      "readonly": { boolean: true },
      "icon": {},
      "required": { boolean: true },
      "data-rating": {},
      "data-rating-half": {},
      "data-effect": {},
      "data-half": {},
      "data-rating-readonly": {},
      "role": {}
    }
  },

  "status-wc": {
    attributes: {
      "data-variant": {},
      "data-size": {},
      "data-position": {},
      "data-pulse": {},
      "data-live": {},
      "aria-label": {},
      "role": {},
      "aria-live": {}
    }
  },

  "stepper-wc": {
    attributes: {
      "value": {},
      "name": {},
      "data-min": {},
      "data-max": {},
      "data-step": {},
      "data-values": {},
      "data-options": {},
      "data-format": {},
      "data-currency": {},
      "data-suffix": {},
      "data-show-label": { boolean: true },
      "data-accelerate": { boolean: true },
      "disabled": { boolean: true },
      "readonly": { boolean: true },
      "role": {},
      "aria-valuenow": {},
      "aria-valuemin": {},
      "aria-valuemax": {},
      "aria-valuetext": {},
      "aria-disabled": {}
    }
  },

  "story-map": {
    flow: true,
    permittedContent: ["section"],
    attributes: {
      "src": {},
      "title": {},
      "compact": { boolean: true }
    }
  },

  "tab-set": {
    flow: true,
    permittedContent: ["details"],
    attributes: {
      "aria-label": {},
      "transition": { enum: ["fade", "slide", "scale"] }
    }
  },

  "text-reader": {
    attributes: {
      "for": {},
      "selectors": {},
      "speed": {},
      "voice": {},
      "highlight": {},
      "scroll": {},
      "part": {},
      "role": {},
      "label-play": {},
      "label-pause": {},
      "label-stop": {},
      "data-speed-group": {},
      "data-speed-value": {},
      "slot": {}
    }
  },

  "theme-export": {
    attributes: {
      "scope": {},
      "selector": {},
      "include": {},
      "format": { enum: ["css", "json"] },
      "label": {},
      "live": { boolean: true }
    }
  },

  "theme-picker": {
    attributes: {
      "variant": {},
      "compact": { boolean: true },
      "open": { boolean: true },
      "data-trigger": {},
      "aria-haspopup": {},
      "role": {},
      "aria-busy": {}
    }
  },

  "time-index": {
    attributes: {
      "group": {},
      "view": {},
      "versions": { boolean: true },
      "updates-src": {},
      "data-timeline-controls": {}
    }
  },

  "time-picker": {
    attributes: {
      "name": {},
      "data-format": {},
      "disabled": { boolean: true },
      "required": { boolean: true },
      "step": {},
      "min": {},
      "max": {},
      "data-disabled": {},
      "role": {},
      "aria-haspopup": {},
      "autocomplete": {},
      "placeholder": {},
      "size": {},
      "aria-valuemin": {},
      "aria-valuemax": {},
      "data-open": {},
      "aria-valuenow": {},
      "aria-valuetext": {}
    }
  },

  "toast-msg": {
    flow: true,
    permittedContent: [],
    attributes: {
      "position": { enum: ["top-start", "top-center", "top-end", "bottom-start", "bottom-center", "bottom-end"] },
      "duration": {},
      "max": {}
    }
  },

  "token-specimen": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "type": { enum: ["shadow", "radius", "border", "color", "size", "icon"] },
      "tokens": {},
      "prefix": {},
      "show-values": { boolean: true },
      "label": {},
      "size": {},
      "icon-set": {},
      "editable": { boolean: true },
      "target": {}
    }
  },

  "tool-tip": {
    attributes: {
      "content": {},
      "position": {},
      "delay": {},
      "variant": {},
      "data-interest-polyfill": {},
      "title": {},
      "role": {},
      "data-anchor": {},
      "interestfor": {},
      "data-content": {}
    }
  },

  "topic-map": {
    attributes: {
      "data-lens-src": {},
      "src": {},
      "data-vocabulary-src": {},
      "expand-all": { boolean: true }
    }
  },

  "traceability-matrix": {
    attributes: {
      "rows": {},
      "cols": {},
      "link-attr": {},
      "label": {},
      "row-label": {},
      "cell-mark": {},
      "flag-orphans": { boolean: true }
    }
  },

  "trust-filter": {
    attributes: {
      "data-lens-src": {},
      "src": {}
    }
  },

  "type-specimen": {
    attributes: {
      "font-family": {},
      "label": {},
      "sample": {},
      "show-scale": { boolean: true },
      "show-weights": { boolean: true },
      "show-characters": { boolean: true },
      "weights": {},
      "editable": { boolean: true },
      "target": {},
      "token": {}
    }
  },

  "user-journey": {
    flow: true,
    permittedContent: [],
    attributes: {
      "title": {},
      "persona": {},
      "persona-id": {},
      "summary": {},
      "story-ids": {},
      "src": {},
      "compact": { boolean: true }
    }
  },

  "user-persona": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "role": {},
      "age": {},
      "location": {},
      "avatar": {},
      "quote": {},
      "compact": { boolean: true },
      "src": {},
      "data-list-stories": { boolean: true }
    }
  },

  "user-story": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "persona-id": {},
      "priority": { enum: ["critical", "high", "medium", "low"] },
      "status": { enum: ["backlog", "to-do", "in-progress", "review", "done"] },
      "points": {},
      "epic": {},
      "story-id": {},
      "detail": { enum: ["full", "compact", "minimal"] },
      "compact": { boolean: true },
      "src": {}
    }
  },

  "video-player": {
    attributes: {
      "autoplay": { boolean: true },
      "loop": { boolean: true },
      "muted": { boolean: true },
      "controls": {},
      "data-fullscreen": {},
      "state": {},
      "data-video-played": {},
      "captions": {},
      "aria-pressed": {},
      "data-video-active": {},
      "data-poster": {},
      "data-captions": {},
      "data-dynamic": {},
      "shuffle": {},
      "aria-valuetext": {}
    }
  },

  "watch-wc": {
    attributes: {
      "variant": { enum: ["icon", "compact", "button"] },
      "label": {},
      "server-sync": { boolean: true },
      "data-variant": {}
    }
  },

  "week-view": {
    attributes: {
      "data-start-date": {},
      "data-days": {},
      "data-start-hour": {},
      "data-end-hour": {}
    }
  },

  "work-item": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "item-id": {},
      "type": {},
      "priority": {},
      "status": {},
      "estimate": {},
      "assignee": {},
      "story-ids": {},
      "detail": {},
      "compact": { boolean: true },
      "src": {}
    }
  },

  "youtube-player": {
    attributes: {
      "video-id": {},
      "title": {},
      "start": {},
      "list": {},
      "params": {},
      "autoplay": { boolean: true },
      "thumbnail": {},
      "state": {},
      "role": {}
    }
  },

  // ── Doc-Site Components ─────────────────────────────────────────

  "browser-window": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "url": {},
      "title": {},
      "shadow": { boolean: true }
    }
  },

  "code-block": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "language": {},
      "show-lines": { boolean: true },
      "label": {}
    }
  },

  "vb-canvas": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-wireframe": { boolean: true }
    }
  },

  "vb-composer": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "vb-inspector": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "aria-label": {}
    }
  },

};
