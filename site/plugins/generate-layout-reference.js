/**
 * @file generate-layout-reference.js
 * @description Per-file plugin that replaces the layout-reference markers on
 * /docs/attributes/data-layout/ with tables generated at build time from the
 * layout CSS (via site/data/layoutReference.js, which reads
 * scripts/quality/layout-vocabulary.js and the layout api.json manifests):
 *
 *   {{ layoutValueTable("twin") }}       data-layout values with an element twin
 *   {{ layoutValueTable("attribute") }}  attribute-only data-layout values
 *   {{ layoutElementOnlyTable() }}       layouts with no data-layout form
 *   {{ layoutModifierTable() }}          every data-layout-* modifier, anchored rows
 *   {{ layoutGeneralTable() }}           area / order / sticky / bleed / container / measure / scroll-hint
 *
 * No client JS: the output is static HTML. Must run before auto-link-glossary
 * (same reason as generate-api-tables).
 *
 * Only the plugin class is exported: Cook instantiates the module's first
 * export key.
 */
import {
  renderValueTable,
  renderElementOnlyTable,
  renderModifierTable,
  renderGeneralTable,
} from '../data/layoutReference.js';

const MARKER = /\{\{\s*(layoutValueTable|layoutElementOnlyTable|layoutModifierTable|layoutGeneralTable)\s*\(\s*(?:"([a-z]+)")?\s*\)\s*\}\}/g;

export class GenerateLayoutReference {
  constructor({ file }) {
    this.file = file;
  }

  async init() {
    if (!this.file?.src?.includes('{{ layout')) return;
    this.file.src = this.file.src.replace(MARKER, (match, name, arg) => {
      switch (name) {
        case 'layoutValueTable':
          return arg === 'twin' || arg === 'attribute' ? renderValueTable(arg) : match;
        case 'layoutElementOnlyTable':
          return renderElementOnlyTable();
        case 'layoutModifierTable':
          return renderModifierTable();
        case 'layoutGeneralTable':
          return renderGeneralTable();
        default:
          return match;
      }
    });
  }
}
