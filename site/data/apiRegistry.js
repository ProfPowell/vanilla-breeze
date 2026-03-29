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
  "form-field": {
    "element": "form-field",
    "type": "custom-element",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": []
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
  "progress-ring": {
    "element": "progress-ring",
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
        "type": "string"
      },
      {
        "name": "data-indeterminate",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
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
  "card-list": {
    "element": "card-list",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "template",
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
        "name": "data-items",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-key",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-layout",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "grid",
          "stack",
          "reel"
        ]
      }
    ]
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
  "chart-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "chart-wc",
    "type": "web-component",
    "description": "SVG chart component powered by SVC. Progressive enhancement: semantic table → CSS chart → SVG chart.",
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
        "description": "SVC config overrides as JSON string"
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
        "description": "Get/set SVC config programmatically"
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
  "chat-window": {
    "element": "chat-window",
    "type": "web-component",
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
        "type": "string"
      },
      {
        "name": "model",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "empty-message",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "color-palette": {
    "element": "color-palette",
    "type": "web-component",
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
        "type": "string"
      },
      {
        "name": "names",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "layout",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "inline",
          "grid",
          "list"
        ]
      },
      {
        "name": "show-values",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "show-names",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "sm",
          "md",
          "lg"
        ]
      }
    ]
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
    "element": "command-palette",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-hotkey",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-placeholder",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "data-discover",
        "kind": "data",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "compare-surface": {
    "element": "compare-surface",
    "type": "web-component",
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
        "type": "number"
      }
    ]
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
        "default": "consent-banner",
        "description": "localStorage key for storing consent"
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
  "content-swap": {
    "element": "content-swap",
    "type": "web-component",
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
        "type": "enum",
        "values": [
          "flip",
          "flip-vertical",
          "fade",
          "slide-left",
          "slide-up",
          "scale"
        ]
      },
      {
        "name": "swapped",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "both"
      },
      {
        "name": "card",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean"
      },
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
      }
    ]
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
    "element": "drag-surface",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "group",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "orientation",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "horizontal"
        ]
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean"
      }
    ]
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
    "element": "emoji-picker",
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
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "open",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "description": "Reflected state — set by open()/close()/toggle() methods, not intended as initial markup"
      },
      {
        "name": "recent-limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      }
    ]
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
    "element": "foot-notes",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "ol"
      ]
    },
    "attributes": [
      {
        "name": "data-back-label",
        "kind": "data",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "geo-map": {
    "element": "geo-map",
    "type": "web-component",
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
        "type": "number"
      },
      {
        "name": "lng",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      },
      {
        "name": "zoom",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      }
    ]
  },
  "heading-links": {
    "element": "heading-links",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "levels",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "icon-wc": {
    "element": "icon-wc",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "phrasing": true,
      "permittedContent": []
    },
    "attributes": [
      {
        "name": "name",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "required": true
      },
      {
        "name": "set",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "lucide",
          "custom"
        ]
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "xs",
          "sm",
          "md",
          "lg",
          "xl",
          "2xl"
        ]
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "base-path",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
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
  "page-toc": {
    "element": "page-toc",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "levels",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "scope",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
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
  "print-page": {
    "element": "print-page",
    "type": "web-component",
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
  "qr-code": {
    "element": "qr-code",
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
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      },
      {
        "name": "color",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "background",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "error-correction",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "settings-panel": {
    "element": "settings-panel",
    "type": "web-component",
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
        "description": "Reflected state — set by open()/close()/toggle() methods, not intended as initial markup"
      }
    ]
  },
  "short-cuts": {
    "element": "short-cuts",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": []
    },
    "attributes": []
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
    "element": "slide-accept",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@phrasing"
      ]
    },
    "attributes": [
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "activated-label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "attention",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "shimmer",
          "pulse"
        ]
      },
      {
        "name": "threshold",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      }
    ]
  },
  "social-embed": {
    "element": "social-embed",
    "type": "web-component",
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
        "required": true
      },
      {
        "name": "provider",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "theme",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "light",
          "dark",
          "auto"
        ]
      },
      {
        "name": "activate",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "click",
          "visible",
          "eager"
        ]
      },
      {
        "name": "state",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "idle",
          "loading",
          "loaded",
          "error",
          "unsupported"
        ],
        "direction": "output"
      }
    ]
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
        "description": "localStorage key for position persistence"
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
    "element": "star-rating",
    "type": "web-component",
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
        "type": "string"
      },
      {
        "name": "value",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "direction": "both"
      },
      {
        "name": "max",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "allow-half",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "readonly",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean"
      },
      {
        "name": "icon",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "string"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean"
      }
    ]
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
        "details"
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
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "selectors",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "speed",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      },
      {
        "name": "voice",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "highlight",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "scroll",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      }
    ]
  },
  "theme-picker": {
    "element": "theme-picker",
    "type": "web-component",
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
        "type": "enum",
        "values": [
          "popover",
          "inline"
        ]
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean"
      },
      {
        "name": "open",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "description": "Reflected state — set by open()/close()/toggle() methods, not intended as initial markup (popover variant only)"
      }
    ]
  },
  "toast-msg": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "toast-msg",
    "type": "web-component",
    "description": "Toast notification container with stacking, auto-dismiss, and position options",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": []
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
          "size"
        ],
        "description": "Token type to display"
      },
      {
        "name": "tokens",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated token names (defaults vary by type)"
      },
      {
        "name": "prefix",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS variable prefix (auto-set from type if omitted)"
      },
      {
        "name": "show-values",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "default": "true",
        "description": "Show computed token values"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Optional heading label"
      }
    ]
  },
  "tool-tip": {
    "element": "tool-tip",
    "type": "web-component",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow",
        "template"
      ]
    },
    "attributes": [
      {
        "name": "variant",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "card"
        ]
      },
      {
        "name": "content",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "position",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "top",
          "bottom",
          "left",
          "right"
        ]
      },
      {
        "name": "delay",
        "kind": "host-api",
        "purpose": "config",
        "type": "number"
      }
    ]
  },
  "type-specimen": {
    "element": "type-specimen",
    "type": "web-component",
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
        "type": "string"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "sample",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      },
      {
        "name": "show-scale",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "show-weights",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "show-characters",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean"
      },
      {
        "name": "weights",
        "kind": "host-api",
        "purpose": "config",
        "type": "string"
      }
    ]
  },
  "user-journey": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "user-journey",
    "type": "web-component",
    "description": "Visualises a multi-phase user journey with SVG emotion curve and structured breakdown grid",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": []
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
    "description": "Displays an Agile user story card with persona, action, benefit, priority, status, and slotted sections",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "persona",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "The 'As a...' role"
      },
      {
        "name": "action",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "The 'I want...' description"
      },
      {
        "name": "benefit",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "The 'so that...' outcome"
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
        "description": "Story workflow status"
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
        "description": "Ticket or story identifier"
      },
      {
        "name": "title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Short title for the story, used in minimal detail mode. Falls back to truncated action."
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Reduced spacing variant"
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
        "description": "Controls how much content is shown: full (all sections), compact (hide empty sections), minimal (ID + title only)"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON file containing story data"
      }
    ],
    "slots": [
      {
        "name": "persona",
        "description": "The 'As a...' role (slot fallback for attribute)"
      },
      {
        "name": "action",
        "description": "The 'I want...' description (slot fallback for attribute)"
      },
      {
        "name": "benefit",
        "description": "The 'so that...' outcome (slot fallback for attribute)"
      },
      {
        "name": "acceptance-criteria",
        "description": "Acceptance criteria checklist"
      },
      {
        "name": "tasks",
        "description": "Implementation task list"
      },
      {
        "name": "notes",
        "description": "Additional context"
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
  }
};
