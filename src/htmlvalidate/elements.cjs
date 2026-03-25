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

  "form-field": {
    flow: true,
    permittedContent: ["@flow"]
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

  "progress-ring": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "data-size": {},
      "data-indeterminate": { boolean: true }
    }
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

  "card-list": {
    flow: true,
    permittedContent: ["template", "@flow"],
    attributes: {
      "src": {},
      "data-items": {},
      "data-key": {},
      "data-layout": { enum: ["grid", "stack", "reel"] }
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

  "chart-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-type": { enum: ["bar", "column", "line", "area", "pie", "scatter", "bubble"] },
      "data-values": {},
      "data-config": {},
      "data-title": {},
      "data-legend": { boolean: true },
      "data-tooltip": { boolean: true },
      "data-palette": {},
      "data-chart": { enum: ["replace", "enhance"] }
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

  "color-palette": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "colors": {},
      "names": {},
      "layout": { enum: ["inline", "grid", "list"] },
      "show-values": { boolean: true },
      "show-names": { boolean: true },
      "size": { enum: ["sm", "md", "lg"] }
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-hotkey": {},
      "data-placeholder": {},
      "data-discover": { boolean: true }
    }
  },

  "compare-surface": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "position": {}
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

  "content-swap": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "transition": { enum: ["flip", "flip-vertical", "fade", "slide-left", "slide-up", "scale"] },
      "swapped": { boolean: true },
      "card": { boolean: true },
      "data-variant": { enum: ["elevated", "outlined", "ghost"] }
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

  "drag-surface": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "group": {},
      "orientation": { enum: ["horizontal"] },
      "disabled": { boolean: true }
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
      "open": { boolean: true },
      "recent-limit": {}
    }
  },

  "foot-note": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"]
  },

  "foot-notes": {
    flow: true,
    permittedContent: ["ol"],
    attributes: {
      "data-back-label": {}
    }
  },

  "geo-map": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "lat": {},
      "lng": {},
      "zoom": {}
    }
  },

  "heading-links": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "levels": {}
    }
  },

  "icon-wc": {
    flow: true,
    phrasing: true,
    permittedContent: [],
    attributes: {
      "name": { required: true },
      "set": { enum: ["lucide", "custom"] },
      "size": { enum: ["xs", "sm", "md", "lg", "xl", "2xl"] },
      "label": {},
      "base-path": {}
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

  "page-toc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "levels": {},
      "scope": {},
      "title": {}
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

  "print-page": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "raw-toggle": { boolean: true },
      "label": {}
    }
  },

  "qr-code": {
    flow: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "value": {},
      "size": {},
      "color": {},
      "background": {},
      "error-correction": {}
    }
  },

  "settings-panel": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "open": { boolean: true }
    }
  },

  "short-cuts": {
    flow: true,
    permittedContent: []
  },

  "site-search": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "open": { boolean: true }
    }
  },

  "slide-accept": {
    flow: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "label": {},
      "activated-label": {},
      "attention": { enum: ["shimmer", "pulse"] },
      "threshold": {}
    }
  },

  "social-embed": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "url": { required: true },
      "provider": {},
      "theme": { enum: ["light", "dark", "auto"] },
      "activate": { enum: ["click", "visible", "eager"] },
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
      "collapsible": { boolean: true }
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
      "required": { boolean: true }
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
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "selectors": {},
      "speed": {},
      "voice": {},
      "highlight": { boolean: true },
      "scroll": { boolean: true }
    }
  },

  "theme-picker": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "variant": { enum: ["popover", "inline"] },
      "compact": { boolean: true },
      "open": { boolean: true }
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

  "tool-tip": {
    flow: true,
    permittedContent: ["@flow", "template"],
    attributes: {
      "variant": { enum: ["card"] },
      "content": {},
      "position": { enum: ["top", "bottom", "left", "right"] },
      "delay": {}
    }
  },

  "type-specimen": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "font-family": {},
      "label": {},
      "sample": {},
      "show-scale": { boolean: true },
      "show-weights": { boolean: true },
      "show-characters": { boolean: true },
      "weights": {}
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
