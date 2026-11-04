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
 * the scheme's top concepts. Each summary holds plain text: the concept's
 * prefLabel and a count of distinct pages tagged with that concept OR any
 * descendant. The /topics/{id}/ link sits inside the disclosure body so the
 * summary stays a single, toggle-only control. Pages tagged with concepts
 * not present in the vocabulary land under "Uncategorized".
 *
 * The tree is built by JavaScript from the fetched JSON; without JS the
 * element shows only its authored fallback content. Once rendered, the
 * tree uses native disclosure (no custom keyboard code).
 *
 * Page links are scheme-checked (http/https/relative only); cyclic
 * broader/narrower edges are skipped rather than recursed.
 *
 * @attr {string}  data-lens-src         URL to pages.json (default lens convention)
 * @attr {string}  src                   Alias for data-lens-src
 * @attr {string}  data-vocabulary-src   URL to vocabulary.json (default /vocabulary.json)
 * @attr {boolean} expand-all            Render with every level expanded
 * @attr {number}  data-heading-level    Heading level 1–6 (default 2); 0 renders no heading
 * @attr {string}  data-label-heading        Heading text (default "Topics")
 * @attr {string}  data-label-page           Count template, plural "one" (default "{count} page")
 * @attr {string}  data-label-pages          Count template, other plurals (default "{count} pages")
 * @attr {string}  data-label-uncategorized  Uncategorized node label
 * @attr {string}  data-label-topic-link     Topic page link text template (default "{label} topic page")
 * @attr {string}  data-label-error          Message when a data source fails to load
 *
 * @fires topic-map:data-changed  detail: { pages, vocabulary, source: 'property' }
 *
 * @example
 *   <topic-map
 *     data-lens-src="/pages.json"
 *     data-vocabulary-src="/vocabulary.json"></topic-map>
 */

const DEFAULT_LABELS = {
  heading: 'Topics',
  page: '{count} page',
  pages: '{count} pages',
  uncategorized: 'Uncategorized',
  'topic-link': '{label} topic page',
  error: 'Topics could not be loaded.',
};

/**
 * Pure: return the href if it is http(s) or relative, else null.
 * Mirrors author-index's safeHref.
 * @param {unknown} raw
 * @returns {string | null} The safe href, or null.
 */
export function safeHref(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  try {
    const { protocol } = new URL(s, 'https://topic-map.invalid/');
    return protocol === 'http:' || protocol === 'https:' ? s : null;
  } catch {
    return null;
  }
}

/**
 * Pure: build the concept graph and per-concept distinct page sets.
 * Counts are de-duplicated per subtree (a page tagged with a parent and
 * its child counts once) and cycles in broader/narrower are tolerated.
 *
 * @param {any[]} pages
 * @param {any} vocab
 * @returns {{ byId: Map<string, any>, childrenOf: Map<string, Set<string>>, directPages: Map<string, any[]>, uncategorized: any[], roots: string[], totalFor: (id: string) => number }} The concept graph.
 */
export function buildTopicGraph(pages, vocab) {
  const concepts = Array.isArray(vocab?.concepts) ? vocab.concepts : [];
  const topConceptIds = asArray(vocab?.['skos:hasTopConcept']);

  /** @type {Map<string, any>} */
  const byId = new Map();
  for (const c of concepts) {
    if (c && typeof c['@id'] === 'string' && c['@id']) byId.set(c['@id'], c);
  }

  /** @type {Map<string, Set<string>>} */
  const childrenOf = new Map();
  /** @type {Map<string, Set<string>>} */
  const parentsOf = new Map();
  const addEdge = (parentId, childId) => {
    if (!byId.has(parentId) || !byId.has(childId) || parentId === childId) return;
    childrenOf.set(parentId, (childrenOf.get(parentId) ?? new Set()).add(childId));
    parentsOf.set(childId, (parentsOf.get(childId) ?? new Set()).add(parentId));
  };
  for (const c of byId.values()) {
    const id = c['@id'];
    for (const b of asArray(c['skos:broader'])) addEdge(b, id);
    for (const n of asArray(c['skos:narrower'])) addEdge(id, n);
  }

  /** @type {Map<string, any[]>} */
  const directPages = new Map();
  const uncategorized = [];
  for (const p of pages) {
    if (!p || typeof p !== 'object') continue;
    const tags = Array.isArray(p.concepts) ? p.concepts : [];
    let landed = false;
    for (const t of new Set(tags)) {
      if (!byId.has(t)) continue;
      const list = directPages.get(t);
      if (list) list.push(p);
      else directPages.set(t, [p]);
      landed = true;
    }
    if (!landed) uncategorized.push(p);
  }

  /** Distinct pages under a concept (itself + all descendants), cycle-safe. */
  const countCache = new Map();
  const totalFor = (id) => {
    if (countCache.has(id)) return countCache.get(id);
    const seenConcepts = new Set();
    const seenPages = new Set();
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      if (seenConcepts.has(cur)) continue;
      seenConcepts.add(cur);
      for (const p of directPages.get(cur) || []) seenPages.add(pageKey(p));
      for (const k of childrenOf.get(cur) || []) stack.push(k);
    }
    countCache.set(id, seenPages.size);
    return seenPages.size;
  };

  /* roots: explicit top concepts, falling back to concepts with no parent. */
  let roots = topConceptIds.filter((id) => byId.has(id));
  if (roots.length === 0) {
    roots = [...byId.keys()].filter((id) => !parentsOf.has(id));
  }

  return { byId, childrenOf, directPages, uncategorized, roots, totalFor };
}

