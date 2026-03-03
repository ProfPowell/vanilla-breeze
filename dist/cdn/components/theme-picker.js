var $=Object.defineProperty;var M=(t,e)=>()=>(t&&(e=t(t=0)),e);var I=(t,e)=>{for(var a in e)$(t,a,{get:e[a],enumerable:!0})};var k={};I(k,{SoundManager:()=>R});var x,E,R,F=M(()=>{x="vb-sound",E={enabled:!1,volume:.5},R={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let t=this._load();return this._enabled=t.enabled,this._volume=t.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let t=localStorage.getItem(x);return t?{...E,...JSON.parse(t)}:{...E}}catch{return{...E}}},_save(t){try{let e=this._load();localStorage.setItem(x,JSON.stringify({...e,...t}))}catch{}},_playTone(t,e,a="sine"){if(!this._enabled)return;let s=this._getContext(),n=s.createOscillator(),i=s.createGain();n.connect(i),i.connect(s.destination),n.frequency.value=t,n.type=a,i.gain.value=this._volume*.3,n.start(),i.gain.exponentialRampToValueAtTime(.01,s.currentTime+e),n.stop(s.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(t){this._volume=Math.max(0,Math.min(1,t)),this._save({volume:this._volume})},getVolume(){return this._volume},play(t){if(this._enabled)switch(t){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var f=new Map,p=null,B=null;function T(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(B)return B;if(typeof document<"u"){let t=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of t){let a=e.getAttribute("src");if(a){let s=a.lastIndexOf("/");if(s!==-1)return a.slice(0,s)}}}return"/cdn"}async function L(){if(p)return p;let t=T();try{let e=await fetch(`${t}/themes/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);p=await e.json()}catch{p={}}return p}var D=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia"]);async function y(t){if(!t||D.has(t))return;if(f.has(t))return f.get(t);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${t}"]`)){f.set(t,Promise.resolve());return}let e=O(t);return f.set(t,e),e}async function O(t){let e=T(),s=(await L())[t],n=s?s.file:`${t}.css`,i=`${e}/themes/${n}`;return new Promise((c,o)=>{let d=document.querySelector(`link[data-vb-theme-preload="${t}"]`);d&&d.remove();let r=document.createElement("link");r.rel="stylesheet",r.href=i,r.setAttribute("data-vb-theme",t),r.onload=()=>c(),r.onerror=()=>{r.remove(),f.delete(t),o(new Error(`Failed to load theme: ${t}`))},document.head.appendChild(r)})}var v="vb-theme",w={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:""},u={async init(){let t=this.load();try{await y(t.brand)}catch{t.brand="default"}return this.apply(t),this._watchSystemPreference(),t},load(){try{let t=localStorage.getItem(v);return t?{...w,...JSON.parse(t)}:{...w}}catch{return{...w}}},save(t){let a={...this.load(),...t};try{localStorage.setItem(v,JSON.stringify(a))}catch{}return a},apply({mode:t="auto",brand:e="default",borderStyle:a="",iconSet:s="",fluid:n="",backdrop:i=""}={}){let c=document.documentElement;t==="auto"?delete c.dataset.mode:c.dataset.mode=t;let d=(c.dataset.theme||"").split(" ").filter(g=>g.startsWith("a11y-")),r=e!=="default"?[e,...d]:[...d];r.length?c.dataset.theme=r.join(" "):delete c.dataset.theme;let h=a||this._readCSSHint("--theme-border-style");h&&h!=="clean"?c.dataset.borderStyle=h:delete c.dataset.borderStyle;let l=s||this._readCSSHint("--theme-icon-set");l&&l!=="lucide"?c.dataset.iconSet=l:delete c.dataset.iconSet,n?c.dataset.fluid=n:delete c.dataset.fluid,i?c.dataset.backdrop=i:delete c.dataset.backdrop,window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:t,brand:e,borderStyle:h,iconSet:l,fluid:n,backdrop:i,effectiveMode:this.getEffectiveMode()}}))},setMode(t){let e=this.save({mode:t});this.apply(e)},async setBrand(t){try{await y(t)}catch(a){console.warn(`[VB] Theme "${t}" failed to load, using default`,a),t="default"}let e=this.save({brand:t});this.apply(e)},setBorderStyle(t){let e=this.save({borderStyle:t});this.apply(e)},setIconSet(t){let e=this.save({iconSet:t});this.apply(e)},setFluid(t){let e=this.save({fluid:t});this.apply(e)},setBackdrop(t){let e=this.save({backdrop:t});this.apply(e)},getEffectiveMode(){let{mode:t}=this.load();return t!=="auto"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:t,brand:e,borderStyle:a,iconSet:s,fluid:n,backdrop:i}=this.load();return{mode:t,brand:e,borderStyle:a,iconSet:s,fluid:n,backdrop:i,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(v)}catch{}this.apply(w)},_readCSSHint(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let{mode:e,brand:a}=this.load();e==="auto"&&window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:e,brand:a,effectiveMode:this.getEffectiveMode()}}))})}};var m=null,A="vb-extensions",b={motionFx:!0,sounds:!1},C="vb-a11y-themes",S=class t extends HTMLElement{static#y=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}];static#l=[{id:"default",name:"Default",hue:260,swatchBg:"#3b82f6"},{id:"ocean",name:"Ocean",hue:200,swatchBg:"#0891b2"},{id:"forest",name:"Forest",hue:145,swatchBg:"#059669"},{id:"sunset",name:"Sunset",hue:25,swatchBg:"#ea580c"},{id:"rose",name:"Rose",hue:350,swatchBg:"#e11d48"},{id:"lavender",name:"Lavender",hue:280,swatchBg:"#a855f7"},{id:"coral",name:"Coral",hue:15,swatchBg:"#f97316"},{id:"slate",name:"Slate",hue:220,swatchBg:"#64748b"},{id:"emerald",name:"Emerald",hue:160,swatchBg:"#10b981"},{id:"amber",name:"Amber",hue:45,swatchBg:"#f59e0b"},{id:"indigo",name:"Indigo",hue:250,swatchBg:"#6366f1"}];static#h=[{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e"}];static#u=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227"},{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a"},{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold playful",swatchBg:"#FFF8F0",swatchFg:"#FF6B9D"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946"}];static#v=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}];static#E=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}];static#O=[...t.#l,...t.#h,...t.#u];static#S=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}];static#B=200;#t;#e;#a=!1;#i=!1;#s=null;#m=!1;connectedCallback(){this.#i=this.getAttribute("data-variant")==="inline",this.#T(),this.#k(),this.#b(),window.addEventListener("theme-change",this.#w),this.#g(),this.#o()}disconnectedCallback(){window.removeEventListener("theme-change",this.#w),document.removeEventListener("click",this.#p),document.removeEventListener("keydown",this.#f),this.#d()}#T(){this.#i||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#i||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#x(),this.appendChild(this.#e)}#x(){let{mode:e,brand:a,fluid:s}=u.getState(),n=[...t.#l,...t.#h,...t.#u];return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${t.#y.map(i=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${i.id}"
                ${e===i.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${i.icon}"></icon-wc>
                <span>${i.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Theme">
          ${n.map(i=>{let c=i.swatchBg,o=i.swatchFg||"white",d=i.icon||"";return`
            <label class="swatch-cell" title="${i.character?`${i.name} \u2014 ${i.character}`:i.name}">
              <input
                type="radio"
                name="theme-brand"
                value="${i.id}"
                ${a===i.id?"checked":""}
              />
              <span class="swatch-visual" style="--swatch-bg: ${c}; --swatch-fg: ${o}">
                ${d?`<icon-wc name="${d}"></icon-wc>`:""}
                <span class="sr-only">${i.name}</span>
              </span>
            </label>
          `}).join("")}
        </div>
      </fieldset>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${t.#E.map(i=>{let o=this.#c().includes(i.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${i.id}"
                data-a11y-theme="${i.id}"
                ${o?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${i.icon}"></icon-wc>
                <span class="option-label">${i.name}</span>
              </span>
            </label>
          `}).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <div class="options options--sizing" role="radiogroup" aria-label="Fluid sizing">
          ${t.#v.map(i=>`
            <label class="option option--sizing">
              <input
                type="radio"
                name="theme-fluid"
                value="${i.id}"
                ${s===i.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${i.icon}"></icon-wc>
                <span class="option-text">
                  <span>${i.name}</span>
                  <small>${i.description}</small>
                </span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <details class="section section--extensions" ${this.#m?"open":""}>
        <summary class="extensions-toggle">
          <icon-wc name="sliders-horizontal"></icon-wc>
          <span>Extensions</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="extensions-content">
          ${t.#S.map(i=>{let o=this.#n()[i.id]??b[i.id];return`
            <label class="extension-toggle">
              <span class="extension-info">
                <icon-wc name="${i.icon}"></icon-wc>
                <span class="extension-name">${i.name}</span>
              </span>
              <input
                type="checkbox"
                name="ext-${i.id}"
                data-extension="${i.id}"
                ${o?"checked":""}
              />
              <span class="toggle-switch"></span>
            </label>
          `}).join("")}
        </div>
      </details>
    `}#k(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(a=>{a.addEventListener("change",this.#A)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(a=>{a.addEventListener("change",this.#C)}),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(a=>{a.addEventListener("change",this.#_)}),this.#e.querySelectorAll("input[data-extension]").forEach(a=>{a.addEventListener("change",this.#$)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(a=>{a.addEventListener("change",this.#L)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",a=>{this.#m=a.target.open}),this.#i||(this.#t.addEventListener("click",this.#F),document.addEventListener("click",this.#p),document.addEventListener("keydown",this.#f))}#F=e=>{e.stopPropagation(),this.toggle()};#p=e=>{this.#a&&!this.contains(e.target)&&this.close()};#f=e=>{e.key==="Escape"&&this.#a&&(e.preventDefault(),this.close(),this.#t?.focus())};#A=e=>{u.setMode(e.target.value),this.#r()};#C=async e=>{let a=e.target.closest(".swatch-cell");a&&a.setAttribute("aria-busy","true");try{await u.setBrand(e.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a&&a.removeAttribute("aria-busy")}this.#o(),this.#r()};#_=e=>{u.setFluid(e.target.value),this.#r()};#$=e=>{let a=e.target.dataset.extension,s=e.target.checked;this.#M(a,s),this.#g()};#n(){try{let e=localStorage.getItem(A);return e?{...b,...JSON.parse(e)}:{...b}}catch{return{...b}}}#M(e,a){try{let s=this.#n();s[e]=a,localStorage.setItem(A,JSON.stringify(s))}catch{}}async#g(){let e=this.#n(),a=document.documentElement;e.motionFx?delete a.dataset.motionReduced:a.dataset.motionReduced="",e.sounds?(m||(m=(await Promise.resolve().then(()=>(F(),k))).SoundManager),m.init(),m.enable()):m&&m.disable(),window.dispatchEvent(new CustomEvent("extensions-change",{detail:e}))}#c(){try{let e=localStorage.getItem(C);return e?JSON.parse(e):[]}catch{return[]}}#I(e){try{localStorage.setItem(C,JSON.stringify(e))}catch{}}#o(){let e=this.#c(),{brand:a}=u.getState(),s=document.documentElement,n=a==="default"?e.join(" "):[a,...e].join(" "),i=s.dataset.theme||"";n!==i&&(n?s.dataset.theme=n:delete s.dataset.theme)}#L=e=>{let a=e.target.dataset.a11yTheme,s=e.target.checked,n=this.#c();if(s&&!n.includes(a))n.push(a);else if(!s&&n.includes(a)){let i=n.indexOf(a);n.splice(i,1)}this.#I(n),this.#o()};#r(){this.#i||(this.#d(),this.#s=setTimeout(()=>{this.close(),this.#t?.focus()},t.#B))}#d(){this.#s&&(clearTimeout(this.#s),this.#s=null)}#w=()=>{this.#b()};#b(){let{mode:e,brand:a,fluid:s}=u.getState(),n=this.#e.querySelector(`input[name="theme-mode"][value="${e}"]`);n&&(n.checked=!0);let i=this.#e.querySelector(`input[name="theme-brand"][value="${a}"]`);i&&(i.checked=!0);let c=this.#e.querySelector(`input[name="theme-fluid"][value="${s}"]`);c&&(c.checked=!0)}open(){this.#i||this.#a||(this.#a=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#D(),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#D(){if(!this.#t||!this.#e)return;let e=this.#t.getBoundingClientRect(),a=this.#e.getBoundingClientRect(),s=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},n=s.height,i=s.width,c=8,o=16,d=n-e.bottom-o,r=e.top-o,h=e.height+c;d<a.height&&r>d?(h=-a.height-c,this.#e.dataset.position="top"):delete this.#e.dataset.position;let l=0,g=e.left+a.width+o,_=e.left+l;g>i&&(l=i-g),_+l<o&&(l=o-e.left),this.#e.style.setProperty("--panel-top",`${h}px`),this.#e.style.setProperty("--panel-left",`${l}px`)}close(){this.#i||!this.#a||(this.#d(),this.#a=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}};customElements.define("theme-picker",S);export{S as ThemePicker};
//# sourceMappingURL=theme-picker.js.map
