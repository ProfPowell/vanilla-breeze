/**
 * sanitize-html: Shared HTML sanitizer for Vanilla Breeze components
 *
 * ## HTML Trust Policy
 *
 * Any component that renders HTML from external sources (API responses, data
 * bindings, fetched partials) MUST follow these rules:
 *
 * 1. **Use this sanitizer.** Import `sanitizeHTML` and pass all untrusted HTML
 *    through it before assigning to `innerHTML` or `insertAdjacentHTML`.
 *
 * 2. **Prefer textContent.** If the content is plain text, use `textContent`
 *    or `createTextNode` — never `innerHTML`. The sanitizer is for cases
 *    where the content is intentionally HTML (rich text, formatted responses).
 *
 * 3. **Script execution is opt-in.** `<include-file>` strips `<script>` tags
 *    by default. The `data-allow-scripts` attribute must be explicitly set
 *    to re-execute scripts — only for trusted first-party partials.
 *
 * 4. **No ad-hoc sanitizers.** Do not write per-component sanitization logic.
 *    If this sanitizer is missing a case, fix it here so all consumers benefit.
 *
 * ### Current consumers
 *
 * - `chat-window` — sanitizes endpoint responses before rendering bubbles
 * - `card-list`   — sanitizes `data-field-html` bindings from JSON data
 * - `include-file` — strips scripts unless `data-allow-scripts` is set
 *
 * ### What this strips
 *
 * - Elements: script, iframe, object, embed, form, base, link, meta, noscript
 * - Attributes: all `on*` event handlers
 * - URLs: `javascript:` and `data:text/html` on href, src, action, formaction
 * - Content loaders: `srcdoc`, `data` (on object)
 *
 * This is NOT a full DOMPurify replacement. It covers OWASP top-10 XSS
 * vectors for the component use cases above. If the project starts accepting
 * user-generated HTML (comments, rich-text editors), adopt DOMPurify.
 *
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML safe for innerHTML
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';

  const template = document.createElement('template');
  template.innerHTML = html;

  // Remove dangerous elements
  const dangerous = template.content.querySelectorAll(
    'script, iframe, object, embed, form, base, link, meta, noscript'
  );
  dangerous.forEach(el => el.remove());

  // Remove event handlers, dangerous attributes, and dangerous URLs
  const allElements = template.content.querySelectorAll('*');
  allElements.forEach(el => {
    for (const attr of [...el.attributes]) {
      // Strip all event handlers (on*)
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }

      // Strip javascript: / data: URLs on attributes that load content
      if (['href', 'src', 'action', 'formaction', 'xlink:href'].includes(attr.name)) {
        const val = attr.value.trim().toLowerCase();
        if (val.startsWith('javascript:') || val.startsWith('data:text/html')) {
          el.removeAttribute(attr.name);
        }
        continue;
      }

      // Strip attributes that can load arbitrary content
      if (attr.name === 'srcdoc' || attr.name === 'data' && el.tagName === 'OBJECT') {
        el.removeAttribute(attr.name);
      }
    }
  });

  return template.innerHTML;
}
