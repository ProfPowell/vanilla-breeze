var c=`
  :host {
    --_padding:         var(--score-card-padding, var(--size-l, 1.5rem));
    --_radius:          var(--score-card-radius, var(--radius-m, 0.5rem));
    --_gap:             var(--score-card-gap, var(--size-s, 0.75rem));
    --_value-size:      var(--score-card-value-size, var(--font-size-3xl, 2rem));
    --_value-weight:    var(--score-card-value-weight, var(--font-weight-bold, 700));
    --_title-size:      var(--score-card-title-size, var(--font-size-sm, 0.875rem));
    --_meta-size:       var(--score-card-meta-size, var(--font-size-sm, 0.875rem));
    --_sparkline-h:     var(--score-card-sparkline-height, 40px);
    --_surface:         var(--score-card-surface, var(--color-surface, #fff));
    --_border:          var(--score-card-border, 1px solid var(--color-border-subtle, var(--color-border, #e5e7eb)));
    --_text:            var(--score-card-text, var(--color-text, #1a1a1a));
    --_muted:           var(--score-card-muted, var(--color-text-muted, #6b7280));
    --_accent:          var(--score-card-tone-accent, var(--color-interactive, var(--color-primary, #6366f1)));
    --_trend-up:        var(--score-card-trend-up, var(--color-success, #16a34a));
    --_trend-down:      var(--score-card-trend-down, var(--color-error, #dc2626));
    --_trend-flat:      var(--score-card-trend-flat, var(--color-text-muted, #6b7280));
    --_focus:           var(--color-focus-ring, var(--color-interactive, currentColor));
    --_duration:        var(--score-card-duration, var(--duration-fast, 150ms));
    --_ease:            var(--score-card-ease, var(--ease-default, ease));

    display: block;
    box-sizing: border-box;
    color: var(--_text);
    background: var(--_surface);
    border: var(--_border);
    border-radius: var(--_radius);
    padding: var(--_padding);
    container-type: inline-size;
  }

  *, *::before, *::after { box-sizing: border-box; }

  /* \u2500\u2500 Tone accent \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([tone="success"]) { --_accent: var(--color-success, #16a34a); }
  :host([tone="warning"]) { --_accent: var(--color-warning, #d97706); }
  :host([tone="error"])   { --_accent: var(--color-error,   #dc2626); }
  :host([tone="info"])    { --_accent: var(--color-info,    #2563eb); }

  /* \u2500\u2500 Layout grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .card {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "title       icon"
      "value       icon"
      "change      change"
      "sparkline   sparkline"
      "description description";
    gap: var(--_gap);
    align-items: start;
  }

  /* cluster: icon stays right, value+change wrap on the left */
  :host([layout="cluster"]) .card {
    grid-template-areas:
      "title       icon"
      "value       icon"
      "change      icon"
      "sparkline   sparkline"
      "description description";
  }

  /* compact: dense vertical, smaller value */
  :host([layout="compact"]) {
    --_padding: var(--size-m, 1rem);
    --_value-size: var(--font-size-2xl, 1.5rem);
    --_gap: var(--size-2xs, 0.25rem);
  }

  /* \u2500\u2500 Slot regions \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .title       { grid-area: title; }
  .value       { grid-area: value; }
  .change      { grid-area: change; }
  .sparkline   { grid-area: sparkline; }
  .description { grid-area: description; }
  .icon        { grid-area: icon; }

  .title ::slotted(*) {
    margin: 0;
    font-size: var(--_title-size);
    font-weight: var(--font-weight-medium, 500);
    color: var(--_muted);
    line-height: 1.3;
  }

  .value ::slotted(*) {
    font-size: var(--_value-size);
    font-weight: var(--_value-weight);
    line-height: 1.1;
    color: var(--_text);
    font-variant-numeric: tabular-nums;
  }

  .change ::slotted(*) {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2xs, 0.25rem);
    font-size: var(--_meta-size);
    color: var(--_muted);
    line-height: 1.4;
  }

  .description ::slotted(*) {
    font-size: var(--_meta-size);
    color: var(--_muted);
    line-height: 1.4;
    margin: 0;
  }

  /* Empty optional slots collapse to zero so they don't reserve grid rows.
     :state(has-*) is set by JS when slotchange fires with assigned nodes. */
  .change, .sparkline, .description, .icon { display: none; }
  :host(:state(has-change))      .change      { display: block; }
  :host(:state(has-sparkline))   .sparkline   { display: block; min-block-size: var(--_sparkline-h); overflow: hidden; }
  :host(:state(has-description)) .description { display: block; }
  :host(:state(has-icon))        .icon        { display: inline-flex; align-items: center; justify-content: center; }

  .sparkline ::slotted(*) {
    display: block;
    inline-size: 100%;
    block-size: var(--_sparkline-h);
    max-block-size: var(--_sparkline-h);
  }

  /* icon region \u2014 accent color from tone */
  .icon ::slotted(*) {
    color: var(--_accent);
    --icon-color: var(--_accent);
  }

  /* \u2500\u2500 Trend coloring (drives change row) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:state(trend-up))   .change ::slotted(*) { color: var(--_trend-up); }
  :host(:state(trend-down)) .change ::slotted(*) { color: var(--_trend-down); }
  :host(:state(trend-flat)) .change ::slotted(*) { color: var(--_trend-flat); }

  /* \u2500\u2500 Interactive (wrapped in <a>) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:state(interactive)) {
    cursor: pointer;
    transition: transform var(--_duration) var(--_ease),
                box-shadow var(--_duration) var(--_ease),
                border-color var(--_duration) var(--_ease);
  }

  /* Lift on hover of the wrapping anchor. We can't reach the anchor from
     shadow CSS, so consumers should use the :has() partner rule in their
     light-DOM stylesheet (documented in the spec). The transition above
     still applies to any state changes the consumer drives. */

  /* \u2500\u2500 Loading skeleton \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:state(loading)) .value,
  :host(:state(loading)) .sparkline,
  :host(:state(loading)) .change {
    background: linear-gradient(
      90deg,
      color-mix(in oklch, var(--_muted) 12%, transparent),
      color-mix(in oklch, var(--_muted) 24%, transparent),
      color-mix(in oklch, var(--_muted) 12%, transparent)
    );
    background-size: 200% 100%;
    border-radius: var(--radius-s, 0.25rem);
    color: transparent;
    animation: score-card-shimmer 1.4s var(--_ease) infinite;
  }
  :host(:state(loading)) .value ::slotted(*),
  :host(:state(loading)) .change ::slotted(*),
  :host(:state(loading)) .sparkline ::slotted(*) {
    visibility: hidden;
  }
  :host(:state(loading)) .value { min-block-size: var(--_value-size); }
  :host(:state(loading)) .change { min-block-size: 1.4em; }

  @keyframes score-card-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    :host(:state(loading)) .value,
    :host(:state(loading)) .sparkline,
    :host(:state(loading)) .change {
      animation: none;
      background: color-mix(in oklch, var(--_muted) 18%, transparent);
    }
  }
`;var n=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let e of this.#t)e();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(e,t,r,o){e.addEventListener(t,r,o),this.#t.push(()=>e.removeEventListener(t,r,o))}setup(){}teardown(){}setState(e,t){this.#e||(this.#e=this.attachInternals());let r=this.#e.states;try{t?r.add(e):r.delete(e)}catch{let o=`--${e}`;t?r.add(o):r.delete(o)}}_adoptInternals(e){this.#e||(this.#e=e)}};var m=window.matchMedia("(prefers-reduced-motion: reduce)");var l=new Map;function d(s,e,t={}){let r=t.priority??10,o={impl:e,bundle:t.bundle,contract:t.contract,priority:r},a=l.get(s);if(customElements.get(s)){if(!a||a.priority>=r){a&&a.priority===r&&a.impl!==e&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=r){a.priority===r&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}l.set(s,o),customElements.define(s,e)}var u=new Set(["up","down","flat"]),h=["change","sparkline","description","icon"],p=`
  <style>${c}</style>
  <div class="card" part="card">
    <span class="title"       part="title"><slot name="title"></slot></span>
    <span class="value"       part="value"><slot name="value"><slot></slot></slot></span>
    <span class="change"      part="change"><slot name="change"      data-slot="change"></slot></span>
    <span class="sparkline"   part="sparkline"><slot name="sparkline"   data-slot="sparkline"></slot></span>
    <span class="description" part="description"><slot name="description" data-slot="description"></slot></span>
    <span class="icon"        part="icon"><slot name="icon"        data-slot="icon"></slot></span>
  </div>
