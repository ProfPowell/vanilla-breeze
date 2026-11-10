// @generated from api.json manifests — do not edit by hand
module.exports = {
  // ── Layout Custom Elements ──────────────────────────────────────

  "layout-text": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-measure": { enum: ["narrow", "normal", "wide"] },
      "data-layout-max": { enum: ["narrow", "normal", "wide"] },
      "data-layout-centered": { boolean: true }
    }
  },

  "layout-switcher": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-layout-threshold": { enum: ["s", "m", "l"] },
      "data-layout-limit": { enum: ["2", "3", "4"] },
      "data-layout-reverse": { boolean: true }
    }
  },

  "layout-stack": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-layout-align": { enum: ["start", "center", "end", "stretch"] }
    }
  },

  "layout-sidebar": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-layout-side": { enum: ["end"] },
      "data-layout-sidebar-width": { enum: ["narrow", "normal", "wide"] },
      "data-layout-content-min": { enum: ["s", "m", "l"] },
      "data-layout-nowrap": { boolean: true }
    }
  },

  "layout-reel": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-scrollbar": { boolean: true },
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-layout-padding": { enum: ["none", "s", "m", "l"] },
      "data-layout-item-width": { enum: ["auto", "s", "m", "l", "xl", "full"] },
      "data-layout-align": { enum: ["start", "center", "end", "stretch"] },
      "data-scroll-hint": { enum: ["start"], omit: true }
    }
  },

  "layout-imposter": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-fixed": { boolean: true },
      "data-layout-margin": { enum: ["s", "m", "l", "xl"] },
      "data-layout-position": { enum: ["center", "top", "bottom", "start", "end", "top-start", "top-end", "bottom-start", "bottom-end"] },
      "data-layout-contain": { boolean: true }
    }
  },

  "layout-grid": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-min": { enum: ["xs", "s", "m", "l", "xl"] },
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-layout-subgrid": { enum: ["2", "3", "4"], omit: true }
    }
  },

  "layout-cover": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-min": { enum: ["s", "m", "l", "xl", "auto"] },
      "data-layout-padding": { enum: ["none", "s", "m", "l", "xl"] },
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-layout-centered": { boolean: true }
    }
  },

  "layout-columns": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-align": { enum: ["justify"] },
      "data-layout-column-count": { enum: ["1", "2", "3", "auto"] },
      "data-layout-measure": { enum: ["narrow", "normal", "wide"] },
      "data-layout-max": { enum: ["narrow", "normal", "wide"] },
      "data-layout-centered": { boolean: true }
    }
  },

  "layout-cluster": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] },
      "data-layout-justify": { enum: ["start", "end", "center", "between"] },
      "data-layout-align": { enum: ["start", "end", "center", "stretch", "baseline"] },
      "data-layout-nowrap": { boolean: true },
      "data-layout-overlap": { enum: ["xs", "s", "m", "l"], omit: true }
    }
  },

  "layout-center": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-layout-max": { enum: ["narrow", "normal", "wide", "prose"] },
      "data-layout-intrinsic": { boolean: true },
      "data-layout-text": { boolean: true },
      "data-layout-gutter": { enum: ["none", "s", "l"] },
      "data-layout-gap": { enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"], omit: true }
    }
  },

  "layout-card": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-variant": { enum: ["elevated", "outlined", "ghost"] },
      "data-padding": { enum: ["none", "s", "m", "l", "xl"] },
      "data-max": { enum: ["narrow", "normal", "wide", "prose"] }
    }
  },

  "layout-canvas": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-canvas": { enum: ["flush", "elevated"], omit: true },
      "data-variant": { enum: ["flush", "elevated"] },
      "data-max": { enum: ["narrow", "normal", "wide", "prose"] },
      "data-padding": { enum: ["none", "s", "m", "l", "xl"] },
      "data-canvas-depth": { enum: ["1", "2"] }
    }
  },

  "layout-badge": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "data-size": { enum: ["s", "l"] },
      "data-color": { enum: ["primary", "success", "warning", "error", "info", "brand", "secondary", "accent"] },
      "data-variant": { enum: ["subtle", "outlined"] },
      "data-shape": { enum: ["square", "ribbon", "notch", "flag", "double-arrow", "stamp"] }
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
      "data-variant": { enum: ["primary", "success", "warning", "error"] },
      "data-overlay": { boolean: true }
    }
  },

  "mobile-menu": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "breakpoint": {},
      "data-mobile": { boolean: true }
    }
  },

  "site-legal": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-justify": { enum: ["start", "center", "end", "between"] }
    }
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
    phrasing: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-size": { enum: ["xs", "sm", "md", "lg", "xl", "2xl"] },
      "data-shape": { enum: ["rounded", "square"] },
      "data-ring": { boolean: true }
    }
  },

  "brand-mark": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "src-dark": {},
      "src-compact": {},
      "compact-media": {},
      "alt": {},
      "wordmark": { boolean: true },
      "height": {},
      "data-size": { enum: ["s", "l", "xl"] },
      "data-stack": { boolean: true }
    }
  },

  "dl": {
    flow: true,
    permittedContent: ["@script", "dt", "dd", "div", "dl-item"],
    attributes: {
      "data-variant": { enum: ["horizontal", "stacked"] },
      "data-bordered": { boolean: true },
      "data-density": { enum: ["compact"] },
      "data-striped": { boolean: true }
    }
  },

  "form-field": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-valid": { boolean: true },
      "data-invalid": { boolean: true },
      "data-type": {},
      "data-no-icon": { boolean: true },
      "data-floating-label": { boolean: true },
      "data-pending": { boolean: true },
      "data-state": {},
      "data-message-invalid": {},
      "data-label-show-password": {},
      "data-label-hide-password": {},
      "data-label-digit": {},
      "data-label-incomplete": {},
      "data-label-strength": {},
      "data-label-strength-weak": {},
      "data-label-strength-fair": {},
      "data-label-strength-good": {},
      "data-label-strength-strong": {},
      "data-label-requirements": {},
      "data-label-rule-length": {},
      "data-label-rule-uppercase": {},
      "data-label-rule-lowercase": {},
      "data-label-rule-number": {},
      "data-label-rule-special": {},
      "data-label-strength-empty": {},
      "data-label-strength-too-weak": {},
      "data-label-rule-met": {},
      "data-label-rule-unmet": {}
    }
  },

  // ── Web Components ──────────────────────────────────────────────

  "calendar-event": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-category": {},
      "data-start": { enum: ["30"] },
      "data-duration": {},
      "data-date": {}
    }
  },

  "chat-bubble": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "chat-message": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-role": { enum: ["user", "agent", "system"] },
      "data-from": {},
      "data-from-label": {},
      "data-status": {},
      "data-model": {}
    }
  },

  "chat-thread": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "day-schedule": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-date": {}
    }
  },

  "hour-view": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-overlap": { boolean: true }
    }
  },

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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "aria-label": {},
      "data-group": {},
      "data-infinite": { boolean: true },
      "data-empty-text": {},
      "role": {},
      "aria-busy": {}
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
      "heading": {},
      "heading-level": { enum: ["1", "2", "3", "4", "5", "6"] },
      "compact": { boolean: true },
      "data-state": { enum: ["active", "debug", "paused", "off"] },
      "data-reason": { enum: ["user", "gpc", "dnt", "consent", "disabled", "iframe", "uninitialized"] }
    }
  },

  "audio-player": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "autoplay": { boolean: true },
      "loop": { boolean: true },
      "shuffle": { boolean: true },
      "state": { enum: ["playing", "paused", "ended"] },
      "muted": { boolean: true },
      "data-state": { enum: ["error"] }
    }
  },

  "audio-visualizer": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "data-mode": {},
      "data-fft-size": {},
      "data-state": { enum: ["cross-origin", "error"] }
    }
  },

  "author-index": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-lens-src": {},
      "src": {},
      "placeholder": {},
      "sort": { enum: ["alpha", "count"] },
      "heading-level": { enum: ["1", "2", "3", "4", "5", "6"] }
    }
  },

  "bread-crumb": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-from-pathname": { boolean: true },
      "data-current-label": {},
      "data-separator": {},
      "data-collapsed": { boolean: true },
      "data-jsonld": {}
    }
  },

  "calendar-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-month": {},
      "data-year": {},
      "data-events": {},
      "data-selection": { enum: ["none", "single", "range", "multi"] },
      "data-size": { enum: ["compact", "default", "large"] },
      "data-min-date": {},
      "data-max-date": {},
      "data-disabled-dates": {},
      "data-highlight-dates": {},
      "data-months": {},
      "data-year-range": {},
      "data-heading-level": {},
      "data-label-prev": {},
      "data-label-next": {},
      "data-label-year": {},
      "data-label-close": {},
      "data-label-more": {},
      "name": {},
      "data-tentative": {}
    }
  },

  "card-list": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "data-items": {},
      "data-key": {},
      "data-loading": { boolean: true },
      "data-error": {}
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "view": { enum: ["final", "original"] },
      "datetime": {},
      "author": {},
      "controls": { enum: ["none"] }
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
      "data-subtitle": {},
      "data-label-x": {},
      "data-label-y": {},
      "data-legend": { enum: ["true", "false"], omit: true },
      "data-tooltip": { enum: ["true", "false"], omit: true },
      "data-palette": {},
      "data-chart": { enum: ["replace", "enhance"] },
      "data-size": { enum: ["sparkline"] }
    }
  },

  "chat-input": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "maxlength": {},
      "minlength": {},
      "disabled": { boolean: true },
      "autofocus": { boolean: true }
    }
  },

  "chat-window": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "endpoint": {},
      "model": {},
      "empty-message": {}
    }
  },

  "color-picker": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "disabled": { boolean: true },
      "format": { enum: ["hex", "rgb", "hsl", "oklch"] }
    }
  },

  "combo-box": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "required": { boolean: true },
      "disabled": { boolean: true },
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "hotkey": {},
      "placeholder": {},
      "label": {},
      "discover": { enum: ["auto"], omit: true }
    }
  },

  "comment-box": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "value": {},
      "placeholder": {},
      "label": {},
      "submit-label": {},
      "cancel-label": {},
      "data-show-cancel": { boolean: true },
      "data-min-length": {},
      "data-max-length": {},
      "required": { boolean: true },
      "disabled": { boolean: true },
      "aria-busy": {}
    }
  },

  "comment-thread": {
    flow: true,
    permittedContent: ["@flow"],
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "position": {},
      "label": {},
      "aria-label": {}
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-lens-default": {},
      "data-lens-controls": {},
      "data-lens-src": {},
      "data-lens-storage": {},
      "data-active-lens": {}
    }
  },

  "content-swap": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "transition": { enum: ["flip", "flip-vertical", "fade", "slide-left", "slide-up", "scale"] },
      "swapped": { boolean: true },
      "card": { boolean: true }
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
      "data-label-no-results": {}
    }
  },

  "date-picker": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "disabled": { boolean: true },
      "required": { boolean: true },
      "data-disabled-dates": {},
      "data-highlight-dates": {},
      "data-label-toggle": {},
      "data-label-dialog": {},
      "data-label-prev": {},
      "data-label-next": {},
      "data-label-year": {},
      "data-label-placeholder": {},
      "data-label-required": {},
      "data-label-range-underflow": {},
      "data-label-range-overflow": {},
      "data-label-input": {}
    }
  },

  "day-view": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-date": {},
      "data-start-hour": {},
      "data-end-hour": {},
      "data-compact": { boolean: true },
      "data-label-continues": {}
    }
  },

  "diagram-wc": {
    flow: true,
    permittedContent: ["@flow"],
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "group": {},
      "orientation": { enum: ["vertical", "horizontal"] },
      "disabled": { boolean: true },
      "data-move-controls": { boolean: true },
      "role": {},
      "aria-disabled": {},
      "data-drag-over": { boolean: true },
      "data-reorder-mode": { boolean: true }
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "recent-limit": {},
      "data-trigger": { boolean: true },
      "data-label-trigger": {},
      "data-label-dialog": {},
      "data-label-search": {},
      "data-label-placeholder": {},
      "data-label-categories": {},
      "data-label-emoji": {},
      "data-label-recent": {},
      "data-label-empty": {},
      "data-label-results": {},
      "data-label-smileys": {},
      "data-label-people": {},
      "data-label-animals": {},
      "data-label-food": {},
      "data-label-travel": {},
      "data-label-activities": {},
      "data-label-objects": {},
      "data-label-symbols": {},
      "data-label-flags": {},
      "open": { boolean: true }
    }
  },

  "flow-diagram": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-title": {},
      "data-heading-level": {},
      "src": {},
      "data-direction": { enum: ["vertical", "horizontal"] },
      "compact": { boolean: true },
      "data-label": {},
      "data-label-selected": {},
      "data-label-steps-one": {},
      "data-label-steps-other": {},
      "data-label-type-start": {},
      "data-label-type-action": {},
      "data-label-type-decision": {},
      "data-label-type-process": {},
      "data-label-type-wait": {},
      "data-label-type-end": {}
    }
  },

  "foot-note": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"]
  },

  "foot-notes": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-mode": { enum: ["sidenotes"] },
      "data-label-back": {},
      "data-label-ref": {},
      "data-label-heading": {},
      "data-preview": { enum: ["false"] }
    }
  },

  "geo-map": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "lat": {},
      "lng": {},
      "zoom": {},
      "marker": { enum: ["true", "false"], omit: true },
      "marker-color": {},
      "provider": { enum: ["osm", "carto-light", "carto-dark", "carto-auto"] },
      "tile-url": {},
      "attribution": {},
      "attribution-href": {},
      "interactive": { enum: ["click", "eager", "none"] },
      "static-only": { boolean: true },
      "loading": { enum: ["lazy", "eager", "consent"] },
      "label": {},
      "src": {},
      "place": {},
      "data-ready": { boolean: true },
      "data-label-map": {},
      "data-label-map-of": {},
      "data-label-activate": {},
      "data-label-consent": {},
      "data-label-consent-note": {},
      "data-label-zoom-in": {},
      "data-label-zoom-out": {},
      "data-label-recenter": {},
      "data-label-exit": {},
      "data-label-controls": {},
      "data-label-instructions": {},
      "data-label-moved": {},
      "data-label-error-coords": {},
      "data-label-error-tiles": {}
    }
  },

  "glossary-index": {
    attributes: {
      "placeholder": {},
      "data-label-filter": {},
      "data-label-matches-one": {},
      "data-label-matches-other": {},
      "data-label-all-one": {},
      "data-label-all-other": {},
      "data-label-empty": {},
      "data-label-permalink": {},
      "data-label-copied": {}
    }
  },

  "glossary-wc": {
    flow: true,
    permittedContent: ["dl", "@flow"],
    attributes: {
      "data-title": {},
      "data-heading-level": {},
      "src": {},
      "searchable": { boolean: true },
      "compact": { boolean: true },
      "data-state": { enum: ["loading", "ready", "error"] },
      "data-label-search": {},
      "data-label-search-placeholder": {},
      "data-label-terms": {},
      "data-label-alphabet": {},
      "data-label-found-one": {},
      "data-label-found-other": {},
      "data-label-all-one": {},
      "data-label-all-other": {},
      "data-label-uncategorized": {},
      "data-label-see-also": {},
      "data-label-error": {}
    }
  },

  "heading-links": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "levels": {},
      "data-label-anchor": {},
      "data-label-copied": {}
    }
  },

  "highlight-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "colors": {},
      "readonly": { boolean: true },
      "storage-key": {},
      "data-label-button": {},
      "data-label-palette": {},
      "data-label-annotation": {},
      "data-label-added": {},
      "data-label-removed": {}
    }
  },

  "icon-wc": {
    flow: true,
    phrasing: true,
    attributes: {
      "name": {},
      "set": {},
      "size": { enum: ["xs", "sm", "md", "lg", "xl", "2xl"] },
      "label": {},
      "base-path": {},
      "data-flip-rtl": { boolean: true },
      "data-animate": { enum: ["spin"] },
      "data-error": { boolean: true }
    }
  },

  "image-gallery": {
    flow: true,
    permittedContent: ["a", "figure", "img"],
    attributes: {
      "columns": { enum: ["100px", "150px", "200px", "250px", "300px"] },
      "gap": { enum: ["none", "xs", "s", "m", "l", "xl"] },
      "ratio": { enum: ["1", "4:3", "3:2", "16:9", "3:4", "auto"] },
      "controls": { enum: ["edge", "bar", "minimal"] },
      "loop": { boolean: true },
      "captions": { enum: ["auto", "overlay", "hidden"] },
      "transition": { enum: ["morph", "fade", "none"] },
      "data-label-dialog": {},
      "data-label-close": {},
      "data-label-prev": {},
      "data-label-next": {},
      "data-label-show-details": {},
      "data-label-hide-details": {},
      "data-label-counter": {}
    }
  },

  "image-map": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "alt": {},
      "data-label-map": {}
    }
  },

  "include-file": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "src": {},
      "mode": { enum: ["replace", "append", "prepend"] },
      "lazy": { boolean: true },
      "trusted": { boolean: true },
      "allow-scripts": { boolean: true },
      "allow-cross-origin": { boolean: true },
      "data-label-error": {}
    }
  },

  "markdown-editor": {
    flow: true,
    permittedContent: ["textarea", "@flow"],
    attributes: {
      "placeholder": {},
      "rows": {},
      "highlight": { boolean: true },
      "data-tab-indent": { boolean: true },
      "data-auto-mermaid": { boolean: true },
      "data-theme": {},
      "data-label-source": {},
      "data-label-preview": {},
      "data-label-tab-hint": {}
    }
  },

  "markdown-viewer": {
    flow: true,
    permittedContent: ["pre", "script", "template", "@flow"],
    attributes: {
      "src": {},
      "allow-cross-origin": { boolean: true },
      "sanitize": { enum: ["on", "off", "false"] },
      "highlight": { boolean: true },
      "ping": {},
      "data-theme": {},
      "data-label-error": {},
      "data-auto-mermaid": { boolean: true }
    }
  },

  "nav-bar": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "aria-label": {},
      "data-match": { enum: ["exact"] },
      "data-label-new-tab": {}
    }
  },

  "note-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "data-label-add": {},
      "data-label-view": {},
      "data-label-dialog": {},
      "data-label-heading": {},
      "data-label-placeholder": {},
      "data-label-textarea": {},
      "data-label-save": {},
      "data-label-cancel": {}
    }
  },

  "notification-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "mode": { enum: ["banner", "panel"] },
      "persist": {},
      "variant": { enum: ["info", "success", "warning", "error"] },
      "position": { enum: ["top", "bottom"] },
      "expires": {},
      "src": {},
      "poll": {},
      "toast-new": {},
      "storage-key": {},
      "data-label-trigger": {},
      "data-label-unread": {},
      "data-label-title": {},
      "data-label-mark-all": {},
      "data-label-tabs": {},
      "data-label-all": {},
      "data-label-watching": {},
      "data-label-empty": {},
      "data-label-watch-empty": {},
      "data-label-last-checked": {},
      "data-label-never": {},
      "data-label-changed": {},
      "data-label-unwatch": {},
      "data-label-new": {},
      "data-label-variant-info": {},
      "data-label-variant-success": {},
      "data-label-variant-warning": {},
      "data-label-variant-error": {}
    }
  },

  "page-info": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "auto": { boolean: true },
      "data-concept-base": {},
      "data-heading-level": { enum: ["2", "3", "4", "5", "6"] },
      "data-label-reading-time": {},
      "data-label-author": {},
      "data-label-history": {},
      "data-label-provenance": {},
      "data-label-topic": {},
      "data-label-published": {},
      "data-label-updated": {},
      "data-label-version": {},
      "data-label-authorship": {},
      "data-label-ai-tools": {},
      "data-label-review": {},
      "data-label-status": {},
      "data-label-license": {},
      "data-label-concepts": {},
      "data-label-keywords": {},
      "data-label-tier-declared": {},
      "data-label-tier-verified": {},
      "data-label-tier-failed": {},
      "data-label-tier-key-unavailable": {}
    }
  },

  "page-stats": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-for": {},
      "data-wpm": {},
      "data-show": {},
      "data-label-reading-time": {},
      "data-label-word-count": {},
      "data-label-last-modified": {},
      "data-label-min-read": {},
      "data-label-words": {}
    }
  },

  "page-toc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "levels": {},
      "scope": {},
      "data-title": {},
      "orientation": { enum: ["horizontal"] }
    }
  },

  "page-tools": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-position": { enum: ["sticky", "fixed", "inline"] },
      "data-orientation": { enum: ["auto", "vertical", "horizontal"] },
      "data-gap": { enum: ["2xs", "xs", "s", "m", "l"] },
      "data-fab-icon": {},
      "data-fab-label": {},
      "data-breakpoint": {},
      "data-resolved-orientation": { enum: ["vertical", "horizontal"] },
      "data-collapsed": { boolean: true }
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
      "data-label-step": {},
      "data-label-skip": {},
      "data-label-close": {},
      "data-label-prev": {},
      "data-label-next": {},
      "data-label-finish": {},
      "data-label-nav": {},
      "data-label-ready": {},
      "data-step": {},
      "data-active": { boolean: true },
      "data-complete": { boolean: true }
    }
  },

  "pager-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "target": {},
      "for": {},
      "data-style": { enum: ["numbered", "prev-next", "load-more"] },
      "data-label-nav": {},
      "data-label-prev": {},
      "data-label-next": {},
      "data-label-page": {},
      "data-label-status": {},
      "data-label-load-more": {},
      "data-label-no-more": {},
      "data-label-missing": {}
    }
  },

  "poll-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "aria-label": {},
      "data-multi": { boolean: true },
      "data-closed": { boolean: true },
      "data-hide-counts": { boolean: true },
      "disabled": { boolean: true },
      "data-label-vote": {},
      "data-label-votes": {},
      "data-label-your-choice": {},
      "data-label-closed": {},
      "data-label-poll": {}
    }
  },

  "pop-over": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-mode": { enum: ["auto", "manual", "hint"] },
      "data-anchor": {},
      "data-position": { enum: ["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end", "left-start", "left-end", "right-start", "right-end"] },
      "data-offset": { enum: ["none", "xs", "s", "m", "l"] },
      "data-anchor-name": {}
    }
  },

  "popularity-index": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "analytics-src": {},
      "data-meta-src": {},
      "data-lens-src": {},
      "limit": {},
      "window": {},
      "data-heading-level": {},
      "data-label-heading": {},
      "data-label-view": {},
      "data-label-views": {},
      "data-label-unavailable": {},
      "data-label-empty": {},
      "data-state": { enum: ["loading", "ready", "empty", "unavailable"] }
    }
  },

  "print-page": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "raw-toggle": { boolean: true },
      "label": {},
      "variant": { enum: ["icon", "label", "icon-label"] },
      "data-label-raw": {}
    }
  },

  "progress-tracker": {
    flow: true,
    permittedContent: ["ol"],
    attributes: {
      "data-current": {},
      "data-clickable": { boolean: true },
      "data-direction": { enum: ["horizontal", "vertical"] },
      "data-label-list": {},
      "data-label-step": {},
      "data-label-complete": {},
      "data-label-current": {},
      "data-label-upcoming": {},
      "data-label-error": {}
    }
  },

  "qr-code": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "value": {},
      "size": {},
      "color": {},
      "background": {},
      "error-correction": { enum: ["l", "m", "q", "h", "0", "1", "2", "3"] },
      "data-caption": { enum: ["visible"] },
      "data-label-prefix": {},
      "data-label-copied": {},
      "data-error": { enum: ["capacity", "encoding"] }
    }
  },

  "reaction-bar": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "aria-label": {},
      "data-trigger-icon": {},
      "data-trigger-label": {},
      "data-label-toolbar": {},
      "data-label-dialog": {},
      "data-label-count-one": {},
      "data-label-count-other": {},
      "data-disabled": { boolean: true }
    }
  },

  "reader-view": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "mode": { enum: ["scroll", "pages"] },
      "columns": { enum: ["auto", "1", "2", "3"] },
      "font-controls": { enum: ["true", "false"] },
      "col-controls": { enum: ["true", "false"] },
      "reader-title": {},
      "persist": { enum: ["true", "false"] },
      "storage-key": {},
      "data-remember-mode": { boolean: true },
      "data-label-kicker": {},
      "data-label-controls": {},
      "data-label-mode-group": {},
      "data-label-mode": {},
      "data-label-scroll": {},
      "data-label-pages": {},
      "data-label-font-group": {},
      "data-label-type": {},
      "data-label-font-decrease": {},
      "data-label-font-increase": {},
      "data-label-columns-group": {},
      "data-label-cols": {},
      "data-label-auto": {},
      "data-label-column-auto": {},
      "data-label-column-1": {},
      "data-label-column-2": {},
      "data-label-column-3": {},
      "data-label-pages-region": {},
      "data-label-page-nav": {},
      "data-label-prev": {},
      "data-label-next": {},
      "data-label-page-indicator": {}
    }
  },

  "reading-progress": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-for": {},
      "data-position": { enum: ["top", "bottom"] }
    }
  },

  "recently-visited": {
    flow: true,
    permittedContent: [],
    attributes: {
      "limit": {},
      "include-current": { boolean: true },
      "data-heading-level": {},
      "data-label-heading": {},
      "data-label-explainer": {},
      "data-label-pause": {},
      "data-label-anchors": {},
      "data-label-clear": {},
      "data-label-empty": {},
      "data-label-anchor-one": {},
      "data-label-anchor-other": {}
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
      "for": {},
      "id": {},
      "data-label": {}
    }
  },

  "settings-panel": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "open": { boolean: true },
      "data-label-trigger": {},
      "data-label-dialog": {},
      "data-label-title": {},
      "data-label-close": {},
      "data-label-appearance": {},
      "data-label-color-mode": {},
      "data-label-mode-auto": {},
      "data-label-mode-light": {},
      "data-label-mode-dark": {},
      "data-label-theme": {},
      "data-label-accessibility": {},
      "data-label-high-contrast": {},
      "data-label-large-text": {},
      "data-label-dyslexia": {},
      "data-label-char-shortcuts": {},
      "data-label-layout": {},
      "data-label-fluid": {},
      "data-label-density": {},
      "data-label-density-compact": {},
      "data-label-density-default": {},
      "data-label-density-spacious": {},
      "data-label-backdrop": {},
      "data-label-backdrop-style": {},
      "data-label-backdrop-default": {},
      "data-label-backdrop-flush": {},
      "data-label-backdrop-elevated": {},
      "data-label-chrome": {},
      "data-label-chrome-card": {},
      "data-label-chrome-stretch": {},
      "data-label-chrome-integrated": {},
      "data-label-fixed-header": {},
      "data-label-page-bg": {},
      "data-label-page-bg-default": {},
      "data-label-page-bg-color": {},
      "data-label-page-bg-gradient": {},
      "data-label-bg-color": {},
      "data-label-grad-start": {},
      "data-label-grad-end": {},
      "data-label-grad-direction": {},
      "data-label-dir-to-bottom": {},
      "data-label-dir-to-right": {},
      "data-label-dir-135deg": {},
      "data-label-dir-45deg": {},
      "data-label-sticky": {},
      "data-label-effects": {},
      "data-label-motion": {},
      "data-label-sounds": {},
      "data-label-environment": {},
      "data-label-time-of-day": {},
      "data-label-seasonal": {},
      "data-label-system": {},
      "data-label-sw-label": {},
      "data-label-sw-checking": {},
      "data-label-sw-unsupported": {},
      "data-label-sw-active": {},
      "data-label-sw-unregistered": {},
      "data-label-clear-cache": {},
      "data-label-clearing": {},
      "data-label-cleared": {},
      "data-label-check-update": {},
      "data-label-checking": {},
      "data-label-update-available": {},
      "data-label-up-to-date": {},
      "data-label-failed": {},
      "data-label-reset": {},
      "data-label-reset-confirm": {},
      "data-label-reset-yes": {},
      "data-label-reset-cancel": {},
      "data-label-reset-done": {}
    }
  },

  "share-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "url": {},
      "title": {},
      "text": {},
      "platforms": {},
      "variant": { enum: ["icon", "label", "icon-label"] },
      "size": { enum: ["s", "m", "l"] },
      "label": {},
      "color": { boolean: true },
      "mastodon-instance": {},
      "tier": { enum: ["native", "platforms"] },
      "data-tier-resolved": { enum: ["native", "platforms", "hidden", "selection"] },
      "data-label-share-page": {},
      "data-label-share-on": {},
      "data-label-copy": {},
      "data-label-copied": {},
      "data-label-link-copied": {},
      "data-label-share-selection": {},
      "data-label-selection-copied": {}
    }
  },

  "short-cuts": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "hotkey": {},
      "data-label-title": {},
      "data-label-general": {},
      "data-label-self": {},
      "data-label-close": {}
    }
  },

  "site-index": {
    attributes: {
      "placeholder": {},
      "letters": { enum: ["entries", "all", "none"] },
      "filter": { enum: ["topic", "all"] },
      "sort": { enum: ["alpha", "count"] },
      "limit": {},
      "src": {},
      "data-label-controls": {},
      "data-label-scope": {},
      "data-label-scope-topic": {},
      "data-label-scope-all": {},
      "data-label-sort": {},
      "data-label-sort-alpha": {},
      "data-label-sort-count": {},
      "data-label-jump": {},
      "data-label-more": {},
      "data-label-less": {},
      "data-label-matches": {},
      "data-label-matches-one": {},
      "data-label-no-matches": {}
    }
  },

  "site-map": {
    flow: true,
    permittedContent: ["nav"],
    attributes: {
      "mode": { enum: ["nav-enhance", "ia-tree"] },
      "current": {},
      "src": {},
      "title": {},
      "collapsed": { boolean: true },
      "compact": { boolean: true },
      "data-view": { enum: ["visual"] },
      "data-orientation": { enum: ["vertical", "horizontal"] },
      "data-detail": { enum: ["0", "1", "2", "3", "4"] }
    }
  },

  "site-search": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "open": { boolean: true },
      "data-pagefind-path": {},
      "data-base-url": {},
      "data-label-trigger": {},
      "data-label-dialog": {},
      "data-label-placeholder": {},
      "data-label-input": {},
      "data-label-results": {},
      "data-label-searching": {},
      "data-label-empty": {},
      "data-label-count": {},
      "data-label-count-one": {},
      "data-label-count-more": {},
      "data-label-unavailable": {},
      "data-label-error": {},
      "data-label-untitled": {},
      "data-label-navigate": {},
      "data-label-select": {},
      "data-label-close": {},
      "data-label-powered": {}
    }
  },

  "slide-accept": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "label": {},
      "activated-label": {},
      "data-label-hint": {},
      "attention": { enum: ["shimmer", "pulse"] },
      "threshold": {},
      "name": {},
      "value": {},
      "required": { boolean: true },
      "disabled": { boolean: true },
      "data-activated": { boolean: true },
      "data-dragging": { boolean: true }
    }
  },

  "social-embed": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "url": { required: true },
      "provider": {},
      "poster": {},
      "theme": { enum: ["light", "dark", "auto"] },
      "activate": { enum: ["click", "visible", "eager"] },
      "data-title": {},
      "data-label-load": {},
      "data-label-loading": {},
      "data-label-error": {},
      "data-label-note": {},
      "state": { enum: ["idle", "loading", "loaded", "error", "unsupported"] }
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
      "collapsible": { boolean: true },
      "data-label-resize": {},
      "data-label-collapsed": {}
    }
  },

  "star-rating": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "value": {},
      "max": {},
      "label": {},
      "allow-half": { boolean: true },
      "readonly": { boolean: true },
      "icon": {},
      "required": { boolean: true },
      "data-label-one": {},
      "data-label-other": {},
      "data-label-readonly": {},
      "data-label-required": {},
      "data-label-cleared": {}
    }
  },

  "status-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-variant": {},
      "data-size": {},
      "data-position": {},
      "data-pulse": {},
      "data-live": {},
      "data-label-*": {},
      "aria-label": {},
      "role": {},
      "aria-live": {}
    }
  },

  "stepper-wc": {
    flow: true,
    permittedContent: ["@flow"],
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
      "data-label-decrease": {},
      "data-label-increase": {},
      "aria-label": {},
      "aria-labelledby": {},
      "disabled": { boolean: true },
      "readonly": { boolean: true }
    }
  },

  "tab-set": {
    flow: true,
    permittedContent: ["details", "nav", "section", "@script"],
    attributes: {
      "aria-label": {},
      "data-orientation": { enum: ["horizontal", "vertical"] },
      "transition": { enum: ["fade", "slide", "scale"] }
    }
  },

  "table": {
    attributes: {
      "data-striped": { boolean: true },
      "data-bordered": { boolean: true },
      "data-density": { enum: ["compact", "comfortable"] }
    }
  },

  "text-reader": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "variant": { enum: ["icon"] },
      "selectors": {},
      "speed": {},
      "voice": {},
      "highlight": {},
      "scroll": {},
      "data-label-play": {},
      "data-label-pause": {},
      "data-label-stop": {},
      "data-label-reader": {},
      "data-label-controls": {},
      "data-label-voice": {},
      "data-label-loading-voices": {},
      "data-label-speed": {},
      "data-label-slower": {},
      "data-label-faster": {}
    }
  },

  "theme-picker": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "variant": { enum: ["popover", "inline"] },
      "themes": {},
      "swatches": { boolean: true },
      "open": { boolean: true },
      "data-label-panel": {},
      "data-label-trigger": {},
      "data-label-mode": {},
      "data-label-theme": {}
    }
  },

  "time-index": {
    attributes: {
      "versions": { boolean: true },
      "updates-src": {},
      "data-label-controls": {},
      "data-label-sort": {},
      "data-label-filter": {},
      "data-label-all": {},
      "data-label-status": {},
      "data-label-status-all": {},
      "data-label-recent": {}
    }
  },

  "time-picker": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "name": {},
      "data-format": { enum: ["12h", "24h"] },
      "disabled": { boolean: true },
      "required": { boolean: true },
      "data-label-input": {},
      "data-label-placeholder": {},
      "data-label-toggle": {},
      "data-label-dialog": {},
      "data-label-hours": {},
      "data-label-minutes": {},
      "data-label-seconds": {},
      "data-label-period": {},
      "data-label-empty": {},
      "data-label-required": {},
      "data-label-range-underflow": {},
      "data-label-range-overflow": {},
      "data-label-step-mismatch": {}
    }
  },

  "toast-msg": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "position": { enum: ["top-start", "top-center", "top-end", "bottom-start", "bottom-center", "bottom-end"] },
      "duration": {},
      "max": {},
      "data-label-region": {},
      "data-label-dismiss": {},
      "data-label-info": {},
      "data-label-success": {},
      "data-label-warning": {},
      "data-label-error": {}
    }
  },

  "tool-tip": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "content": {},
      "position": { enum: ["top", "bottom", "left", "right"] },
      "delay": {},
      "variant": { enum: ["card"] }
    }
  },

  "topic-map": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-lens-src": {},
      "src": {},
      "data-vocabulary-src": {},
      "expand-all": { boolean: true },
      "data-heading-level": {},
      "data-label-heading": {},
      "data-label-page": {},
      "data-label-pages": {},
      "data-label-uncategorized": {},
      "data-label-topic-link": {},
      "data-label-error": {}
    }
  },

  "trust-filter": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-lens-src": {},
      "src": {},
      "data-label-form": {},
      "data-label-provenance": {},
      "data-label-review": {},
      "data-label-status": {},
      "data-label-signed": {},
      "data-label-yes": {},
      "data-label-no": {},
      "data-label-clear": {},
      "data-label-page": {},
      "data-label-pages": {},
      "data-label-has-signature": {},
      "data-label-error": {},
      "data-label-no-source": {}
    }
  },

  "version-switcher": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-versions": {},
      "data-src": {},
      "data-mode": { enum: ["releases", "history"] },
      "data-action": { enum: ["navigate", "swap", "diff"] },
      "data-versioned-region": {},
      "data-diff-position": { enum: ["before", "after"] },
      "data-banner": { boolean: true },
      "data-page-info-target": {},
      "aria-label": {},
      "data-label-trigger": {},
      "data-label-loading": {},
      "data-label-loading-versions": {},
      "data-label-empty": {},
      "data-label-heading-releases": {},
      "data-label-heading-history": {},
      "data-label-archived": {},
      "data-label-draft": {},
      "data-label-current": {},
      "data-label-by": {},
      "data-label-changelog": {},
      "data-label-changelog-for": {},
      "data-label-banner-label": {},
      "data-label-banner": {},
      "data-label-banner-latest": {},
      "data-label-diff": {}
    }
  },

  "video-player": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "autoplay": { boolean: true },
      "loop": { boolean: true },
      "shuffle": { boolean: true },
      "muted": { boolean: true },
      "captions": { boolean: true },
      "state": { enum: ["idle", "playing", "paused", "buffering", "ended"] },
      "controls": { boolean: true },
      "data-fullscreen": { boolean: true },
      "data-label-player": {},
      "data-label-controls": {},
      "data-label-play-video": {},
      "data-label-play": {},
      "data-label-pause": {},
      "data-label-seek": {},
      "data-label-skip-back": {},
      "data-label-skip-forward": {},
      "data-label-mute": {},
      "data-label-volume": {},
      "data-label-speed": {},
      "data-label-captions": {},
      "data-label-fullscreen": {},
      "data-label-exit-fullscreen": {},
      "data-label-playing": {},
      "data-label-paused": {},
      "data-label-ended": {},
      "data-label-buffering": {},
      "data-label-time-of": {}
    }
  },

  "watch-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "variant": { enum: ["icon", "compact", "button"] },
      "label": {},
      "server-sync": { boolean: true },
      "data-label-watch": {},
      "data-label-watching": {},
      "data-label-action": {},
      "data-label-stop": {}
    }
  },

  "week-view": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-start-date": {},
      "data-days": {},
      "data-start-hour": {},
      "data-end-hour": {},
      "data-label-continues": {},
      "data-label-time": {}
    }
  },

  "youtube-player": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "video-id": { required: true },
      "title": {},
      "start": {},
      "end": {},
      "list": {},
      "params": {},
      "autoplay": { boolean: true },
      "thumbnail": { enum: ["hq", "mq", "sd", "maxres"] },
      "poster": {},
      "data-label-play": {},
      "state": { enum: ["ready", "active"] }
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
