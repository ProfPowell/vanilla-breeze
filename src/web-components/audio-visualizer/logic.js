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

const MODES = new Set(['bars', 'waveform', 'circle'])

/** @param {string | null} raw */
function normalizeMode(raw) {
  return raw && MODES.has(raw) ? raw : 'bars'
}

const FALLBACK_COLOR = 'oklch(55% 0.2 260)'

/** Silence, for the idle / reduced-motion baseline frame */
const SILENT_TIME = new Uint8Array(256).fill(128)
const SILENT_FREQ = new Uint8Array(128)

class AudioVisualizerElement extends VBElement {

  /** @type {HTMLCanvasElement} */
  #canvas = /** @type {*} */ (null)
  /** @type {CanvasRenderingContext2D | null} Cached 2D context */
  #ctx = null
  /** @type {HTMLAudioElement | null} */
  #audio = null
  /** @type {AnalyserNode | null} */
  #analyser = null
  /** @type {MediaElementAudioSourceNode | null} */
  #source = null
  /** Reused sample buffers: frequency (frequencyBinCount) and time domain (fftSize) */
  #freqData = new Uint8Array(0)
  #timeData = new Uint8Array(0)
  /** Cached resolved colours (refreshed on theme / colour-scheme change) */
  #color = FALLBACK_COLOR
  #bg = ''
  #mode = 'bars'
  /** @type {number | null} */
  #rafId = null
  /** @type {IntersectionObserver | null} */
  #observer = null
  /** @type {ResizeObserver | null} */
  #resizeObserver = null
  #visible = true
  #started = false
  #reducedMotion = false
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
    this.#mode = normalizeMode(this.getAttribute('data-mode'))

    this.#buildShadow()
    this.#readColors()
    this.#findAudio()
    // Re-run on every connect: teardown disconnects the observers and
    // listen() drops the media-query listeners, so a moved element must
    // re-arm them or its draw loop never resumes.
    this.#setupIntersectionObserver()
    this.#setupResizeObserver()
    this.#watchMotionPreference()

