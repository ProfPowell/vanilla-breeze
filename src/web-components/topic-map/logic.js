import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * topic-map: Hierarchical view of vb:topic dotted paths.
 *
 * Reads pages.json (data-lens-src) and renders a nested <details>/<ul>
 * tree where each level corresponds to a segment of the dotted topic
 * path. Pages with no `topic` are bucketed under "Uncategorized".
 *
 * @attr {string} data-lens-src   URL to pages.json (or compatible)
 * @attr {string} src             Alias for data-lens-src
 * @attr {boolean} expand-all     Render with every level expanded
 *
 * @example
 *   <topic-map data-lens-src="/pages.json"></topic-map>
 */
class TopicMap extends VBElement {
  setup() {
    const src = this.getAttribute('data-lens-src') || this.getAttribute('src');
    if (src) {
      this.#loadFromSrc(src).catch(() => { /* keep light-DOM */ });
    } else {
      this.#enhance();
    }
  }

  async #loadFromSrc(src) {
    let payload;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`status ${res.status}`);
      payload = await res.json();
    } catch (err) {
      this.#renderError(`Could not load ${src}: ${err.message}`);
      return;
    }

    const pages = Array.isArray(payload) ? payload : (payload.pages || []);
    this.#renderTree(pages);
    this.#enhance();
  }

  #renderTree(pages) {
    /* Build nested tree from dotted paths */
    const root = { name: 'root', children: new Map(), pages: [] };

    for (const p of pages) {
      const segments = p.topic ? p.topic.split('.').filter(Boolean) : ['Uncategorized'];
      let node = root;
      for (const seg of segments) {
        if (!node.children.has(seg)) {
          node.children.set(seg, { name: seg, children: new Map(), pages: [] });
        }
        node = node.children.get(seg);
      }
      node.pages.push(p);
    }

    const expandAll = this.hasAttribute('expand-all');
    this.innerHTML = `<h2 class="topic-map-heading">Topics <small>(${pages.length} pages)</small></h2>` +
      this.#renderNode(root, '', expandAll, /* depth */ 0);
  }

  #renderNode(node, pathPrefix, expandAll, depth) {
    const parts = [];
    for (const [name, child] of [...node.children.entries()].sort()) {
      const path = pathPrefix ? `${pathPrefix}.${name}` : name;
      const subtreePages = collectPages(child);
      const open = expandAll || depth < 1 ? ' open' : '';
      parts.push(`<details${open} data-topic-node="${escapeAttr(path)}">`);
      parts.push(`<summary><span class="topic-name">${escapeHtml(name)}</span> <span class="topic-count">${subtreePages.length}</span></summary>`);
      if (child.pages.length) {
        parts.push(`<ul class="topic-pages">`);
        for (const p of child.pages) {
          parts.push(`<li><a href="${escapeAttr(p.url)}">${escapeHtml(p.title || p.url)}</a></li>`);
        }
        parts.push(`</ul>`);
      }
      if (child.children.size) {
        parts.push(this.#renderNode(child, path, expandAll, depth + 1));
      }
      parts.push(`</details>`);
    }
    return parts.join('\n');
  }

  #renderError(message) {
    if (this.children.length > 0) return;
    const p = document.createElement('p');
    p.setAttribute('data-topic-map-error', '');
    p.textContent = message;
    this.append(p);
  }

  #enhance() {
    /* Could add search filtering later. For v1: tree is the experience. */
  }
}

function collectPages(node) {
  const out = [...node.pages];
  for (const child of node.children.values()) {
    out.push(...collectPages(child));
  }
  return out;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

registerComponent('topic-map', TopicMap);

export { TopicMap };
