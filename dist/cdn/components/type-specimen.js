var a=class extends HTMLElement{static observedAttributes=["font-family","label","sample","show-scale","show-weights","show-characters","weights"];connectedCallback(){this.#s(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(){this.isConnected&&this.#s()}#s(){let t=this.getAttribute("font-family")||"system-ui",n=this.getAttribute("label")||t.replace(/['"]/g,"").split(",")[0],i=this.getAttribute("sample")||"The quick brown fox jumps over the lazy dog",c=this.hasAttribute("show-scale"),p=this.hasAttribute("show-weights"),r=this.hasAttribute("show-characters"),h=(this.getAttribute("weights")||"300,400,500,600,700").split(",").map(s=>s.trim()),e="";if(e+=`<div class="specimen-header" style="font-family:${t}">
      <span class="specimen-label">${n}</span>
      <p class="specimen-sample" contenteditable="plaintext-only" spellcheck="false">${i}</p>
    </div>`,r&&(e+=`<div class="specimen-chars" style="font-family:${t}">
        <div class="char-row"><span class="char-label">Upper</span>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(s=>`<span>${s}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Lower</span>${"abcdefghijklmnopqrstuvwxyz".split("").map(s=>`<span>${s}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Digits</span>${"0123456789".split("").map(s=>`<span>${s}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Punct</span>${"!@#$%^&*()_+-=[]{}|;:,.<>?".split("").map(s=>`<span>${s==="<"?"&lt;":s===">"?"&gt;":s==="&"?"&amp;":s}</span>`).join("")}</div>
      </div>`),p){e+='<div class="specimen-weights">';for(let s of h)e+=`<div class="weight-sample" style="font-family:${t};font-weight:${s}">
          <span class="weight-label">${s}</span>
          <span class="weight-text">Aa</span>
        </div>`;e+="</div>"}if(c){let s=[{name:"xs",rem:.75},{name:"sm",rem:.875},{name:"md",rem:1},{name:"lg",rem:1.125},{name:"xl",rem:1.25},{name:"2xl",rem:1.5},{name:"3xl",rem:1.875},{name:"4xl",rem:2.25},{name:"5xl",rem:3}];e+='<div class="specimen-scale">';for(let l of s)e+=`<div class="scale-step" style="font-family:${t};font-size:${l.rem}rem">
          <span class="scale-label">${l.name}</span>
          <span class="scale-text">${i.substring(0,30)}</span>
        </div>`;e+="</div>"}this.innerHTML=e}};customElements.define("type-specimen",a);
//# sourceMappingURL=type-specimen.js.map