    // Re-attach the analyser tap removed in teardown (reconnect after a move)
    if (this.#started && this.#source && this.#analyser) {
      try { this.#source.connect(this.#analyser) } catch { /* already connected */ }
      this.#startAnimation()
    }

    // Colours come from custom properties: re-resolve them when the theme or
    // colour scheme changes instead of calling getComputedStyle every frame.
    const recolor = () => requestAnimationFrame(() => {
      this.#readColors()
      if (!this.#rafId) this.#drawFrame()
    })
    this.listen(window, 'vb:theme-change', recolor)
    this.listen(window.matchMedia('(prefers-color-scheme: dark)'), 'change', recolor)
  }

  teardown() {
    this.#stopAnimation()
    this.#observer?.disconnect()
    this.#resizeObserver?.disconnect()
    this.#boundAudio?.removeEventListener('play', this.#onPlay)
    this.#boundAudio = null
    // Drop the analyser tap; the source → destination path stays intact
    this.#untap()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return
    if (name === 'data-mode') {
      this.#mode = normalizeMode(newValue)
      if (this.isConnected && !this.#rafId) this.#drawFrame()
      return
    }
    if (!this.isConnected) return
    if (name === 'for') this.#findAudio()
    else if (name === 'data-fft-size' && this.#analyser) {
      this.#analyser.fftSize = normalizeFftSize(newValue)
      this.#allocBuffers()
      if (!this.#rafId) this.#drawFrame()
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
          --_color: var(--audio-visualizer-color, var(--color-primary, ${FALLBACK_COLOR}));
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
    this.#ctx = this.#canvas.getContext('2d')
  }

  #readColors() {
    const style = getComputedStyle(this)
    this.#color = style.getPropertyValue('--_color').trim() || FALLBACK_COLOR
    this.#bg = style.getPropertyValue('--_bg').trim()
  }

  // ─── Audio connection ──────────────────────────────────────────────────

  #findAudio() {
    const forId = this.getAttribute('for')
    const audio = /** @type {HTMLAudioElement | null} */ (forId ? document.getElementById(forId) : null)
    const target = audio?.tagName === 'AUDIO' ? audio : null

    // `for` now points somewhere else: drop the tap on the old audio and
    // start over (the old element keeps its source → destination path).
    if (this.#audio && this.#audio !== target) {
      this.#stopAnimation()
      this.#untap()
      this.#analyser = null
      this.#source = null
      this.#started = false
      if (this.getAttribute('data-state') !== null) this.removeAttribute('data-state')
      this.#drawFrame()
    }
    this.#audio = target
    if (!target) {
      this.#boundAudio?.removeEventListener('play', this.#onPlay)
      this.#boundAudio = null
      return
    }

    if (this.#started) return

    // Set up AudioContext lazily on play (a user gesture, so the context can
    // start). The listener stays armed until setup succeeds, so a skipped
    // cross-origin source can still be picked up after a src change.
    if (this.#boundAudio !== target) {
      this.#boundAudio?.removeEventListener('play', this.#onPlay)
      target.addEventListener('play', this.#onPlay)
      this.#boundAudio = target
    }
    if (!target.paused) this.#initAudio()
  }

  #untap() {
    if (this.#source && this.#analyser) {
      try { this.#source.disconnect(this.#analyser) } catch { /* not connected */ }
    }
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

    this.#analyser = analyser
    this.#source = source
    this.#allocBuffers()
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

  /** Size the sample buffers to the analyser: they are reused every frame. */
  #allocBuffers() {
    if (!this.#analyser) return
    if (this.#freqData.length !== this.#analyser.frequencyBinCount) {
      this.#freqData = new Uint8Array(this.#analyser.frequencyBinCount)
    }
    if (this.#timeData.length !== this.#analyser.fftSize) {
      this.#timeData = new Uint8Array(this.#analyser.fftSize)
    }
  }

  // ─── Animation loop ────────────────────────────────────────────────────

  #startAnimation() {
    if (this.#rafId) return
    // Reduced motion: one static frame, no loop
    if (this.#reducedMotion) {
      this.#drawFrame()
      return
    }

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

  /** Match the canvas backing store to its CSS box (device pixels). */
  #resize() {
    const dpr = window.devicePixelRatio || 1
    const w = Math.round(this.#canvas.clientWidth * dpr)
    const h = Math.round(this.#canvas.clientHeight * dpr)
    if (this.#canvas.width !== w) this.#canvas.width = w
    if (this.#canvas.height !== h) this.#canvas.height = h
  }

  /**
   * Draw one frame. While animating it reads the analyser; otherwise (not
   * started yet, reduced motion before playback) it draws a flat baseline so
   * the box is never blank. Under reduced motion the analyser snapshot is
   * drawn once, as a static frame.
   */
  #drawFrame() {
    const ctx = this.#ctx
    if (!ctx) return
    const W = this.#canvas.width
    const H = this.#canvas.height
    if (!W || !H) return

    ctx.clearRect(0, 0, W, H)
    if (this.#bg && this.#bg !== 'transparent') {
      ctx.fillStyle = this.#bg
      ctx.fillRect(0, 0, W, H)
    }

    const analyser = this.#started ? this.#analyser : null
    const mode = this.#mode
    if (mode === 'waveform') {
      // Time-domain data: fftSize samples, into a buffer of exactly that size
      if (analyser) analyser.getByteTimeDomainData(this.#timeData)
      this.#drawWaveform(ctx, W, H, this.#color, analyser ? this.#timeData : SILENT_TIME)
      return
    }
    if (analyser) analyser.getByteFrequencyData(this.#freqData)
    const data = analyser ? this.#freqData : SILENT_FREQ
    if (mode === 'circle') this.#drawCircle(ctx, W, H, this.#color, data)
    else this.#drawBars(ctx, W, H, this.#color, data)
  }

  // ─── Visualization modes ───────────────────────────────────────────────

  #drawBars(ctx, W, H, color, data) {
    const count = Math.min(data.length, 64)
    const step = W / count
    const barW = Math.max(1, step - 1)
    // Silent bins still show a thin baseline rather than nothing
    const minH = Math.max(1, Math.round(H * 0.03))
    ctx.fillStyle = color

    for (let i = 0; i < count; i++) {
      const barH = Math.max(minH, (data[i] / 255) * H)
      ctx.fillRect(i * step, H - barH, barW, barH)
    }
  }

  #drawWaveform(ctx, W, H, color, data) {
    const sliceW = W / Math.max(1, data.length - 1)
    ctx.strokeStyle = color
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1)
    ctx.beginPath()

    for (let i = 0; i < data.length; i++) {
      const y = (data[i] / 255) * H
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
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1)
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

  // ─── Observers ─────────────────────────────────────────────────────────

  #setupIntersectionObserver() {
    this.#observer ??= new IntersectionObserver(([entry]) => {
      this.#visible = entry.isIntersecting
      if (this.#visible && this.#started && !this.#rafId && !this.#reducedMotion) {
        this.#startAnimation()
      }
    })
    this.#observer.observe(this)
  }

  #setupResizeObserver() {
    this.#resizeObserver ??= new ResizeObserver(() => {
      this.#resize()
      // A resize clears the canvas: repaint when the loop isn't running
      if (!this.#rafId) this.#drawFrame()
    })
    this.#resizeObserver.observe(this.#canvas)
  }

  // ─── Reduced motion ────────────────────────────────────────────────────

  #watchMotionPreference() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.listen(mq, 'change', (e) => {
      this.#reducedMotion = /** @type {MediaQueryListEvent} */ (e).matches
      if (this.#reducedMotion) {
        this.#stopAnimation()
        this.#drawFrame()
      } else if (this.#started && this.#visible && !this.#rafId) {
        this.#startAnimation()
      }
    })
  }
}

registerComponent('audio-visualizer', AudioVisualizerElement)

export { AudioVisualizerElement }
