/**
 * audio-player — Retro Bundle
 * Vanilla Breeze · Contract v1.0.0
 *
 * A phosphor-screen audio player with oscilloscope/spectrum visualizer.
 * Chrome: retro, beveled, CRT-inspired.
 * Token layer: inherits from whatever theme is active automatically.
 *
 * Usage:
 *   <audio-player src="track.mp3"></audio-player>
 *   <audio-player src="track.mp3" data-visualizer="bars" autoplay loop>
 *     <audio controls src="track.mp3"><!-- JS-off fallback --></audio>
 *   </audio-player>
 *
 * CSS custom property API:
 *   --audioplayer-screen-color   line/bar colour on the screen
 *   --audioplayer-bg             player body background
 *   --audioplayer-bezel          bezel/border colour
 *   --audioplayer-screen-bg      screen background
 *   --audioplayer-text           label and readout colour
 *   --audioplayer-control-size   height of the controls region
 *   --audioplayer-glow           glow spread for screen elements
 *
 * ::part() API:
 *   bezel          outer housing
 *   screen         canvas visualizer area
 *   controls       transport controls region
 *   play-button    play/pause button (also: control)
 *   skip-button    skip/restart button (also: control)
 *   timeline       seek range input (also: control)
 *   volume         volume range input (also: control)
 *   time-display   current / duration readout (also: display)
 *   track-title    title of current track (also: display)
 *   vu-bar         individual VU meter bars
 */

class AudioPlayer extends HTMLElement {

  // ─── Contract metadata ────────────────────────────────────────────────────

  static bundle   = 'retro'
  static contract = 'audio-player'
  static version  = '1.0.0'

  static consumesTokens = [
    '--color-primary',
    '--color-surface-sunken',
    '--color-surface-raised',
    '--color-border',
    '--color-text',
    '--color-text-muted',
    '--size-m',
    '--radius-m',
    '--font-mono',
    '--shadow-m',
  ]

  static exposesTokens = [
    '--audioplayer-screen-color',
    '--audioplayer-bg',
    '--audioplayer-bezel',
    '--audioplayer-screen-bg',
    '--audioplayer-text',
    '--audioplayer-control-size',
    '--audioplayer-glow',
  ]

  // ─── Reduced motion fallback (called by registry) ─────────────────────────

  static reducedMotionFallback(el) {
    el._visualizerPaused = true
    if (el._rafId) {
      cancelAnimationFrame(el._rafId)
      el._rafId = null
    }
    // Draw a single static frame then stop
    el._drawStatic()
  }

  // ─── Observed attributes ──────────────────────────────────────────────────

