var D=Object.defineProperty;var E=(l,t)=>()=>(l&&(t=l(l=0)),t);var R=(l,t)=>{for(var e in t)D(l,e,{get:t[e],enumerable:!0})};function L(l,t,e){let i=Math.pow(2,e),s=l*Math.PI/180,r=(t+180)/360*i,n=(1-Math.log(Math.tan(s)+1/Math.cos(s))/Math.PI)/2*i,a=Math.floor(r),o=Math.floor(n),h=Math.round((r-a)*256),c=Math.round((n-o)*256);return{tileX:a,tileY:o,pixelX:h,pixelY:c}}function T(l,t,e){let i=256*Math.pow(2,e),s=l/i*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*t/i)))*180/Math.PI,lng:s}}function f(l,t,e,i){switch(l){case"carto-light":return`https://basemaps.cartocdn.com/light_all/${t}/${e}/${i}.png`;case"carto-dark":return`https://basemaps.cartocdn.com/dark_all/${t}/${e}/${i}.png`;default:return`https://tile.openstreetmap.org/${t}/${e}/${i}.png`}}var M=E(()=>{});var C={};R(C,{MapInteraction:()=>N});var N,S=E(()=>{M();N=class{#r;#n;#t;#m;#f;#s=0;#i=0;#o=15;#u=1;#g=19;#l=0;#a=0;#h=new Map;#e=null;#v=0;#b=0;#y=!1;#w=0;#x=0;constructor({shadow:t,host:e,lat:i,lng:s,zoom:r,provider:n,onDeactivate:a}){this.#r=t,this.#n=e,this.#m=n,this.#f=a,this.#o=r,this.#t=t.querySelector('[part="tiles"]'),this.#e=t.querySelector('[part="marker"]');let o=256*Math.pow(2,r),h=i*Math.PI/180;this.#s=(s+180)/360*o,this.#i=(1-Math.log(Math.tan(h)+1/Math.cos(h))/Math.PI)/2*o,this.#v=this.#s,this.#b=this.#i,this.#l=this.#n.offsetWidth||400,this.#a=this.#n.offsetHeight||300,this.#t.innerHTML="",this.#t.style.transform="",this.#e&&(this.#e.style.position="absolute",this.#e.style.top="",this.#e.style.left="",this.#t.appendChild(this.#e)),this.#C(),this.#c()}#C(){this.#t.addEventListener("pointerdown",this.#E),this.#t.addEventListener("wheel",this.#A,{passive:!1}),this.#n.addEventListener("keydown",this.#L)}#E=t=>{t.button===0&&(t.preventDefault(),this.#y=!0,this.#w=t.clientX,this.#x=t.clientY,this.#t.setPointerCapture(t.pointerId),this.#t.setAttribute("data-dragging",""),this.#t.addEventListener("pointermove",this.#M),this.#t.addEventListener("pointerup",this.#N))};#M=t=>{if(!this.#y)return;let e=t.clientX-this.#w,i=t.clientY-this.#x;this.#w=t.clientX,this.#x=t.clientY,this.#s-=e,this.#i-=i,this.#d(),this.#c()};#N=t=>{this.#y=!1,this.#t.releasePointerCapture(t.pointerId),this.#t.removeAttribute("data-dragging"),this.#t.removeEventListener("pointermove",this.#M),this.#t.removeEventListener("pointerup",this.#N),this.#p()};#A=t=>{t.preventDefault();let e=t.ctrlKey?-t.deltaY*.01:-Math.sign(t.deltaY),i=Math.round(Math.max(this.#u,Math.min(this.#g,this.#o+e)));if(i===this.#o)return;let s=this.#n.getBoundingClientRect(),r=t.clientX-s.left,n=t.clientY-s.top;this.#k(i,r,n)};#L=t=>{switch(t.key){case"ArrowLeft":t.preventDefault(),this.#s-=80,this.#d(),this.#c(),this.#p();break;case"ArrowRight":t.preventDefault(),this.#s+=80,this.#d(),this.#c(),this.#p();break;case"ArrowUp":t.preventDefault(),this.#i-=80,this.#d(),this.#c(),this.#p();break;case"ArrowDown":t.preventDefault(),this.#i+=80,this.#d(),this.#c(),this.#p();break;case"+":case"=":t.preventDefault(),this.#k(this.#o+1,this.#l/2,this.#a/2);break;case"-":t.preventDefault(),this.#k(this.#o-1,this.#l/2,this.#a/2);break;case"Escape":t.preventDefault(),this.#f();break}};#k(t,e,i){if(t=Math.max(this.#u,Math.min(this.#g,t)),t===this.#o)return;let s=this.#s-this.#l/2,r=this.#i-this.#a/2,n=s+e,a=r+i,o=Math.pow(2,t-this.#o);this.#s=n*o-e+this.#l/2,this.#i=a*o-i+this.#a/2,this.#v*=o,this.#b*=o,this.#o=t,this.#T(),this.#d(),this.#c(),this.#p()}#d(){let t=256*Math.pow(2,this.#o);this.#s=(this.#s%t+t)%t,this.#i=Math.max(this.#a/2,Math.min(t-this.#a/2,this.#i))}#c(){let t=-(this.#s-this.#l/2),e=-(this.#i-this.#a/2);this.#t.style.transform=`translate(${Math.round(t)}px, ${Math.round(e)}px)`,this.#S(),this.#P(),this.#z()}#S(){let t=this.#o,e=Math.pow(2,t),i=this.#s-this.#l/2,s=this.#i-this.#a/2,r=i+this.#l,n=s+this.#a,a=Math.floor(i/256)-1,o=Math.max(0,Math.floor(s/256)-1),h=Math.ceil(r/256)+1,c=Math.min(e,Math.ceil(n/256)+1);for(let d=o;d<c;d++)for(let u=a;u<h;u++){let g=(u%e+e)%e,v=`${t}/${g}/${d}`;this.#h.has(v)||this.#$(t,u,d,g)}}#$(t,e,i,s){let r=`${t}/${s}/${i}`;if(this.#h.has(r))return;let n=e*256,a=i*256,o=document.createElement("img");o.src=f(this.#m,t,s,i),o.alt="",o.draggable=!1,o.style.left=n+"px",o.style.top=a+"px",o.style.width="256px",o.style.height="256px",o._wx=n,o._wy=a,this.#h.set(r,o),this.#t.appendChild(o)}#P(){let t=this.#s-this.#l/2,e=this.#i-this.#a/2,i=512;for(let[s,r]of this.#h){let n=r._wx,a=r._wy;(n+256<t-i||n>t+this.#l+i||a+256<e-i||a>e+this.#a+i)&&(r.remove(),this.#h.delete(s))}}#z(){if(!this.#e)return;let t=this.#e.offsetWidth||32;this.#e.style.left=`${Math.round(this.#v-t/2)}px`,this.#e.style.top=`${Math.round(this.#b-t)}px`,this.#e.style.transform=""}#p(){let{lat:t,lng:e}=T(this.#s,this.#i,this.#o);this.#n.dispatchEvent(new CustomEvent("geo-map:move",{bubbles:!0,detail:{lat:+t.toFixed(6),lng:+e.toFixed(6),zoom:this.#o}}))}#T(){for(let t of this.#h.values())t.remove();this.#h.clear()}destroy(){if(this.#t.removeEventListener("pointerdown",this.#E),this.#t.removeEventListener("wheel",this.#A),this.#n.removeEventListener("keydown",this.#L),this.#t.removeEventListener("pointermove",this.#M),this.#t.removeEventListener("pointerup",this.#N),this.#e&&this.#e.parentNode===this.#t){let t=this.#r.querySelector('[part="container"]');t&&(t.insertBefore(this.#e,this.#t.nextSibling),this.#e.style.position="",this.#e.style.left="",this.#e.style.top="",this.#e.style.transform="")}this.#T(),this.#n.removeAttribute("data-interactive-active")}}});var A=`
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
`;M();function X(l){return`<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${l}"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`}var k=class extends HTMLElement{static get observedAttributes(){return["lat","lng","zoom","marker","marker-color","provider","interactive","static-only","src","place"]}#r=null;#n=!1;constructor(){super(),this.attachShadow({mode:"open"})}get lat(){return parseFloat(this.getAttribute("lat"))}get lng(){return parseFloat(this.getAttribute("lng"))}get zoom(){let t=parseInt(this.getAttribute("zoom"),10);return t>=1&&t<=19?t:15}get showMarker(){return this.getAttribute("marker")!=="false"}get markerColor(){return this.getAttribute("marker-color")||"#e74c3c"}get provider(){return this.getAttribute("provider")||"osm"}get interactive(){let t=this.getAttribute("interactive");return t==="eager"||t==="none"?t:"click"}get staticOnly(){return this.hasAttribute("static-only")}#t(){let t=parseFloat(this.getAttribute("lat")),e=parseFloat(this.getAttribute("lng"));if(!isNaN(t)&&!isNaN(e))return{lat:t,lng:e};let i=this.getAttribute("src");if(i){let a=this.#m(i);if(a)return a}let s=this.querySelector("address[data-lat][data-lng]");if(s){let a=parseFloat(s.dataset.lat),o=parseFloat(s.dataset.lng);if(!isNaN(a)&&!isNaN(o))return{lat:a,lng:o}}let r=this.getAttribute("place");if(r){let a=this.#f(r);if(a)return a}let n=document.querySelector('meta[name="geo.position"]');if(n){let o=(n.getAttribute("content")||"").split(";");if(o.length===2){let h=parseFloat(o[0]),c=parseFloat(o[1]);if(!isNaN(h)&&!isNaN(c))return{lat:h,lng:c}}}return null}#m(t){let e=document.getElementById(t);if(!e)return null;if(e.tagName==="ADDRESS"&&e.dataset.lat&&e.dataset.lng){let i=parseFloat(e.dataset.lat),s=parseFloat(e.dataset.lng);if(!isNaN(i)&&!isNaN(s))return{lat:i,lng:s}}return e.tagName==="SCRIPT"&&e.type==="application/ld+json"?this.#s(e):null}#f(t){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let i of e)try{let s=JSON.parse(i.textContent);if(s.name===t){let r=s.geo;if(r){let n=parseFloat(r.latitude),a=parseFloat(r.longitude);if(!isNaN(n)&&!isNaN(a))return{lat:n,lng:a}}}}catch{}return null}#s(t){try{let i=JSON.parse(t.textContent).geo;if(i){let s=parseFloat(i.latitude),r=parseFloat(i.longitude);if(!isNaN(s)&&!isNaN(r))return{lat:s,lng:r}}}catch{}return null}connectedCallback(){this.render(),this.loadTiles(),this.#i()}attributeChangedCallback(t,e,i){e!==i&&this.isConnected&&(this.#r&&this.#g(),this.render(),this.loadTiles(),this.#i())}disconnectedCallback(){this.#r&&(this.#r.destroy(),this.#r=null)}render(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN,s=!isNaN(e)&&!isNaN(i);this.children.length>0?this.setAttribute("data-has-caption",""):this.removeAttribute("data-has-caption");let n=s?`Map of ${e.toFixed(4)}, ${i.toFixed(4)}`:"Map",a=this.showMarker&&s?`<div part="marker" aria-hidden="true">${X(this.markerColor)}</div>`:"",h=s&&this.interactive!=="none"&&!this.staticOnly?'<div part="overlay"><button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button></div>':"";this.shadowRoot.innerHTML=`
            <style>${A}</style>
            <div part="container">
                <div part="tiles" role="img" aria-label="${n}"></div>
                ${a}
                ${h}
                <div part="caption"><slot></slot></div>
                <div part="attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap</a>
                </div>
            </div>
        `}loadTiles(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i)){this.handleError("Missing or invalid lat/lng coordinates");return}let s=this.zoom,r=this.provider,{tileX:n,tileY:a,pixelX:o,pixelY:h}=L(e,i,s),c=this.shadowRoot.querySelector('[part="tiles"]');if(!c)return;c.innerHTML="";let d=this,u=d.offsetWidth||400,g=d.offsetHeight||300,v=Math.round(u/2-256-o),$=Math.round(g/2-256-h);c.style.transform=`translate(${v}px, ${$}px)`;let b=0,m=0,y=9;for(let w=-1;w<=1;w++)for(let x=-1;x<=1;x++){let P=n+x,z=a+w,F=f(r,s,P,z),p=document.createElement("img");p.src=F,p.alt="",p.loading="lazy",p.draggable=!1,p.addEventListener("load",()=>{b++,b+m===y&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:s}}))}),p.addEventListener("error",()=>{m++,m===y?this.handleError("Failed to load map tiles"):b+m===y&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:s}}))}),c.appendChild(p)}}#i(){let t=this.shadowRoot.querySelector('[part="overlay"]');if(!t)return;let e=t.querySelector('[part="activate"]');t.addEventListener("mouseenter",()=>this.#o(),{once:!0}),e&&e.addEventListener("focus",()=>this.#o(),{once:!0}),e&&e.addEventListener("click",()=>this.#u()),this.interactive==="eager"&&requestAnimationFrame(()=>this.#u())}#o(){if(this.#n)return;this.#n=!0;let t=this.provider,e;t==="carto-light"||t==="carto-dark"?e="https://basemaps.cartocdn.com":e="https://tile.openstreetmap.org";let i=document.createElement("link");i.rel="preconnect",i.href=e,i.crossOrigin="",document.head.appendChild(i)}async#u(){if(this.#r)return;let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i))return;let{MapInteraction:s}=await Promise.resolve().then(()=>(S(),C));this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.focus(),this.setAttribute("data-interactive-active",""),this.#r=new s({shadow:this.shadowRoot,host:this,lat:e,lng:i,zoom:this.zoom,provider:this.provider,onDeactivate:()=>this.#g()}),this.dispatchEvent(new CustomEvent("geo-map:activate",{bubbles:!0,detail:{lat:e,lng:i,zoom:this.zoom}}))}#g(){this.#r&&(this.#r.destroy(),this.#r=null,this.removeAttribute("data-interactive-active"),this.render(),this.loadTiles(),this.#i())}handleError(t){let e=this.shadowRoot.querySelector('[part="container"]');e&&(e.setAttribute("data-state","error"),e.setAttribute("data-error",t)),this.dispatchEvent(new CustomEvent("geo-map:error",{bubbles:!0,detail:{message:t}}))}};customElements.define("geo-map",k);export{k as GeoMap};
