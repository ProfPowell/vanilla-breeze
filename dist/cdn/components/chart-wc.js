function M(l){return String(l).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function lt(l){let t=M(String(l));return t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.+?)\*/g,"<em>$1</em>"),t=t.replace(/`(.+?)`/g,"<code>$1</code>"),t=t.replace(/\n/g,"<br>"),t}function z(l){if(!l||typeof l!="object"||Array.isArray(l))return!1;let t=Object.getPrototypeOf(l);return t===Object.prototype||t===null}function A(l){let t=l.toFixed(2);return parseFloat(t[t.length-1]==="0"?l.toFixed(1):t)}function ct(l){return t(l);function t(i){let o="";for(let s in i.options)if(Object.hasOwn(i.options,s)){let r=s,a=i.options[s];if(s==="class"){if(!Array.isArray(a))throw new Error("Wrong argument to class");a="",i.options[s].forEach(c=>{a+=(a===""?"":" ")+`svc-${c}`})}o+=(o===""?"":" ")+`${r}="${M(String(a))}"`}if(i.children.length>0){let s="";return i.children.forEach(function(r){s+=(o===""?"":" ")+t(r)}),`<${i.tagName}${e(o)}>${s}</${i.tagName}>`}else return typeof i.innerHTML<"u"?`<${i.tagName}${e(o)}>${i.innerHTML}</${i.tagName}>`:`<${i.tagName}${e(o)}></${i.tagName}>`}function e(i){return i===""?i:" "+i}}function G(l,t){return i(l,t);function e(o){return z(o)}function i(o,...s){if(!s.length)return o;let r=s.shift();if(e(o)&&e(r))for(let a in r)e(r[a])?(o[a]||Object.assign(o,{[a]:{}}),i(o[a],r[a])):Object.assign(o,{[a]:r[a]});return i(o,...s)}}function dt(l,t){let e=l,i=t.split(".");for(let o=0;o<i.length;o++)if(e=e[i[o]],!e)return!1;return!0}var pt=class{constructor(t="div",e={}){this.children=[],this.tagName=t,this.options={},Object.assign(this.options,e)}set textContent(t){this.innerHTML=M(t)}appendChild(t){this.children.push(t)}prependChild(t){this.children.unshift(t)}removeChild(t){let e=this.children.indexOf(t);e!==-1&&this.children.splice(e,1)}setAttrs(t){Object.assign(this.options,t)}setAttribute(t,e){this.options[t]=e}},y=pt;var be=0,ht=class l{constructor(t,...e){this.config=e.reduce((i,o)=>G(i,o),{}),this.palette=t||l.defaultPalette(),z(this.palette[0])||(this.palette=this.palette.map(i=>({primary:i,secondary:i}))),this.defs=this.createDefs(),G(this.config.l,l.layoutProperties())}static layoutProperties(){return{wrap:{style:{background:"var(--color-surface, #fff)"}},top:{style:{"justify-content":"center","align-items":"center","padding-block":"0.5em 2em","padding-inline":"0.2em"}},ticks:{x:{style:{height:"10px"}},y:{style:{width:"1%"}}}}}static defaultPalette(){return[{primary:"var(--chart-series-1, #3b82f6)",secondary:"var(--chart-series-1, #3b82f6)"},{primary:"var(--chart-series-2, #ef4444)",secondary:"var(--chart-series-2, #ef4444)"},{primary:"var(--chart-series-3, #8b5cf6)",secondary:"var(--chart-series-3, #8b5cf6)"},{primary:"var(--chart-series-4, #f59e0b)",secondary:"var(--chart-series-4, #f59e0b)"},{primary:"var(--chart-series-5, #10b981)",secondary:"var(--chart-series-5, #10b981)"}]}createDefs(){let t=[];return z(this.palette[0])&&z(this.palette[0].primary)&&this.palette.forEach((e,i)=>{Object.keys(e).forEach(o=>{let{url:s,def:r}=this.generateGradient(e[o],i,o);e[o]=`url(#${s})`,t.push(r)})}),t}generateGradient(t,e,i){let o=t.orientation||"vertical",s="svc-grad-"+e+"-"+i+"-"+be++,r=new y("linearGradient",{id:s,x1:"0%",y1:"0%",x2:o==="vertical"?"0%":"100%",y2:o==="vertical"?"100%":"0%"});return Object.keys(t).forEach(a=>{isNaN(parseInt(a))||r.appendChild(new y("stop",{offset:a+"%","stop-color":t[a]}))}),{url:s,def:r}}applyPalette(t){for(let i in t)if(Object.hasOwn(t,i)){let o=e(i,this.config);if(!o)continue;let s=t[i];o.instances||(o.instances=[]),this.palette.forEach((r,a)=>{let c={};for(let n in s)if(Object.hasOwn(s,n)){let u=s[n];Object.prototype.hasOwnProperty.call(r,u)?c[n]=r[u]:c[n]=u}o.instances[a]?Object.keys(c).forEach(n=>{typeof o.instances[a][n]>"u"&&(o.instances[a][n]=c[n])}):o.instances.push(c)})}function e(i,o){let s=i.split("."),r=o,a=!1;return s.forEach(c=>{r[c]?r=r[c]:a=!0}),a?null:r}}},it=ht;var ut=class{constructor(t){this.config=t}static get defaults(){return{l:{top:{breakpoint:{width:200,height:150}}},title:{enabled:!0,text:"Title",style:{"text-align":"center",width:"100%","font-weight":400,"font-size":"var(--chart-title-size, 1.4rem)",color:"var(--chart-title-color, #444)","text-anchor":"middle","alignment-baseline":"middle"},subtitle:{style:{"font-size":"var(--chart-subtitle-size, 0.9rem)",color:"var(--chart-subtitle-color, var(--chart-label-color, #737373))","font-weight":300}}}}}render(){let t=this.config.title,e=new y("div",{class:["title"]}),i=t.markdown!==!1&&xe(t.text),o=i?lt(t.text):M(t.text);return t.subtitle&&typeof t.subtitle=="string"?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${Qt(t.subtitle,i)}</div>`:t.subtitle&&t.subtitle.text?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${Qt(t.subtitle.text,i)}</div>`:e.innerHTML=o,e}};function xe(l){return/\*\*.+?\*\*|\*.+?\*|`.+?`|\n/.test(String(l))}function Qt(l,t){return t?lt(l):M(l)}var ft=ut;var ve=0,mt=class{constructor({config:t,data:e}){this.config=t,this.data=e}static get defaults(){return{l:{},legend:{breakpoint:{width:300,height:275},enabled:!0,style:{margin:0,padding:0,"flex-direction":"column","flex-wrap":"wrap","justify-content":"center","background-color":"var(--color-surface, rgba(255,255,255,0.8))","z-index":2},item:{style:{display:"flex","align-items":"center",padding:"0.5em",color:"var(--chart-label-color, #616161)","white-space":"nowrap"}}}}}render(t,e,i,o){return this.createLegend(i)}createLegend(t){let e=new y("ul",{class:["legend"]}),i=ve++;return(t!=="pie"?this.data.map((s,r)=>({name:s.name||"Series "+r,index:r})):Object.keys(this.data).map((s,r)=>({name:s,index:r}))).forEach(({name:s,index:r})=>{let a=this._getSeriesColor(r),c=new y("li",{class:["legend-item"]}),n=`legend-item-${r}-${i}`,u=new y("input",{type:"checkbox",id:n,"data-series":r,checked:"",style:`--_series-color: ${a}`});c.appendChild(u);let p=new y("label",{id:`legend-item-text-${r}-${i}`,for:n});p.textContent=s,c.appendChild(p),e.appendChild(c)}),e}_getSeriesColor(t){let e;return this.config.plot.instances&&this.config.plot.instances.length>0?e=this.config.plot.instances[t%this.config.plot.instances.length]:this.config.plot.node?.instances&&this.config.plot.node.instances.length>0&&(e=this.config.plot.node.instances[t%this.config.plot.node.instances.length]),e&&e.stroke?e.stroke:e&&e.fill?e.fill:"#777"}},gt=mt;var yt=class{constructor({stats:t,data:e,config:i,type:o}){this.data=e,this.config=i,this.type=o,o!=="pie"&&(this.min=t.y.min,this.max=t.y.max,this.stats=t)}static get defaults(){return{tooltip:{breakpoint:{width:275,height:275},enabled:!0,container:{style:{display:"flex"}},crosshair:{style:{"z-index":-1}},label:{style:{"background-color":"var(--chart-tooltip-bg, var(--color-surface, #fff))","box-shadow":"var(--chart-tooltip-shadow, 0 2px 4px rgba(0, 0, 0, 0.2))",color:"var(--chart-tooltip-color, var(--chart-label-color, #737373))",padding:"1em","z-index":2},title:{instances:[]}}}}}render(){return{tooltip:this.createDOM(),htmlTooltip:this._createHTMLTooltip()}}createDOM(){return this._createCartesianTooltip()}_createCartesianTooltip(){let t=new y("g",{id:"svc-tooltip-box",class:["tooltip","hide"]}),e=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"});return t.appendChild(e),t.appendChild(this._createTooltipForeignObject("svc-tooltip-label",["tooltip-label","hide"],{role:"tooltip","aria-live":"polite"})),t}_createRingTooltip(){let t=new y("g",{id:"svc-center-label-box",class:["tooltip","hide"]});return t.appendChild(this._createTooltipForeignObject("svc-center-label",["center-label"],{"aria-live":"polite"})),t}_createHTMLTooltip(){let t=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"}),e=new y("div",{id:"svc-tooltip-box",class:["tooltip","hide"],style:"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"}),i=new y("div",{class:["tooltip-container"],style:"position:absolute;pointer-events:auto;"}),o=new y("div",{id:"svc-tooltip-label",class:["tooltip-label","hide"],role:"tooltip","aria-live":"polite"});return i.appendChild(o),e.appendChild(i),{crosshair:t,tooltipBox:e}}_createTooltipForeignObject(t,e,i){let o=new y("foreignObject",{class:["tooltip-fo"],width:"100%",height:"100%"}),s=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});o.appendChild(s),s.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let r=new y("div",{class:["tooltip-container"]});s.appendChild(r);let a=new y("div",{id:t,class:e,...i});return r.appendChild(a),o}},j=yt;var we=`
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
`,Jt=we;var bt=class{constructor(){this.sheet=Jt,this.rules=[]}addRule(t,e){let i="";Object.keys(e).forEach(o=>{i+=`${o}: ${e[o]};`}),this.sheet+=`.svc-${t}{${i}}`}addRaw(t){this.sheet+=t}convertconfig(t,e,i){let o={width:{},height:{}},s=c(t),r=a(o);return s+r;function a(n){let u="";return Object.keys(n).forEach(p=>{Object.keys(n[p]).forEach(d=>{let h=n[p][d],g=`@media(max-${p}: ${d}px){`,f=h.map(m=>`.svc-${m}.svc-${m}`);g+=f.join(","),g+="{ display: none; }",g+="}",u+=g})}),u}function c(n,u="",p="",d=[]){for(let h in n)if(h==="style"){let g="";for(let f in n[h])Object.hasOwn(n[h],f)&&(g+=`${f}:${n[h][f]};`);if(d.length===0)p+=`figure[data-chart-id] {${g}}`;else{let f=d.reduce((m,b)=>m+=(m===""?"":"-")+b,"");p+=`.svc-${f}{${g}}`}}else if(h==="instances"){let g=n[h];for(let f=0;f<e;f++){let m=g[f];if(!m)continue;let b="";for(let x in m)Object.hasOwn(m,x)&&(b+=`${x}:${m[x]};`);if(b!==""){let x=d.reduce((w,C)=>w+=(w===""?"":"-")+C,""),v=i?`[data-chart-id="${i}"] `:"";p+=`${v}.svc-${x}-${f} {${b}}`}}}else if(h==="breakpoint"){let g=d.reduce((f,m)=>f+=(f===""?"":"-")+m,"");o.width[n.breakpoint.width]?o.width[n.breakpoint.width].push(g):o.width[n.breakpoint.width]=[g],o.height[n.breakpoint.height]?o.height[n.breakpoint.height].push(g):o.height[n.breakpoint.height]=[g]}else typeof n[h]=="object"&&(d.push(h),p=c(n[h],h,p,d),d.pop());return p}}},te=bt;function Ce({interactive:l=!1}={}){let t=new y("svg");t.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",role:l?"graphics-document":"img","aria-roledescription":"chart"});let e=new y("foreignObject",{width:"100%",height:"100%"});t.appendChild(e);let i=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});e.appendChild(i),i.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let o=new y("figure");i.appendChild(o);let s=new y("chart-title");o.appendChild(s);let r=new y("chart-body");o.appendChild(r);let a=new y("chart-canvas");r.appendChild(a);let c=new y("chart-label",{position:"y"});a.appendChild(c);let n=new y("chart-axis",{position:"y"});a.appendChild(n);let u=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-y"]});a.appendChild(u);let p=new y("chart-plot");a.appendChild(p);let d=new y("svg");d.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plotarea"]}),p.appendChild(d);let h=new y("div"),g=new y("div"),f=new y("div"),m=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-x"]});a.appendChild(m);let b=new y("chart-axis",{position:"x"});a.appendChild(b);let x=new y("chart-label",{position:"x"});a.appendChild(x),d.appendChild(new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]}));let v=new y("text",{x:"50%",y:"50%",class:["loading"]});return v.innerHTML="Loading Chart...",d.appendChild(v),{root:t,wrap:o,top:s,body:r,plotarea:p,layoutChart:d,layoutXAxis:b,layoutYTicks:u,layoutXTicks:m,layoutYAxis:n,layoutOriginRight:f,layoutOriginCenter:g,layoutXAxisLabel:x,layoutYAxisLabel:c,layoutOriginLeft:h}}var ee=Ce;var ke=new Set(["onInteraction","onResize","onClick"]),xt=class{#t=new Map;register(t,e){this.#t.has(t)||this.#t.set(t,new Set),this.#t.get(t).add(e)}unregister(t,e){let i=this.#t.get(t);i&&i.delete(e)}run(t,e){if(ke.has(t)&&typeof document>"u")return;let i=this.#t.get(t);if(i)for(let o of i)o(e)}registerPlugin(t){if(!(!t||!t.hooks))for(let[e,i]of Object.entries(t.hooks))this.register(e,i)}destroy(){this.#t.clear()}},ie=xt;function vt(l){return JSON.stringify(l).replace(/<\//g,"<\\/").replace(/]]>/g,"]]\\>").replace(/<!--/g,"<\\!--").replace(/<\?/g,"<\\?")}var wt=class{hooks=new ie;toFile(t={}){let e=c(t),i=`<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`,o=this.structure,{body:s}=o,r;e.includeScripts&&(r=this._createScripts(this.structure),s.appendChild(r));let a=this.compile(o.root);return e.includeScripts&&r&&s.removeChild(r),e.prerendered&&(a=a.slice(0,a.indexOf("svg")+3)+' data-prerendered=""'+a.slice(a.indexOf("svg")+3)),i+a;function c(n){if(typeof n=="object"&&n!==null){let u=!!n.prerendered,p=!u;return{prerendered:u,includeScripts:n.includeScripts??p}}return{prerendered:!!n,includeScripts:!0}}}toString(){return this.compile(this.structure.root)}toHTML({prerendered:t}={}){return this.compileHTML(this.structure,{prerendered:t})}async toBlob(t="image/svg+xml",{width:e=800,height:i=600}={}){if(typeof Blob>"u")throw new Error("SVC: toBlob() requires a browser environment.");let o=this.toString();if(t==="image/svg+xml")return new Blob([o],{type:"image/svg+xml"});if(t==="image/png"){if(typeof document>"u")throw new Error("SVC: PNG export requires a browser environment with Canvas.");return this._svgToPngBlob(o,e,i)}throw new Error(`SVC: Unsupported export type "${t}".`)}async toDataURL(t="image/svg+xml",e){if(typeof FileReader>"u")throw new Error("SVC: toDataURL() requires a browser environment with FileReader.");let i=await this.toBlob(t,e);return new Promise((o,s)=>{let r=new FileReader;r.onload=()=>o(r.result),r.onerror=s,r.readAsDataURL(i)})}async download(t="chart.svg",e){if(typeof document>"u")throw new Error("SVC: download() requires a browser environment.");let o=t.split(".").pop().toLowerCase()==="png"?"image/png":"image/svg+xml",s=await this.toBlob(o,e),r=URL.createObjectURL(s),a=document.createElement("a");a.href=r,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(r)}_svgToPngBlob(t,e,i){return new Promise((o,s)=>{let r=document.createElement("canvas");r.width=e,r.height=i;let a=r.getContext("2d"),c=new Image,n=new Blob([t],{type:"image/svg+xml"}),u=URL.createObjectURL(n);c.onload=()=>{a.drawImage(c,0,0,e,i),URL.revokeObjectURL(u),r.toBlob(p=>{p?o(p):s(new Error("SVC: PNG export failed."))},"image/png")},c.onerror=()=>{URL.revokeObjectURL(u),s(new Error("SVC: Failed to load SVG for PNG export."))},c.src=u})}mount(t){if(!t||typeof document>"u")return null;t.innerHTML=this.toHTML(),this._state=this.hydrate(t),this._container=t;let e=t.host||t;return this._observeResize(e),this._state}createElement(){if(typeof document>"u")return null;let t=document.createElement("div");return this.mount(t),t}hydrate(t){if(!t)return null;let e={functions:[]};return this.interactions.forEach(i=>{e.functions[i.name]=i(e,t,this)}),this._state=e,this._container=t,e}update({data:t,config:e}={}){if(!this._container)return null;let i=this._container;return this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._state=null,t!=null&&(this.data=t),e!=null&&(G(this.config,e),this.config=this.applyConfigToDefaults(this.config).config),this.interactions=[],this.render(),i.innerHTML=this.toString(),this._state=this.hydrate(i),this._container=i,this._state}destroy(){this.hooks.run("beforeDestroy",{container:this._container,state:this._state}),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._container&&(this._container.innerHTML=""),this._state=null,this._container=null,this.hooks.destroy()}_observeResize(t){typeof ResizeObserver>"u"||(this._resizeObserver=new ResizeObserver(e=>{let i=e[0];i&&this.hooks.run("onResize",{width:i.contentRect.width,height:i.contentRect.height,container:t})}),this._resizeObserver.observe(t))}_createScripts(t){let e=new y("script",{class:["chart-script"]}),i="",o=[];return this.interactions.forEach(s=>{i+=s.toString()+`
`,o.push(s.name)}),i+=`
    var chart = {
      stats: ${vt(this.stats||{})},
      data: ${vt(this.data)},
      config: ${vt(this.config)}
    };
    var svgRoot = document.currentScript.closest('svg');
    var state = { functions: []};`,o.forEach(s=>{i+=`state.functions['${s}'] = ${s}(state, svgRoot, chart);`}),e.innerHTML=`//<![CDATA[
`+i+`
//]]>`,e}},oe=wt;function Ct(l,t,e){var i=e.config&&e.config.tooltip&&e.config.tooltip.hideDelay||2e3,o=t.querySelector("chart-plot"),s=t.querySelector("#svc-tooltip-box"),r=t.querySelector("#svc-tooltip-label"),a=t.querySelector(".svc-tooltip-crosshair"),c=[],n=null,u=null;function p(){u=null}typeof window<"u"&&(window.addEventListener("scroll",p,{passive:!0}),window.addEventListener("resize",p,{passive:!0}));var d=null;typeof ResizeObserver<"u"&&(d=new ResizeObserver(p),d.observe(o));function h(){r.setAttribute("class","svc-tooltip-label svc-hide"),s.setAttribute("class","svc-tooltip svc-hide"),a.setAttribute("x1","-10%"),a.setAttribute("x2","-10%"),a.setAttribute("y1","-10%"),a.setAttribute("y2","-10%");for(var m=0;m<c.length;m++)c[m].classList.remove("svc-plot-node-active-"+m);c=[]}function g(){n&&clearTimeout(n),n=setTimeout(h,i)}o.addEventListener("mousedown",f),o.addEventListener("mousemove",f),l._tooltipCleanup=function(){n&&clearTimeout(n),o.removeEventListener("mousedown",f),o.removeEventListener("mousemove",f),typeof window<"u"&&(window.removeEventListener("scroll",p),window.removeEventListener("resize",p)),d&&(d.disconnect(),d=null)};function f(m){g();var b=l.functions.tooltipLocation(m,l,t,e);if(b){for(var x=t.querySelectorAll('.svc-plot-node[node="'+b.index+'"]'),v=0;v<c.length;v++)c[v].classList.remove("svc-plot-node-active-"+v);c=[];for(var w=0;w<x.length;w++)x[w].classList.add("svc-plot-node-active-"+w),c.push(x[w]);a.setAttribute("x1",b.crosshair.x1+"%"),a.setAttribute("x2",b.crosshair.x2+"%"),a.setAttribute("y1",b.crosshair.y1+"%"),a.setAttribute("y2",b.crosshair.y2+"%"),r.innerHTML=b.tooltip.text,r.setAttribute("class","svc-tooltip-label"),s.setAttribute("class","svc-tooltip"),u||(u=o.getBoundingClientRect());var C=u,k=r.getBoundingClientRect(),S=k.width/C.width*100,L=k.height/C.height*100,$=b.tooltip.x,E=b.tooltip.y,T=1;$+S>98&&($=$-S-T),$<0&&($=0),E+L>98&&(E=98-L),E<0&&(E=0);var O=s.querySelector("foreignObject");if(O)O.setAttribute("x",$+"%"),O.setAttribute("y",E+"%");else{var _=r.parentElement;_&&(_.style.left=$+"%",_.style.top=E+"%")}e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"tooltip",event:m,data:{index:b.index,tooltip:b.tooltip},element:s})}}}function kt(l,t,e){l.toggles=Array.from(t.querySelectorAll("chart-legend input")),l.toggles.forEach(function(i){i.removeAttribute("onclick"),i.addEventListener("click",function(o){var s=o.target.getAttribute("data-series");l.toggles[s]=o.target.checked;var r=l.toggles[s]!==!1,a=r?1:0,c=t.getElementsByClassName("svc-plot-"+s)[0];c&&(c.style.opacity=a);for(var n=t.getElementsByClassName("svc-plot-node-"+s),u=0;u<n.length;u++)n[u].style.opacity=a;e&&e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"legend-toggle",event:o,data:{series:s,visible:r},element:i})})})}function St(l,t,e){var i=t.querySelectorAll('[role="graphics-symbol"]');if(i.length===0)return;var o=-1,s=t.querySelector("chart-plot");if(!s)return;s.setAttribute("tabindex","0"),s.addEventListener("keydown",function(c){if(c.key==="ArrowRight"||c.key==="ArrowDown")c.preventDefault(),o=Math.min(o+1,i.length-1),r(o);else if(c.key==="ArrowLeft"||c.key==="ArrowUp")c.preventDefault(),o=Math.max(o-1,0),r(o);else if(c.key==="Escape"){a();var n=t.querySelector("#svc-tooltip-label");n&&n.classList.add("svc-hide"),o=-1}});function r(c){a();var n=i[c];if(n){n.classList.add("svc-focus");var u=n.getAttribute("aria-label"),p=t.querySelector("#svc-tooltip-label");p&&u&&(p.textContent=u,p.classList.remove("svc-hide"))}}function a(){for(var c=0;c<i.length;c++)i[c].classList.remove("svc-focus")}}function $t(l,t,e){var i=t.querySelector("chart-plot");if(!i)return;function o(r){var a=r.target.closest('[role="graphics-symbol"]');if(a){var c={type:"click",event:r,element:a,seriesIndex:parseInt(a.getAttribute("plot")||a.getAttribute("data-series")||"0",10),dataIndex:parseInt(a.getAttribute("node")||a.getAttribute("data-index")||a.getAttribute("index")||"0",10),key:a.getAttribute("data-key")||null,value:a.getAttribute("data-value")||null,label:a.getAttribute("aria-label")||""};e.hooks&&e.hooks.run&&e.hooks.run("onClick",c)}}i.addEventListener("click",o);var s=l._dataClickCleanup;l._dataClickCleanup=function(){s&&s(),i.removeEventListener("click",o)}}var Se=0,Et=class l extends oe{#t;#e;constructor({config:t={},data:e}){if(super({config:t,data:e}),e==null)throw new Error('SVC: "data" is required. Pass an array of series objects or a plain object for pie charts.');this.data=e,this.palette=t.palette=t.palette||it.defaultPalette();let i=this.applyConfigToDefaults(t);this.#e=i.defs,this.config=i.config,Array.isArray(this.config.plugins)&&this.config.plugins.forEach(o=>this.hooks.registerPlugin(o)),this.hooks.run("configResolved",{config:this.config,data:this.data,chartType:this.constructor.type}),this.#t=new te,this._scopeId="c"+Se++,this.interactions=[],this.structure=null,this.render()}get stylesheet(){return this.#t}get defs(){return this.#e}applyConfigToDefaults(t){let e=[],i=Object.getPrototypeOf(this);for(;i.constructor.name!=="Object";)i.constructor.defaults&&e.push(i.constructor.defaults),i=Object.getPrototypeOf(i);e=e.reverse();let o={legend:gt,tooltip:j};Object.keys(o).forEach(r=>{(!t[r]||t[r].enabled)&&e.push(o[r].defaults)}),t.title&&t.title.text&&e.push(ft.defaults);let s=new it(this.palette,...e,t);return s.applyPalette(l.specs()),s.applyPalette(this.constructor.specs(s.config)),s}static get defaults(){return{palette:it.defaultPalette(),style:{"font-family":"var(--chart-font-family, inherit)","font-weight":300,color:"var(--chart-label-color, #737373)"},legend:{enabled:!0},tooltip:{enabled:!0},plot:{node:{enabled:!0,instances:[],active:{instances:[]},label:{enabled:!1,instances:[]}},instances:[],style:{overflow:"visible"}},"plot-top":{style:{overflow:"visible"}},plotarea:{style:{fill:"var(--color-surface, #fff)",overflow:"visible"}},loading:{enabled:!0,style:{"font-size":"1.5em",fill:"var(--chart-label-color, #616161)","text-anchor":"middle"}}}}static specs(){return{"plot.node.label":{fill:"primary"},"tooltip.label.title":{color:"primary"}}}render(){this.config.title&&(this.title=new ft(this.config)),this.config.legend&&(this.legend=new gt({config:this.config,data:this.data,chart:this.chart}));let t=!!(this.config.tooltip?.enabled||this.config.legend?.enabled),e=ee({interactive:t});e.wrap.setAttribute("data-chart-id",this._scopeId);let i=this.constructor.type||"chart";if(this.config.title&&this.config.title.text){let o=M(this.config.title.text);e.root.setAttribute("aria-label",o);let s=new y("desc");s.innerHTML=`${i} chart: ${o}`,e.root.prependChild(s)}else{let o=Array.isArray(this.data)?this.data.length:Object.keys(this.data).length;e.root.setAttribute("aria-label",`${i} chart with ${o} data series`)}e=this.parse(e),this.structure=this.parseComponents(e),this.hooks.run("afterRender",{config:this.config,data:this.data,stats:this.stats,structure:this.structure})}parse(t){let{layoutChart:e}=t,i=new y("defs");return this.defs.forEach(o=>{i.appendChild(o)}),e.appendChild(i),t}parseComponents(t){let{body:e,top:i,layoutChart:o}=t;if(this.config.title&&this.config.title.enabled&&i.appendChild(this.title.render()),this.config.legend&&this.config.legend.enabled){let s=new y("chart-legend");s.appendChild(this.legend.render(null,null,this.constructor.type)),e.appendChild(s),this.interactions.push(kt)}return this.config.tooltip&&this.config.tooltip.enabled&&(this.tooltip=new j({stats:this.stats,data:this.data,config:this.config,type:this.constructor.type}).render(),o.appendChild(this.tooltip.tooltip),typeof this.tooltipLocation=="function"&&(this.interactions.push(Ct),this.interactions.push(this.tooltipLocation)),this.interactions.push(St)),this.interactions.push($t),t}compile(t,e){return this._styleElement&&t.removeChild(this._styleElement),this._styleElement=this.compileStyles(),t.prependChild(this._styleElement),ct(t)}compileHTML(t,{prerendered:e}={}){let i=t.wrap,o=t.root,s={...i.options};o.options["aria-label"]&&i.setAttribute("aria-label",o.options["aria-label"]),o.options["aria-describedby"]&&i.setAttribute("aria-describedby",o.options["aria-describedby"]),i.setAttribute("role",o.options.role||"figure"),e&&i.setAttribute("data-prerendered",""),this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),this._htmlStyleElement=this.compileStyles(),i.prependChild(this._htmlStyleElement);let r=t.layoutChart,a=t.plotarea,c=this.tooltip?.tooltip,n=this.tooltip?.htmlTooltip;c&&n&&a&&(r.removeChild(c),r.appendChild(n.crosshair),a.appendChild(n.tooltipBox));let u=ct(i);return i.options=s,this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),c&&n&&a&&(r.removeChild(n.crosshair),a.removeChild(n.tooltipBox),r.appendChild(c)),u}compileStyles(){let t=new y("style"),e=this.constructor.type!=="pie"?this.data.length:Object.keys(this.data).length,i=this.stylesheet.convertconfig(this.config,e,this._scopeId)+this.stylesheet.sheet;return t.innerHTML=`@layer charts { ${i} }`,t}createGraph({stretch:t}){return t?new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",viewBox:"0, 0, 100, 100",preserveAspectRatio:"none",xmlns:"http://www.w3.org/2000/svg",class:["plot"]}):new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plot-top"]})}createBackground(){return new y("rect",{width:"100%",height:"100%",x:"0%",y:"0%",class:["container"]})}createPlotArea({config:t}){return new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]})}},ot=Et;var Lt=class{constructor(t){Object.assign(this,t)}render(){let{type:t,stats:e,stroke:i,width:o}=this,{min:s,max:r}=e[t],a=Math.abs(r-s),n=Math.abs(s)/a*100;return t==="x"?new y("line",{class:["baseline","baseline-x"],x1:n.toFixed(3)+"%",y1:"0%",x2:n.toFixed(3)+"%",y2:"100%",stroke:i,"stroke-width":o}):new y("line",{class:["baseline","baseline-y"],x1:"0%",y1:(100-n).toFixed(3)+"%",x2:"100%",y2:(100-n).toFixed(3)+"%",stroke:i,"stroke-width":o})}},Mt=Lt;function $e({config:l}){let t=l.scale.minFontSize,e=l.scale.maxItems,i="";i+=`
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
    }`;let s={0:2,250:4,600:6,800:10,1e3:e},r=Object.keys(s);r.forEach((c,n)=>{let u,p=Math.floor(e/s[c]),d=parseInt(c),h=parseInt(r[n+1])-1;if(n===0)u=`
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
      `;else if(n===r.length-1)u=`
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
      `}i+=u});let a=Object.keys(s);return a.forEach((c,n)=>{let u,p=Math.floor(e/s[c]),d=parseInt(c),h=parseInt(a[n+1])-1;n===0?u=`
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
      `:n===a.length-1?u=`
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
      `,i+=u}),i}var se=$e;function Tt(l,t,e){if(!Array.isArray(l)||l.length===0)throw new Error('SVC: "data" must be a non-empty array of series objects.');for(let u=0;u<l.length;u++)if(!l[u]||l[u].values==null)throw new Error(`SVC: data[${u}] must have a "values" property.`);if(e!=="scatter"&&e!=="bubble")for(let u=0;u<l.length;u++){let p=l[u].values,d=Array.isArray(p)?p:Object.values(p);for(let h=0;h<d.length;h++)if(d[h]!=null&&typeof d[h]!="number")throw new Error(`SVC: data[${u}].values contains non-numeric value "${d[h]}" at position ${h}.`)}let i={min:1/0,max:-1/0,ticks:4,scale:0},o={min:1/0,max:-1/0,ticks:6,scale:0},s={min:1/0,max:-1/0},r=!1,a=-1/0;if(e==="scatter"||e==="bubble")Object.assign(i,st(l,"x")),Object.assign(o,st(l,"y")),e==="bubble"&&Object.assign(s,st(l,"size"));else if(Array.isArray(l[0].values)){let u=l.reduce((d,h)=>d.concat(h.values),[]).sort((d,h)=>d-h);if(t.plot&&t.plot.stacked){let d=Math.max(...l.map(f=>f.values.length)),h=0,g=0;for(let f=0;f<d;f++){let m=0,b=0;l.forEach(x=>{let v=x.values[f]||0;v>=0?m+=v:b+=v}),h=Math.max(h,m),g=Math.min(g,b)}o.min=g,o.max=h}else o.min=u[0],o.max=u[u.length-1];let p=l[0].values.length;l.forEach((d,h)=>{d.values.length!==p&&console.warn(`SVC: Series ${h} has ${d.values.length} values, but series 0 has ${p}. Mismatched lengths may cause unexpected results.`),a=d.values.length>a?d.values.length:a}),i.min=0,i.max=a}else{r=!0;let u=l.reduce((d,h)=>d.concat(Object.keys(h.values).map(g=>h.values[g])),[]).sort((d,h)=>d-h),p={};if(l.forEach(d=>{Object.assign(p,d.values)}),p=Object.keys(p),t.scale.sorted&&p.sort(),t.plot&&t.plot.stacked){let d=0,h=0;p.forEach(g=>{let f=0,m=0;l.forEach(b=>{let x=b.values[g]||0;x>=0?f+=x:m+=x}),d=Math.max(d,f),h=Math.min(h,m)}),o.min=h,o.max=d}else o.min=u[0],o.max=u[u.length-1];i.keys=p,i.min=0,i.max=a=p.length}let c=e==="scatter"||e==="bubble";Object.assign(o,At(o,{forceZeroMin:!c})),c?Object.assign(i,At(i,{forceZeroMin:!1})):e==="bar"||e==="column"?(a>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.floor(a/(i.ticks-1))):(i.ticks=a,i.step=1),i.scaleLength=a,i.scaleFactor=A(100/a)):(a>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.ceil(a/(i.ticks-1))):(i.ticks=a,i.step=1),i.scaleLength=a,i.scaleFactor=A(100/Math.max(a-1,1)));let n=t.plot.vertical;return{associative:r,x:n?i:o,y:n?o:i,alt:s}}function At({max:l,min:t,ticks:e},{forceZeroMin:i=!0}={}){let o=l-t||1;t=Math.floor(t-Math.abs(o*.1)),l=Math.ceil(l+Math.abs(o*.1)),i&&(t=t>0?0:t);let s=l-t;if(s<=0)return{min:t,max:t+1,step:1,scaleLength:1,scaleFactor:100,ticks:2};let r=ne(s,e);t=Math.floor(t/r)*r,l=Math.ceil(l/r)*r;let a=l-t;e=Math.round(a/r)+1;let c=100/a;return{min:t,max:l,step:r,scaleLength:a,scaleFactor:c,ticks:e}}function ne(l,t){let e=l/t,i=Math.pow(10,Math.floor(Math.log10(e))),o=e/i,s;return o<=1.5?s=1:o<=3.5?s=2.5:o<=7.5?s=5:s=10,s*i}function st(l,t){let e;switch(t){case"x":e=0;break;case"y":e=1;break;case"size":e=2;break}let i=l.map(o=>o.values.map(s=>s[e])).reduce((o,s)=>o.concat(s)).sort((o,s)=>o-s);return{min:i[0],max:i[i.length-1]}}var Ot=new Map;function X(l,t){Ot.set(l,t)}function _t(l,t){let e=Ot.get(l);if(!e)throw new Error(`SVC: Unknown scale type "${l}". Registered types: ${[...Ot.keys()].join(", ")}`);return new e(t)}var Ft=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:r,ticks:a,step:c}=i[t];for(let n=0;n<a;n++){let u=A(n*c*i[t].scaleFactor);if(u>100)continue;o.ticks.push(R(t,u));let p=B(t,n,a,u,e);p&&o.guides.push(p);let d;t==="x"?d=`${s+n*c}`:d=`${r-n*c}`,d=V(d,t,e),o.labels.push(U(t,u,d))}return o}};function R(l,t){return l==="x"?new y("line",{x1:t+"%",y1:"0%",x2:t+"%",y2:"100%",class:["ticks","ticks-x"]}):new y("line",{x1:"0%",y1:t+"%",x2:"100%",y2:t+"%",class:["ticks","ticks-y"]})}function B(l,t,e,i,o){if(l==="x"){if(t!==0&&o.guides.x.enabled)return new y("line",{x1:i+"%",y1:"100%",x2:i+"%",y2:"0%",class:["guides","guides-x"]})}else if(t!==e-1&&o.guides.y.enabled)return new y("line",{x1:"0%",y1:i+"%",x2:"100%",y2:i+"%",class:["guides","guides-y"]});return null}function U(l,t,e){let i=l==="x"?"left":"top",o=new y("div",{style:`${i}: ${t}%`,class:["scale-label",`scale-label-${l}`]});return o.textContent=e,o}function V(l,t,e){if(t==="x"&&dt(e,"scale.label.x.format"))try{return e.scale.label.x.format(l)}catch(i){console.warn("SVC: scale.label.x.format threw an error:",i)}else if(t==="y"&&dt(e,"scale.label.y.format"))try{return e.scale.label.y.format(l)}catch(i){console.warn("SVC: scale.label.y.format threw an error:",i)}return l}var ae=Ft;var Pt=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{ticks:s,step:r,max:a}=i[t],c=this.chartType,n=c==="bar"||c==="column",u=t==="x"&&e.plot.vertical||t==="y"&&!e.plot.vertical;for(let p=0;p<s;p++){let d,h;if(n&&u){let m=i[t].scaleFactor/2,b=s<=1?0:p/(s-1);h=Math.floor((i[t].scaleLength-1)*b),h===i[t].scaleLength&&h--,d=A(h*i[t].scaleFactor+m)}else d=A(p*r*i[t].scaleFactor);if(d>100)continue;o.ticks.push(R(t,d));let g=B(t,p,s,d,e);g&&o.guides.push(g);let f;if(t==="x"&&e.plot.vertical){let m=h??Math.round(p*(i.x.keys.length-1)/Math.max(s-1,1));f=`${i.x.keys[m]}`}else if(t==="y"&&!e.plot.vertical){let m=h??Math.round(p*(i.y.keys.length-1)/Math.max(s-1,1));f=`${i.y.keys[m]}`}else f=t==="x"?`${p*r}`:`${a-p*r}`;f=V(f,t,e),o.labels.push(U(t,d,f))}return o}},le=Pt;var It=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:r}=i[t],a=Math.max(s,1),c=Math.floor(Math.log10(a)),u=Math.ceil(Math.log10(Math.max(r,1)))-c;if(u<=0)return o;let p=u+1;for(let d=0;d<p;d++){let h=c+d,g=Math.pow(10,h),f=A(d/u*100);if(f>100)continue;let m=t==="y"?A(100-f):f;o.ticks.push(R(t,m));let b=B(t,d,p,m,e);b&&o.guides.push(b);let x=Me(g);x=V(x,t,e),o.labels.push(U(t,m,x))}return o}};function Me(l){return l>=1e6?l/1e6+"M":l>=1e3?l/1e3+"K":String(l)}var ce=It;var Nt=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:r,ticks:a}=i[t],c=de(s),u=de(r)-c;if(u<=0||!Number.isFinite(u))return o;let p=Ae(u),d=Math.min(a,12);for(let h=0;h<d;h++){let g=h/Math.max(d-1,1),f=A(g*100),m=c+u*g;if(f>100)continue;o.ticks.push(R(t,f));let b=B(t,h,d,f,e);b&&o.guides.push(b);let x=p(new Date(m));x=V(x,t,e),o.labels.push(U(t,f,x))}return o}};function de(l){return typeof l=="number"?l:new Date(l).getTime()}function Ae(l){return l<864e5?o=>o.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"}):l<2592e6?o=>o.toLocaleDateString(void 0,{month:"short",day:"numeric"}):l<31536e6*2?o=>o.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):o=>o.toLocaleDateString(void 0,{year:"numeric"})}var pe=Nt;X("linear",ae);X("category",le);X("log",ce);X("time",pe);var zt=class extends ot{static get defaults(){let t={width:120,height:120};return{l:{},plot:{vertical:!0},axis:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},label:{x:{enabled:!0,text:"Scale-X"},y:{enabled:!0,text:"Scale-Y"}},style:{stroke:"var(--chart-axis-color, #444)","stroke-width":.3,"vector-effect":"non-scaling-stroke"}},baseline:{x:{},y:{},style:{stroke:"var(--chart-baseline-color, #888)","stroke-width":1}},ticks:{x:{enabled:!0},y:{enabled:!0},style:{"stroke-width":"1",stroke:"var(--chart-tick-color, #DDD)"}},guides:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},style:{stroke:"var(--chart-grid-color, #e4e4e4)","stroke-dasharray":"0, 0","stroke-width":1,"stroke-linecap":"round"}},scale:{sorted:!1,minFontSize:5,maxItems:15,label:{style:{"text-align":"center"}}}}}getName(){return super.getName()}parse(t){t=super.parse(t);let e=this.data,i=this.stylesheet,o=this.config,{layoutChart:s,layoutXAxis:r,layoutYAxis:a,layoutOriginLeft:c,layoutOriginCenter:n,layoutOriginRight:u,layoutYTicks:p,layoutXTicks:d,layoutXAxisLabel:h,layoutYAxisLabel:g}=t,f=this.stats=Tt(e,this.config,this.constructor.type);this.data=e,this.hooks.run("beforeRender",{config:o,data:e,stats:f,structure:t}),["x","y"].forEach(S=>{let L=Te(S,f,o),$=_t(L,{type:S,config:o,stats:f,data:e,chartType:this.constructor.type}).render();Object.keys($).forEach(E=>{if(E==="labels")$[E].forEach(T=>{S==="x"?r.appendChild(T):a.appendChild(T)});else if(E==="ticks")S==="x"&&o.ticks.x.enabled?$[E].forEach(T=>{d.appendChild(T)}):S==="y"&&o.ticks.y.enabled&&$[E].forEach(T=>{p.appendChild(T)});else{let T=new y("g",{class:[S+"-"+E]});$[E].forEach(O=>{T.appendChild(O)}),s.appendChild(T)}})});let m=[];if(o.axis.x.enabled&&s.appendChild(this.createAxis({type:"x"})),o.axis.label.x.enabled){let S=`svc-axis-x-label-${this._scopeId}`,L=new y("div",{class:["l-axis-label-text-x"],id:S,role:"note"});L.innerHTML=`<span class="svc-axis-label-x">${M(o.axis.label.x.text)}</span>`,h.appendChild(L),m.push(S)}if(o.axis.y.enabled&&s.appendChild(this.createAxis({type:"y"})),o.axis.label.y.enabled){let S=`svc-axis-y-label-${this._scopeId}`,L=new y("div",{class:["l-axis-y-label-text"],id:S,role:"note"});L.innerHTML=`<span class="svc-axis-label-y">${M(o.axis.label.y.text)}</span>`,g.appendChild(L),m.push(S)}m.length>0&&t.root.setAttribute("aria-describedby",m.join(" "));let b=new y("div",{class:["axis-y-label-dummy"]});b.innerHTML="0",c.appendChild(b),g.appendChild(b);let x=new y("div",{style:"height: 1%; min-height:10px;"});n.appendChild(x);let v=new y("div",{class:["origin-label","scale-label"]});if(f.associative&&!o.plot.vertical){let S=f.y.keys,L=0;S.forEach($=>{L=$.length>L?$.length:L}),v.innerHTML=new Array(L+1).join("0")}else v.innerHTML=f.y.max;n.appendChild(v),a.appendChild(v),u.setAttrs({style:"width: 1%;"}),f.y.min<0&&s.appendChild(new Mt({type:"y",stats:f,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render()),f.x.min<0&&s.appendChild(new Mt({type:"x",stats:f,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render());let w=this.createGraph({stretch:!0});s.appendChild(w);let C=this.createGraph({stretch:!1});s.appendChild(C),this.createPlot({data:e,stats:f,subchartStretch:w,subchartNoStretch:C});let k=new y("style");return k.innerHTML=".plot {opacity: 1;} .svc-loading {opacity:0;}",s.appendChild(k),i.addRaw(se({stats:f,config:o})),t}createScript(){return new j({stats:this.stats,data:this.data,config:this.config}).render()}createAxis({type:t}){return t==="x"?new y("line",{x1:"0%",x2:"100%",y1:"100%",y2:"100%",class:["axis","axis-x"]}):new y("line",{x1:"0%",x2:"0%",y1:"0%",y2:"100%",class:["axis","axis-y"]})}};function Te(l,t,e){return e.scale?.[l]?.type?e.scale[l].type:t.associative?"category":"linear"}var q=zt;var jt=class extends q{static get type(){return"line"}static get defaults(){return{plot:{style:{fill:"none","vector-effect":"non-scaling-stroke"},node:{type:"open",size:4,style:{"stroke-width":"0.2%","stroke-linecap":"round"},active:{style:{"stroke-width":"0.5%","stroke-linecap":"round"}}}}}}static specs(t){let e={plot:{stroke:"primary"},"plot.node.active":{fill:"secondary",stroke:"secondary"}};return t.plot.node.enabled&&(e["plot.node"]={stroke:"primary"},t.plot.node.type=="closed"?e["plot.node"].fill="primary":e["plot.node"].fill="#FFF"),e}getPlotClass(t){return["plot",`plot-${t}`]}createPlotLine(t){let e=this.stats,i=[],o=.2,s=1,r=0,a=0,c=0,n,u,p=null;for(let d=0;d<t.length;d++){if(t[d]==null){p=null,a=0,c=0;continue}let h={x:A((d-e.x.min)*e.x.scaleFactor),y:A((e.y.max-t[d])*e.y.scaleFactor)};if(!p){i.push(`M ${h.x} ${h.y}`),p=h;continue}let g=null;for(let v=d+1;v<t.length;v++)if(t[v]!=null){g={x:A((v-e.x.min)*e.x.scaleFactor),y:A((e.y.max-t[v])*e.y.scaleFactor)};break}g?(r=(g.y-p.y)/(g.x-p.x),n=(g.x-h.x)*-o,u=n*r*s):n=u=0;let f=A(p.x-a),m=A(p.y-c),b=A(h.x+n),x=A(h.y+u);i.push(`C ${f} ${m}, ${b} ${x}, ${h.x} ${h.y}`),a=n,c=u,p=h}return i}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){this.stats=e,t.forEach((s,r)=>{let a=Array.isArray(s.values)?s.values:e.x.keys.map(p=>s.values[p]??null),c={class:this.getPlotClass(r),plot:r};this.constructor.type==="line"&&(c.fill="none");let n=new y("path",c);i.appendChild(n);let u=this.createPlotLine(a);n.setAttribute("d",u.join(" ")),a.forEach((p,d)=>{if(p!=null){if(this.config.plot.node.enabled){let h=A((d-e.x.min)*e.x.scaleFactor)+"%",g=A((e.y.max-p)*e.y.scaleFactor)+"%",f=s.name||`Series ${r+1}`,m=e.associative&&e.x.keys&&e.x.keys[d]||d,b=new y("circle",{cx:h,cy:g,r:this.config.plot.node.size,class:["plot-node",`plot-node-${r}`],node:d,plot:r,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f}, ${m}: ${p}`});o.appendChild(b)}if(this.config.plot.node.label.enabled){let h=new y("text",{x:A((d-e.x.min)*e.x.scaleFactor)+"%",y:A((e.y.max-p)*e.y.scaleFactor)+"%",fill:"black",class:["plot-node-label",`plot-node-label-${r}`]});h.innerHTML=p,o.appendChild(h)}}})})}tooltipLocation(t,e,i){return function(s){let r={tooltip:{},crosshair:{}},a=1,c="",n=i.stats,p=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-p.left)/p.width,h=Math.floor(d*n.x.scaleLength),g=0,f=0,m=i.data,b=n.associative?n.x.keys[h]:h;m.forEach(function(C){let k=n.associative?C.values[b]:C.values[h];k!=null&&(g+=k,f++)});let x=(n.y.max-g/f)*n.y.scaleFactor;isNaN(x)&&(x=n.y.max*n.y.scaleFactor);let v=n.x.scaleFactor*h,w=x.toFixed(2);return isNaN(v)||isNaN(w)||h<0||h>=n.x.scaleLength?null:(r.crosshair.x1=v,r.crosshair.x2=v,r.crosshair.y1=0,r.crosshair.y2=100,r.tooltip.x=v+a,r.tooltip.y=w,m.forEach(function(C,k){let S=M(C.name?C.name:"Series "+k),L=n.associative?i.data[k].values[b]:i.data[k].values[h],$=n.associative?b:h,E;if(i.config.tooltip.format)try{E=M(String(i.config.tooltip.format($,L)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),E=`(${M(String($))} : ${M(String(L))})`}else E=`(${M(String($))} : ${M(String(L))})`;t.toggles[k]!==!1&&(c+=`<div class="svc-tooltip-content">
            <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> :
            ${E}
          </div>`)}),r.tooltip.text=c,r.index=h,r)}}},K=jt;var Rt=class extends K{static get type(){return"area"}static get defaults(){return{plot:{area:{style:{"fill-opacity":"var(--area-fill-opacity, 0.5)","stroke-width":"2%","stroke-linecap":"round"}},node:{enabled:!1,size:4,active:{style:{"stroke-width":"0.5%"}}}}}}static specs(){return{plot:{stroke:"primary"},"plot.area":{fill:"primary",stroke:"secondary"}}}getPlotClass(t){return["plot",`plot-${t}`,"plot-area",`plot-area-${t}`]}createPlotLine(t){let e=super.createPlotLine(t),i=this.stats,o=t.find(c=>c!=null);if(o==null)return e;let s=A((t.length-1-i.x.min)*i.x.scaleFactor),r=A(i.y.max*i.y.scaleFactor),a=A((i.y.max-o)*i.y.scaleFactor);return e.push(`L ${s} ${r} L 0 ${r} L 0 ${a}`),e}},Bt=Rt;var Ut=class extends q{static get type(){return"column"}static get defaults(){return{plot:{vertical:!0,stacked:!1,spacing:10,label:{enabled:!1,format:null}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s,r,a=this.config.plot.spacing/100,c=e.y.scaleFactor,n=e.x.scaleFactor;e.plot={},this.config.plot.vertical?(s=e.y.min,r=e.y.max,e.plot.vertical=!0):(s=e.x.min,r=e.x.max,e.plot.vertical=!1),e.plot.barSpacing=this.config.plot.spacing/100;let u=Math.abs(r-s),d=Math.abs(s)/u*100;if(this.config.plot.stacked){this._createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:n,scaleY:c,barSpacing:a,originPoint:d});return}if(Array.isArray(t[0].values))if(this.config.plot.vertical){let h=n/t.length,g=h*(1-a*2);t.forEach((f,m)=>{f.type!=="line"&&f.values.forEach((b,x)=>{let v;b>0?v=(e.y.max-b)*c+"%":v=(100-d).toFixed(3)+"%";let w=n*x;w+=h*m,w+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${m}`,`plot-node-${m}`],index:x,plot:m,"data-series":m,"data-index":x,"data-value":b,height:Math.abs(b)*c,x:w+"%",width:g+"%",y:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f.name||"Series "+(m+1)}, ${x}: ${b}`}))})})}else{let h=c/t.length,g=h*(1-a*2);t.forEach((f,m)=>{f.type!=="line"&&f.values.forEach((b,x)=>{let v,w=Math.abs(b)*n;b>0?v=d.toFixed(3)+"%":v=d.toFixed(3)-w+"%";let C=100-c*(x+1);C+=h*m,C+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${m}`,`plot-node-${m}`],index:x,plot:m,"data-series":m,"data-index":x,"data-value":b,y:C+"%",width:w+"%",height:g+"%",x:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f.name||"Series "+(m+1)}, ${x}: ${b}`}))})})}else if(this.config.plot.vertical){let h=n/t.length,g=h*(1-a*2);e.x.keys.forEach((f,m)=>{t.forEach((b,x)=>{if(b.type!=="line"&&b.values[f]!=null){let v,w=b.values[f];w>0?v=(e.y.max-w)*c+"%":v=(100-d).toFixed(3)+"%";let C=n*m;C+=h*x,C+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:m,plot:x,"data-series":x,"data-key":f,"data-value":w,height:Math.abs(w)*c,x:C+"%",width:g+"%",y:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${b.name||"Series "+(x+1)}, ${f}: ${w}`}))}})})}else{let h=c/t.length,g=h*(1-a*2);e.y.keys.slice().reverse().forEach((m,b)=>{t.forEach((x,v)=>{if(x.type!=="line"&&x.values[m]!=null){let w=x.values[m],C,k=Math.abs(w)*n;w>0?C=d.toFixed(3)+"%":C=d.toFixed(3)-k+"%";let S=100-c*(b+1);S+=h*v,S+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:b,plot:v,"data-series":v,"data-key":m,"data-value":w,y:S+"%",width:k+"%",height:g+"%",x:C,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${x.name||"Series "+(v+1)}, ${m}: ${w}`}))}})})}this._renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}),this.config.plot.label.enabled&&this._renderDataLabels({data:t,stats:e,subchartNoStretch:o,scaleX:n,scaleY:c,barSpacing:a})}_renderDataLabels({data:t,stats:e,subchartNoStretch:i,scaleX:o,scaleY:s,barSpacing:r}){if(!i)return;let a=!Array.isArray(t[0].values),c=this.config.plot.vertical,n=this.config.plot.label.format,u=t.filter(p=>p.type!=="line").length;t.forEach((p,d)=>{if(p.type==="line")return;let h=a?(c?e.x.keys:e.y.keys).map(g=>({key:g,value:p.values[g]})):p.values.map((g,f)=>({key:f,value:g}));h.forEach(({key:g,value:f},m)=>{if(f==null)return;let b=n?n(f,g):String(f);if(c){let x=o,v=x/u,w=x*m+v*d+v/2+v*r,C=(e.y.max-f)*s,k=new y("text",{x:w+"%",y:C-1+"%","text-anchor":"middle",class:["plot-node-label",`plot-node-label-${d}`]});k.textContent=b,i.appendChild(k)}else{let x=s,v=x/u,w=h.length-1-m,C=100-x*(w+1)+v*d+v/2,k=Math.abs(f)*o,S=new y("text",{x:k+1+"%",y:C+"%","alignment-baseline":"middle",class:["plot-node-label",`plot-node-label-${d}`]});S.textContent=b,i.appendChild(S)}})})}_renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s=!Array.isArray(t[0].values),r=this.config.plot.vertical,a=e.x.scaleFactor,c=e.y.scaleFactor;t.forEach((n,u)=>{if(n.type!=="line")return;let p=r?e.x.keys:e.y.keys,d=s?p.map(m=>n.values[m]??null):n.values,h=[],g=!1;for(let m=0;m<d.length;m++){if(d[m]==null){g=!1;continue}let b=r?m*a+a/2:(e.y.max-d[m])*c,x=r?(e.y.max-d[m])*c:100-(m*c+c/2);g?h.push(`L ${b.toFixed(2)} ${x.toFixed(2)}`):h.push(`M ${b.toFixed(2)} ${x.toFixed(2)}`),g=!0}if(h.length===0)return;let f=new y("path",{d:h.join(" "),fill:"none",class:["plot",`plot-${u}`],style:"vector-effect: non-scaling-stroke"});if(i.appendChild(f),o)for(let m=0;m<d.length;m++){if(d[m]==null)continue;let b=r?m*a+a/2+"%":(e.y.max-d[m])*c+"%",x=r?(e.y.max-d[m])*c+"%":100-(m*c+c/2)+"%",v=s&&p?p[m]:m,w=n.name||"Series "+(u+1);o.appendChild(new y("circle",{cx:b,cy:x,r:4,class:["plot-node",`plot-node-${u}`],node:m,plot:u,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${w}, ${v}: ${d[m]}`}))}})}_createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:o,scaleY:s,barSpacing:r,originPoint:a}){let c=!Array.isArray(t[0].values),n=this.config.plot.vertical,u=n?o:s,p=u,d=p*(1-r*2),h=c?n?e.x.keys:e.y.keys:Array.from({length:Math.max(...t.map(g=>g.values.length))},(g,f)=>f);h.forEach((g,f)=>{let m=0,b=0;t.forEach((x,v)=>{if(x.type==="line")return;let w=x.values[g];if(w==null)return;let C=Math.abs(w)*(n?s:o),k=x.name||"Series "+(v+1);if(n){let S;w>=0?(m+=w,S=(e.y.max-m)*s):(S=(e.y.max-b)*s,b+=w);let L=u*f+p*r;i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:f,plot:v,"data-series":v,"data-key":c?g:void 0,"data-index":c?void 0:f,"data-value":w,x:L+"%",y:S+"%",width:d+"%",height:C+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}else{let S;w>=0?(S=a+m*o,m+=w):(b+=w,S=a+b*o);let L=h.length-1-f,$=100-u*(L+1)+p*r;i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:f,plot:v,"data-series":v,"data-key":c?g:void 0,"data-index":c?void 0:f,"data-value":w,x:S+"%",y:$+"%",width:C+"%",height:d+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}})})}tooltipLocation(t,e,i){return function(s){let r={tooltip:{},crosshair:{}},a=1,c="",n=i.stats,p=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-p.left)/p.width,h=Math.floor(d*n.x.scaleLength),g=0,f=0,m=i.data,b;n.associative&&(b=n.x.keys[h]),m.forEach(function(C){n.associative&&C.values[b]!=null?(g+=C.values[b],f++):!n.associative&&C.values[h]!=null&&(g+=C.values[h],f++)});let x=(n.y.max-g/f)*n.y.scaleFactor;isNaN(x)&&(x=n.y.max*n.y.scaleFactor);let v=n.x.scaleFactor*h+n.x.scaleFactor/2,w=x.toFixed(2);return isNaN(v)||isNaN(w)||h<0||h>=n.x.scaleLength?null:(n.associative&&(w=100-w),r.crosshair.x1=-10,r.crosshair.x2=-10,r.crosshair.y1=-10,r.crosshair.y2=-10,r.tooltip.x=v+a,r.tooltip.y=w,m.forEach(function(C,k){let S=M(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let L=n.associative?i.data[k].values[b]:i.data[k].values[h],$=n.associative?b:h,E;if(i.config.tooltip.format)try{E=M(String(i.config.tooltip.format($,L)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),E=`(${M(String($))} : ${M(String(L))})`}else E=`(${M(String($))} : ${M(String(L))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${E}
          </div>`}}),r.tooltip.text=c,r.index=h,r)}}},Z=Ut;var Vt=class extends Z{static get type(){return"bar"}static get defaults(){return{plot:{vertical:!1}}}tooltipLocation(t,e,i){return function(s){let r={tooltip:{},crosshair:{}},a=1,c="",n=i.stats,p=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientY-p.top)/p.height;n.associative&&(d=1-d);let h=n.y.scaleLength-1-Math.floor(d*n.y.scaleLength),g=0,f=0,m=i.data,b;n.associative&&(i.config.plot.vertical?b=n.x.keys[h]:b=n.y.keys[h]),m.forEach(function(C){n.associative&&C.values[b]!=null?(g+=C.values[b],f++):!n.associative&&C.values[h]!=null&&(g+=C.values[h],f++)});let x=g/f*n.x.scaleFactor;isNaN(x)&&(x=n.x.max*n.x.scaleFactor);let v=x.toFixed(2),w=100*d.toFixed(2);return isNaN(v)||isNaN(w)||h<0||h>=n.x.scaleLength?null:(n.associative&&(w=100-w),r.crosshair.x1=-10,r.crosshair.x2=-10,r.crosshair.y1=-10,r.crosshair.y2=-10,r.tooltip.x=v+a,r.tooltip.y=w+a,m.forEach(function(C,k){let S=M(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let L,$=n.associative?i.data[k].values[b]:i.data[k].values[h],E=n.associative?b:h;if(i.config.tooltip.format)try{L=M(String(i.config.tooltip.format(E,$)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),L=`(${M(String(E))} : ${M(String($))})`}else L=`(${M(String(E))} : ${M(String($))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${L}
          </div>`}}),r.tooltip.text=c,r.index=h,r)}}},rt=Vt;var Dt=class extends q{static get type(){return"scatter"}static get defaults(){return{plot:{size:4}}}static specs(){return{"plot.node":{fill:"primary"}}}tooltipLocation(t,e,i){return function(s){t.nodeMap||(t.nodeMap=Fe(e));let r={tooltip:{},crosshair:{}},a=1,c="",u=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientX-u.left)/u.width,d=(s.clientY-u.top)/u.height;p=Math.floor(p*100),d=Math.floor(d*100);let h=Math.floor(p/10),g=parseInt((p/10).toFixed(1).split(".")[1]),f=Math.floor(d/10);for(var m=null,b=[[0,0],[-1,0],[1,0],[0,-1],[0,1]],x=0;x<b.length;x++){var v=f+b[x][0],w=h+b[x][1];if(v>=0&&v<10&&w>=0&&w<10&&t.nodeMap[v]&&t.nodeMap[v][w]){var C=t.nodeMap[v][w][g];if(!C){for(var k=Math.max(0,g-1);k<=Math.min(9,g+1);k++)if(t.nodeMap[v][w][k]){C=t.nodeMap[v][w][k];break}}if(C){m=C;break}}}if(m)return r.crosshair.x1=-1,r.crosshair.x2=-1,r.crosshair.y1=-1,r.crosshair.y2=-1,r.tooltip.x=p+a,r.tooltip.y=d,m.forEach(S=>{let L=S.getAttribute("data-series"),$=S.getAttribute("data-index"),E=i.data[L].values[$],T=M(i.data[L].name||"Series "+L),O;if(i.config.tooltip.format)try{O=M(String(i.config.tooltip.format(T,E)))}catch(_){console.warn("SVC: tooltip.format threw an error:",_),O=M(String(E))}else O=M(String(E));c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${L}">${T}</span> : (${O})
        </div>`}),r.tooltip.text=c,r}}createPlot({data:t,stats:e,subchartNoStretch:i}){t.forEach((o,s)=>{o.values.forEach((a,c)=>{let n=a[0],u=a[1],p=o.name||`Series ${s+1}`,d=new y("circle",{cx:((n-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-u)*e.y.scaleFactor).toFixed(3)+"%",r:this.config.plot.size,class:["plot-node",`plot-${s}`,`plot-node-${s}`],"data-index":c,"data-series":s,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${p}, (${n}, ${u})`});i.appendChild(d)})})}};function Fe(l){let t=Array.from(new Array(10)).map(()=>Array.from(new Array(10)).map(()=>[]));return l.querySelectorAll(".svc-plot-node").forEach(e=>{let i=parseInt(e.getAttribute("data-series"),10),o=parseInt(e.getAttribute("cx")),s=parseInt(e.getAttribute("cy")),r=Math.min(9,Math.floor(o/10)),a=parseInt((o/10).toFixed(1).split(".")[1]),c=Math.min(9,Math.floor(s/10));t[c][r][a]=t[c][r][a]||[],t[c][r][a][i]=e}),t}var W=Dt;var Ht=class extends W{static get type(){return"bubble"}static get defaults(){return{plot:{maxSize:4,node:{}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){t.forEach((s,r)=>{s.values.forEach((c,n)=>{let u=c[0],p=c[1],d=c[2],h=s.name||`Series ${r+1}`,g=e.alt.max-e.alt.min||1,f=(Math.abs(d)-e.alt.min)/g,m=new y("circle",{cx:((u-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-p)*e.y.scaleFactor).toFixed(3)+"%",r:f*this.config.plot.maxSize+.5+"%",style:`opacity: ${.7}`,class:["plot-node",`plot-${r}`,`plot-node-${r}`],"data-index":n,"data-series":r,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${h}, (${u}, ${p}), size: ${d}`});o.appendChild(m)})})}},qt=Ht;var Yt=class extends ot{static get type(){return"pie"}static get defaults(){return{plot:{ring:!1,node:{label:{enabled:!0,placement:"auto",scaleBySize:!0,limitBySize:!0,multiplier:1,threshold:12,style:{"font-size":"clamp(8px, 0.6vmin, 16px)"}}}},center:{size:"40%",style:{fill:"#fff"},label:{style:{"font-size":"5vmin",transform:"translate(0%, -50%)","text-align":"center"},container:{style:{display:"flex","justify-content":"center","align-items":"center"}},title:{style:{"font-size":"7vmin"}}}}}}static specs(){return{plot:{fill:"primary"},"plot.node":{fill:"primary"}}}parse(t){t=super.parse(t);let{layoutChart:e}=t,i=this.createGraph({stretch:!0});e.appendChild(i);let o=this.createGraph({stretch:!1});e.appendChild(o),this.createPlot({layoutChart:e,subchartStretch:i,subchartNoStretch:o}),o.appendChild(new y("g"));let s=new y("style");return s.innerHTML=".plot {opacity: 1;}.svc-loading {opacity:0;}",e.appendChild(s),t}createScript(){return new j({stats:this.stats,data:this.data,config:this.config}).render()}createPlot({layoutChart:t,subchartStretch:e,subchartNoStretch:i}){let o=this.data;if(!z(o))throw new Error('SVC: Pie chart "data" must be a plain object with numeric values, e.g. { "Apples": 30, "Oranges": 70 }.');Object.keys(o).forEach(u=>{if(typeof o[u]!="number")throw new Error(`SVC: Pie chart value for "${u}" must be a number.`);if(o[u]<0)throw new Error(`SVC: Pie chart value for "${u}" is negative (${o[u]}). Pie charts require non-negative values.`)});let s=Object.keys(o).reduce((u,p)=>u+=o[p],0);if(s===0){let u=new y("text",{x:"50%",y:"50%","text-anchor":"middle","alignment-baseline":"middle",class:["loading"]});u.textContent="No data",i.appendChild(u);return}let r=0,a=0,c=this.config.plot.node.instances.map(u=>u.fill);Object.keys(o).forEach((u,p)=>{let d=o[u],h=d/s,g=r/s,f=c[a%c.length],m=this.calculateSlice(h,g),b=this.createSlice(m,f,p,d,s,u);i.appendChild(b),a++,r+=d});let n=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]});if(this.config.plot.ring){let p=(parseFloat(this.config.center.size)||40)/2;n.appendChild(new y("circle",{cx:"50",cy:"50",r:String(p),fill:"var(--color-surface, #fff)",class:["center"]}))}i.appendChild(n)}calculateSlice(t,e){let o=Math.cos((e+t)*2*Math.PI)*50+50,s=Math.sin((e+t)*2*Math.PI)*50+50,r=Math.cos(e*2*Math.PI)*50+50,a=Math.sin(e*2*Math.PI)*50+50,c=e*360,n=t*360+c,u=(n+c)/2,p=50+50*Math.cos(u*2*Math.PI/360),d=50+50*Math.sin(u*2*Math.PI/360);p=(p+50)*.5,d=(d+50)*.5;let h=n-c;return{radius:50,degrees:u,degreeLength:h,start:{x:o,y:s},end:{x:r,y:a},center:{x:p,y:d}}}createSlice(t,e,i,o,s,r){let{radius:a,start:c,end:n,center:u,degreeLength:p}=t,d=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]}),h=p>180?1:0,g=`M ${a} ${a}`,f=`L${c.x} ${c.y}`,m=`A ${a} ${a} 0 ${h} 0 ${n.x} ${n.y}`,b=(o/s*100).toFixed(0);if(d.appendChild(new y("path",{fill:e,style:"vector-effect: non-scaling-stroke",d:`${g} ${f} ${m} Z`,"alignment-baseline":"middle","text-anchor":"middle","data-key":r,"data-value":o,tabindex:"0",class:["plot-node",`plot-node-${i}`],role:"graphics-symbol","aria-roledescription":"slice","aria-label":`${r}: ${b}%`})),this.config.plot.node.label.enabled){let{multiplier:x,threshold:v,limitBySize:w,scaleBySize:C,placement:k}=this.config.plot.node.label,S=p<=v;if(k==="outside"||k==="auto"&&S){let $=t.degrees*Math.PI/180,E=55,T=62,O=50+48*Math.cos($),_=50+48*Math.sin($),J=50+E*Math.cos($),tt=50+E*Math.sin($),et=50+T*Math.cos($),I=50+T*Math.sin($),Y=Math.cos($)>=0?"start":"end";d.appendChild(new y("line",{x1:O.toFixed(1),y1:_.toFixed(1),x2:J.toFixed(1),y2:tt.toFixed(1),stroke:"var(--chart-label-color, #737373)","stroke-width":"0.5",class:["plot-leader"]}));let N=new y("text",{fill:"var(--chart-label-color, #737373)",x:et.toFixed(1),y:I.toFixed(1),"alignment-baseline":"middle","text-anchor":Y,style:"font-size: 0.35em;",class:["plot-node-label",`plot-node-label-${i}`]});N.innerHTML=`${M(r)} ${b}%`,d.appendChild(N)}else if(!this.config.plot.ring){let $;C&&($=.37*x*(p/100));let E=new y("text",{fill:"#fff",x:u.x,y:u.y,style:C?`font-size: ${A($)}em;`:"","alignment-baseline":"middle","text-anchor":"middle",class:w&&p>v||!w?["plot-node-label"]:["plot-node-label","hide"]});E.innerHTML=b+"%",d.appendChild(E)}}return d}tooltipLocation(t,e,i){return function(s){var r=e.querySelector("chart-plot");if(!r)return null;var a=r.getBoundingClientRect(),c=r.querySelector(".svc-nodeGroup"),n=c?c.getBoundingClientRect():a,u=n.left+n.width/2,p=n.top+n.height/2,d=s.clientX-u,h=s.clientY-p,g=Math.min(n.width,n.height)/2,f=Math.sqrt(d*d+h*h);if(f>g)return null;if(i.config.plot.ring){var m=parseFloat(i.config.center.size)||40,b=g*(m/100);if(f<b)return null}var x=Math.atan2(h,d);x<0&&(x+=2*Math.PI);var v=x/(2*Math.PI),w=(s.clientX-a.left)/a.width*100,C=(s.clientY-a.top)/a.height*100,k=i.data,S=Object.keys(k),L=S.reduce(function(at,ye){return at+(k[ye]||0)},0);if(L===0)return null;for(var $=0,E=null,T=0,O=0,_=0;_<S.length;_++){var J=k[S[_]]||0,tt=J/L;if(v>=$&&v<$+tt){E=S[_],T=J,O=_;break}$+=tt}if(!E)return null;var et=(T/L*100).toFixed(1),I={tooltip:{},crosshair:{x1:-10,x2:-10,y1:-10,y2:-10}};I.tooltip.x=w,I.tooltip.y=C;var Y=M(String(E)),N;if(i.config.tooltip&&i.config.tooltip.format)try{N=M(String(i.config.tooltip.format(E,T)))}catch(at){console.warn("SVC: tooltip.format threw an error:",at),N=Y+": "+et+"%"}else N=Y+": "+et+"%";return I.tooltip.text='<div class="svc-tooltip-content"><span class="svc-tooltip-label-title svc-tooltip-label-title-'+O+'">'+Y+"</span> : "+N+"</div>",I.index=O,I}}},Q=Yt;var Gt=class extends Q{static get type(){return"pie"}static get defaults(){return{plot:{ring:!0}}}},Xt=Gt;var Xo=window.matchMedia("(prefers-reduced-motion: reduce)");var he=new Map;function ue(l,t,e={}){let i=e.priority??10,o={impl:t,bundle:e.bundle,contract:e.contract,priority:i},s=he.get(l);if(customElements.get(l)){if(!s||s.priority>=i){s&&s.priority===i&&s.impl!==t&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${l}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=i){s.priority===i&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}he.set(l,o),customElements.define(l,t)}var nt=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,o){t.addEventListener(e,i,o),this.#t.push(()=>t.removeEventListener(e,i,o))}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let i=this.#e.states;try{e?i.add(t):i.delete(t)}catch{let o=`--${t}`;e?i.add(o):i.delete(o)}}_adoptInternals(t){this.#e||(this.#e=t)}};function Kt(l){let t=l.textContent.trim();if(!t)return null;let e=t.replace(/[$€£¥,% ]/g,""),i=Number(e);return Number.isFinite(i)?i:null}function Ie(l){let t=[...l.cells],e=-1,i=[];for(let o=0;o<t.length;o++){let s=t[o];if(!s.hasAttribute("data-chart-ignore")){if(s.hasAttribute("data-chart-label")||s.getAttribute("scope")==="row"){e=o;continue}(s.hasAttribute("data-chart-series")||!s.hasAttribute("data-chart-ignore"))&&i.push({index:o,name:s.textContent.trim()})}}if(e===-1&&t.length>0){let o=t[0];if(!o.textContent.trim()||o.tagName==="TH"){e=0;let s=i.findIndex(r=>r.index===0);s!==-1&&i.splice(s,1)}}return{labelIndex:e,columns:i}}function Ne(l){let t=l.querySelector("thead"),e=l.querySelector("tbody")||l,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")];if(!i||o.length===0)return{data:[],config:{}};let{labelIndex:s,columns:r}=Ie(i),a=s!==-1,c=r.map(p=>({name:p.name,values:a?{}:[]}));for(let p of o){let d=[...p.cells],h=a?d[s]?.textContent.trim()||"":null;for(let g=0;g<r.length;g++){let f=d[r[g].index],m=f?Kt(f):null;a&&h?c[g].values[h]=m??0:c[g].values.push(m??0)}}let n={},u=l.querySelector("caption");return u&&(n.title={text:u.textContent.trim(),enabled:!0}),{data:c,config:n}}function ze(l){let e=[...(l.querySelector("tbody")||l).querySelectorAll("tr")],i={};for(let r of e){let a=[...r.cells],c=r.querySelector("th"),n=c?c.textContent.trim():a[0]?.textContent.trim(),u=c?a[1]||a[0]:a[1],p=u?Kt(u):null;n&&p!=null&&(i[n]=p)}let o={},s=l.querySelector("caption");return s&&(o.title={text:s.textContent.trim(),enabled:!0}),{data:i,config:o}}function je(l){let t=l.querySelector("thead"),e=l.querySelector("tbody")||l,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")],s=new Map;for(let n of o){let u=[...n.cells],p=n.querySelector("th"),d=p?p.textContent.trim():"Data",h=p?[...n.querySelectorAll("td")]:u.slice(1);s.has(d)||s.set(d,[]);let g=h.map(f=>Kt(f)).filter(f=>f!=null);g.length>=2&&s.get(d).push(g)}let r=[...s.entries()].map(([n,u])=>({name:n,values:u})),a={},c=l.querySelector("caption");return c&&(a.title={text:c.textContent.trim(),enabled:!0}),{data:r,config:a}}function fe(l,t){if(!l||!l.querySelector("tbody, tr"))return{data:null,config:{}};let e=(t||"").toLowerCase();return e==="pie"||e==="ring"?ze(l):e==="scatter"||e==="bubble"?je(l):Ne(l)}function me(l){let t={};return l.hasAttribute("data-tooltip")&&(t.tooltip={enabled:!0}),l.hasAttribute("data-legend")&&(t.legend={enabled:!0}),l.hasAttribute("data-grid")&&(t.guides={x:{enabled:!0},y:{enabled:!0}}),l.hasAttribute("data-labels")&&(t.plot={node:{label:{enabled:!0}}}),t}function Re(l){let t=getComputedStyle(l),e=[];for(let i=1;i<=6;i++){let o=t.getPropertyValue(`--chart-series-${i}`).trim();o&&e.push(o)}return e.length>0?e:null}function F(l,t){return l.getPropertyValue(t).trim()||null}function Zt(l){let t=getComputedStyle(l),e={},i=F(t,"--chart-label-color"),o=F(t,"--chart-font-family");(i||o)&&(e.style={},i&&(e.style.color=i),o&&(e.style["font-family"]=o));let s=F(t,"--chart-axis-color");s&&(e.axis={style:{stroke:s}});let r=F(t,"--chart-grid-color");r&&(e.guides={style:{stroke:r}});let a=F(t,"--chart-baseline-color");a&&(e.baseline={style:{stroke:a}});let c=F(t,"--chart-tick-color");c&&(e.ticks={style:{stroke:c}});let n=F(t,"--chart-title-color"),u=F(t,"--chart-title-size");(n||u)&&(e.title=e.title||{},e.title.style={},n&&(e.title.style.color=n),u&&(e.title.style["font-size"]=u));let p=F(t,"--chart-subtitle-color"),d=F(t,"--chart-subtitle-size");(p||d)&&(e.title=e.title||{},e.title.subtitle=e.title.subtitle||{},e.title.subtitle.style={},p&&(e.title.subtitle.style.color=p),d&&(e.title.subtitle.style["font-size"]=d));let h=F(t,"--chart-tooltip-bg"),g=F(t,"--chart-tooltip-color"),f=F(t,"--chart-tooltip-shadow");(h||g||f)&&(e.tooltip=e.tooltip||{},e.tooltip.label=e.tooltip.label||{},e.tooltip.label.style={},h&&(e.tooltip.label.style["background-color"]=h),g&&(e.tooltip.label.style.color=g),f&&(e.tooltip.label.style["box-shadow"]=f));let m=Re(l);return m&&(e.palette=m),e}function ge(l){return{name:"vb-theme-bridge",hooks:{configResolved({config:t}){let e=Zt(l);e.style&&(t.style=Object.assign({},e.style,t.style)),e.palette&&!t._paletteFromUser&&(t.palette=e.palette)}}}}var Be={line:K,area:Bt,bar:rt,column:Z,pie:Q,ring:Xt,scatter:W,bubble:qt};function D(l,t=null){if(l==null)return t;if(typeof l!="string")return l;try{return JSON.parse(l)}catch{return t}}function H(l,t){if(!t||typeof t!="object"||Array.isArray(t))return l;for(let e of Object.keys(t))t[e]&&typeof t[e]=="object"&&!Array.isArray(t[e])?((!l[e]||typeof l[e]!="object")&&(l[e]={}),H(l[e],t[e])):l[e]=t[e];return l}var Wt=class extends nt{static get observedAttributes(){return["data-type","data-values","data-config","data-title","data-subtitle","data-legend","data-tooltip","data-palette","data-label-x","data-label-y"]}#t=null;#e=null;#s=null;#n=!1;#i=null;#o=null;set data(t){this.#t!==t&&(this.#t=t,this.#r(),this.#a("property"))}get data(){return this.#t}set config(t){this.#e!==t&&(this.#e=t,this.#r(),this.#a("property"))}get config(){return this.#e}#a(t){this.dispatchEvent(new CustomEvent("chart-wc:data-changed",{detail:{data:this.#t,config:this.#e,source:t},bubbles:!0}))}refresh(){this.#r()}toSVG(){return this.#i?.querySelector("svg")?.outerHTML||null}setup(){this.#r()}teardown(){this.#l()}attributeChangedCallback(){this.hasAttribute("data-upgraded")&&this.#r()}#r(){!this.isConnected||this.#n||(this.#n=!0,Promise.resolve().then(()=>{this.#n=!1,this.isConnected&&this.#f()}))}#c(){let t=(this.dataset.type||"").toLowerCase();return t||(t=(this.querySelector("table")?.dataset.type||"bar").toLowerCase()),Be[t]||rt}#d(){if(this.#t!=null)return{data:D(this.#t,null),tableConfig:{}};let t=this.dataset.values;if(t!=null)return{data:D(t,null),tableConfig:{}};let e=this.querySelector('script[type="application/json"]');if(e)return{data:D(e.textContent,null),tableConfig:{}};let i=this.querySelector("template[data-chart-data]");if(i){let s=i.content?.textContent||i.innerHTML;return{data:D(s,null),tableConfig:{}}}let o=this.querySelector("table");if(o){let s=(this.dataset.type||o.dataset.type||"bar").toLowerCase(),{data:r,config:a}=fe(o,s),c=me(o),n=H(H({},a),c);return{data:r,tableConfig:n}}return null}#p(t={}){let e=Zt(this),i=D(this.#e,{})||{},o=D(this.dataset.config,{})||{},s={};s=H(s,e),s=H(s,t),s=H(s,i),s=H(s,o);let r=this.dataset.labelX,a=this.dataset.labelY;if(s.axis=s.axis||{},s.axis.label=s.axis.label||{},r!=null?s.axis.label.x={text:r,enabled:!0}:s.axis.label.x?.text||(s.axis.label.x=s.axis.label.x||{},s.axis.label.x.enabled=!1),a!=null?s.axis.label.y={text:a,enabled:!0}:s.axis.label.y?.text||(s.axis.label.y=s.axis.label.y||{},s.axis.label.y.enabled=!1),s.plot?.node?.label?.scaleBySize||(s.plot=s.plot||{},s.plot.node=s.plot.node||{},s.plot.node.label=s.plot.node.label||{},s.plot.node.label.scaleBySize=!1),this.dataset.title!=null){let c={text:this.dataset.title,enabled:!0};this.dataset.subtitle!=null&&(c.subtitle=this.dataset.subtitle),s.title=c}if(this.dataset.legend!=null&&(s.legend={enabled:!0}),this.dataset.tooltip!=null&&(s.tooltip={enabled:!0}),this.dataset.palette!=null){let c=D(this.dataset.palette,null);c&&(s.palette=c)}return s.plugins=s.plugins||[],s.plugins.push(ge(this)),s}#h(){if(this.#o&&this.contains(this.#o))return;this.#o=document.createElement("div"),this.#o.setAttribute("data-chart-svg",""),this.#o.setAttribute("aria-hidden","true"),this.appendChild(this.#o);let t=this.#o.attachShadow({mode:"open"});this.#i=document.createElement("div"),this.#i.style.cssText="width:100%;height:100%;overflow:visible;",t.appendChild(this.#i)}#u(t){if(!t)return;(this.dataset.chart||t.dataset.chart||"replace")==="replace"&&(t.classList.add("visually-hidden"),t.setAttribute("aria-hidden","false"))}#f(){let t=this.#c(),e=this.#d();if(!e||!e.data){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:"No chart data found"},bubbles:!0}));return}let{data:i,tableConfig:o}=e,s=this.#p(o);this.#l();let r=this.querySelector("table");this.#u(r),this.#h();try{this.dispatchEvent(new CustomEvent("chart-wc:config-resolved",{detail:{type:this.dataset.type||r?.dataset.type||"bar",config:s},bubbles:!0})),this.#s=new t({config:s,data:i}),this.#s.mount(this.#i),this.dispatchEvent(new CustomEvent("chart-wc:render",{detail:{type:this.dataset.type||r?.dataset.type||"bar",seriesCount:Array.isArray(i)?i.length:Object.keys(i).length},bubbles:!0}))}catch(a){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:a.message},bubbles:!0}))}}#l(){this.#s&&(this.#s.destroy(),this.#s=null),this.#i&&(this.#i.innerHTML="")}};ue("chart-wc",Wt);export{Wt as ChartWc};
//# sourceMappingURL=chart-wc.js.map
