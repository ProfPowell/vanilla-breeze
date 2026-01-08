import elements from "./elements.js";

export default {
  name: "vanilla-breeze",

  configs: {
    recommended: {
      rules: {
        "no-unknown-elements": "error",
        "element-permitted-content": "error",
        "element-required-attributes": "error",
        "attribute-allowed-values": "error"
      }
    }
  },

  elementSchema: elements
};
