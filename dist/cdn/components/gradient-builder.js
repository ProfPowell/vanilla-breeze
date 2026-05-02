var A=window.matchMedia("(prefers-reduced-motion: reduce)");var x=new Map;function w(r,e,o={}){let t=o.priority??10,i={impl:e,bundle:o.bundle,contract:o.contract,priority:t},s=x.get(r);if(customElements.get(r)){if(!s||s.priority>=t){s&&s.priority===t&&s.impl!==e&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${o.bundle}".`);return}console.warn(`[VB Bundle] Tag <${r}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${o.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=t){s.priority===t&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${s.bundle}". Skipping "${o.bundle}" (first wins at equal priority).`);return}x.set(r,i),customElements.define(r,e)}var u=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let e of this.#t)e();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,o,t,i){e.addEventListener(o,t,i),this.#t.push(()=>e.removeEventListener(o,t,i))}setup(){}teardown(){}setState(e,o){this.#e||(this.#e=this.attachInternals());let t=this.#e.states;try{o?t.add(e):t.delete(e)}catch{let i=`--${e}`;o?t.add(i):t.delete(i)}}_adoptInternals(e){this.#e||(this.#e=e)}};function E(r,{type:e="linear",angle:o=90,interpolation:t="oklab"}={}){if(r.length<2)return"transparent";let s=[...r].sort((a,d)=>a.position-d.position).map(a=>`${a.color} ${a.position}%`).join(", "),n=t!=="srgb"?` in ${t}`:"";return e==="radial"?`radial-gradient(circle${n}, ${s})`:`linear-gradient(${o}deg${n}, ${s})`}function g(r){if(!r)return k();let e=r.split(",").map(o=>o.trim()).filter(Boolean);return e.length<2?k():e.map((o,t)=>({color:o,position:Math.round(t/(e.length-1)*100)}))}function k(){return[{color:"#6366f1",position:0},{color:"#ec4899",position:100}]}var m=class extends u{static observedAttributes=["colors","type","angle","interpolation","show-export","show-controls"];#t=[];#e="linear";#s=90;#o="oklab";setup(){this.#t=g(this.getAttribute("colors")),this.#e=this.getAttribute("type")||"linear",this.#s=Number(this.getAttribute("angle"))||90,this.#o=this.getAttribute("interpolation")||"oklab",this.#r()}attributeChangedCallback(e,o,t){o===t||!this.isConnected||(e==="colors"&&(this.#t=g(t)),e==="type"&&(this.#e=t||"linear"),e==="angle"&&(this.#s=Number(t)||90),e==="interpolation"&&(this.#o=t||"oklab"),this.#r())}get css(){return E(this.#t,{type:this.#e,angle:this.#s,interpolation:this.#o})}#r(){let e=this.hasAttribute("show-export"),o=this.getAttribute("show-controls")!=="false",t=this.css,i="var(--size-m, 1rem)",s="var(--size-s, 0.75rem)",n="var(--size-xs, 0.5rem)",a="var(--radius-m, 0.5rem)",d="var(--color-border, #ddd)",y="var(--color-surface, #fff)",h="var(--color-text-muted, #666)",f="var(--font-mono, monospace)",b="var(--font-size-sm, 0.875rem)",p="var(--font-size-xs, 0.75rem)",S=`<div class="gb-preview" style="height:4rem;border-radius:${a};background:${t};border:1px solid ${d}"></div>`,$=`font:inherit;font-size:${b};padding:0.25rem 0.5rem;border:1px solid ${d};border-radius:4px;background:${y}`,v="";o&&(v=`<div style="display:flex;flex-direction:column;gap:${s};font-size:${b}">
        <div style="display:flex;flex-wrap:wrap;gap:${i};align-items:center">
          <label style="display:flex;align-items:center;gap:${n}">
            Type
            <select class="gb-type" style="${$}">
              <option value="linear"${this.#e==="linear"?" selected":""}>Linear</option>
              <option value="radial"${this.#e==="radial"?" selected":""}>Radial</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:${n}${this.#e==="radial"?";opacity:0.4;pointer-events:none":""}">
            Angle
            <input type="range" class="gb-angle" min="0" max="360" value="${this.#s}" style="width:8rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
            <span class="gb-angle-value" style="min-width:2.5em;font-family:${f};font-size:${p}">${this.#s}\xB0</span>
          </label>
        </div>
        <label style="display:inline-flex;align-items:center;gap:${n}">
          Color Space
          <select class="gb-space" style="${$}">
            <option value="oklab"${this.#o==="oklab"?" selected":""}>oklab</option>
            <option value="oklch"${this.#o==="oklch"?" selected":""}>oklch</option>
            <option value="srgb"${this.#o==="srgb"?" selected":""}>sRGB</option>
          </select>
        </label>
      </div>`);let C=[...this.#t].map((l,c)=>({...l,origIndex:c})).sort((l,c)=>l.position-c.position).map(l=>{let c=l.origIndex;return`<div style="display:flex;align-items:center;gap:0.375rem" data-stop="${c}">
        <input type="color" value="${l.color}" class="gb-stop-color" data-i="${c}"
          style="width:1.75rem;height:1.75rem;padding:0;border:1px solid ${d};border-radius:4px;cursor:pointer;flex-shrink:0">
        <input type="range" min="0" max="100" value="${l.position}" class="gb-stop-pos-range" data-i="${c}"
          style="flex:1;min-width:3rem;max-width:8rem;accent-color:${l.color}">
        <span style="font-family:${f};font-size:${p};min-width:2.5em;text-align:right" class="gb-stop-pos-label" data-i="${c}">${l.position}%</span>
        ${this.#t.length>2?`<button type="button" class="gb-remove" data-i="${c}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${h};padding:0 0.25rem" title="Remove stop">&times;</button>`:""}
      </div>`}).join(""),q=`<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${b};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`;this.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:${i}">
        ${S}
        ${v}
        <div style="display:flex;flex-direction:column;gap:${n}">
          <span style="font-size:${p};font-weight:600;color:${h};text-transform:uppercase;letter-spacing:0.05em">Color Stops</span>
          ${C}
          ${q}
        </div>
        <div style="display:flex;flex-direction:column;gap:${n}">
          <span style="font-size:${p};font-weight:600;color:${h};text-transform:uppercase;letter-spacing:0.05em">Code</span>
          <div style="display:flex;align-items:start;gap:${n}">
            <div style="flex:1;font-family:${f};font-size:${p};padding:${s};background:var(--color-surface-raised,#f5f5f5);border-radius:${a};word-break:break-all;color:var(--color-text,#222)" class="gb-css-output">${t}</div>
            ${e?`<button type="button" class="gb-copy"
              style="all:unset;cursor:pointer;font-size:${p};padding:0.35rem 0.75rem;border:1px solid ${d};border-radius:4px;background:${y};white-space:nowrap;flex-shrink:0">Copy CSS</button>`:""}
          </div>
        </div>
      </div>
    `,this.#a()}#a(){this.querySelector(".gb-type")?.addEventListener("change",t=>{this.#e=t.target.value,this.#r(),this.#i()});let e=this.querySelector(".gb-angle"),o=this.querySelector(".gb-angle-value");e?.addEventListener("input",t=>{this.#s=Number(t.target.value),o&&(o.textContent=`${this.#s}\xB0`);let i=this.querySelector(".gb-preview");i&&(i.style.background=this.css),this.#i()}),this.querySelector(".gb-space")?.addEventListener("change",t=>{this.#o=t.target.value,this.#r(),this.#i()}),this.querySelectorAll(".gb-stop-color").forEach(t=>{t.addEventListener("input",i=>{let s=Number(i.target.dataset.i);this.#t[s].color=i.target.value,this.#n(),this.#i()})}),this.querySelectorAll(".gb-stop-pos-range").forEach(t=>{t.addEventListener("input",i=>{let s=Number(i.target.dataset.i),n=Math.max(0,Math.min(100,Number(i.target.value)||0));this.#t[s].position=n;let a=this.querySelector(`.gb-stop-pos-label[data-i="${s}"]`);a&&(a.textContent=`${n}%`),this.#n(),this.#i()})}),this.querySelectorAll(".gb-remove").forEach(t=>{t.addEventListener("click",i=>{let s=Number(i.target.dataset.i);this.#t.splice(s,1),this.#r(),this.#i()})}),this.querySelector(".gb-add")?.addEventListener("click",()=>{let t=this.#t[this.#t.length-1],i=this.#t[this.#t.length-2],s=Math.round((i.position+t.position)/2);this.#t.splice(this.#t.length-1,0,{color:"#888888",position:s}),this.#r(),this.#i()}),this.querySelector(".gb-copy")?.addEventListener("click",t=>{navigator.clipboard?.writeText(this.css);let i=t.target,s=i.textContent;i.textContent="Copied!",setTimeout(()=>{i.textContent=s},1500)})}#n(){let e=this.css,o=this.querySelector(".gb-preview");o&&(o.style.background=e);let t=this.querySelector(".gb-css-output");t&&(t.textContent=e)}#i(){this.dispatchEvent(new CustomEvent("gradient-builder:change",{bubbles:!0,detail:{css:this.css,stops:[...this.#t],type:this.#e,angle:this.#s,interpolation:this.#o}}))}};w("gradient-builder",m);export{m as GradientBuilder};
//# sourceMappingURL=gradient-builder.js.map
