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
`;var o=new Map,a=class n extends HTMLElement{static#e=new Set;static#t=null;static#i(){n.#t||(n.#t=new MutationObserver(t=>{for(let i of t)if(i.attributeName==="data-icon-set")for(let s of n.#e)s.hasAttribute("set")||(s.render(),s.loadIcon())}),n.#t?.observe(document.documentElement,{attributes:!0,attributeFilter:["data-icon-set"]}))}static get observedAttributes(){return["name","set","size","label"]}constructor(){super(),this.attachShadow({mode:"open"})}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||document.documentElement.dataset.iconSet||"lucide"}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||document.documentElement.dataset.iconPath||"/src/icons"}get iconPath(){return`${this.basePath}/${this.set}/${this.name}.svg`}render(){this.shadowRoot.innerHTML=`
            <style>${l}</style>
            <slot></slot>
        `}async loadIcon(){if(!this.name){this.setError("No icon name specified");return}let t=`${this.set}/${this.name}`;if(o.has(t)){this.displayIcon(o.get(t));return}try{let i=await this.#s(this.set);o.set(t,i),this.displayIcon(i)}catch(i){let s="lucide";if(this.set!==s){let e=`${s}/${this.name}`;if(o.has(e)){this.displayIcon(o.get(e));return}try{let r=await this.#s(s);o.set(e,r),this.displayIcon(r);return}catch{}}this.setError(i.message)}}async#s(t){let i=`${this.basePath}/${t}/${this.name}.svg`,s=await fetch(i);if(!s.ok)throw new Error(`Icon not found: ${this.name}`);let e=await s.text();if(!e.includes("<svg"))throw new Error(`Invalid SVG: ${this.name}`);return e}displayIcon(t){let e=new DOMParser().parseFromString(t,"image/svg+xml").querySelector("svg");if(!e){this.setError("Invalid SVG content");return}e.removeAttribute("width"),e.removeAttribute("height"),this.label?(e.setAttribute("role","img"),e.setAttribute("aria-label",this.label)):e.setAttribute("aria-hidden","true"),this.removeAttribute("data-error");let r=this.shadowRoot?.querySelector("slot");r&&r.replaceWith(e)}setError(t){this.setAttribute("data-error","true"),console.warn(`icon-wc: ${t}`);let i=this.shadowRoot?.querySelector("slot");i&&(i.textContent="")}connectedCallback(){n.#e.add(this),n.#i(),this.render(),this.loadIcon(),this._onThemeChange=()=>{let t=this.shadowRoot?.querySelector("svg");t&&(t.style.stroke="none",requestAnimationFrame(()=>{t.style.stroke=""}))},window.addEventListener("theme-change",this._onThemeChange)}disconnectedCallback(){n.#e.delete(this),this._onThemeChange&&window.removeEventListener("theme-change",this._onThemeChange)}attributeChangedCallback(t,i,s){if(i!==s&&this.isConnected){if(t==="name"||t==="set")this.render(),this.loadIcon();else if(t==="label"){let e=this.shadowRoot?.querySelector("svg");e&&(s?(e.setAttribute("role","img"),e.setAttribute("aria-label",s)):(e.removeAttribute("role"),e.setAttribute("aria-hidden","true")))}}}};customElements.define("icon-wc",a);export{a as IconWc};
//# sourceMappingURL=icon-wc.js.map
