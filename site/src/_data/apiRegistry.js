// @generated from api.json manifests — do not edit by hand
export default {
  "layout-badge": {
    "element": "layout-badge",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "phrasing": true,
      "permittedContent": [
        "@phrasing"
      ]
    },
    "attributes": [
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "sm",
          "lg"
        ]
      },
      {
        "name": "data-color",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "primary",
          "success",
          "warning",
          "danger",
          "info"
        ]
      },
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "string"
      }
    ]
  },
  "layout-card": {
    "element": "layout-card",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "elevated",
          "outlined",
          "ghost"
        ]
      },
      {
        "name": "data-padding",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "s",
          "m",
          "l",
          "xl"
        ]
      }
    ]
  },
  "layout-center": {
    "element": "layout-center",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-max",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide"
        ]
      },
      {
        "name": "data-intrinsic",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "data-text",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "data-gutter",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "s",
          "l"
        ]
      }
    ]
  },
  "layout-cluster": {
    "element": "layout-cluster",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ]
      },
      {
        "name": "data-justify",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "end",
          "center",
          "between"
        ]
      },
      {
        "name": "data-align",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "end",
          "center",
          "stretch",
          "baseline"
        ]
      },
      {
        "name": "data-nowrap",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "layout-cover": {
    "element": "layout-cover",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-min-block",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ]
      },
      {
        "name": "data-npad",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "layout-grid": {
    "element": "layout-grid",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-min",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ]
      }
    ]
  },
  "layout-imposter": {
    "element": "layout-imposter",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-fixed",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "data-contain",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "layout-reel": {
    "element": "layout-reel",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ]
      },
      {
        "name": "data-padding",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "s",
          "m",
          "l"
        ]
      },
      {
        "name": "data-item-width",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "auto",
          "s",
          "m",
          "l",
          "xl",
          "full"
        ]
      },
      {
        "name": "data-align",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "center",
          "end",
          "stretch"
        ]
      },
      {
        "name": "data-scrollbar",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "layout-sidebar": {
    "element": "layout-sidebar",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ]
      },
      {
        "name": "data-side",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "end"
        ]
      },
      {
        "name": "data-sidebar-width",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide"
        ]
      },
      {
        "name": "data-content-min",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "40",
          "50",
          "60"
        ]
      },
      {
        "name": "data-nowrap",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "layout-specimen": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "layout-specimen",
    "type": "web-component",
    "description": "Visual specimen of VB layout primitives for design-system docs. Renders each primitive with a labeled mini-example and the canonical HTML snippet.",
    "attributes": [
      {
        "name": "data-only",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated subset of primitive names to render (e.g. \"cluster,grid,stack\"; with or without the \"layout-\" prefix). Default: all 14 primitives."
      }
    ],
    "events": [],
    "childAttributes": [],
    "structure": []
  },
  "layout-stack": {
    "element": "layout-stack",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "3xs",
          "2xs",
          "xs",
          "s",
          "m",
          "l",
          "xl",
          "2xl",
          "3xl"
        ]
      },
      {
        "name": "data-align",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "center",
          "end",
          "stretch"
        ]
      }
    ]
  },
  "layout-switcher": {
    "element": "layout-switcher",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-threshold",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ]
      },
      {
        "name": "data-limit",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "2",
          "3",
          "4",
          "5"
        ]
      }
    ]
  },
  "layout-text": {
    "element": "layout-text",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": []
  },
  "brand-mark": {
    "element": "brand-mark",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "s",
          "l",
          "xl"
        ]
      },
      {
        "name": "data-stack",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean"
      }
    ]
  },
  "browser-window": {
    "element": "browser-window",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "title",
        "kind": "native",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "shadow",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean"
      }
    ]
  },
  "calendar-event": {
    "element": "calendar-event",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-category",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-start",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-duration",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "chat-bubble": {
    "element": "chat-bubble",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": []
  },
  "chat-message": {
    "element": "chat-message",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-role",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "user",
          "agent",
          "system"
        ]
      },
      {
        "name": "data-from",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-from-label",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-status",
        "kind": "data",
        "purpose": "semantic-state",
        "type": "string"
      },
      {
        "name": "data-model",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "chat-thread": {
    "element": "chat-thread",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": []
  },
  "code-block": {
    "element": "code-block",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "language",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "show-lines",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "day-schedule": {
    "element": "day-schedule",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-date",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "dl-item": {
    "element": "dl-item",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "dt",
        "dd"
      ]
    },
    "attributes": []
  },
  "fab-stack": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "fab-stack",
    "type": "custom-element",
    "description": "Fixed action button stack. Pins to one of 8 screen positions via the shared data-float system; stacks children vertically with a gap. Default position is bottom-right.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-float",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "top-left",
          "top-center",
          "top-right",
          "center-left",
          "center-right",
          "bottom-left",
          "bottom-center",
          "bottom-right"
        ],
        "default": "bottom-right",
        "description": "Screen position via the shared [data-float] system. Mirrors in RTL (left/right are logical inline-start/end)."
      }
    ],
    "structure": [
      {
        "element": "<settings-panel>",
        "description": "Site settings trigger (primary action)"
      },
      {
        "element": "<a data-back-to-top>",
        "description": "Scroll-to-top button (secondary action)"
      }
    ],
    "css": {
      "tokens": [
        {
          "name": "--float-offset",
          "description": "Distance from the edge (default: var(--size-l))"
        },
        {
          "name": "--fab-stack-gap",
          "description": "Gap between stacked buttons (default: var(--size-s))"
        }
      ]
    }
  },
  "hour-view": {
    "element": "hour-view",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-overlap",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "loading-spinner": {
    "element": "loading-spinner",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "phrasing": true,
      "permittedContent": [
        "@phrasing"
      ]
    },
    "attributes": [
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ]
      },
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "string"
      },
      {
        "name": "data-overlay",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "mobile-menu": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "mobile-menu",
    "type": "custom-element",
    "description": "Responsive mobile navigation menu with hamburger toggle and popover panel",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "breakpoint",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS length at which mobile mode activates (default: 52rem)"
      }
    ],
    "structure": [
      {
        "element": "<button data-trigger>",
        "description": "Hamburger toggle button (auto-generated or slotted)"
      },
      {
        "element": "<nav popover>",
        "description": "Popover panel containing mobile navigation"
      }
    ],
    "css": {
      "tokens": [
        {
          "name": "--mobile-menu-bg",
          "description": "Panel background color"
        },
        {
          "name": "--mobile-menu-radius",
          "description": "Panel border radius"
        },
        {
          "name": "--mobile-menu-shadow",
          "description": "Panel box shadow"
        },
        {
          "name": "--mobile-menu-padding",
          "description": "Panel padding"
        },
        {
          "name": "--mobile-menu-max-width",
          "description": "Panel maximum width"
        },
        {
          "name": "--mobile-menu-backdrop",
          "description": "Backdrop overlay color"
        }
      ]
    }
  },
  "site-legal": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "site-legal",
    "type": "custom-element",
    "description": "Legal and compliance content container for copyright, license, privacy, and terms links",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [],
    "structure": [
      {
        "element": "<span>",
        "description": "Copyright or license text"
      },
      {
        "element": "<a>",
        "description": "Legal page link (privacy, terms)"
      }
    ],
    "css": {
      "tokens": []
    }
  },
  "site-tools": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "site-tools",
    "type": "custom-element",
    "description": "Site-wide utility container for header and footer actions like search, theme picker, and settings",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [],
    "structure": [
      {
        "element": "<site-search>",
        "description": "Search trigger and dialog"
      },
      {
        "element": "<theme-picker>",
        "description": "Theme selection panel"
      },
      {
        "element": "<settings-panel>",
        "description": "Full settings panel"
      }
    ],
    "css": {
      "tokens": []
    }
  },
  "status-message": {
    "element": "status-message",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": []
  },
  "text-divider": {
    "element": "text-divider",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@phrasing"
      ]
    },
    "attributes": []
  },
  "user-avatar": {
    "element": "user-avatar",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": []
  },
  "vb-canvas": {
    "element": "vb-canvas",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-wireframe",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "vb-composer": {
    "element": "vb-composer",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": []
  },
  "vb-inspector": {
    "element": "vb-inspector",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "semantic-state",
        "type": "string"
      }
    ]
  },
  "accessibility-specimen": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "accessibility-specimen",
    "type": "web-component",
    "description": "WCAG contrast-ratio table + a11y checklist for design-system docs. Default mode: tabular display of color pairs with computed contrast ratio + AA/AAA badges. Checklist mode: slot-driven WCAG checklist with status icons.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "type",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "\"contrast\" (default) | \"checklist\""
      }
    ],
    "events": [],
    "childAttributes": [
      {
        "name": "data-fg",
        "on": "button",
        "type": "string",
        "required": true,
        "description": "Foreground color (hex / rgb() / named); contrast mode"
      },
      {
        "name": "data-bg",
        "on": "button",
        "type": "string",
        "required": true,
        "description": "Background color (hex / rgb() / named); contrast mode"
      },
      {
        "name": "data-label",
        "on": "button",
        "type": "string",
        "description": "Display label for the pair; defaults to button text content"
      },
      {
        "name": "data-status",
        "on": "li",
        "type": "string",
        "description": "Checklist mode: pass | fail | warn | na (default: na)"
      }
    ],
    "structure": []
  },
  "accordion-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "accordion-wc",
    "type": "web-component",
    "description": "Accordion built on native details/summary with exclusive mode and transitions",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "details"
      ]
    },
    "attributes": [
      {
        "name": "single",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Only allow one panel open at a time"
      },
      {
        "name": "bordered",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Add borders between panels"
      },
      {
        "name": "flush",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Remove outer border and padding"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Reduce spacing"
      },
      {
        "name": "indicator",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "plus-minus",
          "none",
          "custom"
        ],
        "description": "Expand/collapse indicator style"
      },
      {
        "name": "transition",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "fade",
          "slide",
          "scale"
        ],
        "description": "Panel transition animation"
      }
    ],
    "structure": [
      {
        "element": "<details>",
        "description": "One per accordion panel — native disclosure element"
      },
      {
        "element": "<summary>",
        "description": "Panel heading inside each <details>"
      }
    ]
  },
  "activity-feed": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "activity-feed",
    "type": "web-component",
    "description": "WAI-ARIA Feed timeline of user actions. Author renders <article data-activity data-time=ISO> children; component decorates with relative-time badges, optional date grouping, optional infinite-scroll sentinel, and per-entry avatar / icon left-rail.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Region label (default \"Recent activity\")"
      },
      {
        "name": "data-group",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "none (default) | day | week — date headings between entries"
      },
      {
        "name": "data-infinite",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Adds an IntersectionObserver sentinel; emits activity-feed:load-more when reached"
      },
      {
        "name": "data-empty-text",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Text shown when the feed has zero entries (default \"No recent activity\")"
      },
      {
        "name": "role",
        "kind": "aria",
        "purpose": "config",
        "description": "Set to \"feed\" per WAI-ARIA Feed pattern"
      },
      {
        "name": "aria-busy",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "activity-feed:load-more",
        "description": "Fires when the infinite-scroll sentinel enters the viewport"
      }
    ],
    "properties": [
      {
        "name": "addEntry",
        "type": "(data, opts?) => HTMLElement",
        "description": "Append (or prepend) an entry from data"
      },
      {
        "name": "removeEntry",
        "type": "(entry) => void",
        "description": "Remove a single entry element"
      },
      {
        "name": "clear",
        "type": "() => void",
        "description": "Remove every entry"
      },
      {
        "name": "entries",
        "type": "HTMLElement[]",
        "description": "Live list of decorated entry elements"
      }
    ],
    "childAttributes": [
      {
        "name": "data-activity",
        "on": "article",
        "type": "boolean",
        "required": true,
        "description": "Marks an article as a feed entry"
      },
      {
        "name": "data-time",
        "on": "article",
        "type": "string",
        "required": true,
        "description": "ISO-8601 timestamp; renders as relative time"
      },
      {
        "name": "data-activity-avatar",
        "on": "article",
        "type": "string",
        "description": "Avatar URL — renders <user-avatar> in the left rail"
      },
      {
        "name": "data-activity-icon",
        "on": "article",
        "type": "string",
        "description": "icon-wc name — renders <icon-wc> in the left rail (alternative to avatar)"
      }
    ],
    "structure": []
  },
  "adr-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "adr-wc",
    "type": "web-component",
    "description": "MADR-format Architectural Decision Record card with status, context, decision, consequences, and cross-referencing via supersedes chains",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "adr-id",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ADR identifier (e.g., ADR-001), auto-sets HTML id"
      },
      {
        "name": "status",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Status: proposed | accepted | deprecated | superseded"
      },
      {
        "name": "supersedes",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ADR IDs this supersedes"
      },
      {
        "name": "superseded-by",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ADR IDs that supersede this"
      },
      {
        "name": "detail",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Detail level: full | compact | minimal"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Alias for detail=compact"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON data"
      }
    ],
    "slots": [
      {
        "name": "title",
        "description": "Decision heading (e.g., <h2>)"
      },
      {
        "name": "date",
        "description": "Decision date (e.g., <time datetime=\"...\">)"
      },
      {
        "name": "context",
        "description": "Why the decision was needed"
      },
      {
        "name": "decision",
        "description": "What was decided"
      },
      {
        "name": "consequences",
        "description": "Outcomes (positive and negative)"
      }
    ],
    "events": [
      {
        "name": "adr-wc:ready",
        "detail": "{ adrId, title, status }",
        "description": "Fired after render"
      }
    ]
  },
  "ai-chat": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "ai-chat",
    "type": "web-component",
    "description": "On-device chat via Chrome's LanguageModel API. Optionally page-aware via context selector. Inline endpoint and external deep-link fallbacks. Conforms to admin/specs/ai-page-tools-v1.md.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "template",
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "context",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector of a page region whose text is folded into the system prompt. Empty = general chat."
      },
      {
        "name": "context-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Human-friendly label for the context region (shown in the ribbon and used in the system prompt header)."
      },
      {
        "name": "system",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "System-prompt prefix. May also be supplied via <template data-role='system'>; attribute wins."
      },
      {
        "name": "placeholder",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Type a message…",
        "description": "Textarea placeholder text. Reactive via attributeChangedCallback."
      },
      {
        "name": "endpoint",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Inline-fallback HTTP URL (POST JSON, streamed text/plain or one-shot application/json)."
      },
      {
        "name": "fallback-url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Deep-link URL template. Tokens: {prompt} {url} {title} {content}. Provider-neutral."
      },
      {
        "name": "fallback-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Override the deep-link option label in the chat-window provider select."
      },
      {
        "name": "fallback-prompt",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Help me explore this article: {title} ({url})",
        "description": "Override the {prompt} string substituted into fallback-url."
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "checking",
          "ready",
          "downloading",
          "streaming",
          "error",
          "unavailable"
        ],
        "direction": "output",
        "public": true,
        "description": "Lifecycle state. Per admin/specs/ai-page-tools-v1.md."
      },
      {
        "name": "data-context-state",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "ok",
          "large",
          "missing"
        ],
        "direction": "output",
        "public": false,
        "description": "Reflects extracted page context size against the Nano budget."
      }
    ],
    "events": [
      {
        "name": "ai-chat:state",
        "detail": "{ state, provider }",
        "description": "Fires on every data-state transition."
      },
      {
        "name": "ai-chat:message",
        "detail": "{ role, text }",
        "description": "Fires once per completed message (user or assistant)."
      },
      {
        "name": "ai-chat:context-overflow",
        "detail": "{}",
        "description": "Bubbled from the underlying session's contextoverflow event."
      },
      {
        "name": "ai-chat:error",
        "detail": "{ error }",
        "description": "Fires when generation fails."
      }
    ],
    "properties": [],
    "methods": [
      {
        "name": "reset()",
        "returns": "Promise<void>",
        "description": "Destroy the current session and clear the log."
      }
    ]
  },
  "ai-summary": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "ai-summary",
    "type": "web-component",
    "description": "Summarise wrapped content via Chrome's Summarizer API, with optional inline endpoint fallback and external deep-link fallback. Conforms to admin/specs/ai-page-tools-v1.md.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "type",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "key-points",
          "tldr",
          "teaser",
          "headline"
        ],
        "default": "key-points",
        "description": "Summarizer type — passed through to Summarizer.create()."
      },
      {
        "name": "length",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "short",
          "medium",
          "long"
        ],
        "default": "medium",
        "description": "Summary length hint."
      },
      {
        "name": "format",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "markdown",
          "plain-text"
        ],
        "default": "markdown",
        "description": "Output format."
      },
      {
        "name": "shared-context",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional shared context passed to Summarizer.create()."
      },
      {
        "name": "endpoint",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Inline-fallback HTTP URL (POST JSON, streamed text/plain or one-shot application/json). Wire format: admin/specs/ai-page-tools-v1.md §C."
      },
      {
        "name": "fallback-url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Deep-link URL template. Tokens: {prompt} {url} {title} {content}. Provider-neutral."
      },
      {
        "name": "fallback-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Override the trigger label when in deep-link mode."
      },
      {
        "name": "fallback-prompt",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Summarize this article: {url}",
        "description": "Override the {prompt} string substituted into fallback-url."
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "checking",
          "ready",
          "downloading",
          "streaming",
          "complete",
          "error",
          "unavailable",
          "deep-link"
        ],
        "direction": "output",
        "public": true,
        "description": "Lifecycle state. Per admin/specs/ai-page-tools-v1.md."
      }
    ],
    "events": [
      {
        "name": "ai-summary:state",
        "detail": "{ state, provider }",
        "description": "Fires on every data-state transition. Provider is one of 'local'|'endpoint'|'deep-link'|'unavailable'."
      },
      {
        "name": "ai-summary:result",
        "detail": "{ text, provider }",
        "description": "Fires once with the full summary on stream completion."
      },
      {
        "name": "ai-summary:error",
        "detail": "{ error }",
        "description": "Fires on any failure path (network, AI API, parsing)."
      }
    ],
    "properties": [],
    "methods": []
  },
  "analytics-panel": {
    "$schema": "../../schemas/api.schema.json",
    "element": "analytics-panel",
    "type": "web-component",
    "description": "Self-serve view of analytics data stored on the device — shows what's been captured this session, with Pause and Clear controls.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Override the panel heading (default: \"Analytics data\")"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Tighter layout for embedding alongside other UI"
      }
    ],
    "structure": [],
    "childAttributes": [],
    "events": [
      {
        "name": "analytics-panel:cleared",
        "description": "Fired after session data is cleared by the user"
      },
      {
        "name": "analytics-panel:optout",
        "description": "Fired when the user pauses analytics for this tab"
      },
      {
        "name": "analytics-panel:optin",
        "description": "Fired when the user resumes analytics for this tab"
      }
    ]
  },
  "audio-player": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "audio-player",
    "type": "web-component",
    "description": "Platform audio player web component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "autoplay",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Start playing on load (subject to browser autoplay policy)"
      },
      {
        "name": "loop",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Loop single track or entire playlist"
      },
      {
        "name": "shuffle",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Randomize playlist order"
      },
      {
        "name": "controls",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "state",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-audio-played",
        "kind": "data",
        "purpose": "semantic-state"
      },
      {
        "name": "muted",
        "kind": "host-api",
        "purpose": "semantic-state"
      },
      {
        "name": "data-audio-active",
        "kind": "data",
        "purpose": "semantic-state"
      }
    ],
    "events": [
      {
        "name": "audio-player:play"
      },
      {
        "name": "audio-player:pause"
      },
      {
        "name": "audio-player:ended"
      },
      {
        "name": "audio-player:track-change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "audio-visualizer": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "audio-visualizer",
    "type": "web-component",
    "description": "Canvas-based audio visualization companion",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "for",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Required. ID of the target <audio> element"
      },
      {
        "name": "data-mode",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Visualization mode: \"bars\" (default), \"waveform\", \"circle\""
      },
      {
        "name": "data-fft-size",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "AnalyserNode FFT size (power of 2, 32-32768). Default: 256"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "author-index": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "author-index",
    "type": "web-component",
    "description": "Author-grouped view of site content",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-lens-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "URL to pages.json (or compatible source)"
      },
      {
        "name": "src",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Alias for data-lens-src"
      },
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Search input placeholder (default \"Filter authors…\")"
      },
      {
        "name": "sort",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Sort mode: \"alpha\" (default) | \"count\""
      }
    ]
  },
  "bread-crumb": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "bread-crumb",
    "type": "web-component",
    "description": "Hierarchical navigation trail. Wraps existing <ol> markup HTML-first, or auto-generates from window.location.pathname. Emits BreadcrumbList JSON-LD for SEO.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-from-pathname",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "When present, auto-generates the trail from window.location.pathname. Each path segment becomes a crumb (Title-Cased by default; override per segment via the .labels property)."
      },
      {
        "name": "data-current-label",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Label for the final (current page) crumb when auto-generating. If omitted, the document title or last path segment is used."
      },
      {
        "name": "data-separator",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "string",
        "description": "Separator glyph variant: 'chevron' (default), 'arrow', 'dot', 'pipe'. Drives the --_separator CSS var."
      },
      {
        "name": "data-collapsed",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Hide middle items, showing only first and last with an ellipsis in between."
      },
      {
        "name": "data-jsonld",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "BreadcrumbList JSON-LD emission: 'on' (default) or 'off'."
      }
    ],
    "childAttributes": [
      {
        "name": "data-truncated",
        "on": "li",
        "type": "boolean",
        "description": "Apply to a crumb <li> to truncate long labels with an ellipsis (max-width 10rem)."
      }
    ],
    "structure": []
  },
  "breakpoint-specimen": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "breakpoint-specimen",
    "type": "web-component",
    "description": "Responsive breakpoint visualization with live width readout",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "tokens",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated breakpoint names (default: \"sm,md,lg,xl\")"
      },
      {
        "name": "prefix",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS variable prefix (default: \"--bp-\")"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label"
      },
      {
        "name": "data-observe",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector of a container to track instead of the viewport. Container-query mode (JS-only)."
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "burndown-chart": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "burndown-chart",
    "type": "web-component",
    "description": "Sprint burndown plot. Wraps <chart-wc> with auto-computed ideal line and scope-change annotations.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "start",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Sprint start date (ISO 8601, required)"
      },
      {
        "name": "end",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Sprint end date (ISO 8601, inclusive, required)"
      },
      {
        "name": "total",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Total points/items at sprint start (required)"
      },
      {
        "name": "unit",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Display unit, default \"points\""
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading text (e.g. \"Sprint 14\")"
      },
      {
        "name": "weekends",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "include",
          "exclude"
        ],
        "description": "Whether weekends count toward the ideal-line slope"
      }
    ],
    "structure": [
      {
        "element": "<template>",
        "description": "Inline data source: <tr> rows with cells [date YYYY-MM-DD, remaining, optional ±delta scope-change]"
      }
    ],
    "childAttributes": [],
    "events": [
      {
        "name": "burndown-chart:ready",
        "detail": "{ dayCount, total, scopeChanges }",
        "description": "Fired after the chart renders"
      }
    ]
  },
  "calendar-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "calendar-wc",
    "type": "web-component",
    "description": "Standalone calendar display with rich cell content",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-month",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Initial month (1-12). Defaults to current."
      },
      {
        "name": "data-year",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Initial year. Defaults to current."
      },
      {
        "name": "data-events",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "JSON: events keyed by start ISO date. Values may be a string, an object, or an array of events. Each event accepts optional `end` (ISO date, inclusive) or `days` (count) to span multiple days; spans render as continuous bars in data-size=\"large\"."
      },
      {
        "name": "data-selection",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Selection mode: \"none\" (default), \"single\", \"range\", \"multi\""
      },
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Size: \"compact\", \"default\", \"large\""
      },
      {
        "name": "data-min-date",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Earliest selectable/navigable date (ISO string, e.g. 2026-01-01)"
      },
      {
        "name": "data-max-date",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Latest selectable/navigable date (ISO string, e.g. 2026-12-31)"
      },
      {
        "name": "data-disabled-dates",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ISO dates to disable"
      },
      {
        "name": "data-highlight-dates",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ISO dates to highlight (optionally with :category)"
      },
      {
        "name": "data-months",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Number of adjacent months to display side by side (1-12). Defaults to 1."
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-date",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-selected",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-range-start",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-range-end",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-in-range",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-week",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-outside-month",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-day",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-today",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-highlight",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-event-count",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form participation name. Enables ElementInternals form value sync on selection."
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-event-dot",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "title",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "calendar:navigate"
      },
      {
        "name": "calendar:select"
      },
      {
        "name": "calendar:day-open"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "capacity-plan": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "capacity-plan",
    "type": "web-component",
    "description": "Compact ledger that ties iron-triangle capacity, quality-target spend, and slotted work-item costs into a stacked-bar plan view. Auto-binds via data-bind-triangle and data-bind-quality.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-bind-triangle",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID of a sibling <iron-triangle> to read capacityPoints from"
      },
      {
        "name": "data-bind-quality",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID of a sibling <quality-target> to read criticalSum from"
      }
    ],
    "slots": [
      {
        "name": "(default)",
        "description": "Slot any elements with data-capacity-cost (notably <work-item>) and the plan sums them as the feature spend"
      }
    ],
    "events": [
      {
        "name": "capacity-plan:overdrawn",
        "detail": "{ ledger, source }",
        "description": "Fires when the slack crosses zero in either direction (edge-triggered)"
      }
    ]
  },
  "card-list": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "card-list",
    "type": "web-component",
    "description": "Template-based list rendering with SAFE data binding",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-items",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-key",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-loading",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-field",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-field-attr",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-field-html",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-field-if",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-field-unless",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "card-list:rendered"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "carousel-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "carousel-wc",
    "type": "web-component",
    "description": "Scrolling carousel with autoplay, looping, indicators, and view transitions",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "autoplay",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Auto-advance slides"
      },
      {
        "name": "autoplay-delay",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Delay between auto-advance in milliseconds"
      },
      {
        "name": "loop",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Loop back to start after last slide"
      },
      {
        "name": "indicators",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Show slide position indicators"
      },
      {
        "name": "item-width",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS width for each slide item"
      },
      {
        "name": "gap",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ],
        "description": "Gap between slides"
      },
      {
        "name": "start",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Initial slide index"
      },
      {
        "name": "persist",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "localStorage key for position persistence"
      },
      {
        "name": "transition",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "fade",
          "slide",
          "scale"
        ],
        "description": "View Transition animation between slides"
      }
    ],
    "structure": [
      {
        "element": "any child elements",
        "description": "Each direct child becomes a slide"
      }
    ]
  },
  "change-set": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "change-set",
    "type": "web-component",
    "description": "Interactive change tracking group",
    "attributes": [
      {
        "name": "view",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "'final' | 'original' | omitted (tracking)"
      },
      {
        "name": "datetime",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ISO date of the change set"
      },
      {
        "name": "author",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Author of the changes"
      },
      {
        "name": "data-controls",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "aria-pressed",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "change-set:view"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "chart-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "chart-wc",
    "type": "web-component",
    "description": "SVG chart component with progressive enhancement: semantic table → CSS chart → SVG chart.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-type",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "bar",
          "column",
          "line",
          "area",
          "pie",
          "ring",
          "scatter",
          "bubble"
        ],
        "description": "Chart type to render"
      },
      {
        "name": "data-values",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Chart data as JSON string"
      },
      {
        "name": "data-config",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Chart config overrides as JSON string"
      },
      {
        "name": "data-title",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Chart title text"
      },
      {
        "name": "data-legend",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Show legend (presence enables)"
      },
      {
        "name": "data-tooltip",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Enable tooltips (presence enables)"
      },
      {
        "name": "data-palette",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Custom color palette as JSON array"
      },
      {
        "name": "data-chart",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "replace",
          "enhance"
        ],
        "description": "How to handle source table: replace hides table, enhance keeps both"
      },
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "sparkline"
        ],
        "description": "Render mode. sparkline strips all chrome (axes, ticks, gridlines, labels, title, legend, tooltip) for use as an inline trend chart sized by its container."
      }
    ],
    "structure": [
      {
        "element": "<table>",
        "description": "Optional source table — data is extracted and table becomes screen-reader accessible"
      },
      {
        "element": "<script type='application/json'>",
        "description": "Optional inline JSON data source"
      },
      {
        "element": "<template data-chart-data>",
        "description": "Optional template-based JSON data source"
      }
    ],
    "childAttributes": [
      {
        "name": "data-chart-series",
        "on": "th",
        "type": "boolean",
        "description": "Mark this column as a data series for chart extraction"
      },
      {
        "name": "data-chart-label",
        "on": "th",
        "type": "boolean",
        "description": "Mark this column as the label/category axis"
      },
      {
        "name": "data-chart-ignore",
        "on": "th",
        "type": "boolean",
        "description": "Exclude this column from chart data extraction"
      }
    ],
    "events": [
      {
        "name": "chart-wc:render",
        "detail": "{ type, seriesCount }",
        "description": "Fired after SVG chart renders successfully"
      },
      {
        "name": "chart-wc:error",
        "detail": "{ message }",
        "description": "Fired when chart rendering fails"
      }
    ],
    "properties": [
      {
        "name": "data",
        "type": "Array|Object",
        "description": "Get/set chart data programmatically"
      },
      {
        "name": "config",
        "type": "Object",
        "description": "Get/set chart config programmatically"
      }
    ],
    "methods": [
      {
        "name": "refresh()",
        "description": "Re-extract table data and re-render"
      },
      {
        "name": "toSVG()",
        "returns": "string|null",
        "description": "Get current SVG markup"
      }
    ]
  },
  "chat-input": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "chat-input",
    "type": "web-component",
    "description": "Form-associated chat input with auto-growing textarea",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name (default: \"message\")"
      },
      {
        "name": "maxlength",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Character limit (default: 4000)"
      },
      {
        "name": "minlength",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Minimum length to send (default: 1)"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Disables input and controls"
      },
      {
        "name": "autofocus",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Focus textarea on connect"
      }
    ],
    "events": [
      {
        "name": "chat-input:input"
      },
      {
        "name": "chat-input:send"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "chat-window": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "chat-window",
    "type": "web-component",
    "description": "Light DOM orchestrator for chat UI",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "endpoint",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "API endpoint for chat requests (omit for custom transport)"
      },
      {
        "name": "model",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Active model; synced with [data-model-select] (property-driven after connect)"
      },
      {
        "name": "empty-message",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Empty thread placeholder text"
      },
      {
        "name": "data-from",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-from-label",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-status",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-role",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-model",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-chat-empty",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "chat-window:error"
      },
      {
        "name": "chat-window:send"
      },
      {
        "name": "chat-window:model-change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "color-palette": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "color-palette",
    "type": "web-component",
    "description": "Interactive color swatch display",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "colors",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated color values (hex, rgb, oklch, etc.)"
      },
      {
        "name": "names",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated swatch labels (optional)"
      },
      {
        "name": "layout",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Display mode: \"inline\" (default), \"grid\", \"list\""
      },
      {
        "name": "show-values",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Always show color values (otherwise hover-only)"
      },
      {
        "name": "show-names",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show name labels below swatches (auto-enabled if names attr set)"
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Swatch size: \"sm\", \"md\" (default), \"lg\""
      },
      {
        "name": "editable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Click a swatch to edit its color via the native OS picker. Updates the colors attribute and fires color-palette:change."
      }
    ],
    "events": [
      {
        "name": "color-palette:select"
      },
      {
        "name": "color-palette:change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "color-picker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "color-picker",
    "type": "web-component",
    "description": "Form-associated color picker with HSL color space",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Disables the picker"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Makes selection required"
      },
      {
        "name": "data-disabled",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "aria-haspopup",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-valuemin",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuemax",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "data-color",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-channel",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "maxlength",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "spellcheck",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "autocomplete",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-valuetext",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuenow",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "open",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "format",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "hex",
          "rgb",
          "hsl",
          "oklch"
        ],
        "default": "hex",
        "description": "Initial input/copy format. Selector inside the picker lets users switch at runtime."
      }
    ],
    "events": [
      {
        "name": "color-picker:change"
      },
      {
        "name": "color-picker:open"
      },
      {
        "name": "color-picker:close"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "combo-box": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "combo-box",
    "type": "web-component",
    "description": "Autocomplete combobox with filtering, keyboard navigation, and native form association",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Require a selection for form validation"
      },
      {
        "name": "filter",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "contains",
          "startsWith"
        ],
        "default": "contains",
        "description": "How typing filters the options"
      },
      {
        "name": "value",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "direction": "both",
        "description": "Selected value (single mode)"
      },
      {
        "name": "placeholder",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Input placeholder text"
      },
      {
        "name": "multiple",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Enable multi-select tag mode"
      },
      {
        "name": "max",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Maximum number of tags (multi mode)"
      },
      {
        "name": "custom",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Allow typed entries via Enter/comma (multi mode)"
      },
      {
        "name": "open",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Reflected when the listbox is open"
      }
    ],
    "structure": [
      {
        "element": "<input type=\"text\">",
        "description": "Text input for filtering and display"
      },
      {
        "element": "<ul> or <ol>",
        "description": "Options list container"
      },
      {
        "element": "<li data-value>",
        "description": "Individual option — one per selectable choice"
      }
    ],
    "childAttributes": [
      {
        "name": "data-value",
        "on": "li",
        "type": "string",
        "required": true,
        "description": "Option value identifier placed on each <li> in the options list"
      }
    ],
    "events": [
      {
        "name": "combo-box:change",
        "detail": "{ value, label } | { values[], labels[] }",
        "description": "Fired when selection changes"
      },
      {
        "name": "combo-box:open",
        "description": "Fired when the listbox opens"
      },
      {
        "name": "combo-box:close",
        "description": "Fired when the listbox closes"
      }
    ]
  },
  "command-group": {
    "element": "command-group",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "command-item": {
    "element": "command-item",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@phrasing"
      ]
    },
    "attributes": [
      {
        "name": "value",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-shortcut",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "command-palette": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "command-palette",
    "type": "web-component",
    "description": "Command palette / Cmd+K launcher",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "hotkey",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Global keyboard shortcut to open (default: \"meta+k\")"
      },
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Search input placeholder text"
      },
      {
        "name": "discover",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "When present, auto-populate from [data-command] registry"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "value",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-hotkey",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "name",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "command-palette:select"
      },
      {
        "name": "command-palette:open"
      },
      {
        "name": "command-palette:close"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "comment-box": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "comment-box",
    "type": "web-component",
    "description": "Form-associated comment form composing <markdown-editor> + Submit / Cancel buttons. Used standalone or as the reply-form template inside <comment-thread>. Presentational with respect to persistence.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name (submitted with parent form)"
      },
      {
        "name": "value",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Pre-filled markdown content (e.g. for edit mode)"
      },
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Editor placeholder text"
      },
      {
        "name": "submit-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Submit button label (default \"Comment\")"
      },
      {
        "name": "cancel-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Cancel button label (default \"Cancel\")"
      },
      {
        "name": "data-show-cancel",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Render the Cancel button"
      },
      {
        "name": "data-min-length",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Minimum character length for validation"
      },
      {
        "name": "data-max-length",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Maximum character length for validation; also shows a counter"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean"
      }
    ],
    "events": [
      {
        "name": "comment-box:submit",
        "detail": "{ value }",
        "description": "Bubbles. Cancellable via preventDefault() — preserves the value for failure-recovery flows. On success the value is cleared automatically."
      },
      {
        "name": "comment-box:cancel",
        "detail": "{ value }",
        "description": "Cancel button clicked"
      },
      {
        "name": "comment-box:input",
        "detail": "{ value, length }",
        "description": "Fires on every keystroke"
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string",
        "description": "Get/set the current markdown content"
      },
      {
        "name": "form",
        "type": "HTMLFormElement | null",
        "description": "The associated form"
      },
      {
        "name": "validity",
        "type": "ValidityState"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "comment-thread": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "comment-thread",
    "type": "web-component",
    "description": "Persistent threaded-discussion container. Author renders <article data-comment> children with metadata; component decorates each with author header, relative timestamp, action row (Reply / Edit / Delete) + threaded indentation. Composes <comment-box> (reply form template), <markdown-viewer> (body rendering by author), and bubbles <reaction-bar> events naturally.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Region label for the thread (default \"Comments\")"
      },
      {
        "name": "data-disabled",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Read-only mode — no Reply / Edit / Delete actions"
      },
      {
        "name": "role",
        "kind": "aria",
        "purpose": "config",
        "description": "Set to \"region\""
      }
    ],
    "events": [
      {
        "name": "comment-thread:reply",
        "detail": "{ parentId, value }",
        "description": "Reply form submitted; author should POST and call addComment"
      },
      {
        "name": "comment-thread:edit-request",
        "detail": "{ commentId, value }",
        "description": "Edit clicked; author renders an inline editor or replaces the body"
      },
      {
        "name": "comment-thread:delete-request",
        "detail": "{ commentId }",
        "description": "Delete clicked; author confirms + calls removeComment"
      }
    ],
    "properties": [
      {
        "name": "addComment",
        "type": "(data) => HTMLElement",
        "description": "Insert a new comment from server data"
      },
      {
        "name": "updateComment",
        "type": "(id, patch) => void",
        "description": "Patch an existing comment after edit"
      },
      {
        "name": "removeComment",
        "type": "(id) => void",
        "description": "Remove a comment from the thread"
      }
    ],
    "childAttributes": [
      {
        "name": "data-comment",
        "on": "article",
        "type": "boolean",
        "required": true,
        "description": "Marks an article as a thread comment"
      },
      {
        "name": "data-author",
        "on": "article",
        "type": "string",
        "description": "Display name"
      },
      {
        "name": "data-author-href",
        "on": "article",
        "type": "string",
        "description": "Optional link to the author's profile"
      },
      {
        "name": "data-author-avatar",
        "on": "article",
        "type": "string",
        "description": "Optional avatar URL (renders <user-avatar>)"
      },
      {
        "name": "data-time",
        "on": "article",
        "type": "string",
        "description": "ISO-8601 timestamp"
      },
      {
        "name": "data-mine",
        "on": "article",
        "type": "boolean",
        "description": "Current user authored this comment — enables Edit / Delete"
      },
      {
        "name": "data-parent",
        "on": "article",
        "type": "string",
        "description": "Id of parent comment for nested replies"
      },
      {
        "name": "data-edited",
        "on": "article",
        "type": "string",
        "description": "ISO timestamp of last edit; renders \"(edited)\" badge"
      },
      {
        "name": "data-comment-body",
        "on": "div",
        "type": "boolean",
        "required": true,
        "description": "Wraps the rendered comment body"
      },
      {
        "name": "data-reply-form",
        "on": "template",
        "type": "boolean",
        "description": "Marks the template whose content is cloned for the reply form"
      }
    ],
    "structure": []
  },
  "comment-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "comment-wc",
    "type": "web-component",
    "description": "Inline comment action button for use inside selection-menu (stub — future feature)",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [],
    "structure": [],
    "css": {
      "tokens": []
    }
  },
  "compare-surface": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "compare-surface",
    "type": "web-component",
    "description": "Before/after image comparison slider",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "position",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Slider position (0-100), default 50. Reflected on change."
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-valuemin",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuemax",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuenow",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "compare-surface:change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "component-sampler": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "component-sampler",
    "type": "web-component",
    "description": "Themed UI element preview grid. Renders native HTML elements styled by the active VB theme.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "components",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "button,input,select,checkbox,radio,badge,progress",
        "description": "Comma-separated component types to render"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ]
  },
  "consent-banner": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "consent-banner",
    "type": "web-component",
    "description": "Cookie consent banner with granular category controls and persistence",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "persist",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "banner",
        "description": "VBStore key under namespace 'consent' for storing consent"
      },
      {
        "name": "position",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "bottom",
          "top",
          "center"
        ],
        "default": "bottom",
        "description": "Banner position. Center uses modal dialog."
      },
      {
        "name": "trigger",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for a re-open button (e.g. #manage-cookies)"
      },
      {
        "name": "expires",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "365",
        "description": "Days until consent expires. 0 or 'never' disables expiry."
      }
    ],
    "structure": [
      {
        "element": "<dialog>",
        "description": "Banner container — shown until consent is given"
      },
      {
        "element": "<button value=\"accept\">",
        "description": "Accept-all action button"
      },
      {
        "element": "<button value=\"reject\">",
        "required": false,
        "description": "Reject-all action button (optional)"
      },
      {
        "element": "<input type=\"checkbox\">",
        "required": false,
        "description": "Granular preference toggles (optional, for save mode)"
      },
      {
        "element": "<button value=\"save\">",
        "required": false,
        "description": "Save granular preferences button (optional, used with checkboxes)"
      }
    ],
    "childAttributes": [
      {
        "name": "value",
        "on": "button",
        "type": "enum",
        "values": [
          "accept",
          "reject",
          "save"
        ],
        "required": true,
        "description": "Action button type — accept all, reject all, or save granular preferences"
      },
      {
        "name": "name",
        "on": "input[type=checkbox]",
        "type": "string",
        "description": "Preference category name stored in the consent cookie"
      }
    ],
    "events": [
      {
        "name": "consent-banner:accept",
        "description": "Fired when user accepts all"
      },
      {
        "name": "consent-banner:reject",
        "description": "Fired when user rejects all"
      },
      {
        "name": "consent-banner:save",
        "detail": "{ preferences }",
        "description": "Fired when user saves granular preferences"
      }
    ]
  },
  "content-lens": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "content-lens",
    "type": "web-component",
    "description": "Universal switchable host for VB lens components",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-lens-default",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Lens name to show on first load"
      },
      {
        "name": "data-lens-controls",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "\"on\" (default) | \"off\" — render reader controls"
      },
      {
        "name": "data-lens-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Shared JSON source URL forwarded to children"
      },
      {
        "name": "data-lens-storage",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Key for sessionStorage persistence (default: pathname)"
      },
      {
        "name": "data-active-lens",
        "kind": "data",
        "purpose": "output-state",
        "type": "string",
        "description": "Reflects the currently active lens"
      }
    ],
    "events": [
      {
        "name": "content-lens:change",
        "detail": "{ lens: string }",
        "description": "Fires when the reader switches lenses"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Lens components, each with data-lens-name"
      }
    ]
  },
  "content-swap": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "content-swap",
    "type": "web-component",
    "description": "Two-face content toggle with accessible state management",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "transition",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Transition type: \"flip\" (default), \"flip-vertical\", \"fade\", \"slide-left\", \"slide-up\", \"scale\""
      },
      {
        "name": "swapped",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reflects swap state"
      },
      {
        "name": "card",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Apply layout-card visual shell"
      },
      {
        "name": "data-face",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "\"front\" or \"back\" on child elements"
      },
      {
        "name": "data-swap",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Marks an element as a swap trigger (on children),"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-swap-init",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "content-swap:swap"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "context-menu": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "context-menu",
    "type": "web-component",
    "description": "Right-click context menu with keyboard navigation and shortcut bindings",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-open",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Reflected when context menu is visible. Uses data-open because the host is not a native dialog/details — open would be semantically misleading."
      }
    ],
    "structure": [
      {
        "element": "any element with data-trigger",
        "description": "Element defining the right-click target area"
      },
      {
        "element": "<menu>",
        "description": "Context menu with <li> items holding <button> actions"
      }
    ],
    "childAttributes": [
      {
        "name": "data-trigger",
        "on": "*",
        "type": "boolean",
        "required": true,
        "description": "Element defining the right-click target area"
      },
      {
        "name": "data-shortcut",
        "on": "button",
        "type": "string",
        "description": "Keyboard shortcut to bind, e.g. 'meta+c'. Displayed as formatted hint."
      }
    ],
    "events": [
      {
        "name": "context-menu:open",
        "description": "Fired when the menu opens"
      },
      {
        "name": "context-menu:close",
        "description": "Fired when the menu closes"
      },
      {
        "name": "context-menu:select",
        "detail": "{ item }",
        "description": "Fired when a menu item is selected"
      }
    ]
  },
  "data-table": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "data-table",
    "type": "web-component",
    "description": "Enhanced HTML table with sorting, filtering, pagination, row expansion, and selection",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-filterable",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Enable text search filtering"
      },
      {
        "name": "data-paginate",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Enable pagination with N rows per page"
      }
    ],
    "structure": [
      {
        "element": "<table>",
        "description": "Standard HTML table — the component enhances it in place"
      }
    ],
    "childAttributes": [
      {
        "name": "data-sort",
        "on": "th",
        "type": "enum",
        "values": [
          "string",
          "number",
          "date"
        ],
        "description": "Enable sorting on this column with the specified comparator"
      },
      {
        "name": "data-weight",
        "on": "th",
        "type": "number",
        "description": "Column weight; multiplier applied to cell values for weighted-sum rollups"
      },
      {
        "name": "data-rollup",
        "on": "th",
        "type": "enum",
        "values": [
          "sum",
          "weighted-sum",
          "product",
          "avg",
          "max"
        ],
        "description": "Compute this column's cells from sibling cells in the same row"
      },
      {
        "name": "data-heatmap",
        "on": "th",
        "type": "enum",
        "values": [
          "auto",
          "low-good",
          "high-good"
        ],
        "description": "Tint this column's cells by relative value bucket (low/mid/high)"
      },
      {
        "name": "data-sort-value",
        "on": "td",
        "type": "string",
        "description": "Custom sort value overriding cell text"
      },
      {
        "name": "data-filter-value",
        "on": "td",
        "type": "string",
        "description": "Custom filter value overriding cell text"
      },
      {
        "name": "data-expandable",
        "on": "tr",
        "type": "boolean",
        "description": "Mark row as expandable (followed by a data-expand-content row)"
      },
      {
        "name": "data-expand-content",
        "on": "tr",
        "type": "boolean",
        "description": "Hidden row revealed when its preceding expandable row is toggled"
      },
      {
        "name": "data-selectable",
        "on": "tr",
        "type": "boolean",
        "description": "Mark row as selectable via checkbox"
      }
    ],
    "events": [
      {
        "name": "data-table:sort",
        "detail": "{ column, direction, columnName }",
        "description": "Fired when a column is sorted"
      },
      {
        "name": "data-table:filter",
        "detail": "{ query, count }",
        "description": "Fired when filter text changes"
      },
      {
        "name": "data-table:page",
        "detail": "{ page }",
        "description": "Fired when page changes"
      },
      {
        "name": "data-table:expand",
        "detail": "{ row, expanded }",
        "description": "Fired when a row is expanded or collapsed"
      },
      {
        "name": "data-table:selection",
        "detail": "{ count, rows[] }",
        "description": "Fired when row selection changes"
      }
    ]
  },
  "date-picker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "date-picker",
    "type": "web-component",
    "description": "Form-associated calendar date picker with combobox text entry",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Disables the picker"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Makes selection required"
      },
      {
        "name": "data-disabled-dates",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ISO dates to disable (optionally with reason: \"2026-04-05:booked\")"
      },
      {
        "name": "data-highlight-dates",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ISO dates to highlight (optionally with category: \"2026-12-25:holiday\")"
      },
      {
        "name": "min",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "max",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-disabled",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-haspopup",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "autocomplete",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-date",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-disabled-reason",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-highlight",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-focused",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "open",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "date-picker:change"
      },
      {
        "name": "date-picker:open"
      },
      {
        "name": "date-picker:close"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "day-view": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "day-view",
    "type": "web-component",
    "description": "Hour-grid schedule for a single day, using hour-view and calendar-event children",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-date",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ISO date for this day view (e.g., 2026-04-10)"
      },
      {
        "name": "data-start-hour",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "7",
        "description": "First visible hour (0-23), or 'auto' to scan calendar-event children and compute sparse range"
      },
      {
        "name": "data-end-hour",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": 19,
        "description": "Last visible hour (0-23). Ignored when data-start-hour is 'auto'."
      },
      {
        "name": "data-compact",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Compact presentation for dialog or overlay embedding"
      }
    ],
    "events": [
      {
        "name": "day-view:event-click",
        "description": "Fired when a calendar-event is clicked",
        "detail": "{ time, text, element, category, duration }"
      }
    ],
    "structure": [
      {
        "element": "ol",
        "description": "Ordered list of hour slots"
      },
      {
        "element": "li",
        "description": "Single hour slot containing time label + hour-view"
      },
      {
        "element": "time",
        "description": "Hour label with datetime='HH:00'"
      },
      {
        "element": "hour-view",
        "description": "Container for calendar-event elements within the hour"
      },
      {
        "element": "calendar-event",
        "description": "Individual event with time, category, and optional duration"
      }
    ]
  },
  "diagram-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "diagram-wc",
    "type": "web-component",
    "description": "Declarative diagram renderer — wraps Mermaid (v1) with VB token-driven theming, lazy load, and HTML-first authoring via fenced code blocks",
    "attributes": [
      {
        "name": "type",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Backend selector. v1 only supports \"mermaid\""
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL of a diagram source file (.mmd). Inline source via <pre><code> takes priority if absent."
      },
      {
        "name": "caption",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Rendered as <figcaption> below the SVG"
      },
      {
        "name": "loading",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "\"lazy\" defers render until the element scrolls into view"
      },
      {
        "name": "data-theme-base",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Mermaid base theme: base|default|dark|forest|neutral. Default \"base\" so VB tokens win."
      },
      {
        "name": "min-height",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS length reserved for the diagram before render to prevent layout shift"
      }
    ],
    "events": [
      {
        "name": "diagram-wc:ready",
        "detail": "{ svg, type, source }",
        "description": "After successful render"
      },
      {
        "name": "diagram-wc:error",
        "detail": "{ error, source, type }",
        "description": "Render failed; the <pre> fallback is restored"
      },
      {
        "name": "diagram-wc:source-changed",
        "detail": "{ source }",
        "description": ".source setter fired"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "dl": {
    "element": "dl",
    "type": "native",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@script",
        "dt",
        "dd",
        "div",
        "dl-item"
      ]
    },
    "attributes": []
  },
  "drag-surface": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "drag-surface",
    "type": "web-component",
    "description": "Accessible drag-and-drop reorder surface",
    "attributes": [
      {
        "name": "group",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Transfer group; items move between surfaces sharing a group"
      },
      {
        "name": "orientation",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "\"horizontal\" switches to Left/Right arrows and clientX"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Temporarily disables all dragging"
      },
      {
        "name": "draggable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "=\"true\" - Marks an element as draggable"
      },
      {
        "name": "data-id",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Stable identifier for the item"
      },
      {
        "name": "data-sort-order",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Numeric position (managed automatically)"
      },
      {
        "name": "data-drag-handle",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "If present on a descendant, only that element initiates drag"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-grabbed",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "data-dragging",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-drag-over",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-reorder-mode",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-just-dropped",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-drop-target",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "drag-surface:reorder-start"
      },
      {
        "name": "drag-surface:reorder"
      },
      {
        "name": "drag-surface:transfer"
      },
      {
        "name": "drag-surface:reorder-end"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "drop-down": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "drop-down",
    "type": "web-component",
    "description": "Accessible dropdown menu with keyboard navigation and Popover API support",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "position",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "bottom-start",
          "bottom-end",
          "top-start",
          "top-end"
        ],
        "default": "bottom-start",
        "description": "Menu position relative to trigger"
      },
      {
        "name": "hover",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Open on hover/focus instead of click (useful for nav menus)"
      },
      {
        "name": "no-flip",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Disable automatic flip when menu overflows viewport"
      },
      {
        "name": "open",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "description": "Reflected state — set by open()/close()/toggle() methods, not intended as initial markup"
      }
    ],
    "structure": [
      {
        "element": "<button data-trigger> or <a data-trigger>",
        "description": "Trigger element that opens the menu"
      },
      {
        "element": "<menu>",
        "description": "Menu container with <li> items holding <button> or <a> actions"
      }
    ],
    "childAttributes": [
      {
        "name": "data-trigger",
        "on": "button | a",
        "type": "boolean",
        "required": true,
        "description": "Marks the element that opens the menu. Falls back to first <button> if absent."
      }
    ],
    "events": [
      {
        "name": "drop-down:open",
        "description": "Fired when the menu opens"
      },
      {
        "name": "drop-down:close",
        "description": "Fired when the menu closes"
      },
      {
        "name": "drop-down:select",
        "detail": "{ item }",
        "description": "Fired when a menu item is selected"
      }
    ]
  },
  "emoji-picker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "emoji-picker",
    "type": "web-component",
    "description": "Accessible emoji picker with search, categories, and insertion",
    "attributes": [
      {
        "name": "for",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "ID of target input/textarea/contenteditable for insertion"
      },
      {
        "name": "recent-limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Max recent emoji stored (default: 24)"
      },
      {
        "name": "data-trigger",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "aria-haspopup",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-group",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-group-heading",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-shortcode",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "open",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "emoji-picker:select"
      },
      {
        "name": "emoji-picker:open"
      },
      {
        "name": "emoji-picker:close"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "empathy-map": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "empathy-map",
    "type": "web-component",
    "description": "Four-quadrant empathy map visualization (Says, Thinks, Does, Feels) with optional flip-to-edit interaction",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Map heading"
      },
      {
        "name": "persona",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Persona name displayed in header"
      },
      {
        "name": "persona-id",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Links to a user-persona element by id"
      },
      {
        "name": "summary",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "One-line description"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON file containing quadrant data"
      },
      {
        "name": "editable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Enables flip-to-edit on quadrants"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ],
    "slots": [
      {
        "name": "title",
        "description": "Map heading (slot fallback for attribute)"
      },
      {
        "name": "persona",
        "description": "Persona name (slot fallback for attribute)"
      },
      {
        "name": "summary",
        "description": "One-line description (slot fallback for attribute)"
      },
      {
        "name": "says",
        "description": "Content for the Says quadrant"
      },
      {
        "name": "thinks",
        "description": "Content for the Thinks quadrant"
      },
      {
        "name": "does",
        "description": "Content for the Does quadrant"
      },
      {
        "name": "feels",
        "description": "Content for the Feels quadrant"
      },
      {
        "name": "goals",
        "description": "Optional goals summary below the grid"
      },
      {
        "name": "pain-points",
        "description": "Optional pain points summary below the grid"
      }
    ],
    "events": [
      {
        "name": "empathy-map:ready",
        "detail": "{ title, persona }",
        "description": "Fired after initial render"
      },
      {
        "name": "empathy-map:update",
        "detail": "{ quadrant, items }",
        "description": "Fired when quadrant content changes via edit"
      }
    ]
  },
  "flow-diagram": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "flow-diagram",
    "type": "web-component",
    "description": "User flow and sequence visualization — progressively enhances an ol into a connected node graph with actions, decisions, and branches",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Diagram heading"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON flow data"
      },
      {
        "name": "data-direction",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Layout: vertical (default) or horizontal"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing"
      }
    ],
    "events": [
      {
        "name": "flow-diagram:ready",
        "detail": "{ nodeCount }",
        "description": "After setup"
      },
      {
        "name": "flow-diagram:select",
        "detail": "{ type, text }",
        "description": "Node clicked"
      }
    ]
  },
  "font-pairer": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "font-pairer",
    "type": "web-component",
    "description": "Interactive font pairing tool with Google Fonts loading and CSS export",
    "attributes": [
      {
        "name": "heading-font",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Google Fonts family name for headings"
      },
      {
        "name": "body-font",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Google Fonts family name for body text"
      },
      {
        "name": "sample",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Custom sample heading text"
      },
      {
        "name": "show-export",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show Copy CSS / Copy @import toolbar"
      },
      {
        "name": "show-suggestions",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show curated pairing suggestions"
      }
    ],
    "events": [
      {
        "name": "font-pairer:change"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "foot-note": {
    "element": "foot-note",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "phrasing": true,
      "permittedContent": [
        "@phrasing"
      ]
    },
    "attributes": []
  },
  "foot-notes": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "foot-notes",
    "type": "web-component",
    "description": "Progressive enhancement for footnotes",
    "attributes": [
      {
        "name": "data-back-label",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-mode",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-enhanced",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-side",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-backref",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "form-field": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "form-field",
    "type": "web-component",
    "description": "Accessible form field web component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-valid",
        "kind": "data",
        "purpose": "semantic-state"
      },
      {
        "name": "data-invalid",
        "kind": "data",
        "purpose": "semantic-state"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "gantt-chart": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "gantt-chart",
    "type": "web-component",
    "description": "HTML-first Gantt chart using native table, progress, and time elements with progressive enhancement to an interactive timeline",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Chart heading"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON task data"
      },
      {
        "name": "view",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Timeline granularity: auto | day | week | month | quarter"
      },
      {
        "name": "show-today",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show vertical today marker line"
      },
      {
        "name": "show-progress",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show progress fill inside bars"
      },
      {
        "name": "show-dependencies",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Draw dependency arrows between tasks"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ],
    "events": [
      {
        "name": "gantt-chart:ready",
        "detail": "{ taskCount, dateRange }",
        "description": "Fired after initial render"
      },
      {
        "name": "gantt-chart:task-click",
        "detail": "{ task }",
        "description": "Fired when a task bar is clicked"
      }
    ]
  },
  "geo-map": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "geo-map",
    "type": "web-component",
    "description": "A zero-dependency map component using OSM tiles.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "lat",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Latitude of map center"
      },
      {
        "name": "lng",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Longitude of map center"
      },
      {
        "name": "zoom",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Tile zoom level 1–19 (default: 15)"
      },
      {
        "name": "marker",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Show pin at center; \"false\" to hide"
      },
      {
        "name": "marker-color",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Pin fill color (default: #e74c3c)"
      },
      {
        "name": "provider",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Tile source: osm, carto-light, carto-dark"
      },
      {
        "name": "tile-url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL template with {z}/{x}/{y} placeholders for first-party tile proxying. Overrides provider when set. See /docs/concepts/service-facade/."
      },
      {
        "name": "interactive",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "static-only",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "src",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "place",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "content",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-has-caption",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-interactive-active",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "geo-map:ready"
      },
      {
        "name": "geo-map:activate"
      },
      {
        "name": "geo-map:error"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "glossary-index": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "glossary-index",
    "type": "web-component",
    "description": "Interactive glossary with search and scroll-spy",
    "attributes": [
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Placeholder text for the search input"
      },
      {
        "name": "data-glossary-search",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "href",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "glossary-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "glossary-wc",
    "type": "web-component",
    "description": "Searchable, categorized, cross-linked glossary that progressively enhances a definition list",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "dl",
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Glossary heading"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON term data"
      },
      {
        "name": "searchable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Enables search input"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ],
    "childAttributes": [
      {
        "name": "data-category",
        "on": "div",
        "type": "string",
        "description": "Category label for grouping terms"
      },
      {
        "name": "data-term-id",
        "on": "div",
        "type": "string",
        "description": "Unique term identifier, used as fragment anchor"
      }
    ],
    "events": [
      {
        "name": "glossary-wc:ready",
        "detail": "{ termCount, categories }",
        "description": "After setup completes"
      },
      {
        "name": "glossary-wc:search",
        "detail": "{ query, matchCount }",
        "description": "On search input"
      }
    ]
  },
  "gradient-builder": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "gradient-builder",
    "type": "web-component",
    "description": "Interactive CSS gradient builder with color stops, angle control, and export",
    "attributes": [
      {
        "name": "colors",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated initial stop colors (e.g. \"#6366f1,#ec4899\")"
      },
      {
        "name": "type",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Gradient type: \"linear\" (default) or \"radial\""
      },
      {
        "name": "angle",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Angle in degrees for linear gradients (default: 90)"
      },
      {
        "name": "interpolation",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Color space: \"oklab\" (default), \"oklch\", \"srgb\""
      },
      {
        "name": "show-export",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show Copy CSS toolbar"
      },
      {
        "name": "show-controls",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show type/angle/space controls (default: true)"
      }
    ],
    "events": [
      {
        "name": "gradient-builder:change"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "heading-links": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "heading-links",
    "type": "web-component",
    "description": "Add anchor links to headings",
    "attributes": [
      {
        "name": "levels",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Heading levels to process (default: 'h2,h3')"
      },
      {
        "name": "data-toc-ignore",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "heading-links:navigate"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "highlight-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "highlight-wc",
    "type": "web-component",
    "description": "Medium-style text highlighting and annotation component with color swatches, private notes, and localStorage persistence",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "for",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ID of element to annotate (defaults to first child element)"
      },
      {
        "name": "colors",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated color names (default: yellow,green,blue,pink)"
      },
      {
        "name": "readonly",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Render stored highlights but disable creating new ones"
      },
      {
        "name": "storage-key",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Custom localStorage key suffix (default: page pathname)"
      }
    ],
    "structure": [
      {
        "element": "<article>",
        "description": "Content to annotate (when not using for= attribute)"
      }
    ],
    "css": {
      "tokens": [
        {
          "name": "--highlight-yellow",
          "description": "Yellow highlight color"
        },
        {
          "name": "--highlight-green",
          "description": "Green highlight color"
        },
        {
          "name": "--highlight-blue",
          "description": "Blue highlight color"
        },
        {
          "name": "--highlight-pink",
          "description": "Pink highlight color"
        }
      ]
    }
  },
  "icon-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "icon-wc",
    "type": "web-component",
    "description": "Inline icon element using SVG sprite sets with accessible labelling",
    "htmlvalidate": {
      "flow": true,
      "phrasing": true
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Icon name (required, matches filename without .svg)"
      },
      {
        "name": "set",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Icon set directory (default: \"lucide\", or \"custom\")"
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Icon size: xs, sm, md, lg, xl, 2xl (default: md)"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Accessible label for functional icons"
      },
      {
        "name": "base-path",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "width",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "height",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "image-gallery": {
    "$schema": "../../../.claude/schemas/api.schema.json",
    "element": "image-gallery",
    "type": "web-component",
    "description": "Thumbnail grid with lightbox viewer. Progressive enhancement: thumbnails link to full images without JS. With JS, opens a fullscreen dialog with navigation, swipe, keyboard, and View Transitions.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "a",
        "figure",
        "img"
      ]
    },
    "attributes": [
      {
        "name": "columns",
        "kind": "host-api",
        "direction": "input",
        "purpose": "config",
        "type": "enum",
        "values": [
          "100px",
          "150px",
          "200px",
          "250px",
          "300px"
        ],
        "default": "200px",
        "description": "Minimum column width for the thumbnail grid."
      },
      {
        "name": "gap",
        "kind": "host-api",
        "direction": "input",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "none",
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ],
        "default": "s",
        "description": "Gap between thumbnails."
      },
      {
        "name": "ratio",
        "kind": "host-api",
        "direction": "input",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "1",
          "4:3",
          "3:2",
          "16:9",
          "3:4",
          "auto"
        ],
        "default": "1",
        "description": "Aspect ratio for thumbnail images."
      },
      {
        "name": "controls",
        "kind": "host-api",
        "direction": "input",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "edge",
          "bar",
          "minimal"
        ],
        "default": "edge",
        "description": "Lightbox control layout. 'edge' puts prev/next on sides with floating header. 'bar' puts all controls in a top bar. 'minimal' shows close only (swipe/keyboard for nav)."
      },
      {
        "name": "loop",
        "kind": "host-api",
        "direction": "input",
        "purpose": "config",
        "type": "boolean",
        "description": "Wrap navigation at first/last image."
      },
      {
        "name": "captions",
        "kind": "host-api",
        "direction": "input",
        "purpose": "config",
        "type": "enum",
        "values": [
          "auto",
          "overlay",
          "hidden"
        ],
        "default": "auto",
        "description": "Caption display in lightbox. 'auto' shows via popover button, 'overlay' shows persistent bar, 'hidden' suppresses."
      },
      {
        "name": "transition",
        "kind": "host-api",
        "direction": "input",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "morph",
          "fade",
          "none"
        ],
        "default": "morph",
        "description": "View Transition type. 'morph' animates thumbnail to full image, 'fade' cross-fades, 'none' disables."
      }
    ],
    "structure": [
      {
        "element": "<a href=\"full.jpg\">",
        "description": "Image-only item: anchor wrapping a thumbnail img."
      },
      {
        "element": "<figure>",
        "description": "Rich item: figure wrapping an anchor and figcaption."
      },
      {
        "element": "<img>",
        "description": "Thumbnail image inside anchor. src is the thumbnail, parent anchor href is the full image."
      },
      {
        "element": "<figcaption>",
        "description": "Optional caption inside figure. Supports HTML including links."
      }
    ]
  },
  "image-map": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "image-map",
    "type": "web-component",
    "description": "map + map-area: Modern responsive image map with percentage coordinates",
    "attributes": [
      {
        "name": "x",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "y",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "width",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "height",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "cx",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "cy",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "r",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "points",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "shape",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "coords",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "href",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "tooltip",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "src",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "alt",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "viewBox",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "preserveAspectRatio",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-disabled",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-hover",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "image-map:area-enter"
      },
      {
        "name": "image-map:area-leave"
      },
      {
        "name": "image-map:area-activate"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "impact-effort": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "impact-effort",
    "type": "web-component",
    "description": "2x2 prioritization matrix with drag-and-drop between quadrants (Quick Wins, Big Bets, Fill-Ins, Money Pit)",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON data for items"
      },
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading above the matrix"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ],
    "childAttributes": [
      {
        "name": "data-quadrant",
        "on": "any child",
        "type": "enum",
        "values": [
          "quick-wins",
          "big-bets",
          "fill-ins",
          "money-pit"
        ],
        "description": "Target quadrant for this item"
      },
      {
        "name": "draggable",
        "on": "any child",
        "type": "boolean",
        "description": "Required for drag capability"
      },
      {
        "name": "data-id",
        "on": "any child",
        "type": "string",
        "description": "Stable identifier for the item"
      }
    ],
    "events": [
      {
        "name": "impact-effort:move",
        "detail": "{ itemId, from, to, item }",
        "description": "Fired when an item is dragged between quadrants"
      },
      {
        "name": "impact-effort:ready",
        "detail": "{ quadrantCounts }",
        "description": "Fired after component initializes"
      }
    ]
  },
  "include-file": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "include-file",
    "type": "web-component",
    "description": "Fetch and inject HTML content from a URL into the page",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to fetch HTML from"
      },
      {
        "name": "mode",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "replace",
          "append",
          "prepend"
        ],
        "default": "replace",
        "description": "How fetched content is inserted"
      },
      {
        "name": "lazy",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Defer loading until element enters viewport"
      },
      {
        "name": "allow-scripts",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Re-execute inline scripts in loaded content (trusted sources only)"
      },
      {
        "name": "data-loading",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present while content is loading"
      },
      {
        "name": "data-loaded",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present after successful load"
      },
      {
        "name": "data-error",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present if fetch fails"
      }
    ],
    "events": [
      {
        "name": "include-file:loaded",
        "detail": "{ src, html }",
        "description": "Fired after successful content load"
      },
      {
        "name": "include-file:error",
        "detail": "{ src, error }",
        "description": "Fired if fetch fails"
      }
    ]
  },
  "iron-triangle": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "iron-triangle",
    "type": "web-component",
    "description": "Triangle-as-UI project-shape constraint surface. Three vertex hit-targets (Scope/Time/Cost) open native <dialog> editors; the center 'Quality' target fires iron-triangle:open-quality with a data-quality-href fallback. Computes capacityPoints from sprintWeeks × sprintCount × teamFTE × focusFactor. Form-associated.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "default": "triangle",
        "description": "Form-association field name"
      },
      {
        "name": "data-focus-factor",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "0.6",
        "description": "Multiplier in the default capacity formula"
      },
      {
        "name": "data-min-capacity",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "1",
        "description": "Floor for capacityPoints"
      },
      {
        "name": "data-quality-href",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Navigation fallback when iron-triangle:open-quality isn't preventDefault-ed"
      },
      {
        "name": "data-quality-summary",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Short summary text shown in the center's native tooltip + aria-label (e.g. '3 critical: perf, sec, a11y')"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "All inputs disabled"
      },
      {
        "name": "locked",
        "kind": "host-api",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Read-only mode for shipped vectors"
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "iron-triangle:change",
        "detail": "{ time, cost, scope, capacityPoints, capacitySource, hash, source, field }",
        "description": "Any input or property change"
      },
      {
        "name": "iron-triangle:revise",
        "detail": "{ field, from, to, reason }",
        "description": "A revision is committed via revise()"
      },
      {
        "name": "iron-triangle:mode",
        "detail": "{ from, to }",
        "description": "Capacity source flips between formula and manual"
      },
      {
        "name": "iron-triangle:open-quality",
        "detail": "{ qualitySummary, capacityPoints }",
        "description": "Center 'Quality' target activated; cancelable. If not prevented and data-quality-href is set, navigates to that URL."
      }
    ]
  },
  "kanban-board": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "kanban-board",
    "type": "web-component",
    "description": "Columnar drag-and-drop board with user-defined columns, count badges, and optional WIP limits",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "section"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON data for columns and items"
      },
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading above the board"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ],
    "childAttributes": [
      {
        "name": "data-column",
        "on": "section",
        "type": "string",
        "description": "Column identifier"
      },
      {
        "name": "data-column-label",
        "on": "section",
        "type": "string",
        "description": "Display label for the column header"
      },
      {
        "name": "data-wip",
        "on": "section",
        "type": "number",
        "description": "Optional WIP limit — visual warning when exceeded"
      },
      {
        "name": "data-column-color",
        "on": "section",
        "type": "string",
        "description": "Color token for column tint (success, warning, error, info)"
      }
    ],
    "events": [
      {
        "name": "kanban-board:transfer",
        "detail": "{ itemId, fromColumn, toColumn, newIndex, item }",
        "description": "Item moved between columns"
      },
      {
        "name": "kanban-board:reorder",
        "detail": "{ itemId, column, oldIndex, newIndex }",
        "description": "Item reordered within a column"
      },
      {
        "name": "kanban-board:ready",
        "detail": "{ columnCount, itemCount }",
        "description": "Fired after component initializes"
      },
      {
        "name": "kanban-board:wip-exceeded",
        "detail": "{ column, limit, count }",
        "description": "Fired when a column exceeds its WIP limit"
      }
    ]
  },
  "markdown-editor": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "markdown-editor",
    "type": "web-component",
    "description": "Side-by-side markdown editor with live preview. Composes a textarea with markdown-viewer.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "textarea",
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Form field name reflected to the textarea"
      },
      {
        "name": "placeholder",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Textarea placeholder text"
      },
      {
        "name": "rows",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "10",
        "description": "Textarea rows"
      },
      {
        "name": "highlight",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Pass highlight attribute to the preview viewer"
      },
      {
        "name": "data-tab-indent",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Tab key inserts spaces instead of moving focus"
      },
      {
        "name": "data-theme",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Theme propagated to the preview pane"
      },
      {
        "name": "data-editing",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present when textarea is focused"
      }
    ],
    "events": [
      {
        "name": "markdown-editor:input",
        "detail": "{ value }",
        "description": "Fired on each keystroke"
      },
      {
        "name": "markdown-editor:change",
        "detail": "{ value }",
        "description": "Fired on blur after content changed"
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string",
        "description": "Get/set the current markdown content"
      },
      {
        "name": "textarea",
        "type": "HTMLTextAreaElement",
        "description": "Reference to the internal textarea element"
      }
    ]
  },
  "markdown-viewer": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "markdown-viewer",
    "type": "web-component",
    "description": "Render markdown content with progressive enhancement. Supports external files, inline content, pluggable parsers, and VB theme integration.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "pre",
        "script",
        "template",
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL of external markdown file"
      },
      {
        "name": "loading",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "eager",
          "lazy"
        ],
        "default": "eager",
        "description": "Defer fetch until element enters viewport (Phase 3)"
      },
      {
        "name": "highlight",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Fire per-block markdown-viewer:highlight events after render"
      },
      {
        "name": "ping",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to ping with render metadata via sendBeacon"
      },
      {
        "name": "data-theme",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Theme name propagated to .md-content container"
      },
      {
        "name": "data-rendered",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present after successful render"
      },
      {
        "name": "data-loading",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present while fetching external content"
      },
      {
        "name": "data-error",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present if fetch or parse fails"
      }
    ],
    "events": [
      {
        "name": "markdown-viewer:fetch",
        "detail": "{ src }",
        "description": "Fired when external fetch begins"
      },
      {
        "name": "markdown-viewer:rendered",
        "detail": "{ src, node }",
        "description": "Fired after parse and render complete"
      },
      {
        "name": "markdown-viewer:highlight",
        "detail": "{ node, language }",
        "description": "Fired per code block when highlight attribute is set"
      },
      {
        "name": "markdown-viewer:error",
        "detail": "{ error }",
        "description": "Fired on fetch or parse failure"
      }
    ],
    "properties": [
      {
        "name": "parser",
        "type": "Function|null",
        "description": "Custom parser function (markdown string → HTML string). Overrides the default marked parser."
      }
    ],
    "methods": [
      {
        "name": "render()",
        "returns": "Promise<void>",
        "description": "Force a re-render from the current content source"
      },
      {
        "name": "reload()",
        "returns": "Promise<void>",
        "description": "Re-fetch the src URL and re-render"
      }
    ]
  },
  "motion-specimen": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "motion-specimen",
    "type": "web-component",
    "description": "Design token motion scale display. Shows easing curves with animated preview dots and/or durations as bars.",
    "attributes": [
      {
        "name": "type",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "easing",
          "duration",
          "both"
        ],
        "default": "easing",
        "description": "Which motion tokens to display."
      },
      {
        "name": "tokens",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated token names (defaults vary by type)."
      },
      {
        "name": "prefix",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS variable prefix. Auto-set to --ease- or --duration- from type."
      },
      {
        "name": "duration",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "1.2s",
        "description": "Animation duration for easing previews (only applies to easing rows)."
      },
      {
        "name": "show-values",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "default": "true",
        "description": "Show computed token values."
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label."
      }
    ]
  },
  "nav-bar": {
    "$schema": "../../schemas/api.schema.json",
    "element": "nav-bar",
    "type": "web-component",
    "description": "Top-level site/app navigation primitive. HTML-first wrap or JSON-first .items setter; auto aria-current sync via pathname matching with popstate listener.",
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name for the navigation region."
      },
      {
        "name": "data-match",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "exact"
        ],
        "description": "Pathname matching strictness. 'exact' requires exact match. Default: exact wins, longest prefix breaks ties, first-in-DOM-order breaks remaining ties."
      }
    ],
    "events": [
      {
        "name": "nav-bar:upgraded"
      },
      {
        "name": "nav-bar:items-changed",
        "detail": "{ items, source: 'property' }"
      },
      {
        "name": "nav-bar:current-changed",
        "detail": "{ current, previous, source: 'property' | 'popstate' | 'pathname' }"
      }
    ],
    "childAttributes": [
      {
        "name": "href",
        "on": "a",
        "type": "string",
        "description": "Standard anchor href. Used for both navigation and pathname matching."
      },
      {
        "name": "data-route",
        "on": "a",
        "type": "string",
        "description": "Optional .current target. Falls back to href when absent."
      },
      {
        "name": "data-nav-link",
        "on": "a",
        "type": "boolean",
        "description": "Marks a descendant <a> as a candidate for active-state matching when the link list is wrapped (e.g. inside <li> or <drop-down>). When any descendant carries this attribute, those replace 'direct children' as the candidate set."
      }
    ],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "note-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "note-wc",
    "type": "web-component",
    "description": "Private note action button for use inside selection-menu",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [],
    "structure": [],
    "css": {
      "tokens": []
    }
  },
  "notification-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "notification-wc",
    "type": "web-component",
    "description": "Dual-mode notification component: dismissible banner or bell-icon panel with history + read tracking.",
    "attributes": [
      {
        "name": "mode",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "banner",
          "panel"
        ],
        "description": "Which presentation mode to render (default: panel)"
      },
      {
        "name": "persist",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Banner mode: VBStore key used to record dismiss state"
      },
      {
        "name": "variant",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "info",
          "success",
          "warning",
          "error"
        ],
        "description": "Banner mode: color variant"
      },
      {
        "name": "position",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "top",
          "bottom"
        ],
        "description": "Banner mode: sticky position"
      },
      {
        "name": "expires",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Banner mode: days until the banner re-shows after dismiss"
      },
      {
        "name": "src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Panel mode: absolute URL or VBService role name for dynamic notifications"
      },
      {
        "name": "poll",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Panel mode: polling interval in milliseconds"
      },
      {
        "name": "toast-new",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Panel mode: fire a toast via the nearest <toast-msg> when a new dynamic notification arrives"
      },
      {
        "name": "storage-key",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Panel mode: VBStore namespace for read state (default: notifications)"
      },
      {
        "name": "data-trigger",
        "kind": "data",
        "purpose": "config",
        "description": "Panel mode: marks a custom trigger element, replacing the auto-generated bell"
      }
    ],
    "events": [
      {
        "name": "notification-wc:new",
        "detail": {
          "notification": "object"
        }
      },
      {
        "name": "notification-wc:read",
        "detail": {
          "id": "string"
        }
      },
      {
        "name": "notification-wc:dismiss",
        "detail": {
          "id": "string"
        }
      },
      {
        "name": "notification-wc:open"
      },
      {
        "name": "notification-wc:close"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "page-info": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "page-info",
    "type": "web-component",
    "description": "Document provenance disclosure panel",
    "attributes": [
      {
        "name": "auto",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Render from <meta> tags instead of light DOM"
      },
      {
        "name": "og-preview",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show Open Graph social preview card"
      },
      {
        "name": "datetime",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-trust",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "page-info:verified"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "page-stats": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "page-stats",
    "type": "web-component",
    "description": "Lightweight reading statistics",
    "attributes": [
      {
        "name": "data-for",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID of the target content element to analyze"
      },
      {
        "name": "data-wpm",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Words per minute for reading time (default: 238)"
      },
      {
        "name": "data-show",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated stats to display:"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "page-toc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "page-toc",
    "type": "web-component",
    "description": "Table of contents with scroll-spy",
    "attributes": [
      {
        "name": "levels",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Heading levels to include (default: 'h2,h3')"
      },
      {
        "name": "title",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "ToC title (default: 'On this page')"
      },
      {
        "name": "href",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-toc-ignore",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "page-toc:navigate"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "page-tools": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "page-tools",
    "type": "web-component",
    "description": "Configurable toolbar for page-level utilities",
    "attributes": [
      {
        "name": "data-position",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Positioning: 'sticky' (default), 'fixed', 'inline'"
      },
      {
        "name": "data-orientation",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Direction: 'auto' (default), 'vertical', 'horizontal'"
      },
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Gap token: 's' (default)"
      },
      {
        "name": "data-fab-icon",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Icon name for FAB (default: 'ellipsis-vertical')"
      },
      {
        "name": "data-fab-label",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Accessible label for FAB (default: 'Page tools')"
      },
      {
        "name": "data-breakpoint",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Collapse width (default: '48rem')"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-page-tools-internal",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "popovertarget",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-resolved-orientation",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-collapsed",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "page-tour": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "page-tour",
    "type": "web-component",
    "description": "Progressive-enhancement guided tour. Renders as an in-page step list without JS; enhances to an interactive spotlight overlay with the web component.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "tour-step",
        "details",
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Tour",
        "description": "Tour name for aria-label and heading"
      },
      {
        "name": "data-trigger",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "auto",
          "manual",
          "button"
        ],
        "default": "manual",
        "description": "How the tour is initiated"
      },
      {
        "name": "data-mode",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "passive",
          "active",
          "forced"
        ],
        "default": "passive",
        "description": "Skip and action-gate behaviour"
      },
      {
        "name": "data-persist",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "session",
          "local"
        ],
        "default": "session",
        "description": "Where to store progress"
      },
      {
        "name": "data-persist-key",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Storage key override (defaults to page path)"
      },
      {
        "name": "data-spotlight-padding",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "8",
        "description": "Pixel padding around the spotlight rect"
      },
      {
        "name": "data-step",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "number",
        "default": "0",
        "description": "Current step index (0-based), reflects state"
      },
      {
        "name": "data-active",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "description": "Present while tour is running"
      },
      {
        "name": "data-complete",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "description": "Present after tour finishes or is skipped"
      }
    ],
    "structure": [
      {
        "element": "<tour-step>",
        "description": "Individual tour step — contains heading and description"
      },
      {
        "element": "<details class=\"page-tour-guide\">",
        "required": false,
        "description": "Layer 3 collapsible wrapper (optional)"
      },
      {
        "element": "<button class=\"page-tour-start-btn\">",
        "required": false,
        "description": "Start button inside details (optional, auto-wired)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-target",
        "on": "tour-step",
        "type": "string",
        "required": true,
        "description": "CSS selector for the element to highlight"
      },
      {
        "name": "data-placement",
        "on": "tour-step",
        "type": "enum",
        "values": [
          "top",
          "bottom",
          "left",
          "right",
          "auto"
        ],
        "default": "auto",
        "description": "Preferred card placement relative to target"
      },
      {
        "name": "data-action",
        "on": "tour-step",
        "type": "enum",
        "values": [
          "none",
          "click",
          "focus",
          "input",
          "custom"
        ],
        "default": "none",
        "description": "Required user action before Next is enabled"
      },
      {
        "name": "data-action-hint",
        "on": "tour-step",
        "type": "string",
        "description": "Instructional text shown while waiting for action"
      },
      {
        "name": "data-skippable",
        "on": "tour-step",
        "type": "enum",
        "values": [
          "true",
          "false"
        ],
        "default": "true",
        "description": "Whether this step can be skipped"
      },
      {
        "name": "data-scroll",
        "on": "tour-step",
        "type": "enum",
        "values": [
          "auto",
          "smooth",
          "none"
        ],
        "default": "smooth",
        "description": "Scroll-into-view behaviour for target"
      }
    ],
    "events": [
      {
        "name": "tour:start",
        "detail": "{ step }",
        "description": "Fired once when tour begins"
      },
      {
        "name": "tour:step",
        "detail": "{ step, target, direction }",
        "description": "Fired on each step change"
      },
      {
        "name": "tour:action",
        "detail": "{ step, action }",
        "description": "Fired when a required action completes"
      },
      {
        "name": "tour:complete",
        "detail": "{ steps }",
        "description": "Fired when last step is finished"
      },
      {
        "name": "tour:skip",
        "detail": "{ step }",
        "description": "Fired when user skips the tour"
      }
    ]
  },
  "pager-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "pager-wc",
    "type": "web-component",
    "description": "Standalone pagination controls element targeting any [data-paged] container. The element form of the data-paged primitive — same shape as the layout-grid / data-layout-* element-attribute symmetry across VB. Authors pick the surface that fits the markup; both feed the same engine. Multiple <pager-wc> instances pointing at the same target stay in sync via paged:change.",
    "attributes": [
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for the [data-paged] container (preferred form)."
      },
      {
        "name": "for",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ID of the target container (HTML-form-style alternative to target)."
      },
      {
        "name": "style",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "numbered",
          "prev-next",
          "load-more"
        ],
        "default": "numbered",
        "description": "Control style. Infinite is intentionally unsupported — a sentinel pattern doesn't make sense for decoupled controls."
      }
    ],
    "events": [
      {
        "name": "pager-wc:navigate",
        "description": "Bubbles before the target's data-paged engine processes the navigation. detail: { page }. Use for analytics / scroll-restore hooks."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "palette-generator": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "palette-generator",
    "type": "web-component",
    "description": "Generate color palettes from a seed color",
    "attributes": [
      {
        "name": "seed",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Hex seed color (e.g. \"#6366f1\"). Overridden by child input if present"
      },
      {
        "name": "harmony",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Algorithm: complementary, analogous, triadic, split-complementary, tetradic, monochromatic"
      },
      {
        "name": "include-seed",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Whether the seed appears in the palette (default: true, implicit)"
      },
      {
        "name": "show-export",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show Copy Hex / Copy CSS toolbar below the palette"
      },
      {
        "name": "layout",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Inherited: \"inline\" (default), \"grid\", \"list\""
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Inherited: \"sm\", \"md\" (default), \"lg\""
      },
      {
        "name": "show-values",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Inherited: always show hex values on swatches"
      },
      {
        "name": "show-names",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Inherited: show name labels"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "color-palette:select"
      },
      {
        "name": "palette-generator:generate"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "poll-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "poll-wc",
    "type": "web-component",
    "description": "Voting + live results. Per-option counts and own-vote flag, single or multi-choice, optional closed (results-only) state. Mirrors the reaction-bar author-owned-state pattern: presentational; emits poll-wc:vote; author calls setCount after the server confirms.",
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Group label (defaults to question text if a slot is provided, else \"Poll\")"
      },
      {
        "name": "data-multi",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Allow multiple selections (default: single choice)"
      },
      {
        "name": "data-closed",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Read-only — show results, no voting"
      },
      {
        "name": "data-hide-counts",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Suppress the numeric count beside each bar"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean"
      }
    ],
    "events": [
      {
        "name": "poll-wc:vote",
        "detail": "{ option, action: 'add'|'remove', count, mine }",
        "description": "Single-choice: switching options emits a remove for the previously-selected option BEFORE the add."
      },
      {
        "name": "poll-wc:closed-change",
        "detail": "{ closed }",
        "description": "Fires when data-closed is toggled"
      }
    ],
    "properties": [
      {
        "name": "setCount",
        "type": "(option, count, opts?) => void",
        "description": "Update a single option after the server confirms"
      },
      {
        "name": "setCounts",
        "type": "(counts, opts?) => void",
        "description": "Bulk-update counts; opts.mine accepts a string or string[]"
      },
      {
        "name": "open",
        "type": "() => void"
      },
      {
        "name": "close",
        "type": "() => void"
      },
      {
        "name": "totalVotes",
        "type": "number"
      },
      {
        "name": "myVotes",
        "type": "string[]"
      }
    ],
    "childAttributes": [
      {
        "name": "data-option",
        "on": "button",
        "type": "string",
        "required": true,
        "description": "Stable identifier sent in events"
      },
      {
        "name": "data-count",
        "on": "button",
        "type": "number",
        "description": "Current vote count"
      },
      {
        "name": "data-mine",
        "on": "button",
        "type": "boolean",
        "description": "Current user voted for this option"
      }
    ],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "pop-over": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "pop-over",
    "type": "web-component",
    "description": "General-purpose popover container with CSS Anchor Positioning. Wraps the native Popover API, binds an anchor element, and re-asserts display:none under VB's cascade layers. Trigger via standard popovertarget attribute.",
    "attributes": [
      {
        "name": "data-mode",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "auto",
          "manual",
          "hint"
        ],
        "description": "Popover dismissal mode: 'auto' (default, light-dismiss + ESC), 'manual' (script-only), 'hint' (auto with hint-stack semantics)."
      },
      {
        "name": "data-anchor",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID (or CSS selector) of the anchor element to position against. If omitted, the component finds the first element with popovertarget pointing at this pop-over."
      },
      {
        "name": "data-position",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "top",
          "bottom",
          "left",
          "right",
          "top-start",
          "top-end",
          "bottom-start",
          "bottom-end",
          "left-start",
          "left-end",
          "right-start",
          "right-end"
        ],
        "description": "Where to place the popover relative to the anchor. Default: 'bottom'."
      },
      {
        "name": "data-offset",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "none",
          "xs",
          "s",
          "m",
          "l"
        ],
        "description": "Gap between popover and anchor, mapped to --size-* tokens. Default: 'xs'."
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "popularity-index": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "popularity-index",
    "type": "web-component",
    "description": "Aggregated most-visited lens (degrades gracefully when endpoint is unavailable)",
    "attributes": [
      {
        "name": "data-lens-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Endpoint URL (default \"/api/analytics/popular\")"
      },
      {
        "name": "data-meta-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Optional pages.json URL for metadata enrichment"
      },
      {
        "name": "limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Max entries shown (default 10)"
      },
      {
        "name": "window",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Time-window query forwarded to endpoint (e.g. \"24h\", \"7d\", \"30d\")"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "print-page": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "print-page",
    "type": "web-component",
    "description": "Print button with optional raw-mode toggle",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "raw-toggle",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "If present, shows a checkbox to disable VB print styles"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Custom button label (default: \"Print this page\")"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-print-raw",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "product-roadmap": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "product-roadmap",
    "type": "web-component",
    "description": "Interactive themes × quarters product roadmap. Auto-discovers lane sections + initiative articles; editable mode wires drag-to-reschedule, drag-to-resize, and drop-on-lane.",
    "attributes": [
      {
        "name": "start",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "First date in the range (ISO 8601 or \"YYYY-Qn\"; required)"
      },
      {
        "name": "end",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Last date in the range (ISO 8601 or \"YYYY-Qn\"; required, inclusive)"
      },
      {
        "name": "view",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "quarter",
          "month"
        ],
        "description": "Time-axis granularity (default: quarter)"
      },
      {
        "name": "editable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Wire drag-to-reschedule, drag-to-resize, and lane drop"
      },
      {
        "name": "today-marker",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Render a vertical line at today's date if it falls within the range"
      }
    ],
    "structure": [
      {
        "element": "<section data-lane=\"…\">",
        "description": "One per swimlane row"
      },
      {
        "element": "<article data-start=\"…\" data-end=\"…\">",
        "description": "One per initiative bar inside a lane (data-status sets the bar color)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-lane",
        "on": "section",
        "type": "string",
        "description": "Lane name (used as the row label)"
      },
      {
        "name": "data-start",
        "on": "article",
        "type": "string",
        "description": "Initiative start date (ISO 8601 or YYYY-Qn)"
      },
      {
        "name": "data-end",
        "on": "article",
        "type": "string",
        "description": "Initiative end date (ISO 8601 or YYYY-Qn)"
      },
      {
        "name": "data-status",
        "on": "article",
        "type": "enum",
        "values": [
          "planned",
          "in-progress",
          "at-risk",
          "shipped",
          "blocked"
        ],
        "description": "Status enum; drives bar color"
      }
    ],
    "events": [
      {
        "name": "product-roadmap:select",
        "detail": "{ initiative, lane, start, end, status }",
        "description": "Fired on bar click"
      },
      {
        "name": "product-roadmap:reschedule",
        "detail": "{ initiative, lane, start, end }",
        "description": "Fired after drag-to-move snaps to grid"
      },
      {
        "name": "product-roadmap:resize",
        "detail": "{ initiative, lane, start, end }",
        "description": "Fired after drag-to-resize snaps to grid"
      },
      {
        "name": "product-roadmap:move",
        "detail": "{ initiative, fromLane, toLane, start, end }",
        "description": "Fired after a bar drops on a different lane"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "progress-tracker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "progress-tracker",
    "type": "web-component",
    "description": "Multi-step progress bar for wizards / checkout / onboarding flows. Distinct from <slide-accept> (slide-to-confirm). Author renders <li data-step> children; component decorates each with circle + connector + status (complete | current | upcoming | error).",
    "attributes": [
      {
        "name": "data-current",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "1-based index OR step id of the active step"
      },
      {
        "name": "data-clickable",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Allow clicks on completed steps to navigate back"
      },
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "List label (default \"Progress\")"
      },
      {
        "name": "role",
        "kind": "aria",
        "purpose": "config",
        "description": "Set to \"list\""
      }
    ],
    "events": [
      {
        "name": "progress-tracker:step",
        "detail": "{ step, previousStep, source: 'attr'|'click' }",
        "description": "Fires when data-current changes (programmatic) or a completed step is clicked (data-clickable mode)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-step",
        "on": "li",
        "type": "string",
        "required": true,
        "description": "Stable step identifier (typically 1-based number, can be any string)"
      },
      {
        "name": "data-error",
        "on": "li",
        "type": "boolean",
        "description": "Marks this step as errored regardless of position"
      }
    ],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "li",
        "@flow"
      ]
    }
  },
  "qr-code": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "qr-code",
    "type": "web-component",
    "description": "QR code generator web component",
    "attributes": [
      {
        "name": "value",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "The text/URL to encode (or uses textContent). Reactive."
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Canvas size in pixels (default: 200). Reactive."
      },
      {
        "name": "color",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Foreground color (default: currentColor). Init-only."
      },
      {
        "name": "background",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Background color (default: transparent). Init-only."
      },
      {
        "name": "error-correction",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Error correction level 0-3 (L/M/Q/H, default: 1/M). Init-only."
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "methods": [
      {
        "name": "toDataURL(type?)",
        "returns": "string",
        "description": "Returns the QR canvas as a data URL (default image/png)."
      },
      {
        "name": "copy(options?)",
        "returns": "Promise<boolean>",
        "description": "Copies the QR to the clipboard as text/plain (the encoded value) + image/png (the canvas). Falls back to text-only on browsers without ClipboardItem support."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "quadrant-grid": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "quadrant-grid",
    "type": "web-component",
    "description": "Generic 2x2 quadrant grid primitive (SWOT, stakeholder-map, custom)",
    "attributes": [
      {
        "name": "x-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "X-axis label"
      },
      {
        "name": "y-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Y-axis label"
      },
      {
        "name": "x-low",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "X-axis low-end marker (default: \"Low\")"
      },
      {
        "name": "x-high",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "X-axis high-end marker (default: \"High\")"
      },
      {
        "name": "y-low",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Y-axis low-end marker (default: \"Low\")"
      },
      {
        "name": "y-high",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Y-axis high-end marker (default: \"High\")"
      },
      {
        "name": "q1-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Top-right quadrant title"
      },
      {
        "name": "q2-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Top-left quadrant title"
      },
      {
        "name": "q3-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Bottom-left quadrant title"
      },
      {
        "name": "q4-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Bottom-right quadrant title"
      },
      {
        "name": "draggable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Enable drag-and-drop between quadrants (composes <drag-surface>)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-quadrant",
        "on": "*",
        "type": "number",
        "description": "Explicit quadrant index 0..3 (Cartesian Q1..Q4)"
      },
      {
        "name": "data-x",
        "on": "*",
        "type": "number",
        "description": "Normalized x coordinate 0..1; quadrant is computed from coords"
      },
      {
        "name": "data-y",
        "on": "*",
        "type": "number",
        "description": "Normalized y coordinate 0..1; quadrant is computed from coords"
      },
      {
        "name": "data-id",
        "on": "*",
        "type": "string",
        "description": "Stable identifier emitted in move events"
      }
    ],
    "events": [
      {
        "name": "quadrant-grid:move",
        "detail": "{ item, itemId, from, to }",
        "description": "Fired when a draggable child moves between quadrants"
      }
    ],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "quality-target": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "quality-target",
    "type": "web-component",
    "description": "Polygon-as-UI quality prioritization surface. The radar IS the picker: each axis is a clickable hit-target that opens a per-ility dialog (level + rationale). Pairs with <iron-triangle> via data-bind-to to read capacity. Form-associated; serializes the quality-vector schema.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "default": "quality",
        "description": "Form-association field name"
      },
      {
        "name": "data-bind-to",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID of a sibling <iron-triangle> to read capacityPoints from"
      },
      {
        "name": "data-capacity-points",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Literal capacity fallback when no triangle is bound"
      },
      {
        "name": "data-cost-weights",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "JSON object overriding default per-ility cost weights"
      },
      {
        "name": "data-radius",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "100",
        "description": "Base radius in SVG units"
      },
      {
        "name": "data-show-envelope",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Show the capacity envelope polygon (default true; set to \"false\" to hide)"
      },
      {
        "name": "data-min-rationale",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "10",
        "description": "Min characters for a Critical row's rationale"
      },
      {
        "name": "data-max-rationale",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "200",
        "description": "Max characters for the rationale textarea"
      },
      {
        "name": "data-min-overrun-rationale",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "10",
        "description": "Min characters for overrunRationale"
      },
      {
        "name": "data-max-overrun-rationale",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "400",
        "description": "Max characters for overrunRationale"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "All inputs disabled"
      },
      {
        "name": "locked",
        "kind": "host-api",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Read-only mode for shipped vectors"
      }
    ],
    "slots": [],
    "events": [
      {
        "name": "quality-target:change",
        "detail": "{ vector, rationales, costWeights, capacityPoints, criticalSum, overrunRationale, ironTriangleHash, source, field }",
        "description": "Any pick or rationale changes"
      },
      {
        "name": "quality-target:over-budget",
        "detail": "{ delta, criticalSum, capacityPoints }",
        "description": "The selection just crossed into over-budget"
      },
      {
        "name": "quality-target:under-budget",
        "detail": "{ slack, criticalSum, capacityPoints }",
        "description": "The selection just returned within budget"
      }
    ]
  },
  "reaction-bar": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "reaction-bar",
    "type": "web-component",
    "description": "GitHub-style emoji reaction picker. Persistent bar of reaction chips with counts + a trigger that opens a curated palette popover. Composes pop-over for the palette surface.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Toolbar label (default \"Reactions\")"
      },
      {
        "name": "data-trigger-icon",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Text/emoji content of the trigger button (default \"😀\")"
      },
      {
        "name": "data-trigger-label",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "aria-label for the trigger (default \"Add reaction\")"
      },
      {
        "name": "data-disabled",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Read-only mode — chips don't toggle, trigger is disabled"
      },
      {
        "name": "role",
        "kind": "aria",
        "purpose": "config",
        "description": "Set to \"toolbar\""
      }
    ],
    "events": [
      {
        "name": "reaction-bar:toggle",
        "description": "Fires when a chip or palette option is clicked. detail: { reaction, action: 'add'|'remove', count, mine }"
      },
      {
        "name": "reaction-bar:palette-open",
        "description": "Fires when the palette popover opens"
      },
      {
        "name": "reaction-bar:palette-close",
        "description": "Fires when the palette popover closes"
      }
    ],
    "childAttributes": [
      {
        "name": "data-reaction",
        "on": "button",
        "type": "string",
        "required": true,
        "description": "Stable identifier sent to the backend (e.g. thumbsup, heart)"
      },
      {
        "name": "data-count",
        "on": "button",
        "type": "number",
        "description": "Current count (≥ 1 to show; 0 removes the chip)"
      },
      {
        "name": "data-mine",
        "on": "button",
        "type": "boolean",
        "description": "Whether the current user has this reaction"
      },
      {
        "name": "data-palette",
        "on": "template",
        "type": "boolean",
        "description": "Marks a <template> child as the available-reactions palette"
      }
    ],
    "structure": []
  },
  "reader-view": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "reader-view",
    "type": "web-component",
    "description": "Immersive reading shell with scroll and paged modes.",
    "attributes": [
      {
        "name": "upgraded",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "mode",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "columns",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "font-controls",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "col-controls",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "reader-title",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "persist",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "storage-key",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-reader-state",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "aria-pressed",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "reading-progress": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "reading-progress",
    "type": "web-component",
    "description": "Fixed-position scroll progress indicator bar",
    "attributes": [
      {
        "name": "data-for",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID of the target element to bound progress against. Without it, tracks document scroll."
      },
      {
        "name": "data-position",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "string",
        "description": "Where to anchor the bar: 'top' (default) or 'bottom'"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "recently-visited": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "recently-visited",
    "type": "web-component",
    "description": "Device-local reader history lens (localStorage, never aggregated)",
    "attributes": [
      {
        "name": "limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Max entries kept in local history (default 25)"
      },
      {
        "name": "no-track",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Don't append the current page on connectedCallback"
      },
      {
        "name": "empty-text",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Message rendered when there is no history"
      }
    ],
    "events": [
      {
        "name": "recently-visited:clear",
        "description": "Fires when the reader clears the local history"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "requirement-card": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "requirement-card",
    "type": "web-component",
    "description": "Display-only card for ONE NFR ility row. Renders priority + rationale + optional conflict flag for status dashboards and ADR appendices. The prioritization decision itself lives in <nfr-compass>.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-priority",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "critical",
          "important",
          "acceptable",
          "not-relevant"
        ],
        "description": "Drives :state(priority-*), default pill text, and accent color"
      },
      {
        "name": "data-conflict",
        "kind": "data",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Flag a conflict / drift note; renders an emphasized border"
      },
      {
        "name": "tabindex",
        "kind": "native",
        "purpose": "config",
        "type": "number",
        "description": "Set to 0 to make the card directly focusable + activatable (otherwise wrap in <a>/<button>)"
      }
    ],
    "slots": [
      {
        "name": "name",
        "description": "Ility label (e.g. \"Performance\")"
      },
      {
        "name": "badge",
        "description": "Category / version / source tag (small uppercase muted text)"
      },
      {
        "name": "priority-pill",
        "description": "Author-supplied custom pill; default pill renders from data-priority when this slot is empty"
      },
      {
        "name": "rationale",
        "description": "Why this priority was chosen (especially for Critical rows)"
      },
      {
        "name": "conflicts",
        "description": "Short conflict / drift note (paired with data-conflict)"
      }
    ],
    "events": [
      {
        "name": "requirement-card:click",
        "detail": "{ priority, hasConflict, originalEvent }",
        "description": "Bubbles when the card is activated by mouse, keyboard, or touch (only when the card is interactive — wrapped in <a>/<button> or has tabindex)"
      }
    ]
  },
  "review-surface": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "review-surface",
    "type": "web-component",
    "description": "Pin-based annotation overlay for design review — wraps any content and adds interactive comment pins with pluggable persistence",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON file containing pin data"
      },
      {
        "name": "editable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Enables annotate mode toolbar and pin creation"
      },
      {
        "name": "adapter",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Persistence backend: memory | local | rest"
      },
      {
        "name": "endpoint",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "REST endpoint URL (when adapter=rest)"
      },
      {
        "name": "storage-key",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "VBStore key under namespace 'reviews' (when adapter=local)"
      },
      {
        "name": "author",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Default author name for new pins"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      },
      {
        "name": "show-resolved",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Display resolved pins (hidden by default)"
      },
      {
        "name": "pin-count",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Reflected count of visible pins (read-only)"
      }
    ],
    "slots": [
      {
        "name": "(default)",
        "description": "The content to annotate (any HTML)"
      }
    ],
    "events": [
      {
        "name": "review-surface:ready",
        "detail": "{ pinCount }",
        "description": "Fired after initial render"
      },
      {
        "name": "review-surface:add",
        "detail": "{ pin }",
        "description": "Fired when a pin is created"
      },
      {
        "name": "review-surface:update",
        "detail": "{ pin, changes }",
        "description": "Fired when a pin is modified"
      },
      {
        "name": "review-surface:remove",
        "detail": "{ pin }",
        "description": "Fired when a pin is deleted"
      },
      {
        "name": "review-surface:resolve",
        "detail": "{ pin }",
        "description": "Fired when a pin is marked resolved"
      },
      {
        "name": "review-surface:select",
        "detail": "{ pin }",
        "description": "Fired when a pin popover is opened"
      },
      {
        "name": "review-surface:mode",
        "detail": "{ mode }",
        "description": "Fired when view/annotate mode toggles"
      }
    ]
  },
  "risk-register": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "risk-register",
    "type": "web-component",
    "description": "Composing preset that renders a sortable risk table + a likelihood × impact quadrant grid from one source",
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON [{ id, title, likelihood, impact, owner, mitigation }]"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading shown above the layout"
      }
    ],
    "structure": [
      {
        "element": "<template>",
        "description": "Inline data source: <tr> rows with cells [Title, Likelihood, Impact, Owner, Mitigation]"
      }
    ],
    "childAttributes": [],
    "events": [
      {
        "name": "risk-register:ready",
        "detail": "{ count }",
        "description": "Fired after the table + grid render"
      },
      {
        "name": "risk-register:change",
        "detail": "{ row, field, value }",
        "description": "Reserved: emitted on inline edits (future)"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "score-card": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "score-card",
    "type": "web-component",
    "description": "Single KPI tile for dashboards: title, headline value, optional change indicator, sparkline (composed with <chart-wc>), description, and icon. Wrap in <a href> for drill-down.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "trend",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "up",
          "down",
          "flat"
        ],
        "description": "Drives change-indicator color and exposes :state(trend-up|trend-down|trend-flat)"
      },
      {
        "name": "tone",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "default",
          "success",
          "warning",
          "error",
          "info"
        ],
        "description": "Optional accent color applied to the icon slot"
      },
      {
        "name": "layout",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "stack",
          "cluster",
          "compact"
        ],
        "description": "Grid template variant: vertical stack, icon-cluster row, or dense compact"
      },
      {
        "name": "loading",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Skeleton placeholder state via :state(loading)"
      }
    ],
    "slots": [
      {
        "name": "title",
        "description": "Metric label"
      },
      {
        "name": "value",
        "description": "Headline number — use <data value=\"...\"> for machine-readable values"
      },
      {
        "name": "change",
        "description": "Delta indicator — recommend nested <data> for the change value"
      },
      {
        "name": "sparkline",
        "description": "Trend visualisation — compose with <chart-wc data-type=\"line|area\"> or any sized element"
      },
      {
        "name": "description",
        "description": "Supporting context line below the metric"
      },
      {
        "name": "icon",
        "description": "Brand or category icon (recommend <icon-wc>)"
      }
    ],
    "parts": [
      {
        "name": "card",
        "description": "Outer grid container"
      },
      {
        "name": "title",
        "description": "Title slot wrapper"
      },
      {
        "name": "value",
        "description": "Value slot wrapper"
      },
      {
        "name": "change",
        "description": "Change slot wrapper"
      },
      {
        "name": "sparkline",
        "description": "Sparkline slot wrapper"
      },
      {
        "name": "description",
        "description": "Description slot wrapper"
      },
      {
        "name": "icon",
        "description": "Icon slot wrapper"
      }
    ]
  },
  "selection-menu": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "selection-menu",
    "type": "web-component",
    "description": "Floating toolbar that appears on text selection. Composes action components like highlight-wc, share-wc, note-wc.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "for",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ID of a single target element to watch for text selection"
      }
    ],
    "structure": [
      {
        "element": "<highlight-wc>",
        "description": "Text highlighting with color palette"
      },
      {
        "element": "<share-wc variant=\"selection\">",
        "description": "Share selected text quote"
      },
      {
        "element": "<note-wc>",
        "description": "Private note on highlight"
      },
      {
        "element": "<comment-wc>",
        "description": "Inline comment (future)"
      }
    ],
    "css": {
      "tokens": []
    }
  },
  "semantic-palette": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "semantic-palette",
    "type": "web-component",
    "description": "Preview a palette in use as VB semantic roles. Reads colors from a descendant <color-palette> or <palette-generator> and renders one preview card per role with per-pairing WCAG chips. Editing happens upstream in the palette; this component is a preview + theme CSS exporter.",
    "attributes": [
      {
        "name": "colors",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated hex palette (fallback when no <color-palette> or <palette-generator> child)."
      },
      {
        "name": "roles",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated roles in assignment order. Valid: primary, secondary, accent, success, warning, error, info. Default: \"primary,secondary,accent\"."
      },
      {
        "name": "show-export",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show Copy Theme CSS / Copy JSON toolbar."
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label above the previews."
      }
    ],
    "events": [
      {
        "name": "semantic-palette:change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "settings-panel": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "settings-panel",
    "type": "web-component",
    "description": "Compact settings panel",
    "attributes": [
      {
        "name": "open",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Reflected state only — set by open()/close()/toggle() methods, not intended as initial markup"
      },
      {
        "name": "data-trigger",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "aria-haspopup",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "vb:a11y-themes-change"
      },
      {
        "name": "vb:extensions-change"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "share-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "share-wc",
    "type": "web-component",
    "description": "Social share component with native Web Share API and platform fallbacks",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to share (default: location.href)"
      },
      {
        "name": "title",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Share title (default: document.title)"
      },
      {
        "name": "text",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Share description (default: meta description)"
      },
      {
        "name": "platforms",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated platform list (default: \"x,linkedin,bluesky,mastodon,whatsapp,email,copy\")"
      },
      {
        "name": "variant",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Visual variant: \"icon\", \"label\", \"icon-label\" (default: \"icon-label\")"
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Button size: \"s\", \"m\", \"l\" (default: \"m\")"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Label for native share button (default: \"Share\")"
      },
      {
        "name": "color",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Present = use platform brand colours"
      },
      {
        "name": "mastodon-instance",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Mastodon instance (default: \"mastodon.social\")"
      },
      {
        "name": "tier",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Force tier: \"native\", \"platforms\" (overrides auto-detection)"
      },
      {
        "name": "data-tier-resolved",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "href",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "content",
        "kind": "host-api",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "share-wc:open"
      },
      {
        "name": "share-wc:success"
      },
      {
        "name": "share-wc:error"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "short-cuts": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "short-cuts",
    "type": "web-component",
    "description": "Keyboard shortcuts help overlay",
    "attributes": [],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "site-index": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "site-index",
    "type": "web-component",
    "description": "Interactive site keyword index",
    "attributes": [
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Search input placeholder (default \"Filter index…\")"
      },
      {
        "name": "letters",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Jump nav mode: \"entries\" (default) | \"all\" | \"none\""
      },
      {
        "name": "filter",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Search scope: \"topic\" (default) | \"all\""
      },
      {
        "name": "sort",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Sort mode: \"alpha\" (default) | \"count\""
      },
      {
        "name": "limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Max entries per letter before \"Show more\" toggle"
      },
      {
        "name": "src",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "URL to load index data from (optional)"
      },
      {
        "name": "data-index-controls",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-index-search",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "href",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-index-overflow",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-index-expand",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "site-map": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "site-map",
    "type": "web-component",
    "description": "Dual-mode sitemap: a lightweight static-sitemap enhancer (nav-enhance) or an interactive information-architecture tree with badges and an org-chart visual mode (ia-tree)",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "nav"
      ]
    },
    "attributes": [
      {
        "name": "mode",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Behavior mode: nav-enhance (default) | ia-tree"
      },
      {
        "name": "current",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "[nav-enhance] Pathname of the current page"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON data (nav-enhance: { children }, ia-tree: { title, pages })"
      },
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "[ia-tree] Site map heading"
      },
      {
        "name": "collapsed",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "[ia-tree] Start all nodes collapsed"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "[ia-tree] Reduced spacing variant"
      },
      {
        "name": "data-view",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "[ia-tree] Set to \"visual\" for the org-chart visualization"
      },
      {
        "name": "data-orientation",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "[ia-tree visual] Layout orientation"
      },
      {
        "name": "data-detail",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "[ia-tree visual] Node detail level"
      },
      {
        "name": "data-sitemap-controls",
        "kind": "data",
        "purpose": "config",
        "description": "[nav-enhance] Marks the generated expand/collapse-all controls nav"
      }
    ],
    "childAttributes": [
      {
        "name": "data-page-type",
        "on": "li",
        "type": "string",
        "description": "[ia-tree] Page type: layout | section | dashboard | page | modal | redirect"
      },
      {
        "name": "data-template",
        "on": "li",
        "type": "string",
        "description": "[ia-tree] Template or view name shown as a badge"
      },
      {
        "name": "data-status",
        "on": "li",
        "type": "string",
        "description": "[ia-tree] Page status: draft | ready | live | deprecated"
      }
    ],
    "events": [
      {
        "name": "site-map:ready",
        "detail": "{ nodeCount, depth }",
        "description": "[ia-tree] Fired after component initializes"
      },
      {
        "name": "site-map:select",
        "detail": "{ href, pageType, template }",
        "description": "[ia-tree] Node clicked — dispatched with page details"
      }
    ],
    "structure": []
  },
  "site-search": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "site-search",
    "type": "web-component",
    "description": "Full-page search dialog with keyboard navigation and result highlighting",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "open",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "description": "Reflected state — set by open()/close() methods, not intended as initial markup"
      }
    ],
    "structure": [
      {
        "element": "<button data-trigger>",
        "description": "Button that opens the search dialog"
      }
    ],
    "childAttributes": [
      {
        "name": "data-trigger",
        "on": "button",
        "type": "boolean",
        "required": true,
        "description": "Marks the button that opens the search dialog. Falls back to first <button> if absent."
      }
    ],
    "events": [
      {
        "name": "site-search:open",
        "description": "Fired when the search dialog opens"
      },
      {
        "name": "site-search:close",
        "description": "Fired when the search dialog closes"
      }
    ]
  },
  "slide-accept": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "slide-accept",
    "type": "web-component",
    "description": "Slide-to-confirm interaction",
    "attributes": [
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Track label text (default: \"Slide to confirm\")"
      },
      {
        "name": "activated-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Label after activation (default: \"Confirmed!\")"
      },
      {
        "name": "attention",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Attention animation: \"shimmer\" | \"pulse\""
      },
      {
        "name": "threshold",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Activation threshold 0-100 (default: 90)"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-valuemin",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuemax",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuenow",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "data-activated",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "transitioning",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-dragging",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "slide-accept:reset"
      },
      {
        "name": "slide-accept:accept"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "social-embed": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "social-embed",
    "type": "web-component",
    "attributes": [
      {
        "name": "url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL of content to embed (required)"
      },
      {
        "name": "provider",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Explicit provider key (auto-detected if omitted)"
      },
      {
        "name": "theme",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Theme hint: light | dark | auto (default: auto)"
      },
      {
        "name": "activate",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Activation trigger: click | visible | eager (default: click)"
      },
      {
        "name": "state",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Lifecycle state (read-only, set by component)"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-embed-live",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "style",
        "kind": "host-api",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "spacing-specimen": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "spacing-specimen",
    "type": "web-component",
    "description": "Design token spacing scale display",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "tokens",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated token names to display"
      },
      {
        "name": "prefix",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS variable prefix (default: \"--size-\")"
      },
      {
        "name": "show-values",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show computed px values (default: true)"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label"
      },
      {
        "name": "editable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Turn value cells into inputs that write the token on the target scope."
      },
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for the element to receive token overrides (default: \":root\"). Only used when editable."
      }
    ],
    "events": [
      {
        "name": "spacing-specimen:change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "split-surface": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "split-surface",
    "type": "web-component",
    "description": "Resizable split panel with drag, keyboard, and persistence support",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "direction",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "Split axis"
      },
      {
        "name": "position",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "50",
        "direction": "both",
        "description": "Split position as percentage (0–100)"
      },
      {
        "name": "min",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "10",
        "description": "Minimum panel size percentage"
      },
      {
        "name": "max",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "90",
        "description": "Maximum panel size percentage"
      },
      {
        "name": "persist",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "VBStore key suffix under namespace 'layout' (vb:layout:split:{key}) for position persistence"
      },
      {
        "name": "collapsible",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Double-click divider to collapse first panel"
      }
    ],
    "structure": [
      {
        "element": "first child",
        "description": "First panel content"
      },
      {
        "element": "second child",
        "description": "Second panel content — divider is auto-created between them"
      }
    ],
    "events": [
      {
        "name": "split-surface:resize",
        "detail": "{ position }",
        "description": "Fired when panel is resized"
      },
      {
        "name": "split-surface:collapse",
        "detail": "{ collapsed }",
        "description": "Fired when panel is collapsed or expanded"
      }
    ]
  },
  "star-rating": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "star-rating",
    "type": "web-component",
    "description": "Form-associated star rating web component",
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name (omit for read-only)"
      },
      {
        "name": "value",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Current rating value (default: 0)"
      },
      {
        "name": "max",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Number of stars (default: 5)"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Legend text (default: \"Rating\")"
      },
      {
        "name": "allow-half",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Enable half-star increments"
      },
      {
        "name": "readonly",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Display-only mode"
      },
      {
        "name": "icon",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Lucide icon name for icon-wc (default: star text)"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Makes rating required for form validation"
      },
      {
        "name": "data-rating",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-rating-half",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-effect",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-half",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-rating-readonly",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "status-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "status-wc",
    "type": "web-component",
    "description": "Visual state indicator. Variant drives color + animation. Pairs with status-message (textual) and notification-wc (action-bearing).",
    "attributes": [
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Built-in: live, recording, streaming, error, online, running, away, paused, busy, offline, stopped. Custom variants supported via CSS only."
      },
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "xs | sm | md (default) | lg — dot diameter scale"
      },
      {
        "name": "data-position",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "before (default) | after | only — dot position relative to label; \"only\" visually hides label"
      },
      {
        "name": "data-pulse",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "on | off — override the variant's default animation"
      },
      {
        "name": "data-live",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Set to \"off\" to suppress live-region announcements (decorative use)"
      },
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Required when slot has no text content"
      },
      {
        "name": "role",
        "kind": "aria",
        "purpose": "config",
        "description": "Defaults to \"status\""
      },
      {
        "name": "aria-live",
        "kind": "aria",
        "purpose": "config",
        "description": "Defaults to \"polite\""
      }
    ],
    "events": [
      {
        "name": "status-wc:change",
        "description": "Fires when data-variant mutates. detail: { variant, previousVariant }"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "cssProperties": [
      {
        "name": "--status-dot-size",
        "description": "Dot diameter (overrides data-size)"
      },
      {
        "name": "--status-dot-color",
        "description": "Dot color (overrides variant default)"
      },
      {
        "name": "--status-pulse-duration",
        "description": "Pulse cycle duration"
      },
      {
        "name": "--status-animation",
        "description": "Direct animation shorthand override"
      },
      {
        "name": "--status-gap",
        "description": "Gap between dot and label"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "stepper-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "stepper-wc",
    "type": "web-component",
    "description": "Stepper for values <input type=\"number\"> + data-stepper cannot reach: formatted units, currency, time, token-snap scales, discrete enums.",
    "attributes": [
      {
        "name": "value",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Current value (string; reflected)"
      },
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name for form participation"
      },
      {
        "name": "data-min",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Numeric minimum (numeric/formatted modes only)"
      },
      {
        "name": "data-max",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Numeric maximum (numeric/formatted modes only)"
      },
      {
        "name": "data-step",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Step increment (default 1)"
      },
      {
        "name": "data-values",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Token-snap mode: comma-separated list of values"
      },
      {
        "name": "data-options",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Enum mode: JSON [{value,label}] array or csv shorthand (value==label)"
      },
      {
        "name": "data-format",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Formatted mode: number | currency | percent | duration | bytes"
      },
      {
        "name": "data-currency",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ISO 4217 code, used when data-format=\"currency\" (default USD)"
      },
      {
        "name": "data-suffix",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Static suffix appended to display, e.g. \"px\""
      },
      {
        "name": "data-show-label",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Token mode: display the token name (strips leading --)"
      },
      {
        "name": "data-accelerate",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Enable long-press acceleration on the +/- buttons"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "readonly",
        "kind": "native",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "role",
        "kind": "aria",
        "purpose": "config",
        "description": "spinbutton on the inner display element"
      },
      {
        "name": "aria-valuenow",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuemin",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuemax",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuetext",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-disabled",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "input",
        "description": "Fires on every value change. Bubbles."
      },
      {
        "name": "change",
        "description": "Fires when value changes. Bubbles."
      }
    ],
    "childAttributes": [],
    "structure": [],
    "states": [
      {
        "name": "at-min",
        "description": "Value is at the lower bound"
      },
      {
        "name": "at-max",
        "description": "Value is at the upper bound"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "story-map": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "story-map",
    "type": "web-component",
    "description": "Horizontal user story map with activity columns and drag-and-drop between columns",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "section"
      ]
    },
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON data with activities and stories"
      },
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading above the story map"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ],
    "childAttributes": [
      {
        "name": "data-activity",
        "on": "section",
        "type": "string",
        "description": "Activity column identifier"
      },
      {
        "name": "data-activity-label",
        "on": "section",
        "type": "string",
        "description": "Display label for the column header"
      },
      {
        "name": "data-journey-phase",
        "on": "section",
        "type": "string",
        "description": "Optional link to a user-journey phase"
      }
    ],
    "events": [
      {
        "name": "story-map:reorder",
        "detail": "{ itemId, activity, oldIndex, newIndex }",
        "description": "Item reordered within a column"
      },
      {
        "name": "story-map:transfer",
        "detail": "{ itemId, fromActivity, toActivity, newIndex }",
        "description": "Item moved between columns"
      },
      {
        "name": "story-map:ready",
        "detail": "{ activityCount, storyCount }",
        "description": "Fired after component initializes"
      }
    ]
  },
  "tab-set": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "tab-set",
    "type": "web-component",
    "description": "Tab container built on native details/summary with keyboard navigation and view transitions",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "details",
        "nav",
        "section",
        "@script"
      ]
    },
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "semantic-state",
        "type": "string",
        "description": "Accessible label for the tab group"
      },
      {
        "name": "transition",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "fade",
          "slide",
          "scale"
        ],
        "description": "View Transition animation between tab panels"
      }
    ],
    "structure": [
      {
        "element": "<details>",
        "description": "One per tab — native disclosure element provides open/close state"
      },
      {
        "element": "<summary>",
        "description": "Tab label inside each <details>"
      }
    ],
    "events": [
      {
        "name": "tab-set:change",
        "detail": "{ index }",
        "description": "Fired when the active tab changes"
      }
    ]
  },
  "text-reader": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "text-reader",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "for",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "ID of the element to read (required)"
      },
      {
        "name": "selectors",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated selectors for text extraction (default: \"p,li\")"
      },
      {
        "name": "speed",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Playback rate 0.5–2 (default: 1)"
      },
      {
        "name": "voice",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "voiceURI to pre-select"
      },
      {
        "name": "highlight",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Set to \"false\" to disable word highlighting"
      },
      {
        "name": "scroll",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Set to \"false\" to disable auto-scroll"
      },
      {
        "name": "part",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "label-play",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "label-pause",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "label-stop",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-speed-group",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-speed-value",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "slot",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "theme-catalog": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "theme-catalog",
    "type": "web-component",
    "description": "Browse and apply curated public design-system token sets (Material, IBM Carbon, Salesforce Lightning, GOV.UK, Atlassian, Tailwind, Bootstrap, Catppuccin Mocha). Renders a tile grid; clicking a tile fetches the entry's DTCG file and applies its tokens to a target preview scope via the same deserializer <theme-import> uses.",
    "attributes": [
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "#preview",
        "description": "CSS selector for the scope to apply tokens to. Tokens land as inline custom properties."
      },
      {
        "name": "catalog-base",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Base URL for catalog files (manifest.json + entry .tokens.json). Defaults to /cdn/themes/catalog; override for hosted contexts."
      }
    ],
    "events": [
      {
        "name": "theme-catalog:applied",
        "description": "Fired after an entry is applied. detail: { id, applied, ignored, tokens, source }"
      },
      {
        "name": "theme-catalog:error",
        "description": "Fired when fetch / parse / apply fails. detail: { id, error, phase }"
      }
    ]
  },
  "theme-export": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "theme-export",
    "type": "web-component",
    "description": "Collects VB custom property overrides from a scope and emits them as a theme.css block (or JSON). The assembly glue for the Theme Composer.",
    "attributes": [
      {
        "name": "scope",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": ":root",
        "description": "CSS selector for the scope to read overrides from."
      },
      {
        "name": "selector",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": ":root",
        "description": "Selector written in the emitted CSS output."
      },
      {
        "name": "include",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated prefixes to collect. Default covers all VB token categories."
      },
      {
        "name": "format",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "css",
          "json",
          "dtcg"
        ],
        "default": "css",
        "description": "Output format. 'dtcg' emits Design Tokens Community Group JSON (stable spec 2025.10)."
      },
      {
        "name": "vb-version",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional VB version string included in DTCG $extensions metadata."
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label."
      },
      {
        "name": "live",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Re-scan whenever an editable specimen fires a :change event."
      }
    ],
    "events": [
      {
        "name": "theme-export:change"
      }
    ]
  },
  "theme-import": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "theme-import",
    "type": "web-component",
    "description": "Apply a DTCG (Design Tokens Community Group, stable 2025.10) tokens.json file to a preview scope. Sibling of <theme-export>. Three input modes: paste, file, URL. Round-trip lossless for VB-authored DTCG via $extensions['com.vanilla-breeze'].",
    "attributes": [
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "#preview",
        "description": "CSS selector for the scope to apply tokens to. Tokens are written as inline custom properties on this element."
      },
      {
        "name": "placeholder",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Textarea placeholder for the paste input."
      }
    ],
    "events": [
      {
        "name": "theme-import:applied",
        "description": "Fired after tokens are applied. detail: { tokens, applied, ignored, source }"
      },
      {
        "name": "theme-import:error",
        "description": "Fired when parse / fetch / apply fails. detail: { error, phase }"
      }
    ]
  },
  "theme-picker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "theme-picker",
    "type": "web-component",
    "description": "Theme selection component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "variant",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Display variant: 'popover' (default), 'inline'"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Render theme section as grouped select dropdown"
      },
      {
        "name": "open",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Reflected state only — set by open()/close()/toggle() methods, not intended as initial markup (popover variant only)"
      },
      {
        "name": "data-trigger",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "aria-haspopup",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-busy",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "vb:extensions-change"
      },
      {
        "name": "theme-picker:open"
      },
      {
        "name": "theme-picker:close"
      },
      {
        "name": "theme-picker:dtcg-download",
        "description": "Fired when a user clicks the per-swatch DTCG download link. Native <a download> still handles the save; this event is for analytics / consumer hooks. detail: { themeId, href }"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "time-index": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "time-index",
    "type": "web-component",
    "description": "Interactive changelog/timeline component",
    "attributes": [
      {
        "name": "group",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "'month' (default) or 'version'"
      },
      {
        "name": "view",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "'date' or 'version' — grouping view"
      },
      {
        "name": "versions",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Enable version jump select"
      },
      {
        "name": "updates-src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL for recently updated pages JSON"
      },
      {
        "name": "data-timeline-controls",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "time-picker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "time-picker",
    "type": "web-component",
    "description": "Form-associated time input with combobox text entry",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form field name"
      },
      {
        "name": "data-format",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "\"12h\" or \"24h\" (default: locale-detected)"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Disables the picker"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Makes selection required"
      },
      {
        "name": "step",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "min",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "max",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-disabled",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "aria-haspopup",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "autocomplete",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "aria-valuemin",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuemax",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "data-open",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "aria-valuenow",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "aria-valuetext",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "time-picker:change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "toast-msg": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "toast-msg",
    "type": "web-component",
    "description": "Toast notification container with stacking, auto-dismiss, and position options",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "position",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "top-start",
          "top-center",
          "top-end",
          "bottom-start",
          "bottom-center",
          "bottom-end"
        ],
        "description": "Screen position for the toast stack"
      },
      {
        "name": "duration",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Default auto-dismiss duration in milliseconds"
      },
      {
        "name": "max",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Maximum number of visible toasts"
      }
    ]
  },
  "token-specimen": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "token-specimen",
    "type": "web-component",
    "description": "Unified design token scale display. Renders shadows, radii, borders, colors, or sizes based on the type attribute.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "type",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "shadow",
          "radius",
          "border",
          "color",
          "size",
          "icon"
        ],
        "description": "Token type to display"
      },
      {
        "name": "tokens",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated token names (for icon type: comma-separated icon names). Defaults vary by type"
      },
      {
        "name": "prefix",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS variable prefix (auto-set from type if omitted; ignored for icon type)"
      },
      {
        "name": "show-values",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "default": "true",
        "description": "Show computed token values (for icon type: show icon name labels)"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label"
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Icon size (icon type only): xs, sm, md, lg, xl, 2xl"
      },
      {
        "name": "icon-set",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Icon set (icon type only): lucide, phosphor, tabler, etc. Defaults to icon-wc's default"
      },
      {
        "name": "editable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Turn value cells into inputs that write the token on the target scope. Ignored for icon type."
      },
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for the element to receive token overrides (default: \":root\"). Only used when editable."
      }
    ],
    "events": [
      {
        "name": "token-specimen:change"
      }
    ]
  },
  "tool-tip": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "tool-tip",
    "type": "web-component",
    "description": "Enhanced tooltip with Popover API + interestfor",
    "attributes": [
      {
        "name": "content",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Simple text tooltip content"
      },
      {
        "name": "position",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Position: 'top' (default), 'bottom', 'left', 'right'"
      },
      {
        "name": "delay",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Show delay in ms (default: 200)"
      },
      {
        "name": "variant",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Variant: omit for tooltip (default), 'card' for hover card"
      },
      {
        "name": "data-interest-polyfill",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "title",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      },
      {
        "name": "data-anchor",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "interestfor",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-content",
        "kind": "data",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "tool-tip:show"
      },
      {
        "name": "tool-tip:hide"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "topic-map": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "topic-map",
    "type": "web-component",
    "description": "SKOS-aware hierarchical view of site concepts. Joins vocabulary.json (skos:broader/narrower edges) with pages.json (each page's concepts:[] array) to render a nested <details> tree rooted at top concepts.",
    "attributes": [
      {
        "name": "data-lens-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "URL to pages.json. Each page record must expose a concepts:[] array (per meta-tag-contract v1.1)."
      },
      {
        "name": "src",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Alias for data-lens-src."
      },
      {
        "name": "data-vocabulary-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "/vocabulary.json",
        "description": "URL to the SKOS vocabulary.json. Provides concept @id, skos:prefLabel, and skos:broader/narrower/hasTopConcept edges used to build the tree."
      },
      {
        "name": "expand-all",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Render with every level expanded. Default opens only the top-level concepts."
      }
    ],
    "childAttributes": [],
    "structure": [
      {
        "element": "details[data-topic-node]",
        "required": false,
        "description": "Generated. One <details> per concept node. data-topic-node carries the concept @id (or '__uncategorized'). Native disclosure widgets work without JS."
      },
      {
        "element": "summary > a.topic-name",
        "required": false,
        "description": "Generated. Concept prefLabel linked to /topics/{id}/."
      },
      {
        "element": "summary > .topic-count",
        "required": false,
        "description": "Generated. Total page count for the concept and all descendant concepts."
      },
      {
        "element": "ul.topic-pages > li > a",
        "required": false,
        "description": "Generated. Pages tagged directly with this concept, in source order."
      },
      {
        "element": "p[data-topic-map-error]",
        "required": false,
        "description": "Rendered when either data source fails to load."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "traceability-matrix": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "traceability-matrix",
    "type": "web-component",
    "description": "Auto-discovers a 2D cross-reference grid from page elements (RTM); composes <data-table> for sortable + heatmap-able presentation",
    "attributes": [
      {
        "name": "rows",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for row source elements"
      },
      {
        "name": "cols",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for column source elements"
      },
      {
        "name": "link-attr",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Attribute on the row element whose value(s) reference column ids; comma-separated values supported"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading shown above the matrix"
      },
      {
        "name": "row-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Header cell text for the row axis"
      },
      {
        "name": "cell-mark",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Glyph shown in linked cells (default: ✓)"
      },
      {
        "name": "flag-orphans",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Mark empty rows/columns with data-orphan for CSS targeting"
      }
    ],
    "childAttributes": [
      {
        "name": "data-matrix-label",
        "on": "*",
        "type": "string",
        "description": "Override the label rendered for this element in matrices that include it"
      }
    ],
    "events": [
      {
        "name": "traceability-matrix:ready",
        "detail": "{ rowCount, colCount, linkCount }",
        "description": "Fired after the matrix renders"
      },
      {
        "name": "traceability-matrix:highlight",
        "detail": "{ rowEl, colEl, on }",
        "description": "Fired when a cell toggles chain highlight"
      }
    ],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "trust-filter": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "trust-filter",
    "type": "web-component",
    "description": "Provenance-based filter lens (vb:provenance, vb:review, vb:status, signed)",
    "attributes": [
      {
        "name": "data-lens-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "URL to pages.json (or compatible source)"
      },
      {
        "name": "src",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Alias for data-lens-src"
      }
    ],
    "events": [
      {
        "name": "trust-filter:change",
        "detail": "{ selected, count }",
        "description": "Fires when the reader changes any filter chip"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "type-specimen": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "type-specimen",
    "type": "web-component",
    "description": "Typography specimen display",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "font-family",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS font-family value"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Display name for the font (optional, falls back to font-family)"
      },
      {
        "name": "sample",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Custom sample text (default: \"The quick brown fox...\")"
      },
      {
        "name": "show-scale",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show VB type scale (xs–5xl)"
      },
      {
        "name": "show-weights",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show weight scale (100–900)"
      },
      {
        "name": "show-characters",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Show character grid"
      },
      {
        "name": "weights",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated available weights (default: \"400,700\")"
      },
      {
        "name": "editable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Turn the font-family label into a live input + quick-picks that write a CSS custom property."
      },
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for the element to receive token overrides (default: \":root\"). Only used when editable."
      },
      {
        "name": "token",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Token name to write when editing (default: \"font-family-base\"). Only used when editable."
      }
    ],
    "events": [
      {
        "name": "type-specimen:change"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "user-journey": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "user-journey",
    "type": "web-component",
    "description": "Visualises a multi-phase user journey with SVG emotion curve and structured breakdown grid",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Journey map title"
      },
      {
        "name": "persona",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Persona name"
      },
      {
        "name": "persona-id",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Links to a user-persona element by id"
      },
      {
        "name": "summary",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "One-line journey description"
      },
      {
        "name": "story-ids",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated related story IDs"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON file containing phase data"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      }
    ],
    "slots": [
      {
        "name": "title",
        "description": "Journey title (slot fallback for attribute)"
      },
      {
        "name": "persona",
        "description": "Persona name (slot fallback for attribute)"
      },
      {
        "name": "summary",
        "description": "One-line description (slot fallback for attribute)"
      }
    ],
    "events": [
      {
        "name": "journey-ready",
        "detail": "{ title, persona, phaseCount }",
        "description": "Fired after render completes"
      }
    ]
  },
  "user-persona": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "user-persona",
    "type": "web-component",
    "description": "Displays a user persona card with avatar, demographics, quote, and slotted sections for goals, frustrations, and behaviors",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "name",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Persona name (drives avatar initials and color)"
      },
      {
        "name": "role",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Job title or role"
      },
      {
        "name": "age",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Age display"
      },
      {
        "name": "location",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Location display"
      },
      {
        "name": "avatar",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional avatar image URL"
      },
      {
        "name": "quote",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Key quote displayed in highlight block"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON file containing persona data"
      },
      {
        "name": "data-list-stories",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Render a Stories section that auto-lists every <user-story persona-id=\"…\"> matching this persona's id. Updates live when stories are added, removed, or relabeled."
      }
    ],
    "slots": [
      {
        "name": "name",
        "description": "Persona name (slot fallback for attribute)"
      },
      {
        "name": "role",
        "description": "Job title or role (slot fallback for attribute)"
      },
      {
        "name": "age",
        "description": "Age display (slot fallback for attribute)"
      },
      {
        "name": "location",
        "description": "Location display (slot fallback for attribute)"
      },
      {
        "name": "quote",
        "description": "Key quote (slot fallback for attribute)"
      },
      {
        "name": "bio",
        "description": "Background narrative paragraph"
      },
      {
        "name": "goals",
        "description": "List of what the persona wants to achieve"
      },
      {
        "name": "frustrations",
        "description": "List of pain points and blockers"
      },
      {
        "name": "behaviors",
        "description": "List of observable patterns and habits"
      }
    ],
    "events": [
      {
        "name": "persona-ready",
        "detail": "{ name, role }",
        "description": "Fired after initial render"
      }
    ]
  },
  "user-story": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "user-story",
    "type": "web-component",
    "description": "Agile user story card — 'As a [persona], I want [action] so that [benefit]' with slotted content and state attributes",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "persona-id",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Links to a user-persona element by id"
      },
      {
        "name": "priority",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "critical",
          "high",
          "medium",
          "low"
        ],
        "description": "Story priority level"
      },
      {
        "name": "status",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "backlog",
          "to-do",
          "in-progress",
          "review",
          "done"
        ],
        "description": "Workflow status"
      },
      {
        "name": "points",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Story point estimate"
      },
      {
        "name": "epic",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Parent epic label"
      },
      {
        "name": "story-id",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Ticket or story identifier, auto-sets HTML id"
      },
      {
        "name": "detail",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "full",
          "compact",
          "minimal"
        ],
        "description": "Detail level"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Alias for detail=compact"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON data"
      }
    ],
    "slots": [
      {
        "name": "persona",
        "description": "The 'As a...' role (e.g., <span>)"
      },
      {
        "name": "action",
        "description": "The 'I want...' description (e.g., <span>)"
      },
      {
        "name": "benefit",
        "description": "The 'so that...' outcome (e.g., <span>)"
      },
      {
        "name": "title",
        "description": "Short label for minimal mode (e.g., <h3>)"
      },
      {
        "name": "acceptance-criteria",
        "description": "Acceptance criteria checklist (e.g., <ul>)"
      },
      {
        "name": "tasks",
        "description": "Implementation task list (e.g., <ul>)"
      },
      {
        "name": "notes",
        "description": "Additional context (e.g., <p>)"
      }
    ],
    "events": [
      {
        "name": "story-ready",
        "detail": "{ id, persona, action, benefit, priority, status, points }",
        "description": "Fired after render"
      },
      {
        "name": "status-changed",
        "detail": "{ status, storyId }",
        "description": "Fired when updateStatus() is called"
      },
      {
        "name": "priority-changed",
        "detail": "{ priority, storyId }",
        "description": "Fired when updatePriority() is called"
      }
    ]
  },
  "version-switcher": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "version-switcher",
    "type": "web-component",
    "description": "Surface and switch between versions of a page over time. Inline data source + trigger + picker popover; three actions (navigate / swap / diff). Modes auto-derived from data shape (releases vs history).",
    "attributes": [
      {
        "name": "data-versions",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Inline JSON array of version entries: { id, label?, url?, date?, author?, summary?, archived?, draft?, current?, versionUrl? }. Alternative: a <script type=\"application/json\" data-versions> child."
      },
      {
        "name": "data-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "URL of a JSON manifest to fetch when no inline data is provided. Falls back to <meta name=\"vb:versions-manifest\"> if neither is set."
      },
      {
        "name": "data-mode",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "\"releases\" | \"history\" — override the auto-detected mode"
      },
      {
        "name": "data-action",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "\"navigate\" (default) | \"swap\" | \"diff\""
      },
      {
        "name": "data-versioned-region",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for the swappable / diffable region (default: \"[data-versioned], main\")"
      },
      {
        "name": "data-diff-position",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "\"before\" (default) | \"after\" — where to mount the diff render"
      },
      {
        "name": "data-banner",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Render an archived-version warning banner above the trigger when current is archived AND a non-archived \"latest\" exists."
      },
      {
        "name": "data-page-info-target",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID of a <page-info> to mount inside as a section in its expandable panel; standalone trigger is hidden in this mode."
      },
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Trigger / popover label (default \"Version\")"
      }
    ],
    "events": [
      {
        "name": "version-switcher:open",
        "description": "Picker popover opened"
      },
      {
        "name": "version-switcher:close",
        "description": "Picker popover closed"
      },
      {
        "name": "version-switcher:select",
        "detail": "{ entry }",
        "description": "Fires when an entry is selected (before the action runs)"
      },
      {
        "name": "version-switcher:before-navigate",
        "detail": "{ entry }",
        "description": "Cancellable. Fires before location.href is set; preventDefault() blocks navigation."
      },
      {
        "name": "version-switcher:before-swap",
        "detail": "{ entry }",
        "description": "Cancellable. Fires before swap fetches and replaces the versioned region."
      },
      {
        "name": "version-switcher:swap",
        "detail": "{ entry, previousId }",
        "description": "Fires after swap completes. Versioned region replaced + vb:version meta updated."
      },
      {
        "name": "version-switcher:before-diff",
        "detail": "{ entry }",
        "description": "Cancellable. Fires before diff fetches the other version."
      },
      {
        "name": "version-switcher:diff",
        "detail": "{ entry, previousId, diffElement, opCount }",
        "description": "Fires after diff renders. diffElement is the mounted <change-set>."
      },
      {
        "name": "version-switcher:error",
        "detail": "{ message, entry?, error? }",
        "description": "Parse / fetch / action failure"
      }
    ],
    "properties": [
      {
        "name": "versions",
        "type": "VersionEntry[]",
        "description": "Resolved version entries"
      },
      {
        "name": "currentId",
        "type": "string|null",
        "description": "Id of the current entry"
      },
      {
        "name": "openPicker",
        "type": "() => void"
      },
      {
        "name": "closePicker",
        "type": "() => void"
      },
      {
        "name": "switchTo",
        "type": "(id) => void",
        "description": "Programmatic selection; honors data-action"
      },
      {
        "name": "refresh",
        "type": "() => void",
        "description": "Re-resolve the data source"
      }
    ],
    "childAttributes": [
      {
        "name": "data-versions",
        "on": "script",
        "type": "boolean",
        "description": "Marks a <script type=\"application/json\"> child as the versions JSON source"
      }
    ],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "video-player": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "video-player",
    "type": "web-component",
    "description": "Platform video player web component",
    "attributes": [
      {
        "name": "autoplay",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Start playing on load (subject to browser autoplay policy)"
      },
      {
        "name": "loop",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Loop single track or entire playlist"
      },
      {
        "name": "muted",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Start muted"
      },
      {
        "name": "controls",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-fullscreen",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "state",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "data-video-played",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "captions",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "aria-pressed",
        "kind": "aria",
        "purpose": "config"
      },
      {
        "name": "data-video-active",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-poster",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-captions",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "data-dynamic",
        "kind": "data",
        "purpose": "config"
      },
      {
        "name": "shuffle",
        "kind": "host-api",
        "purpose": "config"
      },
      {
        "name": "aria-valuetext",
        "kind": "aria",
        "purpose": "config"
      }
    ],
    "events": [
      {
        "name": "video-player:play"
      },
      {
        "name": "video-player:pause"
      },
      {
        "name": "video-player:ended"
      },
      {
        "name": "video-player:track-change"
      },
      {
        "name": "video-player:fullscreen"
      },
      {
        "name": "video-player:speed"
      },
      {
        "name": "video-player:captions"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "watch-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "watch-wc",
    "type": "web-component",
    "description": "Drop-in wrapper for the data-watch-page button. Renders an icon, compact, or full-button variant that toggles whether the current page is in the user's VBStore('watches') list. State machine lives in src/utils/page-watch-init.js — this is a one-tag author convenience.",
    "attributes": [
      {
        "name": "variant",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "icon",
          "compact",
          "button"
        ],
        "description": "Visual preset (default: icon)"
      },
      {
        "name": "label",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Override the visible text in compact and button variants. Defaults to 'Watch for updates' / 'Watching'."
      },
      {
        "name": "server-sync",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Per-instance opt-in for server-side sync via VBService('notify'). Sets window.vbPageWatch.serverSync = true before page-watch-init evaluates."
      },
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "config",
        "description": "Reflected by the component to pick the visual variant in CSS"
      }
    ],
    "events": [
      {
        "name": "page-watch:add",
        "detail": {
          "entry": "object"
        },
        "description": "Bubbles from the inner button when the user starts watching"
      },
      {
        "name": "page-watch:remove",
        "detail": {
          "url": "string",
          "subscriptionId": "string|null"
        },
        "description": "Bubbles from the inner button when the user stops watching"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "week-view": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "week-view",
    "type": "web-component",
    "description": "7-day time grid composing day-view-style columns in a semantic table",
    "attributes": [
      {
        "name": "data-start-date",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ISO date for the first day of the week (e.g., 2026-04-06)"
      },
      {
        "name": "data-days",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": 7,
        "description": "Number of day columns (e.g., 5 for workweek)"
      },
      {
        "name": "data-start-hour",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "auto",
        "description": "First visible hour (0-23), or 'auto' to scan events"
      },
      {
        "name": "data-end-hour",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": 19,
        "description": "Last visible hour (0-23). Ignored when data-start-hour is 'auto'."
      }
    ],
    "events": [
      {
        "name": "week-view:event-click",
        "description": "Fired when a calendar-event is clicked",
        "detail": "{ date, time, text, element, category, duration }"
      }
    ],
    "structure": [
      {
        "element": "table",
        "description": "Semantic table: hours (rows) × days (columns)"
      },
      {
        "element": "thead > tr > th",
        "description": "Day column headers with <time> elements"
      },
      {
        "element": "tbody > tr > th",
        "description": "Hour row headers with <time datetime='HH:00'>"
      },
      {
        "element": "tbody > tr > td",
        "description": "Day/hour cell containing hour-view and calendar-event elements"
      },
      {
        "element": "hour-view",
        "description": "Subgrid container for events within a cell"
      },
      {
        "element": "calendar-event",
        "description": "Individual event with time, category, and optional duration"
      }
    ],
    "childAttributes": [
      {
        "name": "data-date",
        "on": "calendar-event",
        "type": "string",
        "description": "ISO date assigning this event to a day column (auto mode)"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "work-item": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "work-item",
    "type": "web-component",
    "description": "General-purpose work unit card — tasks, bugs, chores, spikes, and features with slotted title, status, priority, assignee, and linked stories",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "item-id",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Unique work item identifier, auto-sets HTML id"
      },
      {
        "name": "type",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Item type: task | bug | chore | spike | feature"
      },
      {
        "name": "priority",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Priority: critical | high | medium | low"
      },
      {
        "name": "status",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Status: backlog | to-do | in-progress | review | done | blocked"
      },
      {
        "name": "estimate",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Effort estimate (points, hours, t-shirt size)"
      },
      {
        "name": "assignee",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Assignee name"
      },
      {
        "name": "story-ids",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated linked user-story IDs"
      },
      {
        "name": "detail",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Detail level: full | compact | minimal"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Alias for detail=compact"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON data"
      }
    ],
    "slots": [
      {
        "name": "title",
        "description": "Work item heading (e.g., <h3>)"
      },
      {
        "name": "description",
        "description": "Work item description (e.g., <p>)"
      },
      {
        "name": "checklist",
        "description": "Checklist or subtasks (e.g., <ul>)"
      },
      {
        "name": "notes",
        "description": "Additional notes (e.g., <p>)"
      }
    ],
    "events": [
      {
        "name": "work-item:ready",
        "detail": "{ itemId, title, type, priority, status }",
        "description": "Fired after render"
      },
      {
        "name": "work-item:status",
        "detail": "{ status, itemId }",
        "description": "Fired when status changes"
      },
      {
        "name": "work-item:priority",
        "detail": "{ priority, itemId }",
        "description": "Fired when priority changes"
      }
    ]
  },
  "youtube-player": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "youtube-player",
    "type": "web-component",
    "attributes": [
      {
        "name": "video-id",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "YouTube video ID (required)"
      },
      {
        "name": "title",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Accessible title for iframe + play button"
      },
      {
        "name": "start",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Start playback at N seconds"
      },
      {
        "name": "list",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "YouTube playlist ID"
      },
      {
        "name": "params",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Raw query string appended to embed URL"
      },
      {
        "name": "autoplay",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Auto-initialise iframe on load (no facade)"
      },
      {
        "name": "thumbnail",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Thumbnail resolution: hq | mq | sd | maxres"
      },
      {
        "name": "state",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Component-managed: \"ready\" (facade) or \"active\" (iframe)"
      },
      {
        "name": "role",
        "kind": "native",
        "purpose": "config"
      }
    ],
    "childAttributes": [],
    "structure": [],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  }
};
