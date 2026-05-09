var m=window.matchMedia("(prefers-reduced-motion: reduce)");var c=new Map;function l(o,e,t={}){let r=t.priority??10,i={impl:e,bundle:t.bundle,contract:t.contract,priority:r},n=c.get(o);if(customElements.get(o)){if(!n||n.priority>=r){n&&n.priority===r&&n.impl!==e&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${o}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=r){n.priority===r&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${n.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}c.set(o,i),customElements.define(o,e)}var a=class extends HTMLElement{#e=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let e of this.#e)e();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,t,r,i){e.addEventListener(t,r,i),this.#e.push(()=>e.removeEventListener(t,r,i))}setup(){}teardown(){}setState(e,t){this.#t||(this.#t=this.attachInternals());let r=this.#t.states;try{t?r.add(e):r.delete(e)}catch{let i=`--${e}`;t?r.add(i):r.delete(i)}}_adoptInternals(e){this.#t||(this.#t=e)}};var u=5,d=class o extends a{setup(){let e=this.querySelector(":scope > template"),t=e?o.#t(e):[];if(this.hasAttribute("src")){this.#e(this.getAttribute("src"));return}this.#r(t)}async#e(e){try{let r=await(await fetch(e)).json();this.#r(Array.isArray(r)?r:[])}catch(t){console.warn("risk-register: failed to load src",e,t),this.#r([])}}static#t(e){let t=[],r=e.content.querySelectorAll("tr");for(let i of r){let n=[...i.children],s=n[0]?.textContent?.trim()||"",h=i.getAttribute("data-id")||s.toLowerCase().replace(/\s+/g,"-")||`risk-${t.length}`;t.push({id:h,title:s,likelihood:parseInt(n[1]?.textContent??"",10)||0,impact:parseInt(n[2]?.textContent??"",10)||0,owner:n[3]?.textContent?.trim()||"",mitigation:n[4]?.textContent?.trim()||""})}return t}#r(e){this.#n=e,[...this.children].forEach(i=>{i.tagName!=="TEMPLATE"&&i.remove()});let t=this.getAttribute("label");if(t){let i=document.createElement("header");i.className="rr-label",i.textContent=t,this.appendChild(i)}let r=document.createElement("div");r.className="rr-layout",r.appendChild(this.#o(e)),r.appendChild(this.#s(e)),this.appendChild(r),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent("risk-register:ready",{bubbles:!0,detail:{count:e.length}}))})}#o(e){let t=document.createElement("data-table"),r=document.createElement("table");return r.innerHTML=`
      <thead>
        <tr>
          <th data-sort="string">Title</th>
          <th data-sort="number">Likelihood</th>
          <th data-sort="number">Impact</th>
          <th data-sort="number" data-rollup="product" data-heatmap="low-good">Severity</th>
          <th data-sort="string">Owner</th>
          <th data-sort="string">Mitigation</th>
        </tr>
      </thead>
      <tbody>
        ${e.map(i=>`
          <tr data-id="${o.#i(i.id)}">
            <td>${o.#i(i.title)}</td>
            <td>${i.likelihood||""}</td>
            <td>${i.impact||""}</td>
            <td></td>
            <td>${o.#i(i.owner)}</td>
            <td>${o.#i(i.mitigation)}</td>
          </tr>
        `).join("")}
      </tbody>
    `,t.appendChild(r),t}#s(e){let t=document.createElement("quadrant-grid");t.setAttribute("x-label","Likelihood"),t.setAttribute("y-label","Impact"),t.setAttribute("x-low","Rare"),t.setAttribute("x-high","Likely"),t.setAttribute("y-low","Minor"),t.setAttribute("y-high","Severe"),t.setAttribute("q1-label","Avoid"),t.setAttribute("q2-label","Plan"),t.setAttribute("q3-label","Accept"),t.setAttribute("q4-label","Mitigate");for(let r of e){if(!r.likelihood||!r.impact)continue;let i=document.createElement("span"),n=Math.min(1,Math.max(0,r.likelihood/u)),s=Math.min(1,Math.max(0,r.impact/u));i.setAttribute("data-x",n.toFixed(3)),i.setAttribute("data-y",s.toFixed(3)),i.setAttribute("data-id",r.id),i.setAttribute("title",`${r.title} \u2014 likelihood ${r.likelihood}, impact ${r.impact}`),i.textContent=r.title,t.appendChild(i)}return t}static#i(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}#n=[];get rows(){return[...this.#n]}set rows(e){this.#r(Array.isArray(e)?e:[])}};l("risk-register",d);export{d as RiskRegister};
//# sourceMappingURL=risk-register.js.map
