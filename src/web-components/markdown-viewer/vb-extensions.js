/**
 * VB Callout Extension for marked
 *
 * Converts :::type blocks to VB-native callout markup:
 *
 *   :::warning
 *   This is a warning.
 *   :::
 *
 * Outputs:
 *   <div role="note" data-kind="warning" class="callout"><p>This is a warning.</p></div>
 *
 * Usage:
 *   import { marked } from 'marked';
 *   import { calloutExtension } from './vb-extensions.js';
 *   marked.use({ extensions: [calloutExtension] });
 */

const KINDS = new Set(['warning', 'info', 'tip', 'danger', 'note']);

export const calloutExtension = {
  name: 'callout',
  level: 'block',

  start(src) {
    return src.match(/^:::[a-z]+/m)?.index;
  },

  tokenizer(src) {
    const match = src.match(/^:::([a-z]+)\n([\s\S]*?)\n:::\s*(?:\n|$)/);
    if (!match) return undefined;

    const kind = match[1];
    if (!KINDS.has(kind)) return undefined;

    const token = {
      type: 'callout',
      raw: match[0],
      kind,
      text: match[2].trim(),
      tokens: [],
    };

    // Let marked's lexer parse the body into block tokens
    this.lexer.blockTokens(token.text, token.tokens);
    return token;
  },

  renderer(token) {
    const inner = this.parser.parse(token.tokens);
    return `<div role="note" data-kind="${token.kind}" class="callout">${inner}</div>\n`;
  },
};
