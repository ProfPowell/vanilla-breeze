var y=window.matchMedia("(prefers-reduced-motion: reduce)");var u=new Map;function p(s,t,e={}){let n=e.priority??10,a={impl:t,bundle:e.bundle,contract:e.contract,priority:n},o=u.get(s);if(customElements.get(s)){if(!o||o.priority>=n){o&&o.priority===n&&o.impl!==t&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=n){o.priority===n&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${o.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}u.set(s,a),customElements.define(s,t)}var l=class extends HTMLElement{#t=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,n,a){t.addEventListener(e,n,a),this.#t.push(()=>t.removeEventListener(e,n,a))}setup(){}teardown(){}};var i={optout:"vb_optout",sessionCount:"vb_sc",eventQueue:"vb_q"};function h(s){return String(s).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function f(s){return typeof s!="number"||s<=0?"\u2014":s<6e4?`${Math.round(s/1e3)}s`:`${Math.floor(s/6e4)}m ${Math.round(s%6e4/1e3)}s`}var d=class extends l{setup(){this.#e(),this.listen(this,"click",this.#t)}get isOptedOut(){try{return sessionStorage.getItem(i.optout)==="1"}catch{return!1}}get sessionCounter(){try{let t=sessionStorage.getItem(i.sessionCount);return t?JSON.parse(t):null}catch{return null}}get queuedEvents(){try{let t=sessionStorage.getItem(i.eventQueue);return t?JSON.parse(t):[]}catch{return[]}}get hasSessionData(){return this.sessionCounter!=null||this.queuedEvents.length>0}#t=t=>{let e=t.target?.closest?.("[data-analytics-action]");if(!e||!this.contains(e))return;let n=e.dataset.analyticsAction;n==="clear"&&this.#s(),n==="optout"&&this.#n(),n==="refresh"&&this.#e()};#s(){try{sessionStorage.removeItem(i.sessionCount),sessionStorage.removeItem(i.eventQueue)}catch{}this.dispatchEvent(new CustomEvent("analytics-panel:cleared",{bubbles:!0,composed:!0})),this.#e()}#n(){let t=!this.isOptedOut;try{t?sessionStorage.setItem(i.optout,"1"):sessionStorage.removeItem(i.optout)}catch{}this.dispatchEvent(new CustomEvent(t?"analytics-panel:optout":"analytics-panel:optin",{bubbles:!0,composed:!0})),t?this.#s():this.#e()}#e(){let t=this.getAttribute("title")||"Analytics data",e=this.isOptedOut,n=this.hasSessionData;this.innerHTML=`
      <header class="analytics-panel__header">
        <h3>${h(t)}</h3>
        <p class="analytics-panel__status" role="status">
          <span class="analytics-panel__dot analytics-panel__dot--${e?"paused":"active"}" aria-hidden="true"></span>
          ${e?"Analytics paused for this tab. No data is being collected.":"Analytics active. Only aggregate, device-scoped data is collected."}
        </p>
      </header>

      <section class="analytics-panel__body">
        <h4>Stored on this device (this session only)</h4>
        ${this.#o()}
      </section>

      <footer class="analytics-panel__actions">
        ${n?`
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
    `}#o(){if(!this.hasSessionData)return'<p class="analytics-panel__empty">No data stored on this device in this session.</p>';let t=this.sessionCounter,e=this.queuedEvents,n=e.find(c=>c?.id==="__scroll"),a=e.find(c=>c?.id==="__attention"),o=e.filter(c=>!c?.id?.startsWith?.("__")).length,r=[];return t?.v!=null&&r.push(`<dt>Pages this session</dt><dd>${t.v}</dd>`),n&&r.push(`<dt>Max scroll depth</dt><dd>${n.params?.depth??"?"}%</dd>`),a&&r.push(`<dt>Active reading time</dt><dd>${f(a.params?.ms)}</dd>`),o>0&&r.push(`<dt>Queued events</dt><dd>${o}</dd>`),`<dl class="analytics-panel__data">${r.join("")}</dl>`}};p("analytics-panel",d);
//# sourceMappingURL=analytics-panel.js.map
