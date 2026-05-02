var v=/Mac|iPhone|iPad|iPod/.test(navigator.platform??"");function d(s){let t=s.toLowerCase().split("+").map(i=>i.trim());return{key:t.pop()??"",meta:t.includes("meta")||t.includes("cmd"),ctrl:t.includes("ctrl"),shift:t.includes("shift"),alt:t.includes("alt")}}function h(s,t){if(s.key.toLowerCase()!==t.key)return!1;let e,i;return v?(e=t.meta,i=t.ctrl):(e=!1,i=t.meta||t.ctrl),!(e!==s.metaKey||i!==s.ctrlKey||t.shift!==s.shiftKey||t.alt!==s.altKey)}var g=new Set(["INPUT","TEXTAREA","SELECT"]),a=[],f=!1;function k(s){let t=g.has(s.target.tagName)||s.target.isContentEditable;for(let e of a)if(!(t&&!e.global)&&h(s,e.descriptor)){s.preventDefault(),e.callback(s);return}}function E(){f||(document.addEventListener("keydown",k),f=!0)}function p(s,t,e={}){E();let i=d(s),n={combo:s,descriptor:i,callback:t,global:e.global===!0};return a.find(l=>l.combo===s)&&console.warn(`[hotkey-bind] Shortcut "${s}" already bound. Last-connected-wins.`),a.unshift(n),function(){let u=a.indexOf(n);u!==-1&&a.splice(u,1)}}function b(){return a.map(s=>s.combo)}var A=window.matchMedia("(prefers-reduced-motion: reduce)");var m=new Map;function y(s,t,e={}){let i=e.priority??10,n={impl:t,bundle:e.bundle,contract:e.contract,priority:i},r=m.get(s);if(customElements.get(s)){if(!r||r.priority>=i){r&&r.priority===i&&r.impl!==t&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${r.bundle}" (priority ${r.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${r.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(r&&r.priority>=i){r.priority===i&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${r.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}m.set(s,n),customElements.define(s,t)}var o=class extends HTMLElement{#l=[];#o;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#l)t();this.#l=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,n){t.addEventListener(e,i,n),this.#l.push(()=>t.removeEventListener(e,i,n))}setup(){}teardown(){}setState(t,e){this.#o||(this.#o=this.attachInternals());let i=this.#o.states;try{e?i.add(t):i.delete(t)}catch{let n=`--${t}`;e?i.add(n):i.delete(n)}}_adoptInternals(t){this.#o||(this.#o=t)}};var c=class s extends o{static#l=150;static#o=8;#e=null;#i=null;#t=null;#s=null;#r=[];#a=-1;#n=!1;#c=null;#u=null;#h=null;setup(){this.#y(),this.#v()}teardown(){this.#n&&(document.body.style.overflow="",this.removeAttribute("open"),this.#n=!1),this.#h?.(),this.#d()}get value(){return this.#t?.value??""}set value(t){if(!this.#t)return;let e=t==null?"":String(t);this.#t.value!==e&&(this.#t.value=e,this.#t.dispatchEvent(new Event("input",{bubbles:!0})),this.dispatchEvent(new CustomEvent("site-search:change",{detail:{value:e,source:"api"},bubbles:!0})))}get results(){return[...this.#r]}#y(){this.#e=this.querySelector(":scope > [data-trigger]"),this.#e||(this.#e=this.querySelector(":scope > button")),this.#e||(this.#e=document.createElement("button"),this.#e.setAttribute("data-trigger",""),this.#e.innerHTML=`
        <icon-wc name="search" label="Search"></icon-wc>
      `,this.prepend(this.#e)),this.#e.setAttribute("aria-haspopup","dialog"),this.#e.setAttribute("aria-expanded","false"),this.#i=document.createElement("div"),this.#i.className="dialog",this.#i.setAttribute("role","dialog"),this.#i.setAttribute("aria-label","Site search"),this.#i.id=`search-dialog-${crypto.randomUUID().slice(0,8)}`,this.#e.setAttribute("aria-controls",this.#i.id),this.#i.innerHTML=`
      <div class="backdrop"></div>
      <div class="panel">
        <div class="input-wrapper">
          <icon-wc name="search" class="icon"></icon-wc>
          <input
            type="search"
            name="search"
            class="input"
            placeholder="Search documentation..."
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Search"
            aria-autocomplete="list"
          />
          <kbd class="shortcut">Esc</kbd>
        </div>
        <div class="results" role="listbox" aria-label="Search results"></div>
        <div class="footer">
          <span class="hint">
            <kbd>\u2191</kbd><kbd>\u2193</kbd> to navigate
            <kbd>\u21B5</kbd> to select
            <kbd>esc</kbd> to close
          </span>
          <span class="powered">
            Powered by <a href="https://pagefind.app" target="_blank" rel="noopener">Pagefind</a>
          </span>
        </div>
      </div>
    `,this.appendChild(this.#i),this.#t=this.#i.querySelector(".input"),this.#s=this.#i.querySelector(".results")}#v(){this.#e.addEventListener("click",this.#g),b().includes("meta+k")||(this.#h=p("meta+k",()=>{this.#n?this.close():this.open()},{global:!0})),this.listen(document,"keydown",this.#k),this.#i.querySelector(".backdrop")?.addEventListener("click",()=>this.close()),this.#t.addEventListener("input",this.#E),this.#t.addEventListener("keydown",this.#w),this.#s.addEventListener("click",this.#S)}#g=t=>{t.stopPropagation(),this.open()};#k=t=>{t.key==="Escape"&&this.#n&&(t.preventDefault(),this.close())};#E=()=>{this.#d(),this.#u=setTimeout(()=>{this.#L(this.#t.value)},s.#l)};#w=t=>{switch(t.key){case"ArrowDown":t.preventDefault(),this.#b(this.#a+1);break;case"ArrowUp":t.preventDefault(),this.#b(this.#a-1);break;case"Enter":t.preventDefault(),this.#a>=0&&this.#r[this.#a]&&this.#m(this.#r[this.#a]);break}};#S=t=>{let e=t.target.closest("[data-result-index]");if(e){let i=parseInt(e.dataset.resultIndex,10);this.#r[i]&&this.#m(this.#r[i])}};async#f(){if(!this.#c)try{this.#c=await import("/pagefind/pagefind.js"),await this.#c.options({excerptLength:20})}catch{console.warn("Pagefind not available. Run `npm run search:index` to build the search index."),this.#c=null}}async#L(t){if(!t.trim()){this.#p([]);return}if(await this.#f(),!this.#c){this.#A();return}try{this.#s.innerHTML='<div class="loading">Searching...</div>';let e=await this.#c.search(t),i=await Promise.all(e.results.slice(0,s.#o).map(n=>n.data()));this.#r=i,this.#p(i)}catch(e){console.error("Search error:",e),this.#s.innerHTML='<div class="error">Search error. Please try again.</div>'}}#p(t){if(this.#a=-1,t.length===0){this.#t.value.trim()?this.#s.innerHTML='<div class="empty">No results found</div>':this.#s.innerHTML="";return}this.#s.innerHTML=t.map((e,i)=>`
      <a
        id="search-result-${i}"
        href="${e.url}"
        class="result"
        role="option"
        data-result-index="${i}"
        tabindex="-1"
      >
        <span class="result-title">${e.meta?.title||"Untitled"}</span>
        <span class="result-excerpt">${e.excerpt||""}</span>
      </a>
    `).join("")}#A(){this.#s.innerHTML=`
      <div class="error">
        Search index not found.<br>
        Run <code>npm run search:index</code> after building.
      </div>
    `}#b(t){if(this.#r.length===0)return;t<0&&(t=this.#r.length-1),t>=this.#r.length&&(t=0);let e=this.#s.querySelector("[data-active]");e&&e.removeAttribute("data-active"),this.#t?.removeAttribute("aria-activedescendant"),this.#a=t;let i=this.#s.querySelector(`[data-result-index="${t}"]`);i&&(i.setAttribute("data-active",""),this.#t?.setAttribute("aria-activedescendant",i.id),i.scrollIntoView({block:"nearest"}))}#m(t){t.url&&(this.close(),window.location.href=t.url)}#d(){this.#u&&(clearTimeout(this.#u),this.#u=null)}open(){this.#n||(this.#n=!0,this.setAttribute("open",""),this.#e?.setAttribute("aria-expanded","true"),document.body.style.overflow="hidden",requestAnimationFrame(()=>{this.#t?.focus(),this.#t?.select()}),this.#f(),this.dispatchEvent(new CustomEvent("site-search:open",{bubbles:!0})))}close(){this.#n&&(this.#n=!1,this.removeAttribute("open"),this.#e?.setAttribute("aria-expanded","false"),document.body.style.overflow="",this.#d(),this.#t.value="",this.#t?.removeAttribute("aria-activedescendant"),this.#r=[],this.#a=-1,this.#s.innerHTML="",this.#e?.focus(),this.dispatchEvent(new CustomEvent("site-search:close",{bubbles:!0})))}get isOpen(){return this.#n}};y("site-search",c);export{c as SiteSearch};
//# sourceMappingURL=site-search.js.map
