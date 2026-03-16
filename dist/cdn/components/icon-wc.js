var c=`
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
`;var u=window.matchMedia("(prefers-reduced-motion: reduce)");var l=new Map;function d(o,e,s={}){let i=s.priority??10,t={impl:e,bundle:s.bundle,contract:s.contract,priority:i},n=l.get(o);if(customElements.get(o)){if(!n||n.priority>=i){n&&n.priority===i&&n.impl!==e&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${s.bundle}".`);return}console.warn(`[VB Bundle] Tag <${o}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${s.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=i){n.priority===i&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${n.bundle}". Skipping "${s.bundle}" (first wins at equal priority).`);return}l.set(o,t),customElements.define(o,e)}var r=new Map,a=class o extends HTMLElement{static#e=new Set;static#t=null;static#i(){o.#t||(o.#t=new MutationObserver(e=>{for(let s of e)if(s.attributeName==="data-icon-set")for(let i of o.#e)i.hasAttribute("set")||(i.render(),i.loadIcon())}),o.#t?.observe(document.documentElement,{attributes:!0,attributeFilter:["data-icon-set"]}))}static get observedAttributes(){return["name","set","size","label"]}constructor(){super(),this.attachShadow({mode:"open"})}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||document.documentElement.dataset.iconSet||"lucide"}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||document.documentElement.dataset.iconPath||"/src/icons"}get iconPath(){return`${this.basePath}/${this.set}/${this.name}.svg`}render(){this.shadowRoot.innerHTML=`
            <style>${c}</style>
            <slot></slot>
        `}async loadIcon(){if(!this.name){this.setError("No icon name specified");return}let e=`${this.set}/${this.name}`;if(r.has(e)){this.displayIcon(r.get(e));return}try{let s=await this.#s(this.set);r.set(e,s),this.displayIcon(s)}catch(s){let i="lucide";if(this.set!==i){let t=`${i}/${this.name}`;if(r.has(t)){this.displayIcon(r.get(t));return}try{let n=await this.#s(i);r.set(t,n),this.displayIcon(n);return}catch{}}this.setError(s.message)}}async#s(e){let s=`${this.basePath}/${e}/${this.name}.svg`,i=await fetch(s);if(!i.ok)throw new Error(`Icon not found: ${this.name}`);let t=await i.text();if(!t.includes("<svg"))throw new Error(`Invalid SVG: ${this.name}`);return t}displayIcon(e){let t=new DOMParser().parseFromString(e,"image/svg+xml").querySelector("svg");if(!t){this.setError("Invalid SVG content");return}t.removeAttribute("width"),t.removeAttribute("height"),this.label?(t.setAttribute("role","img"),t.setAttribute("aria-label",this.label)):t.setAttribute("aria-hidden","true"),this.removeAttribute("data-error");let n=this.shadowRoot?.querySelector("slot");n&&n.replaceWith(t)}setError(e){this.setAttribute("data-error","true"),console.warn(`icon-wc: ${e}`);let s=this.shadowRoot?.querySelector("slot");s&&(s.textContent="")}connectedCallback(){o.#e.add(this),o.#i(),this.render(),this.loadIcon(),this._onThemeChange=()=>{let e=this.shadowRoot?.querySelector("svg");e&&(e.style.stroke="none",requestAnimationFrame(()=>{e.style.stroke=""}))},window.addEventListener("theme-change",this._onThemeChange),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),o.#e.delete(this),this._onThemeChange&&window.removeEventListener("theme-change",this._onThemeChange)}attributeChangedCallback(e,s,i){if(s!==i&&this.isConnected){if(e==="name"||e==="set")this.render(),this.loadIcon();else if(e==="label"){let t=this.shadowRoot?.querySelector("svg");t&&(i?(t.setAttribute("role","img"),t.setAttribute("aria-label",i)):(t.removeAttribute("role"),t.setAttribute("aria-hidden","true")))}}}};d("icon-wc",a);export{a as IconWc};
//# sourceMappingURL=icon-wc.js.map
