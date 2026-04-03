var U=window.matchMedia("(prefers-reduced-motion: reduce)");var D=new Map;function b(p,t,e={}){let r=e.priority??10,s={impl:t,bundle:e.bundle,contract:e.contract,priority:r},a=D.get(p);if(customElements.get(p)){if(!a||a.priority>=r){a&&a.priority===r&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${p}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${p}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=r){a.priority===r&&console.warn(`[VB Bundle] Tag <${p}> already registered by "${a.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}D.set(p,s),customElements.define(p,t)}var A=class extends HTMLElement{#e=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let t of this.#e)t();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,r,s){t.addEventListener(e,r,s),this.#e.push(()=>t.removeEventListener(e,r,s))}setup(){}teardown(){}};var E=class p extends A{#e=null;#t=null;#a=!1;#i=null;setup(){this.setAttribute("role","list"),this.#a=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.#o(),this.#n(),this.#y(),this.#r()}teardown(){this.#e&&(this.#e.remove(),this.#e=null),p.#p?.source===this&&(p.#p=null)}get draggableChildren(){return[...this.querySelectorAll(':scope > [draggable="true"]')]}get group(){return this.getAttribute("group")||null}get orientation(){return this.getAttribute("orientation")||"vertical"}get sortedOrder(){return this.draggableChildren.map(t=>t.dataset.id)}#r(){for(let t of this.draggableChildren)t.getAttribute("role")||t.setAttribute("role","listitem"),t.hasAttribute("tabindex")||t.setAttribute("tabindex","0"),t.hasAttribute("aria-grabbed")||t.setAttribute("aria-grabbed","false")}#o(){this.#e=document.createElement("div"),this.#e.setAttribute("role","status"),this.#e.setAttribute("aria-live","polite"),this.#e.setAttribute("aria-atomic","true"),this.#e.style.cssText="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);",this.prepend(this.#e)}#s(t){let e=this.#e;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#n(){this.listen(this,"pointerdown",t=>{this.#i=t.target}),this.listen(this,"dragstart",this.#c.bind(this)),this.listen(this,"dragover",this.#d.bind(this)),this.listen(this,"dragleave",this.#l.bind(this)),this.listen(this,"drop",this.#h.bind(this)),this.listen(this,"dragend",this.#f.bind(this))}#c(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let r=e.querySelector("[data-drag-handle]");if(r&&!r.contains(this.#i)){t.preventDefault();return}e.setAttribute("data-dragging",""),t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",e.dataset.id||""),t.dataTransfer.setData("application/x-drag-surface-group",this.group||"");let s=this.#m(e);p.#p={item:e,source:this,originalIndex:s},this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}#d(t){let e=p.#p;if(!e||(this.group||e.source.group)&&this.group!==e.source.group)return;t.preventDefault(),t.dataTransfer.dropEffect="move",this.setAttribute("data-drag-over","");let r=this.orientation==="horizontal"?t.clientX:t.clientY;this.#k(r)}#l(t){t.relatedTarget&&!this.contains(t.relatedTarget)&&(this.removeAttribute("data-drag-over"),this.#v())}#h(t){t.preventDefault(),this.removeAttribute("data-drag-over"),this.#v();let e=p.#p;if(!e)return;let{item:r,source:s,originalIndex:a}=e,i=this.orientation==="horizontal"?t.clientX:t.clientY,o=this.#A(i);if(s===this){this.#g(r,o),this.#u();let c=this.#m(r);this.#b(r),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:r,itemId:r.dataset.id,oldIndex:a,newIndex:c,order:this.sortedOrder}}))}else this.#g(r,o),this.#u(),s.#u(),this.#b(r),this.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:r,itemId:r.dataset.id,fromSurface:s,toSurface:this,newIndex:this.#m(r),fromOrder:s.sortedOrder,toOrder:this.sortedOrder}}))}#f(){let t=p.#p;t?.item&&t.item.removeAttribute("data-dragging"),this.removeAttribute("data-drag-over"),this.#v(),p.#p=null,this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0}))}#y(){this.listen(this,"keydown",this.#x.bind(this))}#x(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let r=e.getAttribute("aria-grabbed")==="true",s=this.orientation==="horizontal",a=s?"ArrowLeft":"ArrowUp",i=s?"ArrowRight":"ArrowDown";if(t.key===" "||t.key==="Enter"){if(t.preventDefault(),r){e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#u(),this.#b(e);let l=this.#m(e),n=this.draggableChildren;this.#s(`${this.#_(e)}, dropped at position ${l+1} of ${n.length}`),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,oldIndex:this.#t,newIndex:l,order:this.sortedOrder}})),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#t=null}else{this.#t=this.#m(e),e.setAttribute("aria-grabbed","true"),this.setAttribute("data-reorder-mode","");let l=this.draggableChildren;this.#s(`${this.#_(e)}, grabbed. Position ${this.#t+1} of ${l.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`),this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}return}if(!r&&(t.key===a||t.key===i)){t.preventDefault();let l=this.draggableChildren,n=l.indexOf(e),d=t.key===a?Math.max(0,n-1):Math.min(l.length-1,n+1);d!==n&&l[d].focus();return}if(r&&(t.key===a||t.key===i)){t.preventDefault();let l=this.draggableChildren,n=l.indexOf(e),d=t.key===a?Math.max(0,n-1):Math.min(l.length-1,n+1);d!==n&&(this.#g(e,d),e.focus(),this.#s(`Position ${d+1} of ${l.length}`));return}let o=s?"ArrowUp":"ArrowLeft",c=s?"ArrowDown":"ArrowRight";if(r&&(t.key===o||t.key===c)){if(t.preventDefault(),!this.group)return;let l=t.key===c?1:-1,n=this.#w(l);if(!n)return;n.appendChild(e),n.#u(),this.#u(),n.#b(e),e.focus();let d=n.getAttribute("aria-label")||"next surface";n.#s(`Moved to ${d}`),n.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,fromSurface:this,toSurface:n,newIndex:n.draggableChildren.indexOf(e),fromOrder:this.sortedOrder,toOrder:n.sortedOrder}})),this.removeAttribute("data-reorder-mode"),n.setAttribute("data-reorder-mode",""),this.#t=null;return}if(r&&t.key==="Escape"){t.preventDefault(),e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#t!=null&&(this.#g(e,this.#t),e.focus()),this.#s("Reorder cancelled"),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#t=null;return}!r&&t.key==="Escape"&&(t.preventDefault(),e.blur())}#b(t){t.setAttribute("data-just-dropped",""),t.addEventListener("animationend",()=>{t.removeAttribute("data-just-dropped")},{once:!0}),setTimeout(()=>t.removeAttribute("data-just-dropped"),500)}#w(t){if(!this.group)return null;let e=[...document.querySelectorAll(`drag-surface[group="${this.group}"]`)];if(e.length<2)return null;e.sort((a,i)=>{let o=a.getBoundingClientRect(),c=i.getBoundingClientRect();return o.left-c.left||o.top-c.top});let r=e.indexOf(this);return e[r+t]||null}#_(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#m(t){return this.draggableChildren.indexOf(t)}#g(t,e){let s=this.draggableChildren.filter(a=>a!==t)[e]||null;s?this.insertBefore(t,s):this.appendChild(t)}#u(){this.draggableChildren.forEach((t,e)=>{t.dataset.sortOrder=String(e+1)})}#A(t){let e=this.orientation==="horizontal",r=this.draggableChildren.filter(s=>!s.hasAttribute("data-dragging"));for(let s=0;s<r.length;s++){let a=r[s].getBoundingClientRect(),i=e?a.left+a.width/2:a.top+a.height/2;if(t<i)return s}return r.length}#k(t){this.#v();let e=this.orientation==="horizontal",r=this.draggableChildren.filter(s=>!s.hasAttribute("data-dragging"));for(let s=0;s<r.length;s++){let a=r[s].getBoundingClientRect(),i=e?a.left+a.width/2:a.top+a.height/2;if(t<i){r[s].setAttribute("data-drop-target","before");return}}r.length>0&&r[r.length-1].setAttribute("data-drop-target","after")}#v(){for(let t of this.querySelectorAll("[data-drop-target]"))t.removeAttribute("data-drop-target")}static#p=null};b("drag-surface",E);var H=`
  :host {
    display: block;
    font-family: var(--user-persona-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_bg:          var(--user-persona-bg, var(--color-surface, #ffffff));
    --_text:        var(--user-persona-text, var(--color-text, #1a1a1a));
    --_border:      var(--user-persona-border, var(--color-border, #e0e0e0));
    --_muted:       var(--user-persona-muted, var(--color-text-muted, #666));
    --_accent:      var(--user-persona-accent, var(--color-interactive, #0066cc));
    --_card-bg:     var(--user-persona-card-bg, var(--color-surface-raised, #f8f9fa));
    --_radius:      var(--user-persona-radius, var(--radius-xl, 1rem));
    --_avatar-size: var(--user-persona-avatar-size, 80px);
    --_goals:       var(--user-persona-goals, #22c55e);
    --_frustrations: var(--user-persona-frustrations, #ef4444);
    --_behaviors:   var(--user-persona-behaviors, #8b5cf6);
    --_shadow:    var(--user-persona-shadow, var(--shadow-md));
    --_space-2xs: var(--user-persona-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:  var(--user-persona-space-xs, var(--size-xs, 0.5rem));
    --_space-s:   var(--user-persona-space-s, var(--size-s, 0.75rem));
    --_space-m:   var(--user-persona-space-m, var(--size-m, 1rem));
    --_space-l:   var(--user-persona-space-l, var(--size-l, 1.5rem));
    --_font-xs:   var(--user-persona-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:   var(--user-persona-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:   var(--user-persona-font-md, var(--font-size-md, 1rem));
    --_font-2xl:  var(--user-persona-font-2xl, var(--font-size-2xl, 1.5rem));
    --_radius-m:  var(--user-persona-radius-m, var(--radius-m, 0.5rem));
    --_radius-l:  var(--user-persona-radius-l, var(--radius-l, 0.75rem));
  }

  .persona-card {
    background: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    overflow: hidden;
    box-shadow: var(--_shadow);
  }

  .persona-header {
    display: flex;
    align-items: center;
    gap: var(--_space-l);
    padding: var(--_space-l);
    background: var(--_card-bg);
    border-bottom: 1px solid var(--_border);
  }

  :host([compact]) .persona-header {
    padding: var(--_space-m);
    gap: var(--_space-m);
  }

  .avatar {
    width: var(--_avatar-size);
    height: var(--_avatar-size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  :host([compact]) .avatar {
    width: 56px;
    height: 56px;
    font-size: 20px;
  }

  .header-info {
    flex: 1;
    min-width: 0;
  }

  .persona-name {
    font-size: var(--_font-2xl);
    font-weight: 700;
    color: var(--_text);
    margin: 0 0 var(--_space-2xs) 0;
  }

  :host([compact]) .persona-name {
    font-size: 18px;
  }

  .persona-role {
    font-size: var(--_font-md);
    color: var(--_accent);
    font-weight: 500;
    margin: 0;
  }

  :host([compact]) .persona-role {
    font-size: var(--_font-sm);
  }

  .persona-meta {
    display: flex;
    gap: var(--_space-m);
    margin-top: var(--_space-xs);
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--_muted);
  }

  .meta-item svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    opacity: 0.7;
  }

  .persona-quote {
    padding: 20px var(--_space-l);
    background: var(--_card-bg);
    border-bottom: 1px solid var(--_border);
    position: relative;
  }

  :host([compact]) .persona-quote {
    padding: var(--_space-m);
  }

  .quote-mark {
    position: absolute;
    top: 12px;
    left: 16px;
    font-size: 48px;
    line-height: 1;
    color: var(--_accent);
    opacity: 0.2;
    font-family: Georgia, serif;
  }

  .quote-text {
    font-size: var(--_font-md);
    font-style: italic;
    color: var(--_text);
    line-height: 1.6;
    margin: 0;
    padding-left: var(--_space-l);
  }

  :host([compact]) .quote-text {
    font-size: var(--_font-sm);
  }

  .persona-body {
    padding: var(--_space-l);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--_space-l);
  }

  :host([compact]) .persona-body {
    padding: var(--_space-m);
    gap: var(--_space-m);
  }

  .section {
    background: var(--_card-bg);
    border-radius: var(--_radius-l);
    padding: var(--_space-m);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--_space-xs);
    margin-bottom: var(--_space-s);
  }

  .section-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--_radius-m);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .section-icon svg {
    width: 16px;
    height: 16px;
    fill: white;
  }

  .section-icon.bio { background: var(--_accent); }
  .section-icon.goals { background: var(--_goals); }
  .section-icon.frustrations { background: var(--_frustrations); }
  .section-icon.behaviors { background: var(--_behaviors); }

  .section-title {
    font-size: var(--_font-sm);
    font-weight: 600;
    color: var(--_text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-content {
    color: var(--_text);
    font-size: var(--_font-sm);
    line-height: 1.6;
  }

  .section-content ::slotted(ul),
  .section-content ::slotted(ol) {
    margin: 0;
    padding-left: 20px;
  }

  .section-content ::slotted(li) {
    margin-bottom: var(--_space-xs);
  }

  .section-content ::slotted(p) {
    margin: 0;
  }

  @media (max-width: 600px) {
    .persona-header {
      flex-direction: column;
      text-align: center;
    }

    .persona-meta {
      justify-content: center;
    }

    .persona-body {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
    }
  }
`;function u(p){return String(p).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function P(p){return p.split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2)}function O(p){let t=0;for(let r=0;r<p.length;r++)t=p.charCodeAt(r)+((t<<5)-t);return`hsl(${(t%360+360)%360}, 65%, 55%)`}function _(p){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`}var g={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>'},q={says:{label:"Says",icon:g.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:g.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:g.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:g.heart,color:"#ef4444"}},k={delighted:{emoji:"\u{1F604}",score:.95,color:"#16a34a"},satisfied:{emoji:"\u{1F60A}",score:.8,color:"#22c55e"},hopeful:{emoji:"\u{1F642}",score:.68,color:"#84cc16"},curious:{emoji:"\u{1F914}",score:.55,color:"#eab308"},neutral:{emoji:"\u{1F610}",score:.5,color:"#94a3b8"},uncertain:{emoji:"\u{1F615}",score:.4,color:"#f97316"},confused:{emoji:"\u{1F635}",score:.3,color:"#fb923c"},frustrated:{emoji:"\u{1F624}",score:.18,color:"#ef4444"},angry:{emoji:"\u{1F620}",score:.05,color:"#dc2626"}};var S=class extends HTMLElement{static get observedAttributes(){return["name","role","age","location","avatar","quote","compact","src"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#t(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&!this.getAttribute(e)&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();for(let s of["name","role","age","location","avatar","quote"])r[s]&&this.setAttribute(s,r[s]);for(let s of["bio","goals","frustrations","behaviors"])r[s]&&(Array.isArray(r[s])?this.#e.set(s,r[s]):this.#e.set(s,r[s]));this.#a()}catch(e){console.warn(`[user-persona] Failed to load src="${t}":`,e)}}connectedCallback(){this.#t(),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#a(),this.setAttribute("data-upgraded",""),this.dispatchEvent(new CustomEvent("persona-ready",{bubbles:!0,composed:!0,detail:{name:this.personaName,role:this.personaRole}}))}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,r){e!==r&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(r):this.#a())}get personaName(){return this._resolve("name")||"Unnamed Persona"}get personaRole(){return this._resolve("role")||""}get age(){return this._resolve("age")||""}get location(){return this._resolve("location")||""}get avatar(){return this._resolve("avatar")||""}get quote(){return this._resolve("quote")||""}get compact(){return this.hasAttribute("compact")}#a(){let t=this.personaName,e=this.personaRole,r=this.age,s=this.location,a=this.avatar,i=this.quote,o=O(t),c=a?`background:url(${u(a)}) center/cover`:`background:${o}`;this.shadowRoot.innerHTML=`
      <style>${H}</style>

      <article class="persona-card" part="card" role="article"
        aria-label="User persona: ${u(t)}">

        <header class="persona-header" part="header">
          <div class="avatar" part="avatar" style="${c}"
            role="img" aria-label="Avatar for ${u(t)}">
            ${a?"":u(P(t))}
          </div>
          <div class="header-info">
            <h2 class="persona-name" part="name">${u(t)}</h2>
            ${e?`<p class="persona-role" part="role">${u(e)}</p>`:""}
            <div class="persona-meta" part="meta">
              ${r?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  ${u(r)} years old
                </span>
              `:""}
              ${s?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  ${u(s)}
                </span>
              `:""}
            </div>
          </div>
        </header>

        ${i?`
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <p class="quote-text">${u(i)}</p>
          </div>
        `:""}

        <div class="persona-body" part="body">
          <div class="section" part="section-bio">
            <div class="section-header">
              <div class="section-icon bio" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <span class="section-title">Background</span>
            </div>
            <div class="section-content">
              <slot name="bio">No background information provided.</slot>
            </div>
          </div>

          <div class="section" part="section-goals">
            <div class="section-header">
              <div class="section-icon goals" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <span class="section-title">Goals</span>
            </div>
            <div class="section-content">
              <slot name="goals">No goals specified.</slot>
            </div>
          </div>

          <div class="section" part="section-frustrations">
            <div class="section-header">
              <div class="section-icon frustrations" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <span class="section-title">Frustrations</span>
            </div>
            <div class="section-content">
              <slot name="frustrations">No frustrations listed.</slot>
            </div>
          </div>

          <div class="section" part="section-behaviors">
            <div class="section-header">
              <div class="section-icon behaviors" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              </div>
              <span class="section-title">Behaviors</span>
            </div>
            <div class="section-content">
              <slot name="behaviors">No behaviors documented.</slot>
            </div>
          </div>
        </div>
      </article>
    `}};b("user-persona",S);var z=`
:host {
  --_bg:        var(--user-story-bg, var(--color-surface, #ffffff));
  --_text:      var(--user-story-text, var(--color-text, #1a1a1a));
  --_muted:     var(--user-story-muted, var(--color-text-muted, #666));
  --_border:    var(--user-story-border, var(--color-border, #e0e0e0));
  --_accent:    var(--user-story-accent, var(--color-interactive, #0066cc));
  --_card-bg:   var(--user-story-card-bg, var(--color-surface-raised, #f8f9fa));
  --_highlight: var(--user-story-highlight, color-mix(in srgb, var(--_accent) 8%, transparent));
  --_radius:    var(--user-story-radius, var(--radius-l, 0.75rem));
  --_shadow:       var(--user-story-shadow, var(--shadow-sm));
  --_shadow-hover: var(--user-story-shadow-hover, var(--shadow-md));
  --_duration:     var(--user-story-duration, var(--duration-normal, 200ms));
  --_ease:         var(--user-story-ease, var(--ease-default, ease));
  --_space-xs:     var(--user-story-space-xs, var(--size-xs, 0.5rem));
  --_space-s:      var(--user-story-space-s, var(--size-s, 0.75rem));
  --_space-m:      var(--user-story-space-m, var(--size-m, 1rem));
  --_font-xs:      var(--user-story-font-xs, var(--font-size-xs, 0.75rem));
  --_font-sm:      var(--user-story-font-sm, var(--font-size-sm, 0.875rem));
  --_font-md:      var(--user-story-font-md, var(--font-size-md, 1rem));
  --_font-lg:      var(--user-story-font-lg, var(--font-size-lg, 1.125rem));
  --_font-mono:    var(--user-story-font-mono, var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace));
  --_radius-s:     var(--user-story-radius-s, var(--radius-s, 0.25rem));
  --_radius-full:  var(--user-story-radius-full, var(--radius-full, 9999px));

  display: block;
  font-family: var(--user-story-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
}

.story-card {
  background: var(--_bg);
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  overflow: hidden;
  box-shadow: var(--_shadow);
  transition: box-shadow var(--_duration) var(--_ease), transform var(--_duration) var(--_ease);
}

.story-card:hover {
  box-shadow: var(--_shadow-hover);
}

.story-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--_space-s) var(--_space-m);
  background: var(--_card-bg);
  border-bottom: 1px solid var(--_border);
  gap: var(--_space-s);
  flex-wrap: wrap;
}

.story-meta {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  flex-wrap: wrap;
}

.story-id {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  font-family: var(--_font-mono);
}

.epic-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--_radius-s);
  background: var(--_highlight);
  color: var(--_accent);
  font-weight: 500;
}

.story-badges {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
}

.priority-badge,
.status-badge {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: var(--_radius-full);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.points-badge {
  width: 28px;
  height: 28px;
  border-radius: var(--_radius-full);
  background: var(--_accent);
  color: white;
  font-size: var(--_font-xs);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-body {
  padding: 20px;
}

:host([compact]) .story-body {
  padding: var(--_space-m);
}

.story-statement {
  font-size: var(--_font-lg);
  line-height: 1.6;
  color: var(--_text);
  margin: 0;
}

:host([compact]) .story-statement {
  font-size: 15px;
}

.keyword {
  font-weight: 600;
  color: var(--_accent);
}

.persona-text {
  background: var(--_highlight);
  padding: 2px 6px;
  border-radius: var(--_radius-s);
  font-weight: 500;
}

.action-text {
  font-weight: 500;
}

.benefit-text {
  font-style: italic;
  color: var(--_muted);
}

.story-sections {
  border-top: 1px solid var(--_border);
}

.section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--_border);
}

.section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  margin-bottom: var(--_space-s);
}

.section-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--_accent);
}

.section-icon svg {
  width: 14px;
  height: 14px;
  fill: white;
}

/* Semantic section-icon colors (hardcoded by intent) */
.section-icon.acceptance { background: #22c55e; }
.section-icon.notes      { background: #f59e0b; }
.section-icon.tasks      { background: #8b5cf6; }

.section-title {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  color: var(--_text);
  font-size: var(--_font-sm);
  line-height: 1.6;
}

/* Slotted content styling */
.section-content ::slotted(ul),
.section-content ::slotted(ol) {
  margin: 0;
  padding-left: 20px;
}

.section-content ::slotted(li) {
  margin-bottom: 6px;
}

.section-content ::slotted(p) {
  margin: 0;
}

/* Empty-slot fallback */
.slot-fallback {
  color: var(--_muted);
  font-style: italic;
}

@media (max-width: 480px) {
  .story-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .story-badges {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-card {
    transition: none;
  }
}

/* Minimal detail level */
:host([detail="minimal"]) .story-card {
  padding: var(--_space-xs);
}

:host([detail="minimal"]) .story-header {
  display: none;
}

:host([detail="minimal"]) .story-sections {
  display: none;
}

:host([detail="minimal"]) .story-body {
  padding: var(--_space-xs) var(--_space-s);
}

:host([detail="minimal"]) .story-card {
  cursor: pointer;
}

:host([detail="minimal"]) .story-card:hover {
  box-shadow: var(--_shadow-hover);
}

:host([detail="minimal"]) .story-card:focus-visible {
  outline: 2px solid var(--_accent);
  outline-offset: 2px;
}

:host([detail="minimal"]) .story-statement {
  font-size: var(--_font-sm);
  margin: 0;
}

:host([detail="minimal"]) .story-id {
  display: block;
  margin-bottom: var(--_space-2xs);
}

:host([detail="minimal"]) .benefit-text {
  display: none;
}

/* Compact detail level \u2014 hide empty sections */
:host([detail="compact"]) .section[data-empty] {
  display: none;
}

:host([detail="compact"]) .slot-fallback {
  display: none;
}
`;var j=class p extends HTMLElement{static get observedAttributes(){return["persona","action","benefit","priority","points","status","epic","story-id","title","compact","detail","src"]}static PRIORITIES={critical:{label:"Critical",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"},high:{label:"High",color:"#ea580c",bg:"rgba(234, 88, 12, 0.1)"},medium:{label:"Medium",color:"#ca8a04",bg:"rgba(202, 138, 4, 0.1)"},low:{label:"Low",color:"#16a34a",bg:"rgba(22, 163, 74, 0.1)"}};static STATUSES={backlog:{label:"Backlog",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"},"to-do":{label:"To Do",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},"in-progress":{label:"In Progress",color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.1)"},review:{label:"Review",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},done:{label:"Done",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"}};#e=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#t(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&!this.getAttribute(e)&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();for(let[s,a]of[["storyId","story-id"],["persona","persona"],["action","action"],["benefit","benefit"],["priority","priority"],["status","status"],["points","points"],["epic","epic"],["title","title"],["detail","detail"]])r[s]!=null&&this.setAttribute(a,String(r[s]));for(let s of["acceptanceCriteria","tasks","notes"])r[s]&&this.#e.set(s==="acceptanceCriteria"?"acceptance-criteria":s,r[s]);this.#a()}catch(e){console.warn(`[user-story] Failed to load src="${t}":`,e)}}connectedCallback(){this.#t(),this.storyId&&!this.id&&(this.id=this.storyId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#a(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,r){e!==r&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(r):this.#a())}get persona(){return this._resolve("persona")||"user"}get action(){return this._resolve("action")||""}get benefit(){return this._resolve("benefit")||""}get priority(){return this.getAttribute("priority")||"medium"}get points(){return this.getAttribute("points")||""}get status(){return this.getAttribute("status")||"backlog"}get epic(){return this._resolve("epic")||""}get storyId(){return this._resolve("story-id")||""}get storyTitle(){return this._resolve("title")||""}get _minimalLabel(){if(this.storyTitle)return this.storyTitle;let t=this.action;return t.length>40?t.slice(0,40)+"\u2026":t}get compact(){return this.hasAttribute("compact")}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}updateStatus(t){p.STATUSES[t]&&(this.setAttribute("status",t),this.dispatchEvent(new CustomEvent("status-changed",{detail:{status:t,storyId:this.storyId},bubbles:!0,composed:!0})))}updatePriority(t){p.PRIORITIES[t]&&(this.setAttribute("priority",t),this.dispatchEvent(new CustomEvent("priority-changed",{detail:{priority:t,storyId:this.storyId},bubbles:!0,composed:!0})))}showDetail(){let t=`story-dialog-${this.storyId||this.id||"detail"}`,e=document.getElementById(t);e||(e=document.createElement("dialog"),e.id=t,e.setAttribute("data-size","l"),document.body.appendChild(e));let r=document.createElement("form");r.method="dialog";let s=document.createElement("header"),a=document.createElement("h3");a.textContent=this.storyTitle||this.storyId||"Story Detail";let i=document.createElement("button");i.type="submit",i.setAttribute("aria-label","Close"),i.textContent="\xD7",s.appendChild(a),s.appendChild(i);let o=document.createElement("section"),c=document.createElement("user-story");for(let n of this.getAttributeNames())n==="detail"||n==="compact"||n==="data-upgraded"||n==="draggable"||n==="data-id"||n==="data-quadrant"||c.setAttribute(n,this.getAttribute(n));let l=[...this.children].some(n=>n.getAttribute("slot")&&n.tagName!=="DIALOG");c.setAttribute("detail",l?"full":"compact"),c.removeAttribute("id");for(let n of[...this.children])n.tagName!=="DIALOG"&&c.appendChild(n.cloneNode(!0));o.appendChild(c),r.appendChild(s),r.appendChild(o),e.innerHTML="",e.appendChild(r),e.addEventListener("close",()=>{e.innerHTML=""},{once:!0}),e.showModal()}#a(){let t=p.PRIORITIES[this.priority]||p.PRIORITIES.medium,e=p.STATUSES[this.status]||p.STATUSES.backlog,r=this._detailLevel,s=this.storyId?`User story: ${u(this.storyId)}`:"User story";if(r==="minimal"){this.shadowRoot.innerHTML=`
        <style>${z}</style>
        <article class="story-card story-card--minimal" role="article" aria-label="${s}"
          tabindex="0" title="Click to view full story">
          <div class="story-body">
            ${this.storyId?`<span class="story-id">${u(this.storyId)}</span>`:""}
            <p class="story-statement story-statement--minimal">${u(this._minimalLabel||"[describe the action]")}</p>
          </div>
        </article>
      `;let a=this.shadowRoot.querySelector(".story-card--minimal");a.addEventListener("click",()=>this.showDetail()),a.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),this.showDetail())})}else this.shadowRoot.innerHTML=`
        <style>${z}</style>

        <article class="story-card story-card--${r}" part="card" role="article" aria-label="${s}">
          <header class="story-header" part="header">
            <div class="story-meta">
              ${this.storyId?`<span class="story-id" part="id">${u(this.storyId)}</span>`:""}
              ${this.epic?`<span class="epic-badge" part="epic">${u(this.epic)}</span>`:""}
            </div>
            <div class="story-badges">
              <span class="priority-badge" part="priority"
                style="color: ${t.color}; background: ${t.bg};"
              >${u(t.label)}</span>
              <span class="status-badge" part="status"
                style="color: ${e.color}; background: ${e.bg};"
              >${u(e.label)}</span>
              ${this.points?`<span class="points-badge" part="points" title="Story points">${u(this.points)}</span>`:""}
            </div>
          </header>

          <div class="story-body" part="body">
            <p class="story-statement" part="statement">
              <span class="keyword">As a</span>
              <span class="persona-text">${u(this.persona)}</span>,
              <span class="keyword">I want</span>
              <span class="action-text">${u(this.action||"[describe the action]")}</span>${this.benefit?`
              <span class="keyword">so that</span>
              <span class="benefit-text">${u(this.benefit)}</span>`:""}
            </p>
          </div>

          <div class="story-sections" part="sections">
            <div class="section" part="section">
              <div class="section-header">
                <div class="section-icon acceptance">
                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <span class="section-title">Acceptance Criteria</span>
              </div>
              <div class="section-content">
                <slot name="acceptance-criteria">
                  <em class="slot-fallback">No acceptance criteria defined.</em>
                </slot>
              </div>
            </div>

            <div class="section" part="section">
              <div class="section-header">
                <div class="section-icon tasks">
                  <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                </div>
                <span class="section-title">Tasks</span>
              </div>
              <div class="section-content">
                <slot name="tasks">
                  <em class="slot-fallback">No tasks added yet.</em>
                </slot>
              </div>
            </div>

            <div class="section" part="section">
              <div class="section-header">
                <div class="section-icon notes">
                  <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </div>
                <span class="section-title">Notes</span>
              </div>
              <div class="section-content">
                <slot name="notes">
                  <em class="slot-fallback">No additional notes.</em>
                </slot>
              </div>
            </div>
          </div>
        </article>
      `,r==="compact"&&this.shadowRoot.querySelectorAll(".section").forEach(i=>{let o=i.querySelector("slot");o&&o.assignedNodes().length===0&&i.setAttribute("data-empty","")});this.dispatchEvent(new CustomEvent("story-ready",{detail:{id:this.storyId,persona:this.persona,action:this.action,benefit:this.benefit,priority:this.priority,status:this.status,points:this.points},bubbles:!0,composed:!0}))}};b("user-story",j);var C=`
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

  /* Title & summary */
  .journey__title {
    font-size: var(--_font-xl);
    font-weight: 700;
    color: var(--_text);
    margin-block-end: var(--_space-2xs);
  }

  .journey--compact .journey__title { font-size: var(--_font-md); }

  .journey__summary {
    font-size: var(--_font-sm);
    color: var(--_muted);
    max-width: 72ch;
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
`;var B=[{key:"actions",label:"Actions"},{key:"thoughts",label:"Thoughts"},{key:"touchpoints",label:"Touchpoints"},{key:"painPoints",label:"Pain Points"},{key:"opportunities",label:"Opportunities"}],I=class extends HTMLElement{static get observedAttributes(){return["src","title","persona","persona-id","summary","story-ids","compact"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__phases=null}get phases(){return this.__phases}set phases(t){this.__phases=t,this.isConnected&&this._render()}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${C}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();r.title&&this.setAttribute("title",r.title),r.persona&&this.setAttribute("persona",r.persona),r.personaId&&this.setAttribute("persona-id",r.personaId),r.summary&&this.setAttribute("summary",r.summary),this.__phases=r.phases||[],this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${C}</style><div class="state-msg state-msg--error">Could not load journey: ${u(e.message)}</div>`}}}_render(){let t=this._resolve("title")||"User Journey",e=this._resolve("persona")||"",r=this._resolve("persona-id")||"",s=this._resolve("summary")||"",a=(this._resolve("story-ids")||"").split(",").map(c=>c.trim()).filter(Boolean),i=this.hasAttribute("compact"),o=this.__phases;this.shadowRoot.innerHTML=`<style>${C}</style>
      <article class="journey${i?" journey--compact":""}">

        <header class="journey__header">
          <div class="journey__header-top">
            <div class="journey__chips">
              <span class="chip chip--type">Journey Map</span>
              ${a.map(c=>`<a class="chip chip--story" href="#${c}">${this._label(c)}</a>`).join("")}
            </div>
            ${e?`
              <div class="journey__persona">
                ${r?`<a class="persona-ref" href="#${r}">${_(g.user)} ${u(e)}</a>`:`<span class="persona-ref">${_(g.user)} ${u(e)}</span>`}
              </div>`:""}
          </div>
          <h2 class="journey__title">${u(t)}</h2>
          ${s?`<p class="journey__summary">${u(s)}</p>`:""}
        </header>

        ${o&&o.length?this._curve(o)+this._grid(o):`<div class="journey__placeholder">
               <p>Add phase data via <code>src</code> (JSON) or set <code>.phases</code> programmatically.</p>
             </div>`}

      </article>`,this.dispatchEvent(new CustomEvent("journey-ready",{bubbles:!0,composed:!0,detail:{title:t,persona:e,phaseCount:o?o.length:0}}))}_curve(t){let c=t.length,l=h=>28+(c<2?944/2:h/(c-1)*944),n=h=>14+(1-(k[h.emotion]||k.neutral).score)*72,d=t.map((h,x)=>({x:l(x),y:n(h),ph:h})),m=`M ${d[0].x},${d[0].y}`;for(let h=1;h<d.length;h++){let x=d[h-1],v=d[h],w=(x.x+v.x)/2;m+=` C ${w},${x.y} ${w},${v.y} ${v.x},${v.y}`}let f=`uj-${Math.random().toString(36).slice(2,8)}`,y=d.at(-1);return`
      <div class="journey__curve" aria-hidden="true">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" class="curve-svg">
          <defs>
            <linearGradient id="${f}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#6366f1" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0"             y="0"          width="1000" height="${100*.4}"  class="zone zone--pos"/>
          <rect x="0"             y="${100*.4}" width="1000" height="${100*.2}"  class="zone zone--neu"/>
          <rect x="0"             y="${100*.6}" width="1000" height="${100*.4}"  class="zone zone--neg"/>
          ${d.map(({x:h})=>`<line x1="${h}" y1="0" x2="${h}" y2="100" class="vline"/>`).join("")}
          <path d="${m} L ${y.x},100 L ${d[0].x},100 Z" fill="url(#${f})"/>
          <path d="${m}" fill="none" class="curve-line"/>
          ${d.map(({x:h,y:x,ph:v})=>{let w=k[v.emotion]||k.neutral;return`<circle cx="${h}" cy="${x}" r="5" class="dot" style="fill:${w.color}"/>`}).join("")}
        </svg>
      </div>`}_grid(t){let e=t.map((s,a)=>{let i=k[s.emotion]||k.neutral,o=s.storyIds||[];return`
        <th class="phase-head" data-emotion="${s.emotion||"neutral"}"
            style="--ec:${i.color}">
          <span class="ph-num">${a+1}</span>
          <span class="ph-name">${u(s.name||"")}</span>
          <span class="ph-emoji" title="${s.emotion||"neutral"}"><span role="img" aria-label="${u(s.emotion||"neutral")}">${i.emoji}</span></span>
          ${o.length?`<div class="ph-stories">${o.map(c=>`<a class="chip chip--story" href="#${c}">${this._label(c)}</a>`).join("")}</div>`:""}
        </th>`}).join(""),r=B.map(({key:s,label:a})=>{let i=t.map(o=>{let c=o[s]||[];return c.length?`<td class="data-cell data-cell--${s.toLowerCase()}">
          ${c.map(l=>`<p>${u(l)}</p>`).join("")}
        </td>`:'<td class="data-cell data-cell--empty">\u2014</td>'}).join("");return`
        <tr class="grid-row grid-row--${s.toLowerCase()}">
          <th class="row-label">${a}</th>
          ${i}
        </tr>`}).join("");return`
      <div class="journey__grid-wrap">
        <table class="journey__grid"
               aria-label="${u(this.getAttribute("title")||"User Journey")} \u2014 phase breakdown">
          <thead>
            <tr>
              <th class="corner">Stage</th>
              ${e}
            </tr>
          </thead>
          <tbody>${r}</tbody>
        </table>
      </div>`}_label(t){return t.replace(/^(activity|persona|journey|story|user)-/,"").replace(/-/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};b("user-journey",I);var $=`
  :host {
    display: block;
    font-family: var(--_font-sans);
    line-height: 1.6;
    color: var(--_text);
    container-type: inline-size;

    --_bg:     var(--empathy-map-bg, var(--color-surface, #ffffff));
    --_card:   var(--empathy-map-card, var(--color-surface-raised, #f8f9fa));
    --_border: var(--empathy-map-border, var(--color-border, #e0e0e0));
    --_muted:  var(--empathy-map-muted, var(--color-text-muted, #666666));
    --_text:   var(--empathy-map-text, var(--color-text, #1a1a1a));
    --_radius: var(--empathy-map-radius, var(--radius-xl, 1rem));
    --_accent: var(--empathy-map-accent, var(--color-interactive, #0066cc));
    --_says:   var(--empathy-map-says, #3b82f6);
    --_thinks: var(--empathy-map-thinks, #8b5cf6);
    --_does:   var(--empathy-map-does, #f59e0b);
    --_feels:  var(--empathy-map-feels, #ef4444);
    --_font-sans:    var(--empathy-map-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_font-xs:      var(--empathy-map-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:      var(--empathy-map-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:      var(--empathy-map-font-md, var(--font-size-md, 1rem));
    --_font-xl:      var(--empathy-map-font-xl, var(--font-size-xl, 1.25rem));
    --_space-2xs:    var(--empathy-map-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:     var(--empathy-map-space-xs, var(--size-xs, 0.5rem));
    --_space-s:      var(--empathy-map-space-s, var(--size-s, 0.75rem));
    --_space-m:      var(--empathy-map-space-m, var(--size-m, 1rem));
    --_space-l:      var(--empathy-map-space-l, var(--size-l, 1.5rem));
    --_radius-m:     var(--empathy-map-radius-m, var(--radius-m, 0.5rem));
    --_radius-full:  var(--empathy-map-radius-full, var(--radius-full, 9999px));
    --_duration:     var(--empathy-map-duration, var(--duration-normal, 200ms));
    --_duration-fast: var(--empathy-map-duration-fast, var(--duration-fast, 100ms));
    --_ease:         var(--empathy-map-ease, var(--ease-default, ease));
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  /* \u2500\u2500 Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map {
    background: var(--_card);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    overflow: hidden;
  }

  /* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__header {
    padding: 20px 24px 16px 28px;
    border-block-end: 1px solid var(--_border);
    position: relative;
  }

  /* Left accent bar */
  .empathy-map__header::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 4px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
  }

  .empathy-map__header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--_space-s);
    flex-wrap: wrap;
    margin-block-end: var(--_space-xs);
  }

  .empathy-map__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  /* \u2500\u2500 Chips \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .chip {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 2px 9px;
    border-radius: var(--_radius-full);
    text-decoration: none;
    line-height: 1.6;
  }

  .chip--type {
    color: #6366f1;
    background: #ede9fe;
  }

  @media (prefers-color-scheme: dark) {
    .chip--type { color: #a78bfa; background: #2e1065; }
  }

  /* \u2500\u2500 Persona ref \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

  .persona-ref svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  a.persona-ref:hover { color: #6366f1; text-decoration: underline; }

  /* \u2500\u2500 Title & summary \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__title {
    font-size: var(--_font-xl);
    font-weight: 700;
    color: var(--_text);
    margin-block-end: var(--_space-2xs);
  }

  .empathy-map__summary {
    font-size: var(--_font-sm);
    color: var(--_muted);
    max-width: 72ch;
  }

  /* \u2500\u2500 Grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--_border);
  }

  /* \u2500\u2500 Quadrant \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant {
    background: var(--_card);
    padding: 0;
    position: relative;
    display: grid;
  }

  .quadrant::before {
    content: '';
    position: absolute;
    inset-block-start: 0;
    inset-inline: 0;
    height: 3px;
  }

  .quadrant--says::before   { background: var(--_says); }
  .quadrant--thinks::before { background: var(--_thinks); }
  .quadrant--does::before   { background: var(--_does); }
  .quadrant--feels::before  { background: var(--_feels); }

  .quadrant__inner {
    display: grid;
    padding: 16px 20px;
    padding-block-start: 19px; /* 16 + 3px top border */
  }

  /* \u2500\u2500 Quadrant header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-block-end: var(--_space-s);
  }

  .quadrant__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--_radius-m);
    flex-shrink: 0;
  }

  .quadrant__icon svg {
    width: 16px;
    height: 16px;
  }

  .quadrant--says   .quadrant__icon { background: #dbeafe; color: var(--_says); }
  .quadrant--thinks .quadrant__icon { background: #ede9fe; color: var(--_thinks); }
  .quadrant--does   .quadrant__icon { background: #fef3c7; color: var(--_does); }
  .quadrant--feels  .quadrant__icon { background: #fee2e2; color: var(--_feels); }

  @media (prefers-color-scheme: dark) {
    .quadrant--says   .quadrant__icon { background: #1e3a5f; }
    .quadrant--thinks .quadrant__icon { background: #2e1065; }
    .quadrant--does   .quadrant__icon { background: #451a03; }
    .quadrant--feels  .quadrant__icon { background: #450a0a; }
  }

  .quadrant__label {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--_muted);
    flex: 1;
  }

  /* \u2500\u2500 Quadrant content / faces \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__face {
    grid-area: 1 / 1;
    transition: opacity var(--_duration) var(--_ease), transform var(--_duration) var(--_ease);
  }

  .quadrant__face--front {
    opacity: 1;
    transform: scale(1);
  }

  .quadrant__face--back {
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
  }

  [data-editing] .quadrant__face--front {
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
  }

  [data-editing] .quadrant__face--back {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  .quadrant__content {
    font-size: 14px;
    line-height: 1.55;
    color: var(--_text);
  }

  .quadrant__content p {
    margin-block: 0 6px;
  }

  .quadrant__content p:last-child {
    margin-block-end: 0;
  }

  /* \u2500\u2500 Slot fallback / placeholder \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .placeholder {
    font-size: 13px;
    color: var(--_muted);
    font-style: italic;
  }

  ::slotted(ul),
  ::slotted(ol) {
    margin: 0;
    padding-inline-start: 1.4em;
    font-size: 14px;
    line-height: 1.55;
  }

  /* \u2500\u2500 Emotion tags \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .emotion-tag {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: var(--_radius-full);
    margin-block-end: 6px;
    margin-inline-end: 4px;
    background: color-mix(in srgb, var(--ec, #94a3b8) 15%, transparent);
    color: var(--ec, #94a3b8);
    border: 1px solid color-mix(in srgb, var(--ec, #94a3b8) 30%, transparent);
  }

  /* \u2500\u2500 Edit / Done buttons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__edit-btn,
  .quadrant__done-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--_border);
    border-radius: 6px;
    background: var(--_bg);
    color: var(--_muted);
    cursor: pointer;
    line-height: 1;
    padding: 0;
    flex-shrink: 0;
    transition: background var(--_duration-fast) var(--_ease), color var(--_duration-fast) var(--_ease);
  }

  .quadrant__edit-btn svg,
  .quadrant__done-btn svg {
    width: 14px;
    height: 14px;
  }

  .quadrant__edit-btn:hover,
  .quadrant__done-btn:hover {
    background: var(--_border);
    color: var(--_text);
  }

  .quadrant__done-btn {
    margin-block-start: 8px;
    width: auto;
    padding: 0 12px;
    font-size: 12px;
    font-weight: 600;
    gap: 4px;
  }

  /* \u2500\u2500 Editor textarea \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .quadrant__editor {
    width: 100%;
    min-height: 100px;
    padding: 10px 12px;
    border: 1px solid var(--_border);
    border-radius: var(--_radius-m);
    font-family: inherit;
    font-size: 13px;
    line-height: 1.55;
    color: var(--_text);
    background: var(--_bg);
    resize: vertical;
  }

  .quadrant__editor:focus {
    outline: 2px solid var(--_accent);
    outline-offset: -1px;
    border-color: var(--_accent);
  }

  /* \u2500\u2500 Footer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__footer {
    display: flex;
    gap: 1px;
    background: var(--_border);
    border-block-start: 1px solid var(--_border);
  }

  .summary-row {
    flex: 1;
    background: var(--_card);
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .summary-row__icon {
    line-height: 1;
    flex-shrink: 0;
    margin-block-start: 2px;
    color: var(--_muted);
  }

  .summary-row__icon svg {
    width: 18px;
    height: 18px;
  }

  .summary-row__body {
    flex: 1;
    min-width: 0;
  }

  .summary-row__label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--_muted);
    margin-block-end: 4px;
  }

  .summary-row__content {
    font-size: 14px;
    line-height: 1.55;
    color: var(--_text);
  }

  .summary-row__content p {
    margin-block: 0 4px;
  }

  .summary-row__content p:last-child {
    margin-block-end: 0;
  }

  /* \u2500\u2500 Compact variant \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([compact]) .empathy-map__header {
    padding: 14px 18px 12px 22px;
  }

  :host([compact]) .empathy-map__title {
    font-size: 16px;
  }

  :host([compact]) .empathy-map__summary {
    font-size: 12px;
  }

  :host([compact]) .quadrant__inner {
    padding: 12px 14px;
    padding-block-start: 15px;
  }

  :host([compact]) .quadrant__icon {
    width: 26px;
    height: 26px;
    font-size: 13px;
    border-radius: 6px;
  }

  :host([compact]) .quadrant__label {
    font-size: 11px;
  }

  :host([compact]) .quadrant__content {
    font-size: 12px;
  }

  :host([compact]) .summary-row {
    padding: 12px 14px;
  }

  :host([compact]) .summary-row__content {
    font-size: 12px;
  }

  /* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @container (max-width: 500px) {
    .empathy-map__grid {
      grid-template-columns: 1fr;
    }

    .empathy-map__header {
      padding: 14px 16px 12px 20px;
    }

    .empathy-map__title {
      font-size: 17px;
    }

    .empathy-map__footer {
      flex-direction: column;
    }
  }

  /* \u2500\u2500 Motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media (prefers-reduced-motion: reduce) {
    .quadrant__face {
      transition: none;
    }

    .quadrant__edit-btn,
    .quadrant__done-btn {
      transition: none;
    }
  }

  /* \u2500\u2500 Print \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media print {
    .empathy-map {
      break-inside: avoid;
      border-color: #ccc;
    }

    .quadrant__edit-btn,
    .quadrant__done-btn {
      display: none;
    }

    .quadrant__face--back {
      display: none;
    }

    .empathy-map__footer {
      flex-direction: column;
    }
  }

  /* \u2500\u2500 Utility \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .state-msg        { padding: var(--_space-l); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
  .state-msg--error { color: #dc2626; }
  code { font-family: Monaco, Menlo, monospace; font-size: 0.88em; }
`;var L=["says","thinks","does","feels"],T=class extends HTMLElement{static get observedAttributes(){return["title","persona","persona-id","summary","src","editable","compact"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__quadrants=null,this.__goals=null,this.__painPoints=null,this._editingQuadrants=new Set}get quadrants(){return this.__quadrants}set quadrants(t){this.__quadrants=t,this.isConnected&&this._render()}get goals(){return this.__goals}set goals(t){this.__goals=t,this.isConnected&&this._render()}get painPoints(){return this.__painPoints}set painPoints(t){this.__painPoints=t,this.isConnected&&this._render()}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}editQuadrant(t){L.includes(t)&&this.hasAttribute("editable")&&this._openEdit(t)}closeQuadrant(t){L.includes(t)&&this._closeEdit(t)}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${$}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();r.title&&this.setAttribute("title",r.title),r.persona&&this.setAttribute("persona",r.persona),r.personaId&&this.setAttribute("persona-id",r.personaId),r.summary&&this.setAttribute("summary",r.summary),this.__quadrants=r.quadrants||null,this.__goals=r.goals||null,this.__painPoints=r.painPoints||null,this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${$}</style><div class="state-msg state-msg--error">Could not load empathy map: ${u(e.message)}</div>`}}}_render(){let t=this._resolve("title")||"Empathy Map",e=this._resolve("persona")||"",r=this._resolve("persona-id")||"",s=this._resolve("summary")||"",a=this.hasAttribute("compact"),i=this.hasAttribute("editable"),o=this.__goals?.length||this.querySelector('[slot="goals"]'),c=this.__painPoints?.length||this.querySelector('[slot="pain-points"]');this.shadowRoot.innerHTML=`<style>${$}</style>
      <article class="empathy-map${a?" empathy-map--compact":""}">

        <header class="empathy-map__header">
          <div class="empathy-map__header-top">
            <div class="empathy-map__chips">
              <span class="chip chip--type">Empathy Map</span>
            </div>
            ${e?`
              <div class="empathy-map__persona">
                ${r?`<a class="persona-ref" href="#${u(r)}">${_(g.user)} ${u(e)}</a>`:`<span class="persona-ref">${_(g.user)} ${u(e)}</span>`}
              </div>`:""}
          </div>
          <h2 class="empathy-map__title">${u(t)}</h2>
          ${s?`<p class="empathy-map__summary">${u(s)}</p>`:""}
        </header>

        <div class="empathy-map__grid">
          ${L.map(l=>this._renderQuadrant(l,i)).join("")}
        </div>

        ${o||c?`
          <footer class="empathy-map__footer">
            ${this._renderSummaryRow("goals",_(g.target),"Goals")}
            ${this._renderSummaryRow("pain-points",_(g.alertTriangle),"Pain Points")}
          </footer>
        `:""}

      </article>`,i&&this._bindEditListeners(),this.dispatchEvent(new CustomEvent("empathy-map:ready",{bubbles:!0,composed:!0,detail:{title:t,persona:e}}))}_renderQuadrant(t,e){let r=q[t],s=this.__quadrants?.[t],a=this._editingQuadrants.has(t),i=s&&s.length?t==="feels"?s.map(c=>this._renderEmotion(c)).join(""):s.map(c=>`<p>${u(c)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">Add ${r.label.toLowerCase()} items\u2026</p></slot>`,o=s?.length?s.join(`
`):"";return`
      <section class="quadrant quadrant--${t}"${a?" data-editing":""}>
        <div class="quadrant__inner">
          <div class="quadrant__header">
            <div class="quadrant__icon" aria-hidden="true">${_(r.icon)}</div>
            <span class="quadrant__label">${r.label}</span>
            ${e?`<button class="quadrant__edit-btn" data-quadrant="${t}"
              aria-label="Edit ${r.label}" title="Edit ${r.label}">${_(g.pencil)}</button>`:""}
          </div>
          <div class="quadrant__faces">
            <div class="quadrant__face quadrant__face--front"${a?" inert":""}>
              <div class="quadrant__content">
                ${i}
              </div>
            </div>
            ${e?`
              <div class="quadrant__face quadrant__face--back"${a?"":" inert"}>
                <textarea class="quadrant__editor" data-quadrant="${t}"
                  placeholder="One item per line\u2026"
                  aria-label="Edit ${r.label} items">${u(o)}</textarea>
                <button class="quadrant__done-btn" data-quadrant="${t}"
                  aria-label="Done editing ${r.label}">${_(g.check)} Done</button>
              </div>
            `:""}
          </div>
        </div>
      </section>`}_renderEmotion(t){let e=t.toLowerCase().trim(),r=k[e];return r?`<span class="emotion-tag" style="--ec:${r.color}"><span role="img" aria-label="${u(t)}">${r.emoji}</span> ${u(t)}</span>`:`<p>${u(t)}</p>`}_renderSummaryRow(t,e,r){let a=(t==="pain-points"?"painPoints":t)==="painPoints"?this.__painPoints:this.__goals,i=a?.length?a.map(o=>`<p>${u(o)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">No ${r.toLowerCase()} specified.</p></slot>`;return`
      <div class="summary-row">
        <span class="summary-row__icon" aria-hidden="true">${e}</span>
        <div class="summary-row__body">
          <div class="summary-row__label">${r}</div>
          <div class="summary-row__content">${i}</div>
        </div>
      </div>`}_bindEditListeners(){let t=this.shadowRoot;t.querySelectorAll(".quadrant__edit-btn").forEach(e=>{e.addEventListener("click",()=>{this._openEdit(e.dataset.quadrant)})}),t.querySelectorAll(".quadrant__done-btn").forEach(e=>{e.addEventListener("click",()=>{this._closeEdit(e.dataset.quadrant)})}),t.querySelectorAll(".quadrant__editor").forEach(e=>{e.addEventListener("keydown",r=>{r.key==="Escape"&&(r.preventDefault(),this._closeEdit(e.dataset.quadrant))})})}_openEdit(t){this._editingQuadrants.add(t);let e=this.shadowRoot.querySelector(`.quadrant--${t}`);if(!e)return;e.setAttribute("data-editing","");let r=e.querySelector(".quadrant__face--front"),s=e.querySelector(".quadrant__face--back");r&&r.setAttribute("inert",""),s&&s.removeAttribute("inert");let a=e.querySelector(".quadrant__editor");if(a){let i=this.__quadrants?.[t];if(i?.length)a.value=i.join(`
`);else{let o=e.querySelector(`slot[name="${t}"]`);if(o){let c=o.assignedElements();if(c.length){let l=[];c.forEach(n=>{let d=n.querySelectorAll("li");d.length?d.forEach(m=>l.push(m.textContent.trim())):l.push(n.textContent.trim())}),a.value=l.filter(Boolean).join(`
`)}}}a.focus()}}_closeEdit(t){let e=this.shadowRoot.querySelector(`.quadrant--${t}`);if(!e)return;let r=e.querySelector(".quadrant__editor");if(r){let i=r.value.split(`
`).map(c=>c.trim()).filter(Boolean);this.__quadrants||(this.__quadrants={}),this.__quadrants[t]=i;let o=e.querySelector(".quadrant__content");if(o)if(i.length)o.innerHTML=t==="feels"?i.map(c=>this._renderEmotion(c)).join(""):i.map(c=>`<p>${u(c)}</p>`).join("");else{let c=q[t];o.innerHTML=`<p class="placeholder">Add ${c.label.toLowerCase()} items\u2026</p>`}}this._editingQuadrants.delete(t),e.removeAttribute("data-editing");let s=e.querySelector(".quadrant__face--front"),a=e.querySelector(".quadrant__face--back");s&&s.removeAttribute("inert"),a&&a.setAttribute("inert",""),this.dispatchEvent(new CustomEvent("empathy-map:update",{bubbles:!0,composed:!0,detail:{quadrant:t,items:this.__quadrants?.[t]||[]}}))}};b("empathy-map",T);var M=class p extends A{static QUADRANTS=["quick-wins","big-bets","fill-ins","money-pit"];static LABELS={"quick-wins":"Quick Wins","big-bets":"Big Bets","fill-ins":"Fill-Ins","money-pit":"Money Pit"};static DESCRIPTIONS={"quick-wins":"High impact \xB7 Low effort","big-bets":"High impact \xB7 High effort","fill-ins":"Low impact \xB7 Low effort","money-pit":"Low impact \xB7 High effort"};static#e=0;static get observedAttributes(){return["src","compact","title"]}#t=null;#a={};#i=null;#r="";#o=null;setup(){this.#r=`ie-${++p.#e}`;let t=[...this.querySelectorAll(":scope > [data-quadrant], :scope > [draggable]")],e=document.createElement("div");e.className="ie-wrapper";let r=document.createElement("div");r.className="ie-y-label",r.setAttribute("aria-hidden","true"),r.textContent="Impact \u2191";let s=document.createElement("div");s.style.cssText="display:flex;flex-direction:column;flex:1;min-width:0;";let a=document.createElement("div");a.className="ie-grid",a.setAttribute("role","region"),a.setAttribute("aria-label","Impact-Effort prioritization matrix");let i=document.createElement("div");i.className="ie-x-label",i.setAttribute("aria-hidden","true"),i.textContent="Effort \u2192";for(let n of p.QUADRANTS){let d=document.createElement("section");d.className="ie-quadrant",d.dataset.quadrantZone=n,d.setAttribute("aria-label",`${p.LABELS[n]}: ${p.DESCRIPTIONS[n]}`);let m=document.createElement("header");m.className="ie-quadrant-label",m.innerHTML=`${p.LABELS[n]}<br><span class="ie-quadrant-desc">${p.DESCRIPTIONS[n]}</span>`;let f=document.createElement("drag-surface");f.setAttribute("group",this.#r),f.setAttribute("aria-label",p.LABELS[n]),f.setAttribute("data-layout","stack"),f.setAttribute("data-layout-gap","xs"),d.appendChild(m),d.appendChild(f),a.appendChild(d),this.#a[n]=f}t.forEach((n,d)=>{let m=n.getAttribute("data-quadrant")||"quick-wins",f=this.#a[m]||this.#a["quick-wins"];n.hasAttribute("draggable")||n.setAttribute("draggable","true"),n.hasAttribute("data-id")||(n.dataset.id=`ie-item-${d}`),f.appendChild(n)});let o=document.createElement("div");o.className="ie-live-region",o.setAttribute("role","status"),o.setAttribute("aria-live","polite"),o.setAttribute("aria-atomic","true");let c=this.getAttribute("title");if(c){let n=document.createElement("h3");n.className="ie-title",n.textContent=c,this.prepend(n)}s.appendChild(a),s.appendChild(i),e.appendChild(r),e.appendChild(s),this.appendChild(e),this.appendChild(o),this.#t=a,this.#i=o,this.#o=e,this.listen(this,"drag-surface:transfer",n=>{let{item:d,fromSurface:m,toSurface:f}=n.detail,y=this.#n(m),h=this.#n(f);!y||!h||(d.setAttribute("data-quadrant",h),this.#c(`Moved ${this.#d(d)} to ${p.LABELS[h]}`),this.dispatchEvent(new CustomEvent("impact-effort:move",{bubbles:!0,detail:{itemId:d.dataset.id,from:y,to:h,item:d}})))});let l=this.getAttribute("src");l&&this.#s(l),this.#l()}teardown(){this.#o&&(this.#o.remove(),this.#o=null),this.#i&&(this.#i.remove(),this.#i=null),this.#t=null,this.#a={}}attributeChangedCallback(t,e,r){this.hasAttribute("data-upgraded")&&t==="src"&&r&&r!==e&&this.#s(r)}async#s(t){try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();if(!Array.isArray(r))return;for(let s of p.QUADRANTS){let a=this.#a[s];if(a)for(let i of[...a.querySelectorAll("[draggable]")])i.remove()}r.forEach((s,a)=>{let i=s.quadrant||"quick-wins",o=s.id||`ie-item-${a}`,c;s.persona||s.action||s.storyId?(c=document.createElement("user-story"),c.setAttribute("detail","minimal"),s.storyId&&c.setAttribute("story-id",s.storyId),s.persona&&c.setAttribute("persona",s.persona),s.action&&c.setAttribute("action",s.action),s.benefit&&c.setAttribute("benefit",s.benefit),s.priority&&c.setAttribute("priority",s.priority),s.status&&c.setAttribute("status",s.status),s.points&&c.setAttribute("points",String(s.points))):(c=document.createElement("article"),c.textContent=s.label||s.text||""),c.setAttribute("draggable","true"),c.dataset.id=o,c.dataset.quadrant=i,(this.#a[i]||this.#a["quick-wins"]).appendChild(c)}),this.#l()}catch(e){console.warn(`[impact-effort] Failed to load src="${t}":`,e)}}#n(t){for(let[e,r]of Object.entries(this.#a))if(r===t)return e;return null}#c(t){let e=this.#i;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#d(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#l(){let t={};for(let e of p.QUADRANTS){let r=this.#a[e];t[e]=r?r.querySelectorAll('[draggable="true"]').length:0}this.dispatchEvent(new CustomEvent("impact-effort:ready",{bubbles:!0,detail:{quadrantCounts:t}}))}};b("impact-effort",M);var N=class p extends A{static get observedAttributes(){return["src","compact","title"]}static#e=0;#t=null;#a={};#i={};#r=null;#o="";#s=[];setup(){this.#o=`kb-${++p.#e}`;let t=[...this.querySelectorAll(":scope > section[data-column]")];this.#s=t.map(a=>{let i=a.getAttribute("data-column")||"",c=a.getAttribute("data-column-label")||""||this.#f(i),l=a.getAttribute("data-wip"),n=l?parseInt(l,10):null,d=a.getAttribute("data-column-color")||null,m=[...a.children];return{id:i,label:c,wip:n,color:d,children:m}});for(let a of t)a.remove();this.#t=document.createElement("div"),this.#t.className="kb-columns",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label","Kanban board");let e=0;for(let a of this.#s){let i=document.createElement("section");i.className="kb-column",i.setAttribute("data-column-id",a.id),a.color&&i.setAttribute("data-column-tint",a.color);let o=document.createElement("header");o.className="kb-column-header";let c=document.createElement("h3");c.textContent=a.label;let l=document.createElement("output");if(l.className="kb-count",l.textContent=String(a.children.length),c.appendChild(l),a.wip!==null&&!isNaN(a.wip)){let d=document.createElement("span");d.className="kb-wip",d.textContent=`/ ${a.wip}`,d.setAttribute("aria-label",`WIP limit ${a.wip}`),c.appendChild(d)}o.appendChild(c),i.appendChild(o);let n=document.createElement("drag-surface");if(n.setAttribute("group",this.#o),n.setAttribute("aria-label",`${a.label} items`),n.setAttribute("data-layout","stack"),n.setAttribute("data-layout-gap","xs"),a.children.length>0){for(let d of a.children)d.hasAttribute("draggable")||d.setAttribute("draggable","true"),d.hasAttribute("data-id")||(d.dataset.id=`kb-item-${e}`),n.appendChild(d);e+=a.children.length}else{let d=document.createElement("p");d.className="kb-empty",d.textContent="No items",n.appendChild(d)}i.appendChild(n),this.#t.appendChild(i),this.#a[a.id]=n,this.#i[a.id]=i,a.wip!==null&&a.children.length>a.wip&&i.setAttribute("data-wip-exceeded","")}let r=this.getAttribute("title");if(r){let a=document.createElement("h2");a.className="kb-title",a.textContent=r,this.appendChild(a)}this.appendChild(this.#t),this.#r=document.createElement("div"),this.#r.className="kb-live-region",this.#r.setAttribute("role","status"),this.#r.setAttribute("aria-live","polite"),this.#r.setAttribute("aria-atomic","true"),this.appendChild(this.#r),this.listen(this,"drag-surface:reorder",a=>{let i=a.detail,o=a.target.closest("drag-surface"),c=this.#n(o);c&&(this.#c(c),this.dispatchEvent(new CustomEvent("kanban-board:reorder",{bubbles:!0,detail:{itemId:i.itemId,column:c,oldIndex:i.oldIndex,newIndex:i.newIndex}})))}),this.listen(this,"drag-surface:transfer",a=>{let i=a.detail,o=i.fromSurface,c=i.toSurface,l=this.#n(o),n=this.#n(c);if(!l||!n)return;i.item&&i.item.setAttribute("data-column",n),this.#c(l),this.#c(n);let d=c.querySelector(".kb-empty");if(d&&d.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".kb-empty")){let w=document.createElement("p");w.className="kb-empty",w.textContent="No items",o.appendChild(w)}let f=this.#h(i.item),y=this.#d(l),h=this.#d(n);this.#l(`${f} moved from ${y} to ${h}`),this.dispatchEvent(new CustomEvent("kanban-board:transfer",{bubbles:!0,detail:{itemId:i.itemId,fromColumn:l,toColumn:n,newIndex:i.newIndex,item:i.item}}));let x=c.querySelectorAll(':scope > [draggable="true"]').length,v=this.#s.find(w=>w.id===n);v?.wip!==null&&v?.wip!==void 0&&x>v.wip&&this.dispatchEvent(new CustomEvent("kanban-board:wip-exceeded",{bubbles:!0,detail:{column:n,limit:v.wip,count:x}}))});let s=this.getAttribute("src");if(s){this._loadSrc(s);return}this.dispatchEvent(new CustomEvent("kanban-board:ready",{bubbles:!0,detail:{columnCount:this.#s.length,itemCount:e}}))}teardown(){let t=this.querySelector(".kb-title");t&&t.remove(),this.#t&&(this.#t.remove(),this.#t=null),this.#r&&(this.#r.remove(),this.#r=null),this.#a={},this.#i={},this.#s=[]}attributeChangedCallback(t,e,r){e===r||!this.isConnected||t==="src"&&this._loadSrc(r)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let s of r.columns||[]){let a=document.createElement("section");a.setAttribute("data-column",s.id),s.label&&a.setAttribute("data-column-label",s.label),s.wip!=null&&a.setAttribute("data-wip",String(s.wip)),s.color&&a.setAttribute("data-column-color",s.color);for(let i of s.items||[]){let o;i.persona||i.action||i.storyId?(o=document.createElement("user-story"),o.setAttribute("detail",i.detail||"minimal"),i.storyId&&o.setAttribute("story-id",i.storyId),i.persona&&o.setAttribute("persona",i.persona),i.action&&o.setAttribute("action",i.action),i.benefit&&o.setAttribute("benefit",i.benefit),i.priority&&o.setAttribute("priority",i.priority),i.status&&o.setAttribute("status",i.status),i.points&&o.setAttribute("points",String(i.points))):(o=document.createElement("article"),o.className="kb-card",o.textContent=i.text||i.label||""),o.setAttribute("draggable","true"),o.dataset.id=i.id||i.storyId||"",a.appendChild(o)}this.appendChild(a)}this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[kanban-board] Failed to load src="${t}":`,e)}}#n(t){if(!t)return null;for(let[e,r]of Object.entries(this.#a))if(r===t)return e;return null}#c(t){let e=this.#a[t],r=this.#i[t];if(!e||!r)return;let s=e.querySelectorAll(':scope > [draggable="true"]').length,a=r.querySelector(".kb-count");a&&(a.textContent=String(s));let i=this.#s.find(o=>o.id===t);i?.wip!==null&&i?.wip!==void 0&&(s>i.wip?r.setAttribute("data-wip-exceeded",""):r.removeAttribute("data-wip-exceeded"))}#d(t){return this.#s.find(r=>r.id===t)?.label||this.#f(t)}#l(t){this.#r&&(this.#r.textContent="",requestAnimationFrame(()=>{this.#r&&(this.#r.textContent=t)}))}#h(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#f(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};b("kanban-board",N);var R=class p extends A{static get observedAttributes(){return["src","compact","title"]}static#e=0;#t=null;#a=null;#i={};#r=null;#o="";#s=[];setup(){this.#o=`sm-${++p.#e}`;let t=[...this.querySelectorAll(":scope > section[data-activity]")];this.#s=t.map(a=>{let i=a.getAttribute("data-activity")||"",c=a.getAttribute("data-activity-label")||""||this.#h(i),l=a.getAttribute("data-journey-phase")||null,n=[...a.children];return{id:i,label:c,journeyPhase:l,children:n}});for(let a of t)a.remove();this.#t=document.createElement("div"),this.#t.className="sm-scroll",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label","Story map"),this.#t.setAttribute("tabindex","0"),this.#a=document.createElement("div"),this.#a.className="sm-columns";let e=0;for(let a of this.#s){let i=document.createElement("section");i.className="sm-column",i.setAttribute("data-activity-column",a.id);let o=document.createElement("header");o.className="sm-activity-header";let c=document.createElement("h3");c.textContent=a.label;let l=document.createElement("span");l.className="sm-activity-count",l.textContent=String(a.children.length),c.appendChild(l),o.appendChild(c),i.appendChild(o);let n=document.createElement("drag-surface");if(n.setAttribute("group",this.#o),n.setAttribute("aria-label",`${a.label} stories`),n.setAttribute("data-layout","stack"),n.setAttribute("data-layout-gap","xs"),a.children.length>0){for(let d of a.children)n.appendChild(d);e+=a.children.length}else{let d=document.createElement("p");d.className="sm-empty",d.textContent="No stories yet",n.appendChild(d)}i.appendChild(n),this.#a.appendChild(i),this.#i[a.id]=n}let r=this.getAttribute("title");if(r){let a=document.createElement("h2");a.className="sm-title",a.textContent=r,this.appendChild(a)}this.#t.appendChild(this.#a),this.appendChild(this.#t),this.#r=document.createElement("div"),this.#r.className="sm-live-region",this.#r.setAttribute("role","status"),this.#r.setAttribute("aria-live","polite"),this.#r.setAttribute("aria-atomic","true"),this.appendChild(this.#r),this.listen(this,"drag-surface:reorder",a=>{let i=a.detail,o=a.target.closest("drag-surface"),c=this.#n(o);c&&(this.#c(c),this.dispatchEvent(new CustomEvent("story-map:reorder",{bubbles:!0,detail:{itemId:i.itemId,activity:c,oldIndex:i.oldIndex,newIndex:i.newIndex}})))}),this.listen(this,"drag-surface:transfer",a=>{let i=a.detail,o=i.fromSurface,c=i.toSurface,l=this.#n(o),n=this.#n(c);if(!l||!n)return;this.#c(l),this.#c(n);let d=c.querySelector(".sm-empty");if(d&&d.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".sm-empty")){let y=document.createElement("p");y.className="sm-empty",y.textContent="No stories yet",o.appendChild(y)}let f=this.#l(i.item);this.#d(`${f} moved from ${l} to ${n}`),this.dispatchEvent(new CustomEvent("story-map:transfer",{bubbles:!0,detail:{itemId:i.itemId,fromActivity:l,toActivity:n,newIndex:i.newIndex}}))});let s=this.getAttribute("src");if(s){this._loadSrc(s);return}this.dispatchEvent(new CustomEvent("story-map:ready",{bubbles:!0,detail:{activityCount:this.#s.length,storyCount:e}}))}teardown(){this.#t&&(this.#t.remove(),this.#t=null),this.#r&&(this.#r.remove(),this.#r=null),this.#a=null,this.#i={},this.#s=[]}attributeChangedCallback(t,e,r){e===r||!this.isConnected||t==="src"&&this._loadSrc(r)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let s of r.activities||[]){let a=document.createElement("section");a.setAttribute("data-activity",s.id),a.setAttribute("data-activity-label",s.label||s.id),s.journeyPhase&&a.setAttribute("data-journey-phase",s.journeyPhase);for(let i of s.stories||[]){let o=document.createElement("user-story");o.setAttribute("draggable","true"),o.dataset.id=i.id||i.storyId,(i.storyId||i.id)&&o.setAttribute("story-id",i.storyId||i.id),i.title&&o.setAttribute("title",i.title),i.persona&&o.setAttribute("persona",i.persona),i.action&&o.setAttribute("action",i.action),i.benefit&&o.setAttribute("benefit",i.benefit),i.priority&&o.setAttribute("priority",i.priority),i.status&&o.setAttribute("status",i.status),i.points&&o.setAttribute("points",String(i.points)),o.setAttribute("detail",i.detail||"compact"),a.appendChild(o)}this.appendChild(a)}this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[story-map] Failed to load src="${t}":`,e)}}#n(t){if(!t)return null;for(let[e,r]of Object.entries(this.#i))if(r===t)return e;return null}#c(t){let e=this.#i[t];if(!e)return;let r=e.querySelectorAll(':scope > [draggable="true"]').length,s=e.closest("[data-activity-column]");if(!s)return;let a=s.querySelector(".sm-activity-count");a&&(a.textContent=String(r))}#d(t){this.#r&&(this.#r.textContent="",requestAnimationFrame(()=>{this.#r&&(this.#r.textContent=t)}))}#l(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#h(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};b("story-map",R);
//# sourceMappingURL=ux-planning.full.js.map
