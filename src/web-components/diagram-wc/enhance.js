/**
 * enhance — upgrade `<pre><code class="language-mermaid">` blocks into
 * `<diagram-wc type="mermaid">` so existing rendered markdown gets diagrams
 * for free. Used by markdown-mermaid-bridge and exposed for direct use by
 * authors who prefer manual wiring.
 */

/**
 * Wrap each `<pre><code class="language-X">` in `root` with a `<diagram-wc>`.
 * Skips fences already inside a `<diagram-wc>`.
 *
 * @param {ParentNode} [root=document]
 * @param {{ type?: string, language?: string }} [opts]
 * @returns {number} Number of fences upgraded
 */
export function enhanceMermaidFences(root = document, opts = {}) {
  const language = opts.language || 'mermaid';
  const type = opts.type || 'mermaid';
  const selector = `pre > code.language-${language}`;
  let count = 0;
  for (const code of root.querySelectorAll(selector)) {
    const pre = code.parentElement;
    if (!pre || pre.parentElement?.tagName.toLowerCase() === 'diagram-wc') continue;
    const parent = pre.parentNode;
    const next = pre.nextSibling;
    const wrap = document.createElement('diagram-wc');
    wrap.setAttribute('type', type);
    // Build the wrapper fully before attaching it to the live tree, so the
    // component's setup() sees the <pre> child as soon as it connects.
    wrap.appendChild(pre);
    parent.insertBefore(wrap, next);
    count++;
  }
  return count;
}
