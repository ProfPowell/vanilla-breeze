function A(l){return String(l).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function at(l){let t=A(String(l));return t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\*(.+?)\*/g,"<em>$1</em>"),t=t.replace(/`(.+?)`/g,"<code>$1</code>"),t=t.replace(/\n/g,"<br>"),t}function z(l){if(!l||typeof l!="object"||Array.isArray(l))return!1;let t=Object.getPrototypeOf(l);return t===Object.prototype||t===null}function M(l){let t=l.toFixed(2);return parseFloat(t[t.length-1]==="0"?l.toFixed(1):t)}function lt(l){return t(l);function t(o){let i="";for(let s in o.options)if(Object.hasOwn(o.options,s)){let n=s,a=o.options[s];if(s==="class"){if(!Array.isArray(a))throw new Error("Wrong argument to class");a="",o.options[s].forEach(c=>{a+=(a===""?"":" ")+`svc-${c}`})}i+=(i===""?"":" ")+`${n}="${A(String(a))}"`}if(o.children.length>0){let s="";return o.children.forEach(function(n){s+=(i===""?"":" ")+t(n)}),`<${o.tagName}${e(i)}>${s}</${o.tagName}>`}else return typeof o.innerHTML<"u"?`<${o.tagName}${e(i)}>${o.innerHTML}</${o.tagName}>`:`<${o.tagName}${e(i)}></${o.tagName}>`}function e(o){return o===""?o:" "+o}}function G(l,t){return o(l,t);function e(i){return z(i)}function o(i,...s){if(!s.length)return i;let n=s.shift();if(e(i)&&e(n))for(let a in n)e(n[a])?(i[a]||Object.assign(i,{[a]:{}}),o(i[a],n[a])):Object.assign(i,{[a]:n[a]});return o(i,...s)}}function ct(l,t){let e=l,o=t.split(".");for(let i=0;i<o.length;i++)if(e=e[o[i]],!e)return!1;return!0}var dt=class{constructor(t="div",e={}){this.children=[],this.tagName=t,this.options={},Object.assign(this.options,e)}set textContent(t){this.innerHTML=A(t)}appendChild(t){this.children.push(t)}prependChild(t){this.children.unshift(t)}removeChild(t){let e=this.children.indexOf(t);e!==-1&&this.children.splice(e,1)}setAttrs(t){Object.assign(this.options,t)}setAttribute(t,e){this.options[t]=e}},y=dt;var ge=0,pt=class l{constructor(t,...e){this.config=e.reduce((o,i)=>G(o,i),{}),this.palette=t||l.defaultPalette(),z(this.palette[0])||(this.palette=this.palette.map(o=>({primary:o,secondary:o}))),this.defs=this.createDefs(),G(this.config.l,l.layoutProperties())}static layoutProperties(){return{wrap:{style:{background:"var(--color-surface, #fff)"}},top:{style:{"justify-content":"center","align-items":"center","padding-block":"0.5em 2em","padding-inline":"0.2em"}},ticks:{x:{style:{height:"10px"}},y:{style:{width:"1%"}}}}}static defaultPalette(){return[{primary:"var(--chart-series-1, #3b82f6)",secondary:"var(--chart-series-1, #3b82f6)"},{primary:"var(--chart-series-2, #ef4444)",secondary:"var(--chart-series-2, #ef4444)"},{primary:"var(--chart-series-3, #8b5cf6)",secondary:"var(--chart-series-3, #8b5cf6)"},{primary:"var(--chart-series-4, #f59e0b)",secondary:"var(--chart-series-4, #f59e0b)"},{primary:"var(--chart-series-5, #10b981)",secondary:"var(--chart-series-5, #10b981)"}]}createDefs(){let t=[];return z(this.palette[0])&&z(this.palette[0].primary)&&this.palette.forEach((e,o)=>{Object.keys(e).forEach(i=>{let{url:s,def:n}=this.generateGradient(e[i],o,i);e[i]=`url(#${s})`,t.push(n)})}),t}generateGradient(t,e,o){let i=t.orientation||"vertical",s="svc-grad-"+e+"-"+o+"-"+ge++,n=new y("linearGradient",{id:s,x1:"0%",y1:"0%",x2:i==="vertical"?"0%":"100%",y2:i==="vertical"?"100%":"0%"});return Object.keys(t).forEach(a=>{isNaN(parseInt(a))||n.appendChild(new y("stop",{offset:a+"%","stop-color":t[a]}))}),{url:s,def:n}}applyPalette(t){for(let o in t)if(Object.hasOwn(t,o)){let i=e(o,this.config);if(!i)continue;let s=t[o];i.instances||(i.instances=[]),this.palette.forEach((n,a)=>{let c={};for(let r in s)if(Object.hasOwn(s,r)){let h=s[r];Object.prototype.hasOwnProperty.call(n,h)?c[r]=n[h]:c[r]=h}i.instances[a]?Object.keys(c).forEach(r=>{typeof i.instances[a][r]>"u"&&(i.instances[a][r]=c[r])}):i.instances.push(c)})}function e(o,i){let s=o.split("."),n=i,a=!1;return s.forEach(c=>{n[c]?n=n[c]:a=!0}),a?null:n}}},et=pt;var ht=class{constructor(t){this.config=t}static get defaults(){return{l:{top:{breakpoint:{width:200,height:150}}},title:{enabled:!0,text:"Title",style:{"text-align":"center",width:"100%","font-weight":400,"font-size":"var(--chart-title-size, 1.4rem)",color:"var(--chart-title-color, #444)","text-anchor":"middle","alignment-baseline":"middle"},subtitle:{style:{"font-size":"var(--chart-subtitle-size, 0.9rem)",color:"var(--chart-subtitle-color, var(--chart-label-color, #737373))","font-weight":300}}}}}render(){let t=this.config.title,e=new y("div",{class:["title"]}),o=t.markdown!==!1&&ye(t.text),i=o?at(t.text):A(t.text);return t.subtitle&&typeof t.subtitle=="string"?e.innerHTML=`<span class="svc-title-text">${i}</span><div class="svc-subtitle">${Wt(t.subtitle,o)}</div>`:t.subtitle&&t.subtitle.text?e.innerHTML=`<span class="svc-title-text">${i}</span><div class="svc-subtitle">${Wt(t.subtitle.text,o)}</div>`:e.innerHTML=i,e}};function ye(l){return/\*\*.+?\*\*|\*.+?\*|`.+?`|\n/.test(String(l))}function Wt(l,t){return t?at(l):A(l)}var ut=ht;var be=0,ft=class{constructor({config:t,data:e}){this.config=t,this.data=e}static get defaults(){return{l:{},legend:{breakpoint:{width:300,height:275},enabled:!0,style:{margin:0,padding:0,"flex-direction":"column","flex-wrap":"wrap","justify-content":"center","background-color":"var(--color-surface, rgba(255,255,255,0.8))","z-index":2},item:{style:{display:"flex","align-items":"center",padding:"0.5em",color:"var(--chart-label-color, #616161)","white-space":"nowrap"}}}}}render(t,e,o,i){return this.createLegend(o)}createLegend(t){let e=new y("ul",{class:["legend"]}),o=be++;return(t!=="pie"?this.data.map((s,n)=>({name:s.name||"Series "+n,index:n})):Object.keys(this.data).map((s,n)=>({name:s,index:n}))).forEach(({name:s,index:n})=>{let a=this._getSeriesColor(n),c=new y("li",{class:["legend-item"]}),r=`legend-item-${n}-${o}`,h=new y("input",{type:"checkbox",id:r,"data-series":n,checked:"",style:`--_series-color: ${a}`});c.appendChild(h);let d=new y("label",{id:`legend-item-text-${n}-${o}`,for:r});d.textContent=s,c.appendChild(d),e.appendChild(c)}),e}_getSeriesColor(t){let e;return this.config.plot.instances&&this.config.plot.instances.length>0?e=this.config.plot.instances[t%this.config.plot.instances.length]:this.config.plot.node?.instances&&this.config.plot.node.instances.length>0&&(e=this.config.plot.node.instances[t%this.config.plot.node.instances.length]),e&&e.stroke?e.stroke:e&&e.fill?e.fill:"#777"}},mt=ft;var gt=class{constructor({stats:t,data:e,config:o,type:i}){this.data=e,this.config=o,this.type=i,i!=="pie"&&(this.min=t.y.min,this.max=t.y.max,this.stats=t)}static get defaults(){return{tooltip:{breakpoint:{width:275,height:275},enabled:!0,container:{style:{display:"flex"}},crosshair:{style:{"z-index":-1}},label:{style:{"background-color":"var(--chart-tooltip-bg, var(--color-surface, #fff))","box-shadow":"var(--chart-tooltip-shadow, 0 2px 4px rgba(0, 0, 0, 0.2))",color:"var(--chart-tooltip-color, var(--chart-label-color, #737373))",padding:"1em","z-index":2},title:{instances:[]}}}}}render(){return{tooltip:this.createDOM(),htmlTooltip:this._createHTMLTooltip()}}createDOM(){return this._createCartesianTooltip()}_createCartesianTooltip(){let t=new y("g",{id:"svc-tooltip-box",class:["tooltip","hide"]}),e=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"});return t.appendChild(e),t.appendChild(this._createTooltipForeignObject("svc-tooltip-label",["tooltip-label","hide"],{role:"tooltip","aria-live":"polite"})),t}_createRingTooltip(){let t=new y("g",{id:"svc-center-label-box",class:["tooltip","hide"]});return t.appendChild(this._createTooltipForeignObject("svc-center-label",["center-label"],{"aria-live":"polite"})),t}_createHTMLTooltip(){let t=new y("line",{class:["tooltip-crosshair"],y1:"-10%",y2:"-10%",x1:"-10%",x2:"-10%",stroke:"var(--chart-crosshair-color, #777)"}),e=new y("div",{id:"svc-tooltip-box",class:["tooltip","hide"],style:"position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"}),o=new y("div",{class:["tooltip-container"],style:"position:absolute;pointer-events:auto;"}),i=new y("div",{id:"svc-tooltip-label",class:["tooltip-label","hide"],role:"tooltip","aria-live":"polite"});return o.appendChild(i),e.appendChild(o),{crosshair:t,tooltipBox:e}}_createTooltipForeignObject(t,e,o){let i=new y("foreignObject",{class:["tooltip-fo"],width:"100%",height:"100%"}),s=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});i.appendChild(s),s.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let n=new y("div",{class:["tooltip-container"]});s.appendChild(n);let a=new y("div",{id:t,class:e,...o});return n.appendChild(a),i}},j=gt;var xe=`
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
`,Zt=xe;var yt=class{constructor(){this.sheet=Zt,this.rules=[]}addRule(t,e){let o="";Object.keys(e).forEach(i=>{o+=`${i}: ${e[i]};`}),this.sheet+=`.svc-${t}{${o}}`}addRaw(t){this.sheet+=t}convertconfig(t,e,o){let i={width:{},height:{}},s=c(t),n=a(i);return s+n;function a(r){let h="";return Object.keys(r).forEach(d=>{Object.keys(r[d]).forEach(p=>{let u=r[d][p],g=`@media(max-${d}: ${p}px){`,m=u.map(f=>`.svc-${f}.svc-${f}`);g+=m.join(","),g+="{ display: none; }",g+="}",h+=g})}),h}function c(r,h="",d="",p=[]){for(let u in r)if(u==="style"){let g="";for(let m in r[u])Object.hasOwn(r[u],m)&&(g+=`${m}:${r[u][m]};`);if(p.length===0)d+=`figure[data-chart-id] {${g}}`;else{let m=p.reduce((f,b)=>f+=(f===""?"":"-")+b,"");d+=`.svc-${m}{${g}}`}}else if(u==="instances"){let g=r[u];for(let m=0;m<e;m++){let f=g[m];if(!f)continue;let b="";for(let x in f)Object.hasOwn(f,x)&&(b+=`${x}:${f[x]};`);if(b!==""){let x=p.reduce((w,C)=>w+=(w===""?"":"-")+C,""),v=o?`[data-chart-id="${o}"] `:"";d+=`${v}.svc-${x}-${m} {${b}}`}}}else if(u==="breakpoint"){let g=p.reduce((m,f)=>m+=(m===""?"":"-")+f,"");i.width[r.breakpoint.width]?i.width[r.breakpoint.width].push(g):i.width[r.breakpoint.width]=[g],i.height[r.breakpoint.height]?i.height[r.breakpoint.height].push(g):i.height[r.breakpoint.height]=[g]}else typeof r[u]=="object"&&(p.push(u),d=c(r[u],u,d,p),p.pop());return d}}},Qt=yt;function ve({interactive:l=!1}={}){let t=new y("svg");t.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",role:l?"graphics-document":"img","aria-roledescription":"chart"});let e=new y("foreignObject",{width:"100%",height:"100%"});t.appendChild(e);let o=new y("body",{xmlns:"http://www.w3.org/1999/xhtml",style:"width:100%;height:100%;"});e.appendChild(o),o.appendChild(new y("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}));let i=new y("figure");o.appendChild(i);let s=new y("chart-title");i.appendChild(s);let n=new y("chart-body");i.appendChild(n);let a=new y("chart-canvas");n.appendChild(a);let c=new y("chart-label",{position:"y"});a.appendChild(c);let r=new y("chart-axis",{position:"y"});a.appendChild(r);let h=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-y"]});a.appendChild(h);let d=new y("chart-plot");a.appendChild(d);let p=new y("svg");p.setAttrs({width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plotarea"]}),d.appendChild(p);let u=new y("div"),g=new y("div"),m=new y("div"),f=new y("svg",{width:"100%",xmlns:"http://www.w3.org/2000/svg",class:["ticks-x"]});a.appendChild(f);let b=new y("chart-axis",{position:"x"});a.appendChild(b);let x=new y("chart-label",{position:"x"});a.appendChild(x),p.appendChild(new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]}));let v=new y("text",{x:"50%",y:"50%",class:["loading"]});return v.innerHTML="Loading Chart...",p.appendChild(v),{root:t,wrap:i,top:s,body:n,plotarea:d,layoutChart:p,layoutXAxis:b,layoutYTicks:h,layoutXTicks:f,layoutYAxis:r,layoutOriginRight:m,layoutOriginCenter:g,layoutXAxisLabel:x,layoutYAxisLabel:c,layoutOriginLeft:u}}var Jt=ve;var we=new Set(["onInteraction","onResize","onClick"]),bt=class{#t=new Map;register(t,e){this.#t.has(t)||this.#t.set(t,new Set),this.#t.get(t).add(e)}unregister(t,e){let o=this.#t.get(t);o&&o.delete(e)}run(t,e){if(we.has(t)&&typeof document>"u")return;let o=this.#t.get(t);if(o)for(let i of o)i(e)}registerPlugin(t){if(!(!t||!t.hooks))for(let[e,o]of Object.entries(t.hooks))this.register(e,o)}destroy(){this.#t.clear()}},te=bt;function xt(l){return JSON.stringify(l).replace(/<\//g,"<\\/").replace(/]]>/g,"]]\\>").replace(/<!--/g,"<\\!--").replace(/<\?/g,"<\\?")}var vt=class{hooks=new te;toFile(t={}){let e=c(t),o=`<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`,i=this.structure,{body:s}=i,n;e.includeScripts&&(n=this._createScripts(this.structure),s.appendChild(n));let a=this.compile(i.root);return e.includeScripts&&n&&s.removeChild(n),e.prerendered&&(a=a.slice(0,a.indexOf("svg")+3)+' data-prerendered=""'+a.slice(a.indexOf("svg")+3)),o+a;function c(r){if(typeof r=="object"&&r!==null){let h=!!r.prerendered,d=!h;return{prerendered:h,includeScripts:r.includeScripts??d}}return{prerendered:!!r,includeScripts:!0}}}toString(){return this.compile(this.structure.root)}toHTML({prerendered:t}={}){return this.compileHTML(this.structure,{prerendered:t})}async toBlob(t="image/svg+xml",{width:e=800,height:o=600}={}){if(typeof Blob>"u")throw new Error("SVC: toBlob() requires a browser environment.");let i=this.toString();if(t==="image/svg+xml")return new Blob([i],{type:"image/svg+xml"});if(t==="image/png"){if(typeof document>"u")throw new Error("SVC: PNG export requires a browser environment with Canvas.");return this._svgToPngBlob(i,e,o)}throw new Error(`SVC: Unsupported export type "${t}".`)}async toDataURL(t="image/svg+xml",e){if(typeof FileReader>"u")throw new Error("SVC: toDataURL() requires a browser environment with FileReader.");let o=await this.toBlob(t,e);return new Promise((i,s)=>{let n=new FileReader;n.onload=()=>i(n.result),n.onerror=s,n.readAsDataURL(o)})}async download(t="chart.svg",e){if(typeof document>"u")throw new Error("SVC: download() requires a browser environment.");let i=t.split(".").pop().toLowerCase()==="png"?"image/png":"image/svg+xml",s=await this.toBlob(i,e),n=URL.createObjectURL(s),a=document.createElement("a");a.href=n,a.download=t,document.body.appendChild(a),a.click(),document.body.removeChild(a),URL.revokeObjectURL(n)}_svgToPngBlob(t,e,o){return new Promise((i,s)=>{let n=document.createElement("canvas");n.width=e,n.height=o;let a=n.getContext("2d"),c=new Image,r=new Blob([t],{type:"image/svg+xml"}),h=URL.createObjectURL(r);c.onload=()=>{a.drawImage(c,0,0,e,o),URL.revokeObjectURL(h),n.toBlob(d=>{d?i(d):s(new Error("SVC: PNG export failed."))},"image/png")},c.onerror=()=>{URL.revokeObjectURL(h),s(new Error("SVC: Failed to load SVG for PNG export."))},c.src=h})}mount(t){if(!t||typeof document>"u")return null;t.innerHTML=this.toHTML(),this._state=this.hydrate(t),this._container=t;let e=t.host||t;return this._observeResize(e),this._state}createElement(){if(typeof document>"u")return null;let t=document.createElement("div");return this.mount(t),t}hydrate(t){if(!t)return null;let e={functions:[]};return this.interactions.forEach(o=>{e.functions[o.name]=o(e,t,this)}),this._state=e,this._container=t,e}update({data:t,config:e}={}){if(!this._container)return null;let o=this._container;return this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._state=null,t!=null&&(this.data=t),e!=null&&(G(this.config,e),this.config=this.applyConfigToDefaults(this.config).config),this.interactions=[],this.render(),o.innerHTML=this.toString(),this._state=this.hydrate(o),this._container=o,this._state}destroy(){this.hooks.run("beforeDestroy",{container:this._container,state:this._state}),this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._state&&this._state._tooltipCleanup&&this._state._tooltipCleanup(),this._container&&(this._container.innerHTML=""),this._state=null,this._container=null,this.hooks.destroy()}_observeResize(t){typeof ResizeObserver>"u"||(this._resizeObserver=new ResizeObserver(e=>{let o=e[0];o&&this.hooks.run("onResize",{width:o.contentRect.width,height:o.contentRect.height,container:t})}),this._resizeObserver.observe(t))}_createScripts(t){let e=new y("script",{class:["chart-script"]}),o="",i=[];return this.interactions.forEach(s=>{o+=s.toString()+`
`,i.push(s.name)}),o+=`
    var chart = {
      stats: ${xt(this.stats||{})},
      data: ${xt(this.data)},
      config: ${xt(this.config)}
    };
    var svgRoot = document.currentScript.closest('svg');
    var state = { functions: []};`,i.forEach(s=>{o+=`state.functions['${s}'] = ${s}(state, svgRoot, chart);`}),e.innerHTML=`//<![CDATA[
`+o+`
//]]>`,e}},ee=vt;function wt(l,t,e){var o=e.config&&e.config.tooltip&&e.config.tooltip.hideDelay||2e3,i=t.querySelector("chart-plot"),s=t.querySelector("#svc-tooltip-box"),n=t.querySelector("#svc-tooltip-label"),a=t.querySelector(".svc-tooltip-crosshair"),c=[],r=null,h=null;function d(){h=null}typeof window<"u"&&(window.addEventListener("scroll",d,{passive:!0}),window.addEventListener("resize",d,{passive:!0}));var p=null;typeof ResizeObserver<"u"&&(p=new ResizeObserver(d),p.observe(i));function u(){n.setAttribute("class","svc-tooltip-label svc-hide"),s.setAttribute("class","svc-tooltip svc-hide"),a.setAttribute("x1","-10%"),a.setAttribute("x2","-10%"),a.setAttribute("y1","-10%"),a.setAttribute("y2","-10%");for(var f=0;f<c.length;f++)c[f].classList.remove("svc-plot-node-active-"+f);c=[]}function g(){r&&clearTimeout(r),r=setTimeout(u,o)}i.addEventListener("mousedown",m),i.addEventListener("mousemove",m),l._tooltipCleanup=function(){r&&clearTimeout(r),i.removeEventListener("mousedown",m),i.removeEventListener("mousemove",m),typeof window<"u"&&(window.removeEventListener("scroll",d),window.removeEventListener("resize",d)),p&&(p.disconnect(),p=null)};function m(f){g();var b=l.functions.tooltipLocation(f,l,t,e);if(b){for(var x=t.querySelectorAll('.svc-plot-node[node="'+b.index+'"]'),v=0;v<c.length;v++)c[v].classList.remove("svc-plot-node-active-"+v);c=[];for(var w=0;w<x.length;w++)x[w].classList.add("svc-plot-node-active-"+w),c.push(x[w]);a.setAttribute("x1",b.crosshair.x1+"%"),a.setAttribute("x2",b.crosshair.x2+"%"),a.setAttribute("y1",b.crosshair.y1+"%"),a.setAttribute("y2",b.crosshair.y2+"%"),n.innerHTML=b.tooltip.text,n.setAttribute("class","svc-tooltip-label"),s.setAttribute("class","svc-tooltip"),h||(h=i.getBoundingClientRect());var C=h,k=n.getBoundingClientRect(),S=k.width/C.width*100,L=k.height/C.height*100,$=b.tooltip.x,E=b.tooltip.y,T=1;$+S>98&&($=$-S-T),$<0&&($=0),E+L>98&&(E=98-L),E<0&&(E=0);var O=s.querySelector("foreignObject");if(O)O.setAttribute("x",$+"%"),O.setAttribute("y",E+"%");else{var _=n.parentElement;_&&(_.style.left=$+"%",_.style.top=E+"%")}e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"tooltip",event:f,data:{index:b.index,tooltip:b.tooltip},element:s})}}}function Ct(l,t,e){l.toggles=Array.from(t.querySelectorAll("chart-legend input")),l.toggles.forEach(function(o){o.removeAttribute("onclick"),o.addEventListener("click",function(i){var s=i.target.getAttribute("data-series");l.toggles[s]=i.target.checked;var n=l.toggles[s]!==!1,a=n?1:0,c=t.getElementsByClassName("svc-plot-"+s)[0];c&&(c.style.opacity=a);for(var r=t.getElementsByClassName("svc-plot-node-"+s),h=0;h<r.length;h++)r[h].style.opacity=a;e&&e.hooks&&e.hooks.run&&e.hooks.run("onInteraction",{type:"legend-toggle",event:i,data:{series:s,visible:n},element:o})})})}function kt(l,t,e){var o=t.querySelectorAll('[role="graphics-symbol"]');if(o.length===0)return;var i=-1,s=t.querySelector("chart-plot");if(!s)return;s.setAttribute("tabindex","0"),s.addEventListener("keydown",function(c){if(c.key==="ArrowRight"||c.key==="ArrowDown")c.preventDefault(),i=Math.min(i+1,o.length-1),n(i);else if(c.key==="ArrowLeft"||c.key==="ArrowUp")c.preventDefault(),i=Math.max(i-1,0),n(i);else if(c.key==="Escape"){a();var r=t.querySelector("#svc-tooltip-label");r&&r.classList.add("svc-hide"),i=-1}});function n(c){a();var r=o[c];if(r){r.classList.add("svc-focus");var h=r.getAttribute("aria-label"),d=t.querySelector("#svc-tooltip-label");d&&h&&(d.textContent=h,d.classList.remove("svc-hide"))}}function a(){for(var c=0;c<o.length;c++)o[c].classList.remove("svc-focus")}}function St(l,t,e){var o=t.querySelector("chart-plot");if(!o)return;function i(n){var a=n.target.closest('[role="graphics-symbol"]');if(a){var c={type:"click",event:n,element:a,seriesIndex:parseInt(a.getAttribute("plot")||a.getAttribute("data-series")||"0",10),dataIndex:parseInt(a.getAttribute("node")||a.getAttribute("data-index")||a.getAttribute("index")||"0",10),key:a.getAttribute("data-key")||null,value:a.getAttribute("data-value")||null,label:a.getAttribute("aria-label")||""};e.hooks&&e.hooks.run&&e.hooks.run("onClick",c)}}o.addEventListener("click",i);var s=l._dataClickCleanup;l._dataClickCleanup=function(){s&&s(),o.removeEventListener("click",i)}}var Ce=0,$t=class l extends ee{#t;#i;constructor({config:t={},data:e}){if(super({config:t,data:e}),e==null)throw new Error('SVC: "data" is required. Pass an array of series objects or a plain object for pie charts.');this.data=e,this.palette=t.palette=t.palette||et.defaultPalette();let o=this.applyConfigToDefaults(t);this.#i=o.defs,this.config=o.config,Array.isArray(this.config.plugins)&&this.config.plugins.forEach(i=>this.hooks.registerPlugin(i)),this.hooks.run("configResolved",{config:this.config,data:this.data,chartType:this.constructor.type}),this.#t=new Qt,this._scopeId="c"+Ce++,this.interactions=[],this.structure=null,this.render()}get stylesheet(){return this.#t}get defs(){return this.#i}applyConfigToDefaults(t){let e=[],o=Object.getPrototypeOf(this);for(;o.constructor.name!=="Object";)o.constructor.defaults&&e.push(o.constructor.defaults),o=Object.getPrototypeOf(o);e=e.reverse();let i={legend:mt,tooltip:j};Object.keys(i).forEach(n=>{(!t[n]||t[n].enabled)&&e.push(i[n].defaults)}),t.title&&t.title.text&&e.push(ut.defaults);let s=new et(this.palette,...e,t);return s.applyPalette(l.specs()),s.applyPalette(this.constructor.specs(s.config)),s}static get defaults(){return{palette:et.defaultPalette(),style:{"font-family":"var(--chart-font-family, inherit)","font-weight":300,color:"var(--chart-label-color, #737373)"},legend:{enabled:!0},tooltip:{enabled:!0},plot:{node:{enabled:!0,instances:[],active:{instances:[]},label:{enabled:!1,instances:[]}},instances:[],style:{overflow:"visible"}},"plot-top":{style:{overflow:"visible"}},plotarea:{style:{fill:"var(--color-surface, #fff)",overflow:"visible"}},loading:{enabled:!0,style:{"font-size":"1.5em",fill:"var(--chart-label-color, #616161)","text-anchor":"middle"}}}}static specs(){return{"plot.node.label":{fill:"primary"},"tooltip.label.title":{color:"primary"}}}render(){this.config.title&&(this.title=new ut(this.config)),this.config.legend&&(this.legend=new mt({config:this.config,data:this.data,chart:this.chart}));let t=!!(this.config.tooltip?.enabled||this.config.legend?.enabled),e=Jt({interactive:t});e.wrap.setAttribute("data-chart-id",this._scopeId);let o=this.constructor.type||"chart";if(this.config.title&&this.config.title.text){let i=A(this.config.title.text);e.root.setAttribute("aria-label",i);let s=new y("desc");s.innerHTML=`${o} chart: ${i}`,e.root.prependChild(s)}else{let i=Array.isArray(this.data)?this.data.length:Object.keys(this.data).length;e.root.setAttribute("aria-label",`${o} chart with ${i} data series`)}e=this.parse(e),this.structure=this.parseComponents(e),this.hooks.run("afterRender",{config:this.config,data:this.data,stats:this.stats,structure:this.structure})}parse(t){let{layoutChart:e}=t,o=new y("defs");return this.defs.forEach(i=>{o.appendChild(i)}),e.appendChild(o),t}parseComponents(t){let{body:e,top:o,layoutChart:i}=t;if(this.config.title&&this.config.title.enabled&&o.appendChild(this.title.render()),this.config.legend&&this.config.legend.enabled){let s=new y("chart-legend");s.appendChild(this.legend.render(null,null,this.constructor.type)),e.appendChild(s),this.interactions.push(Ct)}return this.config.tooltip&&this.config.tooltip.enabled&&(this.tooltip=new j({stats:this.stats,data:this.data,config:this.config,type:this.constructor.type}).render(),i.appendChild(this.tooltip.tooltip),typeof this.tooltipLocation=="function"&&(this.interactions.push(wt),this.interactions.push(this.tooltipLocation)),this.interactions.push(kt)),this.interactions.push(St),t}compile(t,e){return this._styleElement&&t.removeChild(this._styleElement),this._styleElement=this.compileStyles(),t.prependChild(this._styleElement),lt(t)}compileHTML(t,{prerendered:e}={}){let o=t.wrap,i=t.root,s={...o.options};i.options["aria-label"]&&o.setAttribute("aria-label",i.options["aria-label"]),i.options["aria-describedby"]&&o.setAttribute("aria-describedby",i.options["aria-describedby"]),o.setAttribute("role",i.options.role||"figure"),e&&o.setAttribute("data-prerendered",""),this._htmlStyleElement&&o.removeChild(this._htmlStyleElement),this._htmlStyleElement=this.compileStyles(),o.prependChild(this._htmlStyleElement);let n=t.layoutChart,a=t.plotarea,c=this.tooltip?.tooltip,r=this.tooltip?.htmlTooltip;c&&r&&a&&(n.removeChild(c),n.appendChild(r.crosshair),a.appendChild(r.tooltipBox));let h=lt(o);return o.options=s,this._htmlStyleElement&&o.removeChild(this._htmlStyleElement),c&&r&&a&&(n.removeChild(r.crosshair),a.removeChild(r.tooltipBox),n.appendChild(c)),h}compileStyles(){let t=new y("style"),e=this.constructor.type!=="pie"?this.data.length:Object.keys(this.data).length,o=this.stylesheet.convertconfig(this.config,e,this._scopeId)+this.stylesheet.sheet;return t.innerHTML=`@layer charts { ${o} }`,t}createGraph({stretch:t}){return t?new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",viewBox:"0, 0, 100, 100",preserveAspectRatio:"none",xmlns:"http://www.w3.org/2000/svg",class:["plot"]}):new y("svg",{x:"0%",y:"0%",width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",class:["plot-top"]})}createBackground(){return new y("rect",{width:"100%",height:"100%",x:"0%",y:"0%",class:["container"]})}createPlotArea({config:t}){return new y("rect",{x:"0%",y:"0%",width:"100%",height:"100%",class:["plotarea"]})}},ot=$t;var Et=class{constructor(t){Object.assign(this,t)}render(){let{type:t,stats:e,stroke:o,width:i}=this,{min:s,max:n}=e[t],a=Math.abs(n-s),r=Math.abs(s)/a*100;return t==="x"?new y("line",{class:["baseline","baseline-x"],x1:r.toFixed(3)+"%",y1:"0%",x2:r.toFixed(3)+"%",y2:"100%",stroke:o,"stroke-width":i}):new y("line",{class:["baseline","baseline-y"],x1:"0%",y1:(100-r).toFixed(3)+"%",x2:"100%",y2:(100-r).toFixed(3)+"%",stroke:o,"stroke-width":i})}},Lt=Et;function ke({config:l}){let t=l.scale.minFontSize,e=l.scale.maxItems,o="";o+=`
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
  `;let i=parseFloat((100/e-1).toFixed(2));o+=`
    .svc-scale-label-x {
      width: calc(${i}% - 5px);
      max-width: calc(${i}%);
    }`;let s={0:2,250:4,600:6,800:10,1e3:e},n=Object.keys(s);n.forEach((c,r)=>{let h,d=Math.floor(e/s[c]),p=parseInt(c),u=parseInt(n[r+1])-1;if(r===0)h=`
        @container chart-canvas (max-width: ${u}px) {
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
      `;else if(r===n.length-1)h=`
        @container chart-canvas (min-width: ${c}px) {
          .svc-scale-label-x,
          .svc-guides-x,
          .svc-ticks-x {
            opacity: 1;
          }
        }
      `;else{let g=parseFloat((100/(d+1)).toFixed(2));h=`
        @container chart-canvas (min-width: ${p}px) and (max-width: ${u}px) {
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
      `}o+=h});let a=Object.keys(s);return a.forEach((c,r)=>{let h,d=Math.floor(e/s[c]),p=parseInt(c),u=parseInt(a[r+1])-1;r===0?h=`
        @media(max-height: ${u}px) {
          .svc-scale-label-y:first-child,
          .svc-scale-label-y:nth-last-child(2),
          .svc-guides-y:first-child,
          .svc-guides-y:nth-last-child(2),
          .svc-ticks-y:first-child,
          .svc-ticks-y:nth-last-child(2) {
            opacity: 1;
          }
        }
      `:r===a.length-1?h=`
        @media(min-height: ${c}px) {
          .svc-scale-label-y,
          .svc-guides-y,
          .svc-ticks-y {
            opacity: 1;
          }
        }
      `:h=`
        @media(min-height: ${p}px) and (max-height: ${u}px) {
          .svc-scale-label-y:nth-child(${d}n + 1),
          .svc-guides-y:nth-child(${d}n + 1),
          .svc-ticks-y:nth-child(${d}n + 1) {
            opacity: 1;
          }
        }
      `,o+=h}),o}var oe=ke;function Mt(l,t,e){if(!Array.isArray(l)||l.length===0)throw new Error('SVC: "data" must be a non-empty array of series objects.');for(let r=0;r<l.length;r++)if(!l[r]||l[r].values==null)throw new Error(`SVC: data[${r}] must have a "values" property.`);if(e!=="scatter"&&e!=="bubble")for(let r=0;r<l.length;r++){let h=l[r].values,d=Array.isArray(h)?h:Object.values(h);for(let p=0;p<d.length;p++)if(d[p]!=null&&typeof d[p]!="number")throw new Error(`SVC: data[${r}].values contains non-numeric value "${d[p]}" at position ${p}.`)}let o={min:1/0,max:-1/0,ticks:4,scale:0},i={min:1/0,max:-1/0,ticks:6,scale:0},s={min:1/0,max:-1/0},n=!1,a=-1/0;if(e==="scatter"||e==="bubble")Object.assign(o,it(l,"x")),Object.assign(i,it(l,"y")),e==="bubble"&&Object.assign(s,it(l,"size"));else if(Array.isArray(l[0].values)){let r=l.reduce((d,p)=>d.concat(p.values),[]).sort((d,p)=>d-p);if(t.plot&&t.plot.stacked){let d=Math.max(...l.map(g=>g.values.length)),p=0,u=0;for(let g=0;g<d;g++){let m=0,f=0;l.forEach(b=>{let x=b.values[g]||0;x>=0?m+=x:f+=x}),p=Math.max(p,m),u=Math.min(u,f)}i.min=u,i.max=p}else i.min=r[0],i.max=r[r.length-1];let h=l[0].values.length;l.forEach((d,p)=>{d.values.length!==h&&console.warn(`SVC: Series ${p} has ${d.values.length} values, but series 0 has ${h}. Mismatched lengths may cause unexpected results.`),a=d.values.length>a?d.values.length:a}),o.min=0,o.max=a}else{n=!0;let r=l.reduce((d,p)=>d.concat(Object.keys(p.values).map(u=>p.values[u])),[]).sort((d,p)=>d-p),h={};if(l.forEach(d=>{Object.assign(h,d.values)}),h=Object.keys(h),t.scale.sorted&&h.sort(),t.plot&&t.plot.stacked){let d=0,p=0;h.forEach(u=>{let g=0,m=0;l.forEach(f=>{let b=f.values[u]||0;b>=0?g+=b:m+=b}),d=Math.max(d,g),p=Math.min(p,m)}),i.min=p,i.max=d}else i.min=r[0],i.max=r[r.length-1];o.keys=h,o.min=0,o.max=a=h.length}Object.assign(i,At(i)),e==="scatter"||e==="bubble"?Object.assign(o,At(o)):e==="bar"||e==="column"?(a>t.scale.maxItems?(o.ticks=t.scale.maxItems,o.step=Math.floor(a/(o.ticks-1))):(o.ticks=a,o.step=1),o.scaleLength=a,o.scaleFactor=M(100/a)):(a>t.scale.maxItems?(o.ticks=t.scale.maxItems,o.step=Math.ceil(a/(o.ticks-1))):(o.ticks=a,o.step=1),o.scaleLength=a,o.scaleFactor=M(100/Math.max(a-1,1)));let c=t.plot.vertical;return{associative:n,x:c?o:i,y:c?i:o,alt:s}}function At({max:l,min:t,ticks:e}){t=Math.floor(t+t*.1),l=Math.ceil(l+l*.1),t=t>0?0:t;let o=l-t;if(o<=0)return{min:t,max:t+1,step:1,scaleLength:1,scaleFactor:100,ticks:2};let i=se(o,e);t=Math.floor(t/i)*i,l=Math.ceil(l/i)*i;let s=l-t;e=Math.round(s/i)+1;let n=100/s;return{min:t,max:l,step:i,scaleLength:s,scaleFactor:n,ticks:e}}function se(l,t){let e=l/t,o=Math.pow(10,Math.floor(Math.log10(e))),i=e/o,s;return i<=1.5?s=1:i<=3.5?s=2.5:i<=7.5?s=5:s=10,s*o}function it(l,t){let e;switch(t){case"x":e=0;break;case"y":e=1;break;case"size":e=2;break}let o=l.map(i=>i.values.map(s=>s[e])).reduce((i,s)=>i.concat(s)).sort((i,s)=>i-s);return{min:o[0],max:o[o.length-1]}}var Tt=new Map;function X(l,t){Tt.set(l,t)}function Ot(l,t){let e=Tt.get(l);if(!e)throw new Error(`SVC: Unknown scale type "${l}". Registered types: ${[...Tt.keys()].join(", ")}`);return new e(t)}var _t=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:o}=this,i={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:a,step:c}=o[t];for(let r=0;r<a;r++){let h=M(r*c*o[t].scaleFactor);if(h>100)continue;i.ticks.push(R(t,h));let d=B(t,r,a,h,e);d&&i.guides.push(d);let p;t==="x"?p=`${s+r*c}`:p=`${n-r*c}`,p=V(p,t,e),i.labels.push(U(t,h,p))}return i}};function R(l,t){return l==="x"?new y("line",{x1:t+"%",y1:"0%",x2:t+"%",y2:"100%",class:["ticks","ticks-x"]}):new y("line",{x1:"0%",y1:t+"%",x2:"100%",y2:t+"%",class:["ticks","ticks-y"]})}function B(l,t,e,o,i){if(l==="x"){if(t!==0&&i.guides.x.enabled)return new y("line",{x1:o+"%",y1:"100%",x2:o+"%",y2:"0%",class:["guides","guides-x"]})}else if(t!==e-1&&i.guides.y.enabled)return new y("line",{x1:"0%",y1:o+"%",x2:"100%",y2:o+"%",class:["guides","guides-y"]});return null}function U(l,t,e){let o=l==="x"?"left":"top",i=new y("div",{style:`${o}: ${t}%`,class:["scale-label",`scale-label-${l}`]});return i.textContent=e,i}function V(l,t,e){if(t==="x"&&ct(e,"scale.label.x.format"))try{return e.scale.label.x.format(l)}catch(o){console.warn("SVC: scale.label.x.format threw an error:",o)}else if(t==="y"&&ct(e,"scale.label.y.format"))try{return e.scale.label.y.format(l)}catch(o){console.warn("SVC: scale.label.y.format threw an error:",o)}return l}var re=_t;var Ft=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:o}=this,i={ticks:[],labels:[],guides:[]},{ticks:s,step:n,max:a}=o[t],c=this.chartType,r=c==="bar"||c==="column",h=t==="x"&&e.plot.vertical||t==="y"&&!e.plot.vertical;for(let d=0;d<s;d++){let p,u;if(r&&h){let f=o[t].scaleFactor/2,b=s<=1?0:d/(s-1);u=Math.floor((o[t].scaleLength-1)*b),u===o[t].scaleLength&&u--,p=M(u*o[t].scaleFactor+f)}else p=M(d*n*o[t].scaleFactor);if(p>100)continue;i.ticks.push(R(t,p));let g=B(t,d,s,p,e);g&&i.guides.push(g);let m;if(t==="x"&&e.plot.vertical){let f=u??Math.round(d*(o.x.keys.length-1)/Math.max(s-1,1));m=`${o.x.keys[f]}`}else if(t==="y"&&!e.plot.vertical){let f=u??Math.round(d*(o.y.keys.length-1)/Math.max(s-1,1));m=`${o.y.keys[f]}`}else m=t==="x"?`${d*n}`:`${a-d*n}`;m=V(m,t,e),i.labels.push(U(t,p,m))}return i}},ne=Ft;var Pt=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:o}=this,i={ticks:[],labels:[],guides:[]},{min:s,max:n}=o[t],a=Math.max(s,1),c=Math.floor(Math.log10(a)),h=Math.ceil(Math.log10(Math.max(n,1)))-c;if(h<=0)return i;let d=h+1;for(let p=0;p<d;p++){let u=c+p,g=Math.pow(10,u),m=M(p/h*100);if(m>100)continue;let f=t==="y"?M(100-m):m;i.ticks.push(R(t,f));let b=B(t,p,d,f,e);b&&i.guides.push(b);let x=Ee(g);x=V(x,t,e),i.labels.push(U(t,f,x))}return i}};function Ee(l){return l>=1e6?l/1e6+"M":l>=1e3?l/1e3+"K":String(l)}var ae=Pt;var It=class{constructor(t){Object.assign(this,t)}render(){let{type:t,config:e,stats:o}=this,i={ticks:[],labels:[],guides:[]},{min:s,max:n,ticks:a}=o[t],c=le(s),h=le(n)-c;if(h<=0||!Number.isFinite(h))return i;let d=Le(h),p=Math.min(a,12);for(let u=0;u<p;u++){let g=u/Math.max(p-1,1),m=M(g*100),f=c+h*g;if(m>100)continue;i.ticks.push(R(t,m));let b=B(t,u,p,m,e);b&&i.guides.push(b);let x=d(new Date(f));x=V(x,t,e),i.labels.push(U(t,m,x))}return i}};function le(l){return typeof l=="number"?l:new Date(l).getTime()}function Le(l){return l<864e5?i=>i.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"}):l<2592e6?i=>i.toLocaleDateString(void 0,{month:"short",day:"numeric"}):l<31536e6*2?i=>i.toLocaleDateString(void 0,{month:"short",year:"2-digit"}):i=>i.toLocaleDateString(void 0,{year:"numeric"})}var ce=It;X("linear",re);X("category",ne);X("log",ae);X("time",ce);var Nt=class extends ot{static get defaults(){let t={width:120,height:120};return{l:{},plot:{vertical:!0},axis:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},label:{x:{enabled:!0,text:"Scale-X"},y:{enabled:!0,text:"Scale-Y"}},style:{stroke:"var(--chart-axis-color, #444)","stroke-width":.3,"vector-effect":"non-scaling-stroke"}},baseline:{x:{},y:{},style:{stroke:"var(--chart-baseline-color, #888)","stroke-width":1}},ticks:{x:{enabled:!0},y:{enabled:!0},style:{"stroke-width":"1",stroke:"var(--chart-tick-color, #DDD)"}},guides:{breakpoint:t,x:{enabled:!0},y:{enabled:!0},style:{stroke:"var(--chart-grid-color, #e4e4e4)","stroke-dasharray":"0, 0","stroke-width":1,"stroke-linecap":"round"}},scale:{sorted:!1,minFontSize:5,maxItems:15,label:{style:{"text-align":"center"}}}}}getName(){return super.getName()}parse(t){t=super.parse(t);let e=this.data,o=this.stylesheet,i=this.config,{layoutChart:s,layoutXAxis:n,layoutYAxis:a,layoutOriginLeft:c,layoutOriginCenter:r,layoutOriginRight:h,layoutYTicks:d,layoutXTicks:p,layoutXAxisLabel:u,layoutYAxisLabel:g}=t,m=this.stats=Mt(e,this.config,this.constructor.type);this.data=e,this.hooks.run("beforeRender",{config:i,data:e,stats:m,structure:t}),["x","y"].forEach(S=>{let L=Ae(S,m,i),$=Ot(L,{type:S,config:i,stats:m,data:e,chartType:this.constructor.type}).render();Object.keys($).forEach(E=>{if(E==="labels")$[E].forEach(T=>{S==="x"?n.appendChild(T):a.appendChild(T)});else if(E==="ticks")S==="x"&&i.ticks.x.enabled?$[E].forEach(T=>{p.appendChild(T)}):S==="y"&&i.ticks.y.enabled&&$[E].forEach(T=>{d.appendChild(T)});else{let T=new y("g",{class:[S+"-"+E]});$[E].forEach(O=>{T.appendChild(O)}),s.appendChild(T)}})});let f=[];if(i.axis.x.enabled&&s.appendChild(this.createAxis({type:"x"})),i.axis.label.x.enabled){let S=`svc-axis-x-label-${this._scopeId}`,L=new y("div",{class:["l-axis-label-text-x"],id:S,role:"note"});L.innerHTML=`<span class="svc-axis-label-x">${A(i.axis.label.x.text)}</span>`,u.appendChild(L),f.push(S)}if(i.axis.y.enabled&&s.appendChild(this.createAxis({type:"y"})),i.axis.label.y.enabled){let S=`svc-axis-y-label-${this._scopeId}`,L=new y("div",{class:["l-axis-y-label-text"],id:S,role:"note"});L.innerHTML=`<span class="svc-axis-label-y">${A(i.axis.label.y.text)}</span>`,g.appendChild(L),f.push(S)}f.length>0&&t.root.setAttribute("aria-describedby",f.join(" "));let b=new y("div",{class:["axis-y-label-dummy"]});b.innerHTML="0",c.appendChild(b),g.appendChild(b);let x=new y("div",{style:"height: 1%; min-height:10px;"});r.appendChild(x);let v=new y("div",{class:["origin-label","scale-label"]});if(m.associative&&!i.plot.vertical){let S=m.y.keys,L=0;S.forEach($=>{L=$.length>L?$.length:L}),v.innerHTML=new Array(L+1).join("0")}else v.innerHTML=m.y.max;r.appendChild(v),a.appendChild(v),h.setAttrs({style:"width: 1%;"}),m.y.min<0&&s.appendChild(new Lt({type:"y",stats:m,stroke:i.baseline.style.stroke,width:i.baseline.style["stroke-width"]}).render()),m.x.min<0&&s.appendChild(new Lt({type:"x",stats:m,stroke:i.baseline.style.stroke,width:i.baseline.style["stroke-width"]}).render());let w=this.createGraph({stretch:!0});s.appendChild(w);let C=this.createGraph({stretch:!1});s.appendChild(C),this.createPlot({data:e,stats:m,subchartStretch:w,subchartNoStretch:C});let k=new y("style");return k.innerHTML=".plot {opacity: 1;} .svc-loading {opacity:0;}",s.appendChild(k),o.addRaw(oe({stats:m,config:i})),t}createScript(){return new j({stats:this.stats,data:this.data,config:this.config}).render()}createAxis({type:t}){return t==="x"?new y("line",{x1:"0%",x2:"100%",y1:"100%",y2:"100%",class:["axis","axis-x"]}):new y("line",{x1:"0%",x2:"0%",y1:"0%",y2:"100%",class:["axis","axis-y"]})}};function Ae(l,t,e){return e.scale?.[l]?.type?e.scale[l].type:t.associative?"category":"linear"}var q=Nt;var zt=class extends q{static get type(){return"line"}static get defaults(){return{plot:{style:{fill:"none","vector-effect":"non-scaling-stroke"},node:{type:"open",size:4,style:{"stroke-width":"0.2%","stroke-linecap":"round"},active:{style:{"stroke-width":"0.5%","stroke-linecap":"round"}}}}}}static specs(t){let e={plot:{stroke:"primary"},"plot.node.active":{fill:"secondary",stroke:"secondary"}};return t.plot.node.enabled&&(e["plot.node"]={stroke:"primary"},t.plot.node.type=="closed"?e["plot.node"].fill="primary":e["plot.node"].fill="#FFF"),e}getPlotClass(t){return["plot",`plot-${t}`]}createPlotLine(t){let e=this.stats,o=[],i=.2,s=1,n=0,a=0,c=0,r,h,d=null;for(let p=0;p<t.length;p++){if(t[p]==null){d=null,a=0,c=0;continue}let u={x:M((p-e.x.min)*e.x.scaleFactor),y:M((e.y.max-t[p])*e.y.scaleFactor)};if(!d){o.push(`M ${u.x} ${u.y}`),d=u;continue}let g=null;for(let v=p+1;v<t.length;v++)if(t[v]!=null){g={x:M((v-e.x.min)*e.x.scaleFactor),y:M((e.y.max-t[v])*e.y.scaleFactor)};break}g?(n=(g.y-d.y)/(g.x-d.x),r=(g.x-u.x)*-i,h=r*n*s):r=h=0;let m=M(d.x-a),f=M(d.y-c),b=M(u.x+r),x=M(u.y+h);o.push(`C ${m} ${f}, ${b} ${x}, ${u.x} ${u.y}`),a=r,c=h,d=u}return o}createPlot({data:t,stats:e,subchartStretch:o,subchartNoStretch:i}){this.stats=e,t.forEach((s,n)=>{let a=Array.isArray(s.values)?s.values:e.x.keys.map(d=>s.values[d]??null),c={class:this.getPlotClass(n),plot:n};this.constructor.type==="line"&&(c.fill="none");let r=new y("path",c);o.appendChild(r);let h=this.createPlotLine(a);r.setAttribute("d",h.join(" ")),a.forEach((d,p)=>{if(d!=null){if(this.config.plot.node.enabled){let u=M((p-e.x.min)*e.x.scaleFactor)+"%",g=M((e.y.max-d)*e.y.scaleFactor)+"%",m=s.name||`Series ${n+1}`,f=e.associative&&e.x.keys&&e.x.keys[p]||p,b=new y("circle",{cx:u,cy:g,r:this.config.plot.node.size,class:["plot-node",`plot-node-${n}`],node:p,plot:n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${m}, ${f}: ${d}`});i.appendChild(b)}if(this.config.plot.node.label.enabled){let u=new y("text",{x:M((p-e.x.min)*e.x.scaleFactor)+"%",y:M((e.y.max-d)*e.y.scaleFactor)+"%",fill:"black",class:["plot-node-label",`plot-node-label-${n}`]});u.innerHTML=d,i.appendChild(u)}}})})}tooltipLocation(t,e,o){return function(s){let n={tooltip:{},crosshair:{}},a=1,c="",r=o.stats,d=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientX-d.left)/d.width,u=Math.floor(p*r.x.scaleLength),g=0,m=0,f=o.data,b=r.associative?r.x.keys[u]:u;f.forEach(function(C){let k=r.associative?C.values[b]:C.values[u];k!=null&&(g+=k,m++)});let x=(r.y.max-g/m)*r.y.scaleFactor;isNaN(x)&&(x=r.y.max*r.y.scaleFactor);let v=r.x.scaleFactor*u,w=x.toFixed(2);return isNaN(v)||isNaN(w)||u<0||u>=r.x.scaleLength?null:(n.crosshair.x1=v,n.crosshair.x2=v,n.crosshair.y1=0,n.crosshair.y2=100,n.tooltip.x=v+a,n.tooltip.y=w,f.forEach(function(C,k){let S=A(C.name?C.name:"Series "+k),L=r.associative?o.data[k].values[b]:o.data[k].values[u],$=r.associative?b:u,E;if(o.config.tooltip.format)try{E=A(String(o.config.tooltip.format($,L)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),E=`(${A(String($))} : ${A(String(L))})`}else E=`(${A(String($))} : ${A(String(L))})`;t.toggles[k]!==!1&&(c+=`<div class="svc-tooltip-content">
            <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> :
            ${E}
          </div>`)}),n.tooltip.text=c,n.index=u,n)}}},K=zt;var jt=class extends K{static get type(){return"area"}static get defaults(){return{plot:{area:{style:{"fill-opacity":"var(--area-fill-opacity, 0.5)","stroke-width":"2%","stroke-linecap":"round"}},node:{enabled:!1,size:4,active:{style:{"stroke-width":"0.5%"}}}}}}static specs(){return{plot:{stroke:"primary"},"plot.area":{fill:"primary",stroke:"secondary"}}}getPlotClass(t){return["plot",`plot-${t}`,"plot-area",`plot-area-${t}`]}createPlotLine(t){let e=super.createPlotLine(t),o=this.stats,i=t.find(c=>c!=null);if(i==null)return e;let s=M((t.length-1-o.x.min)*o.x.scaleFactor),n=M(o.y.max*o.y.scaleFactor),a=M((o.y.max-i)*o.y.scaleFactor);return e.push(`L ${s} ${n} L 0 ${n} L 0 ${a}`),e}},Rt=jt;var Bt=class extends q{static get type(){return"column"}static get defaults(){return{plot:{vertical:!0,stacked:!1,spacing:10,label:{enabled:!1,format:null}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:o,subchartNoStretch:i}){let s,n,a=this.config.plot.spacing/100,c=e.y.scaleFactor,r=e.x.scaleFactor;e.plot={},this.config.plot.vertical?(s=e.y.min,n=e.y.max,e.plot.vertical=!0):(s=e.x.min,n=e.x.max,e.plot.vertical=!1),e.plot.barSpacing=this.config.plot.spacing/100;let h=Math.abs(n-s),p=Math.abs(s)/h*100;if(this.config.plot.stacked){this._createStackedPlot({data:t,stats:e,subchartStretch:o,scaleX:r,scaleY:c,barSpacing:a,originPoint:p});return}if(Array.isArray(t[0].values))if(this.config.plot.vertical){let u=r/t.length,g=u*(1-a*2);t.forEach((m,f)=>{m.type!=="line"&&m.values.forEach((b,x)=>{let v;b>0?v=(e.y.max-b)*c+"%":v=(100-p).toFixed(3)+"%";let w=r*x;w+=u*f,w+=u*a,o.appendChild(new y("rect",{class:["plot",`plot-${f}`,`plot-node-${f}`],index:x,plot:f,"data-series":f,"data-index":x,"data-value":b,height:Math.abs(b)*c,x:w+"%",width:g+"%",y:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${m.name||"Series "+(f+1)}, ${x}: ${b}`}))})})}else{let u=c/t.length,g=u*(1-a*2);t.forEach((m,f)=>{m.type!=="line"&&m.values.forEach((b,x)=>{let v,w=Math.abs(b)*r;b>0?v=p.toFixed(3)+"%":v=p.toFixed(3)-w+"%";let C=100-c*(x+1);C+=u*f,C+=u*a,o.appendChild(new y("rect",{class:["plot",`plot-${f}`,`plot-node-${f}`],index:x,plot:f,"data-series":f,"data-index":x,"data-value":b,y:C+"%",width:w+"%",height:g+"%",x:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${m.name||"Series "+(f+1)}, ${x}: ${b}`}))})})}else if(this.config.plot.vertical){let u=r/t.length,g=u*(1-a*2);e.x.keys.forEach((m,f)=>{t.forEach((b,x)=>{if(b.type!=="line"&&b.values[m]!=null){let v,w=b.values[m];w>0?v=(e.y.max-w)*c+"%":v=(100-p).toFixed(3)+"%";let C=r*f;C+=u*x,C+=u*a,o.appendChild(new y("rect",{class:["plot",`plot-${x}`,`plot-node-${x}`],index:f,plot:x,"data-series":x,"data-key":m,"data-value":w,height:Math.abs(w)*c,x:C+"%",width:g+"%",y:v,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${b.name||"Series "+(x+1)}, ${m}: ${w}`}))}})})}else{let u=c/t.length,g=u*(1-a*2);e.y.keys.slice().reverse().forEach((f,b)=>{t.forEach((x,v)=>{if(x.type!=="line"&&x.values[f]!=null){let w=x.values[f],C,k=Math.abs(w)*r;w>0?C=p.toFixed(3)+"%":C=p.toFixed(3)-k+"%";let S=100-c*(b+1);S+=u*v,S+=u*a,o.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:b,plot:v,"data-series":v,"data-key":f,"data-value":w,y:S+"%",width:k+"%",height:g+"%",x:C,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${x.name||"Series "+(v+1)}, ${f}: ${w}`}))}})})}this._renderLineSeries({data:t,stats:e,subchartStretch:o,subchartNoStretch:i}),this.config.plot.label.enabled&&this._renderDataLabels({data:t,stats:e,subchartNoStretch:i,scaleX:r,scaleY:c,barSpacing:a})}_renderDataLabels({data:t,stats:e,subchartNoStretch:o,scaleX:i,scaleY:s,barSpacing:n}){if(!o)return;let a=!Array.isArray(t[0].values),c=this.config.plot.vertical,r=this.config.plot.label.format,h=t.filter(d=>d.type!=="line").length;t.forEach((d,p)=>{if(d.type==="line")return;let u=a?(c?e.x.keys:e.y.keys).map(g=>({key:g,value:d.values[g]})):d.values.map((g,m)=>({key:m,value:g}));u.forEach(({key:g,value:m},f)=>{if(m==null)return;let b=r?r(m,g):String(m);if(c){let x=i,v=x/h,w=x*f+v*p+v/2+v*n,C=(e.y.max-m)*s,k=new y("text",{x:w+"%",y:C-1+"%","text-anchor":"middle",class:["plot-node-label",`plot-node-label-${p}`]});k.textContent=b,o.appendChild(k)}else{let x=s,v=x/h,w=u.length-1-f,C=100-x*(w+1)+v*p+v/2,k=Math.abs(m)*i,S=new y("text",{x:k+1+"%",y:C+"%","alignment-baseline":"middle",class:["plot-node-label",`plot-node-label-${p}`]});S.textContent=b,o.appendChild(S)}})})}_renderLineSeries({data:t,stats:e,subchartStretch:o,subchartNoStretch:i}){let s=!Array.isArray(t[0].values),n=this.config.plot.vertical,a=e.x.scaleFactor,c=e.y.scaleFactor;t.forEach((r,h)=>{if(r.type!=="line")return;let d=n?e.x.keys:e.y.keys,p=s?d.map(f=>r.values[f]??null):r.values,u=[],g=!1;for(let f=0;f<p.length;f++){if(p[f]==null){g=!1;continue}let b=n?f*a+a/2:(e.y.max-p[f])*c,x=n?(e.y.max-p[f])*c:100-(f*c+c/2);g?u.push(`L ${b.toFixed(2)} ${x.toFixed(2)}`):u.push(`M ${b.toFixed(2)} ${x.toFixed(2)}`),g=!0}if(u.length===0)return;let m=new y("path",{d:u.join(" "),fill:"none",class:["plot",`plot-${h}`],style:"vector-effect: non-scaling-stroke"});if(o.appendChild(m),i)for(let f=0;f<p.length;f++){if(p[f]==null)continue;let b=n?f*a+a/2+"%":(e.y.max-p[f])*c+"%",x=n?(e.y.max-p[f])*c+"%":100-(f*c+c/2)+"%",v=s&&d?d[f]:f,w=r.name||"Series "+(h+1);i.appendChild(new y("circle",{cx:b,cy:x,r:4,class:["plot-node",`plot-node-${h}`],node:f,plot:h,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${w}, ${v}: ${p[f]}`}))}})}_createStackedPlot({data:t,stats:e,subchartStretch:o,scaleX:i,scaleY:s,barSpacing:n,originPoint:a}){let c=!Array.isArray(t[0].values),r=this.config.plot.vertical,h=r?i:s,d=h,p=d*(1-n*2),u=c?r?e.x.keys:e.y.keys:Array.from({length:Math.max(...t.map(g=>g.values.length))},(g,m)=>m);u.forEach((g,m)=>{let f=0,b=0;t.forEach((x,v)=>{if(x.type==="line")return;let w=x.values[g];if(w==null)return;let C=Math.abs(w)*(r?s:i),k=x.name||"Series "+(v+1);if(r){let S;w>=0?(f+=w,S=(e.y.max-f)*s):(S=(e.y.max-b)*s,b+=w);let L=h*m+d*n;o.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:m,plot:v,"data-series":v,"data-key":c?g:void 0,"data-index":c?void 0:m,"data-value":w,x:L+"%",y:S+"%",width:p+"%",height:C+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}else{let S;w>=0?(S=a+f*i,f+=w):(b+=w,S=a+b*i);let L=u.length-1-m,$=100-h*(L+1)+d*n;o.appendChild(new y("rect",{class:["plot",`plot-${v}`,`plot-node-${v}`],index:m,plot:v,"data-series":v,"data-key":c?g:void 0,"data-index":c?void 0:m,"data-value":w,x:S+"%",y:$+"%",width:C+"%",height:p+"%",role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${k}, ${g}: ${w}`}))}})})}tooltipLocation(t,e,o){return function(s){let n={tooltip:{},crosshair:{}},a=1,c="",r=o.stats,d=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientX-d.left)/d.width,u=Math.floor(p*r.x.scaleLength),g=0,m=0,f=o.data,b;r.associative&&(b=r.x.keys[u]),f.forEach(function(C){r.associative&&C.values[b]!=null?(g+=C.values[b],m++):!r.associative&&C.values[u]!=null&&(g+=C.values[u],m++)});let x=(r.y.max-g/m)*r.y.scaleFactor;isNaN(x)&&(x=r.y.max*r.y.scaleFactor);let v=r.x.scaleFactor*u+r.x.scaleFactor/2,w=x.toFixed(2);return isNaN(v)||isNaN(w)||u<0||u>=r.x.scaleLength?null:(r.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=v+a,n.tooltip.y=w,f.forEach(function(C,k){let S=A(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let L=r.associative?o.data[k].values[b]:o.data[k].values[u],$=r.associative?b:u,E;if(o.config.tooltip.format)try{E=A(String(o.config.tooltip.format($,L)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),E=`(${A(String($))} : ${A(String(L))})`}else E=`(${A(String($))} : ${A(String(L))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${E}
          </div>`}}),n.tooltip.text=c,n.index=u,n)}}},W=Bt;var Ut=class extends W{static get type(){return"bar"}static get defaults(){return{plot:{vertical:!1}}}tooltipLocation(t,e,o){return function(s){let n={tooltip:{},crosshair:{}},a=1,c="",r=o.stats,d=e.querySelector("chart-plot").getBoundingClientRect(),p=(s.clientY-d.top)/d.height;r.associative&&(p=1-p);let u=r.y.scaleLength-1-Math.floor(p*r.y.scaleLength),g=0,m=0,f=o.data,b;r.associative&&(o.config.plot.vertical?b=r.x.keys[u]:b=r.y.keys[u]),f.forEach(function(C){r.associative&&C.values[b]!=null?(g+=C.values[b],m++):!r.associative&&C.values[u]!=null&&(g+=C.values[u],m++)});let x=g/m*r.x.scaleFactor;isNaN(x)&&(x=r.x.max*r.x.scaleFactor);let v=x.toFixed(2),w=100*p.toFixed(2);return isNaN(v)||isNaN(w)||u<0||u>=r.x.scaleLength?null:(r.associative&&(w=100-w),n.crosshair.x1=-10,n.crosshair.x2=-10,n.crosshair.y1=-10,n.crosshair.y2=-10,n.tooltip.x=v+a,n.tooltip.y=w+a,f.forEach(function(C,k){let S=A(C.name?C.name:"Series "+k);if(t.toggles[k]!==!1){let L,$=r.associative?o.data[k].values[b]:o.data[k].values[u],E=r.associative?b:u;if(o.config.tooltip.format)try{L=A(String(o.config.tooltip.format(E,$)))}catch(T){console.warn("SVC: tooltip.format threw an error:",T),L=`(${A(String(E))} : ${A(String($))})`}else L=`(${A(String(E))} : ${A(String($))})`;c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${k}">${S}</span> : ${L}
          </div>`}}),n.tooltip.text=c,n.index=u,n)}}},st=Ut;var Vt=class extends q{static get type(){return"scatter"}static get defaults(){return{plot:{size:4}}}static specs(){return{"plot.node":{fill:"primary"}}}tooltipLocation(t,e,o){return function(s){t.nodeMap||(t.nodeMap=Oe(e));let n={tooltip:{},crosshair:{}},a=1,c="",h=e.querySelector("chart-plot").getBoundingClientRect(),d=(s.clientX-h.left)/h.width,p=(s.clientY-h.top)/h.height;d=Math.floor(d*100),p=Math.floor(p*100);let u=Math.floor(d/10),g=parseInt((d/10).toFixed(1).split(".")[1]),m=Math.floor(p/10);for(var f=null,b=[[0,0],[-1,0],[1,0],[0,-1],[0,1]],x=0;x<b.length;x++){var v=m+b[x][0],w=u+b[x][1];if(v>=0&&v<10&&w>=0&&w<10&&t.nodeMap[v]&&t.nodeMap[v][w]){var C=t.nodeMap[v][w][g];if(!C){for(var k=Math.max(0,g-1);k<=Math.min(9,g+1);k++)if(t.nodeMap[v][w][k]){C=t.nodeMap[v][w][k];break}}if(C){f=C;break}}}if(f)return n.crosshair.x1=-1,n.crosshair.x2=-1,n.crosshair.y1=-1,n.crosshair.y2=-1,n.tooltip.x=d+a,n.tooltip.y=p,f.forEach(S=>{let L=S.getAttribute("data-series"),$=S.getAttribute("data-index"),E=o.data[L].values[$],T=A(o.data[L].name||"Series "+L),O;if(o.config.tooltip.format)try{O=A(String(o.config.tooltip.format(T,E)))}catch(_){console.warn("SVC: tooltip.format threw an error:",_),O=A(String(E))}else O=A(String(E));c+=`<div class="svc-tooltip-content">
          <span class="svc-tooltip-label-title svc-tooltip-label-title-${L}">${T}</span> : (${O})
        </div>`}),n.tooltip.text=c,n}}createPlot({data:t,stats:e,subchartNoStretch:o}){t.forEach((i,s)=>{i.values.forEach((a,c)=>{let r=a[0],h=a[1],d=i.name||`Series ${s+1}`,p=new y("circle",{cx:((r-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-h)*e.y.scaleFactor).toFixed(3)+"%",r:this.config.plot.size,class:["plot-node",`plot-${s}`,`plot-node-${s}`],"data-index":c,"data-series":s,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${d}, (${r}, ${h})`});o.appendChild(p)})})}};function Oe(l){let t=Array.from(new Array(10)).map(()=>Array.from(new Array(10)).map(()=>[]));return l.querySelectorAll(".svc-plot-node").forEach(e=>{let o=e.getAttribute("data-series"),i=parseInt(e.getAttribute("cx")),s=parseInt(e.getAttribute("cy")),n=Math.floor(i/10),a=parseInt((i/10).toFixed(1).split(".")[1]),c=Math.floor(s/10);t[c][n][a]=t[c][n][a]||[],t[c][n][a][o]=e}),t}var Z=Vt;var Dt=class extends Z{static get type(){return"bubble"}static get defaults(){return{plot:{maxSize:4,node:{}}}}static specs(){return{"plot.node":{fill:"primary"}}}createPlot({data:t,stats:e,subchartStretch:o,subchartNoStretch:i}){t.forEach((s,n)=>{s.values.forEach((c,r)=>{let h=c[0],d=c[1],p=c[2],u=s.name||`Series ${n+1}`,g=new y("circle",{cx:((h-e.x.min)*e.x.scaleFactor).toFixed(3)+"%",cy:((e.y.max-d)*e.y.scaleFactor).toFixed(3)+"%",r:Math.abs(p)/5*this.config.plot.maxSize+"%",style:`opacity: ${.7}`,class:["plot-node",`plot-${n}`,`plot-node-${n}`],"data-index":r,"data-series":n,role:"graphics-symbol","aria-roledescription":"data point","aria-label":`${u}, (${h}, ${d}), size: ${p}`});i.appendChild(g)})})}},Ht=Dt;var qt=class extends ot{static get type(){return"pie"}static get defaults(){return{plot:{ring:!1,node:{label:{enabled:!0,placement:"auto",scaleBySize:!0,limitBySize:!0,multiplier:1,threshold:12,style:{"font-size":"clamp(8px, 0.6vmin, 16px)"}}}},center:{size:"40%",style:{fill:"#fff"},label:{style:{"font-size":"5vmin",transform:"translate(0%, -50%)","text-align":"center"},container:{style:{display:"flex","justify-content":"center","align-items":"center"}},title:{style:{"font-size":"7vmin"}}}}}}static specs(){return{plot:{fill:"primary"},"plot.node":{fill:"primary"}}}parse(t){t=super.parse(t);let{layoutChart:e}=t,o=this.createGraph({stretch:!0});e.appendChild(o);let i=this.createGraph({stretch:!1});e.appendChild(i),this.createPlot({layoutChart:e,subchartStretch:o,subchartNoStretch:i}),i.appendChild(new y("g"));let s=new y("style");return s.innerHTML=".plot {opacity: 1;}.svc-loading {opacity:0;}",e.appendChild(s),t}createScript(){return new j({stats:this.stats,data:this.data,config:this.config}).render()}createPlot({layoutChart:t,subchartStretch:e,subchartNoStretch:o}){let i=this.data;if(!z(i))throw new Error('SVC: Pie chart "data" must be a plain object with numeric values, e.g. { "Apples": 30, "Oranges": 70 }.');Object.keys(i).forEach(h=>{if(typeof i[h]!="number")throw new Error(`SVC: Pie chart value for "${h}" must be a number.`);if(i[h]<0)throw new Error(`SVC: Pie chart value for "${h}" is negative (${i[h]}). Pie charts require non-negative values.`)});let s=Object.keys(i).reduce((h,d)=>h+=i[d],0);if(s===0){let h=new y("text",{x:"50%",y:"50%","text-anchor":"middle","alignment-baseline":"middle",class:["loading"]});h.textContent="No data",o.appendChild(h);return}let n=0,a=0,c=this.config.plot.node.instances.map(h=>h.fill);Object.keys(i).forEach((h,d)=>{let p=i[h],u=p/s,g=n/s,m=c[a%c.length],f=this.calculateSlice(u,g),b=this.createSlice(f,m,d,p,s,h);o.appendChild(b),a++,n+=p});let r=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]});if(this.config.plot.ring){let d=(parseFloat(this.config.center.size)||40)/2;r.appendChild(new y("circle",{cx:"50",cy:"50",r:String(d),fill:"var(--color-surface, #fff)",class:["center"]}))}o.appendChild(r)}calculateSlice(t,e){let i=Math.cos((e+t)*2*Math.PI)*50+50,s=Math.sin((e+t)*2*Math.PI)*50+50,n=Math.cos(e*2*Math.PI)*50+50,a=Math.sin(e*2*Math.PI)*50+50,c=e*360,r=t*360+c,h=(r+c)/2,d=50+50*Math.cos(h*2*Math.PI/360),p=50+50*Math.sin(h*2*Math.PI/360);d=(d+50)*.5,p=(p+50)*.5;let u=r-c;return{radius:50,degrees:h,degreeLength:u,start:{x:i,y:s},end:{x:n,y:a},center:{x:d,y:p}}}createSlice(t,e,o,i,s,n){let{radius:a,start:c,end:r,center:h,degreeLength:d}=t,p=new y("svg",{height:"100%",width:"100%",overflow:"visible",viewBox:"0 0 100 100",class:["nodeGroup"]}),u=d>180?1:0,g=`M ${a} ${a}`,m=`L${c.x} ${c.y}`,f=`A ${a} ${a} 0 ${u} 0 ${r.x} ${r.y}`,b=(i/s*100).toFixed(0);if(p.appendChild(new y("path",{fill:e,style:"vector-effect: non-scaling-stroke",d:`${g} ${m} ${f} Z`,"alignment-baseline":"middle","text-anchor":"middle","data-key":n,"data-value":i,tabindex:"0",class:["plot-node",`plot-node-${o}`],role:"graphics-symbol","aria-roledescription":"slice","aria-label":`${n}: ${b}%`})),this.config.plot.node.label.enabled){let{multiplier:x,threshold:v,limitBySize:w,scaleBySize:C,placement:k}=this.config.plot.node.label,S=d<=v;if(k==="outside"||k==="auto"&&S){let $=t.degrees*Math.PI/180,E=55,T=62,O=50+48*Math.cos($),_=50+48*Math.sin($),Q=50+E*Math.cos($),J=50+E*Math.sin($),tt=50+T*Math.cos($),I=50+T*Math.sin($),Y=Math.cos($)>=0?"start":"end";p.appendChild(new y("line",{x1:O.toFixed(1),y1:_.toFixed(1),x2:Q.toFixed(1),y2:J.toFixed(1),stroke:"var(--chart-label-color, #737373)","stroke-width":"0.5",class:["plot-leader"]}));let N=new y("text",{fill:"var(--chart-label-color, #737373)",x:tt.toFixed(1),y:I.toFixed(1),"alignment-baseline":"middle","text-anchor":Y,style:"font-size: 0.35em;",class:["plot-node-label",`plot-node-label-${o}`]});N.innerHTML=`${A(n)} ${b}%`,p.appendChild(N)}else if(!this.config.plot.ring){let $;C&&($=.37*x*(d/100));let E=new y("text",{fill:"#fff",x:h.x,y:h.y,style:C?`font-size: ${M($)}em;`:"","alignment-baseline":"middle","text-anchor":"middle",class:w&&d>v||!w?["plot-node-label"]:["plot-node-label","hide"]});E.innerHTML=b+"%",p.appendChild(E)}}return p}tooltipLocation(t,e,o){return function(s){var n=e.querySelector("chart-plot");if(!n)return null;var a=n.getBoundingClientRect(),c=n.querySelector(".svc-nodeGroup"),r=c?c.getBoundingClientRect():a,h=r.left+r.width/2,d=r.top+r.height/2,p=s.clientX-h,u=s.clientY-d,g=Math.min(r.width,r.height)/2,m=Math.sqrt(p*p+u*u);if(m>g)return null;if(o.config.plot.ring){var f=parseFloat(o.config.center.size)||40,b=g*(f/100);if(m<b)return null}var x=Math.atan2(u,p);x<0&&(x+=2*Math.PI);var v=x/(2*Math.PI),w=(s.clientX-a.left)/a.width*100,C=(s.clientY-a.top)/a.height*100,k=o.data,S=Object.keys(k),L=S.reduce(function(nt,me){return nt+(k[me]||0)},0);if(L===0)return null;for(var $=0,E=null,T=0,O=0,_=0;_<S.length;_++){var Q=k[S[_]]||0,J=Q/L;if(v>=$&&v<$+J){E=S[_],T=Q,O=_;break}$+=J}if(!E)return null;var tt=(T/L*100).toFixed(1),I={tooltip:{},crosshair:{x1:-10,x2:-10,y1:-10,y2:-10}};I.tooltip.x=w,I.tooltip.y=C;var Y=A(String(E)),N;if(o.config.tooltip&&o.config.tooltip.format)try{N=A(String(o.config.tooltip.format(E,T)))}catch(nt){console.warn("SVC: tooltip.format threw an error:",nt),N=Y+": "+tt+"%"}else N=Y+": "+tt+"%";return I.tooltip.text='<div class="svc-tooltip-content"><span class="svc-tooltip-label-title svc-tooltip-label-title-'+O+'">'+Y+"</span> : "+N+"</div>",I.index=O,I}}},Yt=qt;var Di=window.matchMedia("(prefers-reduced-motion: reduce)");var de=new Map;function pe(l,t,e={}){let o=e.priority??10,i={impl:t,bundle:e.bundle,contract:e.contract,priority:o},s=de.get(l);if(customElements.get(l)){if(!s||s.priority>=o){s&&s.priority===o&&s.impl!==t&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${s.bundle}" (priority ${s.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${l}> defined by "${s.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(s&&s.priority>=o){s.priority===o&&console.warn(`[VB Bundle] Tag <${l}> already registered by "${s.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}de.set(l,i),customElements.define(l,t)}var rt=class extends HTMLElement{#t=[];connectedCallback(){this.hasAttribute("data-upgraded")||this.setup()!==!1&&this.setAttribute("data-upgraded","")}disconnectedCallback(){for(let t of this.#t)t();this.#t=[],this.removeAttribute("data-upgraded"),this.teardown()}listen(t,e,o,i){t.addEventListener(e,o,i),this.#t.push(()=>t.removeEventListener(e,o,i))}setup(){}teardown(){}};function Gt(l){let t=l.textContent.trim();if(!t)return null;let e=t.replace(/[$€£¥,% ]/g,""),o=Number(e);return Number.isFinite(o)?o:null}function Pe(l){let t=[...l.cells],e=-1,o=[];for(let i=0;i<t.length;i++){let s=t[i];if(!s.hasAttribute("data-chart-ignore")){if(s.hasAttribute("data-chart-label")||s.getAttribute("scope")==="row"){e=i;continue}(s.hasAttribute("data-chart-series")||!s.hasAttribute("data-chart-ignore"))&&o.push({index:i,name:s.textContent.trim()})}}if(e===-1&&t.length>0){let i=t[0];if(!i.textContent.trim()||i.tagName==="TH"){e=0;let s=o.findIndex(n=>n.index===0);s!==-1&&o.splice(s,1)}}return{labelIndex:e,columns:o}}function Ie(l){let t=l.querySelector("thead"),e=l.querySelector("tbody")||l,o=t?.querySelector("tr"),i=[...e.querySelectorAll("tr")];if(!o||i.length===0)return{data:[],config:{}};let{labelIndex:s,columns:n}=Pe(o),a=s!==-1,c=n.map(d=>({name:d.name,values:a?{}:[]}));for(let d of i){let p=[...d.cells],u=a?p[s]?.textContent.trim()||"":null;for(let g=0;g<n.length;g++){let m=p[n[g].index],f=m?Gt(m):null;a&&u?c[g].values[u]=f??0:c[g].values.push(f??0)}}let r={},h=l.querySelector("caption");return h&&(r.title={text:h.textContent.trim(),enabled:!0}),{data:c,config:r}}function Ne(l){let e=[...(l.querySelector("tbody")||l).querySelectorAll("tr")],o={};for(let n of e){let a=[...n.cells],c=n.querySelector("th"),r=c?c.textContent.trim():a[0]?.textContent.trim(),h=c?a[1]||a[0]:a[1],d=h?Gt(h):null;r&&d!=null&&(o[r]=d)}let i={},s=l.querySelector("caption");return s&&(i.title={text:s.textContent.trim(),enabled:!0}),{data:o,config:i}}function ze(l){let t=l.querySelector("thead"),e=l.querySelector("tbody")||l,o=t?.querySelector("tr"),i=[...e.querySelectorAll("tr")],s=new Map;for(let r of i){let h=[...r.cells],d=r.querySelector("th"),p=d?d.textContent.trim():"Data",u=d?[...r.querySelectorAll("td")]:h.slice(1);s.has(p)||s.set(p,[]);let g=u.map(m=>Gt(m)).filter(m=>m!=null);g.length>=2&&s.get(p).push(g)}let n=[...s.entries()].map(([r,h])=>({name:r,values:h})),a={},c=l.querySelector("caption");return c&&(a.title={text:c.textContent.trim(),enabled:!0}),{data:n,config:a}}function he(l,t){if(!l||!l.querySelector("tbody, tr"))return{data:null,config:{}};let e=(t||"").toLowerCase();return e==="pie"?Ne(l):e==="scatter"||e==="bubble"?ze(l):Ie(l)}function ue(l){let t={};return l.hasAttribute("data-tooltip")&&(t.tooltip={enabled:!0}),l.hasAttribute("data-legend")&&(t.legend={enabled:!0}),l.hasAttribute("data-grid")&&(t.guides={x:{enabled:!0},y:{enabled:!0}}),l.hasAttribute("data-labels")&&(t.plot={node:{label:{enabled:!0}}}),t}function je(l){let t=getComputedStyle(l),e=[];for(let o=1;o<=6;o++){let i=t.getPropertyValue(`--chart-series-${o}`).trim();i&&e.push(i)}return e.length>0?e:null}function F(l,t){return l.getPropertyValue(t).trim()||null}function Xt(l){let t=getComputedStyle(l),e={},o=F(t,"--chart-label-color"),i=F(t,"--chart-font-family");(o||i)&&(e.style={},o&&(e.style.color=o),i&&(e.style["font-family"]=i));let s=F(t,"--chart-axis-color");s&&(e.axis={style:{stroke:s}});let n=F(t,"--chart-grid-color");n&&(e.guides={style:{stroke:n}});let a=F(t,"--chart-baseline-color");a&&(e.baseline={style:{stroke:a}});let c=F(t,"--chart-tick-color");c&&(e.ticks={style:{stroke:c}});let r=F(t,"--chart-title-color"),h=F(t,"--chart-title-size");(r||h)&&(e.title=e.title||{},e.title.style={},r&&(e.title.style.color=r),h&&(e.title.style["font-size"]=h));let d=F(t,"--chart-subtitle-color"),p=F(t,"--chart-subtitle-size");(d||p)&&(e.title=e.title||{},e.title.subtitle=e.title.subtitle||{},e.title.subtitle.style={},d&&(e.title.subtitle.style.color=d),p&&(e.title.subtitle.style["font-size"]=p));let u=F(t,"--chart-tooltip-bg"),g=F(t,"--chart-tooltip-color"),m=F(t,"--chart-tooltip-shadow");(u||g||m)&&(e.tooltip=e.tooltip||{},e.tooltip.label=e.tooltip.label||{},e.tooltip.label.style={},u&&(e.tooltip.label.style["background-color"]=u),g&&(e.tooltip.label.style.color=g),m&&(e.tooltip.label.style["box-shadow"]=m));let f=je(l);return f&&(e.palette=f),e}function fe(l){return{name:"vb-theme-bridge",hooks:{configResolved({config:t}){let e=Xt(l);e.style&&(t.style=Object.assign({},e.style,t.style)),e.palette&&!t._paletteFromUser&&(t.palette=e.palette)}}}}var Re={line:K,area:Rt,bar:st,column:W,pie:Yt,scatter:Z,bubble:Ht};function D(l,t=null){if(l==null)return t;if(typeof l!="string")return l;try{return JSON.parse(l)}catch{return t}}function H(l,t){if(!t||typeof t!="object"||Array.isArray(t))return l;for(let e of Object.keys(t))t[e]&&typeof t[e]=="object"&&!Array.isArray(t[e])?((!l[e]||typeof l[e]!="object")&&(l[e]={}),H(l[e],t[e])):l[e]=t[e];return l}var Kt=class extends rt{static get observedAttributes(){return["data-type","data-values","data-config","data-title","data-subtitle","data-legend","data-tooltip","data-palette","data-label-x","data-label-y"]}#t=null;#i=null;#s=null;#n=!1;#e=null;#o=null;set data(t){this.#t=t,this.#r()}get data(){return this.#t}set config(t){this.#i=t,this.#r()}get config(){return this.#i}refresh(){this.#r()}toSVG(){return this.#e?.querySelector("svg")?.outerHTML||null}setup(){this.#r()}teardown(){this.#a()}attributeChangedCallback(){this.hasAttribute("data-upgraded")&&this.#r()}#r(){!this.isConnected||this.#n||(this.#n=!0,Promise.resolve().then(()=>{this.#n=!1,this.isConnected&&this.#u()}))}#l(){let t=(this.dataset.type||"").toLowerCase();return t||(t=(this.querySelector("table")?.dataset.type||"bar").toLowerCase()),Re[t]||st}#c(){if(this.#t!=null)return{data:D(this.#t,null),tableConfig:{}};let t=this.dataset.values;if(t!=null)return{data:D(t,null),tableConfig:{}};let e=this.querySelector('script[type="application/json"]');if(e)return{data:D(e.textContent,null),tableConfig:{}};let o=this.querySelector("template[data-chart-data]");if(o){let s=o.content?.textContent||o.innerHTML;return{data:D(s,null),tableConfig:{}}}let i=this.querySelector("table");if(i){let s=(this.dataset.type||i.dataset.type||"bar").toLowerCase(),{data:n,config:a}=he(i,s),c=ue(i),r=H(H({},a),c);return{data:n,tableConfig:r}}return null}#d(t={}){let e=Xt(this),o=D(this.#i,{})||{},i=D(this.dataset.config,{})||{},s={};s=H(s,e),s=H(s,t),s=H(s,o),s=H(s,i);let n=this.dataset.labelX,a=this.dataset.labelY;if(s.axis=s.axis||{},s.axis.label=s.axis.label||{},n!=null?s.axis.label.x={text:n,enabled:!0}:s.axis.label.x?.text||(s.axis.label.x=s.axis.label.x||{},s.axis.label.x.enabled=!1),a!=null?s.axis.label.y={text:a,enabled:!0}:s.axis.label.y?.text||(s.axis.label.y=s.axis.label.y||{},s.axis.label.y.enabled=!1),s.plot?.node?.label?.scaleBySize||(s.plot=s.plot||{},s.plot.node=s.plot.node||{},s.plot.node.label=s.plot.node.label||{},s.plot.node.label.scaleBySize=!1),this.dataset.title!=null){let c={text:this.dataset.title,enabled:!0};this.dataset.subtitle!=null&&(c.subtitle=this.dataset.subtitle),s.title=c}if(this.dataset.legend!=null&&(s.legend={enabled:!0}),this.dataset.tooltip!=null&&(s.tooltip={enabled:!0}),this.dataset.palette!=null){let c=D(this.dataset.palette,null);c&&(s.palette=c)}return s.plugins=s.plugins||[],s.plugins.push(fe(this)),s}#p(){if(this.#o&&this.contains(this.#o))return;this.#o=document.createElement("div"),this.#o.setAttribute("data-chart-svg",""),this.#o.setAttribute("aria-hidden","true"),this.appendChild(this.#o);let t=this.#o.attachShadow({mode:"open"});this.#e=document.createElement("div"),this.#e.style.cssText="width:100%;height:100%;overflow:visible;",t.appendChild(this.#e)}#h(t){if(!t)return;(this.dataset.chart||t.dataset.chart||"replace")==="replace"&&(t.classList.add("sr-only"),t.setAttribute("aria-hidden","false"))}#u(){let t=this.#l(),e=this.#c();if(!e||!e.data){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:"No chart data found"},bubbles:!0}));return}let{data:o,tableConfig:i}=e,s=this.#d(i);this.#a();let n=this.querySelector("table");this.#h(n),this.#p();try{this.dispatchEvent(new CustomEvent("chart-wc:config-resolved",{detail:{type:this.dataset.type||n?.dataset.type||"bar",config:s},bubbles:!0})),this.#s=new t({config:s,data:o}),this.#s.mount(this.#e),this.dispatchEvent(new CustomEvent("chart-wc:render",{detail:{type:this.dataset.type||n?.dataset.type||"bar",seriesCount:Array.isArray(o)?o.length:Object.keys(o).length},bubbles:!0}))}catch(a){this.dispatchEvent(new CustomEvent("chart-wc:error",{detail:{message:a.message},bubbles:!0}))}}#a(){this.#s&&(this.#s.destroy(),this.#s=null),this.#e&&(this.#e.innerHTML="")}};pe("chart-wc",Kt);
//# sourceMappingURL=vanilla-breeze-charts.js.map
