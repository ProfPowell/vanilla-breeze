var pe=window.matchMedia("(prefers-reduced-motion: reduce)");var St=new Map;function x(c,t,e={}){let r=e.priority??10,s={impl:t,bundle:e.bundle,contract:e.contract,priority:r},a=St.get(c);if(customElements.get(c)){if(!a||a.priority>=r){a&&a.priority===r&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${c}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${c}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=r){a.priority===r&&console.warn(`[VB Bundle] Tag <${c}> already registered by "${a.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}St.set(c,s),customElements.define(c,t)}var C=class extends HTMLElement{#e=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#e)t();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,r,s){t.addEventListener(e,r,s),this.#e.push(()=>t.removeEventListener(e,r,s))}setup(){}teardown(){}setState(t,e){this.#t||(this.#t=this.attachInternals());let r=this.#t.states;try{e?r.add(t):r.delete(t)}catch{let s=`--${t}`;e?r.add(s):r.delete(s)}}_adoptInternals(t){this.#t||(this.#t=t)}};var J=class c extends C{#e=null;#t=null;#r=!1;#i=null;setup(){this.setAttribute("role","list"),this.#r=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.#o(),this.#n(),this.#f(),this.#s()}teardown(){this.#e&&(this.#e.remove(),this.#e=null),c.#_?.source===this&&(c.#_=null)}get draggableChildren(){return[...this.querySelectorAll(':scope > [draggable="true"]')]}get group(){return this.getAttribute("group")||null}get orientation(){return this.getAttribute("orientation")||"vertical"}get sortedOrder(){return this.draggableChildren.map(t=>t.dataset.id)}#s(){for(let t of this.draggableChildren)t.getAttribute("role")||t.setAttribute("role","listitem"),t.hasAttribute("tabindex")||t.setAttribute("tabindex","0"),t.hasAttribute("aria-grabbed")||t.setAttribute("aria-grabbed","false")}#o(){this.#e=document.createElement("div"),this.#e.setAttribute("role","status"),this.#e.setAttribute("aria-live","polite"),this.#e.setAttribute("aria-atomic","true"),this.#e.style.cssText="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);",this.prepend(this.#e)}#a(t){let e=this.#e;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#n(){this.listen(this,"pointerdown",t=>{this.#i=t.target}),this.listen(this,"dragstart",this.#c.bind(this)),this.listen(this,"dragover",this.#d.bind(this)),this.listen(this,"dragleave",this.#b.bind(this)),this.listen(this,"drop",this.#m.bind(this)),this.listen(this,"dragend",this.#u.bind(this))}#c(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let r=e.querySelector("[data-drag-handle]");if(r&&!r.contains(this.#i)){t.preventDefault();return}e.setAttribute("data-dragging",""),t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",e.dataset.id||""),t.dataTransfer.setData("application/x-drag-surface-group",this.group||"");let s=this.#g(e);c.#_={item:e,source:this,originalIndex:s},this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}#d(t){let e=c.#_;if(!e||(this.group||e.source.group)&&this.group!==e.source.group)return;t.preventDefault(),t.dataTransfer.dropEffect="move",this.setAttribute("data-drag-over","");let r=this.orientation==="horizontal"?t.clientX:t.clientY;this.#w(r)}#b(t){t.relatedTarget&&!this.contains(t.relatedTarget)&&(this.removeAttribute("data-drag-over"),this.#A())}#m(t){t.preventDefault(),this.removeAttribute("data-drag-over"),this.#A();let e=c.#_;if(!e)return;let{item:r,source:s,originalIndex:a}=e,i=this.orientation==="horizontal"?t.clientX:t.clientY,o=this.#k(i);if(s===this){this.#p(r,o),this.#x();let n=this.#g(r);this.#l(r),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:r,itemId:r.dataset.id,oldIndex:a,newIndex:n,order:this.sortedOrder}}))}else this.#p(r,o),this.#x(),s.#x(),this.#l(r),this.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:r,itemId:r.dataset.id,fromSurface:s,toSurface:this,newIndex:this.#g(r),fromOrder:s.sortedOrder,toOrder:this.sortedOrder}}))}#u(){let t=c.#_;t?.item&&t.item.removeAttribute("data-dragging"),this.removeAttribute("data-drag-over"),this.#A(),c.#_=null,this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0}))}#f(){this.listen(this,"keydown",this.#v.bind(this))}#v(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let r=e.getAttribute("aria-grabbed")==="true",s=this.orientation==="horizontal",a=s?"ArrowLeft":"ArrowUp",i=s?"ArrowRight":"ArrowDown";if(t.key===" "||t.key==="Enter"){if(t.preventDefault(),r){e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#x(),this.#l(e);let l=this.#g(e),d=this.draggableChildren;this.#a(`${this.#y(e)}, dropped at position ${l+1} of ${d.length}`),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,oldIndex:this.#t,newIndex:l,order:this.sortedOrder}})),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#t=null}else{this.#t=this.#g(e),e.setAttribute("aria-grabbed","true"),this.setAttribute("data-reorder-mode","");let l=this.draggableChildren;this.#a(`${this.#y(e)}, grabbed. Position ${this.#t+1} of ${l.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`),this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}return}if(!r&&(t.key===a||t.key===i)){t.preventDefault();let l=this.draggableChildren,d=l.indexOf(e),p=t.key===a?Math.max(0,d-1):Math.min(l.length-1,d+1);p!==d&&l[p].focus();return}if(r&&(t.key===a||t.key===i)){t.preventDefault();let l=this.draggableChildren,d=l.indexOf(e),p=t.key===a?Math.max(0,d-1):Math.min(l.length-1,d+1);p!==d&&(this.#p(e,p),e.focus(),this.#a(`Position ${p+1} of ${l.length}`));return}let o=s?"ArrowUp":"ArrowLeft",n=s?"ArrowDown":"ArrowRight";if(r&&(t.key===o||t.key===n)){if(t.preventDefault(),!this.group)return;let l=t.key===n?1:-1,d=this.#h(l);if(!d)return;d.appendChild(e),d.#x(),this.#x(),d.#l(e),e.focus();let p=d.getAttribute("aria-label")||"next surface";d.#a(`Moved to ${p}`),d.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,fromSurface:this,toSurface:d,newIndex:d.draggableChildren.indexOf(e),fromOrder:this.sortedOrder,toOrder:d.sortedOrder}})),this.removeAttribute("data-reorder-mode"),d.setAttribute("data-reorder-mode",""),this.#t=null;return}if(r&&t.key==="Escape"){t.preventDefault(),e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#t!=null&&(this.#p(e,this.#t),e.focus()),this.#a("Reorder cancelled"),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#t=null;return}!r&&t.key==="Escape"&&(t.preventDefault(),e.blur())}#l(t){t.setAttribute("data-just-dropped",""),t.addEventListener("animationend",()=>{t.removeAttribute("data-just-dropped")},{once:!0}),setTimeout(()=>t.removeAttribute("data-just-dropped"),500)}#h(t){if(!this.group)return null;let e=[...document.querySelectorAll(`drag-surface[group="${this.group}"]`)];if(e.length<2)return null;e.sort((a,i)=>{let o=a.getBoundingClientRect(),n=i.getBoundingClientRect();return o.left-n.left||o.top-n.top});let r=e.indexOf(this);return e[r+t]||null}#y(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#g(t){return this.draggableChildren.indexOf(t)}#p(t,e){let s=this.draggableChildren.filter(a=>a!==t)[e]||null;s?this.insertBefore(t,s):this.appendChild(t)}#x(){this.draggableChildren.forEach((t,e)=>{t.dataset.sortOrder=String(e+1)})}#k(t){let e=this.orientation==="horizontal",r=this.draggableChildren.filter(s=>!s.hasAttribute("data-dragging"));for(let s=0;s<r.length;s++){let a=r[s].getBoundingClientRect(),i=e?a.left+a.width/2:a.top+a.height/2;if(t<i)return s}return r.length}#w(t){this.#A();let e=this.orientation==="horizontal",r=this.draggableChildren.filter(s=>!s.hasAttribute("data-dragging"));for(let s=0;s<r.length;s++){let a=r[s].getBoundingClientRect(),i=e?a.left+a.width/2:a.top+a.height/2;if(t<i){r[s].setAttribute("data-drop-target","before");return}}r.length>0&&r[r.length-1].setAttribute("data-drop-target","after")}#A(){for(let t of this.querySelectorAll("[data-drop-target]"))t.removeAttribute("data-drop-target")}static#_=null};x("drag-surface",J);var $t=`
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
`;function h(c){return String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function z(c){return c.split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2)}function L(c){let t=0;for(let r=0;r<c.length;r++)t=c.charCodeAt(r)+((t<<5)-t);return`hsl(${(t%360+360)%360}, 65%, 55%)`}function A(c){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c}</svg>`}var k={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',mapPin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>'},Z={says:{label:"Says",icon:k.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:k.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:k.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:k.heart,color:"#ef4444"}},q={delighted:{emoji:"\u{1F604}",score:.95,color:"#16a34a"},satisfied:{emoji:"\u{1F60A}",score:.8,color:"#22c55e"},hopeful:{emoji:"\u{1F642}",score:.68,color:"#84cc16"},curious:{emoji:"\u{1F914}",score:.55,color:"#eab308"},neutral:{emoji:"\u{1F610}",score:.5,color:"#94a3b8"},uncertain:{emoji:"\u{1F615}",score:.4,color:"#f97316"},confused:{emoji:"\u{1F635}",score:.3,color:"#fb923c"},frustrated:{emoji:"\u{1F624}",score:.18,color:"#ef4444"},angry:{emoji:"\u{1F620}",score:.05,color:"#dc2626"}};var Ft="https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait",B=[32,64,128,256,512];function Bt(c){let t=0;for(let e=0;e<c.length;e++)t=c.charCodeAt(e)+((t<<5)-t);return t}function Ht(c){let t=B[0],e=Math.abs(c-t);for(let r=1;r<B.length;r++){let s=Math.abs(c-B[r]);s<e&&(t=B[r],e=s)}return t}function qt(c,t=128){let e=Bt(String(c)),r=(e%100+100)%100,s=(e>>>16&1)===0?"female":"male",a=Ht(t);return`${Ft}/${s}/${a}/${r}.jpg`}function tt(c){let t=0;for(let e=0;e<c.length;e++)t=c.charCodeAt(e)+((t<<5)-t);return t}var Ut=["Sarah Chen","Marcus Johnson","Aisha Patel","James O'Brien","Yuki Tanaka","Elena Rodriguez","David Kim","Fatima Al-Hassan","Lucas Silva","Priya Sharma","Noah Williams","Mei Lin","Carlos Mendez","Amara Osei","Henrik Larsson","Zara Ahmed"],Vt=["Product Manager","UX Designer","Frontend Developer","Data Analyst","Marketing Lead","QA Engineer","DevOps Lead","Content Strategist","Startup Founder","IT Director","Customer Success Lead","Research Scientist"],Qt=["San Francisco, CA","Austin, TX","London, UK","Toronto, CA","Berlin, DE","Tokyo, JP","Sydney, AU","S\xE3o Paulo, BR"],Xt=["I need tools that help me stay organized without slowing me down.","The dashboard is where I live \u2014 it has to be fast and reliable.","I want to understand the data, not fight the interface.","If it takes more than two clicks, I\u2019ll find another way.","Collaboration shouldn\u2019t mean endless notification noise.","I just want it to work the way I expect it to.","Give me the big picture first, then let me drill into details.","Accessibility isn\u2019t a nice-to-have \u2014 it\u2019s how I use the web."],Yt=["Streamline daily workflows","Reduce context-switching","Stay aligned with the team","Make data-driven decisions quickly","Ship features on a predictable cadence","Automate repetitive tasks","Improve onboarding experience","Keep documentation up to date"],Kt=["Too many disconnected tools","Slow page loads break focus","Unclear ownership of tasks","Settings that reset unexpectedly","Notifications that bury important updates","Poor mobile experience","Inconsistent design across features","No offline support"],Wt=["Checks dashboards every morning","Prefers keyboard shortcuts over mouse","Skims docs, reads deeply only when stuck","Shares screenshots in Slack","Batches email to twice a day","Tests features in incognito first","Bookmarks frequently used reports","Uses dark mode exclusively"],et=class extends HTMLElement{static get observedAttributes(){return["role","age","location","avatar","compact","src","data-list-stories","id"]}#e=new Map;#t=null;constructor(){super(),this.attachShadow({mode:"open"})}relatedStories(){if(!this.id)return[];let t=this.getRootNode(),e=t.querySelectorAll?t:document;return Array.from(e.querySelectorAll(`user-story[persona-id="${Gt(this.id)}"]`))}#r(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&!this.getAttribute(e)&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}get data(){return{name:this.personaName,role:this.personaRole||void 0,age:this.age||void 0,location:this.location||void 0,avatar:this.avatar||void 0,quote:this.quote||void 0,bio:this.#e.get("bio")||void 0,goals:this.#e.get("goals")||void 0,frustrations:this.#e.get("frustrations")||void 0,behaviors:this.#e.get("behaviors")||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.shadowRoot&&this.#n(),this.dispatchEvent(new CustomEvent("user-persona:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let e of["role","age","location","avatar"])t[e]&&this.setAttribute(e,String(t[e]));if(t.name&&!this.querySelector('[slot="name"]')){let e=document.createElement("h2");e.slot="name",e.textContent=String(t.name),this.appendChild(e)}if(t.quote&&!this.querySelector('[slot="quote"]')){let e=document.createElement("p");e.slot="quote",e.textContent=String(t.quote),this.appendChild(e)}for(let e of["bio","goals","frustrations","behaviors"])t[e]&&this.#e.set(e,String(t[e]))}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();this._applyData(r),this.#n()}catch(e){console.warn(`[user-persona] Failed to load src="${t}":`,e)}}connectedCallback(){this.#r(),this.hasAttribute("data-mock")?this.#a():this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#n(),this.#i(),this.setAttribute("data-upgraded",""),this.dispatchEvent(new CustomEvent("persona-ready",{bubbles:!0,composed:!0,detail:{name:this.personaName,role:this.personaRole}}))}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t?.disconnect(),this.#t=null}#i(){if(!this.hasAttribute("data-list-stories")||!this.id){this.#t?.disconnect(),this.#t=null;return}this.#t||(this.#t=new MutationObserver(()=>this.#s()),this.#t.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["persona-id"]}))}#s(){if(!this.shadowRoot)return;let t=this.shadowRoot.querySelector("[data-stories-section]");t&&(t.outerHTML=this.#o())}#o(){if(!this.hasAttribute("data-list-stories")||!this.id)return"";let t=this.relatedStories();return`
      <section class="section" part="section-stories" data-stories-section>
        <div class="section-header">
          <div class="section-icon stories" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          </div>
          <span class="section-title">Stories <span class="section-count">${t.length}</span></span>
        </div>
        <div class="section-content">
          ${t.length===0?'<p class="empty-stories">No user stories reference this persona yet.</p>':`<ul class="story-list">${t.map(e=>{let r=e.id||e.getAttribute("story-id")||"",s=e.querySelector('[slot="action"]')?.textContent?.trim()||e.getAttribute("action")||e.id||"untitled",a=e.getAttribute("priority")||"",i=e.getAttribute("status")||"";return`<li class="story-item" data-priority="${h(a)}" data-status="${h(i)}">${r?`<a href="#${h(r)}">${h(s)}</a>`:`<span>${h(s)}</span>`}${a?`<span class="story-meta">${h(a)}</span>`:""}${i?`<span class="story-meta">${h(i)}</span>`:""}</li>`}).join("")}</ul>`}
        </div>
      </section>
    `}attributeChangedCallback(t,e,r){if(!(e===r||!this.shadowRoot)){if(t==="src"&&this.isConnected){this._loadSrc(r);return}(t==="data-list-stories"||t==="id")&&this.#i(),this.#n()}}get personaName(){return this.querySelector('[slot="name"]')?.textContent?.trim()||this.#e.get("name")||"Unnamed Persona"}get personaRole(){return this.getAttribute("role")||""}get age(){return this.getAttribute("age")||""}get location(){return this.getAttribute("location")||""}get avatar(){return this.getAttribute("avatar")||""}get quote(){return this.querySelector('[slot="quote"]')?.textContent?.trim()||this.#e.get("quote")||""}get compact(){return this.hasAttribute("compact")}#a(){let t=this.dataset.seed||this.dataset.mock||String(Date.now()),e=a=>a[(tt(t+a.length)%a.length+a.length)%a.length],r=(a,i)=>{let o=[];for(let n=0;n<i;n++)o.push(a[(tt(t+n+a.length)%a.length+a.length)%a.length]);return[...new Set(o)]};if(!this.querySelector('[slot="name"]')){let a=document.createElement("h2");a.slot="name",a.textContent=e(Ut),this.appendChild(a)}if(this.getAttribute("role")||this.setAttribute("role",e(Vt)),this.getAttribute("age")||this.setAttribute("age",String(25+(tt(t)%30+30)%30)),this.getAttribute("location")||this.setAttribute("location",e(Qt)),!this.getAttribute("avatar")){let a=this.querySelector('[slot="name"]')?.textContent?.trim()||"Persona";this.setAttribute("avatar",qt(a,256))}if(!this.querySelector('[slot="quote"]')){let a=document.createElement("p");a.slot="quote",a.textContent=e(Xt),this.appendChild(a)}let s=(a,i)=>{if(this.querySelector(`[slot="${a}"]`))return;let o=document.createElement("ul");o.setAttribute("slot",a);for(let n of i){let l=document.createElement("li");l.textContent=n,o.appendChild(l)}this.appendChild(o)};s("goals",r(Yt,3)),s("frustrations",r(Kt,3)),s("behaviors",r(Wt,3))}#n(){let t=this.personaName,e=this.personaRole,r=this.age,s=this.location,a=this.avatar,i=this.quote,o=L(t),n=a?`background:url(${h(a)}) center/cover`:`background:${o}`;this.shadowRoot.innerHTML=`
      <style>${$t}</style>

      <article class="persona-card" part="card" role="article"
        aria-label="User persona: ${h(t)}">

        <header class="persona-header" part="header">
          <div class="avatar" part="avatar" style="${n}"
            role="img" aria-label="Avatar for ${h(t)}">
            ${a?"":h(z(t))}
          </div>
          <div class="header-info">
            <div class="persona-name-wrap" part="name">
              <slot name="name"><h2 class="persona-name-fallback">${h(t)}</h2></slot>
            </div>
            ${e?`<p class="persona-role" part="role">${h(e)}</p>`:""}
            <div class="persona-meta" part="meta">
              ${r?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  ${h(r)} years old
                </span>
              `:""}
              ${s?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  ${h(s)}
                </span>
              `:""}
            </div>
          </div>
        </header>

        ${i||this.querySelector('[slot="quote"]')?`
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="quote-text-wrap"><slot name="quote"><p class="quote-text">${h(i)}</p></slot></div>
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
    `}};function Gt(c){return typeof CSS<"u"&&CSS.escape?CSS.escape(String(c)):String(c).replace(/["\\]/g,"\\$&")}x("user-persona",et);var rt=`
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
`;var st=class c extends HTMLElement{static get observedAttributes(){return["persona-id","priority","points","status","epic","story-id","compact","detail","src"]}static PRIORITIES={critical:{label:"Critical",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"},high:{label:"High",color:"#ea580c",bg:"rgba(234, 88, 12, 0.1)"},medium:{label:"Medium",color:"#ca8a04",bg:"rgba(202, 138, 4, 0.1)"},low:{label:"Low",color:"#16a34a",bg:"rgba(22, 163, 74, 0.1)"}};static STATUSES={backlog:{label:"Backlog",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"},"to-do":{label:"To Do",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},"in-progress":{label:"In Progress",color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.1)"},review:{label:"Review",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},done:{label:"Done",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"}};#e=new Map;#t=null;constructor(){super(),this.attachShadow({mode:"open"})}#r(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}get data(){return{storyId:this.storyId||void 0,personaId:this.personaId||void 0,priority:this.priority,status:this.status,points:this.points||void 0,epic:this.epic||void 0,detail:this.getAttribute("detail")||void 0,persona:this.persona||void 0,action:this.action||void 0,benefit:this.benefit||void 0,title:this.storyTitle||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.#r(),this.shadowRoot&&this.#n(),this.dispatchEvent(new CustomEvent("user-story:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let[e,r]of[["storyId","story-id"],["personaId","persona-id"],["priority","priority"],["status","status"],["points","points"],["epic","epic"],["detail","detail"]])t[e]!=null&&this.setAttribute(r,String(t[e]));if(t.persona&&!this.querySelector('[slot="persona"]')){let e=document.createElement("span");e.slot="persona",e.textContent=String(t.persona),this.appendChild(e)}if(t.action&&!this.querySelector('[slot="action"]')){let e=document.createElement("span");e.slot="action",e.textContent=String(t.action),this.appendChild(e)}if(t.benefit&&!this.querySelector('[slot="benefit"]')){let e=document.createElement("span");e.slot="benefit",e.textContent=String(t.benefit),this.appendChild(e)}if(t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=String(t.title),this.appendChild(e)}for(let e of["acceptance-criteria","tasks","notes"]){let r=e==="acceptance-criteria"?"acceptanceCriteria":e;if(t[r]&&!this.querySelector(`[slot="${e}"]`))if(Array.isArray(t[r])){let s=document.createElement("ul");s.slot=e;for(let a of t[r]){let i=document.createElement("li");i.textContent=String(a),s.appendChild(i)}this.appendChild(s)}else{let s=document.createElement("p");s.slot=e,s.textContent=String(t[r]),this.appendChild(s)}}}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();this._applyData(r),this.#r(),this.#n()}catch(e){console.warn(`[user-story] Failed to load src="${t}":`,e)}}connectedCallback(){this.#r(),this.storyId&&!this.id&&(this.id=this.storyId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#n(),this.#i(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t?.disconnect(),this.#t=null}attributeChangedCallback(t,e,r){e!==r&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(r):(this.#n(),t==="persona-id"&&this.#i()))}#i(){if(this.#t?.disconnect(),this.#t=null,!this.personaId||this.#s())return;let t=this.getRootNode(),r=(t&&typeof t.getElementById=="function"?t:document).getElementById(this.personaId);!r||r.tagName!=="USER-PERSONA"||(this.#t=new MutationObserver(()=>this.#n()),this.#t.observe(r,{attributes:!0,attributeFilter:["role"]}))}get persona(){return this.#s()||this.#o()||"user"}get personaId(){return this.getAttribute("persona-id")||""}#s(){return this.querySelector('[slot="persona"]')?.textContent?.trim()||this.#e.get("persona")||""}#o(){if(!this.personaId)return"";let t=this.getRootNode(),r=(t&&typeof t.getElementById=="function"?t:document).getElementById(this.personaId);return!r||r.tagName!=="USER-PERSONA"?"":r.getAttribute("role")?.trim()||""}#a(){return/^[aeio]/i.test(this.persona.trim())?"an":"a"}get action(){return this.querySelector('[slot="action"]')?.textContent?.trim()||this.#e.get("action")||""}get benefit(){return this.querySelector('[slot="benefit"]')?.textContent?.trim()||this.#e.get("benefit")||""}get priority(){return this.getAttribute("priority")||"medium"}get points(){return this.getAttribute("points")||""}get status(){return this.getAttribute("status")||"backlog"}get epic(){return this.getAttribute("epic")||""}get storyId(){return this.getAttribute("story-id")||""}get storyTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#e.get("title")||""}get _minimalLabel(){if(this.storyTitle)return this.storyTitle;let t=this.action;return t.length>40?t.slice(0,40)+"\u2026":t}get compact(){return this.hasAttribute("compact")}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}updateStatus(t){c.STATUSES[t]&&(this.setAttribute("status",t),this.dispatchEvent(new CustomEvent("status-changed",{detail:{status:t,storyId:this.storyId},bubbles:!0,composed:!0})))}updatePriority(t){c.PRIORITIES[t]&&(this.setAttribute("priority",t),this.dispatchEvent(new CustomEvent("priority-changed",{detail:{priority:t,storyId:this.storyId},bubbles:!0,composed:!0})))}showDetail(){let t=`story-dialog-${this.storyId||this.id||"detail"}`,e=document.getElementById(t);e||(e=document.createElement("dialog"),e.id=t,e.setAttribute("data-size","l"),document.body.appendChild(e));let r=document.createElement("form");r.method="dialog";let s=document.createElement("header"),a=document.createElement("h3");a.textContent=this.storyTitle||this.storyId||"Story Detail";let i=document.createElement("button");i.type="submit",i.setAttribute("aria-label","Close"),i.textContent="\xD7",s.appendChild(a),s.appendChild(i);let o=document.createElement("section"),n=document.createElement("user-story");for(let d of this.getAttributeNames())d==="detail"||d==="compact"||d==="data-upgraded"||d==="draggable"||d==="data-id"||d==="data-quadrant"||n.setAttribute(d,this.getAttribute(d)??"");let l=[...this.children].some(d=>d.getAttribute("slot")&&d.tagName!=="DIALOG");n.setAttribute("detail",l?"full":"compact"),n.removeAttribute("id");for(let d of[...this.children])d.tagName!=="DIALOG"&&n.appendChild(d.cloneNode(!0));o.appendChild(n),r.appendChild(s),r.appendChild(o),e.innerHTML="",e.appendChild(r),e.addEventListener("close",()=>{e.innerHTML=""},{once:!0}),e.showModal()}#n(){let t=c.PRIORITIES[this.priority]||c.PRIORITIES.medium,e=c.STATUSES[this.status]||c.STATUSES.backlog,r=this._detailLevel,s=this.storyId?`User story: ${h(this.storyId)}`:"User story";if(this.shadowRoot){if(r==="minimal"){this.shadowRoot.innerHTML=`
        <style>${rt}</style>
        <article class="story-card story-card--minimal" role="article" aria-label="${s}"
          tabindex="0">
          <div class="story-body">
            ${this.storyId?`<span class="story-id">${h(this.storyId)}</span>`:""}
            <div class="story-title-wrap">
              <slot name="title"><span class="story-title-fallback">${h(this._minimalLabel||"[describe the action]")}</span></slot>
            </div>
          </div>
        </article>
      `;let a=this.shadowRoot.querySelector(".story-card--minimal");if(!a)return;a.addEventListener("click",()=>this.showDetail()),a.addEventListener("keydown",i=>{let o=i;(o.key==="Enter"||o.key===" ")&&(o.preventDefault(),this.showDetail())})}else this.shadowRoot.innerHTML=`
        <style>${rt}</style>

        <article class="story-card story-card--${r}" part="card" role="article" aria-label="${s}">
          <header class="story-header" part="header">
            <div class="story-meta">
              ${this.storyId?`<span class="story-id" part="id">${h(this.storyId)}</span>`:""}
              ${this.epic?`<span class="epic-badge" part="epic">${h(this.epic)}</span>`:""}
            </div>
            <div class="story-badges">
              <span class="priority-badge" part="priority"
                style="color: ${t.color}; background: ${t.bg};"
              >${h(t.label)}</span>
              <span class="status-badge" part="status"
                style="color: ${e.color}; background: ${e.bg};"
              >${h(e.label)}</span>
              ${this.points?`<span class="points-badge" part="points">${h(this.points)}</span>`:""}
            </div>
          </header>

          <div class="story-body" part="body">
            <p class="story-statement" part="statement">
              <span class="keyword">As ${this.#a()}</span>
              ${this.personaId?`<a class="persona-text persona-text--link" href="#${h(this.personaId)}">${A(k.user)} <slot name="persona"><span>${h(this.#o()||"user")}</span></slot></a>`:'<span class="persona-text"><slot name="persona"><span>user</span></slot></span>'},
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
      `,r==="compact"&&this.shadowRoot.querySelectorAll(".section").forEach(i=>{let o=i.querySelector("slot");o&&o.assignedNodes().length===0&&i.setAttribute("data-empty","")});this.dispatchEvent(new CustomEvent("story-ready",{detail:{id:this.storyId,persona:this.persona,action:this.action,benefit:this.benefit,priority:this.priority,status:this.status,points:this.points},bubbles:!0,composed:!0}))}}};x("user-story",st);var H=`
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
`;var Jt=0;function S(c,t,e="vb-vt"){if(!c?.isConnected||typeof document>"u"||!("startViewTransition"in document)||matchMedia("(prefers-reduced-motion: reduce)").matches)return t(),null;let r=`${e}-${++Jt}`;c.style.viewTransitionName=r;let s=document.startViewTransition(t);return s.finished.finally(()=>{c.style.viewTransitionName===r&&(c.style.viewTransitionName="")}),s}var Zt=[{key:"actions",label:"Actions"},{key:"thoughts",label:"Thoughts"},{key:"touchpoints",label:"Touchpoints"},{key:"painPoints",label:"Pain Points"},{key:"opportunities",label:"Opportunities"}],at=class extends HTMLElement{static get observedAttributes(){return["src","persona","persona-id","story-ids","compact"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__phases=null}get phases(){return this.__phases}set phases(t){this.__phases!==t&&(this.__phases=t,this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("user-journey:phases-changed",{detail:{phases:t,source:"property"},bubbles:!0,composed:!0})))}get data(){return{persona:this.getAttribute("persona")||void 0,personaId:this.getAttribute("persona-id")||void 0,title:this.querySelector('[slot="title"]')?.textContent?.trim()||void 0,summary:this.querySelector('[slot="summary"]')?.textContent?.trim()||void 0,phases:this.__phases||void 0}}set data(t){if(!(!t||typeof t!="object")){if(t.persona&&this.setAttribute("persona",String(t.persona)),t.personaId&&this.setAttribute("persona-id",String(t.personaId)),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h2");e.slot="title",e.textContent=t.title,this.appendChild(e)}if(t.summary&&!this.querySelector('[slot="summary"]')){let e=document.createElement("p");e.slot="summary",e.textContent=t.summary,this.appendChild(e)}t.phases!=null&&(this.__phases=t.phases),this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("user-journey:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0}))}}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}async _loadSrc(t){if(!t)return;let e=this.shadowRoot;e.innerHTML=`<style>${H}</style><div class="state-msg">Loading\u2026</div>`;try{let r=await fetch(t);if(!r.ok)throw new Error(`HTTP ${r.status}`);let s=await r.json();if(s.persona&&this.setAttribute("persona",s.persona),s.personaId&&this.setAttribute("persona-id",s.personaId),s.title&&!this.querySelector('[slot="title"]')){let a=document.createElement("h2");a.slot="title",a.textContent=s.title,this.appendChild(a)}if(s.summary&&!this.querySelector('[slot="summary"]')){let a=document.createElement("p");a.slot="summary",a.textContent=s.summary,this.appendChild(a)}this.__phases=s.phases||[],this._render()}catch(r){e.innerHTML=`<style>${H}</style><div class="state-msg state-msg--error">Could not load journey: ${h(r.message)}</div>`}}_render(){let t=this._resolve("persona")||"",e=this._resolve("persona-id")||"",r=(this.getAttribute("story-ids")||"").split(",").map(p=>p.trim()).filter(Boolean),s=this.hasAttribute("compact"),a=this.__phases,i=!!this.querySelector('[slot="summary"]')||this.#e.has("summary"),o=this.querySelector('[slot="title"]')?.textContent?.trim()||this.#e.get("title")||"",n=`<style>${H}</style>
      <article class="journey${s?" journey--compact":""}">

        <header class="journey__header">
          <div class="journey__header-top">
            <div class="journey__chips">
              <span class="chip chip--type">Journey Map</span>
              ${r.map(p=>`<a class="chip chip--story" href="#${p}">${this._label(p)}</a>`).join("")}
            </div>
            ${t?`
              <div class="journey__persona">
                ${e?`<a class="persona-ref" href="#${e}">${A(k.user)} ${h(t)}</a>`:`<span class="persona-ref">${A(k.user)} ${h(t)}</span>`}
              </div>`:""}
          </div>
          <div class="journey__title-wrap">
            <slot name="title"><h2 class="journey__title">User Journey</h2></slot>
          </div>
          ${i?'<div class="journey__summary-wrap"><slot name="summary"></slot></div>':""}
        </header>

        ${a&&a.length?this._curve(a)+this._grid(a):`<div class="journey__placeholder">
               <p>Add phase data via <code>src</code> (JSON) or set <code>.phases</code> programmatically.</p>
             </div>`}

      </article>`,l=this.shadowRoot,d=()=>{l.innerHTML=n};l.querySelector("article")?S(this,d,"uj-vt"):d(),this.dispatchEvent(new CustomEvent("journey-ready",{bubbles:!0,composed:!0,detail:{title:o,persona:t,phaseCount:a?a.length:0}}))}_curve(t){let n=t.length,l=g=>28+(n<2?944/2:g/(n-1)*944),d=g=>14+(1-(q[g.emotion]||q.neutral).score)*72,p=t.map((g,v)=>({x:l(v),y:d(g),ph:g})),u=`M ${p[0].x},${p[0].y}`;for(let g=1;g<p.length;g++){let v=p[g-1],y=p[g],_=(v.x+y.x)/2;u+=` C ${_},${v.y} ${_},${y.y} ${y.x},${y.y}`}let m=`uj-${Math.random().toString(36).slice(2,8)}`,f=p.at(-1);return`
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
          ${p.map(({x:g})=>`<line x1="${g}" y1="0" x2="${g}" y2="100" class="vline"/>`).join("")}
          <path d="${u} L ${f.x},100 L ${p[0].x},100 Z" fill="url(#${m})"/>
          <path d="${u}" fill="none" class="curve-line"/>
          ${p.map(({x:g,y:v,ph:y})=>{let _=q[y.emotion]||q.neutral;return`<circle cx="${g}" cy="${v}" r="5" class="dot" style="fill:${_.color}"/>`}).join("")}
        </svg>
      </div>`}_grid(t){let e=t.map((s,a)=>{let i=q[s.emotion]||q.neutral,o=s.storyIds||[];return`
        <th class="phase-head" data-emotion="${s.emotion||"neutral"}"
            style="--ec:${i.color}">
          <span class="ph-num">${a+1}</span>
          <span class="ph-name">${h(s.name||"")}</span>
          <span class="ph-emoji" title="${s.emotion||"neutral"}"><span role="img" aria-label="${h(s.emotion||"neutral")}">${i.emoji}</span></span>
          ${o.length?`<div class="ph-stories">${o.map(n=>`<a class="chip chip--story" href="#${n}">${this._label(n)}</a>`).join("")}</div>`:""}
        </th>`}).join(""),r=Zt.map(({key:s,label:a})=>{let i=t.map(o=>{let n=o[s]||[];return n.length?`<td class="data-cell data-cell--${s.toLowerCase()}">
          ${n.map(l=>`<p>${h(l)}</p>`).join("")}
        </td>`:'<td class="data-cell data-cell--empty">\u2014</td>'}).join("");return`
        <tr class="grid-row grid-row--${s.toLowerCase()}">
          <th class="row-label">${a}</th>
          ${i}
        </tr>`}).join("");return`
      <div class="journey__grid-wrap">
        <table class="journey__grid"
               aria-label="${h(this.getAttribute("title")||"User Journey")} \u2014 phase breakdown">
          <thead>
            <tr>
              <th class="corner">Stage</th>
              ${e}
            </tr>
          </thead>
          <tbody>${r}</tbody>
        </table>
      </div>`}_label(t){return t.replace(/^(activity|persona|journey|story|user)-/,"").replace(/-/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("user-journey",at);var U=`
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
`;var it=["says","thinks","does","feels"],ot=class extends HTMLElement{static get observedAttributes(){return["persona","persona-id","src","editable","compact"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__quadrants=null,this.__goals=null,this.__painPoints=null,this._editingQuadrants=new Set}get quadrants(){return this.__quadrants}set quadrants(t){this.__quadrants=t,this.isConnected&&this._render()}get goals(){return this.__goals}set goals(t){this.__goals=t,this.isConnected&&this._render()}get painPoints(){return this.__painPoints}set painPoints(t){this.__painPoints=t,this.isConnected&&this._render()}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}get data(){let t=this.querySelector('[slot="title"]'),e=this.querySelector('[slot="summary"]');return{persona:this.getAttribute("persona")||void 0,personaId:this.getAttribute("persona-id")||void 0,title:t?.textContent?.trim()||void 0,summary:e?.textContent?.trim()||void 0,quadrants:this.__quadrants||void 0,goals:this.__goals||void 0,painPoints:this.__painPoints||void 0}}set data(t){if(!(!t||typeof t!="object")){if(t.persona&&this.setAttribute("persona",String(t.persona)),t.personaId&&this.setAttribute("persona-id",String(t.personaId)),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h2");e.slot="title",e.textContent=t.title,this.appendChild(e)}if(t.summary&&!this.querySelector('[slot="summary"]')){let e=document.createElement("p");e.slot="summary",e.textContent=t.summary,this.appendChild(e)}t.quadrants!=null&&(this.__quadrants=t.quadrants),t.goals!=null&&(this.__goals=t.goals),t.painPoints!=null&&(this.__painPoints=t.painPoints),this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("empathy-map:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0}))}}editQuadrant(t){it.includes(t)&&this.hasAttribute("editable")&&this._openEdit(t)}closeQuadrant(t){it.includes(t)&&this._closeEdit(t)}async _loadSrc(t){if(!(!t||!this.shadowRoot)){this.shadowRoot.innerHTML=`<style>${U}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();if(r.persona&&this.setAttribute("persona",r.persona),r.personaId&&this.setAttribute("persona-id",r.personaId),r.title&&!this.querySelector('[slot="title"]')){let s=document.createElement("h2");s.slot="title",s.textContent=r.title,this.appendChild(s)}if(r.summary&&!this.querySelector('[slot="summary"]')){let s=document.createElement("p");s.slot="summary",s.textContent=r.summary,this.appendChild(s)}this.__quadrants=r.quadrants||null,this.__goals=r.goals||null,this.__painPoints=r.painPoints||null,this._render()}catch(e){if(!this.shadowRoot)return;let r=e instanceof Error?e.message:String(e);this.shadowRoot.innerHTML=`<style>${U}</style><div class="state-msg state-msg--error">Could not load empathy map: ${h(r)}</div>`}}}_render(){let t=this._resolve("persona")||"",e=this._resolve("persona-id")||"",r=this.hasAttribute("compact"),s=this.hasAttribute("editable"),a=!!this.querySelector('[slot="title"]')||this.#e.has("title"),i=!!this.querySelector('[slot="summary"]')||this.#e.has("summary"),o=this.__goals?.length||this.querySelector('[slot="goals"]'),n=this.__painPoints?.length||this.querySelector('[slot="pain-points"]'),l=`<style>${U}</style>
      <article class="empathy-map${r?" empathy-map--compact":""}">

        <header class="empathy-map__header">
          <div class="empathy-map__header-top">
            <div class="empathy-map__chips">
              <span class="chip chip--type">Empathy Map</span>
            </div>
            ${t?`
              <div class="empathy-map__persona">
                ${e?`<a class="persona-ref" href="#${h(e)}">${A(k.user)} ${h(t)}</a>`:`<span class="persona-ref">${A(k.user)} ${h(t)}</span>`}
              </div>`:""}
          </div>
          <div class="empathy-map__title-wrap">
            <slot name="title"><h2 class="empathy-map__title">Empathy Map</h2></slot>
          </div>
          ${i?'<div class="empathy-map__summary-wrap"><slot name="summary"></slot></div>':""}
        </header>

        <div class="empathy-map__grid">
          ${it.map(p=>this._renderQuadrant(p,s)).join("")}
        </div>

        ${o||n?`
          <footer class="empathy-map__footer">
            ${this._renderSummaryRow("goals",A(k.target),"Goals")}
            ${this._renderSummaryRow("pain-points",A(k.alertTriangle),"Pain Points")}
          </footer>
        `:""}

      </article>`,d=()=>{this.shadowRoot&&(this.shadowRoot.innerHTML=l,s&&this._bindEditListeners())};this.shadowRoot?.querySelector("article")?S(this,d,"em-vt"):d(),this.dispatchEvent(new CustomEvent("empathy-map:ready",{bubbles:!0,composed:!0,detail:{title:this.querySelector('[slot="title"]')?.textContent?.trim()||"Empathy Map",persona:t}}))}_renderQuadrant(t,e){let r=Z[t],s=this.__quadrants?.[t],a=this._editingQuadrants.has(t),i=s&&s.length?t==="feels"?s.map(n=>this._renderEmotion(n)).join(""):s.map(n=>`<p>${h(n)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">Add ${r.label.toLowerCase()} items\u2026</p></slot>`,o=s?.length?s.join(`
`):"";return`
      <section class="quadrant quadrant--${t}"${a?" data-editing":""}>
        <div class="quadrant__inner">
          <div class="quadrant__header">
            <div class="quadrant__icon" aria-hidden="true">${A(r.icon)}</div>
            <span class="quadrant__label">${r.label}</span>
            ${e?`<button class="quadrant__edit-btn" data-quadrant="${t}"
              aria-label="Edit ${r.label}" title="Edit ${r.label}">${A(k.pencil)}</button>`:""}
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
                  aria-label="Edit ${r.label} items">${h(o)}</textarea>
                <button class="quadrant__done-btn" data-quadrant="${t}"
                  aria-label="Done editing ${r.label}">${A(k.check)} Done</button>
              </div>
            `:""}
          </div>
        </div>
      </section>`}_renderEmotion(t){let e=t.toLowerCase().trim(),r=q[e];return r?`<span class="emotion-tag" style="--ec:${r.color}"><span role="img" aria-label="${h(t)}">${r.emoji}</span> ${h(t)}</span>`:`<p>${h(t)}</p>`}_renderSummaryRow(t,e,r){let a=(t==="pain-points"?"painPoints":t)==="painPoints"?this.__painPoints:this.__goals,i=a?.length?a.map(o=>`<p>${h(o)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">No ${r.toLowerCase()} specified.</p></slot>`;return`
      <div class="summary-row">
        <span class="summary-row__icon" aria-hidden="true">${e}</span>
        <div class="summary-row__body">
          <div class="summary-row__label">${r}</div>
          <div class="summary-row__content">${i}</div>
        </div>
      </div>`}_bindEditListeners(){let t=this.shadowRoot;t&&(t.querySelectorAll(".quadrant__edit-btn").forEach(e=>{e.addEventListener("click",()=>{let r=e.dataset.quadrant;r&&this._openEdit(r)})}),t.querySelectorAll(".quadrant__done-btn").forEach(e=>{e.addEventListener("click",()=>{let r=e.dataset.quadrant;r&&this._closeEdit(r)})}),t.querySelectorAll(".quadrant__editor").forEach(e=>{let r=e;r.addEventListener("keydown",s=>{let a=s;if(a.key==="Escape"){a.preventDefault();let i=r.dataset.quadrant;i&&this._closeEdit(i)}})}))}_openEdit(t){this._editingQuadrants.add(t);let e=this.shadowRoot?.querySelector(`.quadrant--${t}`);if(!e)return;e.setAttribute("data-editing","");let r=e.querySelector(".quadrant__face--front"),s=e.querySelector(".quadrant__face--back");r&&r.setAttribute("inert",""),s&&s.removeAttribute("inert");let a=e.querySelector(".quadrant__editor");if(a){let i=this.__quadrants?.[t];if(i?.length)a.value=i.join(`
`);else{let o=e.querySelector(`slot[name="${t}"]`);if(o){let n=o.assignedElements();if(n.length){let l=[];n.forEach(d=>{let p=d.querySelectorAll("li");p.length?p.forEach(u=>l.push(u.textContent?.trim()??"")):l.push(d.textContent?.trim()??"")}),a.value=l.filter(Boolean).join(`
`)}}}a.focus()}}_closeEdit(t){let e=this.shadowRoot?.querySelector(`.quadrant--${t}`);if(!e)return;let r=e.querySelector(".quadrant__editor");if(r){let i=r.value.split(`
`).map(n=>n.trim()).filter(Boolean);this.__quadrants||(this.__quadrants={}),this.__quadrants[t]=i;let o=e.querySelector(".quadrant__content");if(o)if(i.length)o.innerHTML=t==="feels"?i.map(n=>this._renderEmotion(n)).join(""):i.map(n=>`<p>${h(n)}</p>`).join("");else{let n=Z[t];o.innerHTML=`<p class="placeholder">Add ${n.label.toLowerCase()} items\u2026</p>`}}this._editingQuadrants.delete(t),e.removeAttribute("data-editing");let s=e.querySelector(".quadrant__face--front"),a=e.querySelector(".quadrant__face--back");s&&s.removeAttribute("inert"),a&&a.setAttribute("inert",""),this.dispatchEvent(new CustomEvent("empathy-map:update",{bubbles:!0,composed:!0,detail:{quadrant:t,items:this.__quadrants?.[t]||[]}}))}};x("empathy-map",ot);function V({newItems:c,nodes:t,keyOf:e,renderItem:r,containerFor:s}){let a=[],i=[],o=[],n=new Set;for(let d of c)n.add(e(d));for(let[d,p]of[...t])n.has(d)||(p.remove(),t.delete(d),o.push(d));let l=new Map;for(let d of c){let p=e(d),u=t.get(p)||null,m=s(d,u);l.has(m)||l.set(m,[]),l.get(m)?.push({item:d,key:p,existing:u})}for(let[d,p]of l)for(let u=0;u<p.length;u++){let{item:m,key:f,existing:g}=p[u],v=g;v?(v.parentElement!==d||d.children[u]!==v)&&i.push(f):(v=r(m),t.set(f,v),a.push(f));let y=d.children[u];y!==v&&d.insertBefore(v,y||null)}return{added:a,moved:i,removed:o}}var nt=class c extends C{static QUADRANTS=["quick-wins","big-bets","fill-ins","money-pit"];static LABELS={"quick-wins":"Quick Wins","big-bets":"Big Bets","fill-ins":"Fill-Ins","money-pit":"Money Pit"};static DESCRIPTIONS={"quick-wins":"High impact \xB7 Low effort","big-bets":"High impact \xB7 High effort","fill-ins":"Low impact \xB7 Low effort","money-pit":"Low impact \xB7 High effort"};static#e=0;static get observedAttributes(){return["src","compact","title"]}#t=null;#r={};#i=null;#s="";#o=null;setup(){this.#s=`ie-${++c.#e}`;let t=[...this.querySelectorAll(":scope > [data-quadrant], :scope > [draggable]")],e=document.createElement("div");e.className="ie-wrapper";let r=document.createElement("div");r.className="ie-y-label",r.setAttribute("aria-hidden","true"),r.textContent="Impact \u2191";let s=document.createElement("div");s.style.cssText="display:flex;flex-direction:column;flex:1;min-width:0;";let a=document.createElement("div");a.className="ie-grid",a.setAttribute("role","region"),a.setAttribute("aria-label","Impact-Effort prioritization matrix");let i=document.createElement("div");i.className="ie-x-label",i.setAttribute("aria-hidden","true"),i.textContent="Effort \u2192";for(let d of c.QUADRANTS){let p=document.createElement("section");p.className="ie-quadrant",p.dataset.quadrantZone=d,p.setAttribute("aria-label",`${c.LABELS[d]}: ${c.DESCRIPTIONS[d]}`);let u=document.createElement("header");u.className="ie-quadrant-label",u.innerHTML=`${c.LABELS[d]}<br><span class="ie-quadrant-desc">${c.DESCRIPTIONS[d]}</span>`;let m=document.createElement("drag-surface");m.setAttribute("group",this.#s),m.setAttribute("aria-label",c.LABELS[d]),m.setAttribute("data-layout","stack"),m.setAttribute("data-layout-gap","xs"),p.appendChild(u),p.appendChild(m),a.appendChild(p),this.#r[d]=m}t.forEach((d,p)=>{let u=d,m=u.getAttribute("data-quadrant")||"quick-wins",f=this.#r[m]||this.#r["quick-wins"];u.hasAttribute("draggable")||u.setAttribute("draggable","true"),u.hasAttribute("data-id")||(u.dataset.id=`ie-item-${p}`),f.appendChild(u)});let o=document.createElement("div");o.className="ie-live-region",o.setAttribute("role","status"),o.setAttribute("aria-live","polite"),o.setAttribute("aria-atomic","true");let n=this.getAttribute("title");if(n){let d=document.createElement("h3");d.className="ie-title",d.textContent=n,this.prepend(d)}s.appendChild(a),s.appendChild(i),e.appendChild(r),e.appendChild(s),this.appendChild(e),this.appendChild(o),this.#t=a,this.#i=o,this.#o=e,this.listen(this,"drag-surface:transfer",d=>{let{item:p,fromSurface:u,toSurface:m}=d.detail,f=this.#d(u),g=this.#d(m);!f||!g||(p.setAttribute("data-quadrant",g),this.#b(`Moved ${this.#m(p)} to ${c.LABELS[g]}`),this.dispatchEvent(new CustomEvent("impact-effort:move",{bubbles:!0,detail:{itemId:p.dataset.id,from:f,to:g,item:p}})))});let l=this.getAttribute("src");l&&this.#c(l),this.#u()}teardown(){this.#o&&(this.#o.remove(),this.#o=null),this.#i&&(this.#i.remove(),this.#i=null),this.#t=null,this.#r={},this.#n.clear(),this.#a=[]}#a=[];#n=new Map;get items(){if(this.#a.length)return this.#a;let t=[];for(let[e,r]of Object.entries(this.#r))for(let s of r.querySelectorAll(':scope > [draggable="true"]'))t.push({id:s.getAttribute("data-id")||void 0,quadrant:e,text:s.textContent?.trim()||void 0});return t}set items(t){if(!this.#t)return;let e=Array.isArray(t)?t:[];V({newItems:e,nodes:this.#n,keyOf:r=>r.id??`${r.quadrant}:${r.text}`,renderItem:r=>{let s=this;if(typeof s.renderItem=="function"){let i=s.renderItem(r);if(i instanceof Element)return i.hasAttribute("draggable")||i.setAttribute("draggable","true"),i.hasAttribute("data-id")||i.setAttribute("data-id",String(r.id??"")),i}let a=document.createElement("article");return a.className="ie-card",a.setAttribute("draggable","true"),r.id&&a.setAttribute("data-id",String(r.id)),a.textContent=r.text||r.id||"",a},containerFor:r=>this.#r[r.quadrant]||this.#r["quick-wins"]}),this.#a=e,this.dispatchEvent(new CustomEvent("impact-effort:items-changed",{detail:{items:e,source:"property"},bubbles:!0}))}attributeChangedCallback(t,e,r){this.hasAttribute("data-upgraded")&&t==="src"&&r&&r!==e&&this.#c(r)}async#c(t){try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();if(!Array.isArray(r))return;let s=()=>{for(let a of c.QUADRANTS){let i=this.#r[a];if(i)for(let o of[...i.querySelectorAll("[draggable]")])o.remove()}r.forEach((a,i)=>{let o=a.quadrant||"quick-wins",n=a.id||`ie-item-${i}`,l;a.persona||a.action||a.storyId?(l=document.createElement("user-story"),l.setAttribute("detail","minimal"),a.storyId&&l.setAttribute("story-id",a.storyId),a.persona&&l.setAttribute("persona",a.persona),a.action&&l.setAttribute("action",a.action),a.benefit&&l.setAttribute("benefit",a.benefit),a.priority&&l.setAttribute("priority",a.priority),a.status&&l.setAttribute("status",a.status),a.points&&l.setAttribute("points",String(a.points))):(l=document.createElement("article"),l.textContent=a.label||a.text||""),l.setAttribute("draggable","true"),l.dataset.id=n,l.dataset.quadrant=o,(this.#r[o]||this.#r["quick-wins"]).appendChild(l)})};this.hasAttribute("data-upgraded")&&this.#t?S(this,s,"ie-vt"):s(),this.#u()}catch(e){console.warn(`[impact-effort] Failed to load src="${t}":`,e)}}#d(t){for(let[e,r]of Object.entries(this.#r))if(r===t)return e;return null}#b(t){let e=this.#i;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#m(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#u(){let t={};for(let e of c.QUADRANTS){let r=this.#r[e];t[e]=r?r.querySelectorAll('[draggable="true"]').length:0}this.dispatchEvent(new CustomEvent("impact-effort:ready",{bubbles:!0,detail:{quadrantCounts:t}}))}};x("impact-effort",nt);var ct=class c extends C{static#e=0;setup(){this.#m=`qg-${++c.#e}`;let t=this.getAttribute("x-label")||"",e=this.getAttribute("y-label")||"",r=this.getAttribute("x-low")||"Low",s=this.getAttribute("x-high")||"High",a=this.getAttribute("y-low")||"Low",i=this.getAttribute("y-high")||"High",o=[this.getAttribute("q1-label")||"Q1",this.getAttribute("q2-label")||"Q2",this.getAttribute("q3-label")||"Q3",this.getAttribute("q4-label")||"Q4"],n=this.hasAttribute("draggable"),l=[...this.querySelectorAll(":scope > [data-quadrant], :scope > [data-x][data-y]")],d=document.createElement("section");d.className="qg-wrapper",d.setAttribute("role","region"),d.setAttribute("aria-label",`${e} \xD7 ${t} quadrant grid`);let p=document.createElement("header");p.className="qg-y-label",p.setAttribute("aria-hidden","true"),p.textContent=`\u2191 ${e}`;let u=document.createElement("aside");u.className="qg-y-scale",u.setAttribute("aria-hidden","true"),u.innerHTML=`<span>${i}</span><span>${a}</span>`;let m=document.createElement("div");m.className="qg-grid";let f=document.createElement("aside");f.className="qg-x-scale",f.setAttribute("aria-hidden","true"),f.innerHTML=`<span>${r}</span><span>${s}</span>`;let g=document.createElement("footer");g.className="qg-x-label",g.setAttribute("aria-hidden","true"),g.textContent=`${t} \u2192`;for(let y=0;y<4;y++){let _=document.createElement("section");_.className="qg-quadrant",_.dataset.quadrantZone=String(y),_.setAttribute("aria-label",o[y]);let b=document.createElement("header");if(b.className="qg-quadrant-label",b.textContent=o[y],_.appendChild(b),n){let w=document.createElement("drag-surface");w.setAttribute("group",this.#m),w.setAttribute("aria-label",o[y]),w.setAttribute("data-layout","stack"),w.setAttribute("data-layout-gap","xs"),_.appendChild(w),this.#u[y]=w}else{let w=document.createElement("ul");w.className="qg-items",_.appendChild(w),this.#f[y]=w}m.appendChild(_),this.#v[y]=_}l.forEach((y,_)=>{let b=y,w=this.#n(b),T=n?this.#u[w]:this.#f[w];if(n&&(b.hasAttribute("draggable")||b.setAttribute("draggable","true")),b.hasAttribute("data-id")||(b.dataset.id=`qg-item-${_}`),b.hasAttribute("data-x")&&b.hasAttribute("data-y")){let E=parseFloat(b.getAttribute("data-x")??""),M=parseFloat(b.getAttribute("data-y")??"");if(Number.isFinite(E)&&Number.isFinite(M)){let $=w===0||w===3?(E-.5)*2:E*2,F=w===0||w===1?(M-.5)*2:M*2;if(b.style.setProperty("--qg-local-x",$.toFixed(4)),b.style.setProperty("--qg-local-y",F.toFixed(4)),b.classList.add("qg-pinned"),!b.style.getPropertyValue("--qg-pin-hue")){let Ot=b.dataset.id||(b.textContent||"").trim();b.style.setProperty("--qg-pin-hue",`${c.#o(Ot)}deg`)}}}if(n)T.appendChild(b);else{let E=document.createElement("li");E.appendChild(b),T.appendChild(E)}});let v=document.createElement("div");v.className="qg-live-region visually-hidden",v.setAttribute("role","status"),v.setAttribute("aria-live","polite"),d.appendChild(p),d.appendChild(u),d.appendChild(m),d.appendChild(f),d.appendChild(g),this.appendChild(d),this.appendChild(v),this.#l=m,this.#h=v,this.#y=o,n&&this.listen(this,"drag-surface:transfer",this.#a),this.#t()}#t(){if(typeof ResizeObserver>"u")return;let t=e=>{let r=e.offsetWidth,s=e.offsetHeight;r>0&&e.style.setProperty("--qg-pin-half-w",`${r/2}px`),s>0&&e.style.setProperty("--qg-pin-half-h",`${s/2}px`)};this.#g=new ResizeObserver(e=>{for(let r of e)t(r.target);this.#r()});for(let e of this.querySelectorAll(".qg-pinned"))this.#g.observe(e);this.#r()}#r(){this.#p||(this.#p=requestAnimationFrame(()=>{this.#p=0,this.#i()}))}#i(){for(let e of this.querySelectorAll(".qg-pinned")){let r=e;r.classList.remove("qg-clustered"),r.style.removeProperty("--qg-cluster-i"),r.style.removeProperty("--qg-cluster-n"),delete r.dataset.cluster,r.dataset.qgTabbed!==void 0&&(r.removeAttribute("tabindex"),delete r.dataset.qgTabbed)}let t=0;for(let e=0;e<4;e++){let r=this.#v[e];if(!r)continue;let s=[...r.querySelectorAll(".qg-pinned")];if(s.length<2)continue;let a=s.map(d=>d.getBoundingClientRect()),i=Array.from({length:s.length},(d,p)=>p),o=d=>i[d]===d?d:i[d]=o(i[d]),n=(d,p)=>{let u=o(d),m=o(p);u!==m&&(i[u]=m)};for(let d=0;d<s.length;d++)for(let p=d+1;p<s.length;p++)c.#s(a[d],a[p])&&n(d,p);let l=new Map;for(let d=0;d<s.length;d++){let p=o(d);l.has(p)||l.set(p,[]),l.get(p)?.push(d)}for(let d of l.values()){if(d.length<2)continue;let p=`c${++t}`;d.forEach((u,m)=>{let f=s[u];f.classList.add("qg-clustered"),f.dataset.cluster=p,f.style.setProperty("--qg-cluster-i",String(m)),f.style.setProperty("--qg-cluster-n",String(d.length)),!f.hasAttribute("tabindex")&&!f.matches("a, button, [contenteditable]")&&(f.setAttribute("tabindex","0"),f.dataset.qgTabbed="")})}}}teardown(){this.#g?.disconnect(),this.#g=null,this.#p&&cancelAnimationFrame(this.#p),this.#p=0}static#s(t,e){return!(t.right<=e.left||e.right<=t.left||t.bottom<=e.top||e.bottom<=t.top)}static#o(t){let e=5381;for(let r=0;r<t.length;r++)e=(e<<5)+e+t.charCodeAt(r)|0;return(e%360+360)%360}#a=t=>{let{item:e,fromSurface:r,toSurface:s}=t.detail,a=this.#c(r),i=this.#c(s);a==null||i==null||(e.setAttribute("data-quadrant",String(i)),this.#b(`Moved ${this.#d(e)} to ${this.#y[i]}`),this.dispatchEvent(new CustomEvent("quadrant-grid:move",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,from:a,to:i}})))};#n(t){let e=parseInt(t.getAttribute("data-quadrant"),10);if(e>=0&&e<=3)return e;if(t.hasAttribute("data-x")&&t.hasAttribute("data-y")){let r=parseFloat(t.getAttribute("data-x")),s=parseFloat(t.getAttribute("data-y"));return c.quadrantFor(r,s)}return 0}static quadrantFor(t,e){let r=t>=.5,s=e>=.5;return s&&r?0:s&&!r?1:!s&&!r?2:3}#c(t){for(let e=0;e<4;e++)if(this.#u[e]===t)return e;return null}#d(t){return(t.textContent||"").trim().split(`
`)[0]||"item"}#b(t){this.#h&&(this.#h.textContent=t)}#m="";#u={};#f={};#v={};#l=null;#h=null;#y=[];#g=null;#p=0};x("quadrant-grid",ct);var It=5,dt=class c extends C{setup(){let t=this.querySelector(":scope > template"),e=t?c.#t(t):[];if(this.hasAttribute("src")){this.#e(this.getAttribute("src"));return}this.#r(e)}async#e(t){try{let r=await(await fetch(t)).json();this.#r(Array.isArray(r)?r:[])}catch(e){console.warn("risk-register: failed to load src",t,e),this.#r([])}}static#t(t){let e=[],r=t.content.querySelectorAll("tr");for(let s of r){let a=[...s.children],i=a[0]?.textContent?.trim()||"",o=s.getAttribute("data-id")||i.toLowerCase().replace(/\s+/g,"-")||`risk-${e.length}`;e.push({id:o,title:i,likelihood:parseInt(a[1]?.textContent??"",10)||0,impact:parseInt(a[2]?.textContent??"",10)||0,owner:a[3]?.textContent?.trim()||"",mitigation:a[4]?.textContent?.trim()||""})}return e}#r(t){this.#a=t,[...this.children].forEach(s=>{s.tagName!=="TEMPLATE"&&s.remove()});let e=this.getAttribute("label");if(e){let s=document.createElement("header");s.className="rr-label",s.textContent=e,this.appendChild(s)}let r=document.createElement("div");r.className="rr-layout",r.appendChild(this.#i(t)),r.appendChild(this.#s(t)),this.appendChild(r),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent("risk-register:ready",{bubbles:!0,detail:{count:t.length}}))})}#i(t){let e=document.createElement("data-table"),r=document.createElement("table");return r.innerHTML=`
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
        ${t.map(s=>`
          <tr data-id="${c.#o(s.id)}">
            <td>${c.#o(s.title)}</td>
            <td>${s.likelihood||""}</td>
            <td>${s.impact||""}</td>
            <td></td>
            <td>${c.#o(s.owner)}</td>
            <td>${c.#o(s.mitigation)}</td>
          </tr>
        `).join("")}
      </tbody>
    `,e.appendChild(r),e}#s(t){let e=document.createElement("quadrant-grid");e.setAttribute("x-label","Likelihood"),e.setAttribute("y-label","Impact"),e.setAttribute("x-low","Rare"),e.setAttribute("x-high","Likely"),e.setAttribute("y-low","Minor"),e.setAttribute("y-high","Severe"),e.setAttribute("q1-label","Avoid"),e.setAttribute("q2-label","Plan"),e.setAttribute("q3-label","Accept"),e.setAttribute("q4-label","Mitigate");for(let r of t){if(!r.likelihood||!r.impact)continue;let s=document.createElement("span"),a=Math.min(1,Math.max(0,r.likelihood/It)),i=Math.min(1,Math.max(0,r.impact/It));s.setAttribute("data-x",a.toFixed(3)),s.setAttribute("data-y",i.toFixed(3)),s.setAttribute("data-id",r.id),s.setAttribute("title",`${r.title} \u2014 likelihood ${r.likelihood}, impact ${r.impact}`),s.textContent=r.title,e.appendChild(s)}return e}static#o(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}#a=[];get rows(){return[...this.#a]}set rows(t){this.#r(Array.isArray(t)?t:[])}};x("risk-register",dt);var lt=class c extends C{setup(){let t=this.getAttribute("rows"),e=this.getAttribute("cols"),r=this.getAttribute("link-attr");return!t||!e||!r?(console.warn("traceability-matrix: requires rows, cols, and link-attr attributes"),!1):(queueMicrotask(()=>this.#e(t,e,r)),!0)}#e(t,e,r){let s=[...document.querySelectorAll(t)].filter(b=>b!==this&&!this.contains(b)),a=[...document.querySelectorAll(e)].filter(b=>b!==this&&!this.contains(b));if(!s.length||!a.length){this.#i();return}let i=this.getAttribute("row-label")||"",o=this.getAttribute("cell-mark")||"\u2713",n=this.hasAttribute("flag-orphans"),l=[],d=new WeakMap,p=new WeakMap;for(let b of s){let w=c.#s(b.getAttribute(r));for(let T of w){let E=a.find(M=>M.id===T);E&&(l.push({rowEl:b,colEl:E}),d.set(b,(d.get(b)||0)+1),p.set(E,(p.get(E)||0)+1))}}let u=document.createElement("data-table"),m=document.createElement("table"),f=document.createElement("thead"),g=document.createElement("tr"),v=document.createElement("th");v.setAttribute("data-sort","string"),v.textContent=i,g.appendChild(v);for(let b of a){let w=document.createElement("th");w.setAttribute("data-sort","number"),w.textContent=c.#o(b),w.dataset.colId=b.id||"",n&&!p.get(b)&&(w.dataset.orphan=""),g.appendChild(w)}f.appendChild(g),m.appendChild(f);let y=document.createElement("tbody");for(let b of s){let w=document.createElement("tr");w.dataset.rowId=b.id||"",n&&!d.get(b)&&(w.dataset.orphan="");let T=document.createElement("th");T.scope="row",T.textContent=c.#o(b),w.appendChild(T);let E=c.#s(b.getAttribute(r));for(let M of a){let $=document.createElement("td"),F=E.includes(M.id);$.setAttribute("data-sort-value",F?"1":"0"),F?($.dataset.linked="",$.textContent=o,$.setAttribute("aria-label","linked")):$.setAttribute("aria-label","not linked"),$.dataset.colId=M.id||"",w.appendChild($)}y.appendChild(w)}m.appendChild(y),u.appendChild(m),[...this.children].forEach(b=>{b.tagName!=="TEMPLATE"&&b.remove()});let _=this.getAttribute("label");if(_){let b=document.createElement("header");b.className="tm-label",b.textContent=_,this.appendChild(b)}this.appendChild(u),this.#a=u,this.#n=new Map(s.map(b=>[b.id,b])),this.#c=new Map(a.map(b=>[b.id,b])),this.listen(u,"click",this.#t),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent("traceability-matrix:ready",{bubbles:!0,detail:{rowCount:s.length,colCount:a.length,linkCount:l.length}}))})}#t=t=>{let e=t.target.closest('td, th[scope="row"]');if(!e)return;let r=e.closest("tr");if(!r)return;let s=r.dataset.rowId,a=e.dataset.colId,i=s?this.#n.get(s):null,o=a?this.#c.get(a):null,n=e.hasAttribute("data-state-highlighted");if(this.#r(),n){this.dispatchEvent(new CustomEvent("traceability-matrix:highlight",{bubbles:!0,detail:{rowEl:i,colEl:o,on:!1}}));return}e.setAttribute("data-state-highlighted",""),i&&i.setAttribute("data-state-highlighted",""),o&&o!==i&&o.setAttribute("data-state-highlighted",""),r.setAttribute("data-state-highlighted",""),this.dispatchEvent(new CustomEvent("traceability-matrix:highlight",{bubbles:!0,detail:{rowEl:i,colEl:o,on:!0}}))};#r(){this.#a&&(this.#a.querySelectorAll("[data-state-highlighted]").forEach(t=>t.removeAttribute("data-state-highlighted")),document.querySelectorAll("[data-state-highlighted]").forEach(t=>{(this.#n.has(t.id)||this.#c.has(t.id))&&t.removeAttribute("data-state-highlighted")}))}#i(){[...this.children].forEach(e=>{e.tagName!=="TEMPLATE"&&e.remove()});let t=document.createElement("p");t.className="tm-empty",t.textContent="No matching elements found for this matrix.",this.appendChild(t)}static#s(t){return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}static#o(t){return t.getAttribute("data-matrix-label")||t.id||(t.textContent||"").trim().split(`
`)[0].slice(0,60)||"(unnamed)"}#a=null;#n=new Map;#c=new Map};x("traceability-matrix",lt);var te=864e5,pt=class c extends C{setup(){let t=this.getAttribute("start"),e=this.getAttribute("end"),r=parseFloat(this.getAttribute("total")||"");if(!t||!e||!Number.isFinite(r))return console.warn("burndown-chart: requires start, end, and total attributes"),!1;let s=c.#r(t),a=c.#r(e);if(!s||!a||a<s)return console.warn("burndown-chart: start/end dates invalid",t,e),!1;let i=(this.getAttribute("weekends")||"include")!=="exclude",o=this.getAttribute("unit")||"points",n=this.getAttribute("label")||"",l=this.querySelector(":scope > template"),d=l?c.#t(l):[],p=d.filter(g=>g.delta!==0),u=c.#s(s,a),m=c.#o(u,r,i),f=c.#a(u,d);return this.#e({label:n,unit:o,dayLabels:u,actual:f,ideal:m,scopeChanges:p}),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent("burndown-chart:ready",{bubbles:!0,detail:{dayCount:u.length,total:r,scopeChanges:p.length}}))}),!0}#e({label:t,unit:e,dayLabels:r,actual:s,ideal:a,scopeChanges:i}){if([...this.children].forEach(p=>{p.tagName!=="TEMPLATE"&&p.remove()}),t){let p=document.createElement("header");p.className="bdc-label",p.textContent=t,this.appendChild(p)}let o=document.createElement("chart-wc");o.setAttribute("data-type","line"),o.setAttribute("data-legend",""),o.setAttribute("data-tooltip",""),o.setAttribute("data-label-x","Day"),o.setAttribute("data-label-y",e);let n={},l={};r.forEach((p,u)=>{n[p]=a[u],s[u]!==null&&(l[p]=s[u])});let d=[{name:"Actual",values:l},{name:"Ideal",values:n}];if(o.setAttribute("data-values",JSON.stringify(d)),this.appendChild(o),i.length){let p=document.createElement("aside");p.className="bdc-scope-changes";let u=document.createElement("h4");u.textContent="Scope changes",p.appendChild(u);let m=document.createElement("ul");for(let f of i){let g=document.createElement("li"),v=f.delta>0?"+":"";g.innerHTML=`<time datetime="${f.date}">${f.date}</time>: <strong>${v}${f.delta} ${e}</strong>`,m.appendChild(g)}p.appendChild(m),this.appendChild(p)}}static#t(t){let e=[],r=t.content.querySelectorAll("tr");for(let s of r){let a=[...s.children],i=a[0]?.textContent?.trim(),o=parseFloat(a[1]?.textContent??""),n=parseFloat(a[2]?.textContent??"0")||0;!i||!Number.isFinite(o)||e.push({date:i,remaining:o,delta:n})}return e}static#r(t){let e=String(t).match(/^(\d{4})-(\d{2})-(\d{2})/);return e?new Date(Number(e[1]),Number(e[2])-1,Number(e[3])):null}static#i(t){let e=String(t.getMonth()+1).padStart(2,"0"),r=String(t.getDate()).padStart(2,"0");return`${t.getFullYear()}-${e}-${r}`}static#s(t,e){let r=[];for(let s=t.getTime();s<=e.getTime();s+=te)r.push(c.#i(new Date(s)));return r}static#o(t,e,r){let s=d=>{let p=c.#r(d);if(!p)return!1;let u=p.getDay();return u===0||u===6},a=t.map((d,p)=>({d,i:p,weekend:s(d)})).filter(d=>r||!d.weekend),i=a.length>1?e/(a.length-1):0,o=new Array(t.length).fill(null),n=e,l=0;for(let d=0;d<t.length;d++){let p=s(t[d]);r||!p?(o[d]=Math.max(0,e-i*l),l++,n=o[d]):o[d]=n}return o}static#a(t,e){let r=new Map(e.map(s=>[s.date,s.remaining]));return t.map(s=>r.has(s)?r.get(s):null)}};x("burndown-chart",pt);var ut=class c extends C{setup(){let t=this.getAttribute("start"),e=this.getAttribute("end");if(!t||!e)return console.warn("product-roadmap: start and end attributes required"),!1;let r=c.#f(t,"start"),s=c.#f(e,"end");if(!r||!s||s<=r)return console.warn("product-roadmap: invalid start/end",t,e),!1;this.#l=r,this.#h=s,this.#y=s.getTime()-r.getTime(),this.#g=this.getAttribute("view")==="month"?"month":"quarter",this.#p=this.hasAttribute("editable");let a=[...this.querySelectorAll(":scope > section[data-lane]")];return a.length?(this.#x=a,this.#e(),!0):(console.warn("product-roadmap: no <section data-lane> children found"),!1)}attributeChangedCallback(){this.isConnected&&this.#x.length&&this.#e()}#e(){[...this.children].forEach(s=>{this.#x.includes(s)||s.remove()}),this.#x.forEach(s=>{s.hidden=!0});let t=document.createElement("div");t.className="rm-wrapper";let e=this.#t();t.appendChild(e);let r=document.createElement("div");r.className="rm-lanes";for(let s of this.#x){let a=s.getAttribute("data-lane")||"",i=document.createElement("section");i.className="rm-lane",i.dataset.lane=a;let o=document.createElement("header");o.className="rm-lane-label",o.textContent=a,i.appendChild(o);let n=document.createElement("div");n.className="rm-track",n.dataset.lane=a;let l=[...s.querySelectorAll(":scope > article[data-start][data-end]")];for(let d of l){let p=this.#r(d,a);p&&n.appendChild(p)}this.#p&&(n.addEventListener("dragover",this.#n),n.addEventListener("drop",this.#c)),i.appendChild(n),r.appendChild(i)}if(t.appendChild(r),this.hasAttribute("today-marker")&&this.#l&&this.#h){let s=new Date;if(s>=this.#l&&s<=this.#h){let a=document.createElement("div");a.className="rm-today",a.style.setProperty("--rm-x",this.#d(s).toFixed(4)),a.title=`Today: ${c.#v(s)}`,r.appendChild(a)}}this.appendChild(t),this.#k=t}#t(){let t=document.createElement("header");t.className="rm-axis";let e=this.#u();for(let r of e){let s=document.createElement("div");s.className="rm-tick",s.style.setProperty("--rm-x",r.startFraction.toFixed(4)),s.style.setProperty("--rm-w",(r.endFraction-r.startFraction).toFixed(4)),s.textContent=r.label,t.appendChild(s)}return t}#r(t,e){let r=c.#f(t.getAttribute("data-start"),"start"),s=c.#f(t.getAttribute("data-end"),"end");if(!r||!s||!this.#l||!this.#h)return null;let a=r<this.#l?this.#l:r,i=s>this.#h?this.#h:s;if(a>=i)return null;let o=this.#d(a),n=this.#d(i)-o,l=document.createElement("article");l.className="rm-bar",l.style.setProperty("--rm-x",o.toFixed(4)),l.style.setProperty("--rm-w",n.toFixed(4)),l.dataset.lane=e,l.dataset.start=c.#v(r),l.dataset.end=c.#v(s),t.dataset.status&&(l.dataset.status=t.dataset.status),t.id&&(l.dataset.sourceId=t.id),this.#p&&l.setAttribute("draggable","true");let d=t.querySelector("h1, h2, h3, h4, h5, h6"),p=document.createElement("span");if(p.className="rm-bar-title",p.textContent=d?d.textContent.trim():(t.textContent||"").trim().split(`
`)[0],l.appendChild(p),l.setAttribute("aria-label",`${p.textContent} \u2014 ${l.dataset.start} to ${l.dataset.end} in ${e}`),l.addEventListener("click",u=>{this.#w||this.dispatchEvent(new CustomEvent("product-roadmap:select",{bubbles:!0,detail:{initiative:t,lane:e,start:l.dataset.start,end:l.dataset.end,status:l.dataset.status||null}}))}),this.#p){let u=document.createElement("span");u.className="rm-bar-handle",u.setAttribute("aria-label","Resize end date"),l.appendChild(u),u.addEventListener("pointerdown",m=>this.#s(m,l,t)),l.addEventListener("pointerdown",m=>{m.target!==u&&this.#i(m,l,t)}),l.addEventListener("dragstart",m=>{m.dataTransfer&&(m.dataTransfer.effectAllowed="move",m.dataTransfer.setData("text/plain",t.id||l.dataset.sourceId||"")),this.#A=t,this.#_=e}),l.addEventListener("dragend",()=>{this.#A=null,this.#_=null})}return l}#i(t,e,r){if(t.button!==0)return;t.preventDefault();let s=e.parentElement.getBoundingClientRect(),a=t.clientX,i=parseFloat(e.style.getPropertyValue("--rm-x"))||0,o=parseFloat(e.style.getPropertyValue("--rm-w"))||0;this.#w={kind:"move",bar:e,initiative:r,trackRect:s,startX:a,startFraction:i,widthFraction:o},e.setPointerCapture(t.pointerId),e.addEventListener("pointermove",this.#o),e.addEventListener("pointerup",this.#a),e.addEventListener("pointercancel",this.#a)}#s(t,e,r){if(t.button!==0)return;t.preventDefault(),t.stopPropagation();let s=e.parentElement.getBoundingClientRect(),a=t.clientX,i=parseFloat(e.style.getPropertyValue("--rm-x"))||0,o=parseFloat(e.style.getPropertyValue("--rm-w"))||0;this.#w={kind:"resize",bar:e,initiative:r,trackRect:s,startX:a,startFraction:i,widthFraction:o},e.setPointerCapture(t.pointerId),e.addEventListener("pointermove",this.#o),e.addEventListener("pointerup",this.#a),e.addEventListener("pointercancel",this.#a)}#o=t=>{if(!this.#w)return;let{kind:e,bar:r,trackRect:s,startX:a,startFraction:i,widthFraction:o}=this.#w,n=(t.clientX-a)/s.width;if(e==="move"){let l=Math.max(0,Math.min(1-o,i+n));r.style.setProperty("--rm-x",l.toFixed(4))}else if(e==="resize"){let l=Math.max(.02,Math.min(1-i,o+n));r.style.setProperty("--rm-w",l.toFixed(4))}};#a=t=>{if(!this.#w)return;let{kind:e,bar:r,initiative:s}=this.#w;r.releasePointerCapture(t.pointerId),r.removeEventListener("pointermove",this.#o),r.removeEventListener("pointerup",this.#a),r.removeEventListener("pointercancel",this.#a);let a=parseFloat(r.style.getPropertyValue("--rm-x"))||0,i=parseFloat(r.style.getPropertyValue("--rm-w"))||0,o=this.#m(this.#b(a)),n=this.#m(this.#b(a+i));r.dataset.start=c.#v(o),r.dataset.end=c.#v(n);let l=this.#d(o),d=this.#d(n)-l;r.style.setProperty("--rm-x",l.toFixed(4)),r.style.setProperty("--rm-w",d.toFixed(4)),s&&(s.setAttribute("data-start",r.dataset.start??""),s.setAttribute("data-end",r.dataset.end??"")),this.dispatchEvent(new CustomEvent(e==="move"?"product-roadmap:reschedule":"product-roadmap:resize",{bubbles:!0,detail:{initiative:s,lane:r.dataset.lane,start:r.dataset.start,end:r.dataset.end}})),setTimeout(()=>{this.#w=null},0)};#n=t=>{this.#A&&(t.preventDefault(),t.dataTransfer.dropEffect="move")};#c=t=>{if(!this.#A)return;t.preventDefault();let e=t.currentTarget.dataset.lane,r=this.#A,s=this.#_;if(e===s)return;let a=this.#x.find(i=>i.getAttribute("data-lane")===e);a&&a.appendChild(r),this.dispatchEvent(new CustomEvent("product-roadmap:move",{bubbles:!0,detail:{initiative:r,fromLane:s,toLane:e,start:r.getAttribute("data-start"),end:r.getAttribute("data-end")}})),this.#e()};#d(t){if(!this.#l)return 0;let e=t.getTime()-this.#l.getTime();return Math.max(0,Math.min(1,e/this.#y))}#b(t){let e=this.#l??new Date;return new Date(e.getTime()+t*this.#y)}#m(t){if(this.#g==="month")return new Date(t.getFullYear(),t.getMonth(),1);let e=t.getMonth(),r=Math.floor(e/3)*3;return new Date(t.getFullYear(),r,1)}#u(){let t=[],e=this.#l,r=this.#h;if(!e||!r)return t;if(this.#g==="quarter"){let s=this.#m(e);for(;s<r;){let a=new Date(s.getFullYear(),s.getMonth()+3,1),i=this.#d(s<e?e:s),o=this.#d(a>r?r:a),n=Math.floor(s.getMonth()/3)+1;t.push({startFraction:i,endFraction:o,label:`Q${n} ${s.getFullYear()}`}),s=a}}else{let s=new Date(e.getFullYear(),e.getMonth(),1);for(;s<r;){let a=new Date(s.getFullYear(),s.getMonth()+1,1),i=this.#d(s<e?e:s),o=this.#d(a>r?r:a),n=s.toLocaleString(void 0,{month:"short"});t.push({startFraction:i,endFraction:o,label:`${n} ${s.getFullYear()}`}),s=a}}return t}static#f(t,e){if(!t)return null;let r=String(t).match(/^(\d{4})-Q([1-4])$/i);if(r){let i=Number(r[1]),n=(Number(r[2])-1)*3;return e==="end"?new Date(i,n+3,0):new Date(i,n,1)}let s=String(t).match(/^(\d{4})-(\d{2})-(\d{2})/);if(s)return new Date(Number(s[1]),Number(s[2])-1,Number(s[3]));let a=new Date(t);return isNaN(a.getTime())?null:a}static#v(t){let e=String(t.getMonth()+1).padStart(2,"0"),r=String(t.getDate()).padStart(2,"0");return`${t.getFullYear()}-${e}-${r}`}#l=null;#h=null;#y=0;#g="quarter";#p=!1;#x=[];#k=null;#w=null;#A=null;#_=null};x("product-roadmap",ut);function Tt(c){let t=c;return class extends t{static keyOf(e){return e.id}#e=[];#t=new Map;get items(){return this.#e}set items(e){let r=e||[],s=V({newItems:r,nodes:this.#t,keyOf:this.constructor.keyOf,renderItem:a=>this._renderItem(a),containerFor:(a,i)=>this._containerFor(a,i)});this.#e=r,this._postRender({...s,items:r}),this._emit("items-changed",{items:r},"api")}_renderItem(e){throw new Error(`${this.constructor.name}: must implement _renderItem(item)`)}_containerFor(e,r){return this}_postRender(e){}_emit(e,r,s="api"){this.dispatchEvent(new CustomEvent(`${this.localName}:${e}`,{detail:{...r,source:s},bubbles:!0}))}_nodeFor(e){return this.#t.get(e)||null}_seedCollection(e,r){this.#e=e,this.#t.clear();for(let[s,a]of r)this.#t.set(s,a)}_setItemsSilently(e){this.#e=e}}}var ht=class c extends Tt(C){static get observedAttributes(){return["src","compact","title"]}static keyOf(t){return t.id??t.storyId}static#e=0;#t=null;#r={};#i={};#s=null;#o="";#a=[];#n=null;setup(){this.#o=`kb-${++c.#e}`;let t=[...this.querySelectorAll(":scope > section[data-column]")];this.#a=t.map(a=>{let i=a.getAttribute("data-column")||"",n=a.getAttribute("data-column-label")||""||this.#y(i),l=a.getAttribute("data-wip"),d=l?parseInt(l,10):null,p=a.getAttribute("data-column-color")||null,u=[...a.children];return{id:i,label:n,wip:d,color:p,children:u}});for(let a of t)a.remove();this.#t=document.createElement("div"),this.#t.className="kb-columns",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label","Kanban board");let e=0;for(let a of this.#a){let i=document.createElement("section");i.className="kb-column",i.setAttribute("data-column-id",a.id),a.color&&i.setAttribute("data-column-tint",a.color);let o=document.createElement("header");o.className="kb-column-header";let n=document.createElement("h3");n.textContent=a.label;let l=document.createElement("output");if(l.className="kb-count",l.textContent=String(a.children.length),n.appendChild(l),a.wip!==null&&!isNaN(a.wip)){let p=document.createElement("span");p.className="kb-wip",p.textContent=`/ ${a.wip}`,p.setAttribute("aria-label",`WIP limit ${a.wip}`),n.appendChild(p)}o.appendChild(n),i.appendChild(o);let d=document.createElement("drag-surface");if(d.setAttribute("group",this.#o),d.setAttribute("aria-label",`${a.label} items`),d.setAttribute("data-layout","stack"),d.setAttribute("data-layout-gap","xs"),a.children.length>0){for(let p of a.children)p.hasAttribute("draggable")||p.setAttribute("draggable","true"),p.hasAttribute("data-id")||(p.dataset.id=`kb-item-${e}`),d.appendChild(p);e+=a.children.length}else{let p=document.createElement("p");p.className="kb-empty",p.textContent="No items",d.appendChild(p)}i.appendChild(d),this.#t.appendChild(i),this.#r[a.id]=d,this.#i[a.id]=i,a.wip!==null&&a.children.length>a.wip&&i.setAttribute("data-wip-exceeded","")}let r=this.getAttribute("title");if(r){let a=document.createElement("h2");a.className="kb-title",a.textContent=r,this.appendChild(a)}this.appendChild(this.#t),this.#s=document.createElement("div"),this.#s.className="kb-live-region",this.#s.setAttribute("role","status"),this.#s.setAttribute("aria-live","polite"),this.#s.setAttribute("aria-atomic","true"),this.appendChild(this.#s),this.listen(this,"drag-surface:reorder",a=>{let i=a.detail,o=a.target.closest("drag-surface"),n=this.#u(o);n&&(this.#f(n),this.#d("drag"),this.dispatchEvent(new CustomEvent("kanban-board:reorder",{bubbles:!0,detail:{itemId:i.itemId,column:n,oldIndex:i.oldIndex,newIndex:i.newIndex}})))}),this.listen(this,"drag-surface:transfer",a=>{let i=a.detail,o=i.fromSurface,n=i.toSurface,l=this.#u(o),d=this.#u(n);if(!l||!d)return;i.item&&i.item.setAttribute("data-column",d),this.#f(l),this.#f(d);let p=n.querySelector(".kb-empty");if(p&&p.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".kb-empty")){let _=document.createElement("p");_.className="kb-empty",_.textContent="No items",o.appendChild(_)}let m=this.#h(i.item),f=this.#v(l),g=this.#v(d);this.#l(`${m} moved from ${f} to ${g}`),this.#d("drag"),this.dispatchEvent(new CustomEvent("kanban-board:transfer",{bubbles:!0,detail:{itemId:i.itemId,fromColumn:l,toColumn:d,newIndex:i.newIndex,item:i.item}}));let v=n.querySelectorAll(':scope > [draggable="true"]').length,y=this.#a.find(_=>_.id===d);y?.wip!==null&&y?.wip!==void 0&&v>y.wip&&this.dispatchEvent(new CustomEvent("kanban-board:wip-exceeded",{bubbles:!0,detail:{column:d,limit:y.wip,count:v}}))}),this.#c();let s=this.getAttribute("src");if(s){this._loadSrc(s);return}this.dispatchEvent(new CustomEvent("kanban-board:ready",{bubbles:!0,detail:{columnCount:this.#a.length,itemCount:e}}))}#c(){let t=[],e=new Map;for(let[r,s]of Object.entries(this.#r)){let a=s.querySelectorAll(':scope > [draggable="true"]');for(let i of a){let o=i.getAttribute("data-id");o&&(t.push({id:o,column:r}),e.set(o,i))}}this._seedCollection(t,e)}#d(t){let e=[],r=new Map;for(let s of this.items){let a=String(s.id??s.storyId??"");a&&r.set(a,s)}for(let[s,a]of Object.entries(this.#r)){let i=a.querySelectorAll(':scope > [draggable="true"]');for(let o of i){let n=o.getAttribute("data-id");if(!n)continue;let l=r.get(n);e.push(l?{...l,column:s}:{id:n,column:s})}}this._setItemsSilently(e),this._emit("items-changed",{items:e},t)}teardown(){let t=this.querySelector(".kb-title");t&&t.remove(),this.#t&&(this.#t.remove(),this.#t=null),this.#s&&(this.#s.remove(),this.#s=null),this.#r={},this.#i={},this.#a=[]}get columns(){return this.#a.map(t=>({id:t.id,label:t.label,wip:t.wip??void 0,color:t.color??void 0}))}set columns(t){let e=(t||[]).map(i=>({id:i.id,label:i.label||this.#y(i.id),wip:i.wip??null,color:i.color??null,children:[]})),r=this.#t;this.#r={},this.#i={},this.#a=e;let s=this.#m();this.#t=s;let a=()=>{r&&r.remove(),this.appendChild(s)};this.hasAttribute("data-upgraded")&&r?S(this,a,"kb-vt"):a()}get renderItem(){return this.#n}set renderItem(t){this.#n=typeof t=="function"?t:null}_renderItem(t){let e;if(this.#n){let r=this.#n(t);if(!(r instanceof Element))throw new Error("kanban-board: renderItem must return an Element");e=r}else e=this.#b(t);return e.hasAttribute("draggable")||e.setAttribute("draggable","true"),e.hasAttribute("data-id")||e.setAttribute("data-id",String(c.keyOf(t))),e}_containerFor(t,e){let r=this.#r[t.column];if(!r)throw new Error(`kanban-board: no column "${t.column}" \u2014 set .columns first or include item.column matching an existing column id`);let s=r.querySelector(":scope > .kb-empty");return s&&s.remove(),r}_postRender(){for(let t of Object.keys(this.#r)){this.#f(t);let e=this.#r[t],r=e.querySelectorAll(':scope > [draggable="true"]'),s=e.querySelector(":scope > .kb-empty");if(r.length===0&&!s){let a=document.createElement("p");a.className="kb-empty",a.textContent="No items",e.appendChild(a)}else r.length>0&&s&&s.remove()}}#b(t){let e=customElements.get("work-item")?"work-item":"article",r=document.createElement(e);return e==="work-item"?r.data={itemId:t.id??t.storyId,type:t.type,priority:t.priority,status:t.status,estimate:t.estimate!=null?String(t.estimate):void 0,assignee:t.assignee,title:t.title,description:t.description,checklist:t.checklist,notes:t.notes,detail:t.detail}:(r.className="kb-card",r.textContent=t.title||t.label||t.id),r}#m(){let t=document.createElement("div");t.className="kb-columns",t.setAttribute("role","region"),t.setAttribute("aria-label","Kanban board");for(let e of this.#a){let r=document.createElement("section");r.className="kb-column",r.setAttribute("data-column-id",e.id),e.color&&r.setAttribute("data-column-tint",e.color);let s=document.createElement("header");s.className="kb-column-header";let a=document.createElement("h3");a.textContent=e.label;let i=document.createElement("output");if(i.className="kb-count",i.textContent="0",a.appendChild(i),e.wip!=null&&!isNaN(e.wip)){let l=document.createElement("span");l.className="kb-wip",l.textContent=`/ ${e.wip}`,l.setAttribute("aria-label",`WIP limit ${e.wip}`),a.appendChild(l)}s.appendChild(a),r.appendChild(s);let o=document.createElement("drag-surface");o.setAttribute("group",this.#o),o.setAttribute("aria-label",`${e.label} items`),o.setAttribute("data-layout","stack"),o.setAttribute("data-layout-gap","xs");let n=document.createElement("p");n.className="kb-empty",n.textContent="No items",o.appendChild(n),r.appendChild(o),t.appendChild(r),this.#r[e.id]=o,this.#i[e.id]=r}return t}attributeChangedCallback(t,e,r){e===r||!this.isConnected||t==="src"&&this._loadSrc(r)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let a of r.columns||[]){let i=document.createElement("section");i.setAttribute("data-column",a.id),a.label&&i.setAttribute("data-column-label",a.label),a.wip!=null&&i.setAttribute("data-wip",String(a.wip)),a.color&&i.setAttribute("data-column-color",a.color);for(let o of a.items||[]){let n;o.persona||o.action||o.storyId?(n=document.createElement("user-story"),n.setAttribute("detail",o.detail||"minimal"),o.storyId&&n.setAttribute("story-id",o.storyId),o.persona&&n.setAttribute("persona",o.persona),o.action&&n.setAttribute("action",o.action),o.benefit&&n.setAttribute("benefit",o.benefit),o.priority&&n.setAttribute("priority",o.priority),o.status&&n.setAttribute("status",o.status),o.points&&n.setAttribute("points",String(o.points))):(n=document.createElement("article"),n.className="kb-card",n.textContent=o.text||o.label||""),n.setAttribute("draggable","true"),n.dataset.id=o.id||o.storyId||"",i.appendChild(n)}this.appendChild(i)}let s=()=>{this.teardown(),this.removeAttribute("data-upgraded"),this.setup()};this.hasAttribute("data-upgraded")&&this.#t?S(this,s,"kb-vt"):s()}catch(e){console.warn(`[kanban-board] Failed to load src="${t}":`,e)}}#u(t){if(!t)return null;for(let[e,r]of Object.entries(this.#r))if(r===t)return e;return null}#f(t){let e=this.#r[t],r=this.#i[t];if(!e||!r)return;let s=e.querySelectorAll(':scope > [draggable="true"]').length,a=r.querySelector(".kb-count");a&&(a.textContent=String(s));let i=this.#a.find(o=>o.id===t);i?.wip!==null&&i?.wip!==void 0&&(s>i.wip?r.setAttribute("data-wip-exceeded",""):r.removeAttribute("data-wip-exceeded"))}#v(t){return this.#a.find(r=>r.id===t)?.label||this.#y(t)}#l(t){this.#s&&(this.#s.textContent="",requestAnimationFrame(()=>{this.#s&&(this.#s.textContent=t)}))}#h(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#y(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("kanban-board",ht);var mt=class c extends C{static get observedAttributes(){return["src","compact","title"]}static#e=0;#t=null;#r=null;#i={};#s=null;#o="";#a=[];setup(){this.#o=`sm-${++c.#e}`;let t=[...this.querySelectorAll(":scope > section[data-activity]")];this.#a=t.map(a=>{let i=a.getAttribute("data-activity")||"",n=a.getAttribute("data-activity-label")||""||this.#m(i),l=a.getAttribute("data-journey-phase")||null,d=[...a.children];return{id:i,label:n,journeyPhase:l,children:d}});for(let a of t)a.remove();this.#t=document.createElement("div"),this.#t.className="sm-scroll",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label","Story map"),this.#t.setAttribute("tabindex","0"),this.#r=document.createElement("div"),this.#r.className="sm-columns";let e=0;for(let a of this.#a){let i=document.createElement("section");i.className="sm-column",i.setAttribute("data-activity-column",a.id);let o=document.createElement("header");o.className="sm-activity-header";let n=document.createElement("h3");n.textContent=a.label;let l=document.createElement("span");l.className="sm-activity-count",l.textContent=String(a.children.length),n.appendChild(l),o.appendChild(n),i.appendChild(o);let d=document.createElement("drag-surface");if(d.setAttribute("group",this.#o),d.setAttribute("aria-label",`${a.label} stories`),d.setAttribute("data-layout","stack"),d.setAttribute("data-layout-gap","xs"),a.children.length>0){for(let p of a.children)d.appendChild(p);e+=a.children.length}else{let p=document.createElement("p");p.className="sm-empty",p.textContent="No stories yet",d.appendChild(p)}i.appendChild(d),this.#r.appendChild(i),this.#i[a.id]=d}let r=this.getAttribute("title");if(r){let a=document.createElement("h2");a.className="sm-title",a.textContent=r,this.appendChild(a)}this.#t.appendChild(this.#r),this.appendChild(this.#t),this.#s=document.createElement("div"),this.#s.className="sm-live-region",this.#s.setAttribute("role","status"),this.#s.setAttribute("aria-live","polite"),this.#s.setAttribute("aria-atomic","true"),this.appendChild(this.#s),this.listen(this,"drag-surface:reorder",a=>{let i=a.detail,o=a.target.closest("drag-surface"),n=this.#n(o);n&&(this.#c(n),this.dispatchEvent(new CustomEvent("story-map:reorder",{bubbles:!0,detail:{itemId:i.itemId,activity:n,oldIndex:i.oldIndex,newIndex:i.newIndex}})))}),this.listen(this,"drag-surface:transfer",a=>{let i=a.detail,o=i.fromSurface,n=i.toSurface,l=this.#n(o),d=this.#n(n);if(!l||!d)return;this.#c(l),this.#c(d);let p=n.querySelector(".sm-empty");if(p&&p.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".sm-empty")){let f=document.createElement("p");f.className="sm-empty",f.textContent="No stories yet",o.appendChild(f)}let m=this.#b(i.item);this.#d(`${m} moved from ${l} to ${d}`),this.dispatchEvent(new CustomEvent("story-map:transfer",{bubbles:!0,detail:{itemId:i.itemId,fromActivity:l,toActivity:d,newIndex:i.newIndex}}))});let s=this.getAttribute("src");if(s){this._loadSrc(s);return}this.dispatchEvent(new CustomEvent("story-map:ready",{bubbles:!0,detail:{activityCount:this.#a.length,storyCount:e}}))}teardown(){this.#t&&(this.#t.remove(),this.#t=null),this.#s&&(this.#s.remove(),this.#s=null),this.#r=null,this.#i={},this.#a=[]}get activities(){return this.#a.map(t=>({id:t.id,label:t.label,journeyPhase:t.journeyPhase||void 0,stories:[...this.#i[t.id]?.querySelectorAll(':scope > [draggable="true"]')||[]].map(e=>({id:e.getAttribute("data-id")||void 0,storyId:e.getAttribute("story-id")||void 0,title:e.querySelector('[slot="title"]')?.textContent?.trim()||void 0}))}))}set activities(t){let e=Array.isArray(t)?t:[];for(;this.firstChild;)this.firstChild.remove();for(let s of e){let a=document.createElement("section");a.setAttribute("data-activity",s.id||""),s.label&&a.setAttribute("data-activity-label",s.label),s.journeyPhase&&a.setAttribute("data-journey-phase",s.journeyPhase);for(let i of s.stories||[]){let o,n=this;if(typeof n.renderStory=="function"){let l=n.renderStory(i);o=l instanceof Element?l:null}o||(customElements.get("user-story")?(o=document.createElement("user-story"),o.data=i):(o=document.createElement("article"),o.className="sm-card",o.textContent=i.title||i.id||"")),o.hasAttribute("draggable")||o.setAttribute("draggable","true"),i.id&&!o.hasAttribute("data-id")&&o.setAttribute("data-id",String(i.id)),a.appendChild(o)}this.appendChild(a)}let r=()=>{this.teardown(),this.removeAttribute("data-upgraded"),this.setup()};this.hasAttribute("data-upgraded")&&this.#t?S(this,r,"sm-vt"):r(),this.dispatchEvent(new CustomEvent("story-map:activities-changed",{detail:{activities:e,source:"property"},bubbles:!0}))}attributeChangedCallback(t,e,r){e===r||!this.isConnected||t==="src"&&this._loadSrc(r)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let a of r.activities||[]){let i=document.createElement("section");i.setAttribute("data-activity",a.id),i.setAttribute("data-activity-label",a.label||a.id),a.journeyPhase&&i.setAttribute("data-journey-phase",a.journeyPhase);for(let o of a.stories||[]){let n=document.createElement("user-story");n.setAttribute("draggable","true"),n.dataset.id=o.id||o.storyId,(o.storyId||o.id)&&n.setAttribute("story-id",o.storyId||o.id),o.title&&n.setAttribute("title",o.title),o.persona&&n.setAttribute("persona",o.persona),o.action&&n.setAttribute("action",o.action),o.benefit&&n.setAttribute("benefit",o.benefit),o.priority&&n.setAttribute("priority",o.priority),o.status&&n.setAttribute("status",o.status),o.points&&n.setAttribute("points",String(o.points)),n.setAttribute("detail",o.detail||"compact"),i.appendChild(n)}this.appendChild(i)}let s=()=>{this.teardown(),this.removeAttribute("data-upgraded"),this.setup()};this.hasAttribute("data-upgraded")&&this.#t?S(this,s,"sm-vt"):s()}catch(e){console.warn(`[story-map] Failed to load src="${t}":`,e)}}#n(t){if(!t)return null;for(let[e,r]of Object.entries(this.#i))if(r===t)return e;return null}#c(t){let e=this.#i[t];if(!e)return;let r=e.querySelectorAll(':scope > [draggable="true"]').length,s=e.closest("[data-activity-column]");if(!s)return;let a=s.querySelector(".sm-activity-count");a&&(a.textContent=String(r))}#d(t){this.#s&&(this.#s.textContent="",requestAnimationFrame(()=>{this.#s&&(this.#s.textContent=t)}))}#b(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#m(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("story-map",mt);var Q=`
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
`;function ee(){let c=globalThis.localStorage;if(!c)throw new Error("VBStore: localStorage is not available in this environment");return{async getRaw(t){return c.getItem(t)},async setRaw(t,e){c.setItem(t,e)},async removeRaw(t){c.removeItem(t)},async keys(t){let e=[];for(let r=0;r<c.length;r++){let s=c.key(r);s&&s.startsWith(t)&&e.push(s)}return e}}}var X=null;function I(){return X||(X=ee()),X}function ft(c,t){if(typeof c!="string"||!c)throw new TypeError("VBStore: namespace must be a non-empty string");if(typeof t!="string"||!t)throw new TypeError("VBStore: key must be a non-empty string");return`vb:${c}:${t}`}function Mt(c){if(typeof c!="string"||!c)throw new TypeError("VBStore: namespace must be a non-empty string");return`vb:${c}:`}function zt(c){try{let t=JSON.parse(c);if(t&&typeof t=="object"&&typeof t.timestamp=="number")return t}catch{}return null}var Y={configure(c={}){X=c.backend??null},async set(c,t,e){let r={data:e,timestamp:Date.now()};await I().setRaw(ft(c,t),JSON.stringify(r))},async get(c,t,e){let r=await I().getRaw(ft(c,t));if(r==null)return null;let s=zt(r);return!s||e?.maxAge!=null&&Date.now()-s.timestamp>e.maxAge?null:s.data},async remove(c,t){await I().removeRaw(ft(c,t))},async list(c){let t=Mt(c),e=await I().keys(t),r=[];for(let s of e){let a=await I().getRaw(s);if(a==null)continue;let i=zt(a);i&&r.push({key:s.slice(t.length),data:i.data,timestamp:i.timestamp})}return r},async clear(c){let t=Mt(c),e=await I().keys(t);for(let r of e)await I().removeRaw(r)},async clearAll(){let c=await I().keys("vb:");for(let t of c)await I().removeRaw(t)},async setMany(c,t){for(let[e,r]of t)await Y.set(c,e,r)}};var bt="[data-copy], [data-copy-target], [data-paste-target]",re="Copied to clipboard",se="Pasted from clipboard",gt=new WeakMap;async function yt(c,t={}){if(c==null||c==="")return!1;let{button:e,announceMessage:r=re,duration:s=1500}=t;try{await navigator.clipboard.writeText(c)}catch{return!1}return Nt({button:e,duration:s,announceMessage:r,eventDetail:{text:c}}),!0}function Nt({button:c,duration:t,announceMessage:e,eventDetail:r,state:s="copied",eventName:a="copy"}){if(c){c.dataset.state=s;let i=gt.get(c);i&&clearTimeout(i),gt.set(c,setTimeout(()=>{delete c.dataset.state,gt.delete(c)},t)),c.dispatchEvent(new CustomEvent(a,{bubbles:!0,detail:r}))}oe(e,c??document.body)}async function ae(c,t={}){let{button:e,announceMessage:r=se,duration:s=1500}=t,a;try{a=await navigator.clipboard.readText()}catch{return null}return c&&("value"in c&&(c instanceof HTMLInputElement||c instanceof HTMLTextAreaElement||c instanceof HTMLSelectElement)?c.value=a:c.textContent=a,c.dispatchEvent(new Event("input",{bubbles:!0}))),Nt({button:e,duration:s,announceMessage:r,eventDetail:{text:a},state:"pasted",eventName:"paste"}),a}function Lt(c=document){c.querySelectorAll(bt).forEach(vt)}function vt(c){c.hasAttribute("data-copy-init")||(c.setAttribute("data-copy-init",""),c.addEventListener("click",()=>{if(c.dataset.pasteTarget){let e=document.querySelector(c.dataset.pasteTarget);if(!e)return;ae(e,{button:c});return}let t=ie(c);t&&yt(t,{button:c})}))}function ie(c){if(c.dataset.copy)return c.dataset.copy;if(c.dataset.copyTarget){let t=document.querySelector(c.dataset.copyTarget);if(!t)return"";let e=c.dataset.copyAttr;return e?t.getAttribute(e)??"":t.textContent??""}return""}function oe(c,t){let e=document.createElement("div");e.setAttribute("role","status"),e.setAttribute("aria-live","polite"),e.className="visually-hidden",e.textContent=c,t.appendChild(e),setTimeout(()=>e.remove(),1e3)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>Lt()):Lt();var ne=new MutationObserver(c=>{for(let t of c)for(let e of t.addedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let r=e;r.matches(bt)&&vt(r),r.querySelectorAll(bt).forEach(s=>vt(s))}});ne.observe(document.documentElement,{childList:!0,subtree:!0});var P=class{#e=new Map;async load(){return[...this.#e.values()]}async save(t){return t.id||(t.id=crypto.randomUUID()),this.#e.set(t.id,t),t}async update(t,e){let r=this.#e.get(t);if(!r)throw new Error(`Pin ${t} not found`);return Object.assign(r,e),r}async remove(t){this.#e.delete(t)}},K=class{#e;constructor(t="default"){this.#e=t}async#t(){let t=await Y.get("reviews",this.#e);return Array.isArray(t)?t:[]}async#r(t){await Y.set("reviews",this.#e,t)}async load(){return this.#t()}async save(t){t.id||(t.id=crypto.randomUUID());let e=await this.#t();return e.push(t),await this.#r(e),t}async update(t,e){let r=await this.#t(),s=r.findIndex(a=>a.id===t);if(s===-1)throw new Error(`Pin ${t} not found`);return Object.assign(r[s],e),await this.#r(r),r[s]}async remove(t){let e=(await this.#t()).filter(r=>r.id!==t);await this.#r(e)}},W=class{#e;constructor(t){if(!t)throw new Error("RestAdapter requires an endpoint URL");this.#e=t.replace(/\/$/,"")}async load(){let t=await fetch(this.#e);if(!t.ok)throw new Error(`HTTP ${t.status}`);let e=await t.json();return Array.isArray(e)?e:e.pins||[]}async save(t){let e=await fetch(this.#e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}async update(t,e){let r=await fetch(`${this.#e}/${encodeURIComponent(t)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}async remove(t){let e=await fetch(`${this.#e}/${encodeURIComponent(t)}`,{method:"DELETE"});if(!e.ok)throw new Error(`HTTP ${e.status}`)}},xt=class extends HTMLElement{static get observedAttributes(){return["src","editable","adapter","endpoint","storage-key","author","compact","show-resolved"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__pins=[],this.__adapter=null,this._activePin=null,this._annotating=!1}get pins(){return this.__pins}set pins(t){let e=Array.isArray(t)?t:[];this.__pins!==e&&(this.__pins=e,this.isConnected&&this._render(),this.dispatchEvent(new CustomEvent("review-surface:pins-changed",{detail:{pins:e,source:"property"},bubbles:!0,composed:!0})))}get adapter(){return this.__adapter}set adapter(t){this.__adapter=t,this.isConnected&&this._loadFromAdapter()}#t(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}connectedCallback(){this.#t(),this.setAttribute("data-upgraded",""),this.#r(),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._loadFromAdapter()}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.removeAttribute("data-annotating")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):t==="adapter"||t==="endpoint"||t==="storage-key"?(this.#r(),this._loadFromAdapter()):this._render())}#r(){if(this.__adapter&&!(this.__adapter instanceof P)&&!(this.__adapter instanceof K)&&!(this.__adapter instanceof W))return;switch(this.getAttribute("adapter")||"memory"){case"local":this.__adapter=new K(this.getAttribute("storage-key")||"default");break;case"rest":try{this.__adapter=new W(this.getAttribute("endpoint")??"")}catch{this.__adapter=new P}break;default:this.__adapter=new P}}async _loadSrc(t){if(!(!t||!this.shadowRoot)){this.shadowRoot.innerHTML=`<style>${Q}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();this.__pins=Array.isArray(r)?r:r.pins||[],this._render()}catch(e){let r=e instanceof Error?e.message:String(e);this.shadowRoot.innerHTML=`<style>${Q}</style><div class="state-msg state-msg--error">Could not load pins: ${h(r)}</div>`}}}async _loadFromAdapter(){if(this.__adapter){try{this.__pins=await this.__adapter.load()}catch{this.__pins=[]}this._render()}}async addPin(t){let e={id:crypto.randomUUID(),x:Math.max(0,Math.min(100,t.x)),y:Math.max(0,Math.min(100,t.y)),text:t.text||"",author:t.author||this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString(),resolved:!1,resolvedBy:null,resolvedAt:null,replies:[]};return this.__adapter&&await this.__adapter.save(e),this.__pins.push(e),this._render(),this.#c(`Pin ${this.#i().length} added`),this.dispatchEvent(new CustomEvent("review-surface:add",{bubbles:!0,composed:!0,detail:{pin:e}})),e}async removePin(t){let e=this.__pins.find(r=>r.id===t);e&&(this.__adapter&&await this.__adapter.remove(t),this.__pins=this.__pins.filter(r=>r.id!==t),this._activePin===t&&(this._activePin=null),this._render(),this.#c("Pin removed"),this.dispatchEvent(new CustomEvent("review-surface:remove",{bubbles:!0,composed:!0,detail:{pin:e}})))}async resolvePin(t){let e=this.__pins.find(s=>s.id===t);if(!e)return;let r={resolved:!0,resolvedBy:this.getAttribute("author")||"Anonymous",resolvedAt:new Date().toISOString()};this.__adapter&&await this.__adapter.update(t,r),Object.assign(e,r),this._render(),this.#c("Pin resolved"),this.dispatchEvent(new CustomEvent("review-surface:resolve",{bubbles:!0,composed:!0,detail:{pin:e}}))}async unresolvePin(t){let e=this.__pins.find(s=>s.id===t);if(!e)return;let r={resolved:!1,resolvedBy:null,resolvedAt:null};this.__adapter&&await this.__adapter.update(t,r),Object.assign(e,r),this._render(),this.#c("Pin re-opened"),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:e,changes:r}}))}exportPins(){return structuredClone(this.__pins)}importPins(t){this.__pins=Array.isArray(t)?structuredClone(t):[],this._activePin=null,this._render()}#i(){let t=this.hasAttribute("show-resolved");return this.__pins.filter(e=>t||!e.resolved).sort((e,r)=>new Date(e.createdAt??0).getTime()-new Date(r.createdAt??0).getTime())}_render(){if(!this.shadowRoot)return;let t=this.hasAttribute("editable"),e=this.#i(),r=this._activePin?this.__pins.find(s=>s.id===this._activePin):null;this.setAttribute("pin-count",String(e.length)),this.shadowRoot.innerHTML=`<style>${Q}</style>
      <div class="rs-container">
        <slot></slot>
        <div class="rs-overlay" role="img" aria-label="Review annotation surface">
          ${e.map((s,a)=>this._renderPin(s,a+1)).join("")}
        </div>
        ${r?this._renderPopover(r,t):""}
      </div>
      ${t?this._renderToolbar(e.length):""}
      <div class="rs-live" aria-live="polite" aria-atomic="true"></div>`,this._bindListeners(t),this.dispatchEvent(new CustomEvent("review-surface:ready",{bubbles:!0,composed:!0,detail:{pinCount:e.length}}))}_renderPin(t,e){let r=t.text?t.text.slice(0,50):"Empty pin";return`<button class="rs-pin"
      data-pin-id="${h(t.id)}"
      ${t.resolved?"data-resolved":""}
      ${this._activePin===t.id?"data-active":""}
      style="left:${t.x}%;top:${t.y}%"
      aria-label="Pin ${e}: ${h(r)}"
      aria-expanded="${this._activePin===t.id}"
      aria-haspopup="dialog">
      <span class="rs-pin__number">${e}</span>
    </button>`}_renderPopover(t,e){let r=this.#i().findIndex(s=>s.id===t.id)+1;return`<div class="rs-popover" data-open
      style="left:${Math.min(t.x,70)}%;top:${t.y}%"
      role="dialog"
      aria-labelledby="rs-popover-title-${h(t.id)}">

      <div class="rs-popover__header">
        <span class="rs-popover__title" id="rs-popover-title-${h(t.id)}">
          Pin ${r}
          ${t.resolved?`<span class="rs-resolved-badge">${A(k.checkCircle)} Resolved</span>`:""}
        </span>
        <div class="rs-popover__actions">
          ${e&&!t.resolved?`
            <button class="rs-popover__btn rs-popover__btn--resolve" data-action="resolve" data-pin-id="${h(t.id)}"
              aria-label="Resolve pin" title="Resolve">${A(k.checkCircle)}</button>`:""}
          ${e&&t.resolved?`
            <button class="rs-popover__btn" data-action="unresolve" data-pin-id="${h(t.id)}"
              aria-label="Re-open pin" title="Re-open">${A(k.messageCircle)}</button>`:""}
          ${e?`
            <button class="rs-popover__btn rs-popover__btn--delete" data-action="delete" data-pin-id="${h(t.id)}"
              aria-label="Delete pin" title="Delete">${A(k.x)}</button>`:""}
          <button class="rs-popover__btn" data-action="close"
            aria-label="Close">${A(k.x)}</button>
        </div>
      </div>

      <div class="rs-comment">
        <div class="rs-comment__meta">
          <span class="rs-comment__avatar" style="background:${L(t.author||"Anonymous")}">${z(t.author||"Anonymous")}</span>
          <span class="rs-comment__author">${h(t.author||"Anonymous")}</span>
          <span class="rs-comment__time">${this.#n(t.createdAt)}</span>
        </div>
        <div class="rs-comment__text">${h(t.text)}</div>
      </div>

      ${t.replies?.length?`
        <div class="rs-replies">
          ${t.replies.map(s=>`
            <div class="rs-reply">
              <div class="rs-comment__meta">
                <span class="rs-comment__avatar" style="background:${L(s.author||"Anonymous")}">${z(s.author||"Anonymous")}</span>
                <span class="rs-comment__author">${h(s.author||"Anonymous")}</span>
                <span class="rs-comment__time">${this.#n(s.createdAt)}</span>
              </div>
              <div class="rs-comment__text">${h(s.text)}</div>
            </div>
          `).join("")}
        </div>`:""}

      ${e?`
        <div class="rs-input">
          <textarea class="rs-input__field" placeholder="Reply\u2026" rows="1"
            aria-label="Reply to pin ${r}"></textarea>
          <button class="rs-input__submit" data-action="reply" data-pin-id="${h(t.id)}"
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
    </div>`}_bindListeners(t){let e=this.shadowRoot;if(!e)return;e.querySelectorAll(".rs-pin").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();let o=a.dataset.pinId??null;this._activePin=this._activePin===o?null:o,this._render(),this._activePin&&this.dispatchEvent(new CustomEvent("review-surface:select",{bubbles:!0,composed:!0,detail:{pin:this.__pins.find(n=>n.id===o)}}))})});let r=e.querySelector(".rs-overlay");r&&t&&r.addEventListener("click",a=>{if(!this._annotating)return;let i=a;if(i.target?.closest(".rs-pin"))return;let n=r.getBoundingClientRect(),l=(i.clientX-n.left)/n.width*100,d=(i.clientY-n.top)/n.height*100;this.#s(l,d)}),e.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();let o=a.dataset.action,n=a.dataset.pinId;switch(o){case"close":this._activePin=null,this._render();break;case"resolve":n&&this.resolvePin(n);break;case"unresolve":n&&this.unresolvePin(n);break;case"delete":n&&this.removePin(n);break;case"toggle-mode":this._annotating=!this._annotating,this._annotating?this.setAttribute("data-annotating",""):this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:this._annotating?"annotate":"view"}}));break;case"export":this.#a();break;case"reply":this.#o(n);break}})});let s=e.querySelector(".rs-input__field");s&&s.addEventListener("keydown",a=>{let i=a;if(i.key==="Enter"&&!i.shiftKey){i.preventDefault();let n=e.querySelector('[data-action="reply"]')?.dataset.pinId;n&&this.#o(n)}}),e.addEventListener("keydown",a=>{a.key==="Escape"&&(this._activePin?(this._activePin=null,this._render()):this._annotating&&(this._annotating=!1,this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:"view"}}))))})}async#s(t,e){let r=this.getAttribute("author")||"Anonymous",s=await this.addPin({x:t,y:e,text:"",author:r});this._activePin=s.id,this._render(),requestAnimationFrame(()=>{(this.shadowRoot?.querySelector(".rs-input__field")??null)?.focus()})}async#o(t){let e=this.shadowRoot?.querySelector(".rs-input__field")??null;if(!e)return;let r=e.value.trim();if(!r)return;let s=this.__pins.find(i=>i.id===t);if(!s)return;let a={id:crypto.randomUUID(),text:r,author:this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString()};s.replies||(s.replies=[]),s.text?(s.replies.push(a),this.__adapter&&await this.__adapter.update(t,{replies:s.replies})):(s.text=r,this.__adapter&&await this.__adapter.update(t,{text:r})),this._render(),this.#c("Reply added"),requestAnimationFrame(()=>{(this.shadowRoot?.querySelector(".rs-input__field")??null)?.focus()}),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:s,changes:{replies:s.replies}}}))}async#a(){let t=JSON.stringify(this.exportPins(),null,2);if(await yt(t,{announceMessage:"Pins copied to clipboard"}))return;let r=new Blob([t],{type:"application/json"}),s=URL.createObjectURL(r),a=document.createElement("a");a.href=s,a.download="review-pins.json",a.click(),URL.revokeObjectURL(s),this.#c("Pins exported as file")}#n(t){if(!t)return"";try{let e=new Date(t),s=new Date().getTime()-e.getTime(),a=Math.floor(s/6e4);if(a<1)return"just now";if(a<60)return`${a}m ago`;let i=Math.floor(a/60);if(i<24)return`${i}h ago`;let o=Math.floor(i/24);return o<7?`${o}d ago`:e.toLocaleDateString()}catch{return""}}#c(t){let e=this.shadowRoot?.querySelector(".rs-live");e&&(e.textContent=t)}};x("review-surface",xt);var N=864e5,wt=N*7,G=N*30,ce=N*91,Pt=N*365;function j(c){return typeof c=="number"?c:new Date(c).getTime()}function de(c){return c<=wt*3?t=>t.toLocaleDateString(void 0,{month:"short",day:"numeric"}):c<=G*3?t=>t.toLocaleDateString(void 0,{month:"short",day:"numeric"}):c<=Pt?t=>t.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):t=>t.toLocaleDateString(void 0,{year:"numeric"})}function le(c){return c<=wt*3?"day":c<=G*3?"week":c<=Pt?"month":"quarter"}function Dt(c){return String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var _t=class c extends C{static get observedAttributes(){return["src","title","view","show-today","show-progress","show-dependencies","compact"]}#e=null;#t=null;#r=null;#i=[];#s=0;#o=0;#a=0;setup(){let t=this.querySelector(":scope > table");return!t||(this.#i=this.#d(t),this.#i.length===0)?!1:(this.#s=Math.min(...this.#i.map(e=>e.start)),this.#o=Math.max(...this.#i.map(e=>e.end)),this.#a=this.#o-this.#s,this.#a<=0&&(this.#a=N),this.#b(t),this.dispatchEvent(new CustomEvent("gantt-chart:ready",{bubbles:!0,detail:{taskCount:this.#i.length,dateRange:{start:new Date(this.#s).toISOString(),end:new Date(this.#o).toISOString()}}})),!0)}teardown(){this.#r&&(this.#r.remove(),this.#r=null),this.#e&&(this.#e.remove(),this.#e=null),this.#t&&(this.#t.remove(),this.#t=null);let t=this.querySelector("table.gc-sr-only");t&&t.classList.remove("gc-sr-only"),this.#i=[]}static#n=0;attributeChangedCallback(t,e,r){e===r||!this.isConnected||(t==="src"?this._loadSrc(r):this.hasAttribute("data-upgraded")&&this.#c())}#c(){let t=()=>{this.teardown(),this.removeAttribute("data-upgraded"),this.setup()};if(this.hasAttribute("data-upgraded")&&"startViewTransition"in document&&!matchMedia("(prefers-reduced-motion: reduce)").matches){let e=`gc-vt-${++c.#n}`;this.style.viewTransitionName=e,document.startViewTransition(t).finished.finally(()=>{this.style.viewTransitionName=""})}else t()}get tasks(){return this.#i}set tasks(t){let e=(t||[]).map((r,s)=>({id:r.id??`gc-task-${s}`,name:r.name??`Task ${s+1}`,start:typeof r.start=="number"?r.start:j(r.start),end:typeof r.end=="number"?r.end:r.end!=null?j(r.end):typeof r.start=="number"?r.start:j(r.start),progress:r.progress??0,group:r.group??null,depends:Array.isArray(r.depends)?r.depends:r.depends?String(r.depends).split(",").map(a=>a.trim()):[],status:r.status??null,assignee:r.assignee??null,milestone:!!r.milestone,color:r.color??null,storyIds:r.storyIds??[],itemIds:r.itemIds??[]}));if((this.#e||this.#r||this.#t)&&(this.#r&&(this.#r.remove(),this.#r=null),this.#e&&(this.#e.remove(),this.#e=null),this.#t&&(this.#t.remove(),this.#t=null)),this.#i=e,e.length>0){this.#s=Math.min(...e.map(s=>s.start)),this.#o=Math.max(...e.map(s=>s.end)),this.#a=this.#o-this.#s,this.#a<=0&&(this.#a=N);let r=this.querySelector(":scope > table");r||(r=document.createElement("table"),r.classList.add("gc-sr-only"),this.appendChild(r)),this.#b(r)}this.dispatchEvent(new CustomEvent("gantt-chart:tasks-changed",{detail:{tasks:e,source:"property"},bubbles:!0}))}#d(t){let e=t.querySelectorAll("tbody tr"),r=[];for(let s=0;s<e.length;s++){let a=e[s],i=a.querySelectorAll("time[datetime]");if(i.length<2&&!a.hasAttribute("data-milestone"))continue;let o=i[0]?.getAttribute("datetime"),n=i.length>1?i[1].getAttribute("datetime"):o;if(!o)continue;let l=a.querySelector("progress"),d=l?l.value/(l.max||100):0,p=a.cells[0]?.textContent?.trim()||`Task ${s+1}`;r.push({id:a.dataset.taskId||`gc-task-${s}`,name:p,start:j(o),end:j(n),progress:d,group:a.dataset.group||null,depends:a.dataset.depends?a.dataset.depends.split(",").map(u=>u.trim()):[],status:a.dataset.status||null,assignee:a.dataset.assignee||null,milestone:a.hasAttribute("data-milestone"),color:a.dataset.color||null,storyIds:a.dataset.storyIds?a.dataset.storyIds.split(",").map(u=>u.trim()):[],itemIds:a.dataset.itemIds?a.dataset.itemIds.split(",").map(u=>u.trim()):[]})}return r}#b(t){let e=this.getAttribute("title"),r=this.hasAttribute("show-today"),s=this.hasAttribute("show-progress"),a=this.hasAttribute("show-dependencies");e&&(this.#r=document.createElement("h2"),this.#r.className="gc-title",this.#r.textContent=e,this.insertBefore(this.#r,t)),this.#e=document.createElement("div"),this.#e.className="gc-container",this.#e.setAttribute("role","region"),this.#e.setAttribute("aria-label",`Gantt chart${e?": "+e:""}`);let i=this.#m();this.#e.appendChild(i);let o=document.createElement("div");o.className="gc-body";let n=document.createElement("div");n.className="gc-task-list";let l=document.createElement("div");l.className="gc-bars";let d=this.#f();l.appendChild(d);let p=this.#v();for(let[u,m]of p){if(p.size>1&&u){let f=document.createElement("div");f.className="gc-group-header";let g=document.createElement("span");g.className="gc-group-label",g.textContent=u,f.appendChild(g),n.appendChild(f);let v=document.createElement("div");v.className="gc-group-spacer",l.appendChild(v)}for(let f of m){let g=document.createElement("div");g.className="gc-task-row",g.setAttribute("data-task-id",f.id);let v=document.createElement("span");v.className="gc-task-name",v.textContent=f.name,g.appendChild(v);let y=document.createElement("span");y.className="gc-task-dates",y.textContent=`${new Date(f.start).toLocaleDateString()} to ${new Date(f.end).toLocaleDateString()}`,g.appendChild(y),n.appendChild(g);let _=document.createElement("div");_.className="gc-bar-row",f.milestone?_.appendChild(this.#h(f)):_.appendChild(this.#l(f,s)),l.appendChild(_)}}if(r){let u=this.#y();u&&l.appendChild(u)}a&&requestAnimationFrame(()=>{let u=this.#g(l);u&&l.appendChild(u)}),o.appendChild(n),o.appendChild(l),this.#e.appendChild(o),this.insertBefore(this.#e,t),t.classList.add("gc-sr-only"),this.#t=document.createElement("div"),this.#t.className="gc-sr-only",this.#t.setAttribute("role","status"),this.#t.setAttribute("aria-live","polite"),this.#t.setAttribute("aria-atomic","true"),this.appendChild(this.#t),this.listen(this.#e,"click",u=>{let m=u.target.closest(".gc-bar, .gc-milestone");if(!m)return;let f=m.dataset.taskId,g=this.#i.find(v=>v.id===f);g&&(this.#x(`Selected: ${g.name}`),this.dispatchEvent(new CustomEvent("gantt-chart:task-click",{bubbles:!0,detail:{task:g}})))}),this.listen(this.#e,"keydown",u=>{let m=u;if(m.key==="Enter"||m.key===" "){let f=m.target.closest(".gc-bar, .gc-milestone");f&&(m.preventDefault(),f.click())}})}#m(){let t=document.createElement("div");t.className="gc-timeline-header";let e=document.createElement("div");e.className="gc-timeline-spacer",t.appendChild(e);let r=document.createElement("div");r.className="gc-timeline-dates";let s=this.#u();for(let{position:a,text:i}of s){let o=document.createElement("span");o.className="gc-date-label",o.style.left=`${a}%`,o.textContent=i,r.appendChild(o)}return t.appendChild(r),t}#u(){let t=this.getAttribute("view")||"auto",e=t==="auto"?le(this.#a):t,r=de(this.#a),s=[],a;switch(e){case"day":a=N;break;case"week":a=wt;break;case"month":a=G;break;case"quarter":a=ce;break;default:a=G}let i=new Date(this.#s);if(e==="week"){let l=i.getDay(),d=l===0?1:l===1?0:8-l;i.setDate(i.getDate()+d)}else if(e==="month")i.setDate(1),i.getTime()<this.#s&&i.setMonth(i.getMonth()+1);else if(e==="quarter"){let l=i.getMonth(),d=Math.ceil((l+1)/3)*3;i.setMonth(d),i.setDate(1)}let o=i.getTime();o>this.#s+a*.5&&s.push({position:0,text:r(new Date(this.#s))});let n=o;for(;n<=this.#o;){let l=(n-this.#s)/this.#a*100;if(l>=0&&l<=100&&s.push({position:l,text:r(new Date(n))}),e==="month"){let d=new Date(n);d.setMonth(d.getMonth()+1),n=d.getTime()}else if(e==="quarter"){let d=new Date(n);d.setMonth(d.getMonth()+3),n=d.getTime()}else n+=a}return s}#f(){let t=document.createElement("div");t.className="gc-grid-lines";let e=this.#u();for(let{position:r}of e){if(r<=0)continue;let s=document.createElement("div");s.className="gc-grid-line",s.style.left=`${r}%`,t.appendChild(s)}return t}#v(){let t=new Map;for(let e of this.#i){let r=e.group||"";t.has(r)||t.set(r,[]),t.get(r)?.push(e)}return t}#l(t,e){let r=(t.start-this.#s)/this.#a*100,s=(t.end-t.start)/this.#a*100,a=document.createElement("div");if(a.className="gc-bar",a.setAttribute("data-task-id",t.id),a.setAttribute("role","img"),a.setAttribute("tabindex","0"),a.setAttribute("aria-label",`${Dt(t.name)}: ${new Date(t.start).toLocaleDateString()} to ${new Date(t.end).toLocaleDateString()}`+(t.progress>0?`, ${Math.round(t.progress*100)}% complete`:"")),a.style.left=`${r}%`,a.style.width=`${Math.max(s,.5)}%`,t.status&&a.setAttribute("data-status",t.status),t.color&&a.style.setProperty("--gc-bar-color",t.color),e&&t.progress>0){let i=document.createElement("div");i.className="gc-bar-fill",i.style.width=`${Math.round(t.progress*100)}%`,a.appendChild(i)}if(s>8){let i=document.createElement("span");i.className="gc-bar-label",i.textContent=t.name,a.appendChild(i)}return a}#h(t){let e=(t.start-this.#s)/this.#a*100,r=document.createElement("div");return r.className="gc-milestone",r.setAttribute("data-task-id",t.id),r.setAttribute("role","img"),r.setAttribute("tabindex","0"),r.setAttribute("aria-label",`Milestone: ${Dt(t.name)}, ${new Date(t.start).toLocaleDateString()}`),r.style.left=`${e}%`,t.status&&r.setAttribute("data-status",t.status),t.color&&r.style.setProperty("--gc-bar-color",t.color),r}#y(){let t=Date.now();if(t<this.#s||t>this.#o)return null;let e=(t-this.#s)/this.#a*100,r=document.createElement("div");r.className="gc-today-line",r.style.left=`${e}%`;let s=document.createElement("span");return s.className="gc-today-label",s.textContent="Today",r.appendChild(s),r}#g(t){if(!this.#i.some(n=>n.depends.length>0))return null;let r="http://www.w3.org/2000/svg",s=document.createElementNS(r,"svg");s.setAttribute("class","gc-deps"),s.style.width="100%",s.style.height="100%";let a=document.createElementNS(r,"defs"),i=document.createElementNS(r,"marker");i.setAttribute("id","gc-arrowhead"),i.setAttribute("markerWidth","8"),i.setAttribute("markerHeight","6"),i.setAttribute("refX","8"),i.setAttribute("refY","3"),i.setAttribute("orient","auto");let o=document.createElementNS(r,"polygon");o.setAttribute("points","0 0, 8 3, 0 6"),o.setAttribute("fill","var(--color-text-muted, #666666)"),i.appendChild(o),a.appendChild(i),s.appendChild(a);for(let n of this.#i)for(let l of n.depends){let d=this.#i.find(w=>w.id===l);if(!d)continue;let p=(d.end-this.#s)/this.#a*100,u=(n.start-this.#s)/this.#a*100,m=this.#p(d.id,t),f=this.#p(n.id,t);if(m===-1||f===-1)continue;let g=36,v=m*g+g/2,y=f*g+g/2,_=document.createElementNS(r,"path"),b=p+(u-p)/2;_.setAttribute("d",`M ${p}% ${v} C ${b}% ${v}, ${b}% ${y}, ${u}% ${y}`),_.setAttribute("class","gc-dep-line"),s.appendChild(_)}return s}#p(t,e){let r=e.querySelectorAll(".gc-bar-row");for(let s=0;s<r.length;s++){let a=r[s].querySelector("[data-task-id]");if(a&&a.dataset.taskId===t)return s}return-1}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let r=await e.json();for(;this.firstChild;)this.firstChild.remove();let s=document.createElement("table"),a=document.createElement("thead"),i=document.createElement("tr");for(let n of["Task","Start","End","Progress"]){let l=document.createElement("th");l.textContent=n,i.appendChild(l)}a.appendChild(i),s.appendChild(a);let o=document.createElement("tbody");for(let n of r.tasks||[]){let l=document.createElement("tr");n.id&&(l.dataset.taskId=n.id),n.group&&(l.dataset.group=n.group),n.depends&&(l.dataset.depends=Array.isArray(n.depends)?n.depends.join(","):n.depends),n.status&&(l.dataset.status=n.status),n.assignee&&(l.dataset.assignee=n.assignee),n.milestone&&l.setAttribute("data-milestone",""),n.color&&(l.dataset.color=n.color),n.storyIds&&(l.dataset.storyIds=Array.isArray(n.storyIds)?n.storyIds.join(","):n.storyIds),n.itemIds&&(l.dataset.itemIds=Array.isArray(n.itemIds)?n.itemIds.join(","):n.itemIds);let d=document.createElement("td");d.textContent=n.name||"",l.appendChild(d);let p=document.createElement("td"),u=document.createElement("time");u.setAttribute("datetime",n.start),u.textContent=new Date(n.start).toLocaleDateString(void 0,{month:"short",day:"numeric"}),p.appendChild(u),l.appendChild(p);let m=document.createElement("td"),f=document.createElement("time");f.setAttribute("datetime",n.end||n.start),f.textContent=new Date(n.end||n.start).toLocaleDateString(void 0,{month:"short",day:"numeric"}),m.appendChild(f),l.appendChild(m);let g=document.createElement("td"),v=document.createElement("progress");v.value=n.progress||0,v.max=100,v.textContent=`${n.progress||0}%`,g.appendChild(v),l.appendChild(g),o.appendChild(l)}s.appendChild(o),this.appendChild(s),r.title&&this.setAttribute("title",r.title),this.#c()}catch(e){console.warn(`[gantt-chart] Failed to load src="${t}":`,e)}}#x(t){this.#t&&(this.#t.textContent="",requestAnimationFrame(()=>{this.#t&&(this.#t.textContent=t)}))}};x("gantt-chart",_t);var R=`
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
`;var jt={task:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>',bug:'<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',chore:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',spike:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',feature:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'},At={critical:{label:"Critical",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"},high:{label:"High",color:"#ea580c",bg:"rgba(234, 88, 12, 0.1)"},medium:{label:"Medium",color:"#ca8a04",bg:"rgba(202, 138, 4, 0.1)"},low:{label:"Low",color:"#16a34a",bg:"rgba(22, 163, 74, 0.1)"}},kt={backlog:{label:"Backlog",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"},"to-do":{label:"To Do",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},"in-progress":{label:"In Progress",color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.1)"},review:{label:"Review",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},done:{label:"Done",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"},blocked:{label:"Blocked",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"}},Ct=class extends HTMLElement{static get observedAttributes(){return["item-id","type","priority","status","estimate","assignee","story-ids","detail","compact","src"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#t(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#e.get(t)||""}connectedCallback(){this.#t(),this.itemId&&!this.id&&(this.id=this.itemId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#r(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,r){e!==r&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(r):this.#r())}get itemId(){return this.getAttribute("item-id")||""}get itemTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#e.get("title")||""}get itemType(){return this.getAttribute("type")||"task"}get priority(){return this.getAttribute("priority")||"medium"}get status(){return this.getAttribute("status")||"backlog"}get estimate(){return this.getAttribute("estimate")||""}get assignee(){return this.getAttribute("assignee")||""}get storyIds(){let t=this.getAttribute("story-ids")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}get _minimalLabel(){return this.itemTitle||this.itemId||"Work item"}updateStatus(t){kt[t]&&(this.setAttribute("status",t),this.dispatchEvent(new CustomEvent("work-item:status",{detail:{status:t,itemId:this.itemId},bubbles:!0,composed:!0})))}updatePriority(t){At[t]&&(this.setAttribute("priority",t),this.dispatchEvent(new CustomEvent("work-item:priority",{detail:{priority:t,itemId:this.itemId},bubbles:!0,composed:!0})))}get data(){return{itemId:this.itemId||void 0,type:this.itemType,priority:this.priority,status:this.status,estimate:this.estimate||void 0,assignee:this.assignee||void 0,storyIds:this.storyIds.length?this.storyIds:void 0,detail:this.getAttribute("detail")||void 0,title:this.itemTitle||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.shadowRoot&&this.#r(),this.dispatchEvent(new CustomEvent("work-item:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let[e,r]of[["itemId","item-id"],["type","type"],["priority","priority"],["status","status"],["estimate","estimate"],["assignee","assignee"],["detail","detail"]])t[e]!=null&&this.setAttribute(r,String(t[e]));if(t.storyIds&&this.setAttribute("story-ids",Array.isArray(t.storyIds)?t.storyIds.join(","):String(t.storyIds)),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=String(t.title),this.appendChild(e)}for(let e of["description","notes"])if(t[e]&&!this.querySelector(`[slot="${e}"]`)){let r=document.createElement("p");r.slot=e,r.textContent=String(t[e]),this.appendChild(r)}if(t.checklist&&!this.querySelector('[slot="checklist"]')){let e=document.createElement("ul");e.slot="checklist";let r=Array.isArray(t.checklist)?t.checklist:[t.checklist];for(let s of r){let a=document.createElement("li");a.textContent=String(s),e.appendChild(a)}this.appendChild(e)}}async _loadSrc(t){if(!t)return;let e=this.shadowRoot;e.innerHTML=`<style>${R}</style><div class="state-msg">Loading\u2026</div>`;try{let r=await fetch(t);if(!r.ok)throw new Error(`HTTP ${r.status}`);let s=await r.json();this._applyData(s),this.#r()}catch(r){e.innerHTML=`<style>${R}</style><div class="state-msg state-msg--error">Could not load: ${h(r.message)}</div>`}}#r(){let t=this.shadowRoot,e=At[this.priority]||At.medium,r=kt[this.status]||kt.backlog,s=this.itemType,a=jt[s]||jt.task,i=this._detailLevel,o=this.itemId?`Work item: ${h(this.itemId)}`:"Work item";if(i==="minimal"){t.innerHTML=`<style>${R}</style>
        <article class="wi-card wi-card--minimal" role="article" aria-label="${o}"
          tabindex="0">
          <div class="wi-body">
            <div class="wi-meta">
              ${this.itemId?`<span class="wi-id">${h(this.itemId)}</span>`:""}
              <span class="wi-type" data-type="${h(s)}">${A(a)} ${h(s)}</span>
            </div>
            <div class="wi-title-wrap">
              <slot name="title"><span class="wi-title-fallback">${h(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;return}if(t.innerHTML=`<style>${R}</style>
      <article class="wi-card wi-card--${i}" role="article" aria-label="${o}">

        <header class="wi-header">
          <div class="wi-meta">
            ${this.itemId?`<span class="wi-id">${h(this.itemId)}</span>`:""}
            <span class="wi-type" data-type="${h(s)}">${A(a)} ${h(s)}</span>
          </div>
          <div class="wi-badges">
            <span class="wi-priority" style="color:${e.color};background:${e.bg}">${h(e.label)}</span>
            <span class="wi-status" style="color:${r.color};background:${r.bg}">${h(r.label)}</span>
            ${this.estimate?`<span class="wi-estimate" title="Estimate">${h(this.estimate)}</span>`:""}
          </div>
        </header>

        <div class="wi-body">
          <div class="wi-title-wrap">
            <slot name="title"><span class="wi-title-fallback">[Untitled work item]</span></slot>
          </div>

          ${this.assignee?`
            <div class="wi-assignee">
              <span class="wi-assignee__avatar" style="background:${L(this.assignee)}">${z(this.assignee)}</span>
              ${h(this.assignee)}
            </div>`:""}

          ${this.storyIds.length?`
            <div class="wi-links">
              ${this.storyIds.map(n=>`<a class="wi-link" href="#${h(n)}">${A('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/>')} ${h(n)}</a>`).join("")}
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

      </article>`,i==="compact")for(let n of t.querySelectorAll(".wi-section")){let l=n.querySelector("slot");l&&l.assignedNodes().length===0&&n.setAttribute("data-empty","")}this.dispatchEvent(new CustomEvent("work-item:ready",{detail:{itemId:this.itemId,title:this.itemTitle,type:s,priority:this.priority,status:this.status},bubbles:!0,composed:!0}))}};x("work-item",Ct);var O=`
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
`;var Rt={proposed:{label:"Proposed",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},accepted:{label:"Accepted",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"},deprecated:{label:"Deprecated",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},superseded:{label:"Superseded",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"}},D={calendar:'<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',context:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',decision:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',consequences:'<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',arrowRight:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'},Et=class extends HTMLElement{static get observedAttributes(){return["adr-id","status","supersedes","superseded-by","detail","compact","src"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#t(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#e.set(e,t.textContent.trim())}}connectedCallback(){this.#t(),this.adrId&&!this.id&&(this.id=this.adrId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#r(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,r){e!==r&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(r):this.#r())}get adrId(){return this.getAttribute("adr-id")||""}get status(){return this.getAttribute("status")||"proposed"}get adrTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#e.get("title")||""}get adrDate(){let t=this.querySelector('[slot="date"]');return t?.getAttribute("datetime")||t?.textContent?.trim()||this.#e.get("date")||""}get supersedes(){let t=this.getAttribute("supersedes")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get supersededBy(){let t=this.getAttribute("superseded-by")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}get _minimalLabel(){return this.adrTitle||this.adrId||"ADR"}get data(){return{adrId:this.adrId||void 0,status:this.status,detail:this.getAttribute("detail")||void 0,supersedes:this.supersedes.length?this.supersedes:void 0,supersededBy:this.supersededBy.length?this.supersededBy:void 0,title:this.adrTitle||void 0,date:this.adrDate||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.#t(),this.shadowRoot&&this.#r(),this.dispatchEvent(new CustomEvent("adr-wc:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){if(t.adrId!=null&&this.setAttribute("adr-id",String(t.adrId)),t.status!=null&&this.setAttribute("status",String(t.status)),t.detail!=null&&this.setAttribute("detail",String(t.detail)),t.supersedes&&this.setAttribute("supersedes",Array.isArray(t.supersedes)?t.supersedes.join(","):String(t.supersedes)),t.supersededBy&&this.setAttribute("superseded-by",Array.isArray(t.supersededBy)?t.supersededBy.join(","):String(t.supersededBy)),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=String(t.title),this.appendChild(e)}if(t.date&&!this.querySelector('[slot="date"]')){let e=document.createElement("time");e.slot="date",e.setAttribute("datetime",String(t.date)),e.textContent=new Date(String(t.date)).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"}),this.appendChild(e)}for(let e of["context","decision"])if(t[e]&&!this.querySelector(`[slot="${e}"]`)){let r=document.createElement("p");r.slot=e,r.textContent=String(t[e]),this.appendChild(r)}if(t.consequences&&!this.querySelector('[slot="consequences"]')){let e=document.createElement("ul");e.slot="consequences";let r=Array.isArray(t.consequences)?t.consequences:[t.consequences];for(let s of r){let a=document.createElement("li");a.textContent=String(s),e.appendChild(a)}this.appendChild(e)}}async _loadSrc(t){if(!t)return;let e=this.shadowRoot;e.innerHTML=`<style>${O}</style><div class="state-msg">Loading\u2026</div>`;try{let r=await fetch(t);if(!r.ok)throw new Error(`HTTP ${r.status}`);let s=await r.json();this._applyData(s),this.#t(),this.#r()}catch(r){e.innerHTML=`<style>${O}</style><div class="state-msg state-msg--error">Could not load: ${h(r.message)}</div>`}}#r(){let t=this.shadowRoot,e=Rt[this.status]||Rt.proposed,r=this._detailLevel,s=this.adrId?`ADR: ${h(this.adrId)}`:"Architectural Decision Record",a=!!this.querySelector('[slot="date"]')||this.#e.has("date");if(r==="minimal"){t.innerHTML=`<style>${O}</style>
        <article class="adr-card adr-card--minimal" role="article" aria-label="${s}"
          tabindex="0">
          <div class="adr-body">
            <div class="adr-meta">
              ${this.adrId?`<span class="adr-id">${h(this.adrId)}</span>`:""}
              <span class="adr-status" style="color:${e.color};background:${e.bg}">${h(e.label)}</span>
            </div>
            <div class="adr-title-wrap">
              <slot name="title"><span class="adr-title-fallback">${h(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;return}if(t.innerHTML=`<style>${O}</style>
      <article class="adr-card adr-card--${r}" role="article" aria-label="${s}">

        <header class="adr-header">
          <div class="adr-meta">
            ${this.adrId?`<span class="adr-id">${h(this.adrId)}</span>`:""}
            ${a?`<span class="adr-date-wrap">${A(D.calendar)} <slot name="date"></slot></span>`:""}
          </div>
          <div class="adr-badges">
            <span class="adr-status" style="color:${e.color};background:${e.bg}">${h(e.label)}</span>
          </div>
        </header>

        <div class="adr-body">
          <div class="adr-title-wrap">
            <slot name="title"><span class="adr-title-fallback">[Untitled ADR]</span></slot>
          </div>

          ${this.supersedes.length?`
            <div class="adr-links">
              <span class="adr-links-label">Supersedes</span>
              ${this.supersedes.map(i=>`<a class="adr-link" href="#${h(i)}">${A(D.arrowRight)} ${h(i)}</a>`).join("")}
            </div>`:""}

          ${this.supersededBy.length?`
            <div class="adr-links">
              <span class="adr-links-label">Superseded by</span>
              ${this.supersededBy.map(i=>`<a class="adr-link" href="#${h(i)}">${A(D.arrowRight)} ${h(i)}</a>`).join("")}
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

      </article>`,r==="compact")for(let i of t.querySelectorAll(".adr-section")){let o=i.querySelector("slot");o&&o.assignedNodes().length===0&&i.setAttribute("data-empty","")}this.dispatchEvent(new CustomEvent("adr-wc:ready",{detail:{adrId:this.adrId,title:this.adrTitle,status:this.status},bubbles:!0,composed:!0}))}};x("adr-wc",Et);
//# sourceMappingURL=ux-planning.full.js.map
