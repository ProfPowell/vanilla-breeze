function En(n){return n&&n.__esModule&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n}var Ge,gt;function _n(){if(gt)return Ge;gt=1;function n(t){return t instanceof Map?t.clear=t.delete=t.set=function(){throw new Error("map is read-only")}:t instanceof Set&&(t.add=t.clear=t.delete=function(){throw new Error("set is read-only")}),Object.freeze(t),Object.getOwnPropertyNames(t).forEach(i=>{let d=t[i],x=typeof d;(x==="object"||x==="function")&&!Object.isFrozen(d)&&n(d)}),t}class e{constructor(i){i.data===void 0&&(i.data={}),this.data=i.data,this.isMatchIgnored=!1}ignoreMatch(){this.isMatchIgnored=!0}}function o(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function r(t,...i){let d=Object.create(null);for(let x in t)d[x]=t[x];return i.forEach(function(x){for(let B in x)d[B]=x[B]}),d}let a="</span>",c=t=>!!t.scope,u=(t,{prefix:i})=>{if(t.startsWith("language:"))return t.replace("language:","language-");if(t.includes(".")){let d=t.split(".");return[`${i}${d.shift()}`,...d.map((x,B)=>`${x}${"_".repeat(B+1)}`)].join(" ")}return`${i}${t}`};class g{constructor(i,d){this.buffer="",this.classPrefix=d.classPrefix,i.walk(this)}addText(i){this.buffer+=o(i)}openNode(i){if(!c(i))return;let d=u(i.scope,{prefix:this.classPrefix});this.span(d)}closeNode(i){c(i)&&(this.buffer+=a)}value(){return this.buffer}span(i){this.buffer+=`<span class="${i}">`}}let p=(t={})=>{let i={children:[]};return Object.assign(i,t),i};class f{constructor(){this.rootNode=p(),this.stack=[this.rootNode]}get top(){return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(i){this.top.children.push(i)}openNode(i){let d=p({scope:i});this.add(d),this.stack.push(d)}closeNode(){if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}walk(i){return this.constructor._walk(i,this.rootNode)}static _walk(i,d){return typeof d=="string"?i.addText(d):d.children&&(i.openNode(d),d.children.forEach(x=>this._walk(i,x)),i.closeNode(d)),i}static _collapse(i){typeof i!="string"&&i.children&&(i.children.every(d=>typeof d=="string")?i.children=[i.children.join("")]:i.children.forEach(d=>{f._collapse(d)}))}}class A extends f{constructor(i){super(),this.options=i}addText(i){i!==""&&this.add(i)}startScope(i){this.openNode(i)}endScope(){this.closeNode()}__addSublanguage(i,d){let x=i.root;d&&(x.scope=`language:${d}`),this.add(x)}toHTML(){return new g(this,this.options).value()}finalize(){return this.closeAllNodes(),!0}}function S(t){return t?typeof t=="string"?t:t.source:null}function E(t){return M("(?=",t,")")}function C(t){return M("(?:",t,")*")}function T(t){return M("(?:",t,")?")}function M(...t){return t.map(i=>S(i)).join("")}function V(t){let i=t[t.length-1];return typeof i=="object"&&i.constructor===Object?(t.splice(t.length-1,1),i):{}}function P(...t){return"("+(V(t).capture?"":"?:")+t.map(i=>S(i)).join("|")+")"}function H(t){return new RegExp(t.toString()+"|").exec("").length-1}function Z(t,i){let d=t&&t.exec(i);return d&&d.index===0}let q=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;function I(t,{joinWith:i}){let d=0;return t.map(x=>{d+=1;let B=d,D=S(x),b="";for(;D.length>0;){let h=q.exec(D);if(!h){b+=D;break}b+=D.substring(0,h.index),D=D.substring(h.index+h[0].length),h[0][0]==="\\"&&h[1]?b+="\\"+String(Number(h[1])+B):(b+=h[0],h[0]==="("&&d++)}return b}).map(x=>`(${x})`).join(i)}let ae=/\b\B/,X="[a-zA-Z]\\w*",Y="[a-zA-Z_]\\w*",ee="\\b\\d+(\\.\\d+)?",te="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",ne="\\b(0b[01]+)",K="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",z=(t={})=>{let i=/^#![ ]*\//;return t.binary&&(t.begin=M(i,/.*\b/,t.binary,/\b.*/)),r({scope:"meta",begin:i,end:/$/,relevance:0,"on:begin":(d,x)=>{d.index!==0&&x.ignoreMatch()}},t)},j={begin:"\\\\[\\s\\S]",relevance:0},oe={scope:"string",begin:"'",end:"'",illegal:"\\n",contains:[j]},ke={scope:"string",begin:'"',end:'"',illegal:"\\n",contains:[j]},L={begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},G=function(t,i,d={}){let x=r({scope:"comment",begin:t,end:i,contains:[]},d);x.contains.push({scope:"doctag",begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0});let B=P("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/);return x.contains.push({begin:M(/[ ]+/,"(",B,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),x},re=G("//","$"),de=G("/\\*","\\*/"),he=G("#","$"),me={scope:"number",begin:ee,relevance:0},Ot={scope:"number",begin:te,relevance:0},Rt={scope:"number",begin:ne,relevance:0},Tt={scope:"regexp",begin:/\/(?=[^/\n]*\/)/,end:/\/[gimuy]*/,contains:[j,{begin:/\[/,end:/\]/,relevance:0,contains:[j]}]},It={scope:"title",begin:X,relevance:0},zt={scope:"title",begin:Y,relevance:0},jt={begin:"\\.\\s*"+Y,relevance:0};var Ce=Object.freeze({__proto__:null,APOS_STRING_MODE:oe,BACKSLASH_ESCAPE:j,BINARY_NUMBER_MODE:Rt,BINARY_NUMBER_RE:ne,COMMENT:G,C_BLOCK_COMMENT_MODE:de,C_LINE_COMMENT_MODE:re,C_NUMBER_MODE:Ot,C_NUMBER_RE:te,END_SAME_AS_BEGIN:function(t){return Object.assign(t,{"on:begin":(i,d)=>{d.data._beginMatch=i[1]},"on:end":(i,d)=>{d.data._beginMatch!==i[1]&&d.ignoreMatch()}})},HASH_COMMENT_MODE:he,IDENT_RE:X,MATCH_NOTHING_RE:ae,METHOD_GUARD:jt,NUMBER_MODE:me,NUMBER_RE:ee,PHRASAL_WORDS_MODE:L,QUOTE_STRING_MODE:ke,REGEXP_MODE:Tt,RE_STARTERS_RE:K,SHEBANG:z,TITLE_MODE:It,UNDERSCORE_IDENT_RE:Y,UNDERSCORE_TITLE_MODE:zt});function Bt(t,i){t.input[t.index-1]==="."&&i.ignoreMatch()}function Dt(t,i){t.className!==void 0&&(t.scope=t.className,delete t.className)}function Pt(t,i){i&&t.beginKeywords&&(t.begin="\\b("+t.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",t.__beforeBegin=Bt,t.keywords=t.keywords||t.beginKeywords,delete t.beginKeywords,t.relevance===void 0&&(t.relevance=0))}function Ht(t,i){Array.isArray(t.illegal)&&(t.illegal=P(...t.illegal))}function Ut(t,i){if(t.match){if(t.begin||t.end)throw new Error("begin & end are not supported with match");t.begin=t.match,delete t.match}}function Ft(t,i){t.relevance===void 0&&(t.relevance=1)}let Zt=(t,i)=>{if(!t.beforeMatch)return;if(t.starts)throw new Error("beforeMatch cannot be used with starts");let d=Object.assign({},t);Object.keys(t).forEach(x=>{delete t[x]}),t.keywords=d.keywords,t.begin=M(d.beforeMatch,E(d.begin)),t.starts={relevance:0,contains:[Object.assign(d,{endsParent:!0})]},t.relevance=0,delete d.beforeMatch},qt=["of","and","for","in","not","or","if","then","parent","list","value"],Kt="keyword";function Qe(t,i,d=Kt){let x=Object.create(null);return typeof t=="string"?B(d,t.split(" ")):Array.isArray(t)?B(d,t):Object.keys(t).forEach(function(D){Object.assign(x,Qe(t[D],i,D))}),x;function B(D,b){i&&(b=b.map(h=>h.toLowerCase())),b.forEach(function(h){let v=h.split("|");x[v[0]]=[D,Gt(v[0],v[1])]})}}function Gt(t,i){return i?Number(i):Wt(t)?0:1}function Wt(t){return qt.includes(t.toLowerCase())}let Ye={},pe=t=>{console.error(t)},et=(t,...i)=>{console.log(`WARN: ${t}`,...i)},ye=(t,i)=>{Ye[`${t}/${i}`]||(console.log(`Deprecated as of ${t}. ${i}`),Ye[`${t}/${i}`]=!0)},Me=new Error;function tt(t,i,{key:d}){let x=0,B=t[d],D={},b={};for(let h=1;h<=i.length;h++)b[h+x]=B[h],D[h+x]=!0,x+=H(i[h-1]);t[d]=b,t[d]._emit=D,t[d]._multi=!0}function Vt(t){if(Array.isArray(t.begin)){if(t.skip||t.excludeBegin||t.returnBegin)throw pe("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),Me;if(typeof t.beginScope!="object"||t.beginScope===null)throw pe("beginScope must be object"),Me;tt(t,t.begin,{key:"beginScope"}),t.begin=I(t.begin,{joinWith:""})}}function Jt(t){if(Array.isArray(t.end)){if(t.skip||t.excludeEnd||t.returnEnd)throw pe("skip, excludeEnd, returnEnd not compatible with endScope: {}"),Me;if(typeof t.endScope!="object"||t.endScope===null)throw pe("endScope must be object"),Me;tt(t,t.end,{key:"endScope"}),t.end=I(t.end,{joinWith:""})}}function Xt(t){t.scope&&typeof t.scope=="object"&&t.scope!==null&&(t.beginScope=t.scope,delete t.scope)}function Qt(t){Xt(t),typeof t.beginScope=="string"&&(t.beginScope={_wrap:t.beginScope}),typeof t.endScope=="string"&&(t.endScope={_wrap:t.endScope}),Vt(t),Jt(t)}function Yt(t){function i(b,h){return new RegExp(S(b),"m"+(t.case_insensitive?"i":"")+(t.unicodeRegex?"u":"")+(h?"g":""))}class d{constructor(){this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}addRule(h,v){v.position=this.position++,this.matchIndexes[this.matchAt]=v,this.regexes.push([v,h]),this.matchAt+=H(h)+1}compile(){this.regexes.length===0&&(this.exec=()=>null);let h=this.regexes.map(v=>v[1]);this.matcherRe=i(I(h,{joinWith:"|"}),!0),this.lastIndex=0}exec(h){this.matcherRe.lastIndex=this.lastIndex;let v=this.matcherRe.exec(h);if(!v)return null;let W=v.findIndex((Ee,He)=>He>0&&Ee!==void 0),U=this.matchIndexes[W];return v.splice(0,W),Object.assign(v,U)}}class x{constructor(){this.rules=[],this.multiRegexes=[],this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(h){if(this.multiRegexes[h])return this.multiRegexes[h];let v=new d;return this.rules.slice(h).forEach(([W,U])=>v.addRule(W,U)),v.compile(),this.multiRegexes[h]=v,v}resumingScanAtSamePosition(){return this.regexIndex!==0}considerAll(){this.regexIndex=0}addRule(h,v){this.rules.push([h,v]),v.type==="begin"&&this.count++}exec(h){let v=this.getMatcher(this.regexIndex);v.lastIndex=this.lastIndex;let W=v.exec(h);if(this.resumingScanAtSamePosition()&&!(W&&W.index===this.lastIndex)){let U=this.getMatcher(0);U.lastIndex=this.lastIndex+1,W=U.exec(h)}return W&&(this.regexIndex+=W.position+1,this.regexIndex===this.count&&this.considerAll()),W}}function B(b){let h=new x;return b.contains.forEach(v=>h.addRule(v.begin,{rule:v,type:"begin"})),b.terminatorEnd&&h.addRule(b.terminatorEnd,{type:"end"}),b.illegal&&h.addRule(b.illegal,{type:"illegal"}),h}function D(b,h){let v=b;if(b.isCompiled)return v;[Dt,Ut,Qt,Zt].forEach(U=>U(b,h)),t.compilerExtensions.forEach(U=>U(b,h)),b.__beforeBegin=null,[Pt,Ht,Ft].forEach(U=>U(b,h)),b.isCompiled=!0;let W=null;return typeof b.keywords=="object"&&b.keywords.$pattern&&(b.keywords=Object.assign({},b.keywords),W=b.keywords.$pattern,delete b.keywords.$pattern),W=W||/\w+/,b.keywords&&(b.keywords=Qe(b.keywords,t.case_insensitive)),v.keywordPatternRe=i(W,!0),h&&(b.begin||(b.begin=/\B|\b/),v.beginRe=i(v.begin),!b.end&&!b.endsWithParent&&(b.end=/\B|\b/),b.end&&(v.endRe=i(v.end)),v.terminatorEnd=S(v.end)||"",b.endsWithParent&&h.terminatorEnd&&(v.terminatorEnd+=(b.end?"|":"")+h.terminatorEnd)),b.illegal&&(v.illegalRe=i(b.illegal)),b.contains||(b.contains=[]),b.contains=[].concat(...b.contains.map(function(U){return en(U==="self"?b:U)})),b.contains.forEach(function(U){D(U,v)}),b.starts&&D(b.starts,h),v.matcher=B(v),v}if(t.compilerExtensions||(t.compilerExtensions=[]),t.contains&&t.contains.includes("self"))throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");return t.classNameAliases=r(t.classNameAliases||{}),D(t)}function nt(t){return t?t.endsWithParent||nt(t.starts):!1}function en(t){return t.variants&&!t.cachedVariants&&(t.cachedVariants=t.variants.map(function(i){return r(t,{variants:null},i)})),t.cachedVariants?t.cachedVariants:nt(t)?r(t,{starts:t.starts?r(t.starts):null}):Object.isFrozen(t)?r(t):t}var tn="11.11.1";class nn extends Error{constructor(i,d){super(i),this.name="HTMLInjectionError",this.html=d}}let Pe=o,ot=r,rt=Symbol("nomatch"),on=7,it=function(t){let i=Object.create(null),d=Object.create(null),x=[],B=!0,D="Could not find the language '{}', did you forget to load/include a language module?",b={disableAutodetect:!0,name:"Plain text",contains:[]},h={ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",cssSelector:"pre code",languages:null,__emitter:A};function v(s){return h.noHighlightRe.test(s)}function W(s){let w=s.className+" ";w+=s.parentNode?s.parentNode.className:"";let _=h.languageDetectRe.exec(w);if(_){let O=be(_[1]);return O||(et(D.replace("{}",_[1])),et("Falling back to no-highlight mode for this block.",s)),O?_[1]:"no-highlight"}return w.split(/\s+/).find(O=>v(O)||be(O))}function U(s,w,_){let O="",F="";typeof w=="object"?(O=s,_=w.ignoreIllegals,F=w.language):(ye("10.7.0","highlight(lang, code, ...args) has been deprecated."),ye("10.7.0",`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`),F=s,O=w),_===void 0&&(_=!0);let se={code:O,language:F};$e("before:highlight",se);let ge=se.result?se.result:Ee(se.language,se.code,_);return ge.code=se.code,$e("after:highlight",ge),ge}function Ee(s,w,_,O){let F=Object.create(null);function se(l,m){return l.keywords[m]}function ge(){if(!y.keywords){J.addText(R);return}let l=0;y.keywordPatternRe.lastIndex=0;let m=y.keywordPatternRe.exec(R),k="";for(;m;){k+=R.substring(l,m.index);let N=le.case_insensitive?m[0].toLowerCase():m[0],Q=se(y,N);if(Q){let[ue,xn]=Q;if(J.addText(k),k="",F[N]=(F[N]||0)+1,F[N]<=on&&(Re+=xn),ue.startsWith("_"))k+=m[0];else{let kn=le.classNameAliases[ue]||ue;ce(m[0],kn)}}else k+=m[0];l=y.keywordPatternRe.lastIndex,m=y.keywordPatternRe.exec(R)}k+=R.substring(l),J.addText(k)}function Le(){if(R==="")return;let l=null;if(typeof y.subLanguage=="string"){if(!i[y.subLanguage]){J.addText(R);return}l=Ee(y.subLanguage,R,!0,bt[y.subLanguage]),bt[y.subLanguage]=l._top}else l=Ue(R,y.subLanguage.length?y.subLanguage:null);y.relevance>0&&(Re+=l.relevance),J.__addSublanguage(l._emitter,l.language)}function ie(){y.subLanguage!=null?Le():ge(),R=""}function ce(l,m){l!==""&&(J.startScope(m),J.addText(l),J.endScope())}function lt(l,m){let k=1,N=m.length-1;for(;k<=N;){if(!l._emit[k]){k++;continue}let Q=le.classNameAliases[l[k]]||l[k],ue=m[k];Q?ce(ue,Q):(R=ue,ge(),R=""),k++}}function dt(l,m){return l.scope&&typeof l.scope=="string"&&J.openNode(le.classNameAliases[l.scope]||l.scope),l.beginScope&&(l.beginScope._wrap?(ce(R,le.classNameAliases[l.beginScope._wrap]||l.beginScope._wrap),R=""):l.beginScope._multi&&(lt(l.beginScope,m),R="")),y=Object.create(l,{parent:{value:y}}),y}function ht(l,m,k){let N=Z(l.endRe,k);if(N){if(l["on:end"]){let Q=new e(l);l["on:end"](m,Q),Q.isMatchIgnored&&(N=!1)}if(N){for(;l.endsParent&&l.parent;)l=l.parent;return l}}if(l.endsWithParent)return ht(l.parent,m,k)}function pn(l){return y.matcher.regexIndex===0?(R+=l[0],1):(Ke=!0,0)}function fn(l){let m=l[0],k=l.rule,N=new e(k),Q=[k.__beforeBegin,k["on:begin"]];for(let ue of Q)if(ue&&(ue(l,N),N.isMatchIgnored))return pn(m);return k.skip?R+=m:(k.excludeBegin&&(R+=m),ie(),!k.returnBegin&&!k.excludeBegin&&(R=m)),dt(k,l),k.returnBegin?0:m.length}function wn(l){let m=l[0],k=w.substring(l.index),N=ht(y,l,k);if(!N)return rt;let Q=y;y.endScope&&y.endScope._wrap?(ie(),ce(m,y.endScope._wrap)):y.endScope&&y.endScope._multi?(ie(),lt(y.endScope,l)):Q.skip?R+=m:(Q.returnEnd||Q.excludeEnd||(R+=m),ie(),Q.excludeEnd&&(R=m));do y.scope&&J.closeNode(),!y.skip&&!y.subLanguage&&(Re+=y.relevance),y=y.parent;while(y!==N.parent);return N.starts&&dt(N.starts,l),Q.returnEnd?0:m.length}function vn(){let l=[];for(let m=y;m!==le;m=m.parent)m.scope&&l.unshift(m.scope);l.forEach(m=>J.openNode(m))}let Oe={};function ut(l,m){let k=m&&m[0];if(R+=l,k==null)return ie(),0;if(Oe.type==="begin"&&m.type==="end"&&Oe.index===m.index&&k===""){if(R+=w.slice(m.index,m.index+1),!B){let N=new Error(`0 width match regex (${s})`);throw N.languageName=s,N.badRule=Oe.rule,N}return 1}if(Oe=m,m.type==="begin")return fn(m);if(m.type==="illegal"&&!_){let N=new Error('Illegal lexeme "'+k+'" for mode "'+(y.scope||"<unnamed>")+'"');throw N.mode=y,N}else if(m.type==="end"){let N=wn(m);if(N!==rt)return N}if(m.type==="illegal"&&k==="")return R+=`
`,1;if(qe>1e5&&qe>m.index*3)throw new Error("potential infinite loop, way more iterations than matches");return R+=k,k.length}let le=be(s);if(!le)throw pe(D.replace("{}",s)),new Error('Unknown language: "'+s+'"');let yn=Yt(le),Ze="",y=O||yn,bt={},J=new h.__emitter(h);vn();let R="",Re=0,fe=0,qe=0,Ke=!1;try{if(le.__emitTokens)le.__emitTokens(w,J);else{for(y.matcher.considerAll();;){qe++,Ke?Ke=!1:y.matcher.considerAll(),y.matcher.lastIndex=fe;let l=y.matcher.exec(w);if(!l)break;let m=w.substring(fe,l.index),k=ut(m,l);fe=l.index+k}ut(w.substring(fe))}return J.finalize(),Ze=J.toHTML(),{language:s,value:Ze,relevance:Re,illegal:!1,_emitter:J,_top:y}}catch(l){if(l.message&&l.message.includes("Illegal"))return{language:s,value:Pe(w),illegal:!0,relevance:0,_illegalBy:{message:l.message,index:fe,context:w.slice(fe-100,fe+100),mode:l.mode,resultSoFar:Ze},_emitter:J};if(B)return{language:s,value:Pe(w),illegal:!1,relevance:0,errorRaised:l,_emitter:J,_top:y};throw l}}function He(s){let w={value:Pe(s),illegal:!1,relevance:0,_top:b,_emitter:new h.__emitter(h)};return w._emitter.addText(s),w}function Ue(s,w){w=w||h.languages||Object.keys(i);let _=He(s),O=w.filter(be).filter(ct).map(ie=>Ee(ie,s,!1));O.unshift(_);let F=O.sort((ie,ce)=>{if(ie.relevance!==ce.relevance)return ce.relevance-ie.relevance;if(ie.language&&ce.language){if(be(ie.language).supersetOf===ce.language)return 1;if(be(ce.language).supersetOf===ie.language)return-1}return 0}),[se,ge]=F,Le=se;return Le.secondBest=ge,Le}function rn(s,w,_){let O=w&&d[w]||_;s.classList.add("hljs"),s.classList.add(`language-${O}`)}function Fe(s){let w=null,_=W(s);if(v(_))return;if($e("before:highlightElement",{el:s,language:_}),s.dataset.highlighted){console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",s);return}if(s.children.length>0&&(h.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),console.warn("The element with unescaped HTML:"),console.warn(s)),h.throwUnescapedHTML))throw new nn("One of your code blocks includes unescaped HTML.",s.innerHTML);w=s;let O=w.textContent,F=_?U(O,{language:_,ignoreIllegals:!0}):Ue(O);s.innerHTML=F.value,s.dataset.highlighted="yes",rn(s,_,F.language),s.result={language:F.language,re:F.relevance,relevance:F.relevance},F.secondBest&&(s.secondBest={language:F.secondBest.language,relevance:F.secondBest.relevance}),$e("after:highlightElement",{el:s,result:F,text:O})}function an(s){h=ot(h,s)}let sn=()=>{Ne(),ye("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")};function cn(){Ne(),ye("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")}let at=!1;function Ne(){function s(){Ne()}if(document.readyState==="loading"){at||window.addEventListener("DOMContentLoaded",s,!1),at=!0;return}document.querySelectorAll(h.cssSelector).forEach(Fe)}function ln(s,w){let _=null;try{_=w(t)}catch(O){if(pe("Language definition for '{}' could not be registered.".replace("{}",s)),B)pe(O);else throw O;_=b}_.name||(_.name=s),i[s]=_,_.rawDefinition=w.bind(null,t),_.aliases&&st(_.aliases,{languageName:s})}function dn(s){delete i[s];for(let w of Object.keys(d))d[w]===s&&delete d[w]}function hn(){return Object.keys(i)}function be(s){return s=(s||"").toLowerCase(),i[s]||i[d[s]]}function st(s,{languageName:w}){typeof s=="string"&&(s=[s]),s.forEach(_=>{d[_.toLowerCase()]=w})}function ct(s){let w=be(s);return w&&!w.disableAutodetect}function un(s){s["before:highlightBlock"]&&!s["before:highlightElement"]&&(s["before:highlightElement"]=w=>{s["before:highlightBlock"](Object.assign({block:w.el},w))}),s["after:highlightBlock"]&&!s["after:highlightElement"]&&(s["after:highlightElement"]=w=>{s["after:highlightBlock"](Object.assign({block:w.el},w))})}function bn(s){un(s),x.push(s)}function gn(s){let w=x.indexOf(s);w!==-1&&x.splice(w,1)}function $e(s,w){let _=s;x.forEach(function(O){O[_]&&O[_](w)})}function mn(s){return ye("10.7.0","highlightBlock will be removed entirely in v12.0"),ye("10.7.0","Please use highlightElement now."),Fe(s)}Object.assign(t,{highlight:U,highlightAuto:Ue,highlightAll:Ne,highlightElement:Fe,highlightBlock:mn,configure:an,initHighlighting:sn,initHighlightingOnLoad:cn,registerLanguage:ln,unregisterLanguage:dn,listLanguages:hn,getLanguage:be,registerAliases:st,autoDetection:ct,inherit:ot,addPlugin:bn,removePlugin:gn}),t.debugMode=function(){B=!1},t.safeMode=function(){B=!0},t.versionString=tn,t.regex={concat:M,lookahead:E,either:P,optional:T,anyNumberOfTimes:C};for(let s in Ce)typeof Ce[s]=="object"&&n(Ce[s]);return Object.assign(t,Ce),t},xe=it({});return xe.newInstance=()=>it({}),Ge=xe,xe.HighlightJS=xe,xe.default=xe,Ge}var Sn=_n(),$=En(Sn),mt="[A-Za-z$_][0-9A-Za-z$_]*",An=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Cn=["true","false","null","undefined","NaN","Infinity"],pt=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],ft=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],wt=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Mn=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Nn=[].concat(wt,pt,ft);function vt(n){let e=n.regex,o=(L,{after:G})=>{let re="</"+L[0].slice(1);return L.input.indexOf(re,G)!==-1},r=mt,a={begin:"<>",end:"</>"},c=/<[A-Za-z0-9\\._:-]+\s*\/>/,u={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(L,G)=>{let re=L[0].length+L.index,de=L.input[re];if(de==="<"||de===","){G.ignoreMatch();return}de===">"&&(o(L,{after:re})||G.ignoreMatch());let he,me=L.input.substring(re);if(he=me.match(/^\s*=/)){G.ignoreMatch();return}if((he=me.match(/^\s+extends\s+/))&&he.index===0){G.ignoreMatch();return}}},g={$pattern:mt,keyword:An,literal:Cn,built_in:Nn,"variable.language":Mn},p="[0-9](_?[0-9])*",f=`\\.(${p})`,A="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",S={className:"number",variants:[{begin:`(\\b(${A})((${f})|\\.)?|(${f}))[eE][+-]?(${p})\\b`},{begin:`\\b(${A})\\b((${f})\\b|\\.)?|(${f})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},E={className:"subst",begin:"\\$\\{",end:"\\}",keywords:g,contains:[]},C={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,E],subLanguage:"xml"}},T={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,E],subLanguage:"css"}},M={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,E],subLanguage:"graphql"}},V={className:"string",begin:"`",end:"`",contains:[n.BACKSLASH_ESCAPE,E]},P={className:"comment",variants:[n.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:r+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),n.C_BLOCK_COMMENT_MODE,n.C_LINE_COMMENT_MODE]},H=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,C,T,M,V,{match:/\$\d+/},S];E.contains=H.concat({begin:/\{/,end:/\}/,keywords:g,contains:["self"].concat(H)});let Z=[].concat(P,E.contains),q=Z.concat([{begin:/(\s*)\(/,end:/\)/,keywords:g,contains:["self"].concat(Z)}]),I={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:g,contains:q},ae={variants:[{match:[/class/,/\s+/,r,/\s+/,/extends/,/\s+/,e.concat(r,"(",e.concat(/\./,r),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,r],scope:{1:"keyword",3:"title.class"}}]},X={relevance:0,match:e.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...pt,...ft]}},Y={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ee={variants:[{match:[/function/,/\s+/,r,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[I],illegal:/%/},te={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function ne(L){return e.concat("(?!",L.join("|"),")")}let K={match:e.concat(/\b/,ne([...wt,"super","import"].map(L=>`${L}\\s*\\(`)),r,e.lookahead(/\s*\(/)),className:"title.function",relevance:0},z={begin:e.concat(/\./,e.lookahead(e.concat(r,/(?![0-9A-Za-z$_(])/))),end:r,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},j={match:[/get|set/,/\s+/,r,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},I]},oe="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+n.UNDERSCORE_IDENT_RE+")\\s*=>",ke={match:[/const|var|let/,/\s+/,r,/\s*/,/=\s*/,/(async\s*)?/,e.lookahead(oe)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[I]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:g,exports:{PARAMS_CONTAINS:q,CLASS_REFERENCE:X},illegal:/#(?![$_A-z])/,contains:[n.SHEBANG({label:"shebang",binary:"node",relevance:5}),Y,n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,C,T,M,V,P,{match:/\$\d+/},S,X,{scope:"attr",match:r+e.lookahead(":"),relevance:0},ke,{begin:"("+n.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[P,n.REGEXP_MODE,{className:"function",begin:oe,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:n.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:g,contains:q}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:a.begin,end:a.end},{match:c},{begin:u.begin,"on:begin":u.isTrulyOpeningTag,end:u.end}],subLanguage:"xml",contains:[{begin:u.begin,end:u.end,skip:!0,contains:["self"]}]}]},ee,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+n.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[I,n.inherit(n.TITLE_MODE,{begin:r,className:"title.function"})]},{match:/\.\.\./,relevance:0},z,{match:"\\$"+r,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[I]},K,te,ae,j,{match:/\$[(.]/}]}}var $n=n=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:n.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:n.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),Ln=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],On=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],Rn=[...Ln,...On],Tn=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),In=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),zn=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),jn=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function Bn(n){let e=n.regex,o=$n(n),r={begin:/-(webkit|moz|ms|o)-(?=[a-z])/},a="and or not only",c=/@-?\w[\w]*(-\w+)*/,u="[a-zA-Z-][a-zA-Z0-9_-]*",g=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE];return{name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},contains:[o.BLOCK_COMMENT,r,o.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{className:"selector-class",begin:"\\."+u,relevance:0},o.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{begin:":("+In.join("|")+")"},{begin:":(:)?("+zn.join("|")+")"}]},o.CSS_VARIABLE,{className:"attribute",begin:"\\b("+jn.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,contains:[o.BLOCK_COMMENT,o.HEXCOLOR,o.IMPORTANT,o.CSS_NUMBER_MODE,...g,{begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"},contains:[...g,{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]},o.FUNCTION_DISPATCH]},{begin:e.lookahead(/@/),end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",begin:c},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:a,attribute:Tn.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"},...g,o.CSS_NUMBER_MODE]}]},{className:"selector-tag",begin:"\\b("+Rn.join("|")+")\\b"}]}}function Se(n){let e=n.regex,o=e.concat(/[\p{L}_]/u,e.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),r=/[\p{L}0-9._:-]+/u,a={className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},c={begin:/\s/,contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},u=n.inherit(c,{begin:/\(/,end:/\)/}),g=n.inherit(n.APOS_STRING_MODE,{className:"string"}),p=n.inherit(n.QUOTE_STRING_MODE,{className:"string"}),f={endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",begin:r,relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[a]},{begin:/'/,end:/'/,contains:[a]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,relevance:10,contains:[c,p,g,u,{begin:/\[/,end:/\]/,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,contains:[c,u,p,g]}]}]},n.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},a,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,relevance:10,contains:[p]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[f],starts:{end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[f],starts:{end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{className:"tag",begin:/<>|<\/>/},{className:"tag",begin:e.concat(/</,e.lookahead(e.concat(o,e.either(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",begin:o,relevance:0,starts:f}]},{className:"tag",begin:e.concat(/<\//,e.lookahead(e.concat(o,/>/))),contains:[{className:"name",begin:o,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}function Dn(n){let e={className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},o={match:/[{}[\],:]/,className:"punctuation",relevance:0},r=["true","false","null"],a={scope:"literal",beginKeywords:r.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{literal:r},contains:[e,o,n.QUOTE_STRING_MODE,a,n.C_NUMBER_MODE,n.C_LINE_COMMENT_MODE,n.C_BLOCK_COMMENT_MODE],illegal:"\\S"}}function yt(n){let e="true false yes no null",o="[\\w#;/?:@&=+$,.~*'()[\\]]+",r={className:"attr",variants:[{begin:/[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/},{begin:/"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/},{begin:/'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/}]},a={className:"template-variable",variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]},c={className:"string",relevance:0,begin:/'/,end:/'/,contains:[{match:/''/,scope:"char.escape",relevance:0}]},u={className:"string",relevance:0,variants:[{begin:/"/,end:/"/},{begin:/\S+/}],contains:[n.BACKSLASH_ESCAPE,a]},g=n.inherit(u,{variants:[{begin:/'/,end:/'/,contains:[{begin:/''/,relevance:0}]},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),p={className:"number",begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"},f={end:",",endsWithParent:!0,excludeEnd:!0,keywords:e,relevance:0},A={begin:/\{/,end:/\}/,contains:[f],illegal:"\\n",relevance:0},S={begin:"\\[",end:"\\]",contains:[f],illegal:"\\n",relevance:0},E=[r,{className:"meta",begin:"^---\\s*$",relevance:10},{className:"string",begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,relevance:0},{className:"type",begin:"!\\w+!"+o},{className:"type",begin:"!<"+o+">"},{className:"type",begin:"!"+o},{className:"type",begin:"!!"+o},{className:"meta",begin:"&"+n.UNDERSCORE_IDENT_RE+"$"},{className:"meta",begin:"\\*"+n.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",relevance:0},n.HASH_COMMENT_MODE,{beginKeywords:e,keywords:{literal:e}},p,{className:"number",begin:n.C_NUMBER_RE+"\\b",relevance:0},A,S,c,u],C=[...E];return C.pop(),C.push(g),f.contains=C,{name:"YAML",case_insensitive:!0,aliases:["yml"],contains:E}}function Pn(n){let e=n.regex,o=/(?![A-Za-z0-9])(?![$])/,r=e.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,o),a=e.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,o),c=e.concat(/[A-Z]+/,o),u={scope:"variable",match:"\\$+"+r},g={scope:"meta",variants:[{begin:/<\?php/,relevance:10},{begin:/<\?=/},{begin:/<\?/,relevance:.1},{begin:/\?>/}]},p={scope:"subst",variants:[{begin:/\$\w+/},{begin:/\{\$/,end:/\}/}]},f=n.inherit(n.APOS_STRING_MODE,{illegal:null}),A=n.inherit(n.QUOTE_STRING_MODE,{illegal:null,contains:n.QUOTE_STRING_MODE.contains.concat(p)}),S={begin:/<<<[ \t]*(?:(\w+)|"(\w+)")\n/,end:/[ \t]*(\w+)\b/,contains:n.QUOTE_STRING_MODE.contains.concat(p),"on:begin":(z,j)=>{j.data._beginMatch=z[1]||z[2]},"on:end":(z,j)=>{j.data._beginMatch!==z[1]&&j.ignoreMatch()}},E=n.END_SAME_AS_BEGIN({begin:/<<<[ \t]*'(\w+)'\n/,end:/[ \t]*(\w+)\b/}),C=`[ 	
]`,T={scope:"string",variants:[A,f,S,E]},M={scope:"number",variants:[{begin:"\\b0[bB][01]+(?:_[01]+)*\\b"},{begin:"\\b0[oO][0-7]+(?:_[0-7]+)*\\b"},{begin:"\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"},{begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"}],relevance:0},V=["false","null","true"],P=["__CLASS__","__DIR__","__FILE__","__FUNCTION__","__COMPILER_HALT_OFFSET__","__LINE__","__METHOD__","__NAMESPACE__","__TRAIT__","die","echo","exit","include","include_once","print","require","require_once","array","abstract","and","as","binary","bool","boolean","break","callable","case","catch","class","clone","const","continue","declare","default","do","double","else","elseif","empty","enddeclare","endfor","endforeach","endif","endswitch","endwhile","enum","eval","extends","final","finally","float","for","foreach","from","global","goto","if","implements","instanceof","insteadof","int","integer","interface","isset","iterable","list","match|0","mixed","new","never","object","or","private","protected","public","readonly","real","return","string","switch","throw","trait","try","unset","use","var","void","while","xor","yield"],H=["Error|0","AppendIterator","ArgumentCountError","ArithmeticError","ArrayIterator","ArrayObject","AssertionError","BadFunctionCallException","BadMethodCallException","CachingIterator","CallbackFilterIterator","CompileError","Countable","DirectoryIterator","DivisionByZeroError","DomainException","EmptyIterator","ErrorException","Exception","FilesystemIterator","FilterIterator","GlobIterator","InfiniteIterator","InvalidArgumentException","IteratorIterator","LengthException","LimitIterator","LogicException","MultipleIterator","NoRewindIterator","OutOfBoundsException","OutOfRangeException","OuterIterator","OverflowException","ParentIterator","ParseError","RangeException","RecursiveArrayIterator","RecursiveCachingIterator","RecursiveCallbackFilterIterator","RecursiveDirectoryIterator","RecursiveFilterIterator","RecursiveIterator","RecursiveIteratorIterator","RecursiveRegexIterator","RecursiveTreeIterator","RegexIterator","RuntimeException","SeekableIterator","SplDoublyLinkedList","SplFileInfo","SplFileObject","SplFixedArray","SplHeap","SplMaxHeap","SplMinHeap","SplObjectStorage","SplObserver","SplPriorityQueue","SplQueue","SplStack","SplSubject","SplTempFileObject","TypeError","UnderflowException","UnexpectedValueException","UnhandledMatchError","ArrayAccess","BackedEnum","Closure","Fiber","Generator","Iterator","IteratorAggregate","Serializable","Stringable","Throwable","Traversable","UnitEnum","WeakReference","WeakMap","Directory","__PHP_Incomplete_Class","parent","php_user_filter","self","static","stdClass"],Z={keyword:P,literal:(z=>{let j=[];return z.forEach(oe=>{j.push(oe),oe.toLowerCase()===oe?j.push(oe.toUpperCase()):j.push(oe.toLowerCase())}),j})(V),built_in:H},q=z=>z.map(j=>j.replace(/\|\d+$/,"")),I={variants:[{match:[/new/,e.concat(C,"+"),e.concat("(?!",q(H).join("\\b|"),"\\b)"),a],scope:{1:"keyword",4:"title.class"}}]},ae=e.concat(r,"\\b(?!\\()"),X={variants:[{match:[e.concat(/::/,e.lookahead(/(?!class\b)/)),ae],scope:{2:"variable.constant"}},{match:[/::/,/class/],scope:{2:"variable.language"}},{match:[a,e.concat(/::/,e.lookahead(/(?!class\b)/)),ae],scope:{1:"title.class",3:"variable.constant"}},{match:[a,e.concat("::",e.lookahead(/(?!class\b)/))],scope:{1:"title.class"}},{match:[a,/::/,/class/],scope:{1:"title.class",3:"variable.language"}}]},Y={scope:"attr",match:e.concat(r,e.lookahead(":"),e.lookahead(/(?!::)/))},ee={relevance:0,begin:/\(/,end:/\)/,keywords:Z,contains:[Y,u,X,n.C_BLOCK_COMMENT_MODE,T,M,I]},te={relevance:0,match:[/\b/,e.concat("(?!fn\\b|function\\b|",q(P).join("\\b|"),"|",q(H).join("\\b|"),"\\b)"),r,e.concat(C,"*"),e.lookahead(/(?=\()/)],scope:{3:"title.function.invoke"},contains:[ee]};ee.contains.push(te);let ne=[Y,X,n.C_BLOCK_COMMENT_MODE,T,M,I],K={begin:e.concat(/#\[\s*\\?/,e.either(a,c)),beginScope:"meta",end:/]/,endScope:"meta",keywords:{literal:V,keyword:["new","array"]},contains:[{begin:/\[/,end:/]/,keywords:{literal:V,keyword:["new","array"]},contains:["self",...ne]},...ne,{scope:"meta",variants:[{match:a},{match:c}]}]};return{case_insensitive:!1,keywords:Z,contains:[K,n.HASH_COMMENT_MODE,n.COMMENT("//","$"),n.COMMENT("/\\*","\\*/",{contains:[{scope:"doctag",match:"@[A-Za-z]+"}]}),{match:/__halt_compiler\(\);/,keywords:"__halt_compiler",starts:{scope:"comment",end:n.MATCH_NOTHING_RE,contains:[{match:/\?>/,scope:"meta",endsParent:!0}]}},g,{scope:"variable.language",match:/\$this\b/},u,te,X,{match:[/const/,/\s/,r],scope:{1:"keyword",3:"variable.constant"}},I,{scope:"function",relevance:0,beginKeywords:"fn function",end:/[;{]/,excludeEnd:!0,illegal:"[$%\\[]",contains:[{beginKeywords:"use"},n.UNDERSCORE_TITLE_MODE,{begin:"=>",endsParent:!0},{scope:"params",begin:"\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0,keywords:Z,contains:["self",K,u,X,n.C_BLOCK_COMMENT_MODE,T,M]}]},{scope:"class",variants:[{beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{beginKeywords:"extends implements"},n.UNDERSCORE_TITLE_MODE]},{beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,contains:[n.inherit(n.UNDERSCORE_TITLE_MODE,{scope:"title.class"})]},{beginKeywords:"use",relevance:0,end:";",contains:[{match:/\b(as|const|function)\b/,scope:"keyword"},n.UNDERSCORE_TITLE_MODE]},T,M]}}function Hn(n){let e=n.regex,o="HTTP/([32]|1\\.[01])",r=/[A-Za-z][A-Za-z0-9-]*/,a={className:"attribute",begin:e.concat("^",r,"(?=\\:\\s)"),starts:{contains:[{className:"punctuation",begin:/: /,relevance:0,starts:{end:"$",relevance:0}}]}},c=[a,{begin:"\\n\\n",starts:{subLanguage:[],endsWithParent:!0}}];return{name:"HTTP",aliases:["https"],illegal:/\S/,contains:[{begin:"^(?="+o+" \\d{3})",end:/$/,contains:[{className:"meta",begin:o},{className:"number",begin:"\\b\\d{3}\\b"}],starts:{end:/\b\B/,illegal:/\S/,contains:c}},{begin:"(?=^[A-Z]+ (.*?) "+o+"$)",end:/$/,contains:[{className:"string",begin:" ",end:" ",excludeBegin:!0,excludeEnd:!0},{className:"meta",begin:o},{className:"keyword",begin:"[A-Z]+"}],starts:{end:/\b\B/,illegal:/\S/,contains:c}},n.inherit(a,{relevance:0})]}}function ze(n){return{name:"Plain text",aliases:["text","txt"],disableAutodetect:!0}}function Un(n){let e=n.regex;return{name:"Diff",aliases:["patch"],contains:[{className:"meta",relevance:10,match:e.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)},{className:"comment",variants:[{begin:e.either(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,end:/$/}]}}function je(n){let e=n.regex,o={},r={begin:/\$\{/,end:/\}/,contains:["self",{begin:/:-/,contains:[o]}]};Object.assign(o,{className:"variable",variants:[{begin:e.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},r]});let a={className:"subst",begin:/\$\(/,end:/\)/,contains:[n.BACKSLASH_ESCAPE]},c=n.inherit(n.COMMENT(),{match:[/(^|\s)/,/#.*$/],scope:{2:"comment"}}),u={begin:/<<-?\s*(?=\w+)/,starts:{contains:[n.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,className:"string"})]}},g={className:"string",begin:/"/,end:/"/,contains:[n.BACKSLASH_ESCAPE,o,a]};a.contains.push(g);let p={match:/\\"/},f={className:"string",begin:/'/,end:/'/},A={match:/\\'/},S={begin:/\$?\(\(/,end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},n.NUMBER_MODE,o]},E=["fish","bash","zsh","sh","csh","ksh","tcsh","dash","scsh"],C=n.SHEBANG({binary:`(${E.join("|")})`,relevance:10}),T={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,contains:[n.inherit(n.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0},M=["if","then","else","elif","fi","time","for","while","until","in","do","done","case","esac","coproc","function","select"],V=["true","false"],P={match:/(\/[a-z._-]+)+/},H=["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset"],Z=["alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","sudo","type","typeset","ulimit","unalias"],q=["autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp"],I=["chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"];return{name:"Bash",aliases:["sh","zsh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,keyword:M,literal:V,built_in:[...H,...Z,"set","shopt",...q,...I]},contains:[C,n.SHEBANG(),T,S,c,u,P,g,p,f,A,o]}}function xt(n){let e=n.regex,o=new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*","u"),r=["and","as","assert","async","await","break","case","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","match","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],a={$pattern:/[A-Za-z]\w+|__\w+__/,keyword:r,built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]},c={className:"meta",begin:/^(>>>|\.\.\.) /},u={className:"subst",begin:/\{/,end:/\}/,keywords:a,illegal:/#/},g={begin:/\{\{/,relevance:0},p={className:"string",contains:[n.BACKSLASH_ESCAPE],variants:[{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,contains:[n.BACKSLASH_ESCAPE,c],relevance:10},{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,contains:[n.BACKSLASH_ESCAPE,c],relevance:10},{begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,contains:[n.BACKSLASH_ESCAPE,c,g,u]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,end:/"""/,contains:[n.BACKSLASH_ESCAPE,c,g,u]},{begin:/([uU]|[rR])'/,end:/'/,relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,contains:[n.BACKSLASH_ESCAPE,g,u]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,contains:[n.BACKSLASH_ESCAPE,g,u]},n.APOS_STRING_MODE,n.QUOTE_STRING_MODE]},f="[0-9](_?[0-9])*",A=`(\\b(${f}))?\\.(${f})|\\b(${f})\\.`,S=`\\b|${r.join("|")}`,E={className:"number",relevance:0,variants:[{begin:`(\\b(${f})|(${A}))[eE][+-]?(${f})[jJ]?(?=${S})`},{begin:`(${A})[jJ]?`},{begin:`\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${S})`},{begin:`\\b0[bB](_?[01])+[lL]?(?=${S})`},{begin:`\\b0[oO](_?[0-7])+[lL]?(?=${S})`},{begin:`\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${S})`},{begin:`\\b(${f})[jJ](?=${S})`}]},C={className:"comment",begin:e.lookahead(/# type:/),end:/$/,keywords:a,contains:[{begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]},T={className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:a,contains:["self",c,E,p,n.HASH_COMMENT_MODE]}]};return u.contains=[p,E,c],{name:"Python",aliases:["py","gyp","ipython"],unicodeRegex:!0,keywords:a,illegal:/(<\/|\?)|=>/,contains:[c,E,{scope:"variable.language",match:/\bself\b/},{beginKeywords:"if",relevance:0},{match:/\bor\b/,scope:"keyword"},p,C,n.HASH_COMMENT_MODE,{match:[/\bdef/,/\s+/,o],scope:{1:"keyword",3:"title.function"},contains:[T]},{variants:[{match:[/\bclass/,/\s+/,o,/\s*/,/\(\s*/,o,/\s*\)/]},{match:[/\bclass/,/\s+/,o]}],scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[E,T,p]}]}}var Te="[A-Za-z$_][0-9A-Za-z$_]*",kt=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Et=["true","false","null","undefined","NaN","Infinity"],_t=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],St=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],At=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Ct=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Mt=[].concat(At,_t,St);function Fn(n){let e=n.regex,o=(L,{after:G})=>{let re="</"+L[0].slice(1);return L.input.indexOf(re,G)!==-1},r=Te,a={begin:"<>",end:"</>"},c=/<[A-Za-z0-9\\._:-]+\s*\/>/,u={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(L,G)=>{let re=L[0].length+L.index,de=L.input[re];if(de==="<"||de===","){G.ignoreMatch();return}de===">"&&(o(L,{after:re})||G.ignoreMatch());let he,me=L.input.substring(re);if(he=me.match(/^\s*=/)){G.ignoreMatch();return}if((he=me.match(/^\s+extends\s+/))&&he.index===0){G.ignoreMatch();return}}},g={$pattern:Te,keyword:kt,literal:Et,built_in:Mt,"variable.language":Ct},p="[0-9](_?[0-9])*",f=`\\.(${p})`,A="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",S={className:"number",variants:[{begin:`(\\b(${A})((${f})|\\.)?|(${f}))[eE][+-]?(${p})\\b`},{begin:`\\b(${A})\\b((${f})\\b|\\.)?|(${f})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},E={className:"subst",begin:"\\$\\{",end:"\\}",keywords:g,contains:[]},C={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,E],subLanguage:"xml"}},T={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,E],subLanguage:"css"}},M={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[n.BACKSLASH_ESCAPE,E],subLanguage:"graphql"}},V={className:"string",begin:"`",end:"`",contains:[n.BACKSLASH_ESCAPE,E]},P={className:"comment",variants:[n.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:r+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),n.C_BLOCK_COMMENT_MODE,n.C_LINE_COMMENT_MODE]},H=[n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,C,T,M,V,{match:/\$\d+/},S];E.contains=H.concat({begin:/\{/,end:/\}/,keywords:g,contains:["self"].concat(H)});let Z=[].concat(P,E.contains),q=Z.concat([{begin:/(\s*)\(/,end:/\)/,keywords:g,contains:["self"].concat(Z)}]),I={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:g,contains:q},ae={variants:[{match:[/class/,/\s+/,r,/\s+/,/extends/,/\s+/,e.concat(r,"(",e.concat(/\./,r),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,r],scope:{1:"keyword",3:"title.class"}}]},X={relevance:0,match:e.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[..._t,...St]}},Y={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ee={variants:[{match:[/function/,/\s+/,r,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[I],illegal:/%/},te={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function ne(L){return e.concat("(?!",L.join("|"),")")}let K={match:e.concat(/\b/,ne([...At,"super","import"].map(L=>`${L}\\s*\\(`)),r,e.lookahead(/\s*\(/)),className:"title.function",relevance:0},z={begin:e.concat(/\./,e.lookahead(e.concat(r,/(?![0-9A-Za-z$_(])/))),end:r,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},j={match:[/get|set/,/\s+/,r,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},I]},oe="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+n.UNDERSCORE_IDENT_RE+")\\s*=>",ke={match:[/const|var|let/,/\s+/,r,/\s*/,/=\s*/,/(async\s*)?/,e.lookahead(oe)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[I]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:g,exports:{PARAMS_CONTAINS:q,CLASS_REFERENCE:X},illegal:/#(?![$_A-z])/,contains:[n.SHEBANG({label:"shebang",binary:"node",relevance:5}),Y,n.APOS_STRING_MODE,n.QUOTE_STRING_MODE,C,T,M,V,P,{match:/\$\d+/},S,X,{scope:"attr",match:r+e.lookahead(":"),relevance:0},ke,{begin:"("+n.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[P,n.REGEXP_MODE,{className:"function",begin:oe,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:n.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:g,contains:q}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:a.begin,end:a.end},{match:c},{begin:u.begin,"on:begin":u.isTrulyOpeningTag,end:u.end}],subLanguage:"xml",contains:[{begin:u.begin,end:u.end,skip:!0,contains:["self"]}]}]},ee,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+n.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[I,n.inherit(n.TITLE_MODE,{begin:r,className:"title.function"})]},{match:/\.\.\./,relevance:0},z,{match:"\\$"+r,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[I]},K,te,ae,j,{match:/\$[(.]/}]}}function Nt(n){let e=n.regex,o=Fn(n),r=Te,a=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],c={begin:[/namespace/,/\s+/,n.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}},u={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{keyword:"interface extends",built_in:a},contains:[o.exports.CLASS_REFERENCE]},g={className:"meta",relevance:10,begin:/^\s*['"]use strict['"]/},p=["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"],f={$pattern:Te,keyword:kt.concat(p),literal:Et,built_in:Mt.concat(a),"variable.language":Ct},A={className:"meta",begin:"@"+r},S=(M,V,P)=>{let H=M.contains.findIndex(Z=>Z.label===V);if(H===-1)throw new Error("can not find mode to replace");M.contains.splice(H,1,P)};Object.assign(o.keywords,f),o.exports.PARAMS_CONTAINS.push(A);let E=o.contains.find(M=>M.scope==="attr"),C=Object.assign({},E,{match:e.concat(r,e.lookahead(/\s*\?:/))});o.exports.PARAMS_CONTAINS.push([o.exports.CLASS_REFERENCE,E,C]),o.contains=o.contains.concat([A,c,u,C]),S(o,"shebang",n.SHEBANG()),S(o,"use_strict",g);let T=o.contains.find(M=>M.label==="func.def");return T.relevance=0,Object.assign(o,{name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),o}$.registerLanguage("javascript",vt);$.registerLanguage("js",vt);$.registerLanguage("css",Bn);$.registerLanguage("html",Se);$.registerLanguage("xml",Se);$.registerLanguage("xhtml",Se);$.registerLanguage("svg",Se);$.registerLanguage("markup",Se);$.registerLanguage("json",Dn);$.registerLanguage("yaml",yt);$.registerLanguage("yml",yt);$.registerLanguage("php",Pn);$.registerLanguage("http",Hn);$.registerLanguage("plaintext",ze);$.registerLanguage("text",ze);$.registerLanguage("txt",ze);$.registerLanguage("csv",ze);$.registerLanguage("diff",Un);$.registerLanguage("bash",je);$.registerLanguage("shell",je);$.registerLanguage("sh",je);$.registerLanguage("zsh",je);$.registerLanguage("python",xt);$.registerLanguage("py",xt);$.registerLanguage("typescript",Nt);$.registerLanguage("ts",Nt);var _e=new Set,we=null,Ie=null;function Be(){let n=document.documentElement,e=document.body;if(!n||!e)return null;if(n.classList.contains("dark")||e.classList.contains("dark")||n.getAttribute("data-theme")==="dark"||e.getAttribute("data-theme")==="dark")return!0;if(n.getAttribute("data-theme")==="light"||e.getAttribute("data-theme")==="light")return!1;if(n.getAttribute("data-bs-theme")==="dark"||e.getAttribute("data-bs-theme")==="dark")return!0;if(n.getAttribute("data-bs-theme")==="light"||e.getAttribute("data-bs-theme")==="light")return!1;let o=getComputedStyle(n).colorScheme;return o==="dark"?!0:o==="light"?!1:null}function Zn(){let n=Be();if(n!==Ie){Ie=n;for(let e of _e)e._onPageModeChange(n)}}function qn(){if(we)return;we=new MutationObserver(Zn);let n={attributes:!0,attributeFilter:["class","data-theme","data-bs-theme","style"]};we.observe(document.documentElement,n),document.body&&we.observe(document.body,n)}function Kn(){we&&(we.disconnect(),we=null)}function $t(n){_e.add(n),_e.size===1&&qn();let e=Be();Ie=e,n._onPageModeChange(e)}function Lt(n){_e.delete(n),_e.size===0&&(Kn(),Ie=null)}var We=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._codeContent=null,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this),this._observer=null,this._highlighted=!1,this._isLoading=!1,this._loadError=null}connectedCallback(){this._codeContent=this.textContent,this.src?this._loadFromSrc():this.hasAttribute("lazy")?(this.renderPlaceholder(),this._setupLazyObserver()):this.render(),$t(this)}disconnectedCallback(){Lt(this),this._observer&&(this._observer.disconnect(),this._observer=null),document.removeEventListener("click",this._handleOutsideClick)}_setupLazyObserver(){this._observer||(this._observer=new IntersectionObserver(e=>{e[0].isIntersecting&&!this._highlighted&&(this._highlighted=!0,this.render(),this._observer.disconnect(),this._observer=null)},{rootMargin:"100px"}),this._observer.observe(this))}async _loadFromSrc(){let e=this.src;if(e){this._isLoading=!0,this._loadError=null,this._renderLoadingState();try{let o=await fetch(e);if(!o.ok)throw new Error(`HTTP ${o.status}: ${o.statusText}`);let r=await o.text();if(this._codeContent=r,!this.hasAttribute("language")){let a=this._detectLanguageFromUrl(e);a&&this.setAttribute("language",a)}if(!this.hasAttribute("filename")){let a=e.split("/").pop().split("?")[0];a&&this.setAttribute("filename",a)}this._isLoading=!1,this.render(),this.dispatchEvent(new CustomEvent("code-loaded",{detail:{url:e,code:r},bubbles:!0}))}catch(o){this._isLoading=!1,this._loadError=o.message,this._renderErrorState(),this.dispatchEvent(new CustomEvent("code-load-error",{detail:{url:e,error:o.message},bubbles:!0}))}}}_detectLanguageFromUrl(e){let o={js:"javascript",mjs:"javascript",cjs:"javascript",ts:"typescript",tsx:"typescript",jsx:"javascript",py:"python",css:"css",html:"html",htm:"html",json:"json",yaml:"yaml",yml:"yaml",xml:"xml",svg:"xml",sh:"bash",bash:"bash",zsh:"bash",php:"php",diff:"diff",patch:"diff",md:"markdown",markdown:"markdown",txt:"plaintext"},r=e.split("/").pop().split("?")[0].split("#")[0].split(".").pop().toLowerCase();return o[r]||null}_renderLoadingState(){let e=this.theme==="dark";this.shadowRoot.innerHTML=`
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
    `}static get observedAttributes(){return["language","label","theme","data-page-theme","show-lines","filename","highlight-lines","collapsed","max-lines","max-height","wrap","copy-text","copied-text","show-share","show-download","no-copy","lazy","focus-mode","src"]}attributeChangedCallback(e,o,r){if(this.shadowRoot&&o!==r){if(e==="src"&&r){this._loadFromSrc();return}e==="theme"&&(this.hasAttribute("theme")?this.removeAttribute("data-page-theme"):this._onPageModeChange(Be())),this.render()}}_onPageModeChange(e){if(this.hasAttribute("theme")){this.removeAttribute("data-page-theme");return}e===!0?this.setAttribute("data-page-theme","dark"):e===!1?this.setAttribute("data-page-theme","light"):this.removeAttribute("data-page-theme")}get language(){return this.getAttribute("language")||"plaintext"}get label(){return this.getAttribute("label")||this.filename||this.language.toUpperCase()}get theme(){return this.getAttribute("theme")||this.getAttribute("data-page-theme")||"light"}get showLines(){return this.hasAttribute("show-lines")}get filename(){return this.getAttribute("filename")||""}get highlightLines(){let e=this.getAttribute("highlight-lines");if(!e)return new Set;let o=new Set,r=e.split(",");for(let a of r){let c=a.trim();if(c.includes("-")){let[u,g]=c.split("-").map(Number);for(let p=u;p<=g;p++)o.add(p)}else o.add(Number(c))}return o}get collapsed(){return this.hasAttribute("collapsed")}get maxLines(){let e=this.getAttribute("max-lines");return e?parseInt(e,10):10}get maxHeight(){return this.getAttribute("max-height")||""}get wrap(){return this.hasAttribute("wrap")}get copyText(){return this.getAttribute("copy-text")||"Copy"}get copiedText(){return this.getAttribute("copied-text")||"Copied!"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get noCopy(){return this.hasAttribute("no-copy")}get lazy(){return this.hasAttribute("lazy")}get focusMode(){return this.hasAttribute("focus-mode")}get src(){return this.getAttribute("src")||""}async copyCode(){let e=(this._codeContent||this.textContent).trim(),o=document.createElement("div");o.innerHTML=e;let r=o.textContent,a=this.shadowRoot.querySelector(".copy-button"),c=this.copyText,u=this.copiedText;try{await navigator.clipboard.writeText(r),a.textContent=u,a.classList.add("copied"),a.setAttribute("aria-label","Code copied to clipboard")}catch(g){console.error("Failed to copy code:",g),a.textContent="Failed",a.classList.add("failed"),a.setAttribute("aria-label","Failed to copy code")}setTimeout(()=>{a.textContent=c,a.classList.remove("copied","failed"),a.setAttribute("aria-label","Copy code to clipboard")},2e3)}downloadCode(){let e=this.getCode(),o=this.filename||`code.${this._getFileExtension()}`,r=new Blob([e],{type:"text/plain"}),a=URL.createObjectURL(r),c=document.createElement("a");c.href=a,c.download=o,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(a)}_getFileExtension(){return{javascript:"js",js:"js",typescript:"ts",ts:"ts",html:"html",markup:"html",css:"css",json:"json",yaml:"yml",yml:"yml",php:"php",xml:"xml",xhtml:"xhtml",svg:"svg",http:"http",diff:"diff",csv:"csv",plaintext:"txt",text:"txt",txt:"txt"}[this.language]||"txt"}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),o=this.shadowRoot.querySelector(".share-button");this._showShareMenu?(e.style.display="block",o.classList.add("active"),setTimeout(()=>{document.addEventListener("click",this._handleOutsideClick)},0)):(e.style.display="none",o.classList.remove("active"),document.removeEventListener("click",this._handleOutsideClick))}_handleOutsideClick(e){let o=this.shadowRoot.querySelector(".share-menu");o&&!o.contains(e.target)&&this.toggleShareMenu()}async shareViaWebAPI(){if(!navigator.share)return;let e=this.getCode(),o=this.filename||this.label;try{await navigator.share({title:o,text:e}),this.toggleShareMenu()}catch(r){r.name!=="AbortError"&&console.error("Error sharing:",r)}}openInCodePen(){let e=this.getCode(),o=this.language,r={title:this.filename||this.label||"Code Block Demo",description:"Code shared from code-block component",editors:"111"};["html","markup","xhtml","xml","svg"].includes(o)?(r.html=e,r.editors="100"):o==="css"?(r.css=e,r.editors="010"):["javascript","js"].includes(o)?(r.js=e,r.editors="001"):(r.html=`<pre><code>${this.escapeHtml(e)}</code></pre>`,r.editors="100");let a=document.createElement("form");a.action="https://codepen.io/pen/define",a.method="POST",a.target="_blank";let c=document.createElement("input");c.type="hidden",c.name="data",c.value=JSON.stringify(r),a.appendChild(c),document.body.appendChild(a),a.submit(),document.body.removeChild(a),this.toggleShareMenu()}getStyles(){let e=this.theme==="dark";return`
      :host {
        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        background: var(--cb-bg, ${e?"#0d1117":"#f6f8fa"});
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--cb-header-bg, ${e?"#161b22":"#e1e4e8"});
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#d1d5da"});
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
        background: var(--cb-button-bg, ${e?"#21262d":"#fff"});
        border: 1px solid var(--cb-button-border, ${e?"#30363d":"#d1d5da"});
        border-radius: 4px;
        padding: 4px 12px;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--cb-button-color, ${e?"#c9d1d9":"#24292e"});
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        flex-shrink: 0;
      }

      .copy-button:hover {
        background: var(--cb-button-hover-bg, ${e?"#30363d":"#f3f4f6"});
        border-color: ${e?"#8b949e":"#959da5"};
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
        border-radius: 4px;
      }

      .action-button:hover {
        color: var(--cb-button-color, ${e?"#c9d1d9":"#24292e"});
        background: ${e?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.05)"};
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
        background: var(--cb-header-bg, ${e?"#161b22":"#f6f8fa"});
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        font-size: 0.8125rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
        background: var(--cb-code-bg, ${e?"#0d1117":"#fff"});
      }

      .line-numbers {
        padding: 1rem 0;
        text-align: right;
        user-select: none;
        background: var(--cb-line-numbers-bg, ${e?"#161b22":"#f6f8fa"});
        border-right: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        color: var(--cb-line-numbers-color, ${e?"#484f58":"#959da5"});
        line-height: 1.6;
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
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        background: transparent;
        padding: 1rem;
      }

      .code-line {
        display: block;
        line-height: 1.6;
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
        color: var(--cb-comment, ${e?"#8b949e":"#6a737d"});
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
        background: linear-gradient(transparent, var(--cb-code-bg, ${e?"#0d1117":"#fff"}));
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
        border-top: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        color: var(--cb-expand-color, ${e?"#58a6ff":"#0366d6"});
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
        background: var(--cb-scrollbar-track, ${e?"#161b22":"#f6f8fa"});
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, ${e?"#30363d":"#d1d5da"});
        border-radius: 4px;
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
    `}renderPlaceholder(){let e=(this._codeContent||this.textContent).trim(),o=e.split(`
`),r=this.escapeHtml(e).split(`
`).map(g=>`<span class="code-line">${g||" "}</span>`).join(""),a=this.showLines?`<div class="line-numbers" aria-hidden="true">${o.map((g,p)=>`<span>${p+1}</span>`).join("")}</div>`:"",c=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`;this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${c}
        </div>
        <div class="header-actions">
          <button class="copy-button" aria-label="${this.copyText}">${this.copyText}</button>
        </div>
      </div>
      <div class="code-wrapper">
        <div class="code-container">
          ${a}
          <pre><code class="hljs">${r}</code></pre>
        </div>
      </div>
    `;let u=this.shadowRoot.querySelector(".copy-button");u&&u.addEventListener("click",()=>this.copyCode())}render(){let e=(this._codeContent||this.textContent).trim(),o=e.split(`
`),r=this.highlightLines,a=this.language==="diff",c;try{this.language&&this.language!=="plaintext"&&this.language!=="text"&&this.language!=="txt"?c=$.highlight(e,{language:this.language,ignoreIllegals:!0}).value:c=this.escapeHtml(e)}catch{c=this.escapeHtml(e)}let u=c.split(`
`),g=u.map((Y,ee)=>{let te=ee+1,ne=r.has(te),K=["code-line"];if(ne&&K.push("highlighted"),a){let z=o[ee]||"";z.startsWith("+")&&!z.startsWith("+++")?K.push("diff-add"):z.startsWith("-")&&!z.startsWith("---")&&K.push("diff-remove")}return`<span class="${K.join(" ")}">${Y||" "}</span>`}).join(""),p=this.showLines?`<div class="line-numbers" aria-hidden="true">${u.map((Y,ee)=>{let te=ee+1,ne=r.has(te),K=[];if(ne&&K.push("highlighted"),a){let z=o[ee]||"";z.startsWith("+")&&!z.startsWith("+++")?K.push("diff-add"):z.startsWith("-")&&!z.startsWith("---")&&K.push("diff-remove")}return`<span class="${K.join(" ")}">${te}</span>`}).join("")}</div>`:"",f=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`,A=this.hasAttribute("collapsed")||this.hasAttribute("max-lines"),S=u.length,E=this.maxLines,C=A&&S>E,T=this.collapsed,M=T?`calc(${E} * 1.6em + 2rem)`:"none",V=this.maxHeight?`--cb-max-height: ${this.maxHeight};`:"",P=T?`max-height: ${M};`:"";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${f}
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
      <div class="code-container" role="region" aria-labelledby="code-label" style="${V}${P}">
        ${p}
        <pre><code class="language-${this.language}" tabindex="0">${g}</code></pre>
      </div>
      ${C?`
        <button class="expand-button" aria-expanded="${!T}">
          ${T?`Show all ${S} lines`:"Show less"}
        </button>
      `:""}
    `,C?this.setAttribute("data-expandable",""):this.removeAttribute("data-expandable");let H=this.shadowRoot.querySelector(".copy-button");H&&H.addEventListener("click",()=>this.copyCode());let Z=this.shadowRoot.querySelector(".expand-button");Z&&Z.addEventListener("click",()=>this.toggleCollapsed());let q=this.shadowRoot.querySelector(".share-button");q&&q.addEventListener("click",Y=>{Y.stopPropagation(),this.toggleShareMenu()});let I=this.shadowRoot.querySelector(".share-native");I&&I.addEventListener("click",()=>this.shareViaWebAPI());let ae=this.shadowRoot.querySelector(".share-codepen");ae&&ae.addEventListener("click",()=>this.openInCodePen());let X=this.shadowRoot.querySelector(".download-button");X&&X.addEventListener("click",()=>this.downloadCode())}toggleCollapsed(){this.collapsed?this.removeAttribute("collapsed"):this.setAttribute("collapsed","")}escapeHtml(e){let o=document.createElement("div");return o.textContent=e,o.innerHTML}setCode(e){this._codeContent=e,this.render()}getCode(){return(this._codeContent||this.textContent).trim()}static getSupportedLanguages(){return $.listLanguages()}};customElements.define("code-block",We);var Ve=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._activeIndex=0,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this)}connectedCallback(){requestAnimationFrame(()=>{this.render(),this.setupEventListeners()}),$t(this)}disconnectedCallback(){Lt(this),document.removeEventListener("click",this._handleOutsideClick)}static get observedAttributes(){return["theme","data-page-theme","show-share","show-download"]}attributeChangedCallback(e,o,r){this.shadowRoot&&o!==r&&(e==="theme"&&(this.hasAttribute("theme")?this.removeAttribute("data-page-theme"):this._onPageModeChange(Be())),this.render())}_onPageModeChange(e){if(this.hasAttribute("theme")){this.removeAttribute("data-page-theme");return}e===!0?this.setAttribute("data-page-theme","dark"):e===!1?this.setAttribute("data-page-theme","light"):this.removeAttribute("data-page-theme")}get theme(){return this.getAttribute("theme")||this.getAttribute("data-page-theme")||"light"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get codeBlocks(){return Array.from(this.querySelectorAll("code-block"))}get activeIndex(){return this._activeIndex}set activeIndex(e){let o=this.codeBlocks;e>=0&&e<o.length&&(this._activeIndex=e,this.updateActiveTab())}getStyles(){let e=this.theme==="dark";return`
      :host {
        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        background: var(--cb-bg, ${e?"#0d1117":"#f6f8fa"});
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .tabs {
        display: flex;
        background: var(--cb-header-bg, ${e?"#161b22":"#f6f8fa"});
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        overflow-x: auto;
        scrollbar-width: thin;
      }

      .tabs::-webkit-scrollbar {
        height: 4px;
      }

      .tabs::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, ${e?"#30363d":"#d1d5da"});
        border-radius: 2px;
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
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        background: ${e?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.03)"};
      }

      .tab:focus-visible {
        outline: 2px solid var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        outline-offset: -2px;
      }

      .tab[aria-selected="true"] {
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
        border-bottom-color: var(--cb-focus-color, ${e?"#58a6ff":"#0969da"});
        background: var(--cb-code-bg, ${e?"#0d1117":"#fff"});
      }

      .language-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        background: ${e?"rgba(110, 118, 129, 0.4)":"rgba(175, 184, 193, 0.4)"};
        border-radius: 4px;
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
        background: var(--cb-header-bg, ${e?"#161b22":"#f6f8fa"});
        border-bottom: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
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
        border-radius: 4px;
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .action-button:hover {
        background: ${e?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"};
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
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
        border: 1px solid var(--cb-border-color, ${e?"#30363d":"#e1e4e8"});
        border-radius: 6px;
        box-shadow: 0 8px 24px ${e?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.12)"};
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
        color: var(--cb-text-color, ${e?"#c9d1d9":"#24292e"});
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
    `}render(){let e=this.codeBlocks;if(e.length===0)return;e.forEach((a,c)=>{a.setAttribute("theme",this.theme),c===this._activeIndex?a.classList.add("active"):a.classList.remove("active")});let o=e.map((a,c)=>{let u=a.getAttribute("filename"),g=a.getAttribute("label"),p=a.getAttribute("language")||"plaintext",f=u||g||p.toUpperCase(),A=c===this._activeIndex;return`
        <button
          class="tab"
          role="tab"
          aria-selected="${A}"
          aria-controls="panel-${c}"
          tabindex="${A?"0":"-1"}"
          data-index="${c}"
        >
          <span class="tab-label">${this.escapeHtml(f)}</span>
          ${u?`<span class="language-badge">${p}</span>`:""}
        </button>
      `}).join(""),r=this.showShare||this.showDownload?`
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
          ${o}
        </div>
        ${r}
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `}setupEventListeners(){let e=this.shadowRoot.querySelector(".tabs");if(!e)return;e.addEventListener("click",u=>{let g=u.target.closest(".tab");if(g){let p=parseInt(g.dataset.index,10);this.activeIndex=p}}),e.addEventListener("keydown",u=>{let g=this.shadowRoot.querySelectorAll(".tab"),p=this._activeIndex,f=p;switch(u.key){case"ArrowLeft":f=p>0?p-1:g.length-1;break;case"ArrowRight":f=p<g.length-1?p+1:0;break;case"Home":f=0;break;case"End":f=g.length-1;break;default:return}u.preventDefault(),this.activeIndex=f,g[f].focus()});let o=this.shadowRoot.querySelector(".download-button");o&&o.addEventListener("click",()=>this.downloadCode());let r=this.shadowRoot.querySelector(".share-button");r&&r.addEventListener("click",u=>{u.stopPropagation(),this.toggleShareMenu()});let a=this.shadowRoot.querySelector(".web-share-button");a&&a.addEventListener("click",()=>{this.shareViaWebAPI(),this.toggleShareMenu()});let c=this.shadowRoot.querySelector(".codepen-button");c&&c.addEventListener("click",()=>{this.openInCodePen(),this.toggleShareMenu()})}updateActiveTab(){let e=this.shadowRoot.querySelectorAll(".tab"),o=this.codeBlocks;e.forEach((r,a)=>{let c=a===this._activeIndex;r.setAttribute("aria-selected",c),r.setAttribute("tabindex",c?"0":"-1")}),o.forEach((r,a)=>{a===this._activeIndex?r.classList.add("active"):r.classList.remove("active")}),this.dispatchEvent(new CustomEvent("tab-change",{detail:{index:this._activeIndex,block:o[this._activeIndex]},bubbles:!0}))}escapeHtml(e){let o=document.createElement("div");return o.textContent=e,o.innerHTML}selectTab(e){this.activeIndex=e}getActiveBlock(){return this.codeBlocks[this._activeIndex]}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),o=this.shadowRoot.querySelector(".share-button");e&&e.classList.toggle("open",this._showShareMenu),o&&o.setAttribute("aria-expanded",this._showShareMenu),this._showShareMenu?document.addEventListener("click",this._handleOutsideClick):document.removeEventListener("click",this._handleOutsideClick)}_handleOutsideClick(e){let o=this.shadowRoot.querySelector(".share-container");if(o&&!e.composedPath().includes(o)){this._showShareMenu=!1;let r=this.shadowRoot.querySelector(".share-menu"),a=this.shadowRoot.querySelector(".share-button");r&&r.classList.remove("open"),a&&a.setAttribute("aria-expanded","false"),document.removeEventListener("click",this._handleOutsideClick)}}downloadCode(){let e=this.getActiveBlock();e&&typeof e.downloadCode=="function"&&e.downloadCode()}openInCodePen(){let e=this.codeBlocks;if(e.length===0)return;let o="",r="",a="",c="Code Block Group";e.forEach(A=>{let S=A.language,E=A.getCode(),C=A.filename;["html","markup","xhtml","xml","svg"].includes(S)?(o&&(o+=`

`),C&&(o+=`<!-- ${C} -->
`),o+=E):S==="css"?(r&&(r+=`

`),C&&(r+=`/* ${C} */
`),r+=E):["javascript","js"].includes(S)&&(a&&(a+=`

`),C&&(a+=`// ${C}
`),a+=E),(!c||c==="Code Block Group")&&(c=C||A.label||"Code Block Group")});let u="";u+=o?"1":"0",u+=r?"1":"0",u+=a?"1":"0";let g={title:c,description:"Code shared from code-block-group component",html:o,css:r,js:a,editors:u},p=document.createElement("form");p.action="https://codepen.io/pen/define",p.method="POST",p.target="_blank";let f=document.createElement("input");f.type="hidden",f.name="data",f.value=JSON.stringify(g),p.appendChild(f),document.body.appendChild(p),p.submit(),document.body.removeChild(p)}async shareViaWebAPI(){if(!navigator.share)return;let e=this.codeBlocks;if(e.length===0)return;let o="";e.forEach(r=>{let a=r.filename||r.label||r.language,c=r.getCode();o&&(o+=`

`),o+=`// === ${a} ===
${c}`});try{await navigator.share({title:"Code from code-block-group",text:o})}catch(r){r.name!=="AbortError"&&console.error("Share failed:",r)}}};customElements.define("code-block-group",Ve);var Ae=new Set,ve=null,De=null;function Xe(){let n=document.documentElement,e=document.body;if(!n||!e)return null;if(n.classList.contains("dark")||e.classList.contains("dark")||n.getAttribute("data-theme")==="dark"||e.getAttribute("data-theme")==="dark")return!0;if(n.getAttribute("data-theme")==="light"||e.getAttribute("data-theme")==="light")return!1;if(n.getAttribute("data-bs-theme")==="dark"||e.getAttribute("data-bs-theme")==="dark")return!0;if(n.getAttribute("data-bs-theme")==="light"||e.getAttribute("data-bs-theme")==="light")return!1;let o=getComputedStyle(n).colorScheme;return o==="dark"?!0:o==="light"?!1:null}function Gn(){let n=Xe();if(n!==De){De=n;for(let e of Ae)e._onPageModeChange(n)}}function Wn(){if(ve)return;ve=new MutationObserver(Gn);let n={attributes:!0,attributeFilter:["class","data-theme","data-bs-theme","style"]};ve.observe(document.documentElement,n),document.body&&ve.observe(document.body,n)}function Vn(){ve&&(ve.disconnect(),ve=null)}function Jn(n){Ae.add(n),Ae.size===1&&Wn();let e=Xe();De=e,n._onPageModeChange(e)}function Xn(n){Ae.delete(n),Ae.size===0&&(Vn(),De=null)}var Je=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.isMinimized=!1,this.isMaximized=!1,this.overlay=null,this.showSource=!1,this.sourceCode="",this.showShareMenu=!1,this.handleKeydown=this.handleKeydown.bind(this),this.handleOutsideClick=this.handleOutsideClick.bind(this)}async connectedCallback(){this.render(),this.attachEventListeners(),this.src&&await this.fetchSourceCode(),Jn(this)}disconnectedCallback(){Xn(this),this.removeOverlay(),document.removeEventListener("keydown",this.handleKeydown),document.removeEventListener("click",this.handleOutsideClick)}static get observedAttributes(){return["url","title","mode","shadow","src"]}attributeChangedCallback(e){this.shadowRoot&&(this.render(),this.attachEventListeners()),e==="mode"&&(this.hasAttribute("mode")?this.removeAttribute("data-page-mode"):this._onPageModeChange(Xe()))}get url(){return this.getAttribute("url")||""}get src(){return this.getAttribute("src")||""}get browserTitle(){return this.getAttribute("title")||this.getHostname()}get mode(){return this.getAttribute("mode")||this.getAttribute("data-page-mode")||"light"}_onPageModeChange(e){if(this.hasAttribute("mode")){this.removeAttribute("data-page-mode");return}e===!0?this.setAttribute("data-page-mode","dark"):e===!1?this.setAttribute("data-page-mode","light"):this.removeAttribute("data-page-mode"),this._syncIframeColorScheme()}_syncIframeColorScheme(){let e=this.shadowRoot?.querySelector("iframe");if(!e)return;let o=this.mode==="dark";try{let r=e.contentDocument;r?.documentElement&&(r.documentElement.style.colorScheme=o?"dark":"light")}catch{}}get hasShadow(){return this.hasAttribute("shadow")}getHostname(){try{return new URL(this.url).hostname}catch{return this.url}}attachEventListeners(){let e=this.shadowRoot.querySelector(".control-button.close"),o=this.shadowRoot.querySelector(".control-button.minimize"),r=this.shadowRoot.querySelector(".control-button.maximize"),a=this.shadowRoot.querySelector(".view-source-button"),c=this.shadowRoot.querySelector(".copy-source-button"),u=this.shadowRoot.querySelector(".share-button"),g=this.shadowRoot.querySelector(".browser-header");e?.addEventListener("click",()=>this.handleClose()),o?.addEventListener("click",()=>this.toggleMinimize()),r?.addEventListener("click",()=>this.toggleMaximize()),a?.addEventListener("click",()=>this.toggleViewSource()),c?.addEventListener("click",()=>this.copySourceCode()),u?.addEventListener("click",f=>{f.stopPropagation(),this.toggleShareMenu()}),g?.addEventListener("dblclick",f=>{let A=f.target;(A.classList.contains("browser-header")||A.classList.contains("controls"))&&this.toggleMaximize()});let p=this.shadowRoot.querySelector("iframe");p?.addEventListener("error",()=>this.handleIframeError()),p?.addEventListener("load",()=>this._syncIframeColorScheme())}handleIframeError(){let e=this.shadowRoot.querySelector(".browser-content");e&&(e.innerHTML=`
      <div class="error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Failed to load content</p>
        <button class="retry-button" onclick="this.getRootNode().host.retryLoad()">Retry</button>
      </div>
    `)}retryLoad(){let e=this.shadowRoot.querySelector(".browser-content");if(!e||!this.src)return;e.innerHTML=`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`;let o=e.querySelector("iframe");o?.addEventListener("error",()=>this.handleIframeError()),o?.addEventListener("load",()=>this._syncIframeColorScheme())}async fetchSourceCode(){if(this.src)try{let e=await fetch(this.src);e.ok&&(this.sourceCode=await e.text())}catch(e){console.error("Failed to fetch source code:",e),this.sourceCode="// Failed to load source code"}}toggleViewSource(){this.showSource=!this.showSource,this.updateContentView()}updateContentView(){let e=this.shadowRoot.querySelector(".browser-content"),o=this.shadowRoot.querySelector(".view-source-button");e&&(this.showSource?(e.innerHTML=`
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
          <pre><code>${this.escapeHtml(this.sourceCode)}</code></pre>
        </div>
      `,o.classList.add("active"),e.querySelector(".copy-source-button")?.addEventListener("click",()=>this.copySourceCode())):(this.src?(e.innerHTML=`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`,e.querySelector("iframe")?.addEventListener("load",()=>this._syncIframeColorScheme())):e.innerHTML="<slot></slot>",o.classList.remove("active")))}async copySourceCode(){if(this.sourceCode)try{await navigator.clipboard.writeText(this.sourceCode);let e=this.shadowRoot.querySelector(".copy-source-button");if(e){let o=e.innerHTML;e.innerHTML=`
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3,8 6,11 13,4"/>
          </svg>
          Copied!
        `,e.classList.add("copied"),setTimeout(()=>{e.innerHTML=o,e.classList.remove("copied")},2e3)}}catch(e){console.error("Failed to copy source code:",e)}}toggleShareMenu(){this.showShareMenu=!this.showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),o=this.shadowRoot.querySelector(".share-button");this.showShareMenu?(e.style.display="block",o.classList.add("active"),setTimeout(()=>{document.addEventListener("click",this.handleOutsideClick)},0)):(e.style.display="none",o.classList.remove("active"),document.removeEventListener("click",this.handleOutsideClick))}handleOutsideClick(e){let o=this.shadowRoot.querySelector(".share-menu");o&&!o.contains(e.target)&&this.toggleShareMenu()}async shareViaWebAPI(){if(!navigator.share){console.warn("Web Share API not supported");return}let e={title:this.browserTitle||"CSS Demo",text:`Check out this CSS demo: ${this.browserTitle}`,url:this.src||this.url};try{await navigator.share(e),this.toggleShareMenu()}catch(o){o.name!=="AbortError"&&console.error("Error sharing:",o)}}parseHTMLForCodePen(){if(!this.sourceCode)return null;let e=new DOMParser().parseFromString(this.sourceCode,"text/html"),o=Array.from(e.querySelectorAll("style")).map(c=>c.textContent).join(`

`),r=Array.from(e.querySelectorAll("script")).filter(c=>!c.src&&c.type!=="module").map(c=>c.textContent).join(`

`),a=e.body.cloneNode(!0);return a.querySelectorAll("script, style").forEach(c=>c.remove()),{html:a.innerHTML.trim(),css:o.trim(),js:r.trim()}}openInCodePen(){let e=this.parseHTMLForCodePen();if(!e)return;let o={title:this.browserTitle||"CSS Demo",description:`Demo from ${this.url}`,html:e.html,css:e.css,js:e.js,editors:"110"},r=document.createElement("form");r.action="https://codepen.io/pen/define",r.method="POST",r.target="_blank";let a=document.createElement("input");a.type="hidden",a.name="data",a.value=JSON.stringify(o),r.appendChild(a),document.body.appendChild(r),r.submit(),document.body.removeChild(r),this.toggleShareMenu()}handleClose(){this.isMaximized&&this.toggleMaximize()}handleKeydown(e){e.key==="Escape"&&(this.showShareMenu?this.toggleShareMenu():this.isMaximized&&this.toggleMaximize())}createOverlay(){if(this.overlay)return;this.overlay=document.createElement("div"),this.overlay.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      cursor: pointer;
      animation: fadeIn 200ms ease;
    `;let e=document.createElement("style");e.textContent=`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,document.head.appendChild(e),this.overlay.addEventListener("click",()=>this.toggleMaximize()),document.body.appendChild(this.overlay),document.addEventListener("keydown",this.handleKeydown)}removeOverlay(){this.overlay&&(this.overlay.remove(),this.overlay=null),document.removeEventListener("keydown",this.handleKeydown)}toggleMinimize(){let e=this.shadowRoot.querySelector(".browser-content");e&&(this.isMinimized=!this.isMinimized,this.isMinimized?(this.isMaximized&&this.toggleMaximize(),e.style.display="none"):e.style.display="")}toggleMaximize(){let e=this.shadowRoot.querySelector(".control-button.maximize");if(this.isMaximized){this.classList.remove("browser-window-maximized"),this.removeAttribute("role"),this.removeAttribute("aria-modal");let o=this.shadowRoot.querySelector("iframe");o&&(o.style.minHeight=""),this.removeOverlay(),this.isMaximized=!1,e&&(e.setAttribute("aria-label","Maximize window"),e.setAttribute("aria-expanded","false"))}else{this.isMinimized&&this.toggleMinimize(),this.createOverlay(),this.classList.add("browser-window-maximized"),this.setAttribute("role","dialog"),this.setAttribute("aria-modal","true");let o=this.shadowRoot.querySelector("iframe");o&&(o.style.minHeight="calc(90vh - 50px)"),this.isMaximized=!0,e&&(e.setAttribute("aria-label","Restore window"),e.setAttribute("aria-expanded","true"))}}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          /* CSS Custom Properties with light mode defaults */
          --browser-window-bg: #ffffff;
          --browser-window-header-bg: #f6f8fa;
          --browser-window-border-color: #d1d5da;
          --browser-window-border-radius: 8px;
          --browser-window-text-color: #24292e;
          --browser-window-text-muted: #586069;
          --browser-window-url-bg: #ffffff;
          --browser-window-shadow: ${this.hasShadow?"0 4px 12px rgba(0, 0, 0, 0.15)":"none"};
          --browser-window-close-color: #ff5f57;
          --browser-window-minimize-color: #febc2e;
          --browser-window-maximize-color: #28c840;
          --browser-window-accent-color: #2563eb;
          --browser-window-hover-bg: #f3f4f6;
          --browser-window-active-bg: #dbeafe;
          --browser-window-content-bg: #ffffff;
          --browser-window-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --browser-window-mono-font: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

          display: flex;
          flex-direction: column;
          margin: 1rem 0;
          border-radius: var(--browser-window-border-radius);
          overflow: hidden;
          border: 1px solid var(--browser-window-border-color);
          background: var(--browser-window-bg);
          box-shadow: var(--browser-window-shadow);
          transition: all 250ms ease-out;
          font-family: var(--browser-window-font-family);
          color: var(--browser-window-text-color);
          color-scheme: light;

          /* Resizable container */
          resize: both;
          min-width: 280px;
          min-height: 150px;

        }

        /* Auto dark mode based on system preference (when no mode attribute) */
        @media (prefers-color-scheme: dark) {
          :host(:not([mode])) {
            --browser-window-bg: #1c1c1e;
            --browser-window-header-bg: #2c2c2e;
            --browser-window-border-color: #3a3a3c;
            --browser-window-text-color: #e5e5e7;
            --browser-window-text-muted: #98989d;
            --browser-window-url-bg: #1c1c1e;
            --browser-window-hover-bg: #3a3a3c;
            --browser-window-content-bg: #000000;
            color-scheme: dark;
          }
        }

        /* Page-level dark mode detection (overrides media query via higher specificity) */
        :host([data-page-mode="dark"]:not([mode])) {
          --browser-window-bg: #1c1c1e;
          --browser-window-header-bg: #2c2c2e;
          --browser-window-border-color: #3a3a3c;
          --browser-window-text-color: #e5e5e7;
          --browser-window-text-muted: #98989d;
          --browser-window-url-bg: #1c1c1e;
          --browser-window-hover-bg: #3a3a3c;
          --browser-window-content-bg: #000000;
          color-scheme: dark;
        }

        :host([data-page-mode="light"]:not([mode])) {
          --browser-window-bg: #ffffff;
          --browser-window-header-bg: #f6f8fa;
          --browser-window-border-color: #d1d5da;
          --browser-window-text-color: #24292e;
          --browser-window-text-muted: #586069;
          --browser-window-url-bg: #ffffff;
          --browser-window-hover-bg: #f3f4f6;
          --browser-window-content-bg: #ffffff;
          color-scheme: light;
        }

        /* Explicit dark mode override */
        :host([mode="dark"]) {
          --browser-window-bg: #1c1c1e;
          --browser-window-header-bg: #2c2c2e;
          --browser-window-border-color: #3a3a3c;
          --browser-window-text-color: #e5e5e7;
          --browser-window-text-muted: #98989d;
          --browser-window-url-bg: #1c1c1e;
          --browser-window-hover-bg: #3a3a3c;
          --browser-window-content-bg: #000000;
          color-scheme: dark;
        }

        /* Explicit light mode override (for users on dark system who want light) */
        :host([mode="light"]) {
          --browser-window-bg: #ffffff;
          --browser-window-header-bg: #f6f8fa;
          --browser-window-border-color: #d1d5da;
          --browser-window-text-color: #24292e;
          --browser-window-text-muted: #586069;
          --browser-window-url-bg: #ffffff;
          --browser-window-hover-bg: #f3f4f6;
          --browser-window-content-bg: #ffffff;
          color-scheme: light;
        }

        :host(.browser-window-maximized) {
          position: fixed !important;
          top: 5vh !important;
          left: 5vw !important;
          width: 90vw !important;
          height: 90vh !important;
          z-index: 9999 !important;
          margin: 0 !important;
          resize: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
          :host {
            transition: none;
          }
        }

        .browser-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--browser-window-header-bg);
          border-bottom: 1px solid var(--browser-window-border-color);
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
          background: var(--browser-window-url-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--browser-window-text-muted);
          cursor: default !important;
        }

        .lock-icon {
          color: var(--browser-window-text-muted);
          font-size: 0.75rem;
        }

        .url-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--browser-window-text-muted);
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
          color: var(--browser-window-text-muted);
          transition: all 150ms ease;
          border-radius: 4px;
        }

        .view-source-button:hover,
        .download-button:hover {
          color: var(--browser-window-text-color);
          background: var(--browser-window-hover-bg);
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

        .share-container {
          position: relative;
          display: inline-block;
        }

        .share-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--browser-window-text-muted);
          transition: all 150ms ease;
          border-radius: 4px;
        }

        .share-button:hover {
          color: var(--browser-window-text-color);
          background: var(--browser-window-hover-bg);
        }

        .share-button:active {
          transform: scale(0.95);
        }

        .share-button.active {
          color: var(--browser-window-accent-color);
          background: var(--browser-window-active-bg);
        }

        .share-menu {
          display: none;
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: var(--browser-window-header-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 180px;
          z-index: 1000;
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
          color: var(--browser-window-text-color);
          font-size: 0.875rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: background 150ms ease;
          border-bottom: 1px solid var(--browser-window-border-color);
        }

        .share-menu-item:last-child {
          border-bottom: none;
        }

        .share-menu-item:hover {
          background: var(--browser-window-hover-bg);
        }

        .share-menu-item:active {
          background: var(--browser-window-active-bg);
        }

        .share-menu-item svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .browser-content {
          background: var(--browser-window-content-bg);
          min-height: 200px;
          padding: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
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
          background: var(--browser-window-header-bg);
          min-height: 200px;
          /* Constrain source view height to prevent container expansion */
          max-height: 50vh;
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
          background: var(--browser-window-header-bg);
          border-bottom: 1px solid var(--browser-window-border-color);
          backdrop-filter: blur(8px);
        }

        .source-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--browser-window-text-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .copy-source-button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: var(--browser-window-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 6px;
          color: var(--browser-window-text-color);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .copy-source-button:hover {
          background: var(--browser-window-hover-bg);
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
          background: var(--browser-window-content-bg);
          border: 1px solid var(--browser-window-border-color);
          border-radius: 6px;
          overflow-x: auto;
          font-family: var(--browser-window-mono-font);
          font-size: 0.875rem;
          line-height: 1.6;
        }

        .source-view code {
          color: var(--browser-window-text-color);
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
          color: var(--browser-window-text-muted);
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
          border-radius: 6px;
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
      </style>
      <div class="browser-header" role="toolbar" aria-label="Window controls">
        <div class="controls">
          <button class="control-button close" aria-label="Close window" tabindex="0"></button>
          <button class="control-button minimize" aria-label="Minimize window" tabindex="0"></button>
          <button class="control-button maximize" aria-label="${this.isMaximized?"Restore window":"Maximize window"}" aria-expanded="${this.isMaximized}" tabindex="0"></button>
        </div>
        <div class="url-bar">
          ${this.url.startsWith("https")?'<span class="lock-icon">\u{1F512}</span>':""}
          <span class="url-text" title="${this.escapeHtml(this.url)}">${this.escapeHtml(this.browserTitle)}</span>
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
                  <button class="share-menu-item" onclick="this.getRootNode().host.shareViaWebAPI()">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="4" r="2"/>
                      <circle cx="4" cy="8" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M6 9l4 2M6 7l4-2"/>
                    </svg>
                    Share...
                  </button>
                `:""}
                <button class="share-menu-item" onclick="this.getRootNode().host.openInCodePen()">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L0 5v6l8 5 8-5V5L8 0zM7 10.5L2 7.5v-2l5 3v2zm1-3l-5-3L8 2l5 2.5-5 3zm1 3v-2l5-3v2l-5 3z"/>
                  </svg>
                  Open in CodePen
                </button>
              </div>
            </div>
            <a href="${this.escapeHtml(this.src)}" download class="download-button" title="Download demo HTML file">
              <svg class="download-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 1v10M8 11l-3-3M8 11l3-3"/>
                <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
              </svg>
            </a>
          `:""}
        </div>
      </div>
      <div class="browser-content">
        ${this.src?`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`:"<slot></slot>"}
      </div>
    `}escapeHtml(e){let o=document.createElement("div");return o.textContent=e,o.innerHTML}};customElements.define("browser-window",Je);
