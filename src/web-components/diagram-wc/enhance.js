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
 * @param {{ type?: string, language?: string, primingSvgs?: string[] }} [opts]
 *   `primingSvgs[i]` (optional) seeds the i-th newly-wrapped diagram-wc with a
 *   cached SVG so the prior render stays visible across markdown re-renders.
 *   See markdown-mermaid-bridge.js for the position-keyed cache.
 * @returns {HTMLElement[]} The diagram-wc elements that were created (in order)
 */
export function enhanceMermaidFences(root = document, opts = {}) {
  const language = opts.language || 'mermaid';
  const type = opts.type || 'mermaid';
  const priming = Array.isArray(opts.primingSvgs) ? opts.primingSvgs : null;
  const selector = `pre > code.language-${language}`;
  /** @type {HTMLElement[]} */
  const created = [];
  let i = 0;
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
    if (priming && priming[i]) {
      const fig = document.createElement('figure');
      fig.className = 'dwc-figure';
      fig.setAttribute('role', 'img');
      fig.innerHTML = priming[i];
      wrap.appendChild(fig);
    }
    parent.insertBefore(wrap, next);
    created.push(wrap);
    i++;
  }
  return created;
}
