var v=window.matchMedia("(prefers-reduced-motion: reduce)");var u=new Map;function d(n,t,e={}){let s=e.priority??10,r={impl:t,bundle:e.bundle,contract:e.contract,priority:s},i=u.get(n);if(customElements.get(n)){if(!i||i.priority>=s){i&&i.priority===s&&i.impl!==t&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${i.bundle}" (priority ${i.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${n}> defined by "${i.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(i&&i.priority>=s){i.priority===s&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${i.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}u.set(n,r),customElements.define(n,t)}var l=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,s,r){t.addEventListener(e,s,r),this.#t.push(()=>t.removeEventListener(e,s,r))}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let s=this.#e.states;try{e?s.add(t):s.delete(t)}catch{let r=`--${t}`;e?s.add(r):s.delete(r)}}_adoptInternals(t){this.#e||(this.#e=t)}};var h=[.5,.75,1,1.25,1.5,2],p=3e3,c=class extends l{#t=null;#e=null;#a=!1;#p=null;#l=null;#y=null;#c=null;#g=null;#k=null;#i=null;#x=null;#w=null;#u=null;#o=null;#v=null;#_=null;#f=null;#r=null;#m=2;#E=null;#S=null;setup(){if(this.#t=this.querySelector("video"),!this.#t)return!1;this.#e=this.querySelector(".track-list"),this.#t.removeAttribute("controls");let t=!this.shadowRoot;return this.#C(),t&&(this.#z(),this.#L(),this.#$(),this.#q()),this.hasAttribute("muted")&&(this.#t.muted=!0,this.setAttribute("muted","")),this.hasAttribute("autoplay")&&this.#t.play().catch(()=>{}),this.#s(),this.#E=()=>{let e=this.shadowRoot?.querySelector(".player");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},this.listen(window,"vb:theme-change",this.#E),this.#S=()=>{let e=!!document.fullscreenElement;this.toggleAttribute("data-fullscreen",e),this.#v.setAttribute("aria-label",e?"Exit fullscreen":"Fullscreen"),this.#n("video-player:fullscreen",{active:e})},this.listen(document,"fullscreenchange",this.#S),this.setAttribute("state","idle"),!0}teardown(){this.#t&&this.#t.setAttribute("controls",""),this.#r!=null&&clearTimeout(this.#r)}get src(){return this.#t?.getAttribute("src")||this.#t?.currentSrc||""}set src(t){if(!this.#t)return;let e=t==null?"":String(t);this.#t.getAttribute("src")!==e&&(this.#t.setAttribute("src",e),this.#t.load?.(),this.dispatchEvent(new CustomEvent("video-player:src-changed",{detail:{src:e,source:"property"},bubbles:!0})))}get currentTime(){return this.#t?.currentTime??0}set currentTime(t){this.#t&&(this.#t.currentTime=Number(t)||0)}#C(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>${this.#M()}</style>
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
    `,this.#p=t.querySelector(".controls"),this.#l=t.querySelector(".play-btn"),this.#y=t.querySelector(".play-overlay"),this.#c=t.querySelector(".timeline"),this.#g=t.querySelector(".timeline-fill"),this.#k=t.querySelector(".timeline-buffer"),this.#i=t.querySelector(".volume"),this.#x=t.querySelector(".current-time"),this.#w=t.querySelector(".duration"),this.#u=t.querySelector(".speed-btn"),this.#o=t.querySelector(".captions-btn"),this.#v=t.querySelector(".fullscreen-btn"),this.#_=t.querySelector(".buffer-indicator"),this.#f=t.querySelector(".sr-status"),this.#t.querySelector('track[kind="captions"], track[kind="subtitles"]')||(this.#o.hidden=!0)}#M(){return`
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

      /* \u2500\u2500 Slotted video \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      ::slotted(video) {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;  /* fallback before metadata loads; intrinsic ratio overrides once known */
      }

      ::slotted(details) {
        line-height: 1.5;
      }

      /* \u2500\u2500 Play overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Buffer indicator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Controls gradient \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Controls overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Timeline \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Controls row \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .controls-row {
        display: flex;
        align-items: center;
        gap: var(--size-2xs, 4px);
      }

      .spacer { flex: 1; }

      /* \u2500\u2500 Shared button reset \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Play button (controls row) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-pause { display: none; }
      :host([state="playing"]) .icon-play { display: none; }
      :host([state="playing"]) .icon-pause { display: block; }

      /* \u2500\u2500 Fullscreen icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-fs-exit { display: none; }
      :host([data-fullscreen]) .icon-fs-enter { display: none; }
      :host([data-fullscreen]) .icon-fs-exit { display: block; }

      /* \u2500\u2500 Mute icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-muted { display: none; }
      :host([muted]) .icon-vol { display: none; }
      :host([muted]) .icon-muted { display: block; }

      /* \u2500\u2500 Volume \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Time display \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .time-display {
        font-size: var(--font-size-xs, 0.75rem);
        font-family: var(--font-mono, ui-monospace, monospace);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        padding-inline: var(--size-2xs, 4px);
      }

      .time-sep { opacity: 0.6; }

      /* \u2500\u2500 Speed button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .speed-btn {
        font-size: var(--font-size-xs, 0.75rem);
        font-weight: 600;
        min-width: 2.5rem;
        width: auto !important;
      }

      /* \u2500\u2500 Captions button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      :host([captions]) .captions-btn {
        background: oklch(100% 0 0 / 0.2);
      }

      .captions-btn[hidden] { display: none; }

      /* \u2500\u2500 Screen reader only \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Reduced motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
    `}#z(){this.#t.addEventListener("timeupdate",()=>this.#F()),this.#t.addEventListener("loadedmetadata",()=>this.#P()),this.#t.addEventListener("progress",()=>this.#H()),this.#t.addEventListener("play",()=>{this.#a=!0,this.setAttribute("state","playing"),this.#l.setAttribute("aria-label","Pause"),this.#h("Playing"),this.#n("video-player:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#a=!1,this.setAttribute("state","paused"),this.#l.setAttribute("aria-label","Play"),this.#s(),this.#h("Paused"),this.#n("video-player:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#a=!1,this.setAttribute("state","ended"),this.#l.setAttribute("aria-label","Play"),this.#s();let t=this.#e?.querySelector("li[data-video-active]");t&&t.setAttribute("data-video-played",""),this.#e&&this.#V(),this.#h("Ended"),this.#n("video-player:ended",{src:this.#t.currentSrc})}),this.#t.addEventListener("waiting",()=>{this.#a&&(this.setAttribute("state","buffering"),this.#h("Buffering"))}),this.#t.addEventListener("playing",()=>{this.getAttribute("state")==="buffering"&&this.setAttribute("state","playing")})}#L(){this.#y.addEventListener("click",i=>{i.stopPropagation(),this.#t.play().catch(()=>{})}),(this.shadowRoot?.querySelector(".player")).addEventListener("click",i=>{i.target.closest(".controls")||i.target.closest(".play-overlay")||(this.#a?this.#t.pause():this.#t.play().catch(()=>{}))}),this.#l.addEventListener("click",()=>{this.#a?this.#t.pause():this.#t.play().catch(()=>{})}),this.#c.addEventListener("input",()=>{this.#t.duration&&(this.#t.currentTime=Number(this.#c.value)/100*this.#t.duration)}),(this.shadowRoot?.querySelector(".skip-back-btn")).addEventListener("click",()=>{this.#t.currentTime=Math.max(0,this.#t.currentTime-10)}),(this.shadowRoot?.querySelector(".skip-forward-btn")).addEventListener("click",()=>{this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10)}),this.#i.addEventListener("input",()=>{this.#t.volume=Number(this.#i.value),this.#t.muted=!1,this.removeAttribute("muted"),this.#i.style.setProperty("--_vol",this.#i.value)}),(this.shadowRoot?.querySelector(".mute-btn")).addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#i.style.setProperty("--_vol",this.#t.muted?"0":this.#i.value)}),this.#u.addEventListener("click",()=>{this.#m=(this.#m+1)%h.length;let i=h[this.#m];this.#t.playbackRate=i;let a=this.#u.querySelector("span");a.textContent=`${i}x`,this.#u.setAttribute("aria-label",`Playback speed ${i}x`),this.#n("video-player:speed",{rate:i})}),this.#o.addEventListener("click",()=>{let i=this.#N();if(!i)return;let a=i.mode==="showing";i.mode=a?"hidden":"showing";let o=!a;this.toggleAttribute("captions",o),this.#o.setAttribute("aria-pressed",String(o)),this.#n("video-player:captions",{active:o,label:i.label})}),this.#v.addEventListener("click",()=>this.#A()),this.addEventListener("keydown",i=>this.#R(i)),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0")}#q(){let t=this.shadowRoot?.querySelector(".player"),e=()=>{this.#s(),this.#r!=null&&clearTimeout(this.#r),this.#a&&(this.#r=setTimeout(()=>this.#b(),p))};t.addEventListener("mousemove",e),t.addEventListener("mouseenter",e),t.addEventListener("mouseleave",()=>{this.#a&&(this.#r!=null&&clearTimeout(this.#r),this.#r=setTimeout(()=>this.#b(),500))}),t.addEventListener("touchstart",()=>{this.hasAttribute("controls")?this.#b():e()},{passive:!0}),this.#p.addEventListener("mouseenter",()=>{this.#r!=null&&clearTimeout(this.#r),this.#s()}),this.#p.addEventListener("focusin",()=>{this.#r!=null&&clearTimeout(this.#r),this.#s()})}#s(){this.setAttribute("controls","")}#b(){this.removeAttribute("controls")}#$(){this.#e&&this.#e.addEventListener("click",t=>{let e=t.target.closest("a[href]");e&&(t.preventDefault(),this.#d(e.href,e.closest("li"),e))})}#d(t,e,s){this.#e.querySelectorAll("li").forEach(o=>o.removeAttribute("data-video-active")),e&&e.setAttribute("data-video-active",""),this.#t.src=t;let i=s?.getAttribute("data-poster");i&&(this.#t.poster=i);let a=s?.getAttribute("data-captions");this.#B(a),this.#t.play().catch(()=>{}),this.#n("video-player:track-change",{src:t,title:s?.textContent??""})}#B(t){if(this.#t.querySelectorAll("track[data-dynamic]").forEach(r=>r.remove()),t){let r=document.createElement("track");r.kind="captions",r.src=t,r.default=!0,r.setAttribute("data-dynamic",""),this.#t.appendChild(r),this.hasAttribute("captions")&&(r.track.mode="showing")}let s=this.#t.querySelector('track[kind="captions"], track[kind="subtitles"]');this.#o.hidden=!s}#V(){if(!this.#e)return;let t=[...this.#e.querySelectorAll("li")],e=t.findIndex(r=>r.hasAttribute("data-video-active"));if(this.hasAttribute("shuffle")){let r=t.filter((i,a)=>a!==e);if(r.length){let i=r[Math.floor(Math.random()*r.length)],a=i.querySelector("a[href]");a&&this.#d(a.href,i,a)}return}let s=e+1;if(s<t.length){let r=t[s].querySelector("a[href]");r&&this.#d(r.href,t[s],r)}else if(this.hasAttribute("loop")){let r=t[0]?.querySelector("a[href]");r&&this.#d(r.href,t[0],r)}}#F(){let t=this.#t.currentTime,e=this.#t.duration||0,s=e?t/e*100:0;this.#x.textContent=this.#T(t),this.#c.value=String(s),this.#c.setAttribute("aria-valuetext",this.#D(t)),this.#g.style.width=`${s}%`}#P(){let t=this.#t.duration||0;this.#w.textContent=this.#T(t)}#H(){let t=this.#t.buffered,e=this.#t.duration||0;if(t.length>0&&e){let s=t.end(t.length-1);this.#k.style.width=`${s/e*100}%`}}#A(){document.fullscreenElement?document.exitFullscreen():this.requestFullscreen().catch(()=>{this.#t.requestFullscreen?.().catch(()=>{})})}#N(){let t=this.#t.textTracks;for(let e=0;e<t.length;e++)if(t[e].kind==="captions"||t[e].kind==="subtitles")return t[e];return null}#R(t){if(!(t.target.tagName==="INPUT"||t.target.tagName==="TEXTAREA"))switch(t.key){case" ":case"k":case"K":t.preventDefault(),this.#a?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":t.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10),this.#s();break;case"ArrowRight":t.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10),this.#s();break;case"ArrowUp":t.preventDefault(),this.#t.volume=Math.min(1,this.#t.volume+.05),this.#i.value=String(this.#t.volume),this.#i.style.setProperty("--_vol",String(this.#t.volume)),this.#s();break;case"ArrowDown":t.preventDefault(),this.#t.volume=Math.max(0,this.#t.volume-.05),this.#i.value=String(this.#t.volume),this.#i.style.setProperty("--_vol",String(this.#t.volume)),this.#s();break;case"m":case"M":this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#i.style.setProperty("--_vol",this.#t.muted?"0":this.#i.value);break;case"f":case"F":this.#A();break;case"c":case"C":this.#o.click();break;case"Escape":document.fullscreenElement&&document.exitFullscreen();break}}#T(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/3600),s=Math.floor(t%3600/60),r=Math.floor(t%60);return e>0?`${e}:${String(s).padStart(2,"0")}:${String(r).padStart(2,"0")}`:`${s}:${String(r).padStart(2,"0")}`}#D(t){if(!Number.isFinite(t))return"0 seconds";let e=Math.floor(t/3600),s=Math.floor(t%3600/60),r=Math.floor(t%60),i=[];return e>0&&i.push(`${e} hour${e!==1?"s":""}`),s>0&&i.push(`${s} minute${s!==1?"s":""}`),i.push(`${r} second${r!==1?"s":""}`),i.join(" ")}#h(t){this.#f&&(this.#f.textContent=t)}#n(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};d("video-player",c);export{c as VideoPlayerElement};
//# sourceMappingURL=video-player.js.map
