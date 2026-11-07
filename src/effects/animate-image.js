/**
 * Animate-image effect — play/pause control for animated images
 * (GIF, animated WebP/APNG). WCAG 2.2.2 Pause, Stop, Hide.
 *
 * Wraps the image (or its <picture>) in a <span class="animate-image-wrapper">
 * with a toggle button. Pausing shows a still: data-poster when given, else
 * the first frame captured to a canvas. When no still is available (a
 * cross-origin image without CORS taints the canvas), pausing hides the
 * animation and shows its alt text instead, so "paused" is never a lie.
 *
 * Starts paused under reduced motion — prefers-reduced-motion or
 * <html data-motion-reduced>, both watched at runtime — or with
 * data-animate-image-paused.
 *
 * @attr {string}  data-poster               - Still image shown while paused (recommended for cross-origin images)
 * @attr {boolean} data-animate-image-paused - Start paused; reflected while paused
 * @attr {string}  data-label-animation-pause - Button name (default "Pause animation"; "{alt}" inserts the alt text,
 *                                              else ": alt" is appended). Element or ancestor.
 *
 * Do not put the image inside a link: the toggle would be a button nested in a link.
 */

import { VB } from '../lib/vb.js'
import { readLabel } from '../lib/announce.js'

const WRAPPER = 'animate-image-wrapper'

/** @param {HTMLImageElement} img */
function buttonName(img) {
  const alt = (img.getAttribute('alt') || '').trim()
  const template = readLabel(img, 'animation-pause', 'Pause animation')
  if (template.includes('{alt}')) return template.replace('{alt}', alt).trim()
  return alt ? `${template}: ${alt}` : template
}

VB.effect('animate-image', (el) => {
  const img = /** @type {HTMLImageElement} */ (el)
  if (img.tagName !== 'IMG' || !img.parentNode) return { cleanup() {} }
  // Legacy processed flag copied from older markup.
  img.removeAttribute('data-effect-animate-image-init')

  if (!img.hasAttribute('alt')) {
    console.warn('[animate-image] Image has no alt text; describe what the animation shows.', img)
  }

  // A clone of a paused image still points at the still: restore first.
  const savedSrc = img.getAttribute('data-animate-image-src')
  if (savedSrc) {
    img.src = savedSrc
    const savedSrcset = img.getAttribute('data-animate-image-srcset')
    if (savedSrcset) img.srcset = savedSrcset
    img.removeAttribute('data-animate-image-src')
    img.removeAttribute('data-animate-image-srcset')
  }

  // Wrap the <picture> (its <source>s must stay its children), else the img.
  const picture = img.parentElement?.tagName === 'PICTURE' ? img.parentElement : null
  const media = picture || img
  const sources = picture ? [...picture.querySelectorAll(':scope > source')] : []

  // A cloned wrapper arrives with a dead button: reuse the wrapper, rebuild its parts.
  const existing = media.parentElement?.classList.contains(WRAPPER) ? media.parentElement : null
  /** @type {HTMLElement} */
  const wrapper = existing || document.createElement('span')
  if (existing) {
    wrapper.querySelectorAll(':scope > .animate-image-toggle, :scope > .animate-image-placeholder').forEach(n => n.remove())
  } else {
    wrapper.className = WRAPPER
    media.parentNode?.insertBefore(wrapper, media)
    wrapper.appendChild(media)
  }

  const placeholder = document.createElement('span')
  placeholder.className = 'animate-image-placeholder'
  placeholder.hidden = true
  wrapper.appendChild(placeholder)

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'animate-image-toggle'
  btn.setAttribute('aria-pressed', 'false')
  btn.setAttribute('aria-label', buttonName(img))
  wrapper.appendChild(btn)

  const authoredPaused = img.hasAttribute('data-animate-image-paused')
  /** @type {string | null} */
  let stillSrc = img.getAttribute('data-poster')
  let isPaused = false
  let autoPaused = false
  /** @type {{ src: string, srcset: string | null, sizes: string | null, sources: Array<[Element, string | null, string | null]> } | null} */
  let saved = null

  function captureFrame() {
    if (stillSrc || !img.naturalWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    try {
      ctx.drawImage(img, 0, 0)
      stillSrc = canvas.toDataURL('image/png')
    } catch {
      stillSrc = null // tainted (cross-origin): pause will hide instead
    }
  }

  function render() {
    btn.setAttribute('aria-pressed', String(isPaused))
    btn.classList.toggle('paused', isPaused)
    img.toggleAttribute('data-animate-image-paused', isPaused)
  }

  function pause({ auto = false } = {}) {
    if (isPaused) return
    captureFrame()
    isPaused = true
    autoPaused = auto
    // Remember the animated source(s), on the element too so a clone can restore.
    saved = {
      src: img.currentSrc || img.src,
      srcset: img.getAttribute('srcset'),
      sizes: img.getAttribute('sizes'),
      sources: sources.map(s => [s, s.getAttribute('srcset'), s.getAttribute('sizes')]),
    }
    img.setAttribute('data-animate-image-src', img.getAttribute('src') || saved.src)
    if (saved.srcset) img.setAttribute('data-animate-image-srcset', saved.srcset)

    if (stillSrc) {
      // srcset and <source> win over src: take them out while paused.
      for (const [s] of saved.sources) { s.removeAttribute('srcset'); s.removeAttribute('sizes') }
      img.removeAttribute('srcset')
      img.removeAttribute('sizes')
      img.src = stillSrc
    } else {
      // No still frame: hide the animation, show its description.
      placeholder.textContent = img.getAttribute('alt') || ''
      placeholder.hidden = false
      wrapper.setAttribute('data-animate-image-hidden', '')
    }
    render()
  }

  function play() {
    if (!isPaused) return
    isPaused = false
    autoPaused = false
    if (saved) {
      for (const [s, srcset, sizes] of saved.sources) {
        if (srcset != null) s.setAttribute('srcset', srcset)
        if (sizes != null) s.setAttribute('sizes', sizes)
      }
      if (saved.sizes != null) img.setAttribute('sizes', saved.sizes)
      if (saved.srcset != null) img.setAttribute('srcset', saved.srcset)
      img.src = img.getAttribute('data-animate-image-src') || saved.src
    }
    saved = null
    img.removeAttribute('data-animate-image-src')
    img.removeAttribute('data-animate-image-srcset')
    placeholder.hidden = true
    wrapper.removeAttribute('data-animate-image-hidden')
    render()
  }

  btn.addEventListener('click', () => isPaused ? play() : pause())

  /** Run once the image has decoded enough to capture a frame. */
  function whenLoaded(fn) {
    if (img.complete && img.naturalWidth) fn()
    else img.addEventListener('load', fn, { once: true })
  }

  whenLoaded(captureFrame)

  if (authoredPaused) {
    whenLoaded(() => pause())
  } else if (VB.prefersReducedMotion()) {
    whenLoaded(() => pause({ auto: true }))
  }

  // Reduced motion can switch at runtime (OS setting, settings-panel).
  const onMotionChange = () => {
    if (VB.prefersReducedMotion()) whenLoaded(() => pause({ auto: true }))
    else if (autoPaused) play()
  }
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', onMotionChange)
  const rootObserver = new MutationObserver(onMotionChange)
  rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion-reduced'] })

  return {
    cleanup() {
      mq.removeEventListener('change', onMotionChange)
      rootObserver.disconnect()
      if (isPaused) play()
      img.toggleAttribute('data-animate-image-paused', authoredPaused)
      btn.remove()
      placeholder.remove()
      if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(media, wrapper)
        wrapper.remove()
      }
    },
  }
})
