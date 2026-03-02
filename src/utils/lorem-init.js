/**
 * lorem-init: Placeholder text via data-lorem attribute
 *
 * Fills text-containing elements with placeholder content. Uses built-in
 * corpuses (~4KB) instead of faker to keep the browser bundle lean.
 * Auto-detects language from the lang attribute for non-Latin scripts.
 *
 * @attr {string} data-lorem - Word count, "N sentences", "heading", "N items", or corpus name
 *
 * @example Default paragraph
 * <p data-lorem></p>
 *
 * @example Word count
 * <p data-lorem="50"></p>
 *
 * @example Sentence count
 * <p data-lorem="3 sentences"></p>
 *
 * @example Heading-length text
 * <h2 data-lorem="heading"></h2>
 *
 * @example List items
 * <ul data-lorem="5 items"></ul>
 *
 * @example Non-Latin (auto-detected from lang)
 * <p lang="ja" data-lorem></p>
 */

const SELECTOR = '[data-lorem]';

// --- Corpuses ---

const LATIN = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur vel illum qui dolorem eum fugiat quo voluptas nulla pariatur. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident similique sunt in culpa qui officia deserunt mollitia animi id est laborum et dolorum fuga.';

const CJK = '\u3053\u308C\u306F\u30C0\u30DF\u30FC\u30C6\u30AD\u30B9\u30C8\u3067\u3059\u3002\u30EC\u30A4\u30A2\u30A6\u30C8\u306E\u78BA\u8A8D\u306B\u4F7F\u7528\u3057\u307E\u3059\u3002\u5B9F\u969B\u306E\u30B3\u30F3\u30C6\u30F3\u30C4\u306F\u5F8C\u3067\u8FFD\u52A0\u3055\u308C\u307E\u3059\u3002\u3053\u306E\u6587\u7AE0\u306F\u30D7\u30EC\u30FC\u30B9\u30DB\u30EB\u30C0\u30FC\u3068\u3057\u3066\u6A5F\u80FD\u3057\u307E\u3059\u3002\u30C7\u30B6\u30A4\u30F3\u306E\u30D7\u30ED\u30C8\u30BF\u30A4\u30D7\u4F5C\u6210\u4E2D\u306B\u3001\u30C6\u30AD\u30B9\u30C8\u304C\u5FC5\u8981\u306A\u5834\u6240\u306B\u914D\u7F6E\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u65E5\u672C\u8A9E\u306E\u6587\u5B57\u306F\u7D04\u5343\u5E74\u524D\u306B\u4E2D\u56FD\u304B\u3089\u4F1D\u308F\u308A\u307E\u3057\u305F\u3002\u73FE\u4EE3\u306E\u65E5\u672C\u8A9E\u306F\u6F22\u5B57\u3001\u3072\u3089\u304C\u306A\u3001\u30AB\u30BF\u30AB\u30CA\u306E\u4E09\u7A2E\u985E\u306E\u6587\u5B57\u3092\u4F7F\u7528\u3057\u307E\u3059\u3002\u30A6\u30A7\u30D6\u30C7\u30B6\u30A4\u30F3\u3067\u306F\u3001\u30C6\u30AD\u30B9\u30C8\u306E\u8AAD\u307F\u3084\u3059\u3055\u3068\u30EC\u30A4\u30A2\u30A6\u30C8\u306E\u30D0\u30E9\u30F3\u30B9\u304C\u91CD\u8981\u3067\u3059\u3002';

