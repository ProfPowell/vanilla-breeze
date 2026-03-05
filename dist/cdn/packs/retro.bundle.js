var g=Object.defineProperty;var w=(u,e)=>()=>(u&&(e=u(u=0)),e);var x=(u,e)=>{for(var t in e)g(u,t,{get:e[t],enumerable:!0})};var y={};x(y,{AudioPlayer:()=>h});var h,f=w(()=>{h=class u extends HTMLElement{static bundle="retro";static contract="audio-player";static version="1.0.0";static consumesTokens=["--color-primary","--color-surface-sunken","--color-surface-raised","--color-border","--color-text","--color-text-muted","--size-m","--radius-m","--font-mono","--shadow-m"];static exposesTokens=["--audioplayer-screen-color","--audioplayer-bg","--audioplayer-bezel","--audioplayer-screen-bg","--audioplayer-text","--audioplayer-control-size","--audioplayer-glow"];static reducedMotionFallback(e){e._visualizerPaused=!0,e._rafId&&(cancelAnimationFrame(e._rafId),e._rafId=null),e._drawStatic()}static get observedAttributes(){return["src","data-visualizer","autoplay","loop","data-title","data-size"]}constructor(){super(),this.attachShadow({mode:"open"}),this._playing=!1,this._audioCtx=null,this._analyser=null,this._source=null,this._rafId=null,this._visualizerPaused=!1,this._currentMode="wave",this._vuData=new Float32Array(8).fill(0),this._reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches}connectedCallback(){this._render(),this._upgradeAudio(),this._attachEvents(),this._startVisualizer(),this._reducedMotion&&u.reducedMotionFallback(this),window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",e=>{this._reducedMotion=e.matches,e.matches?u.reducedMotionFallback(this):(this._visualizerPaused=!1,this._startVisualizer())})}disconnectedCallback(){this._rafId&&cancelAnimationFrame(this._rafId),this._audioCtx&&this._audioCtx.close(),this._audio?.removeEventListener("timeupdate",this._onTimeUpdate),this._audio?.removeEventListener("ended",this._onEnded)}attributeChangedCallback(e,t,a){this.shadowRoot.innerHTML&&(e==="src"&&this._audio&&(this._audio.src=a,this._updateTrackTitle()),e==="data-visualizer"&&(this._currentMode=a||"wave"),e==="data-title"&&this._updateTrackTitle())}_render(){let e=this.getAttribute("data-visualizer")||"wave",t=this.getAttribute("data-title")||this._titleFromSrc();this._currentMode=e,this.shadowRoot.innerHTML=`
      <style>${this._styles()}</style>

      <div part="bezel">

        <!-- Screen region: canvas visualizer + VU bars -->
        <div part="screen" aria-hidden="true">
          <canvas part="canvas" class="visualizer"></canvas>
          <div class="vu-row" aria-hidden="true">
            ${Array.from({length:8},(a,i)=>`<div part="vu-bar" class="vu-bar" data-index="${i}">
                <div class="vu-fill"></div>
              </div>`).join("")}
          </div>
          <div class="screen-scanlines"></div>
          <div class="screen-glare"></div>
        </div>

        <!-- Track info display -->
        <div class="info-strip">
          <span part="track-title display" class="track-title">${t}</span>
          <span part="time-display display" class="time-display">
            <time class="current-time">0:00</time>
            <span class="time-sep"> / </span>
            <time class="duration">0:00</time>
          </span>
        </div>

        <!-- Controls -->
        <div part="controls" class="controls" role="group" aria-label="Audio controls"
             data-mini-title="${t}" data-mini-time="0:00 / 0:00">

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

        <!-- Hidden native audio element \u2014 also the JS-off fallback -->
        <div class="audio-wrap">
          <slot>
            <!-- Default fallback if no slot content provided -->
            <audio class="native-audio"></audio>
          </slot>
        </div>

      </div>
    `}_styles(){return`
      /* \u2500\u2500 Host \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Bezel (outer shell) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      [part~="bezel"] {
        background: var(--audioplayer-bg);
        border: 2px solid var(--audioplayer-bezel);
        border-radius: calc(var(--audioplayer-radius) + 2px);
        padding: var(--size-s, 0.75rem);
        display: flex;
        flex-direction: column;
        gap: var(--size-xs, 0.5rem);
        overflow: hidden;

        /* Retro chrome: inset bevel effect */
        box-shadow:
          inset 0 1px 0 color-mix(in oklch, var(--audioplayer-bezel), white 30%),
          inset 0 -1px 0 color-mix(in oklch, var(--audioplayer-bezel), black 30%),
          var(--shadow-m, 0 4px 16px oklch(0% 0 0 / 0.4));
      }

      /* \u2500\u2500 Screen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* Scan lines overlay \u2014 authentic CRT texture */
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

      /* Glare reflection \u2014 curved screen feel */
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

      /* \u2500\u2500 VU meters \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .vu-row {
        position: absolute;
        bottom: 6px;
        right: 8px;
        display: flex;
        align-items: flex-end;
        gap: 3px;
        height: 35%;
      }

      .vu-bar {
        width: 5px;
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

      /* \u2500\u2500 Info strip \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Controls region \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      [part~="controls"] {
        display: flex;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        height: var(--audioplayer-control-size);
      }

      /* \u2500\u2500 Buttons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Timeline \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
        top: 50%;
        transform: translateY(-50%);
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
        height: 1.5rem;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        z-index: 1;
      }

      [part~="timeline"]::-webkit-slider-runnable-track {
        height: 3px;
        background: color-mix(in oklch, var(--audioplayer-bezel), transparent 30%);
        border-radius: 2px;
      }

      [part~="timeline"]::-moz-range-track {
        height: 3px;
        background: color-mix(in oklch, var(--audioplayer-bezel), transparent 30%);
        border-radius: 2px;
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

      /* \u2500\u2500 Volume \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .volume-wrap {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 0 0 60px;
        min-width: 0;
      }

      .volume-icon {
        color: var(--audioplayer-text-muted);
        flex-shrink: 0;
      }

      [part~="volume"] {
        flex: 1;
        min-width: 0;
        height: 1rem;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;
      }

      [part~="volume"]::-webkit-slider-runnable-track {
        height: 3px;
        background: color-mix(in oklch, var(--audioplayer-bezel), transparent 30%);
        border-radius: 2px;
      }

      [part~="volume"]::-moz-range-track {
        height: 3px;
        background: color-mix(in oklch, var(--audioplayer-bezel), transparent 30%);
        border-radius: 2px;
      }

      [part~="volume"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 8px;
        height: 8px;
        margin-top: -2.5px;
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
        outline-offset: 2px;
        border-radius: 2px;
      }

      /* \u2500\u2500 Audio wrap \u2014 hide native element \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .audio-wrap {
        display: none;
      }

      /* \u2500\u2500 Static mode (reduced motion) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      :host([data-visualizer-static]) .visualizer {
        opacity: 0.4;
      }

      /* \u2500\u2500 Mini form factor \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      :host([data-size="mini"]) {
        max-width: 400px;
        --audioplayer-control-size: 2rem;
      }

      :host([data-size="mini"]) [part~="bezel"] {
        padding: 4px 8px;
        gap: 0;
        border-width: 1px;
        border-radius: var(--audioplayer-radius);
      }

      :host([data-size="mini"]) [part~="screen"],
      :host([data-size="mini"]) .info-strip {
        display: none;
      }

      :host([data-size="mini"]) [part~="controls"] {
        gap: 6px;
        height: var(--audioplayer-control-size);
      }

      :host([data-size="mini"]) .btn-skip {
        display: none;
      }

      :host([data-size="mini"]) .btn-play {
        width: 1.75rem;
        height: 1.75rem;
      }

      :host([data-size="mini"]) .btn-play svg {
        width: 12px;
        height: 12px;
      }

      /* Show inline track title in controls row */
      :host([data-size="mini"]) [part~="controls"]::before {
        content: attr(data-mini-title);
        font-size: 0.6rem;
        color: var(--audioplayer-screen-color);
        text-shadow: var(--audioplayer-glow);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 8em;
        flex-shrink: 1;
        min-width: 0;
      }

      :host([data-size="mini"]) .timeline-wrap {
        height: 1.25rem;
      }

      :host([data-size="mini"]) [part~="timeline"] {
        height: 1.25rem;
      }

      :host([data-size="mini"]) [part~="timeline"]::-webkit-slider-thumb {
        width: 8px;
        height: 8px;
      }

      :host([data-size="mini"]) [part~="timeline"]::-moz-range-thumb {
        width: 8px;
        height: 8px;
      }

      :host([data-size="mini"]) .timeline-fill {
        height: 2px;
      }

      /* Inline time display for mini */
      :host([data-size="mini"]) [part~="controls"]::after {
        content: attr(data-mini-time);
        font-size: 0.55rem;
        font-variant-numeric: tabular-nums;
        color: var(--audioplayer-text-muted);
        letter-spacing: 0.04em;
        white-space: nowrap;
        flex-shrink: 0;
      }

      :host([data-size="mini"]) .volume-wrap {
        flex: 0 0 44px;
      }

      :host([data-size="mini"]) .volume-icon {
        width: 10px;
        height: 10px;
      }

      :host([data-size="mini"]) [part~="volume"] {
        height: 0.8rem;
      }

      :host([data-size="mini"]) [part~="volume"]::-webkit-slider-thumb {
        width: 6px;
        height: 6px;
        margin-top: -1.5px;
      }

      :host([data-size="mini"]) [part~="volume"]::-moz-range-thumb {
        width: 6px;
        height: 6px;
      }
    `}_upgradeAudio(){let t=this.shadowRoot.querySelector("slot")?.assignedElements?.().find(i=>i.tagName==="AUDIO");t?this._audio=t:this._audio=this.shadowRoot.querySelector(".native-audio");let a=this.getAttribute("src");a&&(this._audio.src=a),this.hasAttribute("autoplay")&&(this._audio.autoplay=!0),this.hasAttribute("loop")&&(this._audio.loop=!0),this._onTimeUpdate=()=>this._handleTimeUpdate(),this._onEnded=()=>this._handleEnded(),this._audio.addEventListener("timeupdate",this._onTimeUpdate),this._audio.addEventListener("ended",this._onEnded),this._audio.addEventListener("loadedmetadata",()=>this._updateDuration())}_setupAudioContext(){this._audioCtx||(this._audioCtx=new AudioContext,this._analyser=this._audioCtx.createAnalyser(),this._analyser.fftSize=256,this._analyser.smoothingTimeConstant=.8,this._source=this._audioCtx.createMediaElementSource(this._audio),this._source.connect(this._analyser),this._analyser.connect(this._audioCtx.destination))}_attachEvents(){let e=this.shadowRoot;e.querySelector(".btn-play").addEventListener("click",()=>{this._playing?this._pause():this._play()}),e.querySelector(".btn-skip").addEventListener("click",()=>{this._audio.currentTime=0,this._playing||this._play()});let t=e.querySelector('[part~="timeline"]');t.addEventListener("input",()=>{this._audio.duration&&(this._audio.currentTime=t.value/100*this._audio.duration)});let a=e.querySelector('[part~="volume"]');a.addEventListener("input",()=>{this._audio.volume=a.value})}_play(){this._setupAudioContext(),this._audioCtx.state==="suspended"&&this._audioCtx.resume(),this._audio.play(),this._playing=!0,this.setAttribute("data-state","playing"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-label","Pause"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-pressed","true"),this.dispatchEvent(new CustomEvent("vb:audioplayer:play",{bubbles:!0,composed:!0,detail:{currentTime:this._audio.currentTime,src:this._audio.src}}))}_pause(){this._audio.pause(),this._playing=!1,this.setAttribute("data-state","paused"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-label","Play"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-pressed","false"),this.dispatchEvent(new CustomEvent("vb:audioplayer:pause",{bubbles:!0,composed:!0,detail:{currentTime:this._audio.currentTime}}))}_handleTimeUpdate(){let e=this._audio.currentTime,t=this._audio.duration||0,a=t?e/t*100:0;this.shadowRoot.querySelector(".current-time").textContent=this._formatTime(e);let i=this.shadowRoot.querySelector('[part~="timeline"]');i.value=a,i.setAttribute("aria-valuenow",Math.round(a)),this.shadowRoot.querySelector(".timeline-fill").style.width=`${a}%`;let r=this.shadowRoot.querySelector('[part~="controls"]');r&&(r.dataset.miniTime=`${this._formatTime(e)} / ${this._formatTime(t)}`),this.dispatchEvent(new CustomEvent("vb:audioplayer:timeupdate",{bubbles:!0,composed:!0,detail:{currentTime:e,duration:t,progress:a}}))}_updateDuration(){let e=this._audio.duration||0;this.shadowRoot.querySelector(".duration").textContent=this._formatTime(e);let t=this.shadowRoot.querySelector('[part~="controls"]');t&&(t.dataset.miniTime=`0:00 / ${this._formatTime(e)}`)}_handleEnded(){this._playing=!1,this.setAttribute("data-state","ended"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-label","Play"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-pressed","false"),this.dispatchEvent(new CustomEvent("vb:audioplayer:ended",{bubbles:!0,composed:!0,detail:{src:this._audio.src}}))}_formatTime(e){if(!isFinite(e))return"0:00";let t=Math.floor(e/60),a=Math.floor(e%60).toString().padStart(2,"0");return`${t}:${a}`}_startVisualizer(){let e=this.shadowRoot.querySelector(".visualizer");if(!e)return;let t=()=>{this._visualizerPaused||(this._rafId=requestAnimationFrame(t),this._drawFrame(e))};this._rafId=requestAnimationFrame(t)}_drawFrame(e){let t=e.getContext("2d"),a=e.width=e.offsetWidth,i=e.height=e.offsetHeight,r=this._currentMode,n=getComputedStyle(this),o=n.getPropertyValue("--audioplayer-screen-color").trim()||"oklch(70% 0.28 145)",s=n.getPropertyValue("--audioplayer-screen-bg").trim()||"oklch(6% 0.02 260)",d=null;if(this._analyser&&this._playing){let l=this._analyser.frequencyBinCount;d=new Uint8Array(l),r==="wave"?this._analyser.getByteTimeDomainData(d):this._analyser.getByteFrequencyData(d)}t.fillStyle=s,t.globalAlpha=this._playing?.25:1,t.fillRect(0,0,a,i),t.globalAlpha=1,this._playing?r==="wave"?this._drawWave(t,a,i,o,d):r==="bars"?this._drawBars(t,a,i,o,d):r==="circle"&&this._drawCircle(t,a,i,o,d):this._drawIdle(t,a,i,o),this._updateVU(d)}_drawIdle(e,t,a,i){let r=a/2;e.beginPath(),e.moveTo(0,r),e.lineTo(t,r),e.strokeStyle=i,e.lineWidth=1,e.globalAlpha=.3,e.stroke(),e.globalAlpha=1,Math.floor(Date.now()/600)%2===0&&(e.beginPath(),e.arc(12,a/2,2,0,Math.PI*2),e.fillStyle=i,e.globalAlpha=.6,e.fill(),e.globalAlpha=1)}_drawWave(e,t,a,i,r){if(!r)return;let n=t/r.length,o=0;e.beginPath(),e.shadowColor=i,e.shadowBlur=8,e.strokeStyle=i,e.lineWidth=2,e.globalAlpha=.5;for(let s=0;s<r.length;s++){let l=r[s]/128*a/2;s===0?e.moveTo(o,l):e.lineTo(o,l),o+=n}e.stroke(),e.beginPath(),e.shadowBlur=0,e.strokeStyle=i,e.lineWidth=1.5,e.globalAlpha=1,o=0;for(let s=0;s<r.length;s++){let l=r[s]/128*a/2;s===0?e.moveTo(o,l):e.lineTo(o,l),o+=n}e.stroke()}_drawBars(e,t,a,i,r){if(!r)return;let n=Math.min(r.length,48),o=t/n-1;e.shadowColor=i,e.shadowBlur=6;for(let s=0;s<n;s++){let l=r[s]/255*a,c=s*(t/n),p=e.createLinearGradient(0,a-l,0,a);p.addColorStop(0,i),e.globalAlpha=1,p.addColorStop(1,i),e.fillStyle=p,e.fillRect(c,a-l,o,l),e.globalAlpha=.3,e.fillStyle=i,e.fillRect(c,a-l/2,o,l/2)}e.globalAlpha=1,e.shadowBlur=0}_drawCircle(e,t,a,i,r){if(!r)return;let n=t/2,o=a/2,s=Math.min(t,a)*.25,d=r.length;e.shadowColor=i,e.shadowBlur=6,e.strokeStyle=i,e.lineWidth=1.5,e.beginPath();for(let l=0;l<d;l++){let c=l/d*Math.PI*2,p=r[l]/255*(s*.8),m=s+p,b=n+m*Math.cos(c),v=o+m*Math.sin(c);l===0?e.moveTo(b,v):e.lineTo(b,v)}e.closePath(),e.stroke(),e.beginPath(),e.arc(n,o,2,0,Math.PI*2),e.fillStyle=i,e.globalAlpha=.4,e.fill(),e.globalAlpha=1,e.shadowBlur=0}_drawStatic(){let e=this.shadowRoot.querySelector(".visualizer");e&&this._drawIdle(e.getContext("2d"),e.offsetWidth,e.offsetHeight,getComputedStyle(this).getPropertyValue("--audioplayer-screen-color").trim())}_updateVU(e){let t=this.shadowRoot.querySelectorAll(".vu-bar");if(!t.length)return;if(!e||!this._playing){t.forEach(i=>{i.querySelector(".vu-fill").style.height="0%",i.removeAttribute("data-peak")});return}let a=Math.floor(e.length/t.length);t.forEach((i,r)=>{let n=e[r*a]/255,o=Math.round(n*100);i.querySelector(".vu-fill").style.height=`${o}%`,i.toggleAttribute("data-peak",o>80)})}_titleFromSrc(){let e=this.getAttribute("src");return e?e.split("/").pop().split("?")[0].replace(/\.[^.]+$/,"").replace(/[-_]/g," ").toUpperCase():"NO SIGNAL"}_updateTrackTitle(){let e=this.getAttribute("data-title")||this._titleFromSrc(),t=this.shadowRoot.querySelector('[part~="track-title"]');t&&(t.textContent=e);let a=this.shadowRoot.querySelector('[part~="controls"]');a&&(a.dataset.miniTitle=e)}}});var _={name:"retro",version:"1.0.0",label:"Retro / CRT",description:"Phosphor terminals, split-flap boards, VU meters. Peak 1979.",css:[{role:"theme",href:"retro.theme.css"},{role:"effects",href:"retro.effects.css"}],js:[{role:"effects",src:"retro.effects.js"},{role:"components",src:"retro.components.js"}],components:[{tag:"audio-player",contract:"audio-player",label:"Audio Player",load:()=>Promise.resolve().then(()=>(f(),y))}],effects:[{name:"flipboard",selector:"[data-flipboard]",type:"js"},{name:"stamp-filter",selector:"[data-stamp]",type:"js"},{name:"blink",selector:"[data-blink]",type:"css"},{name:"neon",selector:"[data-neon]",type:"css"},{name:"text-3d",selector:"[data-text-3d]",type:"css"},{name:"outline",selector:"[data-outline]",type:"css"},{name:"hard-shadow",selector:"[data-hard-shadow]",type:"css"},{name:"stamp",selector:"[data-stamp]",type:"css"},{name:"rainbow",selector:"[data-rainbow]",type:"css"},{name:"marquee",selector:"[data-marquee]",type:"css"}],tokenOverrides:["--hue-primary","--hue-secondary","--hue-accent","--color-primary","--color-surface","--color-surface-sunken","--radius-s","--radius-m","--radius-l","--font-mono","--ease-out","--shadow-m"]};export{_ as bundle};
//# sourceMappingURL=retro.bundle.js.map
