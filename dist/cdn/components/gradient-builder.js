var z=window.matchMedia("(prefers-reduced-motion: reduce)");var w=new Map;function k(r,i,s={}){let t=s.priority??10,o={impl:i,bundle:s.bundle,contract:s.contract,priority:t},e=w.get(r);if(customElements.get(r)){if(!e||e.priority>=t){e&&e.priority===t&&e.impl!==i&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}" (priority ${e.priority}). Skipping "${s.bundle}".`);return}console.warn(`[VB Bundle] Tag <${r}> defined by "${e.bundle}" cannot be replaced (customElements.define is permanent). "${s.bundle}" has higher priority but arrived late.`);return}if(e&&e.priority>=t){e.priority===t&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}". Skipping "${s.bundle}" (first wins at equal priority).`);return}w.set(r,o),customElements.define(r,i)}var u=class extends HTMLElement{#t=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let i of this.#t)i();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(i,s,t,o){i.addEventListener(s,t,o),this.#t.push(()=>i.removeEventListener(s,t,o))}setup(){}teardown(){}};function E(r,{type:i="linear",angle:s=90,interpolation:t="oklab"}={}){if(r.length<2)return"transparent";let e=[...r].sort((a,d)=>a.position-d.position).map(a=>`${a.color} ${a.position}%`).join(", "),n=t!=="srgb"?` in ${t}`:"";return i==="radial"?`radial-gradient(circle${n}, ${e})`:`linear-gradient(${s}deg${n}, ${e})`}function b(r){if(!r)return S();let i=r.split(",").map(s=>s.trim()).filter(Boolean);return i.length<2?S():i.map((s,t)=>({color:s,position:Math.round(t/(i.length-1)*100)}))}function S(){return[{color:"#6366f1",position:0},{color:"#ec4899",position:100}]}var g=class extends u{static observedAttributes=["colors","type","angle","interpolation","show-export","show-controls"];#t=[];#e="linear";#o=90;#i="oklab";setup(){this.#t=b(this.getAttribute("colors")),this.#e=this.getAttribute("type")||"linear",this.#o=Number(this.getAttribute("angle"))||90,this.#i=this.getAttribute("interpolation")||"oklab",this.#r()}attributeChangedCallback(i,s,t){s===t||!this.isConnected||(i==="colors"&&(this.#t=b(t)),i==="type"&&(this.#e=t||"linear"),i==="angle"&&(this.#o=Number(t)||90),i==="interpolation"&&(this.#i=t||"oklab"),this.#r())}get css(){return E(this.#t,{type:this.#e,angle:this.#o,interpolation:this.#i})}#r(){let i=this.hasAttribute("show-export"),s=this.getAttribute("show-controls")!=="false",t=this.css,o="var(--size-m, 1rem)",e="var(--size-s, 0.75rem)",n="var(--size-xs, 0.5rem)",a="var(--radius-m, 0.5rem)",d="var(--color-border, #ddd)",m="var(--color-surface, #fff)",y="var(--color-text-muted, #666)",h="var(--font-mono, monospace)",f="var(--font-size-sm, 0.875rem)",p="var(--font-size-xs, 0.75rem)",C=`<div class="gb-preview" style="height:4rem;border-radius:${a};background:${t};border:1px solid ${d}"></div>`,v=`font:inherit;font-size:${f};padding:0.25rem 0.5rem;border:1px solid ${d};border-radius:4px;background:${m}`,$="";s&&($=`<div style="display:flex;flex-direction:column;gap:${e};font-size:${f}">
        <div style="display:flex;flex-wrap:wrap;gap:${o};align-items:center">
          <label style="display:flex;align-items:center;gap:${n}">
            Type
            <select class="gb-type" style="${v}">
              <option value="linear"${this.#e==="linear"?" selected":""}>Linear</option>
              <option value="radial"${this.#e==="radial"?" selected":""}>Radial</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:${n}">
            Space
            <select class="gb-space" style="${v}">
              <option value="oklab"${this.#i==="oklab"?" selected":""}>oklab</option>
              <option value="oklch"${this.#i==="oklch"?" selected":""}>oklch</option>
              <option value="srgb"${this.#i==="srgb"?" selected":""}>sRGB</option>
            </select>
          </label>
        </div>
        <label style="display:flex;align-items:center;gap:${n}${this.#e==="radial"?";opacity:0.4;pointer-events:none":""}">
          Angle
          <input type="range" class="gb-angle" min="0" max="360" value="${this.#o}" style="flex:1;max-width:12rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
          <span class="gb-angle-value" style="min-width:2.5em;font-family:${h};font-size:${p}">${this.#o}\xB0</span>
        </label>
      </div>`);let q=[...this.#t].map((l,c)=>({...l,origIndex:c})).sort((l,c)=>l.position-c.position).map(l=>{let c=l.origIndex;return`<div style="display:flex;align-items:center;gap:0.375rem" data-stop="${c}">
        <input type="color" value="${l.color}" class="gb-stop-color" data-i="${c}"
          style="width:1.75rem;height:1.75rem;padding:0;border:1px solid ${d};border-radius:4px;cursor:pointer;flex-shrink:0">
        <input type="range" min="0" max="100" value="${l.position}" class="gb-stop-pos-range" data-i="${c}"
          style="flex:1;min-width:3rem;max-width:8rem;accent-color:${l.color}">
        <span style="font-family:${h};font-size:${p};min-width:2.5em;text-align:right" class="gb-stop-pos-label" data-i="${c}">${l.position}%</span>
        ${this.#t.length>2?`<button type="button" class="gb-remove" data-i="${c}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${y};padding:0 0.25rem" title="Remove stop">&times;</button>`:""}
      </div>`}).join(""),A=`<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${f};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`,M=`<div style="font-family:${h};font-size:${p};padding:${e};background:var(--color-surface-raised,#f5f5f5);border-radius:${a};word-break:break-all;color:var(--color-text,#222)">${t}</div>`,x="";i&&(x=`<div style="display:flex;gap:${n}">
        <button type="button" class="gb-copy"
          style="all:unset;cursor:pointer;font-size:${p};padding:0.35rem 0.75rem;border:1px solid ${d};border-radius:4px;background:${m}">Copy CSS</button>
      </div>`),this.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:${o}">
        ${C}
        ${$}
        <div style="display:flex;flex-direction:column;gap:${n}">
          <span style="font-size:${p};font-weight:600;color:${y};text-transform:uppercase;letter-spacing:0.05em">Color Stops</span>
          ${q}
          ${A}
        </div>
        ${M}
        ${x}
      </div>
    `,this.#a()}#a(){this.querySelector(".gb-type")?.addEventListener("change",t=>{this.#e=t.target.value,this.#r(),this.#s()});let i=this.querySelector(".gb-angle"),s=this.querySelector(".gb-angle-value");i?.addEventListener("input",t=>{this.#o=Number(t.target.value),s&&(s.textContent=`${this.#o}\xB0`);let o=this.querySelector(".gb-preview");o&&(o.style.background=this.css),this.#s()}),this.querySelector(".gb-space")?.addEventListener("change",t=>{this.#i=t.target.value,this.#r(),this.#s()}),this.querySelectorAll(".gb-stop-color").forEach(t=>{t.addEventListener("input",o=>{let e=Number(o.target.dataset.i);this.#t[e].color=o.target.value,this.#n(),this.#s()})}),this.querySelectorAll(".gb-stop-pos-range").forEach(t=>{t.addEventListener("input",o=>{let e=Number(o.target.dataset.i),n=Math.max(0,Math.min(100,Number(o.target.value)||0));this.#t[e].position=n;let a=this.querySelector(`.gb-stop-pos-label[data-i="${e}"]`);a&&(a.textContent=`${n}%`),this.#n(),this.#s()})}),this.querySelectorAll(".gb-remove").forEach(t=>{t.addEventListener("click",o=>{let e=Number(o.target.dataset.i);this.#t.splice(e,1),this.#r(),this.#s()})}),this.querySelector(".gb-add")?.addEventListener("click",()=>{let t=this.#t[this.#t.length-1],o=this.#t[this.#t.length-2],e=Math.round((o.position+t.position)/2);this.#t.splice(this.#t.length-1,0,{color:"#888888",position:e}),this.#r(),this.#s()}),this.querySelector(".gb-copy")?.addEventListener("click",t=>{navigator.clipboard?.writeText(this.css);let o=t.target,e=o.textContent;o.textContent="Copied!",setTimeout(()=>{o.textContent=e},1500)})}#n(){let i=this.css,s=this.querySelector(".gb-preview");s&&(s.style.background=i);let t=this.querySelector('div[style*="font-family"]'),o=this.querySelectorAll("div");for(let e of o)if(e.style.fontFamily&&e.textContent.includes("gradient")){e.textContent=i;break}}#s(){this.dispatchEvent(new CustomEvent("gradient-builder:change",{bubbles:!0,detail:{css:this.css,stops:[...this.#t],type:this.#e,angle:this.#o,interpolation:this.#i}}))}};k("gradient-builder",g);export{g as GradientBuilder};
//# sourceMappingURL=gradient-builder.js.map
