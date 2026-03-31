var R=window.matchMedia("(prefers-reduced-motion: reduce)");var z=new Map;function f(i,t,o={}){let e=o.priority??10,s={impl:t,bundle:o.bundle,contract:o.contract,priority:e},a=z.get(i);if(customElements.get(i)){if(!a||a.priority>=e){a&&a.priority===e&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${o.bundle}".`);return}console.warn(`[VB Bundle] Tag <${i}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${o.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=e){a.priority===e&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${a.bundle}". Skipping "${o.bundle}" (first wins at equal priority).`);return}z.set(i,s),customElements.define(i,t)}var u=class extends HTMLElement{#e=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let t of this.#e)t();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,o,e,s){t.addEventListener(o,e,s),this.#e.push(()=>t.removeEventListener(o,e,s))}setup(){}teardown(){}};var g=class extends u{static observedAttributes=["colors","names","layout","show-values","show-names","size"];setup(){this.#e()}attributeChangedCallback(){this.isConnected&&this.#e()}#e(){let t=this.getAttribute("colors")||"",o=this.getAttribute("names")||"",e=this.getAttribute("layout")||"inline",s=this.getAttribute("size")||"md",a=this.hasAttribute("show-values"),n=this.hasAttribute("show-names")||o.length>0,l=this.#s(t),m=o?o.split(",").map(d=>d.trim()):[],r={sm:48,md:80,lg:120}[s]||80,b="display:flex;flex-wrap:wrap;gap:var(--size-xs,0.5rem)";e==="grid"?b=`display:grid;grid-template-columns:repeat(auto-fill,minmax(${r}px,1fr));gap:var(--size-xs,0.5rem)`:e==="list"&&(b="display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)");let C=l.map((d,p)=>{let h=m[p]||"",y=this.#o(d),S=e==="list"?"display:flex;flex-direction:row;align-items:center;gap:0.75rem":`display:flex;flex-direction:column;align-items:center;gap:0.25rem;max-inline-size:${r}px`,k=e==="list"?36:r;return`<div class="swatch-wrap" role="listitem" style="${S}">
        <button type="button" class="color-box" data-index="${p}"
          style="background:${d};color:${y};width:${k}px;height:${k}px;border:1px solid oklch(0% 0 0/0.15);border-radius:var(--radius-s,0.25rem);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:var(--font-mono,monospace);position:relative;overflow:hidden;flex-shrink:0"
          title="Click to copy${h?": "+h:""}"
          aria-label="${h||"Color "+(p+1)}: ${d}">
          <span class="color-value" style="font-size:0.625rem;line-height:1.2;opacity:${a?"1":"0"};text-align:center;padding:2px 4px;word-break:break-all;transition:opacity 0.15s ease">${this.#t(d)}</span>
        </button>
        ${n&&h?`<span style="font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);text-align:center;max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h}</span>`:""}
      </div>`}).join("");this.innerHTML=`<div class="palette ${e}" role="list" aria-label="Color palette" style="${b}">${C}</div>`,this.querySelectorAll(".color-box").forEach(d=>{a||(d.addEventListener("pointerenter",()=>{let p=d.querySelector(".color-value");p&&(p.style.opacity="1")}),d.addEventListener("pointerleave",()=>{let p=d.querySelector(".color-value");p&&(p.style.opacity="0")})),d.addEventListener("click",()=>{let p=Number(d.dataset.index),h=l[p],y=m[p]||"";navigator.clipboard?.writeText(h),this.dispatchEvent(new CustomEvent("color-palette:select",{bubbles:!0,detail:{color:h,name:y,index:p}})),d.style.outline="3px solid currentColor",d.style.outlineOffset="2px",setTimeout(()=>{d.style.outline="",d.style.outlineOffset=""},600)})})}#t(t){if(t.startsWith("#"))return t;let o=t.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);return o?`${o[1]}% .${o[2].replace("0.","")}`:t.length>12?t.slice(0,12)+"\u2026":t}#s(t){if(!t)return[];let o=[],e=0,s="";for(let a of t)a==="("?e++:a===")"&&e--,a===","&&e===0?(o.push(s.trim()),s=""):s+=a;return s.trim()&&o.push(s.trim()),o}#o(t){let o=t.match(/oklch\(\s*([\d.]+)%?\s/);if(o){let e=parseFloat(o[1]);return(e>1?e/100:e)>.6?"#000":"#fff"}if(t.startsWith("#")){let e=t.replace("#",""),s=parseInt(e.substring(0,2),16)/255,a=parseInt(e.substring(2,4),16)/255,n=parseInt(e.substring(4,6),16)/255;return .2126*s+.7152*a+.0722*n>.4?"#000":"#fff"}return"#000"}};f("color-palette",g);var v=class extends u{static observedAttributes=["font-family","label","sample","show-scale","show-weights","show-characters","weights"];setup(){this.#e()}attributeChangedCallback(){this.isConnected&&this.#e()}#e(){let t=this.getAttribute("font-family")||"system-ui",o=this.getAttribute("label")||t.replace(/['"]/g,"").split(",")[0],e=this.getAttribute("sample")||"The quick brown fox jumps over the lazy dog",s=this.hasAttribute("show-scale"),a=this.hasAttribute("show-weights"),n=this.hasAttribute("show-characters"),m=(this.getAttribute("weights")||"300,400,500,600,700").split(",").map(r=>r.trim()),c="";if(c+=`<div class="specimen-header" style="font-family:${t}">
      <span class="specimen-label">${o}</span>
      <p class="specimen-sample" contenteditable="plaintext-only" spellcheck="false">${e}</p>
    </div>`,n&&(c+=`<div class="specimen-chars" style="font-family:${t}">
        <div class="char-row"><span class="char-label">Upper</span>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(r=>`<span>${r}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Lower</span>${"abcdefghijklmnopqrstuvwxyz".split("").map(r=>`<span>${r}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Digits</span>${"0123456789".split("").map(r=>`<span>${r}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Punct</span>${"!@#$%^&*()_+-=[]{}|;:,.<>?".split("").map(r=>`<span>${r==="<"?"&lt;":r===">"?"&gt;":r==="&"?"&amp;":r}</span>`).join("")}</div>
      </div>`),a){c+='<div class="specimen-weights">';for(let r of m)c+=`<div class="weight-sample" style="font-family:${t};font-weight:${r}">
          <span class="weight-label">${r}</span>
          <span class="weight-text">Aa</span>
        </div>`;c+="</div>"}if(s){let r=[{name:"xs",rem:.75},{name:"sm",rem:.875},{name:"md",rem:1},{name:"lg",rem:1.125},{name:"xl",rem:1.25},{name:"2xl",rem:1.5},{name:"3xl",rem:1.875},{name:"4xl",rem:2.25},{name:"5xl",rem:3}];c+='<div class="specimen-scale">';for(let b of r)c+=`<div class="scale-step" style="font-family:${t};font-size:${b.rem}rem">
          <span class="scale-label">${b.name}</span>
          <span class="scale-text">${e.substring(0,30)}</span>
        </div>`;c+="</div>"}this.innerHTML=c}};f("type-specimen",v);var x=class extends u{static observedAttributes=["tokens","prefix","show-values","label"];setup(){this.#e()}attributeChangedCallback(){this.isConnected&&this.#e()}#e(){let t=this.getAttribute("tokens")||"3xs,2xs,xs,s,m,l,xl,2xl,3xl",o=this.getAttribute("prefix")||"--size-",e=this.getAttribute("show-values")!=="false",s=this.getAttribute("label")||"",a=t.split(",").map(l=>l.trim()),n="";s&&(n+=`<div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${s}</div>`),n+=`<div role="list" aria-label="${s||"Spacing scale"}" style="display:flex;flex-direction:column;gap:0.25rem">`;for(let l of a){let m=`${o}${l}`;n+=`<div role="listitem" style="display:grid;grid-template-columns:3rem 1fr auto;align-items:center;gap:0.75rem;min-block-size:1.75rem">
        <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${l}</span>
        <div class="scale-bar" style="display:block;block-size:var(--size-m,1rem);min-inline-size:2px;inline-size:var(${m});background:var(--color-interactive,oklch(55% 0.2 260));border-radius:var(--radius-s,0.25rem)" aria-hidden="true"></div>
        ${e?'<span class="scale-value" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums;min-inline-size:3.5rem;text-align:end"></span>':""}
      </div>`}n+="</div>",this.innerHTML=n,e&&requestAnimationFrame(()=>{this.querySelectorAll(".scale-bar").forEach(l=>{let m=l.getBoundingClientRect().width,c=l.nextElementSibling;c&&(c.textContent=`${Math.round(m*100)/100}px`)})})}};f("spacing-specimen",x);var A={shadow:{prefix:"--shadow-",tokens:"xs,s,m,l,xl,2xl"},radius:{prefix:"--radius-",tokens:"xs,s,m,l,xl,2xl,full"},border:{prefix:"--border-width-",tokens:"thin,medium,thick"},color:{prefix:"--color-",tokens:"primary,secondary,accent,success,warning,error,info"},size:{prefix:"--size-",tokens:"3xs,2xs,xs,s,m,l,xl,2xl,3xl"}},E={shadow:M,radius:L,border:T,color:q,size:B},w=class extends u{static observedAttributes=["type","tokens","prefix","show-values","label"];setup(){this.#e()}attributeChangedCallback(){this.isConnected&&this.#e()}#e(){let t=this.getAttribute("type")||"shadow",o=A[t]||A.shadow,e=this.getAttribute("prefix")||o.prefix,s=this.getAttribute("tokens")||o.tokens,a=this.getAttribute("show-values")!=="false",n=this.getAttribute("label")||"",l=s.split(",").map(r=>r.trim()),m=E[t]||E.shadow,c="";n&&(c+=`<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${n}</p>`),c+=m(l,e,a),this.innerHTML=c,a&&requestAnimationFrame(()=>this.#t(t,e,l))}#t(t,o,e){let s=getComputedStyle(this);this.querySelectorAll("[data-token-value]").forEach(a=>{let n=a.dataset.tokenValue,l=s.getPropertyValue(`${o}${n}`).trim();if(t==="radius"||t==="size"){let m=this.querySelector(`[data-token-sample="${n}"]`);if(m){let c=t==="radius"?"borderRadius":"width",r=t==="size"?m.getBoundingClientRect().width:null;a.textContent=r!=null?`${Math.round(r*100)/100}px`:l||"\u2014"}}else a.textContent=l||"\u2014"})}};function M(i,t,o){let e='<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end">';for(let s of i)e+=`<div role="listitem" style="text-align:center">
      <div style="width:7rem;height:5rem;background:var(--color-surface,#fff);border-radius:var(--radius-m,0.5rem);box-shadow:var(${t}${s})" aria-hidden="true"></div>
      <p style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);margin-block-start:0.5rem">${s}</p>
      ${o?`<p data-token-value="${s}" style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#999);max-width:7rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></p>`:""}
    </div>`;return e+="</div>",e}function L(i,t,o){let e='<div role="list" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:end">';for(let s of i)e+=`<div role="listitem" style="text-align:center">
      <div data-token-sample="${s}" style="width:4.5rem;height:4.5rem;background:var(--color-primary,oklch(55% 0.2 260));border-radius:var(${t}${s});display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.75rem;font-family:var(--font-mono,monospace)" aria-hidden="true">${s}</div>
      ${o?`<p data-token-value="${s}" style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#999);margin-block-start:0.25rem"></p>`:""}
    </div>`;return e+="</div>",e}function T(i,t,o){let e='<div role="list" style="display:flex;flex-direction:column;gap:0.75rem">';for(let s of i)e+=`<div role="listitem" style="display:grid;grid-template-columns:4rem 1fr auto;align-items:center;gap:0.75rem">
      <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${s}</span>
      <div style="border-block-start:var(${t}${s}) solid var(--color-text,#333);min-inline-size:4rem" aria-hidden="true"></div>
      ${o?`<span data-token-value="${s}" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums"></span>`:""}
    </div>`;return e+="</div>",e}function q(i,t,o){let e='<div role="list" style="display:flex;flex-wrap:wrap;gap:0.75rem">';for(let s of i)e+=`<div role="listitem" style="text-align:center">
      <div style="width:4rem;height:3rem;background:var(${t}${s});border-radius:var(--radius-s,0.25rem);border:1px solid var(--color-border,#ddd)" aria-hidden="true"></div>
      <p style="font-family:var(--font-mono,monospace);font-size:0.625rem;color:var(--color-text-muted,#666);margin-block-start:0.25rem">${s}</p>
      ${o?`<p data-token-value="${s}" style="font-family:var(--font-mono,monospace);font-size:0.5625rem;color:var(--color-text-muted,#999);max-width:4rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></p>`:""}
    </div>`;return e+="</div>",e}function B(i,t,o){let e='<div role="list" style="display:flex;flex-direction:column;gap:0.25rem">';for(let s of i)e+=`<div role="listitem" style="display:grid;grid-template-columns:3rem 1fr auto;align-items:center;gap:0.75rem;min-block-size:1.75rem">
      <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${s}</span>
      <div data-token-sample="${s}" style="display:block;block-size:var(--size-m,1rem);min-inline-size:2px;inline-size:var(${t}${s});background:var(--color-interactive,oklch(55% 0.2 260));border-radius:var(--radius-s,0.25rem)" aria-hidden="true"></div>
      ${o?`<span data-token-value="${s}" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums;min-inline-size:3.5rem;text-align:end"></span>`:""}
    </div>`;return e+="</div>",e}f("token-specimen",w);var N={button:()=>`
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
    <textarea rows="3" placeholder="Textarea sample" aria-label="Sample textarea" style="width:100%"></textarea>`},$=class extends u{static observedAttributes=["components","label","compact"];setup(){this.#e()}attributeChangedCallback(){this.isConnected&&this.#e()}#e(){let t=this.getAttribute("components")||"button,input,select,checkbox,radio,badge,progress",o=this.getAttribute("label")||"",e=this.hasAttribute("compact"),s=t.split(",").map(l=>l.trim()),a=e?"0.75rem":"1.25rem",n="";o&&(n+=`<p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${o}</p>`),n+=`<section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:${a}">`;for(let l of s){let m=N[l];m&&(n+=`<article style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);background:var(--color-surface,#fff)">
        <p style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#999);margin-block-end:var(--size-s,0.5rem);font-family:var(--font-sans,system-ui)">${l}</p>
        ${m()}
      </article>`)}n+="</section>",this.innerHTML=n}};f("component-sampler",$);
//# sourceMappingURL=design-system.full.js.map
