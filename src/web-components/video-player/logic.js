/**
 * video-player: Platform video player web component
 *
 * Wraps a native <video> element (light DOM) with custom overlay controls
 * rendered in shadow DOM. The <video> and optional <details class="track-list">
 * stay in light DOM — if JS is unavailable, native controls and track links work.
 *
 * @attr {boolean} autoplay - Start playing on first connect (subject to browser
 *   autoplay policy). Skipped under prefers-reduced-motion: reduce, and never
 *   re-run when the player is moved/reconnected.
 * @attr {boolean} loop - Single video: loop it. Playlist: wrap to the first track after the last
 * @attr {boolean} shuffle - Playlist: advance to a random other track
 * @attr {boolean} muted - Start muted; reflects the inner video.muted afterwards
 * @attr {boolean} captions - Start with the first caption track showing; reflects it afterwards
 * @attr {string} data-label-* - Override any UI string (see LABELS), e.g.
 *   data-label-play="Lire". {rate}, {current}, {duration} are placeholders.
 *
 * Keyboard (focus on the player, not inside one of its controls; modifier
 * chords are ignored): Space/K play-pause, Left/Right seek 10s, Up/Down
 * volume, M mute, F fullscreen, C captions. On the seek slider Left/Right
 * seek 5s; the volume slider keeps its native arrow behaviour.
 *
 * @fires video-player:play - Video playback started
 * @fires video-player:pause - Video playback paused
 * @fires video-player:ended - Video playback ended
 * @fires video-player:track-change - Track changed in playlist mode
 * @fires video-player:fullscreen - Fullscreen state changed
 * @fires video-player:speed - Playback speed changed
 * @fires video-player:captions - Captions toggled
 * @fires video-player:src-changed - The src property was set
 *
 * @example Single video
 * <video-player>
 *   <video controls poster="poster.jpg">
 *     <source src="video.mp4" type="video/mp4">
 *     <track kind="captions" src="en.vtt" srclang="en" label="English" default>
 *     <p><a href="video.mp4" download>Download video</a></p>
 *   </video>
 * </video-player>
 *
 * @example Playlist mode
 * <video-player>
 *   <video controls poster="ep1.jpg">
 *     <source src="episodes/01.mp4" type="video/mp4">
 *   </video>
 *   <details>
 *     <summary>Episodes</summary>
 *     <ol class="track-list">
 *       <li data-video-active>
 *         <a href="episodes/01.mp4" data-poster="ep1.jpg">01. Introduction</a>
 *         <span class="track-meta"><time datetime="PT12M30S">12:30</time></span>
 *       </li>
 *     </ol>
 *   </details>
 * </video-player>
 */

import { registerComponent } from '../../lib/bundle-registry.js';
import { VBElement } from '../../lib/vb-element.js';
import { getLocale } from '../../lib/i18n.js';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]
const IDLE_TIMEOUT = 3000
const SEEK_STEP = 10
const SLIDER_SEEK_STEP = 5

// Key events from these (inside the player, light or shadow DOM) keep their
// native behaviour; the host shortcuts only fire when focus is on the host.
const INTERACTIVE = 'input, button, a[href], summary, select, textarea, video[controls], [contenteditable]:not([contenteditable="false"])'

/** Default English strings; each is overridable with data-label-<key>. */
const LABELS = {
  player: 'Video player',
  controls: 'Video controls',
  'play-video': 'Play video',
  play: 'Play',
  pause: 'Pause',
  seek: 'Seek',
  'skip-back': 'Skip back 10 seconds',
  'skip-forward': 'Skip forward 10 seconds',
  mute: 'Mute',
  volume: 'Volume',
  speed: 'Playback speed {rate}',
  captions: 'Captions',
  fullscreen: 'Fullscreen',
  'exit-fullscreen': 'Exit fullscreen',
  playing: 'Playing',
  paused: 'Paused',
  ended: 'Ended',
  buffering: 'Buffering',
  'time-of': '{current} of {duration}',
}

class VideoPlayerElement extends VBElement {

  // ─── State ─────────────────────────────────────────────────────────────────

