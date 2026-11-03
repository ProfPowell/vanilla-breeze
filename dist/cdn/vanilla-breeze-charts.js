function $(r){return String(r).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function xt(r){let t=$(String(r));return t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.+?)\*/g,"<em>$1</em>"),t=t.replace(/`(.+?)`/g,"<code>$1</code>"),t=t.replace(/\n/g,"<br>"),t}function B(r){if(!r||typeof r!="object"||Array.isArray(r))return!1;let t=Object.getPrototypeOf(r);return t===Object.prototype||t===null}function M(r){let t=r.toFixed(2);return parseFloat(t[t.length-1]==="0"?r.toFixed(1):t)}function vt(r){return t(r);function t(i){let o="";for(let s in i.options)if(Object.hasOwn(i.options,s)){let n=s,a=i.options[s];if(s==="class"){if(!Array.isArray(a))throw new Error("Wrong argument to class");a="",i.options[s].forEach(c=>{a+=(a===""?"":" ")+`svc-${c}`})}o+=(o===""?"":" ")+`${n}="${$(String(a))}"`}if(i.children.length>0){let s="";return i.children.forEach(function(n){s+=(o===""?"":" ")+t(n)}),`<${i.tagName}${e(o)}>${s}</${i.tagName}>`}else return typeof i.innerHTML<"u"?`<${i.tagName}${e(o)}>${i.innerHTML}</${i.tagName}>`:`<${i.tagName}${e(o)}></${i.tagName}>`}function e(i){return i===""?i:" "+i}}function et(r,t){return i(r,t);function e(o){return B(o)}function i(o,...s){if(!s.length)return o;let n=s.shift();if(e(o)&&e(n))for(let a in n)e(n[a])?(o[a]||Object.assign(o,{[a]:{}}),i(o[a],n[a])):Object.assign(o,{[a]:n[a]});return i(o,...s)}}function wt(r,t){let e=r,i=t.split(".");for(let o=0;o<i.length;o++)if(e=e[i[o]],!e)return!1;return!0}var y=class{constructor(t="div",e={}){this.children=[],this.tagName=t,this.options={},Object.assign(this.options,e)}set textContent(t){this.innerHTML=$(t)}appendChild(t){this.children.push(t)}prependChild(t){this.children.unshift(t)}removeChild(t){let e=this.children.indexOf(t);e!==-1&&this.children.splice(e,1)}setAttrs(t){Object.assign(this.options,t)}setAttribute(t,e){this.options[t]=e}};var Qt=0,Q=class r{constructor(t,...e){this.config=e.reduce((i,o)=>et(i,o),{}),this.palette=t||r.defaultPalette(),B(this.palette[0])||(this.palette=this.palette.map(i=>({primary:i,secondary:i}))),this.defs=this.createDefs(),et(this.config.l,r.layoutProperties())}static layoutProperties(){return{wrap:{style:{background:"var(--color-surface, #fff)"}},top:{style:{"justify-content":"center","align-items":"center","padding-block":"0.5em 2em","padding-inline":"0.2em"}},ticks:{x:{style:{height:"10px"}},y:{style:{width:"1%"}}}}}static defaultPalette(){return[{primary:"var(--chart-series-1, #3b82f6)",secondary:"var(--chart-series-1, #3b82f6)"},{primary:"var(--chart-series-2, #ef4444)",secondary:"var(--chart-series-2, #ef4444)"},{primary:"var(--chart-series-3, #8b5cf6)",secondary:"var(--chart-series-3, #8b5cf6)"},{primary:"var(--chart-series-4, #f59e0b)",secondary:"var(--chart-series-4, #f59e0b)"},{primary:"var(--chart-series-5, #10b981)",secondary:"var(--chart-series-5, #10b981)"}]}createDefs(){let t=[];return B(this.palette[0])&&B(this.palette[0].primary)&&this.palette.forEach((e,i)=>{Object.keys(e).forEach(o=>{let{url:s,def:n}=this.generateGradient(e[o],i,o);e[o]=`url(#${s})`,t.push(n)})}),t}generateGradient(t,e,i){let o=t.orientation||"vertical",s="svc-grad-"+e+"-"+i+"-"+Qt++,n=new y("linearGradient",{id:s,x1:"0%",y1:"0%",x2:o==="vertical"?"0%":"100%",y2:o==="vertical"?"100%":"0%"});return Object.keys(t).forEach(a=>{isNaN(parseInt(a))||n.appendChild(new y("stop",{offset:a+"%","stop-color":t[a]}))}),{url:s,def:n}}applyPalette(t){for(let i in t)if(Object.hasOwn(t,i)){let o=e(i,this.config);if(!o)continue;let s=t[i];o.instances||(o.instances=[]),this.palette.forEach((n,a)=>{let c={};for(let l in s)if(Object.hasOwn(s,l)){let u=s[l];Object.prototype.hasOwnProperty.call(n,u)?c[l]=n[u]:c[l]=u}o.instances[a]?Object.keys(c).forEach(l=>{typeof o.instances[a][l]>"u"&&(o.instances[a][l]=c[l])}):o.instances.push(c)})}function e(i,o){let s=i.split("."),n=o,a=!1;return s.forEach(c=>{n[c]?n=n[c]:a=!0}),a?null:n}}};var it=class{constructor(t){this.config=t}static get defaults(){return{l:{top:{breakpoint:{width:200,height:150}}},title:{enabled:!0,text:"Title",style:{"text-align":"center",width:"100%","font-weight":400,"font-size":"var(--chart-title-size, 1.4rem)",color:"var(--chart-title-color, #444)","text-anchor":"middle","alignment-baseline":"middle"},subtitle:{style:{"font-size":"var(--chart-subtitle-size, 0.9rem)",color:"var(--chart-subtitle-color, var(--chart-label-color, #737373))","font-weight":300}}}}}render(){let t=this.config.title,e=new y("div",{class:["title"]}),i=t.markdown!==!1&&Jt(t.text),o=i?xt(t.text):$(t.text);return t.subtitle&&typeof t.subtitle=="string"?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${It(t.subtitle,i)}</div>`:t.subtitle&&t.subtitle.text?e.innerHTML=`<span class="svc-title-text">${o}</span><div class="svc-subtitle">${It(t.subtitle.text,i)}</div>`:e.innerHTML=o,e}};function Jt(r){return/\*\*.+?\*\*|\*.+?\*|`.+?`|\n/.test(String(r))}function It(r,t){return t?xt(r):$(r)}var te=0,ot=class{constructor({config:t,data:e}){this.config=t,this.data=e}static get defaults(){return{l:{},legend:{breakpoint:{width:300,height:275},enabled:!0,style:{margin:0,padding:0,"flex-direction":"column","flex-wrap":"wrap","justify-content":"center","background-color":"var(--color-surface, rgba(255,255,255,0.8))","z-index":2},item:{style:{display:"flex","align-items":"center",padding:"0.5em",color:"var(--chart-label-color, #616161)","white-space":"nowrap"}}}}}render(t,e,i,o){return this.createLegend(i)}createLegend(t){let e=new y("ul",{class:["legend"]}),i=te++;return(t!=="pie"?this.data.map((s,n)=>({name:s.name||"Series "+n,index:n})):Object.keys(this.data).map((s,n)=>({name:s,index:n}))).forEach(({name:s,index:n})=>{let a=this._getSeriesColor(n),c=new y("li",{class:["legend-item"]}),l=`legend-item-${n}-${i}`,u=new y("input",{type:"checkbox",id:l,"data-series":n,checked:"",style:`--_series-color: ${a}`});c.appendChild(u);let d=new y("label",{id:`legend-item-text-${n}-${i}`,for:l});d.textContent=s,c.appendChild(d),e.appendChild(c)}),e}_getSeriesColor(t){let e;return this.config.plot.instances&&this.config.plot.instances.length>0?e=this.config.plot.instances[t%this.config.plot.instances.length]:this.config.plot.node?.instances&&this.config.plot.node.instances.length>0&&(e=this.config.plot.node.instances[t%this.config.plot.node.instances.length]),e&&e.stroke?e.stroke:e&&e.fill?e.fill:"#777"}};var N=class{constructor({stats:t,data:e,config:i,type:o}){this.data=e,this.config=i,this.type=o,o!=="pie"&&(this.min=t.y.min,this.max=t.y.max,this.stats=t)}static get defaults(){return{tooltip:{breakpoint:{width:275,height:275},enabled:!0,container:{style:{display:"flex"}},crosshair:{style:{"z-index":-1}},label:{style:{"background-color":"var(--chart-tooltip-bg, var(--color-surface, #fff))","box-shadow":"var(--chart-tooltip-shadow, 0 2px 4px rgba(0, 0, 0, 0.2))",color:"var(--chart-tooltip-color, var(--chart-label-color, #737373))",padding:"1em","z-index":2},title:{instances:[]}}}}}render(){return{tooltip:this.createDOM(),htmlTooltip:this._createHTMLTooltip()}}createDOM(){return this._createCartesianTooltip()}_createCartesianTooltip(){let t=new y("g",{id:"svc-tooltip-box",class:["tooltip","hide"]}),e=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"});return t.appendChild(e),t.appendChild(this._createTooltipForeignObject("svc-tooltip-label",["tooltip-label","hide"],{role:"tooltip","aria-live":"polite"})),t}_createRingTooltip(){let t=new y("g",{id:"svc-center-label-box",class:["tooltip","hide"]});return t.appendChild(this._createTooltipForeignObject("svc-center-label",["center-label"],{"aria-live":"polite"})),t}_createHTMLTooltip(){let t=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"}),e=new y("div",{id:"svc-tooltip-box",class:["tooltip","hide"],style:"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"}),i=new y("div",{class:["tooltip-container"],style:"position:absolute;pointer-events:auto;"}),o=new y("div",{id:"svc-tooltip-label",class:["tooltip-label","hide"],role:"tooltip","aria-live":"polite"});return i.appendChild(o),e.appendChild(i),{crosshair:t,tooltipBox:e}}_createTooltipForeignObject(t,e,i){let o=new y("foreignObject",{class:["tooltip-fo"],width:"100%",height:"100%"}),s=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});o.appendChild(s),s.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let n=new y("div",{class:["tooltip-container"]});s.appendChild(n);let a=new y("div",{id:t,class:e,...i});return n.appendChild(a),o}};var jt=`
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
`;var dt=class{constructor(){this.sheet=jt,this.rules=[]}addRule(t,e){let i="";Object.keys(e).forEach(o=>{i+=`${o}: ${e[o]};`}),this.sheet+=`.svc-${t}{${i}}`}addRaw(t){this.sheet+=t}convertconfig(t,e,i){let o={width:{},height:{}},s=c(t),n=a(o);return s+n;function a(l){let u="";return Object.keys(l).forEach(d=>{Object.keys(l[d]).forEach(p=>{let h=l[d][p],g=`@media(max-${d}: ${p}px){`,f=h.map(m=>`.svc-${m}.svc-${m}`);g+=f.join(","),g+="{ display: none; }",g+="}",u+=g})}),u}function c(l,u="",d="",p=[]){for(let h in l)if(h==="style"){let g="";for(let f in l[h])Object.hasOwn(l[h],f)&&(g+=`${f}:${l[h][f]};`);if(p.length===0)d+=`figure[data-chart-id] {${g}}`;else{let f=p.reduce((m,b)=>m+=(m===""?"":"-")+b,"");d+=`.svc-${f}{${g}}`}}else if(h==="instances"){let g=l[h];for(let f=0;f<e;f++){let m=g[f];if(!m)continue;let b="";for(let v in m)Object.hasOwn(m,v)&&(b+=`${v}:${m[v]};`);if(b!==""){let v=p.reduce((w,C)=>w+=(w===""?"":"-")+C,""),x=i?`[data-chart-id="${i}"] `:"";d+=`${x}.svc-${v}-${f} {${b}}`}}}else if(h==="breakpoint"){let g=p.reduce((f,m)=>f+=(f===""?"":"-")+m,"");o.width[l.breakpoint.width]?o.width[l.breakpoint.width].push(g):o.width[l.breakpoint.width]=[g],o.height[l.breakpoint.height]?o.height[l.breakpoint.height].push(g):o.height[l.breakpoint.height]=[g]}else typeof l[h]=="object"&&(p.push(h),d=c(l[h],h,d,p),p.pop());return d}}};function Rt({interactive:r=!1}={}){let t=new y("svg");t.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",role:r?"graphics-document":"img","aria-roledescription":"chart"});let e=new y("foreignObject",{width:"100%",height:"100%"});t.appendChild(e);let i=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});e.appendChild(i),i.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let o=new y("figure");i.appendChild(o);let s=new y("chart-title");o.appendChild(s);let n=new y("chart-body");o.appendChild(n);let a=new y("chart-canvas");n.appendChild(a);let c=new y("chart-label",{position:"y"});a.appendChild(c);let l=new y("chart-axis",{position:"y"});a.appendChild(l);let u=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-y"]});a.appendChild(u);let d=new y("chart-plot");a.appendChild(d);let p=new y("svg");p.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plotarea"]}),d.appendChild(p);let h=new y("div"),g=new y("div"),f=new y("div"),m=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-x"]});a.appendChild(m);let b=new y("chart-axis",{position:"x"});a.appendChild(b);let v=new y("chart-label",{position:"x"});a.appendChild(v),p.appendChild(new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]}));let x=new y("text",{x:"50%",y:"50%",class:["loading"]});return x.innerHTML="Loading Chart...",p.appendChild(x),{root:t,wrap:o,top:s,body:n,plotarea:d,layoutChart:p,layoutXAxis:b,layoutYTicks:u,layoutXTicks:m,layoutYAxis:l,layoutOriginRight:f,layoutOriginCenter:g,layoutXAxisLabel:v,layoutYAxisLabel:c,layoutOriginLeft:h}}var ee=new Set(["onInteraction","onResize","onClick"]),pt=class{#t=new Map;register(t,e){this.#t.has(t)||this.#t.set(t,new Set),this.#t.get(t).add(e)}unregister(t,e){let i=this.#t.get(t);i&&i.delete(e)}run(t,e){if(ee.has(t)&&typeof document>"u")return;let i=this.#t.get(t);if(i)for(let o of i)o(e)}registerPlugin(t){if(!(!t||!t.hooks))for(let[e,i]of Object.entries(t.hooks))this.register(e,i)}destroy(){this.#t.clear()}};function Ct(r){return JSON.stringify(r).replace(/<\//g,"<\\/").replace(/]]>/g,"]]\\>").replace(/<!--/g,"<\\!--").replace(/<\?/g,"<\\?")}var ht=class{hooks=new pt;structure=null;constructor(t){}compile(t,e){return""}compileHTML(t,e){return""}applyConfigToDefaults(t){return t}render(){}toFile(t={}){let e=c(t),i=`<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`,o=this.structure;if(!o)return i;let{body:s}=o,n;e.includeScripts&&(n=this._createScripts(this.structure),s.appendChild(n));let a=this.compile(o.root);return e.includeScripts&&n&&s.removeChild(n),e.prerendered&&(a=a.slice(0,a.indexOf("svg")+3)+' data-prerendered=""'+a.slice(a.indexOf("svg")+3)),i+a;function c(l){if(typeof l=="object"&&l!==null){let u=!!l.prerendered,d=!u;return{prerendered:u,includeScripts:l.includeScripts??d}}return{prerendered:!!l,includeScripts:!0}}}toString(){return this.structure?this.compile(this.structure.root):""}toHTML({prerendered:t}={}){return this.compileHTML(this.structure,{prerendered:t})}async toBlob(t="image/svg+xml",{width:e=800,height:i=600}={}){if(typeof Blob>"u")throw new Error("SVC: toBlob() requires a browser environment.");let o=this.toString();if(t==="image/svg+xml")return new Blob([o],{type:"image/svg+xml"});if(t==="image/png"){if(typeof document>"u")throw new Error("SVC: PNG export requires a browser environment with Canvas.");return this._svgToPngBlob(o,e,i)}throw new Error(`SVC: Unsupported export type "${t}".`)}async toDataURL(t="image/svg+xml",e){if(typeof FileReader>"u")throw new Error("SVC: toDataURL() requires a browser environment with FileReader.");let i=await this.toBlob(t,e);return new Promise((o,s)=>{let n=new FileReader;n.onload=()=>o(n.result),n.onerror=s,n.readAsDataURL(i)})}async download(t="chart.svg",e){if(typeof document>"u")throw new Error("SVC: download() requires a browser environment.");let o=t.split(".").pop()?.toLowerCase()==="png"?"image/png":"image/svg+xml",s=await this.toBlob(o,e),n=URL.createObjectURL(s),a=document.createElement("a");a.href=n,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(n)}_svgToPngBlob(t,e,i){return new Promise((o,s)=>{let n=document.createElement("canvas");n.width=e,n.height=i;let a=n.getContext("2d"),c=new Image,l=new Blob([t],{type:"image/svg+xml"}),u=URL.createObjectURL(l);c.onload=()=>{if(!a){s(new Error("SVC: 2D canvas context unavailable."));return}a.drawImage(c,0,0,e,i),URL.revokeObjectURL(u),n.toBlob(d=>{d?o(d):s(new Error("SVC: PNG export failed."))},"image/png")},c.onerror=()=>{URL.revokeObjectURL(u),s(new Error("SVC: Failed to load SVG for PNG export."))},c.src=u})}mount(t){if(!t||typeof document>"u")return null;t.innerHTML=this.toHTML(),this._state=this.hydrate(t),this._container=t;let e=t.host||t;return this._observeResize(e),this._state}createElement(){if(typeof document>"u")return null;let t=document.createElement("div");return this.mount(t),t}hydrate(t){if(!t)return null;let e={functions:{}};return(this.interactions||[]).forEach(o=>{e.functions[o.name]=o(e,t,this)}),this._state=e,this._container=t,e}update({data:t,config:e}={}){if(!this._container)return null;let i=this._container;return this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._state=null,t!=null&&(this.data=t),e!=null&&(et(this.config,e),this.config=this.applyConfigToDefaults(this.config).config),this.interactions=[],this.render(),i.innerHTML=this.toString(),this._state=this.hydrate(i),this._container=i,this._state}destroy(){this.hooks.run("beforeDestroy",{container:this._container,state:this._state}),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._container&&(this._container.innerHTML=""),this._state=null,this._container=null,this.hooks.destroy()}_observeResize(t){typeof ResizeObserver>"u"||(this._resizeObserver=new ResizeObserver(e=>{let i=e[0];i&&this.hooks.run("onResize",{width:i.contentRect.width,height:i.contentRect.height,container:t})}),this._resizeObserver.observe(t))}_createScripts(t){let e=new y("script",{class:["chart-script"]}),i="",o=[];(this.interactions||[]).forEach(a=>{i+=a.toString()+`
`,o.push(a.name)});let n=this;return i+=`
    var chart = {
      stats: ${Ct(n.stats||{})},
      data: ${Ct(n.data)},
      config: ${Ct(n.config)}
    };
    var svgRoot = document.currentScript.closest('svg');
    var state = { functions: []};`,o.forEach(a=>{i+=`state.functions['${a}'] = ${a}(state, svgRoot, chart);`}),e.innerHTML=`//<![CDATA[
`+i+`
//]]>`,e}};function kt(r,t,e){let i=e.config&&e.config.tooltip&&e.config.tooltip.hideDelay||2e3,o=t.querySelector("chart-plot"),s=t.querySelector("#svc-tooltip-box"),n=t.querySelector("#svc-tooltip-label"),a=t.querySelector(".svc-tooltip-crosshair");if(!o||!s||!n||!a)return;let c=o,l=s,u=n,d=a,p=[],h=null,g=null;function f(){g=null}typeof window<"u"&&(window.addEventListener("scroll",f,{passive:!0}),window.addEventListener("resize",f,{passive:!0}));let m=null;typeof ResizeObserver<"u"&&(m=new ResizeObserver(f),m.observe(c));function b(){u.setAttribute("class","svc-tooltip-label svc-hide"),l.setAttribute("class","svc-tooltip svc-hide"),d.setAttribute("x1","-10%"),d.setAttribute("x2","-10%"),d.setAttribute("y1","-10%"),d.setAttribute("y2","-10%");for(let w=0;w<p.length;w++)p[w].classList.remove("svc-plot-node-active-"+w);p=[]}function v(){h&&clearTimeout(h),h=setTimeout(b,i)}c.addEventListener("mousedown",x),c.addEventListener("mousemove",x),r._tooltipCleanup=function(){h&&clearTimeout(h),c.removeEventListener("mousedown",x),c.removeEventListener("mousemove",x),typeof window<"u"&&(window.removeEventListener("scroll",f),window.removeEventListener("resize",f)),m&&(m.disconnect(),m=null)};function x(w){v();let C=r.functions.tooltipLocation(w,r,t,e);if(!C)return;let k=t.querySelectorAll('.svc-plot-node[node="'+C.index+'"]');for(let O=0;O<p.length;O++)p[O].classList.remove("svc-plot-node-active-"+O);p=[];for(let O=0;O<k.length;O++)k[O].classList.add("svc-plot-node-active-"+O),p.push(k[O]);d.setAttribute("x1",C.crosshair.x1+"%"),d.setAttribute("x2",C.crosshair.x2+"%"),d.setAttribute("y1",C.crosshair.y1+"%"),d.setAttribute("y2",C.crosshair.y2+"%"),u.innerHTML=C.tooltip.text,u.setAttribute("class","svc-tooltip-label"),l.setAttribute("class","svc-tooltip"),g||(g=c.getBoundingClientRect());let S=g,E=u.getBoundingClientRect(),A=E.width/S.width*100,L=E.height/S.height*100,T=C.tooltip.x,_=C.tooltip.y;T+A>98&&(T=T-A-1),T<0&&(T=0),_+L>98&&(_=98-L),_<0&&(_=0);let P=l.querySelector("foreignObject");if(P)P.setAttribute("x",T+"%"),P.setAttribute("y",_+"%");else{let O=u.parentElement;O&&(O.style.left=T+"%",O.style.top=_+"%")}e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"tooltip",event:w,data:{index:C.index,tooltip:C.tooltip},element:l})}}function St(r,t,e){r.toggles=Array.from(t.querySelectorAll("chart-legend input")),r.toggles.forEach(function(i){i.removeAttribute("onclick"),i.addEventListener("click",function(o){let s=o.target.getAttribute("data-series");r.toggles[s]=o.target.checked;let n=r.toggles[s]!==!1,a=n?1:0,c=t.getElementsByClassName("svc-plot-"+s)[0];c&&(c.style.opacity=String(a));let l=t.getElementsByClassName("svc-plot-node-"+s);for(let u=0;u<l.length;u++)l[u].style.opacity=String(a);e&&e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"legend-toggle",event:o,data:{series:s,visible:n},element:i})})})}function $t(r,t,e){let i=t.querySelectorAll('[role="graphics-symbol"]');if(i.length===0)return;let o=-1,s=t.querySelector("chart-plot");if(!s)return;s.setAttribute("tabindex","0"),s.addEventListener("keydown",function(c){if(c.key==="ArrowRight"||c.key==="ArrowDown")c.preventDefault(),o=Math.min(o+1,i.length-1),n(o);else if(c.key==="ArrowLeft"||c.key==="ArrowUp")c.preventDefault(),o=Math.max(o-1,0),n(o);else if(c.key==="Escape"){a();let l=t.querySelector("#svc-tooltip-label");l&&l.classList.add("svc-hide"),o=-1}});function n(c){a();let l=i[c];if(!l)return;l.classList.add("svc-focus");let u=l.getAttribute("aria-label"),d=t.querySelector("#svc-tooltip-label");d&&u&&(d.textContent=u,d.classList.remove("svc-hide"))}function a(){for(let c=0;c<i.length;c++)i[c].classList.remove("svc-focus")}}function Et(r,t,e){let i=t.querySelector("chart-plot");if(!i)return;function o(n){let a=n.target.closest('[role="graphics-symbol"]');if(!a)return;let c={type:"click",event:n,element:a,seriesIndex:parseInt(a.getAttribute("plot")||a.getAttribute("data-series")||"0",10),dataIndex:parseInt(a.getAttribute("node")||a.getAttribute("data-index")||a.getAttribute("index")||"0",10),key:a.getAttribute("data-key")||null,value:a.getAttribute("data-value")||null,label:a.getAttribute("aria-label")||""};e.hooks&&e.hooks.run&&e.hooks.run("onClick",c)}i.addEventListener("click",o);let s=r._dataClickCleanup;r._dataClickCleanup=function(){s&&s(),i.removeEventListener("click",o)}}var ie=0,J=class r extends ht{#t;#e;data;config;palette;_scopeId="";interactions=[];stats;chart;legend;title;tooltip;_styleElement;constructor({config:t={},data:e}){if(super({config:t,data:e}),e==null)throw new Error('SVC: "data" is required. Pass an array of series objects or a plain object for pie charts.');this.data=e,this.palette=t.palette=t.palette||Q.defaultPalette();let i=this.applyConfigToDefaults(t);this.#e=i.defs,this.config=i.config,Array.isArray(this.config.plugins)&&this.config.plugins.forEach(o=>this.hooks.registerPlugin(o)),this.hooks.run("configResolved",{config:this.config,data:this.data,chartType:this.constructor.type}),this.#t=new dt,this._scopeId="c"+ie++,this.interactions=[],this.structure=null,this.render()}get stylesheet(){return this.#t}get defs(){return this.#e}applyConfigToDefaults(t){let e=[],i=Object.getPrototypeOf(this);for(;i.constructor.name!=="Object";)i.constructor.defaults&&e.push(i.constructor.defaults),i=Object.getPrototypeOf(i);e=e.reverse();let o={legend:ot,tooltip:N};Object.keys(o).forEach(n=>{(!t[n]||t[n].enabled)&&e.push(o[n].defaults)}),t.title&&t.title.text&&e.push(it.defaults);let s=new Q(this.palette,...e,t);return s.applyPalette(r.specs()),s.applyPalette(this.constructor.specs(s.config)),s}static get defaults(){return{palette:Q.defaultPalette(),style:{"font-family":"var(--chart-font-family, inherit)","font-weight":300,color:"var(--chart-label-color, #737373)"},legend:{enabled:!0},tooltip:{enabled:!0},plot:{node:{enabled:!0,instances:[],active:{instances:[]},label:{enabled:!1,instances:[]}},instances:[],style:{overflow:"visible"}},"plot-top":{style:{overflow:"visible"}},plotarea:{style:{fill:"var(--color-surface, #fff)",overflow:"visible"}},loading:{enabled:!0,style:{"font-size":"1.5em",fill:"var(--chart-label-color, #616161)","text-anchor":"middle"}}}}static specs(){return{"plot.node.label":{fill:"primary"},"tooltip.label.title":{color:"primary"}}}render(){this.config.title&&(this.title=new it(this.config)),this.config.legend&&(this.legend=new ot({config:this.config,data:this.data,chart:this.chart}));let t=!!(this.config.tooltip?.enabled||this.config.legend?.enabled),e=Rt({interactive:t});e.wrap.setAttribute("data-chart-id",this._scopeId);let i=this.constructor.type||"chart";if(this.config.title&&this.config.title.text){let o=$(this.config.title.text);e.root.setAttribute("aria-label",o);let s=new y("desc");s.innerHTML=`${i} chart: ${o}`,e.root.prependChild(s)}else{let o=Array.isArray(this.data)?this.data.length:Object.keys(this.data).length;e.root.setAttribute("aria-label",`${i} chart with ${o} data series`)}e=this.parse(e),this.structure=this.parseComponents(e),this.hooks.run("afterRender",{config:this.config,data:this.data,stats:this.stats,structure:this.structure})}parse(t){let{layoutChart:e}=t,i=new y("defs");return this.defs.forEach(o=>{i.appendChild(o)}),e.appendChild(i),t}parseComponents(t){let{body:e,top:i,layoutChart:o}=t;if(this.config.title&&this.config.title.enabled&&i.appendChild(this.title.render()),this.config.legend&&this.config.legend.enabled){let s=new y("chart-legend");s.appendChild(this.legend.render(null,null,this.constructor.type)),e.appendChild(s),this.interactions.push(St)}if(this.config.tooltip&&this.config.tooltip.enabled){this.tooltip=new N({stats:this.stats,data:this.data,config:this.config,type:this.constructor.type}).render(),o.appendChild(this.tooltip.tooltip);let s=this.tooltipLocation;typeof s=="function"&&(this.interactions.push(kt),this.interactions.push(s)),this.interactions.push($t)}return this.interactions.push(Et),t}compile(t,e){return this._styleElement&&t.removeChild(this._styleElement),this._styleElement=this.compileStyles(),t.prependChild(this._styleElement),vt(t)}compileHTML(t,{prerendered:e}={}){let i=t.wrap,o=t.root,s={...i.options};o.options["aria-label"]&&i.setAttribute("aria-label",o.options["aria-label"]),o.options["aria-describedby"]&&i.setAttribute("aria-describedby",o.options["aria-describedby"]),i.setAttribute("role",o.options.role||"figure"),e&&i.setAttribute("data-prerendered",""),this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),this._htmlStyleElement=this.compileStyles(),i.prependChild(this._htmlStyleElement);let n=t.layoutChart,a=t.plotarea,c=this.tooltip?.tooltip,l=this.tooltip?.htmlTooltip;c&&l&&a&&(n.removeChild(c),n.appendChild(l.crosshair),a.appendChild(l.tooltipBox));let u=vt(i);return i.options=s,this._htmlStyleElement&&i.removeChild(this._htmlStyleElement),c&&l&&a&&(n.removeChild(l.crosshair),a.removeChild(l.tooltipBox),n.appendChild(c)),u}compileStyles(){let t=new y("style"),e=this.constructor.type!=="pie"?this.data.length:Object.keys(this.data).length,i=this.stylesheet.convertconfig(this.config,e,this._scopeId)+this.stylesheet.sheet;return t.innerHTML=`@layer charts { ${i} }`,t}createGraph({stretch:t}){return t?new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",viewBox:"0, 0, 100, 100",preserveAspectRatio:"none",xmlns:"http://www.w3.org/2000/svg",class:["plot"]}):new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plot-top"]})}createBackground(){return new y("rect",{width:"100%",height:"100%",x:"0%",y:"0%",class:["container"]})}createPlotArea({config:t}){return new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]})}};var st=class{type;stats;stroke;width;constructor(t){Object.assign(this,t)}render(){let{type:t,stats:e,stroke:i,width:o}=this,{min:s,max:n}=e[t],a=Math.abs(n-s),l=Math.abs(s)/a*100;return t==="x"?new y("line",{class:["baseline","baseline-x"],x1:l.toFixed(3)+"%",y1:"0%",x2:l.toFixed(3)+"%",y2:"100%",stroke:i,"stroke-width":o}):new y("line",{class:["baseline","baseline-y"],x1:"0%",y1:(100-l).toFixed(3)+"%",x2:"100%",y2:(100-l).toFixed(3)+"%",stroke:i,"stroke-width":o})}};function Bt({config:r}){let t=r.scale.minFontSize,e=r.scale.maxItems,i="";i+=`
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
    }`;let s={0:2,250:4,600:6,800:10,1e3:e},n=Object.keys(s);n.forEach((c,l)=>{let u,d=Math.floor(e/s[c]),p=parseInt(c),h=parseInt(n[l+1])-1;if(l===0)u=`
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
      `;else if(l===n.length-1)u=`
        @container chart-canvas (min-width: ${c}px) {
          .svc-scale-label-x,
          .svc-guides-x,
          .svc-ticks-x {
            opacity: 1;
          }
        }
      `;else{let g=parseFloat((100/(d+1)).toFixed(2));u=`
        @container chart-canvas (min-width: ${p}px) and (max-width: ${h}px) {
          .svc-scale-label-x:nth-child(${d}n + 1),
          .svc-guides-x:nth-child(${d}n),
          .svc-ticks-x:nth-child(${d}n + 1) {
            opacity: 1;
          }
          .svc-scale-label-x {
            width: calc(${g}% - 5px);
            max-width: calc(${g}%);
          }
        }
      `}i+=u});let a=Object.keys(s);return a.forEach((c,l)=>{let u,d=Math.floor(e/s[c]),p=parseInt(c),h=parseInt(a[l+1])-1;l===0?u=`
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
      `:l===a.length-1?u=`
        @media(min-height: ${c}px) {
          .svc-scale-label-y,
          .svc-guides-y,
          .svc-ticks-y {
            opacity: 1;
          }
        }
      `:u=`
        @media(min-height: ${p}px) and (max-height: ${h}px) {
          .svc-scale-label-y:nth-child(${d}n + 1),
          .svc-guides-y:nth-child(${d}n + 1),
          .svc-ticks-y:nth-child(${d}n + 1) {
            opacity: 1;
          }
        }
      `,i+=u}),i}function Lt(r,t,e){if(!Array.isArray(r)||r.length===0)throw new Error('SVC: "data" must be a non-empty array of series objects.');for(let u=0;u<r.length;u++)if(!r[u]||r[u].values==null)throw new Error(`SVC: data[${u}] must have a "values" property.`);if(e!=="scatter"&&e!=="bubble")for(let u=0;u<r.length;u++){let d=r[u].values,p=Array.isArray(d)?d:Object.values(d);for(let h=0;h<p.length;h++)if(p[h]!=null&&typeof p[h]!="number")throw new Error(`SVC: data[${u}].values contains non-numeric value "${p[h]}" at position ${h}.`)}let i={min:1/0,max:-1/0,ticks:4,scale:0},o={min:1/0,max:-1/0,ticks:6,scale:0},s={min:1/0,max:-1/0},n=!1,a=-1/0;if(e==="scatter"||e==="bubble")Object.assign(i,ut(r,"x")),Object.assign(o,ut(r,"y")),e==="bubble"&&Object.assign(s,ut(r,"size"));else if(Array.isArray(r[0].values)){let u=r.reduce((p,h)=>p.concat(h.values),[]).sort((p,h)=>p-h);if(t.plot&&t.plot.stacked){let p=Math.max(...r.map(f=>f.values.length)),h=0,g=0;for(let f=0;f<p;f++){let m=0,b=0;r.forEach(v=>{let x=v.values[f]||0;x>=0?m+=x:b+=x}),h=Math.max(h,m),g=Math.min(g,b)}o.min=g,o.max=h}else o.min=u[0],o.max=u[u.length-1];let d=r[0].values.length;r.forEach((p,h)=>{p.values.length!==d&&console.warn(`SVC: Series ${h} has ${p.values.length} values, but series 0 has ${d}. Mismatched lengths may cause unexpected results.`),a=p.values.length>a?p.values.length:a}),i.min=0,i.max=a}else{n=!0;let u=r.reduce((p,h)=>p.concat(Object.keys(h.values).map(g=>h.values[g])),[]).sort((p,h)=>p-h),d={};if(r.forEach(p=>{Object.assign(d,p.values)}),d=Object.keys(d),t.scale.sorted&&d.sort(),t.plot&&t.plot.stacked){let p=0,h=0;d.forEach(g=>{let f=0,m=0;r.forEach(b=>{let v=b.values[g]||0;v>=0?f+=v:m+=v}),p=Math.max(p,f),h=Math.min(h,m)}),o.min=h,o.max=p}else o.min=u[0],o.max=u[u.length-1];i.keys=d,i.min=0,i.max=a=d.length}let c=e==="scatter"||e==="bubble";Object.assign(o,At(o,{forceZeroMin:!c})),c?Object.assign(i,At(i,{forceZeroMin:!1})):e==="bar"||e==="column"?(a>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.floor(a/(i.ticks-1))):(i.ticks=a,i.step=1),i.scaleLength=a,i.scaleFactor=M(100/a)):(a>t.scale.maxItems?(i.ticks=t.scale.maxItems,i.step=Math.ceil(a/(i.ticks-1))):(i.ticks=a,i.step=1),i.scaleLength=a,i.scaleFactor=M(100/Math.max(a-1,1)));let l=t.plot.vertical;return{associative:n,x:l?i:o,y:l?o:i,alt:s}}function At({max:r,min:t,ticks:e},{forceZeroMin:i=!0}={}){let o=r-t||1;t=Math.floor(t-Math.abs(o*.1)),r=Math.ceil(r+Math.abs(o*.1)),i&&(t=t>0?0:t);let s=r-t;if(s<=0)return{min:t,max:t+1,step:1,scaleLength:1,scaleFactor:100,ticks:2};let n=Ut(s,e);t=Math.floor(t/n)*n,r=Math.ceil(r/n)*n;let a=r-t;e=Math.round(a/n)+1;let c=100/a;return{min:t,max:r,step:n,scaleLength:a,scaleFactor:c,ticks:e}}function Ut(r,t){let e=r/t,i=Math.pow(10,Math.floor(Math.log10(e))),o=e/i,s;return o<=1.5?s=1:o<=3.5?s=2.5:o<=7.5?s=5:s=10,s*i}function ut(r,t){let e;switch(t){case"x":e=0;break;case"y":e=1;break;case"size":e=2;break}let i=r.map(o=>o.values.map(s=>s[e])).reduce((o,s)=>o.concat(s)).sort((o,s)=>o-s);return{min:i[0],max:i[i.length-1]}}var Mt=new Map;function nt(r,t){Mt.set(r,t)}function Tt(r,t){let e=Mt.get(r);if(!e)throw new Error(`SVC: Unknown scale type "${r}". Registered types: ${[...Mt.keys()].join(", ")}`);return new e(t)}var ft=class{type;config;stats;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:a,step:c}=i[t];for(let l=0;l<a;l++){let u=M(l*c*i[t].scaleFactor);if(u>100)continue;o.ticks.push(V(t,u));let d=U(t,l,a,u,e);d&&o.guides.push(d);let p;t==="x"?p=`${s+l*c}`:p=`${n-l*c}`,p=H(p,t,e),o.labels.push(D(t,u,p))}return o}};function V(r,t){return r==="x"?new y("line",{x1:t+"%",y1:"0%",x2:t+"%",y2:"100%",class:["ticks","ticks-x"]}):new y("line",{x1:"0%",y1:t+"%",x2:"100%",y2:t+"%",class:["ticks","ticks-y"]})}function U(r,t,e,i,o){if(r==="x"){if(t!==0&&o.guides.x.enabled)return new y("line",{x1:i+"%",y1:"100%",x2:i+"%",y2:"0%",class:["guides","guides-x"]})}else if(t!==e-1&&o.guides.y.enabled)return new y("line",{x1:"0%",y1:i+"%",x2:"100%",y2:i+"%",class:["guides","guides-y"]});return null}function D(r,t,e){let i=r==="x"?"left":"top",o=new y("div",{style:`${i}: ${t}%`,class:["scale-label",`scale-label-${r}`]});return o.textContent=e,o}function H(r,t,e){if(t==="x"&&wt(e,"scale.label.x.format"))try{return e.scale.label.x.format(r)}catch(i){console.warn("SVC: scale.label.x.format threw an error:",i)}else if(t==="y"&&wt(e,"scale.label.y.format"))try{return e.scale.label.y.format(r)}catch(i){console.warn("SVC: scale.label.y.format threw an error:",i)}return r}var mt=class{type;config;stats;chartType;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{ticks:s,step:n,max:a}=i[t],c=this.chartType,l=c==="bar"||c==="column",u=t==="x"&&e.plot.vertical||t==="y"&&!e.plot.vertical;for(let d=0;d<s;d++){let p,h;if(l&&u){let m=i[t].scaleFactor/2,b=s<=1?0:d/(s-1);h=Math.floor((i[t].scaleLength-1)*b),h===i[t].scaleLength&&h--,p=M(h*i[t].scaleFactor+m)}else p=M(d*n*i[t].scaleFactor);if(p>100)continue;o.ticks.push(V(t,p));let g=U(t,d,s,p,e);g&&o.guides.push(g);let f;if(t==="x"&&e.plot.vertical){let m=h??Math.round(d*(i.x.keys.length-1)/Math.max(s-1,1));f=`${i.x.keys[m]}`}else if(t==="y"&&!e.plot.vertical){let m=h??Math.round(d*(i.y.keys.length-1)/Math.max(s-1,1));f=`${i.y.keys[m]}`}else f=t==="x"?`${d*n}`:`${a-d*n}`;f=H(f,t,e),o.labels.push(D(t,p,f))}return o}};var gt=class{type;config;stats;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n}=i[t],a=Math.max(s,1),c=Math.floor(Math.log10(a)),u=Math.ceil(Math.log10(Math.max(n,1)))-c;if(u<=0)return o;let d=u+1;for(let p=0;p<d;p++){let h=c+p,g=Math.pow(10,h),f=M(p/u*100);if(f>100)continue;let m=t==="y"?M(100-f):f;o.ticks.push(V(t,m));let b=U(t,p,d,m,e);b&&o.guides.push(b);let v=ne(g);v=H(v,t,e),o.labels.push(D(t,m,v))}return o}};function ne(r){return r>=1e6?r/1e6+"M":r>=1e3?r/1e3+"K":String(r)}var yt=class{type;config;stats;constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:i}=this,o={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:a}=i[t],c=Dt(s),u=Dt(n)-c;if(u<=0||!Number.isFinite(u))return o;let d=re(u),p=Math.min(a,12);for(let h=0;h<p;h++){let g=h/Math.max(p-1,1),f=M(g*100),m=c+u*g;if(f>100)continue;o.ticks.push(V(t,f));let b=U(t,h,p,f,e);b&&o.guides.push(b);let v=d(new Date(m));v=H(v,t,e),o.labels.push(D(t,f,v))}return o}};function Dt(r){return typeof r=="number"?r:new Date(r).getTime()}function re(r){return r<864e5?o=>o.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"}):r<2592e6?o=>o.toLocaleDateString(void 0,{month:"short",day:"numeric"}):r<31536e6*2?o=>o.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):o=>o.toLocaleDateString(void 0,{year:"numeric"})}nt("linear",ft);nt("category",mt);nt("log",gt);nt("time",yt);var R=class extends J{static get defaults(){let t={width:120,height:120};return{l:{},plot:{vertical:!0},axis:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},label:{x:{enabled:!0,text:"Scale-X"},y:{enabled:!0,text:"Scale-Y"}},style:{stroke:"var(--chart-axis-color, #444)","stroke-width":.3,"vector-effect":"non-scaling-stroke"}},baseline:{x:{},y:{},style:{stroke:"var(--chart-baseline-color, #888)","stroke-width":1}},ticks:{x:{enabled:!0},y:{enabled:!0},style:{"stroke-width":"1",stroke:"var(--chart-tick-color, #DDD)"}},guides:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},style:{stroke:"var(--chart-grid-color, #e4e4e4)","stroke-dasharray":"0, 0","stroke-width":1,"stroke-linecap":"round"}},scale:{sorted:!1,minFontSize:5,maxItems:15,label:{style:{"text-align":"center"}}}}}getName(){return super.getName()}parse(t){t=super.parse(t);let e=this.data,i=this.stylesheet,o=this.config,{layoutChart:s,layoutXAxis:n,layoutYAxis:a,layoutOriginLeft:c,layoutOriginCenter:l,layoutOriginRight:u,layoutYTicks:d,layoutXTicks:p,layoutXAxisLabel:h,layoutYAxisLabel:g}=t,f=this.stats=Lt(e,this.config,this.constructor.type);this.data=e,this.hooks.run("beforeRender",{config:o,data:e,stats:f,structure:t}),["x","y"].forEach(S=>{let E=ae(S,f,o),A=Tt(E,{type:S,config:o,stats:f,data:e,chartType:this.constructor.type}).render();Object.keys(A).forEach(L=>{if(L==="labels")A[L].forEach(T=>{S==="x"?n.appendChild(T):a.appendChild(T)});else if(L==="ticks")S==="x"&&o.ticks.x.enabled?A[L].forEach(T=>{p.appendChild(T)}):S==="y"&&o.ticks.y.enabled&&A[L].forEach(T=>{d.appendChild(T)});else{let T=new y("g",{class:[S+"-"+L]});A[L].forEach(_=>{T.appendChild(_)}),s.appendChild(T)}})});let m=[];if(o.axis.x.enabled&&s.appendChild(this.createAxis({type:"x"})),o.axis.label.x.enabled){let S=`svc-axis-x-label-${this._scopeId}`,E=new y("div",{class:["l-axis-label-text-x"],id:S,role:"note"});E.innerHTML=`<span class="svc-axis-label-x">${$(o.axis.label.x.text)}</span>`,h.appendChild(E),m.push(S)}if(o.axis.y.enabled&&s.appendChild(this.createAxis({type:"y"})),o.axis.label.y.enabled){let S=`svc-axis-y-label-${this._scopeId}`,E=new y("div",{class:["l-axis-y-label-text"],id:S,role:"note"});E.innerHTML=`<span class="svc-axis-label-y">${$(o.axis.label.y.text)}</span>`,g.appendChild(E),m.push(S)}m.length>0&&t.root.setAttribute("aria-describedby",m.join(" "));let b=new y("div",{class:["axis-y-label-dummy"]});b.innerHTML="0",c.appendChild(b),g.appendChild(b);let v=new y("div",{style:"height: 1%; min-height:10px;"});l.appendChild(v);let x=new y("div",{class:["origin-label","scale-label"]});if(f.associative&&!o.plot.vertical){let S=f.y.keys,E=0;S.forEach(A=>{E=A.length>E?A.length:E}),x.innerHTML=new Array(E+1).join("0")}else x.innerHTML=f.y.max;l.appendChild(x),a.appendChild(x),u.setAttrs({style:"width: 1%;"}),f.y.min<0&&s.appendChild(new st({type:"y",stats:f,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render()),f.x.min<0&&s.appendChild(new st({type:"x",stats:f,stroke:o.baseline.style.stroke,width:o.baseline.style["stroke-width"]}).render());let w=this.createGraph({stretch:!0});s.appendChild(w);let C=this.createGraph({stretch:!1});s.appendChild(C),this.createPlot({data:e,stats:f,subchartStretch:w,subchartNoStretch:C});let k=new y("style");return k.innerHTML=".plot {opacity: 1;} .svc-loading {opacity:0;}",s.appendChild(k),i.addRaw(Bt({stats:f,config:o})),t}createScript(){return new N({stats:this.stats,data:this.data,config:this.config}).render()}createAxis({type:t}){return t==="x"?new y("line",{x1:"0%",x2:"100%",y1:"100%",y2:"100%",class:["axis","axis-x"]}):new y("line",{x1:"0%",x2:"0%",y1:"0%",y2:"100%",class:["axis","axis-y"]})}};function ae(r,t,e){return e.scale?.[r]?.type?e.scale[r].type:t.associative?"category":"linear"}var q=class extends R{static get type(){return"line"}static get defaults(){return{plot:{style:{fill:"none","vector-effect":"non-scaling-stroke"},node:{type:"open",size:4,style:{"stroke-width":"0.2%","stroke-linecap":"round"},active:{style:{"stroke-width":"0.5%","stroke-linecap":"round"}}}}}}static specs(t){let e={plot:{stroke:"primary"},"plot.node.active":{fill:"secondary",stroke:"secondary"}};return t.plot.node.enabled&&(e["plot.node"]={stroke:"primary"},t.plot.node.type=="closed"?e["plot.node"].fill="primary":e["plot.node"].fill="#FFF"),e}getPlotClass(t){return["plot",`plot-${t}`]}createPlotLine(t){let e=this.stats,i=[],o=.2,s=1,n=0,a=0,c=0,l,u,d=null;for(let p=0;p<t.length;p++){if(t[p]==null){d=null,a=0,c=0;continue}let h={x:M((p-e.x.min)*e.x.scaleFactor),y:M((e.y.max-t[p])*e.y.scaleFactor)};if(!d){i.push(`M ${h.x} ${h.y}`),d=h;continue}let g=null;for(let x=p+1;x<t.length;x++)if(t[x]!=null){g={x:M((x-e.x.min)*e.x.scaleFactor),y:M((e.y.max-t[x])*e.y.scaleFactor)};break}g?(n=(g.y-d.y)/(g.x-d.x),l=(g.x-h.x)*-o,u=l*n*s):l=u=0;let f=M(d.x-a),m=M(d.y-c),b=M(h.x+l),v=M(h.y+u);i.push(`C ${f} ${m}, ${b} ${v}, ${h.x} ${h.y}`),a=l,c=u,d=h}return i}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){this.stats=e,t.forEach((s,n)=>{let a=Array.isArray(s.values)?s.values:e.x.keys.map(d=>s.values[d]??null),c={class:this.getPlotClass(n),plot:n};this.constructor.type==="line"&&(c.fill="none");let l=new y("path",c);i.appendChild(l);let u=this.createPlotLine(a);l.setAttribute("d",u.join(" ")),a.forEach((d,p)=>{if(d!=null){if(this.config.plot.node.enabled){let h=M((p-e.x.min)*e.x.scaleFactor)+"%",g=M((e.y.max-d)*e.y.scaleFactor)+"%",f=s.name||`Series ${n+1}`,m=e.associative&&e.x.keys&&e.x.keys[p]||p,b=new y("circle",{cx:h,cy:g,r:this.config.plot.node.size,class:["plot-node",`plot-node-${n}`],node:p,plot:n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f}, ${m}: ${d}`});o.appendChild(b)}if(this.config.plot.node.label.enabled){let h=new y("text",{x:M((p-e.x.min)*e.x.scaleFactor)+"%",y:M((e.y.max-d)*e.y.scaleFactor)+"%",fill:"black",class:["plot-node-label",`plot-node-label-${n}`]});h.innerHTML=d,o.appendChild(h)}}})})}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},a=1,c="",l=i.stats,d=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientX-d.left)/d.width,h=Math.floor(p*l.x.scaleLength),g=0,f=0,m=i.data,b=l.associative?l.x.keys[h]:h;m.forEach(function(C){let k=l.associative?C.values[b]:C.values[h];k!=null&&(g+=k,f++)});let v=(l.y.max-g/f)*l.y.scaleFactor;isNaN(v)&&(v=l.y.max*l.y.scaleFactor);let x=l.x.scaleFactor*h,w=Number(v.toFixed(2));return isNaN(x)||isNaN(w)||h<0||h>=l.x.scaleLength?null:(n.crosshair.x1=x,n.crosshair.x2=x,n.crosshair.y1=0,n.crosshair.y2=100,n.tooltip.x=x+a,n.tooltip.y=w,m.forEach(function(C,k){let S=$(C.name?C.name:"Series "+k),E=l.associative?i.data[k].values[b]:i.data[k].values[h],A=l.associative?b:h,L;if(i.config.tooltip.format)try{L=$(String(i.config.tooltip.format(A,E)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),L=`(${$(String(A))} : ${$(String(E))})`}else L=`(${$(String(A))} : ${$(String(E))})`;t.toggles[k]!==!1&&(c+=`<div class="svc-tooltip-content">
            <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> :
            ${L}
          </div>`)}),n.tooltip.text=c,n.index=h,n)}}};var rt=class extends q{static get type(){return"area"}static get defaults(){return{plot:{area:{style:{"fill-opacity":"var(--area-fill-opacity, 0.5)","stroke-width":"2%","stroke-linecap":"round"}},node:{enabled:!1,size:4,active:{style:{"stroke-width":"0.5%"}}}}}}static specs(){return{plot:{stroke:"primary"},"plot.area":{fill:"primary",stroke:"secondary"}}}getPlotClass(t){return["plot",`plot-${t}`,"plot-area",`plot-area-${t}`]}createPlotLine(t){let e=super.createPlotLine(t),i=this.stats,o=t.find(c=>c!=null);if(o==null)return e;let s=M((t.length-1-i.x.min)*i.x.scaleFactor),n=M(i.y.max*i.y.scaleFactor),a=M((i.y.max-o)*i.y.scaleFactor);return e.push(`L ${s} ${n} L 0 ${n} L 0 ${a}`),e}};var Y=class extends R{static get type(){return"column"}static get defaults(){return{plot:{vertical:!0,stacked:!1,spacing:10,label:{enabled:!1,format:null}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s,n,a=this.config.plot.spacing/100,c=e.y.scaleFactor,l=e.x.scaleFactor;e.plot={},this.config.plot.vertical?(s=e.y.min,n=e.y.max,e.plot.vertical=!0):(s=e.x.min,n=e.x.max,e.plot.vertical=!1),e.plot.barSpacing=this.config.plot.spacing/100;let u=Math.abs(n-s),p=Math.abs(s)/u*100;if(this.config.plot.stacked){this._createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:l,scaleY:c,barSpacing:a,originPoint:p});return}if(Array.isArray(t[0].values))if(this.config.plot.vertical){let h=l/t.length,g=h*(1-a*2);t.forEach((f,m)=>{f.type!=="line"&&f.values.forEach((b,v)=>{let x;b>0?x=(e.y.max-b)*c+"%":x=(100-p).toFixed(3)+"%";let w=l*v;w+=h*m,w+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${m}`,`plot-node-${m}`],index:v,plot:m,"data-series":m,"data-index":v,"data-value":b,height:Math.abs(b)*c,x:w+"%",width:g+"%",y:x,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f.name||"Series "+(m+1)}, ${v}: ${b}`}))})})}else{let h=c/t.length,g=h*(1-a*2);t.forEach((f,m)=>{f.type!=="line"&&f.values.forEach((b,v)=>{let x,w=Math.abs(b)*l;b>0?x=p.toFixed(3)+"%":x=Number(p.toFixed(3))-w+"%";let C=100-c*(v+1);C+=h*m,C+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${m}`,`plot-node-${m}`],index:v,plot:m,"data-series":m,"data-index":v,"data-value":b,y:C+"%",width:w+"%",height:g+"%",x,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${f.name||"Series "+(m+1)}, ${v}: ${b}`}))})})}else if(this.config.plot.vertical){let h=l/t.length,g=h*(1-a*2);e.x.keys.forEach((f,m)=>{t.forEach((b,v)=>{if(b.type!=="line"&&b.values[f]!=null){let x,w=b.values[f];w>0?x=(e.y.max-w)*c+"%":x=(100-p).toFixed(3)+"%";let C=l*m;C+=h*v,C+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:m,plot:v,"data-series":v,"data-key":f,"data-value":w,height:Math.abs(w)*c,x:C+"%",width:g+"%",y:x,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${b.name||"Series "+(v+1)}, ${f}: ${w}`}))}})})}else{let h=c/t.length,g=h*(1-a*2);e.y.keys.slice().reverse().forEach((m,b)=>{t.forEach((v,x)=>{if(v.type!=="line"&&v.values[m]!=null){let w=v.values[m],C,k=Math.abs(w)*l;w>0?C=p.toFixed(3)+"%":C=Number(p.toFixed(3))-k+"%";let S=100-c*(b+1);S+=h*x,S+=h*a,i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:b,plot:x,"data-series":x,"data-key":m,"data-value":w,y:S+"%",width:k+"%",height:g+"%",x:C,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${v.name||"Series "+(x+1)}, ${m}: ${w}`}))}})})}this._renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}),this.config.plot.label.enabled&&this._renderDataLabels({data:t,stats:e,subchartNoStretch:o,scaleX:l,scaleY:c,barSpacing:a})}_renderDataLabels({data:t,stats:e,subchartNoStretch:i,scaleX:o,scaleY:s,barSpacing:n}){if(!i)return;let a=!Array.isArray(t[0].values),c=this.config.plot.vertical,l=this.config.plot.label.format,u=t.filter(d=>d.type!=="line").length;t.forEach((d,p)=>{if(d.type==="line")return;let h=a?(c?e.x.keys:e.y.keys).map(g=>({key:g,value:d.values[g]})):d.values.map((g,f)=>({key:f,value:g}));h.forEach(({key:g,value:f},m)=>{if(f==null)return;let b=l?l(f,g):String(f);if(c){let v=o,x=v/u,w=v*m+x*p+x/2+x*n,C=(e.y.max-f)*s,k=new y("text",{x:w+"%",y:C-1+"%","text-anchor":"middle",class:["plot-node-label",`plot-node-label-${p}`]});k.textContent=b,i.appendChild(k)}else{let v=s,x=v/u,w=h.length-1-m,C=100-v*(w+1)+x*p+x/2,k=Math.abs(f)*o,S=new y("text",{x:k+1+"%",y:C+"%","alignment-baseline":"middle",class:["plot-node-label",`plot-node-label-${p}`]});S.textContent=b,i.appendChild(S)}})})}_renderLineSeries({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){let s=!Array.isArray(t[0].values),n=this.config.plot.vertical,a=e.x.scaleFactor,c=e.y.scaleFactor;t.forEach((l,u)=>{if(l.type!=="line")return;let d=n?e.x.keys:e.y.keys,p=s?d.map(m=>l.values[m]??null):l.values,h=[],g=!1;for(let m=0;m<p.length;m++){if(p[m]==null){g=!1;continue}let b=n?m*a+a/2:(e.y.max-p[m])*c,v=n?(e.y.max-p[m])*c:100-(m*c+c/2);g?h.push(`L ${b.toFixed(2)} ${v.toFixed(2)}`):h.push(`M ${b.toFixed(2)} ${v.toFixed(2)}`),g=!0}if(h.length===0)return;let f=new y("path",{d:h.join(" "),fill:"none",class:["plot",`plot-${u}`],style:"vector-effect: non-scaling-stroke"});if(i.appendChild(f),o)for(let m=0;m<p.length;m++){if(p[m]==null)continue;let b=n?m*a+a/2+"%":(e.y.max-p[m])*c+"%",v=n?(e.y.max-p[m])*c+"%":100-(m*c+c/2)+"%",x=s&&d?d[m]:m,w=l.name||"Series "+(u+1);o.appendChild(new y("circle",{cx:b,cy:v,r:4,class:["plot-node",`plot-node-${u}`],node:m,plot:u,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${w}, ${x}: ${p[m]}`}))}})}_createStackedPlot({data:t,stats:e,subchartStretch:i,scaleX:o,scaleY:s,barSpacing:n,originPoint:a}){let c=!Array.isArray(t[0].values),l=this.config.plot.vertical,u=l?o:s,d=u,p=d*(1-n*2),h=c?l?e.x.keys:e.y.keys:Array.from({length:Math.max(...t.map(g=>g.values.length))},(g,f)=>f);h.forEach((g,f)=>{let m=0,b=0;t.forEach((v,x)=>{if(v.type==="line")return;let w=v.values[g];if(w==null)return;let C=Math.abs(w)*(l?s:o),k=v.name||"Series "+(x+1);if(l){let S;w>=0?(m+=w,S=(e.y.max-m)*s):(S=(e.y.max-b)*s,b+=w);let E=u*f+d*n;i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:f,plot:x,"data-series":x,"data-key":c?g:void 0,"data-index":c?void 0:f,"data-value":w,x:E+"%",y:S+"%",width:p+"%",height:C+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}else{let S;w>=0?(S=a+m*o,m+=w):(b+=w,S=a+b*o);let E=h.length-1-f,A=100-u*(E+1)+d*n;i.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:f,plot:x,"data-series":x,"data-key":c?g:void 0,"data-index":c?void 0:f,"data-value":w,x:S+"%",y:A+"%",width:C+"%",height:p+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}})})}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},a=1,c="",l=i.stats,d=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientX-d.left)/d.width,h=Math.floor(p*l.x.scaleLength),g=0,f=0,m=i.data,b;l.associative&&(b=l.x.keys[h]),m.forEach(function(C){l.associative&&C.values[b]!=null?(g+=C.values[b],f++):!l.associative&&C.values[h]!=null&&(g+=C.values[h],f++)});let v=(l.y.max-g/f)*l.y.scaleFactor;isNaN(v)&&(v=l.y.max*l.y.scaleFactor);let x=l.x.scaleFactor*h+l.x.scaleFactor/2,w=Number(v.toFixed(2));return isNaN(x)||isNaN(w)||h<0||h>=l.x.scaleLength?null:(l.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=x+a,n.tooltip.y=w,m.forEach(function(C,k){let S=$(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let E=l.associative?i.data[k].values[b]:i.data[k].values[h],A=l.associative?b:h,L;if(i.config.tooltip.format)try{L=$(String(i.config.tooltip.format(A,E)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),L=`(${$(String(A))} : ${$(String(E))})`}else L=`(${$(String(A))} : ${$(String(E))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${L}
          </div>`}}),n.tooltip.text=c,n.index=h,n)}}};var tt=class extends Y{static get type(){return"bar"}static get defaults(){return{plot:{vertical:!1}}}tooltipLocation(t,e,i){return function(s){let n={tooltip:{},crosshair:{}},a=1,c="",l=i.stats,d=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientY-d.top)/d.height;l.associative&&(p=1-p);let h=l.y.scaleLength-1-Math.floor(p*l.y.scaleLength),g=0,f=0,m=i.data,b;l.associative&&(i.config.plot.vertical?b=l.x.keys[h]:b=l.y.keys[h]),m.forEach(function(C){l.associative&&C.values[b]!=null?(g+=C.values[b],f++):!l.associative&&C.values[h]!=null&&(g+=C.values[h],f++)});let v=g/f*l.x.scaleFactor;isNaN(v)&&(v=l.x.max*l.x.scaleFactor);let x=Number(v.toFixed(2)),w=100*Number(p.toFixed(2));return isNaN(x)||isNaN(w)||h<0||h>=l.x.scaleLength?null:(l.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=x+a,n.tooltip.y=w+a,m.forEach(function(C,k){let S=$(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let E,A=l.associative?i.data[k].values[b]:i.data[k].values[h],L=l.associative?b:h;if(i.config.tooltip.format)try{E=$(String(i.config.tooltip.format(L,A)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),E=`(${$(String(L))} : ${$(String(A))})`}else E=`(${$(String(L))} : ${$(String(A))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${E}
          </div>`}}),n.tooltip.text=c,n.index=h,n)}}};var G=class extends R{static get type(){return"scatter"}static get defaults(){return{plot:{size:4}}}static specs(){return{"plot.node":{fill:"primary"}}}tooltipLocation(t,e,i){return function(s){t.nodeMap||(t.nodeMap=de(e));let n={tooltip:{},crosshair:{}},a=1,c="",u=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-u.left)/u.width,p=(s.clientY-u.top)/u.height;d=Math.floor(d*100),p=Math.floor(p*100);let h=Math.floor(d/10),g=parseInt((d/10).toFixed(1).split(".")[1]),f=Math.floor(p/10),m=null,b=[[0,0],[-1,0],[1,0],[0,-1],[0,1]];for(let v=0;v<b.length;v++){let x=f+b[v][0],w=h+b[v][1];if(x>=0&&x<10&&w>=0&&w<10&&t.nodeMap[x]&&t.nodeMap[x][w]){let C=t.nodeMap[x][w][g];if(!C){for(let k=Math.max(0,g-1);k<=Math.min(9,g+1);k++)if(t.nodeMap[x][w][k]){C=t.nodeMap[x][w][k];break}}if(C){m=C;break}}}if(m)return n.crosshair.x1=-1,n.crosshair.x2=-1,n.crosshair.y1=-1,n.crosshair.y2=-1,n.tooltip.x=d+a,n.tooltip.y=p,m.forEach(v=>{let x=v.getAttribute("data-series"),w=v.getAttribute("data-index"),C=i.data[x].values[w],k=$(i.data[x].name||"Series "+x),S;if(i.config.tooltip.format)try{S=$(String(i.config.tooltip.format(k,C)))}catch(E){console.warn("SVC: tooltip.format threw an error:",E),S=$(String(C))}else S=$(String(C));c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${x}">${k}</span> : (${S})
        </div>`}),n.tooltip.text=c,n}}createPlot({data:t,stats:e,subchartNoStretch:i}){t.forEach((o,s)=>{o.values.forEach((a,c)=>{let l=a[0],u=a[1],d=o.name||`Series ${s+1}`,p=new y("circle",{cx:((l-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-u)*e.y.scaleFactor).toFixed(3)+"%",r:this.config.plot.size,class:["plot-node",`plot-${s}`,`plot-node-${s}`],"data-index":c,"data-series":s,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${d}, (${l}, ${u})`});i.appendChild(p)})})}};function de(r){let t=Array.from(new Array(10)).map(()=>Array.from(new Array(10)).map(()=>[]));return r.querySelectorAll(".svc-plot-node").forEach(e=>{let i=parseInt(e.getAttribute("data-series")||"0",10),o=parseInt(e.getAttribute("cx")||"0"),s=parseInt(e.getAttribute("cy")||"0"),n=Math.min(9,Math.floor(o/10)),a=parseInt((o/10).toFixed(1).split(".")[1]),c=Math.min(9,Math.floor(s/10));t[c][n][a]=t[c][n][a]||[],t[c][n][a][i]=e}),t}var at=class extends G{static get type(){return"bubble"}static get defaults(){return{plot:{maxSize:4,node:{}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:i,subchartNoStretch:o}){t.forEach((s,n)=>{s.values.forEach((c,l)=>{let u=c[0],d=c[1],p=c[2],h=s.name||`Series ${n+1}`,g=e.alt.max-e.alt.min||1,f=(Math.abs(p)-e.alt.min)/g,m=new y("circle",{cx:((u-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-d)*e.y.scaleFactor).toFixed(3)+"%",r:f*this.config.plot.maxSize+.5+"%",style:`opacity: ${.7}`,class:["plot-node",`plot-${n}`,`plot-node-${n}`],"data-index":l,"data-series":n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${h}, (${u}, ${d}), size: ${p}`});o.appendChild(m)})})}};var X=class extends J{static get type(){return"pie"}static get defaults(){return{plot:{ring:!1,node:{label:{enabled:!0,placement:"auto",scaleBySize:!0,limitBySize:!0,multiplier:1,threshold:12,style:{"font-size":"clamp(8px, 0.6vmin, 16px)"}}}},center:{size:"40%",style:{fill:"#fff"},label:{style:{"font-size":"5vmin",transform:"translate(0%, -50%)","text-align":"center"},container:{style:{display:"flex","justify-content":"center","align-items":"center"}},title:{style:{"font-size":"7vmin"}}}}}}static specs(){return{plot:{fill:"primary"},"plot.node":{fill:"primary"}}}parse(t){t=super.parse(t);let{layoutChart:e}=t,i=this.createGraph({stretch:!0});e.appendChild(i);let o=this.createGraph({stretch:!1});e.appendChild(o),this.createPlot({layoutChart:e,subchartStretch:i,subchartNoStretch:o}),o.appendChild(new y("g"));let s=new y("style");return s.innerHTML=".plot {opacity: 1;}.svc-loading {opacity:0;}",e.appendChild(s),t}createScript(){return new N({stats:this.stats,data:this.data,config:this.config}).render()}createPlot({layoutChart:t,subchartStretch:e,subchartNoStretch:i}){let o=this.data;if(!B(o))throw new Error('SVC: Pie chart "data" must be a plain object with numeric values, e.g. { "Apples": 30, "Oranges": 70 }.');Object.keys(o).forEach(u=>{if(typeof o[u]!="number")throw new Error(`SVC: Pie chart value for "${u}" must be a number.`);if(o[u]<0)throw new Error(`SVC: Pie chart value for "${u}" is negative (${o[u]}). Pie charts require non-negative values.`)});let s=Object.keys(o).reduce((u,d)=>u+=o[d],0);if(s===0){let u=new y("text",{x:"50%",y:"50%","text-anchor":"middle","alignment-baseline":"middle",class:["loading"]});u.textContent="No data",i.appendChild(u);return}let n=0,a=0,c=this.config.plot.node.instances.map(u=>u.fill);Object.keys(o).forEach((u,d)=>{let p=o[u],h=p/s,g=n/s,f=c[a%c.length],m=this.calculateSlice(h,g),b=this.createSlice(m,f,d,p,s,u);i.appendChild(b),a++,n+=p});let l=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]});if(this.config.plot.ring){let d=(parseFloat(this.config.center.size)||40)/2;l.appendChild(new y("circle",{cx:"50",cy:"50",r:String(d),fill:"var(--color-surface, #fff)",class:["center"]}))}i.appendChild(l)}calculateSlice(t,e){let o=Math.cos((e+t)*2*Math.PI)*50+50,s=Math.sin((e+t)*2*Math.PI)*50+50,n=Math.cos(e*2*Math.PI)*50+50,a=Math.sin(e*2*Math.PI)*50+50,c=e*360,l=t*360+c,u=(l+c)/2,d=50+50*Math.cos(u*2*Math.PI/360),p=50+50*Math.sin(u*2*Math.PI/360);d=(d+50)*.5,p=(p+50)*.5;let h=l-c;return{radius:50,degrees:u,degreeLength:h,start:{x:o,y:s},end:{x:n,y:a},center:{x:d,y:p}}}createSlice(t,e,i,o,s,n){let{radius:a,start:c,end:l,center:u,degreeLength:d}=t,p=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]}),h=d>180?1:0,g=`M ${a} ${a}`,f=`L${c.x} ${c.y}`,m=`A ${a} ${a} 0 ${h} 0 ${l.x} ${l.y}`,b=(o/s*100).toFixed(0);if(p.appendChild(new y("path",{fill:e,style:"vector-effect: non-scaling-stroke",d:`${g} ${f} ${m} Z`,"alignment-baseline":"middle","text-anchor":"middle","data-key":n,"data-value":o,tabindex:"0",class:["plot-node",`plot-node-${i}`],role:"graphics-symbol","aria-roledescription":"slice","aria-label":`${n}: ${b}%`})),this.config.plot.node.label.enabled){let{multiplier:v,threshold:x,limitBySize:w,scaleBySize:C,placement:k}=this.config.plot.node.label,S=d<=x;if(k==="outside"||k==="auto"&&S){let A=t.degrees*Math.PI/180,L=55,T=62,_=50+48*Math.cos(A),W=50+48*Math.sin(A),P=50+L*Math.cos(A),O=50+L*Math.sin(A),I=50+T*Math.cos(A),ct=50+T*Math.sin(A),Wt=Math.cos(A)>=0?"start":"end";p.appendChild(new y("line",{x1:_.toFixed(1),y1:W.toFixed(1),x2:P.toFixed(1),y2:O.toFixed(1),stroke:"var(--chart-label-color, #737373)","stroke-width":"0.5",class:["plot-leader"]}));let zt=new y("text",{fill:"var(--chart-label-color, #737373)",x:I.toFixed(1),y:ct.toFixed(1),"alignment-baseline":"middle","text-anchor":Wt,style:"font-size: 0.35em;",class:["plot-node-label",`plot-node-label-${i}`]});zt.innerHTML=`${$(n)} ${b}%`,p.appendChild(zt)}else if(!this.config.plot.ring){let A;C&&(A=.37*v*(d/100));let L=new y("text",{fill:"#fff",x:u.x,y:u.y,style:C?`font-size: ${M(A)}em;`:"","alignment-baseline":"middle","text-anchor":"middle",class:w&&d>x||!w?["plot-node-label"]:["plot-node-label","hide"]});L.innerHTML=b+"%",p.appendChild(L)}}return p}tooltipLocation(t,e,i){return function(s){let n=e.querySelector("chart-plot");if(!n)return null;let a=n.getBoundingClientRect(),c=n.querySelector(".svc-nodeGroup"),l=c?c.getBoundingClientRect():a,u=l.left+l.width/2,d=l.top+l.height/2,p=s.clientX-u,h=s.clientY-d,g=Math.min(l.width,l.height)/2,f=Math.sqrt(p*p+h*h);if(f>g)return null;if(i.config.plot.ring){let O=parseFloat(i.config.center.size)||40,I=g*(O/100);if(f<I)return null}let m=Math.atan2(h,p);m<0&&(m+=2*Math.PI);let b=m/(2*Math.PI),v=(s.clientX-a.left)/a.width*100,x=(s.clientY-a.top)/a.height*100,w=i.data,C=Object.keys(w),k=C.reduce(function(O,I){return O+(w[I]||0)},0);if(k===0)return null;let S=0,E=null,A=0,L=0;for(let O=0;O<C.length;O++){let I=w[C[O]]||0,ct=I/k;if(b>=S&&b<S+ct){E=C[O],A=I,L=O;break}S+=ct}if(!E)return null;let T=(A/k*100).toFixed(1),_={tooltip:{},crosshair:{x1:-10,x2:-10,y1:-10,y2:-10}};_.tooltip.x=v,_.tooltip.y=x;let W=$(String(E)),P;if(i.config.tooltip&&i.config.tooltip.format)try{P=$(String(i.config.tooltip.format(E,A)))}catch(O){console.warn("SVC: tooltip.format threw an error:",O),P=W+": "+T+"%"}else P=W+": "+T+"%";return _.tooltip.text='<div class="svc-tooltip-content"><span class="svc-tooltip-label-title svc-tooltip-label-title-'+L+'">'+W+"</span> : "+P+"</div>",_.index=L,_}}};var lt=class extends X{static get type(){return"pie"}static get defaults(){return{plot:{ring:!0}}}};var Ao=window.matchMedia("(prefers-reduced-motion: reduce)");var Ht=new Map;function qt(r,t,e={}){let i=e.priority??10,o={impl:t,bundle:e.bundle,contract:e.contract,priority:i},s=Ht.get(r);if(customElements.get(r)){if(!s||s.priority>=i){s&&s.priority===i&&s.impl!==t&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${r}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=i){s.priority===i&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}Ht.set(r,o),customElements.define(r,t)}var bt=class extends HTMLElement{#t=[];#e;connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&(this.setAttribute("data-upgraded",""),queueMicrotask(()=>{this.dispatchEvent(new CustomEvent(`${this.localName}:upgraded`,{bubbles:!0}))}))}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,i,o){t.addEventListener(e,i,o),this.#t.push(()=>t.removeEventListener(e,i,o))}_reinit(){for(let t of this.#t)t();this.#t=[],this.teardown(),this.removeAttribute("data-upgraded"),this.isConnected&&this.setup()!==!1&&this.setAttribute("data-upgraded","")}setup(){}teardown(){}setState(t,e){this.#e||(this.#e=this.attachInternals());let i=this.#e.states;try{e?i.add(t):i.delete(t)}catch{let o=`--${t}`;e?i.add(o):i.delete(o)}}_adoptInternals(t){this.#e||(this.#e=t)}};var he=0;function Yt(r,t,e="vb-vt"){if(!r?.isConnected||typeof document>"u"||!("startViewTransition"in document)||matchMedia("(prefers-reduced-motion: reduce)").matches)return t(),null;let i=`${e}-${++he}`;r.style.viewTransitionName=i;let o=document.startViewTransition(t);return o.finished.finally(()=>{r.style.viewTransitionName===i&&(r.style.viewTransitionName="")}),o}function Ot(r){let t=r.textContent.trim();if(!t)return null;let e=t.replace(/[$€£¥,% ]/g,""),i=Number(e);return Number.isFinite(i)?i:null}function ue(r){let t=[...r.cells],e=-1,i=[];for(let o=0;o<t.length;o++){let s=t[o];if(!s.hasAttribute("data-chart-ignore")){if(s.hasAttribute("data-chart-label")||s.getAttribute("scope")==="row"){e=o;continue}(s.hasAttribute("data-chart-series")||!s.hasAttribute("data-chart-ignore"))&&i.push({index:o,name:s.textContent.trim()})}}if(e===-1&&t.length>0){let o=t[0];if(!o.textContent.trim()||o.tagName==="TH"){e=0;let s=i.findIndex(n=>n.index===0);s!==-1&&i.splice(s,1)}}return{labelIndex:e,columns:i}}function fe(r){let t=r.querySelector("thead"),e=r.querySelector("tbody")||r,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")];if(!i||o.length===0)return{data:[],config:{}};let{labelIndex:s,columns:n}=ue(i),a=s!==-1,c=n.map(d=>({name:d.name,values:a?{}:[]}));for(let d of o){let p=[...d.cells],h=a?p[s]?.textContent.trim()||"":null;for(let g=0;g<n.length;g++){let f=p[n[g].index],m=f?Ot(f):null;a&&h?c[g].values[h]=m??0:c[g].values.push(m??0)}}let l={},u=r.querySelector("caption");return u&&(l.title={text:u.textContent.trim(),enabled:!0}),{data:c,config:l}}function me(r){let e=[...(r.querySelector("tbody")||r).querySelectorAll("tr")],i={};for(let n of e){let a=[...n.cells],c=n.querySelector("th"),l=c?c.textContent.trim():a[0]?.textContent.trim(),u=c?a[1]||a[0]:a[1],d=u?Ot(u):null;l&&d!=null&&(i[l]=d)}let o={},s=r.querySelector("caption");return s&&(o.title={text:s.textContent.trim(),enabled:!0}),{data:i,config:o}}function ge(r){let t=r.querySelector("thead"),e=r.querySelector("tbody")||r,i=t?.querySelector("tr"),o=[...e.querySelectorAll("tr")],s=new Map;for(let l of o){let u=[...l.cells],d=l.querySelector("th"),p=d?d.textContent.trim():"Data",h=d?[...l.querySelectorAll("td")]:u.slice(1);s.has(p)||s.set(p,[]);let g=h.map(f=>Ot(f)).filter(f=>f!=null);g.length>=2&&s.get(p).push(g)}let n=[...s.entries()].map(([l,u])=>({name:l,values:u})),a={},c=r.querySelector("caption");return c&&(a.title={text:c.textContent.trim(),enabled:!0}),{data:n,config:a}}function Gt(r,t){if(!r||!r.querySelector("tbody, tr"))return{data:null,config:{}};let e=(t||"").toLowerCase();return e==="pie"||e==="ring"?me(r):e==="scatter"||e==="bubble"?ge(r):fe(r)}function Xt(r){let t={};return r.hasAttribute("data-tooltip")&&(t.tooltip={enabled:!0}),r.hasAttribute("data-legend")&&(t.legend={enabled:!0}),r.hasAttribute("data-grid")&&(t.guides={x:{enabled:!0},y:{enabled:!0}}),r.hasAttribute("data-labels")&&(t.plot={node:{label:{enabled:!0}}}),t}function ye(r){let t=getComputedStyle(r),e=[];for(let i=1;i<=6;i++){let o=t.getPropertyValue(`--chart-series-${i}`).trim();o&&e.push(o)}return e.length>0?e:null}function F(r,t){return r.getPropertyValue(t).trim()||null}function _t(r){let t=getComputedStyle(r),e={},i=F(t,"--chart-label-color"),o=F(t,"--chart-font-family");(i||o)&&(e.style={},i&&(e.style.color=i),o&&(e.style["font-family"]=o));let s=F(t,"--chart-axis-color");s&&(e.axis={style:{stroke:s}});let n=F(t,"--chart-grid-color");n&&(e.guides={style:{stroke:n}});let a=F(t,"--chart-baseline-color");a&&(e.baseline={style:{stroke:a}});let c=F(t,"--chart-tick-color");c&&(e.ticks={style:{stroke:c}});let l=F(t,"--chart-title-color"),u=F(t,"--chart-title-size");(l||u)&&(e.title=e.title||{},e.title.style={},l&&(e.title.style.color=l),u&&(e.title.style["font-size"]=u));let d=F(t,"--chart-subtitle-color"),p=F(t,"--chart-subtitle-size");(d||p)&&(e.title=e.title||{},e.title.subtitle=e.title.subtitle||{},e.title.subtitle.style={},d&&(e.title.subtitle.style.color=d),p&&(e.title.subtitle.style["font-size"]=p));let h=F(t,"--chart-tooltip-bg"),g=F(t,"--chart-tooltip-color"),f=F(t,"--chart-tooltip-shadow");(h||g||f)&&(e.tooltip=e.tooltip||{},e.tooltip.label=e.tooltip.label||{},e.tooltip.label.style={},h&&(e.tooltip.label.style["background-color"]=h),g&&(e.tooltip.label.style.color=g),f&&(e.tooltip.label.style["box-shadow"]=f));let m=ye(r);return m&&(e.palette=m),e}function Kt(r){return{name:"vb-theme-bridge",hooks:{configResolved({config:t}){let e=_t(r);e.style&&(t.style=Object.assign({},e.style,t.style)),e.palette&&!t._paletteFromUser&&(t.palette=e.palette)}}}}function be(r){return typeof r=="number"&&Number.isFinite(r)?r.toLocaleString():r==null?"":String(r)}function z(r,t,e,i){let o=document.createElement(t);return o.textContent=be(e),i&&(o.scope=i),r.append(o),o}function Ft(r,t){let e=r.createTHead().insertRow();t.forEach(i=>z(e,"th",i,"col"))}function Zt({data:r,type:t,caption:e,labelX:i,labelY:o}){if(r==null||typeof r!="object")return null;let s=document.createElement("table");s.createCaption().textContent=e||"Chart data";let n=s.createTBody();if(!Array.isArray(r)){Ft(s,[i||"Label",o||"Value"]);for(let[u,d]of Object.entries(r)){let p=n.insertRow();z(p,"th",u,"row"),z(p,"td",d)}return s}let a=r.filter(u=>u&&typeof u=="object");if(!a.length)return null;if(t==="scatter"||t==="bubble"){let u=a.some(d=>Array.isArray(d.values)&&d.values.some(p=>Array.isArray(p)&&p.length>2));return Ft(s,["Series",i||"X",o||"Y",...u?["Size"]:[]]),a.forEach((d,p)=>{for(let h of Array.isArray(d.values)?d.values:[]){if(!Array.isArray(h))continue;let g=n.insertRow();z(g,"th",d.name??`Series ${p+1}`,"row"),z(g,"td",h[0]),z(g,"td",h[1]),u&&z(g,"td",h[2])}}),s}let c=[],l=new Set;for(let u of a){let d=u.values??{},p=Array.isArray(d)?d.map((h,g)=>String(g+1)):Object.keys(d);for(let h of p)l.has(h)||(l.add(h),c.push(h))}Ft(s,[i||"",...a.map((u,d)=>u.name??`Series ${d+1}`)]);for(let u of c){let d=n.insertRow();z(d,"th",u,"row");for(let p of a){let h=p.values??{};z(d,"td",Array.isArray(h)?h[Number(u)-1]:h[u])}}return s}var Pt="table:not([data-chart-generated])",xe={line:q,area:rt,bar:tt,column:Y,pie:X,ring:lt,scatter:G,bubble:at};function K(r,t=null){if(r==null)return t;if(typeof r!="string")return r;try{return JSON.parse(r)}catch{return t}}function Z(r,t){if(!t||typeof t!="object"||Array.isArray(t))return r;for(let e of Object.keys(t))t[e]&&typeof t[e]=="object"&&!Array.isArray(t[e])?((!r[e]||typeof r[e]!="object")&&(r[e]={}),Z(r[e],t[e])):r[e]=t[e];return r}var Nt=class extends bt{static get observedAttributes(){return["data-type","data-values","data-config","data-title","data-subtitle","data-legend","data-tooltip","data-palette","data-label-x","data-label-y","data-size","data-chart"]}#t=null;#e=null;#s=null;#r=!1;#i=null;#o=null;set data(t){this.#t!==t&&(this.#t=t,this.#n(),this.#l("property"))}get data(){return this.#t}set config(t){this.#e!==t&&(this.#e=t,this.#n(),this.#l("property"))}get config(){return this.#e}#l(t){this.dispatchEvent(new CustomEvent("chart-wc:data-changed",{detail:{data:this.#t,config:this.#e,source:t},bubbles:!0}))}refresh(){this.#n()}toSVG(){return this.#i?.querySelector("svg")?.outerHTML||null}setup(){this.#n()}teardown(){this.#a()}attributeChangedCallback(){this.hasAttribute("data-upgraded")&&this.#n()}#n(){!this.isConnected||this.#r||(this.#r=!0,Promise.resolve().then(()=>{this.#r=!1,this.isConnected&&this.#b()}))}#d(){let t=(this.dataset.type||"").toLowerCase();return t||(t=(this.querySelector(Pt)?.dataset.type||"bar").toLowerCase()),xe[t]||tt}#p(){if(this.#t!=null)return{data:K(this.#t,null),tableConfig:{}};let t=this.dataset.values;if(t!=null)return{data:K(t,null),tableConfig:{}};let e=this.querySelector('script[type="application/json"]');if(e)return{data:K(e.textContent,null),tableConfig:{}};let i=this.querySelector("template[data-chart-data]");if(i){let s=i.content?.textContent||i.innerHTML;return{data:K(s,null),tableConfig:{}}}let o=this.querySelector(Pt);if(o){let s=(this.dataset.type||o.dataset.type||"bar").toLowerCase(),{data:n,config:a}=Gt(o,s),c=Xt(o),l=Z(Z({},a),c);return{data:n,tableConfig:l}}return null}#h(t={}){let e=_t(this),i=K(this.#e,{})||{},o=K(this.dataset.config,{})||{},s={};s=Z(s,e),s=Z(s,t),s=Z(s,i),s=Z(s,o);let n=this.dataset.labelX,a=this.dataset.labelY;if(s.axis=s.axis||{},s.axis.label=s.axis.label||{},n!=null?s.axis.label.x={text:n,enabled:!0}:s.axis.label.x?.text||(s.axis.label.x=s.axis.label.x||{},s.axis.label.x.enabled=!1),a!=null?s.axis.label.y={text:a,enabled:!0}:s.axis.label.y?.text||(s.axis.label.y=s.axis.label.y||{},s.axis.label.y.enabled=!1),s.plot?.node?.label?.scaleBySize||(s.plot=s.plot||{},s.plot.node=s.plot.node||{},s.plot.node.label=s.plot.node.label||{},s.plot.node.label.scaleBySize=!1),this.dataset.title!=null){let c={text:this.dataset.title,enabled:!0};this.dataset.subtitle!=null&&(c.subtitle=this.dataset.subtitle),s.title=c}if(this.dataset.legend!=null&&(s.legend={enabled:!0}),this.dataset.tooltip!=null&&(s.tooltip={enabled:!0}),this.dataset.palette!=null){let c=K(this.dataset.palette,null);c&&(s.palette=c)}return this.dataset.size==="sparkline"&&(s.axis=s.axis||{},s.axis.x={...s.axis.x||{},enabled:!1},s.axis.y={...s.axis.y||{},enabled:!1},s.axis.label=s.axis.label||{},s.axis.label.x={...s.axis.label.x||{},enabled:!1},s.axis.label.y={...s.axis.label.y||{},enabled:!1},s.ticks=s.ticks||{},s.ticks.x={...s.ticks.x||{},enabled:!1},s.ticks.y={...s.ticks.y||{},enabled:!1},s.guides=s.guides||{},s.guides.x={...s.guides.x||{},enabled:!1},s.guides.y={...s.guides.y||{},enabled:!1},s.title={enabled:!1},s.legend={enabled:!1},s.tooltip={enabled:!1}),s.plugins=s.plugins||[],s.plugins.push(Kt(this)),s}#u(){if(this.#o&&this.contains(this.#o))return;this.#o=document.createElement("div"),this.#o.setAttribute("data-chart-svg",""),this.#o.setAttribute("aria-hidden","true"),this.appendChild(this.#o);let t=this.#o.attachShadow({mode:"open"}),e=document.createElement("style");e.textContent=`
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
    `,t.appendChild(e),this.#i=document.createElement("div"),this.#i.style.cssText="width:100%;height:100%;overflow:visible;",t.appendChild(this.#i)}#f(t){if(!t)return;let e=t.hasAttribute("data-chart-generated"),i=this.dataset.chart||t.dataset.chart||"replace";if(!e&&i!=="replace"){this.#c(t);return}t.classList.contains("visually-hidden")||(t.classList.add("visually-hidden"),t.setAttribute("data-chart-hidden",""))}#c(t){t?.hasAttribute("data-chart-hidden")&&(t.classList.remove("visually-hidden"),t.removeAttribute("data-chart-hidden"))}#m(t,e,i){let o=this.querySelector(":scope > table[data-chart-generated]"),s=[this.dataset.title??i?.title?.text,this.dataset.subtitle].filter(Boolean).join(" \u2014 "),n=Zt({data:t,type:e,caption:s,labelX:this.dataset.labelX,labelY:this.dataset.labelY});return n?(n.setAttribute("data-chart-generated",""),o?.hasAttribute("data-chart-hidden")&&(n.classList.add("visually-hidden"),n.setAttribute("data-chart-hidden","")),o?o.replaceWith(n):this.prepend(n),n):(o?.remove(),null)}#g(t,e){let i=this.#o;i&&(t?(i.setAttribute("aria-hidden","true"),i.removeAttribute("role"),i.removeAttribute("aria-label")):(i.removeAttribute("aria-hidden"),i.setAttribute("role","img"),i.setAttribute("aria-label",this.dataset.title||e?.title?.text||"Chart")))}#y(){this.#i?.querySelectorAll("[tabindex]").forEach(t=>{t.setAttribute("tabindex","-1")})}#b(){let t=this.#d(),e=this.#p();if(!e||!e.data){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:"No chart data found"},bubbles:!0}));return}let{data:i,tableConfig:o}=e,s=this.#h(o),n=this.querySelector(Pt),a=(this.dataset.type||n?.dataset.type||"bar").toLowerCase(),c=n||this.#m(i,a,s),l=this.#s!=null,u=()=>{this.#a(),this.#u(),this.#i&&this.#i.classList.toggle("sparkline",this.dataset.size==="sparkline");try{this.dispatchEvent(new CustomEvent("chart-wc:config-resolved",{detail:{type:a,config:s},bubbles:!0}));let d=new t({config:s,data:i});this.#s=d,this.#i&&d.mount(this.#i),this.#y(),this.#o?.removeAttribute("hidden"),this.#f(c),this.#g(c,s),this.dispatchEvent(new CustomEvent("chart-wc:render",{detail:{type:a,seriesCount:Array.isArray(i)?i.length:Object.keys(i).length},bubbles:!0}))}catch(d){this.#a(),this.#o?.setAttribute("hidden",""),this.#c(c);let p=d instanceof Error?d.message:String(d);this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:p},bubbles:!0}))}};l?Yt(this,u,"chart-vt"):u()}#a(){this.#s&&(this.#s.destroy(),this.#s=null),this.#i&&(this.#i.innerHTML="")}};qt("chart-wc",Nt);
//# sourceMappingURL=vanilla-breeze-charts.js.map
