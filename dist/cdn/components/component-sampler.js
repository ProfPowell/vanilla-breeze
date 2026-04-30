var m=window.matchMedia("(prefers-reduced-motion: reduce)");var u=new Map;function p(r,a,t={}){let o=t.priority??10,n={impl:a,bundle:t.bundle,contract:t.contract,priority:o},e=u.get(r);if(customElements.get(r)){if(!e||e.priority>=o){e&&e.priority===o&&e.impl!==a&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}" (priority ${e.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${r}> defined by "${e.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(e&&e.priority>=o){e.priority===o&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${e.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}u.set(r,n),customElements.define(r,a)}var i=class extends HTMLElement{#e=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let a of this.#e)a();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(a,t,o,n){a.addEventListener(t,o,n),this.#e.push(()=>a.removeEventListener(t,o,n))}setup(){}teardown(){}};var b={button:()=>`
    <layout-cluster data-layout-gap="s">
      <button>Primary</button>
      <button class="secondary">Secondary</button>
      <button disabled>Disabled</button>
    </layout-cluster>`,input:()=>`
    <layout-stack data-layout-gap="xs">
      <input type="text" placeholder="Text input" aria-label="Sample text input"/>
      <input type="email" placeholder="email@example.com" aria-label="Sample email"/>
      <input type="text" value="Read only" readonly aria-label="Read-only input"/>
    </layout-stack>`,select:()=>`
    <select aria-label="Sample select">
      <option>Choose an option</option>
      <option>Option A</option>
      <option>Option B</option>
      <option>Option C</option>
    </select>`,checkbox:()=>`
    <layout-stack data-layout-gap="xs">
      <label><input type="checkbox" checked="checked"/> Checked option</label>
      <label><input type="checkbox"/> Unchecked option</label>
      <label><input type="checkbox" disabled/> Disabled option</label>
    </layout-stack>`,radio:()=>`
    <layout-stack data-layout-gap="xs">
      <label><input type="radio" name="sampler-radio" checked="checked"/> Selected</label>
      <label><input type="radio" name="sampler-radio"/> Unselected</label>
      <label><input type="radio" name="sampler-radio" disabled/> Disabled</label>
    </layout-stack>`,badge:()=>`
    <layout-cluster data-layout-gap="xs">
      <layout-badge>Default</layout-badge>
      <layout-badge data-color="success">Success</layout-badge>
      <layout-badge data-color="warning">Warning</layout-badge>
      <layout-badge data-color="danger">Danger</layout-badge>
      <layout-badge data-color="info">Info</layout-badge>
    </layout-cluster>`,progress:()=>`
    <layout-stack data-layout-gap="xs">
      <progress value="33" max="100">33%</progress>
      <progress value="66" max="100">66%</progress>
      <progress value="100" max="100">100%</progress>
    </layout-stack>`,range:()=>`
    <input type="range" min="0" max="100" value="50" aria-label="Sample range"/>`,textarea:()=>`
    <textarea rows="3" placeholder="Textarea sample" aria-label="Sample textarea" style="width:100%"></textarea>`},c=class extends i{static observedAttributes=["components","label","compact"];setup(){this.#e()}attributeChangedCallback(){this.isConnected&&this.#e()}#e(){let a=this.getAttribute("components")||"button,input,select,checkbox,radio,badge,progress",t=this.getAttribute("label")||"",o=this.hasAttribute("compact"),n=a.split(",").map(l=>l.trim()),e=o?"0.75rem":"1.25rem",s="";t&&(s+=`<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${t}</p>`),s+=`<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:${e}">`;for(let l of n){let d=b[l];d&&(s+=`<article style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);background:var(--color-surface,#fff)">
        <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#999);margin-block-end:var(--size-s,0.5rem);font-family:var(--font-sans,system-ui)">${l}</p>
        ${d()}
      </article>`)}s+="</section>",this.innerHTML=s}};p("component-sampler",c);
//# sourceMappingURL=component-sampler.js.map
