var me=Object.defineProperty;var pe=(e,t)=>()=>(e&&(t=e(e=0)),t);var fe=(e,t)=>{for(var a in t)me(e,a,{get:t[a],enumerable:!0})};var ce={};fe(ce,{SoundManager:()=>_e});var oe,Y,_e,le=pe(()=>{oe="vb-sound",Y={enabled:!1,volume:.5},_e={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let e=this._load();return this._enabled=e.enabled,this._volume=e.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let e=localStorage.getItem(oe);return e?{...Y,...JSON.parse(e)}:{...Y}}catch{return{...Y}}},_save(e){try{let t=this._load();localStorage.setItem(oe,JSON.stringify({...t,...e}))}catch{}},_playTone(e,t,a="sine"){if(!this._enabled)return;let s=this._getContext(),r=s.createOscillator(),n=s.createGain();r.connect(n),n.connect(s.destination),r.frequency.value=e,r.type=a,n.gain.value=this._volume*.3,r.start(),n.gain.exponentialRampToValueAtTime(.01,s.currentTime+t),r.stop(s.currentTime+t)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(e){this._volume=Math.max(0,Math.min(1,e)),this._save({volume:this._volume})},getVolume(){return this._volume},play(e){if(this._enabled)switch(e){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var ke=window.matchMedia("(prefers-reduced-motion: reduce)");var Q=new Map;function Z(e,t,a={}){let s=a.priority??10,r={impl:t,bundle:a.bundle,contract:a.contract,priority:s},n=Q.get(e);if(customElements.get(e)){if(!n||n.priority>=s){n&&n.priority===s&&n.impl!==t&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${a.bundle}".`);return}console.warn(`[VB Bundle] Tag <${e}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${a.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=s){n.priority===s&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${n.bundle}". Skipping "${a.bundle}" (first wins at equal priority).`);return}Q.set(e,r),customElements.define(e,t)}var C=class extends HTMLElement{#n=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#n)t();this.#n=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,a,s,r){t.addEventListener(a,s,r),this.#n.push(()=>t.removeEventListener(a,s,r))}setup(){}teardown(){}setState(t,a){this.#t||(this.#t=this.attachInternals());let s=this.#t.states;try{a?s.add(t):s.delete(t)}catch{let r=`--${t}`;a?s.add(r):s.delete(r)}}_adoptInternals(t){this.#t||(this.#t=t)}};var b=new Map,R=new Map;var ee=null;function te(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(ee)return ee;if(typeof document<"u"){let e=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let t of e){let a=t.getAttribute("src");if(a){let s=a.lastIndexOf("/");if(s!==-1)return a.slice(0,s)}}}return"/cdn"}var ge=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","modern","minimal","classic"]),ye=new Set(["kawaii","memphis"]);function H(e){return ye.has(e)}function we(e,t){return`${t}/themes/${e}.css`}function ae(e,t){if(!H(e))return Promise.resolve();if(R.has(e))return R.get(e);let a=import(`${t}/packs/${e}.full.js`).catch(()=>{});return R.set(e,a),a}function be(e,t){let a=te(),s=()=>{(H(t)||e.hasAttribute("data-vb-pack"))&&ae(t,a)};return e.getAttribute("data-vb-theme-state")==="error"?Promise.reject(new Error(`Failed to load theme: ${t}`)):e.getAttribute("data-vb-theme-state")==="ready"||e.sheet?(s(),Promise.resolve()):new Promise((r,n)=>{let i=()=>{e.setAttribute("data-vb-theme-state","ready"),c(),s(),r()},o=()=>{e.setAttribute("data-vb-theme-state","error"),b.delete(t),c(),n(new Error(`Failed to load theme: ${t}`))},c=()=>{e.removeEventListener("load",i),e.removeEventListener("error",o)};e.addEventListener("load",i,{once:!0}),e.addEventListener("error",o,{once:!0})})}async function T(e){if(!e||ge.has(e))return;if(b.has(e))return b.get(e);if(typeof document<"u"){let s=document.querySelector(`link[data-vb-theme="${e}"]`);if(s){let r=be(s,e);return b.set(e,r),r}}let t=te(),a=H(e)?Ee(e,t):ve(e,t);return b.set(e,a),a}async function ve(e,t){let a=we(e,t);return new Promise((s,r)=>{let n=document.querySelector(`link[data-vb-theme-preload="${e}"]`);n&&n.remove();let i=document.createElement("link");i.rel="stylesheet",i.href=a,i.setAttribute("data-vb-theme",e),i.setAttribute("data-vb-theme-state","loading"),i.onload=()=>{i.setAttribute("data-vb-theme-state","ready"),s()},i.onerror=()=>{i.setAttribute("data-vb-theme-state","error"),i.remove(),b.delete(e),r(new Error(`Failed to load theme: ${e}`))},document.head.appendChild(i)})}function Ee(e,t){let a=`${t}/packs/${e}.theme.css`,s=`${t}/packs/${e}.effects.css`;return new Promise((r,n)=>{let i=document.querySelector(`link[data-vb-theme-preload="${e}"]`);i&&i.remove();let o=document.createElement("link");o.rel="stylesheet",o.href=a,o.setAttribute("data-vb-theme",e),o.setAttribute("data-vb-pack",e),o.setAttribute("data-vb-theme-state","loading"),o.onload=()=>{o.setAttribute("data-vb-theme-state","ready");let c=document.createElement("link");c.rel="stylesheet",c.href=s,c.setAttribute("data-vb-pack-effects",e),document.head.appendChild(c),ae(e,t),r()},o.onerror=()=>{o.setAttribute("data-vb-theme-state","error"),o.remove(),b.delete(e),n(new Error(`Failed to load pack: ${e}`))},document.head.appendChild(o)})}var q=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}],k=[{id:"default",name:"Default",swatchBg:"#3b82f6",seeds:{}},{id:"ocean",name:"Ocean",swatchBg:"#0891b2",seeds:{"--hue-primary":200,"--hue-secondary":180,"--hue-accent":45,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"45%","--chroma-secondary":.1,"--lightness-accent":"70%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"forest",name:"Forest",swatchBg:"#059669",seeds:{"--hue-primary":145,"--hue-secondary":90,"--hue-accent":30,"--lightness-primary":"45%","--chroma-primary":.15,"--lightness-secondary":"55%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"55%","--chroma-primary":.12}},{id:"sunset",name:"Sunset",swatchBg:"#ea580c",seeds:{"--hue-primary":25,"--hue-secondary":0,"--hue-accent":280,"--lightness-primary":"60%","--chroma-primary":.2,"--lightness-secondary":"55%","--chroma-secondary":.18,"--lightness-accent":"55%","--chroma-accent":.18},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.16}},{id:"rose",name:"Rose",swatchBg:"#e11d48",seeds:{"--hue-primary":350,"--hue-secondary":330,"--hue-accent":200,"--lightness-primary":"55%","--chroma-primary":.18,"--lightness-secondary":"50%","--chroma-secondary":.14,"--lightness-accent":"60%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.14}},{id:"lavender",name:"Lavender",swatchBg:"#a855f7",seeds:{"--hue-primary":280,"--hue-secondary":300,"--hue-accent":60,"--lightness-primary":"55%","--chroma-primary":.14,"--lightness-secondary":"50%","--chroma-secondary":.12,"--lightness-accent":"70%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.12}},{id:"coral",name:"Coral",swatchBg:"#f97316",seeds:{"--hue-primary":15,"--hue-secondary":25,"--hue-accent":180,"--lightness-primary":"60%","--chroma-primary":.18,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"55%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.15}},{id:"slate",name:"Slate",swatchBg:"#64748b",seeds:{"--hue-primary":220,"--hue-secondary":210,"--hue-accent":45,"--lightness-primary":"48%","--chroma-primary":.1,"--lightness-secondary":"45%","--chroma-secondary":.06,"--lightness-accent":"68%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.08}},{id:"emerald",name:"Emerald",swatchBg:"#10b981",seeds:{"--hue-primary":160,"--hue-secondary":140,"--hue-accent":30,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"48%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"amber",name:"Amber",swatchBg:"#f59e0b",seeds:{"--hue-primary":45,"--hue-secondary":30,"--hue-accent":240,"--lightness-primary":"60%","--chroma-primary":.16,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"52%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"68%","--chroma-primary":.14}},{id:"indigo",name:"Indigo",swatchBg:"#6366f1",seeds:{"--hue-primary":250,"--hue-secondary":270,"--hue-accent":35,"--lightness-primary":"48%","--chroma-primary":.18,"--lightness-secondary":"45%","--chroma-secondary":.14,"--lightness-accent":"68%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"62%","--chroma-primary":.14}}],M=[{id:"default",name:"Default",hue:210,shape:"balanced",character:"The default",swatchBg:"#3b82f6",tier:"core"},{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1",tier:"core"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a",tier:"core"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e",tier:"core"}],j=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white",tier:"showcase",category:"Design"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5",tier:"showcase",category:"Design"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C",tier:"showcase",category:"Design"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227",tier:"showcase",category:"Content"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7",tier:"showcase",category:"Modern"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6",tier:"showcase",category:"Creative"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a",tier:"showcase",category:"Creative"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88",tier:"showcase",category:"Creative"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5",tier:"showcase",category:"Aesthetic"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0",tier:"showcase",category:"Aesthetic"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946",tier:"showcase",category:"Aesthetic"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D",tier:"showcase",category:"Aesthetic"},{id:"alpha1999",name:"Alpha1999",icon:"orbit",character:"Space retro-fi",swatchBg:"#0a0a14",swatchFg:"#d4880f",tier:"showcase",category:"Signature"},{id:"super2026",name:"Super2026",icon:"triangle",character:"Supergraphic bold",swatchBg:"#f5f0e6",swatchFg:"#c23616",tier:"showcase",category:"Signature"},{id:"magna",name:"Magna",icon:"orbit",character:"Odyssey 2 retro",swatchBg:"#0d0b14",swatchFg:"#f97316",tier:"showcase",category:"Signature"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0",tier:"showcase",category:"OS Styles"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521",tier:"showcase",category:"OS Styles"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00",tier:"showcase",category:"OS Styles"}],A=[{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1",tier:"community",category:"Editor Palettes"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2",tier:"community",category:"Editor Palettes"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9",tier:"community",category:"Editor Palettes"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7",tier:"community",category:"Editor Palettes"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef",tier:"community",category:"Editor Palettes"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6",tier:"community",category:"Editor Palettes"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6",tier:"community",category:"Editor Palettes"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2",tier:"community",category:"Editor Palettes"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7",tier:"community",category:"Editor Palettes"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba",tier:"community",category:"Editor Palettes"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d",tier:"community",category:"Niche"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00",tier:"community",category:"Niche"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6",tier:"community",category:"Industry"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c",tier:"community",category:"Industry"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30",tier:"community",category:"Industry"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574",tier:"community",category:"Mood/Time"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858",tier:"community",category:"Mood/Time"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff",tier:"community",category:"Mood/Time"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946",tier:"community",category:"Mood/Time"}],se=[{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4",tier:"showcase",category:"Packs"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold patterns",swatchBg:"#FFF8F0",swatchFg:"#d03040",tier:"showcase",category:"Packs"}],V=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}],z=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}],G=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}],Ce=[...j,...A],Me=[...M,...j,...A,...se],v=e=>j.filter(t=>t.category===e),N=[{label:"Style",themes:M,tier:"core"},{label:"Design",themes:v("Design"),tier:"showcase"},{label:"Content",themes:v("Content"),tier:"showcase"},{label:"Modern",themes:v("Modern"),tier:"showcase"},{label:"Creative",themes:v("Creative"),tier:"showcase"},{label:"Aesthetic",themes:v("Aesthetic"),tier:"showcase"},{label:"Signature",themes:v("Signature"),tier:"showcase"},{label:"OS Styles",themes:v("OS Styles"),tier:"showcase"},{label:"Packs",themes:se,tier:"showcase"},{label:"More Themes",themes:A,tier:"community"}];function Se(){let e=globalThis.localStorage;if(!e)throw new Error("VBStore: localStorage is not available in this environment");return{async getRaw(t){return e.getItem(t)},async setRaw(t,a){e.setItem(t,a)},async removeRaw(t){e.removeItem(t)},async keys(t){let a=[];for(let s=0;s<e.length;s++){let r=e.key(s);r&&r.startsWith(t)&&a.push(r)}return a}}}var F=null;function f(){return F||(F=Se()),F}function U(e,t){if(typeof e!="string"||!e)throw new TypeError("VBStore: namespace must be a non-empty string");if(typeof t!="string"||!t)throw new TypeError("VBStore: key must be a non-empty string");return`vb:${e}:${t}`}function ie(e){if(typeof e!="string"||!e)throw new TypeError("VBStore: namespace must be a non-empty string");return`vb:${e}:`}function ne(e){try{let t=JSON.parse(e);if(t&&typeof t=="object"&&typeof t.timestamp=="number")return t}catch{}return null}var h={configure(e={}){F=e.backend??null},async set(e,t,a){let s={data:a,timestamp:Date.now()};await f().setRaw(U(e,t),JSON.stringify(s))},async get(e,t,a){let s=await f().getRaw(U(e,t));if(s==null)return null;let r=ne(s);return!r||a?.maxAge!=null&&Date.now()-r.timestamp>a.maxAge?null:r.data},async remove(e,t){await f().removeRaw(U(e,t))},async list(e){let t=ie(e),a=await f().keys(t),s=[];for(let r of a){let n=await f().getRaw(r);if(n==null)continue;let i=ne(n);i&&s.push({key:r.slice(t.length),data:i.data,timestamp:i.timestamp})}return s},async clear(e){let t=ie(e),a=await f().keys(t);for(let s of a)await f().removeRaw(s)},async clearAll(){let e=await f().keys("vb:");for(let t of e)await f().removeRaw(t)},async setMany(e,t){for(let[a,s]of t)await h.set(e,a,s)}};var P="theme",O="current",E={mode:"auto",brand:"default",accent:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},re=["--hue-primary","--hue-secondary","--hue-accent","--lightness-primary","--chroma-primary","--lightness-secondary","--chroma-secondary","--lightness-accent","--chroma-accent"],d=null,u={_initPromise:null,async init(){return this._initPromise?this._initPromise:(this._initPromise=(async()=>{let e=await h.get(P,O);d=e?{...E,...e}:{...E};try{await T(d.brand)}catch{d.brand="default"}return this.apply(d),this._watchSystemPreference(),this._watchRootAttributes(),this._watchCrossDocumentStorage(),d})(),this._initPromise)},_watchCrossDocumentStorage(){typeof window>"u"||window.addEventListener("storage",async e=>{if(e.key!==`vb:${P}:${O}`||!e.newValue)return;let t;try{t=JSON.parse(e.newValue)?.data}catch{return}if(!t||typeof t!="object")return;let a={...E,...d,...t};if(a.brand&&a.brand!==d?.brand)try{await T(a.brand)}catch{a.brand="default"}d=a,this.apply(d)})},load(){return d?{...d}:{...E}},save(e){let t={...d??E,...e};return d=t,h.set(P,O,t).catch(()=>{}),t},apply({mode:e="auto",brand:t="default",borderStyle:a="",iconSet:s="",fluid:r="",backdrop:n="",backdropChrome:i="",pageBgType:o="",pageBgColor:c="",pageBgGradStart:p="",pageBgGradEnd:m="",pageBgGradDir:g=""}={}){let l=document.documentElement;l.dataset.mode=e==="auto"?this.getEffectiveMode():e;let $=(l.dataset.theme||"").split(" ").filter(I=>I.startsWith("a11y-")),K=t!=="default"?[t,...$]:[...$];K.length?l.dataset.theme=K.join(" "):delete l.dataset.theme;let B=a||this._readCSSHint("--theme-border-style");B&&B!=="clean"?l.dataset.borderStyle=B:delete l.dataset.borderStyle;let x=s||this._readCSSHint("--theme-icon-set");if(x&&x!=="lucide"?l.dataset.iconSet=x:delete l.dataset.iconSet,r?l.dataset.fluid=r:delete l.dataset.fluid,n?l.dataset.backdrop=n:delete l.dataset.backdrop,i&&i!=="card"?l.dataset.backdropChrome=i:delete l.dataset.backdropChrome,o==="color"&&c)l.style.setProperty("--page-bg-color",c),l.style.removeProperty("--page-bg-gradient");else if(o==="gradient"&&p&&m){let I=g||"to bottom";l.style.setProperty("--page-bg-gradient",`linear-gradient(${I}, ${p}, ${m})`),l.style.removeProperty("--page-bg-color")}else l.style.removeProperty("--page-bg-color"),l.style.removeProperty("--page-bg-gradient");let J=this.load().accent||"default";this._applyAccent(J),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:e,brand:t,accent:J,borderStyle:B,iconSet:x,fluid:r,backdrop:n,backdropChrome:i,pageBgType:o,effectiveMode:this.getEffectiveMode()}}))},setMode(e){let t=this.save({mode:e});this.apply(t)},async setBrand(e){try{await T(e)}catch(a){console.warn(`[VB] Theme "${e}" failed to load, using default`,a),e="default"}let t=this.save({brand:e});this.apply(t)},setAccent(e){this.save({accent:e}),this._applyAccent(e),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{...this.getState()}}))},setBorderStyle(e){let t=this.save({borderStyle:e});this.apply(t)},setIconSet(e){let t=this.save({iconSet:e});this.apply(t)},setFluid(e){let t=this.save({fluid:e});this.apply(t)},setBackdrop(e){let t=this.save({backdrop:e});this.apply(t)},setBackdropChrome(e){let t=this.save({backdropChrome:e});this.apply(t)},setPageBg({type:e="",color:t="",gradStart:a="",gradEnd:s="",gradDir:r=""}={}){let n=this.save({pageBgType:e,pageBgColor:t,pageBgGradStart:a,pageBgGradEnd:s,pageBgGradDir:r});this.apply(n)},getEffectiveMode(){let{mode:e}=this.load();return e!=="auto"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:e,brand:t,accent:a,borderStyle:s,iconSet:r,fluid:n,backdrop:i,backdropChrome:o,pageBgType:c,pageBgColor:p,pageBgGradStart:m,pageBgGradEnd:g,pageBgGradDir:l}=this.load();return{mode:e,brand:t,accent:a,borderStyle:s,iconSet:r,fluid:n,backdrop:i,backdropChrome:o,pageBgType:c,pageBgColor:p,pageBgGradStart:m,pageBgGradEnd:g,pageBgGradDir:l,effectiveMode:this.getEffectiveMode()}},toggleMode(){let t=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(t)},reset(){d={...E},h.remove(P,O).catch(()=>{});let e=document.documentElement;e.style.removeProperty("--page-bg-color"),e.style.removeProperty("--page-bg-gradient");for(let t of re)e.style.removeProperty(t);this.apply(E)},_readCSSHint(e){return getComputedStyle(document.documentElement).getPropertyValue(e).trim()},_applyAccent(e){let t=document.documentElement,a=k.find(s=>s.id===e);for(let s of re)t.style.removeProperty(s);if(!(!a||!a.seeds||Object.keys(a.seeds).length===0)){for(let[s,r]of Object.entries(a.seeds))t.style.setProperty(s,String(r));if(a.seedsDark&&this.getEffectiveMode()==="dark")for(let[s,r]of Object.entries(a.seedsDark))t.style.setProperty(s,String(r))}},_watchRootAttributes(){this._rootObserver||(this._rootObserver=new MutationObserver(e=>{for(let t of e)t.attributeName==="data-theme"?this._syncFromDataTheme():t.attributeName==="data-mode"&&this._syncFromDataMode()}),this._rootObserver.observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme","data-mode"]}))},_syncFromDataTheme(){if(!d)return;let a=(document.documentElement.dataset.theme||"").split(/\s+/).filter(Boolean).find(s=>!s.startsWith("a11y-"))||"default";a!==d.brand&&(d.brand=a,T(a).catch(()=>{}),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{...this.getState()}})))},_syncFromDataMode(){if(!d)return;let e=document.documentElement.dataset.mode||"auto",t=d.mode==="auto"?this.getEffectiveMode():d.mode;e!==t&&(d.mode=e,window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{...this.getState()}})))},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let t=this.load();t.mode==="auto"&&this.apply(t)})}};var _=null,D="settings",L={motionFx:!0,sounds:!1},W=class e extends C{static#n=200;#t;#e;#a=!1;#s=!1;#f=!1;#c=null;#g=!1;#l=[];#r={...L};#i=()=>this.#E();async setup(){this.#s=this.getAttribute("variant")==="inline",this.#f=this.hasAttribute("compact"),await Promise.all([u.init(),this.#S()]),this.#_(),this.#A(),this.#v(),this.listen(window,"vb:theme-change",this.#R),this.#b(),this.#h()}async#S(){let[t,a]=await Promise.all([h.get(D,"a11y"),h.get(D,"extensions")]);this.#l=Array.isArray(t)?t:[],this.#r={...L,...a??{}}}teardown(){window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.#p()}#_(){this.#s||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#s||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#$(),this.appendChild(this.#e)}#$(){return this.#f?this.#k():this.#T()}#u(t,a){let s=t.swatchBg,r=t.swatchFg||"white",n=t.icon||"";return`
      <label class="swatch-cell" title="${t.character?`${t.name} \u2014 ${t.character}`:t.name}">
        <input
          type="radio"
          name="theme-brand"
          value="${t.id}"
          ${a===t.id?"checked":""}
        />
        <span class="swatch-visual" style="--swatch-bg: ${s}; --swatch-fg: ${r}">
          ${n?`<icon-wc name="${n}"></icon-wc>`:""}
          <span class="visually-hidden">${t.name}</span>
        </span>
      </label>
    `}#T(){let{mode:t,brand:a,fluid:s,accent:r}=u.getState(),n=N.filter(i=>i.tier==="showcase");return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${q.map(i=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${i.id}"
                ${t===i.id?"checked":""}
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
        <legend>Color Accent</legend>
        <div class="options options--accent-dots" role="radiogroup" aria-label="Color accent">
          ${k.map(i=>`
            <label class="accent-dot" title="${i.name}">
              <input type="radio" name="theme-accent" value="${i.id}" ${r===i.id?"checked":""} />
              <span class="accent-dot-visual" style="background: ${i.swatchBg}"></span>
              <span class="visually-hidden">${i.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Style</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Style">
          ${M.map(i=>this.#u(i,a)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Featured</legend>
        ${n.map(i=>`
          <div class="theme-category">
            <span class="category-label">${i.label}</span>
            <div class="options options--swatch-grid">
              ${i.themes.map(o=>this.#u(o,a)).join("")}
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
          ${A.map(i=>this.#u(i,a)).join("")}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${z.map(i=>{let c=this.#d().includes(i.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${i.id}"
                data-a11y-theme="${i.id}"
                ${c?"checked":""}
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
          ${V.map(i=>`
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

      <details class="section section--extensions" ${this.#g?"open":""}>
        <summary class="extensions-toggle">
          <icon-wc name="sliders-horizontal"></icon-wc>
          <span>Extensions</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="extensions-content">
          ${G.map(i=>{let c=this.#m()[i.id]??L[i.id];return`
            <label class="extension-toggle">
              <span class="extension-info">
                <icon-wc name="${i.icon}"></icon-wc>
                <span class="extension-name">${i.name}</span>
              </span>
              <input
                type="checkbox"
                name="ext-${i.id}"
                data-extension="${i.id}"
                data-switch="sm"
                ${c?"checked":""}
              />
            </label>
          `}).join("")}
        </div>
      </details>
    `}#k(){let{mode:t,brand:a,fluid:s,accent:r}=u.getState(),n=this.#d(),i=this.#m();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${q.map(o=>`
            <label class="compact-seg">
              <input type="radio" name="theme-mode" value="${o.id}" ${t===o.id?"checked":""} />
              <span class="compact-seg-visual">
                <icon-wc name="${o.icon}" size="xs"></icon-wc>
                <span class="compact-seg-label">${o.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Color Accent</legend>
        <select class="compact-select" name="theme-accent-select" aria-label="Color accent">
          ${k.map(o=>`
            <option value="${o.id}" ${r===o.id?"selected":""}>${o.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${N.map(o=>`
            <optgroup label="${o.label}">
              ${o.themes.map(c=>`
                <option value="${c.id}" ${a===c.id?"selected":""}>${c.name}</option>
              `).join("")}
            </optgroup>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="Sizing">
          ${V.map(o=>`
            <option value="${o.id}" ${s===o.id?"selected":""}>${o.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${z.map(o=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${o.name}</span>
              </span>
              <input type="checkbox" name="a11y-theme" value="${o.id}" data-a11y-theme="${o.id}" data-switch="sm" ${n.includes(o.id)?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Extensions</legend>
        <div class="compact-toggles">
          ${G.map(o=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${o.name}</span>
              </span>
              <input type="checkbox" name="ext-${o.id}" data-extension="${o.id}" data-switch="sm" ${i[o.id]??L[o.id]?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#A(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(n=>{n.addEventListener("change",this.#M)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(n=>{n.addEventListener("change",this.#F)});let t=this.#e.querySelector('select[name="theme-brand-select"]');t&&t.addEventListener("change",this.#P),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(n=>{n.addEventListener("change",this.#y)});let a=this.#e.querySelector('select[name="theme-fluid-select"]');a&&a.addEventListener("change",this.#y),this.#e.querySelectorAll('input[name="theme-accent"]').forEach(n=>{n.addEventListener("change",this.#w)});let s=this.#e.querySelector('select[name="theme-accent-select"]');s&&s.addEventListener("change",this.#w),this.#e.querySelectorAll("input[data-extension]").forEach(n=>{n.addEventListener("change",this.#O)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(n=>{n.addEventListener("change",this.#I)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",n=>{this.#g=n.target.open}),this.#s||(this.listen(this.#t,"click",this.#B),this.listen(document,"click",this.#x),this.listen(document,"keydown",this.#C))}#B=t=>{t.stopPropagation(),this.toggle()};#x=t=>{this.#a&&!this.contains(t.target)&&this.close()};#C=t=>{t.key==="Escape"&&this.#a&&(t.preventDefault(),this.close(),this.#t?.focus())};#M=t=>{u.setMode(t.target.value),this.#o()};#F=async t=>{let a=t.target.closest(".swatch-cell");a&&a.setAttribute("aria-busy","true");try{await u.setBrand(t.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a&&a.removeAttribute("aria-busy")}this.#h(),this.#o()};#P=async t=>{let a=t.target;a.disabled=!0;try{await u.setBrand(a.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a.disabled=!1}this.#h(),this.#o()};#y=t=>{u.setFluid(t.target.value),this.#o()};#w=t=>{u.setAccent(t.target.value),this.#o()};#O=t=>{let a=t.target.dataset.extension,s=t.target.checked;this.#D(a,s),this.#b()};#m(){return{...this.#r}}#D(t,a){this.#r={...this.#r,[t]:a},h.set(D,"extensions",this.#r).catch(()=>{})}async#b(){let t=this.#m(),a=document.documentElement;t.motionFx?delete a.dataset.motionReduced:a.dataset.motionReduced="",t.sounds?(_||(_=(await Promise.resolve().then(()=>(le(),ce))).SoundManager),_.init(),_.enable()):_&&_.disable(),window.dispatchEvent(new CustomEvent("vb:extensions-change",{detail:t}))}#d(){return[...this.#l]}#L(t){this.#l=[...t],h.set(D,"a11y",this.#l).catch(()=>{})}#h(){let t=this.#d(),{brand:a}=u.getState(),s=document.documentElement,r=a==="default"?t.join(" "):[a,...t].join(" "),n=s.dataset.theme||"";r!==n&&(r?s.dataset.theme=r:delete s.dataset.theme)}#I=t=>{let a=t.target.dataset.a11yTheme,s=t.target.checked,r=this.#d();if(s&&!r.includes(a))r.push(a);else if(!s&&r.includes(a)){let n=r.indexOf(a);r.splice(n,1)}this.#L(r),this.#h()};#o(){this.#s||(this.#p(),this.#c=setTimeout(()=>{this.close(),this.#t?.focus()},e.#n))}#p(){this.#c&&(clearTimeout(this.#c),this.#c=null)}#R=()=>{this.#v()};#v(){let{mode:t,brand:a,fluid:s,accent:r}=u.getState(),n=this.#e.querySelector(`input[name="theme-mode"][value="${t}"]`);n&&(n.checked=!0);let i=this.#e.querySelector(`input[name="theme-brand"][value="${a}"]`);i&&(i.checked=!0);let o=this.#e.querySelector('select[name="theme-brand-select"]');o&&(o.value=a);let c=this.#e.querySelector(`input[name="theme-fluid"][value="${s}"]`);c&&(c.checked=!0);let p=this.#e.querySelector('select[name="theme-fluid-select"]');p&&(p.value=s);let m=this.#e.querySelector(`input[name="theme-accent"][value="${r||"default"}"]`);m&&(m.checked=!0);let g=this.#e.querySelector('select[name="theme-accent-select"]');g&&(g.value=r||"default")}open(){this.#s||this.#a||(this.#a=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#E(),window.addEventListener("scroll",this.#i,{capture:!0,passive:!0}),window.addEventListener("resize",this.#i,{passive:!0}),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#E(){if(!this.#t||!this.#e)return;let t=this.#t.getBoundingClientRect(),a=this.#e.getBoundingClientRect(),s=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},r=s.height,n=s.width,i=8,o=16,c=r-t.bottom-o,p=t.top-o,m=t.height+i;c<a.height&&p>c?(m=-a.height-i,this.#e.dataset.position="top"):delete this.#e.dataset.position;let g=n-t.right,l=t.right-a.width;if(this.#e.style.setProperty("--panel-top",`${m}px`),l<o){let w=0,$=t.left+a.width+o;$>n&&(w=n-$),t.left+w<o&&(w=o-t.left),this.#e.style.setProperty("--panel-left",`${w}px`),this.#e.style.setProperty("--panel-right","auto")}else{let w=Math.max(0,o-g);this.#e.style.setProperty("--panel-left","auto"),this.#e.style.setProperty("--panel-right",`${w}px`)}}close(){this.#s||!this.#a||(this.#p(),this.#a=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}};Z("theme-picker",W);var de="environment",he="preferences",X={timeOfDay:!1,seasonal:!1},$e=900*1e3,y={...X};function S(e,t,a){return e+(t-e)*Math.min(1,Math.max(0,a))}var ue={_timer:null,_baseHues:null,_timeOverride:null,_monthOverride:null,async init(){let e=await h.get(de,he);y=e?{...X,...e}:{...X},(y.timeOfDay||y.seasonal)&&(this._captureBaseHues(),this._update(),this._startLoop()),window.addEventListener("vb:theme-change",()=>{this._hasActiveSource()&&requestAnimationFrame(()=>{this._captureBaseHues(),this._update()})})},load(){return{...y}},save(e){return y={...y,...e},h.set(de,he,y).catch(()=>{}),{...y}},setTimeOverride(e){this._timeOverride=e,this._hasActiveSource()&&this._update()},setMonthOverride(e){this._monthOverride=e,this._hasActiveSource()&&this._update()},setSource(e,t){let a=this.save({[e]:t});t?(this._captureBaseHues(),this._update(),this._startLoop()):this._hasActiveSource(a)?this._update():(this._clearModifiers(),this._stopLoop())},_hasActiveSource(e){let t=e||this.load();return t.timeOfDay||t.seasonal},_captureBaseHues(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent");let t=e.getAttribute("data-theme");if(t){let a=`[data-theme~="${t}"]`;for(let s of document.styleSheets)try{for(let r=0;r<s.cssRules.length;r++){let n=s.cssRules[r];if(n.selectorText?.includes(a)&&!n.selectorText.includes("dark")){let i=n.style?.getPropertyValue("--hue-primary");if(i){this._baseHues={primary:parseFloat(i)||260,secondary:parseFloat(n.style.getPropertyValue("--hue-secondary"))||200,accent:parseFloat(n.style.getPropertyValue("--hue-accent"))||30};return}}}}catch{}}this._baseHues={primary:260,secondary:200,accent:30}},_update(){let e=this.load(),t=0;e.timeOfDay&&(t+=this._getTimeOfDayOffset()),e.seasonal&&(t+=this._getSeasonalOffset());let a=document.documentElement;t!==0&&this._baseHues?(a.style.setProperty("--hue-primary",String(this._baseHues.primary+t)),a.style.setProperty("--hue-secondary",String(this._baseHues.secondary+t)),a.style.setProperty("--hue-accent",String(this._baseHues.accent+t*.5))):t===0&&this._clearModifiers()},_clearModifiers(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent")},_getTimeOfDayOffset(){let e=this._timeOverride??new Date().getHours()+new Date().getMinutes()/60;return e<5?-20:e<7?S(-20,20,(e-5)/2):e<10?S(20,5,(e-7)/3):e<14?S(5,0,(e-10)/4):e<17?S(0,-5,(e-14)/3):e<19?S(-5,15,(e-17)/2):e<21?S(15,-10,(e-19)/2):S(-10,-20,(e-21)/8)},_getHemisphere(){return window.__VB_ENV_LOCATION?.hemisphere||"north"},_getSeasonalOffset(){let e=this._monthOverride??new Date().getMonth(),a=this._getHemisphere()==="south"?(e+6)%12:e;return a>=2&&a<=4?5:a>=5&&a<=7?10:a>=8&&a<=10?-5:-10},_startLoop(){this._timer||(this._timer=setInterval(()=>this._update(),$e))},_stopLoop(){this._timer&&clearInterval(this._timer),this._timer=null}};ue.init();
//# sourceMappingURL=ui.full.js.map
