var J=window.matchMedia("(prefers-reduced-motion: reduce)");var M=new Map;function N(t,e,n={}){let i=n.priority??10,o={impl:e,bundle:n.bundle,contract:n.contract,priority:i},r=M.get(t);if(customElements.get(t)){if(!r||r.priority>=i){r&&r.priority===i&&r.impl!==e&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${r.bundle}" (priority ${r.priority}). Skipping "${n.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${r.bundle}" cannot be replaced (customElements.define is permanent). "${n.bundle}" has higher priority but arrived late.`);return}if(r&&r.priority>=i){r.priority===i&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${r.bundle}". Skipping "${n.bundle}" (first wins at equal priority).`);return}M.set(t,o),customElements.define(t,e)}var y=class extends HTMLElement{#n=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let e of this.#n)e();this.#n=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,n,i,o){e.addEventListener(n,i,o),this.#n.push(()=>e.removeEventListener(n,i,o))}setup(){}teardown(){}setState(e,n){this.#e||(this.#e=this.attachInternals());let i=this.#e.states;try{n?i.add(e):i.delete(e)}catch{let o=`--${e}`;n?i.add(o):i.delete(o)}}_adoptInternals(e){this.#e||(this.#e=e)}};var B="https://vanilla-breeze.com/specs/canonical-document-v1",F=new Set(["SCRIPT","STYLE","TEMPLATE","NOSCRIPT","NAV","ASIDE","HEADER","FOOTER","FIGCAPTION","PAGE-INFO","CHANGE-SET","PAGE-TOC","PAGE-TOOLS","PAGE-STATS","CONTENT-LENS","BUTTON","DIALOG","MENU","FORM","DEL"]),U=new Set(["ARTICLE","SECTION","ASIDE","NAV","HEADER","FOOTER","DIV","MAIN","HGROUP","H1","H2","H3","H4","H5","H6","P","BLOCKQUOTE","PRE","HR","OL","UL","LI","DL","DT","DD","TABLE","THEAD","TBODY","TFOOT","TR","TD","TH","CAPTION","FIGURE","DETAILS","SUMMARY","ADDRESS","FORM","FIELDSET","LEGEND"]),_=new Set(["PRE","TEXTAREA"]);function V(t){return!t||t.nodeType!==1?!1:!!(F.has(t.tagName)||t.hasAttribute("hidden")||t.getAttribute("aria-hidden")==="true"||t.getAttribute("data-signable")==="false")}function D(t,e,n){if(V(t))return;let i=U.has(t.tagName),o=n||_.has(t.tagName);for(let r of t.childNodes)if(r.nodeType===3){let s=r.nodeValue||"";if(!s)continue;if(o)x(e,s.normalize("NFC"));else{let a=s.normalize("NFC").replace(/\s+/g," ");if(a===""||a===" "&&(e.text===""||e.text.endsWith(" ")||e.text.endsWith(`
`)))continue;x(e,a)}}else if(r.nodeType===1){if(r.tagName==="BR"){w(e,`
`);continue}D(r,e,o)}i&&w(e,`

`),t.tagName==="HR"&&w(e,`

`)}function x(t,e){t.text+=e}function w(t,e){if(!t.text.endsWith(e)){if(e===`

`&&t.text.endsWith(`
`)){t.text=t.text.replace(/\n+$/,"")+`

`;return}e===`
`&&t.text.endsWith(`

`)||(t.text+=e)}}function G(t){let e=[...t.querySelectorAll("[data-signable]")],n=e.filter(o=>!e.some(r=>r!==o&&r.contains(o))),i={text:""};for(let o of n)D(o,i,!1);return i.text.replace(/^\s+/,"").replace(/\s+$/,"")}function f(t,e){return t.querySelector(`meta[name="${E(e)}"]`)?.getAttribute("content")||""}function $(t,e){return t.querySelector(`meta[property="${E(e)}"]`)?.getAttribute("content")||""}function z(t,e){return t.querySelector(`meta[itemprop="${E(e)}"]`)?.getAttribute("content")||""}function R(t,e){return t.querySelector(`link[rel="${E(e)}"]`)?.getAttribute("href")||""}function E(t){return String(t).replace(/[^a-zA-Z0-9:_\-/]/g,"")}function j(t){if(!t)return"";try{let e=new URL(t);e.search="",e.hash="";let n=`${e.protocol}//${e.hostname.toLowerCase()}`;return e.port&&(n+=`:${e.port}`),n+=e.pathname,n}catch{return t}}function O(t){if(!t)return"";let e=String(t).match(/^(\d{4}-\d{2}-\d{2})/);return e?e[1]:""}function K(t){return $(t,"og:title")||t.title||""}function W(t){let e=f(t,"keywords");return e?e.split(",").map(n=>n.trim()).filter(Boolean):[]}function X(t){let e=new Set;for(let n of t.querySelectorAll('meta[name="concept"]')){let i=(n.getAttribute("content")||"").trim();i&&e.add(i)}return[...e].sort()}function Y(t){return R(t,"license")||f(t,"license")}function H(t,e={}){let n=e.url??t?.location?.href??"",i=O($(t,"article:published_time")),o=O(f(t,"last-modified")||$(t,"article:modified_time"));return{"@context":B,"@version":1,url:j(n),title:K(t),author:f(t,"author"),authorUrl:$(t,"article:author")||R(t,"author"),published:i,modified:o,version:z(t,"version"),keywords:W(t),concepts:X(t),provenance:f(t,"vb:provenance"),review:f(t,"vb:review"),status:f(t,"vb:status"),license:Y(t),content:G(t)}}function q(t){return JSON.stringify(t)}var C=class t extends y{setup(){this.hasAttribute("auto")&&this.#l(),this.#n(),this.#r(),this.#i(),this.#o()}#n(){for(let e of this.querySelectorAll("time[data-relative]")){let n=e.getAttribute("datetime");if(!n)continue;let i=t.#e(new Date(n));i&&(e.textContent=i)}}static#e(e){let i=Date.now()-e.getTime();if(i<0)return null;let o=Math.floor(i/1e3),r=Math.floor(o/60),s=Math.floor(r/60),a=Math.floor(s/24);return a>365?`${Math.floor(a/365)} year${Math.floor(a/365)!==1?"s":""} ago`:a>30?`${Math.floor(a/30)} month${Math.floor(a/30)!==1?"s":""} ago`:a>0?`${a} day${a!==1?"s":""} ago`:s>0?`${s} hour${s!==1?"s":""} ago`:r>0?`${r} minute${r!==1?"s":""} ago`:"just now"}#r(){let e=this.querySelector("[data-reading-time]");if(!e)return;let n=document.querySelectorAll("[data-signable]");if(!n.length)return;let i=0;for(let r of n){let s=r.textContent?.trim()||"";i+=s.split(/\s+/).filter(Boolean).length}let o=Math.max(1,Math.ceil(i/200));e.textContent=`~${o} min`}#i(){let e=!!document.querySelector('meta[name="vb:provenance"], meta[name="author"]'),n=e?"declared":"undeclared",i=this.querySelector(".page-info-badge");i&&i.setAttribute("data-trust",n),this.dispatchEvent(new CustomEvent("page-info:verified",{detail:{status:n,tier:e?1:0},bubbles:!0}))}async#o(){let n=document.querySelector('meta[name="vb:signature"]')?.content;if(!n)return;let i=document.querySelector('meta[name="vb:signature-algorithm"]')?.content;if(i&&i!=="ECDSA-P256-SHA256"){this.#t("failed",{reason:`unsupported-algorithm:${i}`});return}let o=document.querySelector('link[rel="author-key"]')?.getAttribute("href");if(!o){this.#t("failed",{reason:"missing-author-key"});return}let r;try{let c=new URL(o,document.baseURI),u=await fetch(c,{credentials:"omit"});if(!u.ok)throw new Error(`status ${u.status}`);let l=await u.json(),h={kty:l.kty,crv:l.crv,x:l.x,y:l.y,use:l.use||"sig",key_ops:["verify"]};r=await crypto.subtle.importKey("jwk",h,{name:"ECDSA",namedCurve:"P-256"},!1,["verify"])}catch(c){this.#t("key-unavailable",{reason:c.message});return}let s;try{let c=document.querySelector('link[rel="canonical"]')?.href||document.location.href;s=q(H(document,{url:c}))}catch(c){this.#t("failed",{reason:`canonicalize:${c.message}`});return}let a;try{let c=new TextEncoder().encode(s),u=Uint8Array.from(atob(n),l=>l.charCodeAt(0));a=await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},r,u,c)}catch(c){this.#t("failed",{reason:`verify:${c.message}`});return}this.#t(a?"verified":"failed",{reason:a?"ok":"mismatch"})}#t(e,n={}){let o={undeclared:0,declared:1,"domain-anchored":2,verified:3,failed:-1,"key-unavailable":-2}[e]??0,r=this.querySelector(".page-info-badge");if(r){r.setAttribute("data-trust",e);let s=r.getAttribute("aria-label")||"";e==="verified"&&!s.includes("verified")?r.setAttribute("aria-label",`${s} \u2014 verified`.trim()):e==="failed"?r.setAttribute("aria-label",`${s} \u2014 verification failed`.trim()):e==="key-unavailable"&&r.setAttribute("aria-label",`${s} \u2014 author key unavailable`.trim())}this.dispatchEvent(new CustomEvent("page-info:verified",{detail:{status:e,tier:o,...n},bubbles:!0}))}static#a={human:"Human written","ai-assisted":"Human-written, AI-assisted","ai-generated":"AI-generated",translated:"Translated",synthesized:"Synthesized from sources",migrated:"Migrated content"};static#s={unreviewed:"Unreviewed","fact-checked":"Fact-checked","editor-reviewed":"Editor-reviewed"};static#c={draft:"Draft",published:"Published",archived:"Archived"};static#d(e){if(!e)return"";let n=String(e).trim().split(/\s+/).filter(Boolean);return n.length?n.map(o=>t.#a[o]||o).join(" \xB7 "):""}#l(){let e=d=>document.querySelector(`meta[name="${d}"]`)?.content,n=d=>document.querySelector(`meta[property="${d}"]`)?.content,i=d=>document.querySelector(`meta[itemprop="${d}"]`)?.content,o=d=>document.querySelector(`link[rel="${d}"]`)?.href,r=e("author"),s=n("article:author")||o("author"),a=e("last-modified")||n("article:modified_time"),c=n("article:published_time"),u=e("keywords"),l=e("license"),h=o("license"),p=i("version"),g=e("vb:provenance"),v=e("vb:review"),m=e("vb:status"),S=e("vb:ai-tools"),L=e("vb:version-url"),A=Array.from(document.querySelectorAll('meta[name="concept"]')).map(d=>d.getAttribute("content")?.trim()).filter(Boolean),b=t.#d(g),k=t.#s[v]||v||"",T=t.#c[m]||m||"",I=g||S||v||l,P=a||c||p;this.innerHTML=`
      <details>
        <summary>
          ${r?`
            <span class="page-info-author">
              ${s?`<a href="${s}" rel="author">${r}</a>`:r}
            </span>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          `:""}
          ${a?`
            <time datetime="${a}" data-relative>${a}</time>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          `:""}
          ${b?`
            <span class="page-info-badge"
                  data-provenance="${g||""}"
                  data-trust="declared"
                  aria-label="Content provenance: ${b}">
              ${b}
            </span>
          `:""}
          ${m&&m!=="published"?`
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
            <span class="page-info-badge" data-status="${m}">${T}</span>
          `:""}
        </summary>
        <div class="page-info-panel">
          ${r?`
            <section>
              <h2 class="page-info-section-heading">Author</h2>
              <p>${s?`<a href="${s}" rel="author">${r}</a>`:r}</p>
            </section>
          `:""}
          ${P?`
            <section>
              <h2 class="page-info-section-heading">History</h2>
              <dl>
                ${c?`<dl-item><dt>Published</dt><dd><time datetime="${c}" data-relative>${c}</time></dd></dl-item>`:""}
                ${a?`<dl-item><dt>Last updated</dt><dd><time datetime="${a}" data-relative>${a}</time></dd></dl-item>`:""}
                ${p?`<dl-item><dt>Version</dt><dd>${L?`<a href="${L}">${p}</a>`:p}</dd></dl-item>`:""}
              </dl>
            </section>
          `:""}
          ${I?`
            <section>
              <h2 class="page-info-section-heading">How this was made</h2>
              <dl>
                ${g?`<dl-item><dt>Authorship</dt><dd>${b}</dd></dl-item>`:""}
                ${S?`<dl-item><dt>AI tools used</dt><dd>${S}</dd></dl-item>`:""}
                ${k?`<dl-item><dt>Review</dt><dd>${k}</dd></dl-item>`:""}
                ${T?`<dl-item><dt>Status</dt><dd>${T}</dd></dl-item>`:""}
                ${l?`<dl-item><dt>License</dt><dd>${h?`<a href="${h}" rel="license">${l}</a>`:l}</dd></dl-item>`:""}
              </dl>
            </section>
          `:""}
          ${u||A.length?`
            <section>
              <h2 class="page-info-section-heading">Topic</h2>
              <dl>
                ${A.length?`<dl-item><dt>Concepts</dt><dd>${A.map(d=>`<a href="/topics/${d}/" rel="tag" data-concept="${d}">${d}</a>`).join(", ")}</dd></dl-item>`:""}
                ${u?`<dl-item><dt>Keywords</dt><dd>${u}</dd></dl-item>`:""}
              </dl>
            </section>
          `:""}
        </div>
      </details>
    `}};N("page-info",C);export{C as PageInfo};
//# sourceMappingURL=page-info.js.map
