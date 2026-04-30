var X=Object.defineProperty;var A=(l,t)=>()=>(l&&(t=l(l=0)),t);var Y=(l,t)=>{for(var e in t)X(l,e,{get:t[e],enumerable:!0})};function S(l,t,e){let i=Math.pow(2,e),r=l*Math.PI/180,o=(t+180)/360*i,n=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*i,a=Math.floor(o),s=Math.floor(n),h=Math.round((o-a)*256),c=Math.round((n-s)*256);return{tileX:a,tileY:s,pixelX:h,pixelY:c}}function $(l,t,e){let i=256*Math.pow(2,e),r=l/i*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*t/i)))*180/Math.PI,lng:r}}function v(l,t,e,i,r){if(r)return r.replace("{z}",String(t)).replace("{x}",String(e)).replace("{y}",String(i));switch(l){case"carto-light":return`https://basemaps.cartocdn.com/light_all/${t}/${e}/${i}.png`;case"carto-dark":return`https://basemaps.cartocdn.com/dark_all/${t}/${e}/${i}.png`;default:return`https://tile.openstreetmap.org/${t}/${e}/${i}.png`}}var k=A(()=>{});var P={};Y(P,{MapInteraction:()=>E});var E,F=A(()=>{k();E=class{#r;#n;#t;#f;#m;#g;#i=0;#o=0;#s=15;#u=1;#N=19;#l=0;#a=0;#c=new Map;#e=null;#v=0;#b=0;#y=!1;#w=0;#x=0;constructor({shadow:t,host:e,lat:i,lng:r,zoom:o,provider:n,tileUrl:a,onDeactivate:s}){this.#r=t,this.#n=e,this.#f=n,this.#m=a||"",this.#g=s,this.#s=o,this.#t=t.querySelector('[part="tiles"]'),this.#e=t.querySelector('[part="marker"]');let h=256*Math.pow(2,o),c=i*Math.PI/180;this.#i=(r+180)/360*h,this.#o=(1-Math.log(Math.tan(c)+1/Math.cos(c))/Math.PI)/2*h,this.#v=this.#i,this.#b=this.#o,this.#l=this.#n.offsetWidth||400,this.#a=this.#n.offsetHeight||300,this.#t.innerHTML="",this.#t.style.transform="",this.#e&&(this.#e.style.position="absolute",this.#e.style.top="",this.#e.style.left="",this.#t.appendChild(this.#e)),this.#C(),this.#h()}#C(){this.#t.addEventListener("pointerdown",this.#A),this.#t.addEventListener("wheel",this.#L,{passive:!1}),this.#n.addEventListener("keydown",this.#S)}#A=t=>{t.button===0&&(t.preventDefault(),this.#y=!0,this.#w=t.clientX,this.#x=t.clientY,this.#t.setPointerCapture(t.pointerId),this.#t.setAttribute("data-dragging",""),this.#t.addEventListener("pointermove",this.#M),this.#t.addEventListener("pointerup",this.#k))};#M=t=>{if(!this.#y)return;let e=t.clientX-this.#w,i=t.clientY-this.#x;this.#w=t.clientX,this.#x=t.clientY,this.#i-=e,this.#o-=i,this.#d(),this.#h()};#k=t=>{this.#y=!1,this.#t.releasePointerCapture(t.pointerId),this.#t.removeAttribute("data-dragging"),this.#t.removeEventListener("pointermove",this.#M),this.#t.removeEventListener("pointerup",this.#k),this.#p()};#L=t=>{t.preventDefault();let e=t.ctrlKey?-t.deltaY*.01:-Math.sign(t.deltaY),i=Math.round(Math.max(this.#u,Math.min(this.#N,this.#s+e)));if(i===this.#s)return;let r=this.#n.getBoundingClientRect(),o=t.clientX-r.left,n=t.clientY-r.top;this.#E(i,o,n)};#S=t=>{switch(t.key){case"ArrowLeft":t.preventDefault(),this.#i-=80,this.#d(),this.#h(),this.#p();break;case"ArrowRight":t.preventDefault(),this.#i+=80,this.#d(),this.#h(),this.#p();break;case"ArrowUp":t.preventDefault(),this.#o-=80,this.#d(),this.#h(),this.#p();break;case"ArrowDown":t.preventDefault(),this.#o+=80,this.#d(),this.#h(),this.#p();break;case"+":case"=":t.preventDefault(),this.#E(this.#s+1,this.#l/2,this.#a/2);break;case"-":t.preventDefault(),this.#E(this.#s-1,this.#l/2,this.#a/2);break;case"Escape":t.preventDefault(),this.#g();break}};#E(t,e,i){if(t=Math.max(this.#u,Math.min(this.#N,t)),t===this.#s)return;let r=this.#i-this.#l/2,o=this.#o-this.#a/2,n=r+e,a=o+i,s=Math.pow(2,t-this.#s);this.#i=n*s-e+this.#l/2,this.#o=a*s-i+this.#a/2,this.#v*=s,this.#b*=s,this.#s=t,this.#$(),this.#d(),this.#h(),this.#p()}#d(){let t=256*Math.pow(2,this.#s);this.#i=(this.#i%t+t)%t,this.#o=Math.max(this.#a/2,Math.min(t-this.#a/2,this.#o))}#h(){let t=-(this.#i-this.#l/2),e=-(this.#o-this.#a/2);this.#t.style.transform=`translate(${Math.round(t)}px, ${Math.round(e)}px)`,this.#T(),this.#F(),this.#z()}#T(){let t=this.#s,e=Math.pow(2,t),i=this.#i-this.#l/2,r=this.#o-this.#a/2,o=i+this.#l,n=r+this.#a,a=Math.floor(i/256)-1,s=Math.max(0,Math.floor(r/256)-1),h=Math.ceil(o/256)+1,c=Math.min(e,Math.ceil(n/256)+1);for(let d=s;d<c;d++)for(let u=a;u<h;u++){let f=(u%e+e)%e,b=`${t}/${f}/${d}`;this.#c.has(b)||this.#P(t,u,d,f)}}#P(t,e,i,r){let o=`${t}/${r}/${i}`;if(this.#c.has(o))return;let n=e*256,a=i*256,s=document.createElement("img");s.src=v(this.#f,t,r,i,this.#m),s.alt="",s.draggable=!1,s.style.left=n+"px",s.style.top=a+"px",s.style.width="256px",s.style.height="256px",s._wx=n,s._wy=a,this.#c.set(o,s),this.#t.appendChild(s)}#F(){let t=this.#i-this.#l/2,e=this.#o-this.#a/2,i=512;for(let[r,o]of this.#c){let n=o._wx,a=o._wy;(n+256<t-i||n>t+this.#l+i||a+256<e-i||a>e+this.#a+i)&&(o.remove(),this.#c.delete(r))}}#z(){if(!this.#e)return;let t=this.#e.offsetWidth||32;this.#e.style.left=`${Math.round(this.#v-t/2)}px`,this.#e.style.top=`${Math.round(this.#b-t)}px`,this.#e.style.transform=""}#p(){let{lat:t,lng:e}=$(this.#i,this.#o,this.#s);this.#n.dispatchEvent(new CustomEvent("geo-map:move",{bubbles:!0,detail:{lat:+t.toFixed(6),lng:+e.toFixed(6),zoom:this.#s}}))}#$(){for(let t of this.#c.values())t.remove();this.#c.clear()}destroy(){if(this.#t.removeEventListener("pointerdown",this.#A),this.#t.removeEventListener("wheel",this.#L),this.#n.removeEventListener("keydown",this.#S),this.#t.removeEventListener("pointermove",this.#M),this.#t.removeEventListener("pointerup",this.#k),this.#e&&this.#e.parentNode===this.#t){let t=this.#r.querySelector('[part="container"]');t&&(t.insertBefore(this.#e,this.#t.nextSibling),this.#e.style.position="",this.#e.style.left="",this.#e.style.top="",this.#e.style.transform="")}this.#$(),this.#n.removeAttribute("data-interactive-active")}}});var g=class extends HTMLElement{#r=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#r)t();this.#r=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,r){t.addEventListener(e,i,r),this.#r.push(()=>t.removeEventListener(e,i,r))}setup(){}teardown(){}};var L=`
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
`;k();var H=window.matchMedia("(prefers-reduced-motion: reduce)");var C=new Map;function T(l,t,e={}){let i=e.priority??10,r={impl:t,bundle:e.bundle,contract:e.contract,priority:i},o=C.get(l);if(customElements.get(l)){if(!o||o.priority>=i){o&&o.priority===i&&o.impl!==t&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${l}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=i){o.priority===i&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${o.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}C.set(l,r),customElements.define(l,t)}function _(l){return`<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${l}"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`}var N=class extends g{static get observedAttributes(){return["lat","lng","zoom","marker","marker-color","provider","tile-url","interactive","static-only","src","place"]}#r=null;#n=!1;constructor(){super(),this.attachShadow({mode:"open"})}get lat(){return parseFloat(this.getAttribute("lat")??"")}get lng(){return parseFloat(this.getAttribute("lng")??"")}get zoom(){let t=parseInt(this.getAttribute("zoom")??"",10);return t>=1&&t<=19?t:15}get showMarker(){return this.getAttribute("marker")!=="false"}get markerColor(){return this.getAttribute("marker-color")||"#e74c3c"}get provider(){return this.getAttribute("provider")||"osm"}get tileUrl(){return this.getAttribute("tile-url")||""}get interactive(){let t=this.getAttribute("interactive");return t==="eager"||t==="none"?t:"click"}get staticOnly(){return this.hasAttribute("static-only")}#t(){let t=parseFloat(this.getAttribute("lat")??""),e=parseFloat(this.getAttribute("lng")??"");if(!isNaN(t)&&!isNaN(e))return{lat:t,lng:e};let i=this.getAttribute("src");if(i){let a=this.#f(i);if(a)return a}let r=this.querySelector("address[data-lat][data-lng]");if(r){let a=parseFloat(r.dataset.lat??""),s=parseFloat(r.dataset.lng??"");if(!isNaN(a)&&!isNaN(s))return{lat:a,lng:s}}let o=this.getAttribute("place");if(o){let a=this.#m(o);if(a)return a}let n=document.querySelector('meta[name="geo.position"]');if(n){let s=(n.getAttribute("content")||"").split(";");if(s.length===2){let h=parseFloat(s[0]),c=parseFloat(s[1]);if(!isNaN(h)&&!isNaN(c))return{lat:h,lng:c}}}return null}#f(t){let e=document.getElementById(t);if(!e)return null;if(e.tagName==="ADDRESS"&&e.dataset.lat&&e.dataset.lng){let i=parseFloat(e.dataset.lat),r=parseFloat(e.dataset.lng);if(!isNaN(i)&&!isNaN(r))return{lat:i,lng:r}}return e.tagName==="SCRIPT"&&e.type==="application/ld+json"?this.#g(e):null}#m(t){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let i of e)try{let r=JSON.parse(i.textContent);if(r.name===t){let o=r.geo;if(o){let n=parseFloat(o.latitude),a=parseFloat(o.longitude);if(!isNaN(n)&&!isNaN(a))return{lat:n,lng:a}}}}catch{}return null}#g(t){try{let i=JSON.parse(t.textContent).geo;if(i){let r=parseFloat(i.latitude),o=parseFloat(i.longitude);if(!isNaN(r)&&!isNaN(o))return{lat:r,lng:o}}}catch{}return null}setup(){this.render(),this.loadTiles(),this.#i()}attributeChangedCallback(t,e,i){e!==i&&this.isConnected&&(this.#r&&this.#u(),this.render(),this.loadTiles(),this.#i())}teardown(){this.#r&&(this.#r.destroy(),this.#r=null)}render(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN,r=!isNaN(e)&&!isNaN(i);this.children.length>0?this.setAttribute("data-has-caption",""):this.removeAttribute("data-has-caption");let n=r?`Map of ${e.toFixed(4)}, ${i.toFixed(4)}`:"Map",a=this.showMarker&&r?`<div part="marker" aria-hidden="true">${_(this.markerColor)}</div>`:"",h=r&&this.interactive!=="none"&&!this.staticOnly?'<div part="overlay"><button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button></div>':"";this.shadowRoot.innerHTML=`
            <style>${L}</style>
            <div part="container">
                <div part="tiles" role="img" aria-label="${n}"></div>
                ${a}
                ${h}
                <div part="caption"><slot></slot></div>
                <div part="attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap</a>
                </div>
            </div>
        `}loadTiles(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i)){this.handleError("Missing or invalid lat/lng coordinates");return}let r=this.zoom,o=this.provider,{tileX:n,tileY:a,pixelX:s,pixelY:h}=S(e,i,r),c=this.shadowRoot.querySelector('[part="tiles"]');if(!c)return;c.innerHTML="";let d=this,u=d.offsetWidth||400,f=d.offsetHeight||300,b=Math.round(u/2-256-s),z=Math.round(f/2-256-h);c.style.transform=`translate(${b}px, ${z}px)`;let y=0,m=0,w=9;for(let x=-1;x<=1;x++)for(let M=-1;M<=1;M++){let D=n+M,q=a+x,R=v(o,r,D,q,this.tileUrl),p=document.createElement("img");p.src=R,p.alt="",p.loading="lazy",p.draggable=!1,p.addEventListener("load",()=>{y++,y+m===w&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:r}}))}),p.addEventListener("error",()=>{m++,m===w?this.handleError("Failed to load map tiles"):y+m===w&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:r}}))}),c.appendChild(p)}}#i(){let t=this.shadowRoot.querySelector('[part="overlay"]');if(!t)return;let e=t.querySelector('[part="activate"]');t.addEventListener("mouseenter",()=>this.#o(),{once:!0}),e&&e.addEventListener("focus",()=>this.#o(),{once:!0}),e&&e.addEventListener("click",()=>this.#s()),this.interactive==="eager"&&requestAnimationFrame(()=>this.#s())}#o(){if(this.#n)return;let t=this.tileUrl;if(t)try{let o=new URL(t,location.origin);if(o.origin===location.origin){this.#n=!0;return}this.#n=!0;let n=document.createElement("link");n.rel="preconnect",n.href=o.origin,n.crossOrigin="",document.head.appendChild(n);return}catch{}this.#n=!0;let e=this.provider,i;e==="carto-light"||e==="carto-dark"?i="https://basemaps.cartocdn.com":i="https://tile.openstreetmap.org";let r=document.createElement("link");r.rel="preconnect",r.href=i,r.crossOrigin="",document.head.appendChild(r)}async#s(){if(this.#r)return;let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i))return;let{MapInteraction:r}=await Promise.resolve().then(()=>(F(),P));this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.focus(),this.setAttribute("data-interactive-active",""),this.#r=new r({shadow:this.shadowRoot,host:this,lat:e,lng:i,zoom:this.zoom,provider:this.provider,tileUrl:this.tileUrl,onDeactivate:()=>this.#u()}),this.dispatchEvent(new CustomEvent("geo-map:activate",{bubbles:!0,detail:{lat:e,lng:i,zoom:this.zoom}}))}#u(){this.#r&&(this.#r.destroy(),this.#r=null,this.removeAttribute("data-interactive-active"),this.render(),this.loadTiles(),this.#i())}handleError(t){let e=this.shadowRoot.querySelector('[part="container"]');e&&(e.setAttribute("data-state","error"),e.setAttribute("data-error",t)),this.dispatchEvent(new CustomEvent("geo-map:error",{bubbles:!0,detail:{message:t}}))}};T("geo-map",N);export{N as GeoMap};
//# sourceMappingURL=geo-map.js.map
