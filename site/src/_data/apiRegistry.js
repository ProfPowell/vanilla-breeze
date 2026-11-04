// @generated from api.json manifests — do not edit by hand
export default {
  "layout-badge": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-badge",
    "type": "custom-element",
    "description": "Small inline status or count badge. Colour reinforces the text, never replaces it. Surface elements use bare data-* attributes.",
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
        "purpose": "config",
        "type": "enum",
        "values": [
          "s",
          "l"
        ],
        "description": "Size: s (11px floor) or l; omit for the default (--font-size-xs)."
      },
      {
        "name": "data-color",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "primary",
          "success",
          "warning",
          "error",
          "info",
          "brand",
          "secondary",
          "accent"
        ],
        "description": "Semantic (primary, success, warning, error, info) or theme (brand, secondary, accent) colour. Colour is never the only signal: the badge text must carry the meaning."
      },
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "subtle",
          "outlined"
        ],
        "description": "subtle (mode-aware tint with --color-*-text ink) or outlined (transparent, border in the text colour) instead of filled."
      },
      {
        "name": "data-shape",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "square"
        ],
        "description": "square corners instead of a pill."
      }
    ]
  },
  "layout-canvas": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-canvas",
    "type": "custom-element",
    "description": "Elevated content surface (a panel with radius, shadow and a 1px edge: a hairline on a plain page, transparent under data-backdrop, CanvasText in forced colours). Attribute form: data-canvas on a semantic element, with the variant as its value (data-canvas=\"flush\" | \"elevated\"). Below 37.5rem every canvas goes flush. Surface elements use bare data-* attributes.",
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
        "purpose": "config",
        "type": "enum",
        "values": [
          "flush",
          "elevated"
        ],
        "description": "Element form only: flush (no radius or shadow) or elevated (larger radius and shadow, 37.5rem and up). The attribute form puts the variant in data-canvas itself."
      },
      {
        "name": "data-max",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide",
          "prose"
        ],
        "description": "Max inline size, centered: narrow / normal / wide (--content-* tokens) or prose (65ch)."
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
        ],
        "default": "l",
        "description": "Padding on all sides."
      },
      {
        "name": "data-canvas-depth",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "1",
          "2"
        ],
        "description": "Stacked-paper effect with 1 or 2 sheets behind the surface."
      }
    ]
  },
  "layout-card": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-card",
    "type": "custom-element",
    "description": "Card surface. A plain padded block by default; a header / section / footer child (or slot=\"header|content|footer\") switches it to structured mode: header pinned on top, footer pinned at the bottom, every other child stacked between in source order. Surface elements use bare data-* attributes.",
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
        "purpose": "config",
        "type": "enum",
        "values": [
          "elevated",
          "outlined",
          "ghost"
        ],
        "description": "Visual style: elevated (shadow), outlined (border), ghost (no surface)."
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
        ],
        "default": "m",
        "description": "Internal padding. Block mode pads the card by the token (none/s/m/l/xl). Structured mode pads the children one step up: header/footer --size-m/--size-l and content --size-l at the default m (s: xs/s and s; l: l/xl and xl; xl: xl/2xl and 2xl); none also drops the header/footer dividers."
      },
      {
        "name": "data-max",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide",
          "prose"
        ],
        "description": "Max inline size, centered (margin-inline: auto in block flow, align-self in flex/grid): --content-narrow / --content-normal / --content-wide, or prose (65ch). Same keyword set as layout-center and canvas."
      }
    ],
    "structure": [
      {
        "element": "header",
        "required": false,
        "description": "Structured mode: pinned to the top, padded, with a bottom divider. A direct h1-h6 inside loses its margin and uses --font-size-l."
      },
      {
        "element": "section",
        "required": false,
        "description": "Structured mode: a content child. Every child that is not the header or footer is content and stacks in source order, one body padding apart."
      },
      {
        "element": "footer",
        "required": false,
        "description": "Structured mode: pinned to the bottom (margin-block-start: auto), top divider, wrapping flex row of actions aligned to the inline end."
      },
      {
        "element": "[slot=\"header\"]",
        "required": false,
        "description": "Any element treated as the header (also triggers structured mode)."
      },
      {
        "element": "[slot=\"content\"]",
        "required": false,
        "description": "Any element treated as content (also triggers structured mode, so a slot-only card works)."
      },
      {
        "element": "[slot=\"footer\"]",
        "required": false,
        "description": "Any element treated as the footer (also triggers structured mode)."
      }
    ]
  },
  "layout-center": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-center",
    "type": "custom-element",
    "description": "Horizontally centered, max-width-constrained container with side gutters. Attribute form: data-layout=\"center\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-max",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide",
          "prose"
        ],
        "default": "normal",
        "description": "Max inline size: narrow (--content-narrow, 40rem), normal (--content-normal, 60rem), wide (--content-wide, 80rem) or prose (65ch)."
      },
      {
        "name": "data-layout-intrinsic",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Center narrower-than-max content intrinsically (flex column, align center)."
      },
      {
        "name": "data-layout-text",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Center the text as well."
      },
      {
        "name": "data-layout-gutter",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "s",
          "l"
        ],
        "default": "m",
        "description": "Inline padding: none, s or l (default m)."
      },
      {
        "name": "data-layout-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "",
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
        ],
        "default": "m",
        "description": "Become a flex column with this gap between children, on the shared size scale. Bare attribute = m."
      }
    ]
  },
  "layout-cluster": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-cluster",
    "type": "custom-element",
    "description": "Horizontal wrapping flex row for groups of short items — tags, buttons, metadata. Attribute form: data-layout=\"cluster\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-gap",
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
        ],
        "default": "s",
        "description": "Gap between items, on the shared size scale."
      },
      {
        "name": "data-layout-justify",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "end",
          "center",
          "between"
        ],
        "default": "start",
        "description": "Main-axis distribution."
      },
      {
        "name": "data-layout-align",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "end",
          "center",
          "stretch",
          "baseline"
        ],
        "default": "center",
        "description": "Cross-axis alignment."
      },
      {
        "name": "data-layout-nowrap",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Keep everything on one line; no wrapping."
      },
      {
        "name": "data-layout-overlap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "",
          "xs",
          "s",
          "m",
          "l"
        ],
        "default": "s",
        "description": "Overlap items (avatar groups) in DOM order, later items on top, each with a surface-coloured ring. Forces gap 0. Bare attribute = s."
      }
    ],
    "childAttributes": [
      {
        "name": "data-container",
        "on": "main, article, section, aside",
        "description": "Opt a semantic child back into container queries. The layout removes container-type from such children so they size to content; this restores it.",
        "type": "boolean"
      }
    ]
  },
  "layout-columns": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-columns",
    "type": "custom-element",
    "description": "Multi-column text flow with a readable measure, vertical rhythm, column rules and break hygiene. Attribute form: data-layout=\"columns\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-align",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "justify"
        ],
        "description": "justify: justified text with automatic hyphenation."
      },
      {
        "name": "data-layout-column-count",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "1",
          "2",
          "3",
          "auto"
        ],
        "default": "1",
        "description": "Number of columns. 2 and 3 are maximums: below about 14rem per column they drop to fewer columns (one on a phone). auto fits as many --column-min-width (38ch) columns as the element's own width allows."
      },
      {
        "name": "data-layout-measure",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide"
        ],
        "default": "normal",
        "description": "Line measure (--measure-narrow / --measure-normal / --measure-wide). Count 1 caps the block width. Counts 2 and 3 cap each column, so the block is at most count × measure + gaps (without the attribute they fill the container). auto uses the measure as the column width."
      },
      {
        "name": "data-layout-max",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide"
        ],
        "default": "normal",
        "description": "Same as data-layout-measure (ch-based, unlike layout-center's rem-based data-layout-max)."
      },
      {
        "name": "data-layout-centered",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "No effect: columns are always centered (margin-inline: auto). Read by the shared typographic core."
      }
    ],
    "childAttributes": [
      {
        "name": "data-bleed",
        "on": "direct child",
        "description": "Break out to the full inline size of the nearest query container (main, article, section). Spans every column in a multi-column flow.",
        "type": "boolean"
      }
    ]
  },
  "layout-cover": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-cover",
    "type": "custom-element",
    "description": "Full-height (min-block-size) container that vertically centers a principal element, with optional top and bottom elements. Attribute form: data-layout=\"cover\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-min",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "s",
          "m",
          "l",
          "xl",
          "auto"
        ],
        "default": "xl",
        "description": "Minimum block size: 50 / 70 / 80vh, xl = 100dvh, auto = none. One-off: set --layout-min in a stylesheet rule (e.g. .hero { --layout-min: 65vh; })."
      },
      {
        "name": "data-layout-padding",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "s",
          "m",
          "l",
          "xl"
        ],
        "default": "m",
        "description": "Padding on all sides."
      },
      {
        "name": "data-layout-gap",
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
        ],
        "default": "none",
        "description": "Minimum space between all children (top, principal, bottom), on the shared size scale. The principal's auto margins still centre it."
      },
      {
        "name": "data-layout-centered",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Center the principal and text horizontally; header/footer (and data-layout-cover-top/-bottom) children still span the full width."
      }
    ],
    "childAttributes": [
      {
        "name": "data-layout-principal",
        "on": "any child",
        "description": "The vertically centered principal element. A sole child auto-centers without it.",
        "type": "boolean"
      },
      {
        "name": "data-layout-cover-top",
        "on": "any child",
        "description": "Pin to the top (a <header> child is pinned automatically).",
        "type": "boolean"
      },
      {
        "name": "data-layout-cover-bottom",
        "on": "any child",
        "description": "Pin to the bottom (a <footer> child is pinned automatically).",
        "type": "boolean"
      },
      {
        "name": "data-container",
        "on": "main, article, section, aside",
        "description": "With data-layout-centered, the layout removes container-type from semantic children so they size to their content instead of collapsing; this opts one back into container queries.",
        "type": "boolean"
      }
    ]
  },
  "layout-grid": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-grid",
    "type": "custom-element",
    "description": "Auto-fit responsive grid: as many columns as fit the minimum width, then wrap. Attribute form: data-layout=\"grid\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-min",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "xs",
          "s",
          "m",
          "l",
          "xl"
        ],
        "default": "m",
        "description": "Minimum column width before wrapping: 8 / 10 / 15 / 20 / 25rem. Tracks are clamped to the container (min(…, 100%)), so a grid narrower than the minimum shows one full-width column instead of overflowing. One-off lengths: style=\"--layout-min: 220px\" (not inherited by nested grids)."
      },
      {
        "name": "data-layout-gap",
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
        ],
        "default": "m",
        "description": "Gap between cells, on the shared size scale."
      },
      {
        "name": "data-layout-subgrid",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "",
          "2",
          "3",
          "4"
        ],
        "default": "3",
        "description": "Each child becomes a subgrid spanning 2, 3 or 4 rows (bare = 3; any other value also spans 3) so header/content/footer line up across siblings. The subgridded rows use the grid's row gap, so data-layout-gap also spaces the parts inside each child — set row-gap on the children to override."
      }
    ]
  },
  "layout-imposter": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-imposter",
    "type": "custom-element",
    "description": "Positioned overlay centred over (or pinned to an edge or corner of) its containing block, logically (mirrored in RTL). The container needs position: relative. Visual positioning only: no focus trap, inert background or dialog semantics; use <dialog> or [popover] for modal UI. Stacking order: --imposter-z (default 1, --z-float when fixed).",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-fixed",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Position relative to the viewport instead of the containing block."
      },
      {
        "name": "data-layout-margin",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "s",
          "m",
          "l",
          "xl"
        ],
        "description": "Inset from the edges when pinned to one (and the contain inset)."
      },
      {
        "name": "data-layout-position",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "center",
          "top",
          "bottom",
          "start",
          "end",
          "top-start",
          "top-end",
          "bottom-start",
          "bottom-end"
        ],
        "default": "center",
        "description": "Where to place the overlay."
      },
      {
        "name": "data-layout-contain",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Never larger than the containing block (the positioned ancestor, or the viewport when fixed) minus the margin on each side; scrolls inside when the content is bigger."
      }
    ]
  },
  "layout-reel": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-reel",
    "type": "custom-element",
    "description": "Horizontal scrolling strip with proximity snap points, an optional scrollbar and edge hints. Attribute form: data-layout=\"reel\". When the items hold no focusable content, add role=\"region\", aria-label and tabindex=\"0\" so keyboard users can scroll it.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-scrollbar",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Show a thin scrollbar. Hidden by default, except under forced colours and on touch-only (hover: none) devices, where it always shows."
      },
      {
        "name": "data-layout-gap",
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
        ],
        "default": "m",
        "description": "Gap between items, on the shared size scale."
      },
      {
        "name": "data-layout-padding",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none",
          "s",
          "m",
          "l"
        ],
        "default": "s",
        "description": "Padding on all sides (block padding leaves room for focus rings and shadows); the same value is the inline scroll padding."
      },
      {
        "name": "data-layout-item-width",
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
        ],
        "default": "auto",
        "description": "Item width: auto (content), s / m / l / xl tokens, or full (100%)."
      },
      {
        "name": "data-layout-align",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "center",
          "end",
          "stretch"
        ],
        "default": "stretch",
        "description": "Cross-axis alignment of items."
      },
      {
        "name": "data-scroll-hint",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "",
          "start"
        ],
        "description": "Fade the edges to hint at overflow, logically (mirrored in RTL). Where scroll-driven animations are supported each edge fades only while there is more content that way; elsewhere both edges fade. start: only the end edge ever fades."
      }
    ],
    "childAttributes": [
      {
        "name": "data-container",
        "on": "main, article, section, aside",
        "description": "Opt a semantic child back into container queries (the reel removes container-type from such children so they size to content).",
        "type": "boolean"
      }
    ]
  },
  "layout-sidebar": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-sidebar",
    "type": "custom-element",
    "description": "Two-column layout: a fixed-basis sidebar beside a flexible content column that wraps below it when there is no room. nav and aside children are the sidebar; every other child is content; without nav/aside the first child is the sidebar. Attribute form: data-layout=\"sidebar\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-gap",
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
        ],
        "default": "m",
        "description": "Gap between the columns, on the shared size scale."
      },
      {
        "name": "data-layout-side",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "end"
        ],
        "description": "end: put the sidebar on the end side. nav/aside children keep DOM order (order: 1); the positional fallback reverses the row."
      },
      {
        "name": "data-layout-sidebar-width",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide"
        ],
        "default": "normal",
        "description": "Sidebar basis: 12 / 16 / 20rem (the same three values in every sidebar context)."
      },
      {
        "name": "data-layout-content-min",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "s",
          "m",
          "l"
        ],
        "default": "m",
        "description": "Content column floor before wrapping: 40 / 50 / 60%. One-off: style=\"--layout-content-min: 45%\"."
      },
      {
        "name": "data-layout-nowrap",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Never wrap; the sidebar stays beside the content."
      }
    ],
    "childAttributes": [
      {
        "name": "data-layout-sticky",
        "on": "nav, aside",
        "description": "Sticky sidebar with its own scroll, active when the page opts into the smart sticky system (:root[data-sticky]).",
        "type": "boolean"
      }
    ]
  },
  "layout-stack": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-stack",
    "type": "custom-element",
    "description": "Vertical flex stack with a consistent gap between children. Attribute form: any semantic element with data-layout=\"stack\". With data-layout-align start/center/end, main/article/section/aside children drop container-type so they size to content instead of collapsing to zero width; add data-container to such a child to keep its container queries.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-gap",
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
        ],
        "default": "m",
        "description": "Gap between children, on the shared size scale."
      },
      {
        "name": "data-layout-align",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "start",
          "center",
          "end",
          "stretch"
        ],
        "default": "stretch",
        "description": "Cross-axis (inline) alignment of children. start/center/end make children content-sized (semantic sectioning children stop being query containers — see data-container)."
      }
    ],
    "childAttributes": [
      {
        "name": "data-container",
        "on": "main, article, section, aside",
        "description": "Opt a semantic child back into container queries when the stack is aligned start/center/end. The layout removes container-type from such children so they size to content; this restores it (give the child an explicit inline size, or it collapses).",
        "type": "boolean"
      }
    ]
  },
  "layout-switcher": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-switcher",
    "type": "custom-element",
    "description": "Flex row that switches to a column once the container is narrower than the threshold. Attribute form: data-layout=\"switcher\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-gap",
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
        ],
        "default": "m",
        "description": "Gap between items, on the shared size scale."
      },
      {
        "name": "data-layout-threshold",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "s",
          "m",
          "l"
        ],
        "default": "m",
        "description": "Container width at which the row becomes a column: 25 / 30 / 40rem. One-off: style=\"--layout-threshold: 35rem\"."
      },
      {
        "name": "data-layout-limit",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "2",
          "3",
          "4"
        ],
        "description": "Force the column layout once there are more than this many items."
      },
      {
        "name": "data-layout-reverse",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Reverse the visual order when stacked (flex-wrap: wrap-reverse): the last item is on top once items wrap onto their own lines; the row keeps DOM order. Visual only — focus and reading order stay in DOM order, so use it only when the stacked order is presentational."
      }
    ]
  },
  "layout-text": {
    "$schema": "../../schemas/api.schema.json",
    "element": "layout-text",
    "type": "custom-element",
    "description": "Long-form reading container: a readable measure plus vertical rhythm between block children. Owns the typographic core shared with layout-columns and data-layout=\"columns\" / \"prose\".",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-layout-measure",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide"
        ],
        "default": "normal",
        "description": "Line measure: --measure-narrow / --measure-normal / --measure-wide (45 / 65 / 80ch by default; data-fluid and the accessibility themes adjust the tokens). Released to 100% in containers narrower than 30rem."
      },
      {
        "name": "data-layout-max",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "narrow",
          "normal",
          "wide"
        ],
        "default": "normal",
        "description": "Same as data-layout-measure (the prose attribute form spells it this way). ch-based — layout-center's data-layout-max=\"narrow\" is 40rem, this one is 45ch."
      },
      {
        "name": "data-layout-centered",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Center the container (margin-inline: auto)."
      }
    ],
    "childAttributes": [
      {
        "name": "data-bleed",
        "on": "direct child",
        "description": "Break out to the full inline size of the nearest query container (main, article, section). Works centered or not; centered text bleeds symmetrically.",
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
    "$schema": "../../../schemas/api.schema.json",
    "element": "calendar-event",
    "type": "custom-element",
    "description": "CSS-only event block for <day-view>, <week-view> and the <calendar-wc> day detail: category colour, inline-start accent bar, half-hour placement. Multi-hour spans are positioned by the parent view's JavaScript.",
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
        "purpose": "visual-variant",
        "type": "string",
        "description": "Sets --event-color. Built in: meeting, deadline, personal, focus; any other value works with your own [data-category] rule."
      },
      {
        "name": "data-start",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "30"
        ],
        "description": "Minute offset within the hour row. \"30\" places a single-hour event in the bottom half; day-view and week-view auto mode set it from the <time> when minutes >= 30."
      },
      {
        "name": "data-duration",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Length of a spanning event as hours and/or minutes, e.g. 2h, 45m, 1h30m, 90m. Read by <day-view>/<week-view> JS, which positions the event absolutely across hour rows. Unparseable values fall back to 1 hour."
      },
      {
        "name": "data-date",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ISO date (YYYY-MM-DD) of the event. Required for <week-view> auto mode, which places the event in that day's column; ignored by <day-view>."
      }
    ],
    "structure": [
      {
        "element": "<time datetime=\"HH:MM\">",
        "required": false,
        "description": "Start time label. The first <time datetime> is what day-view/week-view auto mode use to place the event; without one, day-view auto mode moves the event to its all-day list and week-view auto mode skips it."
      },
      {
        "element": "<time datetime=\"PT…\">",
        "required": false,
        "description": "Optional human-readable duration. Visually hidden, still read by assistive tech. Not used for positioning: use data-duration."
      },
      {
        "element": "<a href> or <button>",
        "required": false,
        "description": "Put interactive content inside when the event is actionable; the block shows a pointer cursor and hover tint only then. The event element itself is not interactive."
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
    "description": "Fixed action button stack. Pins to one of 8 screen positions via the shared data-float system; stacks children vertically with a gap. The first child is the primary action: it sits nearest the anchored edge and is focused first. Default position is bottom-right (inline-end). Dialog and popover children are left to the top layer.",
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
        "description": "Screen position via the shared [data-float] system. Mirrors in RTL (left/right are logical inline-start/end, with the matching physical safe-area inset); *-center stays on the viewport midpoint."
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
    "$schema": "../../schemas/api.schema.json",
    "element": "loading-spinner",
    "type": "custom-element",
    "description": "CSS-only animated loading spinner. Standalone: add role=\"status\" + aria-label. Next to visible text: add aria-hidden=\"true\".",
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
        ],
        "default": "m",
        "description": "Spinner diameter and stroke: xs 0.75em, s 1em, m 1.5em, l 2.5em, xl 4em (em-relative, so it scales with the surrounding text)."
      },
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "primary",
          "success",
          "warning",
          "error"
        ],
        "description": "Arc colour from a theme token (--color-interactive / -success / -warning / -error). Without it the arc uses currentColor."
      },
      {
        "name": "data-overlay",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "position: absolute; inset: 0 over the nearest positioned ancestor, with a translucent surface backdrop and the spinner centered. The container must have a non-static position."
      }
    ],
    "cssProperties": [
      {
        "name": "--spinner-size",
        "description": "Spinner diameter (default 1.5em; data-size presets override)."
      },
      {
        "name": "--spinner-width",
        "description": "Ring stroke width (default 0.2em)."
      },
      {
        "name": "--spinner-color",
        "description": "Arc colour (default currentColor)."
      },
      {
        "name": "--spinner-track",
        "description": "Track colour (default the arc colour at 20% alpha)."
      },
      {
        "name": "--spinner-speed",
        "description": "Duration of one rotation (default 0.7s; 1.5s under reduced motion)."
      }
    ]
  },
  "mobile-menu": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "mobile-menu",
    "type": "custom-element",
    "description": "Breakpoint observer for a header menu. Sets [data-mobile] at or below the breakpoint, which shows the author's trigger and hides sibling nav, nav-bar and site-tools in the parent header. The author supplies the trigger and the native popover panel.",
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
        "default": "52rem",
        "description": "Viewport max-width (CSS length) at or below which mobile mode activates. Observed: changing it re-evaluates. The default 52rem also applies via a CSS media query before upgrade."
      },
      {
        "name": "data-mobile",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "description": "Set by the element while mobile mode is active. Read-only state for styling."
      }
    ],
    "structure": [
      {
        "element": "<button data-trigger popovertarget>",
        "description": "Author-supplied menu toggle; popovertarget names the panel's id. Give it an aria-label."
      },
      {
        "element": "<nav popover class=\"mobile-menu-panel\">",
        "description": "Author-supplied native popover panel, placed inside <mobile-menu> so the link styles apply. Label it (aria-label). Esc closes and focus returns to the trigger; it is not modal (no focus trap or scroll lock)."
      },
      {
        "element": "<button class=\"mobile-menu-close\" popovertargetaction=\"hide\">",
        "description": "Optional author-supplied close button inside the panel."
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
        "description": "Remove inline padding on summaries and panels so content aligns with surrounding text"
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
    ],
    "events": [
      {
        "name": "accordion-wc:toggle",
        "detail": "{ index, open }",
        "description": "Fired when a panel opens or closes"
      },
      {
        "name": "accordion-wc:panels-changed",
        "detail": "{ panels, source: 'property' }",
        "description": "Fired after the panels property rebuilds the accordion"
      }
    ],
    "methods": [
      {
        "name": "open(index)",
        "description": "Open the panel at index (out-of-range indexes are ignored)"
      },
      {
        "name": "close(index)",
        "description": "Close the panel at index"
      },
      {
        "name": "toggle(index)",
        "description": "Toggle the panel at index"
      },
      {
        "name": "openAll()",
        "description": "Open every panel (no-op in single mode)"
      },
      {
        "name": "closeAll()",
        "description": "Close every panel"
      }
    ],
    "properties": [
      {
        "name": "panels",
        "type": "Array<{ id?, summary, content, open? }>",
        "description": "Get the panel set as data, or assign one to rebuild the accordion"
      }
    ]
  },
  "activity-feed": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "activity-feed",
    "type": "web-component",
    "description": "WAI-ARIA Feed timeline of user actions. Author renders <article data-activity> children timestamped with data-time or an authored <time datetime> child; component decorates with relative-time badges, optional date grouping, optional infinite-scroll sentinel (aria-busy + done() handshake), and per-entry avatar / icon left-rail.",
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
        "description": "Adds an IntersectionObserver sentinel; emits activity-feed:load-more when reached and sets aria-setsize=\"-1\" on entries. Remove the attribute to end the feed (sentinel removed, real aria-setsize, aria-busy cleared)."
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
        "description": "Managed: \"feed\" while the feed has entries, \"group\" while empty (so the empty-state text is a valid child). An author-set role other than feed/group is left alone."
      },
      {
        "name": "aria-busy",
        "kind": "aria",
        "purpose": "config",
        "description": "Managed: \"true\" from activity-feed:load-more until detail.done() is called, new entries arrive, or data-infinite is removed.",
        "type": "string"
      }
    ],
    "events": [
      {
        "name": "activity-feed:load-more",
        "description": "Fires when the infinite-scroll sentinel comes into view (at most one outstanding request). detail.done() ends the busy state and re-arms the sentinel; appending entries or removing data-infinite also ends it.",
        "detail": "{ done: () => void }"
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
        "description": "Snapshot array of the current entry elements (a new array on each read, not live)"
      },
      {
        "name": "loading",
        "type": "boolean",
        "description": "Read-only. True while a load-more is outstanding (mirrors aria-busy)"
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
        "required": false,
        "description": "ISO-8601 timestamp; renders as relative time. Alternatively author a direct-child <time datetime> (works without JS and is upgraded in place); data-time wins if both are present"
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
        "description": "Inline-fallback HTTP URL (POST JSON, streamed text/plain or one-shot application/json). Sends prior turns as messages[] (admin/specs/ai-page-tools-v1.md §C, v1.1)."
      },
      {
        "name": "fallback-url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Deep-link URL template. Tokens: {prompt} {url} {title} {content}. {content} is the context region's text, capped at 1500 characters (empty without a context attribute). Provider-neutral."
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
        "description": "Abort any reply, destroy the current session, and clear the log and the conversation history sent to endpoints."
      },
      {
        "name": "stop()",
        "returns": "void",
        "description": "Abort the in-flight reply, if any. Same as the Stop button or Escape."
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
        "description": "Output format. plain-text output is rendered as text (no markdown-viewer)."
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
        "description": "Deep-link URL template. Tokens: {prompt} {url} {title} {content}. {content} is the wrapped text, capped at 1500 characters. Provider-neutral."
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
    "methods": [
      {
        "name": "stop()",
        "returns": "void",
        "description": "Abort the in-flight summary, if any. Same as the Stop button or Escape."
      }
    ]
  },
  "analytics-panel": {
    "$schema": "../../schemas/api.schema.json",
    "element": "analytics-panel",
    "type": "web-component",
    "description": "Visitor-facing view of what analytics is doing on this page: whether it runs, why it is off, and which fields an event carries, with a Pause / Resume control.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "heading",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Analytics on this page",
        "description": "Override the panel heading text"
      },
      {
        "name": "heading-level",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6"
        ],
        "default": "2",
        "description": "Level of the panel heading; the field-list subheading is one level below (max 6)"
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Tighter layout (smaller heading, text and buttons) for embedding alongside other UI"
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "active",
          "debug",
          "paused",
          "off"
        ],
        "direction": "output",
        "public": true,
        "description": "Reflected runtime state: active (sending), debug (console transport), paused (visitor paused this tab), off (any other reason)"
      },
      {
        "name": "data-reason",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "user",
          "gpc",
          "dnt",
          "consent",
          "disabled",
          "iframe",
          "uninitialized"
        ],
        "direction": "output",
        "public": true,
        "description": "Reflected when analytics is not sending: why"
      }
    ],
    "structure": [],
    "childAttributes": [],
    "events": [
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
        "description": "Single track: sets the native audio.loop. Playlist: wrap to the first track after the last; with shuffle, start a new shuffle cycle"
      },
      {
        "name": "shuffle",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Advance to a random track: each track plays once per cycle, never twice in a row. Without loop, playback stops at the end of the cycle"
      },
      {
        "name": "state",
        "kind": "host-api",
        "purpose": "output-state",
        "direction": "output",
        "type": "enum",
        "values": [
          "playing",
          "paused",
          "ended"
        ],
        "description": "Reflected playback state, set by the component"
      },
      {
        "name": "muted",
        "kind": "host-api",
        "purpose": "output-state",
        "direction": "output",
        "type": "boolean",
        "description": "Reflects the inner audio.muted (set by the mute button, the M shortcut or script)"
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "enum",
        "values": [
          "error"
        ],
        "description": "\"error\" when the audio (or every <source>) fails to load; a visible, politely announced message is shown. Cleared when a source loads"
      }
    ],
    "properties": [
      {
        "name": "src",
        "type": "string",
        "description": "Get/set the inner <audio> source. Setting loads it, refreshes the title, moves data-audio-active to a matching track link and fires audio-player:src-changed"
      },
      {
        "name": "currentTime",
        "type": "number",
        "description": "Playback position in seconds (proxies audio.currentTime)"
      }
    ],
    "events": [
      {
        "name": "audio-player:play",
        "detail": "{ currentTime, src }",
        "description": "Playback started"
      },
      {
        "name": "audio-player:pause",
        "detail": "{ currentTime }",
        "description": "Playback paused"
      },
      {
        "name": "audio-player:ended",
        "detail": "{ src }",
        "description": "A track played to the end"
      },
      {
        "name": "audio-player:track-change",
        "detail": "{ src, title }",
        "description": "A playlist track was activated (click or auto-advance)"
      },
      {
        "name": "audio-player:src-changed",
        "detail": "{ src, source: 'property' }",
        "description": "The src property was set"
      }
    ],
    "childAttributes": [
      {
        "name": "controls",
        "on": "audio",
        "type": "boolean",
        "description": "Native controls for the no-JS fallback. Removed while the component is upgraded, restored when it disconnects"
      },
      {
        "name": "data-audio-active",
        "on": "li",
        "type": "boolean",
        "description": "The loaded track. Author sets the initial one; the component moves it and keeps it on a track after it ends"
      },
      {
        "name": "data-audio-played",
        "on": "li",
        "type": "boolean",
        "description": "Set by the component when the track plays to the end"
      },
      {
        "name": "data-audio-favorite",
        "on": "li",
        "type": "boolean",
        "description": "Author-set editorial highlight (heart marker)"
      }
    ],
    "structure": [
      {
        "element": "audio",
        "required": true,
        "description": "The native audio element (light DOM); the component renders custom controls for it"
      },
      {
        "element": "ol.track-list",
        "required": false,
        "description": "Optional playlist (usually inside <details>): one <li> per track with an <a href> to the file"
      }
    ],
    "cssProperties": [
      {
        "name": "--audio-player-accent",
        "description": "Play button, slider thumbs and progress fill colour"
      },
      {
        "name": "--audio-player-bg",
        "description": "Player background and slider thumb border"
      },
      {
        "name": "--audio-player-radius",
        "description": "Player border radius"
      },
      {
        "name": "--audio-player-text",
        "description": "Track title and controls text colour"
      },
      {
        "name": "--audio-player-border",
        "description": "Player border and slider track colour"
      },
      {
        "name": "--audio-player-shadow",
        "description": "Player box shadow (opt-in, default none)"
      },
      {
        "name": "--audio-player-padding",
        "description": "Controls row padding"
      }
    ],
    "parts": [
      {
        "name": "player",
        "description": "Outer player container"
      },
      {
        "name": "controls",
        "description": "Controls row"
      },
      {
        "name": "play-button",
        "description": "Play/pause button"
      },
      {
        "name": "track-info",
        "description": "Track title and time display"
      },
      {
        "name": "timeline",
        "description": "Seek range input"
      },
      {
        "name": "volume",
        "description": "Volume range input"
      },
      {
        "name": "error",
        "description": "Load-error message (hidden unless data-state=\"error\")"
      }
    ]
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
        "description": "AnalyserNode FFT size (power of 2, 32-32768). Default: 256. Other values are rounded to the nearest power of two and clamped to that range"
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "cross-origin",
          "error"
        ],
        "direction": "output",
        "public": true,
        "description": "Set when the visualizer cannot hook the audio: \"cross-origin\" (cross-origin source without crossorigin + CORS — left unhooked so it stays audible) or \"error\" (Web Audio connection failed). Absent while visualizing normally"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "author-index": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "author-index",
    "type": "web-component",
    "description": "Author-grouped view of site content. Fetches a pages.json-shaped source (or enhances authored fallback markup, including when the fetch fails) and adds a diacritic-insensitive filter with a polite live result count.",
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
        "description": "URL to pages.json (or compatible source). On failure, authored light-DOM markup is kept and enhanced; an empty host shows an error"
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Alias for data-lens-src"
      },
      {
        "name": "placeholder",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Filter authors…",
        "description": "Search input placeholder; also the input's accessible name"
      },
      {
        "name": "sort",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "alpha",
          "count"
        ],
        "default": "alpha",
        "description": "Group order: alphabetical by author, or by page count (descending, ties alphabetical). Applies to fetched data only"
      },
      {
        "name": "heading-level",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6"
        ],
        "default": "2",
        "description": "Level of the generated \"Authors (N)\" heading (fetched data only)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-author-group",
        "on": "details",
        "type": "boolean",
        "description": "Marks an authored fallback group as filterable; hidden when its visible text does not contain the query"
      }
    ]
  },
  "brand-mark": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "brand-mark",
    "type": "web-component",
    "description": "Brand/logo display. Authored content is never modified; the src attribute adds one owned <picture data-brand-mark-img> logo with optional dark-mode and compact variants",
    "attributes": [
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Logo image URL (light mode / default). Inserts an owned <picture data-brand-mark-img>; removing it removes only that element"
      },
      {
        "name": "src-dark",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Dark-mode logo URL; follows <html data-mode>, then the resolved color-scheme, then prefers-color-scheme"
      },
      {
        "name": "src-compact",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Compact/icon logo URL, used while compact-media matches (a <source> in the owned <picture>)"
      },
      {
        "name": "compact-media",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Media query for src-compact (default: (width < 48rem), the --bp-m breakpoint)"
      },
      {
        "name": "alt",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Logo text alternative. Image-only: becomes the accessible name and authored content is hidden from AT. Otherwise used only when there is no authored text"
      },
      {
        "name": "wordmark",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Show authored content alongside the src logo (without it, authored content is visually hidden but stays the accessible name)"
      },
      {
        "name": "height",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Logo height: a number (px) or a CSS length; sets --brand-mark-height"
      },
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "s",
          "l",
          "xl"
        ],
        "description": "Size variant"
      },
      {
        "name": "data-stack",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Stack logo, name and tagline vertically"
      },
      {
        "name": "data-brand-mark-img",
        "kind": "data",
        "purpose": "internal-hook",
        "public": false,
        "direction": "output",
        "description": "Marks the <picture> the component owns (inserted from src)"
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
  "bread-crumb": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "bread-crumb",
    "type": "web-component",
    "description": "Hierarchical navigation trail. Wraps existing <ol> markup HTML-first (canonical markup: inside <nav aria-label=\"Breadcrumb\">), or auto-generates from window.location.pathname. Emits BreadcrumbList JSON-LD for SEO.",
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
        "description": "When present, auto-generates the trail from window.location.pathname. Each path segment is URL-decoded and becomes a crumb (Title-Cased by default; override per segment via the .labels property). A leading Home crumb is always added."
      },
      {
        "name": "data-current-label",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Label for the final (current page) crumb when auto-generating. Takes precedence over .labels; if omitted, .labels or the Title-Cased last path segment is used."
      },
      {
        "name": "data-separator",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "string",
        "description": "Separator glyph variant: 'chevron', 'arrow', 'dot', 'pipe'. Unset uses the theme's --sep-breadcrumb token (› by default). Drives the --_separator CSS var; separators are decorative (empty CSS alt text) and not announced."
      },
      {
        "name": "data-collapsed",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Hide middle crumbs, keeping the first crumb, the parent (second-to-last) and the current page. With four or more crumbs the component inserts an ellipsis <button aria-expanded> (accessible name 'Show full path') after the first crumb that reveals the hidden crumbs."
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
        "description": "Apply to a crumb <li> to truncate its link/label with an ellipsis (max-inline-size 10rem). The full text is still read by screen readers."
      }
    ],
    "structure": [
      {
        "element": "<ol>",
        "description": "The trail; one <li> per crumb containing an <a> (ancestors) or <span> (current page). Generated in data-from-pathname mode."
      },
      {
        "element": "<li data-crumb-toggle>",
        "description": "Injected by data-collapsed: wraps the 'Show full path' <button aria-expanded>. Excluded from aria-current and JSON-LD."
      },
      {
        "element": "<script type=\"application/ld+json\">",
        "description": "Appended BreadcrumbList JSON-LD (unless data-jsonld=\"off\"); item URLs are the anchors' resolved hrefs."
      }
    ],
    "events": [
      {
        "name": "bread-crumb:upgraded",
        "description": "Fired after setup completes"
      },
      {
        "name": "bread-crumb:toggle",
        "detail": "{ expanded }",
        "description": "Fired when the data-collapsed toggle button expands or collapses the trail"
      }
    ],
    "properties": [
      {
        "name": "labels",
        "type": "Record<string, string>",
        "description": "Segment → label map for data-from-pathname mode. Keys may be a full pathname ('/docs/elements/'), a pathname without the trailing slash, or a single (decoded or raw) segment; '/' or 'home' relabels the Home crumb. Assigning re-renders the trail."
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
        "description": "Month to display (1-12). Defaults to the current month. Observed; reflected back as the view changes.",
        "direction": "both"
      },
      {
        "name": "data-year",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Year to display. Defaults to the current year. Observed; reflected back as the view changes.",
        "direction": "both"
      },
      {
        "name": "data-events",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "JSON: events keyed by start ISO date. Values may be a string, an object, or an array of events. Each event accepts optional `end` (ISO date, inclusive) or `days` (count) to span multiple days; spans render as continuous bars in data-size=\"large\". Observed: changes re-render and fire calendar-wc:events-changed with source \"attribute\"."
      },
      {
        "name": "data-selection",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "description": "Selection mode: \"none\" (default), \"single\", \"range\", \"multi\"",
        "values": [
          "none",
          "single",
          "range",
          "multi"
        ],
        "default": "none"
      },
      {
        "name": "data-size",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "description": "Size: \"compact\", \"default\", \"large\"",
        "values": [
          "compact",
          "default",
          "large"
        ],
        "default": "default"
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
        "type": "number",
        "description": "Number of adjacent months to display side by side (1-12). Defaults to 1."
      },
      {
        "name": "data-year-range",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "10",
        "description": "Years listed either side of the current year in the year select (0-200). data-min-date / data-max-date bound that side instead, and the displayed year is always listed."
      },
      {
        "name": "data-heading-level",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "description": "Multi-month views: render each month title as <h1>-<h6> at this level. Default: plain text (no heading)."
      },
      {
        "name": "data-label-prev",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Previous month",
        "description": "Accessible name override (default \"Previous month\")."
      },
      {
        "name": "data-label-next",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Next month",
        "description": "Accessible name override (default \"Next month\")."
      },
      {
        "name": "data-label-year",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Year",
        "description": "Accessible name override (default \"Year\")."
      },
      {
        "name": "data-label-close",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Close",
        "description": "Accessible name override (default \"Close\")."
      },
      {
        "name": "data-label-more",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "+{n} more",
        "description": "Large-view overflow text; {n} is replaced with the hidden event count."
      },
      {
        "name": "name",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "Form participation name. Enables ElementInternals form value sync on selection."
      },
      {
        "name": "data-tentative",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "string",
        "description": "Range mode: the ISO start date while the second click is pending. Removed when the range completes."
      }
    ],
    "events": [
      {
        "name": "calendar:select",
        "detail": "{ value, date } (single) | { value, start, end, startDate, endDate } (range) | { values, dates } (multi)",
        "description": "Fired when the selection changes"
      },
      {
        "name": "calendar:navigate",
        "detail": "{ year, month }",
        "description": "Fired on month/year navigation"
      },
      {
        "name": "calendar:day-open",
        "detail": "{ date, events }",
        "description": "Fired when the day-detail dialog opens (display mode)"
      },
      {
        "name": "calendar-wc:events-changed",
        "detail": "{ events, source: 'property' | 'attribute' }",
        "description": "Fired after the event data changes via the events property or the data-events attribute"
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string | null",
        "description": "Read-only selection: ISO date (single), ISO interval start/end (range), space-separated ISO dates (multi), or null"
      },
      {
        "name": "events",
        "type": "{ [isoDate]: Event[] } | Array<Event & { date }>",
        "description": "Get the date-keyed event map, or assign a date-keyed object or flat array (grouped by date) to re-render; fires calendar-wc:events-changed with source 'property'"
      },
      {
        "name": "isDateDisallowed",
        "type": "((date: Date) => boolean) | null",
        "description": "Callback; return true to disable a date. Additive with data-min/max-date and data-disabled-dates"
      },
      {
        "name": "getDayParts",
        "type": "((date: Date) => string | string[] | null) | null",
        "description": "Callback; returned tokens are set as data-day-part on the cell's <td>"
      }
    ],
    "methods": [
      {
        "name": "refresh()",
        "description": "Re-render the current view (e.g. after data read by a callback changes)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-date",
        "on": "button",
        "type": "string",
        "description": "ISO date of an in-month day button (runtime)"
      },
      {
        "name": "data-day",
        "on": "button",
        "type": "number",
        "description": "Day-of-month number on every day button, including outside-month ones (runtime)"
      },
      {
        "name": "data-highlight",
        "on": "button",
        "type": "string",
        "description": "Highlight category from data-highlight-dates (runtime)"
      },
      {
        "name": "aria-current",
        "on": "button",
        "type": "enum",
        "values": [
          "date"
        ],
        "description": "Marks today (runtime)"
      },
      {
        "name": "aria-selected",
        "on": "td",
        "type": "enum",
        "values": [
          "true",
          "false"
        ],
        "description": "Selection state of the gridcell in selection modes (runtime)"
      },
      {
        "name": "data-selected",
        "on": "td",
        "type": "boolean",
        "description": "Selected day (single/multi) — styling hook (runtime)"
      },
      {
        "name": "data-range-start",
        "on": "td",
        "type": "boolean",
        "description": "First day of the range (runtime)"
      },
      {
        "name": "data-range-end",
        "on": "td",
        "type": "boolean",
        "description": "Last day of the range (runtime)"
      },
      {
        "name": "data-in-range",
        "on": "td",
        "type": "boolean",
        "description": "Day inside the range, inclusive (runtime)"
      },
      {
        "name": "data-today",
        "on": "td",
        "type": "boolean",
        "description": "Today's cell (runtime)"
      },
      {
        "name": "data-outside-month",
        "on": "td",
        "type": "boolean",
        "description": "Leading/trailing day from an adjacent month (runtime)"
      },
      {
        "name": "data-events",
        "on": "td",
        "type": "boolean",
        "description": "Cell has at least one event (runtime)"
      },
      {
        "name": "data-event-count",
        "on": "td",
        "type": "number",
        "description": "Number of events covering the day, spans included (runtime)"
      },
      {
        "name": "data-day-part",
        "on": "td",
        "type": "string",
        "description": "Space-separated tokens returned by getDayParts (runtime)"
      },
      {
        "name": "data-week",
        "on": "tr",
        "type": "number",
        "description": "1-based week row index (runtime)"
      },
      {
        "name": "data-row-lanes",
        "on": "tr",
        "type": "number",
        "description": "Large view: number of span-bar lanes in the row (runtime)"
      },
      {
        "name": "data-event-dot",
        "on": "span",
        "type": "boolean",
        "description": "One event dot in compact/default views (runtime)"
      },
      {
        "name": "data-continues-start",
        "on": "span.event-span",
        "type": "boolean",
        "description": "Span bar continues from the previous row (runtime)"
      },
      {
        "name": "data-continues-end",
        "on": "span.event-span",
        "type": "boolean",
        "description": "Span bar continues into the next row (runtime)"
      }
    ],
    "structure": []
  },
  "card-list": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "card-list",
    "type": "web-component",
    "description": "Template-based list rendering with safe data binding: property paths only, sanitized HTML, and URL-checked attribute bindings",
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
        "purpose": "config",
        "type": "string",
        "description": "URL to fetch JSON items from (an array, or an object with items/data). Fetched once on upgrade and on change; a newer src aborts the older request."
      },
      {
        "name": "data-items",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Inline JSON array of items. Takes priority over src."
      },
      {
        "name": "data-key",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "id",
        "description": "Item property used as the unique key for the keyed diff. Missing or duplicated keys fall back to the item index."
      },
      {
        "name": "data-loading",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "boolean",
        "description": "Present while a src fetch is in flight (with aria-busy=\"true\")."
      },
      {
        "name": "data-error",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "string",
        "description": "Error message of the last failed src fetch; cleared when a new fetch starts. Also announced via the role=\"status\" child."
      }
    ],
    "events": [
      {
        "name": "card-list:rendered",
        "detail": "{ count }",
        "description": "Fired after items are rendered or reconciled."
      },
      {
        "name": "card-list:items-changed",
        "detail": "{ items, source: 'attribute' | 'api' }",
        "description": "Fired when the items change. source is 'attribute' for data-items, src and data-key, 'api' for the .items setter."
      },
      {
        "name": "card-list:upgraded",
        "description": "Fired once the component has found its template and upgraded."
      }
    ],
    "childAttributes": [
      {
        "name": "data-field",
        "on": "template descendant",
        "type": "string",
        "description": "Set the element's text content from a property path (e.g. user.name)."
      },
      {
        "name": "data-field-attr",
        "on": "template descendant",
        "type": "string",
        "description": "Comma-separated 'attribute: path' pairs. on* attributes, style and srcdoc are refused; URL attributes (href, src, action, formaction, poster, srcset, ...) only accept http(s), mailto, tel, relative or fragment URLs. null/undefined removes the attribute."
      },
      {
        "name": "data-field-html",
        "on": "template descendant",
        "type": "string",
        "description": "Set innerHTML from a property path, passed through the shared sanitizer."
      },
      {
        "name": "data-field-if",
        "on": "template descendant",
        "type": "string",
        "description": "Element is [hidden] unless the property value is truthy."
      },
      {
        "name": "data-field-unless",
        "on": "template descendant",
        "type": "string",
        "description": "Element is [hidden] when the property value is truthy."
      },
      {
        "name": "data-fallback",
        "on": "direct child",
        "type": "boolean",
        "description": "Static no-JS content; removed on the first successful render."
      }
    ],
    "structure": [
      {
        "element": "template",
        "required": true,
        "description": "Card template cloned per item. A single root element enables the keyed diff."
      }
    ],
    "properties": [
      {
        "name": "items",
        "type": "Array<object>",
        "description": "Get the current items, or assign an array to re-render via the keyed diff (cancels an in-flight src fetch). setItems()/getItems() were removed."
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
        "description": "Auto-advance slides and render a pause/play rotation control (ignored under reduced motion)"
      },
      {
        "name": "autoplay-delay",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Delay between auto-advance in milliseconds (default 5000)"
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
        "description": "Show dot indicators; \"false\" hides them"
      },
      {
        "name": "item-width",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Slide width: \"full\" (default), \"auto\" (content width), or a CSS length such as \"18rem\""
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
    ],
    "events": [
      {
        "name": "carousel-wc:change",
        "detail": "{ index, slide }",
        "description": "Fired once per slide change (scroll settling is debounced)"
      },
      {
        "name": "carousel-wc:play",
        "description": "Fired when the autoplay timer starts or resumes (including after a hover/focus suspension ends)"
      },
      {
        "name": "carousel-wc:pause",
        "description": "Fired when the autoplay timer stops: explicit pause, or a hover/focus/touch suspension"
      },
      {
        "name": "carousel-wc:slides-changed",
        "detail": "{ slides, source: 'property' }",
        "description": "Fired after the slides property rebuilds the carousel"
      }
    ],
    "methods": [
      {
        "name": "next()",
        "description": "Go to the next slide (wraps with loop)"
      },
      {
        "name": "prev()",
        "description": "Go to the previous slide (wraps with loop)"
      },
      {
        "name": "goTo(index, smooth = true)",
        "description": "Jump to a slide; out-of-range indexes are ignored"
      },
      {
        "name": "play()",
        "description": "Start or resume rotation; overrides a hover/focus suspension. No-op under reduced motion"
      },
      {
        "name": "pause()",
        "description": "Stop rotation until play() or the rotation control resumes it"
      },
      {
        "name": "reset()",
        "description": "Return to the start slide and clear persistence"
      }
    ],
    "properties": [
      {
        "name": "currentIndex",
        "type": "number",
        "description": "Current slide index (read-only)"
      },
      {
        "name": "slideCount",
        "type": "number",
        "description": "Number of slides (read-only)"
      },
      {
        "name": "playing",
        "type": "boolean",
        "description": "Whether the autoplay timer is running right now (read-only; false while suspended by hover/focus)"
      },
      {
        "name": "slides",
        "type": "Array<{ id?, html, label? }>",
        "description": "Get the slides as data, or assign records to rebuild the carousel"
      }
    ]
  },
  "change-set": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "change-set",
    "type": "web-component",
    "description": "Interactive change tracking group: a caption from author/datetime plus Tracking / Final / Original toggles over its <ins> / <del> descendants",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "view",
        "kind": "host-api",
        "purpose": "config",
        "direction": "both",
        "type": "enum",
        "values": [
          "final",
          "original"
        ],
        "description": "Which text is visible: final (insertions only), original (deletions only); omitted = tracking (both, with announced markers). Observed; works without JS"
      },
      {
        "name": "datetime",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ISO date of the change set; rendered in the caption and the controls' name"
      },
      {
        "name": "author",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Author of the changes; rendered in the caption and the controls' name"
      },
      {
        "name": "controls",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "none"
        ],
        "description": "\"none\" renders no toggle controls (fixed view)"
      }
    ],
    "events": [
      {
        "name": "change-set:view",
        "detail": "{ view: 'tracking' | 'final' | 'original', source?: 'api' }",
        "description": "View changed via the toggles (no source) or the view property (source: 'api'). Bubbles"
      }
    ],
    "properties": [
      {
        "name": "view",
        "type": "'tracking' | 'final' | 'original'",
        "description": "Get / set the view. Setting the current view is a no-op; unknown values are ignored"
      }
    ],
    "childAttributes": [
      {
        "name": "data-controls",
        "on": "div",
        "type": "boolean",
        "description": "Set by the component on the role=\"group\" toggle container"
      },
      {
        "name": "data-action",
        "on": "button",
        "type": "enum",
        "values": [
          "tracking",
          "final",
          "original"
        ],
        "description": "Set by the component: the view a toggle selects"
      },
      {
        "name": "aria-pressed",
        "on": "button",
        "type": "enum",
        "values": [
          "true",
          "false"
        ],
        "description": "Set by the component: true on the toggle matching the current view"
      },
      {
        "name": "data-change-caption",
        "on": "p",
        "type": "boolean",
        "description": "Set by the component on the author/datetime caption"
      }
    ],
    "structure": [],
    "css": {
      "tokens": [
        "--change-set-ins-start",
        "--change-set-ins-end",
        "--change-set-del-start",
        "--change-set-del-end"
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
        "description": "Chart title text; also the caption of the generated data table"
      },
      {
        "name": "data-subtitle",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Subtitle shown under data-title (requires data-title)"
      },
      {
        "name": "data-label-x",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "X / category axis label; also the category column header of the generated data table"
      },
      {
        "name": "data-label-y",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Y / value axis label"
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
        "description": "How to handle an authored source table: replace (default) visually hides it after the chart mounts but keeps it in the accessibility tree; enhance keeps it visible. Also readable from the table's own data-chart."
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
        "required": false,
        "description": "Optional source table — data is extracted; the table stays the screen-reader (and print) version of the chart. Without one, chart-wc generates a table[data-chart-generated] from the data."
      },
      {
        "element": "<script type='application/json'>",
        "required": false,
        "description": "Optional inline JSON data source"
      },
      {
        "element": "<template data-chart-data>",
        "required": false,
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
        "description": "Fired when no data is found or chart rendering fails (the data table is then left visible)"
      },
      {
        "name": "chart-wc:config-resolved",
        "detail": "{ type, config }",
        "description": "Fired before each render with the merged engine config (mutable, for last-minute tweaks)"
      },
      {
        "name": "chart-wc:data-changed",
        "detail": "{ data, config, source: 'property' }",
        "description": "Fired when .data or .config is assigned"
      },
      {
        "name": "chart-wc:upgraded",
        "description": "Fired once after the component upgrades; safe signal for the first .data assignment"
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
    "description": "Form-associated chat input with auto-growing textarea; submits its form, or fires chat-input:send when standalone",
    "formAssociated": true,
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
        "description": "Form field name; required for the value to appear in FormData (no default)"
      },
      {
        "name": "maxlength",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": 4000,
        "description": "Character limit; over it the element is invalid (tooLong) and sending is blocked"
      },
      {
        "name": "minlength",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": 1,
        "description": "Minimum trimmed length to send"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Disables the textarea and send button (an ancestor fieldset[disabled] does the same)"
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
        "name": "chat-input:send",
        "detail": "{ message }",
        "description": "Enter or send button when not inside a form; message is trimmed and the input clears afterwards"
      },
      {
        "name": "chat-input:input",
        "detail": "{ value, length }",
        "description": "Keystroke, debounced 100ms"
      },
      {
        "name": "chat-input:change",
        "detail": "{ value, source: 'api' }",
        "description": "The value property was set to a new value"
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string",
        "description": "Current textarea content (get/set; setting fires chat-input:change)"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "Reflects the disabled attribute"
      },
      {
        "name": "form",
        "type": "HTMLFormElement | null",
        "description": "The associated form (read-only)"
      },
      {
        "name": "name",
        "type": "string",
        "description": "The name attribute (read-only)"
      },
      {
        "name": "validity",
        "type": "ValidityState",
        "description": "Constraint validation state (read-only)"
      },
      {
        "name": "validationMessage",
        "type": "string",
        "description": "Current validation message (read-only)"
      }
    ],
    "methods": [
      {
        "name": "focus()",
        "description": "Focus the textarea"
      },
      {
        "name": "reset()",
        "description": "Clear the value and resize"
      },
      {
        "name": "checkValidity()",
        "description": "Native constraint validation check"
      },
      {
        "name": "reportValidity()",
        "description": "Check validity and show the browser message on the textarea"
      }
    ],
    "childAttributes": [
      {
        "name": "data-send",
        "on": "button",
        "type": "boolean",
        "description": "Marks the send button; submits the form or fires chat-input:send"
      },
      {
        "name": "data-grow",
        "on": "textarea",
        "type": "boolean",
        "description": "Auto-resize the textarea (VB textarea-grow utility)"
      }
    ],
    "structure": [
      {
        "element": "textarea",
        "description": "The message field; give it an accessible name (aria-label=\"Message\" is added when it has none)"
      },
      {
        "element": "button[data-send]",
        "required": false,
        "description": "Send button"
      }
    ]
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
        "description": "API endpoint; POSTs { message, model } (latest message only) and reads html/message/content from the JSON reply. Omit for custom transport"
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
        "description": "Empty thread placeholder text",
        "default": "Send a message to start."
      }
    ],
    "events": [
      {
        "name": "chat-window:send",
        "detail": "{ message, typingElement }",
        "description": "A message was sent and no endpoint is set; finish with resolveTyping(typingElement, html)"
      },
      {
        "name": "chat-window:error",
        "detail": "{ error, status }",
        "description": "The built-in fetch transport failed"
      },
      {
        "name": "chat-window:model-change",
        "detail": "{ model }",
        "description": "The model selector changed"
      },
      {
        "name": "chat-window:messages-changed",
        "detail": "{ messages, source: 'property' }",
        "description": "The messages setter updated the thread"
      }
    ],
    "childAttributes": [
      {
        "name": "data-participants",
        "on": "script",
        "type": "boolean",
        "description": "JSON participant map: { id: { name, role } }"
      },
      {
        "name": "data-model-select",
        "on": "select",
        "type": "boolean",
        "description": "Model selector inside the header; synced with model"
      },
      {
        "name": "data-role",
        "on": "chat-message",
        "type": "enum",
        "values": [
          "user",
          "agent",
          "system"
        ],
        "description": "Message role; user content is always text"
      },
      {
        "name": "data-from",
        "on": "chat-message",
        "type": "string",
        "description": "Participant id, resolved to data-from-label"
      },
      {
        "name": "data-from-label",
        "on": "chat-message",
        "type": "string",
        "description": "Sender name (written by the runtime from participants)"
      },
      {
        "name": "data-status",
        "on": "chat-message",
        "type": "enum",
        "values": [
          "typing",
          "error"
        ],
        "description": "Typing placeholder or failed reply"
      },
      {
        "name": "data-model",
        "on": "chat-message",
        "type": "string",
        "description": "Model attribution on agent replies"
      },
      {
        "name": "data-chat-typing",
        "on": "span",
        "type": "boolean",
        "description": "Visually hidden typing label inside a typing chat-bubble (runtime)"
      },
      {
        "name": "data-chat-empty",
        "on": "p",
        "type": "boolean",
        "description": "Empty-thread placeholder inside chat-thread (runtime)"
      }
    ],
    "structure": [
      {
        "element": "chat-thread[role=log]",
        "description": "Message list; always rendered"
      },
      {
        "element": "chat-input",
        "required": false,
        "description": "Composer; its chat-input:send drives the send cycle"
      },
      {
        "element": "header",
        "required": false,
        "description": "Title and optional select[data-model-select]"
      }
    ],
    "properties": [
      {
        "name": "messages",
        "type": "Array<{ id, role, content, from? }>",
        "description": "Get the thread as data, or assign to replace the whole thread (keyed diff by id); content is text for role user, sanitized HTML otherwise"
      },
      {
        "name": "model",
        "type": "string",
        "description": "Active model; syncs with select[data-model-select]"
      },
      {
        "name": "participants",
        "type": "Map<string, { name, role }>",
        "description": "Participant registry; setting re-resolves data-from-label"
      }
    ],
    "methods": [
      {
        "name": "appendMessage(role, content, from?)",
        "description": "Append and return a chat-message; user content is text, other roles sanitized HTML"
      },
      {
        "name": "resolveTyping(el, content, { error? })",
        "description": "Finish a typing placeholder: fill its bubble, clear data-status (or set error) and the typing label"
      },
      {
        "name": "clearThread()",
        "description": "Remove all messages"
      },
      {
        "name": "scrollToBottom()",
        "description": "Scroll the thread to the newest message"
      }
    ]
  },
  "color-picker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "color-picker",
    "type": "web-component",
    "description": "Form-associated color picker with saturation/lightness area, hue slider, HEX/RGB/HSL/OKLCH inputs, preset swatches, Copy and EyeDropper",
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
        "description": "Form field name. A name on the inner input (the no-JS path) moves here on upgrade so exactly one value submits."
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Disables the trigger, closes the panel and drops the value from submission. A disabled ancestor fieldset has the same effect."
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
        "description": "Initial input/copy format. The Format selector inside the panel switches it at runtime."
      },
      {
        "name": "open",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Reflected while the panel is open"
      }
    ],
    "structure": [
      {
        "element": "<input type=\"color\">",
        "description": "Supplies the initial value (its value attribute is the form-reset target) and the no-JS fallback. Its <label for> names the trigger."
      },
      {
        "element": "<datalist>",
        "required": false,
        "description": "Preset swatches — one <option value=\"#hex\">Name</option> per swatch"
      }
    ],
    "childAttributes": [
      {
        "name": "name",
        "on": "input",
        "type": "string",
        "description": "Submission name for the no-JS fallback. Moved to the host on upgrade (the host's own name wins if both are set)."
      }
    ],
    "events": [
      {
        "name": "color-picker:change",
        "detail": "{ hex, rgb: { r, g, b }, hsl: { h, s, l }, source: 'pointer' | 'keyboard' | 'api' | 'internal' }",
        "description": "Fired when the color changes. source is 'api' for .value assignments, 'pointer'/'keyboard' for the area and hue slider, 'internal' for text inputs, swatches and the EyeDropper."
      },
      {
        "name": "color-picker:open",
        "description": "Fired when the panel opens"
      },
      {
        "name": "color-picker:close",
        "description": "Fired when the panel closes"
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
        "description": "Form field name. A name on the inner input (the no-JS path) moves here on upgrade so exactly one value submits."
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Require a selection for form validation"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Disables the input and tag remove buttons, closes the listbox and drops the value from submission. A disabled ancestor fieldset has the same effect."
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
        "description": "Text input for filtering and display. Give it an id and point a <label for> at it — the id and labels are preserved and name the combobox."
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
      },
      {
        "name": "name",
        "on": "input",
        "type": "string",
        "description": "Submission name for the no-JS fallback (submits the typed text). Moved to the host on upgrade (the host's own name wins if both are set)."
      }
    ],
    "events": [
      {
        "name": "combo-box:change",
        "detail": "{ value, label, source } | { values[], labels[], source }",
        "description": "Fired when selection changes. source is 'api' for .value assignments, 'internal' for user picks. Re-choosing the current option closes the list without firing."
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
    "description": "Command palette / Cmd+K launcher (modal dialog, combobox + listbox)",
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
        "default": "meta+k",
        "description": "Global keyboard shortcut that toggles the palette (fires even in text fields)"
      },
      {
        "name": "placeholder",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "default": "Type a command...",
        "description": "Search input placeholder text"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Command palette",
        "description": "Accessible name of the dialog"
      },
      {
        "name": "discover",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "",
          "auto"
        ],
        "description": "Present: add commands from [data-command] / [commandfor] elements. \"auto\": also scan nav links and headings"
      }
    ],
    "structure": [
      {
        "element": "<command-group>",
        "description": "Group of commands; rendered as a role=\"group\" named by its label"
      },
      {
        "element": "<command-item>",
        "description": "One command inside a <command-group>; its text is the label, an element with slot=\"icon\" the icon"
      }
    ],
    "childAttributes": [
      {
        "name": "label",
        "on": "command-group",
        "type": "string",
        "description": "Group header text"
      },
      {
        "name": "value",
        "on": "command-item",
        "type": "string",
        "description": "Value passed in command-palette:select detail.value"
      },
      {
        "name": "data-hotkey",
        "on": "command-item",
        "type": "string",
        "description": "Shortcut shown as a badge and bound page-wide while connected; fires command-palette:select without opening the palette (not in text fields)"
      },
      {
        "name": "slot",
        "on": "command-item > *",
        "type": "enum",
        "values": [
          "icon"
        ],
        "description": "slot=\"icon\" marks the item's icon (cloned into the option)"
      }
    ],
    "events": [
      {
        "name": "command-palette:select",
        "detail": "{ value }",
        "description": "Fired when a declared command is chosen from the list or by its data-hotkey"
      },
      {
        "name": "command-palette:open",
        "description": "Fired when the palette opens"
      },
      {
        "name": "command-palette:close",
        "description": "Fired once whenever the dialog closes (close(), selection, Escape, backdrop click)"
      },
      {
        "name": "command-palette:commands-changed",
        "detail": "{ commands, source: 'property' }",
        "description": "Fired after the commands property rebuilds the palette"
      }
    ],
    "methods": [
      {
        "name": "open()",
        "description": "Open the palette and focus the search input"
      },
      {
        "name": "close()",
        "description": "Close the palette"
      }
    ],
    "properties": [
      {
        "name": "commands",
        "type": "Array<{ value, label, hotkey?, group?, icon? }>",
        "description": "Get the declared commands as data, or assign to rebuild the groups"
      },
      {
        "name": "isOpen",
        "type": "boolean",
        "description": "Read-only. Whether the dialog is open"
      }
    ]
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
        "description": "Form field name (submitted with parent form). Stays on the host; the inner textarea is not named, so the value submits once."
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
        "description": "Editor placeholder text (forwarded to the inner <markdown-editor>)"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Comment",
        "description": "Accessible name for the editor textarea. Falls back to an associated <label>'s text, then \"Comment\"."
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
        "description": "Maximum character length for validation; also shows a counter that announces only near or over the limit"
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Requires a non-empty value; a blocked submit reports the validation message"
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Disables the editor and buttons (a disabled ancestor <fieldset> does the same)"
      },
      {
        "name": "aria-busy",
        "kind": "aria",
        "purpose": "output-state",
        "direction": "output",
        "type": "string",
        "description": "\"true\" while a comment-box:submit waitUntil() promise is pending"
      }
    ],
    "events": [
      {
        "name": "comment-box:submit",
        "detail": "{ value, waitUntil(promise) }",
        "description": "Bubbles, cancelable, dispatched synchronously. Do nothing: the value clears. waitUntil(promise): the box is busy until it settles; resolve clears, reject keeps the value. preventDefault() (during the handler, not after an await): the value is kept and nothing else happens. An invalid value does not fire this; it reports the validation message instead."
      },
      {
        "name": "comment-box:cancel",
        "detail": "{ value }",
        "description": "Cancel button clicked"
      },
      {
        "name": "comment-box:input",
        "detail": "{ value, length }",
        "description": "Fires on every keystroke and after clear()"
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string",
        "description": "Get/set the current markdown content"
      },
      {
        "name": "busy",
        "type": "boolean",
        "description": "Read-only. True while a submit waitUntil() promise is pending"
      },
      {
        "name": "form",
        "type": "HTMLFormElement | null",
        "description": "The associated form"
      },
      {
        "name": "name",
        "type": "string | null",
        "description": "The name attribute"
      },
      {
        "name": "validity",
        "type": "ValidityState",
        "description": "Current validity"
      },
      {
        "name": "validationMessage",
        "type": "string",
        "description": "Current validation message"
      }
    ],
    "methods": [
      {
        "name": "clear()",
        "description": "Clear the value and emit comment-box:input"
      },
      {
        "name": "focus()",
        "description": "Focus the editor textarea"
      },
      {
        "name": "checkValidity()",
        "description": "Standard form-associated validity check"
      },
      {
        "name": "reportValidity()",
        "description": "Check validity and show the message"
      }
    ],
    "childAttributes": [
      {
        "name": "slot",
        "on": "*",
        "type": "string",
        "values": [
          "toolbar"
        ],
        "description": "slot=\"toolbar\" children move into the tool group left of the buttons (kept across reconnects)"
      }
    ],
    "structure": []
  },
  "comment-thread": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "comment-thread",
    "type": "web-component",
    "description": "Persistent threaded-discussion container. Author renders <article data-comment> children with metadata; component decorates each with author header, relative timestamp, action row (Reply / Edit / Delete) + threaded indentation. Composes <comment-box> (reply form template) and bubbles <reaction-bar> events naturally. Bodies added through the API are text or sanitized HTML.",
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
        "description": "Set to \"region\" when absent"
      }
    ],
    "events": [
      {
        "name": "comment-thread:reply",
        "detail": "{ parentId, value, waitUntil(promise) }",
        "description": "Reply form submitted. Cancelable, same contract as comment-box:submit: do nothing and the form closes; waitUntil(promise) keeps it busy, closing on resolve and keeping the text on reject; preventDefault() during the handler keeps it open. Focus returns to the comment's Reply button when it closes."
      },
      {
        "name": "comment-thread:edit-request",
        "detail": "{ commentId, value }",
        "description": "Edit clicked; value is the body's text. Author renders an editor and calls updateComment"
      },
      {
        "name": "comment-thread:delete-request",
        "detail": "{ commentId }",
        "description": "Delete clicked; author confirms + calls removeComment"
      }
    ],
    "methods": [
      {
        "name": "addComment(data)",
        "description": "Insert a comment: data { id, author, time, bodyText? | bodyHtml?, parentId?, mine?, authorHref?, authorAvatar?, edited? }. bodyText is set as text; bodyHtml is sanitized. A reply goes after its parent's last descendant. Returns the <article>"
      },
      {
        "name": "updateComment(id, patch)",
        "description": "Patch a comment: patch { bodyText? | bodyHtml?, author?, edited? }"
      },
      {
        "name": "removeComment(id)",
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
        "description": "Optional link to the author's profile. Only http(s) and relative URLs become a link; anything else renders as text"
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
        "description": "ISO-8601 timestamp; rendered relative (Intl.RelativeTimeFormat in the element's lang) with the absolute time in title. Unparseable values render as-is"
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
        "on": "*",
        "type": "boolean",
        "required": true,
        "description": "Marks the comment body (any element, e.g. <section> or <div>)"
      },
      {
        "name": "data-reply-form",
        "on": "template",
        "type": "boolean",
        "description": "Marks the template whose content is cloned for the reply form"
      },
      {
        "name": "aria-labelledby",
        "on": "article",
        "type": "string",
        "description": "Set by the component: names each comment from its author and time"
      }
    ],
    "structure": []
  },
  "comment-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "comment-wc",
    "type": "web-component",
    "description": "EXPERIMENTAL / STUB: inline \"Add comment\" action for selection-menu. Pins to a <review-surface>, which Vanilla Breeze does not ship; without one the button is aria-disabled with a described reason.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [],
    "events": [
      {
        "name": "comment-wc:created",
        "detail": "{ text, x, y }",
        "description": "A pin was added to the resolved review-surface (x / y are percentages of its box)"
      }
    ],
    "childAttributes": [
      {
        "name": "aria-disabled",
        "on": "button",
        "type": "string",
        "description": "Set by the component to \"true\" when no review-surface is found (resolved again on every click)"
      },
      {
        "name": "aria-describedby",
        "on": "button",
        "type": "string",
        "description": "Set by the component while disabled; points at the visually-hidden reason text"
      }
    ],
    "structure": [],
    "css": {
      "tokens": []
    }
  },
  "compare-surface": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "compare-surface",
    "type": "web-component",
    "description": "Before/after comparison slider: two overlaid children with a draggable, keyboard-operable divider (side by side without JS)",
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
        "description": "Divider position 0-100 measured from the inline-start edge (right in RTL), default 50. Observed; user drags and key presses reflect the integer value back."
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name for the slider handle, default \"Comparison slider\". Observed."
      },
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "description": "Used as the slider handle's accessible name when label is absent"
      }
    ],
    "structure": [
      {
        "element": "First child (any element)",
        "description": "Shown on the inline-start side of the divider (the \"before\" view)"
      },
      {
        "element": "Second child (any element)",
        "description": "Shown on the inline-end side of the divider (the \"after\" view). Further children are hidden once upgraded."
      }
    ],
    "events": [
      {
        "name": "compare-surface:change",
        "detail": "{ position: number }",
        "description": "Fired when the user drags or uses the keyboard and the integer position changes. Not fired on upgrade or for attribute/property writes."
      }
    ],
    "properties": [
      {
        "name": "position",
        "type": "number",
        "description": "Get or set the integer position (0-100). Setting clamps, rounds and reflects to the attribute without firing compare-surface:change."
      }
    ],
    "childAttributes": []
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
        "description": "VBStore key under namespace 'consent'. Stored in localStorage as vb:consent:<persist>."
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
        "description": "Days until stored consent expires (banner and getConsent). 0 or 'never' disables expiry."
      }
    ],
    "structure": [
      {
        "element": "<dialog>",
        "description": "Banner container — shown until consent is given. Named from its first heading (aria-labelledby) or aria-label=\"Cookie consent\" unless the author names it."
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
        "description": "Preference category name; becomes a key in the stored and emitted preferences object"
      }
    ],
    "events": [
      {
        "name": "consent-banner:change",
        "detail": "{ preferences: Record<string, boolean>, action: 'accept' | 'reject' | 'save' }",
        "description": "Fired when the user clicks an accept, reject, or save button. preferences maps checkbox names to booleans; action is the button's value."
      }
    ],
    "properties": [],
    "methods": [
      {
        "name": "ConsentBanner.getConsent(key?, options?)",
        "returns": "Promise<{ preferences, action } | null>",
        "description": "Static. Read stored consent for key (default 'banner'). Honours expiry: options.expires (days), else the expires attribute of an in-document banner with the same persist key, else 365. Resolves null when missing, expired, or storage is unavailable."
      },
      {
        "name": "ConsentBanner.reset(key?)",
        "returns": "Promise<void>",
        "description": "Static. Clear stored consent for key (default 'banner') so the banner reappears on the next load."
      }
    ]
  },
  "content-lens": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "content-lens",
    "type": "web-component",
    "description": "Universal switchable host for VB lens components; JS API: activeLens (read-only), setLens(name)",
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
        "description": "Shared JSON source URL forwarded to lens children lacking their own data-lens-src/src (order-independent; already-upgraded children are re-initialised)"
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
        "description": "Fires when the reader or setLens() changes the active lens; not on the initial/restored selection"
      }
    ],
    "childAttributes": [
      {
        "name": "data-lens-name",
        "on": "direct lens child",
        "type": "string",
        "required": true,
        "description": "Registers the child as a switchable lens; value used by data-lens-default, setLens() and the event detail"
      },
      {
        "name": "data-lens-label",
        "on": "direct lens child",
        "type": "string",
        "description": "Chip text (default: humanised data-lens-name)"
      }
    ],
    "slots": [
      {
        "name": "default",
        "description": "Lens components, each with data-lens-name"
      }
    ],
    "properties": [
      {
        "name": "activeLens",
        "type": "string",
        "readonly": true,
        "description": "data-lens-name of the visible lens ('' before upgrade)."
      }
    ],
    "methods": [
      {
        "name": "setLens(name)",
        "returns": "void",
        "description": "Switch to the named lens (ignored if unknown). Persists the choice; fires content-lens:change only when the lens actually changes."
      }
    ]
  },
  "content-swap": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "content-swap",
    "type": "web-component",
    "description": "Two-face content toggle with accessible state management. The hidden face is made inert; with no [data-swap] triggers a real toggle button is generated (visually hidden until focused) and surface clicks swap for pointer users. Also available as the [data-swap] attribute form on any element with [data-face] children.",
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
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "flip",
          "flip-vertical",
          "fade",
          "slide-left",
          "slide-up",
          "scale"
        ],
        "default": "flip",
        "description": "Transition effect between faces. The attribute form uses data-transition."
      },
      {
        "name": "swapped",
        "kind": "host-api",
        "purpose": "semantic-state",
        "direction": "both",
        "type": "boolean",
        "description": "Showing the back face. Reflected by the runtime; may be set or removed by authors at any time and inert follows it. The attribute form uses data-swapped."
      },
      {
        "name": "card",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Apply layout-card visual shell (pair with data-variant: elevated, outlined, ghost)"
      }
    ],
    "events": [
      {
        "name": "content-swap:swap",
        "detail": "{ swapped: boolean, source: 'pointer' | 'keyboard' | 'api' }",
        "description": "Fired after the faces swap; source is what caused it"
      }
    ],
    "methods": [
      {
        "name": "flip()",
        "description": "Show the back face"
      },
      {
        "name": "unflip()",
        "description": "Show the front face"
      },
      {
        "name": "toggle()",
        "description": "Toggle between faces"
      }
    ],
    "properties": [
      {
        "name": "swapped",
        "type": "boolean",
        "description": "Get or set whether the back face is showing"
      },
      {
        "name": "flipped",
        "type": "boolean",
        "description": "Alias for swapped"
      }
    ],
    "childAttributes": [
      {
        "name": "data-face",
        "on": "direct child",
        "type": "enum",
        "values": [
          "front",
          "back"
        ],
        "required": true,
        "description": "Marks the front and back faces"
      },
      {
        "name": "data-swap",
        "on": "button (any descendant)",
        "type": "boolean",
        "description": "Explicit swap trigger. When present, the surface is not clickable and no toggle is generated."
      },
      {
        "name": "data-swap-toggle",
        "on": "button (direct child)",
        "type": "boolean",
        "description": "Toggle used when there are no data-swap triggers; generated with the text \"Show back\" if absent. Author one to set the label. Receives aria-pressed."
      }
    ],
    "structure": []
  },
  "context-menu": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "context-menu",
    "type": "web-component",
    "description": "Right-click (and Shift+F10 / ContextMenu key) menu with keyboard navigation and shortcut bindings",
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
        "description": "Right-click target area. Made focusable (tabindex=\"0\") when it is not already, and given aria-haspopup=\"menu\", aria-expanded and aria-controls"
      },
      {
        "element": "<menu>",
        "description": "Context menu with <li> items holding <button> or <a> actions; <li data-group> labels and <li role=\"separator\"> rows"
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
        "name": "data-group",
        "on": "li",
        "type": "boolean",
        "description": "Group label row. It and the items after it (up to the next label or separator) are wrapped in role=\"group\" named by the label"
      },
      {
        "name": "data-shortcut",
        "on": "button, a",
        "type": "string",
        "description": "Keyboard shortcut bound page-wide (hotkey-bind, preventDefault) and shown as a badge, e.g. 'f2' or 'shift+d'. Never use clipboard combos."
      },
      {
        "name": "data-disabled",
        "on": "button, a",
        "type": "boolean",
        "description": "Disabled item: aria-disabled=\"true\", stays in the arrow-key order, cannot be activated"
      },
      {
        "name": "data-value",
        "on": "button, a",
        "type": "string",
        "description": "Value reported in context-menu:select detail.value and the items property"
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
        "detail": "{ item, value }",
        "description": "Fired when an item is activated by click, keyboard or its shortcut (not for disabled items)"
      },
      {
        "name": "context-menu:items-changed",
        "detail": "{ items, source: 'property' }",
        "description": "Fired after the items property rebuilds the menu"
      }
    ],
    "methods": [
      {
        "name": "close()",
        "description": "Close the menu"
      }
    ],
    "properties": [
      {
        "name": "items",
        "type": "Array<{ label, value?, href?, shortcut?, disabled? } | { group } | { separator: true }>",
        "description": "Get the menu as data, or assign to rebuild it"
      },
      {
        "name": "isOpen",
        "type": "boolean",
        "description": "Read-only. Whether the menu is open"
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
        "name": "data-label-no-results",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "No matching rows found",
        "description": "Text for the visible empty state and the live-region announcement when the filter matches no rows."
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
        "name": "data-filterable",
        "on": "table",
        "type": "boolean",
        "description": "Enable text search filtering (adds a search input above the table)"
      },
      {
        "name": "data-paginate",
        "on": "table",
        "type": "number",
        "description": "Enable pagination with N rows per page"
      },
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
        "description": "Custom sort value overriding cell text. Use for formatted values, e.g. <td data-sort-value=\"1234\">$1,234</td> — data-sort=\"number\" parses the cell with parseFloat, so \"$1,234\" would sort as 0"
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
        "description": "Mark row as expandable (followed by a data-expand-content row). Supply the toggle yourself: <button data-action=\"toggle-expand\"> in a cell; the component manages aria-expanded"
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
        "description": "Mark row as selectable via an author-supplied <input type=\"checkbox\" data-action=\"select-row\">; a thead checkbox with data-action=\"select-all\" toggles all"
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
      },
      {
        "name": "data-table:rows-changed",
        "detail": "{ rows, added, moved, removed, source }",
        "description": "Fired after each .rows assignment with keyed-diff stats (source: 'api')"
      }
    ],
    "properties": [
      {
        "name": "rows",
        "type": "Array<{ id, [columnKey]: value }>",
        "description": "Row records. Seeded from <tr data-id> on upgrade; assigning runs a keyed diff that preserves <tr> nodes whose id persists."
      },
      {
        "name": "columns",
        "type": "Array<{ key, label, sort? }>",
        "readonly": true,
        "description": "Column spec derived from <thead> (th data-key, else lowercased header text)."
      },
      {
        "name": "renderRow",
        "type": "(row, columns) => Element",
        "description": "Optional custom row renderer used for new rows in .rows assignments."
      },
      {
        "name": "currentPage",
        "type": "number",
        "readonly": true,
        "description": "Current page (1-indexed)."
      },
      {
        "name": "totalPages",
        "type": "number",
        "readonly": true,
        "description": "Total pages for the current filter (1 when not paginated)."
      },
      {
        "name": "filteredCount",
        "type": "number",
        "readonly": true,
        "description": "Rows matching the current filter."
      },
      {
        "name": "totalCount",
        "type": "number",
        "readonly": true,
        "description": "Total data rows (expansion content rows excluded)."
      }
    ],
    "methods": [
      {
        "name": "goToPage(page)",
        "returns": "void",
        "description": "Navigate to a page (1-indexed, clamped). No-op without data-paginate."
      },
      {
        "name": "setFilter(query)",
        "returns": "void",
        "description": "Set the filter text programmatically (updates the search input) and announce the result count."
      },
      {
        "name": "refresh()",
        "returns": "void",
        "description": "Re-scan rows after DOM changes and re-apply rollups, heatmaps, filter, sort and pagination."
      },
      {
        "name": "getSelectedRows()",
        "returns": "HTMLTableRowElement[]",
        "description": "Currently selected rows."
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
        "description": "Form field name. A name on the inner input (the no-JS path) moves here on upgrade so exactly one value submits; the host's own name wins if both are set."
      },
      {
        "name": "disabled",
        "kind": "native",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Disables the text input and calendar button, closes the calendar and drops the value from submission. A disabled ancestor fieldset has the same effect. A disabled on the inner input moves here on upgrade."
      },
      {
        "name": "required",
        "kind": "native",
        "purpose": "config",
        "type": "boolean",
        "description": "Makes a date required (valueMissing). Observed at runtime; a required on the inner input works too."
      },
      {
        "name": "data-disabled-dates",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ISO dates to disable (optionally with reason: \"2026-04-05:booked\"). Disabled days stay keyboard-focusable but cannot be selected."
      },
      {
        "name": "data-highlight-dates",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated ISO dates to highlight (optionally with category: \"2026-12-25:holiday\"). Highlighted days remain selectable."
      },
      {
        "name": "data-label-toggle",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Toggle calendar",
        "description": "Accessible name for the calendar icon button (default \"Toggle calendar\")."
      },
      {
        "name": "data-label-dialog",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Choose date",
        "description": "Accessible name for the calendar popup (default \"Choose date\")."
      },
      {
        "name": "data-label-prev",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Previous month",
        "description": "Accessible name for the previous-month button (default \"Previous month\")."
      },
      {
        "name": "data-label-next",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Next month",
        "description": "Accessible name for the next-month button (default \"Next month\")."
      },
      {
        "name": "data-label-year",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Year",
        "description": "Accessible name for the year select (default \"Year\")."
      },
      {
        "name": "data-label-placeholder",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Type a date…",
        "description": "Placeholder for the text input (default \"Type a date…\")."
      },
      {
        "name": "data-label-required",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Please select a date",
        "description": "Validation message when required and empty (default \"Please select a date\")."
      },
      {
        "name": "data-label-range-underflow",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Choose a date on or after {date}",
        "description": "Validation message when the value is before min; {date} is replaced by the formatted min. A data-message-rangeunderflow on the inner input wins."
      },
      {
        "name": "data-label-range-overflow",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Choose a date on or before {date}",
        "description": "Validation message when the value is after max; {date} is replaced by the formatted max. A data-message-rangeoverflow on the inner input wins."
      },
      {
        "name": "data-label-input",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Date",
        "description": "Accessible name for the text input when neither a <label> nor an aria-label/aria-labelledby is present (default \"Date\")."
      },
      {
        "name": "open",
        "kind": "host-api",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Reflected while the calendar is open"
      }
    ],
    "events": [
      {
        "name": "date-picker:change",
        "detail": "{ value, date, source: 'pointer' | 'keyboard' | 'api' }",
        "description": "Fired when the selected date changes (not on form reset/restore). value is the ISO string ('' when cleared), date a Date or null. source is 'api' for .value assignments, 'pointer' for grid clicks, 'keyboard' for grid Enter/Space and typed commits."
      },
      {
        "name": "date-picker:open",
        "description": "Fired when the calendar opens"
      },
      {
        "name": "date-picker:close",
        "description": "Fired when the calendar closes"
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string",
        "description": "Get or set the selected date as an ISO string (YYYY-MM-DD). Assigning '' or null clears; malformed or impossible dates (2026-02-31) are ignored."
      },
      {
        "name": "min",
        "type": "string",
        "description": "Get or set the earliest selectable date (ISO). Updates the calendar and validity immediately; a current value before it is kept and flagged rangeUnderflow."
      },
      {
        "name": "max",
        "type": "string",
        "description": "Get or set the latest selectable date (ISO). Updates the calendar and validity immediately; a current value after it is kept and flagged rangeOverflow."
      },
      {
        "name": "form",
        "type": "HTMLFormElement | null",
        "description": "The associated form"
      },
      {
        "name": "validity",
        "type": "ValidityState",
        "description": "Current validity, owned by the host: valueMissing (required and empty), rangeUnderflow (before min), rangeOverflow (after max). Anchored on the text input."
      },
      {
        "name": "validationMessage",
        "type": "string",
        "description": "Current validation message"
      },
      {
        "name": "willValidate",
        "type": "boolean",
        "description": "Whether the element is a candidate for constraint validation"
      }
    ],
    "methods": [
      {
        "name": "checkValidity()",
        "description": "Run constraint validation without showing UI"
      },
      {
        "name": "reportValidity()",
        "description": "Run constraint validation and show the browser message, anchored on the text input"
      }
    ],
    "childAttributes": [
      {
        "name": "value",
        "on": "input",
        "type": "string",
        "description": "Initial date (ISO). The value attribute is the form-reset target."
      },
      {
        "name": "min",
        "on": "input",
        "type": "string",
        "description": "Earliest selectable date (ISO)"
      },
      {
        "name": "max",
        "on": "input",
        "type": "string",
        "description": "Latest selectable date (ISO)"
      },
      {
        "name": "name",
        "on": "input",
        "type": "string",
        "description": "Submission name for the no-JS fallback. Moved to the host on upgrade."
      }
    ],
    "structure": [
      {
        "element": "<input type=\"date\">",
        "description": "Required. Supplies value/min/max and is the no-JS fallback. Its <label for> (or a <label for> on the host, or an aria-label) names the generated combobox."
      }
    ]
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
        "description": "ISO date for this day view (e.g., 2026-04-10). Names the hour list (aria-label) and is passed as detail.date in day-view:event-click."
      },
      {
        "name": "data-start-hour",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "7",
        "description": "First hour (0-23) of the grid the component generates when there is no authored <ol>, or 'auto' for a sparse range (first event hour - 1 to last event hour + 1). The range grows to fit events outside it. Ignored when you author the <ol>."
      },
      {
        "name": "data-end-hour",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": 19,
        "description": "Last hour (0-23) of the generated grid. Ignored when data-start-hour is 'auto' or the <ol> is authored."
      },
      {
        "name": "data-compact",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Compact presentation for dialog or overlay embedding"
      },
      {
        "name": "data-label-continues",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "continues after the visible hours",
        "description": "Text appended to the accessible name of a spanning event that runs past the last visible hour (localisation hook)."
      }
    ],
    "events": [
      {
        "name": "day-view:event-click",
        "description": "Fired when a calendar-event is clicked, or activated with Enter/Space while focused",
        "detail": "{ date, time, text, element, category, duration }"
      },
      {
        "name": "day-view:events-changed",
        "description": "Fired after the events property rebuilds the view",
        "detail": "{ events, source: 'property' }"
      }
    ],
    "properties": [
      {
        "name": "events",
        "type": "Array<{ time?, text, category?, duration?, href? }>",
        "description": "Get the day's events as data, or assign an array to rebuild the view (sets data-start-hour=\"auto\"). time is HH:MM or a full ISO datetime (wall-clock as written); omit it for an all-day event. Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour."
      }
    ],
    "methods": [
      {
        "name": "refresh()",
        "description": "Re-measure and re-position spanning events now (they also re-position automatically when the view resizes)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-duration",
        "on": "calendar-event",
        "type": "string",
        "description": "Makes the event span hour rows. Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour. Overlapping spans are laid out side by side."
      },
      {
        "name": "data-start",
        "on": "calendar-event",
        "type": "enum",
        "values": [
          "30"
        ],
        "description": "Minute offset within the hour row; set automatically in generated grids for :30+ start times."
      },
      {
        "name": "data-continues",
        "on": "calendar-event",
        "type": "boolean",
        "description": "Set by the component (not authored) on a spanning event clipped at the last visible hour; styled with a dashed end edge."
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
        "description": "URL of a diagram source file (.mmd). Takes priority over inline <pre><code> source; fetched once per URL (not refetched when the element is moved)."
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
        "detail": "{ svg: string, type: string, source: string }",
        "description": "After a successful render (initial, source change or theme re-render)"
      },
      {
        "name": "diagram-wc:error",
        "detail": "{ error: Error, source: string|null, type: string }",
        "description": "Render or src fetch failed. If nothing has rendered yet the <pre> source is shown with an error note; otherwise the prior figure stays visible"
      },
      {
        "name": "diagram-wc:source-changed",
        "detail": "{ source: string }",
        "description": "The .source setter assigned a new value"
      },
      {
        "name": "diagram-wc:upgraded",
        "description": "Fired once after the component upgrades"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "properties": [
      {
        "name": "source",
        "type": "string",
        "description": "Get/set the diagram source. Setting it re-renders (the prior figure stays until the new one is ready, and on a parse error) and fires diagram-wc:source-changed. Kept across disconnect/reconnect."
      },
      {
        "name": "svg",
        "type": "string",
        "readonly": true,
        "description": "Serialized markup of the currently rendered SVG, or an empty string before the first render"
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
    "attributes": [
      {
        "name": "data-variant",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "horizontal",
          "stacked"
        ]
      },
      {
        "name": "data-bordered",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean"
      },
      {
        "name": "data-density",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "compact"
        ]
      },
      {
        "name": "data-striped",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean"
      }
    ]
  },
  "drag-surface": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "drag-surface",
    "type": "web-component",
    "description": "Accessible drag-and-drop reorder surface with keyboard reorder, optional single-pointer move controls, live announcements and cross-surface transfer",
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
        "type": "enum",
        "values": [
          "vertical",
          "horizontal"
        ],
        "default": "vertical",
        "description": "\"horizontal\" switches keyboard reorder to Left/Right and drop maths to the inline axis; both follow the computed direction (RTL-aware)"
      },
      {
        "name": "disabled",
        "kind": "host-api",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Disables dragging out, dropping in, keyboard reorder and move controls; reflected as aria-disabled and skipped as a transfer target"
      },
      {
        "name": "data-move-controls",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Renders per-item Move buttons (up/down or inline start/end, plus Move to <adjacent surface> for grouped surfaces) — the single-pointer alternative to dragging (WCAG 2.5.7)"
      },
      {
        "name": "role",
        "kind": "aria",
        "purpose": "output-state",
        "direction": "output",
        "description": "Managed: always \"list\""
      },
      {
        "name": "aria-disabled",
        "kind": "aria",
        "purpose": "output-state",
        "direction": "output",
        "type": "string",
        "description": "Managed: \"true\" while disabled is present"
      },
      {
        "name": "data-drag-over",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "boolean",
        "description": "Present while a dragged item from an accepted source hovers the surface"
      },
      {
        "name": "data-reorder-mode",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "boolean",
        "description": "Present while one of the surface's items is grabbed for keyboard reorder"
      }
    ],
    "events": [
      {
        "name": "drag-surface:reorder-start",
        "description": "A pointer drag or keyboard grab began"
      },
      {
        "name": "drag-surface:reorder",
        "description": "Items within this surface were reordered (pointer drag, keyboard drop or move control)",
        "detail": "{ item: HTMLElement, itemId: string | undefined, oldIndex: number, newIndex: number, order: (string | undefined)[] }"
      },
      {
        "name": "drag-surface:transfer",
        "description": "An item moved to another surface in the same group; fired on the receiving surface",
        "detail": "{ item: HTMLElement, itemId: string | undefined, fromSurface: DragSurface, toSurface: DragSurface, newIndex: number, fromOrder: (string | undefined)[], toOrder: (string | undefined)[] }"
      },
      {
        "name": "drag-surface:reorder-end",
        "description": "A pointer drag or keyboard grab ended (dropped, cancelled or abandoned); for pointer drags it fires on the source surface"
      }
    ],
    "properties": [
      {
        "name": "sortedOrder",
        "type": "(string | undefined)[]",
        "readonly": true,
        "description": "data-id of each draggable child in DOM order"
      },
      {
        "name": "draggableChildren",
        "type": "HTMLElement[]",
        "readonly": true,
        "description": "Direct children with draggable=\"true\" (a new array on each read)"
      },
      {
        "name": "group",
        "type": "string | null",
        "readonly": true,
        "description": "The group attribute, or null"
      },
      {
        "name": "orientation",
        "type": "'vertical' | 'horizontal'",
        "readonly": true,
        "description": "Normalised orientation attribute"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "description": "Reflects the disabled attribute"
      }
    ],
    "childAttributes": [
      {
        "name": "draggable",
        "on": "direct child",
        "type": "enum",
        "values": [
          "true"
        ],
        "required": true,
        "description": "Native attribute; marks a direct child as a reorderable item (gets role=listitem and tabindex=0, including items added later)"
      },
      {
        "name": "data-id",
        "on": "direct child",
        "type": "string",
        "description": "Stable identifier reported in event details and sortedOrder"
      },
      {
        "name": "data-sort-order",
        "on": "direct child",
        "type": "number",
        "description": "1-based position, rewritten by the component after each move"
      },
      {
        "name": "data-drag-handle",
        "on": "descendant of an item",
        "type": "boolean",
        "description": "Only this element starts a pointer drag; a focusable button handle also accepts reorder keys and gets aria-pressed while grabbed"
      },
      {
        "name": "data-grabbed",
        "on": "direct child",
        "type": "boolean",
        "description": "Output: present while the item is grabbed for keyboard reorder (with aria-description=\"Grabbed\" unless the item has its own)"
      },
      {
        "name": "data-dragging",
        "on": "direct child",
        "type": "boolean",
        "description": "Output: present on the item during a pointer drag"
      },
      {
        "name": "data-drop-target",
        "on": "direct child",
        "type": "enum",
        "values": [
          "before",
          "after"
        ],
        "description": "Output: insertion indicator during a pointer drag (drawn on the block or inline edge, RTL-aware)"
      },
      {
        "name": "data-just-dropped",
        "on": "direct child",
        "type": "boolean",
        "description": "Output: briefly present after a drop or move to trigger the flash animation"
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
  "drop-down": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "drop-down",
    "type": "web-component",
    "description": "Accessible dropdown: an APG menu button for actions, or (with hover) an APG disclosure for navigation links",
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
        "description": "Menu position relative to the trigger. start/end are logical, so they mirror in RTL"
      },
      {
        "name": "hover",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Navigation disclosure: no menu roles, links stay in the Tab order, a <button aria-expanded> toggles the list (generated next to a link trigger). Opens on mouse hover or toggle activation, not on focus"
      },
      {
        "name": "no-flip",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Keep the requested position instead of flipping to the opposite side when the menu overflows the viewport"
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
        "description": "Trigger element that opens the menu. Action mode: aria-haspopup=\"menu\" + aria-expanded. Navigation mode: a link trigger stays a plain link"
      },
      {
        "element": "<button data-dropdown-toggle>",
        "description": "Navigation mode with a link trigger: the submenu toggle (aria-expanded, aria-controls). Generated with aria-label \"<link text> submenu\" when absent; author one to set your own label"
      },
      {
        "element": "<menu>",
        "description": "Menu container with <li> items holding <button> or <a> actions. Only rows whose nearest menu is this one belong to it (nested drop-downs keep their own)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-trigger",
        "on": "button | a",
        "type": "boolean",
        "required": true,
        "description": "Marks the element that opens the menu. Falls back to the first direct <button> if absent."
      },
      {
        "name": "data-disabled",
        "on": "button, a",
        "type": "boolean",
        "description": "Disabled item: aria-disabled=\"true\", stays in the arrow-key order, cannot be activated"
      },
      {
        "name": "data-value",
        "on": "button, a",
        "type": "string",
        "description": "Value reported in drop-down:select detail.value and the items property"
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
        "detail": "{ item, value }",
        "description": "Fired when one of this menu's items is activated by click or keyboard (not for disabled items or a nested drop-down's trigger row)"
      },
      {
        "name": "drop-down:items-changed",
        "detail": "{ items, source: 'property' }",
        "description": "Fired after the items property rebuilds the menu"
      }
    ],
    "methods": [
      {
        "name": "open()",
        "description": "Open the menu"
      },
      {
        "name": "close()",
        "description": "Close the menu"
      },
      {
        "name": "toggle()",
        "description": "Toggle the menu"
      }
    ],
    "properties": [
      {
        "name": "items",
        "type": "Array<{ label, value?, href?, disabled? } | { separator: true }>",
        "description": "Get the menu as data, or assign to rebuild it (href → <a>, otherwise <button type=\"button\">; disabled → data-disabled + aria-disabled)"
      },
      {
        "name": "isOpen",
        "type": "boolean",
        "description": "Read-only. Whether the menu is open"
      }
    ]
  },
  "emoji-picker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "emoji-picker",
    "type": "web-component",
    "description": "Accessible emoji picker with search, a category toolbar, a listbox of emoji, and undoable insertion into a target field",
    "attributes": [
      {
        "name": "for",
        "kind": "native",
        "purpose": "config",
        "type": "string",
        "description": "ID of the input, textarea or contenteditable the emoji is inserted into (at the saved caret, as an undoable edit that fires an insertText input event). Omit to handle emoji-picker:select yourself."
      },
      {
        "name": "recent-limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "24",
        "description": "Maximum number of recently used emoji kept in localStorage (vb-emoji-recent)"
      },
      {
        "name": "data-trigger",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Marks the trigger button (a direct child). Without one the first child <button> is used, else a trigger is created. Hidden until the element is defined (no-JS)."
      },
      {
        "name": "data-label-trigger",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Open emoji picker",
        "description": "Trigger accessible name, applied only when the trigger has no text and no aria-label"
      },
      {
        "name": "data-label-dialog",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Emoji picker",
        "description": "Accessible name of the picker panel"
      },
      {
        "name": "data-label-search",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Search emoji",
        "description": "Accessible name of the search input"
      },
      {
        "name": "data-label-placeholder",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Search emoji…",
        "description": "Search input placeholder"
      },
      {
        "name": "data-label-categories",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Emoji categories",
        "description": "Accessible name of the category toolbar"
      },
      {
        "name": "data-label-emoji",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Emoji",
        "description": "Accessible name of the emoji listbox"
      },
      {
        "name": "data-label-recent",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Recently used",
        "description": "Name of the recently used group"
      },
      {
        "name": "data-label-empty",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "No emoji found",
        "description": "Empty search message (shown and announced)"
      },
      {
        "name": "data-label-results",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{count} emoji found",
        "description": "Result-count announcement; {count} is replaced"
      },
      {
        "name": "data-label-smileys",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Smileys & Emotion",
        "description": "Category name for smileys"
      },
      {
        "name": "data-label-people",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "People & Body",
        "description": "Category name for people"
      },
      {
        "name": "data-label-animals",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Animals & Nature",
        "description": "Category name for animals"
      },
      {
        "name": "data-label-food",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Food & Drink",
        "description": "Category name for food"
      },
      {
        "name": "data-label-travel",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Travel & Places",
        "description": "Category name for travel"
      },
      {
        "name": "data-label-activities",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Activities",
        "description": "Category name for activities"
      },
      {
        "name": "data-label-objects",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Objects",
        "description": "Category name for objects"
      },
      {
        "name": "data-label-symbols",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Symbols",
        "description": "Category name for symbols"
      },
      {
        "name": "data-label-flags",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Flags",
        "description": "Category name for flags"
      },
      {
        "name": "open",
        "kind": "native",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "description": "Reflected state — set by open()/close()/toggle(), not intended as initial markup"
      }
    ],
    "events": [
      {
        "name": "emoji-picker:select",
        "detail": "{ shortcode, emoji, name, keywords }",
        "description": "Fired when an emoji is selected, after it was inserted into the for target"
      },
      {
        "name": "emoji-picker:open",
        "description": "Fired when the picker opens"
      },
      {
        "name": "emoji-picker:close",
        "description": "Fired when the picker closes"
      }
    ],
    "properties": [
      {
        "name": "isOpen",
        "type": "boolean",
        "description": "Read-only. Whether the panel is open"
      },
      {
        "name": "ready",
        "type": "Promise<void>",
        "description": "Read-only. Resolves once the panel is built (emoji data loads asynchronously); data-upgraded is set at the same time"
      }
    ],
    "methods": [
      {
        "name": "open()",
        "description": "Open the panel and focus the search input. Queued until the panel is built"
      },
      {
        "name": "close()",
        "description": "Close the panel (focus is not moved). Before the build it cancels a queued open"
      },
      {
        "name": "toggle()",
        "description": "Open when closed, close when open. Queued until the panel is built"
      }
    ],
    "childAttributes": [],
    "structure": [
      {
        "element": "<button data-trigger>",
        "description": "Optional trigger. An emoji-only trigger needs an aria-label."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "flow-diagram": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "flow-diagram",
    "type": "web-component",
    "description": "User flow and sequence visualization — progressively enhances an ol into a labelled figure holding a nested list drawn as a connected node graph with actions, decisions, and branches",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "data-title",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Diagram heading, rendered as a real heading that labels the figure. Observed."
      },
      {
        "name": "data-heading-level",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "2",
        "description": "Heading level (1-6) for data-title. Observed."
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON flow data: { title?, steps }. Loaded on connect when there is no inline <ol>, and whenever it changes."
      },
      {
        "name": "data-direction",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "vertical",
          "horizontal"
        ],
        "default": "vertical",
        "description": "Layout direction. Horizontal follows the writing direction (arrows point toward inline-end in RTL). CSS only."
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Reduced spacing and node sizes. CSS only (no re-render)."
      },
      {
        "name": "data-label",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Flow diagram",
        "description": "Accessible name of the figure when there is no data-title. Observed."
      },
      {
        "name": "data-label-selected",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Selected: {text}",
        "description": "Live-region announcement on select; {text} is replaced with the node text."
      },
      {
        "name": "data-label-steps-one",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{count} step",
        "description": "Step-count summary for the Intl.PluralRules \"one\" category ({count} is replaced). Any category works: data-label-steps-few, -many, -zero, -two."
      },
      {
        "name": "data-label-steps-other",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{count} steps",
        "description": "Step-count summary for the \"other\" category and the fallback for unset categories."
      },
      {
        "name": "data-label-type-start",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Start",
        "description": "Spoken type prefix for start nodes (\"Start: …\")."
      },
      {
        "name": "data-label-type-action",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Action",
        "description": "Spoken type prefix for action nodes."
      },
      {
        "name": "data-label-type-decision",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Decision",
        "description": "Spoken type prefix for decision nodes."
      },
      {
        "name": "data-label-type-process",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Process",
        "description": "Spoken type prefix for process nodes."
      },
      {
        "name": "data-label-type-wait",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Wait",
        "description": "Spoken type prefix for wait nodes."
      },
      {
        "name": "data-label-type-end",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "End",
        "description": "Spoken type prefix for end nodes."
      }
    ],
    "childAttributes": [
      {
        "name": "data-type",
        "on": "li",
        "type": "enum",
        "values": [
          "start",
          "action",
          "decision",
          "process",
          "wait",
          "end"
        ],
        "description": "Node type (default action). Other values render with action styling and the raw type as the spoken prefix unless data-label-type-<type> is set."
      },
      {
        "name": "data-annotation",
        "on": "li",
        "type": "string",
        "description": "Note shown under the node; also the node button's accessible description"
      },
      {
        "name": "data-branch",
        "on": "li",
        "type": "string",
        "description": "Branch label on a decision's nested <li>, which holds its own <ol> of steps. \"Yes\"/\"No\" get success/error colouring."
      }
    ],
    "properties": [
      {
        "name": "steps",
        "type": "Array<{ type, text, annotation?, branches?: Array<{ label, steps }> }>",
        "description": "Get the parsed flow, or assign one to rebuild. Input is normalized (branches default to [], strings become action steps, malformed entries are dropped) and written into the source <ol>, so it survives re-renders and moves."
      }
    ],
    "events": [
      {
        "name": "flow-diagram:ready",
        "detail": "{ nodeCount }",
        "description": "After every render: initial upgrade, observed attribute change, src load, and .steps assignment"
      },
      {
        "name": "flow-diagram:select",
        "detail": "{ type, text }",
        "description": "Node activated by click, Enter or Space"
      },
      {
        "name": "flow-diagram:steps-changed",
        "detail": "{ steps, source: 'property' }",
        "description": "After .steps assignment (fires after the render's ready)"
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
    "$schema": "../../../schemas/api.schema.json",
    "element": "foot-notes",
    "type": "web-component",
    "description": "Progressive enhancement for footnotes: collects the <foot-note> elements that precede it into a labelled doc-endnotes list (or margin sidenotes), with doc-noteref references, doc-backlink return links, shared notes for repeat citations and a hover/focus preview.",
    "attributes": [
      {
        "name": "data-mode",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "sidenotes"
        ],
        "description": "Omit for a collected notes list; \"sidenotes\" places each note in the margin beside its reference (notes with data-side=\"false\" still go to the list). Observed: changing it re-renders."
      },
      {
        "name": "data-label-back",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Back to content",
        "description": "Accessible name of the backlinks; a note cited several times gets \" (a)\", \" (b)\" … appended. Observed at runtime."
      },
      {
        "name": "data-label-ref",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Footnote {n}",
        "description": "Accessible name of each reference link; {n} is replaced by the note number. Observed at runtime."
      },
      {
        "name": "data-label-heading",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Notes",
        "description": "Text of the generated, visually hidden heading that labels the doc-endnotes section. Ignored when the author supplies a heading child (h1–h6), which is used as the label instead. Observed at runtime."
      },
      {
        "name": "data-preview",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "false"
        ],
        "description": "\"false\" disables the hover / keyboard-focus preview popover on references. Observed at runtime."
      }
    ],
    "childAttributes": [
      {
        "name": "data-side",
        "on": "foot-note",
        "type": "string",
        "description": "\"false\" opts a note out of sidenote placement in data-mode=\"sidenotes\"; it is collected into the list instead."
      },
      {
        "name": "data-ref",
        "on": "foot-note",
        "type": "string",
        "description": "Id of an earlier or later <foot-note> collected by the same <foot-notes>: this element becomes another citation of that note (no content of its own) and the note gets one backlink per citation (a, b, …)."
      }
    ],
    "structure": [
      {
        "element": "<foot-note>",
        "description": "Inline note anywhere BEFORE the <foot-notes> in document order (not necessarily a child). Phrasing content; without JS it renders in parentheses. Enhanced: its content nodes are moved (not copied) into the note, and it holds a superscript <a role=\"doc-noteref\"> (id fnref-I-N, fnref-I-N-b for repeat citations)."
      },
      {
        "element": "<h1>–<h6> (optional)",
        "description": "A heading child of <foot-notes> labels the generated <section role=\"doc-endnotes\">; otherwise a visually hidden <h2> with data-label-heading is generated."
      }
    ],
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
    "description": "Accessible form field: binds its control (native or form-associated custom element), times validation, shows hint/error outputs and wires aria-describedby / aria-invalid",
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
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Valid state. Set by the component when a valid field has a value (not for empty optional fields); can be set by hand."
      },
      {
        "name": "data-invalid",
        "kind": "data",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Invalid state: reveals output.error and the error icon. Set by validate()/setError(); survives moving the field."
      },
      {
        "name": "data-type",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "string",
        "description": "Inline label + control layout for checkable controls. No validation icon.",
        "enum": [
          "checkbox",
          "radio"
        ]
      },
      {
        "name": "data-no-icon",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Disable the validation status icons."
      },
      {
        "name": "data-floating-label",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Animated floating label (floating-label-init). A real placeholder keeps the label floated. Adds data-floating-label-ready when enhanced."
      },
      {
        "name": "data-pending",
        "kind": "data",
        "purpose": "semantic-state",
        "type": "boolean",
        "description": "Dims the field and blocks pointer input while something is in flight."
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "semantic-state",
        "type": "string",
        "description": "Async validation hook: warning border and spinner in the icon slot.",
        "enum": [
          "validating"
        ]
      },
      {
        "name": "data-message-invalid",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Last-resort error message when no data-message-*, authored error text or control message applies.",
        "default": "Please check this field."
      },
      {
        "name": "data-label-show-password",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name of the password toggle while the password is hidden.",
        "default": "Show password"
      },
      {
        "name": "data-label-hide-password",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name of the password toggle while the password is shown.",
        "default": "Hide password"
      },
      {
        "name": "data-label-digit",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "OTP/PIN box name; {n} and {total} are replaced.",
        "default": "Digit {n} of {total}"
      },
      {
        "name": "data-label-incomplete",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "OTP/PIN partial-code message (used when the input has no data-message-patternmismatch); {total} is replaced.",
        "default": "Enter all {total} digits"
      },
      {
        "name": "data-label-strength",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name of the password strength meter.",
        "default": "Password strength"
      },
      {
        "name": "data-label-strength-weak",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Strength level text.",
        "default": "Weak"
      },
      {
        "name": "data-label-strength-fair",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Strength level text.",
        "default": "Fair"
      },
      {
        "name": "data-label-strength-good",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Strength level text.",
        "default": "Good"
      },
      {
        "name": "data-label-strength-strong",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Strength level text.",
        "default": "Strong"
      },
      {
        "name": "data-label-requirements",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name of the password rules checklist.",
        "default": "Password requirements"
      },
      {
        "name": "data-label-rule-length",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Length rule text; {n} is replaced.",
        "default": "At least {n} characters"
      },
      {
        "name": "data-label-rule-uppercase",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Uppercase rule text.",
        "default": "One uppercase letter"
      },
      {
        "name": "data-label-rule-lowercase",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Lowercase rule text.",
        "default": "One lowercase letter"
      },
      {
        "name": "data-label-rule-number",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Number rule text.",
        "default": "One number"
      },
      {
        "name": "data-label-rule-special",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Special-character rule text.",
        "default": "One special character"
      },
      {
        "name": "data-floating-label-ready",
        "kind": "data",
        "purpose": "internal-hook",
        "type": "boolean",
        "description": "Set by floating-label-init once the floating label is wired. Do not set by hand."
      },
      {
        "name": "data-otp-ready",
        "kind": "data",
        "purpose": "internal-hook",
        "type": "boolean",
        "description": "Set once the OTP/PIN boxes are built (hides the status icon). Do not set by hand."
      }
    ],
    "childAttributes": [
      {
        "name": "data-message-valuemissing",
        "on": "input",
        "type": "string",
        "description": "Message for valueMissing. Every ValidityState key has one: data-message-badinput, -typemismatch, -patternmismatch, -tooshort, -toolong, -rangeunderflow, -rangeoverflow, -stepmismatch, -customerror. On a custom element (or the field) for custom controls."
      },
      {
        "name": "data-message-badinput",
        "on": "input",
        "type": "string",
        "description": "Message when the browser can't parse the entry (e.g. letters in type=number)."
      },
      {
        "name": "data-message-customerror",
        "on": "input",
        "type": "string",
        "description": "Message for a custom validity error; without it the custom message itself is shown."
      },
      {
        "name": "data-type",
        "on": "input",
        "type": "string",
        "enum": [
          "otp",
          "pin"
        ],
        "description": "Multi-box OTP/PIN entry. The input stays a visually hidden, validatable text input (required + a \\d{length} pattern)."
      },
      {
        "name": "data-length",
        "on": "input",
        "type": "number",
        "default": "6",
        "description": "Number of OTP/PIN digits."
      },
      {
        "name": "data-strength",
        "on": "input",
        "type": "boolean",
        "description": "Password strength meter + rules checklist."
      },
      {
        "name": "data-rules",
        "on": "input",
        "type": "string",
        "default": "length:8",
        "description": "Comma-separated strength rules: length:N, uppercase, lowercase, number, special."
      },
      {
        "name": "data-count",
        "on": "textarea",
        "type": "string",
        "description": "Character (\"\") or word (\"words\") counter, added to aria-describedby; announced only near the limit."
      },
      {
        "name": "class",
        "on": "output",
        "type": "string",
        "enum": [
          "hint",
          "error"
        ],
        "description": "hint: help text, collapses when valid; error: hidden (visibility: hidden) until invalid, authored text is the fallback message."
      }
    ],
    "structure": [
      {
        "element": "<label>",
        "description": "Field label (for= the control id). The required asterisk goes on it when it is the field's only label."
      },
      {
        "element": "<input> | <textarea> | <select> | form-associated custom element",
        "description": "The bound control. Radios bind their whole name group."
      },
      {
        "element": "<output class=\"hint\">",
        "required": false,
        "description": "Help text; listed in aria-describedby."
      },
      {
        "element": "<output class=\"error\">",
        "required": false,
        "description": "Error message; in aria-describedby only while invalid."
      }
    ],
    "events": [
      {
        "name": "form-field:upgraded",
        "description": "Bubbles once the field has bound its control."
      }
    ],
    "properties": [
      {
        "name": "fieldName",
        "type": "string",
        "description": "Human-readable field name (label or legend text, else aria-label, name or id) for error summaries. Read-only."
      },
      {
        "name": "input",
        "type": "HTMLElement | null",
        "description": "The bound control: the first form-associated custom element in the field (date-picker, star-rating, combo-box …), else the first native input/textarea/select. Read-only."
      }
    ],
    "methods": [
      {
        "name": "validate({ show = true } = {})",
        "description": "Validate the bound control and show the result immediately (error text, data-invalid/data-valid, aria-invalid, aria-describedby) — no blur needed; the form coordinator calls it on submit. Returns the validity. { show: false } returns validity without touching the UI."
      },
      {
        "name": "setError(message)",
        "description": "Show a programmatic (e.g. server) error. Also set as the native control's custom validity so the form won't submit; cleared on the user's next edit. Never clears a custom error set by other code."
      },
      {
        "name": "clearError()",
        "description": "Clear the field's own programmatic error and return to the neutral state."
      }
    ]
  },
  "geo-map": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "geo-map",
    "type": "web-component",
    "description": "A zero-dependency map component using OpenStreetMap / CARTO raster tiles or your own tile proxy, with a lazy-loaded interactive pan / zoom mode.",
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
        "description": "Latitude of the map centre. With lng, highest-priority coordinate source."
      },
      {
        "name": "lng",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "description": "Longitude of the map centre."
      },
      {
        "name": "zoom",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "15",
        "description": "Tile zoom level 1–19; out-of-range values fall back to 15."
      },
      {
        "name": "marker",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "",
          "true",
          "false"
        ],
        "default": "true",
        "description": "Show the pin at the centre (bare or \"true\"); \"false\" hides it."
      },
      {
        "name": "marker-color",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "string",
        "description": "Pin fill, any CSS colour. Invalid values are ignored (the pin falls back to --geo-map-marker-color, then --color-error)."
      },
      {
        "name": "provider",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "osm",
          "carto-light",
          "carto-dark",
          "carto-auto"
        ],
        "default": "osm",
        "description": "Built-in tile source. carto-auto picks carto-dark or carto-light from the nearest data-mode (else prefers-color-scheme) and follows changes. Each provider shows its required credit."
      },
      {
        "name": "tile-url",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Tile URL template overriding provider: {z} {x} {y}, {s} (a/b/c subdomain rotation) and {r} (\"@2x\" on high-density screens). Set attribution for the credit. See /docs/concepts/service-facade/."
      },
      {
        "name": "attribution",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Credit text shown for a tile-url source (built-in providers always show their own). A child with slot=\"attribution\" replaces it."
      },
      {
        "name": "attribution-href",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Link for the attribution credit (http/https only)."
      },
      {
        "name": "interactive",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "click",
          "eager",
          "none"
        ],
        "default": "click",
        "description": "click: the map surface is an activation button; eager: interactive on load (without moving focus); none: static view only."
      },
      {
        "name": "static-only",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Never activate (same as interactive=\"none\")."
      },
      {
        "name": "loading",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "lazy",
          "eager",
          "consent"
        ],
        "default": "lazy",
        "description": "Tile loading. consent: request nothing from the tile host until the user presses \"Load map\" (shows a placeholder naming the host; the slotted address stays visible)."
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name of the map. Default: \"Map of …\" from the slotted <address> text, the src address / JSON-LD name, or place; else \"Map\"."
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ID of an <address data-lat data-lng> or a <script type=\"application/ld+json\"> with geo.latitude / geo.longitude to read coordinates (and the name) from."
      },
      {
        "name": "place",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Name matched against JSON-LD scripts on the page (data.name); the match's geo supplies coordinates."
      },
      {
        "name": "data-ready",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "boolean",
        "description": "Set when the static tiles have finished loading (with geo-map:ready); removed on each re-render."
      },
      {
        "name": "data-label-map",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Map",
        "description": "Accessible name when nothing names the place."
      },
      {
        "name": "data-label-map-of",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Map of {name}",
        "description": "Accessible name template; {name} is the address text, src name or place."
      },
      {
        "name": "data-label-activate",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Activate interactive map",
        "description": "Visible text (and name) of the activation button."
      },
      {
        "name": "data-label-consent",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Load map",
        "description": "Consent button text (loading=\"consent\")."
      },
      {
        "name": "data-label-consent-note",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Loads map images from {host}",
        "description": "Consent note; {host} is the tile host."
      },
      {
        "name": "data-label-zoom-in",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Zoom in",
        "description": "Zoom-in button name."
      },
      {
        "name": "data-label-zoom-out",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Zoom out",
        "description": "Zoom-out button name."
      },
      {
        "name": "data-label-recenter",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Recenter map",
        "description": "Recenter button name."
      },
      {
        "name": "data-label-exit",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Exit map",
        "description": "Exit button name (returns to the static view)."
      },
      {
        "name": "data-label-controls",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Map controls",
        "description": "Name of the control button group."
      },
      {
        "name": "data-label-instructions",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Key / gesture instructions referenced by aria-describedby in interactive mode."
      },
      {
        "name": "data-label-moved",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Map centred on {lat}, {lng}, zoom {zoom}",
        "description": "Polite live-region announcement after pan / zoom."
      },
      {
        "name": "data-label-error-coords",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Map location unavailable",
        "description": "On-screen text when no coordinates resolve."
      },
      {
        "name": "data-label-error-tiles",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Map images failed to load",
        "description": "On-screen text when every tile fails."
      }
    ],
    "properties": [
      {
        "name": "data",
        "type": "{ lat?: number, lng?: number, zoom: number, marker: boolean, markerColor: string }",
        "description": "Get the map state, or assign a partial object: attributes are written as one batch and the map re-renders once. Assigning the current state is a no-op; an invalid markerColor is ignored, '' clears it. Emits geo-map:data-changed."
      },
      {
        "name": "markers",
        "type": "Array<{ lat: number, lng: number, color: string }>",
        "readonly": true,
        "description": "The centre marker as a one-element array when coordinates resolve, else []."
      },
      {
        "name": "active",
        "type": "boolean",
        "readonly": true,
        "description": "True while interactive mode is on (also the :state(active) custom state)."
      }
    ],
    "events": [
      {
        "name": "geo-map:ready",
        "detail": "{ lat, lng, zoom }",
        "description": "Static tiles finished loading (data-ready is set)."
      },
      {
        "name": "geo-map:activate",
        "detail": "{ lat, lng, zoom }",
        "description": "Interactive mode started."
      },
      {
        "name": "geo-map:move",
        "detail": "{ lat, lng, zoom }",
        "description": "After a pan or zoom in interactive mode (new centre, 6 decimal places)."
      },
      {
        "name": "geo-map:data-changed",
        "detail": "{ data, source: 'property' }",
        "description": "After a .data assignment that changed something."
      },
      {
        "name": "geo-map:error",
        "detail": "{ message }",
        "description": "No coordinates resolved, or every tile failed to load."
      }
    ],
    "childAttributes": [
      {
        "name": "data-lat",
        "on": "address",
        "type": "number",
        "description": "Latitude on a slotted (or src-referenced) <address>."
      },
      {
        "name": "data-lng",
        "on": "address",
        "type": "number",
        "description": "Longitude on a slotted (or src-referenced) <address>."
      },
      {
        "name": "slot",
        "on": "*",
        "type": "enum",
        "values": [
          "attribution"
        ],
        "description": "slot=\"attribution\" replaces the credit line."
      }
    ],
    "structure": []
  },
  "glossary-index": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "glossary-index",
    "type": "web-component",
    "description": "Interactive glossary with search filtering, scroll-spy letter tracking and copyable term permalinks",
    "attributes": [
      {
        "name": "placeholder",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Filter terms…",
        "description": "Placeholder text for the injected search input (a hint, not its label — see data-label-filter)"
      },
      {
        "name": "data-label-filter",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Filter glossary terms",
        "description": "Accessible name of the search input"
      },
      {
        "name": "data-label-matches-one",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{count} term matches",
        "description": "Polite match-count announcement for the Intl.PluralRules \"one\" category ({count} is replaced). Any category works: -few, -many, -zero, -two."
      },
      {
        "name": "data-label-matches-other",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{count} terms match",
        "description": "Match-count announcement for the \"other\" category and the fallback for unset categories"
      },
      {
        "name": "data-label-all-one",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Showing {count} term",
        "description": "Announcement when the filter is cleared (\"one\" category)"
      },
      {
        "name": "data-label-all-other",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Showing all {count} terms",
        "description": "Announcement when the filter is cleared (\"other\" category and fallback)"
      },
      {
        "name": "data-label-empty",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "No terms match your filter.",
        "description": "Visible empty-state message when nothing matches"
      },
      {
        "name": "data-label-permalink",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Copy link to",
        "description": "Permalink name prefix; the term text is appended"
      },
      {
        "name": "data-label-copied",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Link copied to clipboard",
        "description": "Screen-reader announcement after a permalink copies the term URL"
      }
    ],
    "childAttributes": [
      {
        "name": "id",
        "on": "dt",
        "type": "string",
        "description": "Term anchor. Each dt with an id gets a permalink that follows the fragment and copies the term URL."
      }
    ],
    "structure": [
      {
        "element": "nav.glossary-jump",
        "required": false,
        "description": "Letter jump navigation; its fragment links get aria-current=\"true\" for the section in view and aria-disabled while their section is filtered out"
      },
      {
        "element": "section.glossary-section",
        "description": "One per letter group, with an id the jump links target (section[id^=\"glossary-\"] also matches)"
      },
      {
        "element": "dl",
        "description": "Terms inside each section: dt/dd groups (several dt per dd, several dd per dt, or div-wrapped groups)"
      },
      {
        "element": "dfn",
        "required": false,
        "description": "The defined term inside dt; used as the filter target when present (otherwise the dt text)"
      }
    ],
    "events": [
      {
        "name": "glossary-index:filter",
        "detail": "{ query, matchCount }",
        "description": "After the filter is applied"
      }
    ]
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
        "name": "data-title",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Glossary heading, rendered as a real heading (the title attribute is not used). Observed."
      },
      {
        "name": "data-heading-level",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "2",
        "description": "Heading level (1-6) for data-title. Observed."
      },
      {
        "name": "src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "URL to JSON term data: { title?, terms: [{ id, term, definition, category?, seeAlso?, definitionHtml? }] }. Fetched once per URL; an inline <dl> renders as the fallback while loading and if the fetch fails. Observed."
      },
      {
        "name": "searchable",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Adds a search input (inside a <search> landmark) that filters terms by name and definition. Observed."
      },
      {
        "name": "compact",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Reduced spacing variant. CSS only."
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "loading",
          "ready",
          "error"
        ],
        "description": "Set in src mode: loading while fetching, ready after the data renders, error when the fetch fails (an error message is shown and the fallback <dl> is kept)."
      },
      {
        "name": "data-label-search",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Search glossary terms",
        "description": "Accessible name of the search input."
      },
      {
        "name": "data-label-search-placeholder",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Search terms…",
        "description": "Search input placeholder."
      },
      {
        "name": "data-label-terms",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Glossary terms",
        "description": "Accessible name of the terms region."
      },
      {
        "name": "data-label-alphabet",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Alphabet navigation",
        "description": "Accessible name of the jump-bar nav."
      },
      {
        "name": "data-label-found-one",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{count} term found",
        "description": "Search announcement for the Intl.PluralRules \"one\" category ({count} is replaced). Any category works: data-label-found-few, -many, -zero, -two."
      },
      {
        "name": "data-label-found-other",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{count} terms found",
        "description": "Search announcement for the \"other\" category and the fallback for unset categories."
      },
      {
        "name": "data-label-all-one",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Showing {count} term",
        "description": "Announcement when the search is cleared (\"one\" category; other categories as for found)."
      },
      {
        "name": "data-label-all-other",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Showing all {count} terms",
        "description": "Announcement when the search is cleared (\"other\" category and fallback)."
      },
      {
        "name": "data-label-uncategorized",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Uncategorized",
        "description": "Category label for terms without data-category."
      },
      {
        "name": "data-label-see-also",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "See also:",
        "description": "Prefix for seeAlso links generated from JSON / .terms data."
      },
      {
        "name": "data-label-error",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Could not load the glossary terms.",
        "description": "Message shown when src fails to load."
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
        "description": "Unique term identifier, set as the div's id (fragment anchor). Jump-bar letters link to the first term of each letter."
      }
    ],
    "structure": [
      {
        "element": "dl",
        "required": false,
        "description": "Source definition list (optional with src: rendered as the fallback). Kept in place, hidden, while upgraded; restored on teardown."
      },
      {
        "element": "div[data-term-id]",
        "description": "One per term inside the dl, wrapping its dt and dd"
      }
    ],
    "properties": [
      {
        "name": "terms",
        "type": "Array<{ id, term, definition, category?, seeAlso?, definitionHtml? }>",
        "description": "Get the parsed terms ({ id, term, definition, category, seeAlso? }; definition is text), or assign to rebuild. Assigned entries are written into the source <dl>, so they survive moves and re-renders. definition is rendered as text; definitionHtml is an explicit opt-in passed through VB's HTML sanitizer."
      }
    ],
    "events": [
      {
        "name": "glossary-wc:ready",
        "detail": "{ termCount, categories }",
        "description": "After every render (upgrade, reconnect, observed attribute change, .terms assignment, src load). Not fired while src is loading."
      },
      {
        "name": "glossary-wc:search",
        "detail": "{ query, matchCount }",
        "description": "After the (debounced) search input is applied"
      },
      {
        "name": "glossary-wc:terms-changed",
        "detail": "{ terms, source: 'property' }",
        "description": "After .terms assignment (fires after the render's ready)"
      },
      {
        "name": "glossary-wc:error",
        "detail": "{ url, error }",
        "description": "When src fails to load (HTTP error, invalid JSON, or no terms array)"
      }
    ]
  },
  "heading-links": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "heading-links",
    "type": "web-component",
    "description": "Add permalink anchors to headings; activating one follows the fragment and copies the section URL",
    "attributes": [
      {
        "name": "levels",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Comma-separated heading levels to process, h1–h6 only (default: 'h2,h3'). Invalid tokens are ignored; changes are observed",
        "default": "h2,h3"
      },
      {
        "name": "data-label-anchor",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Anchor accessible-name prefix; the anchor is named \"<prefix> <heading text>\" (default: 'Copy link to'). Observed",
        "default": "Copy link to"
      },
      {
        "name": "data-label-copied",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Screen-reader announcement after the URL is copied (default: 'Link copied to clipboard')",
        "default": "Link copied to clipboard"
      }
    ],
    "events": [
      {
        "name": "heading-links:navigate",
        "description": "Fires when an anchor is activated (unmodified primary click or Enter), after the fragment navigation and before the clipboard write",
        "detail": "{ id: string, url: string, heading: HTMLElement }"
      }
    ],
    "childAttributes": [
      {
        "name": "data-toc-ignore",
        "on": "*",
        "type": "boolean",
        "required": false,
        "description": "Skip this heading (or every heading inside this element): no anchor, no generated id. Shared with page-toc"
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
  "highlight-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "highlight-wc",
    "type": "web-component",
    "description": "Text highlighting with localStorage persistence. Inside <selection-menu> it renders a highlighter button + colour palette for the selection; standalone it renders no UI and exposes a JS API and events",
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
        "description": "Standalone mode: ID of the element to annotate (defaults to the first child element). Ignored inside <selection-menu>, which highlights its own targets"
      },
      {
        "name": "colors",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "yellow,green,blue,pink",
        "description": "Comma-separated palette colour names; each needs a --highlight-{name} token"
      },
      {
        "name": "readonly",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Render stored highlights but disable creating new ones. Inside <selection-menu> no highlighter button is rendered"
      },
      {
        "name": "storage-key",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Custom storage key suffix (default: page pathname)"
      },
      {
        "name": "data-label-button",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Highlight selection",
        "description": "Accessible name of the highlighter button (selection-menu mode)"
      },
      {
        "name": "data-label-palette",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Highlight color",
        "description": "Accessible name of the colour palette group (selection-menu mode)"
      },
      {
        "name": "data-label-annotation",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "You highlighted",
        "description": "Margin annotation text; forwarded to the target as data-highlights-label-annotation"
      },
      {
        "name": "data-label-added",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Highlight added",
        "description": "Screen-reader announcement when a highlight is created; forwarded as data-highlights-label-added"
      },
      {
        "name": "data-label-removed",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Highlight removed",
        "description": "Screen-reader announcement when a highlight is removed; forwarded as data-highlights-label-removed"
      }
    ],
    "structure": [
      {
        "element": "<article>",
        "description": "Standalone mode: content to annotate (when not using for=)"
      }
    ],
    "methods": [
      {
        "name": "highlightSelection(color?)",
        "description": "Highlight the current text selection in the given palette colour (default: last used). No-op when readonly or the colour is not in the palette"
      },
      {
        "name": "getHighlights()",
        "description": "Array of { id, startOffset, endOffset, text, color, note, created } records. Inside <selection-menu> the methods act on the most recently highlighted target (initially the first)"
      },
      {
        "name": "removeHighlight(id)",
        "description": "Remove one highlight by id"
      },
      {
        "name": "clearAll()",
        "description": "Remove every highlight on the target"
      },
      {
        "name": "exportHighlights()",
        "description": "JSON string { version: 1, highlights: [...] }"
      },
      {
        "name": "importHighlights(json)",
        "description": "Replace the highlights from an exported string or object. Records with a bad shape, offsets outside the text or a colour not in the palette are dropped. Returns { imported, rejected }"
      }
    ],
    "events": [
      {
        "name": "highlights:added",
        "detail": "{ id, text, color, note }",
        "description": "A highlight was created. Dispatched on the target element and bubbles"
      },
      {
        "name": "highlights:removed",
        "detail": "{ id }",
        "description": "A highlight was removed via removeHighlight(). Dispatched on the target and bubbles"
      },
      {
        "name": "highlights:selected",
        "detail": "{ text, rect }",
        "description": "Text was selected inside an interactive target — hook for a custom UI in standalone mode. Dispatched on the target and bubbles"
      },
      {
        "name": "highlights:clicked",
        "detail": "{ id, highlight }",
        "description": "An existing highlight or its margin annotation was clicked. Dispatched on the target and bubbles"
      },
      {
        "name": "highlights:note-changed",
        "detail": "{ id, note }",
        "description": "A note was saved (via <note-wc>). Dispatched on the target and bubbles"
      }
    ],
    "css": {
      "tokens": [
        {
          "name": "--highlight-yellow",
          "description": "Yellow highlight wash (light-dark() pair)"
        },
        {
          "name": "--highlight-green",
          "description": "Green highlight wash (light-dark() pair)"
        },
        {
          "name": "--highlight-blue",
          "description": "Blue highlight wash (light-dark() pair)"
        },
        {
          "name": "--highlight-pink",
          "description": "Pink highlight wash (light-dark() pair)"
        },
        {
          "name": "--highlight-ink",
          "description": "Text colour of highlighted text (light-dark() pair); per-colour override --highlight-{name}-ink"
        }
      ]
    }
  },
  "icon-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "icon-wc",
    "type": "web-component",
    "description": "Inline SVG icon: fetches one sanitized SVG file per icon from <base-path>/<set>/<name>.svg, sized by preset and labelled for assistive tech",
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
        "description": "Icon name (required): the SVG filename without .svg"
      },
      {
        "name": "set",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Icon set directory (lucide, phosphor, tabler, mage, bold, custom). Defaults to the nearest data-icon-set on the element, an ancestor or <html>, then lucide. Icons missing from the set fall back to Lucide."
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
        ],
        "default": "md",
        "description": "Size preset relative to the font size: 1em, 1.25em, 1.5em, 2em, 2.5em, 3em"
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Accessible name for a meaningful icon (role=\"img\"). Without it the icon is decorative (aria-hidden). Adding or removing it updates the icon live."
      },
      {
        "name": "base-path",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "/cdn/icons",
        "description": "Icon base URL for this icon. Defaults to <html data-icon-path>, then /cdn/icons (root-absolute: <base href> is not applied)."
      },
      {
        "name": "data-flip-rtl",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "boolean",
        "description": "Mirror the glyph horizontally when the icon is in a right-to-left context (directional icons such as arrows and chevrons)"
      },
      {
        "name": "data-animate",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "spin"
        ],
        "description": "Spins the icon while an ancestor has [data-loading] (disabled under prefers-reduced-motion)"
      },
      {
        "name": "data-error",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "boolean",
        "description": "Present when the icon could not be loaded from the requested set or the Lucide fallback; light-DOM content is shown instead"
      },
      {
        "name": "data-upgraded",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "boolean",
        "public": false,
        "description": "Present while the element is connected and upgraded"
      }
    ],
    "properties": [
      {
        "name": "name",
        "type": "string",
        "readonly": true,
        "description": "The name attribute"
      },
      {
        "name": "set",
        "type": "string",
        "readonly": true,
        "description": "Resolved set: set attribute, else nearest data-icon-set, else lucide"
      },
      {
        "name": "size",
        "type": "string",
        "readonly": true,
        "description": "The size attribute (default md)"
      },
      {
        "name": "label",
        "type": "string | null",
        "readonly": true,
        "description": "The label attribute"
      },
      {
        "name": "basePath",
        "type": "string",
        "readonly": true,
        "description": "Resolved base URL: base-path attribute, else <html data-icon-path>, else /cdn/icons"
      },
      {
        "name": "iconPath",
        "type": "string",
        "readonly": true,
        "description": "URL of the requested icon file (before any Lucide fallback)"
      }
    ],
    "childAttributes": [],
    "structure": [
      {
        "element": "light-DOM content",
        "required": false,
        "description": "Optional fallback shown until the SVG loads and when it fails (data-error)"
      }
    ]
  },
  "image-gallery": {
    "$schema": "../../../.claude/schemas/api.schema.json",
    "element": "image-gallery",
    "type": "web-component",
    "description": "Thumbnail grid with lightbox viewer. Progressive enhancement: thumbnails link to full images without JS. With JS, opens a native <dialog> lightbox with prev/next, keyboard (direction-aware), swipe, and View Transitions.",
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
        "description": "Lightbox control layout. 'edge' puts prev/next on the sides with a floating header, 'bar' moves prev/next into the top bar, 'minimal' shows close only (swipe/keyboard to navigate). Changing it rebuilds the lightbox on next open."
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
        "description": "Caption display in the lightbox. 'auto' adds an info button in a footer that toggles the caption text (hidden attribute), 'overlay' shows the caption under the image, 'hidden' suppresses it. Changing it rebuilds the lightbox on next open."
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
      },
      {
        "name": "data-label-dialog",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Image viewer",
        "description": "Accessible name of the lightbox dialog."
      },
      {
        "name": "data-label-close",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Close gallery",
        "description": "Close button name."
      },
      {
        "name": "data-label-prev",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Previous image",
        "description": "Previous button name."
      },
      {
        "name": "data-label-next",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Next image",
        "description": "Next button name."
      },
      {
        "name": "data-label-show-details",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Show image details",
        "description": "Info button name while the caption is collapsed (captions=\"auto\")."
      },
      {
        "name": "data-label-hide-details",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Hide image details",
        "description": "Info button name while the caption is expanded (captions=\"auto\")."
      },
      {
        "name": "data-label-counter",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Image {n} of {total}",
        "description": "Counter text template, announced politely on navigation; {n} and {total} are replaced."
      }
    ],
    "events": [
      {
        "name": "image-gallery:images-changed",
        "detail": "{ images, source: 'property' }",
        "description": "Fired after the images setter rebuilds the gallery."
      }
    ],
    "properties": [
      {
        "name": "images",
        "type": "Array<{ href, thumbSrc, alt?, caption? }>",
        "description": "Get the image set (caption is a string for text-only captions, a cloned DocumentFragment for markup, or null) or assign one to rebuild the thumbnails. String captions render as text, never HTML; pass a Node, DocumentFragment or <template> for rich captions. Assigning closes an open lightbox and fires image-gallery:images-changed with source 'property'."
      }
    ],
    "methods": [
      {
        "name": "open(index)",
        "description": "Open the lightbox at a zero-based index (no-op when out of range)."
      },
      {
        "name": "close()",
        "description": "Close the lightbox (with the morph transition when enabled)."
      },
      {
        "name": "next()",
        "description": "Show the next image (wraps with loop)."
      },
      {
        "name": "prev()",
        "description": "Show the previous image (wraps with loop)."
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
        "description": "Optional caption inside figure. Supports HTML including links; its nodes are cloned into the lightbox."
      }
    ]
  },
  "image-map": {
    "$schema": "../../../.claude/schemas/api.schema.json",
    "element": "image-map",
    "type": "web-component",
    "description": "Responsive image map: <map-area> children define percentage-coordinate hotspots (rect, circle, poly) over a child <img>, with an SVG hit-testing overlay, keyboard-focusable anchors, and rich HTML tooltips. Without JS the image renders and each map-area shows as a labeled list item.",
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
        "direction": "input",
        "purpose": "config",
        "type": "string",
        "description": "Image URL used to create the <img> when no child <img> is authored."
      },
      {
        "name": "alt",
        "kind": "host-api",
        "direction": "input",
        "purpose": "config",
        "type": "string",
        "description": "Alt text for the generated <img>."
      },
      {
        "name": "data-label-map",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Image map",
        "description": "Group name fallback when there is no aria-label/aria-labelledby and the image has no alt."
      }
    ],
    "events": [
      {
        "name": "image-map:area-enter",
        "detail": "{ area }",
        "description": "Pointer entered or focus moved onto an area; area is the <map-area> element."
      },
      {
        "name": "image-map:area-leave",
        "detail": "{ area }",
        "description": "Pointer left or focus moved off an area."
      },
      {
        "name": "image-map:area-activate",
        "detail": "{ area }",
        "description": "Area clicked, tapped, or activated with Enter/Space. Cancelable: preventDefault() stops link navigation."
      },
      {
        "name": "image-map:regions-changed",
        "detail": "{ regions, source: 'property' }",
        "description": "Fired after the regions setter rebuilds the map."
      }
    ],
    "properties": [
      {
        "name": "regions",
        "type": "Array<{ shape, coords, label?, href?, target?, tooltip?, disabled?, content? }>",
        "description": "Get the regions from the <map-area> children (content is a string for text-only areas or a cloned DocumentFragment for markup) or assign to rebuild them. String content renders as text, never HTML; pass a Node, DocumentFragment or <template> for rich tooltips. Fires image-map:regions-changed with source 'property'."
      }
    ],
    "childAttributes": [
      {
        "name": "shape",
        "on": "map-area",
        "type": "enum",
        "values": [
          "rect",
          "circle",
          "poly"
        ],
        "required": false,
        "description": "Hotspot shape (default rect)."
      },
      {
        "name": "coords",
        "on": "map-area",
        "type": "string",
        "required": true,
        "description": "Percentage coordinates (0-100), space or comma separated: rect x1 y1 x2 y2, circle cx cy r, poly x1 y1 x2 y2 ..."
      },
      {
        "name": "label",
        "on": "map-area",
        "type": "string",
        "required": false,
        "description": "Accessible name of the hotspot; falls back to the area's text content. Shown as the list label without JS."
      },
      {
        "name": "href",
        "on": "map-area",
        "type": "string",
        "required": false,
        "description": "Navigation target; the hotspot becomes an <a> focus anchor. Not a link without JS: also author an <a href> in the content for no-JS reachability."
      },
      {
        "name": "target",
        "on": "map-area",
        "type": "string",
        "required": false,
        "description": "Link target for href (e.g. _blank)."
      },
      {
        "name": "tooltip",
        "on": "map-area",
        "type": "enum",
        "values": [
          "hover",
          "click",
          "none"
        ],
        "required": false,
        "description": "Tooltip mode: hover (default; on hover/focus, hoverable), click (toggle on click/Enter/Space, focus moves into interactive content, Escape returns), none."
      },
      {
        "name": "disabled",
        "on": "map-area",
        "type": "boolean",
        "required": false,
        "description": "Removes the hotspot from interaction and the tab order."
      }
    ],
    "structure": [
      {
        "element": "<img>",
        "description": "Direct child image the overlay is laid over (or use src/alt on the host)."
      },
      {
        "element": "<map-area>",
        "description": "Hotspot definition; its child content becomes the tooltip (and the no-JS list item body)."
      }
    ]
  },
  "include-file": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "include-file",
    "type": "web-component",
    "description": "Fetch a same-origin HTML fragment, sanitize it, and insert it into the page",
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
        "description": "URL of the HTML fragment, resolved against the page (document.baseURI). Only same-origin http(s) URLs load; blob:, data:, javascript: and other schemes are always refused; other origins need allow-cross-origin. A same-origin URL that redirects off-origin is refused. Observed: changing it re-fetches (honouring lazy); a change made while detached loads on reconnect."
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
        "description": "How fetched content is inserted. append/prepend leave existing children (including author scripts) untouched. Unknown values behave as replace and log a warning."
      },
      {
        "name": "lazy",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Defer loading until the element is within 200px of the viewport (also for later src changes)"
      },
      {
        "name": "trusted",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Author vouches for the source: insert the fetched HTML without sanitizing. Without it the fragment goes through VB's sanitizer (no scripts, on* handlers, javascript: URLs, iframes, forms…). Never set it for URLs that serve user-generated content."
      },
      {
        "name": "allow-scripts",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Run the fragment's scripts (each once per load). Requires trusted; ignored with a console warning otherwise."
      },
      {
        "name": "allow-cross-origin",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Permit fetching from another origin (the server must allow it via CORS). Content is still sanitized unless trusted is also set."
      },
      {
        "name": "data-label-error",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Failed to load content",
        "description": "Text of the role=\"alert\" error message shown when a load fails and no fallback content remains"
      },
      {
        "name": "data-loading",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": false,
        "description": "Present while content is loading (aria-busy=\"true\" is set alongside)"
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
        "description": "Present if the fetch fails or the URL is refused (origin, scheme, include cycle, nesting deeper than 10)"
      }
    ],
    "properties": [
      {
        "name": "src",
        "type": "string",
        "description": "Mirror of the src attribute. Setting it updates the attribute (which loads the new URL) and fires include-file:src-changed."
      }
    ],
    "methods": [
      {
        "name": "reload()",
        "returns": "void",
        "description": "Re-fetch the current src (same policy checks as a normal load)."
      }
    ],
    "events": [
      {
        "name": "include-file:loaded",
        "detail": "{ src, url, html }",
        "description": "After the fragment is inserted. src is the attribute value, url the resolved absolute URL, html the markup as inserted (sanitized unless trusted)."
      },
      {
        "name": "include-file:error",
        "detail": "{ src, error }",
        "description": "When the fetch fails or the load is refused; error is a message string. The original fallback is restored on a first-load failure in replace mode."
      },
      {
        "name": "include-file:src-changed",
        "detail": "{ src, source: 'property' }",
        "description": "After .src is assigned a new value from script (not for direct attribute changes)"
      }
    ]
  },
  "markdown-editor": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "markdown-editor",
    "type": "web-component",
    "description": "Side-by-side markdown editor with live preview. Adopts the authored textarea and composes markdown-viewer.",
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "textarea",
        "@flow"
      ]
    },
    "attributes": [
      {
        "name": "placeholder",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Textarea placeholder; overrides the textarea's own. No default placeholder"
      },
      {
        "name": "rows",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "10",
        "description": "Textarea rows; overrides the textarea's own rows"
      },
      {
        "name": "highlight",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Pass highlight attribute to the preview viewer (markdown-viewer:highlight per code block)"
      },
      {
        "name": "data-tab-indent",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Tab inserts two spaces instead of moving focus. Escape then Tab moves focus; Shift+Tab is never captured. Read at upgrade"
      },
      {
        "name": "data-auto-mermaid",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Upgrade ```mermaid fences in the live preview to diagram-wc (loads the mermaid bridge)"
      },
      {
        "name": "data-theme",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Theme propagated to the preview pane"
      },
      {
        "name": "data-label-source",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Markdown source",
        "description": "Accessible name of the source pane; also names the textarea when nothing else does"
      },
      {
        "name": "data-label-preview",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Rendered preview",
        "description": "Accessible name of the preview pane"
      },
      {
        "name": "data-label-tab-hint",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Tab inserts spaces. Press Escape, then Tab, to move focus.",
        "description": "Description read with the textarea when data-tab-indent is set"
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
    "childAttributes": [
      {
        "name": "name",
        "on": "textarea",
        "type": "string",
        "description": "Form field name. Goes on the textarea, so the value submits with or without JavaScript"
      },
      {
        "name": "required",
        "on": "textarea",
        "type": "boolean",
        "description": "Native constraint validation (also minlength, maxlength, readonly, form)"
      },
      {
        "name": "id",
        "on": "textarea",
        "type": "string",
        "description": "Kept on upgrade, so a <label for> keeps naming the textarea"
      },
      {
        "name": "dir",
        "on": "textarea",
        "type": "string",
        "description": "Base direction for the source and the preview (default auto)"
      }
    ],
    "structure": [
      {
        "element": "textarea",
        "required": false,
        "description": "The editable source. Adopted and moved into the source pane with its attributes; created when absent"
      }
    ],
    "events": [
      {
        "name": "markdown-editor:input",
        "detail": "{ value }",
        "description": "Fired on each keystroke. Bubbles, composed"
      },
      {
        "name": "markdown-editor:change",
        "detail": "{ value, source }",
        "description": "source \"user\": on blur after the content changed. source \"api\": when .value is assigned (the next blur does not repeat it). Not fired by form reset. Bubbles, composed"
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string",
        "description": "Get/set the markdown. Setting updates the preview immediately and fires markdown-editor:change with source \"api\""
      },
      {
        "name": "textarea",
        "type": "HTMLTextAreaElement",
        "readonly": true,
        "description": "The backing textarea: the authored one when provided. Stable across reconnects"
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
        "name": "allow-cross-origin",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Permit a src on another origin (CORS still applies; content is still sanitized unless sanitize=\"off\"). Without it src must be same-origin http(s); redirects are re-checked"
      },
      {
        "name": "sanitize",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "on",
          "off",
          "false"
        ],
        "default": "on",
        "description": "Sanitizing is on unless this is \"off\" or \"false\" (any other value, or no attribute, keeps it on). Off writes parser output raw with innerHTML: trusted first-party markdown only, never with a cross-origin or user-influenced src"
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
        "name": "data-label-error",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Failed to load markdown",
        "description": "Text of the role=\"alert\" message shown when src fails to load or parse and no <pre> fallback is visible"
      },
      {
        "name": "data-auto-mermaid",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Upgrade ```mermaid fences in the rendered output to <diagram-wc> (main.js loads the markdown-mermaid bridge when present)"
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
        "description": "Custom parser function (markdown string → HTML string). Overrides the default marked parser. Its output is still sanitized unless sanitize=\"off\""
      },
      {
        "name": "markdown",
        "type": "string",
        "description": "Get the current markdown source, or set a string to render it instead of the slots/src (null or '' falls back to them)"
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
  "nav-bar": {
    "$schema": "../../schemas/api.schema.json",
    "element": "nav-bar",
    "type": "web-component",
    "description": "Top-level site/app navigation primitive. HTML-first wrap or JSON-first .items setter; auto aria-current sync via URL matching (origin + normalised pathname) on popstate and Navigation API entry changes.",
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
      },
      {
        "name": "data-label-new-tab",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Screen-reader suffix appended to external .items links. Default: '(opens in new tab)'."
      }
    ],
    "properties": [
      {
        "name": "items",
        "type": "Array<{ href, label, route?, icon?, external?, badge? }>",
        "description": "Read returns the last assigned array, else { href, label } inferred from the managed links. Assigning replaces the direct <a> children with the default renderer (deep-equal assignment is a no-op). Only http(s) and relative hrefs render as links."
      },
      {
        "name": "current",
        "type": "string | null",
        "description": "Read returns the active route (data-route or href of the aria-current link, or the explicit value). Assigning takes ownership: URL sync stops until releaseCurrent()."
      }
    ],
    "methods": [
      {
        "name": "releaseCurrent()",
        "description": "Drop explicit ownership of .current and re-run URL matching."
      },
      {
        "name": "refresh()",
        "description": "Re-run URL matching manually (for routers that change the URL without popstate or the Navigation API). No-op while .current is explicitly owned."
      }
    ],
    "events": [
      {
        "name": "nav-bar:upgraded",
        "description": "Fired after every connect, including reconnects after a move."
      },
      {
        "name": "nav-bar:items-changed",
        "detail": "{ items, source: 'property' }",
        "description": "Fired after .items is assigned a new (not deep-equal) value."
      },
      {
        "name": "nav-bar:current-changed",
        "detail": "{ current, previous, source: 'property' | 'popstate' | 'navigation' | 'pathname' }",
        "description": "Fired when the active link changes."
      }
    ],
    "childAttributes": [
      {
        "name": "href",
        "on": "a",
        "type": "string",
        "description": "Standard anchor href. Resolved against the document base URL and matched by origin + normalised pathname (trailing slash, query and hash ignored)."
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
    "description": "Private reader notes on highlights: a note action inside selection-menu, a page-level button with for=\"id\", and the note panel itself. Also opens the panel for margin-annotation clicks (it listens for highlights:request-note on document).",
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
        "description": "ID of the target article (page-level mode). The button opens the panel for the first noted, else first, highlight on it. Without for and outside selection-menu, note-wc renders no button and only hosts the panel."
      },
      {
        "name": "data-label-add",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Add private note",
        "description": "Accessible name of the button inside selection-menu."
      },
      {
        "name": "data-label-view",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "View notes",
        "description": "Accessible name of the page-level (for=\"id\") button."
      },
      {
        "name": "data-label-dialog",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Private note",
        "description": "Accessible name of the note panel dialog."
      },
      {
        "name": "data-label-heading",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Private note",
        "description": "Visible panel heading (uppercased by CSS)."
      },
      {
        "name": "data-label-placeholder",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Add a note…",
        "description": "Textarea placeholder."
      },
      {
        "name": "data-label-textarea",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Note for highlighted text",
        "description": "Textarea accessible name."
      },
      {
        "name": "data-label-save",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Save",
        "description": "Save button text."
      },
      {
        "name": "data-label-cancel",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Cancel",
        "description": "Cancel button text."
      }
    ],
    "methods": [
      {
        "name": "openFor",
        "returns": "void",
        "description": "openFor(highlight, controller, opener?) opens the note panel for a highlight record on a highlights controller (from initHighlights). Focus returns to opener (default: the element focused when it opened) on close. The highlights:request-note document event calls this on the first connected note-wc."
      }
    ],
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
        "description": "Banner mode: color variant (reactive)"
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
        "description": "Banner mode: top = sticky to the viewport top, bottom = fixed to the viewport bottom (reactive)"
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
        "description": "Panel mode: absolute or root-relative URL, or a VBService role name, for dynamic notifications"
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
        "description": "Panel mode: on each poll after the first, show a toast on the first <toast-msg> in the document for every never-seen dynamic notification"
      },
      {
        "name": "storage-key",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Panel mode: VBStore namespace for read state (default: notifications)"
      },
      {
        "name": "data-label-trigger",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Notifications",
        "description": "Panel mode: Trigger accessible name (minted bell; an authored trigger keeps its own name)."
      },
      {
        "name": "data-label-unread",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{n} unread",
        "description": "Panel mode: Unread count appended to the trigger name ({n} = count)."
      },
      {
        "name": "data-label-title",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Notifications",
        "description": "Panel mode: Panel heading and dialog name."
      },
      {
        "name": "data-label-mark-all",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Mark all read",
        "description": "Panel mode: Mark-all button text."
      },
      {
        "name": "data-label-tabs",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Notification categories",
        "description": "Panel mode: Tab list accessible name."
      },
      {
        "name": "data-label-all",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "All",
        "description": "Panel mode: All tab text."
      },
      {
        "name": "data-label-watching",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Watching",
        "description": "Panel mode: Watching tab text."
      },
      {
        "name": "data-label-empty",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "No notifications",
        "description": "Panel mode: Empty-state text for the All tab."
      },
      {
        "name": "data-label-watch-empty",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "You aren’t watching any pages yet. Use the “Watch” button on a page to start.",
        "description": "Panel mode: Empty-state text for the Watching tab."
      },
      {
        "name": "data-label-last-checked",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Last checked: {date}",
        "description": "Panel mode: Watch row check time ({date} = formatted date)."
      },
      {
        "name": "data-label-never",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "—",
        "description": "Panel mode: Watch row check time when never checked."
      },
      {
        "name": "data-label-changed",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Changed",
        "description": "Panel mode: Badge on watched pages whose content changed."
      },
      {
        "name": "data-label-unwatch",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Unwatch {title}",
        "description": "Panel mode: Unwatch button accessible name ({title} = page title)."
      },
      {
        "name": "data-label-new",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "New notification",
        "description": "Panel mode: Toast text when a new notification has no title or body."
      },
      {
        "name": "data-label-variant-info",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Information:",
        "description": "Banner mode: visually hidden prefix announcing the info variant, so it isn't conveyed by colour alone."
      },
      {
        "name": "data-label-variant-success",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Success:",
        "description": "Banner mode: visually hidden prefix announcing the success variant, so it isn't conveyed by colour alone."
      },
      {
        "name": "data-label-variant-warning",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Warning:",
        "description": "Banner mode: visually hidden prefix announcing the warning variant, so it isn't conveyed by colour alone."
      },
      {
        "name": "data-label-variant-error",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Error:",
        "description": "Banner mode: visually hidden prefix announcing the error variant, so it isn't conveyed by colour alone."
      }
    ],
    "events": [
      {
        "name": "notification-wc:new",
        "detail": "{ notification }",
        "description": "A never-seen entry arrived in a dynamic fetch"
      },
      {
        "name": "notification-wc:read",
        "detail": "{ id }",
        "description": "An entry was marked read"
      },
      {
        "name": "notification-wc:dismiss",
        "detail": "{ id }",
        "description": "Banner was dismissed (id = persist key)"
      },
      {
        "name": "notification-wc:open",
        "description": "Panel opened"
      },
      {
        "name": "notification-wc:close",
        "description": "Panel closed"
      },
      {
        "name": "notification-wc:notifications-changed",
        "detail": "{ notifications, source: 'property' }",
        "description": "The notifications setter replaced the dynamic list"
      },
      {
        "name": "page-watch:remove",
        "detail": "{ url, subscriptionId }",
        "description": "A page was unwatched from the Watching tab"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "childAttributes": [
      {
        "name": "data-trigger",
        "on": "button",
        "type": "boolean",
        "description": "Panel mode: marks an authored trigger button that replaces the minted bell. An unread badge is appended inside it."
      },
      {
        "name": "data-id",
        "on": "article",
        "type": "string",
        "description": "Panel mode: notification id (read state and dynamic merge key)."
      },
      {
        "name": "data-type",
        "on": "article",
        "type": "enum",
        "values": [
          "update",
          "alert",
          "watch",
          "system",
          "message",
          "stewardship"
        ],
        "description": "Panel mode: row icon (default update)."
      },
      {
        "name": "data-date",
        "on": "article",
        "type": "string",
        "description": "Panel mode: ISO date; sorts rows newest first and is shown formatted in the document language."
      },
      {
        "name": "value",
        "on": "button",
        "type": "string",
        "description": "Banner mode: value=\"dismiss\" (or data-dismiss) marks the dismiss button."
      }
    ],
    "properties": [
      {
        "name": "notifications",
        "type": "Array<{ id, title, body?, date?, type?, url?, dismissed? }>",
        "description": "Panel mode: dynamic notifications merged over static <article> children by id (same shape as the src feed). The getter returns a copy; the setter re-renders and fires notification-wc:notifications-changed. url renders as a link only when it resolves to http(s). Banner mode ignores the setter."
      }
    ]
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
        "description": "Render the whole panel from <meta> tags in <head> (meta-tag contract v1): author, link[rel=author] / article:author, last-modified / article:modified_time, article:published_time, itemprop=version, vb:version-url, vb:provenance, vb:ai-tools, vb:review, vb:status, license + link[rel=license], keywords, repeated meta[name=concept]. Values are inserted as text; links are used only when they resolve to http(s)."
      },
      {
        "name": "data-concept-base",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "/topics/",
        "description": "Auto mode: base path for concept links ({base}{id}/). Must be relative or http(s); otherwise concepts render as plain text."
      },
      {
        "name": "data-heading-level",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "values": [
          "2",
          "3",
          "4",
          "5",
          "6"
        ],
        "default": "2",
        "description": "Auto mode: heading level of the panel section headings."
      },
      {
        "name": "data-label-reading-time",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "~{n}",
        "description": "Template for [data-reading-time]; {n} is the Intl-formatted minute value (\"5 min\")."
      },
      {
        "name": "data-label-author",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Author",
        "description": "Auto mode UI string (default \"Author\")."
      },
      {
        "name": "data-label-history",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "History",
        "description": "Auto mode UI string (default \"History\")."
      },
      {
        "name": "data-label-provenance",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "How this was made",
        "description": "Auto mode UI string (default \"How this was made\")."
      },
      {
        "name": "data-label-topic",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Topic",
        "description": "Auto mode UI string (default \"Topic\")."
      },
      {
        "name": "data-label-published",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Published",
        "description": "Auto mode UI string (default \"Published\")."
      },
      {
        "name": "data-label-updated",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Last updated",
        "description": "Auto mode UI string (default \"Last updated\")."
      },
      {
        "name": "data-label-version",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Version",
        "description": "Auto mode UI string (default \"Version\")."
      },
      {
        "name": "data-label-authorship",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Authorship",
        "description": "Auto mode UI string (default \"Authorship\")."
      },
      {
        "name": "data-label-ai-tools",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "AI tools used",
        "description": "Auto mode UI string (default \"AI tools used\")."
      },
      {
        "name": "data-label-review",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Review",
        "description": "Auto mode UI string (default \"Review\")."
      },
      {
        "name": "data-label-status",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Status",
        "description": "Auto mode UI string (default \"Status\")."
      },
      {
        "name": "data-label-license",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "License",
        "description": "Auto mode UI string (default \"License\")."
      },
      {
        "name": "data-label-concepts",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Concepts",
        "description": "Auto mode UI string (default \"Concepts\")."
      },
      {
        "name": "data-label-keywords",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Keywords",
        "description": "Auto mode UI string (default \"Keywords\")."
      },
      {
        "name": "data-label-tier-declared",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Self-declared",
        "description": "Visible trust-tier text appended to the badge for data-trust=\"declared\" (default \"Self-declared\")."
      },
      {
        "name": "data-label-tier-verified",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Verified",
        "description": "Visible trust-tier text appended to the badge for data-trust=\"verified\" (default \"Verified\")."
      },
      {
        "name": "data-label-tier-failed",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Signature failed",
        "description": "Visible trust-tier text appended to the badge for data-trust=\"failed\" (default \"Signature failed\")."
      },
      {
        "name": "data-label-tier-key-unavailable",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Key unavailable",
        "description": "Visible trust-tier text appended to the badge for data-trust=\"key-unavailable\" (default \"Key unavailable\")."
      }
    ],
    "events": [
      {
        "name": "page-info:verified",
        "detail": "{ status: 'undeclared' | 'declared' | 'verified' | 'failed' | 'key-unavailable', tier: 0 | 1 | 3 | -1 | -2, reason?: string }",
        "description": "Bubbles. Fired on every setup with the declared tier (undeclared/declared, no reason), then again with the verification result when the page carries meta[name=vb:signature]. reason: 'ok', 'mismatch', 'missing-author-key', 'unsupported-algorithm:…', 'canonicalize:…', 'verify:…', or the key fetch error."
      }
    ],
    "childAttributes": [
      {
        "name": "data-trust",
        "on": ".page-info-badge",
        "type": "enum",
        "values": [
          "undeclared",
          "declared",
          "verified",
          "failed",
          "key-unavailable"
        ],
        "description": "Verification tier, written by the component (the first .page-info-badge without data-status). A .page-info-tier span with the tier text is appended inside the badge."
      },
      {
        "name": "data-provenance",
        "on": ".page-info-badge",
        "type": "string",
        "description": "vb:provenance token(s) the badge describes (styling hook)."
      },
      {
        "name": "data-status",
        "on": ".page-info-badge",
        "type": "enum",
        "values": [
          "draft",
          "archived"
        ],
        "description": "Publication-status badge (auto mode renders it for non-published pages); excluded from trust updates."
      },
      {
        "name": "data-relative",
        "on": "time",
        "type": "boolean",
        "description": "Rewrite the text as a localized relative time (Intl.RelativeTimeFormat, closest [lang]) from the datetime attribute; the absolute date is put in title unless the author set one. Future dates read \"in 3 days\"."
      },
      {
        "name": "datetime",
        "on": "time",
        "type": "string",
        "description": "ISO date or datetime read by time[data-relative]. Date-only values are formatted in UTC."
      },
      {
        "name": "data-reading-time",
        "on": "any element",
        "type": "boolean",
        "description": "Filled with the estimated reading time of the page's outermost [data-signable] roots (238 wpm / 500 CJK chars per minute, shared with page-stats; skips [data-signable=false], hidden and script content)."
      }
    ],
    "structure": [
      {
        "element": "details",
        "required": false,
        "description": "Static mode: <details> with a <summary> trust bar (author as plain text, time[data-relative], .page-info-badge) and a .page-info-panel of sections. Keep links out of <summary>."
      }
    ],
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
        "description": "ID of the target content element to analyze. Without it (or with an author-rendered <dl> inside) the component renders nothing and adopts the existing markup."
      },
      {
        "name": "data-wpm",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": "238",
        "description": "Words per minute for reading time (default 238, shared with page-info). Chinese/Japanese text is timed at 500 characters per minute."
      },
      {
        "name": "data-show",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "reading-time",
        "description": "Comma-separated list of stats to display, in fixed order: reading-time, word-count, last-modified. Unknown tokens are ignored. last-modified reads meta[name=last-modified], then meta[property=article:modified_time]; it is omitted when neither is present."
      },
      {
        "name": "data-label-reading-time",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Reading time",
        "description": "Visually hidden dt label for the reading-time item."
      },
      {
        "name": "data-label-word-count",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Word count",
        "description": "Visually hidden dt label for the word-count item."
      },
      {
        "name": "data-label-last-modified",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Last updated",
        "description": "Visually hidden dt label for the last-modified item."
      },
      {
        "name": "data-label-min-read",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{n} read",
        "description": "Reading-time text template; {n} is the Intl-formatted minute value (\"5 min\"). Default \"{n} read\" for English documents, \"{n}\" otherwise."
      },
      {
        "name": "data-label-words",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{n} words",
        "description": "Word-count text template; {n} is the Intl-formatted count. Per-plural overrides: data-label-words-zero/-one/-two/-few/-many (Intl.PluralRules category of the document language)."
      }
    ],
    "childAttributes": [
      {
        "name": "data-generated",
        "on": "dl",
        "type": "boolean",
        "description": "Set by the component on the <dl> it renders itself. A <dl> without it is author/SSR markup and is adopted unchanged."
      },
      {
        "name": "data-stats-ignore",
        "on": "any element inside the target",
        "type": "boolean",
        "description": "Exclude this subtree from the word count (script, style, template, noscript, [hidden], [aria-hidden=true] and [inert] are always excluded)."
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
        "default": "h2,h3",
        "description": "Comma-separated heading levels to include (auto-generated mode)"
      },
      {
        "name": "scope",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "main",
        "description": "CSS selector for the container whose headings are scanned (first match wins; docs layouts use 'main article')"
      },
      {
        "name": "data-title",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "On this page",
        "description": "Summary text and nav aria-label of the generated ToC"
      },
      {
        "name": "orientation",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "horizontal"
        ],
        "description": "'horizontal' renders an inline, horizontally scrollable bar (summary hidden, nesting flattened). Omit for the default vertical tree"
      }
    ],
    "childAttributes": [
      {
        "name": "data-toc-ignore",
        "on": "heading (or any ancestor) inside the scope container",
        "type": "boolean",
        "description": "Exclude the heading, or every heading inside the marked container, from the generated ToC"
      }
    ],
    "properties": [
      {
        "name": "entries",
        "type": "Array<{ id?: string, text: string, level: number }>",
        "readonly": true,
        "description": "Current ToC entries derived from the page headings"
      }
    ],
    "methods": [
      {
        "name": "refresh",
        "returns": "void",
        "description": "Rebuild the ToC (auto mode) or re-scan authored links (manual mode) after content changes"
      }
    ],
    "events": [
      {
        "name": "page-toc:navigate",
        "detail": "{ id }",
        "description": "Fired when a ToC link is activated; id is the target heading's id"
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
        "type": "enum",
        "description": "Positioning strategy",
        "values": [
          "sticky",
          "fixed",
          "inline"
        ],
        "default": "sticky"
      },
      {
        "name": "data-orientation",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "description": "Tool strip direction; auto resolves to horizontal for inline, vertical otherwise. Re-resolved when changed",
        "values": [
          "auto",
          "vertical",
          "horizontal"
        ],
        "default": "auto"
      },
      {
        "name": "data-gap",
        "kind": "data",
        "purpose": "config",
        "type": "enum",
        "description": "Gap token between tools",
        "values": [
          "2xs",
          "xs",
          "s",
          "m",
          "l"
        ],
        "default": "s"
      },
      {
        "name": "data-fab-icon",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Icon name for the mobile FAB",
        "default": "ellipsis-vertical"
      },
      {
        "name": "data-fab-label",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Accessible label for the FAB and its popover panel",
        "default": "Page tools"
      },
      {
        "name": "data-breakpoint",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Viewport width at or below which the toolbar collapses to a FAB",
        "default": "48rem"
      },
      {
        "name": "data-resolved-orientation",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "vertical",
          "horizontal"
        ],
        "direction": "output",
        "public": true,
        "description": "Reflected effective orientation (data-orientation resolved against data-position)"
      },
      {
        "name": "data-collapsed",
        "kind": "data",
        "purpose": "output-state",
        "type": "boolean",
        "direction": "output",
        "public": true,
        "description": "Present while the toolbar is collapsed to the FAB (viewport at or below data-breakpoint)"
      }
    ],
    "childAttributes": [],
    "structure": [
      {
        "element": "button.page-tools-fab",
        "required": false,
        "description": "Generated FAB (popovertarget → panel); visible only while collapsed. Internal (data-page-tools-internal)"
      },
      {
        "element": "section.page-tools-popover[popover]",
        "required": false,
        "description": "Generated popover panel that holds the tools while collapsed. Internal (data-page-tools-internal)"
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    },
    "properties": [
      {
        "name": "tools",
        "type": "Element[]",
        "readonly": true,
        "description": "The tool elements (author children, excluding the generated FAB and popover; read from the popover while collapsed)"
      }
    ],
    "cssProperties": [
      {
        "name": "--page-tools-gap",
        "description": "Gap between tools (set by data-gap)"
      },
      {
        "name": "--page-tools-offset",
        "description": "Sticky top offset / fixed inline-end offset"
      },
      {
        "name": "--page-tools-button-padding",
        "description": "Padding of normalised icon tool buttons"
      },
      {
        "name": "--page-tools-icon-size",
        "description": "Icon size inside tool buttons (default 1.25rem)"
      },
      {
        "name": "--page-tools-fab-size",
        "description": "FAB diameter (default 3rem)"
      },
      {
        "name": "--page-tools-fab-bottom",
        "description": "FAB distance from the viewport block-end edge"
      },
      {
        "name": "--page-tools-fab-end",
        "description": "FAB distance from the viewport inline-end edge"
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
        "default": "Page Tour",
        "description": "Tour name; the accessible name of the tour card"
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
        "description": "Skip behaviour: passive and active allow skipping (Skip button, Escape, backdrop click); forced removes all three. Action gates come from each step's data-action, not the mode"
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
        "description": "Pixel padding around the spotlight; overrides the --tour-spotlight-padding token"
      },
      {
        "name": "data-label-step",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Step {n} of {total}",
        "description": "Step counter template; {n} and {total} are replaced"
      },
      {
        "name": "data-label-skip",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Skip tour",
        "description": "Skip button text"
      },
      {
        "name": "data-label-close",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Close",
        "description": "Skip button text on the last step"
      },
      {
        "name": "data-label-prev",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Previous",
        "description": "Previous button text"
      },
      {
        "name": "data-label-next",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Next",
        "description": "Next button text"
      },
      {
        "name": "data-label-finish",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Finish",
        "description": "Next button text on the last step"
      },
      {
        "name": "data-label-nav",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Tour navigation",
        "description": "Accessible name of the card's button group"
      },
      {
        "name": "data-label-ready",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Done. Next is available.",
        "description": "Announced when a step's required action completes"
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
          "inline-start",
          "inline-end",
          "auto"
        ],
        "default": "auto",
        "description": "Preferred card side; inline-start/inline-end follow the text direction. Flips when there is no room"
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
          "change",
          "custom"
        ],
        "default": "none",
        "description": "Required user action on the target before Next is enabled (custom: the page dispatches tour:action on the <page-tour>)"
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
        "description": "false hides Skip and ignores Escape and backdrop clicks on this step (forced mode already does this for every step)"
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
    ],
    "methods": [
      {
        "name": "start(step?)",
        "description": "Start at a step index (default 0). While already running, moves to that step instead"
      },
      {
        "name": "stop()",
        "description": "End the tour silently (no event)"
      },
      {
        "name": "next()",
        "description": "Advance; ignored while the step's action gate is waiting. On the last step, completes the tour"
      },
      {
        "name": "prev()",
        "description": "Go to the previous step"
      },
      {
        "name": "goto(index)",
        "description": "Jump to a step (0-based); steps whose target is missing are skipped"
      },
      {
        "name": "skip()",
        "description": "Skip the tour (fires tour:skip); ignored when the current step is not skippable"
      },
      {
        "name": "reset()",
        "description": "Clear persisted progress and reset data-step to 0"
      }
    ],
    "cssProperties": [
      {
        "name": "--tour-backdrop-color",
        "description": "Overlay colour (default oklch(0% 0 0 / 0.5))"
      },
      {
        "name": "--tour-spotlight-ring",
        "description": "Spotlight ring and active pip colour (default var(--color-primary))"
      },
      {
        "name": "--tour-spotlight-padding",
        "description": "Space between the target and the spotlight edge (default 8px)"
      },
      {
        "name": "--tour-spotlight-radius",
        "description": "Spotlight corner radius"
      },
      {
        "name": "--tour-card-max-width",
        "description": "Maximum card width (default 22rem)"
      },
      {
        "name": "--tour-card-min-width",
        "description": "Minimum card width (default 16rem)"
      },
      {
        "name": "--tour-card-offset",
        "description": "Gap between the spotlight and the card"
      },
      {
        "name": "--tour-transition-duration",
        "description": "Spotlight and backdrop transition duration"
      },
      {
        "name": "--tour-z-index",
        "description": "Stacking level of the backdrop and spotlight"
      }
    ]
  },
  "pager-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "pager-wc",
    "type": "web-component",
    "description": "Standalone pagination controls element targeting any [data-paged] container. The element form of the data-paged primitive — same shape as the layout-grid / data-layout-* element-attribute symmetry across VB. Authors pick the surface that fits the markup; both feed the same engine. Multiple <pager-wc> instances pointing at the same target stay in sync via paged:change; a target inserted later is picked up.",
    "attributes": [
      {
        "name": "target",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "CSS selector for the [data-paged] container (preferred form). Only an element carrying data-paged counts; resolution is retried when a paged:change fires and on click."
      },
      {
        "name": "for",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "ID of the target container (HTML-form-style alternative to target)."
      },
      {
        "name": "data-style",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "numbered",
          "prev-next",
          "load-more"
        ],
        "default": "numbered",
        "description": "Control style. load-more needs a progressive target (data-paged-style=\"load-more\" on the container, plus data-paged-controls=\"none\" to drop its own button). Infinite is intentionally unsupported — a sentinel pattern doesn't make sense for decoupled controls."
      },
      {
        "name": "data-label-nav",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Pagination",
        "description": "Accessible name of the rendered <nav> landmark. Give top and bottom pagers distinct names."
      },
      {
        "name": "data-label-prev",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Previous",
        "description": "Previous button text."
      },
      {
        "name": "data-label-next",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Next",
        "description": "Next button text."
      },
      {
        "name": "data-label-page",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Page {page}",
        "description": "Accessible name of each page-number button; {page} is the number."
      },
      {
        "name": "data-label-status",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Page {page} of {total}",
        "description": "prev-next status text (polite live region); {page} and {total}."
      },
      {
        "name": "data-label-load-more",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Load more ({n})",
        "description": "Load-more button text; {n} is the number of items still hidden."
      },
      {
        "name": "data-label-no-more",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "No more",
        "description": "Load-more button text once every item is shown."
      },
      {
        "name": "data-label-missing",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "No paginated target found",
        "description": "Visible note rendered while no [data-paged] target resolves (not a live region)."
      }
    ],
    "events": [
      {
        "name": "pager-wc:navigate",
        "detail": "{ page }",
        "description": "Bubbles from the pager before it dispatches paged:goto on the target. Fired for page navigations only (numbered / prev-next), not for load-more. Not cancelable. Use for analytics / scroll-restore hooks; listen for paged:change on the target for after-navigation work."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
  },
  "poll-wc": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "poll-wc",
    "type": "web-component",
    "description": "Voting + live results. Per-option counts, visible percentages and own-vote flag, single or multi-choice, optional closed (results-only) state. Presentational (reaction-bar pattern): emits poll-wc:vote, marks the option data-pending until the author calls setCount after the server confirms. Can enhance a native <form><fieldset> of radios/checkboxes as a no-JS fallback.",
    "attributes": [
      {
        "name": "aria-label",
        "kind": "aria",
        "purpose": "config",
        "type": "string",
        "description": "Group label when there is no question slot; moved onto the option group (the host has no role)"
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
        "description": "Hide per-option counts, percentages and bars, visually and from assistive tech"
      },
      {
        "name": "disabled",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Disable voting; observed, so toggling it updates aria-disabled immediately"
      },
      {
        "name": "data-label-vote",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "vote",
        "description": "Singular count noun (Intl.PluralRules \"one\")"
      },
      {
        "name": "data-label-votes",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "votes",
        "description": "Count noun for other plural categories"
      },
      {
        "name": "data-label-your-choice",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "your choice",
        "description": "Appended to the accessible name of the user's own option"
      },
      {
        "name": "data-label-closed",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "closed",
        "description": "Appended to the total when data-closed is set"
      },
      {
        "name": "data-label-poll",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Poll",
        "description": "Fallback group name with no question and no aria-label"
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
        "description": "Update a single option after the server confirms (or roll back on failure); clears data-pending"
      },
      {
        "name": "setCounts",
        "type": "(counts, opts?) => void",
        "description": "Bulk-update counts; opts.mine accepts a string or string[]; clears every data-pending"
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
      },
      {
        "name": "data-pending",
        "on": "button",
        "type": "boolean",
        "description": "Output: a vote for this option is in flight; further clicks are ignored until setCount/setCounts"
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
    "description": "General-purpose popover container with CSS Anchor Positioning. Wraps the native Popover API, binds an anchor element (appending to its anchor-name list), and re-asserts display:none under VB's cascade layers. Trigger via the standard popovertarget attribute. The host has no role: authors supply the semantics.",
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
        "description": "Popover type: 'auto' (default, light-dismiss + Escape, closes other auto popovers), 'manual' (script-only), 'hint' (light-dismiss without closing open auto popovers; falls back to 'auto' where popover=\"hint\" is unsupported). Hover opening is not wired (use interestfor or tool-tip). Changes after upgrade re-apply the popover attribute; an authored popover attribute wins at upgrade.",
        "default": "auto"
      },
      {
        "name": "data-anchor",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID (or CSS selector) of the anchor element to position against. If omitted, the component uses the first element whose popovertarget points at this pop-over. Changes after upgrade re-wire the anchor."
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
        "description": "Where to place the popover relative to the anchor; -start/-end are logical (mirror in RTL). Flips to the opposite side instead of overflowing the viewport. Default: 'bottom'.",
        "default": "bottom"
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
        "description": "Gap between popover and anchor, mapped to --size-* tokens. Default: 'xs'.",
        "default": "xs"
      },
      {
        "name": "data-anchor-name",
        "kind": "data",
        "purpose": "output-state",
        "type": "string",
        "direction": "output",
        "description": "Set by the runtime when an anchor is bound with CSS Anchor Positioning: the dashed-ident appended to the anchor's anchor-name and used as this host's position-anchor. Absent when there is no anchor or no anchor-positioning support."
      }
    ],
    "events": [
      {
        "name": "pop-over:show",
        "detail": "{ state: 'open' }",
        "description": "Fired (bubbles, composed) on beforetoggle as the popover opens, whether by popovertarget, show() or showPopover()."
      },
      {
        "name": "pop-over:hide",
        "detail": "{ state: 'closed' }",
        "description": "Fired (bubbles, composed) on beforetoggle as the popover closes, including light-dismiss and Escape."
      }
    ],
    "properties": [
      {
        "name": "open",
        "type": "boolean",
        "description": "Read-only. True while the popover is open (:popover-open)."
      }
    ],
    "methods": [
      {
        "name": "show()",
        "description": "Open the popover (no-op if already open)."
      },
      {
        "name": "hide()",
        "description": "Close the popover (no-op if already closed)."
      },
      {
        "name": "toggle()",
        "description": "Open if closed, close if open."
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
    "description": "Aggregated most-visited lens. Reads /api/analytics/popular (or any { pages: [{ url, title?, views }] } endpoint), enriches titles/provenance from pages.json, and reflects loading/ready/empty/unavailable state.",
    "attributes": [
      {
        "name": "analytics-src",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "/api/analytics/popular",
        "description": "Popularity endpoint URL. Re-fetches when changed."
      },
      {
        "name": "data-meta-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Optional pages.json URL; fills missing titles and adds the provenance chip. Fetched in parallel with the endpoint."
      },
      {
        "name": "data-lens-src",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Shared lens pages.json URL (forwarded by content-lens); metadata fallback when data-meta-src is unset. Never used as the endpoint."
      },
      {
        "name": "limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": 10,
        "description": "Max entries shown (clamped to at least 1)."
      },
      {
        "name": "window",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Time window forwarded as ?window=. The VB endpoint accepts 24h, 7d (default) and 30d."
      },
      {
        "name": "data-heading-level",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": 2,
        "description": "Heading level 1-6 for the panel heading; 0 renders no heading (e.g. inside content-lens, which already labels the lens)."
      },
      {
        "name": "data-label-heading",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Most visited",
        "description": "Heading text."
      },
      {
        "name": "data-label-view",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "view",
        "description": "Count noun used when Intl.PluralRules selects \"one\"."
      },
      {
        "name": "data-label-views",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "views",
        "description": "Count noun for every other plural category."
      },
      {
        "name": "data-label-unavailable",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Popularity data is unavailable right now.",
        "description": "Message when the endpoint fails (internal error detail is never shown)."
      },
      {
        "name": "data-label-empty",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Not enough data yet to surface most-visited pages.",
        "description": "Message when the endpoint returns no usable pages."
      },
      {
        "name": "data-state",
        "kind": "data",
        "purpose": "output-state",
        "type": "enum",
        "values": [
          "loading",
          "ready",
          "empty",
          "unavailable"
        ],
        "direction": "output",
        "description": "Reflected load state; aria-busy=\"true\" accompanies loading. Hide the panel with popularity-index[data-state=\"unavailable\"] { display: none }."
      },
      {
        "name": "data-error",
        "kind": "data",
        "purpose": "output-state",
        "type": "string",
        "direction": "output",
        "public": false,
        "description": "Internal error detail for debugging when data-state=\"unavailable\" (never rendered)."
      }
    ],
    "events": [
      {
        "name": "popularity-index:state",
        "detail": "{ state }",
        "description": "Fires when a load settles (ready, empty or unavailable)."
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
        "description": "Adds a checkbox that prints without VB print styles (sets data-print-raw on <html> for the print). The host becomes a labelled role=\"group\""
      },
      {
        "name": "label",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "Print this page",
        "description": "Button label / accessible name. Falls back to the authored text content, then \"Print this page\""
      },
      {
        "name": "variant",
        "kind": "host-api",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "icon",
          "label",
          "icon-label"
        ],
        "default": "icon",
        "description": "icon: printer icon only (label becomes aria-label); label: text only; icon-label: icon and visible text"
      },
      {
        "name": "data-label-raw",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Print without VB styles",
        "description": "Text of the raw-toggle checkbox"
      }
    ],
    "childAttributes": [],
    "structure": []
  },
  "progress-tracker": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "progress-tracker",
    "type": "web-component",
    "description": "Multi-step progress bar for wizards / checkout / onboarding flows. Distinct from <slide-accept> (slide-to-confirm). Author writes a native <ol> of <li> steps inside the element; the component decorates each with circle + connector + status (complete | current | upcoming | error) and visually hidden status text. With data-clickable, completed steps become native buttons.",
    "attributes": [
      {
        "name": "data-current",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Active step: matched against data-step ids first, then as a 1-based index. Defaults to the first step."
      },
      {
        "name": "data-clickable",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Completed steps render their label inside a native <button> (keyboard and pointer) that navigates back. The current and upcoming steps are not activatable."
      },
      {
        "name": "data-direction",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "horizontal",
          "vertical"
        ],
        "default": "horizontal",
        "description": "vertical stacks the steps with a vertical connector (narrow screens, long labels, 5+ steps)."
      },
      {
        "name": "data-label-list",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Progress",
        "description": "Accessible name set on the <ol> when it has no aria-label / aria-labelledby of its own."
      },
      {
        "name": "data-label-step",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Step {n} of {total}:",
        "description": "Visually hidden position prefix read before each label; {n} and {total}. Empty string removes it."
      },
      {
        "name": "data-label-complete",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "(completed)",
        "description": "Visually hidden status text for completed steps."
      },
      {
        "name": "data-label-current",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "",
        "description": "Visually hidden status text for the current step (empty by default: aria-current=\"step\" already conveys it)."
      },
      {
        "name": "data-label-upcoming",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "(not started)",
        "description": "Visually hidden status text for upcoming steps."
      },
      {
        "name": "data-label-error",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "(error)",
        "description": "Visually hidden status text for errored steps."
      }
    ],
    "events": [
      {
        "name": "progress-tracker:step",
        "detail": "{ step, previousStep, source: 'attr'|'click' }",
        "description": "Bubbles when data-current changes after upgrade (source 'attr') or a completed step is activated in data-clickable mode (source 'click', one event only). Not fired on upgrade or when the current step is activated."
      }
    ],
    "childAttributes": [
      {
        "name": "data-step",
        "on": "li",
        "type": "string",
        "description": "Stable step id (any string; defaults to the 1-based position). data-current matches it before trying an index, so numeric ids like \"2024\" are safe."
      },
      {
        "name": "data-error",
        "on": "li",
        "type": "boolean",
        "description": "Marks this step as errored regardless of position."
      },
      {
        "name": "data-status",
        "on": "li",
        "type": "enum",
        "values": [
          "complete",
          "current",
          "upcoming",
          "error"
        ],
        "description": "Set by the component; style hook."
      },
      {
        "name": "aria-current",
        "on": "li",
        "type": "string",
        "description": "Set by the component to \"step\" on the current step."
      }
    ],
    "structure": [
      {
        "element": "ol",
        "description": "Required native ordered list of steps (renders as a plain numbered list without JS)."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "ol"
      ]
    },
    "cssProperties": [
      {
        "name": "--pt-circle-size",
        "description": "Diameter of the step circle (default 1.75rem)."
      },
      {
        "name": "--pt-line-thickness",
        "description": "Connector and circle border thickness (default 2px)."
      },
      {
        "name": "--pt-color-complete",
        "description": "Fill / connector colour for completed steps (default --color-success)."
      },
      {
        "name": "--pt-color-current",
        "description": "Outline / ring colour for the active step (default --color-interactive)."
      },
      {
        "name": "--pt-color-upcoming",
        "description": "Outline / connector colour for upcoming steps (default --color-border)."
      },
      {
        "name": "--pt-color-error",
        "description": "Fill / connector colour for errored steps (default --color-error)."
      },
      {
        "name": "--pt-color-text-on-fill",
        "description": "Glyph colour on filled (complete / error) circles (default --color-text-on-interactive-auto)."
      }
    ]
  },
  "qr-code": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "qr-code",
    "type": "web-component",
    "description": "QR code generator: black-on-white canvas with quiet zone, author children kept as the caption",
    "attributes": [
      {
        "name": "value",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "The text/URL to encode. Falls back to the element's original text content. Reactive; removing it falls back to the text again."
      },
      {
        "name": "size",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": "200",
        "description": "Edge of the drawn box in CSS pixels, quiet zone included. Modules are a whole number of device pixels. Reactive."
      },
      {
        "name": "color",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "#000",
        "description": "Module colour (any CSS colour). Opt-in; logs a console warning when the pair is inverted, low-contrast or translucent. Reactive."
      },
      {
        "name": "background",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "default": "#fff",
        "description": "Background colour, always painted, including the 4-module quiet zone. Reactive."
      },
      {
        "name": "error-correction",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "l",
          "m",
          "q",
          "h",
          "0",
          "1",
          "2",
          "3"
        ],
        "default": "m",
        "description": "Error-correction level: L (7%), M (15%, default), Q (25%), H (30%), or 0-3. Letters are case-insensitive (listed lower-case because html-validate matches enums lower-cased); other values warn and use M. Reactive."
      },
      {
        "name": "data-caption",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "visible"
        ],
        "description": "Show the caption (the element's children) under the code. By default it is visually hidden but read by screen readers, and shown while a link inside it has focus."
      },
      {
        "name": "data-label-prefix",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "QR code",
        "description": "Accessible name of the canvas (role=img). The value itself is read from the caption, so it is not announced twice."
      },
      {
        "name": "data-label-copied",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "QR code copied",
        "description": "Screen-reader announcement after copy() succeeds."
      },
      {
        "name": "data-error",
        "kind": "data",
        "purpose": "output-state",
        "direction": "output",
        "type": "enum",
        "values": [
          "capacity",
          "encoding"
        ],
        "description": "Set when no code could be drawn (the text is longer than the level holds, or cannot be encoded). The caption is then shown."
      }
    ],
    "childAttributes": [],
    "structure": [],
    "events": [
      {
        "name": "qr-code:error",
        "detail": "{ reason: 'capacity' | 'encoding', value, errorCorrection: 'L' | 'M' | 'Q' | 'H', message }",
        "description": "Fired when the value cannot be encoded. No code is drawn and the caption (fallback) stays visible."
      },
      {
        "name": "qr-code:upgraded",
        "description": "Fired once the element has upgraded (canvas and caption in place)."
      }
    ],
    "properties": [
      {
        "name": "value",
        "type": "string",
        "description": "The encoded text. Setting it sets the value attribute; '' or null removes it."
      }
    ],
    "methods": [
      {
        "name": "toDataURL(type?)",
        "returns": "string",
        "description": "Returns the code as a data URL (default image/png): opaque, quiet zone included. '' when no code is drawn."
      },
      {
        "name": "copy(options?)",
        "returns": "Promise<boolean>",
        "description": "Copies the code to the clipboard as text/plain (the encoded value) + image/png. Falls back to text-only without ClipboardItem support. options.button gets data-state=\"copied\" and a copy event. Resolves false when no code is drawn."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
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
        "description": "Toolbar label (default: data-label-toolbar, then \"Reactions\"). Also names the palette group."
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
        "name": "data-label-toolbar",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Default toolbar label when no aria-label is authored (default \"Reactions\")"
      },
      {
        "name": "data-label-dialog",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "aria-label of the palette dialog (default \"Choose a reaction\")"
      },
      {
        "name": "data-label-count-one",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Count phrase in chip names for the Intl.PluralRules \"one\" category; {count} is replaced by the Intl.NumberFormat count (default \"{count} reaction\"). Any CLDR category works: data-label-count-zero, -two, -few, -many."
      },
      {
        "name": "data-label-count-other",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "Count phrase for every category without its own data-label-count-* (default \"{count} reactions\"). Locale comes from the closest [lang]."
      },
      {
        "name": "data-disabled",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Read-only mode, observed: chips get aria-disabled and do not toggle, the trigger is disabled and leaves the roving tab order, an open palette closes"
      }
    ],
    "events": [
      {
        "name": "reaction-bar:toggle",
        "description": "Fires when a chip or palette option is clicked. detail: { reaction, action: 'add'|'remove', count, mine } — count and mine are the values BEFORE the toggle. The chip is then data-pending until setCount() is called for that reaction."
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
        "description": "Whether the current user has this reaction (exposed as aria-pressed)"
      },
      {
        "name": "data-label",
        "on": "button",
        "type": "string",
        "description": "Accessible name of the reaction (e.g. \"Thumbs up\"), on chips and palette buttons; an authored aria-label works too. Falls back to the emoji."
      },
      {
        "name": "data-pending",
        "on": "button",
        "type": "boolean",
        "description": "Output: a toggle for this chip is in flight (also aria-busy); further clicks are ignored until setCount()"
      },
      {
        "name": "data-palette",
        "on": "template",
        "type": "boolean",
        "description": "Marks a <template> child as the available-reactions palette"
      }
    ],
    "structure": [],
    "methods": [
      {
        "name": "setCount(reaction, count, { mine })",
        "description": "Update a chip after the server confirms (call it on failure too, with the old values, to roll back). Clears the pending state, creates the chip from the palette template button (keeping its data-label) if missing, and removes the chip at count 0 — focus moves to a neighbour if the chip had it."
      },
      {
        "name": "openPalette()",
        "description": "Open the palette popover (no-op while data-disabled)"
      },
      {
        "name": "closePalette()",
        "description": "Close the palette popover"
      }
    ]
  },
  "reader-view": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "reader-view",
    "type": "web-component",
    "description": "Immersive reading shell with scroll and paged modes. Moves its children into a layout-columns surface with a chrome bar, page navigation, font and column controls.",
    "attributes": [
      {
        "name": "mode",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "scroll",
          "pages"
        ],
        "default": "scroll",
        "direction": "both",
        "description": "Reading mode. Observed and reflected. pages is a full-viewport overlay: the rest of the page is made inert, document scroll is locked, focus moves into the pager, Escape returns to scroll."
      },
      {
        "name": "columns",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "auto",
          "1",
          "2",
          "3"
        ],
        "default": "auto",
        "direction": "both",
        "description": "Column count in pages mode. Observed and reflected."
      },
      {
        "name": "font-controls",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "true",
          "false"
        ],
        "default": "true",
        "description": "Set to false to omit the font-size buttons from the default chrome."
      },
      {
        "name": "col-controls",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "true",
          "false"
        ],
        "default": "true",
        "description": "Set to false to omit the column picker from the default chrome."
      },
      {
        "name": "reader-title",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "Chrome bar title. Falls back to the first <h1>, then document.title."
      },
      {
        "name": "persist",
        "kind": "host-api",
        "purpose": "config",
        "type": "enum",
        "values": [
          "true",
          "false"
        ],
        "default": "true",
        "description": "Set to false to disable localStorage persistence of font size, columns (and mode with data-remember-mode)."
      },
      {
        "name": "storage-key",
        "kind": "host-api",
        "purpose": "config",
        "type": "string",
        "description": "localStorage key. Defaults to vb-reader:<location.pathname>, plus #<id> when the element has an id."
      },
      {
        "name": "data-remember-mode",
        "kind": "data",
        "purpose": "config",
        "type": "boolean",
        "description": "Opt in to restoring the persisted mode (including pages) on load. Without it only font size and columns are restored; an authored mode attribute always wins."
      },
      {
        "name": "data-label-kicker",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Reader",
        "description": "Override the \"Reader\" string."
      },
      {
        "name": "data-label-controls",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Reading controls",
        "description": "Override the \"Reading controls\" string."
      },
      {
        "name": "data-label-mode-group",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Reading mode",
        "description": "Override the \"Reading mode\" string."
      },
      {
        "name": "data-label-mode",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Mode",
        "description": "Override the \"Mode\" string."
      },
      {
        "name": "data-label-scroll",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Scroll",
        "description": "Override the \"Scroll\" string."
      },
      {
        "name": "data-label-pages",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Pages",
        "description": "Override the \"Pages\" string."
      },
      {
        "name": "data-label-font-group",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Font size",
        "description": "Override the \"Font size\" string."
      },
      {
        "name": "data-label-type",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Type",
        "description": "Override the \"Type\" string."
      },
      {
        "name": "data-label-font-decrease",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Decrease font size",
        "description": "Override the \"Decrease font size\" string."
      },
      {
        "name": "data-label-font-increase",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Increase font size",
        "description": "Override the \"Increase font size\" string."
      },
      {
        "name": "data-label-columns-group",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Page columns",
        "description": "Override the \"Page columns\" string."
      },
      {
        "name": "data-label-cols",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Cols",
        "description": "Override the \"Cols\" string."
      },
      {
        "name": "data-label-auto",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Auto",
        "description": "Override the \"Auto\" string."
      },
      {
        "name": "data-label-column-auto",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Auto columns",
        "description": "Override the \"Auto columns\" string."
      },
      {
        "name": "data-label-column-1",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "1 column",
        "description": "Override the \"1 column\" string."
      },
      {
        "name": "data-label-column-2",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "2 columns",
        "description": "Override the \"2 columns\" string."
      },
      {
        "name": "data-label-column-3",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "3 columns",
        "description": "Override the \"3 columns\" string."
      },
      {
        "name": "data-label-pages-region",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Article pages",
        "description": "Override the \"Article pages\" string."
      },
      {
        "name": "data-label-page-nav",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Page navigation",
        "description": "Override the \"Page navigation\" string."
      },
      {
        "name": "data-label-prev",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Previous page",
        "description": "Override the \"Previous page\" string."
      },
      {
        "name": "data-label-next",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Next page",
        "description": "Override the \"Next page\" string."
      },
      {
        "name": "data-label-page-indicator",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "{page} / {total}",
        "description": "Override the \"{page} / {total}\" string ({page} and {total} are replaced)."
      }
    ],
    "events": [
      {
        "name": "reader-view:mode",
        "detail": "{ mode: 'scroll' | 'pages' }",
        "description": "Mode changed (not fired for the initial mode on upgrade)."
      },
      {
        "name": "reader-view:page",
        "detail": "{ page: number, total: number }",
        "description": "Current page changed in pages mode (page is 1-based)."
      },
      {
        "name": "reader-view:font",
        "detail": "{ size: string, index: number }",
        "description": "Font size stepped up or down."
      }
    ],
    "slots": [
      {
        "name": "chrome",
        "description": "Replaces the default chrome bar. Wire controls with data-reader-action / data-reader-value / data-reader-output."
      }
    ],
    "cssProperties": [
      {
        "name": "--reader-view-z",
        "description": "z-index of the pages-mode overlay (default var(--z-overlay))."
      }
    ],
    "childAttributes": [
      {
        "name": "data-reader-action",
        "on": "button",
        "type": "enum",
        "values": [
          "toggle-mode",
          "set-mode-scroll",
          "set-mode-pages",
          "font-increase",
          "font-decrease",
          "set-columns",
          "prev-page",
          "next-page"
        ],
        "description": "Action wired by click delegation (default and slotted chrome)."
      },
      {
        "name": "data-reader-value",
        "on": "button",
        "type": "enum",
        "values": [
          "auto",
          "1",
          "2",
          "3"
        ],
        "description": "Column value for data-reader-action=\"set-columns\"."
      },
      {
        "name": "data-reader-output",
        "on": "output",
        "type": "enum",
        "values": [
          "page-indicator",
          "mode-label"
        ],
        "description": "Filled by the runtime with the page indicator text or the current mode label."
      },
      {
        "name": "aria-pressed",
        "on": "button",
        "type": "enum",
        "values": [
          "true",
          "false"
        ],
        "description": "Set by the runtime on set-mode-*, set-columns and toggle-mode buttons (runtime)."
      },
      {
        "name": "data-reader-state",
        "on": "button",
        "type": "enum",
        "values": [
          "active",
          ""
        ],
        "description": "Styling hook mirroring aria-pressed on mode and column buttons (runtime)."
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
  "reading-progress": {
    "$schema": "../../../schemas/api.schema.json",
    "element": "reading-progress",
    "type": "web-component",
    "description": "Decorative fixed-position scroll progress bar (CSS scroll-timeline for the document, JS for data-for targets).",
    "attributes": [
      {
        "name": "data-for",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "description": "ID of the element whose bounds define the progress range. Observed. If the element does not exist the bar tracks document scroll until it appears."
      },
      {
        "name": "data-position",
        "kind": "data",
        "purpose": "visual-variant",
        "type": "enum",
        "values": [
          "top",
          "bottom"
        ],
        "default": "top",
        "description": "Viewport edge the bar is anchored to."
      }
    ],
    "cssProperties": [
      {
        "name": "--reading-progress-color",
        "description": "Fill colour (default var(--color-accent)); Highlight in forced-colors mode."
      },
      {
        "name": "--reading-progress-height",
        "description": "Bar thickness (default 3px)."
      },
      {
        "name": "--reading-progress-offset",
        "description": "Distance from the anchored edge, e.g. a sticky header's height (default 0)."
      },
      {
        "name": "--reading-progress-z",
        "description": "z-index (default var(--z-sticky-header))."
      }
    ],
    "childAttributes": [],
    "structure": [
      {
        "element": "progress",
        "required": false,
        "description": "Optional SSR child; created when absent. Always aria-hidden: the bar is decorative."
      }
    ],
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
    "description": "Device-local reader history lens (localStorage, never sent or aggregated). Pages are recorded only when opted in with <meta name=\"vb:track-history\" content=\"on\"> or by this element's presence; <html data-vb-no-track> and <meta name=\"vb:no-track-history\"> opt out.",
    "attributes": [
      {
        "name": "limit",
        "kind": "host-api",
        "purpose": "config",
        "type": "number",
        "default": 25,
        "description": "Max page groups rendered. Storage itself is capped separately at 100 entries by the tracker."
      },
      {
        "name": "include-current",
        "kind": "host-api",
        "purpose": "config",
        "type": "boolean",
        "description": "Also list the page the reader is on (excluded by default)."
      },
      {
        "name": "data-heading-level",
        "kind": "data",
        "purpose": "config",
        "type": "number",
        "default": 2,
        "description": "Heading level 1-6 for the panel heading; 0 renders no heading (e.g. inside content-lens)."
      },
      {
        "name": "data-label-heading",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Recently visited",
        "description": "Heading text."
      },
      {
        "name": "data-label-explainer",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Stored on this device only. Never sent to a server.",
        "description": "Privacy note under the heading."
      },
      {
        "name": "data-label-pause",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Pause tracking",
        "description": "Pause toggle label (static; aria-pressed carries the state)."
      },
      {
        "name": "data-label-anchors",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Show anchor visits",
        "description": "Anchor-visits toggle label (static; aria-pressed carries the state)."
      },
      {
        "name": "data-label-clear",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Clear history",
        "description": "Clear button label."
      },
      {
        "name": "data-label-empty",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "No recently visited pages yet.",
        "description": "Message rendered when there is no history."
      },
      {
        "name": "data-label-anchor-one",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "anchor",
        "description": "Anchor count noun when Intl.PluralRules selects \"one\"."
      },
      {
        "name": "data-label-anchor-other",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "anchors",
        "description": "Anchor count noun for every other plural category."
      }
    ],
    "events": [
      {
        "name": "recently-visited:clear",
        "description": "Fires when the reader clears the local history."
      },
      {
        "name": "recently-visited:pause-toggle",
        "detail": "{ paused }",
        "description": "Fires when the reader pauses or resumes tracking."
      },
      {
        "name": "recently-visited:anchors-toggle",
        "detail": "{ showAnchors }",
        "description": "Fires when the reader shows or hides anchor visits."
      }
    ],
    "properties": [
      {
        "name": "entries",
        "type": "Array<{ url, hash, title, hashTitle, ts }>",
        "description": "Read-only. Stored history, most recent first; expired (30-day TTL), malformed and off-origin records are filtered out."
      }
    ],
    "htmlvalidate": {
      "flow": true,
      "permittedContent": []
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
      },
      {
        "name": "data-label-resize",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "Resize panels",
        "description": "Accessible name override for the divider (default \"Resize panels\")."
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
        "description": "First visible hour (0-23), or 'auto' to scan events. A fixed range grows to fit events outside it."
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
        "name": "data-label-continues",
        "kind": "data",
        "purpose": "config",
        "type": "string",
        "default": "continues after the visible hours",
        "description": "Text appended to the accessible name of a spanning event that runs past the last visible hour (localisation hook)."
      }
    ],
    "events": [
      {
        "name": "week-view:event-click",
        "description": "Fired when a calendar-event is clicked, or activated with Enter/Space while focused",
        "detail": "{ date, time, text, element, category, duration }"
      },
      {
        "name": "week-view:events-changed",
        "description": "Fired after the events property rebuilds the view",
        "detail": "{ events, source: 'property' }"
      }
    ],
    "properties": [
      {
        "name": "events",
        "type": "Array<{ date?, time, text, category?, duration? }>",
        "description": "Get the week's events as data, or assign an array to rebuild the table. time is HH:MM or a full ISO datetime (its date is used when date is omitted). Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour."
      }
    ],
    "methods": [
      {
        "name": "refresh()",
        "description": "Re-measure and re-position spanning events now (they also re-position automatically when the view resizes)"
      }
    ],
    "childAttributes": [
      {
        "name": "data-date",
        "on": "calendar-event",
        "type": "string",
        "description": "ISO date assigning this event to a day column (auto mode)"
      },
      {
        "name": "data-duration",
        "on": "calendar-event",
        "type": "string",
        "description": "Makes the event span hour rows. Durations (data-duration): 2h, 1.5h, 45m, 90m, 1h30m, bare minutes (60), ISO-8601 (PT1H30M); unparseable values fall back to 1 hour. Overlapping spans in one day column are laid out side by side."
      },
      {
        "name": "data-continues",
        "on": "calendar-event",
        "type": "boolean",
        "description": "Set by the component (not authored) on a spanning event clipped at the last visible hour."
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
    "htmlvalidate": {
      "flow": true,
      "permittedContent": [
        "@flow"
      ]
    }
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
