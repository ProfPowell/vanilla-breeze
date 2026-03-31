var c=window.matchMedia("(prefers-reduced-motion: reduce)");var u=new Map;function d(s,e,t={}){let r=t.priority??10,i={impl:e,bundle:t.bundle,contract:t.contract,priority:r},a=u.get(s);if(customElements.get(s)){if(!a||a.priority>=r){a&&a.priority===r&&a.impl!==e&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=r){a.priority===r&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}u.set(s,i),customElements.define(s,e)}var n=class extends HTMLElement{#e=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let e of this.#e)e();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,t,r,i){e.addEventListener(t,r,i),this.#e.push(()=>e.removeEventListener(t,r,i))}setup(){}teardown(){}};var l=class extends n{#e=null;#t=null;#i=!1;#v=null;#a=null;#s=null;#u=null;#r=null;#d=null;#c=null;#o=null;#h=null;setup(){if(this.#e=this.querySelector("audio"),!this.#e)return!1;this.#t=this.querySelector(".track-list"),this.#e.removeAttribute("controls");let e=!this.shadowRoot;this.#f(),e&&(this.#y(),this.#g(),this.#x()),this.#p(),this.hasAttribute("autoplay")&&this.#e.play().catch(()=>{}),this.#h=()=>{let t=this.shadowRoot?.querySelector(".player");t&&(t.style.display="none",t.offsetHeight,t.style.display="")},this.listen(window,"vb:theme-change",this.#h)}teardown(){this.#e&&this.#e.setAttribute("controls","")}#f(){if(this.shadowRoot)return;let e=this.attachShadow({mode:"open"});e.innerHTML=`
      <style>${this.#b()}</style>
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
    `,this.#v=e.querySelector(".controls"),this.#a=e.querySelector(".play-btn"),this.#s=e.querySelector(".timeline"),this.#u=e.querySelector(".timeline-fill"),this.#r=e.querySelector(".volume"),this.#d=e.querySelector(".current-time"),this.#c=e.querySelector(".duration"),this.#o=e.querySelector(".track-title")}#b(){return`
      :host {
        display: block;
        --_accent: var(--audio-player-accent, var(--color-primary, oklch(55% 0.2 260)));
        --_bg: var(--audio-player-bg, var(--color-surface, #fff));
        --_radius: var(--audio-player-radius, var(--radius-m, 0.5rem));
        --_text: var(--audio-player-text, var(--color-text, inherit));
        --_border: var(--audio-player-border, var(--color-border, #ddd));
        --_shadow: var(--audio-player-shadow, none);
        --_padding: var(--audio-player-padding, var(--size-xs, 0.5rem) var(--size-s, 0.75rem));
      }

      .player {
        background: var(--_bg);
        color: var(--_text);
        border: var(--border-width-thin, 1px) solid var(--_border);
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        overflow: hidden;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        padding: var(--_padding);
      }

      /* \u2500\u2500 Play button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .play-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        color: var(--color-text-on-primary, white);
        cursor: pointer;
        flex-shrink: 0;
        transition: background-color var(--duration-fast, 100ms) var(--ease-default, ease),
                    transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .play-btn:hover {
        background-color: var(--color-primary-hover, var(--_accent));
        transform: scale(1.05);
      }

      .play-btn:active {
        transform: scale(0.97);
      }

      .play-btn:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
      }

      .icon-pause { display: none; }
      :host([state="playing"]) .icon-play { display: none; }
      :host([state="playing"]) .icon-pause { display: block; }

      /* \u2500\u2500 Timeline group \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .timeline-group {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--size-3xs, 2px);
      }

      .track-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        font-size: var(--font-size-xs, 0.75rem);
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
        font-family: var(--font-mono, ui-monospace, monospace);
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
        border-radius: var(--radius-full, 2px);
        width: 0%;
        transition: width var(--duration-instant, 50ms) linear;
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
        background: var(--_border);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-moz-range-track {
        height: 4px;
        background: var(--_border);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: var(--border-width-medium, 2px) solid var(--_bg);
        box-shadow: var(--shadow-sm, 0 1px 3px oklch(0% 0 0 / 0.2));
        cursor: pointer;
        margin-top: -4px;
        transition: transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .timeline:hover::-webkit-slider-thumb {
        transform: scale(1.2);
      }

      .timeline::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: var(--border-width-medium, 2px) solid var(--_bg);
        box-shadow: var(--shadow-sm, 0 1px 3px oklch(0% 0 0 / 0.2));
        cursor: pointer;
      }

      .timeline::-moz-range-progress {
        height: 4px;
        background: var(--_accent);
        border-radius: var(--radius-full, 2px);
      }

      .timeline:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 4px;
        border-radius: var(--radius-s, 2px);
      }

      /* \u2500\u2500 Volume \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .volume-wrap {
        display: flex;
        align-items: center;
        gap: var(--size-2xs, 4px);
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
        transition: color var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .mute-btn:hover {
        color: var(--color-text, inherit);
      }

      .mute-btn:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
        border-radius: var(--radius-s, 2px);
      }

      .icon-muted { display: none; }
      :host([muted]) .icon-vol { display: none; }
      :host([muted]) .icon-muted { display: block; }

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
        background: linear-gradient(to right,
          var(--_accent) calc(var(--_vol, 1) * 100%),
          var(--_border) calc(var(--_vol, 1) * 100%));
        border-radius: var(--radius-full, 2px);
      }

      .volume::-moz-range-track {
        height: 3px;
        background: var(--_border);
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
        background: var(--_accent);
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
        background: var(--_accent);
        border: none;
        cursor: pointer;
      }

      .volume:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
        border-radius: var(--radius-s, 2px);
      }

      /* \u2500\u2500 Slot: hide native audio controls \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      ::slotted(audio) {
        display: none !important;
      }

      /* \u2500\u2500 Reduced motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      @media (prefers-reduced-motion: reduce) {
        .play-btn,
        .timeline-fill,
        .timeline::-webkit-slider-thumb,
        .volume::-webkit-slider-thumb,
        .mute-btn {
          transition: none;
        }
        .play-btn:hover,
        .play-btn:active,
        .timeline:hover::-webkit-slider-thumb,
        .volume:hover::-webkit-slider-thumb {
          transform: none;
        }
      }
    `}#y(){this.#e.addEventListener("timeupdate",()=>this.#k()),this.#e.addEventListener("loadedmetadata",()=>this.#E()),this.#e.addEventListener("play",()=>{this.#i=!0,this.setAttribute("state","playing"),this.#a.setAttribute("aria-label","Pause"),this.#l("audio-player:play",{currentTime:this.#e.currentTime,src:this.#e.currentSrc})}),this.#e.addEventListener("pause",()=>{this.#i=!1,this.setAttribute("state","paused"),this.#a.setAttribute("aria-label","Play"),this.#l("audio-player:pause",{currentTime:this.#e.currentTime})}),this.#e.addEventListener("ended",()=>{this.#i=!1,this.setAttribute("state","ended"),this.#a.setAttribute("aria-label","Play");let e=this.#t?.querySelector("li[data-audio-active]");e&&e.setAttribute("data-audio-played",""),this.#t&&this.#w(),this.#l("audio-player:ended",{src:this.#e.currentSrc})})}#g(){this.#a.addEventListener("click",()=>{this.#i?this.#e.pause():this.#e.play().catch(()=>{})}),this.#s.addEventListener("input",()=>{this.#e.duration&&(this.#e.currentTime=Number(this.#s.value)/100*this.#e.duration)}),this.#r.addEventListener("input",()=>{this.#e.volume=Number(this.#r.value),this.#e.muted=!1,this.removeAttribute("muted"),this.#r.style.setProperty("--_vol",this.#r.value)});let e=this.shadowRoot?.querySelector(".mute-btn");e&&(e.addEventListener("click",()=>{this.#e.muted=!this.#e.muted,this.toggleAttribute("muted",this.#e.muted),this.#r.style.setProperty("--_vol",this.#e.muted?"0":this.#r.value)}),this.addEventListener("keydown",t=>{let r=t.target;if(!(r?.tagName==="INPUT"||r?.tagName==="TEXTAREA"))switch(t.key){case" ":t.preventDefault(),this.#i?this.#e.pause():this.#e.play().catch(()=>{});break;case"ArrowLeft":t.preventDefault(),this.#e.currentTime=Math.max(0,this.#e.currentTime-10);break;case"ArrowRight":t.preventDefault(),this.#e.currentTime=Math.min(this.#e.duration||0,this.#e.currentTime+10);break;case"m":case"M":this.#e.muted=!this.#e.muted,this.toggleAttribute("muted",this.#e.muted),this.#r.style.setProperty("--_vol",this.#e.muted?"0":this.#r.value);break}}),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"))}#x(){this.#t&&this.#t.addEventListener("click",e=>{let r=e.target?.closest("a[href]");r&&(e.preventDefault(),this.#n(r.href,r.closest("li")))})}#n(e,t){if(!this.#t)return;this.#t.querySelectorAll("li").forEach(i=>i.removeAttribute("data-audio-active")),t&&t.setAttribute("data-audio-active",""),this.#e.src=e,this.#e.play().catch(()=>{}),this.#p(),this.#l("audio-player:track-change",{src:e,title:t?.querySelector("a")?.textContent??""})}#w(){if(!this.#t)return;let e=[...this.#t.querySelectorAll("li")],t=e.findIndex(i=>i.hasAttribute("data-audio-active"));if(this.hasAttribute("shuffle")){let i=e.filter((a,o)=>o!==t);if(i.length){let a=i[Math.floor(Math.random()*i.length)],o=a.querySelector("a[href]");o&&this.#n(o.href,a)}return}let r=t+1;if(r<e.length){let i=e[r].querySelector("a[href]");i&&this.#n(i.href,e[r])}else if(this.hasAttribute("loop")){let i=e[0]?.querySelector("a[href]");i&&this.#n(i.href,e[0])}}#k(){let e=this.#e.currentTime,t=this.#e.duration||0,r=t?e/t*100:0;this.#d.textContent=this.#m(e),this.#s.value=String(r),this.#u.style.width=`${r}%`}#E(){let e=this.#e.duration||0;this.#c.textContent=this.#m(e)}#p(){if(!this.#o)return;if(this.#t){let t=this.#t.querySelector("li[data-audio-active] a");if(t){this.#o.textContent=t.textContent;return}}let e=this.#e.currentSrc||this.#e.querySelector("source")?.src||"";if(e){let t=e.split("/").pop().split("?")[0];this.#o.textContent=t.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}}#m(e){if(!Number.isFinite(e))return"0:00";let t=Math.floor(e/60),r=Math.floor(e%60).toString().padStart(2,"0");return`${t}:${r}`}#l(e,t){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0,detail:t}))}};d("audio-player",l);export{l as AudioPlayerElement};
//# sourceMappingURL=audio-player.js.map
