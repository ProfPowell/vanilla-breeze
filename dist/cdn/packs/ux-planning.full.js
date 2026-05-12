var ce=window.matchMedia("(prefers-reduced-motion: reduce)");var It=new Map;function x(c,t,e={}){let s=e.priority??10,r={impl:t,bundle:e.bundle,contract:e.contract,priority:s},i=It.get(c);if(customElements.get(c)){if(!i||i.priority>=s){i&&i.priority===s&&i.impl!==t&&console.warn(`[VB Bundle] Tag <${c}> already registered by "${i.bundle}" (priority ${i.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${c}> defined by "${i.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(i&&i.priority>=s){i.priority===s&&console.warn(`[VB Bundle] Tag <${c}> already registered by "${i.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}It.set(c,r),customElements.define(c,t)}var C=class extends HTMLElement{#s=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#s)t();this.#s=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,s,r){t.addEventListener(e,s,r),this.#s.push(()=>t.removeEventListener(e,s,r))}setup(){}teardown(){}setState(t,e){this.#t||(this.#t=this.attachInternals());let s=this.#t.states;try{e?s.add(t):s.delete(t)}catch{let r=`--${t}`;e?s.add(r):s.delete(r)}}_adoptInternals(t){this.#t||(this.#t=t)}};var et=class c extends C{#s=null;#t=null;#e=!1;#i=null;setup(){this.setAttribute("role","list"),this.#e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.#o(),this.#n(),this.#m(),this.#r()}teardown(){this.#s&&(this.#s.remove(),this.#s=null),c.#C?.source===this&&(c.#C=null)}get draggableChildren(){return[...this.querySelectorAll(':scope > [draggable="true"]')]}get group(){return this.getAttribute("group")||null}get orientation(){return this.getAttribute("orientation")||"vertical"}get sortedOrder(){return this.draggableChildren.map(t=>t.dataset.id)}#r(){for(let t of this.draggableChildren)t.getAttribute("role")||t.setAttribute("role","listitem"),t.hasAttribute("tabindex")||t.setAttribute("tabindex","0"),t.hasAttribute("aria-grabbed")||t.setAttribute("aria-grabbed","false")}#o(){this.#s=document.createElement("div"),this.#s.setAttribute("role","status"),this.#s.setAttribute("aria-live","polite"),this.#s.setAttribute("aria-atomic","true"),this.#s.style.cssText="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);",this.prepend(this.#s)}#a(t){let e=this.#s;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#n(){this.listen(this,"pointerdown",t=>{this.#i=t.target}),this.listen(this,"dragstart",this.#l.bind(this)),this.listen(this,"dragover",this.#c.bind(this)),this.listen(this,"dragleave",this.#p.bind(this)),this.listen(this,"drop",this.#h.bind(this)),this.listen(this,"dragend",this.#u.bind(this))}#l(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let s=e.querySelector("[data-drag-handle]");if(s&&!s.contains(this.#i)){t.preventDefault();return}e.setAttribute("data-dragging",""),t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",e.dataset.id||""),t.dataTransfer.setData("application/x-drag-surface-group",this.group||"");let r=this.#g(e);c.#C={item:e,source:this,originalIndex:r},this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}#c(t){let e=c.#C;if(!e||(this.group||e.source.group)&&this.group!==e.source.group)return;t.preventDefault(),t.dataTransfer.dropEffect="move",this.setAttribute("data-drag-over","");let s=this.orientation==="horizontal"?t.clientX:t.clientY;this.#A(s)}#p(t){t.relatedTarget&&!this.contains(t.relatedTarget)&&(this.removeAttribute("data-drag-over"),this.#_())}#h(t){t.preventDefault(),this.removeAttribute("data-drag-over"),this.#_();let e=c.#C;if(!e)return;let{item:s,source:r,originalIndex:i}=e,a=this.orientation==="horizontal"?t.clientX:t.clientY,o=this.#k(a);if(r===this){this.#b(s,o),this.#v();let l=this.#g(s);this.#d(s),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:s,itemId:s.dataset.id,oldIndex:i,newIndex:l,order:this.sortedOrder}}))}else this.#b(s,o),this.#v(),r.#v(),this.#d(s),this.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:s,itemId:s.dataset.id,fromSurface:r,toSurface:this,newIndex:this.#g(s),fromOrder:r.sortedOrder,toOrder:this.sortedOrder}}))}#u(){let t=c.#C;t?.item&&t.item.removeAttribute("data-dragging"),this.removeAttribute("data-drag-over"),this.#_(),c.#C=null,this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0}))}#m(){this.listen(this,"keydown",this.#y.bind(this))}#y(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let s=e.getAttribute("aria-grabbed")==="true",r=this.orientation==="horizontal",i=r?"ArrowLeft":"ArrowUp",a=r?"ArrowRight":"ArrowDown";if(t.key===" "||t.key==="Enter"){if(t.preventDefault(),s){e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#v(),this.#d(e);let d=this.#g(e),n=this.draggableChildren;this.#a(`${this.#x(e)}, dropped at position ${d+1} of ${n.length}`),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,oldIndex:this.#t,newIndex:d,order:this.sortedOrder}})),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#t=null}else{this.#t=this.#g(e),e.setAttribute("aria-grabbed","true"),this.setAttribute("data-reorder-mode","");let d=this.draggableChildren;this.#a(`${this.#x(e)}, grabbed. Position ${this.#t+1} of ${d.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`),this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}return}if(!s&&(t.key===i||t.key===a)){t.preventDefault();let d=this.draggableChildren,n=d.indexOf(e),h=t.key===i?Math.max(0,n-1):Math.min(d.length-1,n+1);h!==n&&d[h].focus();return}if(s&&(t.key===i||t.key===a)){t.preventDefault();let d=this.draggableChildren,n=d.indexOf(e),h=t.key===i?Math.max(0,n-1):Math.min(d.length-1,n+1);h!==n&&(this.#b(e,h),e.focus(),this.#a(`Position ${h+1} of ${d.length}`));return}let o=r?"ArrowUp":"ArrowLeft",l=r?"ArrowDown":"ArrowRight";if(s&&(t.key===o||t.key===l)){if(t.preventDefault(),!this.group)return;let d=t.key===l?1:-1,n=this.#f(d);if(!n)return;n.appendChild(e),n.#v(),this.#v(),n.#d(e),e.focus();let h=n.getAttribute("aria-label")||"next surface";n.#a(`Moved to ${h}`),n.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,fromSurface:this,toSurface:n,newIndex:n.draggableChildren.indexOf(e),fromOrder:this.sortedOrder,toOrder:n.sortedOrder}})),this.removeAttribute("data-reorder-mode"),n.setAttribute("data-reorder-mode",""),this.#t=null;return}if(s&&t.key==="Escape"){t.preventDefault(),e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#t!=null&&(this.#b(e,this.#t),e.focus()),this.#a("Reorder cancelled"),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#t=null;return}!s&&t.key==="Escape"&&(t.preventDefault(),e.blur())}#d(t){t.setAttribute("data-just-dropped",""),t.addEventListener("animationend",()=>{t.removeAttribute("data-just-dropped")},{once:!0}),setTimeout(()=>t.removeAttribute("data-just-dropped"),500)}#f(t){if(!this.group)return null;let e=[...document.querySelectorAll(`drag-surface[group="${this.group}"]`)];if(e.length<2)return null;e.sort((i,a)=>{let o=i.getBoundingClientRect(),l=a.getBoundingClientRect();return o.left-l.left||o.top-l.top});let s=e.indexOf(this);return e[s+t]||null}#x(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#g(t){return this.draggableChildren.indexOf(t)}#b(t,e){let r=this.draggableChildren.filter(i=>i!==t)[e]||null;r?this.insertBefore(t,r):this.appendChild(t)}#v(){this.draggableChildren.forEach((t,e)=>{t.dataset.sortOrder=String(e+1)})}#k(t){let e=this.orientation==="horizontal",s=this.draggableChildren.filter(r=>!r.hasAttribute("data-dragging"));for(let r=0;r<s.length;r++){let i=s[r].getBoundingClientRect(),a=e?i.left+i.width/2:i.top+i.height/2;if(t<a)return r}return s.length}#A(t){this.#_();let e=this.orientation==="horizontal",s=this.draggableChildren.filter(r=>!r.hasAttribute("data-dragging"));for(let r=0;r<s.length;r++){let i=s[r].getBoundingClientRect(),a=e?i.left+i.width/2:i.top+i.height/2;if(t<a){s[r].setAttribute("data-drop-target","before");return}}s.length>0&&s[s.length-1].setAttribute("data-drop-target","after")}#_(){for(let t of this.querySelectorAll("[data-drop-target]"))t.removeAttribute("data-drop-target")}static#C=null};x("drag-surface",et);var Tt=`
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
    --_stories:     var(--user-persona-stories, #3b82f6);
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
  .section-icon.stories { background: var(--_stories); }

  /* Stories section \u2014 auto-rendered list of related <user-story> elements */
  .section-count {
    margin-inline-start: var(--_space-2xs);
    padding: 0.05em 0.5ch;
    border-radius: 999px;
    background: var(--color-surface-raised, oklch(95% 0 0));
    color: var(--color-text-muted);
    font-size: 0.75em;
    font-weight: 600;
  }
  .story-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--_space-2xs);
  }
  .story-item {
    display: flex;
    align-items: center;
    gap: var(--_space-s);
    padding-block: var(--_space-2xs);
    border-block-end: 1px solid var(--color-border-muted, var(--color-border, #e5e7eb));
  }
  .story-item:last-child { border-block-end: none; }
  .story-item a {
    color: var(--color-interactive, currentColor);
    text-decoration: none;
    flex: 1;
  }
  .story-item a:hover { text-decoration: underline; }
  .story-meta {
    font-size: var(--_font-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 0.5ch;
    border: 1px solid var(--color-border-muted, var(--color-border, #e5e7eb));
    border-radius: var(--_radius-m);
  }
  .empty-stories {
    margin: 0;
    color: var(--color-text-muted);
    font-style: italic;
  }

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
`;function f(c){return String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function L(c){return c.split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2)}function z(c){let t=0;for(let s=0;s<c.length;s++)t=c.charCodeAt(s)+((t<<5)-t);return`hsl(${(t%360+360)%360}, 65%, 55%)`}function A(c){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c}</svg>`}var k={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',mapPin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>'},st={says:{label:"Says",icon:k.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:k.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:k.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:k.heart,color:"#ef4444"}},T={delighted:{emoji:"\u{1F604}",score:.95,color:"#16a34a"},satisfied:{emoji:"\u{1F60A}",score:.8,color:"#22c55e"},hopeful:{emoji:"\u{1F642}",score:.68,color:"#84cc16"},curious:{emoji:"\u{1F914}",score:.55,color:"#eab308"},neutral:{emoji:"\u{1F610}",score:.5,color:"#94a3b8"},uncertain:{emoji:"\u{1F615}",score:.4,color:"#f97316"},confused:{emoji:"\u{1F635}",score:.3,color:"#fb923c"},frustrated:{emoji:"\u{1F624}",score:.18,color:"#ef4444"},angry:{emoji:"\u{1F620}",score:.05,color:"#dc2626"}};var Ot="https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait",O=[32,64,128,256,512];function Ut(c){let t=0;for(let e=0;e<c.length;e++)t=c.charCodeAt(e)+((t<<5)-t);return t}function Vt(c){let t=O[0],e=Math.abs(c-t);for(let s=1;s<O.length;s++){let r=Math.abs(c-O[s]);r<e&&(t=O[s],e=r)}return t}function Nt(c,t=128){let e=Ut(String(c)),s=(e%100+100)%100,r=(e>>>16&1)===0?"female":"male",i=Vt(t);return`${Ot}/${r}/${i}/${s}.jpg`}function rt(c){let t=0;for(let e=0;e<c.length;e++)t=c.charCodeAt(e)+((t<<5)-t);return t}var Yt=["Sarah Chen","Marcus Johnson","Aisha Patel","James O'Brien","Yuki Tanaka","Elena Rodriguez","David Kim","Fatima Al-Hassan","Lucas Silva","Priya Sharma","Noah Williams","Mei Lin","Carlos Mendez","Amara Osei","Henrik Larsson","Zara Ahmed"],Wt=["Product Manager","UX Designer","Frontend Developer","Data Analyst","Marketing Lead","QA Engineer","DevOps Lead","Content Strategist","Startup Founder","IT Director","Customer Success Lead","Research Scientist"],Xt=["San Francisco, CA","Austin, TX","London, UK","Toronto, CA","Berlin, DE","Tokyo, JP","Sydney, AU","S\xE3o Paulo, BR"],Qt=["I need tools that help me stay organized without slowing me down.","The dashboard is where I live \u2014 it has to be fast and reliable.","I want to understand the data, not fight the interface.","If it takes more than two clicks, I\u2019ll find another way.","Collaboration shouldn\u2019t mean endless notification noise.","I just want it to work the way I expect it to.","Give me the big picture first, then let me drill into details.","Accessibility isn\u2019t a nice-to-have \u2014 it\u2019s how I use the web."],Kt=["Streamline daily workflows","Reduce context-switching","Stay aligned with the team","Make data-driven decisions quickly","Ship features on a predictable cadence","Automate repetitive tasks","Improve onboarding experience","Keep documentation up to date"],Gt=["Too many disconnected tools","Slow page loads break focus","Unclear ownership of tasks","Settings that reset unexpectedly","Notifications that bury important updates","Poor mobile experience","Inconsistent design across features","No offline support"],Jt=["Checks dashboards every morning","Prefers keyboard shortcuts over mouse","Skims docs, reads deeply only when stuck","Shares screenshots in Slack","Batches email to twice a day","Tests features in incognito first","Bookmarks frequently used reports","Uses dark mode exclusively"],it=class extends HTMLElement{static get observedAttributes(){return["role","age","location","avatar","compact","src","data-list-stories","id"]}#s=new Map;#t=null;constructor(){super(),this.attachShadow({mode:"open"})}relatedStories(){if(!this.id)return[];let t=this.getRootNode(),e=t.querySelectorAll?t:document;return Array.from(e.querySelectorAll(`user-story[persona-id="${Zt(this.id)}"]`))}#e(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&!this.getAttribute(e)&&this.#s.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#s.get(t)||""}get data(){return{name:this.personaName,role:this.personaRole||void 0,age:this.age||void 0,location:this.location||void 0,avatar:this.avatar||void 0,quote:this.quote||void 0,bio:this.#s.get("bio")||void 0,goals:this.#s.get("goals")||void 0,frustrations:this.#s.get("frustrations")||void 0,behaviors:this.#s.get("behaviors")||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.shadowRoot&&this.#n(),this.dispatchEvent(new CustomEvent("user-persona:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let e of["role","age","location","avatar"])t[e]&&this.setAttribute(e,t[e]);if(t.name&&!this.querySelector('[slot="name"]')){let e=document.createElement("h2");e.slot="name",e.textContent=t.name,this.appendChild(e)}if(t.quote&&!this.querySelector('[slot="quote"]')){let e=document.createElement("p");e.slot="quote",e.textContent=t.quote,this.appendChild(e)}for(let e of["bio","goals","frustrations","behaviors"])t[e]&&this.#s.set(e,t[e])}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this._applyData(s),this.#n()}catch(e){console.warn(`[user-persona] Failed to load src="${t}":`,e)}}connectedCallback(){this.#e(),this.hasAttribute("data-mock")?this.#a():this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#n(),this.#i(),this.setAttribute("data-upgraded",""),this.dispatchEvent(new CustomEvent("persona-ready",{bubbles:!0,composed:!0,detail:{name:this.personaName,role:this.personaRole}}))}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t?.disconnect(),this.#t=null}#i(){if(!this.hasAttribute("data-list-stories")||!this.id){this.#t?.disconnect(),this.#t=null;return}this.#t||(this.#t=new MutationObserver(()=>this.#r()),this.#t.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["persona-id"]}))}#r(){if(!this.shadowRoot)return;let t=this.shadowRoot.querySelector("[data-stories-section]");t&&(t.outerHTML=this.#o())}#o(){if(!this.hasAttribute("data-list-stories")||!this.id)return"";let t=this.relatedStories();return`
      <section class="section" part="section-stories" data-stories-section>
        <div class="section-header">
          <div class="section-icon stories" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <span class="section-title">Stories <span class="section-count">${t.length}</span></span>
        </div>
        <div class="section-content">
          ${t.length===0?'<p class="empty-stories">No user stories reference this persona yet.</p>':`<ul class="story-list">${t.map(e=>{let s=e.id||e.getAttribute("story-id")||"",r=e.querySelector('[slot="action"]')?.textContent?.trim()||e.getAttribute("action")||e.id||"untitled",i=e.getAttribute("priority")||"",a=e.getAttribute("status")||"";return`<li class="story-item" data-priority="${f(i)}" data-status="${f(a)}">${s?`<a href="#${f(s)}">${f(r)}</a>`:`<span>${f(r)}</span>`}${i?`<span class="story-meta">${f(i)}</span>`:""}${a?`<span class="story-meta">${f(a)}</span>`:""}</li>`}).join("")}</ul>`}
        </div>
      </section>
    `}attributeChangedCallback(t,e,s){if(!(e===s||!this.shadowRoot)){if(t==="src"&&this.isConnected){this._loadSrc(s);return}(t==="data-list-stories"||t==="id")&&this.#i(),this.#n()}}get personaName(){return this.querySelector('[slot="name"]')?.textContent?.trim()||this.#s.get("name")||"Unnamed Persona"}get personaRole(){return this.getAttribute("role")||""}get age(){return this.getAttribute("age")||""}get location(){return this.getAttribute("location")||""}get avatar(){return this.getAttribute("avatar")||""}get quote(){return this.querySelector('[slot="quote"]')?.textContent?.trim()||this.#s.get("quote")||""}get compact(){return this.hasAttribute("compact")}#a(){let t=this.dataset.seed||this.dataset.mock||String(Date.now()),e=i=>i[(rt(t+i.length)%i.length+i.length)%i.length],s=(i,a)=>{let o=[];for(let l=0;l<a;l++)o.push(i[(rt(t+l+i.length)%i.length+i.length)%i.length]);return[...new Set(o)]};if(!this.querySelector('[slot="name"]')){let i=document.createElement("h2");i.slot="name",i.textContent=e(Yt),this.appendChild(i)}if(this.getAttribute("role")||this.setAttribute("role",e(Wt)),this.getAttribute("age")||this.setAttribute("age",String(25+(rt(t)%30+30)%30)),this.getAttribute("location")||this.setAttribute("location",e(Xt)),!this.getAttribute("avatar")){let i=this.querySelector('[slot="name"]')?.textContent?.trim()||"Persona";this.setAttribute("avatar",Nt(i,256))}if(!this.querySelector('[slot="quote"]')){let i=document.createElement("p");i.slot="quote",i.textContent=e(Qt),this.appendChild(i)}let r=(i,a)=>{if(this.querySelector(`[slot="${i}"]`))return;let o=document.createElement("ul");o.setAttribute("slot",i);for(let l of a){let d=document.createElement("li");d.textContent=l,o.appendChild(d)}this.appendChild(o)};r("goals",s(Kt,3)),r("frustrations",s(Gt,3)),r("behaviors",s(Jt,3))}#n(){let t=this.personaName,e=this.personaRole,s=this.age,r=this.location,i=this.avatar,a=this.quote,o=z(t),l=i?`background:url(${f(i)}) center/cover`:`background:${o}`;this.shadowRoot.innerHTML=`
      <style>${Tt}</style>

      <article class="persona-card" part="card" role="article"
        aria-label="User persona: ${f(t)}">

        <header class="persona-header" part="header">
          <div class="avatar" part="avatar" style="${l}"
            role="img" aria-label="Avatar for ${f(t)}">
            ${i?"":f(L(t))}
          </div>
          <div class="header-info">
            <div class="persona-name-wrap" part="name">
              <slot name="name"><h2 class="persona-name-fallback">${f(t)}</h2></slot>
            </div>
            ${e?`<p class="persona-role" part="role">${f(e)}</p>`:""}
            <div class="persona-meta" part="meta">
              ${s?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  ${f(s)} years old
                </span>
              `:""}
              ${r?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  ${f(r)}
                </span>
              `:""}
            </div>
          </div>
        </header>

        ${a||this.querySelector('[slot="quote"]')?`
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="quote-text-wrap"><slot name="quote"><p class="quote-text">${f(a)}</p></slot></div>
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

          ${this.#o()}
        </div>
      </article>
    `}};function Zt(c){return typeof CSS<"u"&&CSS.escape?CSS.escape(String(c)):String(c).replace(/["\\]/g,"\\$&")}x("user-persona",it);var at=`
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

.persona-text--link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--_accent);
  text-decoration: none;
}

.persona-text--link svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.persona-text--link:hover {
  text-decoration: underline;
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

/* Semantic section-icon colors \u2014 driven by VB theme tokens so they shift
   with the active theme rather than fighting it. */
.section-icon.acceptance { background: var(--color-success, #22c55e); }
.section-icon.notes      { background: var(--color-warning, #f59e0b); }
.section-icon.tasks      { background: var(--color-accent,  #8b5cf6); }

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

/* \u2500\u2500 Slotted title (minimal mode heading) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.story-title-wrap {
  margin: 0;
}

::slotted([slot="title"]) {
  font-size: var(--_font-sm) !important;
  font-weight: 600 !important;
  color: var(--_text) !important;
  margin: 0 !important;
}

.story-title-fallback {
  font-size: var(--_font-sm);
  font-weight: 600;
  color: var(--_text);
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
`;var ot=class c extends HTMLElement{static get observedAttributes(){return["persona-id","priority","points","status","epic","story-id","compact","detail","src"]}static PRIORITIES={critical:{label:"Critical",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"},high:{label:"High",color:"#ea580c",bg:"rgba(234, 88, 12, 0.1)"},medium:{label:"Medium",color:"#ca8a04",bg:"rgba(202, 138, 4, 0.1)"},low:{label:"Low",color:"#16a34a",bg:"rgba(22, 163, 74, 0.1)"}};static STATUSES={backlog:{label:"Backlog",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"},"to-do":{label:"To Do",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},"in-progress":{label:"In Progress",color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.1)"},review:{label:"Review",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},done:{label:"Done",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"}};#s=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#t(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#s.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#s.get(t)||""}get data(){return{storyId:this.storyId||void 0,personaId:this.personaId||void 0,priority:this.priority,status:this.status,points:this.points||void 0,epic:this.epic||void 0,detail:this.getAttribute("detail")||void 0,persona:this.persona||void 0,action:this.action||void 0,benefit:this.benefit||void 0,title:this.storyTitle||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.#t(),this.shadowRoot&&this.#e(),this.dispatchEvent(new CustomEvent("user-story:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let[e,s]of[["storyId","story-id"],["personaId","persona-id"],["priority","priority"],["status","status"],["points","points"],["epic","epic"],["detail","detail"]])t[e]!=null&&this.setAttribute(s,String(t[e]));if(t.persona&&!this.querySelector('[slot="persona"]')){let e=document.createElement("span");e.slot="persona",e.textContent=t.persona,this.appendChild(e)}if(t.action&&!this.querySelector('[slot="action"]')){let e=document.createElement("span");e.slot="action",e.textContent=t.action,this.appendChild(e)}if(t.benefit&&!this.querySelector('[slot="benefit"]')){let e=document.createElement("span");e.slot="benefit",e.textContent=t.benefit,this.appendChild(e)}if(t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=t.title,this.appendChild(e)}for(let e of["acceptance-criteria","tasks","notes"]){let s=e==="acceptance-criteria"?"acceptanceCriteria":e;if(t[s]&&!this.querySelector(`[slot="${e}"]`))if(Array.isArray(t[s])){let r=document.createElement("ul");r.slot=e;for(let i of t[s]){let a=document.createElement("li");a.textContent=i,r.appendChild(a)}this.appendChild(r)}else{let r=document.createElement("p");r.slot=e,r.textContent=t[s],this.appendChild(r)}}}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this._applyData(s),this.#t(),this.#e()}catch(e){console.warn(`[user-story] Failed to load src="${t}":`,e)}}connectedCallback(){this.#t(),this.storyId&&!this.id&&(this.id=this.storyId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#e(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,s){e!==s&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(s):this.#e())}get persona(){return this.querySelector('[slot="persona"]')?.textContent?.trim()||this.#s.get("persona")||"user"}get personaId(){return this.getAttribute("persona-id")||""}get action(){return this.querySelector('[slot="action"]')?.textContent?.trim()||this.#s.get("action")||""}get benefit(){return this.querySelector('[slot="benefit"]')?.textContent?.trim()||this.#s.get("benefit")||""}get priority(){return this.getAttribute("priority")||"medium"}get points(){return this.getAttribute("points")||""}get status(){return this.getAttribute("status")||"backlog"}get epic(){return this.getAttribute("epic")||""}get storyId(){return this.getAttribute("story-id")||""}get storyTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#s.get("title")||""}get _minimalLabel(){if(this.storyTitle)return this.storyTitle;let t=this.action;return t.length>40?t.slice(0,40)+"\u2026":t}get compact(){return this.hasAttribute("compact")}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}updateStatus(t){c.STATUSES[t]&&(this.setAttribute("status",t),this.dispatchEvent(new CustomEvent("status-changed",{detail:{status:t,storyId:this.storyId},bubbles:!0,composed:!0})))}updatePriority(t){c.PRIORITIES[t]&&(this.setAttribute("priority",t),this.dispatchEvent(new CustomEvent("priority-changed",{detail:{priority:t,storyId:this.storyId},bubbles:!0,composed:!0})))}showDetail(){let t=`story-dialog-${this.storyId||this.id||"detail"}`,e=document.getElementById(t);e||(e=document.createElement("dialog"),e.id=t,e.setAttribute("data-size","l"),document.body.appendChild(e));let s=document.createElement("form");s.method="dialog";let r=document.createElement("header"),i=document.createElement("h3");i.textContent=this.storyTitle||this.storyId||"Story Detail";let a=document.createElement("button");a.type="submit",a.setAttribute("aria-label","Close"),a.textContent="\xD7",r.appendChild(i),r.appendChild(a);let o=document.createElement("section"),l=document.createElement("user-story");for(let n of this.getAttributeNames())n==="detail"||n==="compact"||n==="data-upgraded"||n==="draggable"||n==="data-id"||n==="data-quadrant"||l.setAttribute(n,this.getAttribute(n));let d=[...this.children].some(n=>n.getAttribute("slot")&&n.tagName!=="DIALOG");l.setAttribute("detail",d?"full":"compact"),l.removeAttribute("id");for(let n of[...this.children])n.tagName!=="DIALOG"&&l.appendChild(n.cloneNode(!0));o.appendChild(l),s.appendChild(r),s.appendChild(o),e.innerHTML="",e.appendChild(s),e.addEventListener("close",()=>{e.innerHTML=""},{once:!0}),e.showModal()}#e(){let t=c.PRIORITIES[this.priority]||c.PRIORITIES.medium,e=c.STATUSES[this.status]||c.STATUSES.backlog,s=this._detailLevel,r=this.storyId?`User story: ${f(this.storyId)}`:"User story";if(s==="minimal"){this.shadowRoot.innerHTML=`
        <style>${at}</style>
        <article class="story-card story-card--minimal" role="article" aria-label="${r}"
          tabindex="0">
          <div class="story-body">
            ${this.storyId?`<span class="story-id">${f(this.storyId)}</span>`:""}
            <div class="story-title-wrap">
              <slot name="title"><span class="story-title-fallback">${f(this._minimalLabel||"[describe the action]")}</span></slot>
            </div>
          </div>
        </article>
      `;let i=this.shadowRoot.querySelector(".story-card--minimal");i.addEventListener("click",()=>this.showDetail()),i.addEventListener("keydown",a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),this.showDetail())})}else this.shadowRoot.innerHTML=`
        <style>${at}</style>

        <article class="story-card story-card--${s}" part="card" role="article" aria-label="${r}">
          <header class="story-header" part="header">
            <div class="story-meta">
              ${this.storyId?`<span class="story-id" part="id">${f(this.storyId)}</span>`:""}
              ${this.epic?`<span class="epic-badge" part="epic">${f(this.epic)}</span>`:""}
            </div>
            <div class="story-badges">
              <span class="priority-badge" part="priority"
                style="color: ${t.color}; background: ${t.bg};"
              >${f(t.label)}</span>
              <span class="status-badge" part="status"
                style="color: ${e.color}; background: ${e.bg};"
              >${f(e.label)}</span>
              ${this.points?`<span class="points-badge" part="points">${f(this.points)}</span>`:""}
            </div>
          </header>

          <div class="story-body" part="body">
            <p class="story-statement" part="statement">
              <span class="keyword">As a</span>
              ${this.personaId?`<a class="persona-text persona-text--link" href="#${f(this.personaId)}">${A(k.user)} <slot name="persona"><span>user</span></slot></a>`:'<span class="persona-text"><slot name="persona"><span>user</span></slot></span>'},
              <span class="keyword">I want</span>
              <span class="action-text"><slot name="action"><span>[describe the action]</span></slot></span>${this.benefit||this.querySelector('[slot="benefit"]')?`
              <span class="keyword">so that</span>
              <span class="benefit-text"><slot name="benefit"></slot></span>`:""}
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
      `,s==="compact"&&this.shadowRoot.querySelectorAll(".section").forEach(a=>{let o=a.querySelector("slot");o&&o.assignedNodes().length===0&&a.setAttribute("data-empty","")});this.dispatchEvent(new CustomEvent("story-ready",{detail:{id:this.storyId,persona:this.persona,action:this.action,benefit:this.benefit,priority:this.priority,status:this.status,points:this.points},bubbles:!0,composed:!0}))}};x("user-story",ot);var U=`
  :host {
    display: block;
    font-family: var(--_font-sans);
    line-height: 1.6;
    color: var(--_text);
    container-type: inline-size;

    --_bg:        var(--user-journey-bg, var(--color-surface-raised, #f8f9fa));
    --_card:      var(--user-journey-card, var(--color-surface, #ffffff));
    --_border:    var(--user-journey-border, var(--color-border, #e0e0e0));
    --_muted:     var(--user-journey-muted, var(--color-text-muted, #666666));
    --_text:      var(--user-journey-text, var(--color-text, #1a1a1a));
    --_inverted:  var(--user-journey-text-inverted, var(--color-text-inverted, #ffffff));
    --_primary:   var(--user-journey-primary, var(--color-primary, var(--color-interactive, #6366f1)));
    --_accent:    var(--user-journey-accent, var(--color-accent, #8b5cf6));
    --_link:      var(--user-journey-link, var(--color-interactive, var(--color-primary, #6366f1)));
    --_curve-stroke: var(--user-journey-curve-stroke, var(--_primary));
    --_radius:    var(--user-journey-radius, var(--radius-l, 0.75rem));

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

    /* Semantic tints derived from theme tokens via color-mix.
       Subtle backgrounds (10\u201314%) for body cells, header at 22%. */
    --_tint-pos:  color-mix(in oklch, var(--color-success, #22c55e) 14%, var(--_card));
    --_tint-neu:  color-mix(in oklch, var(--color-warning, #f59e0b) 12%, var(--_card));
    --_tint-neg:  color-mix(in oklch, var(--color-error,   #ef4444) 12%, var(--_card));
    --_tint-row-pain: color-mix(in oklch, var(--color-error,   #ef4444) 8%,  var(--_card));
    --_tint-row-opp:  color-mix(in oklch, var(--color-success, #22c55e) 8%,  var(--_card));
    --_chip-type-bg:  color-mix(in oklch, var(--_accent)  18%, var(--_card));
    --_chip-type-fg:  var(--color-accent-text, var(--_accent));
    --_chip-story-bg: color-mix(in oklch, var(--_link)    18%, var(--_card));
    --_chip-story-bg-hover: color-mix(in oklch, var(--_link) 28%, var(--_card));
    --_chip-story-fg: var(--_link);
    --_grid-head-bg:  color-mix(in oklch, var(--_primary) 85%, var(--color-text, #000));
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
    background: linear-gradient(135deg, var(--_primary), var(--_accent));
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
    color: var(--_chip-type-fg);
    background: var(--_chip-type-bg);
  }

  .chip--story {
    color: var(--_chip-story-fg);
    background: var(--_chip-story-bg);
  }

  .chip--story:hover { background: var(--_chip-story-bg-hover); }

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
  a.persona-ref:hover { color: var(--_link); text-decoration: underline; }

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

  .zone { opacity: 0.55; }
  .zone--pos { fill: var(--_tint-pos); }
  .zone--neu { fill: var(--_tint-neu); }
  .zone--neg { fill: var(--_tint-neg); }

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
    background: var(--_grid-head-bg);
    color: var(--_inverted);
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
    background: var(--_grid-head-bg);
    z-index: 2;
  }

  .phase-head {
    padding: 10px 14px;
    text-align: left;
    vertical-align: top;
    border-inline-start: 1px solid color-mix(in oklch, var(--_inverted) 12%, transparent);
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
    background: var(--ec, var(--_primary));
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
  .grid-row--painpoints    .data-cell { background: var(--_tint-row-pain); }
  .grid-row--opportunities .data-cell { background: var(--_tint-row-opp); }

  /* Compact */
  .journey--compact .phase-head { min-width: 120px; padding: 8px 10px; }
  .journey--compact .data-cell  { font-size: 12px; padding: 7px 10px; }
  .journey--compact .corner     { min-width: 80px; }

  /* Utility */
  .state-msg           { padding: var(--_space-l); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
  .state-msg--error    { color: var(--color-error-text, var(--color-error, #dc2626)); }
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
`;var te=[{key:"actions",label:"Actions"},{key:"thoughts",label:"Thoughts"},{key:"touchpoints",label:"Touchpoints"},{key:"painPoints",label:"Pain Points"},{key:"opportunities",label:"Opportunities"}],nt=class extends HTMLElement{static get observedAttributes(){return["src","persona","persona-id","story-ids","compact"]}#s=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__phases=null}get phases(){return this.__phases}set phases(t){this.__phases!==t&&(this.__phases=t,this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("user-journey:phases-changed",{detail:{phases:t,source:"property"},bubbles:!0,composed:!0})))}get data(){return{persona:this.getAttribute("persona")||void 0,personaId:this.getAttribute("persona-id")||void 0,title:this.querySelector('[slot="title"]')?.textContent?.trim()||void 0,summary:this.querySelector('[slot="summary"]')?.textContent?.trim()||void 0,phases:this.__phases||void 0}}set data(t){if(!(!t||typeof t!="object")){if(t.persona&&this.setAttribute("persona",String(t.persona)),t.personaId&&this.setAttribute("persona-id",String(t.personaId)),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h2");e.slot="title",e.textContent=t.title,this.appendChild(e)}if(t.summary&&!this.querySelector('[slot="summary"]')){let e=document.createElement("p");e.slot="summary",e.textContent=t.summary,this.appendChild(e)}t.phases!=null&&(this.__phases=t.phases),this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("user-journey:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0}))}}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#s.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#s.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${U}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();if(s.persona&&this.setAttribute("persona",s.persona),s.personaId&&this.setAttribute("persona-id",s.personaId),s.title&&!this.querySelector('[slot="title"]')){let r=document.createElement("h2");r.slot="title",r.textContent=s.title,this.appendChild(r)}if(s.summary&&!this.querySelector('[slot="summary"]')){let r=document.createElement("p");r.slot="summary",r.textContent=s.summary,this.appendChild(r)}this.__phases=s.phases||[],this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${U}</style><div class="state-msg state-msg--error">Could not load journey: ${f(e.message)}</div>`}}}_render(){let t=this._resolve("persona")||"",e=this._resolve("persona-id")||"",s=(this.getAttribute("story-ids")||"").split(",").map(l=>l.trim()).filter(Boolean),r=this.hasAttribute("compact"),i=this.__phases,a=!!this.querySelector('[slot="summary"]')||this.#s.has("summary"),o=this.querySelector('[slot="title"]')?.textContent?.trim()||this.#s.get("title")||"";this.shadowRoot.innerHTML=`<style>${U}</style>
      <article class="journey${r?" journey--compact":""}">

        <header class="journey__header">
          <div class="journey__header-top">
            <div class="journey__chips">
              <span class="chip chip--type">Journey Map</span>
              ${s.map(l=>`<a class="chip chip--story" href="#${l}">${this._label(l)}</a>`).join("")}
            </div>
            ${t?`
              <div class="journey__persona">
                ${e?`<a class="persona-ref" href="#${e}">${A(k.user)} ${f(t)}</a>`:`<span class="persona-ref">${A(k.user)} ${f(t)}</span>`}
              </div>`:""}
          </div>
          <div class="journey__title-wrap">
            <slot name="title"><h2 class="journey__title">User Journey</h2></slot>
          </div>
          ${a?'<div class="journey__summary-wrap"><slot name="summary"></slot></div>':""}
        </header>

        ${i&&i.length?this._curve(i)+this._grid(i):`<div class="journey__placeholder">
               <p>Add phase data via <code>src</code> (JSON) or set <code>.phases</code> programmatically.</p>
             </div>`}

      </article>`,this.dispatchEvent(new CustomEvent("journey-ready",{bubbles:!0,composed:!0,detail:{title:o,persona:t,phaseCount:i?i.length:0}}))}_curve(t){let l=t.length,d=p=>28+(l<2?944/2:p/(l-1)*944),n=p=>14+(1-(T[p.emotion]||T.neutral).score)*72,h=t.map((p,b)=>({x:d(b),y:n(p),ph:p})),u=`M ${h[0].x},${h[0].y}`;for(let p=1;p<h.length;p++){let b=h[p-1],v=h[p],w=(b.x+v.x)/2;u+=` C ${w},${b.y} ${w},${v.y} ${v.x},${v.y}`}let m=`uj-${Math.random().toString(36).slice(2,8)}`,g=h.at(-1);return`
      <div class="journey__curve" aria-hidden="true">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" class="curve-svg">
          <defs>
            <linearGradient id="${m}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#6366f1" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0"             y="0"          width="1000" height="${100*.4}"  class="zone zone--pos"/>
          <rect x="0"             y="${100*.4}" width="1000" height="${100*.2}"  class="zone zone--neu"/>
          <rect x="0"             y="${100*.6}" width="1000" height="${100*.4}"  class="zone zone--neg"/>
          ${h.map(({x:p})=>`<line x1="${p}" y1="0" x2="${p}" y2="100" class="vline"/>`).join("")}
          <path d="${u} L ${g.x},100 L ${h[0].x},100 Z" fill="url(#${m})"/>
          <path d="${u}" fill="none" class="curve-line"/>
          ${h.map(({x:p,y:b,ph:v})=>{let w=T[v.emotion]||T.neutral;return`<circle cx="${p}" cy="${b}" r="5" class="dot" style="fill:${w.color}"/>`}).join("")}
        </svg>
      </div>`}_grid(t){let e=t.map((r,i)=>{let a=T[r.emotion]||T.neutral,o=r.storyIds||[];return`
        <th class="phase-head" data-emotion="${r.emotion||"neutral"}"
            style="--ec:${a.color}">
          <span class="ph-num">${i+1}</span>
          <span class="ph-name">${f(r.name||"")}</span>
          <span class="ph-emoji" title="${r.emotion||"neutral"}"><span role="img" aria-label="${f(r.emotion||"neutral")}">${a.emoji}</span></span>
          ${o.length?`<div class="ph-stories">${o.map(l=>`<a class="chip chip--story" href="#${l}">${this._label(l)}</a>`).join("")}</div>`:""}
        </th>`}).join(""),s=te.map(({key:r,label:i})=>{let a=t.map(o=>{let l=o[r]||[];return l.length?`<td class="data-cell data-cell--${r.toLowerCase()}">
          ${l.map(d=>`<p>${f(d)}</p>`).join("")}
        </td>`:'<td class="data-cell data-cell--empty">\u2014</td>'}).join("");return`
        <tr class="grid-row grid-row--${r.toLowerCase()}">
          <th class="row-label">${i}</th>
          ${a}
        </tr>`}).join("");return`
      <div class="journey__grid-wrap">
        <table class="journey__grid"
               aria-label="${f(this.getAttribute("title")||"User Journey")} \u2014 phase breakdown">
          <thead>
            <tr>
              <th class="corner">Stage</th>
              ${e}
            </tr>
          </thead>
          <tbody>${s}</tbody>
        </table>
      </div>`}_label(t){return t.replace(/^(activity|persona|journey|story|user)-/,"").replace(/-/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("user-journey",nt);var V=`
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
    --_accent: var(--empathy-map-accent, var(--color-interactive, var(--color-primary, #0066cc)));
    --_link:   var(--empathy-map-link, var(--color-interactive, var(--color-primary, #6366f1)));
    --_primary: var(--empathy-map-primary, var(--color-primary, #6366f1));
    --_accent-bar: var(--empathy-map-accent-bar, var(--color-accent, #8b5cf6));
    --_says:   var(--empathy-map-says, var(--color-info, #3b82f6));
    --_thinks: var(--empathy-map-thinks, var(--color-accent, #8b5cf6));
    --_does:   var(--empathy-map-does, var(--color-warning, #f59e0b));
    --_feels:  var(--empathy-map-feels, var(--color-error, #ef4444));
    --_says-bg:   color-mix(in oklch, var(--_says)   16%, var(--_card));
    --_thinks-bg: color-mix(in oklch, var(--_thinks) 16%, var(--_card));
    --_does-bg:   color-mix(in oklch, var(--_does)   16%, var(--_card));
    --_feels-bg:  color-mix(in oklch, var(--_feels)  16%, var(--_card));
    --_chip-type-bg: color-mix(in oklch, var(--_accent-bar) 18%, var(--_card));
    --_chip-type-fg: var(--_accent-bar);
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
    background: linear-gradient(135deg, var(--_primary), var(--_accent-bar));
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
    color: var(--_chip-type-fg);
    background: var(--_chip-type-bg);
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

  a.persona-ref:hover { color: var(--_link); text-decoration: underline; }

  /* \u2500\u2500 Title & summary (slotted content) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .empathy-map__title-wrap {
    margin-block-end: var(--_space-2xs);
  }

  .empathy-map__title {
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

  .empathy-map__summary-wrap {
    max-width: 72ch;
  }

  ::slotted([slot="summary"]) {
    font-size: var(--_font-sm) !important;
    color: var(--_muted) !important;
    margin: 0 !important;
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

  .quadrant--says   .quadrant__icon { background: var(--_says-bg);   color: var(--_says); }
  .quadrant--thinks .quadrant__icon { background: var(--_thinks-bg); color: var(--_thinks); }
  .quadrant--does   .quadrant__icon { background: var(--_does-bg);   color: var(--_does); }
  .quadrant--feels  .quadrant__icon { background: var(--_feels-bg);  color: var(--_feels); }

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
      border-color: var(--_border);
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
  .state-msg--error { color: var(--color-error-text, var(--color-error, #dc2626)); }
  code { font-family: var(--font-mono, Monaco, Menlo, monospace); font-size: 0.88em; }
`;var lt=["says","thinks","does","feels"],ct=class extends HTMLElement{static get observedAttributes(){return["persona","persona-id","src","editable","compact"]}#s=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__quadrants=null,this.__goals=null,this.__painPoints=null,this._editingQuadrants=new Set}get quadrants(){return this.__quadrants}set quadrants(t){this.__quadrants=t,this.isConnected&&this._render()}get goals(){return this.__goals}set goals(t){this.__goals=t,this.isConnected&&this._render()}get painPoints(){return this.__painPoints}set painPoints(t){this.__painPoints=t,this.isConnected&&this._render()}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#s.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#s.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}get data(){let t=this.querySelector('[slot="title"]'),e=this.querySelector('[slot="summary"]');return{persona:this.getAttribute("persona")||void 0,personaId:this.getAttribute("persona-id")||void 0,title:t?.textContent?.trim()||void 0,summary:e?.textContent?.trim()||void 0,quadrants:this.__quadrants||void 0,goals:this.__goals||void 0,painPoints:this.__painPoints||void 0}}set data(t){if(!(!t||typeof t!="object")){if(t.persona&&this.setAttribute("persona",String(t.persona)),t.personaId&&this.setAttribute("persona-id",String(t.personaId)),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h2");e.slot="title",e.textContent=t.title,this.appendChild(e)}if(t.summary&&!this.querySelector('[slot="summary"]')){let e=document.createElement("p");e.slot="summary",e.textContent=t.summary,this.appendChild(e)}t.quadrants!=null&&(this.__quadrants=t.quadrants),t.goals!=null&&(this.__goals=t.goals),t.painPoints!=null&&(this.__painPoints=t.painPoints),this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("empathy-map:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0}))}}editQuadrant(t){lt.includes(t)&&this.hasAttribute("editable")&&this._openEdit(t)}closeQuadrant(t){lt.includes(t)&&this._closeEdit(t)}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${V}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();if(s.persona&&this.setAttribute("persona",s.persona),s.personaId&&this.setAttribute("persona-id",s.personaId),s.title&&!this.querySelector('[slot="title"]')){let r=document.createElement("h2");r.slot="title",r.textContent=s.title,this.appendChild(r)}if(s.summary&&!this.querySelector('[slot="summary"]')){let r=document.createElement("p");r.slot="summary",r.textContent=s.summary,this.appendChild(r)}this.__quadrants=s.quadrants||null,this.__goals=s.goals||null,this.__painPoints=s.painPoints||null,this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${V}</style><div class="state-msg state-msg--error">Could not load empathy map: ${f(e.message)}</div>`}}}_render(){let t=this._resolve("persona")||"",e=this._resolve("persona-id")||"",s=this.hasAttribute("compact"),r=this.hasAttribute("editable"),i=!!this.querySelector('[slot="title"]')||this.#s.has("title"),a=!!this.querySelector('[slot="summary"]')||this.#s.has("summary"),o=this.__goals?.length||this.querySelector('[slot="goals"]'),l=this.__painPoints?.length||this.querySelector('[slot="pain-points"]');this.shadowRoot.innerHTML=`<style>${V}</style>
      <article class="empathy-map${s?" empathy-map--compact":""}">

        <header class="empathy-map__header">
          <div class="empathy-map__header-top">
            <div class="empathy-map__chips">
              <span class="chip chip--type">Empathy Map</span>
            </div>
            ${t?`
              <div class="empathy-map__persona">
                ${e?`<a class="persona-ref" href="#${f(e)}">${A(k.user)} ${f(t)}</a>`:`<span class="persona-ref">${A(k.user)} ${f(t)}</span>`}
              </div>`:""}
          </div>
          <div class="empathy-map__title-wrap">
            <slot name="title"><h2 class="empathy-map__title">Empathy Map</h2></slot>
          </div>
          ${a?'<div class="empathy-map__summary-wrap"><slot name="summary"></slot></div>':""}
        </header>

        <div class="empathy-map__grid">
          ${lt.map(d=>this._renderQuadrant(d,r)).join("")}
        </div>

        ${o||l?`
          <footer class="empathy-map__footer">
            ${this._renderSummaryRow("goals",A(k.target),"Goals")}
            ${this._renderSummaryRow("pain-points",A(k.alertTriangle),"Pain Points")}
          </footer>
        `:""}

      </article>`,r&&this._bindEditListeners(),this.dispatchEvent(new CustomEvent("empathy-map:ready",{bubbles:!0,composed:!0,detail:{title:this.querySelector('[slot="title"]')?.textContent?.trim()||"Empathy Map",persona:t}}))}_renderQuadrant(t,e){let s=st[t],r=this.__quadrants?.[t],i=this._editingQuadrants.has(t),a=r&&r.length?t==="feels"?r.map(l=>this._renderEmotion(l)).join(""):r.map(l=>`<p>${f(l)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">Add ${s.label.toLowerCase()} items\u2026</p></slot>`,o=r?.length?r.join(`
`):"";return`
      <section class="quadrant quadrant--${t}"${i?" data-editing":""}>
        <div class="quadrant__inner">
          <div class="quadrant__header">
            <div class="quadrant__icon" aria-hidden="true">${A(s.icon)}</div>
            <span class="quadrant__label">${s.label}</span>
            ${e?`<button class="quadrant__edit-btn" data-quadrant="${t}"
              aria-label="Edit ${s.label}" title="Edit ${s.label}">${A(k.pencil)}</button>`:""}
          </div>
          <div class="quadrant__faces">
            <div class="quadrant__face quadrant__face--front"${i?" inert":""}>
              <div class="quadrant__content">
                ${a}
              </div>
            </div>
            ${e?`
              <div class="quadrant__face quadrant__face--back"${i?"":" inert"}>
                <textarea class="quadrant__editor" data-quadrant="${t}"
                  placeholder="One item per line\u2026"
                  aria-label="Edit ${s.label} items">${f(o)}</textarea>
                <button class="quadrant__done-btn" data-quadrant="${t}"
                  aria-label="Done editing ${s.label}">${A(k.check)} Done</button>
              </div>
            `:""}
          </div>
        </div>
      </section>`}_renderEmotion(t){let e=t.toLowerCase().trim(),s=T[e];return s?`<span class="emotion-tag" style="--ec:${s.color}"><span role="img" aria-label="${f(t)}">${s.emoji}</span> ${f(t)}</span>`:`<p>${f(t)}</p>`}_renderSummaryRow(t,e,s){let i=(t==="pain-points"?"painPoints":t)==="painPoints"?this.__painPoints:this.__goals,a=i?.length?i.map(o=>`<p>${f(o)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">No ${s.toLowerCase()} specified.</p></slot>`;return`
      <div class="summary-row">
        <span class="summary-row__icon" aria-hidden="true">${e}</span>
        <div class="summary-row__body">
          <div class="summary-row__label">${s}</div>
          <div class="summary-row__content">${a}</div>
        </div>
      </div>`}_bindEditListeners(){let t=this.shadowRoot;t.querySelectorAll(".quadrant__edit-btn").forEach(e=>{e.addEventListener("click",()=>{this._openEdit(e.dataset.quadrant)})}),t.querySelectorAll(".quadrant__done-btn").forEach(e=>{e.addEventListener("click",()=>{this._closeEdit(e.dataset.quadrant)})}),t.querySelectorAll(".quadrant__editor").forEach(e=>{e.addEventListener("keydown",s=>{s.key==="Escape"&&(s.preventDefault(),this._closeEdit(e.dataset.quadrant))})})}_openEdit(t){this._editingQuadrants.add(t);let e=this.shadowRoot.querySelector(`.quadrant--${t}`);if(!e)return;e.setAttribute("data-editing","");let s=e.querySelector(".quadrant__face--front"),r=e.querySelector(".quadrant__face--back");s&&s.setAttribute("inert",""),r&&r.removeAttribute("inert");let i=e.querySelector(".quadrant__editor");if(i){let a=this.__quadrants?.[t];if(a?.length)i.value=a.join(`
`);else{let o=e.querySelector(`slot[name="${t}"]`);if(o){let l=o.assignedElements();if(l.length){let d=[];l.forEach(n=>{let h=n.querySelectorAll("li");h.length?h.forEach(u=>d.push(u.textContent.trim())):d.push(n.textContent.trim())}),i.value=d.filter(Boolean).join(`
`)}}}i.focus()}}_closeEdit(t){let e=this.shadowRoot.querySelector(`.quadrant--${t}`);if(!e)return;let s=e.querySelector(".quadrant__editor");if(s){let a=s.value.split(`
`).map(l=>l.trim()).filter(Boolean);this.__quadrants||(this.__quadrants={}),this.__quadrants[t]=a;let o=e.querySelector(".quadrant__content");if(o)if(a.length)o.innerHTML=t==="feels"?a.map(l=>this._renderEmotion(l)).join(""):a.map(l=>`<p>${f(l)}</p>`).join("");else{let l=st[t];o.innerHTML=`<p class="placeholder">Add ${l.label.toLowerCase()} items\u2026</p>`}}this._editingQuadrants.delete(t),e.removeAttribute("data-editing");let r=e.querySelector(".quadrant__face--front"),i=e.querySelector(".quadrant__face--back");r&&r.removeAttribute("inert"),i&&i.setAttribute("inert",""),this.dispatchEvent(new CustomEvent("empathy-map:update",{bubbles:!0,composed:!0,detail:{quadrant:t,items:this.__quadrants?.[t]||[]}}))}};x("empathy-map",ct);function Y({newItems:c,nodes:t,keyOf:e,renderItem:s,containerFor:r}){let i=[],a=[],o=[],l=new Set;for(let n of c)l.add(e(n));for(let[n,h]of[...t])l.has(n)||(h.remove(),t.delete(n),o.push(n));let d=new Map;for(let n of c){let h=e(n),u=t.get(h)||null,m=r(n,u);d.has(m)||d.set(m,[]),d.get(m).push({item:n,key:h,existing:u})}for(let[n,h]of d)for(let u=0;u<h.length;u++){let{item:m,key:g,existing:p}=h[u],b=p;b?(b.parentElement!==n||n.children[u]!==b)&&a.push(g):(b=s(m),t.set(g,b),i.push(g));let v=n.children[u];v!==b&&n.insertBefore(b,v||null)}return{added:i,moved:a,removed:o}}var dt=class c extends C{static QUADRANTS=["quick-wins","big-bets","fill-ins","money-pit"];static LABELS={"quick-wins":"Quick Wins","big-bets":"Big Bets","fill-ins":"Fill-Ins","money-pit":"Money Pit"};static DESCRIPTIONS={"quick-wins":"High impact \xB7 Low effort","big-bets":"High impact \xB7 High effort","fill-ins":"Low impact \xB7 Low effort","money-pit":"Low impact \xB7 High effort"};static#s=0;static get observedAttributes(){return["src","compact","title"]}#t=null;#e={};#i=null;#r="";#o=null;setup(){this.#r=`ie-${++c.#s}`;let t=[...this.querySelectorAll(":scope > [data-quadrant], :scope > [draggable]")],e=document.createElement("div");e.className="ie-wrapper";let s=document.createElement("div");s.className="ie-y-label",s.setAttribute("aria-hidden","true"),s.textContent="Impact \u2191";let r=document.createElement("div");r.style.cssText="display:flex;flex-direction:column;flex:1;min-width:0;";let i=document.createElement("div");i.className="ie-grid",i.setAttribute("role","region"),i.setAttribute("aria-label","Impact-Effort prioritization matrix");let a=document.createElement("div");a.className="ie-x-label",a.setAttribute("aria-hidden","true"),a.textContent="Effort \u2192";for(let n of c.QUADRANTS){let h=document.createElement("section");h.className="ie-quadrant",h.dataset.quadrantZone=n,h.setAttribute("aria-label",`${c.LABELS[n]}: ${c.DESCRIPTIONS[n]}`);let u=document.createElement("header");u.className="ie-quadrant-label",u.innerHTML=`${c.LABELS[n]}<br><span class="ie-quadrant-desc">${c.DESCRIPTIONS[n]}</span>`;let m=document.createElement("drag-surface");m.setAttribute("group",this.#r),m.setAttribute("aria-label",c.LABELS[n]),m.setAttribute("data-layout","stack"),m.setAttribute("data-layout-gap","xs"),h.appendChild(u),h.appendChild(m),i.appendChild(h),this.#e[n]=m}t.forEach((n,h)=>{let u=n.getAttribute("data-quadrant")||"quick-wins",m=this.#e[u]||this.#e["quick-wins"];n.hasAttribute("draggable")||n.setAttribute("draggable","true"),n.hasAttribute("data-id")||(n.dataset.id=`ie-item-${h}`),m.appendChild(n)});let o=document.createElement("div");o.className="ie-live-region",o.setAttribute("role","status"),o.setAttribute("aria-live","polite"),o.setAttribute("aria-atomic","true");let l=this.getAttribute("title");if(l){let n=document.createElement("h3");n.className="ie-title",n.textContent=l,this.prepend(n)}r.appendChild(i),r.appendChild(a),e.appendChild(s),e.appendChild(r),this.appendChild(e),this.appendChild(o),this.#t=i,this.#i=o,this.#o=e,this.listen(this,"drag-surface:transfer",n=>{let{item:h,fromSurface:u,toSurface:m}=n.detail,g=this.#c(u),p=this.#c(m);!g||!p||(h.setAttribute("data-quadrant",p),this.#p(`Moved ${this.#h(h)} to ${c.LABELS[p]}`),this.dispatchEvent(new CustomEvent("impact-effort:move",{bubbles:!0,detail:{itemId:h.dataset.id,from:g,to:p,item:h}})))});let d=this.getAttribute("src");d&&this.#l(d),this.#u()}teardown(){this.#o&&(this.#o.remove(),this.#o=null),this.#i&&(this.#i.remove(),this.#i=null),this.#t=null,this.#e={},this.#n.clear(),this.#a=[]}#a=[];#n=new Map;get items(){if(this.#a.length)return this.#a;let t=[];for(let[e,s]of Object.entries(this.#e))for(let r of s.querySelectorAll(':scope > [draggable="true"]'))t.push({id:r.getAttribute("data-id")||void 0,quadrant:e,text:r.textContent?.trim()||void 0});return t}set items(t){if(!this.#t)return;let e=Array.isArray(t)?t:[];Y({newItems:e,nodes:this.#n,keyOf:s=>s.id??`${s.quadrant}:${s.text}`,renderItem:s=>{if(typeof this.renderItem=="function"){let i=this.renderItem(s);if(i instanceof Element)return i.hasAttribute("draggable")||i.setAttribute("draggable","true"),i.hasAttribute("data-id")||i.setAttribute("data-id",String(s.id??"")),i}let r=document.createElement("article");return r.className="ie-card",r.setAttribute("draggable","true"),s.id&&r.setAttribute("data-id",String(s.id)),r.textContent=s.text||s.id||"",r},containerFor:s=>this.#e[s.quadrant]||this.#e["quick-wins"]}),this.#a=e,this.dispatchEvent(new CustomEvent("impact-effort:items-changed",{detail:{items:e,source:"property"},bubbles:!0}))}attributeChangedCallback(t,e,s){this.hasAttribute("data-upgraded")&&t==="src"&&s&&s!==e&&this.#l(s)}async#l(t){try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();if(!Array.isArray(s))return;for(let r of c.QUADRANTS){let i=this.#e[r];if(i)for(let a of[...i.querySelectorAll("[draggable]")])a.remove()}s.forEach((r,i)=>{let a=r.quadrant||"quick-wins",o=r.id||`ie-item-${i}`,l;r.persona||r.action||r.storyId?(l=document.createElement("user-story"),l.setAttribute("detail","minimal"),r.storyId&&l.setAttribute("story-id",r.storyId),r.persona&&l.setAttribute("persona",r.persona),r.action&&l.setAttribute("action",r.action),r.benefit&&l.setAttribute("benefit",r.benefit),r.priority&&l.setAttribute("priority",r.priority),r.status&&l.setAttribute("status",r.status),r.points&&l.setAttribute("points",String(r.points))):(l=document.createElement("article"),l.textContent=r.label||r.text||""),l.setAttribute("draggable","true"),l.dataset.id=o,l.dataset.quadrant=a,(this.#e[a]||this.#e["quick-wins"]).appendChild(l)}),this.#u()}catch(e){console.warn(`[impact-effort] Failed to load src="${t}":`,e)}}#c(t){for(let[e,s]of Object.entries(this.#e))if(s===t)return e;return null}#p(t){let e=this.#i;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#h(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#u(){let t={};for(let e of c.QUADRANTS){let s=this.#e[e];t[e]=s?s.querySelectorAll('[draggable="true"]').length:0}this.dispatchEvent(new CustomEvent("impact-effort:ready",{bubbles:!0,detail:{quadrantCounts:t}}))}};x("impact-effort",dt);var ht=class c extends C{static#s=0;setup(){this.#h=`qg-${++c.#s}`;let t=this.getAttribute("x-label")||"",e=this.getAttribute("y-label")||"",s=this.getAttribute("x-low")||"Low",r=this.getAttribute("x-high")||"High",i=this.getAttribute("y-low")||"Low",a=this.getAttribute("y-high")||"High",o=[this.getAttribute("q1-label")||"Q1",this.getAttribute("q2-label")||"Q2",this.getAttribute("q3-label")||"Q3",this.getAttribute("q4-label")||"Q4"],l=this.hasAttribute("draggable"),d=[...this.querySelectorAll(":scope > [data-quadrant], :scope > [data-x][data-y]")],n=document.createElement("section");n.className="qg-wrapper",n.setAttribute("role","region"),n.setAttribute("aria-label",`${e} \xD7 ${t} quadrant grid`);let h=document.createElement("header");h.className="qg-y-label",h.setAttribute("aria-hidden","true"),h.textContent=`\u2191 ${e}`;let u=document.createElement("aside");u.className="qg-y-scale",u.setAttribute("aria-hidden","true"),u.innerHTML=`<span>${a}</span><span>${i}</span>`;let m=document.createElement("div");m.className="qg-grid";let g=document.createElement("aside");g.className="qg-x-scale",g.setAttribute("aria-hidden","true"),g.innerHTML=`<span>${s}</span><span>${r}</span>`;let p=document.createElement("footer");p.className="qg-x-label",p.setAttribute("aria-hidden","true"),p.textContent=`${t} \u2192`;for(let v=0;v<4;v++){let w=document.createElement("section");w.className="qg-quadrant",w.dataset.quadrantZone=String(v),w.setAttribute("aria-label",o[v]);let y=document.createElement("header");if(y.className="qg-quadrant-label",y.textContent=o[v],w.appendChild(y),l){let _=document.createElement("drag-surface");_.setAttribute("group",this.#h),_.setAttribute("aria-label",o[v]),_.setAttribute("data-layout","stack"),_.setAttribute("data-layout-gap","xs"),w.appendChild(_),this.#u[v]=_}else{let _=document.createElement("ul");_.className="qg-items",w.appendChild(_),this.#m[v]=_}m.appendChild(w),this.#y[v]=w}d.forEach((v,w)=>{let y=this.#n(v),_=l?this.#u[y]:this.#m[y];if(l&&(v.hasAttribute("draggable")||v.setAttribute("draggable","true")),v.hasAttribute("data-id")||(v.dataset.id=`qg-item-${w}`),v.hasAttribute("data-x")&&v.hasAttribute("data-y")){let S=parseFloat(v.getAttribute("data-x")),E=parseFloat(v.getAttribute("data-y"));if(Number.isFinite(S)&&Number.isFinite(E)){let M=y===0||y===3?(S-.5)*2:S*2,I=y===0||y===1?(E-.5)*2:E*2;if(v.style.setProperty("--qg-local-x",M.toFixed(4)),v.style.setProperty("--qg-local-y",I.toFixed(4)),v.classList.add("qg-pinned"),!v.style.getPropertyValue("--qg-pin-hue")){let H=v.dataset.id||(v.textContent||"").trim();v.style.setProperty("--qg-pin-hue",`${c.#o(H)}deg`)}}}if(l)_.appendChild(v);else{let S=document.createElement("li");S.appendChild(v),_.appendChild(S)}});let b=document.createElement("div");b.className="qg-live-region visually-hidden",b.setAttribute("role","status"),b.setAttribute("aria-live","polite"),n.appendChild(h),n.appendChild(u),n.appendChild(m),n.appendChild(g),n.appendChild(p),this.appendChild(n),this.appendChild(b),this.#d=m,this.#f=b,this.#x=o,l&&this.listen(this,"drag-surface:transfer",this.#a),this.#t()}#t(){if(typeof ResizeObserver>"u")return;let t=e=>{let s=e.offsetWidth,r=e.offsetHeight;s>0&&e.style.setProperty("--qg-pin-half-w",`${s/2}px`),r>0&&e.style.setProperty("--qg-pin-half-h",`${r/2}px`)};this.#g=new ResizeObserver(e=>{for(let s of e)t(s.target);this.#e()});for(let e of this.querySelectorAll(".qg-pinned"))this.#g.observe(e);this.#e()}#e(){this.#b||(this.#b=requestAnimationFrame(()=>{this.#b=0,this.#i()}))}#i(){for(let e of this.querySelectorAll(".qg-pinned"))e.classList.remove("qg-clustered"),e.style.removeProperty("--qg-cluster-i"),e.style.removeProperty("--qg-cluster-n"),delete e.dataset.cluster,e.dataset.qgTabbed!==void 0&&(e.removeAttribute("tabindex"),delete e.dataset.qgTabbed);let t=0;for(let e=0;e<4;e++){let s=this.#y[e];if(!s)continue;let r=[...s.querySelectorAll(".qg-pinned")];if(r.length<2)continue;let i=r.map(n=>n.getBoundingClientRect()),a=Array.from({length:r.length},(n,h)=>h),o=n=>a[n]===n?n:a[n]=o(a[n]),l=(n,h)=>{let u=o(n),m=o(h);u!==m&&(a[u]=m)};for(let n=0;n<r.length;n++)for(let h=n+1;h<r.length;h++)c.#r(i[n],i[h])&&l(n,h);let d=new Map;for(let n=0;n<r.length;n++){let h=o(n);d.has(h)||d.set(h,[]),d.get(h).push(n)}for(let n of d.values()){if(n.length<2)continue;let h=`c${++t}`;n.forEach((u,m)=>{let g=r[u];g.classList.add("qg-clustered"),g.dataset.cluster=h,g.style.setProperty("--qg-cluster-i",String(m)),g.style.setProperty("--qg-cluster-n",String(n.length)),!g.hasAttribute("tabindex")&&!g.matches("a, button, [contenteditable]")&&(g.setAttribute("tabindex","0"),g.dataset.qgTabbed="")})}}}teardown(){this.#g?.disconnect(),this.#g=null,this.#b&&cancelAnimationFrame(this.#b),this.#b=0}static#r(t,e){return!(t.right<=e.left||e.right<=t.left||t.bottom<=e.top||e.bottom<=t.top)}static#o(t){let e=5381;for(let s=0;s<t.length;s++)e=(e<<5)+e+t.charCodeAt(s)|0;return(e%360+360)%360}#a=t=>{let{item:e,fromSurface:s,toSurface:r}=t.detail,i=this.#l(s),a=this.#l(r);i==null||a==null||(e.setAttribute("data-quadrant",String(a)),this.#p(`Moved ${this.#c(e)} to ${this.#x[a]}`),this.dispatchEvent(new CustomEvent("quadrant-grid:move",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,from:i,to:a}})))};#n(t){let e=parseInt(t.getAttribute("data-quadrant"),10);if(e>=0&&e<=3)return e;if(t.hasAttribute("data-x")&&t.hasAttribute("data-y")){let s=parseFloat(t.getAttribute("data-x")),r=parseFloat(t.getAttribute("data-y"));return c.quadrantFor(s,r)}return 0}static quadrantFor(t,e){let s=t>=.5,r=e>=.5;return r&&s?0:r&&!s?1:!r&&!s?2:3}#l(t){for(let e=0;e<4;e++)if(this.#u[e]===t)return e;return null}#c(t){return(t.textContent||"").trim().split(`
`)[0]||"item"}#p(t){this.#f&&(this.#f.textContent=t)}#h="";#u={};#m={};#y={};#d=null;#f=null;#x=[];#g=null;#b=0};x("quadrant-grid",ht);var Mt=5,ut=class c extends C{setup(){let t=this.querySelector(":scope > template"),e=t?c.#t(t):[];if(this.hasAttribute("src")){this.#s(this.getAttribute("src"));return}this.#e(e)}async#s(t){try{let s=await(await fetch(t)).json();this.#e(Array.isArray(s)?s:[])}catch(e){console.warn("risk-register: failed to load src",t,e),this.#e([])}}static#t(t){let e=[],s=t.content.querySelectorAll("tr");for(let r of s){let i=[...r.children],a=i[0]?.textContent?.trim()||"",o=r.getAttribute("data-id")||a.toLowerCase().replace(/\s+/g,"-")||`risk-${e.length}`;e.push({id:o,title:a,likelihood:parseInt(i[1]?.textContent??"",10)||0,impact:parseInt(i[2]?.textContent??"",10)||0,owner:i[3]?.textContent?.trim()||"",mitigation:i[4]?.textContent?.trim()||""})}return e}#e(t){this.#a=t,[...this.children].forEach(r=>{r.tagName!=="TEMPLATE"&&r.remove()});let e=this.getAttribute("label");if(e){let r=document.createElement("header");r.className="rr-label",r.textContent=e,this.appendChild(r)}let s=document.createElement("div");s.className="rr-layout",s.appendChild(this.#i(t)),s.appendChild(this.#r(t)),this.appendChild(s),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent("risk-register:ready",{bubbles:!0,detail:{count:t.length}}))})}#i(t){let e=document.createElement("data-table"),s=document.createElement("table");return s.innerHTML=`
      <thead>
        <tr>
          <th data-sort="string">Title</th>
          <th data-sort="number">Likelihood</th>
          <th data-sort="number">Impact</th>
          <th data-sort="number" data-rollup="product" data-heatmap="low-good">Severity</th>
          <th data-sort="string">Owner</th>
          <th data-sort="string">Mitigation</th>
        </tr>
      </thead>
      <tbody>
        ${t.map(r=>`
          <tr data-id="${c.#o(r.id)}">
            <td>${c.#o(r.title)}</td>
            <td>${r.likelihood||""}</td>
            <td>${r.impact||""}</td>
            <td></td>
            <td>${c.#o(r.owner)}</td>
            <td>${c.#o(r.mitigation)}</td>
          </tr>
        `).join("")}
      </tbody>
    `,e.appendChild(s),e}#r(t){let e=document.createElement("quadrant-grid");e.setAttribute("x-label","Likelihood"),e.setAttribute("y-label","Impact"),e.setAttribute("x-low","Rare"),e.setAttribute("x-high","Likely"),e.setAttribute("y-low","Minor"),e.setAttribute("y-high","Severe"),e.setAttribute("q1-label","Avoid"),e.setAttribute("q2-label","Plan"),e.setAttribute("q3-label","Accept"),e.setAttribute("q4-label","Mitigate");for(let s of t){if(!s.likelihood||!s.impact)continue;let r=document.createElement("span"),i=Math.min(1,Math.max(0,s.likelihood/Mt)),a=Math.min(1,Math.max(0,s.impact/Mt));r.setAttribute("data-x",i.toFixed(3)),r.setAttribute("data-y",a.toFixed(3)),r.setAttribute("data-id",s.id),r.setAttribute("title",`${s.title} \u2014 likelihood ${s.likelihood}, impact ${s.impact}`),r.textContent=s.title,e.appendChild(r)}return e}static#o(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}#a=[];get rows(){return[...this.#a]}set rows(t){this.#e(Array.isArray(t)?t:[])}};x("risk-register",ut);var pt=class c extends C{setup(){let t=this.getAttribute("rows"),e=this.getAttribute("cols"),s=this.getAttribute("link-attr");if(!t||!e||!s)return console.warn("traceability-matrix: requires rows, cols, and link-attr attributes"),!1;queueMicrotask(()=>this.#s(t,e,s))}#s(t,e,s){let r=[...document.querySelectorAll(t)].filter(y=>y!==this&&!this.contains(y)),i=[...document.querySelectorAll(e)].filter(y=>y!==this&&!this.contains(y));if(!r.length||!i.length){this.#i();return}let a=this.getAttribute("row-label")||"",o=this.getAttribute("cell-mark")||"\u2713",l=this.hasAttribute("flag-orphans"),d=[],n=new WeakMap,h=new WeakMap;for(let y of r){let _=c.#r(y.getAttribute(s));for(let S of _){let E=i.find(M=>M.id===S);E&&(d.push({rowEl:y,colEl:E}),n.set(y,(n.get(y)||0)+1),h.set(E,(h.get(E)||0)+1))}}let u=document.createElement("data-table"),m=document.createElement("table"),g=document.createElement("thead"),p=document.createElement("tr"),b=document.createElement("th");b.setAttribute("data-sort","string"),b.textContent=a,p.appendChild(b);for(let y of i){let _=document.createElement("th");_.setAttribute("data-sort","number"),_.textContent=c.#o(y),_.dataset.colId=y.id||"",l&&!h.get(y)&&(_.dataset.orphan=""),p.appendChild(_)}g.appendChild(p),m.appendChild(g);let v=document.createElement("tbody");for(let y of r){let _=document.createElement("tr");_.dataset.rowId=y.id||"",l&&!n.get(y)&&(_.dataset.orphan="");let S=document.createElement("th");S.scope="row",S.textContent=c.#o(y),_.appendChild(S);let E=c.#r(y.getAttribute(s));for(let M of i){let I=document.createElement("td"),H=E.includes(M.id);I.setAttribute("data-sort-value",H?"1":"0"),H?(I.dataset.linked="",I.textContent=o,I.setAttribute("aria-label","linked")):I.setAttribute("aria-label","not linked"),I.dataset.colId=M.id||"",_.appendChild(I)}v.appendChild(_)}m.appendChild(v),u.appendChild(m),[...this.children].forEach(y=>{y.tagName!=="TEMPLATE"&&y.remove()});let w=this.getAttribute("label");if(w){let y=document.createElement("header");y.className="tm-label",y.textContent=w,this.appendChild(y)}this.appendChild(u),this.#a=u,this.#n=new Map(r.map(y=>[y.id,y])),this.#l=new Map(i.map(y=>[y.id,y])),this.listen(u,"click",this.#t),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent("traceability-matrix:ready",{bubbles:!0,detail:{rowCount:r.length,colCount:i.length,linkCount:d.length}}))})}#t=t=>{let e=t.target.closest('td, th[scope="row"]');if(!e)return;let s=e.closest("tr");if(!s)return;let r=s.dataset.rowId,i=e.dataset.colId,a=r?this.#n.get(r):null,o=i?this.#l.get(i):null,l=e.hasAttribute("data-state-highlighted");if(this.#e(),l){this.dispatchEvent(new CustomEvent("traceability-matrix:highlight",{bubbles:!0,detail:{rowEl:a,colEl:o,on:!1}}));return}e.setAttribute("data-state-highlighted",""),a&&a.setAttribute("data-state-highlighted",""),o&&o!==a&&o.setAttribute("data-state-highlighted",""),s.setAttribute("data-state-highlighted",""),this.dispatchEvent(new CustomEvent("traceability-matrix:highlight",{bubbles:!0,detail:{rowEl:a,colEl:o,on:!0}}))};#e(){this.#a&&(this.#a.querySelectorAll("[data-state-highlighted]").forEach(t=>t.removeAttribute("data-state-highlighted")),document.querySelectorAll("[data-state-highlighted]").forEach(t=>{(this.#n.has(t.id)||this.#l.has(t.id))&&t.removeAttribute("data-state-highlighted")}))}#i(){[...this.children].forEach(e=>{e.tagName!=="TEMPLATE"&&e.remove()});let t=document.createElement("p");t.className="tm-empty",t.textContent="No matching elements found for this matrix.",this.appendChild(t)}static#r(t){return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}static#o(t){return t.getAttribute("data-matrix-label")||t.id||(t.textContent||"").trim().split(`
`)[0].slice(0,60)||"(unnamed)"}#a=null;#n=new Map;#l=new Map};x("traceability-matrix",pt);var ee=864e5,mt=class c extends C{setup(){let t=this.getAttribute("start"),e=this.getAttribute("end"),s=parseFloat(this.getAttribute("total"));if(!t||!e||!Number.isFinite(s))return console.warn("burndown-chart: requires start, end, and total attributes"),!1;let r=c.#e(t),i=c.#e(e);if(!r||!i||i<r)return console.warn("burndown-chart: start/end dates invalid",t,e),!1;let a=(this.getAttribute("weekends")||"include")!=="exclude",o=this.getAttribute("unit")||"points",l=this.getAttribute("label")||"",d=this.querySelector(":scope > template"),n=d?c.#t(d):[],h=n.filter(p=>p.delta!==0),u=c.#r(r,i),m=c.#o(u,s,a),g=c.#a(u,n);this.#s({label:l,unit:o,dayLabels:u,actual:g,ideal:m,scopeChanges:h}),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent("burndown-chart:ready",{bubbles:!0,detail:{dayCount:u.length,total:s,scopeChanges:h.length}}))})}#s({label:t,unit:e,dayLabels:s,actual:r,ideal:i,scopeChanges:a}){if([...this.children].forEach(h=>{h.tagName!=="TEMPLATE"&&h.remove()}),t){let h=document.createElement("header");h.className="bdc-label",h.textContent=t,this.appendChild(h)}let o=document.createElement("chart-wc");o.setAttribute("data-type","line"),o.setAttribute("data-legend",""),o.setAttribute("data-tooltip",""),o.setAttribute("data-label-x","Day"),o.setAttribute("data-label-y",e);let l={},d={};s.forEach((h,u)=>{l[h]=i[u],r[u]!==null&&(d[h]=r[u])});let n=[{name:"Actual",values:d},{name:"Ideal",values:l}];if(o.setAttribute("data-values",JSON.stringify(n)),this.appendChild(o),a.length){let h=document.createElement("aside");h.className="bdc-scope-changes";let u=document.createElement("h4");u.textContent="Scope changes",h.appendChild(u);let m=document.createElement("ul");for(let g of a){let p=document.createElement("li"),b=g.delta>0?"+":"";p.innerHTML=`<time datetime="${g.date}">${g.date}</time>: <strong>${b}${g.delta} ${e}</strong>`,m.appendChild(p)}h.appendChild(m),this.appendChild(h)}}static#t(t){let e=[],s=t.content.querySelectorAll("tr");for(let r of s){let i=[...r.children],a=i[0]?.textContent?.trim(),o=parseFloat(i[1]?.textContent??""),l=parseFloat(i[2]?.textContent??"0")||0;!a||!Number.isFinite(o)||e.push({date:a,remaining:o,delta:l})}return e}static#e(t){let e=String(t).match(/^(\d{4})-(\d{2})-(\d{2})/);return e?new Date(Number(e[1]),Number(e[2])-1,Number(e[3])):null}static#i(t){let e=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0");return`${t.getFullYear()}-${e}-${s}`}static#r(t,e){let s=[];for(let r=t.getTime();r<=e.getTime();r+=ee)s.push(c.#i(new Date(r)));return s}static#o(t,e,s){let r=n=>{let u=c.#e(n).getDay();return u===0||u===6},i=t.map((n,h)=>({d:n,i:h,weekend:r(n)})).filter(n=>s||!n.weekend),a=i.length>1?e/(i.length-1):0,o=new Array(t.length).fill(null),l=e,d=0;for(let n=0;n<t.length;n++){let h=r(t[n]);s||!h?(o[n]=Math.max(0,e-a*d),d++,l=o[n]):o[n]=l}return o}static#a(t,e){let s=new Map(e.map(r=>[r.date,r.remaining]));return t.map(r=>s.has(r)?s.get(r):null)}};x("burndown-chart",mt);var ft=class c extends C{setup(){let t=this.getAttribute("start"),e=this.getAttribute("end");if(!t||!e)return console.warn("product-roadmap: start and end attributes required"),!1;let s=c.#m(t,"start"),r=c.#m(e,"end");if(!s||!r||r<=s)return console.warn("product-roadmap: invalid start/end",t,e),!1;this.#d=s,this.#f=r,this.#x=r.getTime()-s.getTime(),this.#g=this.getAttribute("view")==="month"?"month":"quarter",this.#b=this.hasAttribute("editable");let i=[...this.querySelectorAll(":scope > section[data-lane]")];if(!i.length)return console.warn("product-roadmap: no <section data-lane> children found"),!1;this.#v=i,this.#s()}attributeChangedCallback(){this.isConnected&&this.#v.length&&this.#s()}#s(){[...this.children].forEach(r=>{this.#v.includes(r)||r.remove()}),this.#v.forEach(r=>{r.hidden=!0});let t=document.createElement("div");t.className="rm-wrapper";let e=this.#t();t.appendChild(e);let s=document.createElement("div");s.className="rm-lanes";for(let r of this.#v){let i=r.getAttribute("data-lane")||"",a=document.createElement("section");a.className="rm-lane",a.dataset.lane=i;let o=document.createElement("header");o.className="rm-lane-label",o.textContent=i,a.appendChild(o);let l=document.createElement("div");l.className="rm-track",l.dataset.lane=i;let d=[...r.querySelectorAll(":scope > article[data-start][data-end]")];for(let n of d){let h=this.#e(n,i);h&&l.appendChild(h)}this.#b&&(l.addEventListener("dragover",this.#n),l.addEventListener("drop",this.#l)),a.appendChild(l),s.appendChild(a)}if(t.appendChild(s),this.hasAttribute("today-marker")){let r=new Date;if(r>=this.#d&&r<=this.#f){let i=document.createElement("div");i.className="rm-today",i.style.setProperty("--rm-x",this.#c(r).toFixed(4)),i.title=`Today: ${c.#y(r)}`,s.appendChild(i)}}this.appendChild(t),this.#k=t}#t(){let t=document.createElement("header");t.className="rm-axis";let e=this.#u();for(let s of e){let r=document.createElement("div");r.className="rm-tick",r.style.setProperty("--rm-x",s.startFraction.toFixed(4)),r.style.setProperty("--rm-w",(s.endFraction-s.startFraction).toFixed(4)),r.textContent=s.label,t.appendChild(r)}return t}#e(t,e){let s=c.#m(t.getAttribute("data-start"),"start"),r=c.#m(t.getAttribute("data-end"),"end");if(!s||!r)return null;let i=s<this.#d?this.#d:s,a=r>this.#f?this.#f:r;if(i>=a)return null;let o=this.#c(i),l=this.#c(a)-o,d=document.createElement("article");d.className="rm-bar",d.style.setProperty("--rm-x",o.toFixed(4)),d.style.setProperty("--rm-w",l.toFixed(4)),d.dataset.lane=e,d.dataset.start=c.#y(s),d.dataset.end=c.#y(r),t.dataset.status&&(d.dataset.status=t.dataset.status),t.id&&(d.dataset.sourceId=t.id),this.#b&&d.setAttribute("draggable","true");let n=t.querySelector("h1, h2, h3, h4, h5, h6"),h=document.createElement("span");if(h.className="rm-bar-title",h.textContent=n?n.textContent.trim():(t.textContent||"").trim().split(`
`)[0],d.appendChild(h),d.setAttribute("aria-label",`${h.textContent} \u2014 ${d.dataset.start} to ${d.dataset.end} in ${e}`),d.addEventListener("click",u=>{this.#A||this.dispatchEvent(new CustomEvent("product-roadmap:select",{bubbles:!0,detail:{initiative:t,lane:e,start:d.dataset.start,end:d.dataset.end,status:d.dataset.status||null}}))}),this.#b){let u=document.createElement("span");u.className="rm-bar-handle",u.setAttribute("aria-label","Resize end date"),d.appendChild(u),u.addEventListener("pointerdown",m=>this.#r(m,d,t)),d.addEventListener("pointerdown",m=>{m.target!==u&&this.#i(m,d,t)}),d.addEventListener("dragstart",m=>{m.dataTransfer.effectAllowed="move",m.dataTransfer.setData("text/plain",t.id||d.dataset.sourceId||""),this.#_=t,this.#C=e}),d.addEventListener("dragend",()=>{this.#_=null,this.#C=null})}return d}#i(t,e,s){if(t.button!==0)return;t.preventDefault();let r=e.parentElement.getBoundingClientRect(),i=t.clientX,a=parseFloat(e.style.getPropertyValue("--rm-x"))||0,o=parseFloat(e.style.getPropertyValue("--rm-w"))||0;this.#A={kind:"move",bar:e,initiative:s,trackRect:r,startX:i,startFraction:a,widthFraction:o},e.setPointerCapture(t.pointerId),e.addEventListener("pointermove",this.#o),e.addEventListener("pointerup",this.#a),e.addEventListener("pointercancel",this.#a)}#r(t,e,s){if(t.button!==0)return;t.preventDefault(),t.stopPropagation();let r=e.parentElement.getBoundingClientRect(),i=t.clientX,a=parseFloat(e.style.getPropertyValue("--rm-x"))||0,o=parseFloat(e.style.getPropertyValue("--rm-w"))||0;this.#A={kind:"resize",bar:e,initiative:s,trackRect:r,startX:i,startFraction:a,widthFraction:o},e.setPointerCapture(t.pointerId),e.addEventListener("pointermove",this.#o),e.addEventListener("pointerup",this.#a),e.addEventListener("pointercancel",this.#a)}#o=t=>{if(!this.#A)return;let{kind:e,bar:s,trackRect:r,startX:i,startFraction:a,widthFraction:o}=this.#A,l=(t.clientX-i)/r.width;if(e==="move"){let d=Math.max(0,Math.min(1-o,a+l));s.style.setProperty("--rm-x",d.toFixed(4))}else if(e==="resize"){let d=Math.max(.02,Math.min(1-a,o+l));s.style.setProperty("--rm-w",d.toFixed(4))}};#a=t=>{if(!this.#A)return;let{kind:e,bar:s,initiative:r}=this.#A;s.releasePointerCapture(t.pointerId),s.removeEventListener("pointermove",this.#o),s.removeEventListener("pointerup",this.#a),s.removeEventListener("pointercancel",this.#a);let i=parseFloat(s.style.getPropertyValue("--rm-x"))||0,a=parseFloat(s.style.getPropertyValue("--rm-w"))||0,o=this.#h(this.#p(i)),l=this.#h(this.#p(i+a));s.dataset.start=c.#y(o),s.dataset.end=c.#y(l);let d=this.#c(o),n=this.#c(l)-d;s.style.setProperty("--rm-x",d.toFixed(4)),s.style.setProperty("--rm-w",n.toFixed(4)),r.setAttribute("data-start",s.dataset.start),r.setAttribute("data-end",s.dataset.end),this.dispatchEvent(new CustomEvent(e==="move"?"product-roadmap:reschedule":"product-roadmap:resize",{bubbles:!0,detail:{initiative:r,lane:s.dataset.lane,start:s.dataset.start,end:s.dataset.end}})),setTimeout(()=>{this.#A=null},0)};#n=t=>{this.#_&&(t.preventDefault(),t.dataTransfer.dropEffect="move")};#l=t=>{if(!this.#_)return;t.preventDefault();let e=t.currentTarget.dataset.lane,s=this.#_,r=this.#C;if(e===r)return;let i=this.#v.find(a=>a.getAttribute("data-lane")===e);i&&i.appendChild(s),this.dispatchEvent(new CustomEvent("product-roadmap:move",{bubbles:!0,detail:{initiative:s,fromLane:r,toLane:e,start:s.getAttribute("data-start"),end:s.getAttribute("data-end")}})),this.#s()};#c(t){let e=t.getTime()-this.#d.getTime();return Math.max(0,Math.min(1,e/this.#x))}#p(t){return new Date(this.#d.getTime()+t*this.#x)}#h(t){if(this.#g==="month")return new Date(t.getFullYear(),t.getMonth(),1);let e=t.getMonth(),s=Math.floor(e/3)*3;return new Date(t.getFullYear(),s,1)}#u(){let t=[];if(this.#g==="quarter"){let e=this.#h(this.#d);for(;e<this.#f;){let s=new Date(e.getFullYear(),e.getMonth()+3,1),r=this.#c(e<this.#d?this.#d:e),i=this.#c(s>this.#f?this.#f:s),a=Math.floor(e.getMonth()/3)+1;t.push({startFraction:r,endFraction:i,label:`Q${a} ${e.getFullYear()}`}),e=s}}else{let e=new Date(this.#d.getFullYear(),this.#d.getMonth(),1);for(;e<this.#f;){let s=new Date(e.getFullYear(),e.getMonth()+1,1),r=this.#c(e<this.#d?this.#d:e),i=this.#c(s>this.#f?this.#f:s),a=e.toLocaleString(void 0,{month:"short"});t.push({startFraction:r,endFraction:i,label:`${a} ${e.getFullYear()}`}),e=s}}return t}static#m(t,e){if(!t)return null;let s=String(t).match(/^(\d{4})-Q([1-4])$/i);if(s){let a=Number(s[1]),l=(Number(s[2])-1)*3;return e==="end"?new Date(a,l+3,0):new Date(a,l,1)}let r=String(t).match(/^(\d{4})-(\d{2})-(\d{2})/);if(r)return new Date(Number(r[1]),Number(r[2])-1,Number(r[3]));let i=new Date(t);return isNaN(i.getTime())?null:i}static#y(t){let e=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0");return`${t.getFullYear()}-${e}-${s}`}#d=null;#f=null;#x=0;#g="quarter";#b=!1;#v=[];#k=null;#A=null;#_=null;#C=null};x("product-roadmap",ft);function Lt(c){return class extends c{static keyOf(t){return t.id}#s=[];#t=new Map;get items(){return this.#s}set items(t){let e=t||[],s=Y({newItems:e,nodes:this.#t,keyOf:this.constructor.keyOf,renderItem:r=>this._renderItem(r),containerFor:(r,i)=>this._containerFor(r,i)});this.#s=e,this._postRender({...s,items:e}),this._emit("items-changed",{items:e},"api")}_renderItem(t){throw new Error(`${this.constructor.name}: must implement _renderItem(item)`)}_containerFor(t,e){return this}_postRender(t){}_emit(t,e,s="api"){this.dispatchEvent(new CustomEvent(`${this.localName}:${t}`,{detail:{...e,source:s},bubbles:!0}))}_nodeFor(t){return this.#t.get(t)||null}_seedCollection(t,e){this.#s=t,this.#t.clear();for(let[s,r]of e)this.#t.set(s,r)}_setItemsSilently(t){this.#s=t}}}var gt=class c extends Lt(C){static get observedAttributes(){return["src","compact","title"]}static keyOf(t){return t.id??t.storyId}static#s=0;#t=null;#e={};#i={};#r=null;#o="";#a=[];#n=null;setup(){this.#o=`kb-${++c.#s}`;let t=[...this.querySelectorAll(":scope > section[data-column]")];this.#a=t.map(i=>{let a=i.getAttribute("data-column")||"",l=i.getAttribute("data-column-label")||""||this.#x(a),d=i.getAttribute("data-wip"),n=d?parseInt(d,10):null,h=i.getAttribute("data-column-color")||null,u=[...i.children];return{id:a,label:l,wip:n,color:h,children:u}});for(let i of t)i.remove();this.#t=document.createElement("div"),this.#t.className="kb-columns",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label","Kanban board");let e=0;for(let i of this.#a){let a=document.createElement("section");a.className="kb-column",a.setAttribute("data-column-id",i.id),i.color&&a.setAttribute("data-column-tint",i.color);let o=document.createElement("header");o.className="kb-column-header";let l=document.createElement("h3");l.textContent=i.label;let d=document.createElement("output");if(d.className="kb-count",d.textContent=String(i.children.length),l.appendChild(d),i.wip!==null&&!isNaN(i.wip)){let h=document.createElement("span");h.className="kb-wip",h.textContent=`/ ${i.wip}`,h.setAttribute("aria-label",`WIP limit ${i.wip}`),l.appendChild(h)}o.appendChild(l),a.appendChild(o);let n=document.createElement("drag-surface");if(n.setAttribute("group",this.#o),n.setAttribute("aria-label",`${i.label} items`),n.setAttribute("data-layout","stack"),n.setAttribute("data-layout-gap","xs"),i.children.length>0){for(let h of i.children)h.hasAttribute("draggable")||h.setAttribute("draggable","true"),h.hasAttribute("data-id")||(h.dataset.id=`kb-item-${e}`),n.appendChild(h);e+=i.children.length}else{let h=document.createElement("p");h.className="kb-empty",h.textContent="No items",n.appendChild(h)}a.appendChild(n),this.#t.appendChild(a),this.#e[i.id]=n,this.#i[i.id]=a,i.wip!==null&&i.children.length>i.wip&&a.setAttribute("data-wip-exceeded","")}let s=this.getAttribute("title");if(s){let i=document.createElement("h2");i.className="kb-title",i.textContent=s,this.appendChild(i)}this.appendChild(this.#t),this.#r=document.createElement("div"),this.#r.className="kb-live-region",this.#r.setAttribute("role","status"),this.#r.setAttribute("aria-live","polite"),this.#r.setAttribute("aria-atomic","true"),this.appendChild(this.#r),this.listen(this,"drag-surface:reorder",i=>{let a=i.detail,o=i.target.closest("drag-surface"),l=this.#u(o);l&&(this.#m(l),this.#c("drag"),this.dispatchEvent(new CustomEvent("kanban-board:reorder",{bubbles:!0,detail:{itemId:a.itemId,column:l,oldIndex:a.oldIndex,newIndex:a.newIndex}})))}),this.listen(this,"drag-surface:transfer",i=>{let a=i.detail,o=a.fromSurface,l=a.toSurface,d=this.#u(o),n=this.#u(l);if(!d||!n)return;a.item&&a.item.setAttribute("data-column",n),this.#m(d),this.#m(n);let h=l.querySelector(".kb-empty");if(h&&h.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".kb-empty")){let w=document.createElement("p");w.className="kb-empty",w.textContent="No items",o.appendChild(w)}let m=this.#f(a.item),g=this.#y(d),p=this.#y(n);this.#d(`${m} moved from ${g} to ${p}`),this.#c("drag"),this.dispatchEvent(new CustomEvent("kanban-board:transfer",{bubbles:!0,detail:{itemId:a.itemId,fromColumn:d,toColumn:n,newIndex:a.newIndex,item:a.item}}));let b=l.querySelectorAll(':scope > [draggable="true"]').length,v=this.#a.find(w=>w.id===n);v?.wip!==null&&v?.wip!==void 0&&b>v.wip&&this.dispatchEvent(new CustomEvent("kanban-board:wip-exceeded",{bubbles:!0,detail:{column:n,limit:v.wip,count:b}}))}),this.#l();let r=this.getAttribute("src");if(r){this._loadSrc(r);return}this.dispatchEvent(new CustomEvent("kanban-board:ready",{bubbles:!0,detail:{columnCount:this.#a.length,itemCount:e}}))}#l(){let t=[],e=new Map;for(let[s,r]of Object.entries(this.#e)){let i=r.querySelectorAll(':scope > [draggable="true"]');for(let a of i){let o=a.getAttribute("data-id");o&&(t.push({id:o,column:s}),e.set(o,a))}}this._seedCollection(t,e)}#c(t){let e=[],s=new Map;for(let r of this.items){let i=String(r.id??r.storyId??"");i&&s.set(i,r)}for(let[r,i]of Object.entries(this.#e)){let a=i.querySelectorAll(':scope > [draggable="true"]');for(let o of a){let l=o.getAttribute("data-id");if(!l)continue;let d=s.get(l);e.push(d?{...d,column:r}:{id:l,column:r})}}this._setItemsSilently(e),this._emit("items-changed",{items:e},t)}teardown(){let t=this.querySelector(".kb-title");t&&t.remove(),this.#t&&(this.#t.remove(),this.#t=null),this.#r&&(this.#r.remove(),this.#r=null),this.#e={},this.#i={},this.#a=[]}get columns(){return this.#a.map(t=>({id:t.id,label:t.label,wip:t.wip??void 0,color:t.color??void 0}))}set columns(t){let e=(t||[]).map(s=>({id:s.id,label:s.label||this.#x(s.id),wip:s.wip??null,color:s.color??null,children:[]}));this.#t&&(this.#t.remove(),this.#t=null),this.#e={},this.#i={},this.#a=e,this.#h()}get renderItem(){return this.#n}set renderItem(t){this.#n=typeof t=="function"?t:null}_renderItem(t){let e;if(this.#n){let s=this.#n(t);if(!(s instanceof Element))throw new Error("kanban-board: renderItem must return an Element");e=s}else e=this.#p(t);return e.hasAttribute("draggable")||e.setAttribute("draggable","true"),e.hasAttribute("data-id")||e.setAttribute("data-id",String(c.keyOf(t))),e}_containerFor(t,e){let s=this.#e[t.column];if(!s)throw new Error(`kanban-board: no column "${t.column}" \u2014 set .columns first or include item.column matching an existing column id`);let r=s.querySelector(":scope > .kb-empty");return r&&r.remove(),s}_postRender(){for(let t of Object.keys(this.#e)){this.#m(t);let e=this.#e[t],s=e.querySelectorAll(':scope > [draggable="true"]'),r=e.querySelector(":scope > .kb-empty");if(s.length===0&&!r){let i=document.createElement("p");i.className="kb-empty",i.textContent="No items",e.appendChild(i)}else s.length>0&&r&&r.remove()}}#p(t){let e=customElements.get("work-item")?"work-item":"article",s=document.createElement(e);return e==="work-item"?s.data={itemId:t.id??t.storyId,type:t.type,priority:t.priority,status:t.status,estimate:t.estimate!=null?String(t.estimate):void 0,assignee:t.assignee,title:t.title,description:t.description,checklist:t.checklist,notes:t.notes,detail:t.detail}:(s.className="kb-card",s.textContent=t.title||t.label||t.id),s}#h(){this.#t=document.createElement("div"),this.#t.className="kb-columns",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label","Kanban board");for(let t of this.#a){let e=document.createElement("section");e.className="kb-column",e.setAttribute("data-column-id",t.id),t.color&&e.setAttribute("data-column-tint",t.color);let s=document.createElement("header");s.className="kb-column-header";let r=document.createElement("h3");r.textContent=t.label;let i=document.createElement("output");if(i.className="kb-count",i.textContent="0",r.appendChild(i),t.wip!=null&&!isNaN(t.wip)){let l=document.createElement("span");l.className="kb-wip",l.textContent=`/ ${t.wip}`,l.setAttribute("aria-label",`WIP limit ${t.wip}`),r.appendChild(l)}s.appendChild(r),e.appendChild(s);let a=document.createElement("drag-surface");a.setAttribute("group",this.#o),a.setAttribute("aria-label",`${t.label} items`),a.setAttribute("data-layout","stack"),a.setAttribute("data-layout-gap","xs");let o=document.createElement("p");o.className="kb-empty",o.textContent="No items",a.appendChild(o),e.appendChild(a),this.#t.appendChild(e),this.#e[t.id]=a,this.#i[t.id]=e}this.appendChild(this.#t)}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let r of s.columns||[]){let i=document.createElement("section");i.setAttribute("data-column",r.id),r.label&&i.setAttribute("data-column-label",r.label),r.wip!=null&&i.setAttribute("data-wip",String(r.wip)),r.color&&i.setAttribute("data-column-color",r.color);for(let a of r.items||[]){let o;a.persona||a.action||a.storyId?(o=document.createElement("user-story"),o.setAttribute("detail",a.detail||"minimal"),a.storyId&&o.setAttribute("story-id",a.storyId),a.persona&&o.setAttribute("persona",a.persona),a.action&&o.setAttribute("action",a.action),a.benefit&&o.setAttribute("benefit",a.benefit),a.priority&&o.setAttribute("priority",a.priority),a.status&&o.setAttribute("status",a.status),a.points&&o.setAttribute("points",String(a.points))):(o=document.createElement("article"),o.className="kb-card",o.textContent=a.text||a.label||""),o.setAttribute("draggable","true"),o.dataset.id=a.id||a.storyId||"",i.appendChild(o)}this.appendChild(i)}this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[kanban-board] Failed to load src="${t}":`,e)}}#u(t){if(!t)return null;for(let[e,s]of Object.entries(this.#e))if(s===t)return e;return null}#m(t){let e=this.#e[t],s=this.#i[t];if(!e||!s)return;let r=e.querySelectorAll(':scope > [draggable="true"]').length,i=s.querySelector(".kb-count");i&&(i.textContent=String(r));let a=this.#a.find(o=>o.id===t);a?.wip!==null&&a?.wip!==void 0&&(r>a.wip?s.setAttribute("data-wip-exceeded",""):s.removeAttribute("data-wip-exceeded"))}#y(t){return this.#a.find(s=>s.id===t)?.label||this.#x(t)}#d(t){this.#r&&(this.#r.textContent="",requestAnimationFrame(()=>{this.#r&&(this.#r.textContent=t)}))}#f(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#x(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("kanban-board",gt);var bt=class c extends C{static get observedAttributes(){return["src","compact","title"]}static#s=0;#t=null;#e=null;#i={};#r=null;#o="";#a=[];setup(){this.#o=`sm-${++c.#s}`;let t=[...this.querySelectorAll(":scope > section[data-activity]")];this.#a=t.map(i=>{let a=i.getAttribute("data-activity")||"",l=i.getAttribute("data-activity-label")||""||this.#h(a),d=i.getAttribute("data-journey-phase")||null,n=[...i.children];return{id:a,label:l,journeyPhase:d,children:n}});for(let i of t)i.remove();this.#t=document.createElement("div"),this.#t.className="sm-scroll",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label","Story map"),this.#t.setAttribute("tabindex","0"),this.#e=document.createElement("div"),this.#e.className="sm-columns";let e=0;for(let i of this.#a){let a=document.createElement("section");a.className="sm-column",a.setAttribute("data-activity-column",i.id);let o=document.createElement("header");o.className="sm-activity-header";let l=document.createElement("h3");l.textContent=i.label;let d=document.createElement("span");d.className="sm-activity-count",d.textContent=String(i.children.length),l.appendChild(d),o.appendChild(l),a.appendChild(o);let n=document.createElement("drag-surface");if(n.setAttribute("group",this.#o),n.setAttribute("aria-label",`${i.label} stories`),n.setAttribute("data-layout","stack"),n.setAttribute("data-layout-gap","xs"),i.children.length>0){for(let h of i.children)n.appendChild(h);e+=i.children.length}else{let h=document.createElement("p");h.className="sm-empty",h.textContent="No stories yet",n.appendChild(h)}a.appendChild(n),this.#e.appendChild(a),this.#i[i.id]=n}let s=this.getAttribute("title");if(s){let i=document.createElement("h2");i.className="sm-title",i.textContent=s,this.appendChild(i)}this.#t.appendChild(this.#e),this.appendChild(this.#t),this.#r=document.createElement("div"),this.#r.className="sm-live-region",this.#r.setAttribute("role","status"),this.#r.setAttribute("aria-live","polite"),this.#r.setAttribute("aria-atomic","true"),this.appendChild(this.#r),this.listen(this,"drag-surface:reorder",i=>{let a=i.detail,o=i.target.closest("drag-surface"),l=this.#n(o);l&&(this.#l(l),this.dispatchEvent(new CustomEvent("story-map:reorder",{bubbles:!0,detail:{itemId:a.itemId,activity:l,oldIndex:a.oldIndex,newIndex:a.newIndex}})))}),this.listen(this,"drag-surface:transfer",i=>{let a=i.detail,o=a.fromSurface,l=a.toSurface,d=this.#n(o),n=this.#n(l);if(!d||!n)return;this.#l(d),this.#l(n);let h=l.querySelector(".sm-empty");if(h&&h.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".sm-empty")){let g=document.createElement("p");g.className="sm-empty",g.textContent="No stories yet",o.appendChild(g)}let m=this.#p(a.item);this.#c(`${m} moved from ${d} to ${n}`),this.dispatchEvent(new CustomEvent("story-map:transfer",{bubbles:!0,detail:{itemId:a.itemId,fromActivity:d,toActivity:n,newIndex:a.newIndex}}))});let r=this.getAttribute("src");if(r){this._loadSrc(r);return}this.dispatchEvent(new CustomEvent("story-map:ready",{bubbles:!0,detail:{activityCount:this.#a.length,storyCount:e}}))}teardown(){this.#t&&(this.#t.remove(),this.#t=null),this.#r&&(this.#r.remove(),this.#r=null),this.#e=null,this.#i={},this.#a=[]}get activities(){return this.#a.map(t=>({id:t.id,label:t.label,journeyPhase:t.journeyPhase||void 0,stories:[...this.#i[t.id]?.querySelectorAll(':scope > [draggable="true"]')||[]].map(e=>({id:e.getAttribute("data-id")||void 0,storyId:e.getAttribute("story-id")||void 0,title:e.querySelector('[slot="title"]')?.textContent?.trim()||void 0}))}))}set activities(t){let e=Array.isArray(t)?t:[];for(;this.firstChild;)this.firstChild.remove();for(let s of e){let r=document.createElement("section");r.setAttribute("data-activity",s.id||""),s.label&&r.setAttribute("data-activity-label",s.label),s.journeyPhase&&r.setAttribute("data-journey-phase",s.journeyPhase);for(let i of s.stories||[]){let a;if(typeof this.renderStory=="function"){let o=this.renderStory(i);a=o instanceof Element?o:null}a||(customElements.get("user-story")?(a=document.createElement("user-story"),a.data=i):(a=document.createElement("article"),a.className="sm-card",a.textContent=i.title||i.id||"")),a.hasAttribute("draggable")||a.setAttribute("draggable","true"),i.id&&!a.hasAttribute("data-id")&&a.setAttribute("data-id",String(i.id)),r.appendChild(a)}this.appendChild(r)}this.teardown(),this.removeAttribute("data-upgraded"),this.setup(),this.dispatchEvent(new CustomEvent("story-map:activities-changed",{detail:{activities:e,source:"property"},bubbles:!0}))}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let r of s.activities||[]){let i=document.createElement("section");i.setAttribute("data-activity",r.id),i.setAttribute("data-activity-label",r.label||r.id),r.journeyPhase&&i.setAttribute("data-journey-phase",r.journeyPhase);for(let a of r.stories||[]){let o=document.createElement("user-story");o.setAttribute("draggable","true"),o.dataset.id=a.id||a.storyId,(a.storyId||a.id)&&o.setAttribute("story-id",a.storyId||a.id),a.title&&o.setAttribute("title",a.title),a.persona&&o.setAttribute("persona",a.persona),a.action&&o.setAttribute("action",a.action),a.benefit&&o.setAttribute("benefit",a.benefit),a.priority&&o.setAttribute("priority",a.priority),a.status&&o.setAttribute("status",a.status),a.points&&o.setAttribute("points",String(a.points)),o.setAttribute("detail",a.detail||"compact"),i.appendChild(o)}this.appendChild(i)}this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[story-map] Failed to load src="${t}":`,e)}}#n(t){if(!t)return null;for(let[e,s]of Object.entries(this.#i))if(s===t)return e;return null}#l(t){let e=this.#i[t];if(!e)return;let s=e.querySelectorAll(':scope > [draggable="true"]').length,r=e.closest("[data-activity-column]");if(!r)return;let i=r.querySelector(".sm-activity-count");i&&(i.textContent=String(s))}#c(t){this.#r&&(this.#r.textContent="",requestAnimationFrame(()=>{this.#r&&(this.#r.textContent=t)}))}#p(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#h(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("story-map",bt);var W=`
  :host {
    display: block;
    position: relative;
    font-family: var(--_font-sans);
    line-height: 1.5;
    color: var(--_text);
    container-type: inline-size;

    --_bg:          var(--review-surface-bg, var(--color-surface, #ffffff));
    --_card:        var(--review-surface-card, var(--color-surface-raised, #f8f9fa));
    --_border:      var(--review-surface-border, var(--color-border, #e0e0e0));
    --_text:        var(--review-surface-text, var(--color-text, #1a1a1a));
    --_muted:       var(--review-surface-muted, var(--color-text-muted, #666666));
    --_accent:      var(--review-surface-accent, var(--color-interactive, #0066cc));
    --_pin-bg:      var(--review-surface-pin-bg, var(--color-interactive, #0066cc));
    --_pin-text:    var(--review-surface-pin-text, #ffffff);
    --_pin-size:    var(--review-surface-pin-size, 28px);
    --_resolved:    var(--review-surface-resolved, var(--color-success, #16a34a));
    --_radius:      var(--review-surface-radius, var(--radius-xl, 1rem));
    --_radius-m:    var(--review-surface-radius-m, var(--radius-m, 0.5rem));
    --_radius-full: var(--review-surface-radius-full, var(--radius-full, 9999px));
    --_font-sans:   var(--review-surface-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_font-xs:     var(--review-surface-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:     var(--review-surface-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:     var(--review-surface-font-md, var(--font-size-md, 1rem));
    --_space-2xs:   var(--review-surface-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:    var(--review-surface-space-xs, var(--size-xs, 0.5rem));
    --_space-s:     var(--review-surface-space-s, var(--size-s, 0.75rem));
    --_space-m:     var(--review-surface-space-m, var(--size-m, 1rem));
    --_space-l:     var(--review-surface-space-l, var(--size-l, 1.5rem));
    --_duration:    var(--review-surface-duration, var(--duration-normal, 200ms));
    --_duration-fast: var(--review-surface-duration-fast, var(--duration-fast, 100ms));
    --_ease:        var(--review-surface-ease, var(--ease-default, ease));
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; }

  /* \u2500\u2500 Container \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-container {
    position: relative;
    display: grid;
  }

  .rs-container > ::slotted(*),
  .rs-container > .rs-overlay {
    grid-area: 1 / 1;
  }

  /* \u2500\u2500 Overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-overlay {
    position: relative;
    z-index: 10;
    pointer-events: none;
    cursor: default;
  }

  :host([data-annotating]) .rs-overlay {
    pointer-events: auto;
    cursor: crosshair;
  }

  /* \u2500\u2500 Pin markers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-pin {
    position: absolute;
    transform: translate(-50%, -50%);
    width: var(--_pin-size);
    height: var(--_pin-size);
    border-radius: var(--_radius-full);
    background: var(--_pin-bg);
    color: var(--_pin-text);
    border: 2px solid var(--_pin-text);
    font-size: var(--_font-xs);
    font-weight: 700;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    padding: 0;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: transform var(--_duration-fast) var(--_ease),
                box-shadow var(--_duration-fast) var(--_ease);
    z-index: 11;
  }

  .rs-pin:hover {
    transform: translate(-50%, -50%) scale(1.15);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
  }

  .rs-pin:focus-visible {
    outline: 2px solid var(--_accent);
    outline-offset: 2px;
  }

  .rs-pin[data-resolved] {
    background: var(--_resolved);
  }

  .rs-pin[data-active] {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--_pin-bg) 30%, transparent);
  }

  /* \u2500\u2500 Popover \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-popover {
    position: absolute;
    z-index: 20;
    width: 300px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-m);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 0;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity var(--_duration) var(--_ease), transform var(--_duration) var(--_ease);
    pointer-events: none;
  }

  .rs-popover[data-open] {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .rs-popover__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 8px;
    border-block-end: 1px solid var(--_border);
  }

  .rs-popover__title {
    font-size: var(--_font-sm);
    font-weight: 700;
    color: var(--_text);
  }

  .rs-popover__actions {
    display: flex;
    gap: 4px;
  }

  .rs-popover__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--_muted);
    cursor: pointer;
    padding: 0;
    transition: background var(--_duration-fast) var(--_ease), color var(--_duration-fast) var(--_ease);
  }

  .rs-popover__btn svg {
    width: 14px;
    height: 14px;
  }

  .rs-popover__btn:hover {
    background: var(--_border);
    color: var(--_text);
  }

  .rs-popover__btn--resolve {
    color: var(--_resolved);
  }

  .rs-popover__btn--resolve:hover {
    background: color-mix(in srgb, var(--_resolved) 15%, transparent);
  }

  .rs-popover__btn--delete {
    color: var(--color-error-text, var(--color-error, #dc2626));
  }

  .rs-popover__btn--delete:hover {
    background: color-mix(in oklch, var(--color-error, #dc2626) 8%, var(--_card));
    color: var(--color-error-text, var(--color-error, #dc2626));
  }

  /* \u2500\u2500 Comment thread \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-comment {
    padding: 10px 12px;
  }

  .rs-comment__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-block-end: 4px;
  }

  .rs-comment__avatar {
    width: 22px;
    height: 22px;
    border-radius: var(--_radius-full);
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-inverted, #fff);
    flex-shrink: 0;
  }

  .rs-comment__author {
    font-size: var(--_font-xs);
    font-weight: 600;
    color: var(--_text);
  }

  .rs-comment__time {
    font-size: 11px;
    color: var(--_muted);
  }

  .rs-comment__text {
    font-size: var(--_font-sm);
    color: var(--_text);
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Replies */
  .rs-replies {
    border-block-start: 1px solid var(--_border);
  }

  .rs-reply {
    padding: 8px 12px;
    border-block-end: 1px solid color-mix(in srgb, var(--_border) 50%, transparent);
  }

  .rs-reply:last-child {
    border-block-end: none;
  }

  /* \u2500\u2500 Input area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-input {
    display: flex;
    gap: 6px;
    padding: 8px 12px;
    border-block-start: 1px solid var(--_border);
    background: var(--_card);
    border-radius: 0 0 var(--_radius-m) var(--_radius-m);
  }

  .rs-input__field {
    flex: 1;
    min-height: 32px;
    max-height: 80px;
    padding: 6px 10px;
    border: 1px solid var(--_border);
    border-radius: 6px;
    font-family: inherit;
    font-size: var(--_font-xs);
    line-height: 1.4;
    color: var(--_text);
    background: var(--_bg);
    resize: none;
  }

  .rs-input__field:focus {
    outline: 2px solid var(--_accent);
    outline-offset: -1px;
    border-color: var(--_accent);
  }

  .rs-input__field::placeholder {
    color: var(--_muted);
  }

  .rs-input__submit {
    align-self: flex-end;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: var(--_accent);
    color: var(--color-text-inverted, #fff);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background var(--_duration-fast) var(--_ease);
  }

  .rs-input__submit svg {
    width: 14px;
    height: 14px;
  }

  .rs-input__submit:hover {
    background: color-mix(in srgb, var(--_accent) 85%, #000);
  }

  .rs-input__submit:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* \u2500\u2500 Toolbar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-toolbar {
    display: flex;
    align-items: center;
    gap: var(--_space-xs);
    padding: var(--_space-xs) var(--_space-s);
    background: var(--_card);
    border: 1px solid var(--_border);
    border-radius: var(--_radius-m);
    margin-block-start: var(--_space-xs);
  }

  .rs-toolbar__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border: 1px solid var(--_border);
    border-radius: 6px;
    background: var(--_bg);
    color: var(--_text);
    font-family: inherit;
    font-size: var(--_font-xs);
    font-weight: 600;
    cursor: pointer;
    line-height: 1;
    transition: background var(--_duration-fast) var(--_ease),
                border-color var(--_duration-fast) var(--_ease);
  }

  .rs-toolbar__btn svg {
    width: 14px;
    height: 14px;
  }

  .rs-toolbar__btn:hover {
    background: var(--_border);
  }

  .rs-toolbar__btn[aria-pressed="true"] {
    background: var(--_accent);
    color: var(--color-text-inverted, #fff);
    border-color: var(--_accent);
  }

  .rs-toolbar__count {
    font-size: var(--_font-xs);
    color: var(--_muted);
    margin-inline-start: auto;
  }

  /* \u2500\u2500 Resolved badge \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-resolved-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--_resolved);
    padding: 2px 8px;
    border-radius: var(--_radius-full);
    background: color-mix(in srgb, var(--_resolved) 12%, transparent);
  }

  .rs-resolved-badge svg {
    width: 12px;
    height: 12px;
  }

  /* \u2500\u2500 Live region \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .rs-live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  /* \u2500\u2500 Compact \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([compact]) {
    --_pin-size: 22px;
  }

  :host([compact]) .rs-popover {
    width: 250px;
    max-height: 300px;
  }

  :host([compact]) .rs-toolbar {
    padding: 3px var(--_space-xs);
  }

  :host([compact]) .rs-toolbar__btn {
    font-size: 11px;
    padding: 3px 8px;
  }

  /* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @container (max-width: 400px) {
    .rs-popover {
      width: 240px;
    }

    .rs-toolbar {
      flex-wrap: wrap;
    }
  }

  /* \u2500\u2500 Motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media (prefers-reduced-motion: reduce) {
    .rs-pin,
    .rs-popover,
    .rs-toolbar__btn,
    .rs-popover__btn,
    .rs-input__submit {
      transition: none;
    }
  }

  /* \u2500\u2500 Print \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  @media print {
    .rs-overlay,
    .rs-toolbar,
    .rs-popover {
      display: none;
    }
  }

  /* \u2500\u2500 Utility \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  .state-msg        { padding: var(--_space-l); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
  .state-msg--error { color: var(--color-error-text, var(--color-error, #dc2626)); }
`;function se(){let c=globalThis.localStorage;if(!c)throw new Error("VBStore: localStorage is not available in this environment");return{async getRaw(t){return c.getItem(t)},async setRaw(t,e){c.setItem(t,e)},async removeRaw(t){c.removeItem(t)},async keys(t){let e=[];for(let s=0;s<c.length;s++){let r=c.key(s);r&&r.startsWith(t)&&e.push(r)}return e}}}var X=null;function N(){return X||(X=se()),X}function vt(c,t){if(typeof c!="string"||!c)throw new TypeError("VBStore: namespace must be a non-empty string");if(typeof t!="string"||!t)throw new TypeError("VBStore: key must be a non-empty string");return`vb:${c}:${t}`}function zt(c){if(typeof c!="string"||!c)throw new TypeError("VBStore: namespace must be a non-empty string");return`vb:${c}:`}function Pt(c){try{let t=JSON.parse(c);if(t&&typeof t=="object"&&typeof t.timestamp=="number")return t}catch{}return null}var Q={configure(c={}){X=c.backend??null},async set(c,t,e){let s={data:e,timestamp:Date.now()};await N().setRaw(vt(c,t),JSON.stringify(s))},async get(c,t,e){let s=await N().getRaw(vt(c,t));if(s==null)return null;let r=Pt(s);return!r||e?.maxAge!=null&&Date.now()-r.timestamp>e.maxAge?null:r.data},async remove(c,t){await N().removeRaw(vt(c,t))},async list(c){let t=zt(c),e=await N().keys(t),s=[];for(let r of e){let i=await N().getRaw(r);if(i==null)continue;let a=Pt(i);a&&s.push({key:r.slice(t.length),data:a.data,timestamp:a.timestamp})}return s},async clear(c){let t=zt(c),e=await N().keys(t);for(let s of e)await N().removeRaw(s)},async clearAll(){let c=await N().keys("vb:");for(let t of c)await N().removeRaw(t)},async setMany(c,t){for(let[e,s]of t)await Q.set(c,e,s)}};var j=class{#s=new Map;async load(){return[...this.#s.values()]}async save(t){return t.id||(t.id=crypto.randomUUID()),this.#s.set(t.id,t),t}async update(t,e){let s=this.#s.get(t);if(!s)throw new Error(`Pin ${t} not found`);return Object.assign(s,e),s}async remove(t){this.#s.delete(t)}},K=class{#s;constructor(t="default"){this.#s=t}async#t(){let t=await Q.get("reviews",this.#s);return Array.isArray(t)?t:[]}async#e(t){await Q.set("reviews",this.#s,t)}async load(){return this.#t()}async save(t){t.id||(t.id=crypto.randomUUID());let e=await this.#t();return e.push(t),await this.#e(e),t}async update(t,e){let s=await this.#t(),r=s.findIndex(i=>i.id===t);if(r===-1)throw new Error(`Pin ${t} not found`);return Object.assign(s[r],e),await this.#e(s),s[r]}async remove(t){let e=(await this.#t()).filter(s=>s.id!==t);await this.#e(e)}},G=class{#s;constructor(t){if(!t)throw new Error("RestAdapter requires an endpoint URL");this.#s=t.replace(/\/$/,"")}async load(){let t=await fetch(this.#s);if(!t.ok)throw new Error(`HTTP ${t.status}`);let e=await t.json();return Array.isArray(e)?e:e.pins||[]}async save(t){let e=await fetch(this.#s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}async update(t,e){let s=await fetch(`${this.#s}/${encodeURIComponent(t)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!s.ok)throw new Error(`HTTP ${s.status}`);return s.json()}async remove(t){let e=await fetch(`${this.#s}/${encodeURIComponent(t)}`,{method:"DELETE"});if(!e.ok)throw new Error(`HTTP ${e.status}`)}},yt=class extends HTMLElement{static get observedAttributes(){return["src","editable","adapter","endpoint","storage-key","author","compact","show-resolved"]}#s=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__pins=[],this.__adapter=null,this._activePin=null,this._annotating=!1}get pins(){return this.__pins}set pins(t){let e=Array.isArray(t)?t:[];this.__pins!==e&&(this.__pins=e,this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("review-surface:pins-changed",{detail:{pins:e,source:"property"},bubbles:!0,composed:!0})))}get adapter(){return this.__adapter}set adapter(t){this.__adapter=t,this.isConnected&&this._loadFromAdapter()}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#s.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#s.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.#e(),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._loadFromAdapter()}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.removeAttribute("data-annotating")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):t==="adapter"||t==="endpoint"||t==="storage-key"?(this.#e(),this._loadFromAdapter()):this._render())}#e(){if(this.__adapter&&!(this.__adapter instanceof j)&&!(this.__adapter instanceof K)&&!(this.__adapter instanceof G))return;switch(this.getAttribute("adapter")||"memory"){case"local":this.__adapter=new K(this.getAttribute("storage-key")||"default");break;case"rest":try{this.__adapter=new G(this.getAttribute("endpoint"))}catch{this.__adapter=new j}break;default:this.__adapter=new j}}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${W}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this.__pins=Array.isArray(s)?s:s.pins||[],this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${W}</style><div class="state-msg state-msg--error">Could not load pins: ${f(e.message)}</div>`}}}async _loadFromAdapter(){if(this.__adapter){try{this.__pins=await this.__adapter.load()}catch{this.__pins=[]}this._render()}}async addPin(t){let e={id:crypto.randomUUID(),x:Math.max(0,Math.min(100,t.x)),y:Math.max(0,Math.min(100,t.y)),text:t.text||"",author:t.author||this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString(),resolved:!1,resolvedBy:null,resolvedAt:null,replies:[]};return this.__adapter&&await this.__adapter.save(e),this.__pins.push(e),this._render(),this.#l(`Pin ${this.#i().length} added`),this.dispatchEvent(new CustomEvent("review-surface:add",{bubbles:!0,composed:!0,detail:{pin:e}})),e}async removePin(t){let e=this.__pins.find(s=>s.id===t);e&&(this.__adapter&&await this.__adapter.remove(t),this.__pins=this.__pins.filter(s=>s.id!==t),this._activePin===t&&(this._activePin=null),this._render(),this.#l("Pin removed"),this.dispatchEvent(new CustomEvent("review-surface:remove",{bubbles:!0,composed:!0,detail:{pin:e}})))}async resolvePin(t){let e=this.__pins.find(r=>r.id===t);if(!e)return;let s={resolved:!0,resolvedBy:this.getAttribute("author")||"Anonymous",resolvedAt:new Date().toISOString()};this.__adapter&&await this.__adapter.update(t,s),Object.assign(e,s),this._render(),this.#l("Pin resolved"),this.dispatchEvent(new CustomEvent("review-surface:resolve",{bubbles:!0,composed:!0,detail:{pin:e}}))}async unresolvePin(t){let e=this.__pins.find(r=>r.id===t);if(!e)return;let s={resolved:!1,resolvedBy:null,resolvedAt:null};this.__adapter&&await this.__adapter.update(t,s),Object.assign(e,s),this._render(),this.#l("Pin re-opened"),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:e,changes:s}}))}exportPins(){return structuredClone(this.__pins)}importPins(t){this.__pins=Array.isArray(t)?structuredClone(t):[],this._activePin=null,this._render()}#i(){let t=this.hasAttribute("show-resolved");return this.__pins.filter(e=>t||!e.resolved).sort((e,s)=>new Date(e.createdAt)-new Date(s.createdAt))}_render(){let t=this.hasAttribute("editable"),e=this.#i(),s=this._activePin?this.__pins.find(r=>r.id===this._activePin):null;this.setAttribute("pin-count",String(e.length)),this.shadowRoot.innerHTML=`<style>${W}</style>
      <div class="rs-container">
        <slot></slot>
        <div class="rs-overlay" role="img" aria-label="Review annotation surface">
          ${e.map((r,i)=>this._renderPin(r,i+1)).join("")}
        </div>
        ${s?this._renderPopover(s,t):""}
      </div>
      ${t?this._renderToolbar(e.length):""}
      <div class="rs-live" aria-live="polite" aria-atomic="true"></div>`,this._bindListeners(t),this.dispatchEvent(new CustomEvent("review-surface:ready",{bubbles:!0,composed:!0,detail:{pinCount:e.length}}))}_renderPin(t,e){let s=t.text?t.text.slice(0,50):"Empty pin";return`<button class="rs-pin"
      data-pin-id="${f(t.id)}"
      ${t.resolved?"data-resolved":""}
      ${this._activePin===t.id?"data-active":""}
      style="left:${t.x}%;top:${t.y}%"
      aria-label="Pin ${e}: ${f(s)}"
      aria-expanded="${this._activePin===t.id}"
      aria-haspopup="dialog">
      <span class="rs-pin__number">${e}</span>
    </button>`}_renderPopover(t,e){let s=this.#i().findIndex(r=>r.id===t.id)+1;return`<div class="rs-popover" data-open
      style="left:${Math.min(t.x,70)}%;top:${t.y}%"
      role="dialog"
      aria-labelledby="rs-popover-title-${f(t.id)}">

      <div class="rs-popover__header">
        <span class="rs-popover__title" id="rs-popover-title-${f(t.id)}">
          Pin ${s}
          ${t.resolved?`<span class="rs-resolved-badge">${A(k.checkCircle)} Resolved</span>`:""}
        </span>
        <div class="rs-popover__actions">
          ${e&&!t.resolved?`
            <button class="rs-popover__btn rs-popover__btn--resolve" data-action="resolve" data-pin-id="${f(t.id)}"
              aria-label="Resolve pin" title="Resolve">${A(k.checkCircle)}</button>`:""}
          ${e&&t.resolved?`
            <button class="rs-popover__btn" data-action="unresolve" data-pin-id="${f(t.id)}"
              aria-label="Re-open pin" title="Re-open">${A(k.messageCircle)}</button>`:""}
          ${e?`
            <button class="rs-popover__btn rs-popover__btn--delete" data-action="delete" data-pin-id="${f(t.id)}"
              aria-label="Delete pin" title="Delete">${A(k.x)}</button>`:""}
          <button class="rs-popover__btn" data-action="close"
            aria-label="Close">${A(k.x)}</button>
        </div>
      </div>

      <div class="rs-comment">
        <div class="rs-comment__meta">
          <span class="rs-comment__avatar" style="background:${z(t.author||"Anonymous")}">${L(t.author||"Anonymous")}</span>
          <span class="rs-comment__author">${f(t.author||"Anonymous")}</span>
          <span class="rs-comment__time">${this.#n(t.createdAt)}</span>
        </div>
        <div class="rs-comment__text">${f(t.text)}</div>
      </div>

      ${t.replies?.length?`
        <div class="rs-replies">
          ${t.replies.map(r=>`
            <div class="rs-reply">
              <div class="rs-comment__meta">
                <span class="rs-comment__avatar" style="background:${z(r.author||"Anonymous")}">${L(r.author||"Anonymous")}</span>
                <span class="rs-comment__author">${f(r.author||"Anonymous")}</span>
                <span class="rs-comment__time">${this.#n(r.createdAt)}</span>
              </div>
              <div class="rs-comment__text">${f(r.text)}</div>
            </div>
          `).join("")}
        </div>`:""}

      ${e?`
        <div class="rs-input">
          <textarea class="rs-input__field" placeholder="Reply\u2026" rows="1"
            aria-label="Reply to pin ${s}"></textarea>
          <button class="rs-input__submit" data-action="reply" data-pin-id="${f(t.id)}"
            aria-label="Send reply">${A(k.send)}</button>
        </div>`:""}

    </div>`}_renderToolbar(t){return`<div class="rs-toolbar" role="toolbar" aria-label="Review tools">
      <button class="rs-toolbar__btn" data-action="toggle-mode"
        aria-pressed="${this._annotating}"
        title="Toggle annotate mode">
        ${A(k.mapPin)} Annotate
      </button>
      <button class="rs-toolbar__btn" data-action="export"
        title="Export pins as JSON">
        ${A(k.download)} Export
      </button>
      <output class="rs-toolbar__count">${t} pin${t!==1?"s":""}</output>
    </div>`}_bindListeners(t){let e=this.shadowRoot;e.querySelectorAll(".rs-pin").forEach(i=>{i.addEventListener("click",a=>{a.stopPropagation();let o=i.dataset.pinId;this._activePin=this._activePin===o?null:o,this._render(),this._activePin&&this.dispatchEvent(new CustomEvent("review-surface:select",{bubbles:!0,composed:!0,detail:{pin:this.__pins.find(l=>l.id===o)}}))})});let s=e.querySelector(".rs-overlay");s&&t&&s.addEventListener("click",i=>{if(!this._annotating||i.target.closest(".rs-pin"))return;let a=s.getBoundingClientRect(),o=(i.clientX-a.left)/a.width*100,l=(i.clientY-a.top)/a.height*100;this.#r(o,l)}),e.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",a=>{a.stopPropagation();let o=i.dataset.action,l=i.dataset.pinId;switch(o){case"close":this._activePin=null,this._render();break;case"resolve":this.resolvePin(l);break;case"unresolve":this.unresolvePin(l);break;case"delete":this.removePin(l);break;case"toggle-mode":this._annotating=!this._annotating,this._annotating?this.setAttribute("data-annotating",""):this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:this._annotating?"annotate":"view"}}));break;case"export":this.#a();break;case"reply":this.#o(l);break}})});let r=e.querySelector(".rs-input__field");r&&r.addEventListener("keydown",i=>{if(i.key==="Enter"&&!i.shiftKey){i.preventDefault();let a=e.querySelector('[data-action="reply"]')?.dataset.pinId;a&&this.#o(a)}}),e.addEventListener("keydown",i=>{i.key==="Escape"&&(this._activePin?(this._activePin=null,this._render()):this._annotating&&(this._annotating=!1,this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:"view"}}))))})}async#r(t,e){let s=this.getAttribute("author")||"Anonymous",r=await this.addPin({x:t,y:e,text:"",author:s});this._activePin=r.id,this._render(),requestAnimationFrame(()=>{let i=this.shadowRoot.querySelector(".rs-input__field");i&&i.focus()})}async#o(t){let e=this.shadowRoot.querySelector(".rs-input__field");if(!e)return;let s=e.value.trim();if(!s)return;let r=this.__pins.find(a=>a.id===t);if(!r)return;let i={id:crypto.randomUUID(),text:s,author:this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString()};r.replies||(r.replies=[]),r.text?(r.replies.push(i),this.__adapter&&await this.__adapter.update(t,{replies:r.replies})):(r.text=s,this.__adapter&&await this.__adapter.update(t,{text:s})),this._render(),this.#l("Reply added"),requestAnimationFrame(()=>{let a=this.shadowRoot.querySelector(".rs-input__field");a&&a.focus()}),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:r,changes:{replies:r.replies}}}))}async#a(){let t=JSON.stringify(this.exportPins(),null,2);try{await navigator.clipboard.writeText(t),this.#l("Pins copied to clipboard")}catch{let e=new Blob([t],{type:"application/json"}),s=URL.createObjectURL(e),r=document.createElement("a");r.href=s,r.download="review-pins.json",r.click(),URL.revokeObjectURL(s),this.#l("Pins exported as file")}}#n(t){if(!t)return"";try{let e=new Date(t),r=new Date-e,i=Math.floor(r/6e4);if(i<1)return"just now";if(i<60)return`${i}m ago`;let a=Math.floor(i/60);if(a<24)return`${a}h ago`;let o=Math.floor(a/24);return o<7?`${o}d ago`:e.toLocaleDateString()}catch{return""}}#l(t){let e=this.shadowRoot.querySelector(".rs-live");e&&(e.textContent=t)}};x("review-surface",yt);var P=864e5,wt=P*7,J=P*30,re=P*91,jt=P*365;function R(c){return typeof c=="number"?c:new Date(c).getTime()}function ie(c){return c<=wt*3?t=>t.toLocaleDateString(void 0,{month:"short",day:"numeric"}):c<=J*3?t=>t.toLocaleDateString(void 0,{month:"short",day:"numeric"}):c<=jt?t=>t.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):t=>t.toLocaleDateString(void 0,{year:"numeric"})}function ae(c){return c<=wt*3?"day":c<=J*3?"week":c<=jt?"month":"quarter"}function Dt(c){return String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var xt=class c extends C{static get observedAttributes(){return["src","title","view","show-today","show-progress","show-dependencies","compact"]}#s=null;#t=null;#e=null;#i=[];#r=0;#o=0;#a=0;setup(){let t=this.querySelector(":scope > table");if(!t||(this.#i=this.#c(t),this.#i.length===0))return!1;this.#r=Math.min(...this.#i.map(e=>e.start)),this.#o=Math.max(...this.#i.map(e=>e.end)),this.#a=this.#o-this.#r,this.#a<=0&&(this.#a=P),this.#p(t),this.dispatchEvent(new CustomEvent("gantt-chart:ready",{bubbles:!0,detail:{taskCount:this.#i.length,dateRange:{start:new Date(this.#r).toISOString(),end:new Date(this.#o).toISOString()}}}))}teardown(){this.#e&&(this.#e.remove(),this.#e=null),this.#s&&(this.#s.remove(),this.#s=null),this.#t&&(this.#t.remove(),this.#t=null);let t=this.querySelector("table.gc-sr-only");t&&t.classList.remove("gc-sr-only"),this.#i=[]}static#n=0;attributeChangedCallback(t,e,s){e===s||!this.isConnected||(t==="src"?this._loadSrc(s):this.hasAttribute("data-upgraded")&&this.#l())}#l(){let t=()=>{this.teardown(),this.removeAttribute("data-upgraded"),this.setup()};if(this.hasAttribute("data-upgraded")&&"startViewTransition"in document&&!matchMedia("(prefers-reduced-motion: reduce)").matches){let e=`gc-vt-${++c.#n}`;this.style.viewTransitionName=e,document.startViewTransition(t).finished.finally(()=>{this.style.viewTransitionName=""})}else t()}get tasks(){return this.#i}set tasks(t){let e=(t||[]).map((s,r)=>({id:s.id??`gc-task-${r}`,name:s.name??`Task ${r+1}`,start:typeof s.start=="number"?s.start:R(s.start),end:typeof s.end=="number"?s.end:s.end!=null?R(s.end):typeof s.start=="number"?s.start:R(s.start),progress:s.progress??0,group:s.group??null,depends:Array.isArray(s.depends)?s.depends:s.depends?String(s.depends).split(",").map(i=>i.trim()):[],status:s.status??null,assignee:s.assignee??null,milestone:!!s.milestone,color:s.color??null,storyIds:s.storyIds??[],itemIds:s.itemIds??[]}));if((this.#s||this.#e||this.#t)&&(this.#e&&(this.#e.remove(),this.#e=null),this.#s&&(this.#s.remove(),this.#s=null),this.#t&&(this.#t.remove(),this.#t=null)),this.#i=e,e.length>0){this.#r=Math.min(...e.map(r=>r.start)),this.#o=Math.max(...e.map(r=>r.end)),this.#a=this.#o-this.#r,this.#a<=0&&(this.#a=P);let s=this.querySelector(":scope > table");s||(s=document.createElement("table"),s.classList.add("gc-sr-only"),this.appendChild(s)),this.#p(s)}this.dispatchEvent(new CustomEvent("gantt-chart:tasks-changed",{detail:{tasks:e,source:"property"},bubbles:!0}))}#c(t){let e=t.querySelectorAll("tbody tr"),s=[];for(let r=0;r<e.length;r++){let i=e[r],a=i.querySelectorAll("time[datetime]");if(a.length<2&&!i.hasAttribute("data-milestone"))continue;let o=a[0]?.getAttribute("datetime"),l=a.length>1?a[1].getAttribute("datetime"):o;if(!o)continue;let d=i.querySelector("progress"),n=d?d.value/(d.max||100):0,h=i.cells[0]?.textContent?.trim()||`Task ${r+1}`;s.push({id:i.dataset.taskId||`gc-task-${r}`,name:h,start:R(o),end:R(l),progress:n,group:i.dataset.group||null,depends:i.dataset.depends?i.dataset.depends.split(",").map(u=>u.trim()):[],status:i.dataset.status||null,assignee:i.dataset.assignee||null,milestone:i.hasAttribute("data-milestone"),color:i.dataset.color||null,storyIds:i.dataset.storyIds?i.dataset.storyIds.split(",").map(u=>u.trim()):[],itemIds:i.dataset.itemIds?i.dataset.itemIds.split(",").map(u=>u.trim()):[]})}return s}#p(t){let e=this.getAttribute("title"),s=this.hasAttribute("show-today"),r=this.hasAttribute("show-progress"),i=this.hasAttribute("show-dependencies");e&&(this.#e=document.createElement("h2"),this.#e.className="gc-title",this.#e.textContent=e,this.insertBefore(this.#e,t)),this.#s=document.createElement("div"),this.#s.className="gc-container",this.#s.setAttribute("role","region"),this.#s.setAttribute("aria-label",`Gantt chart${e?": "+e:""}`);let a=this.#h();this.#s.appendChild(a);let o=document.createElement("div");o.className="gc-body";let l=document.createElement("div");l.className="gc-task-list";let d=document.createElement("div");d.className="gc-bars";let n=this.#m();d.appendChild(n);let h=this.#y();for(let[u,m]of h){if(h.size>1&&u){let g=document.createElement("div");g.className="gc-group-header";let p=document.createElement("span");p.className="gc-group-label",p.textContent=u,g.appendChild(p),l.appendChild(g);let b=document.createElement("div");b.className="gc-group-spacer",d.appendChild(b)}for(let g of m){let p=document.createElement("div");p.className="gc-task-row",p.setAttribute("data-task-id",g.id);let b=document.createElement("span");b.className="gc-task-name",b.textContent=g.name,p.appendChild(b);let v=document.createElement("span");v.className="gc-task-dates",v.textContent=`${new Date(g.start).toLocaleDateString()} to ${new Date(g.end).toLocaleDateString()}`,p.appendChild(v),l.appendChild(p);let w=document.createElement("div");w.className="gc-bar-row",g.milestone?w.appendChild(this.#f(g)):w.appendChild(this.#d(g,r)),d.appendChild(w)}}if(s){let u=this.#x();u&&d.appendChild(u)}i&&requestAnimationFrame(()=>{let u=this.#g(d);u&&d.appendChild(u)}),o.appendChild(l),o.appendChild(d),this.#s.appendChild(o),this.insertBefore(this.#s,t),t.classList.add("gc-sr-only"),this.#t=document.createElement("div"),this.#t.className="gc-sr-only",this.#t.setAttribute("role","status"),this.#t.setAttribute("aria-live","polite"),this.#t.setAttribute("aria-atomic","true"),this.appendChild(this.#t),this.listen(this.#s,"click",u=>{let m=u.target.closest(".gc-bar, .gc-milestone");if(!m)return;let g=m.dataset.taskId,p=this.#i.find(b=>b.id===g);p&&(this.#v(`Selected: ${p.name}`),this.dispatchEvent(new CustomEvent("gantt-chart:task-click",{bubbles:!0,detail:{task:p}})))}),this.listen(this.#s,"keydown",u=>{if(u.key==="Enter"||u.key===" "){let m=u.target.closest(".gc-bar, .gc-milestone");m&&(u.preventDefault(),m.click())}})}#h(){let t=document.createElement("div");t.className="gc-timeline-header";let e=document.createElement("div");e.className="gc-timeline-spacer",t.appendChild(e);let s=document.createElement("div");s.className="gc-timeline-dates";let r=this.#u();for(let{position:i,text:a}of r){let o=document.createElement("span");o.className="gc-date-label",o.style.left=`${i}%`,o.textContent=a,s.appendChild(o)}return t.appendChild(s),t}#u(){let t=this.getAttribute("view")||"auto",e=t==="auto"?ae(this.#a):t,s=ie(this.#a),r=[],i;switch(e){case"day":i=P;break;case"week":i=wt;break;case"month":i=J;break;case"quarter":i=re;break;default:i=J}let a=new Date(this.#r);if(e==="week"){let d=a.getDay(),n=d===0?1:d===1?0:8-d;a.setDate(a.getDate()+n)}else if(e==="month")a.setDate(1),a.getTime()<this.#r&&a.setMonth(a.getMonth()+1);else if(e==="quarter"){let d=a.getMonth(),n=Math.ceil((d+1)/3)*3;a.setMonth(n),a.setDate(1)}let o=a.getTime();o>this.#r+i*.5&&r.push({position:0,text:s(new Date(this.#r))});let l=o;for(;l<=this.#o;){let d=(l-this.#r)/this.#a*100;if(d>=0&&d<=100&&r.push({position:d,text:s(new Date(l))}),e==="month"){let n=new Date(l);n.setMonth(n.getMonth()+1),l=n.getTime()}else if(e==="quarter"){let n=new Date(l);n.setMonth(n.getMonth()+3),l=n.getTime()}else l+=i}return r}#m(){let t=document.createElement("div");t.className="gc-grid-lines";let e=this.#u();for(let{position:s}of e){if(s<=0)continue;let r=document.createElement("div");r.className="gc-grid-line",r.style.left=`${s}%`,t.appendChild(r)}return t}#y(){let t=new Map;for(let e of this.#i){let s=e.group||"";t.has(s)||t.set(s,[]),t.get(s).push(e)}return t}#d(t,e){let s=(t.start-this.#r)/this.#a*100,r=(t.end-t.start)/this.#a*100,i=document.createElement("div");if(i.className="gc-bar",i.setAttribute("data-task-id",t.id),i.setAttribute("role","img"),i.setAttribute("tabindex","0"),i.setAttribute("aria-label",`${Dt(t.name)}: ${new Date(t.start).toLocaleDateString()} to ${new Date(t.end).toLocaleDateString()}`+(t.progress>0?`, ${Math.round(t.progress*100)}% complete`:"")),i.style.left=`${s}%`,i.style.width=`${Math.max(r,.5)}%`,t.status&&i.setAttribute("data-status",t.status),t.color&&i.style.setProperty("--gc-bar-color",t.color),e&&t.progress>0){let a=document.createElement("div");a.className="gc-bar-fill",a.style.width=`${Math.round(t.progress*100)}%`,i.appendChild(a)}if(r>8){let a=document.createElement("span");a.className="gc-bar-label",a.textContent=t.name,i.appendChild(a)}return i}#f(t){let e=(t.start-this.#r)/this.#a*100,s=document.createElement("div");return s.className="gc-milestone",s.setAttribute("data-task-id",t.id),s.setAttribute("role","img"),s.setAttribute("tabindex","0"),s.setAttribute("aria-label",`Milestone: ${Dt(t.name)}, ${new Date(t.start).toLocaleDateString()}`),s.style.left=`${e}%`,t.status&&s.setAttribute("data-status",t.status),t.color&&s.style.setProperty("--gc-bar-color",t.color),s}#x(){let t=Date.now();if(t<this.#r||t>this.#o)return null;let e=(t-this.#r)/this.#a*100,s=document.createElement("div");s.className="gc-today-line",s.style.left=`${e}%`;let r=document.createElement("span");return r.className="gc-today-label",r.textContent="Today",s.appendChild(r),s}#g(t){if(!this.#i.some(l=>l.depends.length>0))return null;let s="http://www.w3.org/2000/svg",r=document.createElementNS(s,"svg");r.setAttribute("class","gc-deps"),r.style.width="100%",r.style.height="100%";let i=document.createElementNS(s,"defs"),a=document.createElementNS(s,"marker");a.setAttribute("id","gc-arrowhead"),a.setAttribute("markerWidth","8"),a.setAttribute("markerHeight","6"),a.setAttribute("refX","8"),a.setAttribute("refY","3"),a.setAttribute("orient","auto");let o=document.createElementNS(s,"polygon");o.setAttribute("points","0 0, 8 3, 0 6"),o.setAttribute("fill","var(--color-text-muted, #666666)"),a.appendChild(o),i.appendChild(a),r.appendChild(i);for(let l of this.#i)for(let d of l.depends){let n=this.#i.find(_=>_.id===d);if(!n)continue;let h=(n.end-this.#r)/this.#a*100,u=(l.start-this.#r)/this.#a*100,m=this.#b(n.id,t),g=this.#b(l.id,t);if(m===-1||g===-1)continue;let p=36,b=m*p+p/2,v=g*p+p/2,w=document.createElementNS(s,"path"),y=h+(u-h)/2;w.setAttribute("d",`M ${h}% ${b} C ${y}% ${b}, ${y}% ${v}, ${u}% ${v}`),w.setAttribute("class","gc-dep-line"),r.appendChild(w)}return r}#b(t,e){let s=e.querySelectorAll(".gc-bar-row");for(let r=0;r<s.length;r++){let i=s[r].querySelector("[data-task-id]");if(i&&i.dataset.taskId===t)return r}return-1}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();let r=document.createElement("table"),i=document.createElement("thead"),a=document.createElement("tr");for(let l of["Task","Start","End","Progress"]){let d=document.createElement("th");d.textContent=l,a.appendChild(d)}i.appendChild(a),r.appendChild(i);let o=document.createElement("tbody");for(let l of s.tasks||[]){let d=document.createElement("tr");l.id&&(d.dataset.taskId=l.id),l.group&&(d.dataset.group=l.group),l.depends&&(d.dataset.depends=Array.isArray(l.depends)?l.depends.join(","):l.depends),l.status&&(d.dataset.status=l.status),l.assignee&&(d.dataset.assignee=l.assignee),l.milestone&&d.setAttribute("data-milestone",""),l.color&&(d.dataset.color=l.color),l.storyIds&&(d.dataset.storyIds=Array.isArray(l.storyIds)?l.storyIds.join(","):l.storyIds),l.itemIds&&(d.dataset.itemIds=Array.isArray(l.itemIds)?l.itemIds.join(","):l.itemIds);let n=document.createElement("td");n.textContent=l.name||"",d.appendChild(n);let h=document.createElement("td"),u=document.createElement("time");u.setAttribute("datetime",l.start),u.textContent=new Date(l.start).toLocaleDateString(void 0,{month:"short",day:"numeric"}),h.appendChild(u),d.appendChild(h);let m=document.createElement("td"),g=document.createElement("time");g.setAttribute("datetime",l.end||l.start),g.textContent=new Date(l.end||l.start).toLocaleDateString(void 0,{month:"short",day:"numeric"}),m.appendChild(g),d.appendChild(m);let p=document.createElement("td"),b=document.createElement("progress");b.value=l.progress||0,b.max=100,b.textContent=`${l.progress||0}%`,p.appendChild(b),d.appendChild(p),o.appendChild(d)}r.appendChild(o),this.appendChild(r),s.title&&this.setAttribute("title",s.title),this.#l()}catch(e){console.warn(`[gantt-chart] Failed to load src="${t}":`,e)}}#v(t){this.#t&&(this.#t.textContent="",requestAnimationFrame(()=>{this.#t&&(this.#t.textContent=t)}))}};x("gantt-chart",xt);var _t=class c extends C{static get observedAttributes(){return["src","compact","title","searchable"]}static#s=0;#t=null;#e=null;#i=null;#r=null;#o=null;#a="";#n=null;#l=[];#c=[];#p=new Map;#h=new Map;setup(){this.#a=`gloss-${++c.#s}`;let t=this.querySelector(":scope > dl");if(!t)return!1;let e=[...t.querySelectorAll(":scope > div[data-term-id]")];if(e.length===0)return!1;this.#l=e.map(i=>{let a=i.getAttribute("data-term-id")||"",o=i.getAttribute("data-category")||"Uncategorized",l=i.querySelector("dt"),d=i.querySelector("dd"),n=l?l.textContent.trim():"",h=d?d.textContent.trim():"";return i.id=a,{id:a,term:n,definition:h,category:o,el:i}});let s=new Set;this.#c=[];for(let i of this.#l)s.has(i.category)||(s.add(i.category),this.#c.push(i.category));t.remove(),this.#u();let r=this.getAttribute("src");if(r){this._loadSrc(r);return}this.dispatchEvent(new CustomEvent("glossary-wc:ready",{bubbles:!0,detail:{termCount:this.#l.length,categories:[...this.#c]}}))}get terms(){return this.#l.map(t=>({id:t.id,term:t.term,definition:t.definition,category:t.category}))}set terms(t){let e=Array.isArray(t)?t:[];for(;this.firstChild;)this.firstChild.remove();let s=document.createElement("dl");for(let r of e){let i=document.createElement("div");i.setAttribute("data-term-id",r.id||""),r.category&&i.setAttribute("data-category",r.category);let a=document.createElement("dt");a.textContent=r.term||"";let o=document.createElement("dd");o.textContent=r.definition||"",i.appendChild(a),i.appendChild(o),s.appendChild(i)}this.appendChild(s),this.teardown(),this.removeAttribute("data-upgraded"),this.setup(),this.dispatchEvent(new CustomEvent("glossary-wc:terms-changed",{detail:{terms:e,source:"property"},bubbles:!0}))}teardown(){this.#n&&clearTimeout(this.#n);let t=this.querySelector(".gloss-title");t&&t.remove(),this.#t?.parentElement&&this.#t.parentElement.remove(),this.#e&&this.#e.remove(),this.#o&&this.#o.remove(),this.#r&&this.#r.remove(),this.#t=null,this.#e=null,this.#i=null,this.#r=null,this.#o=null,this.#l=[],this.#c=[],this.#p=new Map,this.#h=new Map}#u(){let t=this.getAttribute("title");if(t){let e=document.createElement("h2");e.className="gloss-title",e.textContent=t,this.#i=document.createElement("output"),this.#i.className="gloss-count",this.#i.textContent=String(this.#l.length),e.appendChild(this.#i),this.appendChild(e)}if(this.hasAttribute("searchable")){let e=document.createElement("div");e.className="gloss-search";let s=document.createElement("input");s.type="search",s.className="gloss-search-input",s.setAttribute("placeholder","Search terms\u2026"),s.setAttribute("aria-label","Search glossary terms"),e.appendChild(s),this.appendChild(e),this.#t=s,this.listen(s,"input",this.#d)}this.#m(),this.#o=document.createElement("div"),this.#o.className="gloss-categories",this.#o.setAttribute("role","region"),this.#o.setAttribute("aria-label","Glossary terms"),this.appendChild(this.#o);for(let e of this.#c){let s=this.#l.filter(r=>r.category===e);this.#y(e,s)}this.#r=document.createElement("div"),this.#r.className="gloss-live-region",this.#r.setAttribute("role","status"),this.#r.setAttribute("aria-live","polite"),this.#r.setAttribute("aria-atomic","true"),this.appendChild(this.#r)}#m(){this.#e=document.createElement("nav"),this.#e.className="gloss-jump-bar",this.#e.setAttribute("aria-label","Alphabet navigation");let t=new Set;for(let e of this.#l){let s=e.term.charAt(0).toUpperCase();/[A-Z]/.test(s)&&t.add(s)}for(let e=65;e<=90;e++){let s=String.fromCharCode(e),r=document.createElement("a");r.textContent=s,r.className="gloss-jump-letter",t.has(s)?(r.href=`#${this.#a}-letter-${s}`,r.setAttribute("data-active","")):(r.setAttribute("aria-disabled","true"),r.setAttribute("tabindex","-1")),this.#e.appendChild(r)}this.appendChild(this.#e)}#y(t,e){let s=document.createElement("section");s.className="gloss-category",s.setAttribute("data-category",t);let r=document.createElement("header");r.className="gloss-category-header";let i=document.createElement("button");i.type="button",i.className="gloss-category-toggle",i.setAttribute("aria-expanded","true"),i.innerHTML=`<span class="gloss-category-label">${f(t)}</span><output class="gloss-category-count">${e.length}</output><span class="gloss-chevron" aria-hidden="true"></span>`,r.appendChild(i),s.appendChild(r),this.#p.set(t,i);let a=document.createElement("dl");a.className="gloss-term-list";let o=[...e].sort((n,h)=>n.term.localeCompare(h.term)),l=[],d="";for(let n of o){let h=n.term.charAt(0).toUpperCase();if(/[A-Z]/.test(h)&&h!==d){d=h;let u=document.createElement("span");u.id=`${this.#a}-letter-${h}`,u.className="gloss-letter-anchor",a.appendChild(u)}n.el.className="gloss-term",n.el.id=n.id,a.appendChild(n.el),l.push(n.el)}this.#h.set(t,l),s.appendChild(a),this.#o.appendChild(s),this.listen(i,"click",()=>{let n=i.getAttribute("aria-expanded")==="true";i.setAttribute("aria-expanded",String(!n)),a.hidden=n})}#d=t=>{this.#n&&clearTimeout(this.#n),this.#n=setTimeout(()=>{let e=t.target.value.toLowerCase().trim();this.#f(e)},150)};#f(t){let e=0;for(let s of this.#l)t===""||s.term.toLowerCase().includes(t)||s.definition.toLowerCase().includes(t)?(s.el.removeAttribute("hidden"),e++):s.el.setAttribute("hidden","");for(let s of this.#c){let r=this.#h.get(s)||[],i=r[0]?.closest(".gloss-category");if(!i)continue;if(r.some(o=>!o.hasAttribute("hidden"))){i.removeAttribute("hidden");let o=r.filter(d=>!d.hasAttribute("hidden")).length,l=i.querySelector(".gloss-category-count");l&&(l.textContent=String(o))}else i.setAttribute("hidden","")}this.#i&&(this.#i.textContent=t===""?String(this.#l.length):`${e} / ${this.#l.length}`),t!==""&&this.#r&&(this.#r.textContent="",requestAnimationFrame(()=>{this.#r&&(this.#r.textContent=`${e} term${e!==1?"s":""} found`)})),this.dispatchEvent(new CustomEvent("glossary-wc:search",{bubbles:!0,detail:{query:t,matchCount:e}}))}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();let r=document.createElement("dl");for(let i of s.terms||[]){let a=document.createElement("div");a.setAttribute("data-term-id",i.id||""),a.setAttribute("data-category",i.category||"Uncategorized");let o=document.createElement("dt");o.textContent=i.term||"";let l=document.createElement("dd"),d=i.definition||"";if(i.seeAlso&&i.seeAlso.length>0){let n=i.seeAlso.map(h=>`<a href="#${f(h)}">${f(this.#x(h))}</a>`).join(", ");d+=` See also: ${n}.`}l.innerHTML=d,a.appendChild(o),a.appendChild(l),r.appendChild(a)}this.appendChild(r),s.title&&!this.getAttribute("title")&&this.setAttribute("title",s.title),this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[glossary-wc] Failed to load src="${t}":`,e)}}#x(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("glossary-wc",_t);var B=`
:host {
  --_bg:        var(--work-item-bg, var(--color-surface, #ffffff));
  --_text:      var(--work-item-text, var(--color-text, #1a1a1a));
  --_muted:     var(--work-item-muted, var(--color-text-muted, #666));
  --_border:    var(--work-item-border, var(--color-border, #e0e0e0));
  --_accent:    var(--work-item-accent, var(--color-interactive, #0066cc));
  --_card-bg:   var(--work-item-card-bg, var(--color-surface-raised, #f8f9fa));
  --_highlight: var(--work-item-highlight, color-mix(in srgb, var(--_accent) 8%, transparent));
  --_radius:    var(--work-item-radius, var(--radius-l, 0.75rem));
  --_shadow:       var(--work-item-shadow, var(--shadow-sm));
  --_shadow-hover: var(--work-item-shadow-hover, var(--shadow-md));
  --_duration:     var(--work-item-duration, var(--duration-normal, 200ms));
  --_ease:         var(--work-item-ease, var(--ease-default, ease));
  --_space-2xs:    var(--work-item-space-2xs, var(--size-2xs, 0.25rem));
  --_space-xs:     var(--work-item-space-xs, var(--size-xs, 0.5rem));
  --_space-s:      var(--work-item-space-s, var(--size-s, 0.75rem));
  --_space-m:      var(--work-item-space-m, var(--size-m, 1rem));
  --_font-xs:      var(--work-item-font-xs, var(--font-size-xs, 0.75rem));
  --_font-sm:      var(--work-item-font-sm, var(--font-size-sm, 0.875rem));
  --_font-md:      var(--work-item-font-md, var(--font-size-md, 1rem));
  --_font-lg:      var(--work-item-font-lg, var(--font-size-lg, 1.125rem));
  --_font-mono:    var(--work-item-font-mono, var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace));
  --_radius-s:     var(--work-item-radius-s, var(--radius-s, 0.25rem));
  --_radius-full:  var(--work-item-radius-full, var(--radius-full, 9999px));

  display: block;
  font-family: var(--work-item-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
}

*, *::before, *::after { box-sizing: border-box; margin: 0; }

/* \u2500\u2500 Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-card {
  background: var(--_bg);
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  overflow: hidden;
  box-shadow: var(--_shadow);
  transition: box-shadow var(--_duration) var(--_ease);
}

.wi-card:hover {
  box-shadow: var(--_shadow-hover);
}

/* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--_space-s) var(--_space-m);
  background: var(--_card-bg);
  border-block-end: 1px solid var(--_border);
  gap: var(--_space-s);
  flex-wrap: wrap;
}

.wi-meta {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  flex-wrap: wrap;
  min-width: 0;
}

.wi-id {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  font-family: var(--_font-mono);
}

/* \u2500\u2500 Type badge \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-type {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--_radius-s);
  text-transform: capitalize;
}

.wi-type svg {
  width: 12px;
  height: 12px;
}

/* Type colors \u2014 driven by VB theme tokens, with color-mix surfaces so the
   pill background shifts with the active theme. */
.wi-type[data-type="task"]    { color: var(--color-info,    #3b82f6); background: color-mix(in oklch, var(--color-info,    #3b82f6) 12%, transparent); }
.wi-type[data-type="bug"]     { color: var(--color-error,   #dc2626); background: color-mix(in oklch, var(--color-error,   #dc2626) 12%, transparent); }
.wi-type[data-type="chore"]   { color: var(--color-text-muted, #6b7280); background: color-mix(in oklch, var(--color-text-muted, #6b7280) 12%, transparent); }
.wi-type[data-type="spike"]   { color: var(--color-accent,  #8b5cf6); background: color-mix(in oklch, var(--color-accent,  #8b5cf6) 12%, transparent); }
.wi-type[data-type="feature"] { color: var(--color-success, #059669); background: color-mix(in oklch, var(--color-success, #059669) 12%, transparent); }

/* \u2500\u2500 Badges \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-badges {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
}

.wi-priority,
.wi-status {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: var(--_radius-full);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.wi-estimate {
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

/* \u2500\u2500 Body \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-body {
  padding: 16px 20px;
}

.wi-title-wrap {
  margin-block-end: var(--_space-xs);
}

.wi-title-wrap:last-child {
  margin-block-end: 0;
}

::slotted([slot="title"]) {
  font-size: var(--_font-lg) !important;
  font-weight: 700 !important;
  color: var(--_text) !important;
  line-height: 1.4 !important;
  margin: 0 !important;
}

.wi-title-fallback {
  font-size: var(--_font-lg);
  font-weight: 700;
  color: var(--_text);
  line-height: 1.4;
}

.wi-title:last-child {
  margin-block-end: 0;
}

/* \u2500\u2500 Assignee \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-assignee {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--_font-xs);
  color: var(--_muted);
  margin-block-start: var(--_space-xs);
}

.wi-assignee__avatar {
  width: 20px;
  height: 20px;
  border-radius: var(--_radius-full);
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-inverted, #fff);
  flex-shrink: 0;
}

/* \u2500\u2500 Linked stories \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-block-start: var(--_space-s);
}

.wi-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--_radius-s);
  background: var(--_highlight);
  color: var(--_accent);
  text-decoration: none;
}

.wi-link:hover {
  text-decoration: underline;
}

.wi-link svg {
  width: 11px;
  height: 11px;
}

/* \u2500\u2500 Sections \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-sections {
  border-block-start: 1px solid var(--_border);
}

.wi-section {
  padding: 14px 20px;
  border-block-end: 1px solid var(--_border);
}

.wi-section:last-child {
  border-block-end: none;
}

.wi-section-header {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  margin-block-end: var(--_space-s);
}

.wi-section-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wi-section-icon svg {
  width: 13px;
  height: 13px;
  fill: var(--color-text-inverted, #fff);
}

.wi-section-icon.description { background: var(--color-info,    #3b82f6); }
.wi-section-icon.checklist   { background: var(--color-success, #22c55e); }
.wi-section-icon.notes       { background: var(--color-warning, #f59e0b); }

.wi-section-title {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.wi-section-content {
  color: var(--_text);
  font-size: var(--_font-sm);
  line-height: 1.6;
}

.wi-section-content ::slotted(ul),
.wi-section-content ::slotted(ol) {
  margin: 0;
  padding-inline-start: 20px;
}

.wi-section-content ::slotted(p) {
  margin: 0;
}

.slot-fallback {
  color: var(--_muted);
  font-style: italic;
}

/* \u2500\u2500 Minimal detail \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-card--minimal {
  padding: var(--_space-xs);
  cursor: pointer;
}

.wi-card--minimal:hover {
  box-shadow: var(--_shadow-hover);
}

.wi-card--minimal:focus-visible {
  outline: 2px solid var(--_accent);
  outline-offset: 2px;
}

.wi-card--minimal .wi-header { display: none; }
.wi-card--minimal .wi-sections { display: none; }
.wi-card--minimal .wi-links { display: none; }
.wi-card--minimal .wi-assignee { display: none; }

.wi-card--minimal .wi-body {
  padding: var(--_space-xs) var(--_space-s);
}

.wi-card--minimal .wi-title-fallback,
.wi-card--minimal ::slotted([slot="title"]) {
  font-size: var(--_font-sm) !important;
  font-weight: 600 !important;
}

.wi-card--minimal .wi-id {
  display: block;
  margin-block-end: var(--_space-2xs);
}

.wi-card--minimal .wi-type {
  font-size: 10px;
  padding: 2px 6px;
}

/* \u2500\u2500 Compact detail \u2014 hide empty sections \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.wi-card--compact .wi-section[data-empty] {
  display: none;
}

.wi-card--compact .slot-fallback {
  display: none;
}

.wi-card--compact .wi-body {
  padding: var(--_space-s) var(--_space-m);
}

/* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (max-width: 480px) {
  .wi-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .wi-badges {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wi-card {
    transition: none;
  }
}

@media print {
  .wi-card {
    box-shadow: none;
    break-inside: avoid;
  }
}

.state-msg        { padding: var(--_space-m); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
.state-msg--error { color: var(--color-error-text, var(--color-error, #dc2626)); }
`;var Rt={task:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>',bug:'<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',chore:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',spike:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',feature:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'},At={critical:{label:"Critical",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"},high:{label:"High",color:"#ea580c",bg:"rgba(234, 88, 12, 0.1)"},medium:{label:"Medium",color:"#ca8a04",bg:"rgba(202, 138, 4, 0.1)"},low:{label:"Low",color:"#16a34a",bg:"rgba(22, 163, 74, 0.1)"}},Ct={backlog:{label:"Backlog",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"},"to-do":{label:"To Do",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},"in-progress":{label:"In Progress",color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.1)"},review:{label:"Review",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},done:{label:"Done",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"},blocked:{label:"Blocked",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"}},kt=class extends HTMLElement{static get observedAttributes(){return["item-id","type","priority","status","estimate","assignee","story-ids","detail","compact","src"]}#s=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#t(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#s.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#s.get(t)||""}connectedCallback(){this.#t(),this.itemId&&!this.id&&(this.id=this.itemId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#e(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,s){e!==s&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(s):this.#e())}get itemId(){return this.getAttribute("item-id")||""}get itemTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#s.get("title")||""}get itemType(){return this.getAttribute("type")||"task"}get priority(){return this.getAttribute("priority")||"medium"}get status(){return this.getAttribute("status")||"backlog"}get estimate(){return this.getAttribute("estimate")||""}get assignee(){return this.getAttribute("assignee")||""}get storyIds(){let t=this.getAttribute("story-ids")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}get _minimalLabel(){return this.itemTitle||this.itemId||"Work item"}updateStatus(t){Ct[t]&&(this.setAttribute("status",t),this.dispatchEvent(new CustomEvent("work-item:status",{detail:{status:t,itemId:this.itemId},bubbles:!0,composed:!0})))}updatePriority(t){At[t]&&(this.setAttribute("priority",t),this.dispatchEvent(new CustomEvent("work-item:priority",{detail:{priority:t,itemId:this.itemId},bubbles:!0,composed:!0})))}get data(){return{itemId:this.itemId||void 0,type:this.itemType,priority:this.priority,status:this.status,estimate:this.estimate||void 0,assignee:this.assignee||void 0,storyIds:this.storyIds.length?this.storyIds:void 0,detail:this.getAttribute("detail")||void 0,title:this.itemTitle||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.shadowRoot&&this.#e(),this.dispatchEvent(new CustomEvent("work-item:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let[e,s]of[["itemId","item-id"],["type","type"],["priority","priority"],["status","status"],["estimate","estimate"],["assignee","assignee"],["detail","detail"]])t[e]!=null&&this.setAttribute(s,String(t[e]));if(t.storyIds&&this.setAttribute("story-ids",Array.isArray(t.storyIds)?t.storyIds.join(","):t.storyIds),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=t.title,this.appendChild(e)}for(let e of["description","notes"])if(t[e]&&!this.querySelector(`[slot="${e}"]`)){let s=document.createElement("p");s.slot=e,s.textContent=t[e],this.appendChild(s)}if(t.checklist&&!this.querySelector('[slot="checklist"]')){let e=document.createElement("ul");e.slot="checklist";let s=Array.isArray(t.checklist)?t.checklist:[t.checklist];for(let r of s){let i=document.createElement("li");i.textContent=r,e.appendChild(i)}this.appendChild(e)}}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${B}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this._applyData(s),this.#e()}catch(e){this.shadowRoot.innerHTML=`<style>${B}</style><div class="state-msg state-msg--error">Could not load: ${f(e.message)}</div>`}}}#e(){let t=At[this.priority]||At.medium,e=Ct[this.status]||Ct.backlog,s=this.itemType,r=Rt[s]||Rt.task,i=this._detailLevel,a=this.itemId?`Work item: ${f(this.itemId)}`:"Work item";if(i==="minimal"){this.shadowRoot.innerHTML=`<style>${B}</style>
        <article class="wi-card wi-card--minimal" role="article" aria-label="${a}"
          tabindex="0">
          <div class="wi-body">
            <div class="wi-meta">
              ${this.itemId?`<span class="wi-id">${f(this.itemId)}</span>`:""}
              <span class="wi-type" data-type="${f(s)}">${A(r)} ${f(s)}</span>
            </div>
            <div class="wi-title-wrap">
              <slot name="title"><span class="wi-title-fallback">${f(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;return}if(this.shadowRoot.innerHTML=`<style>${B}</style>
      <article class="wi-card wi-card--${i}" role="article" aria-label="${a}">

        <header class="wi-header">
          <div class="wi-meta">
            ${this.itemId?`<span class="wi-id">${f(this.itemId)}</span>`:""}
            <span class="wi-type" data-type="${f(s)}">${A(r)} ${f(s)}</span>
          </div>
          <div class="wi-badges">
            <span class="wi-priority" style="color:${t.color};background:${t.bg}">${f(t.label)}</span>
            <span class="wi-status" style="color:${e.color};background:${e.bg}">${f(e.label)}</span>
            ${this.estimate?`<span class="wi-estimate" title="Estimate">${f(this.estimate)}</span>`:""}
          </div>
        </header>

        <div class="wi-body">
          <div class="wi-title-wrap">
            <slot name="title"><span class="wi-title-fallback">[Untitled work item]</span></slot>
          </div>

          ${this.assignee?`
            <div class="wi-assignee">
              <span class="wi-assignee__avatar" style="background:${z(this.assignee)}">${L(this.assignee)}</span>
              ${f(this.assignee)}
            </div>`:""}

          ${this.storyIds.length?`
            <div class="wi-links">
              ${this.storyIds.map(o=>`<a class="wi-link" href="#${f(o)}">${A('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/>')} ${f(o)}</a>`).join("")}
            </div>`:""}
        </div>

        <div class="wi-sections">
          <div class="wi-section">
            <div class="wi-section-header">
              <div class="wi-section-icon description">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span class="wi-section-title">Description</span>
            </div>
            <div class="wi-section-content">
              <slot name="description"><em class="slot-fallback">No description.</em></slot>
            </div>
          </div>

          <div class="wi-section">
            <div class="wi-section-header">
              <div class="wi-section-icon checklist">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <span class="wi-section-title">Checklist</span>
            </div>
            <div class="wi-section-content">
              <slot name="checklist"><em class="slot-fallback">No checklist items.</em></slot>
            </div>
          </div>

          <div class="wi-section">
            <div class="wi-section-header">
              <div class="wi-section-icon notes">
                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </div>
              <span class="wi-section-title">Notes</span>
            </div>
            <div class="wi-section-content">
              <slot name="notes"><em class="slot-fallback">No notes.</em></slot>
            </div>
          </div>
        </div>

      </article>`,i==="compact")for(let o of this.shadowRoot.querySelectorAll(".wi-section")){let l=o.querySelector("slot");l&&l.assignedNodes().length===0&&o.setAttribute("data-empty","")}this.dispatchEvent(new CustomEvent("work-item:ready",{detail:{itemId:this.itemId,title:this.itemTitle,type:s,priority:this.priority,status:this.status},bubbles:!0,composed:!0}))}};x("work-item",kt);var Z={layout:{label:"Layout",cssClass:"sm-badge--layout"},section:{label:"Section",cssClass:"sm-badge--section"},dashboard:{label:"Dashboard",cssClass:"sm-badge--dashboard"},page:{label:"Page",cssClass:"sm-badge--page"},modal:{label:"Modal",cssClass:"sm-badge--modal"},redirect:{label:"Redirect",cssClass:"sm-badge--redirect"}},tt={draft:{label:"Draft",cssClass:"sm-status--draft"},ready:{label:"Ready",cssClass:"sm-status--ready"},live:{label:"Live",cssClass:"sm-status--live"},deprecated:{label:"Deprecated",cssClass:"sm-status--deprecated"}},Et=class c extends C{static get observedAttributes(){return["src","collapsed","compact","title","data-view","data-orientation","data-detail"]}static#s=0;#t=null;#e=null;#i=null;#r=null;#o=0;#a=0;setup(){c.#s++;let t=this.getAttribute("src");if(t&&!this.querySelector("nav")){this._loadSrc(t);return}let e=this.querySelector(":scope > nav");if(e){if(this.#o=0,this.#a=0,this.#n(e.querySelector("ul"),0),this.dataset.view==="visual"){this.#c(),this.#Z(e),this.dispatchEvent(new CustomEvent("site-map-wc:ready",{bubbles:!0,detail:{nodeCount:this.#o,depth:this.#a}}));return}this.#l(e.querySelector("ul"),0),this.#c(),e.classList.add("sm-tree"),e.setAttribute("role","tree"),e.setAttribute("aria-label",this.getAttribute("title")||"Site map"),this.#t=e,this.hasAttribute("collapsed")&&this.#p(),this.listen(e,"keydown",s=>this.#y(s)),this.listen(e,"click",s=>this.#m(s)),this.dispatchEvent(new CustomEvent("site-map-wc:ready",{bubbles:!0,detail:{nodeCount:this.#o,depth:this.#a}}))}}teardown(){if(this.#i){this.#i.remove(),this.#i=null;let t=this.querySelector("nav");t&&(t.style.display="",t.removeAttribute("aria-hidden"))}this.#e&&(this.#e.remove(),this.#e=null),this.#t&&(this.#t.classList.remove("sm-tree"),this.#t.removeAttribute("role"),this.#t.removeAttribute("aria-label")),this.querySelectorAll(".sm-node-content, .sm-toggle").forEach(t=>t.remove()),this.querySelectorAll('li[role="treeitem"]').forEach(t=>{t.removeAttribute("role"),t.removeAttribute("aria-expanded"),t.removeAttribute("tabindex")}),this.querySelectorAll('ul[role="group"]').forEach(t=>{t.removeAttribute("role"),t.classList.remove("sm-subtree","sm-collapsed")}),this.#t=null,this.#r=null,this.#o=0,this.#a=0}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}#n(t,e){if(!t)return;let s=t.querySelectorAll(":scope > li");for(let r of s){this.#o++;let i=e+1;i>this.#a&&(this.#a=i);let a=r.querySelector(":scope > ul");a&&this.#n(a,i)}}#l(t,e){if(!t)return;e>0&&(t.setAttribute("role","group"),t.classList.add("sm-subtree"));let s=[...t.querySelectorAll(":scope > li")];for(let r of s){let i=!!r.querySelector(":scope > ul"),a=r.querySelector(":scope > a"),o=r.getAttribute("data-page-type")||"page",l=r.getAttribute("data-template")||"",d=r.getAttribute("data-status")||"";r.setAttribute("role","treeitem"),r.setAttribute("tabindex","-1");let n=document.createElement("span");if(n.className="sm-node-content",i){r.setAttribute("aria-expanded","true");let u=document.createElement("button");u.className="sm-toggle",u.setAttribute("type","button"),u.setAttribute("aria-hidden","true"),u.setAttribute("tabindex","-1"),u.textContent="\u25BE",n.appendChild(u)}else{let u=document.createElement("span");u.className="sm-leaf-marker",u.setAttribute("aria-hidden","true"),n.appendChild(u)}if(d&&tt[d]){let u=document.createElement("span");u.className=`sm-status-dot ${tt[d].cssClass}`,u.setAttribute("title",tt[d].label),u.setAttribute("aria-label",tt[d].label),n.appendChild(u)}if(a&&n.appendChild(a),Z[o]){let u=document.createElement("span");u.className=`sm-badge ${Z[o].cssClass}`,u.textContent=Z[o].label,n.appendChild(u)}if(l){let u=document.createElement("span");u.className="sm-badge sm-badge--template",u.textContent=l,n.appendChild(u)}r.insertBefore(n,r.firstChild);let h=r.querySelector(":scope > ul");h&&this.#l(h,e+1)}}#c(){let t=this.getAttribute("title");if(!t&&this.#o===0)return;if(this.#e=document.createElement("div"),this.#e.className="sm-header",t){let r=document.createElement("h2");r.className="sm-title",r.textContent=t,this.#e.appendChild(r)}let e=document.createElement("span");e.className="sm-summary",e.textContent=`${this.#o} pages \xB7 ${this.#a} levels deep`,this.#e.appendChild(e);let s=document.createElement("button");s.className="sm-toggle-all",s.setAttribute("type","button"),s.textContent="Collapse all",s.addEventListener("click",()=>{this.querySelectorAll('li[aria-expanded="true"]').length>0?(this.#p(),s.textContent="Expand all"):(this.#h(),s.textContent="Collapse all")}),this.#e.appendChild(s),this.insertBefore(this.#e,this.firstChild)}#p(){let t=this.querySelectorAll("li[aria-expanded]");for(let e of t){e.setAttribute("aria-expanded","false");let s=e.querySelector(":scope > ul");s&&s.classList.add("sm-collapsed");let r=e.querySelector(":scope > .sm-node-content > .sm-toggle");r&&(r.textContent="\u25B8")}}#h(){let t=this.querySelectorAll("li[aria-expanded]");for(let e of t){e.setAttribute("aria-expanded","true");let s=e.querySelector(":scope > ul");s&&s.classList.remove("sm-collapsed");let r=e.querySelector(":scope > .sm-node-content > .sm-toggle");r&&(r.textContent="\u25BE")}}#u(t){let e=t.getAttribute("aria-expanded")==="true";t.setAttribute("aria-expanded",e?"false":"true");let s=t.querySelector(":scope > ul");s&&s.classList.toggle("sm-collapsed",e);let r=t.querySelector(":scope > .sm-node-content > .sm-toggle");r&&(r.textContent=e?"\u25B8":"\u25BE")}#m(t){let e=t.target;if(e.closest(".sm-toggle")){t.preventDefault();let i=e.closest('li[role="treeitem"]');i&&this.#u(i);return}let s=e.closest('li[role="treeitem"]');if(!s)return;this.#g(s);let r=e.closest("a");r&&this.dispatchEvent(new CustomEvent("site-map-wc:select",{bubbles:!0,detail:{href:r.getAttribute("href")||"",pageType:s.getAttribute("data-page-type")||"page",template:s.getAttribute("data-template")||""}}))}#y(t){let e=t.target.closest('li[role="treeitem"]');if(!e)return;let s=t.key,r=!1;switch(s){case"ArrowDown":r=!0,this.#f(e);break;case"ArrowUp":r=!0,this.#x(e);break;case"ArrowRight":if(r=!0,e.getAttribute("aria-expanded")==="false")this.#u(e);else if(e.getAttribute("aria-expanded")==="true"){let i=e.querySelector(':scope > ul > li[role="treeitem"]');i&&this.#g(i)}break;case"ArrowLeft":if(r=!0,e.getAttribute("aria-expanded")==="true")this.#u(e);else{let i=e.parentElement?.closest('li[role="treeitem"]');i&&this.#g(i)}break;case"Enter":r=!0,e.hasAttribute("aria-expanded")&&this.#u(e);break;case" ":r=!0;{let i=e.querySelector(":scope > .sm-node-content > a");i&&i.click()}break;case"Home":r=!0;{let i=this.querySelector('li[role="treeitem"]');i&&this.#g(i)}break;case"End":r=!0;{let i=this.#d();i.length&&this.#g(i[i.length-1])}break}r&&(t.preventDefault(),t.stopPropagation())}#d(){let t=[],e=r=>{if(!r)return;let i=[...r.querySelectorAll(':scope > li[role="treeitem"]')];for(let a of i)if(t.push(a),a.getAttribute("aria-expanded")==="true"){let o=a.querySelector(":scope > ul");o&&e(o)}},s=this.querySelector("nav > ul");return e(s),t}#f(t){let e=this.#d(),s=e.indexOf(t);s>=0&&s<e.length-1&&this.#g(e[s+1])}#x(t){let e=this.#d(),s=e.indexOf(t);s>0&&this.#g(e[s-1])}#g(t){this.#r&&this.#r.setAttribute("tabindex","-1"),t.setAttribute("tabindex","0"),t.focus(),this.#r=t}static#b="http://www.w3.org/2000/svg";static#v=150;static#k=70;static#A=30;static#_=50;static#C=20;static#P={layout:{stroke:"#8b5cf6",fill:"#f5f3ff",text:"#6d28d9"},section:{stroke:"#3b82f6",fill:"#eff6ff",text:"#1d4ed8"},dashboard:{stroke:"#22c55e",fill:"#f0fdf4",text:"#15803d"},page:{stroke:"#94a3b8",fill:"#f8fafc",text:"#475569"},modal:{stroke:"#f59e0b",fill:"#fffbeb",text:"#b45309"},redirect:{stroke:"#ef4444",fill:"#fef2f2",text:"#b91c1c"}};static#D={draft:"#94a3b8",ready:"#f59e0b",live:"#22c55e",deprecated:"#ef4444"};#j(t){let e=[];for(let s of t.querySelectorAll(":scope > li")){let r=s.querySelector(":scope > a"),i=s.querySelector(":scope > ul");e.push({label:r?.textContent?.trim()||s.firstChild?.textContent?.trim()||"",href:r?.getAttribute("href")||"",pageType:s.getAttribute("data-page-type")||"page",template:s.getAttribute("data-template")||"",status:s.getAttribute("data-status")||"",children:i?this.#j(i):[],x:0,y:0,subtreeWidth:0,collapsed:!1,childCount:0})}return e}#R(t,e=0){let s=c.#v,r=c.#k,i=c.#A,a=c.#_;for(let o of t)o.childCount=this.#B(o),o.children.length>0&&!o.collapsed?(this.#R(o.children,e+1),o.subtreeWidth=o.children.reduce((l,d)=>l+d.subtreeWidth,0)+i*(o.children.length-1)):o.subtreeWidth=s,o.subtreeWidth=Math.max(o.subtreeWidth,s)}#B(t){let e=0;for(let s of t.children)e+=1+this.#B(s);return e}#F(t,e,s){let r=c.#v,i=c.#k,a=c.#A,o=c.#_,l=e;for(let d of t)d.x=l+(d.subtreeWidth-r)/2,d.y=s,d.children.length>0&&!d.collapsed&&this.#F(d.children,l,s+i+o),l+=d.subtreeWidth+a}#Z(t){t.style.display="none",t.setAttribute("aria-hidden","true");let e=t.querySelector("ul");e&&(this.#w=this.#j(e),this.#$())}#w=null;#E=1;get#M(){return this.dataset.orientation==="horizontal"?"horizontal":"vertical"}get#H(){return Math.min(4,Math.max(0,parseInt(this.dataset.detail||"2",10)))}static#T={zoomIn:'<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',zoomOut:'<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>',reset:'<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',flip:'<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/>'};static#O=["Shape","Shape + Title","Full","Full + Status","Wireframe"];static#tt=0;#et(t){let e=this.#i?.querySelector(".sm-visual-scroll"),s=this.#i?.querySelector('svg[role="tree"]'),r={nodeId:null,rectTop:0,rectLeft:0,focusId:this.#q};if(!e||!s)return r;let i=t||this.#q;if(!i)return r;let o=s.querySelector(`[data-node-id="${i}"]`)?.querySelector("rect");if(!o)return r;let l=o.getBoundingClientRect(),d=e.getBoundingClientRect();return r.nodeId=i,r.rectTop=l.top-d.top,r.rectLeft=l.left-d.left,r}#U(t){let e=this.#i?.querySelector(".sm-visual-scroll"),s=this.#i?.querySelector('svg[role="tree"]');if(!(!e||!s)){if(t.nodeId){let i=s.querySelector(`[data-node-id="${t.nodeId}"]`)?.querySelector("rect");if(i){let a=i.getBoundingClientRect(),o=e.getBoundingClientRect(),l=a.top-o.top-t.rectTop,d=a.left-o.left-t.rectLeft;e.scrollTop+=l,e.scrollLeft+=d}}t.focusId&&(this.#S(t.focusId),s.focus({preventScroll:!0}))}}#$(t={}){if(!this.#w)return;let e=this.#et(t.anchorId||null),s=this.#i,r=c.#b,i=c.#v,a=c.#k,o=c.#C,l=this.#M==="horizontal";this.#R(this.#w),this.#F(this.#w,o,o);let d=this.#Q(this.#w),n=d.maxX+i+o,h=d.maxY+a+o;l&&([n,h]=[h,n]),this.#i=document.createElement("div"),this.#i.className="sm-visual",this.#i.setAttribute("tabindex","-1"),this.#i.appendChild(this.#st());let u=document.createElement("div");u.className="sm-visual-scroll";let m=document.createElementNS(r,"svg");m.setAttribute("viewBox",`0 0 ${n} ${h}`),m.setAttribute("width",String(n)),m.setAttribute("height",String(h)),m.setAttribute("role","img"),m.setAttribute("aria-label",`Site map${this.getAttribute("title")?": "+this.getAttribute("title"):""}`);let g=document.createElement("div");if(g.className="sm-visual-zoom",g.style.width=`${Math.round(n*this.#E)}px`,g.style.height=`${Math.round(h*this.#E)}px`,m.style.transform=`scale(${this.#E})`,m.style.transformOrigin="0 0",l){let y=document.createElementNS(r,"g");y.setAttribute("transform",`rotate(90 0 0) translate(0 -${h})`),this.#L(y,this.#w),this.#z(y,this.#w),m.appendChild(y)}else this.#L(m,this.#w),this.#z(m,this.#w);g.appendChild(m),u.appendChild(g),this.#i.appendChild(u);let p=document.createElement("div");p.className="sm-visual-summary";let b=Math.round(this.#E*100);p.textContent=`${this.#o} pages \xB7 ${this.#a} levels \xB7 ${b}%`,this.#i.appendChild(p);let v=this.#i,w=()=>{s&&s.isConnected?s.replaceWith(v):this.appendChild(v)};if(s?.isConnected&&"startViewTransition"in document&&!matchMedia("(prefers-reduced-motion: reduce)").matches){let y=`sm-vt-${++c.#tt}`;s.style.viewTransitionName=y,v.style.viewTransitionName=y;let _=document.startViewTransition(w);_.finished.finally(()=>{v.style.viewTransitionName=""}),_.updateCallbackDone.then(()=>this.#U(e))}else w(),this.#U(e);this.#ot(this.#i,m),this.listen(m,"click",y=>{let _=y.target,S=_.closest("[data-toggle]");if(S){let M=S.getAttribute("data-toggle");this.#K(M);return}let E=_.closest("[data-node-id]");E&&(this.#S(E.getAttribute("data-node-id")),this.dispatchEvent(new CustomEvent("site-map-wc:select",{bubbles:!0,detail:{href:E.getAttribute("data-href")||"",pageType:E.getAttribute("data-page-type")||"page",template:E.getAttribute("data-template")||""}})))}),m.setAttribute("tabindex","0"),m.setAttribute("role","tree"),m.setAttribute("aria-label",`Site map${this.getAttribute("title")?": "+this.getAttribute("title"):""} \u2014 use arrow keys to navigate`),m.addEventListener("keydown",y=>this.#it(y)),requestAnimationFrame(()=>{let y=m.querySelector("[data-node-id]");y&&this.#Y(y)})}#st(){let t=document.createElement("div");t.className="sm-vtoolbar",t.setAttribute("role","toolbar"),t.setAttribute("aria-label","Site map controls");let e=m=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${m}</svg>`,s=this.#N(e(c.#T.zoomIn),"Zoom in",()=>{this.#E=Math.min(3,this.#E+.25),this.#$()});t.appendChild(s);let r=this.#N(e(c.#T.zoomOut),"Zoom out",()=>{this.#E=Math.max(.25,this.#E-.25),this.#$()});t.appendChild(r);let i=this.#N(e(c.#T.reset),"Reset zoom",()=>{this.#E=1,this.#$()});t.appendChild(i);let a=document.createElement("span");a.className="sm-vtoolbar-sep",t.appendChild(a);let o=this.#M==="horizontal"?"Vertical":"Horizontal",l=this.#N(e(c.#T.flip),o,()=>{this.dataset.orientation=this.#M==="horizontal"?"vertical":"horizontal",this.#$()});t.appendChild(l),t.appendChild(a.cloneNode());let d=this.#H,n=document.createElement("label");n.className="sm-vtoolbar-detail",n.textContent="Detail ";let h=document.createElement("input");h.type="range",h.min="0",h.max="4",h.value=String(d),h.setAttribute("aria-label","Detail level"),h.className="sm-vtoolbar-slider",n.appendChild(h);let u=document.createElement("span");return u.className="sm-vtoolbar-detail-label",u.textContent=c.#O[d],n.appendChild(u),h.addEventListener("input",()=>{this.dataset.detail=h.value,u.textContent=c.#O[parseInt(h.value,10)],this.#$()}),t.appendChild(n),t}#N(t,e,s){let r=document.createElement("button");return r.type="button",r.className="sm-vtoolbar-btn",r.innerHTML=t,r.setAttribute("aria-label",e),r.setAttribute("title",e),r.addEventListener("click",s),r}#q=null;#V(t,e=""){let s=[];for(let r=0;r<t.length;r++){let i=t[r],a=e?`${e}-${r}`:String(r);s.push(a),i.children.length>0&&!i.collapsed&&s.push(...this.#V(i.children,a))}return s}#rt(t){let e=t.lastIndexOf("-");return e>0?t.slice(0,e):null}#nt(t){let e=this.#I(t,this.#w);return!e||e.collapsed||e.children.length===0?null:`${t}-0`}#S(t){if(!t||!this.#i)return;let e=this.#i.querySelector('svg[role="tree"]');if(!e)return;let s=e.querySelector(`[data-node-id="${t}"]`);if(!s)return;this.#Y(s),this.#q=t;let r=s.querySelector("rect"),i=this.#i?.querySelector(".sm-visual-scroll");if(r&&i){let a=r.getBoundingClientRect(),o=i.getBoundingClientRect();(a.left<o.left||a.right>o.right||a.top<o.top||a.bottom>o.bottom)&&r.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"})}}#Y(t){let e=t.closest("svg");if(!e)return;e.querySelectorAll(".sm-vfocus-ring").forEach(i=>i.remove()),e.querySelectorAll("[data-node-id]").forEach(i=>i.removeAttribute("aria-current"));let s=c.#b,r=t.querySelector("rect");if(r){let i=document.createElementNS(s,"rect");i.setAttribute("x",String(parseFloat(r.getAttribute("x"))-3)),i.setAttribute("y",String(parseFloat(r.getAttribute("y"))-3)),i.setAttribute("width",String(parseFloat(r.getAttribute("width"))+6)),i.setAttribute("height",String(parseFloat(r.getAttribute("height"))+6)),i.setAttribute("rx","11"),i.setAttribute("fill","none"),i.setAttribute("stroke","#3b82f6"),i.setAttribute("stroke-width","2"),i.setAttribute("class","sm-vfocus-ring"),t.parentNode.insertBefore(i,t)}t.setAttribute("aria-current","true"),this.#q=t.getAttribute("data-node-id")}#it(t){if(!this.#w)return;let e=this.#q||"0",s=!1;switch(t.key){case"ArrowDown":{s=!0;let r=this.#I(e,this.#w);r&&r.children.length>0&&!r.collapsed&&this.#S(`${e}-0`);break}case"ArrowUp":{s=!0;let r=this.#rt(e);r&&this.#S(r);break}case"ArrowRight":{s=!0;let r=this.#W(e,1);r&&this.#S(r);break}case"ArrowLeft":{s=!0;let r=this.#W(e,-1);r&&this.#S(r);break}case"Enter":case" ":{s=!0;let r=this.#I(e,this.#w);r&&r.children.length>0&&this.#K(e);break}case"Home":{s=!0,this.#S("0");break}case"End":{s=!0;let r=this.#V(this.#w);r.length&&this.#S(r[r.length-1]);break}}s&&(t.preventDefault(),t.stopPropagation())}#W(t,e){let s=t.split("-").map(Number),r=s[s.length-1]+e;if(r<0)return null;let i=s.length>1?s.slice(0,-1).join("-"):null,a=i?this.#I(i,this.#w):null,o=a?a.children:this.#w;if(!o||r>=o.length)return null;let l=[...s];return l[l.length-1]=r,l.join("-")}#X=!1;#at={dragging:!1,startX:0,startY:0,scrollLeft:0,scrollTop:0,moved:!1};#ot(t,e){if(e.style.cursor="grab",this.#X)return;this.#X=!0;let s=this.#at;this.listen(this,"pointerdown",r=>{if(r.target.closest("button, [data-toggle], .sm-vtoolbar, input"))return;let i=this.querySelector(".sm-visual-scroll");if(!i)return;s.dragging=!0,s.moved=!1,s.startX=r.clientX,s.startY=r.clientY,s.scrollLeft=i.scrollLeft,s.scrollTop=i.scrollTop;let a=this.querySelector('svg[role="tree"]');a&&(a.style.cursor="grabbing")}),this.listen(window,"pointermove",r=>{if(!s.dragging)return;let i=r.clientX-s.startX,a=r.clientY-s.startY;(Math.abs(i)>3||Math.abs(a)>3)&&(s.moved=!0);let o=this.querySelector(".sm-visual-scroll");o&&(o.scrollLeft=s.scrollLeft-i,o.scrollTop=s.scrollTop-a)}),this.listen(window,"pointerup",()=>{if(!s.dragging)return;s.dragging=!1;let r=this.querySelector('svg[role="tree"]');r&&(r.style.cursor="grab")}),this.listen(this,"click",r=>{s.moved&&(r.stopPropagation(),s.moved=!1)},{capture:!0})}#Q(t){let e=0,s=0;for(let r of t)if(r.x+c.#v>e&&(e=r.x+c.#v),r.y+c.#k>s&&(s=r.y+c.#k),r.children.length>0&&!r.collapsed){let i=this.#Q(r.children);i.maxX>e&&(e=i.maxX),i.maxY>s&&(s=i.maxY)}return{maxX:e,maxY:s}}#L(t,e){let s=c.#b,r=c.#v,i=c.#k,a=c.#_;for(let o of e){if(o.children.length===0||o.collapsed)continue;let l=o.x+r/2,d=o.y+i,n=d+a/2;for(let h of o.children){let u=h.x+r/2,m=h.y,g=document.createElementNS(s,"path");g.setAttribute("d",`M ${l} ${d} L ${l} ${n} L ${u} ${n} L ${u} ${m}`),g.setAttribute("fill","none"),g.setAttribute("stroke","#cbd5e1"),g.setAttribute("stroke-width","1.5"),t.appendChild(g)}this.#L(t,o.children)}}#z(t,e,s=""){let r=c.#b,i=c.#v,a=c.#k,o=this.#H,l=o>=4;for(let d=0;d<e.length;d++){let n=e[d],h=s?`${s}-${d}`:String(d),u=l?{stroke:"#94a3b8",fill:"#ffffff",text:"#475569"}:c.#P[n.pageType]||c.#P.page,m=document.createElementNS(r,"g");m.setAttribute("data-node-id",h),m.setAttribute("data-href",n.href),m.setAttribute("data-page-type",n.pageType),m.setAttribute("data-template",n.template),m.style.cursor="pointer";let g=document.createElementNS(r,"rect");if(g.setAttribute("x",String(n.x)),g.setAttribute("y",String(n.y)),g.setAttribute("width",String(i)),g.setAttribute("height",String(a)),g.setAttribute("rx","8"),g.setAttribute("fill",u.fill),g.setAttribute("stroke",u.stroke),g.setAttribute("stroke-width",l?"1":"2"),(l||n.pageType==="modal")&&g.setAttribute("stroke-dasharray","6 3"),m.appendChild(g),o>=1){let p=document.createElementNS(r,"text");p.setAttribute("x",String(n.x+i/2)),p.setAttribute("y",String(o===1?n.y+a/2+5:n.y+24)),p.setAttribute("text-anchor","middle"),p.setAttribute("font-size","13"),p.setAttribute("font-weight","600"),p.setAttribute("fill",u.text),p.setAttribute("font-family","system-ui, sans-serif"),p.textContent=n.label.length>18?n.label.slice(0,17)+"\u2026":n.label,m.appendChild(p)}if(o>=2){let p=document.createElementNS(r,"text");if(p.setAttribute("x",String(n.x+i/2)),p.setAttribute("y",String(n.y+40)),p.setAttribute("text-anchor","middle"),p.setAttribute("font-size","9"),p.setAttribute("font-weight","700"),p.setAttribute("fill",u.stroke),p.setAttribute("font-family","system-ui, sans-serif"),p.textContent=(Z[n.pageType]?.label||n.pageType).toUpperCase(),m.appendChild(p),n.template){let b=document.createElementNS(r,"text");b.setAttribute("x",String(n.x+i/2)),b.setAttribute("y",String(n.y+54)),b.setAttribute("text-anchor","middle"),b.setAttribute("font-size","9"),b.setAttribute("fill","#94a3b8"),b.setAttribute("font-family","system-ui, sans-serif"),b.textContent=n.template,m.appendChild(b)}}if(o>=3&&n.status&&c.#D[n.status]){let p=document.createElementNS(r,"circle");p.setAttribute("cx",String(n.x+i/2)),p.setAttribute("cy",String(n.y+a-8)),p.setAttribute("r","4"),p.setAttribute("fill",l?"#94a3b8":c.#D[n.status]),m.appendChild(p)}if(l)for(let p=0;p<2;p++){let b=document.createElementNS(r,"line");b.setAttribute("x1",String(n.x+12)),b.setAttribute("x2",String(n.x+i-12)),b.setAttribute("y1",String(n.y+a-22+p*8)),b.setAttribute("y2",String(n.y+a-22+p*8)),b.setAttribute("stroke","#cbd5e1"),b.setAttribute("stroke-width","1"),b.setAttribute("stroke-dasharray","3 2"),m.appendChild(b)}if(n.children.length>0){let p=document.createElementNS(r,"g");p.setAttribute("data-toggle",h),p.style.cursor="pointer";let b=document.createElementNS(r,"circle");b.setAttribute("cx",String(n.x+i/2)),b.setAttribute("cy",String(n.y+a+10)),b.setAttribute("r","10"),b.setAttribute("fill",l?"#fff":"#f1f5f9"),b.setAttribute("stroke","#cbd5e1"),b.setAttribute("stroke-width","1"),p.appendChild(b);let v=document.createElementNS(r,"text");v.setAttribute("x",String(n.x+i/2)),v.setAttribute("y",String(n.y+a+14)),v.setAttribute("text-anchor","middle"),v.setAttribute("font-size","11"),v.setAttribute("font-weight","700"),v.setAttribute("fill","#64748b"),v.setAttribute("font-family","system-ui, sans-serif"),v.textContent=n.collapsed?`+${n.childCount}`:"\u2212",p.appendChild(v),m.appendChild(p)}t.appendChild(m),n.children.length>0&&!n.collapsed&&this.#z(t,n.children,h)}}#K(t){let e=this.#I(t,this.#w);e&&(e.collapsed=!e.collapsed,this.#q||(this.#q=t),this.#$({anchorId:t}))}#I(t,e){if(!e)return null;let s=t.split("-").map(Number),r=e,i=null;for(let a of s){if(!r||a>=r.length)return null;i=r[a],r=i.children}return i}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();s.title&&!this.getAttribute("title")&&this.setAttribute("title",s.title),this._setPages(s.pages||[])}catch(e){console.warn(`[site-map-wc] Failed to load src="${t}":`,e)}}get pages(){let e=this.querySelector(":scope > nav")?.querySelector("ul");return e?this.#G(e):[]}set pages(t){this._setPages(Array.isArray(t)?t:[]),this.dispatchEvent(new CustomEvent("site-map-wc:pages-changed",{detail:{pages:this.pages,source:"property"},bubbles:!0}))}_setPages(t){for(;this.firstChild;)this.firstChild.remove();let e=document.createElement("nav"),s=document.createElement("ul");this.#J(s,t),e.appendChild(s),this.appendChild(e),this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}#G(t){let e=[];for(let s of t.querySelectorAll(":scope > li")){let r=s.querySelector(":scope > a"),i=s.querySelector(":scope > ul"),a={label:r?.textContent?.trim()||"",href:r?.getAttribute("href")||void 0,pageType:s.getAttribute("data-page-type")||void 0,template:s.getAttribute("data-template")||void 0,status:s.getAttribute("data-status")||void 0};i&&(a.children=this.#G(i)),e.push(a)}return e}#J(t,e){for(let s of e){let r=document.createElement("li");s.pageType&&r.setAttribute("data-page-type",s.pageType),s.template&&r.setAttribute("data-template",s.template),s.status&&r.setAttribute("data-status",s.status);let i=document.createElement("a");if(i.href=s.href||"#",i.textContent=s.label||"",r.appendChild(i),s.children&&s.children.length>0){let a=document.createElement("ul");this.#J(a,s.children),r.appendChild(a)}t.appendChild(r)}}};x("site-map-wc",Et);var F=`
:host {
  --_bg:        var(--adr-wc-bg, var(--color-surface, #ffffff));
  --_text:      var(--adr-wc-text, var(--color-text, #1a1a1a));
  --_muted:     var(--adr-wc-muted, var(--color-text-muted, #666));
  --_border:    var(--adr-wc-border, var(--color-border, #e0e0e0));
  --_accent:    var(--adr-wc-accent, var(--color-interactive, #0066cc));
  --_card-bg:   var(--adr-wc-card-bg, var(--color-surface-raised, #f8f9fa));
  --_highlight: var(--adr-wc-highlight, color-mix(in srgb, var(--_accent) 8%, transparent));
  --_radius:    var(--adr-wc-radius, var(--radius-l, 0.75rem));
  --_shadow:       var(--adr-wc-shadow, var(--shadow-sm));
  --_shadow-hover: var(--adr-wc-shadow-hover, var(--shadow-md));
  --_duration:     var(--adr-wc-duration, var(--duration-normal, 200ms));
  --_ease:         var(--adr-wc-ease, var(--ease-default, ease));
  --_space-2xs:    var(--adr-wc-space-2xs, var(--size-2xs, 0.25rem));
  --_space-xs:     var(--adr-wc-space-xs, var(--size-xs, 0.5rem));
  --_space-s:      var(--adr-wc-space-s, var(--size-s, 0.75rem));
  --_space-m:      var(--adr-wc-space-m, var(--size-m, 1rem));
  --_font-xs:      var(--adr-wc-font-xs, var(--font-size-xs, 0.75rem));
  --_font-sm:      var(--adr-wc-font-sm, var(--font-size-sm, 0.875rem));
  --_font-md:      var(--adr-wc-font-md, var(--font-size-md, 1rem));
  --_font-lg:      var(--adr-wc-font-lg, var(--font-size-lg, 1.125rem));
  --_font-mono:    var(--adr-wc-font-mono, var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace));
  --_radius-s:     var(--adr-wc-radius-s, var(--radius-s, 0.25rem));
  --_radius-full:  var(--adr-wc-radius-full, var(--radius-full, 9999px));

  display: block;
  font-family: var(--adr-wc-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
}

*, *::before, *::after { box-sizing: border-box; margin: 0; }

/* \u2500\u2500 Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-card {
  background: var(--_bg);
  border: 1px solid var(--_border);
  border-radius: var(--_radius);
  overflow: hidden;
  box-shadow: var(--_shadow);
  transition: box-shadow var(--_duration) var(--_ease);
}

.adr-card:hover {
  box-shadow: var(--_shadow-hover);
}

/* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--_space-s) var(--_space-m);
  background: var(--_card-bg);
  border-block-end: 1px solid var(--_border);
  gap: var(--_space-s);
  flex-wrap: wrap;
}

.adr-meta {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  flex-wrap: wrap;
  min-width: 0;
}

.adr-id {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  font-family: var(--_font-mono);
}

/* \u2500\u2500 Status badge \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-badges {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
}

.adr-status {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: var(--_radius-full);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* \u2500\u2500 Date (slotted <time>) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-date-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--_font-xs);
  color: var(--_muted);
}

.adr-date-wrap svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

::slotted([slot="date"]) {
  font-size: var(--_font-xs);
  font-family: var(--_font-mono);
  color: var(--_muted);
}

/* \u2500\u2500 Body \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-body {
  padding: 16px 20px;
}

/* \u2500\u2500 Title (slotted heading) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-title-wrap {
  margin-block-end: 0;
}

::slotted([slot="title"]) {
  font-size: var(--_font-lg) !important;
  font-weight: 700 !important;
  color: var(--_text) !important;
  line-height: 1.4 !important;
  margin: 0 !important;
}

/* Fallback title when no slot content */
.adr-title-fallback {
  font-size: var(--_font-lg);
  font-weight: 700;
  color: var(--_text);
  line-height: 1.4;
}

/* \u2500\u2500 Supersedes / Superseded-by links \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-block-start: var(--_space-s);
}

.adr-links-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--_muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-inline-end: var(--_space-2xs);
  align-self: center;
}

.adr-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--_radius-s);
  background: var(--_highlight);
  color: var(--_accent);
  text-decoration: none;
}

.adr-link:hover {
  text-decoration: underline;
}

.adr-link svg {
  width: 11px;
  height: 11px;
}

/* \u2500\u2500 Sections \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-sections {
  border-block-start: 1px solid var(--_border);
}

.adr-section {
  padding: 14px 20px;
  border-block-end: 1px solid var(--_border);
}

.adr-section:last-child {
  border-block-end: none;
}

.adr-section-header {
  display: flex;
  align-items: center;
  gap: var(--_space-xs);
  margin-block-end: var(--_space-s);
}

.adr-section-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.adr-section-icon svg {
  width: 13px;
  height: 13px;
  fill: var(--color-text-inverted, #fff);
}

.adr-section-icon.context      { background: var(--color-accent,  #8b5cf6); }
.adr-section-icon.decision     { background: var(--color-success, #22c55e); }
.adr-section-icon.consequences { background: var(--color-warning, #f59e0b); }

.adr-section-title {
  font-size: var(--_font-xs);
  font-weight: 600;
  color: var(--_muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.adr-section-content {
  color: var(--_text);
  font-size: var(--_font-sm);
  line-height: 1.6;
}

.adr-section-content ::slotted(ul),
.adr-section-content ::slotted(ol) {
  margin: 0;
  padding-inline-start: 20px;
}

.adr-section-content ::slotted(p) {
  margin: 0;
}

.slot-fallback {
  color: var(--_muted);
  font-style: italic;
}

/* \u2500\u2500 Minimal detail \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-card--minimal {
  padding: var(--_space-xs);
  cursor: pointer;
}

.adr-card--minimal:hover {
  box-shadow: var(--_shadow-hover);
}

.adr-card--minimal:focus-visible {
  outline: 2px solid var(--_accent);
  outline-offset: 2px;
}

.adr-card--minimal .adr-header { display: none; }
.adr-card--minimal .adr-sections { display: none; }
.adr-card--minimal .adr-links { display: none; }
.adr-card--minimal .adr-date-wrap { display: none; }

.adr-card--minimal .adr-body {
  padding: var(--_space-xs) var(--_space-s);
}

.adr-card--minimal .adr-title-fallback,
.adr-card--minimal ::slotted([slot="title"]) {
  font-size: var(--_font-sm) !important;
  font-weight: 600 !important;
}

.adr-card--minimal .adr-id {
  display: block;
  margin-block-end: var(--_space-2xs);
}

.adr-card--minimal .adr-status {
  font-size: 10px;
  padding: 2px 6px;
}

/* \u2500\u2500 Compact detail \u2014 hide empty sections \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.adr-card--compact .adr-section[data-empty] {
  display: none;
}

.adr-card--compact .slot-fallback {
  display: none;
}

.adr-card--compact .adr-body {
  padding: var(--_space-s) var(--_space-m);
}

/* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
@media (max-width: 480px) {
  .adr-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .adr-badges {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .adr-card {
    transition: none;
  }
}

@media print {
  .adr-card {
    box-shadow: none;
    break-inside: avoid;
  }
}

.state-msg        { padding: var(--_space-m); font-size: var(--_font-sm); color: var(--_muted); font-style: italic; }
.state-msg--error { color: var(--color-error-text, var(--color-error, #dc2626)); }
`;var Bt={proposed:{label:"Proposed",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},accepted:{label:"Accepted",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"},deprecated:{label:"Deprecated",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},superseded:{label:"Superseded",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"}},D={calendar:'<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',context:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',decision:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',consequences:'<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',arrowRight:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'},St=class extends HTMLElement{static get observedAttributes(){return["adr-id","status","supersedes","superseded-by","detail","compact","src"]}#s=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#t(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#s.set(e,t.textContent.trim())}}connectedCallback(){this.#t(),this.adrId&&!this.id&&(this.id=this.adrId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#e(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,s){e!==s&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(s):this.#e())}get adrId(){return this.getAttribute("adr-id")||""}get status(){return this.getAttribute("status")||"proposed"}get adrTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#s.get("title")||""}get adrDate(){let t=this.querySelector('[slot="date"]');return t?.getAttribute("datetime")||t?.textContent?.trim()||this.#s.get("date")||""}get supersedes(){let t=this.getAttribute("supersedes")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get supersededBy(){let t=this.getAttribute("superseded-by")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}get _minimalLabel(){return this.adrTitle||this.adrId||"ADR"}get data(){return{adrId:this.adrId||void 0,status:this.status,detail:this.getAttribute("detail")||void 0,supersedes:this.supersedes.length?this.supersedes:void 0,supersededBy:this.supersededBy.length?this.supersededBy:void 0,title:this.adrTitle||void 0,date:this.adrDate||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.#t(),this.shadowRoot&&this.#e(),this.dispatchEvent(new CustomEvent("adr-wc:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){if(t.adrId!=null&&this.setAttribute("adr-id",String(t.adrId)),t.status!=null&&this.setAttribute("status",String(t.status)),t.detail!=null&&this.setAttribute("detail",String(t.detail)),t.supersedes&&this.setAttribute("supersedes",Array.isArray(t.supersedes)?t.supersedes.join(","):t.supersedes),t.supersededBy&&this.setAttribute("superseded-by",Array.isArray(t.supersededBy)?t.supersededBy.join(","):t.supersededBy),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=t.title,this.appendChild(e)}if(t.date&&!this.querySelector('[slot="date"]')){let e=document.createElement("time");e.slot="date",e.setAttribute("datetime",t.date),e.textContent=new Date(t.date).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"}),this.appendChild(e)}for(let e of["context","decision"])if(t[e]&&!this.querySelector(`[slot="${e}"]`)){let s=document.createElement("p");s.slot=e,s.textContent=t[e],this.appendChild(s)}if(t.consequences&&!this.querySelector('[slot="consequences"]')){let e=document.createElement("ul");e.slot="consequences";let s=Array.isArray(t.consequences)?t.consequences:[t.consequences];for(let r of s){let i=document.createElement("li");i.textContent=r,e.appendChild(i)}this.appendChild(e)}}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${F}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this._applyData(s),this.#t(),this.#e()}catch(e){this.shadowRoot.innerHTML=`<style>${F}</style><div class="state-msg state-msg--error">Could not load: ${f(e.message)}</div>`}}}#e(){let t=Bt[this.status]||Bt.proposed,e=this._detailLevel,s=this.adrId?`ADR: ${f(this.adrId)}`:"Architectural Decision Record",r=!!this.querySelector('[slot="date"]')||this.#s.has("date");if(e==="minimal"){this.shadowRoot.innerHTML=`<style>${F}</style>
        <article class="adr-card adr-card--minimal" role="article" aria-label="${s}"
          tabindex="0">
          <div class="adr-body">
            <div class="adr-meta">
              ${this.adrId?`<span class="adr-id">${f(this.adrId)}</span>`:""}
              <span class="adr-status" style="color:${t.color};background:${t.bg}">${f(t.label)}</span>
            </div>
            <div class="adr-title-wrap">
              <slot name="title"><span class="adr-title-fallback">${f(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;return}if(this.shadowRoot.innerHTML=`<style>${F}</style>
      <article class="adr-card adr-card--${e}" role="article" aria-label="${s}">

        <header class="adr-header">
          <div class="adr-meta">
            ${this.adrId?`<span class="adr-id">${f(this.adrId)}</span>`:""}
            ${r?`<span class="adr-date-wrap">${A(D.calendar)} <slot name="date"></slot></span>`:""}
          </div>
          <div class="adr-badges">
            <span class="adr-status" style="color:${t.color};background:${t.bg}">${f(t.label)}</span>
          </div>
        </header>

        <div class="adr-body">
          <div class="adr-title-wrap">
            <slot name="title"><span class="adr-title-fallback">[Untitled ADR]</span></slot>
          </div>

          ${this.supersedes.length?`
            <div class="adr-links">
              <span class="adr-links-label">Supersedes</span>
              ${this.supersedes.map(i=>`<a class="adr-link" href="#${f(i)}">${A(D.arrowRight)} ${f(i)}</a>`).join("")}
            </div>`:""}

          ${this.supersededBy.length?`
            <div class="adr-links">
              <span class="adr-links-label">Superseded by</span>
              ${this.supersededBy.map(i=>`<a class="adr-link" href="#${f(i)}">${A(D.arrowRight)} ${f(i)}</a>`).join("")}
            </div>`:""}
        </div>

        <div class="adr-sections">
          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon context">${A(D.context)}</div>
              <span class="adr-section-title">Context</span>
            </div>
            <div class="adr-section-content">
              <slot name="context"><em class="slot-fallback">No context provided.</em></slot>
            </div>
          </div>

          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon decision">${A(D.decision)}</div>
              <span class="adr-section-title">Decision</span>
            </div>
            <div class="adr-section-content">
              <slot name="decision"><em class="slot-fallback">No decision recorded.</em></slot>
            </div>
          </div>

          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon consequences">${A(D.consequences)}</div>
              <span class="adr-section-title">Consequences</span>
            </div>
            <div class="adr-section-content">
              <slot name="consequences"><em class="slot-fallback">No consequences documented.</em></slot>
            </div>
          </div>
        </div>

      </article>`,e==="compact")for(let i of this.shadowRoot.querySelectorAll(".adr-section")){let a=i.querySelector("slot");a&&a.assignedNodes().length===0&&i.setAttribute("data-empty","")}this.dispatchEvent(new CustomEvent("adr-wc:ready",{detail:{adrId:this.adrId,title:this.adrTitle,status:this.status},bubbles:!0,composed:!0}))}};x("adr-wc",St);var $t=class c extends C{static get observedAttributes(){return["src","title","compact"]}#s=null;#t=null;#e=null;#i=0;#r=[];setup(){let t=this.querySelector(":scope > ol");if(!t)return!1;let e=this.#n(t);if(e.length===0)return!1;this.#r=e,t.style.display="none",t.setAttribute("aria-hidden","true");let s=this.getAttribute("title");s&&(this.#t=document.createElement("h2"),this.#t.className="fd-title",this.#t.textContent=s,this.insertBefore(this.#t,t)),this.#s=document.createElement("div"),this.#s.className="fd-container",this.#s.setAttribute("role","img"),this.#s.setAttribute("aria-label",`Flow diagram${s?": "+s:""}`),this.#i=0,this.#c(e,this.#s);let r=document.createElement("div");r.className="fd-summary",r.textContent=`${this.#i} step${this.#i!==1?"s":""}`,this.#s.appendChild(r),this.insertBefore(this.#s,t),this.#e=document.createElement("div"),this.#e.className="fd-live",this.#e.setAttribute("role","status"),this.#e.setAttribute("aria-live","polite"),this.#e.setAttribute("aria-atomic","true"),this.appendChild(this.#e),this.listen(this.#s,"click",i=>{let a=i.target.closest(".fd-node-shape");if(!a)return;let l=a.closest(".fd-node")?.dataset.type||"action",d=a.textContent?.trim()||"";this.#m(`Selected: ${d}`),this.dispatchEvent(new CustomEvent("flow-diagram:select",{bubbles:!0,detail:{type:l,text:d}}))}),this.dispatchEvent(new CustomEvent("flow-diagram:ready",{bubbles:!0,detail:{nodeCount:this.#i}}))}teardown(){this.#t&&(this.#t.remove(),this.#t=null),this.#s&&(this.#s.remove(),this.#s=null),this.#e&&(this.#e.remove(),this.#e=null);let t=this.querySelector("ol");t&&(t.style.display="",t.removeAttribute("aria-hidden")),this.#i=0}static#o=0;attributeChangedCallback(t,e,s){e===s||!this.isConnected||(t==="src"?this._loadSrc(s):this.hasAttribute("data-upgraded")&&this.#a())}#a(){let t=()=>{this.teardown(),this.removeAttribute("data-upgraded"),this.setup()};if(this.hasAttribute("data-upgraded")&&"startViewTransition"in document&&!matchMedia("(prefers-reduced-motion: reduce)").matches){let e=`fd-vt-${++c.#o}`;this.style.viewTransitionName=e,document.startViewTransition(t).finished.finally(()=>{this.style.viewTransitionName=""})}else t()}get steps(){return this.#r}set steps(t){let e=Array.isArray(t)?t:[];this.#r=e,this.#t&&(this.#t.remove(),this.#t=null),this.#s&&(this.#s.remove(),this.#s=null),this.#e&&(this.#e.remove(),this.#e=null);let s=this.querySelector(":scope > ol");if(s||(s=document.createElement("ol"),s.style.display="none",s.setAttribute("aria-hidden","true"),this.appendChild(s)),e.length===0){this.dispatchEvent(new CustomEvent("flow-diagram:steps-changed",{detail:{steps:e,source:"property"},bubbles:!0}));return}let r=this.getAttribute("title");r&&(this.#t=document.createElement("h2"),this.#t.className="fd-title",this.#t.textContent=r,this.insertBefore(this.#t,s)),this.#s=document.createElement("div"),this.#s.className="fd-container",this.#s.setAttribute("role","img"),this.#s.setAttribute("aria-label",`Flow diagram${r?": "+r:""}`),this.#i=0,this.#c(e,this.#s);let i=document.createElement("div");i.className="fd-summary",i.textContent=`${this.#i} step${this.#i!==1?"s":""}`,this.#s.appendChild(i),this.insertBefore(this.#s,s),this.#e=document.createElement("div"),this.#e.className="fd-live",this.#e.setAttribute("role","status"),this.#e.setAttribute("aria-live","polite"),this.#e.setAttribute("aria-atomic","true"),this.appendChild(this.#e),this.dispatchEvent(new CustomEvent("flow-diagram:steps-changed",{detail:{steps:e,source:"property"},bubbles:!0}))}#n(t){let e=[];for(let s of t.querySelectorAll(":scope > li")){let r=this.#l(s);r&&e.push(r)}return e}#l(t){let e=t.dataset.type||"action",s=t.dataset.annotation||"",r=[],i=t.querySelectorAll(":scope > ol > li[data-branch]");if(i.length>0)for(let o of i){let l=o.dataset.branch||"",d=o.querySelector(":scope > ol"),n=d?this.#n(d):[];r.push({label:l,steps:n})}let a="";for(let o of t.childNodes)(o.nodeType===Node.TEXT_NODE||o.nodeType===Node.ELEMENT_NODE&&o.tagName!=="OL")&&(a+=o.textContent);return a=a.trim(),{type:e,text:a,annotation:s,branches:r}}#c(t,e){for(let s=0;s<t.length;s++){let r=t[s];s>0&&e.appendChild(this.#h());let i=this.#p(r);if(e.appendChild(i),r.branches.length>0){let a=document.createElement("div");a.className="fd-branches",a.setAttribute("data-branch-count",String(r.branches.length));let o=document.createElement("div");o.className="fd-split-line",o.setAttribute("aria-hidden","true"),a.appendChild(o);let l=document.createElement("div");l.className="fd-branch-columns";let d=(50/r.branches.length).toFixed(2);l.style.setProperty("--fd-inset",`${d}%`);for(let n of r.branches){let h=document.createElement("div");h.className="fd-branch",h.appendChild(this.#h());let u=document.createElement("span");u.className="fd-branch-label",u.textContent=n.label,u.setAttribute("data-branch",n.label.toLowerCase()),h.appendChild(u),this.#c(n.steps,h),l.appendChild(h)}a.appendChild(l),e.appendChild(a)}}}#p(t){this.#i++;let e=document.createElement("div");e.className="fd-node",e.dataset.type=t.type;let s=document.createElement("div");if(s.className="fd-node-shape",s.setAttribute("tabindex","0"),s.setAttribute("role","img"),s.setAttribute("aria-label",`${t.type}: ${t.text}`),s.textContent=t.text,e.appendChild(s),t.annotation){let r=document.createElement("div");r.className="fd-annotation",r.textContent=t.annotation,e.appendChild(r)}return e}#h(t){let e=document.createElement("div");e.className="fd-connector",e.setAttribute("aria-hidden","true");let s=document.createElement("div");if(s.className="fd-connector-line",e.appendChild(s),t){let i=document.createElement("span");i.className="fd-connector-label",i.textContent=t,e.appendChild(i)}let r=document.createElement("div");return r.className="fd-connector-arrow",e.appendChild(r),e}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();s.title&&this.setAttribute("title",s.title);let r=document.createElement("ol");this.#u(s.steps||[],r),this.appendChild(r),this.#a()}catch(e){console.warn(`[flow-diagram] Failed to load src="${t}":`,e)}}#u(t,e){for(let s of t){let r=document.createElement("li");if(s.type&&(r.dataset.type=s.type),s.annotation&&(r.dataset.annotation=s.annotation),r.textContent=s.text||"",s.branches&&s.branches.length>0){let i=document.createElement("ol");for(let a of s.branches){let o=document.createElement("li");o.dataset.branch=a.label||"";let l=document.createElement("ol");this.#u(a.steps||[],l),o.appendChild(l),i.appendChild(o)}r.appendChild(i)}e.appendChild(r)}}#m(t){this.#e&&(this.#e.textContent="",requestAnimationFrame(()=>{this.#e&&(this.#e.textContent=t)}))}};x("flow-diagram",$t);function $(c,t,e){return c.getPropertyValue(t).trim()||e}function q(c,t){if(!t)return t;let e=document.createElement("span");e.style.color=t,e.style.position="absolute",e.style.visibility="hidden",e.style.pointerEvents="none",(c.parentElement||document.body).appendChild(e);let s=getComputedStyle(e).color;if(e.remove(),!s)return t;let r=q._canvas||(q._canvas=document.createElement("canvas"));r.width=r.height=1;let i=q._ctx||(q._ctx=r.getContext("2d",{willReadFrequently:!0}));i.clearRect(0,0,1,1),i.fillStyle=s,i.fillRect(0,0,1,1);let[a,o,l,d]=i.getImageData(0,0,1,1).data;return d===255?`rgb(${a},${o},${l})`:`rgba(${a},${o},${l},${(d/255).toFixed(3)})`}function oe(c){let t=getComputedStyle(c),e=q(c,$(t,"--color-text","#1a1a1a")),s=q(c,$(t,"--color-surface","#ffffff")),r=q(c,$(t,"--color-surface-raised",$(t,"--color-surface","#ffffff"))),i=q(c,$(t,"--color-border","#e0e0e0")),a=q(c,$(t,"--color-primary",$(t,"--color-interactive","#3b82f6"))),o=q(c,$(t,"--color-secondary",$(t,"--color-surface-raised","#f8f9fa"))),l=q(c,$(t,"--color-accent",$(t,"--color-primary","#3b82f6"))),d=q(c,$(t,"--color-text-muted",$(t,"--color-text","#1a1a1a"))),n=$(t,"--font-sans",'system-ui, -apple-system, "Segoe UI", sans-serif'),h=$(t,"--font-size-md","14px"),u=[a,l,o],m={};for(let p=0;p<12;p++)m[`cScale${p}`]=u[p%u.length],m[`cScaleLabel${p}`]=e,m[`cScalePeer${p}`]=i,m[`cScaleInv${p}`]=s;let g={};for(let p=0;p<8;p++)g[`git${p}`]=u[p%u.length],g[`gitInv${p}`]=s,g[`gitBranchLabel${p}`]=e;return{primaryColor:a,primaryBorderColor:i,primaryTextColor:e,nodeTextColor:e,secondaryColor:o,secondaryBorderColor:i,secondaryTextColor:e,tertiaryColor:l,tertiaryBorderColor:i,tertiaryTextColor:e,background:s,mainBkg:s,secondBkg:r,tertiaryBkg:r,lineColor:i,nodeBorder:i,gridColor:i,defaultLinkColor:d,clusterBkg:r,clusterBorder:i,actorBkg:s,actorBorder:i,actorTextColor:e,actorLineColor:i,signalColor:e,signalTextColor:e,labelBoxBkgColor:r,labelBoxBorderColor:i,labelTextColor:e,loopTextColor:e,noteBkgColor:r,noteBorderColor:i,noteTextColor:e,edgeLabelBackground:s,titleColor:e,fontFamily:n,fontSize:h,...m,...g}}function Ft(c,t={}){return{startOnLoad:!1,securityLevel:"strict",suppressErrorRendering:!0,theme:t.themeBase||"base",themeVariables:oe(c)}}var ne="https://cdn.jsdelivr.net/npm/mermaid@11.14.0/dist/mermaid.esm.min.mjs",Ht=new Map;function le(c){let t=c||typeof window<"u"&&window.VB_MERMAID_URL||ne,e=Ht.get(t);return e||(e=import(t).then(s=>s.default||s),Ht.set(t,e)),e}var qt=class c extends C{static#s=0;static#t=0;#e=null;#i=null;#r=null;#o=null;#a=null;#n=!1;setup(){this.hasAttribute("type")||this.setAttribute("type","mermaid");let t=this.getAttribute("min-height");t&&(this.style.minBlockSize=t);let e=this.querySelector(":scope > pre");e&&(this.#i=document.createElement("template"),this.#i.appendChild(e.cloneNode(!0)),this.#e=this.#u(e),this.setAttribute("data-rendering",""));let s=this.querySelector(":scope > .dwc-figure");s&&(this.#r=s,this.#n=!0,this.removeAttribute("data-rendering")),this.listen(window,"vb:theme-change",()=>{this.#a&&clearTimeout(this.#a),this.#a=setTimeout(()=>{this.#n&&this.#c()},50)});let r=this.getAttribute("src");r?this.#m(r).then(()=>this.#l()):this.#e&&this.#l()}teardown(){if(this.#o&&(this.#o.disconnect(),this.#o=null),this.#a&&(clearTimeout(this.#a),this.#a=null),this.#r&&(this.#r.remove(),this.#r=null),this.#i){let t=this.#i.content.firstElementChild;t&&!this.querySelector(":scope > pre")&&this.appendChild(t.cloneNode(!0))}this.#n=!1}#l(){if(this.getAttribute("loading")!=="lazy"){this.#c();return}if(!("IntersectionObserver"in window)){this.#c();return}this.#o=new IntersectionObserver(t=>{for(let e of t)if(e.isIntersecting){this.#o?.disconnect(),this.#o=null,this.#c();break}},{rootMargin:"200px"}),this.#o.observe(this)}async#c(){if(!this.#e)return;let t=this.getAttribute("type")||"mermaid";if(t!=="mermaid"){this.#h(new Error(`Unsupported diagram type "${t}". v1 supports "mermaid" only.`));return}try{let e=await le(this.dataset.mermaidSrc),s=Ft(this,{themeBase:this.dataset.themeBase||"base"});e.initialize(s);let r=`diagram-wc-${++c.#s}`,{svg:i}=await e.render(r,this.#e);this.#p(i),this.#n=!0,this.removeAttribute("data-rendering"),this.removeAttribute("data-error"),this.querySelector(":scope > .dwc-error")?.remove(),this.dispatchEvent(new CustomEvent("diagram-wc:ready",{bubbles:!0,detail:{svg:i,type:t,source:this.#e}}))}catch(e){this.removeAttribute("data-rendering"),this.#n||this.setAttribute("data-error",""),this.#h(e)}}#p(t){let e=document.createElement("figure");e.className="dwc-figure",e.setAttribute("role","img");let s=this.getAttribute("caption")||`${this.getAttribute("type")||"diagram"} diagram`;e.setAttribute("aria-label",s),e.innerHTML=t;let r=this.getAttribute("caption");if(r){let o=document.createElement("figcaption");o.className="dwc-caption",o.textContent=r,e.appendChild(o)}let i=this.#r,a=()=>{i&&i.isConnected?i.replaceWith(e):this.appendChild(e),this.querySelector(":scope > pre")?.remove(),this.#r=e};if(i?.isConnected&&"startViewTransition"in document&&!matchMedia("(prefers-reduced-motion: reduce)").matches){let o=`dwc-vt-${++c.#t}`;i.style.viewTransitionName=o,e.style.viewTransitionName=o,document.startViewTransition(a).finished.finally(()=>{e.style.viewTransitionName=""})}else a()}#h(t){if(!this.#n){if(!this.querySelector(":scope > pre")&&this.#i){let r=this.#i.content.firstElementChild;r&&this.appendChild(r.cloneNode(!0))}this.#r&&(this.#r.remove(),this.#r=null)}this.querySelector(":scope > .dwc-error")?.remove();let e=document.createElement("p");e.className="dwc-error",e.setAttribute("role","status");let s=(t.message||String(t)).split(`
`)[0].slice(0,240);e.textContent=`Diagram syntax error: ${s}`,this.appendChild(e),this.dispatchEvent(new CustomEvent("diagram-wc:error",{bubbles:!0,detail:{error:t,source:this.#e,type:this.getAttribute("type")}}))}#u(t){let e=t.querySelector("code");return(e?e.textContent:t.textContent)||""}async#m(t){try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);this.#e=await e.text()}catch(e){this.#h(e)}}get source(){return this.#e||""}set source(t){let e=String(t||"");e!==this.#e&&(this.#e=e,this.#r&&(this.#r.remove(),this.#r=null),this.querySelector(":scope > .dwc-error")?.remove(),this.dispatchEvent(new CustomEvent("diagram-wc:source-changed",{bubbles:!0,detail:{source:e}})),this.#c())}get svg(){return this.#r?.querySelector("svg")?.outerHTML||""}};x("diagram-wc",qt);
//# sourceMappingURL=ux-planning.full.js.map
