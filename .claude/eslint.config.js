export default [
  {
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
      }]
    }
  }
];
