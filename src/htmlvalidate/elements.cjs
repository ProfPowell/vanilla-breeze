module.exports = {
  // ── Layout Custom Elements ────────────────────────────────────────

  "layout-stack": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": {
        enum: ["none", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"]
      },
      "data-align": {
        enum: ["start", "center", "end", "stretch"]
      }
    }
  },

  "layout-card": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-variant": {
        enum: ["elevated", "outlined", "ghost"]
      },
      "data-padding": {
        enum: ["none", "s", "m", "l", "xl"]
      }
    }
  },

  "layout-grid": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-min": {},
      "data-gap": {
        enum: ["none", "xs", "s", "m", "l", "xl"]
      }
    }
  },

  "layout-cluster": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": {
        enum: ["xs", "s", "m", "l", "xl"]
      },
      "data-justify": {
        enum: ["start", "end", "center", "between"]
      },
      "data-align": {
        enum: ["start", "end", "center", "stretch", "baseline"]
      },
      "data-nowrap": {
        boolean: true
      }
    }
  },

  "layout-center": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-max": {
        enum: ["narrow", "normal", "wide"]
      },
      "data-intrinsic": {
        boolean: true
      },
      "data-text": {
        boolean: true
      },
      "data-gutter": {
        enum: ["none", "s", "l"]
      }
    }
  },

  "layout-sidebar": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": {
        enum: ["xs", "s", "m", "l", "xl"]
      },
      "data-side": {
        enum: ["start", "end"]
      },
      "data-sidebar-width": {
        enum: ["narrow", "normal", "wide"]
      },
      "data-content-min": {
        enum: ["40", "50", "60"]
      },
      "data-nowrap": {
        boolean: true
      }
    }
  },

  "layout-cover": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-min-block": {},
      "data-gap": {
        enum: ["none", "xs", "s", "m", "l", "xl"]
      },
      "data-npad": {
        boolean: true
      }
    }
  },

  "layout-switcher": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-threshold": {},
      "data-gap": {
        enum: ["none", "xs", "s", "m", "l", "xl"]
      },
      "data-limit": {
        enum: ["2", "3", "4", "5"]
      }
    }
  },

  "layout-imposter": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-fixed": {
        boolean: true
      },
      "data-contain": {
        boolean: true
      }
    }
  },

  "layout-text": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "layout-reel": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": {
        enum: ["none", "xs", "s", "m", "l", "xl"]
      },
      "data-padding": {
        enum: ["none", "s", "m", "l"]
      },
      "data-item-width": {
        enum: ["auto", "s", "m", "l", "xl", "full"]
      },
      "data-align": {
        enum: ["start", "center", "end", "stretch"]
      },
      "data-scrollbar": {
        boolean: true
      }
    }
  },

  // ── Other Custom Elements ─────────────────────────────────────────

  "brand-mark": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-size": { enum: ["s", "l", "xl"] },
      "data-stack": { boolean: true }
    }
  },

  "dl": {
    flow: true,
    permittedContent: ["@script", "dt", "dd", "div", "dl-item"]
  },

  "dl-item": {
    flow: true,
    permittedContent: ["dt", "dd"]
  },

  "form-field": {
    flow: true,
    permittedContent: ["@flow"]
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

  // ── Web Components ────────────────────────────────────────────────

  "accordion-wc": {
    flow: true,
    permittedContent: ["details"],
    attributes: {
      "data-single": { boolean: true },
      "data-bordered": { boolean: true },
      "data-compact": { boolean: true }
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
      "data-autoplay": { boolean: true },
      "data-autoplay-delay": {},
      "data-loop": { boolean: true },
      "data-indicators": {},
      "data-item-width": {},
      "data-gap": { enum: ["xs", "s", "m", "l", "xl"] },
      "data-start": {},
      "data-persist": {},
      "data-transition": { enum: ["fade", "slide", "scale"] }
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
      "data-required": { boolean: true },
      "data-filter": { enum: ["startsWith", "contains"] },
      "data-value": {},
      "data-placeholder": {},
      "data-multiple": { boolean: true },
      "data-max": {},
      "data-allow-custom": { boolean: true }
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

  "compare-surface": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-position": {}
    }
  },

  "content-swap": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-transition": {
        enum: ["flip", "flip-vertical", "fade", "slide-left", "slide-up", "scale"]
      },
      "data-swapped": { boolean: true },
      "data-card": { boolean: true },
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
      "data-group": {},
      "data-orientation": { enum: ["horizontal"] },
      "data-drag-disabled": { boolean: true }
    }
  },

  "drop-down": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-position": {
        enum: ["bottom-start", "bottom-end", "top-start", "top-end"]
      }
    }
  },

  "emoji-picker": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "for": {},
      "data-open": { boolean: true },
      "recent-limit": {}
    }
  },

  "foot-notes": {
    flow: true,
    permittedContent: ["ol"],
    attributes: {
      "data-back-label": {}
    }
  },

  "foot-note": {
    flow: true,
    phrasing: true,
    permittedContent: ["@phrasing"]
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
      "data-levels": {}
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
      "data-mode": { enum: ["replace", "append", "prepend"] },
      "data-lazy": { boolean: true }
    }
  },

  "page-toc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-levels": {},
      "data-scope": {},
      "data-title": {}
    }
  },

  "print-page": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-raw-toggle": { boolean: true },
      "data-label": {}
    }
  },

  "qr-code": {
    flow: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "data-value": {},
      "data-size": {},
      "data-color": {},
      "data-background": {},
      "data-error-correction": {}
    }
  },

  "settings-panel": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "short-cuts": {
    flow: true,
    permittedContent: []
  },

  "site-search": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-open": { boolean: true }
    }
  },

  "slide-accept": {
    flow: true,
    permittedContent: ["@phrasing"],
    attributes: {
      "data-label": {},
      "data-activated-label": {},
      "data-attention": { enum: ["shimmer", "pulse"] },
      "data-threshold": {}
    }
  },

  "split-surface": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-direction": { enum: ["horizontal", "vertical"] },
      "data-position": {},
      "data-min": {},
      "data-max": {},
      "data-persist": {},
      "data-collapsible": { boolean: true }
    }
  },

  "star-rating": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "tab-set": {
    flow: true,
    permittedContent: ["details"],
    attributes: {
      "aria-label": {}
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
      "data-variant": { enum: ["popover", "inline"] },
      "data-open": { boolean: true }
    }
  },

  "toast-msg": {
    flow: true,
    permittedContent: [],
    attributes: {
      "data-position": {
        enum: ["top-start", "top-center", "top-end", "bottom-start", "bottom-center", "bottom-end"]
      },
      "data-duration": {},
      "data-max": {}
    }
  },

  "tool-tip": {
    flow: true,
    permittedContent: ["@flow", "template"],
    attributes: {
      "data-tooltip-position": { enum: ["top", "bottom", "left", "right"] },
      "data-tooltip-delay": {}
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

  // ── Doc-Site Components ───────────────────────────────────────────

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

  "vb-composer": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "vb-canvas": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-wireframe": { boolean: true }
    }
  },

  "vb-inspector": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "aria-label": {}
    }
  }
};