const ARABIC = '\u0647\u0630\u0627 \u0646\u0635 \u062A\u062C\u0631\u064A\u0628\u064A \u064A\u0633\u062A\u062E\u062F\u0645 \u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0635\u0645\u064A\u0645. \u064A\u0645\u0643\u0646 \u0627\u0633\u062A\u0628\u062F\u0627\u0644\u0647 \u0628\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0641\u0639\u0644\u064A \u0644\u0627\u062D\u0642\u0627. \u0627\u0644\u063A\u0631\u0636 \u0645\u0646\u0647 \u0647\u0648 \u0625\u0638\u0647\u0627\u0631 \u0643\u064A\u0641 \u0633\u064A\u0628\u062F\u0648 \u0627\u0644\u0646\u0635 \u0641\u064A \u0627\u0644\u0645\u0648\u0642\u0639. \u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u0648\u064A\u0628 \u064A\u062A\u0637\u0644\u0628 \u0646\u0635\u0648\u0635\u0627 \u0646\u0627\u0626\u0628\u0629 \u0644\u0645\u0644\u0621 \u0627\u0644\u0641\u0631\u0627\u063A\u0627\u062A. \u0647\u0630\u0627 \u0627\u0644\u0646\u0635 \u0647\u0648 \u0628\u062F\u064A\u0644 \u0639\u0631\u0628\u064A \u0644\u0646\u0635 \u0644\u0648\u0631\u064A\u0645 \u0625\u064A\u0628\u0633\u0648\u0645 \u0627\u0644\u0644\u0627\u062A\u064A\u0646\u064A. \u064A\u0633\u0627\u0639\u062F \u0641\u064A \u0627\u062E\u062A\u0628\u0627\u0631 \u0627\u0644\u062A\u062E\u0637\u064A\u0637\u0627\u062A \u0648\u0627\u0644\u062E\u0637\u0648\u0637 \u0648\u0627\u0644\u0627\u062A\u062C\u0627\u0647 \u0645\u0646 \u0627\u0644\u064A\u0645\u064A\u0646 \u0625\u0644\u0649 \u0627\u0644\u064A\u0633\u0627\u0631. \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0645\u0646 \u0623\u0643\u062B\u0631 \u0627\u0644\u0644\u063A\u0627\u062A \u0627\u0646\u062A\u0634\u0627\u0631\u0627 \u0641\u064A \u0627\u0644\u0639\u0627\u0644\u0645.';

const CYRILLIC = '\u042D\u0442\u043E \u043F\u0440\u0438\u043C\u0435\u0440 \u0442\u0435\u043A\u0441\u0442\u0430 \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043C\u0430\u043A\u0435\u0442\u0430. \u041E\u043D \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C \u0434\u043B\u044F \u043F\u0440\u043E\u0442\u043E\u0442\u0438\u043F\u043E\u0432. \u0420\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u0431\u0443\u0434\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u043F\u043E\u0437\u0436\u0435. \u0412\u0435\u0431-\u0434\u0438\u0437\u0430\u0439\u043D \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0445 \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u0435\u0439 \u0434\u043B\u044F \u043F\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u043C\u0430\u043A\u0435\u0442\u043E\u0432. \u042D\u0442\u043E\u0442 \u0442\u0435\u043A\u0441\u0442 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0440\u0443\u0441\u0441\u043A\u043E\u044F\u0437\u044B\u0447\u043D\u043E\u0439 \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432\u043E\u0439 \u043B\u0430\u0442\u0438\u043D\u0441\u043A\u043E\u043C\u0443 \u0442\u0435\u043A\u0441\u0442\u0443. \u041A\u0438\u0440\u0438\u043B\u043B\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0448\u0440\u0438\u0444\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u043C\u043D\u043E\u0433\u0438\u043C\u0438 \u044F\u0437\u044B\u043A\u0430\u043C\u0438 \u043C\u0438\u0440\u0430. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043A\u0430\u043A \u0432\u0430\u0448 \u0434\u0438\u0437\u0430\u0439\u043D \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441 \u044D\u0442\u0438\u043C \u043D\u0430\u0431\u043E\u0440\u043E\u043C \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432.';

const CORPUSES = { latin: LATIN, cjk: CJK, arabic: ARABIC, cyrillic: CYRILLIC };

// Language code to corpus mapping
const LANG_MAP = {
  ja: 'cjk', zh: 'cjk', ko: 'cjk',
  ar: 'arabic', fa: 'arabic', ur: 'arabic', he: 'arabic',
  ru: 'cyrillic', uk: 'cyrillic', bg: 'cyrillic', sr: 'cyrillic',
};

/**
 * Detect which corpus to use based on element language
 * @param {HTMLElement} el
 * @returns {string} Corpus key
 */
function detectCorpus(el) {
  const lang = el.closest('[lang]')?.getAttribute('lang')?.split('-')[0]?.toLowerCase();
  return (lang && LANG_MAP[lang]) || 'latin';
}

/**
 * Split corpus into sentences (period-delimited)
 * @param {string} text
 * @returns {string[]}
 */
function getSentences(text) {
  // Split on sentence-ending punctuation followed by space or end
  return text.split(/(?<=[.!?\u3002])\s*/).filter(Boolean);
}

/**
 * Check if a corpus is CJK (no word-separating spaces)
 * @param {string} key - Corpus key
 * @returns {boolean}
 */
