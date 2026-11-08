var x=window.matchMedia("(prefers-reduced-motion: reduce)");var v=new Map;function m(o,t,e={}){let i=e.priority??10,s={impl:t,bundle:e.bundle,contract:e.contract,priority:i},r=v.get(o);if(customElements.get(o)){if(!r||r.priority>=i){r&&r.priority===i&&r.impl!==t&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${r.bundle}" (priority ${r.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${o}> defined by "${r.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(r&&r.priority>=i){r.priority===i&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${r.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}v.set(o,s),customElements.define(o,t)}var l=class extends HTMLElement{#t=[];#e;constructor(){super(),this.hasAttribute("data-upgraded")&&this.removeAttribute("data-upgraded")}connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,s){t.addEventListener(e,i,s),this.#t.push(()=>t.removeEventListener(e,i,s))}_reinit(){for(let t of this.#t)t();this.#t=[],this.teardown(),this.removeAttribute("data-upgraded"),this.isConnected&&this.setup()!==!1&&this.setAttribute("data-upgraded","")}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let i=this.#e.states;try{e?i.add(t):i.delete(t)}catch{let s=`--${t}`;e?i.add(s):i.delete(s)}}_adoptInternals(t){this.#e||(this.#e=t)}#i(){return this.constructor.formAssociated&&this.#e?this.#e:null}get validity(){return this.#i()?.validity}get validationMessage(){return this.#i()?.validationMessage??""}get willValidate(){return this.#i()?.willValidate??!1}get form(){return this.#i()?.form??null}checkValidity(){return this.#i()?.checkValidity()??!0}reportValidity(){return this.#i()?.reportValidity()??!0}};function b(o){return o&&o.closest("[lang]")?.lang||document.documentElement.lang||navigator.language||"en"}var d=[.5,.75,1,1.25,1.5,2],y=3e3,c=10,g=5,k='input, button, a[href], summary, select, textarea, video[controls], [contenteditable]:not([contenteditable="false"])',w={player:"Video player",controls:"Video controls","play-video":"Play video",play:"Play",pause:"Pause",seek:"Seek","skip-back":"Skip back 10 seconds","skip-forward":"Skip forward 10 seconds",mute:"Mute",volume:"Volume",speed:"Playback speed {rate}",captions:"Captions",fullscreen:"Fullscreen","exit-fullscreen":"Exit fullscreen",playing:"Playing",paused:"Paused",ended:"Ended",buffering:"Buffering","time-of":"{current} of {duration}"},p=class extends l{#t=null;#e=null;#i=!1;#p=null;#c=null;#v=null;#h=null;#V=null;#B=null;#u=null;#$=null;#F=null;#m=null;#n=null;#b=null;#G=null;#_=null;#r=null;#y=2;#N=null;#H=null;#g=null;#I=!1;#k="en";#w=null;#x=null;setup(){if(this.#t=this.querySelector("video"),!this.#t)return!1;this.#e=this.querySelector(".track-list"),this.#t.removeAttribute("controls"),this.#U(),this.#Y(),this.#Q(),this.#W(),this.#et(),this.#tt(),this.#J(),this.#P(),this.hasAttribute("muted")&&(this.#t.muted=!0),this.#l(),!this.#e&&this.hasAttribute("loop")&&(this.#t.loop=!0),this.#I||(this.#I=!0,globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches?this.#t.autoplay&&(this.#t.autoplay=!1,this.#t.pause()):this.hasAttribute("autoplay")&&this.#t.play().catch(()=>{})),this.#a(),this.#N=()=>{let e=this.shadowRoot?.querySelector(".player");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},this.listen(window,"vb:theme-change",this.#N),this.#H=()=>{let e=this.#T();e!==this.hasAttribute("data-fullscreen")&&(this.#j(e),this.#b.setAttribute("aria-label",this.#s(e?"exit-fullscreen":"fullscreen")),this.#o("video-player:fullscreen",{active:e}))},this.listen(document,"fullscreenchange",this.#H),this.#j(this.#T());let t=this.#L();return t&&this.hasAttribute("captions")&&(t.mode="showing"),this.#O(),this.listen(this.#t.textTracks,"change",()=>this.#O()),this.#i=!this.#t.paused&&!this.#t.ended,this.#d(this.#t.ended?"ended":this.#i?"playing":this.#t.currentTime>0?"paused":"idle"),this.#c.setAttribute("aria-label",this.#s(this.#i?"pause":"play")),this.#q(),this.#S(),!0}teardown(){this.#t&&this.#t.setAttribute("controls",""),this.#r!=null&&clearTimeout(this.#r),this.#r=null}get src(){return this.#t?.getAttribute("src")||this.#t?.currentSrc||""}set src(t){if(!this.#t)return;let e=t==null?"":String(t);this.#t.getAttribute("src")!==e&&(this.#t.setAttribute("src",e),this.#t.load?.(),this.#o("video-player:src-changed",{src:e,source:"property"}))}get currentTime(){return this.#t?.currentTime??0}set currentTime(t){this.#t&&(this.#t.currentTime=Number(t)||0)}#U(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>${this.#X()}</style>
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
    `,this.#p=t.querySelector(".controls"),this.#c=t.querySelector(".play-btn"),this.#v=t.querySelector(".play-overlay"),this.#h=t.querySelector(".timeline"),this.#V=t.querySelector(".timeline-fill"),this.#B=t.querySelector(".timeline-buffer"),this.#u=t.querySelector(".volume"),this.#$=t.querySelector(".current-time"),this.#F=t.querySelector(".duration"),this.#m=t.querySelector(".speed-btn"),this.#n=t.querySelector(".captions-btn"),this.#b=t.querySelector(".fullscreen-btn"),this.#G=t.querySelector(".buffer-indicator"),this.#_=t.querySelector(".sr-status"),this.#g=t.querySelector(".mute-btn")}#P(){let t=this.#t.querySelector('track[kind="captions"], track[kind="subtitles"]');this.#n.hidden=!t}#s(t,e={}){let i=this.getAttribute(`data-label-${t}`)??w[t]??t;for(let[s,r]of Object.entries(e))i=i.replaceAll(`{${s}}`,r);return i}#Y(){this.#k=b(this);try{this.#w=new Intl.NumberFormat(this.#k,{useGrouping:!1})}catch{this.#w=new Intl.NumberFormat("en",{useGrouping:!1})}let t=Intl.DurationFormat;try{this.#x=t?new t(this.#k,{style:"digital",hoursDisplay:"auto"}):null}catch{this.#x=null}}#J(){let t=this.shadowRoot,e=(i,s)=>t.querySelector(i)?.setAttribute("aria-label",this.#s(s));e(".controls","controls"),e(".play-overlay","play-video"),e(".timeline","seek"),e(".skip-back-btn","skip-back"),e(".skip-forward-btn","skip-forward"),e(".mute-btn","mute"),e(".volume","volume"),e(".captions-btn","captions"),this.#b.setAttribute("aria-label",this.#s(this.#T()?"exit-fullscreen":"fullscreen")),this.#D(),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.hasAttribute("role")||this.setAttribute("role","group"),!this.hasAttribute("aria-label")&&!this.hasAttribute("aria-labelledby")&&this.setAttribute("aria-label",this.#s("player")),this.hasAttribute("aria-keyshortcuts")||this.setAttribute("aria-keyshortcuts","Space K ArrowLeft ArrowRight ArrowUp ArrowDown M F C")}#D(){let t=d[this.#y],e=`${this.#w?.format(t)??t}x`,i=this.#m.querySelector("span");i.textContent=e,this.#m.setAttribute("aria-label",this.#s("speed",{rate:e}))}#X(){return`
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
      /* Media transport controls stay left-to-right in RTL pages (the
         timeline runs start\u2192end of the media, like every platform player);
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

      /* \u2500\u2500 Forced colors \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
    `}#Q(){let t=this.#t;this.listen(t,"timeupdate",()=>this.#S()),this.listen(t,"loadedmetadata",()=>{this.#q(),this.#S()}),this.listen(t,"durationchange",()=>this.#q()),this.listen(t,"progress",()=>this.#rt()),this.listen(t,"volumechange",()=>this.#l()),this.listen(t,"play",()=>{this.#i=!0,this.#d("playing"),this.#c.setAttribute("aria-label",this.#s("pause")),this.#E(this.#s("playing")),this.#o("video-player:play",{currentTime:t.currentTime,src:t.currentSrc})}),this.listen(t,"pause",()=>{this.#i=!1,t.ended||this.#d("paused"),this.#c.setAttribute("aria-label",this.#s("play")),this.#a(),this.#E(this.#s("paused")),this.#o("video-player:pause",{currentTime:t.currentTime})}),this.listen(t,"ended",()=>{this.#i=!1,this.#d("ended"),this.#c.setAttribute("aria-label",this.#s("play")),this.#a();let e=this.#e?.querySelector("li[data-video-active]");e&&e.setAttribute("data-video-played",""),this.#e&&this.#st(),this.#E(this.#s("ended")),this.#o("video-player:ended",{src:t.currentSrc})}),this.listen(t,"waiting",()=>{this.#i&&(this.#d("buffering"),this.#E(this.#s("buffering")))}),this.listen(t,"playing",()=>{this.getAttribute("state")==="buffering"&&this.#d("playing")})}#d(t){this.setAttribute("state",t),this.#v&&(this.#v.inert=!(t==="idle"||t==="ended"))}#W(){let t=this.shadowRoot,e=()=>{this.#i?this.#t.pause():this.#t.play().catch(()=>{})};this.listen(this.#v,"click",s=>{s.stopPropagation(),this.#t.play().catch(()=>{})});let i=t.querySelector(".player");this.listen(i,"click",s=>{let r=s.target;r.closest(".controls")||r.closest(".play-overlay")||r!==this.#t&&r!==i||e()}),this.listen(this.#c,"click",e),this.listen(this.#h,"input",()=>{this.#t.duration&&(this.#t.currentTime=Number(this.#h.value)/100*this.#t.duration,this.#M())}),this.listen(this.#h,"keydown",s=>{let r=s;if(r.altKey||r.ctrlKey||r.metaKey)return;let a={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[r.key];a&&(r.preventDefault(),this.#f(a*g))}),this.listen(t.querySelector(".skip-back-btn"),"click",()=>this.#f(-c)),this.listen(t.querySelector(".skip-forward-btn"),"click",()=>this.#f(c)),this.listen(this.#u,"input",()=>{this.#t.volume=Number(this.#u.value),this.#t.muted=!1,this.#l()}),this.listen(this.#g,"click",()=>{this.#t.muted=!this.#t.muted,this.#l()}),this.listen(this.#m,"click",()=>{this.#y=(this.#y+1)%d.length;let s=d[this.#y];this.#t.playbackRate=s,this.#D(),this.#o("video-player:speed",{rate:s})}),this.listen(this.#n,"click",()=>{let s=this.#L();if(!s)return;let r=s.mode==="showing";s.mode=r?"hidden":"showing";let a=!r;this.toggleAttribute("captions",a),this.#n.setAttribute("aria-pressed",String(a)),this.#o("video-player:captions",{active:a,label:s.label})}),this.listen(this.#b,"click",()=>this.#K()),this.listen(this,"keydown",s=>this.#at(s))}#Z(t){for(let e of t.composedPath()){if(e===this)return!1;if(e instanceof Element&&e.matches(k))return!0}return!1}#f(t){let e=this.#t.duration||0;this.#t.currentTime=Math.min(e,Math.max(0,this.#t.currentTime+t)),this.#a(),this.#S()}#tt(){let t=this.shadowRoot?.querySelector(".player"),e=()=>{this.#a(),this.#z(y)};this.listen(t,"mousemove",e),this.listen(t,"mouseenter",e),this.listen(t,"mouseleave",()=>this.#z(500)),this.listen(t,"touchstart",()=>{this.hasAttribute("controls")?this.#R():e()},{passive:!0}),this.listen(this.#p,"mouseenter",()=>{this.#r!=null&&clearTimeout(this.#r),this.#a()}),this.listen(this.#p,"focusin",()=>{this.#r!=null&&clearTimeout(this.#r),this.#a()}),this.listen(this.#p,"focusout",()=>this.#z(y))}#z(t){this.#r!=null&&clearTimeout(this.#r),this.#r=null,this.#i&&(this.#r=setTimeout(()=>this.#R(),t))}#a(){this.setAttribute("controls","")}#R(){let t=this.shadowRoot?.activeElement;t&&this.#p?.contains(t)||this.removeAttribute("controls")}#et(){this.#e&&this.listen(this.#e,"click",t=>{let e=t.target.closest("a[href]");e&&(t.preventDefault(),this.#A(e.href,e.closest("li"),e))})}#A(t,e,i){this.#e.querySelectorAll("li").forEach(n=>n.removeAttribute("data-video-active")),e&&e.setAttribute("data-video-active",""),this.#t.src=t;let r=i?.getAttribute("data-poster");r&&(this.#t.poster=r);let a=i?.getAttribute("data-captions");this.#it(a),this.#t.play().catch(()=>{}),this.#o("video-player:track-change",{src:t,title:i?.textContent??""})}#it(t){if(this.#t.querySelectorAll("track[data-dynamic]").forEach(i=>i.remove()),t){let i=document.createElement("track");i.kind="captions",i.src=t,i.default=!0,i.setAttribute("data-dynamic",""),this.#t.appendChild(i),this.hasAttribute("captions")&&(i.track.mode="showing")}this.#P()}#st(){if(!this.#e)return;let t=[...this.#e.querySelectorAll("li")],e=t.findIndex(s=>s.hasAttribute("data-video-active"));if(this.hasAttribute("shuffle")){let s=t.filter((r,a)=>a!==e);if(s.length){let r=s[Math.floor(Math.random()*s.length)],a=r.querySelector("a[href]");a&&this.#A(a.href,r,a)}return}let i=e+1;if(i<t.length){let s=t[i].querySelector("a[href]");s&&this.#A(s.href,t[i],s)}else if(this.hasAttribute("loop")){let s=t[0]?.querySelector("a[href]");s&&this.#A(s.href,t[0],s)}}#S(){let t=this.#t.currentTime,e=this.#t.duration||0,i=e?t/e*100:0;this.#$.textContent=this.#C(t),this.#h.value=String(i),this.#M(),this.#V.style.width=`${i}%`}#M(){this.#h.setAttribute("aria-valuetext",this.#s("time-of",{current:this.#C(this.#t.currentTime),duration:this.#C(this.#t.duration||0)}))}#q(){let t=this.#t.duration||0;this.#F.textContent=this.#C(t),this.#M()}#rt(){let t=this.#t.buffered,e=this.#t.duration||0;if(t.length>0&&e){let i=t.end(t.length-1);this.#B.style.width=`${i/e*100}%`}}#T(){let t=document.fullscreenElement;return!!t&&(t===this||t===this.#t)}#j(t){t?this.setAttribute("data-fullscreen",""):this.removeAttribute("data-fullscreen")}#K(){this.#T()?document.exitFullscreen().catch(()=>{}):this.requestFullscreen().catch(()=>{this.#t.requestFullscreen?.().catch(()=>{})})}#O(){let t=this.#L();if(!t||!this.#n)return;let e=t.mode==="showing";this.toggleAttribute("captions",e),this.#n.setAttribute("aria-pressed",String(e))}#L(){let t=this.#t.textTracks;for(let e=0;e<t.length;e++)if(t[e].kind==="captions"||t[e].kind==="subtitles")return t[e];return null}#at(t){if(!(t.defaultPrevented||t.altKey||t.ctrlKey||t.metaKey)&&!this.#Z(t))switch(t.key){case" ":case"k":case"K":t.preventDefault(),this.#i?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":t.preventDefault(),this.#f(-c);break;case"ArrowRight":t.preventDefault(),this.#f(c);break;case"ArrowUp":t.preventDefault(),this.#t.volume=Math.min(1,this.#t.volume+.05),this.#l(),this.#a();break;case"ArrowDown":t.preventDefault(),this.#t.volume=Math.max(0,this.#t.volume-.05),this.#l(),this.#a();break;case"m":case"M":this.#t.muted=!this.#t.muted,this.#l();break;case"f":case"F":this.#K();break;case"c":case"C":this.#n.click();break}}#l(){if(!this.#t||!this.#g)return;let t=this.#t.muted;this.toggleAttribute("muted",t),this.#g.setAttribute("aria-pressed",String(t));let e=this.#t.volume;this.#u.value=String(e),this.#u.style.setProperty("--_vol",t?"0":String(e));let i;try{i=new Intl.NumberFormat(this.#k,{style:"percent"}).format(e)}catch{i=`${Math.round(e*100)}%`}this.#u.setAttribute("aria-valuetext",i)}#C(t){let e=Number.isFinite(t)&&t>0?Math.floor(t):0,i=Math.floor(e/3600),s=Math.floor(e%3600/60),r=e%60,a=this.#w??new Intl.NumberFormat("en",{useGrouping:!1});if(this.#x)try{let h=this.#x.formatToParts({hours:i,minutes:s,seconds:r}),f=!0;return h.map(u=>f&&u.type==="integer"?(f=!1,a.format(u.unit==="hour"?i:s)):u.value).join("")}catch{}let n=h=>a.format(h).padStart(2,a.format(0));return i>0?`${a.format(i)}:${n(s)}:${n(r)}`:`${a.format(s)}:${n(r)}`}#E(t){this.#_&&(this.#_.textContent=t)}#o(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};m("video-player",p);export{p as VideoPlayerElement};
//# sourceMappingURL=video-player.js.map
