var me=Object.defineProperty;var fe=(t,e)=>()=>(t&&(e=t(t=0)),e);var ye=(t,e)=>{for(var s in e)me(t,s,{get:e[s],enumerable:!0})};var re={};ye(re,{SoundManager:()=>$e});var ie,D,$e,ce=fe(()=>{ie="vb-sound",D={enabled:!1,volume:.5},$e={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let t=this._load();return this._enabled=t.enabled,this._volume=t.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let t=localStorage.getItem(ie);return t?{...D,...JSON.parse(t)}:{...D}}catch{return{...D}}},_save(t){try{let e=this._load();localStorage.setItem(ie,JSON.stringify({...e,...t}))}catch{}},_playTone(t,e,s="sine"){if(!this._enabled)return;let a=this._getContext(),n=a.createOscillator(),i=a.createGain();n.connect(i),i.connect(a.destination),n.frequency.value=t,n.type=s,i.gain.value=this._volume*.3,n.start(),i.gain.exponentialRampToValueAtTime(.01,a.currentTime+e),n.stop(a.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(t){this._volume=Math.max(0,Math.min(1,t)),this._save({volume:this._volume})},getVolume(){return this._volume},play(t){if(this._enabled)switch(t){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var _=new Map,$=null,E=null,Q=null;function P(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(Q)return Q;if(typeof document<"u"){let t=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of t){let s=e.getAttribute("src");if(s){let a=s.lastIndexOf("/");if(a!==-1)return s.slice(0,a)}}}return"/cdn"}async function ve(){if($)return $;let t=P();try{let e=await fetch(`${t}/themes/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);$=await e.json()}catch{$={}}return $}var be=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia"]);async function M(t){if(!t||be.has(t))return;if(_.has(t))return _.get(t);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${t}"]`)){_.set(t,Promise.resolve());return}let e=we(t);return _.set(t,e),e}async function Se(){if(E)return E;let t=P();try{let e=await fetch(`${t}/packs/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);E=await e.json()}catch{try{let e=await fetch(`${t}/bundles/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);E=await e.json()}catch{E={}}}return E}async function we(t){let e=P();if((await Se())[t])return ke(t,e);let n=(await ve())[t],i=n?n.file:`${t}.css`,r=`${e}/themes/${i}`;return new Promise((h,m)=>{let p=document.querySelector(`link[data-vb-theme-preload="${t}"]`);p&&p.remove();let u=document.createElement("link");u.rel="stylesheet",u.href=r,u.setAttribute("data-vb-theme",t),u.onload=()=>h(),u.onerror=()=>{u.remove(),_.delete(t),m(new Error(`Failed to load theme: ${t}`))},document.head.appendChild(u)})}function ke(t,e){let s=`${e}/packs/${t}.full.css`,a=`${e}/packs/${t}.full.js`;return new Promise((n,i)=>{let r=document.createElement("link");r.rel="stylesheet",r.href=s,r.setAttribute("data-vb-theme",t),r.setAttribute("data-vb-pack",t),r.onload=()=>{import(a).catch(()=>{}),n()},r.onerror=()=>{r.remove(),_.delete(t),i(new Error(`Failed to load pack: ${t}`))},document.head.appendChild(r)})}var O="vb-theme",B={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},d={async init(){let t=this.load();try{await M(t.brand)}catch{t.brand="default"}return this.apply(t),this._watchSystemPreference(),t},load(){try{let t=localStorage.getItem(O);return t?{...B,...JSON.parse(t)}:{...B}}catch{return{...B}}},save(t){let s={...this.load(),...t};try{localStorage.setItem(O,JSON.stringify(s))}catch{}return s},apply({mode:t="auto",brand:e="default",borderStyle:s="",iconSet:a="",fluid:n="",backdrop:i="",backdropChrome:r="",pageBgType:h="",pageBgColor:m="",pageBgGradStart:p="",pageBgGradEnd:u="",pageBgGradDir:o=""}={}){let l=document.documentElement;t==="auto"?delete l.dataset.mode:l.dataset.mode=t;let b=(l.dataset.theme||"").split(" ").filter(g=>g.startsWith("a11y-")),S=e!=="default"?[e,...b]:[...b];S.length?l.dataset.theme=S.join(" "):delete l.dataset.theme;let y=s||this._readCSSHint("--theme-border-style");y&&y!=="clean"?l.dataset.borderStyle=y:delete l.dataset.borderStyle;let f=a||this._readCSSHint("--theme-icon-set");if(f&&f!=="lucide"?l.dataset.iconSet=f:delete l.dataset.iconSet,n?l.dataset.fluid=n:delete l.dataset.fluid,i?l.dataset.backdrop=i:delete l.dataset.backdrop,r&&r!=="card"?l.dataset.backdropChrome=r:delete l.dataset.backdropChrome,h==="color"&&m)l.style.setProperty("--page-bg-color",m),l.style.removeProperty("--page-bg-gradient");else if(h==="gradient"&&p&&u){let g=o||"to bottom";l.style.setProperty("--page-bg-gradient",`linear-gradient(${g}, ${p}, ${u})`),l.style.removeProperty("--page-bg-color")}else l.style.removeProperty("--page-bg-color"),l.style.removeProperty("--page-bg-gradient");window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:t,brand:e,borderStyle:y,iconSet:f,fluid:n,backdrop:i,backdropChrome:r,pageBgType:h,effectiveMode:this.getEffectiveMode()}}))},setMode(t){let e=this.save({mode:t});this.apply(e)},async setBrand(t){try{await M(t)}catch(s){console.warn(`[VB] Theme "${t}" failed to load, using default`,s),t="default"}let e=this.save({brand:t});this.apply(e)},setBorderStyle(t){let e=this.save({borderStyle:t});this.apply(e)},setIconSet(t){let e=this.save({iconSet:t});this.apply(e)},setFluid(t){let e=this.save({fluid:t});this.apply(e)},setBackdrop(t){let e=this.save({backdrop:t});this.apply(e)},setBackdropChrome(t){let e=this.save({backdropChrome:t});this.apply(e)},setPageBg({type:t="",color:e="",gradStart:s="",gradEnd:a="",gradDir:n=""}={}){let i=this.save({pageBgType:t,pageBgColor:e,pageBgGradStart:s,pageBgGradEnd:a,pageBgGradDir:n});this.apply(i)},getEffectiveMode(){let{mode:t}=this.load();return t!=="auto"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:t,brand:e,borderStyle:s,iconSet:a,fluid:n,backdrop:i,backdropChrome:r,pageBgType:h,pageBgColor:m,pageBgGradStart:p,pageBgGradEnd:u,pageBgGradDir:o}=this.load();return{mode:t,brand:e,borderStyle:s,iconSet:a,fluid:n,backdrop:i,backdropChrome:r,pageBgType:h,pageBgColor:m,pageBgGradStart:p,pageBgGradEnd:u,pageBgGradDir:o,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(O)}catch{}let t=document.documentElement;t.style.removeProperty("--page-bg-color"),t.style.removeProperty("--page-bg-gradient"),this.apply(B)},_readCSSHint(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let{mode:e,brand:s}=this.load();e==="auto"&&window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:e,brand:s,effectiveMode:this.getEffectiveMode()}}))})}};var X="vb-environment",L={timeOfDay:!1,seasonal:!1},Ee=900*1e3;function w(t,e,s){return t+(e-t)*Math.min(1,Math.max(0,s))}var C={_timer:null,_baseHues:null,_timeOverride:null,_monthOverride:null,init(){let t=this.load();(t.timeOfDay||t.seasonal)&&(this._captureBaseHues(),this._update(),this._startLoop()),window.addEventListener("theme-change",()=>{this._hasActiveSource()&&requestAnimationFrame(()=>{this._captureBaseHues(),this._update()})})},load(){try{let t=localStorage.getItem(X);return t?{...L,...JSON.parse(t)}:{...L}}catch{return{...L}}},save(t){try{localStorage.setItem(X,JSON.stringify(t))}catch{}return t},setTimeOverride(t){this._timeOverride=t,this._hasActiveSource()&&this._update()},setMonthOverride(t){this._monthOverride=t,this._hasActiveSource()&&this._update()},setSource(t,e){let s={...this.load(),[t]:e};this.save(s),e?(this._captureBaseHues(),this._update(),this._startLoop()):this._hasActiveSource(s)?this._update():(this._clearModifiers(),this._stopLoop())},_hasActiveSource(t){let e=t||this.load();return e.timeOfDay||e.seasonal},_captureBaseHues(){let t=document.documentElement;t.style.removeProperty("--hue-primary"),t.style.removeProperty("--hue-secondary"),t.style.removeProperty("--hue-accent");let e=t.getAttribute("data-theme");if(e){let s=`[data-theme~="${e}"]`;for(let a of document.styleSheets)try{for(let n of a.cssRules)if(n.selectorText?.includes(s)&&!n.selectorText.includes("dark")){let i=n.style?.getPropertyValue("--hue-primary");if(i){this._baseHues={primary:parseFloat(i)||260,secondary:parseFloat(n.style.getPropertyValue("--hue-secondary"))||200,accent:parseFloat(n.style.getPropertyValue("--hue-accent"))||30};return}}}catch{}}this._baseHues={primary:260,secondary:200,accent:30}},_update(){let t=this.load(),e=0;t.timeOfDay&&(e+=this._getTimeOfDayOffset()),t.seasonal&&(e+=this._getSeasonalOffset());let s=document.documentElement;e!==0&&this._baseHues?(s.style.setProperty("--hue-primary",String(this._baseHues.primary+e)),s.style.setProperty("--hue-secondary",String(this._baseHues.secondary+e)),s.style.setProperty("--hue-accent",String(this._baseHues.accent+e*.5))):e===0&&this._clearModifiers()},_clearModifiers(){let t=document.documentElement;t.style.removeProperty("--hue-primary"),t.style.removeProperty("--hue-secondary"),t.style.removeProperty("--hue-accent")},_getTimeOfDayOffset(){let t=this._timeOverride??new Date().getHours()+new Date().getMinutes()/60;return t<5?-20:t<7?w(-20,20,(t-5)/2):t<10?w(20,5,(t-7)/3):t<14?w(5,0,(t-10)/4):t<17?w(0,-5,(t-14)/3):t<19?w(-5,15,(t-17)/2):t<21?w(15,-10,(t-19)/2):w(-10,-20,(t-21)/8)},_getHemisphere(){return window.__VB_ENV_LOCATION?.hemisphere||"north"},_getSeasonalOffset(){let t=this._monthOverride??new Date().getMonth(),s=this._getHemisphere()==="south"?(t+6)%12:t;return s>=2&&s<=4?5:s>=5&&s<=7?10:s>=8&&s<=10?-5:-10},_startLoop(){this._timer||(this._timer=setInterval(()=>this._update(),Ee))},_stopLoop(){clearInterval(this._timer),this._timer=null}};var A=null;function ee(){return"0.1.0"}function _e(){let t=document.querySelectorAll('script[src*="vanilla-breeze"]'),e="/cdn/sw.js";for(let s of t){let a=s.getAttribute("src");if(a){let n=a.lastIndexOf("/");if(n!==-1){e=a.slice(0,n)+"/sw.js";break}}}return e}function te(){return A||(A=navigator.serviceWorker?.ready??Promise.reject(new Error("SW not supported"))),A}function se(t){return new Promise((e,s)=>{navigator.serviceWorker?.controller?Z(navigator.serviceWorker.controller,t,e,s):te().then(a=>{let n=a.active||a.waiting||a.installing;n?Z(n,t,e,s):s(new Error("No active service worker"))}).catch(s)})}function Z(t,e,s,a){let n=new MessageChannel;n.port1.onmessage=i=>s(i.data),n.port1.onmessageerror=()=>a(new Error("Message error")),t.postMessage({type:e},[n.port2]),setTimeout(()=>a(new Error("SW message timeout")),5e3)}async function ae(){return se("GET_STATUS")}async function ne(){return se("CLEAR_CACHE")}async function oe(){let t=await te();return await t.update(),{updated:!!t.waiting}}function xe(){return typeof window>"u"||!("serviceWorker"in navigator)?!1:window.__VB_SERVICE_WORKER?!0:document.querySelector('meta[name="vb-service-worker"]')?.content==="true"}if(xe()){let t=_e();window.addEventListener("load",()=>{A=navigator.serviceWorker.register(t).catch(e=>{console.warn("[VB] Service worker registration failed:",e)})})}var x=null,I="vb-extensions",q={motionFx:!0,sounds:!1},le="vb-a11y-themes",ue=[{id:"ocean",name:"Ocean",color:"#0891b2"},{id:"forest",name:"Forest",color:"#059669"},{id:"sunset",name:"Sunset",color:"#ea580c"},{id:"rose",name:"Rose",color:"#e11d48"},{id:"lavender",name:"Lavender",color:"#a855f7"},{id:"coral",name:"Coral",color:"#f97316"},{id:"slate",name:"Slate",color:"#64748b"},{id:"emerald",name:"Emerald",color:"#10b981"},{id:"amber",name:"Amber",color:"#f59e0b"},{id:"indigo",name:"Indigo",color:"#6366f1"}],de=new Set(ue.map(t=>t.id)),V=class extends HTMLElement{#t;#e;#s=!1;connectedCallback(){this.#q(),this.#M(),this.#o(),window.addEventListener("theme-change",this.#a),window.addEventListener("extensions-change",this.#a),window.addEventListener("a11y-themes-change",this.#a)}disconnectedCallback(){window.removeEventListener("theme-change",this.#a),window.removeEventListener("extensions-change",this.#a),window.removeEventListener("a11y-themes-change",this.#a),document.removeEventListener("click",this.#k),document.removeEventListener("keydown",this.#E)}#m(e){return!e||e==="default"||de.has(e)?"default":e}#f(e){return de.has(e)?e:""}#y(e){return e!==""&&e!==void 0}#c(e){return e==="compact"?"compact":e==="spacious"?"spacious":"default"}#v(e,s){return e?s==="compact"?"compact":s==="spacious"?"spacious":"default":""}#b(e){return e!==""&&e!==void 0}#l(e){return e==="flush"?"flush":e==="elevated"?"elevated":"default"}#S(e,s){return e?s==="flush"?"flush":s==="elevated"?"elevated":"default":""}#d(e){if(!e)return"card";let s=e.split(/\s+/);for(let a of s)if(a==="stretch"||a==="integrated")return a;return"card"}#u(e){return e?e.split(/\s+/).includes("fixed"):!1}#w(e,s){let a=[];return e&&e!=="card"&&a.push(e),s&&a.push("fixed"),a.join(" ")||"card"}#q(){this.#t=this.querySelector(":scope > [data-trigger]")||this.querySelector(":scope > button"),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.setAttribute("aria-label","Site settings"),this.#t.className="settings-trigger",this.#t.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false"),this.#e=document.createElement("div"),this.#e.className="settings-panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Site settings");let e=`settings-panel-${crypto.randomUUID().slice(0,8)}`;this.#e.id=e,this.#t.setAttribute("aria-controls",e),this.#e.innerHTML=this.#P(),this.appendChild(this.#e)}#P(){let{mode:e,brand:s,fluid:a,backdrop:n,backdropChrome:i,pageBgType:r,pageBgColor:h,pageBgGradStart:m,pageBgGradEnd:p,pageBgGradDir:u}=d.getState(),o=this.#m(s),l=this.#f(s),k=this.#i(),b=this.#r(),S=o==="default",y=this.#y(a),f=this.#c(a),g=this.#b(n),T=this.#l(n);return`
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
                <option value="default" ${o==="default"?"selected":""}>Default</option>
              </optgroup>
              <optgroup label="Personality">
                <option value="modern" ${o==="modern"?"selected":""}>Modern</option>
                <option value="minimal" ${o==="minimal"?"selected":""}>Minimal</option>
                <option value="classic" ${o==="classic"?"selected":""}>Classic</option>
              </optgroup>
              <optgroup label="Extreme">
                <option value="swiss" ${o==="swiss"?"selected":""}>Swiss</option>
                <option value="brutalist" ${o==="brutalist"?"selected":""}>Brutalist</option>
                <option value="cyber" ${o==="cyber"?"selected":""}>Cyber</option>
                <option value="terminal" ${o==="terminal"?"selected":""}>Terminal</option>
                <option value="organic" ${o==="organic"?"selected":""}>Organic</option>
                <option value="editorial" ${o==="editorial"?"selected":""}>Editorial</option>
                <option value="8bit" ${o==="8bit"?"selected":""}>8-Bit</option>
                <option value="nes" ${o==="nes"?"selected":""}>NES</option>
                <option value="win9x" ${o==="win9x"?"selected":""}>Win9x</option>
                <option value="rough" ${o==="rough"?"selected":""}>Rough</option>
                <option value="nord" ${o==="nord"?"selected":""}>Nord</option>
                <option value="solarized" ${o==="solarized"?"selected":""}>Solarized</option>
                <option value="dracula" ${o==="dracula"?"selected":""}>Dracula</option>
                <option value="catppuccin-mocha" ${o==="catppuccin-mocha"?"selected":""}>Catppuccin Mocha</option>
                <option value="glassmorphism" ${o==="glassmorphism"?"selected":""}>Glassmorphism</option>
                <option value="art-deco" ${o==="art-deco"?"selected":""}>Art Deco</option>
                <option value="genai" ${o==="genai"?"selected":""}>GenAI</option>
                <option value="gruvbox" ${o==="gruvbox"?"selected":""}>Gruvbox</option>
                <option value="tokyo-night" ${o==="tokyo-night"?"selected":""}>Tokyo Night</option>
                <option value="rose-pine" ${o==="rose-pine"?"selected":""}>Ros\xE9 Pine</option>
                <option value="vaporwave" ${o==="vaporwave"?"selected":""}>Vaporwave</option>
                <option value="neumorphism" ${o==="neumorphism"?"selected":""}>Neumorphism</option>
                <option value="catppuccin-latte" ${o==="catppuccin-latte"?"selected":""}>Catppuccin Latte</option>
                <option value="catppuccin-frappe" ${o==="catppuccin-frappe"?"selected":""}>Catppuccin Frapp\xE9</option>
                <option value="catppuccin-macchiato" ${o==="catppuccin-macchiato"?"selected":""}>Catppuccin Macchiato</option>
                <option value="bauhaus" ${o==="bauhaus"?"selected":""}>Bauhaus</option>
                <option value="memphis" ${o==="memphis"?"selected":""}>Memphis</option>
                <option value="cottagecore" ${o==="cottagecore"?"selected":""}>Cottagecore</option>
                <option value="claymorphism" ${o==="claymorphism"?"selected":""}>Claymorphism</option>
                <option value="clinical" ${o==="clinical"?"selected":""}>Clinical</option>
                <option value="financial" ${o==="financial"?"selected":""}>Financial</option>
                <option value="government" ${o==="government"?"selected":""}>Government</option>
                <option value="startup" ${o==="startup"?"selected":""}>Startup</option>
                <option value="dawn" ${o==="dawn"?"selected":""}>Dawn</option>
                <option value="dusk" ${o==="dusk"?"selected":""}>Dusk</option>
                <option value="midnight" ${o==="midnight"?"selected":""}>Midnight</option>
                <option value="high-noon" ${o==="high-noon"?"selected":""}>High Noon</option>
              </optgroup>
              <optgroup label="Packs">
                <option value="kawaii" ${o==="kawaii"?"selected":""}>Kawaii</option>
                <option value="retro" ${o==="retro"?"selected":""}>Retro</option>
              </optgroup>
            </select>

            <div class="accent-row" ${S?"":"hidden"}>
              <span class="settings-label">Accent Color</span>
              <div class="accent-swatches" role="radiogroup" aria-label="Accent color">
                <label class="accent-swatch accent-swatch--none" title="None (default blue)">
                  <input type="radio" name="settings-accent" value="" ${l===""?"checked":""} />
                  <span class="accent-dot" style="background: var(--color-interactive, #3b82f6)">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                </label>
                ${ue.map(c=>`
                  <label class="accent-swatch" title="${c.name}">
                    <input type="radio" name="settings-accent" value="${c.id}" ${l===c.id?"checked":""} />
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
              <input type="checkbox" name="a11y-high-contrast" data-switch="sm" data-a11y="a11y-high-contrast" ${k.includes("a11y-high-contrast")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Large Text</span>
              <input type="checkbox" name="a11y-large-text" data-switch="sm" data-a11y="a11y-large-text" ${k.includes("a11y-large-text")?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Dyslexia-Friendly</span>
              <input type="checkbox" name="a11y-dyslexia" data-switch="sm" data-a11y="a11y-dyslexia" ${k.includes("a11y-dyslexia")?"checked":""} />
            </label>
          </div>
        </details>

        <!-- Layout -->
        <details name="settings">
          <summary>Layout</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Fluid Scaling</span>
              <input type="checkbox" name="fluid-scaling" data-switch="sm" data-fluid-toggle ${y?"checked":""} />
            </label>
            <div class="density-row" ${y?"":"hidden"}>
              <span class="settings-label">Density</span>
              <div class="segmented-control" role="radiogroup" aria-label="Density">
                ${["compact","default","spacious"].map(c=>`
                  <label class="segment">
                    <input type="radio" name="settings-density" value="${c}" ${f===c?"checked":""} />
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
                    <input type="radio" name="settings-backdrop" value="${c}" ${T===c?"checked":""} />
                    <span>${c[0].toUpperCase()+c.slice(1)}</span>
                  </label>
                `).join("")}
              </div>
            </div>
            <div class="backdrop-row" ${g?"":"hidden"}>
              <span class="settings-label">Chrome</span>
              <div class="segmented-control" role="radiogroup" aria-label="Backdrop chrome mode">
                ${["card","stretch","integrated"].map(c=>`
                  <label class="segment">
                    <input type="radio" name="settings-backdrop-chrome" value="${c}" ${this.#d(i)===c?"checked":""} />
                    <span>${c[0].toUpperCase()+c.slice(1)}</span>
                  </label>
                `).join("")}
              </div>
            </div>
            <div class="backdrop-row" ${g?"":"hidden"}>
              <label class="toggle-row">
                <span>Fixed Header</span>
                <input type="checkbox" name="settings-backdrop-fixed" data-switch="sm" data-backdrop-fixed ${this.#u(i)?"checked":""} />
              </label>
            </div>
            <div class="backdrop-row" ${g?"":"hidden"}>
              <label class="settings-label" for="settings-page-bg">Page Background</label>
              <select id="settings-page-bg" name="settings-page-bg">
                <option value="" ${r===""?"selected":""}>Theme Default</option>
                <option value="color" ${r==="color"?"selected":""}>Solid Color</option>
                <option value="gradient" ${r==="gradient"?"selected":""}>Gradient</option>
              </select>
            </div>
            <div class="page-bg-color-row backdrop-row" ${r==="color"&&g?"":"hidden"}>
              <span class="settings-label">Color</span>
              <input type="color" name="settings-page-bg-color" value="${h||"#1a1a2e"}" />
            </div>
            <div class="page-bg-grad-row backdrop-row" ${r==="gradient"&&g?"":"hidden"}>
              <span class="settings-label">Start</span>
              <input type="color" name="settings-page-bg-grad-start" value="${m||"#1a1a2e"}" />
              <span class="settings-label">End</span>
              <input type="color" name="settings-page-bg-grad-end" value="${p||"#16213e"}" />
            </div>
            <div class="page-bg-grad-dir-row backdrop-row" ${r==="gradient"&&g?"":"hidden"}>
              <span class="settings-label">Direction</span>
              <select name="settings-page-bg-grad-dir">
                <option value="to bottom" ${(u||"to bottom")==="to bottom"?"selected":""}>Top \u2192 Bottom</option>
                <option value="to right" ${u==="to right"?"selected":""}>Left \u2192 Right</option>
                <option value="135deg" ${u==="135deg"?"selected":""}>Diagonal \u2198</option>
                <option value="45deg" ${u==="45deg"?"selected":""}>Diagonal \u2197</option>
              </select>
            </div>
          </div>
        </details>

        <!-- Effects -->
        <details name="settings">
          <summary>Effects</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Motion Effects</span>
              <input type="checkbox" name="ext-motionFx" data-switch="sm" data-ext="motionFx" ${b.motionFx?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Sound Effects</span>
              <input type="checkbox" name="ext-sounds" data-switch="sm" data-ext="sounds" ${b.sounds?"checked":""} />
            </label>
          </div>
        </details>

        <!-- Environment -->
        <details name="settings">
          <summary>Environment</summary>
          <div class="settings-section">
            <label class="toggle-row">
              <span>Time-of-Day Shifts</span>
              <input type="checkbox" name="env-timeOfDay" data-switch="sm" data-env="timeOfDay" ${this.#g().timeOfDay?"checked":""} />
            </label>
            <label class="toggle-row">
              <span>Seasonal Tinting</span>
              <input type="checkbox" name="env-seasonal" data-switch="sm" data-env="seasonal" ${this.#g().seasonal?"checked":""} />
            </label>
          </div>
        </details>

        <!-- System -->
        <details name="settings">
          <summary>System</summary>
          <div class="settings-section system-info">
            <p class="system-version">Vanilla Breeze <code>v${ee()}</code></p>
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
    `}#M(){this.#t.addEventListener("click",this.#O),document.addEventListener("click",this.#k),document.addEventListener("keydown",this.#E),this.#e.querySelector(".settings-close")?.addEventListener("click",()=>this.close()),this.#e.querySelectorAll('input[name="settings-mode"]').forEach(e=>{e.addEventListener("change",this.#L)}),this.#e.querySelector("#settings-theme")?.addEventListener("change",this.#D),this.#e.querySelectorAll('input[name="settings-accent"]').forEach(e=>{e.addEventListener("change",this.#I)}),this.#e.querySelector("input[data-fluid-toggle]")?.addEventListener("change",this.#V),this.#e.querySelectorAll('input[name="settings-density"]').forEach(e=>{e.addEventListener("change",this.#H)}),this.#e.querySelector("input[data-backdrop-toggle]")?.addEventListener("change",this.#F),this.#e.querySelectorAll('input[name="settings-backdrop"]').forEach(e=>{e.addEventListener("change",this.#R)}),this.#e.querySelectorAll('input[name="settings-backdrop-chrome"]').forEach(e=>{e.addEventListener("change",this.#G)}),this.#e.querySelector("input[data-backdrop-fixed]")?.addEventListener("change",this.#W),this.#e.querySelector('[name="settings-page-bg"]')?.addEventListener("change",this.#U),this.#e.querySelector('[name="settings-page-bg-color"]')?.addEventListener("input",this.#n),this.#e.querySelector('[name="settings-page-bg-grad-start"]')?.addEventListener("input",this.#n),this.#e.querySelector('[name="settings-page-bg-grad-end"]')?.addEventListener("input",this.#n),this.#e.querySelector('[name="settings-page-bg-grad-dir"]')?.addEventListener("change",this.#n),this.#e.querySelectorAll("input[data-a11y]").forEach(e=>{e.addEventListener("change",this.#j)}),this.#e.querySelectorAll("input[data-ext]").forEach(e=>{e.addEventListener("change",this.#N)}),this.#e.querySelectorAll("input[data-env]").forEach(e=>{e.addEventListener("change",this.#z)}),this.#e.querySelector(".settings-reset")?.addEventListener("click",this.#J),this.#e.querySelector('[data-action="clear-cache"]')?.addEventListener("click",this.#Y),this.#e.querySelector('[data-action="check-update"]')?.addEventListener("click",this.#Q),this.#A()}#O=e=>{e.stopPropagation(),this.toggle()};#k=e=>{this.#s&&!this.contains(e.target)&&this.close()};#E=e=>{e.key==="Escape"&&this.#s&&(e.preventDefault(),this.close(),this.#t?.focus())};#L=e=>{d.setMode(e.target.value)};#D=async e=>{let s=e.target;s.disabled=!0;try{let a=s.value;if(a==="default"){let i=this.#e.querySelector('input[name="settings-accent"]:checked')?.value||"";await d.setBrand(i||"default")}else await d.setBrand(a);this.#_(s.value==="default"),this.#T()}catch{console.warn("[VB] Theme load failed, using default")}finally{s.disabled=!1}};#I=async e=>{let s=e.target.value;try{await d.setBrand(s||"default")}catch{console.warn("[VB] Theme load failed")}this.#T()};#V=e=>{let s=e.target.checked,a=this.#c(d.getState().fluid)||"default";d.setFluid(this.#v(s,a)),this.#x(s)};#H=e=>{d.setFluid(this.#v(!0,e.target.value))};#F=e=>{let s=e.target.checked,a=this.#l(d.getState().backdrop)||"default";d.setBackdrop(this.#S(s,a)),this.#$(s)};#R=e=>{d.setBackdrop(this.#S(!0,e.target.value))};#G=e=>{let s=this.#u(d.getState().backdropChrome);d.setBackdropChrome(this.#w(e.target.value,s))};#W=e=>{let s=this.#d(d.getState().backdropChrome);d.setBackdropChrome(this.#w(s,e.target.checked))};#U=e=>{let s=e.target.value;if(this.#h(s),s==="color"){let a=this.#e.querySelector('[name="settings-page-bg-color"]')?.value||"#1a1a2e";d.setPageBg({type:s,color:a})}else if(s==="gradient"){let a=this.#e.querySelector('[name="settings-page-bg-grad-start"]')?.value||"#1a1a2e",n=this.#e.querySelector('[name="settings-page-bg-grad-end"]')?.value||"#16213e",i=this.#e.querySelector('[name="settings-page-bg-grad-dir"]')?.value||"to bottom";d.setPageBg({type:s,gradStart:a,gradEnd:n,gradDir:i})}else d.setPageBg({})};#n=()=>{let e=this.#e.querySelector('[name="settings-page-bg"]')?.value||"";if(e==="color"){let s=this.#e.querySelector('[name="settings-page-bg-color"]')?.value||"";d.setPageBg({type:e,color:s})}else if(e==="gradient"){let s=this.#e.querySelector('[name="settings-page-bg-grad-start"]')?.value||"",a=this.#e.querySelector('[name="settings-page-bg-grad-end"]')?.value||"",n=this.#e.querySelector('[name="settings-page-bg-grad-dir"]')?.value||"to bottom";d.setPageBg({type:e,gradStart:s,gradEnd:a,gradDir:n})}};#j=e=>{let s=e.target.dataset.a11y,a=this.#i();if(e.target.checked&&!a.includes(s))a.push(s);else if(!e.target.checked){let n=a.indexOf(s);n!==-1&&a.splice(n,1)}this.#C(a),this.#p(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:a}))};#N=e=>{let s=e.target.dataset.ext,a=e.target.checked;this.#K(s,a),this.#B()};#z=e=>{let s=e.target.dataset.env,a=e.target.checked;C.setSource(s,a)};#J=()=>{if(confirm("Reset all settings to defaults?")){d.reset(),this.#C([]),this.#p(),window.dispatchEvent(new CustomEvent("a11y-themes-change",{detail:[]}));try{localStorage.removeItem(I)}catch{}this.#B(),C.setSource("timeOfDay",!1),C.setSource("seasonal",!1),this.#o()}};#a=()=>{this.#o()};#o(){let{mode:e,brand:s,fluid:a,backdrop:n,backdropChrome:i,pageBgType:r,pageBgColor:h,pageBgGradStart:m,pageBgGradEnd:p,pageBgGradDir:u}=d.getState(),o=this.#m(s),l=this.#f(s),k=this.#i(),b=this.#r(),S=this.#y(a),y=this.#c(a),f=this.#b(n),g=this.#l(n),T=this.#e.querySelector(`input[name="settings-mode"][value="${e}"]`);T&&(T.checked=!0);let c=this.#e.querySelector("#settings-theme");c&&(c.value=o);let H=this.#e.querySelector(`input[name="settings-accent"][value="${l}"]`);H&&(H.checked=!0),this.#_(o==="default");let F=this.#e.querySelector("input[data-fluid-toggle]");F&&(F.checked=S);let R=this.#e.querySelector(`input[name="settings-density"][value="${y}"]`);R&&(R.checked=!0),this.#x(S);let G=this.#e.querySelector("input[data-backdrop-toggle]");G&&(G.checked=f);let W=this.#e.querySelector(`input[name="settings-backdrop"][value="${g}"]`);W&&(W.checked=!0);let he=this.#d(i),U=this.#e.querySelector(`input[name="settings-backdrop-chrome"][value="${he}"]`);U&&(U.checked=!0);let j=this.#e.querySelector("input[data-backdrop-fixed]");j&&(j.checked=this.#u(i)),this.#$(f);let N=this.#e.querySelector('[name="settings-page-bg"]');N&&(N.value=r||"");let z=this.#e.querySelector('[name="settings-page-bg-color"]');z&&h&&(z.value=h);let J=this.#e.querySelector('[name="settings-page-bg-grad-start"]');J&&m&&(J.value=m);let K=this.#e.querySelector('[name="settings-page-bg-grad-end"]');K&&p&&(K.value=p);let Y=this.#e.querySelector('[name="settings-page-bg-grad-dir"]');Y&&u&&(Y.value=u),f&&this.#h(r||""),this.#e.querySelectorAll("input[data-a11y]").forEach(v=>{v.checked=k.includes(v.dataset.a11y)}),this.#e.querySelectorAll("input[data-ext]").forEach(v=>{let ge=b[v.dataset.ext];v.checked=ge??q[v.dataset.ext]});let pe=this.#g();this.#e.querySelectorAll("input[data-env]").forEach(v=>{v.checked=pe[v.dataset.env]??!1})}#_(e){let s=this.#e.querySelector(".accent-row");s&&(s.hidden=!e)}#x(e){let s=this.#e.querySelector(".density-row");s&&(s.hidden=!e)}#$(e){if(this.#e.querySelectorAll(".backdrop-row").forEach(s=>{s.hidden=!e}),e){let s=this.#e.querySelector('[name="settings-page-bg"]')?.value||"";this.#h(s)}}#h(e){let s=this.#e.querySelector(".page-bg-color-row"),a=this.#e.querySelector(".page-bg-grad-row"),n=this.#e.querySelector(".page-bg-grad-dir-row");s&&(s.hidden=e!=="color"),a&&(a.hidden=e!=="gradient"),n&&(n.hidden=e!=="gradient")}#i(){try{let e=localStorage.getItem(le);return e?JSON.parse(e):[]}catch{return[]}}#C(e){try{localStorage.setItem(le,JSON.stringify(e))}catch{}}#p(){let e=this.#i(),{brand:s}=d.getState(),a=document.documentElement,n=s!=="default"?[s,...e]:[...e];n.length?a.dataset.theme=n.join(" "):delete a.dataset.theme}#T(){this.#p()}#g(){return C.load()}#r(){try{let e=localStorage.getItem(I);return e?{...q,...JSON.parse(e)}:{...q}}catch{return{...q}}}#K(e,s){try{let a=this.#r();a[e]=s,localStorage.setItem(I,JSON.stringify(a))}catch{}}async#B(){let e=this.#r(),s=document.documentElement;e.motionFx?delete s.dataset.motionReduced:s.dataset.motionReduced="",e.sounds?(x||(x=(await Promise.resolve().then(()=>(ce(),re))).SoundManager),x.init(),x.enable()):x&&x.disable(),window.dispatchEvent(new CustomEvent("extensions-change",{detail:e}))}async#A(){let e=this.#e.querySelector("[data-sw-status] span");if(e){if(!("serviceWorker"in navigator)){e.textContent="Not supported";return}try{let a=(await ae()).cachedURLs?.length??0;e.textContent=`Active (${a} cached files)`}catch{e.textContent="Not registered"}}}#Y=async e=>{let s=e.target;s.disabled=!0,s.textContent="Clearing\u2026";try{await ne(),s.textContent="Cleared!",this.#A(),setTimeout(()=>{s.textContent="Clear Cache",s.disabled=!1},2e3)}catch{s.textContent="Failed",setTimeout(()=>{s.textContent="Clear Cache",s.disabled=!1},2e3)}};#Q=async e=>{let s=e.target;s.disabled=!0,s.textContent="Checking\u2026";try{let{updated:a}=await oe();s.textContent=a?"Update available!":"Up to date",setTimeout(()=>{s.textContent="Check for Updates",s.disabled=!1},2e3)}catch{s.textContent="Failed",setTimeout(()=>{s.textContent="Check for Updates",s.disabled=!1},2e3)}};open(){this.#s||(this.#s=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),this.#o(),this.#X())}#X(){let e=this.getBoundingClientRect(),s=this.#e;s.style.removeProperty("top"),s.style.removeProperty("bottom"),s.style.removeProperty("left"),s.style.removeProperty("right");let a=s.getBoundingClientRect(),n=window.innerWidth,i=window.innerHeight,r=e.top,h=i-e.bottom;r<a.height&&h>r?(s.style.top="calc(100% + 8px)",s.style.bottom="auto"):(s.style.bottom="calc(100% + 8px)",s.style.top="auto");let m=n-e.right,p=e.left,u=a.width;e.right<u&&p<m?(s.style.left="0",s.style.right="auto"):(s.style.right="0",s.style.left="auto")}close(){this.#s&&(this.#s=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"))}toggle(){this.#s?this.close():this.open()}};customElements.define("settings-panel",V);export{V as SettingsPanel};
//# sourceMappingURL=settings-panel.js.map
