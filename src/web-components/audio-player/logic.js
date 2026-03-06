/**
 * audio-player: Platform audio player web component
 *
 * Wraps a native <audio> element (light DOM) with custom controls rendered in
 * shadow DOM. The <audio> and optional <details class="track-list"> stay in
 * light DOM — if JS is unavailable, native controls and track links work.
 *
 * @attr {boolean} data-autoplay - Start playing on load (subject to browser autoplay policy)
 * @attr {boolean} data-loop - Loop single track or entire playlist
 * @attr {boolean} data-shuffle - Randomize playlist order
 *
 * @fires vb:audio:play - Audio playback started
 * @fires vb:audio:pause - Audio playback paused
 * @fires vb:audio:ended - Audio playback ended
 * @fires vb:audio:track-change - Track changed in playlist mode
 *
 * @example Single track
 * <audio-player>
 *   <audio controls>
 *     <source src="track.mp3" type="audio/mpeg">
 *     <p><a href="track.mp3" download>Download track</a></p>
 *   </audio>
 * </audio-player>
 *
 * @example Playlist mode
 * <audio-player>
 *   <audio controls>
 *     <source src="tracks/01.mp3" type="audio/mpeg">
 *   </audio>
 *   <details>
 *     <summary>Track Listing</summary>
 *     <ol class="track-list">
 *       <li data-audio-active>
 *         <a href="tracks/01.mp3">01. Opening</a>
 *         <span class="track-meta"><time datetime="PT2M14S">2:14</time></span>
 *       </li>
 *     </ol>
 *   </details>
 * </audio-player>
 */

class AudioPlayerElement extends HTMLElement {

  // ─── State ─────────────────────────────────────────────────────────────────

