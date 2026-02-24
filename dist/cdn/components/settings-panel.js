var z=Object.defineProperty;var G=(s,e)=>()=>(s&&(e=s(s=0)),e);var j=(s,e)=>{for(var t in e)z(s,t,{get:e[t],enumerable:!0})};var P={};j(P,{SoundManager:()=>F,default:()=>Z});var R,x,F,Z,W=G(()=>{R="vb-sound",x={enabled:!1,volume:.5},F={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let s=this._load();return this._enabled=s.enabled,this._volume=s.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let s=localStorage.getItem(R);return s?{...x,...JSON.parse(s)}:{...x}}catch{return{...x}}},_save(s){try{let e=this._load();localStorage.setItem(R,JSON.stringify({...e,...s}))}catch{}},_playTone(s,e,t="sine"){if(!this._enabled)return;let n=this._getContext(),a=n.createOscillator(),i=n.createGain();a.connect(i),i.connect(n.destination),a.frequency.value=s,a.type=t,i.gain.value=this._volume*.3,a.start(),i.gain.exponentialRampToValueAtTime(.01,n.currentTime+e),a.stop(n.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(s){this._volume=Math.max(0,Math.min(1,s)),this._save({volume:this._volume})},getVolume(){return this._volume},play(s){if(this._enabled)switch(s){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}},Z=F});var f=new Map,m=null,T=null;function A(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(T)return T;if(typeof document<"u"){let s=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of s){let t=e.getAttribute("src");if(t){let n=t.lastIndexOf("/");if(n!==-1)return t.slice(0,n)}}}return"/cdn"}async function J(){if(m)return m;let s=A();try{let e=await fetch(`${s}/themes/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);m=await e.json()}catch{m={}}return m}var K=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia"]);async function w(s){if(!s||K.has(s))return;if(f.has(s))return f.get(s);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${s}"]`)){f.set(s,Promise.resolve());return}let e=Y(s);return f.set(s,e),e}async function Y(s){let e=A(),n=(await J())[s],a=n?n.file:`${s}.css`,i=`${e}/themes/${a}`;return new Promise((d,u)=>{let r=document.querySelector(`link[data-vb-theme-preload="${s}"]`);r&&r.remove();let o=document.createElement("link");o.rel="stylesheet",o.href=i,o.setAttribute("data-vb-theme",s),o.onload=()=>d(),o.onerror=()=>{o.remove(),f.delete(s),u(new Error(`Failed to load theme: ${s}`))},document.head.appendChild(o)})}var S="vb-theme",y={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:""},l={async init(){let s=this.load();try{await w(s.brand)}catch{s.brand="default"}return this.apply(s),this._watchSystemPreference(),s},load(){try{let s=localStorage.getItem(S);return s?{...y,...JSON.parse(s)}:{...y}}catch{return{...y}}},save(s){let t={...this.load(),...s};try{localStorage.setItem(S,JSON.stringify(t))}catch{}return t},apply({mode:s="auto",brand:e="default",borderStyle:t="",iconSet:n="",fluid:a=""}={}){let i=document.documentElement;s==="auto"?delete i.dataset.mode:i.dataset.mode=s;let u=(i.dataset.theme||"").split(" ").filter(c=>c.startsWith("a11y-")),r=e!=="default"?[e,...u]:[...u];r.length?i.dataset.theme=r.join(" "):delete i.dataset.theme;let o=t||this._readCSSHint("--theme-border-style");o&&o!=="clean"?i.dataset.borderStyle=o:delete i.dataset.borderStyle;let h=n||this._readCSSHint("--theme-icon-set");h&&h!=="lucide"?i.dataset.iconSet=h:delete i.dataset.iconSet,a?i.dataset.fluid=a:delete i.dataset.fluid,window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:s,brand:e,borderStyle:o,iconSet:h,fluid:a,effectiveMode:this.getEffectiveMode()}}))},setMode(s){let e=this.save({mode:s});this.apply(e)},async setBrand(s){try{await w(s)}catch(t){console.warn(`[VB] Theme "${s}" failed to load, using default`,t),s="default"}let e=this.save({brand:s});this.apply(e)},setBorderStyle(s){let e=this.save({borderStyle:s});this.apply(e)},setIconSet(s){let e=this.save({iconSet:s});this.apply(e)},setFluid(s){let e=this.save({fluid:s});this.apply(e)},getEffectiveMode(){let{mode:s}=this.load();return s!=="auto"?s:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:s,brand:e,borderStyle:t,iconSet:n,fluid:a}=this.load();return{mode:s,brand:e,borderStyle:t,iconSet:n,fluid:a,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(S)}catch{}this.apply(y)},_readCSSHint(s){return getComputedStyle(document.documentElement).getPropertyValue(s).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let{mode:e,brand:t}=this.load();e==="auto"&&window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:e,brand:t,effectiveMode:this.getEffectiveMode()}}))})}};var v=null;function L(){return"0.1.0"}function Q(){let s=document.querySelectorAll('script[src*="vanilla-breeze"]'),e="/cdn/sw.js";for(let t of s){let n=t.getAttribute("src");if(n){let a=n.lastIndexOf("/");if(a!==-1){e=n.slice(0,a)+"/sw.js";break}}}return e}function I(){return v||(v=navigator.serviceWorker?.ready??Promise.reject(new Error("SW not supported"))),v}function q(s){return new Promise((e,t)=>{navigator.serviceWorker?.controller?M(navigator.serviceWorker.controller,s,e,t):I().then(n=>{let a=n.active||n.waiting||n.installing;a?M(a,s,e,t):t(new Error("No active service worker"))}).catch(t)})}function M(s,e,t,n){let a=new MessageChannel;a.port1.onmessage=i=>t(i.data),a.port1.onmessageerror=()=>n(new Error("Message error")),s.postMessage({type:e},[a.port2]),setTimeout(()=>n(new Error("SW message timeout")),5e3)}async function B(){return q("GET_STATUS")}async function O(){return q("CLEAR_CACHE")}async function V(){let s=await I();return await s.update(),{updated:!!s.waiting}}function X(){return typeof window>"u"||!("serviceWorker"in navigator)?!1:window.__VB_SERVICE_WORKER?!0:document.querySelector('meta[name="vb-service-worker"]')?.content==="true"}if(X()){let s=Q();window.addEventListener("load",()=>{v=navigator.serviceWorker.register(s).catch(e=>{console.warn("[VB] Service worker registration failed:",e)})})}var g=null,E="vb-extensions",b={motionFx:!0,sounds:!1},D="vb-a11y-themes",H=[{id:"ocean",name:"Ocean",color:"#0891b2"},{id:"forest",name:"Forest",color:"#059669"},{id:"sunset",name:"Sunset",color:"#ea580c"},{id:"rose",name:"Rose",color:"#e11d48"},{id:"lavender",name:"Lavender",color:"#a855f7"},{id:"coral",name:"Coral",color:"#f97316"},{id:"slate",name:"Slate",color:"#64748b"},{id:"emerald",name:"Emerald",color:"#10b981"},{id:"amber",name:"Amber",color:"#f59e0b"},{id:"indigo",name:"Indigo",color:"#6366f1"}],U=new Set(H.map(s=>s.id)),k=class extends HTMLElement{#t;#e;#s=!1;connectedCallback(){this.#S(),this.#E(),this.#n(),window.addEventListener("theme-change",this.#a),window.addEventListener("extensions-change",this.#a),window.addEventListener("a11y-themes-change",this.#a)}disconnectedCallback(){window.removeEventListener("theme-change",this.#a),window.removeEventListener("extensions-change",this.#a),window.removeEventListener("a11y-themes-change",this.#a),document.removeEventListener("click",this.#p),document.removeEventListener("keydown",this.#g)}#l(e){return!e||e==="default"||U.has(e)?"default":e}#d(e){return U.has(e)?e:""}#u(e){return e!==""&&e!==void 0}#c(e){return e==="compact"?"compact":e==="spacious"?"spacious":"default"}#h(e,t){return e?t==="compact"?"compact":t==="spacious"?"spacious":"default":""}#S(){this.#t=this.querySelector(":scope > [data-trigger]")||this.querySelector(":scope > button"),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.setAttribute("aria-label","Site settings"),this.#t.className="settings-trigger",this.#t.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false"),this.#e=document.createElement("div"),this.#e.className="settings-panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Site settings");let e=`settings-panel-${crypto.randomUUID().slice(0,8)}`;this.#e.id=e,this.#t.setAttribute("aria-controls",e),this.#e.innerHTML=this.#x(),this.appendChild(this.#e)}#x(){let{mode:e,brand:t,fluid:n}=l.getState(),a=this.#l(t),i=this.#d(t),d=this.#i(),u=this.#o(),r=a==="default",o=this.#u(n),h=this.#c(n);return`
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
                  <input type="radio" name="settings-accent" value="" ${i===""?"checked":""} />
                  <span class="accent-dot" style="background: var(--color-interactive, #3b82f6)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                </label>
                ${H.map(c=>`
                  <label class="accent-swatch" title="${c.name}">
                    <input type="radio" name="settings-accent" value="${c.id}" ${i===c.id?"checked":""} />
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
              <input type="checkbox" name="a11y-high-contrast" data-switch="sm" data-a11y="a11y-high-contrast" ${d.includes("a11y-high-contrast")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Large Text</span>
              <input type="checkbox" name="a11y-large-text" data-switch="sm" data-a11y="a11y-large-text" ${d.includes("a11y-large-text")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Dyslexia-Friendly</span>
              <input type="checkbox" name="a11y-dyslexia" data-switch="sm" data-a11y="a11y-dyslexia" ${d.includes("a11y-dyslexia")?"checked":""} />
            </label>
          </div>
        </details>

        <!-- Layout -->
        <details name="settings">
          <summary>Layout</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Fluid Scaling</span>
              <input type="checkbox" name="fluid-scaling" data-switch="sm" data-fluid-toggle ${o?"checked":""} />
            </label>
            <div class="density-row" ${o?"":"hidden"}>
              <span class="settings-label">Density</span>
              <div class="segmented-control" role="radiogroup" aria-label="Density">
                ${["compact","default","spacious"].map(c=>`
                  <label class="segment">
                    <input type="radio" name="settings-density" value="${c}" ${h===c?"checked":""} />
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
              <input type="checkbox" name="ext-motionFx" data-switch="sm" data-ext="motionFx" ${u.motionFx?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Sound Effects</span>
              <input type="checkbox" name="ext-sounds" data-switch="sm" data-ext="sounds" ${u.sounds?"checked":""} />
            </label>
          </div>
        </details>

        <!-- System -->
        <details name="settings">
          <summary>System</summary>
          <div class="settings-section system-info">
            <p class="system-version">Vanilla Breeze <code>v${L()}</code></p>
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
    `}#E(){this.#t.addEventListener("click",this.#k),document.addEventListener("click",this.#p),document.addEventListener("keydown",this.#g),this.#e.querySelector(".settings-close")?.addEventListener("click",()=>this.close()),this.#e.querySelectorAll('input[name="settings-mode"]').forEach(e=>{e.addEventListener("change",this.#C)}),this.#e.querySelector("#settings-theme")?.addEventListener("change",this.#_),this.#e.querySelectorAll('input[name="settings-accent"]').forEach(e=>{e.addEventListener("change",this.#$)}),this.#e.querySelector("input[data-fluid-toggle]")?.addEventListener("change",this.#T),this.#e.querySelectorAll('input[name="settings-density"]').forEach(e=>{e.addEventListener("change",this.#A)}),this.#e.querySelectorAll("input[data-a11y]").forEach(e=>{e.addEventListener("change",this.#M)}),this.#e.querySelectorAll("input[data-ext]").forEach(e=>{e.addEventListener("change",this.#L)}),this.#e.querySelector(".settings-reset")?.addEventListener("click",this.#I),this.#e.querySelector('[data-action="clear-cache"]')?.addEventListener("click",this.#B),this.#e.querySelector('[data-action="check-update"]')?.addEventListener("click",this.#O),this.#w()}#k=e=>{e.stopPropagation(),this.toggle()};#p=e=>{this.#s&&!this.contains(e.target)&&this.close()};#g=e=>{e.key==="Escape"&&this.#s&&(e.preventDefault(),this.close(),this.#t?.focus())};#C=e=>{l.setMode(e.target.value)};#_=async e=>{let t=e.target;t.disabled=!0;try{let n=t.value;if(n==="default"){let i=this.#e.querySelector('input[name="settings-accent"]:checked')?.value||"";await l.setBrand(i||"default")}else await l.setBrand(n);this.#m(t.value==="default"),this.#v()}catch{console.warn("[VB] Theme load failed, using default")}finally{t.disabled=!1}};#$=async e=>{let t=e.target.value;try{await l.setBrand(t||"default")}catch{console.warn("[VB] Theme load failed")}this.#v()};#T=e=>{let t=e.target.checked,n=this.#c(l.getState().fluid)||"default";l.setFluid(this.#h(t,n)),this.#f(t)};#A=e=>{l.setFluid(this.#h(!0,e.target.value))};#M=e=>{let t=e.target.dataset.a11y,n=this.#i();if(e.target.checked&&!n.includes(t))n.push(t);else if(!e.target.checked){let a=n.indexOf(t);a!==-1&&n.splice(a,1)}this.#y(n),this.#r(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:n}))};#L=e=>{let t=e.target.dataset.ext,n=e.target.checked;this.#q(t,n),this.#b()};#I=()=>{if(confirm("Reset all settings to defaults?")){l.reset(),this.#y([]),this.#r(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:[]}));try{localStorage.removeItem(E)}catch{}this.#b(),this.#n()}};#a=()=>{this.#n()};#n(){let{mode:e,brand:t,fluid:n}=l.getState(),a=this.#l(t),i=this.#d(t),d=this.#i(),u=this.#o(),r=this.#u(n),o=this.#c(n),h=this.#e.querySelector(`input[name="settings-mode"][value="${e}"]`);h&&(h.checked=!0);let c=this.#e.querySelector("#settings-theme");c&&(c.value=a);let C=this.#e.querySelector(`input[name="settings-accent"][value="${i}"]`);C&&(C.checked=!0),this.#m(a==="default");let _=this.#e.querySelector("input[data-fluid-toggle]");_&&(_.checked=r);let $=this.#e.querySelector(`input[name="settings-density"][value="${o}"]`);$&&($.checked=!0),this.#f(r),this.#e.querySelectorAll("input[data-a11y]").forEach(p=>{p.checked=d.includes(p.dataset.a11y)}),this.#e.querySelectorAll("input[data-ext]").forEach(p=>{let N=u[p.dataset.ext];p.checked=N??b[p.dataset.ext]})}#m(e){let t=this.#e.querySelector(".accent-row");t&&(t.hidden=!e)}#f(e){let t=this.#e.querySelector(".density-row");t&&(t.hidden=!e)}#i(){try{let e=localStorage.getItem(D);return e?JSON.parse(e):[]}catch{return[]}}#y(e){try{localStorage.setItem(D,JSON.stringify(e))}catch{}}#r(){let e=this.#i(),{brand:t}=l.getState(),n=document.documentElement,a=t!=="default"?[t,...e]:[...e];a.length?n.dataset.theme=a.join(" "):delete n.dataset.theme}#v(){this.#r()}#o(){try{let e=localStorage.getItem(E);return e?{...b,...JSON.parse(e)}:{...b}}catch{return{...b}}}#q(e,t){try{let n=this.#o();n[e]=t,localStorage.setItem(E,JSON.stringify(n))}catch{}}async#b(){let e=this.#o(),t=document.documentElement;e.motionFx?delete t.dataset.motionReduced:t.dataset.motionReduced="",e.sounds?(g||(g=(await Promise.resolve().then(()=>(W(),P))).SoundManager),g.init(),g.enable()):g&&g.disable(),window.dispatchEvent(new CustomEvent("extensions-change",{detail:e}))}async#w(){let e=this.#e.querySelector("[data-sw-status] span");if(e){if(!("serviceWorker"in navigator)){e.textContent="Not supported";return}try{let n=(await B()).cachedURLs?.length??0;e.textContent=`Active (${n} cached files)`}catch{e.textContent="Not registered"}}}#B=async e=>{let t=e.target;t.disabled=!0,t.textContent="Clearing\u2026";try{await O(),t.textContent="Cleared!",this.#w(),setTimeout(()=>{t.textContent="Clear Cache",t.disabled=!1},2e3)}catch{t.textContent="Failed",setTimeout(()=>{t.textContent="Clear Cache",t.disabled=!1},2e3)}};#O=async e=>{let t=e.target;t.disabled=!0,t.textContent="Checking\u2026";try{let{updated:n}=await V();t.textContent=n?"Update available!":"Up to date",setTimeout(()=>{t.textContent="Check for Updates",t.disabled=!1},2e3)}catch{t.textContent="Failed",setTimeout(()=>{t.textContent="Check for Updates",t.disabled=!1},2e3)}};open(){this.#s||(this.#s=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),this.#n(),this.#V())}#V(){let e=this.getBoundingClientRect(),t=this.#e;t.style.removeProperty("top"),t.style.removeProperty("bottom"),t.style.removeProperty("left"),t.style.removeProperty("right");let n=t.getBoundingClientRect(),a=window.innerWidth,i=window.innerHeight,d=e.top,u=i-e.bottom;d<n.height&&u>d?(t.style.top="calc(100% + 8px)",t.style.bottom="auto"):(t.style.bottom="calc(100% + 8px)",t.style.top="auto");let r=a-e.right,o=e.left,h=n.width;e.right<h&&o<r?(t.style.left="0",t.style.right="auto"):(t.style.right="0",t.style.left="auto")}close(){this.#s&&(this.#s=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"))}toggle(){this.#s?this.close():this.open()}};customElements.define("settings-panel",k);export{k as SettingsPanel};
//# sourceMappingURL=settings-panel.js.map
