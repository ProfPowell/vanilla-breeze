/**
 * html-validate plugin for Vanilla Breeze (export: `vanilla-breeze/html-validate`).
 *
 * In .htmlvalidate.json:
 *
 *   {
 *     "plugins": ["vanilla-breeze/html-validate"],
 *     "extends": ["html-validate:recommended", "vanilla-breeze:recommended"]
 *   }
 *
 * `recommended` loads the element metadata for every Vanilla Breeze element
 * (allowed attributes and values, permitted content) and turns on the
 * convention rules in rules.js. `vb-check` (bin/vb-check.js) runs this
 * preset without any configuration file.
 */
import { createRequire } from 'node:module';
import { rules } from './rules.js';

const require = createRequire(import.meta.url);
const elements = require('./elements.cjs');
const overrides = require('./elements-overrides.cjs');

export default {
  name: 'vanilla-breeze',

  rules,

  configs: {
    recommended: {
      elements: ['html5', elements, overrides],
      rules: {
        // An element or value that is not in the metadata does not exist.
        'no-unknown-elements': 'error',
        'attribute-allowed-values': 'error',
        'element-permitted-content': 'error',
        'element-required-attributes': 'error',
        // A <dialog> heading continues the page outline; it need not restart at <h1>.
        'heading-level': ['error', { sectioningRoots: [] }],
        'prefer-native-element': 'error',

        'vb/no-div': 'error',
        'vb/no-inline-style': 'error',
        'vb/icon-wc-required': 'error',
        'vb/layout-attribute': 'error',
        'vb/known-data-attribute': 'warn',
        'vb/no-class-for-state': 'warn',
        'vb/use-form-field': 'warn',

        // Replaced by vb/no-inline-style, which knows the layout escape hatches.
        'no-inline-style': 'off',
        // Formatting and deployment concerns, not Vanilla Breeze conventions.
        'void-style': 'off',
        'doctype-style': 'off',
        'no-trailing-whitespace': 'off',
        'no-implicit-input-type': 'off',
        'no-implicit-button-type': 'off',
        // Idioms Vanilla Breeze documents: a named list (<ol aria-label>) and
        // a muted background <video autoplay> in a hero.
        'aria-label-misuse': ['error', { allowAnyNamable: true }],
        'no-autoplay': 'off',
        'require-sri': 'off',
        'no-raw-characters': ['error', { relaxed: true }],
        'form-dup-name': ['error', { shared: ['radio', 'submit', 'button', 'reset', 'checkbox'] }],
      },
    },
  },
};