class TopicMap extends VBElement {
  /** Bumped per setup/teardown so stale fetches never render. */
  #gen = 0;

  setup() {
    const gen = ++this.#gen;
    if (this.__data) {
      this.#renderSafely(this.__data.pages, this.__data.vocabulary);
      return;
    }
    const pagesSrc = this.getAttribute('data-lens-src') || this.getAttribute('src');
    const vocabSrc = this.getAttribute('data-vocabulary-src') || '/vocabulary.json';
    if (pagesSrc) this.#loadFromSrc(pagesSrc, vocabSrc, gen);
  }

  teardown() {
    this.#gen++;
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  /**
   * The in-memory payloads if they were assigned via .data, else `null`.
   * (When loaded from src, the rendered tree is the source of truth.)
   *
   * @returns {{ pages: any[], vocabulary: object }|null} The `{ pages, vocabulary }` payload, or null.
   */
  get data() { return this.__data || null; }

  /**
   * Assign already-loaded `{ pages, vocabulary }` payloads to bypass the
   * fetch path. Takes precedence over data-lens-src while set.
   *
   * Emits topic-map:data-changed { pages, vocabulary, source: 'property' }.
   */
  set data(value) {
    if (!value || typeof value !== 'object') return;
    const pages = Array.isArray(value.pages) ? value.pages : [];
    const vocabulary = value.vocabulary || {};
    this.__data = { pages, vocabulary };
    this._reinit();
    this.dispatchEvent(new CustomEvent('topic-map:data-changed', {
      detail: { pages, vocabulary, source: 'property' },
      bubbles: true,
    }));
  }

  async #loadFromSrc(pagesSrc, vocabSrc, gen) {
    const [pagesPayload, vocabPayload] = await Promise.all([
      fetchJson(pagesSrc),
      fetchJson(vocabSrc),
    ]);
    if (gen !== this.#gen) return;

    const failed = pagesPayload.error ? [pagesSrc, pagesPayload.error]
      : vocabPayload.error ? [vocabSrc, vocabPayload.error] : null;
    if (failed) {
      console.warn(`[topic-map] could not load ${failed[0]}: ${failed[1]}`);
      this.#renderError();
      return;
    }

    const raw = pagesPayload.data;
    const pages = Array.isArray(raw) ? raw : (Array.isArray(raw?.pages) ? raw.pages : []);
    this.#renderSafely(pages, vocabPayload.data);
  }

  #renderSafely(pages, vocab) {
    try {
      this.#renderTree(pages, vocab);
    } catch (err) {
      console.warn('[topic-map] could not render the topic tree:', err);
      this.#renderError();
    }
  }

  #renderTree(pages, vocab) {
    const graph = buildTopicGraph(pages, vocab);
    const expandAll = this.hasAttribute('expand-all');
    const parts = [];

    const heading = this.#heading(pages.length);
    if (heading) parts.push(heading);

