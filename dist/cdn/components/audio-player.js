var n=class extends HTMLElement{#t=null;#e=null;#i=!1;#m=null;#r=null;#a=null;#d=null;#l=null;#u=null;#c=null;#s=null;connectedCallback(){this.#t=this.querySelector("audio"),this.#t&&(this.#e=this.querySelector(".track-list"),this.#t.removeAttribute("controls"),this.#v(),this.#f(),this.#x(),this.#g(),this.#h(),this.hasAttribute("data-autoplay")&&this.#t.play().catch(()=>{}))}disconnectedCallback(){this.#t&&this.#t.setAttribute("controls","")}#v(){let t=this.attachShadow({mode:"open"});t.innerHTML=`
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
    `,this.#m=t.querySelector(".controls"),this.#r=t.querySelector(".play-btn"),this.#a=t.querySelector(".timeline"),this.#d=t.querySelector(".timeline-fill"),this.#l=t.querySelector(".volume"),this.#u=t.querySelector(".current-time"),this.#c=t.querySelector(".duration"),this.#s=t.querySelector(".track-title")}#b(){return`
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

      /* \u2500\u2500 Play button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Timeline group \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Volume \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

      /* \u2500\u2500 Slot: hide native audio controls \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      ::slotted(audio) {
        display: none !important;
      }

      /* \u2500\u2500 Reduced motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      @media (prefers-reduced-motion: reduce) {
        .play-btn,
        .timeline-fill {
          transition: none;
        }
      }
    `}#f(){this.#t.addEventListener("timeupdate",()=>this.#k()),this.#t.addEventListener("loadedmetadata",()=>this.#w()),this.#t.addEventListener("play",()=>{this.#i=!0,this.setAttribute("data-state","playing"),this.#r.setAttribute("aria-label","Pause"),this.#o("vb:audio:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#i=!1,this.setAttribute("data-state","paused"),this.#r.setAttribute("aria-label","Play"),this.#o("vb:audio:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#i=!1,this.setAttribute("data-state","ended"),this.#r.setAttribute("aria-label","Play");let t=this.#e?.querySelector("li[data-audio-active]");t&&t.setAttribute("data-audio-played",""),this.#e&&this.#y(),this.#o("vb:audio:ended",{src:this.#t.currentSrc})})}#x(){this.#r.addEventListener("click",()=>{this.#i?this.#t.pause():this.#t.play().catch(()=>{})}),this.#a.addEventListener("input",()=>{this.#t.duration&&(this.#t.currentTime=this.#a.value/100*this.#t.duration)}),this.#l.addEventListener("input",()=>{this.#t.volume=this.#l.value,this.#t.muted=!1,this.removeAttribute("data-muted")}),this.shadowRoot.querySelector(".mute-btn").addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.toggleAttribute("data-muted",this.#t.muted)}),this.addEventListener("keydown",e=>{if(!(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA"))switch(e.key){case" ":e.preventDefault(),this.#i?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":e.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10);break;case"ArrowRight":e.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10);break;case"m":case"M":this.#t.muted=!this.#t.muted,this.toggleAttribute("data-muted",this.#t.muted);break}}),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0")}#g(){this.#e&&this.#e.addEventListener("click",t=>{let e=t.target.closest("a[href]");e&&(t.preventDefault(),this.#n(e.href,e.closest("li")))})}#n(t,e){this.#e.querySelectorAll("li").forEach(i=>i.removeAttribute("data-audio-active")),e&&e.setAttribute("data-audio-active",""),this.#t.src=t,this.#t.play().catch(()=>{}),this.#h(),this.#o("vb:audio:track-change",{src:t,title:e?.querySelector("a")?.textContent??""})}#y(){if(!this.#e)return;let t=[...this.#e.querySelectorAll("li")],e=t.findIndex(i=>i.hasAttribute("data-audio-active"));if(this.hasAttribute("data-shuffle")){let i=t.filter((s,a)=>a!==e);if(i.length){let s=i[Math.floor(Math.random()*i.length)],a=s.querySelector("a[href]");a&&this.#n(a.href,s)}return}let r=e+1;if(r<t.length){let i=t[r].querySelector("a[href]");i&&this.#n(i.href,t[r])}else if(this.hasAttribute("data-loop")){let i=t[0]?.querySelector("a[href]");i&&this.#n(i.href,t[0])}}#k(){let t=this.#t.currentTime,e=this.#t.duration||0,r=e?t/e*100:0;this.#u.textContent=this.#p(t),this.#a.value=r,this.#d.style.width=`${r}%`}#w(){let t=this.#t.duration||0;this.#c.textContent=this.#p(t)}#h(){if(!this.#s)return;if(this.#e){let e=this.#e.querySelector("li[data-audio-active] a");if(e){this.#s.textContent=e.textContent;return}}let t=this.#t.currentSrc||this.#t.querySelector("source")?.src||"";if(t){let e=t.split("/").pop().split("?")[0];this.#s.textContent=e.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}}#p(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/60),r=Math.floor(t%60).toString().padStart(2,"0");return`${e}:${r}`}#o(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};customElements.define("audio-player",n);export{n as AudioPlayerElement};
//# sourceMappingURL=audio-player.js.map
