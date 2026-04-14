var M=window.matchMedia("(prefers-reduced-motion: reduce)");var x=new Map;function k(r,o,s={}){let t=s.priority??10,i={impl:o,bundle:s.bundle,contract:s.contract,priority:t},e=x.get(r);if(customElements.get(r)){if(!e||e.priority>=t){e&&e.priority===t&&e.impl!==o&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}" (priority ${e.priority}). Skipping "${s.bundle}".`);return}console.warn(`[VB Bundle] Tag <${r}> defined by "${e.bundle}" cannot be replaced (customElements.define is permanent). "${s.bundle}" has higher priority but arrived late.`);return}if(e&&e.priority>=t){e.priority===t&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}". Skipping "${s.bundle}" (first wins at equal priority).`);return}x.set(r,i),customElements.define(r,o)}var u=class extends HTMLElement{#t=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let o of this.#t)o();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(o,s,t,i){o.addEventListener(s,t,i),this.#t.push(()=>o.removeEventListener(s,t,i))}setup(){}teardown(){}};function E(r,{type:o="linear",angle:s=90,interpolation:t="oklab"}={}){if(r.length<2)return"transparent";let e=[...r].sort((l,a)=>l.position-a.position).map(l=>`${l.color} ${l.position}%`).join(", "),n=t!=="srgb"?` in ${t}`:"";return o==="radial"?`radial-gradient(circle${n}, ${e})`:`linear-gradient(${s}deg${n}, ${e})`}function g(r){if(!r)return w();let o=r.split(",").map(s=>s.trim()).filter(Boolean);return o.length<2?w():o.map((s,t)=>({color:s,position:Math.round(t/(o.length-1)*100)}))}function w(){return[{color:"#6366f1",position:0},{color:"#ec4899",position:100}]}var m=class extends u{static observedAttributes=["colors","type","angle","interpolation","show-export","show-controls"];#t=[];#e="linear";#o=90;#i="oklab";setup(){this.#t=g(this.getAttribute("colors")),this.#e=this.getAttribute("type")||"linear",this.#o=Number(this.getAttribute("angle"))||90,this.#i=this.getAttribute("interpolation")||"oklab",this.#r()}attributeChangedCallback(o,s,t){s===t||!this.isConnected||(o==="colors"&&(this.#t=g(t)),o==="type"&&(this.#e=t||"linear"),o==="angle"&&(this.#o=Number(t)||90),o==="interpolation"&&(this.#i=t||"oklab"),this.#r())}get css(){return E(this.#t,{type:this.#e,angle:this.#o,interpolation:this.#i})}#r(){let o=this.hasAttribute("show-export"),s=this.getAttribute("show-controls")!=="false",t=this.css,i="var(--size-m, 1rem)",e="var(--size-s, 0.75rem)",n="var(--size-xs, 0.5rem)",l="var(--radius-m, 0.5rem)",a="var(--color-border, #ddd)",h="var(--color-surface, #fff)",f="var(--color-text-muted, #666)",b="var(--font-mono, monospace)",d="var(--font-size-sm, 0.875rem)",c="var(--font-size-xs, 0.75rem)",S=`<div class="gb-preview" style="height:4rem;border-radius:${l};background:${t};border:1px solid ${a}"></div>`,y="";s&&(y=`<div style="display:flex;flex-wrap:wrap;gap:${e};align-items:center;font-size:${d}">
        <label style="display:flex;align-items:center;gap:${n}">
          Type
          <select class="gb-type" style="font:inherit;font-size:${d};padding:0.25rem 0.5rem;border:1px solid ${a};border-radius:4px;background:${h}">
            <option value="linear"${this.#e==="linear"?" selected":""}>Linear</option>
            <option value="radial"${this.#e==="radial"?" selected":""}>Radial</option>
          </select>
        </label>
        <label style="display:flex;align-items:center;gap:${n}${this.#e==="radial"?";opacity:0.4;pointer-events:none":""}">
          Angle
          <input type="range" class="gb-angle" min="0" max="360" value="${this.#o}" style="width:5rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
          <span class="gb-angle-value" style="min-width:2.5em;font-family:${b};font-size:${c}">${this.#o}\xB0</span>
        </label>
        <label style="display:flex;align-items:center;gap:${n}">
          Space
          <select class="gb-space" style="font:inherit;font-size:${d};padding:0.25rem 0.5rem;border:1px solid ${a};border-radius:4px;background:${h}">
            <option value="oklab"${this.#i==="oklab"?" selected":""}>oklab</option>
            <option value="oklch"${this.#i==="oklch"?" selected":""}>oklch</option>
            <option value="srgb"${this.#i==="srgb"?" selected":""}>sRGB</option>
          </select>
        </label>
      </div>`);let C=this.#t.map(($,p)=>`
      <div style="display:flex;align-items:center;gap:${n}" data-stop="${p}">
        <input type="color" value="${$.color}" class="gb-stop-color" data-i="${p}"
          style="width:2rem;height:2rem;padding:0;border:1px solid ${a};border-radius:4px;cursor:pointer">
        <input type="number" value="${$.position}" min="0" max="100" class="gb-stop-pos" data-i="${p}"
          style="width:3.5rem;font:inherit;font-size:${c};font-family:${b};padding:0.2rem 0.4rem;border:1px solid ${a};border-radius:4px;text-align:right">
        <span style="font-size:${c};color:${f}">%</span>
        ${this.#t.length>2?`<button type="button" class="gb-remove" data-i="${p}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${f};padding:0 0.25rem" title="Remove stop">&times;</button>`:""}
      </div>
    `).join(""),q=`<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${d};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`,A=`<div style="font-family:${b};font-size:${c};padding:${e};background:var(--color-surface-raised,#f5f5f5);border-radius:${l};word-break:break-all;color:var(--color-text,#222)">${t}</div>`,v="";o&&(v=`<div style="display:flex;gap:${n}">
        <button type="button" class="gb-copy"
          style="all:unset;cursor:pointer;font-size:${c};padding:0.35rem 0.75rem;border:1px solid ${a};border-radius:4px;background:${h}">Copy CSS</button>
      </div>`),this.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:${i}">
        ${S}
        ${y}
        <div style="display:flex;flex-direction:column;gap:${n}">
          <span style="font-size:${c};font-weight:600;color:${f};text-transform:uppercase;letter-spacing:0.05em">Color Stops</span>
          ${C}
          ${q}
        </div>
        ${A}
        ${v}
      </div>
    `,this.#a()}#a(){this.querySelector(".gb-type")?.addEventListener("change",t=>{this.#e=t.target.value,this.#r(),this.#s()});let o=this.querySelector(".gb-angle"),s=this.querySelector(".gb-angle-value");o?.addEventListener("input",t=>{this.#o=Number(t.target.value),s&&(s.textContent=`${this.#o}\xB0`);let i=this.querySelector(".gb-preview");i&&(i.style.background=this.css),this.#s()}),this.querySelector(".gb-space")?.addEventListener("change",t=>{this.#i=t.target.value,this.#r(),this.#s()}),this.querySelectorAll(".gb-stop-color").forEach(t=>{t.addEventListener("input",i=>{let e=Number(i.target.dataset.i);this.#t[e].color=i.target.value,this.#n(),this.#s()})}),this.querySelectorAll(".gb-stop-pos").forEach(t=>{t.addEventListener("input",i=>{let e=Number(i.target.dataset.i);this.#t[e].position=Math.max(0,Math.min(100,Number(i.target.value)||0)),this.#n(),this.#s()})}),this.querySelectorAll(".gb-remove").forEach(t=>{t.addEventListener("click",i=>{let e=Number(i.target.dataset.i);this.#t.splice(e,1),this.#r(),this.#s()})}),this.querySelector(".gb-add")?.addEventListener("click",()=>{let t=this.#t[this.#t.length-1],i=this.#t[this.#t.length-2],e=Math.round((i.position+t.position)/2);this.#t.splice(this.#t.length-1,0,{color:"#888888",position:e}),this.#r(),this.#s()}),this.querySelector(".gb-copy")?.addEventListener("click",t=>{navigator.clipboard?.writeText(this.css);let i=t.target,e=i.textContent;i.textContent="Copied!",setTimeout(()=>{i.textContent=e},1500)})}#n(){let o=this.css,s=this.querySelector(".gb-preview");s&&(s.style.background=o);let t=this.querySelector('div[style*="font-family"]'),i=this.querySelectorAll("div");for(let e of i)if(e.style.fontFamily&&e.textContent.includes("gradient")){e.textContent=o;break}}#s(){this.dispatchEvent(new CustomEvent("gradient-builder:change",{bubbles:!0,detail:{css:this.css,stops:[...this.#t],type:this.#e,angle:this.#o,interpolation:this.#i}}))}};k("gradient-builder",m);export{m as GradientBuilder};
//# sourceMappingURL=gradient-builder.js.map
