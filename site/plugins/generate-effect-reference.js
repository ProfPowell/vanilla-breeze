/**
 * @file generate-effect-reference.js
 * @description Per-file plugin that replaces the effect-reference markers on
 * /docs/attributes/data-effect/ with tables generated at build time from the
 * effect CSS and JS (via site/data/effectReference.js):
 *
 *   {{ effectCatalogue() }}        every data-effect value: slot, JS, bundles
 *   {{ effectOptions("name") }}    one effect's bundles, classes and custom properties
 *
 * No client JS: the output is static HTML. Runs before auto-link-glossary
 * (same reason as generate-api-tables).
 *
 * Only the plugin class is exported: Cook instantiates the module's first
 * export key.
 */
import { renderCatalogue, renderOptions } from '../data/effectReference.js';

const MARKER = /\{\{\s*(effectCatalogue|effectOptions)\s*\(\s*(?:"([a-z0-9-]+)")?\s*\)\s*\}\}/g;

export class GenerateEffectReference {
  constructor({ file }) {
    this.file = file;
  }

  async init() {
    if (!this.file?.src?.includes('{{ effect')) return;
    this.file.src = this.file.src.replace(MARKER, (match, name, arg) => {
      if (name === 'effectCatalogue') return renderCatalogue();
      if (name === 'effectOptions' && arg) return renderOptions(arg);
      return match;
    });
  }
}