  #audio = null
  #trackList = null
  #playing = false
  #controls = null
  #playBtn = null
  #timeline = null
  #timelineFill = null
  #volumeSlider = null
  #currentTimeEl = null
  #durationEl = null
  #trackTitleEl = null

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback() {
    this.#audio = this.querySelector('audio')
    if (!this.#audio) return

    this.#trackList = this.querySelector('.track-list')

    // Suppress native controls — we provide our own
    this.#audio.removeAttribute('controls')

    this.#buildShadow()
    this.#attachAudioEvents()
    this.#attachControlEvents()
    this.#attachTrackListEvents()
    this.#updateTrackTitle()

    if (this.hasAttribute('data-autoplay')) {
      this.#audio.play().catch(() => {})
    }
  }

  disconnectedCallback() {
    // Restore native controls if component is removed
    if (this.#audio) {
      this.#audio.setAttribute('controls', '')
    }
  }

  // ─── Shadow DOM ────────────────────────────────────────────────────────────

  #buildShadow() {
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>${this.#styles()}</style>
      <div part="player" class="player">
        <div part="controls" class="controls" role="group" aria-label="Audio controls">
          <button part="play-button" class="play-btn" type="button" aria-label="Play">
            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
              <path d="M6 19h4V5H6zm8-14v14h4V5z"/>
            </svg>
          </button>
          <div class="timeline-group">
            <div part="track-info" class="track-info">
              <span class="track-title"></span>
              <span class="time-display">
                <time class="current-time">0:00</time>
                <span class="time-sep"> / </span>
                <time class="duration">0:00</time>
              </span>
            </div>
            <div class="timeline-wrap">
              <input part="timeline" type="range" class="timeline"
                     min="0" max="100" value="0" step="0.1"
                     aria-label="Seek">
              <div class="timeline-fill"></div>
            </div>
          </div>
          <div class="volume-wrap">
            <button class="mute-btn" type="button" aria-label="Mute">
              <svg class="icon-vol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <svg class="icon-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
              </svg>
            </button>
            <input part="volume" type="range" class="volume"
                   min="0" max="1" value="1" step="0.01"
                   aria-label="Volume">
          </div>
        </div>
        <slot></slot>
      </div>
    `

    this.#controls = shadow.querySelector('.controls')
    this.#playBtn = shadow.querySelector('.play-btn')
    this.#timeline = shadow.querySelector('.timeline')
    this.#timelineFill = shadow.querySelector('.timeline-fill')
    this.#volumeSlider = shadow.querySelector('.volume')
    this.#currentTimeEl = shadow.querySelector('.current-time')
    this.#durationEl = shadow.querySelector('.duration')
    this.#trackTitleEl = shadow.querySelector('.track-title')
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  #styles() {
    return /* css */`
      :host {
        display: block;
        --_accent: var(--audio-player-accent, var(--color-primary, oklch(55% 0.2 260)));
        --_bg: var(--audio-player-bg, var(--color-surface, #fff));
        --_radius: var(--audio-player-radius, var(--radius-m, 0.5rem));
      }

      .player {
        background: var(--_bg);
        border: 1px solid var(--color-border, #ddd);
        border-radius: var(--_radius);
        overflow: hidden;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        padding: var(--size-xs, 0.5rem) var(--size-s, 0.75rem);
      }

      /* ── Play button ──────────────────────────── */
      .play-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 50%;
        background: var(--_accent);
        color: white;
        cursor: pointer;
        flex-shrink: 0;
        transition: opacity 150ms;
      }

      .play-btn:hover { opacity: 0.85; }

      .play-btn:focus-visible {
        outline: 2px solid var(--_accent);
        outline-offset: 2px;
      }

      .icon-pause { display: none; }
      :host([data-state="playing"]) .icon-play { display: none; }
      :host([data-state="playing"]) .icon-pause { display: block; }

      /* ── Timeline group ───────────────────────── */
      .timeline-group {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .track-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        font-size: var(--text-xs, 0.75rem);
        line-height: 1.2;
      }

      .track-title {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex: 1;
        font-weight: 500;
      }

      .time-display {
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
        color: var(--color-text-muted, #666);
      }

      .time-sep { opacity: 0.5; }

      .timeline-wrap {
        position: relative;
        height: 1.25rem;
        display: flex;
        align-items: center;
      }

      .timeline-fill {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 4px;
        background: var(--_accent);
        pointer-events: none;
        border-radius: 2px;
        width: 0%;
      }

      .timeline {
        width: 100%;
        height: 1.25rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        z-index: 1;
      }

      .timeline::-webkit-slider-runnable-track {
        height: 4px;
        background: var(--color-border, #ddd);
        border-radius: 2px;
      }

      .timeline::-moz-range-track {
        height: 4px;
        background: var(--color-border, #ddd);
        border-radius: 2px;
      }

      .timeline::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--_accent);
        border: 2px solid white;
        box-shadow: 0 1px 3px oklch(0% 0 0 / 0.2);
        cursor: pointer;
        margin-top: -4px;
      }

      .timeline::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--_accent);
        border: 2px solid white;
        box-shadow: 0 1px 3px oklch(0% 0 0 / 0.2);
        cursor: pointer;
      }

      .timeline:focus-visible {
        outline: 2px solid var(--_accent);
        outline-offset: 4px;
        border-radius: 2px;
      }

      /* ── Volume ───────────────────────────────── */
      .volume-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 0 0 80px;
        min-width: 0;
      }

      .mute-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--color-text-muted, #666);
        flex-shrink: 0;
      }

      .mute-btn:focus-visible {
        outline: 2px solid var(--_accent);
        outline-offset: 2px;
        border-radius: 2px;
      }

      .icon-muted { display: none; }
      :host([data-muted]) .icon-vol { display: none; }
      :host([data-muted]) .icon-muted { display: block; }

      .volume {
        flex: 1;
        min-width: 0;
        height: 1rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
      }

      .volume::-webkit-slider-runnable-track {
        height: 3px;
        background: var(--color-border, #ddd);
        border-radius: 2px;
      }

      .volume::-moz-range-track {
        height: 3px;
        background: var(--color-border, #ddd);
        border-radius: 2px;
      }

      .volume::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--color-text-muted, #666);
        border: none;
        cursor: pointer;
        margin-top: -3.5px;
      }

      .volume::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--color-text-muted, #666);
        border: none;
        cursor: pointer;
      }

      .volume:focus-visible {
        outline: 2px solid var(--_accent);
        outline-offset: 2px;
        border-radius: 2px;
      }

      /* ── Slot: hide native audio controls ─────── */
      ::slotted(audio) {
        display: none !important;
      }

      /* ── Reduced motion ───────────────────────── */
      @media (prefers-reduced-motion: reduce) {
        .play-btn,
        .timeline-fill {
          transition: none;
        }
      }
    `
  }

  // ─── Audio events ──────────────────────────────────────────────────────────

  #attachAudioEvents() {
    this.#audio.addEventListener('timeupdate', () => this.#handleTimeUpdate())
    this.#audio.addEventListener('loadedmetadata', () => this.#updateDuration())
    this.#audio.addEventListener('play', () => {
      this.#playing = true
      this.setAttribute('data-state', 'playing')
      this.#playBtn.setAttribute('aria-label', 'Pause')
      this.#emit('vb:audio:play', {
        currentTime: this.#audio.currentTime,
        src: this.#audio.currentSrc
      })
    })
    this.#audio.addEventListener('pause', () => {
      this.#playing = false
      this.setAttribute('data-state', 'paused')
      this.#playBtn.setAttribute('aria-label', 'Play')
      this.#emit('vb:audio:pause', {
        currentTime: this.#audio.currentTime
      })
    })
    this.#audio.addEventListener('ended', () => {
      this.#playing = false
      this.setAttribute('data-state', 'ended')
      this.#playBtn.setAttribute('aria-label', 'Play')

      // Mark track as played
      const active = this.#trackList?.querySelector('li[data-audio-active]')
      if (active) active.setAttribute('data-audio-played', '')

      // Auto-advance to next track
      if (this.#trackList) {
        this.#playNext()
      }

      this.#emit('vb:audio:ended', { src: this.#audio.currentSrc })
    })
  }

  // ─── Control events ────────────────────────────────────────────────────────

  #attachControlEvents() {
    // Play/pause
    this.#playBtn.addEventListener('click', () => {
      if (this.#playing) {
        this.#audio.pause()
      } else {
        this.#audio.play().catch(() => {})
      }
    })

    // Seek
    this.#timeline.addEventListener('input', () => {
      if (!this.#audio.duration) return
      this.#audio.currentTime = (this.#timeline.value / 100) * this.#audio.duration
    })

    // Volume
    this.#volumeSlider.addEventListener('input', () => {
      this.#audio.volume = this.#volumeSlider.value
      this.#audio.muted = false
      this.removeAttribute('data-muted')
    })

    // Mute toggle
    const muteBtn = this.shadowRoot.querySelector('.mute-btn')
    muteBtn.addEventListener('click', () => {
      this.#audio.muted = !this.#audio.muted
      this.toggleAttribute('data-muted', this.#audio.muted)
    })

    // Keyboard shortcuts
    this.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (this.#playing) this.#audio.pause()
          else this.#audio.play().catch(() => {})
          break
        case 'ArrowLeft':
          e.preventDefault()
          this.#audio.currentTime = Math.max(0, this.#audio.currentTime - 10)
          break
        case 'ArrowRight':
          e.preventDefault()
          this.#audio.currentTime = Math.min(
            this.#audio.duration || 0,
            this.#audio.currentTime + 10
          )
          break
        case 'm':
        case 'M':
          this.#audio.muted = !this.#audio.muted
          this.toggleAttribute('data-muted', this.#audio.muted)
          break
      }
    })

    // Make focusable for keyboard shortcuts
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0')
    }
  }

  // ─── Track list events ─────────────────────────────────────────────────────

  #attachTrackListEvents() {
    if (!this.#trackList) return

    this.#trackList.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]')
      if (!link) return
      e.preventDefault()

      this.#loadTrack(link.href, link.closest('li'))
    })
  }

  #loadTrack(src, li) {
    // Update active state
    const items = this.#trackList.querySelectorAll('li')
    items.forEach(item => item.removeAttribute('data-audio-active'))
    if (li) li.setAttribute('data-audio-active', '')

    this.#audio.src = src
    this.#audio.play().catch(() => {})
    this.#updateTrackTitle()

    this.#emit('vb:audio:track-change', {
      src,
      title: li?.querySelector('a')?.textContent ?? ''
    })
  }

  #playNext() {
    if (!this.#trackList) return

    const items = [...this.#trackList.querySelectorAll('li')]
    const activeIdx = items.findIndex(li => li.hasAttribute('data-audio-active'))

    if (this.hasAttribute('data-shuffle')) {
      const remaining = items.filter((_, i) => i !== activeIdx)
      if (remaining.length) {
        const next = remaining[Math.floor(Math.random() * remaining.length)]
        const link = next.querySelector('a[href]')
        if (link) this.#loadTrack(link.href, next)
      }
      return
    }

    const nextIdx = activeIdx + 1
    if (nextIdx < items.length) {
      const link = items[nextIdx].querySelector('a[href]')
      if (link) this.#loadTrack(link.href, items[nextIdx])
    } else if (this.hasAttribute('data-loop')) {
      const link = items[0]?.querySelector('a[href]')
      if (link) this.#loadTrack(link.href, items[0])
    }
  }

  // ─── Time display ──────────────────────────────────────────────────────────

  #handleTimeUpdate() {
    const t = this.#audio.currentTime
    const d = this.#audio.duration || 0
    const pct = d ? (t / d) * 100 : 0

    this.#currentTimeEl.textContent = this.#formatTime(t)
    this.#timeline.value = pct
    this.#timelineFill.style.width = `${pct}%`
  }

  #updateDuration() {
    const d = this.#audio.duration || 0
    this.#durationEl.textContent = this.#formatTime(d)
  }

  #updateTrackTitle() {
    if (!this.#trackTitleEl) return

    // Try to get title from active track
    if (this.#trackList) {
      const active = this.#trackList.querySelector('li[data-audio-active] a')
      if (active) {
        this.#trackTitleEl.textContent = active.textContent
        return
      }
    }

    // Fall back to filename from src
    const src = this.#audio.currentSrc || this.#audio.querySelector('source')?.src || ''
    if (src) {
      const file = src.split('/').pop().split('?')[0]
      this.#trackTitleEl.textContent = file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  #formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail
    }))
  }
}

customElements.define('audio-player', AudioPlayerElement)

export { AudioPlayerElement }
