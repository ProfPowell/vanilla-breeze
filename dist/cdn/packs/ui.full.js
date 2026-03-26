var te=Object.defineProperty;var se=(e,t)=>()=>(e&&(t=e(e=0)),t);var ae=(e,t)=>{for(var s in t)te(e,s,{get:t[s],enumerable:!0})};var K={};ae(K,{SoundManager:()=>le});var J,I,le,W=se(()=>{J="vb-sound",I={enabled:!1,volume:.5},le={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let e=this._load();return this._enabled=e.enabled,this._volume=e.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let e=localStorage.getItem(J);return e?{...I,...JSON.parse(e)}:{...I}}catch{return{...I}}},_save(e){try{let t=this._load();localStorage.setItem(J,JSON.stringify({...t,...e}))}catch{}},_playTone(e,t,s="sine"){if(!this._enabled)return;let n=this._getContext(),i=n.createOscillator(),a=n.createGain();i.connect(a),a.connect(n.destination),i.frequency.value=e,i.type=s,a.gain.value=this._volume*.3,i.start(),a.gain.exponentialRampToValueAtTime(.01,n.currentTime+t),i.stop(n.currentTime+t)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(e){this._volume=Math.max(0,Math.min(1,e)),this._save({volume:this._volume})},getVolume(){return this._volume},play(e){if(this._enabled)switch(e){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var ue=window.matchMedia("(prefers-reduced-motion: reduce)");var z=new Map;function G(e,t,s={}){let n=s.priority??10,i={impl:t,bundle:s.bundle,contract:s.contract,priority:n},a=z.get(e);if(customElements.get(e)){if(!a||a.priority>=n){a&&a.priority===n&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${s.bundle}".`);return}console.warn(`[VB Bundle] Tag <${e}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${s.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=n){a.priority===n&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${a.bundle}". Skipping "${s.bundle}" (first wins at equal priority).`);return}z.set(e,i),customElements.define(e,t)}var T=class extends HTMLElement{#n=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let t of this.#n)t();this.#n=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,s,n,i){t.addEventListener(s,n,i),this.#n.push(()=>t.removeEventListener(s,n,i))}setup(){}teardown(){}};var y=new Map,b=null,f=null,U=null;function k(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(U)return U;if(typeof document<"u"){let e=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let t of e){let s=t.getAttribute("src");if(s){let n=s.lastIndexOf("/");if(n!==-1)return s.slice(0,n)}}}return"/cdn"}async function ie(){if(b)return b;let e=k();try{let t=await fetch(`${e}/themes/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);b=await t.json()}catch{b={}}return b}var ne=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","ocean","forest","sunset","rose","lavender","coral","slate","emerald","amber","indigo","modern","minimal","classic"]);async function C(e){if(!e||ne.has(e))return;if(y.has(e))return y.get(e);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${e}"]`)){y.set(e,Promise.resolve());return}let t=re(e);return y.set(e,t),t}async function oe(){if(f)return f;let e=k();try{let t=await fetch(`${e}/packs/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);f=await t.json()}catch{try{let t=await fetch(`${e}/bundles/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);f=await t.json()}catch{f={}}}return f}async function re(e){let t=k();if((await oe())[e])return ce(e,t);let i=(await ie())[e],a=i?i.file:`${e}.css`,o=`${t}/themes/${a}`;return new Promise((r,d)=>{let h=document.querySelector(`link[data-vb-theme-preload="${e}"]`);h&&h.remove();let l=document.createElement("link");l.rel="stylesheet",l.href=o,l.setAttribute("data-vb-theme",e),l.onload=()=>r(),l.onerror=()=>{l.remove(),y.delete(e),d(new Error(`Failed to load theme: ${e}`))},document.head.appendChild(l)})}function ce(e,t){let s=`${t}/packs/${e}.full.css`,n=`${t}/packs/${e}.full.js`;return new Promise((i,a)=>{let o=document.createElement("link");o.rel="stylesheet",o.href=s,o.setAttribute("data-vb-theme",e),o.setAttribute("data-vb-pack",e),o.onload=()=>{import(n).catch(()=>{}),i()},o.onerror=()=>{o.remove(),y.delete(e),a(new Error(`Failed to load pack: ${e}`))},document.head.appendChild(o)})}var A="vb-theme",$={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},m={async init(){let e=this.load();try{await C(e.brand)}catch{e.brand="default"}return this.apply(e),this._watchSystemPreference(),e},load(){try{let e=localStorage.getItem(A);return e?{...$,...JSON.parse(e)}:{...$}}catch{return{...$}}},save(e){let s={...this.load(),...e};try{localStorage.setItem(A,JSON.stringify(s))}catch{}return s},apply({mode:e="auto",brand:t="default",borderStyle:s="",iconSet:n="",fluid:i="",backdrop:a="",backdropChrome:o="",pageBgType:r="",pageBgColor:d="",pageBgGradStart:h="",pageBgGradEnd:l="",pageBgGradDir:u=""}={}){let c=document.documentElement;c.dataset.mode=e==="auto"?this.getEffectiveMode():e;let N=(c.dataset.theme||"").split(" ").filter(M=>M.startsWith("a11y-")),V=t!=="default"?[t,...N]:[...N];V.length?c.dataset.theme=V.join(" "):delete c.dataset.theme;let S=s||this._readCSSHint("--theme-border-style");S&&S!=="clean"?c.dataset.borderStyle=S:delete c.dataset.borderStyle;let _=n||this._readCSSHint("--theme-icon-set");if(_&&_!=="lucide"?c.dataset.iconSet=_:delete c.dataset.iconSet,i?c.dataset.fluid=i:delete c.dataset.fluid,a?c.dataset.backdrop=a:delete c.dataset.backdrop,o&&o!=="card"?c.dataset.backdropChrome=o:delete c.dataset.backdropChrome,r==="color"&&d)c.style.setProperty("--page-bg-color",d),c.style.removeProperty("--page-bg-gradient");else if(r==="gradient"&&h&&l){let M=u||"to bottom";c.style.setProperty("--page-bg-gradient",`linear-gradient(${M}, ${h}, ${l})`),c.style.removeProperty("--page-bg-color")}else c.style.removeProperty("--page-bg-color"),c.style.removeProperty("--page-bg-gradient");window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:e,brand:t,borderStyle:S,iconSet:_,fluid:i,backdrop:a,backdropChrome:o,pageBgType:r,effectiveMode:this.getEffectiveMode()}}))},setMode(e){let t=this.save({mode:e});this.apply(t)},async setBrand(e){try{await C(e)}catch(s){console.warn(`[VB] Theme "${e}" failed to load, using default`,s),e="default"}let t=this.save({brand:e});this.apply(t)},setBorderStyle(e){let t=this.save({borderStyle:e});this.apply(t)},setIconSet(e){let t=this.save({iconSet:e});this.apply(t)},setFluid(e){let t=this.save({fluid:e});this.apply(t)},setBackdrop(e){let t=this.save({backdrop:e});this.apply(t)},setBackdropChrome(e){let t=this.save({backdropChrome:e});this.apply(t)},setPageBg({type:e="",color:t="",gradStart:s="",gradEnd:n="",gradDir:i=""}={}){let a=this.save({pageBgType:e,pageBgColor:t,pageBgGradStart:s,pageBgGradEnd:n,pageBgGradDir:i});this.apply(a)},getEffectiveMode(){let{mode:e}=this.load();return e!=="auto"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:e,brand:t,borderStyle:s,iconSet:n,fluid:i,backdrop:a,backdropChrome:o,pageBgType:r,pageBgColor:d,pageBgGradStart:h,pageBgGradEnd:l,pageBgGradDir:u}=this.load();return{mode:e,brand:t,borderStyle:s,iconSet:n,fluid:i,backdrop:a,backdropChrome:o,pageBgType:r,pageBgColor:d,pageBgGradStart:h,pageBgGradEnd:l,pageBgGradDir:u,effectiveMode:this.getEffectiveMode()}},toggleMode(){let t=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(t)},reset(){try{localStorage.removeItem(A)}catch{}let e=document.documentElement;e.style.removeProperty("--page-bg-color"),e.style.removeProperty("--page-bg-gradient"),this.apply($)},_readCSSHint(e){return getComputedStyle(document.documentElement).getPropertyValue(e).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let t=this.load();t.mode==="auto"&&this.apply(t)})}};var F=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}],B=[{id:"default",name:"Default",hue:260,swatchBg:"#3b82f6",tier:"core"},{id:"ocean",name:"Ocean",hue:200,swatchBg:"#0891b2",tier:"core"},{id:"forest",name:"Forest",hue:145,swatchBg:"#059669",tier:"core"},{id:"sunset",name:"Sunset",hue:25,swatchBg:"#ea580c",tier:"core"},{id:"rose",name:"Rose",hue:350,swatchBg:"#e11d48",tier:"core"},{id:"lavender",name:"Lavender",hue:280,swatchBg:"#a855f7",tier:"core"},{id:"coral",name:"Coral",hue:15,swatchBg:"#f97316",tier:"core"},{id:"slate",name:"Slate",hue:220,swatchBg:"#64748b",tier:"core"},{id:"emerald",name:"Emerald",hue:160,swatchBg:"#10b981",tier:"core"},{id:"amber",name:"Amber",hue:45,swatchBg:"#f59e0b",tier:"core"},{id:"indigo",name:"Indigo",hue:250,swatchBg:"#6366f1",tier:"core"}],x=[{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1",tier:"core"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a",tier:"core"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e",tier:"core"}],O=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white",tier:"showcase",category:"Design"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5",tier:"showcase",category:"Design"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C",tier:"showcase",category:"Design"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227",tier:"showcase",category:"Content"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7",tier:"showcase",category:"Modern"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6",tier:"showcase",category:"Creative"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a",tier:"showcase",category:"Creative"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88",tier:"showcase",category:"Creative"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5",tier:"showcase",category:"Aesthetic"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0",tier:"showcase",category:"Aesthetic"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946",tier:"showcase",category:"Aesthetic"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D",tier:"showcase",category:"Aesthetic"},{id:"alpha1999",name:"Alpha1999",icon:"orbit",character:"Space retro-fi",swatchBg:"#0a0a14",swatchFg:"#d4880f",tier:"showcase",category:"Signature"},{id:"super2026",name:"Super2026",icon:"triangle",character:"Supergraphic bold",swatchBg:"#f5f0e6",swatchFg:"#c23616",tier:"showcase",category:"Signature"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0",tier:"showcase",category:"OS Styles"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521",tier:"showcase",category:"OS Styles"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00",tier:"showcase",category:"OS Styles"},{id:"magna",name:"Magna",icon:"orbit",character:"Odyssey 2 retro",swatchBg:"#0d0b14",swatchFg:"#f97316",tier:"showcase",category:"OS Styles"}],v=[{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1",tier:"community",category:"Editor Palettes"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2",tier:"community",category:"Editor Palettes"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9",tier:"community",category:"Editor Palettes"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7",tier:"community",category:"Editor Palettes"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef",tier:"community",category:"Editor Palettes"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6",tier:"community",category:"Editor Palettes"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6",tier:"community",category:"Editor Palettes"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2",tier:"community",category:"Editor Palettes"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7",tier:"community",category:"Editor Palettes"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba",tier:"community",category:"Editor Palettes"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d",tier:"community",category:"Niche"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00",tier:"community",category:"Niche"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6",tier:"community",category:"Industry"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c",tier:"community",category:"Industry"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30",tier:"community",category:"Industry"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574",tier:"community",category:"Mood/Time"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858",tier:"community",category:"Mood/Time"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff",tier:"community",category:"Mood/Time"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946",tier:"community",category:"Mood/Time"}],Y=[{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4",tier:"showcase",category:"Packs"},{id:"retro",name:"Retro",icon:"tv",character:"CRT terminal",swatchBg:"#0a0a14",swatchFg:"#00ff66",tier:"showcase",category:"Packs"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold patterns",swatchBg:"#FFF8F0",swatchFg:"#d03040",tier:"showcase",category:"Packs"}],P=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}],L=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}],D=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}],we=[...O,...v],be=[...B,...x,...O,...v,...Y],p=e=>O.filter(t=>t.category===e),H=[{label:"Colors",themes:B,tier:"core"},{label:"Style",themes:x,tier:"core"},{label:"Design",themes:p("Design"),tier:"showcase"},{label:"Content",themes:p("Content"),tier:"showcase"},{label:"Modern",themes:p("Modern"),tier:"showcase"},{label:"Creative",themes:p("Creative"),tier:"showcase"},{label:"Aesthetic",themes:p("Aesthetic"),tier:"showcase"},{label:"Signature",themes:p("Signature"),tier:"showcase"},{label:"OS Styles",themes:p("OS Styles"),tier:"showcase"},{label:"Packs",themes:Y,tier:"showcase"},{label:"More Themes",themes:v,tier:"community"}];var w=null,X="vb-extensions",E={motionFx:!0,sounds:!1},Q="vb-a11y-themes",R=class e extends T{static#n=200;#t;#e;#s=!1;#a=!1;#m=!1;#o=null;#p=!1;#i=()=>this.#w();setup(){this.#a=this.getAttribute("variant")==="inline",this.#m=this.hasAttribute("compact"),this.#b(),this.#_(),this.#y(),this.listen(window,"vb:theme-change",this.#P),this.#f(),this.#d()}teardown(){window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.#u()}#b(){this.#a||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#a||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#v(),this.appendChild(this.#e)}#v(){return this.#m?this.#S():this.#E()}#r(t,s){let n=t.swatchBg,i=t.swatchFg||"white",a=t.icon||"";return`
      <label class="swatch-cell" title="${t.character?`${t.name} \u2014 ${t.character}`:t.name}">
        <input
          type="radio"
          name="theme-brand"
          value="${t.id}"
          ${s===t.id?"checked":""}
        />
        <span class="swatch-visual" style="--swatch-bg: ${n}; --swatch-fg: ${i}">
          ${a?`<icon-wc name="${a}"></icon-wc>`:""}
          <span class="sr-only">${t.name}</span>
        </span>
      </label>
    `}#E(){let{mode:t,brand:s,fluid:n}=m.getState(),i=H.filter(a=>a.tier==="showcase");return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${F.map(a=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${a.id}"
                ${t===a.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${a.icon}"></icon-wc>
                <span>${a.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Colors</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Color theme">
          ${B.map(a=>this.#r(a,s)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Style</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Style">
          ${x.map(a=>this.#r(a,s)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Featured</legend>
        ${i.map(a=>`
          <div class="theme-category">
            <span class="category-label">${a.label}</span>
            <div class="options options--swatch-grid">
              ${a.themes.map(o=>this.#r(o,s)).join("")}
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
          ${v.map(a=>this.#r(a,s)).join("")}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${L.map(a=>{let r=this.#l().includes(a.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${a.id}"
                data-a11y-theme="${a.id}"
                ${r?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${a.icon}"></icon-wc>
                <span class="option-label">${a.name}</span>
              </span>
            </label>
          `}).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <div class="options options--sizing" role="radiogroup" aria-label="Fluid sizing">
          ${P.map(a=>`
            <label class="option option--sizing">
              <input
                type="radio"
                name="theme-fluid"
                value="${a.id}"
                ${n===a.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${a.icon}"></icon-wc>
                <span class="option-text">
                  <span>${a.name}</span>
                  <small>${a.description}</small>
                </span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <details class="section section--extensions" ${this.#p?"open":""}>
        <summary class="extensions-toggle">
          <icon-wc name="sliders-horizontal"></icon-wc>
          <span>Extensions</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="extensions-content">
          ${D.map(a=>{let r=this.#c()[a.id]??E[a.id];return`
            <label class="extension-toggle">
              <span class="extension-info">
                <icon-wc name="${a.icon}"></icon-wc>
                <span class="extension-name">${a.name}</span>
              </span>
              <input
                type="checkbox"
                name="ext-${a.id}"
                data-extension="${a.id}"
                data-switch="sm"
                ${r?"checked":""}
              />
            </label>
          `}).join("")}
        </div>
      </details>
    `}#S(){let{mode:t,brand:s,fluid:n}=m.getState(),i=this.#l(),a=this.#c();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${F.map(o=>`
            <label class="compact-seg">
              <input type="radio" name="theme-mode" value="${o.id}" ${t===o.id?"checked":""} />
              <span><icon-wc name="${o.icon}" size="xs"></icon-wc> ${o.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${H.map(o=>`
            <optgroup label="${o.label}">
              ${o.themes.map(r=>`
                <option value="${r.id}" ${s===r.id?"selected":""}>${r.name}</option>
              `).join("")}
            </optgroup>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="Sizing">
          ${P.map(o=>`
            <option value="${o.id}" ${n===o.id?"selected":""}>${o.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${L.map(o=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${o.name}</span>
              </span>
              <input type="checkbox" name="a11y-theme" value="${o.id}" data-a11y-theme="${o.id}" data-switch="sm" ${i.includes(o.id)?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Extensions</legend>
        <div class="compact-toggles">
          ${D.map(o=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${o.name}</span>
              </span>
              <input type="checkbox" name="ext-${o.id}" data-extension="${o.id}" data-switch="sm" ${a[o.id]??E[o.id]?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#_(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(i=>{i.addEventListener("change",this.#x)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(i=>{i.addEventListener("change",this.#M)});let t=this.#e.querySelector('select[name="theme-brand-select"]');t&&t.addEventListener("change",this.#k),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(i=>{i.addEventListener("change",this.#g)});let s=this.#e.querySelector('select[name="theme-fluid-select"]');s&&s.addEventListener("change",this.#g),this.#e.querySelectorAll("input[data-extension]").forEach(i=>{i.addEventListener("change",this.#C)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(i=>{i.addEventListener("change",this.#O)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",i=>{this.#p=i.target.open}),this.#a||(this.listen(this.#t,"click",this.#T),this.listen(document,"click",this.#$),this.listen(document,"keydown",this.#B))}#T=t=>{t.stopPropagation(),this.toggle()};#$=t=>{this.#s&&!this.contains(t.target)&&this.close()};#B=t=>{t.key==="Escape"&&this.#s&&(t.preventDefault(),this.close(),this.#t?.focus())};#x=t=>{m.setMode(t.target.value),this.#h()};#M=async t=>{let s=t.target.closest(".swatch-cell");s&&s.setAttribute("aria-busy","true");try{await m.setBrand(t.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{s&&s.removeAttribute("aria-busy")}this.#d(),this.#h()};#k=async t=>{let s=t.target;s.disabled=!0;try{await m.setBrand(s.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{s.disabled=!1}this.#d(),this.#h()};#g=t=>{m.setFluid(t.target.value),this.#h()};#C=t=>{let s=t.target.dataset.extension,n=t.target.checked;this.#A(s,n),this.#f()};#c(){try{let t=localStorage.getItem(X);return t?{...E,...JSON.parse(t)}:{...E}}catch{return{...E}}}#A(t,s){try{let n=this.#c();n[t]=s,localStorage.setItem(X,JSON.stringify(n))}catch{}}async#f(){let t=this.#c(),s=document.documentElement;t.motionFx?delete s.dataset.motionReduced:s.dataset.motionReduced="",t.sounds?(w||(w=(await Promise.resolve().then(()=>(W(),K))).SoundManager),w.init(),w.enable()):w&&w.disable(),window.dispatchEvent(new CustomEvent("vb:extensions-change",{detail:t}))}#l(){try{let t=localStorage.getItem(Q);return t?JSON.parse(t):[]}catch{return[]}}#F(t){try{localStorage.setItem(Q,JSON.stringify(t))}catch{}}#d(){let t=this.#l(),{brand:s}=m.getState(),n=document.documentElement,i=s==="default"?t.join(" "):[s,...t].join(" "),a=n.dataset.theme||"";i!==a&&(i?n.dataset.theme=i:delete n.dataset.theme)}#O=t=>{let s=t.target.dataset.a11yTheme,n=t.target.checked,i=this.#l();if(n&&!i.includes(s))i.push(s);else if(!n&&i.includes(s)){let a=i.indexOf(s);i.splice(a,1)}this.#F(i),this.#d()};#h(){this.#a||(this.#u(),this.#o=setTimeout(()=>{this.close(),this.#t?.focus()},e.#n))}#u(){this.#o&&(clearTimeout(this.#o),this.#o=null)}#P=()=>{this.#y()};#y(){let{mode:t,brand:s,fluid:n}=m.getState(),i=this.#e.querySelector(`input[name="theme-mode"][value="${t}"]`);i&&(i.checked=!0);let a=this.#e.querySelector(`input[name="theme-brand"][value="${s}"]`);a&&(a.checked=!0);let o=this.#e.querySelector('select[name="theme-brand-select"]');o&&(o.value=s);let r=this.#e.querySelector(`input[name="theme-fluid"][value="${n}"]`);r&&(r.checked=!0);let d=this.#e.querySelector('select[name="theme-fluid-select"]');d&&(d.value=n)}open(){this.#a||this.#s||(this.#s=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#w(),window.addEventListener("scroll",this.#i,{capture:!0,passive:!0}),window.addEventListener("resize",this.#i,{passive:!0}),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#w(){if(!this.#t||!this.#e)return;let t=this.#t.getBoundingClientRect(),s=this.#e.getBoundingClientRect(),n=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},i=n.height,a=n.width,o=8,r=16,d=i-t.bottom-r,h=t.top-r,l=t.height+o;d<s.height&&h>d?(l=-s.height-o,this.#e.dataset.position="top"):delete this.#e.dataset.position;let u=0,c=t.left+s.width+r,j=t.left+u;c>a&&(u=a-c),j+u<r&&(u=r-t.left),this.#e.style.setProperty("--panel-top",`${l}px`),this.#e.style.setProperty("--panel-left",`${u}px`)}close(){this.#a||!this.#s||(this.#u(),this.#s=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#s?this.close():this.open()}get isOpen(){return this.#s}};G("theme-picker",R);var Z="vb-environment",q={timeOfDay:!1,seasonal:!1},de=900*1e3;function g(e,t,s){return e+(t-e)*Math.min(1,Math.max(0,s))}var ee={_timer:null,_baseHues:null,_timeOverride:null,_monthOverride:null,init(){let e=this.load();(e.timeOfDay||e.seasonal)&&(this._captureBaseHues(),this._update(),this._startLoop()),window.addEventListener("vb:theme-change",()=>{this._hasActiveSource()&&requestAnimationFrame(()=>{this._captureBaseHues(),this._update()})})},load(){try{let e=localStorage.getItem(Z);return e?{...q,...JSON.parse(e)}:{...q}}catch{return{...q}}},save(e){try{localStorage.setItem(Z,JSON.stringify(e))}catch{}return e},setTimeOverride(e){this._timeOverride=e,this._hasActiveSource()&&this._update()},setMonthOverride(e){this._monthOverride=e,this._hasActiveSource()&&this._update()},setSource(e,t){let s={...this.load(),[e]:t};this.save(s),t?(this._captureBaseHues(),this._update(),this._startLoop()):this._hasActiveSource(s)?this._update():(this._clearModifiers(),this._stopLoop())},_hasActiveSource(e){let t=e||this.load();return t.timeOfDay||t.seasonal},_captureBaseHues(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent");let t=e.getAttribute("data-theme");if(t){let s=`[data-theme~="${t}"]`;for(let n of document.styleSheets)try{for(let i=0;i<n.cssRules.length;i++){let a=n.cssRules[i];if(a.selectorText?.includes(s)&&!a.selectorText.includes("dark")){let o=a.style?.getPropertyValue("--hue-primary");if(o){this._baseHues={primary:parseFloat(o)||260,secondary:parseFloat(a.style.getPropertyValue("--hue-secondary"))||200,accent:parseFloat(a.style.getPropertyValue("--hue-accent"))||30};return}}}}catch{}}this._baseHues={primary:260,secondary:200,accent:30}},_update(){let e=this.load(),t=0;e.timeOfDay&&(t+=this._getTimeOfDayOffset()),e.seasonal&&(t+=this._getSeasonalOffset());let s=document.documentElement;t!==0&&this._baseHues?(s.style.setProperty("--hue-primary",String(this._baseHues.primary+t)),s.style.setProperty("--hue-secondary",String(this._baseHues.secondary+t)),s.style.setProperty("--hue-accent",String(this._baseHues.accent+t*.5))):t===0&&this._clearModifiers()},_clearModifiers(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent")},_getTimeOfDayOffset(){let e=this._timeOverride??new Date().getHours()+new Date().getMinutes()/60;return e<5?-20:e<7?g(-20,20,(e-5)/2):e<10?g(20,5,(e-7)/3):e<14?g(5,0,(e-10)/4):e<17?g(0,-5,(e-14)/3):e<19?g(-5,15,(e-17)/2):e<21?g(15,-10,(e-19)/2):g(-10,-20,(e-21)/8)},_getHemisphere(){return window.__VB_ENV_LOCATION?.hemisphere||"north"},_getSeasonalOffset(){let e=this._monthOverride??new Date().getMonth(),s=this._getHemisphere()==="south"?(e+6)%12:e;return s>=2&&s<=4?5:s>=5&&s<=7?10:s>=8&&s<=10?-5:-10},_startLoop(){this._timer||(this._timer=setInterval(()=>this._update(),de))},_stopLoop(){this._timer&&clearInterval(this._timer),this._timer=null}};ee.init();
//# sourceMappingURL=ui.full.js.map
