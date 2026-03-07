/**
 * Particles effect — floating sparkle particles.
 * Migrated from kawaii.effects.js to VB.effect() API.
 */

import { VB } from '../../../lib/vb.js'

const SPARKLE_CHARS = ['✦', '✧', '⋆', '♡', '☆']
const SPARKLE_COLORS = [
  'oklch(75% 0.18 350)',
  'oklch(70% 0.15 290)',
  'oklch(75% 0.12 60)',
  'oklch(70% 0.12 220)',
  'oklch(65% 0.15 180)',
]

VB.effect('particles', (el) => {
  if (el._sparkleInterval) return

  if (VB.prefersReducedMotion()) {
    const pos = getComputedStyle(el).position
    if (pos === 'static') el.style.position = 'relative'
    for (let i = 0; i < 5; i++) {
      const span = document.createElement('span')
      span.textContent = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)]
      span.setAttribute('aria-hidden', 'true')
      span.style.cssText = `
        position: absolute; pointer-events: none;
        font-size: ${0.5 + Math.random() * 0.6}rem;
        color: ${SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)]};
        left: ${10 + Math.random() * 80}%;
        top: ${10 + Math.random() * 80}%;
        opacity: 0.4; z-index: 0;
      `
      el.appendChild(span)
    }
    return
  }

  const pos = getComputedStyle(el).position
  if (pos === 'static') el.style.position = 'relative'
  el.style.overflow = 'hidden'

  function spawnParticle() {
    const span = document.createElement('span')
    span.textContent = SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)]
    span.setAttribute('aria-hidden', 'true')
    span.style.cssText = `
      position: absolute; pointer-events: none;
      font-size: ${0.6 + Math.random() * 0.8}rem;
      color: ${SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)]};
      left: ${Math.random() * 100}%;
      top: ${80 + Math.random() * 20}%;
      opacity: 0; z-index: 0;
      animation: vb-kawaii-particle ${2 + Math.random() * 3}s ease-out forwards;
    `
    el.appendChild(span)
    setTimeout(() => span.remove(), 5000)
  }

  if (!document.getElementById('vb-kawaii-particle-style')) {
    const style = document.createElement('style')
    style.id = 'vb-kawaii-particle-style'
    style.textContent = `
      @keyframes vb-kawaii-particle {
        0%   { opacity: 0; transform: translateY(0) rotate(0deg) scale(0.5); }
        20%  { opacity: 1; }
        80%  { opacity: 0.6; }
        100% { opacity: 0; transform: translateY(-120px) rotate(180deg) scale(0.3); }
      }
    `
    document.head.appendChild(style)
  }

  el._sparkleInterval = setInterval(spawnParticle, 600)
  for (let i = 0; i < 3; i++) setTimeout(spawnParticle, i * 200)

  return {
    cleanup() {
      if (el._sparkleInterval) {
        clearInterval(el._sparkleInterval)
        el._sparkleInterval = null
      }
      el.querySelectorAll('[aria-hidden="true"]').forEach(s => {
        if (s.style.animation?.includes('vb-kawaii-particle')) s.remove()
      })
    },
  }
})
