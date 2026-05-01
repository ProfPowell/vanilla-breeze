import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

/**
 * topic-map: SKOS-aware hierarchical view of site concepts.
 *
 * Joins two data sources:
 *   - vocabulary.json (SKOS ConceptScheme) — provides the @id graph
 *     with skos:broader / skos:narrower / skos:hasTopConcept edges and
 *     skos:prefLabel display strings.
 *   - pages.json — each page record exposes `concepts: [id, …]` (harvested
 *     by generate-pages-json.js from repeated <meta name="concept"> tags
 *     per meta-tag-contract v1.1).
 *
 * The component renders a nested <details>/<summary>/<ul> tree rooted at
 * the scheme's top concepts. Each node shows the concept's prefLabel, a
 * count of pages tagged with that concept OR any descendant, and links
 * to /topics/{id}/. Pages tagged with concepts not present in the
 * vocabulary land under "Uncategorized".
 *
 * The tree degrades to native disclosure widgets without JavaScript;
 * only the data fetch + tree build are JS-driven.
 *
 * @attr {string}  data-lens-src         URL to pages.json (default lens convention)
 * @attr {string}  src                   Alias for data-lens-src
 * @attr {string}  data-vocabulary-src   URL to vocabulary.json (default /vocabulary.json)
 * @attr {boolean} expand-all            Render with every level expanded
 *
 * @example
 *   <topic-map
 *     data-lens-src="/pages.json"
 *     data-vocabulary-src="/vocabulary.json"></topic-map>
 */
