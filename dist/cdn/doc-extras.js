function Sr(o){return o&&o.__esModule&&Object.prototype.hasOwnProperty.call(o,"default")?o.default:o}var Ge,gt;function Ar(){if(gt)return Ge;gt=1;function o(t){return t instanceof Map?t.clear=t.delete=t.set=function(){throw new Error("map is read-only")}:t instanceof Set&&(t.add=t.clear=t.delete=function(){throw new Error("set is read-only")}),Object.freeze(t),Object.getOwnPropertyNames(t).forEach(i=>{let d=t[i],y=typeof d;(y==="object"||y==="function")&&!Object.isFrozen(d)&&o(d)}),t}class e{constructor(i){i.data===void 0&&(i.data={}),this.data=i.data,this.isMatchIgnored=!1}ignoreMatch(){this.isMatchIgnored=!0}}function r(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")}function n(t,...i){let d=Object.create(null);for(let y in t)d[y]=t[y];return i.forEach(function(y){for(let B in y)d[B]=y[B]}),d}let a="</span>",s=t=>!!t.scope,h=(t,{prefix:i})=>{if(t.startsWith("language:"))return t.replace("language:","language-");if(t.includes(".")){let d=t.split(".");return[`${i}${d.shift()}`,...d.map((y,B)=>`${y}${"_".repeat(B+1)}`)].join(" ")}return`${i}${t}`};class b{constructor(i,d){this.buffer="",this.classPrefix=d.classPrefix,i.walk(this)}addText(i){this.buffer+=r(i)}openNode(i){if(!s(i))return;let d=h(i.scope,{prefix:this.classPrefix});this.span(d)}closeNode(i){s(i)&&(this.buffer+=a)}value(){return this.buffer}span(i){this.buffer+=`<span class="${i}">`}}let u=(t={})=>{let i={children:[]};return Object.assign(i,t),i};class g{constructor(){this.rootNode=u(),this.stack=[this.rootNode]}get top(){return this.stack[this.stack.length-1]}get root(){return this.rootNode}add(i){this.top.children.push(i)}openNode(i){let d=u({scope:i});this.add(d),this.stack.push(d)}closeNode(){if(this.stack.length>1)return this.stack.pop()}closeAllNodes(){for(;this.closeNode(););}toJSON(){return JSON.stringify(this.rootNode,null,4)}walk(i){return this.constructor._walk(i,this.rootNode)}static _walk(i,d){return typeof d=="string"?i.addText(d):d.children&&(i.openNode(d),d.children.forEach(y=>this._walk(i,y)),i.closeNode(d)),i}static _collapse(i){typeof i!="string"&&i.children&&(i.children.every(d=>typeof d=="string")?i.children=[i.children.join("")]:i.children.forEach(d=>{g._collapse(d)}))}}class E extends g{constructor(i){super(),this.options=i}addText(i){i!==""&&this.add(i)}startScope(i){this.openNode(i)}endScope(){this.closeNode()}__addSublanguage(i,d){let y=i.root;d&&(y.scope=`language:${d}`),this.add(y)}toHTML(){return new b(this,this.options).value()}finalize(){return this.closeAllNodes(),!0}}function S(t){return t?typeof t=="string"?t:t.source:null}function _(t){return M("(?=",t,")")}function C(t){return M("(?:",t,")*")}function I(t){return M("(?:",t,")?")}function M(...t){return t.map(i=>S(i)).join("")}function V(t){let i=t[t.length-1];return typeof i=="object"&&i.constructor===Object?(t.splice(t.length-1,1),i):{}}function P(...t){return"("+(V(t).capture?"":"?:")+t.map(i=>S(i)).join("|")+")"}function H(t){return new RegExp(t.toString()+"|").exec("").length-1}function q(t,i){let d=t&&t.exec(i);return d&&d.index===0}let Z=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;function z(t,{joinWith:i}){let d=0;return t.map(y=>{d+=1;let B=d,D=S(y),m="";for(;D.length>0;){let p=Z.exec(D);if(!p){m+=D;break}m+=D.substring(0,p.index),D=D.substring(p.index+p[0].length),p[0][0]==="\\"&&p[1]?m+="\\"+String(Number(p[1])+B):(m+=p[0],p[0]==="("&&d++)}return m}).map(y=>`(${y})`).join(i)}let ie=/\b\B/,J="[a-zA-Z]\\w*",Y="[a-zA-Z_]\\w*",ee="\\b\\d+(\\.\\d+)?",te="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",re="\\b(0b[01]+)",K="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",T=(t={})=>{let i=/^#![ ]*\//;return t.binary&&(t.begin=M(i,/.*\b/,t.binary,/\b.*/)),n({scope:"meta",begin:i,end:/$/,relevance:0,"on:begin":(d,y)=>{d.index!==0&&y.ignoreMatch()}},t)},j={begin:"\\\\[\\s\\S]",relevance:0},oe={scope:"string",begin:"'",end:"'",illegal:"\\n",contains:[j]},_e={scope:"string",begin:'"',end:'"',illegal:"\\n",contains:[j]},L={begin:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},G=function(t,i,d={}){let y=n({scope:"comment",begin:t,end:i,contains:[]},d);y.contains.push({scope:"doctag",begin:"[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",end:/(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,excludeBegin:!0,relevance:0});let B=P("I","a","is","so","us","to","at","if","in","it","on",/[A-Za-z]+['](d|ve|re|ll|t|s|n)/,/[A-Za-z]+[-][a-z]+/,/[A-Za-z][a-z]{2,}/);return y.contains.push({begin:M(/[ ]+/,"(",B,/[.]?[:]?([.][ ]|[ ])/,"){3}")}),y},ne=G("//","$"),de=G("/\\*","\\*/"),he=G("#","$"),pe={scope:"number",begin:ee,relevance:0},zt={scope:"number",begin:te,relevance:0},Tt={scope:"number",begin:re,relevance:0},jt={scope:"regexp",begin:/\/(?=[^/\n]*\/)/,end:/\/[gimuy]*/,contains:[j,{begin:/\[/,end:/\]/,relevance:0,contains:[j]}]},Bt={scope:"title",begin:J,relevance:0},Dt={scope:"title",begin:Y,relevance:0},Pt={begin:"\\.\\s*"+Y,relevance:0};var Ce=Object.freeze({__proto__:null,APOS_STRING_MODE:oe,BACKSLASH_ESCAPE:j,BINARY_NUMBER_MODE:Tt,BINARY_NUMBER_RE:re,COMMENT:G,C_BLOCK_COMMENT_MODE:de,C_LINE_COMMENT_MODE:ne,C_NUMBER_MODE:zt,C_NUMBER_RE:te,END_SAME_AS_BEGIN:function(t){return Object.assign(t,{"on:begin":(i,d)=>{d.data._beginMatch=i[1]},"on:end":(i,d)=>{d.data._beginMatch!==i[1]&&d.ignoreMatch()}})},HASH_COMMENT_MODE:he,IDENT_RE:J,MATCH_NOTHING_RE:ie,METHOD_GUARD:Pt,NUMBER_MODE:pe,NUMBER_RE:ee,PHRASAL_WORDS_MODE:L,QUOTE_STRING_MODE:_e,REGEXP_MODE:jt,RE_STARTERS_RE:K,SHEBANG:T,TITLE_MODE:Bt,UNDERSCORE_IDENT_RE:Y,UNDERSCORE_TITLE_MODE:Dt});function Ht(t,i){t.input[t.index-1]==="."&&i.ignoreMatch()}function Ut(t,i){t.className!==void 0&&(t.scope=t.className,delete t.className)}function Ft(t,i){i&&t.beginKeywords&&(t.begin="\\b("+t.beginKeywords.split(" ").join("|")+")(?!\\.)(?=\\b|\\s)",t.__beforeBegin=Ht,t.keywords=t.keywords||t.beginKeywords,delete t.beginKeywords,t.relevance===void 0&&(t.relevance=0))}function qt(t,i){Array.isArray(t.illegal)&&(t.illegal=P(...t.illegal))}function Zt(t,i){if(t.match){if(t.begin||t.end)throw new Error("begin & end are not supported with match");t.begin=t.match,delete t.match}}function Kt(t,i){t.relevance===void 0&&(t.relevance=1)}let Gt=(t,i)=>{if(!t.beforeMatch)return;if(t.starts)throw new Error("beforeMatch cannot be used with starts");let d=Object.assign({},t);Object.keys(t).forEach(y=>{delete t[y]}),t.keywords=d.keywords,t.begin=M(d.beforeMatch,_(d.begin)),t.starts={relevance:0,contains:[Object.assign(d,{endsParent:!0})]},t.relevance=0,delete d.beforeMatch},Wt=["of","and","for","in","not","or","if","then","parent","list","value"],Vt="keyword";function Qe(t,i,d=Vt){let y=Object.create(null);return typeof t=="string"?B(d,t.split(" ")):Array.isArray(t)?B(d,t):Object.keys(t).forEach(function(D){Object.assign(y,Qe(t[D],i,D))}),y;function B(D,m){i&&(m=m.map(p=>p.toLowerCase())),m.forEach(function(p){let w=p.split("|");y[w[0]]=[D,Xt(w[0],w[1])]})}}function Xt(t,i){return i?Number(i):Jt(t)?0:1}function Jt(t){return Wt.includes(t.toLowerCase())}let Ye={},me=t=>{console.error(t)},et=(t,...i)=>{console.log(`WARN: ${t}`,...i)},xe=(t,i)=>{Ye[`${t}/${i}`]||(console.log(`Deprecated as of ${t}. ${i}`),Ye[`${t}/${i}`]=!0)},Me=new Error;function tt(t,i,{key:d}){let y=0,B=t[d],D={},m={};for(let p=1;p<=i.length;p++)m[p+y]=B[p],D[p+y]=!0,y+=H(i[p-1]);t[d]=m,t[d]._emit=D,t[d]._multi=!0}function Qt(t){if(Array.isArray(t.begin)){if(t.skip||t.excludeBegin||t.returnBegin)throw me("skip, excludeBegin, returnBegin not compatible with beginScope: {}"),Me;if(typeof t.beginScope!="object"||t.beginScope===null)throw me("beginScope must be object"),Me;tt(t,t.begin,{key:"beginScope"}),t.begin=z(t.begin,{joinWith:""})}}function Yt(t){if(Array.isArray(t.end)){if(t.skip||t.excludeEnd||t.returnEnd)throw me("skip, excludeEnd, returnEnd not compatible with endScope: {}"),Me;if(typeof t.endScope!="object"||t.endScope===null)throw me("endScope must be object"),Me;tt(t,t.end,{key:"endScope"}),t.end=z(t.end,{joinWith:""})}}function er(t){t.scope&&typeof t.scope=="object"&&t.scope!==null&&(t.beginScope=t.scope,delete t.scope)}function tr(t){er(t),typeof t.beginScope=="string"&&(t.beginScope={_wrap:t.beginScope}),typeof t.endScope=="string"&&(t.endScope={_wrap:t.endScope}),Qt(t),Yt(t)}function rr(t){function i(m,p){return new RegExp(S(m),"m"+(t.case_insensitive?"i":"")+(t.unicodeRegex?"u":"")+(p?"g":""))}class d{constructor(){this.matchIndexes={},this.regexes=[],this.matchAt=1,this.position=0}addRule(p,w){w.position=this.position++,this.matchIndexes[this.matchAt]=w,this.regexes.push([w,p]),this.matchAt+=H(p)+1}compile(){this.regexes.length===0&&(this.exec=()=>null);let p=this.regexes.map(w=>w[1]);this.matcherRe=i(z(p,{joinWith:"|"}),!0),this.lastIndex=0}exec(p){this.matcherRe.lastIndex=this.lastIndex;let w=this.matcherRe.exec(p);if(!w)return null;let W=w.findIndex((ke,He)=>He>0&&ke!==void 0),U=this.matchIndexes[W];return w.splice(0,W),Object.assign(w,U)}}class y{constructor(){this.rules=[],this.multiRegexes=[],this.count=0,this.lastIndex=0,this.regexIndex=0}getMatcher(p){if(this.multiRegexes[p])return this.multiRegexes[p];let w=new d;return this.rules.slice(p).forEach(([W,U])=>w.addRule(W,U)),w.compile(),this.multiRegexes[p]=w,w}resumingScanAtSamePosition(){return this.regexIndex!==0}considerAll(){this.regexIndex=0}addRule(p,w){this.rules.push([p,w]),w.type==="begin"&&this.count++}exec(p){let w=this.getMatcher(this.regexIndex);w.lastIndex=this.lastIndex;let W=w.exec(p);if(this.resumingScanAtSamePosition()&&!(W&&W.index===this.lastIndex)){let U=this.getMatcher(0);U.lastIndex=this.lastIndex+1,W=U.exec(p)}return W&&(this.regexIndex+=W.position+1,this.regexIndex===this.count&&this.considerAll()),W}}function B(m){let p=new y;return m.contains.forEach(w=>p.addRule(w.begin,{rule:w,type:"begin"})),m.terminatorEnd&&p.addRule(m.terminatorEnd,{type:"end"}),m.illegal&&p.addRule(m.illegal,{type:"illegal"}),p}function D(m,p){let w=m;if(m.isCompiled)return w;[Ut,Zt,tr,Gt].forEach(U=>U(m,p)),t.compilerExtensions.forEach(U=>U(m,p)),m.__beforeBegin=null,[Ft,qt,Kt].forEach(U=>U(m,p)),m.isCompiled=!0;let W=null;return typeof m.keywords=="object"&&m.keywords.$pattern&&(m.keywords=Object.assign({},m.keywords),W=m.keywords.$pattern,delete m.keywords.$pattern),W=W||/\w+/,m.keywords&&(m.keywords=Qe(m.keywords,t.case_insensitive)),w.keywordPatternRe=i(W,!0),p&&(m.begin||(m.begin=/\B|\b/),w.beginRe=i(w.begin),!m.end&&!m.endsWithParent&&(m.end=/\B|\b/),m.end&&(w.endRe=i(w.end)),w.terminatorEnd=S(w.end)||"",m.endsWithParent&&p.terminatorEnd&&(w.terminatorEnd+=(m.end?"|":"")+p.terminatorEnd)),m.illegal&&(w.illegalRe=i(m.illegal)),m.contains||(m.contains=[]),m.contains=[].concat(...m.contains.map(function(U){return or(U==="self"?m:U)})),m.contains.forEach(function(U){D(U,w)}),m.starts&&D(m.starts,p),w.matcher=B(w),w}if(t.compilerExtensions||(t.compilerExtensions=[]),t.contains&&t.contains.includes("self"))throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");return t.classNameAliases=n(t.classNameAliases||{}),D(t)}function rt(t){return t?t.endsWithParent||rt(t.starts):!1}function or(t){return t.variants&&!t.cachedVariants&&(t.cachedVariants=t.variants.map(function(i){return n(t,{variants:null},i)})),t.cachedVariants?t.cachedVariants:rt(t)?n(t,{starts:t.starts?n(t.starts):null}):Object.isFrozen(t)?n(t):t}var nr="11.11.1";class ar extends Error{constructor(i,d){super(i),this.name="HTMLInjectionError",this.html=d}}let Pe=r,ot=n,nt=Symbol("nomatch"),ir=7,at=function(t){let i=Object.create(null),d=Object.create(null),y=[],B=!0,D="Could not find the language '{}', did you forget to load/include a language module?",m={disableAutodetect:!0,name:"Plain text",contains:[]},p={ignoreUnescapedHTML:!1,throwUnescapedHTML:!1,noHighlightRe:/^(no-?highlight)$/i,languageDetectRe:/\blang(?:uage)?-([\w-]+)\b/i,classPrefix:"hljs-",cssSelector:"pre code",languages:null,__emitter:E};function w(c){return p.noHighlightRe.test(c)}function W(c){let v=c.className+" ";v+=c.parentNode?c.parentNode.className:"";let A=p.languageDetectRe.exec(v);if(A){let O=ue(A[1]);return O||(et(D.replace("{}",A[1])),et("Falling back to no-highlight mode for this block.",c)),O?A[1]:"no-highlight"}return v.split(/\s+/).find(O=>w(O)||ue(O))}function U(c,v,A){let O="",F="";typeof v=="object"?(O=c,A=v.ignoreIllegals,F=v.language):(xe("10.7.0","highlight(lang, code, ...args) has been deprecated."),xe("10.7.0",`Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`),F=c,O=v),A===void 0&&(A=!0);let se={code:O,language:F};$e("before:highlight",se);let ge=se.result?se.result:ke(se.language,se.code,A);return ge.code=se.code,$e("after:highlight",ge),ge}function ke(c,v,A,O){let F=Object.create(null);function se(l,f){return l.keywords[f]}function ge(){if(!x.keywords){X.addText(R);return}let l=0;x.keywordPatternRe.lastIndex=0;let f=x.keywordPatternRe.exec(R),k="";for(;f;){k+=R.substring(l,f.index);let N=le.case_insensitive?f[0].toLowerCase():f[0],Q=se(x,N);if(Q){let[be,kr]=Q;if(X.addText(k),k="",F[N]=(F[N]||0)+1,F[N]<=ir&&(Re+=kr),be.startsWith("_"))k+=f[0];else{let Er=le.classNameAliases[be]||be;ce(f[0],Er)}}else k+=f[0];l=x.keywordPatternRe.lastIndex,f=x.keywordPatternRe.exec(R)}k+=R.substring(l),X.addText(k)}function Le(){if(R==="")return;let l=null;if(typeof x.subLanguage=="string"){if(!i[x.subLanguage]){X.addText(R);return}l=ke(x.subLanguage,R,!0,ut[x.subLanguage]),ut[x.subLanguage]=l._top}else l=Ue(R,x.subLanguage.length?x.subLanguage:null);x.relevance>0&&(Re+=l.relevance),X.__addSublanguage(l._emitter,l.language)}function ae(){x.subLanguage!=null?Le():ge(),R=""}function ce(l,f){l!==""&&(X.startScope(f),X.addText(l),X.endScope())}function lt(l,f){let k=1,N=f.length-1;for(;k<=N;){if(!l._emit[k]){k++;continue}let Q=le.classNameAliases[l[k]]||l[k],be=f[k];Q?ce(be,Q):(R=be,ge(),R=""),k++}}function dt(l,f){return l.scope&&typeof l.scope=="string"&&X.openNode(le.classNameAliases[l.scope]||l.scope),l.beginScope&&(l.beginScope._wrap?(ce(R,le.classNameAliases[l.beginScope._wrap]||l.beginScope._wrap),R=""):l.beginScope._multi&&(lt(l.beginScope,f),R="")),x=Object.create(l,{parent:{value:x}}),x}function ht(l,f,k){let N=q(l.endRe,k);if(N){if(l["on:end"]){let Q=new e(l);l["on:end"](f,Q),Q.isMatchIgnored&&(N=!1)}if(N){for(;l.endsParent&&l.parent;)l=l.parent;return l}}if(l.endsWithParent)return ht(l.parent,f,k)}function vr(l){return x.matcher.regexIndex===0?(R+=l[0],1):(Ke=!0,0)}function wr(l){let f=l[0],k=l.rule,N=new e(k),Q=[k.__beforeBegin,k["on:begin"]];for(let be of Q)if(be&&(be(l,N),N.isMatchIgnored))return vr(f);return k.skip?R+=f:(k.excludeBegin&&(R+=f),ae(),!k.returnBegin&&!k.excludeBegin&&(R=f)),dt(k,l),k.returnBegin?0:f.length}function xr(l){let f=l[0],k=v.substring(l.index),N=ht(x,l,k);if(!N)return nt;let Q=x;x.endScope&&x.endScope._wrap?(ae(),ce(f,x.endScope._wrap)):x.endScope&&x.endScope._multi?(ae(),lt(x.endScope,l)):Q.skip?R+=f:(Q.returnEnd||Q.excludeEnd||(R+=f),ae(),Q.excludeEnd&&(R=f));do x.scope&&X.closeNode(),!x.skip&&!x.subLanguage&&(Re+=x.relevance),x=x.parent;while(x!==N.parent);return N.starts&&dt(N.starts,l),Q.returnEnd?0:f.length}function yr(){let l=[];for(let f=x;f!==le;f=f.parent)f.scope&&l.unshift(f.scope);l.forEach(f=>X.openNode(f))}let Oe={};function bt(l,f){let k=f&&f[0];if(R+=l,k==null)return ae(),0;if(Oe.type==="begin"&&f.type==="end"&&Oe.index===f.index&&k===""){if(R+=v.slice(f.index,f.index+1),!B){let N=new Error(`0 width match regex (${c})`);throw N.languageName=c,N.badRule=Oe.rule,N}return 1}if(Oe=f,f.type==="begin")return wr(f);if(f.type==="illegal"&&!A){let N=new Error('Illegal lexeme "'+k+'" for mode "'+(x.scope||"<unnamed>")+'"');throw N.mode=x,N}else if(f.type==="end"){let N=xr(f);if(N!==nt)return N}if(f.type==="illegal"&&k==="")return R+=`
`,1;if(Ze>1e5&&Ze>f.index*3)throw new Error("potential infinite loop, way more iterations than matches");return R+=k,k.length}let le=ue(c);if(!le)throw me(D.replace("{}",c)),new Error('Unknown language: "'+c+'"');let _r=rr(le),qe="",x=O||_r,ut={},X=new p.__emitter(p);yr();let R="",Re=0,fe=0,Ze=0,Ke=!1;try{if(le.__emitTokens)le.__emitTokens(v,X);else{for(x.matcher.considerAll();;){Ze++,Ke?Ke=!1:x.matcher.considerAll(),x.matcher.lastIndex=fe;let l=x.matcher.exec(v);if(!l)break;let f=v.substring(fe,l.index),k=bt(f,l);fe=l.index+k}bt(v.substring(fe))}return X.finalize(),qe=X.toHTML(),{language:c,value:qe,relevance:Re,illegal:!1,_emitter:X,_top:x}}catch(l){if(l.message&&l.message.includes("Illegal"))return{language:c,value:Pe(v),illegal:!0,relevance:0,_illegalBy:{message:l.message,index:fe,context:v.slice(fe-100,fe+100),mode:l.mode,resultSoFar:qe},_emitter:X};if(B)return{language:c,value:Pe(v),illegal:!1,relevance:0,errorRaised:l,_emitter:X,_top:x};throw l}}function He(c){let v={value:Pe(c),illegal:!1,relevance:0,_top:m,_emitter:new p.__emitter(p)};return v._emitter.addText(c),v}function Ue(c,v){v=v||p.languages||Object.keys(i);let A=He(c),O=v.filter(ue).filter(ct).map(ae=>ke(ae,c,!1));O.unshift(A);let F=O.sort((ae,ce)=>{if(ae.relevance!==ce.relevance)return ce.relevance-ae.relevance;if(ae.language&&ce.language){if(ue(ae.language).supersetOf===ce.language)return 1;if(ue(ce.language).supersetOf===ae.language)return-1}return 0}),[se,ge]=F,Le=se;return Le.secondBest=ge,Le}function sr(c,v,A){let O=v&&d[v]||A;c.classList.add("hljs"),c.classList.add(`language-${O}`)}function Fe(c){let v=null,A=W(c);if(w(A))return;if($e("before:highlightElement",{el:c,language:A}),c.dataset.highlighted){console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.",c);return}if(c.children.length>0&&(p.ignoreUnescapedHTML||(console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."),console.warn("https://github.com/highlightjs/highlight.js/wiki/security"),console.warn("The element with unescaped HTML:"),console.warn(c)),p.throwUnescapedHTML))throw new ar("One of your code blocks includes unescaped HTML.",c.innerHTML);v=c;let O=v.textContent,F=A?U(O,{language:A,ignoreIllegals:!0}):Ue(O);c.innerHTML=F.value,c.dataset.highlighted="yes",sr(c,A,F.language),c.result={language:F.language,re:F.relevance,relevance:F.relevance},F.secondBest&&(c.secondBest={language:F.secondBest.language,relevance:F.secondBest.relevance}),$e("after:highlightElement",{el:c,result:F,text:O})}function cr(c){p=ot(p,c)}let lr=()=>{Ne(),xe("10.6.0","initHighlighting() deprecated.  Use highlightAll() now.")};function dr(){Ne(),xe("10.6.0","initHighlightingOnLoad() deprecated.  Use highlightAll() now.")}let it=!1;function Ne(){function c(){Ne()}if(document.readyState==="loading"){it||window.addEventListener("DOMContentLoaded",c,!1),it=!0;return}document.querySelectorAll(p.cssSelector).forEach(Fe)}function hr(c,v){let A=null;try{A=v(t)}catch(O){if(me("Language definition for '{}' could not be registered.".replace("{}",c)),B)me(O);else throw O;A=m}A.name||(A.name=c),i[c]=A,A.rawDefinition=v.bind(null,t),A.aliases&&st(A.aliases,{languageName:c})}function br(c){delete i[c];for(let v of Object.keys(d))d[v]===c&&delete d[v]}function ur(){return Object.keys(i)}function ue(c){return c=(c||"").toLowerCase(),i[c]||i[d[c]]}function st(c,{languageName:v}){typeof c=="string"&&(c=[c]),c.forEach(A=>{d[A.toLowerCase()]=v})}function ct(c){let v=ue(c);return v&&!v.disableAutodetect}function gr(c){c["before:highlightBlock"]&&!c["before:highlightElement"]&&(c["before:highlightElement"]=v=>{c["before:highlightBlock"](Object.assign({block:v.el},v))}),c["after:highlightBlock"]&&!c["after:highlightElement"]&&(c["after:highlightElement"]=v=>{c["after:highlightBlock"](Object.assign({block:v.el},v))})}function pr(c){gr(c),y.push(c)}function mr(c){let v=y.indexOf(c);v!==-1&&y.splice(v,1)}function $e(c,v){let A=c;y.forEach(function(O){O[A]&&O[A](v)})}function fr(c){return xe("10.7.0","highlightBlock will be removed entirely in v12.0"),xe("10.7.0","Please use highlightElement now."),Fe(c)}Object.assign(t,{highlight:U,highlightAuto:Ue,highlightAll:Ne,highlightElement:Fe,highlightBlock:fr,configure:cr,initHighlighting:lr,initHighlightingOnLoad:dr,registerLanguage:hr,unregisterLanguage:br,listLanguages:ur,getLanguage:ue,registerAliases:st,autoDetection:ct,inherit:ot,addPlugin:pr,removePlugin:mr}),t.debugMode=function(){B=!1},t.safeMode=function(){B=!0},t.versionString=nr,t.regex={concat:M,lookahead:_,either:P,optional:I,anyNumberOfTimes:C};for(let c in Ce)typeof Ce[c]=="object"&&o(Ce[c]);return Object.assign(t,Ce),t},ye=at({});return ye.newInstance=()=>at({}),Ge=ye,ye.HighlightJS=ye,ye.default=ye,Ge}var Cr=Ar(),$=Sr(Cr),pt="[A-Za-z$_][0-9A-Za-z$_]*",Mr=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],Nr=["true","false","null","undefined","NaN","Infinity"],mt=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],ft=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],vt=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],$r=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Lr=[].concat(vt,mt,ft);function wt(o){let e=o.regex,r=(L,{after:G})=>{let ne="</"+L[0].slice(1);return L.input.indexOf(ne,G)!==-1},n=pt,a={begin:"<>",end:"</>"},s=/<[A-Za-z0-9\\._:-]+\s*\/>/,h={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(L,G)=>{let ne=L[0].length+L.index,de=L.input[ne];if(de==="<"||de===","){G.ignoreMatch();return}de===">"&&(r(L,{after:ne})||G.ignoreMatch());let he,pe=L.input.substring(ne);if(he=pe.match(/^\s*=/)){G.ignoreMatch();return}if((he=pe.match(/^\s+extends\s+/))&&he.index===0){G.ignoreMatch();return}}},b={$pattern:pt,keyword:Mr,literal:Nr,built_in:Lr,"variable.language":$r},u="[0-9](_?[0-9])*",g=`\\.(${u})`,E="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",S={className:"number",variants:[{begin:`(\\b(${E})((${g})|\\.)?|(${g}))[eE][+-]?(${u})\\b`},{begin:`\\b(${E})\\b((${g})\\b|\\.)?|(${g})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},_={className:"subst",begin:"\\$\\{",end:"\\}",keywords:b,contains:[]},C={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,_],subLanguage:"xml"}},I={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,_],subLanguage:"css"}},M={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,_],subLanguage:"graphql"}},V={className:"string",begin:"`",end:"`",contains:[o.BACKSLASH_ESCAPE,_]},P={className:"comment",variants:[o.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:n+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),o.C_BLOCK_COMMENT_MODE,o.C_LINE_COMMENT_MODE]},H=[o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,C,I,M,V,{match:/\$\d+/},S];_.contains=H.concat({begin:/\{/,end:/\}/,keywords:b,contains:["self"].concat(H)});let q=[].concat(P,_.contains),Z=q.concat([{begin:/(\s*)\(/,end:/\)/,keywords:b,contains:["self"].concat(q)}]),z={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:b,contains:Z},ie={variants:[{match:[/class/,/\s+/,n,/\s+/,/extends/,/\s+/,e.concat(n,"(",e.concat(/\./,n),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,n],scope:{1:"keyword",3:"title.class"}}]},J={relevance:0,match:e.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...mt,...ft]}},Y={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ee={variants:[{match:[/function/,/\s+/,n,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[z],illegal:/%/},te={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function re(L){return e.concat("(?!",L.join("|"),")")}let K={match:e.concat(/\b/,re([...vt,"super","import"].map(L=>`${L}\\s*\\(`)),n,e.lookahead(/\s*\(/)),className:"title.function",relevance:0},T={begin:e.concat(/\./,e.lookahead(e.concat(n,/(?![0-9A-Za-z$_(])/))),end:n,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},j={match:[/get|set/,/\s+/,n,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},z]},oe="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+o.UNDERSCORE_IDENT_RE+")\\s*=>",_e={match:[/const|var|let/,/\s+/,n,/\s*/,/=\s*/,/(async\s*)?/,e.lookahead(oe)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[z]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:b,exports:{PARAMS_CONTAINS:Z,CLASS_REFERENCE:J},illegal:/#(?![$_A-z])/,contains:[o.SHEBANG({label:"shebang",binary:"node",relevance:5}),Y,o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,C,I,M,V,P,{match:/\$\d+/},S,J,{scope:"attr",match:n+e.lookahead(":"),relevance:0},_e,{begin:"("+o.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[P,o.REGEXP_MODE,{className:"function",begin:oe,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:o.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:b,contains:Z}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:a.begin,end:a.end},{match:s},{begin:h.begin,"on:begin":h.isTrulyOpeningTag,end:h.end}],subLanguage:"xml",contains:[{begin:h.begin,end:h.end,skip:!0,contains:["self"]}]}]},ee,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+o.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[z,o.inherit(o.TITLE_MODE,{begin:n,className:"title.function"})]},{match:/\.\.\./,relevance:0},T,{match:"\\$"+n,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[z]},K,te,ie,j,{match:/\$[(.]/}]}}var Or=o=>({IMPORTANT:{scope:"meta",begin:"!important"},BLOCK_COMMENT:o.C_BLOCK_COMMENT_MODE,HEXCOLOR:{scope:"number",begin:/#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/},FUNCTION_DISPATCH:{className:"built_in",begin:/[\w-]+(?=\()/},ATTRIBUTE_SELECTOR_MODE:{scope:"selector-attr",begin:/\[/,end:/\]/,illegal:"$",contains:[o.APOS_STRING_MODE,o.QUOTE_STRING_MODE]},CSS_NUMBER_MODE:{scope:"number",begin:o.NUMBER_RE+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},CSS_VARIABLE:{className:"attr",begin:/--[A-Za-z_][A-Za-z0-9_-]*/}}),Rr=["a","abbr","address","article","aside","audio","b","blockquote","body","button","canvas","caption","cite","code","dd","del","details","dfn","div","dl","dt","em","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","html","i","iframe","img","input","ins","kbd","label","legend","li","main","mark","menu","nav","object","ol","optgroup","option","p","picture","q","quote","samp","section","select","source","span","strong","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","ul","var","video"],Ir=["defs","g","marker","mask","pattern","svg","switch","symbol","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feGaussianBlur","feImage","feMerge","feMorphology","feOffset","feSpecularLighting","feTile","feTurbulence","linearGradient","radialGradient","stop","circle","ellipse","image","line","path","polygon","polyline","rect","text","use","textPath","tspan","foreignObject","clipPath"],zr=[...Rr,...Ir],Tr=["any-hover","any-pointer","aspect-ratio","color","color-gamut","color-index","device-aspect-ratio","device-height","device-width","display-mode","forced-colors","grid","height","hover","inverted-colors","monochrome","orientation","overflow-block","overflow-inline","pointer","prefers-color-scheme","prefers-contrast","prefers-reduced-motion","prefers-reduced-transparency","resolution","scan","scripting","update","width","min-width","max-width","min-height","max-height"].sort().reverse(),jr=["active","any-link","blank","checked","current","default","defined","dir","disabled","drop","empty","enabled","first","first-child","first-of-type","fullscreen","future","focus","focus-visible","focus-within","has","host","host-context","hover","indeterminate","in-range","invalid","is","lang","last-child","last-of-type","left","link","local-link","not","nth-child","nth-col","nth-last-child","nth-last-col","nth-last-of-type","nth-of-type","only-child","only-of-type","optional","out-of-range","past","placeholder-shown","read-only","read-write","required","right","root","scope","target","target-within","user-invalid","valid","visited","where"].sort().reverse(),Br=["after","backdrop","before","cue","cue-region","first-letter","first-line","grammar-error","marker","part","placeholder","selection","slotted","spelling-error"].sort().reverse(),Dr=["accent-color","align-content","align-items","align-self","alignment-baseline","all","anchor-name","animation","animation-composition","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-range","animation-range-end","animation-range-start","animation-timeline","animation-timing-function","appearance","aspect-ratio","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","block-size","border","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-end-end-radius","border-end-start-radius","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-start-end-radius","border-start-start-radius","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-align","box-decoration-break","box-direction","box-flex","box-flex-group","box-lines","box-ordinal-group","box-orient","box-pack","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","color-scheme","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","contain-intrinsic-block-size","contain-intrinsic-height","contain-intrinsic-inline-size","contain-intrinsic-size","contain-intrinsic-width","container","container-name","container-type","content","content-visibility","counter-increment","counter-reset","counter-set","cue","cue-after","cue-before","cursor","cx","cy","direction","display","dominant-baseline","empty-cells","enable-background","field-sizing","fill","fill-opacity","fill-rule","filter","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","flood-color","flood-opacity","flow","font","font-display","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-palette","font-size","font-size-adjust","font-smooth","font-smoothing","font-stretch","font-style","font-synthesis","font-synthesis-position","font-synthesis-small-caps","font-synthesis-style","font-synthesis-weight","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-emoji","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","forced-color-adjust","gap","glyph-orientation-horizontal","glyph-orientation-vertical","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphenate-character","hyphenate-limit-chars","hyphens","icon","image-orientation","image-rendering","image-resolution","ime-mode","initial-letter","initial-letter-align","inline-size","inset","inset-area","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","kerning","left","letter-spacing","lighting-color","line-break","line-height","line-height-step","list-style","list-style-image","list-style-position","list-style-type","margin","margin-block","margin-block-end","margin-block-start","margin-bottom","margin-inline","margin-inline-end","margin-inline-start","margin-left","margin-right","margin-top","margin-trim","marker","marker-end","marker-mid","marker-start","marks","mask","mask-border","mask-border-mode","mask-border-outset","mask-border-repeat","mask-border-slice","mask-border-source","mask-border-width","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","masonry-auto-flow","math-depth","math-shift","math-style","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","nav-down","nav-index","nav-left","nav-right","nav-up","none","normal","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-anchor","overflow-block","overflow-clip-margin","overflow-inline","overflow-wrap","overflow-x","overflow-y","overlay","overscroll-behavior","overscroll-behavior-block","overscroll-behavior-inline","overscroll-behavior-x","overscroll-behavior-y","padding","padding-block","padding-block-end","padding-block-start","padding-bottom","padding-inline","padding-inline-end","padding-inline-start","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","paint-order","pause","pause-after","pause-before","perspective","perspective-origin","place-content","place-items","place-self","pointer-events","position","position-anchor","position-visibility","print-color-adjust","quotes","r","resize","rest","rest-after","rest-before","right","rotate","row-gap","ruby-align","ruby-position","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-stop","scroll-snap-type","scroll-timeline","scroll-timeline-axis","scroll-timeline-name","scrollbar-color","scrollbar-gutter","scrollbar-width","shape-image-threshold","shape-margin","shape-outside","shape-rendering","speak","speak-as","src","stop-color","stop-opacity","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","tab-size","table-layout","text-align","text-align-all","text-align-last","text-anchor","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-decoration-thickness","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-indent","text-justify","text-orientation","text-overflow","text-rendering","text-shadow","text-size-adjust","text-transform","text-underline-offset","text-underline-position","text-wrap","text-wrap-mode","text-wrap-style","timeline-scope","top","touch-action","transform","transform-box","transform-origin","transform-style","transition","transition-behavior","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-modify","user-select","vector-effect","vertical-align","view-timeline","view-timeline-axis","view-timeline-inset","view-timeline-name","view-transition-name","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","white-space","white-space-collapse","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","x","y","z-index","zoom"].sort().reverse();function Pr(o){let e=o.regex,r=Or(o),n={begin:/-(webkit|moz|ms|o)-(?=[a-z])/},a="and or not only",s=/@-?\w[\w]*(-\w+)*/,h="[a-zA-Z-][a-zA-Z0-9_-]*",b=[o.APOS_STRING_MODE,o.QUOTE_STRING_MODE];return{name:"CSS",case_insensitive:!0,illegal:/[=|'\$]/,keywords:{keyframePosition:"from to"},classNameAliases:{keyframePosition:"selector-tag"},contains:[r.BLOCK_COMMENT,n,r.CSS_NUMBER_MODE,{className:"selector-id",begin:/#[A-Za-z0-9_-]+/,relevance:0},{className:"selector-class",begin:"\\."+h,relevance:0},r.ATTRIBUTE_SELECTOR_MODE,{className:"selector-pseudo",variants:[{begin:":("+jr.join("|")+")"},{begin:":(:)?("+Br.join("|")+")"}]},r.CSS_VARIABLE,{className:"attribute",begin:"\\b("+Dr.join("|")+")\\b"},{begin:/:/,end:/[;}{]/,contains:[r.BLOCK_COMMENT,r.HEXCOLOR,r.IMPORTANT,r.CSS_NUMBER_MODE,...b,{begin:/(url|data-uri)\(/,end:/\)/,relevance:0,keywords:{built_in:"url data-uri"},contains:[...b,{className:"string",begin:/[^)]/,endsWithParent:!0,excludeEnd:!0}]},r.FUNCTION_DISPATCH]},{begin:e.lookahead(/@/),end:"[{;]",relevance:0,illegal:/:/,contains:[{className:"keyword",begin:s},{begin:/\s/,endsWithParent:!0,excludeEnd:!0,relevance:0,keywords:{$pattern:/[a-z-]+/,keyword:a,attribute:Tr.join(" ")},contains:[{begin:/[a-z-]+(?=:)/,className:"attribute"},...b,r.CSS_NUMBER_MODE]}]},{className:"selector-tag",begin:"\\b("+zr.join("|")+")\\b"}]}}function Se(o){let e=o.regex,r=e.concat(/[\p{L}_]/u,e.optional(/[\p{L}0-9_.-]*:/u),/[\p{L}0-9_.-]*/u),n=/[\p{L}0-9._:-]+/u,a={className:"symbol",begin:/&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/},s={begin:/\s/,contains:[{className:"keyword",begin:/#?[a-z_][a-z1-9_-]+/,illegal:/\n/}]},h=o.inherit(s,{begin:/\(/,end:/\)/}),b=o.inherit(o.APOS_STRING_MODE,{className:"string"}),u=o.inherit(o.QUOTE_STRING_MODE,{className:"string"}),g={endsWithParent:!0,illegal:/</,relevance:0,contains:[{className:"attr",begin:n,relevance:0},{begin:/=\s*/,relevance:0,contains:[{className:"string",endsParent:!0,variants:[{begin:/"/,end:/"/,contains:[a]},{begin:/'/,end:/'/,contains:[a]},{begin:/[^\s"'=<>`]+/}]}]}]};return{name:"HTML, XML",aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],case_insensitive:!0,unicodeRegex:!0,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,relevance:10,contains:[s,u,b,h,{begin:/\[/,end:/\]/,contains:[{className:"meta",begin:/<![a-z]/,end:/>/,contains:[s,h,u,b]}]}]},o.COMMENT(/<!--/,/-->/,{relevance:10}),{begin:/<!\[CDATA\[/,end:/\]\]>/,relevance:10},a,{className:"meta",end:/\?>/,variants:[{begin:/<\?xml/,relevance:10,contains:[u]},{begin:/<\?[a-z][a-z0-9]+/}]},{className:"tag",begin:/<style(?=\s|>)/,end:/>/,keywords:{name:"style"},contains:[g],starts:{end:/<\/style>/,returnEnd:!0,subLanguage:["css","xml"]}},{className:"tag",begin:/<script(?=\s|>)/,end:/>/,keywords:{name:"script"},contains:[g],starts:{end:/<\/script>/,returnEnd:!0,subLanguage:["javascript","handlebars","xml"]}},{className:"tag",begin:/<>|<\/>/},{className:"tag",begin:e.concat(/</,e.lookahead(e.concat(r,e.either(/\/>/,/>/,/\s/)))),end:/\/?>/,contains:[{className:"name",begin:r,relevance:0,starts:g}]},{className:"tag",begin:e.concat(/<\//,e.lookahead(e.concat(r,/>/))),contains:[{className:"name",begin:r,relevance:0},{begin:/>/,relevance:0,endsParent:!0}]}]}}function Hr(o){let e={className:"attr",begin:/"(\\.|[^\\"\r\n])*"(?=\s*:)/,relevance:1.01},r={match:/[{}[\],:]/,className:"punctuation",relevance:0},n=["true","false","null"],a={scope:"literal",beginKeywords:n.join(" ")};return{name:"JSON",aliases:["jsonc"],keywords:{literal:n},contains:[e,r,o.QUOTE_STRING_MODE,a,o.C_NUMBER_MODE,o.C_LINE_COMMENT_MODE,o.C_BLOCK_COMMENT_MODE],illegal:"\\S"}}function xt(o){let e="true false yes no null",r="[\\w#;/?:@&=+$,.~*'()[\\]]+",n={className:"attr",variants:[{begin:/[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/},{begin:/"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/},{begin:/'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/}]},a={className:"template-variable",variants:[{begin:/\{\{/,end:/\}\}/},{begin:/%\{/,end:/\}/}]},s={className:"string",relevance:0,begin:/'/,end:/'/,contains:[{match:/''/,scope:"char.escape",relevance:0}]},h={className:"string",relevance:0,variants:[{begin:/"/,end:/"/},{begin:/\S+/}],contains:[o.BACKSLASH_ESCAPE,a]},b=o.inherit(h,{variants:[{begin:/'/,end:/'/,contains:[{begin:/''/,relevance:0}]},{begin:/"/,end:/"/},{begin:/[^\s,{}[\]]+/}]}),u={className:"number",begin:"\\b[0-9]{4}(-[0-9][0-9]){0,2}([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?(\\.[0-9]*)?([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?\\b"},g={end:",",endsWithParent:!0,excludeEnd:!0,keywords:e,relevance:0},E={begin:/\{/,end:/\}/,contains:[g],illegal:"\\n",relevance:0},S={begin:"\\[",end:"\\]",contains:[g],illegal:"\\n",relevance:0},_=[n,{className:"meta",begin:"^---\\s*$",relevance:10},{className:"string",begin:"[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"},{begin:"<%[%=-]?",end:"[%-]?%>",subLanguage:"ruby",excludeBegin:!0,excludeEnd:!0,relevance:0},{className:"type",begin:"!\\w+!"+r},{className:"type",begin:"!<"+r+">"},{className:"type",begin:"!"+r},{className:"type",begin:"!!"+r},{className:"meta",begin:"&"+o.UNDERSCORE_IDENT_RE+"$"},{className:"meta",begin:"\\*"+o.UNDERSCORE_IDENT_RE+"$"},{className:"bullet",begin:"-(?=[ ]|$)",relevance:0},o.HASH_COMMENT_MODE,{beginKeywords:e,keywords:{literal:e}},u,{className:"number",begin:o.C_NUMBER_RE+"\\b",relevance:0},E,S,s,h],C=[..._];return C.pop(),C.push(b),g.contains=C,{name:"YAML",case_insensitive:!0,aliases:["yml"],contains:_}}function Ur(o){let e=o.regex,r=/(?![A-Za-z0-9])(?![$])/,n=e.concat(/[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,r),a=e.concat(/(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,r),s=e.concat(/[A-Z]+/,r),h={scope:"variable",match:"\\$+"+n},b={scope:"meta",variants:[{begin:/<\?php/,relevance:10},{begin:/<\?=/},{begin:/<\?/,relevance:.1},{begin:/\?>/}]},u={scope:"subst",variants:[{begin:/\$\w+/},{begin:/\{\$/,end:/\}/}]},g=o.inherit(o.APOS_STRING_MODE,{illegal:null}),E=o.inherit(o.QUOTE_STRING_MODE,{illegal:null,contains:o.QUOTE_STRING_MODE.contains.concat(u)}),S={begin:/<<<[ \t]*(?:(\w+)|"(\w+)")\n/,end:/[ \t]*(\w+)\b/,contains:o.QUOTE_STRING_MODE.contains.concat(u),"on:begin":(T,j)=>{j.data._beginMatch=T[1]||T[2]},"on:end":(T,j)=>{j.data._beginMatch!==T[1]&&j.ignoreMatch()}},_=o.END_SAME_AS_BEGIN({begin:/<<<[ \t]*'(\w+)'\n/,end:/[ \t]*(\w+)\b/}),C=`[ 	
]`,I={scope:"string",variants:[E,g,S,_]},M={scope:"number",variants:[{begin:"\\b0[bB][01]+(?:_[01]+)*\\b"},{begin:"\\b0[oO][0-7]+(?:_[0-7]+)*\\b"},{begin:"\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b"},{begin:"(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?"}],relevance:0},V=["false","null","true"],P=["__CLASS__","__DIR__","__FILE__","__FUNCTION__","__COMPILER_HALT_OFFSET__","__LINE__","__METHOD__","__NAMESPACE__","__TRAIT__","die","echo","exit","include","include_once","print","require","require_once","array","abstract","and","as","binary","bool","boolean","break","callable","case","catch","class","clone","const","continue","declare","default","do","double","else","elseif","empty","enddeclare","endfor","endforeach","endif","endswitch","endwhile","enum","eval","extends","final","finally","float","for","foreach","from","global","goto","if","implements","instanceof","insteadof","int","integer","interface","isset","iterable","list","match|0","mixed","new","never","object","or","private","protected","public","readonly","real","return","string","switch","throw","trait","try","unset","use","var","void","while","xor","yield"],H=["Error|0","AppendIterator","ArgumentCountError","ArithmeticError","ArrayIterator","ArrayObject","AssertionError","BadFunctionCallException","BadMethodCallException","CachingIterator","CallbackFilterIterator","CompileError","Countable","DirectoryIterator","DivisionByZeroError","DomainException","EmptyIterator","ErrorException","Exception","FilesystemIterator","FilterIterator","GlobIterator","InfiniteIterator","InvalidArgumentException","IteratorIterator","LengthException","LimitIterator","LogicException","MultipleIterator","NoRewindIterator","OutOfBoundsException","OutOfRangeException","OuterIterator","OverflowException","ParentIterator","ParseError","RangeException","RecursiveArrayIterator","RecursiveCachingIterator","RecursiveCallbackFilterIterator","RecursiveDirectoryIterator","RecursiveFilterIterator","RecursiveIterator","RecursiveIteratorIterator","RecursiveRegexIterator","RecursiveTreeIterator","RegexIterator","RuntimeException","SeekableIterator","SplDoublyLinkedList","SplFileInfo","SplFileObject","SplFixedArray","SplHeap","SplMaxHeap","SplMinHeap","SplObjectStorage","SplObserver","SplPriorityQueue","SplQueue","SplStack","SplSubject","SplTempFileObject","TypeError","UnderflowException","UnexpectedValueException","UnhandledMatchError","ArrayAccess","BackedEnum","Closure","Fiber","Generator","Iterator","IteratorAggregate","Serializable","Stringable","Throwable","Traversable","UnitEnum","WeakReference","WeakMap","Directory","__PHP_Incomplete_Class","parent","php_user_filter","self","static","stdClass"],q={keyword:P,literal:(T=>{let j=[];return T.forEach(oe=>{j.push(oe),oe.toLowerCase()===oe?j.push(oe.toUpperCase()):j.push(oe.toLowerCase())}),j})(V),built_in:H},Z=T=>T.map(j=>j.replace(/\|\d+$/,"")),z={variants:[{match:[/new/,e.concat(C,"+"),e.concat("(?!",Z(H).join("\\b|"),"\\b)"),a],scope:{1:"keyword",4:"title.class"}}]},ie=e.concat(n,"\\b(?!\\()"),J={variants:[{match:[e.concat(/::/,e.lookahead(/(?!class\b)/)),ie],scope:{2:"variable.constant"}},{match:[/::/,/class/],scope:{2:"variable.language"}},{match:[a,e.concat(/::/,e.lookahead(/(?!class\b)/)),ie],scope:{1:"title.class",3:"variable.constant"}},{match:[a,e.concat("::",e.lookahead(/(?!class\b)/))],scope:{1:"title.class"}},{match:[a,/::/,/class/],scope:{1:"title.class",3:"variable.language"}}]},Y={scope:"attr",match:e.concat(n,e.lookahead(":"),e.lookahead(/(?!::)/))},ee={relevance:0,begin:/\(/,end:/\)/,keywords:q,contains:[Y,h,J,o.C_BLOCK_COMMENT_MODE,I,M,z]},te={relevance:0,match:[/\b/,e.concat("(?!fn\\b|function\\b|",Z(P).join("\\b|"),"|",Z(H).join("\\b|"),"\\b)"),n,e.concat(C,"*"),e.lookahead(/(?=\()/)],scope:{3:"title.function.invoke"},contains:[ee]};ee.contains.push(te);let re=[Y,J,o.C_BLOCK_COMMENT_MODE,I,M,z],K={begin:e.concat(/#\[\s*\\?/,e.either(a,s)),beginScope:"meta",end:/]/,endScope:"meta",keywords:{literal:V,keyword:["new","array"]},contains:[{begin:/\[/,end:/]/,keywords:{literal:V,keyword:["new","array"]},contains:["self",...re]},...re,{scope:"meta",variants:[{match:a},{match:s}]}]};return{case_insensitive:!1,keywords:q,contains:[K,o.HASH_COMMENT_MODE,o.COMMENT("//","$"),o.COMMENT("/\\*","\\*/",{contains:[{scope:"doctag",match:"@[A-Za-z]+"}]}),{match:/__halt_compiler\(\);/,keywords:"__halt_compiler",starts:{scope:"comment",end:o.MATCH_NOTHING_RE,contains:[{match:/\?>/,scope:"meta",endsParent:!0}]}},b,{scope:"variable.language",match:/\$this\b/},h,te,J,{match:[/const/,/\s/,n],scope:{1:"keyword",3:"variable.constant"}},z,{scope:"function",relevance:0,beginKeywords:"fn function",end:/[;{]/,excludeEnd:!0,illegal:"[$%\\[]",contains:[{beginKeywords:"use"},o.UNDERSCORE_TITLE_MODE,{begin:"=>",endsParent:!0},{scope:"params",begin:"\\(",end:"\\)",excludeBegin:!0,excludeEnd:!0,keywords:q,contains:["self",K,h,J,o.C_BLOCK_COMMENT_MODE,I,M]}]},{scope:"class",variants:[{beginKeywords:"enum",illegal:/[($"]/},{beginKeywords:"class interface trait",illegal:/[:($"]/}],relevance:0,end:/\{/,excludeEnd:!0,contains:[{beginKeywords:"extends implements"},o.UNDERSCORE_TITLE_MODE]},{beginKeywords:"namespace",relevance:0,end:";",illegal:/[.']/,contains:[o.inherit(o.UNDERSCORE_TITLE_MODE,{scope:"title.class"})]},{beginKeywords:"use",relevance:0,end:";",contains:[{match:/\b(as|const|function)\b/,scope:"keyword"},o.UNDERSCORE_TITLE_MODE]},I,M]}}function Fr(o){let e=o.regex,r="HTTP/([32]|1\\.[01])",n=/[A-Za-z][A-Za-z0-9-]*/,a={className:"attribute",begin:e.concat("^",n,"(?=\\:\\s)"),starts:{contains:[{className:"punctuation",begin:/: /,relevance:0,starts:{end:"$",relevance:0}}]}},s=[a,{begin:"\\n\\n",starts:{subLanguage:[],endsWithParent:!0}}];return{name:"HTTP",aliases:["https"],illegal:/\S/,contains:[{begin:"^(?="+r+" \\d{3})",end:/$/,contains:[{className:"meta",begin:r},{className:"number",begin:"\\b\\d{3}\\b"}],starts:{end:/\b\B/,illegal:/\S/,contains:s}},{begin:"(?=^[A-Z]+ (.*?) "+r+"$)",end:/$/,contains:[{className:"string",begin:" ",end:" ",excludeBegin:!0,excludeEnd:!0},{className:"meta",begin:r},{className:"keyword",begin:"[A-Z]+"}],starts:{end:/\b\B/,illegal:/\S/,contains:s}},o.inherit(a,{relevance:0})]}}function Te(o){return{name:"Plain text",aliases:["text","txt"],disableAutodetect:!0}}function qr(o){let e=o.regex;return{name:"Diff",aliases:["patch"],contains:[{className:"meta",relevance:10,match:e.either(/^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,/^\*\*\* +\d+,\d+ +\*\*\*\*$/,/^--- +\d+,\d+ +----$/)},{className:"comment",variants:[{begin:e.either(/Index: /,/^index/,/={3,}/,/^-{3}/,/^\*{3} /,/^\+{3}/,/^diff --git/),end:/$/},{match:/^\*{15}$/}]},{className:"addition",begin:/^\+/,end:/$/},{className:"deletion",begin:/^-/,end:/$/},{className:"addition",begin:/^!/,end:/$/}]}}function je(o){let e=o.regex,r={},n={begin:/\$\{/,end:/\}/,contains:["self",{begin:/:-/,contains:[r]}]};Object.assign(r,{className:"variable",variants:[{begin:e.concat(/\$[\w\d#@][\w\d_]*/,"(?![\\w\\d])(?![$])")},n]});let a={className:"subst",begin:/\$\(/,end:/\)/,contains:[o.BACKSLASH_ESCAPE]},s=o.inherit(o.COMMENT(),{match:[/(^|\s)/,/#.*$/],scope:{2:"comment"}}),h={begin:/<<-?\s*(?=\w+)/,starts:{contains:[o.END_SAME_AS_BEGIN({begin:/(\w+)/,end:/(\w+)/,className:"string"})]}},b={className:"string",begin:/"/,end:/"/,contains:[o.BACKSLASH_ESCAPE,r,a]};a.contains.push(b);let u={match:/\\"/},g={className:"string",begin:/'/,end:/'/},E={match:/\\'/},S={begin:/\$?\(\(/,end:/\)\)/,contains:[{begin:/\d+#[0-9a-f]+/,className:"number"},o.NUMBER_MODE,r]},_=["fish","bash","zsh","sh","csh","ksh","tcsh","dash","scsh"],C=o.SHEBANG({binary:`(${_.join("|")})`,relevance:10}),I={className:"function",begin:/\w[\w\d_]*\s*\(\s*\)\s*\{/,returnBegin:!0,contains:[o.inherit(o.TITLE_MODE,{begin:/\w[\w\d_]*/})],relevance:0},M=["if","then","else","elif","fi","time","for","while","until","in","do","done","case","esac","coproc","function","select"],V=["true","false"],P={match:/(\/[a-z._-]+)+/},H=["break","cd","continue","eval","exec","exit","export","getopts","hash","pwd","readonly","return","shift","test","times","trap","umask","unset"],q=["alias","bind","builtin","caller","command","declare","echo","enable","help","let","local","logout","mapfile","printf","read","readarray","source","sudo","type","typeset","ulimit","unalias"],Z=["autoload","bg","bindkey","bye","cap","chdir","clone","comparguments","compcall","compctl","compdescribe","compfiles","compgroups","compquote","comptags","comptry","compvalues","dirs","disable","disown","echotc","echoti","emulate","fc","fg","float","functions","getcap","getln","history","integer","jobs","kill","limit","log","noglob","popd","print","pushd","pushln","rehash","sched","setcap","setopt","stat","suspend","ttyctl","unfunction","unhash","unlimit","unsetopt","vared","wait","whence","where","which","zcompile","zformat","zftp","zle","zmodload","zparseopts","zprof","zpty","zregexparse","zsocket","zstyle","ztcp"],z=["chcon","chgrp","chown","chmod","cp","dd","df","dir","dircolors","ln","ls","mkdir","mkfifo","mknod","mktemp","mv","realpath","rm","rmdir","shred","sync","touch","truncate","vdir","b2sum","base32","base64","cat","cksum","comm","csplit","cut","expand","fmt","fold","head","join","md5sum","nl","numfmt","od","paste","ptx","pr","sha1sum","sha224sum","sha256sum","sha384sum","sha512sum","shuf","sort","split","sum","tac","tail","tr","tsort","unexpand","uniq","wc","arch","basename","chroot","date","dirname","du","echo","env","expr","factor","groups","hostid","id","link","logname","nice","nohup","nproc","pathchk","pinky","printenv","printf","pwd","readlink","runcon","seq","sleep","stat","stdbuf","stty","tee","test","timeout","tty","uname","unlink","uptime","users","who","whoami","yes"];return{name:"Bash",aliases:["sh","zsh"],keywords:{$pattern:/\b[a-z][a-z0-9._-]+\b/,keyword:M,literal:V,built_in:[...H,...q,"set","shopt",...Z,...z]},contains:[C,o.SHEBANG(),I,S,s,h,P,b,u,g,E,r]}}function yt(o){let e=o.regex,r=new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*","u"),n=["and","as","assert","async","await","break","case","class","continue","def","del","elif","else","except","finally","for","from","global","if","import","in","is","lambda","match","nonlocal|10","not","or","pass","raise","return","try","while","with","yield"],a={$pattern:/[A-Za-z]\w+|__\w+__/,keyword:n,built_in:["__import__","abs","all","any","ascii","bin","bool","breakpoint","bytearray","bytes","callable","chr","classmethod","compile","complex","delattr","dict","dir","divmod","enumerate","eval","exec","filter","float","format","frozenset","getattr","globals","hasattr","hash","help","hex","id","input","int","isinstance","issubclass","iter","len","list","locals","map","max","memoryview","min","next","object","oct","open","ord","pow","print","property","range","repr","reversed","round","set","setattr","slice","sorted","staticmethod","str","sum","super","tuple","type","vars","zip"],literal:["__debug__","Ellipsis","False","None","NotImplemented","True"],type:["Any","Callable","Coroutine","Dict","List","Literal","Generic","Optional","Sequence","Set","Tuple","Type","Union"]},s={className:"meta",begin:/^(>>>|\.\.\.) /},h={className:"subst",begin:/\{/,end:/\}/,keywords:a,illegal:/#/},b={begin:/\{\{/,relevance:0},u={className:"string",contains:[o.BACKSLASH_ESCAPE],variants:[{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,end:/'''/,contains:[o.BACKSLASH_ESCAPE,s],relevance:10},{begin:/([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,end:/"""/,contains:[o.BACKSLASH_ESCAPE,s],relevance:10},{begin:/([fF][rR]|[rR][fF]|[fF])'''/,end:/'''/,contains:[o.BACKSLASH_ESCAPE,s,b,h]},{begin:/([fF][rR]|[rR][fF]|[fF])"""/,end:/"""/,contains:[o.BACKSLASH_ESCAPE,s,b,h]},{begin:/([uU]|[rR])'/,end:/'/,relevance:10},{begin:/([uU]|[rR])"/,end:/"/,relevance:10},{begin:/([bB]|[bB][rR]|[rR][bB])'/,end:/'/},{begin:/([bB]|[bB][rR]|[rR][bB])"/,end:/"/},{begin:/([fF][rR]|[rR][fF]|[fF])'/,end:/'/,contains:[o.BACKSLASH_ESCAPE,b,h]},{begin:/([fF][rR]|[rR][fF]|[fF])"/,end:/"/,contains:[o.BACKSLASH_ESCAPE,b,h]},o.APOS_STRING_MODE,o.QUOTE_STRING_MODE]},g="[0-9](_?[0-9])*",E=`(\\b(${g}))?\\.(${g})|\\b(${g})\\.`,S=`\\b|${n.join("|")}`,_={className:"number",relevance:0,variants:[{begin:`(\\b(${g})|(${E}))[eE][+-]?(${g})[jJ]?(?=${S})`},{begin:`(${E})[jJ]?`},{begin:`\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${S})`},{begin:`\\b0[bB](_?[01])+[lL]?(?=${S})`},{begin:`\\b0[oO](_?[0-7])+[lL]?(?=${S})`},{begin:`\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${S})`},{begin:`\\b(${g})[jJ](?=${S})`}]},C={className:"comment",begin:e.lookahead(/# type:/),end:/$/,keywords:a,contains:[{begin:/# type:/},{begin:/#/,end:/\b\B/,endsWithParent:!0}]},I={className:"params",variants:[{className:"",begin:/\(\s*\)/,skip:!0},{begin:/\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:a,contains:["self",s,_,u,o.HASH_COMMENT_MODE]}]};return h.contains=[u,_,s],{name:"Python",aliases:["py","gyp","ipython"],unicodeRegex:!0,keywords:a,illegal:/(<\/|\?)|=>/,contains:[s,_,{scope:"variable.language",match:/\bself\b/},{beginKeywords:"if",relevance:0},{match:/\bor\b/,scope:"keyword"},u,C,o.HASH_COMMENT_MODE,{match:[/\bdef/,/\s+/,r],scope:{1:"keyword",3:"title.function"},contains:[I]},{variants:[{match:[/\bclass/,/\s+/,r,/\s*/,/\(\s*/,r,/\s*\)/]},{match:[/\bclass/,/\s+/,r]}],scope:{1:"keyword",3:"title.class",6:"title.class.inherited"}},{className:"meta",begin:/^[\t ]*@/,end:/(?=#)|$/,contains:[_,I,u]}]}}var Ie="[A-Za-z$_][0-9A-Za-z$_]*",_t=["as","in","of","if","for","while","finally","var","new","function","do","return","void","else","break","catch","instanceof","with","throw","case","default","try","switch","continue","typeof","delete","let","yield","const","class","debugger","async","await","static","import","from","export","extends","using"],kt=["true","false","null","undefined","NaN","Infinity"],Et=["Object","Function","Boolean","Symbol","Math","Date","Number","BigInt","String","RegExp","Array","Float32Array","Float64Array","Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Int32Array","Uint16Array","Uint32Array","BigInt64Array","BigUint64Array","Set","Map","WeakSet","WeakMap","ArrayBuffer","SharedArrayBuffer","Atomics","DataView","JSON","Promise","Generator","GeneratorFunction","AsyncFunction","Reflect","Proxy","Intl","WebAssembly"],St=["Error","EvalError","InternalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError"],At=["setInterval","setTimeout","clearInterval","clearTimeout","require","exports","eval","isFinite","isNaN","parseFloat","parseInt","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape"],Ct=["arguments","this","super","console","window","document","localStorage","sessionStorage","module","global"],Mt=[].concat(At,Et,St);function Zr(o){let e=o.regex,r=(L,{after:G})=>{let ne="</"+L[0].slice(1);return L.input.indexOf(ne,G)!==-1},n=Ie,a={begin:"<>",end:"</>"},s=/<[A-Za-z0-9\\._:-]+\s*\/>/,h={begin:/<[A-Za-z0-9\\._:-]+/,end:/\/[A-Za-z0-9\\._:-]+>|\/>/,isTrulyOpeningTag:(L,G)=>{let ne=L[0].length+L.index,de=L.input[ne];if(de==="<"||de===","){G.ignoreMatch();return}de===">"&&(r(L,{after:ne})||G.ignoreMatch());let he,pe=L.input.substring(ne);if(he=pe.match(/^\s*=/)){G.ignoreMatch();return}if((he=pe.match(/^\s+extends\s+/))&&he.index===0){G.ignoreMatch();return}}},b={$pattern:Ie,keyword:_t,literal:kt,built_in:Mt,"variable.language":Ct},u="[0-9](_?[0-9])*",g=`\\.(${u})`,E="0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*",S={className:"number",variants:[{begin:`(\\b(${E})((${g})|\\.)?|(${g}))[eE][+-]?(${u})\\b`},{begin:`\\b(${E})\\b((${g})\\b|\\.)?|(${g})\\b`},{begin:"\\b(0|[1-9](_?[0-9])*)n\\b"},{begin:"\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b"},{begin:"\\b0[bB][0-1](_?[0-1])*n?\\b"},{begin:"\\b0[oO][0-7](_?[0-7])*n?\\b"},{begin:"\\b0[0-7]+n?\\b"}],relevance:0},_={className:"subst",begin:"\\$\\{",end:"\\}",keywords:b,contains:[]},C={begin:".?html`",end:"",starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,_],subLanguage:"xml"}},I={begin:".?css`",end:"",starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,_],subLanguage:"css"}},M={begin:".?gql`",end:"",starts:{end:"`",returnEnd:!1,contains:[o.BACKSLASH_ESCAPE,_],subLanguage:"graphql"}},V={className:"string",begin:"`",end:"`",contains:[o.BACKSLASH_ESCAPE,_]},P={className:"comment",variants:[o.COMMENT(/\/\*\*(?!\/)/,"\\*/",{relevance:0,contains:[{begin:"(?=@[A-Za-z]+)",relevance:0,contains:[{className:"doctag",begin:"@[A-Za-z]+"},{className:"type",begin:"\\{",end:"\\}",excludeEnd:!0,excludeBegin:!0,relevance:0},{className:"variable",begin:n+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{begin:/(?=[^\n])\s/,relevance:0}]}]}),o.C_BLOCK_COMMENT_MODE,o.C_LINE_COMMENT_MODE]},H=[o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,C,I,M,V,{match:/\$\d+/},S];_.contains=H.concat({begin:/\{/,end:/\}/,keywords:b,contains:["self"].concat(H)});let q=[].concat(P,_.contains),Z=q.concat([{begin:/(\s*)\(/,end:/\)/,keywords:b,contains:["self"].concat(q)}]),z={className:"params",begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:b,contains:Z},ie={variants:[{match:[/class/,/\s+/,n,/\s+/,/extends/,/\s+/,e.concat(n,"(",e.concat(/\./,n),")*")],scope:{1:"keyword",3:"title.class",5:"keyword",7:"title.class.inherited"}},{match:[/class/,/\s+/,n],scope:{1:"keyword",3:"title.class"}}]},J={relevance:0,match:e.either(/\bJSON/,/\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,/\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,/\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/),className:"title.class",keywords:{_:[...Et,...St]}},Y={label:"use_strict",className:"meta",relevance:10,begin:/^\s*['"]use (strict|asm)['"]/},ee={variants:[{match:[/function/,/\s+/,n,/(?=\s*\()/]},{match:[/function/,/\s*(?=\()/]}],className:{1:"keyword",3:"title.function"},label:"func.def",contains:[z],illegal:/%/},te={relevance:0,match:/\b[A-Z][A-Z_0-9]+\b/,className:"variable.constant"};function re(L){return e.concat("(?!",L.join("|"),")")}let K={match:e.concat(/\b/,re([...At,"super","import"].map(L=>`${L}\\s*\\(`)),n,e.lookahead(/\s*\(/)),className:"title.function",relevance:0},T={begin:e.concat(/\./,e.lookahead(e.concat(n,/(?![0-9A-Za-z$_(])/))),end:n,excludeBegin:!0,keywords:"prototype",className:"property",relevance:0},j={match:[/get|set/,/\s+/,n,/(?=\()/],className:{1:"keyword",3:"title.function"},contains:[{begin:/\(\)/},z]},oe="(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|"+o.UNDERSCORE_IDENT_RE+")\\s*=>",_e={match:[/const|var|let/,/\s+/,n,/\s*/,/=\s*/,/(async\s*)?/,e.lookahead(oe)],keywords:"async",className:{1:"keyword",3:"title.function"},contains:[z]};return{name:"JavaScript",aliases:["js","jsx","mjs","cjs"],keywords:b,exports:{PARAMS_CONTAINS:Z,CLASS_REFERENCE:J},illegal:/#(?![$_A-z])/,contains:[o.SHEBANG({label:"shebang",binary:"node",relevance:5}),Y,o.APOS_STRING_MODE,o.QUOTE_STRING_MODE,C,I,M,V,P,{match:/\$\d+/},S,J,{scope:"attr",match:n+e.lookahead(":"),relevance:0},_e,{begin:"("+o.RE_STARTERS_RE+"|\\b(case|return|throw)\\b)\\s*",keywords:"return throw case",relevance:0,contains:[P,o.REGEXP_MODE,{className:"function",begin:oe,returnBegin:!0,end:"\\s*=>",contains:[{className:"params",variants:[{begin:o.UNDERSCORE_IDENT_RE,relevance:0},{className:null,begin:/\(\s*\)/,skip:!0},{begin:/(\s*)\(/,end:/\)/,excludeBegin:!0,excludeEnd:!0,keywords:b,contains:Z}]}]},{begin:/,/,relevance:0},{match:/\s+/,relevance:0},{variants:[{begin:a.begin,end:a.end},{match:s},{begin:h.begin,"on:begin":h.isTrulyOpeningTag,end:h.end}],subLanguage:"xml",contains:[{begin:h.begin,end:h.end,skip:!0,contains:["self"]}]}]},ee,{beginKeywords:"while if switch catch for"},{begin:"\\b(?!function)"+o.UNDERSCORE_IDENT_RE+"\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",returnBegin:!0,label:"func.def",contains:[z,o.inherit(o.TITLE_MODE,{begin:n,className:"title.function"})]},{match:/\.\.\./,relevance:0},T,{match:"\\$"+n,relevance:0},{match:[/\bconstructor(?=\s*\()/],className:{1:"title.function"},contains:[z]},K,te,ie,j,{match:/\$[(.]/}]}}function Nt(o){let e=o.regex,r=Zr(o),n=Ie,a=["any","void","number","boolean","string","object","never","symbol","bigint","unknown"],s={begin:[/namespace/,/\s+/,o.IDENT_RE],beginScope:{1:"keyword",3:"title.class"}},h={beginKeywords:"interface",end:/\{/,excludeEnd:!0,keywords:{keyword:"interface extends",built_in:a},contains:[r.exports.CLASS_REFERENCE]},b={className:"meta",relevance:10,begin:/^\s*['"]use strict['"]/},u=["type","interface","public","private","protected","implements","declare","abstract","readonly","enum","override","satisfies"],g={$pattern:Ie,keyword:_t.concat(u),literal:kt,built_in:Mt.concat(a),"variable.language":Ct},E={className:"meta",begin:"@"+n},S=(M,V,P)=>{let H=M.contains.findIndex(q=>q.label===V);if(H===-1)throw new Error("can not find mode to replace");M.contains.splice(H,1,P)};Object.assign(r.keywords,g),r.exports.PARAMS_CONTAINS.push(E);let _=r.contains.find(M=>M.scope==="attr"),C=Object.assign({},_,{match:e.concat(n,e.lookahead(/\s*\?:/))});r.exports.PARAMS_CONTAINS.push([r.exports.CLASS_REFERENCE,_,C]),r.contains=r.contains.concat([E,s,h,C]),S(r,"shebang",o.SHEBANG()),S(r,"use_strict",b);let I=r.contains.find(M=>M.label==="func.def");return I.relevance=0,Object.assign(r,{name:"TypeScript",aliases:["ts","tsx","mts","cts"]}),r}$.registerLanguage("javascript",wt);$.registerLanguage("js",wt);$.registerLanguage("css",Pr);$.registerLanguage("html",Se);$.registerLanguage("xml",Se);$.registerLanguage("xhtml",Se);$.registerLanguage("svg",Se);$.registerLanguage("markup",Se);$.registerLanguage("json",Hr);$.registerLanguage("yaml",xt);$.registerLanguage("yml",xt);$.registerLanguage("php",Ur);$.registerLanguage("http",Fr);$.registerLanguage("plaintext",Te);$.registerLanguage("text",Te);$.registerLanguage("txt",Te);$.registerLanguage("csv",Te);$.registerLanguage("diff",qr);$.registerLanguage("bash",je);$.registerLanguage("shell",je);$.registerLanguage("sh",je);$.registerLanguage("zsh",je);$.registerLanguage("python",yt);$.registerLanguage("py",yt);$.registerLanguage("typescript",Nt);$.registerLanguage("ts",Nt);if(typeof document<"u"){let o=document.createElement("style");o.textContent="code-block:not(:defined),code-block-group:not(:defined){display:block;opacity:0}",document.head.appendChild(o)}var Ee=new Set,ve=null,ze=null;function Be(){let o=document.documentElement,e=document.body;if(!o||!e)return null;if(o.classList.contains("dark")||e.classList.contains("dark")||o.getAttribute("data-theme")==="dark"||e.getAttribute("data-theme")==="dark")return!0;if(o.getAttribute("data-theme")==="light"||e.getAttribute("data-theme")==="light")return!1;if(o.getAttribute("data-bs-theme")==="dark"||e.getAttribute("data-bs-theme")==="dark")return!0;if(o.getAttribute("data-bs-theme")==="light"||e.getAttribute("data-bs-theme")==="light")return!1;if(o.getAttribute("data-mode")==="dark")return!0;if(o.getAttribute("data-mode")==="light")return!1;let r=getComputedStyle(o).colorScheme;return r==="dark"?!0:r==="light"?!1:null}function Kr(){let o=Be();if(o!==ze){ze=o;for(let e of Ee)e._onPageModeChange(o)}}function Gr(){if(ve)return;ve=new MutationObserver(Kr);let o={attributes:!0,attributeFilter:["class","data-theme","data-bs-theme","data-mode","style"]};ve.observe(document.documentElement,o),document.body&&ve.observe(document.body,o)}function Wr(){ve&&(ve.disconnect(),ve=null)}function $t(o){Ee.add(o),Ee.size===1&&Gr();let e=Be();ze=e,o._onPageModeChange(e)}function Lt(o){Ee.delete(o),Ee.size===0&&(Wr(),ze=null)}var We=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._codeContent=null,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this),this._observer=null,this._highlighted=!1,this._isLoading=!1,this._loadError=null}connectedCallback(){this._codeContent=this.textContent,this.src?this._loadFromSrc():this.hasAttribute("lazy")?(this.renderPlaceholder(),this._setupLazyObserver()):this.render(),$t(this)}disconnectedCallback(){Lt(this),this._observer&&(this._observer.disconnect(),this._observer=null),document.removeEventListener("click",this._handleOutsideClick)}_setupLazyObserver(){this._observer||(this._observer=new IntersectionObserver(e=>{e[0].isIntersecting&&!this._highlighted&&(this._highlighted=!0,this.render(),this._observer.disconnect(),this._observer=null)},{rootMargin:"100px"}),this._observer.observe(this))}async _loadFromSrc(){let e=this.src;if(e){this._isLoading=!0,this._loadError=null,this._renderLoadingState();try{let r=await fetch(e);if(!r.ok)throw new Error(`HTTP ${r.status}: ${r.statusText}`);let n=await r.text();if(this._codeContent=n,!this.hasAttribute("language")){let a=this._detectLanguageFromUrl(e);a&&this.setAttribute("language",a)}if(!this.hasAttribute("filename")){let a=e.split("/").pop().split("?")[0];a&&this.setAttribute("filename",a)}this._isLoading=!1,this.render(),this.dispatchEvent(new CustomEvent("code-loaded",{detail:{url:e,code:n},bubbles:!0}))}catch(r){this._isLoading=!1,this._loadError=r.message,this._renderErrorState(),this.dispatchEvent(new CustomEvent("code-load-error",{detail:{url:e,error:r.message},bubbles:!0}))}}}_detectLanguageFromUrl(e){let r={js:"javascript",mjs:"javascript",cjs:"javascript",ts:"typescript",tsx:"typescript",jsx:"javascript",py:"python",css:"css",html:"html",htm:"html",json:"json",yaml:"yaml",yml:"yaml",xml:"xml",svg:"xml",sh:"bash",bash:"bash",zsh:"bash",php:"php",diff:"diff",patch:"diff",md:"markdown",markdown:"markdown",txt:"plaintext"},n=e.split("/").pop().split("?")[0].split("#")[0].split(".").pop().toLowerCase();return r[n]||null}_renderLoadingState(){let e=this.theme==="dark";this.shadowRoot.innerHTML=`
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
    `}static get observedAttributes(){return["language","label","theme","data-page-theme","show-lines","filename","highlight-lines","collapsed","max-lines","max-height","wrap","copy-text","copied-text","show-share","show-download","no-copy","lazy","focus-mode","src"]}attributeChangedCallback(e,r,n){if(this.shadowRoot&&r!==n){if(e==="src"&&n){this._loadFromSrc();return}e==="theme"&&(this.hasAttribute("theme")?this.removeAttribute("data-page-theme"):this._onPageModeChange(Be())),this.render()}}_onPageModeChange(e){if(this.hasAttribute("theme")){this.removeAttribute("data-page-theme");return}e===!0?this.setAttribute("data-page-theme","dark"):e===!1?this.setAttribute("data-page-theme","light"):this.removeAttribute("data-page-theme")}get language(){return this.getAttribute("language")||"plaintext"}get label(){return this.getAttribute("label")||this.filename||this.language.toUpperCase()}get theme(){return this.getAttribute("theme")||this.getAttribute("data-page-theme")||"light"}get showLines(){return this.hasAttribute("show-lines")}get filename(){return this.getAttribute("filename")||""}get highlightLines(){let e=this.getAttribute("highlight-lines");if(!e)return new Set;let r=new Set,n=e.split(",");for(let a of n){let s=a.trim();if(s.includes("-")){let[h,b]=s.split("-").map(Number);for(let u=h;u<=b;u++)r.add(u)}else r.add(Number(s))}return r}get collapsed(){return this.hasAttribute("collapsed")}get maxLines(){let e=this.getAttribute("max-lines");return e?parseInt(e,10):10}get maxHeight(){return this.getAttribute("max-height")||""}get wrap(){return this.hasAttribute("wrap")}get copyText(){return this.getAttribute("copy-text")||"Copy"}get copiedText(){return this.getAttribute("copied-text")||"Copied!"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get noCopy(){return this.hasAttribute("no-copy")}get lazy(){return this.hasAttribute("lazy")}get focusMode(){return this.hasAttribute("focus-mode")}get src(){return this.getAttribute("src")||""}async copyCode(){let e=(this._codeContent||this.textContent).trim(),r=document.createElement("div");r.innerHTML=e;let n=r.textContent,a=this.shadowRoot.querySelector(".copy-button"),s=this.copyText,h=this.copiedText;try{await navigator.clipboard.writeText(n),a.textContent=h,a.classList.add("copied"),a.setAttribute("aria-label","Code copied to clipboard")}catch(b){console.error("Failed to copy code:",b),a.textContent="Failed",a.classList.add("failed"),a.setAttribute("aria-label","Failed to copy code")}setTimeout(()=>{a.textContent=s,a.classList.remove("copied","failed"),a.setAttribute("aria-label","Copy code to clipboard")},2e3)}downloadCode(){let e=this.getCode(),r=this.filename||`code.${this._getFileExtension()}`,n=new Blob([e],{type:"text/plain"}),a=URL.createObjectURL(n),s=document.createElement("a");s.href=a,s.download=r,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(a)}_getFileExtension(){return{javascript:"js",js:"js",typescript:"ts",ts:"ts",html:"html",markup:"html",css:"css",json:"json",yaml:"yml",yml:"yml",php:"php",xml:"xml",xhtml:"xhtml",svg:"svg",http:"http",diff:"diff",csv:"csv",plaintext:"txt",text:"txt",txt:"txt"}[this.language]||"txt"}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),r=this.shadowRoot.querySelector(".share-button");this._showShareMenu?(e.style.display="block",r.classList.add("active"),setTimeout(()=>{document.addEventListener("click",this._handleOutsideClick)},0)):(e.style.display="none",r.classList.remove("active"),document.removeEventListener("click",this._handleOutsideClick))}_handleOutsideClick(e){let r=this.shadowRoot.querySelector(".share-menu");r&&!r.contains(e.target)&&this.toggleShareMenu()}async shareViaWebAPI(){if(!navigator.share)return;let e=this.getCode(),r=this.filename||this.label;try{await navigator.share({title:r,text:e}),this.toggleShareMenu()}catch(n){n.name!=="AbortError"&&console.error("Error sharing:",n)}}openInCodePen(){let e=this.getCode(),r=this.language,n={title:this.filename||this.label||"Code Block Demo",description:"Code shared from code-block component",editors:"111"};["html","markup","xhtml","xml","svg"].includes(r)?(n.html=e,n.editors="100"):r==="css"?(n.css=e,n.editors="010"):["javascript","js"].includes(r)?(n.js=e,n.editors="001"):(n.html=`<pre><code>${this.escapeHtml(e)}</code></pre>`,n.editors="100");let a=document.createElement("form");a.action="https://codepen.io/pen/define",a.method="POST",a.target="_blank";let s=document.createElement("input");s.type="hidden",s.name="data",s.value=JSON.stringify(n),a.appendChild(s),document.body.appendChild(a),a.submit(),document.body.removeChild(a),this.toggleShareMenu()}getStyles(){let e=this.theme==="dark";return`
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
        padding: 0.5rem 1rem;
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
        border: 1px solid var(--cb-button-border, ${e?"#30363d":"#d1d5da"});
        border-radius: 4px;
        padding: 4px 12px;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--cb-button-color, var(--_cb-button-color));
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
        color: var(--cb-button-color, var(--_cb-button-color));
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
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
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
        color: var(--cb-text-color, var(--_cb-text-color));
        font-size: 0.8125rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
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
        background: var(--cb-code-bg, var(--_cb-code-bg));
      }

      .line-numbers {
        padding: 1rem 0;
        text-align: right;
        user-select: none;
        background: var(--cb-line-numbers-bg, ${e?"#161b22":"#f6f8fa"});
        border-right: 1px solid var(--cb-border-color, var(--_cb-border-color));
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
        color: var(--cb-text-color, var(--_cb-text-color));
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
        background: var(--cb-scrollbar-track, var(--_cb-scrollbar-track));
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, var(--_cb-scrollbar-thumb));
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
    `}renderPlaceholder(){let e=(this._codeContent||this.textContent).trim(),r=e.split(`
`),n=this.escapeHtml(e).split(`
`).map(b=>`<span class="code-line">${b||" "}</span>`).join(""),a=this.showLines?`<div class="line-numbers" aria-hidden="true">${r.map((b,u)=>`<span>${u+1}</span>`).join("")}</div>`:"",s=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`;this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${s}
        </div>
        <div class="header-actions">
          <button class="copy-button" aria-label="${this.copyText}">${this.copyText}</button>
        </div>
      </div>
      <div class="code-wrapper">
        <div class="code-container">
          ${a}
          <pre><code class="hljs">${n}</code></pre>
        </div>
      </div>
    `;let h=this.shadowRoot.querySelector(".copy-button");h&&h.addEventListener("click",()=>this.copyCode())}render(){let e=(this._codeContent||this.textContent).trim(),r=e.split(`
`),n=this.highlightLines,a=this.language==="diff",s;try{this.language&&this.language!=="plaintext"&&this.language!=="text"&&this.language!=="txt"?s=$.highlight(e,{language:this.language,ignoreIllegals:!0}).value:s=this.escapeHtml(e)}catch{s=this.escapeHtml(e)}let h=s.split(`
`),b=h.map((Y,ee)=>{let te=ee+1,re=n.has(te),K=["code-line"];if(re&&K.push("highlighted"),a){let T=r[ee]||"";T.startsWith("+")&&!T.startsWith("+++")?K.push("diff-add"):T.startsWith("-")&&!T.startsWith("---")&&K.push("diff-remove")}return`<span class="${K.join(" ")}">${Y||" "}</span>`}).join(""),u=this.showLines?`<div class="line-numbers" aria-hidden="true">${h.map((Y,ee)=>{let te=ee+1,re=n.has(te),K=[];if(re&&K.push("highlighted"),a){let T=r[ee]||"";T.startsWith("+")&&!T.startsWith("+++")?K.push("diff-add"):T.startsWith("-")&&!T.startsWith("---")&&K.push("diff-remove")}return`<span class="${K.join(" ")}">${te}</span>`}).join("")}</div>`:"",g=this.filename?`<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>`:`<span class="label">${this.escapeHtml(this.label)}</span>`,E=this.hasAttribute("collapsed")||this.hasAttribute("max-lines"),S=h.length,_=this.maxLines,C=E&&S>_,I=this.collapsed,M=I?`calc(${_} * 1.6em + 2rem)`:"none",V=this.maxHeight?`--cb-max-height: ${this.maxHeight};`:"",P=I?`max-height: ${M};`:"";this.shadowRoot.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${g}
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
        ${u}
        <pre><code class="language-${this.language}" tabindex="0">${b}</code></pre>
      </div>
      ${C?`
        <button class="expand-button" aria-expanded="${!I}">
          ${I?`Show all ${S} lines`:"Show less"}
        </button>
      `:""}
    `,C?this.setAttribute("data-expandable",""):this.removeAttribute("data-expandable");let H=this.shadowRoot.querySelector(".copy-button");H&&H.addEventListener("click",()=>this.copyCode());let q=this.shadowRoot.querySelector(".expand-button");q&&q.addEventListener("click",()=>this.toggleCollapsed());let Z=this.shadowRoot.querySelector(".share-button");Z&&Z.addEventListener("click",Y=>{Y.stopPropagation(),this.toggleShareMenu()});let z=this.shadowRoot.querySelector(".share-native");z&&z.addEventListener("click",()=>this.shareViaWebAPI());let ie=this.shadowRoot.querySelector(".share-codepen");ie&&ie.addEventListener("click",()=>this.openInCodePen());let J=this.shadowRoot.querySelector(".download-button");J&&J.addEventListener("click",()=>this.downloadCode())}toggleCollapsed(){this.collapsed?this.removeAttribute("collapsed"):this.setAttribute("collapsed","")}escapeHtml(e){let r=document.createElement("div");return r.textContent=e,r.innerHTML}setCode(e){this._codeContent=e,this.render()}getCode(){return(this._codeContent||this.textContent).trim()}static getSupportedLanguages(){return $.listLanguages()}};customElements.define("code-block",We);var Ve=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this._activeIndex=0,this._showShareMenu=!1,this._handleOutsideClick=this._handleOutsideClick.bind(this)}connectedCallback(){requestAnimationFrame(()=>{this.render(),this.setupEventListeners()}),$t(this)}disconnectedCallback(){Lt(this),document.removeEventListener("click",this._handleOutsideClick)}static get observedAttributes(){return["theme","data-page-theme","show-share","show-download"]}attributeChangedCallback(e,r,n){this.shadowRoot&&r!==n&&(e==="theme"&&(this.hasAttribute("theme")?this.removeAttribute("data-page-theme"):this._onPageModeChange(Be())),this.render())}_onPageModeChange(e){if(this.hasAttribute("theme")){this.removeAttribute("data-page-theme");return}e===!0?this.setAttribute("data-page-theme","dark"):e===!1?this.setAttribute("data-page-theme","light"):this.removeAttribute("data-page-theme")}get theme(){return this.getAttribute("theme")||this.getAttribute("data-page-theme")||"light"}get showShare(){return this.hasAttribute("show-share")}get showDownload(){return this.hasAttribute("show-download")}get codeBlocks(){return Array.from(this.querySelectorAll("code-block"))}get activeIndex(){return this._activeIndex}set activeIndex(e){let r=this.codeBlocks;e>=0&&e<r.length&&(this._activeIndex=e,this.updateActiveTab())}getStyles(){let e=this.theme==="dark";return`
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
        border-radius: 4px;
        color: var(--cb-label-color, ${e?"#8b949e":"#57606a"});
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .action-button:hover {
        background: ${e?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)"};
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
    `}render(){let e=this.codeBlocks;if(e.length===0)return;e.forEach((a,s)=>{a.setAttribute("theme",this.theme),s===this._activeIndex?a.classList.add("active"):a.classList.remove("active")});let r=e.map((a,s)=>{let h=a.getAttribute("filename"),b=a.getAttribute("label"),u=a.getAttribute("language")||"plaintext",g=h||b||u.toUpperCase(),E=s===this._activeIndex;return`
        <button
          class="tab"
          role="tab"
          aria-selected="${E}"
          aria-controls="panel-${s}"
          tabindex="${E?"0":"-1"}"
          data-index="${s}"
        >
          <span class="tab-label">${this.escapeHtml(g)}</span>
          ${h?`<span class="language-badge">${u}</span>`:""}
        </button>
      `}).join(""),n=this.showShare||this.showDownload?`
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
          ${r}
        </div>
        ${n}
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `}setupEventListeners(){let e=this.shadowRoot.querySelector(".tabs");if(!e)return;e.addEventListener("click",h=>{let b=h.target.closest(".tab");if(b){let u=parseInt(b.dataset.index,10);this.activeIndex=u}}),e.addEventListener("keydown",h=>{let b=this.shadowRoot.querySelectorAll(".tab"),u=this._activeIndex,g=u;switch(h.key){case"ArrowLeft":g=u>0?u-1:b.length-1;break;case"ArrowRight":g=u<b.length-1?u+1:0;break;case"Home":g=0;break;case"End":g=b.length-1;break;default:return}h.preventDefault(),this.activeIndex=g,b[g].focus()});let r=this.shadowRoot.querySelector(".download-button");r&&r.addEventListener("click",()=>this.downloadCode());let n=this.shadowRoot.querySelector(".share-button");n&&n.addEventListener("click",h=>{h.stopPropagation(),this.toggleShareMenu()});let a=this.shadowRoot.querySelector(".web-share-button");a&&a.addEventListener("click",()=>{this.shareViaWebAPI(),this.toggleShareMenu()});let s=this.shadowRoot.querySelector(".codepen-button");s&&s.addEventListener("click",()=>{this.openInCodePen(),this.toggleShareMenu()})}updateActiveTab(){let e=this.shadowRoot.querySelectorAll(".tab"),r=this.codeBlocks;e.forEach((n,a)=>{let s=a===this._activeIndex;n.setAttribute("aria-selected",s),n.setAttribute("tabindex",s?"0":"-1")}),r.forEach((n,a)=>{a===this._activeIndex?n.classList.add("active"):n.classList.remove("active")}),this.dispatchEvent(new CustomEvent("tab-change",{detail:{index:this._activeIndex,block:r[this._activeIndex]},bubbles:!0}))}escapeHtml(e){let r=document.createElement("div");return r.textContent=e,r.innerHTML}selectTab(e){this.activeIndex=e}getActiveBlock(){return this.codeBlocks[this._activeIndex]}toggleShareMenu(){this._showShareMenu=!this._showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),r=this.shadowRoot.querySelector(".share-button");e&&e.classList.toggle("open",this._showShareMenu),r&&r.setAttribute("aria-expanded",this._showShareMenu),this._showShareMenu?document.addEventListener("click",this._handleOutsideClick):document.removeEventListener("click",this._handleOutsideClick)}_handleOutsideClick(e){let r=this.shadowRoot.querySelector(".share-container");if(r&&!e.composedPath().includes(r)){this._showShareMenu=!1;let n=this.shadowRoot.querySelector(".share-menu"),a=this.shadowRoot.querySelector(".share-button");n&&n.classList.remove("open"),a&&a.setAttribute("aria-expanded","false"),document.removeEventListener("click",this._handleOutsideClick)}}downloadCode(){let e=this.getActiveBlock();e&&typeof e.downloadCode=="function"&&e.downloadCode()}openInCodePen(){let e=this.codeBlocks;if(e.length===0)return;let r="",n="",a="",s="Code Block Group";e.forEach(E=>{let S=E.language,_=E.getCode(),C=E.filename;["html","markup","xhtml","xml","svg"].includes(S)?(r&&(r+=`

`),C&&(r+=`<!-- ${C} -->
`),r+=_):S==="css"?(n&&(n+=`

`),C&&(n+=`/* ${C} */
`),n+=_):["javascript","js"].includes(S)&&(a&&(a+=`

`),C&&(a+=`// ${C}
`),a+=_),(!s||s==="Code Block Group")&&(s=C||E.label||"Code Block Group")});let h="";h+=r?"1":"0",h+=n?"1":"0",h+=a?"1":"0";let b={title:s,description:"Code shared from code-block-group component",html:r,css:n,js:a,editors:h},u=document.createElement("form");u.action="https://codepen.io/pen/define",u.method="POST",u.target="_blank";let g=document.createElement("input");g.type="hidden",g.name="data",g.value=JSON.stringify(b),u.appendChild(g),document.body.appendChild(u),u.submit(),document.body.removeChild(u)}async shareViaWebAPI(){if(!navigator.share)return;let e=this.codeBlocks;if(e.length===0)return;let r="";e.forEach(n=>{let a=n.filename||n.label||n.language,s=n.getCode();r&&(r+=`

`),r+=`// === ${a} ===
${s}`});try{await navigator.share({title:"Code from code-block-group",text:r})}catch(n){n.name!=="AbortError"&&console.error("Share failed:",n)}}};customElements.define("code-block-group",Ve);if(typeof document<"u"){let o=document.createElement("style");o.textContent="browser-window:not(:defined){display:block;opacity:0}",document.head.appendChild(o)}var Ae=new Set,we=null,De=null;function Je(){let o=document.documentElement,e=document.body;if(!o||!e)return null;if(o.classList.contains("dark")||e.classList.contains("dark")||o.getAttribute("data-theme")==="dark"||e.getAttribute("data-theme")==="dark")return!0;if(o.getAttribute("data-theme")==="light"||e.getAttribute("data-theme")==="light")return!1;if(o.getAttribute("data-bs-theme")==="dark"||e.getAttribute("data-bs-theme")==="dark")return!0;if(o.getAttribute("data-bs-theme")==="light"||e.getAttribute("data-bs-theme")==="light")return!1;if(o.getAttribute("data-mode")==="dark")return!0;if(o.getAttribute("data-mode")==="light")return!1;let r=getComputedStyle(o).colorScheme;return r==="dark"?!0:r==="light"?!1:null}function Vr(){let o=Je();if(o!==De){De=o;for(let e of Ae)e._onPageModeChange(o)}}function Xr(){if(we)return;we=new MutationObserver(Vr);let o={attributes:!0,attributeFilter:["class","data-theme","data-bs-theme","data-mode","style"]};we.observe(document.documentElement,o),document.body&&we.observe(document.body,o)}function Jr(){we&&(we.disconnect(),we=null)}function Qr(o){Ae.add(o),Ae.size===1&&Xr();let e=Je();De=e,o._onPageModeChange(e)}function Yr(o){Ae.delete(o),Ae.size===0&&(Jr(),De=null)}var Ot={"iphone-16":{width:393,height:852,bezel:12,notch:"dynamic-island",cornerRadius:55,homeIndicator:!0,homeButton:!1,safeInsets:[59,0,34,0]},"iphone-16-pro-max":{width:440,height:956,bezel:12,notch:"dynamic-island",cornerRadius:55,homeIndicator:!0,homeButton:!1,safeInsets:[59,0,34,0]},"iphone-se":{width:375,height:667,bezel:12,notch:"none",cornerRadius:0,homeIndicator:!1,homeButton:!0,safeInsets:[20,0,0,0]},"pixel-9":{width:412,height:923,bezel:10,notch:"punch-hole",cornerRadius:48,homeIndicator:!0,homeButton:!1,safeInsets:[48,0,24,0]},"pixel-9-pro-xl":{width:448,height:998,bezel:10,notch:"punch-hole",cornerRadius:48,homeIndicator:!0,homeButton:!1,safeInsets:[48,0,24,0]},"galaxy-s24":{width:360,height:780,bezel:10,notch:"punch-hole",cornerRadius:40,homeIndicator:!0,homeButton:!1,safeInsets:[48,0,24,0]},"ipad-air":{width:820,height:1180,bezel:16,notch:"none",cornerRadius:18,homeIndicator:!0,homeButton:!1,safeInsets:[24,0,20,0]},"ipad-pro-13":{width:1032,height:1376,bezel:16,notch:"none",cornerRadius:18,homeIndicator:!0,homeButton:!1,safeInsets:[24,0,20,0]},"ipad-mini":{width:744,height:1133,bezel:16,notch:"none",cornerRadius:18,homeIndicator:!0,homeButton:!1,safeInsets:[24,0,20,0]}},Rt={midnight:"#1a1a1a",silver:"#c0c0c0",gold:"#d4a574",blue:"#3a4f6f",white:"#f0f0f0"},eo={"dynamic-island":54,"punch-hole":36,none:24},to=28,It=80,Xe=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.isMinimized=!1,this.isMaximized=!1,this.overlay=null,this.showSource=!1,this.sourceCode="",this.showShareMenu=!1,this.handleKeydown=this.handleKeydown.bind(this),this.handleOutsideClick=this.handleOutsideClick.bind(this),this._resizeObserver=null,this._currentScale=1}async connectedCallback(){this.render(),this.attachEventListeners(),this.src&&await this.fetchSourceCode(),Qr(this),this._getDevicePreset()&&this._setupDeviceScaling()}disconnectedCallback(){Yr(this),this.removeOverlay(),this._teardownDeviceScaling(),document.removeEventListener("keydown",this.handleKeydown),document.removeEventListener("click",this.handleOutsideClick)}static get observedAttributes(){return["url","title","mode","shadow","src","device","device-color","orientation","show-safe-areas"]}attributeChangedCallback(e){this.shadowRoot&&(this.render(),this.attachEventListeners()),(e==="device"||e==="orientation")&&(this._teardownDeviceScaling(),this._getDevicePreset()&&this._setupDeviceScaling()),e==="mode"&&(this.hasAttribute("mode")?this.removeAttribute("data-page-mode"):this._onPageModeChange(Je()))}get url(){return this.getAttribute("url")||""}get src(){return this.getAttribute("src")||""}get browserTitle(){return this.getAttribute("title")||this.getHostname()}get mode(){return this.getAttribute("mode")||this.getAttribute("data-page-mode")||"light"}get device(){return this.getAttribute("device")||""}get deviceColor(){return this.getAttribute("device-color")||"midnight"}_getDevicePreset(){let e=this.getAttribute("device");return e?Ot[e]||(console.warn(`<browser-window>: Unknown device preset "${e}", falling back to "iphone-16"`),Ot["iphone-16"]):null}_getEffectiveDimensions(e){let r=this.getAttribute("orientation")==="landscape";return{width:r?e.height:e.width,height:r?e.width:e.height}}_getEffectiveSafeInsets(e){let[r,n,a,s]=e.safeInsets;return this.getAttribute("orientation")==="landscape"?[s,r,n,a]:[r,n,a,s]}_onPageModeChange(e){if(this.hasAttribute("mode")){this.removeAttribute("data-page-mode");return}e===!0?this.setAttribute("data-page-mode","dark"):e===!1?this.setAttribute("data-page-mode","light"):this.removeAttribute("data-page-mode"),this._syncIframeColorScheme()}_syncIframeColorScheme(){let e=this.shadowRoot?.querySelector("iframe");if(!e)return;let r=this.mode==="dark";try{let n=e.contentDocument;n?.documentElement&&(n.documentElement.style.colorScheme=r?"dark":"light")}catch{}}_injectSafeAreas(e){let r=this._getDevicePreset();if(r)try{let n=e.contentDocument;if(!n)return;let a=n.querySelector("style[data-browser-window-safe-areas]");a&&a.remove();let[s,h,b,u]=this._getEffectiveSafeInsets(r),g=n.createElement("style");g.setAttribute("data-browser-window-safe-areas",""),g.textContent=`
        :root {
          --safe-top: ${s}px;
          --safe-right: ${h}px;
          --safe-bottom: ${b}px;
          --safe-left: ${u}px;
        }
      `,n.head.appendChild(g)}catch{console.info("<browser-window>: Cannot inject safe areas into cross-origin iframe")}}get hasShadow(){return this.hasAttribute("shadow")}getHostname(){try{return new URL(this.url).hostname}catch{return this.url}}attachEventListeners(){let e=this.shadowRoot.querySelector(".control-button.close"),r=this.shadowRoot.querySelector(".control-button.minimize"),n=this.shadowRoot.querySelector(".control-button.maximize"),a=this.shadowRoot.querySelector(".view-source-button"),s=this.shadowRoot.querySelector(".copy-source-button"),h=this.shadowRoot.querySelector(".share-button"),b=this.shadowRoot.querySelector(".browser-header");e?.addEventListener("click",()=>this.handleClose()),r?.addEventListener("click",()=>this.toggleMinimize()),n?.addEventListener("click",()=>this.toggleMaximize()),a?.addEventListener("click",()=>this.toggleViewSource()),s?.addEventListener("click",()=>this.copySourceCode()),h?.addEventListener("click",g=>{g.stopPropagation(),this.toggleShareMenu()}),b?.addEventListener("dblclick",g=>{let E=g.target;(E.classList.contains("browser-header")||E.classList.contains("controls"))&&this.toggleMaximize()});let u=this.shadowRoot.querySelector("iframe");u?.addEventListener("error",()=>this.handleIframeError()),u?.addEventListener("load",()=>{this._syncIframeColorScheme(),this._getDevicePreset()&&this._injectSafeAreas(u)})}handleIframeError(){let e=this.shadowRoot.querySelector(".browser-content");e&&(e.innerHTML=`
      <div class="error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>Failed to load content</p>
        <button class="retry-button" onclick="this.getRootNode().host.retryLoad()">Retry</button>
      </div>
    `)}retryLoad(){let e=this.shadowRoot.querySelector(".browser-content");if(!e||!this.src)return;e.innerHTML=`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`;let r=e.querySelector("iframe");r?.addEventListener("error",()=>this.handleIframeError()),r?.addEventListener("load",()=>this._syncIframeColorScheme())}async fetchSourceCode(){if(this.src)try{let e=await fetch(this.src);e.ok&&(this.sourceCode=await e.text())}catch(e){console.error("Failed to fetch source code:",e),this.sourceCode="// Failed to load source code"}}toggleViewSource(){this.showSource=!this.showSource,this.updateContentView()}updateContentView(){let e=this.shadowRoot.querySelector(".browser-content"),r=this.shadowRoot.querySelector(".view-source-button");e&&(this.showSource?(e.innerHTML=`
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
      `,r.classList.add("active"),e.querySelector(".copy-source-button")?.addEventListener("click",()=>this.copySourceCode())):(this.src?(e.innerHTML=`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`,e.querySelector("iframe")?.addEventListener("load",()=>this._syncIframeColorScheme())):e.innerHTML="<slot></slot>",r.classList.remove("active")))}async copySourceCode(){if(this.sourceCode)try{await navigator.clipboard.writeText(this.sourceCode);let e=this.shadowRoot.querySelector(".copy-source-button");if(e){let r=e.innerHTML;e.innerHTML=`
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3,8 6,11 13,4"/>
          </svg>
          Copied!
        `,e.classList.add("copied"),setTimeout(()=>{e.innerHTML=r,e.classList.remove("copied")},2e3)}}catch(e){console.error("Failed to copy source code:",e)}}toggleShareMenu(){this.showShareMenu=!this.showShareMenu;let e=this.shadowRoot.querySelector(".share-menu"),r=this.shadowRoot.querySelector(".share-button");this.showShareMenu?(e.style.display="block",r.classList.add("active"),setTimeout(()=>{document.addEventListener("click",this.handleOutsideClick)},0)):(e.style.display="none",r.classList.remove("active"),document.removeEventListener("click",this.handleOutsideClick))}handleOutsideClick(e){let r=this.shadowRoot.querySelector(".share-menu");r&&!r.contains(e.target)&&this.toggleShareMenu()}async shareViaWebAPI(){if(!navigator.share){console.warn("Web Share API not supported");return}let e={title:this.browserTitle||"CSS Demo",text:`Check out this CSS demo: ${this.browserTitle}`,url:this.src||this.url};try{await navigator.share(e),this.toggleShareMenu()}catch(r){r.name!=="AbortError"&&console.error("Error sharing:",r)}}parseHTMLForCodePen(){if(!this.sourceCode)return null;let e=new DOMParser().parseFromString(this.sourceCode,"text/html"),r=Array.from(e.querySelectorAll("style")).map(s=>s.textContent).join(`

`),n=Array.from(e.querySelectorAll("script")).filter(s=>!s.src&&s.type!=="module").map(s=>s.textContent).join(`

`),a=e.body.cloneNode(!0);return a.querySelectorAll("script, style").forEach(s=>s.remove()),{html:a.innerHTML.trim(),css:r.trim(),js:n.trim()}}openInCodePen(){let e=this.parseHTMLForCodePen();if(!e)return;let r={title:this.browserTitle||"CSS Demo",description:`Demo from ${this.url}`,html:e.html,css:e.css,js:e.js,editors:"110"},n=document.createElement("form");n.action="https://codepen.io/pen/define",n.method="POST",n.target="_blank";let a=document.createElement("input");a.type="hidden",a.name="data",a.value=JSON.stringify(r),n.appendChild(a),document.body.appendChild(n),n.submit(),document.body.removeChild(n),this.toggleShareMenu()}handleClose(){this.isMaximized&&this.toggleMaximize()}handleKeydown(e){e.key==="Escape"&&(this.showShareMenu?this.toggleShareMenu():this.isMaximized&&this.toggleMaximize())}createOverlay(){if(this.overlay)return;this.overlay=document.createElement("div"),this.overlay.style.cssText=`
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
    `,document.head.appendChild(e),this.overlay.addEventListener("click",()=>this.toggleMaximize()),document.body.appendChild(this.overlay),document.addEventListener("keydown",this.handleKeydown)}removeOverlay(){this.overlay&&(this.overlay.remove(),this.overlay=null),document.removeEventListener("keydown",this.handleKeydown)}toggleMinimize(){let e=this.shadowRoot.querySelector(".browser-content");e&&(this.isMinimized=!this.isMinimized,this.isMinimized?(this.isMaximized&&this.toggleMaximize(),e.style.display="none"):e.style.display="")}toggleMaximize(){let e=this.shadowRoot.querySelector(".control-button.maximize");if(this.isMaximized){this.classList.remove("browser-window-maximized"),this.removeAttribute("role"),this.removeAttribute("aria-modal");let r=this.shadowRoot.querySelector("iframe");r&&(r.style.minHeight=""),this.removeOverlay(),this.isMaximized=!1,e&&(e.setAttribute("aria-label","Maximize window"),e.setAttribute("aria-expanded","false"))}else{this.isMinimized&&this.toggleMinimize(),this.createOverlay(),this.classList.add("browser-window-maximized"),this.setAttribute("role","dialog"),this.setAttribute("aria-modal","true");let r=this.shadowRoot.querySelector("iframe");r&&(r.style.minHeight="calc(90vh - 50px)"),this.isMaximized=!0,e&&(e.setAttribute("aria-label","Restore window"),e.setAttribute("aria-expanded","true"))}}render(){let e=this._getDevicePreset(),r=e?this._deviceCSS(e):this._browserCSS(),n=e?this._deviceChrome(e):this._browserChrome();this.shadowRoot.innerHTML=`
      <style>${this._sharedCSS()}${r}</style>
      ${n}
      ${e?"":this._contentHTML()}
    `,e&&this._updateDeviceScale()}_sharedCSS(){return`
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
          --browser-window-border-radius: 8px;
          --browser-window-shadow: ${this.hasShadow?"0 4px 12px rgba(0, 0, 0, 0.15)":"none"};
          --browser-window-close-color: #ff5f57;
          --browser-window-minimize-color: #febc2e;
          --browser-window-maximize-color: #28c840;
          --browser-window-accent-color: #2563eb;
          --browser-window-active-bg: #dbeafe;
          --browser-window-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          --browser-window-mono-font: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;

          display: flex;
          flex-direction: column;
          margin: 1rem 0;
          border-radius: var(--browser-window-border-radius);
          overflow: hidden;
          border: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
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
            --_bw-bg: var(--color-surface, #1c1c1e);
            --_bw-header-bg: var(--color-surface-raised, #2c2c2e);
            --_bw-border-color: var(--color-border, #3a3a3c);
            --_bw-text-color: var(--color-text, #e5e5e7);
            --_bw-text-muted: var(--color-text-muted, #98989d);
            --_bw-url-bg: var(--color-surface, #1c1c1e);
            --_bw-hover-bg: #3a3a3c;
            --_bw-content-bg: var(--color-surface, #000000);
            color-scheme: dark;
          }
        }

        /* Page-level dark mode detection (overrides media query via higher specificity) */
        :host([data-page-mode="dark"]:not([mode])) {
          --_bw-bg: var(--color-surface, #1c1c1e);
          --_bw-header-bg: var(--color-surface-raised, #2c2c2e);
          --_bw-border-color: var(--color-border, #3a3a3c);
          --_bw-text-color: var(--color-text, #e5e5e7);
          --_bw-text-muted: var(--color-text-muted, #98989d);
          --_bw-url-bg: var(--color-surface, #1c1c1e);
          --_bw-hover-bg: #3a3a3c;
          --_bw-content-bg: var(--color-surface, #000000);
          color-scheme: dark;
        }

        :host([data-page-mode="light"]:not([mode])) {
          --_bw-bg: var(--color-surface, #ffffff);
          --_bw-header-bg: var(--color-surface-raised, #f6f8fa);
          --_bw-border-color: var(--color-border, #d1d5da);
          --_bw-text-color: var(--color-text, #24292e);
          --_bw-text-muted: var(--color-text-muted, #586069);
          --_bw-url-bg: var(--color-surface, #ffffff);
          --_bw-hover-bg: #f3f4f6;
          --_bw-content-bg: var(--color-surface, #ffffff);
          color-scheme: light;
        }

        /* Explicit dark mode override */
        :host([mode="dark"]) {
          --_bw-bg: var(--color-surface, #1c1c1e);
          --_bw-header-bg: var(--color-surface-raised, #2c2c2e);
          --_bw-border-color: var(--color-border, #3a3a3c);
          --_bw-text-color: var(--color-text, #e5e5e7);
          --_bw-text-muted: var(--color-text-muted, #98989d);
          --_bw-url-bg: var(--color-surface, #1c1c1e);
          --_bw-hover-bg: #3a3a3c;
          --_bw-content-bg: var(--color-surface, #000000);
          color-scheme: dark;
        }

        /* Explicit light mode override (for users on dark system who want light) */
        :host([mode="light"]) {
          --_bw-bg: var(--color-surface, #ffffff);
          --_bw-header-bg: var(--color-surface-raised, #f6f8fa);
          --_bw-border-color: var(--color-border, #d1d5da);
          --_bw-text-color: var(--color-text, #24292e);
          --_bw-text-muted: var(--color-text-muted, #586069);
          --_bw-url-bg: var(--color-surface, #ffffff);
          --_bw-hover-bg: #f3f4f6;
          --_bw-content-bg: var(--color-surface, #ffffff);
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

        .browser-content {
          background: var(--browser-window-content-bg, var(--_bw-content-bg));
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
          background: var(--browser-window-header-bg, var(--_bw-header-bg));
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
          border-radius: 6px;
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
          border: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
          border-radius: 6px;
          overflow-x: auto;
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
          border-radius: 6px;
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

        .share-menu {
          display: none;
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: var(--browser-window-header-bg, var(--_bw-header-bg));
          border: 1px solid var(--browser-window-border-color, var(--_bw-border-color));
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
    `}_contentHTML(){return`
      <div class="browser-content" part="content">
        ${this.src?`<iframe src="${this.escapeHtml(this.src)}" loading="lazy"></iframe>`:"<slot></slot>"}
      </div>
    `}_deviceCSS(e){let r=Rt[this.deviceColor]||Rt.midnight,n=this.getAttribute("orientation")==="landscape",a=this._getEffectiveDimensions(e),[s,h,b,u]=this._getEffectiveSafeInsets(e),g=eo[e.notch]||24,E=e.homeIndicator&&!e.homeButton?to:0,S=e.homeButton?It:0,_=e.notch!=="none";return`
        :host([device]) {
          --device-width: ${a.width}px;
          --device-height: ${a.height}px;
          --device-bezel: ${e.bezel}px;
          --device-corner-radius: ${e.cornerRadius}px;
          --browser-window-bezel-color: ${r};
          --status-bar-height: ${n&&_?24:g}px;
          --home-indicator-height: ${E}px;
          --home-button-area: ${S}px;
          --safe-top: ${s}px;
          --safe-right: ${h}px;
          --safe-bottom: ${b}px;
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
          border: var(--device-bezel) solid var(--browser-window-bezel-color);
          border-radius: var(--device-corner-radius);
          overflow: hidden;
          position: relative;
          background: #000;
          flex-shrink: 0;
          transform-origin: top center;
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
    `}_deviceChrome(e){let r=this.getAttribute("orientation")==="landscape",n=e.notch!=="none",a=n?e.notch:"",s=e.homeButton?"home-button":"",h=["silver","gold","white"].includes(this.deviceColor)?"light-bezel":"",b=["device-frame",a,s,h,r?"landscape":""].filter(Boolean).join(" "),u=`
      <div class="status-bar ${r&&n?"":a}">
        <span class="status-time">9:41</span>
        <div class="status-icons">
          <span class="signal-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
          <span class="wifi-icon" aria-hidden="true"></span>
          <span class="battery-icon" aria-hidden="true"></span>
        </div>
      </div>
    `,g=e.homeIndicator&&!e.homeButton?'<div class="home-indicator"><div class="home-indicator-pill"></div></div>':"",E=this.hasAttribute("show-safe-areas")?`<div class="safe-area-overlays">
          <div class="safe-area-overlay safe-area-top"></div>
          <div class="safe-area-overlay safe-area-right"></div>
          <div class="safe-area-overlay safe-area-bottom"></div>
          <div class="safe-area-overlay safe-area-left"></div>
        </div>`:"";return r&&n?`
        <div class="device-wrapper">
          <div class="${b}">
            <div class="notch-sidebar ${a}"></div>
            <div class="device-main">
              ${u}
              ${this._contentHTML()}
              ${g}
            </div>
            ${E}
          </div>
        </div>
      `:`
      <div class="device-wrapper">
        <div class="${b}">
          ${u}
          ${this._contentHTML()}
          ${g}
          ${E}
        </div>
      </div>
    `}_setupDeviceScaling(){this._resizeObserver||(this._resizeObserver=new ResizeObserver(()=>this._updateDeviceScale()),this._resizeObserver.observe(this))}_updateDeviceScale(){let e=this._getDevicePreset();if(!e)return;let r=this.shadowRoot.querySelector(".device-wrapper"),n=this.shadowRoot.querySelector(".device-frame");if(!r||!n)return;let a=this.clientWidth;if(a===0)return;let s=this._getEffectiveDimensions(e),h=s.width+e.bezel*2,b=Math.min(1,a/h);this._currentScale=b,n.style.transform=`scale(${b})`;let u=e.homeButton?It:0,g=s.height+e.bezel*2+u;r.style.height=`${g*b}px`}_teardownDeviceScaling(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=null),this._currentScale=1}escapeHtml(e){let r=document.createElement("div");return r.textContent=e,r.innerHTML}};customElements.define("browser-window",Xe);
