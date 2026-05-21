// Manual element metadata overrides — loaded after the generated
// elements.cjs. Put rule-spec adjustments here that don't belong in
// per-component api.json manifests.

module.exports = {
  // Recognize VB's <dl-item> custom element as a valid wrapper for
  // <dt> and <dd>. The base HTML rule only allows <dl> / <dl><div>
  // ancestors; <dl-item> is documented as a standalone definition-
  // list entry that can be used without an enclosing <dl>.
  "dt": {
    inherit: "dt",
    requiredAncestors: ["dl > dt", "dl > div > dt", "dl-item > dt"],
  },
  "dd": {
    inherit: "dd",
    requiredAncestors: ["dl > dd", "dl > div > dd", "dl-item > dd"],
  },

  // <li> per spec requires <ul>/<ol>/<menu>/<template> parent, but VB's
  // <progress-tracker> uses <li> children as wizard steps (the documented
  // API). Widen the allowed parents to include <progress-tracker>.
  "li": {
    inherit: "li",
    requiredAncestors: ["ul > li", "ol > li", "menu > li", "template > li", "progress-tracker > li"],
  },

  // Customizable-select proposal — Chrome and WebKit ship this; html-
  // validate's base lib still treats <select>/<option> as their pre-2024
  // selves. The proposal allows <button> inside <select> (custom trigger)
  // and arbitrary phrasing content inside <option> (rich labels).
  "select": {
    inherit: "select",
    permittedContent: ["option", "optgroup", "hr", "@script", "button", "selectedcontent"],
  },
  "option": {
    inherit: "option",
    permittedContent: ["@phrasing", "span", "div"],
  },

  // <output> per spec only accepts phrasing, but VB feedback demos use
  // it as a labeled status region containing icon + heading + prose.
  // Widen to @flow so the feedback pattern lints cleanly while
  // preserving the role="status"/"alert" semantics that drive ATs.
  "output": {
    inherit: "output",
    permittedContent: ["@flow"],
  },

  // brand-mark is content-model flow per its manifest, but demos also
  // place it inside <p> (phrasing-only). Declare it as both flow and
  // phrasing so it can appear inline.
  "brand-mark": {
    inherit: "brand-mark",
    flow: true,
    phrasing: true,
  },

  // layout-cluster is technically flow but VB demos use it inside
  // <button>/<summary> for icon-text-icon arrangements. Mark phrasing
  // too so it can appear in phrasing contexts.
  "layout-cluster": {
    inherit: "layout-cluster",
    flow: true,
    phrasing: true,
  },

  // <layout-badge data-color="..."> — the generated elements.cjs only lists
  // primary/success/warning/danger/info. VB themes also expose brand,
  // secondary, accent, error and the demos showcase all of them. Widen the
  // enum to match the full theme color token set.
  "layout-badge": {
    inherit: "layout-badge",
    attributes: {
      "data-color": { enum: ["primary", "secondary", "accent", "brand", "success", "warning", "danger", "error", "info"] },
    },
  },

  // <combo-box filter="..."> — html-validate's enum matcher is case-
  // insensitive for plain strings, so "startsWith" fails against
  // ["contains","startsWith"]. Use a regex to preserve the camelCase.
  "combo-box": {
    inherit: "combo-box",
    attributes: {
      "filter": { enum: [/^(contains|startsWith)$/] },
    },
  },

  // Customizable-select <selectedcontent> proposal — Chrome+WebKit ship
  // this; the html5 lib doesn't know the tag yet.
  "selectedcontent": { flow: true, phrasing: true, permittedContent: ["@phrasing"] },

  // VB elements referenced by demos but without manifest sources yet.
  // Permit them as generic flow containers so lint can validate
  // surrounding markup. When real manifests land, the generator-emitted
  // entry in elements.cjs will take precedence.
  "tour-step":       { flow: true, permittedContent: ["@flow"] },
  "map-area":        { flow: true, permittedContent: ["@flow"] },
  "screen-saver":    { flow: true, permittedContent: ["@flow"] },
  "terminal-window": { flow: true, permittedContent: ["@flow"] },
  "pdf-viewer":      { flow: true, permittedContent: ["@flow"] },
  "image-editor":    { flow: true, permittedContent: ["@flow"] },
  "browser-console": { flow: true, permittedContent: ["@flow"] },
  "code-playground": { flow: true, permittedContent: ["@flow"] },
  "epub-reader":     { flow: true, permittedContent: ["@flow"] },

  // CSS-only custom elements (style + structure, no JS logic, no manifest).
  "token-swatch":    { flow: true, phrasing: true, permittedContent: ["@phrasing"] },
  "layout-columns":  { flow: true, permittedContent: ["@flow"] },
  "layout-canvas":   { flow: true, permittedContent: ["@flow"] },
  "layout-specimen": { flow: true, permittedContent: ["@flow"] },
};
