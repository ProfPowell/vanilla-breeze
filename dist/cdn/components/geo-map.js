var X=Object.defineProperty;var A=(l,t)=>()=>(l&&(t=l(l=0)),t);var Y=(l,t)=>{for(var e in t)X(l,e,{get:t[e],enumerable:!0})};function $(l,t,e){let i=Math.pow(2,e),o=l*Math.PI/180,s=(t+180)/360*i,a=(1-Math.log(Math.tan(o)+1/Math.cos(o))/Math.PI)/2*i,n=Math.floor(s),r=Math.floor(a),c=Math.round((s-n)*256),h=Math.round((a-r)*256);return{tileX:n,tileY:r,pixelX:c,pixelY:h}}function S(l,t,e){let i=256*Math.pow(2,e),o=l/i*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*t/i)))*180/Math.PI,lng:o}}function v(l,t,e,i){switch(l){case"carto-light":return`https://basemaps.cartocdn.com/light_all/${t}/${e}/${i}.png`;case"carto-dark":return`https://basemaps.cartocdn.com/dark_all/${t}/${e}/${i}.png`;default:return`https://tile.openstreetmap.org/${t}/${e}/${i}.png`}}var k=A(()=>{});var P={};Y(P,{MapInteraction:()=>E});var E,F=A(()=>{k();E=class{#o;#a;#t;#m;#g;#s=0;#i=0;#r=15;#u=1;#f=19;#l=0;#n=0;#c=new Map;#e=null;#v=0;#b=0;#y=!1;#w=0;#x=0;constructor({shadow:t,host:e,lat:i,lng:o,zoom:s,provider:a,onDeactivate:n}){this.#o=t,this.#a=e,this.#m=a,this.#g=n,this.#r=s,this.#t=t.querySelector('[part="tiles"]'),this.#e=t.querySelector('[part="marker"]');let r=256*Math.pow(2,s),c=i*Math.PI/180;this.#s=(o+180)/360*r,this.#i=(1-Math.log(Math.tan(c)+1/Math.cos(c))/Math.PI)/2*r,this.#v=this.#s,this.#b=this.#i,this.#l=this.#a.offsetWidth||400,this.#n=this.#a.offsetHeight||300,this.#t.innerHTML="",this.#t.style.transform="",this.#e&&(this.#e.style.position="absolute",this.#e.style.top="",this.#e.style.left="",this.#t.appendChild(this.#e)),this.#S(),this.#h()}#S(){this.#t.addEventListener("pointerdown",this.#N),this.#t.addEventListener("wheel",this.#A,{passive:!1}),this.#a.addEventListener("keydown",this.#L)}#N=t=>{t.button===0&&(t.preventDefault(),this.#y=!0,this.#w=t.clientX,this.#x=t.clientY,this.#t.setPointerCapture(t.pointerId),this.#t.setAttribute("data-dragging",""),this.#t.addEventListener("pointermove",this.#M),this.#t.addEventListener("pointerup",this.#k))};#M=t=>{if(!this.#y)return;let e=t.clientX-this.#w,i=t.clientY-this.#x;this.#w=t.clientX,this.#x=t.clientY,this.#s-=e,this.#i-=i,this.#d(),this.#h()};#k=t=>{this.#y=!1,this.#t.releasePointerCapture(t.pointerId),this.#t.removeAttribute("data-dragging"),this.#t.removeEventListener("pointermove",this.#M),this.#t.removeEventListener("pointerup",this.#k),this.#p()};#A=t=>{t.preventDefault();let e=t.ctrlKey?-t.deltaY*.01:-Math.sign(t.deltaY),i=Math.round(Math.max(this.#u,Math.min(this.#f,this.#r+e)));if(i===this.#r)return;let o=this.#a.getBoundingClientRect(),s=t.clientX-o.left,a=t.clientY-o.top;this.#E(i,s,a)};#L=t=>{switch(t.key){case"ArrowLeft":t.preventDefault(),this.#s-=80,this.#d(),this.#h(),this.#p();break;case"ArrowRight":t.preventDefault(),this.#s+=80,this.#d(),this.#h(),this.#p();break;case"ArrowUp":t.preventDefault(),this.#i-=80,this.#d(),this.#h(),this.#p();break;case"ArrowDown":t.preventDefault(),this.#i+=80,this.#d(),this.#h(),this.#p();break;case"+":case"=":t.preventDefault(),this.#E(this.#r+1,this.#l/2,this.#n/2);break;case"-":t.preventDefault(),this.#E(this.#r-1,this.#l/2,this.#n/2);break;case"Escape":t.preventDefault(),this.#g();break}};#E(t,e,i){if(t=Math.max(this.#u,Math.min(this.#f,t)),t===this.#r)return;let o=this.#s-this.#l/2,s=this.#i-this.#n/2,a=o+e,n=s+i,r=Math.pow(2,t-this.#r);this.#s=a*r-e+this.#l/2,this.#i=n*r-i+this.#n/2,this.#v*=r,this.#b*=r,this.#r=t,this.#$(),this.#d(),this.#h(),this.#p()}#d(){let t=256*Math.pow(2,this.#r);this.#s=(this.#s%t+t)%t,this.#i=Math.max(this.#n/2,Math.min(t-this.#n/2,this.#i))}#h(){let t=-(this.#s-this.#l/2),e=-(this.#i-this.#n/2);this.#t.style.transform=`translate(${Math.round(t)}px, ${Math.round(e)}px)`,this.#T(),this.#P(),this.#F()}#T(){let t=this.#r,e=Math.pow(2,t),i=this.#s-this.#l/2,o=this.#i-this.#n/2,s=i+this.#l,a=o+this.#n,n=Math.floor(i/256)-1,r=Math.max(0,Math.floor(o/256)-1),c=Math.ceil(s/256)+1,h=Math.min(e,Math.ceil(a/256)+1);for(let d=r;d<h;d++)for(let u=n;u<c;u++){let f=(u%e+e)%e,b=`${t}/${f}/${d}`;this.#c.has(b)||this.#C(t,u,d,f)}}#C(t,e,i,o){let s=`${t}/${o}/${i}`;if(this.#c.has(s))return;let a=e*256,n=i*256,r=document.createElement("img");r.src=v(this.#m,t,o,i),r.alt="",r.draggable=!1,r.style.left=a+"px",r.style.top=n+"px",r.style.width="256px",r.style.height="256px",r._wx=a,r._wy=n,this.#c.set(s,r),this.#t.appendChild(r)}#P(){let t=this.#s-this.#l/2,e=this.#i-this.#n/2,i=512;for(let[o,s]of this.#c){let a=s._wx,n=s._wy;(a+256<t-i||a>t+this.#l+i||n+256<e-i||n>e+this.#n+i)&&(s.remove(),this.#c.delete(o))}}#F(){if(!this.#e)return;let t=this.#e.offsetWidth||32;this.#e.style.left=`${Math.round(this.#v-t/2)}px`,this.#e.style.top=`${Math.round(this.#b-t)}px`,this.#e.style.transform=""}#p(){let{lat:t,lng:e}=S(this.#s,this.#i,this.#r);this.#a.dispatchEvent(new CustomEvent("geo-map:move",{bubbles:!0,detail:{lat:+t.toFixed(6),lng:+e.toFixed(6),zoom:this.#r}}))}#$(){for(let t of this.#c.values())t.remove();this.#c.clear()}destroy(){if(this.#t.removeEventListener("pointerdown",this.#N),this.#t.removeEventListener("wheel",this.#A),this.#a.removeEventListener("keydown",this.#L),this.#t.removeEventListener("pointermove",this.#M),this.#t.removeEventListener("pointerup",this.#k),this.#e&&this.#e.parentNode===this.#t){let t=this.#o.querySelector('[part="container"]');t&&(t.insertBefore(this.#e,this.#t.nextSibling),this.#e.style.position="",this.#e.style.left="",this.#e.style.top="",this.#e.style.transform="")}this.#$(),this.#a.removeAttribute("data-interactive-active")}}});var g=class extends HTMLElement{#o=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let t of this.#o)t();this.#o=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,o){t.addEventListener(e,i,o),this.#o.push(()=>t.removeEventListener(e,i,o))}setup(){}teardown(){}};var L=`
:host {
  display: block;
  position: relative;
  overflow: hidden;
  height: var(--geo-map-height, 300px);
  border-radius: var(--geo-map-border-radius, 0.5rem);
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
  color-scheme: light dark;
}

[part="container"] {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Tile grid */
[part="tiles"] {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(3, 256px);
  grid-template-rows: repeat(3, 256px);
}

[part="tiles"] img {
  display: block;
  width: 256px;
  height: 256px;
  -webkit-user-drag: none;
  user-select: none;
}

/* Marker */
[part="marker"] {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--geo-map-marker-size, 32px);
  height: var(--geo-map-marker-size, 32px);
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  pointer-events: none;
  z-index: 2;
}

/* Caption (slot projection) */
[part="caption"] {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--geo-map-caption-bg, rgba(255, 255, 255, 0.9));
  padding: var(--geo-map-caption-padding, 0.5rem 0.75rem);
  font-size: 0.875rem;
  z-index: 3;
}

[part="caption"]:empty,
[part="caption"]:not(:has(*)) {
  display: none;
}

@media (prefers-color-scheme: dark) {
  [part="caption"] {
    background: var(--geo-map-caption-bg, rgba(0, 0, 0, 0.75));
    color: #e0e0e0;
  }
}

/* Attribution */
[part="attribution"] {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 2px 5px;
  font-size: var(--geo-map-attribution-font-size, 0.625rem);
  background: rgba(255, 255, 255, 0.7);
  color: #333;
  z-index: 4;
  line-height: 1.4;
}

[part="attribution"] a {
  color: inherit;
  text-decoration: none;
}

[part="attribution"] a:hover {
  text-decoration: underline;
}

/* When caption is present, shift attribution above it */
:host([data-has-caption]) [part="attribution"] {
  bottom: auto;
  top: 0;
}

/* Overlay \u2014 full surface, appears on hover/focus */
[part="overlay"] {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--geo-map-overlay-bg, rgba(0, 0, 0, 0.35));
  color: var(--geo-map-overlay-color, #fff);
  opacity: 0;
  transition: opacity 0.2s ease;
}

[part="overlay"]:hover,
[part="overlay"]:focus-within {
  opacity: 1;
}

/* Activate button inside overlay */
[part="activate"] {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

[part="activate"]:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}

/* Interactive mode \u2014 tiles become absolutely positioned for panning */
:host([data-interactive-active]) [part="tiles"] {
  display: block;
  cursor: grab;
  touch-action: none;
}

:host([data-interactive-active]) [part="tiles"] img {
  position: absolute;
}

:host([data-interactive-active]) [part="tiles"][data-dragging] {
  cursor: grabbing;
}

:host([data-interactive-active]) [part="overlay"] {
  display: none;
}

/* Static-only \u2014 hide overlay entirely */
:host([static-only]) [part="overlay"] {
  display: none;
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
  color: #666;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
}
`;k();var j=window.matchMedia("(prefers-reduced-motion: reduce)");var T=new Map;function C(l,t,e={}){let i=e.priority??10,o={impl:t,bundle:e.bundle,contract:e.contract,priority:i},s=T.get(l);if(customElements.get(l)){if(!s||s.priority>=i){s&&s.priority===i&&s.impl!==t&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${l}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=i){s.priority===i&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}T.set(l,o),customElements.define(l,t)}function _(l){return`<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${l}"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`}var N=class extends g{static get observedAttributes(){return["lat","lng","zoom","marker","marker-color","provider","interactive","static-only","src","place"]}#o=null;#a=!1;constructor(){super(),this.attachShadow({mode:"open"})}get lat(){return parseFloat(this.getAttribute("lat")??"")}get lng(){return parseFloat(this.getAttribute("lng")??"")}get zoom(){let t=parseInt(this.getAttribute("zoom")??"",10);return t>=1&&t<=19?t:15}get showMarker(){return this.getAttribute("marker")!=="false"}get markerColor(){return this.getAttribute("marker-color")||"#e74c3c"}get provider(){return this.getAttribute("provider")||"osm"}get interactive(){let t=this.getAttribute("interactive");return t==="eager"||t==="none"?t:"click"}get staticOnly(){return this.hasAttribute("static-only")}#t(){let t=parseFloat(this.getAttribute("lat")??""),e=parseFloat(this.getAttribute("lng")??"");if(!isNaN(t)&&!isNaN(e))return{lat:t,lng:e};let i=this.getAttribute("src");if(i){let n=this.#m(i);if(n)return n}let o=this.querySelector("address[data-lat][data-lng]");if(o){let n=parseFloat(o.dataset.lat??""),r=parseFloat(o.dataset.lng??"");if(!isNaN(n)&&!isNaN(r))return{lat:n,lng:r}}let s=this.getAttribute("place");if(s){let n=this.#g(s);if(n)return n}let a=document.querySelector('meta[name="geo.position"]');if(a){let r=(a.getAttribute("content")||"").split(";");if(r.length===2){let c=parseFloat(r[0]),h=parseFloat(r[1]);if(!isNaN(c)&&!isNaN(h))return{lat:c,lng:h}}}return null}#m(t){let e=document.getElementById(t);if(!e)return null;if(e.tagName==="ADDRESS"&&e.dataset.lat&&e.dataset.lng){let i=parseFloat(e.dataset.lat),o=parseFloat(e.dataset.lng);if(!isNaN(i)&&!isNaN(o))return{lat:i,lng:o}}return e.tagName==="SCRIPT"&&e.type==="application/ld+json"?this.#s(e):null}#g(t){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let i of e)try{let o=JSON.parse(i.textContent);if(o.name===t){let s=o.geo;if(s){let a=parseFloat(s.latitude),n=parseFloat(s.longitude);if(!isNaN(a)&&!isNaN(n))return{lat:a,lng:n}}}}catch{}return null}#s(t){try{let i=JSON.parse(t.textContent).geo;if(i){let o=parseFloat(i.latitude),s=parseFloat(i.longitude);if(!isNaN(o)&&!isNaN(s))return{lat:o,lng:s}}}catch{}return null}setup(){this.render(),this.loadTiles(),this.#i()}attributeChangedCallback(t,e,i){e!==i&&this.isConnected&&(this.#o&&this.#f(),this.render(),this.loadTiles(),this.#i())}teardown(){this.#o&&(this.#o.destroy(),this.#o=null)}render(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN,o=!isNaN(e)&&!isNaN(i);this.children.length>0?this.setAttribute("data-has-caption",""):this.removeAttribute("data-has-caption");let a=o?`Map of ${e.toFixed(4)}, ${i.toFixed(4)}`:"Map",n=this.showMarker&&o?`<div part="marker" aria-hidden="true">${_(this.markerColor)}</div>`:"",c=o&&this.interactive!=="none"&&!this.staticOnly?'<div part="overlay"><button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button></div>':"";this.shadowRoot.innerHTML=`
            <style>${L}</style>
            <div part="container">
                <div part="tiles" role="img" aria-label="${a}"></div>
                ${n}
                ${c}
                <div part="caption"><slot></slot></div>
                <div part="attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap</a>
                </div>
            </div>
        `}loadTiles(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i)){this.handleError("Missing or invalid lat/lng coordinates");return}let o=this.zoom,s=this.provider,{tileX:a,tileY:n,pixelX:r,pixelY:c}=$(e,i,o),h=this.shadowRoot.querySelector('[part="tiles"]');if(!h)return;h.innerHTML="";let d=this,u=d.offsetWidth||400,f=d.offsetHeight||300,b=Math.round(u/2-256-r),z=Math.round(f/2-256-c);h.style.transform=`translate(${b}px, ${z}px)`;let y=0,m=0,w=9;for(let x=-1;x<=1;x++)for(let M=-1;M<=1;M++){let D=a+M,q=n+x,R=v(s,o,D,q),p=document.createElement("img");p.src=R,p.alt="",p.loading="lazy",p.draggable=!1,p.addEventListener("load",()=>{y++,y+m===w&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:o}}))}),p.addEventListener("error",()=>{m++,m===w?this.handleError("Failed to load map tiles"):y+m===w&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:o}}))}),h.appendChild(p)}}#i(){let t=this.shadowRoot.querySelector('[part="overlay"]');if(!t)return;let e=t.querySelector('[part="activate"]');t.addEventListener("mouseenter",()=>this.#r(),{once:!0}),e&&e.addEventListener("focus",()=>this.#r(),{once:!0}),e&&e.addEventListener("click",()=>this.#u()),this.interactive==="eager"&&requestAnimationFrame(()=>this.#u())}#r(){if(this.#a)return;this.#a=!0;let t=this.provider,e;t==="carto-light"||t==="carto-dark"?e="https://basemaps.cartocdn.com":e="https://tile.openstreetmap.org";let i=document.createElement("link");i.rel="preconnect",i.href=e,i.crossOrigin="",document.head.appendChild(i)}async#u(){if(this.#o)return;let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i))return;let{MapInteraction:o}=await Promise.resolve().then(()=>(F(),P));this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.focus(),this.setAttribute("data-interactive-active",""),this.#o=new o({shadow:this.shadowRoot,host:this,lat:e,lng:i,zoom:this.zoom,provider:this.provider,onDeactivate:()=>this.#f()}),this.dispatchEvent(new CustomEvent("geo-map:activate",{bubbles:!0,detail:{lat:e,lng:i,zoom:this.zoom}}))}#f(){this.#o&&(this.#o.destroy(),this.#o=null,this.removeAttribute("data-interactive-active"),this.render(),this.loadTiles(),this.#i())}handleError(t){let e=this.shadowRoot.querySelector('[part="container"]');e&&(e.setAttribute("data-state","error"),e.setAttribute("data-error",t)),this.dispatchEvent(new CustomEvent("geo-map:error",{bubbles:!0,detail:{message:t}}))}};C("geo-map",N);export{N as GeoMap};
//# sourceMappingURL=geo-map.js.map
