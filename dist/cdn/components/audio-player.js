var x=window.matchMedia("(prefers-reduced-motion: reduce)");var c=new Map;function d(i,t,e={}){let r=e.priority??10,s={impl:t,bundle:e.bundle,contract:e.contract,priority:r},a=c.get(i);if(customElements.get(i)){if(!a||a.priority>=r){a&&a.priority===r&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${i}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=r){a.priority===r&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${a.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}c.set(i,s),customElements.define(i,t)}var o=class extends HTMLElement{#t=[];#e;constructor(){super(),this.hasAttribute("data-upgraded")&&this.removeAttribute("data-upgraded")}connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,r,s){t.addEventListener(e,r,s),this.#t.push(()=>t.removeEventListener(e,r,s))}_reinit(){for(let t of this.#t)t();this.#t=[],this.teardown(),this.removeAttribute("data-upgraded"),this.isConnected&&this.setup()!==!1&&this.setAttribute("data-upgraded","")}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let r=this.#e.states;try{e?r.add(t):r.delete(t)}catch{let s=`--${t}`;e?r.add(s):r.delete(s)}}_adoptInternals(t){this.#e||(this.#e=t)}#r(){return this.constructor.formAssociated&&this.#e?this.#e:null}get validity(){return this.#r()?.validity}get validationMessage(){return this.#r()?.validationMessage??""}get willValidate(){return this.#r()?.willValidate??!1}get form(){return this.#r()?.form??null}checkValidity(){return this.#r()?.checkValidity()??!0}reportValidity(){return this.#r()?.reportValidity()??!0}};function l(i){return[...i.querySelectorAll("li")].filter(t=>t.querySelector("a[href]"))}function h(i){return i.querySelector("li[data-audio-active]")}function f(i,t,e){let r=e.querySelector("a[href]");return r?(t.querySelectorAll("li[data-audio-active]").forEach(s=>{s!==e&&s.removeAttribute("data-audio-active")}),e.setAttribute("data-audio-active",""),i.src=r.href,i.play()?.catch(()=>{}),{src:r.href,title:r.textContent?.trim()??""}):null}function p(i){let t=h(i);return t?.setAttribute("data-audio-played",""),t}function v(i,{loop:t=!1}={}){let e=l(i);if(!e.length)return null;let r=h(i),s=r?e.indexOf(r):-1;return s+1<e.length?e[s+1]:t?e[0]:null}var m='input, button, a[href], summary, select, textarea, audio, [contenteditable]:not([contenteditable="false"])',u=class extends o{static get observedAttributes(){return["loop","shuffle"]}#t=null;#e=null;#r=!1;#T=null;#a=null;#i=null;#v=null;#n=null;#x=null;#w=null;#s=null;#c=null;#o=null;#d=!1;#l=new Set;#k=null;#m=!1;setup(){if(this.#t=this.querySelector("audio"),!this.#t)return!1;this.#e=this.querySelector(".track-list"),this.#t.removeAttribute("controls");let t=!this.shadowRoot;this.#_(),t&&(this.#C(),this.#L(),this.#z()),this.#g(),this.#E(),this.#u();let e=this.#t;return(e.error||e.networkState===HTMLMediaElement.NETWORK_NO_SOURCE&&(e.hasAttribute("src")||e.querySelector("source")))&&this.#A(),e.readyState>=HTMLMediaElement.HAVE_METADATA&&(this.#y(),this.#h()),this.hasAttribute("autoplay")&&this.#t.play().catch(()=>{}),this.#k=()=>{let r=this.shadowRoot?.querySelector(".player");r&&(r.style.display="none",r.offsetHeight,r.style.display="")},this.listen(window,"vb:theme-change",this.#k),!0}teardown(){this.#t&&this.#t.setAttribute("controls","")}attributeChangedCallback(t){t==="loop"?this.#E():t==="shuffle"&&this.#l.clear()}#E(){this.#t&&(this.hasAttribute("loop")&&!this.#e?(this.#t.loop=!0,this.#m=!0):this.#m&&(this.#t.loop=!1,this.#m=!1))}get src(){return this.#t?.getAttribute("src")||this.#t?.currentSrc||""}set src(t){if(!this.#t)return;let e=t==null?"":String(t);this.#t.getAttribute("src")!==e&&(this.#t.setAttribute("src",e),this.#t.load?.(),this.#P(),this.#g(),this.dispatchEvent(new CustomEvent("audio-player:src-changed",{detail:{src:e,source:"property"},bubbles:!0})))}get currentTime(){return this.#t?.currentTime??0}set currentTime(t){this.#t&&(this.#t.currentTime=Number(t)||0)}#_(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>${this.#$()}</style>
      <div part="player" class="player">
        <div part="controls" class="controls">
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
                     aria-label="Seek" aria-valuetext="0:00 of 0:00">
              <div class="timeline-fill"></div>
            </div>
          </div>
          <div class="volume-wrap">
            <button class="mute-btn" type="button" aria-label="Mute" aria-pressed="false">
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
        <p part="error" class="error" role="status" hidden></p>
        <slot></slot>
      </div>
    `,this.#T=t.querySelector(".controls"),this.#a=t.querySelector(".play-btn"),this.#i=t.querySelector(".timeline"),this.#v=t.querySelector(".timeline-fill"),this.#n=t.querySelector(".volume"),this.#x=t.querySelector(".current-time"),this.#w=t.querySelector(".duration"),this.#s=t.querySelector(".track-title"),this.#c=t.querySelector(".mute-btn"),this.#o=t.querySelector(".error")}#$(){return`
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
        box-shadow: var(--shadow-s, 0 1px 3px oklch(0% 0 0 / 0.2));
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
        box-shadow: var(--shadow-s, 0 1px 3px oklch(0% 0 0 / 0.2));
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

      /* \u2500\u2500 Load error message \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .error {
        margin: 0;
        padding: var(--size-2xs, 4px) var(--size-s, 0.75rem) var(--size-xs, 0.5rem);
        font-size: var(--font-size-xs, 0.75rem);
        color: var(--color-error-text, var(--color-error, #b00020));
      }
      .error[hidden] { display: none; }

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
    `}#C(){this.#t.addEventListener("timeupdate",()=>this.#h()),this.#t.addEventListener("loadedmetadata",()=>{this.#M(),this.#y(),this.#h()}),this.#t.addEventListener("emptied",()=>{this.#y(),this.#h()}),this.#t.addEventListener("volumechange",()=>this.#u()),this.#t.addEventListener("error",t=>{let e=t.target;if(e!==this.#t){if(e.localName!=="source"||this.#t.hasAttribute("src"))return;let r=e.nextElementSibling;for(;r&&r.localName!=="source";)r=r.nextElementSibling;if(r)return}this.#A()},!0),this.#t.addEventListener("play",()=>{this.#r=!0,this.setAttribute("state","playing"),this.#a.setAttribute("aria-label","Pause"),this.#p("audio-player:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#r=!1,this.setAttribute("state","paused"),this.#a.setAttribute("aria-label","Play"),this.#p("audio-player:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#r=!1,this.setAttribute("state","ended"),this.#a.setAttribute("aria-label","Play"),this.#e&&(p(this.#e),this.#B()),this.#p("audio-player:ended",{src:this.#t.currentSrc})})}#A(){this.setAttribute("data-state","error"),this.#o.textContent=`Audio could not be loaded${this.#s.textContent?`: ${this.#s.textContent}`:""}.`,this.#o.hidden=!1}#M(){this.getAttribute("data-state")==="error"&&this.removeAttribute("data-state"),this.#o.hidden=!0,this.#o.textContent=""}#u(){if(!this.#t||!this.#c)return;let t=this.#t.muted;t?this.setAttribute("muted",""):this.removeAttribute("muted"),this.#c.setAttribute("aria-pressed",String(t)),this.#n.style.setProperty("--_vol",t?"0":this.#n.value)}#L(){this.#a.addEventListener("click",()=>{this.#r?this.#t.pause():this.#t.play().catch(()=>{})}),this.#i.addEventListener("input",()=>{let e=Number(this.#i.value);this.#v.style.width=`${e}%`,this.#t.duration&&(this.#t.currentTime=e/100*this.#t.duration,this.#S(this.#t.currentTime,this.#t.duration))}),this.#i.addEventListener("pointerdown",()=>{this.#d=!0,this.setState("scrub-active",!0)});let t=()=>{this.#d&&(this.#d=!1,this.setState("scrub-active",!1))};this.#i.addEventListener("pointerup",t),this.#i.addEventListener("pointercancel",t),this.#i.addEventListener("change",t),this.#n.addEventListener("input",()=>{this.#t.volume=Number(this.#n.value),this.#t.muted=!1,this.#u()}),this.#c.addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.#u()}),this.addEventListener("keydown",e=>{if(!(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)&&!this.#q(e))switch(e.key){case" ":e.preventDefault(),this.#r?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":e.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10);break;case"ArrowRight":e.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10);break;case"m":case"M":this.#t.muted=!this.#t.muted,this.#u();break}}),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.hasAttribute("role")||this.setAttribute("role","group"),!this.hasAttribute("aria-label")&&!this.hasAttribute("aria-labelledby")&&this.setAttribute("aria-label","Audio player"),this.hasAttribute("aria-keyshortcuts")||this.setAttribute("aria-keyshortcuts","Space ArrowLeft ArrowRight M")}#q(t){for(let e of t.composedPath()){if(e===this)return!1;if(e instanceof Element&&e.matches(m))return!0}return!1}#z(){this.#e&&this.#e.addEventListener("click",t=>{let r=t.target?.closest("a[href]"),s=r?.closest("li");!r||!s||(t.preventDefault(),this.#b(s))})}#b(t){if(!this.#e)return;let e=f(this.#t,this.#e,t);e&&(this.#l.add(t),this.#g(),this.#p("audio-player:track-change",e))}#P(){if(!this.#e)return;let t=this.#t.src,e=l(this.#e).find(r=>r.querySelector("a[href]").href===t);this.#e.querySelectorAll("li[data-audio-active]").forEach(r=>{r!==e&&r.removeAttribute("data-audio-active")}),e?.setAttribute("data-audio-active","")}#B(){if(!this.#e)return;let t=this.hasAttribute("loop");if(!this.hasAttribute("shuffle")){let n=v(this.#e,{loop:t});n&&this.#b(n);return}let e=l(this.#e),r=this.#e.querySelector("li[data-audio-active]");r&&this.#l.add(r);let s=e.filter(n=>!this.#l.has(n));if(!s.length){if(this.#l.clear(),!t)return;s=e.length>1?e.filter(n=>n!==r):e}let a=s[Math.floor(Math.random()*s.length)];a&&this.#b(a)}#h(){let t=this.#t.currentTime,e=this.#t.duration||0,r=e?t/e*100:0;this.#x.textContent=this.#f(t),this.#S(t,e),!this.#d&&(this.#i.value=String(r),this.#v.style.width=`${r}%`)}#S(t,e){this.#i.setAttribute("aria-valuetext",`${this.#f(t)} of ${this.#f(e)}`)}#y(){let t=this.#t.duration||0;this.#w.textContent=this.#f(t)}#g(){if(!this.#s)return;if(this.#e){let r=this.#e.querySelector("li[data-audio-active] a");if(r){this.#s.textContent=r.textContent;return}}let t=this.#t.src||this.#t.currentSrc||this.#t.querySelector("source")?.src||"",e=t?t.split("/").pop().split(/[?#]/)[0]:"";this.#s.textContent=e.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}#f(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/60),r=Math.floor(t%60).toString().padStart(2,"0");return`${e}:${r}`}#p(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};d("audio-player",u);export{u as AudioPlayerElement};
//# sourceMappingURL=audio-player.js.map
