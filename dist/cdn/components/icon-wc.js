function l({basePath:t,set:n,name:e}){return`${t}/${n}/${e}.svg`}function u(t,n=document){let e=t.getAttribute("data-icon-set");if(e)return e;let r=t.closest("[data-icon-set]")?.getAttribute("data-icon-set");return r||n.documentElement.dataset.iconSet||"lucide"}function f(t=document){return t.documentElement.dataset.iconPath||"/cdn/icons"}function m(t){let n=t.getAttribute("data-icon");if(!n){t.style.removeProperty("--vb-icon");return}let e=l({basePath:f(document),set:u(t,document),name:n});t.style.setProperty("--vb-icon",`url("${e}")`)}function d(t=document){for(let n of t.querySelectorAll("[data-icon]"))m(n)}var A=!1;function C(){if(A)return;A=!0,d(),new MutationObserver(n=>{for(let e of n)if(e.type==="attributes"){let r=e.target;r.hasAttribute&&r.hasAttribute("data-icon")&&m(r),e.attributeName==="data-icon-set"&&d(r)}else for(let r of e.addedNodes){if(r.nodeType!==1)continue;let o=r;o.hasAttribute("data-icon")&&m(o),d(o)}}).observe(document.documentElement,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["data-icon","data-icon-set"]})}typeof document<"u"&&C();var S=`
:host {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.5em;
  block-size: 1.5em;
  vertical-align: middle;
  line-height: 1;
  color: inherit;
}

:host([size="xs"]) {
  inline-size: 1em;
  block-size: 1em;
}

:host([size="sm"]) {
  inline-size: 1.25em;
  block-size: 1.25em;
}

:host([size="md"]) {
  inline-size: 1.5em;
  block-size: 1.5em;
}

:host([size="lg"]) {
  inline-size: 2em;
  block-size: 2em;
}

:host([size="xl"]) {
  inline-size: 2.5em;
  block-size: 2.5em;
}

:host([size="2xl"]) {
  inline-size: 3em;
  block-size: 3em;
}

/* Sizing only. Paint (fill/stroke/stroke-width) comes from each file's own
   presentation attributes: Lucide/Tabler/Mage are stroked, Phosphor/Bold are
   filled. Any author rule here, even :where(), would beat those attributes. */
svg {
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

/* Opt-in RTL mirroring for directional glyphs (arrows, chevrons, undo\u2026) */
:host([data-flip-rtl]:dir(rtl)) svg {
  transform: scaleX(-1);
}

/* Error state */
:host([data-error]) {
  opacity: 0.5;
}

/* Hidden state for missing icons */
:host([hidden]) {
  display: none;
}
`;var de=window.matchMedia("(prefers-reduced-motion: reduce)");var E=new Map;function T(t,n,e={}){let r=e.priority??10,o={impl:n,bundle:e.bundle,contract:e.contract,priority:r},s=E.get(t);if(customElements.get(t)){if(!s||s.priority>=r){s&&s.priority===r&&s.impl!==n&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=r){s.priority===r&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}E.set(t,o),customElements.define(t,n)}var O="http://www.w3.org/1999/xhtml",h="http://www.w3.org/2000/svg",P="http://www.w3.org/1998/Math/MathML",_=new Set([O,h,P]),b="user-content-",D=new Set(["script","iframe","frame","frameset","object","embed","applet","portal","fencedframe","form","base","link","meta","noscript","foreignobject","style","xmp","noembed","noframes","plaintext","mglyph","malignmark","annotation-xml"]),M=new Set(["title","desc"]),F=new Set(["animate","set","animatemotion","animatetransform"]),B=new Set(["href","xlink:href","action","formaction","data","codebase","cite","background","longdesc","manifest","to","from","values","by"]),U=new Set(["src","poster","srcset"]),j=new Set(["srcdoc","form","formaction","formmethod","formtarget","formenctype","formnovalidate","action","method","ping"]),q=new Set(["popovertarget","popovertargetaction","commandfor","command","interestfor","autofocus"]),H=new Set(["for","headers","list","aria-labelledby","aria-describedby","aria-controls","aria-owns","aria-flowto","aria-details","aria-errormessage","aria-activedescendant"]),W={"include-file":["trusted","allow-scripts","allow-cross-origin"],"markdown-viewer":["src","sanitize","ping","allow-cross-origin"]},V=new Set(["social-embed","youtube-player","geo-map"]),G=["src","src-dark","data-src","url","endpoint","tile-url","data-versions"],K=new Set(["audio-player","video-player","image-map","brand-mark"]);function X(t){return String(t).replace(/[\u0000- \u007f-\u009f]/g,"").toLowerCase()}function k(t,n=!1){let e=X(t);return n?/(^|,)(javascript|vbscript|livescript):/.test(e)?!0:/(^|,)data:/.test(e)?e.split(/(?=data:)/).filter(o=>o.startsWith("data:")).some(o=>!/^data:(image|audio|video|font)\//.test(o)):!1:/^(javascript|vbscript|livescript|data):/.test(e)}function $(t){let n=String(t).replace(/\/\*[\s\S]*?\*\//g,"").replace(/\\/g,"").replace(/\s+/g,"").toLowerCase();return/expression\(|javascript:|vbscript:|-moz-binding|behavior:|@import|position:fixed/.test(n)}var Y=t=>String(t.localName||t.tagName||"").toLowerCase(),J=t=>t.startsWith(b)?t:b+t;function Q(t,n){if(D.has(n))return!0;let e=t.namespaceURI;return!!(e&&!_.has(e)||n==="title"&&e!==h||M.has(n)&&e===h&&t.children?.length||F.has(n)&&(t.getAttribute("attributeName")||t.getAttribute("attributename")||"").toLowerCase().includes("href"))}function Z(t,n){for(let e of[...t.attributes]){let r=e.name.toLowerCase();if(r.startsWith("on")||j.has(r)||!n.keepIds&&q.has(r)){t.removeAttribute(e.name);continue}if(r==="style"){(!n.keepStyle||$(e.value))&&t.removeAttribute(e.name);continue}if((r==="id"||r==="name")&&!n.keepIds){let o=J(e.value);r==="id"?n.ids.set(e.value,o):n.ids.set(`name:${e.value}`,o),t.setAttribute(e.name,o);continue}if(B.has(r)||r.endsWith(":href")){k(e.value,!1)&&t.removeAttribute(e.name);continue}U.has(r)&&k(e.value,!0)&&t.removeAttribute(e.name)}}function ee(t,n){let e=(t.getAttribute("type")||"").toLowerCase();n==="button"&&e!=="button"&&t.setAttribute("type","button"),n==="input"&&/^(submit|reset|image)$/.test(e)&&t.setAttribute("type","button")}function te(t,n){for(let e of t)for(let r of[...e.attributes]){let o=r.name.toLowerCase(),s=r.value;if((o==="href"||o.endsWith(":href"))&&s.startsWith("#")){let i=ne(s.slice(1));n.has(i)&&e.setAttribute(r.name,`#${n.get(i)}`)}else if(o==="usemap"&&s.startsWith("#")){let i=n.get(`name:${s.slice(1)}`);i?e.setAttribute(r.name,`#${i}`):e.removeAttribute(r.name)}else if(H.has(o)){let i=s.split(/\s+/).filter(Boolean).map(a=>n.get(a)||(a.startsWith(b)?a:null)).filter(Boolean);i.length?e.setAttribute(r.name,i.join(" ")):e.removeAttribute(r.name)}else s.includes("url(#")&&e.setAttribute(r.name,s.replace(/url\(#([^)]+)\)/g,(i,a)=>n.has(a)?`url(#${n.get(a)})`:i))}}function ne(t){try{return decodeURIComponent(t)}catch{return t}}function N(t){let n=t.childNodes;if(n)for(let e of[...n])e.nodeType===8?e.remove():(e.nodeType===1||e.nodeType===11)&&N(e)}function L(t,n){N(t);let e=[...t.querySelectorAll("*")];n.includeRoot&&e.unshift(t);let r=new Map,o=[],s={...n,ids:r};for(let i of e){if(!oe(i,t))continue;let a=Y(i);if(n.svgOnly&&(M.has(a)||a==="style")){if(a==="style"&&$(i.textContent||"")){i.remove();continue}}else if(Q(i,a)){i.remove();continue}if(!n.keepIds&&!n.svgOnly&&V.has(a)){re(i);continue}if(a==="template"){let c=i.content;c&&L(c,{...n,includeRoot:!1})}Z(i,s),n.keepIds||ee(i,a);let w=W[a];if(w)for(let c of w)i.removeAttribute(c);if(a==="include-file"&&!n.allowIncludeFile&&i.removeAttribute("src"),!n.keepIds&&!n.svgOnly&&a.includes("-")&&a!=="include-file"&&!K.has(a))for(let c of G)i.removeAttribute(c);o.push(i)}!n.keepIds&&r.size&&te(o,r)}function re(t){let n=t.parentNode;if(n){for(let e of[...t.childNodes])n.insertBefore(e,t);t.remove()}}function oe(t,n){let e=t;for(;e;){if(e===n)return!0;e=e.parentNode??e.parent??null}return!1}function x(t){return!t||typeof t!="object"||!("attributes"in t)||L(t,{includeRoot:!0,keepIds:!0,keepStyle:!0,svgOnly:!0}),t}var y="lucide",ie=new Set([y,"custom"]),I=new Map,p=new Set,g=new Map,z=new Map;function se(t,n){let e=`${t}/${n}`,r=z.get(e);return r||(r=fetch(`${e}.json`).then(o=>o.ok?o.json():null).then(o=>Array.isArray(o)?new Set(o.map(String)):null).catch(()=>null),z.set(e,r)),r}function ae(t){if(!t.includes("<svg"))return null;let n=new DOMParser().parseFromString(t,"image/svg+xml"),e=n.documentElement;return!e||e.localName!=="svg"||n.querySelector("parsererror")?null:(x(e),e.removeAttribute("width"),e.removeAttribute("height"),document.importNode(e,!0))}function R(t){let n=I.get(t);if(n)return Promise.resolve(n);if(p.has(t))return Promise.reject(new Error(`Icon not found: ${t}`));let e=g.get(t);return e||(e=fetch(t).then(async r=>{if(!r.ok)throw p.add(t),new Error(`Icon not found: ${t}`);let o=ae(await r.text());if(!o)throw p.add(t),new Error(`Invalid SVG: ${t}`);return I.set(t,o),o}).finally(()=>g.delete(t)),g.set(t,e)),e}async function ce(t,n,e){if(n!==y){let r=ie.has(n)?null:await se(t,n);if(!r||r.has(e))try{return await R(l({basePath:t,set:n,name:e}))}catch{}}return R(l({basePath:t,set:y,name:e}))}var v=class t extends HTMLElement{static#r=new Set;static#o=null;static#f(){t.#o||(t.#o=new MutationObserver(n=>{let e=document.documentElement;for(let r of n){let o=r.target;for(let s of t.#r)(o===e||o.contains(s))&&s.#c()}}),t.#o.observe(document.documentElement,{subtree:!0,attributes:!0,attributeFilter:["data-icon-set","data-icon-path"]}))}static get observedAttributes(){return["name","set","label","base-path"]}#i=0;#s="";#e="";#a="";#t=null;constructor(){super();let n=this.attachShadow({mode:"open"});n.innerHTML=`<style>${S}</style><slot></slot>`}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||u(this)}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||f()}get iconPath(){return l({basePath:this.basePath,set:this.set,name:this.name})}connectedCallback(){t.#r.add(this),t.#f(),this.#c(),this.#t=()=>{let n=this.#n();n&&(n.style.stroke="none",requestAnimationFrame(()=>{n.style.stroke=""}))},window.addEventListener("vb:theme-change",this.#t),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),t.#r.delete(this),this.#t&&(window.removeEventListener("vb:theme-change",this.#t),this.#t=null)}attributeChangedCallback(n,e,r){e===r||!this.isConnected||(n==="label"?this.#l():this.#c())}#n(){return this.shadowRoot?.querySelector("svg")??null}#c(){let n=this.name,e=`${this.basePath}|${this.set}|${n}`;if(e===this.#s){this.#l();return}if(e===this.#e||e===this.#a)return;let r=++this.#i;if(this.#e=e,this.#a="",!n){this.#e="",this.#u("No icon name specified",e);return}let o=this.basePath,s=this.set;ce(o,s,n).then(i=>{r===this.#i&&(this.#e="",this.#d(i.cloneNode(!0),e))},i=>{r===this.#i&&(this.#e="",this.#u(i.message,e))})}#d(n,e){let r=this.shadowRoot,o=this.#n()||r.querySelector("slot");o?o.replaceWith(n):r.append(n),this.#s=e,this.removeAttribute("data-error"),this.#l()}#l(){let n=this.#n();if(!n)return;let e=this.label;e?(n.setAttribute("role","img"),n.setAttribute("aria-label",e),n.removeAttribute("aria-hidden")):(n.removeAttribute("role"),n.removeAttribute("aria-label"),n.setAttribute("aria-hidden","true"))}#u(n,e){this.#a=e,this.setAttribute("data-error","true"),console.warn(`icon-wc: ${n}`);let r=this.#n();r&&r.replaceWith(document.createElement("slot")),this.#s=""}};T("icon-wc",v);export{v as IconWc};
//# sourceMappingURL=icon-wc.js.map