`,i=class extends n{static get observedAttributes(){return["trend","loading"]}setup(){if(this.shadowRoot)for(let e of h){let t=this.shadowRoot.querySelector(`slot[name="${e}"]`);this.#t(e,t)}else{let e=this.attachShadow({mode:"open"});e.innerHTML=p;for(let t of h){let r=e.querySelector(`slot[name="${t}"]`);r?.addEventListener("slotchange",()=>this.#t(t,r)),this.#t(t,r)}}this.#e(),this.#r(),this.#a()}attributeChangedCallback(e){this.isConnected&&(e==="trend"?this.#e():e==="loading"&&this.#r())}#t(e,t){let r=!!t&&t.assignedNodes({flatten:!0}).some(o=>o.nodeType===Node.ELEMENT_NODE||o.nodeType===Node.TEXT_NODE&&o.textContent.trim().length>0);this.setState(`has-${e}`,r)}#e(){let e=(this.getAttribute("trend")||"").toLowerCase();for(let t of u)this.setState(`trend-${t}`,t===e)}#r(){this.setState("loading",this.hasAttribute("loading"))}#a(){let e=this.closest("a[href]");this.setState("interactive",!!e)}};d("score-card",i);export{i as ScoreCard};
//# sourceMappingURL=score-card.js.map
