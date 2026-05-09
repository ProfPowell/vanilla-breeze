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

/**
 * @typedef {object} FallbackVars
 * @property {string} [prompt]   Component-composed task prompt.
 * @property {string} [url]      Defaults to location.href when in a browser.
 * @property {string} [title]    Defaults to document.title when in a browser.
 * @property {string} [content]  Optional extracted page content. Caller is
 *                               responsible for length-capping; very long
 *                               URLs may be rejected by browsers/providers.
 */

/**
 * Expand `{prompt}`, `{url}`, `{title}`, `{content}` tokens in a URL template.
 *
 * @param {string | null | undefined} template
 * @param {FallbackVars} [vars]
 * @returns {string} The expanded URL, or '' when template is empty.
 */
export function expandFallbackURL(template, vars = {}) {
  if (!template) return '';

  const v = {
    prompt:  vars.prompt  ?? '',
    url:     vars.url     ?? (typeof location !== 'undefined' ? location.href : ''),
    title:   vars.title   ?? (typeof document !== 'undefined' ? document.title : ''),
    content: vars.content ?? '',
  };

  return String(template).replace(TOKEN_RE, (_, key) => encodeURIComponent(v[key]));
}
