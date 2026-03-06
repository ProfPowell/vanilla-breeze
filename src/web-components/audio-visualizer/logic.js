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

// Track which audio elements already have a MediaElementSource
const sourceRegistry = new WeakMap()

function getMediaSource(audio, ctx) {
  if (sourceRegistry.has(audio)) return sourceRegistry.get(audio)
  const source = ctx.createMediaElementSource(audio)
  sourceRegistry.set(audio, source)
  return source
}

class AudioVisualizerElement extends HTMLElement {

  #canvas = null
  #ctx = null
  #audio = null
  #audioCtx = null
  #analyser = null
  #source = null
  #rafId = null
  #observer = null
  #visible = true
  #started = false
  #reducedMotion = false

  // ─── Observed attributes ───────────────────────────────────────────────

  static get observedAttributes() {
    return ['for', 'data-mode', 'data-fft-size']
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  connectedCallback() {
    this.#reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    this.#buildShadow()
    this.#findAudio()
    this.#setupIntersectionObserver()
    this.#watchMotionPreference()
  }

  disconnectedCallback() {
    this.#stopAnimation()
    this.#observer?.disconnect()
  }

  attributeChangedCallback(name) {
    if (name === 'for') this.#findAudio()
  }

  // ─── Shadow DOM ────────────────────────────────────────────────────────

  #buildShadow() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          --_color: var(--audio-visualizer-color, var(--color-primary, oklch(55% 0.2 260)));
          --_bg: var(--audio-visualizer-bg, transparent);
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
    this.#canvas = shadow.querySelector('canvas')
  }

  // ─── Audio connection ──────────────────────────────────────────────────

  #findAudio() {
    const forId = this.getAttribute('for')
    if (!forId) return

    this.#audio = document.getElementById(forId)
    if (!this.#audio || this.#audio.tagName !== 'AUDIO') return

    // Set up AudioContext lazily on first play
    if (!this.#started) {
      this.#audio.addEventListener('play', () => this.#initAudio(), { once: true })
    }
  }

  #initAudio() {
    if (this.#started) return
    this.#started = true

    this.#audioCtx = getSharedContext()
    if (!this.#audioCtx) return

    // Resume suspended context
    if (this.#audioCtx.state === 'suspended') {
      this.#audioCtx.resume()
    }

    const fftSize = parseInt(this.getAttribute('data-fft-size') || '256', 10)
    this.#analyser = this.#audioCtx.createAnalyser()
    this.#analyser.fftSize = fftSize
    this.#analyser.smoothingTimeConstant = 0.8

    this.#source = getMediaSource(this.#audio, this.#audioCtx)
    this.#source.connect(this.#analyser)
    this.#analyser.connect(this.#audioCtx.destination)

    this.#startAnimation()
  }

  // ─── Animation loop ────────────────────────────────────────────────────

  #startAnimation() {
    if (this.#reducedMotion) return

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
    const W = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1)
    const H = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1)

    const style = getComputedStyle(this)
    const color = style.getPropertyValue('--_color').trim() || 'oklch(55% 0.2 260)'
    const bg = style.getPropertyValue('--_bg').trim() || 'transparent'

    // Clear
    ctx.clearRect(0, 0, W, H)
    if (bg !== 'transparent') {
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
    this.#observer = new IntersectionObserver(([entry]) => {
      this.#visible = entry.isIntersecting
      if (this.#visible && this.#started && !this.#rafId && !this.#reducedMotion) {
        this.#startAnimation()
      }
    })
    this.#observer.observe(this)
  }

  // ─── Reduced motion ────────────────────────────────────────────────────

  #watchMotionPreference() {
    window.matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', (e) => {
        this.#reducedMotion = e.matches
        if (e.matches) {
          this.#stopAnimation()
        } else if (this.#started && this.#visible) {
          this.#startAnimation()
        }
      })
  }
}

customElements.define('audio-visualizer', AudioVisualizerElement)

export { AudioVisualizerElement }
