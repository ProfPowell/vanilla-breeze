var Y=window.matchMedia("(prefers-reduced-motion: reduce)");var M=new Map;function x(t,e,r={}){let i=r.priority??10,o={impl:e,bundle:r.bundle,contract:r.contract,priority:i},n=M.get(t);if(customElements.get(t)){if(!n||n.priority>=i){n&&n.priority===i&&n.impl!==e&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${r.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${r.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=i){n.priority===i&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${n.bundle}". Skipping "${r.bundle}" (first wins at equal priority).`);return}M.set(t,o),customElements.define(t,e)}var y=class extends HTMLElement{#t=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let e of this.#t)e();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,r,i,o){e.addEventListener(r,i,o),this.#t.push(()=>e.removeEventListener(r,i,o))}setup(){}teardown(){}};var B="https://vanilla-breeze.com/specs/canonical-document-v1",F=new Set(["SCRIPT","STYLE","TEMPLATE","NOSCRIPT","NAV","ASIDE","HEADER","FOOTER","FIGCAPTION","PAGE-INFO","CHANGE-SET","PAGE-TOC","PAGE-TOOLS","PAGE-STATS","CONTENT-LENS","BUTTON","DIALOG","MENU","FORM","DEL"]),U=new Set(["ARTICLE","SECTION","ASIDE","NAV","HEADER","FOOTER","DIV","MAIN","HGROUP","H1","H2","H3","H4","H5","H6","P","BLOCKQUOTE","PRE","HR","OL","UL","LI","DL","DT","DD","TABLE","THEAD","TBODY","TFOOT","TR","TD","TH","CAPTION","FIGURE","DETAILS","SUMMARY","ADDRESS","FORM","FIELDSET","LEGEND"]),V=new Set(["PRE","TEXTAREA"]);function _(t){return!t||t.nodeType!==1?!1:!!(F.has(t.tagName)||t.hasAttribute("hidden")||t.getAttribute("aria-hidden")==="true"||t.getAttribute("data-signable")==="false")}function D(t,e,r){if(_(t))return;let i=U.has(t.tagName),o=r||V.has(t.tagName);for(let n of t.childNodes)if(n.nodeType===3){let s=n.nodeValue||"";if(!s)continue;if(o)N(e,s.normalize("NFC"));else{let a=s.normalize("NFC").replace(/\s+/g," ");if(a===""||a===" "&&(e.text===""||e.text.endsWith(" ")||e.text.endsWith(`
`)))continue;N(e,a)}}else if(n.nodeType===1){if(n.tagName==="BR"){w(e,`
`);continue}D(n,e,o)}i&&w(e,`

`),t.tagName==="HR"&&w(e,`

`)}function N(t,e){t.text+=e}function w(t,e){if(!t.text.endsWith(e)){if(e===`

`&&t.text.endsWith(`
`)){t.text=t.text.replace(/\n+$/,"")+`

`;return}e===`
`&&t.text.endsWith(`

`)||(t.text+=e)}}function G(t){let e=[...t.querySelectorAll("[data-signable]")],r=e.filter(o=>!e.some(n=>n!==o&&n.contains(o))),i={text:""};for(let o of r)D(o,i,!1);return i.text.replace(/^\s+/,"").replace(/\s+$/,"")}function u(t,e){return t.querySelector(`meta[name="${$(e)}"]`)?.getAttribute("content")||""}function E(t,e){return t.querySelector(`meta[property="${$(e)}"]`)?.getAttribute("content")||""}function z(t,e){return t.querySelector(`meta[itemprop="${$(e)}"]`)?.getAttribute("content")||""}function R(t,e){return t.querySelector(`link[rel="${$(e)}"]`)?.getAttribute("href")||""}function $(t){return String(t).replace(/[^a-zA-Z0-9:_\-/]/g,"")}function j(t){if(!t)return"";try{let e=new URL(t);e.search="",e.hash="";let r=`${e.protocol}//${e.hostname.toLowerCase()}`;return e.port&&(r+=`:${e.port}`),r+=e.pathname,r}catch{return t}}function O(t){if(!t)return"";let e=String(t).match(/^(\d{4}-\d{2}-\d{2})/);return e?e[1]:""}function K(t){return E(t,"og:title")||t.title||""}function W(t){let e=u(t,"keywords");return e?e.split(",").map(r=>r.trim()).filter(Boolean):[]}function X(t){return R(t,"license")||u(t,"license")}function H(t,e={}){let r=e.url??t?.location?.href??"",i=O(E(t,"article:published_time")),o=O(u(t,"last-modified")||E(t,"article:modified_time"));return{"@context":B,"@version":1,url:j(r),title:K(t),author:u(t,"author"),authorUrl:E(t,"article:author")||R(t,"author"),published:i,modified:o,version:z(t,"version"),keywords:W(t),topic:u(t,"vb:topic"),provenance:u(t,"vb:provenance"),review:u(t,"vb:review"),status:u(t,"vb:status"),license:X(t),content:G(t)}}function P(t){return JSON.stringify(t)}var C=class t extends y{setup(){this.hasAttribute("auto")&&this.#l(),this.#t(),this.#r(),this.#i(),this.#o()}#t(){for(let e of this.querySelectorAll("time[data-relative]")){let r=e.getAttribute("datetime");if(!r)continue;let i=t.#n(new Date(r));i&&(e.textContent=i)}}static#n(e){let i=Date.now()-e.getTime();if(i<0)return null;let o=Math.floor(i/1e3),n=Math.floor(o/60),s=Math.floor(n/60),a=Math.floor(s/24);return a>365?`${Math.floor(a/365)} year${Math.floor(a/365)!==1?"s":""} ago`:a>30?`${Math.floor(a/30)} month${Math.floor(a/30)!==1?"s":""} ago`:a>0?`${a} day${a!==1?"s":""} ago`:s>0?`${s} hour${s!==1?"s":""} ago`:n>0?`${n} minute${n!==1?"s":""} ago`:"just now"}#r(){let e=this.querySelector("[data-reading-time]");if(!e)return;let r=document.querySelectorAll("[data-signable]");if(!r.length)return;let i=0;for(let n of r){let s=n.textContent?.trim()||"";i+=s.split(/\s+/).filter(Boolean).length}let o=Math.max(1,Math.ceil(i/200));e.textContent=`~${o} min`}#i(){let e=!!document.querySelector('meta[name="vb:provenance"], meta[name="author"]'),r=e?"declared":"undeclared",i=this.querySelector(".page-info-badge");i&&i.setAttribute("data-trust",r),this.dispatchEvent(new CustomEvent("page-info:verified",{detail:{status:r,tier:e?1:0},bubbles:!0}))}async#o(){let r=document.querySelector('meta[name="vb:signature"]')?.content;if(!r)return;let i=document.querySelector('meta[name="vb:signature-algorithm"]')?.content;if(i&&i!=="ECDSA-P256-SHA256"){this.#e("failed",{reason:`unsupported-algorithm:${i}`});return}let o=document.querySelector('link[rel="author-key"]')?.getAttribute("href");if(!o){this.#e("failed",{reason:"missing-author-key"});return}let n;try{let c=new URL(o,document.baseURI),l=await fetch(c,{credentials:"omit"});if(!l.ok)throw new Error(`status ${l.status}`);let d=await l.json(),h={kty:d.kty,crv:d.crv,x:d.x,y:d.y,use:d.use||"sig",key_ops:["verify"]};n=await crypto.subtle.importKey("jwk",h,{name:"ECDSA",namedCurve:"P-256"},!1,["verify"])}catch(c){this.#e("key-unavailable",{reason:c.message});return}let s;try{let c=document.querySelector('link[rel="canonical"]')?.href||document.location.href;s=P(H(document,{url:c}))}catch(c){this.#e("failed",{reason:`canonicalize:${c.message}`});return}let a;try{let c=new TextEncoder().encode(s),l=Uint8Array.from(atob(r),d=>d.charCodeAt(0));a=await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},n,l,c)}catch(c){this.#e("failed",{reason:`verify:${c.message}`});return}this.#e(a?"verified":"failed",{reason:a?"ok":"mismatch"})}#e(e,r={}){let o={undeclared:0,declared:1,"domain-anchored":2,verified:3,failed:-1,"key-unavailable":-2}[e]??0,n=this.querySelector(".page-info-badge");if(n){n.setAttribute("data-trust",e);let s=n.getAttribute("aria-label")||"";e==="verified"&&!s.includes("verified")?n.setAttribute("aria-label",`${s} \u2014 verified`.trim()):e==="failed"?n.setAttribute("aria-label",`${s} \u2014 verification failed`.trim()):e==="key-unavailable"&&n.setAttribute("aria-label",`${s} \u2014 author key unavailable`.trim())}this.dispatchEvent(new CustomEvent("page-info:verified",{detail:{status:e,tier:o,...r},bubbles:!0}))}static#a={human:"Human written","ai-assisted":"Human-written, AI-assisted","ai-generated":"AI-generated",translated:"Translated",synthesized:"Synthesized from sources",migrated:"Migrated content"};static#s={unreviewed:"Unreviewed","fact-checked":"Fact-checked","editor-reviewed":"Editor-reviewed"};static#c={draft:"Draft",published:"Published",archived:"Archived"};static#d(e){if(!e)return"";let r=String(e).trim().split(/\s+/).filter(Boolean);return r.length?r.map(o=>t.#a[o]||o).join(" \xB7 "):""}#l(){let e=f=>document.querySelector(`meta[name="${f}"]`)?.content,r=f=>document.querySelector(`meta[property="${f}"]`)?.content,i=f=>document.querySelector(`meta[itemprop="${f}"]`)?.content,o=f=>document.querySelector(`link[rel="${f}"]`)?.href,n=e("author"),s=r("article:author")||o("author"),a=e("last-modified")||r("article:modified_time"),c=r("article:published_time"),l=e("keywords"),d=e("license"),h=o("license"),p=i("version"),b=e("vb:provenance"),v=e("vb:review"),m=e("vb:status"),S=e("vb:ai-tools"),A=e("vb:topic"),L=e("vb:version-url"),g=t.#d(b),k=t.#s[v]||v||"",T=t.#c[m]||m||"",q=b||S||v||d,I=a||c||p;this.innerHTML=`
      <details>
        <summary>
          ${n?`
            <span class="page-info-author">
              ${s?`<a href="${s}" rel="author">${n}</a>`:n}
            </span>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          `:""}
          ${a?`
            <time datetime="${a}" data-relative>${a}</time>
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
          `:""}
          ${g?`
            <span class="page-info-badge"
                  data-provenance="${b||""}"
                  data-trust="declared"
                  aria-label="Content provenance: ${g}">
              ${g}
            </span>
          `:""}
          ${m&&m!=="published"?`
            <span class="page-info-sep" aria-hidden="true">&middot;</span>
            <span class="page-info-badge" data-status="${m}">${T}</span>
          `:""}
        </summary>
        <div class="page-info-panel">
          ${n?`
            <section>
              <h2 class="page-info-section-heading">Author</h2>
              <p>${s?`<a href="${s}" rel="author">${n}</a>`:n}</p>
            </section>
          `:""}
          ${I?`
            <section>
              <h2 class="page-info-section-heading">History</h2>
              <dl>
                ${c?`<dl-item><dt>Published</dt><dd><time datetime="${c}" data-relative>${c}</time></dd></dl-item>`:""}
                ${a?`<dl-item><dt>Last updated</dt><dd><time datetime="${a}" data-relative>${a}</time></dd></dl-item>`:""}
                ${p?`<dl-item><dt>Version</dt><dd>${L?`<a href="${L}">${p}</a>`:p}</dd></dl-item>`:""}
              </dl>
            </section>
          `:""}
          ${q?`
            <section>
              <h2 class="page-info-section-heading">How this was made</h2>
              <dl>
                ${b?`<dl-item><dt>Authorship</dt><dd>${g}</dd></dl-item>`:""}
                ${S?`<dl-item><dt>AI tools used</dt><dd>${S}</dd></dl-item>`:""}
                ${k?`<dl-item><dt>Review</dt><dd>${k}</dd></dl-item>`:""}
                ${T?`<dl-item><dt>Status</dt><dd>${T}</dd></dl-item>`:""}
                ${d?`<dl-item><dt>License</dt><dd>${h?`<a href="${h}" rel="license">${d}</a>`:d}</dd></dl-item>`:""}
              </dl>
            </section>
          `:""}
          ${l||A?`
            <section>
              <h2 class="page-info-section-heading">Topic</h2>
              <dl>
                ${A?`<dl-item><dt>Subject</dt><dd>${A}</dd></dl-item>`:""}
                ${l?`<dl-item><dt>Keywords</dt><dd>${l}</dd></dl-item>`:""}
              </dl>
            </section>
          `:""}
        </div>
      </details>
    `}};x("page-info",C);export{C as PageInfo};
//# sourceMappingURL=page-info.js.map
