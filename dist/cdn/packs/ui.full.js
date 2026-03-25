var ee=Object.defineProperty;var te=(e,t)=>()=>(e&&(t=e(e=0)),t);var ae=(e,t)=>{for(var a in t)ee(e,a,{get:t[a],enumerable:!0})};var J={};ae(J,{SoundManager:()=>ce});var Y,H,ce,K=te(()=>{Y="vb-sound",H={enabled:!1,volume:.5},ce={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let e=this._load();return this._enabled=e.enabled,this._volume=e.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let e=localStorage.getItem(Y);return e?{...H,...JSON.parse(e)}:{...H}}catch{return{...H}}},_save(e){try{let t=this._load();localStorage.setItem(Y,JSON.stringify({...t,...e}))}catch{}},_playTone(e,t,a="sine"){if(!this._enabled)return;let o=this._getContext(),i=o.createOscillator(),s=o.createGain();i.connect(s),s.connect(o.destination),i.frequency.value=e,i.type=a,s.gain.value=this._volume*.3,i.start(),s.gain.exponentialRampToValueAtTime(.01,o.currentTime+t),i.stop(o.currentTime+t)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(e){this._volume=Math.max(0,Math.min(1,e)),this._save({volume:this._volume})},getVolume(){return this._volume},play(e){if(this._enabled)switch(e){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var he=window.matchMedia("(prefers-reduced-motion: reduce)");var V=new Map;function z(e,t,a={}){let o=a.priority??10,i={impl:t,bundle:a.bundle,contract:a.contract,priority:o},s=V.get(e);if(customElements.get(e)){if(!s||s.priority>=o){s&&s.priority===o&&s.impl!==t&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${a.bundle}".`);return}console.warn(`[VB Bundle] Tag <${e}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${a.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=o){s.priority===o&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${s.bundle}". Skipping "${a.bundle}" (first wins at equal priority).`);return}V.set(e,i),customElements.define(e,t)}var y=new Map,b=null,f=null,G=null;function x(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(G)return G;if(typeof document<"u"){let e=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let t of e){let a=t.getAttribute("src");if(a){let o=a.lastIndexOf("/");if(o!==-1)return a.slice(0,o)}}}return"/cdn"}async function se(){if(b)return b;let e=x();try{let t=await fetch(`${e}/themes/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);b=await t.json()}catch{b={}}return b}var ie=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","ocean","forest","sunset","rose","lavender","coral","slate","emerald","amber","indigo","modern","minimal","classic"]);async function k(e){if(!e||ie.has(e))return;if(y.has(e))return y.get(e);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${e}"]`)){y.set(e,Promise.resolve());return}let t=oe(e);return y.set(e,t),t}async function ne(){if(f)return f;let e=x();try{let t=await fetch(`${e}/packs/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);f=await t.json()}catch{try{let t=await fetch(`${e}/bundles/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);f=await t.json()}catch{f={}}}return f}async function oe(e){let t=x();if((await ne())[e])return re(e,t);let i=(await se())[e],s=i?i.file:`${e}.css`,n=`${t}/themes/${s}`;return new Promise((r,d)=>{let h=document.querySelector(`link[data-vb-theme-preload="${e}"]`);h&&h.remove();let l=document.createElement("link");l.rel="stylesheet",l.href=n,l.setAttribute("data-vb-theme",e),l.onload=()=>r(),l.onerror=()=>{l.remove(),y.delete(e),d(new Error(`Failed to load theme: ${e}`))},document.head.appendChild(l)})}function re(e,t){let a=`${t}/packs/${e}.full.css`,o=`${t}/packs/${e}.full.js`;return new Promise((i,s)=>{let n=document.createElement("link");n.rel="stylesheet",n.href=a,n.setAttribute("data-vb-theme",e),n.setAttribute("data-vb-pack",e),n.onload=()=>{import(o).catch(()=>{}),i()},n.onerror=()=>{n.remove(),y.delete(e),s(new Error(`Failed to load pack: ${e}`))},document.head.appendChild(n)})}var C="vb-theme",T={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},m={async init(){let e=this.load();try{await k(e.brand)}catch{e.brand="default"}return this.apply(e),this._watchSystemPreference(),e},load(){try{let e=localStorage.getItem(C);return e?{...T,...JSON.parse(e)}:{...T}}catch{return{...T}}},save(e){let a={...this.load(),...e};try{localStorage.setItem(C,JSON.stringify(a))}catch{}return a},apply({mode:e="auto",brand:t="default",borderStyle:a="",iconSet:o="",fluid:i="",backdrop:s="",backdropChrome:n="",pageBgType:r="",pageBgColor:d="",pageBgGradStart:h="",pageBgGradEnd:l="",pageBgGradDir:u=""}={}){let c=document.documentElement;c.dataset.mode=e==="auto"?this.getEffectiveMode():e;let j=(c.dataset.theme||"").split(" ").filter(M=>M.startsWith("a11y-")),N=t!=="default"?[t,...j]:[...j];N.length?c.dataset.theme=N.join(" "):delete c.dataset.theme;let S=a||this._readCSSHint("--theme-border-style");S&&S!=="clean"?c.dataset.borderStyle=S:delete c.dataset.borderStyle;let _=o||this._readCSSHint("--theme-icon-set");if(_&&_!=="lucide"?c.dataset.iconSet=_:delete c.dataset.iconSet,i?c.dataset.fluid=i:delete c.dataset.fluid,s?c.dataset.backdrop=s:delete c.dataset.backdrop,n&&n!=="card"?c.dataset.backdropChrome=n:delete c.dataset.backdropChrome,r==="color"&&d)c.style.setProperty("--page-bg-color",d),c.style.removeProperty("--page-bg-gradient");else if(r==="gradient"&&h&&l){let M=u||"to bottom";c.style.setProperty("--page-bg-gradient",`linear-gradient(${M}, ${h}, ${l})`),c.style.removeProperty("--page-bg-color")}else c.style.removeProperty("--page-bg-color"),c.style.removeProperty("--page-bg-gradient");window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:e,brand:t,borderStyle:S,iconSet:_,fluid:i,backdrop:s,backdropChrome:n,pageBgType:r,effectiveMode:this.getEffectiveMode()}}))},setMode(e){let t=this.save({mode:e});this.apply(t)},async setBrand(e){try{await k(e)}catch(a){console.warn(`[VB] Theme "${e}" failed to load, using default`,a),e="default"}let t=this.save({brand:e});this.apply(t)},setBorderStyle(e){let t=this.save({borderStyle:e});this.apply(t)},setIconSet(e){let t=this.save({iconSet:e});this.apply(t)},setFluid(e){let t=this.save({fluid:e});this.apply(t)},setBackdrop(e){let t=this.save({backdrop:e});this.apply(t)},setBackdropChrome(e){let t=this.save({backdropChrome:e});this.apply(t)},setPageBg({type:e="",color:t="",gradStart:a="",gradEnd:o="",gradDir:i=""}={}){let s=this.save({pageBgType:e,pageBgColor:t,pageBgGradStart:a,pageBgGradEnd:o,pageBgGradDir:i});this.apply(s)},getEffectiveMode(){let{mode:e}=this.load();return e!=="auto"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:e,brand:t,borderStyle:a,iconSet:o,fluid:i,backdrop:s,backdropChrome:n,pageBgType:r,pageBgColor:d,pageBgGradStart:h,pageBgGradEnd:l,pageBgGradDir:u}=this.load();return{mode:e,brand:t,borderStyle:a,iconSet:o,fluid:i,backdrop:s,backdropChrome:n,pageBgType:r,pageBgColor:d,pageBgGradStart:h,pageBgGradEnd:l,pageBgGradDir:u,effectiveMode:this.getEffectiveMode()}},toggleMode(){let t=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(t)},reset(){try{localStorage.removeItem(C)}catch{}let e=document.documentElement;e.style.removeProperty("--page-bg-color"),e.style.removeProperty("--page-bg-gradient"),this.apply(T)},_readCSSHint(e){return getComputedStyle(document.documentElement).getPropertyValue(e).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let t=this.load();t.mode==="auto"&&this.apply(t)})}};var A=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}],$=[{id:"default",name:"Default",hue:260,swatchBg:"#3b82f6",tier:"core"},{id:"ocean",name:"Ocean",hue:200,swatchBg:"#0891b2",tier:"core"},{id:"forest",name:"Forest",hue:145,swatchBg:"#059669",tier:"core"},{id:"sunset",name:"Sunset",hue:25,swatchBg:"#ea580c",tier:"core"},{id:"rose",name:"Rose",hue:350,swatchBg:"#e11d48",tier:"core"},{id:"lavender",name:"Lavender",hue:280,swatchBg:"#a855f7",tier:"core"},{id:"coral",name:"Coral",hue:15,swatchBg:"#f97316",tier:"core"},{id:"slate",name:"Slate",hue:220,swatchBg:"#64748b",tier:"core"},{id:"emerald",name:"Emerald",hue:160,swatchBg:"#10b981",tier:"core"},{id:"amber",name:"Amber",hue:45,swatchBg:"#f59e0b",tier:"core"},{id:"indigo",name:"Indigo",hue:250,swatchBg:"#6366f1",tier:"core"}],B=[{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1",tier:"core"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a",tier:"core"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e",tier:"core"}],F=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white",tier:"showcase",category:"Design"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5",tier:"showcase",category:"Design"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C",tier:"showcase",category:"Design"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227",tier:"showcase",category:"Content"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7",tier:"showcase",category:"Modern"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6",tier:"showcase",category:"Creative"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a",tier:"showcase",category:"Creative"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88",tier:"showcase",category:"Creative"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5",tier:"showcase",category:"Aesthetic"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0",tier:"showcase",category:"Aesthetic"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946",tier:"showcase",category:"Aesthetic"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D",tier:"showcase",category:"Aesthetic"},{id:"alpha1999",name:"Alpha1999",icon:"orbit",character:"Space retro-fi",swatchBg:"#0a0a14",swatchFg:"#d4880f",tier:"showcase",category:"Signature"},{id:"super2026",name:"Super2026",icon:"triangle",character:"Supergraphic bold",swatchBg:"#f5f0e6",swatchFg:"#c23616",tier:"showcase",category:"Signature"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0",tier:"showcase",category:"OS Styles"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521",tier:"showcase",category:"OS Styles"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00",tier:"showcase",category:"OS Styles"},{id:"magna",name:"Magna",icon:"orbit",character:"Odyssey 2 retro",swatchBg:"#0d0b14",swatchFg:"#f97316",tier:"showcase",category:"OS Styles"}],v=[{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1",tier:"community",category:"Editor Palettes"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2",tier:"community",category:"Editor Palettes"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9",tier:"community",category:"Editor Palettes"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7",tier:"community",category:"Editor Palettes"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef",tier:"community",category:"Editor Palettes"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6",tier:"community",category:"Editor Palettes"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6",tier:"community",category:"Editor Palettes"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2",tier:"community",category:"Editor Palettes"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7",tier:"community",category:"Editor Palettes"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba",tier:"community",category:"Editor Palettes"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d",tier:"community",category:"Niche"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00",tier:"community",category:"Niche"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6",tier:"community",category:"Industry"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c",tier:"community",category:"Industry"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30",tier:"community",category:"Industry"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574",tier:"community",category:"Mood/Time"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858",tier:"community",category:"Mood/Time"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff",tier:"community",category:"Mood/Time"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946",tier:"community",category:"Mood/Time"}],U=[{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4",tier:"showcase",category:"Packs"},{id:"retro",name:"Retro",icon:"tv",character:"CRT terminal",swatchBg:"#0a0a14",swatchFg:"#00ff66",tier:"showcase",category:"Packs"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold patterns",swatchBg:"#FFF8F0",swatchFg:"#d03040",tier:"showcase",category:"Packs"}],O=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}],P=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}],L=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}],fe=[...F,...v],ye=[...$,...B,...F,...v,...U],p=e=>F.filter(t=>t.category===e),D=[{label:"Colors",themes:$,tier:"core"},{label:"Style",themes:B,tier:"core"},{label:"Design",themes:p("Design"),tier:"showcase"},{label:"Content",themes:p("Content"),tier:"showcase"},{label:"Modern",themes:p("Modern"),tier:"showcase"},{label:"Creative",themes:p("Creative"),tier:"showcase"},{label:"Aesthetic",themes:p("Aesthetic"),tier:"showcase"},{label:"Signature",themes:p("Signature"),tier:"showcase"},{label:"OS Styles",themes:p("OS Styles"),tier:"showcase"},{label:"Packs",themes:U,tier:"showcase"},{label:"More Themes",themes:v,tier:"community"}];var w=null,W="vb-extensions",E={motionFx:!0,sounds:!1},X="vb-a11y-themes",I=class e extends HTMLElement{static#E=200;#t;#e;#a=!1;#s=!1;#u=!1;#n=null;#m=!1;#i=()=>this.#v();connectedCallback(){this.hasAttribute("data-upgraded")||(this.#s=this.getAttribute("variant")==="inline",this.#u=this.hasAttribute("compact"),this.#S(),this.#B(),this.#b(),window.addEventListener("vb:theme-change",this.#w),this.#y(),this.#l(),this.setAttribute("data-upgraded",""))}disconnectedCallback(){this.removeAttribute("data-upgraded"),window.removeEventListener("vb:theme-change",this.#w),document.removeEventListener("click",this.#p),document.removeEventListener("keydown",this.#g),window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.#h()}#S(){this.#s||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#s||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#_(),this.appendChild(this.#e)}#_(){return this.#u?this.#$():this.#T()}#o(t,a){let o=t.swatchBg,i=t.swatchFg||"white",s=t.icon||"";return`
      <label class="swatch-cell" title="${t.character?`${t.name} \u2014 ${t.character}`:t.name}">
        <input
          type="radio"
          name="theme-brand"
          value="${t.id}"
          ${a===t.id?"checked":""}
        />
        <span class="swatch-visual" style="--swatch-bg: ${o}; --swatch-fg: ${i}">
          ${s?`<icon-wc name="${s}"></icon-wc>`:""}
          <span class="sr-only">${t.name}</span>
        </span>
      </label>
    `}#T(){let{mode:t,brand:a,fluid:o}=m.getState(),i=D.filter(s=>s.tier==="showcase");return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${A.map(s=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${s.id}"
                ${t===s.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${s.icon}"></icon-wc>
                <span>${s.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Colors</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Color theme">
          ${$.map(s=>this.#o(s,a)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Style</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Style">
          ${B.map(s=>this.#o(s,a)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Featured</legend>
        ${i.map(s=>`
          <div class="theme-category">
            <span class="category-label">${s.label}</span>
            <div class="options options--swatch-grid">
              ${s.themes.map(n=>this.#o(n,a)).join("")}
            </div>
          </div>
        `).join("")}
      </fieldset>

      <details class="section section--more-themes">
        <summary class="more-themes-toggle">
          <span>More Themes</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="options options--swatch-grid">
          ${v.map(s=>this.#o(s,a)).join("")}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${P.map(s=>{let r=this.#c().includes(s.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${s.id}"
                data-a11y-theme="${s.id}"
                ${r?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${s.icon}"></icon-wc>
                <span class="option-label">${s.name}</span>
              </span>
            </label>
          `}).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <div class="options options--sizing" role="radiogroup" aria-label="Fluid sizing">
          ${O.map(s=>`
            <label class="option option--sizing">
              <input
                type="radio"
                name="theme-fluid"
                value="${s.id}"
                ${o===s.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${s.icon}"></icon-wc>
                <span class="option-text">
                  <span>${s.name}</span>
                  <small>${s.description}</small>
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
          ${L.map(s=>{let r=this.#r()[s.id]??E[s.id];return`
            <label class="extension-toggle">
              <span class="extension-info">
                <icon-wc name="${s.icon}"></icon-wc>
                <span class="extension-name">${s.name}</span>
              </span>
              <input
                type="checkbox"
                name="ext-${s.id}"
                data-extension="${s.id}"
                data-switch="sm"
                ${r?"checked":""}
              />
            </label>
          `}).join("")}
        </div>
      </details>
    `}#$(){let{mode:t,brand:a,fluid:o}=m.getState(),i=this.#c(),s=this.#r();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${A.map(n=>`
            <label class="compact-seg">
              <input type="radio" name="theme-mode" value="${n.id}" ${t===n.id?"checked":""} />
              <span><icon-wc name="${n.icon}" size="xs"></icon-wc> ${n.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${D.map(n=>`
            <optgroup label="${n.label}">
              ${n.themes.map(r=>`
                <option value="${r.id}" ${a===r.id?"selected":""}>${r.name}</option>
              `).join("")}
            </optgroup>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="Sizing">
          ${O.map(n=>`
            <option value="${n.id}" ${o===n.id?"selected":""}>${n.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${P.map(n=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${n.name}</span>
              </span>
              <input type="checkbox" name="a11y-theme" value="${n.id}" data-a11y-theme="${n.id}" data-switch="sm" ${i.includes(n.id)?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Extensions</legend>
        <div class="compact-toggles">
          ${L.map(n=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${n.name}</span>
              </span>
              <input type="checkbox" name="ext-${n.id}" data-extension="${n.id}" data-switch="sm" ${s[n.id]??E[n.id]?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#B(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(i=>{i.addEventListener("change",this.#x)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(i=>{i.addEventListener("change",this.#k)});let t=this.#e.querySelector('select[name="theme-brand-select"]');t&&t.addEventListener("change",this.#C),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(i=>{i.addEventListener("change",this.#f)});let a=this.#e.querySelector('select[name="theme-fluid-select"]');a&&a.addEventListener("change",this.#f),this.#e.querySelectorAll("input[data-extension]").forEach(i=>{i.addEventListener("change",this.#A)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(i=>{i.addEventListener("change",this.#P)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",i=>{this.#m=i.target.open}),this.#s||(this.#t.addEventListener("click",this.#M),document.addEventListener("click",this.#p),document.addEventListener("keydown",this.#g))}#M=t=>{t.stopPropagation(),this.toggle()};#p=t=>{this.#a&&!this.contains(t.target)&&this.close()};#g=t=>{t.key==="Escape"&&this.#a&&(t.preventDefault(),this.close(),this.#t?.focus())};#x=t=>{m.setMode(t.target.value),this.#d()};#k=async t=>{let a=t.target.closest(".swatch-cell");a&&a.setAttribute("aria-busy","true");try{await m.setBrand(t.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a&&a.removeAttribute("aria-busy")}this.#l(),this.#d()};#C=async t=>{let a=t.target;a.disabled=!0;try{await m.setBrand(a.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a.disabled=!1}this.#l(),this.#d()};#f=t=>{m.setFluid(t.target.value),this.#d()};#A=t=>{let a=t.target.dataset.extension,o=t.target.checked;this.#F(a,o),this.#y()};#r(){try{let t=localStorage.getItem(W);return t?{...E,...JSON.parse(t)}:{...E}}catch{return{...E}}}#F(t,a){try{let o=this.#r();o[t]=a,localStorage.setItem(W,JSON.stringify(o))}catch{}}async#y(){let t=this.#r(),a=document.documentElement;t.motionFx?delete a.dataset.motionReduced:a.dataset.motionReduced="",t.sounds?(w||(w=(await Promise.resolve().then(()=>(K(),J))).SoundManager),w.init(),w.enable()):w&&w.disable(),window.dispatchEvent(new CustomEvent("vb:extensions-change",{detail:t}))}#c(){try{let t=localStorage.getItem(X);return t?JSON.parse(t):[]}catch{return[]}}#O(t){try{localStorage.setItem(X,JSON.stringify(t))}catch{}}#l(){let t=this.#c(),{brand:a}=m.getState(),o=document.documentElement,i=a==="default"?t.join(" "):[a,...t].join(" "),s=o.dataset.theme||"";i!==s&&(i?o.dataset.theme=i:delete o.dataset.theme)}#P=t=>{let a=t.target.dataset.a11yTheme,o=t.target.checked,i=this.#c();if(o&&!i.includes(a))i.push(a);else if(!o&&i.includes(a)){let s=i.indexOf(a);i.splice(s,1)}this.#O(i),this.#l()};#d(){this.#s||(this.#h(),this.#n=setTimeout(()=>{this.close(),this.#t?.focus()},e.#E))}#h(){this.#n&&(clearTimeout(this.#n),this.#n=null)}#w=()=>{this.#b()};#b(){let{mode:t,brand:a,fluid:o}=m.getState(),i=this.#e.querySelector(`input[name="theme-mode"][value="${t}"]`);i&&(i.checked=!0);let s=this.#e.querySelector(`input[name="theme-brand"][value="${a}"]`);s&&(s.checked=!0);let n=this.#e.querySelector('select[name="theme-brand-select"]');n&&(n.value=a);let r=this.#e.querySelector(`input[name="theme-fluid"][value="${o}"]`);r&&(r.checked=!0);let d=this.#e.querySelector('select[name="theme-fluid-select"]');d&&(d.value=o)}open(){this.#s||this.#a||(this.#a=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#v(),window.addEventListener("scroll",this.#i,{capture:!0,passive:!0}),window.addEventListener("resize",this.#i,{passive:!0}),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#v(){if(!this.#t||!this.#e)return;let t=this.#t.getBoundingClientRect(),a=this.#e.getBoundingClientRect(),o=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},i=o.height,s=o.width,n=8,r=16,d=i-t.bottom-r,h=t.top-r,l=t.height+n;d<a.height&&h>d?(l=-a.height-n,this.#e.dataset.position="top"):delete this.#e.dataset.position;let u=0,c=t.left+a.width+r,q=t.left+u;c>s&&(u=s-c),q+u<r&&(u=r-t.left),this.#e.style.setProperty("--panel-top",`${l}px`),this.#e.style.setProperty("--panel-left",`${u}px`)}close(){this.#s||!this.#a||(this.#h(),this.#a=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}};z("theme-picker",I);var Q="vb-environment",R={timeOfDay:!1,seasonal:!1},le=900*1e3;function g(e,t,a){return e+(t-e)*Math.min(1,Math.max(0,a))}var Z={_timer:null,_baseHues:null,_timeOverride:null,_monthOverride:null,init(){let e=this.load();(e.timeOfDay||e.seasonal)&&(this._captureBaseHues(),this._update(),this._startLoop()),window.addEventListener("vb:theme-change",()=>{this._hasActiveSource()&&requestAnimationFrame(()=>{this._captureBaseHues(),this._update()})})},load(){try{let e=localStorage.getItem(Q);return e?{...R,...JSON.parse(e)}:{...R}}catch{return{...R}}},save(e){try{localStorage.setItem(Q,JSON.stringify(e))}catch{}return e},setTimeOverride(e){this._timeOverride=e,this._hasActiveSource()&&this._update()},setMonthOverride(e){this._monthOverride=e,this._hasActiveSource()&&this._update()},setSource(e,t){let a={...this.load(),[e]:t};this.save(a),t?(this._captureBaseHues(),this._update(),this._startLoop()):this._hasActiveSource(a)?this._update():(this._clearModifiers(),this._stopLoop())},_hasActiveSource(e){let t=e||this.load();return t.timeOfDay||t.seasonal},_captureBaseHues(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent");let t=e.getAttribute("data-theme");if(t){let a=`[data-theme~="${t}"]`;for(let o of document.styleSheets)try{for(let i=0;i<o.cssRules.length;i++){let s=o.cssRules[i];if(s.selectorText?.includes(a)&&!s.selectorText.includes("dark")){let n=s.style?.getPropertyValue("--hue-primary");if(n){this._baseHues={primary:parseFloat(n)||260,secondary:parseFloat(s.style.getPropertyValue("--hue-secondary"))||200,accent:parseFloat(s.style.getPropertyValue("--hue-accent"))||30};return}}}}catch{}}this._baseHues={primary:260,secondary:200,accent:30}},_update(){let e=this.load(),t=0;e.timeOfDay&&(t+=this._getTimeOfDayOffset()),e.seasonal&&(t+=this._getSeasonalOffset());let a=document.documentElement;t!==0&&this._baseHues?(a.style.setProperty("--hue-primary",String(this._baseHues.primary+t)),a.style.setProperty("--hue-secondary",String(this._baseHues.secondary+t)),a.style.setProperty("--hue-accent",String(this._baseHues.accent+t*.5))):t===0&&this._clearModifiers()},_clearModifiers(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent")},_getTimeOfDayOffset(){let e=this._timeOverride??new Date().getHours()+new Date().getMinutes()/60;return e<5?-20:e<7?g(-20,20,(e-5)/2):e<10?g(20,5,(e-7)/3):e<14?g(5,0,(e-10)/4):e<17?g(0,-5,(e-14)/3):e<19?g(-5,15,(e-17)/2):e<21?g(15,-10,(e-19)/2):g(-10,-20,(e-21)/8)},_getHemisphere(){return window.__VB_ENV_LOCATION?.hemisphere||"north"},_getSeasonalOffset(){let e=this._monthOverride??new Date().getMonth(),a=this._getHemisphere()==="south"?(e+6)%12:e;return a>=2&&a<=4?5:a>=5&&a<=7?10:a>=8&&a<=10?-5:-10},_startLoop(){this._timer||(this._timer=setInterval(()=>this._update(),le))},_stopLoop(){this._timer&&clearInterval(this._timer),this._timer=null}};Z.init();
//# sourceMappingURL=ui.full.js.map
