var _=Object.defineProperty;var L=(n,t)=>()=>(n&&(t=n(n=0)),t);var q=(n,t)=>{for(var e in t)_(n,e,{get:t[e],enumerable:!0})};function F(n,t,e){let r=256*Math.pow(2,e),o=n/r*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*t/r)))*180/Math.PI,lng:o}}function x(n,t,e){let r=256*Math.pow(2,e),o=n*Math.PI/180;return{x:(t+180)/360*r,y:(1-Math.log(Math.tan(o)+1/Math.cos(o))/Math.PI)/2*r}}function V(n,t,e,r,o){let i=o??(typeof devicePixelRatio=="number"?devicePixelRatio:1),s="abc"[Math.abs(e+r)%3];return n.replaceAll("{z}",String(t)).replaceAll("{x}",String(e)).replaceAll("{y}",String(r)).replaceAll("{s}",s).replaceAll("{r}",i>1?"@2x":"")}function S(n,t,e,r,o){let i=o||(v[n]??v.osm).template;return V(i,t,e,r)}var v,z=L(()=>{v={osm:{template:"https://tile.openstreetmap.org/{z}/{x}/{y}.png",origin:"https://tile.openstreetmap.org",credits:[{text:"\xA9 OpenStreetMap contributors",href:"https://www.openstreetmap.org/copyright"}]},"carto-light":{template:"https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",origin:"https://basemaps.cartocdn.com",credits:[{text:"\xA9 OpenStreetMap contributors",href:"https://www.openstreetmap.org/copyright"},{text:"\xA9 CARTO",href:"https://carto.com/attributions"}]},"carto-dark":{template:"https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",origin:"https://basemaps.cartocdn.com",credits:[{text:"\xA9 OpenStreetMap contributors",href:"https://www.openstreetmap.org/copyright"},{text:"\xA9 CARTO",href:"https://carto.com/attributions"}]}}});var B={};q(B,{MapInteraction:()=>E});var E,I=L(()=>{z();E=class{#t;#i;#r;#S;#N;#L;#T;#A;#a=0;#e=0;#s=15;#h=1;#b=19;#d=0;#m=0;#v=0;#y=0;#$=15;#c=0;#n=0;#o=new Map;#f=0;#x=0;#l=new Map;#k=0;#p=0;constructor({host:t,viewport:e,tiles:r,marker:o,lat:i,lng:s,zoom:l,provider:c,tileUrl:h,width:a,height:d,onDeactivate:g,onMove:p}){this.#A=t,this.#t=e,this.#i=r,this.#r=o,this.#S=c,this.#N=h||"",this.#L=g,this.#T=p||(()=>{}),this.#s=l,this.#v=this.#f=i,this.#y=this.#x=s,this.#$=l,this.#c=a,this.#n=d;let b=x(i,s,l);this.#a=b.x,this.#e=b.y,this.#z(),this.#i.replaceChildren(),this.#i.style.transform="",this.#r&&this.#i.appendChild(this.#r),this.#t.addEventListener("pointerdown",this.#R),this.#t.addEventListener("pointermove",this.#B),this.#t.addEventListener("pointerup",this.#E),this.#t.addEventListener("pointercancel",this.#E),this.#t.addEventListener("wheel",this.#F,{passive:!1}),this.#t.addEventListener("keydown",this.#O),this.#u()}get zoom(){return this.#s}get minZoom(){return this.#h}get maxZoom(){return this.#b}get center(){let{lat:t,lng:e}=F(this.#a,this.#e,this.#s);return{lat:+t.toFixed(6),lng:+e.toFixed(6),zoom:this.#s}}zoomBy(t){this.#g(this.#s+t,this.#c/2,this.#n/2)}recenter(){this.#s=this.#$;let t=x(this.#v,this.#y,this.#s);this.#a=t.x,this.#e=t.y,this.#M(),this.#z(),this.#w(),this.#u(),this.#C()}panBy(t,e){this.#a+=t,this.#e+=e,this.#w(),this.#u()}resize(t,e){!t||!e||t===this.#c&&e===this.#n||(this.#c=t,this.#n=e,this.#w(),this.#u())}#z(){this.#d=Math.floor(this.#a/256)*256,this.#m=Math.floor(this.#e/256)*256}#R=t=>{if(!(t.pointerType==="mouse"&&t.button!==0)&&!t.target.closest?.("a, button")){t.preventDefault(),this.#t.focus({preventScroll:!0}),this.#l.set(t.pointerId,{x:t.clientX,y:t.clientY});try{this.#t.setPointerCapture(t.pointerId)}catch{}this.#l.size===1?(this.#k=0,this.#t.setAttribute("data-dragging","")):this.#l.size===2&&(this.#p=this.#I(),this.#k=1/0)}};#B=t=>{let e=this.#l.get(t.pointerId);if(!e)return;let r=t.clientX-e.x,o=t.clientY-e.y;if(e.x=t.clientX,e.y=t.clientY,this.#l.size===1){this.#k+=Math.abs(r)+Math.abs(o),this.panBy(-r,-o);return}if(this.#l.size===2){this.panBy(-r/2,-o/2);let i=this.#I();if(!this.#p){this.#p=i;return}let s=i/this.#p;if(s>=1.5||s<=1/1.5){let l=this.#D();this.#g(this.#s+(s>1?1:-1),l.x,l.y),this.#p=i}}};#E=t=>{if(!this.#l.has(t.pointerId))return;let e=this.#l.size===1;this.#l.delete(t.pointerId);try{this.#t.releasePointerCapture(t.pointerId)}catch{}if(this.#l.size<2&&(this.#p=0),!(this.#l.size>0)){if(this.#t.removeAttribute("data-dragging"),e&&t.type==="pointerup"&&this.#k<5){let r=this.#t.getBoundingClientRect();this.panBy(t.clientX-r.left-this.#c/2,t.clientY-r.top-this.#n/2)}this.#C()}};#I(){let[t,e]=[...this.#l.values()];return t&&e?Math.hypot(t.x-e.x,t.y-e.y):0}#D(){let[t,e]=[...this.#l.values()],r=this.#t.getBoundingClientRect();return{x:(t.x+e.x)/2-r.left,y:(t.y+e.y)/2-r.top}}#F=t=>{t.preventDefault();let e=t.ctrlKey?-t.deltaY*.01:-Math.sign(t.deltaY),r=Math.round(Math.max(this.#h,Math.min(this.#b,this.#s+e)));if(r===this.#s)return;let o=this.#t.getBoundingClientRect();this.#g(r,t.clientX-o.left,t.clientY-o.top)};#O=t=>{if(t.target!==this.#t)return;let e=80,r=null;switch(t.key){case"ArrowLeft":r=[-e,0];break;case"ArrowRight":r=[e,0];break;case"ArrowUp":r=[0,-e];break;case"ArrowDown":r=[0,e];break;case"+":case"=":t.preventDefault(),this.zoomBy(1);return;case"-":case"_":t.preventDefault(),this.zoomBy(-1);return;case"Home":case"0":t.preventDefault(),this.recenter();return;case"Escape":t.preventDefault(),this.#L();return;default:return}t.preventDefault(),this.panBy(r[0],r[1]),this.#C()};#g(t,e,r){if(t=Math.max(this.#h,Math.min(this.#b,t)),t===this.#s)return;let o=this.#a-this.#c/2+e,i=this.#e-this.#n/2+r,s=Math.pow(2,t-this.#s);this.#a=o*s-e+this.#c/2,this.#e=i*s-r+this.#n/2,this.#s=t,this.#M(),this.#w(),this.#z(),this.#u(),this.#C()}#w(){let t=256*Math.pow(2,this.#s),e=(this.#a%t+t)%t;e!==this.#a&&(this.#a=e,this.#M(),this.#z());let r=Math.min(this.#n/2,t/2);this.#e=Math.max(r,Math.min(t-r,this.#e))}#u(){let t=-(this.#a-this.#c/2-this.#d),e=-(this.#e-this.#n/2-this.#m);this.#i.style.transform=`translate(${Math.round(t)}px, ${Math.round(e)}px)`,this.#_(),this.#q(),this.#P()}#_(){let t=this.#s,e=Math.pow(2,t),r=this.#a-this.#c/2,o=this.#e-this.#n/2,i=Math.floor(r/256)-1,s=Math.max(0,Math.floor(o/256)-1),l=Math.ceil((r+this.#c)/256)+1,c=Math.min(e,Math.ceil((o+this.#n)/256)+1);for(let h=s;h<c;h++)for(let a=i;a<l;a++){let d=(a%e+e)%e,g=`${t}/${a}/${h}`;if(this.#o.has(g))continue;let p=document.createElement("img");p.src=S(this.#S,t,d,h,this.#N),p.alt="",p.draggable=!1,p.style.left=`${a*256-this.#d}px`,p.style.top=`${h*256-this.#m}px`,p._wx=a*256,p._wy=h*256,this.#o.set(g,p),this.#i.insertBefore(p,this.#r?.parentNode===this.#i?this.#r:null)}}#q(){let t=this.#a-this.#c/2,e=this.#e-this.#n/2,r=512;for(let[o,i]of this.#o){let s=i._wx??0,l=i._wy??0;(s+256<t-r||s>t+this.#c+r||l+256<e-r||l>e+this.#n+r)&&(i.remove(),this.#o.delete(o))}}#P(){if(!this.#r)return;let t=x(this.#f,this.#x,this.#s),e=this.#r.offsetWidth||32,r=256*Math.pow(2,this.#s),o=t.x;for(;o-this.#a>r/2;)o-=r;for(;this.#a-o>r/2;)o+=r;this.#r.style.top=`${Math.round(t.y-this.#m-e)}px`,this.#r.style.left=`${Math.round(o-this.#d-e/2)}px`,this.#r.style.transform="none"}#C(){let t=this.center;this.#A.dispatchEvent(new CustomEvent("geo-map:move",{bubbles:!0,detail:t})),this.#T(t)}#M(){for(let t of this.#o.values())t.remove();this.#o.clear()}destroy(){this.#t.removeEventListener("pointerdown",this.#R),this.#t.removeEventListener("pointermove",this.#B),this.#t.removeEventListener("pointerup",this.#E),this.#t.removeEventListener("pointercancel",this.#E),this.#t.removeEventListener("wheel",this.#F),this.#t.removeEventListener("keydown",this.#O),this.#t.removeAttribute("data-dragging"),this.#l.clear(),this.#M()}}});var M=class extends HTMLElement{#t=[];#i;constructor(){super(),this.hasAttribute("data-upgraded")&&this.removeAttribute("data-upgraded")}connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,r,o){t.addEventListener(e,r,o),this.#t.push(()=>t.removeEventListener(e,r,o))}_reinit(){for(let t of this.#t)t();this.#t=[],this.teardown(),this.removeAttribute("data-upgraded"),this.isConnected&&this.setup()!==!1&&this.setAttribute("data-upgraded","")}setup(){}teardown(){}setState(t,e){this.#i||(this.#i=this.attachInternals());let r=this.#i.states;try{e?r.add(t):r.delete(t)}catch{let o=`--${t}`;e?r.add(o):r.delete(o)}}_adoptInternals(t){this.#i||(this.#i=t)}#r(){return this.constructor.formAssociated&&this.#i?this.#i:null}get validity(){return this.#r()?.validity}get validationMessage(){return this.#r()?.validationMessage??""}get willValidate(){return this.#r()?.willValidate??!1}get form(){return this.#r()?.form??null}checkValidity(){return this.#r()?.checkValidity()??!0}reportValidity(){return this.#r()?.reportValidity()??!0}};var T=`
:host {
  display: block;
  position: relative;
  overflow: hidden;
  height: var(--geo-map-height, 300px);
  border-radius: var(--geo-map-border-radius, 0.5rem);
  /* Loading-state placeholder gradient \u2014 derived from VB surface tokens
     so it shifts with the active theme rather than freezing on grey. */
  background: linear-gradient(
    135deg,
    var(--color-surface-raised, #e8e8e8) 0%,
    var(--color-surface-sunken, var(--color-border, #d0d0d0)) 100%
  );
  color-scheme: light dark;
}

[part="container"] {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Stationary viewport (focus target in interactive mode); the tiles layer
   inside it is translated. Tiles are always physically laid out (a map
   is not mirrored in RTL). */
[part="viewport"] {
  position: absolute;
  inset: 0;
  overflow: hidden;
  direction: ltr;
}

[part="viewport"]:focus-visible {
  outline: 2px solid var(--color-interactive, var(--color-primary, Highlight));
  outline-offset: -4px;
}

[part="tiles"] {
  position: absolute;
  top: 0;
  left: 0;
}

[part="tiles"] img {
  position: absolute;
  display: block;
  width: 256px;
  height: 256px;
  max-width: none;
  -webkit-user-drag: none;
  user-select: none;
}

/* Marker \u2014 fill follows marker-color (validated, set as --_marker-color),
   then --geo-map-marker-color, then the theme's error/danger token. */
[part="marker"] {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--geo-map-marker-size, 32px);
  height: var(--geo-map-marker-size, 32px);
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.3));
  pointer-events: none;
  z-index: 2;
}

[part="marker"] svg {
  display: block;
  width: 100%;
  height: 100%;
}

[part="marker"] .pin {
  fill: var(--_marker-color, var(--geo-map-marker-color, var(--color-error, #c0392b)));
}

[part="marker"] .dot {
  fill: var(--geo-map-marker-dot-color, #fff);
  opacity: 0.9;
}

/* Caption (slot projection). Translucent surface over the map; uses
   light-dark() so the pair switches automatically with the page's
   resolved color-scheme (driven by VB tokens). */
[part="caption"] {
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  background: var(--geo-map-caption-bg, light-dark(rgb(255 255 255 / 0.9), rgb(0 0 0 / 0.75)));
  color: var(--geo-map-caption-color, var(--color-text, light-dark(#1a1a1a, #e0e0e0)));
  padding: var(--geo-map-caption-padding, 0.5rem 0.75rem);
  font-size: 0.875rem;
  /* Above the activation overlay so links in the caption stay usable */
  z-index: 6;
}

[part="container"]:not([data-caption]) [part="caption"] {
  display: none;
}

/* Attribution \u2014 translucent surface over the map; same pattern as caption */
[part="attribution"] {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  padding: 2px 5px;
  font-size: var(--geo-map-attribution-font-size, 0.625rem);
  background: var(--geo-map-attribution-bg, light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.6)));
  color: var(--geo-map-attribution-color, var(--color-text, light-dark(#333, #ddd)));
  z-index: 7;
  line-height: 1.4;
}

[part="attribution"][hidden] {
  display: none;
}

[part="attribution"] a {
  color: inherit;
  text-decoration: none;
}

[part="attribution"] a:hover,
[part="attribution"] a:focus-visible {
  text-decoration: underline;
}

/* When caption is present, shift attribution above it */
[part="container"][data-caption] [part="attribution"] {
  inset-block-end: auto;
  inset-block-start: 0;
}

/* Overlay \u2014 the whole surface is the activation target; faded in on
   hover/focus for mouse users, always visible on touch (no hover). */
[part="overlay"] {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem 1rem;
  text-align: center;
  background: var(--geo-map-overlay-bg, rgb(0 0 0 / 0.35));
  color: var(--geo-map-overlay-color, var(--color-text-inverted, #fff));
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

[part="overlay"]:hover,
[part="overlay"]:focus-within,
[part="container"][data-consent] [part="overlay"] {
  opacity: 1;
}

@media (hover: none) {
  [part="overlay"] {
    opacity: 1;
    background: transparent;
  }

}

[part="activate"] {
  background: var(--geo-map-activate-bg, rgb(0 0 0 / 0.6));
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

[part="activate"]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}

[part="consent-note"] {
  margin: 0;
  font-size: 0.75rem;
}

/* Consent placeholder \u2014 no tiles yet; keep the overlay readable */
[part="container"][data-consent] [part="overlay"] {
  background: var(--geo-map-consent-bg, light-dark(rgb(255 255 255 / 0.6), rgb(0 0 0 / 0.5)));
  color: var(--geo-map-consent-color, var(--color-text, light-dark(#1a1a1a, #e0e0e0)));
}

[part="container"][data-consent] [part="activate"] {
  background: var(--color-interactive, var(--color-primary, #1a5fb4));
  color: var(--color-text-on-primary, var(--color-text-inverted, #fff));
}

[part="container"][data-consent] [part="marker"] {
  display: none;
}

[part="container"][data-consent][data-caption] [part="overlay"] {
  padding-block-end: 4rem;
}

/* On-screen controls (interactive mode) */
[part="controls"] {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-start: 0.5rem;
  z-index: 6;
  display: none;
  flex-direction: column;
  gap: 2px;
}

[part="container"][data-active] [part="controls"] {
  display: flex;
}

[part~="control"] {
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
  display: grid;
  place-items: center;
  padding: 0 0.5rem;
  border: 1px solid var(--color-border, rgb(0 0 0 / 0.2));
  border-radius: var(--radius-s, 0.25rem);
  background: var(--color-surface, light-dark(#fff, #1e1e1e));
  color: var(--color-text, light-dark(#1a1a1a, #e0e0e0));
  font: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

[part~="control"]:hover {
  background: var(--color-surface-raised, light-dark(#f2f2f2, #2a2a2a));
}

[part~="control"]:focus-visible {
  outline: 2px solid var(--color-interactive, var(--color-primary, Highlight));
  outline-offset: 1px;
}

[part~="control"]:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Interactive mode */
[part="container"][data-active] [part="viewport"] {
  cursor: grab;
  touch-action: none;
}

[part="container"][data-active] [part="viewport"][data-dragging] {
  cursor: grabbing;
}

[part="container"][data-active] [part="overlay"] {
  display: none;
}

/* Visually hidden live region */
[part="status"] {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Reduced motion \u2014 disable transitions */
@media (prefers-reduced-motion: reduce) {
  [part="overlay"] {
    transition: none;
  }
}

/* Error state */
[part="container"][data-state="error"] [part="tiles"] {
  display: none;
}

[part="container"][data-state="error"]::after {
  content: attr(data-error);
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #666);
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
}

@media (forced-colors: active) {
  [part~="control"],
  [part="activate"] {
    border: 1px solid ButtonText;
  }
}
`,k=null;function $(n){if("adoptedStyleSheets"in n&&typeof CSSStyleSheet=="function"&&"replaceSync"in CSSStyleSheet.prototype)return k||(k=new CSSStyleSheet,k.replaceSync(T)),n.adoptedStyleSheets.includes(k)||(n.adoptedStyleSheets=[...n.adoptedStyleSheets,k]),null;let t=document.createElement("style");return t.textContent=T,t}z();var Z=window.matchMedia("(prefers-reduced-motion: reduce)");var P=new Map;function R(n,t,e={}){let r=e.priority??10,o={impl:t,bundle:e.bundle,contract:e.contract,priority:r},i=P.get(n);if(customElements.get(n)){if(!i||i.priority>=r){i&&i.priority===r&&i.impl!==t&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${i.bundle}" (priority ${i.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${n}> defined by "${i.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(i&&i.priority>=r){i.priority===r&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${i.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}P.set(n,o),customElements.define(n,t)}var C="http://www.w3.org/2000/svg",U={map:"Map","map-of":"Map of {name}",activate:"Activate interactive map",consent:"Load map","consent-note":"Loads map images from {host}","zoom-in":"Zoom in","zoom-out":"Zoom out",recenter:"Recenter map",exit:"Exit map",controls:"Map controls",instructions:"Drag or use the arrow keys to pan. Click a point to centre on it. Pinch, scroll, or press plus and minus to zoom. Home recentres. Escape exits.",moved:"Map centred on {lat}, {lng}, zoom {zoom}","error-coords":"Map location unavailable","error-tiles":"Map images failed to load"},W=0;function Y(){let n=document.createElement("div");n.setAttribute("part","marker"),n.setAttribute("aria-hidden","true");let t=document.createElementNS(C,"svg");t.setAttribute("viewBox","0 0 24 36"),t.setAttribute("focusable","false");let e=document.createElementNS(C,"path");e.setAttribute("class","pin"),e.setAttribute("d","M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z");let r=document.createElementNS(C,"circle");return r.setAttribute("class","dot"),r.setAttribute("cx","12"),r.setAttribute("cy","12"),r.setAttribute("r","5"),t.append(e,r),n.append(t),n}function u(n,t={},e){let r=document.createElement(n);for(let[o,i]of Object.entries(t))r.setAttribute(o,i);return e!=null&&(r.textContent=e),r}function O(n){return!n||typeof n!="string"?!1:typeof CSS<"u"&&CSS.supports("color",n)}var N=class extends M{static get observedAttributes(){return["lat","lng","zoom","marker","marker-color","provider","tile-url","interactive","static-only","src","place","label","attribution","attribution-href","loading"]}#t=null;#i=null;#r=0;#S=!1;#N=!1;#L=!1;#T=!1;#A=!1;#a=`geo-map-${++W}`;#e=null;#s="";#h=new Map;#b="";#d=null;#m=0;#v=null;#y=null;#$=()=>this.#F();#c=0;#n="osm";constructor(){super(),this.attachShadow({mode:"open"})}get lat(){return parseFloat(this.getAttribute("lat")??"")}get lng(){return parseFloat(this.getAttribute("lng")??"")}get zoom(){let t=parseInt(this.getAttribute("zoom")??"",10);return t>=1&&t<=19?t:15}get showMarker(){return this.getAttribute("marker")!=="false"}get markerColor(){let t=this.getAttribute("marker-color");return O(t)?t:""}get provider(){let t=this.getAttribute("provider");return t&&(t in v||t==="carto-auto")?t:"osm"}get tileUrl(){return this.getAttribute("tile-url")||""}get interactive(){let t=this.getAttribute("interactive");return t==="eager"||t==="none"?t:"click"}get staticOnly(){return this.hasAttribute("static-only")}get loading(){let t=this.getAttribute("loading");return t==="eager"||t==="consent"?t:"lazy"}get active(){return this.#t!==null}#o(t,e={}){return(this.getAttribute(`data-label-${t}`)??U[t]??"").replace(/\{(\w+)\}/g,(o,i)=>i in e?String(e[i]):o)}get#f(){return this.interactive!=="none"&&!this.staticOnly}get#x(){return this.loading==="consent"&&!this.#N}#l(){let t=this.provider;if(t!=="carto-auto")return t;let e=this.closest("[data-mode]")?.getAttribute("data-mode");return e==="dark"?"carto-dark":e==="light"?"carto-light":window.matchMedia?.("(prefers-color-scheme: dark)").matches?"carto-dark":"carto-light"}#k(){if(this.tileUrl)try{return new URL(this.tileUrl.replace(/\{s\}/g,"a"),location.href).origin}catch{return""}return(v[this.#n]??v.osm).origin}#p(){let t=parseFloat(this.getAttribute("lat")??""),e=parseFloat(this.getAttribute("lng")??"");if(!isNaN(t)&&!isNaN(e))return{lat:t,lng:e};let r=this.getAttribute("src");if(r){let l=this.#z(r);if(l)return l}let o=this.querySelector("address[data-lat][data-lng]");if(o){let l=parseFloat(o.dataset.lat??""),c=parseFloat(o.dataset.lng??"");if(!isNaN(l)&&!isNaN(c))return{lat:l,lng:c}}let i=this.getAttribute("place");if(i){let l=this.#R(i);if(l)return l}let s=document.querySelector('meta[name="geo.position"]');if(s){let c=(s.getAttribute("content")||"").split(";");if(c.length===2){let h=parseFloat(c[0]),a=parseFloat(c[1]);if(!isNaN(h)&&!isNaN(a))return{lat:h,lng:a}}}return null}#z(t){let e=document.getElementById(t);if(!e)return null;if(e.tagName==="ADDRESS"&&e.dataset.lat&&e.dataset.lng){let r=parseFloat(e.dataset.lat),o=parseFloat(e.dataset.lng);if(!isNaN(r)&&!isNaN(o))return{lat:r,lng:o}}return e.tagName==="SCRIPT"&&e.type==="application/ld+json"?this.#B(e):null}#R(t){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let r of e)try{let o=JSON.parse(r.textContent);if(o.name===t){let i=o.geo;if(i){let s=parseFloat(i.latitude),l=parseFloat(i.longitude);if(!isNaN(s)&&!isNaN(l))return{lat:s,lng:l}}}}catch{}return null}#B(t){try{let r=JSON.parse(t.textContent).geo;if(r){let o=parseFloat(r.latitude),i=parseFloat(r.longitude);if(!isNaN(o)&&!isNaN(i))return{lat:o,lng:i}}}catch{}return null}#E(){let t=i=>(i||"").replace(/\s+/g," ").trim(),e=t(this.getAttribute("label"));if(e)return e;let r=t(this.querySelector("address")?.textContent),o=this.getAttribute("src");if(!r&&o){let i=document.getElementById(o);if(i?.tagName==="ADDRESS")r=t(i.textContent);else if(i?.tagName==="SCRIPT")try{r=t(JSON.parse(i.textContent||"").name)}catch{}}return r||(r=t(this.getAttribute("place"))),r?this.#o("map-of",{name:r}):this.#o("map")}setup(){if(this.#r++,this.#n=this.#l(),this.render(),this.#I(),this.#D(),this.#w(),this.interactive==="eager"&&!this.#L&&this.#f&&!this.#x&&this.#e){let t=this.#r;requestAnimationFrame(()=>{t===this.#r&&this.#P({focus:!1})})}}attributeChangedCallback(t,e,r){e===r||this.#S||!this.isConnected||!this.hasAttribute("data-upgraded")||this._reinit()}teardown(){this.#r++,this.#i=null,this.#t&&(this.#t.destroy(),this.#t=null,this.setState("active",!1)),this.#d?.disconnect(),this.#d=null,cancelAnimationFrame(this.#m),this.#v?.disconnect(),this.#v=null,this.#y?.removeEventListener("change",this.#$),this.#y=null,clearTimeout(this.#c)}#I(){typeof ResizeObserver=="function"&&(this.#d=new ResizeObserver(()=>{cancelAnimationFrame(this.#m),this.#m=requestAnimationFrame(()=>this.#w())}),this.#d.observe(this))}#D(){this.provider!=="carto-auto"||this.tileUrl||(this.#v=new MutationObserver(()=>this.#F()),this.#v.observe(document.documentElement,{attributes:!0,attributeFilter:["data-mode"]}),this.#y=window.matchMedia?.("(prefers-color-scheme: dark)")??null,this.#y?.addEventListener("change",this.#$))}#F(){this.#l()!==this.#n&&this._reinit()}get data(){return{lat:isNaN(this.lat)?void 0:this.lat,lng:isNaN(this.lng)?void 0:this.lng,zoom:this.zoom,marker:this.showMarker,markerColor:this.markerColor}}set data(t){if(!t||typeof t!="object")return;let e=this.data,r={...e};if(t.lat!=null&&!isNaN(Number(t.lat))&&(r.lat=Number(t.lat)),t.lng!=null&&!isNaN(Number(t.lng))&&(r.lng=Number(t.lng)),t.zoom!=null&&!isNaN(Number(t.zoom))&&(r.zoom=Number(t.zoom)),t.marker!=null&&(r.marker=!!t.marker),"markerColor"in t&&(O(t.markerColor)?r.markerColor=t.markerColor:t.markerColor||(r.markerColor="")),!(r.lat===e.lat&&r.lng===e.lng&&r.zoom===e.zoom&&r.marker===e.marker&&r.markerColor===e.markerColor)){this.#S=!0;try{r.lat!==e.lat&&this.setAttribute("lat",String(r.lat)),r.lng!==e.lng&&this.setAttribute("lng",String(r.lng)),r.zoom!==e.zoom&&this.setAttribute("zoom",String(r.zoom)),r.marker!==e.marker&&this.setAttribute("marker",r.marker?"true":"false"),r.markerColor!==e.markerColor&&(r.markerColor?this.setAttribute("marker-color",r.markerColor):this.removeAttribute("marker-color"))}finally{this.#S=!1}this.hasAttribute("data-upgraded")&&this._reinit(),this.dispatchEvent(new CustomEvent("geo-map:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0}))}}get markers(){let t=this.#p();return t?[{lat:t.lat,lng:t.lng,color:this.markerColor}]:[]}render(){let t=this.shadowRoot,e=$(t);this.removeAttribute("data-ready"),this.#A=!1,this.#h=new Map,this.#b="",this.#e=this.#p(),this.#s=this.#E();let r=this.#e!==null,o=r&&this.#x,i=u("div",{part:"container"}),s=u("div",{part:"viewport",role:"img","aria-label":this.#s});if(s.append(u("div",{part:"tiles"})),this.showMarker&&r){let a=Y();this.markerColor&&a.style.setProperty("--_marker-color",this.markerColor),s.append(a)}if(i.append(s),o){i.setAttribute("data-consent","");let a=u("div",{part:"overlay"}),d=u("button",{part:"activate",type:"button"},this.#o("consent")),g=this.#k().replace(/^https?:\/\//,""),p=u("p",{part:"consent-note"},this.#o("consent-note",{host:g}));a.append(d,p),a.addEventListener("click",()=>this.#_());let b=()=>this.#q();a.addEventListener("pointerenter",b,{once:!0}),d.addEventListener("focus",b,{once:!0}),i.append(a)}else if(r&&this.#f){let a=u("div",{part:"overlay"});a.append(u("button",{part:"activate",type:"button"},this.#o("activate"))),a.addEventListener("click",()=>this.#P({focus:!0})),i.append(a)}if(r&&this.#f){let a=u("div",{part:"controls",role:"group","aria-label":this.#o("controls")}),d=[["zoom-in","+",this.#o("zoom-in"),()=>this.#t?.zoomBy(1)],["zoom-out","\u2212",this.#o("zoom-out"),()=>this.#t?.zoomBy(-1)],["recenter","\u2316",this.#o("recenter"),()=>this.#t?.recenter()],["exit","\u2715",this.#o("exit"),()=>this.#M()]];for(let[g,p,b,w]of d){let f=u("button",{part:`control ${g}`,type:"button","aria-label":b,title:b},p);f.addEventListener("click",w),a.append(f)}i.append(a)}let l=u("div",{part:"caption"}),c=u("slot");l.append(c),i.append(l);let h=()=>{let a=c.assignedNodes().some(d=>d.nodeType===1||(d.textContent||"").trim());i.toggleAttribute("data-caption",a)};c.addEventListener("slotchange",h),i.toggleAttribute("data-caption",[...this.childNodes].some(a=>a.nodeType===1&&!a.hasAttribute("slot")||a.nodeType===3&&(a.textContent||"").trim())),i.append(this.#O()),i.append(u("p",{part:"instructions",id:`${this.#a}-help`,hidden:""},this.#o("instructions"))),i.append(u("p",{part:"status",role:"status","aria-live":"polite"})),t.replaceChildren(...e?[e]:[],i),r||this.handleError("Missing or invalid lat/lng coordinates",this.#o("error-coords"))}#O(){let t=u("div",{part:"attribution"}),e=u("slot",{name:"attribution"}),r;if(this.tileUrl){let i=(this.getAttribute("attribution")||"").trim(),s=this.getAttribute("attribution-href")||"";r=i?[{text:i,href:s}]:[]}else r=(v[this.#n]??v.osm).credits;r.forEach((i,s)=>{s&&e.append(document.createTextNode(" "));let l="";if(i.href)try{let c=new URL(i.href,location.href);(c.protocol==="https:"||c.protocol==="http:")&&(l=c.href)}catch{}e.append(l?u("a",{href:l,target:"_blank",rel:"noopener noreferrer"},i.text):u("span",{},i.text))});let o=()=>{t.hidden=r.length===0&&e.assignedNodes().length===0};return e.addEventListener("slotchange",o),t.hidden=r.length===0&&!this.querySelector(':scope > [slot="attribution"]'),t.append(e),t}#g(){let t=this.shadowRoot;return{container:t.querySelector('[part="container"]'),viewport:t.querySelector('[part="viewport"]'),tiles:t.querySelector('[part="tiles"]'),marker:t.querySelector('[part="marker"]'),status:t.querySelector('[part="status"]')}}#w(){let t=this.clientWidth,e=this.clientHeight;if(this.#t){this.#t.resize(t,e);return}if(!this.#e||this.#x||!t||!e)return;let r=`${t}x${e}`;r!==this.#b&&(this.#b=r,this.loadTiles(t,e))}loadTiles(t=this.clientWidth,e=this.clientHeight){let{tiles:r}=this.#g();if(!r||!this.#e||!t||!e)return;let o=this.zoom,{lat:i,lng:s}=this.#e,l=x(i,s,o),c=Math.pow(2,o),h=l.x-t/2,a=l.y-e/2,d=Math.floor(h/256),g=Math.floor((h+t-1)/256),p=Math.max(0,Math.floor(a/256)),b=Math.min(c-1,Math.floor((a+e-1)/256));r.style.transform=`translate(${Math.round(d*256-h)}px, ${Math.round(p*256-a)}px)`;let w=new Set;for(let f=p;f<=b;f++)for(let y=d;y<=g;y++){let A=`${y}/${f}`;w.add(A);let m=this.#h.get(A);if(!m){let D=(y%c+c)%c;m=document.createElement("img"),m.alt="",m.loading=this.loading==="eager"?"eager":"lazy",m.decoding="async",m.draggable=!1,m.addEventListener("load",()=>this.#u()),m.addEventListener("error",()=>this.#u()),m.src=S(this.#n,o,D,f,this.tileUrl),this.#h.set(A,m),r.append(m)}m.style.left=`${(y-d)*256}px`,m.style.top=`${(f-p)*256}px`}for(let[f,y]of this.#h)w.has(f)||(y.remove(),this.#h.delete(f));this.#u()}#u(){if(this.#A||this.#t||!this.#e||this.#h.size===0)return;let t=[...this.#h.values()];if(t.every(e=>e.complete)){if(this.#A=!0,t.every(e=>e.naturalWidth===0)){this.handleError("Failed to load map tiles",this.#o("error-tiles"));return}this.setAttribute("data-ready",""),this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:this.#e.lat,lng:this.#e.lng,zoom:this.zoom}}))}}#_(){this.#N=!0,this._reinit(),this.#f&&this.#P({focus:!0})}#q(){if(this.#T)return;this.#T=!0;let t=this.#k();if(!t||t===location.origin||document.head.querySelector(`link[rel~="preconnect" i][href="${CSS.escape(t)}"]`))return;let e=document.createElement("link");e.rel="preconnect",e.href=t,document.head.appendChild(e)}#P({focus:t=!0}={}){if(this.#t)return Promise.resolve();if(this.#i)return this.#i;if(!this.#e||!this.#f||this.#x)return Promise.resolve();let e=this.#r,r=(async()=>{let{MapInteraction:o}=await Promise.resolve().then(()=>(I(),B));if(!this.isConnected||e!==this.#r||this.#t||!this.#e)return;let{container:i,viewport:s,tiles:l,marker:c}=this.#g();if(!i||!s||!l)return;for(let d of this.#h.values())d.remove();this.#h.clear(),i.setAttribute("data-active",""),s.setAttribute("role","region"),s.setAttribute("aria-roledescription","map"),s.setAttribute("aria-describedby",`${this.#a}-help`),s.setAttribute("tabindex","0"),this.setState("active",!0);let{lat:h,lng:a}=this.#e;this.#t=new o({host:this,viewport:s,tiles:l,marker:c,lat:h,lng:a,zoom:this.zoom,provider:this.#n,tileUrl:this.tileUrl,width:this.clientWidth,height:this.clientHeight,onDeactivate:()=>this.#M(),onMove:d=>this.#C(d)}),t&&s.focus({preventScroll:!0}),this.dispatchEvent(new CustomEvent("geo-map:activate",{bubbles:!0,detail:{lat:h,lng:a,zoom:this.zoom}}))})();return this.#i=r,r.finally(()=>{this.#i===r&&(this.#i=null)}),r}#C(t){clearTimeout(this.#c),this.#c=window.setTimeout(()=>{let{status:e}=this.#g();e&&(e.textContent=this.#o("moved",{lat:t.lat.toFixed(4),lng:t.lng.toFixed(4),zoom:t.zoom}))},400)}#M(){if(!this.#t)return;let t=!!this.shadowRoot?.activeElement;this.#L=!0,this._reinit(),t&&this.shadowRoot?.querySelector('[part="activate"]')?.focus()}handleError(t,e=t){let{container:r}=this.#g();r&&(r.setAttribute("data-state","error"),r.setAttribute("data-error",e)),this.dispatchEvent(new CustomEvent("geo-map:error",{bubbles:!0,detail:{message:t}}))}};R("geo-map",N);export{N as GeoMap};
//# sourceMappingURL=geo-map.js.map
