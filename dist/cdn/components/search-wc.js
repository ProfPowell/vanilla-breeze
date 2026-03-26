var s=class a extends HTMLElement{static#b=150;static#v=8;#t;#e;#a;#i;#s=[];#r=-1;#n=!1;#l=null;#h=null;connectedCallback(){this.#m(),this.#g()}disconnectedCallback(){document.removeEventListener("keydown",this.#c),this.#o()}#m(){this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
        <x-icon name="search" label="Search"></x-icon>
      `,this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false"),this.#e=document.createElement("div"),this.#e.className="dialog",this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Site search"),this.#e.id=`search-dialog-${crypto.randomUUID().slice(0,8)}`,this.#t.setAttribute("aria-controls",this.#e.id),this.#e.innerHTML=`
      <div class="backdrop"></div>
      <div class="panel">
        <div class="input-wrapper">
          <x-icon name="search" class="icon"></x-icon>
          <input
            type="search"
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
    `,this.appendChild(this.#e),this.#a=this.#e.querySelector(".input"),this.#i=this.#e.querySelector(".results")}#g(){this.#t.addEventListener("click",this.#k),document.addEventListener("keydown",this.#c),this.#e.querySelector(".backdrop").addEventListener("click",()=>this.close()),this.#a.addEventListener("input",this.#w),this.#a.addEventListener("keydown",this.#y),this.#i.addEventListener("click",this.#E)}#k=t=>{t.stopPropagation(),this.open()};#c=t=>{if((t.metaKey||t.ctrlKey)&&t.key==="k"){t.preventDefault(),this.#n?this.close():this.open();return}t.key==="Escape"&&this.#n&&(t.preventDefault(),this.close())};#w=()=>{this.#o(),this.#h=setTimeout(()=>{this.#L(this.#a.value)},a.#b)};#y=t=>{switch(t.key){case"ArrowDown":t.preventDefault(),this.#p(this.#r+1);break;case"ArrowUp":t.preventDefault(),this.#p(this.#r-1);break;case"Enter":t.preventDefault(),this.#r>=0&&this.#s[this.#r]&&this.#f(this.#s[this.#r]);break}};#E=t=>{let e=t.target.closest("[data-result-index]");if(e){let i=parseInt(e.dataset.resultIndex,10);this.#s[i]&&this.#f(this.#s[i])}};async#d(){if(!this.#l)try{let t=new Function('return import("/pagefind/pagefind.js")');this.#l=await t(),await this.#l.options({excerptLength:20})}catch{console.warn("Pagefind not available. Run `npm run search:dev` to build the search index."),this.#l=null}}async#L(t){if(!t.trim()){this.#u([]);return}if(await this.#d(),!this.#l){this.#x();return}try{this.#i.innerHTML='<div class="loading">Searching...</div>';let e=await this.#l.search(t),i=await Promise.all(e.results.slice(0,a.#v).map(r=>r.data()));this.#s=i,this.#u(i)}catch(e){console.error("Search error:",e),this.#i.innerHTML='<div class="error">Search error. Please try again.</div>'}}#u(t){if(this.#r=-1,t.length===0){this.#a.value.trim()?this.#i.innerHTML='<div class="empty">No results found</div>':this.#i.innerHTML="";return}this.#i.innerHTML=t.map((e,i)=>`
      <a
        href="${e.url}"
        class="result"
        role="option"
        data-result-index="${i}"
        tabindex="-1"
      >
        <span class="result-title">${e.meta?.title||"Untitled"}</span>
        <span class="result-excerpt">${e.excerpt||""}</span>
      </a>
    `).join("")}#x(){this.#i.innerHTML=`
      <div class="error">
        Search index not found.<br>
        Run <code>npx pagefind --site dist</code> after building.
      </div>
    `}#p(t){if(this.#s.length===0)return;t<0&&(t=this.#s.length-1),t>=this.#s.length&&(t=0);let e=this.#i.querySelector("[data-active]");e&&e.removeAttribute("data-active"),this.#r=t;let i=this.#i.querySelector(`[data-result-index="${t}"]`);i&&(i.setAttribute("data-active",""),i.scrollIntoView({block:"nearest"}))}#f(t){t.url&&(this.close(),window.location.href=t.url)}#o(){this.#h&&(clearTimeout(this.#h),this.#h=null)}open(){this.#n||(this.#n=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),document.body.style.overflow="hidden",requestAnimationFrame(()=>{this.#a?.focus(),this.#a?.select()}),this.#d(),this.dispatchEvent(new CustomEvent("search-wc-open",{bubbles:!0})))}close(){this.#n&&(this.#n=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"),document.body.style.overflow="",this.#o(),this.#a.value="",this.#s=[],this.#r=-1,this.#i.innerHTML="",this.#t?.focus(),this.dispatchEvent(new CustomEvent("search-wc-close",{bubbles:!0})))}get isOpen(){return this.#n}};customElements.define("search-wc",s);export{s as SearchWc};
//# sourceMappingURL=search-wc.js.map
