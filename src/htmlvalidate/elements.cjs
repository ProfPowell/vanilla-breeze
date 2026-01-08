module.exports = {
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

  "x-prose": {
    flow: true,
    permittedContent: ["@flow"]
  },

  "x-frame": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-ratio": {}
    }
  },

  "x-reel": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-gap": {
        enum: ["none", "xs", "s", "m", "l", "xl"]
      },
      "data-item-width": {}
    }
  },

  "tabs-wc": {
    flow: true,
    permittedContent: ["details"],
    attributes: {
      "aria-label": {}
    }
  },

  "accordion-wc": {
    flow: true,
    permittedContent: ["details"],
    attributes: {
      "data-single": {
        boolean: true
      },
      "data-bordered": {
        boolean: true
      },
      "data-compact": {
        boolean: true
      }
    }
  },

  "dialog-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-size": {
        enum: ["s", "m", "l", "full"]
      },
      "data-no-backdrop-close": {
        boolean: true
      },
      "data-no-esc-close": {
        boolean: true
      }
    }
  },

  "tooltip-wc": {
    flow: true,
    permittedContent: ["@flow", "template"],
    attributes: {
      "data-position": {
        enum: ["top", "bottom", "left", "right"]
      },
      "data-delay": {}
    }
  },

  "toast-wc": {
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

  "dropdown-wc": {
    flow: true,
    permittedContent: ["@flow"],
    attributes: {
      "data-position": {
        enum: ["bottom-start", "bottom-end", "top-start", "top-end"]
      }
    }
  },

  "footnotes-wc": {
    flow: true,
    permittedContent: ["ol"],
    attributes: {
      "data-back-label": {}
    }
  },

  "foot-note": {
    phrasing: true,
    permittedContent: ["@phrasing"]
  }
};