  /** @type {HTMLVideoElement} */
  #video = /** @type {*} */ (null)
  /** @type {Element | null} */
  #trackList = null
  #playing = false
  /** @type {HTMLElement} */
  #controls = /** @type {*} */ (null)
  /** @type {HTMLButtonElement} */
  #playBtn = /** @type {*} */ (null)
  /** @type {HTMLButtonElement} */
  #playOverlay = /** @type {*} */ (null)
  /** @type {HTMLInputElement} */
  #timeline = /** @type {*} */ (null)
  /** @type {HTMLElement} */
  #timelineFill = /** @type {*} */ (null)
  /** @type {HTMLElement} */
  #timelineBuffer = /** @type {*} */ (null)
  /** @type {HTMLInputElement} */
  #volumeSlider = /** @type {*} */ (null)
  /** @type {HTMLElement} */
  #currentTimeEl = /** @type {*} */ (null)
  /** @type {HTMLElement} */
  #durationEl = /** @type {*} */ (null)
  /** @type {HTMLButtonElement} */
  #speedBtn = /** @type {*} */ (null)
  /** @type {HTMLButtonElement} */
  #captionsBtn = /** @type {*} */ (null)
  /** @type {HTMLButtonElement} */
  #fullscreenBtn = /** @type {*} */ (null)
  /** @type {HTMLElement} */
  #bufferIndicator = /** @type {*} */ (null)
  /** @type {HTMLElement} */
  #statusEl = /** @type {*} */ (null)
  /** @type {ReturnType<typeof setTimeout> | null} */
  #idleTimer = null
  #rateIndex = 2 // 1x
  /** @type {(() => void) | null} */
  #onThemeChange = null
  /** @type {(() => void) | null} */
  #onFullscreenChange = null
  /** @type {HTMLButtonElement} */
  #muteBtn = /** @type {*} */ (null)
  #autoplayHandled = false
  /** @type {string} */
  #locale = 'en'
  /** @type {Intl.NumberFormat | null} */
  #nf = null
  /** @type {any} */
  #df = null

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  setup() {
    this.#video = /** @type {HTMLVideoElement} */ (this.querySelector('video'))
    if (!this.#video) return false

    this.#trackList = this.querySelector('.track-list')

    // Suppress native controls — we provide our own
    this.#video.removeAttribute('controls')

    this.#buildShadow()
    this.#initFormatters()

    // Every listener goes through listen() on every setup(): listen() removes
    // them on disconnect, and the light-DOM <video>/.track-list may have been
    // swapped while disconnected, so nothing may hide behind a "first build"
    // guard (only the shadow DOM itself is built once).
    this.#attachVideoEvents()
    this.#attachControlEvents()
    this.#attachTrackListEvents()
    this.#attachIdleTracking()

    this.#applyLabels()
    this.#syncCaptionsButton()

    if (this.hasAttribute('muted')) this.#video.muted = true
    this.#syncMuted()

    // Single video: host [loop] loops the media natively (playlists wrap in #playNext)
    if (!this.#trackList && this.hasAttribute('loop')) this.#video.loop = true

    // Autoplay once per element, never on a move/reconnect, and not at all
    // when the user asked for reduced motion (that also cancels a native
    // autoplay attribute authored on the inner <video>).
    if (!this.#autoplayHandled) {
      this.#autoplayHandled = true
      const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        if (this.#video.autoplay) {
          this.#video.autoplay = false
          this.#video.pause()
        }
      } else if (this.hasAttribute('autoplay')) {
        this.#video.play().catch(() => {})
      }
    }

    // Show controls initially
    this.#showControls()

    // Force style recalculation when theme changes (shadow DOM may not re-resolve custom properties)
    this.#onThemeChange = () => {
      const player = /** @type {HTMLElement | null} */ (this.shadowRoot?.querySelector('.player'))
      if (player) {
        player.style.display = 'none'
        player.offsetHeight
        player.style.display = ''
      }
    }
    this.listen(window, 'vb:theme-change', this.#onThemeChange)

    // Fullscreen change — may exit from Escape key without our button. Only
    // react when THIS player (or its video) enters/leaves fullscreen.
    this.#onFullscreenChange = () => {
      const active = this.#isFullscreen()
      if (active === this.hasAttribute('data-fullscreen')) return
      this.#reflectFullscreen(active)
      this.#fullscreenBtn.setAttribute('aria-label', this.#label(active ? 'exit-fullscreen' : 'fullscreen'))
      this.#emit('video-player:fullscreen', { active })
    }
    this.listen(document, 'fullscreenchange', this.#onFullscreenChange)
    this.#reflectFullscreen(this.#isFullscreen())

    // Captions: an authored [captions] turns the first caption track on; a
    // `default` track the UA shows on its own is reflected back. The UA
    // selects default tracks asynchronously, so follow textTracks' change
    // event rather than reading the mode once.
    const captionTrack = this.#getCaptionTrack()
    if (captionTrack && this.hasAttribute('captions')) captionTrack.mode = 'showing'
    this.#syncCaptionsState()
    this.listen(this.#video.textTracks, 'change', () => this.#syncCaptionsState())

    // Derive state from the media element (a reconnect keeps its position)
    this.#playing = !this.#video.paused && !this.#video.ended
    this.#setState(this.#video.ended ? 'ended'
      : this.#playing ? 'playing'
      : this.#video.currentTime > 0 ? 'paused' : 'idle')
    this.#playBtn.setAttribute('aria-label', this.#label(this.#playing ? 'pause' : 'play'))
    this.#updateDuration()
    this.#handleTimeUpdate()
    return true;
  }

  teardown() {
    // Restore native controls if component is removed
    if (this.#video) {
      this.#video.setAttribute('controls', '')
    }
    if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
    this.#idleTimer = null
  }

  // ── Data API (HTML-first / JS-first dual contract) ──────────────

  get src() {
    return this.#video?.getAttribute('src') || this.#video?.currentSrc || '';
  }

  set src(value) {
    if (!this.#video) return;
    const next = value == null ? '' : String(value);
    if (this.#video.getAttribute('src') === next) return;
    this.#video.setAttribute('src', next);
    this.#video.load?.();
    this.#emit('video-player:src-changed', { src: next, source: 'property' });
  }

  get currentTime() { return this.#video?.currentTime ?? 0; }
  set currentTime(value) {
    if (this.#video) this.#video.currentTime = Number(value) || 0;
  }

  // ─── Shadow DOM ────────────────────────────────────────────────────────────

  #buildShadow() {
    if (this.shadowRoot) return
    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>${this.#styles()}</style>
      <div part="player" class="player">
        <slot></slot>
        <button part="play-overlay" class="play-overlay" type="button" aria-label="Play video">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="48" height="48">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <div class="buffer-indicator" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="controls-gradient" aria-hidden="true"></div>
        <div part="controls" class="controls" role="group" aria-label="Video controls">
          <div class="timeline-wrap">
            <input part="timeline" type="range" class="timeline"
                   min="0" max="100" value="0" step="0.1"
                   aria-label="Seek" aria-valuetext="0:00 of 0:00">
            <div class="timeline-buffer"></div>
            <div class="timeline-fill"></div>
          </div>
          <div class="controls-row">
            <button part="play-button" class="play-btn" type="button" aria-label="Play">
              <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M6 19h4V5H6zm8-14v14h4V5z"/>
              </svg>
            </button>
            <button class="skip-back-btn" type="button" aria-label="Skip back 10 seconds">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" font-family="system-ui">10</text>
              </svg>
            </button>
            <button class="skip-forward-btn" type="button" aria-label="Skip forward 10 seconds">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                <text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" font-family="system-ui">10</text>
              </svg>
            </button>
            <div class="volume-wrap">
              <button part="mute-button" class="mute-btn" type="button" aria-label="Mute" aria-pressed="false">
                <svg class="icon-vol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <svg class="icon-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
                </svg>
              </button>
              <input part="volume" type="range" class="volume"
                     min="0" max="1" value="1" step="0.05"
                     aria-label="Volume" aria-valuetext="100%">
            </div>
            <span part="time-display" class="time-display">
              <time class="current-time">0:00</time>
              <span class="time-sep"> / </span>
              <time class="duration">0:00</time>
            </span>
            <span class="spacer"></span>
            <button part="speed-button" class="speed-btn" type="button" aria-label="Playback speed 1x">
              <span aria-live="polite">1x</span>
            </button>
            <button part="captions-button" class="captions-btn" type="button" aria-label="Captions" aria-pressed="false">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>
              </svg>
            </button>
            <button part="fullscreen-button" class="fullscreen-btn" type="button" aria-label="Fullscreen">
              <svg class="icon-fs-enter" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
              <svg class="icon-fs-exit" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="sr-status" role="status" aria-live="polite"></div>
      </div>
    `

    this.#controls = /** @type {HTMLElement} */ (shadow.querySelector('.controls'))
    this.#playBtn = /** @type {HTMLButtonElement} */ (shadow.querySelector('.play-btn'))
    this.#playOverlay = /** @type {HTMLButtonElement} */ (shadow.querySelector('.play-overlay'))
    this.#timeline = /** @type {HTMLInputElement} */ (shadow.querySelector('.timeline'))
    this.#timelineFill = /** @type {HTMLElement} */ (shadow.querySelector('.timeline-fill'))
    this.#timelineBuffer = /** @type {HTMLElement} */ (shadow.querySelector('.timeline-buffer'))
    this.#volumeSlider = /** @type {HTMLInputElement} */ (shadow.querySelector('.volume'))
    this.#currentTimeEl = /** @type {HTMLElement} */ (shadow.querySelector('.current-time'))
    this.#durationEl = /** @type {HTMLElement} */ (shadow.querySelector('.duration'))
    this.#speedBtn = /** @type {HTMLButtonElement} */ (shadow.querySelector('.speed-btn'))
    this.#captionsBtn = /** @type {HTMLButtonElement} */ (shadow.querySelector('.captions-btn'))
    this.#fullscreenBtn = /** @type {HTMLButtonElement} */ (shadow.querySelector('.fullscreen-btn'))
    this.#bufferIndicator = /** @type {HTMLElement} */ (shadow.querySelector('.buffer-indicator'))
    this.#statusEl = /** @type {HTMLElement} */ (shadow.querySelector('.sr-status'))
    this.#muteBtn = /** @type {HTMLButtonElement} */ (shadow.querySelector('.mute-btn'))
  }

  /** Hide the captions button when the video has no caption/subtitle track. */
  #syncCaptionsButton() {
    const hasCaptions = this.#video.querySelector('track[kind="captions"], track[kind="subtitles"]')
    this.#captionsBtn.hidden = !hasCaptions
  }

  // ─── Labels & formatting (i18n) ────────────────────────────────────────────

  /**
   * Author-overridable UI string from data-label-<key>, with {var} substitution.
   * @param {string} key
   * @param {Record<string, string>} [vars]
   */
  #label(key, vars = {}) {
    let text = this.getAttribute(`data-label-${key}`) ?? LABELS[key] ?? key
    for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, v)
    return text
  }

  /** Locale from the closest [lang]; formatters are rebuilt on every setup(). */
  #initFormatters() {
    this.#locale = getLocale(this)
    try { this.#nf = new Intl.NumberFormat(this.#locale, { useGrouping: false }) }
    catch { this.#nf = new Intl.NumberFormat('en', { useGrouping: false }) }
    const DF = /** @type {any} */ (Intl).DurationFormat
    try { this.#df = DF ? new DF(this.#locale, { style: 'digital', hoursDisplay: 'auto' }) : null }
    catch { this.#df = null }
  }

  /** Write every static label (re-run each setup so data-label-* edits apply). */
  #applyLabels() {
    const sr = /** @type {ShadowRoot} */ (this.shadowRoot)
    const set = (sel, key) => sr.querySelector(sel)?.setAttribute('aria-label', this.#label(key))
    set('.controls', 'controls')
    set('.play-overlay', 'play-video')
    set('.timeline', 'seek')
    set('.skip-back-btn', 'skip-back')
    set('.skip-forward-btn', 'skip-forward')
    set('.mute-btn', 'mute')
    set('.volume', 'volume')
    set('.captions-btn', 'captions')
    this.#fullscreenBtn.setAttribute('aria-label', this.#label(this.#isFullscreen() ? 'exit-fullscreen' : 'fullscreen'))
    this.#updateSpeedLabel()

    // The host is the focus target for the shortcuts (they never fire from
    // inside a control), so give that tab stop a role, a name and the keys.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0')
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group')
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
      this.setAttribute('aria-label', this.#label('player'))
    }
    if (!this.hasAttribute('aria-keyshortcuts')) {
      this.setAttribute('aria-keyshortcuts', 'Space K ArrowLeft ArrowRight ArrowUp ArrowDown M F C')
    }
  }

  #updateSpeedLabel() {
    const rate = /** @type {number} */ (PLAYBACK_RATES[this.#rateIndex])
    const text = `${this.#nf?.format(rate) ?? rate}x`
    const speedLabel = /** @type {HTMLElement} */ (this.#speedBtn.querySelector('span'))
    speedLabel.textContent = text
    this.#speedBtn.setAttribute('aria-label', this.#label('speed', { rate: text }))
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  #styles() {
    return /* css */`
      :host {
        display: block;
        --_accent: var(--video-player-accent, var(--color-primary, oklch(55% 0.2 260)));
        --_controls-text: var(--video-player-controls-text, #fff);
        --_radius: var(--video-player-radius, var(--radius-m, 0.5rem));
        --_border: var(--video-player-border, none);
        --_shadow: var(--video-player-shadow, none);
        --_controls-padding: var(--video-player-controls-padding, var(--size-xs, 0.5rem) var(--size-s, 0.75rem));
        --_overlay-bg: var(--video-player-overlay-bg, oklch(0% 0 0 / 0.4));
        --_timeline-height: var(--video-player-timeline-height, 4px);
        --_timeline-buffer: var(--video-player-timeline-buffer, oklch(100% 0 0 / 0.3));
      }

      .player {
        position: relative;
        container-type: normal;
        background: #000;
        border: var(--_border);
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        overflow: hidden;
        line-height: 0;
      }

      /* ── Slotted video ──────────────────────────── */
      ::slotted(video) {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;  /* fallback before metadata loads; intrinsic ratio overrides once known */
      }

      ::slotted(details) {
        line-height: 1.5;
      }

      /* ── Play overlay ───────────────────────────── */
      .play-overlay {
        all: unset;
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;
        transition: opacity var(--duration-fast, 200ms) var(--ease-default, ease);
      }

      .play-overlay svg {
        background: var(--_overlay-bg);
        border-radius: var(--radius-full, 50%);
        padding: 1rem;
        color: var(--_controls-text);
        transition: transform var(--duration-fast, 150ms) var(--ease-default, ease),
                    background var(--duration-fast, 150ms) var(--ease-default, ease);
      }

      .play-overlay:hover svg {
        transform: scale(1.1);
        background: oklch(0% 0 0 / 0.6);
      }

      .play-overlay:focus-visible svg {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 4px;
      }

      :host([state="playing"]) .play-overlay,
      :host([state="buffering"]) .play-overlay {
        opacity: 0;
        pointer-events: none;
      }

      :host([state="paused"]) .play-overlay {
        opacity: 0;
        pointer-events: none;
      }

      :host([state="ended"]) .play-overlay {
        opacity: 1;
        pointer-events: auto;
      }

      /* ── Buffer indicator ───────────────────────── */
      .buffer-indicator {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 1;
        opacity: 0;
        color: var(--_controls-text);
        transition: opacity var(--duration-fast, 200ms) var(--ease-default, ease);
      }

      .buffer-indicator svg {
        animation: vp-spin 1s linear infinite;
      }

      :host([state="buffering"]) .buffer-indicator {
        opacity: 1;
      }

      @keyframes vp-spin {
        to { transform: rotate(360deg); }
      }

      /* ── Controls gradient ──────────────────────── */
      .controls-gradient {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(transparent, oklch(0% 0 0 / 0.7));
        pointer-events: none;
        z-index: 3;
        transition: opacity var(--duration-fast, 300ms) var(--ease-default, ease);
      }

      /* ── Controls overlay ───────────────────────── */
      /* Media transport controls stay left-to-right in RTL pages (the
         timeline runs start→end of the media, like every platform player);
         the fill/buffer bars and the volume gradient rely on this. */
      .controls {
        direction: ltr;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 4;
        padding: var(--_controls-padding);
        color: var(--_controls-text);
        line-height: 1.4;
        transition: opacity var(--duration-fast, 300ms) var(--ease-default, ease),
                    visibility var(--duration-fast, 300ms);
      }

      /* Controls hidden state */
      :host([state="playing"]:not([controls])) .controls,
      :host([state="playing"]:not([controls])) .controls-gradient {
        opacity: 0;
        visibility: hidden;
      }

      :host([state="playing"]:not([controls])) {
        cursor: none;
      }

      /* ── Timeline ───────────────────────────────── */
      .timeline-wrap {
        position: relative;
        height: 1.25rem;
        display: flex;
        align-items: center;
        margin-block-end: var(--size-3xs, 2px);
      }

      .timeline-fill {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: var(--_timeline-height);
        background: var(--_accent);
        pointer-events: none;
        border-radius: var(--radius-full, 2px);
        width: 0%;
        z-index: 2;
        transition: width var(--duration-instant, 50ms) linear;
      }

      .timeline-buffer {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: var(--_timeline-height);
        background: var(--_timeline-buffer);
        pointer-events: none;
        border-radius: var(--radius-full, 2px);
        width: 0%;
        z-index: 1;
      }

      .timeline {
        width: 100%;
        height: 1.25rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        z-index: 3;
      }

      .timeline::-webkit-slider-runnable-track {
        height: var(--_timeline-height);
        background: oklch(100% 0 0 / 0.2);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-moz-range-track {
        height: var(--_timeline-height);
        background: oklch(100% 0 0 / 0.2);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: 2px solid var(--_controls-text);
        cursor: pointer;
        margin-top: -5px;
        transition: transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .timeline:hover::-webkit-slider-thumb {
        transform: scale(1.3);
      }

      .timeline::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: 2px solid var(--_controls-text);
        cursor: pointer;
      }

      .timeline:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 4px;
        border-radius: var(--radius-s, 2px);
      }

      /* ── Controls row ───────────────────────────── */
      .controls-row {
        display: flex;
        align-items: center;
        gap: var(--size-2xs, 4px);
      }

      .spacer { flex: 1; }

      /* ── Shared button reset ────────────────────── */
      .controls-row button {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: var(--radius-s, 4px);
        cursor: pointer;
        color: var(--_controls-text);
        transition: background var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .controls-row button:hover {
        background: oklch(100% 0 0 / 0.15);
      }

      .controls-row button:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
      }

      /* ── Play button (controls row) ─────────────── */
      .icon-pause { display: none; }
      :host([state="playing"]) .icon-play { display: none; }
      :host([state="playing"]) .icon-pause { display: block; }

      /* ── Fullscreen icons ───────────────────────── */
      .icon-fs-exit { display: none; }
      :host([data-fullscreen]) .icon-fs-enter { display: none; }
      :host([data-fullscreen]) .icon-fs-exit { display: block; }

      /* ── Mute icons ─────────────────────────────── */
      .icon-muted { display: none; }
      :host([muted]) .icon-vol { display: none; }
      :host([muted]) .icon-muted { display: block; }

      /* ── Volume ─────────────────────────────────── */
      .volume-wrap {
        display: flex;
        align-items: center;
        gap: 0;
        flex: 0 0 auto;
      }

      .volume {
        width: 60px;
        height: 1rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
      }

      .volume::-webkit-slider-runnable-track {
        height: 3px;
        background: linear-gradient(to right,
          var(--_accent) calc(var(--_vol, 1) * 100%),
          oklch(100% 0 0 / 0.3) calc(var(--_vol, 1) * 100%));
        border-radius: var(--radius-full, 2px);
      }

      .volume::-moz-range-track {
        height: 3px;
        background: oklch(100% 0 0 / 0.3);
        border-radius: var(--radius-full, 2px);
      }

      .volume::-moz-range-progress {
        height: 3px;
        background: var(--_accent);
        border-radius: var(--radius-full, 2px);
      }

      .volume::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full, 50%);
        background: var(--_controls-text);
        border: none;
        cursor: pointer;
        margin-top: -3.5px;
        transition: transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .volume:hover::-webkit-slider-thumb {
        transform: scale(1.3);
      }

      .volume::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full, 50%);
        background: var(--_controls-text);
        border: none;
        cursor: pointer;
      }

      .volume:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
        border-radius: var(--radius-s, 2px);
      }

      /* ── Time display ───────────────────────────── */
      .time-display {
        font-size: var(--font-size-xs, 0.75rem);
        font-family: var(--font-mono, ui-monospace, monospace);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        padding-inline: var(--size-2xs, 4px);
      }

      .time-sep { opacity: 0.6; }

      /* ── Speed button ───────────────────────────── */
      .speed-btn {
        font-size: var(--font-size-xs, 0.75rem);
        font-weight: 600;
        min-width: 2.5rem;
        width: auto !important;
      }

      /* ── Captions button ────────────────────────── */
      :host([captions]) .captions-btn {
        background: oklch(100% 0 0 / 0.2);
      }

      .captions-btn[hidden] { display: none; }

      /* ── Screen reader only ─────────────────────── */
      .sr-status {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* ── Forced colors ──────────────────────────── */
      /* Background-only bars vanish under forced colors (backgrounds become
         Canvas). Paint progress with system colours and outline the tracks. */
      @media (forced-colors: active) {
        .timeline-fill {
          forced-color-adjust: none;
          background: Highlight;
        }

        .timeline-buffer {
          forced-color-adjust: none;
          background: GrayText;
        }

        .timeline::-webkit-slider-runnable-track {
          border: 1px solid CanvasText;
        }

        .timeline::-moz-range-track {
          border: 1px solid CanvasText;
        }

        .volume {
          forced-color-adjust: none;
        }

        .volume::-webkit-slider-runnable-track {
          border: 1px solid CanvasText;
          background: linear-gradient(to right,
            Highlight calc(var(--_vol, 1) * 100%),
            Canvas calc(var(--_vol, 1) * 100%));
        }

        .volume::-moz-range-track {
          border: 1px solid CanvasText;
          background: Canvas;
        }

        .volume::-moz-range-progress {
          background: Highlight;
        }

        .volume::-webkit-slider-thumb {
          background: CanvasText;
        }

        .volume::-moz-range-thumb {
          background: CanvasText;
        }

        .play-overlay svg {
          border: 1px solid CanvasText;
        }
      }

      /* ── Reduced motion ─────────────────────────── */
      @media (prefers-reduced-motion: reduce) {
        .play-overlay svg,
        .buffer-indicator svg,
        .controls,
        .controls-gradient,
        .timeline-fill,
        .timeline::-webkit-slider-thumb,
        .volume::-webkit-slider-thumb,
        .controls-row button {
          transition: none;
        }

        .buffer-indicator svg {
          animation: none;
        }

        .play-overlay:hover svg,
        .timeline:hover::-webkit-slider-thumb,
        .volume:hover::-webkit-slider-thumb {
          transform: none;
        }

        /* Keep controls permanently visible */
        :host([state="playing"]:not([controls])) .controls,
        :host([state="playing"]:not([controls])) .controls-gradient {
          opacity: 1;
          visibility: visible;
        }

        :host([state="playing"]:not([controls])) {
          cursor: auto;
        }
      }
    `
  }

  // ─── Video events ──────────────────────────────────────────────────────────

  #attachVideoEvents() {
    const v = this.#video
    this.listen(v, 'timeupdate', () => this.#handleTimeUpdate())
    this.listen(v, 'loadedmetadata', () => { this.#updateDuration(); this.#handleTimeUpdate() })
    this.listen(v, 'durationchange', () => this.#updateDuration())
    this.listen(v, 'progress', () => this.#updateBuffered())
    this.listen(v, 'volumechange', () => this.#syncMuted())

    this.listen(v, 'play', () => {
      this.#playing = true
      this.#setState('playing')
      this.#playBtn.setAttribute('aria-label', this.#label('pause'))
      this.#announce(this.#label('playing'))
      this.#emit('video-player:play', {
        currentTime: v.currentTime,
        src: v.currentSrc
      })
    })

    this.listen(v, 'pause', () => {
      this.#playing = false
      // 'ended' fires after a final 'pause'; let it own the state
      if (!v.ended) this.#setState('paused')
      this.#playBtn.setAttribute('aria-label', this.#label('play'))
      this.#showControls()
      this.#announce(this.#label('paused'))
      this.#emit('video-player:pause', {
        currentTime: v.currentTime
      })
    })

    this.listen(v, 'ended', () => {
      this.#playing = false
      this.#setState('ended')
      this.#playBtn.setAttribute('aria-label', this.#label('play'))
      this.#showControls()

      // Mark track as played
      const active = this.#trackList?.querySelector('li[data-video-active]')
      if (active) active.setAttribute('data-video-played', '')

      // Auto-advance to next track
      if (this.#trackList) {
        this.#playNext()
      }

      this.#announce(this.#label('ended'))
      this.#emit('video-player:ended', { src: v.currentSrc })
    })

    this.listen(v, 'waiting', () => {
      if (this.#playing) {
        this.#setState('buffering')
        this.#announce(this.#label('buffering'))
      }
    })

    this.listen(v, 'playing', () => {
      if (this.getAttribute('state') === 'buffering') {
        this.#setState('playing')
      }
    })
  }

  /**
   * Set the reflected [state]. The big play overlay is only shown in idle and
   * ended; in every other state it is invisible, so make it inert too (out of
   * the tab order and the accessibility tree).
   * @param {'idle' | 'playing' | 'paused' | 'ended' | 'buffering'} state
   */
  #setState(state) {
    this.setAttribute('state', state)
    if (this.#playOverlay) this.#playOverlay.inert = !(state === 'idle' || state === 'ended')
  }

  // ─── Control events ────────────────────────────────────────────────────────

  #attachControlEvents() {
    const sr = /** @type {ShadowRoot} */ (this.shadowRoot)
    const togglePlay = () => {
      if (this.#playing) this.#video.pause()
      else this.#video.play().catch(() => {})
    }

    // Play overlay
    this.listen(this.#playOverlay, 'click', (e) => {
      e.stopPropagation()
      this.#video.play().catch(() => {})
    })

    // Click on player area to toggle play/pause
    const player = /** @type {HTMLElement} */ (sr.querySelector('.player'))
    this.listen(player, 'click', (e) => {
      // Only respond to clicks on the slot area (video), not on controls
      const target = /** @type {Element} */ (e.target)
      if (target.closest('.controls') || target.closest('.play-overlay')) return
      // Light-DOM content (playlist <details>) is slotted too; only the video toggles
      if (target !== this.#video && !(target === player)) return
      togglePlay()
    })

    // Play/pause button
    this.listen(this.#playBtn, 'click', togglePlay)

    // Seek
    this.listen(this.#timeline, 'input', () => {
      if (!this.#video.duration) return
      this.#video.currentTime = (Number(this.#timeline.value) / 100) * this.#video.duration
      this.#updateValueText()
    })

    // Arrow keys on the seek slider move by SLIDER_SEEK_STEP seconds (the
    // native 0.1% step is imperceptible). The controls are always LTR, so
    // Left/Down is back. Home/End/PageUp/PageDown stay native.
    this.listen(this.#timeline, 'keydown', (e) => {
      const ke = /** @type {KeyboardEvent} */ (e)
      if (ke.altKey || ke.ctrlKey || ke.metaKey) return
      const dir = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[ke.key]
      if (!dir) return
      ke.preventDefault()
      this.#seekBy(dir * SLIDER_SEEK_STEP)
    })

    // Skip back/forward
    this.listen(/** @type {HTMLElement} */ (sr.querySelector('.skip-back-btn')), 'click', () => this.#seekBy(-SEEK_STEP))
    this.listen(/** @type {HTMLElement} */ (sr.querySelector('.skip-forward-btn')), 'click', () => this.#seekBy(SEEK_STEP))

    // Volume (volumechange → #syncMuted updates the UI)
    this.listen(this.#volumeSlider, 'input', () => {
      this.#video.volume = Number(this.#volumeSlider.value)
      this.#video.muted = false
      this.#syncMuted()
    })

    // Mute toggle (label stays "Mute"; aria-pressed carries the state)
    this.listen(this.#muteBtn, 'click', () => {
      this.#video.muted = !this.#video.muted
      this.#syncMuted()
    })

    // Speed
    this.listen(this.#speedBtn, 'click', () => {
      this.#rateIndex = (this.#rateIndex + 1) % PLAYBACK_RATES.length
      const rate = /** @type {number} */ (PLAYBACK_RATES[this.#rateIndex])
      this.#video.playbackRate = rate
      this.#updateSpeedLabel()
      this.#emit('video-player:speed', { rate })
    })

    // Captions toggle
    this.listen(this.#captionsBtn, 'click', () => {
      const track = this.#getCaptionTrack()
      if (!track) return

      const showing = track.mode === 'showing'
      track.mode = showing ? 'hidden' : 'showing'
      const active = !showing
      this.toggleAttribute('captions', active)
      this.#captionsBtn.setAttribute('aria-pressed', String(active))
      this.#emit('video-player:captions', { active, label: track.label })
    })

    // Fullscreen
    this.listen(this.#fullscreenBtn, 'click', () => this.#toggleFullscreen())

    // Keyboard shortcuts on the host. Events from shadow controls are
    // retargeted to the host, so e.target is useless here: walk the composed
    // path and bail if the real target is an interactive control (sliders,
    // buttons, playlist summary/links), which keep their native keys.
    this.listen(this, 'keydown', (e) => this.#handleKeydown(/** @type {KeyboardEvent} */ (e)))
  }

  /**
   * True when a key event originated inside an interactive control that lives
   * within this player (light or shadow DOM), up to but excluding the host.
   * @param {Event} e
   */
  #fromInteractive(e) {
    for (const node of e.composedPath()) {
      if (node === this) return false
      if (node instanceof Element && node.matches(INTERACTIVE)) return true
    }
    return false
  }

  /** @param {number} delta seconds */
  #seekBy(delta) {
    const d = this.#video.duration || 0
    this.#video.currentTime = Math.min(d, Math.max(0, this.#video.currentTime + delta))
    this.#showControls()
    this.#handleTimeUpdate()
  }

  // ─── Idle tracking (controls visibility) ───────────────────────────────────

  #attachIdleTracking() {
    const player = /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('.player'))

    const resetIdle = () => {
      this.#showControls()
      this.#armIdle(IDLE_TIMEOUT)
    }

    this.listen(player, 'mousemove', resetIdle)
    this.listen(player, 'mouseenter', resetIdle)
    this.listen(player, 'mouseleave', () => this.#armIdle(500))

    // Touch: tap to toggle
    this.listen(player, 'touchstart', () => {
      if (this.hasAttribute('controls')) {
        this.#hideControls()
      } else {
        resetIdle()
      }
    }, { passive: true })

    // Keep controls visible when interacting with them
    this.listen(this.#controls, 'mouseenter', () => {
      if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
      this.#showControls()
    })

    this.listen(this.#controls, 'focusin', () => {
      if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
      this.#showControls()
    })

    // Focus left the controls: resume auto-hide
    this.listen(this.#controls, 'focusout', () => this.#armIdle(IDLE_TIMEOUT))
  }

  /** @param {number} ms */
  #armIdle(ms) {
    if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
    this.#idleTimer = null
    if (this.#playing) this.#idleTimer = setTimeout(() => this.#hideControls(), ms)
  }

  #showControls() {
    this.setAttribute('controls', '')
  }

  /** Auto-hide — never while keyboard focus is inside the controls. */
  #hideControls() {
    const active = this.shadowRoot?.activeElement
    if (active && this.#controls?.contains(active)) return
    this.removeAttribute('controls')
  }

  // ─── Track list events ─────────────────────────────────────────────────────

  #attachTrackListEvents() {
    if (!this.#trackList) return

    this.listen(this.#trackList, 'click', (e) => {
      const link = /** @type {HTMLAnchorElement | null} */ (/** @type {Element} */ (e.target).closest('a[href]'))
      if (!link) return
      e.preventDefault()

      this.#loadTrack(link.href, link.closest('li'), link)
    })
  }

  #loadTrack(src, li, link) {
    // Update active state
    const items = /** @type {Element} */ (this.#trackList).querySelectorAll('li')
    items.forEach(item => item.removeAttribute('data-video-active'))
    if (li) li.setAttribute('data-video-active', '')

    this.#video.src = src

    // Update poster if track has data-poster
    const poster = link?.getAttribute('data-poster')
    if (poster) {
      this.#video.poster = poster
    }

    // Update captions if track has data-captions
    const captionsSrc = link?.getAttribute('data-captions')
    this.#updateCaptionTrack(captionsSrc)

    this.#video.play().catch(() => {})

    this.#emit('video-player:track-change', {
      src,
      title: link?.textContent ?? ''
    })
  }

  #updateCaptionTrack(src) {
    // Remove existing dynamic tracks
    const existingTracks = this.#video.querySelectorAll('track[data-dynamic]')
    existingTracks.forEach(t => t.remove())

    if (src) {
      const track = document.createElement('track')
      track.kind = 'captions'
      track.src = src
      track.default = true
      track.setAttribute('data-dynamic', '')
      this.#video.appendChild(track)

      if (this.hasAttribute('captions')) {
        track.track.mode = 'showing'
      }
    }

    this.#syncCaptionsButton()
  }

  #playNext() {
    if (!this.#trackList) return

    const items = [...this.#trackList.querySelectorAll('li')]
    const activeIdx = items.findIndex(li => li.hasAttribute('data-video-active'))

    if (this.hasAttribute('shuffle')) {
      const remaining = items.filter((_, i) => i !== activeIdx)
      if (remaining.length) {
        const next = remaining[Math.floor(Math.random() * remaining.length)]
        const link = /** @type {HTMLAnchorElement | null} */ (next.querySelector('a[href]'))
        if (link) this.#loadTrack(link.href, next, link)
      }
      return
    }

    const nextIdx = activeIdx + 1
    if (nextIdx < items.length) {
      const link = /** @type {HTMLAnchorElement | null} */ (items[nextIdx].querySelector('a[href]'))
      if (link) this.#loadTrack(link.href, items[nextIdx], link)
    } else if (this.hasAttribute('loop')) {
      const link = /** @type {HTMLAnchorElement | null} */ (items[0]?.querySelector('a[href]'))
      if (link) this.#loadTrack(link.href, items[0], link)
    }
  }

  // ─── Time & progress ──────────────────────────────────────────────────────

  #handleTimeUpdate() {
    const t = this.#video.currentTime
    const d = this.#video.duration || 0
    const pct = d ? (t / d) * 100 : 0

    this.#currentTimeEl.textContent = this.#formatTime(t)
    this.#timeline.value = String(pct)
    this.#updateValueText()
    this.#timelineFill.style.width = `${pct}%`
  }

  /** Spoken value for the seek slider, e.g. "0:05 of 3:20". */
  #updateValueText() {
    this.#timeline.setAttribute('aria-valuetext', this.#label('time-of', {
      current: this.#formatTime(this.#video.currentTime),
      duration: this.#formatTime(this.#video.duration || 0),
    }))
  }

  #updateDuration() {
    const d = this.#video.duration || 0
    this.#durationEl.textContent = this.#formatTime(d)
    this.#updateValueText()
  }

  #updateBuffered() {
    const buf = this.#video.buffered
    const d = this.#video.duration || 0
    if (buf.length > 0 && d) {
      const end = buf.end(buf.length - 1)
      this.#timelineBuffer.style.width = `${(end / d) * 100}%`
    }
  }

  // ─── Fullscreen ────────────────────────────────────────────────────────────

  /** True when this player (or its own video) is the fullscreen element. */
  #isFullscreen() {
    const el = document.fullscreenElement
    return !!el && (el === this || el === this.#video)
  }

  /** @param {boolean} active */
  #reflectFullscreen(active) {
    if (active) this.setAttribute('data-fullscreen', '')
    else this.removeAttribute('data-fullscreen')
  }

  #toggleFullscreen() {
    if (this.#isFullscreen()) {
      document.exitFullscreen().catch(() => {})
    } else {
      this.requestFullscreen().catch(() => {
        // Fallback: try the video element directly
        this.#video.requestFullscreen?.().catch(() => {})
      })
    }
  }

  // ─── Captions ──────────────────────────────────────────────────────────────

  /** Reflect the caption track's mode into [captions] + aria-pressed. */
  #syncCaptionsState() {
    const track = this.#getCaptionTrack()
    // No track yet (a dynamic data-captions track may follow): keep the
    // authored [captions] so #updateCaptionTrack can honour it.
    if (!track || !this.#captionsBtn) return
    const active = track.mode === 'showing'
    this.toggleAttribute('captions', active)
    this.#captionsBtn.setAttribute('aria-pressed', String(active))
  }

  #getCaptionTrack() {
    const tracks = this.#video.textTracks
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') {
        return tracks[i]
      }
    }
    return null
  }

  // ─── Keyboard ──────────────────────────────────────────────────────────────

  /** @param {KeyboardEvent} e */
  #handleKeydown(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    if (this.#fromInteractive(e)) return

    switch (e.key) {
      case ' ':
      case 'k':
      case 'K':
        e.preventDefault()
        if (this.#playing) this.#video.pause()
        else this.#video.play().catch(() => {})
        break
      case 'ArrowLeft':
        e.preventDefault()
        this.#seekBy(-SEEK_STEP)
        break
      case 'ArrowRight':
        e.preventDefault()
        this.#seekBy(SEEK_STEP)
        break
      case 'ArrowUp':
        e.preventDefault()
        this.#video.volume = Math.min(1, this.#video.volume + 0.05)
        this.#syncMuted()
        this.#showControls()
        break
      case 'ArrowDown':
        e.preventDefault()
        this.#video.volume = Math.max(0, this.#video.volume - 0.05)
        this.#syncMuted()
        this.#showControls()
        break
      case 'm':
      case 'M':
        this.#video.muted = !this.#video.muted
        this.#syncMuted()
        break
      case 'f':
      case 'F':
        this.#toggleFullscreen()
        break
      case 'c':
      case 'C':
        this.#captionsBtn.click()
        break
    }
  }

  /** Reflect video.muted/volume into [muted], aria-pressed and the slider. */
  #syncMuted() {
    if (!this.#video || !this.#muteBtn) return
    const muted = this.#video.muted
    this.toggleAttribute('muted', muted)
    this.#muteBtn.setAttribute('aria-pressed', String(muted))
    const vol = this.#video.volume
    this.#volumeSlider.value = String(vol)
    this.#volumeSlider.style.setProperty('--_vol', muted ? '0' : String(vol))
    let pct
    try { pct = new Intl.NumberFormat(this.#locale, { style: 'percent' }).format(vol) }
    catch { pct = `${Math.round(vol * 100)}%` }
    this.#volumeSlider.setAttribute('aria-valuetext', pct)
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Clock-style time ("3:20", "1:02:05") in the player's locale. Uses
   * Intl.DurationFormat (digital) when available — its leading unit is
   * zero-padded, so that part is re-rendered unpadded — and falls back to a
   * NumberFormat-built m:ss.
   * @param {number} seconds
   */
  #formatTime(seconds) {
    const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const nf = this.#nf ?? new Intl.NumberFormat('en', { useGrouping: false })

    if (this.#df) {
      try {
        const parts = this.#df.formatToParts({ hours: h, minutes: m, seconds: s })
        let first = true
        return parts.map((/** @type {{type: string, value: string, unit?: string}} */ p) => {
          if (first && p.type === 'integer') {
            first = false
            return nf.format(p.unit === 'hour' ? h : m)
          }
          return p.value
        }).join('')
      } catch { /* fall through */ }
    }

    const pad = (/** @type {number} */ n) => nf.format(n).padStart(2, nf.format(0))
    return h > 0 ? `${nf.format(h)}:${pad(m)}:${pad(s)}` : `${nf.format(m)}:${pad(s)}`
  }

  #announce(text) {
    if (this.#statusEl) {
      this.#statusEl.textContent = text
    }
  }

  #emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail
    }))
  }
}

registerComponent('video-player', VideoPlayerElement)

export { VideoPlayerElement }
