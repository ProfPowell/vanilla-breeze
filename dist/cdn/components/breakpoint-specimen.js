var $=window.matchMedia("(prefers-reduced-motion: reduce)");var u=new Map;function p(o,s,t={}){let e=t.priority??10,i={impl:s,bundle:t.bundle,contract:t.contract,priority:e},r=u.get(o);if(customElements.get(o)){if(!r||r.priority>=e){r&&r.priority===e&&r.impl!==s&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${r.bundle}" (priority ${r.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${o}> defined by "${r.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(r&&r.priority>=e){r.priority===e&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${r.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}u.set(o,i),customElements.define(o,s)}var l=class extends HTMLElement{#e=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let s of this.#e)s();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(s,t,e,i){s.addEventListener(t,e,i),this.#e.push(()=>s.removeEventListener(t,e,i))}setup(){}teardown(){}setState(s,t){this.#t||(this.#t=this.attachInternals());let e=this.#t.states;try{t?e.add(s):e.delete(s)}catch{let i=`--${s}`;t?e.add(i):e.delete(i)}}_adoptInternals(s){this.#t||(this.#t=s)}};var d=class extends l{static observedAttributes=["tokens","prefix","label","data-observe"];setup(){this.#e(),this.#t()}attributeChangedCallback(){this.isConnected&&(this.#c(),this.#e(),this.#t())}teardown(){this.#c()}#e(){let s=this.getAttribute("tokens")||"sm,md,lg,xl",t=this.getAttribute("prefix")||"--bp-",e=this.getAttribute("label")||"",i=s.split(",").map(n=>n.trim()).filter(Boolean),r=getComputedStyle(document.documentElement),a=i.map(n=>{let c=r.getPropertyValue(`${t}${n}`).trim(),y=this.#u(c);return{name:n,raw:c,px:y}}).filter(n=>n.px>0).sort((n,c)=>n.px-c.px);this.#l=a,this.#i=a.length?a[a.length-1].px*1.15:1;let h=e?`<header class="bps-label">${e}</header>`:"",f=`
      <output class="bps-readout" aria-live="polite">
        <span class="bps-width">\u2014</span>
        <span class="bps-active" data-active="">\u2014</span>
      </output>
    `,b=`
      <figure class="bps-ruler" aria-hidden="true">
        <span class="bps-cursor" data-cursor></span>
        ${a.map(n=>`
          <span class="bps-stop" style="--bps-pos:${n.px/this.#i*100}%" data-bp="${n.name}">
            <span class="bps-tick"></span>
            <span class="bps-stop-label">${n.name}<br><small>${Math.round(n.px)}px</small></span>
          </span>
        `).join("")}
      </figure>
    `,m=`
      <dl class="bps-list">
        ${a.map(n=>`
          <div class="bps-row" data-bp="${n.name}">
            <dt>${n.name}</dt>
            <dd><code>${n.raw}</code> \u2014 ${Math.round(n.px)}px and up</dd>
          </div>
        `).join("")}
      </dl>
    `;this.innerHTML=`${h}${f}${b}${m}`,this.#o=this.querySelector(".bps-width"),this.#n=this.querySelector(".bps-active"),this.#a=this.querySelector("[data-cursor]")}#t(){let s=this.getAttribute("data-observe");if(s){let e=document.querySelector(s);if(!e)return;this.#s=new ResizeObserver(()=>this.#r(e.clientWidth)),this.#s.observe(e),this.#r(e.clientWidth);return}let t=()=>this.#r(window.innerWidth);t(),this.listen(window,"resize",t,{passive:!0})}#c(){this.#s&&(this.#s.disconnect(),this.#s=null)}#r(s){if(!this.#o||!this.#n)return;this.#o.textContent=`${Math.round(s)}px`;let t=this.#d(s);if(this.#n.textContent=t?t.name:"base",this.#n.dataset.active=t?t.name:"",this.#a){let e=Math.min(100,s/this.#i*100);this.#a.style.setProperty("--bps-pos",`${e}%`)}this.querySelectorAll("[data-bp]").forEach(e=>{let i=t&&e.getAttribute("data-bp")===t.name;e.toggleAttribute("data-current",!!i)})}#d(s){let t=null;for(let e of this.#l)s>=e.px&&(t=e);return t}#u(s){if(!s)return 0;let t=parseFloat(s);if(Number.isNaN(t))return 0;if(s.endsWith("rem")||s.endsWith("em")){let e=parseFloat(getComputedStyle(document.documentElement).fontSize)||16;return t*e}return t}#l=[];#i=1;#s=null;#o=null;#n=null;#a=null};p("breakpoint-specimen",d);export{d as BreakpointSpecimen};
//# sourceMappingURL=breakpoint-specimen.js.map
