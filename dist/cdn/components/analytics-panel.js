var y=window.matchMedia("(prefers-reduced-motion: reduce)");var u=new Map;function h(n,t,e={}){let s=e.priority??10,o={impl:t,bundle:e.bundle,contract:e.contract,priority:s},a=u.get(n);if(customElements.get(n)){if(!a||a.priority>=s){a&&a.priority===s&&a.impl!==t&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${n}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=s){a.priority===s&&console.warn(`[VB Bundle] Tag <${n}> already registered by "${a.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}u.set(n,o),customElements.define(n,t)}var l=class extends HTMLElement{#e=[];#t;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#e)t();this.#e=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,s,o){t.addEventListener(e,s,o),this.#e.push(()=>t.removeEventListener(e,s,o))}setup(){}teardown(){}setState(t,e){this.#t||(this.#t=this.attachInternals());let s=this.#t.states;try{e?s.add(t):s.delete(t)}catch{let o=`--${t}`;e?s.add(o):s.delete(o)}}_adoptInternals(t){this.#t||(this.#t=t)}};var i={optout:"vb_optout",sessionCount:"vb_sc",eventQueue:"vb_q"};function p(n){return String(n).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function f(n){return typeof n!="number"||n<=0?"\u2014":n<6e4?`${Math.round(n/1e3)}s`:`${Math.floor(n/6e4)}m ${Math.round(n%6e4/1e3)}s`}var d=class extends l{setup(){this.#s(),this.listen(this,"click",this.#e)}get isOptedOut(){try{return sessionStorage.getItem(i.optout)==="1"}catch{return!1}}get sessionCounter(){try{let t=sessionStorage.getItem(i.sessionCount);return t?JSON.parse(t):null}catch{return null}}get queuedEvents(){try{let t=sessionStorage.getItem(i.eventQueue);return t?JSON.parse(t):[]}catch{return[]}}get hasSessionData(){return this.sessionCounter!=null||this.queuedEvents.length>0}#e=t=>{let e=t.target?.closest?.("[data-analytics-action]");if(!e||!this.contains(e))return;let s=e.dataset.analyticsAction;s==="clear"&&this.#t(),s==="optout"&&this.#n(),s==="refresh"&&this.#s()};#t(){try{sessionStorage.removeItem(i.sessionCount),sessionStorage.removeItem(i.eventQueue)}catch{}this.dispatchEvent(new CustomEvent("analytics-panel:cleared",{bubbles:!0,composed:!0})),this.#s()}#n(){let t=!this.isOptedOut;try{t?sessionStorage.setItem(i.optout,"1"):sessionStorage.removeItem(i.optout)}catch{}this.dispatchEvent(new CustomEvent(t?"analytics-panel:optout":"analytics-panel:optin",{bubbles:!0,composed:!0})),t?this.#t():this.#s()}#s(){let t=this.getAttribute("title")||"Analytics data",e=this.isOptedOut,s=this.hasSessionData;this.innerHTML=`
      <header class="analytics-panel__header">
        <h3>${p(t)}</h3>
        <p class="analytics-panel__status" role="status">
          <span class="analytics-panel__dot analytics-panel__dot--${e?"paused":"active"}" aria-hidden="true"></span>
          ${e?"Analytics paused for this tab. No data is being collected.":"Analytics active. Only aggregate, device-scoped data is collected."}
        </p>
      </header>

      <section class="analytics-panel__body">
        <h4>Stored on this device (this session only)</h4>
        ${this.#a()}
      </section>

      <footer class="analytics-panel__actions">
        ${s?`
          <button type="button" data-analytics-action="clear" class="analytics-panel__action analytics-panel__action--danger">
            Clear my data
          </button>
        `:""}
        <button type="button" data-analytics-action="optout" class="analytics-panel__action analytics-panel__action--toggle">
          ${e?"Resume analytics":"Pause analytics"}
        </button>
        <button type="button" data-analytics-action="refresh" class="analytics-panel__action">
          Refresh
        </button>
      </footer>

      <p class="analytics-panel__note">
        No cookies, no cross-site identifiers, no IP address stored.
        Data is cleared automatically when you close this tab.
      </p>
    `}#a(){if(!this.hasSessionData)return'<p class="analytics-panel__empty">No data stored on this device in this session.</p>';let t=this.sessionCounter,e=this.queuedEvents,s=e.find(c=>c?.id==="__scroll"),o=e.find(c=>c?.id==="__attention"),a=e.filter(c=>!c?.id?.startsWith?.("__")).length,r=[];return t?.v!=null&&r.push(`<dt>Pages this session</dt><dd>${t.v}</dd>`),s&&r.push(`<dt>Max scroll depth</dt><dd>${s.params?.depth??"?"}%</dd>`),o&&r.push(`<dt>Active reading time</dt><dd>${f(o.params?.ms)}</dd>`),a>0&&r.push(`<dt>Queued events</dt><dd>${a}</dd>`),`<dl class="analytics-panel__data">${r.join("")}</dl>`}};h("analytics-panel",d);
//# sourceMappingURL=analytics-panel.js.map
