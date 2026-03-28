/**
 * @file normalize-legacy-nunjucks.js
 * @description Normalizes leftover 11ty/Nunjucks patterns that are safe to
 * translate mechanically during the Cook build.
 *
 * This handles three common migration leftovers:
 * 1. <code-block>{{ '...' | escape }}</code-block>
 * 2. {{ someData | dump | safe }} inside inline scripts
 * 3. {{ '{' }} / {{ '}' }} literal brace helpers
 */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getByPath(obj, path) {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

function stringifyForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026');
}

function decodeQuotedString(quote, body) {
  let out = '';

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (char !== '\\') {
      out += char;
      continue;
    }

    const next = body[index + 1];
    if (next === undefined) {
      out += '\\';
      break;
    }

    index += 1;

    switch (next) {
      case 'n':
        out += '\n';
        break;
      case 'r':
        out += '\r';
        break;
      case 't':
        out += '\t';
        break;
      case 'b':
        out += '\b';
        break;
      case 'f':
        out += '\f';
        break;
      case 'v':
        out += '\v';
        break;
      case '\\':
        out += '\\';
        break;
      case '\'':
        out += '\'';
        break;
      case '"':
        out += '"';
        break;
      case 'u': {
        const hex = body.slice(index + 1, index + 5);
        if (/^[\da-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(Number.parseInt(hex, 16));
          index += 4;
        } else {
          out += 'u';
        }
        break;
      }
      case 'x': {
        const hex = body.slice(index + 1, index + 3);
        if (/^[\da-fA-F]{2}$/.test(hex)) {
          out += String.fromCharCode(Number.parseInt(hex, 16));
          index += 2;
        } else {
          out += 'x';
        }
        break;
      }
      default:
        out += next;
        break;
    }
  }

  return out;
}

function encodeCookEsc(content) {
  const trimmed = content.replace(/^\n+/, '').replace(/\n+$/, '');
  const escaped = escapeHtml(trimmed);
  return Buffer.from(escaped).toString('base64');
}

export class NormalizeLegacyNunjucks {
  constructor({ file, data }) {
    this.file = file;
    this.data = data;
  }

  async init() {
    if (!this.file?.src || !this.file.path?.endsWith('.html')) return;

    this.replaceDumpSafe();
    this.replaceLiteralBraces();
    this.replaceEscapedCodeBlocks();
  }

  replaceDumpSafe() {
    if (!this.file.src.includes('| dump | safe')) return;

    this.file.src = this.file.src.replace(
      /\{\{\s*([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\s*\|\s*dump\s*\|\s*safe\s*\}\}/g,
      (match, path) => {
        const value = getByPath(this.data, path);
        return value === undefined ? match : stringifyForScript(value);
      },
    );
  }

  replaceLiteralBraces() {
    if (!this.file.src.includes('{{')) return;

    this.file.src = this.file.src.replace(/\{\{\s*(['"])([{}])\1\s*\}\}/g, '$2');
  }

  replaceEscapedCodeBlocks() {
    if (!this.file.src.includes('| escape')) return;

    this.file.src = this.file.src.replace(
      /<code-block\b([^>]*)>([\s\S]*?)<\/code-block>/gi,
      (match, attrs, content) => {
        const inner = content.trim();
        const legacyMatch = inner.match(/^\{\{\s*(["'])([\s\S]*?)\1\s*\|\s*escape\s*\}\}$/);
        if (!legacyMatch) return match;

        const [, quote, rawBody] = legacyMatch;
        const decoded = decodeQuotedString(quote, rawBody);
        const encoded = encodeCookEsc(decoded);
        const cleanAttrs = attrs.replace(/\s*\bdata-escape\b/, '');
        return `<code-block${cleanAttrs} data-cook-esc="${encoded}"></code-block>`;
      },
    );
  }
}
