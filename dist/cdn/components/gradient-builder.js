var A=window.matchMedia("(prefers-reduced-motion: reduce)");var x=new Map;function w(n,s,i={}){let t=i.priority??10,o={impl:s,bundle:i.bundle,contract:i.contract,priority:t},e=x.get(n);if(customElements.get(n)){if(!e||e.priority>=t){e&&e.priority===t&&e.impl!==s&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${e.bundle}" (priority ${e.priority}). Skipping "${i.bundle}".`);return}console.warn(`[VB Bundle] Tag <${n}> defined by "${e.bundle}" cannot be replaced (customElements.define is permanent). "${i.bundle}" has higher priority but arrived late.`);return}if(e&&e.priority>=t){e.priority===t&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${e.bundle}". Skipping "${i.bundle}" (first wins at equal priority).`);return}x.set(n,o),customElements.define(n,s)}var u=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let s of this.#t)s();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(s,i,t,o){s.addEventListener(i,t,o),this.#t.push(()=>s.removeEventListener(i,t,o))}setup(){}teardown(){}setState(s,i){this.#e||(this.#e=this.attachInternals());let t=this.#e.states;try{i?t.add(s):t.delete(s)}catch{let o=`--${s}`;i?t.add(o):t.delete(o)}}_adoptInternals(s){this.#e||(this.#e=s)}};function E(n,{type:s="linear",angle:i=90,interpolation:t="oklab"}={}){if(n.length<2)return"transparent";let e=[...n].sort((a,l)=>a.position-l.position).map(a=>`${a.color} ${a.position}%`).join(", "),r=t!=="srgb"?` in ${t}`:"";return s==="radial"?`radial-gradient(circle${r}, ${e})`:`linear-gradient(${i}deg${r}, ${e})`}function g(n){if(!n)return k();let s=n.split(",").map(i=>i.trim()).filter(Boolean);return s.length<2?k():s.map((i,t)=>({color:i,position:Math.round(t/(s.length-1)*100)}))}function k(){return[{color:"#6366f1",position:0},{color:"#ec4899",position:100}]}var m=class extends u{static observedAttributes=["colors","type","angle","interpolation","show-export","show-controls"];#t=[];#e="linear";#s=90;#o="oklab";setup(){return this.#t=g(this.getAttribute("colors")??""),this.#e=this.getAttribute("type")||"linear",this.#s=Number(this.getAttribute("angle"))||90,this.#o=this.getAttribute("interpolation")||"oklab",this.#r(),!0}attributeChangedCallback(s,i,t){i===t||!this.isConnected||(s==="colors"&&(this.#t=g(t)),s==="type"&&(this.#e=t||"linear"),s==="angle"&&(this.#s=Number(t)||90),s==="interpolation"&&(this.#o=t||"oklab"),this.#r())}get css(){return E(this.#t,{type:this.#e,angle:this.#s,interpolation:this.#o})}#r(){let s=this.hasAttribute("show-export"),i=this.getAttribute("show-controls")!=="false",t=this.css,o="var(--size-m, 1rem)",e="var(--size-s, 0.75rem)",r="var(--size-xs, 0.5rem)",a="var(--radius-m, 0.5rem)",l="var(--color-border, #ddd)",y="var(--color-surface, #fff)",h="var(--color-text-muted, #666)",f="var(--font-mono, monospace)",b="var(--font-size-sm, 0.875rem)",p="var(--font-size-xs, 0.75rem)",S=`<div class="gb-preview" style="height:4rem;border-radius:${a};background:${t};border:1px solid ${l}"></div>`,$=`font:inherit;font-size:${b};padding:0.25rem 0.5rem;border:1px solid ${l};border-radius:4px;background:${y}`,v="";i&&(v=`<div style="display:flex;flex-direction:column;gap:${e};font-size:${b}">
        <div style="display:flex;flex-wrap:wrap;gap:${o};align-items:center">
          <label style="display:flex;align-items:center;gap:${r}">
            Type
            <select class="gb-type" style="${$}">
              <option value="linear"${this.#e==="linear"?" selected":""}>Linear</option>
              <option value="radial"${this.#e==="radial"?" selected":""}>Radial</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:${r}${this.#e==="radial"?";opacity:0.4;pointer-events:none":""}">
            Angle
            <input type="range" class="gb-angle" min="0" max="360" value="${this.#s}" style="width:8rem;accent-color:var(--color-interactive,oklch(55% .2 260))">
            <span class="gb-angle-value" style="min-width:2.5em;font-family:${f};font-size:${p}">${this.#s}\xB0</span>
          </label>
        </div>
        <label style="display:inline-flex;align-items:center;gap:${r}">
          Color Space
          <select class="gb-space" style="${$}">
            <option value="oklab"${this.#o==="oklab"?" selected":""}>oklab</option>
            <option value="oklch"${this.#o==="oklch"?" selected":""}>oklch</option>
            <option value="srgb"${this.#o==="srgb"?" selected":""}>sRGB</option>
          </select>
        </label>
      </div>`);let C=[...this.#t].map((c,d)=>({...c,origIndex:d})).sort((c,d)=>c.position-d.position).map(c=>{let d=c.origIndex;return`<div style="display:flex;align-items:center;gap:0.375rem" data-stop="${d}">
        <input type="color" value="${c.color}" class="gb-stop-color" data-i="${d}"
          style="width:1.75rem;height:1.75rem;padding:0;border:1px solid ${l};border-radius:4px;cursor:pointer;flex-shrink:0">
        <input type="range" min="0" max="100" value="${c.position}" class="gb-stop-pos-range" data-i="${d}"
          style="flex:1;min-width:3rem;max-width:8rem;accent-color:${c.color}">
        <span style="font-family:${f};font-size:${p};min-width:2.5em;text-align:right" class="gb-stop-pos-label" data-i="${d}">${c.position}%</span>
        ${this.#t.length>2?`<button type="button" class="gb-remove" data-i="${d}"
          style="all:unset;cursor:pointer;font-size:1rem;color:${h};padding:0 0.25rem" title="Remove stop">&times;</button>`:""}
      </div>`}).join(""),q=`<button type="button" class="gb-add"
      style="all:unset;cursor:pointer;font-size:${b};color:var(--color-interactive,oklch(55% .2 260));font-weight:600">+ Add Stop</button>`;this.innerHTML=`
      <div style="display:flex;flex-direction:column;gap:${o}">
        ${S}
        ${v}
        <div style="display:flex;flex-direction:column;gap:${r}">
          <span style="font-size:${p};font-weight:600;color:${h};text-transform:uppercase;letter-spacing:0.05em">Color Stops</span>
          ${C}
          ${q}
        </div>
        <div style="display:flex;flex-direction:column;gap:${r}">
          <span style="font-size:${p};font-weight:600;color:${h};text-transform:uppercase;letter-spacing:0.05em">Code</span>
          <div style="display:flex;align-items:start;gap:${r}">
            <div style="flex:1;font-family:${f};font-size:${p};padding:${e};background:var(--color-surface-raised,#f5f5f5);border-radius:${a};word-break:break-all;color:var(--color-text,#222)" class="gb-css-output">${t}</div>
            ${s?`<button type="button" class="gb-copy"
              style="all:unset;cursor:pointer;font-size:${p};padding:0.35rem 0.75rem;border:1px solid ${l};border-radius:4px;background:${y};white-space:nowrap;flex-shrink:0">Copy CSS</button>`:""}
          </div>
        </div>
      </div>
    `,this.#a()}#a(){this.querySelector(".gb-type")?.addEventListener("change",t=>{let o=t.target;this.#e=o.value,this.#r(),this.#i()});let s=this.querySelector(".gb-angle"),i=this.querySelector(".gb-angle-value");s?.addEventListener("input",t=>{let o=t.target;this.#s=Number(o.value),i&&(i.textContent=`${this.#s}\xB0`);let e=this.querySelector(".gb-preview");e&&(e.style.background=this.css),this.#i()}),this.querySelector(".gb-space")?.addEventListener("change",t=>{let o=t.target;this.#o=o.value,this.#r(),this.#i()}),this.querySelectorAll(".gb-stop-color").forEach(t=>{t.addEventListener("input",o=>{let e=o.target,r=Number(e.dataset.i);this.#t[r].color=e.value,this.#n(),this.#i()})}),this.querySelectorAll(".gb-stop-pos-range").forEach(t=>{t.addEventListener("input",o=>{let e=o.target,r=Number(e.dataset.i),a=Math.max(0,Math.min(100,Number(e.value)||0));this.#t[r].position=a;let l=this.querySelector(`.gb-stop-pos-label[data-i="${r}"]`);l&&(l.textContent=`${a}%`),this.#n(),this.#i()})}),this.querySelectorAll(".gb-remove").forEach(t=>{t.addEventListener("click",o=>{let e=o.target,r=Number(e.dataset.i);this.#t.splice(r,1),this.#r(),this.#i()})}),this.querySelector(".gb-add")?.addEventListener("click",()=>{let t=this.#t[this.#t.length-1],o=this.#t[this.#t.length-2],e=Math.round((o.position+t.position)/2);this.#t.splice(this.#t.length-1,0,{color:"#888888",position:e}),this.#r(),this.#i()}),this.querySelector(".gb-copy")?.addEventListener("click",t=>{navigator.clipboard?.writeText(this.css);let o=t.target;if(!o)return;let e=o.textContent;o.textContent="Copied!",setTimeout(()=>{o.textContent=e},1500)})}#n(){let s=this.css,i=this.querySelector(".gb-preview");i&&(i.style.background=s);let t=this.querySelector(".gb-css-output");t&&(t.textContent=s)}#i(){this.dispatchEvent(new CustomEvent("gradient-builder:change",{bubbles:!0,detail:{css:this.css,stops:[...this.#t],type:this.#e,angle:this.#s,interpolation:this.#o}}))}};w("gradient-builder",m);export{m as GradientBuilder};
//# sourceMappingURL=gradient-builder.js.map