  static get observedAttributes() {
    return ['src', 'data-visualizer', 'autoplay', 'loop', 'data-title']
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })

    // Internal state
    this._playing        = false
    this._audioCtx       = null
    this._analyser       = null
    this._source         = null
    this._rafId          = null
    this._visualizerPaused = false
    this._currentMode    = 'wave'
    this._vuData         = new Float32Array(8).fill(0)

    // Reduced motion check
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  connectedCallback() {
    this._render()
    this._upgradeAudio()
    this._attachEvents()
    this._startVisualizer()

    // Respect reduced motion at init time
    if (this._reducedMotion) {
      AudioPlayer.reducedMotionFallback(this)
    }

    // Watch for motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', e => {
        this._reducedMotion = e.matches
        if (e.matches) {
          AudioPlayer.reducedMotionFallback(this)
        } else {
          this._visualizerPaused = false
          this._startVisualizer()
        }
      })
  }

  disconnectedCallback() {
    if (this._rafId) cancelAnimationFrame(this._rafId)
    if (this._audioCtx) this._audioCtx.close()
    this._audio?.removeEventListener('timeupdate', this._onTimeUpdate)
    this._audio?.removeEventListener('ended', this._onEnded)
  }

  attributeChangedCallback(name, _old, val) {
    if (!this.shadowRoot.innerHTML) return
    if (name === 'src' && this._audio) {
      this._audio.src = val
      this._updateTrackTitle()
    }
    if (name === 'data-visualizer') {
      this._currentMode = val || 'wave'
    }
    if (name === 'data-title') {
      this._updateTrackTitle()
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  _render() {
    const mode  = this.getAttribute('data-visualizer') || 'wave'
    const title = this.getAttribute('data-title') || this._titleFromSrc()
    this._currentMode = mode

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>

      <div part="bezel">

        <!-- Screen region: canvas visualizer + VU bars -->
        <div part="screen" aria-hidden="true">
          <canvas part="canvas" class="visualizer"></canvas>
          <div class="vu-row" aria-hidden="true">
            ${Array.from({ length: 8 }, (_, i) =>
              `<div part="vu-bar" class="vu-bar" data-index="${i}">
                <div class="vu-fill"></div>
              </div>`
            ).join('')}
          </div>
          <div class="screen-scanlines"></div>
          <div class="screen-glare"></div>
        </div>

        <!-- Track info display -->
        <div class="info-strip">
          <span part="track-title display" class="track-title">${title}</span>
          <span part="time-display display" class="time-display">
            <time class="current-time">0:00</time>
            <span class="time-sep"> / </span>
            <time class="duration">0:00</time>
          </span>
        </div>

        <!-- Controls -->
        <div part="controls" class="controls" role="group" aria-label="Audio controls">

          <!-- Skip to start -->
          <button part="skip-button control" class="btn btn-skip"
                  aria-label="Restart track" title="Restart">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="14" height="14">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>

          <!-- Play / Pause -->
          <button part="play-button control" class="btn btn-play"
                  aria-label="Play" aria-pressed="false">
            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
              <path d="M6 19h4V5H6zm8-14v14h4V5z"/>
            </svg>
          </button>

          <!-- Seek timeline -->
          <div class="timeline-wrap">
            <input part="timeline control" type="range" class="timeline"
                   min="0" max="100" value="0" step="0.1"
                   aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="timeline-fill"></div>
          </div>

          <!-- Volume -->
          <div class="volume-wrap" title="Volume">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="12" height="12" class="volume-icon">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input part="volume control" type="range" class="volume"
                   min="0" max="1" value="0.8" step="0.01"
                   aria-label="Volume">
          </div>

        </div>

        <!-- Hidden native audio element — also the JS-off fallback -->
        <div class="audio-wrap">
          <slot>
            <!-- Default fallback if no slot content provided -->
            <audio class="native-audio"></audio>
          </slot>
        </div>

      </div>
    `
  }

  // ─── Styles ───────────────────────────────────────────────────────────────

  _styles() {
    return /* css */`
      /* ── Host ─────────────────────────────────────────── */
      :host {
        display: block;

        /* Component token API with system token fallbacks */
        --audioplayer-screen-color: var(--color-primary, oklch(70% 0.28 145));
        --audioplayer-bg:           var(--color-surface-sunken, oklch(10% 0.02 260));
        --audioplayer-bezel:        var(--color-border, oklch(35% 0.04 260));
        --audioplayer-screen-bg:    oklch(from var(--audioplayer-bg) calc(l - 0.04) c h);
        --audioplayer-text:         var(--color-text, oklch(90% 0.01 260));
        --audioplayer-text-muted:   var(--color-text-muted, oklch(60% 0.02 260));
        --audioplayer-control-size: 2.5rem;
        --audioplayer-glow:
          0 0 6px color-mix(in oklch, var(--audioplayer-screen-color), transparent 40%),
          0 0 18px color-mix(in oklch, var(--audioplayer-screen-color), transparent 70%);
        --audioplayer-radius: var(--radius-m, 6px);

        font-family: var(--font-mono, ui-monospace, 'Cascadia Code', monospace);
        max-width: 520px;
      }

      /* ── Bezel (outer shell) ───────────────────────────── */
      [part~="bezel"] {
        background: var(--audioplayer-bg);
        border: 2px solid var(--audioplayer-bezel);
        border-radius: calc(var(--audioplayer-radius) + 2px);
        padding: var(--size-s, 0.75rem);
        display: flex;
        flex-direction: column;
        gap: var(--size-xs, 0.5rem);

        /* Retro chrome: inset bevel effect */
        box-shadow:
          inset 0 1px 0 color-mix(in oklch, var(--audioplayer-bezel), white 30%),
          inset 0 -1px 0 color-mix(in oklch, var(--audioplayer-bezel), black 30%),
          var(--shadow-m, 0 4px 16px oklch(0% 0 0 / 0.4));
      }

      /* ── Screen ────────────────────────────────────────── */
      [part~="screen"] {
        position: relative;
        background: var(--audioplayer-screen-bg);
        border-radius: calc(var(--audioplayer-radius) - 1px);
        border: 1px solid color-mix(in oklch, var(--audioplayer-bezel), black 20%);
        overflow: hidden;
        aspect-ratio: 16 / 5;
        /* Inset shadow for depth */
        box-shadow: inset 0 2px 8px oklch(0% 0 0 / 0.5);
      }

      .visualizer {
        width: 100%;
        height: 100%;
        display: block;
      }

      /* Scan lines overlay — authentic CRT texture */
      .screen-scanlines {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 2px,
          oklch(0% 0 0 / 0.06) 2px,
          oklch(0% 0 0 / 0.06) 4px
        );
        pointer-events: none;
        border-radius: inherit;
      }

      /* Glare reflection — curved screen feel */
      .screen-glare {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          135deg,
          oklch(100% 0 0 / 0.04) 0%,
          transparent 50%
        );
        pointer-events: none;
        border-radius: inherit;
      }

      /* ── VU meters ─────────────────────────────────────── */
      .vu-row {
        position: absolute;
        bottom: 4px;
        right: 6px;
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 40%;
      }

      .vu-bar {
        width: 4px;
        height: 100%;
        background: oklch(from var(--audioplayer-screen-bg) calc(l + 0.05) c h);
        border-radius: 1px;
        overflow: hidden;
        display: flex;
        flex-direction: column-reverse;
      }

      .vu-fill {
        width: 100%;
        height: 0%;
        background: var(--audioplayer-screen-color);
        box-shadow: var(--audioplayer-glow);
        transition: height 0.05s linear;
        border-radius: 1px;
      }

      .vu-bar[data-peak] .vu-fill {
        background: oklch(from var(--audioplayer-screen-color) calc(l + 0.1) c h);
      }

      /* ── Info strip ────────────────────────────────────── */
      .info-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--size-xs, 0.5rem);
        padding-inline: 2px;
        font-size: 0.7rem;
        color: var(--audioplayer-text-muted);
        letter-spacing: 0.04em;
        min-height: 1.4em;
      }

      [part~="track-title"] {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex: 1;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.65rem;
        color: var(--audioplayer-screen-color);
        text-shadow: var(--audioplayer-glow);
      }

      [part~="time-display"] {
        flex-shrink: 0;
        font-size: 0.7rem;
        font-variant-numeric: tabular-nums;
        color: var(--audioplayer-text-muted);
        letter-spacing: 0.05em;
      }

      .time-sep { opacity: 0.5; }

      /* ── Controls region ───────────────────────────────── */
      [part~="controls"] {
        display: flex;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        height: var(--audioplayer-control-size);
      }

      /* ── Buttons ───────────────────────────────────────── */
      .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface-raised, oklch(25% 0.03 260));
        color: var(--audioplayer-text);
        border: 1px solid var(--audioplayer-bezel);
        border-radius: var(--audioplayer-radius);
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.1s, color 0.1s, box-shadow 0.1s;

        /* Bevel button chrome */
        box-shadow:
          inset 0 1px 0 color-mix(in oklch, var(--audioplayer-bezel), white 30%),
          inset 0 -1px 0 color-mix(in oklch, var(--audioplayer-bezel), black 40%);
      }

      .btn:hover {
        color: var(--audioplayer-screen-color);
        box-shadow:
          inset 0 1px 0 color-mix(in oklch, var(--audioplayer-bezel), white 30%),
          inset 0 -1px 0 color-mix(in oklch, var(--audioplayer-bezel), black 40%),
          0 0 8px color-mix(in oklch, var(--audioplayer-screen-color), transparent 50%);
      }

      .btn:active {
        /* Depress on click */
        box-shadow:
          inset 0 2px 4px oklch(0% 0 0 / 0.4),
          inset 0 -0px 0 transparent;
        transform: translateY(1px);
      }

      .btn:focus-visible {
        outline: 2px solid var(--audioplayer-screen-color);
        outline-offset: 2px;
      }

      .btn-skip {
        width: 2rem;
        height: 2rem;
      }

      .btn-play {
        width: 2.5rem;
        height: 2.5rem;
        color: var(--audioplayer-screen-color);
        background: color-mix(in oklch,
          var(--audioplayer-screen-color), var(--audioplayer-bg) 85%);
        border-color: color-mix(in oklch,
          var(--audioplayer-screen-color), var(--audioplayer-bezel) 30%);
      }

      .btn-play:hover {
        background: color-mix(in oklch,
          var(--audioplayer-screen-color), var(--audioplayer-bg) 75%);
        box-shadow:
          inset 0 1px 0 color-mix(in oklch, var(--audioplayer-bezel), white 30%),
          inset 0 -1px 0 color-mix(in oklch, var(--audioplayer-bezel), black 40%),
          0 0 12px color-mix(in oklch, var(--audioplayer-screen-color), transparent 40%);
      }

      /* Toggle play/pause icons */
      .icon-pause { display: none; }

      :host([data-state="playing"]) .icon-play  { display: none; }
      :host([data-state="playing"]) .icon-pause { display: block; }

      /* ── Timeline ──────────────────────────────────────── */
      .timeline-wrap {
        flex: 1;
        position: relative;
        height: 1.5rem;
        display: flex;
        align-items: center;
      }

      .timeline-fill {
        position: absolute;
        left: 0;
        height: 3px;
        background: var(--audioplayer-screen-color);
        box-shadow: var(--audioplayer-glow);
        pointer-events: none;
        border-radius: 2px;
        width: 0%;
        transition: width 0.1s linear;
      }

      [part~="timeline"] {
        width: 100%;
        height: 3px;
        appearance: none;
        -webkit-appearance: none;
        background: color-mix(in oklch, var(--audioplayer-bezel), transparent 30%);
        border-radius: 2px;
        cursor: pointer;
        position: relative;
        z-index: 1;
      }

      [part~="timeline"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--audioplayer-screen-color);
        box-shadow: var(--audioplayer-glow);
        cursor: pointer;
        border: none;
      }

      [part~="timeline"]::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--audioplayer-screen-color);
        box-shadow: var(--audioplayer-glow);
        cursor: pointer;
        border: none;
      }

      [part~="timeline"]:focus-visible {
        outline: 2px solid var(--audioplayer-screen-color);
        outline-offset: 4px;
        border-radius: 2px;
      }

      /* ── Volume ────────────────────────────────────────── */
      .volume-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        width: 70px;
      }

      .volume-icon {
        color: var(--audioplayer-text-muted);
        flex-shrink: 0;
      }

      [part~="volume"] {
        flex: 1;
        height: 3px;
        appearance: none;
        -webkit-appearance: none;
        background: color-mix(in oklch, var(--audioplayer-bezel), transparent 30%);
        border-radius: 2px;
        cursor: pointer;
      }

      [part~="volume"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--audioplayer-text-muted);
        cursor: pointer;
        border: none;
      }

      [part~="volume"]::-moz-range-thumb {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--audioplayer-text-muted);
        cursor: pointer;
        border: none;
      }

      [part~="volume"]:focus-visible {
        outline: 2px solid var(--audioplayer-screen-color);
        outline-offset: 4px;
        border-radius: 2px;
      }

      /* ── Audio wrap — hide native element ──────────────── */
      .audio-wrap {
        display: none;
      }

      /* ── Static mode (reduced motion) ─────────────────── */
      :host([data-visualizer-static]) .visualizer {
        opacity: 0.4;
      }
    `
  }

  // ─── Audio setup ──────────────────────────────────────────────────────────

  _upgradeAudio() {
    // Try slotted <audio> element first (progressive enhancement path)
    const slot = this.shadowRoot.querySelector('slot')
    const slotted = slot?.assignedElements?.().find(el => el.tagName === 'AUDIO')

    if (slotted) {
      this._audio = slotted
    } else {
      // Use internal hidden audio element
      this._audio = this.shadowRoot.querySelector('.native-audio')
    }

    const src = this.getAttribute('src')
    if (src) this._audio.src = src
    if (this.hasAttribute('autoplay')) this._audio.autoplay = true
    if (this.hasAttribute('loop')) this._audio.loop = true

    // Time events
    this._onTimeUpdate = () => this._handleTimeUpdate()
    this._onEnded = () => this._handleEnded()
    this._audio.addEventListener('timeupdate', this._onTimeUpdate)
    this._audio.addEventListener('ended', this._onEnded)
    this._audio.addEventListener('loadedmetadata', () => this._updateDuration())
  }

  _setupAudioContext() {
    if (this._audioCtx) return

    this._audioCtx = new AudioContext()
    this._analyser = this._audioCtx.createAnalyser()
    this._analyser.fftSize = 256
    this._analyser.smoothingTimeConstant = 0.8

    this._source = this._audioCtx.createMediaElementSource(this._audio)
    this._source.connect(this._analyser)
    this._analyser.connect(this._audioCtx.destination)
  }

  // ─── Event wiring ─────────────────────────────────────────────────────────

  _attachEvents() {
    const root = this.shadowRoot

    // Play/pause button
    root.querySelector('.btn-play').addEventListener('click', () => {
      if (this._playing) {
        this._pause()
      } else {
        this._play()
      }
    })

    // Skip/restart button
    root.querySelector('.btn-skip').addEventListener('click', () => {
      this._audio.currentTime = 0
      if (!this._playing) this._play()
    })

    // Seek
    const timeline = root.querySelector('[part~="timeline"]')
    timeline.addEventListener('input', () => {
      if (!this._audio.duration) return
      this._audio.currentTime = (timeline.value / 100) * this._audio.duration
    })

    // Volume
    const volume = root.querySelector('[part~="volume"]')
    volume.addEventListener('input', () => {
      this._audio.volume = volume.value
    })
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  _play() {
    this._setupAudioContext()
    if (this._audioCtx.state === 'suspended') {
      this._audioCtx.resume()
    }
    this._audio.play()
    this._playing = true
    this.setAttribute('data-state', 'playing')
    this.shadowRoot.querySelector('.btn-play').setAttribute('aria-label', 'Pause')
    this.shadowRoot.querySelector('.btn-play').setAttribute('aria-pressed', 'true')

    this.dispatchEvent(new CustomEvent('vb:audioplayer:play', {
      bubbles: true, composed: true,
      detail: { currentTime: this._audio.currentTime, src: this._audio.src }
    }))
  }

  _pause() {
    this._audio.pause()
    this._playing = false
    this.setAttribute('data-state', 'paused')
    this.shadowRoot.querySelector('.btn-play').setAttribute('aria-label', 'Play')
    this.shadowRoot.querySelector('.btn-play').setAttribute('aria-pressed', 'false')

    this.dispatchEvent(new CustomEvent('vb:audioplayer:pause', {
      bubbles: true, composed: true,
      detail: { currentTime: this._audio.currentTime }
    }))
  }

  // ─── Time display ─────────────────────────────────────────────────────────

  _handleTimeUpdate() {
    const t = this._audio.currentTime
    const d = this._audio.duration || 0
    const pct = d ? (t / d) * 100 : 0

    this.shadowRoot.querySelector('.current-time').textContent = this._formatTime(t)

    const timeline = this.shadowRoot.querySelector('[part~="timeline"]')
    timeline.value = pct
    timeline.setAttribute('aria-valuenow', Math.round(pct))
    this.shadowRoot.querySelector('.timeline-fill').style.width = `${pct}%`

    this.dispatchEvent(new CustomEvent('vb:audioplayer:timeupdate', {
      bubbles: true, composed: true,
      detail: { currentTime: t, duration: d, progress: pct }
    }))
  }

  _updateDuration() {
    const d = this._audio.duration || 0
    this.shadowRoot.querySelector('.duration').textContent = this._formatTime(d)
  }

  _handleEnded() {
    this._playing = false
    this.setAttribute('data-state', 'ended')
    this.shadowRoot.querySelector('.btn-play').setAttribute('aria-label', 'Play')
    this.shadowRoot.querySelector('.btn-play').setAttribute('aria-pressed', 'false')

    this.dispatchEvent(new CustomEvent('vb:audioplayer:ended', {
      bubbles: true, composed: true,
      detail: { src: this._audio.src }
    }))
  }

  _formatTime(seconds) {
    if (!isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ─── Visualizer ───────────────────────────────────────────────────────────

  _startVisualizer() {
    const canvas = this.shadowRoot.querySelector('.visualizer')
    if (!canvas) return

    const draw = () => {
      if (this._visualizerPaused) return
      this._rafId = requestAnimationFrame(draw)
      this._drawFrame(canvas)
    }

    // Always animate the visualizer (idle mode when not playing)
    this._rafId = requestAnimationFrame(draw)
  }

  _drawFrame(canvas) {
    const ctx  = canvas.getContext('2d')
    const W    = canvas.width  = canvas.offsetWidth
    const H    = canvas.height = canvas.offsetHeight
    const mode = this._currentMode

    // Resolve the screen color from the computed style
    const style   = getComputedStyle(this)
    const color   = style.getPropertyValue('--audioplayer-screen-color').trim()
                    || 'oklch(70% 0.28 145)'
    const bgColor = style.getPropertyValue('--audioplayer-screen-bg').trim()
                    || 'oklch(6% 0.02 260)'

    // Get frequency data if audio context is set up
    let dataArray = null
    if (this._analyser && this._playing) {
      const bufferLength = this._analyser.frequencyBinCount
      dataArray = new Uint8Array(bufferLength)
      if (mode === 'wave') {
        this._analyser.getByteTimeDomainData(dataArray)
      } else {
        this._analyser.getByteFrequencyData(dataArray)
      }
    }

    // Clear with slight trail for glow persistence
    ctx.fillStyle = bgColor
    ctx.globalAlpha = this._playing ? 0.25 : 1
    ctx.fillRect(0, 0, W, H)
    ctx.globalAlpha = 1

    if (!this._playing) {
      this._drawIdle(ctx, W, H, color)
    } else if (mode === 'wave') {
      this._drawWave(ctx, W, H, color, dataArray)
    } else if (mode === 'bars') {
      this._drawBars(ctx, W, H, color, dataArray)
    } else if (mode === 'circle') {
      this._drawCircle(ctx, W, H, color, dataArray)
    }

    // Update VU meters
    this._updateVU(dataArray)
  }

  _drawIdle(ctx, W, H, color) {
    // Flat line with gentle phosphor glow — like a CRT on standby
    const y = H / 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.3
    ctx.stroke()
    ctx.globalAlpha = 1

    // Blinking cursor dot
    const blink = Math.floor(Date.now() / 600) % 2 === 0
    if (blink) {
      ctx.beginPath()
      ctx.arc(12, H / 2, 2, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = 0.6
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  _drawWave(ctx, W, H, color, data) {
    if (!data) return
    const sliceW = W / data.length
    let x = 0

    // Glow pass
    ctx.beginPath()
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128
      const y = (v * H) / 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      x += sliceW
    }
    ctx.stroke()

    // Sharp pass
    ctx.beginPath()
    ctx.shadowBlur = 0
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 1
    x = 0
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128
      const y = (v * H) / 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      x += sliceW
    }
    ctx.stroke()
  }

  _drawBars(ctx, W, H, color, data) {
    if (!data) return
    const count  = Math.min(data.length, 48)
    const barW   = (W / count) - 1
    ctx.shadowColor = color
    ctx.shadowBlur  = 6
    ctx.fillStyle   = color

    for (let i = 0; i < count; i++) {
      const pct    = data[i] / 255
      const barH   = pct * H
      const x      = i * ((W / count))
      // Gradient: bright top, dimmer bottom
      const grad = ctx.createLinearGradient(0, H - barH, 0, H)
      grad.addColorStop(0, color)
      grad.addColorStop(1, `color-mix(in oklch, ${color}, transparent 50%)`)
      ctx.fillStyle = grad
      ctx.fillRect(x, H - barH, barW, barH)
    }
    ctx.shadowBlur = 0
  }

  _drawCircle(ctx, W, H, color, data) {
    if (!data) return
    const cx     = W / 2
    const cy     = H / 2
    const radius = Math.min(W, H) * 0.25
    const count  = data.length

    ctx.shadowColor = color
    ctx.shadowBlur  = 6
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.5
    ctx.beginPath()

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const amp   = (data[i] / 255) * (radius * 0.8)
      const r     = radius + amp
      const x     = cx + r * Math.cos(angle)
      const y     = cy + r * Math.sin(angle)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()

    // Centre dot
    ctx.beginPath()
    ctx.arc(cx, cy, 2, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.4
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }

  _drawStatic() {
    const canvas = this.shadowRoot.querySelector('.visualizer')
    if (!canvas) return
    this._drawIdle(
      canvas.getContext('2d'),
      canvas.offsetWidth,
      canvas.offsetHeight,
      getComputedStyle(this).getPropertyValue('--audioplayer-screen-color').trim()
    )
  }

  _updateVU(dataArray) {
    const bars = this.shadowRoot.querySelectorAll('.vu-bar')
    if (!bars.length) return

    if (!dataArray || !this._playing) {
      bars.forEach(b => {
        b.querySelector('.vu-fill').style.height = '0%'
        b.removeAttribute('data-peak')
      })
      return
    }

    const step = Math.floor(dataArray.length / bars.length)
    bars.forEach((bar, i) => {
      const val = dataArray[i * step] / 255
      const pct = Math.round(val * 100)
      bar.querySelector('.vu-fill').style.height = `${pct}%`
      bar.toggleAttribute('data-peak', pct > 80)
    })
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _titleFromSrc() {
    const src = this.getAttribute('src')
    if (!src) return 'NO SIGNAL'
    const file = src.split('/').pop().split('?')[0]
    return file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toUpperCase()
  }

  _updateTrackTitle() {
    const el = this.shadowRoot.querySelector('[part~="track-title"]')
    if (el) {
      el.textContent = this.getAttribute('data-title') || this._titleFromSrc()
    }
  }
}

customElements.define('audio-player', AudioPlayer)
export { AudioPlayer }
