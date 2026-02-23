var t=class extends HTMLElement{static observedAttributes=["font-family","label","sample","show-scale","show-weights","show-characters","weights"];connectedCallback(){this.#s()}attributeChangedCallback(){this.isConnected&&this.#s()}#s(){let a=this.getAttribute("font-family")||"system-ui",n=this.getAttribute("label")||a.replace(/['"]/g,"").split(",")[0],l=this.getAttribute("sample")||"The quick brown fox jumps over the lazy dog",c=this.hasAttribute("show-scale"),p=this.hasAttribute("show-weights"),h=this.hasAttribute("show-characters"),m=(this.getAttribute("weights")||"300,400,500,600,700").split(",").map(s=>s.trim()),e="";if(e+=`<div class="specimen-header" style="font-family:${a}">
      <span class="specimen-label">${n}</span>
      <p class="specimen-sample" contenteditable="plaintext-only" spellcheck="false">${l}</p>
    </div>`,h&&(e+=`<div class="specimen-chars" style="font-family:${a}">
        <div class="char-row"><span class="char-label">Upper</span>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(s=>`<span>${s}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Lower</span>${"abcdefghijklmnopqrstuvwxyz".split("").map(s=>`<span>${s}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Digits</span>${"0123456789".split("").map(s=>`<span>${s}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Punct</span>${"!@#$%^&*()_+-=[]{}|;:,.<>?".split("").map(s=>`<span>${s==="<"?"&lt;":s===">"?"&gt;":s==="&"?"&amp;":s}</span>`).join("")}</div>
      </div>`),p){e+='<div class="specimen-weights">';for(let s of m)e+=`<div class="weight-sample" style="font-family:${a};font-weight:${s}">
          <span class="weight-label">${s}</span>
          <span class="weight-text">Aa</span>
        </div>`;e+="</div>"}if(c){let s=[{name:"xs",rem:.75},{name:"sm",rem:.875},{name:"md",rem:1},{name:"lg",rem:1.125},{name:"xl",rem:1.25},{name:"2xl",rem:1.5},{name:"3xl",rem:1.875},{name:"4xl",rem:2.25},{name:"5xl",rem:3}];e+='<div class="specimen-scale">';for(let i of s)e+=`<div class="scale-step" style="font-family:${a};font-size:${i.rem}rem">
          <span class="scale-label">${i.name}</span>
          <span class="scale-text">${l.substring(0,30)}</span>
        </div>`;e+="</div>"}this.innerHTML=e}};customElements.define("type-specimen-wc",t);
