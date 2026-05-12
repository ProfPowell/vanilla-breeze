if(typeof document<"u"){let n=document.createElement("style");n.textContent="browser-window:not(:defined){display:block;opacity:0}",document.head.appendChild(n)}var Se=new Set,we=null,ze=null;function Ve(){let n=document.documentElement,e=document.body;if(!n||!e)return null;if(n.classList.contains("dark")||e.classList.contains("dark")||n.getAttribute("data-theme")==="dark"||e.getAttribute("data-theme")==="dark")return!0;if(n.getAttribute("data-theme")==="light"||e.getAttribute("data-theme")==="light")return!1;if(n.getAttribute("data-bs-theme")==="dark"||e.getAttribute("data-bs-theme")==="dark")return!0;if(n.getAttribute("data-bs-theme")==="light"||e.getAttribute("data-bs-theme")==="light")return!1;if(n.getAttribute("data-mode")==="dark")return!0;if(n.getAttribute("data-mode")==="light")return!1;let t=getComputedStyle(n).colorScheme;return t==="dark"?!0:t==="light"?!1:null}function Mr(){let n=Ve();if(n!==ze){ze=n;for(let e of Se)e._onPageModeChange(n)}}function Lr(){if(we)return;we=new MutationObserver(Mr);let n={attributes:!0,attributeFilter:["class","data-theme","data-bs-theme","data-mode","style"]};we.observe(document.documentElement,n),document.body&&we.observe(document.body,n)}function $r(){we&&(we.disconnect(),we=null)}function Nr(n){Se.add(n),Se.size===1&&Lr();let e=Ve();ze=e,n._onPageModeChange(e)}function Rr(n){Se.delete(n),Se.size===0&&($r(),ze=null)}var pt={"iphone-16":{width:393,height:852,bezel:12,notch:"dynamic-island",cornerRadius:55,homeIndicator:!0,homeButton:!1,safeInsets:[59,0,34,0]},"iphone-16-pro-max":{width:440,height:956,bezel:12,notch:"dynamic-island",cornerRadius:55,homeIndicator:!0,homeButton:!1,safeInsets:[59,0,34,0]},"iphone-se":{width:375,height:667,bezel:12,notch:"none",cornerRadius:0,homeIndicator:!1,homeButton:!0,safeInsets:[20,0,0,0]},"pixel-9":{width:412,height:923,bezel:10,notch:"punch-hole",cornerRadius:48,homeIndicator:!0,homeButton:!1,safeInsets:[48,0,24,0]},"pixel-9-pro-xl":{width:448,height:998,bezel:10,notch:"punch-hole",cornerRadius:48,homeIndicator:!0,homeButton:!1,safeInsets:[48,0,24,0]},"galaxy-s24":{width:360,height:780,bezel:10,notch:"punch-hole",cornerRadius:40,homeIndicator:!0,homeButton:!1,safeInsets:[48,0,24,0]},"ipad-air":{width:820,height:1180,bezel:16,notch:"none",cornerRadius:18,homeIndicator:!0,homeButton:!1,safeInsets:[24,0,20,0]},"ipad-pro-13":{width:1032,height:1376,bezel:16,notch:"none",cornerRadius:18,homeIndicator:!0,homeButton:!1,safeInsets:[24,0,20,0]},"ipad-mini":{width:744,height:1133,bezel:16,notch:"none",cornerRadius:18,homeIndicator:!0,homeButton:!1,safeInsets:[24,0,20,0]}},ft={midnight:"#1a1a1a",silver:"#c0c0c0",gold:"#d4a574",blue:"#3a4f6f",white:"#f0f0f0"},Or={"dynamic-island":54,"punch-hole":36,none:24},zr=28,vt=80,wt=!1,We=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.isMinimized=!1,this.isMaximized=!1,this.overlay=null,this.showSource=!1,this.sourceCode="",this.showShareMenu=!1,this._handleKeydown=this._handleKeydown.bind(this),this._handleOutsideClick=this._handleOutsideClick.bind(this),this._resizeObserver=null,this._currentScale=1,this._outsideClickTimer=null,this._copyFeedbackTimer=null,this._fetchController=null,this._sourceCodeSrc=""}async connectedCallback(){this.render(),this._attachEventListeners(),Nr(this),this._getDevicePreset()&&this._setupDeviceScaling()}disconnectedCallback(){Rr(this),this._removeOverlay(),this._teardownDeviceScaling(),clearTimeout(this._outsideClickTimer),clearTimeout(this._copyFeedbackTimer),this._fetchController?.abort(),document.removeEventListener("keydown",this._handleKeydown),document.removeEventListener("click",this._handleOutsideClick)}static get observedAttributes(){return["url","title","mode","shadow","src","device","device-color","orientation","show-safe-areas","allow","allowfullscreen","referrerpolicy"]}attributeChangedCallback(e,t,o){if(!(!this.shadowRoot||t===o)){if(e==="src"){this._handleSrcChange(t,o);return}if(e==="device"||e==="orientation"){this._teardownDeviceScaling(),this._renderStructure(),this._getDevicePreset()&&this._setupDeviceScaling();return}if(e==="show-safe-areas"){this._updateSafeAreaOverlays();return}if(e==="device-color"){this._updateDynamicStyles(),this._applyDeviceColorClass();return}if(e==="url"||e==="title"){this._updateBrowserUrlBar();return}if(e==="shadow"){this._updateDynamicStyles();return}if(e==="mode"){this.hasAttribute("mode")?this.removeAttribute("data-page-mode"):this._onPageModeChange(Ve()),this._syncIframeColorScheme();return}(e==="allow"||e==="allowfullscreen"||e==="referrerpolicy")&&this._syncIframePassthroughAttrs()}}_iframeAttrs(){let e=[];return this.hasAttribute("allow")&&e.push(`allow="${this._escapeHtml(this.getAttribute("allow"))}"`),this.hasAttribute("allowfullscreen")&&e.push("allowfullscreen"),this.hasAttribute("referrerpolicy")&&e.push(`referrerpolicy="${this._escapeHtml(this.getAttribute("referrerpolicy"))}"`),e.length?" "+e.join(" "):""}_syncIframePassthroughAttrs(){let e=this.shadowRoot?.querySelector("iframe");if(e)for(let t of["allow","allowfullscreen","referrerpolicy"])this.hasAttribute(t)?e.setAttribute(t,this.getAttribute(t)??""):e.removeAttribute(t)}get url(){return this.getAttribute("url")||""}set url(e){this.setAttribute("url",e)}get src(){return this.getAttribute("src")||""}set src(e){this.setAttribute("src",e)}get browserTitle(){return this.getAttribute("title")||this.getHostname()}set browserTitle(e){this.setAttribute("title",e)}get mode(){return this.getAttribute("mode")||this.getAttribute("data-page-mode")||(typeof window<"u"&&window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light")}set mode(e){e?this.setAttribute("mode",e):this.removeAttribute("mode")}get device(){return this.getAttribute("device")||""}set device(e){e?this.setAttribute("device",e):this.removeAttribute("device")}get deviceColor(){return this.getAttribute("device-color")||"midnight"}set deviceColor(e){this.setAttribute("device-color",e)}get orientation(){return this.getAttribute("orientation")||"portrait"}set orientation(e){e&&e!=="portrait"?this.setAttribute("orientation",e):this.removeAttribute("orientation")}get showSafeAreas(){return this.hasAttribute("show-safe-areas")}set showSafeAreas(e){this.toggleAttribute("show-safe-areas",!!e)}_getDevicePreset(){let e=this.getAttribute("device");return e?pt[e]||(console.warn(`<browser-window>: Unknown device preset "${e}", falling back to "iphone-16"`),pt["iphone-16"]):null}_getEffectiveDimensions(e){let t=this.getAttribute("orientation")==="landscape";return{width:t?e.height:e.width,height:t?e.width:e.height}}_getEffectiveSafeInsets(e){let[t,o,i,a]=e.safeInsets;return this.getAttribute("orientation")==="landscape"?[a,t,o,i]:[t,o,i,a]}_onPageModeChange(e){if(this.hasAttribute("mode")){this.removeAttribute("data-page-mode");return}e===!0?this.setAttribute("data-page-mode","dark"):e===!1?this.setAttribute("data-page-mode","light"):this.removeAttribute("data-page-mode"),this._syncIframeColorScheme()}_syncIframeColorScheme(){let e=this.shadowRoot?.querySelector("iframe");if(!e)return;let t=this.mode==="dark";try{let o=e.contentDocument;o?.documentElement&&(o.documentElement.style.colorScheme=t?"dark":"light")}catch{}}_renderStructure(){this._setShareMenuOpen(!1),this.render(),this._attachEventListeners(),this._updateDynamicStyles(),this._applyDeviceColorClass()}_handleSrcChange(e,t){if(this._fetchController?.abort(),this._fetchController=null,this.showSource=!1,this.sourceCode="",this._sourceCodeSrc="",this._setShareMenuOpen(!1),!!e!=!!t){this._renderStructure();return}this._updateContentView(),this._updateDownloadLinks()}_updateDynamicStyles(){let e=this.shadowRoot?.querySelector("style[data-browser-window-dynamic]");e&&(e.textContent=this._dynamicCSS())}_getBezelColor(){return ft[this.deviceColor]||ft.midnight}_applyDeviceColorClass(){let e=this.shadowRoot?.querySelector(".device-frame");if(!e)return;let t=["silver","gold","white"];e.classList.toggle("light-bezel",t.includes(this.deviceColor))}_updateBrowserUrlBar(){let e=this.shadowRoot?.querySelector(".url-bar");if(!e)return;let t=e.querySelector(".url-text");t&&(t.textContent=this.browserTitle,t.setAttribute("title",this.url));let o=e.querySelector(".lock-icon"),i=this.url.startsWith("https");if(i&&!o&&t){let a=document.createElement("span");a.className="lock-icon",a.textContent="\u{1F512}",e.insertBefore(a,t)}else!i&&o&&o.remove()}_updateDownloadLinks(){for(let e of this.shadowRoot?.querySelectorAll(".download-button")||[])e.setAttribute("href",this.src)}_createSafeAreaOverlays(){let e=document.createElement("div");return e.className="safe-area-overlays",e.innerHTML=`
      <div class="safe-area-overlay safe-area-top"></div>
      <div class="safe-area-overlay safe-area-right"></div>
      <div class="safe-area-overlay safe-area-bottom"></div>
      <div class="safe-area-overlay safe-area-left"></div>
    `,e}_updateSafeAreaOverlays(){let e=this.shadowRoot?.querySelector(".device-frame");if(!e)return;let t=e.querySelector(".safe-area-overlays");this.showSafeAreas?t||e.appendChild(this._createSafeAreaOverlays()):t?.remove()}_resolveURL(e){if(!e)return"";try{return new URL(e,document.baseURI).href}catch{return e}}_injectSafeAreas(e){let t=this._getDevicePreset();if(t)try{let o=e.contentDocument;if(!o)return;let i=o.querySelector("style[data-browser-window-safe-areas]");i&&i.remove();let[a,h,u,l]=this._getEffectiveSafeInsets(t),d=o.createElement("style");d.setAttribute("data-browser-window-safe-areas",""),d.textContent=`
        :root {
          --safe-top: ${a}px;
          --safe-right: ${h}px;
          --safe-bottom: ${u}px;
          --safe-left: ${l}px;
        }
      `,o.head.appendChild(d)}catch{console.info("<browser-window>: Cannot inject safe areas into cross-origin iframe")}}get hasShadow(){return this.hasAttribute("shadow")}getHostname(){try{return new URL(this.url).hostname}catch{return this.url}}_attachEventListeners(){let e=this.shadowRoot.querySelector(".control-button.close"),t=this.shadowRoot.querySelector(".control-button.minimize"),o=this.shadowRoot.querySelector(".control-button.maximize"),i=this.shadowRoot.querySelector(".view-source-button"),a=this.shadowRoot.querySelector(".copy-source-button"),h=this.shadowRoot.querySelector(".share-button"),u=this.shadowRoot.querySelector(".browser-header");e?.addEventListener("click",()=>this._handleClose()),t?.addEventListener("click",()=>this.toggleMinimize()),o?.addEventListener("click",()=>this.toggleMaximize()),i?.addEventListener("click",()=>this.toggleViewSource()),a?.addEventListener("click",()=>this.copySourceCode()),h?.addEventListener("click",d=>{d.stopPropagation(),this.toggleShareMenu()}),u?.addEventListener("dblclick",d=>{d.target.closest("button, a, .share-menu")||this.toggleMaximize()});let l=this.shadowRoot.querySelector("iframe");if(l){let d=()=>{this._syncIframeColorScheme(),this._getDevicePreset()&&this._injectSafeAreas(l)};l.addEventListener("error",()=>this._handleIframeError()),l.addEventListener("load",d),l.contentDocument?.readyState==="complete"&&l.src&&d()}this.shadowRoot.querySelector('[data-action="share"]')?.addEventListener("click",()=>this.shareViaWebAPI()),this.shadowRoot.querySelector('[data-action="codepen"]')?.addEventListener("click",()=>this.openInCodePen()),this.shadowRoot.querySelector(".retry-button")?.addEventListener("click",()=>this._retryLoad())}_handleIframeError(){let e=this.shadowRoot.querySelector(".browser-content");e&&(e.innerHTML=`
      <div class="error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Failed to load content</p>
        <button class="retry-button">Retry</button>
      </div>
    `,e.querySelector(".retry-button")?.addEventListener("click",()=>this._retryLoad()))}_retryLoad(){let e=this.shadowRoot.querySelector(".browser-content");if(!e||!this.src)return;e.innerHTML=`<iframe src="${this._escapeHtml(this.src)}" loading="lazy"${this._iframeAttrs()}></iframe>`;let t=e.querySelector("iframe");t?.addEventListener("error",()=>this._handleIframeError()),t?.addEventListener("load",()=>{this._syncIframeColorScheme(),this._getDevicePreset()&&this._injectSafeAreas(t)})}_reloadIframeIfNeeded(e){requestAnimationFrame(()=>{requestAnimationFrame(()=>{try{let t=e.contentDocument?.body;if(t&&t.children.length===0&&t.textContent.trim()===""){let o=e.getAttribute("src");o&&(e.src=o)}}catch{}})})}async fetchSourceCode(){if(!this.src||this._sourceCodeSrc===this.src&&this.sourceCode)return;let e=this.src;this._fetchController?.abort();let t=new AbortController;this._fetchController=t;try{let o=await fetch(this._resolveURL(e),{signal:t.signal});if(!o.ok){if(this.src===e){let a=[o.status,o.statusText].filter(Boolean).join(" ");this.sourceCode=`// Failed to load source code${a?` (${a})`:""}`,this._sourceCodeSrc=e}return}let i=await o.text();this._fetchController===t&&this.src===e&&(this.sourceCode=i,this._sourceCodeSrc=e)}catch(o){o.name!=="AbortError"&&(console.error("Failed to fetch source code:",o),this.src===e&&(this.sourceCode="// Failed to load source code",this._sourceCodeSrc=e))}finally{this._fetchController===t&&(this._fetchController=null)}}async toggleViewSource(){this.showSource=!this.showSource,this.showSource&&!this.sourceCode&&this.src&&await this.fetchSourceCode(),this._updateContentView()}_updateContentView(){let e=this.shadowRoot.querySelector(".view-source-button");this._getDevicePreset()?this._updateDeviceSourceView(e):this._updateBrowserSourceView(e)}_updateBrowserSourceView(e){let t=this.shadowRoot.querySelector(".browser-content");if(t)if(this.showSource)t.innerHTML=this._sourceViewHTML(),e?.classList.add("active"),t.querySelector(".copy-source-button")?.addEventListener("click",()=>this.copySourceCode());else{if(this.src){t.innerHTML=`<iframe src="${this._escapeHtml(this.src)}" loading="lazy"${this._iframeAttrs()}></iframe>`;let o=t.querySelector("iframe");o?.addEventListener("error",()=>this._handleIframeError()),o?.addEventListener("load",()=>this._syncIframeColorScheme())}else t.innerHTML="<slot></slot>";e?.classList.remove("active")}}_updateDeviceSourceView(e){let t=this.shadowRoot.querySelector(".browser-content");if(t)if(this.showSource)t.innerHTML=this._sourceViewHTML(),e?.classList.add("active"),t.querySelector(".copy-source-button")?.addEventListener("click",()=>this.copySourceCode());else{if(this.src){t.innerHTML=`<iframe src="${this._escapeHtml(this.src)}" loading="lazy"${this._iframeAttrs()}></iframe>`;let o=t.querySelector("iframe");o?.addEventListener("error",()=>this._handleIframeError()),o?.addEventListener("load",()=>{this._syncIframeColorScheme(),this._getDevicePreset()&&this._injectSafeAreas(o)})}else t.innerHTML="<slot></slot>";e?.classList.remove("active")}}_sourceViewHTML(){return`
      <div class="source-view">
        <div class="source-header">
          <span class="source-label">Source Code</span>
          <button class="copy-source-button" title="Copy source code">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="5" width="9" height="9" rx="1"/>
              <path d="M3 11V3a1 1 0 011-1h8"/>
            </svg>
            Copy
          </button>
        </div>
        <pre><code>${this._escapeHtml(this.sourceCode)}</code></pre>
      </div>
    `}async copySourceCode(){if(this.sourceCode)try{await navigator.clipboard.writeText(this.sourceCode);let e=this.shadowRoot.querySelector(".copy-source-button");if(e){let t=e.innerHTML;e.innerHTML=`
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3,8 6,11 13,4"/>
          </svg>
          Copied!
        `,e.classList.add("copied"),clearTimeout(this._copyFeedbackTimer),this._copyFeedbackTimer=setTimeout(()=>{e.innerHTML=t,e.classList.remove("copied")},2e3)}}catch(e){console.error("Failed to copy source code:",e)}}toggleShareMenu(){this._setShareMenuOpen(!this.showShareMenu)}_setShareMenuOpen(e){let t=this.shadowRoot?.querySelector(".share-menu"),o=this.shadowRoot?.querySelector(".share-button");if(!t||!o){this.showShareMenu=!1,clearTimeout(this._outsideClickTimer),document.removeEventListener("click",this._handleOutsideClick);return}this.showShareMenu=e,this.showShareMenu?(t.style.display="block",o.classList.add("active"),clearTimeout(this._outsideClickTimer),this._outsideClickTimer=setTimeout(()=>{document.addEventListener("click",this._handleOutsideClick)},0)):(t.style.display="none",o.classList.remove("active"),clearTimeout(this._outsideClickTimer),document.removeEventListener("click",this._handleOutsideClick))}_handleOutsideClick(e){let t=this.shadowRoot?.querySelector(".share-menu");t&&(e.composedPath().includes(t)||this._setShareMenuOpen(!1))}async shareViaWebAPI(){if(!navigator.share){console.warn("Web Share API not supported");return}let e={title:this.browserTitle||"CSS Demo",text:`Check out this CSS demo: ${this.browserTitle}`,url:this._resolveURL(this.src||this.url)};try{await navigator.share(e),this._setShareMenuOpen(!1)}catch(t){t.name!=="AbortError"&&console.error("Error sharing:",t)}}parseHTMLForCodePen(){if(!this.sourceCode)return null;let e=new DOMParser().parseFromString(this.sourceCode,"text/html"),t=Array.from(e.querySelectorAll("style")).map(a=>a.textContent).join(`

`),o=Array.from(e.querySelectorAll("script")).filter(a=>!a.src&&a.type!=="module").map(a=>a.textContent).join(`

`),i=e.body.cloneNode(!0);return i.querySelectorAll("script, style").forEach(a=>a.remove()),{html:i.innerHTML.trim(),css:t.trim(),js:o.trim()}}async openInCodePen(){!this.sourceCode&&this.src&&await this.fetchSourceCode();let e=this.parseHTMLForCodePen();if(!e)return;let t={title:this.browserTitle||"CSS Demo",description:`Demo from ${this.url}`,html:e.html,css:e.css,js:e.js,editors:"110"},o=document.createElement("form");o.action="https://codepen.io/pen/define",o.method="POST",o.target="_blank";let i=document.createElement("input");i.type="hidden",i.name="data",i.value=JSON.stringify(t),o.appendChild(i),document.body.appendChild(o),o.submit(),document.body.removeChild(o),this._setShareMenuOpen(!1)}_handleClose(){if(this.isMaximized){this.toggleMaximize();return}this.toggleMinimize()}_handleKeydown(e){e.key==="Escape"&&(this.showShareMenu?this.toggleShareMenu():this.isMaximized&&this.toggleMaximize())}_createOverlay(){if(!this.overlay){if(this.overlay=document.createElement("div"),this.overlay.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: var(--browser-window-overlay-z-index, 9998);
      cursor: pointer;
      animation: fadeIn 200ms ease;
    `,!wt){let e=document.createElement("style");e.textContent=`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,document.head.appendChild(e),wt=!0}this.overlay.addEventListener("click",()=>this.toggleMaximize()),document.body.appendChild(this.overlay),document.addEventListener("keydown",this._handleKeydown)}}_removeOverlay(){this.overlay&&(this.overlay.remove(),this.overlay=null),document.removeEventListener("keydown",this._handleKeydown)}toggleMinimize(){if(this.isMaximized){this.toggleMaximize();return}let e=this.shadowRoot.querySelector(".browser-content");e&&(this.isMinimized=!this.isMinimized,this.isMinimized?(e.style.height="0",e.style.overflow="hidden"):(e.style.height="",e.style.overflow=""))}toggleMaximize(){let e=this.shadowRoot.querySelector(".control-button.maximize");if(this.isMaximized){this.classList.remove("browser-window-maximized"),this.removeAttribute("role"),this.removeAttribute("aria-modal"),this.removeAttribute("tabindex");let t=this.shadowRoot.querySelector("iframe");t&&(t.style.minHeight="",this._reloadIframeIfNeeded(t)),this._removeOverlay(),this.isMaximized=!1,this._previousFocus&&typeof this._previousFocus.focus=="function"&&(this._previousFocus.focus(),this._previousFocus=null),e&&(e.setAttribute("aria-label","Maximize window"),e.setAttribute("aria-expanded","false"))}else{this.isMinimized&&this.toggleMinimize(),this._createOverlay(),this.classList.add("browser-window-maximized"),this.setAttribute("role","dialog"),this.setAttribute("aria-modal","true");let t=this.shadowRoot.querySelector("iframe");t&&(t.style.minHeight="calc(90vh - 50px)",this._reloadIframeIfNeeded(t)),this.isMaximized=!0,this._previousFocus=document.activeElement,this.setAttribute("tabindex","-1"),this.focus(),e&&(e.setAttribute("aria-label","Restore window"),e.setAttribute("aria-expanded","true"))}}render(){let e=this._getDevicePreset(),t=e?this._deviceCSS(e):this._browserCSS(),o=e?this._deviceChrome(e):this._browserChrome();this.shadowRoot.innerHTML=`
      <style>${this._sharedCSS()}${t}</style>
      <style data-browser-window-dynamic>${this._dynamicCSS()}</style>
      ${o}
      ${e?"":this._contentHTML()}
    `,e&&this._updateDeviceScale()}_darkPalette(){return`
            --_bw-bg: var(--color-surface, #1c1c1e);
            --_bw-header-bg: var(--color-surface-raised, #2c2c2e);
            --_bw-border-color: var(--color-border, #3a3a3c);
            --_bw-text-color: var(--color-text, #e5e5e7);
            --_bw-text-muted: var(--color-text-muted, #98989d);
            --_bw-url-bg: var(--color-surface, #1c1c1e);
            --_bw-hover-bg: #3a3a3c;
            --_bw-content-bg: var(--color-surface, #000000);
            color-scheme: dark;`}_lightPalette(){return`
            --_bw-bg: var(--color-surface, #ffffff);
            --_bw-header-bg: var(--color-surface-raised, #f6f8fa);
            --_bw-border-color: var(--color-border, #d1d5da);
            --_bw-text-color: var(--color-text, #24292e);
            --_bw-text-muted: var(--color-text-muted, #586069);
            --_bw-url-bg: var(--color-surface, #ffffff);
            --_bw-hover-bg: #f3f4f6;
            --_bw-content-bg: var(--color-surface, #ffffff);
            color-scheme: light;`}_sharedCSS(){return`
        :host {
          /* Internal defaults \u2014 external --browser-window-* overrides always win */
          --_bw-bg: var(--color-surface, #ffffff);
          --_bw-header-bg: var(--color-surface-raised, #f6f8fa);
          --_bw-border-color: var(--color-border, #d1d5da);
          --_bw-text-color: var(--color-text, #24292e);
          --_bw-text-muted: var(--color-text-muted, #586069);
          --_bw-url-bg: var(--color-surface, #ffffff);
          --_bw-hover-bg: #f3f4f6;
          --_bw-content-bg: var(--color-surface, #ffffff);

          /* Non-structural properties */
          --browser-window-border-radius: var(--radius-m, 8px);
          --browser-window-inner-radius: var(--radius-s, 6px);
          --browser-window-close-color: #ff5f57;
          --browser-window-minimize-color: #febc2e;
          --browser-window-maximize-color: #28c840;
          --browser-window-accent-color: #2563eb;
          --browser-window-active-bg: #dbeafe;
          --browser-window-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --browser-window-mono-font: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

          display: flex;
          flex-direction: column;
          margin: var(--browser-window-margin, 1rem 0);
          border-radius: var(--browser-window-border-radius);
          overflow: hidden;
          border-width: var(--browser-window-border-width, 1px);
          border-style: var(--browser-window-border-style, solid);
          border-color: var(--browser-window-border-color, var(--_bw-border-color));
          background: var(--browser-window-bg, var(--_bw-bg));
          box-shadow: var(--browser-window-shadow);
          transition: all 250ms ease-out;
          font-family: var(--browser-window-font-family);
          color: var(--browser-window-text-color, var(--_bw-text-color));
          color-scheme: light;

          /* Resizable container */
          resize: both;
          min-width: 280px;
          min-height: 150px;

        }

        /* Auto dark mode based on system preference (when no mode attribute) */
        @media (prefers-color-scheme: dark) {
          :host(:not([mode])) {
            ${this._darkPalette()}
          }
        }

        /* Page-level dark mode detection (overrides media query via higher specificity) */
        :host([data-page-mode="dark"]:not([mode])) {
          ${this._darkPalette()}
        }

        :host([data-page-mode="light"]:not([mode])) {
          ${this._lightPalette()}
        }

        /* Explicit dark mode override */
        :host([mode="dark"]) {
          ${this._darkPalette()}
        }

        /* Explicit light mode override (for users on dark system who want light) */
        :host([mode="light"]) {
          ${this._lightPalette()}
        }

        :host(.browser-window-maximized) {
          position: fixed !important;
          top: 5vh !important;
          left: 5vw !important;
          width: 90vw !important;
          height: 90vh !important;
          z-index: var(--browser-window-z-index, 9999) !important;
          margin: 0 !important;
          resize: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
          :host {
            transition: none;
          }
        }

        .browser-content {
          background: var(--browser-window-content-bg, var(--_bw-content-bg));
          min-height: 200px;
          padding: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Slot fills available space */
        slot {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        /* Slotted content fills the slot */
        ::slotted(*) {
          flex: 1;
          width: 100%;
          min-height: 0;
        }

        iframe {
          display: block;
          width: 100%;
          border: none;
          flex: 1;
          min-height: 200px;
        }

        ::slotted(img),
        ::slotted(iframe) {
          display: block;
          border: none;
          margin: 0;
        }

        .source-view {
          padding: 0;
          background: var(--browser-window-header-bg, var(--_bw-header-bg));
          min-height: 0;
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
        }

        .source-header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--browser-window-header-bg, var(--_bw-header-bg));
          border-bottom: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
          backdrop-filter: blur(8px);
        }

        .source-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--browser-window-text-color, var(--_bw-text-color));
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .copy-source-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: var(--browser-window-bg, var(--_bw-bg));
          border: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
          border-radius: var(--browser-window-inner-radius);
          color: var(--browser-window-text-color, var(--_bw-text-color));
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .copy-source-button:hover {
          background: var(--browser-window-hover-bg, var(--_bw-hover-bg));
        }

        .copy-source-button:active {
          transform: scale(0.97);
        }

        .copy-source-button.copied {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .source-view pre {
          margin: 0;
          padding: 1rem;
          background: var(--browser-window-content-bg, var(--_bw-content-bg));
          border: none;
          border-radius: 0;
          overflow-x: auto;
          flex: 1;
          font-family: var(--browser-window-mono-font);
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .source-view code {
          color: var(--browser-window-text-color, var(--_bw-text-color));
          display: block;
          white-space: pre;
        }

        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
          color: var(--browser-window-text-muted, var(--_bw-text-muted));
          min-height: 200px;
        }

        .error-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .error-state p {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
        }

        .retry-button {
          padding: 0.5rem 1rem;
          background: var(--browser-window-accent-color);
          color: white;
          border: none;
          border-radius: var(--browser-window-inner-radius);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 150ms ease;
        }

        .retry-button:hover {
          opacity: 0.9;
        }

        .retry-button:active {
          transform: scale(0.98);
        }

        .share-container {
          position: relative;
          display: inline-block;
        }

        .share-menu {
          display: none;
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: var(--browser-window-header-bg, var(--_bw-header-bg));
          border: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
          border-radius: var(--browser-window-border-radius);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 180px;
          z-index: var(--browser-window-menu-z-index, 1000);
          overflow: hidden;
        }

        .share-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.625rem 1rem;
          background: none;
          border: none;
          color: var(--browser-window-text-color, var(--_bw-text-color));
          font-size: 0.875rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: background 150ms ease;
          border-bottom: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
        }

        .share-menu-item:last-child {
          border-bottom: none;
        }

        .share-menu-item:hover {
          background: var(--browser-window-hover-bg, var(--_bw-hover-bg));
        }

        .share-menu-item:active {
          background: var(--browser-window-active-bg);
        }

        .share-menu-item svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
    `}_dynamicCSS(){return`
      :host {
        --browser-window-shadow: ${this.hasShadow?"0 4px 12px rgba(0, 0, 0, 0.15)":"none"};
        --browser-window-bezel-color: ${this._getBezelColor()};
      }
    `}_browserCSS(){return`
        .browser-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--browser-window-header-bg, var(--_bw-header-bg));
          border-bottom: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
          cursor: zoom-in;
          user-select: none;
        }

        :host(.browser-window-maximized) .browser-header {
          cursor: zoom-out;
        }

        .controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .control-button {
          /* Touch target size - transparent background */
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer !important;
          transition: opacity 150ms ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: -8px;
        }

        /* Visual circle via pseudo-element */
        .control-button::after {
          content: '';
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: opacity 150ms ease;
        }

        /* Larger touch targets on touch devices */
        @media (pointer: coarse) {
          .control-button {
            width: 44px;
            height: 44px;
            margin: -16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .control-button {
            transition: none;
          }
          .control-button::after {
            transition: none;
          }
        }

        .control-button:hover::after {
          opacity: 0.8;
        }

        .control-button:active::after {
          opacity: 0.6;
          transform: scale(0.9);
        }

        .control-button:focus {
          outline: 2px solid var(--browser-window-accent-color);
          outline-offset: 2px;
        }

        .control-button:focus:not(:focus-visible) {
          outline: none;
        }

        .control-button.close::after {
          background: var(--browser-window-close-color);
        }

        .control-button.minimize::after {
          background: var(--browser-window-minimize-color);
        }

        .control-button.maximize::after {
          background: var(--browser-window-maximize-color);
        }

        .url-bar {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: var(--browser-window-url-bg, var(--_bw-url-bg));
          border: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
          border-radius: var(--browser-window-inner-radius);
          font-size: 0.875rem;
          color: var(--browser-window-text-muted, var(--_bw-text-muted));
          cursor: default !important;
        }

        .lock-icon {
          color: var(--browser-window-text-muted, var(--_bw-text-muted));
          font-size: 0.75rem;
        }

        .url-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--browser-window-text-muted, var(--_bw-text-muted));
        }

        .view-source-button,
        .download-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--browser-window-text-muted, var(--_bw-text-muted));
          transition: all 150ms ease;
          border-radius: 4px;
        }

        .view-source-button:hover,
        .download-button:hover {
          color: var(--browser-window-text-color, var(--_bw-text-color));
          background: var(--browser-window-hover-bg, var(--_bw-hover-bg));
        }

        .view-source-button:active,
        .download-button:active {
          transform: scale(0.95);
        }

        .view-source-button.active {
          color: var(--browser-window-accent-color);
          background: var(--browser-window-active-bg);
        }

        .download-icon {
          width: 16px;
          height: 16px;
        }

        .share-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--browser-window-text-muted, var(--_bw-text-muted));
          transition: all 150ms ease;
          border-radius: 4px;
        }

        .share-button:hover {
          color: var(--browser-window-text-color, var(--_bw-text-color));
          background: var(--browser-window-hover-bg, var(--_bw-hover-bg));
        }

        .share-button:active {
          transform: scale(0.95);
        }

        .share-button.active {
          color: var(--browser-window-accent-color);
          background: var(--browser-window-active-bg);
        }

        /* Responsive: narrow screens */
        @media (max-width: 480px) {
          .browser-header {
            padding: 0.5rem 0.75rem;
            gap: 0.5rem;
          }

          .url-bar {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }

          .url-text {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .view-source-button svg,
          .share-button svg {
            width: 14px;
            height: 14px;
          }
        }

        /* Very narrow: hide URL text */
        @media (max-width: 320px) {
          .url-text {
            display: none;
          }

          .lock-icon {
            display: none;
          }
        }

        /* Touch devices: larger button padding */
        @media (pointer: coarse) {
          .view-source-button,
          .share-button,
          .download-button {
            padding: 0.5rem;
            min-width: 44px;
            min-height: 44px;
          }

          .share-menu-item {
            padding: 0.875rem 1rem;
          }
        }
    `}_browserChrome(){return`
      <div class="browser-header" part="header" role="toolbar" aria-label="Window controls">
        <div class="controls">
          <button class="control-button close" aria-label="Close window" tabindex="0"></button>
          <button class="control-button minimize" aria-label="Minimize window" tabindex="0"></button>
          <button class="control-button maximize" aria-label="${this.isMaximized?"Restore window":"Maximize window"}" aria-expanded="${this.isMaximized}" tabindex="0"></button>
        </div>
        <div class="url-bar">
          ${this.url.startsWith("https")?'<span class="lock-icon">\u{1F512}</span>':""}
          <span class="url-text" title="${this._escapeHtml(this.url)}">${this._escapeHtml(this.browserTitle)}</span>
          ${this.src?`
            <button class="view-source-button" title="View source code">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4,6 2,8 4,10"/>
                <polyline points="12,6 14,8 12,10"/>
                <line x1="10" y1="4" x2="6" y2="12"/>
              </svg>
            </button>
            <div class="share-container">
              <button class="share-button" title="Share demo">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 12V3M8 3L5 6M8 3l3 3"/>
                  <path d="M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9"/>
                </svg>
              </button>
              <div class="share-menu">
                ${navigator.share?`
                  <button class="share-menu-item" data-action="share">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="4" r="2"/>
                      <circle cx="4" cy="8" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M6 9l4 2M6 7l4-2"/>
                    </svg>
                    Share...
                  </button>
                `:""}
                <button class="share-menu-item" data-action="codepen">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L0 5v6l8 5 8-5V5L8 0zM7 10.5L2 7.5v-2l5 3v2zm1-3l-5-3L8 2l5 2.5-5 3zm1 3v-2l5-3v2l-5 3z"/>
                  </svg>
                  Open in CodePen
                </button>
              </div>
            </div>
            <a href="${this._escapeHtml(this.src)}" download class="download-button" title="Download demo HTML file">
              <svg class="download-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 1v10M8 11l-3-3M8 11l3-3"/>
                <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
              </svg>
            </a>
          `:""}
        </div>
      </div>
    `}_contentHTML(){return`
      <div class="browser-content" part="content">
        ${this.src?`<iframe src="${this._escapeHtml(this.src)}" loading="lazy"${this._iframeAttrs()}></iframe>`:"<slot></slot>"}
      </div>
    `}_deviceCSS(e){let t=this.getAttribute("orientation")==="landscape",o=this._getEffectiveDimensions(e),[i,a,h,u]=this._getEffectiveSafeInsets(e),l=Or[e.notch]||24,d=e.homeIndicator&&!e.homeButton?zr:0,y=e.homeButton?vt:0,x=e.notch!=="none";return`
        :host([device]) {
          --device-width: ${o.width}px;
          --device-height: ${o.height}px;
          --device-bezel: ${e.bezel}px;
          --device-corner-radius: ${e.cornerRadius}px;
          --status-bar-height: ${t&&x?24:l}px;
          --home-indicator-height: ${d}px;
          --home-button-area: ${y}px;
          --safe-top: ${i}px;
          --safe-right: ${a}px;
          --safe-bottom: ${h}px;
          --safe-left: ${u}px;

          border: none;
          border-radius: 0;
          resize: none;
          overflow: visible;
          background: transparent;
          box-shadow: none;
          min-width: 0;
          min-height: 0;
        }

        .device-wrapper {
          display: flex;
          justify-content: center;
          overflow: hidden;
          width: 100%;
        }

        .device-frame {
          display: flex;
          flex-direction: column;
          width: var(--device-width);
          height: var(--device-height);
          padding: var(--device-bezel);
          border: none;
          box-sizing: content-box;
          border-radius: var(--device-corner-radius);
          overflow: hidden;
          position: relative;
          background: var(--browser-window-bezel-color);
          flex-shrink: 0;
          transform-origin: top center;
          box-shadow: none;
        }

        .device-frame.home-button {
          padding-bottom: var(--home-button-area);
        }

        /* Landscape with notch: horizontal layout */
        .device-frame.landscape.dynamic-island,
        .device-frame.landscape.punch-hole {
          flex-direction: row;
        }

        .device-main {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        /* Notch sidebar (landscape phones with notch) */
        .notch-sidebar {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .notch-sidebar.dynamic-island {
          width: 59px;
        }

        .notch-sidebar.dynamic-island::before {
          content: '';
          width: 37px;
          height: 126px;
          background: var(--browser-window-bezel-color);
          border-radius: 19px;
        }

        .notch-sidebar.punch-hole {
          width: 48px;
        }

        .notch-sidebar.punch-hole::before {
          content: '';
          width: 12px;
          height: 12px;
          background: var(--browser-window-bezel-color);
          border-radius: 50%;
        }

        /* Status bar */
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          height: var(--status-bar-height);
          position: relative;
          color: var(--browser-window-status-bar-color, rgba(255,255,255,0.9));
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
          z-index: 1;
          background: transparent;
        }

        .status-bar.dynamic-island {
          padding-top: 14px;
        }

        /* Dynamic Island pill (portrait only) */
        .status-bar.dynamic-island::before {
          content: '';
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 126px;
          height: 37px;
          background: var(--browser-window-bezel-color);
          border-radius: 19px;
        }

        /* Punch-hole camera (portrait only) */
        .status-bar.punch-hole::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: var(--browser-window-bezel-color);
          border-radius: 50%;
        }

        /* Home button (iPhone SE) */
        .device-frame.home-button::after {
          content: '';
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: 58px;
          height: 58px;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          z-index: 1;
        }

        /* Home indicator pill */
        .home-indicator {
          display: flex;
          justify-content: center;
          align-items: center;
          height: var(--home-indicator-height);
          flex-shrink: 0;
        }

        .home-indicator-pill {
          width: 134px;
          height: 5px;
          background: var(--browser-window-home-indicator-color, rgba(255,255,255,0.3));
          border-radius: 3px;
        }

        /* Device mode content area */
        :host([device]) .browser-content {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: var(--browser-window-content-bg, var(--_bw-content-bg));
        }

        :host([device]) .browser-content iframe {
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        /* Status bar icons */
        .status-time {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
        }

        .status-icons {
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 1;
        }

        .signal-bars {
          display: inline-flex;
          align-items: flex-end;
          gap: 1px;
          height: 12px;
        }

        .signal-bars span {
          display: inline-block;
          width: 3px;
          background: currentColor;
          border-radius: 1px;
        }

        .signal-bars span:nth-child(1) { height: 4px; }
        .signal-bars span:nth-child(2) { height: 6px; }
        .signal-bars span:nth-child(3) { height: 8px; }
        .signal-bars span:nth-child(4) { height: 10px; }

        /* Wifi icon - dot with two arcs */
        .wifi-icon {
          display: inline-block;
          width: 3px;
          height: 3px;
          background: currentColor;
          border-radius: 50%;
          position: relative;
          margin: 0 5px;
          vertical-align: middle;
        }

        .wifi-icon::before {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 9px;
          height: 9px;
          border: 1.5px solid currentColor;
          border-color: currentColor transparent transparent;
          border-radius: 50%;
        }

        .wifi-icon::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 15px;
          height: 15px;
          border: 1.5px solid currentColor;
          border-color: currentColor transparent transparent;
          border-radius: 50%;
        }

        /* Battery icon */
        .battery-icon {
          display: inline-block;
          width: 22px;
          height: 10px;
          border: 1.5px solid currentColor;
          border-radius: 2px;
          position: relative;
          vertical-align: middle;
        }

        .battery-icon::before {
          /* Battery fill */
          content: '';
          position: absolute;
          top: 1.5px;
          left: 1.5px;
          right: 1.5px;
          bottom: 1.5px;
          background: currentColor;
          border-radius: 0.5px;
        }

        .battery-icon::after {
          /* Battery cap */
          content: '';
          position: absolute;
          right: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 5px;
          background: currentColor;
          border-radius: 0 1px 1px 0;
        }

        /* Light bezel: dark status bar text */
        .device-frame.light-bezel .status-bar {
          color: rgba(0, 0, 0, 0.8);
        }

        .device-frame.light-bezel .home-indicator-pill {
          background: rgba(0, 0, 0, 0.3);
        }

        .device-frame.light-bezel.home-button::after {
          border-color: rgba(0, 0, 0, 0.15);
        }

        /* Dark mode in device mode */
        :host([device][mode="dark"]) .browser-content,
        :host([device][data-page-mode="dark"]:not([mode])) .browser-content {
          background: #000000;
        }

        :host([device][mode="dark"]) .device-frame,
        :host([device][data-page-mode="dark"]:not([mode])) .device-frame {
          outline: 1px solid rgba(255, 255, 255, 0.12);
          outline-offset: -1px;
        }

        @media (prefers-color-scheme: dark) {
          :host([device]:not([mode])) .device-frame {
            outline: 1px solid rgba(255, 255, 255, 0.12);
            outline-offset: -1px;
          }
        }

        /* Safe area overlays */
        .safe-area-overlays {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: var(--home-button-area);
          pointer-events: none;
          z-index: 3;
        }

        .safe-area-overlay {
          position: absolute;
          background: var(--browser-window-safe-area-color, oklch(0.65 0.2 250 / 0.25));
        }

        .safe-area-top {
          top: 0;
          left: 0;
          right: 0;
          height: var(--safe-top);
        }

        .safe-area-right {
          top: 0;
          right: 0;
          bottom: 0;
          width: var(--safe-right);
        }

        .safe-area-bottom {
          bottom: 0;
          left: 0;
          right: 0;
          height: var(--safe-bottom);
        }

        .safe-area-left {
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--safe-left);
        }

        .device-toolbar {
          display: inline-flex;
          align-items: center;
          align-self: center;
          gap: 2px;
          padding: 3px;
          margin-top: 0.5rem;
          border-radius: var(--browser-window-border-radius);
          background: var(--browser-window-header-bg, var(--_bw-header-bg));
          border: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
        }

        .device-toolbar .view-source-button,
        .device-toolbar .share-button,
        .device-toolbar .download-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          background: none;
          border: none;
          border-radius: 50%;
          color: var(--browser-window-text-muted, var(--_bw-text-muted));
          cursor: pointer;
          text-decoration: none;
          transition: all 150ms ease;
        }

        .device-toolbar .view-source-button:hover,
        .device-toolbar .share-button:hover,
        .device-toolbar .download-button:hover {
          background: var(--browser-window-hover-bg, var(--_bw-hover-bg));
          color: var(--browser-window-text-color, var(--_bw-text-color));
        }

        .device-toolbar .view-source-button.active {
          background: var(--browser-window-accent-color, #2563eb);
          color: white;
        }

        .device-toolbar .share-container {
          position: relative;
        }

        .device-toolbar .share-menu {
          bottom: calc(100% + 6px);
          top: auto;
          right: 50%;
          transform: translateX(50%);
        }

        .device-toolbar svg {
          width: 16px;
          height: 16px;
        }
    `}_deviceChrome(e){let t=this.getAttribute("orientation")==="landscape",o=e.notch!=="none",i=o?e.notch:"",a=e.homeButton?"home-button":"",h=["silver","gold","white"].includes(this.deviceColor)?"light-bezel":"",u=["device-frame",i,a,h,t?"landscape":""].filter(Boolean).join(" "),l=`
      <div class="status-bar ${t&&o?"":i}">
        <span class="status-time">9:41</span>
        <div class="status-icons">
          <span class="signal-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span class="wifi-icon" aria-hidden="true"></span>
          <span class="battery-icon" aria-hidden="true"></span>
        </div>
      </div>
    `,d=e.homeIndicator&&!e.homeButton?'<div class="home-indicator"><div class="home-indicator-pill"></div></div>':"",y=this.hasAttribute("show-safe-areas")?`<div class="safe-area-overlays">
          <div class="safe-area-overlay safe-area-top"></div>
          <div class="safe-area-overlay safe-area-right"></div>
          <div class="safe-area-overlay safe-area-bottom"></div>
          <div class="safe-area-overlay safe-area-left"></div>
        </div>`:"",x=this._deviceToolbar();return t&&o?`
        <div class="device-wrapper">
          <div class="${u}">
            <div class="notch-sidebar ${i}"></div>
            <div class="device-main">
              ${l}
              ${this._contentHTML()}
              ${d}
            </div>
            ${y}
          </div>
        </div>
        ${x}
      `:`
      <div class="device-wrapper">
        <div class="${u}">
          ${l}
          ${this._contentHTML()}
          ${d}
          ${y}
        </div>
      </div>
      ${x}
    `}_deviceToolbar(){return this.src?`
      <div class="device-toolbar">
        <button class="view-source-button" title="View source code">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4,6 2,8 4,10"/>
            <polyline points="12,6 14,8 12,10"/>
            <line x1="10" y1="4" x2="6" y2="12"/>
          </svg>
        </button>
        <div class="share-container">
          <button class="share-button" title="Share demo">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 12V3M8 3L5 6M8 3l3 3"/>
              <path d="M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9"/>
            </svg>
          </button>
          <div class="share-menu">
            ${navigator.share?`
              <button class="share-menu-item" data-action="share">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="4" r="2"/>
                  <circle cx="4" cy="8" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <path d="M6 9l4 2M6 7l4-2"/>
                </svg>
                Share...
              </button>
            `:""}
            <button class="share-menu-item" data-action="codepen">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0L0 5v6l8 5 8-5V5L8 0zM7 10.5L2 7.5v-2l5 3v2zm1-3l-5-3L8 2l5 2.5-5 3zm1 3v-2l5-3v2l-5 3z"/>
              </svg>
              Open in CodePen
            </button>
          </div>
        </div>
        <a href="${this._escapeHtml(this.src)}" download class="download-button" title="Download demo HTML file">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 1v10M8 11l-3-3M8 11l3-3"/>
            <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
          </svg>
        </a>
      </div>
    `:""}_setupDeviceScaling(){this._resizeObserver||(this._resizeObserver=new ResizeObserver(()=>this._updateDeviceScale()),this._resizeObserver.observe(this))}_updateDeviceScale(){let e=this._getDevicePreset();if(!e)return;let t=this.shadowRoot.querySelector(".device-wrapper"),o=this.shadowRoot.querySelector(".device-frame");if(!t||!o)return;let i=this.clientWidth;if(i===0)return;let a=this._getEffectiveDimensions(e),h=a.width+e.bezel*2,u=Math.max(.5,Math.min(1,i/h));this._currentScale=u,o.style.transform=`scale(${u})`;let l=e.homeButton?vt:0,d=a.height+e.bezel*2+l;t.style.height=`${d*u}px`}_teardownDeviceScaling(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._currentScale=1}_escapeHtml(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}};customElements.get("browser-window")||customElements.define("browser-window",We);function Tr(n){return n&&n.__esModule&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n}var Xe,yt;function Ir(){if(yt)return Xe;yt=1;function n(r){return r instanceof Map?r.clear=r.delete=r.set=function(){throw new Error("map is read-only")}:r instanceof Set&&(r.add=r.clear=r.delete=function(){throw new Error("set is read-only")}),Object.freeze(r),Object.getOwnPropertyNames(r).forEach(s=>{let g=r[s],E=typeof g;(E==="object"||E==="function")&&!Object.isFrozen(g)&&n(g)}),r}class e{constructor(s){s.data===void 0&&(s.data={}),this.data=s.data,this.isMatchIgnored=!1}ignoreMatch(){this.isMatchIgnored=!0}}function t(r){return r.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function o(r,...s){let g=Object.create(null);for(let E in r)g[E]=r[E];return s.forEach(function(E){for(let D in E)g[D]=E[D]}),g}let i="</span>",a=r=>!!r.scope,h=(r,{prefix:s})=>{if(r.startsWith("language:"))return r.replace("language:","language-");if(r.includes(".")){let g=r.split(".");return[`${s}${g.shift()}`,...g.map((E,D)=>`${E}${"_".repeat(D+1)}`)].join(" ")}return`${s}${r}`};class u{constructor(s,g){this.buffer="",this.classPrefix=g.classPrefix,s.walk(this)}addText(s){this.buffer+=t(s)}openNode(s){if(!a(s))return;let g=h(s.scope,{prefix:this.classPrefix});this.span(g)}closeNode(s){a(s)&&(this.buffer+=i)}value(){return this.buffer}span(s){this.buffer+=`<span class="${s}">`}}let l=(r={})=>{let s={children:[]};return Object.assign(s,r),s};class d{constructor(){this.rootNode=l(),this.stack=[this.rootNode]}get top(){return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(s){this.top.children.push(s)}openNode(s){let g=l({scope:s});this.add(g),this.stack.push(g)}closeNode(){if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}walk(s){return this.constructor._walk(s,this.rootNode)}static _walk(s,g){return typeof g=="string"?s.addText(g):g.children&&(s.openNode(g),g.children.forEach(E=>this._walk(s,E)),s.closeNode(g)),s}static _collapse(s){typeof s!="string"&&s.children&&(s.children.every(g=>typeof g=="string")?s.children=[s.children.join("")]:s.children.forEach(g=>{d._collapse(g)}))}}class y extends d{constructor(s){super(),this.options=s}addText(s){s!==""&&this.add(s)}startScope(s){this.openNode(s)}endScope(){this.closeNode()}__addSublanguage(s,g){let E=s.root;g&&(E.scope=`language:${g}`),this.add(E)}toHTML(){return new u(this,this.options).value()}finalize(){return this.closeAllNodes(),!0}}function x(r){return r?typeof r=="string"?r:r.source:null}function k(r){return $("(?=",r,")")}function S(r){return $("(?:",r,")*")}function N(r){return $("(?:",r,")?")}function $(...r){return r.map(s=>x(s)).join("")}function q(r){let s=r[r.length-1];return typeof s=="object"&&s.constructor===Object?(r.splice(r.length-1,1),s):{}}function B(...r){return"("+(q(r).capture?"":"?:")+r.map(s=>x(s)).join("|")+")"}function j(r){return new RegExp(r.toString()+"|").exec("").length-1}function K(r,s){let g=r&&r.exec(s);return g&&g.index===0}let W=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;function I(r,{joinWith:s}){let g=0;return r.map(E=>{g+=1;let D=g,P=x(E),p="";for(;P.length>0;){let m=W.exec(P);if(!m){p+=P;break}p+=P.substring(0,m.index),P=P.substring(m.index+m[0].length),m[0][0]==="\\"&&m[1]?p+="\\"+String(Number(m[1])+D):(p+=m[0],m[0]==="("&&g++)}return p}).map(E=>`(${E})`).join(s)}let se=/\b\B/,J="[a-zA-Z]\\w*",ee="[a-zA-Z_]\\w*",ne="\\b\\d+(\\.\\d+)?",ie="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",ae="\\b(0b[01]+)",te="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",H=(r={})=>{let s=/^#![ ]*\//;return r.binary&&(r.begin=$(s,/.*\b/,r.binary,/\b.*/)),o({scope:"meta",begin:s,end:/$/,relevance:0,"on:begin":(g,E)=>{g.index!==0&&E.ignoreMatch()}},r)},O={begin:"\\\\[\\s\\S]",relevance:0},V={scope:"string",begin:"'",end:"'",illegal:"\\n",contains:[O]},Y={scope:"string",begin:'"',end:'"',illegal:"\\n",contains:[O]},C={begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},Z=function(r,s,g={}){let E=o({scope:"comment",begin:r,end:s,contains:[]},g);E.contains.push({scope:"doctag",begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0});let D=B("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/);return E.contains.push({begin:$(/[ ]+/,"(",D,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),E},re=Z("//","$"),he=Z("/\\*","\\*/"),ue=Z("#","$"),pe={scope:"number",begin:ne,relevance:0},Bt={scope:"number",begin:ie,relevance:0},Dt={scope:"number",begin:ae,relevance:0},Pt={scope:"regexp",begin:/\/(?=[^/\n]*\/)/,end:/\/[gimuy]*/,contains:[O,{begin:/\[/,end:/\]/,relevance:0,contains:[O]}]},Ht={scope:"title",begin:J,relevance:0},Ut={scope:"title",begin:ee,relevance:0},Ft={begin:"\\.\\s*"+ee,relevance:0};var Ce=Object.freeze({__proto__:null,APOS_STRING_MODE:V,BACKSLASH_ESCAPE:O,BINARY_NUMBER_MODE:Dt,BINARY_NUMBER_RE:ae,COMMENT:Z,C_BLOCK_COMMENT_MODE:he,C_LINE_COMMENT_MODE:re,C_NUMBER_MODE:Bt,C_NUMBER_RE:ie,END_SAME_AS_BEGIN:function(r){return Object.assign(r,{"on:begin":(s,g)=>{g.data._beginMatch=s[1]},"on:end":(s,g)=>{g.data._beginMatch!==s[1]&&g.ignoreMatch()}})},HASH_COMMENT_MODE:ue,IDENT_RE:J,MATCH_NOTHING_RE:se,METHOD_GUARD:Ft,NUMBER_MODE:pe,NUMBER_RE:ne,PHRASAL_WORDS_MODE:C,QUOTE_STRING_MODE:Y,REGEXP_MODE:Pt,RE_STARTERS_RE:te,SHEBANG:H,TITLE_MODE:Ht,UNDERSCORE_IDENT_RE:ee,UNDERSCORE_TITLE_MODE:Ut});function qt(r,s){r.input[r.index-1]==="."&&s.ignoreMatch()}function Zt(r,s){r.className!==void 0&&(r.scope=r.className,delete r.className)}function Gt(r,s){s&&r.beginKeywords&&(r.begin="\\b("+r.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",r.__beforeBegin=qt,r.keywords=r.keywords||r.beginKeywords,delete r.beginKeywords,r.relevance===void 0&&(r.relevance=0))}function Kt(r,s){Array.isArray(r.illegal)&&(r.illegal=B(...r.illegal))}function Wt(r,s){if(r.match){if(r.begin||r.end)throw new Error("begin & end are not supported with match");r.begin=r.match,delete r.match}}function Vt(r,s){r.relevance===void 0&&(r.relevance=1)}let Xt=(r,s)=>{if(!r.beforeMatch)return;if(r.starts)throw new Error("beforeMatch cannot be used with starts");let g=Object.assign({},r);Object.keys(r).forEach(E=>{delete r[E]}),r.keywords=g.keywords,r.begin=$(g.beforeMatch,k(g.begin)),r.starts={relevance:0,contains:[Object.assign(g,{endsParent:!0})]},r.relevance=0,delete g.beforeMatch},Jt=["of","and","for","in","not","or","if","then","parent","list","value"],Qt="keyword";function et(r,s,g=Qt){let E=Object.create(null);return typeof r=="string"?D(g,r.split(" ")):Array.isArray(r)?D(g,r):Object.keys(r).forEach(function(P){Object.assign(E,et(r[P],s,P))}),E;function D(P,p){s&&(p=p.map(m=>m.toLowerCase())),p.forEach(function(m){let w=m.split("|");E[w[0]]=[P,Yt(w[0],w[1])]})}}function Yt(r,s){return s?Number(s):er(r)?0:1}function er(r){return Jt.includes(r.toLowerCase())}let tt={},fe=r=>{console.error(r)},rt=(r,...s)=>{console.log(`WARN: ${r}`,...s)},xe=(r,s)=>{tt[`${r}/${s}`]||(console.log(`Deprecated as of ${r}. ${s}`),tt[`${r}/${s}`]=!0)},Me=new Error;function ot(r,s,{key:g}){let E=0,D=r[g],P={},p={};for(let m=1;m<=s.length;m++)p[m+E]=D[m],P[m+E]=!0,E+=j(s[m-1]);r[g]=p,r[g]._emit=P,r[g]._multi=!0}function tr(r){if(Array.isArray(r.begin)){if(r.skip||r.excludeBegin||r.returnBegin)throw fe("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),Me;if(typeof r.beginScope!="object"||r.beginScope===null)throw fe("beginScope must be object"),Me;ot(r,r.begin,{key:"beginScope"}),r.begin=I(r.begin,{joinWith:""})}}function rr(r){if(Array.isArray(r.end)){if(r.skip||r.excludeEnd||r.returnEnd)throw fe("skip, excludeEnd, returnEnd not compatible with endScope: {}"),Me;if(typeof r.endScope!="object"||r.endScope===null)throw fe("endScope must be object"),Me;ot(r,r.end,{key:"endScope"}),r.end=I(r.end,{joinWith:""})}}function or(r){r.scope&&typeof r.scope=="object"&&r.scope!==null&&(r.beginScope=r.scope,delete r.scope)}function nr(r){or(r),typeof r.beginScope=="string"&&(r.beginScope={_wrap:r.beginScope}),typeof r.endScope=="string"&&(r.endScope={_wrap:r.endScope}),tr(r),rr(r)}function ir(r){function s(p,m){return new RegExp(x(p),"m"+(r.case_insensitive?"i":"")+(r.unicodeRegex?"u":"")+(m?"g":""))}class g{constructor(){this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}addRule(m,w){w.position=this.position++,this.matchIndexes[this.matchAt]=w,this.regexes.push([w,m]),this.matchAt+=j(m)+1}compile(){this.regexes.length===0&&(this.exec=()=>null);let m=this.regexes.map(w=>w[1]);this.matcherRe=s(I(m,{joinWith:"|"}),!0),this.lastIndex=0}exec(m){this.matcherRe.lastIndex=this.lastIndex;let w=this.matcherRe.exec(m);if(!w)return null;let G=w.findIndex((Ee,Ue)=>Ue>0&&Ee!==void 0),U=this.matchIndexes[G];return w.splice(0,G),Object.assign(w,U)}}class E{constructor(){this.rules=[],this.multiRegexes=[],this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(m){if(this.multiRegexes[m])return this.multiRegexes[m];let w=new g;return this.rules.slice(m).forEach(([G,U])=>w.addRule(G,U)),w.compile(),this.multiRegexes[m]=w,w}resumingScanAtSamePosition(){return this.regexIndex!==0}considerAll(){this.regexIndex=0}addRule(m,w){this.rules.push([m,w]),w.type==="begin"&&this.count++}exec(m){let w=this.getMatcher(this.regexIndex);w.lastIndex=this.lastIndex;let G=w.exec(m);if(this.resumingScanAtSamePosition()&&!(G&&G.index===this.lastIndex)){let U=this.getMatcher(0);U.lastIndex=this.lastIndex+1,G=U.exec(m)}return G&&(this.regexIndex+=G.position+1,this.regexIndex===this.count&&this.considerAll()),G}}function D(p){let m=new E;return p.contains.forEach(w=>m.addRule(w.begin,{rule:w,type:"begin"})),p.terminatorEnd&&m.addRule(p.terminatorEnd,{type:"end"}),p.illegal&&m.addRule(p.illegal,{type:"illegal"}),m}function P(p,m){let w=p;if(p.isCompiled)return w;[Zt,Wt,nr,Xt].forEach(U=>U(p,m)),r.compilerExtensions.forEach(U=>U(p,m)),p.__beforeBegin=null,[Gt,Kt,Vt].forEach(U=>U(p,m)),p.isCompiled=!0;let G=null;return typeof p.keywords=="object"&&p.keywords.$pattern&&(p.keywords=Object.assign({},p.keywords),G=p.keywords.$pattern,delete p.keywords.$pattern),G=G||/\w+/,p.keywords&&(p.keywords=et(p.keywords,r.case_insensitive)),w.keywordPatternRe=s(G,!0),m&&(p.begin||(p.begin=/\B|\b/),w.beginRe=s(w.begin),!p.end&&!p.endsWithParent&&(p.end=/\B|\b/),p.end&&(w.endRe=s(w.end)),w.terminatorEnd=x(w.end)||"",p.endsWithParent&&m.terminatorEnd&&(w.terminatorEnd+=(p.end?"|":"")+m.terminatorEnd)),p.illegal&&(w.illegalRe=s(p.illegal)),p.contains||(p.contains=[]),p.contains=[].concat(...p.contains.map(function(U){return ar(U==="self"?p:U)})),p.contains.forEach(function(U){P(U,w)}),p.starts&&P(p.starts,m),w.matcher=D(w),w}if(r.compilerExtensions||(r.compilerExtensions=[]),r.contains&&r.contains.includes("self"))throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");return r.classNameAliases=o(r.classNameAliases||{}),P(r)}function nt(r){return r?r.endsWithParent||nt(r.starts):!1}function ar(r){return r.variants&&!r.cachedVariants&&(r.cachedVariants=r.variants.map(function(s){return o(r,{variants:null},s)})),r.cachedVariants?r.cachedVariants:nt(r)?o(r,{starts:r.starts?o(r.starts):null}):Object.isFrozen(r)?o(r):r}var sr="11.11.1";class cr extends Error{constructor(s,g){super(s),this.name="HTMLInjectionError",this.html=g}}let He=t,it=o,at=Symbol("nomatch"),lr=7,st=function(r){let s=Object.create(null),g=Object.create(null),E=[],D=!0,P="Could not find the language '{}', did you forget to load/include a language module?",p={disableAutodetect:!0,name:"Plain text",contains:[]},m={ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",cssSelector:"pre code",languages:null,__emitter:y};function w(c){return m.noHighlightRe.test(c)}function G(c){let v=c.className+" ";v+=c.parentNode?c.parentNode.className:"";let M=m.languageDetectRe.exec(v);if(M){let z=ge(M[1]);return z||(rt(P.replace("{}",M[1])),rt("Falling back to no-highlight mode for this block.",c)),z?M[1]:"no-highlight"}return v.split(/\s+/).find(z=>w(z)||ge(z))}function U(c,v,M){let z="",F="";typeof v=="object"?(z=c,M=v.ignoreIllegals,F=v.language):(xe("10.7.0","highlight(lang, code, ...args) has been deprecated."),xe("10.7.0",`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`),F=c,z=v),M===void 0&&(M=!0);let ce={code:z,language:F};$e("before:highlight",ce);let me=ce.result?ce.result:Ee(ce.language,ce.code,M);return me.code=ce.code,$e("after:highlight",me),me}function Ee(c,v,M,z){let F=Object.create(null);function ce(b,f){return b.keywords[f]}function me(){if(!_.keywords){X.addText(T);return}let b=0;_.keywordPatternRe.lastIndex=0;let f=_.keywordPatternRe.exec(T),A="";for(;f;){A+=T.substring(b,f.index);let R=de.case_insensitive?f[0].toLowerCase():f[0],Q=ce(_,R);if(Q){let[be,Ar]=Q;if(X.addText(A),A="",F[R]=(F[R]||0)+1,F[R]<=lr&&(Oe+=Ar),be.startsWith("_"))A+=f[0];else{let Cr=de.classNameAliases[be]||be;le(f[0],Cr)}}else A+=f[0];b=_.keywordPatternRe.lastIndex,f=_.keywordPatternRe.exec(T)}A+=T.substring(b),X.addText(A)}function Ne(){if(T==="")return;let b=null;if(typeof _.subLanguage=="string"){if(!s[_.subLanguage]){X.addText(T);return}b=Ee(_.subLanguage,T,!0,mt[_.subLanguage]),mt[_.subLanguage]=b._top}else b=Fe(T,_.subLanguage.length?_.subLanguage:null);_.relevance>0&&(Oe+=b.relevance),X.__addSublanguage(b._emitter,b.language)}function oe(){_.subLanguage!=null?Ne():me(),T=""}function le(b,f){b!==""&&(X.startScope(f),X.addText(b),X.endScope())}function ht(b,f){let A=1,R=f.length-1;for(;A<=R;){if(!b._emit[A]){A++;continue}let Q=de.classNameAliases[b[A]]||b[A],be=f[A];Q?le(be,Q):(T=be,me(),T=""),A++}}function ut(b,f){return b.scope&&typeof b.scope=="string"&&X.openNode(de.classNameAliases[b.scope]||b.scope),b.beginScope&&(b.beginScope._wrap?(le(T,de.classNameAliases[b.beginScope._wrap]||b.beginScope._wrap),T=""):b.beginScope._multi&&(ht(b.beginScope,f),T="")),_=Object.create(b,{parent:{value:_}}),_}function bt(b,f,A){let R=K(b.endRe,A);if(R){if(b["on:end"]){let Q=new e(b);b["on:end"](f,Q),Q.isMatchIgnored&&(R=!1)}if(R){for(;b.endsParent&&b.parent;)b=b.parent;return b}}if(b.endsWithParent)return bt(b.parent,f,A)}function xr(b){return _.matcher.regexIndex===0?(T+=b[0],1):(Ke=!0,0)}function _r(b){let f=b[0],A=b.rule,R=new e(A),Q=[A.__beforeBegin,A["on:begin"]];for(let be of Q)if(be&&(be(b,R),R.isMatchIgnored))return xr(f);return A.skip?T+=f:(A.excludeBegin&&(T+=f),oe(),!A.returnBegin&&!A.excludeBegin&&(T=f)),ut(A,b),A.returnBegin?0:f.length}function kr(b){let f=b[0],A=v.substring(b.index),R=bt(_,b,A);if(!R)return at;let Q=_;_.endScope&&_.endScope._wrap?(oe(),le(f,_.endScope._wrap)):_.endScope&&_.endScope._multi?(oe(),ht(_.endScope,b)):Q.skip?T+=f:(Q.returnEnd||Q.excludeEnd||(T+=f),oe(),Q.excludeEnd&&(T=f));do _.scope&&X.closeNode(),!_.skip&&!_.subLanguage&&(Oe+=_.relevance),_=_.parent;while(_!==R.parent);return R.starts&&ut(R.starts,b),Q.returnEnd?0:f.length}function Er(){let b=[];for(let f=_;f!==de;f=f.parent)f.scope&&b.unshift(f.scope);b.forEach(f=>X.openNode(f))}let Re={};function gt(b,f){let A=f&&f[0];if(T+=b,A==null)return oe(),0;if(Re.type==="begin"&&f.type==="end"&&Re.index===f.index&&A===""){if(T+=v.slice(f.index,f.index+1),!D){let R=new Error(`0 width match regex (${c})`);throw R.languageName=c,R.badRule=Re.rule,R}return 1}if(Re=f,f.type==="begin")return _r(f);if(f.type==="illegal"&&!M){let R=new Error('Illegal lexeme "'+A+'" for mode "'+(_.scope||"<unnamed>")+'"');throw R.mode=_,R}else if(f.type==="end"){let R=kr(f);if(R!==at)return R}if(f.type==="illegal"&&A==="")return T+=`
`,1;if(Ge>1e5&&Ge>f.index*3)throw new Error("potential infinite loop, way more iterations than matches");return T+=A,A.length}let de=ge(c);if(!de)throw fe(P.replace("{}",c)),new Error('Unknown language: "'+c+'"');let Sr=ir(de),Ze="",_=z||Sr,mt={},X=new m.__emitter(m);Er();let T="",Oe=0,ve=0,Ge=0,Ke=!1;try{if(de.__emitTokens)de.__emitTokens(v,X);else{for(_.matcher.considerAll();;){Ge++,Ke?Ke=!1:_.matcher.considerAll(),_.matcher.lastIndex=ve;let b=_.matcher.exec(v);if(!b)break;let f=v.substring(ve,b.index),A=gt(f,b);ve=b.index+A}gt(v.substring(ve))}return X.finalize(),Ze=X.toHTML(),{language:c,value:Ze,relevance:Oe,illegal:!1,_emitter:X,_top:_}}catch(b){if(b.message&&b.message.includes("Illegal"))return{language:c,value:He(v),illegal:!0,relevance:0,_illegalBy:{message:b.message,index:ve,context:v.slice(ve-100,ve+100),mode:b.mode,resultSoFar:Ze},_emitter:X};if(D)return{language:c,value:He(v),illegal:!1,relevance:0,errorRaised:b,_emitter:X,_top:_};throw b}}function Ue(c){let v={value:He(c),illegal:!1,relevance:0,_top:p,_emitter:new m.__emitter(m)};return v._emitter.addText(c),v}function Fe(c,v){v=v||m.languages||Object.keys(s);let M=Ue(c),z=v.filter(ge).filter(dt).map(oe=>Ee(oe,c,!1));z.unshift(M);let F=z.sort((oe,le)=>{if(oe.relevance!==le.relevance)return le.relevance-oe.relevance;if(oe.language&&le.language){if(ge(oe.language).supersetOf===le.language)return 1;if(ge(le.language).supersetOf===oe.language)return-1}return 0}),[ce,me]=F,Ne=ce;return Ne.secondBest=me,Ne}function dr(c,v,M){let z=v&&g[v]||M;c.classList.add("hljs"),c.classList.add(`language-${z}`)}function qe(c){let v=null,M=G(c);if(w(M))return;if($e("before:highlightElement",{el:c,language:M}),c.dataset.highlighted){console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",c);return}if(c.children.length>0&&(m.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),console.warn("The element with unescaped HTML:"),console.warn(c)),m.throwUnescapedHTML))throw new cr("One of your code blocks includes unescaped HTML.",c.innerHTML);v=c;let z=v.textContent,F=M?U(z,{language:M,ignoreIllegals:!0}):Fe(z);c.innerHTML=F.value,c.dataset.highlighted="yes",dr(c,M,F.language),c.result={language:F.language,re:F.relevance,relevance:F.relevance},F.secondBest&&(c.secondBest={language:F.secondBest.language,relevance:F.secondBest.relevance}),$e("after:highlightElement",{el:c,result:F,text:z})}function hr(c){m=it(m,c)}let ur=()=>{Le(),xe("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")};function br(){Le(),xe("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")}let ct=!1;function Le(){function c(){Le()}if(document.readyState==="loading"){ct||window.addEventListener("DOMContentLoaded",c,!1),ct=!0;return}document.querySelectorAll(m.cssSelector).forEach(qe)}function gr(c,v){let M=null;try{M=v(r)}catch(z){if(fe("Language definition for '{}' could not be registered.".replace("{}",c)),D)fe(z);else throw z;M=p}M.name||(M.name=c),s[c]=M,M.rawDefinition=v.bind(null,r),M.aliases&&lt(M.aliases,{languageName:c})}function mr(c){delete s[c];for(let v of Object.keys(g))g[v]===c&&delete g[v]}function pr(){return Object.keys(s)}function ge(c){return c=(c||"").toLowerCase(),s[c]||s[g[c]]}function lt(c,{languageName:v}){typeof c=="string"&&(c=[c]),c.forEach(M=>{g[M.toLowerCase()]=v})}function dt(c){let v=ge(c);return v&&!v.disableAutodetect}function fr(c){c["before:highlightBlock"]&&!c["before:highlightElement"]&&(c["before:highlightElement"]=v=>{c["before:highlightBlock"](Object.assign({block:v.el},v))}),c["after:highlightBlock"]&&!c["after:highlightElement"]&&(c["after:highlightElement"]=v=>{c["after:highlightBlock"](Object.assign({block:v.el},v))})}function vr(c){fr(c),E.push(c)}function wr(c){let v=E.indexOf(c);v!==-1&&E.splice(v,1)}function $e(c,v){let M=c;E.forEach(function(z){z[M]&&z[M](v)})}function yr(c){return xe("10.7.0","highlightBlock will be removed entirely in v12.0"),xe("10.7.0","Please use highlightElement now."),qe(c)}Object.assign(r,{highlight:U,highlightAuto:Fe,highlightAll:Le,highlightElement:qe,highlightBlock:yr,configure:hr,initHighlighting:ur,initHighlightingOnLoad:br,registerLanguage:gr,unregisterLanguage:mr,listLanguages:pr,getLanguage:ge,registerAliases:lt,autoDetection:dt,inherit:it,addPlugin:vr,removePlugin:wr}),r.debugMode=function(){D=!1},r.safeMode=function(){D=!0},r.versionString=sr,r.regex={concat:$,lookahead:k,either:B,optional:N,anyNumberOfTimes:S};for(let c in Ce)typeof Ce[c]=="object"&&n(Ce[c]);return Object.assign(r,Ce),r},_e=st({});return _e.newInstance=()=>st({}),Xe=_e,_e.HighlightJS=_e,_e.default=_e,Xe}var jr=Ir(),L=Tr(jr),xt="[A-Za-z$_][0-9A-Za-z$_]*",Br=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Dr=["true","false","null","undefined","NaN","Infinity"],_t=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],kt=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],Et=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Pr=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Hr=[].concat(Et,_t,kt);function St(n){let e=n.regex,t=(C,{after:Z})=>{let re="</"+C[0].slice(1);return C.input.indexOf(re,Z)!==-1},o=xt,i={begin:"<>",end:"</>"},a=/<[A-Za-z0-9\\._:-]+\s*\/>/,h={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(C,Z)=>{let re=C[0].length+C.index,he=C.input[re];if(he==="<"||he===","){Z.ignoreMatch();return}he===">"&&(t(C,{after:re})||Z.ignoreMatch());let ue,pe=C.input.substring(re);if(ue=pe.match(/^\s*=/)){Z.ignoreMatch();return}if((ue=pe.match(/^\s+extends\s+/))&&ue.index===0){Z.ignoreMatch();return}}},u={$pattern:xt,keyword:Br,literal:Dr,built_in:Hr,"variable.language":Pr},l="[0-9](_?[0-9])*",d=`\\.(${l})`,y="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",x={className:"number",variants:[{begin:`(\\b(${y})((${d})|\\.)?|(${d}))[eE][+-]?(${l})\\b`},{begin:`\\b(${y})\\b((${d})\\b|\\.)?|(${d})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},k={className:"subst",begin:"\\$\\{",end:"\\}",keywords:u,contains:[]},S={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,k],subLanguage:"xml"}},N={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,k],subLanguage:"css"}},$={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,k],subLanguage:"graphql"}},q={className:"string",begin:"`",end:"`",contains:[n.BACKSLASH_ESCAPE,k]},B={className:"comment",variants:[n.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:o+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),n.C_BLOCK_COMMENT_MODE,n.C_LINE_COMMENT_MODE]},j=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,S,N,$,q,{match:/\$\d+/},x];k.contains=j.concat({begin:/\{/,end:/\}/,keywords:u,contains:["self"].concat(j)});let K=[].concat(B,k.contains),W=K.concat([{begin:/(\s*)\(/,end:/\)/,keywords:u,contains:["self"].concat(K)}]),I={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:u,contains:W},se={variants:[{match:[/class/,/\s+/,o,/\s+/,/extends/,/\s+/,e.concat(o,"(",e.concat(/\./,o),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,o],scope:{1:"keyword",3:"title.class"}}]},J={relevance:0,match:e.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[..._t,...kt]}},ee={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ne={variants:[{match:[/function/,/\s+/,o,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[I],illegal:/%/},ie={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function ae(C){return e.concat("(?!",C.join("|"),")")}let te={match:e.concat(/\b/,ae([...Et,"super","import"].map(C=>`${C}\\s*\\(`)),o,e.lookahead(/\s*\(/)),className:"title.function",relevance:0},H={begin:e.concat(/\./,e.lookahead(e.concat(o,/(?![0-9A-Za-z$_(])/))),end:o,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},O={match:[/get|set/,/\s+/,o,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},I]},V="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+n.UNDERSCORE_IDENT_RE+")\\s*=>",Y={match:[/const|var|let/,/\s+/,o,/\s*/,/=\s*/,/(async\s*)?/,e.lookahead(V)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[I]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:u,exports:{PARAMS_CONTAINS:W,CLASS_REFERENCE:J},illegal:/#(?![$_A-z])/,contains:[n.SHEBANG({label:"shebang",binary:"node",relevance:5}),ee,n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,S,N,$,q,B,{match:/\$\d+/},x,J,{scope:"attr",match:o+e.lookahead(":"),relevance:0},Y,{begin:"("+n.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[B,n.REGEXP_MODE,{className:"function",begin:V,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:n.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:u,contains:W}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:i.begin,end:i.end},{match:a},{begin:h.begin,"on:begin":h.isTrulyOpeningTag,end:h.end}],subLanguage:"xml",contains:[{begin:h.begin,end:h.end,skip:!0,contains:["self"]}]}]},ne,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+n.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[I,n.inherit(n.TITLE_MODE,{begin:o,className:"title.function"})]},{match:/\.\.\./,relevance:0},H,{match:"\\$"+o,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[I]},te,ie,se,O,{match:/\$[(.]/}]}}var Ur=n=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:n.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:n.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),Fr=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],qr=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],Zr=[...Fr,...qr],Gr=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),Kr=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),Wr=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),Vr=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function Xr(n){let e=n.regex,t=Ur(n),o={begin:/-(webkit|moz|ms|o)-(?=[a-z])/},i="and or not only",a=/@-?\w[\w]*(-\w+)*/,h="[a-zA-Z-][a-zA-Z0-9_-]*",u=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE];return{name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},contains:[t.BLOCK_COMMENT,o,t.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{className:"selector-class",begin:"\\."+h,relevance:0},t.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{begin:":("+Kr.join("|")+")"},{begin:":(:)?("+Wr.join("|")+")"}]},t.CSS_VARIABLE,{className:"attribute",begin:"\\b("+Vr.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,contains:[t.BLOCK_COMMENT,t.HEXCOLOR,t.IMPORTANT,t.CSS_NUMBER_MODE,...u,{begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"},contains:[...u,{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]},t.FUNCTION_DISPATCH]},{begin:e.lookahead(/@/),end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",begin:a},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:i,attribute:Gr.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"},...u,t.CSS_NUMBER_MODE]}]},{className:"selector-tag",begin:"\\b("+Zr.join("|")+")\\b"}]}}function ke(n){let e=n.regex,t=e.concat(/[\p{L}_]/u,e.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),o=/[\p{L}0-9._:-]+/u,i={className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},a={begin:/\s/,contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},h=n.inherit(a,{begin:/\(/,end:/\)/}),u=n.inherit(n.APOS_STRING_MODE,{className:"string"}),l=n.inherit(n.QUOTE_STRING_MODE,{className:"string"}),d={endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",begin:o,relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[i]},{begin:/'/,end:/'/,contains:[i]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,relevance:10,contains:[a,l,u,h,{begin:/\[/,end:/\]/,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,contains:[a,h,l,u]}]}]},n.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},i,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,relevance:10,contains:[l]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[d],starts:{end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[d],starts:{end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{className:"tag",begin:/<>|<\/>/},{className:"tag",begin:e.concat(/</,e.lookahead(e.concat(t,e.either(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",begin:t,relevance:0,starts:d}]},{className:"tag",begin:e.concat(/<\//,e.lookahead(e.concat(t,/>/))),contains:[{className:"name",begin:t,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}function Jr(n){let e={className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},t={match:/[{}[\],:]/,className:"punctuation",relevance:0},o=["true","false","null"],i={scope:"literal",beginKeywords:o.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{literal:o},contains:[e,t,n.QUOTE_STRING_MODE,i,n.C_NUMBER_MODE,n.C_LINE_COMMENT_MODE,n.C_BLOCK_COMMENT_MODE],illegal:"\\S"}}function At(n){let e="true false yes no null",t="[\\w#;/?:@&=+$,.~*'()[\\]]+",o={className:"attr",variants:[{begin:/[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/},{begin:/"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/},{begin:/'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/}]},i={className:"template-variable",variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]},a={className:"string",relevance:0,begin:/'/,end:/'/,contains:[{match:/''/,scope:"char.escape",relevance:0}]},h={className:"string",relevance:0,variants:[{begin:/"/,end:/"/},{begin:/\S+/}],contains:[n.BACKSLASH_ESCAPE,i]},u=n.inherit(h,{variants:[{begin:/'/,end:/'/,contains:[{begin:/''/,relevance:0}]},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),l={className:"number",begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"},d={end:",",endsWithParent:!0,excludeEnd:!0,keywords:e,relevance:0},y={begin:/\{/,end:/\}/,contains:[d],illegal:"\\n",relevance:0},x={begin:"\\[",end:"\\]",contains:[d],illegal:"\\n",relevance:0},k=[o,{className:"meta",begin:"^---\\s*$",relevance:10},{className:"string",begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,relevance:0},{className:"type",begin:"!\\w+!"+t},{className:"type",begin:"!<"+t+">"},{className:"type",begin:"!"+t},{className:"type",begin:"!!"+t},{className:"meta",begin:"&"+n.UNDERSCORE_IDENT_RE+"$"},{className:"meta",begin:"\\*"+n.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",relevance:0},n.HASH_COMMENT_MODE,{beginKeywords:e,keywords:{literal:e}},l,{className:"number",begin:n.C_NUMBER_RE+"\\b",relevance:0},y,x,a,h],S=[...k];return S.pop(),S.push(u),d.contains=S,{name:"YAML",case_insensitive:!0,aliases:["yml"],contains:k}}function Qr(n){let e=n.regex,t=/(?![A-Za-z0-9])(?![$])/,o=e.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,t),i=e.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,t),a=e.concat(/[A-Z]+/,t),h={scope:"variable",match:"\\$+"+o},u={scope:"meta",variants:[{begin:/<\?php/,relevance:10},{begin:/<\?=/},{begin:/<\?/,relevance:.1},{begin:/\?>/}]},l={scope:"subst",variants:[{begin:/\$\w+/},{begin:/\{\$/,end:/\}/}]},d=n.inherit(n.APOS_STRING_MODE,{illegal:null}),y=n.inherit(n.QUOTE_STRING_MODE,{illegal:null,contains:n.QUOTE_STRING_MODE.contains.concat(l)}),x={begin:/<<<[ \t]*(?:(\w+)|"(\w+)")\n/,end:/[ \t]*(\w+)\b/,contains:n.QUOTE_STRING_MODE.contains.concat(l),"on:begin":(H,O)=>{O.data._beginMatch=H[1]||H[2]},"on:end":(H,O)=>{O.data._beginMatch!==H[1]&&O.ignoreMatch()}},k=n.END_SAME_AS_BEGIN({begin:/<<<[ \t]*'(\w+)'\n/,end:/[ \t]*(\w+)\b/}),S=`[ 	
]`,N={scope:"string",variants:[y,d,x,k]},$={scope:"number",variants:[{begin:"\\b0[bB][01]+(?:_[01]+)*\\b"},{begin:"\\b0[oO][0-7]+(?:_[0-7]+)*\\b"},{begin:"\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"},{begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"}],relevance:0},q=["false","null","true"],B=["__CLASS__","__DIR__","__FILE__","__FUNCTION__","__COMPILER_HALT_OFFSET__","__LINE__","__METHOD__","__NAMESPACE__","__TRAIT__","die","echo","exit","include","include_once","print","require","require_once","array","abstract","and","as","binary","bool","boolean","break","callable","case","catch","class","clone","const","continue","declare","default","do","double","else","elseif","empty","enddeclare","endfor","endforeach","endif","endswitch","endwhile","enum","eval","extends","final","finally","float","for","foreach","from","global","goto","if","implements","instanceof","insteadof","int","integer","interface","isset","iterable","list","match|0","mixed","new","never","object","or","private","protected","public","readonly","real","return","string","switch","throw","trait","try","unset","use","var","void","while","xor","yield"],j=["Error|0","AppendIterator","ArgumentCountError","ArithmeticError","ArrayIterator","ArrayObject","AssertionError","BadFunctionCallException","BadMethodCallException","CachingIterator","CallbackFilterIterator","CompileError","Countable","DirectoryIterator","DivisionByZeroError","DomainException","EmptyIterator","ErrorException","Exception","FilesystemIterator","FilterIterator","GlobIterator","InfiniteIterator","InvalidArgumentException","IteratorIterator","LengthException","LimitIterator","LogicException","MultipleIterator","NoRewindIterator","OutOfBoundsException","OutOfRangeException","OuterIterator","OverflowException","ParentIterator","ParseError","RangeException","RecursiveArrayIterator","RecursiveCachingIterator","RecursiveCallbackFilterIterator","RecursiveDirectoryIterator","RecursiveFilterIterator","RecursiveIterator","RecursiveIteratorIterator","RecursiveRegexIterator","RecursiveTreeIterator","RegexIterator","RuntimeException","SeekableIterator","SplDoublyLinkedList","SplFileInfo","SplFileObject","SplFixedArray","SplHeap","SplMaxHeap","SplMinHeap","SplObjectStorage","SplObserver","SplPriorityQueue","SplQueue","SplStack","SplSubject","SplTempFileObject","TypeError","UnderflowException","UnexpectedValueException","UnhandledMatchError","ArrayAccess","BackedEnum","Closure","Fiber","Generator","Iterator","IteratorAggregate","Serializable","Stringable","Throwable","Traversable","UnitEnum","WeakReference","WeakMap","Directory","__PHP_Incomplete_Class","parent","php_user_filter","self","static","stdClass"],K={keyword:B,literal:(H=>{let O=[];return H.forEach(V=>{O.push(V),V.toLowerCase()===V?O.push(V.toUpperCase()):O.push(V.toLowerCase())}),O})(q),built_in:j},W=H=>H.map(O=>O.replace(/\|\d+$/,"")),I={variants:[{match:[/new/,e.concat(S,"+"),e.concat("(?!",W(j).join("\\b|"),"\\b)"),i],scope:{1:"keyword",4:"title.class"}}]},se=e.concat(o,"\\b(?!\\()"),J={variants:[{match:[e.concat(/::/,e.lookahead(/(?!class\b)/)),se],scope:{2:"variable.constant"}},{match:[/::/,/class/],scope:{2:"variable.language"}},{match:[i,e.concat(/::/,e.lookahead(/(?!class\b)/)),se],scope:{1:"title.class",3:"variable.constant"}},{match:[i,e.concat("::",e.lookahead(/(?!class\b)/))],scope:{1:"title.class"}},{match:[i,/::/,/class/],scope:{1:"title.class",3:"variable.language"}}]},ee={scope:"attr",match:e.concat(o,e.lookahead(":"),e.lookahead(/(?!::)/))},ne={relevance:0,begin:/\(/,end:/\)/,keywords:K,contains:[ee,h,J,n.C_BLOCK_COMMENT_MODE,N,$,I]},ie={relevance:0,match:[/\b/,e.concat("(?!fn\\b|function\\b|",W(B).join("\\b|"),"|",W(j).join("\\b|"),"\\b)"),o,e.concat(S,"*"),e.lookahead(/(?=\()/)],scope:{3:"title.function.invoke"},contains:[ne]};ne.contains.push(ie);let ae=[ee,J,n.C_BLOCK_COMMENT_MODE,N,$,I],te={begin:e.concat(/#\[\s*\\?/,e.either(i,a)),beginScope:"meta",end:/]/,endScope:"meta",keywords:{literal:q,keyword:["new","array"]},contains:[{begin:/\[/,end:/]/,keywords:{literal:q,keyword:["new","array"]},contains:["self",...ae]},...ae,{scope:"meta",variants:[{match:i},{match:a}]}]};return{case_insensitive:!1,keywords:K,contains:[te,n.HASH_COMMENT_MODE,n.COMMENT("//","$"),n.COMMENT("/\\*","\\*/",{contains:[{scope:"doctag",match:"@[A-Za-z]+"}]}),{match:/__halt_compiler\(\);/,keywords:"__halt_compiler",starts:{scope:"comment",end:n.MATCH_NOTHING_RE,contains:[{match:/\?>/,scope:"meta",endsParent:!0}]}},u,{scope:"variable.language",match:/\$this\b/},h,ie,J,{match:[/const/,/\s/,o],scope:{1:"keyword",3:"variable.constant"}},I,{scope:"function",relevance:0,beginKeywords:"fn function",end:/[;{]/,excludeEnd:!0,illegal:"[$%\\[]",contains:[{beginKeywords:"use"},n.UNDERSCORE_TITLE_MODE,{begin:"=>",endsParent:!0},{scope:"params",begin:"\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0,keywords:K,contains:["self",te,h,J,n.C_BLOCK_COMMENT_MODE,N,$]}]},{scope:"class",variants:[{beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{beginKeywords:"extends implements"},n.UNDERSCORE_TITLE_MODE]},{beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,contains:[n.inherit(n.UNDERSCORE_TITLE_MODE,{scope:"title.class"})]},{beginKeywords:"use",relevance:0,end:";",contains:[{match:/\b(as|const|function)\b/,scope:"keyword"},n.UNDERSCORE_TITLE_MODE]},N,$]}}function Yr(n){let e=n.regex,t="HTTP/([32]|1\\.[01])",o=/[A-Za-z][A-Za-z0-9-]*/,i={className:"attribute",begin:e.concat("^",o,"(?=\\:\\s)"),starts:{contains:[{className:"punctuation",begin:/: /,relevance:0,starts:{end:"$",relevance:0}}]}},a=[i,{begin:"\\n\\n",starts:{subLanguage:[],endsWithParent:!0}}];return{name:"HTTP",aliases:["https"],illegal:/\S/,contains:[{begin:"^(?="+t+" \\d{3})",end:/$/,contains:[{className:"meta",begin:t},{className:"number",begin:"\\b\\d{3}\\b"}],starts:{end:/\b\B/,illegal:/\S/,contains:a}},{begin:"(?=^[A-Z]+ (.*?) "+t+"$)",end:/$/,contains:[{className:"string",begin:" ",end:" ",excludeBegin:!0,excludeEnd:!0},{className:"meta",begin:t},{className:"keyword",begin:"[A-Z]+"}],starts:{end:/\b\B/,illegal:/\S/,contains:a}},n.inherit(i,{relevance:0})]}}function je(n){return{name:"Plain text",aliases:["text","txt"],disableAutodetect:!0}}function eo(n){let e=n.regex;return{name:"Diff",aliases:["patch"],contains:[{className:"meta",relevance:10,match:e.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)},{className:"comment",variants:[{begin:e.either(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,end:/$/}]}}function Be(n){let e=n.regex,t={},o={begin:/\$\{/,end:/\}/,contains:["self",{begin:/:-/,contains:[t]}]};Object.assign(t,{className:"variable",variants:[{begin:e.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},o]});let i={className:"subst",begin:/\$\(/,end:/\)/,contains:[n.BACKSLASH_ESCAPE]},a=n.inherit(n.COMMENT(),{match:[/(^|\s)/,/#.*$/],scope:{2:"comment"}}),h={begin:/<<-?\s*(?=\w+)/,starts:{contains:[n.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,className:"string"})]}},u={className:"string",begin:/"/,end:/"/,contains:[n.BACKSLASH_ESCAPE,t,i]};i.contains.push(u);let l={match:/\\"/},d={className:"string",begin:/'/,end:/'/},y={match:/\\'/},x={begin:/\$?\(\(/,end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},n.NUMBER_MODE,t]},k=["fish","bash","zsh","sh","csh","ksh","tcsh","dash","scsh"],S=n.SHEBANG({binary:`(${k.join("|")})`,relevance:10}),N={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,contains:[n.inherit(n.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0},$=["if","then","else","elif","fi","time","for","while","until","in","do","done","case","esac","coproc","function","select"],q=["true","false"],B={match:/(\/[a-z._-]+)+/},j=["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset"],K=["alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","sudo","type","typeset","ulimit","unalias"],W=["autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp"],I=["chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"];return{name:"Bash",aliases:["sh","zsh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,keyword:$,literal:q,built_in:[...j,...K,"set","shopt",...W,...I]},contains:[S,n.SHEBANG(),N,x,a,h,B,u,l,d,y,t]}}function Ct(n){let e=n.regex,t=new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*","u"),o=["and","as","assert","async","await","break","case","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","match","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],i={$pattern:/[A-Za-z]\w+|__\w+__/,keyword:o,built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]},a={className:"meta",begin:/^(>>>|\.\.\.) /},h={className:"subst",begin:/\{/,end:/\}/,keywords:i,illegal:/#/},u={begin:/\{\{/,relevance:0},l={className:"string",contains:[n.BACKSLASH_ESCAPE],variants:[{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,contains:[n.BACKSLASH_ESCAPE,a],relevance:10},{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,contains:[n.BACKSLASH_ESCAPE,a],relevance:10},{begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,contains:[n.BACKSLASH_ESCAPE,a,u,h]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,end:/"""/,contains:[n.BACKSLASH_ESCAPE,a,u,h]},{begin:/([uU]|[rR])'/,end:/'/,relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,contains:[n.BACKSLASH_ESCAPE,u,h]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,contains:[n.BACKSLASH_ESCAPE,u,h]},n.APOS_STRING_MODE,n.QUOTE_STRING_MODE]},d="[0-9](_?[0-9])*",y=`(\\b(${d}))?\\.(${d})|\\b(${d})\\.`,x=`\\b|${o.join("|")}`,k={className:"number",relevance:0,variants:[{begin:`(\\b(${d})|(${y}))[eE][+-]?(${d})[jJ]?(?=${x})`},{begin:`(${y})[jJ]?`},{begin:`\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${x})`},{begin:`\\b0[bB](_?[01])+[lL]?(?=${x})`},{begin:`\\b0[oO](_?[0-7])+[lL]?(?=${x})`},{begin:`\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${x})`},{begin:`\\b(${d})[jJ](?=${x})`}]},S={className:"comment",begin:e.lookahead(/# type:/),end:/$/,keywords:i,contains:[{begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]},N={className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:i,contains:["self",a,k,l,n.HASH_COMMENT_MODE]}]};return h.contains=[l,k,a],{name:"Python",aliases:["py","gyp","ipython"],unicodeRegex:!0,keywords:i,illegal:/(<\/|\?)|=>/,contains:[a,k,{scope:"variable.language",match:/\bself\b/},{beginKeywords:"if",relevance:0},{match:/\bor\b/,scope:"keyword"},l,S,n.HASH_COMMENT_MODE,{match:[/\bdef/,/\s+/,t],scope:{1:"keyword",3:"title.function"},contains:[N]},{variants:[{match:[/\bclass/,/\s+/,t,/\s*/,/\(\s*/,t,/\s*\)/]},{match:[/\bclass/,/\s+/,t]}],scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[k,N,l]}]}}var Te="[A-Za-z$_][0-9A-Za-z$_]*",Mt=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Lt=["true","false","null","undefined","NaN","Infinity"],$t=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],Nt=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],Rt=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Ot=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],zt=[].concat(Rt,$t,Nt);function to(n){let e=n.regex,t=(C,{after:Z})=>{let re="</"+C[0].slice(1);return C.input.indexOf(re,Z)!==-1},o=Te,i={begin:"<>",end:"</>"},a=/<[A-Za-z0-9\\._:-]+\s*\/>/,h={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(C,Z)=>{let re=C[0].length+C.index,he=C.input[re];if(he==="<"||he===","){Z.ignoreMatch();return}he===">"&&(t(C,{after:re})||Z.ignoreMatch());let ue,pe=C.input.substring(re);if(ue=pe.match(/^\s*=/)){Z.ignoreMatch();return}if((ue=pe.match(/^\s+extends\s+/))&&ue.index===0){Z.ignoreMatch();return}}},u={$pattern:Te,keyword:Mt,literal:Lt,built_in:zt,"variable.language":Ot},l="[0-9](_?[0-9])*",d=`\\.(${l})`,y="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",x={className:"number",variants:[{begin:`(\\b(${y})((${d})|\\.)?|(${d}))[eE][+-]?(${l})\\b`},{begin:`\\b(${y})\\b((${d})\\b|\\.)?|(${d})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},k={className:"subst",begin:"\\$\\{",end:"\\}",keywords:u,contains:[]},S={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,k],subLanguage:"xml"}},N={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,k],subLanguage:"css"}},$={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,k],subLanguage:"graphql"}},q={className:"string",begin:"`",end:"`",contains:[n.BACKSLASH_ESCAPE,k]},B={className:"comment",variants:[n.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:o+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),n.C_BLOCK_COMMENT_MODE,n.C_LINE_COMMENT_MODE]},j=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,S,N,$,q,{match:/\$\d+/},x];k.contains=j.concat({begin:/\{/,end:/\}/,keywords:u,contains:["self"].concat(j)});let K=[].concat(B,k.contains),W=K.concat([{begin:/(\s*)\(/,end:/\)/,keywords:u,contains:["self"].concat(K)}]),I={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:u,contains:W},se={variants:[{match:[/class/,/\s+/,o,/\s+/,/extends/,/\s+/,e.concat(o,"(",e.concat(/\./,o),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,o],scope:{1:"keyword",3:"title.class"}}]},J={relevance:0,match:e.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...$t,...Nt]}},ee={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ne={variants:[{match:[/function/,/\s+/,o,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[I],illegal:/%/},ie={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function ae(C){return e.concat("(?!",C.join("|"),")")}let te={match:e.concat(/\b/,ae([...Rt,"super","import"].map(C=>`${C}\\s*\\(`)),o,e.lookahead(/\s*\(/)),className:"title.function",relevance:0},H={begin:e.concat(/\./,e.lookahead(e.concat(o,/(?![0-9A-Za-z$_(])/))),end:o,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},O={match:[/get|set/,/\s+/,o,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},I]},V="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+n.UNDERSCORE_IDENT_RE+")\\s*=>",Y={match:[/const|var|let/,/\s+/,o,/\s*/,/=\s*/,/(async\s*)?/,e.lookahead(V)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[I]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:u,exports:{PARAMS_CONTAINS:W,CLASS_REFERENCE:J},illegal:/#(?![$_A-z])/,contains:[n.SHEBANG({label:"shebang",binary:"node",relevance:5}),ee,n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,S,N,$,q,B,{match:/\$\d+/},x,J,{scope:"attr",match:o+e.lookahead(":"),relevance:0},Y,{begin:"("+n.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[B,n.REGEXP_MODE,{className:"function",begin:V,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:n.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:u,contains:W}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:i.begin,end:i.end},{match:a},{begin:h.begin,"on:begin":h.isTrulyOpeningTag,end:h.end}],subLanguage:"xml",contains:[{begin:h.begin,end:h.end,skip:!0,contains:["self"]}]}]},ne,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+n.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[I,n.inherit(n.TITLE_MODE,{begin:o,className:"title.function"})]},{match:/\.\.\./,relevance:0},H,{match:"\\$"+o,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[I]},te,ie,se,O,{match:/\$[(.]/}]}}function Tt(n){let e=n.regex,t=to(n),o=Te,i=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],a={begin:[/namespace/,/\s+/,n.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}},h={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{keyword:"interface extends",built_in:i},contains:[t.exports.CLASS_REFERENCE]},u={className:"meta",relevance:10,begin:/^\s*['"]use strict['"]/},l=["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"],d={$pattern:Te,keyword:Mt.concat(l),literal:Lt,built_in:zt.concat(i),"variable.language":Ot},y={className:"meta",begin:"@"+o},x=($,q,B)=>{let j=$.contains.findIndex(K=>K.label===q);if(j===-1)throw new Error("can not find mode to replace");$.contains.splice(j,1,B)};Object.assign(t.keywords,d),t.exports.PARAMS_CONTAINS.push(y);let k=t.contains.find($=>$.scope==="attr"),S=Object.assign({},k,{match:e.concat(o,e.lookahead(/\s*\?:/))});t.exports.PARAMS_CONTAINS.push([t.exports.CLASS_REFERENCE,k,S]),t.contains=t.contains.concat([y,a,h,S]),x(t,"shebang",n.SHEBANG()),x(t,"use_strict",u);let N=t.contains.find($=>$.label==="func.def");return N.relevance=0,Object.assign(t,{name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),t}function It(n){let e=n.regex,t={begin:/<\/?[A-Za-z_]/,end:">",subLanguage:"xml",relevance:0},o={begin:"^[-\\*]{3,}",end:"$"},i={className:"code",variants:[{begin:"(`{3,})[^`](.|\\n)*?\\1`*[ ]*"},{begin:"(~{3,})[^~](.|\\n)*?\\1~*[ ]*"},{begin:"```",end:"```+[ ]*$"},{begin:"~~~",end:"~~~+[ ]*$"},{begin:"`.+?`"},{begin:"(?=^( {4}|\\t))",contains:[{begin:"^( {4}|\\t)",end:"(\\n)$"}],relevance:0}]},a={className:"bullet",begin:"^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",end:"\\s+",excludeEnd:!0},h={begin:/^\[[^\n]+\]:/,returnBegin:!0,contains:[{className:"symbol",begin:/\[/,end:/\]/,excludeBegin:!0,excludeEnd:!0},{className:"link",begin:/:\s*/,end:/$/,excludeBegin:!0}]},u=/[A-Za-z][A-Za-z0-9+.-]*/,l={variants:[{begin:/\[.+?\]\[.*?\]/,relevance:0},{begin:/\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,relevance:2},{begin:e.concat(/\[.+?\]\(/,u,/:\/\/.*?\)/),relevance:2},{begin:/\[.+?\]\([./?&#].*?\)/,relevance:1},{begin:/\[.*?\]\(.*?\)/,relevance:0}],returnBegin:!0,contains:[{match:/\[(?=\])/},{className:"string",relevance:0,begin:"\\[",end:"\\]",excludeBegin:!0,returnEnd:!0},{className:"link",relevance:0,begin:"\\]\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0},{className:"symbol",relevance:0,begin:"\\]\\[",end:"\\]",excludeBegin:!0,excludeEnd:!0}]},d={className:"strong",contains:[],variants:[{begin:/_{2}(?!\s)/,end:/_{2}/},{begin:/\*{2}(?!\s)/,end:/\*{2}/}]},y={className:"emphasis",contains:[],variants:[{begin:/\*(?![*\s])/,end:/\*/},{begin:/_(?![_\s])/,end:/_/,relevance:0}]},x=n.inherit(d,{contains:[]}),k=n.inherit(y,{contains:[]});d.contains.push(k),y.contains.push(x);let S=[t,l];return[d,y,x,k].forEach(N=>{N.contains=N.contains.concat(S)}),S=S.concat(d,y),{name:"Markdown",aliases:["md","mkdown","mkd"],contains:[{className:"section",variants:[{begin:"^#{1,6}",end:"$",contains:S},{begin:"(?=^.+?\\n[=-]{2,}$)",contains:[{begin:"^[=-]*$"},{begin:"^",end:"\\n",contains:S}]}]},t,a,d,y,{className:"quote",begin:"^>\\s+",contains:S,end:"$"},i,o,l,h,{scope:"literal",match:/&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/}]}}function De(n){let e=n.regex,t=["absolute_url","asset|0","asset_version","attribute","block","constant","controller|0","country_timezones","csrf_token","cycle","date","dump","expression","form|0","form_end","form_errors","form_help","form_label","form_rest","form_row","form_start","form_widget","html_classes","include","is_granted","logout_path","logout_url","max","min","parent","path|0","random","range","relative_path","render","render_esi","source","template_from_string","url|0"],o=["abs","abbr_class","abbr_method","batch","capitalize","column","convert_encoding","country_name","currency_name","currency_symbol","data_uri","date","date_modify","default","escape","file_excerpt","file_link","file_relative","filter","first","format","format_args","format_args_as_text","format_currency","format_date","format_datetime","format_file","format_file_from_text","format_number","format_time","html_to_markdown","humanize","inky_to_html","inline_css","join","json_encode","keys","language_name","last","length","locale_name","lower","map","markdown","markdown_to_html","merge","nl2br","number_format","raw","reduce","replace","reverse","round","slice","slug","sort","spaceless","split","striptags","timezone_name","title","trans","transchoice","trim","u|0","upper","url_encode","yaml_dump","yaml_encode"],i=["apply","autoescape","block","cache","deprecated","do","embed","extends","filter","flush","for","form_theme","from","if","import","include","macro","sandbox","set","stopwatch","trans","trans_default_domain","transchoice","use","verbatim","with"];i=i.concat(i.map(N=>`end${N}`));let a={scope:"string",variants:[{begin:/'/,end:/'/},{begin:/"/,end:/"/}]},h={scope:"number",match:/\d+/},u={begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,contains:[a,h]},l={beginKeywords:t.join(" "),keywords:{name:t},relevance:0,contains:[u]},d={match:/\|(?=[A-Za-z_]+:?)/,beginScope:"punctuation",relevance:0,contains:[{match:/[A-Za-z_]+:?/,keywords:o}]},y=(N,{relevance:$})=>({beginScope:{1:"template-tag",3:"name"},relevance:$||2,endScope:"template-tag",begin:[/\{%/,/\s*/,e.either(...N)],end:/%\}/,keywords:"in",contains:[d,l,a,h]}),x=/[a-z_]+/,k=y(i,{relevance:2}),S=y([x],{relevance:1});return{name:"Twig",aliases:["craftcms"],case_insensitive:!0,subLanguage:"xml",contains:[n.COMMENT(/\{#/,/#\}/),k,S,{className:"template-variable",begin:/\{\{/,end:/\}\}/,contains:["self",d,l,a,h]}]}}L.registerLanguage("javascript",St);L.registerLanguage("js",St);L.registerLanguage("css",Xr);L.registerLanguage("html",ke);L.registerLanguage("xml",ke);L.registerLanguage("xhtml",ke);L.registerLanguage("svg",ke);L.registerLanguage("markup",ke);L.registerLanguage("json",Jr);L.registerLanguage("yaml",At);L.registerLanguage("yml",At);L.registerLanguage("php",Qr);L.registerLanguage("http",Yr);L.registerLanguage("plaintext",je);L.registerLanguage("text",je);L.registerLanguage("txt",je);L.registerLanguage("csv",je);L.registerLanguage("diff",eo);L.registerLanguage("bash",Be);L.registerLanguage("shell",Be);L.registerLanguage("sh",Be);L.registerLanguage("zsh",Be);L.registerLanguage("python",Ct);L.registerLanguage("py",Ct);L.registerLanguage("typescript",Tt);L.registerLanguage("ts",Tt);L.registerLanguage("markdown",It);L.registerLanguage("md",It);L.registerLanguage("astro",ke);L.registerLanguage("nunjucks",De);L.registerLanguage("njk",De);L.registerLanguage("jinja",De);L.registerLanguage("jinja2",De);function ro(n){let e=/(<\/?span[^>]*>)|([^<]+)/g,t=[""],o=[],i;for(;(i=e.exec(n))!==null;){let a=i[1],h=i[2];if(a)a.startsWith("</")?o.pop():o.push(a),t[t.length-1]+=a;else{let u=h.split(`
`);for(let l=0;l<u.length;l++)l>0&&(t[t.length-1]+="</span>".repeat(o.length),t.push(o.join(""))),t[t.length-1]+=u[l]}}return t}if(typeof document<"u"){let n=document.createElement("style");n.textContent="code-block:not(:defined),code-block-group:not(:defined){display:block;opacity:0}",document.head.appendChild(n)}var Ae=new Set,ye=null,Ie=null;function Pe(){let n=document.documentElement,e=document.body;if(!n||!e)return null;if(n.classList.contains("dark")||e.classList.contains("dark")||n.getAttribute("data-theme")==="dark"||e.getAttribute("data-theme")==="dark")return!0;if(n.getAttribute("data-theme")==="light"||e.getAttribute("data-theme")==="light")return!1;if(n.getAttribute("data-bs-theme")==="dark"||e.getAttribute("data-bs-theme")==="dark")return!0;if(n.getAttribute("data-bs-theme")==="light"||e.getAttribute("data-bs-theme")==="light")return!1;if(n.getAttribute("data-mode")==="dark")return!0;if(n.getAttribute("data-mode")==="light")return!1;let t=getComputedStyle(n).colorScheme;return t==="dark"?!0:t==="light"?!1:null}function oo(){let n=Pe();if(n!==Ie){Ie=n;for(let e of Ae)e._onPageModeChange(n)}}function no(){if(ye)return;ye=new MutationObserver(oo);let n={attributes:!0,attributeFilter:["class","data-theme","data-bs-theme","data-mode","style"]};ye.observe(document.documentElement,n),document.body&&ye.observe(document.body,n)}function io(){ye&&(ye.disconnect(),ye=null)}function Je(n){Ae.add(n),Ae.size===1&&no();let e=Pe();Ie=e,n._onPageModeChange(e)}function jt(n){Ae.delete(n),Ae.size===0&&(io(),Ie=null)}var Qe=class extends HTMLElement{constructor(){super(),this.shadowRoot||this.attachShadow({mode:"open"}),this._codeContent=null,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this),this._observer=null,this._highlighted=!1,this._isLoading=!1,this._loadError=null}connectedCallback(){var e;if((e=this.shadowRoot)!=null&&e.children.length&&this.hasAttribute("data-ssr")){let o=this.querySelector("textarea");o&&(this._codeContent=o.value||o.textContent,o.remove()),this._hydrateInteractivity(),Je(this);return}let t=this.querySelector("textarea");t?(this._codeContent=t.value||t.textContent,t.remove()):this._codeContent=this.textContent,this.src?this._loadFromSrc():this.hasAttribute("lazy")?(this.renderPlaceholder(),this._setupLazyObserver()):this.render(),Je(this)}disconnectedCallback(){jt(this),this._observer&&(this._observer.disconnect(),this._observer=null),document.removeEventListener("click",this._handleOutsideClick)}_setupLazyObserver(){this._observer||(this._observer=new IntersectionObserver(e=>{e[0].isIntersecting&&!this._highlighted&&(this._highlighted=!0,this.render(),this._observer.disconnect(),this._observer=null)},{rootMargin:"100px"}),this._observer.observe(this))}async _loadFromSrc(){let e=this.src;if(e){this._isLoading=!0,this._loadError=null,this._renderLoadingState();try{let t=await fetch(e);if(!t.ok)throw new Error(`HTTP ${t.status}: ${t.statusText}`);let o=await t.text();if(this._codeContent=o,!this.hasAttribute("language")){let i=this._detectLanguageFromUrl(e);i&&this.setAttribute("language",i)}if(!this.hasAttribute("filename")){let i=e.split("/").pop().split("?")[0];i&&this.setAttribute("filename",i)}this._isLoading=!1,this.render(),this.dispatchEvent(new CustomEvent("code-loaded",{detail:{url:e,code:o},bubbles:!0}))}catch(t){this._isLoading=!1,this._loadError=t.message,this._renderErrorState(),this.dispatchEvent(new CustomEvent("code-load-error",{detail:{url:e,error:t.message},bubbles:!0}))}}}_detectLanguageFromUrl(e){let t={js:"javascript",mjs:"javascript",cjs:"javascript",ts:"typescript",tsx:"typescript",jsx:"javascript",py:"python",css:"css",html:"html",htm:"html",json:"json",yaml:"yaml",yml:"yaml",xml:"xml",svg:"xml",sh:"bash",bash:"bash",zsh:"bash",php:"php",diff:"diff",patch:"diff",md:"markdown",markdown:"markdown",txt:"plaintext"},o=e.split("/").pop().split("?")[0].split("#")[0].split(".").pop().toLowerCase();return t[o]||null}_renderLoadingState(){let e=this.theme==="dark";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          <span class="label">Loading...</span>
          ${this.src?`<span class="filename">${this.escapeHtml(this.src.split("/").pop().split("?")[0])}</span>`:""}
        </div>
      </div>
      <div class="code-container" style="padding: 2rem; text-align: center;">
        <div class="loading-spinner" style="
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 2px solid ${e?"#30363d":"#e1e4e8"};
          border-top-color: ${e?"#58a6ff":"#0969da"};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `}_renderErrorState(){let e=this.theme==="dark";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          <span class="label" style="color: ${e?"#f85149":"#cf222e"};">Error</span>
          ${this.src?`<span class="filename">${this.escapeHtml(this.src.split("/").pop().split("?")[0])}</span>`:""}
        </div>
        <div class="header-actions">
          <button class="copy-button" onclick="this.getRootNode().host._loadFromSrc()">Retry</button>
        </div>
      </div>
      <div class="code-container" style="padding: 1.5rem; text-align: center;">
        <div style="color: ${e?"#f85149":"#cf222e"}; margin-bottom: 0.5rem;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div style="color: ${e?"#8b949e":"#57606a"}; font-size: 0.875rem;">
          Failed to load: ${this.escapeHtml(this._loadError||"Unknown error")}
        </div>
        <div style="color: ${e?"#484f58":"#6e7781"}; font-size: 0.75rem; margin-top: 0.25rem;">
          ${this.escapeHtml(this.src)}
        </div>
      </div>
    `}static get observedAttributes(){return["language","label","theme","data-page-theme","show-lines","start-line","end-line","filename","highlight-lines","collapsed","max-lines","max-height","wrap","copy-text","copied-text","show-share","show-download","no-copy","lazy","focus-mode","src"]}attributeChangedCallback(e,t,o){if(this.shadowRoot&&t!==o){if(e==="src"&&o){this._loadFromSrc();return}e==="theme"&&(this.hasAttribute("theme")?this.removeAttribute("data-page-theme"):this._onPageModeChange(Pe())),this.render()}}_onPageModeChange(e){if(this.hasAttribute("theme")){this.removeAttribute("data-page-theme");return}e===!0?this.setAttribute("data-page-theme","dark"):e===!1?this.setAttribute("data-page-theme","light"):this.removeAttribute("data-page-theme")}get language(){return this.getAttribute("language")||"plaintext"}get label(){return this.getAttribute("label")||this.filename||this.language.toUpperCase()}get theme(){return this.getAttribute("theme")||this.getAttribute("data-page-theme")||"light"}get showLines(){return this.hasAttribute("show-lines")}get startLine(){let e=this.getAttribute("start-line");if(e===null)return 1;let t=parseInt(e,10);return Number.isFinite(t)&&t>=1?t:1}get endLine(){let e=this.getAttribute("end-line");if(e===null)return null;let t=parseInt(e,10);return Number.isFinite(t)&&t>=1?t:null}get filename(){return this.getAttribute("filename")||""}get highlightLines(){let e=this.getAttribute("highlight-lines");if(!e)return new Set;let t=new Set,o=e.split(",");for(let i of o){let a=i.trim();if(a.includes("-")){let[h,u]=a.split("-").map(Number);for(let l=h;l<=u;l++)t.add(l)}else t.add(Number(a))}return t}get collapsed(){return this.hasAttribute("collapsed")}get maxLines(){let e=this.getAttribute("max-lines");return e?parseInt(e,10):10}get maxHeight(){return this.getAttribute("max-height")||""}get wrap(){return this.hasAttribute("wrap")}get copyText(){return this.getAttribute("copy-text")||"Copy"}get copiedText(){return this.getAttribute("copied-text")||"Copied!"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get noCopy(){return this.hasAttribute("no-copy")}get lazy(){return this.hasAttribute("lazy")}get focusMode(){return this.hasAttribute("focus-mode")}get src(){return this.getAttribute("src")||""}async copyCode(){let e=this.getCode(),t=this.shadowRoot.querySelector(".copy-button"),o=this.copyText,i=this.copiedText;try{await navigator.clipboard.writeText(e),t.textContent=i,t.classList.add("copied"),t.setAttribute("aria-label","Code copied to clipboard")}catch(a){console.error("Failed to copy code:",a),t.textContent="Failed",t.classList.add("failed"),t.setAttribute("aria-label","Failed to copy code")}setTimeout(()=>{t.textContent=o,t.classList.remove("copied","failed"),t.setAttribute("aria-label","Copy code to clipboard")},2e3)}downloadCode(){let e=this.getCode(),t=this.filename||`code.${this._getFileExtension()}`,o=new Blob([e],{type:"text/plain"}),i=URL.createObjectURL(o),a=document.createElement("a");a.href=i,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(i)}_getFileExtension(){return{javascript:"js",js:"js",typescript:"ts",ts:"ts",html:"html",markup:"html",css:"css",json:"json",yaml:"yml",yml:"yml",php:"php",xml:"xml",xhtml:"xhtml",svg:"svg",http:"http",diff:"diff",csv:"csv",plaintext:"txt",text:"txt",txt:"txt"}[this.language]||"txt"}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),t=this.shadowRoot.querySelector(".share-button");this._showShareMenu?(e.style.display="block",t.classList.add("active"),setTimeout(()=>{document.addEventListener("click",this._handleOutsideClick)},0)):(e.style.display="none",t.classList.remove("active"),document.removeEventListener("click",this._handleOutsideClick))}_handleOutsideClick(e){let t=this.shadowRoot.querySelector(".share-menu");t&&!t.contains(e.target)&&this.toggleShareMenu()}async shareViaWebAPI(){if(!navigator.share)return;let e=this.getCode(),t=this.filename||this.label;try{await navigator.share({title:t,text:e}),this.toggleShareMenu()}catch(o){o.name!=="AbortError"&&console.error("Error sharing:",o)}}openInCodePen(){let e=this.getCode(),t=this.language,o={title:this.filename||this.label||"Code Block Demo",description:"Code shared from code-block component",editors:"111"};["html","markup","xhtml","xml","svg"].includes(t)?(o.html=e,o.editors="100"):t==="css"?(o.css=e,o.editors="010"):["javascript","js"].includes(t)?(o.js=e,o.editors="001"):(o.html=`<pre><code>${this.escapeHtml(e)}</code></pre>`,o.editors="100");let i=document.createElement("form");i.action="https://codepen.io/pen/define",i.method="POST",i.target="_blank";let a=document.createElement("input");a.type="hidden",a.name="data",a.value=JSON.stringify(o),i.appendChild(a),document.body.appendChild(i),i.submit(),document.body.removeChild(i),this.toggleShareMenu()}getStyles(){let e=this.theme==="dark";return`
      :host {
        /* Internal defaults \u2014 external --cb-* overrides always win */
        --_cb-bg: ${e?"var(--color-surface-raised, #0d1117)":"var(--color-surface-raised, #f6f8fa)"};
        --_cb-code-bg: ${e?"var(--color-surface, #0d1117)":"var(--color-surface, #fff)"};
        --_cb-header-bg: ${e?"var(--color-surface-raised, #161b22)":"var(--color-surface-raised, #e1e4e8)"};
        --_cb-text-color: ${e?"var(--color-text, #c9d1d9)":"var(--color-text, #24292e)"};
        --_cb-border-color: ${e?"var(--color-border, #30363d)":"var(--color-border, #e1e4e8)"};
        --_cb-comment: ${e?"var(--color-text-muted, #8b949e)":"var(--color-text-muted, #6a737d)"};
        --_cb-button-bg: ${e?"#21262d":"#fff"};
        --_cb-button-color: ${e?"var(--color-text, #c9d1d9)":"var(--color-text, #24292e)"};
        --_cb-scrollbar-track: ${e?"#161b22":"#f6f8fa"};
        --_cb-scrollbar-thumb: ${e?"#30363d":"#d1d5da"};

        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        background: var(--cb-bg, var(--_cb-bg));
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--cb-header-padding, 0.5rem 1rem);
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
        gap: 1rem;
      }

      .label-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        flex: 1;
      }

      .label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--cb-label-color, ${e?"#8b949e":"#586069"});
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .filename {
        font-size: 0.8rem;
        color: var(--cb-filename-color, ${e?"#c9d1d9":"#24292e"});
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
      }

      .copy-button {
        background: var(--cb-button-bg, var(--_cb-button-bg));
        border-width: var(--cb-button-border-width, 1px);
        border-style: var(--cb-button-border-style, solid);
        border-color: var(--cb-button-border, ${e?"#30363d":"#d1d5da"});
        border-radius: var(--cb-button-radius, 4px);
        padding: var(--cb-button-padding, 4px 12px);
        font-size: var(--cb-button-font-size, 0.75rem);
        font-weight: 500;
        color: var(--cb-button-color, var(--_cb-button-color));
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: var(--cb-ui-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        flex-shrink: 0;
      }

      .copy-button:hover {
        background: var(--cb-button-hover-bg, ${e?"#30363d":"#f3f4f6"});
        border-color: var(--cb-button-hover-border, ${e?"#8b949e":"#959da5"});
      }

      .copy-button:focus {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0366d6"});
        outline-offset: 2px;
      }

      .copy-button:active {
        transform: scale(0.98);
      }

      .copy-button.copied {
        background: var(--cb-success-color, #238636);
        color: white;
        border-color: var(--cb-success-color, #238636);
      }

      .copy-button.failed {
        background: var(--cb-error-color, #da3633);
        color: white;
        border-color: var(--cb-error-color, #da3633);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .action-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        transition: all 0.15s ease;
        border-radius: var(--cb-button-radius, 4px);
      }

      .action-button:hover {
        color: var(--cb-button-color, var(--_cb-button-color));
        background: var(--cb-action-button-hover-bg, ${e?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.05)"});
      }

      .action-button:active {
        transform: scale(0.95);
      }

      .action-button.active {
        color: var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        background: ${e?"rgba(56, 139, 253, 0.15)":"rgba(9, 105, 218, 0.1)"};
      }

      .action-button svg {
        width: 16px;
        height: 16px;
      }

      .share-container {
        position: relative;
        display: inline-block;
      }

      .share-menu {
        display: none;
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        border-radius: var(--cb-menu-radius, 8px);
        box-shadow: var(--cb-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));
        min-width: 160px;
        z-index: 1000;
        overflow: hidden;
      }

      .share-menu-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: none;
        border: none;
        color: var(--cb-text-color, var(--_cb-text-color));
        font-size: 0.8125rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
        font-family: var(--cb-ui-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
      }

      .share-menu-item:last-child {
        border-bottom: none;
      }

      .share-menu-item:hover {
        background: ${e?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)"};
      }

      .share-menu-item:active {
        background: ${e?"rgba(56, 139, 253, 0.15)":"rgba(9, 105, 218, 0.1)"};
      }

      .share-menu-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .code-container {
        display: flex;
        overflow-x: auto;
        background: var(--cb-code-bg, var(--_cb-code-bg));
      }

      .line-numbers {
        padding: var(--cb-code-padding, 1rem) 0;
        text-align: right;
        user-select: none;
        background: var(--cb-line-numbers-bg, ${e?"#161b22":"#f6f8fa"});
        border-right: 1px solid var(--cb-border-color, var(--_cb-border-color));
        color: var(--cb-line-numbers-color, ${e?"#484f58":"#959da5"});
        line-height: var(--cb-line-height, 1.6);
        flex-shrink: 0;
      }

      .line-numbers span {
        display: block;
        padding: 0 0.75rem;
        min-width: 2.5rem;
      }

      .line-numbers span.highlighted {
        background: var(--cb-highlight-gutter, ${e?"rgba(136, 192, 208, 0.15)":"rgba(255, 235, 59, 0.3)"});
        color: var(--cb-line-numbers-highlight-color, ${e?"#c9d1d9":"#24292e"});
      }

      pre {
        margin: 0;
        padding: 0;
        flex: 1;
        overflow-x: auto;
      }

      code {
        display: block;
        font-family: inherit;
        color: var(--cb-text-color, var(--_cb-text-color));
        background: transparent;
        padding: var(--cb-code-padding, 1rem);
      }

      .code-line {
        display: block;
        line-height: var(--cb-line-height, 1.6);
        padding: 0 0.5rem;
        margin: 0 -0.5rem;
        white-space: pre;
      }

      .code-line.highlighted {
        background: var(--cb-highlight-bg, ${e?"rgba(136, 192, 208, 0.15)":"rgba(255, 235, 59, 0.3)"});
        border-left: 3px solid var(--cb-highlight-border, ${e?"#58a6ff":"#f9a825"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      /* Focus mode - dims non-highlighted lines */
      :host([focus-mode]) .code-line:not(.highlighted) {
        opacity: var(--cb-focus-dim-opacity, 0.4);
        filter: blur(var(--cb-focus-blur, 0.5px));
        transition: opacity 0.2s ease, filter 0.2s ease;
      }

      :host([focus-mode]) .code-line.highlighted {
        opacity: 1;
        filter: none;
      }

      :host([focus-mode]) .line-numbers span:not(.highlighted) {
        opacity: var(--cb-focus-dim-opacity, 0.4);
      }

      /* highlight.js theme - GitHub style with CSS custom properties */
      .hljs-comment,
      .hljs-quote {
        color: var(--cb-comment, var(--_cb-comment));
        font-style: italic;
      }

      .hljs-keyword,
      .hljs-selector-tag,
      .hljs-addition {
        color: var(--cb-keyword, ${e?"#ff7b72":"#d73a49"});
      }

      .hljs-number,
      .hljs-literal,
      .hljs-doctag,
      .hljs-regexp {
        color: var(--cb-number, ${e?"#79c0ff":"#005cc5"});
      }

      .hljs-string,
      .hljs-meta .hljs-meta-string {
        color: var(--cb-string, ${e?"#a5d6ff":"#22863a"});
      }

      .hljs-title,
      .hljs-section,
      .hljs-name,
      .hljs-selector-id,
      .hljs-selector-class {
        color: var(--cb-function, ${e?"#d2a8ff":"#6f42c1"});
      }

      .hljs-attribute,
      .hljs-attr,
      .hljs-variable,
      .hljs-template-variable,
      .hljs-class .hljs-title,
      .hljs-type {
        color: var(--cb-attribute, ${e?"#79c0ff":"#005cc5"});
      }

      .hljs-symbol,
      .hljs-bullet,
      .hljs-subst,
      .hljs-meta,
      .hljs-meta .hljs-keyword,
      .hljs-selector-attr,
      .hljs-selector-pseudo,
      .hljs-link {
        color: var(--cb-meta, ${e?"#ffa657":"#e36209"});
      }

      .hljs-built_in,
      .hljs-deletion {
        color: var(--cb-builtin, ${e?"#ffa198":"#d73a49"});
      }

      .hljs-tag {
        color: var(--cb-tag, ${e?"#7ee787":"#22863a"});
      }

      .hljs-tag .hljs-name {
        color: var(--cb-tag, ${e?"#7ee787":"#22863a"});
      }

      .hljs-tag .hljs-attr {
        color: var(--cb-attribute, ${e?"#79c0ff":"#005cc5"});
      }

      .hljs-emphasis {
        font-style: italic;
      }

      .hljs-strong {
        font-weight: bold;
      }

      /* Diff support - added/removed lines */
      .code-line.diff-add {
        background: var(--cb-diff-add-bg, ${e?"rgba(46, 160, 67, 0.2)":"rgba(46, 160, 67, 0.15)"});
        border-left: 3px solid var(--cb-diff-add-border, ${e?"#3fb950":"#22863a"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      .code-line.diff-remove {
        background: var(--cb-diff-remove-bg, ${e?"rgba(248, 81, 73, 0.2)":"rgba(248, 81, 73, 0.15)"});
        border-left: 3px solid var(--cb-diff-remove-border, ${e?"#f85149":"#cb2431"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      .line-numbers span.diff-add {
        background: var(--cb-diff-add-gutter, ${e?"rgba(46, 160, 67, 0.15)":"rgba(46, 160, 67, 0.1)"});
        color: var(--cb-diff-add-color, ${e?"#3fb950":"#22863a"});
      }

      .line-numbers span.diff-remove {
        background: var(--cb-diff-remove-gutter, ${e?"rgba(248, 81, 73, 0.15)":"rgba(248, 81, 73, 0.1)"});
        color: var(--cb-diff-remove-color, ${e?"#f85149":"#cb2431"});
      }

      .hljs-addition {
        color: var(--cb-diff-add-text, ${e?"#3fb950":"#22863a"});
        background: transparent;
      }

      .hljs-deletion {
        color: var(--cb-diff-remove-text, ${e?"#f85149":"#cb2431"});
        background: transparent;
      }

      /* Collapsible code blocks */
      :host([collapsed]) .code-container {
        position: relative;
      }

      :host([collapsed]) .code-container::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: linear-gradient(transparent, var(--cb-code-bg, var(--_cb-code-bg)));
        pointer-events: none;
      }

      :host([collapsed]) pre {
        overflow: hidden;
      }

      :host([collapsed]) code {
        display: block;
        overflow: hidden;
      }

      .expand-button {
        display: none;
        width: 100%;
        padding: 0.5rem 1rem;
        background: var(--cb-expand-bg, ${e?"#161b22":"#f6f8fa"});
        border: none;
        border-top: 1px solid var(--cb-border-color, var(--_cb-border-color));
        color: var(--cb-expand-color, ${e?"#58a6ff":"#0366d6"});
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        font-family: var(--cb-ui-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        transition: background 0.2s;
      }

      .expand-button:hover {
        background: var(--cb-expand-hover-bg, ${e?"#21262d":"#e1e4e8"});
      }

      .expand-button:focus {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0366d6"});
        outline-offset: -2px;
      }

      :host([collapsed]) .expand-button,
      :host([data-expandable]) .expand-button {
        display: block;
      }

      /* Max height with scroll */
      :host([max-height]) .code-container {
        max-height: var(--cb-max-height);
        overflow-y: auto;
      }

      :host([max-height]) .code-container::-webkit-scrollbar {
        width: 8px;
      }

      :host([max-height]) .code-container::-webkit-scrollbar-track {
        background: var(--cb-scrollbar-track, var(--_cb-scrollbar-track));
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, var(--_cb-scrollbar-thumb));
        border-radius: var(--cb-button-radius, 4px);
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb:hover {
        background: var(--cb-scrollbar-thumb-hover, ${e?"#484f58":"#959da5"});
      }

      /* Word wrap option */
      :host([wrap]) code {
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: break-word;
      }

      :host([wrap]) .code-line {
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* No-copy: prevent text selection */
      :host([no-copy]) code {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      :host([no-copy]) .code-line {
        user-select: none;
        -webkit-user-select: none;
      }
    `}renderPlaceholder(){let e=(this._codeContent||this.textContent).trim().split(`
`),t=this.startLine,o=this._sliceLines(e),i=o.map(l=>this.escapeHtml(l)).map(l=>`<span class="code-line">${l||" "}</span>`).join(""),a=this.showLines?`<div class="line-numbers" aria-hidden="true">${o.map((l,d)=>`<span>${t+d}</span>`).join("")}</div>`:"",h=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`;this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${h}
        </div>
        <div class="header-actions">
          <button class="copy-button" aria-label="${this.copyText}">${this.copyText}</button>
        </div>
      </div>
      <div class="code-wrapper">
        <div class="code-container">
          ${a}
          <pre><code class="hljs">${i}</code></pre>
        </div>
      </div>
    `;let u=this.shadowRoot.querySelector(".copy-button");u&&u.addEventListener("click",()=>this.copyCode())}_hydrateInteractivity(){let e=this.shadowRoot.querySelector(".copy-button");e&&e.addEventListener("click",()=>this.copyCode());let t=this.shadowRoot.querySelector(".expand-button");t&&t.addEventListener("click",()=>this.toggleCollapsed());let o=this.shadowRoot.querySelector(".share-button");o&&o.addEventListener("click",h=>{h.stopPropagation(),this.toggleShareMenu()});let i=this.shadowRoot.querySelector(".share-codepen");i&&i.addEventListener("click",()=>this.openInCodePen());let a=this.shadowRoot.querySelector(".download-button");a&&a.addEventListener("click",()=>this.downloadCode())}render(){let e=(this._codeContent||this.textContent).trim(),t=e.split(`
`),o=this.highlightLines,i=this.language==="diff",a=this.startLine,h=this.endLine,u=h&&h>=a?Math.min(t.length,h-a+1):t.length,l;try{this.language&&this.language!=="plaintext"&&this.language!=="text"&&this.language!=="txt"?l=L.highlight(e,{language:this.language,ignoreIllegals:!0}).value:l=this.escapeHtml(e)}catch{l=this.escapeHtml(e)}let d=ro(l).slice(0,u),y=t.slice(0,u),x=d.map((te,H)=>{let O=a+H,V=o.has(O),Y=["code-line"];if(V&&Y.push("highlighted"),i){let C=y[H]||"";C.startsWith("+")&&!C.startsWith("+++")?Y.push("diff-add"):C.startsWith("-")&&!C.startsWith("---")&&Y.push("diff-remove")}return`<span class="${Y.join(" ")}">${te||" "}</span>`}).join(""),k=this.showLines?`<div class="line-numbers" aria-hidden="true">${d.map((te,H)=>{let O=a+H,V=o.has(O),Y=[];if(V&&Y.push("highlighted"),i){let C=y[H]||"";C.startsWith("+")&&!C.startsWith("+++")?Y.push("diff-add"):C.startsWith("-")&&!C.startsWith("---")&&Y.push("diff-remove")}return`<span class="${Y.join(" ")}">${O}</span>`}).join("")}</div>`:"",S=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`,N=this.hasAttribute("collapsed")||this.hasAttribute("max-lines"),$=d.length,q=this.maxLines,B=N&&$>q,j=this.collapsed,K=j?`calc(${q} * 1.6em + 2rem)`:"none",W=this.maxHeight?`--cb-max-height: ${this.maxHeight};`:"",I=j?`max-height: ${K};`:"";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${S}
        </div>
        <div class="header-actions">
          ${this.showShare?`
            <div class="share-container">
              <button class="action-button share-button" title="Share code">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 12V3M8 3L5 6M8 3l3 3"/>
                  <path d="M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9"/>
                </svg>
              </button>
              <div class="share-menu">
                ${typeof navigator<"u"&&navigator.share?`
                  <button class="share-menu-item share-native">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="4" r="2"/>
                      <circle cx="4" cy="8" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M6 9l4 2M6 7l4-2"/>
                    </svg>
                    Share...
                  </button>
                `:""}
                <button class="share-menu-item share-codepen">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L0 5v6l8 5 8-5V5L8 0zM7 10.5L2 7.5v-2l5 3v2zm1-3l-5-3L8 2l5 2.5-5 3zm1 3v-2l5-3v2l-5 3z"/>
                  </svg>
                  Open in CodePen
                </button>
              </div>
            </div>
          `:""}
          ${this.showDownload?`
            <button class="action-button download-button" title="Download code">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 1v10M8 11l-3-3M8 11l3-3"/>
                <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
              </svg>
            </button>
          `:""}
          ${this.noCopy?"":`<button class="copy-button"
                  aria-label="Copy code to clipboard"
                  title="Copy code">${this.escapeHtml(this.copyText)}</button>`}
        </div>
      </div>
      <div class="code-container" role="region" aria-labelledby="code-label" style="${W}${I}">
        ${k}
        <pre><code class="language-${this.language}" tabindex="0">${x}</code></pre>
      </div>
      ${B?`
        <button class="expand-button" aria-expanded="${!j}">
          ${j?`Show all ${$} lines`:"Show less"}
        </button>
      `:""}
    `,B?this.setAttribute("data-expandable",""):this.removeAttribute("data-expandable");let se=this.shadowRoot.querySelector(".copy-button");se&&se.addEventListener("click",()=>this.copyCode());let J=this.shadowRoot.querySelector(".expand-button");J&&J.addEventListener("click",()=>this.toggleCollapsed());let ee=this.shadowRoot.querySelector(".share-button");ee&&ee.addEventListener("click",te=>{te.stopPropagation(),this.toggleShareMenu()});let ne=this.shadowRoot.querySelector(".share-native");ne&&ne.addEventListener("click",()=>this.shareViaWebAPI());let ie=this.shadowRoot.querySelector(".share-codepen");ie&&ie.addEventListener("click",()=>this.openInCodePen());let ae=this.shadowRoot.querySelector(".download-button");ae&&ae.addEventListener("click",()=>this.downloadCode())}toggleCollapsed(){this.collapsed?this.removeAttribute("collapsed"):this.setAttribute("collapsed","")}escapeHtml(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}_sliceLines(e){let t=this.startLine,o=this.endLine,i=o&&o>=t?Math.min(e.length,o-t+1):e.length;return e.slice(0,i)}setCode(e){this._codeContent=e,this.render()}getCode(){let e=(this._codeContent||this.textContent).trim();return!this.hasAttribute("start-line")&&!this.hasAttribute("end-line")?e:this._sliceLines(e.split(`
`)).join(`
`)}static getSupportedLanguages(){return L.listLanguages()}};customElements.define("code-block",Qe);var Ye=class extends HTMLElement{constructor(){super(),this.shadowRoot||this.attachShadow({mode:"open"}),this._activeIndex=0,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this)}connectedCallback(){requestAnimationFrame(()=>{this.render(),this.setupEventListeners()}),Je(this)}disconnectedCallback(){jt(this),document.removeEventListener("click",this._handleOutsideClick)}static get observedAttributes(){return["theme","data-page-theme","show-share","show-download"]}attributeChangedCallback(e,t,o){this.shadowRoot&&t!==o&&(e==="theme"&&(this.hasAttribute("theme")?this.removeAttribute("data-page-theme"):this._onPageModeChange(Pe())),this.render())}_onPageModeChange(e){if(this.hasAttribute("theme")){this.removeAttribute("data-page-theme");return}e===!0?this.setAttribute("data-page-theme","dark"):e===!1?this.setAttribute("data-page-theme","light"):this.removeAttribute("data-page-theme")}get theme(){return this.getAttribute("theme")||this.getAttribute("data-page-theme")||"light"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get codeBlocks(){return Array.from(this.querySelectorAll("code-block"))}get activeIndex(){return this._activeIndex}set activeIndex(e){let t=this.codeBlocks;e>=0&&e<t.length&&(this._activeIndex=e,this.updateActiveTab())}getStyles(){let e=this.theme==="dark";return`
      :host {
        /* Internal defaults \u2014 external --cb-* overrides always win */
        --_cb-bg: ${e?"var(--color-surface-raised, #0d1117)":"var(--color-surface-raised, #f6f8fa)"};
        --_cb-code-bg: ${e?"var(--color-surface, #0d1117)":"var(--color-surface, #fff)"};
        --_cb-header-bg: ${e?"var(--color-surface-raised, #161b22)":"var(--color-surface-raised, #e1e4e8)"};
        --_cb-text-color: ${e?"var(--color-text, #c9d1d9)":"var(--color-text, #24292e)"};
        --_cb-border-color: ${e?"var(--color-border, #30363d)":"var(--color-border, #e1e4e8)"};
        --_cb-comment: ${e?"var(--color-text-muted, #8b949e)":"var(--color-text-muted, #6a737d)"};
        --_cb-button-bg: ${e?"#21262d":"#fff"};
        --_cb-button-color: ${e?"var(--color-text, #c9d1d9)":"var(--color-text, #24292e)"};
        --_cb-scrollbar-track: ${e?"#161b22":"#f6f8fa"};
        --_cb-scrollbar-thumb: ${e?"#30363d":"#d1d5da"};

        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        background: var(--cb-bg, var(--_cb-bg));
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .tabs {
        display: flex;
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
        overflow-x: auto;
        scrollbar-width: thin;
      }

      .tabs::-webkit-scrollbar {
        height: 4px;
      }

      .tabs::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, var(--_cb-scrollbar-thumb));
        border-radius: var(--cb-button-radius, 4px);
      }

      .tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: color 0.15s, border-color 0.15s, background 0.15s;
      }

      .tab:hover {
        color: var(--cb-text-color, var(--_cb-text-color));
        background: ${e?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)"};
      }

      .tab:focus-visible {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        outline-offset: -2px;
      }

      .tab[aria-selected="true"] {
        color: var(--cb-text-color, var(--_cb-text-color));
        border-bottom-color: var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        background: var(--cb-code-bg, var(--_cb-code-bg));
      }

      .language-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        background: ${e?"rgba(110, 118, 129, 0.4)":"rgba(175, 184, 193, 0.4)"};
        border-radius: var(--cb-button-radius, 4px);
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .content {
        position: relative;
      }

      ::slotted(code-block) {
        display: none !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
      }

      ::slotted(code-block.active) {
        display: block !important;
      }

      /* Header with tabs and actions */
      .header {
        display: flex;
        align-items: stretch;
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
      }

      .tabs {
        border-bottom: none;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-left: auto;
        padding: 0 0.5rem;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: var(--cb-button-radius, 4px);
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .action-button:hover {
        background: var(--cb-action-button-hover-bg, ${e?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"});
        color: var(--cb-text-color, var(--_cb-text-color));
      }

      .action-button:focus-visible {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        outline-offset: 1px;
      }

      .action-button svg {
        width: 16px;
        height: 16px;
      }

      .share-container {
        position: relative;
      }

      .share-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        min-width: 140px;
        padding: 0.25rem 0;
        background: var(--cb-bg, ${e?"#21262d":"#fff"});
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        border-radius: var(--cb-menu-radius, 6px);
        box-shadow: var(--cb-shadow, 0 8px 24px ${e?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.12)"});
        z-index: 100;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity 0.15s, visibility 0.15s, transform 0.15s;
      }

      .share-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .share-menu-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        color: var(--cb-text-color, var(--_cb-text-color));
        font-family: inherit;
        font-size: 0.8125rem;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s;
      }

      .share-menu-item:hover {
        background: ${e?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"};
      }

      .share-menu-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
    `}render(){let e=this.codeBlocks;if(e.length===0)return;e.forEach((i,a)=>{i.setAttribute("theme",this.theme),a===this._activeIndex?i.classList.add("active"):i.classList.remove("active")});let t=e.map((i,a)=>{let h=i.getAttribute("filename"),u=i.getAttribute("label"),l=i.getAttribute("language")||"plaintext",d=h||u||l.toUpperCase(),y=a===this._activeIndex;return`
        <button
          class="tab"
          role="tab"
          aria-selected="${y}"
          aria-controls="panel-${a}"
          tabindex="${y?"0":"-1"}"
          data-index="${a}"
        >
          <span class="tab-label">${this.escapeHtml(d)}</span>
          ${h?`<span class="language-badge">${l}</span>`:""}
        </button>
      `}).join(""),o=this.showShare||this.showDownload?`
      <div class="header-actions">
        ${this.showDownload?`
          <button class="action-button download-button" aria-label="Download code" title="Download">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
              <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
            </svg>
          </button>
        `:""}
        ${this.showShare?`
          <div class="share-container">
            <button class="action-button share-button" aria-label="Share code" title="Share" aria-haspopup="true" aria-expanded="${this._showShareMenu}">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15 3a3 3 0 0 1-5.175 2.066l-3.92 2.179a3.005 3.005 0 0 1 0 1.51l3.92 2.179a3 3 0 1 1-.73 1.31l-3.92-2.178a3 3 0 1 1 0-4.133l3.92-2.178A3 3 0 1 1 15 3Zm-1.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm-9-5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
              </svg>
            </button>
            <div class="share-menu ${this._showShareMenu?"open":""}" role="menu">
              ${typeof navigator<"u"&&navigator.share?`
                <button class="share-menu-item web-share-button" role="menuitem">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15 3a3 3 0 0 1-5.175 2.066l-3.92 2.179a3.005 3.005 0 0 1 0 1.51l3.92 2.179a3 3 0 1 1-.73 1.31l-3.92-2.178a3 3 0 1 1 0-4.133l3.92-2.178A3 3 0 1 1 15 3Zm-1.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm-9-5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
                  </svg>
                  Share...
                </button>
              `:""}
              <button class="share-menu-item codepen-button" role="menuitem">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L0 5.333v5.334L8 16l8-5.333V5.333L8 0zm5.714 9.703L8 13.297l-5.714-3.594V6.297L8 2.703l5.714 3.594v3.406z"/>
                  <path d="M8 4.703L4.286 7.5 8 10.297 11.714 7.5 8 4.703z"/>
                </svg>
                Open in CodePen
              </button>
            </div>
          </div>
        `:""}
      </div>
    `:"";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="tabs" role="tablist" aria-label="Code files">
          ${t}
        </div>
        ${o}
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `}setupEventListeners(){let e=this.shadowRoot.querySelector(".tabs");if(!e)return;e.addEventListener("click",h=>{let u=h.target.closest(".tab");if(u){let l=parseInt(u.dataset.index,10);this.activeIndex=l}}),e.addEventListener("keydown",h=>{let u=this.shadowRoot.querySelectorAll(".tab"),l=this._activeIndex,d=l;switch(h.key){case"ArrowLeft":d=l>0?l-1:u.length-1;break;case"ArrowRight":d=l<u.length-1?l+1:0;break;case"Home":d=0;break;case"End":d=u.length-1;break;default:return}h.preventDefault(),this.activeIndex=d,u[d].focus()});let t=this.shadowRoot.querySelector(".download-button");t&&t.addEventListener("click",()=>this.downloadCode());let o=this.shadowRoot.querySelector(".share-button");o&&o.addEventListener("click",h=>{h.stopPropagation(),this.toggleShareMenu()});let i=this.shadowRoot.querySelector(".web-share-button");i&&i.addEventListener("click",()=>{this.shareViaWebAPI(),this.toggleShareMenu()});let a=this.shadowRoot.querySelector(".codepen-button");a&&a.addEventListener("click",()=>{this.openInCodePen(),this.toggleShareMenu()})}updateActiveTab(){let e=this.shadowRoot.querySelectorAll(".tab"),t=this.codeBlocks;e.forEach((o,i)=>{let a=i===this._activeIndex;o.setAttribute("aria-selected",a),o.setAttribute("tabindex",a?"0":"-1")}),t.forEach((o,i)=>{i===this._activeIndex?o.classList.add("active"):o.classList.remove("active")}),this.dispatchEvent(new CustomEvent("tab-change",{detail:{index:this._activeIndex,block:t[this._activeIndex]},bubbles:!0}))}escapeHtml(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}selectTab(e){this.activeIndex=e}getActiveBlock(){return this.codeBlocks[this._activeIndex]}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),t=this.shadowRoot.querySelector(".share-button");e&&e.classList.toggle("open",this._showShareMenu),t&&t.setAttribute("aria-expanded",this._showShareMenu),this._showShareMenu?document.addEventListener("click",this._handleOutsideClick):document.removeEventListener("click",this._handleOutsideClick)}_handleOutsideClick(e){let t=this.shadowRoot.querySelector(".share-container");if(t&&!e.composedPath().includes(t)){this._showShareMenu=!1;let o=this.shadowRoot.querySelector(".share-menu"),i=this.shadowRoot.querySelector(".share-button");o&&o.classList.remove("open"),i&&i.setAttribute("aria-expanded","false"),document.removeEventListener("click",this._handleOutsideClick)}}downloadCode(){let e=this.getActiveBlock();e&&typeof e.downloadCode=="function"&&e.downloadCode()}openInCodePen(){let e=this.codeBlocks;if(e.length===0)return;let t="",o="",i="",a="Code Block Group";e.forEach(y=>{let x=y.language,k=y.getCode(),S=y.filename;["html","markup","xhtml","xml","svg"].includes(x)?(t&&(t+=`

`),S&&(t+=`<!-- ${S} -->
`),t+=k):x==="css"?(o&&(o+=`

`),S&&(o+=`/* ${S} */
`),o+=k):["javascript","js"].includes(x)&&(i&&(i+=`

`),S&&(i+=`// ${S}
`),i+=k),(!a||a==="Code Block Group")&&(a=S||y.label||"Code Block Group")});let h="";h+=t?"1":"0",h+=o?"1":"0",h+=i?"1":"0";let u={title:a,description:"Code shared from code-block-group component",html:t,css:o,js:i,editors:h},l=document.createElement("form");l.action="https://codepen.io/pen/define",l.method="POST",l.target="_blank";let d=document.createElement("input");d.type="hidden",d.name="data",d.value=JSON.stringify(u),l.appendChild(d),document.body.appendChild(l),l.submit(),document.body.removeChild(l)}async shareViaWebAPI(){if(!navigator.share)return;let e=this.codeBlocks;if(e.length===0)return;let t="";e.forEach(o=>{let i=o.filename||o.label||o.language,a=o.getCode();t&&(t+=`

`),t+=`// === ${i} ===
${a}`});try{await navigator.share({title:"Code from code-block-group",text:t})}catch(o){o.name!=="AbortError"&&console.error("Share failed:",o)}}};customElements.define("code-block-group",Ye);
//# sourceMappingURL=doc-extras.js.map
