var E=window.matchMedia("(prefers-reduced-motion: reduce)");function y(){return E.matches||document.documentElement.hasAttribute("data-motion-reduced")}var _=0,h={_effects:new Map,_triggers:new Map,_transitions:new Map,_instances:new WeakMap,_triggerCleanups:new WeakMap,_transitionCleanups:new WeakMap,_observer:null,effect(t,e){this._effects.set(t,e),document.querySelectorAll("[data-effect]").forEach(i=>{i.getAttribute("data-effect").split(/\s+/).includes(t)&&this._initEffect(i,t)})},trigger(t,e){this._triggers.set(t,e)},transition(t,e){this._transitions.set(t,e)},uid(t){return t.id?t.id:(t._vbUid||(_++,t._vbUid=`vb-${_}`),t._vbUid)},theme(t,e){this._themes=this._themes||new Map,this._themes.set(t,e)},applyTheme(t,e=document.documentElement){let i=this._themes?.get(t);if(i)for(let[r,a]of Object.entries(i))e.style.setProperty(r,a)},swap(t){return document.startViewTransition?document.startViewTransition(t):t()},observe(t=document){if(t.querySelectorAll("[data-effect]").forEach(i=>this._processElement(i)),t.querySelectorAll("[data-stagger]").forEach(i=>this._processStagger(i)),t.querySelectorAll("[data-transition]").forEach(i=>this._processTransition(i)),this._observer)return;this._observer=new MutationObserver(i=>{for(let r of i){if(r.type==="childList"){for(let a of r.addedNodes)a.nodeType===Node.ELEMENT_NODE&&this._processTree(a);for(let a of r.removedNodes)a.nodeType===Node.ELEMENT_NODE&&this._cleanupTree(a)}if(r.type==="attributes"){let a=r.target;r.attributeName==="data-effect"&&this._reconcileEffects(a),r.attributeName==="data-trigger"&&this._reconcileTrigger(a),r.attributeName==="data-stagger"&&this._processStagger(a),r.attributeName==="data-transition"&&this._processTransition(a)}}});let e=t===document?document.body:t;this._observer.observe(e,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-effect","data-trigger","data-stagger","data-transition"]})},disconnect(){this._observer&&(this._observer.disconnect(),this._observer=null)},params(t){let e=getComputedStyle(t);return{get(i){return e.getPropertyValue(`--vb-${i}`).trim()},getNumber(i,r=0){let a=e.getPropertyValue(`--vb-${i}`).trim();return a?parseFloat(a):r},hasClass(i){return t.classList.contains(i)}}},emit(t,e,i={}){t.dispatchEvent(new CustomEvent(e,{bubbles:!0,detail:i}))},prefersReducedMotion:y,_processTree(t){t.hasAttribute?.("data-effect")&&this._processElement(t),t.hasAttribute?.("data-stagger")&&this._processStagger(t),t.hasAttribute?.("data-transition")&&this._processTransition(t),t.querySelectorAll?.("[data-effect]").forEach(e=>this._processElement(e)),t.querySelectorAll?.("[data-stagger]").forEach(e=>this._processStagger(e)),t.querySelectorAll?.("[data-transition]").forEach(e=>this._processTransition(e))},_cleanupTree(t){t.hasAttribute?.("data-effect")&&this._cleanupElement(t),t.hasAttribute?.("data-transition")&&this._cleanupTransition(t),t.querySelectorAll?.("[data-effect]").forEach(e=>this._cleanupElement(e)),t.querySelectorAll?.("[data-transition]").forEach(e=>this._cleanupTransition(e))},_processElement(t){if(t.hasAttribute("data-effect-processed"))return;t.setAttribute("data-effect-processed","");let e=t.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[];for(let i of e)this._initEffect(t,i);this._wireTrigger(t,e)},_initEffect(t,e){let i=this._effects.get(e);if(!i)return;let r=this._instances.get(t);if(r?.has(e))return;y();let a=i(t);a&&(r||(r=new Map,this._instances.set(t,r)),typeof a=="function"?r.set(e,{cleanup:a}):r.set(e,a))},_wireTrigger(t,e){let i=t.getAttribute("data-trigger");if(!i){this._activateEffects(t);return}let r=i.split(/\s+/).filter(Boolean);for(let a of r){let o=a.indexOf(":"),s=o>-1?a.slice(0,o):a,n=o>-1?a.slice(o+1):null,l=this._triggers.get(s);if(!l)continue;let d=l(t,()=>this._activateEffects(t),n);if(d){let c=this._triggerCleanups.get(t);if(c){let u=c;this._triggerCleanups.set(t,()=>{u(),d()})}else this._triggerCleanups.set(t,d)}}},_activateEffects(t){t.setAttribute("data-effect-active","");let e=this._instances.get(t);if(e)for(let[,i]of e)i.activate&&i.activate()},_cleanupElement(t){let e=this._instances.get(t);if(e){for(let[,r]of e)r.cleanup&&r.cleanup();this._instances.delete(t)}let i=this._triggerCleanups.get(t);i&&(i(),this._triggerCleanups.delete(t))},_reconcileEffects(t){let e=t.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[],i=this._instances.get(t);if(i)for(let[r,a]of i)e.includes(r)||(a.cleanup&&a.cleanup(),i.delete(r));for(let r of e)i?.has(r)||this._initEffect(t,r);t.hasAttribute("data-effect-processed")||(t.setAttribute("data-effect-processed",""),this._wireTrigger(t,e))},_reconcileTrigger(t){let e=this._triggerCleanups.get(t);e&&(e(),this._triggerCleanups.delete(t));let i=t.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[];this._wireTrigger(t,i)},_processStagger(t){let e=t.children;for(let i=0;i<e.length;i++)e[i].style.setProperty("--vb-stagger-index",String(i))},_processTransition(t){if(t.hasAttribute("data-transition-processed"))return;t.setAttribute("data-transition-processed","");let e=t.getAttribute("data-transition");if(!e)return;let i=this._transitions.get(e);if(i){let r=i(t);r&&this._transitionCleanups.set(t,r)}else t.style.viewTransitionName=`${e}-${this.uid(t)}`},_cleanupTransition(t){let e=this._transitionCleanups.get(t);e&&(e(),this._transitionCleanups.delete(t)),t.style.viewTransitionName=""}};typeof window<"u"&&(window.VB=h);var f=" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?/-",w=60,T=30,C=80;function z(){let t=document.createElement("span");return t.className="vb-flap-char",t.innerHTML=`
    <span class="vb-flap-top"><span class="vb-flap-text">\xA0</span></span>
    <span class="vb-flap-bottom"><span class="vb-flap-text">\xA0</span></span>
    <span class="vb-flap-flip-top"><span class="vb-flap-text">\xA0</span></span>
    <span class="vb-flap-flip-bottom"><span class="vb-flap-text">\xA0</span></span>
    <span class="vb-flap-hinge"></span>
  `,t}function k(t,e){for(let i of t.querySelectorAll(".vb-flap-text"))i.textContent=e||"\xA0"}function M(t,e,i){return new Promise(r=>{let a=t.querySelector(".vb-flap-top .vb-flap-text"),o=t.querySelector(".vb-flap-bottom .vb-flap-text"),s=t.querySelector(".vb-flap-flip-top"),n=s.querySelector(".vb-flap-text"),l=t.querySelector(".vb-flap-flip-bottom"),d=l.querySelector(".vb-flap-text");a.textContent=e||"\xA0",o.textContent=e||"\xA0",n.textContent=e||"\xA0",d.textContent=i||"\xA0",s.classList.add("vb-flap-flipping"),l.classList.add("vb-flap-flipping"),setTimeout(()=>{a.textContent=i||"\xA0"},w/2),setTimeout(()=>{o.textContent=i||"\xA0",s.classList.remove("vb-flap-flipping"),l.classList.remove("vb-flap-flipping"),r()},w)})}async function q(t,e,i,r,a){let o=0;for(let s=0;s<i;s++){if(a._flipGeneration!==r)return;let n=s===i-1,l=f[o%f.length],d=n?e:f[(o+1)%f.length];await M(t,l,d),o++,n||await new Promise(c=>setTimeout(c,T))}}function x(t,e){let i=(t._flipGeneration||0)+1;for(t._flipGeneration=i;t.firstChild;)t.removeChild(t.firstChild);t.classList.add("vb-flap-board");let r=[];for(let a=0;a<e.length;a++){let o=z();t.appendChild(o),r.push(o)}return t._flipboardCells=r,{cells:r,generation:i}}async function L(t,e,i,r){let a=i.map((o,s)=>new Promise(n=>{setTimeout(()=>{if(t._flipGeneration!==r){n();return}let l=4+Math.floor(Math.random()*7);q(o,e[s],l,r,t).then(n)},s*C)}));await Promise.all(a),t._flipGeneration===r&&i.forEach((o,s)=>k(o,e[s]))}h.effect("flipboard",t=>{let e=(t.textContent||"").trim().toUpperCase();if(!e)return;if(t._flipboardOriginal=e,h.prefersReducedMotion()){let{cells:a}=x(t,e);a.forEach((o,s)=>k(o,e[s]));return}let{cells:i,generation:r}=x(t,e);return L(t,e,i,r),{cleanup(){t._flipGeneration=(t._flipGeneration||0)+1,t._flipboardOriginal&&(t.textContent=t._flipboardOriginal,t.classList.remove("vb-flap-board"))}}});h.effect("stamp",t=>{if(document.getElementById("vb-stamp-noise"))return;let e=document.createElementNS("http://www.w3.org/2000/svg","svg");e.setAttribute("aria-hidden","true"),e.style.cssText="position:absolute;width:0;height:0;overflow:hidden",e.innerHTML=`
    <defs>
      <filter id="vb-stamp-noise" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="saturate" values="0" in="noise" result="greyNoise"/>
        <feComposite in="SourceGraphic" in2="greyNoise" operator="in"/>
      </filter>
    </defs>
  `,document.body.prepend(e)});var I=window.matchMedia("(prefers-reduced-motion: reduce)");var A=new Map;function S(t,e,i={}){let r=i.priority??10,a={impl:e,bundle:i.bundle,contract:i.contract,priority:r},o=A.get(t);if(customElements.get(t)){if(!o||o.priority>=r){o&&o.priority===r&&o.impl!==e&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${i.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${i.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=r){o.priority===r&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${o.bundle}". Skipping "${i.bundle}" (first wins at equal priority).`);return}A.set(t,a),customElements.define(t,e)}var m=class t extends HTMLElement{static bundle="retro";static contract="retro-audio-player";static version="1.0.0";static consumesTokens=["--color-primary","--color-surface-sunken","--color-surface-raised","--color-border","--color-text","--color-text-muted","--size-m","--radius-m","--font-mono","--shadow-m"];static exposesTokens=["--audioplayer-screen-color","--audioplayer-bg","--audioplayer-bezel","--audioplayer-screen-bg","--audioplayer-text","--audioplayer-control-size","--audioplayer-glow"];static reducedMotionFallback(e){e._visualizerPaused=!0,e._rafId&&(cancelAnimationFrame(e._rafId),e._rafId=null),e._drawStatic()}static get observedAttributes(){return["src","data-visualizer","autoplay","loop","data-title","data-size"]}constructor(){super(),this.attachShadow({mode:"open"}),this._playing=!1,this._audioCtx=null,this._analyser=null,this._source=null,this._rafId=null,this._visualizerPaused=!1,this._currentMode="wave",this._vuData=new Float32Array(8).fill(0),this._reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches}connectedCallback(){this._render(),this._upgradeAudio(),this._attachEvents(),this._startVisualizer(),this._reducedMotion&&t.reducedMotionFallback(this),window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",e=>{this._reducedMotion=e.matches,e.matches?t.reducedMotionFallback(this):(this._visualizerPaused=!1,this._startVisualizer())})}disconnectedCallback(){this._rafId&&cancelAnimationFrame(this._rafId),this._audioCtx&&this._audioCtx.close(),this._audio?.removeEventListener("timeupdate",this._onTimeUpdate),this._audio?.removeEventListener("ended",this._onEnded)}attributeChangedCallback(e,i,r){this.shadowRoot.innerHTML&&(e==="src"&&this._audio&&(this._audio.src=r,this._updateTrackTitle()),e==="data-visualizer"&&(this._currentMode=r||"wave"),e==="data-title"&&this._updateTrackTitle())}_render(){let e=this.getAttribute("data-visualizer")||"wave",i=this.getAttribute("data-title")||this._titleFromSrc();this._currentMode=e,this.shadowRoot.innerHTML=`
      <style>${this._styles()}</style>

      <div part="bezel">

        <!-- Screen region: canvas visualizer + VU bars -->
        <div part="screen" aria-hidden="true">
          <canvas part="canvas" class="visualizer"></canvas>
          <div class="vu-row" aria-hidden="true">
            ${Array.from({length:8},(r,a)=>`<div part="vu-bar" class="vu-bar" data-index="${a}">
                <div class="vu-fill"></div>
              </div>`).join("")}
          </div>
          <div class="screen-scanlines"></div>
          <div class="screen-glare"></div>
        </div>

        <!-- Track info display -->
        <div class="info-strip">
          <span part="track-title display" class="track-title">${i}</span>
          <span part="time-display display" class="time-display">
            <time class="current-time">0:00</time>
            <span class="time-sep"> / </span>
            <time class="duration">0:00</time>
          </span>
        </div>

        <!-- Controls -->
        <div part="controls" class="controls" role="group" aria-label="Audio controls"
             data-mini-title="${i}" data-mini-time="0:00 / 0:00">

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
    `}_upgradeAudio(){let i=this.shadowRoot.querySelector("slot")?.assignedElements?.().find(a=>a.tagName==="AUDIO");i?this._audio=i:this._audio=this.shadowRoot.querySelector(".native-audio");let r=this.getAttribute("src");r&&(this._audio.src=r),this.hasAttribute("autoplay")&&(this._audio.autoplay=!0),this.hasAttribute("loop")&&(this._audio.loop=!0),this._onTimeUpdate=()=>this._handleTimeUpdate(),this._onEnded=()=>this._handleEnded(),this._audio.addEventListener("timeupdate",this._onTimeUpdate),this._audio.addEventListener("ended",this._onEnded),this._audio.addEventListener("loadedmetadata",()=>this._updateDuration())}_setupAudioContext(){this._audioCtx||(this._audioCtx=new AudioContext,this._analyser=this._audioCtx.createAnalyser(),this._analyser.fftSize=256,this._analyser.smoothingTimeConstant=.8,this._source=this._audioCtx.createMediaElementSource(this._audio),this._source.connect(this._analyser),this._analyser.connect(this._audioCtx.destination))}_attachEvents(){let e=this.shadowRoot;e.querySelector(".btn-play").addEventListener("click",()=>{this._playing?this._pause():this._play()}),e.querySelector(".btn-skip").addEventListener("click",()=>{this._audio.currentTime=0,this._playing||this._play()});let i=e.querySelector('[part~="timeline"]');i.addEventListener("input",()=>{this._audio.duration&&(this._audio.currentTime=i.value/100*this._audio.duration)});let r=e.querySelector('[part~="volume"]');r.addEventListener("input",()=>{this._audio.volume=r.value})}_play(){this._setupAudioContext(),this._audioCtx.state==="suspended"&&this._audioCtx.resume(),this._audio.play(),this._playing=!0,this.setAttribute("data-state","playing"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-label","Pause"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-pressed","true"),this.dispatchEvent(new CustomEvent("vb:audioplayer:play",{bubbles:!0,composed:!0,detail:{currentTime:this._audio.currentTime,src:this._audio.src}}))}_pause(){this._audio.pause(),this._playing=!1,this.setAttribute("data-state","paused"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-label","Play"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-pressed","false"),this.dispatchEvent(new CustomEvent("vb:audioplayer:pause",{bubbles:!0,composed:!0,detail:{currentTime:this._audio.currentTime}}))}_handleTimeUpdate(){let e=this._audio.currentTime,i=this._audio.duration||0,r=i?e/i*100:0;this.shadowRoot.querySelector(".current-time").textContent=this._formatTime(e);let a=this.shadowRoot.querySelector('[part~="timeline"]');a.value=r,a.setAttribute("aria-valuenow",Math.round(r)),this.shadowRoot.querySelector(".timeline-fill").style.width=`${r}%`;let o=this.shadowRoot.querySelector('[part~="controls"]');o&&(o.dataset.miniTime=`${this._formatTime(e)} / ${this._formatTime(i)}`),this.dispatchEvent(new CustomEvent("vb:audioplayer:timeupdate",{bubbles:!0,composed:!0,detail:{currentTime:e,duration:i,progress:r}}))}_updateDuration(){let e=this._audio.duration||0;this.shadowRoot.querySelector(".duration").textContent=this._formatTime(e);let i=this.shadowRoot.querySelector('[part~="controls"]');i&&(i.dataset.miniTime=`0:00 / ${this._formatTime(e)}`)}_handleEnded(){this._playing=!1,this.setAttribute("data-state","ended"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-label","Play"),this.shadowRoot.querySelector(".btn-play").setAttribute("aria-pressed","false"),this.dispatchEvent(new CustomEvent("vb:audioplayer:ended",{bubbles:!0,composed:!0,detail:{src:this._audio.src}}))}_formatTime(e){if(!isFinite(e))return"0:00";let i=Math.floor(e/60),r=Math.floor(e%60).toString().padStart(2,"0");return`${i}:${r}`}_startVisualizer(){let e=this.shadowRoot.querySelector(".visualizer");if(!e)return;let i=()=>{this._visualizerPaused||(this._rafId=requestAnimationFrame(i),this._drawFrame(e))};this._rafId=requestAnimationFrame(i)}_drawFrame(e){let i=e.getContext("2d"),r=e.width=e.offsetWidth,a=e.height=e.offsetHeight,o=this._currentMode,s=getComputedStyle(this),n=s.getPropertyValue("--audioplayer-screen-color").trim()||"oklch(70% 0.28 145)",l=s.getPropertyValue("--audioplayer-screen-bg").trim()||"oklch(6% 0.02 260)",d=null;if(this._analyser&&this._playing){let c=this._analyser.frequencyBinCount;d=new Uint8Array(c),o==="wave"?this._analyser.getByteTimeDomainData(d):this._analyser.getByteFrequencyData(d)}i.fillStyle=l,i.globalAlpha=this._playing?.25:1,i.fillRect(0,0,r,a),i.globalAlpha=1,this._playing?o==="wave"?this._drawWave(i,r,a,n,d):o==="bars"?this._drawBars(i,r,a,n,d):o==="circle"&&this._drawCircle(i,r,a,n,d):this._drawIdle(i,r,a,n),this._updateVU(d)}_drawIdle(e,i,r,a){let o=r/2;e.beginPath(),e.moveTo(0,o),e.lineTo(i,o),e.strokeStyle=a,e.lineWidth=1,e.globalAlpha=.3,e.stroke(),e.globalAlpha=1,Math.floor(Date.now()/600)%2===0&&(e.beginPath(),e.arc(12,r/2,2,0,Math.PI*2),e.fillStyle=a,e.globalAlpha=.6,e.fill(),e.globalAlpha=1)}_drawWave(e,i,r,a,o){if(!o)return;let s=i/o.length,n=0;e.beginPath(),e.shadowColor=a,e.shadowBlur=8,e.strokeStyle=a,e.lineWidth=2,e.globalAlpha=.5;for(let l=0;l<o.length;l++){let c=o[l]/128*r/2;l===0?e.moveTo(n,c):e.lineTo(n,c),n+=s}e.stroke(),e.beginPath(),e.shadowBlur=0,e.strokeStyle=a,e.lineWidth=1.5,e.globalAlpha=1,n=0;for(let l=0;l<o.length;l++){let c=o[l]/128*r/2;l===0?e.moveTo(n,c):e.lineTo(n,c),n+=s}e.stroke()}_drawBars(e,i,r,a,o){if(!o)return;let s=Math.min(o.length,48),n=i/s-1;e.shadowColor=a,e.shadowBlur=6;for(let l=0;l<s;l++){let c=o[l]/255*r,u=l*(i/s),p=e.createLinearGradient(0,r-c,0,r);p.addColorStop(0,a),e.globalAlpha=1,p.addColorStop(1,a),e.fillStyle=p,e.fillRect(u,r-c,n,c),e.globalAlpha=.3,e.fillStyle=a,e.fillRect(u,r-c/2,n,c/2)}e.globalAlpha=1,e.shadowBlur=0}_drawCircle(e,i,r,a,o){if(!o)return;let s=i/2,n=r/2,l=Math.min(i,r)*.25,d=o.length;e.shadowColor=a,e.shadowBlur=6,e.strokeStyle=a,e.lineWidth=1.5,e.beginPath();for(let c=0;c<d;c++){let u=c/d*Math.PI*2,p=o[c]/255*(l*.8),b=l+p,g=s+b*Math.cos(u),v=n+b*Math.sin(u);c===0?e.moveTo(g,v):e.lineTo(g,v)}e.closePath(),e.stroke(),e.beginPath(),e.arc(s,n,2,0,Math.PI*2),e.fillStyle=a,e.globalAlpha=.4,e.fill(),e.globalAlpha=1,e.shadowBlur=0}_drawStatic(){let e=this.shadowRoot.querySelector(".visualizer");e&&this._drawIdle(e.getContext("2d"),e.offsetWidth,e.offsetHeight,getComputedStyle(this).getPropertyValue("--audioplayer-screen-color").trim())}_updateVU(e){let i=this.shadowRoot.querySelectorAll(".vu-bar");if(!i.length)return;if(!e||!this._playing){i.forEach(a=>{a.querySelector(".vu-fill").style.height="0%",a.removeAttribute("data-peak")});return}let r=Math.floor(e.length/i.length);i.forEach((a,o)=>{let s=e[o*r]/255,n=Math.round(s*100);a.querySelector(".vu-fill").style.height=`${n}%`,a.toggleAttribute("data-peak",n>80)})}_titleFromSrc(){let e=this.getAttribute("src");return e?e.split("/").pop().split("?")[0].replace(/\.[^.]+$/,"").replace(/[-_]/g," ").toUpperCase():"NO SIGNAL"}_updateTrackTitle(){let e=this.getAttribute("data-title")||this._titleFromSrc(),i=this.shadowRoot.querySelector('[part~="track-title"]');i&&(i.textContent=e);let r=this.shadowRoot.querySelector('[part~="controls"]');r&&(r.dataset.miniTitle=e)}};S("retro-audio-player",m,{bundle:"retro",contract:"retro-audio-player",priority:10});
//# sourceMappingURL=retro.full.js.map
