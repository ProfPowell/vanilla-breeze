var ie=Object.defineProperty;var ne=(e,t)=>()=>(e&&(t=e(e=0)),t);var re=(e,t)=>{for(var a in t)ie(e,a,{get:t[a],enumerable:!0})};var Q={};re(Q,{SoundManager:()=>me});var X,I,me,Z=ne(()=>{X="vb-sound",I={enabled:!1,volume:.5},me={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let e=this._load();return this._enabled=e.enabled,this._volume=e.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let e=localStorage.getItem(X);return e?{...I,...JSON.parse(e)}:{...I}}catch{return{...I}}},_save(e){try{let t=this._load();localStorage.setItem(X,JSON.stringify({...t,...e}))}catch{}},_playTone(e,t,a="sine"){if(!this._enabled)return;let i=this._getContext(),o=i.createOscillator(),n=i.createGain();o.connect(n),n.connect(i.destination),o.frequency.value=e,o.type=a,n.gain.value=this._volume*.3,o.start(),n.gain.exponentialRampToValueAtTime(.01,i.currentTime+t),o.stop(i.currentTime+t)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(e){this._volume=Math.max(0,Math.min(1,e)),this._save({volume:this._volume})},getVolume(){return this._volume},play(e){if(this._enabled)switch(e){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var fe=window.matchMedia("(prefers-reduced-motion: reduce)");var G=new Map;function N(e,t,a={}){let i=a.priority??10,o={impl:t,bundle:a.bundle,contract:a.contract,priority:i},n=G.get(e);if(customElements.get(e)){if(!n||n.priority>=i){n&&n.priority===i&&n.impl!==t&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${a.bundle}".`);return}console.warn(`[VB Bundle] Tag <${e}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${a.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=i){n.priority===i&&console.warn(`[VB Bundle] Tag <${e}> already registered by "${n.bundle}". Skipping "${a.bundle}" (first wins at equal priority).`);return}G.set(e,o),customElements.define(e,t)}var _=class extends HTMLElement{#n=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let t of this.#n)t();this.#n=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,a,i,o){t.addEventListener(a,i,o),this.#n.push(()=>t.removeEventListener(a,i,o))}setup(){}teardown(){}};var p=new Map,B=new Map;var U=null;function Y(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(U)return U;if(typeof document<"u"){let e=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let t of e){let a=t.getAttribute("src");if(a){let i=a.lastIndexOf("/");if(i!==-1)return a.slice(0,i)}}}return"/cdn"}var oe=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","modern","minimal","classic"]),ce=new Set(["kawaii","memphis"]);function C(e){return ce.has(e)}function le(e,t){return`${t}/themes/${e}.css`}function J(e,t){if(!C(e))return Promise.resolve();if(B.has(e))return B.get(e);let a=import(`${t}/packs/${e}.full.js`).catch(()=>{});return B.set(e,a),a}function de(e,t){let a=Y(),i=()=>{(C(t)||e.hasAttribute("data-vb-pack"))&&J(t,a)};return e.getAttribute("data-vb-theme-state")==="error"?Promise.reject(new Error(`Failed to load theme: ${t}`)):e.getAttribute("data-vb-theme-state")==="ready"||e.sheet?(i(),Promise.resolve()):new Promise((o,n)=>{let s=()=>{e.setAttribute("data-vb-theme-state","ready"),c(),i(),o()},r=()=>{e.setAttribute("data-vb-theme-state","error"),p.delete(t),c(),n(new Error(`Failed to load theme: ${t}`))},c=()=>{e.removeEventListener("load",s),e.removeEventListener("error",r)};e.addEventListener("load",s,{once:!0}),e.addEventListener("error",r,{once:!0})})}async function k(e){if(!e||oe.has(e))return;if(p.has(e))return p.get(e);if(typeof document<"u"){let i=document.querySelector(`link[data-vb-theme="${e}"]`);if(i){let o=de(i,e);return p.set(e,o),o}}let t=Y(),a=C(e)?ue(e,t):he(e,t);return p.set(e,a),a}async function he(e,t){let a=le(e,t);return new Promise((i,o)=>{let n=document.querySelector(`link[data-vb-theme-preload="${e}"]`);n&&n.remove();let s=document.createElement("link");s.rel="stylesheet",s.href=a,s.setAttribute("data-vb-theme",e),s.setAttribute("data-vb-theme-state","loading"),s.onload=()=>{s.setAttribute("data-vb-theme-state","ready"),i()},s.onerror=()=>{s.setAttribute("data-vb-theme-state","error"),s.remove(),p.delete(e),o(new Error(`Failed to load theme: ${e}`))},document.head.appendChild(s)})}function ue(e,t){let a=`${t}/packs/${e}.theme.css`,i=`${t}/packs/${e}.effects.css`;return new Promise((o,n)=>{let s=document.querySelector(`link[data-vb-theme-preload="${e}"]`);s&&s.remove();let r=document.createElement("link");r.rel="stylesheet",r.href=a,r.setAttribute("data-vb-theme",e),r.setAttribute("data-vb-pack",e),r.setAttribute("data-vb-theme-state","loading"),r.onload=()=>{r.setAttribute("data-vb-theme-state","ready");let c=document.createElement("link");c.rel="stylesheet",c.href=i,c.setAttribute("data-vb-pack-effects",e),document.head.appendChild(c),J(e,t),o()},r.onerror=()=>{r.setAttribute("data-vb-theme-state","error"),r.remove(),p.delete(e),n(new Error(`Failed to load pack: ${e}`))},document.head.appendChild(r)})}var x=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}],w=[{id:"default",name:"Default",swatchBg:"#3b82f6",seeds:{}},{id:"ocean",name:"Ocean",swatchBg:"#0891b2",seeds:{"--hue-primary":200,"--hue-secondary":180,"--hue-accent":45,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"45%","--chroma-secondary":.1,"--lightness-accent":"70%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"forest",name:"Forest",swatchBg:"#059669",seeds:{"--hue-primary":145,"--hue-secondary":90,"--hue-accent":30,"--lightness-primary":"45%","--chroma-primary":.15,"--lightness-secondary":"55%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"55%","--chroma-primary":.12}},{id:"sunset",name:"Sunset",swatchBg:"#ea580c",seeds:{"--hue-primary":25,"--hue-secondary":0,"--hue-accent":280,"--lightness-primary":"60%","--chroma-primary":.2,"--lightness-secondary":"55%","--chroma-secondary":.18,"--lightness-accent":"55%","--chroma-accent":.18},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.16}},{id:"rose",name:"Rose",swatchBg:"#e11d48",seeds:{"--hue-primary":350,"--hue-secondary":330,"--hue-accent":200,"--lightness-primary":"55%","--chroma-primary":.18,"--lightness-secondary":"50%","--chroma-secondary":.14,"--lightness-accent":"60%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.14}},{id:"lavender",name:"Lavender",swatchBg:"#a855f7",seeds:{"--hue-primary":280,"--hue-secondary":300,"--hue-accent":60,"--lightness-primary":"55%","--chroma-primary":.14,"--lightness-secondary":"50%","--chroma-secondary":.12,"--lightness-accent":"70%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.12}},{id:"coral",name:"Coral",swatchBg:"#f97316",seeds:{"--hue-primary":15,"--hue-secondary":25,"--hue-accent":180,"--lightness-primary":"60%","--chroma-primary":.18,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"55%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.15}},{id:"slate",name:"Slate",swatchBg:"#64748b",seeds:{"--hue-primary":220,"--hue-secondary":210,"--hue-accent":45,"--lightness-primary":"48%","--chroma-primary":.1,"--lightness-secondary":"45%","--chroma-secondary":.06,"--lightness-accent":"68%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.08}},{id:"emerald",name:"Emerald",swatchBg:"#10b981",seeds:{"--hue-primary":160,"--hue-secondary":140,"--hue-accent":30,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"48%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"amber",name:"Amber",swatchBg:"#f59e0b",seeds:{"--hue-primary":45,"--hue-secondary":30,"--hue-accent":240,"--lightness-primary":"60%","--chroma-primary":.16,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"52%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"68%","--chroma-primary":.14}},{id:"indigo",name:"Indigo",swatchBg:"#6366f1",seeds:{"--hue-primary":250,"--hue-secondary":270,"--hue-accent":35,"--lightness-primary":"48%","--chroma-primary":.18,"--lightness-secondary":"45%","--chroma-secondary":.14,"--lightness-accent":"68%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"62%","--chroma-primary":.14}}],T=[{id:"default",name:"Default",hue:210,shape:"balanced",character:"The default",swatchBg:"#3b82f6",tier:"core"},{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1",tier:"core"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a",tier:"core"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e",tier:"core"}],M=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white",tier:"showcase",category:"Design"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5",tier:"showcase",category:"Design"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C",tier:"showcase",category:"Design"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227",tier:"showcase",category:"Content"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7",tier:"showcase",category:"Modern"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6",tier:"showcase",category:"Creative"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a",tier:"showcase",category:"Creative"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88",tier:"showcase",category:"Creative"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5",tier:"showcase",category:"Aesthetic"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0",tier:"showcase",category:"Aesthetic"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946",tier:"showcase",category:"Aesthetic"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D",tier:"showcase",category:"Aesthetic"},{id:"alpha1999",name:"Alpha1999",icon:"orbit",character:"Space retro-fi",swatchBg:"#0a0a14",swatchFg:"#d4880f",tier:"showcase",category:"Signature"},{id:"super2026",name:"Super2026",icon:"triangle",character:"Supergraphic bold",swatchBg:"#f5f0e6",swatchFg:"#c23616",tier:"showcase",category:"Signature"},{id:"magna",name:"Magna",icon:"orbit",character:"Odyssey 2 retro",swatchBg:"#0d0b14",swatchFg:"#f97316",tier:"showcase",category:"Signature"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0",tier:"showcase",category:"OS Styles"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521",tier:"showcase",category:"OS Styles"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00",tier:"showcase",category:"OS Styles"}],b=[{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1",tier:"community",category:"Editor Palettes"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2",tier:"community",category:"Editor Palettes"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9",tier:"community",category:"Editor Palettes"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7",tier:"community",category:"Editor Palettes"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef",tier:"community",category:"Editor Palettes"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6",tier:"community",category:"Editor Palettes"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6",tier:"community",category:"Editor Palettes"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2",tier:"community",category:"Editor Palettes"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7",tier:"community",category:"Editor Palettes"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba",tier:"community",category:"Editor Palettes"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d",tier:"community",category:"Niche"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00",tier:"community",category:"Niche"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6",tier:"community",category:"Industry"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c",tier:"community",category:"Industry"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30",tier:"community",category:"Industry"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574",tier:"community",category:"Mood/Time"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858",tier:"community",category:"Mood/Time"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff",tier:"community",category:"Mood/Time"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946",tier:"community",category:"Mood/Time"}],K=[{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4",tier:"showcase",category:"Packs"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold patterns",swatchBg:"#FFF8F0",swatchFg:"#d03040",tier:"showcase",category:"Packs"}],F=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}],P=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}],O=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}],ve=[...M,...b],Ee=[...T,...M,...b,...K],g=e=>M.filter(t=>t.category===e),D=[{label:"Style",themes:T,tier:"core"},{label:"Design",themes:g("Design"),tier:"showcase"},{label:"Content",themes:g("Content"),tier:"showcase"},{label:"Modern",themes:g("Modern"),tier:"showcase"},{label:"Creative",themes:g("Creative"),tier:"showcase"},{label:"Aesthetic",themes:g("Aesthetic"),tier:"showcase"},{label:"Signature",themes:g("Signature"),tier:"showcase"},{label:"OS Styles",themes:g("OS Styles"),tier:"showcase"},{label:"Packs",themes:K,tier:"showcase"},{label:"More Themes",themes:b,tier:"community"}];var L="vb-theme",$={mode:"auto",brand:"default",accent:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},W=["--hue-primary","--hue-secondary","--hue-accent","--lightness-primary","--chroma-primary","--lightness-secondary","--chroma-secondary","--lightness-accent","--chroma-accent"],u={_initPromise:null,async init(){return this._initPromise?this._initPromise:(this._initPromise=(async()=>{let e=this.load();try{await k(e.brand)}catch{e.brand="default"}return this.apply(e),this._watchSystemPreference(),e})(),this._initPromise)},load(){try{let e=localStorage.getItem(L);return e?{...$,...JSON.parse(e)}:{...$}}catch{return{...$}}},save(e){let a={...this.load(),...e};try{localStorage.setItem(L,JSON.stringify(a))}catch{}return a},apply({mode:e="auto",brand:t="default",borderStyle:a="",iconSet:i="",fluid:o="",backdrop:n="",backdropChrome:s="",pageBgType:r="",pageBgColor:c="",pageBgGradStart:m="",pageBgGradEnd:h="",pageBgGradDir:d=""}={}){let l=document.documentElement;l.dataset.mode=e==="auto"?this.getEffectiveMode():e;let j=(l.dataset.theme||"").split(" ").filter(A=>A.startsWith("a11y-")),V=t!=="default"?[t,...j]:[...j];V.length?l.dataset.theme=V.join(" "):delete l.dataset.theme;let E=a||this._readCSSHint("--theme-border-style");E&&E!=="clean"?l.dataset.borderStyle=E:delete l.dataset.borderStyle;let S=i||this._readCSSHint("--theme-icon-set");if(S&&S!=="lucide"?l.dataset.iconSet=S:delete l.dataset.iconSet,o?l.dataset.fluid=o:delete l.dataset.fluid,n?l.dataset.backdrop=n:delete l.dataset.backdrop,s&&s!=="card"?l.dataset.backdropChrome=s:delete l.dataset.backdropChrome,r==="color"&&c)l.style.setProperty("--page-bg-color",c),l.style.removeProperty("--page-bg-gradient");else if(r==="gradient"&&m&&h){let A=d||"to bottom";l.style.setProperty("--page-bg-gradient",`linear-gradient(${A}, ${m}, ${h})`),l.style.removeProperty("--page-bg-color")}else l.style.removeProperty("--page-bg-color"),l.style.removeProperty("--page-bg-gradient");let z=this.load().accent||"default";this._applyAccent(z),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:e,brand:t,accent:z,borderStyle:E,iconSet:S,fluid:o,backdrop:n,backdropChrome:s,pageBgType:r,effectiveMode:this.getEffectiveMode()}}))},setMode(e){let t=this.save({mode:e});this.apply(t)},async setBrand(e){try{await k(e)}catch(a){console.warn(`[VB] Theme "${e}" failed to load, using default`,a),e="default"}let t=this.save({brand:e});this.apply(t)},setAccent(e){let t=this.save({accent:e});this._applyAccent(e),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{...this.getState()}}))},setBorderStyle(e){let t=this.save({borderStyle:e});this.apply(t)},setIconSet(e){let t=this.save({iconSet:e});this.apply(t)},setFluid(e){let t=this.save({fluid:e});this.apply(t)},setBackdrop(e){let t=this.save({backdrop:e});this.apply(t)},setBackdropChrome(e){let t=this.save({backdropChrome:e});this.apply(t)},setPageBg({type:e="",color:t="",gradStart:a="",gradEnd:i="",gradDir:o=""}={}){let n=this.save({pageBgType:e,pageBgColor:t,pageBgGradStart:a,pageBgGradEnd:i,pageBgGradDir:o});this.apply(n)},getEffectiveMode(){let{mode:e}=this.load();return e!=="auto"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:e,brand:t,accent:a,borderStyle:i,iconSet:o,fluid:n,backdrop:s,backdropChrome:r,pageBgType:c,pageBgColor:m,pageBgGradStart:h,pageBgGradEnd:d,pageBgGradDir:l}=this.load();return{mode:e,brand:t,accent:a,borderStyle:i,iconSet:o,fluid:n,backdrop:s,backdropChrome:r,pageBgType:c,pageBgColor:m,pageBgGradStart:h,pageBgGradEnd:d,pageBgGradDir:l,effectiveMode:this.getEffectiveMode()}},toggleMode(){let t=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(t)},reset(){try{localStorage.removeItem(L)}catch{}let e=document.documentElement;e.style.removeProperty("--page-bg-color"),e.style.removeProperty("--page-bg-gradient");for(let t of W)e.style.removeProperty(t);this.apply($)},_readCSSHint(e){return getComputedStyle(document.documentElement).getPropertyValue(e).trim()},_applyAccent(e){let t=document.documentElement,a=w.find(i=>i.id===e);for(let i of W)t.style.removeProperty(i);if(!(!a||!a.seeds||Object.keys(a.seeds).length===0)){for(let[i,o]of Object.entries(a.seeds))t.style.setProperty(i,String(o));if(a.seedsDark&&this.getEffectiveMode()==="dark")for(let[i,o]of Object.entries(a.seedsDark))t.style.setProperty(i,String(o))}},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let t=this.load();t.mode==="auto"&&this.apply(t)})}};var y=null,ee="vb-extensions",v={motionFx:!0,sounds:!1},te="vb-a11y-themes",H=class e extends _{static#n=200;#t;#e;#a=!1;#s=!1;#m=!1;#o=null;#p=!1;#i=()=>this.#b();setup(){this.#s=this.getAttribute("variant")==="inline",this.#m=this.hasAttribute("compact"),this.#v(),this.#T(),this.#w(),this.listen(window,"vb:theme-change",this.#D),this.#y(),this.#d()}teardown(){window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.#u()}#v(){this.#s||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#s||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#E(),this.appendChild(this.#e)}#E(){return this.#m?this.#_():this.#S()}#h(t,a){let i=t.swatchBg,o=t.swatchFg||"white",n=t.icon||"";return`
      <label class="swatch-cell" title="${t.character?`${t.name} \u2014 ${t.character}`:t.name}">
        <input
          type="radio"
          name="theme-brand"
          value="${t.id}"
          ${a===t.id?"checked":""}
        />
        <span class="swatch-visual" style="--swatch-bg: ${i}; --swatch-fg: ${o}">
          ${n?`<icon-wc name="${n}"></icon-wc>`:""}
          <span class="sr-only">${t.name}</span>
        </span>
      </label>
    `}#S(){let{mode:t,brand:a,fluid:i,accent:o}=u.getState(),n=D.filter(s=>s.tier==="showcase");return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${x.map(s=>`
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
        <legend>Color Accent</legend>
        <div class="options options--accent-dots" role="radiogroup" aria-label="Color accent">
          ${w.map(s=>`
            <label class="accent-dot" title="${s.name}">
              <input type="radio" name="theme-accent" value="${s.id}" ${o===s.id?"checked":""} />
              <span class="accent-dot-visual" style="background: ${s.swatchBg}"></span>
              <span class="sr-only">${s.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Style</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Style">
          ${T.map(s=>this.#h(s,a)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Featured</legend>
        ${n.map(s=>`
          <div class="theme-category">
            <span class="category-label">${s.label}</span>
            <div class="options options--swatch-grid">
              ${s.themes.map(r=>this.#h(r,a)).join("")}
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
          ${b.map(s=>this.#h(s,a)).join("")}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${P.map(s=>{let c=this.#l().includes(s.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${s.id}"
                data-a11y-theme="${s.id}"
                ${c?"checked":""}
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
          ${F.map(s=>`
            <label class="option option--sizing">
              <input
                type="radio"
                name="theme-fluid"
                value="${s.id}"
                ${i===s.id?"checked":""}
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

      <details class="section section--extensions" ${this.#p?"open":""}>
        <summary class="extensions-toggle">
          <icon-wc name="sliders-horizontal"></icon-wc>
          <span>Extensions</span>
          <icon-wc name="chevron-down" class="chevron"></icon-wc>
        </summary>
        <div class="extensions-content">
          ${O.map(s=>{let c=this.#c()[s.id]??v[s.id];return`
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
                ${c?"checked":""}
              />
            </label>
          `}).join("")}
        </div>
      </details>
    `}#_(){let{mode:t,brand:a,fluid:i,accent:o}=u.getState(),n=this.#l(),s=this.#c();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${x.map(r=>`
            <label class="compact-seg">
              <input type="radio" name="theme-mode" value="${r.id}" ${t===r.id?"checked":""} />
              <span><icon-wc name="${r.icon}" size="xs"></icon-wc> ${r.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Color Accent</legend>
        <select class="compact-select" name="theme-accent-select" aria-label="Color accent">
          ${w.map(r=>`
            <option value="${r.id}" ${o===r.id?"selected":""}>${r.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${D.map(r=>`
            <optgroup label="${r.label}">
              ${r.themes.map(c=>`
                <option value="${c.id}" ${a===c.id?"selected":""}>${c.name}</option>
              `).join("")}
            </optgroup>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="Sizing">
          ${F.map(r=>`
            <option value="${r.id}" ${i===r.id?"selected":""}>${r.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${P.map(r=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${r.name}</span>
              </span>
              <input type="checkbox" name="a11y-theme" value="${r.id}" data-a11y-theme="${r.id}" data-switch="sm" ${n.includes(r.id)?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Extensions</legend>
        <div class="compact-toggles">
          ${O.map(r=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${r.name}</span>
              </span>
              <input type="checkbox" name="ext-${r.id}" data-extension="${r.id}" data-switch="sm" ${s[r.id]??v[r.id]?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#T(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(n=>{n.addEventListener("change",this.#C)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(n=>{n.addEventListener("change",this.#k)});let t=this.#e.querySelector('select[name="theme-brand-select"]');t&&t.addEventListener("change",this.#x),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(n=>{n.addEventListener("change",this.#g)});let a=this.#e.querySelector('select[name="theme-fluid-select"]');a&&a.addEventListener("change",this.#g),this.#e.querySelectorAll('input[name="theme-accent"]').forEach(n=>{n.addEventListener("change",this.#f)});let i=this.#e.querySelector('select[name="theme-accent-select"]');i&&i.addEventListener("change",this.#f),this.#e.querySelectorAll("input[data-extension]").forEach(n=>{n.addEventListener("change",this.#M)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(n=>{n.addEventListener("change",this.#O)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",n=>{this.#p=n.target.open}),this.#s||(this.listen(this.#t,"click",this.#$),this.listen(document,"click",this.#A),this.listen(document,"keydown",this.#B))}#$=t=>{t.stopPropagation(),this.toggle()};#A=t=>{this.#a&&!this.contains(t.target)&&this.close()};#B=t=>{t.key==="Escape"&&this.#a&&(t.preventDefault(),this.close(),this.#t?.focus())};#C=t=>{u.setMode(t.target.value),this.#r()};#k=async t=>{let a=t.target.closest(".swatch-cell");a&&a.setAttribute("aria-busy","true");try{await u.setBrand(t.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a&&a.removeAttribute("aria-busy")}this.#d(),this.#r()};#x=async t=>{let a=t.target;a.disabled=!0;try{await u.setBrand(a.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a.disabled=!1}this.#d(),this.#r()};#g=t=>{u.setFluid(t.target.value),this.#r()};#f=t=>{u.setAccent(t.target.value),this.#r()};#M=t=>{let a=t.target.dataset.extension,i=t.target.checked;this.#F(a,i),this.#y()};#c(){try{let t=localStorage.getItem(ee);return t?{...v,...JSON.parse(t)}:{...v}}catch{return{...v}}}#F(t,a){try{let i=this.#c();i[t]=a,localStorage.setItem(ee,JSON.stringify(i))}catch{}}async#y(){let t=this.#c(),a=document.documentElement;t.motionFx?delete a.dataset.motionReduced:a.dataset.motionReduced="",t.sounds?(y||(y=(await Promise.resolve().then(()=>(Z(),Q))).SoundManager),y.init(),y.enable()):y&&y.disable(),window.dispatchEvent(new CustomEvent("vb:extensions-change",{detail:t}))}#l(){try{let t=localStorage.getItem(te);return t?JSON.parse(t):[]}catch{return[]}}#P(t){try{localStorage.setItem(te,JSON.stringify(t))}catch{}}#d(){let t=this.#l(),{brand:a}=u.getState(),i=document.documentElement,o=a==="default"?t.join(" "):[a,...t].join(" "),n=i.dataset.theme||"";o!==n&&(o?i.dataset.theme=o:delete i.dataset.theme)}#O=t=>{let a=t.target.dataset.a11yTheme,i=t.target.checked,o=this.#l();if(i&&!o.includes(a))o.push(a);else if(!i&&o.includes(a)){let n=o.indexOf(a);o.splice(n,1)}this.#P(o),this.#d()};#r(){this.#s||(this.#u(),this.#o=setTimeout(()=>{this.close(),this.#t?.focus()},e.#n))}#u(){this.#o&&(clearTimeout(this.#o),this.#o=null)}#D=()=>{this.#w()};#w(){let{mode:t,brand:a,fluid:i,accent:o}=u.getState(),n=this.#e.querySelector(`input[name="theme-mode"][value="${t}"]`);n&&(n.checked=!0);let s=this.#e.querySelector(`input[name="theme-brand"][value="${a}"]`);s&&(s.checked=!0);let r=this.#e.querySelector('select[name="theme-brand-select"]');r&&(r.value=a);let c=this.#e.querySelector(`input[name="theme-fluid"][value="${i}"]`);c&&(c.checked=!0);let m=this.#e.querySelector('select[name="theme-fluid-select"]');m&&(m.value=i);let h=this.#e.querySelector(`input[name="theme-accent"][value="${o||"default"}"]`);h&&(h.checked=!0);let d=this.#e.querySelector('select[name="theme-accent-select"]');d&&(d.value=o||"default")}open(){this.#s||this.#a||(this.#a=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#b(),window.addEventListener("scroll",this.#i,{capture:!0,passive:!0}),window.addEventListener("resize",this.#i,{passive:!0}),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#b(){if(!this.#t||!this.#e)return;let t=this.#t.getBoundingClientRect(),a=this.#e.getBoundingClientRect(),i=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},o=i.height,n=i.width,s=8,r=16,c=o-t.bottom-r,m=t.top-r,h=t.height+s;c<a.height&&m>c?(h=-a.height-s,this.#e.dataset.position="top"):delete this.#e.dataset.position;let d=0,l=t.left+a.width+r,R=t.left+d;l>n&&(d=n-l),R+d<r&&(d=r-t.left),this.#e.style.setProperty("--panel-top",`${h}px`),this.#e.style.setProperty("--panel-left",`${d}px`)}close(){this.#s||!this.#a||(this.#u(),this.#a=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}};N("theme-picker",H);var ae="vb-environment",q={timeOfDay:!1,seasonal:!1},pe=900*1e3;function f(e,t,a){return e+(t-e)*Math.min(1,Math.max(0,a))}var se={_timer:null,_baseHues:null,_timeOverride:null,_monthOverride:null,init(){let e=this.load();(e.timeOfDay||e.seasonal)&&(this._captureBaseHues(),this._update(),this._startLoop()),window.addEventListener("vb:theme-change",()=>{this._hasActiveSource()&&requestAnimationFrame(()=>{this._captureBaseHues(),this._update()})})},load(){try{let e=localStorage.getItem(ae);return e?{...q,...JSON.parse(e)}:{...q}}catch{return{...q}}},save(e){try{localStorage.setItem(ae,JSON.stringify(e))}catch{}return e},setTimeOverride(e){this._timeOverride=e,this._hasActiveSource()&&this._update()},setMonthOverride(e){this._monthOverride=e,this._hasActiveSource()&&this._update()},setSource(e,t){let a={...this.load(),[e]:t};this.save(a),t?(this._captureBaseHues(),this._update(),this._startLoop()):this._hasActiveSource(a)?this._update():(this._clearModifiers(),this._stopLoop())},_hasActiveSource(e){let t=e||this.load();return t.timeOfDay||t.seasonal},_captureBaseHues(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent");let t=e.getAttribute("data-theme");if(t){let a=`[data-theme~="${t}"]`;for(let i of document.styleSheets)try{for(let o=0;o<i.cssRules.length;o++){let n=i.cssRules[o];if(n.selectorText?.includes(a)&&!n.selectorText.includes("dark")){let s=n.style?.getPropertyValue("--hue-primary");if(s){this._baseHues={primary:parseFloat(s)||260,secondary:parseFloat(n.style.getPropertyValue("--hue-secondary"))||200,accent:parseFloat(n.style.getPropertyValue("--hue-accent"))||30};return}}}}catch{}}this._baseHues={primary:260,secondary:200,accent:30}},_update(){let e=this.load(),t=0;e.timeOfDay&&(t+=this._getTimeOfDayOffset()),e.seasonal&&(t+=this._getSeasonalOffset());let a=document.documentElement;t!==0&&this._baseHues?(a.style.setProperty("--hue-primary",String(this._baseHues.primary+t)),a.style.setProperty("--hue-secondary",String(this._baseHues.secondary+t)),a.style.setProperty("--hue-accent",String(this._baseHues.accent+t*.5))):t===0&&this._clearModifiers()},_clearModifiers(){let e=document.documentElement;e.style.removeProperty("--hue-primary"),e.style.removeProperty("--hue-secondary"),e.style.removeProperty("--hue-accent")},_getTimeOfDayOffset(){let e=this._timeOverride??new Date().getHours()+new Date().getMinutes()/60;return e<5?-20:e<7?f(-20,20,(e-5)/2):e<10?f(20,5,(e-7)/3):e<14?f(5,0,(e-10)/4):e<17?f(0,-5,(e-14)/3):e<19?f(-5,15,(e-17)/2):e<21?f(15,-10,(e-19)/2):f(-10,-20,(e-21)/8)},_getHemisphere(){return window.__VB_ENV_LOCATION?.hemisphere||"north"},_getSeasonalOffset(){let e=this._monthOverride??new Date().getMonth(),a=this._getHemisphere()==="south"?(e+6)%12:e;return a>=2&&a<=4?5:a>=5&&a<=7?10:a>=8&&a<=10?-5:-10},_startLoop(){this._timer||(this._timer=setInterval(()=>this._update(),pe))},_stopLoop(){this._timer&&clearInterval(this._timer),this._timer=null}};se.init();
//# sourceMappingURL=ui.full.js.map
