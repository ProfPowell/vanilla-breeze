/**
 * video-player: Platform video player web component
 *
 * Wraps a native <video> element (light DOM) with custom overlay controls
 * rendered in shadow DOM. The <video> and optional <details class="track-list">
 * stay in light DOM — if JS is unavailable, native controls and track links work.
 *
 * @attr {boolean} autoplay - Start playing on load (subject to browser autoplay policy)
 * @attr {boolean} loop - Loop single track or entire playlist
 * @attr {boolean} muted - Start muted
 *
 * @fires video-player:play - Video playback started
 * @fires video-player:pause - Video playback paused
 * @fires video-player:ended - Video playback ended
 * @fires video-player:track-change - Track changed in playlist mode
 * @fires video-player:fullscreen - Fullscreen state changed
 * @fires video-player:speed - Playback speed changed
 * @fires video-player:captions - Captions toggled
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

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]
const IDLE_TIMEOUT = 3000

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

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  setup() {
    this.#video = /** @type {HTMLVideoElement} */ (this.querySelector('video'))
    if (!this.#video) return false

    this.#trackList = this.querySelector('.track-list')

    // Suppress native controls — we provide our own
    this.#video.removeAttribute('controls')

    const firstConnect = !this.shadowRoot
    this.#buildShadow()
    if (firstConnect) {
      this.#attachVideoEvents()
      this.#attachControlEvents()
      this.#attachTrackListEvents()
      this.#attachIdleTracking()
    }

    if (this.hasAttribute('muted')) {
      this.#video.muted = true
      this.setAttribute('muted', '')
    }

    if (this.hasAttribute('autoplay')) {
      this.#video.play().catch(() => {})
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

    // Fullscreen change — may exit from Escape key without our button
    this.#onFullscreenChange = () => {
      const active = !!document.fullscreenElement
      this.toggleAttribute('data-fullscreen', active)
      this.#fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Fullscreen')
      this.#emit('video-player:fullscreen', { active })
    }
    this.listen(document, 'fullscreenchange', this.#onFullscreenChange)

    this.setAttribute('state', 'idle')
    return true;
  }

  teardown() {
    // Restore native controls if component is removed
    if (this.#video) {
      this.#video.setAttribute('controls', '')
    }
    if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
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
    this.dispatchEvent(new CustomEvent('video-player:src-changed', {
      detail: { src: next, source: 'property' },
      bubbles: true,
    }));
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
                   aria-label="Seek">
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
              <button class="mute-btn" type="button" aria-label="Mute">
                <svg class="icon-vol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <svg class="icon-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
                </svg>
              </button>
              <input part="volume" type="range" class="volume"
                     min="0" max="1" value="1" step="0.01"
                     aria-label="Volume">
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

    // Hide captions button if no caption/subtitle tracks
    const hasCaptions = this.#video.querySelector('track[kind="captions"], track[kind="subtitles"]')
    if (!hasCaptions) {
      this.#captionsBtn.hidden = true
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  #styles() {
    return /* css */`
      :host {
        display: block;
        --_accent: var(--video-player-accent, var(--color-primary, oklch(55% 0.2 260)));
        --_controls-bg: var(--video-player-controls-bg, oklch(0% 0 0 / 0.75));
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
      .controls {
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
    this.#video.addEventListener('timeupdate', () => this.#handleTimeUpdate())
    this.#video.addEventListener('loadedmetadata', () => this.#updateDuration())
    this.#video.addEventListener('progress', () => this.#updateBuffered())

    this.#video.addEventListener('play', () => {
      this.#playing = true
      this.setAttribute('state', 'playing')
      this.#playBtn.setAttribute('aria-label', 'Pause')
      this.#announce('Playing')
      this.#emit('video-player:play', {
        currentTime: this.#video.currentTime,
        src: this.#video.currentSrc
      })
    })

    this.#video.addEventListener('pause', () => {
      this.#playing = false
      this.setAttribute('state', 'paused')
      this.#playBtn.setAttribute('aria-label', 'Play')
      this.#showControls()
      this.#announce('Paused')
      this.#emit('video-player:pause', {
        currentTime: this.#video.currentTime
      })
    })

    this.#video.addEventListener('ended', () => {
      this.#playing = false
      this.setAttribute('state', 'ended')
      this.#playBtn.setAttribute('aria-label', 'Play')
      this.#showControls()

      // Mark track as played
      const active = this.#trackList?.querySelector('li[data-video-active]')
      if (active) active.setAttribute('data-video-played', '')

      // Auto-advance to next track
      if (this.#trackList) {
        this.#playNext()
      }

      this.#announce('Ended')
      this.#emit('video-player:ended', { src: this.#video.currentSrc })
    })

    this.#video.addEventListener('waiting', () => {
      if (this.#playing) {
        this.setAttribute('state', 'buffering')
        this.#announce('Buffering')
      }
    })

    this.#video.addEventListener('playing', () => {
      if (this.getAttribute('state') === 'buffering') {
        this.setAttribute('state', 'playing')
      }
    })
  }

  // ─── Control events ────────────────────────────────────────────────────────

  #attachControlEvents() {
    // Play overlay
    this.#playOverlay.addEventListener('click', (e) => {
      e.stopPropagation()
      this.#video.play().catch(() => {})
    })

    // Click on player area to toggle play/pause
    const player = /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('.player'))
    player.addEventListener('click', (e) => {
      // Only respond to clicks on the slot area (video), not on controls
      if (/** @type {Element} */ (e.target).closest('.controls') || /** @type {Element} */ (e.target).closest('.play-overlay')) return
      if (this.#playing) {
        this.#video.pause()
      } else {
        this.#video.play().catch(() => {})
      }
    })

    // Play/pause button
    this.#playBtn.addEventListener('click', () => {
      if (this.#playing) {
        this.#video.pause()
      } else {
        this.#video.play().catch(() => {})
      }
    })

    // Seek
    this.#timeline.addEventListener('input', () => {
      if (!this.#video.duration) return
      this.#video.currentTime = (Number(this.#timeline.value) / 100) * this.#video.duration
    })

    // Skip back/forward
    const skipBack = /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('.skip-back-btn'))
    skipBack.addEventListener('click', () => {
      this.#video.currentTime = Math.max(0, this.#video.currentTime - 10)
    })
    const skipFwd = /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('.skip-forward-btn'))
    skipFwd.addEventListener('click', () => {
      this.#video.currentTime = Math.min(this.#video.duration || 0, this.#video.currentTime + 10)
    })

    // Volume
    this.#volumeSlider.addEventListener('input', () => {
      this.#video.volume = Number(this.#volumeSlider.value)
      this.#video.muted = false
      this.removeAttribute('muted')
      this.#volumeSlider.style.setProperty('--_vol', this.#volumeSlider.value)
    })

    // Mute toggle
    const muteBtn = /** @type {HTMLButtonElement} */ (this.shadowRoot?.querySelector('.mute-btn'))
    muteBtn.addEventListener('click', () => {
      this.#video.muted = !this.#video.muted
      this.toggleAttribute('muted', this.#video.muted)
      this.#volumeSlider.style.setProperty('--_vol', this.#video.muted ? '0' : this.#volumeSlider.value)
    })

    // Speed
    this.#speedBtn.addEventListener('click', () => {
      this.#rateIndex = (this.#rateIndex + 1) % PLAYBACK_RATES.length
      const rate = /** @type {number} */ (PLAYBACK_RATES[this.#rateIndex])
      this.#video.playbackRate = rate
      const speedLabel = /** @type {HTMLElement} */ (this.#speedBtn.querySelector('span'))
      speedLabel.textContent = `${rate}x`
      this.#speedBtn.setAttribute('aria-label', `Playback speed ${rate}x`)
      this.#emit('video-player:speed', { rate })
    })

    // Captions toggle
    this.#captionsBtn.addEventListener('click', () => {
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
    this.#fullscreenBtn.addEventListener('click', () => this.#toggleFullscreen())

    // Keyboard shortcuts
    this.addEventListener('keydown', (e) => this.#handleKeydown(e))

    // Make focusable for keyboard shortcuts
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0')
    }
  }

  // ─── Idle tracking (controls visibility) ───────────────────────────────────

  #attachIdleTracking() {
    const player = /** @type {HTMLElement} */ (this.shadowRoot?.querySelector('.player'))

    const resetIdle = () => {
      this.#showControls()
      if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
      if (this.#playing) {
        this.#idleTimer = setTimeout(() => this.#hideControls(), IDLE_TIMEOUT)
      }
    }

    player.addEventListener('mousemove', resetIdle)
    player.addEventListener('mouseenter', resetIdle)
    player.addEventListener('mouseleave', () => {
      if (this.#playing) {
        if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
        this.#idleTimer = setTimeout(() => this.#hideControls(), 500)
      }
    })

    // Touch: tap to toggle
    player.addEventListener('touchstart', () => {
      if (this.hasAttribute('controls')) {
        this.#hideControls()
      } else {
        resetIdle()
      }
    }, { passive: true })

    // Keep controls visible when interacting with them
    this.#controls.addEventListener('mouseenter', () => {
      if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
      this.#showControls()
    })

    this.#controls.addEventListener('focusin', () => {
      if (this.#idleTimer != null) clearTimeout(this.#idleTimer)
      this.#showControls()
    })
  }

  #showControls() {
    this.setAttribute('controls', '')
  }

  #hideControls() {
    this.removeAttribute('controls')
  }

  // ─── Track list events ─────────────────────────────────────────────────────

  #attachTrackListEvents() {
    if (!this.#trackList) return

    this.#trackList.addEventListener('click', (e) => {
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

    // Show/hide captions button
    const hasCaptions = this.#video.querySelector('track[kind="captions"], track[kind="subtitles"]')
    this.#captionsBtn.hidden = !hasCaptions
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
    this.#timeline.setAttribute('aria-valuetext', this.#formatTimeVerbose(t))
    this.#timelineFill.style.width = `${pct}%`
  }

  #updateDuration() {
    const d = this.#video.duration || 0
    this.#durationEl.textContent = this.#formatTime(d)
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

  #toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      this.requestFullscreen().catch(() => {
        // Fallback: try the video element directly
        this.#video.requestFullscreen?.().catch(() => {})
      })
    }
  }

  // ─── Captions ──────────────────────────────────────────────────────────────

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

  #handleKeydown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

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
        this.#video.currentTime = Math.max(0, this.#video.currentTime - 10)
        this.#showControls()
        break
      case 'ArrowRight':
        e.preventDefault()
        this.#video.currentTime = Math.min(this.#video.duration || 0, this.#video.currentTime + 10)
        this.#showControls()
        break
      case 'ArrowUp':
        e.preventDefault()
        this.#video.volume = Math.min(1, this.#video.volume + 0.05)
        this.#volumeSlider.value = String(this.#video.volume)
        this.#volumeSlider.style.setProperty('--_vol', String(this.#video.volume))
        this.#showControls()
        break
      case 'ArrowDown':
        e.preventDefault()
        this.#video.volume = Math.max(0, this.#video.volume - 0.05)
        this.#volumeSlider.value = String(this.#video.volume)
        this.#volumeSlider.style.setProperty('--_vol', String(this.#video.volume))
        this.#showControls()
        break
      case 'm':
      case 'M':
        this.#video.muted = !this.#video.muted
        this.toggleAttribute('muted', this.#video.muted)
        this.#volumeSlider.style.setProperty('--_vol', this.#video.muted ? '0' : this.#volumeSlider.value)
        break
      case 'f':
      case 'F':
        this.#toggleFullscreen()
        break
      case 'c':
      case 'C':
        this.#captionsBtn.click()
        break
      case 'Escape':
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
        break
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  #formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${m}:${String(s).padStart(2, '0')}`
  }

  #formatTimeVerbose(seconds) {
    if (!Number.isFinite(seconds)) return '0 seconds'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    const parts = []
    if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`)
    if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`)
    parts.push(`${s} second${s !== 1 ? 's' : ''}`)
    return parts.join(' ')
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
