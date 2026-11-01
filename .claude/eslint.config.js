import jsdoc from "eslint-plugin-jsdoc";

export default [
  {
    plugins: { jsdoc },
    rules: {
      "no-var": "error",
      "no-restricted-exports": ["error", {
        "restrictDefaultExports": {
          "direct": true,
          "named": false,
          "defaultFrom": false,
          "namedFrom": false,
          "namespaceFrom": false
        }
      }],

      // JSDoc quality rules — complement tsc --noEmit (which catches type errors)
      "jsdoc/check-param-names": "warn",
      "jsdoc/check-tag-names": ["warn", {
        "definedTags": ["attr", "element"]
      }],
      "jsdoc/check-types": "warn",
      "jsdoc/empty-tags": "warn",

      // Completeness (vanilla-breeze-57ec). A comment that documents some
      // params must document all of them; a description-only comment on an
      // internal helper is fine (tsc already checks the types that are
      // written). Exported functions must state what they return.
      // lint:js runs with --max-warnings 0, so these block CI.
      "jsdoc/require-param": ["warn", { checkSetters: false, ignoreWhenAllParamsMissing: true }],
      "jsdoc/require-returns": ["warn", { forceRequireReturn: false, publicOnly: true }],
    }
  }
];
