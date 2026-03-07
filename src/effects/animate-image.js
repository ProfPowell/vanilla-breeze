/**
 * Animate-image effect — play/pause control for animated images.
 */

import { VB } from '../lib/vb.js'

VB.effect('animate-image', (el) => {
  if (el.hasAttribute('data-effect-animate-image-init')) return
  el.setAttribute('data-effect-animate-image-init', '')

  const img = /** @type {HTMLImageElement} */ (el)

  const wrapper = document.createElement('div')
  wrapper.className = 'animate-image-wrapper'
  if (!img.parentNode) return
  img.parentNode.insertBefore(wrapper, img)
  wrapper.appendChild(img)

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'animate-image-toggle'
  btn.setAttribute('aria-label', 'Pause animation')
  wrapper.appendChild(btn)

  const animatedSrc = img.src
  let staticSrc = null
  let isPaused = false

  function captureFrame() {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    try { staticSrc = canvas.toDataURL('image/png') } catch { staticSrc = null }
  }

  function pause() {
    if (isPaused) return
    isPaused = true
    img.setAttribute('data-animate-image-paused', '')
    btn.setAttribute('aria-label', 'Play animation')
    btn.classList.add('paused')
    if (staticSrc) img.src = staticSrc
  }

  function play() {
    if (!isPaused) return
    isPaused = false
    img.removeAttribute('data-animate-image-paused')
    btn.setAttribute('aria-label', 'Pause animation')
    btn.classList.remove('paused')
    img.src = animatedSrc
  }

  btn.addEventListener('click', () => isPaused ? play() : pause())

  if (img.complete && img.naturalWidth) {
    captureFrame()
  } else {
    img.addEventListener('load', captureFrame, { once: true })
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (mq.matches || document.documentElement.dataset.motionReduced !== undefined) {
    if (img.complete) { captureFrame(); pause() }
    else img.addEventListener('load', () => { captureFrame(); pause() }, { once: true })
  }

  mq.addEventListener('change', (e) => { if (e.matches) pause() })

  if (img.hasAttribute('data-animate-image-paused')) {
    if (img.complete) { captureFrame(); isPaused = false; pause() }
    else img.addEventListener('load', () => { captureFrame(); isPaused = false; pause() }, { once: true })
  }

  return {
    cleanup() {
      if (wrapper.parentNode) {
        wrapper.parentNode.insertBefore(img, wrapper)
        wrapper.remove()
      }
    },
  }
})
