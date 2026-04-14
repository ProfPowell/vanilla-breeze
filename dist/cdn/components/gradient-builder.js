var z=window.matchMedia("(prefers-reduced-motion: reduce)");var w=new Map;function S(r,s,i={}){let t=i.priority??10,o={impl:s,bundle:i.bundle,contract:i.contract,priority:t},e=w.get(r);if(customElements.get(r)){if(!e||e.priority>=t){e&&e.priority===t&&e.impl!==s&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}" (priority ${e.priority}). Skipping "${i.bundle}".`);return}console.warn(`[VB Bundle] Tag <${r}> defined by "${e.bundle}" cannot be replaced (customElements.define is permanent). "${i.bundle}" has higher priority but arrived late.`);return}if(e&&e.priority>=t){e.priority===t&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}". Skipping "${i.bundle}" (first wins at equal priority).`);return}w.set(r,o),customElements.define(r,s)}var u=class extends HTMLElement{#t=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let s of this.#t)s();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(s,i,t,o){s.addEventListener(i,t,o),this.#t.push(()=>s.removeEventListener(i,t,o))}setup(){}teardown(){}};function E(r,{type:s="linear",angle:i=90,interpolation:t="oklab"}={}){if(r.length<2)return"transparent";let e=[...r].sort((a,d)=>a.position-d.position).map(a=>`${a.color} ${a.position}%`).join(", "),n=t!=="srgb"?` in ${t}`:"";return s==="radial"?`radial-gradient(circle${n}, ${e})`:`linear-gradient(${i}deg${n}, ${e})`}function b(r){if(!r)return k();let s=r.split(",").map(i=>i.trim()).filter(Boolean);return s.length<2?k():s.map((i,t)=>({color:i,position:Math.round(t/(s.length-1)*100)}))}function k(){return[{color:"#6366f1",position:0},{color:"#ec4899",position:100}]}var g=class extends u{static observedAttributes=["colors","type","angle","interpolation","show-export","show-controls"];#t=[];#e="linear";#o=90;#s="oklab";setup(){this.#t=b(this.getAttribute("colors")),this.#e=this.getAttribute("type")||"linear",this.#o=Number(this.getAttribute("angle"))||90,this.#s=this.getAttribute("interpolation")||"oklab",this.#r()}attributeChangedCallback(s,i,t){i===t||!this.isConnected||(s==="colors"&&(this.#t=b(t)),s==="type"&&(this.#e=t||"linear"),s==="angle"&&(this.#o=Number(t)||90),s==="interpolation"&&(this.#s=t||"oklab"),this.#r())}get css(){return E(this.#t,{type:this.#e,angle:this.#o,interpolation:this.#s})}#r(){let s=this.hasAttribute("show-export"),i=this.getAttribute("show-controls")!=="false",t=this.css,o="var(--size-m, 1rem)",e="var(--size-s, 0.75rem)",n="var(--size-xs, 0.5rem)",a="var(--radius-m, 0.5rem)",d="var(--color-border, #ddd)",m="var(--color-surface, #fff)",y="var(--color-text-muted, #666)",h="var(--font-mono, monospace)",f="var(--font-size-sm, 0.875rem)",p="var(--font-size-xs, 0.75rem)",C=`<div class="gb-preview" style="height:4rem;border-radius:${a};background:${t};border:1px solid ${d}"></div>`,v=`font:inherit;font-size:${f};padding:0.25rem 0.5rem;border:1px solid ${d};border-radius:4px;background:${m}`,$="";i&&($=`<div style="display:flex;flex-direction:column;gap:${e};font-size:${f}">
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
              <option value="oklab"${this.#s==="oklab"?" selected":""}>oklab</option>
              <option value="oklch"${this.#s==="oklch"?" selected":""}>oklch</option>
              <option value="srgb"${this.#s==="srgb"?" selected":""}>sRGB</option>
            </select>
          </label>
        </div>
        <label style="display:flex;align-items:center;gap:${n}${this.#e==="radial"?";opacity:0.4;pointer-events:none":""}">
          Angle
          <input type="range" class="gb-angle" min="0" max="360" value="${this.#o}" style="flex:1;max-width:12rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
          <span class="gb-angle-value" style="min-width:2.5em;font-family:${h};font-size:${p}">${this.#o}\xB0</span>
        </label>
      </div>`);let q=[...this.#t].map((l,c)=>({...l,origIndex:c})).sort((l,c)=>l.position-c.position).map(l=>{let c=l.origIndex;return`<div style="display:flex;align-items:center;gap:${n}" data-stop="${c}">
        <input type="color" value="${l.color}" class="gb-stop-color" data-i="${c}"
          style="width:2rem;height:2rem;padding:0;border:1px solid ${d};border-radius:4px;cursor:pointer">
        <input type="range" min="0" max="100" value="${l.position}" class="gb-stop-pos-range" data-i="${c}"
          style="width:4rem;accent-color:${l.color}">
        <span style="font-family:${h};font-size:${p};min-width:2.5em;text-align:right" class="gb-stop-pos-label" data-i="${c}">${l.position}%</span>
        ${this.#t.length>2?`<button type="button" class="gb-remove" data-i="${c}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${y};padding:0 0.25rem" title="Remove stop">&times;</button>`:""}
      </div>`}).join(""),A=`<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${f};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`,M=`<div style="font-family:${h};font-size:${p};padding:${e};background:var(--color-surface-raised,#f5f5f5);border-radius:${a};word-break:break-all;color:var(--color-text,#222)">${t}</div>`,x="";s&&(x=`<div style="display:flex;gap:${n}">
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
    `,this.#a()}#a(){this.querySelector(".gb-type")?.addEventListener("change",t=>{this.#e=t.target.value,this.#r(),this.#i()});let s=this.querySelector(".gb-angle"),i=this.querySelector(".gb-angle-value");s?.addEventListener("input",t=>{this.#o=Number(t.target.value),i&&(i.textContent=`${this.#o}\xB0`);let o=this.querySelector(".gb-preview");o&&(o.style.background=this.css),this.#i()}),this.querySelector(".gb-space")?.addEventListener("change",t=>{this.#s=t.target.value,this.#r(),this.#i()}),this.querySelectorAll(".gb-stop-color").forEach(t=>{t.addEventListener("input",o=>{let e=Number(o.target.dataset.i);this.#t[e].color=o.target.value,this.#n(),this.#i()})}),this.querySelectorAll(".gb-stop-pos-range").forEach(t=>{t.addEventListener("input",o=>{let e=Number(o.target.dataset.i),n=Math.max(0,Math.min(100,Number(o.target.value)||0));this.#t[e].position=n;let a=this.querySelector(`.gb-stop-pos-label[data-i="${e}"]`);a&&(a.textContent=`${n}%`),this.#n(),this.#i()})}),this.querySelectorAll(".gb-remove").forEach(t=>{t.addEventListener("click",o=>{let e=Number(o.target.dataset.i);this.#t.splice(e,1),this.#r(),this.#i()})}),this.querySelector(".gb-add")?.addEventListener("click",()=>{let t=this.#t[this.#t.length-1],o=this.#t[this.#t.length-2],e=Math.round((o.position+t.position)/2);this.#t.splice(this.#t.length-1,0,{color:"#888888",position:e}),this.#r(),this.#i()}),this.querySelector(".gb-copy")?.addEventListener("click",t=>{navigator.clipboard?.writeText(this.css);let o=t.target,e=o.textContent;o.textContent="Copied!",setTimeout(()=>{o.textContent=e},1500)})}#n(){let s=this.css,i=this.querySelector(".gb-preview");i&&(i.style.background=s);let t=this.querySelector('div[style*="font-family"]'),o=this.querySelectorAll("div");for(let e of o)if(e.style.fontFamily&&e.textContent.includes("gradient")){e.textContent=s;break}}#i(){this.dispatchEvent(new CustomEvent("gradient-builder:change",{bubbles:!0,detail:{css:this.css,stops:[...this.#t],type:this.#e,angle:this.#o,interpolation:this.#s}}))}};S("gradient-builder",g);export{g as GradientBuilder};
//# sourceMappingURL=gradient-builder.js.map