    for (const id of graph.roots) {
      parts.push(this.#renderConcept(id, graph, expandAll, 0, new Set()));
    }

    if (graph.uncategorized.length) {
      const open = expandAll ? ' open' : '';
      parts.push(`<details${open} data-topic-node="__uncategorized">`);
      parts.push(`<summary><span class="topic-name">${escapeHtml(this.#label('uncategorized'))}</span> <span class="topic-count">${escapeHtml(this.#count(new Set(graph.uncategorized.map(pageKey)).size))}</span></summary>`);
      parts.push(this.#pageList(graph.uncategorized));
      parts.push('</details>');
    }

    this.innerHTML = parts.join('\n');
  }

  /**
   * @param {string} id
   * @param {any} graph
   * @param {boolean} expandAll
   * @param {number} depth
   * @param {Set<string>} ancestors  ids already on the current path (cycle guard)
   */
  #renderConcept(id, graph, expandAll, depth, ancestors) {
    const concept = graph.byId.get(id);
    if (!concept || ancestors.has(id)) return '';
    const path = new Set(ancestors).add(id);
    const label = String(concept['skos:prefLabel'] || id);
    const direct = graph.directPages.get(id) || [];
    const kids = graph.childrenOf.get(id);
    const open = expandAll || depth < 1 ? ' open' : '';
    const linkText = this.#label('topic-link').replaceAll('{label}', label);

    const parts = [];
    parts.push(`<details${open} data-topic-node="${escapeAttr(id)}">`);
    parts.push(
      '<summary>' +
        `<span class="topic-name">${escapeHtml(label)}</span>` +
        ` <span class="topic-count">${escapeHtml(this.#count(graph.totalFor(id)))}</span>` +
      '</summary>'
    );
    parts.push(`<p class="topic-link"><a href="/topics/${escapeAttr(encodeURIComponent(id))}/">${escapeHtml(linkText)}</a></p>`);
    if (direct.length) parts.push(this.#pageList(direct));
    if (kids && kids.size) {
      const sortedKids = [...kids].sort((a, b) => {
        const la = String(graph.byId.get(a)?.['skos:prefLabel'] || a);
        const lb = String(graph.byId.get(b)?.['skos:prefLabel'] || b);
        return la.localeCompare(lb, this.#locale(), { sensitivity: 'base' });
      });
      for (const childId of sortedKids) {
        parts.push(this.#renderConcept(childId, graph, expandAll, depth + 1, path));
      }
    }
    parts.push('</details>');
    return parts.join('\n');
  }

  #pageList(pages) {
    const items = pages.map((p) => {
      const text = escapeHtml(p.title || p.url || '');
      const href = safeHref(p.url);
      return href ? `<li><a href="${escapeAttr(href)}">${text}</a></li>` : `<li>${text}</li>`;
    });
    return `<ul class="topic-pages">\n${items.join('\n')}\n</ul>`;
  }

  #heading(total) {
    const raw = this.getAttribute('data-heading-level');
    const n = raw == null || raw === '' ? 2 : Number.parseInt(raw, 10);
    if (n === 0) return '';
    const level = Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : 2;
    return `<h${level} class="topic-map-heading">${escapeHtml(this.#label('heading'))} <small>(${escapeHtml(this.#count(total))})</small></h${level}>`;
  }

  /** Localised "{count} page(s)" via Intl.PluralRules + data-label templates. */
  #count(n) {
    const locale = this.#locale();
    const key = new Intl.PluralRules(locale).select(n) === 'one' ? 'page' : 'pages';
    return this.#label(key).replaceAll('{count}', new Intl.NumberFormat(locale).format(n));
  }

  #renderError() {
    this.querySelector(':scope > [data-topic-map-error]')?.remove();
    const p = document.createElement('p');
    p.setAttribute('data-topic-map-error', '');
    p.textContent = this.#label('error');
    /* Keep any authored fallback content; the message sits above it. */
    this.prepend(p);
  }

  #label(key) {
    return this.getAttribute(`data-label-${key}`) || DEFAULT_LABELS[key];
  }

  #locale() {
    const lang = this.closest('[lang]')?.getAttribute('lang') || undefined;
    try {
      return Intl.getCanonicalLocales(lang)[0];
    } catch {
      return undefined;
    }
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return { data: await res.json() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function pageKey(p) {
  return typeof p?.url === 'string' && p.url ? p.url : p;
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
