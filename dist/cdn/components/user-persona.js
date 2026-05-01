var v=`
  :host {
    display: block;
    font-family: var(--user-persona-font, var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
    --_bg:          var(--user-persona-bg, var(--color-surface, #ffffff));
    --_text:        var(--user-persona-text, var(--color-text, #1a1a1a));
    --_border:      var(--user-persona-border, var(--color-border, #e0e0e0));
    --_muted:       var(--user-persona-muted, var(--color-text-muted, #666));
    --_accent:      var(--user-persona-accent, var(--color-interactive, #0066cc));
    --_card-bg:     var(--user-persona-card-bg, var(--color-surface-raised, #f8f9fa));
    --_radius:      var(--user-persona-radius, var(--radius-xl, 1rem));
    --_avatar-size: var(--user-persona-avatar-size, 80px);
    --_goals:       var(--user-persona-goals, #22c55e);
    --_frustrations: var(--user-persona-frustrations, #ef4444);
    --_behaviors:   var(--user-persona-behaviors, #8b5cf6);
    --_shadow:    var(--user-persona-shadow, var(--shadow-md));
    --_space-2xs: var(--user-persona-space-2xs, var(--size-2xs, 0.25rem));
    --_space-xs:  var(--user-persona-space-xs, var(--size-xs, 0.5rem));
    --_space-s:   var(--user-persona-space-s, var(--size-s, 0.75rem));
    --_space-m:   var(--user-persona-space-m, var(--size-m, 1rem));
    --_space-l:   var(--user-persona-space-l, var(--size-l, 1.5rem));
    --_font-xs:   var(--user-persona-font-xs, var(--font-size-xs, 0.75rem));
    --_font-sm:   var(--user-persona-font-sm, var(--font-size-sm, 0.875rem));
    --_font-md:   var(--user-persona-font-md, var(--font-size-md, 1rem));
    --_font-2xl:  var(--user-persona-font-2xl, var(--font-size-2xl, 1.5rem));
    --_radius-m:  var(--user-persona-radius-m, var(--radius-m, 0.5rem));
    --_radius-l:  var(--user-persona-radius-l, var(--radius-l, 0.75rem));
  }

  .persona-card {
    background: var(--_bg);
    border: 1px solid var(--_border);
    border-radius: var(--_radius);
    overflow: hidden;
    box-shadow: var(--_shadow);
  }

  .persona-header {
    display: flex;
    align-items: center;
    gap: var(--_space-l);
    padding: var(--_space-l);
    background: var(--_card-bg);
    border-bottom: 1px solid var(--_border);
  }

  :host([compact]) .persona-header {
    padding: var(--_space-m);
    gap: var(--_space-m);
  }

  .avatar {
    width: var(--_avatar-size);
    height: var(--_avatar-size);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  :host([compact]) .avatar {
    width: 56px;
    height: 56px;
    font-size: 20px;
  }

  .header-info {
    flex: 1;
    min-width: 0;
  }

  .persona-name {
    font-size: var(--_font-2xl);
    font-weight: 700;
    color: var(--_text);
    margin: 0 0 var(--_space-2xs) 0;
  }

  :host([compact]) .persona-name {
    font-size: 18px;
  }

  .persona-role {
    font-size: var(--_font-md);
    color: var(--_accent);
    font-weight: 500;
    margin: 0;
  }

  :host([compact]) .persona-role {
    font-size: var(--_font-sm);
  }

  .persona-meta {
    display: flex;
    gap: var(--_space-m);
    margin-top: var(--_space-xs);
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--_muted);
  }

  .meta-item svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    opacity: 0.7;
  }

  .persona-quote {
    padding: 20px var(--_space-l);
    background: var(--_card-bg);
    border-bottom: 1px solid var(--_border);
    position: relative;
  }

  :host([compact]) .persona-quote {
    padding: var(--_space-m);
  }

  .quote-mark {
    position: absolute;
    top: 12px;
    left: 16px;
    font-size: 48px;
    line-height: 1;
    color: var(--_accent);
    opacity: 0.2;
    font-family: Georgia, serif;
  }

  .quote-text {
    font-size: var(--_font-md);
    font-style: italic;
    color: var(--_text);
    line-height: 1.6;
    margin: 0;
    padding-left: var(--_space-l);
  }

  :host([compact]) .quote-text {
    font-size: var(--_font-sm);
  }

  .persona-body {
    padding: var(--_space-l);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--_space-l);
  }

  :host([compact]) .persona-body {
    padding: var(--_space-m);
    gap: var(--_space-m);
  }

  .section {
    background: var(--_card-bg);
    border-radius: var(--_radius-l);
    padding: var(--_space-m);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--_space-xs);
    margin-bottom: var(--_space-s);
  }

  .section-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--_radius-m);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .section-icon svg {
    width: 16px;
    height: 16px;
    fill: white;
  }

  .section-icon.bio { background: var(--_accent); }
  .section-icon.goals { background: var(--_goals); }
  .section-icon.frustrations { background: var(--_frustrations); }
  .section-icon.behaviors { background: var(--_behaviors); }

  .section-title {
    font-size: var(--_font-sm);
    font-weight: 600;
    color: var(--_text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-content {
    color: var(--_text);
    font-size: var(--_font-sm);
    line-height: 1.6;
  }

  .section-content ::slotted(ul),
  .section-content ::slotted(ol) {
    margin: 0;
    padding-left: 20px;
  }

  .section-content ::slotted(li) {
    margin-bottom: var(--_space-xs);
  }

  .section-content ::slotted(p) {
    margin: 0;
  }

  @media (max-width: 600px) {
    .persona-header {
      flex-direction: column;
      text-align: center;
    }

    .persona-meta {
      justify-content: center;
    }

    .persona-body {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
    }
  }
`;var T=window.matchMedia("(prefers-reduced-motion: reduce)");var f=new Map;function g(s,e,t={}){let o=t.priority??10,r={impl:e,bundle:t.bundle,contract:t.contract,priority:o},a=f.get(s);if(customElements.get(s)){if(!a||a.priority>=o){a&&a.priority===o&&a.impl!==e&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}" (priority ${a.priority}). Skipping "${t.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${a.bundle}" cannot be replaced (customElements.define is permanent). "${t.bundle}" has higher priority but arrived late.`);return}if(a&&a.priority>=o){a.priority===o&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${a.bundle}". Skipping "${t.bundle}" (first wins at equal priority).`);return}f.set(s,r),customElements.define(s,e)}function n(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function b(s){return s.split(" ").map(e=>e[0]).join("").toUpperCase().slice(0,2)}function x(s){let e=0;for(let o=0;o<s.length;o++)e=s.charCodeAt(o)+((e<<5)-e);return`hsl(${(e%360+360)%360}, 65%, 55%)`}var d={user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',check:'<path d="M20 6 9 17l-5-5"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',alertTriangle:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',messageCircle:'<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',mapPin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',checkCircle:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>'},O={says:{label:"Says",icon:d.messageCircle,color:"#3b82f6"},thinks:{label:"Thinks",icon:d.lightbulb,color:"#8b5cf6"},does:{label:"Does",icon:d.wrench,color:"#f59e0b"},feels:{label:"Feels",icon:d.heart,color:"#ef4444"}};var _="https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait",p=[32,64,128,256,512];function w(s){let e=0;for(let t=0;t<s.length;t++)e=s.charCodeAt(t)+((e<<5)-e);return e}function k(s){let e=p[0],t=Math.abs(s-e);for(let o=1;o<p.length;o++){let r=Math.abs(s-p[o]);r<t&&(e=p[o],t=r)}return e}function y(s,e=128){let t=w(String(s)),o=(t%100+100)%100,r=(t>>>16&1)===0?"female":"male",a=k(e);return`${_}/${r}/${a}/${o}.jpg`}function h(s){let e=0;for(let t=0;t<s.length;t++)e=s.charCodeAt(t)+((e<<5)-e);return e}var S=["Sarah Chen","Marcus Johnson","Aisha Patel","James O'Brien","Yuki Tanaka","Elena Rodriguez","David Kim","Fatima Al-Hassan","Lucas Silva","Priya Sharma","Noah Williams","Mei Lin","Carlos Mendez","Amara Osei","Henrik Larsson","Zara Ahmed"],C=["Product Manager","UX Designer","Frontend Developer","Data Analyst","Marketing Lead","QA Engineer","DevOps Lead","Content Strategist","Startup Founder","IT Director","Customer Success Lead","Research Scientist"],M=["San Francisco, CA","Austin, TX","London, UK","Toronto, CA","Berlin, DE","Tokyo, JP","Sydney, AU","S\xE3o Paulo, BR"],A=["I need tools that help me stay organized without slowing me down.","The dashboard is where I live \u2014 it has to be fast and reliable.","I want to understand the data, not fight the interface.","If it takes more than two clicks, I\u2019ll find another way.","Collaboration shouldn\u2019t mean endless notification noise.","I just want it to work the way I expect it to.","Give me the big picture first, then let me drill into details.","Accessibility isn\u2019t a nice-to-have \u2014 it\u2019s how I use the web."],z=["Streamline daily workflows","Reduce context-switching","Stay aligned with the team","Make data-driven decisions quickly","Ship features on a predictable cadence","Automate repetitive tasks","Improve onboarding experience","Keep documentation up to date"],$=["Too many disconnected tools","Slow page loads break focus","Unclear ownership of tasks","Settings that reset unexpectedly","Notifications that bury important updates","Poor mobile experience","Inconsistent design across features","No offline support"],q=["Checks dashboards every morning","Prefers keyboard shortcuts over mouse","Skims docs, reads deeply only when stuck","Shares screenshots in Slack","Batches email to twice a day","Tests features in incognito first","Bookmarks frequently used reports","Uses dark mode exclusively"],u=class extends HTMLElement{static get observedAttributes(){return["role","age","location","avatar","compact","src"]}#e=new Map;constructor(){super(),this.attachShadow({mode:"open"})}#a(){for(let e of[...this.children]){let t=e.getAttribute("slot");t&&!this.getAttribute(t)&&this.#e.set(t,e.textContent.trim())}}_resolve(e){return this.getAttribute(e)||this.#e.get(e)||""}get data(){return{name:this.personaName,role:this.personaRole||void 0,age:this.age||void 0,location:this.location||void 0,avatar:this.avatar||void 0,quote:this.quote||void 0,bio:this.#e.get("bio")||void 0,goals:this.#e.get("goals")||void 0,frustrations:this.#e.get("frustrations")||void 0,behaviors:this.#e.get("behaviors")||void 0}}set data(e){!e||typeof e!="object"||(this._applyData(e),this.shadowRoot&&this.#t(),this.dispatchEvent(new CustomEvent("user-persona:data-changed",{detail:{data:this.data,source:"property"},bubbles:!0,composed:!0})))}_applyData(e){for(let t of["role","age","location","avatar"])e[t]&&this.setAttribute(t,e[t]);if(e.name&&!this.querySelector('[slot="name"]')){let t=document.createElement("h2");t.slot="name",t.textContent=e.name,this.appendChild(t)}if(e.quote&&!this.querySelector('[slot="quote"]')){let t=document.createElement("p");t.slot="quote",t.textContent=e.quote,this.appendChild(t)}for(let t of["bio","goals","frustrations","behaviors"])e[t]&&this.#e.set(t,e[t])}async _loadSrc(e){if(e)try{let t=await fetch(e);if(!t.ok)throw new Error(`HTTP ${t.status}`);let o=await t.json();this._applyData(o),this.#t()}catch(t){console.warn(`[user-persona] Failed to load src="${e}":`,t)}}connectedCallback(){this.#a(),this.hasAttribute("data-mock")?this.#o():this.hasAttribute("src")&&this._loadSrc(this.getAttribute("src")),this.#t(),this.setAttribute("data-upgraded",""),this.dispatchEvent(new CustomEvent("persona-ready",{bubbles:!0,composed:!0,detail:{name:this.personaName,role:this.personaRole}}))}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(e,t,o){t!==o&&this.shadowRoot&&(e==="src"&&this.isConnected?this._loadSrc(o):this.#t())}get personaName(){return this.querySelector('[slot="name"]')?.textContent?.trim()||this.#e.get("name")||"Unnamed Persona"}get personaRole(){return this.getAttribute("role")||""}get age(){return this.getAttribute("age")||""}get location(){return this.getAttribute("location")||""}get avatar(){return this.getAttribute("avatar")||""}get quote(){return this.querySelector('[slot="quote"]')?.textContent?.trim()||this.#e.get("quote")||""}get compact(){return this.hasAttribute("compact")}#o(){let e=this.dataset.seed||this.dataset.mock||String(Date.now()),t=a=>a[(h(e+a.length)%a.length+a.length)%a.length],o=(a,l)=>{let i=[];for(let c=0;c<l;c++)i.push(a[(h(e+c+a.length)%a.length+a.length)%a.length]);return[...new Set(i)]};if(!this.querySelector('[slot="name"]')){let a=document.createElement("h2");a.slot="name",a.textContent=t(S),this.appendChild(a)}if(this.getAttribute("role")||this.setAttribute("role",t(C)),this.getAttribute("age")||this.setAttribute("age",String(25+(h(e)%30+30)%30)),this.getAttribute("location")||this.setAttribute("location",t(M)),!this.getAttribute("avatar")){let a=this.querySelector('[slot="name"]')?.textContent?.trim()||"Persona";this.setAttribute("avatar",y(a,256))}if(!this.querySelector('[slot="quote"]')){let a=document.createElement("p");a.slot="quote",a.textContent=t(A),this.appendChild(a)}let r=(a,l)=>{if(this.querySelector(`[slot="${a}"]`))return;let i=document.createElement("ul");i.setAttribute("slot",a);for(let c of l){let m=document.createElement("li");m.textContent=c,i.appendChild(m)}this.appendChild(i)};r("goals",o(z,3)),r("frustrations",o($,3)),r("behaviors",o(q,3))}#t(){let e=this.personaName,t=this.personaRole,o=this.age,r=this.location,a=this.avatar,l=this.quote,i=x(e),c=a?`background:url(${n(a)}) center/cover`:`background:${i}`;this.shadowRoot.innerHTML=`
      <style>${v}</style>

      <article class="persona-card" part="card" role="article"
        aria-label="User persona: ${n(e)}">

        <header class="persona-header" part="header">
          <div class="avatar" part="avatar" style="${c}"
            role="img" aria-label="Avatar for ${n(e)}">
            ${a?"":n(b(e))}
          </div>
          <div class="header-info">
            <div class="persona-name-wrap" part="name">
              <slot name="name"><h2 class="persona-name-fallback">${n(e)}</h2></slot>
            </div>
            ${t?`<p class="persona-role" part="role">${n(t)}</p>`:""}
            <div class="persona-meta" part="meta">
              ${o?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                  ${n(o)} years old
                </span>
              `:""}
              ${r?`
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  ${n(r)}
                </span>
              `:""}
            </div>
          </div>
        </header>

        ${l||this.querySelector('[slot="quote"]')?`
          <div class="persona-quote" part="quote">
            <span class="quote-mark" aria-hidden="true">&ldquo;</span>
            <div class="quote-text-wrap"><slot name="quote"><p class="quote-text">${n(l)}</p></slot></div>
          </div>
        `:""}

        <div class="persona-body" part="body">
          <div class="section" part="section-bio">
            <div class="section-header">
              <div class="section-icon bio" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <span class="section-title">Background</span>
            </div>
            <div class="section-content">
              <slot name="bio">No background information provided.</slot>
            </div>
          </div>

          <div class="section" part="section-goals">
            <div class="section-header">
              <div class="section-icon goals" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <span class="section-title">Goals</span>
            </div>
            <div class="section-content">
              <slot name="goals">No goals specified.</slot>
            </div>
          </div>

          <div class="section" part="section-frustrations">
            <div class="section-header">
              <div class="section-icon frustrations" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <span class="section-title">Frustrations</span>
            </div>
            <div class="section-content">
              <slot name="frustrations">No frustrations listed.</slot>
            </div>
          </div>

          <div class="section" part="section-behaviors">
            <div class="section-header">
              <div class="section-icon behaviors" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
              </div>
              <span class="section-title">Behaviors</span>
            </div>
            <div class="section-content">
              <slot name="behaviors">No behaviors documented.</slot>
            </div>
          </div>
        </div>
      </article>
    `}};g("user-persona",u);export{u as UserPersona};
//# sourceMappingURL=user-persona.js.map
