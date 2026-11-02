/**
 * audio-visualizer: Canvas-based audio visualization companion
 *
 * Connects to any <audio> element via the `for` attribute (matching an ID),
 * draws frequency or waveform data on a canvas. Separated from <audio-player>
 * so it can pair with any audio source independently.
 *
 * @attr {string} for - Required. ID of the target <audio> element
 * @attr {string} data-mode - Visualization mode: "bars" (default), "waveform", "circle"
 * @attr {number} data-fft-size - AnalyserNode FFT size (power of 2, 32-32768). Default: 256
 *
 * @example
 * <audio id="my-track" controls>
 *   <source src="track.mp3" type="audio/mpeg">
 * </audio>
 * <audio-visualizer for="my-track" data-mode="bars"></audio-visualizer>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';

// Page-level AudioContext singleton registry
const audioContextRegistry = new Map()

function getSharedContext() {
  if (!audioContextRegistry.has('default')) {
    try {
      audioContextRegistry.set('default', new AudioContext())
    } catch {
      return null
    }
  }
  return audioContextRegistry.get('default')
}

// Track which audio elements already have a MediaElementSource. An element
// can only ever have one, and once it exists ALL of the element's output is
// routed through the graph — so the source is wired to the destination exactly
// once, here. Each visualizer's analyser is a passive tap (source → analyser,
// output unconnected), so N visualizers on one <audio> don't sum to N× volume.
const sourceRegistry = new WeakMap()

function getMediaSource(audio, ctx) {
  if (sourceRegistry.has(audio)) return sourceRegistry.get(audio)
  const source = ctx.createMediaElementSource(audio)
  source.connect(ctx.destination)
  sourceRegistry.set(audio, source)
  return source
}

/**
 * Clamp a data-fft-size value to a valid AnalyserNode.fftSize: a power of two
 * in [32, 32768]. Non-numeric values fall back to 256; others round to the
 * nearest power of two.
 * @param {string | null} raw
 * @returns {number}
 */
function normalizeFftSize(raw) {
  const n = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(n) || n <= 0) return 256
  const pow = 2 ** Math.round(Math.log2(n))
  return Math.min(32768, Math.max(32, pow))
}

/**
 * True when the audio's source is cross-origin and the element has no
 * crossorigin attribute. Hooking such an element with createMediaElementSource
 * makes the browser output silence (the media is CORS-tainted), so the
 * visualizer must leave it alone.
 * @param {HTMLAudioElement} audio
 */
function isOpaqueCrossOrigin(audio) {
  if (audio.crossOrigin != null) return false
  const src = audio.currentSrc || audio.src
    || /** @type {HTMLSourceElement | null} */ (audio.querySelector('source[src]'))?.src || ''
  if (!src) return false
  try {
    const url = new URL(src, location.href)
    if (url.protocol === 'data:' || url.protocol === 'blob:') return false
    return url.origin !== location.origin
  } catch {
    return false
  }
}

/** Audio elements already warned about, so the console note appears once. */
const warnedCrossOrigin = new WeakSet()

class AudioVisualizerElement extends VBElement {

  /** @type {HTMLCanvasElement} */
  #canvas = /** @type {*} */ (null)
  /** @type {CanvasRenderingContext2D} */
  #ctx = /** @type {*} */ (null)
  /** @type {HTMLAudioElement} */
  #audio = /** @type {*} */ (null)
  /** @type {AudioContext} */
  #audioCtx = /** @type {*} */ (null)
  /** @type {AnalyserNode} */
  #analyser = /** @type {*} */ (null)
  /** @type {MediaElementAudioSourceNode} */
  #source = /** @type {*} */ (null)
  /** @type {number | null} */
  #rafId = null
  /** @type {IntersectionObserver | null} */
  #observer = null
  #visible = true
  #started = false
  #reducedMotion = false
  /** @type {(() => void) | null} */
  #onThemeChange = null
  /** @type {HTMLAudioElement | null} The <audio> currently carrying our play listener */
  #boundAudio = null
  #onPlay = () => this.#initAudio()

  // ─── Observed attributes ───────────────────────────────────────────────

