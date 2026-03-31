var l=`
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
`;var m=window.matchMedia("(prefers-reduced-motion: reduce)");var d=new Map;function h(o,i,e={}){let t=e.priority??10,s={impl:i,bundle:e.bundle,contract:e.contract,priority:t},n=d.get(o);if(customElements.get(o)){if(!n||n.priority>=t){n&&n.priority===t&&n.impl!==i&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${n.bundle}" (priority ${n.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${o}> defined by "${n.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(n&&n.priority>=t){n.priority===t&&console.warn(`[VB Bundle] Tag <${o}> already registered by "${n.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}d.set(o,s),customElements.define(o,i)}var r=new Map,a=new Map,c=class o extends HTMLElement{static#e=new Set;static#t=null;static#s(){o.#t||(o.#t=new MutationObserver(i=>{for(let e of i)if(e.attributeName==="data-icon-set")for(let t of o.#e)t.hasAttribute("set")||(t.render(),t.loadIcon())}),o.#t?.observe(document.documentElement,{attributes:!0,attributeFilter:["data-icon-set"]}))}static get observedAttributes(){return["name","set","size","label"]}constructor(){super(),this.attachShadow({mode:"open"})}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||document.documentElement.dataset.iconSet||"lucide"}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||document.documentElement.dataset.iconPath||"/cdn/icons"}get iconPath(){return`${this.basePath}/${this.set}/${this.name}.svg`}render(){this.shadowRoot.innerHTML=`
            <style>${l}</style>
            <slot></slot>
        `}async loadIcon(){if(!this.name){this.setError("No icon name specified");return}let i=`${this.set}/${this.name}`;if(r.has(i)){this.displayIcon(r.get(i));return}try{let e=await this.#i(this.set,i);this.displayIcon(e)}catch(e){let t="lucide";if(this.set!==t){let s=`${t}/${this.name}`;if(r.has(s)){this.displayIcon(r.get(s));return}try{let n=await this.#i(t,s);this.displayIcon(n);return}catch{}}this.setError(e.message)}}async#i(i,e){return a.has(e)||a.set(e,this.#n(i).then(t=>(r.set(e,t),a.delete(e),t)).catch(t=>{throw a.delete(e),t})),a.get(e)}async#n(i){let e=`${this.basePath}/${i}/${this.name}.svg`,t=await fetch(e);if(!t.ok)throw new Error(`Icon not found: ${this.name}`);let s=await t.text();if(!s.includes("<svg"))throw new Error(`Invalid SVG: ${this.name}`);return s}displayIcon(i){let s=new DOMParser().parseFromString(i,"image/svg+xml").querySelector("svg");if(!s){this.setError("Invalid SVG content");return}s.removeAttribute("width"),s.removeAttribute("height"),this.label?(s.setAttribute("role","img"),s.setAttribute("aria-label",this.label)):s.setAttribute("aria-hidden","true"),this.removeAttribute("data-error");let n=this.shadowRoot?.querySelector("slot");n&&n.replaceWith(s)}setError(i){this.setAttribute("data-error","true"),console.warn(`icon-wc: ${i}`);let e=this.shadowRoot?.querySelector("slot");e&&(e.textContent="")}connectedCallback(){o.#e.add(this),o.#s(),this.render(),this.loadIcon(),this._onThemeChange=()=>{let i=this.shadowRoot?.querySelector("svg");i&&(i.style.stroke="none",requestAnimationFrame(()=>{i.style.stroke=""}))},window.addEventListener("vb:theme-change",this._onThemeChange),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),o.#e.delete(this),this._onThemeChange&&window.removeEventListener("vb:theme-change",this._onThemeChange)}attributeChangedCallback(i,e,t){if(e!==t&&this.isConnected){if(i==="name"||i==="set")this.render(),this.loadIcon();else if(i==="label"){let s=this.shadowRoot?.querySelector("svg");s&&(t?(s.setAttribute("role","img"),s.setAttribute("aria-label",t)):(s.removeAttribute("role"),s.setAttribute("aria-hidden","true")))}}}};h("icon-wc",c);export{c as IconWc};
//# sourceMappingURL=icon-wc.js.map
