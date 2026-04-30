var u=window.matchMedia("(prefers-reduced-motion: reduce)");var c=new Map;function d(o,e,n={}){let i=n.priority??10,r={impl:e,bundle:n.bundle,contract:n.contract,priority:i},t=c.get(o);if(customElements.get(o)){if(!t||t.priority>=i){t&&t.priority===i&&t.impl!==e&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${t.bundle}" (priority ${t.priority}). Skipping "${n.bundle}".`);return}console.warn(`[VB Bundle] Tag <${o}> defined by "${t.bundle}" cannot be replaced (customElements.define is permanent). "${n.bundle}" has higher priority but arrived late.`);return}if(t&&t.priority>=i){t.priority===i&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${t.bundle}". Skipping "${n.bundle}" (first wins at equal priority).`);return}c.set(o,r),customElements.define(o,e)}var s=class extends HTMLElement{#e=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let e of this.#e)e();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,n,i,r){e.addEventListener(n,i,r),this.#e.push(()=>e.removeEventListener(n,i,r))}setup(){}teardown(){}};var a=class extends s{setup(){this.querySelector("[data-controls]")||this.#e()}#e(){let e=document.createElement("nav");e.setAttribute("data-controls",""),e.setAttribute("aria-label","Change view controls"),e.innerHTML=`
      <button type="button" data-action="tracking" aria-pressed="true">
        Tracking
      </button>
      <button type="button" data-action="final" aria-pressed="false">
        Final
      </button>
      <button type="button" data-action="original" aria-pressed="false">
        Original
      </button>
    `,this.prepend(e),e.addEventListener("click",n=>{let r=n.target.closest("[data-action]")?.dataset.action;if(r){r==="tracking"?this.removeAttribute("view"):this.setAttribute("view",r);for(let t of e.querySelectorAll("button"))t.setAttribute("aria-pressed",t.dataset.action===r);this.dispatchEvent(new CustomEvent("change-set:view",{detail:{view:r},bubbles:!0}))}})}get view(){return this.getAttribute("view")??"tracking"}set view(e){e==="tracking"?this.removeAttribute("view"):this.setAttribute("view",e)}};d("change-set",a);export{a as ChangeSet};
//# sourceMappingURL=change-set.js.map
