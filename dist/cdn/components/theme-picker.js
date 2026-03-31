var Z=Object.defineProperty;var ee=(t,e)=>()=>(t&&(e=t(t=0)),e);var te=(t,e)=>{for(var a in e)Z(t,a,{get:e[a],enumerable:!0})};var W={};te(W,{SoundManager:()=>oe});var J,I,oe,K=ee(()=>{J="vb-sound",I={enabled:!1,volume:.5},oe={_ctx:null,_enabled:!1,_volume:.5,_initialized:!1,init(){if(this._initialized)return this;let t=this._load();return this._enabled=t.enabled,this._volume=t.volume,this._initialized=!0,this},_getContext(){return this._ctx||(this._ctx=new(window.AudioContext||window.webkitAudioContext)),this._ctx.state==="suspended"&&this._ctx.resume(),this._ctx},_load(){try{let t=localStorage.getItem(J);return t?{...I,...JSON.parse(t)}:{...I}}catch{return{...I}}},_save(t){try{let e=this._load();localStorage.setItem(J,JSON.stringify({...e,...t}))}catch{}},_playTone(t,e,a="sine"){if(!this._enabled)return;let i=this._getContext(),c=i.createOscillator(),n=i.createGain();c.connect(n),n.connect(i.destination),c.frequency.value=t,c.type=a,n.gain.value=this._volume*.3,c.start(),n.gain.exponentialRampToValueAtTime(.01,i.currentTime+e),c.stop(i.currentTime+e)},enable(){this._enabled=!0,this._save({enabled:!0}),this.play("click")},disable(){this._enabled=!1,this._save({enabled:!1})},toggle(){return this._enabled?this.disable():this.enable(),this._enabled},isEnabled(){return this._enabled},setVolume(t){this._volume=Math.max(0,Math.min(1,t)),this._save({volume:this._volume})},getVolume(){return this._volume},play(t){if(this._enabled)switch(t){case"click":this._playTone(800,.1);break;case"success":this._playTone(523,.1),setTimeout(()=>this._playTone(659,.1),100),setTimeout(()=>this._playTone(784,.15),200);break;case"error":this._playTone(200,.15,"sawtooth"),setTimeout(()=>this._playTone(180,.2,"sawtooth"),150);break;case"notification":this._playTone(880,.1),setTimeout(()=>this._playTone(1100,.15),100);break;case"soft":this._playTone(600,.05);break;case"tick":this._playTone(1200,.02,"square");break}},getState(){return{enabled:this._enabled,volume:this._volume}}}});var le=window.matchMedia("(prefers-reduced-motion: reduce)");var N=new Map;function G(t,e,a={}){let i=a.priority??10,c={impl:e,bundle:a.bundle,contract:a.contract,priority:i},n=N.get(t);if(customElements.get(t)){if(!n||n.priority>=i){n&&n.priority===i&&n.impl!==e&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${a.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${a.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=i){n.priority===i&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${n.bundle}". Skipping "${a.bundle}" (first wins at equal priority).`);return}N.set(t,c),customElements.define(t,e)}var k=class extends HTMLElement{#n=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let e of this.#n)e();this.#n=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,a,i,c){e.addEventListener(a,i,c),this.#n.push(()=>e.removeEventListener(a,i,c))}setup(){}teardown(){}};var f=new Map,w=null,g=null,V=null;function x(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(V)return V;if(typeof document<"u"){let t=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let e of t){let a=e.getAttribute("src");if(a){let i=a.lastIndexOf("/");if(i!==-1)return a.slice(0,i)}}}return"/cdn"}async function ae(){if(w)return w;let t=x();try{let e=await fetch(`${t}/themes/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);w=await e.json()}catch{w={}}return w}var se=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","modern","minimal","classic"]);async function A(t){if(!t||se.has(t))return;if(f.has(t))return f.get(t);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${t}"]`)){f.set(t,Promise.resolve());return}let e=ne(t);return f.set(t,e),e}async function ie(){if(g)return g;let t=x();try{let e=await fetch(`${t}/packs/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);g=await e.json()}catch{try{let e=await fetch(`${t}/bundles/manifest.json`);if(!e.ok)throw new Error(`HTTP ${e.status}`);g=await e.json()}catch{g={}}}return g}async function ne(t){let e=x();if((await ie())[t])return ce(t,e);let c=(await ae())[t],n=c?c.file:`${t}.css`,s=`${e}/themes/${n}`;return new Promise((o,l)=>{let h=document.querySelector(`link[data-vb-theme-preload="${t}"]`);h&&h.remove();let d=document.createElement("link");d.rel="stylesheet",d.href=s,d.setAttribute("data-vb-theme",t),d.onload=()=>o(),d.onerror=()=>{d.remove(),f.delete(t),l(new Error(`Failed to load theme: ${t}`))},document.head.appendChild(d)})}function ce(t,e){let a=`${e}/packs/${t}.full.css`,i=`${e}/packs/${t}.full.js`;return new Promise((c,n)=>{let s=document.createElement("link");s.rel="stylesheet",s.href=a,s.setAttribute("data-vb-theme",t),s.setAttribute("data-vb-pack",t),s.onload=()=>{import(i).catch(()=>{}),c()},s.onerror=()=>{s.remove(),f.delete(t),n(new Error(`Failed to load pack: ${t}`))},document.head.appendChild(s)})}var _=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}],b=[{id:"default",name:"Default",swatchBg:"#3b82f6",seeds:{}},{id:"ocean",name:"Ocean",swatchBg:"#0891b2",seeds:{"--hue-primary":200,"--hue-secondary":180,"--hue-accent":45,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"45%","--chroma-secondary":.1,"--lightness-accent":"70%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"forest",name:"Forest",swatchBg:"#059669",seeds:{"--hue-primary":145,"--hue-secondary":90,"--hue-accent":30,"--lightness-primary":"45%","--chroma-primary":.15,"--lightness-secondary":"55%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"55%","--chroma-primary":.12}},{id:"sunset",name:"Sunset",swatchBg:"#ea580c",seeds:{"--hue-primary":25,"--hue-secondary":0,"--hue-accent":280,"--lightness-primary":"60%","--chroma-primary":.2,"--lightness-secondary":"55%","--chroma-secondary":.18,"--lightness-accent":"55%","--chroma-accent":.18},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.16}},{id:"rose",name:"Rose",swatchBg:"#e11d48",seeds:{"--hue-primary":350,"--hue-secondary":330,"--hue-accent":200,"--lightness-primary":"55%","--chroma-primary":.18,"--lightness-secondary":"50%","--chroma-secondary":.14,"--lightness-accent":"60%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.14}},{id:"lavender",name:"Lavender",swatchBg:"#a855f7",seeds:{"--hue-primary":280,"--hue-secondary":300,"--hue-accent":60,"--lightness-primary":"55%","--chroma-primary":.14,"--lightness-secondary":"50%","--chroma-secondary":.12,"--lightness-accent":"70%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.12}},{id:"coral",name:"Coral",swatchBg:"#f97316",seeds:{"--hue-primary":15,"--hue-secondary":25,"--hue-accent":180,"--lightness-primary":"60%","--chroma-primary":.18,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"55%","--chroma-accent":.12},seedsDark:{"--lightness-primary":"65%","--chroma-primary":.15}},{id:"slate",name:"Slate",swatchBg:"#64748b",seeds:{"--hue-primary":220,"--hue-secondary":210,"--hue-accent":45,"--lightness-primary":"48%","--chroma-primary":.1,"--lightness-secondary":"45%","--chroma-secondary":.06,"--lightness-accent":"68%","--chroma-accent":.15},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.08}},{id:"emerald",name:"Emerald",swatchBg:"#10b981",seeds:{"--hue-primary":160,"--hue-secondary":140,"--hue-accent":30,"--lightness-primary":"50%","--chroma-primary":.15,"--lightness-secondary":"48%","--chroma-secondary":.12,"--lightness-accent":"65%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"60%","--chroma-primary":.12}},{id:"amber",name:"Amber",swatchBg:"#f59e0b",seeds:{"--hue-primary":45,"--hue-secondary":30,"--hue-accent":240,"--lightness-primary":"60%","--chroma-primary":.16,"--lightness-secondary":"55%","--chroma-secondary":.15,"--lightness-accent":"52%","--chroma-accent":.14},seedsDark:{"--lightness-primary":"68%","--chroma-primary":.14}},{id:"indigo",name:"Indigo",swatchBg:"#6366f1",seeds:{"--hue-primary":250,"--hue-secondary":270,"--hue-accent":35,"--lightness-primary":"48%","--chroma-primary":.18,"--lightness-secondary":"45%","--chroma-secondary":.14,"--lightness-accent":"68%","--chroma-accent":.16},seedsDark:{"--lightness-primary":"62%","--chroma-primary":.14}}],T=[{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated",swatchBg:"#6366f1",tier:"core"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat",swatchBg:"#71717a",tier:"core"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant",swatchBg:"#92400e",tier:"core"}],M=[{id:"swiss",name:"Swiss",icon:"grid-3x3",character:"Precision grid",swatchBg:"#ff3e00",swatchFg:"white",tier:"showcase",category:"Design"},{id:"brutalist",name:"Brutalist",icon:"square",character:"Raw, industrial",swatchBg:"#1a1a1a",swatchFg:"#f5f5f5",tier:"showcase",category:"Design"},{id:"art-deco",name:"Art Deco",icon:"crown",character:"1920s luxury",swatchBg:"#1A1A1A",swatchFg:"#C9A84C",tier:"showcase",category:"Design"},{id:"editorial",name:"Editorial",icon:"newspaper",character:"Magazine elegance",swatchBg:"#1a1a1a",swatchFg:"#c9a227",tier:"showcase",category:"Content"},{id:"genai",name:"GenAI",icon:"sparkles",character:"AI aesthetic",swatchBg:"#1a0a2e",swatchFg:"#a855f7",tier:"showcase",category:"Modern"},{id:"glassmorphism",name:"Glass",icon:"glass-water",character:"Frosted surfaces",swatchBg:"#667eea",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"startup",name:"Startup",icon:"rocket",character:"SaaS energy",swatchBg:"#4f46e5",swatchFg:"#ffffff",tier:"showcase",category:"Modern"},{id:"organic",name:"Organic",icon:"leaf",character:"Natural, handcrafted",swatchBg:"#2d5016",swatchFg:"#faf5e6",tier:"showcase",category:"Creative"},{id:"rough",name:"Rough",icon:"pencil",character:"Hand-drawn sketch",swatchBg:"#f5f0e8",swatchFg:"#3a3a3a",tier:"showcase",category:"Creative"},{id:"cyber",name:"Cyber",icon:"zap",character:"Neon futuristic",swatchBg:"#0a0a1a",swatchFg:"#00ff88",tier:"showcase",category:"Creative"},{id:"vaporwave",name:"Vaporwave",icon:"radio",character:"Neon dreamy",swatchBg:"#2b0040",swatchFg:"#ff6ad5",tier:"showcase",category:"Aesthetic"},{id:"neumorphism",name:"Neumorph",icon:"circle",character:"Soft embossed",swatchBg:"#e0e0e0",swatchFg:"#a0a0a0",tier:"showcase",category:"Aesthetic"},{id:"bauhaus",name:"Bauhaus",icon:"shapes",character:"Geometric",swatchBg:"#F1FAEE",swatchFg:"#E63946",tier:"showcase",category:"Aesthetic"},{id:"claymorphism",name:"Clay",icon:"circle-dot",character:"Puffy 3D",swatchBg:"#f0f0f5",swatchFg:"#FF6B9D",tier:"showcase",category:"Aesthetic"},{id:"alpha1999",name:"Alpha1999",icon:"orbit",character:"Space retro-fi",swatchBg:"#0a0a14",swatchFg:"#d4880f",tier:"showcase",category:"Signature"},{id:"super2026",name:"Super2026",icon:"triangle",character:"Supergraphic bold",swatchBg:"#f5f0e6",swatchFg:"#c23616",tier:"showcase",category:"Signature"},{id:"win9x",name:"Win9x",icon:"monitor",character:"Classic desktop",swatchBg:"#008080",swatchFg:"#c0c0c0",tier:"showcase",category:"OS Styles"},{id:"nes",name:"NES",icon:"joystick",character:"Console pixels",swatchBg:"#bcbcbc",swatchFg:"#e40521",tier:"showcase",category:"OS Styles"},{id:"8bit",name:"8-Bit",icon:"gamepad-2",character:"Retro pixel art",swatchBg:"#000080",swatchFg:"#ffff00",tier:"showcase",category:"OS Styles"},{id:"magna",name:"Magna",icon:"orbit",character:"Odyssey 2 retro",swatchBg:"#0d0b14",swatchFg:"#f97316",tier:"showcase",category:"OS Styles"}],v=[{id:"nord",name:"Nord",icon:"snowflake",character:"Arctic calm",swatchBg:"#2E3440",swatchFg:"#81A1C1",tier:"community",category:"Editor Palettes"},{id:"solarized",name:"Solarized",icon:"sun-dim",character:"Engineered precision",swatchBg:"#002B36",swatchFg:"#268BD2",tier:"community",category:"Editor Palettes"},{id:"dracula",name:"Dracula",icon:"moon-star",character:"Dark elegance",swatchBg:"#282A36",swatchFg:"#BD93F9",tier:"community",category:"Editor Palettes"},{id:"catppuccin-mocha",name:"Catppuccin",icon:"coffee",character:"Warm pastels",swatchBg:"#1E1E2E",swatchFg:"#CBA6F7",tier:"community",category:"Editor Palettes"},{id:"catppuccin-latte",name:"Ctp Latte",icon:"coffee",character:"Cozy daytime",swatchBg:"#eff1f5",swatchFg:"#8839ef",tier:"community",category:"Editor Palettes"},{id:"catppuccin-frappe",name:"Ctp Frapp\xE9",icon:"coffee",character:"Cool twilight",swatchBg:"#303446",swatchFg:"#ca9ee6",tier:"community",category:"Editor Palettes"},{id:"catppuccin-macchiato",name:"Ctp Macchiato",icon:"coffee",character:"Deep blue",swatchBg:"#24273a",swatchFg:"#c6a0f6",tier:"community",category:"Editor Palettes"},{id:"gruvbox",name:"Gruvbox",icon:"palette",character:"Retro warmth",swatchBg:"#282828",swatchFg:"#ebdbb2",tier:"community",category:"Editor Palettes"},{id:"tokyo-night",name:"Tokyo Night",icon:"moon",character:"Night-owl vibes",swatchBg:"#1a1b26",swatchFg:"#7aa2f7",tier:"community",category:"Editor Palettes"},{id:"rose-pine",name:"Ros\xE9 Pine",icon:"flower-2",character:"Muted elegance",swatchBg:"#191724",swatchFg:"#ebbcba",tier:"community",category:"Editor Palettes"},{id:"cottagecore",name:"Cottagecore",icon:"flower-2",character:"Pastoral",swatchBg:"#fdf8f0",swatchFg:"#7d8c6d",tier:"community",category:"Niche"},{id:"terminal",name:"Terminal",icon:"terminal",character:"Retro CRT",swatchBg:"#0d1117",swatchFg:"#00ff00",tier:"community",category:"Niche"},{id:"clinical",name:"Clinical",icon:"heart-pulse",character:"Sterile precision",swatchBg:"#ffffff",swatchFg:"#0077b6",tier:"community",category:"Industry"},{id:"financial",name:"Financial",icon:"landmark",character:"Navy + gold",swatchBg:"#1b2a4a",swatchFg:"#c9a84c",tier:"community",category:"Industry"},{id:"government",name:"Government",icon:"shield",character:"Official",swatchBg:"#002868",swatchFg:"#bf0a30",tier:"community",category:"Industry"},{id:"dawn",name:"Dawn",icon:"sunrise",character:"Golden morning",swatchBg:"#fef3e2",swatchFg:"#d4a574",tier:"community",category:"Mood/Time"},{id:"dusk",name:"Dusk",icon:"sunset",character:"Twilight",swatchBg:"#1a1b2e",swatchFg:"#e5a858",tier:"community",category:"Mood/Time"},{id:"midnight",name:"Midnight",icon:"moon",character:"Deep night",swatchBg:"#0d1117",swatchFg:"#58a6ff",tier:"community",category:"Mood/Time"},{id:"high-noon",name:"High Noon",icon:"sun",character:"Maximum bright",swatchBg:"#ffffff",swatchFg:"#e63946",tier:"community",category:"Mood/Time"}],U=[{id:"kawaii",name:"Kawaii",icon:"heart",character:"Cute aesthetic",swatchBg:"#ffb7c5",swatchFg:"#ff69b4",tier:"showcase",category:"Packs"},{id:"retro",name:"Retro",icon:"tv",character:"CRT terminal",swatchBg:"#0a0a14",swatchFg:"#00ff66",tier:"showcase",category:"Packs"},{id:"memphis",name:"Memphis",icon:"star",character:"Bold patterns",swatchBg:"#FFF8F0",swatchFg:"#d03040",tier:"showcase",category:"Packs"}],F=[{id:"",name:"Fixed",icon:"ruler",description:"Static token values"},{id:"default",name:"Fluid",icon:"move-diagonal-2",description:"Smooth viewport scaling"},{id:"compact",name:"Compact",icon:"minimize-2",description:"Tighter fluid range"},{id:"spacious",name:"Spacious",icon:"maximize-2",description:"Generous fluid range"}],P=[{id:"a11y-high-contrast",name:"High Contrast",icon:"contrast",description:"AAA contrast (7:1+)"},{id:"a11y-large-text",name:"Large Text",icon:"type",description:"25% larger fonts"},{id:"a11y-dyslexia",name:"Dyslexia",icon:"book-open",description:"Readable typography"}],O=[{id:"motionFx",name:"Motion Effects",icon:"sparkles",description:"Hover & enter animations"},{id:"sounds",name:"Sound Effects",icon:"volume-2",description:"Audio feedback"}],ue=[...M,...v],pe=[...T,...M,...v,...U],p=t=>M.filter(e=>e.category===t),D=[{label:"Style",themes:T,tier:"core"},{label:"Design",themes:p("Design"),tier:"showcase"},{label:"Content",themes:p("Content"),tier:"showcase"},{label:"Modern",themes:p("Modern"),tier:"showcase"},{label:"Creative",themes:p("Creative"),tier:"showcase"},{label:"Aesthetic",themes:p("Aesthetic"),tier:"showcase"},{label:"Signature",themes:p("Signature"),tier:"showcase"},{label:"OS Styles",themes:p("OS Styles"),tier:"showcase"},{label:"Packs",themes:U,tier:"showcase"},{label:"More Themes",themes:v,tier:"community"}];var L="vb-theme",C={mode:"auto",brand:"default",accent:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},Y=["--hue-primary","--hue-secondary","--hue-accent","--lightness-primary","--chroma-primary","--lightness-secondary","--chroma-secondary","--lightness-accent","--chroma-accent"],u={_initPromise:null,async init(){return this._initPromise?this._initPromise:(this._initPromise=(async()=>{let t=this.load();try{await A(t.brand)}catch{t.brand="default"}return this.apply(t),this._watchSystemPreference(),t})(),this._initPromise)},load(){try{let t=localStorage.getItem(L);return t?{...C,...JSON.parse(t)}:{...C}}catch{return{...C}}},save(t){let a={...this.load(),...t};try{localStorage.setItem(L,JSON.stringify(a))}catch{}return a},apply({mode:t="auto",brand:e="default",borderStyle:a="",iconSet:i="",fluid:c="",backdrop:n="",backdropChrome:s="",pageBgType:o="",pageBgColor:l="",pageBgGradStart:h="",pageBgGradEnd:d="",pageBgGradDir:m=""}={}){let r=document.documentElement;r.dataset.mode=t==="auto"?this.getEffectiveMode():t;let j=(r.dataset.theme||"").split(" ").filter(B=>B.startsWith("a11y-")),q=e!=="default"?[e,...j]:[...j];q.length?r.dataset.theme=q.join(" "):delete r.dataset.theme;let S=a||this._readCSSHint("--theme-border-style");S&&S!=="clean"?r.dataset.borderStyle=S:delete r.dataset.borderStyle;let $=i||this._readCSSHint("--theme-icon-set");if($&&$!=="lucide"?r.dataset.iconSet=$:delete r.dataset.iconSet,c?r.dataset.fluid=c:delete r.dataset.fluid,n?r.dataset.backdrop=n:delete r.dataset.backdrop,s&&s!=="card"?r.dataset.backdropChrome=s:delete r.dataset.backdropChrome,o==="color"&&l)r.style.setProperty("--page-bg-color",l),r.style.removeProperty("--page-bg-gradient");else if(o==="gradient"&&h&&d){let B=m||"to bottom";r.style.setProperty("--page-bg-gradient",`linear-gradient(${B}, ${h}, ${d})`),r.style.removeProperty("--page-bg-color")}else r.style.removeProperty("--page-bg-color"),r.style.removeProperty("--page-bg-gradient");let z=this.load().accent||"default";this._applyAccent(z),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:t,brand:e,accent:z,borderStyle:S,iconSet:$,fluid:c,backdrop:n,backdropChrome:s,pageBgType:o,effectiveMode:this.getEffectiveMode()}}))},setMode(t){let e=this.save({mode:t});this.apply(e)},async setBrand(t){try{await A(t)}catch(a){console.warn(`[VB] Theme "${t}" failed to load, using default`,a),t="default"}let e=this.save({brand:t});this.apply(e)},setAccent(t){let e=this.save({accent:t});this._applyAccent(t),window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{...this.getState()}}))},setBorderStyle(t){let e=this.save({borderStyle:t});this.apply(e)},setIconSet(t){let e=this.save({iconSet:t});this.apply(e)},setFluid(t){let e=this.save({fluid:t});this.apply(e)},setBackdrop(t){let e=this.save({backdrop:t});this.apply(e)},setBackdropChrome(t){let e=this.save({backdropChrome:t});this.apply(e)},setPageBg({type:t="",color:e="",gradStart:a="",gradEnd:i="",gradDir:c=""}={}){let n=this.save({pageBgType:t,pageBgColor:e,pageBgGradStart:a,pageBgGradEnd:i,pageBgGradDir:c});this.apply(n)},getEffectiveMode(){let{mode:t}=this.load();return t!=="auto"?t:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:t,brand:e,accent:a,borderStyle:i,iconSet:c,fluid:n,backdrop:s,backdropChrome:o,pageBgType:l,pageBgColor:h,pageBgGradStart:d,pageBgGradEnd:m,pageBgGradDir:r}=this.load();return{mode:t,brand:e,accent:a,borderStyle:i,iconSet:c,fluid:n,backdrop:s,backdropChrome:o,pageBgType:l,pageBgColor:h,pageBgGradStart:d,pageBgGradEnd:m,pageBgGradDir:r,effectiveMode:this.getEffectiveMode()}},toggleMode(){let e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(L)}catch{}let t=document.documentElement;t.style.removeProperty("--page-bg-color"),t.style.removeProperty("--page-bg-gradient");for(let e of Y)t.style.removeProperty(e);this.apply(C)},_readCSSHint(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()},_applyAccent(t){let e=document.documentElement,a=b.find(i=>i.id===t);for(let i of Y)e.style.removeProperty(i);if(!(!a||!a.seeds||Object.keys(a.seeds).length===0)){for(let[i,c]of Object.entries(a.seeds))e.style.setProperty(i,String(c));if(a.seedsDark&&this.getEffectiveMode()==="dark")for(let[i,c]of Object.entries(a.seedsDark))e.style.setProperty(i,String(c))}},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let e=this.load();e.mode==="auto"&&this.apply(e)})}};var y=null,X="vb-extensions",E={motionFx:!0,sounds:!1},Q="vb-a11y-themes",H=class t extends k{static#n=200;#t;#e;#a=!1;#s=!1;#u=!1;#o=null;#p=!1;#i=()=>this.#b();setup(){this.#s=this.getAttribute("variant")==="inline",this.#u=this.hasAttribute("compact"),this.#v(),this.#k(),this.#w(),this.listen(window,"vb:theme-change",this.#D),this.#y(),this.#d()}teardown(){window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.#m()}#v(){this.#s||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <icon-wc name="palette" label="Theme settings"></icon-wc>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#s||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#E(),this.appendChild(this.#e)}#E(){return this.#u?this.#$():this.#S()}#h(e,a){let i=e.swatchBg,c=e.swatchFg||"white",n=e.icon||"";return`
      <label class="swatch-cell" title="${e.character?`${e.name} \u2014 ${e.character}`:e.name}">
        <input
          type="radio"
          name="theme-brand"
          value="${e.id}"
          ${a===e.id?"checked":""}
        />
        <span class="swatch-visual" style="--swatch-bg: ${i}; --swatch-fg: ${c}">
          ${n?`<icon-wc name="${n}"></icon-wc>`:""}
          <span class="sr-only">${e.name}</span>
        </span>
      </label>
    `}#S(){let{mode:e,brand:a,fluid:i,accent:c}=u.getState(),n=D.filter(s=>s.tier==="showcase");return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${_.map(s=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${s.id}"
                ${e===s.id?"checked":""}
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
          ${b.map(s=>`
            <label class="accent-dot" title="${s.name}">
              <input type="radio" name="theme-accent" value="${s.id}" ${c===s.id?"checked":""} />
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
              ${s.themes.map(o=>this.#h(o,a)).join("")}
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
          ${v.map(s=>this.#h(s,a)).join("")}
        </div>
      </details>

      <fieldset class="section section--a11y">
        <legend>Accessibility</legend>
        <div class="options options--a11y" aria-label="Accessibility themes">
          ${P.map(s=>{let l=this.#l().includes(s.id);return`
            <label class="option option--a11y">
              <input
                type="checkbox"
                name="a11y-theme"
                value="${s.id}"
                data-a11y-theme="${s.id}"
                ${l?"checked":""}
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
          ${O.map(s=>{let l=this.#r()[s.id]??E[s.id];return`
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
                ${l?"checked":""}
              />
            </label>
          `}).join("")}
        </div>
      </details>
    `}#$(){let{mode:e,brand:a,fluid:i,accent:c}=u.getState(),n=this.#l(),s=this.#r();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="compact-segmented" role="radiogroup" aria-label="Color mode">
          ${_.map(o=>`
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
          ${b.map(o=>`
            <option value="${o.id}" ${c===o.id?"selected":""}>${o.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Theme</legend>
        <select class="compact-select" name="theme-brand-select" aria-label="Theme">
          ${D.map(o=>`
            <optgroup label="${o.label}">
              ${o.themes.map(l=>`
                <option value="${l.id}" ${a===l.id?"selected":""}>${l.name}</option>
              `).join("")}
            </optgroup>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Sizing</legend>
        <select class="compact-select" name="theme-fluid-select" aria-label="Sizing">
          ${F.map(o=>`
            <option value="${o.id}" ${i===o.id?"selected":""}>${o.name}</option>
          `).join("")}
        </select>
      </fieldset>

      <fieldset class="section">
        <legend>Accessibility</legend>
        <div class="compact-toggles">
          ${P.map(o=>`
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
          ${O.map(o=>`
            <label class="extension-toggle">
              <span class="extension-info">
                <span class="extension-name">${o.name}</span>
              </span>
              <input type="checkbox" name="ext-${o.id}" data-extension="${o.id}" data-switch="sm" ${s[o.id]??E[o.id]?"checked":""} />
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#k(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(n=>{n.addEventListener("change",this.#x)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(n=>{n.addEventListener("change",this.#A)});let e=this.#e.querySelector('select[name="theme-brand-select"]');e&&e.addEventListener("change",this.#_),this.#e.querySelectorAll('input[name="theme-fluid"]').forEach(n=>{n.addEventListener("change",this.#g)});let a=this.#e.querySelector('select[name="theme-fluid-select"]');a&&a.addEventListener("change",this.#g),this.#e.querySelectorAll('input[name="theme-accent"]').forEach(n=>{n.addEventListener("change",this.#f)});let i=this.#e.querySelector('select[name="theme-accent-select"]');i&&i.addEventListener("change",this.#f),this.#e.querySelectorAll("input[data-extension]").forEach(n=>{n.addEventListener("change",this.#M)}),this.#e.querySelectorAll("input[data-a11y-theme]").forEach(n=>{n.addEventListener("change",this.#O)}),this.#e.querySelector(".section--extensions")?.addEventListener("toggle",n=>{this.#p=n.target.open}),this.#s||(this.listen(this.#t,"click",this.#T),this.listen(document,"click",this.#C),this.listen(document,"keydown",this.#B))}#T=e=>{e.stopPropagation(),this.toggle()};#C=e=>{this.#a&&!this.contains(e.target)&&this.close()};#B=e=>{e.key==="Escape"&&this.#a&&(e.preventDefault(),this.close(),this.#t?.focus())};#x=e=>{u.setMode(e.target.value),this.#c()};#A=async e=>{let a=e.target.closest(".swatch-cell");a&&a.setAttribute("aria-busy","true");try{await u.setBrand(e.target.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a&&a.removeAttribute("aria-busy")}this.#d(),this.#c()};#_=async e=>{let a=e.target;a.disabled=!0;try{await u.setBrand(a.value)}catch{console.warn("[VB] Theme load failed, using default")}finally{a.disabled=!1}this.#d(),this.#c()};#g=e=>{u.setFluid(e.target.value),this.#c()};#f=e=>{u.setAccent(e.target.value),this.#c()};#M=e=>{let a=e.target.dataset.extension,i=e.target.checked;this.#F(a,i),this.#y()};#r(){try{let e=localStorage.getItem(X);return e?{...E,...JSON.parse(e)}:{...E}}catch{return{...E}}}#F(e,a){try{let i=this.#r();i[e]=a,localStorage.setItem(X,JSON.stringify(i))}catch{}}async#y(){let e=this.#r(),a=document.documentElement;e.motionFx?delete a.dataset.motionReduced:a.dataset.motionReduced="",e.sounds?(y||(y=(await Promise.resolve().then(()=>(K(),W))).SoundManager),y.init(),y.enable()):y&&y.disable(),window.dispatchEvent(new CustomEvent("vb:extensions-change",{detail:e}))}#l(){try{let e=localStorage.getItem(Q);return e?JSON.parse(e):[]}catch{return[]}}#P(e){try{localStorage.setItem(Q,JSON.stringify(e))}catch{}}#d(){let e=this.#l(),{brand:a}=u.getState(),i=document.documentElement,c=a==="default"?e.join(" "):[a,...e].join(" "),n=i.dataset.theme||"";c!==n&&(c?i.dataset.theme=c:delete i.dataset.theme)}#O=e=>{let a=e.target.dataset.a11yTheme,i=e.target.checked,c=this.#l();if(i&&!c.includes(a))c.push(a);else if(!i&&c.includes(a)){let n=c.indexOf(a);c.splice(n,1)}this.#P(c),this.#d()};#c(){this.#s||(this.#m(),this.#o=setTimeout(()=>{this.close(),this.#t?.focus()},t.#n))}#m(){this.#o&&(clearTimeout(this.#o),this.#o=null)}#D=()=>{this.#w()};#w(){let{mode:e,brand:a,fluid:i,accent:c}=u.getState(),n=this.#e.querySelector(`input[name="theme-mode"][value="${e}"]`);n&&(n.checked=!0);let s=this.#e.querySelector(`input[name="theme-brand"][value="${a}"]`);s&&(s.checked=!0);let o=this.#e.querySelector('select[name="theme-brand-select"]');o&&(o.value=a);let l=this.#e.querySelector(`input[name="theme-fluid"][value="${i}"]`);l&&(l.checked=!0);let h=this.#e.querySelector('select[name="theme-fluid-select"]');h&&(h.value=i);let d=this.#e.querySelector(`input[name="theme-accent"][value="${c||"default"}"]`);d&&(d.checked=!0);let m=this.#e.querySelector('select[name="theme-accent-select"]');m&&(m.value=c||"default")}open(){this.#s||this.#a||(this.#a=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#b(),window.addEventListener("scroll",this.#i,{capture:!0,passive:!0}),window.addEventListener("resize",this.#i,{passive:!0}),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-picker:open",{bubbles:!0})))}#b(){if(!this.#t||!this.#e)return;let e=this.#t.getBoundingClientRect(),a=this.#e.getBoundingClientRect(),i=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},c=i.height,n=i.width,s=8,o=16,l=c-e.bottom-o,h=e.top-o,d=e.height+s;l<a.height&&h>l?(d=-a.height-s,this.#e.dataset.position="top"):delete this.#e.dataset.position;let m=0,r=e.left+a.width+o,R=e.left+m;r>n&&(m=n-r),R+m<o&&(m=o-e.left),this.#e.style.setProperty("--panel-top",`${d}px`),this.#e.style.setProperty("--panel-left",`${m}px`)}close(){this.#s||!this.#a||(this.#m(),this.#a=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),window.removeEventListener("scroll",this.#i,{capture:!0}),window.removeEventListener("resize",this.#i),this.dispatchEvent(new CustomEvent("theme-picker:close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}};G("theme-picker",H);export{H as ThemePicker};
//# sourceMappingURL=theme-picker.js.map
