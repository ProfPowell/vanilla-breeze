var I=Object.defineProperty;var A=(l,t)=>()=>(l&&(t=l(l=0)),t);var _=(l,t)=>{for(var e in t)I(l,e,{get:t[e],enumerable:!0})};function L(l,t,e){let i=Math.pow(2,e),r=l*Math.PI/180,o=(t+180)/360*i,a=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*i,n=Math.floor(o),s=Math.floor(a),h=Math.round((o-n)*256),c=Math.round((a-s)*256);return{tileX:n,tileY:s,pixelX:h,pixelY:c}}function $(l,t,e){let i=256*Math.pow(2,e),r=l/i*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*t/i)))*180/Math.PI,lng:r}}function v(l,t,e,i,r){if(r)return r.replace("{z}",String(t)).replace("{x}",String(e)).replace("{y}",String(i));switch(l){case"carto-light":return`https://basemaps.cartocdn.com/light_all/${t}/${e}/${i}.png`;case"carto-dark":return`https://basemaps.cartocdn.com/dark_all/${t}/${e}/${i}.png`;default:return`https://tile.openstreetmap.org/${t}/${e}/${i}.png`}}var M=A(()=>{});var z={};_(z,{MapInteraction:()=>E});var E,P=A(()=>{M();E=class{#o;#e;#t;#f;#m;#g;#r=0;#s=0;#a=15;#u=1;#N=19;#l=0;#n=0;#c=new Map;#i=null;#v=0;#b=0;#y=!1;#w=0;#k=0;constructor({shadow:t,host:e,lat:i,lng:r,zoom:o,provider:a,tileUrl:n,onDeactivate:s}){this.#o=t,this.#e=e,this.#f=a,this.#m=n||"",this.#g=s,this.#a=o,this.#t=t.querySelector('[part="tiles"]'),this.#i=t.querySelector('[part="marker"]');let h=256*Math.pow(2,o),c=i*Math.PI/180;this.#r=(r+180)/360*h,this.#s=(1-Math.log(Math.tan(c)+1/Math.cos(c))/Math.PI)/2*h,this.#v=this.#r,this.#b=this.#s,this.#l=this.#e.offsetWidth||400,this.#n=this.#e.offsetHeight||300,this.#t.innerHTML="",this.#t.style.transform="",this.#i&&(this.#i.style.position="absolute",this.#i.style.top="",this.#i.style.left="",this.#t.appendChild(this.#i)),this.#C(),this.#h()}#C(){this.#t.addEventListener("pointerdown",this.#A),this.#t.addEventListener("wheel",this.#S,{passive:!1}),this.#e.addEventListener("keydown",this.#L)}#A=t=>{t.button===0&&(t.preventDefault(),this.#y=!0,this.#w=t.clientX,this.#k=t.clientY,this.#t.setPointerCapture(t.pointerId),this.#t.setAttribute("data-dragging",""),this.#t.addEventListener("pointermove",this.#x),this.#t.addEventListener("pointerup",this.#M))};#x=t=>{if(!this.#y)return;let e=t.clientX-this.#w,i=t.clientY-this.#k;this.#w=t.clientX,this.#k=t.clientY,this.#r-=e,this.#s-=i,this.#d(),this.#h()};#M=t=>{this.#y=!1,this.#t.releasePointerCapture(t.pointerId),this.#t.removeAttribute("data-dragging"),this.#t.removeEventListener("pointermove",this.#x),this.#t.removeEventListener("pointerup",this.#M),this.#p()};#S=t=>{t.preventDefault();let e=t.ctrlKey?-t.deltaY*.01:-Math.sign(t.deltaY),i=Math.round(Math.max(this.#u,Math.min(this.#N,this.#a+e)));if(i===this.#a)return;let r=this.#e.getBoundingClientRect(),o=t.clientX-r.left,a=t.clientY-r.top;this.#E(i,o,a)};#L=t=>{switch(t.key){case"ArrowLeft":t.preventDefault(),this.#r-=80,this.#d(),this.#h(),this.#p();break;case"ArrowRight":t.preventDefault(),this.#r+=80,this.#d(),this.#h(),this.#p();break;case"ArrowUp":t.preventDefault(),this.#s-=80,this.#d(),this.#h(),this.#p();break;case"ArrowDown":t.preventDefault(),this.#s+=80,this.#d(),this.#h(),this.#p();break;case"+":case"=":t.preventDefault(),this.#E(this.#a+1,this.#l/2,this.#n/2);break;case"-":t.preventDefault(),this.#E(this.#a-1,this.#l/2,this.#n/2);break;case"Escape":t.preventDefault(),this.#g();break}};#E(t,e,i){if(t=Math.max(this.#u,Math.min(this.#N,t)),t===this.#a)return;let r=this.#r-this.#l/2,o=this.#s-this.#n/2,a=r+e,n=o+i,s=Math.pow(2,t-this.#a);this.#r=a*s-e+this.#l/2,this.#s=n*s-i+this.#n/2,this.#v*=s,this.#b*=s,this.#a=t,this.#$(),this.#d(),this.#h(),this.#p()}#d(){let t=256*Math.pow(2,this.#a);this.#r=(this.#r%t+t)%t,this.#s=Math.max(this.#n/2,Math.min(t-this.#n/2,this.#s))}#h(){let t=-(this.#r-this.#l/2),e=-(this.#s-this.#n/2);this.#t.style.transform=`translate(${Math.round(t)}px, ${Math.round(e)}px)`,this.#T(),this.#P(),this.#F()}#T(){let t=this.#a,e=Math.pow(2,t),i=this.#r-this.#l/2,r=this.#s-this.#n/2,o=i+this.#l,a=r+this.#n,n=Math.floor(i/256)-1,s=Math.max(0,Math.floor(r/256)-1),h=Math.ceil(o/256)+1,c=Math.min(e,Math.ceil(a/256)+1);for(let d=s;d<c;d++)for(let u=n;u<h;u++){let f=(u%e+e)%e,b=`${t}/${f}/${d}`;this.#c.has(b)||this.#z(t,u,d,f)}}#z(t,e,i,r){let o=`${t}/${r}/${i}`;if(this.#c.has(o))return;let a=e*256,n=i*256,s=document.createElement("img");s.src=v(this.#f,t,r,i,this.#m),s.alt="",s.draggable=!1,s.style.left=a+"px",s.style.top=n+"px",s.style.width="256px",s.style.height="256px",s._wx=a,s._wy=n,this.#c.set(o,s),this.#t.appendChild(s)}#P(){let t=this.#r-this.#l/2,e=this.#s-this.#n/2,i=512;for(let[r,o]of this.#c){let a=o._wx,n=o._wy;(a+256<t-i||a>t+this.#l+i||n+256<e-i||n>e+this.#n+i)&&(o.remove(),this.#c.delete(r))}}#F(){if(!this.#i)return;let t=this.#i.offsetWidth||32;this.#i.style.left=`${Math.round(this.#v-t/2)}px`,this.#i.style.top=`${Math.round(this.#b-t)}px`,this.#i.style.transform=""}#p(){let{lat:t,lng:e}=$(this.#r,this.#s,this.#a);this.#e.dispatchEvent(new CustomEvent("geo-map:move",{bubbles:!0,detail:{lat:+t.toFixed(6),lng:+e.toFixed(6),zoom:this.#a}}))}#$(){for(let t of this.#c.values())t.remove();this.#c.clear()}destroy(){if(this.#t.removeEventListener("pointerdown",this.#A),this.#t.removeEventListener("wheel",this.#S),this.#e.removeEventListener("keydown",this.#L),this.#t.removeEventListener("pointermove",this.#x),this.#t.removeEventListener("pointerup",this.#M),this.#i&&this.#i.parentNode===this.#t){let t=this.#o.querySelector('[part="container"]');t&&(t.insertBefore(this.#i,this.#t.nextSibling),this.#i.style.position="",this.#i.style.left="",this.#i.style.top="",this.#i.style.transform="")}this.#$(),this.#e.removeAttribute("data-interactive-active")}}});var g=class extends HTMLElement{#o=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#o)t();this.#o=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,r){t.addEventListener(e,i,r),this.#o.push(()=>t.removeEventListener(e,i,r))}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let i=this.#e.states;try{e?i.add(t):i.delete(t)}catch{let r=`--${t}`;e?i.add(r):i.delete(r)}}_adoptInternals(t){this.#e||(this.#e=t)}};var S=`
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

/* Caption (slot projection). Translucent surface over the map; uses
   light-dark() so the pair switches automatically with the page's
   resolved color-scheme (driven by VB tokens). */
[part="caption"] {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--geo-map-caption-bg, light-dark(rgba(255, 255, 255, 0.9), rgba(0, 0, 0, 0.75)));
  color: var(--geo-map-caption-color, var(--color-text, light-dark(#1a1a1a, #e0e0e0)));
  padding: var(--geo-map-caption-padding, 0.5rem 0.75rem);
  font-size: 0.875rem;
  z-index: 3;
}

[part="caption"]:empty,
[part="caption"]:not(:has(*)) {
  display: none;
}

/* Attribution \u2014 translucent surface over the map; same pattern as caption */
[part="attribution"] {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 2px 5px;
  font-size: var(--geo-map-attribution-font-size, 0.625rem);
  background: var(--geo-map-attribution-bg, light-dark(rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0.6)));
  color: var(--geo-map-attribution-color, var(--color-text, light-dark(#333, #ddd)));
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
  color: var(--geo-map-overlay-color, var(--color-text-inverted, #fff));
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
  outline: 2px solid var(--color-text-inverted, #fff);
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
  color: var(--color-text-muted, #666);
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
}
`;M();var j=window.matchMedia("(prefers-reduced-motion: reduce)");var C=new Map;function T(l,t,e={}){let i=e.priority??10,r={impl:t,bundle:e.bundle,contract:e.contract,priority:i},o=C.get(l);if(customElements.get(l)){if(!o||o.priority>=i){o&&o.priority===i&&o.impl!==t&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${l}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=i){o.priority===i&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${o.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}C.set(l,r),customElements.define(l,t)}function B(l){return`<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${l}"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`}var N=class extends g{static get observedAttributes(){return["lat","lng","zoom","marker","marker-color","provider","tile-url","interactive","static-only","src","place"]}#o=null;#e=!1;constructor(){super(),this.attachShadow({mode:"open"})}get lat(){return parseFloat(this.getAttribute("lat")??"")}get lng(){return parseFloat(this.getAttribute("lng")??"")}get zoom(){let t=parseInt(this.getAttribute("zoom")??"",10);return t>=1&&t<=19?t:15}get showMarker(){return this.getAttribute("marker")!=="false"}get markerColor(){return this.getAttribute("marker-color")||"#e74c3c"}get provider(){return this.getAttribute("provider")||"osm"}get tileUrl(){return this.getAttribute("tile-url")||""}get interactive(){let t=this.getAttribute("interactive");return t==="eager"||t==="none"?t:"click"}get staticOnly(){return this.hasAttribute("static-only")}#t(){let t=parseFloat(this.getAttribute("lat")??""),e=parseFloat(this.getAttribute("lng")??"");if(!isNaN(t)&&!isNaN(e))return{lat:t,lng:e};let i=this.getAttribute("src");if(i){let n=this.#f(i);if(n)return n}let r=this.querySelector("address[data-lat][data-lng]");if(r){let n=parseFloat(r.dataset.lat??""),s=parseFloat(r.dataset.lng??"");if(!isNaN(n)&&!isNaN(s))return{lat:n,lng:s}}let o=this.getAttribute("place");if(o){let n=this.#m(o);if(n)return n}let a=document.querySelector('meta[name="geo.position"]');if(a){let s=(a.getAttribute("content")||"").split(";");if(s.length===2){let h=parseFloat(s[0]),c=parseFloat(s[1]);if(!isNaN(h)&&!isNaN(c))return{lat:h,lng:c}}}return null}#f(t){let e=document.getElementById(t);if(!e)return null;if(e.tagName==="ADDRESS"&&e.dataset.lat&&e.dataset.lng){let i=parseFloat(e.dataset.lat),r=parseFloat(e.dataset.lng);if(!isNaN(i)&&!isNaN(r))return{lat:i,lng:r}}return e.tagName==="SCRIPT"&&e.type==="application/ld+json"?this.#g(e):null}#m(t){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let i of e)try{let r=JSON.parse(i.textContent);if(r.name===t){let o=r.geo;if(o){let a=parseFloat(o.latitude),n=parseFloat(o.longitude);if(!isNaN(a)&&!isNaN(n))return{lat:a,lng:n}}}}catch{}return null}#g(t){try{let i=JSON.parse(t.textContent).geo;if(i){let r=parseFloat(i.latitude),o=parseFloat(i.longitude);if(!isNaN(r)&&!isNaN(o))return{lat:r,lng:o}}}catch{}return null}setup(){this.render(),this.loadTiles(),this.#r()}attributeChangedCallback(t,e,i){e!==i&&this.isConnected&&(this.#o&&this.#u(),this.render(),this.loadTiles(),this.#r())}teardown(){this.#o&&(this.#o.destroy(),this.#o=null)}get data(){return{lat:isNaN(this.lat)?void 0:this.lat,lng:isNaN(this.lng)?void 0:this.lng,zoom:this.zoom,marker:this.showMarker,markerColor:this.markerColor}}set data(t){if(!t||typeof t!="object")return;let e=this.data;e.lat===t.lat&&e.lng===t.lng&&e.zoom===t.zoom||(t.lat!=null&&this.setAttribute("lat",String(t.lat)),t.lng!=null&&this.setAttribute("lng",String(t.lng)),t.zoom!=null&&this.setAttribute("zoom",String(t.zoom)),t.marker!=null&&this.setAttribute("marker",t.marker?"true":"false"),t.markerColor&&this.setAttribute("marker-color",t.markerColor),this.dispatchEvent(new CustomEvent("geo-map:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}get markers(){let t=this.#t();return t?[{lat:t.lat,lng:t.lng,color:this.markerColor}]:[]}render(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN,r=!isNaN(e)&&!isNaN(i);this.children.length>0?this.setAttribute("data-has-caption",""):this.removeAttribute("data-has-caption");let a=r?`Map of ${e.toFixed(4)}, ${i.toFixed(4)}`:"Map",n=this.showMarker&&r?`<div part="marker" aria-hidden="true">${B(this.markerColor)}</div>`:"",h=r&&this.interactive!=="none"&&!this.staticOnly?'<div part="overlay"><button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button></div>':"";this.shadowRoot.innerHTML=`
            <style>${S}</style>
            <div part="container">
                <div part="tiles" role="img" aria-label="${a}"></div>
                ${n}
                ${h}
                <div part="caption"><slot></slot></div>
                <div part="attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap</a>
                </div>
            </div>
        `}loadTiles(){let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i)){this.handleError("Missing or invalid lat/lng coordinates");return}let r=this.zoom,o=this.provider,{tileX:a,tileY:n,pixelX:s,pixelY:h}=L(e,i,r),c=this.shadowRoot.querySelector('[part="tiles"]');if(!c)return;c.innerHTML="";let d=this,u=d.offsetWidth||400,f=d.offsetHeight||300,b=Math.round(u/2-256-s),F=Math.round(f/2-256-h);c.style.transform=`translate(${b}px, ${F}px)`;let y=0,m=0,w=9;for(let k=-1;k<=1;k++)for(let x=-1;x<=1;x++){let D=a+x,q=n+k,R=v(o,r,D,q,this.tileUrl),p=document.createElement("img");p.src=R,p.alt="",p.loading="lazy",p.draggable=!1,p.addEventListener("load",()=>{y++,y+m===w&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:r}}))}),p.addEventListener("error",()=>{m++,m===w?this.handleError("Failed to load map tiles"):y+m===w&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:r}}))}),c.appendChild(p)}}#r(){let t=this.shadowRoot.querySelector('[part="overlay"]');if(!t)return;let e=t.querySelector('[part="activate"]');t.addEventListener("mouseenter",()=>this.#s(),{once:!0}),e&&e.addEventListener("focus",()=>this.#s(),{once:!0}),e&&e.addEventListener("click",()=>this.#a()),this.interactive==="eager"&&requestAnimationFrame(()=>this.#a())}#s(){if(this.#e)return;let t=this.tileUrl;if(t)try{let o=new URL(t,location.origin);if(o.origin===location.origin){this.#e=!0;return}this.#e=!0;let a=document.createElement("link");a.rel="preconnect",a.href=o.origin,a.crossOrigin="",document.head.appendChild(a);return}catch{}this.#e=!0;let e=this.provider,i;e==="carto-light"||e==="carto-dark"?i="https://basemaps.cartocdn.com":i="https://tile.openstreetmap.org";let r=document.createElement("link");r.rel="preconnect",r.href=i,r.crossOrigin="",document.head.appendChild(r)}async#a(){if(this.#o)return;let t=this.#t(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i))return;let{MapInteraction:r}=await Promise.resolve().then(()=>(P(),z));this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.focus(),this.setAttribute("data-interactive-active",""),this.#o=new r({shadow:this.shadowRoot,host:this,lat:e,lng:i,zoom:this.zoom,provider:this.provider,tileUrl:this.tileUrl,onDeactivate:()=>this.#u()}),this.dispatchEvent(new CustomEvent("geo-map:activate",{bubbles:!0,detail:{lat:e,lng:i,zoom:this.zoom}}))}#u(){this.#o&&(this.#o.destroy(),this.#o=null,this.removeAttribute("data-interactive-active"),this.render(),this.loadTiles(),this.#r())}handleError(t){let e=this.shadowRoot.querySelector('[part="container"]');e&&(e.setAttribute("data-state","error"),e.setAttribute("data-error",t)),this.dispatchEvent(new CustomEvent("geo-map:error",{bubbles:!0,detail:{message:t}}))}};T("geo-map",N);export{N as GeoMap};
//# sourceMappingURL=geo-map.js.map