  static get observedAttributes() {
    return ['for', 'data-mode', 'data-fft-size']
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  setup() {
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    this.#buildShadow()
    this.#findAudio()
    // Both re-run on every connect: teardown disconnects the observer and
    // listen() drops the media-query listener, so a moved element must
    // re-arm them or its draw loop never resumes.
    this.#setupIntersectionObserver()
    this.#watchMotionPreference()

    // Re-attach the analyser tap removed in teardown (reconnect after a move)
    if (this.#started && this.#source && this.#analyser) {
      try { this.#source.connect(this.#analyser) } catch { /* already connected */ }
    }

    // Force style recalculation when theme changes (shadow DOM may not re-resolve custom properties)
    this.#onThemeChange = () => {
      const canvas = this.shadowRoot?.querySelector('canvas')
      if (canvas) {
        canvas.style.display = 'none'
        canvas.offsetHeight
        canvas.style.display = ''
      }
    }
    this.listen(window, 'vb:theme-change', this.#onThemeChange)
  }

  teardown() {
    this.#stopAnimation()
    this.#observer?.disconnect()
    this.#boundAudio?.removeEventListener('play', this.#onPlay)
    this.#boundAudio = null
    // Drop the analyser tap; the source → destination path stays intact
    if (this.#source && this.#analyser) {
      try { this.#source.disconnect(this.#analyser) } catch { /* not connected */ }
    }
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return
    if (name === 'for') this.#findAudio()
    else if (name === 'data-fft-size' && this.#analyser) {
      this.#analyser.fftSize = normalizeFftSize(this.getAttribute('data-fft-size'))
    }
  }

  // ─── Shadow DOM ────────────────────────────────────────────────────────

  #buildShadow() {
    if (this.shadowRoot) return
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          --_color: var(--audio-visualizer-color, var(--color-primary, oklch(55% 0.2 260)));
          --_bg: var(--audio-visualizer-bg, var(--color-surface-sunken, transparent));
          --_height: var(--audio-visualizer-height, 80px);
          --_radius: var(--audio-visualizer-radius, var(--radius-m, 0.5rem));
        }
        canvas {
          display: block;
          width: 100%;
          height: var(--_height);
          background: var(--_bg);
          border-radius: var(--_radius);
        }
      </style>
      <canvas aria-hidden="true"></canvas>
    `
    this.#canvas = /** @type {HTMLCanvasElement} */ (shadow.querySelector('canvas'))
  }

  // ─── Audio connection ──────────────────────────────────────────────────

  #findAudio() {
    const forId = this.getAttribute('for')
    if (!forId) return

    const audio = /** @type {HTMLAudioElement | null} */ (document.getElementById(forId))
    if (!audio || audio.tagName !== 'AUDIO') return
    this.#audio = audio

    if (this.#started) return

    // Set up AudioContext lazily on play (a user gesture, so the context can
    // start). The listener stays armed until setup succeeds, so a skipped
    // cross-origin source can still be picked up after a src change.
    if (this.#boundAudio !== audio) {
      this.#boundAudio?.removeEventListener('play', this.#onPlay)
      audio.addEventListener('play', this.#onPlay)
      this.#boundAudio = audio
    }
    if (!audio.paused) this.#initAudio()
  }

  #initAudio() {
    if (this.#started || !this.#audio) return
    const audio = this.#audio

    if (!sourceRegistry.has(audio) && isOpaqueCrossOrigin(audio)) {
      this.setAttribute('data-state', 'cross-origin')
      if (!warnedCrossOrigin.has(audio)) {
        warnedCrossOrigin.add(audio)
        console.warn('<audio-visualizer>: not visualising a cross-origin <audio> without crossorigin="anonymous" and CORS headers — hooking it would mute playback.', audio)
      }
      return
    }

    const ctx = getSharedContext()
    if (!ctx) return

    let analyser
    let source
    try {
      analyser = ctx.createAnalyser()
      analyser.fftSize = normalizeFftSize(this.getAttribute('data-fft-size'))
      analyser.smoothingTimeConstant = 0.8
      source = getMediaSource(audio, ctx)
      source.connect(analyser)
    } catch (err) {
      this.setAttribute('data-state', 'error')
      console.warn('<audio-visualizer>: could not connect to the audio element.', err)
      return
    }

    this.#audioCtx = ctx
    this.#analyser = analyser
    this.#source = source
    this.#started = true
    if (this.getAttribute('data-state') !== null) this.removeAttribute('data-state')
    this.#boundAudio?.removeEventListener('play', this.#onPlay)
    this.#boundAudio = null

    // Resume a suspended context (autoplay policy); a rejection just means no
    // gesture yet — the next play() will retry via the browser's own unlock.
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    this.#startAnimation()
  }

  // ─── Animation loop ────────────────────────────────────────────────────

  #startAnimation() {
    if (this.#reducedMotion || this.#rafId) return

    const draw = () => {
      if (!this.#visible || this.#reducedMotion) {
        this.#rafId = null
        return
      }
      this.#rafId = requestAnimationFrame(draw)
      this.#drawFrame()
    }
    this.#rafId = requestAnimationFrame(draw)
  }

  #stopAnimation() {
    if (this.#rafId) {
      cancelAnimationFrame(this.#rafId)
      this.#rafId = null
    }
  }

  #drawFrame() {
    const canvas = this.#canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1)
    const H = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1)

    const style = getComputedStyle(this)
    const color = style.getPropertyValue('--_color').trim() || 'oklch(55% 0.2 260)'
    const bg = style.getPropertyValue('--_bg').trim()

    // Clear and fill background
    ctx.clearRect(0, 0, W, H)
    if (bg && bg !== 'transparent') {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
    }

    if (!this.#analyser) return

    const mode = this.getAttribute('data-mode') || 'bars'
    const bufferLength = this.#analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    if (mode === 'waveform') {
      this.#analyser.getByteTimeDomainData(dataArray)
      this.#drawWaveform(ctx, W, H, color, dataArray)
    } else if (mode === 'circle') {
      this.#analyser.getByteFrequencyData(dataArray)
      this.#drawCircle(ctx, W, H, color, dataArray)
    } else {
      this.#analyser.getByteFrequencyData(dataArray)
      this.#drawBars(ctx, W, H, color, dataArray)
    }
  }

  // ─── Visualization modes ───────────────────────────────────────────────

  #drawBars(ctx, W, H, color, data) {
    const count = Math.min(data.length, 64)
    const barW = (W / count) - 1
    ctx.fillStyle = color

    for (let i = 0; i < count; i++) {
      const pct = data[i] / 255
      const barH = pct * H
      const x = i * (W / count)
      ctx.fillRect(x, H - barH, barW, barH)
    }
  }

  #drawWaveform(ctx, W, H, color, data) {
    const sliceW = W / data.length
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128
      const y = (v * H) / 2
      i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sliceW, y)
    }
    ctx.stroke()
  }

  #drawCircle(ctx, W, H, color, data) {
    const cx = W / 2
    const cy = H / 2
    const radius = Math.min(W, H) * 0.25
    const count = data.length

    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const amp = (data[i] / 255) * (radius * 0.8)
      const r = radius + amp
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }

  // ─── Intersection observer ─────────────────────────────────────────────

  #setupIntersectionObserver() {
    this.#observer ??= new IntersectionObserver(([entry]) => {
      this.#visible = entry.isIntersecting
      if (this.#visible && this.#started && !this.#rafId && !this.#reducedMotion) {
        this.#startAnimation()
      }
    })
    this.#observer.observe(this)
  }

  // ─── Reduced motion ────────────────────────────────────────────────────

  #watchMotionPreference() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.listen(mq, 'change', (e) => {
      this.#reducedMotion = /** @type {MediaQueryListEvent} */ (e).matches
      if (this.#reducedMotion) {
        this.#stopAnimation()
      } else if (this.#started && this.#visible && !this.#rafId) {
        this.#startAnimation()
      }
    })
  }
}

registerComponent('audio-visualizer', AudioVisualizerElement)

export { AudioVisualizerElement }
