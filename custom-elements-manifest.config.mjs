/**
 * CEM Analyzer config — Proof of Concept
 *
 * Custom plugins:
 * 1. Resolve registerComponent('tag-name', Class) to associate tags
 * 2. Hoist file-level JSDoc (@attr, @fires, description) to the class
 */

import { readFileSync } from 'node:fs';

/**
 * VB components have their JSDoc block at the top of the file, above imports,
 * not directly above the class. This plugin hoists that doc block to the class.
 */
function hoistFileJsdocPlugin() {
  return {
    name: 'vb-hoist-file-jsdoc',
    moduleLinkPhase({ moduleDoc }) {
      // Read the source file to get the top-level JSDoc block
      let sourceText;
      try {
        sourceText = readFileSync(moduleDoc.path, 'utf8');
      } catch { return; }
      const jsdocMatch = sourceText.match(/\/\*\*\s*\n([\s\S]*?)\*\//);
      if (!jsdocMatch) return;

      const jsdocText = jsdocMatch[1];

      // Extract description (first non-tag lines after the component name line)
      const lines = jsdocText.split('\n').map((l) => l.replace(/^\s*\*\s?/, ''));
      const descLines = [];
      let pastFirstLine = false;
      for (const line of lines) {
        if (!pastFirstLine) {
          pastFirstLine = true; // skip component name line
          continue;
        }
        if (line.startsWith('@')) break;
        if (line.trim() === '' && descLines.length === 0) continue;
        descLines.push(line);
      }
      const description = descLines.join('\n').trim();

      // Extract @attr tags
      const attrRegex = /@attr\s+\{(\w+)\}\s+(\S+)\s*-?\s*(.*)/g;
      const attrs = [];
      let match;
      while ((match = attrRegex.exec(jsdocText)) !== null) {
        attrs.push({
          name: match[2].trim(),
          type: { text: match[1] },
          description: match[3].trim(),
          fieldName: match[2].trim(),
        });
      }

      // Extract @fires tags
      const firesRegex = /@fires\s+(\S+)\s*-?\s*(.*)/g;
      const events = [];
      while ((match = firesRegex.exec(jsdocText)) !== null) {
        events.push({
          name: match[1].trim(),
          type: { text: 'CustomEvent' },
          description: match[2].trim(),
        });
      }

      // Apply to the first class declaration in this module
      const classDecl = moduleDoc?.declarations?.find((d) => d.kind === 'class');
      if (!classDecl) return;

      if (description) classDecl.description = description;

      if (attrs.length > 0) {
        classDecl.attributes = [
          ...(classDecl.attributes || []),
          ...attrs.filter(
            (a) => !(classDecl.attributes || []).some((ea) => ea.name === a.name)
          ),
        ];
      }

      if (events.length > 0) {
        classDecl.events = [
          ...(classDecl.events || []),
          ...events.filter(
            (e) => !(classDecl.events || []).some((ee) => ee.name === e.name)
          ),
        ];
      }
    },
  };
}

function registerComponentPlugin() {
  return {
    name: 'vb-register-component',
    analyzePhase({ ts, node, moduleDoc }) {
      // Match: registerComponent('tag-name', ClassName)
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'registerComponent' &&
        node.arguments.length >= 2
      ) {
        const tagArg = node.arguments[0];
        const classArg = node.arguments[1];

        if (ts.isStringLiteral(tagArg) && ts.isIdentifier(classArg)) {
          const tagName = tagArg.text;
          const className = classArg.text;

          // Find the matching class declaration in this module
          const decl = moduleDoc?.declarations?.find(
            (d) => d.name === className && d.kind === 'class'
          );

          if (decl) {
            decl.tagName = tagName;

            // Also add/update the exports and customElements entry
            if (!moduleDoc.exports) moduleDoc.exports = [];

            // Add custom-element-definition export
            const existing = moduleDoc.exports.find(
              (e) => e.kind === 'custom-element-definition' && e.name === tagName
            );
            if (!existing) {
              moduleDoc.exports.push({
                kind: 'custom-element-definition',
                name: tagName,
                declaration: {
                  name: className,
                  module: moduleDoc.path,
                },
              });
            }
          }
        }
      }
    },
  };
}

export default {
  globs: [
    'src/web-components/tab-set/logic.js',
    'src/web-components/slide-accept/logic.js',
    'src/web-components/combo-box/logic.js',
    'src/web-components/tool-tip/logic.js',
    'src/web-components/accordion-wc/logic.js',
  ],
  exclude: ['node_modules', 'dist', 'site'],
  outdir: 'admin/r-n-d',
  plugins: [hoistFileJsdocPlugin(), registerComponentPlugin()],
};
