var y=window.matchMedia("(prefers-reduced-motion: reduce)");var v=new Map;function b(s,e,o={}){let t=o.priority??10,r={impl:e,bundle:o.bundle,contract:o.contract,priority:t},n=v.get(s);if(customElements.get(s)){if(!n||n.priority>=t){n&&n.priority===t&&n.impl!==e&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${o.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${o.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=t){n.priority===t&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${n.bundle}". Skipping "${o.bundle}" (first wins at equal priority).`);return}v.set(s,r),customElements.define(s,e)}var l=class extends HTMLElement{#e=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let e of this.#e)e();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,o,t,r){e.addEventListener(o,t,r),this.#e.push(()=>e.removeEventListener(o,t,r))}setup(){}teardown(){}};var h=class s extends l{setup(){this.hasAttribute("auto")&&this.#r(),this.#e(),this.#n(),this.#o()}#e(){for(let e of this.querySelectorAll("time[data-relative]")){let o=e.getAttribute("datetime");if(!o)continue;let t=s.#t(new Date(o));t&&(e.textContent=t)}}static#t(e){let t=Date.now()-e.getTime();if(t<0)return null;let r=Math.floor(t/1e3),n=Math.floor(r/60),a=Math.floor(n/60),i=Math.floor(a/24);return i>365?`${Math.floor(i/365)} year${Math.floor(i/365)!==1?"s":""} ago`:i>30?`${Math.floor(i/30)} month${Math.floor(i/30)!==1?"s":""} ago`:i>0?`${i} day${i!==1?"s":""} ago`:a>0?`${a} hour${a!==1?"s":""} ago`:n>0?`${n} minute${n!==1?"s":""} ago`:"just now"}#n(){let e=this.querySelector("[data-reading-time]");if(!e)return;let o=document.querySelectorAll("[data-signable]");if(!o.length)return;let t=0;for(let n of o){let a=n.textContent?.trim()||"";t+=a.split(/\s+/).filter(Boolean).length}let r=Math.max(1,Math.ceil(t/200));e.textContent=`~${r} min`}#o(){let e="declared",t=this.querySelector(".page-info-badge");t&&t.setAttribute("data-trust",e),this.dispatchEvent(new CustomEvent("page-info:verified",{detail:{status:e,tier:1},bubbles:!0}))}#r(){let e=f=>document.querySelector(`meta[name="${f}"]`)?.content,o=f=>document.querySelector(`meta[property="${f}"]`)?.content,t=e("author"),r=o("article:author"),n=e("last-modified"),a=e("content-version"),i=e("content-version-url"),d=e("content-provenance"),m=e("ai-tools"),p=e("human-review"),u=e("license"),$=e("license-url"),c={human:"Human written","human-ai-assisted":"Human-written, AI-assisted","ai-human-edited":"AI draft, human edited","ai-human-reviewed":"AI-generated, human-reviewed","ai-generated":"AI-generated",synthesized:"Synthesized from sources",translated:"Translated",migrated:"Migrated content"}[d]||d||"";this.innerHTML=`
      <details>
        <summary>
          ${t?`
            <span class="page-info-author">
              ${r?`<a href="${r}" rel="author">${t}</a>`:t}
            </span>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          `:""}
          ${n?`
            <time datetime="${n}" data-relative>${n}</time>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          `:""}
          ${c?`
            <span class="page-info-badge"
                  data-provenance="${d||""}"
                  data-trust="declared"
                  aria-label="Content provenance: ${c}">
              ${c}
            </span>
          `:""}
        </summary>
        <div class="page-info-panel">
          ${t?`
            <section>
              <h2 class="page-info-section-heading">Author</h2>
              <p>${r?`<a href="${r}" rel="author">${t}</a>`:t}</p>
            </section>
          `:""}
          <section>
            <h2 class="page-info-section-heading">History</h2>
            <dl>
              ${n?`<div><dt>Last updated</dt><dd><time datetime="${n}" data-relative>${n}</time></dd></div>`:""}
              ${a?`<div><dt>Version</dt><dd>${i?`<a href="${i}">${a}</a>`:a}</dd></div>`:""}
            </dl>
          </section>
          ${d?`
            <section>
              <h2 class="page-info-section-heading">How this was made</h2>
              <dl>
                <div><dt>Authorship</dt><dd>${c}</dd></div>
                ${m?`<div><dt>AI tools used</dt><dd>${m}</dd></div>`:""}
                ${p?`<div><dt>Human review</dt><dd>${p}</dd></div>`:""}
                ${u?`<div><dt>License</dt><dd>${$?`<a href="${$}" rel="license">${u}</a>`:u}</dd></div>`:""}
              </dl>
            </section>
          `:""}
        </div>
      </details>
    `}};b("page-info",h);export{h as PageInfo};
//# sourceMappingURL=page-info.js.map
