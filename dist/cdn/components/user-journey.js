var g=`
  :host {
    display: block;
    font-family: var(--_font-sans);
    line-height: 1.6;
    color: var(--_text);
    container-type: inline-size;

    --_bg:     var(--user-journey-bg, var(--color-surface-raised, #f8f9fa));
    --_card:   var(--user-journey-card, var(--color-surface, #ffffff));
    --_border: var(--user-journey-border, var(--color-border, #e0e0e0));
    --_muted:  var(--user-journey-muted, var(--color-text-muted, #666666));
    --_text:   var(--user-journey-text, var(--color-text, #1a1a1a));
    --_curve-stroke: var(--user-journey-curve-stroke, #6366f1);
    --_radius: var(--user-journey-radius, var(--radius-l, 0.75rem));

    --_font-sans: var(--user-journey-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_font-mono: var(--user-journey-font-mono, var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace));
    --_font-xs:   var(--user-journey-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:   var(--user-journey-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:   var(--user-journey-font-md, var(--font-size-md, 1rem));
    --_font-xl:   var(--user-journey-font-xl, var(--font-size-xl, 1.25rem));
    --_space-2xs: var(--user-journey-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:  var(--user-journey-space-xs, var(--size-xs, 0.5rem));
    --_space-s:   var(--user-journey-space-s, var(--size-s, 0.75rem));
    --_space-m:   var(--user-journey-space-m, var(--size-m, 1rem));
    --_space-l:   var(--user-journey-space-l, var(--size-l, 1.5rem));
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  /* Card */
  .journey {
    background: var(--_card);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    overflow: hidden;
  }

  /* Header */
  .journey__header {
    padding: 20px 24px 16px 28px;
    border-block-end: 1px solid var(--_border);
    position: relative;
  }

  /* Left accent bar */
  .journey__header::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 4px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  .journey__header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--_space-s);
    flex-wrap: wrap;
    margin-block-end: var(--_space-xs);
  }

  .journey__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  /* Chips */
  .chip {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 2px 9px;
    border-radius: 99px;
    text-decoration: none;
    line-height: 1.6;
  }

  .chip--type {
    color: #6366f1;
    background: #ede9fe;
  }

  .chip--story {
    color: #0369a1;
    background: #e0f2fe;
  }

  .chip--story:hover { background: #bae6fd; }

  @media (prefers-color-scheme: dark) {
    .chip--type  { color: #a78bfa; background: #2e1065; }
    .chip--story { color: #38bdf8; background: #082f49; }
    .chip--story:hover { background: #0c4a6e; }
  }

  /* Persona ref */
  .persona-ref {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--_muted);
    text-decoration: none;
    white-space: nowrap;
  }
  .persona-ref svg { width: 14px; height: 14px; flex-shrink: 0; }
  a.persona-ref:hover { color: #6366f1; text-decoration: underline; }

  /* Title & summary (slotted content) */
  .journey__title-wrap {
    margin-block-end: var(--_space-2xs);
  }

  .journey__title {
    font-size: var(--_font-xl);
    font-weight: 700;
    color: var(--_text);
    margin: 0;
  }

  ::slotted([slot="title"]) {
    font-size: var(--_font-xl) !important;
    font-weight: 700 !important;
    color: var(--_text) !important;
    margin: 0 !important;
  }

  .journey--compact .journey__title,
  .journey--compact ::slotted([slot="title"]) { font-size: var(--_font-md) !important; }

  .journey__summary-wrap {
    max-width: 72ch;
  }

  ::slotted([slot="summary"]) {
    font-size: var(--_font-sm) !important;
    color: var(--_muted) !important;
    margin: 0 !important;
  }

  /* Emotion curve */
  .journey__curve {
    background: var(--_bg);
    border-block-end: 1px solid var(--_border);
    overflow: hidden;
  }

  .curve-svg {
    display: block;
    width: 100%;
    height: 80px;
  }

  .journey--compact .curve-svg { height: 54px; }

  .zone { opacity: 0.35; }
  .zone--pos { fill: #dcfce7; }
  .zone--neu { fill: #fef9c3; }
  .zone--neg { fill: #fee2e2; }

  @media (prefers-color-scheme: dark) {
    .zone--pos { fill: #14532d; }
    .zone--neu { fill: #713f12; }
    .zone--neg { fill: #7f1d1d; }
  }

  .vline      { stroke: var(--_border); stroke-width: 1; stroke-dasharray: 3 4; }
  .curve-line { stroke: var(--_curve-stroke); stroke-width: 2.5; stroke-linecap: round; }
  .dot        { stroke: var(--_card); stroke-width: 2.5; }

  /* Grid */
  .journey__grid-wrap { overflow-x: auto; }

  .journey__grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  /* Head row */
  .journey__grid thead tr {
    background: #1e1b4b;
    color: #fff;
  }

  @media (prefers-color-scheme: dark) {
    .journey__grid thead tr { background: #0f0d30; }
  }

  .corner {
    padding: 10px 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.55;
    text-align: left;
    white-space: nowrap;
    min-width: 100px;
    position: sticky;
    left: 0;
    background: #1e1b4b;
    z-index: 2;
  }

  @media (prefers-color-scheme: dark) {
    .corner { background: #0f0d30; }
  }

  .phase-head {
    padding: 10px 14px;
    text-align: left;
    vertical-align: top;
    border-inline-start: 1px solid rgba(255 255 255 / 0.12);
    min-width: 160px;
    position: relative;
  }

  /* Emotion-coloured top accent per phase */
  .phase-head::before {
    content: '';
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    height: 3px;
    background: var(--ec, #6366f1);
  }

  .ph-num   { display: block; font-size: 10px; opacity: 0.5; margin-block-end: 2px; }
  .ph-name  { display: block; font-size: var(--_font-sm); font-weight: 700; line-height: 1.2; }
  .ph-emoji { display: block; font-size: var(--_font-xl); line-height: 1; margin-block: 4px 2px; }

  .ph-stories { display: flex; flex-wrap: wrap; gap: var(--_space-2xs); margin-block-start: var(--_space-2xs); }

  /* Body rows */
  .grid-row th,
  .grid-row td {
    padding: 10px 12px;
    border-block-end: 1px solid var(--_border);
    border-inline-start: 1px solid var(--_border);
    vertical-align: top;
  }

  .grid-row th:first-child { border-inline-start: none; }

  .row-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--_muted);
    white-space: nowrap;
    background: var(--_bg);
    text-align: left;
    position: sticky;
    left: 0;
    z-index: 1;
  }

  .data-cell          { font-size: 13px; line-height: 1.45; }
  .data-cell p        { margin-block: 0 4px; }
  .data-cell p:last-child { margin-block-end: 0; }
  .data-cell--empty   { color: var(--_muted); opacity: 0.35; }

  /* Semantic row tints */
  .grid-row--painpoints    .data-cell { background: #fff5f5; }
  .grid-row--opportunities .data-cell { background: #f0fdf4; }

  @media (prefers-color-scheme: dark) {
    .grid-row--painpoints    .data-cell { background: #2d0a0a; }
    .grid-row--opportunities .data-cell { background: #052e16; }
  }

  /* Compact */
  .journey--compact .phase-head { min-width: 120px; padding: 8px 10px; }
  .journey--compact .data-cell  { font-size: 12px; padding: 7px 10px; }
  .journey--compact .corner     { min-width: 80px; }

  /* Utility */
  .state-msg           { padding: var(--_space-l); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
  .state-msg--error    { color: #dc2626; }
  .journey__placeholder { padding: 20px 24px; font-size: var(--_font-sm); color: var(--_muted); }
  code { font-family: var(--_font-mono); font-size: 0.88em; }

  /* Responsive */
  @container (max-width: 500px) {
    .journey__header   { padding: 14px 16px 12px 20px; }
    .journey__title    { font-size: 17px; }
    .corner, .row-label { min-width: 72px; font-size: 9px; }
    .phase-head        { min-width: 110px; padding: 8px 10px; }
    .data-cell         { font-size: 12px; padding: 8px 10px; }
  }

  @media print {
    .journey__grid-wrap { overflow: visible; }
    .row-label, .corner { position: relative; }
  }
`;var E=window.matchMedia("(prefers-reduced-motion: reduce)");var $=new Map;function j(n,e,r={}){let a=r.priority??10,o={impl:e,bundle:r.bundle,contract:r.contract,priority:a},t=$.get(n);if(customElements.get(n)){if(!t||t.priority>=a){t&&t.priority===a&&t.impl!==e&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${t.bundle}" (priority ${t.priority}). Skipping "${r.bundle}".`);return}console.warn(`[VB Bundle] Tag <${n}> defined by "${t.bundle}" cannot be replaced (customElements.define is permanent). "${r.bundle}" has higher priority but arrived late.`);return}if(t&&t.priority>=a){t.priority===a&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${t.bundle}". Skipping "${r.bundle}" (first wins at equal priority).`);return}$.set(n,o),customElements.define(n,e)}function d(n){return String(n).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function x(n){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${n}</svg>`}var h={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',mapPin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>'},A={says:{label:"Says",icon:h.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:h.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:h.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:h.heart,color:"#ef4444"}},f={delighted:{emoji:"\u{1F604}",score:.95,color:"#16a34a"},satisfied:{emoji:"\u{1F60A}",score:.8,color:"#22c55e"},hopeful:{emoji:"\u{1F642}",score:.68,color:"#84cc16"},curious:{emoji:"\u{1F914}",score:.55,color:"#eab308"},neutral:{emoji:"\u{1F610}",score:.5,color:"#94a3b8"},uncertain:{emoji:"\u{1F615}",score:.4,color:"#f97316"},confused:{emoji:"\u{1F635}",score:.3,color:"#fb923c"},frustrated:{emoji:"\u{1F624}",score:.18,color:"#ef4444"},angry:{emoji:"\u{1F620}",score:.05,color:"#dc2626"}};var M=[{key:"actions",label:"Actions"},{key:"thoughts",label:"Thoughts"},{key:"touchpoints",label:"Touchpoints"},{key:"painPoints",label:"Pain Points"},{key:"opportunities",label:"Opportunities"}],_=class extends HTMLElement{static get observedAttributes(){return["src","persona","persona-id","story-ids","compact"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__phases=null}get phases(){return this.__phases}set phases(e){this.__phases=e,this.isConnected&&this._render()}#t(){for(let e of this.children){let r=e.getAttribute("slot");r&&this.#e.set(r,e.textContent.trim())}}_resolve(e){return this.getAttribute(e)||this.#e.get(e)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(e){this.isConnected&&(e==="src"?this._loadSrc(this.getAttribute("src")):this._render())}async _loadSrc(e){if(e){this.shadowRoot.innerHTML=`<style>${g}</style><div class="state-msg">Loading\u2026</div>`;try{let r=await fetch(e);if(!r.ok)throw new Error(`HTTP ${r.status}`);let a=await r.json();if(a.persona&&this.setAttribute("persona",a.persona),a.personaId&&this.setAttribute("persona-id",a.personaId),a.title&&!this.querySelector('[slot="title"]')){let o=document.createElement("h2");o.slot="title",o.textContent=a.title,this.appendChild(o)}if(a.summary&&!this.querySelector('[slot="summary"]')){let o=document.createElement("p");o.slot="summary",o.textContent=a.summary,this.appendChild(o)}this.__phases=a.phases||[],this._render()}catch(r){this.shadowRoot.innerHTML=`<style>${g}</style><div class="state-msg state-msg--error">Could not load journey: ${d(r.message)}</div>`}}}_render(){let e=this._resolve("persona")||"",r=this._resolve("persona-id")||"",a=(this.getAttribute("story-ids")||"").split(",").map(i=>i.trim()).filter(Boolean),o=this.hasAttribute("compact"),t=this.__phases,p=!!this.querySelector('[slot="summary"]')||this.#e.has("summary");this.shadowRoot.innerHTML=`<style>${g}</style>
      <article class="journey${o?" journey--compact":""}">

        <header class="journey__header">
          <div class="journey__header-top">
            <div class="journey__chips">
              <span class="chip chip--type">Journey Map</span>
              ${a.map(i=>`<a class="chip chip--story" href="#${i}">${this._label(i)}</a>`).join("")}
            </div>
            ${e?`
              <div class="journey__persona">
                ${r?`<a class="persona-ref" href="#${r}">${x(h.user)} ${d(e)}</a>`:`<span class="persona-ref">${x(h.user)} ${d(e)}</span>`}
              </div>`:""}
          </div>
          <div class="journey__title-wrap">
            <slot name="title"><h2 class="journey__title">User Journey</h2></slot>
          </div>
          ${p?'<div class="journey__summary-wrap"><slot name="summary"></slot></div>':""}
        </header>

        ${t&&t.length?this._curve(t)+this._grid(t):`<div class="journey__placeholder">
               <p>Add phase data via <code>src</code> (JSON) or set <code>.phases</code> programmatically.</p>
             </div>`}

      </article>`,this.dispatchEvent(new CustomEvent("journey-ready",{bubbles:!0,composed:!0,detail:{title,persona:e,phaseCount:t?t.length:0}}))}_curve(e){let l=e.length,b=s=>28+(l<2?944/2:s/(l-1)*944),k=s=>14+(1-(f[s.emotion]||f.neutral).score)*72,c=e.map((s,u)=>({x:b(u),y:k(s),ph:s})),v=`M ${c[0].x},${c[0].y}`;for(let s=1;s<c.length;s++){let u=c[s-1],m=c[s],y=(u.x+m.x)/2;v+=` C ${y},${u.y} ${y},${m.y} ${m.x},${m.y}`}let w=`uj-${Math.random().toString(36).slice(2,8)}`,z=c.at(-1);return`
      <div class="journey__curve" aria-hidden="true">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" class="curve-svg">
          <defs>
            <linearGradient id="${w}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#6366f1" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0"             y="0"          width="1000" height="${100*.4}"  class="zone zone--pos"/>
          <rect x="0"             y="${100*.4}" width="1000" height="${100*.2}"  class="zone zone--neu"/>
          <rect x="0"             y="${100*.6}" width="1000" height="${100*.4}"  class="zone zone--neg"/>
          ${c.map(({x:s})=>`<line x1="${s}" y1="0" x2="${s}" y2="100" class="vline"/>`).join("")}
          <path d="${v} L ${z.x},100 L ${c[0].x},100 Z" fill="url(#${w})"/>
          <path d="${v}" fill="none" class="curve-line"/>
          ${c.map(({x:s,y:u,ph:m})=>{let y=f[m.emotion]||f.neutral;return`<circle cx="${s}" cy="${u}" r="5" class="dot" style="fill:${y.color}"/>`}).join("")}
        </svg>
      </div>`}_grid(e){let r=e.map((o,t)=>{let p=f[o.emotion]||f.neutral,i=o.storyIds||[];return`
        <th class="phase-head" data-emotion="${o.emotion||"neutral"}"
            style="--ec:${p.color}">
          <span class="ph-num">${t+1}</span>
          <span class="ph-name">${d(o.name||"")}</span>
          <span class="ph-emoji" title="${o.emotion||"neutral"}"><span role="img" aria-label="${d(o.emotion||"neutral")}">${p.emoji}</span></span>
          ${i.length?`<div class="ph-stories">${i.map(l=>`<a class="chip chip--story" href="#${l}">${this._label(l)}</a>`).join("")}</div>`:""}
        </th>`}).join(""),a=M.map(({key:o,label:t})=>{let p=e.map(i=>{let l=i[o]||[];return l.length?`<td class="data-cell data-cell--${o.toLowerCase()}">
          ${l.map(b=>`<p>${d(b)}</p>`).join("")}
        </td>`:'<td class="data-cell data-cell--empty">\u2014</td>'}).join("");return`
        <tr class="grid-row grid-row--${o.toLowerCase()}">
          <th class="row-label">${t}</th>
          ${p}
        </tr>`}).join("");return`
      <div class="journey__grid-wrap">
        <table class="journey__grid"
               aria-label="${d(this.getAttribute("title")||"User Journey")} \u2014 phase breakdown">
          <thead>
            <tr>
              <th class="corner">Stage</th>
              ${r}
            </tr>
          </thead>
          <tbody>${a}</tbody>
        </table>
      </div>`}_label(e){return e.replace(/^(activity|persona|journey|story|user)-/,"").replace(/-/g," ").replace(/\b\w/g,r=>r.toUpperCase())}};j("user-journey",_);export{_ as UserJourney};
//# sourceMappingURL=user-journey.js.map
