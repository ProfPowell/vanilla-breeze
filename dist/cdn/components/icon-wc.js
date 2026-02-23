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
`;var r=new Map,n=class o extends HTMLElement{static#e=new Set;static#t=null;static#s(){o.#t||(o.#t=new MutationObserver(e=>{for(let s of e)if(s.attributeName==="data-icon-set")for(let i of o.#e)i.hasAttribute("set")||(i.render(),i.loadIcon())}),o.#t.observe(document.documentElement,{attributes:!0,attributeFilter:["data-icon-set"]}))}static get observedAttributes(){return["name","set","size","label"]}constructor(){super(),this.attachShadow({mode:"open"})}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||document.documentElement.dataset.iconSet||"lucide"}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||document.documentElement.dataset.iconPath||"/src/icons"}get iconPath(){return`${this.basePath}/${this.set}/${this.name}.svg`}render(){this.shadowRoot.innerHTML=`
            <style>${l}</style>
            <slot></slot>
        `}async loadIcon(){if(!this.name){this.setError("No icon name specified");return}let e=`${this.set}/${this.name}`;if(r.has(e)){this.displayIcon(r.get(e));return}try{let s=await fetch(this.iconPath);if(!s.ok)throw new Error(`Icon not found: ${this.name}`);let i=await s.text();if(!i.includes("<svg"))throw new Error(`Invalid SVG: ${this.name}`);r.set(e,i),this.displayIcon(i)}catch(s){this.setError(s.message)}}displayIcon(e){let t=new DOMParser().parseFromString(e,"image/svg+xml").querySelector("svg");if(!t){this.setError("Invalid SVG content");return}t.removeAttribute("width"),t.removeAttribute("height"),this.label?(t.setAttribute("role","img"),t.setAttribute("aria-label",this.label)):t.setAttribute("aria-hidden","true"),this.removeAttribute("data-error");let a=this.shadowRoot.querySelector("slot");a&&a.replaceWith(t)}setError(e){this.setAttribute("data-error","true"),console.warn(`icon-wc: ${e}`);let s=this.shadowRoot.querySelector("slot");s&&(s.textContent="")}connectedCallback(){o.#e.add(this),o.#s(),this.render(),this.loadIcon(),this._onThemeChange=()=>{let e=this.shadowRoot?.querySelector("svg");e&&(e.style.stroke="none",requestAnimationFrame(()=>{e.style.stroke=""}))},window.addEventListener("theme-change",this._onThemeChange)}disconnectedCallback(){o.#e.delete(this),this._onThemeChange&&window.removeEventListener("theme-change",this._onThemeChange)}attributeChangedCallback(e,s,i){if(s!==i&&this.isConnected){if(e==="name"||e==="set")this.render(),this.loadIcon();else if(e==="label"){let t=this.shadowRoot.querySelector("svg");t&&(i?(t.setAttribute("role","img"),t.setAttribute("aria-label",i)):(t.removeAttribute("role"),t.setAttribute("aria-hidden","true")))}}}};customElements.define("icon-wc",n);export{n as IconWc};
//# sourceMappingURL=icon-wc.js.map
