var v=/Mac|iPhone|iPad|iPod/.test(navigator.platform??"");function u(i){let e=i.toLowerCase().split("+").map(s=>s.trim());return{key:e.pop()??"",meta:e.includes("meta")||e.includes("cmd"),ctrl:e.includes("ctrl"),shift:e.includes("shift"),alt:e.includes("alt")}}function h(i,e){if(i.key.toLowerCase()!==e.key)return!1;let t,s;return v?(t=e.meta,s=e.ctrl):(t=!1,s=e.meta||e.ctrl),!(t!==i.metaKey||s!==i.ctrlKey||e.shift!==i.shiftKey||e.alt!==i.altKey)}var k=new Set(["INPUT","TEXTAREA","SELECT"]),a=[],f=!1;function g(i){let e=k.has(i.target.tagName)||i.target.isContentEditable;for(let t of a)if(!(e&&!t.global)&&h(i,t.descriptor)){i.preventDefault(),t.callback(i);return}}function w(){f||(document.addEventListener("keydown",g),f=!0)}function p(i,e,t={}){w();let s=u(i),n={combo:i,descriptor:s,callback:e,global:t.global===!0};return a.find(l=>l.combo===i)&&console.warn(`[hotkey-bind] Shortcut "${i}" already bound. Last-connected-wins.`),a.unshift(n),function(){let d=a.indexOf(n);d!==-1&&a.splice(d,1)}}function m(){return a.map(i=>i.combo)}var A=window.matchMedia("(prefers-reduced-motion: reduce)");var b=new Map;function y(i,e,t={}){let s=t.priority??10,n={impl:e,bundle:t.bundle,contract:t.contract,priority:s},r=b.get(i);if(customElements.get(i)){if(!r||r.priority>=s){r&&r.priority===s&&r.impl!==e&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${r.bundle}" (priority ${r.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${i}> defined by "${r.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(r&&r.priority>=s){r.priority===s&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${r.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}b.set(i,n),customElements.define(i,e)}var o=class extends HTMLElement{#c=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let e of this.#c)e();this.#c=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,t,s,n){e.addEventListener(t,s,n),this.#c.push(()=>e.removeEventListener(t,s,n))}setup(){}teardown(){}};var c=class i extends o{static#c=150;static#b=8;#e=null;#t=null;#i=null;#s=null;#r=[];#a=-1;#n=!1;#o=null;#l=null;#u=null;setup(){this.#y(),this.#v()}teardown(){this.#n&&(document.body.style.overflow="",this.removeAttribute("open"),this.#n=!1),this.#u?.(),this.#d()}#y(){this.#e=this.querySelector(":scope > [data-trigger]"),this.#e||(this.#e=this.querySelector(":scope > button")),this.#e||(this.#e=document.createElement("button"),this.#e.setAttribute("data-trigger",""),this.#e.innerHTML=`
        <icon-wc name="search" label="Search"></icon-wc>
      `,this.prepend(this.#e)),this.#e.setAttribute("aria-haspopup","dialog"),this.#e.setAttribute("aria-expanded","false"),this.#t=document.createElement("div"),this.#t.className="dialog",this.#t.setAttribute("role","dialog"),this.#t.setAttribute("aria-label","Site search"),this.#t.id=`search-dialog-${crypto.randomUUID().slice(0,8)}`,this.#e.setAttribute("aria-controls",this.#t.id),this.#t.innerHTML=`
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
    `,this.appendChild(this.#t),this.#i=this.#t.querySelector(".input"),this.#s=this.#t.querySelector(".results")}#v(){this.#e.addEventListener("click",this.#k),m().includes("meta+k")||(this.#u=p("meta+k",()=>{this.#n?this.close():this.open()},{global:!0})),this.listen(document,"keydown",this.#g),this.#t.querySelector(".backdrop")?.addEventListener("click",()=>this.close()),this.#i.addEventListener("input",this.#w),this.#i.addEventListener("keydown",this.#E),this.#s.addEventListener("click",this.#S)}#k=e=>{e.stopPropagation(),this.open()};#g=e=>{e.key==="Escape"&&this.#n&&(e.preventDefault(),this.close())};#w=()=>{this.#d(),this.#l=setTimeout(()=>{this.#L(this.#i.value)},i.#c)};#E=e=>{switch(e.key){case"ArrowDown":e.preventDefault(),this.#p(this.#a+1);break;case"ArrowUp":e.preventDefault(),this.#p(this.#a-1);break;case"Enter":e.preventDefault(),this.#a>=0&&this.#r[this.#a]&&this.#m(this.#r[this.#a]);break}};#S=e=>{let t=e.target.closest("[data-result-index]");if(t){let s=parseInt(t.dataset.resultIndex,10);this.#r[s]&&this.#m(this.#r[s])}};async#h(){if(!this.#o)try{this.#o=await import("/pagefind/pagefind.js"),await this.#o.options({excerptLength:20})}catch{console.warn("Pagefind not available. Run `npm run search:index` to build the search index."),this.#o=null}}async#L(e){if(!e.trim()){this.#f([]);return}if(await this.#h(),!this.#o){this.#A();return}try{this.#s.innerHTML='<div class="loading">Searching...</div>';let t=await this.#o.search(e),s=await Promise.all(t.results.slice(0,i.#b).map(n=>n.data()));this.#r=s,this.#f(s)}catch(t){console.error("Search error:",t),this.#s.innerHTML='<div class="error">Search error. Please try again.</div>'}}#f(e){if(this.#a=-1,e.length===0){this.#i.value.trim()?this.#s.innerHTML='<div class="empty">No results found</div>':this.#s.innerHTML="";return}this.#s.innerHTML=e.map((t,s)=>`
      <a
        id="search-result-${s}"
        href="${t.url}"
        class="result"
        role="option"
        data-result-index="${s}"
        tabindex="-1"
      >
        <span class="result-title">${t.meta?.title||"Untitled"}</span>
        <span class="result-excerpt">${t.excerpt||""}</span>
      </a>
    `).join("")}#A(){this.#s.innerHTML=`
      <div class="error">
        Search index not found.<br>
        Run <code>npm run search:index</code> after building.
      </div>
    `}#p(e){if(this.#r.length===0)return;e<0&&(e=this.#r.length-1),e>=this.#r.length&&(e=0);let t=this.#s.querySelector("[data-active]");t&&t.removeAttribute("data-active"),this.#i?.removeAttribute("aria-activedescendant"),this.#a=e;let s=this.#s.querySelector(`[data-result-index="${e}"]`);s&&(s.setAttribute("data-active",""),this.#i?.setAttribute("aria-activedescendant",s.id),s.scrollIntoView({block:"nearest"}))}#m(e){e.url&&(this.close(),window.location.href=e.url)}#d(){this.#l&&(clearTimeout(this.#l),this.#l=null)}open(){this.#n||(this.#n=!0,this.setAttribute("open",""),this.#e?.setAttribute("aria-expanded","true"),document.body.style.overflow="hidden",requestAnimationFrame(()=>{this.#i?.focus(),this.#i?.select()}),this.#h(),this.dispatchEvent(new CustomEvent("site-search:open",{bubbles:!0})))}close(){this.#n&&(this.#n=!1,this.removeAttribute("open"),this.#e?.setAttribute("aria-expanded","false"),document.body.style.overflow="",this.#d(),this.#i.value="",this.#i?.removeAttribute("aria-activedescendant"),this.#r=[],this.#a=-1,this.#s.innerHTML="",this.#e?.focus(),this.dispatchEvent(new CustomEvent("site-search:close",{bubbles:!0})))}get isOpen(){return this.#n}};y("site-search",c);export{c as SiteSearch};
//# sourceMappingURL=site-search.js.map
