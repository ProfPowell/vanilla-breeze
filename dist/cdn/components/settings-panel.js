var g=new Map,m=null,T=null;function C(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(T)return T;if(typeof document<"u"){let t=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of t){let s=e.getAttribute("src");if(s){let n=s.lastIndexOf("/");if(n!==-1)return s.slice(0,n)}}}return"/cdn"}async function I(){if(m)return m;let t=C();try{let e=await fetch(`${t}/themes/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);m=await e.json()}catch{m={}}return m}var B=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia"]);async function b(t){if(!t||B.has(t))return;if(g.has(t))return g.get(t);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${t}"]`)){g.set(t,Promise.resolve());return}let e=F(t);return g.set(t,e),e}async function F(t){let e=C(),n=(await I())[t],a=n?n.file:`${t}.css`,i=`${e}/themes/${a}`;return new Promise((d,u)=>{let c=document.querySelector(`link[data-vb-theme-preload="${t}"]`);c&&c.remove();let o=document.createElement("link");o.rel="stylesheet",o.href=i,o.setAttribute("data-vb-theme",t),o.onload=()=>d(),o.onerror=()=>{o.remove(),g.delete(t),u(new Error(`Failed to load theme: ${t}`))},document.head.appendChild(o)})}var w="vb-theme",f={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:""},r={async init(){let t=this.load();try{await b(t.brand)}catch{t.brand="default"}return this.apply(t),this._watchSystemPreference(),t},load(){try{let t=localStorage.getItem(w);return t?{...f,...JSON.parse(t)}:{...f}}catch{return{...f}}},save(t){let s={...this.load(),...t};try{localStorage.setItem(w,JSON.stringify(s))}catch{}return s},apply({mode:t="auto",brand:e="default",borderStyle:s="",iconSet:n="",fluid:a=""}={}){let i=document.documentElement;t==="auto"?delete i.dataset.mode:i.dataset.mode=t;let u=(i.dataset.theme||"").split(" ").filter(l=>l.startsWith("a11y-")),c=e!=="default"?[e,...u]:[...u];c.length?i.dataset.theme=c.join(" "):delete i.dataset.theme;let o=s||this._readCSSHint("--theme-border-style");o&&o!=="clean"?i.dataset.borderStyle=o:delete i.dataset.borderStyle;let h=n||this._readCSSHint("--theme-icon-set");h&&h!=="lucide"?i.dataset.iconSet=h:delete i.dataset.iconSet,a?i.dataset.fluid=a:delete i.dataset.fluid,window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:t,brand:e,borderStyle:o,iconSet:h,fluid:a,effectiveMode:this.getEffectiveMode()}}))},setMode(t){let e=this.save({mode:t});this.apply(e)},async setBrand(t){try{await b(t)}catch(s){console.warn(`[VB] Theme "${t}" failed to load, using default`,s),t="default"}let e=this.save({brand:t});this.apply(e)},setBorderStyle(t){let e=this.save({borderStyle:t});this.apply(e)},setIconSet(t){let e=this.save({iconSet:t});this.apply(e)},setFluid(t){let e=this.save({fluid:t});this.apply(e)},getEffectiveMode(){let{mode:t}=this.load();return t!=="auto"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:t,brand:e,borderStyle:s,iconSet:n,fluid:a}=this.load();return{mode:t,brand:e,borderStyle:s,iconSet:n,fluid:a,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(w)}catch{}this.apply(f)},_readCSSHint(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let{mode:e,brand:s}=this.load();e==="auto"&&window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:e,brand:s,effectiveMode:this.getEffectiveMode()}}))})}};var A="vb-sound",S={enabled:!1,volume:.5},y={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let t=this._load();return this._enabled=t.enabled,this._volume=t.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let t=localStorage.getItem(A);return t?{...S,...JSON.parse(t)}:{...S}}catch{return{...S}}},_save(t){try{let e=this._load();localStorage.setItem(A,JSON.stringify({...e,...t}))}catch{}},_playTone(t,e,s="sine"){if(!this._enabled)return;let n=this._getContext(),a=n.createOscillator(),i=n.createGain();a.connect(i),i.connect(n.destination),a.frequency.value=t,a.type=s,i.gain.value=this._volume*.3,a.start(),i.gain.exponentialRampToValueAtTime(.01,n.currentTime+e),a.stop(n.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(t){this._volume=Math.max(0,Math.min(1,t)),this._save({volume:this._volume})},getVolume(){return this._volume},play(t){if(this._enabled)switch(t){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}};var E="vb-extensions",v={motionFx:!0,sounds:!1},M="vb-a11y-themes",q=[{id:"ocean",name:"Ocean",color:"#0891b2"},{id:"forest",name:"Forest",color:"#059669"},{id:"sunset",name:"Sunset",color:"#ea580c"},{id:"rose",name:"Rose",color:"#e11d48"},{id:"lavender",name:"Lavender",color:"#a855f7"},{id:"coral",name:"Coral",color:"#f97316"},{id:"slate",name:"Slate",color:"#64748b"},{id:"emerald",name:"Emerald",color:"#10b981"},{id:"amber",name:"Amber",color:"#f59e0b"},{id:"indigo",name:"Indigo",color:"#6366f1"}],L=new Set(q.map(t=>t.id)),x=class extends HTMLElement{#t;#e;#s=!1;connectedCallback(){this.#w(),this.#E(),this.#n(),window.addEventListener("theme-change",this.#a),window.addEventListener("extensions-change",this.#a),window.addEventListener("a11y-themes-change",this.#a)}disconnectedCallback(){window.removeEventListener("theme-change",this.#a),window.removeEventListener("extensions-change",this.#a),window.removeEventListener("a11y-themes-change",this.#a),document.removeEventListener("click",this.#p),document.removeEventListener("keydown",this.#m)}#r(e){return!e||e==="default"||L.has(e)?"default":e}#d(e){return L.has(e)?e:""}#u(e){return e!==""&&e!==void 0}#l(e){return e==="compact"?"compact":e==="spacious"?"spacious":"default"}#h(e,s){return e?s==="compact"?"compact":s==="spacious"?"spacious":"default":""}#w(){this.#t=this.querySelector(":scope > [data-trigger]")||this.querySelector(":scope > button"),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.setAttribute("aria-label","Site settings"),this.#t.className="settings-trigger",this.#t.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false"),this.#e=document.createElement("div"),this.#e.className="settings-panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Site settings");let e=`settings-panel-${crypto.randomUUID().slice(0,8)}`;this.#e.id=e,this.#t.setAttribute("aria-controls",e),this.#e.innerHTML=this.#S(),this.appendChild(this.#e)}#S(){let{mode:e,brand:s,fluid:n}=r.getState(),a=this.#r(s),i=this.#d(s),d=this.#i(),u=this.#o(),c=a==="default",o=this.#u(n),h=this.#l(n);return`
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
            <label class="settings-label">Color Mode</label>
            <div class="segmented-control" role="radiogroup" aria-label="Color mode">
              ${["auto","light","dark"].map(l=>`
                <label class="segment">
                  <input type="radio" name="settings-mode" value="${l}" ${e===l?"checked":""} />
                  <span>${l[0].toUpperCase()+l.slice(1)}</span>
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

            <div class="accent-row" ${c?"":"hidden"}>
              <label class="settings-label">Accent Color</label>
              <div class="accent-swatches" role="radiogroup" aria-label="Accent color">
                <label class="accent-swatch accent-swatch--none" title="None (default blue)">
                  <input type="radio" name="settings-accent" value="" ${i===""?"checked":""} />
                  <span class="accent-dot" style="background: var(--color-interactive, #3b82f6)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                </label>
                ${q.map(l=>`
                  <label class="accent-swatch" title="${l.name}">
                    <input type="radio" name="settings-accent" value="${l.id}" ${i===l.id?"checked":""} />
                    <span class="accent-dot" style="background: ${l.color}"></span>
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
              <input type="checkbox" data-switch="sm" data-a11y="a11y-high-contrast" ${d.includes("a11y-high-contrast")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Large Text</span>
              <input type="checkbox" data-switch="sm" data-a11y="a11y-large-text" ${d.includes("a11y-large-text")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Dyslexia-Friendly</span>
              <input type="checkbox" data-switch="sm" data-a11y="a11y-dyslexia" ${d.includes("a11y-dyslexia")?"checked":""} />
            </label>
          </div>
        </details>

        <!-- Layout -->
        <details name="settings">
          <summary>Layout</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Fluid Scaling</span>
              <input type="checkbox" data-switch="sm" data-fluid-toggle ${o?"checked":""} />
            </label>
            <div class="density-row" ${o?"":"hidden"}>
              <label class="settings-label">Density</label>
              <div class="segmented-control" role="radiogroup" aria-label="Density">
                ${["compact","default","spacious"].map(l=>`
                  <label class="segment">
                    <input type="radio" name="settings-density" value="${l}" ${h===l?"checked":""} />
                    <span>${l[0].toUpperCase()+l.slice(1)}</span>
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
              <input type="checkbox" data-switch="sm" data-ext="motionFx" ${u.motionFx?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Sound Effects</span>
              <input type="checkbox" data-switch="sm" data-ext="sounds" ${u.sounds?"checked":""} />
            </label>
          </div>
        </details>
      </div>

      <footer class="settings-footer">
        <button type="button" class="settings-reset">Reset to Defaults</button>
      </footer>
    `}#E(){this.#t.addEventListener("click",this.#x),document.addEventListener("click",this.#p),document.addEventListener("keydown",this.#m),this.#e.querySelector(".settings-close")?.addEventListener("click",()=>this.close()),this.#e.querySelectorAll('input[name="settings-mode"]').forEach(e=>{e.addEventListener("change",this.#k)}),this.#e.querySelector("#settings-theme")?.addEventListener("change",this.#$),this.#e.querySelectorAll('input[name="settings-accent"]').forEach(e=>{e.addEventListener("change",this.#_)}),this.#e.querySelector("input[data-fluid-toggle]")?.addEventListener("change",this.#T),this.#e.querySelectorAll('input[name="settings-density"]').forEach(e=>{e.addEventListener("change",this.#C)}),this.#e.querySelectorAll("input[data-a11y]").forEach(e=>{e.addEventListener("change",this.#A)}),this.#e.querySelectorAll("input[data-ext]").forEach(e=>{e.addEventListener("change",this.#M)}),this.#e.querySelector(".settings-reset")?.addEventListener("click",this.#L)}#x=e=>{e.stopPropagation(),this.toggle()};#p=e=>{this.#s&&!this.contains(e.target)&&this.close()};#m=e=>{e.key==="Escape"&&this.#s&&(e.preventDefault(),this.close(),this.#t?.focus())};#k=e=>{r.setMode(e.target.value)};#$=async e=>{let s=e.target;s.disabled=!0;try{let n=s.value;if(n==="default"){let i=this.#e.querySelector('input[name="settings-accent"]:checked')?.value||"";await r.setBrand(i||"default")}else await r.setBrand(n);this.#g(s.value==="default"),this.#v()}catch{console.warn("[VB] Theme load failed, using default")}finally{s.disabled=!1}};#_=async e=>{let s=e.target.value;try{await r.setBrand(s||"default")}catch{console.warn("[VB] Theme load failed")}this.#v()};#T=e=>{let s=e.target.checked,n=this.#l(r.getState().fluid)||"default";r.setFluid(this.#h(s,n)),this.#f(s)};#C=e=>{r.setFluid(this.#h(!0,e.target.value))};#A=e=>{let s=e.target.dataset.a11y,n=this.#i();if(e.target.checked&&!n.includes(s))n.push(s);else if(!e.target.checked){let a=n.indexOf(s);a!==-1&&n.splice(a,1)}this.#y(n),this.#c(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:n}))};#M=e=>{let s=e.target.dataset.ext,n=e.target.checked;this.#q(s,n),this.#b()};#L=()=>{if(confirm("Reset all settings to defaults?")){r.reset(),this.#y([]),this.#c(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:[]}));try{localStorage.removeItem(E)}catch{}this.#b(),this.#n()}};#a=()=>{this.#n()};#n(){let{mode:e,brand:s,fluid:n}=r.getState(),a=this.#r(s),i=this.#d(s),d=this.#i(),u=this.#o(),c=this.#u(n),o=this.#l(n),h=this.#e.querySelector(`input[name="settings-mode"][value="${e}"]`);h&&(h.checked=!0);let l=this.#e.querySelector("#settings-theme");l&&(l.value=a);let k=this.#e.querySelector(`input[name="settings-accent"][value="${i}"]`);k&&(k.checked=!0),this.#g(a==="default");let $=this.#e.querySelector("input[data-fluid-toggle]");$&&($.checked=c);let _=this.#e.querySelector(`input[name="settings-density"][value="${o}"]`);_&&(_.checked=!0),this.#f(c),this.#e.querySelectorAll("input[data-a11y]").forEach(p=>{p.checked=d.includes(p.dataset.a11y)}),this.#e.querySelectorAll("input[data-ext]").forEach(p=>{let O=u[p.dataset.ext];p.checked=O??v[p.dataset.ext]})}#g(e){let s=this.#e.querySelector(".accent-row");s&&(s.hidden=!e)}#f(e){let s=this.#e.querySelector(".density-row");s&&(s.hidden=!e)}#i(){try{let e=localStorage.getItem(M);return e?JSON.parse(e):[]}catch{return[]}}#y(e){try{localStorage.setItem(M,JSON.stringify(e))}catch{}}#c(){let e=this.#i(),{brand:s}=r.getState(),n=document.documentElement,a=s!=="default"?[s,...e]:[...e];a.length?n.dataset.theme=a.join(" "):delete n.dataset.theme}#v(){this.#c()}#o(){try{let e=localStorage.getItem(E);return e?{...v,...JSON.parse(e)}:{...v}}catch{return{...v}}}#q(e,s){try{let n=this.#o();n[e]=s,localStorage.setItem(E,JSON.stringify(n))}catch{}}#b(){let e=this.#o(),s=document.documentElement;e.motionFx?delete s.dataset.motionReduced:s.dataset.motionReduced="",e.sounds?(y.init(),y.enable()):y.disable(),window.dispatchEvent(new CustomEvent("extensions-change",{detail:e}))}open(){this.#s||(this.#s=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),this.#n(),this.#O())}#O(){let e=this.getBoundingClientRect(),s=this.#e;s.style.removeProperty("top"),s.style.removeProperty("bottom"),s.style.removeProperty("left"),s.style.removeProperty("right");let n=s.getBoundingClientRect(),a=window.innerWidth,i=window.innerHeight,d=e.top,u=i-e.bottom;d<n.height&&u>d?(s.style.top="calc(100% + 8px)",s.style.bottom="auto"):(s.style.bottom="calc(100% + 8px)",s.style.top="auto");let c=a-e.right,o=e.left,h=n.width;e.right<h&&o<c?(s.style.left="0",s.style.right="auto"):(s.style.right="0",s.style.left="auto")}close(){this.#s&&(this.#s=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"))}toggle(){this.#s?this.close():this.open()}};customElements.define("settings-panel",x);export{x as SettingsPanel};
