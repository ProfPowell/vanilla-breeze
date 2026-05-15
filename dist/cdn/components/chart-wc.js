function E(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function bt(a){let t=E(String(a));return t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.+?)\*/g,"<em>$1</em>"),t=t.replace(/`(.+?)`/g,"<code>$1</code>"),t=t.replace(/\n/g,"<br>"),t}function j(a){if(!a||typeof a!="object"||Array.isArray(a))return!1;let t=Object.getPrototypeOf(a);return t===Object.prototype||t===null}function T(a){let t=a.toFixed(2);return parseFloat(t[t.length-1]==="0"?a.toFixed(1):t)}function xt(a){return t(a);function t(i){let o="";for(let s in i.options)if(Object.hasOwn(i.options,s)){let n=s,l=i.options[s];if(s==="class"){if(!Array.isArray(l))throw new Error("Wrong argument to class");l="",i.options[s].forEach(c=>{l+=(l===""?"":" ")+`svc-${c}`})}o+=(o===""?"":" ")+`${n}="${E(String(l))}"`}if(i.children.length>0){let s="";return i.children.forEach(function(n){s+=(o===""?"":" ")+t(n)}),`<${i.tagName}${e(o)}>${s}</${i.tagName}>`}else return typeof i.innerHTML<"u"?`<${i.tagName}${e(o)}>${i.innerHTML}</${i.tagName}>`:`<${i.tagName}${e(o)}></${i.tagName}>`}function e(i){return i===""?i:" "+i}}function tt(a,t){return i(a,t);function e(o){return j(o)}function i(o,...s){if(!s.length)return o;let n=s.shift();if(e(o)&&e(n))for(let l in n)e(n[l])?(o[l]||Object.assign(o,{[l]:{}}),i(o[l],n[l])):Object.assign(o,{[l]:n[l]});return i(o,...s)}}function vt(a,t){let e=a,i=t.split(".");for(let o=0;o<i.length;o++)if(e=e[i[o]],!e)return!1;return!0}var y=class{constructor(t="div",e={}){this.children=[],this.tagName=t,this.options={},Object.assign(this.options,e)}set textContent(t){this.innerHTML=E(t)}appendChild(t){this.children.push(t)}prependChild(t){this.children.unshift(t)}removeChild(t){let e=this.children.indexOf(t);e!==-1&&this.children.splice(e,1)}setAttrs(t){Object.assign(this.options,t)}setAttribute(t,e){this.options[t]=e}};var Xt=0,Z=class a{constructor(t,...e){this.config=e.reduce((i,o)=>tt(i,o),{}),this.palette=t||a.defaultPalette(),j(this.palette[0])||(this.palette=this.palette.map(i=>({primary:i,secondary:i}))),this.defs=this.createDefs(),tt(this.config.l,a.layoutProperties())}static layoutProperties(){return{wrap:{style:{background:"var(--color-surface, #fff)"}},top:{style:{"justify-content":"center","align-items":"center","padding-block":"0.5em 2em","padding-inline":"0.2em"}},ticks:{x:{style:{height:"10px"}},y:{style:{width:"1%"}}}}}static defaultPalette(){return[{primary:"var(--chart-series-1, #3b82f6)",secondary:"var(--chart-series-1, #3b82f6)"},{primary:"var(--chart-series-2, #ef4444)",secondary:"var(--chart-series-2, #ef4444)"},{primary:"var(--chart-series-3, #8b5cf6)",secondary:"var(--chart-series-3, #8b5cf6)"},{primary:"var(--chart-series-4, #f59e0b)",secondary:"var(--chart-series-4, #f59e0b)"},{primary:"var(--chart-series-5, #10b981)",secondary:"var(--chart-series-5, #10b981)"}]}createDefs(){let t=[];return j(this.palette[0])&&j(this.palette[0].primary)&&this.palette.forEach((e,i)=>{Object.keys(e).forEach(o=>{let{url:s,def:n}=this.generateGradient(e[o],i,o);e[o]=`url(#${s})`,t.push(n)})}),t}generateGradient(t,e,i){let o=t.orientation||"vertical",s="svc-grad-"+e+"-"+i+"-"+Xt++,n=new y("linearGradient",{id:s,x1:"0%",y1:"0%",x2:o==="vertical"?"0%":"100%",y2:o==="vertical"?"100%":"0%"});return Object.keys(t).forEach(l=>{isNaN(parseInt(l))||n.appendChild(new y("stop",{offset:l+"%","stop-color":t[l]}))}),{url:s,def:n}}applyPalette(t){for(let i in t)if(Object.hasOwn(t,i)){let o=e(i,this.config);if(!o)continue;let s=t[i];o.instances||(o.instances=[]),this.palette.forEach((n,l)=>{let c={};for(let r in s)if(Object.hasOwn(s,r)){let u=s[r];Object.prototype.hasOwnProperty.call(n,u)?c[r]=n[u]:c[r]=u}o.instances[l]?Object.keys(c).forEach(r=>{typeof o.instances[l][r]>"u"&&(o.instances[l][r]=c[r])}):o.instances.push(c)})}function e(i,o){let s=i.split("."),n=o,l=!1;return s.forEach(c=>{n[c]?n=n[c]:l=!0}),l?null:n}}};var et=class{constructor(t){this.config=t}static get defaults(){return{l:{top:{breakpoint:{width:200,height:150}}},title:{enabled:!0,text:"Title",style:{"text-align":"center",width:"100%","font-weight":400,"font-size":"var(--chart-title-size, 1.4rem)",color:"var(--chart-title-color, #444)","text-anchor":"middle","alignment-baseline":"middle"},subtitle:{style:{"font-size":"var(--chart-subtitle-size, 0.9rem)",color:"var(--chart-subtitle-color, var(--chart-label-color, #737373))","font-weight":300}}}}}render(){let t=this.config.title,e=new y("div",{class:["title"]}),i=t.markdown!==!1&&Kt(t.text),o=i?bt(t.text):E(t.text);return t.subtitle&&typeof t.subtitle=="string"?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${Pt(t.subtitle,i)}</div>`:t.subtitle&&t.subtitle.text?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${Pt(t.subtitle.text,i)}</div>`:e.innerHTML=o,e}};function Kt(a){return/\*\*.+?\*\*|\*.+?\*|`.+?`|\n/.test(String(a))}function Pt(a,t){return t?bt(a):E(a)}var Zt=0,it=class{constructor({config:t,data:e}){this.config=t,this.data=e}static get defaults(){return{l:{},legend:{breakpoint:{width:300,height:275},enabled:!0,style:{margin:0,padding:0,"flex-direction":"column","flex-wrap":"wrap","justify-content":"center","background-color":"var(--color-surface, rgba(255,255,255,0.8))","z-index":2},item:{style:{display:"flex","align-items":"center",padding:"0.5em",color:"var(--chart-label-color, #616161)","white-space":"nowrap"}}}}}render(t,e,i,o){return this.createLegend(i)}createLegend(t){let e=new y("ul",{class:["legend"]}),i=Zt++;return(t!=="pie"?this.data.map((s,n)=>({name:s.name||"Series "+n,index:n})):Object.keys(this.data).map((s,n)=>({name:s,index:n}))).forEach(({name:s,index:n})=>{let l=this._getSeriesColor(n),c=new y("li",{class:["legend-item"]}),r=`legend-item-${n}-${i}`,u=new y("input",{type:"checkbox",id:r,"data-series":n,checked:"",style:`--_series-color: ${l}`});c.appendChild(u);let p=new y("label",{id:`legend-item-text-${n}-${i}`,for:r});p.textContent=s,c.appendChild(p),e.appendChild(c)}),e}_getSeriesColor(t){let e;return this.config.plot.instances&&this.config.plot.instances.length>0?e=this.config.plot.instances[t%this.config.plot.instances.length]:this.config.plot.node?.instances&&this.config.plot.node.instances.length>0&&(e=this.config.plot.node.instances[t%this.config.plot.node.instances.length]),e&&e.stroke?e.stroke:e&&e.fill?e.fill:"#777"}};var P=class{constructor({stats:t,data:e,config:i,type:o}){this.data=e,this.config=i,this.type=o,o!=="pie"&&(this.min=t.y.min,this.max=t.y.max,this.stats=t)}static get defaults(){return{tooltip:{breakpoint:{width:275,height:275},enabled:!0,container:{style:{display:"flex"}},crosshair:{style:{"z-index":-1}},label:{style:{"background-color":"var(--chart-tooltip-bg, var(--color-surface, #fff))","box-shadow":"var(--chart-tooltip-shadow, 0 2px 4px rgba(0, 0, 0, 0.2))",color:"var(--chart-tooltip-color, var(--chart-label-color, #737373))",padding:"1em","z-index":2},title:{instances:[]}}}}}render(){return{tooltip:this.createDOM(),htmlTooltip:this._createHTMLTooltip()}}createDOM(){return this._createCartesianTooltip()}_createCartesianTooltip(){let t=new y("g",{id:"svc-tooltip-box",class:["tooltip","hide"]}),e=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"});return t.appendChild(e),t.appendChild(this._createTooltipForeignObject("svc-tooltip-label",["tooltip-label","hide"],{role:"tooltip","aria-live":"polite"})),t}_createRingTooltip(){let t=new y("g",{id:"svc-center-label-box",class:["tooltip","hide"]});return t.appendChild(this._createTooltipForeignObject("svc-center-label",["center-label"],{"aria-live":"polite"})),t}_createHTMLTooltip(){let t=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"}),e=new y("div",{id:"svc-tooltip-box",class:["tooltip","hide"],style:"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"}),i=new y("div",{class:["tooltip-container"],style:"position:absolute;pointer-events:auto;"}),o=new y("div",{id:"svc-tooltip-label",class:["tooltip-label","hide"],role:"tooltip","aria-live":"polite"});return i.appendChild(o),e.appendChild(i),{crosshair:t,tooltipBox:e}}_createTooltipForeignObject(t,e,i){let o=new y("foreignObject",{class:["tooltip-fo"],width:"100%",height:"100%"}),s=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});o.appendChild(s),s.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let n=new y("div",{class:["tooltip-container"]});s.appendChild(n);let l=new y("div",{id:t,class:e,...i});return n.appendChild(l),o}};var It=`
/* \u2500\u2500 Custom chart elements \u2500\u2500 */
chart-title,
chart-body,
chart-canvas,
chart-plot,
chart-legend,
chart-axis,
chart-label {
  display: block;
  box-sizing: border-box;
}

/* \u2500\u2500 Figure (top-level grid: title + body) \u2500\u2500 */
figure[data-chart-id] {
  display: grid;
  grid-template-rows: auto 1fr;
  block-size: 100%;
  padding: 1%;
  margin: 0;
  box-sizing: border-box;
  font-family: var(--chart-font-family, inherit);
  font-weight: 300;
  color: var(--chart-label-color, #737373);
  background: var(--color-surface, #fff);
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: rgba(0,0,0,0);
}

/* \u2500\u2500 Chart title \u2500\u2500 */
chart-title {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-block: 0.5em;
  padding-inline: 0.2em;
}

.svc-subtitle {
  font-size: var(--chart-subtitle-size, 0.9rem);
  color: var(--chart-subtitle-color, var(--chart-label-color, #737373));
  font-weight: 300;
  margin-block-start: 0.2em;
}

/* \u2500\u2500 Chart body (grid: canvas + legend) \u2500\u2500 */
chart-body {
  display: grid;
  grid-template-columns: 1fr auto;
  min-block-size: 0;
  overflow: visible;
  container-type: inline-size;
  container-name: chart-body;
}

/* \u2500\u2500 Chart canvas (grid: y-label | y-axis | y-ticks | plot) \u2500\u2500 */
chart-canvas {
  display: grid;
  grid-template-columns: auto auto 4px 1fr;
  grid-template-rows: 1fr auto auto auto;
  padding: 1%;
  min-block-size: 0;
  min-inline-size: 0;
  container-type: inline-size;
  container-name: chart-canvas;
}

/* \u2500\u2500 Y-axis elements (row 1) \u2500\u2500 */
chart-label[position="y"] {
  grid-row: 1;
  grid-column: 1;
  position: relative;
  display: flex;
  align-items: center;
}

chart-label[position="y"] > div {
  position: absolute;
  top: 50%;
}

chart-label[position="y"] > div span {
  display: block;
  transform: translate(-50%, -50%) rotate(-90deg);
  white-space: nowrap;
}

chart-axis[position="y"] {
  grid-row: 1;
  grid-column: 2;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.svc-ticks-y {
  grid-row: 1;
  grid-column: 3;
}

/* \u2500\u2500 Plot area (row 1, col 4) \u2500\u2500 */
chart-plot {
  grid-row: 1;
  grid-column: 4;
  position: relative;
  overflow: hidden;
  min-block-size: 0;
  min-inline-size: 0;
}

/* \u2500\u2500 X-axis elements (rows 2-4, col 4) \u2500\u2500 */
.svc-ticks-x {
  grid-row: 2;
  grid-column: 4;
  height: 10px;
}

chart-axis[position="x"] {
  grid-row: 3;
  grid-column: 4;
  position: relative;
  inline-size: 100%;
  min-block-size: 1.8em;
}

chart-label[position="x"] {
  grid-row: 4;
  grid-column: 4;
  display: flex;
  justify-content: center;
  padding-block: 0.5rem;
}

/* \u2500\u2500 Scale labels \u2500\u2500 */
.svc-scale-label-y,
.svc-scale-label-x {
  overflow: visible;
  position: absolute;
}

.svc-scale-label-x {
  transform: translate(-50%, 0%);
}

.svc-scale-label-y {
  inset-inline-end: 0;
  transform: translate(0%, -50%);
}

/* \u2500\u2500 Chart legend \u2500\u2500 */
chart-legend {
  display: block;
  padding-block: 0.5rem;
  padding-inline: 0.5rem 1rem;
  overflow: auto;
  max-inline-size: 160px;
  align-self: start;
}

.svc-legend {
  list-style-type: none;
  overflow: scroll;
  margin: 0;
  padding: 0;
  color: var(--chart-label-color, #737373);
}

.svc-legend-item {
  margin-block-start: 10px;
}

/* \u2500\u2500 Legend checkbox (modern appearance: none) \u2500\u2500 */
.svc-legend-item label {
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
  user-select: none;
}

.svc-legend-item input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  inline-size: 1.1em;
  block-size: 1.1em;
  border: 2px solid var(--chart-grid-color, #ddd);
  border-radius: 3px;
  background: var(--chart-grid-color, #ddd);
  cursor: pointer;
  flex-shrink: 0;
  position: relative;
}

.svc-legend-item input[type="checkbox"]:checked {
  background: var(--_series-color, var(--chart-series-1, #3b82f6));
  border-color: var(--_series-color, var(--chart-series-1, #3b82f6));
}

.svc-legend-item input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  inset-inline-start: 3px;
  inset-block-start: 0px;
  inline-size: 5px;
  block-size: 9px;
  border: solid var(--color-surface, white);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.svc-legend-item input[type="checkbox"]:disabled {
  opacity: 0.4;
  cursor: default;
}

/* \u2500\u2500 Tooltip \u2500\u2500 */
.svc-tooltip-fo,
.svc-tooltip-crosshair {
  transition: all 0.25s;
}

@media (prefers-reduced-motion: reduce) {
  .svc-tooltip-fo,
  .svc-tooltip-crosshair {
    transition: none;
  }
}

.svc-tooltip-label {
  display: flex;
  flex-direction: column;
}

.svc-tooltip-label div {
  padding-block: 0.2rem;
}

.svc-tooltip-label-title {
  font-weight: 600;
}

/* \u2500\u2500 Utilities \u2500\u2500 */
.svc-hide {
  opacity: 0;
  visibility: hidden;
}

.svc-focus {
  outline: 2px solid var(--chart-focus-color, #005fcc);
  outline-offset: 2px;
}

path.svc-focus {
  outline: none;
  stroke: var(--chart-focus-color, #005fcc);
  stroke-width: 2;
  stroke-opacity: 1;
  filter: brightness(1.15);
}

/* \u2500\u2500 Dummies (invisible sizing helpers) \u2500\u2500 */
.svc-origin-label {
  opacity: 0;
  padding: 0.3rem 1rem 0 0;
}

.svc-axis-y-label-dummy {
  opacity: 0;
}

/* \u2500\u2500 Responsive (container queries for layout, media for height) \u2500\u2500 */
@container chart-body (max-width: 400px) {
  chart-body { grid-template-columns: 1fr; }
  chart-legend { max-inline-size: none; display: block; }
  .svc-legend { flex-direction: row; }
}

@media (max-width: 600px) {
  .svc-title, .svc-text-label * { font-size: 0.9rem; }
  .svc-tooltip-fo { font-size: 0.9rem; }
}

@media (max-height: 300px) {
  .svc-title, .svc-text-label * { font-size: 0.9rem; }
  .svc-tooltip-fo { font-size: 0.9rem; }
}
`;var ct=class{constructor(){this.sheet=It,this.rules=[]}addRule(t,e){let i="";Object.keys(e).forEach(o=>{i+=`${o}: ${e[o]};`}),this.sheet+=`.svc-${t}{${i}}`}addRaw(t){this.sheet+=t}convertconfig(t,e,i){let o={width:{},height:{}},s=c(t),n=l(o);return s+n;function l(r){let u="";return Object.keys(r).forEach(p=>{Object.keys(r[p]).forEach(d=>{let h=r[p][d],g=`@media(max-${p}: ${d}px){`,m=h.map(f=>`.svc-${f}.svc-${f}`);g+=m.join(","),g+="{ display: none; }",g+="}",u+=g})}),u}function c(r,u="",p="",d=[]){for(let h in r)if(h==="style"){let g="";for(let m in r[h])Object.hasOwn(r[h],m)&&(g+=`${m}:${r[h][m]};`);if(d.length===0)p+=`figure[data-chart-id] {${g}}`;else{let m=d.reduce((f,b)=>f+=(f===""?"":"-")+b,"");p+=`.svc-${m}{${g}}`}}else if(h==="instances"){let g=r[h];for(let m=0;m<e;m++){let f=g[m];if(!f)continue;let b="";for(let x in f)Object.hasOwn(f,x)&&(b+=`${x}:${f[x]};`);if(b!==""){let x=d.reduce((w,C)=>w+=(w===""?"":"-")+C,""),v=i?`[data-chart-id="${i}"] `:"";p+=`${v}.svc-${x}-${m} {${b}}`}}}else if(h==="breakpoint"){let g=d.reduce((m,f)=>m+=(m===""?"":"-")+f,"");o.width[r.breakpoint.width]?o.width[r.breakpoint.width].push(g):o.width[r.breakpoint.width]=[g],o.height[r.breakpoint.height]?o.height[r.breakpoint.height].push(g):o.height[r.breakpoint.height]=[g]}else typeof r[h]=="object"&&(d.push(h),p=c(r[h],h,p,d),d.pop());return p}}};function zt({interactive:a=!1}={}){let t=new y("svg");t.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",role:a?"graphics-document":"img","aria-roledescription":"chart"});let e=new y("foreignObject",{width:"100%",height:"100%"});t.appendChild(e);let i=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});e.appendChild(i),i.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let o=new y("figure");i.appendChild(o);let s=new y("chart-title");o.appendChild(s);let n=new y("chart-body");o.appendChild(n);let l=new y("chart-canvas");n.appendChild(l);let c=new y("chart-label",{position:"y"});l.appendChild(c);let r=new y("chart-axis",{position:"y"});l.appendChild(r);let u=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-y"]});l.appendChild(u);let p=new y("chart-plot");l.appendChild(p);let d=new y("svg");d.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plotarea"]}),p.appendChild(d);let h=new y("div"),g=new y("div"),m=new y("div"),f=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-x"]});l.appendChild(f);let b=new y("chart-axis",{position:"x"});l.appendChild(b);let x=new y("chart-label",{position:"x"});l.appendChild(x),d.appendChild(new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]}));let v=new y("text",{x:"50%",y:"50%",class:["loading"]});return v.innerHTML="Loading Chart...",d.appendChild(v),{root:t,wrap:o,top:s,body:n,plotarea:p,layoutChart:d,layoutXAxis:b,layoutYTicks:u,layoutXTicks:f,layoutYAxis:r,layoutOriginRight:m,layoutOriginCenter:g,layoutXAxisLabel:x,layoutYAxisLabel:c,layoutOriginLeft:h}}var Wt=new Set(["onInteraction","onResize","onClick"]),dt=class{#t=new Map;register(t,e){this.#t.has(t)||this.#t.set(t,new Set),this.#t.get(t).add(e)}unregister(t,e){let i=this.#t.get(t);i&&i.delete(e)}run(t,e){if(Wt.has(t)&&typeof document>"u")return;let i=this.#t.get(t);if(i)for(let o of i)o(e)}registerPlugin(t){if(!(!t||!t.hooks))for(let[e,i]of Object.entries(t.hooks))this.register(e,i)}destroy(){this.#t.clear()}};function wt(a){return JSON.stringify(a).replace(/<\//g,"<\\/").replace(/]]>/g,"]]\\>").replace(/<!--/g,"<\\!--").replace(/<\?/g,"<\\?")}var pt=class{hooks=new dt;toFile(t={}){let e=c(t),i=`<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`,o=this.structure,{body:s}=o,n;e.includeScripts&&(n=this._createScripts(this.structure),s.appendChild(n));let l=this.compile(o.root);return e.includeScripts&&n&&s.removeChild(n),e.prerendered&&(l=l.slice(0,l.indexOf("svg")+3)+' data-prerendered=""'+l.slice(l.indexOf("svg")+3)),i+l;function c(r){if(typeof r=="object"&&r!==null){let u=!!r.prerendered,p=!u;return{prerendered:u,includeScripts:r.includeScripts??p}}return{prerendered:!!r,includeScripts:!0}}}toString(){return this.compile(this.structure.root)}toHTML({prerendered:t}={}){return this.compileHTML(this.structure,{prerendered:t})}async toBlob(t="image/svg+xml",{width:e=800,height:i=600}={}){if(typeof Blob>"u")throw new Error("SVC: toBlob() requires a browser environment.");let o=this.toString();if(t==="image/svg+xml")return new Blob([o],{type:"image/svg+xml"});if(t==="image/png"){if(typeof document>"u")throw new Error("SVC: PNG export requires a browser environment with Canvas.");return this._svgToPngBlob(o,e,i)}throw new Error(`SVC: Unsupported export type "${t}".`)}async toDataURL(t="image/svg+xml",e){if(typeof FileReader>"u")throw new Error("SVC: toDataURL() requires a browser environment with FileReader.");let i=await this.toBlob(t,e);return new Promise((o,s)=>{let n=new FileReader;n.onload=()=>o(n.result),n.onerror=s,n.readAsDataURL(i)})}async download(t="chart.svg",e){if(typeof document>"u")throw new Error("SVC: download() requires a browser environment.");let o=t.split(".").pop().toLowerCase()==="png"?"image/png":"image/svg+xml",s=await this.toBlob(o,e),n=URL.createObjectURL(s),l=document.createElement("a");l.href=n,l.download=t,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(n)}_svgToPngBlob(t,e,i){return new Promise((o,s)=>{let n=document.createElement("canvas");n.width=e,n.height=i;let l=n.getContext("2d"),c=new Image,r=new Blob([t],{type:"image/svg+xml"}),u=URL.createObjectURL(r);c.onload=()=>{l.drawImage(c,0,0,e,i),URL.revokeObjectURL(u),n.toBlob(p=>{p?o(p):s(new Error("SVC: PNG export failed."))},"image/png")},c.onerror=()=>{URL.revokeObjectURL(u),s(new Error("SVC: Failed to load SVG for PNG export."))},c.src=u})}mount(t){if(!t||typeof document>"u")return null;t.innerHTML=this.toHTML(),this._state=this.hydrate(t),this._container=t;let e=t.host||t;return this._observeResize(e),this._state}createElement(){if(typeof document>"u")return null;let t=document.createElement("div");return this.mount(t),t}hydrate(t){if(!t)return null;let e={functions:[]};return this.interactions.forEach(i=>{e.functions[i.name]=i(e,t,this)}),this._state=e,this._container=t,e}update({data:t,config:e}={}){if(!this._container)return null;let i=this._container;return this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._state=null,t!=null&&(this.data=t),e!=null&&(tt(this.config,e),this.config=this.applyConfigToDefaults(this.config).config),this.interactions=[],this.render(),i.innerHTML=this.toString(),this._state=this.hydrate(i),this._container=i,this._state}destroy(){this.hooks.run("beforeDestroy",{container:this._container,state:this._state}),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._container&&(this._container.innerHTML=""),this._state=null,this._container=null,this.hooks.destroy()}_observeResize(t){typeof ResizeObserver>"u"||(this._resizeObserver=new ResizeObserver(e=>{let i=e[0];i&&this.hooks.run("onResize",{width:i.contentRect.width,height:i.contentRect.height,container:t})}),this._resizeObserver.observe(t))}_createScripts(t){let e=new y("script",{class:["chart-script"]}),i="",o=[];return this.interactions.forEach(s=>{i+=s.toString()+`
`,o.push(s.name)}),i+=`
    var chart = {
      stats: ${wt(this.stats||{})},
      data: ${wt(this.data)},
      config: ${wt(this.config)}
    };
    var svgRoot = document.currentScript.closest('svg');
    var state = { functions: []};`,o.forEach(s=>{i+=`state.functions['${s}'] = ${s}(state, svgRoot, chart);`}),e.innerHTML=`//<![CDATA[
`+i+`
//]]>`,e}};function Ct(a,t,e){let i=e.config&&e.config.tooltip&&e.config.tooltip.hideDelay||2e3,o=t.querySelector("chart-plot"),s=t.querySelector("#svc-tooltip-box"),n=t.querySelector("#svc-tooltip-label"),l=t.querySelector(".svc-tooltip-crosshair"),c=[],r=null,u=null;function p(){u=null}typeof window<"u"&&(window.addEventListener("scroll",p,{passive:!0}),window.addEventListener("resize",p,{passive:!0}));let d=null;typeof ResizeObserver<"u"&&(d=new ResizeObserver(p),d.observe(o));function h(){n.setAttribute("class","svc-tooltip-label svc-hide"),s.setAttribute("class","svc-tooltip svc-hide"),l.setAttribute("x1","-10%"),l.setAttribute("x2","-10%"),l.setAttribute("y1","-10%"),l.setAttribute("y2","-10%");for(let f=0;f<c.length;f++)c[f].classList.remove("svc-plot-node-active-"+f);c=[]}function g(){r&&clearTimeout(r),r=setTimeout(h,i)}o.addEventListener("mousedown",m),o.addEventListener("mousemove",m),a._tooltipCleanup=function(){r&&clearTimeout(r),o.removeEventListener("mousedown",m),o.removeEventListener("mousemove",m),typeof window<"u"&&(window.removeEventListener("scroll",p),window.removeEventListener("resize",p)),d&&(d.disconnect(),d=null)};function m(f){g();let b=a.functions.tooltipLocation(f,a,t,e);if(!b)return;let x=t.querySelectorAll('.svc-plot-node[node="'+b.index+'"]');for(let M=0;M<c.length;M++)c[M].classList.remove("svc-plot-node-active-"+M);c=[];for(let M=0;M<x.length;M++)x[M].classList.add("svc-plot-node-active-"+M),c.push(x[M]);l.setAttribute("x1",b.crosshair.x1+"%"),l.setAttribute("x2",b.crosshair.x2+"%"),l.setAttribute("y1",b.crosshair.y1+"%"),l.setAttribute("y2",b.crosshair.y2+"%"),n.innerHTML=b.tooltip.text,n.setAttribute("class","svc-tooltip-label"),s.setAttribute("class","svc-tooltip"),u||(u=o.getBoundingClientRect());let v=u,w=n.getBoundingClientRect(),C=w.width/v.width*100,S=w.height/v.height*100,k=b.tooltip.x,$=b.tooltip.y;k+C>98&&(k=k-C-1),k<0&&(k=0),$+S>98&&($=98-S),$<0&&($=0);let A=s.querySelector("foreignObject");if(A)A.setAttribute("x",k+"%"),A.setAttribute("y",$+"%");else{let M=n.parentElement;M&&(M.style.left=k+"%",M.style.top=$+"%")}e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"tooltip",event:f,data:{index:b.index,tooltip:b.tooltip},element:s})}}function kt(a,t,e){a.toggles=Array.from(t.querySelectorAll("chart-legend input")),a.toggles.forEach(function(i){i.removeAttribute("onclick"),i.addEventListener("click",function(o){let s=o.target.getAttribute("data-series");a.toggles[s]=o.target.checked;let n=a.toggles[s]!==!1,l=n?1:0,c=t.getElementsByClassName("svc-plot-"+s)[0];c&&(c.style.opacity=l);let r=t.getElementsByClassName("svc-plot-node-"+s);for(let u=0;u<r.length;u++)r[u].style.opacity=l;e&&e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"legend-toggle",event:o,data:{series:s,visible:n},element:i})})})}function St(a,t,e){let i=t.querySelectorAll('[role="graphics-symbol"]');if(i.length===0)return;let o=-1,s=t.querySelector("chart-plot");if(!s)return;s.setAttribute("tabindex","0"),s.addEventListener("keydown",function(c){if(c.key==="ArrowRight"||c.key==="ArrowDown")c.preventDefault(),o=Math.min(o+1,i.length-1),n(o);else if(c.key==="ArrowLeft"||c.key==="ArrowUp")c.preventDefault(),o=Math.max(o-1,0),n(o);else if(c.key==="Escape"){l();let r=t.querySelector("#svc-tooltip-label");r&&r.classList.add("svc-hide"),o=-1}});function n(c){l();let r=i[c];if(!r)return;r.classList.add("svc-focus");let u=r.getAttribute("aria-label"),p=t.querySelector("#svc-tooltip-label");p&&u&&(p.textContent=u,p.classList.remove("svc-hide"))}function l(){for(let c=0;c<i.length;c++)i[c].classList.remove("svc-focus")}}function $t(a,t,e){let i=t.querySelector("chart-plot");if(!i)return;function o(n){let l=n.target.closest('[role="graphics-symbol"]');if(!l)return;let c={type:"click",event:n,element:l,seriesIndex:parseInt(l.getAttribute("plot")||l.getAttribute("data-series")||"0",10),dataIndex:parseInt(l.getAttribute("node")||l.getAttribute("data-index")||l.getAttribute("index")||"0",10),key:l.getAttribute("data-key")||null,value:l.getAttribute("data-value")||null,label:l.getAttribute("aria-label")||""};e.hooks&&e.hooks.run&&e.hooks.run("onClick",c)}i.addEventListener("click",o);let s=a._dataClickCleanup;a._dataClickCleanup=function(){s&&s(),i.removeEventListener("click",o)}}var Qt=0,W=class a extends pt{#t;#e;constructor({config:t={},data:e}){if(super({config:t,data:e}),e==null)throw new Error('SVC: "data" is required. Pass an array of series objects or a plain object for pie charts.');this.data=e,this.palette=t.palette=t.palette||Z.defaultPalette();let i=this.applyConfigToDefaults(t);this.#e=i.defs,this.config=i.config,Array.isArray(this.config.plugins)&&this.config.plugins.forEach(o=>this.hooks.registerPlugin(o)),this.hooks.run("configResolved",{config:this.config,data:this.data,chartType:this.constructor.type}),this.#t=new ct,this._scopeId="c"+Qt++,this.interactions=[],this.structure=null,this.render()}get stylesheet(){return this.#t}get defs(){return this.#e}applyConfigToDefaults(t){let e=[],i=Object.getPrototypeOf(this);for(;i.constructor.name!=="Object";)i.constructor.defaults&&e.push(i.constructor.defaults),i=Object.getPrototypeOf(i);e=e.reverse();let o={legend:it,tooltip:P};Object.keys(o).forEach(n=>{(!t[n]||t[n].enabled)&&e.push(o[n].defaults)}),t.title&&t.title.text&&e.push(et.defaults);let s=new Z(this.palette,...e,t);return s.applyPalette(a.specs()),s.applyPalette(this.constructor.specs(s.config)),s}static get defaults(){return{palette:Z.defaultPalette(),style:{"font-family":"var(--chart-font-family, inherit)","font-weight":300,color:"var(--chart-label-color, #737373)"},legend:{enabled:!0},tooltip:{enabled:!0},plot:{node:{enabled:!0,instances:[],active:{instances:[]},label:{enabled:!1,instances:[]}},instances:[],style:{overflow:"visible"}},"plot-top":{style:{overflow:"visible"}},plotarea:{style:{fill:"var(--color-surface, #fff)",overflow:"visible"}},loading:{enabled:!0,style:{"font-size":"1.5em",fill:"var(--chart-label-color, #616161)","text-anchor":"middle"}}}}static specs(){return{"plot.node.label":{fill:"primary"},"tooltip.label.title":{color:"primary"}}}render(){this.config.title&&(this.title=new et(this.config)),this.config.legend&&(this.legend=new it({config:this.config,data:this.data,chart:this.chart}));let t=!!(this.config.tooltip?.enabled||this.config.legend?.enabled),e=zt({interactive:t});e.wrap.setAttribute("data-chart-id",this._scopeId);let i=this.constructor.type||"chart";if(this.config.title&&this.config.title.text){let o=E(this.config.title.text);e.root.setAttribute("aria-label",o);let s=new y("desc");s.innerHTML=`${i} chart: ${o}`,e.root.prependChild(s)}else{let o=Array.isArray(this.data)?this.data.length:Object.keys(this.data).length;e.root.setAttribute("aria-label",`${i} chart with ${o} data series`)}e=this.parse(e),this.structure=this.parseComponents(e),this.hooks.run("afterRender",{config:this.config,data:this.data,stats:this.stats,structure:this.structure})}parse(t){let{layoutChart:e}=t,i=new y("defs");return this.defs.forEach(o=>{i.appendChild(o)}),e.appendChild(i),t}parseComponents(t){let{body:e,top:i,layoutChart:o}=t;if(this.config.title&&this.config.title.enabled&&i.appendChild(this.title.render()),this.config.legend&&this.config.legend.enabled){let s=new y("chart-legend");s.appendChild(this.legend.render(null,null,this.constructor.type)),e.appendChild(s),this.interactions.push(kt)}return this.config.tooltip&&this.config.tooltip.enabled&&(this.tooltip=new P({stats:this.stats,data:this.data,config:this.config,type:this.constructor.type}).render(),o.appendChild(this.tooltip.tooltip),typeof this.tooltipLocation=="function"&&(this.interactions.push(Ct),this.interactions.push(this.tooltipLocation)),this.interactions.push(St)),this.interactions.push($t),t}compile(t,e){return this._styleElement&&t.removeChild(this._styleElement),this._styleElement=this.compileStyles(),t.prependChild(this._styleElement),xt(t)}compileHTML(t,{prerendered:e}={}){let i=t.wrap,o=t.root,s={...i.options};o.options["aria-label"]&&i.setAttribute("aria-label",o.options["aria-label"]),o.options["aria-describedby"]&&i.setAttribute("aria-describedby",o.options["aria-describedby"]),i.setAttribute("role",o.options.role||"figure"),e&&i.setAttribute("data-prerendered",""),this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),this._htmlStyleElement=this.compileStyles(),i.prependChild(this._htmlStyleElement);let n=t.layoutChart,l=t.plotarea,c=this.tooltip?.tooltip,r=this.tooltip?.htmlTooltip;c&&r&&l&&(n.removeChild(c),n.appendChild(r.crosshair),l.appendChild(r.tooltipBox));let u=xt(i);return i.options=s,this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),c&&r&&l&&(n.removeChild(r.crosshair),l.removeChild(r.tooltipBox),n.appendChild(c)),u}compileStyles(){let t=new y("style"),e=this.constructor.type!=="pie"?this.data.length:Object.keys(this.data).length,i=this.stylesheet.convertconfig(this.config,e,this._scopeId)+this.stylesheet.sheet;return t.innerHTML=`@layer charts { ${i} }`,t}createGraph({stretch:t}){return t?new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",viewBox:"0, 0, 100, 100",preserveAspectRatio:"none",xmlns:"http://www.w3.org/2000/svg",class:["plot"]}):new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plot-top"]})}createBackground(){return new y("rect",{width:"100%",height:"100%",x:"0%",y:"0%",class:["container"]})}createPlotArea({config:t}){return new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]})}};var ot=class{constructor(t){Object.assign(this,t)}render(){let{type:t,stats:e,stroke:i,width:o}=this,{min:s,max:n}=e[t],l=Math.abs(n-s),r=Math.abs(s)/l*100;return t==="x"?new y("line",{class:["baseline","baseline-x"],x1:r.toFixed(3)+"%",y1:"0%",x2:r.toFixed(3)+"%",y2:"100%",stroke:i,"stroke-width":o}):new y("line",{class:["baseline","baseline-y"],x1:"0%",y1:(100-r).toFixed(3)+"%",x2:"100%",y2:(100-r).toFixed(3)+"%",stroke:i,"stroke-width":o})}};function Nt({config:a}){let t=a.scale.minFontSize,e=a.scale.maxItems,i="";i+=`
    .svc-scale-label-x,
    .svc-scale-label-y,
    .svc-guides-x,
    .svc-guides-y,
    .svc-ticks-x,
    .svc-ticks-y {
      opacity: 0;
    }
    .svc-scale-label-x, .svc-scale-label-y, chart-label {
      font-size: calc(${t}px + 1vmin);
      padding: calc(4px + 0.1vmin);
      box-sizing: border-box;
    }
    chart-label[position="y"] {
      padding: calc(5px + 0.1vmin);
      padding-right: 10px;
    }
  `;let o=parseFloat((100/e-1).toFixed(2));i+=`
    .svc-scale-label-x {
      width: calc(${o}% - 5px);
      max-width: calc(${o}%);
    }`;let s={0:2,250:4,600:6,800:10,1e3:e},n=Object.keys(s);n.forEach((c,r)=>{let u,p=Math.floor(e/s[c]),d=parseInt(c),h=parseInt(n[r+1])-1;if(r===0)u=`
        @container chart-canvas (max-width: ${h}px) {
          .svc-scale-label-x:first-child,
          .svc-scale-label-x:nth-last-child(2),
          .svc-guides-x:first-child,
          .svc-guides-x:nth-last-child(2),
          .svc-ticks-x:first-child,
          .svc-ticks-x:nth-last-child(2) {
            opacity: 1;
          }
          .svc-scale-label-x {
            width: calc(50% - 5px);
            max-width: 50%;
          }
        }
      `;else if(r===n.length-1)u=`
        @container chart-canvas (min-width: ${c}px) {
          .svc-scale-label-x,
          .svc-guides-x,
          .svc-ticks-x {
            opacity: 1;
          }
        }
      `;else{let g=parseFloat((100/(p+1)).toFixed(2));u=`
        @container chart-canvas (min-width: ${d}px) and (max-width: ${h}px) {
          .svc-scale-label-x:nth-child(${p}n + 1),
          .svc-guides-x:nth-child(${p}n),
          .svc-ticks-x:nth-child(${p}n + 1) {
            opacity: 1;
          }
          .svc-scale-label-x {
            width: calc(${g}% - 5px);
            max-width: calc(${g}%);
          }
        }
      `}i+=u});let l=Object.keys(s);return l.forEach((c,r)=>{let u,p=Math.floor(e/s[c]),d=parseInt(c),h=parseInt(l[r+1])-1;r===0?u=`
        @media(max-height: ${h}px) {
          .svc-scale-label-y:first-child,
          .svc-scale-label-y:nth-last-child(2),
          .svc-guides-y:first-child,
          .svc-guides-y:nth-last-child(2),
          .svc-ticks-y:first-child,
          .svc-ticks-y:nth-last-child(2) {
            opacity: 1;
          }
        }
      `:r===l.length-1?u=`
        @media(min-height: ${c}px) {
          .svc-scale-label-y,
          .svc-guides-y,
          .svc-ticks-y {
            opacity: 1;
          }
        }
      `:u=`
        @media(min-height: ${d}px) and (max-height: ${h}px) {
          .svc-scale-label-y:nth-child(${p}n + 1),
          .svc-guides-y:nth-child(${p}n + 1),
          .svc-ticks-y:nth-child(${p}n + 1) {
            opacity: 1;
          }
        }
      `,i+=u}),i}function Lt(a,t,e){if(!Array.isArray(a)||a.length===0)throw new Error('SVC: "data" must be a non-empty array of series objects.');for(let u=0;u<a.length;u++)if(!a[u]||a[u].values==null)throw new Error(`SVC: data[${u}] must have a "values" property.`);if(e!=="scatter"&&e!=="bubble")for(let u=0;u<a.length;u++){let p=a[u].values,d=Array.isArray(p)?p:Object.values(p);for(let h=0;h<d.length;h++)if(d[h]!=null&&typeof d[h]!="number")throw new Error(`SVC: data[${u}].values contains non-numeric value "${d[h]}" at position ${h}.`)}let i={min:1/0,max:-1/0,ticks:4,scale:0},o={min:1/0,max:-1/0,ticks:6,scale:0},s={min:1/0,max:-1/0},n=!1,l=-1/0;if(e==="scatter"||e==="bubble")Object.assign(i,ht(a,"x")),Object.assign(o,ht(a,"y")),e==="bubble"&&Object.assign(s,ht(a,"size"));else if(Array.isArray(a[0].values)){let u=a.reduce((d,h)=>d.concat(h.values),[]).sort((d,h)=>d-h);if(t.plot&&t.plot.stacked){let d=Math.max(...a.map(m=>m.values.length)),h=0,g=0;for(let m=0;m<d;m++){let f=0,b=0;a.forEach(x=>{let v=x.values[m]||0;v>=0?f+=v:b+=v}),h=Math.max(h,f),g=Math.min(g,b)}o.min=g,o.max=h}else o.min=u[0],o.max=u[u.length-1];let p=a[0].values.length;a.forEach((d,h)=>{d.values.length!==p&&console.warn(`SVC: Series ${h} has ${d.values.length} values, but series 0 has ${p}. Mismatched lengths may cause unexpected results.`),l=d.values.length>l?d.values.length:l}),i.min=0,i.max=l}else{n=!0;let u=a.reduce((d,h)=>d.concat(Object.keys(h.values).map(g=>h.values[g])),[]).sort((d,h)=>d-h),p={};if(a.forEach(d=>{Object.assign(p,d.values)}),p=Object.keys(p),t.scale.sorted&&p.sort(),t.plot&&t.plot.stacked){let d=0,h=0;p.forEach(g=>{let m=0,f=0;a.forEach(b=>{let x=b.values[g]||0;x>=0?m+=x:f+=x}),d=Math.max(d,m),h=Math.min(h,f)}),o.min=h,o.max=d}else o.min=u[0],o.max=u[u.length-1];i.keys=p,i.min=0,i.max=l=p.length}let c=e==="scatter"||e==="bubble";Object.assign(o,Et(o,{forceZeroMin:!c})),c?Object.assign(i,Et(i,{forceZeroMin:!1})):e==="bar"||e==="column"?(l>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.floor(l/(i.ticks-1))):(i.ticks=l,i.step=1),i.scaleLength=l,i.scaleFactor=T(100/l)):(l>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.ceil(l/(i.ticks-1))):(i.ticks=l,i.step=1),i.scaleLength=l,i.scaleFactor=T(100/Math.max(l-1,1)));let r=t.plot.vertical;return{associative:n,x:r?i:o,y:r?o:i,alt:s}}function Et({max:a,min:t,ticks:e},{forceZeroMin:i=!0}={}){let o=a-t||1;t=Math.floor(t-Math.abs(o*.1)),a=Math.ceil(a+Math.abs(o*.1)),i&&(t=t>0?0:t);let s=a-t;if(s<=0)return{min:t,max:t+1,step:1,scaleLength:1,scaleFactor:100,ticks:2};let n=Rt(s,e);t=Math.floor(t/n)*n,a=Math.ceil(a/n)*n;let l=a-t;e=Math.round(l/n)+1;let c=100/l;return{min:t,max:a,step:n,scaleLength:l,scaleFactor:c,ticks:e}}function Rt(a,t){let e=a/t,i=Math.pow(10,Math.floor(Math.log10(e))),o=e/i,s;return o<=1.5?s=1:o<=3.5?s=2.5:o<=7.5?s=5:s=10,s*i}function ht(a,t){let e;switch(t){case"x":e=0;break;case"y":e=1;break;case"size":e=2;break}let i=a.map(o=>o.values.map(s=>s[e])).reduce((o,s)=>o.concat(s)).sort((o,s)=>o-s);return{min:i[0],max:i[i.length-1]}}var Mt=new Map;function st(a,t){Mt.set(a,t)}function At(a,t){let e=Mt.get(a);if(!e)throw new Error(`SVC: Unknown scale type "${a}". Registered types: ${[...Mt.keys()].join(", ")}`);return new e(t)}var ut=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:l,step:c}=i[t];for(let r=0;r<l;r++){let u=T(r*c*i[t].scaleFactor);if(u>100)continue;o.ticks.push(R(t,u));let p=B(t,r,l,u,e);p&&o.guides.push(p);let d;t==="x"?d=`${s+r*c}`:d=`${n-r*c}`,d=V(d,t,e),o.labels.push(U(t,u,d))}return o}};function R(a,t){return a==="x"?new y("line",{x1:t+"%",y1:"0%",x2:t+"%",y2:"100%",class:["ticks","ticks-x"]}):new y("line",{x1:"0%",y1:t+"%",x2:"100%",y2:t+"%",class:["ticks","ticks-y"]})}function B(a,t,e,i,o){if(a==="x"){if(t!==0&&o.guides.x.enabled)return new y("line",{x1:i+"%",y1:"100%",x2:i+"%",y2:"0%",class:["guides","guides-x"]})}else if(t!==e-1&&o.guides.y.enabled)return new y("line",{x1:"0%",y1:i+"%",x2:"100%",y2:i+"%",class:["guides","guides-y"]});return null}function U(a,t,e){let i=a==="x"?"left":"top",o=new y("div",{style:`${i}: ${t}%`,class:["scale-label",`scale-label-${a}`]});return o.textContent=e,o}function V(a,t,e){if(t==="x"&&vt(e,"scale.label.x.format"))try{return e.scale.label.x.format(a)}catch(i){console.warn("SVC: scale.label.x.format threw an error:",i)}else if(t==="y"&&vt(e,"scale.label.y.format"))try{return e.scale.label.y.format(a)}catch(i){console.warn("SVC: scale.label.y.format threw an error:",i)}return a}var ft=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{ticks:s,step:n,max:l}=i[t],c=this.chartType,r=c==="bar"||c==="column",u=t==="x"&&e.plot.vertical||t==="y"&&!e.plot.vertical;for(let p=0;p<s;p++){let d,h;if(r&&u){let f=i[t].scaleFactor/2,b=s<=1?0:p/(s-1);h=Math.floor((i[t].scaleLength-1)*b),h===i[t].scaleLength&&h--,d=T(h*i[t].scaleFactor+f)}else d=T(p*n*i[t].scaleFactor);if(d>100)continue;o.ticks.push(R(t,d));let g=B(t,p,s,d,e);g&&o.guides.push(g);let m;if(t==="x"&&e.plot.vertical){let f=h??Math.round(p*(i.x.keys.length-1)/Math.max(s-1,1));m=`${i.x.keys[f]}`}else if(t==="y"&&!e.plot.vertical){let f=h??Math.round(p*(i.y.keys.length-1)/Math.max(s-1,1));m=`${i.y.keys[f]}`}else m=t==="x"?`${p*n}`:`${l-p*n}`;m=V(m,t,e),o.labels.push(U(t,d,m))}return o}};var mt=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n}=i[t],l=Math.max(s,1),c=Math.floor(Math.log10(l)),u=Math.ceil(Math.log10(Math.max(n,1)))-c;if(u<=0)return o;let p=u+1;for(let d=0;d<p;d++){let h=c+d,g=Math.pow(10,h),m=T(d/u*100);if(m>100)continue;let f=t==="y"?T(100-m):m;o.ticks.push(R(t,f));let b=B(t,d,p,f,e);b&&o.guides.push(b);let x=ee(g);x=V(x,t,e),o.labels.push(U(t,f,x))}return o}};function ee(a){return a>=1e6?a/1e6+"M":a>=1e3?a/1e3+"K":String(a)}var gt=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:l}=i[t],c=Bt(s),u=Bt(n)-c;if(u<=0||!Number.isFinite(u))return o;let p=ie(u),d=Math.min(l,12);for(let h=0;h<d;h++){let g=h/Math.max(d-1,1),m=T(g*100),f=c+u*g;if(m>100)continue;o.ticks.push(R(t,m));let b=B(t,h,d,m,e);b&&o.guides.push(b);let x=p(new Date(f));x=V(x,t,e),o.labels.push(U(t,m,x))}return o}};function Bt(a){return typeof a=="number"?a:new Date(a).getTime()}function ie(a){return a<864e5?o=>o.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"}):a<2592e6?o=>o.toLocaleDateString(void 0,{month:"short",day:"numeric"}):a<31536e6*2?o=>o.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):o=>o.toLocaleDateString(void 0,{year:"numeric"})}st("linear",ut);st("category",ft);st("log",mt);st("time",gt);var N=class extends W{static get defaults(){let t={width:120,height:120};return{l:{},plot:{vertical:!0},axis:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},label:{x:{enabled:!0,text:"Scale-X"},y:{enabled:!0,text:"Scale-Y"}},style:{stroke:"var(--chart-axis-color, #444)","stroke-width":.3,"vector-effect":"non-scaling-stroke"}},baseline:{x:{},y:{},style:{stroke:"var(--chart-baseline-color, #888)","stroke-width":1}},ticks:{x:{enabled:!0},y:{enabled:!0},style:{"stroke-width":"1",stroke:"var(--chart-tick-color, #DDD)"}},guides:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},style:{stroke:"var(--chart-grid-color, #e4e4e4)","stroke-dasharray":"0, 0","stroke-width":1,"stroke-linecap":"round"}},scale:{sorted:!1,minFontSize:5,maxItems:15,label:{style:{"text-align":"center"}}}}}getName(){return super.getName()}parse(t){t=super.parse(t);let e=this.data,i=this.stylesheet,o=this.config,{layoutChart:s,layoutXAxis:n,layoutYAxis:l,layoutOriginLeft:c,layoutOriginCenter:r,layoutOriginRight:u,layoutYTicks:p,layoutXTicks:d,layoutXAxisLabel:h,layoutYAxisLabel:g}=t,m=this.stats=Lt(e,this.config,this.constructor.type);this.data=e,this.hooks.run("beforeRender",{config:o,data:e,stats:m,structure:t}),["x","y"].forEach(k=>{let $=oe(k,m,o),L=At($,{type:k,config:o,stats:m,data:e,chartType:this.constructor.type}).render();Object.keys(L).forEach(A=>{if(A==="labels")L[A].forEach(M=>{k==="x"?n.appendChild(M):l.appendChild(M)});else if(A==="ticks")k==="x"&&o.ticks.x.enabled?L[A].forEach(M=>{d.appendChild(M)}):k==="y"&&o.ticks.y.enabled&&L[A].forEach(M=>{p.appendChild(M)});else{let M=new y("g",{class:[k+"-"+A]});L[A].forEach(F=>{M.appendChild(F)}),s.appendChild(M)}})});let f=[];if(o.axis.x.enabled&&s.appendChild(this.createAxis({type:"x"})),o.axis.label.x.enabled){let k=`svc-axis-x-label-${this._scopeId}`,$=new y("div",{class:["l-axis-label-text-x"],id:k,role:"note"});$.innerHTML=`<span class="svc-axis-label-x">${E(o.axis.label.x.text)}</span>`,h.appendChild($),f.push(k)}if(o.axis.y.enabled&&s.appendChild(this.createAxis({type:"y"})),o.axis.label.y.enabled){let k=`svc-axis-y-label-${this._scopeId}`,$=new y("div",{class:["l-axis-y-label-text"],id:k,role:"note"});$.innerHTML=`<span class="svc-axis-label-y">${E(o.axis.label.y.text)}</span>`,g.appendChild($),f.push(k)}f.length>0&&t.root.setAttribute("aria-describedby",f.join(" "));let b=new y("div",{class:["axis-y-label-dummy"]});b.innerHTML="0",c.appendChild(b),g.appendChild(b);let x=new y("div",{style:"height: 1%; min-height:10px;"});r.appendChild(x);let v=new y("div",{class:["origin-label","scale-label"]});if(m.associative&&!o.plot.vertical){let k=m.y.keys,$=0;k.forEach(L=>{$=L.length>$?L.length:$}),v.innerHTML=new Array($+1).join("0")}else v.innerHTML=m.y.max;r.appendChild(v),l.appendChild(v),u.setAttrs({style:"width: 1%;"}),m.y.min<0&&s.appendChild(new ot({type:"y",stats:m,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render()),m.x.min<0&&s.appendChild(new ot({type:"x",stats:m,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render());let w=this.createGraph({stretch:!0});s.appendChild(w);let C=this.createGraph({stretch:!1});s.appendChild(C),this.createPlot({data:e,stats:m,subchartStretch:w,subchartNoStretch:C});let S=new y("style");return S.innerHTML=".plot {opacity: 1;} .svc-loading {opacity:0;}",s.appendChild(S),i.addRaw(Nt({stats:m,config:o})),t}createScript(){return new P({stats:this.stats,data:this.data,config:this.config}).render()}createAxis({type:t}){return t==="x"?new y("line",{x1:"0%",x2:"100%",y1:"100%",y2:"100%",class:["axis","axis-x"]}):new y("line",{x1:"0%",x2:"0%",y1:"0%",y2:"100%",class:["axis","axis-y"]})}};function oe(a,t,e){return e.scale?.[a]?.type?e.scale[a].type:t.associative?"category":"linear"}var D=class extends N{static get type(){return"line"}static get defaults(){return{plot:{style:{fill:"none","vector-effect":"non-scaling-stroke"},node:{type:"open",size:4,style:{"stroke-width":"0.2%","stroke-linecap":"round"},active:{style:{"stroke-width":"0.5%","stroke-linecap":"round"}}}}}}static specs(t){let e={plot:{stroke:"primary"},"plot.node.active":{fill:"secondary",stroke:"secondary"}};return t.plot.node.enabled&&(e["plot.node"]={stroke:"primary"},t.plot.node.type=="closed"?e["plot.node"].fill="primary":e["plot.node"].fill="#FFF"),e}getPlotClass(t){return["plot",`plot-${t}`]}createPlotLine(t){let e=this.stats,i=[],o=.2,s=1,n=0,l=0,c=0,r,u,p=null;for(let d=0;d<t.length;d++){if(t[d]==null){p=null,l=0,c=0;continue}let h={x:T((d-e.x.min)*e.x.scaleFactor),y:T((e.y.max-t[d])*e.y.scaleFactor)};if(!p){i.push(`M ${h.x} ${h.y}`),p=h;continue}let g=null;for(let v=d+1;v<t.length;v++)if(t[v]!=null){g={x:T((v-e.x.min)*e.x.scaleFactor),y:T((e.y.max-t[v])*e.y.scaleFactor)};break}g?(n=(g.y-p.y)/(g.x-p.x),r=(g.x-h.x)*-o,u=r*n*s):r=u=0;let m=T(p.x-l),f=T(p.y-c),b=T(h.x+r),x=T(h.y+u);i.push(`C ${m} ${f}, ${b} ${x}, ${h.x} ${h.y}`),l=r,c=u,p=h}return i}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){this.stats=e,t.forEach((s,n)=>{let l=Array.isArray(s.values)?s.values:e.x.keys.map(p=>s.values[p]??null),c={class:this.getPlotClass(n),plot:n};this.constructor.type==="line"&&(c.fill="none");let r=new y("path",c);i.appendChild(r);let u=this.createPlotLine(l);r.setAttribute("d",u.join(" ")),l.forEach((p,d)=>{if(p!=null){if(this.config.plot.node.enabled){let h=T((d-e.x.min)*e.x.scaleFactor)+"%",g=T((e.y.max-p)*e.y.scaleFactor)+"%",m=s.name||`Series ${n+1}`,f=e.associative&&e.x.keys&&e.x.keys[d]||d,b=new y("circle",{cx:h,cy:g,r:this.config.plot.node.size,class:["plot-node",`plot-node-${n}`],node:d,plot:n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${m}, ${f}: ${p}`});o.appendChild(b)}if(this.config.plot.node.label.enabled){let h=new y("text",{x:T((d-e.x.min)*e.x.scaleFactor)+"%",y:T((e.y.max-p)*e.y.scaleFactor)+"%",fill:"black",class:["plot-node-label",`plot-node-label-${n}`]});h.innerHTML=p,o.appendChild(h)}}})})}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},l=1,c="",r=i.stats,p=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-p.left)/p.width,h=Math.floor(d*r.x.scaleLength),g=0,m=0,f=i.data,b=r.associative?r.x.keys[h]:h;f.forEach(function(C){let S=r.associative?C.values[b]:C.values[h];S!=null&&(g+=S,m++)});let x=(r.y.max-g/m)*r.y.scaleFactor;isNaN(x)&&(x=r.y.max*r.y.scaleFactor);let v=r.x.scaleFactor*h,w=x.toFixed(2);return isNaN(v)||isNaN(w)||h<0||h>=r.x.scaleLength?null:(n.crosshair.x1=v,n.crosshair.x2=v,n.crosshair.y1=0,n.crosshair.y2=100,n.tooltip.x=v+l,n.tooltip.y=w,f.forEach(function(C,S){let k=E(C.name?C.name:"Series "+S),$=r.associative?i.data[S].values[b]:i.data[S].values[h],L=r.associative?b:h,A;if(i.config.tooltip.format)try{A=E(String(i.config.tooltip.format(L,$)))}catch(M){console.warn("SVC: tooltip.format threw an error:",M),A=`(${E(String(L))} : ${E(String($))})`}else A=`(${E(String(L))} : ${E(String($))})`;t.toggles[S]!==!1&&(c+=`<div class="svc-tooltip-content">
            <span class="svc-tooltip-label-title svc-tooltip-label-title-${S}">${k}</span> :
            ${A}
          </div>`)}),n.tooltip.text=c,n.index=h,n)}}};var nt=class extends D{static get type(){return"area"}static get defaults(){return{plot:{area:{style:{"fill-opacity":"var(--area-fill-opacity, 0.5)","stroke-width":"2%","stroke-linecap":"round"}},node:{enabled:!1,size:4,active:{style:{"stroke-width":"0.5%"}}}}}}static specs(){return{plot:{stroke:"primary"},"plot.area":{fill:"primary",stroke:"secondary"}}}getPlotClass(t){return["plot",`plot-${t}`,"plot-area",`plot-area-${t}`]}createPlotLine(t){let e=super.createPlotLine(t),i=this.stats,o=t.find(c=>c!=null);if(o==null)return e;let s=T((t.length-1-i.x.min)*i.x.scaleFactor),n=T(i.y.max*i.y.scaleFactor),l=T((i.y.max-o)*i.y.scaleFactor);return e.push(`L ${s} ${n} L 0 ${n} L 0 ${l}`),e}};var H=class extends N{static get type(){return"column"}static get defaults(){return{plot:{vertical:!0,stacked:!1,spacing:10,label:{enabled:!1,format:null}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s,n,l=this.config.plot.spacing/100,c=e.y.scaleFactor,r=e.x.scaleFactor;e.plot={},this.config.plot.vertical?(s=e.y.min,n=e.y.max,e.plot.vertical=!0):(s=e.x.min,n=e.x.max,e.plot.vertical=!1),e.plot.barSpacing=this.config.plot.spacing/100;let u=Math.abs(n-s),d=Math.abs(s)/u*100;if(this.config.plot.stacked){this._createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:r,scaleY:c,barSpacing:l,originPoint:d});return}if(Array.isArray(t[0].values))if(this.config.plot.vertical){let h=r/t.length,g=h*(1-l*2);t.forEach((m,f)=>{m.type!=="line"&&m.values.forEach((b,x)=>{let v;b>0?v=(e.y.max-b)*c+"%":v=(100-d).toFixed(3)+"%";let w=r*x;w+=h*f,w+=h*l,i.appendChild(new y("rect",{class:["plot",`plot-${f}`,`plot-node-${f}`],index:x,plot:f,"data-series":f,"data-index":x,"data-value":b,height:Math.abs(b)*c,x:w+"%",width:g+"%",y:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${m.name||"Series "+(f+1)}, ${x}: ${b}`}))})})}else{let h=c/t.length,g=h*(1-l*2);t.forEach((m,f)=>{m.type!=="line"&&m.values.forEach((b,x)=>{let v,w=Math.abs(b)*r;b>0?v=d.toFixed(3)+"%":v=d.toFixed(3)-w+"%";let C=100-c*(x+1);C+=h*f,C+=h*l,i.appendChild(new y("rect",{class:["plot",`plot-${f}`,`plot-node-${f}`],index:x,plot:f,"data-series":f,"data-index":x,"data-value":b,y:C+"%",width:w+"%",height:g+"%",x:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${m.name||"Series "+(f+1)}, ${x}: ${b}`}))})})}else if(this.config.plot.vertical){let h=r/t.length,g=h*(1-l*2);e.x.keys.forEach((m,f)=>{t.forEach((b,x)=>{if(b.type!=="line"&&b.values[m]!=null){let v,w=b.values[m];w>0?v=(e.y.max-w)*c+"%":v=(100-d).toFixed(3)+"%";let C=r*f;C+=h*x,C+=h*l,i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:f,plot:x,"data-series":x,"data-key":m,"data-value":w,height:Math.abs(w)*c,x:C+"%",width:g+"%",y:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${b.name||"Series "+(x+1)}, ${m}: ${w}`}))}})})}else{let h=c/t.length,g=h*(1-l*2);e.y.keys.slice().reverse().forEach((f,b)=>{t.forEach((x,v)=>{if(x.type!=="line"&&x.values[f]!=null){let w=x.values[f],C,S=Math.abs(w)*r;w>0?C=d.toFixed(3)+"%":C=d.toFixed(3)-S+"%";let k=100-c*(b+1);k+=h*v,k+=h*l,i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:b,plot:v,"data-series":v,"data-key":f,"data-value":w,y:k+"%",width:S+"%",height:g+"%",x:C,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${x.name||"Series "+(v+1)}, ${f}: ${w}`}))}})})}this._renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}),this.config.plot.label.enabled&&this._renderDataLabels({data:t,stats:e,subchartNoStretch:o,scaleX:r,scaleY:c,barSpacing:l})}_renderDataLabels({data:t,stats:e,subchartNoStretch:i,scaleX:o,scaleY:s,barSpacing:n}){if(!i)return;let l=!Array.isArray(t[0].values),c=this.config.plot.vertical,r=this.config.plot.label.format,u=t.filter(p=>p.type!=="line").length;t.forEach((p,d)=>{if(p.type==="line")return;let h=l?(c?e.x.keys:e.y.keys).map(g=>({key:g,value:p.values[g]})):p.values.map((g,m)=>({key:m,value:g}));h.forEach(({key:g,value:m},f)=>{if(m==null)return;let b=r?r(m,g):String(m);if(c){let x=o,v=x/u,w=x*f+v*d+v/2+v*n,C=(e.y.max-m)*s,S=new y("text",{x:w+"%",y:C-1+"%","text-anchor":"middle",class:["plot-node-label",`plot-node-label-${d}`]});S.textContent=b,i.appendChild(S)}else{let x=s,v=x/u,w=h.length-1-f,C=100-x*(w+1)+v*d+v/2,S=Math.abs(m)*o,k=new y("text",{x:S+1+"%",y:C+"%","alignment-baseline":"middle",class:["plot-node-label",`plot-node-label-${d}`]});k.textContent=b,i.appendChild(k)}})})}_renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s=!Array.isArray(t[0].values),n=this.config.plot.vertical,l=e.x.scaleFactor,c=e.y.scaleFactor;t.forEach((r,u)=>{if(r.type!=="line")return;let p=n?e.x.keys:e.y.keys,d=s?p.map(f=>r.values[f]??null):r.values,h=[],g=!1;for(let f=0;f<d.length;f++){if(d[f]==null){g=!1;continue}let b=n?f*l+l/2:(e.y.max-d[f])*c,x=n?(e.y.max-d[f])*c:100-(f*c+c/2);g?h.push(`L ${b.toFixed(2)} ${x.toFixed(2)}`):h.push(`M ${b.toFixed(2)} ${x.toFixed(2)}`),g=!0}if(h.length===0)return;let m=new y("path",{d:h.join(" "),fill:"none",class:["plot",`plot-${u}`],style:"vector-effect: non-scaling-stroke"});if(i.appendChild(m),o)for(let f=0;f<d.length;f++){if(d[f]==null)continue;let b=n?f*l+l/2+"%":(e.y.max-d[f])*c+"%",x=n?(e.y.max-d[f])*c+"%":100-(f*c+c/2)+"%",v=s&&p?p[f]:f,w=r.name||"Series "+(u+1);o.appendChild(new y("circle",{cx:b,cy:x,r:4,class:["plot-node",`plot-node-${u}`],node:f,plot:u,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${w}, ${v}: ${d[f]}`}))}})}_createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:o,scaleY:s,barSpacing:n,originPoint:l}){let c=!Array.isArray(t[0].values),r=this.config.plot.vertical,u=r?o:s,p=u,d=p*(1-n*2),h=c?r?e.x.keys:e.y.keys:Array.from({length:Math.max(...t.map(g=>g.values.length))},(g,m)=>m);h.forEach((g,m)=>{let f=0,b=0;t.forEach((x,v)=>{if(x.type==="line")return;let w=x.values[g];if(w==null)return;let C=Math.abs(w)*(r?s:o),S=x.name||"Series "+(v+1);if(r){let k;w>=0?(f+=w,k=(e.y.max-f)*s):(k=(e.y.max-b)*s,b+=w);let $=u*m+p*n;i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:m,plot:v,"data-series":v,"data-key":c?g:void 0,"data-index":c?void 0:m,"data-value":w,x:$+"%",y:k+"%",width:d+"%",height:C+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${S}, ${g}: ${w}`}))}else{let k;w>=0?(k=l+f*o,f+=w):(b+=w,k=l+b*o);let $=h.length-1-m,L=100-u*($+1)+p*n;i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:m,plot:v,"data-series":v,"data-key":c?g:void 0,"data-index":c?void 0:m,"data-value":w,x:k+"%",y:L+"%",width:C+"%",height:d+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${S}, ${g}: ${w}`}))}})})}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},l=1,c="",r=i.stats,p=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-p.left)/p.width,h=Math.floor(d*r.x.scaleLength),g=0,m=0,f=i.data,b;r.associative&&(b=r.x.keys[h]),f.forEach(function(C){r.associative&&C.values[b]!=null?(g+=C.values[b],m++):!r.associative&&C.values[h]!=null&&(g+=C.values[h],m++)});let x=(r.y.max-g/m)*r.y.scaleFactor;isNaN(x)&&(x=r.y.max*r.y.scaleFactor);let v=r.x.scaleFactor*h+r.x.scaleFactor/2,w=x.toFixed(2);return isNaN(v)||isNaN(w)||h<0||h>=r.x.scaleLength?null:(r.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=v+l,n.tooltip.y=w,f.forEach(function(C,S){let k=E(C.name?C.name:"Series "+S);if(t.toggles[S]!==!1){let $=r.associative?i.data[S].values[b]:i.data[S].values[h],L=r.associative?b:h,A;if(i.config.tooltip.format)try{A=E(String(i.config.tooltip.format(L,$)))}catch(M){console.warn("SVC: tooltip.format threw an error:",M),A=`(${E(String(L))} : ${E(String($))})`}else A=`(${E(String(L))} : ${E(String($))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${S}">${k}</span> : ${A}
          </div>`}}),n.tooltip.text=c,n.index=h,n)}}};var Q=class extends H{static get type(){return"bar"}static get defaults(){return{plot:{vertical:!1}}}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},l=1,c="",r=i.stats,p=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientY-p.top)/p.height;r.associative&&(d=1-d);let h=r.y.scaleLength-1-Math.floor(d*r.y.scaleLength),g=0,m=0,f=i.data,b;r.associative&&(i.config.plot.vertical?b=r.x.keys[h]:b=r.y.keys[h]),f.forEach(function(C){r.associative&&C.values[b]!=null?(g+=C.values[b],m++):!r.associative&&C.values[h]!=null&&(g+=C.values[h],m++)});let x=g/m*r.x.scaleFactor;isNaN(x)&&(x=r.x.max*r.x.scaleFactor);let v=x.toFixed(2),w=100*d.toFixed(2);return isNaN(v)||isNaN(w)||h<0||h>=r.x.scaleLength?null:(r.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=v+l,n.tooltip.y=w+l,f.forEach(function(C,S){let k=E(C.name?C.name:"Series "+S);if(t.toggles[S]!==!1){let $,L=r.associative?i.data[S].values[b]:i.data[S].values[h],A=r.associative?b:h;if(i.config.tooltip.format)try{$=E(String(i.config.tooltip.format(A,L)))}catch(M){console.warn("SVC: tooltip.format threw an error:",M),$=`(${E(String(A))} : ${E(String(L))})`}else $=`(${E(String(A))} : ${E(String(L))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${S}">${k}</span> : ${$}
          </div>`}}),n.tooltip.text=c,n.index=h,n)}}};var q=class extends N{static get type(){return"scatter"}static get defaults(){return{plot:{size:4}}}static specs(){return{"plot.node":{fill:"primary"}}}tooltipLocation(t,e,i){return function(s){t.nodeMap||(t.nodeMap=re(e));let n={tooltip:{},crosshair:{}},l=1,c="",u=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientX-u.left)/u.width,d=(s.clientY-u.top)/u.height;p=Math.floor(p*100),d=Math.floor(d*100);let h=Math.floor(p/10),g=parseInt((p/10).toFixed(1).split(".")[1]),m=Math.floor(d/10),f=null,b=[[0,0],[-1,0],[1,0],[0,-1],[0,1]];for(let x=0;x<b.length;x++){let v=m+b[x][0],w=h+b[x][1];if(v>=0&&v<10&&w>=0&&w<10&&t.nodeMap[v]&&t.nodeMap[v][w]){let C=t.nodeMap[v][w][g];if(!C){for(let S=Math.max(0,g-1);S<=Math.min(9,g+1);S++)if(t.nodeMap[v][w][S]){C=t.nodeMap[v][w][S];break}}if(C){f=C;break}}}if(f)return n.crosshair.x1=-1,n.crosshair.x2=-1,n.crosshair.y1=-1,n.crosshair.y2=-1,n.tooltip.x=p+l,n.tooltip.y=d,f.forEach(x=>{let v=x.getAttribute("data-series"),w=x.getAttribute("data-index"),C=i.data[v].values[w],S=E(i.data[v].name||"Series "+v),k;if(i.config.tooltip.format)try{k=E(String(i.config.tooltip.format(S,C)))}catch($){console.warn("SVC: tooltip.format threw an error:",$),k=E(String(C))}else k=E(String(C));c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${v}">${S}</span> : (${k})
        </div>`}),n.tooltip.text=c,n}}createPlot({data:t,stats:e,subchartNoStretch:i}){t.forEach((o,s)=>{o.values.forEach((l,c)=>{let r=l[0],u=l[1],p=o.name||`Series ${s+1}`,d=new y("circle",{cx:((r-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-u)*e.y.scaleFactor).toFixed(3)+"%",r:this.config.plot.size,class:["plot-node",`plot-${s}`,`plot-node-${s}`],"data-index":c,"data-series":s,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${p}, (${r}, ${u})`});i.appendChild(d)})})}};function re(a){let t=Array.from(new Array(10)).map(()=>Array.from(new Array(10)).map(()=>[]));return a.querySelectorAll(".svc-plot-node").forEach(e=>{let i=parseInt(e.getAttribute("data-series"),10),o=parseInt(e.getAttribute("cx")),s=parseInt(e.getAttribute("cy")),n=Math.min(9,Math.floor(o/10)),l=parseInt((o/10).toFixed(1).split(".")[1]),c=Math.min(9,Math.floor(s/10));t[c][n][l]=t[c][n][l]||[],t[c][n][l][i]=e}),t}var rt=class extends q{static get type(){return"bubble"}static get defaults(){return{plot:{maxSize:4,node:{}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){t.forEach((s,n)=>{s.values.forEach((c,r)=>{let u=c[0],p=c[1],d=c[2],h=s.name||`Series ${n+1}`,g=e.alt.max-e.alt.min||1,m=(Math.abs(d)-e.alt.min)/g,f=new y("circle",{cx:((u-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-p)*e.y.scaleFactor).toFixed(3)+"%",r:m*this.config.plot.maxSize+.5+"%",style:`opacity: ${.7}`,class:["plot-node",`plot-${n}`,`plot-node-${n}`],"data-index":r,"data-series":n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${h}, (${u}, ${p}), size: ${d}`});o.appendChild(f)})})}};var Y=class extends W{static get type(){return"pie"}static get defaults(){return{plot:{ring:!1,node:{label:{enabled:!0,placement:"auto",scaleBySize:!0,limitBySize:!0,multiplier:1,threshold:12,style:{"font-size":"clamp(8px, 0.6vmin, 16px)"}}}},center:{size:"40%",style:{fill:"#fff"},label:{style:{"font-size":"5vmin",transform:"translate(0%, -50%)","text-align":"center"},container:{style:{display:"flex","justify-content":"center","align-items":"center"}},title:{style:{"font-size":"7vmin"}}}}}}static specs(){return{plot:{fill:"primary"},"plot.node":{fill:"primary"}}}parse(t){t=super.parse(t);let{layoutChart:e}=t,i=this.createGraph({stretch:!0});e.appendChild(i);let o=this.createGraph({stretch:!1});e.appendChild(o),this.createPlot({layoutChart:e,subchartStretch:i,subchartNoStretch:o}),o.appendChild(new y("g"));let s=new y("style");return s.innerHTML=".plot {opacity: 1;}.svc-loading {opacity:0;}",e.appendChild(s),t}createScript(){return new P({stats:this.stats,data:this.data,config:this.config}).render()}createPlot({layoutChart:t,subchartStretch:e,subchartNoStretch:i}){let o=this.data;if(!j(o))throw new Error('SVC: Pie chart "data" must be a plain object with numeric values, e.g. { "Apples": 30, "Oranges": 70 }.');Object.keys(o).forEach(u=>{if(typeof o[u]!="number")throw new Error(`SVC: Pie chart value for "${u}" must be a number.`);if(o[u]<0)throw new Error(`SVC: Pie chart value for "${u}" is negative (${o[u]}). Pie charts require non-negative values.`)});let s=Object.keys(o).reduce((u,p)=>u+=o[p],0);if(s===0){let u=new y("text",{x:"50%",y:"50%","text-anchor":"middle","alignment-baseline":"middle",class:["loading"]});u.textContent="No data",i.appendChild(u);return}let n=0,l=0,c=this.config.plot.node.instances.map(u=>u.fill);Object.keys(o).forEach((u,p)=>{let d=o[u],h=d/s,g=n/s,m=c[l%c.length],f=this.calculateSlice(h,g),b=this.createSlice(f,m,p,d,s,u);i.appendChild(b),l++,n+=d});let r=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]});if(this.config.plot.ring){let p=(parseFloat(this.config.center.size)||40)/2;r.appendChild(new y("circle",{cx:"50",cy:"50",r:String(p),fill:"var(--color-surface, #fff)",class:["center"]}))}i.appendChild(r)}calculateSlice(t,e){let o=Math.cos((e+t)*2*Math.PI)*50+50,s=Math.sin((e+t)*2*Math.PI)*50+50,n=Math.cos(e*2*Math.PI)*50+50,l=Math.sin(e*2*Math.PI)*50+50,c=e*360,r=t*360+c,u=(r+c)/2,p=50+50*Math.cos(u*2*Math.PI/360),d=50+50*Math.sin(u*2*Math.PI/360);p=(p+50)*.5,d=(d+50)*.5;let h=r-c;return{radius:50,degrees:u,degreeLength:h,start:{x:o,y:s},end:{x:n,y:l},center:{x:p,y:d}}}createSlice(t,e,i,o,s,n){let{radius:l,start:c,end:r,center:u,degreeLength:p}=t,d=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]}),h=p>180?1:0,g=`M ${l} ${l}`,m=`L${c.x} ${c.y}`,f=`A ${l} ${l} 0 ${h} 0 ${r.x} ${r.y}`,b=(o/s*100).toFixed(0);if(d.appendChild(new y("path",{fill:e,style:"vector-effect: non-scaling-stroke",d:`${g} ${m} ${f} Z`,"alignment-baseline":"middle","text-anchor":"middle","data-key":n,"data-value":o,tabindex:"0",class:["plot-node",`plot-node-${i}`],role:"graphics-symbol","aria-roledescription":"slice","aria-label":`${n}: ${b}%`})),this.config.plot.node.label.enabled){let{multiplier:x,threshold:v,limitBySize:w,scaleBySize:C,placement:S}=this.config.plot.node.label,k=p<=v;if(S==="outside"||S==="auto"&&k){let L=t.degrees*Math.PI/180,A=55,M=62,F=50+48*Math.cos(L),J=50+48*Math.sin(L),K=50+A*Math.cos(L),O=50+A*Math.sin(L),I=50+M*Math.cos(L),at=50+M*Math.sin(L),Gt=Math.cos(L)>=0?"start":"end";d.appendChild(new y("line",{x1:F.toFixed(1),y1:J.toFixed(1),x2:K.toFixed(1),y2:O.toFixed(1),stroke:"var(--chart-label-color, #737373)","stroke-width":"0.5",class:["plot-leader"]}));let Ft=new y("text",{fill:"var(--chart-label-color, #737373)",x:I.toFixed(1),y:at.toFixed(1),"alignment-baseline":"middle","text-anchor":Gt,style:"font-size: 0.35em;",class:["plot-node-label",`plot-node-label-${i}`]});Ft.innerHTML=`${E(n)} ${b}%`,d.appendChild(Ft)}else if(!this.config.plot.ring){let L;C&&(L=.37*x*(p/100));let A=new y("text",{fill:"#fff",x:u.x,y:u.y,style:C?`font-size: ${T(L)}em;`:"","alignment-baseline":"middle","text-anchor":"middle",class:w&&p>v||!w?["plot-node-label"]:["plot-node-label","hide"]});A.innerHTML=b+"%",d.appendChild(A)}}return d}tooltipLocation(t,e,i){return function(s){let n=e.querySelector("chart-plot");if(!n)return null;let l=n.getBoundingClientRect(),c=n.querySelector(".svc-nodeGroup"),r=c?c.getBoundingClientRect():l,u=r.left+r.width/2,p=r.top+r.height/2,d=s.clientX-u,h=s.clientY-p,g=Math.min(r.width,r.height)/2,m=Math.sqrt(d*d+h*h);if(m>g)return null;if(i.config.plot.ring){let O=parseFloat(i.config.center.size)||40,I=g*(O/100);if(m<I)return null}let f=Math.atan2(h,d);f<0&&(f+=2*Math.PI);let b=f/(2*Math.PI),x=(s.clientX-l.left)/l.width*100,v=(s.clientY-l.top)/l.height*100,w=i.data,C=Object.keys(w),S=C.reduce(function(O,I){return O+(w[I]||0)},0);if(S===0)return null;let k=0,$=null,L=0,A=0;for(let O=0;O<C.length;O++){let I=w[C[O]]||0,at=I/S;if(b>=k&&b<k+at){$=C[O],L=I,A=O;break}k+=at}if(!$)return null;let M=(L/S*100).toFixed(1),F={tooltip:{},crosshair:{x1:-10,x2:-10,y1:-10,y2:-10}};F.tooltip.x=x,F.tooltip.y=v;let J=E(String($)),K;if(i.config.tooltip&&i.config.tooltip.format)try{K=E(String(i.config.tooltip.format($,L)))}catch(O){console.warn("SVC: tooltip.format threw an error:",O),K=J+": "+M+"%"}else K=J+": "+M+"%";return F.tooltip.text='<div class="svc-tooltip-content"><span class="svc-tooltip-label-title svc-tooltip-label-title-'+A+'">'+J+"</span> : "+K+"</div>",F.index=A,F}}};var lt=class extends Y{static get type(){return"pie"}static get defaults(){return{plot:{ring:!0}}}};var Co=window.matchMedia("(prefers-reduced-motion: reduce)");var Ut=new Map;function Vt(a,t,e={}){let i=e.priority??10,o={impl:t,bundle:e.bundle,contract:e.contract,priority:i},s=Ut.get(a);if(customElements.get(a)){if(!s||s.priority>=i){s&&s.priority===i&&s.impl!==t&&console.warn(`[VB Bundle] Tag <${a}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${a}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=i){s.priority===i&&console.warn(`[VB Bundle] Tag <${a}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}Ut.set(a,o),customElements.define(a,t)}var yt=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,o){t.addEventListener(e,i,o),this.#t.push(()=>t.removeEventListener(e,i,o))}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let i=this.#e.states;try{e?i.add(t):i.delete(t)}catch{let o=`--${t}`;e?i.add(o):i.delete(o)}}_adoptInternals(t){this.#e||(this.#e=t)}};var ae=0;function Dt(a,t,e="vb-vt"){if(!a?.isConnected||typeof document>"u"||!("startViewTransition"in document)||matchMedia("(prefers-reduced-motion: reduce)").matches)return t(),null;let i=`${e}-${++ae}`;a.style.viewTransitionName=i;let o=document.startViewTransition(t);return o.finished.finally(()=>{a.style.viewTransitionName===i&&(a.style.viewTransitionName="")}),o}function Tt(a){let t=a.textContent.trim();if(!t)return null;let e=t.replace(/[$€£¥,% ]/g,""),i=Number(e);return Number.isFinite(i)?i:null}function ce(a){let t=[...a.cells],e=-1,i=[];for(let o=0;o<t.length;o++){let s=t[o];if(!s.hasAttribute("data-chart-ignore")){if(s.hasAttribute("data-chart-label")||s.getAttribute("scope")==="row"){e=o;continue}(s.hasAttribute("data-chart-series")||!s.hasAttribute("data-chart-ignore"))&&i.push({index:o,name:s.textContent.trim()})}}if(e===-1&&t.length>0){let o=t[0];if(!o.textContent.trim()||o.tagName==="TH"){e=0;let s=i.findIndex(n=>n.index===0);s!==-1&&i.splice(s,1)}}return{labelIndex:e,columns:i}}function de(a){let t=a.querySelector("thead"),e=a.querySelector("tbody")||a,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")];if(!i||o.length===0)return{data:[],config:{}};let{labelIndex:s,columns:n}=ce(i),l=s!==-1,c=n.map(p=>({name:p.name,values:l?{}:[]}));for(let p of o){let d=[...p.cells],h=l?d[s]?.textContent.trim()||"":null;for(let g=0;g<n.length;g++){let m=d[n[g].index],f=m?Tt(m):null;l&&h?c[g].values[h]=f??0:c[g].values.push(f??0)}}let r={},u=a.querySelector("caption");return u&&(r.title={text:u.textContent.trim(),enabled:!0}),{data:c,config:r}}function pe(a){let e=[...(a.querySelector("tbody")||a).querySelectorAll("tr")],i={};for(let n of e){let l=[...n.cells],c=n.querySelector("th"),r=c?c.textContent.trim():l[0]?.textContent.trim(),u=c?l[1]||l[0]:l[1],p=u?Tt(u):null;r&&p!=null&&(i[r]=p)}let o={},s=a.querySelector("caption");return s&&(o.title={text:s.textContent.trim(),enabled:!0}),{data:i,config:o}}function he(a){let t=a.querySelector("thead"),e=a.querySelector("tbody")||a,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")],s=new Map;for(let r of o){let u=[...r.cells],p=r.querySelector("th"),d=p?p.textContent.trim():"Data",h=p?[...r.querySelectorAll("td")]:u.slice(1);s.has(d)||s.set(d,[]);let g=h.map(m=>Tt(m)).filter(m=>m!=null);g.length>=2&&s.get(d).push(g)}let n=[...s.entries()].map(([r,u])=>({name:r,values:u})),l={},c=a.querySelector("caption");return c&&(l.title={text:c.textContent.trim(),enabled:!0}),{data:n,config:l}}function Ht(a,t){if(!a||!a.querySelector("tbody, tr"))return{data:null,config:{}};let e=(t||"").toLowerCase();return e==="pie"||e==="ring"?pe(a):e==="scatter"||e==="bubble"?he(a):de(a)}function qt(a){let t={};return a.hasAttribute("data-tooltip")&&(t.tooltip={enabled:!0}),a.hasAttribute("data-legend")&&(t.legend={enabled:!0}),a.hasAttribute("data-grid")&&(t.guides={x:{enabled:!0},y:{enabled:!0}}),a.hasAttribute("data-labels")&&(t.plot={node:{label:{enabled:!0}}}),t}function ue(a){let t=getComputedStyle(a),e=[];for(let i=1;i<=6;i++){let o=t.getPropertyValue(`--chart-series-${i}`).trim();o&&e.push(o)}return e.length>0?e:null}function _(a,t){return a.getPropertyValue(t).trim()||null}function Ot(a){let t=getComputedStyle(a),e={},i=_(t,"--chart-label-color"),o=_(t,"--chart-font-family");(i||o)&&(e.style={},i&&(e.style.color=i),o&&(e.style["font-family"]=o));let s=_(t,"--chart-axis-color");s&&(e.axis={style:{stroke:s}});let n=_(t,"--chart-grid-color");n&&(e.guides={style:{stroke:n}});let l=_(t,"--chart-baseline-color");l&&(e.baseline={style:{stroke:l}});let c=_(t,"--chart-tick-color");c&&(e.ticks={style:{stroke:c}});let r=_(t,"--chart-title-color"),u=_(t,"--chart-title-size");(r||u)&&(e.title=e.title||{},e.title.style={},r&&(e.title.style.color=r),u&&(e.title.style["font-size"]=u));let p=_(t,"--chart-subtitle-color"),d=_(t,"--chart-subtitle-size");(p||d)&&(e.title=e.title||{},e.title.subtitle=e.title.subtitle||{},e.title.subtitle.style={},p&&(e.title.subtitle.style.color=p),d&&(e.title.subtitle.style["font-size"]=d));let h=_(t,"--chart-tooltip-bg"),g=_(t,"--chart-tooltip-color"),m=_(t,"--chart-tooltip-shadow");(h||g||m)&&(e.tooltip=e.tooltip||{},e.tooltip.label=e.tooltip.label||{},e.tooltip.label.style={},h&&(e.tooltip.label.style["background-color"]=h),g&&(e.tooltip.label.style.color=g),m&&(e.tooltip.label.style["box-shadow"]=m));let f=ue(a);return f&&(e.palette=f),e}function Yt(a){return{name:"vb-theme-bridge",hooks:{configResolved({config:t}){let e=Ot(a);e.style&&(t.style=Object.assign({},e.style,t.style)),e.palette&&!t._paletteFromUser&&(t.palette=e.palette)}}}}var fe={line:D,area:nt,bar:Q,column:H,pie:Y,ring:lt,scatter:q,bubble:rt};function G(a,t=null){if(a==null)return t;if(typeof a!="string")return a;try{return JSON.parse(a)}catch{return t}}function X(a,t){if(!t||typeof t!="object"||Array.isArray(t))return a;for(let e of Object.keys(t))t[e]&&typeof t[e]=="object"&&!Array.isArray(t[e])?((!a[e]||typeof a[e]!="object")&&(a[e]={}),X(a[e],t[e])):a[e]=t[e];return a}var _t=class extends yt{static get observedAttributes(){return["data-type","data-values","data-config","data-title","data-subtitle","data-legend","data-tooltip","data-palette","data-label-x","data-label-y","data-size"]}#t=null;#e=null;#s=null;#r=!1;#i=null;#o=null;set data(t){this.#t!==t&&(this.#t=t,this.#n(),this.#l("property"))}get data(){return this.#t}set config(t){this.#e!==t&&(this.#e=t,this.#n(),this.#l("property"))}get config(){return this.#e}#l(t){this.dispatchEvent(new CustomEvent("chart-wc:data-changed",{detail:{data:this.#t,config:this.#e,source:t},bubbles:!0}))}refresh(){this.#n()}toSVG(){return this.#i?.querySelector("svg")?.outerHTML||null}setup(){this.#n()}teardown(){this.#a()}attributeChangedCallback(){this.hasAttribute("data-upgraded")&&this.#n()}#n(){!this.isConnected||this.#r||(this.#r=!0,Promise.resolve().then(()=>{this.#r=!1,this.isConnected&&this.#f()}))}#c(){let t=(this.dataset.type||"").toLowerCase();return t||(t=(this.querySelector("table")?.dataset.type||"bar").toLowerCase()),fe[t]||Q}#d(){if(this.#t!=null)return{data:G(this.#t,null),tableConfig:{}};let t=this.dataset.values;if(t!=null)return{data:G(t,null),tableConfig:{}};let e=this.querySelector('script[type="application/json"]');if(e)return{data:G(e.textContent,null),tableConfig:{}};let i=this.querySelector("template[data-chart-data]");if(i){let s=i.content?.textContent||i.innerHTML;return{data:G(s,null),tableConfig:{}}}let o=this.querySelector("table");if(o){let s=(this.dataset.type||o.dataset.type||"bar").toLowerCase(),{data:n,config:l}=Ht(o,s),c=qt(o),r=X(X({},l),c);return{data:n,tableConfig:r}}return null}#p(t={}){let e=Ot(this),i=G(this.#e,{})||{},o=G(this.dataset.config,{})||{},s={};s=X(s,e),s=X(s,t),s=X(s,i),s=X(s,o);let n=this.dataset.labelX,l=this.dataset.labelY;if(s.axis=s.axis||{},s.axis.label=s.axis.label||{},n!=null?s.axis.label.x={text:n,enabled:!0}:s.axis.label.x?.text||(s.axis.label.x=s.axis.label.x||{},s.axis.label.x.enabled=!1),l!=null?s.axis.label.y={text:l,enabled:!0}:s.axis.label.y?.text||(s.axis.label.y=s.axis.label.y||{},s.axis.label.y.enabled=!1),s.plot?.node?.label?.scaleBySize||(s.plot=s.plot||{},s.plot.node=s.plot.node||{},s.plot.node.label=s.plot.node.label||{},s.plot.node.label.scaleBySize=!1),this.dataset.title!=null){let c={text:this.dataset.title,enabled:!0};this.dataset.subtitle!=null&&(c.subtitle=this.dataset.subtitle),s.title=c}if(this.dataset.legend!=null&&(s.legend={enabled:!0}),this.dataset.tooltip!=null&&(s.tooltip={enabled:!0}),this.dataset.palette!=null){let c=G(this.dataset.palette,null);c&&(s.palette=c)}return this.dataset.size==="sparkline"&&(s.axis=s.axis||{},s.axis.x={...s.axis.x||{},enabled:!1},s.axis.y={...s.axis.y||{},enabled:!1},s.axis.label=s.axis.label||{},s.axis.label.x={...s.axis.label.x||{},enabled:!1},s.axis.label.y={...s.axis.label.y||{},enabled:!1},s.ticks=s.ticks||{},s.ticks.x={...s.ticks.x||{},enabled:!1},s.ticks.y={...s.ticks.y||{},enabled:!1},s.guides=s.guides||{},s.guides.x={...s.guides.x||{},enabled:!1},s.guides.y={...s.guides.y||{},enabled:!1},s.title={enabled:!1},s.legend={enabled:!1},s.tooltip={enabled:!1}),s.plugins=s.plugins||[],s.plugins.push(Yt(this)),s}#h(){if(this.#o&&this.contains(this.#o))return;this.#o=document.createElement("div"),this.#o.setAttribute("data-chart-svg",""),this.#o.setAttribute("aria-hidden","true"),this.appendChild(this.#o);let t=this.#o.attachShadow({mode:"open"}),e=document.createElement("style");e.textContent=`
      .sparkline figure[data-chart-id] {
        padding: 0;
        background: transparent;
      }
      .sparkline chart-canvas {
        padding: 0;
        grid-template-columns: 0 0 0 1fr;
        grid-template-rows: 1fr 0 0 0;
      }
      .sparkline chart-title,
      .sparkline chart-legend,
      .sparkline chart-axis,
      .sparkline chart-label,
      .sparkline .svc-scale-label-x,
      .sparkline .svc-scale-label-y,
      .sparkline .svc-origin-label,
      .sparkline .svc-axis-y-label-dummy,
      .sparkline .svc-ticks-x,
      .sparkline .svc-ticks-y {
        display: none !important;
      }
    `,t.appendChild(e),this.#i=document.createElement("div"),this.#i.style.cssText="width:100%;height:100%;overflow:visible;",t.appendChild(this.#i)}#u(t){if(!t)return;(this.dataset.chart||t.dataset.chart||"replace")==="replace"&&(t.classList.add("visually-hidden"),t.setAttribute("aria-hidden","false"))}#f(){let t=this.#c(),e=this.#d();if(!e||!e.data){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:"No chart data found"},bubbles:!0}));return}let{data:i,tableConfig:o}=e,s=this.#p(o),n=this.querySelector("table"),l=this.#s!=null,c=()=>{this.#a(),this.#u(n),this.#h(),this.#i&&this.#i.classList.toggle("sparkline",this.dataset.size==="sparkline");try{this.dispatchEvent(new CustomEvent("chart-wc:config-resolved",{detail:{type:this.dataset.type||n?.dataset.type||"bar",config:s},bubbles:!0})),this.#s=new t({config:s,data:i}),this.#s.mount(this.#i),this.dispatchEvent(new CustomEvent("chart-wc:render",{detail:{type:this.dataset.type||n?.dataset.type||"bar",seriesCount:Array.isArray(i)?i.length:Object.keys(i).length},bubbles:!0}))}catch(r){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:r.message},bubbles:!0}))}};l?Dt(this,c,"chart-vt"):c()}#a(){this.#s&&(this.#s.destroy(),this.#s=null),this.#i&&(this.#i.innerHTML="")}};Vt("chart-wc",_t);export{_t as ChartWc};
//# sourceMappingURL=chart-wc.js.map
