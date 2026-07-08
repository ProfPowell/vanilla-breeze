function u({basePath:o,set:n,name:e}){return`${o}/${n}/${e}.svg`}function h(o,n=document){let e=o.getAttribute("data-icon-set");if(e)return e;let t=o.closest("[data-icon-set]")?.getAttribute("data-icon-set");return t||n.documentElement.dataset.iconSet||"lucide"}function m(o=document){return o.documentElement.dataset.iconPath||"/cdn/icons"}function l(o){let n=o.getAttribute("data-icon");if(!n){o.style.removeProperty("--vb-icon");return}let e=u({basePath:m(document),set:h(o,document),name:n});o.style.setProperty("--vb-icon",`url("${e}")`)}function a(o=document){for(let n of o.querySelectorAll("[data-icon]"))l(n)}var f=!1;function y(){if(f)return;f=!0,a(),new MutationObserver(n=>{for(let e of n)if(e.type==="attributes"){let t=e.target;t.hasAttribute&&t.hasAttribute("data-icon")&&l(t),e.attributeName==="data-icon-set"&&a(t)}else for(let t of e.addedNodes){if(t.nodeType!==1)continue;let i=t;i.hasAttribute("data-icon")&&l(i),a(i)}}).observe(document.documentElement,{subtree:!0,childList:!0,attributes:!0,attributeFilter:["data-icon","data-icon-set"]})}typeof document<"u"&&y();var b=`
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

svg {
  inline-size: 100%;
  block-size: 100%;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

/* Error state */
:host([data-error]) {
  opacity: 0.5;
}

/* Hidden state for missing icons */
:host([hidden]) {
  display: none;
}
`;var $=window.matchMedia("(prefers-reduced-motion: reduce)");var g=new Map;function p(o,n,e={}){let t=e.priority??10,i={impl:n,bundle:e.bundle,contract:e.contract,priority:t},r=g.get(o);if(customElements.get(o)){if(!r||r.priority>=t){r&&r.priority===t&&r.impl!==n&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${r.bundle}" (priority ${r.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${o}> defined by "${r.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(r&&r.priority>=t){r.priority===t&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${r.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}g.set(o,i),customElements.define(o,n)}var s=new Map,c=new Map,d=class o extends HTMLElement{static#e=new Set;static#t=null;static#o(){o.#t||(o.#t=new MutationObserver(n=>{for(let e of n)if(e.attributeName==="data-icon-set")for(let t of o.#e)t.hasAttribute("set")||(t.render(),t.loadIcon())}),o.#t?.observe(document.documentElement,{attributes:!0,attributeFilter:["data-icon-set"]}))}static get observedAttributes(){return["name","set","size","label"]}constructor(){super(),this.attachShadow({mode:"open"})}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||document.documentElement.dataset.iconSet||"lucide"}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||document.documentElement.dataset.iconPath||"/cdn/icons"}get iconPath(){return`${this.basePath}/${this.set}/${this.name}.svg`}render(){this.shadowRoot.innerHTML=`
            <style>${b}</style>
            <slot></slot>
        `}async loadIcon(){if(!this.name){this.setError("No icon name specified");return}let n=`${this.set}/${this.name}`;if(s.has(n)){this.displayIcon(s.get(n));return}try{let e=await this.#n(this.set,n);this.displayIcon(e)}catch(e){let t="lucide";if(this.set!==t){let i=`${t}/${this.name}`;if(s.has(i)){this.displayIcon(s.get(i));return}try{let r=await this.#n(t,i);this.displayIcon(r);return}catch{}}this.setError(e.message)}}async#n(n,e){return c.has(e)||c.set(e,this.#i(n).then(t=>(s.set(e,t),c.delete(e),t)).catch(t=>{throw c.delete(e),t})),c.get(e)}async#i(n){let e=`${this.basePath}/${n}/${this.name}.svg`,t=await fetch(e);if(!t.ok)throw new Error(`Icon not found: ${this.name}`);let i=await t.text();if(!i.includes("<svg"))throw new Error(`Invalid SVG: ${this.name}`);return i}displayIcon(n){let i=new DOMParser().parseFromString(n,"image/svg+xml").querySelector("svg");if(!i){this.setError("Invalid SVG content");return}i.removeAttribute("width"),i.removeAttribute("height"),this.label?(i.setAttribute("role","img"),i.setAttribute("aria-label",this.label)):i.setAttribute("aria-hidden","true"),this.removeAttribute("data-error");let r=this.shadowRoot?.querySelector("slot");r&&r.replaceWith(i)}setError(n){this.setAttribute("data-error","true"),console.warn(`icon-wc: ${n}`);let e=this.shadowRoot?.querySelector("slot");e&&(e.textContent="")}connectedCallback(){o.#e.add(this),o.#o(),this.render(),this.loadIcon(),this._onThemeChange=()=>{let n=this.shadowRoot?.querySelector("svg");n&&(n.style.stroke="none",requestAnimationFrame(()=>{n.style.stroke=""}))},window.addEventListener("vb:theme-change",this._onThemeChange),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),o.#e.delete(this),this._onThemeChange&&window.removeEventListener("vb:theme-change",this._onThemeChange)}attributeChangedCallback(n,e,t){if(e!==t&&this.isConnected){if(n==="name"||n==="set")this.render(),this.loadIcon();else if(n==="label"){let i=this.shadowRoot?.querySelector("svg");i&&(t?(i.setAttribute("role","img"),i.setAttribute("aria-label",t)):(i.removeAttribute("role"),i.setAttribute("aria-hidden","true")))}}}};p("icon-wc",d);export{d as IconWc};
//# sourceMappingURL=icon-wc.js.map