function isCjk(key) {
  return key === 'cjk';
}

/**
 * Get N words from a corpus, cycling if needed.
 * For CJK corpuses (no spaces), count = characters instead of words.
 * @param {string} corpus
 * @param {number} count
 * @param {string} corpusKey
 * @returns {string}
 */
function getWords(corpus, count, corpusKey) {
  if (isCjk(corpusKey)) {
    // CJK: slice by character count, cycling if needed
    const chars = [...corpus];
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(chars[i % chars.length]);
    }
    return result.join('');
  }
  const words = corpus.split(/\s+/);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(words[i % words.length]);
  }
  return result.join(' ');
}

/**
 * Parse the data-lorem value to determine what to generate
 * @param {string} value
 * @param {HTMLElement} el
 * @returns {{ mode: string, count: number, corpus: string }}
 */
function parseValue(value, el) {
  const trimmed = (value || '').trim();

  // Explicit corpus override
  if (CORPUSES[trimmed]) {
    return { mode: 'words', count: isCjk(trimmed) ? 80 : 50, corpus: trimmed };
  }

  // "heading" — short text for headings
  if (trimmed === 'heading') {
    return { mode: 'words', count: 5, corpus: detectCorpus(el) };
  }

  // "N sentences"
  const sentenceMatch = trimmed.match(/^(\d+)\s+sentences?$/i);
  if (sentenceMatch) {
    return { mode: 'sentences', count: Number(sentenceMatch[1]), corpus: detectCorpus(el) };
  }

  // "N items" — for lists
  const itemMatch = trimmed.match(/^(\d+)\s+items?$/i);
  if (itemMatch) {
    return { mode: 'items', count: Number(itemMatch[1]), corpus: detectCorpus(el) };
  }

  // Pure number — word count
  const numMatch = trimmed.match(/^(\d+)$/);
  if (numMatch) {
    return { mode: 'words', count: Number(numMatch[1]), corpus: detectCorpus(el) };
  }

  // Default — one paragraph (~50 words, or ~80 characters for CJK)
  const corpus = detectCorpus(el);
  return { mode: 'words', count: isCjk(corpus) ? 80 : 50, corpus };
}

/**
 * Generate lorem text content
 * @param {{ mode: string, count: number, corpus: string }} parsed
 * @returns {string|string[]}
 */
function generateText(parsed) {
  const text = CORPUSES[parsed.corpus];
  const sentences = getSentences(text);

  if (parsed.mode === 'sentences') {
    const result = [];
    for (let i = 0; i < parsed.count; i++) {
      result.push(sentences[i % sentences.length]);
    }
    return result.join(' ');
  }

  if (parsed.mode === 'items') {
    // Return array of sentence-length items
    const items = [];
    for (let i = 0; i < parsed.count; i++) {
      items.push(sentences[i % sentences.length]);
    }
    return items;
  }

  return getWords(text, parsed.count, parsed.corpus);
}

/**
 * Enhance a single element with lorem content
 * @param {HTMLElement} el
 */
function enhanceLorem(el) {
  if (el.hasAttribute('data-lorem-init')) return;
  el.setAttribute('data-lorem-init', '');

  const parsed = parseValue(el.dataset.lorem ?? '', el);
  const content = generateText(parsed);
  const tag = el.tagName.toLowerCase();

  if (parsed.mode === 'items' && Array.isArray(content) && (tag === 'ul' || tag === 'ol')) {
    el.innerHTML = content.map(item => `<li>${item}</li>`).join('');
  } else if (Array.isArray(content)) {
    el.textContent = content.join(' ');
  } else {
    el.textContent = content;
  }

  // Mark as filled for wireframe CSS hooks
  el.setAttribute('data-lorem-filled', '');
  el.setAttribute('translate', 'no');
}

/**
 * Initialize all lorem elements within a root
 * @param {Element|Document} root
 */
function initLorem(root = document) {
  root.querySelectorAll(SELECTOR).forEach(enhanceLorem);
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initLorem());
} else {
  initLorem();
}

// Watch for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = /** @type {Element} */ (node);
      if (el.matches(SELECTOR)) enhanceLorem(/** @type {HTMLElement} */ (el));
      el.querySelectorAll(SELECTOR).forEach(child => enhanceLorem(/** @type {HTMLElement} */ (child)));
    }
  }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

export { initLorem };
