function $(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function bt(a){let t=$(String(a));return t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.+?)\*/g,"<em>$1</em>"),t=t.replace(/`(.+?)`/g,"<code>$1</code>"),t=t.replace(/\n/g,"<br>"),t}function R(a){if(!a||typeof a!="object"||Array.isArray(a))return!1;let t=Object.getPrototypeOf(a);return t===Object.prototype||t===null}function A(a){let t=a.toFixed(2);return parseFloat(t[t.length-1]==="0"?a.toFixed(1):t)}function xt(a){return t(a);function t(i){let o="";for(let s in i.options)if(Object.hasOwn(i.options,s)){let n=s,l=i.options[s];if(s==="class"){if(!Array.isArray(l))throw new Error("Wrong argument to class");l="",i.options[s].forEach(c=>{l+=(l===""?"":" ")+`svc-${c}`})}o+=(o===""?"":" ")+`${n}="${$(String(l))}"`}if(i.children.length>0){let s="";return i.children.forEach(function(n){s+=(o===""?"":" ")+t(n)}),`<${i.tagName}${e(o)}>${s}</${i.tagName}>`}else return typeof i.innerHTML<"u"?`<${i.tagName}${e(o)}>${i.innerHTML}</${i.tagName}>`:`<${i.tagName}${e(o)}></${i.tagName}>`}function e(i){return i===""?i:" "+i}}function tt(a,t){return i(a,t);function e(o){return R(o)}function i(o,...s){if(!s.length)return o;let n=s.shift();if(e(o)&&e(n))for(let l in n)e(n[l])?(o[l]||Object.assign(o,{[l]:{}}),i(o[l],n[l])):Object.assign(o,{[l]:n[l]});return i(o,...s)}}function vt(a,t){let e=a,i=t.split(".");for(let o=0;o<i.length;o++)if(e=e[i[o]],!e)return!1;return!0}var y=class{constructor(t="div",e={}){this.children=[],this.tagName=t,this.options={},Object.assign(this.options,e)}set textContent(t){this.innerHTML=$(t)}appendChild(t){this.children.push(t)}prependChild(t){this.children.unshift(t)}removeChild(t){let e=this.children.indexOf(t);e!==-1&&this.children.splice(e,1)}setAttrs(t){Object.assign(this.options,t)}setAttribute(t,e){this.options[t]=e}};var Xt=0,W=class a{constructor(t,...e){this.config=e.reduce((i,o)=>tt(i,o),{}),this.palette=t||a.defaultPalette(),R(this.palette[0])||(this.palette=this.palette.map(i=>({primary:i,secondary:i}))),this.defs=this.createDefs(),tt(this.config.l,a.layoutProperties())}static layoutProperties(){return{wrap:{style:{background:"var(--color-surface, #fff)"}},top:{style:{"justify-content":"center","align-items":"center","padding-block":"0.5em 2em","padding-inline":"0.2em"}},ticks:{x:{style:{height:"10px"}},y:{style:{width:"1%"}}}}}static defaultPalette(){return[{primary:"var(--chart-series-1, #3b82f6)",secondary:"var(--chart-series-1, #3b82f6)"},{primary:"var(--chart-series-2, #ef4444)",secondary:"var(--chart-series-2, #ef4444)"},{primary:"var(--chart-series-3, #8b5cf6)",secondary:"var(--chart-series-3, #8b5cf6)"},{primary:"var(--chart-series-4, #f59e0b)",secondary:"var(--chart-series-4, #f59e0b)"},{primary:"var(--chart-series-5, #10b981)",secondary:"var(--chart-series-5, #10b981)"}]}createDefs(){let t=[];return R(this.palette[0])&&R(this.palette[0].primary)&&this.palette.forEach((e,i)=>{Object.keys(e).forEach(o=>{let{url:s,def:n}=this.generateGradient(e[o],i,o);e[o]=`url(#${s})`,t.push(n)})}),t}generateGradient(t,e,i){let o=t.orientation||"vertical",s="svc-grad-"+e+"-"+i+"-"+Xt++,n=new y("linearGradient",{id:s,x1:"0%",y1:"0%",x2:o==="vertical"?"0%":"100%",y2:o==="vertical"?"100%":"0%"});return Object.keys(t).forEach(l=>{isNaN(parseInt(l))||n.appendChild(new y("stop",{offset:l+"%","stop-color":t[l]}))}),{url:s,def:n}}applyPalette(t){for(let i in t)if(Object.hasOwn(t,i)){let o=e(i,this.config);if(!o)continue;let s=t[i];o.instances||(o.instances=[]),this.palette.forEach((n,l)=>{let c={};for(let r in s)if(Object.hasOwn(s,r)){let u=s[r];Object.prototype.hasOwnProperty.call(n,u)?c[r]=n[u]:c[r]=u}o.instances[l]?Object.keys(c).forEach(r=>{typeof o.instances[l][r]>"u"&&(o.instances[l][r]=c[r])}):o.instances.push(c)})}function e(i,o){let s=i.split("."),n=o,l=!1;return s.forEach(c=>{n[c]?n=n[c]:l=!0}),l?null:n}}};var et=class{constructor(t){this.config=t}static get defaults(){return{l:{top:{breakpoint:{width:200,height:150}}},title:{enabled:!0,text:"Title",style:{"text-align":"center",width:"100%","font-weight":400,"font-size":"var(--chart-title-size, 1.4rem)",color:"var(--chart-title-color, #444)","text-anchor":"middle","alignment-baseline":"middle"},subtitle:{style:{"font-size":"var(--chart-subtitle-size, 0.9rem)",color:"var(--chart-subtitle-color, var(--chart-label-color, #737373))","font-weight":300}}}}}render(){let t=this.config.title,e=new y("div",{class:["title"]}),i=t.markdown!==!1&&Kt(t.text),o=i?bt(t.text):$(t.text);return t.subtitle&&typeof t.subtitle=="string"?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${Pt(t.subtitle,i)}</div>`:t.subtitle&&t.subtitle.text?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${Pt(t.subtitle.text,i)}</div>`:e.innerHTML=o,e}};function Kt(a){return/\*\*.+?\*\*|\*.+?\*|`.+?`|\n/.test(String(a))}function Pt(a,t){return t?bt(a):$(a)}var Zt=0,it=class{constructor({config:t,data:e}){this.config=t,this.data=e}static get defaults(){return{l:{},legend:{breakpoint:{width:300,height:275},enabled:!0,style:{margin:0,padding:0,"flex-direction":"column","flex-wrap":"wrap","justify-content":"center","background-color":"var(--color-surface, rgba(255,255,255,0.8))","z-index":2},item:{style:{display:"flex","align-items":"center",padding:"0.5em",color:"var(--chart-label-color, #616161)","white-space":"nowrap"}}}}}render(t,e,i,o){return this.createLegend(i)}createLegend(t){let e=new y("ul",{class:["legend"]}),i=Zt++;return(t!=="pie"?this.data.map((s,n)=>({name:s.name||"Series "+n,index:n})):Object.keys(this.data).map((s,n)=>({name:s,index:n}))).forEach(({name:s,index:n})=>{let l=this._getSeriesColor(n),c=new y("li",{class:["legend-item"]}),r=`legend-item-${n}-${i}`,u=new y("input",{type:"checkbox",id:r,"data-series":n,checked:"",style:`--_series-color: ${l}`});c.appendChild(u);let h=new y("label",{id:`legend-item-text-${n}-${i}`,for:r});h.textContent=s,c.appendChild(h),e.appendChild(c)}),e}_getSeriesColor(t){let e;return this.config.plot.instances&&this.config.plot.instances.length>0?e=this.config.plot.instances[t%this.config.plot.instances.length]:this.config.plot.node?.instances&&this.config.plot.node.instances.length>0&&(e=this.config.plot.node.instances[t%this.config.plot.node.instances.length]),e&&e.stroke?e.stroke:e&&e.fill?e.fill:"#777"}};var N=class{constructor({stats:t,data:e,config:i,type:o}){this.data=e,this.config=i,this.type=o,o!=="pie"&&(this.min=t.y.min,this.max=t.y.max,this.stats=t)}static get defaults(){return{tooltip:{breakpoint:{width:275,height:275},enabled:!0,container:{style:{display:"flex"}},crosshair:{style:{"z-index":-1}},label:{style:{"background-color":"var(--chart-tooltip-bg, var(--color-surface, #fff))","box-shadow":"var(--chart-tooltip-shadow, 0 2px 4px rgba(0, 0, 0, 0.2))",color:"var(--chart-tooltip-color, var(--chart-label-color, #737373))",padding:"1em","z-index":2},title:{instances:[]}}}}}render(){return{tooltip:this.createDOM(),htmlTooltip:this._createHTMLTooltip()}}createDOM(){return this._createCartesianTooltip()}_createCartesianTooltip(){let t=new y("g",{id:"svc-tooltip-box",class:["tooltip","hide"]}),e=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"});return t.appendChild(e),t.appendChild(this._createTooltipForeignObject("svc-tooltip-label",["tooltip-label","hide"],{role:"tooltip","aria-live":"polite"})),t}_createRingTooltip(){let t=new y("g",{id:"svc-center-label-box",class:["tooltip","hide"]});return t.appendChild(this._createTooltipForeignObject("svc-center-label",["center-label"],{"aria-live":"polite"})),t}_createHTMLTooltip(){let t=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"}),e=new y("div",{id:"svc-tooltip-box",class:["tooltip","hide"],style:"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"}),i=new y("div",{class:["tooltip-container"],style:"position:absolute;pointer-events:auto;"}),o=new y("div",{id:"svc-tooltip-label",class:["tooltip-label","hide"],role:"tooltip","aria-live":"polite"});return i.appendChild(o),e.appendChild(i),{crosshair:t,tooltipBox:e}}_createTooltipForeignObject(t,e,i){let o=new y("foreignObject",{class:["tooltip-fo"],width:"100%",height:"100%"}),s=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});o.appendChild(s),s.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let n=new y("div",{class:["tooltip-container"]});s.appendChild(n);let l=new y("div",{id:t,class:e,...i});return n.appendChild(l),o}};var Nt=`
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
`;var ct=class{constructor(){this.sheet=Nt,this.rules=[]}addRule(t,e){let i="";Object.keys(e).forEach(o=>{i+=`${o}: ${e[o]};`}),this.sheet+=`.svc-${t}{${i}}`}addRaw(t){this.sheet+=t}convertconfig(t,e,i){let o={width:{},height:{}},s=c(t),n=l(o);return s+n;function l(r){let u="";return Object.keys(r).forEach(h=>{Object.keys(r[h]).forEach(d=>{let p=r[h][d],g=`@media(max-${h}: ${d}px){`,f=p.map(m=>`.svc-${m}.svc-${m}`);g+=f.join(","),g+="{ display: none; }",g+="}",u+=g})}),u}function c(r,u="",h="",d=[]){for(let p in r)if(p==="style"){let g="";for(let f in r[p])Object.hasOwn(r[p],f)&&(g+=`${f}:${r[p][f]};`);if(d.length===0)h+=`figure[data-chart-id] {${g}}`;else{let f=d.reduce((m,b)=>m+=(m===""?"":"-")+b,"");h+=`.svc-${f}{${g}}`}}else if(p==="instances"){let g=r[p];for(let f=0;f<e;f++){let m=g[f];if(!m)continue;let b="";for(let v in m)Object.hasOwn(m,v)&&(b+=`${v}:${m[v]};`);if(b!==""){let v=d.reduce((w,C)=>w+=(w===""?"":"-")+C,""),x=i?`[data-chart-id="${i}"] `:"";h+=`${x}.svc-${v}-${f} {${b}}`}}}else if(p==="breakpoint"){let g=d.reduce((f,m)=>f+=(f===""?"":"-")+m,"");o.width[r.breakpoint.width]?o.width[r.breakpoint.width].push(g):o.width[r.breakpoint.width]=[g],o.height[r.breakpoint.height]?o.height[r.breakpoint.height].push(g):o.height[r.breakpoint.height]=[g]}else typeof r[p]=="object"&&(d.push(p),h=c(r[p],p,h,d),d.pop());return h}}};function It({interactive:a=!1}={}){let t=new y("svg");t.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",role:a?"graphics-document":"img","aria-roledescription":"chart"});let e=new y("foreignObject",{width:"100%",height:"100%"});t.appendChild(e);let i=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});e.appendChild(i),i.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let o=new y("figure");i.appendChild(o);let s=new y("chart-title");o.appendChild(s);let n=new y("chart-body");o.appendChild(n);let l=new y("chart-canvas");n.appendChild(l);let c=new y("chart-label",{position:"y"});l.appendChild(c);let r=new y("chart-axis",{position:"y"});l.appendChild(r);let u=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-y"]});l.appendChild(u);let h=new y("chart-plot");l.appendChild(h);let d=new y("svg");d.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plotarea"]}),h.appendChild(d);let p=new y("div"),g=new y("div"),f=new y("div"),m=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-x"]});l.appendChild(m);let b=new y("chart-axis",{position:"x"});l.appendChild(b);let v=new y("chart-label",{position:"x"});l.appendChild(v),d.appendChild(new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]}));let x=new y("text",{x:"50%",y:"50%",class:["loading"]});return x.innerHTML="Loading Chart...",d.appendChild(x),{root:t,wrap:o,top:s,body:n,plotarea:h,layoutChart:d,layoutXAxis:b,layoutYTicks:u,layoutXTicks:m,layoutYAxis:r,layoutOriginRight:f,layoutOriginCenter:g,layoutXAxisLabel:v,layoutYAxisLabel:c,layoutOriginLeft:p}}var Wt=new Set(["onInteraction","onResize","onClick"]),dt=class{#t=new Map;register(t,e){this.#t.has(t)||this.#t.set(t,new Set),this.#t.get(t).add(e)}unregister(t,e){let i=this.#t.get(t);i&&i.delete(e)}run(t,e){if(Wt.has(t)&&typeof document>"u")return;let i=this.#t.get(t);if(i)for(let o of i)o(e)}registerPlugin(t){if(!(!t||!t.hooks))for(let[e,i]of Object.entries(t.hooks))this.register(e,i)}destroy(){this.#t.clear()}};function wt(a){return JSON.stringify(a).replace(/<\//g,"<\\/").replace(/]]>/g,"]]\\>").replace(/<!--/g,"<\\!--").replace(/<\?/g,"<\\?")}var pt=class{hooks=new dt;structure=null;constructor(t){}compile(t,e){return""}compileHTML(t,e){return""}applyConfigToDefaults(t){return t}render(){}toFile(t={}){let e=c(t),i=`<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`,o=this.structure;if(!o)return i;let{body:s}=o,n;e.includeScripts&&(n=this._createScripts(this.structure),s.appendChild(n));let l=this.compile(o.root);return e.includeScripts&&n&&s.removeChild(n),e.prerendered&&(l=l.slice(0,l.indexOf("svg")+3)+' data-prerendered=""'+l.slice(l.indexOf("svg")+3)),i+l;function c(r){if(typeof r=="object"&&r!==null){let u=!!r.prerendered,h=!u;return{prerendered:u,includeScripts:r.includeScripts??h}}return{prerendered:!!r,includeScripts:!0}}}toString(){return this.structure?this.compile(this.structure.root):""}toHTML({prerendered:t}={}){return this.compileHTML(this.structure,{prerendered:t})}async toBlob(t="image/svg+xml",{width:e=800,height:i=600}={}){if(typeof Blob>"u")throw new Error("SVC: toBlob() requires a browser environment.");let o=this.toString();if(t==="image/svg+xml")return new Blob([o],{type:"image/svg+xml"});if(t==="image/png"){if(typeof document>"u")throw new Error("SVC: PNG export requires a browser environment with Canvas.");return this._svgToPngBlob(o,e,i)}throw new Error(`SVC: Unsupported export type "${t}".`)}async toDataURL(t="image/svg+xml",e){if(typeof FileReader>"u")throw new Error("SVC: toDataURL() requires a browser environment with FileReader.");let i=await this.toBlob(t,e);return new Promise((o,s)=>{let n=new FileReader;n.onload=()=>o(n.result),n.onerror=s,n.readAsDataURL(i)})}async download(t="chart.svg",e){if(typeof document>"u")throw new Error("SVC: download() requires a browser environment.");let o=t.split(".").pop()?.toLowerCase()==="png"?"image/png":"image/svg+xml",s=await this.toBlob(o,e),n=URL.createObjectURL(s),l=document.createElement("a");l.href=n,l.download=t,document.body.appendChild(l),l.click(),document.body.removeChild(l),URL.revokeObjectURL(n)}_svgToPngBlob(t,e,i){return new Promise((o,s)=>{let n=document.createElement("canvas");n.width=e,n.height=i;let l=n.getContext("2d"),c=new Image,r=new Blob([t],{type:"image/svg+xml"}),u=URL.createObjectURL(r);c.onload=()=>{if(!l){s(new Error("SVC: 2D canvas context unavailable."));return}l.drawImage(c,0,0,e,i),URL.revokeObjectURL(u),n.toBlob(h=>{h?o(h):s(new Error("SVC: PNG export failed."))},"image/png")},c.onerror=()=>{URL.revokeObjectURL(u),s(new Error("SVC: Failed to load SVG for PNG export."))},c.src=u})}mount(t){if(!t||typeof document>"u")return null;t.innerHTML=this.toHTML(),this._state=this.hydrate(t),this._container=t;let e=t.host||t;return this._observeResize(e),this._state}createElement(){if(typeof document>"u")return null;let t=document.createElement("div");return this.mount(t),t}hydrate(t){if(!t)return null;let e={functions:{}};return(this.interactions||[]).forEach(o=>{e.functions[o.name]=o(e,t,this)}),this._state=e,this._container=t,e}update({data:t,config:e}={}){if(!this._container)return null;let i=this._container;return this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._state=null,t!=null&&(this.data=t),e!=null&&(tt(this.config,e),this.config=this.applyConfigToDefaults(this.config).config),this.interactions=[],this.render(),i.innerHTML=this.toString(),this._state=this.hydrate(i),this._container=i,this._state}destroy(){this.hooks.run("beforeDestroy",{container:this._container,state:this._state}),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._container&&(this._container.innerHTML=""),this._state=null,this._container=null,this.hooks.destroy()}_observeResize(t){typeof ResizeObserver>"u"||(this._resizeObserver=new ResizeObserver(e=>{let i=e[0];i&&this.hooks.run("onResize",{width:i.contentRect.width,height:i.contentRect.height,container:t})}),this._resizeObserver.observe(t))}_createScripts(t){let e=new y("script",{class:["chart-script"]}),i="",o=[];(this.interactions||[]).forEach(l=>{i+=l.toString()+`
`,o.push(l.name)});let n=this;return i+=`
    var chart = {
      stats: ${wt(n.stats||{})},
      data: ${wt(n.data)},
      config: ${wt(n.config)}
    };
    var svgRoot = document.currentScript.closest('svg');
    var state = { functions: []};`,o.forEach(l=>{i+=`state.functions['${l}'] = ${l}(state, svgRoot, chart);`}),e.innerHTML=`//<![CDATA[
`+i+`
//]]>`,e}};function Ct(a,t,e){let i=e.config&&e.config.tooltip&&e.config.tooltip.hideDelay||2e3,o=t.querySelector("chart-plot"),s=t.querySelector("#svc-tooltip-box"),n=t.querySelector("#svc-tooltip-label"),l=t.querySelector(".svc-tooltip-crosshair");if(!o||!s||!n||!l)return;let c=o,r=s,u=n,h=l,d=[],p=null,g=null;function f(){g=null}typeof window<"u"&&(window.addEventListener("scroll",f,{passive:!0}),window.addEventListener("resize",f,{passive:!0}));let m=null;typeof ResizeObserver<"u"&&(m=new ResizeObserver(f),m.observe(c));function b(){u.setAttribute("class","svc-tooltip-label svc-hide"),r.setAttribute("class","svc-tooltip svc-hide"),h.setAttribute("x1","-10%"),h.setAttribute("x2","-10%"),h.setAttribute("y1","-10%"),h.setAttribute("y2","-10%");for(let w=0;w<d.length;w++)d[w].classList.remove("svc-plot-node-active-"+w);d=[]}function v(){p&&clearTimeout(p),p=setTimeout(b,i)}c.addEventListener("mousedown",x),c.addEventListener("mousemove",x),a._tooltipCleanup=function(){p&&clearTimeout(p),c.removeEventListener("mousedown",x),c.removeEventListener("mousemove",x),typeof window<"u"&&(window.removeEventListener("scroll",f),window.removeEventListener("resize",f)),m&&(m.disconnect(),m=null)};function x(w){v();let C=a.functions.tooltipLocation(w,a,t,e);if(!C)return;let k=t.querySelectorAll('.svc-plot-node[node="'+C.index+'"]');for(let O=0;O<d.length;O++)d[O].classList.remove("svc-plot-node-active-"+O);d=[];for(let O=0;O<k.length;O++)k[O].classList.add("svc-plot-node-active-"+O),d.push(k[O]);h.setAttribute("x1",C.crosshair.x1+"%"),h.setAttribute("x2",C.crosshair.x2+"%"),h.setAttribute("y1",C.crosshair.y1+"%"),h.setAttribute("y2",C.crosshair.y2+"%"),u.innerHTML=C.tooltip.text,u.setAttribute("class","svc-tooltip-label"),r.setAttribute("class","svc-tooltip"),g||(g=c.getBoundingClientRect());let S=g,E=u.getBoundingClientRect(),L=E.width/S.width*100,M=E.height/S.height*100,T=C.tooltip.x,_=C.tooltip.y;T+L>98&&(T=T-L-1),T<0&&(T=0),_+M>98&&(_=98-M),_<0&&(_=0);let P=r.querySelector("foreignObject");if(P)P.setAttribute("x",T+"%"),P.setAttribute("y",_+"%");else{let O=u.parentElement;O&&(O.style.left=T+"%",O.style.top=_+"%")}e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"tooltip",event:w,data:{index:C.index,tooltip:C.tooltip},element:r})}}function kt(a,t,e){a.toggles=Array.from(t.querySelectorAll("chart-legend input")),a.toggles.forEach(function(i){i.removeAttribute("onclick"),i.addEventListener("click",function(o){let s=o.target.getAttribute("data-series");a.toggles[s]=o.target.checked;let n=a.toggles[s]!==!1,l=n?1:0,c=t.getElementsByClassName("svc-plot-"+s)[0];c&&(c.style.opacity=String(l));let r=t.getElementsByClassName("svc-plot-node-"+s);for(let u=0;u<r.length;u++)r[u].style.opacity=String(l);e&&e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"legend-toggle",event:o,data:{series:s,visible:n},element:i})})})}function St(a,t,e){let i=t.querySelectorAll('[role="graphics-symbol"]');if(i.length===0)return;let o=-1,s=t.querySelector("chart-plot");if(!s)return;s.setAttribute("tabindex","0"),s.addEventListener("keydown",function(c){if(c.key==="ArrowRight"||c.key==="ArrowDown")c.preventDefault(),o=Math.min(o+1,i.length-1),n(o);else if(c.key==="ArrowLeft"||c.key==="ArrowUp")c.preventDefault(),o=Math.max(o-1,0),n(o);else if(c.key==="Escape"){l();let r=t.querySelector("#svc-tooltip-label");r&&r.classList.add("svc-hide"),o=-1}});function n(c){l();let r=i[c];if(!r)return;r.classList.add("svc-focus");let u=r.getAttribute("aria-label"),h=t.querySelector("#svc-tooltip-label");h&&u&&(h.textContent=u,h.classList.remove("svc-hide"))}function l(){for(let c=0;c<i.length;c++)i[c].classList.remove("svc-focus")}}function $t(a,t,e){let i=t.querySelector("chart-plot");if(!i)return;function o(n){let l=n.target.closest('[role="graphics-symbol"]');if(!l)return;let c={type:"click",event:n,element:l,seriesIndex:parseInt(l.getAttribute("plot")||l.getAttribute("data-series")||"0",10),dataIndex:parseInt(l.getAttribute("node")||l.getAttribute("data-index")||l.getAttribute("index")||"0",10),key:l.getAttribute("data-key")||null,value:l.getAttribute("data-value")||null,label:l.getAttribute("aria-label")||""};e.hooks&&e.hooks.run&&e.hooks.run("onClick",c)}i.addEventListener("click",o);let s=a._dataClickCleanup;a._dataClickCleanup=function(){s&&s(),i.removeEventListener("click",o)}}var Qt=0,Q=class a extends pt{#t;#e;data;config;palette;_scopeId="";interactions=[];stats;chart;legend;title;tooltip;_styleElement;constructor({config:t={},data:e}){if(super({config:t,data:e}),e==null)throw new Error('SVC: "data" is required. Pass an array of series objects or a plain object for pie charts.');this.data=e,this.palette=t.palette=t.palette||W.defaultPalette();let i=this.applyConfigToDefaults(t);this.#e=i.defs,this.config=i.config,Array.isArray(this.config.plugins)&&this.config.plugins.forEach(o=>this.hooks.registerPlugin(o)),this.hooks.run("configResolved",{config:this.config,data:this.data,chartType:this.constructor.type}),this.#t=new ct,this._scopeId="c"+Qt++,this.interactions=[],this.structure=null,this.render()}get stylesheet(){return this.#t}get defs(){return this.#e}applyConfigToDefaults(t){let e=[],i=Object.getPrototypeOf(this);for(;i.constructor.name!=="Object";)i.constructor.defaults&&e.push(i.constructor.defaults),i=Object.getPrototypeOf(i);e=e.reverse();let o={legend:it,tooltip:N};Object.keys(o).forEach(n=>{(!t[n]||t[n].enabled)&&e.push(o[n].defaults)}),t.title&&t.title.text&&e.push(et.defaults);let s=new W(this.palette,...e,t);return s.applyPalette(a.specs()),s.applyPalette(this.constructor.specs(s.config)),s}static get defaults(){return{palette:W.defaultPalette(),style:{"font-family":"var(--chart-font-family, inherit)","font-weight":300,color:"var(--chart-label-color, #737373)"},legend:{enabled:!0},tooltip:{enabled:!0},plot:{node:{enabled:!0,instances:[],active:{instances:[]},label:{enabled:!1,instances:[]}},instances:[],style:{overflow:"visible"}},"plot-top":{style:{overflow:"visible"}},plotarea:{style:{fill:"var(--color-surface, #fff)",overflow:"visible"}},loading:{enabled:!0,style:{"font-size":"1.5em",fill:"var(--chart-label-color, #616161)","text-anchor":"middle"}}}}static specs(){return{"plot.node.label":{fill:"primary"},"tooltip.label.title":{color:"primary"}}}render(){this.config.title&&(this.title=new et(this.config)),this.config.legend&&(this.legend=new it({config:this.config,data:this.data,chart:this.chart}));let t=!!(this.config.tooltip?.enabled||this.config.legend?.enabled),e=It({interactive:t});e.wrap.setAttribute("data-chart-id",this._scopeId);let i=this.constructor.type||"chart";if(this.config.title&&this.config.title.text){let o=$(this.config.title.text);e.root.setAttribute("aria-label",o);let s=new y("desc");s.innerHTML=`${i} chart: ${o}`,e.root.prependChild(s)}else{let o=Array.isArray(this.data)?this.data.length:Object.keys(this.data).length;e.root.setAttribute("aria-label",`${i} chart with ${o} data series`)}e=this.parse(e),this.structure=this.parseComponents(e),this.hooks.run("afterRender",{config:this.config,data:this.data,stats:this.stats,structure:this.structure})}parse(t){let{layoutChart:e}=t,i=new y("defs");return this.defs.forEach(o=>{i.appendChild(o)}),e.appendChild(i),t}parseComponents(t){let{body:e,top:i,layoutChart:o}=t;if(this.config.title&&this.config.title.enabled&&i.appendChild(this.title.render()),this.config.legend&&this.config.legend.enabled){let s=new y("chart-legend");s.appendChild(this.legend.render(null,null,this.constructor.type)),e.appendChild(s),this.interactions.push(kt)}if(this.config.tooltip&&this.config.tooltip.enabled){this.tooltip=new N({stats:this.stats,data:this.data,config:this.config,type:this.constructor.type}).render(),o.appendChild(this.tooltip.tooltip);let s=this.tooltipLocation;typeof s=="function"&&(this.interactions.push(Ct),this.interactions.push(s)),this.interactions.push(St)}return this.interactions.push($t),t}compile(t,e){return this._styleElement&&t.removeChild(this._styleElement),this._styleElement=this.compileStyles(),t.prependChild(this._styleElement),xt(t)}compileHTML(t,{prerendered:e}={}){let i=t.wrap,o=t.root,s={...i.options};o.options["aria-label"]&&i.setAttribute("aria-label",o.options["aria-label"]),o.options["aria-describedby"]&&i.setAttribute("aria-describedby",o.options["aria-describedby"]),i.setAttribute("role",o.options.role||"figure"),e&&i.setAttribute("data-prerendered",""),this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),this._htmlStyleElement=this.compileStyles(),i.prependChild(this._htmlStyleElement);let n=t.layoutChart,l=t.plotarea,c=this.tooltip?.tooltip,r=this.tooltip?.htmlTooltip;c&&r&&l&&(n.removeChild(c),n.appendChild(r.crosshair),l.appendChild(r.tooltipBox));let u=xt(i);return i.options=s,this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),c&&r&&l&&(n.removeChild(r.crosshair),l.removeChild(r.tooltipBox),n.appendChild(c)),u}compileStyles(){let t=new y("style"),e=this.constructor.type!=="pie"?this.data.length:Object.keys(this.data).length,i=this.stylesheet.convertconfig(this.config,e,this._scopeId)+this.stylesheet.sheet;return t.innerHTML=`@layer charts { ${i} }`,t}createGraph({stretch:t}){return t?new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",viewBox:"0, 0, 100, 100",preserveAspectRatio:"none",xmlns:"http://www.w3.org/2000/svg",class:["plot"]}):new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plot-top"]})}createBackground(){return new y("rect",{width:"100%",height:"100%",x:"0%",y:"0%",class:["container"]})}createPlotArea({config:t}){return new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]})}};var ot=class{type;stats;stroke;width;constructor(t){Object.assign(this,t)}render(){let{type:t,stats:e,stroke:i,width:o}=this,{min:s,max:n}=e[t],l=Math.abs(n-s),r=Math.abs(s)/l*100;return t==="x"?new y("line",{class:["baseline","baseline-x"],x1:r.toFixed(3)+"%",y1:"0%",x2:r.toFixed(3)+"%",y2:"100%",stroke:i,"stroke-width":o}):new y("line",{class:["baseline","baseline-y"],x1:"0%",y1:(100-r).toFixed(3)+"%",x2:"100%",y2:(100-r).toFixed(3)+"%",stroke:i,"stroke-width":o})}};function zt({config:a}){let t=a.scale.minFontSize,e=a.scale.maxItems,i="";i+=`
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
    }`;let s={0:2,250:4,600:6,800:10,1e3:e},n=Object.keys(s);n.forEach((c,r)=>{let u,h=Math.floor(e/s[c]),d=parseInt(c),p=parseInt(n[r+1])-1;if(r===0)u=`
        @container chart-canvas (max-width: ${p}px) {
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
      `;else{let g=parseFloat((100/(h+1)).toFixed(2));u=`
        @container chart-canvas (min-width: ${d}px) and (max-width: ${p}px) {
          .svc-scale-label-x:nth-child(${h}n + 1),
          .svc-guides-x:nth-child(${h}n),
          .svc-ticks-x:nth-child(${h}n + 1) {
            opacity: 1;
          }
          .svc-scale-label-x {
            width: calc(${g}% - 5px);
            max-width: calc(${g}%);
          }
        }
      `}i+=u});let l=Object.keys(s);return l.forEach((c,r)=>{let u,h=Math.floor(e/s[c]),d=parseInt(c),p=parseInt(l[r+1])-1;r===0?u=`
        @media(max-height: ${p}px) {
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
        @media(min-height: ${d}px) and (max-height: ${p}px) {
          .svc-scale-label-y:nth-child(${h}n + 1),
          .svc-guides-y:nth-child(${h}n + 1),
          .svc-ticks-y:nth-child(${h}n + 1) {
            opacity: 1;
          }
        }
      `,i+=u}),i}function Lt(a,t,e){if(!Array.isArray(a)||a.length===0)throw new Error('SVC: "data" must be a non-empty array of series objects.');for(let u=0;u<a.length;u++)if(!a[u]||a[u].values==null)throw new Error(`SVC: data[${u}] must have a "values" property.`);if(e!=="scatter"&&e!=="bubble")for(let u=0;u<a.length;u++){let h=a[u].values,d=Array.isArray(h)?h:Object.values(h);for(let p=0;p<d.length;p++)if(d[p]!=null&&typeof d[p]!="number")throw new Error(`SVC: data[${u}].values contains non-numeric value "${d[p]}" at position ${p}.`)}let i={min:1/0,max:-1/0,ticks:4,scale:0},o={min:1/0,max:-1/0,ticks:6,scale:0},s={min:1/0,max:-1/0},n=!1,l=-1/0;if(e==="scatter"||e==="bubble")Object.assign(i,ht(a,"x")),Object.assign(o,ht(a,"y")),e==="bubble"&&Object.assign(s,ht(a,"size"));else if(Array.isArray(a[0].values)){let u=a.reduce((d,p)=>d.concat(p.values),[]).sort((d,p)=>d-p);if(t.plot&&t.plot.stacked){let d=Math.max(...a.map(f=>f.values.length)),p=0,g=0;for(let f=0;f<d;f++){let m=0,b=0;a.forEach(v=>{let x=v.values[f]||0;x>=0?m+=x:b+=x}),p=Math.max(p,m),g=Math.min(g,b)}o.min=g,o.max=p}else o.min=u[0],o.max=u[u.length-1];let h=a[0].values.length;a.forEach((d,p)=>{d.values.length!==h&&console.warn(`SVC: Series ${p} has ${d.values.length} values, but series 0 has ${h}. Mismatched lengths may cause unexpected results.`),l=d.values.length>l?d.values.length:l}),i.min=0,i.max=l}else{n=!0;let u=a.reduce((d,p)=>d.concat(Object.keys(p.values).map(g=>p.values[g])),[]).sort((d,p)=>d-p),h={};if(a.forEach(d=>{Object.assign(h,d.values)}),h=Object.keys(h),t.scale.sorted&&h.sort(),t.plot&&t.plot.stacked){let d=0,p=0;h.forEach(g=>{let f=0,m=0;a.forEach(b=>{let v=b.values[g]||0;v>=0?f+=v:m+=v}),d=Math.max(d,f),p=Math.min(p,m)}),o.min=p,o.max=d}else o.min=u[0],o.max=u[u.length-1];i.keys=h,i.min=0,i.max=l=h.length}let c=e==="scatter"||e==="bubble";Object.assign(o,Et(o,{forceZeroMin:!c})),c?Object.assign(i,Et(i,{forceZeroMin:!1})):e==="bar"||e==="column"?(l>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.floor(l/(i.ticks-1))):(i.ticks=l,i.step=1),i.scaleLength=l,i.scaleFactor=A(100/l)):(l>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.ceil(l/(i.ticks-1))):(i.ticks=l,i.step=1),i.scaleLength=l,i.scaleFactor=A(100/Math.max(l-1,1)));let r=t.plot.vertical;return{associative:n,x:r?i:o,y:r?o:i,alt:s}}function Et({max:a,min:t,ticks:e},{forceZeroMin:i=!0}={}){let o=a-t||1;t=Math.floor(t-Math.abs(o*.1)),a=Math.ceil(a+Math.abs(o*.1)),i&&(t=t>0?0:t);let s=a-t;if(s<=0)return{min:t,max:t+1,step:1,scaleLength:1,scaleFactor:100,ticks:2};let n=Rt(s,e);t=Math.floor(t/n)*n,a=Math.ceil(a/n)*n;let l=a-t;e=Math.round(l/n)+1;let c=100/l;return{min:t,max:a,step:n,scaleLength:l,scaleFactor:c,ticks:e}}function Rt(a,t){let e=a/t,i=Math.pow(10,Math.floor(Math.log10(e))),o=e/i,s;return o<=1.5?s=1:o<=3.5?s=2.5:o<=7.5?s=5:s=10,s*i}function ht(a,t){let e;switch(t){case"x":e=0;break;case"y":e=1;break;case"size":e=2;break}let i=a.map(o=>o.values.map(s=>s[e])).reduce((o,s)=>o.concat(s)).sort((o,s)=>o-s);return{min:i[0],max:i[i.length-1]}}var Mt=new Map;function st(a,t){Mt.set(a,t)}function At(a,t){let e=Mt.get(a);if(!e)throw new Error(`SVC: Unknown scale type "${a}". Registered types: ${[...Mt.keys()].join(", ")}`);return new e(t)}var ut=class{type;config;stats;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:l,step:c}=i[t];for(let r=0;r<l;r++){let u=A(r*c*i[t].scaleFactor);if(u>100)continue;o.ticks.push(B(t,u));let h=U(t,r,l,u,e);h&&o.guides.push(h);let d;t==="x"?d=`${s+r*c}`:d=`${n-r*c}`,d=D(d,t,e),o.labels.push(V(t,u,d))}return o}};function B(a,t){return a==="x"?new y("line",{x1:t+"%",y1:"0%",x2:t+"%",y2:"100%",class:["ticks","ticks-x"]}):new y("line",{x1:"0%",y1:t+"%",x2:"100%",y2:t+"%",class:["ticks","ticks-y"]})}function U(a,t,e,i,o){if(a==="x"){if(t!==0&&o.guides.x.enabled)return new y("line",{x1:i+"%",y1:"100%",x2:i+"%",y2:"0%",class:["guides","guides-x"]})}else if(t!==e-1&&o.guides.y.enabled)return new y("line",{x1:"0%",y1:i+"%",x2:"100%",y2:i+"%",class:["guides","guides-y"]});return null}function V(a,t,e){let i=a==="x"?"left":"top",o=new y("div",{style:`${i}: ${t}%`,class:["scale-label",`scale-label-${a}`]});return o.textContent=e,o}function D(a,t,e){if(t==="x"&&vt(e,"scale.label.x.format"))try{return e.scale.label.x.format(a)}catch(i){console.warn("SVC: scale.label.x.format threw an error:",i)}else if(t==="y"&&vt(e,"scale.label.y.format"))try{return e.scale.label.y.format(a)}catch(i){console.warn("SVC: scale.label.y.format threw an error:",i)}return a}var ft=class{type;config;stats;chartType;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{ticks:s,step:n,max:l}=i[t],c=this.chartType,r=c==="bar"||c==="column",u=t==="x"&&e.plot.vertical||t==="y"&&!e.plot.vertical;for(let h=0;h<s;h++){let d,p;if(r&&u){let m=i[t].scaleFactor/2,b=s<=1?0:h/(s-1);p=Math.floor((i[t].scaleLength-1)*b),p===i[t].scaleLength&&p--,d=A(p*i[t].scaleFactor+m)}else d=A(h*n*i[t].scaleFactor);if(d>100)continue;o.ticks.push(B(t,d));let g=U(t,h,s,d,e);g&&o.guides.push(g);let f;if(t==="x"&&e.plot.vertical){let m=p??Math.round(h*(i.x.keys.length-1)/Math.max(s-1,1));f=`${i.x.keys[m]}`}else if(t==="y"&&!e.plot.vertical){let m=p??Math.round(h*(i.y.keys.length-1)/Math.max(s-1,1));f=`${i.y.keys[m]}`}else f=t==="x"?`${h*n}`:`${l-h*n}`;f=D(f,t,e),o.labels.push(V(t,d,f))}return o}};var mt=class{type;config;stats;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n}=i[t],l=Math.max(s,1),c=Math.floor(Math.log10(l)),u=Math.ceil(Math.log10(Math.max(n,1)))-c;if(u<=0)return o;let h=u+1;for(let d=0;d<h;d++){let p=c+d,g=Math.pow(10,p),f=A(d/u*100);if(f>100)continue;let m=t==="y"?A(100-f):f;o.ticks.push(B(t,m));let b=U(t,d,h,m,e);b&&o.guides.push(b);let v=ee(g);v=D(v,t,e),o.labels.push(V(t,m,v))}return o}};function ee(a){return a>=1e6?a/1e6+"M":a>=1e3?a/1e3+"K":String(a)}var gt=class{type;config;stats;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:l}=i[t],c=Bt(s),u=Bt(n)-c;if(u<=0||!Number.isFinite(u))return o;let h=ie(u),d=Math.min(l,12);for(let p=0;p<d;p++){let g=p/Math.max(d-1,1),f=A(g*100),m=c+u*g;if(f>100)continue;o.ticks.push(B(t,f));let b=U(t,p,d,f,e);b&&o.guides.push(b);let v=h(new Date(m));v=D(v,t,e),o.labels.push(V(t,f,v))}return o}};function Bt(a){return typeof a=="number"?a:new Date(a).getTime()}function ie(a){return a<864e5?o=>o.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"}):a<2592e6?o=>o.toLocaleDateString(void 0,{month:"short",day:"numeric"}):a<31536e6*2?o=>o.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):o=>o.toLocaleDateString(void 0,{year:"numeric"})}st("linear",ut);st("category",ft);st("log",mt);st("time",gt);var j=class extends Q{static get defaults(){let t={width:120,height:120};return{l:{},plot:{vertical:!0},axis:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},label:{x:{enabled:!0,text:"Scale-X"},y:{enabled:!0,text:"Scale-Y"}},style:{stroke:"var(--chart-axis-color, #444)","stroke-width":.3,"vector-effect":"non-scaling-stroke"}},baseline:{x:{},y:{},style:{stroke:"var(--chart-baseline-color, #888)","stroke-width":1}},ticks:{x:{enabled:!0},y:{enabled:!0},style:{"stroke-width":"1",stroke:"var(--chart-tick-color, #DDD)"}},guides:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},style:{stroke:"var(--chart-grid-color, #e4e4e4)","stroke-dasharray":"0, 0","stroke-width":1,"stroke-linecap":"round"}},scale:{sorted:!1,minFontSize:5,maxItems:15,label:{style:{"text-align":"center"}}}}}getName(){return super.getName()}parse(t){t=super.parse(t);let e=this.data,i=this.stylesheet,o=this.config,{layoutChart:s,layoutXAxis:n,layoutYAxis:l,layoutOriginLeft:c,layoutOriginCenter:r,layoutOriginRight:u,layoutYTicks:h,layoutXTicks:d,layoutXAxisLabel:p,layoutYAxisLabel:g}=t,f=this.stats=Lt(e,this.config,this.constructor.type);this.data=e,this.hooks.run("beforeRender",{config:o,data:e,stats:f,structure:t}),["x","y"].forEach(S=>{let E=oe(S,f,o),L=At(E,{type:S,config:o,stats:f,data:e,chartType:this.constructor.type}).render();Object.keys(L).forEach(M=>{if(M==="labels")L[M].forEach(T=>{S==="x"?n.appendChild(T):l.appendChild(T)});else if(M==="ticks")S==="x"&&o.ticks.x.enabled?L[M].forEach(T=>{d.appendChild(T)}):S==="y"&&o.ticks.y.enabled&&L[M].forEach(T=>{h.appendChild(T)});else{let T=new y("g",{class:[S+"-"+M]});L[M].forEach(_=>{T.appendChild(_)}),s.appendChild(T)}})});let m=[];if(o.axis.x.enabled&&s.appendChild(this.createAxis({type:"x"})),o.axis.label.x.enabled){let S=`svc-axis-x-label-${this._scopeId}`,E=new y("div",{class:["l-axis-label-text-x"],id:S,role:"note"});E.innerHTML=`<span class="svc-axis-label-x">${$(o.axis.label.x.text)}</span>`,p.appendChild(E),m.push(S)}if(o.axis.y.enabled&&s.appendChild(this.createAxis({type:"y"})),o.axis.label.y.enabled){let S=`svc-axis-y-label-${this._scopeId}`,E=new y("div",{class:["l-axis-y-label-text"],id:S,role:"note"});E.innerHTML=`<span class="svc-axis-label-y">${$(o.axis.label.y.text)}</span>`,g.appendChild(E),m.push(S)}m.length>0&&t.root.setAttribute("aria-describedby",m.join(" "));let b=new y("div",{class:["axis-y-label-dummy"]});b.innerHTML="0",c.appendChild(b),g.appendChild(b);let v=new y("div",{style:"height: 1%; min-height:10px;"});r.appendChild(v);let x=new y("div",{class:["origin-label","scale-label"]});if(f.associative&&!o.plot.vertical){let S=f.y.keys,E=0;S.forEach(L=>{E=L.length>E?L.length:E}),x.innerHTML=new Array(E+1).join("0")}else x.innerHTML=f.y.max;r.appendChild(x),l.appendChild(x),u.setAttrs({style:"width: 1%;"}),f.y.min<0&&s.appendChild(new ot({type:"y",stats:f,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render()),f.x.min<0&&s.appendChild(new ot({type:"x",stats:f,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render());let w=this.createGraph({stretch:!0});s.appendChild(w);let C=this.createGraph({stretch:!1});s.appendChild(C),this.createPlot({data:e,stats:f,subchartStretch:w,subchartNoStretch:C});let k=new y("style");return k.innerHTML=".plot {opacity: 1;} .svc-loading {opacity:0;}",s.appendChild(k),i.addRaw(zt({stats:f,config:o})),t}createScript(){return new N({stats:this.stats,data:this.data,config:this.config}).render()}createAxis({type:t}){return t==="x"?new y("line",{x1:"0%",x2:"100%",y1:"100%",y2:"100%",class:["axis","axis-x"]}):new y("line",{x1:"0%",x2:"0%",y1:"0%",y2:"100%",class:["axis","axis-y"]})}};function oe(a,t,e){return e.scale?.[a]?.type?e.scale[a].type:t.associative?"category":"linear"}var H=class extends j{static get type(){return"line"}static get defaults(){return{plot:{style:{fill:"none","vector-effect":"non-scaling-stroke"},node:{type:"open",size:4,style:{"stroke-width":"0.2%","stroke-linecap":"round"},active:{style:{"stroke-width":"0.5%","stroke-linecap":"round"}}}}}}static specs(t){let e={plot:{stroke:"primary"},"plot.node.active":{fill:"secondary",stroke:"secondary"}};return t.plot.node.enabled&&(e["plot.node"]={stroke:"primary"},t.plot.node.type=="closed"?e["plot.node"].fill="primary":e["plot.node"].fill="#FFF"),e}getPlotClass(t){return["plot",`plot-${t}`]}createPlotLine(t){let e=this.stats,i=[],o=.2,s=1,n=0,l=0,c=0,r,u,h=null;for(let d=0;d<t.length;d++){if(t[d]==null){h=null,l=0,c=0;continue}let p={x:A((d-e.x.min)*e.x.scaleFactor),y:A((e.y.max-t[d])*e.y.scaleFactor)};if(!h){i.push(`M ${p.x} ${p.y}`),h=p;continue}let g=null;for(let x=d+1;x<t.length;x++)if(t[x]!=null){g={x:A((x-e.x.min)*e.x.scaleFactor),y:A((e.y.max-t[x])*e.y.scaleFactor)};break}g?(n=(g.y-h.y)/(g.x-h.x),r=(g.x-p.x)*-o,u=r*n*s):r=u=0;let f=A(h.x-l),m=A(h.y-c),b=A(p.x+r),v=A(p.y+u);i.push(`C ${f} ${m}, ${b} ${v}, ${p.x} ${p.y}`),l=r,c=u,h=p}return i}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){this.stats=e,t.forEach((s,n)=>{let l=Array.isArray(s.values)?s.values:e.x.keys.map(h=>s.values[h]??null),c={class:this.getPlotClass(n),plot:n};this.constructor.type==="line"&&(c.fill="none");let r=new y("path",c);i.appendChild(r);let u=this.createPlotLine(l);r.setAttribute("d",u.join(" ")),l.forEach((h,d)=>{if(h!=null){if(this.config.plot.node.enabled){let p=A((d-e.x.min)*e.x.scaleFactor)+"%",g=A((e.y.max-h)*e.y.scaleFactor)+"%",f=s.name||`Series ${n+1}`,m=e.associative&&e.x.keys&&e.x.keys[d]||d,b=new y("circle",{cx:p,cy:g,r:this.config.plot.node.size,class:["plot-node",`plot-node-${n}`],node:d,plot:n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f}, ${m}: ${h}`});o.appendChild(b)}if(this.config.plot.node.label.enabled){let p=new y("text",{x:A((d-e.x.min)*e.x.scaleFactor)+"%",y:A((e.y.max-h)*e.y.scaleFactor)+"%",fill:"black",class:["plot-node-label",`plot-node-label-${n}`]});p.innerHTML=h,o.appendChild(p)}}})})}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},l=1,c="",r=i.stats,h=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-h.left)/h.width,p=Math.floor(d*r.x.scaleLength),g=0,f=0,m=i.data,b=r.associative?r.x.keys[p]:p;m.forEach(function(C){let k=r.associative?C.values[b]:C.values[p];k!=null&&(g+=k,f++)});let v=(r.y.max-g/f)*r.y.scaleFactor;isNaN(v)&&(v=r.y.max*r.y.scaleFactor);let x=r.x.scaleFactor*p,w=Number(v.toFixed(2));return isNaN(x)||isNaN(w)||p<0||p>=r.x.scaleLength?null:(n.crosshair.x1=x,n.crosshair.x2=x,n.crosshair.y1=0,n.crosshair.y2=100,n.tooltip.x=x+l,n.tooltip.y=w,m.forEach(function(C,k){let S=$(C.name?C.name:"Series "+k),E=r.associative?i.data[k].values[b]:i.data[k].values[p],L=r.associative?b:p,M;if(i.config.tooltip.format)try{M=$(String(i.config.tooltip.format(L,E)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),M=`(${$(String(L))} : ${$(String(E))})`}else M=`(${$(String(L))} : ${$(String(E))})`;t.toggles[k]!==!1&&(c+=`<div class="svc-tooltip-content">
            <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> :
            ${M}
          </div>`)}),n.tooltip.text=c,n.index=p,n)}}};var nt=class extends H{static get type(){return"area"}static get defaults(){return{plot:{area:{style:{"fill-opacity":"var(--area-fill-opacity, 0.5)","stroke-width":"2%","stroke-linecap":"round"}},node:{enabled:!1,size:4,active:{style:{"stroke-width":"0.5%"}}}}}}static specs(){return{plot:{stroke:"primary"},"plot.area":{fill:"primary",stroke:"secondary"}}}getPlotClass(t){return["plot",`plot-${t}`,"plot-area",`plot-area-${t}`]}createPlotLine(t){let e=super.createPlotLine(t),i=this.stats,o=t.find(c=>c!=null);if(o==null)return e;let s=A((t.length-1-i.x.min)*i.x.scaleFactor),n=A(i.y.max*i.y.scaleFactor),l=A((i.y.max-o)*i.y.scaleFactor);return e.push(`L ${s} ${n} L 0 ${n} L 0 ${l}`),e}};var q=class extends j{static get type(){return"column"}static get defaults(){return{plot:{vertical:!0,stacked:!1,spacing:10,label:{enabled:!1,format:null}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s,n,l=this.config.plot.spacing/100,c=e.y.scaleFactor,r=e.x.scaleFactor;e.plot={},this.config.plot.vertical?(s=e.y.min,n=e.y.max,e.plot.vertical=!0):(s=e.x.min,n=e.x.max,e.plot.vertical=!1),e.plot.barSpacing=this.config.plot.spacing/100;let u=Math.abs(n-s),d=Math.abs(s)/u*100;if(this.config.plot.stacked){this._createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:r,scaleY:c,barSpacing:l,originPoint:d});return}if(Array.isArray(t[0].values))if(this.config.plot.vertical){let p=r/t.length,g=p*(1-l*2);t.forEach((f,m)=>{f.type!=="line"&&f.values.forEach((b,v)=>{let x;b>0?x=(e.y.max-b)*c+"%":x=(100-d).toFixed(3)+"%";let w=r*v;w+=p*m,w+=p*l,i.appendChild(new y("rect",{class:["plot",`plot-${m}`,`plot-node-${m}`],index:v,plot:m,"data-series":m,"data-index":v,"data-value":b,height:Math.abs(b)*c,x:w+"%",width:g+"%",y:x,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f.name||"Series "+(m+1)}, ${v}: ${b}`}))})})}else{let p=c/t.length,g=p*(1-l*2);t.forEach((f,m)=>{f.type!=="line"&&f.values.forEach((b,v)=>{let x,w=Math.abs(b)*r;b>0?x=d.toFixed(3)+"%":x=Number(d.toFixed(3))-w+"%";let C=100-c*(v+1);C+=p*m,C+=p*l,i.appendChild(new y("rect",{class:["plot",`plot-${m}`,`plot-node-${m}`],index:v,plot:m,"data-series":m,"data-index":v,"data-value":b,y:C+"%",width:w+"%",height:g+"%",x,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f.name||"Series "+(m+1)}, ${v}: ${b}`}))})})}else if(this.config.plot.vertical){let p=r/t.length,g=p*(1-l*2);e.x.keys.forEach((f,m)=>{t.forEach((b,v)=>{if(b.type!=="line"&&b.values[f]!=null){let x,w=b.values[f];w>0?x=(e.y.max-w)*c+"%":x=(100-d).toFixed(3)+"%";let C=r*m;C+=p*v,C+=p*l,i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:m,plot:v,"data-series":v,"data-key":f,"data-value":w,height:Math.abs(w)*c,x:C+"%",width:g+"%",y:x,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${b.name||"Series "+(v+1)}, ${f}: ${w}`}))}})})}else{let p=c/t.length,g=p*(1-l*2);e.y.keys.slice().reverse().forEach((m,b)=>{t.forEach((v,x)=>{if(v.type!=="line"&&v.values[m]!=null){let w=v.values[m],C,k=Math.abs(w)*r;w>0?C=d.toFixed(3)+"%":C=Number(d.toFixed(3))-k+"%";let S=100-c*(b+1);S+=p*x,S+=p*l,i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:b,plot:x,"data-series":x,"data-key":m,"data-value":w,y:S+"%",width:k+"%",height:g+"%",x:C,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${v.name||"Series "+(x+1)}, ${m}: ${w}`}))}})})}this._renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}),this.config.plot.label.enabled&&this._renderDataLabels({data:t,stats:e,subchartNoStretch:o,scaleX:r,scaleY:c,barSpacing:l})}_renderDataLabels({data:t,stats:e,subchartNoStretch:i,scaleX:o,scaleY:s,barSpacing:n}){if(!i)return;let l=!Array.isArray(t[0].values),c=this.config.plot.vertical,r=this.config.plot.label.format,u=t.filter(h=>h.type!=="line").length;t.forEach((h,d)=>{if(h.type==="line")return;let p=l?(c?e.x.keys:e.y.keys).map(g=>({key:g,value:h.values[g]})):h.values.map((g,f)=>({key:f,value:g}));p.forEach(({key:g,value:f},m)=>{if(f==null)return;let b=r?r(f,g):String(f);if(c){let v=o,x=v/u,w=v*m+x*d+x/2+x*n,C=(e.y.max-f)*s,k=new y("text",{x:w+"%",y:C-1+"%","text-anchor":"middle",class:["plot-node-label",`plot-node-label-${d}`]});k.textContent=b,i.appendChild(k)}else{let v=s,x=v/u,w=p.length-1-m,C=100-v*(w+1)+x*d+x/2,k=Math.abs(f)*o,S=new y("text",{x:k+1+"%",y:C+"%","alignment-baseline":"middle",class:["plot-node-label",`plot-node-label-${d}`]});S.textContent=b,i.appendChild(S)}})})}_renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s=!Array.isArray(t[0].values),n=this.config.plot.vertical,l=e.x.scaleFactor,c=e.y.scaleFactor;t.forEach((r,u)=>{if(r.type!=="line")return;let h=n?e.x.keys:e.y.keys,d=s?h.map(m=>r.values[m]??null):r.values,p=[],g=!1;for(let m=0;m<d.length;m++){if(d[m]==null){g=!1;continue}let b=n?m*l+l/2:(e.y.max-d[m])*c,v=n?(e.y.max-d[m])*c:100-(m*c+c/2);g?p.push(`L ${b.toFixed(2)} ${v.toFixed(2)}`):p.push(`M ${b.toFixed(2)} ${v.toFixed(2)}`),g=!0}if(p.length===0)return;let f=new y("path",{d:p.join(" "),fill:"none",class:["plot",`plot-${u}`],style:"vector-effect: non-scaling-stroke"});if(i.appendChild(f),o)for(let m=0;m<d.length;m++){if(d[m]==null)continue;let b=n?m*l+l/2+"%":(e.y.max-d[m])*c+"%",v=n?(e.y.max-d[m])*c+"%":100-(m*c+c/2)+"%",x=s&&h?h[m]:m,w=r.name||"Series "+(u+1);o.appendChild(new y("circle",{cx:b,cy:v,r:4,class:["plot-node",`plot-node-${u}`],node:m,plot:u,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${w}, ${x}: ${d[m]}`}))}})}_createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:o,scaleY:s,barSpacing:n,originPoint:l}){let c=!Array.isArray(t[0].values),r=this.config.plot.vertical,u=r?o:s,h=u,d=h*(1-n*2),p=c?r?e.x.keys:e.y.keys:Array.from({length:Math.max(...t.map(g=>g.values.length))},(g,f)=>f);p.forEach((g,f)=>{let m=0,b=0;t.forEach((v,x)=>{if(v.type==="line")return;let w=v.values[g];if(w==null)return;let C=Math.abs(w)*(r?s:o),k=v.name||"Series "+(x+1);if(r){let S;w>=0?(m+=w,S=(e.y.max-m)*s):(S=(e.y.max-b)*s,b+=w);let E=u*f+h*n;i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:f,plot:x,"data-series":x,"data-key":c?g:void 0,"data-index":c?void 0:f,"data-value":w,x:E+"%",y:S+"%",width:d+"%",height:C+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}else{let S;w>=0?(S=l+m*o,m+=w):(b+=w,S=l+b*o);let E=p.length-1-f,L=100-u*(E+1)+h*n;i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:f,plot:x,"data-series":x,"data-key":c?g:void 0,"data-index":c?void 0:f,"data-value":w,x:S+"%",y:L+"%",width:C+"%",height:d+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}})})}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},l=1,c="",r=i.stats,h=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-h.left)/h.width,p=Math.floor(d*r.x.scaleLength),g=0,f=0,m=i.data,b;r.associative&&(b=r.x.keys[p]),m.forEach(function(C){r.associative&&C.values[b]!=null?(g+=C.values[b],f++):!r.associative&&C.values[p]!=null&&(g+=C.values[p],f++)});let v=(r.y.max-g/f)*r.y.scaleFactor;isNaN(v)&&(v=r.y.max*r.y.scaleFactor);let x=r.x.scaleFactor*p+r.x.scaleFactor/2,w=Number(v.toFixed(2));return isNaN(x)||isNaN(w)||p<0||p>=r.x.scaleLength?null:(r.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=x+l,n.tooltip.y=w,m.forEach(function(C,k){let S=$(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let E=r.associative?i.data[k].values[b]:i.data[k].values[p],L=r.associative?b:p,M;if(i.config.tooltip.format)try{M=$(String(i.config.tooltip.format(L,E)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),M=`(${$(String(L))} : ${$(String(E))})`}else M=`(${$(String(L))} : ${$(String(E))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${M}
          </div>`}}),n.tooltip.text=c,n.index=p,n)}}};var J=class extends q{static get type(){return"bar"}static get defaults(){return{plot:{vertical:!1}}}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},l=1,c="",r=i.stats,h=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientY-h.top)/h.height;r.associative&&(d=1-d);let p=r.y.scaleLength-1-Math.floor(d*r.y.scaleLength),g=0,f=0,m=i.data,b;r.associative&&(i.config.plot.vertical?b=r.x.keys[p]:b=r.y.keys[p]),m.forEach(function(C){r.associative&&C.values[b]!=null?(g+=C.values[b],f++):!r.associative&&C.values[p]!=null&&(g+=C.values[p],f++)});let v=g/f*r.x.scaleFactor;isNaN(v)&&(v=r.x.max*r.x.scaleFactor);let x=Number(v.toFixed(2)),w=100*Number(d.toFixed(2));return isNaN(x)||isNaN(w)||p<0||p>=r.x.scaleLength?null:(r.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=x+l,n.tooltip.y=w+l,m.forEach(function(C,k){let S=$(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let E,L=r.associative?i.data[k].values[b]:i.data[k].values[p],M=r.associative?b:p;if(i.config.tooltip.format)try{E=$(String(i.config.tooltip.format(M,L)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),E=`(${$(String(M))} : ${$(String(L))})`}else E=`(${$(String(M))} : ${$(String(L))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${E}
          </div>`}}),n.tooltip.text=c,n.index=p,n)}}};var Y=class extends j{static get type(){return"scatter"}static get defaults(){return{plot:{size:4}}}static specs(){return{"plot.node":{fill:"primary"}}}tooltipLocation(t,e,i){return function(s){t.nodeMap||(t.nodeMap=re(e));let n={tooltip:{},crosshair:{}},l=1,c="",u=e.querySelector("chart-plot").getBoundingClientRect(),h=(s.clientX-u.left)/u.width,d=(s.clientY-u.top)/u.height;h=Math.floor(h*100),d=Math.floor(d*100);let p=Math.floor(h/10),g=parseInt((h/10).toFixed(1).split(".")[1]),f=Math.floor(d/10),m=null,b=[[0,0],[-1,0],[1,0],[0,-1],[0,1]];for(let v=0;v<b.length;v++){let x=f+b[v][0],w=p+b[v][1];if(x>=0&&x<10&&w>=0&&w<10&&t.nodeMap[x]&&t.nodeMap[x][w]){let C=t.nodeMap[x][w][g];if(!C){for(let k=Math.max(0,g-1);k<=Math.min(9,g+1);k++)if(t.nodeMap[x][w][k]){C=t.nodeMap[x][w][k];break}}if(C){m=C;break}}}if(m)return n.crosshair.x1=-1,n.crosshair.x2=-1,n.crosshair.y1=-1,n.crosshair.y2=-1,n.tooltip.x=h+l,n.tooltip.y=d,m.forEach(v=>{let x=v.getAttribute("data-series"),w=v.getAttribute("data-index"),C=i.data[x].values[w],k=$(i.data[x].name||"Series "+x),S;if(i.config.tooltip.format)try{S=$(String(i.config.tooltip.format(k,C)))}catch(E){console.warn("SVC: tooltip.format threw an error:",E),S=$(String(C))}else S=$(String(C));c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${x}">${k}</span> : (${S})
        </div>`}),n.tooltip.text=c,n}}createPlot({data:t,stats:e,subchartNoStretch:i}){t.forEach((o,s)=>{o.values.forEach((l,c)=>{let r=l[0],u=l[1],h=o.name||`Series ${s+1}`,d=new y("circle",{cx:((r-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-u)*e.y.scaleFactor).toFixed(3)+"%",r:this.config.plot.size,class:["plot-node",`plot-${s}`,`plot-node-${s}`],"data-index":c,"data-series":s,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${h}, (${r}, ${u})`});i.appendChild(d)})})}};function re(a){let t=Array.from(new Array(10)).map(()=>Array.from(new Array(10)).map(()=>[]));return a.querySelectorAll(".svc-plot-node").forEach(e=>{let i=parseInt(e.getAttribute("data-series")||"0",10),o=parseInt(e.getAttribute("cx")||"0"),s=parseInt(e.getAttribute("cy")||"0"),n=Math.min(9,Math.floor(o/10)),l=parseInt((o/10).toFixed(1).split(".")[1]),c=Math.min(9,Math.floor(s/10));t[c][n][l]=t[c][n][l]||[],t[c][n][l][i]=e}),t}var rt=class extends Y{static get type(){return"bubble"}static get defaults(){return{plot:{maxSize:4,node:{}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){t.forEach((s,n)=>{s.values.forEach((c,r)=>{let u=c[0],h=c[1],d=c[2],p=s.name||`Series ${n+1}`,g=e.alt.max-e.alt.min||1,f=(Math.abs(d)-e.alt.min)/g,m=new y("circle",{cx:((u-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-h)*e.y.scaleFactor).toFixed(3)+"%",r:f*this.config.plot.maxSize+.5+"%",style:`opacity: ${.7}`,class:["plot-node",`plot-${n}`,`plot-node-${n}`],"data-index":r,"data-series":n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${p}, (${u}, ${h}), size: ${d}`});o.appendChild(m)})})}};var G=class extends Q{static get type(){return"pie"}static get defaults(){return{plot:{ring:!1,node:{label:{enabled:!0,placement:"auto",scaleBySize:!0,limitBySize:!0,multiplier:1,threshold:12,style:{"font-size":"clamp(8px, 0.6vmin, 16px)"}}}},center:{size:"40%",style:{fill:"#fff"},label:{style:{"font-size":"5vmin",transform:"translate(0%, -50%)","text-align":"center"},container:{style:{display:"flex","justify-content":"center","align-items":"center"}},title:{style:{"font-size":"7vmin"}}}}}}static specs(){return{plot:{fill:"primary"},"plot.node":{fill:"primary"}}}parse(t){t=super.parse(t);let{layoutChart:e}=t,i=this.createGraph({stretch:!0});e.appendChild(i);let o=this.createGraph({stretch:!1});e.appendChild(o),this.createPlot({layoutChart:e,subchartStretch:i,subchartNoStretch:o}),o.appendChild(new y("g"));let s=new y("style");return s.innerHTML=".plot {opacity: 1;}.svc-loading {opacity:0;}",e.appendChild(s),t}createScript(){return new N({stats:this.stats,data:this.data,config:this.config}).render()}createPlot({layoutChart:t,subchartStretch:e,subchartNoStretch:i}){let o=this.data;if(!R(o))throw new Error('SVC: Pie chart "data" must be a plain object with numeric values, e.g. { "Apples": 30, "Oranges": 70 }.');Object.keys(o).forEach(u=>{if(typeof o[u]!="number")throw new Error(`SVC: Pie chart value for "${u}" must be a number.`);if(o[u]<0)throw new Error(`SVC: Pie chart value for "${u}" is negative (${o[u]}). Pie charts require non-negative values.`)});let s=Object.keys(o).reduce((u,h)=>u+=o[h],0);if(s===0){let u=new y("text",{x:"50%",y:"50%","text-anchor":"middle","alignment-baseline":"middle",class:["loading"]});u.textContent="No data",i.appendChild(u);return}let n=0,l=0,c=this.config.plot.node.instances.map(u=>u.fill);Object.keys(o).forEach((u,h)=>{let d=o[u],p=d/s,g=n/s,f=c[l%c.length],m=this.calculateSlice(p,g),b=this.createSlice(m,f,h,d,s,u);i.appendChild(b),l++,n+=d});let r=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]});if(this.config.plot.ring){let h=(parseFloat(this.config.center.size)||40)/2;r.appendChild(new y("circle",{cx:"50",cy:"50",r:String(h),fill:"var(--color-surface, #fff)",class:["center"]}))}i.appendChild(r)}calculateSlice(t,e){let o=Math.cos((e+t)*2*Math.PI)*50+50,s=Math.sin((e+t)*2*Math.PI)*50+50,n=Math.cos(e*2*Math.PI)*50+50,l=Math.sin(e*2*Math.PI)*50+50,c=e*360,r=t*360+c,u=(r+c)/2,h=50+50*Math.cos(u*2*Math.PI/360),d=50+50*Math.sin(u*2*Math.PI/360);h=(h+50)*.5,d=(d+50)*.5;let p=r-c;return{radius:50,degrees:u,degreeLength:p,start:{x:o,y:s},end:{x:n,y:l},center:{x:h,y:d}}}createSlice(t,e,i,o,s,n){let{radius:l,start:c,end:r,center:u,degreeLength:h}=t,d=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]}),p=h>180?1:0,g=`M ${l} ${l}`,f=`L${c.x} ${c.y}`,m=`A ${l} ${l} 0 ${p} 0 ${r.x} ${r.y}`,b=(o/s*100).toFixed(0);if(d.appendChild(new y("path",{fill:e,style:"vector-effect: non-scaling-stroke",d:`${g} ${f} ${m} Z`,"alignment-baseline":"middle","text-anchor":"middle","data-key":n,"data-value":o,tabindex:"0",class:["plot-node",`plot-node-${i}`],role:"graphics-symbol","aria-roledescription":"slice","aria-label":`${n}: ${b}%`})),this.config.plot.node.label.enabled){let{multiplier:v,threshold:x,limitBySize:w,scaleBySize:C,placement:k}=this.config.plot.node.label,S=h<=x;if(k==="outside"||k==="auto"&&S){let L=t.degrees*Math.PI/180,M=55,T=62,_=50+48*Math.cos(L),Z=50+48*Math.sin(L),P=50+M*Math.cos(L),O=50+M*Math.sin(L),I=50+T*Math.cos(L),at=50+T*Math.sin(L),Gt=Math.cos(L)>=0?"start":"end";d.appendChild(new y("line",{x1:_.toFixed(1),y1:Z.toFixed(1),x2:P.toFixed(1),y2:O.toFixed(1),stroke:"var(--chart-label-color, #737373)","stroke-width":"0.5",class:["plot-leader"]}));let Ft=new y("text",{fill:"var(--chart-label-color, #737373)",x:I.toFixed(1),y:at.toFixed(1),"alignment-baseline":"middle","text-anchor":Gt,style:"font-size: 0.35em;",class:["plot-node-label",`plot-node-label-${i}`]});Ft.innerHTML=`${$(n)} ${b}%`,d.appendChild(Ft)}else if(!this.config.plot.ring){let L;C&&(L=.37*v*(h/100));let M=new y("text",{fill:"#fff",x:u.x,y:u.y,style:C?`font-size: ${A(L)}em;`:"","alignment-baseline":"middle","text-anchor":"middle",class:w&&h>x||!w?["plot-node-label"]:["plot-node-label","hide"]});M.innerHTML=b+"%",d.appendChild(M)}}return d}tooltipLocation(t,e,i){return function(s){let n=e.querySelector("chart-plot");if(!n)return null;let l=n.getBoundingClientRect(),c=n.querySelector(".svc-nodeGroup"),r=c?c.getBoundingClientRect():l,u=r.left+r.width/2,h=r.top+r.height/2,d=s.clientX-u,p=s.clientY-h,g=Math.min(r.width,r.height)/2,f=Math.sqrt(d*d+p*p);if(f>g)return null;if(i.config.plot.ring){let O=parseFloat(i.config.center.size)||40,I=g*(O/100);if(f<I)return null}let m=Math.atan2(p,d);m<0&&(m+=2*Math.PI);let b=m/(2*Math.PI),v=(s.clientX-l.left)/l.width*100,x=(s.clientY-l.top)/l.height*100,w=i.data,C=Object.keys(w),k=C.reduce(function(O,I){return O+(w[I]||0)},0);if(k===0)return null;let S=0,E=null,L=0,M=0;for(let O=0;O<C.length;O++){let I=w[C[O]]||0,at=I/k;if(b>=S&&b<S+at){E=C[O],L=I,M=O;break}S+=at}if(!E)return null;let T=(L/k*100).toFixed(1),_={tooltip:{},crosshair:{x1:-10,x2:-10,y1:-10,y2:-10}};_.tooltip.x=v,_.tooltip.y=x;let Z=$(String(E)),P;if(i.config.tooltip&&i.config.tooltip.format)try{P=$(String(i.config.tooltip.format(E,L)))}catch(O){console.warn("SVC: tooltip.format threw an error:",O),P=Z+": "+T+"%"}else P=Z+": "+T+"%";return _.tooltip.text='<div class="svc-tooltip-content"><span class="svc-tooltip-label-title svc-tooltip-label-title-'+M+'">'+Z+"</span> : "+P+"</div>",_.index=M,_}}};var lt=class extends G{static get type(){return"pie"}static get defaults(){return{plot:{ring:!0}}}};var Co=window.matchMedia("(prefers-reduced-motion: reduce)");var Ut=new Map;function Vt(a,t,e={}){let i=e.priority??10,o={impl:t,bundle:e.bundle,contract:e.contract,priority:i},s=Ut.get(a);if(customElements.get(a)){if(!s||s.priority>=i){s&&s.priority===i&&s.impl!==t&&console.warn(`[VB Bundle] Tag <${a}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${a}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=i){s.priority===i&&console.warn(`[VB Bundle] Tag <${a}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}Ut.set(a,o),customElements.define(a,t)}var yt=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,o){t.addEventListener(e,i,o),this.#t.push(()=>t.removeEventListener(e,i,o))}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let i=this.#e.states;try{e?i.add(t):i.delete(t)}catch{let o=`--${t}`;e?i.add(o):i.delete(o)}}_adoptInternals(t){this.#e||(this.#e=t)}};var ae=0;function Dt(a,t,e="vb-vt"){if(!a?.isConnected||typeof document>"u"||!("startViewTransition"in document)||matchMedia("(prefers-reduced-motion: reduce)").matches)return t(),null;let i=`${e}-${++ae}`;a.style.viewTransitionName=i;let o=document.startViewTransition(t);return o.finished.finally(()=>{a.style.viewTransitionName===i&&(a.style.viewTransitionName="")}),o}function Tt(a){let t=a.textContent.trim();if(!t)return null;let e=t.replace(/[$€£¥,% ]/g,""),i=Number(e);return Number.isFinite(i)?i:null}function ce(a){let t=[...a.cells],e=-1,i=[];for(let o=0;o<t.length;o++){let s=t[o];if(!s.hasAttribute("data-chart-ignore")){if(s.hasAttribute("data-chart-label")||s.getAttribute("scope")==="row"){e=o;continue}(s.hasAttribute("data-chart-series")||!s.hasAttribute("data-chart-ignore"))&&i.push({index:o,name:s.textContent.trim()})}}if(e===-1&&t.length>0){let o=t[0];if(!o.textContent.trim()||o.tagName==="TH"){e=0;let s=i.findIndex(n=>n.index===0);s!==-1&&i.splice(s,1)}}return{labelIndex:e,columns:i}}function de(a){let t=a.querySelector("thead"),e=a.querySelector("tbody")||a,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")];if(!i||o.length===0)return{data:[],config:{}};let{labelIndex:s,columns:n}=ce(i),l=s!==-1,c=n.map(h=>({name:h.name,values:l?{}:[]}));for(let h of o){let d=[...h.cells],p=l?d[s]?.textContent.trim()||"":null;for(let g=0;g<n.length;g++){let f=d[n[g].index],m=f?Tt(f):null;l&&p?c[g].values[p]=m??0:c[g].values.push(m??0)}}let r={},u=a.querySelector("caption");return u&&(r.title={text:u.textContent.trim(),enabled:!0}),{data:c,config:r}}function pe(a){let e=[...(a.querySelector("tbody")||a).querySelectorAll("tr")],i={};for(let n of e){let l=[...n.cells],c=n.querySelector("th"),r=c?c.textContent.trim():l[0]?.textContent.trim(),u=c?l[1]||l[0]:l[1],h=u?Tt(u):null;r&&h!=null&&(i[r]=h)}let o={},s=a.querySelector("caption");return s&&(o.title={text:s.textContent.trim(),enabled:!0}),{data:i,config:o}}function he(a){let t=a.querySelector("thead"),e=a.querySelector("tbody")||a,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")],s=new Map;for(let r of o){let u=[...r.cells],h=r.querySelector("th"),d=h?h.textContent.trim():"Data",p=h?[...r.querySelectorAll("td")]:u.slice(1);s.has(d)||s.set(d,[]);let g=p.map(f=>Tt(f)).filter(f=>f!=null);g.length>=2&&s.get(d).push(g)}let n=[...s.entries()].map(([r,u])=>({name:r,values:u})),l={},c=a.querySelector("caption");return c&&(l.title={text:c.textContent.trim(),enabled:!0}),{data:n,config:l}}function Ht(a,t){if(!a||!a.querySelector("tbody, tr"))return{data:null,config:{}};let e=(t||"").toLowerCase();return e==="pie"||e==="ring"?pe(a):e==="scatter"||e==="bubble"?he(a):de(a)}function qt(a){let t={};return a.hasAttribute("data-tooltip")&&(t.tooltip={enabled:!0}),a.hasAttribute("data-legend")&&(t.legend={enabled:!0}),a.hasAttribute("data-grid")&&(t.guides={x:{enabled:!0},y:{enabled:!0}}),a.hasAttribute("data-labels")&&(t.plot={node:{label:{enabled:!0}}}),t}function ue(a){let t=getComputedStyle(a),e=[];for(let i=1;i<=6;i++){let o=t.getPropertyValue(`--chart-series-${i}`).trim();o&&e.push(o)}return e.length>0?e:null}function F(a,t){return a.getPropertyValue(t).trim()||null}function Ot(a){let t=getComputedStyle(a),e={},i=F(t,"--chart-label-color"),o=F(t,"--chart-font-family");(i||o)&&(e.style={},i&&(e.style.color=i),o&&(e.style["font-family"]=o));let s=F(t,"--chart-axis-color");s&&(e.axis={style:{stroke:s}});let n=F(t,"--chart-grid-color");n&&(e.guides={style:{stroke:n}});let l=F(t,"--chart-baseline-color");l&&(e.baseline={style:{stroke:l}});let c=F(t,"--chart-tick-color");c&&(e.ticks={style:{stroke:c}});let r=F(t,"--chart-title-color"),u=F(t,"--chart-title-size");(r||u)&&(e.title=e.title||{},e.title.style={},r&&(e.title.style.color=r),u&&(e.title.style["font-size"]=u));let h=F(t,"--chart-subtitle-color"),d=F(t,"--chart-subtitle-size");(h||d)&&(e.title=e.title||{},e.title.subtitle=e.title.subtitle||{},e.title.subtitle.style={},h&&(e.title.subtitle.style.color=h),d&&(e.title.subtitle.style["font-size"]=d));let p=F(t,"--chart-tooltip-bg"),g=F(t,"--chart-tooltip-color"),f=F(t,"--chart-tooltip-shadow");(p||g||f)&&(e.tooltip=e.tooltip||{},e.tooltip.label=e.tooltip.label||{},e.tooltip.label.style={},p&&(e.tooltip.label.style["background-color"]=p),g&&(e.tooltip.label.style.color=g),f&&(e.tooltip.label.style["box-shadow"]=f));let m=ue(a);return m&&(e.palette=m),e}function Yt(a){return{name:"vb-theme-bridge",hooks:{configResolved({config:t}){let e=Ot(a);e.style&&(t.style=Object.assign({},e.style,t.style)),e.palette&&!t._paletteFromUser&&(t.palette=e.palette)}}}}var fe={line:H,area:nt,bar:J,column:q,pie:G,ring:lt,scatter:Y,bubble:rt};function X(a,t=null){if(a==null)return t;if(typeof a!="string")return a;try{return JSON.parse(a)}catch{return t}}function K(a,t){if(!t||typeof t!="object"||Array.isArray(t))return a;for(let e of Object.keys(t))t[e]&&typeof t[e]=="object"&&!Array.isArray(t[e])?((!a[e]||typeof a[e]!="object")&&(a[e]={}),K(a[e],t[e])):a[e]=t[e];return a}var _t=class extends yt{static get observedAttributes(){return["data-type","data-values","data-config","data-title","data-subtitle","data-legend","data-tooltip","data-palette","data-label-x","data-label-y","data-size"]}#t=null;#e=null;#s=null;#r=!1;#i=null;#o=null;set data(t){this.#t!==t&&(this.#t=t,this.#n(),this.#l("property"))}get data(){return this.#t}set config(t){this.#e!==t&&(this.#e=t,this.#n(),this.#l("property"))}get config(){return this.#e}#l(t){this.dispatchEvent(new CustomEvent("chart-wc:data-changed",{detail:{data:this.#t,config:this.#e,source:t},bubbles:!0}))}refresh(){this.#n()}toSVG(){return this.#i?.querySelector("svg")?.outerHTML||null}setup(){this.#n()}teardown(){this.#a()}attributeChangedCallback(){this.hasAttribute("data-upgraded")&&this.#n()}#n(){!this.isConnected||this.#r||(this.#r=!0,Promise.resolve().then(()=>{this.#r=!1,this.isConnected&&this.#f()}))}#c(){let t=(this.dataset.type||"").toLowerCase();return t||(t=(this.querySelector("table")?.dataset.type||"bar").toLowerCase()),fe[t]||J}#d(){if(this.#t!=null)return{data:X(this.#t,null),tableConfig:{}};let t=this.dataset.values;if(t!=null)return{data:X(t,null),tableConfig:{}};let e=this.querySelector('script[type="application/json"]');if(e)return{data:X(e.textContent,null),tableConfig:{}};let i=this.querySelector("template[data-chart-data]");if(i){let s=i.content?.textContent||i.innerHTML;return{data:X(s,null),tableConfig:{}}}let o=this.querySelector("table");if(o){let s=(this.dataset.type||o.dataset.type||"bar").toLowerCase(),{data:n,config:l}=Ht(o,s),c=qt(o),r=K(K({},l),c);return{data:n,tableConfig:r}}return null}#p(t={}){let e=Ot(this),i=X(this.#e,{})||{},o=X(this.dataset.config,{})||{},s={};s=K(s,e),s=K(s,t),s=K(s,i),s=K(s,o);let n=this.dataset.labelX,l=this.dataset.labelY;if(s.axis=s.axis||{},s.axis.label=s.axis.label||{},n!=null?s.axis.label.x={text:n,enabled:!0}:s.axis.label.x?.text||(s.axis.label.x=s.axis.label.x||{},s.axis.label.x.enabled=!1),l!=null?s.axis.label.y={text:l,enabled:!0}:s.axis.label.y?.text||(s.axis.label.y=s.axis.label.y||{},s.axis.label.y.enabled=!1),s.plot?.node?.label?.scaleBySize||(s.plot=s.plot||{},s.plot.node=s.plot.node||{},s.plot.node.label=s.plot.node.label||{},s.plot.node.label.scaleBySize=!1),this.dataset.title!=null){let c={text:this.dataset.title,enabled:!0};this.dataset.subtitle!=null&&(c.subtitle=this.dataset.subtitle),s.title=c}if(this.dataset.legend!=null&&(s.legend={enabled:!0}),this.dataset.tooltip!=null&&(s.tooltip={enabled:!0}),this.dataset.palette!=null){let c=X(this.dataset.palette,null);c&&(s.palette=c)}return this.dataset.size==="sparkline"&&(s.axis=s.axis||{},s.axis.x={...s.axis.x||{},enabled:!1},s.axis.y={...s.axis.y||{},enabled:!1},s.axis.label=s.axis.label||{},s.axis.label.x={...s.axis.label.x||{},enabled:!1},s.axis.label.y={...s.axis.label.y||{},enabled:!1},s.ticks=s.ticks||{},s.ticks.x={...s.ticks.x||{},enabled:!1},s.ticks.y={...s.ticks.y||{},enabled:!1},s.guides=s.guides||{},s.guides.x={...s.guides.x||{},enabled:!1},s.guides.y={...s.guides.y||{},enabled:!1},s.title={enabled:!1},s.legend={enabled:!1},s.tooltip={enabled:!1}),s.plugins=s.plugins||[],s.plugins.push(Yt(this)),s}#h(){if(this.#o&&this.contains(this.#o))return;this.#o=document.createElement("div"),this.#o.setAttribute("data-chart-svg",""),this.#o.setAttribute("aria-hidden","true"),this.appendChild(this.#o);let t=this.#o.attachShadow({mode:"open"}),e=document.createElement("style");e.textContent=`
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
    `,t.appendChild(e),this.#i=document.createElement("div"),this.#i.style.cssText="width:100%;height:100%;overflow:visible;",t.appendChild(this.#i)}#u(t){if(!t)return;(this.dataset.chart||t.dataset.chart||"replace")==="replace"&&(t.classList.add("visually-hidden"),t.setAttribute("aria-hidden","false"))}#f(){let t=this.#c(),e=this.#d();if(!e||!e.data){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:"No chart data found"},bubbles:!0}));return}let{data:i,tableConfig:o}=e,s=this.#p(o),n=this.querySelector("table"),l=this.#s!=null,c=()=>{this.#a(),this.#u(n),this.#h(),this.#i&&this.#i.classList.toggle("sparkline",this.dataset.size==="sparkline");try{this.dispatchEvent(new CustomEvent("chart-wc:config-resolved",{detail:{type:this.dataset.type||n?.dataset.type||"bar",config:s},bubbles:!0}));let r=new t({config:s,data:i});this.#s=r,this.#i&&r.mount(this.#i),this.dispatchEvent(new CustomEvent("chart-wc:render",{detail:{type:this.dataset.type||n?.dataset.type||"bar",seriesCount:Array.isArray(i)?i.length:Object.keys(i).length},bubbles:!0}))}catch(r){let u=r instanceof Error?r.message:String(r);this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:u},bubbles:!0}))}};l?Dt(this,c,"chart-vt"):c()}#a(){this.#s&&(this.#s.destroy(),this.#s=null),this.#i&&(this.#i.innerHTML="")}};Vt("chart-wc",_t);export{_t as ChartWc};
//# sourceMappingURL=chart-wc.js.map
