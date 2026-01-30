const Fe="vb-theme",Ne={mode:"auto",brand:"default"},ve={init(){const s=this.load();return this.apply(s),this._watchSystemPreference(),s},load(){try{const s=localStorage.getItem(Fe);return s?{...Ne,...JSON.parse(s)}:{...Ne}}catch{return{...Ne}}},save(s){const t={...this.load(),...s};try{localStorage.setItem(Fe,JSON.stringify(t))}catch{}return t},apply({mode:s="auto",brand:e="default"}={}){const t=document.documentElement;s==="auto"?delete t.dataset.mode:t.dataset.mode=s,e==="default"?delete t.dataset.theme:t.dataset.theme=e,window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:s,brand:e,effectiveMode:this.getEffectiveMode()}}))},setMode(s){const e=this.save({mode:s});this.apply(e)},setBrand(s){const e=this.save({brand:s});this.apply(e)},getEffectiveMode(){const{mode:s}=this.load();return s!=="auto"?s:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"},getState(){const{mode:s,brand:e}=this.load();return{mode:s,brand:e,effectiveMode:this.getEffectiveMode()}},toggleMode(){const e=this.getEffectiveMode()==="dark"?"light":"dark";this.setMode(e)},reset(){try{localStorage.removeItem(Fe)}catch{}this.apply(Ne)},_watchSystemPreference(){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{const{mode:e,brand:t}=this.load();e==="auto"&&window.dispatchEvent(new CustomEvent("theme-change",{detail:{mode:e,brand:t,effectiveMode:this.getEffectiveMode()}}))})}},bi=["layout-text","layout-reel"];bi.forEach(s=>{customElements.get(s)||customElements.define(s,class extends HTMLElement{})});const pi=200,gi=100;function ut(s=document){s.querySelectorAll("[aria-describedby]").forEach(e=>{const t=e.getAttribute("aria-describedby"),i=document.getElementById(t);if(!i?.hasAttribute("popover")||!i.matches('[role="tooltip"]')||e.closest("tooltip-wc")||e.hasAttribute("data-tooltip-init"))return;e.setAttribute("data-tooltip-init","");let n=null,o=null;const a=()=>{clearTimeout(o),n=setTimeout(()=>{i.showPopover(),We(e,i)},pi)},c=()=>{clearTimeout(n),o=setTimeout(()=>{i.hidePopover()},gi)},h=()=>{clearTimeout(o),i.showPopover(),We(e,i)},g=()=>{clearTimeout(n),i.hidePopover()};e.addEventListener("mouseenter",a),e.addEventListener("mouseleave",c),e.addEventListener("focus",h),e.addEventListener("blur",g),i.addEventListener("mouseenter",()=>clearTimeout(o)),i.addEventListener("mouseleave",c)}),s.querySelectorAll("[popovertarget]").forEach(e=>{const t=e.getAttribute("popovertarget"),i=document.getElementById(t);!i?.hasAttribute("popover")||!i.matches('[role="tooltip"]')||i.hasAttribute("data-tooltip-click-init")||(i.setAttribute("data-tooltip-click-init",""),i.addEventListener("toggle",n=>{n.newState==="open"&&We(e,i)}))})}function We(s,e){const t=s.getBoundingClientRect(),i=e.dataset.position||"top",n=8,o=e.getBoundingClientRect();let a,c;switch(i){case"bottom":a=t.bottom+n,c=t.left+(t.width-o.width)/2;break;case"left":a=t.top+(t.height-o.height)/2,c=t.left-o.width-n;break;case"right":a=t.top+(t.height-o.height)/2,c=t.right+n;break;case"top":default:a=t.top-o.height-n,c=t.left+(t.width-o.width)/2;break}const h=8;c=Math.max(h,Math.min(c,window.innerWidth-o.width-h)),a=Math.max(h,Math.min(a,window.innerHeight-o.height-h)),e.style.top=`${a}px`,e.style.left=`${c}px`}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>ut()):ut();const Oe={"semantic-card":{validChildren:["header","section","footer"],validSlots:["header","content","footer"],rules:{maxHeader:1,maxFooter:1,order:["header","section","footer"]}}};function mi(){return document.documentElement.hasAttribute("data-debug")||localStorage.getItem("vanillaBreeze.debug")==="true"}function fi(s,e,t){const i=[],n=Array.from(s.children),o={header:0,section:0,footer:0},a=[];for(const g of n){const A=g.tagName.toLowerCase(),w=g.getAttribute("slot");if(t.validChildren.includes(A)){o[A]++,a.push(A);continue}if(w&&t.validSlots.includes(w)){const C=w==="content"?"section":w;a.push(C);continue}}t.rules.maxHeader&&o.header>t.rules.maxHeader&&i.push({type:"duplicate",message:`Multiple <header> elements found (max: ${t.rules.maxHeader})`,element:s}),t.rules.maxFooter&&o.footer>t.rules.maxFooter&&i.push({type:"duplicate",message:`Multiple <footer> elements found (max: ${t.rules.maxFooter})`,element:s});const c=t.rules.order;let h=-1;for(const g of a){const A=c.indexOf(g);if(A!==-1&&A<h){i.push({type:"order",message:`Invalid child order: <${g}> should appear before elements that follow it in the semantic order (header > section > footer)`,element:s});break}A!==-1&&(h=A)}return i}function vi(s){for(const e of s)console.warn(`[Vanilla Breeze] Content model warning in <${e.element.tagName.toLowerCase()}>:`,e.message,e.element),e.element.setAttribute("data-debug-invalid",""),e.element.setAttribute("data-debug-message",e.message)}function wi(s){s.removeAttribute("data-debug-invalid"),s.removeAttribute("data-debug-message")}function Ze(){for(const[s,e]of Object.entries(Oe)){const t=document.querySelectorAll(s);for(const i of t){wi(i);const n=fi(i,s,e);n.length>0&&vi(n)}}}function yi(){if(!mi())return;console.info("[Vanilla Breeze] Debug mode enabled - content model validation active"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ze):Ze(),new MutationObserver(e=>{let t=!1;for(const i of e)if(i.type==="childList"){const n=i.target;if(n.tagName&&Oe[n.tagName.toLowerCase()]){t=!0;break}for(const o of i.addedNodes)if(o.nodeType===Node.ELEMENT_NODE&&(Oe[o.tagName.toLowerCase()]||o.querySelector(Object.keys(Oe).join(",")))){t=!0;break}}t&&Ze()}).observe(document.body,{childList:!0,subtree:!0})}yi();function bt(s){document.querySelectorAll("browser-window").forEach(e=>{e.setAttribute("mode",s)}),document.querySelectorAll("code-block").forEach(e=>{e.setAttribute("theme",s)})}function on(){const{effectiveMode:s}=ve.getState();bt(s),window.addEventListener("theme-change",t=>{bt(t.detail.effectiveMode)}),new MutationObserver(t=>{const{effectiveMode:i}=ve.getState();for(const n of t)for(const o of n.addedNodes)o.nodeType===Node.ELEMENT_NODE&&(o.tagName==="BROWSER-WINDOW"?o.setAttribute("mode",i):o.tagName==="CODE-BLOCK"&&o.setAttribute("theme",i),o.querySelectorAll?.("browser-window").forEach(a=>{a.setAttribute("mode",i)}),o.querySelectorAll?.("code-block").forEach(a=>{a.setAttribute("theme",i)}))}).observe(document.body,{childList:!0,subtree:!0})}class xi extends HTMLElement{#t;#e;connectedCallback(){this.#t=[...this.querySelectorAll(":scope > details")],this.#e=this.#t.map(e=>e.querySelector("summary")),this.#t.length!==0&&(this.#n(),this.#o())}#n(){this.setAttribute("role","tablist"),this.#t.forEach((e,t)=>{const i=this.#e[t],n=e.querySelector(":scope > :not(summary)");if(!i||!n)return;const o=i.id||`tab-${crypto.randomUUID().slice(0,8)}`,a=n.id||`panel-${crypto.randomUUID().slice(0,8)}`;i.id=o,i.setAttribute("role","tab"),i.setAttribute("aria-controls",a),i.setAttribute("aria-selected",e.open?"true":"false"),i.setAttribute("tabindex",e.open?"0":"-1"),n.id=a,n.setAttribute("role","tabpanel"),n.setAttribute("aria-labelledby",o),i.addEventListener("keydown",c=>this.#s(c,t)),e.addEventListener("toggle",()=>this.#i(t))})}#o(){!this.#t.some(t=>t.open)&&this.#t.length>0&&(this.#t[0].open=!0,this.#r())}#i(e){this.#r(),this.dispatchEvent(new CustomEvent("tab-change",{detail:{index:e},bubbles:!0}))}#r(){this.#t.forEach((e,t)=>{const i=this.#e[t],n=e.open;i.setAttribute("aria-selected",String(n)),i.setAttribute("tabindex",n?"0":"-1")})}#s(e,t){const{key:i}=e;let n;switch(i){case"ArrowRight":n=(t+1)%this.#t.length;break;case"ArrowLeft":n=(t-1+this.#t.length)%this.#t.length;break;case"Home":n=0;break;case"End":n=this.#t.length-1;break;default:return}e.preventDefault(),this.#t[n].open=!0,this.#e[n].focus()}}customElements.define("tabs-wc",xi);class Ge extends HTMLElement{static#t=0;#e;#n=[];#o="Back to content";connectedCallback(){this.#e=++Ge.#t,this.hasAttribute("data-back-label")&&(this.#o=this.getAttribute("data-back-label")),this.#i(),this.#r()}#i(){const e=[...document.querySelectorAll("foot-note:not([data-enhanced])")];this.#n=e.filter(t=>this.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_PRECEDING)}#r(){if(this.#n.length===0)return;const e=document.createElement("ol");this.#n.forEach((t,i)=>{const n=i+1,o=`fnref-${this.#e}-${n}`,a=`fn-${this.#e}-${n}`;this.#s(t,n,o,a);const c=this.#a(t,n,o,a);e.appendChild(c)}),this.appendChild(e)}#s(e,t,i,n){e.setAttribute("data-enhanced",""),e.id=i;const o=e.innerHTML,a=document.createElement("span");a.innerHTML=o;const c=document.createElement("a");c.href=`#${n}`,c.setAttribute("aria-describedby",n),c.textContent=`[${t}]`,e.innerHTML="",e.appendChild(a),e.appendChild(c)}#a(e,t,i,n){const o=document.createElement("li");o.id=n;const a=e.querySelector("span"),c=a?a.innerHTML:"",h=document.createElement("a");return h.href=`#${i}`,h.setAttribute("data-backref",""),h.setAttribute("aria-label",this.#o),h.textContent="↩",o.innerHTML=c+" ",o.appendChild(h),o}}class Ei extends HTMLElement{}customElements.define("footnotes-wc",Ge);customElements.define("foot-note",Ei);class ki extends HTMLElement{#t;#e;connectedCallback(){this.#t=[...this.querySelectorAll(":scope > details")],this.#e=this.#t.map(e=>e.querySelector("summary")),this.#t.length!==0&&this.#n()}#n(){this.#t.forEach((e,t)=>{const i=this.#e[t],n=e.querySelector(":scope > :not(summary)");if(!i||!n)return;const o=i.id||`accordion-heading-${crypto.randomUUID().slice(0,8)}`,a=n.id||`accordion-panel-${crypto.randomUUID().slice(0,8)}`;i.id=o,n.id=a,i.setAttribute("aria-expanded",e.open?"true":"false"),i.setAttribute("aria-controls",a),n.setAttribute("aria-labelledby",o),n.setAttribute("role","region"),i.addEventListener("keydown",c=>this.#i(c,t)),e.addEventListener("toggle",()=>this.#o(e,t))})}#o(e,t){this.#e[t].setAttribute("aria-expanded",e.open?"true":"false"),this.hasAttribute("data-single")&&e.open&&this.#t.forEach((n,o)=>{o!==t&&n.open&&(n.open=!1,this.#e[o].setAttribute("aria-expanded","false"))}),this.dispatchEvent(new CustomEvent("accordion-toggle",{detail:{index:t,open:e.open},bubbles:!0}))}#i(e,t){const{key:i}=e;let n;switch(i){case"ArrowDown":n=(t+1)%this.#t.length;break;case"ArrowUp":n=(t-1+this.#t.length)%this.#t.length;break;case"Home":n=0;break;case"End":n=this.#t.length-1;break;default:return}e.preventDefault(),this.#e[n].focus()}open(e){e>=0&&e<this.#t.length&&(this.#t[e].open=!0)}close(e){e>=0&&e<this.#t.length&&(this.#t[e].open=!1)}toggle(e){e>=0&&e<this.#t.length&&(this.#t[e].open=!this.#t[e].open)}openAll(){this.hasAttribute("data-single")||this.#t.forEach(e=>{e.open=!0})}closeAll(){this.#t.forEach(e=>{e.open=!1})}}customElements.define("accordion-wc",ki);class Ai extends HTMLElement{#t=[];#e=[];static get observedAttributes(){return["data-position","data-max"]}connectedCallback(){this.setAttribute("role","region"),this.setAttribute("aria-label","Notifications"),this.setAttribute("aria-live","polite")}show(e){const{message:t,variant:i="info",duration:n=this.#r(),dismissible:o=!0,action:a,onAction:c}=e,h=this.#n({message:t,variant:i,dismissible:o,action:a,onAction:c}),g=this.#s();return this.#e.length>=g?this.#t.push({toast:h,duration:n}):this.#o(h,n),h}#n({message:e,variant:t,dismissible:i,action:n,onAction:o}){const a=document.createElement("div");a.className="toast",a.setAttribute("role","alert"),a.setAttribute("data-variant",t);const c={info:"&#9432;",success:"&#10003;",warning:"&#9888;",error:"&#10007;"};return a.innerHTML=`
      <span class="icon" aria-hidden="true">${c[t]||c.info}</span>
      <span class="message">${this.#a(e)}</span>
      ${n?`<button type="button" class="action">${this.#a(n)}</button>`:""}
      ${i?'<button type="button" class="close" aria-label="Dismiss">&#x2715;</button>':""}
    `,i&&a.querySelector(".close").addEventListener("click",()=>{this.#i(a)}),n&&o&&a.querySelector(".action").addEventListener("click",()=>{o(),this.#i(a)}),a}#o(e,t){this.appendChild(e),this.#e.push(e),requestAnimationFrame(()=>{e.setAttribute("data-state","visible")}),t>0&&(e._dismissTimer=setTimeout(()=>{this.#i(e)},t)),this.dispatchEvent(new CustomEvent("toast-show",{bubbles:!0,detail:{toast:e}}))}#i(e){if(!this.contains(e))return;e._dismissTimer&&clearTimeout(e._dismissTimer),e.setAttribute("data-state","hiding");const t=()=>{e.removeEventListener("animationend",t),e.remove();const i=this.#e.indexOf(e);if(i>-1&&this.#e.splice(i,1),this.#t.length>0){const{toast:n,duration:o}=this.#t.shift();this.#o(n,o)}this.dispatchEvent(new CustomEvent("toast-hide",{bubbles:!0,detail:{toast:e}}))};e.addEventListener("animationend",t),setTimeout(()=>{this.contains(e)&&t()},300)}dismissAll(){this.#t=[],[...this.#e].forEach(e=>this.#i(e))}#r(){const e=this.getAttribute("data-duration");return e!==null?parseInt(e,10):5e3}#s(){const e=this.getAttribute("data-max");return e!==null?parseInt(e,10):5}#a(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}}customElements.define("toast-wc",Ai);const pt=CSS.supports("anchor-name","--test");class Si extends HTMLElement{#t;#e;#n;#o;#i=!pt;connectedCallback(){this.#r()}disconnectedCallback(){this.#s()}#r(){if(this.#t=this.querySelector(":scope > :not(template)"),!this.#t)return;const e=this.querySelector(":scope > template[data-tooltip]"),t=this.dataset.content;if(!e&&!t)return;this.#e=document.createElement("div"),this.#e.className="tooltip",this.#e.setAttribute("role","tooltip"),this.#e.setAttribute("popover","hint"),e?this.#e.innerHTML=e.innerHTML:this.#e.textContent=t,this.#e.id=`tooltip-${crypto.randomUUID().slice(0,8)}`;const i=this.dataset.position||"top";this.#e.dataset.position=i;const n=document.createElement("span");if(n.className="tooltip-arrow",n.setAttribute("aria-hidden","true"),this.#e.appendChild(n),this.appendChild(this.#e),pt){const o=`--tooltip-anchor-${this.#e.id}`;this.#t.style.anchorName=o,this.#e.style.positionAnchor=o,this.#e.setAttribute("data-anchor","")}this.#t.setAttribute("aria-describedby",this.#e.id),this.#t.addEventListener("mouseenter",this.#a),this.#t.addEventListener("mouseleave",this.#l),this.#t.addEventListener("focus",this.#c),this.#t.addEventListener("blur",this.#d),this.#e.addEventListener("mouseenter",this.#p),this.#e.addEventListener("mouseleave",this.#l)}#s(){this.#t&&(this.#t.removeEventListener("mouseenter",this.#a),this.#t.removeEventListener("mouseleave",this.#l),this.#t.removeEventListener("focus",this.#c),this.#t.removeEventListener("blur",this.#d)),this.#e&&(this.#e.removeEventListener("mouseenter",this.#p),this.#e.removeEventListener("mouseleave",this.#l)),clearTimeout(this.#n),clearTimeout(this.#o)}#a=()=>{clearTimeout(this.#o);const e=parseInt(this.dataset.delay||"200",10);this.#n=setTimeout(()=>this.show(),e)};#l=()=>{clearTimeout(this.#n),this.#o=setTimeout(()=>this.hide(),100)};#c=()=>{clearTimeout(this.#o),this.show()};#d=()=>{clearTimeout(this.#n),this.hide()};#p=()=>{clearTimeout(this.#o)};show(){!this.#e||this.isVisible||(this.#e.showPopover(),this.#i&&this.#u(),this.dispatchEvent(new CustomEvent("tooltip-show",{bubbles:!0})))}hide(){!this.#e||!this.isVisible||(this.#e.hidePopover(),this.dispatchEvent(new CustomEvent("tooltip-hide",{bubbles:!0})))}#u(){if(!this.#t||!this.#e)return;const e=this.#t.getBoundingClientRect(),t=this.#e.getBoundingClientRect(),i=this.dataset.position||"top",n=8;let o,a;switch(i){case"bottom":o=e.bottom+n,a=e.left+(e.width-t.width)/2;break;case"left":o=e.top+(e.height-t.height)/2,a=e.left-t.width-n;break;case"right":o=e.top+(e.height-t.height)/2,a=e.right+n;break;case"top":default:o=e.top-t.height-n,a=e.left+(e.width-t.width)/2;break}const c=8;a=Math.max(c,Math.min(a,window.innerWidth-t.width-c)),o=Math.max(c,Math.min(o,window.innerHeight-t.height-c)),this.#e.style.top=`${o}px`,this.#e.style.left=`${a}px`}get isVisible(){return this.#e?.matches(":popover-open")??!1}}customElements.define("tooltip-wc",Si);class Ci extends HTMLElement{#t;#e;#n=[];#o=-1;#i=!1;#r=!1;#s=null;connectedCallback(){this.#a()}disconnectedCallback(){this.#l()}#a(){this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t&&(this.#e=this.querySelector(':scope > menu, :scope > ul[role="menu"]'),this.#e&&(this.#r=this.hasAttribute("data-hover"),this.#t.setAttribute("aria-haspopup","menu"),this.#t.setAttribute("aria-expanded","false"),this.#e.id||(this.#e.id=`dropdown-menu-${crypto.randomUUID().slice(0,8)}`),this.#t.setAttribute("aria-controls",this.#e.id),this.#e.setAttribute("role","menu"),this.#c(),this.#r?(this.addEventListener("mouseenter",this.#p),this.addEventListener("mouseleave",this.#u),this.#t.addEventListener("focus",this.#h),this.#t.addEventListener("blur",this.#g)):this.#t.addEventListener("click",this.#d),this.#t.addEventListener("keydown",this.#m),this.#e.addEventListener("keydown",this.#f),document.addEventListener("click",this.#y),document.addEventListener("keydown",this.#v)))}#l(){this.#s&&clearTimeout(this.#s),this.#t&&(this.#t.removeEventListener("click",this.#d),this.#t.removeEventListener("keydown",this.#m),this.#t.removeEventListener("focus",this.#h),this.#t.removeEventListener("blur",this.#g)),this.#e&&this.#e.removeEventListener("keydown",this.#f),this.removeEventListener("mouseenter",this.#p),this.removeEventListener("mouseleave",this.#u),document.removeEventListener("click",this.#y),document.removeEventListener("keydown",this.#v)}#c(){this.#n=Array.from(this.#e.querySelectorAll('button, a, [role="menuitem"]')).filter(e=>!e.disabled&&!e.closest('[role="separator"]')),this.#n.forEach((e,t)=>{e.setAttribute("role","menuitem"),e.setAttribute("tabindex","-1"),e.addEventListener("click",this.#w)}),this.#e.querySelectorAll('li:empty, [role="separator"], hr').forEach(e=>{e.setAttribute("role","separator")})}#d=e=>{e.stopPropagation(),this.toggle()};#p=()=>{this.#s&&(clearTimeout(this.#s),this.#s=null),this.open()};#u=()=>{this.#s=setTimeout(()=>{this.close()},100)};#h=()=>{this.#s&&(clearTimeout(this.#s),this.#s=null),this.open()};#g=e=>{this.#e?.contains(e.relatedTarget)||(this.#s=setTimeout(()=>{this.contains(document.activeElement)||this.close()},100))};#m=e=>{switch(e.key){case"ArrowDown":case"Down":e.preventDefault(),this.open(),this.#b(0);break;case"ArrowUp":case"Up":e.preventDefault(),this.open(),this.#b(this.#n.length-1);break}};#f=e=>{switch(e.key){case"ArrowDown":case"Down":e.preventDefault(),this.#b(this.#o+1);break;case"ArrowUp":case"Up":e.preventDefault(),this.#b(this.#o-1);break;case"Home":e.preventDefault(),this.#b(0);break;case"End":e.preventDefault(),this.#b(this.#n.length-1);break;case"Tab":this.close();break;case"Enter":case" ":e.preventDefault(),this.#o>=0&&this.#n[this.#o].click();break}};#y=e=>{this.#i&&!this.contains(e.target)&&this.close()};#v=e=>{e.key==="Escape"&&this.#i&&(e.preventDefault(),this.close(),this.#t?.focus())};#w=e=>{e.defaultPrevented||(this.close(),this.#t?.focus())};#b(e){this.#n.length!==0&&(e<0&&(e=this.#n.length-1),e>=this.#n.length&&(e=0),this.#o=e,this.#n[e].focus())}open(){this.#i||!this.#e||(this.#i=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),this.#o=-1,this.#x(),this.dispatchEvent(new CustomEvent("dropdown-open",{bubbles:!0})))}close(){!this.#i||!this.#e||(this.#i=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"),this.#o=-1,this.dispatchEvent(new CustomEvent("dropdown-close",{bubbles:!0})))}toggle(){this.#i?this.close():this.open()}#x(){if(!this.#t||!this.#e)return;const e=this.getAttribute("data-position")||"bottom-start",t=this.hasAttribute("data-no-flip"),i=this.#t.getBoundingClientRect(),n=this.#e.getBoundingClientRect(),o=window.innerHeight,a=window.innerWidth;let c,h;const g=4;e.startsWith("top")?(c=-n.height-g,!t&&i.top+c<0&&(c=i.height+g)):(c=i.height+g,!t&&i.bottom+n.height+g>o&&(c=-n.height-g)),e.endsWith("end")?(h=i.width-n.width,i.left+h<0&&(h=0)):(h=0,i.left+n.width>a&&(h=i.width-n.width)),this.#e.style.setProperty("--dropdown-top",`${c}px`),this.#e.style.setProperty("--dropdown-left",`${h}px`)}get isOpen(){return this.#i}}customElements.define("dropdown-wc",Ci);const Mi=`
:host {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: 1.5em;
  block-size: 1.5em;
  vertical-align: middle;
  line-height: 1;
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
`,Ve=new Map;class Li extends HTMLElement{static get observedAttributes(){return["name","set","size","label"]}constructor(){super(),this.attachShadow({mode:"open"})}get name(){return this.getAttribute("name")||""}get set(){return this.getAttribute("set")||"lucide"}get size(){return this.getAttribute("size")||"md"}get label(){return this.getAttribute("label")}get basePath(){return this.getAttribute("base-path")||document.documentElement.dataset.iconPath||"/src/icons"}get iconPath(){return`${this.basePath}/${this.set}/${this.name}.svg`}render(){this.shadowRoot.innerHTML=`
            <style>${Mi}</style>
            <slot></slot>
        `}async loadIcon(){if(!this.name){this.setError("No icon name specified");return}const e=`${this.set}/${this.name}`;if(Ve.has(e)){this.displayIcon(Ve.get(e));return}try{const t=await fetch(this.iconPath);if(!t.ok)throw new Error(`Icon not found: ${this.name}`);const i=await t.text();if(!i.includes("<svg"))throw new Error(`Invalid SVG: ${this.name}`);Ve.set(e,i),this.displayIcon(i)}catch(t){this.setError(t.message)}}displayIcon(e){const n=new DOMParser().parseFromString(e,"image/svg+xml").querySelector("svg");if(!n){this.setError("Invalid SVG content");return}n.removeAttribute("width"),n.removeAttribute("height"),this.label?(n.setAttribute("role","img"),n.setAttribute("aria-label",this.label)):n.setAttribute("aria-hidden","true"),this.removeAttribute("data-error");const o=this.shadowRoot.querySelector("slot");o&&o.replaceWith(n)}setError(e){this.setAttribute("data-error","true"),console.warn(`icon-wc: ${e}`);const t=this.shadowRoot.querySelector("slot");t&&(t.textContent="")}connectedCallback(){this.render(),this.loadIcon()}attributeChangedCallback(e,t,i){if(t!==i&&this.isConnected){if(e==="name"||e==="set")this.render(),this.loadIcon();else if(e==="label"){const n=this.shadowRoot.querySelector("svg");n&&(i?(n.setAttribute("role","img"),n.setAttribute("aria-label",i)):(n.removeAttribute("role"),n.setAttribute("aria-hidden","true")))}}}}customElements.define("icon-wc",Li);class ue extends HTMLElement{static#t=[{id:"auto",name:"Auto",icon:"monitor"},{id:"light",name:"Light",icon:"sun"},{id:"dark",name:"Dark",icon:"moon"}];static#e=[{id:"default",name:"Default",hue:260},{id:"ocean",name:"Ocean",hue:200},{id:"forest",name:"Forest",hue:145},{id:"sunset",name:"Sunset",hue:25}];static#n=[{id:"modern",name:"Modern",hue:270,shape:"rounded",character:"Vibrant & elevated"},{id:"minimal",name:"Minimal",hue:240,shape:"sharp",character:"Clean & flat"},{id:"classic",name:"Classic",hue:220,shape:"subtle",character:"Serif & elegant"}];static#o=[...ue.#e,...ue.#n];static#i=200;#r;#s;#a=!1;#l=!1;#c=null;connectedCallback(){this.#l=this.getAttribute("data-variant")==="inline",this.#d(),this.#u(),this.#x(),window.addEventListener("theme-change",this.#b)}disconnectedCallback(){window.removeEventListener("theme-change",this.#b),document.removeEventListener("click",this.#g),document.removeEventListener("keydown",this.#m),this.#w()}#d(){this.#l||(this.#r=this.querySelector(":scope > [data-trigger]"),this.#r||(this.#r=this.querySelector(":scope > button")),this.#r||(this.#r=document.createElement("button"),this.#r.setAttribute("data-trigger",""),this.#r.innerHTML=`
          <x-icon name="palette" label="Theme settings"></x-icon>
        `,this.prepend(this.#r)),this.#r.setAttribute("aria-haspopup","dialog"),this.#r.setAttribute("aria-expanded","false")),this.#s=document.createElement("div"),this.#s.className="panel",this.#s.setAttribute("role","dialog"),this.#s.setAttribute("aria-label","Theme settings"),this.#l||(this.#s.id=`theme-panel-${crypto.randomUUID().slice(0,8)}`,this.#r.setAttribute("aria-controls",this.#s.id)),this.#s.innerHTML=this.#p(),this.appendChild(this.#s)}#p(){const{mode:e,brand:t}=ve.getState();return`
      <fieldset class="section">
        <legend>Color Mode</legend>
        <div class="options" role="radiogroup" aria-label="Color mode">
          ${ue.#t.map(i=>`
            <label class="option">
              <input
                type="radio"
                name="theme-mode"
                value="${i.id}"
                ${e===i.id?"checked":""}
              />
              <span class="option-content">
                <x-icon name="${i.icon}"></x-icon>
                <span>${i.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Color Themes</legend>
        <div class="options options--themes" role="radiogroup" aria-label="Color theme">
          ${ue.#e.map(i=>`
            <label class="option option--theme">
              <input
                type="radio"
                name="theme-brand"
                value="${i.id}"
                ${t===i.id?"checked":""}
              />
              <span class="option-content">
                <span class="swatch" style="--swatch-hue: ${i.hue}"></span>
                <span>${i.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>

      <fieldset class="section">
        <legend>Personality Themes</legend>
        <div class="options options--themes" role="radiogroup" aria-label="Personality theme">
          ${ue.#n.map(i=>`
            <label class="option option--theme">
              <input
                type="radio"
                name="theme-brand"
                value="${i.id}"
                ${t===i.id?"checked":""}
              />
              <span class="option-content">
                <span class="swatch-combo">
                  <span class="swatch" style="--swatch-hue: ${i.hue}"></span>
                  <span class="shape-indicator" data-shape="${i.shape}"></span>
                </span>
                <span>${i.name}</span>
              </span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `}#u(){this.#s.querySelectorAll('input[name="theme-mode"]').forEach(e=>{e.addEventListener("change",this.#f)}),this.#s.querySelectorAll('input[name="theme-brand"]').forEach(e=>{e.addEventListener("change",this.#y)}),this.#l||(this.#r.addEventListener("click",this.#h),document.addEventListener("click",this.#g),document.addEventListener("keydown",this.#m))}#h=e=>{e.stopPropagation(),this.toggle()};#g=e=>{this.#a&&!this.contains(e.target)&&this.close()};#m=e=>{e.key==="Escape"&&this.#a&&(e.preventDefault(),this.close(),this.#r?.focus())};#f=e=>{ve.setMode(e.target.value),this.#v()};#y=e=>{ve.setBrand(e.target.value),this.#v()};#v(){this.#l||(this.#w(),this.#c=setTimeout(()=>{this.close(),this.#r?.focus()},ue.#i))}#w(){this.#c&&(clearTimeout(this.#c),this.#c=null)}#b=()=>{this.#x()};#x(){const{mode:e,brand:t}=ve.getState(),i=this.#s.querySelector(`input[name="theme-mode"][value="${e}"]`);i&&(i.checked=!0);const n=this.#s.querySelector(`input[name="theme-brand"][value="${t}"]`);n&&(n.checked=!0)}open(){this.#l||this.#a||(this.#a=!0,this.setAttribute("data-open",""),this.#r?.setAttribute("aria-expanded","true"),requestAnimationFrame(()=>{this.#E(),this.#s.querySelector('input[type="radio"]:checked')?.focus()}),this.dispatchEvent(new CustomEvent("theme-wc-open",{bubbles:!0})))}#E(){if(!this.#r||!this.#s)return;const e=this.#r.getBoundingClientRect(),t=this.#s.getBoundingClientRect(),i=window.visualViewport||{width:window.innerWidth,height:window.innerHeight},n=i.height,o=i.width,a=8,c=16,h=n-e.bottom-c,g=e.top-c;let A=e.height+a;h<t.height&&g>h?(A=-t.height-a,this.#s.dataset.position="top"):delete this.#s.dataset.position;let w=0;const C=e.left+t.width+c,L=e.left+w;C>o&&(w=o-C),L+w<c&&(w=c-e.left),this.#s.style.setProperty("--panel-top",`${A}px`),this.#s.style.setProperty("--panel-left",`${w}px`)}close(){this.#l||!this.#a||(this.#w(),this.#a=!1,this.removeAttribute("data-open"),this.#r?.setAttribute("aria-expanded","false"),this.dispatchEvent(new CustomEvent("theme-wc-close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}}customElements.define("theme-wc",ue);class _i extends HTMLElement{#t;#e=new WeakSet;connectedCallback(){this.#n()}disconnectedCallback(){this.#o()}#n(){this.#i(),this.#t=new MutationObserver(e=>{for(const t of e)t.type==="childList"&&this.#i()}),this.#t.observe(this,{childList:!0,subtree:!0})}#o(){this.#t?.disconnect()}#i(){const t=(this.dataset.levels||"h2,h3").split(",").map(n=>n.trim()).join(","),i=this.querySelectorAll(t);for(const n of i)this.#e.has(n)||(this.#r(n),this.#e.add(n))}#r(e){if(e.closest("dialog")||(e.id||(e.id=this.#s(e.textContent)),e.querySelector(".heading-anchor")))return;const t=document.createElement("a");t.className="heading-anchor",t.href=`#${e.id}`,t.setAttribute("aria-label",`Link to ${e.textContent.trim()}`),t.innerHTML='<icon-wc name="link" size="sm"></icon-wc>',t.addEventListener("click",i=>{i.preventDefault(),this.#a(e,t)}),e.appendChild(t),e.hasAttribute("tabindex")||e.setAttribute("tabindex","-1")}#s(e){const t=e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").substring(0,50);let i=t,n=1;for(;document.getElementById(i);)i=`${t}-${n}`,n++;return i}async#a(e,t){const i=new URL(window.location.href);i.hash=e.id,window.history.pushState(null,"",i),e.scrollIntoView({behavior:"smooth",block:"start"}),e.focus();try{await navigator.clipboard.writeText(i.href);const n=t.innerHTML;t.innerHTML='<icon-wc name="check" size="sm"></icon-wc>',t.classList.add("copied"),setTimeout(()=>{t.innerHTML=n,t.classList.remove("copied")},1500),this.#l("Link copied to clipboard")}catch{}this.dispatchEvent(new CustomEvent("heading-navigate",{bubbles:!0,detail:{id:e.id,url:i.href}}))}#l(e){const t=document.createElement("div");t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),t.className="sr-only",t.textContent=e,this.appendChild(t),setTimeout(()=>t.remove(),1e3)}}customElements.define("heading-links",_i);class Ti extends HTMLElement{#t;#e=[];#n=new Map;#o;#i;#r;#s=!1;connectedCallback(){requestAnimationFrame(()=>this.#a())}disconnectedCallback(){this.#d()}#a(){this.#s=this.#l(),this.#s?this.#c():this.#v(),this.#x(),this.#p(),this.#g()}#l(){return this.querySelector("nav, details")!==null}#c(){this.#i=this.querySelector("details");const e=this.querySelectorAll('a[href^="#"]');for(const t of e){const n=t.getAttribute("href").slice(1);if(n){const o=document.getElementById(n);o&&(this.#e.push(o),this.#n.set(n,t),t.classList.contains("link")||t.classList.add("link"),t.addEventListener("click",a=>{a.preventDefault(),this.#b(o)}))}}}#d(){this.#t?.disconnect(),this.#o?.removeEventListener("change",this.#u),window.removeEventListener("resize",this.#h),window.removeEventListener("hashchange",this.#m),clearTimeout(this.#r)}#p(){this.#o=window.matchMedia("(min-width: 1024px)"),this.#u=this.#u.bind(this),this.#h=this.#h.bind(this),this.#o.addEventListener("change",this.#u),window.addEventListener("resize",this.#h)}#u=e=>{e.matches&&this.#i&&(this.#i.open=!0)};#h=()=>{clearTimeout(this.#r),this.#r=setTimeout(()=>this.#f(),150)};#g(){this.#m=this.#m.bind(this),window.addEventListener("hashchange",this.#m),this.#f()}#m=()=>{this.#f()};#f(){const e=window.location.hash.slice(1);e&&this.#n.has(e)&&this.#y(e)}#y(e){for(const i of this.#n.values())i.classList.remove("active"),i.removeAttribute("aria-current");const t=this.#n.get(e);t&&(t.classList.add("active"),t.setAttribute("aria-current","true"))}#v(){const e=this.dataset.levels||"h2,h3",t=this.dataset.scope||"main",i=this.dataset.title||"On this page",n=document.querySelector(t);if(!n)return;const o=e.split(",").map(w=>w.trim()).join(",");if(this.#e=Array.from(n.querySelectorAll(o)).filter(w=>w.id),this.#e.length===0)return;this.#i=document.createElement("details"),this.#i.className="details",this.#i.open=!0;const a=this.#i,c=document.createElement("summary");c.className="summary",c.textContent=i,a.appendChild(c);const h=document.createElement("nav");h.className="nav",h.setAttribute("aria-label",i);const g=document.createElement("ul");g.className="list";const A=e.split(",").map(w=>w.trim().toLowerCase());for(const w of this.#e){const C=w.tagName.toLowerCase(),L=A.indexOf(C),q=L>=0?L:0,$=document.createElement("li");$.className="item",$.dataset.level=q;const D=document.createElement("a");D.href=`#${w.id}`,D.className="link",D.textContent=this.#w(w),D.addEventListener("click",V=>{V.preventDefault(),this.#b(w)}),$.appendChild(D),g.appendChild($),this.#n.set(w.id,D)}h.appendChild(g),a.appendChild(h),this.appendChild(a)}#w(e){const t=e.cloneNode(!0);return t.querySelectorAll(".heading-anchor").forEach(n=>n.remove()),t.textContent.trim()}#b(e){const t=new URL(window.location.href);t.hash=e.id,window.history.pushState(null,"",t),e.scrollIntoView({behavior:"smooth",block:"start"}),e.focus(),this.dispatchEvent(new CustomEvent("toc-navigate",{bubbles:!0,detail:{id:e.id}}))}#x(){if(this.#e.length===0)return;const e=new Set;this.#t=new IntersectionObserver(t=>{for(const i of t)i.isIntersecting?e.add(i.target.id):e.delete(i.target.id);this.#E(e)},{rootMargin:"-80px 0px -70% 0px",threshold:0});for(const t of this.#e)this.#t.observe(t)}#E(e){for(const t of this.#e)if(e.has(t.id)){this.#y(t.id);return}this.#f()}refresh(){this.#s||(this.innerHTML=""),this.#n.clear(),this.#e=[],this.#t?.disconnect(),this.#a()}}customElements.define("page-toc",Ti);class $i extends HTMLElement{#t;#e;#n=[];#o=[];#i=[];#r=-1;#s=null;#a=1;#l=0;#c=null;#d=null;#p=null;#u="";#h=null;#g=null;connectedCallback(){this.#t=this.querySelector(":scope > table"),this.#t&&(this.#e=this.#t.querySelector("tbody"),this.#e&&this.#m())}disconnectedCallback(){this.#f()}#m(){this.#o=[...this.#e.querySelectorAll(":scope > tr")],this.#i=[...this.#o],this.#y(),this.#t.hasAttribute("data-filterable")&&this.#A();const e=this.#t.getAttribute("data-paginate");e&&(this.#l=parseInt(e,10),this.#l>0&&this.#I()),this.#R(),this.#z(),this.#S()}#f(){this.#p&&clearTimeout(this.#p),this.#c?.parentElement?.remove(),this.#d?.remove(),this.#n.forEach(({th:e})=>{e.removeEventListener("click",this.#w),e.removeEventListener("keydown",this.#b)}),this.#t?.removeEventListener("click",this.#L),this.#h?.removeEventListener("change",this.#_),this.#e?.removeEventListener("change",this.#T)}#y(){this.#t.querySelectorAll("thead th[data-sort]").forEach((t,i)=>{const n=t.getAttribute("data-sort"),o=this.#v(t);this.#n.push({th:t,sortType:n,columnIndex:o}),t.setAttribute("tabindex","0"),t.setAttribute("role","columnheader"),t.setAttribute("aria-sort","none"),t.dataset.columnIndex=o,t.addEventListener("click",this.#w),t.addEventListener("keydown",this.#b)})}#v(e){return[...e.parentElement.children].indexOf(e)}#w=e=>{const t=e.currentTarget,i=parseInt(t.dataset.columnIndex,10);this.#x(i)};#b=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();const t=e.currentTarget,i=parseInt(t.dataset.columnIndex,10);this.#x(i)}};#x(e){const t=this.#n.find(n=>n.columnIndex===e);if(!t)return;let i;this.#r===e?i=this.#s==="asc"?"desc":"asc":i="asc",this.#n.forEach(({th:n})=>{n.removeAttribute("data-state-sorted"),n.setAttribute("aria-sort","none")}),t.th.setAttribute("data-state-sorted",i),t.th.setAttribute("aria-sort",i==="asc"?"ascending":"descending"),this.#r=e,this.#s=i,this.#E(e,i,t.sortType),this.#a=1,this.#S(),this.dispatchEvent(new CustomEvent("table:sort",{detail:{column:e,direction:i,columnName:t.th.textContent.trim()},bubbles:!0}))}#E(e,t,i){const n=t==="asc"?1:-1;this.#i.sort((o,a)=>{const c=o.children[e],h=a.children[e];if(!c||!h)return 0;const g=this.#k(c,i),A=this.#k(h,i);let w=0;switch(i){case"number":w=g-A;break;case"date":w=g-A;break;case"string":default:w=g.localeCompare(A,void 0,{numeric:!0,sensitivity:"base"});break}return w*n})}#k(e,t){const n=e.getAttribute("data-sort-value")??e.textContent.trim();switch(t){case"number":return parseFloat(n)||0;case"date":return new Date(n).getTime()||0;case"string":default:return n.toLowerCase()}}#A(){const e=document.createElement("div");e.setAttribute("data-table-filter","");const t=document.createElement("input");t.type="search",t.setAttribute("data-filter-input",""),t.setAttribute("placeholder","Filter table..."),t.setAttribute("aria-label","Filter table rows"),e.appendChild(t),this.insertBefore(e,this.#t),this.#c=t,t.addEventListener("input",this.#O)}#O=e=>{const t=e.target.value;this.#p&&clearTimeout(this.#p),this.#p=setTimeout(()=>{this.#C(t)},150)};#C(e){if(this.#u=e.toLowerCase().trim(),this.#u===""?this.#i=[...this.#o]:this.#i=this.#o.filter(t=>[...t.children].some(n=>(n.getAttribute("data-filter-value")??n.textContent).toLowerCase().includes(this.#u))),this.#r>=0&&this.#s){const t=this.#n.find(i=>i.columnIndex===this.#r);t&&this.#E(this.#r,this.#s,t.sortType)}this.#a=1,this.#S(),this.dispatchEvent(new CustomEvent("table:filter",{detail:{query:this.#u,count:this.#i.length},bubbles:!0}))}#I(){const e=document.createElement("nav");e.setAttribute("data-pagination",""),e.setAttribute("aria-label","Table pagination"),this.appendChild(e),this.#d=e}#R(){this.#t.addEventListener("click",this.#L)}#L=e=>{const t=e.target.closest('[data-action="toggle-expand"]');if(!t)return;const i=t.closest("tr[data-expandable]");if(!i)return;const n=i.hasAttribute("data-state-expanded"),o=i.nextElementSibling;n?(i.removeAttribute("data-state-expanded"),t.setAttribute("aria-expanded","false"),o?.hasAttribute("data-expand-content")&&(o.hidden=!0,o.setAttribute("aria-hidden","true"))):(i.setAttribute("data-state-expanded",""),t.setAttribute("aria-expanded","true"),o?.hasAttribute("data-expand-content")&&(o.hidden=!1,o.removeAttribute("aria-hidden"))),this.dispatchEvent(new CustomEvent("table:expand",{detail:{row:i,expanded:!n},bubbles:!0}))};#z(){this.#h=this.#t.querySelector('thead [data-action="select-all"]'),this.#h&&this.#h.addEventListener("change",this.#_),this.#e.addEventListener("change",this.#T),this.#g=document.querySelector("[data-selected-count]"),this.#$()}#_=e=>{const t=e.target.checked;this.#e.querySelectorAll("tr[data-selectable]").forEach(n=>{const o=n.querySelector('[data-action="select-row"]');t?(n.setAttribute("data-state-selected",""),o&&(o.checked=!0)):(n.removeAttribute("data-state-selected"),o&&(o.checked=!1))}),e.target.indeterminate=!1,this.#M(),this.#N()};#T=e=>{const t=e.target.closest('[data-action="select-row"]');if(!t)return;const i=t.closest("tr[data-selectable]");i&&(t.checked?i.setAttribute("data-state-selected",""):i.removeAttribute("data-state-selected"),this.#$(),this.#N())};#$(){if(!this.#h){this.#M();return}const e=this.#e.querySelectorAll("tr[data-selectable]"),t=this.#e.querySelectorAll("tr[data-selectable][data-state-selected]"),i=e.length,n=t.length;n===0?(this.#h.checked=!1,this.#h.indeterminate=!1):n===i?(this.#h.checked=!0,this.#h.indeterminate=!1):(this.#h.checked=!1,this.#h.indeterminate=!0),this.#M()}#M(){const t=this.#e.querySelectorAll("tr[data-selectable][data-state-selected]").length;this.#g&&(this.#g.textContent=t)}#N(){const e=[...this.#e.querySelectorAll("tr[data-selectable][data-state-selected]")];this.dispatchEvent(new CustomEvent("table:selection",{detail:{count:e.length,rows:e},bubbles:!0}))}#j(){if(!this.#d||this.#l<=0)return;const e=Math.ceil(this.#i.length/this.#l);if(this.#d.innerHTML="",e<=1)return;const t=document.createElement("button");t.type="button",t.textContent="Previous",t.setAttribute("data-pagination-prev",""),t.disabled=this.#a===1,t.addEventListener("click",()=>this.goToPage(this.#a-1)),this.#d.appendChild(t),this.#H(e).forEach(o=>{if(o==="..."){const a=document.createElement("span");a.textContent="...",a.setAttribute("data-pagination-ellipsis",""),this.#d.appendChild(a)}else{const a=document.createElement("button");a.type="button",a.textContent=o,a.setAttribute("data-pagination-page",""),o===this.#a&&(a.setAttribute("aria-current","page"),a.setAttribute("data-current","")),a.addEventListener("click",()=>this.goToPage(o)),this.#d.appendChild(a)}});const n=document.createElement("button");n.type="button",n.textContent="Next",n.setAttribute("data-pagination-next",""),n.disabled=this.#a===e,n.addEventListener("click",()=>this.goToPage(this.#a+1)),this.#d.appendChild(n)}#H(e){const t=this.#a,i=[];if(e<=7)for(let n=1;n<=e;n++)i.push(n);else{i.push(1),t>3&&i.push("...");const n=Math.max(2,t-1),o=Math.min(e-1,t+1);for(let a=n;a<=o;a++)i.push(a);t<e-2&&i.push("..."),i.push(e)}return i}#S(){this.#o.forEach(t=>{t.setAttribute("data-state-hidden","")});let e;if(this.#l>0){const t=(this.#a-1)*this.#l,i=t+this.#l;e=this.#i.slice(t,i)}else e=this.#i;e.forEach(t=>{t.removeAttribute("data-state-hidden"),this.#e.appendChild(t)}),this.#i.forEach(t=>{t.hasAttribute("data-state-hidden")&&this.#e.appendChild(t)}),this.#o.forEach(t=>{this.#i.includes(t)||this.#e.appendChild(t)}),this.#j()}goToPage(e){const t=Math.ceil(this.#i.length/this.#l),i=Math.max(1,Math.min(e,t));i!==this.#a&&(this.#a=i,this.#S(),this.dispatchEvent(new CustomEvent("table:page",{detail:{page:this.#a},bubbles:!0})))}setFilter(e){this.#c&&(this.#c.value=e),this.#C(e)}refresh(){if(this.#o=[...this.#e.querySelectorAll(":scope > tr")],this.#u?this.#C(this.#u):this.#i=[...this.#o],this.#r>=0&&this.#s){const t=this.#n.find(i=>i.columnIndex===this.#r);t&&this.#E(this.#r,this.#s,t.sortType)}const e=Math.max(1,Math.ceil(this.#i.length/this.#l));this.#a>e&&(this.#a=e),this.#S()}get currentPage(){return this.#a}get totalPages(){return this.#l<=0?1:Math.ceil(this.#i.length/this.#l)}get filteredCount(){return this.#i.length}get totalCount(){return this.#o.length}getSelectedRows(){return this.#e?[...this.#e.querySelectorAll("tr[data-selectable][data-state-selected]")]:[]}}customElements.define("table-wc",$i);class Ie extends HTMLElement{static#t=150;static#e=8;#n;#o;#i;#r;#s=[];#a=-1;#l=!1;#c=null;#d=null;connectedCallback(){this.#p(),this.#u()}disconnectedCallback(){document.removeEventListener("keydown",this.#g),this.#A()}#p(){this.#n=this.querySelector(":scope > [data-trigger]"),this.#n||(this.#n=this.querySelector(":scope > button")),this.#n||(this.#n=document.createElement("button"),this.#n.setAttribute("data-trigger",""),this.#n.innerHTML=`
        <x-icon name="search" label="Search"></x-icon>
      `,this.prepend(this.#n)),this.#n.setAttribute("aria-haspopup","dialog"),this.#n.setAttribute("aria-expanded","false"),this.#o=document.createElement("div"),this.#o.className="dialog",this.#o.setAttribute("role","dialog"),this.#o.setAttribute("aria-label","Site search"),this.#o.id=`search-dialog-${crypto.randomUUID().slice(0,8)}`,this.#n.setAttribute("aria-controls",this.#o.id),this.#o.innerHTML=`
      <div class="backdrop"></div>
      <div class="panel">
        <div class="input-wrapper">
          <x-icon name="search" class="icon"></x-icon>
          <input
            type="search"
            class="input"
            placeholder="Search documentation..."
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Search"
            aria-autocomplete="list"
          />
          <kbd class="shortcut">Esc</kbd>
        </div>
        <div class="results" role="listbox" aria-label="Search results"></div>
        <div class="footer">
          <span class="hint">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate
            <kbd>↵</kbd> to select
            <kbd>esc</kbd> to close
          </span>
          <span class="powered">
            Powered by <a href="https://pagefind.app" target="_blank" rel="noopener">Pagefind</a>
          </span>
        </div>
      </div>
    `,this.appendChild(this.#o),this.#i=this.#o.querySelector(".input"),this.#r=this.#o.querySelector(".results")}#u(){this.#n.addEventListener("click",this.#h),document.addEventListener("keydown",this.#g),this.#o.querySelector(".backdrop").addEventListener("click",()=>this.close()),this.#i.addEventListener("input",this.#m),this.#i.addEventListener("keydown",this.#f),this.#r.addEventListener("click",this.#y)}#h=e=>{e.stopPropagation(),this.open()};#g=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault(),this.#l?this.close():this.open();return}e.key==="Escape"&&this.#l&&(e.preventDefault(),this.close())};#m=()=>{this.#A(),this.#d=setTimeout(()=>{this.#w(this.#i.value)},Ie.#t)};#f=e=>{switch(e.key){case"ArrowDown":e.preventDefault(),this.#E(this.#a+1);break;case"ArrowUp":e.preventDefault(),this.#E(this.#a-1);break;case"Enter":e.preventDefault(),this.#a>=0&&this.#s[this.#a]&&this.#k(this.#s[this.#a]);break}};#y=e=>{const t=e.target.closest("[data-result-index]");if(t){const i=parseInt(t.dataset.resultIndex,10);this.#s[i]&&this.#k(this.#s[i])}};async#v(){if(!this.#c)try{const e=new Function('return import("/pagefind/pagefind.js")');this.#c=await e(),await this.#c.options({excerptLength:20})}catch{console.warn("Pagefind not available. Run `npm run search:dev` to build the search index."),this.#c=null}}async#w(e){if(!e.trim()){this.#b([]);return}if(await this.#v(),!this.#c){this.#x();return}try{this.#r.innerHTML='<div class="loading">Searching...</div>';const t=await this.#c.search(e),i=await Promise.all(t.results.slice(0,Ie.#e).map(n=>n.data()));this.#s=i,this.#b(i)}catch(t){console.error("Search error:",t),this.#r.innerHTML='<div class="error">Search error. Please try again.</div>'}}#b(e){if(this.#a=-1,e.length===0){this.#i.value.trim()?this.#r.innerHTML='<div class="empty">No results found</div>':this.#r.innerHTML="";return}this.#r.innerHTML=e.map((t,i)=>`
      <a
        href="${t.url}"
        class="result"
        role="option"
        data-result-index="${i}"
        tabindex="-1"
      >
        <span class="result-title">${t.meta?.title||"Untitled"}</span>
        <span class="result-excerpt">${t.excerpt||""}</span>
      </a>
    `).join("")}#x(){this.#r.innerHTML=`
      <div class="error">
        Search index not found.<br>
        Run <code>npx pagefind --site dist</code> after building.
      </div>
    `}#E(e){if(this.#s.length===0)return;e<0&&(e=this.#s.length-1),e>=this.#s.length&&(e=0);const t=this.#r.querySelector("[data-active]");t&&t.removeAttribute("data-active"),this.#a=e;const i=this.#r.querySelector(`[data-result-index="${e}"]`);i&&(i.setAttribute("data-active",""),i.scrollIntoView({block:"nearest"}))}#k(e){e.url&&(this.close(),window.location.href=e.url)}#A(){this.#d&&(clearTimeout(this.#d),this.#d=null)}open(){this.#l||(this.#l=!0,this.setAttribute("data-open",""),this.#n?.setAttribute("aria-expanded","true"),document.body.style.overflow="hidden",requestAnimationFrame(()=>{this.#i?.focus(),this.#i?.select()}),this.#v(),this.dispatchEvent(new CustomEvent("search-wc-open",{bubbles:!0})))}close(){this.#l&&(this.#l=!1,this.removeAttribute("data-open"),this.#n?.setAttribute("aria-expanded","false"),document.body.style.overflow="",this.#A(),this.#i.value="",this.#s=[],this.#a=-1,this.#r.innerHTML="",this.#n?.focus(),this.dispatchEvent(new CustomEvent("search-wc-close",{bubbles:!0})))}get isOpen(){return this.#l}}customElements.define("search-wc",Ie);const Ni=/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;function ft(s){return!s||typeof s!="string"?!1:Ni.test(s.trim())}function Ee(s,e){if(!ft(e)){console.warn(`[card-list] Unsafe property path rejected: "${e}"`);return}const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let n=s;for(const o of i){if(n==null)return;n=n[o]}return n}function Oi(s){if(!s||typeof s!="string")return"";const e=document.createElement("template");return e.innerHTML=s,e.content.querySelectorAll("script, iframe, object, embed, form").forEach(n=>n.remove()),e.content.querySelectorAll("*").forEach(n=>{[...n.attributes].forEach(o=>{(o.name.startsWith("on")||o.name==="href"&&o.value.startsWith("javascript:"))&&n.removeAttribute(o.name)})}),e.innerHTML}function Ii(s){return s?s.split(",").map(e=>{const[t,i]=e.split(":").map(n=>n.trim());return{attr:t,path:i}}).filter(({attr:e,path:t})=>e&&t):[]}class Ri extends HTMLElement{#t=null;#e=[];#n="id";static get observedAttributes(){return["src","data-items","data-key"]}connectedCallback(){if(this.#t=this.querySelector("template"),!this.#t){console.warn("[card-list] No template found");return}this.#n=this.getAttribute("data-key")||"id";const e=this.getAttribute("data-items");if(e){try{this.#e=JSON.parse(e),this.#i()}catch(i){console.error("[card-list] Invalid JSON in data-items:",i)}return}const t=this.getAttribute("src");t&&this.#o(t)}attributeChangedCallback(e,t,i){if(t!==i)if(e==="data-items"&&i)try{this.#e=JSON.parse(i),this.#i()}catch(n){console.error("[card-list] Invalid JSON in data-items:",n)}else e==="src"&&i?this.#o(i):e==="data-key"&&(this.#n=i||"id",this.#i())}async#o(e){try{this.setAttribute("data-loading","");const t=await fetch(e);if(!t.ok)throw new Error(`HTTP ${t.status}`);const i=await t.json();this.#e=Array.isArray(i)?i:i.items||i.data||[],this.#i()}catch(t){console.error("[card-list] Fetch error:",t),this.setAttribute("data-error",t.message)}finally{this.removeAttribute("data-loading")}}#i(){if(!this.#t)return;this.querySelectorAll(":scope > :not(template)").forEach(i=>i.remove());const t=document.createDocumentFragment();for(const i of this.#e){const n=this.#t.content.cloneNode(!0);this.#r(n,i),t.appendChild(n)}this.appendChild(t),this.dispatchEvent(new CustomEvent("card-list-render",{detail:{count:this.#e.length},bubbles:!0}))}#r(e,t){e.querySelectorAll("[data-field]").forEach(i=>{const n=i.getAttribute("data-field"),o=Ee(t,n);i.textContent=o??""}),e.querySelectorAll("[data-field-attr]").forEach(i=>{const n=Ii(i.getAttribute("data-field-attr"));for(const{attr:o,path:a}of n){if(!ft(a))continue;const c=Ee(t,a);c!=null&&i.setAttribute(o,c)}}),e.querySelectorAll("[data-field-html]").forEach(i=>{const n=i.getAttribute("data-field-html"),o=Ee(t,n);i.innerHTML=Oi(o)}),e.querySelectorAll("[data-field-if]").forEach(i=>{const n=i.getAttribute("data-field-if");Ee(t,n)||i.remove()}),e.querySelectorAll("[data-field-unless]").forEach(i=>{const n=i.getAttribute("data-field-unless");Ee(t,n)&&i.remove()})}setItems(e){this.#e=Array.isArray(e)?e:[],this.#i()}getItems(){return[...this.#e]}}customElements.define("card-list",Ri);function zi(s){return s&&s.__esModule&&Object.prototype.hasOwnProperty.call(s,"default")?s.default:s}var Ke,gt;function ji(){if(gt)return Ke;gt=1;function s(r){return r instanceof Map?r.clear=r.delete=r.set=function(){throw new Error("map is read-only")}:r instanceof Set&&(r.add=r.clear=r.delete=function(){throw new Error("set is read-only")}),Object.freeze(r),Object.getOwnPropertyNames(r).forEach(l=>{const b=r[l],E=typeof b;(E==="object"||E==="function")&&!Object.isFrozen(b)&&s(b)}),r}class e{constructor(l){l.data===void 0&&(l.data={}),this.data=l.data,this.isMatchIgnored=!1}ignoreMatch(){this.isMatchIgnored=!0}}function t(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function i(r,...l){const b=Object.create(null);for(const E in r)b[E]=r[E];return l.forEach(function(E){for(const N in E)b[N]=E[N]}),b}const n="</span>",o=r=>!!r.scope,a=(r,{prefix:l})=>{if(r.startsWith("language:"))return r.replace("language:","language-");if(r.includes(".")){const b=r.split(".");return[`${l}${b.shift()}`,...b.map((E,N)=>`${E}${"_".repeat(N+1)}`)].join(" ")}return`${l}${r}`};class c{constructor(l,b){this.buffer="",this.classPrefix=b.classPrefix,l.walk(this)}addText(l){this.buffer+=t(l)}openNode(l){if(!o(l))return;const b=a(l.scope,{prefix:this.classPrefix});this.span(b)}closeNode(l){o(l)&&(this.buffer+=n)}value(){return this.buffer}span(l){this.buffer+=`<span class="${l}">`}}const h=(r={})=>{const l={children:[]};return Object.assign(l,r),l};class g{constructor(){this.rootNode=h(),this.stack=[this.rootNode]}get top(){return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(l){this.top.children.push(l)}openNode(l){const b=h({scope:l});this.add(b),this.stack.push(b)}closeNode(){if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}walk(l){return this.constructor._walk(l,this.rootNode)}static _walk(l,b){return typeof b=="string"?l.addText(b):b.children&&(l.openNode(b),b.children.forEach(E=>this._walk(l,E)),l.closeNode(b)),l}static _collapse(l){typeof l!="string"&&l.children&&(l.children.every(b=>typeof b=="string")?l.children=[l.children.join("")]:l.children.forEach(b=>{g._collapse(b)}))}}class A extends g{constructor(l){super(),this.options=l}addText(l){l!==""&&this.add(l)}startScope(l){this.openNode(l)}endScope(){this.closeNode()}__addSublanguage(l,b){const E=l.root;b&&(E.scope=`language:${b}`),this.add(E)}toHTML(){return new c(this,this.options).value()}finalize(){return this.closeAllNodes(),!0}}function w(r){return r?typeof r=="string"?r:r.source:null}function C(r){return $("(?=",r,")")}function L(r){return $("(?:",r,")*")}function q(r){return $("(?:",r,")?")}function $(...r){return r.map(l=>w(l)).join("")}function D(r){const l=r[r.length-1];return typeof l=="object"&&l.constructor===Object?(r.splice(r.length-1,1),l):{}}function V(...r){return"("+(D(r).capture?"":"?:")+r.map(l=>w(l)).join("|")+")"}function X(r){return new RegExp(r.toString()+"|").exec("").length-1}function te(r,l){const b=r&&r.exec(l);return b&&b.index===0}const Q=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;function U(r,{joinWith:l}){let b=0;return r.map(E=>{b+=1;const N=b;let O=w(E),m="";for(;O.length>0;){const p=Q.exec(O);if(!p){m+=O;break}m+=O.substring(0,p.index),O=O.substring(p.index+p[0].length),p[0][0]==="\\"&&p[1]?m+="\\"+String(Number(p[1])+N):(m+=p[0],p[0]==="("&&b++)}return m}).map(E=>`(${E})`).join(l)}const le=/\b\B/,Z="[a-zA-Z]\\w*",K="[a-zA-Z_]\\w*",Y="\\b\\d+(\\.\\d+)?",ie="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",B="\\b(0b[01]+)",F="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",ee=(r={})=>{const l=/^#![ ]*\//;return r.binary&&(r.begin=$(l,/.*\b/,r.binary,/\b.*/)),i({scope:"meta",begin:l,end:/$/,relevance:0,"on:begin":(b,E)=>{b.index!==0&&E.ignoreMatch()}},r)},z={begin:"\\\\[\\s\\S]",relevance:0},se={scope:"string",begin:"'",end:"'",illegal:"\\n",contains:[z]},ze={scope:"string",begin:'"',end:'"',illegal:"\\n",contains:[z]},G={begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},ne=function(r,l,b={}){const E=i({scope:"comment",begin:r,end:l,contains:[]},b);E.contains.push({scope:"doctag",begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0});const N=V("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/);return E.contains.push({begin:$(/[ ]+/,"(",N,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),E},be=ne("//","$"),we=ne("/\\*","\\*/"),ye=ne("#","$"),Ae={scope:"number",begin:Y,relevance:0},kt={scope:"number",begin:ie,relevance:0},At={scope:"number",begin:B,relevance:0},St={scope:"regexp",begin:/\/(?=[^/\n]*\/)/,end:/\/[gimuy]*/,contains:[z,{begin:/\[/,end:/\]/,relevance:0,contains:[z]}]},Ct={scope:"title",begin:Z,relevance:0},Mt={scope:"title",begin:K,relevance:0},Lt={begin:"\\.\\s*"+K,relevance:0};var Se=Object.freeze({__proto__:null,APOS_STRING_MODE:se,BACKSLASH_ESCAPE:z,BINARY_NUMBER_MODE:At,BINARY_NUMBER_RE:B,COMMENT:ne,C_BLOCK_COMMENT_MODE:we,C_LINE_COMMENT_MODE:be,C_NUMBER_MODE:kt,C_NUMBER_RE:ie,END_SAME_AS_BEGIN:function(r){return Object.assign(r,{"on:begin":(l,b)=>{b.data._beginMatch=l[1]},"on:end":(l,b)=>{b.data._beginMatch!==l[1]&&b.ignoreMatch()}})},HASH_COMMENT_MODE:ye,IDENT_RE:Z,MATCH_NOTHING_RE:le,METHOD_GUARD:Lt,NUMBER_MODE:Ae,NUMBER_RE:Y,PHRASAL_WORDS_MODE:G,QUOTE_STRING_MODE:ze,REGEXP_MODE:St,RE_STARTERS_RE:F,SHEBANG:ee,TITLE_MODE:Ct,UNDERSCORE_IDENT_RE:K,UNDERSCORE_TITLE_MODE:Mt});function _t(r,l){r.input[r.index-1]==="."&&l.ignoreMatch()}function Tt(r,l){r.className!==void 0&&(r.scope=r.className,delete r.className)}function $t(r,l){l&&r.beginKeywords&&(r.begin="\\b("+r.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",r.__beforeBegin=_t,r.keywords=r.keywords||r.beginKeywords,delete r.beginKeywords,r.relevance===void 0&&(r.relevance=0))}function Nt(r,l){Array.isArray(r.illegal)&&(r.illegal=V(...r.illegal))}function Ot(r,l){if(r.match){if(r.begin||r.end)throw new Error("begin & end are not supported with match");r.begin=r.match,delete r.match}}function It(r,l){r.relevance===void 0&&(r.relevance=1)}const Rt=(r,l)=>{if(!r.beforeMatch)return;if(r.starts)throw new Error("beforeMatch cannot be used with starts");const b=Object.assign({},r);Object.keys(r).forEach(E=>{delete r[E]}),r.keywords=b.keywords,r.begin=$(b.beforeMatch,C(b.begin)),r.starts={relevance:0,contains:[Object.assign(b,{endsParent:!0})]},r.relevance=0,delete b.beforeMatch},zt=["of","and","for","in","not","or","if","then","parent","list","value"],jt="keyword";function Je(r,l,b=jt){const E=Object.create(null);return typeof r=="string"?N(b,r.split(" ")):Array.isArray(r)?N(b,r):Object.keys(r).forEach(function(O){Object.assign(E,Je(r[O],l,O))}),E;function N(O,m){l&&(m=m.map(p=>p.toLowerCase())),m.forEach(function(p){const y=p.split("|");E[y[0]]=[O,Ht(y[0],y[1])]})}}function Ht(r,l){return l?Number(l):Dt(r)?0:1}function Dt(r){return zt.includes(r.toLowerCase())}const Xe={},pe=r=>{console.error(r)},Qe=(r,...l)=>{console.log(`WARN: ${r}`,...l)},me=(r,l)=>{Xe[`${r}/${l}`]||(console.log(`Deprecated as of ${r}. ${l}`),Xe[`${r}/${l}`]=!0)},Ce=new Error;function Ye(r,l,{key:b}){let E=0;const N=r[b],O={},m={};for(let p=1;p<=l.length;p++)m[p+E]=N[p],O[p+E]=!0,E+=X(l[p-1]);r[b]=m,r[b]._emit=O,r[b]._multi=!0}function Bt(r){if(Array.isArray(r.begin)){if(r.skip||r.excludeBegin||r.returnBegin)throw pe("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),Ce;if(typeof r.beginScope!="object"||r.beginScope===null)throw pe("beginScope must be object"),Ce;Ye(r,r.begin,{key:"beginScope"}),r.begin=U(r.begin,{joinWith:""})}}function Pt(r){if(Array.isArray(r.end)){if(r.skip||r.excludeEnd||r.returnEnd)throw pe("skip, excludeEnd, returnEnd not compatible with endScope: {}"),Ce;if(typeof r.endScope!="object"||r.endScope===null)throw pe("endScope must be object"),Ce;Ye(r,r.end,{key:"endScope"}),r.end=U(r.end,{joinWith:""})}}function qt(r){r.scope&&typeof r.scope=="object"&&r.scope!==null&&(r.beginScope=r.scope,delete r.scope)}function Ut(r){qt(r),typeof r.beginScope=="string"&&(r.beginScope={_wrap:r.beginScope}),typeof r.endScope=="string"&&(r.endScope={_wrap:r.endScope}),Bt(r),Pt(r)}function Ft(r){function l(m,p){return new RegExp(w(m),"m"+(r.case_insensitive?"i":"")+(r.unicodeRegex?"u":"")+(p?"g":""))}class b{constructor(){this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}addRule(p,y){y.position=this.position++,this.matchIndexes[this.matchAt]=y,this.regexes.push([y,p]),this.matchAt+=X(p)+1}compile(){this.regexes.length===0&&(this.exec=()=>null);const p=this.regexes.map(y=>y[1]);this.matcherRe=l(U(p,{joinWith:"|"}),!0),this.lastIndex=0}exec(p){this.matcherRe.lastIndex=this.lastIndex;const y=this.matcherRe.exec(p);if(!y)return null;const H=y.findIndex((xe,He)=>He>0&&xe!==void 0),I=this.matchIndexes[H];return y.splice(0,H),Object.assign(y,I)}}class E{constructor(){this.rules=[],this.multiRegexes=[],this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(p){if(this.multiRegexes[p])return this.multiRegexes[p];const y=new b;return this.rules.slice(p).forEach(([H,I])=>y.addRule(H,I)),y.compile(),this.multiRegexes[p]=y,y}resumingScanAtSamePosition(){return this.regexIndex!==0}considerAll(){this.regexIndex=0}addRule(p,y){this.rules.push([p,y]),y.type==="begin"&&this.count++}exec(p){const y=this.getMatcher(this.regexIndex);y.lastIndex=this.lastIndex;let H=y.exec(p);if(this.resumingScanAtSamePosition()&&!(H&&H.index===this.lastIndex)){const I=this.getMatcher(0);I.lastIndex=this.lastIndex+1,H=I.exec(p)}return H&&(this.regexIndex+=H.position+1,this.regexIndex===this.count&&this.considerAll()),H}}function N(m){const p=new E;return m.contains.forEach(y=>p.addRule(y.begin,{rule:y,type:"begin"})),m.terminatorEnd&&p.addRule(m.terminatorEnd,{type:"end"}),m.illegal&&p.addRule(m.illegal,{type:"illegal"}),p}function O(m,p){const y=m;if(m.isCompiled)return y;[Tt,Ot,Ut,Rt].forEach(I=>I(m,p)),r.compilerExtensions.forEach(I=>I(m,p)),m.__beforeBegin=null,[$t,Nt,It].forEach(I=>I(m,p)),m.isCompiled=!0;let H=null;return typeof m.keywords=="object"&&m.keywords.$pattern&&(m.keywords=Object.assign({},m.keywords),H=m.keywords.$pattern,delete m.keywords.$pattern),H=H||/\w+/,m.keywords&&(m.keywords=Je(m.keywords,r.case_insensitive)),y.keywordPatternRe=l(H,!0),p&&(m.begin||(m.begin=/\B|\b/),y.beginRe=l(y.begin),!m.end&&!m.endsWithParent&&(m.end=/\B|\b/),m.end&&(y.endRe=l(y.end)),y.terminatorEnd=w(y.end)||"",m.endsWithParent&&p.terminatorEnd&&(y.terminatorEnd+=(m.end?"|":"")+p.terminatorEnd)),m.illegal&&(y.illegalRe=l(m.illegal)),m.contains||(m.contains=[]),m.contains=[].concat(...m.contains.map(function(I){return Wt(I==="self"?m:I)})),m.contains.forEach(function(I){O(I,y)}),m.starts&&O(m.starts,p),y.matcher=N(y),y}if(r.compilerExtensions||(r.compilerExtensions=[]),r.contains&&r.contains.includes("self"))throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");return r.classNameAliases=i(r.classNameAliases||{}),O(r)}function et(r){return r?r.endsWithParent||et(r.starts):!1}function Wt(r){return r.variants&&!r.cachedVariants&&(r.cachedVariants=r.variants.map(function(l){return i(r,{variants:null},l)})),r.cachedVariants?r.cachedVariants:et(r)?i(r,{starts:r.starts?i(r.starts):null}):Object.isFrozen(r)?i(r):r}var Zt="11.11.1";class Vt extends Error{constructor(l,b){super(l),this.name="HTMLInjectionError",this.html=b}}const je=t,tt=i,it=Symbol("nomatch"),Kt=7,nt=function(r){const l=Object.create(null),b=Object.create(null),E=[];let N=!0;const O="Could not find the language '{}', did you forget to load/include a language module?",m={disableAutodetect:!0,name:"Plain text",contains:[]};let p={ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",cssSelector:"pre code",languages:null,__emitter:A};function y(d){return p.noHighlightRe.test(d)}function H(d){let v=d.className+" ";v+=d.parentNode?d.parentNode.className:"";const S=p.languageDetectRe.exec(v);if(S){const _=de(S[1]);return _||(Qe(O.replace("{}",S[1])),Qe("Falling back to no-highlight mode for this block.",d)),_?S[1]:"no-highlight"}return v.split(/\s+/).find(_=>y(_)||de(_))}function I(d,v,S){let _="",j="";typeof v=="object"?(_=d,S=v.ignoreIllegals,j=v.language):(me("10.7.0","highlight(lang, code, ...args) has been deprecated."),me("10.7.0",`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`),j=d,_=v),S===void 0&&(S=!0);const re={code:_,language:j};Le("before:highlight",re);const he=re.result?re.result:xe(re.language,re.code,S);return he.code=re.code,Le("after:highlight",he),he}function xe(d,v,S,_){const j=Object.create(null);function re(u,f){return u.keywords[f]}function he(){if(!x.keywords){P.addText(T);return}let u=0;x.keywordPatternRe.lastIndex=0;let f=x.keywordPatternRe.exec(T),k="";for(;f;){k+=T.substring(u,f.index);const M=ae.case_insensitive?f[0].toLowerCase():f[0],W=re(x,M);if(W){const[ce,hi]=W;if(P.addText(k),k="",j[M]=(j[M]||0)+1,j[M]<=Kt&&($e+=hi),ce.startsWith("_"))k+=f[0];else{const ui=ae.classNameAliases[ce]||ce;oe(f[0],ui)}}else k+=f[0];u=x.keywordPatternRe.lastIndex,f=x.keywordPatternRe.exec(T)}k+=T.substring(u),P.addText(k)}function _e(){if(T==="")return;let u=null;if(typeof x.subLanguage=="string"){if(!l[x.subLanguage]){P.addText(T);return}u=xe(x.subLanguage,T,!0,ht[x.subLanguage]),ht[x.subLanguage]=u._top}else u=De(T,x.subLanguage.length?x.subLanguage:null);x.relevance>0&&($e+=u.relevance),P.__addSublanguage(u._emitter,u.language)}function J(){x.subLanguage!=null?_e():he(),T=""}function oe(u,f){u!==""&&(P.startScope(f),P.addText(u),P.endScope())}function at(u,f){let k=1;const M=f.length-1;for(;k<=M;){if(!u._emit[k]){k++;continue}const W=ae.classNameAliases[u[k]]||u[k],ce=f[k];W?oe(ce,W):(T=ce,he(),T=""),k++}}function lt(u,f){return u.scope&&typeof u.scope=="string"&&P.openNode(ae.classNameAliases[u.scope]||u.scope),u.beginScope&&(u.beginScope._wrap?(oe(T,ae.classNameAliases[u.beginScope._wrap]||u.beginScope._wrap),T=""):u.beginScope._multi&&(at(u.beginScope,f),T="")),x=Object.create(u,{parent:{value:x}}),x}function ct(u,f,k){let M=te(u.endRe,k);if(M){if(u["on:end"]){const W=new e(u);u["on:end"](f,W),W.isMatchIgnored&&(M=!1)}if(M){for(;u.endsParent&&u.parent;)u=u.parent;return u}}if(u.endsWithParent)return ct(u.parent,f,k)}function oi(u){return x.matcher.regexIndex===0?(T+=u[0],1):(Ue=!0,0)}function ai(u){const f=u[0],k=u.rule,M=new e(k),W=[k.__beforeBegin,k["on:begin"]];for(const ce of W)if(ce&&(ce(u,M),M.isMatchIgnored))return oi(f);return k.skip?T+=f:(k.excludeBegin&&(T+=f),J(),!k.returnBegin&&!k.excludeBegin&&(T=f)),lt(k,u),k.returnBegin?0:f.length}function li(u){const f=u[0],k=v.substring(u.index),M=ct(x,u,k);if(!M)return it;const W=x;x.endScope&&x.endScope._wrap?(J(),oe(f,x.endScope._wrap)):x.endScope&&x.endScope._multi?(J(),at(x.endScope,u)):W.skip?T+=f:(W.returnEnd||W.excludeEnd||(T+=f),J(),W.excludeEnd&&(T=f));do x.scope&&P.closeNode(),!x.skip&&!x.subLanguage&&($e+=x.relevance),x=x.parent;while(x!==M.parent);return M.starts&&lt(M.starts,u),W.returnEnd?0:f.length}function ci(){const u=[];for(let f=x;f!==ae;f=f.parent)f.scope&&u.unshift(f.scope);u.forEach(f=>P.openNode(f))}let Te={};function dt(u,f){const k=f&&f[0];if(T+=u,k==null)return J(),0;if(Te.type==="begin"&&f.type==="end"&&Te.index===f.index&&k===""){if(T+=v.slice(f.index,f.index+1),!N){const M=new Error(`0 width match regex (${d})`);throw M.languageName=d,M.badRule=Te.rule,M}return 1}if(Te=f,f.type==="begin")return ai(f);if(f.type==="illegal"&&!S){const M=new Error('Illegal lexeme "'+k+'" for mode "'+(x.scope||"<unnamed>")+'"');throw M.mode=x,M}else if(f.type==="end"){const M=li(f);if(M!==it)return M}if(f.type==="illegal"&&k==="")return T+=`
`,1;if(qe>1e5&&qe>f.index*3)throw new Error("potential infinite loop, way more iterations than matches");return T+=k,k.length}const ae=de(d);if(!ae)throw pe(O.replace("{}",d)),new Error('Unknown language: "'+d+'"');const di=Ft(ae);let Pe="",x=_||di;const ht={},P=new p.__emitter(p);ci();let T="",$e=0,ge=0,qe=0,Ue=!1;try{if(ae.__emitTokens)ae.__emitTokens(v,P);else{for(x.matcher.considerAll();;){qe++,Ue?Ue=!1:x.matcher.considerAll(),x.matcher.lastIndex=ge;const u=x.matcher.exec(v);if(!u)break;const f=v.substring(ge,u.index),k=dt(f,u);ge=u.index+k}dt(v.substring(ge))}return P.finalize(),Pe=P.toHTML(),{language:d,value:Pe,relevance:$e,illegal:!1,_emitter:P,_top:x}}catch(u){if(u.message&&u.message.includes("Illegal"))return{language:d,value:je(v),illegal:!0,relevance:0,_illegalBy:{message:u.message,index:ge,context:v.slice(ge-100,ge+100),mode:u.mode,resultSoFar:Pe},_emitter:P};if(N)return{language:d,value:je(v),illegal:!1,relevance:0,errorRaised:u,_emitter:P,_top:x};throw u}}function He(d){const v={value:je(d),illegal:!1,relevance:0,_top:m,_emitter:new p.__emitter(p)};return v._emitter.addText(d),v}function De(d,v){v=v||p.languages||Object.keys(l);const S=He(d),_=v.filter(de).filter(ot).map(J=>xe(J,d,!1));_.unshift(S);const j=_.sort((J,oe)=>{if(J.relevance!==oe.relevance)return oe.relevance-J.relevance;if(J.language&&oe.language){if(de(J.language).supersetOf===oe.language)return 1;if(de(oe.language).supersetOf===J.language)return-1}return 0}),[re,he]=j,_e=re;return _e.secondBest=he,_e}function Gt(d,v,S){const _=v&&b[v]||S;d.classList.add("hljs"),d.classList.add(`language-${_}`)}function Be(d){let v=null;const S=H(d);if(y(S))return;if(Le("before:highlightElement",{el:d,language:S}),d.dataset.highlighted){console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",d);return}if(d.children.length>0&&(p.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),console.warn("The element with unescaped HTML:"),console.warn(d)),p.throwUnescapedHTML))throw new Vt("One of your code blocks includes unescaped HTML.",d.innerHTML);v=d;const _=v.textContent,j=S?I(_,{language:S,ignoreIllegals:!0}):De(_);d.innerHTML=j.value,d.dataset.highlighted="yes",Gt(d,S,j.language),d.result={language:j.language,re:j.relevance,relevance:j.relevance},j.secondBest&&(d.secondBest={language:j.secondBest.language,relevance:j.secondBest.relevance}),Le("after:highlightElement",{el:d,result:j,text:_})}function Jt(d){p=tt(p,d)}const Xt=()=>{Me(),me("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")};function Qt(){Me(),me("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")}let st=!1;function Me(){function d(){Me()}if(document.readyState==="loading"){st||window.addEventListener("DOMContentLoaded",d,!1),st=!0;return}document.querySelectorAll(p.cssSelector).forEach(Be)}function Yt(d,v){let S=null;try{S=v(r)}catch(_){if(pe("Language definition for '{}' could not be registered.".replace("{}",d)),N)pe(_);else throw _;S=m}S.name||(S.name=d),l[d]=S,S.rawDefinition=v.bind(null,r),S.aliases&&rt(S.aliases,{languageName:d})}function ei(d){delete l[d];for(const v of Object.keys(b))b[v]===d&&delete b[v]}function ti(){return Object.keys(l)}function de(d){return d=(d||"").toLowerCase(),l[d]||l[b[d]]}function rt(d,{languageName:v}){typeof d=="string"&&(d=[d]),d.forEach(S=>{b[S.toLowerCase()]=v})}function ot(d){const v=de(d);return v&&!v.disableAutodetect}function ii(d){d["before:highlightBlock"]&&!d["before:highlightElement"]&&(d["before:highlightElement"]=v=>{d["before:highlightBlock"](Object.assign({block:v.el},v))}),d["after:highlightBlock"]&&!d["after:highlightElement"]&&(d["after:highlightElement"]=v=>{d["after:highlightBlock"](Object.assign({block:v.el},v))})}function ni(d){ii(d),E.push(d)}function si(d){const v=E.indexOf(d);v!==-1&&E.splice(v,1)}function Le(d,v){const S=d;E.forEach(function(_){_[S]&&_[S](v)})}function ri(d){return me("10.7.0","highlightBlock will be removed entirely in v12.0"),me("10.7.0","Please use highlightElement now."),Be(d)}Object.assign(r,{highlight:I,highlightAuto:De,highlightAll:Me,highlightElement:Be,highlightBlock:ri,configure:Jt,initHighlighting:Xt,initHighlightingOnLoad:Qt,registerLanguage:Yt,unregisterLanguage:ei,listLanguages:ti,getLanguage:de,registerAliases:rt,autoDetection:ot,inherit:tt,addPlugin:ni,removePlugin:si}),r.debugMode=function(){N=!1},r.safeMode=function(){N=!0},r.versionString=Zt,r.regex={concat:$,lookahead:C,either:V,optional:q,anyNumberOfTimes:L};for(const d in Se)typeof Se[d]=="object"&&s(Se[d]);return Object.assign(r,Se),r},fe=nt({});return fe.newInstance=()=>nt({}),Ke=fe,fe.HighlightJS=fe,fe.default=fe,Ke}var Hi=ji();const R=zi(Hi),mt="[A-Za-z$_][0-9A-Za-z$_]*",Di=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Bi=["true","false","null","undefined","NaN","Infinity"],vt=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],wt=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],yt=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Pi=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],qi=[].concat(yt,vt,wt);function xt(s){const e=s.regex,t=(G,{after:ne})=>{const be="</"+G[0].slice(1);return G.input.indexOf(be,ne)!==-1},i=mt,n={begin:"<>",end:"</>"},o=/<[A-Za-z0-9\\._:-]+\s*\/>/,a={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(G,ne)=>{const be=G[0].length+G.index,we=G.input[be];if(we==="<"||we===","){ne.ignoreMatch();return}we===">"&&(t(G,{after:be})||ne.ignoreMatch());let ye;const Ae=G.input.substring(be);if(ye=Ae.match(/^\s*=/)){ne.ignoreMatch();return}if((ye=Ae.match(/^\s+extends\s+/))&&ye.index===0){ne.ignoreMatch();return}}},c={$pattern:mt,keyword:Di,literal:Bi,built_in:qi,"variable.language":Pi},h="[0-9](_?[0-9])*",g=`\\.(${h})`,A="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",w={className:"number",variants:[{begin:`(\\b(${A})((${g})|\\.)?|(${g}))[eE][+-]?(${h})\\b`},{begin:`\\b(${A})\\b((${g})\\b|\\.)?|(${g})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},C={className:"subst",begin:"\\$\\{",end:"\\}",keywords:c,contains:[]},L={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[s.BACKSLASH_ESCAPE,C],subLanguage:"xml"}},q={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[s.BACKSLASH_ESCAPE,C],subLanguage:"css"}},$={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[s.BACKSLASH_ESCAPE,C],subLanguage:"graphql"}},D={className:"string",begin:"`",end:"`",contains:[s.BACKSLASH_ESCAPE,C]},V={className:"comment",variants:[s.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:i+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),s.C_BLOCK_COMMENT_MODE,s.C_LINE_COMMENT_MODE]},X=[s.APOS_STRING_MODE,s.QUOTE_STRING_MODE,L,q,$,D,{match:/\$\d+/},w];C.contains=X.concat({begin:/\{/,end:/\}/,keywords:c,contains:["self"].concat(X)});const te=[].concat(V,C.contains),Q=te.concat([{begin:/(\s*)\(/,end:/\)/,keywords:c,contains:["self"].concat(te)}]),U={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:c,contains:Q},le={variants:[{match:[/class/,/\s+/,i,/\s+/,/extends/,/\s+/,e.concat(i,"(",e.concat(/\./,i),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,i],scope:{1:"keyword",3:"title.class"}}]},Z={relevance:0,match:e.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...vt,...wt]}},K={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},Y={variants:[{match:[/function/,/\s+/,i,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[U],illegal:/%/},ie={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function B(G){return e.concat("(?!",G.join("|"),")")}const F={match:e.concat(/\b/,B([...yt,"super","import"].map(G=>`${G}\\s*\\(`)),i,e.lookahead(/\s*\(/)),className:"title.function",relevance:0},ee={begin:e.concat(/\./,e.lookahead(e.concat(i,/(?![0-9A-Za-z$_(])/))),end:i,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},z={match:[/get|set/,/\s+/,i,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},U]},se="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+s.UNDERSCORE_IDENT_RE+")\\s*=>",ze={match:[/const|var|let/,/\s+/,i,/\s*/,/=\s*/,/(async\s*)?/,e.lookahead(se)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[U]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:c,exports:{PARAMS_CONTAINS:Q,CLASS_REFERENCE:Z},illegal:/#(?![$_A-z])/,contains:[s.SHEBANG({label:"shebang",binary:"node",relevance:5}),K,s.APOS_STRING_MODE,s.QUOTE_STRING_MODE,L,q,$,D,V,{match:/\$\d+/},w,Z,{scope:"attr",match:i+e.lookahead(":"),relevance:0},ze,{begin:"("+s.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[V,s.REGEXP_MODE,{className:"function",begin:se,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:s.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:c,contains:Q}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:n.begin,end:n.end},{match:o},{begin:a.begin,"on:begin":a.isTrulyOpeningTag,end:a.end}],subLanguage:"xml",contains:[{begin:a.begin,end:a.end,skip:!0,contains:["self"]}]}]},Y,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+s.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[U,s.inherit(s.TITLE_MODE,{begin:i,className:"title.function"})]},{match:/\.\.\./,relevance:0},ee,{match:"\\$"+i,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[U]},F,ie,le,z,{match:/\$[(.]/}]}}const Ui=s=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:s.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[s.APOS_STRING_MODE,s.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:s.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),Fi=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],Wi=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],Zi=[...Fi,...Wi],Vi=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),Ki=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),Gi=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),Ji=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function Xi(s){const e=s.regex,t=Ui(s),i={begin:/-(webkit|moz|ms|o)-(?=[a-z])/},n="and or not only",o=/@-?\w[\w]*(-\w+)*/,a="[a-zA-Z-][a-zA-Z0-9_-]*",c=[s.APOS_STRING_MODE,s.QUOTE_STRING_MODE];return{name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},contains:[t.BLOCK_COMMENT,i,t.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{className:"selector-class",begin:"\\."+a,relevance:0},t.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{begin:":("+Ki.join("|")+")"},{begin:":(:)?("+Gi.join("|")+")"}]},t.CSS_VARIABLE,{className:"attribute",begin:"\\b("+Ji.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,contains:[t.BLOCK_COMMENT,t.HEXCOLOR,t.IMPORTANT,t.CSS_NUMBER_MODE,...c,{begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"},contains:[...c,{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]},t.FUNCTION_DISPATCH]},{begin:e.lookahead(/@/),end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",begin:o},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:n,attribute:Vi.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"},...c,t.CSS_NUMBER_MODE]}]},{className:"selector-tag",begin:"\\b("+Zi.join("|")+")\\b"}]}}function ke(s){const e=s.regex,t=e.concat(/[\p{L}_]/u,e.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),i=/[\p{L}0-9._:-]+/u,n={className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},o={begin:/\s/,contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},a=s.inherit(o,{begin:/\(/,end:/\)/}),c=s.inherit(s.APOS_STRING_MODE,{className:"string"}),h=s.inherit(s.QUOTE_STRING_MODE,{className:"string"}),g={endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",begin:i,relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[n]},{begin:/'/,end:/'/,contains:[n]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,relevance:10,contains:[o,h,c,a,{begin:/\[/,end:/\]/,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,contains:[o,a,h,c]}]}]},s.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},n,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,relevance:10,contains:[h]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[g],starts:{end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[g],starts:{end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{className:"tag",begin:/<>|<\/>/},{className:"tag",begin:e.concat(/</,e.lookahead(e.concat(t,e.either(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",begin:t,relevance:0,starts:g}]},{className:"tag",begin:e.concat(/<\//,e.lookahead(e.concat(t,/>/))),contains:[{className:"name",begin:t,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}function Qi(s){const e={className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},t={match:/[{}[\],:]/,className:"punctuation",relevance:0},i=["true","false","null"],n={scope:"literal",beginKeywords:i.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{literal:i},contains:[e,t,s.QUOTE_STRING_MODE,n,s.C_NUMBER_MODE,s.C_LINE_COMMENT_MODE,s.C_BLOCK_COMMENT_MODE],illegal:"\\S"}}function Et(s){const e="true false yes no null",t="[\\w#;/?:@&=+$,.~*'()[\\]]+",i={className:"attr",variants:[{begin:/[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/},{begin:/"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/},{begin:/'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/}]},n={className:"template-variable",variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]},o={className:"string",relevance:0,begin:/'/,end:/'/,contains:[{match:/''/,scope:"char.escape",relevance:0}]},a={className:"string",relevance:0,variants:[{begin:/"/,end:/"/},{begin:/\S+/}],contains:[s.BACKSLASH_ESCAPE,n]},c=s.inherit(a,{variants:[{begin:/'/,end:/'/,contains:[{begin:/''/,relevance:0}]},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),h={className:"number",begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"},g={end:",",endsWithParent:!0,excludeEnd:!0,keywords:e,relevance:0},A={begin:/\{/,end:/\}/,contains:[g],illegal:"\\n",relevance:0},w={begin:"\\[",end:"\\]",contains:[g],illegal:"\\n",relevance:0},C=[i,{className:"meta",begin:"^---\\s*$",relevance:10},{className:"string",begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,relevance:0},{className:"type",begin:"!\\w+!"+t},{className:"type",begin:"!<"+t+">"},{className:"type",begin:"!"+t},{className:"type",begin:"!!"+t},{className:"meta",begin:"&"+s.UNDERSCORE_IDENT_RE+"$"},{className:"meta",begin:"\\*"+s.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",relevance:0},s.HASH_COMMENT_MODE,{beginKeywords:e,keywords:{literal:e}},h,{className:"number",begin:s.C_NUMBER_RE+"\\b",relevance:0},A,w,o,a],L=[...C];return L.pop(),L.push(c),g.contains=L,{name:"YAML",case_insensitive:!0,aliases:["yml"],contains:C}}function Yi(s){const e=s.regex,t=/(?![A-Za-z0-9])(?![$])/,i=e.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,t),n=e.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,t),o=e.concat(/[A-Z]+/,t),a={scope:"variable",match:"\\$+"+i},c={scope:"meta",variants:[{begin:/<\?php/,relevance:10},{begin:/<\?=/},{begin:/<\?/,relevance:.1},{begin:/\?>/}]},h={scope:"subst",variants:[{begin:/\$\w+/},{begin:/\{\$/,end:/\}/}]},g=s.inherit(s.APOS_STRING_MODE,{illegal:null}),A=s.inherit(s.QUOTE_STRING_MODE,{illegal:null,contains:s.QUOTE_STRING_MODE.contains.concat(h)}),w={begin:/<<<[ \t]*(?:(\w+)|"(\w+)")\n/,end:/[ \t]*(\w+)\b/,contains:s.QUOTE_STRING_MODE.contains.concat(h),"on:begin":(ee,z)=>{z.data._beginMatch=ee[1]||ee[2]},"on:end":(ee,z)=>{z.data._beginMatch!==ee[1]&&z.ignoreMatch()}},C=s.END_SAME_AS_BEGIN({begin:/<<<[ \t]*'(\w+)'\n/,end:/[ \t]*(\w+)\b/}),L=`[ 	
]`,q={scope:"string",variants:[A,g,w,C]},$={scope:"number",variants:[{begin:"\\b0[bB][01]+(?:_[01]+)*\\b"},{begin:"\\b0[oO][0-7]+(?:_[0-7]+)*\\b"},{begin:"\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"},{begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"}],relevance:0},D=["false","null","true"],V=["__CLASS__","__DIR__","__FILE__","__FUNCTION__","__COMPILER_HALT_OFFSET__","__LINE__","__METHOD__","__NAMESPACE__","__TRAIT__","die","echo","exit","include","include_once","print","require","require_once","array","abstract","and","as","binary","bool","boolean","break","callable","case","catch","class","clone","const","continue","declare","default","do","double","else","elseif","empty","enddeclare","endfor","endforeach","endif","endswitch","endwhile","enum","eval","extends","final","finally","float","for","foreach","from","global","goto","if","implements","instanceof","insteadof","int","integer","interface","isset","iterable","list","match|0","mixed","new","never","object","or","private","protected","public","readonly","real","return","string","switch","throw","trait","try","unset","use","var","void","while","xor","yield"],X=["Error|0","AppendIterator","ArgumentCountError","ArithmeticError","ArrayIterator","ArrayObject","AssertionError","BadFunctionCallException","BadMethodCallException","CachingIterator","CallbackFilterIterator","CompileError","Countable","DirectoryIterator","DivisionByZeroError","DomainException","EmptyIterator","ErrorException","Exception","FilesystemIterator","FilterIterator","GlobIterator","InfiniteIterator","InvalidArgumentException","IteratorIterator","LengthException","LimitIterator","LogicException","MultipleIterator","NoRewindIterator","OutOfBoundsException","OutOfRangeException","OuterIterator","OverflowException","ParentIterator","ParseError","RangeException","RecursiveArrayIterator","RecursiveCachingIterator","RecursiveCallbackFilterIterator","RecursiveDirectoryIterator","RecursiveFilterIterator","RecursiveIterator","RecursiveIteratorIterator","RecursiveRegexIterator","RecursiveTreeIterator","RegexIterator","RuntimeException","SeekableIterator","SplDoublyLinkedList","SplFileInfo","SplFileObject","SplFixedArray","SplHeap","SplMaxHeap","SplMinHeap","SplObjectStorage","SplObserver","SplPriorityQueue","SplQueue","SplStack","SplSubject","SplTempFileObject","TypeError","UnderflowException","UnexpectedValueException","UnhandledMatchError","ArrayAccess","BackedEnum","Closure","Fiber","Generator","Iterator","IteratorAggregate","Serializable","Stringable","Throwable","Traversable","UnitEnum","WeakReference","WeakMap","Directory","__PHP_Incomplete_Class","parent","php_user_filter","self","static","stdClass"],te={keyword:V,literal:(ee=>{const z=[];return ee.forEach(se=>{z.push(se),se.toLowerCase()===se?z.push(se.toUpperCase()):z.push(se.toLowerCase())}),z})(D),built_in:X},Q=ee=>ee.map(z=>z.replace(/\|\d+$/,"")),U={variants:[{match:[/new/,e.concat(L,"+"),e.concat("(?!",Q(X).join("\\b|"),"\\b)"),n],scope:{1:"keyword",4:"title.class"}}]},le=e.concat(i,"\\b(?!\\()"),Z={variants:[{match:[e.concat(/::/,e.lookahead(/(?!class\b)/)),le],scope:{2:"variable.constant"}},{match:[/::/,/class/],scope:{2:"variable.language"}},{match:[n,e.concat(/::/,e.lookahead(/(?!class\b)/)),le],scope:{1:"title.class",3:"variable.constant"}},{match:[n,e.concat("::",e.lookahead(/(?!class\b)/))],scope:{1:"title.class"}},{match:[n,/::/,/class/],scope:{1:"title.class",3:"variable.language"}}]},K={scope:"attr",match:e.concat(i,e.lookahead(":"),e.lookahead(/(?!::)/))},Y={relevance:0,begin:/\(/,end:/\)/,keywords:te,contains:[K,a,Z,s.C_BLOCK_COMMENT_MODE,q,$,U]},ie={relevance:0,match:[/\b/,e.concat("(?!fn\\b|function\\b|",Q(V).join("\\b|"),"|",Q(X).join("\\b|"),"\\b)"),i,e.concat(L,"*"),e.lookahead(/(?=\()/)],scope:{3:"title.function.invoke"},contains:[Y]};Y.contains.push(ie);const B=[K,Z,s.C_BLOCK_COMMENT_MODE,q,$,U],F={begin:e.concat(/#\[\s*\\?/,e.either(n,o)),beginScope:"meta",end:/]/,endScope:"meta",keywords:{literal:D,keyword:["new","array"]},contains:[{begin:/\[/,end:/]/,keywords:{literal:D,keyword:["new","array"]},contains:["self",...B]},...B,{scope:"meta",variants:[{match:n},{match:o}]}]};return{case_insensitive:!1,keywords:te,contains:[F,s.HASH_COMMENT_MODE,s.COMMENT("//","$"),s.COMMENT("/\\*","\\*/",{contains:[{scope:"doctag",match:"@[A-Za-z]+"}]}),{match:/__halt_compiler\(\);/,keywords:"__halt_compiler",starts:{scope:"comment",end:s.MATCH_NOTHING_RE,contains:[{match:/\?>/,scope:"meta",endsParent:!0}]}},c,{scope:"variable.language",match:/\$this\b/},a,ie,Z,{match:[/const/,/\s/,i],scope:{1:"keyword",3:"variable.constant"}},U,{scope:"function",relevance:0,beginKeywords:"fn function",end:/[;{]/,excludeEnd:!0,illegal:"[$%\\[]",contains:[{beginKeywords:"use"},s.UNDERSCORE_TITLE_MODE,{begin:"=>",endsParent:!0},{scope:"params",begin:"\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0,keywords:te,contains:["self",F,a,Z,s.C_BLOCK_COMMENT_MODE,q,$]}]},{scope:"class",variants:[{beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{beginKeywords:"extends implements"},s.UNDERSCORE_TITLE_MODE]},{beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,contains:[s.inherit(s.UNDERSCORE_TITLE_MODE,{scope:"title.class"})]},{beginKeywords:"use",relevance:0,end:";",contains:[{match:/\b(as|const|function)\b/,scope:"keyword"},s.UNDERSCORE_TITLE_MODE]},q,$]}}function en(s){const e=s.regex,t="HTTP/([32]|1\\.[01])",i=/[A-Za-z][A-Za-z0-9-]*/,n={className:"attribute",begin:e.concat("^",i,"(?=\\:\\s)"),starts:{contains:[{className:"punctuation",begin:/: /,relevance:0,starts:{end:"$",relevance:0}}]}},o=[n,{begin:"\\n\\n",starts:{subLanguage:[],endsWithParent:!0}}];return{name:"HTTP",aliases:["https"],illegal:/\S/,contains:[{begin:"^(?="+t+" \\d{3})",end:/$/,contains:[{className:"meta",begin:t},{className:"number",begin:"\\b\\d{3}\\b"}],starts:{end:/\b\B/,illegal:/\S/,contains:o}},{begin:"(?=^[A-Z]+ (.*?) "+t+"$)",end:/$/,contains:[{className:"string",begin:" ",end:" ",excludeBegin:!0,excludeEnd:!0},{className:"meta",begin:t},{className:"keyword",begin:"[A-Z]+"}],starts:{end:/\b\B/,illegal:/\S/,contains:o}},s.inherit(n,{relevance:0})]}}function Re(s){return{name:"Plain text",aliases:["text","txt"],disableAutodetect:!0}}function tn(s){const e=s.regex;return{name:"Diff",aliases:["patch"],contains:[{className:"meta",relevance:10,match:e.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)},{className:"comment",variants:[{begin:e.either(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,end:/$/}]}}R.registerLanguage("javascript",xt);R.registerLanguage("js",xt);R.registerLanguage("css",Xi);R.registerLanguage("html",ke);R.registerLanguage("xml",ke);R.registerLanguage("xhtml",ke);R.registerLanguage("svg",ke);R.registerLanguage("markup",ke);R.registerLanguage("json",Qi);R.registerLanguage("yaml",Et);R.registerLanguage("yml",Et);R.registerLanguage("php",Yi);R.registerLanguage("http",en);R.registerLanguage("plaintext",Re);R.registerLanguage("text",Re);R.registerLanguage("txt",Re);R.registerLanguage("csv",Re);R.registerLanguage("diff",tn);class nn extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._codeContent=null,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this),this._observer=null,this._highlighted=!1}connectedCallback(){this._codeContent=this.textContent,this.hasAttribute("lazy")?(this.renderPlaceholder(),this._setupLazyObserver()):this.render()}disconnectedCallback(){this._observer&&(this._observer.disconnect(),this._observer=null),document.removeEventListener("click",this._handleOutsideClick)}_setupLazyObserver(){this._observer||(this._observer=new IntersectionObserver(e=>{e[0].isIntersecting&&!this._highlighted&&(this._highlighted=!0,this.render(),this._observer.disconnect(),this._observer=null)},{rootMargin:"100px"}),this._observer.observe(this))}static get observedAttributes(){return["language","label","theme","show-lines","filename","highlight-lines","collapsed","max-lines","max-height","wrap","copy-text","copied-text","show-share","show-download","lazy"]}attributeChangedCallback(e,t,i){this.shadowRoot&&t!==i&&this.render()}get language(){return this.getAttribute("language")||"plaintext"}get label(){return this.getAttribute("label")||this.filename||this.language.toUpperCase()}get theme(){return this.getAttribute("theme")||"light"}get showLines(){return this.hasAttribute("show-lines")}get filename(){return this.getAttribute("filename")||""}get highlightLines(){const e=this.getAttribute("highlight-lines");if(!e)return new Set;const t=new Set,i=e.split(",");for(const n of i){const o=n.trim();if(o.includes("-")){const[a,c]=o.split("-").map(Number);for(let h=a;h<=c;h++)t.add(h)}else t.add(Number(o))}return t}get collapsed(){return this.hasAttribute("collapsed")}get maxLines(){const e=this.getAttribute("max-lines");return e?parseInt(e,10):10}get maxHeight(){return this.getAttribute("max-height")||""}get wrap(){return this.hasAttribute("wrap")}get copyText(){return this.getAttribute("copy-text")||"Copy"}get copiedText(){return this.getAttribute("copied-text")||"Copied!"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get lazy(){return this.hasAttribute("lazy")}async copyCode(){const e=(this._codeContent||this.textContent).trim(),t=document.createElement("div");t.innerHTML=e;const i=t.textContent,n=this.shadowRoot.querySelector(".copy-button"),o=this.copyText,a=this.copiedText;try{await navigator.clipboard.writeText(i),n.textContent=a,n.classList.add("copied"),n.setAttribute("aria-label","Code copied to clipboard")}catch(c){console.error("Failed to copy code:",c),n.textContent="Failed",n.classList.add("failed"),n.setAttribute("aria-label","Failed to copy code")}setTimeout(()=>{n.textContent=o,n.classList.remove("copied","failed"),n.setAttribute("aria-label","Copy code to clipboard")},2e3)}downloadCode(){const e=this.getCode(),t=this.filename||`code.${this._getFileExtension()}`,i=new Blob([e],{type:"text/plain"}),n=URL.createObjectURL(i),o=document.createElement("a");o.href=n,o.download=t,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(n)}_getFileExtension(){return{javascript:"js",js:"js",typescript:"ts",ts:"ts",html:"html",markup:"html",css:"css",json:"json",yaml:"yml",yml:"yml",php:"php",xml:"xml",xhtml:"xhtml",svg:"svg",http:"http",diff:"diff",csv:"csv",plaintext:"txt",text:"txt",txt:"txt"}[this.language]||"txt"}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;const e=this.shadowRoot.querySelector(".share-menu"),t=this.shadowRoot.querySelector(".share-button");this._showShareMenu?(e.style.display="block",t.classList.add("active"),setTimeout(()=>{document.addEventListener("click",this._handleOutsideClick)},0)):(e.style.display="none",t.classList.remove("active"),document.removeEventListener("click",this._handleOutsideClick))}_handleOutsideClick(e){const t=this.shadowRoot.querySelector(".share-menu");t&&!t.contains(e.target)&&this.toggleShareMenu()}async shareViaWebAPI(){if(!navigator.share)return;const e=this.getCode(),t=this.filename||this.label;try{await navigator.share({title:t,text:e}),this.toggleShareMenu()}catch(i){i.name!=="AbortError"&&console.error("Error sharing:",i)}}openInCodePen(){const e=this.getCode(),t=this.language;let i={title:this.filename||this.label||"Code Block Demo",description:"Code shared from code-block component",editors:"111"};["html","markup","xhtml","xml","svg"].includes(t)?(i.html=e,i.editors="100"):t==="css"?(i.css=e,i.editors="010"):["javascript","js"].includes(t)?(i.js=e,i.editors="001"):(i.html=`<pre><code>${this.escapeHtml(e)}</code></pre>`,i.editors="100");const n=document.createElement("form");n.action="https://codepen.io/pen/define",n.method="POST",n.target="_blank";const o=document.createElement("input");o.type="hidden",o.name="data",o.value=JSON.stringify(i),n.appendChild(o),document.body.appendChild(n),n.submit(),document.body.removeChild(n),this.toggleShareMenu()}getStyles(){const e=this.theme==="dark";return`
      :host {
        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        background: var(--cb-bg, ${e?"#0d1117":"#f6f8fa"});
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--cb-header-bg, ${e?"#161b22":"#e1e4e8"});
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#d1d5da"});
        gap: 1rem;
      }

      .label-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        flex: 1;
      }

      .label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--cb-label-color, ${e?"#8b949e":"#586069"});
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .filename {
        font-size: 0.8rem;
        color: var(--cb-filename-color, ${e?"#c9d1d9":"#24292e"});
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
      }

      .copy-button {
        background: var(--cb-button-bg, ${e?"#21262d":"#fff"});
        border: 1px solid var(--cb-button-border, ${e?"#30363d":"#d1d5da"});
        border-radius: 4px;
        padding: 4px 12px;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--cb-button-color, ${e?"#c9d1d9":"#24292e"});
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        flex-shrink: 0;
      }

      .copy-button:hover {
        background: var(--cb-button-hover-bg, ${e?"#30363d":"#f3f4f6"});
        border-color: ${e?"#8b949e":"#959da5"};
      }

      .copy-button:focus {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0366d6"});
        outline-offset: 2px;
      }

      .copy-button:active {
        transform: scale(0.98);
      }

      .copy-button.copied {
        background: var(--cb-success-color, #238636);
        color: white;
        border-color: var(--cb-success-color, #238636);
      }

      .copy-button.failed {
        background: var(--cb-error-color, #da3633);
        color: white;
        border-color: var(--cb-error-color, #da3633);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .action-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        transition: all 0.15s ease;
        border-radius: 4px;
      }

      .action-button:hover {
        color: var(--cb-button-color, ${e?"#c9d1d9":"#24292e"});
        background: ${e?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.05)"};
      }

      .action-button:active {
        transform: scale(0.95);
      }

      .action-button.active {
        color: var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        background: ${e?"rgba(56, 139, 253, 0.15)":"rgba(9, 105, 218, 0.1)"};
      }

      .action-button svg {
        width: 16px;
        height: 16px;
      }

      .share-container {
        position: relative;
        display: inline-block;
      }

      .share-menu {
        display: none;
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        background: var(--cb-header-bg, ${e?"#161b22":"#f6f8fa"});
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 160px;
        z-index: 1000;
        overflow: hidden;
      }

      .share-menu-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: none;
        border: none;
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        font-size: 0.8125rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .share-menu-item:last-child {
        border-bottom: none;
      }

      .share-menu-item:hover {
        background: ${e?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)"};
      }

      .share-menu-item:active {
        background: ${e?"rgba(56, 139, 253, 0.15)":"rgba(9, 105, 218, 0.1)"};
      }

      .share-menu-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .code-container {
        display: flex;
        overflow-x: auto;
        background: var(--cb-code-bg, ${e?"#0d1117":"#fff"});
      }

      .line-numbers {
        padding: 1rem 0;
        text-align: right;
        user-select: none;
        background: var(--cb-line-numbers-bg, ${e?"#161b22":"#f6f8fa"});
        border-right: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        color: var(--cb-line-numbers-color, ${e?"#484f58":"#959da5"});
        line-height: 1.6;
        flex-shrink: 0;
      }

      .line-numbers span {
        display: block;
        padding: 0 0.75rem;
        min-width: 2.5rem;
      }

      .line-numbers span.highlighted {
        background: var(--cb-highlight-gutter, ${e?"rgba(136, 192, 208, 0.15)":"rgba(255, 235, 59, 0.3)"});
        color: var(--cb-line-numbers-highlight-color, ${e?"#c9d1d9":"#24292e"});
      }

      pre {
        margin: 0;
        padding: 0;
        flex: 1;
        overflow-x: auto;
      }

      code {
        display: block;
        font-family: inherit;
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        background: transparent;
        padding: 1rem;
      }

      .code-line {
        display: block;
        line-height: 1.6;
        padding: 0 0.5rem;
        margin: 0 -0.5rem;
        white-space: pre;
      }

      .code-line.highlighted {
        background: var(--cb-highlight-bg, ${e?"rgba(136, 192, 208, 0.15)":"rgba(255, 235, 59, 0.3)"});
        border-left: 3px solid var(--cb-highlight-border, ${e?"#58a6ff":"#f9a825"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      /* highlight.js theme - GitHub style with CSS custom properties */
      .hljs-comment,
      .hljs-quote {
        color: var(--cb-comment, ${e?"#8b949e":"#6a737d"});
        font-style: italic;
      }

      .hljs-keyword,
      .hljs-selector-tag,
      .hljs-addition {
        color: var(--cb-keyword, ${e?"#ff7b72":"#d73a49"});
      }

      .hljs-number,
      .hljs-literal,
      .hljs-doctag,
      .hljs-regexp {
        color: var(--cb-number, ${e?"#79c0ff":"#005cc5"});
      }

      .hljs-string,
      .hljs-meta .hljs-meta-string {
        color: var(--cb-string, ${e?"#a5d6ff":"#22863a"});
      }

      .hljs-title,
      .hljs-section,
      .hljs-name,
      .hljs-selector-id,
      .hljs-selector-class {
        color: var(--cb-function, ${e?"#d2a8ff":"#6f42c1"});
      }

      .hljs-attribute,
      .hljs-attr,
      .hljs-variable,
      .hljs-template-variable,
      .hljs-class .hljs-title,
      .hljs-type {
        color: var(--cb-attribute, ${e?"#79c0ff":"#005cc5"});
      }

      .hljs-symbol,
      .hljs-bullet,
      .hljs-subst,
      .hljs-meta,
      .hljs-meta .hljs-keyword,
      .hljs-selector-attr,
      .hljs-selector-pseudo,
      .hljs-link {
        color: var(--cb-meta, ${e?"#ffa657":"#e36209"});
      }

      .hljs-built_in,
      .hljs-deletion {
        color: var(--cb-builtin, ${e?"#ffa198":"#d73a49"});
      }

      .hljs-tag {
        color: var(--cb-tag, ${e?"#7ee787":"#22863a"});
      }

      .hljs-tag .hljs-name {
        color: var(--cb-tag, ${e?"#7ee787":"#22863a"});
      }

      .hljs-tag .hljs-attr {
        color: var(--cb-attribute, ${e?"#79c0ff":"#005cc5"});
      }

      .hljs-emphasis {
        font-style: italic;
      }

      .hljs-strong {
        font-weight: bold;
      }

      /* Diff support - added/removed lines */
      .code-line.diff-add {
        background: var(--cb-diff-add-bg, ${e?"rgba(46, 160, 67, 0.2)":"rgba(46, 160, 67, 0.15)"});
        border-left: 3px solid var(--cb-diff-add-border, ${e?"#3fb950":"#22863a"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      .code-line.diff-remove {
        background: var(--cb-diff-remove-bg, ${e?"rgba(248, 81, 73, 0.2)":"rgba(248, 81, 73, 0.15)"});
        border-left: 3px solid var(--cb-diff-remove-border, ${e?"#f85149":"#cb2431"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      .line-numbers span.diff-add {
        background: var(--cb-diff-add-gutter, ${e?"rgba(46, 160, 67, 0.15)":"rgba(46, 160, 67, 0.1)"});
        color: var(--cb-diff-add-color, ${e?"#3fb950":"#22863a"});
      }

      .line-numbers span.diff-remove {
        background: var(--cb-diff-remove-gutter, ${e?"rgba(248, 81, 73, 0.15)":"rgba(248, 81, 73, 0.1)"});
        color: var(--cb-diff-remove-color, ${e?"#f85149":"#cb2431"});
      }

      .hljs-addition {
        color: var(--cb-diff-add-text, ${e?"#3fb950":"#22863a"});
        background: transparent;
      }

      .hljs-deletion {
        color: var(--cb-diff-remove-text, ${e?"#f85149":"#cb2431"});
        background: transparent;
      }

      /* Collapsible code blocks */
      :host([collapsed]) .code-container {
        position: relative;
      }

      :host([collapsed]) .code-container::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: linear-gradient(transparent, var(--cb-code-bg, ${e?"#0d1117":"#fff"}));
        pointer-events: none;
      }

      :host([collapsed]) pre {
        overflow: hidden;
      }

      :host([collapsed]) code {
        display: block;
        overflow: hidden;
      }

      .expand-button {
        display: none;
        width: 100%;
        padding: 0.5rem 1rem;
        background: var(--cb-expand-bg, ${e?"#161b22":"#f6f8fa"});
        border: none;
        border-top: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        color: var(--cb-expand-color, ${e?"#58a6ff":"#0366d6"});
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        transition: background 0.2s;
      }

      .expand-button:hover {
        background: var(--cb-expand-hover-bg, ${e?"#21262d":"#e1e4e8"});
      }

      .expand-button:focus {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0366d6"});
        outline-offset: -2px;
      }

      :host([collapsed]) .expand-button,
      :host([data-expandable]) .expand-button {
        display: block;
      }

      /* Max height with scroll */
      :host([max-height]) .code-container {
        max-height: var(--cb-max-height);
        overflow-y: auto;
      }

      :host([max-height]) .code-container::-webkit-scrollbar {
        width: 8px;
      }

      :host([max-height]) .code-container::-webkit-scrollbar-track {
        background: var(--cb-scrollbar-track, ${e?"#161b22":"#f6f8fa"});
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, ${e?"#30363d":"#d1d5da"});
        border-radius: 4px;
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb:hover {
        background: var(--cb-scrollbar-thumb-hover, ${e?"#484f58":"#959da5"});
      }

      /* Word wrap option */
      :host([wrap]) code {
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: break-word;
      }

      :host([wrap]) .code-line {
        white-space: pre-wrap;
        word-break: break-word;
      }
    `}renderPlaceholder(){const e=(this._codeContent||this.textContent).trim(),t=e.split(`
`),i=this.escapeHtml(e).split(`
`).map(c=>`<span class="code-line">${c||" "}</span>`).join(""),n=this.showLines?`<div class="line-numbers" aria-hidden="true">${t.map((c,h)=>`<span>${h+1}</span>`).join("")}</div>`:"",o=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`;this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${o}
        </div>
        <div class="header-actions">
          <button class="copy-button" aria-label="${this.copyText}">${this.copyText}</button>
        </div>
      </div>
      <div class="code-wrapper">
        <div class="code-container">
          ${n}
          <pre><code class="hljs">${i}</code></pre>
        </div>
      </div>
    `;const a=this.shadowRoot.querySelector(".copy-button");a&&a.addEventListener("click",()=>this.copyCode())}render(){const e=(this._codeContent||this.textContent).trim(),t=e.split(`
`),i=this.highlightLines,n=this.language==="diff";let o;try{this.language&&this.language!=="plaintext"&&this.language!=="text"&&this.language!=="txt"?o=R.highlight(e,{language:this.language,ignoreIllegals:!0}).value:o=this.escapeHtml(e)}catch{o=this.escapeHtml(e)}const a=o.split(`
`),c=a.map((Z,K)=>{const Y=K+1,ie=i.has(Y),B=["code-line"];if(ie&&B.push("highlighted"),n){const F=t[K]||"";F.startsWith("+")&&!F.startsWith("+++")?B.push("diff-add"):F.startsWith("-")&&!F.startsWith("---")&&B.push("diff-remove")}return`<span class="${B.join(" ")}">${Z||" "}</span>`}).join(""),h=this.showLines?`<div class="line-numbers" aria-hidden="true">${a.map((Z,K)=>{const Y=K+1,ie=i.has(Y),B=[];if(ie&&B.push("highlighted"),n){const F=t[K]||"";F.startsWith("+")&&!F.startsWith("+++")?B.push("diff-add"):F.startsWith("-")&&!F.startsWith("---")&&B.push("diff-remove")}return`<span class="${B.join(" ")}">${Y}</span>`}).join("")}</div>`:"",g=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`,A=this.hasAttribute("collapsed")||this.hasAttribute("max-lines"),w=a.length,C=this.maxLines,L=A&&w>C,q=this.collapsed,$=q?`calc(${C} * 1.6em + 2rem)`:"none",D=this.maxHeight?`--cb-max-height: ${this.maxHeight};`:"",V=q?`max-height: ${$};`:"";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${g}
        </div>
        <div class="header-actions">
          ${this.showShare?`
            <div class="share-container">
              <button class="action-button share-button" title="Share code">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 12V3M8 3L5 6M8 3l3 3"/>
                  <path d="M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9"/>
                </svg>
              </button>
              <div class="share-menu">
                ${typeof navigator<"u"&&navigator.share?`
                  <button class="share-menu-item share-native">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="4" r="2"/>
                      <circle cx="4" cy="8" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M6 9l4 2M6 7l4-2"/>
                    </svg>
                    Share...
                  </button>
                `:""}
                <button class="share-menu-item share-codepen">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L0 5v6l8 5 8-5V5L8 0zM7 10.5L2 7.5v-2l5 3v2zm1-3l-5-3L8 2l5 2.5-5 3zm1 3v-2l5-3v2l-5 3z"/>
                  </svg>
                  Open in CodePen
                </button>
              </div>
            </div>
          `:""}
          ${this.showDownload?`
            <button class="action-button download-button" title="Download code">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 1v10M8 11l-3-3M8 11l3-3"/>
                <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
              </svg>
            </button>
          `:""}
          <button class="copy-button"
                  aria-label="Copy code to clipboard"
                  title="Copy code">${this.escapeHtml(this.copyText)}</button>
        </div>
      </div>
      <div class="code-container" role="region" aria-labelledby="code-label" style="${D}${V}">
        ${h}
        <pre><code class="language-${this.language}" tabindex="0">${c}</code></pre>
      </div>
      ${L?`
        <button class="expand-button" aria-expanded="${!q}">
          ${q?`Show all ${w} lines`:"Show less"}
        </button>
      `:""}
    `,L?this.setAttribute("data-expandable",""):this.removeAttribute("data-expandable"),this.shadowRoot.querySelector(".copy-button").addEventListener("click",()=>this.copyCode());const X=this.shadowRoot.querySelector(".expand-button");X&&X.addEventListener("click",()=>this.toggleCollapsed());const te=this.shadowRoot.querySelector(".share-button");te&&te.addEventListener("click",Z=>{Z.stopPropagation(),this.toggleShareMenu()});const Q=this.shadowRoot.querySelector(".share-native");Q&&Q.addEventListener("click",()=>this.shareViaWebAPI());const U=this.shadowRoot.querySelector(".share-codepen");U&&U.addEventListener("click",()=>this.openInCodePen());const le=this.shadowRoot.querySelector(".download-button");le&&le.addEventListener("click",()=>this.downloadCode())}toggleCollapsed(){this.collapsed?this.removeAttribute("collapsed"):this.setAttribute("collapsed","")}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}setCode(e){this._codeContent=e,this.render()}getCode(){return(this._codeContent||this.textContent).trim()}static getSupportedLanguages(){return R.listLanguages()}}customElements.define("code-block",nn);class sn extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._activeIndex=0,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this)}connectedCallback(){requestAnimationFrame(()=>{this.render(),this.setupEventListeners()})}disconnectedCallback(){document.removeEventListener("click",this._handleOutsideClick)}static get observedAttributes(){return["theme","show-share","show-download"]}attributeChangedCallback(e,t,i){this.shadowRoot&&t!==i&&this.render()}get theme(){return this.getAttribute("theme")||"light"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get codeBlocks(){return Array.from(this.querySelectorAll("code-block"))}get activeIndex(){return this._activeIndex}set activeIndex(e){const t=this.codeBlocks;e>=0&&e<t.length&&(this._activeIndex=e,this.updateActiveTab())}getStyles(){const e=this.theme==="dark";return`
      :host {
        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        background: var(--cb-bg, ${e?"#0d1117":"#f6f8fa"});
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .tabs {
        display: flex;
        background: var(--cb-header-bg, ${e?"#161b22":"#f6f8fa"});
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        overflow-x: auto;
        scrollbar-width: thin;
      }

      .tabs::-webkit-scrollbar {
        height: 4px;
      }

      .tabs::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, ${e?"#30363d":"#d1d5da"});
        border-radius: 2px;
      }

      .tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: color 0.15s, border-color 0.15s, background 0.15s;
      }

      .tab:hover {
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        background: ${e?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)"};
      }

      .tab:focus-visible {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        outline-offset: -2px;
      }

      .tab[aria-selected="true"] {
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        border-bottom-color: var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        background: var(--cb-code-bg, ${e?"#0d1117":"#fff"});
      }

      .language-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        background: ${e?"rgba(110, 118, 129, 0.4)":"rgba(175, 184, 193, 0.4)"};
        border-radius: 4px;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .content {
        position: relative;
      }

      ::slotted(code-block) {
        display: none !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
      }

      ::slotted(code-block.active) {
        display: block !important;
      }

      /* Header with tabs and actions */
      .header {
        display: flex;
        align-items: stretch;
        background: var(--cb-header-bg, ${e?"#161b22":"#f6f8fa"});
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
      }

      .tabs {
        border-bottom: none;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-left: auto;
        padding: 0 0.5rem;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .action-button:hover {
        background: ${e?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"};
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
      }

      .action-button:focus-visible {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        outline-offset: 1px;
      }

      .action-button svg {
        width: 16px;
        height: 16px;
      }

      .share-container {
        position: relative;
      }

      .share-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        min-width: 140px;
        padding: 0.25rem 0;
        background: var(--cb-bg, ${e?"#21262d":"#fff"});
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        border-radius: 6px;
        box-shadow: 0 8px 24px ${e?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.12)"};
        z-index: 100;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity 0.15s, visibility 0.15s, transform 0.15s;
      }

      .share-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .share-menu-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        font-family: inherit;
        font-size: 0.8125rem;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s;
      }

      .share-menu-item:hover {
        background: ${e?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"};
      }

      .share-menu-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
    `}render(){const e=this.codeBlocks;if(e.length===0)return;e.forEach((n,o)=>{n.setAttribute("theme",this.theme),o===this._activeIndex?n.classList.add("active"):n.classList.remove("active")});const t=e.map((n,o)=>{const a=n.getAttribute("filename"),c=n.getAttribute("label"),h=n.getAttribute("language")||"plaintext",g=a||c||h.toUpperCase(),A=o===this._activeIndex;return`
        <button
          class="tab"
          role="tab"
          aria-selected="${A}"
          aria-controls="panel-${o}"
          tabindex="${A?"0":"-1"}"
          data-index="${o}"
        >
          <span class="tab-label">${this.escapeHtml(g)}</span>
          ${a?`<span class="language-badge">${h}</span>`:""}
        </button>
      `}).join(""),i=this.showShare||this.showDownload?`
      <div class="header-actions">
        ${this.showDownload?`
          <button class="action-button download-button" aria-label="Download code" title="Download">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
              <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
            </svg>
          </button>
        `:""}
        ${this.showShare?`
          <div class="share-container">
            <button class="action-button share-button" aria-label="Share code" title="Share" aria-haspopup="true" aria-expanded="${this._showShareMenu}">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15 3a3 3 0 0 1-5.175 2.066l-3.92 2.179a3.005 3.005 0 0 1 0 1.51l3.92 2.179a3 3 0 1 1-.73 1.31l-3.92-2.178a3 3 0 1 1 0-4.133l3.92-2.178A3 3 0 1 1 15 3Zm-1.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm-9-5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
              </svg>
            </button>
            <div class="share-menu ${this._showShareMenu?"open":""}" role="menu">
              ${typeof navigator<"u"&&navigator.share?`
                <button class="share-menu-item web-share-button" role="menuitem">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15 3a3 3 0 0 1-5.175 2.066l-3.92 2.179a3.005 3.005 0 0 1 0 1.51l3.92 2.179a3 3 0 1 1-.73 1.31l-3.92-2.178a3 3 0 1 1 0-4.133l3.92-2.178A3 3 0 1 1 15 3Zm-1.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm-9-5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
                  </svg>
                  Share...
                </button>
              `:""}
              <button class="share-menu-item codepen-button" role="menuitem">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L0 5.333v5.334L8 16l8-5.333V5.333L8 0zm5.714 9.703L8 13.297l-5.714-3.594V6.297L8 2.703l5.714 3.594v3.406z"/>
                  <path d="M8 4.703L4.286 7.5 8 10.297 11.714 7.5 8 4.703z"/>
                </svg>
                Open in CodePen
              </button>
            </div>
          </div>
        `:""}
      </div>
    `:"";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="tabs" role="tablist" aria-label="Code files">
          ${t}
        </div>
        ${i}
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `}setupEventListeners(){const e=this.shadowRoot.querySelector(".tabs");if(!e)return;e.addEventListener("click",a=>{const c=a.target.closest(".tab");if(c){const h=parseInt(c.dataset.index,10);this.activeIndex=h}}),e.addEventListener("keydown",a=>{const c=this.shadowRoot.querySelectorAll(".tab"),h=this._activeIndex;let g=h;switch(a.key){case"ArrowLeft":g=h>0?h-1:c.length-1;break;case"ArrowRight":g=h<c.length-1?h+1:0;break;case"Home":g=0;break;case"End":g=c.length-1;break;default:return}a.preventDefault(),this.activeIndex=g,c[g].focus()});const t=this.shadowRoot.querySelector(".download-button");t&&t.addEventListener("click",()=>this.downloadCode());const i=this.shadowRoot.querySelector(".share-button");i&&i.addEventListener("click",a=>{a.stopPropagation(),this.toggleShareMenu()});const n=this.shadowRoot.querySelector(".web-share-button");n&&n.addEventListener("click",()=>{this.shareViaWebAPI(),this.toggleShareMenu()});const o=this.shadowRoot.querySelector(".codepen-button");o&&o.addEventListener("click",()=>{this.openInCodePen(),this.toggleShareMenu()})}updateActiveTab(){const e=this.shadowRoot.querySelectorAll(".tab"),t=this.codeBlocks;e.forEach((i,n)=>{const o=n===this._activeIndex;i.setAttribute("aria-selected",o),i.setAttribute("tabindex",o?"0":"-1")}),t.forEach((i,n)=>{n===this._activeIndex?i.classList.add("active"):i.classList.remove("active")}),this.dispatchEvent(new CustomEvent("tab-change",{detail:{index:this._activeIndex,block:t[this._activeIndex]},bubbles:!0}))}escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}selectTab(e){this.activeIndex=e}getActiveBlock(){return this.codeBlocks[this._activeIndex]}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;const e=this.shadowRoot.querySelector(".share-menu"),t=this.shadowRoot.querySelector(".share-button");e&&e.classList.toggle("open",this._showShareMenu),t&&t.setAttribute("aria-expanded",this._showShareMenu),this._showShareMenu?document.addEventListener("click",this._handleOutsideClick):document.removeEventListener("click",this._handleOutsideClick)}_handleOutsideClick(e){const t=this.shadowRoot.querySelector(".share-container");if(t&&!e.composedPath().includes(t)){this._showShareMenu=!1;const i=this.shadowRoot.querySelector(".share-menu"),n=this.shadowRoot.querySelector(".share-button");i&&i.classList.remove("open"),n&&n.setAttribute("aria-expanded","false"),document.removeEventListener("click",this._handleOutsideClick)}}downloadCode(){const e=this.getActiveBlock();e&&typeof e.downloadCode=="function"&&e.downloadCode()}openInCodePen(){const e=this.codeBlocks;if(e.length===0)return;let t="",i="",n="",o="Code Block Group";e.forEach(A=>{const w=A.language,C=A.getCode(),L=A.filename;["html","markup","xhtml","xml","svg"].includes(w)?(t&&(t+=`

`),L&&(t+=`<!-- ${L} -->
`),t+=C):w==="css"?(i&&(i+=`

`),L&&(i+=`/* ${L} */
`),i+=C):["javascript","js"].includes(w)&&(n&&(n+=`

`),L&&(n+=`// ${L}
`),n+=C),(!o||o==="Code Block Group")&&(o=L||A.label||"Code Block Group")});let a="";a+=t?"1":"0",a+=i?"1":"0",a+=n?"1":"0";const c={title:o,description:"Code shared from code-block-group component",html:t,css:i,js:n,editors:a},h=document.createElement("form");h.action="https://codepen.io/pen/define",h.method="POST",h.target="_blank";const g=document.createElement("input");g.type="hidden",g.name="data",g.value=JSON.stringify(c),h.appendChild(g),document.body.appendChild(h),h.submit(),document.body.removeChild(h)}async shareViaWebAPI(){if(!navigator.share)return;const e=this.codeBlocks;if(e.length===0)return;let t="";e.forEach(i=>{const n=i.filename||i.label||i.language,o=i.getCode();t&&(t+=`

`),t+=`// === ${n} ===
${o}`});try{await navigator.share({title:"Code from code-block-group",text:t})}catch(i){i.name!=="AbortError"&&console.error("Share failed:",i)}}}customElements.define("code-block-group",sn);var rn=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.isMinimized=!1,this.isMaximized=!1,this.overlay=null,this.showSource=!1,this.sourceCode="",this.showShareMenu=!1,this.handleKeydown=this.handleKeydown.bind(this),this.handleOutsideClick=this.handleOutsideClick.bind(this)}async connectedCallback(){this.render(),this.attachEventListeners(),this.src&&await this.fetchSourceCode()}disconnectedCallback(){this.removeOverlay(),document.removeEventListener("keydown",this.handleKeydown),document.removeEventListener("click",this.handleOutsideClick)}static get observedAttributes(){return["url","title","mode","shadow","src"]}attributeChangedCallback(){this.shadowRoot&&(this.render(),this.attachEventListeners())}get url(){return this.getAttribute("url")||""}get src(){return this.getAttribute("src")||""}get browserTitle(){return this.getAttribute("title")||this.getHostname()}get mode(){return this.getAttribute("mode")||"light"}get hasShadow(){return this.hasAttribute("shadow")}getHostname(){try{return new URL(this.url).hostname}catch{return this.url}}attachEventListeners(){const s=this.shadowRoot.querySelector(".control-button.close"),e=this.shadowRoot.querySelector(".control-button.minimize"),t=this.shadowRoot.querySelector(".control-button.maximize"),i=this.shadowRoot.querySelector(".view-source-button"),n=this.shadowRoot.querySelector(".copy-source-button"),o=this.shadowRoot.querySelector(".share-button"),a=this.shadowRoot.querySelector(".browser-header");s?.addEventListener("click",()=>this.handleClose()),e?.addEventListener("click",()=>this.toggleMinimize()),t?.addEventListener("click",()=>this.toggleMaximize()),i?.addEventListener("click",()=>this.toggleViewSource()),n?.addEventListener("click",()=>this.copySourceCode()),o?.addEventListener("click",h=>{h.stopPropagation(),this.toggleShareMenu()}),a?.addEventListener("dblclick",h=>{const g=h.target;(g.classList.contains("browser-header")||g.classList.contains("controls"))&&this.toggleMaximize()}),this.shadowRoot.querySelector("iframe")?.addEventListener("error",()=>this.handleIframeError())}handleIframeError(){const s=this.shadowRoot.querySelector(".browser-content");s&&(s.innerHTML=`
      <div class="error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Failed to load content</p>
        <button class="retry-button" onclick="this.getRootNode().host.retryLoad()">Retry</button>
      </div>
    `)}retryLoad(){const s=this.shadowRoot.querySelector(".browser-content");if(!s||!this.src)return;s.innerHTML=`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`,s.querySelector("iframe")?.addEventListener("error",()=>this.handleIframeError())}async fetchSourceCode(){if(this.src)try{const s=await fetch(this.src);s.ok&&(this.sourceCode=await s.text())}catch(s){console.error("Failed to fetch source code:",s),this.sourceCode="// Failed to load source code"}}toggleViewSource(){this.showSource=!this.showSource,this.updateContentView()}updateContentView(){const s=this.shadowRoot.querySelector(".browser-content"),e=this.shadowRoot.querySelector(".view-source-button");s&&(this.showSource?(s.innerHTML=`
        <div class="source-view">
          <div class="source-header">
            <span class="source-label">Source Code</span>
            <button class="copy-source-button" title="Copy source code">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1"/>
                <path d="M3 11V3a1 1 0 011-1h8"/>
              </svg>
              Copy
            </button>
          </div>
          <pre><code>${this.escapeHtml(this.sourceCode)}</code></pre>
        </div>
      `,e.classList.add("active"),s.querySelector(".copy-source-button")?.addEventListener("click",()=>this.copySourceCode())):(this.src?s.innerHTML=`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`:s.innerHTML="<slot></slot>",e.classList.remove("active")))}async copySourceCode(){if(this.sourceCode)try{await navigator.clipboard.writeText(this.sourceCode);const s=this.shadowRoot.querySelector(".copy-source-button");if(s){const e=s.innerHTML;s.innerHTML=`
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3,8 6,11 13,4"/>
          </svg>
          Copied!
        `,s.classList.add("copied"),setTimeout(()=>{s.innerHTML=e,s.classList.remove("copied")},2e3)}}catch(s){console.error("Failed to copy source code:",s)}}toggleShareMenu(){this.showShareMenu=!this.showShareMenu;const s=this.shadowRoot.querySelector(".share-menu"),e=this.shadowRoot.querySelector(".share-button");this.showShareMenu?(s.style.display="block",e.classList.add("active"),setTimeout(()=>{document.addEventListener("click",this.handleOutsideClick)},0)):(s.style.display="none",e.classList.remove("active"),document.removeEventListener("click",this.handleOutsideClick))}handleOutsideClick(s){const e=this.shadowRoot.querySelector(".share-menu");e&&!e.contains(s.target)&&this.toggleShareMenu()}async shareViaWebAPI(){if(!navigator.share){console.warn("Web Share API not supported");return}const s={title:this.browserTitle||"CSS Demo",text:`Check out this CSS demo: ${this.browserTitle}`,url:this.src||this.url};try{await navigator.share(s),this.toggleShareMenu()}catch(e){e.name!=="AbortError"&&console.error("Error sharing:",e)}}parseHTMLForCodePen(){if(!this.sourceCode)return null;const e=new DOMParser().parseFromString(this.sourceCode,"text/html"),t=Array.from(e.querySelectorAll("style")).map(a=>a.textContent).join(`

`),i=Array.from(e.querySelectorAll("script")).filter(a=>!a.src&&a.type!=="module").map(a=>a.textContent).join(`

`),n=e.body.cloneNode(!0);return n.querySelectorAll("script, style").forEach(a=>a.remove()),{html:n.innerHTML.trim(),css:t.trim(),js:i.trim()}}openInCodePen(){const s=this.parseHTMLForCodePen();if(!s)return;const e={title:this.browserTitle||"CSS Demo",description:`Demo from ${this.url}`,html:s.html,css:s.css,js:s.js,editors:"110"},t=document.createElement("form");t.action="https://codepen.io/pen/define",t.method="POST",t.target="_blank";const i=document.createElement("input");i.type="hidden",i.name="data",i.value=JSON.stringify(e),t.appendChild(i),document.body.appendChild(t),t.submit(),document.body.removeChild(t),this.toggleShareMenu()}handleClose(){this.isMaximized&&this.toggleMaximize()}handleKeydown(s){s.key==="Escape"&&(this.showShareMenu?this.toggleShareMenu():this.isMaximized&&this.toggleMaximize())}createOverlay(){if(this.overlay)return;this.overlay=document.createElement("div"),this.overlay.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      cursor: pointer;
      animation: fadeIn 200ms ease;
    `;const s=document.createElement("style");s.textContent=`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,document.head.appendChild(s),this.overlay.addEventListener("click",()=>this.toggleMaximize()),document.body.appendChild(this.overlay),document.addEventListener("keydown",this.handleKeydown)}removeOverlay(){this.overlay&&(this.overlay.remove(),this.overlay=null),document.removeEventListener("keydown",this.handleKeydown)}toggleMinimize(){const s=this.shadowRoot.querySelector(".browser-content");s&&(this.isMinimized=!this.isMinimized,this.isMinimized?(this.isMaximized&&this.toggleMaximize(),s.style.display="none"):s.style.display="block")}toggleMaximize(){const s=this.shadowRoot.querySelector(".control-button.maximize");if(this.isMaximized){this.classList.remove("browser-window-maximized"),this.removeAttribute("role"),this.removeAttribute("aria-modal");const e=this.shadowRoot.querySelector("iframe");e&&(e.style.minHeight=""),this.removeOverlay(),this.isMaximized=!1,s&&(s.setAttribute("aria-label","Maximize window"),s.setAttribute("aria-expanded","false"))}else{this.isMinimized&&this.toggleMinimize(),this.createOverlay(),this.classList.add("browser-window-maximized"),this.setAttribute("role","dialog"),this.setAttribute("aria-modal","true");const e=this.shadowRoot.querySelector("iframe");e&&(e.style.minHeight="calc(90vh - 50px)"),this.isMaximized=!0,s&&(s.setAttribute("aria-label","Restore window"),s.setAttribute("aria-expanded","true"))}}render(){const s=this.mode==="dark";this.shadowRoot.innerHTML=`
      <style>
        :host {
          /* CSS Custom Properties with light mode defaults */
          --browser-window-bg: ${s?"#1c1c1e":"#ffffff"};
          --browser-window-header-bg: ${s?"#2c2c2e":"#f6f8fa"};
          --browser-window-border-color: ${s?"#3a3a3c":"#d1d5da"};
          --browser-window-border-radius: 8px;
          --browser-window-text-color: ${s?"#e5e5e7":"#24292e"};
          --browser-window-text-muted: ${s?"#98989d":"#586069"};
          --browser-window-url-bg: ${s?"#1c1c1e":"#ffffff"};
          --browser-window-shadow: ${this.hasShadow?"0 4px 12px rgba(0, 0, 0, 0.15)":"none"};
          --browser-window-close-color: #ff5f57;
          --browser-window-minimize-color: #febc2e;
          --browser-window-maximize-color: #28c840;
          --browser-window-accent-color: #2563eb;
          --browser-window-hover-bg: ${s?"#3a3a3c":"#f3f4f6"};
          --browser-window-active-bg: #dbeafe;
          --browser-window-content-bg: ${s?"#000000":"#ffffff"};
          --browser-window-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --browser-window-mono-font: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

          display: block;
          margin: 1rem 0;
          border-radius: var(--browser-window-border-radius);
          overflow: hidden;
          border: 1px solid var(--browser-window-border-color);
          background: var(--browser-window-bg);
          box-shadow: var(--browser-window-shadow);
          transition: all 250ms ease-out;
          font-family: var(--browser-window-font-family);
        }

        :host(.browser-window-maximized) {
          position: fixed !important;
          top: 5vh !important;
          left: 5vw !important;
          width: 90vw !important;
          height: 90vh !important;
          z-index: 9999 !important;
          margin: 0 !important;
        }

        @media (prefers-reduced-motion: reduce) {
          :host {
            transition: none;
          }
        }

        .browser-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--browser-window-header-bg);
          border-bottom: 1px solid var(--browser-window-border-color);
          cursor: zoom-in;
          user-select: none;
        }

        :host(.browser-window-maximized) .browser-header {
          cursor: zoom-out;
        }

        .controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .control-button {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          cursor: pointer !important;
          transition: opacity 150ms ease;
        }

        @media (prefers-reduced-motion: reduce) {
          .control-button {
            transition: none;
          }
        }

        .control-button:hover {
          opacity: 0.8;
        }

        .control-button:active {
          opacity: 0.6;
          transform: scale(0.9);
        }

        .control-button:focus {
          outline: 2px solid var(--browser-window-accent-color);
          outline-offset: 2px;
        }

        .control-button:focus:not(:focus-visible) {
          outline: none;
        }

        .control-button.close {
          background: var(--browser-window-close-color);
        }

        .control-button.minimize {
          background: var(--browser-window-minimize-color);
        }

        .control-button.maximize {
          background: var(--browser-window-maximize-color);
        }

        .url-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: var(--browser-window-url-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--browser-window-text-muted);
          cursor: default !important;
        }

        .lock-icon {
          color: var(--browser-window-text-muted);
          font-size: 0.75rem;
        }

        .url-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--browser-window-text-muted);
        }

        .view-source-button,
        .download-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--browser-window-text-muted);
          transition: all 150ms ease;
          border-radius: 4px;
        }

        .view-source-button:hover,
        .download-button:hover {
          color: var(--browser-window-text-color);
          background: var(--browser-window-hover-bg);
        }

        .view-source-button:active,
        .download-button:active {
          transform: scale(0.95);
        }

        .view-source-button.active {
          color: var(--browser-window-accent-color);
          background: var(--browser-window-active-bg);
        }

        .download-icon {
          width: 16px;
          height: 16px;
        }

        .share-container {
          position: relative;
          display: inline-block;
        }

        .share-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--browser-window-text-muted);
          transition: all 150ms ease;
          border-radius: 4px;
        }

        .share-button:hover {
          color: var(--browser-window-text-color);
          background: var(--browser-window-hover-bg);
        }

        .share-button:active {
          transform: scale(0.95);
        }

        .share-button.active {
          color: var(--browser-window-accent-color);
          background: var(--browser-window-active-bg);
        }

        .share-menu {
          display: none;
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: var(--browser-window-header-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 180px;
          z-index: 1000;
          overflow: hidden;
        }

        .share-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 1rem;
          background: none;
          border: none;
          color: var(--browser-window-text-color);
          font-size: 0.875rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: background 150ms ease;
          border-bottom: 1px solid var(--browser-window-border-color);
        }

        .share-menu-item:last-child {
          border-bottom: none;
        }

        .share-menu-item:hover {
          background: var(--browser-window-hover-bg);
        }

        .share-menu-item:active {
          background: var(--browser-window-active-bg);
        }

        .share-menu-item svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .browser-content {
          background: var(--browser-window-content-bg);
          min-height: 200px;
          padding: 0;
        }

        iframe {
          display: block;
          width: 100%;
          border: none;
          min-height: 200px;
        }

        ::slotted(*) {
          display: block;
          width: 100%;
        }

        ::slotted(img),
        ::slotted(iframe) {
          display: block;
          border: none;
          margin: 0;
        }

        .source-view {
          padding: 0;
          background: var(--browser-window-header-bg);
          min-height: 200px;
          max-height: 600px;
          overflow: auto;
        }

        .source-header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--browser-window-header-bg);
          border-bottom: 1px solid var(--browser-window-border-color);
          backdrop-filter: blur(8px);
        }

        .source-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--browser-window-text-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .copy-source-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: var(--browser-window-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 6px;
          color: var(--browser-window-text-color);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .copy-source-button:hover {
          background: var(--browser-window-hover-bg);
        }

        .copy-source-button:active {
          transform: scale(0.97);
        }

        .copy-source-button.copied {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .source-view pre {
          margin: 0;
          padding: 1rem;
          background: var(--browser-window-content-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 6px;
          overflow-x: auto;
          font-family: var(--browser-window-mono-font);
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .source-view code {
          color: var(--browser-window-text-color);
          display: block;
          white-space: pre;
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
          color: var(--browser-window-text-muted);
          min-height: 200px;
        }

        .error-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .error-state p {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background: var(--browser-window-accent-color);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 150ms ease;
        }

        .retry-button:hover {
          opacity: 0.9;
        }

        .retry-button:active {
          transform: scale(0.98);
        }
      </style>
      <div class="browser-header" role="toolbar" aria-label="Window controls">
        <div class="controls">
          <button class="control-button close" aria-label="Close window" tabindex="0"></button>
          <button class="control-button minimize" aria-label="Minimize window" tabindex="0"></button>
          <button class="control-button maximize" aria-label="${this.isMaximized?"Restore window":"Maximize window"}" aria-expanded="${this.isMaximized}" tabindex="0"></button>
        </div>
        <div class="url-bar">
          ${this.url.startsWith("https")?'<span class="lock-icon">🔒</span>':""}
          <span class="url-text" title="${this.escapeHtml(this.url)}">${this.escapeHtml(this.browserTitle)}</span>
          ${this.src?`
            <button class="view-source-button" title="View source code">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4,6 2,8 4,10"/>
                <polyline points="12,6 14,8 12,10"/>
                <line x1="10" y1="4" x2="6" y2="12"/>
              </svg>
            </button>
            <div class="share-container">
              <button class="share-button" title="Share demo">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 12V3M8 3L5 6M8 3l3 3"/>
                  <path d="M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9"/>
                </svg>
              </button>
              <div class="share-menu">
                ${navigator.share?`
                  <button class="share-menu-item" onclick="this.getRootNode().host.shareViaWebAPI()">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="4" r="2"/>
                      <circle cx="4" cy="8" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M6 9l4 2M6 7l4-2"/>
                    </svg>
                    Share...
                  </button>
                `:""}
                <button class="share-menu-item" onclick="this.getRootNode().host.openInCodePen()">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L0 5v6l8 5 8-5V5L8 0zM7 10.5L2 7.5v-2l5 3v2zm1-3l-5-3L8 2l5 2.5-5 3zm1 3v-2l5-3v2l-5 3z"/>
                  </svg>
                  Open in CodePen
                </button>
              </div>
            </div>
            <a href="${this.escapeHtml(this.src)}" download class="download-button" title="Download demo HTML file">
              <svg class="download-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 1v10M8 11l-3-3M8 11l3-3"/>
                <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
              </svg>
            </a>
          `:""}
        </div>
      </div>
      <div class="browser-content">
        ${this.src?`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`:"<slot></slot>"}
      </div>
    `}escapeHtml(s){const e=document.createElement("div");return e.textContent=s,e.innerHTML}};customElements.define("browser-window",rn);export{ve as T,on as i};
