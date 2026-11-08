/**
 * split-text — accessible text splitting for the text effects
 * (reveal, blur-reveal, typewriter, scramble, flipboard).
 *
 * Only TEXT NODES are split. Inline elements (links, em, code, …) stay in
 * place, so their semantics, focus and styles survive; the text inside them
 * is split the same way.
 *
 * Every split text node becomes a pair:
 *
 *   <span class="vb-split-sr">original text</span>          ← read by AT, visually hidden
 *   <span class="vb-split" aria-hidden="true">…chunks…</span> ← animated, hidden from AT
 *
 * so the full text is exposed to assistive technology exactly once, in
 * reading order, and works on any host (aria-label is prohibited on the
 * generic and paragraph roles of span, p, li…). Chunks are words (default)
 * or grapheme clusters via Intl.Segmenter, so emoji, combining marks and
 * surrogate pairs are never cut in half.
 *
 * The split is reversible and stateless: unsplit() rebuilds the original
 * text nodes from the .vb-split-sr copies, which also repairs an element
 * that was cloned after it was split (cloneNode, <template> reuse).
 */

export const SR_CLASS = 'vb-split-sr'
export const VIS_CLASS = 'vb-split'

/** Locale for segmentation: nearest lang, else the document's. */
function localeOf(el) {
  return el.closest?.('[lang]')?.getAttribute('lang') || undefined
}

/**
 * Split text into grapheme clusters (user-perceived characters).
 * @param {string} text
 * @param {string} [locale]
 * @returns {string[]}
 */
export function graphemes(text, locale) {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const seg = new Intl.Segmenter(locale, { granularity: 'grapheme' })
      return Array.from(seg.segment(text), (s) => s.segment)
    } catch { /* invalid locale tag: fall through */ }
  }
  return Array.from(text) // code points: still never splits a surrogate pair
}

/**
 * Split text into word chunks and the whitespace between them. Punctuation
 * sticks to the neighbouring word ("Hello," not "Hello" + ","), and scripts
 * written without spaces (CJK, Thai) still break into words where
 * Intl.Segmenter can find them.
 * @param {string} text
 * @param {string} [locale]
 * @returns {{ text: string, space: boolean }[]}
 */
export function words(text, locale) {
  /** @type {{ text: string, space: boolean }[]} */
  const out = []
  let segments
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      segments = Array.from(new Intl.Segmenter(locale, { granularity: 'word' }).segment(text))
    } catch { segments = null }
  }
  if (!segments) {
    for (const part of text.split(/(\s+)/)) {
      if (part) out.push({ text: part, space: /^\s+$/.test(part) })
    }
    return out
  }
  let prefix = ''
  for (const s of segments) {
    if (/^\s+$/.test(s.segment)) {
      if (prefix) { out.push({ text: prefix, space: false }); prefix = '' }
      out.push({ text: s.segment, space: true })
      continue
    }
    const prev = out[out.length - 1]
    if (!s.isWordLike) {
      // Punctuation: glue to the previous word, or hold it for the next one.
      if (prev && !prev.space) prev.text += s.segment
      else prefix += s.segment
      continue
    }
    out.push({ text: prefix + s.segment, space: false })
    prefix = ''
  }
  if (prefix) out.push({ text: prefix, space: false })
  return out
}

/**
 * Undo splitText() (or a split copied by cloneNode). Safe to call on an
 * element that was never split.
 * @param {Element} el
 */
export function unsplit(el) {
  for (const sr of el.querySelectorAll(`.${SR_CLASS}`)) {
    const vis = sr.nextElementSibling
    if (vis?.classList.contains(VIS_CLASS)) vis.remove()
    sr.replaceWith(document.createTextNode(sr.textContent || ''))
  }
  el.normalize()
}

/**
 * Visible text of the element, ignoring an existing split's hidden copies.
 * @param {Element} el
 * @returns {string}
 */
export function plainText(el) {
  const srs = el.querySelectorAll(`.${SR_CLASS}`)
  if (!srs.length) return el.textContent || ''
  return Array.from(srs, (s) => s.textContent).join('')
}

/**
 * Split the element's text nodes into chunk spans.
 *
 * @param {Element} el
 * @param {object} [opts]
 * @param {'word'|'grapheme'} [opts.unit='word']
 * @param {string} [opts.className]  class for every chunk span
 * @param {string} [opts.locale]     segmentation locale (default: nearest lang)
 * @returns {HTMLSpanElement[]} chunk spans in reading order (whitespace
 *   between words is a plain text node, not a chunk; in grapheme mode
 *   whitespace chunks carry data-space)
 */
export function splitText(el, { unit = 'word', className = '', locale } = {}) {
  unsplit(el)
  const lang = locale || localeOf(el)

  /** @type {Text[]} */
  const nodes = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const parent = n.parentElement
      if (parent && parent.closest('script, style, template, svg, math')) return NodeFilter.FILTER_REJECT
      return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })
  while (walker.nextNode()) nodes.push(/** @type {Text} */ (walker.currentNode))

  /** @type {HTMLSpanElement[]} */
  const chunks = []
  const chunk = (text) => {
    const s = document.createElement('span')
    if (className) s.className = className
    s.textContent = text
    chunks.push(s)
    return s
  }

  for (const node of nodes) {
    const text = node.nodeValue || ''
    const sr = document.createElement('span')
    sr.className = SR_CLASS
    sr.textContent = text
    const vis = document.createElement('span')
    vis.className = VIS_CLASS
    vis.setAttribute('aria-hidden', 'true')

    if (unit === 'grapheme') {
      for (const g of graphemes(text, lang)) {
        const s = chunk(g)
        if (/^\s+$/.test(g)) s.setAttribute('data-space', '')
        vis.append(s)
      }
    } else {
      for (const w of words(text, lang)) {
        vis.append(w.space ? document.createTextNode(w.text) : chunk(w.text))
      }
    }
    node.replaceWith(sr, vis)
  }
  return chunks
}

/**
 * Replace the element's content with a hidden-from-AT visual part, keeping
 * the text for AT in a visually hidden copy. For effects that draw their
 * own visual (flipboard cells) instead of chunking the text in place.
 * @param {Element} el
 * @param {string} text  accessible text
 * @returns {HTMLSpanElement} the aria-hidden container to fill
 */
export function replaceWithVisual(el, text) {
  unsplit(el)
  const sr = document.createElement('span')
  sr.className = SR_CLASS
  sr.textContent = text
  const vis = document.createElement('span')
  vis.className = VIS_CLASS
  vis.setAttribute('aria-hidden', 'true')
  el.replaceChildren(sr, vis)
  return vis
}

/**
 * Give each chunk a line index in --i: chunks whose box starts lower than
 * half a chunk below the previous one begin a new line. Every chunk carries
 * the same entrance transform, so relative client rects still give the
 * layout lines (offsetTop would break inside positioned inline elements).
 * @param {HTMLElement[]} chunks
 * @returns {number} line count
 */
export function assignLines(chunks) {
  let line = 0
  let prevTop = null
  for (const c of chunks) {
    const r = c.getBoundingClientRect()
    const top = r.top
    if (prevTop !== null && top - prevTop > r.height / 2) line++
    prevTop = top
    c.style.setProperty('--i', String(line))
  }
  return chunks.length ? line + 1 : 0
}
