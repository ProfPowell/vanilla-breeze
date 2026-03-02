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
        "definedTags": ["attr"]
      }],
      "jsdoc/check-types": "warn",
      "jsdoc/empty-tags": "warn",

      // Require JSDoc on exported functions (warn — doesn't block CI)
      "jsdoc/require-param": ["warn", { checkSetters: false }],
      "jsdoc/require-returns": ["warn", { forceRequireReturn: false }],
    }
  }
];
