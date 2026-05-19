var c=window.matchMedia("(prefers-reduced-motion: reduce)");var u=new Map;function d(s,t,e={}){let r=e.priority??10,i={impl:t,bundle:e.bundle,contract:e.contract,priority:r},a=u.get(s);if(customElements.get(s)){if(!a||a.priority>=r){a&&a.priority===r&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=r){a.priority===r&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}u.set(s,i),customElements.define(s,t)}var o=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,r,i){t.addEventListener(e,r,i),this.#t.push(()=>t.removeEventListener(e,r,i))}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let r=this.#e.states;try{e?r.add(t):r.delete(t)}catch{let i=`--${t}`;e?r.add(i):r.delete(i)}}_adoptInternals(t){this.#e||(this.#e=t)}};var l=class extends o{#t=null;#e=null;#a=!1;#v=null;#s=null;#i=null;#u=null;#r=null;#d=null;#c=null;#n=null;#h=null;setup(){if(this.#t=this.querySelector("audio"),!this.#t)return!1;this.#e=this.querySelector(".track-list"),this.#t.removeAttribute("controls");let t=!this.shadowRoot;return this.#f(),t&&(this.#y(),this.#g(),this.#x()),this.#p(),this.hasAttribute("autoplay")&&this.#t.play().catch(()=>{}),this.#h=()=>{let e=this.shadowRoot?.querySelector(".player");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},this.listen(window,"vb:theme-change",this.#h),!0}teardown(){this.#t&&this.#t.setAttribute("controls","")}get src(){return this.#t?.getAttribute("src")||this.#t?.currentSrc||""}set src(t){if(!this.#t)return;let e=t==null?"":String(t);this.#t.getAttribute("src")!==e&&(this.#t.setAttribute("src",e),this.#t.load?.(),this.dispatchEvent(new CustomEvent("audio-player:src-changed",{detail:{src:e,source:"property"},bubbles:!0})))}get currentTime(){return this.#t?.currentTime??0}set currentTime(t){this.#t&&(this.#t.currentTime=Number(t)||0)}#f(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
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
    `,this.#v=t.querySelector(".controls"),this.#s=t.querySelector(".play-btn"),this.#i=t.querySelector(".timeline"),this.#u=t.querySelector(".timeline-fill"),this.#r=t.querySelector(".volume"),this.#d=t.querySelector(".current-time"),this.#c=t.querySelector(".duration"),this.#n=t.querySelector(".track-title")}#b(){return`
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
    `}#y(){this.#t.addEventListener("timeupdate",()=>this.#k()),this.#t.addEventListener("loadedmetadata",()=>this.#E()),this.#t.addEventListener("play",()=>{this.#a=!0,this.setAttribute("state","playing"),this.#s.setAttribute("aria-label","Pause"),this.#l("audio-player:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#a=!1,this.setAttribute("state","paused"),this.#s.setAttribute("aria-label","Play"),this.#l("audio-player:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#a=!1,this.setAttribute("state","ended"),this.#s.setAttribute("aria-label","Play");let t=this.#e?.querySelector("li[data-audio-active]");t&&t.setAttribute("data-audio-played",""),this.#e&&this.#w(),this.#l("audio-player:ended",{src:this.#t.currentSrc})})}#g(){this.#s.addEventListener("click",()=>{this.#a?this.#t.pause():this.#t.play().catch(()=>{})}),this.#i.addEventListener("input",()=>{this.#t.duration&&(this.#t.currentTime=Number(this.#i.value)/100*this.#t.duration)}),this.#i.addEventListener("pointerdown",()=>this.setState("scrub-active",!0));let t=()=>this.setState("scrub-active",!1);this.#i.addEventListener("pointerup",t),this.#i.addEventListener("pointercancel",t),this.#r.addEventListener("input",()=>{this.#t.volume=Number(this.#r.value),this.#t.muted=!1,this.removeAttribute("muted"),this.#r.style.setProperty("--_vol",this.#r.value)});let e=this.shadowRoot?.querySelector(".mute-btn");e&&(e.addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#r.style.setProperty("--_vol",this.#t.muted?"0":this.#r.value)}),this.addEventListener("keydown",r=>{let i=r.target;if(!(i?.tagName==="INPUT"||i?.tagName==="TEXTAREA"))switch(r.key){case" ":r.preventDefault(),this.#a?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":r.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10);break;case"ArrowRight":r.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10);break;case"m":case"M":this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#r.style.setProperty("--_vol",this.#t.muted?"0":this.#r.value);break}}),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"))}#x(){this.#e&&this.#e.addEventListener("click",t=>{let r=t.target?.closest("a[href]");r&&(t.preventDefault(),this.#o(r.href,r.closest("li")))})}#o(t,e){if(!this.#e)return;this.#e.querySelectorAll("li").forEach(i=>i.removeAttribute("data-audio-active")),e&&e.setAttribute("data-audio-active",""),this.#t.src=t,this.#t.play().catch(()=>{}),this.#p(),this.#l("audio-player:track-change",{src:t,title:e?.querySelector("a")?.textContent??""})}#w(){if(!this.#e)return;let t=[...this.#e.querySelectorAll("li")],e=t.findIndex(i=>i.hasAttribute("data-audio-active"));if(this.hasAttribute("shuffle")){let i=t.filter((a,n)=>n!==e);if(i.length){let a=i[Math.floor(Math.random()*i.length)],n=a.querySelector("a[href]");n&&this.#o(n.href,a)}return}let r=e+1;if(r<t.length){let i=t[r].querySelector("a[href]");i&&this.#o(i.href,t[r])}else if(this.hasAttribute("loop")){let i=t[0]?.querySelector("a[href]");i&&this.#o(i.href,t[0])}}#k(){let t=this.#t.currentTime,e=this.#t.duration||0,r=e?t/e*100:0;this.#d.textContent=this.#m(t),this.#i.value=String(r),this.#u.style.width=`${r}%`}#E(){let t=this.#t.duration||0;this.#c.textContent=this.#m(t)}#p(){if(!this.#n)return;if(this.#e){let e=this.#e.querySelector("li[data-audio-active] a");if(e){this.#n.textContent=e.textContent;return}}let t=this.#t.currentSrc||this.#t.querySelector("source")?.src||"";if(t){let e=t.split("/").pop().split("?")[0];this.#n.textContent=e.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}}#m(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/60),r=Math.floor(t%60).toString().padStart(2,"0");return`${e}:${r}`}#l(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};d("audio-player",l);export{l as AudioPlayerElement};
//# sourceMappingURL=audio-player.js.map
