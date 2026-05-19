var D=window.matchMedia("(prefers-reduced-motion: reduce)");var w=new Map;function x(t,e,i={}){let o=i.priority??10,r={impl:e,bundle:i.bundle,contract:i.contract,priority:o},s=w.get(t);if(customElements.get(t)){if(!s||s.priority>=o){s&&s.priority===o&&s.impl!==e&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${i.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${i.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=o){s.priority===o&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${s.bundle}". Skipping "${i.bundle}" (first wins at equal priority).`);return}w.set(t,r),customElements.define(t,e)}var p=class extends HTMLElement{#e=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let e of this.#e)e();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,i,o,r){e.addEventListener(i,o,r),this.#e.push(()=>e.removeEventListener(i,o,r))}setup(){}teardown(){}setState(e,i){this.#t||(this.#t=this.attachInternals());let o=this.#t.states;try{i?o.add(e):o.delete(e)}catch{let r=`--${e}`;i?o.add(r):o.delete(r)}}_adoptInternals(e){this.#t||(this.#t=e)}};var m=[{name:"Playfair Display",category:"serif",weights:"400;600;700;900",style:"elegant"},{name:"Merriweather",category:"serif",weights:"300;400;700;900",style:"readable"},{name:"Lora",category:"serif",weights:"400;500;600;700",style:"elegant"},{name:"Source Serif 4",category:"serif",weights:"300;400;600;700",style:"neutral"},{name:"Libre Baskerville",category:"serif",weights:"400;700",style:"classic"},{name:"Crimson Text",category:"serif",weights:"400;600;700",style:"classic"},{name:"DM Serif Display",category:"serif",weights:"400",style:"bold"},{name:"Cormorant Garamond",category:"serif",weights:"300;400;500;600;700",style:"elegant"},{name:"Inter",category:"sans-serif",weights:"300;400;500;600;700",style:"neutral"},{name:"Open Sans",category:"sans-serif",weights:"300;400;600;700",style:"friendly"},{name:"Roboto",category:"sans-serif",weights:"300;400;500;700",style:"neutral"},{name:"Lato",category:"sans-serif",weights:"300;400;700;900",style:"warm"},{name:"Nunito",category:"sans-serif",weights:"300;400;600;700",style:"friendly"},{name:"Work Sans",category:"sans-serif",weights:"300;400;500;600;700",style:"geometric"},{name:"DM Sans",category:"sans-serif",weights:"400;500;700",style:"geometric"},{name:"Plus Jakarta Sans",category:"sans-serif",weights:"300;400;500;600;700",style:"modern"},{name:"Space Grotesk",category:"sans-serif",weights:"300;400;500;600;700",style:"technical"},{name:"Manrope",category:"sans-serif",weights:"300;400;500;600;700",style:"geometric"},{name:"IBM Plex Sans",category:"sans-serif",weights:"300;400;500;600",style:"technical"},{name:"Outfit",category:"sans-serif",weights:"300;400;500;600;700",style:"modern"},{name:"Bebas Neue",category:"display",weights:"400",style:"bold"},{name:"Abril Fatface",category:"display",weights:"400",style:"elegant"},{name:"Oswald",category:"display",weights:"300;400;500;600;700",style:"condensed"},{name:"Sora",category:"display",weights:"300;400;500;600;700",style:"modern"},{name:"Fraunces",category:"display",weights:"300;400;500;600;700;900",style:"elegant"},{name:"JetBrains Mono",category:"monospace",weights:"400;500;600;700",style:"technical"},{name:"Fira Code",category:"monospace",weights:"300;400;500;600;700",style:"technical"},{name:"IBM Plex Mono",category:"monospace",weights:"400;500;600",style:"technical"},{name:"Source Code Pro",category:"monospace",weights:"300;400;500;600;700",style:"neutral"}],z=[["Playfair Display","Inter"],["DM Serif Display","DM Sans"],["Fraunces","Plus Jakarta Sans"],["Lora","Open Sans"],["Merriweather","Roboto"],["Oswald","Lato"],["Cormorant Garamond","Work Sans"],["Sora","Inter"],["Abril Fatface","Nunito"],["Source Serif 4","Source Code Pro"],["Space Grotesk","IBM Plex Sans"],["Outfit","Manrope"]];function g(t,e="400;700"){return`https://fonts.googleapis.com/css2?family=${t.replace(/\s+/g,"+")}:wght@${e}&display=swap`}async function k(t,e="400;700"){let i=`gf-${t.replace(/\s+/g,"-").toLowerCase()}`;if(document.getElementById(i)){await document.fonts.ready;return}let o=document.createElement("link");o.id=i,o.rel="stylesheet",o.href=g(t,e),document.head.appendChild(o),await document.fonts.ready}var n=(t,e,i,o="")=>`${o} contenteditable="plaintext-only" spellcheck="false" class="fp-editable" data-role="${i}"`,u={combined:{label:"Combined",render:(t,e)=>`
      <p style="font-family:${t.display};font-size:var(--font-size-3xl,2rem);font-weight:800;margin:0;line-height:1.15"
        ${n(t.display,"p","heading")}>${e.heading}</p>
      <h3 style="font-family:${t.heading};font-size:var(--font-size-lg,1.125rem);font-weight:600;margin:0"
        ${n(t.heading,"h3","subheading")}>${e.subheading}</h3>
      <p style="font-family:${t.body};font-size:var(--font-size-md,1rem);line-height:1.65;margin:0;color:var(--color-text-muted,#666)"
        ${n(t.body,"p","body")}>${e.body}</p>
      <pre style="font-family:${t.code};font-size:var(--font-size-sm,0.875rem);line-height:1.5;margin:0;padding:var(--size-s,0.75rem);background:var(--color-surface-sunken,#eee);border-radius:var(--radius-s,0.25rem);overflow-x:auto"><code ${n(t.code,"code","code")}>${e.code}</code></pre>`},article:{label:"Article",render:(t,e)=>`
      <small style="font-family:${t.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.08em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600"
        ${n(t.body,"small","eyebrow")}>${e.eyebrow}</small>
      <h2 style="font-family:${t.heading};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0;line-height:1.2"
        ${n(t.heading,"h2","heading")}>${e.heading}</h2>
      <p style="font-family:${t.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0"
        ${n(t.body,"p","byline")}>${e.byline}</p>
      <p style="font-family:${t.body};line-height:1.7;margin:0" ${n(t.body,"p","body")}>${e.body}</p>
      <h3 style="font-family:${t.heading};font-size:var(--font-size-lg,1.125rem);font-weight:600;margin:0"
        ${n(t.heading,"h3","subheading")}>${e.subheading}</h3>
      <p style="font-family:${t.body};line-height:1.7;margin:0" ${n(t.body,"p","body2")}>${e.body2}</p>
      <blockquote style="font-family:${t.display};font-style:italic;font-size:var(--font-size-lg,1.125rem);border-inline-start:3px solid var(--color-interactive,oklch(55% .2 260));padding-inline-start:var(--size-m,1rem);margin:0;color:var(--color-text-muted,#666)"
        ${n(t.display,"blockquote","quote")}>${e.quote}</blockquote>
      <pre style="font-family:${t.code};font-size:var(--font-size-sm,0.875rem);line-height:1.5;margin:0;padding:var(--size-s,0.75rem);background:var(--color-surface-sunken,#eee);border-radius:var(--radius-s,0.25rem);overflow-x:auto"><code ${n(t.code,"code","code")}>${e.code}</code></pre>`},"long-article":{label:"Long Article",render:(t,e)=>`
      <small style="font-family:${t.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.08em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600">${e.eyebrow}</small>
      <h1 style="font-family:${t.display};font-size:var(--font-size-3xl,2rem);font-weight:800;margin:0;line-height:1.15">${e.heading}</h1>
      <p style="font-family:${t.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0">${e.byline}</p>
      <p style="font-family:${t.body};font-size:var(--font-size-lg,1.125rem);line-height:1.6;margin:0;color:var(--color-text-muted,#666)">${e.lead}</p>
      <h2 style="font-family:${t.heading};font-size:var(--font-size-xl,1.375rem);font-weight:700;margin:0">${e.subheading}</h2>
      <p style="font-family:${t.body};line-height:1.7;margin:0">${e.body}</p>
      <p style="font-family:${t.body};line-height:1.7;margin:0">${e.body2}</p>
      <blockquote style="font-family:${t.display};font-style:italic;font-size:var(--font-size-lg,1.125rem);border-inline-start:3px solid var(--color-interactive,oklch(55% .2 260));padding-inline-start:var(--size-m,1rem);margin:0;color:var(--color-text-muted,#666)">${e.quote}</blockquote>
      <h2 style="font-family:${t.heading};font-size:var(--font-size-xl,1.375rem);font-weight:700;margin:0">Implementation Details</h2>
      <p style="font-family:${t.body};line-height:1.7;margin:0">Design tokens form the atomic layer of any visual system. Colors, spacing, typography, and motion are expressed as named variables that cascade through every component. When a token changes, every surface that references it updates automatically \u2014 no find-and-replace, no missed instances.</p>
      <pre style="font-family:${t.code};font-size:var(--font-size-sm,0.875rem);line-height:1.5;margin:0;padding:var(--size-s,0.75rem);background:var(--color-surface-sunken,#eee);border-radius:var(--radius-s,0.25rem);overflow-x:auto"><code>${e.code}</code></pre>
      <h3 style="font-family:${t.heading};font-size:var(--font-size-lg,1.125rem);font-weight:600;margin:0">Key Takeaways</h3>
      <ul style="font-family:${t.body};line-height:1.7;margin:0;padding-inline-start:1.5rem">
        <li>Typography sets the emotional tone before a single word is read</li>
        <li>Pair contrast with harmony \u2014 serif headings with sans-serif body</li>
        <li>Test at real content lengths, not just sample sentences</li>
        <li>Code fonts need clear distinction between similar glyphs</li>
      </ul>`},card:{label:"Card UI",render:(t,e)=>`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--size-m,1rem)">
        <div style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)">
          <h4 style="font-family:${t.heading};font-weight:600;margin:0" ${n(t.heading,"h4","cardTitle")}>Premium Plan</h4>
          <p style="font-family:${t.display};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0">$49<small style="font-size:0.5em;font-weight:400">/mo</small></p>
          <p style="font-family:${t.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0" ${n(t.body,"p","cardBody")}>Everything you need to build faster.</p>
          <code style="font-family:${t.code};font-size:var(--font-size-xs,0.75rem);background:var(--color-surface-sunken,#eee);padding:0.2rem 0.4rem;border-radius:0.25rem" ${n(t.code,"code","cardCode")}>npm install acme</code>
        </div>
        <div style="border:1px solid var(--color-border,#ddd);border-radius:var(--radius-m,0.5rem);padding:var(--size-m,1rem);display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)">
          <h4 style="font-family:${t.heading};font-weight:600;margin:0">Enterprise</h4>
          <p style="font-family:${t.display};font-size:var(--font-size-2xl,1.75rem);font-weight:700;margin:0">Custom</p>
          <p style="font-family:${t.body};font-size:var(--font-size-sm,0.875rem);color:var(--color-text-muted,#666);margin:0">Dedicated support and SLA guarantees.</p>
          <code style="font-family:${t.code};font-size:var(--font-size-xs,0.75rem);background:var(--color-surface-sunken,#eee);padding:0.2rem 0.4rem;border-radius:0.25rem">contact@acme.dev</code>
        </div>
      </div>`},hero:{label:"Hero",render:(t,e)=>`
      <div style="text-align:center;padding:var(--size-xl,2rem) 0">
        <p style="font-family:${t.body};font-size:var(--font-size-xs,0.75rem);text-transform:uppercase;letter-spacing:0.1em;color:var(--color-interactive,oklch(55% .2 260));font-weight:600;margin:0 0 var(--size-xs,0.5rem)"
          ${n(t.body,"p","eyebrow")}>${e.eyebrow}</p>
        <h1 style="font-family:${t.display};font-size:clamp(2rem,5vw,3rem);font-weight:800;margin:0;line-height:1.1"
          ${n(t.display,"h1","heading")}>${e.heading}</h1>
        <p style="font-family:${t.body};font-size:var(--font-size-lg,1.125rem);color:var(--color-text-muted,#666);margin:var(--size-s,0.75rem) auto 0;max-width:40ch"
          ${n(t.body,"p","body")}>${e.body}</p>
      </div>`}},b=class extends p{static observedAttributes=["heading-font","body-font","code-font","display-font","sample","show-export","show-suggestions","preview"];#e={heading:"",body:"",code:"",display:""};#t="combined";#i={heading:"The Art of Typography",subheading:"Building visual harmony through font pairing",body:"Good typography is invisible \u2014 it lets the content speak without distraction. The best font pairings create harmony between heading impact and body readability. Every typeface carries personality: serif fonts convey trust and tradition, while sans-serif fonts feel modern and clean.",body2:"Choosing the right pairing is about contrast and complement. A bold display font for headlines needs a quiet, readable body font to balance it. Monospace fonts ground technical content in precision. The interplay between these roles defines your brand voice.",code:`const theme = {
  heading: "Playfair Display",
  body: "Inter",
  tokens: { size: 16, scale: 1.25 }
};`,eyebrow:"Design Systems",byline:"By Jamie Chen \xB7 April 14, 2026 \xB7 8 min read",lead:"How native CSS features and design tokens are replacing the complex tooling we thought we needed.",quote:'"Good typography is invisible \u2014 it lets the content breathe."'};setup(){this.#e.heading=this.getAttribute("heading-font")||"Playfair Display",this.#e.body=this.getAttribute("body-font")||"Inter",this.#e.code=this.getAttribute("code-font")||"JetBrains Mono",this.#e.display=this.getAttribute("display-font")||this.#e.heading,this.#t=this.getAttribute("preview")||"combined",this.#s(),this.#o()}attributeChangedCallback(e,i,o){i===o||!this.isConnected||(e==="heading-font"&&(this.#e.heading=o||"Playfair Display"),e==="body-font"&&(this.#e.body=o||"Inter"),e==="code-font"&&(this.#e.code=o||"JetBrains Mono"),e==="display-font"&&(this.#e.display=o||this.#e.heading),e==="preview"&&(this.#t=o||"combined"),this.#s(),this.#o())}async#o(){let e=Object.values(this.#e).filter(Boolean).map(i=>{let o=m.find(r=>r.name===i);return k(i,o?.weights||"400;700")});await Promise.all(e),this.#m()}#s(){let e=this.hasAttribute("show-export"),i=this.hasAttribute("show-suggestions"),o="var(--size-m, 1rem)",r="var(--size-s, 0.75rem)",s="var(--size-xs, 0.5rem)",a="var(--radius-m, 0.5rem)",c="var(--color-border, #ddd)",h="var(--color-surface, #fff)",$="var(--color-surface-raised, #f5f5f5)",y="var(--color-text-muted, #666)",S="var(--font-size-sm, 0.875rem)",l="var(--font-size-xs, 0.75rem)",E=`font:inherit;font-size:${S};padding:0.35rem 0.5rem;border:1px solid ${c};border-radius:4px;background:${h}`,C=[{key:"heading",label:"Heading"},{key:"body",label:"Body"},{key:"code",label:"Code"},{key:"display",label:"Display"}].map(d=>`
      <label style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:9rem;font-size:${l};font-weight:600;color:${y};text-transform:uppercase;letter-spacing:0.04em">
        ${d.label}
        <select class="fp-select" data-role="${d.key}" style="${E}">
          ${this.#c(this.#e[d.key])}
        </select>
      </label>
    `).join(""),M=Object.entries(u).map(([d,{label:f}])=>`<button type="button" class="fp-tab" data-mode="${d}"
        style="all:unset;cursor:pointer;font-size:${l};padding:0.3rem 0.75rem;border-radius:999px;${d===this.#t?"background:var(--color-interactive,oklch(55% .2 260));color:white":`border:1px solid ${c}`}">${f}</button>`).join(""),A={heading:`'${this.#e.heading}', serif`,body:`'${this.#e.body}', sans-serif`,code:`'${this.#e.code}', monospace`,display:`'${this.#e.display}', serif`},T=u[this.#t]?.render(A,this.#i)||"",L=z.map(([d,f])=>`<button type="button" class="fp-suggestion" data-h="${d}" data-b="${f}"
        style="all:unset;cursor:pointer;font-size:${l};padding:0.3rem 0.5rem;border:1px solid ${c};border-radius:4px;white-space:nowrap;text-align:left;line-height:1.3"
        title="${d} + ${f}"><strong>${d}</strong><br><span style="color:${y}">${f}</span></button>`).join(""),q=this.#r(),P=`<details class="fp-code-details" style="border:1px solid ${c};border-radius:${a};overflow:hidden"${e?" open":""}>
      <summary style="padding:${s} ${r};cursor:pointer;font-size:${l};font-weight:600;color:${y};text-transform:uppercase;letter-spacing:0.04em;background:${$}">Code</summary>
      <div style="padding:${r}">
        <pre style="font-family:var(--font-mono,monospace);font-size:${l};margin:0;white-space:pre-wrap;word-break:break-all" class="fp-css-output">${q}</pre>
        <div style="display:flex;gap:${s};margin-block-start:${r}">
          <button type="button" class="fp-copy-css"
            style="all:unset;cursor:pointer;font-size:${l};padding:0.3rem 0.65rem;border:1px solid ${c};border-radius:4px;background:${h}">Copy CSS</button>
          <button type="button" class="fp-copy-import"
            style="all:unset;cursor:pointer;font-size:${l};padding:0.3rem 0.65rem;border:1px solid ${c};border-radius:4px;background:${h}">Copy @import</button>
        </div>
      </div>
    </details>`,v=`<div style="display:flex;flex-direction:column;gap:${o};flex:1;min-width:0">
      <div style="display:flex;flex-wrap:wrap;gap:${s}">${C}</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.375rem;align-items:center">
        <span style="font-size:${l};font-weight:600;color:${y};text-transform:uppercase;letter-spacing:0.04em;margin-inline-end:${s}">Examples</span>
        ${M}
      </div>
      <div style="display:flex;flex-direction:column;gap:${s}">
        <span style="font-size:${l};font-weight:600;color:${y};text-transform:uppercase;letter-spacing:0.04em">Preview</span>
        <div class="fp-preview" style="padding:var(--size-l,1.5rem);background:${$};border-radius:${a};border:1px solid ${c};display:flex;flex-direction:column;gap:${r};max-height:24rem;overflow-y:auto">
          ${T}
        </div>
      </div>
      ${P}
    </div>`;i?this.innerHTML=`<div style="display:flex;gap:${o};flex-wrap:wrap">
        ${v}
        <aside style="flex:0 0 11rem;display:flex;flex-direction:column;gap:${s}">
          <span style="font-size:${l};font-weight:600;color:${y};text-transform:uppercase;letter-spacing:0.04em">Pairings</span>
          <div style="display:flex;flex-direction:column;gap:0.25rem">${L}</div>
        </aside>
      </div>`:this.innerHTML=v,this.#f()}#c(e){return["serif","sans-serif","display","monospace"].map(o=>{let s=m.filter(a=>a.category===o).map(a=>`<option value="${a.name}"${a.name===e?" selected":""}>${a.name}</option>`).join("");return`<optgroup label="${o}">${s}</optgroup>`}).join("")}#r(){let e=[],i={heading:"serif",body:"sans-serif",code:"monospace",display:"serif"};for(let[o,r]of Object.entries(i)){let s=this.#e[o];if(!s)continue;let a=m.find(c=>c.name===s);e.push(`--font-${o}: "${s}", ${a?.category||r};`)}return e.join(`
`)}#y(){let e=new Set,i=[];for(let o of Object.values(this.#e)){if(!o||e.has(o))continue;e.add(o);let r=m.find(s=>s.name===o);i.push(`@import url('${g(o,r?.weights||"400;700")}');`)}return i.join(`
`)}#f(){this.querySelectorAll(".fp-select").forEach(e=>{e.addEventListener("change",i=>{let o=i.target;this.#e[o.dataset.role]=o.value,this.#o(),this.#n(),this.#a(),this.#d()})}),this.querySelectorAll(".fp-tab").forEach(e=>{e.addEventListener("click",()=>{let i=e;this.#t=i.dataset.mode||"combined",this.#s(),this.#o()})}),this.querySelectorAll(".fp-suggestion").forEach(e=>{e.addEventListener("click",()=>{let i=e;this.#e.heading=i.dataset.h||"",this.#e.body=i.dataset.b||"",this.#e.display=i.dataset.h||"",this.#s(),this.#o(),this.#d()})}),this.querySelectorAll(".fp-editable").forEach(e=>{let i=e;i.addEventListener("blur",()=>{let o=i.dataset.role;o&&i.textContent.trim()&&(this.#i[o]=i.textContent.trim())})}),this.querySelector(".fp-copy-css")?.addEventListener("click",e=>{navigator.clipboard?.writeText(this.#r()),this.#l(e.target)}),this.querySelector(".fp-copy-import")?.addEventListener("click",e=>{navigator.clipboard?.writeText(this.#y()),this.#l(e.target)})}#n(){let e=this.querySelector(".fp-preview");if(!e)return;let i={heading:`'${this.#e.heading}', serif`,body:`'${this.#e.body}', sans-serif`,code:`'${this.#e.code}', monospace`,display:`'${this.#e.display}', serif`};e.innerHTML=u[this.#t]?.render(i,this.#i)||"",e.querySelectorAll(".fp-editable").forEach(o=>{let r=o;r.addEventListener("blur",()=>{let s=r.dataset.role;s&&r.textContent.trim()&&(this.#i[s]=r.textContent.trim())})})}#m(){this.#n(),this.#a()}#a(){let e=this.querySelector(".fp-css-output");e&&(e.textContent=this.#r())}#l(e){let i=e.textContent;e.textContent="Copied!",setTimeout(()=>{e.textContent=i},1500)}#d(){this.dispatchEvent(new CustomEvent("font-pairer:change",{bubbles:!0,detail:{...this.#e}}))}};x("font-pairer",b);export{b as FontPairer};
//# sourceMappingURL=font-pairer.js.map
