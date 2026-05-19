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
};
