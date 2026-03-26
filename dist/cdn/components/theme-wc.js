var f=new Map,m=null,u=null,A=null;function E(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(A)return A;if(typeof document<"u"){let e=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let t of e){let n=t.getAttribute("src");if(n){let s=n.lastIndexOf("/");if(s!==-1)return n.slice(0,s)}}}return"/cdn"}async function P(){if(m)return m;let e=E();try{let t=await fetch(`${e}/themes/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);m=await t.json()}catch{m={}}return m}var B=new Set(["default","a11y-high-contrast","a11y-large-text","a11y-dyslexia","ocean","forest","sunset","rose","lavender","coral","slate","emerald","amber","indigo","modern","minimal","classic"]);async function S(e){if(!e||B.has(e))return;if(f.has(e))return f.get(e);if(typeof document<"u"&&document.querySelector(`link[data-vb-theme="${e}"]`)){f.set(e,Promise.resolve());return}let t=L(e);return f.set(e,t),t}async function x(){if(u)return u;let e=E();try{let t=await fetch(`${e}/packs/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);u=await t.json()}catch{try{let t=await fetch(`${e}/bundles/manifest.json`);if(!t.ok)throw new Error(`HTTP ${t.status}`);u=await t.json()}catch{u={}}}return u}async function L(e){let t=E();if((await x())[e])return H(e,t);let o=(await P())[e],d=o?o.file:`${e}.css`,a=`${t}/themes/${d}`;return new Promise((c,l)=>{let h=document.querySelector(`link[data-vb-theme-preload="${e}"]`);h&&h.remove();let r=document.createElement("link");r.rel="stylesheet",r.href=a,r.setAttribute("data-vb-theme",e),r.onload=()=>c(),r.onerror=()=>{r.remove(),f.delete(e),l(new Error(`Failed to load theme: ${e}`))},document.head.appendChild(r)})}function H(e,t){let n=`${t}/packs/${e}.full.css`,s=`${t}/packs/${e}.full.js`;return new Promise((o,d)=>{let a=document.createElement("link");a.rel="stylesheet",a.href=n,a.setAttribute("data-vb-theme",e),a.setAttribute("data-vb-pack",e),a.onload=()=>{import(s).catch(()=>{}),o()},a.onerror=()=>{a.remove(),f.delete(e),d(new Error(`Failed to load pack: ${e}`))},document.head.appendChild(a)})}var $="vb-theme",v={mode:"auto",brand:"default",borderStyle:"",iconSet:"",fluid:"",backdrop:"",backdropChrome:"",pageBgType:"",pageBgColor:"",pageBgGradStart:"",pageBgGradEnd:"",pageBgGradDir:""},g={async init(){let e=this.load();try{await S(e.brand)}catch{e.brand="default"}return this.apply(e),this._watchSystemPreference(),e},load(){try{let e=localStorage.getItem($);return e?{...v,...JSON.parse(e)}:{...v}}catch{return{...v}}},save(e){let n={...this.load(),...e};try{localStorage.setItem($,JSON.stringify(n))}catch{}return n},apply({mode:e="auto",brand:t="default",borderStyle:n="",iconSet:s="",fluid:o="",backdrop:d="",backdropChrome:a="",pageBgType:c="",pageBgColor:l="",pageBgGradStart:h="",pageBgGradEnd:r="",pageBgGradDir:p=""}={}){let i=document.documentElement;i.dataset.mode=e==="auto"?this.getEffectiveMode():e;let C=(i.dataset.theme||"").split(" ").filter(w=>w.startsWith("a11y-")),T=t!=="default"?[t,...C]:[...C];T.length?i.dataset.theme=T.join(" "):delete i.dataset.theme;let y=n||this._readCSSHint("--theme-border-style");y&&y!=="clean"?i.dataset.borderStyle=y:delete i.dataset.borderStyle;let b=s||this._readCSSHint("--theme-icon-set");if(b&&b!=="lucide"?i.dataset.iconSet=b:delete i.dataset.iconSet,o?i.dataset.fluid=o:delete i.dataset.fluid,d?i.dataset.backdrop=d:delete i.dataset.backdrop,a&&a!=="card"?i.dataset.backdropChrome=a:delete i.dataset.backdropChrome,c==="color"&&l)i.style.setProperty("--page-bg-color",l),i.style.removeProperty("--page-bg-gradient");else if(c==="gradient"&&h&&r){let w=p||"to bottom";i.style.setProperty("--page-bg-gradient",`linear-gradient(${w}, ${h}, ${r})`),i.style.removeProperty("--page-bg-color")}else i.style.removeProperty("--page-bg-color"),i.style.removeProperty("--page-bg-gradient");window.dispatchEvent(new CustomEvent("vb:theme-change",{detail:{mode:e,brand:t,borderStyle:y,iconSet:b,fluid:o,backdrop:d,backdropChrome:a,pageBgType:c,effectiveMode:this.getEffectiveMode()}}))},setMode(e){let t=this.save({mode:e});this.apply(t)},async setBrand(e){try{await S(e)}catch(n){console.warn(`[VB] Theme "${e}" failed to load, using default`,n),e="default"}let t=this.save({brand:e});this.apply(t)},setBorderStyle(e){let t=this.save({borderStyle:e});this.apply(t)},setIconSet(e){let t=this.save({iconSet:e});this.apply(t)},setFluid(e){let t=this.save({fluid:e});this.apply(t)},setBackdrop(e){let t=this.save({backdrop:e});this.apply(t)},setBackdropChrome(e){let t=this.save({backdropChrome:e});this.apply(t)},setPageBg({type:e="",color:t="",gradStart:n="",gradEnd:s="",gradDir:o=""}={}){let d=this.save({pageBgType:e,pageBgColor:t,pageBgGradStart:n,pageBgGradEnd:s,pageBgGradDir:o});this.apply(d)},getEffectiveMode(){let{mode:e}=this.load();return e!=="auto"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){let{mode:e,brand:t,borderStyle:n,iconSet:s,fluid:o,backdrop:d,backdropChrome:a,pageBgType:c,pageBgColor:l,pageBgGradStart:h,pageBgGradEnd:r,pageBgGradDir:p}=this.load();return{mode:e,brand:t,borderStyle:n,iconSet:s,fluid:o,backdrop:d,backdropChrome:a,pageBgType:c,pageBgColor:l,pageBgGradStart:h,pageBgGradEnd:r,pageBgGradDir:p,effectiveMode:this.getEffectiveMode()}},toggleMode(){let t=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(t)},reset(){try{localStorage.removeItem($)}catch{}let e=document.documentElement;e.style.removeProperty("--page-bg-color"),e.style.removeProperty("--page-bg-gradient"),this.apply(v)},_readCSSHint(e){return getComputedStyle(document.documentElement).getPropertyValue(e).trim()},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{let t=this.load();t.mode==="auto"&&this.apply(t)})}};var k=class e extends HTMLElement{static#u=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}];static#o=[{id:"default",name:"Default",hue:260},{id:"ocean",name:"Ocean",hue:200},{id:"forest",name:"Forest",hue:145},{id:"sunset",name:"Sunset",hue:25}];static#r=[{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant"}];static#S=[...e.#o,...e.#r];static#f=200;#t;#e;#s=!1;#n=!1;#i=null;connectedCallback(){this.#n=this.getAttribute("data-variant")==="inline",this.#m(),this.#y(),this.#p(),window.addEventListener("theme-change",this.#h)}disconnectedCallback(){window.removeEventListener("theme-change",this.#h),document.removeEventListener("click",this.#d),document.removeEventListener("keydown",this.#c),this.#a()}#m(){this.#n||(this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
          <x-icon name="palette" label="Theme settings"></x-icon>
        `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false")),this.#e=document.createElement("div"),this.#e.className="panel",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Theme settings"),this.#n||(this.#e.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id)),this.#e.innerHTML=this.#g(),this.appendChild(this.#e)}#g(){let{mode:t,brand:n}=g.getState();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${e.#u.map(s=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${s.id}"
                ${t===s.id?"checked":""}
              />
              <span class="option-content">
                <x-icon name="${s.icon}"></x-icon>
                <span>${s.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Color Themes</legend>
        <div class="options options--themes" role="radiogroup" aria-label="Color theme">
          ${e.#o.map(s=>`
            <label class="option option--theme">
              <input
                type="radio"
                name="theme-brand"
                value="${s.id}"
                ${n===s.id?"checked":""}
              />
              <span class="option-content">
                <span class="swatch" style="--swatch-hue: ${s.hue}"></span>
                <span>${s.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Personality Themes</legend>
        <div class="options options--themes" role="radiogroup" aria-label="Personality theme">
          ${e.#r.map(s=>`
            <label class="option option--theme">
              <input
                type="radio"
                name="theme-brand"
                value="${s.id}"
                ${n===s.id?"checked":""}
              />
              <span class="option-content">
                <span class="swatch-combo">
                  <span class="swatch" style="--swatch-hue: ${s.hue}"></span>
                  <span class="shape-indicator" data-shape="${s.shape}"></span>
                </span>
                <span>${s.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#y(){this.#e.querySelectorAll('input[name="theme-mode"]').forEach(t=>{t.addEventListener("change",this.#v)}),this.#e.querySelectorAll('input[name="theme-brand"]').forEach(t=>{t.addEventListener("change",this.#w)}),this.#n||(this.#t.addEventListener("click",this.#b),document.addEventListener("click",this.#d),document.addEventListener("keydown",this.#c))}#b=t=>{t.stopPropagation(),this.toggle()};#d=t=>{this.#s&&!this.contains(t.target)&&this.close()};#c=t=>{t.key==="Escape"&&this.#s&&(t.preventDefault(),this.close(),this.#t?.focus())};#v=t=>{g.setMode(t.target.value),this.#l()};#w=t=>{g.setBrand(t.target.value),this.#l()};#l(){this.#n||(this.#a(),this.#i=setTimeout(()=>{this.close(),this.#t?.focus()},e.#f))}#a(){this.#i&&(clearTimeout(this.#i),this.#i=null)}#h=()=>{this.#p()};#p(){let{mode:t,brand:n}=g.getState(),s=this.#e.querySelector(`input[name="theme-mode"][value="${t}"]`);s&&(s.checked=!0);let o=this.#e.querySelector(`input[name="theme-brand"][value="${n}"]`);o&&(o.checked=!0)}open(){this.#n||this.#s||(this.#s=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#E(),this.#e.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-wc-open",{bubbles:!0})))}#E(){if(!this.#t||!this.#e)return;let t=this.#t.getBoundingClientRect(),n=this.#e.getBoundingClientRect(),s=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},o=s.height,d=s.width,a=8,c=16,l=o-t.bottom-c,h=t.top-c,r=t.height+a;l<n.height&&h>l?(r=-n.height-a,this.#e.dataset.position="top"):delete this.#e.dataset.position;let p=0,i=t.left+n.width+c,M=t.left+p;i>d&&(p=d-i),M+p<c&&(p=c-t.left),this.#e.style.setProperty("--panel-top",`${r}px`),this.#e.style.setProperty("--panel-left",`${p}px`)}close(){this.#n||!this.#s||(this.#a(),this.#s=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"),this.dispatchEvent(new CustomEvent("theme-wc-close",{bubbles:!0})))}toggle(){this.#s?this.close():this.open()}get isOpen(){return this.#s}};customElements.define("theme-wc",k);export{k as ThemePicker};
//# sourceMappingURL=theme-wc.js.map
