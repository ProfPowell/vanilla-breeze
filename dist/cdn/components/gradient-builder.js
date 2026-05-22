var R=window.matchMedia("(prefers-reduced-motion: reduce)");var k=new Map;function C(s,o,e={}){let t=e.priority??10,n={impl:o,bundle:e.bundle,contract:e.contract,priority:t},i=k.get(s);if(customElements.get(s)){if(!i||i.priority>=t){i&&i.priority===t&&i.impl!==o&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${i.bundle}" (priority ${i.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${i.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(i&&i.priority>=t){i.priority===t&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${i.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}k.set(s,n),customElements.define(s,o)}var p=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let o of this.#t)o();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(o,e,t,n){o.addEventListener(e,t,n),this.#t.push(()=>o.removeEventListener(e,t,n))}setup(){}teardown(){}setState(o,e){this.#e||(this.#e=this.attachInternals());let t=this.#e.states;try{e?t.add(o):t.delete(o)}catch{let n=`--${o}`;e?t.add(n):t.delete(n)}}_adoptInternals(o){this.#e||(this.#e=o)}};var m="[data-copy], [data-copy-target]",O="Copied to clipboard",g=new WeakMap;async function v(s,o={}){if(s==null||s==="")return!1;let{button:e,announceMessage:t=O,duration:n=1500}=o;try{await navigator.clipboard.writeText(s)}catch{return!1}if(e){e.dataset.state="copied";let i=g.get(e);i&&clearTimeout(i),g.set(e,setTimeout(()=>{delete e.dataset.state,g.delete(e)},n)),e.dispatchEvent(new CustomEvent("copy",{bubbles:!0,detail:{text:s}}))}return D(t,e??document.body),!0}function N(s=document){s.querySelectorAll(m).forEach(y)}function y(s){s.hasAttribute("data-copy-init")||(s.setAttribute("data-copy-init",""),s.addEventListener("click",()=>{let o=z(s);o&&v(o,{button:s})}))}function z(s){return s.dataset.copy?s.dataset.copy:s.dataset.copyTarget?document.querySelector(s.dataset.copyTarget)?.textContent??"":""}function D(s,o){let e=document.createElement("div");e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),e.className="visually-hidden",e.textContent=s,o.appendChild(e),setTimeout(()=>e.remove(),1e3)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>N()):N();var B=new MutationObserver(s=>{for(let o of s)for(let e of o.addedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let t=e;t.matches(m)&&y(t),t.querySelectorAll(m).forEach(n=>y(n))}});B.observe(document.documentElement,{childList:!0,subtree:!0});function T(s,{type:o="linear",angle:e=90,interpolation:t="oklab"}={}){if(s.length<2)return"transparent";let i=[...s].sort((a,l)=>a.position-l.position).map(a=>`${a.color} ${a.position}%`).join(", "),r=t!=="srgb"?` in ${t}`:"";return o==="radial"?`radial-gradient(circle${r}, ${i})`:`linear-gradient(${e}deg${r}, ${i})`}function $(s){if(!s)return A();let o=s.split(",").map(e=>e.trim()).filter(Boolean);return o.length<2?A():o.map((e,t)=>({color:e,position:Math.round(t/(o.length-1)*100)}))}function A(){return[{color:"#6366f1",position:0},{color:"#ec4899",position:100}]}var x=class extends p{static observedAttributes=["colors","type","angle","interpolation","show-export","show-controls"];#t=[];#e="linear";#o=90;#s="oklab";setup(){return this.#t=$(this.getAttribute("colors")??""),this.#e=this.getAttribute("type")||"linear",this.#o=Number(this.getAttribute("angle"))||90,this.#s=this.getAttribute("interpolation")||"oklab",this.#n(),!0}attributeChangedCallback(o,e,t){e===t||!this.isConnected||(o==="colors"&&(this.#t=$(t)),o==="type"&&(this.#e=t||"linear"),o==="angle"&&(this.#o=Number(t)||90),o==="interpolation"&&(this.#s=t||"oklab"),this.#n())}get css(){return T(this.#t,{type:this.#e,angle:this.#o,interpolation:this.#s})}#n(){let o=this.hasAttribute("show-export"),e=this.getAttribute("show-controls")!=="false",t=this.css,n="var(--size-m, 1rem)",i="var(--size-s, 0.75rem)",r="var(--size-xs, 0.5rem)",a="var(--radius-m, 0.5rem)",l="var(--color-border, #ddd)",E="var(--color-surface, #fff)",h="var(--color-text-muted, #666)",f="var(--font-mono, monospace)",b="var(--font-size-sm, 0.875rem)",u="var(--font-size-xs, 0.75rem)",M=`<div class="gb-preview" style="height:4rem;border-radius:${a};background:${t};border:1px solid ${l}"></div>`,w=`font:inherit;font-size:${b};padding:0.25rem 0.5rem;border:1px solid ${l};border-radius:4px;background:${E}`,S="";e&&(S=`<div style="display:flex;flex-direction:column;gap:${i};font-size:${b}">
        <div style="display:flex;flex-wrap:wrap;gap:${n};align-items:center">
          <label style="display:flex;align-items:center;gap:${r}">
            Type
            <select class="gb-type" style="${w}">
              <option value="linear"${this.#e==="linear"?" selected":""}>Linear</option>
              <option value="radial"${this.#e==="radial"?" selected":""}>Radial</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:${r}${this.#e==="radial"?";opacity:0.4;pointer-events:none":""}">
            Angle
            <input type="range" class="gb-angle" min="0" max="360" value="${this.#o}" style="width:8rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
            <span class="gb-angle-value" style="min-width:2.5em;font-family:${f};font-size:${u}">${this.#o}\xB0</span>
          </label>
        </div>
        <label style="display:inline-flex;align-items:center;gap:${r}">
          Color Space
          <select class="gb-space" style="${w}">
            <option value="oklab"${this.#s==="oklab"?" selected":""}>oklab</option>
            <option value="oklch"${this.#s==="oklch"?" selected":""}>oklch</option>
            <option value="srgb"${this.#s==="srgb"?" selected":""}>sRGB</option>
          </select>
        </label>
      </div>`);let L=[...this.#t].map((c,d)=>({...c,origIndex:d})).sort((c,d)=>c.position-d.position).map(c=>{let d=c.origIndex;return`<div style="display:flex;align-items:center;gap:0.375rem" data-stop="${d}">
        <input type="color" value="${c.color}" class="gb-stop-color" data-i="${d}"
          style="width:1.75rem;height:1.75rem;padding:0;border:1px solid ${l};border-radius:4px;cursor:pointer;flex-shrink:0">
        <input type="range" min="0" max="100" value="${c.position}" class="gb-stop-pos-range" data-i="${d}"
          style="flex:1;min-width:3rem;max-width:8rem;accent-color:${c.color}">
        <span style="font-family:${f};font-size:${u};min-width:2.5em;text-align:right" class="gb-stop-pos-label" data-i="${d}">${c.position}%</span>
        ${this.#t.length>2?`<button type="button" class="gb-remove" data-i="${d}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${h};padding:0 0.25rem" title="Remove stop">&times;</button>`:""}
      </div>`}).join(""),q=`<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${b};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`;this.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:${n}">
        ${M}
        ${S}
        <div style="display:flex;flex-direction:column;gap:${r}">
          <span style="font-size:${u};font-weight:600;color:${h};text-transform:uppercase;letter-spacing:0.05em">Color Stops</span>
          ${L}
          ${q}
        </div>
        <div style="display:flex;flex-direction:column;gap:${r}">
          <span style="font-size:${u};font-weight:600;color:${h};text-transform:uppercase;letter-spacing:0.05em">Code</span>
          <div style="display:flex;align-items:start;gap:${r}">
            <div style="flex:1;font-family:${f};font-size:${u};padding:${i};background:var(--color-surface-raised,#f5f5f5);border-radius:${a};word-break:break-all;color:var(--color-text,#222)" class="gb-css-output">${t}</div>
            ${o?`<button type="button" class="gb-copy"
              style="all:unset;cursor:pointer;font-size:${u};padding:0.35rem 0.75rem;border:1px solid ${l};border-radius:4px;background:${E};white-space:nowrap;flex-shrink:0">Copy CSS</button>`:""}
          </div>
        </div>
      </div>
    `,this.#a()}#a(){this.querySelector(".gb-type")?.addEventListener("change",t=>{let n=t.target;this.#e=n.value,this.#n(),this.#i()});let o=this.querySelector(".gb-angle"),e=this.querySelector(".gb-angle-value");o?.addEventListener("input",t=>{let n=t.target;this.#o=Number(n.value),e&&(e.textContent=`${this.#o}\xB0`);let i=this.querySelector(".gb-preview");i&&(i.style.background=this.css),this.#i()}),this.querySelector(".gb-space")?.addEventListener("change",t=>{let n=t.target;this.#s=n.value,this.#n(),this.#i()}),this.querySelectorAll(".gb-stop-color").forEach(t=>{t.addEventListener("input",n=>{let i=n.target,r=Number(i.dataset.i);this.#t[r].color=i.value,this.#r(),this.#i()})}),this.querySelectorAll(".gb-stop-pos-range").forEach(t=>{t.addEventListener("input",n=>{let i=n.target,r=Number(i.dataset.i),a=Math.max(0,Math.min(100,Number(i.value)||0));this.#t[r].position=a;let l=this.querySelector(`.gb-stop-pos-label[data-i="${r}"]`);l&&(l.textContent=`${a}%`),this.#r(),this.#i()})}),this.querySelectorAll(".gb-remove").forEach(t=>{t.addEventListener("click",n=>{let i=n.target,r=Number(i.dataset.i);this.#t.splice(r,1),this.#n(),this.#i()})}),this.querySelector(".gb-add")?.addEventListener("click",()=>{let t=this.#t[this.#t.length-1],n=this.#t[this.#t.length-2],i=Math.round((n.position+t.position)/2);this.#t.splice(this.#t.length-1,0,{color:"#888888",position:i}),this.#n(),this.#i()}),this.querySelector(".gb-copy")?.addEventListener("click",t=>{let n=t.target;n&&v(this.css,{button:n,announceMessage:"Gradient CSS copied"})})}#r(){let o=this.css,e=this.querySelector(".gb-preview");e&&(e.style.background=o);let t=this.querySelector(".gb-css-output");t&&(t.textContent=o)}#i(){this.dispatchEvent(new CustomEvent("gradient-builder:change",{bubbles:!0,detail:{css:this.css,stops:[...this.#t],type:this.#e,angle:this.#o,interpolation:this.#s}}))}};C("gradient-builder",x);export{x as GradientBuilder};
//# sourceMappingURL=gradient-builder.js.map
