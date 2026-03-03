var K=Object.defineProperty;var Y=(s,e)=>()=>(s&&(e=s(s=0)),e);var Q=(s,e)=>{for(var t in e)K(s,t,{get:e[t],enumerable:!0})};var H={};Q(H,{SoundManager:()=>ae});var U,C,ae,N=Y(()=>{U="vb-sound",C={enabled:!1,volume:.5},ae={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let s=this._load();return this._enabled=s.enabled,this._volume=s.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let s=localStorage.getItem(U);return s?{...C,...JSON.parse(s)}:{...C}}catch{return{...C}}},_save(s){try{let e=this._load();localStorage.setItem(U,JSON.stringify({...e,...s}))}catch{}},_playTone(s,e,t="sine"){if(!this._enabled)return;let n=this._getContext(),i=n.createOscillator(),a=n.createGain();i.connect(a),a.connect(n.destination),i.frequency.value=s,i.type=t,a.gain.value=this._volume*.3,i.start(),a.gain.exponentialRampToValueAtTime(.01,n.currentTime+e),i.stop(n.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(s){this._volume=Math.max(0,Math.min(1,s)),this._save({volume:this._volume})},getVolume(){return this._volume},play(s){if(this._enabled)switch(s){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var v=new Map,y=null,q=null;function O(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(q)return q;if(typeof document<"u"){let s=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of s){let t=e.getAttribute("src");if(t){let n=t.lastIndexOf("/");if(n!==-1)return t.slice(0,n)}}}return"/cdn"}async function X(){if(y)return y;let s=O();try{let e=await fetch(`${s}/themes/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);y=await e.json()}catch{y={}}return y}var Z=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia"]);async function E(s){if(!s||Z.has(s))return;if(v.has(s))return v.get(s);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${s}"]`)){v.set(s,Promise.resolve());return}let e=ee(s);return v.set(s,e),e}async function ee(s){let e=O(),n=(await X())[s],i=n?n.file:`${s}.css`,a=`${e}/themes/${i}`;return new Promise((o,h)=>{let d=document.querySelector(`link[data-vb-theme-preload="${s}"]`);d&&d.remove();let r=document.createElement("link");r.rel="stylesheet",r.href=a,r.setAttribute("data-vb-theme",s),r.onload=()=>o(),r.onerror=()=>{r.remove(),v.delete(s),h(new Error(`Failed to load theme: ${s}`))},document.head.appendChild(r)})}var x="vb-theme",w={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:""},l={async init(){let s=this.load();try{await E(s.brand)}catch{s.brand="default"}return this.apply(s),this._watchSystemPreference(),s},load(){try{let s=localStorage.getItem(x);return s?{...w,...JSON.parse(s)}:{...w}}catch{return{...w}}},save(s){let t={...this.load(),...s};try{localStorage.setItem(x,JSON.stringify(t))}catch{}return t},apply({mode:s="auto",brand:e="default",borderStyle:t="",iconSet:n="",fluid:i="",backdrop:a=""}={}){let o=document.documentElement;s==="auto"?delete o.dataset.mode:o.dataset.mode=s;let d=(o.dataset.theme||"").split(" ").filter(g=>g.startsWith("a11y-")),r=e!=="default"?[e,...d]:[...d];r.length?o.dataset.theme=r.join(" "):delete o.dataset.theme;let u=t||this._readCSSHint("--theme-border-style");u&&u!=="clean"?o.dataset.borderStyle=u:delete o.dataset.borderStyle;let p=n||this._readCSSHint("--theme-icon-set");p&&p!=="lucide"?o.dataset.iconSet=p:delete o.dataset.iconSet,i?o.dataset.fluid=i:delete o.dataset.fluid,a?o.dataset.backdrop=a:delete o.dataset.backdrop,window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:s,brand:e,borderStyle:u,iconSet:p,fluid:i,backdrop:a,effectiveMode:this.getEffectiveMode()}}))},setMode(s){let e=this.save({mode:s});this.apply(e)},async setBrand(s){try{await E(s)}catch(t){console.warn(`[VB] Theme "${s}" failed to load, using default`,t),s="default"}let e=this.save({brand:s});this.apply(e)},setBorderStyle(s){let e=this.save({borderStyle:s});this.apply(e)},setIconSet(s){let e=this.save({iconSet:s});this.apply(e)},setFluid(s){let e=this.save({fluid:s});this.apply(e)},setBackdrop(s){let e=this.save({backdrop:s});this.apply(e)},getEffectiveMode(){let{mode:s}=this.load();return s!=="auto"?s:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:s,brand:e,borderStyle:t,iconSet:n,fluid:i,backdrop:a}=this.load();return{mode:s,brand:e,borderStyle:t,iconSet:n,fluid:i,backdrop:a,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(x)}catch{}this.apply(w)},_readCSSHint(s){return getComputedStyle(document.documentElement).getPropertyValue(s).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let{mode:e,brand:t}=this.load();e==="auto"&&window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:e,brand:t,effectiveMode:this.getEffectiveMode()}}))})}};var k=null;function V(){return"0.1.0"}function te(){let s=document.querySelectorAll('script[src*="vanilla-breeze"]'),e="/cdn/sw.js";for(let t of s){let n=t.getAttribute("src");if(n){let i=n.lastIndexOf("/");if(i!==-1){e=n.slice(0,i)+"/sw.js";break}}}return e}function P(){return k||(k=navigator.serviceWorker?.ready??Promise.reject(new Error("SW not supported"))),k}function R(s){return new Promise((e,t)=>{navigator.serviceWorker?.controller?I(navigator.serviceWorker.controller,s,e,t):P().then(n=>{let i=n.active||n.waiting||n.installing;i?I(i,s,e,t):t(new Error("No active service worker"))}).catch(t)})}function I(s,e,t,n){let i=new MessageChannel;i.port1.onmessage=a=>t(a.data),i.port1.onmessageerror=()=>n(new Error("Message error")),s.postMessage({type:e},[i.port2]),setTimeout(()=>n(new Error("SW message timeout")),5e3)}async function F(){return R("GET_STATUS")}async function W(){return R("CLEAR_CACHE")}async function D(){let s=await P();return await s.update(),{updated:!!s.waiting}}function se(){return typeof window>"u"||!("serviceWorker"in navigator)?!1:window.__VB_SERVICE_WORKER?!0:document.querySelector('meta[name="vb-service-worker"]')?.content==="true"}if(se()){let s=te();window.addEventListener("load",()=>{k=navigator.serviceWorker.register(s).catch(e=>{console.warn("[VB] Service worker registration failed:",e)})})}var f=null,$="vb-extensions",S={motionFx:!0,sounds:!1},z="vb-a11y-themes",G=[{id:"ocean",name:"Ocean",color:"#0891b2"},{id:"forest",name:"Forest",color:"#059669"},{id:"sunset",name:"Sunset",color:"#ea580c"},{id:"rose",name:"Rose",color:"#e11d48"},{id:"lavender",name:"Lavender",color:"#a855f7"},{id:"coral",name:"Coral",color:"#f97316"},{id:"slate",name:"Slate",color:"#64748b"},{id:"emerald",name:"Emerald",color:"#10b981"},{id:"amber",name:"Amber",color:"#f59e0b"},{id:"indigo",name:"Indigo",color:"#6366f1"}],j=new Set(G.map(s=>s.id)),_=class extends HTMLElement{#t;#e;#s=!1;connectedCallback(){this.#C(),this.#_(),this.#n(),window.addEventListener("theme-change",this.#a),window.addEventListener("extensions-change",this.#a),window.addEventListener("a11y-themes-change",this.#a)}disconnectedCallback(){window.removeEventListener("theme-change",this.#a),window.removeEventListener("extensions-change",this.#a),window.removeEventListener("a11y-themes-change",this.#a),document.removeEventListener("click",this.#f),document.removeEventListener("keydown",this.#y)}#d(e){return!e||e==="default"||j.has(e)?"default":e}#u(e){return j.has(e)?e:""}#h(e){return e!==""&&e!==void 0}#c(e){return e==="compact"?"compact":e==="spacious"?"spacious":"default"}#p(e,t){return e?t==="compact"?"compact":t==="spacious"?"spacious":"default":""}#g(e){return e!==""&&e!==void 0}#r(e){return e==="flush"?"flush":e==="elevated"?"elevated":"default"}#m(e,t){return e?t==="flush"?"flush":t==="elevated"?"elevated":"default":""}#C(){this.#t=this.querySelector(":scope > [data-trigger]")||this.querySelector(":scope > button"),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.setAttribute("aria-label","Site settings"),this.#t.className="settings-trigger",this.#t.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false"),this.#e=document.createElement("div"),this.#e.className="settings-panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Site settings");let e=`settings-panel-${crypto.randomUUID().slice(0,8)}`;this.#e.id=e,this.#t.setAttribute("aria-controls",e),this.#e.innerHTML=this.#$(),this.appendChild(this.#e)}#$(){let{mode:e,brand:t,fluid:n,backdrop:i}=l.getState(),a=this.#d(t),o=this.#u(t),h=this.#i(),d=this.#o(),r=a==="default",u=this.#h(n),p=this.#c(n),g=this.#g(i),b=this.#r(i);return`
      <header class="settings-header">
        <strong>Settings</strong>
        <button type="button" class="settings-close" aria-label="Close settings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>

      <div class="settings-body">
        <!-- Appearance -->
        <details name="settings" open>
          <summary>Appearance</summary>
          <div class="settings-section">
            <span class="settings-label">Color Mode</span>
            <div class="segmented-control" role="radiogroup" aria-label="Color mode">
              ${["auto","light","dark"].map(c=>`
                <label class="segment">
                  <input type="radio" name="settings-mode" value="${c}" ${e===c?"checked":""} />
                  <span>${c[0].toUpperCase()+c.slice(1)}</span>
                </label>
              `).join("")}
            </div>

            <label class="settings-label" for="settings-theme">Theme</label>
            <select id="settings-theme" name="settings-theme">
              <optgroup label="Base">
                <option value="default" ${a==="default"?"selected":""}>Default</option>
              </optgroup>
              <optgroup label="Personality">
                <option value="modern" ${a==="modern"?"selected":""}>Modern</option>
                <option value="minimal" ${a==="minimal"?"selected":""}>Minimal</option>
                <option value="classic" ${a==="classic"?"selected":""}>Classic</option>
              </optgroup>
              <optgroup label="Extreme">
                <option value="swiss" ${a==="swiss"?"selected":""}>Swiss</option>
                <option value="brutalist" ${a==="brutalist"?"selected":""}>Brutalist</option>
                <option value="cyber" ${a==="cyber"?"selected":""}>Cyber</option>
                <option value="terminal" ${a==="terminal"?"selected":""}>Terminal</option>
                <option value="organic" ${a==="organic"?"selected":""}>Organic</option>
                <option value="editorial" ${a==="editorial"?"selected":""}>Editorial</option>
                <option value="kawaii" ${a==="kawaii"?"selected":""}>Kawaii</option>
                <option value="8bit" ${a==="8bit"?"selected":""}>8-Bit</option>
                <option value="nes" ${a==="nes"?"selected":""}>NES</option>
                <option value="win9x" ${a==="win9x"?"selected":""}>Win9x</option>
                <option value="rough" ${a==="rough"?"selected":""}>Rough</option>
                <option value="nord" ${a==="nord"?"selected":""}>Nord</option>
                <option value="solarized" ${a==="solarized"?"selected":""}>Solarized</option>
                <option value="dracula" ${a==="dracula"?"selected":""}>Dracula</option>
                <option value="catppuccin-mocha" ${a==="catppuccin-mocha"?"selected":""}>Catppuccin Mocha</option>
                <option value="glassmorphism" ${a==="glassmorphism"?"selected":""}>Glassmorphism</option>
                <option value="art-deco" ${a==="art-deco"?"selected":""}>Art Deco</option>
                <option value="genai" ${a==="genai"?"selected":""}>GenAI</option>
                <option value="gruvbox" ${a==="gruvbox"?"selected":""}>Gruvbox</option>
                <option value="tokyo-night" ${a==="tokyo-night"?"selected":""}>Tokyo Night</option>
                <option value="rose-pine" ${a==="rose-pine"?"selected":""}>Ros\xE9 Pine</option>
                <option value="vaporwave" ${a==="vaporwave"?"selected":""}>Vaporwave</option>
                <option value="neumorphism" ${a==="neumorphism"?"selected":""}>Neumorphism</option>
                <option value="catppuccin-latte" ${a==="catppuccin-latte"?"selected":""}>Catppuccin Latte</option>
                <option value="catppuccin-frappe" ${a==="catppuccin-frappe"?"selected":""}>Catppuccin Frapp\xE9</option>
                <option value="catppuccin-macchiato" ${a==="catppuccin-macchiato"?"selected":""}>Catppuccin Macchiato</option>
                <option value="bauhaus" ${a==="bauhaus"?"selected":""}>Bauhaus</option>
                <option value="memphis" ${a==="memphis"?"selected":""}>Memphis</option>
                <option value="cottagecore" ${a==="cottagecore"?"selected":""}>Cottagecore</option>
                <option value="claymorphism" ${a==="claymorphism"?"selected":""}>Claymorphism</option>
                <option value="clinical" ${a==="clinical"?"selected":""}>Clinical</option>
                <option value="financial" ${a==="financial"?"selected":""}>Financial</option>
                <option value="government" ${a==="government"?"selected":""}>Government</option>
                <option value="startup" ${a==="startup"?"selected":""}>Startup</option>
                <option value="dawn" ${a==="dawn"?"selected":""}>Dawn</option>
                <option value="dusk" ${a==="dusk"?"selected":""}>Dusk</option>
                <option value="midnight" ${a==="midnight"?"selected":""}>Midnight</option>
                <option value="high-noon" ${a==="high-noon"?"selected":""}>High Noon</option>
              </optgroup>
            </select>

            <div class="accent-row" ${r?"":"hidden"}>
              <span class="settings-label">Accent Color</span>
              <div class="accent-swatches" role="radiogroup" aria-label="Accent color">
                <label class="accent-swatch accent-swatch--none" title="None (default blue)">
                  <input type="radio" name="settings-accent" value="" ${o===""?"checked":""} />
                  <span class="accent-dot" style="background: var(--color-interactive, #3b82f6)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                </label>
                ${G.map(c=>`
                  <label class="accent-swatch" title="${c.name}">
                    <input type="radio" name="settings-accent" value="${c.id}" ${o===c.id?"checked":""} />
                    <span class="accent-dot" style="background: ${c.color}"></span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        </details>

        <!-- Accessibility -->
        <details name="settings">
          <summary>Accessibility</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>High Contrast</span>
              <input type="checkbox" name="a11y-high-contrast" data-switch="sm" data-a11y="a11y-high-contrast" ${h.includes("a11y-high-contrast")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Large Text</span>
              <input type="checkbox" name="a11y-large-text" data-switch="sm" data-a11y="a11y-large-text" ${h.includes("a11y-large-text")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Dyslexia-Friendly</span>
              <input type="checkbox" name="a11y-dyslexia" data-switch="sm" data-a11y="a11y-dyslexia" ${h.includes("a11y-dyslexia")?"checked":""} />
            </label>
          </div>
        </details>

        <!-- Layout -->
        <details name="settings">
          <summary>Layout</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Fluid Scaling</span>
              <input type="checkbox" name="fluid-scaling" data-switch="sm" data-fluid-toggle ${u?"checked":""} />
            </label>
            <div class="density-row" ${u?"":"hidden"}>
              <span class="settings-label">Density</span>
              <div class="segmented-control" role="radiogroup" aria-label="Density">
                ${["compact","default","spacious"].map(c=>`
                  <label class="segment">
                    <input type="radio" name="settings-density" value="${c}" ${p===c?"checked":""} />
                    <span>${c[0].toUpperCase()+c.slice(1)}</span>
                  </label>
                `).join("")}
              </div>
            </div>

            <label class="toggle-row">
              <span>Canvas Backdrop</span>
              <input type="checkbox" name="canvas-backdrop" data-switch="sm" data-backdrop-toggle ${g?"checked":""} />
            </label>
            <div class="backdrop-row" ${g?"":"hidden"}>
              <span class="settings-label">Style</span>
              <div class="segmented-control" role="radiogroup" aria-label="Backdrop style">
                ${["default","flush","elevated"].map(c=>`
                  <label class="segment">
                    <input type="radio" name="settings-backdrop" value="${c}" ${b===c?"checked":""} />
                    <span>${c[0].toUpperCase()+c.slice(1)}</span>
                  </label>
                `).join("")}
              </div>
            </div>
          </div>
        </details>

        <!-- Effects -->
        <details name="settings">
          <summary>Effects</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Motion Effects</span>
              <input type="checkbox" name="ext-motionFx" data-switch="sm" data-ext="motionFx" ${d.motionFx?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Sound Effects</span>
              <input type="checkbox" name="ext-sounds" data-switch="sm" data-ext="sounds" ${d.sounds?"checked":""} />
            </label>
          </div>
        </details>

        <!-- System -->
        <details name="settings">
          <summary>System</summary>
          <div class="settings-section system-info">
            <p class="system-version">Vanilla Breeze <code>v${V()}</code></p>
            <p class="system-sw-status" data-sw-status>Service Worker: <span>checking\u2026</span></p>
            <footer class="system-actions">
              <button type="button" data-action="clear-cache">Clear Cache</button>
              <button type="button" data-action="check-update">Check for Updates</button>
            </footer>
          </div>
        </details>
      </div>

      <footer class="settings-footer">
        <button type="button" class="settings-reset">Reset to Defaults</button>
      </footer>
    `}#_(){this.#t.addEventListener("click",this.#T),document.addEventListener("click",this.#f),document.addEventListener("keydown",this.#y),this.#e.querySelector(".settings-close")?.addEventListener("click",()=>this.close()),this.#e.querySelectorAll('input[name="settings-mode"]').forEach(e=>{e.addEventListener("change",this.#A)}),this.#e.querySelector("#settings-theme")?.addEventListener("change",this.#M),this.#e.querySelectorAll('input[name="settings-accent"]').forEach(e=>{e.addEventListener("change",this.#L)}),this.#e.querySelector("input[data-fluid-toggle]")?.addEventListener("change",this.#B),this.#e.querySelectorAll('input[name="settings-density"]').forEach(e=>{e.addEventListener("change",this.#q)}),this.#e.querySelector("input[data-backdrop-toggle]")?.addEventListener("change",this.#O),this.#e.querySelectorAll('input[name="settings-backdrop"]').forEach(e=>{e.addEventListener("change",this.#I)}),this.#e.querySelectorAll("input[data-a11y]").forEach(e=>{e.addEventListener("change",this.#V)}),this.#e.querySelectorAll("input[data-ext]").forEach(e=>{e.addEventListener("change",this.#P)}),this.#e.querySelector(".settings-reset")?.addEventListener("click",this.#R),this.#e.querySelector('[data-action="clear-cache"]')?.addEventListener("click",this.#W),this.#e.querySelector('[data-action="check-update"]')?.addEventListener("click",this.#D),this.#x()}#T=e=>{e.stopPropagation(),this.toggle()};#f=e=>{this.#s&&!this.contains(e.target)&&this.close()};#y=e=>{e.key==="Escape"&&this.#s&&(e.preventDefault(),this.close(),this.#t?.focus())};#A=e=>{l.setMode(e.target.value)};#M=async e=>{let t=e.target;t.disabled=!0;try{let n=t.value;if(n==="default"){let a=this.#e.querySelector('input[name="settings-accent"]:checked')?.value||"";await l.setBrand(a||"default")}else await l.setBrand(n);this.#v(t.value==="default"),this.#S()}catch{console.warn("[VB] Theme load failed, using default")}finally{t.disabled=!1}};#L=async e=>{let t=e.target.value;try{await l.setBrand(t||"default")}catch{console.warn("[VB] Theme load failed")}this.#S()};#B=e=>{let t=e.target.checked,n=this.#c(l.getState().fluid)||"default";l.setFluid(this.#p(t,n)),this.#b(t)};#q=e=>{l.setFluid(this.#p(!0,e.target.value))};#O=e=>{let t=e.target.checked,n=this.#r(l.getState().backdrop)||"default";l.setBackdrop(this.#m(t,n)),this.#w(t)};#I=e=>{l.setBackdrop(this.#m(!0,e.target.value))};#V=e=>{let t=e.target.dataset.a11y,n=this.#i();if(e.target.checked&&!n.includes(t))n.push(t);else if(!e.target.checked){let i=n.indexOf(t);i!==-1&&n.splice(i,1)}this.#k(n),this.#l(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:n}))};#P=e=>{let t=e.target.dataset.ext,n=e.target.checked;this.#F(t,n),this.#E()};#R=()=>{if(confirm("Reset all settings to defaults?")){l.reset(),this.#k([]),this.#l(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:[]}));try{localStorage.removeItem($)}catch{}this.#E(),this.#n()}};#a=()=>{this.#n()};#n(){let{mode:e,brand:t,fluid:n,backdrop:i}=l.getState(),a=this.#d(t),o=this.#u(t),h=this.#i(),d=this.#o(),r=this.#h(n),u=this.#c(n),p=this.#g(i),g=this.#r(i),b=this.#e.querySelector(`input[name="settings-mode"][value="${e}"]`);b&&(b.checked=!0);let c=this.#e.querySelector("#settings-theme");c&&(c.value=a);let T=this.#e.querySelector(`input[name="settings-accent"][value="${o}"]`);T&&(T.checked=!0),this.#v(a==="default");let A=this.#e.querySelector("input[data-fluid-toggle]");A&&(A.checked=r);let M=this.#e.querySelector(`input[name="settings-density"][value="${u}"]`);M&&(M.checked=!0),this.#b(r);let L=this.#e.querySelector("input[data-backdrop-toggle]");L&&(L.checked=p);let B=this.#e.querySelector(`input[name="settings-backdrop"][value="${g}"]`);B&&(B.checked=!0),this.#w(p),this.#e.querySelectorAll("input[data-a11y]").forEach(m=>{m.checked=h.includes(m.dataset.a11y)}),this.#e.querySelectorAll("input[data-ext]").forEach(m=>{let J=d[m.dataset.ext];m.checked=J??S[m.dataset.ext]})}#v(e){let t=this.#e.querySelector(".accent-row");t&&(t.hidden=!e)}#b(e){let t=this.#e.querySelector(".density-row");t&&(t.hidden=!e)}#w(e){let t=this.#e.querySelector(".backdrop-row");t&&(t.hidden=!e)}#i(){try{let e=localStorage.getItem(z);return e?JSON.parse(e):[]}catch{return[]}}#k(e){try{localStorage.setItem(z,JSON.stringify(e))}catch{}}#l(){let e=this.#i(),{brand:t}=l.getState(),n=document.documentElement,i=t!=="default"?[t,...e]:[...e];i.length?n.dataset.theme=i.join(" "):delete n.dataset.theme}#S(){this.#l()}#o(){try{let e=localStorage.getItem($);return e?{...S,...JSON.parse(e)}:{...S}}catch{return{...S}}}#F(e,t){try{let n=this.#o();n[e]=t,localStorage.setItem($,JSON.stringify(n))}catch{}}async#E(){let e=this.#o(),t=document.documentElement;e.motionFx?delete t.dataset.motionReduced:t.dataset.motionReduced="",e.sounds?(f||(f=(await Promise.resolve().then(()=>(N(),H))).SoundManager),f.init(),f.enable()):f&&f.disable(),window.dispatchEvent(new CustomEvent("extensions-change",{detail:e}))}async#x(){let e=this.#e.querySelector("[data-sw-status] span");if(e){if(!("serviceWorker"in navigator)){e.textContent="Not supported";return}try{let n=(await F()).cachedURLs?.length??0;e.textContent=`Active (${n} cached files)`}catch{e.textContent="Not registered"}}}#W=async e=>{let t=e.target;t.disabled=!0,t.textContent="Clearing\u2026";try{await W(),t.textContent="Cleared!",this.#x(),setTimeout(()=>{t.textContent="Clear Cache",t.disabled=!1},2e3)}catch{t.textContent="Failed",setTimeout(()=>{t.textContent="Clear Cache",t.disabled=!1},2e3)}};#D=async e=>{let t=e.target;t.disabled=!0,t.textContent="Checking\u2026";try{let{updated:n}=await D();t.textContent=n?"Update available!":"Up to date",setTimeout(()=>{t.textContent="Check for Updates",t.disabled=!1},2e3)}catch{t.textContent="Failed",setTimeout(()=>{t.textContent="Check for Updates",t.disabled=!1},2e3)}};open(){this.#s||(this.#s=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),this.#n(),this.#U())}#U(){let e=this.getBoundingClientRect(),t=this.#e;t.style.removeProperty("top"),t.style.removeProperty("bottom"),t.style.removeProperty("left"),t.style.removeProperty("right");let n=t.getBoundingClientRect(),i=window.innerWidth,a=window.innerHeight,o=e.top,h=a-e.bottom;o<n.height&&h>o?(t.style.top="calc(100% + 8px)",t.style.bottom="auto"):(t.style.bottom="calc(100% + 8px)",t.style.top="auto");let d=i-e.right,r=e.left,u=n.width;e.right<u&&r<d?(t.style.left="0",t.style.right="auto"):(t.style.right="0",t.style.left="auto")}close(){this.#s&&(this.#s=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"))}toggle(){this.#s?this.close():this.open()}};customElements.define("settings-panel",_);export{_ as SettingsPanel};
//# sourceMappingURL=settings-panel.js.map
