var oe=Object.defineProperty;var ce=(t,e)=>()=>(t&&(e=t(t=0)),e);var le=(t,e)=>{for(var a in e)oe(t,a,{get:e[a],enumerable:!0})};var ie={};le(ie,{SoundManager:()=>ye});var ne,z,ye,re=ce(()=>{ne="vb-sound",z={enabled:!1,volume:.5},ye={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let t=this._load();return this._enabled=t.enabled,this._volume=t.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let t=localStorage.getItem(ne);return t?{...z,...JSON.parse(t)}:{...z}}catch{return{...z}}},_save(t){try{let e=this._load();localStorage.setItem(ne,JSON.stringify({...e,...t}))}catch{}},_playTone(t,e,a="sine"){if(!this._enabled)return;let s=this._getContext(),r=s.createOscillator(),i=s.createGain();r.connect(i),i.connect(s.destination),r.frequency.value=t,r.type=a,i.gain.value=this._volume*.3,r.start(),i.gain.exponentialRampToValueAtTime(.01,s.currentTime+e),r.stop(s.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(t){this._volume=Math.max(0,Math.min(1,t)),this._save({volume:this._volume})},getVolume(){return this._volume},play(t){if(this._enabled)switch(t){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var be=window.matchMedia("(prefers-reduced-motion: reduce)");var W=new Map;function K(t,e,a={}){let s=a.priority??10,r={impl:e,bundle:a.bundle,contract:a.contract,priority:s},i=W.get(t);if(customElements.get(t)){if(!i||i.priority>=s){i&&i.priority===s&&i.impl!==e&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${i.bundle}" (priority ${i.priority}). Skipping "${a.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${i.bundle}" cannot be replaced (customElements.define is permanent). "${a.bundle}" has higher priority but arrived late.`);return}if(i&&i.priority>=s){i.priority===s&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${i.bundle}". Skipping "${a.bundle}" (first wins at equal priority).`);return}W.set(t,r),customElements.define(t,e)}var T=class extends HTMLElement{#i=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let e of this.#i)e();this.#i=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,a,s,r){e.addEventListener(a,s,r),this.#i.push(()=>e.removeEventListener(a,s,r))}setup(){}teardown(){}};var y=new Map,_=new Map;var J=null;function Q(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(J)return J;if(typeof document<"u"){let t=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of t){let a=e.getAttribute("src");if(a){let s=a.lastIndexOf("/");if(s!==-1)return a.slice(0,s)}}}return"/cdn"}var de=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","modern","minimal","classic"]),he=new Set(["kawaii","memphis"]);function F(t){return he.has(t)}function me(t,e){return`${e}/themes/${t}.css`}function Z(t,e){if(!F(t))return Promise.resolve();if(_.has(t))return _.get(t);let a=import(`${e}/packs/${t}.full.js`).catch(()=>{});return _.set(t,a),a}function ue(t,e){let a=Q(),s=()=>{(F(e)||t.hasAttribute("data-vb-pack"))&&Z(e,a)};return t.getAttribute("data-vb-theme-state")==="error"?Promise.reject(new Error(`Failed to load theme: ${e}`)):t.getAttribute("data-vb-theme-state")==="ready"||t.sheet?(s(),Promise.resolve()):new Promise((r,i)=>{let n=()=>{t.setAttribute("data-vb-theme-state","ready"),c(),s(),r()},o=()=>{t.setAttribute("data-vb-theme-state","error"),y.delete(e),c(),i(new Error(`Failed to load theme: ${e}`))},c=()=>{t.removeEventListener("load",n),t.removeEventListener("error",o)};t.addEventListener("load",n,{once:!0}),t.addEventListener("error",o,{once:!0})})}async function P(t){if(!t||de.has(t))return;if(y.has(t))return y.get(t);if(typeof document<"u"){let s=document.querySelector(`link[data-vb-theme="${t}"]`);if(s){let r=ue(s,t);return y.set(t,r),r}}let e=Q(),a=F(t)?ge(t,e):pe(t,e);return y.set(t,a),a}async function pe(t,e){let a=me(t,e);return new Promise((s,r)=>{let i=document.querySelector(`link[data-vb-theme-preload="${t}"]`);i&&i.remove();let n=document.createElement("link");n.rel="stylesheet",n.href=a,n.setAttribute("data-vb-theme",t),n.setAttribute("data-vb-theme-state","loading"),n.onload=()=>{n.setAttribute("data-vb-theme-state","ready"),s()},n.onerror=()=>{n.setAttribute("data-vb-theme-state","error"),n.remove(),y.delete(t),r(new Error(`Failed to load theme: ${t}`))},document.head.appendChild(n)})}function ge(t,e){let a=`${e}/packs/${t}.theme.css`,s=`${e}/packs/${t}.effects.css`;return new Promise((r,i)=>{let n=document.querySelector(`link[data-vb-theme-preload="${t}"]`);n&&n.remove();let o=document.createElement("link");o.rel="stylesheet",o.href=a,o.setAttribute("data-vb-theme",t),o.setAttribute("data-vb-pack",t),o.setAttribute("data-vb-theme-state","loading"),o.onload=()=>{o.setAttribute("data-vb-theme-state","ready");let c=document.createElement("link");c.rel="stylesheet",c.href=s,c.setAttribute("data-vb-pack-effects",t),document.head.appendChild(c),Z(t,e),r()},o.onerror=()=>{o.setAttribute("data-vb-theme-state","error"),o.remove(),y.delete(t),i(new Error(`Failed to load pack: ${t}`))},document.head.appendChild(o)})}var L=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}],E=[{id:"default",name:"Default",swatchBg:"#3b82f6",seeds:{}},{id:"ocean",name:"Ocean",swatchBg:"#0891b2",seeds:{"--hue-primary":200,"--hue-secondary":180,"--hue-accent":45,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"45%","--chroma-secondary":.1,"--lightness-accent":"70%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"forest",name:"Forest",swatchBg:"#059669",seeds:{"--hue-primary":145,"--hue-secondary":90,"--hue-accent":30,"--lightness-primary":"45%","--chroma-primary":.15,"--lightness-secondary":"55%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"55%","--chroma-primary":.12}},{id:"sunset",name:"Sunset",swatchBg:"#ea580c",seeds:{"--hue-primary":25,"--hue-secondary":0,"--hue-accent":280,"--lightness-primary":"60%","--chroma-primary":.2,"--lightness-secondary":"55%","--chroma-secondary":.18,"--lightness-accent":"55%","--chroma-accent":.18},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.16}},{id:"rose",name:"Rose",swatchBg:"#e11d48",seeds:{"--hue-primary":350,"--hue-secondary":330,"--hue-accent":200,"--lightness-primary":"55%","--chroma-primary":.18,"--lightness-secondary":"50%","--chroma-secondary":.14,"--lightness-accent":"60%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.14}},{id:"lavender",name:"Lavender",swatchBg:"#a855f7",seeds:{"--hue-primary":280,"--hue-secondary":300,"--hue-accent":60,"--lightness-primary":"55%","--chroma-primary":.14,"--lightness-secondary":"50%","--chroma-secondary":.12,"--lightness-accent":"70%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.12}},{id:"coral",name:"Coral",swatchBg:"#f97316",seeds:{"--hue-primary":15,"--hue-secondary":25,"--hue-accent":180,"--lightness-primary":"60%","--chroma-primary":.18,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"55%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.15}},{id:"slate",name:"Slate",swatchBg:"#64748b",seeds:{"--hue-primary":220,"--hue-secondary":210,"--hue-accent":45,"--lightness-primary":"48%","--chroma-primary":.1,"--lightness-secondary":"45%","--chroma-secondary":.06,"--lightness-accent":"68%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.08}},{id:"emerald",name:"Emerald",swatchBg:"#10b981",seeds:{"--hue-primary":160,"--hue-secondary":140,"--hue-accent":30,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"48%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"amber",name:"Amber",swatchBg:"#f59e0b",seeds:{"--hue-primary":45,"--hue-secondary":30,"--hue-accent":240,"--lightness-primary":"60%","--chroma-primary":.16,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"52%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"68%","--chroma-primary":.14}},{id:"indigo",name:"Indigo",swatchBg:"#6366f1",seeds:{"--hue-primary":250,"--hue-secondary":270,"--hue-accent":35,"--lightness-primary":"48%","--chroma-primary":.18,"--lightness-secondary":"45%","--chroma-secondary":.14,"--lightness-accent":"68%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"62%","--chroma-primary":.14}}],B=[{id:"default",name:"Default",hue:210,shape:"balanced",character:"The default",swatchBg:"#3b82f6",tier:"core"},{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1",tier:"core"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a",tier:"core"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e",tier:"core"}],D=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white",tier:"showcase",category:"Design"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5",tier:"showcase",category:"Design"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C",tier:"showcase",category:"Design"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227",tier:"showcase",category:"Content"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7",tier:"showcase",category:"Modern"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6",tier:"showcase",category:"Creative"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a",tier:"showcase",category:"Creative"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88",tier:"showcase",category:"Creative"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5",tier:"showcase",category:"Aesthetic"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0",tier:"showcase",category:"Aesthetic"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946",tier:"showcase",category:"Aesthetic"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D",tier:"showcase",category:"Aesthetic"},{id:"alpha1999",name:"Alpha1999",icon:"orbit",character:"Space retro-fi",swatchBg:"#0a0a14",swatchFg:"#d4880f",tier:"showcase",category:"Signature"},{id:"super2026",name:"Super2026",icon:"triangle",character:"Supergraphic bold",swatchBg:"#f5f0e6",swatchFg:"#c23616",tier:"showcase",category:"Signature"},{id:"magna",name:"Magna",icon:"orbit",character:"Odyssey 2 retro",swatchBg:"#0d0b14",swatchFg:"#f97316",tier:"showcase",category:"Signature"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0",tier:"showcase",category:"OS Styles"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521",tier:"showcase",category:"OS Styles"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00",tier:"showcase",category:"OS Styles"}],S=[{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1",tier:"community",category:"Editor Palettes"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2",tier:"community",category:"Editor Palettes"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9",tier:"community",category:"Editor Palettes"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7",tier:"community",category:"Editor Palettes"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef",tier:"community",category:"Editor Palettes"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6",tier:"community",category:"Editor Palettes"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6",tier:"community",category:"Editor Palettes"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2",tier:"community",category:"Editor Palettes"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7",tier:"community",category:"Editor Palettes"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba",tier:"community",category:"Editor Palettes"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d",tier:"community",category:"Niche"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00",tier:"community",category:"Niche"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6",tier:"community",category:"Industry"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c",tier:"community",category:"Industry"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30",tier:"community",category:"Industry"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574",tier:"community",category:"Mood/Time"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858",tier:"community",category:"Mood/Time"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff",tier:"community",category:"Mood/Time"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946",tier:"community",category:"Mood/Time"}],ee=[{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4",tier:"showcase",category:"Packs"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold patterns",swatchBg:"#FFF8F0",swatchFg:"#d03040",tier:"showcase",category:"Packs"}],O=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}],I=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}],R=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}],$e=[...D,...S],ke=[...B,...D,...S,...ee],w=t=>D.filter(e=>e.category===t),q=[{label:"Style",themes:B,tier:"core"},{label:"Design",themes:w("Design"),tier:"showcase"},{label:"Content",themes:w("Content"),tier:"showcase"},{label:"Modern",themes:w("Modern"),tier:"showcase"},{label:"Creative",themes:w("Creative"),tier:"showcase"},{label:"Aesthetic",themes:w("Aesthetic"),tier:"showcase"},{label:"Signature",themes:w("Signature"),tier:"showcase"},{label:"OS Styles",themes:w("OS Styles"),tier:"showcase"},{label:"Packs",themes:ee,tier:"showcase"},{label:"More Themes",themes:S,tier:"community"}];function fe(){let t=globalThis.localStorage;if(!t)throw new Error("VBStore: localStorage is not available in this environment");return{async getRaw(e){return t.getItem(e)},async setRaw(e,a){t.setItem(e,a)},async removeRaw(e){t.removeItem(e)},async keys(e){let a=[];for(let s=0;s<t.length;s++){let r=t.key(s);r&&r.startsWith(e)&&a.push(r)}return a}}}var A=null;function f(){return A||(A=fe()),A}function H(t,e){if(typeof t!="string"||!t)throw new TypeError("VBStore: namespace must be a non-empty string");if(typeof e!="string"||!e)throw new TypeError("VBStore: key must be a non-empty string");return`vb:${t}:${e}`}function te(t){if(typeof t!="string"||!t)throw new TypeError("VBStore: namespace must be a non-empty string");return`vb:${t}:`}function ae(t){try{let e=JSON.parse(t);if(e&&typeof e=="object"&&typeof e.timestamp=="number")return e}catch{}return null}var m={configure(t={}){A=t.backend??null},async set(t,e,a){let s={data:a,timestamp:Date.now()};await f().setRaw(H(t,e),JSON.stringify(s))},async get(t,e,a){let s=await f().getRaw(H(t,e));if(s==null)return null;let r=ae(s);return!r||a?.maxAge!=null&&Date.now()-r.timestamp>a.maxAge?null:r.data},async remove(t,e){await f().removeRaw(H(t,e))},async list(t){let e=te(t),a=await f().keys(e),s=[];for(let r of a){let i=await f().getRaw(r);if(i==null)continue;let n=ae(i);n&&s.push({key:r.slice(e.length),data:n.data,timestamp:n.timestamp})}return s},async clear(t){let e=te(t),a=await f().keys(e);for(let s of a)await f().removeRaw(s)},async clearAll(){let t=await f().keys("vb:");for(let e of t)await f().removeRaw(e)},async setMany(t,e){for(let[a,s]of e)await m.set(t,a,s)}};var j="theme",V="current",b={mode:"auto",brand:"default",accent:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},se=["--hue-primary","--hue-secondary","--hue-accent","--lightness-primary","--chroma-primary","--lightness-secondary","--chroma-secondary","--lightness-accent","--chroma-accent"],u=null,p={_initPromise:null,async init(){return this._initPromise?this._initPromise:(this._initPromise=(async()=>{let t=await m.get(j,V);u=t?{...b,...t}:{...b};try{await P(u.brand)}catch{u.brand="default"}return this.apply(u),this._watchSystemPreference(),u})(),this._initPromise)},load(){return u?{...u}:{...b}},save(t){let e={...u??b,...t};return u=e,m.set(j,V,e).catch(()=>{}),e},apply({mode:t="auto",brand:e="default",borderStyle:a="",iconSet:s="",fluid:r="",backdrop:i="",backdropChrome:n="",pageBgType:o="",pageBgColor:c="",pageBgGradStart:g="",pageBgGradEnd:h="",pageBgGradDir:d=""}={}){let l=document.documentElement;l.dataset.mode=t==="auto"?this.getEffectiveMode():t;let Y=(l.dataset.theme||"").split(" ").filter(M=>M.startsWith("a11y-")),X=e!=="default"?[e,...Y]:[...Y];X.length?l.dataset.theme=X.join(" "):delete l.dataset.theme;let $=a||this._readCSSHint("--theme-border-style");$&&$!=="clean"?l.dataset.borderStyle=$:delete l.dataset.borderStyle;let k=s||this._readCSSHint("--theme-icon-set");if(k&&k!=="lucide"?l.dataset.iconSet=k:delete l.dataset.iconSet,r?l.dataset.fluid=r:delete l.dataset.fluid,i?l.dataset.backdrop=i:delete l.dataset.backdrop,n&&n!=="card"?l.dataset.backdropChrome=n:delete l.dataset.backdropChrome,o==="color"&&c)l.style.setProperty("--page-bg-color",c),l.style.removeProperty("--page-bg-gradient");else if(o==="gradient"&&g&&h){let M=d||"to bottom";l.style.setProperty("--page-bg-gradient",`linear-gradient(${M}, ${g}, ${h})`),l.style.removeProperty("--page-bg-color")}else l.style.removeProperty("--page-bg-color"),l.style.removeProperty("--page-bg-gradient");let N=this.load().accent||"default";this._applyAccent(N),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:t,brand:e,accent:N,borderStyle:$,iconSet:k,fluid:r,backdrop:i,backdropChrome:n,pageBgType:o,effectiveMode:this.getEffectiveMode()}}))},setMode(t){let e=this.save({mode:t});this.apply(e)},async setBrand(t){try{await P(t)}catch(a){console.warn(`[VB] Theme "${t}" failed to load, using default`,a),t="default"}let e=this.save({brand:t});this.apply(e)},setAccent(t){this.save({accent:t}),this._applyAccent(t),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{...this.getState()}}))},setBorderStyle(t){let e=this.save({borderStyle:t});this.apply(e)},setIconSet(t){let e=this.save({iconSet:t});this.apply(e)},setFluid(t){let e=this.save({fluid:t});this.apply(e)},setBackdrop(t){let e=this.save({backdrop:t});this.apply(e)},setBackdropChrome(t){let e=this.save({backdropChrome:t});this.apply(e)},setPageBg({type:t="",color:e="",gradStart:a="",gradEnd:s="",gradDir:r=""}={}){let i=this.save({pageBgType:t,pageBgColor:e,pageBgGradStart:a,pageBgGradEnd:s,pageBgGradDir:r});this.apply(i)},getEffectiveMode(){let{mode:t}=this.load();return t!=="auto"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:t,brand:e,accent:a,borderStyle:s,iconSet:r,fluid:i,backdrop:n,backdropChrome:o,pageBgType:c,pageBgColor:g,pageBgGradStart:h,pageBgGradEnd:d,pageBgGradDir:l}=this.load();return{mode:t,brand:e,accent:a,borderStyle:s,iconSet:r,fluid:i,backdrop:n,backdropChrome:o,pageBgType:c,pageBgColor:g,pageBgGradStart:h,pageBgGradEnd:d,pageBgGradDir:l,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){u={...b},m.remove(j,V).catch(()=>{});let t=document.documentElement;t.style.removeProperty("--page-bg-color"),t.style.removeProperty("--page-bg-gradient");for(let e of se)t.style.removeProperty(e);this.apply(b)},_readCSSHint(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()},_applyAccent(t){let e=document.documentElement,a=E.find(s=>s.id===t);for(let s of se)e.style.removeProperty(s);if(!(!a||!a.seeds||Object.keys(a.seeds).length===0)){for(let[s,r]of Object.entries(a.seeds))e.style.setProperty(s,String(r));if(a.seedsDark&&this.getEffectiveMode()==="dark")for(let[s,r]of Object.entries(a.seedsDark))e.style.setProperty(s,String(r))}},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let e=this.load();e.mode==="auto"&&this.apply(e)})}};var v=null,C="settings",x={motionFx:!0,sounds:!1},G=class t extends T{static#i=200;#t;#e;#a=!1;#s=!1;#g=!1;#c=null;#f=!1;#l=[];#r={...x};#n=()=>this.#E();async setup(){this.#s=this.getAttribute("variant")==="inline",this.#g=this.hasAttribute("compact"),await this.#S(),this.#$(),this.#A(),this.#v(),this.listen(window,"vb:theme-change",this.#R),this.#b(),this.#h()}async#S(){let[e,a]=await Promise.all([m.get(C,"a11y"),m.get(C,"extensions")]);this.#l=Array.isArray(e)?e:[],this.#r={...x,...a??{}}}teardown(){window.removeEventListener("scroll",this.#n,{capture:!0}),window.removeEventListener("resize",this.#n),this.#p()}#$(){this.#s||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#s||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#k(),this.appendChild(this.#e)}#k(){return this.#g?this.#B():this.#T()}#m(e,a){let s=e.swatchBg,r=e.swatchFg||"white",i=e.icon||"";return`
      <label class="swatch-cell" title="${e.character?`${e.name} \u2014 ${e.character}`:e.name}">
        <input
          type="radio"
          name="theme-brand"
          value="${e.id}"
          ${a===e.id?"checked":""}
        />
        <span class="swatch-visual" style="--swatch-bg: ${s}; --swatch-fg: ${r}">
          ${i?`<icon-wc name="${i}"></icon-wc>`:""}
          <span class="sr-only">${e.name}</span>
        </span>
      </label>
    `}#T(){let{mode:e,brand:a,fluid:s,accent:r}=p.getState(),i=q.filter(n=>n.tier==="showcase");return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${L.map(n=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${n.id}"
                ${e===n.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${n.icon}"></icon-wc>
                <span>${n.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Color Accent</legend>
        <div class="options options--accent-dots" role="radiogroup" aria-label="Color accent">
          ${E.map(n=>`
            <label class="accent-dot" title="${n.name}">
              <input type="radio" name="theme-accent" value="${n.id}" ${r===n.id?"checked":""} />
              <span class="accent-dot-visual" style="background: ${n.swatchBg}"></span>
              <span class="sr-only">${n.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Style</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Style">
          ${B.map(n=>this.#m(n,a)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Featured</legend>
        ${i.map(n=>`
          <div class="theme-category">
            <span class="category-label">${n.label}</span>
            <div class="options options--swatch-grid">
              ${n.themes.map(o=>this.#m(o,a)).join("")}
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
          ${S.map(n=>this.#m(n,a)).join("")}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${I.map(n=>{let c=this.#d().includes(n.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${n.id}"
                data-a11y-theme="${n.id}"
                ${c?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${n.icon}"></icon-wc>
                <span class="option-label">${n.name}</span>
              </span>
            </label>
          `}).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <div class="options options--sizing" role="radiogroup" aria-label="Fluid sizing">
          ${O.map(n=>`
            <label class="option option--sizing">
              <input
                type="radio"
                name="theme-fluid"
                value="${n.id}"
                ${s===n.id?"checked":""}
              />
              <span class="option-content">
                <icon-wc name="${n.icon}"></icon-wc>
                <span class="option-text">
                  <span>${n.name}</span>
                  <small>${n.description}</small>
                </span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <details class="section section--extensions" ${this.#f?"open":""}>
        <summary class="extensions-toggle">
          <icon-wc name="sliders-horizontal"></icon-wc>
          <span>Extensions</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="extensions-content">
          ${R.map(n=>{let c=this.#u()[n.id]??x[n.id];return`
            <label class="extension-toggle">
              <span class="extension-info">
                <icon-wc name="${n.icon}"></icon-wc>
                <span class="extension-name">${n.name}</span>
              </span>
              <input
                type="checkbox"
                name="ext-${n.id}"
                data-extension="${n.id}"
                data-switch="sm"
                ${c?"checked":""}
              />
            </label>
          `}).join("")}
        </div>
      </details>
    `}#B(){let{mode:e,brand:a,fluid:s,accent:r}=p.getState(),i=this.#d(),n=this.#u();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${L.map(o=>`
            <label class="compact-seg">
              <input type="radio" name="theme-mode" value="${o.id}" ${e===o.id?"checked":""} />
              <span><icon-wc name="${o.icon}" size="xs"></icon-wc> ${o.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Color Accent</legend>
        <select class="compact-select" name="theme-accent-select" aria-label="Color accent">
          ${E.map(o=>`
            <option value="${o.id}" ${r===o.id?"selected":""}>${o.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${q.map(o=>`
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
          ${O.map(o=>`
            <option value="${o.id}" ${s===o.id?"selected":""}>${o.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${I.map(o=>`
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
          ${R.map(o=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${o.name}</span>
              </span>
              <input type="checkbox" name="ext-${o.id}" data-extension="${o.id}" data-switch="sm" ${n[o.id]??x[o.id]?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#A(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(i=>{i.addEventListener("change",this.#_)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(i=>{i.addEventListener("change",this.#F)});let e=this.#e.querySelector('select[name="theme-brand-select"]');e&&e.addEventListener("change",this.#P),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(i=>{i.addEventListener("change",this.#y)});let a=this.#e.querySelector('select[name="theme-fluid-select"]');a&&a.addEventListener("change",this.#y),this.#e.querySelectorAll('input[name="theme-accent"]').forEach(i=>{i.addEventListener("change",this.#w)});let s=this.#e.querySelector('select[name="theme-accent-select"]');s&&s.addEventListener("change",this.#w),this.#e.querySelectorAll("input[data-extension]").forEach(i=>{i.addEventListener("change",this.#L)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(i=>{i.addEventListener("change",this.#I)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",i=>{this.#f=i.target.open}),this.#s||(this.listen(this.#t,"click",this.#C),this.listen(document,"click",this.#x),this.listen(document,"keydown",this.#M))}#C=e=>{e.stopPropagation(),this.toggle()};#x=e=>{this.#a&&!this.contains(e.target)&&this.close()};#M=e=>{e.key==="Escape"&&this.#a&&(e.preventDefault(),this.close(),this.#t?.focus())};#_=e=>{p.setMode(e.target.value),this.#o()};#F=async e=>{let a=e.target.closest(".swatch-cell");a&&a.setAttribute("aria-busy","true");try{await p.setBrand(e.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a&&a.removeAttribute("aria-busy")}this.#h(),this.#o()};#P=async e=>{let a=e.target;a.disabled=!0;try{await p.setBrand(a.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a.disabled=!1}this.#h(),this.#o()};#y=e=>{p.setFluid(e.target.value),this.#o()};#w=e=>{p.setAccent(e.target.value),this.#o()};#L=e=>{let a=e.target.dataset.extension,s=e.target.checked;this.#D(a,s),this.#b()};#u(){return{...this.#r}}#D(e,a){this.#r={...this.#r,[e]:a},m.set(C,"extensions",this.#r).catch(()=>{})}async#b(){let e=this.#u(),a=document.documentElement;e.motionFx?delete a.dataset.motionReduced:a.dataset.motionReduced="",e.sounds?(v||(v=(await Promise.resolve().then(()=>(re(),ie))).SoundManager),v.init(),v.enable()):v&&v.disable(),window.dispatchEvent(new CustomEvent("vb:extensions-change",{detail:e}))}#d(){return[...this.#l]}#O(e){this.#l=[...e],m.set(C,"a11y",this.#l).catch(()=>{})}#h(){let e=this.#d(),{brand:a}=p.getState(),s=document.documentElement,r=a==="default"?e.join(" "):[a,...e].join(" "),i=s.dataset.theme||"";r!==i&&(r?s.dataset.theme=r:delete s.dataset.theme)}#I=e=>{let a=e.target.dataset.a11yTheme,s=e.target.checked,r=this.#d();if(s&&!r.includes(a))r.push(a);else if(!s&&r.includes(a)){let i=r.indexOf(a);r.splice(i,1)}this.#O(r),this.#h()};#o(){this.#s||(this.#p(),this.#c=setTimeout(()=>{this.close(),this.#t?.focus()},t.#i))}#p(){this.#c&&(clearTimeout(this.#c),this.#c=null)}#R=()=>{this.#v()};#v(){let{mode:e,brand:a,fluid:s,accent:r}=p.getState(),i=this.#e.querySelector(`input[name="theme-mode"][value="${e}"]`);i&&(i.checked=!0);let n=this.#e.querySelector(`input[name="theme-brand"][value="${a}"]`);n&&(n.checked=!0);let o=this.#e.querySelector('select[name="theme-brand-select"]');o&&(o.value=a);let c=this.#e.querySelector(`input[name="theme-fluid"][value="${s}"]`);c&&(c.checked=!0);let g=this.#e.querySelector('select[name="theme-fluid-select"]');g&&(g.value=s);let h=this.#e.querySelector(`input[name="theme-accent"][value="${r||"default"}"]`);h&&(h.checked=!0);let d=this.#e.querySelector('select[name="theme-accent-select"]');d&&(d.value=r||"default")}open(){this.#s||this.#a||(this.#a=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#E(),window.addEventListener("scroll",this.#n,{capture:!0,passive:!0}),window.addEventListener("resize",this.#n,{passive:!0}),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#E(){if(!this.#t||!this.#e)return;let e=this.#t.getBoundingClientRect(),a=this.#e.getBoundingClientRect(),s=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},r=s.height,i=s.width,n=8,o=16,c=r-e.bottom-o,g=e.top-o,h=e.height+n;c<a.height&&g>c?(h=-a.height-n,this.#e.dataset.position="top"):delete this.#e.dataset.position;let d=0,l=e.left+a.width+o,U=e.left+d;l>i&&(d=i-l),U+d<o&&(d=o-e.left),this.#e.style.setProperty("--panel-top",`${h}px`),this.#e.style.setProperty("--panel-left",`${d}px`)}close(){this.#s||!this.#a||(this.#p(),this.#a=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),window.removeEventListener("scroll",this.#n,{capture:!0}),window.removeEventListener("resize",this.#n),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}};K("theme-picker",G);export{G as ThemePicker};
//# sourceMappingURL=theme-picker.js.map
