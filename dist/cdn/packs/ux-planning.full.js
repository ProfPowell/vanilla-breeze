var Ht=window.matchMedia("(prefers-reduced-motion: reduce)");var ft=new Map;function x(d,t,e={}){let s=e.priority??10,r={impl:t,bundle:e.bundle,contract:e.contract,priority:s},a=ft.get(d);if(customElements.get(d)){if(!a||a.priority>=s){a&&a.priority===s&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${d}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${d}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=s){a.priority===s&&console.warn(`[VB Bundle] Tag <${d}> already registered by "${a.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}ft.set(d,r),customElements.define(d,t)}var A=class extends HTMLElement{#t=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,s,r){t.addEventListener(e,s,r),this.#t.push(()=>t.removeEventListener(e,s,r))}setup(){}teardown(){}};var V=class d extends A{#t=null;#e=null;#s=!1;#r=null;setup(){this.setAttribute("role","list"),this.#s=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.#o(),this.#l(),this.#v(),this.#a()}teardown(){this.#t&&(this.#t.remove(),this.#t=null),d.#A?.source===this&&(d.#A=null)}get draggableChildren(){return[...this.querySelectorAll(':scope > [draggable="true"]')]}get group(){return this.getAttribute("group")||null}get orientation(){return this.getAttribute("orientation")||"vertical"}get sortedOrder(){return this.draggableChildren.map(t=>t.dataset.id)}#a(){for(let t of this.draggableChildren)t.getAttribute("role")||t.setAttribute("role","listitem"),t.hasAttribute("tabindex")||t.setAttribute("tabindex","0"),t.hasAttribute("aria-grabbed")||t.setAttribute("aria-grabbed","false")}#o(){this.#t=document.createElement("div"),this.#t.setAttribute("role","status"),this.#t.setAttribute("aria-live","polite"),this.#t.setAttribute("aria-atomic","true"),this.#t.style.cssText="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);",this.prepend(this.#t)}#i(t){let e=this.#t;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#l(){this.listen(this,"pointerdown",t=>{this.#r=t.target}),this.listen(this,"dragstart",this.#n.bind(this)),this.listen(this,"dragover",this.#c.bind(this)),this.listen(this,"dragleave",this.#d.bind(this)),this.listen(this,"drop",this.#b.bind(this)),this.listen(this,"dragend",this.#p.bind(this))}#n(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let s=e.querySelector("[data-drag-handle]");if(s&&!s.contains(this.#r)){t.preventDefault();return}e.setAttribute("data-dragging",""),t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",e.dataset.id||""),t.dataTransfer.setData("application/x-drag-surface-group",this.group||"");let r=this.#u(e);d.#A={item:e,source:this,originalIndex:r},this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}#c(t){let e=d.#A;if(!e||(this.group||e.source.group)&&this.group!==e.source.group)return;t.preventDefault(),t.dataTransfer.dropEffect="move",this.setAttribute("data-drag-over","");let s=this.orientation==="horizontal"?t.clientX:t.clientY;this.#q(s)}#d(t){t.relatedTarget&&!this.contains(t.relatedTarget)&&(this.removeAttribute("data-drag-over"),this.#k())}#b(t){t.preventDefault(),this.removeAttribute("data-drag-over"),this.#k();let e=d.#A;if(!e)return;let{item:s,source:r,originalIndex:a}=e,i=this.orientation==="horizontal"?t.clientX:t.clientY,o=this.#w(i);if(r===this){this.#_(s,o),this.#f();let n=this.#u(s);this.#m(s),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:s,itemId:s.dataset.id,oldIndex:a,newIndex:n,order:this.sortedOrder}}))}else this.#_(s,o),this.#f(),r.#f(),this.#m(s),this.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:s,itemId:s.dataset.id,fromSurface:r,toSurface:this,newIndex:this.#u(s),fromOrder:r.sortedOrder,toOrder:this.sortedOrder}}))}#p(){let t=d.#A;t?.item&&t.item.removeAttribute("data-dragging"),this.removeAttribute("data-drag-over"),this.#k(),d.#A=null,this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0}))}#v(){this.listen(this,"keydown",this.#y.bind(this))}#y(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let s=e.getAttribute("aria-grabbed")==="true",r=this.orientation==="horizontal",a=r?"ArrowLeft":"ArrowUp",i=r?"ArrowRight":"ArrowDown";if(t.key===" "||t.key==="Enter"){if(t.preventDefault(),s){e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#f(),this.#m(e);let c=this.#u(e),l=this.draggableChildren;this.#i(`${this.#g(e)}, dropped at position ${c+1} of ${l.length}`),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,oldIndex:this.#e,newIndex:c,order:this.sortedOrder}})),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#e=null}else{this.#e=this.#u(e),e.setAttribute("aria-grabbed","true"),this.setAttribute("data-reorder-mode","");let c=this.draggableChildren;this.#i(`${this.#g(e)}, grabbed. Position ${this.#e+1} of ${c.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`),this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}return}if(!s&&(t.key===a||t.key===i)){t.preventDefault();let c=this.draggableChildren,l=c.indexOf(e),h=t.key===a?Math.max(0,l-1):Math.min(c.length-1,l+1);h!==l&&c[h].focus();return}if(s&&(t.key===a||t.key===i)){t.preventDefault();let c=this.draggableChildren,l=c.indexOf(e),h=t.key===a?Math.max(0,l-1):Math.min(c.length-1,l+1);h!==l&&(this.#_(e,h),e.focus(),this.#i(`Position ${h+1} of ${c.length}`));return}let o=r?"ArrowUp":"ArrowLeft",n=r?"ArrowDown":"ArrowRight";if(s&&(t.key===o||t.key===n)){if(t.preventDefault(),!this.group)return;let c=t.key===n?1:-1,l=this.#x(c);if(!l)return;l.appendChild(e),l.#f(),this.#f(),l.#m(e),e.focus();let h=l.getAttribute("aria-label")||"next surface";l.#i(`Moved to ${h}`),l.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,fromSurface:this,toSurface:l,newIndex:l.draggableChildren.indexOf(e),fromOrder:this.sortedOrder,toOrder:l.sortedOrder}})),this.removeAttribute("data-reorder-mode"),l.setAttribute("data-reorder-mode",""),this.#e=null;return}if(s&&t.key==="Escape"){t.preventDefault(),e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#e!=null&&(this.#_(e,this.#e),e.focus()),this.#i("Reorder cancelled"),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#e=null;return}!s&&t.key==="Escape"&&(t.preventDefault(),e.blur())}#m(t){t.setAttribute("data-just-dropped",""),t.addEventListener("animationend",()=>{t.removeAttribute("data-just-dropped")},{once:!0}),setTimeout(()=>t.removeAttribute("data-just-dropped"),500)}#x(t){if(!this.group)return null;let e=[...document.querySelectorAll(`drag-surface[group="${this.group}"]`)];if(e.length<2)return null;e.sort((a,i)=>{let o=a.getBoundingClientRect(),n=i.getBoundingClientRect();return o.left-n.left||o.top-n.top});let s=e.indexOf(this);return e[s+t]||null}#g(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#u(t){return this.draggableChildren.indexOf(t)}#_(t,e){let r=this.draggableChildren.filter(a=>a!==t)[e]||null;r?this.insertBefore(t,r):this.appendChild(t)}#f(){this.draggableChildren.forEach((t,e)=>{t.dataset.sortOrder=String(e+1)})}#w(t){let e=this.orientation==="horizontal",s=this.draggableChildren.filter(r=>!r.hasAttribute("data-dragging"));for(let r=0;r<s.length;r++){let a=s[r].getBoundingClientRect(),i=e?a.left+a.width/2:a.top+a.height/2;if(t<i)return r}return s.length}#q(t){this.#k();let e=this.orientation==="horizontal",s=this.draggableChildren.filter(r=>!r.hasAttribute("data-dragging"));for(let r=0;r<s.length;r++){let a=s[r].getBoundingClientRect(),i=e?a.left+a.width/2:a.top+a.height/2;if(t<i){s[r].setAttribute("data-drop-target","before");return}}s.length>0&&s[s.length-1].setAttribute("data-drop-target","after")}#k(){for(let t of this.querySelectorAll("[data-drop-target]"))t.removeAttribute("data-drop-target")}static#A=null};x("drag-surface",V);var bt=`
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
`;function m(d){return String(d).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function E(d){return d.split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2)}function S(d){let t=0;for(let s=0;s<d.length;s++)t=d.charCodeAt(s)+((t<<5)-t);return`hsl(${(t%360+360)%360}, 65%, 55%)`}function y(d){return`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`}var _={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',mapPin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>'},W={says:{label:"Says",icon:_.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:_.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:_.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:_.heart,color:"#ef4444"}},C={delighted:{emoji:"\u{1F604}",score:.95,color:"#16a34a"},satisfied:{emoji:"\u{1F60A}",score:.8,color:"#22c55e"},hopeful:{emoji:"\u{1F642}",score:.68,color:"#84cc16"},curious:{emoji:"\u{1F914}",score:.55,color:"#eab308"},neutral:{emoji:"\u{1F610}",score:.5,color:"#94a3b8"},uncertain:{emoji:"\u{1F615}",score:.4,color:"#f97316"},confused:{emoji:"\u{1F635}",score:.3,color:"#fb923c"},frustrated:{emoji:"\u{1F624}",score:.18,color:"#ef4444"},angry:{emoji:"\u{1F620}",score:.05,color:"#dc2626"}};var St="https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait",M=[32,64,128,256,512];function $t(d){let t=0;for(let e=0;e<d.length;e++)t=d.charCodeAt(e)+((t<<5)-t);return t}function qt(d){let t=M[0],e=Math.abs(d-t);for(let s=1;s<M.length;s++){let r=Math.abs(d-M[s]);r<e&&(t=M[s],e=r)}return t}function gt(d,t=128){let e=$t(String(d)),s=(e%100+100)%100,r=(e>>>16&1)===0?"female":"male",a=qt(t);return`${St}/${r}/${a}/${s}.jpg`}function X(d){let t=0;for(let e=0;e<d.length;e++)t=d.charCodeAt(e)+((t<<5)-t);return t}var It=["Sarah Chen","Marcus Johnson","Aisha Patel","James O'Brien","Yuki Tanaka","Elena Rodriguez","David Kim","Fatima Al-Hassan","Lucas Silva","Priya Sharma","Noah Williams","Mei Lin","Carlos Mendez","Amara Osei","Henrik Larsson","Zara Ahmed"],zt=["Product Manager","UX Designer","Frontend Developer","Data Analyst","Marketing Lead","QA Engineer","DevOps Lead","Content Strategist","Startup Founder","IT Director","Customer Success Lead","Research Scientist"],Tt=["San Francisco, CA","Austin, TX","London, UK","Toronto, CA","Berlin, DE","Tokyo, JP","Sydney, AU","S\xE3o Paulo, BR"],Nt=["I need tools that help me stay organized without slowing me down.","The dashboard is where I live \u2014 it has to be fast and reliable.","I want to understand the data, not fight the interface.","If it takes more than two clicks, I\u2019ll find another way.","Collaboration shouldn\u2019t mean endless notification noise.","I just want it to work the way I expect it to.","Give me the big picture first, then let me drill into details.","Accessibility isn\u2019t a nice-to-have \u2014 it\u2019s how I use the web."],Mt=["Streamline daily workflows","Reduce context-switching","Stay aligned with the team","Make data-driven decisions quickly","Ship features on a predictable cadence","Automate repetitive tasks","Improve onboarding experience","Keep documentation up to date"],Lt=["Too many disconnected tools","Slow page loads break focus","Unclear ownership of tasks","Settings that reset unexpectedly","Notifications that bury important updates","Poor mobile experience","Inconsistent design across features","No offline support"],jt=["Checks dashboards every morning","Prefers keyboard shortcuts over mouse","Skims docs, reads deeply only when stuck","Shares screenshots in Slack","Batches email to twice a day","Tests features in incognito first","Bookmarks frequently used reports","Uses dark mode exclusively"],K=class extends HTMLElement{static get observedAttributes(){return["role","age","location","avatar","compact","src"]}#t=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#e(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&!this.getAttribute(e)&&this.#t.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#t.get(t)||""}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(let r of["role","age","location","avatar"])s[r]&&this.setAttribute(r,s[r]);if(s.name&&!this.querySelector('[slot="name"]')){let r=document.createElement("h2");r.slot="name",r.textContent=s.name,this.appendChild(r)}if(s.quote&&!this.querySelector('[slot="quote"]')){let r=document.createElement("p");r.slot="quote",r.textContent=s.quote,this.appendChild(r)}for(let r of["bio","goals","frustrations","behaviors"])s[r]&&(Array.isArray(s[r])?this.#t.set(r,s[r]):this.#t.set(r,s[r]));this.#r()}catch(e){console.warn(`[user-persona] Failed to load src="${t}":`,e)}}connectedCallback(){this.#e(),this.hasAttribute("data-mock")?this.#s():this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#r(),this.setAttribute("data-upgraded",""),this.dispatchEvent(new CustomEvent("persona-ready",{bubbles:!0,composed:!0,detail:{name:this.personaName,role:this.personaRole}}))}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,s){e!==s&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(s):this.#r())}get personaName(){return this.querySelector('[slot="name"]')?.textContent?.trim()||this.#t.get("name")||"Unnamed Persona"}get personaRole(){return this.getAttribute("role")||""}get age(){return this.getAttribute("age")||""}get location(){return this.getAttribute("location")||""}get avatar(){return this.getAttribute("avatar")||""}get quote(){return this.querySelector('[slot="quote"]')?.textContent?.trim()||this.#t.get("quote")||""}get compact(){return this.hasAttribute("compact")}#s(){let t=this.dataset.seed||this.dataset.mock||String(Date.now()),e=a=>a[(X(t+a.length)%a.length+a.length)%a.length],s=(a,i)=>{let o=[];for(let n=0;n<i;n++)o.push(a[(X(t+n+a.length)%a.length+a.length)%a.length]);return[...new Set(o)]};if(!this.querySelector('[slot="name"]')){let a=document.createElement("h2");a.slot="name",a.textContent=e(It),this.appendChild(a)}if(this.getAttribute("role")||this.setAttribute("role",e(zt)),this.getAttribute("age")||this.setAttribute("age",String(25+(X(t)%30+30)%30)),this.getAttribute("location")||this.setAttribute("location",e(Tt)),!this.getAttribute("avatar")){let a=this.querySelector('[slot="name"]')?.textContent?.trim()||"Persona";this.setAttribute("avatar",gt(a,256))}if(!this.querySelector('[slot="quote"]')){let a=document.createElement("p");a.slot="quote",a.textContent=e(Nt),this.appendChild(a)}let r=(a,i)=>{if(this.querySelector(`[slot="${a}"]`))return;let o=document.createElement("ul");o.setAttribute("slot",a);for(let n of i){let c=document.createElement("li");c.textContent=n,o.appendChild(c)}this.appendChild(o)};r("goals",s(Mt,3)),r("frustrations",s(Lt,3)),r("behaviors",s(jt,3))}#r(){let t=this.personaName,e=this.personaRole,s=this.age,r=this.location,a=this.avatar,i=this.quote,o=S(t),n=a?`background:url(${m(a)}) center/cover`:`background:${o}`;this.shadowRoot.innerHTML=`
      <style>${bt}</style>

      <article class="persona-card" part="card" role="article"
        aria-label="User persona: ${m(t)}">

        <header class="persona-header" part="header">
          <div class="avatar" part="avatar" style="${n}"
            role="img" aria-label="Avatar for ${m(t)}">
            ${a?"":m(E(t))}
          </div>
          <div class="header-info">
            <div class="persona-name-wrap" part="name">
              <slot name="name"><h2 class="persona-name-fallback">${m(t)}</h2></slot>
            </div>
            ${e?`<p class="persona-role" part="role">${m(e)}</p>`:""}
            <div class="persona-meta" part="meta">
              ${s?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  ${m(s)} years old
                </span>
              `:""}
              ${r?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  ${m(r)}
                </span>
              `:""}
            </div>
          </div>
        </header>

        ${i||this.querySelector('[slot="quote"]')?`
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="quote-text-wrap"><slot name="quote"><p class="quote-text">${m(i)}</p></slot></div>
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
    `}};x("user-persona",K);var Y=`
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
`;var Q=class d extends HTMLElement{static get observedAttributes(){return["persona-id","priority","points","status","epic","story-id","compact","detail","src"]}static PRIORITIES={critical:{label:"Critical",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"},high:{label:"High",color:"#ea580c",bg:"rgba(234, 88, 12, 0.1)"},medium:{label:"Medium",color:"#ca8a04",bg:"rgba(202, 138, 4, 0.1)"},low:{label:"Low",color:"#16a34a",bg:"rgba(22, 163, 74, 0.1)"}};static STATUSES={backlog:{label:"Backlog",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"},"to-do":{label:"To Do",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},"in-progress":{label:"In Progress",color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.1)"},review:{label:"Review",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},done:{label:"Done",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"}};#t=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#e(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#t.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#t.get(t)||""}get data(){return{storyId:this.storyId||void 0,personaId:this.personaId||void 0,priority:this.priority,status:this.status,points:this.points||void 0,epic:this.epic||void 0,detail:this.getAttribute("detail")||void 0,persona:this.persona||void 0,action:this.action||void 0,benefit:this.benefit||void 0,title:this.storyTitle||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.#e(),this.shadowRoot&&this.#s(),this.dispatchEvent(new CustomEvent("user-story:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let[e,s]of[["storyId","story-id"],["personaId","persona-id"],["priority","priority"],["status","status"],["points","points"],["epic","epic"],["detail","detail"]])t[e]!=null&&this.setAttribute(s,String(t[e]));if(t.persona&&!this.querySelector('[slot="persona"]')){let e=document.createElement("span");e.slot="persona",e.textContent=t.persona,this.appendChild(e)}if(t.action&&!this.querySelector('[slot="action"]')){let e=document.createElement("span");e.slot="action",e.textContent=t.action,this.appendChild(e)}if(t.benefit&&!this.querySelector('[slot="benefit"]')){let e=document.createElement("span");e.slot="benefit",e.textContent=t.benefit,this.appendChild(e)}if(t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=t.title,this.appendChild(e)}for(let e of["acceptance-criteria","tasks","notes"]){let s=e==="acceptance-criteria"?"acceptanceCriteria":e;if(t[s]&&!this.querySelector(`[slot="${e}"]`))if(Array.isArray(t[s])){let r=document.createElement("ul");r.slot=e;for(let a of t[s]){let i=document.createElement("li");i.textContent=a,r.appendChild(i)}this.appendChild(r)}else{let r=document.createElement("p");r.slot=e,r.textContent=t[s],this.appendChild(r)}}}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this._applyData(s),this.#e(),this.#s()}catch(e){console.warn(`[user-story] Failed to load src="${t}":`,e)}}connectedCallback(){this.#e(),this.storyId&&!this.id&&(this.id=this.storyId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#s(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,s){e!==s&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(s):this.#s())}get persona(){return this.querySelector('[slot="persona"]')?.textContent?.trim()||this.#t.get("persona")||"user"}get personaId(){return this.getAttribute("persona-id")||""}get action(){return this.querySelector('[slot="action"]')?.textContent?.trim()||this.#t.get("action")||""}get benefit(){return this.querySelector('[slot="benefit"]')?.textContent?.trim()||this.#t.get("benefit")||""}get priority(){return this.getAttribute("priority")||"medium"}get points(){return this.getAttribute("points")||""}get status(){return this.getAttribute("status")||"backlog"}get epic(){return this.getAttribute("epic")||""}get storyId(){return this.getAttribute("story-id")||""}get storyTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#t.get("title")||""}get _minimalLabel(){if(this.storyTitle)return this.storyTitle;let t=this.action;return t.length>40?t.slice(0,40)+"\u2026":t}get compact(){return this.hasAttribute("compact")}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}updateStatus(t){d.STATUSES[t]&&(this.setAttribute("status",t),this.dispatchEvent(new CustomEvent("status-changed",{detail:{status:t,storyId:this.storyId},bubbles:!0,composed:!0})))}updatePriority(t){d.PRIORITIES[t]&&(this.setAttribute("priority",t),this.dispatchEvent(new CustomEvent("priority-changed",{detail:{priority:t,storyId:this.storyId},bubbles:!0,composed:!0})))}showDetail(){let t=`story-dialog-${this.storyId||this.id||"detail"}`,e=document.getElementById(t);e||(e=document.createElement("dialog"),e.id=t,e.setAttribute("data-size","l"),document.body.appendChild(e));let s=document.createElement("form");s.method="dialog";let r=document.createElement("header"),a=document.createElement("h3");a.textContent=this.storyTitle||this.storyId||"Story Detail";let i=document.createElement("button");i.type="submit",i.setAttribute("aria-label","Close"),i.textContent="\xD7",r.appendChild(a),r.appendChild(i);let o=document.createElement("section"),n=document.createElement("user-story");for(let l of this.getAttributeNames())l==="detail"||l==="compact"||l==="data-upgraded"||l==="draggable"||l==="data-id"||l==="data-quadrant"||n.setAttribute(l,this.getAttribute(l));let c=[...this.children].some(l=>l.getAttribute("slot")&&l.tagName!=="DIALOG");n.setAttribute("detail",c?"full":"compact"),n.removeAttribute("id");for(let l of[...this.children])l.tagName!=="DIALOG"&&n.appendChild(l.cloneNode(!0));o.appendChild(n),s.appendChild(r),s.appendChild(o),e.innerHTML="",e.appendChild(s),e.addEventListener("close",()=>{e.innerHTML=""},{once:!0}),e.showModal()}#s(){let t=d.PRIORITIES[this.priority]||d.PRIORITIES.medium,e=d.STATUSES[this.status]||d.STATUSES.backlog,s=this._detailLevel,r=this.storyId?`User story: ${m(this.storyId)}`:"User story";if(s==="minimal"){this.shadowRoot.innerHTML=`
        <style>${Y}</style>
        <article class="story-card story-card--minimal" role="article" aria-label="${r}"
          tabindex="0">
          <div class="story-body">
            ${this.storyId?`<span class="story-id">${m(this.storyId)}</span>`:""}
            <div class="story-title-wrap">
              <slot name="title"><span class="story-title-fallback">${m(this._minimalLabel||"[describe the action]")}</span></slot>
            </div>
          </div>
        </article>
      `;let a=this.shadowRoot.querySelector(".story-card--minimal");a.addEventListener("click",()=>this.showDetail()),a.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),this.showDetail())})}else this.shadowRoot.innerHTML=`
        <style>${Y}</style>

        <article class="story-card story-card--${s}" part="card" role="article" aria-label="${r}">
          <header class="story-header" part="header">
            <div class="story-meta">
              ${this.storyId?`<span class="story-id" part="id">${m(this.storyId)}</span>`:""}
              ${this.epic?`<span class="epic-badge" part="epic">${m(this.epic)}</span>`:""}
            </div>
            <div class="story-badges">
              <span class="priority-badge" part="priority"
                style="color: ${t.color}; background: ${t.bg};"
              >${m(t.label)}</span>
              <span class="status-badge" part="status"
                style="color: ${e.color}; background: ${e.bg};"
              >${m(e.label)}</span>
              ${this.points?`<span class="points-badge" part="points">${m(this.points)}</span>`:""}
            </div>
          </header>

          <div class="story-body" part="body">
            <p class="story-statement" part="statement">
              <span class="keyword">As a</span>
              ${this.personaId?`<a class="persona-text persona-text--link" href="#${m(this.personaId)}">${y(_.user)} <slot name="persona"><span>user</span></slot></a>`:'<span class="persona-text"><slot name="persona"><span>user</span></slot></span>'},
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
      `,s==="compact"&&this.shadowRoot.querySelectorAll(".section").forEach(i=>{let o=i.querySelector("slot");o&&o.assignedNodes().length===0&&i.setAttribute("data-empty","")});this.dispatchEvent(new CustomEvent("story-ready",{detail:{id:this.storyId,persona:this.persona,action:this.action,benefit:this.benefit,priority:this.priority,status:this.status,points:this.points},bubbles:!0,composed:!0}))}};x("user-story",Q);var L=`
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
`;var Rt=[{key:"actions",label:"Actions"},{key:"thoughts",label:"Thoughts"},{key:"touchpoints",label:"Touchpoints"},{key:"painPoints",label:"Pain Points"},{key:"opportunities",label:"Opportunities"}],G=class extends HTMLElement{static get observedAttributes(){return["src","persona","persona-id","story-ids","compact"]}#t=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__phases=null}get phases(){return this.__phases}set phases(t){this.__phases=t,this.isConnected&&this._render()}#e(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#t.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#t.get(t)||""}connectedCallback(){this.#e(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${L}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();if(s.persona&&this.setAttribute("persona",s.persona),s.personaId&&this.setAttribute("persona-id",s.personaId),s.title&&!this.querySelector('[slot="title"]')){let r=document.createElement("h2");r.slot="title",r.textContent=s.title,this.appendChild(r)}if(s.summary&&!this.querySelector('[slot="summary"]')){let r=document.createElement("p");r.slot="summary",r.textContent=s.summary,this.appendChild(r)}this.__phases=s.phases||[],this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${L}</style><div class="state-msg state-msg--error">Could not load journey: ${m(e.message)}</div>`}}}_render(){let t=this._resolve("persona")||"",e=this._resolve("persona-id")||"",s=(this.getAttribute("story-ids")||"").split(",").map(o=>o.trim()).filter(Boolean),r=this.hasAttribute("compact"),a=this.__phases,i=!!this.querySelector('[slot="summary"]')||this.#t.has("summary");this.shadowRoot.innerHTML=`<style>${L}</style>
      <article class="journey${r?" journey--compact":""}">

        <header class="journey__header">
          <div class="journey__header-top">
            <div class="journey__chips">
              <span class="chip chip--type">Journey Map</span>
              ${s.map(o=>`<a class="chip chip--story" href="#${o}">${this._label(o)}</a>`).join("")}
            </div>
            ${t?`
              <div class="journey__persona">
                ${e?`<a class="persona-ref" href="#${e}">${y(_.user)} ${m(t)}</a>`:`<span class="persona-ref">${y(_.user)} ${m(t)}</span>`}
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

      </article>`,this.dispatchEvent(new CustomEvent("journey-ready",{bubbles:!0,composed:!0,detail:{title,persona:t,phaseCount:a?a.length:0}}))}_curve(t){let n=t.length,c=p=>28+(n<2?944/2:p/(n-1)*944),l=p=>14+(1-(C[p.emotion]||C.neutral).score)*72,h=t.map((p,b)=>({x:c(b),y:l(p),ph:p})),u=`M ${h[0].x},${h[0].y}`;for(let p=1;p<h.length;p++){let b=h[p-1],v=h[p],w=(b.x+v.x)/2;u+=` C ${w},${b.y} ${w},${v.y} ${v.x},${v.y}`}let f=`uj-${Math.random().toString(36).slice(2,8)}`,g=h.at(-1);return`
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
          ${h.map(({x:p})=>`<line x1="${p}" y1="0" x2="${p}" y2="100" class="vline"/>`).join("")}
          <path d="${u} L ${g.x},100 L ${h[0].x},100 Z" fill="url(#${f})"/>
          <path d="${u}" fill="none" class="curve-line"/>
          ${h.map(({x:p,y:b,ph:v})=>{let w=C[v.emotion]||C.neutral;return`<circle cx="${p}" cy="${b}" r="5" class="dot" style="fill:${w.color}"/>`}).join("")}
        </svg>
      </div>`}_grid(t){let e=t.map((r,a)=>{let i=C[r.emotion]||C.neutral,o=r.storyIds||[];return`
        <th class="phase-head" data-emotion="${r.emotion||"neutral"}"
            style="--ec:${i.color}">
          <span class="ph-num">${a+1}</span>
          <span class="ph-name">${m(r.name||"")}</span>
          <span class="ph-emoji" title="${r.emotion||"neutral"}"><span role="img" aria-label="${m(r.emotion||"neutral")}">${i.emoji}</span></span>
          ${o.length?`<div class="ph-stories">${o.map(n=>`<a class="chip chip--story" href="#${n}">${this._label(n)}</a>`).join("")}</div>`:""}
        </th>`}).join(""),s=Rt.map(({key:r,label:a})=>{let i=t.map(o=>{let n=o[r]||[];return n.length?`<td class="data-cell data-cell--${r.toLowerCase()}">
          ${n.map(c=>`<p>${m(c)}</p>`).join("")}
        </td>`:'<td class="data-cell data-cell--empty">\u2014</td>'}).join("");return`
        <tr class="grid-row grid-row--${r.toLowerCase()}">
          <th class="row-label">${a}</th>
          ${i}
        </tr>`}).join("");return`
      <div class="journey__grid-wrap">
        <table class="journey__grid"
               aria-label="${m(this.getAttribute("title")||"User Journey")} \u2014 phase breakdown">
          <thead>
            <tr>
              <th class="corner">Stage</th>
              ${e}
            </tr>
          </thead>
          <tbody>${s}</tbody>
        </table>
      </div>`}_label(t){return t.replace(/^(activity|persona|journey|story|user)-/,"").replace(/-/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("user-journey",G);var j=`
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
`;var J=["says","thinks","does","feels"],Z=class extends HTMLElement{static get observedAttributes(){return["persona","persona-id","src","editable","compact"]}#t=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__quadrants=null,this.__goals=null,this.__painPoints=null,this._editingQuadrants=new Set}get quadrants(){return this.__quadrants}set quadrants(t){this.__quadrants=t,this.isConnected&&this._render()}get goals(){return this.__goals}set goals(t){this.__goals=t,this.isConnected&&this._render()}get painPoints(){return this.__painPoints}set painPoints(t){this.__painPoints=t,this.isConnected&&this._render()}#e(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#t.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#t.get(t)||""}connectedCallback(){this.#e(),this.setAttribute("data-upgraded",""),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._render()}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):this._render())}editQuadrant(t){J.includes(t)&&this.hasAttribute("editable")&&this._openEdit(t)}closeQuadrant(t){J.includes(t)&&this._closeEdit(t)}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${j}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();if(s.persona&&this.setAttribute("persona",s.persona),s.personaId&&this.setAttribute("persona-id",s.personaId),s.title&&!this.querySelector('[slot="title"]')){let r=document.createElement("h2");r.slot="title",r.textContent=s.title,this.appendChild(r)}if(s.summary&&!this.querySelector('[slot="summary"]')){let r=document.createElement("p");r.slot="summary",r.textContent=s.summary,this.appendChild(r)}this.__quadrants=s.quadrants||null,this.__goals=s.goals||null,this.__painPoints=s.painPoints||null,this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${j}</style><div class="state-msg state-msg--error">Could not load empathy map: ${m(e.message)}</div>`}}}_render(){let t=this._resolve("persona")||"",e=this._resolve("persona-id")||"",s=this.hasAttribute("compact"),r=this.hasAttribute("editable"),a=!!this.querySelector('[slot="title"]')||this.#t.has("title"),i=!!this.querySelector('[slot="summary"]')||this.#t.has("summary"),o=this.__goals?.length||this.querySelector('[slot="goals"]'),n=this.__painPoints?.length||this.querySelector('[slot="pain-points"]');this.shadowRoot.innerHTML=`<style>${j}</style>
      <article class="empathy-map${s?" empathy-map--compact":""}">

        <header class="empathy-map__header">
          <div class="empathy-map__header-top">
            <div class="empathy-map__chips">
              <span class="chip chip--type">Empathy Map</span>
            </div>
            ${t?`
              <div class="empathy-map__persona">
                ${e?`<a class="persona-ref" href="#${m(e)}">${y(_.user)} ${m(t)}</a>`:`<span class="persona-ref">${y(_.user)} ${m(t)}</span>`}
              </div>`:""}
          </div>
          <div class="empathy-map__title-wrap">
            <slot name="title"><h2 class="empathy-map__title">Empathy Map</h2></slot>
          </div>
          ${i?'<div class="empathy-map__summary-wrap"><slot name="summary"></slot></div>':""}
        </header>

        <div class="empathy-map__grid">
          ${J.map(c=>this._renderQuadrant(c,r)).join("")}
        </div>

        ${o||n?`
          <footer class="empathy-map__footer">
            ${this._renderSummaryRow("goals",y(_.target),"Goals")}
            ${this._renderSummaryRow("pain-points",y(_.alertTriangle),"Pain Points")}
          </footer>
        `:""}

      </article>`,r&&this._bindEditListeners(),this.dispatchEvent(new CustomEvent("empathy-map:ready",{bubbles:!0,composed:!0,detail:{title:this.querySelector('[slot="title"]')?.textContent?.trim()||"Empathy Map",persona:t}}))}_renderQuadrant(t,e){let s=W[t],r=this.__quadrants?.[t],a=this._editingQuadrants.has(t),i=r&&r.length?t==="feels"?r.map(n=>this._renderEmotion(n)).join(""):r.map(n=>`<p>${m(n)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">Add ${s.label.toLowerCase()} items\u2026</p></slot>`,o=r?.length?r.join(`
`):"";return`
      <section class="quadrant quadrant--${t}"${a?" data-editing":""}>
        <div class="quadrant__inner">
          <div class="quadrant__header">
            <div class="quadrant__icon" aria-hidden="true">${y(s.icon)}</div>
            <span class="quadrant__label">${s.label}</span>
            ${e?`<button class="quadrant__edit-btn" data-quadrant="${t}"
              aria-label="Edit ${s.label}" title="Edit ${s.label}">${y(_.pencil)}</button>`:""}
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
                  aria-label="Edit ${s.label} items">${m(o)}</textarea>
                <button class="quadrant__done-btn" data-quadrant="${t}"
                  aria-label="Done editing ${s.label}">${y(_.check)} Done</button>
              </div>
            `:""}
          </div>
        </div>
      </section>`}_renderEmotion(t){let e=t.toLowerCase().trim(),s=C[e];return s?`<span class="emotion-tag" style="--ec:${s.color}"><span role="img" aria-label="${m(t)}">${s.emoji}</span> ${m(t)}</span>`:`<p>${m(t)}</p>`}_renderSummaryRow(t,e,s){let a=(t==="pain-points"?"painPoints":t)==="painPoints"?this.__painPoints:this.__goals,i=a?.length?a.map(o=>`<p>${m(o)}</p>`).join(""):`<slot name="${t}"><p class="placeholder">No ${s.toLowerCase()} specified.</p></slot>`;return`
      <div class="summary-row">
        <span class="summary-row__icon" aria-hidden="true">${e}</span>
        <div class="summary-row__body">
          <div class="summary-row__label">${s}</div>
          <div class="summary-row__content">${i}</div>
        </div>
      </div>`}_bindEditListeners(){let t=this.shadowRoot;t.querySelectorAll(".quadrant__edit-btn").forEach(e=>{e.addEventListener("click",()=>{this._openEdit(e.dataset.quadrant)})}),t.querySelectorAll(".quadrant__done-btn").forEach(e=>{e.addEventListener("click",()=>{this._closeEdit(e.dataset.quadrant)})}),t.querySelectorAll(".quadrant__editor").forEach(e=>{e.addEventListener("keydown",s=>{s.key==="Escape"&&(s.preventDefault(),this._closeEdit(e.dataset.quadrant))})})}_openEdit(t){this._editingQuadrants.add(t);let e=this.shadowRoot.querySelector(`.quadrant--${t}`);if(!e)return;e.setAttribute("data-editing","");let s=e.querySelector(".quadrant__face--front"),r=e.querySelector(".quadrant__face--back");s&&s.setAttribute("inert",""),r&&r.removeAttribute("inert");let a=e.querySelector(".quadrant__editor");if(a){let i=this.__quadrants?.[t];if(i?.length)a.value=i.join(`
`);else{let o=e.querySelector(`slot[name="${t}"]`);if(o){let n=o.assignedElements();if(n.length){let c=[];n.forEach(l=>{let h=l.querySelectorAll("li");h.length?h.forEach(u=>c.push(u.textContent.trim())):c.push(l.textContent.trim())}),a.value=c.filter(Boolean).join(`
`)}}}a.focus()}}_closeEdit(t){let e=this.shadowRoot.querySelector(`.quadrant--${t}`);if(!e)return;let s=e.querySelector(".quadrant__editor");if(s){let i=s.value.split(`
`).map(n=>n.trim()).filter(Boolean);this.__quadrants||(this.__quadrants={}),this.__quadrants[t]=i;let o=e.querySelector(".quadrant__content");if(o)if(i.length)o.innerHTML=t==="feels"?i.map(n=>this._renderEmotion(n)).join(""):i.map(n=>`<p>${m(n)}</p>`).join("");else{let n=W[t];o.innerHTML=`<p class="placeholder">Add ${n.label.toLowerCase()} items\u2026</p>`}}this._editingQuadrants.delete(t),e.removeAttribute("data-editing");let r=e.querySelector(".quadrant__face--front"),a=e.querySelector(".quadrant__face--back");r&&r.removeAttribute("inert"),a&&a.setAttribute("inert",""),this.dispatchEvent(new CustomEvent("empathy-map:update",{bubbles:!0,composed:!0,detail:{quadrant:t,items:this.__quadrants?.[t]||[]}}))}};x("empathy-map",Z);var tt=class d extends A{static QUADRANTS=["quick-wins","big-bets","fill-ins","money-pit"];static LABELS={"quick-wins":"Quick Wins","big-bets":"Big Bets","fill-ins":"Fill-Ins","money-pit":"Money Pit"};static DESCRIPTIONS={"quick-wins":"High impact \xB7 Low effort","big-bets":"High impact \xB7 High effort","fill-ins":"Low impact \xB7 Low effort","money-pit":"Low impact \xB7 High effort"};static#t=0;static get observedAttributes(){return["src","compact","title"]}#e=null;#s={};#r=null;#a="";#o=null;setup(){this.#a=`ie-${++d.#t}`;let t=[...this.querySelectorAll(":scope > [data-quadrant], :scope > [draggable]")],e=document.createElement("div");e.className="ie-wrapper";let s=document.createElement("div");s.className="ie-y-label",s.setAttribute("aria-hidden","true"),s.textContent="Impact \u2191";let r=document.createElement("div");r.style.cssText="display:flex;flex-direction:column;flex:1;min-width:0;";let a=document.createElement("div");a.className="ie-grid",a.setAttribute("role","region"),a.setAttribute("aria-label","Impact-Effort prioritization matrix");let i=document.createElement("div");i.className="ie-x-label",i.setAttribute("aria-hidden","true"),i.textContent="Effort \u2192";for(let l of d.QUADRANTS){let h=document.createElement("section");h.className="ie-quadrant",h.dataset.quadrantZone=l,h.setAttribute("aria-label",`${d.LABELS[l]}: ${d.DESCRIPTIONS[l]}`);let u=document.createElement("header");u.className="ie-quadrant-label",u.innerHTML=`${d.LABELS[l]}<br><span class="ie-quadrant-desc">${d.DESCRIPTIONS[l]}</span>`;let f=document.createElement("drag-surface");f.setAttribute("group",this.#a),f.setAttribute("aria-label",d.LABELS[l]),f.setAttribute("data-layout","stack"),f.setAttribute("data-layout-gap","xs"),h.appendChild(u),h.appendChild(f),a.appendChild(h),this.#s[l]=f}t.forEach((l,h)=>{let u=l.getAttribute("data-quadrant")||"quick-wins",f=this.#s[u]||this.#s["quick-wins"];l.hasAttribute("draggable")||l.setAttribute("draggable","true"),l.hasAttribute("data-id")||(l.dataset.id=`ie-item-${h}`),f.appendChild(l)});let o=document.createElement("div");o.className="ie-live-region",o.setAttribute("role","status"),o.setAttribute("aria-live","polite"),o.setAttribute("aria-atomic","true");let n=this.getAttribute("title");if(n){let l=document.createElement("h3");l.className="ie-title",l.textContent=n,this.prepend(l)}r.appendChild(a),r.appendChild(i),e.appendChild(s),e.appendChild(r),this.appendChild(e),this.appendChild(o),this.#e=a,this.#r=o,this.#o=e,this.listen(this,"drag-surface:transfer",l=>{let{item:h,fromSurface:u,toSurface:f}=l.detail,g=this.#l(u),p=this.#l(f);!g||!p||(h.setAttribute("data-quadrant",p),this.#n(`Moved ${this.#c(h)} to ${d.LABELS[p]}`),this.dispatchEvent(new CustomEvent("impact-effort:move",{bubbles:!0,detail:{itemId:h.dataset.id,from:g,to:p,item:h}})))});let c=this.getAttribute("src");c&&this.#i(c),this.#d()}teardown(){this.#o&&(this.#o.remove(),this.#o=null),this.#r&&(this.#r.remove(),this.#r=null),this.#e=null,this.#s={}}attributeChangedCallback(t,e,s){this.hasAttribute("data-upgraded")&&t==="src"&&s&&s!==e&&this.#i(s)}async#i(t){try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();if(!Array.isArray(s))return;for(let r of d.QUADRANTS){let a=this.#s[r];if(a)for(let i of[...a.querySelectorAll("[draggable]")])i.remove()}s.forEach((r,a)=>{let i=r.quadrant||"quick-wins",o=r.id||`ie-item-${a}`,n;r.persona||r.action||r.storyId?(n=document.createElement("user-story"),n.setAttribute("detail","minimal"),r.storyId&&n.setAttribute("story-id",r.storyId),r.persona&&n.setAttribute("persona",r.persona),r.action&&n.setAttribute("action",r.action),r.benefit&&n.setAttribute("benefit",r.benefit),r.priority&&n.setAttribute("priority",r.priority),r.status&&n.setAttribute("status",r.status),r.points&&n.setAttribute("points",String(r.points))):(n=document.createElement("article"),n.textContent=r.label||r.text||""),n.setAttribute("draggable","true"),n.dataset.id=o,n.dataset.quadrant=i,(this.#s[i]||this.#s["quick-wins"]).appendChild(n)}),this.#d()}catch(e){console.warn(`[impact-effort] Failed to load src="${t}":`,e)}}#l(t){for(let[e,s]of Object.entries(this.#s))if(s===t)return e;return null}#n(t){let e=this.#r;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#c(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#d(){let t={};for(let e of d.QUADRANTS){let s=this.#s[e];t[e]=s?s.querySelectorAll('[draggable="true"]').length:0}this.dispatchEvent(new CustomEvent("impact-effort:ready",{bubbles:!0,detail:{quadrantCounts:t}}))}};x("impact-effort",tt);function vt({newItems:d,nodes:t,keyOf:e,renderItem:s,containerFor:r}){let a=[],i=[],o=[],n=new Set;for(let l of d)n.add(e(l));for(let[l,h]of[...t])n.has(l)||(h.remove(),t.delete(l),o.push(l));let c=new Map;for(let l of d){let h=e(l),u=t.get(h)||null,f=r(l,u);c.has(f)||c.set(f,[]),c.get(f).push({item:l,key:h,existing:u})}for(let[l,h]of c)for(let u=0;u<h.length;u++){let{item:f,key:g,existing:p}=h[u],b=p;b?(b.parentElement!==l||l.children[u]!==b)&&i.push(g):(b=s(f),t.set(g,b),a.push(g));let v=l.children[u];v!==b&&l.insertBefore(b,v||null)}return{added:a,moved:i,removed:o}}function yt(d){return class extends d{static keyOf(t){return t.id}#t=[];#e=new Map;get items(){return this.#t}set items(t){let e=t||[],s=vt({newItems:e,nodes:this.#e,keyOf:this.constructor.keyOf,renderItem:r=>this._renderItem(r),containerFor:(r,a)=>this._containerFor(r,a)});this.#t=e,this._postRender({...s,items:e}),this._emit("items-changed",{items:e},"api")}_renderItem(t){throw new Error(`${this.constructor.name}: must implement _renderItem(item)`)}_containerFor(t,e){return this}_postRender(t){}_emit(t,e,s="api"){this.dispatchEvent(new CustomEvent(`${this.localName}:${t}`,{detail:{...e,source:s},bubbles:!0}))}_nodeFor(t){return this.#e.get(t)||null}_seedCollection(t,e){this.#t=t,this.#e.clear();for(let[s,r]of e)this.#e.set(s,r)}_setItemsSilently(t){this.#t=t}}}var et=class d extends yt(A){static get observedAttributes(){return["src","compact","title"]}static keyOf(t){return t.id??t.storyId}static#t=0;#e=null;#s={};#r={};#a=null;#o="";#i=[];#l=null;setup(){this.#o=`kb-${++d.#t}`;let t=[...this.querySelectorAll(":scope > section[data-column]")];this.#i=t.map(a=>{let i=a.getAttribute("data-column")||"",n=a.getAttribute("data-column-label")||""||this.#g(i),c=a.getAttribute("data-wip"),l=c?parseInt(c,10):null,h=a.getAttribute("data-column-color")||null,u=[...a.children];return{id:i,label:n,wip:l,color:h,children:u}});for(let a of t)a.remove();this.#e=document.createElement("div"),this.#e.className="kb-columns",this.#e.setAttribute("role","region"),this.#e.setAttribute("aria-label","Kanban board");let e=0;for(let a of this.#i){let i=document.createElement("section");i.className="kb-column",i.setAttribute("data-column-id",a.id),a.color&&i.setAttribute("data-column-tint",a.color);let o=document.createElement("header");o.className="kb-column-header";let n=document.createElement("h3");n.textContent=a.label;let c=document.createElement("output");if(c.className="kb-count",c.textContent=String(a.children.length),n.appendChild(c),a.wip!==null&&!isNaN(a.wip)){let h=document.createElement("span");h.className="kb-wip",h.textContent=`/ ${a.wip}`,h.setAttribute("aria-label",`WIP limit ${a.wip}`),n.appendChild(h)}o.appendChild(n),i.appendChild(o);let l=document.createElement("drag-surface");if(l.setAttribute("group",this.#o),l.setAttribute("aria-label",`${a.label} items`),l.setAttribute("data-layout","stack"),l.setAttribute("data-layout-gap","xs"),a.children.length>0){for(let h of a.children)h.hasAttribute("draggable")||h.setAttribute("draggable","true"),h.hasAttribute("data-id")||(h.dataset.id=`kb-item-${e}`),l.appendChild(h);e+=a.children.length}else{let h=document.createElement("p");h.className="kb-empty",h.textContent="No items",l.appendChild(h)}i.appendChild(l),this.#e.appendChild(i),this.#s[a.id]=l,this.#r[a.id]=i,a.wip!==null&&a.children.length>a.wip&&i.setAttribute("data-wip-exceeded","")}let s=this.getAttribute("title");if(s){let a=document.createElement("h2");a.className="kb-title",a.textContent=s,this.appendChild(a)}this.appendChild(this.#e),this.#a=document.createElement("div"),this.#a.className="kb-live-region",this.#a.setAttribute("role","status"),this.#a.setAttribute("aria-live","polite"),this.#a.setAttribute("aria-atomic","true"),this.appendChild(this.#a),this.listen(this,"drag-surface:reorder",a=>{let i=a.detail,o=a.target.closest("drag-surface"),n=this.#p(o);n&&(this.#v(n),this.#c("drag"),this.dispatchEvent(new CustomEvent("kanban-board:reorder",{bubbles:!0,detail:{itemId:i.itemId,column:n,oldIndex:i.oldIndex,newIndex:i.newIndex}})))}),this.listen(this,"drag-surface:transfer",a=>{let i=a.detail,o=i.fromSurface,n=i.toSurface,c=this.#p(o),l=this.#p(n);if(!c||!l)return;i.item&&i.item.setAttribute("data-column",l),this.#v(c),this.#v(l);let h=n.querySelector(".kb-empty");if(h&&h.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".kb-empty")){let w=document.createElement("p");w.className="kb-empty",w.textContent="No items",o.appendChild(w)}let f=this.#x(i.item),g=this.#y(c),p=this.#y(l);this.#m(`${f} moved from ${g} to ${p}`),this.#c("drag"),this.dispatchEvent(new CustomEvent("kanban-board:transfer",{bubbles:!0,detail:{itemId:i.itemId,fromColumn:c,toColumn:l,newIndex:i.newIndex,item:i.item}}));let b=n.querySelectorAll(':scope > [draggable="true"]').length,v=this.#i.find(w=>w.id===l);v?.wip!==null&&v?.wip!==void 0&&b>v.wip&&this.dispatchEvent(new CustomEvent("kanban-board:wip-exceeded",{bubbles:!0,detail:{column:l,limit:v.wip,count:b}}))}),this.#n();let r=this.getAttribute("src");if(r){this._loadSrc(r);return}this.dispatchEvent(new CustomEvent("kanban-board:ready",{bubbles:!0,detail:{columnCount:this.#i.length,itemCount:e}}))}#n(){let t=[],e=new Map;for(let[s,r]of Object.entries(this.#s)){let a=r.querySelectorAll(':scope > [draggable="true"]');for(let i of a){let o=i.getAttribute("data-id");o&&(t.push({id:o,column:s}),e.set(o,i))}}this._seedCollection(t,e)}#c(t){let e=[],s=new Map;for(let r of this.items){let a=String(r.id??r.storyId??"");a&&s.set(a,r)}for(let[r,a]of Object.entries(this.#s)){let i=a.querySelectorAll(':scope > [draggable="true"]');for(let o of i){let n=o.getAttribute("data-id");if(!n)continue;let c=s.get(n);e.push(c?{...c,column:r}:{id:n,column:r})}}this._setItemsSilently(e),this._emit("items-changed",{items:e},t)}teardown(){let t=this.querySelector(".kb-title");t&&t.remove(),this.#e&&(this.#e.remove(),this.#e=null),this.#a&&(this.#a.remove(),this.#a=null),this.#s={},this.#r={},this.#i=[]}get columns(){return this.#i.map(t=>({id:t.id,label:t.label,wip:t.wip??void 0,color:t.color??void 0}))}set columns(t){let e=(t||[]).map(s=>({id:s.id,label:s.label||this.#g(s.id),wip:s.wip??null,color:s.color??null,children:[]}));this.#e&&(this.#e.remove(),this.#e=null),this.#s={},this.#r={},this.#i=e,this.#b()}get renderItem(){return this.#l}set renderItem(t){this.#l=typeof t=="function"?t:null}_renderItem(t){let e;if(this.#l){let s=this.#l(t);if(!(s instanceof Element))throw new Error("kanban-board: renderItem must return an Element");e=s}else e=this.#d(t);return e.hasAttribute("draggable")||e.setAttribute("draggable","true"),e.hasAttribute("data-id")||e.setAttribute("data-id",String(d.keyOf(t))),e}_containerFor(t,e){let s=this.#s[t.column];if(!s)throw new Error(`kanban-board: no column "${t.column}" \u2014 set .columns first or include item.column matching an existing column id`);let r=s.querySelector(":scope > .kb-empty");return r&&r.remove(),s}_postRender(){for(let t of Object.keys(this.#s)){this.#v(t);let e=this.#s[t],s=e.querySelectorAll(':scope > [draggable="true"]'),r=e.querySelector(":scope > .kb-empty");if(s.length===0&&!r){let a=document.createElement("p");a.className="kb-empty",a.textContent="No items",e.appendChild(a)}else s.length>0&&r&&r.remove()}}#d(t){let e=customElements.get("work-item")?"work-item":"article",s=document.createElement(e);return e==="work-item"?s.data={itemId:t.id??t.storyId,type:t.type,priority:t.priority,status:t.status,estimate:t.estimate!=null?String(t.estimate):void 0,assignee:t.assignee,title:t.title,description:t.description,checklist:t.checklist,notes:t.notes,detail:t.detail}:(s.className="kb-card",s.textContent=t.title||t.label||t.id),s}#b(){this.#e=document.createElement("div"),this.#e.className="kb-columns",this.#e.setAttribute("role","region"),this.#e.setAttribute("aria-label","Kanban board");for(let t of this.#i){let e=document.createElement("section");e.className="kb-column",e.setAttribute("data-column-id",t.id),t.color&&e.setAttribute("data-column-tint",t.color);let s=document.createElement("header");s.className="kb-column-header";let r=document.createElement("h3");r.textContent=t.label;let a=document.createElement("output");if(a.className="kb-count",a.textContent="0",r.appendChild(a),t.wip!=null&&!isNaN(t.wip)){let n=document.createElement("span");n.className="kb-wip",n.textContent=`/ ${t.wip}`,n.setAttribute("aria-label",`WIP limit ${t.wip}`),r.appendChild(n)}s.appendChild(r),e.appendChild(s);let i=document.createElement("drag-surface");i.setAttribute("group",this.#o),i.setAttribute("aria-label",`${t.label} items`),i.setAttribute("data-layout","stack"),i.setAttribute("data-layout-gap","xs");let o=document.createElement("p");o.className="kb-empty",o.textContent="No items",i.appendChild(o),e.appendChild(i),this.#e.appendChild(e),this.#s[t.id]=i,this.#r[t.id]=e}this.appendChild(this.#e)}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let r of s.columns||[]){let a=document.createElement("section");a.setAttribute("data-column",r.id),r.label&&a.setAttribute("data-column-label",r.label),r.wip!=null&&a.setAttribute("data-wip",String(r.wip)),r.color&&a.setAttribute("data-column-color",r.color);for(let i of r.items||[]){let o;i.persona||i.action||i.storyId?(o=document.createElement("user-story"),o.setAttribute("detail",i.detail||"minimal"),i.storyId&&o.setAttribute("story-id",i.storyId),i.persona&&o.setAttribute("persona",i.persona),i.action&&o.setAttribute("action",i.action),i.benefit&&o.setAttribute("benefit",i.benefit),i.priority&&o.setAttribute("priority",i.priority),i.status&&o.setAttribute("status",i.status),i.points&&o.setAttribute("points",String(i.points))):(o=document.createElement("article"),o.className="kb-card",o.textContent=i.text||i.label||""),o.setAttribute("draggable","true"),o.dataset.id=i.id||i.storyId||"",a.appendChild(o)}this.appendChild(a)}this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[kanban-board] Failed to load src="${t}":`,e)}}#p(t){if(!t)return null;for(let[e,s]of Object.entries(this.#s))if(s===t)return e;return null}#v(t){let e=this.#s[t],s=this.#r[t];if(!e||!s)return;let r=e.querySelectorAll(':scope > [draggable="true"]').length,a=s.querySelector(".kb-count");a&&(a.textContent=String(r));let i=this.#i.find(o=>o.id===t);i?.wip!==null&&i?.wip!==void 0&&(r>i.wip?s.setAttribute("data-wip-exceeded",""):s.removeAttribute("data-wip-exceeded"))}#y(t){return this.#i.find(s=>s.id===t)?.label||this.#g(t)}#m(t){this.#a&&(this.#a.textContent="",requestAnimationFrame(()=>{this.#a&&(this.#a.textContent=t)}))}#x(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#g(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("kanban-board",et);var st=class d extends A{static get observedAttributes(){return["src","compact","title"]}static#t=0;#e=null;#s=null;#r={};#a=null;#o="";#i=[];setup(){this.#o=`sm-${++d.#t}`;let t=[...this.querySelectorAll(":scope > section[data-activity]")];this.#i=t.map(a=>{let i=a.getAttribute("data-activity")||"",n=a.getAttribute("data-activity-label")||""||this.#b(i),c=a.getAttribute("data-journey-phase")||null,l=[...a.children];return{id:i,label:n,journeyPhase:c,children:l}});for(let a of t)a.remove();this.#e=document.createElement("div"),this.#e.className="sm-scroll",this.#e.setAttribute("role","region"),this.#e.setAttribute("aria-label","Story map"),this.#e.setAttribute("tabindex","0"),this.#s=document.createElement("div"),this.#s.className="sm-columns";let e=0;for(let a of this.#i){let i=document.createElement("section");i.className="sm-column",i.setAttribute("data-activity-column",a.id);let o=document.createElement("header");o.className="sm-activity-header";let n=document.createElement("h3");n.textContent=a.label;let c=document.createElement("span");c.className="sm-activity-count",c.textContent=String(a.children.length),n.appendChild(c),o.appendChild(n),i.appendChild(o);let l=document.createElement("drag-surface");if(l.setAttribute("group",this.#o),l.setAttribute("aria-label",`${a.label} stories`),l.setAttribute("data-layout","stack"),l.setAttribute("data-layout-gap","xs"),a.children.length>0){for(let h of a.children)l.appendChild(h);e+=a.children.length}else{let h=document.createElement("p");h.className="sm-empty",h.textContent="No stories yet",l.appendChild(h)}i.appendChild(l),this.#s.appendChild(i),this.#r[a.id]=l}let s=this.getAttribute("title");if(s){let a=document.createElement("h2");a.className="sm-title",a.textContent=s,this.appendChild(a)}this.#e.appendChild(this.#s),this.appendChild(this.#e),this.#a=document.createElement("div"),this.#a.className="sm-live-region",this.#a.setAttribute("role","status"),this.#a.setAttribute("aria-live","polite"),this.#a.setAttribute("aria-atomic","true"),this.appendChild(this.#a),this.listen(this,"drag-surface:reorder",a=>{let i=a.detail,o=a.target.closest("drag-surface"),n=this.#l(o);n&&(this.#n(n),this.dispatchEvent(new CustomEvent("story-map:reorder",{bubbles:!0,detail:{itemId:i.itemId,activity:n,oldIndex:i.oldIndex,newIndex:i.newIndex}})))}),this.listen(this,"drag-surface:transfer",a=>{let i=a.detail,o=i.fromSurface,n=i.toSurface,c=this.#l(o),l=this.#l(n);if(!c||!l)return;this.#n(c),this.#n(l);let h=n.querySelector(".sm-empty");if(h&&h.remove(),o.querySelectorAll(':scope > [draggable="true"]').length===0&&!o.querySelector(".sm-empty")){let g=document.createElement("p");g.className="sm-empty",g.textContent="No stories yet",o.appendChild(g)}let f=this.#d(i.item);this.#c(`${f} moved from ${c} to ${l}`),this.dispatchEvent(new CustomEvent("story-map:transfer",{bubbles:!0,detail:{itemId:i.itemId,fromActivity:c,toActivity:l,newIndex:i.newIndex}}))});let r=this.getAttribute("src");if(r){this._loadSrc(r);return}this.dispatchEvent(new CustomEvent("story-map:ready",{bubbles:!0,detail:{activityCount:this.#i.length,storyCount:e}}))}teardown(){this.#e&&(this.#e.remove(),this.#e=null),this.#a&&(this.#a.remove(),this.#a=null),this.#s=null,this.#r={},this.#i=[]}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();for(let r of s.activities||[]){let a=document.createElement("section");a.setAttribute("data-activity",r.id),a.setAttribute("data-activity-label",r.label||r.id),r.journeyPhase&&a.setAttribute("data-journey-phase",r.journeyPhase);for(let i of r.stories||[]){let o=document.createElement("user-story");o.setAttribute("draggable","true"),o.dataset.id=i.id||i.storyId,(i.storyId||i.id)&&o.setAttribute("story-id",i.storyId||i.id),i.title&&o.setAttribute("title",i.title),i.persona&&o.setAttribute("persona",i.persona),i.action&&o.setAttribute("action",i.action),i.benefit&&o.setAttribute("benefit",i.benefit),i.priority&&o.setAttribute("priority",i.priority),i.status&&o.setAttribute("status",i.status),i.points&&o.setAttribute("points",String(i.points)),o.setAttribute("detail",i.detail||"compact"),a.appendChild(o)}this.appendChild(a)}this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[story-map] Failed to load src="${t}":`,e)}}#l(t){if(!t)return null;for(let[e,s]of Object.entries(this.#r))if(s===t)return e;return null}#n(t){let e=this.#r[t];if(!e)return;let s=e.querySelectorAll(':scope > [draggable="true"]').length,r=e.closest("[data-activity-column]");if(!r)return;let a=r.querySelector(".sm-activity-count");a&&(a.textContent=String(s))}#c(t){this.#a&&(this.#a.textContent="",requestAnimationFrame(()=>{this.#a&&(this.#a.textContent=t)}))}#d(t){return t.getAttribute("story-id")||t.getAttribute("data-id")||t.textContent?.trim().slice(0,40)||"item"}#b(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("story-map",st);var R=`
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
    color: #dc2626;
  }

  .rs-popover__btn--delete:hover {
    background: #fef2f2;
    color: #dc2626;
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
    color: #fff;
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
    color: #fff;
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
    color: #fff;
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
  .state-msg--error { color: #dc2626; }

  @media (prefers-color-scheme: dark) {
    .rs-popover__btn--delete:hover {
      background: #450a0a;
    }
  }
`;function Dt(){let d=globalThis.localStorage;if(!d)throw new Error("VBStore: localStorage is not available in this environment");return{async getRaw(t){return d.getItem(t)},async setRaw(t,e){d.setItem(t,e)},async removeRaw(t){d.removeItem(t)},async keys(t){let e=[];for(let s=0;s<d.length;s++){let r=d.key(s);r&&r.startsWith(t)&&e.push(r)}return e}}}var D=null;function k(){return D||(D=Dt()),D}function rt(d,t){if(typeof d!="string"||!d)throw new TypeError("VBStore: namespace must be a non-empty string");if(typeof t!="string"||!t)throw new TypeError("VBStore: key must be a non-empty string");return`vb:${d}:${t}`}function xt(d){if(typeof d!="string"||!d)throw new TypeError("VBStore: namespace must be a non-empty string");return`vb:${d}:`}function _t(d){try{let t=JSON.parse(d);if(t&&typeof t=="object"&&typeof t.timestamp=="number")return t}catch{}return null}var P={configure(d={}){D=d.backend??null},async set(d,t,e){let s={data:e,timestamp:Date.now()};await k().setRaw(rt(d,t),JSON.stringify(s))},async get(d,t,e){let s=await k().getRaw(rt(d,t));if(s==null)return null;let r=_t(s);return!r||e?.maxAge!=null&&Date.now()-r.timestamp>e.maxAge?null:r.data},async remove(d,t){await k().removeRaw(rt(d,t))},async list(d){let t=xt(d),e=await k().keys(t),s=[];for(let r of e){let a=await k().getRaw(r);if(a==null)continue;let i=_t(a);i&&s.push({key:r.slice(t.length),data:i.data,timestamp:i.timestamp})}return s},async clear(d){let t=xt(d),e=await k().keys(t);for(let s of e)await k().removeRaw(s)},async clearAll(){let d=await k().keys("vb:");for(let t of d)await k().removeRaw(t)},async setMany(d,t){for(let[e,s]of t)await P.set(d,e,s)}};var I=class{#t=new Map;async load(){return[...this.#t.values()]}async save(t){return t.id||(t.id=crypto.randomUUID()),this.#t.set(t.id,t),t}async update(t,e){let s=this.#t.get(t);if(!s)throw new Error(`Pin ${t} not found`);return Object.assign(s,e),s}async remove(t){this.#t.delete(t)}},B=class{#t;constructor(t="default"){this.#t=t}async#e(){let t=await P.get("reviews",this.#t);return Array.isArray(t)?t:[]}async#s(t){await P.set("reviews",this.#t,t)}async load(){return this.#e()}async save(t){t.id||(t.id=crypto.randomUUID());let e=await this.#e();return e.push(t),await this.#s(e),t}async update(t,e){let s=await this.#e(),r=s.findIndex(a=>a.id===t);if(r===-1)throw new Error(`Pin ${t} not found`);return Object.assign(s[r],e),await this.#s(s),s[r]}async remove(t){let e=(await this.#e()).filter(s=>s.id!==t);await this.#s(e)}},O=class{#t;constructor(t){if(!t)throw new Error("RestAdapter requires an endpoint URL");this.#t=t.replace(/\/$/,"")}async load(){let t=await fetch(this.#t);if(!t.ok)throw new Error(`HTTP ${t.status}`);let e=await t.json();return Array.isArray(e)?e:e.pins||[]}async save(t){let e=await fetch(this.#t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}async update(t,e){let s=await fetch(`${this.#t}/${encodeURIComponent(t)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!s.ok)throw new Error(`HTTP ${s.status}`);return s.json()}async remove(t){let e=await fetch(`${this.#t}/${encodeURIComponent(t)}`,{method:"DELETE"});if(!e.ok)throw new Error(`HTTP ${e.status}`)}},at=class extends HTMLElement{static get observedAttributes(){return["src","editable","adapter","endpoint","storage-key","author","compact","show-resolved"]}#t=new Map;constructor(){super(),this.attachShadow({mode:"open"}),this.__pins=[],this.__adapter=null,this._activePin=null,this._annotating=!1}get pins(){return this.__pins}set pins(t){this.__pins=Array.isArray(t)?t:[],this.isConnected&&this._render()}get adapter(){return this.__adapter}set adapter(t){this.__adapter=t,this.isConnected&&this._loadFromAdapter()}#e(){for(let t of this.children){let e=t.getAttribute("slot");e&&this.#t.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#t.get(t)||""}connectedCallback(){this.#e(),this.setAttribute("data-upgraded",""),this.#s(),this.hasAttribute("src")?this._loadSrc(this.getAttribute("src")):this._loadFromAdapter()}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.removeAttribute("data-annotating")}attributeChangedCallback(t){this.isConnected&&(t==="src"?this._loadSrc(this.getAttribute("src")):t==="adapter"||t==="endpoint"||t==="storage-key"?(this.#s(),this._loadFromAdapter()):this._render())}#s(){if(this.__adapter&&!(this.__adapter instanceof I)&&!(this.__adapter instanceof B)&&!(this.__adapter instanceof O))return;switch(this.getAttribute("adapter")||"memory"){case"local":this.__adapter=new B(this.getAttribute("storage-key")||"default");break;case"rest":try{this.__adapter=new O(this.getAttribute("endpoint"))}catch{this.__adapter=new I}break;default:this.__adapter=new I}}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${R}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this.__pins=Array.isArray(s)?s:s.pins||[],this._render()}catch(e){this.shadowRoot.innerHTML=`<style>${R}</style><div class="state-msg state-msg--error">Could not load pins: ${m(e.message)}</div>`}}}async _loadFromAdapter(){if(this.__adapter){try{this.__pins=await this.__adapter.load()}catch{this.__pins=[]}this._render()}}async addPin(t){let e={id:crypto.randomUUID(),x:Math.max(0,Math.min(100,t.x)),y:Math.max(0,Math.min(100,t.y)),text:t.text||"",author:t.author||this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString(),resolved:!1,resolvedBy:null,resolvedAt:null,replies:[]};return this.__adapter&&await this.__adapter.save(e),this.__pins.push(e),this._render(),this.#n(`Pin ${this.#r().length} added`),this.dispatchEvent(new CustomEvent("review-surface:add",{bubbles:!0,composed:!0,detail:{pin:e}})),e}async removePin(t){let e=this.__pins.find(s=>s.id===t);e&&(this.__adapter&&await this.__adapter.remove(t),this.__pins=this.__pins.filter(s=>s.id!==t),this._activePin===t&&(this._activePin=null),this._render(),this.#n("Pin removed"),this.dispatchEvent(new CustomEvent("review-surface:remove",{bubbles:!0,composed:!0,detail:{pin:e}})))}async resolvePin(t){let e=this.__pins.find(r=>r.id===t);if(!e)return;let s={resolved:!0,resolvedBy:this.getAttribute("author")||"Anonymous",resolvedAt:new Date().toISOString()};this.__adapter&&await this.__adapter.update(t,s),Object.assign(e,s),this._render(),this.#n("Pin resolved"),this.dispatchEvent(new CustomEvent("review-surface:resolve",{bubbles:!0,composed:!0,detail:{pin:e}}))}async unresolvePin(t){let e=this.__pins.find(r=>r.id===t);if(!e)return;let s={resolved:!1,resolvedBy:null,resolvedAt:null};this.__adapter&&await this.__adapter.update(t,s),Object.assign(e,s),this._render(),this.#n("Pin re-opened"),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:e,changes:s}}))}exportPins(){return structuredClone(this.__pins)}importPins(t){this.__pins=Array.isArray(t)?structuredClone(t):[],this._activePin=null,this._render()}#r(){let t=this.hasAttribute("show-resolved");return this.__pins.filter(e=>t||!e.resolved).sort((e,s)=>new Date(e.createdAt)-new Date(s.createdAt))}_render(){let t=this.hasAttribute("editable"),e=this.#r(),s=this._activePin?this.__pins.find(r=>r.id===this._activePin):null;this.setAttribute("pin-count",String(e.length)),this.shadowRoot.innerHTML=`<style>${R}</style>
      <div class="rs-container">
        <slot></slot>
        <div class="rs-overlay" role="img" aria-label="Review annotation surface">
          ${e.map((r,a)=>this._renderPin(r,a+1)).join("")}
        </div>
        ${s?this._renderPopover(s,t):""}
      </div>
      ${t?this._renderToolbar(e.length):""}
      <div class="rs-live" aria-live="polite" aria-atomic="true"></div>`,this._bindListeners(t),this.dispatchEvent(new CustomEvent("review-surface:ready",{bubbles:!0,composed:!0,detail:{pinCount:e.length}}))}_renderPin(t,e){let s=t.text?t.text.slice(0,50):"Empty pin";return`<button class="rs-pin"
      data-pin-id="${m(t.id)}"
      ${t.resolved?"data-resolved":""}
      ${this._activePin===t.id?"data-active":""}
      style="left:${t.x}%;top:${t.y}%"
      aria-label="Pin ${e}: ${m(s)}"
      aria-expanded="${this._activePin===t.id}"
      aria-haspopup="dialog">
      <span class="rs-pin__number">${e}</span>
    </button>`}_renderPopover(t,e){let s=this.#r().findIndex(r=>r.id===t.id)+1;return`<div class="rs-popover" data-open
      style="left:${Math.min(t.x,70)}%;top:${t.y}%"
      role="dialog"
      aria-labelledby="rs-popover-title-${m(t.id)}">

      <div class="rs-popover__header">
        <span class="rs-popover__title" id="rs-popover-title-${m(t.id)}">
          Pin ${s}
          ${t.resolved?`<span class="rs-resolved-badge">${y(_.checkCircle)} Resolved</span>`:""}
        </span>
        <div class="rs-popover__actions">
          ${e&&!t.resolved?`
            <button class="rs-popover__btn rs-popover__btn--resolve" data-action="resolve" data-pin-id="${m(t.id)}"
              aria-label="Resolve pin" title="Resolve">${y(_.checkCircle)}</button>`:""}
          ${e&&t.resolved?`
            <button class="rs-popover__btn" data-action="unresolve" data-pin-id="${m(t.id)}"
              aria-label="Re-open pin" title="Re-open">${y(_.messageCircle)}</button>`:""}
          ${e?`
            <button class="rs-popover__btn rs-popover__btn--delete" data-action="delete" data-pin-id="${m(t.id)}"
              aria-label="Delete pin" title="Delete">${y(_.x)}</button>`:""}
          <button class="rs-popover__btn" data-action="close"
            aria-label="Close">${y(_.x)}</button>
        </div>
      </div>

      <div class="rs-comment">
        <div class="rs-comment__meta">
          <span class="rs-comment__avatar" style="background:${S(t.author||"Anonymous")}">${E(t.author||"Anonymous")}</span>
          <span class="rs-comment__author">${m(t.author||"Anonymous")}</span>
          <span class="rs-comment__time">${this.#l(t.createdAt)}</span>
        </div>
        <div class="rs-comment__text">${m(t.text)}</div>
      </div>

      ${t.replies?.length?`
        <div class="rs-replies">
          ${t.replies.map(r=>`
            <div class="rs-reply">
              <div class="rs-comment__meta">
                <span class="rs-comment__avatar" style="background:${S(r.author||"Anonymous")}">${E(r.author||"Anonymous")}</span>
                <span class="rs-comment__author">${m(r.author||"Anonymous")}</span>
                <span class="rs-comment__time">${this.#l(r.createdAt)}</span>
              </div>
              <div class="rs-comment__text">${m(r.text)}</div>
            </div>
          `).join("")}
        </div>`:""}

      ${e?`
        <div class="rs-input">
          <textarea class="rs-input__field" placeholder="Reply\u2026" rows="1"
            aria-label="Reply to pin ${s}"></textarea>
          <button class="rs-input__submit" data-action="reply" data-pin-id="${m(t.id)}"
            aria-label="Send reply">${y(_.send)}</button>
        </div>`:""}

    </div>`}_renderToolbar(t){return`<div class="rs-toolbar" role="toolbar" aria-label="Review tools">
      <button class="rs-toolbar__btn" data-action="toggle-mode"
        aria-pressed="${this._annotating}"
        title="Toggle annotate mode">
        ${y(_.mapPin)} Annotate
      </button>
      <button class="rs-toolbar__btn" data-action="export"
        title="Export pins as JSON">
        ${y(_.download)} Export
      </button>
      <output class="rs-toolbar__count">${t} pin${t!==1?"s":""}</output>
    </div>`}_bindListeners(t){let e=this.shadowRoot;e.querySelectorAll(".rs-pin").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();let o=a.dataset.pinId;this._activePin=this._activePin===o?null:o,this._render(),this._activePin&&this.dispatchEvent(new CustomEvent("review-surface:select",{bubbles:!0,composed:!0,detail:{pin:this.__pins.find(n=>n.id===o)}}))})});let s=e.querySelector(".rs-overlay");s&&t&&s.addEventListener("click",a=>{if(!this._annotating||a.target.closest(".rs-pin"))return;let i=s.getBoundingClientRect(),o=(a.clientX-i.left)/i.width*100,n=(a.clientY-i.top)/i.height*100;this.#a(o,n)}),e.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();let o=a.dataset.action,n=a.dataset.pinId;switch(o){case"close":this._activePin=null,this._render();break;case"resolve":this.resolvePin(n);break;case"unresolve":this.unresolvePin(n);break;case"delete":this.removePin(n);break;case"toggle-mode":this._annotating=!this._annotating,this._annotating?this.setAttribute("data-annotating",""):this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:this._annotating?"annotate":"view"}}));break;case"export":this.#i();break;case"reply":this.#o(n);break}})});let r=e.querySelector(".rs-input__field");r&&r.addEventListener("keydown",a=>{if(a.key==="Enter"&&!a.shiftKey){a.preventDefault();let i=e.querySelector('[data-action="reply"]')?.dataset.pinId;i&&this.#o(i)}}),e.addEventListener("keydown",a=>{a.key==="Escape"&&(this._activePin?(this._activePin=null,this._render()):this._annotating&&(this._annotating=!1,this.removeAttribute("data-annotating"),this._render(),this.dispatchEvent(new CustomEvent("review-surface:mode",{bubbles:!0,composed:!0,detail:{mode:"view"}}))))})}async#a(t,e){let s=this.getAttribute("author")||"Anonymous",r=await this.addPin({x:t,y:e,text:"",author:s});this._activePin=r.id,this._render(),requestAnimationFrame(()=>{let a=this.shadowRoot.querySelector(".rs-input__field");a&&a.focus()})}async#o(t){let e=this.shadowRoot.querySelector(".rs-input__field");if(!e)return;let s=e.value.trim();if(!s)return;let r=this.__pins.find(i=>i.id===t);if(!r)return;let a={id:crypto.randomUUID(),text:s,author:this.getAttribute("author")||"Anonymous",createdAt:new Date().toISOString()};r.replies||(r.replies=[]),r.text?(r.replies.push(a),this.__adapter&&await this.__adapter.update(t,{replies:r.replies})):(r.text=s,this.__adapter&&await this.__adapter.update(t,{text:s})),this._render(),this.#n("Reply added"),requestAnimationFrame(()=>{let i=this.shadowRoot.querySelector(".rs-input__field");i&&i.focus()}),this.dispatchEvent(new CustomEvent("review-surface:update",{bubbles:!0,composed:!0,detail:{pin:r,changes:{replies:r.replies}}}))}async#i(){let t=JSON.stringify(this.exportPins(),null,2);try{await navigator.clipboard.writeText(t),this.#n("Pins copied to clipboard")}catch{let e=new Blob([t],{type:"application/json"}),s=URL.createObjectURL(e),r=document.createElement("a");r.href=s,r.download="review-pins.json",r.click(),URL.revokeObjectURL(s),this.#n("Pins exported as file")}}#l(t){if(!t)return"";try{let e=new Date(t),r=new Date-e,a=Math.floor(r/6e4);if(a<1)return"just now";if(a<60)return`${a}m ago`;let i=Math.floor(a/60);if(i<24)return`${i}h ago`;let o=Math.floor(i/24);return o<7?`${o}d ago`:e.toLocaleDateString()}catch{return""}}#n(t){let e=this.shadowRoot.querySelector(".rs-live");e&&(e.textContent=t)}};x("review-surface",at);var $=864e5,ot=$*7,H=$*30,Pt=$*91,At=$*365;function z(d){return typeof d=="number"?d:new Date(d).getTime()}function Bt(d){return d<=ot*3?t=>t.toLocaleDateString(void 0,{month:"short",day:"numeric"}):d<=H*3?t=>t.toLocaleDateString(void 0,{month:"short",day:"numeric"}):d<=At?t=>t.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):t=>t.toLocaleDateString(void 0,{year:"numeric"})}function Ot(d){return d<=ot*3?"day":d<=H*3?"week":d<=At?"month":"quarter"}function wt(d){return String(d).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var it=class extends A{static get observedAttributes(){return["src","title","view","show-today","show-progress","show-dependencies","compact"]}#t=null;#e=null;#s=null;#r=[];#a=0;#o=0;#i=0;setup(){let t=this.querySelector(":scope > table");if(!t||(this.#r=this.#l(t),this.#r.length===0))return!1;this.#a=Math.min(...this.#r.map(e=>e.start)),this.#o=Math.max(...this.#r.map(e=>e.end)),this.#i=this.#o-this.#a,this.#i<=0&&(this.#i=$),this.#n(t),this.dispatchEvent(new CustomEvent("gantt-chart:ready",{bubbles:!0,detail:{taskCount:this.#r.length,dateRange:{start:new Date(this.#a).toISOString(),end:new Date(this.#o).toISOString()}}}))}teardown(){this.#s&&(this.#s.remove(),this.#s=null),this.#t&&(this.#t.remove(),this.#t=null),this.#e&&(this.#e.remove(),this.#e=null);let t=this.querySelector("table.gc-sr-only");t&&t.classList.remove("gc-sr-only"),this.#r=[]}attributeChangedCallback(t,e,s){e===s||!this.isConnected||(t==="src"?this._loadSrc(s):this.hasAttribute("data-upgraded")&&(this.teardown(),this.removeAttribute("data-upgraded"),this.setup()))}get tasks(){return this.#r}set tasks(t){let e=(t||[]).map((s,r)=>({id:s.id??`gc-task-${r}`,name:s.name??`Task ${r+1}`,start:typeof s.start=="number"?s.start:z(s.start),end:typeof s.end=="number"?s.end:s.end!=null?z(s.end):typeof s.start=="number"?s.start:z(s.start),progress:s.progress??0,group:s.group??null,depends:Array.isArray(s.depends)?s.depends:s.depends?String(s.depends).split(",").map(a=>a.trim()):[],status:s.status??null,assignee:s.assignee??null,milestone:!!s.milestone,color:s.color??null,storyIds:s.storyIds??[],itemIds:s.itemIds??[]}));if((this.#t||this.#s||this.#e)&&(this.#s&&(this.#s.remove(),this.#s=null),this.#t&&(this.#t.remove(),this.#t=null),this.#e&&(this.#e.remove(),this.#e=null)),this.#r=e,e.length>0){this.#a=Math.min(...e.map(r=>r.start)),this.#o=Math.max(...e.map(r=>r.end)),this.#i=this.#o-this.#a,this.#i<=0&&(this.#i=$);let s=this.querySelector(":scope > table");s||(s=document.createElement("table"),s.classList.add("gc-sr-only"),this.appendChild(s)),this.#n(s)}this.dispatchEvent(new CustomEvent("gantt-chart:tasks-changed",{detail:{tasks:e,source:"property"},bubbles:!0}))}#l(t){let e=t.querySelectorAll("tbody tr"),s=[];for(let r=0;r<e.length;r++){let a=e[r],i=a.querySelectorAll("time[datetime]");if(i.length<2&&!a.hasAttribute("data-milestone"))continue;let o=i[0]?.getAttribute("datetime"),n=i.length>1?i[1].getAttribute("datetime"):o;if(!o)continue;let c=a.querySelector("progress"),l=c?c.value/(c.max||100):0,h=a.cells[0]?.textContent?.trim()||`Task ${r+1}`;s.push({id:a.dataset.taskId||`gc-task-${r}`,name:h,start:z(o),end:z(n),progress:l,group:a.dataset.group||null,depends:a.dataset.depends?a.dataset.depends.split(",").map(u=>u.trim()):[],status:a.dataset.status||null,assignee:a.dataset.assignee||null,milestone:a.hasAttribute("data-milestone"),color:a.dataset.color||null,storyIds:a.dataset.storyIds?a.dataset.storyIds.split(",").map(u=>u.trim()):[],itemIds:a.dataset.itemIds?a.dataset.itemIds.split(",").map(u=>u.trim()):[]})}return s}#n(t){let e=this.getAttribute("title"),s=this.hasAttribute("show-today"),r=this.hasAttribute("show-progress"),a=this.hasAttribute("show-dependencies");e&&(this.#s=document.createElement("h2"),this.#s.className="gc-title",this.#s.textContent=e,this.insertBefore(this.#s,t)),this.#t=document.createElement("div"),this.#t.className="gc-container",this.#t.setAttribute("role","region"),this.#t.setAttribute("aria-label",`Gantt chart${e?": "+e:""}`);let i=this.#c();this.#t.appendChild(i);let o=document.createElement("div");o.className="gc-body";let n=document.createElement("div");n.className="gc-task-list";let c=document.createElement("div");c.className="gc-bars";let l=this.#b();c.appendChild(l);let h=this.#p();for(let[u,f]of h){if(h.size>1&&u){let g=document.createElement("div");g.className="gc-group-header";let p=document.createElement("span");p.className="gc-group-label",p.textContent=u,g.appendChild(p),n.appendChild(g);let b=document.createElement("div");b.className="gc-group-spacer",c.appendChild(b)}for(let g of f){let p=document.createElement("div");p.className="gc-task-row",p.setAttribute("data-task-id",g.id);let b=document.createElement("span");b.className="gc-task-name",b.textContent=g.name,p.appendChild(b);let v=document.createElement("span");v.className="gc-task-dates",v.textContent=`${new Date(g.start).toLocaleDateString()} to ${new Date(g.end).toLocaleDateString()}`,p.appendChild(v),n.appendChild(p);let w=document.createElement("div");w.className="gc-bar-row",g.milestone?w.appendChild(this.#y(g)):w.appendChild(this.#v(g,r)),c.appendChild(w)}}if(s){let u=this.#m();u&&c.appendChild(u)}a&&requestAnimationFrame(()=>{let u=this.#x(c);u&&c.appendChild(u)}),o.appendChild(n),o.appendChild(c),this.#t.appendChild(o),this.insertBefore(this.#t,t),t.classList.add("gc-sr-only"),this.#e=document.createElement("div"),this.#e.className="gc-sr-only",this.#e.setAttribute("role","status"),this.#e.setAttribute("aria-live","polite"),this.#e.setAttribute("aria-atomic","true"),this.appendChild(this.#e),this.listen(this.#t,"click",u=>{let f=u.target.closest(".gc-bar, .gc-milestone");if(!f)return;let g=f.dataset.taskId,p=this.#r.find(b=>b.id===g);p&&(this.#u(`Selected: ${p.name}`),this.dispatchEvent(new CustomEvent("gantt-chart:task-click",{bubbles:!0,detail:{task:p}})))}),this.listen(this.#t,"keydown",u=>{if(u.key==="Enter"||u.key===" "){let f=u.target.closest(".gc-bar, .gc-milestone");f&&(u.preventDefault(),f.click())}})}#c(){let t=document.createElement("div");t.className="gc-timeline-header";let e=document.createElement("div");e.className="gc-timeline-spacer",t.appendChild(e);let s=document.createElement("div");s.className="gc-timeline-dates";let r=this.#d();for(let{position:a,text:i}of r){let o=document.createElement("span");o.className="gc-date-label",o.style.left=`${a}%`,o.textContent=i,s.appendChild(o)}return t.appendChild(s),t}#d(){let t=this.getAttribute("view")||"auto",e=t==="auto"?Ot(this.#i):t,s=Bt(this.#i),r=[],a;switch(e){case"day":a=$;break;case"week":a=ot;break;case"month":a=H;break;case"quarter":a=Pt;break;default:a=H}let i=new Date(this.#a);if(e==="week"){let c=i.getDay(),l=c===0?1:c===1?0:8-c;i.setDate(i.getDate()+l)}else if(e==="month")i.setDate(1),i.getTime()<this.#a&&i.setMonth(i.getMonth()+1);else if(e==="quarter"){let c=i.getMonth(),l=Math.ceil((c+1)/3)*3;i.setMonth(l),i.setDate(1)}let o=i.getTime();o>this.#a+a*.5&&r.push({position:0,text:s(new Date(this.#a))});let n=o;for(;n<=this.#o;){let c=(n-this.#a)/this.#i*100;if(c>=0&&c<=100&&r.push({position:c,text:s(new Date(n))}),e==="month"){let l=new Date(n);l.setMonth(l.getMonth()+1),n=l.getTime()}else if(e==="quarter"){let l=new Date(n);l.setMonth(l.getMonth()+3),n=l.getTime()}else n+=a}return r}#b(){let t=document.createElement("div");t.className="gc-grid-lines";let e=this.#d();for(let{position:s}of e){if(s<=0)continue;let r=document.createElement("div");r.className="gc-grid-line",r.style.left=`${s}%`,t.appendChild(r)}return t}#p(){let t=new Map;for(let e of this.#r){let s=e.group||"";t.has(s)||t.set(s,[]),t.get(s).push(e)}return t}#v(t,e){let s=(t.start-this.#a)/this.#i*100,r=(t.end-t.start)/this.#i*100,a=document.createElement("div");if(a.className="gc-bar",a.setAttribute("data-task-id",t.id),a.setAttribute("role","img"),a.setAttribute("tabindex","0"),a.setAttribute("aria-label",`${wt(t.name)}: ${new Date(t.start).toLocaleDateString()} to ${new Date(t.end).toLocaleDateString()}`+(t.progress>0?`, ${Math.round(t.progress*100)}% complete`:"")),a.style.left=`${s}%`,a.style.width=`${Math.max(r,.5)}%`,t.status&&a.setAttribute("data-status",t.status),t.color&&a.style.setProperty("--gc-bar-color",t.color),e&&t.progress>0){let i=document.createElement("div");i.className="gc-bar-fill",i.style.width=`${Math.round(t.progress*100)}%`,a.appendChild(i)}if(r>8){let i=document.createElement("span");i.className="gc-bar-label",i.textContent=t.name,a.appendChild(i)}return a}#y(t){let e=(t.start-this.#a)/this.#i*100,s=document.createElement("div");return s.className="gc-milestone",s.setAttribute("data-task-id",t.id),s.setAttribute("role","img"),s.setAttribute("tabindex","0"),s.setAttribute("aria-label",`Milestone: ${wt(t.name)}, ${new Date(t.start).toLocaleDateString()}`),s.style.left=`${e}%`,t.status&&s.setAttribute("data-status",t.status),t.color&&s.style.setProperty("--gc-bar-color",t.color),s}#m(){let t=Date.now();if(t<this.#a||t>this.#o)return null;let e=(t-this.#a)/this.#i*100,s=document.createElement("div");s.className="gc-today-line",s.style.left=`${e}%`;let r=document.createElement("span");return r.className="gc-today-label",r.textContent="Today",s.appendChild(r),s}#x(t){if(!this.#r.some(n=>n.depends.length>0))return null;let s="http://www.w3.org/2000/svg",r=document.createElementNS(s,"svg");r.setAttribute("class","gc-deps"),r.style.width="100%",r.style.height="100%";let a=document.createElementNS(s,"defs"),i=document.createElementNS(s,"marker");i.setAttribute("id","gc-arrowhead"),i.setAttribute("markerWidth","8"),i.setAttribute("markerHeight","6"),i.setAttribute("refX","8"),i.setAttribute("refY","3"),i.setAttribute("orient","auto");let o=document.createElementNS(s,"polygon");o.setAttribute("points","0 0, 8 3, 0 6"),o.setAttribute("fill","var(--color-text-muted, #666666)"),i.appendChild(o),a.appendChild(i),r.appendChild(a);for(let n of this.#r)for(let c of n.depends){let l=this.#r.find(Et=>Et.id===c);if(!l)continue;let h=(l.end-this.#a)/this.#i*100,u=(n.start-this.#a)/this.#i*100,f=this.#g(l.id,t),g=this.#g(n.id,t);if(f===-1||g===-1)continue;let p=36,b=f*p+p/2,v=g*p+p/2,w=document.createElementNS(s,"path"),mt=h+(u-h)/2;w.setAttribute("d",`M ${h}% ${b} C ${mt}% ${b}, ${mt}% ${v}, ${u}% ${v}`),w.setAttribute("class","gc-dep-line"),r.appendChild(w)}return r}#g(t,e){let s=e.querySelectorAll(".gc-bar-row");for(let r=0;r<s.length;r++){let a=s[r].querySelector("[data-task-id]");if(a&&a.dataset.taskId===t)return r}return-1}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();let r=document.createElement("table"),a=document.createElement("thead"),i=document.createElement("tr");for(let n of["Task","Start","End","Progress"]){let c=document.createElement("th");c.textContent=n,i.appendChild(c)}a.appendChild(i),r.appendChild(a);let o=document.createElement("tbody");for(let n of s.tasks||[]){let c=document.createElement("tr");n.id&&(c.dataset.taskId=n.id),n.group&&(c.dataset.group=n.group),n.depends&&(c.dataset.depends=Array.isArray(n.depends)?n.depends.join(","):n.depends),n.status&&(c.dataset.status=n.status),n.assignee&&(c.dataset.assignee=n.assignee),n.milestone&&c.setAttribute("data-milestone",""),n.color&&(c.dataset.color=n.color),n.storyIds&&(c.dataset.storyIds=Array.isArray(n.storyIds)?n.storyIds.join(","):n.storyIds),n.itemIds&&(c.dataset.itemIds=Array.isArray(n.itemIds)?n.itemIds.join(","):n.itemIds);let l=document.createElement("td");l.textContent=n.name||"",c.appendChild(l);let h=document.createElement("td"),u=document.createElement("time");u.setAttribute("datetime",n.start),u.textContent=new Date(n.start).toLocaleDateString(void 0,{month:"short",day:"numeric"}),h.appendChild(u),c.appendChild(h);let f=document.createElement("td"),g=document.createElement("time");g.setAttribute("datetime",n.end||n.start),g.textContent=new Date(n.end||n.start).toLocaleDateString(void 0,{month:"short",day:"numeric"}),f.appendChild(g),c.appendChild(f);let p=document.createElement("td"),b=document.createElement("progress");b.value=n.progress||0,b.max=100,b.textContent=`${n.progress||0}%`,p.appendChild(b),c.appendChild(p),o.appendChild(c)}r.appendChild(o),this.appendChild(r),s.title&&this.setAttribute("title",s.title),this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[gantt-chart] Failed to load src="${t}":`,e)}}#u(t){this.#e&&(this.#e.textContent="",requestAnimationFrame(()=>{this.#e&&(this.#e.textContent=t)}))}};x("gantt-chart",it);var nt=class d extends A{static get observedAttributes(){return["src","compact","title","searchable"]}static#t=0;#e=null;#s=null;#r=null;#a=null;#o=null;#i="";#l=null;#n=[];#c=[];#d=new Map;#b=new Map;setup(){this.#i=`gloss-${++d.#t}`;let t=this.querySelector(":scope > dl");if(!t)return!1;let e=[...t.querySelectorAll(":scope > div[data-term-id]")];if(e.length===0)return!1;this.#n=e.map(a=>{let i=a.getAttribute("data-term-id")||"",o=a.getAttribute("data-category")||"Uncategorized",n=a.querySelector("dt"),c=a.querySelector("dd"),l=n?n.textContent.trim():"",h=c?c.textContent.trim():"";return a.id=i,{id:i,term:l,definition:h,category:o,el:a}});let s=new Set;this.#c=[];for(let a of this.#n)s.has(a.category)||(s.add(a.category),this.#c.push(a.category));t.remove(),this.#p();let r=this.getAttribute("src");if(r){this._loadSrc(r);return}this.dispatchEvent(new CustomEvent("glossary-wc:ready",{bubbles:!0,detail:{termCount:this.#n.length,categories:[...this.#c]}}))}teardown(){this.#l&&clearTimeout(this.#l);let t=this.querySelector(".gloss-title");t&&t.remove(),this.#e?.parentElement&&this.#e.parentElement.remove(),this.#s&&this.#s.remove(),this.#o&&this.#o.remove(),this.#a&&this.#a.remove(),this.#e=null,this.#s=null,this.#r=null,this.#a=null,this.#o=null,this.#n=[],this.#c=[],this.#d=new Map,this.#b=new Map}#p(){let t=this.getAttribute("title");if(t){let e=document.createElement("h2");e.className="gloss-title",e.textContent=t,this.#r=document.createElement("output"),this.#r.className="gloss-count",this.#r.textContent=String(this.#n.length),e.appendChild(this.#r),this.appendChild(e)}if(this.hasAttribute("searchable")){let e=document.createElement("div");e.className="gloss-search";let s=document.createElement("input");s.type="search",s.className="gloss-search-input",s.setAttribute("placeholder","Search terms\u2026"),s.setAttribute("aria-label","Search glossary terms"),e.appendChild(s),this.appendChild(e),this.#e=s,this.listen(s,"input",this.#m)}this.#v(),this.#o=document.createElement("div"),this.#o.className="gloss-categories",this.#o.setAttribute("role","region"),this.#o.setAttribute("aria-label","Glossary terms"),this.appendChild(this.#o);for(let e of this.#c){let s=this.#n.filter(r=>r.category===e);this.#y(e,s)}this.#a=document.createElement("div"),this.#a.className="gloss-live-region",this.#a.setAttribute("role","status"),this.#a.setAttribute("aria-live","polite"),this.#a.setAttribute("aria-atomic","true"),this.appendChild(this.#a)}#v(){this.#s=document.createElement("nav"),this.#s.className="gloss-jump-bar",this.#s.setAttribute("aria-label","Alphabet navigation");let t=new Set;for(let e of this.#n){let s=e.term.charAt(0).toUpperCase();/[A-Z]/.test(s)&&t.add(s)}for(let e=65;e<=90;e++){let s=String.fromCharCode(e),r=document.createElement("a");r.textContent=s,r.className="gloss-jump-letter",t.has(s)?(r.href=`#${this.#i}-letter-${s}`,r.setAttribute("data-active","")):(r.setAttribute("aria-disabled","true"),r.setAttribute("tabindex","-1")),this.#s.appendChild(r)}this.appendChild(this.#s)}#y(t,e){let s=document.createElement("section");s.className="gloss-category",s.setAttribute("data-category",t);let r=document.createElement("header");r.className="gloss-category-header";let a=document.createElement("button");a.type="button",a.className="gloss-category-toggle",a.setAttribute("aria-expanded","true"),a.innerHTML=`<span class="gloss-category-label">${m(t)}</span><output class="gloss-category-count">${e.length}</output><span class="gloss-chevron" aria-hidden="true"></span>`,r.appendChild(a),s.appendChild(r),this.#d.set(t,a);let i=document.createElement("dl");i.className="gloss-term-list";let o=[...e].sort((l,h)=>l.term.localeCompare(h.term)),n=[],c="";for(let l of o){let h=l.term.charAt(0).toUpperCase();if(/[A-Z]/.test(h)&&h!==c){c=h;let u=document.createElement("span");u.id=`${this.#i}-letter-${h}`,u.className="gloss-letter-anchor",i.appendChild(u)}l.el.className="gloss-term",l.el.id=l.id,i.appendChild(l.el),n.push(l.el)}this.#b.set(t,n),s.appendChild(i),this.#o.appendChild(s),this.listen(a,"click",()=>{let l=a.getAttribute("aria-expanded")==="true";a.setAttribute("aria-expanded",String(!l)),i.hidden=l})}#m=t=>{this.#l&&clearTimeout(this.#l),this.#l=setTimeout(()=>{let e=t.target.value.toLowerCase().trim();this.#x(e)},150)};#x(t){let e=0;for(let s of this.#n)t===""||s.term.toLowerCase().includes(t)||s.definition.toLowerCase().includes(t)?(s.el.removeAttribute("hidden"),e++):s.el.setAttribute("hidden","");for(let s of this.#c){let r=this.#b.get(s)||[],a=r[0]?.closest(".gloss-category");if(!a)continue;if(r.some(o=>!o.hasAttribute("hidden"))){a.removeAttribute("hidden");let o=r.filter(c=>!c.hasAttribute("hidden")).length,n=a.querySelector(".gloss-category-count");n&&(n.textContent=String(o))}else a.setAttribute("hidden","")}this.#r&&(this.#r.textContent=t===""?String(this.#n.length):`${e} / ${this.#n.length}`),t!==""&&this.#a&&(this.#a.textContent="",requestAnimationFrame(()=>{this.#a&&(this.#a.textContent=`${e} term${e!==1?"s":""} found`)})),this.dispatchEvent(new CustomEvent("glossary-wc:search",{bubbles:!0,detail:{query:t,matchCount:e}}))}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();let r=document.createElement("dl");for(let a of s.terms||[]){let i=document.createElement("div");i.setAttribute("data-term-id",a.id||""),i.setAttribute("data-category",a.category||"Uncategorized");let o=document.createElement("dt");o.textContent=a.term||"";let n=document.createElement("dd"),c=a.definition||"";if(a.seeAlso&&a.seeAlso.length>0){let l=a.seeAlso.map(h=>`<a href="#${m(h)}">${m(this.#g(h))}</a>`).join(", ");c+=` See also: ${l}.`}n.innerHTML=c,i.appendChild(o),i.appendChild(n),r.appendChild(i)}this.appendChild(r),s.title&&!this.getAttribute("title")&&this.setAttribute("title",s.title),this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[glossary-wc] Failed to load src="${t}":`,e)}}#g(t){return t.replace(/[-_]/g," ").replace(/\b\w/g,e=>e.toUpperCase())}};x("glossary-wc",nt);var T=`
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

/* Type colors */
.wi-type[data-type="task"]    { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.wi-type[data-type="bug"]     { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
.wi-type[data-type="chore"]   { color: #6b7280; background: rgba(107, 114, 128, 0.1); }
.wi-type[data-type="spike"]   { color: #8b5cf6; background: rgba(139, 92, 246, 0.1); }
.wi-type[data-type="feature"] { color: #059669; background: rgba(5, 150, 105, 0.1); }

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
  color: #fff;
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
  fill: white;
}

.wi-section-icon.description { background: #3b82f6; }
.wi-section-icon.checklist   { background: #22c55e; }
.wi-section-icon.notes       { background: #f59e0b; }

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
.state-msg--error { color: #dc2626; }
`;var Ct={task:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>',bug:'<path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',chore:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',spike:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',feature:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'},lt={critical:{label:"Critical",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"},high:{label:"High",color:"#ea580c",bg:"rgba(234, 88, 12, 0.1)"},medium:{label:"Medium",color:"#ca8a04",bg:"rgba(202, 138, 4, 0.1)"},low:{label:"Low",color:"#16a34a",bg:"rgba(22, 163, 74, 0.1)"}},ct={backlog:{label:"Backlog",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"},"to-do":{label:"To Do",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},"in-progress":{label:"In Progress",color:"#8b5cf6",bg:"rgba(139, 92, 246, 0.1)"},review:{label:"Review",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},done:{label:"Done",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"},blocked:{label:"Blocked",color:"#dc2626",bg:"rgba(220, 38, 38, 0.1)"}},dt=class extends HTMLElement{static get observedAttributes(){return["item-id","type","priority","status","estimate","assignee","story-ids","detail","compact","src"]}#t=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#e(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#t.set(e,t.textContent.trim())}}_resolve(t){return this.getAttribute(t)||this.#t.get(t)||""}connectedCallback(){this.#e(),this.itemId&&!this.id&&(this.id=this.itemId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#s(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,s){e!==s&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(s):this.#s())}get itemId(){return this.getAttribute("item-id")||""}get itemTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#t.get("title")||""}get itemType(){return this.getAttribute("type")||"task"}get priority(){return this.getAttribute("priority")||"medium"}get status(){return this.getAttribute("status")||"backlog"}get estimate(){return this.getAttribute("estimate")||""}get assignee(){return this.getAttribute("assignee")||""}get storyIds(){let t=this.getAttribute("story-ids")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}get _minimalLabel(){return this.itemTitle||this.itemId||"Work item"}updateStatus(t){ct[t]&&(this.setAttribute("status",t),this.dispatchEvent(new CustomEvent("work-item:status",{detail:{status:t,itemId:this.itemId},bubbles:!0,composed:!0})))}updatePriority(t){lt[t]&&(this.setAttribute("priority",t),this.dispatchEvent(new CustomEvent("work-item:priority",{detail:{priority:t,itemId:this.itemId},bubbles:!0,composed:!0})))}get data(){return{itemId:this.itemId||void 0,type:this.itemType,priority:this.priority,status:this.status,estimate:this.estimate||void 0,assignee:this.assignee||void 0,storyIds:this.storyIds.length?this.storyIds:void 0,detail:this.getAttribute("detail")||void 0,title:this.itemTitle||void 0}}set data(t){!t||typeof t!="object"||(this._applyData(t),this.shadowRoot&&this.#s(),this.dispatchEvent(new CustomEvent("work-item:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(t){for(let[e,s]of[["itemId","item-id"],["type","type"],["priority","priority"],["status","status"],["estimate","estimate"],["assignee","assignee"],["detail","detail"]])t[e]!=null&&this.setAttribute(s,String(t[e]));if(t.storyIds&&this.setAttribute("story-ids",Array.isArray(t.storyIds)?t.storyIds.join(","):t.storyIds),t.title&&!this.querySelector('[slot="title"]')){let e=document.createElement("h3");e.slot="title",e.textContent=t.title,this.appendChild(e)}for(let e of["description","notes"])if(t[e]&&!this.querySelector(`[slot="${e}"]`)){let s=document.createElement("p");s.slot=e,s.textContent=t[e],this.appendChild(s)}if(t.checklist&&!this.querySelector('[slot="checklist"]')){let e=document.createElement("ul");e.slot="checklist";let s=Array.isArray(t.checklist)?t.checklist:[t.checklist];for(let r of s){let a=document.createElement("li");a.textContent=r,e.appendChild(a)}this.appendChild(e)}}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${T}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();this._applyData(s),this.#s()}catch(e){this.shadowRoot.innerHTML=`<style>${T}</style><div class="state-msg state-msg--error">Could not load: ${m(e.message)}</div>`}}}#s(){let t=lt[this.priority]||lt.medium,e=ct[this.status]||ct.backlog,s=this.itemType,r=Ct[s]||Ct.task,a=this._detailLevel,i=this.itemId?`Work item: ${m(this.itemId)}`:"Work item";if(a==="minimal"){this.shadowRoot.innerHTML=`<style>${T}</style>
        <article class="wi-card wi-card--minimal" role="article" aria-label="${i}"
          tabindex="0">
          <div class="wi-body">
            <div class="wi-meta">
              ${this.itemId?`<span class="wi-id">${m(this.itemId)}</span>`:""}
              <span class="wi-type" data-type="${m(s)}">${y(r)} ${m(s)}</span>
            </div>
            <div class="wi-title-wrap">
              <slot name="title"><span class="wi-title-fallback">${m(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;return}if(this.shadowRoot.innerHTML=`<style>${T}</style>
      <article class="wi-card wi-card--${a}" role="article" aria-label="${i}">

        <header class="wi-header">
          <div class="wi-meta">
            ${this.itemId?`<span class="wi-id">${m(this.itemId)}</span>`:""}
            <span class="wi-type" data-type="${m(s)}">${y(r)} ${m(s)}</span>
          </div>
          <div class="wi-badges">
            <span class="wi-priority" style="color:${t.color};background:${t.bg}">${m(t.label)}</span>
            <span class="wi-status" style="color:${e.color};background:${e.bg}">${m(e.label)}</span>
            ${this.estimate?`<span class="wi-estimate" title="Estimate">${m(this.estimate)}</span>`:""}
          </div>
        </header>

        <div class="wi-body">
          <div class="wi-title-wrap">
            <slot name="title"><span class="wi-title-fallback">[Untitled work item]</span></slot>
          </div>

          ${this.assignee?`
            <div class="wi-assignee">
              <span class="wi-assignee__avatar" style="background:${S(this.assignee)}">${E(this.assignee)}</span>
              ${m(this.assignee)}
            </div>`:""}

          ${this.storyIds.length?`
            <div class="wi-links">
              ${this.storyIds.map(o=>`<a class="wi-link" href="#${m(o)}">${y('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/>')} ${m(o)}</a>`).join("")}
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

      </article>`,a==="compact")for(let o of this.shadowRoot.querySelectorAll(".wi-section")){let n=o.querySelector("slot");n&&n.assignedNodes().length===0&&o.setAttribute("data-empty","")}this.dispatchEvent(new CustomEvent("work-item:ready",{detail:{itemId:this.itemId,title:this.itemTitle,type:s,priority:this.priority,status:this.status},bubbles:!0,composed:!0}))}};x("work-item",dt);var U={layout:{label:"Layout",cssClass:"sm-badge--layout"},section:{label:"Section",cssClass:"sm-badge--section"},dashboard:{label:"Dashboard",cssClass:"sm-badge--dashboard"},page:{label:"Page",cssClass:"sm-badge--page"},modal:{label:"Modal",cssClass:"sm-badge--modal"},redirect:{label:"Redirect",cssClass:"sm-badge--redirect"}},F={draft:{label:"Draft",cssClass:"sm-status--draft"},ready:{label:"Ready",cssClass:"sm-status--ready"},live:{label:"Live",cssClass:"sm-status--live"},deprecated:{label:"Deprecated",cssClass:"sm-status--deprecated"}},ht=class d extends A{static get observedAttributes(){return["src","collapsed","compact","title","data-view","data-orientation","data-detail"]}static#t=0;#e=null;#s=null;#r=null;#a=null;#o=0;#i=0;setup(){d.#t++;let t=this.getAttribute("src");if(t&&!this.querySelector("nav")){this._loadSrc(t);return}let e=this.querySelector(":scope > nav");if(e){if(this.#o=0,this.#i=0,this.#l(e.querySelector("ul"),0),this.dataset.view==="visual"){this.#c(),this.#G(e),this.dispatchEvent(new CustomEvent("site-map-wc:ready",{bubbles:!0,detail:{nodeCount:this.#o,depth:this.#i}}));return}this.#n(e.querySelector("ul"),0),this.#c(),e.classList.add("sm-tree"),e.setAttribute("role","tree"),e.setAttribute("aria-label",this.getAttribute("title")||"Site map"),this.#e=e,this.hasAttribute("collapsed")&&this.#d(),this.listen(e,"keydown",s=>this.#y(s)),this.listen(e,"click",s=>this.#v(s)),this.dispatchEvent(new CustomEvent("site-map-wc:ready",{bubbles:!0,detail:{nodeCount:this.#o,depth:this.#i}}))}}teardown(){if(this.#r){this.#r.remove(),this.#r=null;let t=this.querySelector("nav");t&&(t.style.display="",t.removeAttribute("aria-hidden"))}this.#s&&(this.#s.remove(),this.#s=null),this.#e&&(this.#e.classList.remove("sm-tree"),this.#e.removeAttribute("role"),this.#e.removeAttribute("aria-label")),this.querySelectorAll(".sm-node-content, .sm-toggle").forEach(t=>t.remove()),this.querySelectorAll('li[role="treeitem"]').forEach(t=>{t.removeAttribute("role"),t.removeAttribute("aria-expanded"),t.removeAttribute("tabindex")}),this.querySelectorAll('ul[role="group"]').forEach(t=>{t.removeAttribute("role"),t.classList.remove("sm-subtree","sm-collapsed")}),this.#e=null,this.#a=null,this.#o=0,this.#i=0}attributeChangedCallback(t,e,s){e===s||!this.isConnected||t==="src"&&this._loadSrc(s)}#l(t,e){if(!t)return;let s=t.querySelectorAll(":scope > li");for(let r of s){this.#o++;let a=e+1;a>this.#i&&(this.#i=a);let i=r.querySelector(":scope > ul");i&&this.#l(i,a)}}#n(t,e){if(!t)return;e>0&&(t.setAttribute("role","group"),t.classList.add("sm-subtree"));let s=[...t.querySelectorAll(":scope > li")];for(let r of s){let a=!!r.querySelector(":scope > ul"),i=r.querySelector(":scope > a"),o=r.getAttribute("data-page-type")||"page",n=r.getAttribute("data-template")||"",c=r.getAttribute("data-status")||"";r.setAttribute("role","treeitem"),r.setAttribute("tabindex","-1");let l=document.createElement("span");if(l.className="sm-node-content",a){r.setAttribute("aria-expanded","true");let u=document.createElement("button");u.className="sm-toggle",u.setAttribute("type","button"),u.setAttribute("aria-hidden","true"),u.setAttribute("tabindex","-1"),u.textContent="\u25BE",l.appendChild(u)}else{let u=document.createElement("span");u.className="sm-leaf-marker",u.setAttribute("aria-hidden","true"),l.appendChild(u)}if(c&&F[c]){let u=document.createElement("span");u.className=`sm-status-dot ${F[c].cssClass}`,u.setAttribute("title",F[c].label),u.setAttribute("aria-label",F[c].label),l.appendChild(u)}if(i&&l.appendChild(i),U[o]){let u=document.createElement("span");u.className=`sm-badge ${U[o].cssClass}`,u.textContent=U[o].label,l.appendChild(u)}if(n){let u=document.createElement("span");u.className="sm-badge sm-badge--template",u.textContent=n,l.appendChild(u)}r.insertBefore(l,r.firstChild);let h=r.querySelector(":scope > ul");h&&this.#n(h,e+1)}}#c(){let t=this.getAttribute("title");if(!t&&this.#o===0)return;if(this.#s=document.createElement("div"),this.#s.className="sm-header",t){let r=document.createElement("h2");r.className="sm-title",r.textContent=t,this.#s.appendChild(r)}let e=document.createElement("span");e.className="sm-summary",e.textContent=`${this.#o} pages \xB7 ${this.#i} levels deep`,this.#s.appendChild(e);let s=document.createElement("button");s.className="sm-toggle-all",s.setAttribute("type","button"),s.textContent="Collapse all",s.addEventListener("click",()=>{this.querySelectorAll('li[aria-expanded="true"]').length>0?(this.#d(),s.textContent="Expand all"):(this.#b(),s.textContent="Collapse all")}),this.#s.appendChild(s),this.insertBefore(this.#s,this.firstChild)}#d(){let t=this.querySelectorAll("li[aria-expanded]");for(let e of t){e.setAttribute("aria-expanded","false");let s=e.querySelector(":scope > ul");s&&s.classList.add("sm-collapsed");let r=e.querySelector(":scope > .sm-node-content > .sm-toggle");r&&(r.textContent="\u25B8")}}#b(){let t=this.querySelectorAll("li[aria-expanded]");for(let e of t){e.setAttribute("aria-expanded","true");let s=e.querySelector(":scope > ul");s&&s.classList.remove("sm-collapsed");let r=e.querySelector(":scope > .sm-node-content > .sm-toggle");r&&(r.textContent="\u25BE")}}#p(t){let e=t.getAttribute("aria-expanded")==="true";t.setAttribute("aria-expanded",e?"false":"true");let s=t.querySelector(":scope > ul");s&&s.classList.toggle("sm-collapsed",e);let r=t.querySelector(":scope > .sm-node-content > .sm-toggle");r&&(r.textContent=e?"\u25B8":"\u25BE")}#v(t){let e=t.target;if(e.closest(".sm-toggle")){t.preventDefault();let a=e.closest('li[role="treeitem"]');a&&this.#p(a);return}let s=e.closest('li[role="treeitem"]');if(!s)return;this.#u(s);let r=e.closest("a");r&&this.dispatchEvent(new CustomEvent("site-map-wc:select",{bubbles:!0,detail:{href:r.getAttribute("href")||"",pageType:s.getAttribute("data-page-type")||"page",template:s.getAttribute("data-template")||""}}))}#y(t){let e=t.target.closest('li[role="treeitem"]');if(!e)return;let s=t.key,r=!1;switch(s){case"ArrowDown":r=!0,this.#x(e);break;case"ArrowUp":r=!0,this.#g(e);break;case"ArrowRight":if(r=!0,e.getAttribute("aria-expanded")==="false")this.#p(e);else if(e.getAttribute("aria-expanded")==="true"){let a=e.querySelector(':scope > ul > li[role="treeitem"]');a&&this.#u(a)}break;case"ArrowLeft":if(r=!0,e.getAttribute("aria-expanded")==="true")this.#p(e);else{let a=e.parentElement?.closest('li[role="treeitem"]');a&&this.#u(a)}break;case"Enter":r=!0,e.hasAttribute("aria-expanded")&&this.#p(e);break;case" ":r=!0;{let a=e.querySelector(":scope > .sm-node-content > a");a&&a.click()}break;case"Home":r=!0;{let a=this.querySelector('li[role="treeitem"]');a&&this.#u(a)}break;case"End":r=!0;{let a=this.#m();a.length&&this.#u(a[a.length-1])}break}r&&(t.preventDefault(),t.stopPropagation())}#m(){let t=[],e=r=>{if(!r)return;let a=[...r.querySelectorAll(':scope > li[role="treeitem"]')];for(let i of a)if(t.push(i),i.getAttribute("aria-expanded")==="true"){let o=i.querySelector(":scope > ul");o&&e(o)}},s=this.querySelector("nav > ul");return e(s),t}#x(t){let e=this.#m(),s=e.indexOf(t);s>=0&&s<e.length-1&&this.#u(e[s+1])}#g(t){let e=this.#m(),s=e.indexOf(t);s>0&&this.#u(e[s-1])}#u(t){this.#a&&this.#a.setAttribute("tabindex","-1"),t.setAttribute("tabindex","0"),t.focus(),this.#a=t}static#_="http://www.w3.org/2000/svg";static#f=150;static#w=70;static#q=30;static#k=50;static#A=20;static#j={layout:{stroke:"#8b5cf6",fill:"#f5f3ff",text:"#6d28d9"},section:{stroke:"#3b82f6",fill:"#eff6ff",text:"#1d4ed8"},dashboard:{stroke:"#22c55e",fill:"#f0fdf4",text:"#15803d"},page:{stroke:"#94a3b8",fill:"#f8fafc",text:"#475569"},modal:{stroke:"#f59e0b",fill:"#fffbeb",text:"#b45309"},redirect:{stroke:"#ef4444",fill:"#fef2f2",text:"#b91c1c"}};static#R={draft:"#94a3b8",ready:"#f59e0b",live:"#22c55e",deprecated:"#ef4444"};#D(t){let e=[];for(let s of t.querySelectorAll(":scope > li")){let r=s.querySelector(":scope > a"),a=s.querySelector(":scope > ul");e.push({label:r?.textContent?.trim()||s.firstChild?.textContent?.trim()||"",href:r?.getAttribute("href")||"",pageType:s.getAttribute("data-page-type")||"page",template:s.getAttribute("data-template")||"",status:s.getAttribute("data-status")||"",children:a?this.#D(a):[],x:0,y:0,subtreeWidth:0,collapsed:!1,childCount:0})}return e}#P(t,e=0){let s=d.#f,r=d.#w,a=d.#q,i=d.#k;for(let o of t)o.childCount=this.#B(o),o.children.length>0&&!o.collapsed?(this.#P(o.children,e+1),o.subtreeWidth=o.children.reduce((n,c)=>n+c.subtreeWidth,0)+a*(o.children.length-1)):o.subtreeWidth=s,o.subtreeWidth=Math.max(o.subtreeWidth,s)}#B(t){let e=0;for(let s of t.children)e+=1+this.#B(s);return e}#O(t,e,s){let r=d.#f,a=d.#w,i=d.#q,o=d.#k,n=e;for(let c of t)c.x=n+(c.subtreeWidth-r)/2,c.y=s,c.children.length>0&&!c.collapsed&&this.#O(c.children,n,s+a+o),n+=c.subtreeWidth+i}#G(t){t.style.display="none",t.setAttribute("aria-hidden","true");let e=t.querySelector("ul");e&&(this.#h=this.#D(e),this.#S())}#h=null;#C=1;get#N(){return this.dataset.orientation==="horizontal"?"horizontal":"vertical"}get#H(){return Math.min(4,Math.max(0,parseInt(this.dataset.detail||"2",10)))}static#I={zoomIn:'<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',zoomOut:'<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/>',reset:'<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>',flip:'<path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/>'};static#U=["Shape","Shape + Title","Full","Full + Status","Wireframe"];#S(){if(!this.#h)return;this.#r&&this.#r.remove();let t=d.#_,e=d.#f,s=d.#w,r=d.#A,a=this.#N==="horizontal";this.#P(this.#h),this.#O(this.#h,r,r);let i=this.#K(this.#h),o=i.maxX+e+r,n=i.maxY+s+r;a&&([o,n]=[n,o]),this.#r=document.createElement("div"),this.#r.className="sm-visual",this.#r.setAttribute("tabindex","-1"),this.#r.appendChild(this.#J());let c=document.createElementNS(t,"svg");c.setAttribute("viewBox",`0 0 ${o} ${n}`),c.setAttribute("width",String(o)),c.setAttribute("height",String(n)),c.setAttribute("role","img"),c.setAttribute("aria-label",`Site map${this.getAttribute("title")?": "+this.getAttribute("title"):""}`);let l=document.createElement("div");if(l.className="sm-visual-zoom",l.style.width=`${Math.round(o*this.#C)}px`,l.style.height=`${Math.round(n*this.#C)}px`,c.style.transform=`scale(${this.#C})`,c.style.transformOrigin="0 0",a){let f=document.createElementNS(t,"g");f.setAttribute("transform",`rotate(90 0 0) translate(0 -${n})`),this.#M(f,this.#h),this.#L(f,this.#h),c.appendChild(f)}else this.#M(c,this.#h),this.#L(c,this.#h);l.appendChild(c),this.#r.appendChild(l);let h=document.createElement("div");h.className="sm-visual-summary";let u=Math.round(this.#C*100);h.textContent=`${this.#o} pages \xB7 ${this.#i} levels \xB7 ${u}%`,this.#r.appendChild(h),this.appendChild(this.#r),this.#st(this.#r,c),this.listen(c,"click",f=>{let g=f.target,p=g.closest("[data-toggle]");if(p){let v=p.getAttribute("data-toggle");this.#Y(v);return}let b=g.closest("[data-node-id]");b&&(this.#E(b.getAttribute("data-node-id")),this.dispatchEvent(new CustomEvent("site-map-wc:select",{bubbles:!0,detail:{href:b.getAttribute("data-href")||"",pageType:b.getAttribute("data-page-type")||"page",template:b.getAttribute("data-template")||""}})))}),c.setAttribute("tabindex","0"),c.setAttribute("role","tree"),c.setAttribute("aria-label",`Site map${this.getAttribute("title")?": "+this.getAttribute("title"):""} \u2014 use arrow keys to navigate`),c.addEventListener("keydown",f=>this.#tt(f)),requestAnimationFrame(()=>{let f=c.querySelector("[data-node-id]");f&&this.#V(f)})}#J(){let t=document.createElement("div");t.className="sm-vtoolbar",t.setAttribute("role","toolbar"),t.setAttribute("aria-label","Site map controls");let e=f=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${f}</svg>`,s=this.#z(e(d.#I.zoomIn),"Zoom in",()=>{this.#C=Math.min(3,this.#C+.25),this.#S()});t.appendChild(s);let r=this.#z(e(d.#I.zoomOut),"Zoom out",()=>{this.#C=Math.max(.25,this.#C-.25),this.#S()});t.appendChild(r);let a=this.#z(e(d.#I.reset),"Reset zoom",()=>{this.#C=1,this.#S()});t.appendChild(a);let i=document.createElement("span");i.className="sm-vtoolbar-sep",t.appendChild(i);let o=this.#N==="horizontal"?"Vertical":"Horizontal",n=this.#z(e(d.#I.flip),o,()=>{this.dataset.orientation=this.#N==="horizontal"?"vertical":"horizontal",this.#S()});t.appendChild(n),t.appendChild(i.cloneNode());let c=this.#H,l=document.createElement("label");l.className="sm-vtoolbar-detail",l.textContent="Detail ";let h=document.createElement("input");h.type="range",h.min="0",h.max="4",h.value=String(c),h.setAttribute("aria-label","Detail level"),h.className="sm-vtoolbar-slider",l.appendChild(h);let u=document.createElement("span");return u.className="sm-vtoolbar-detail-label",u.textContent=d.#U[c],l.appendChild(u),h.addEventListener("input",()=>{this.dataset.detail=h.value,u.textContent=d.#U[parseInt(h.value,10)],this.#S()}),t.appendChild(l),t}#z(t,e,s){let r=document.createElement("button");return r.type="button",r.className="sm-vtoolbar-btn",r.innerHTML=t,r.setAttribute("aria-label",e),r.setAttribute("title",e),r.addEventListener("click",s),r}#T=null;#F(t,e=""){let s=[];for(let r=0;r<t.length;r++){let a=t[r],i=e?`${e}-${r}`:String(r);s.push(i),a.children.length>0&&!a.collapsed&&s.push(...this.#F(a.children,i))}return s}#Z(t){let e=t.lastIndexOf("-");return e>0?t.slice(0,e):null}#rt(t){let e=this.#$(t,this.#h);return!e||e.collapsed||e.children.length===0?null:`${t}-0`}#E(t){if(!t||!this.#r)return;let e=this.#r.querySelector('svg[role="tree"]');if(!e)return;let s=e.querySelector(`[data-node-id="${t}"]`);if(!s)return;this.#V(s),this.#T=t;let r=s.querySelector("rect");if(r&&this.#r){let a=r.getBoundingClientRect(),i=this.#r.getBoundingClientRect();(a.left<i.left||a.right>i.right||a.top<i.top||a.bottom>i.bottom)&&r.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"})}}#V(t){let e=t.closest("svg");if(!e)return;e.querySelectorAll(".sm-vfocus-ring").forEach(a=>a.remove()),e.querySelectorAll("[data-node-id]").forEach(a=>a.removeAttribute("aria-current"));let s=d.#_,r=t.querySelector("rect");if(r){let a=document.createElementNS(s,"rect");a.setAttribute("x",String(parseFloat(r.getAttribute("x"))-3)),a.setAttribute("y",String(parseFloat(r.getAttribute("y"))-3)),a.setAttribute("width",String(parseFloat(r.getAttribute("width"))+6)),a.setAttribute("height",String(parseFloat(r.getAttribute("height"))+6)),a.setAttribute("rx","11"),a.setAttribute("fill","none"),a.setAttribute("stroke","#3b82f6"),a.setAttribute("stroke-width","2"),a.setAttribute("class","sm-vfocus-ring"),t.parentNode.insertBefore(a,t)}t.setAttribute("aria-current","true"),this.#T=t.getAttribute("data-node-id")}#tt(t){if(!this.#h)return;let e=this.#T||"0",s=!1;switch(t.key){case"ArrowDown":{s=!0;let r=this.#$(e,this.#h);r&&r.children.length>0&&!r.collapsed&&this.#E(`${e}-0`);break}case"ArrowUp":{s=!0;let r=this.#Z(e);r&&this.#E(r);break}case"ArrowRight":{s=!0;let r=this.#W(e,1);r&&this.#E(r);break}case"ArrowLeft":{s=!0;let r=this.#W(e,-1);r&&this.#E(r);break}case"Enter":case" ":{s=!0;let r=this.#$(e,this.#h);r&&r.children.length>0&&this.#Y(e);break}case"Home":{s=!0,this.#E("0");break}case"End":{s=!0;let r=this.#F(this.#h);r.length&&this.#E(r[r.length-1]);break}}s&&(t.preventDefault(),t.stopPropagation())}#W(t,e){let s=t.split("-").map(Number),r=s[s.length-1]+e;if(r<0)return null;let a=s.length>1?s.slice(0,-1).join("-"):null,i=a?this.#$(a,this.#h):null,o=i?i.children:this.#h;if(!o||r>=o.length)return null;let n=[...s];return n[n.length-1]=r,n.join("-")}#X=!1;#et={dragging:!1,startX:0,startY:0,scrollLeft:0,scrollTop:0,moved:!1};#st(t,e){if(e.style.cursor="grab",this.#X)return;this.#X=!0;let s=this.#et;this.listen(this,"pointerdown",r=>{if(r.target.closest("button, [data-toggle], .sm-vtoolbar, input"))return;let a=this.querySelector(".sm-visual");if(!a)return;s.dragging=!0,s.moved=!1,s.startX=r.clientX,s.startY=r.clientY,s.scrollLeft=a.scrollLeft,s.scrollTop=a.scrollTop;let i=this.querySelector('svg[role="tree"]');i&&(i.style.cursor="grabbing")}),this.listen(window,"pointermove",r=>{if(!s.dragging)return;let a=r.clientX-s.startX,i=r.clientY-s.startY;(Math.abs(a)>3||Math.abs(i)>3)&&(s.moved=!0);let o=this.querySelector(".sm-visual");o&&(o.scrollLeft=s.scrollLeft-a,o.scrollTop=s.scrollTop-i)}),this.listen(window,"pointerup",()=>{if(!s.dragging)return;s.dragging=!1;let r=this.querySelector('svg[role="tree"]');r&&(r.style.cursor="grab")}),this.listen(this,"click",r=>{s.moved&&(r.stopPropagation(),s.moved=!1)},{capture:!0})}#K(t){let e=0,s=0;for(let r of t)if(r.x+d.#f>e&&(e=r.x+d.#f),r.y+d.#w>s&&(s=r.y+d.#w),r.children.length>0&&!r.collapsed){let a=this.#K(r.children);a.maxX>e&&(e=a.maxX),a.maxY>s&&(s=a.maxY)}return{maxX:e,maxY:s}}#M(t,e){let s=d.#_,r=d.#f,a=d.#w,i=d.#k;for(let o of e){if(o.children.length===0||o.collapsed)continue;let n=o.x+r/2,c=o.y+a,l=c+i/2;for(let h of o.children){let u=h.x+r/2,f=h.y,g=document.createElementNS(s,"path");g.setAttribute("d",`M ${n} ${c} L ${n} ${l} L ${u} ${l} L ${u} ${f}`),g.setAttribute("fill","none"),g.setAttribute("stroke","#cbd5e1"),g.setAttribute("stroke-width","1.5"),t.appendChild(g)}this.#M(t,o.children)}}#L(t,e,s=""){let r=d.#_,a=d.#f,i=d.#w,o=this.#H,n=o>=4;for(let c=0;c<e.length;c++){let l=e[c],h=s?`${s}-${c}`:String(c),u=n?{stroke:"#94a3b8",fill:"#ffffff",text:"#475569"}:d.#j[l.pageType]||d.#j.page,f=document.createElementNS(r,"g");f.setAttribute("data-node-id",h),f.setAttribute("data-href",l.href),f.setAttribute("data-page-type",l.pageType),f.setAttribute("data-template",l.template),f.style.cursor="pointer";let g=document.createElementNS(r,"rect");if(g.setAttribute("x",String(l.x)),g.setAttribute("y",String(l.y)),g.setAttribute("width",String(a)),g.setAttribute("height",String(i)),g.setAttribute("rx","8"),g.setAttribute("fill",u.fill),g.setAttribute("stroke",u.stroke),g.setAttribute("stroke-width",n?"1":"2"),(n||l.pageType==="modal")&&g.setAttribute("stroke-dasharray","6 3"),f.appendChild(g),o>=1){let p=document.createElementNS(r,"text");p.setAttribute("x",String(l.x+a/2)),p.setAttribute("y",String(o===1?l.y+i/2+5:l.y+24)),p.setAttribute("text-anchor","middle"),p.setAttribute("font-size","13"),p.setAttribute("font-weight","600"),p.setAttribute("fill",u.text),p.setAttribute("font-family","system-ui, sans-serif"),p.textContent=l.label.length>18?l.label.slice(0,17)+"\u2026":l.label,f.appendChild(p)}if(o>=2){let p=document.createElementNS(r,"text");if(p.setAttribute("x",String(l.x+a/2)),p.setAttribute("y",String(l.y+40)),p.setAttribute("text-anchor","middle"),p.setAttribute("font-size","9"),p.setAttribute("font-weight","700"),p.setAttribute("fill",u.stroke),p.setAttribute("font-family","system-ui, sans-serif"),p.textContent=(U[l.pageType]?.label||l.pageType).toUpperCase(),f.appendChild(p),l.template){let b=document.createElementNS(r,"text");b.setAttribute("x",String(l.x+a/2)),b.setAttribute("y",String(l.y+54)),b.setAttribute("text-anchor","middle"),b.setAttribute("font-size","9"),b.setAttribute("fill","#94a3b8"),b.setAttribute("font-family","system-ui, sans-serif"),b.textContent=l.template,f.appendChild(b)}}if(o>=3&&l.status&&d.#R[l.status]){let p=document.createElementNS(r,"circle");p.setAttribute("cx",String(l.x+a/2)),p.setAttribute("cy",String(l.y+i-8)),p.setAttribute("r","4"),p.setAttribute("fill",n?"#94a3b8":d.#R[l.status]),f.appendChild(p)}if(n)for(let p=0;p<2;p++){let b=document.createElementNS(r,"line");b.setAttribute("x1",String(l.x+12)),b.setAttribute("x2",String(l.x+a-12)),b.setAttribute("y1",String(l.y+i-22+p*8)),b.setAttribute("y2",String(l.y+i-22+p*8)),b.setAttribute("stroke","#cbd5e1"),b.setAttribute("stroke-width","1"),b.setAttribute("stroke-dasharray","3 2"),f.appendChild(b)}if(l.children.length>0){let p=document.createElementNS(r,"g");p.setAttribute("data-toggle",h),p.style.cursor="pointer";let b=document.createElementNS(r,"circle");b.setAttribute("cx",String(l.x+a/2)),b.setAttribute("cy",String(l.y+i+10)),b.setAttribute("r","10"),b.setAttribute("fill",n?"#fff":"#f1f5f9"),b.setAttribute("stroke","#cbd5e1"),b.setAttribute("stroke-width","1"),p.appendChild(b);let v=document.createElementNS(r,"text");v.setAttribute("x",String(l.x+a/2)),v.setAttribute("y",String(l.y+i+14)),v.setAttribute("text-anchor","middle"),v.setAttribute("font-size","11"),v.setAttribute("font-weight","700"),v.setAttribute("fill","#64748b"),v.setAttribute("font-family","system-ui, sans-serif"),v.textContent=l.collapsed?`+${l.childCount}`:"\u2212",p.appendChild(v),f.appendChild(p)}t.appendChild(f),l.children.length>0&&!l.collapsed&&this.#L(t,l.children,h)}}#Y(t){let e=this.#$(t,this.#h);if(!e)return;e.collapsed=!e.collapsed;let s=this.#T||t;this.#S(),requestAnimationFrame(()=>{this.#E(s);let r=this.#r?.querySelector('svg[role="tree"]');r&&r.focus({preventScroll:!0})})}#$(t,e){if(!e)return null;let s=t.split("-").map(Number),r=e,a=null;for(let i of s){if(!r||i>=r.length)return null;a=r[i],r=a.children}return a}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();s.title&&!this.getAttribute("title")&&this.setAttribute("title",s.title);let r=document.createElement("nav"),a=document.createElement("ul");this.#Q(a,s.pages||[]),r.appendChild(a),this.appendChild(r),this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[site-map-wc] Failed to load src="${t}":`,e)}}#Q(t,e){for(let s of e){let r=document.createElement("li");s.pageType&&r.setAttribute("data-page-type",s.pageType),s.template&&r.setAttribute("data-template",s.template),s.status&&r.setAttribute("data-status",s.status);let a=document.createElement("a");if(a.href=s.href||"#",a.textContent=s.label||"",r.appendChild(a),s.children&&s.children.length>0){let i=document.createElement("ul");this.#Q(i,s.children),r.appendChild(i)}t.appendChild(r)}}};x("site-map-wc",ht);var N=`
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
  fill: white;
}

.adr-section-icon.context      { background: #8b5cf6; }
.adr-section-icon.decision     { background: #22c55e; }
.adr-section-icon.consequences { background: #f59e0b; }

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
.state-msg--error { color: #dc2626; }
`;var kt={proposed:{label:"Proposed",color:"#3b82f6",bg:"rgba(59, 130, 246, 0.1)"},accepted:{label:"Accepted",color:"#22c55e",bg:"rgba(34, 197, 94, 0.1)"},deprecated:{label:"Deprecated",color:"#f59e0b",bg:"rgba(245, 158, 11, 0.1)"},superseded:{label:"Superseded",color:"#6b7280",bg:"rgba(107, 114, 128, 0.1)"}},q={calendar:'<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',context:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',decision:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',consequences:'<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',arrowRight:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'},ut=class extends HTMLElement{static get observedAttributes(){return["adr-id","status","supersedes","superseded-by","detail","compact","src"]}#t=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#e(){for(let t of[...this.children]){let e=t.getAttribute("slot");e&&this.#t.set(e,t.textContent.trim())}}connectedCallback(){this.#e(),this.adrId&&!this.id&&(this.id=this.adrId),this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#s(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(t,e,s){e!==s&&this.shadowRoot&&(t==="src"&&this.isConnected?this._loadSrc(s):this.#s())}get adrId(){return this.getAttribute("adr-id")||""}get status(){return this.getAttribute("status")||"proposed"}get adrTitle(){return this.querySelector('[slot="title"]')?.textContent?.trim()||this.#t.get("title")||""}get adrDate(){let t=this.querySelector('[slot="date"]');return t?.getAttribute("datetime")||t?.textContent?.trim()||this.#t.get("date")||""}get supersedes(){let t=this.getAttribute("supersedes")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get supersededBy(){let t=this.getAttribute("superseded-by")||"";return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}get _detailLevel(){return this.getAttribute("detail")?this.getAttribute("detail"):this.hasAttribute("compact")?"compact":"full"}get _minimalLabel(){return this.adrTitle||this.adrId||"ADR"}async _loadSrc(t){if(t){this.shadowRoot.innerHTML=`<style>${N}</style><div class="state-msg">Loading\u2026</div>`;try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();if(s.adrId!=null&&this.setAttribute("adr-id",String(s.adrId)),s.status!=null&&this.setAttribute("status",String(s.status)),s.detail!=null&&this.setAttribute("detail",String(s.detail)),s.supersedes&&this.setAttribute("supersedes",Array.isArray(s.supersedes)?s.supersedes.join(","):s.supersedes),s.supersededBy&&this.setAttribute("superseded-by",Array.isArray(s.supersededBy)?s.supersededBy.join(","):s.supersededBy),s.title&&!this.querySelector('[slot="title"]')){let r=document.createElement("h3");r.slot="title",r.textContent=s.title,this.appendChild(r)}if(s.date&&!this.querySelector('[slot="date"]')){let r=document.createElement("time");r.slot="date",r.setAttribute("datetime",s.date),r.textContent=new Date(s.date).toLocaleDateString(void 0,{year:"numeric",month:"long",day:"numeric"}),this.appendChild(r)}for(let r of["context","decision"])if(s[r]&&!this.querySelector(`[slot="${r}"]`)){let a=document.createElement("p");a.slot=r,a.textContent=s[r],this.appendChild(a)}if(s.consequences&&!this.querySelector('[slot="consequences"]')){let r=document.createElement("ul");r.slot="consequences";let a=Array.isArray(s.consequences)?s.consequences:[s.consequences];for(let i of a){let o=document.createElement("li");o.textContent=i,r.appendChild(o)}this.appendChild(r)}this.#e(),this.#s()}catch(e){this.shadowRoot.innerHTML=`<style>${N}</style><div class="state-msg state-msg--error">Could not load: ${m(e.message)}</div>`}}}#s(){let t=kt[this.status]||kt.proposed,e=this._detailLevel,s=this.adrId?`ADR: ${m(this.adrId)}`:"Architectural Decision Record",r=!!this.querySelector('[slot="date"]')||this.#t.has("date");if(e==="minimal"){this.shadowRoot.innerHTML=`<style>${N}</style>
        <article class="adr-card adr-card--minimal" role="article" aria-label="${s}"
          tabindex="0">
          <div class="adr-body">
            <div class="adr-meta">
              ${this.adrId?`<span class="adr-id">${m(this.adrId)}</span>`:""}
              <span class="adr-status" style="color:${t.color};background:${t.bg}">${m(t.label)}</span>
            </div>
            <div class="adr-title-wrap">
              <slot name="title"><span class="adr-title-fallback">${m(this._minimalLabel)}</span></slot>
            </div>
          </div>
        </article>`;return}if(this.shadowRoot.innerHTML=`<style>${N}</style>
      <article class="adr-card adr-card--${e}" role="article" aria-label="${s}">

        <header class="adr-header">
          <div class="adr-meta">
            ${this.adrId?`<span class="adr-id">${m(this.adrId)}</span>`:""}
            ${r?`<span class="adr-date-wrap">${y(q.calendar)} <slot name="date"></slot></span>`:""}
          </div>
          <div class="adr-badges">
            <span class="adr-status" style="color:${t.color};background:${t.bg}">${m(t.label)}</span>
          </div>
        </header>

        <div class="adr-body">
          <div class="adr-title-wrap">
            <slot name="title"><span class="adr-title-fallback">[Untitled ADR]</span></slot>
          </div>

          ${this.supersedes.length?`
            <div class="adr-links">
              <span class="adr-links-label">Supersedes</span>
              ${this.supersedes.map(a=>`<a class="adr-link" href="#${m(a)}">${y(q.arrowRight)} ${m(a)}</a>`).join("")}
            </div>`:""}

          ${this.supersededBy.length?`
            <div class="adr-links">
              <span class="adr-links-label">Superseded by</span>
              ${this.supersededBy.map(a=>`<a class="adr-link" href="#${m(a)}">${y(q.arrowRight)} ${m(a)}</a>`).join("")}
            </div>`:""}
        </div>

        <div class="adr-sections">
          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon context">${y(q.context)}</div>
              <span class="adr-section-title">Context</span>
            </div>
            <div class="adr-section-content">
              <slot name="context"><em class="slot-fallback">No context provided.</em></slot>
            </div>
          </div>

          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon decision">${y(q.decision)}</div>
              <span class="adr-section-title">Decision</span>
            </div>
            <div class="adr-section-content">
              <slot name="decision"><em class="slot-fallback">No decision recorded.</em></slot>
            </div>
          </div>

          <div class="adr-section">
            <div class="adr-section-header">
              <div class="adr-section-icon consequences">${y(q.consequences)}</div>
              <span class="adr-section-title">Consequences</span>
            </div>
            <div class="adr-section-content">
              <slot name="consequences"><em class="slot-fallback">No consequences documented.</em></slot>
            </div>
          </div>
        </div>

      </article>`,e==="compact")for(let a of this.shadowRoot.querySelectorAll(".adr-section")){let i=a.querySelector("slot");i&&i.assignedNodes().length===0&&a.setAttribute("data-empty","")}this.dispatchEvent(new CustomEvent("adr-wc:ready",{detail:{adrId:this.adrId,title:this.adrTitle,status:this.status},bubbles:!0,composed:!0}))}};x("adr-wc",ut);var pt=class extends A{static get observedAttributes(){return["src","title","compact"]}#t=null;#e=null;#s=null;#r=0;setup(){let t=this.querySelector(":scope > ol");if(!t)return!1;let e=this.#a(t);if(e.length===0)return!1;t.style.display="none",t.setAttribute("aria-hidden","true");let s=this.getAttribute("title");s&&(this.#e=document.createElement("h2"),this.#e.className="fd-title",this.#e.textContent=s,this.insertBefore(this.#e,t)),this.#t=document.createElement("div"),this.#t.className="fd-container",this.#t.setAttribute("role","img"),this.#t.setAttribute("aria-label",`Flow diagram${s?": "+s:""}`),this.#r=0,this.#i(e,this.#t);let r=document.createElement("div");r.className="fd-summary",r.textContent=`${this.#r} step${this.#r!==1?"s":""}`,this.#t.appendChild(r),this.insertBefore(this.#t,t),this.#s=document.createElement("div"),this.#s.className="fd-live",this.#s.setAttribute("role","status"),this.#s.setAttribute("aria-live","polite"),this.#s.setAttribute("aria-atomic","true"),this.appendChild(this.#s),this.listen(this.#t,"click",a=>{let i=a.target.closest(".fd-node-shape");if(!i)return;let n=i.closest(".fd-node")?.dataset.type||"action",c=i.textContent?.trim()||"";this.#d(`Selected: ${c}`),this.dispatchEvent(new CustomEvent("flow-diagram:select",{bubbles:!0,detail:{type:n,text:c}}))}),this.dispatchEvent(new CustomEvent("flow-diagram:ready",{bubbles:!0,detail:{nodeCount:this.#r}}))}teardown(){this.#e&&(this.#e.remove(),this.#e=null),this.#t&&(this.#t.remove(),this.#t=null),this.#s&&(this.#s.remove(),this.#s=null);let t=this.querySelector("ol");t&&(t.style.display="",t.removeAttribute("aria-hidden")),this.#r=0}attributeChangedCallback(t,e,s){e===s||!this.isConnected||(t==="src"?this._loadSrc(s):this.hasAttribute("data-upgraded")&&(this.teardown(),this.removeAttribute("data-upgraded"),this.setup()))}#a(t){let e=[];for(let s of t.querySelectorAll(":scope > li")){let r=this.#o(s);r&&e.push(r)}return e}#o(t){let e=t.dataset.type||"action",s=t.dataset.annotation||"",r=[],a=t.querySelectorAll(":scope > ol > li[data-branch]");if(a.length>0)for(let o of a){let n=o.dataset.branch||"",c=o.querySelector(":scope > ol"),l=c?this.#a(c):[];r.push({label:n,steps:l})}let i="";for(let o of t.childNodes)(o.nodeType===Node.TEXT_NODE||o.nodeType===Node.ELEMENT_NODE&&o.tagName!=="OL")&&(i+=o.textContent);return i=i.trim(),{type:e,text:i,annotation:s,branches:r}}#i(t,e){for(let s=0;s<t.length;s++){let r=t[s];s>0&&e.appendChild(this.#n());let a=this.#l(r);if(e.appendChild(a),r.branches.length>0){let i=document.createElement("div");i.className="fd-branches",i.setAttribute("data-branch-count",String(r.branches.length));let o=document.createElement("div");o.className="fd-split-line",o.setAttribute("aria-hidden","true"),i.appendChild(o);let n=document.createElement("div");n.className="fd-branch-columns";let c=(50/r.branches.length).toFixed(2);n.style.setProperty("--fd-inset",`${c}%`);for(let l of r.branches){let h=document.createElement("div");h.className="fd-branch",h.appendChild(this.#n());let u=document.createElement("span");u.className="fd-branch-label",u.textContent=l.label,u.setAttribute("data-branch",l.label.toLowerCase()),h.appendChild(u),this.#i(l.steps,h),n.appendChild(h)}i.appendChild(n),e.appendChild(i)}}}#l(t){this.#r++;let e=document.createElement("div");e.className="fd-node",e.dataset.type=t.type;let s=document.createElement("div");if(s.className="fd-node-shape",s.setAttribute("tabindex","0"),s.setAttribute("role","img"),s.setAttribute("aria-label",`${t.type}: ${t.text}`),s.textContent=t.text,e.appendChild(s),t.annotation){let r=document.createElement("div");r.className="fd-annotation",r.textContent=t.annotation,e.appendChild(r)}return e}#n(t){let e=document.createElement("div");e.className="fd-connector",e.setAttribute("aria-hidden","true");let s=document.createElement("div");if(s.className="fd-connector-line",e.appendChild(s),t){let a=document.createElement("span");a.className="fd-connector-label",a.textContent=t,e.appendChild(a)}let r=document.createElement("div");return r.className="fd-connector-arrow",e.appendChild(r),e}async _loadSrc(t){if(t)try{let e=await fetch(t);if(!e.ok)throw new Error(`HTTP ${e.status}`);let s=await e.json();for(;this.firstChild;)this.firstChild.remove();s.title&&this.setAttribute("title",s.title);let r=document.createElement("ol");this.#c(s.steps||[],r),this.appendChild(r),this.teardown(),this.removeAttribute("data-upgraded"),this.setup()}catch(e){console.warn(`[flow-diagram] Failed to load src="${t}":`,e)}}#c(t,e){for(let s of t){let r=document.createElement("li");if(s.type&&(r.dataset.type=s.type),s.annotation&&(r.dataset.annotation=s.annotation),r.textContent=s.text||"",s.branches&&s.branches.length>0){let a=document.createElement("ol");for(let i of s.branches){let o=document.createElement("li");o.dataset.branch=i.label||"";let n=document.createElement("ol");this.#c(i.steps||[],n),o.appendChild(n),a.appendChild(o)}r.appendChild(a)}e.appendChild(r)}}#d(t){this.#s&&(this.#s.textContent="",requestAnimationFrame(()=>{this.#s&&(this.#s.textContent=t)}))}};x("flow-diagram",pt);
//# sourceMappingURL=ux-planning.full.js.map
