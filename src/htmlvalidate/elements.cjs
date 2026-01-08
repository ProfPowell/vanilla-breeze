module.exports = {
  "x-stack": {
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

  "x-card": {
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

  "x-grid": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-min": {},
      "data-gap": {
        enum: ["none", "xs", "s", "m", "l", "xl"]
      }
    }
  },

  "x-cluster": {
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

  "x-prose": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "x-center": {
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

  "x-sidebar": {
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

  "x-tabs": {
    flow: true,
    permittedContent: ["details"],
    attributes: {
      "aria-label": {}
    }
  },

  "x-footnotes": {
    flow: true,
    permittedContent: ["ol"],
    attributes: {
      "data-back-label": {}
    }
  },

  "x-fnref": {
    phrasing: true,
    permittedContent: ["@phrasing"]
  }
};
