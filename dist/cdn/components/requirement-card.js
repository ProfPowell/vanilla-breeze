var c=`
  :host {
    --_padding:        var(--requirement-card-padding, var(--size-m, 1rem));
    --_radius:         var(--requirement-card-radius, var(--radius-m, 0.5rem));
    --_gap:            var(--requirement-card-gap, var(--size-2xs, 0.25rem));
    --_surface:        var(--requirement-card-surface, var(--color-surface, #fff));
    --_border:         var(--requirement-card-border, 1px solid var(--color-border, #e5e7eb));
    --_text:           var(--requirement-card-text, var(--color-text, #1a1a1a));
    --_muted:          var(--requirement-card-muted, var(--color-text-muted, #6b7280));
    --_critical-bg:    var(--requirement-card-critical-bg,    var(--color-error-subtle, oklch(95% 0.05 27)));
    --_critical-fg:    var(--requirement-card-critical-fg,    var(--color-error, #dc2626));
    --_important-bg:   var(--requirement-card-important-bg,   var(--color-warning-subtle, oklch(95% 0.05 80)));
    --_important-fg:   var(--requirement-card-important-fg,   var(--color-warning, #b45309));
    --_acceptable-bg:  var(--requirement-card-acceptable-bg,  var(--color-success-subtle, oklch(95% 0.05 145)));
    --_acceptable-fg:  var(--requirement-card-acceptable-fg,  var(--color-success, #15803d));
    --_skipped-bg:     var(--requirement-card-skipped-bg,     var(--color-surface-raised, var(--color-surface, #f5f5f5)));
    --_skipped-fg:     var(--requirement-card-skipped-fg,     var(--color-text-muted, #6b7280));
    --_conflict:       var(--requirement-card-conflict-color, var(--color-error, #dc2626));

    display: block;
    padding: var(--_padding);
    border-radius: var(--_radius);
    background: var(--_surface);
    border: var(--_border);
    color: var(--_text);
    container-type: inline-size;
  }

  .card {
    display: grid;
    gap: var(--_gap);
  }

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--size-s, 0.75rem);
  }

  .name {
    font-weight: var(--font-weight-semibold, 600);
    font-size: var(--font-size-md, 1rem);
  }

  .badge ::slotted([slot="badge"]) {
    font-size: var(--font-size-xs, 0.75em);
    color: var(--_muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pill ::slotted([slot="priority-pill"]),
  .priority-default {
    display: inline-block;
    padding: 0.15em 0.6em;
    border-radius: var(--radius-pill, 999px);
    font-size: var(--font-size-xs, 0.75em);
    font-weight: var(--font-weight-semibold, 600);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Priority-driven surface tinting on the card itself (when no slotted pill) */
  :host(:state(priority-critical))     { border-color: var(--_critical-fg); }
  :host(:state(priority-important))    { border-color: var(--_important-fg); }
  :host(:state(priority-acceptable))   { border-color: var(--_acceptable-fg); }
  :host(:state(priority-not-relevant)) { opacity: 0.6; }

  :host(:state(priority-critical))     .priority-default { background: var(--_critical-bg);    color: var(--_critical-fg); }
  :host(:state(priority-important))    .priority-default { background: var(--_important-bg);   color: var(--_important-fg); }
  :host(:state(priority-acceptable))   .priority-default { background: var(--_acceptable-bg);  color: var(--_acceptable-fg); }
  :host(:state(priority-not-relevant)) .priority-default { background: var(--_skipped-bg);     color: var(--_skipped-fg); text-decoration: line-through; }

  /* Hide the default pill when the author supplied one via slot */
  :host(:state(has-priority-pill)) .priority-default { display: none; }

  .rationale ::slotted([slot="rationale"]) {
    color: var(--_muted);
    font-size: var(--font-size-sm, 0.875rem);
    line-height: 1.45;
  }

  .conflicts ::slotted([slot="conflicts"]) {
    color: var(--_conflict);
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-semibold, 600);
  }

  /* When no rationale or conflicts content, collapse the slot row */
  :host(:not(:state(has-rationale))) .rationale,
  :host(:not(:state(has-conflicts))) .conflicts { display: none; }

  /* Conflict flag */
  :host([data-conflict]) {
    border-color: var(--_conflict);
    box-shadow: inset 0 0 0 1px var(--_conflict);
  }

  /* Interactive: bubble click event so parents can wire up navigation */
  :host { cursor: default; }
  :host(:state(interactive)) { cursor: pointer; }
  :host(:state(interactive)):hover { background: color-mix(in oklab, var(--_surface) 92%, currentColor 8%); }
  :host(:focus-visible) {
    outline: 2px solid var(--color-focus-ring, var(--color-interactive, currentColor));
    outline-offset: 2px;
  }
`;var s=class extends HTMLElement{#e=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#e)t();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,r,a){t.addEventListener(e,r,a),this.#e.push(()=>t.removeEventListener(e,r,a))}setup(){}teardown(){}setState(t,e){this.#t||(this.#t=this.attachInternals());let r=this.#t.states;try{e?r.add(t):r.delete(t)}catch{let a=`--${t}`;e?r.add(a):r.delete(a)}}_adoptInternals(t){this.#t||(this.#t=t)}};var v=window.matchMedia("(prefers-reduced-motion: reduce)");var l=new Map;function d(i,t,e={}){let r=e.priority??10,a={impl:t,bundle:e.bundle,contract:e.contract,priority:r},o=l.get(i);if(customElements.get(i)){if(!o||o.priority>=r){o&&o.priority===r&&o.impl!==t&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${i}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=r){o.priority===r&&console.warn(`[VB Bundle] Tag <${i}> already registered by "${o.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}l.set(i,a),customElements.define(i,t)}var p=Object.freeze(["critical","important","acceptable","not-relevant"]),f=Object.freeze({critical:"Critical",important:"Important",acceptable:"Acceptable","not-relevant":"Not relevant"}),u=["badge","priority-pill","rationale","conflicts"],h=`
  <style>${c}</style>
  <article class="card" part="card">
    <header class="head" part="head">
      <span class="name" part="name"><slot name="name"></slot></span>
      <span class="badge" part="badge"><slot name="badge"></slot></span>
    </header>
    <span class="pill" part="pill">
      <slot name="priority-pill"><span class="priority-default" part="priority-default" data-priority-default></span></slot>
    </span>
    <p class="rationale" part="rationale"><slot name="rationale"></slot></p>
    <p class="conflicts" part="conflicts"><slot name="conflicts"></slot></p>
  </article>
`,n=class extends s{static get observedAttributes(){return["data-priority","data-conflict","tabindex"]}setup(){if(this.shadowRoot)for(let t of u){let e=this.shadowRoot.querySelector(`slot[name="${t}"]`);this.#t(t,e)}else{let t=this.attachShadow({mode:"open"});t.innerHTML=h;for(let e of u){let r=t.querySelector(`slot[name="${e}"]`);r?.addEventListener("slotchange",()=>this.#t(e,r)),this.#t(e,r)}}this.#r(),this.#o(),this.#a(),this.listen(this,"click",t=>this.#i(t)),this.listen(this,"keydown",t=>{(t.key==="Enter"||t.key===" ")&&this.#e&&(t.preventDefault(),this.#i(t))})}attributeChangedCallback(t){this.isConnected&&(t==="data-priority"?(this.#r(),this.#o()):t==="data-conflict"||t==="tabindex"&&this.#a())}get priority(){return(this.dataset.priority||"").toLowerCase()}set priority(t){let e=String(t||"").toLowerCase();p.includes(e)?this.dataset.priority=e:delete this.dataset.priority}get hasConflict(){return this.hasAttribute("data-conflict")}set hasConflict(t){t?this.setAttribute("data-conflict",""):this.removeAttribute("data-conflict")}get#e(){return this.hasAttribute("tabindex")||this.closest("a[href], button")}#t(t,e){let r=!!e&&e.assignedNodes({flatten:!0}).some(a=>a.nodeType===Node.ELEMENT_NODE||a.nodeType===Node.TEXT_NODE&&a.textContent.trim().length>0);this.setState(`has-${t}`,r)}#r(){let t=(this.dataset.priority||"").toLowerCase();for(let e of p)this.setState(`priority-${e}`,e===t)}#o(){let t=(this.dataset.priority||"").toLowerCase(),e=this.shadowRoot?.querySelector("[data-priority-default]");e&&(e.textContent=f[t]||"")}#a(){this.setState("interactive",!!this.#e)}#i(t){this.#e&&this.dispatchEvent(new CustomEvent("requirement-card:click",{bubbles:!0,composed:!0,detail:{priority:this.priority||null,hasConflict:this.hasConflict,originalEvent:t}}))}};d("requirement-card",n);export{n as RequirementCard};
//# sourceMappingURL=requirement-card.js.map
