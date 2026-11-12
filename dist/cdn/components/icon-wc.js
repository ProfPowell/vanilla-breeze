var A=null;function f(){return O()}function O(){if(typeof window<"u"&&window.__VB_THEME_BASE)return String(window.__VB_THEME_BASE).replace(/\/$/,"");if(A)return A;if(typeof document<"u"){let t=document.querySelectorAll('script[src*="vanilla-breeze"]');for(let n of t){let e=n.getAttribute("src");if(e){let r=e.lastIndexOf("/");if(r!==-1)return e.slice(0,r)}}}return"/cdn"}function u({basePath:t,set:n,name:e}){return`${t}/${n}/${e}.svg`}function l(t,n=document){let e=t.getAttribute("data-icon-set");if(e)return e;let r=t.closest("[data-icon-set]")?.getAttribute("data-icon-set");return r||n.documentElement.dataset.iconSet||"lucide"}function d(t=document){let n=t.documentElement.dataset.iconPath;if(n)return n;let e=`${f()}/icons`;try{return new URL(e,t.baseURI).href}catch{return e}}function m(t){let n=t.getAttribute("data-icon");if(!n){t.style.removeProperty("--vb-icon");return}let e=u({basePath:d(document),set:l(t,document),name:n});t.style.setProperty("--vb-icon",`url("${e}")`)}function h(t=document){for(let n of t.querySelectorAll("[data-icon]"))m(n)}var E=!1;function B(){if(E)return;E=!0,h(),new MutationObserver(n=>{for(let e of n)if(e.type==="attributes"){let r=e.target;r.hasAttribute&&r.hasAttribute("data-icon")&&m(r),e.attributeName==="data-icon-set"&&h(r)}else for(let r of e.addedNodes){if(r.nodeType!==1)continue;let o=r;o.hasAttribute("data-icon")&&m(o),h(o)}}).observe(document.documentElement,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["data-icon","data-icon-set"]})}typeof document<"u"&&B();var T=`
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
`;var ve=window.matchMedia("(prefers-reduced-motion: reduce)");var $=new Map;function k(t,n,e={}){let r=e.priority??10,o={impl:n,bundle:e.bundle,contract:e.contract,priority:r},s=$.get(t);if(customElements.get(t)){if(!s||s.priority>=r){s&&s.priority===r&&s.impl!==n&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${t}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=r){s.priority===r&&console.warn(`[VB Bundle] Tag <${t}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}$.set(t,o),customElements.define(t,n)}var F="http://www.w3.org/1999/xhtml",b="http://www.w3.org/2000/svg",H="http://www.w3.org/1998/Math/MathML",j=new Set([F,b,H]),p="user-content-",q=new Set(["script","iframe","frame","frameset","object","embed","applet","portal","fencedframe","form","base","link","meta","noscript","foreignobject","style","xmp","noembed","noframes","plaintext","mglyph","malignmark","annotation-xml"]),L=new Set(["title","desc"]),U=new Set(["animate","set","animatemotion","animatetransform"]),D=new Set(["href","xlink:href","action","formaction","data","codebase","cite","background","longdesc","manifest","to","from","values","by"]),V=new Set(["src","poster","srcset"]),W=new Set(["srcdoc","form","formaction","formmethod","formtarget","formenctype","formnovalidate","action","method","ping"]),G=new Set(["popovertarget","popovertargetaction","commandfor","command","interestfor","autofocus"]),K=new Set(["for","headers","list","aria-labelledby","aria-describedby","aria-controls","aria-owns","aria-flowto","aria-details","aria-errormessage","aria-activedescendant"]),N={"include-file":["trusted","allow-scripts","allow-cross-origin"],"markdown-viewer":["src","sanitize","ping","allow-cross-origin"]},X=new Set(["social-embed","youtube-player","geo-map"]),Y=["src","src-dark","data-src","url","endpoint","tile-url","data-versions"],J=new Set(["audio-player","video-player","image-map","brand-mark"]);function Q(t){return String(t).replace(/[\u0000- \u007f-\u009f]/g,"").toLowerCase()}function M(t,n=!1){let e=Q(t);return n?/(^|,)(javascript|vbscript|livescript):/.test(e)?!0:/(^|,)data:/.test(e)?e.split(/(?=data:)/).filter(o=>o.startsWith("data:")).some(o=>!/^data:(image|audio|video|font)\//.test(o)):!1:/^(javascript|vbscript|livescript|data):/.test(e)}function x(t){let n=String(t).replace(/\/\*[\s\S]*?\*\//g,"").replace(/\\/g,"").replace(/\s+/g,"").toLowerCase();return/expression\(|javascript:|vbscript:|-moz-binding|behavior:|@import|position:fixed/.test(n)}var Z=t=>String(t.localName||t.tagName||"").toLowerCase(),ee=t=>t.startsWith(p)?t:p+t;function te(t,n){if(q.has(n))return!0;let e=t.namespaceURI;return!!(e&&!j.has(e)||n==="title"&&e!==b||L.has(n)&&e===b&&t.children?.length||U.has(n)&&(t.getAttribute("attributeName")||t.getAttribute("attributename")||"").toLowerCase().includes("href"))}function ne(t,n){for(let e of[...t.attributes]){let r=e.name.toLowerCase();if(r.startsWith("on")||W.has(r)||!n.keepIds&&G.has(r)){t.removeAttribute(e.name);continue}if(r==="style"){(!n.keepStyle||x(e.value))&&t.removeAttribute(e.name);continue}if((r==="id"||r==="name")&&!n.keepIds){let o=ee(e.value);r==="id"?n.ids.set(e.value,o):n.ids.set(`name:${e.value}`,o),t.setAttribute(e.name,o);continue}if(D.has(r)||r.endsWith(":href")){M(e.value,!1)&&t.removeAttribute(e.name);continue}V.has(r)&&M(e.value,!0)&&t.removeAttribute(e.name)}}function re(t,n){let e=(t.getAttribute("type")||"").toLowerCase();n==="button"&&e!=="button"&&t.setAttribute("type","button"),n==="input"&&/^(submit|reset|image)$/.test(e)&&t.setAttribute("type","button")}function oe(t,n){for(let e of t)for(let r of[...e.attributes]){let o=r.name.toLowerCase(),s=r.value;if((o==="href"||o.endsWith(":href"))&&s.startsWith("#")){let i=ie(s.slice(1));n.has(i)&&e.setAttribute(r.name,`#${n.get(i)}`)}else if(o==="usemap"&&s.startsWith("#")){let i=n.get(`name:${s.slice(1)}`);i?e.setAttribute(r.name,`#${i}`):e.removeAttribute(r.name)}else if(K.has(o)){let i=s.split(/\s+/).filter(Boolean).map(a=>n.get(a)||(a.startsWith(p)?a:null)).filter(Boolean);i.length?e.setAttribute(r.name,i.join(" ")):e.removeAttribute(r.name)}else s.includes("url(#")&&e.setAttribute(r.name,s.replace(/url\(#([^)]+)\)/g,(i,a)=>n.has(a)?`url(#${n.get(a)})`:i))}}function ie(t){try{return decodeURIComponent(t)}catch{return t}}function C(t){let n=t.childNodes;if(n)for(let e of[...n])e.nodeType===8?e.remove():(e.nodeType===1||e.nodeType===11)&&C(e)}function I(t,n){C(t);let e=[...t.querySelectorAll("*")];n.includeRoot&&e.unshift(t);let r=new Map,o=[],s={...n,ids:r};for(let i of e){if(!ae(i,t))continue;let a=Z(i);if(n.svgOnly&&(L.has(a)||a==="style")){if(a==="style"&&x(i.textContent||"")){i.remove();continue}}else if(te(i,a)){i.remove();continue}if(!n.keepIds&&!n.svgOnly&&X.has(a)){se(i);continue}if(a==="template"){let c=i.content;c&&I(c,{...n,includeRoot:!1})}ne(i,s),n.keepIds||re(i,a);let S=N[a];if(S)for(let c of S)i.removeAttribute(c);if(a==="include-file"&&!n.allowIncludeFile&&i.removeAttribute("src"),!n.keepIds&&!n.svgOnly&&a.includes("-")&&a!=="include-file"&&!J.has(a))for(let c of Y)i.removeAttribute(c);o.push(i)}!n.keepIds&&r.size&&oe(o,r)}function se(t){let n=t.parentNode;if(n){for(let e of[...t.childNodes])n.insertBefore(e,t);t.remove()}}function ae(t,n){let e=t;for(;e;){if(e===n)return!0;e=e.parentNode??e.parent??null}return!1}function P(t){return!t||typeof t!="object"||!("attributes"in t)||I(t,{includeRoot:!0,keepIds:!0,keepStyle:!0,svgOnly:!0}),t}var y="lucide",ce=new Set([y,"custom"]),z=new Map,g=new Set,v=new Map,R=new Map;function ue(t,n){let e=`${t}/${n}`,r=R.get(e);return r||(r=fetch(`${e}.json`).then(o=>o.ok?o.json():null).then(o=>Array.isArray(o)?new Set(o.map(String)):null).catch(()=>null),R.set(e,r)),r}function le(t){if(!t.includes("<svg"))return null;let n=new DOMParser().parseFromString(t,"image/svg+xml"),e=n.documentElement;return!e||e.localName!=="svg"||n.querySelector("parsererror")?null:(P(e),e.removeAttribute("width"),e.removeAttribute("height"),document.importNode(e,!0))}function _(t){let n=z.get(t);if(n)return Promise.resolve(n);if(g.has(t))return Promise.reject(new Error(`Icon not found: ${t}`));let e=v.get(t);return e||(e=fetch(t).then(async r=>{if(!r.ok)throw g.add(t),new Error(`Icon not found: ${t}`);let o=le(await r.text());if(!o)throw g.add(t),new Error(`Invalid SVG: ${t}`);return z.set(t,o),o}).finally(()=>v.delete(t)),v.set(t,e)),e}async function de(t,n,e){if(n!==y){let r=ce.has(n)?null:await ue(t,n);if(!r||r.has(e))try{return await _(u({basePath:t,set:n,name:e}))}catch{}}return _(u({basePath:t,set:y,name:e}))}var w=class t extends HTMLElement{static#r=new Set;static#o=null;static#d(){t.#o||(t.#o=new MutationObserver(n=>{let e=document.documentElement;for(let r of n){let o=r.target;for(let s of t.#r)(o===e||o.contains(s))&&s.#c()}}),t.#o.observe(document.documentElement,{subtree:!0,attributes:!0,attributeFilter:["data-icon-set","data-icon-path"]}))}static get observedAttributes(){return["name","set","label","base-path"]}#i=0;#s="";#e="";#a="";#t=null;constructor(){super();let n=this.attachShadow({mode:"open"});n.innerHTML=`<style>${T}</style><slot></slot>`}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||l(this)}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||d()}get iconPath(){return u({basePath:this.basePath,set:this.set,name:this.name})}connectedCallback(){t.#r.add(this),t.#d(),this.#c(),this.#t=()=>{let n=this.#n();n&&(n.style.stroke="none",requestAnimationFrame(()=>{n.style.stroke=""}))},window.addEventListener("vb:theme-change",this.#t),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),t.#r.delete(this),this.#t&&(window.removeEventListener("vb:theme-change",this.#t),this.#t=null)}attributeChangedCallback(n,e,r){e===r||!this.isConnected||(n==="label"?this.#u():this.#c())}#n(){return this.shadowRoot?.querySelector("svg")??null}#c(){let n=this.name,e=`${this.basePath}|${this.set}|${n}`;if(e===this.#s){this.#u();return}if(e===this.#e||e===this.#a)return;let r=++this.#i;if(this.#e=e,this.#a="",!n){this.#e="",this.#l("No icon name specified",e);return}let o=this.basePath,s=this.set;de(o,s,n).then(i=>{r===this.#i&&(this.#e="",this.#f(i.cloneNode(!0),e))},i=>{r===this.#i&&(this.#e="",this.#l(i.message,e))})}#f(n,e){let r=this.shadowRoot,o=this.#n()||r.querySelector("slot");o?o.replaceWith(n):r.append(n),this.#s=e,this.removeAttribute("data-error"),this.#u()}#u(){let n=this.#n();if(!n)return;let e=this.label;e?(n.setAttribute("role","img"),n.setAttribute("aria-label",e),n.removeAttribute("aria-hidden")):(n.removeAttribute("role"),n.removeAttribute("aria-label"),n.setAttribute("aria-hidden","true"))}#l(n,e){this.#a=e,this.setAttribute("data-error","true"),console.warn(`icon-wc: ${n}`);let r=this.#n();r&&r.replaceWith(document.createElement("slot")),this.#s=""}};k("icon-wc",w);export{w as IconWc};
//# sourceMappingURL=icon-wc.js.map
