var ae=Object.defineProperty;var ie=(t,e)=>()=>(t&&(e=t(t=0)),e);var ne=(t,e)=>{for(var s in e)ae(t,s,{get:e[s],enumerable:!0})};var X={};ne(X,{SoundManager:()=>he});var W,H,he,Q=ie(()=>{W="vb-sound",H={enabled:!1,volume:.5},he={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let t=this._load();return this._enabled=t.enabled,this._volume=t.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let t=localStorage.getItem(W);return t?{...H,...JSON.parse(t)}:{...H}}catch{return{...H}}},_save(t){try{let e=this._load();localStorage.setItem(W,JSON.stringify({...e,...t}))}catch{}},_playTone(t,e,s="sine"){if(!this._enabled)return;let n=this._getContext(),r=n.createOscillator(),i=n.createGain();r.connect(i),i.connect(n.destination),r.frequency.value=t,r.type=s,i.gain.value=this._volume*.3,r.start(),i.gain.exponentialRampToValueAtTime(.01,n.currentTime+e),r.stop(n.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(t){this._volume=Math.max(0,Math.min(1,t)),this._save({volume:this._volume})},getVolume(){return this._volume},play(t){if(this._enabled)switch(t){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var pe=window.matchMedia("(prefers-reduced-motion: reduce)");var G=new Map;function U(t,e,s={}){let n=s.priority??10,r={impl:e,bundle:s.bundle,contract:s.contract,priority:n},i=G.get(t);if(customElements.get(t)){if(!i||i.priority>=n){i&&i.priority===n&&i.impl!==e&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${i.bundle}" (priority ${i.priority}). Skipping "${s.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${i.bundle}" cannot be replaced (customElements.define is permanent). "${s.bundle}" has higher priority but arrived late.`);return}if(i&&i.priority>=n){i.priority===n&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${i.bundle}". Skipping "${s.bundle}" (first wins at equal priority).`);return}G.set(t,r),customElements.define(t,e)}var $=class extends HTMLElement{#n=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let e of this.#n)e();this.#n=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,s,n,r){e.addEventListener(s,n,r),this.#n.push(()=>e.removeEventListener(s,n,r))}setup(){}teardown(){}};var y=new Map,b=null,f=null,Y=null;function A(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(Y)return Y;if(typeof document<"u"){let t=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of t){let s=e.getAttribute("src");if(s){let n=s.lastIndexOf("/");if(n!==-1)return s.slice(0,n)}}}return"/cdn"}async function re(){if(b)return b;let t=A();try{let e=await fetch(`${t}/themes/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);b=await e.json()}catch{b={}}return b}var ce=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","modern","minimal","classic"]);async function x(t){if(!t||ce.has(t))return;if(y.has(t))return y.get(t);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${t}"]`)){y.set(t,Promise.resolve());return}let e=le(t);return y.set(t,e),e}async function oe(){if(f)return f;let t=A();try{let e=await fetch(`${t}/packs/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);f=await e.json()}catch{try{let e=await fetch(`${t}/bundles/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);f=await e.json()}catch{f={}}}return f}async function le(t){let e=A();if((await oe())[t])return de(t,e);let r=(await re())[t],i=r?r.file:`${t}.css`,a=`${e}/themes/${i}`;return new Promise((c,l)=>{let h=document.querySelector(`link[data-vb-theme-preload="${t}"]`);h&&h.remove();let d=document.createElement("link");d.rel="stylesheet",d.href=a,d.setAttribute("data-vb-theme",t),d.onload=()=>c(),d.onerror=()=>{d.remove(),y.delete(t),l(new Error(`Failed to load theme: ${t}`))},document.head.appendChild(d)})}function de(t,e){let s=`${e}/packs/${t}.full.css`,n=`${e}/packs/${t}.full.js`;return new Promise((r,i)=>{let a=document.createElement("link");a.rel="stylesheet",a.href=s,a.setAttribute("data-vb-theme",t),a.setAttribute("data-vb-pack",t),a.onload=()=>{import(n).catch(()=>{}),r()},a.onerror=()=>{a.remove(),y.delete(t),i(new Error(`Failed to load pack: ${t}`))},document.head.appendChild(a)})}var M=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}],v=[{id:"default",name:"Default",swatchBg:"#3b82f6",seeds:{}},{id:"ocean",name:"Ocean",swatchBg:"#0891b2",seeds:{"--hue-primary":200,"--hue-secondary":180,"--hue-accent":45,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"45%","--chroma-secondary":.1,"--lightness-accent":"70%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"forest",name:"Forest",swatchBg:"#059669",seeds:{"--hue-primary":145,"--hue-secondary":90,"--hue-accent":30,"--lightness-primary":"45%","--chroma-primary":.15,"--lightness-secondary":"55%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"55%","--chroma-primary":.12}},{id:"sunset",name:"Sunset",swatchBg:"#ea580c",seeds:{"--hue-primary":25,"--hue-secondary":0,"--hue-accent":280,"--lightness-primary":"60%","--chroma-primary":.2,"--lightness-secondary":"55%","--chroma-secondary":.18,"--lightness-accent":"55%","--chroma-accent":.18},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.16}},{id:"rose",name:"Rose",swatchBg:"#e11d48",seeds:{"--hue-primary":350,"--hue-secondary":330,"--hue-accent":200,"--lightness-primary":"55%","--chroma-primary":.18,"--lightness-secondary":"50%","--chroma-secondary":.14,"--lightness-accent":"60%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.14}},{id:"lavender",name:"Lavender",swatchBg:"#a855f7",seeds:{"--hue-primary":280,"--hue-secondary":300,"--hue-accent":60,"--lightness-primary":"55%","--chroma-primary":.14,"--lightness-secondary":"50%","--chroma-secondary":.12,"--lightness-accent":"70%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.12}},{id:"coral",name:"Coral",swatchBg:"#f97316",seeds:{"--hue-primary":15,"--hue-secondary":25,"--hue-accent":180,"--lightness-primary":"60%","--chroma-primary":.18,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"55%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.15}},{id:"slate",name:"Slate",swatchBg:"#64748b",seeds:{"--hue-primary":220,"--hue-secondary":210,"--hue-accent":45,"--lightness-primary":"48%","--chroma-primary":.1,"--lightness-secondary":"45%","--chroma-secondary":.06,"--lightness-accent":"68%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.08}},{id:"emerald",name:"Emerald",swatchBg:"#10b981",seeds:{"--hue-primary":160,"--hue-secondary":140,"--hue-accent":30,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"48%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"amber",name:"Amber",swatchBg:"#f59e0b",seeds:{"--hue-primary":45,"--hue-secondary":30,"--hue-accent":240,"--lightness-primary":"60%","--chroma-primary":.16,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"52%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"68%","--chroma-primary":.14}},{id:"indigo",name:"Indigo",swatchBg:"#6366f1",seeds:{"--hue-primary":250,"--hue-secondary":270,"--hue-accent":35,"--lightness-primary":"48%","--chroma-primary":.18,"--lightness-secondary":"45%","--chroma-secondary":.14,"--lightness-accent":"68%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"62%","--chroma-primary":.14}}],k=[{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1",tier:"core"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a",tier:"core"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e",tier:"core"}],F=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white",tier:"showcase",category:"Design"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5",tier:"showcase",category:"Design"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C",tier:"showcase",category:"Design"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227",tier:"showcase",category:"Content"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7",tier:"showcase",category:"Modern"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6",tier:"showcase",category:"Creative"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a",tier:"showcase",category:"Creative"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88",tier:"showcase",category:"Creative"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5",tier:"showcase",category:"Aesthetic"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0",tier:"showcase",category:"Aesthetic"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946",tier:"showcase",category:"Aesthetic"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D",tier:"showcase",category:"Aesthetic"},{id:"alpha1999",name:"Alpha1999",icon:"orbit",character:"Space retro-fi",swatchBg:"#0a0a14",swatchFg:"#d4880f",tier:"showcase",category:"Signature"},{id:"super2026",name:"Super2026",icon:"triangle",character:"Supergraphic bold",swatchBg:"#f5f0e6",swatchFg:"#c23616",tier:"showcase",category:"Signature"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0",tier:"showcase",category:"OS Styles"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521",tier:"showcase",category:"OS Styles"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00",tier:"showcase",category:"OS Styles"},{id:"magna",name:"Magna",icon:"orbit",character:"Odyssey 2 retro",swatchBg:"#0d0b14",swatchFg:"#f97316",tier:"showcase",category:"OS Styles"}],S=[{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1",tier:"community",category:"Editor Palettes"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2",tier:"community",category:"Editor Palettes"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9",tier:"community",category:"Editor Palettes"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7",tier:"community",category:"Editor Palettes"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef",tier:"community",category:"Editor Palettes"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6",tier:"community",category:"Editor Palettes"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6",tier:"community",category:"Editor Palettes"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2",tier:"community",category:"Editor Palettes"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7",tier:"community",category:"Editor Palettes"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba",tier:"community",category:"Editor Palettes"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d",tier:"community",category:"Niche"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00",tier:"community",category:"Niche"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6",tier:"community",category:"Industry"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c",tier:"community",category:"Industry"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30",tier:"community",category:"Industry"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574",tier:"community",category:"Mood/Time"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858",tier:"community",category:"Mood/Time"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff",tier:"community",category:"Mood/Time"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946",tier:"community",category:"Mood/Time"}],J=[{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4",tier:"showcase",category:"Packs"},{id:"retro",name:"Retro",icon:"tv",character:"CRT terminal",swatchBg:"#0a0a14",swatchFg:"#00ff66",tier:"showcase",category:"Packs"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold patterns",swatchBg:"#FFF8F0",swatchFg:"#d03040",tier:"showcase",category:"Packs"}],O=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}],P=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}],D=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}],we=[...F,...S],be=[...k,...F,...S,...J],p=t=>F.filter(e=>e.category===t),L=[{label:"Style",themes:k,tier:"core"},{label:"Design",themes:p("Design"),tier:"showcase"},{label:"Content",themes:p("Content"),tier:"showcase"},{label:"Modern",themes:p("Modern"),tier:"showcase"},{label:"Creative",themes:p("Creative"),tier:"showcase"},{label:"Aesthetic",themes:p("Aesthetic"),tier:"showcase"},{label:"Signature",themes:p("Signature"),tier:"showcase"},{label:"OS Styles",themes:p("OS Styles"),tier:"showcase"},{label:"Packs",themes:J,tier:"showcase"},{label:"More Themes",themes:S,tier:"community"}];var I="vb-theme",B={mode:"auto",brand:"default",accent:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},K=["--hue-primary","--hue-secondary","--hue-accent","--lightness-primary","--chroma-primary","--lightness-secondary","--chroma-secondary","--lightness-accent","--chroma-accent"],u={_initPromise:null,async init(){return this._initPromise?this._initPromise:(this._initPromise=(async()=>{let t=this.load();try{await x(t.brand)}catch{t.brand="default"}return this.apply(t),this._watchSystemPreference(),t})(),this._initPromise)},load(){try{let t=localStorage.getItem(I);return t?{...B,...JSON.parse(t)}:{...B}}catch{return{...B}}},save(t){let s={...this.load(),...t};try{localStorage.setItem(I,JSON.stringify(s))}catch{}return s},apply({mode:t="auto",brand:e="default",borderStyle:s="",iconSet:n="",fluid:r="",backdrop:i="",backdropChrome:a="",pageBgType:c="",pageBgColor:l="",pageBgGradStart:h="",pageBgGradEnd:d="",pageBgGradDir:m=""}={}){let o=document.documentElement;o.dataset.mode=t==="auto"?this.getEffectiveMode():t;let N=(o.dataset.theme||"").split(" ").filter(C=>C.startsWith("a11y-")),V=e!=="default"?[e,...N]:[...N];V.length?o.dataset.theme=V.join(" "):delete o.dataset.theme;let _=s||this._readCSSHint("--theme-border-style");_&&_!=="clean"?o.dataset.borderStyle=_:delete o.dataset.borderStyle;let T=n||this._readCSSHint("--theme-icon-set");if(T&&T!=="lucide"?o.dataset.iconSet=T:delete o.dataset.iconSet,r?o.dataset.fluid=r:delete o.dataset.fluid,i?o.dataset.backdrop=i:delete o.dataset.backdrop,a&&a!=="card"?o.dataset.backdropChrome=a:delete o.dataset.backdropChrome,c==="color"&&l)o.style.setProperty("--page-bg-color",l),o.style.removeProperty("--page-bg-gradient");else if(c==="gradient"&&h&&d){let C=m||"to bottom";o.style.setProperty("--page-bg-gradient",`linear-gradient(${C}, ${h}, ${d})`),o.style.removeProperty("--page-bg-color")}else o.style.removeProperty("--page-bg-color"),o.style.removeProperty("--page-bg-gradient");let z=this.load().accent||"default";this._applyAccent(z),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:t,brand:e,accent:z,borderStyle:_,iconSet:T,fluid:r,backdrop:i,backdropChrome:a,pageBgType:c,effectiveMode:this.getEffectiveMode()}}))},setMode(t){let e=this.save({mode:t});this.apply(e)},async setBrand(t){try{await x(t)}catch(s){console.warn(`[VB] Theme "${t}" failed to load, using default`,s),t="default"}let e=this.save({brand:t});this.apply(e)},setAccent(t){let e=this.save({accent:t});this._applyAccent(t),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{...this.getState()}}))},setBorderStyle(t){let e=this.save({borderStyle:t});this.apply(e)},setIconSet(t){let e=this.save({iconSet:t});this.apply(e)},setFluid(t){let e=this.save({fluid:t});this.apply(e)},setBackdrop(t){let e=this.save({backdrop:t});this.apply(e)},setBackdropChrome(t){let e=this.save({backdropChrome:t});this.apply(e)},setPageBg({type:t="",color:e="",gradStart:s="",gradEnd:n="",gradDir:r=""}={}){let i=this.save({pageBgType:t,pageBgColor:e,pageBgGradStart:s,pageBgGradEnd:n,pageBgGradDir:r});this.apply(i)},getEffectiveMode(){let{mode:t}=this.load();return t!=="auto"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:t,brand:e,accent:s,borderStyle:n,iconSet:r,fluid:i,backdrop:a,backdropChrome:c,pageBgType:l,pageBgColor:h,pageBgGradStart:d,pageBgGradEnd:m,pageBgGradDir:o}=this.load();return{mode:t,brand:e,accent:s,borderStyle:n,iconSet:r,fluid:i,backdrop:a,backdropChrome:c,pageBgType:l,pageBgColor:h,pageBgGradStart:d,pageBgGradEnd:m,pageBgGradDir:o,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(I)}catch{}let t=document.documentElement;t.style.removeProperty("--page-bg-color"),t.style.removeProperty("--page-bg-gradient");for(let e of K)t.style.removeProperty(e);this.apply(B)},_readCSSHint(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()},_applyAccent(t){let e=document.documentElement,s=v.find(n=>n.id===t);for(let n of K)e.style.removeProperty(n);if(!(!s||!s.seeds||Object.keys(s.seeds).length===0)){for(let[n,r]of Object.entries(s.seeds))e.style.setProperty(n,String(r));if(s.seedsDark&&this.getEffectiveMode()==="dark")for(let[n,r]of Object.entries(s.seedsDark))e.style.setProperty(n,String(r))}},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let e=this.load();e.mode==="auto"&&this.apply(e)})}};var w=null,Z="vb-extensions",E={motionFx:!0,sounds:!1},ee="vb-a11y-themes",R=class t extends ${static#n=200;#t;#e;#s=!1;#a=!1;#u=!1;#c=null;#p=!1;#i=()=>this.#b();setup(){this.#a=this.getAttribute("variant")==="inline",this.#u=this.hasAttribute("compact"),this.#v(),this.#T(),this.#w(),this.listen(window,"vb:theme-change",this.#D),this.#y(),this.#d()}teardown(){window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.#m()}#v(){this.#a||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#a||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#S(),this.appendChild(this.#e)}#S(){return this.#u?this.#_():this.#E()}#h(e,s){let n=e.swatchBg,r=e.swatchFg||"white",i=e.icon||"";return`
      <label class="swatch-cell" title="${e.character?`${e.name} \u2014 ${e.character}`:e.name}">
        <input
          type="radio"
          name="theme-brand"
          value="${e.id}"
          ${s===e.id?"checked":""}
        />
        <span class="swatch-visual" style="--swatch-bg: ${n}; --swatch-fg: ${r}">
          ${i?`<icon-wc name="${i}"></icon-wc>`:""}
          <span class="sr-only">${e.name}</span>
        </span>
      </label>
    `}#E(){let{mode:e,brand:s,fluid:n,accent:r}=u.getState(),i=L.filter(a=>a.tier==="showcase");return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${M.map(a=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${a.id}"
                ${e===a.id?"checked":""}
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
        <legend>Color Accent</legend>
        <div class="options options--accent-dots" role="radiogroup" aria-label="Color accent">
          ${v.map(a=>`
            <label class="accent-dot" title="${a.name}">
              <input type="radio" name="theme-accent" value="${a.id}" ${r===a.id?"checked":""} />
              <span class="accent-dot-visual" style="background: ${a.swatchBg}"></span>
              <span class="sr-only">${a.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Style</legend>
        <div class="options options--swatch-grid" role="radiogroup" aria-label="Style">
          ${k.map(a=>this.#h(a,s)).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Featured</legend>
        ${i.map(a=>`
          <div class="theme-category">
            <span class="category-label">${a.label}</span>
            <div class="options options--swatch-grid">
              ${a.themes.map(c=>this.#h(c,s)).join("")}
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
          ${S.map(a=>this.#h(a,s)).join("")}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${P.map(a=>{let l=this.#l().includes(a.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${a.id}"
                data-a11y-theme="${a.id}"
                ${l?"checked":""}
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
          ${O.map(a=>`
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
          ${D.map(a=>{let l=this.#o()[a.id]??E[a.id];return`
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
                ${l?"checked":""}
              />
            </label>
          `}).join("")}
        </div>
      </details>
    `}#_(){let{mode:e,brand:s,fluid:n,accent:r}=u.getState(),i=this.#l(),a=this.#o();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${M.map(c=>`
            <label class="compact-seg">
              <input type="radio" name="theme-mode" value="${c.id}" ${e===c.id?"checked":""} />
              <span><icon-wc name="${c.icon}" size="xs"></icon-wc> ${c.name}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Color Accent</legend>
        <select class="compact-select" name="theme-accent-select" aria-label="Color accent">
          ${v.map(c=>`
            <option value="${c.id}" ${r===c.id?"selected":""}>${c.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${L.map(c=>`
            <optgroup label="${c.label}">
              ${c.themes.map(l=>`
                <option value="${l.id}" ${s===l.id?"selected":""}>${l.name}</option>
              `).join("")}
            </optgroup>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="Sizing">
          ${O.map(c=>`
            <option value="${c.id}" ${n===c.id?"selected":""}>${c.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${P.map(c=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${c.name}</span>
              </span>
              <input type="checkbox" name="a11y-theme" value="${c.id}" data-a11y-theme="${c.id}" data-switch="sm" ${i.includes(c.id)?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Extensions</legend>
        <div class="compact-toggles">
          ${D.map(c=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${c.name}</span>
              </span>
              <input type="checkbox" name="ext-${c.id}" data-extension="${c.id}" data-switch="sm" ${a[c.id]??E[c.id]?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#T(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(i=>{i.addEventListener("change",this.#C)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(i=>{i.addEventListener("change",this.#A)});let e=this.#e.querySelector('select[name="theme-brand-select"]');e&&e.addEventListener("change",this.#x),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(i=>{i.addEventListener("change",this.#g)});let s=this.#e.querySelector('select[name="theme-fluid-select"]');s&&s.addEventListener("change",this.#g),this.#e.querySelectorAll('input[name="theme-accent"]').forEach(i=>{i.addEventListener("change",this.#f)});let n=this.#e.querySelector('select[name="theme-accent-select"]');n&&n.addEventListener("change",this.#f),this.#e.querySelectorAll("input[data-extension]").forEach(i=>{i.addEventListener("change",this.#M)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(i=>{i.addEventListener("change",this.#P)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",i=>{this.#p=i.target.open}),this.#a||(this.listen(this.#t,"click",this.#$),this.listen(document,"click",this.#k),this.listen(document,"keydown",this.#B))}#$=e=>{e.stopPropagation(),this.toggle()};#k=e=>{this.#s&&!this.contains(e.target)&&this.close()};#B=e=>{e.key==="Escape"&&this.#s&&(e.preventDefault(),this.close(),this.#t?.focus())};#C=e=>{u.setMode(e.target.value),this.#r()};#A=async e=>{let s=e.target.closest(".swatch-cell");s&&s.setAttribute("aria-busy","true");try{await u.setBrand(e.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{s&&s.removeAttribute("aria-busy")}this.#d(),this.#r()};#x=async e=>{let s=e.target;s.disabled=!0;try{await u.setBrand(s.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{s.disabled=!1}this.#d(),this.#r()};#g=e=>{u.setFluid(e.target.value),this.#r()};#f=e=>{u.setAccent(e.target.value),this.#r()};#M=e=>{let s=e.target.dataset.extension,n=e.target.checked;this.#F(s,n),this.#y()};#o(){try{let e=localStorage.getItem(Z);return e?{...E,...JSON.parse(e)}:{...E}}catch{return{...E}}}#F(e,s){try{let n=this.#o();n[e]=s,localStorage.setItem(Z,JSON.stringify(n))}catch{}}async#y(){let e=this.#o(),s=document.documentElement;e.motionFx?delete s.dataset.motionReduced:s.dataset.motionReduced="",e.sounds?(w||(w=(await Promise.resolve().then(()=>(Q(),X))).SoundManager),w.init(),w.enable()):w&&w.disable(),window.dispatchEvent(new CustomEvent("vb:extensions-change",{detail:e}))}#l(){try{let e=localStorage.getItem(ee);return e?JSON.parse(e):[]}catch{return[]}}#O(e){try{localStorage.setItem(ee,JSON.stringify(e))}catch{}}#d(){let e=this.#l(),{brand:s}=u.getState(),n=document.documentElement,r=s==="default"?e.join(" "):[s,...e].join(" "),i=n.dataset.theme||"";r!==i&&(r?n.dataset.theme=r:delete n.dataset.theme)}#P=e=>{let s=e.target.dataset.a11yTheme,n=e.target.checked,r=this.#l();if(n&&!r.includes(s))r.push(s);else if(!n&&r.includes(s)){let i=r.indexOf(s);r.splice(i,1)}this.#O(r),this.#d()};#r(){this.#a||(this.#m(),this.#c=setTimeout(()=>{this.close(),this.#t?.focus()},t.#n))}#m(){this.#c&&(clearTimeout(this.#c),this.#c=null)}#D=()=>{this.#w()};#w(){let{mode:e,brand:s,fluid:n,accent:r}=u.getState(),i=this.#e.querySelector(`input[name="theme-mode"][value="${e}"]`);i&&(i.checked=!0);let a=this.#e.querySelector(`input[name="theme-brand"][value="${s}"]`);a&&(a.checked=!0);let c=this.#e.querySelector('select[name="theme-brand-select"]');c&&(c.value=s);let l=this.#e.querySelector(`input[name="theme-fluid"][value="${n}"]`);l&&(l.checked=!0);let h=this.#e.querySelector('select[name="theme-fluid-select"]');h&&(h.value=n);let d=this.#e.querySelector(`input[name="theme-accent"][value="${r||"default"}"]`);d&&(d.checked=!0);let m=this.#e.querySelector('select[name="theme-accent-select"]');m&&(m.value=r||"default")}open(){this.#a||this.#s||(this.#s=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#b(),window.addEventListener("scroll",this.#i,{capture:!0,passive:!0}),window.addEventListener("resize",this.#i,{passive:!0}),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#b(){if(!this.#t||!this.#e)return;let e=this.#t.getBoundingClientRect(),s=this.#e.getBoundingClientRect(),n=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},r=n.height,i=n.width,a=8,c=16,l=r-e.bottom-c,h=e.top-c,d=e.height+a;l<s.height&&h>l?(d=-s.height-a,this.#e.dataset.position="top"):delete this.#e.dataset.position;let m=0,o=e.left+s.width+c,j=e.left+m;o>i&&(m=i-o),j+m<c&&(m=c-e.left),this.#e.style.setProperty("--panel-top",`${d}px`),this.#e.style.setProperty("--panel-left",`${m}px`)}close(){this.#a||!this.#s||(this.#m(),this.#s=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#s?this.close():this.open()}get isOpen(){return this.#s}};U("theme-picker",R);var te="vb-environment",q={timeOfDay:!1,seasonal:!1},me=900*1e3;function g(t,e,s){return t+(e-t)*Math.min(1,Math.max(0,s))}var se={_timer:null,_baseHues:null,_timeOverride:null,_monthOverride:null,init(){let t=this.load();(t.timeOfDay||t.seasonal)&&(this._captureBaseHues(),this._update(),this._startLoop()),window.addEventListener("vb:theme-change",()=>{this._hasActiveSource()&&requestAnimationFrame(()=>{this._captureBaseHues(),this._update()})})},load(){try{let t=localStorage.getItem(te);return t?{...q,...JSON.parse(t)}:{...q}}catch{return{...q}}},save(t){try{localStorage.setItem(te,JSON.stringify(t))}catch{}return t},setTimeOverride(t){this._timeOverride=t,this._hasActiveSource()&&this._update()},setMonthOverride(t){this._monthOverride=t,this._hasActiveSource()&&this._update()},setSource(t,e){let s={...this.load(),[t]:e};this.save(s),e?(this._captureBaseHues(),this._update(),this._startLoop()):this._hasActiveSource(s)?this._update():(this._clearModifiers(),this._stopLoop())},_hasActiveSource(t){let e=t||this.load();return e.timeOfDay||e.seasonal},_captureBaseHues(){let t=document.documentElement;t.style.removeProperty("--hue-primary"),t.style.removeProperty("--hue-secondary"),t.style.removeProperty("--hue-accent");let e=t.getAttribute("data-theme");if(e){let s=`[data-theme~="${e}"]`;for(let n of document.styleSheets)try{for(let r=0;r<n.cssRules.length;r++){let i=n.cssRules[r];if(i.selectorText?.includes(s)&&!i.selectorText.includes("dark")){let a=i.style?.getPropertyValue("--hue-primary");if(a){this._baseHues={primary:parseFloat(a)||260,secondary:parseFloat(i.style.getPropertyValue("--hue-secondary"))||200,accent:parseFloat(i.style.getPropertyValue("--hue-accent"))||30};return}}}}catch{}}this._baseHues={primary:260,secondary:200,accent:30}},_update(){let t=this.load(),e=0;t.timeOfDay&&(e+=this._getTimeOfDayOffset()),t.seasonal&&(e+=this._getSeasonalOffset());let s=document.documentElement;e!==0&&this._baseHues?(s.style.setProperty("--hue-primary",String(this._baseHues.primary+e)),s.style.setProperty("--hue-secondary",String(this._baseHues.secondary+e)),s.style.setProperty("--hue-accent",String(this._baseHues.accent+e*.5))):e===0&&this._clearModifiers()},_clearModifiers(){let t=document.documentElement;t.style.removeProperty("--hue-primary"),t.style.removeProperty("--hue-secondary"),t.style.removeProperty("--hue-accent")},_getTimeOfDayOffset(){let t=this._timeOverride??new Date().getHours()+new Date().getMinutes()/60;return t<5?-20:t<7?g(-20,20,(t-5)/2):t<10?g(20,5,(t-7)/3):t<14?g(5,0,(t-10)/4):t<17?g(0,-5,(t-14)/3):t<19?g(-5,15,(t-17)/2):t<21?g(15,-10,(t-19)/2):g(-10,-20,(t-21)/8)},_getHemisphere(){return window.__VB_ENV_LOCATION?.hemisphere||"north"},_getSeasonalOffset(){let t=this._monthOverride??new Date().getMonth(),s=this._getHemisphere()==="south"?(t+6)%12:t;return s>=2&&s<=4?5:s>=5&&s<=7?10:s>=8&&s<=10?-5:-10},_startLoop(){this._timer||(this._timer=setInterval(()=>this._update(),me))},_stopLoop(){this._timer&&clearInterval(this._timer),this._timer=null}};se.init();
//# sourceMappingURL=ui.full.js.map
