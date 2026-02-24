var p=/Mac|iPhone|iPad|iPod/.test(navigator.platform??"");function c(i){let t=i.toLowerCase().split("+").map(s=>s.trim());return{key:t.pop(),meta:t.includes("meta")||t.includes("cmd"),ctrl:t.includes("ctrl"),shift:t.includes("shift"),alt:t.includes("alt")}}function h(i,t){if(i.key.toLowerCase()!==t.key)return!1;let e,s;return p?(e=t.meta,s=t.ctrl):(e=!1,s=t.meta||t.ctrl),!(e!==i.metaKey||s!==i.ctrlKey||t.shift!==i.shiftKey||t.alt!==i.altKey)}var b=new Set(["INPUT","TEXTAREA","SELECT"]),a=[],d=!1;function m(i){let t=b.has(i.target.tagName)||i.target.isContentEditable;for(let e of a)if(!(t&&!e.global)&&h(i,e.descriptor)){i.preventDefault(),e.callback(i);return}}function g(){d||(document.addEventListener("keydown",m),d=!0)}function u(i,t,e={}){g();let s=c(i),n={combo:i,descriptor:s,callback:t,global:e.global===!0};return a.find(o=>o.combo===i)&&console.warn(`[hotkey-bind] Shortcut "${i}" already bound. Last-connected-wins.`),a.unshift(n),function(){let l=a.indexOf(n);l!==-1&&a.splice(l,1)}}function f(){return a.map(i=>i.combo)}var r=class i extends HTMLElement{static#m=150;static#g=8;#t;#e;#a;#i;#s=[];#n=-1;#r=!1;#o=null;#l=null;#h=null;connectedCallback(){this.#k(),this.#y()}disconnectedCallback(){this.#h?.(),document.removeEventListener("keydown",this.#d),this.#c()}#k(){this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.setAttribute("data-trigger",""),this.#t.innerHTML=`
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
    `,this.appendChild(this.#e),this.#a=this.#e.querySelector(".input"),this.#i=this.#e.querySelector(".results")}#y(){this.#t.addEventListener("click",this.#v),f().includes("meta+k")||(this.#h=u("meta+k",()=>{this.#r?this.close():this.open()},{global:!0})),document.addEventListener("keydown",this.#d),this.#e.querySelector(".backdrop").addEventListener("click",()=>this.close()),this.#a.addEventListener("input",this.#w),this.#a.addEventListener("keydown",this.#E),this.#i.addEventListener("click",this.#L)}#v=t=>{t.stopPropagation(),this.open()};#d=t=>{t.key==="Escape"&&this.#r&&(t.preventDefault(),this.close())};#w=()=>{this.#c(),this.#l=setTimeout(()=>{this.#x(this.#a.value)},i.#m)};#E=t=>{switch(t.key){case"ArrowDown":t.preventDefault(),this.#p(this.#n+1);break;case"ArrowUp":t.preventDefault(),this.#p(this.#n-1);break;case"Enter":t.preventDefault(),this.#n>=0&&this.#s[this.#n]&&this.#b(this.#s[this.#n]);break}};#L=t=>{let e=t.target.closest("[data-result-index]");if(e){let s=parseInt(e.dataset.resultIndex,10);this.#s[s]&&this.#b(this.#s[s])}};async#u(){if(!this.#o)try{let t=new Function('return import("/pagefind/pagefind.js")');this.#o=await t(),await this.#o.options({excerptLength:20})}catch{console.warn("Pagefind not available. Run `npm run search:dev` to build the search index."),this.#o=null}}async#x(t){if(!t.trim()){this.#f([]);return}if(await this.#u(),!this.#o){this.#S();return}try{this.#i.innerHTML='<div class="loading">Searching...</div>';let e=await this.#o.search(t),s=await Promise.all(e.results.slice(0,i.#g).map(n=>n.data()));this.#s=s,this.#f(s)}catch(e){console.error("Search error:",e),this.#i.innerHTML='<div class="error">Search error. Please try again.</div>'}}#f(t){if(this.#n=-1,t.length===0){this.#a.value.trim()?this.#i.innerHTML='<div class="empty">No results found</div>':this.#i.innerHTML="";return}this.#i.innerHTML=t.map((e,s)=>`
      <a
        href="${e.url}"
        class="result"
        role="option"
        data-result-index="${s}"
        tabindex="-1"
      >
        <span class="result-title">${e.meta?.title||"Untitled"}</span>
        <span class="result-excerpt">${e.excerpt||""}</span>
      </a>
    `).join("")}#S(){this.#i.innerHTML=`
      <div class="error">
        Search index not found.<br>
        Run <code>npx pagefind --site dist</code> after building.
      </div>
    `}#p(t){if(this.#s.length===0)return;t<0&&(t=this.#s.length-1),t>=this.#s.length&&(t=0);let e=this.#i.querySelector("[data-active]");e&&e.removeAttribute("data-active"),this.#n=t;let s=this.#i.querySelector(`[data-result-index="${t}"]`);s&&(s.setAttribute("data-active",""),s.scrollIntoView({block:"nearest"}))}#b(t){t.url&&(this.close(),window.location.href=t.url)}#c(){this.#l&&(clearTimeout(this.#l),this.#l=null)}open(){this.#r||(this.#r=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),document.body.style.overflow="hidden",requestAnimationFrame(()=>{this.#a?.focus(),this.#a?.select()}),this.#u(),this.dispatchEvent(new CustomEvent("site-search:open",{bubbles:!0})))}close(){this.#r&&(this.#r=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"),document.body.style.overflow="",this.#c(),this.#a.value="",this.#s=[],this.#n=-1,this.#i.innerHTML="",this.#t?.focus(),this.dispatchEvent(new CustomEvent("site-search:close",{bubbles:!0})))}get isOpen(){return this.#r}};customElements.define("site-search",r);export{r as SiteSearch};
//# sourceMappingURL=site-search.js.map