class TopicMap extends VBElement {
  setup() {
    const pagesSrc = this.getAttribute('data-lens-src') || this.getAttribute('src');
    const vocabSrc = this.getAttribute('data-vocabulary-src') || '/vocabulary.json';
    if (pagesSrc) {
      this.#loadFromSrc(pagesSrc, vocabSrc).catch(() => { /* keep light-DOM */ });
    } else {
      this.#enhance();
    }
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * Read the in-memory payloads if they were assigned via .data, else
   * `null`. (When loaded from src, the rendered tree IS the source of
   * truth — there's no JSON to round-trip.)
   */
  get data() { return this.__data || null; }

  /**
   * Assign already-loaded `{ pages, vocabulary }` payloads to bypass the
   * fetch path. Useful when a reactive framework owns the data and wants
   * topic-map to render against in-memory state.
   *
   * Emits topic-map:data-changed { pages, vocabulary, source: 'property' }.
   */
  set data(value) {
    if (!value || typeof value !== 'object') return;
    const pages = Array.isArray(value.pages) ? value.pages : [];
    const vocabulary = value.vocabulary || {};
    this.__data = { pages, vocabulary };
    this.#renderTree(pages, vocabulary);
    this.#enhance();
    this.dispatchEvent(new CustomEvent('topic-map:data-changed', {
      detail: { pages, vocabulary, source: 'property' },
      bubbles: true,
    }));
  }

  async #loadFromSrc(pagesSrc, vocabSrc) {
    const [pagesPayload, vocabPayload] = await Promise.all([
      this.#fetchJson(pagesSrc),
      this.#fetchJson(vocabSrc)
    ]);

    if (pagesPayload.error) {
      this.#renderError(`Could not load ${pagesSrc}: ${pagesPayload.error}`);
      return;
    }
    if (vocabPayload.error) {
      this.#renderError(`Could not load ${vocabSrc}: ${vocabPayload.error}`);
      return;
    }

    const pages = Array.isArray(pagesPayload.data)
      ? pagesPayload.data
      : (pagesPayload.data.pages || []);
    const vocab = vocabPayload.data;

    this.#renderTree(pages, vocab);
    this.#enhance();
  }

  async #fetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`status ${res.status}`);
      return { data: await res.json() };
    } catch (err) {
      return { error: err.message };
    }
  }

  #renderTree(pages, vocab) {
    const concepts = Array.isArray(vocab?.concepts) ? vocab.concepts : [];
    const topConceptIds = Array.isArray(vocab?.['skos:hasTopConcept'])
      ? vocab['skos:hasTopConcept']
      : [];

    /* index concepts by @id */
    const byId = new Map();
    for (const c of concepts) {
      if (c && c['@id']) byId.set(c['@id'], c);
    }

    /* normalize edges — skos:broader and skos:narrower can be string or array */
    const childrenOf = new Map();   /* parentId → Set<childId> */
    const parentsOf = new Map();    /* childId → Set<parentId> */

    function addEdge(parentId, childId) {
      if (!parentId || !childId) return;
      if (!byId.has(parentId) || !byId.has(childId)) return;
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, new Set());
      childrenOf.get(parentId).add(childId);
      if (!parentsOf.has(childId)) parentsOf.set(childId, new Set());
      parentsOf.get(childId).add(parentId);
    }

    for (const c of concepts) {
      const id = c['@id'];
      const broader = asArray(c['skos:broader']);
      for (const b of broader) addEdge(b, id);
      const narrower = asArray(c['skos:narrower']);
      for (const n of narrower) addEdge(id, n);
    }

    /* count direct + transitive page hits per concept id */
    const directPages = new Map();   /* conceptId → Page[] */
    const uncategorized = [];
    for (const p of pages) {
      const tags = Array.isArray(p.concepts) ? p.concepts : [];
      if (tags.length === 0) {
        uncategorized.push(p);
        continue;
      }
      let landed = false;
      for (const t of tags) {
        if (byId.has(t)) {
          if (!directPages.has(t)) directPages.set(t, []);
          directPages.get(t).push(p);
          landed = true;
        }
      }
      if (!landed) uncategorized.push(p);
    }

    /* totals = direct + sum(descendant totals), guarded against cycles */
    const totals = new Map();
    const visiting = new Set();
    function totalFor(id) {
      if (totals.has(id)) return totals.get(id);
      if (visiting.has(id)) return 0;
      visiting.add(id);
      const direct = (directPages.get(id) || []).length;
      let descendant = 0;
      const kids = childrenOf.get(id);
      if (kids) {
        for (const k of kids) descendant += totalFor(k);
      }
      visiting.delete(id);
      const sum = direct + descendant;
      totals.set(id, sum);
      return sum;
    }

    /* roots: explicit top concepts, falling back to concepts with no
       parent in the vocabulary (defensive — vocab may omit hasTopConcept). */
    let roots = topConceptIds.filter((id) => byId.has(id));
    if (roots.length === 0) {
      roots = concepts
        .map((c) => c['@id'])
        .filter((id) => id && !parentsOf.has(id));
    }

    const expandAll = this.hasAttribute('expand-all');
    const totalPages = pages.length;

    const parts = [
      `<h2 class="topic-map-heading">Topics <small>(${totalPages} pages)</small></h2>`
    ];

    for (const id of roots) {
      parts.push(this.#renderConcept(id, byId, childrenOf, directPages, totalFor, expandAll, /* depth */ 0));
    }

    if (uncategorized.length) {
      const open = expandAll ? ' open' : '';
      parts.push(`<details${open} data-topic-node="__uncategorized">`);
      parts.push(`<summary><span class="topic-name">Uncategorized</span> <span class="topic-count">${uncategorized.length}</span></summary>`);
      parts.push(`<ul class="topic-pages">`);
      for (const p of uncategorized) {
        parts.push(`<li><a href="${escapeAttr(p.url)}">${escapeHtml(p.title || p.url)}</a></li>`);
      }
      parts.push(`</ul>`);
      parts.push(`</details>`);
    }

    this.innerHTML = parts.join('\n');
  }

  #renderConcept(id, byId, childrenOf, directPages, totalFor, expandAll, depth) {
    const concept = byId.get(id);
    if (!concept) return '';
    const label = concept['skos:prefLabel'] || id;
    const total = totalFor(id);
    const direct = directPages.get(id) || [];
    const kids = childrenOf.get(id);
    const open = expandAll || depth < 1 ? ' open' : '';

    const parts = [];
    parts.push(`<details${open} data-topic-node="${escapeAttr(id)}">`);
    parts.push(
      `<summary>` +
        `<a class="topic-name" href="/topics/${escapeAttr(id)}/">${escapeHtml(label)}</a>` +
        ` <span class="topic-count">${total}</span>` +
      `</summary>`
    );
    if (direct.length) {
      parts.push(`<ul class="topic-pages">`);
      for (const p of direct) {
        parts.push(`<li><a href="${escapeAttr(p.url)}">${escapeHtml(p.title || p.url)}</a></li>`);
      }
      parts.push(`</ul>`);
    }
    if (kids && kids.size) {
      const sortedKids = [...kids].sort((a, b) => {
        const la = (byId.get(a)?.['skos:prefLabel'] || a).toLowerCase();
        const lb = (byId.get(b)?.['skos:prefLabel'] || b).toLowerCase();
        return la.localeCompare(lb);
      });
      for (const childId of sortedKids) {
        parts.push(this.#renderConcept(childId, byId, childrenOf, directPages, totalFor, expandAll, depth + 1));
      }
    }
    parts.push(`</details>`);
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
    /* Tree is the experience for v1; search/filter could be added later. */
  }
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

registerComponent('topic-map', TopicMap);

export { TopicMap };
