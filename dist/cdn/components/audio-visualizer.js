var d=new Map;function w(){if(!d.has("default"))try{d.set("default",new AudioContext)}catch{return null}return d.get("default")}var f=new WeakMap;function p(l,t){if(f.has(l))return f.get(l);let e=t.createMediaElementSource(l);return f.set(l,e),e}var m=class extends HTMLElement{#c=null;#A=null;#s=null;#e=null;#t=null;#l=null;#i=null;#o=null;#a=!0;#n=!1;#r=!1;static get observedAttributes(){return["for","data-mode","data-fft-size"]}connectedCallback(){this.#r=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.#f(),this.#u(),this.#w(),this.#p()}disconnectedCallback(){this.#d(),this.#o?.disconnect()}attributeChangedCallback(t){t==="for"&&this.#u()}#f(){let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>
        :host {
          display: block;
          --_color: var(--audio-visualizer-color, var(--color-primary, oklch(55% 0.2 260)));
          --_bg: var(--audio-visualizer-bg, transparent);
          --_height: var(--audio-visualizer-height, 80px);
          --_radius: var(--audio-visualizer-radius, var(--radius-m, 0.5rem));
        }
        canvas {
          display: block;
          width: 100%;
          height: var(--_height);
          background: var(--_bg);
          border-radius: var(--_radius);
        }
      </style>
      <canvas aria-hidden="true"></canvas>
    `,this.#c=t.querySelector("canvas")}#u(){let t=this.getAttribute("for");t&&(this.#s=document.getElementById(t),!(!this.#s||this.#s.tagName!=="AUDIO")&&(this.#n||this.#s.addEventListener("play",()=>this.#m(),{once:!0})))}#m(){if(this.#n||(this.#n=!0,this.#e=w(),!this.#e))return;this.#e.state==="suspended"&&this.#e.resume();let t=parseInt(this.getAttribute("data-fft-size")||"256",10);this.#t=this.#e.createAnalyser(),this.#t.fftSize=t,this.#t.smoothingTimeConstant=.8,this.#l=p(this.#s,this.#e),this.#l.connect(this.#t),this.#t.connect(this.#e.destination),this.#h()}#h(){if(this.#r)return;let t=()=>{if(!this.#a||this.#r){this.#i=null;return}this.#i=requestAnimationFrame(t),this.#g()};this.#i=requestAnimationFrame(t)}#d(){this.#i&&(cancelAnimationFrame(this.#i),this.#i=null)}#g(){let t=this.#c,e=t.getContext("2d"),s=t.width=t.offsetWidth*(window.devicePixelRatio||1),a=t.height=t.offsetHeight*(window.devicePixelRatio||1),n=getComputedStyle(this),o=n.getPropertyValue("--_color").trim()||"oklch(55% 0.2 260)",r=n.getPropertyValue("--_bg").trim()||"transparent";if(e.clearRect(0,0,s,a),r!=="transparent"&&(e.fillStyle=r,e.fillRect(0,0,s,a)),!this.#t)return;let h=this.getAttribute("data-mode")||"bars",c=this.#t.frequencyBinCount,i=new Uint8Array(c);h==="waveform"?(this.#t.getByteTimeDomainData(i),this.#y(e,s,a,o,i)):h==="circle"?(this.#t.getByteFrequencyData(i),this.#b(e,s,a,o,i)):(this.#t.getByteFrequencyData(i),this.#v(e,s,a,o,i))}#v(t,e,s,a,n){let o=Math.min(n.length,64),r=e/o-1;t.fillStyle=a;for(let h=0;h<o;h++){let i=n[h]/255*s,u=h*(e/o);t.fillRect(u,s-i,r,i)}}#y(t,e,s,a,n){let o=e/n.length;t.strokeStyle=a,t.lineWidth=2,t.beginPath();for(let r=0;r<n.length;r++){let c=n[r]/128*s/2;r===0?t.moveTo(0,c):t.lineTo(r*o,c)}t.stroke()}#b(t,e,s,a,n){let o=e/2,r=s/2,h=Math.min(e,s)*.25,c=n.length;t.strokeStyle=a,t.lineWidth=2,t.beginPath();for(let i=0;i<c;i++){let u=i/c*Math.PI*2,b=n[i]/255*(h*.8),g=h+b,v=o+g*Math.cos(u),y=r+g*Math.sin(u);i===0?t.moveTo(v,y):t.lineTo(v,y)}t.closePath(),t.stroke()}#w(){this.#o=new IntersectionObserver(([t])=>{this.#a=t.isIntersecting,this.#a&&this.#n&&!this.#i&&!this.#r&&this.#h()}),this.#o.observe(this)}#p(){window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",t=>{this.#r=t.matches,t.matches?this.#d():this.#n&&this.#a&&this.#h()})}};customElements.define("audio-visualizer",m);export{m as AudioVisualizerElement};
//# sourceMappingURL=audio-visualizer.js.map
