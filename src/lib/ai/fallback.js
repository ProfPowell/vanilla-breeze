/**
 * Deep-link fallback URL expander.
 *
 * Components configure an external `fallback-url` template such as
 *   https://claude.ai/new?q={prompt}
 *   https://chatgpt.com/?q={prompt}
 *   mailto:?subject={title}&body={url}%0A%0A{prompt}
 *
 * The component composes a `prompt` string for its task and this helper
 * substitutes the four supported tokens, URL-encoding each value.
 *
 * Provider-neutral by design — VB ships zero baked-in providers.
 */

const TOKEN_RE = /\{(prompt|url|title|content)\}/g;

/** Default cap (in characters, before URL-encoding) on the `{content}`
 *  token. Encoding can triple the size, and browsers / providers start
 *  rejecting URLs somewhere past ~8 KB. */
export const MAX_CONTENT_CHARS = 1500;

/**
 * Cap a string for use in a URL token. Cuts at the last word boundary
 * before `max` and appends an ellipsis when anything was dropped.
 *
 * @param {string | null | undefined} text
 * @param {number} [max]
 * @returns {string}
 */
export function capContent(text, max = MAX_CONTENT_CHARS) {
  const s = String(text ?? '');
  if (s.length <= max) return s;
  const cut = s.slice(0, Math.max(0, max - 1));
  const space = cut.lastIndexOf(' ');
  return `${space > max * 0.8 ? cut.slice(0, space) : cut}…`;
}

/**
 * True when the template uses the `{content}` token, so callers can skip
 * extracting page text that would be thrown away.
 *
 * @param {string | null | undefined} template
 * @returns {boolean}
 */
export function usesContentToken(template) {
  return typeof template === 'string' && template.includes('{content}');
}

/**
 * @typedef {object} FallbackVars
 * @property {string} [prompt]   Component-composed task prompt.
 * @property {string} [url]      Defaults to location.href when in a browser.
 * @property {string} [title]    Defaults to document.title when in a browser.
 * @property {string} [content]  Optional extracted page content. Capped to
 *                               `contentLimit` characters (default
 *                               MAX_CONTENT_CHARS) before encoding.
 */

/**
 * Expand `{prompt}`, `{url}`, `{title}`, `{content}` tokens in a URL template.
 *
 * @param {string | null | undefined} template
 * @param {FallbackVars} [vars]
 * @param {{ contentLimit?: number }} [opts]
 * @returns {string} The expanded URL, or '' when template is empty.
 */
export function expandFallbackURL(template, vars = {}, { contentLimit = MAX_CONTENT_CHARS } = {}) {
  if (!template) return '';

  const v = {
    prompt:  vars.prompt  ?? '',
    url:     vars.url     ?? (typeof location !== 'undefined' ? location.href : ''),
    title:   vars.title   ?? (typeof document !== 'undefined' ? document.title : ''),
    content: capContent(vars.content, contentLimit),
  };

  return String(template).replace(TOKEN_RE, (_, key) => encodeURIComponent(v[key]));
}
