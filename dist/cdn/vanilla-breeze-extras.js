var Wt=Object.defineProperty;var B=(s,t)=>()=>(s&&(t=s(s=0)),t);var vt=(s,t)=>{for(var e in t)Wt(s,e,{get:t[e],enumerable:!0})};function xt(s,t,e){let i=Math.pow(2,e),r=s*Math.PI/180,o=(t+180)/360*i,a=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*i,n=Math.floor(o),l=Math.floor(a),d=Math.round((o-n)*256),c=Math.round((a-l)*256);return{tileX:n,tileY:l,pixelX:d,pixelY:c}}function Et(s,t,e){let i=256*Math.pow(2,e),r=s/i*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*t/i)))*180/Math.PI,lng:r}}function j(s,t,e,i){switch(s){case"carto-light":return`https://basemaps.cartocdn.com/light_all/${t}/${e}/${i}.png`;case"carto-dark":return`https://basemaps.cartocdn.com/dark_all/${t}/${e}/${i}.png`;default:return`https://tile.openstreetmap.org/${t}/${e}/${i}.png`}}var G=B(()=>{});var At={};vt(At,{MapInteraction:()=>W});var W,Ct=B(()=>{G();W=class{#t;#e;#i;#a;#o;#n=0;#s=0;#r=15;#m=1;#c=19;#l=0;#u=0;#f=new Map;#d=null;#g=0;#b=0;#p=!1;#h=0;#v=0;constructor({shadow:t,host:e,lat:i,lng:r,zoom:o,provider:a,onDeactivate:n}){this.#t=t,this.#e=e,this.#a=a,this.#o=n,this.#r=o,this.#i=t.querySelector('[part="tiles"]'),this.#d=t.querySelector('[part="marker"]');let l=256*Math.pow(2,o),d=i*Math.PI/180;this.#n=(r+180)/360*l,this.#s=(1-Math.log(Math.tan(d)+1/Math.cos(d))/Math.PI)/2*l,this.#g=this.#n,this.#b=this.#s,this.#l=this.#e.offsetWidth||400,this.#u=this.#e.offsetHeight||300,this.#i.innerHTML="",this.#i.style.transform="",this.#d&&(this.#d.style.position="absolute",this.#d.style.top="",this.#d.style.left="",this.#i.appendChild(this.#d)),this.#y(),this.#_()}#y(){this.#i.addEventListener("pointerdown",this.#w),this.#i.addEventListener("wheel",this.#E,{passive:!1}),this.#e.addEventListener("keydown",this.#k)}#w=t=>{t.button===0&&(t.preventDefault(),this.#p=!0,this.#h=t.clientX,this.#v=t.clientY,this.#i.setPointerCapture(t.pointerId),this.#i.setAttribute("data-dragging",""),this.#i.addEventListener("pointermove",this.#A),this.#i.addEventListener("pointerup",this.#C))};#A=t=>{if(!this.#p)return;let e=t.clientX-this.#h,i=t.clientY-this.#v;this.#h=t.clientX,this.#v=t.clientY,this.#n-=e,this.#s-=i,this.#x(),this.#_()};#C=t=>{this.#p=!1,this.#i.releasePointerCapture(t.pointerId),this.#i.removeAttribute("data-dragging"),this.#i.removeEventListener("pointermove",this.#A),this.#i.removeEventListener("pointerup",this.#C),this.#S()};#E=t=>{t.preventDefault();let e=t.ctrlKey?-t.deltaY*.01:-Math.sign(t.deltaY),i=Math.round(Math.max(this.#m,Math.min(this.#c,this.#r+e)));if(i===this.#r)return;let r=this.#e.getBoundingClientRect(),o=t.clientX-r.left,a=t.clientY-r.top;this.#j(i,o,a)};#k=t=>{switch(t.key){case"ArrowLeft":t.preventDefault(),this.#n-=80,this.#x(),this.#_(),this.#S();break;case"ArrowRight":t.preventDefault(),this.#n+=80,this.#x(),this.#_(),this.#S();break;case"ArrowUp":t.preventDefault(),this.#s-=80,this.#x(),this.#_(),this.#S();break;case"ArrowDown":t.preventDefault(),this.#s+=80,this.#x(),this.#_(),this.#S();break;case"+":case"=":t.preventDefault(),this.#j(this.#r+1,this.#l/2,this.#u/2);break;case"-":t.preventDefault(),this.#j(this.#r-1,this.#l/2,this.#u/2);break;case"Escape":t.preventDefault(),this.#o();break}};#j(t,e,i){if(t=Math.max(this.#m,Math.min(this.#c,t)),t===this.#r)return;let r=this.#n-this.#l/2,o=this.#s-this.#u/2,a=r+e,n=o+i,l=Math.pow(2,t-this.#r);this.#n=a*l-e+this.#l/2,this.#s=n*l-i+this.#u/2,this.#g*=l,this.#b*=l,this.#r=t,this.#T(),this.#x(),this.#_(),this.#S()}#x(){let t=256*Math.pow(2,this.#r);this.#n=(this.#n%t+t)%t,this.#s=Math.max(this.#u/2,Math.min(t-this.#u/2,this.#s))}#_(){let t=-(this.#n-this.#l/2),e=-(this.#s-this.#u/2);this.#i.style.transform=`translate(${Math.round(t)}px, ${Math.round(e)}px)`,this.#P(),this.#D(),this.#F()}#P(){let t=this.#r,e=Math.pow(2,t),i=this.#n-this.#l/2,r=this.#s-this.#u/2,o=i+this.#l,a=r+this.#u,n=Math.floor(i/256)-1,l=Math.max(0,Math.floor(r/256)-1),d=Math.ceil(o/256)+1,c=Math.min(e,Math.ceil(a/256)+1);for(let h=l;h<c;h++)for(let u=n;u<d;u++){let p=(u%e+e)%e,g=`${t}/${p}/${h}`;this.#f.has(g)||this.#M(t,u,h,p)}}#M(t,e,i,r){let o=`${t}/${r}/${i}`;if(this.#f.has(o))return;let a=e*256,n=i*256,l=document.createElement("img");l.src=j(this.#a,t,r,i),l.alt="",l.draggable=!1,l.style.left=a+"px",l.style.top=n+"px",l.style.width="256px",l.style.height="256px",l._wx=a,l._wy=n,this.#f.set(o,l),this.#i.appendChild(l)}#D(){let t=this.#n-this.#l/2,e=this.#s-this.#u/2,i=512;for(let[r,o]of this.#f){let a=o._wx,n=o._wy;(a+256<t-i||a>t+this.#l+i||n+256<e-i||n>e+this.#u+i)&&(o.remove(),this.#f.delete(r))}}#F(){if(!this.#d)return;let t=this.#d.offsetWidth||32;this.#d.style.left=`${Math.round(this.#g-t/2)}px`,this.#d.style.top=`${Math.round(this.#b-t)}px`,this.#d.style.transform=""}#S(){let{lat:t,lng:e}=Et(this.#n,this.#s,this.#r);this.#e.dispatchEvent(new CustomEvent("geo-map:move",{bubbles:!0,detail:{lat:+t.toFixed(6),lng:+e.toFixed(6),zoom:this.#r}}))}#T(){for(let t of this.#f.values())t.remove();this.#f.clear()}destroy(){if(this.#i.removeEventListener("pointerdown",this.#w),this.#i.removeEventListener("wheel",this.#E),this.#e.removeEventListener("keydown",this.#k),this.#i.removeEventListener("pointermove",this.#A),this.#i.removeEventListener("pointerup",this.#C),this.#d&&this.#d.parentNode===this.#i){let t=this.#t.querySelector('[part="container"]');t&&(t.insertBefore(this.#d,this.#i.nextSibling),this.#d.style.position="",this.#d.style.left="",this.#d.style.top="",this.#d.style.transform="")}this.#T(),this.#e.removeAttribute("data-interactive-active")}}});var X={};vt(X,{EMOJI_ALIASES:()=>_t,EMOJI_GROUPS:()=>Qt,EMOJI_GROUP_ICONS:()=>te,EMOJI_GROUP_LABELS:()=>Zt,EMOJI_MAP:()=>E,getByGroup:()=>ie,resolveEmoji:()=>ee,searchEmoji:()=>se});function St(s){for(let[t,e,i,r]of s){if(E.has(t))continue;let o={shortcode:t,emoji:e,name:i,keywords:[],group:r};E.set(t,o),M.push(o)}}function ee(s){let t=E.get(s);if(t)return t;let e=_t.get(s);return e&&E.get(e)||null}function ie(s){let t=L.filter(i=>i.group===s),e=M.filter(i=>i.group===s);return e.length>0?t.concat(e):t}function se(s){let t=s.toLowerCase().trim(),e=M.length>0?L.concat(M):L;return t?e.filter(i=>i.shortcode.includes(t)||i.name.toLowerCase().includes(t)||i.keywords&&i.keywords.some(r=>r.includes(t))):e}var L,E,_t,Qt,Zt,te,M,J=B(()=>{L=[{shortcode:"smile",emoji:"\u{1F604}",name:"Smiling Face with Open Mouth",keywords:["happy","joy","laugh"],group:"smileys"},{shortcode:"grinning",emoji:"\u{1F600}",name:"Grinning Face",keywords:["happy","smile"],group:"smileys"},{shortcode:"laughing",emoji:"\u{1F606}",name:"Grinning Squinting Face",keywords:["happy","laugh"],group:"smileys"},{shortcode:"sweat_smile",emoji:"\u{1F605}",name:"Grinning Face with Sweat",keywords:["hot","relief"],group:"smileys"},{shortcode:"rofl",emoji:"\u{1F923}",name:"Rolling on the Floor Laughing",keywords:["lol","funny"],group:"smileys"},{shortcode:"joy",emoji:"\u{1F602}",name:"Face with Tears of Joy",keywords:["happy","cry","laugh"],group:"smileys"},{shortcode:"slightly_smiling_face",emoji:"\u{1F642}",name:"Slightly Smiling Face",keywords:["smile"],group:"smileys"},{shortcode:"upside_down_face",emoji:"\u{1F643}",name:"Upside-Down Face",keywords:["sarcasm","silly"],group:"smileys"},{shortcode:"wink",emoji:"\u{1F609}",name:"Winking Face",keywords:["flirt","joke"],group:"smileys"},{shortcode:"blush",emoji:"\u{1F60A}",name:"Smiling Face with Smiling Eyes",keywords:["happy","shy"],group:"smileys"},{shortcode:"innocent",emoji:"\u{1F607}",name:"Smiling Face with Halo",keywords:["angel","good"],group:"smileys"},{shortcode:"heart_eyes",emoji:"\u{1F60D}",name:"Smiling Face with Heart-Eyes",keywords:["love","crush"],group:"smileys"},{shortcode:"star_struck",emoji:"\u{1F929}",name:"Star-Struck",keywords:["wow","amazing"],group:"smileys"},{shortcode:"kissing_heart",emoji:"\u{1F618}",name:"Face Blowing a Kiss",keywords:["love","kiss"],group:"smileys"},{shortcode:"yum",emoji:"\u{1F60B}",name:"Face Savoring Food",keywords:["delicious","tasty"],group:"smileys"},{shortcode:"stuck_out_tongue",emoji:"\u{1F61B}",name:"Face with Tongue",keywords:["playful","silly"],group:"smileys"},{shortcode:"stuck_out_tongue_winking_eye",emoji:"\u{1F61C}",name:"Winking Face with Tongue",keywords:["silly","playful"],group:"smileys"},{shortcode:"zany_face",emoji:"\u{1F92A}",name:"Zany Face",keywords:["crazy","wild"],group:"smileys"},{shortcode:"hugs",emoji:"\u{1F917}",name:"Hugging Face",keywords:["hug","warm"],group:"smileys"},{shortcode:"thinking",emoji:"\u{1F914}",name:"Thinking Face",keywords:["hmm","consider"],group:"smileys"},{shortcode:"shushing_face",emoji:"\u{1F92B}",name:"Shushing Face",keywords:["quiet","secret"],group:"smileys"},{shortcode:"smirk",emoji:"\u{1F60F}",name:"Smirking Face",keywords:["sly","suggestive"],group:"smileys"},{shortcode:"unamused",emoji:"\u{1F612}",name:"Unamused Face",keywords:["bored","unimpressed"],group:"smileys"},{shortcode:"roll_eyes",emoji:"\u{1F644}",name:"Face with Rolling Eyes",keywords:["annoyed","whatever"],group:"smileys"},{shortcode:"grimacing",emoji:"\u{1F62C}",name:"Grimacing Face",keywords:["awkward","nervous"],group:"smileys"},{shortcode:"relieved",emoji:"\u{1F60C}",name:"Relieved Face",keywords:["calm","peaceful"],group:"smileys"},{shortcode:"pensive",emoji:"\u{1F614}",name:"Pensive Face",keywords:["sad","thoughtful"],group:"smileys"},{shortcode:"sleepy",emoji:"\u{1F62A}",name:"Sleepy Face",keywords:["tired","sleep"],group:"smileys"},{shortcode:"sleeping",emoji:"\u{1F634}",name:"Sleeping Face",keywords:["zzz","sleep"],group:"smileys"},{shortcode:"mask",emoji:"\u{1F637}",name:"Face with Medical Mask",keywords:["sick","health"],group:"smileys"},{shortcode:"nerd_face",emoji:"\u{1F913}",name:"Nerd Face",keywords:["geek","smart"],group:"smileys"},{shortcode:"sunglasses",emoji:"\u{1F60E}",name:"Smiling Face with Sunglasses",keywords:["cool","chill"],group:"smileys"},{shortcode:"confused",emoji:"\u{1F615}",name:"Confused Face",keywords:["puzzled","unsure"],group:"smileys"},{shortcode:"worried",emoji:"\u{1F61F}",name:"Worried Face",keywords:["anxious","concern"],group:"smileys"},{shortcode:"cry",emoji:"\u{1F622}",name:"Crying Face",keywords:["sad","tear"],group:"smileys"},{shortcode:"sob",emoji:"\u{1F62D}",name:"Loudly Crying Face",keywords:["sad","cry"],group:"smileys"},{shortcode:"angry",emoji:"\u{1F620}",name:"Angry Face",keywords:["mad","annoyed"],group:"smileys"},{shortcode:"rage",emoji:"\u{1F92C}",name:"Face with Symbols on Mouth",keywords:["angry","swear"],group:"smileys"},{shortcode:"exploding_head",emoji:"\u{1F92F}",name:"Exploding Head",keywords:["mind blown","shocked"],group:"smileys"},{shortcode:"flushed",emoji:"\u{1F633}",name:"Flushed Face",keywords:["embarrassed","shocked"],group:"smileys"},{shortcode:"scream",emoji:"\u{1F631}",name:"Face Screaming in Fear",keywords:["scared","horror"],group:"smileys"},{shortcode:"skull",emoji:"\u{1F480}",name:"Skull",keywords:["dead","death"],group:"smileys"},{shortcode:"clown_face",emoji:"\u{1F921}",name:"Clown Face",keywords:["joke","funny"],group:"smileys"},{shortcode:"ghost",emoji:"\u{1F47B}",name:"Ghost",keywords:["halloween","spooky"],group:"smileys"},{shortcode:"wave",emoji:"\u{1F44B}",name:"Waving Hand",keywords:["hello","goodbye"],group:"people"},{shortcode:"raised_hand",emoji:"\u270B",name:"Raised Hand",keywords:["stop","high five"],group:"people"},{shortcode:"ok_hand",emoji:"\u{1F44C}",name:"OK Hand",keywords:["perfect","nice"],group:"people"},{shortcode:"thumbsup",emoji:"\u{1F44D}",name:"Thumbs Up",keywords:["approve","good","yes"],group:"people"},{shortcode:"thumbsdown",emoji:"\u{1F44E}",name:"Thumbs Down",keywords:["disapprove","bad","no"],group:"people"},{shortcode:"clap",emoji:"\u{1F44F}",name:"Clapping Hands",keywords:["applause","bravo"],group:"people"},{shortcode:"raised_hands",emoji:"\u{1F64C}",name:"Raising Hands",keywords:["celebration","hooray"],group:"people"},{shortcode:"pray",emoji:"\u{1F64F}",name:"Folded Hands",keywords:["thanks","please","hope"],group:"people"},{shortcode:"handshake",emoji:"\u{1F91D}",name:"Handshake",keywords:["deal","agreement"],group:"people"},{shortcode:"point_up",emoji:"\u261D\uFE0F",name:"Index Pointing Up",keywords:["attention","important"],group:"people"},{shortcode:"point_right",emoji:"\u{1F449}",name:"Backhand Index Pointing Right",keywords:["direction","this"],group:"people"},{shortcode:"point_left",emoji:"\u{1F448}",name:"Backhand Index Pointing Left",keywords:["direction","that"],group:"people"},{shortcode:"point_down",emoji:"\u{1F447}",name:"Backhand Index Pointing Down",keywords:["direction","below"],group:"people"},{shortcode:"v",emoji:"\u270C\uFE0F",name:"Victory Hand",keywords:["peace","two"],group:"people"},{shortcode:"crossed_fingers",emoji:"\u{1F91E}",name:"Crossed Fingers",keywords:["luck","hope"],group:"people"},{shortcode:"muscle",emoji:"\u{1F4AA}",name:"Flexed Biceps",keywords:["strong","power"],group:"people"},{shortcode:"writing_hand",emoji:"\u270D\uFE0F",name:"Writing Hand",keywords:["write","note"],group:"people"},{shortcode:"eyes",emoji:"\u{1F440}",name:"Eyes",keywords:["look","see","watch"],group:"people"},{shortcode:"brain",emoji:"\u{1F9E0}",name:"Brain",keywords:["smart","think","mind"],group:"people"},{shortcode:"speaking_head",emoji:"\u{1F5E3}\uFE0F",name:"Speaking Head",keywords:["talk","announce"],group:"people"},{shortcode:"baby",emoji:"\u{1F476}",name:"Baby",keywords:["child","newborn"],group:"people"},{shortcode:"person_shrugging",emoji:"\u{1F937}",name:"Person Shrugging",keywords:["dunno","whatever"],group:"people"},{shortcode:"person_facepalming",emoji:"\u{1F926}",name:"Person Facepalming",keywords:["frustration","disbelief"],group:"people"},{shortcode:"person_raising_hand",emoji:"\u{1F64B}",name:"Person Raising Hand",keywords:["question","volunteer"],group:"people"},{shortcode:"ninja",emoji:"\u{1F977}",name:"Ninja",keywords:["stealth","hidden"],group:"people"},{shortcode:"dog",emoji:"\u{1F436}",name:"Dog Face",keywords:["puppy","pet"],group:"animals"},{shortcode:"cat",emoji:"\u{1F431}",name:"Cat Face",keywords:["kitten","pet"],group:"animals"},{shortcode:"mouse",emoji:"\u{1F42D}",name:"Mouse Face",keywords:["rodent"],group:"animals"},{shortcode:"rabbit",emoji:"\u{1F430}",name:"Rabbit Face",keywords:["bunny","easter"],group:"animals"},{shortcode:"fox",emoji:"\u{1F98A}",name:"Fox",keywords:["clever","sly"],group:"animals"},{shortcode:"bear",emoji:"\u{1F43B}",name:"Bear",keywords:["teddy","nature"],group:"animals"},{shortcode:"unicorn",emoji:"\u{1F984}",name:"Unicorn",keywords:["magic","fantasy"],group:"animals"},{shortcode:"bee",emoji:"\u{1F41D}",name:"Honeybee",keywords:["honey","buzz"],group:"animals"},{shortcode:"butterfly",emoji:"\u{1F98B}",name:"Butterfly",keywords:["pretty","nature"],group:"animals"},{shortcode:"turtle",emoji:"\u{1F422}",name:"Turtle",keywords:["slow","shell"],group:"animals"},{shortcode:"snake",emoji:"\u{1F40D}",name:"Snake",keywords:["reptile"],group:"animals"},{shortcode:"whale",emoji:"\u{1F433}",name:"Spouting Whale",keywords:["ocean","sea"],group:"animals"},{shortcode:"dolphin",emoji:"\u{1F42C}",name:"Dolphin",keywords:["ocean","smart"],group:"animals"},{shortcode:"eagle",emoji:"\u{1F985}",name:"Eagle",keywords:["bird","freedom"],group:"animals"},{shortcode:"owl",emoji:"\u{1F989}",name:"Owl",keywords:["wise","night"],group:"animals"},{shortcode:"penguin",emoji:"\u{1F427}",name:"Penguin",keywords:["cold","linux"],group:"animals"},{shortcode:"octopus",emoji:"\u{1F419}",name:"Octopus",keywords:["ocean","tentacle"],group:"animals"},{shortcode:"seedling",emoji:"\u{1F331}",name:"Seedling",keywords:["plant","grow"],group:"animals"},{shortcode:"evergreen_tree",emoji:"\u{1F332}",name:"Evergreen Tree",keywords:["nature","pine"],group:"animals"},{shortcode:"sunflower",emoji:"\u{1F33B}",name:"Sunflower",keywords:["flower","yellow"],group:"animals"},{shortcode:"rose",emoji:"\u{1F339}",name:"Rose",keywords:["flower","love"],group:"animals"},{shortcode:"apple",emoji:"\u{1F34E}",name:"Red Apple",keywords:["fruit","healthy"],group:"food"},{shortcode:"banana",emoji:"\u{1F34C}",name:"Banana",keywords:["fruit","yellow"],group:"food"},{shortcode:"grapes",emoji:"\u{1F347}",name:"Grapes",keywords:["fruit","wine"],group:"food"},{shortcode:"watermelon",emoji:"\u{1F349}",name:"Watermelon",keywords:["fruit","summer"],group:"food"},{shortcode:"avocado",emoji:"\u{1F951}",name:"Avocado",keywords:["guacamole","healthy"],group:"food"},{shortcode:"pizza",emoji:"\u{1F355}",name:"Pizza",keywords:["food","italian"],group:"food"},{shortcode:"hamburger",emoji:"\u{1F354}",name:"Hamburger",keywords:["burger","fast food"],group:"food"},{shortcode:"taco",emoji:"\u{1F32E}",name:"Taco",keywords:["mexican","food"],group:"food"},{shortcode:"sushi",emoji:"\u{1F363}",name:"Sushi",keywords:["japanese","fish"],group:"food"},{shortcode:"cookie",emoji:"\u{1F36A}",name:"Cookie",keywords:["sweet","biscuit"],group:"food"},{shortcode:"cake",emoji:"\u{1F382}",name:"Birthday Cake",keywords:["birthday","celebration"],group:"food"},{shortcode:"ice_cream",emoji:"\u{1F366}",name:"Soft Ice Cream",keywords:["dessert","cold"],group:"food"},{shortcode:"chocolate_bar",emoji:"\u{1F36B}",name:"Chocolate Bar",keywords:["sweet","candy"],group:"food"},{shortcode:"popcorn",emoji:"\u{1F37F}",name:"Popcorn",keywords:["movie","snack"],group:"food"},{shortcode:"coffee",emoji:"\u2615",name:"Hot Beverage",keywords:["tea","drink","morning"],group:"food"},{shortcode:"beer",emoji:"\u{1F37A}",name:"Beer Mug",keywords:["drink","bar"],group:"food"},{shortcode:"wine_glass",emoji:"\u{1F377}",name:"Wine Glass",keywords:["drink","alcohol"],group:"food"},{shortcode:"cocktail",emoji:"\u{1F378}",name:"Cocktail Glass",keywords:["drink","martini"],group:"food"},{shortcode:"hot_pepper",emoji:"\u{1F336}\uFE0F",name:"Hot Pepper",keywords:["spicy","chili"],group:"food"},{shortcode:"egg",emoji:"\u{1F95A}",name:"Egg",keywords:["breakfast","food"],group:"food"},{shortcode:"earth_americas",emoji:"\u{1F30E}",name:"Globe Americas",keywords:["world","planet"],group:"travel"},{shortcode:"earth_europe",emoji:"\u{1F30D}",name:"Globe Europe-Africa",keywords:["world","planet"],group:"travel"},{shortcode:"sun",emoji:"\u2600\uFE0F",name:"Sun",keywords:["weather","bright","warm"],group:"travel"},{shortcode:"moon",emoji:"\u{1F319}",name:"Crescent Moon",keywords:["night","sleep"],group:"travel"},{shortcode:"star",emoji:"\u2B50",name:"Star",keywords:["favorite","rating"],group:"travel"},{shortcode:"star2",emoji:"\u{1F31F}",name:"Glowing Star",keywords:["sparkle","shine"],group:"travel"},{shortcode:"cloud",emoji:"\u2601\uFE0F",name:"Cloud",keywords:["weather","sky"],group:"travel"},{shortcode:"rainbow",emoji:"\u{1F308}",name:"Rainbow",keywords:["colorful","weather"],group:"travel"},{shortcode:"snowflake",emoji:"\u2744\uFE0F",name:"Snowflake",keywords:["cold","winter"],group:"travel"},{shortcode:"zap",emoji:"\u26A1",name:"High Voltage",keywords:["lightning","electric","fast"],group:"travel"},{shortcode:"fire",emoji:"\u{1F525}",name:"Fire",keywords:["hot","flame","lit"],group:"travel"},{shortcode:"ocean",emoji:"\u{1F30A}",name:"Water Wave",keywords:["sea","wave","surf"],group:"travel"},{shortcode:"airplane",emoji:"\u2708\uFE0F",name:"Airplane",keywords:["travel","flight"],group:"travel"},{shortcode:"rocket",emoji:"\u{1F680}",name:"Rocket",keywords:["launch","space","fast"],group:"travel"},{shortcode:"car",emoji:"\u{1F697}",name:"Automobile",keywords:["drive","vehicle"],group:"travel"},{shortcode:"house",emoji:"\u{1F3E0}",name:"House",keywords:["home","building"],group:"travel"},{shortcode:"tent",emoji:"\u26FA",name:"Tent",keywords:["camping","outdoor"],group:"travel"},{shortcode:"mountain",emoji:"\u26F0\uFE0F",name:"Mountain",keywords:["nature","hike"],group:"travel"},{shortcode:"desert_island",emoji:"\u{1F3DD}\uFE0F",name:"Desert Island",keywords:["beach","vacation"],group:"travel"},{shortcode:"volcano",emoji:"\u{1F30B}",name:"Volcano",keywords:["eruption","nature"],group:"travel"},{shortcode:"soccer",emoji:"\u26BD",name:"Soccer Ball",keywords:["football","sport"],group:"activities"},{shortcode:"basketball",emoji:"\u{1F3C0}",name:"Basketball",keywords:["sport","hoop"],group:"activities"},{shortcode:"tennis",emoji:"\u{1F3BE}",name:"Tennis",keywords:["sport","ball"],group:"activities"},{shortcode:"video_game",emoji:"\u{1F3AE}",name:"Video Game",keywords:["gaming","controller"],group:"activities"},{shortcode:"dart",emoji:"\u{1F3AF}",name:"Bullseye",keywords:["target","goal"],group:"activities"},{shortcode:"trophy",emoji:"\u{1F3C6}",name:"Trophy",keywords:["winner","champion"],group:"activities"},{shortcode:"medal",emoji:"\u{1F947}",name:"Gold Medal",keywords:["first","winner"],group:"activities"},{shortcode:"tada",emoji:"\u{1F389}",name:"Party Popper",keywords:["celebration","party"],group:"activities"},{shortcode:"confetti_ball",emoji:"\u{1F38A}",name:"Confetti Ball",keywords:["party","celebration"],group:"activities"},{shortcode:"balloon",emoji:"\u{1F388}",name:"Balloon",keywords:["party","birthday"],group:"activities"},{shortcode:"art",emoji:"\u{1F3A8}",name:"Artist Palette",keywords:["paint","creative"],group:"activities"},{shortcode:"musical_note",emoji:"\u{1F3B5}",name:"Musical Note",keywords:["music","song"],group:"activities"},{shortcode:"microphone",emoji:"\u{1F3A4}",name:"Microphone",keywords:["sing","karaoke"],group:"activities"},{shortcode:"guitar",emoji:"\u{1F3B8}",name:"Guitar",keywords:["music","rock"],group:"activities"},{shortcode:"dice",emoji:"\u{1F3B2}",name:"Game Die",keywords:["chance","random"],group:"activities"},{shortcode:"bulb",emoji:"\u{1F4A1}",name:"Light Bulb",keywords:["idea","bright"],group:"objects"},{shortcode:"computer",emoji:"\u{1F4BB}",name:"Laptop",keywords:["tech","work"],group:"objects"},{shortcode:"keyboard",emoji:"\u2328\uFE0F",name:"Keyboard",keywords:["type","computer"],group:"objects"},{shortcode:"phone",emoji:"\u{1F4F1}",name:"Mobile Phone",keywords:["cell","call"],group:"objects"},{shortcode:"camera",emoji:"\u{1F4F7}",name:"Camera",keywords:["photo","picture"],group:"objects"},{shortcode:"tv",emoji:"\u{1F4FA}",name:"Television",keywords:["watch","screen"],group:"objects"},{shortcode:"battery",emoji:"\u{1F50B}",name:"Battery",keywords:["charge","power"],group:"objects"},{shortcode:"electric_plug",emoji:"\u{1F50C}",name:"Electric Plug",keywords:["power","connect"],group:"objects"},{shortcode:"mag",emoji:"\u{1F50D}",name:"Magnifying Glass Left",keywords:["search","find"],group:"objects"},{shortcode:"lock",emoji:"\u{1F512}",name:"Locked",keywords:["security","private"],group:"objects"},{shortcode:"unlock",emoji:"\u{1F513}",name:"Unlocked",keywords:["open","access"],group:"objects"},{shortcode:"key",emoji:"\u{1F511}",name:"Key",keywords:["access","password"],group:"objects"},{shortcode:"hammer",emoji:"\u{1F528}",name:"Hammer",keywords:["tool","build"],group:"objects"},{shortcode:"wrench",emoji:"\u{1F527}",name:"Wrench",keywords:["tool","fix"],group:"objects"},{shortcode:"gear",emoji:"\u2699\uFE0F",name:"Gear",keywords:["settings","config"],group:"objects"},{shortcode:"link",emoji:"\u{1F517}",name:"Link",keywords:["chain","url"],group:"objects"},{shortcode:"paperclip",emoji:"\u{1F4CE}",name:"Paperclip",keywords:["attach","clip"],group:"objects"},{shortcode:"scissors",emoji:"\u2702\uFE0F",name:"Scissors",keywords:["cut","snip"],group:"objects"},{shortcode:"pen",emoji:"\u{1F58A}\uFE0F",name:"Pen",keywords:["write","sign"],group:"objects"},{shortcode:"pencil",emoji:"\u270F\uFE0F",name:"Pencil",keywords:["write","draw"],group:"objects"},{shortcode:"book",emoji:"\u{1F4D6}",name:"Open Book",keywords:["read","study"],group:"objects"},{shortcode:"memo",emoji:"\u{1F4DD}",name:"Memo",keywords:["note","write"],group:"objects"},{shortcode:"package",emoji:"\u{1F4E6}",name:"Package",keywords:["box","delivery"],group:"objects"},{shortcode:"mailbox",emoji:"\u{1F4EC}",name:"Open Mailbox with Raised Flag",keywords:["mail","letter"],group:"objects"},{shortcode:"bell",emoji:"\u{1F514}",name:"Bell",keywords:["notification","alert"],group:"objects"},{shortcode:"red_heart",emoji:"\u2764\uFE0F",name:"Red Heart",keywords:["love","valentine"],group:"symbols"},{shortcode:"orange_heart",emoji:"\u{1F9E1}",name:"Orange Heart",keywords:["love"],group:"symbols"},{shortcode:"yellow_heart",emoji:"\u{1F49B}",name:"Yellow Heart",keywords:["love","friendship"],group:"symbols"},{shortcode:"green_heart",emoji:"\u{1F49A}",name:"Green Heart",keywords:["love","nature"],group:"symbols"},{shortcode:"blue_heart",emoji:"\u{1F499}",name:"Blue Heart",keywords:["love","trust"],group:"symbols"},{shortcode:"purple_heart",emoji:"\u{1F49C}",name:"Purple Heart",keywords:["love"],group:"symbols"},{shortcode:"broken_heart",emoji:"\u{1F494}",name:"Broken Heart",keywords:["sad","breakup"],group:"symbols"},{shortcode:"sparkles",emoji:"\u2728",name:"Sparkles",keywords:["shine","magic","new"],group:"symbols"},{shortcode:"hundred",emoji:"\u{1F4AF}",name:"Hundred Points",keywords:["perfect","score"],group:"symbols"},{shortcode:"boom",emoji:"\u{1F4A5}",name:"Collision",keywords:["explosion","impact"],group:"symbols"},{shortcode:"speech_balloon",emoji:"\u{1F4AC}",name:"Speech Balloon",keywords:["talk","chat","message"],group:"symbols"},{shortcode:"thought_balloon",emoji:"\u{1F4AD}",name:"Thought Balloon",keywords:["think","dream"],group:"symbols"},{shortcode:"check_mark",emoji:"\u2705",name:"Check Mark Button",keywords:["done","yes","complete"],group:"symbols"},{shortcode:"x",emoji:"\u274C",name:"Cross Mark",keywords:["no","wrong","delete"],group:"symbols"},{shortcode:"warning",emoji:"\u26A0\uFE0F",name:"Warning",keywords:["caution","alert"],group:"symbols"},{shortcode:"no_entry",emoji:"\u26D4",name:"No Entry",keywords:["stop","forbidden"],group:"symbols"},{shortcode:"question",emoji:"\u2753",name:"Question Mark",keywords:["help","what"],group:"symbols"},{shortcode:"exclamation",emoji:"\u2757",name:"Exclamation Mark",keywords:["important","attention"],group:"symbols"},{shortcode:"arrow_right",emoji:"\u27A1\uFE0F",name:"Right Arrow",keywords:["next","forward"],group:"symbols"},{shortcode:"arrow_left",emoji:"\u2B05\uFE0F",name:"Left Arrow",keywords:["back","previous"],group:"symbols"},{shortcode:"arrow_up",emoji:"\u2B06\uFE0F",name:"Up Arrow",keywords:["above"],group:"symbols"},{shortcode:"arrow_down",emoji:"\u2B07\uFE0F",name:"Down Arrow",keywords:["below"],group:"symbols"},{shortcode:"recycle",emoji:"\u267B\uFE0F",name:"Recycling Symbol",keywords:["environment","green"],group:"symbols"},{shortcode:"infinity",emoji:"\u267E\uFE0F",name:"Infinity",keywords:["forever","loop"],group:"symbols"},{shortcode:"checkered_flag",emoji:"\u{1F3C1}",name:"Chequered Flag",keywords:["finish","race"],group:"flags"},{shortcode:"triangular_flag",emoji:"\u{1F6A9}",name:"Triangular Flag",keywords:["red flag","warning"],group:"flags"},{shortcode:"white_flag",emoji:"\u{1F3F3}\uFE0F",name:"White Flag",keywords:["surrender","peace"],group:"flags"},{shortcode:"rainbow_flag",emoji:"\u{1F3F3}\uFE0F\u200D\u{1F308}",name:"Rainbow Flag",keywords:["pride","lgbtq"],group:"flags"},{shortcode:"pirate_flag",emoji:"\u{1F3F4}\u200D\u2620\uFE0F",name:"Pirate Flag",keywords:["jolly roger","skull"],group:"flags"},{shortcode:"flag_us",emoji:"\u{1F1FA}\u{1F1F8}",name:"Flag: United States",keywords:["usa","america"],group:"flags"},{shortcode:"flag_gb",emoji:"\u{1F1EC}\u{1F1E7}",name:"Flag: United Kingdom",keywords:["uk","britain"],group:"flags"},{shortcode:"flag_fr",emoji:"\u{1F1EB}\u{1F1F7}",name:"Flag: France",keywords:["french"],group:"flags"},{shortcode:"flag_de",emoji:"\u{1F1E9}\u{1F1EA}",name:"Flag: Germany",keywords:["german"],group:"flags"},{shortcode:"flag_jp",emoji:"\u{1F1EF}\u{1F1F5}",name:"Flag: Japan",keywords:["japanese"],group:"flags"},{shortcode:"flag_kr",emoji:"\u{1F1F0}\u{1F1F7}",name:"Flag: South Korea",keywords:["korean"],group:"flags"},{shortcode:"flag_br",emoji:"\u{1F1E7}\u{1F1F7}",name:"Flag: Brazil",keywords:["brazilian"],group:"flags"},{shortcode:"flag_in",emoji:"\u{1F1EE}\u{1F1F3}",name:"Flag: India",keywords:["indian"],group:"flags"},{shortcode:"flag_ca",emoji:"\u{1F1E8}\u{1F1E6}",name:"Flag: Canada",keywords:["canadian","maple"],group:"flags"},{shortcode:"flag_au",emoji:"\u{1F1E6}\u{1F1FA}",name:"Flag: Australia",keywords:["australian"],group:"flags"}],E=new Map(L.map(s=>[s.shortcode,s])),_t=new Map([["+1","thumbsup"],["-1","thumbsdown"],["heart","red_heart"],["thumbs_up","thumbsup"],["thumbs_down","thumbsdown"],["grin","grinning"],["laughing_crying","joy"],["lol","rofl"],["smiley","smile"],["cool","sunglasses"],["nerd","nerd_face"],["kiss","kissing_heart"],["hug","hugs"],["think","thinking"],["sad","cry"],["mad","angry"],["shrug","person_shrugging"],["facepalm","person_facepalming"],["raised_fist","muscle"],["pray_hands","pray"],["hi","wave"],["bye","wave"],["lightning","zap"],["flame","fire"],["hot","fire"],["bomb","boom"],["idea","bulb"],["laptop","computer"],["search","mag"],["party","tada"],["celebrate","tada"],["congrats","tada"],["check","check_mark"],["done","check_mark"],["yes","check_mark"],["no","x"],["wrong","x"],["love","red_heart"],["star_eyes","star_struck"],["mindblown","exploding_head"],["poop","skull"],["memo_pad","memo"],["notes","memo"],["coffee_cup","coffee"],["tea","coffee"]]),Qt=["smileys","people","animals","food","travel","activities","objects","symbols","flags"],Zt={smileys:"Smileys & Emotion",people:"People & Body",animals:"Animals & Nature",food:"Food & Drink",travel:"Travel & Places",activities:"Activities",objects:"Objects",symbols:"Symbols",flags:"Flags"},te={smileys:"\u{1F600}",people:"\u{1F44B}",animals:"\u{1F436}",food:"\u{1F355}",travel:"\u{1F30D}",activities:"\u{1F389}",objects:"\u{1F4A1}",symbols:"\u2764\uFE0F",flags:"\u{1F3C1}"},M=[];globalThis.__vbEmojiRegister=St;globalThis.__vbEmojiExtended&&(St(globalThis.__vbEmojiExtended),delete globalThis.__vbEmojiExtended)});var Je=window.matchMedia("(prefers-reduced-motion: reduce)");var yt=new Map;function m(s,t,e={}){let i=e.priority??10,r={impl:t,bundle:e.bundle,contract:e.contract,priority:i},o=yt.get(s);if(customElements.get(s)){if(!o||o.priority>=i){o&&o.priority===i&&o.impl!==t&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${s}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=i){o.priority===i&&console.warn(`[VB Bundle] Tag <${s}> already registered by "${o.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}yt.set(s,r),customElements.define(s,t)}var z=class extends HTMLElement{#t=null;#e=null;#i=!1;#a=null;#o=null;#n=null;#s=null;#r=null;#m=null;#c=null;#l=null;#u=null;connectedCallback(){if(this.#t=this.querySelector("audio"),!this.#t)return;this.#e=this.querySelector(".track-list"),this.#t.removeAttribute("controls");let t=!this.shadowRoot;this.#f(),t&&(this.#g(),this.#b(),this.#p()),this.#A(),this.hasAttribute("data-autoplay")&&this.#t.play().catch(()=>{}),this.#u=()=>{let e=this.shadowRoot?.querySelector(".player");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},window.addEventListener("theme-change",this.#u),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&this.#t.setAttribute("controls",""),this.#u&&window.removeEventListener("theme-change",this.#u)}#f(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>${this.#d()}</style>
      <div part="player" class="player">
        <div part="controls" class="controls" role="group" aria-label="Audio controls">
          <button part="play-button" class="play-btn" type="button" aria-label="Play">
            <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
              <path d="M6 19h4V5H6zm8-14v14h4V5z"/>
            </svg>
          </button>
          <div class="timeline-group">
            <div part="track-info" class="track-info">
              <span class="track-title"></span>
              <span class="time-display">
                <time class="current-time">0:00</time>
                <span class="time-sep"> / </span>
                <time class="duration">0:00</time>
              </span>
            </div>
            <div class="timeline-wrap">
              <input part="timeline" type="range" class="timeline"
                     min="0" max="100" value="0" step="0.1"
                     aria-label="Seek">
              <div class="timeline-fill"></div>
            </div>
          </div>
          <div class="volume-wrap">
            <button class="mute-btn" type="button" aria-label="Mute">
              <svg class="icon-vol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <svg class="icon-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
              </svg>
            </button>
            <input part="volume" type="range" class="volume"
                   min="0" max="1" value="1" step="0.01"
                   aria-label="Volume">
          </div>
        </div>
        <slot></slot>
      </div>
    `,this.#a=t.querySelector(".controls"),this.#o=t.querySelector(".play-btn"),this.#n=t.querySelector(".timeline"),this.#s=t.querySelector(".timeline-fill"),this.#r=t.querySelector(".volume"),this.#m=t.querySelector(".current-time"),this.#c=t.querySelector(".duration"),this.#l=t.querySelector(".track-title")}#d(){return`
      :host {
        display: block;
        --_accent: var(--audio-player-accent, var(--color-primary, oklch(55% 0.2 260)));
        --_bg: var(--audio-player-bg, var(--color-surface, #fff));
        --_radius: var(--audio-player-radius, var(--radius-m, 0.5rem));
        --_text: var(--audio-player-text, var(--color-text, inherit));
        --_border: var(--audio-player-border, var(--color-border, #ddd));
        --_shadow: var(--audio-player-shadow, none);
        --_padding: var(--audio-player-padding, var(--size-xs, 0.5rem) var(--size-s, 0.75rem));
      }

      .player {
        background: var(--_bg);
        color: var(--_text);
        border: var(--border-width-thin, 1px) solid var(--_border);
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        overflow: hidden;
      }

      .controls {
        display: flex;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        padding: var(--_padding);
      }

      /* \u2500\u2500 Play button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .play-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        color: var(--color-text-on-primary, white);
        cursor: pointer;
        flex-shrink: 0;
        transition: background-color var(--duration-fast, 100ms) var(--ease-default, ease),
                    transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .play-btn:hover {
        background-color: var(--color-primary-hover, var(--_accent));
        transform: scale(1.05);
      }

      .play-btn:active {
        transform: scale(0.97);
      }

      .play-btn:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
      }

      .icon-pause { display: none; }
      :host([data-state="playing"]) .icon-play { display: none; }
      :host([data-state="playing"]) .icon-pause { display: block; }

      /* \u2500\u2500 Timeline group \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .timeline-group {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--size-3xs, 2px);
      }

      .track-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--size-xs, 0.5rem);
        font-size: var(--text-xs, 0.75rem);
        line-height: 1.2;
      }

      .track-title {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex: 1;
        font-weight: 500;
      }

      .time-display {
        flex-shrink: 0;
        font-family: var(--font-mono, ui-monospace, monospace);
        font-variant-numeric: tabular-nums;
        color: var(--color-text-muted, #666);
      }

      .time-sep { opacity: 0.5; }

      .timeline-wrap {
        position: relative;
        height: 1.25rem;
        display: flex;
        align-items: center;
      }

      .timeline-fill {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 4px;
        background: var(--_accent);
        pointer-events: none;
        border-radius: var(--radius-full, 2px);
        width: 0%;
        transition: width var(--duration-instant, 50ms) linear;
      }

      .timeline {
        width: 100%;
        height: 1.25rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        z-index: 1;
      }

      .timeline::-webkit-slider-runnable-track {
        height: 4px;
        background: var(--_border);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-moz-range-track {
        height: 4px;
        background: var(--_border);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 12px;
        height: 12px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: var(--border-width-medium, 2px) solid var(--_bg);
        box-shadow: var(--shadow-sm, 0 1px 3px oklch(0% 0 0 / 0.2));
        cursor: pointer;
        margin-top: -4px;
        transition: transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .timeline:hover::-webkit-slider-thumb {
        transform: scale(1.2);
      }

      .timeline::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: var(--border-width-medium, 2px) solid var(--_bg);
        box-shadow: var(--shadow-sm, 0 1px 3px oklch(0% 0 0 / 0.2));
        cursor: pointer;
      }

      .timeline::-moz-range-progress {
        height: 4px;
        background: var(--_accent);
        border-radius: var(--radius-full, 2px);
      }

      .timeline:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 4px;
        border-radius: var(--radius-s, 2px);
      }

      /* \u2500\u2500 Volume \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .volume-wrap {
        display: flex;
        align-items: center;
        gap: var(--size-2xs, 4px);
        flex: 0 0 80px;
        min-width: 0;
      }

      .mute-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--color-text-muted, #666);
        flex-shrink: 0;
        transition: color var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .mute-btn:hover {
        color: var(--color-text, inherit);
      }

      .mute-btn:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
        border-radius: var(--radius-s, 2px);
      }

      .icon-muted { display: none; }
      :host([data-muted]) .icon-vol { display: none; }
      :host([data-muted]) .icon-muted { display: block; }

      .volume {
        flex: 1;
        min-width: 0;
        height: 1rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
      }

      .volume::-webkit-slider-runnable-track {
        height: 3px;
        background: linear-gradient(to right,
          var(--_accent) calc(var(--_vol, 1) * 100%),
          var(--_border) calc(var(--_vol, 1) * 100%));
        border-radius: var(--radius-full, 2px);
      }

      .volume::-moz-range-track {
        height: 3px;
        background: var(--_border);
        border-radius: var(--radius-full, 2px);
      }

      .volume::-moz-range-progress {
        height: 3px;
        background: var(--_accent);
        border-radius: var(--radius-full, 2px);
      }

      .volume::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: none;
        cursor: pointer;
        margin-top: -3.5px;
        transition: transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .volume:hover::-webkit-slider-thumb {
        transform: scale(1.3);
      }

      .volume::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: none;
        cursor: pointer;
      }

      .volume:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
        border-radius: var(--radius-s, 2px);
      }

      /* \u2500\u2500 Slot: hide native audio controls \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      ::slotted(audio) {
        display: none !important;
      }

      /* \u2500\u2500 Reduced motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      @media (prefers-reduced-motion: reduce) {
        .play-btn,
        .timeline-fill,
        .timeline::-webkit-slider-thumb,
        .volume::-webkit-slider-thumb,
        .mute-btn {
          transition: none;
        }
        .play-btn:hover,
        .play-btn:active,
        .timeline:hover::-webkit-slider-thumb,
        .volume:hover::-webkit-slider-thumb {
          transform: none;
        }
      }
    `}#g(){this.#t.addEventListener("timeupdate",()=>this.#y()),this.#t.addEventListener("loadedmetadata",()=>this.#w()),this.#t.addEventListener("play",()=>{this.#i=!0,this.setAttribute("data-state","playing"),this.#o.setAttribute("aria-label","Pause"),this.#E("vb:audio:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#i=!1,this.setAttribute("data-state","paused"),this.#o.setAttribute("aria-label","Play"),this.#E("vb:audio:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#i=!1,this.setAttribute("data-state","ended"),this.#o.setAttribute("aria-label","Play");let t=this.#e?.querySelector("li[data-audio-active]");t&&t.setAttribute("data-audio-played",""),this.#e&&this.#v(),this.#E("vb:audio:ended",{src:this.#t.currentSrc})})}#b(){this.#o.addEventListener("click",()=>{this.#i?this.#t.pause():this.#t.play().catch(()=>{})}),this.#n.addEventListener("input",()=>{this.#t.duration&&(this.#t.currentTime=Number(this.#n.value)/100*this.#t.duration)}),this.#r.addEventListener("input",()=>{this.#t.volume=Number(this.#r.value),this.#t.muted=!1,this.removeAttribute("data-muted"),this.#r.style.setProperty("--_vol",this.#r.value)});let t=this.shadowRoot?.querySelector(".mute-btn");t&&(t.addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.toggleAttribute("data-muted",this.#t.muted),this.#r.style.setProperty("--_vol",this.#t.muted?"0":this.#r.value)}),this.addEventListener("keydown",e=>{let i=e.target;if(!(i?.tagName==="INPUT"||i?.tagName==="TEXTAREA"))switch(e.key){case" ":e.preventDefault(),this.#i?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":e.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10);break;case"ArrowRight":e.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10);break;case"m":case"M":this.#t.muted=!this.#t.muted,this.toggleAttribute("data-muted",this.#t.muted),this.#r.style.setProperty("--_vol",this.#t.muted?"0":this.#r.value);break}}),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"))}#p(){this.#e&&this.#e.addEventListener("click",t=>{let i=t.target?.closest("a[href]");i&&(t.preventDefault(),this.#h(i.href,i.closest("li")))})}#h(t,e){if(!this.#e)return;this.#e.querySelectorAll("li").forEach(r=>r.removeAttribute("data-audio-active")),e&&e.setAttribute("data-audio-active",""),this.#t.src=t,this.#t.play().catch(()=>{}),this.#A(),this.#E("vb:audio:track-change",{src:t,title:e?.querySelector("a")?.textContent??""})}#v(){if(!this.#e)return;let t=[...this.#e.querySelectorAll("li")],e=t.findIndex(r=>r.hasAttribute("data-audio-active"));if(this.hasAttribute("data-shuffle")){let r=t.filter((o,a)=>a!==e);if(r.length){let o=r[Math.floor(Math.random()*r.length)],a=o.querySelector("a[href]");a&&this.#h(a.href,o)}return}let i=e+1;if(i<t.length){let r=t[i].querySelector("a[href]");r&&this.#h(r.href,t[i])}else if(this.hasAttribute("data-loop")){let r=t[0]?.querySelector("a[href]");r&&this.#h(r.href,t[0])}}#y(){let t=this.#t.currentTime,e=this.#t.duration||0,i=e?t/e*100:0;this.#m.textContent=this.#C(t),this.#n.value=String(i),this.#s.style.width=`${i}%`}#w(){let t=this.#t.duration||0;this.#c.textContent=this.#C(t)}#A(){if(!this.#l)return;if(this.#e){let e=this.#e.querySelector("li[data-audio-active] a");if(e){this.#l.textContent=e.textContent;return}}let t=this.#t.currentSrc||this.#t.querySelector("source")?.src||"";if(t){let e=t.split("/").pop().split("?")[0];this.#l.textContent=e.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}}#C(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/60),i=Math.floor(t%60).toString().padStart(2,"0");return`${e}:${i}`}#E(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};m("audio-player",z);var O=new Map;function Kt(){if(!O.has("default"))try{O.set("default",new AudioContext)}catch{return null}return O.get("default")}var H=new WeakMap;function Xt(s,t){if(H.has(s))return H.get(s);let e=t.createMediaElementSource(s);return H.set(s,e),e}var U=class extends HTMLElement{#t=null;#e=null;#i=null;#a=null;#o=null;#n=null;#s=null;#r=null;#m=!0;#c=!1;#l=!1;#u=null;static get observedAttributes(){return["for","data-mode","data-fft-size"]}connectedCallback(){this.#l=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let t=!this.shadowRoot;this.#f(),this.#d(),t&&(this.#A(),this.#C()),this.#u=()=>{let e=this.shadowRoot?.querySelector("canvas");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},window.addEventListener("theme-change",this.#u),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#p(),this.#r?.disconnect(),this.#u&&window.removeEventListener("theme-change",this.#u)}attributeChangedCallback(t){t==="for"&&this.#d()}#f(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>
        :host {
          display: block;
          --_color: var(--audio-visualizer-color, var(--color-primary, oklch(55% 0.2 260)));
          --_bg: var(--audio-visualizer-bg, var(--color-surface-sunken, transparent));
          --_height: var(--audio-visualizer-height, 80px);
          --_radius: var(--audio-visualizer-radius, var(--radius-m, 0.5rem));
        }
        canvas {
          display: block;
          width: 100%;
          height: var(--_height);
          background: var(--_bg);
          border-radius: var(--_radius);
        }
      </style>
      <canvas aria-hidden="true"></canvas>
    `,this.#t=t.querySelector("canvas")}#d(){let t=this.getAttribute("for");t&&(this.#i=document.getElementById(t),!(!this.#i||this.#i.tagName!=="AUDIO")&&(this.#c||this.#i.addEventListener("play",()=>this.#g(),{once:!0})))}#g(){if(this.#c||(this.#c=!0,this.#a=Kt(),!this.#a))return;this.#a.state==="suspended"&&this.#a.resume();let t=parseInt(this.getAttribute("data-fft-size")||"256",10);this.#o=this.#a.createAnalyser(),this.#o.fftSize=t,this.#o.smoothingTimeConstant=.8,this.#n=Xt(this.#i,this.#a),this.#n.connect(this.#o),this.#o.connect(this.#a.destination),this.#b()}#b(){if(this.#l)return;let t=()=>{if(!this.#m||this.#l){this.#s=null;return}this.#s=requestAnimationFrame(t),this.#h()};this.#s=requestAnimationFrame(t)}#p(){this.#s&&(cancelAnimationFrame(this.#s),this.#s=null)}#h(){let t=this.#t,e=t.getContext("2d");if(!e)return;let i=t.width=t.offsetWidth*(window.devicePixelRatio||1),r=t.height=t.offsetHeight*(window.devicePixelRatio||1),o=getComputedStyle(this),a=o.getPropertyValue("--_color").trim()||"oklch(55% 0.2 260)",n=o.getPropertyValue("--_bg").trim();if(e.clearRect(0,0,i,r),n&&n!=="transparent"&&(e.fillStyle=n,e.fillRect(0,0,i,r)),!this.#o)return;let l=this.getAttribute("data-mode")||"bars",d=this.#o.frequencyBinCount,c=new Uint8Array(d);l==="waveform"?(this.#o.getByteTimeDomainData(c),this.#y(e,i,r,a,c)):l==="circle"?(this.#o.getByteFrequencyData(c),this.#w(e,i,r,a,c)):(this.#o.getByteFrequencyData(c),this.#v(e,i,r,a,c))}#v(t,e,i,r,o){let a=Math.min(o.length,64),n=e/a-1;t.fillStyle=r;for(let l=0;l<a;l++){let c=o[l]/255*i,h=l*(e/a);t.fillRect(h,i-c,n,c)}}#y(t,e,i,r,o){let a=e/o.length;t.strokeStyle=r,t.lineWidth=2,t.beginPath();for(let n=0;n<o.length;n++){let d=o[n]/128*i/2;n===0?t.moveTo(0,d):t.lineTo(n*a,d)}t.stroke()}#w(t,e,i,r,o){let a=e/2,n=i/2,l=Math.min(e,i)*.25,d=o.length;t.strokeStyle=r,t.lineWidth=2,t.beginPath();for(let c=0;c<d;c++){let h=c/d*Math.PI*2,u=o[c]/255*(l*.8),p=l+u,g=a+p*Math.cos(h),v=n+p*Math.sin(h);c===0?t.moveTo(g,v):t.lineTo(g,v)}t.closePath(),t.stroke()}#A(){this.#r=new IntersectionObserver(([t])=>{this.#m=t.isIntersecting,this.#m&&this.#c&&!this.#s&&!this.#l&&this.#b()}),this.#r.observe(this)}#C(){window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",t=>{this.#l=t.matches,t.matches?this.#p():this.#c&&this.#m&&this.#b()})}};m("audio-visualizer",U);var wt=[.5,.75,1,1.25,1.5,2],Jt=3e3,V=class extends HTMLElement{#t=null;#e=null;#i=!1;#a=null;#o=null;#n=null;#s=null;#r=null;#m=null;#c=null;#l=null;#u=null;#f=null;#d=null;#g=null;#b=null;#p=null;#h=null;#v=2;#y=null;#w=null;connectedCallback(){if(this.#t=this.querySelector("video"),!this.#t)return;this.#e=this.querySelector(".track-list"),this.#t.removeAttribute("controls");let t=!this.shadowRoot;this.#A(),t&&(this.#E(),this.#k(),this.#P(),this.#j()),this.hasAttribute("data-muted")&&(this.#t.muted=!0,this.setAttribute("data-muted","")),this.hasAttribute("data-autoplay")&&this.#t.play().catch(()=>{}),this.#x(),this.#y=()=>{let e=this.shadowRoot?.querySelector(".player");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},window.addEventListener("theme-change",this.#y),this.#w=()=>{let e=!!document.fullscreenElement;this.toggleAttribute("data-fullscreen",e),this.#g.setAttribute("aria-label",e?"Exit fullscreen":"Fullscreen"),this.#L("vb:video:fullscreen",{active:e})},document.addEventListener("fullscreenchange",this.#w),this.setAttribute("data-upgraded",""),this.setAttribute("data-state","idle")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&this.#t.setAttribute("controls",""),this.#y&&window.removeEventListener("theme-change",this.#y),this.#w&&document.removeEventListener("fullscreenchange",this.#w),this.#h!=null&&clearTimeout(this.#h)}#A(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>${this.#C()}</style>
      <div part="player" class="player">
        <slot></slot>
        <button part="play-overlay" class="play-overlay" type="button" aria-label="Play video">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="48" height="48">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <div class="buffer-indicator" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="controls-gradient" aria-hidden="true"></div>
        <div part="controls" class="controls" role="group" aria-label="Video controls">
          <div class="timeline-wrap">
            <input part="timeline" type="range" class="timeline"
                   min="0" max="100" value="0" step="0.1"
                   aria-label="Seek">
            <div class="timeline-buffer"></div>
            <div class="timeline-fill"></div>
          </div>
          <div class="controls-row">
            <button part="play-button" class="play-btn" type="button" aria-label="Play">
              <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M6 19h4V5H6zm8-14v14h4V5z"/>
              </svg>
            </button>
            <button class="skip-back-btn" type="button" aria-label="Skip back 10 seconds">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                <text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" font-family="system-ui">10</text>
              </svg>
            </button>
            <button class="skip-forward-btn" type="button" aria-label="Skip forward 10 seconds">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                <text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="700" fill="currentColor" font-family="system-ui">10</text>
              </svg>
            </button>
            <div class="volume-wrap">
              <button class="mute-btn" type="button" aria-label="Mute">
                <svg class="icon-vol" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <svg class="icon-muted" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
                </svg>
              </button>
              <input part="volume" type="range" class="volume"
                     min="0" max="1" value="1" step="0.01"
                     aria-label="Volume">
            </div>
            <span part="time-display" class="time-display">
              <time class="current-time">0:00</time>
              <span class="time-sep"> / </span>
              <time class="duration">0:00</time>
            </span>
            <span class="spacer"></span>
            <button part="speed-button" class="speed-btn" type="button" aria-label="Playback speed 1x">
              <span aria-live="polite">1x</span>
            </button>
            <button part="captions-button" class="captions-btn" type="button" aria-label="Captions" aria-pressed="false">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/>
              </svg>
            </button>
            <button part="fullscreen-button" class="fullscreen-btn" type="button" aria-label="Fullscreen">
              <svg class="icon-fs-enter" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
              <svg class="icon-fs-exit" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="20" height="20">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="sr-status" role="status" aria-live="polite"></div>
      </div>
    `,this.#a=t.querySelector(".controls"),this.#o=t.querySelector(".play-btn"),this.#n=t.querySelector(".play-overlay"),this.#s=t.querySelector(".timeline"),this.#r=t.querySelector(".timeline-fill"),this.#m=t.querySelector(".timeline-buffer"),this.#c=t.querySelector(".volume"),this.#l=t.querySelector(".current-time"),this.#u=t.querySelector(".duration"),this.#f=t.querySelector(".speed-btn"),this.#d=t.querySelector(".captions-btn"),this.#g=t.querySelector(".fullscreen-btn"),this.#b=t.querySelector(".buffer-indicator"),this.#p=t.querySelector(".sr-status"),this.#t.querySelector('track[kind="captions"], track[kind="subtitles"]')||(this.#d.hidden=!0)}#C(){return`
      :host {
        display: block;
        --_accent: var(--video-player-accent, var(--color-primary, oklch(55% 0.2 260)));
        --_controls-bg: var(--video-player-controls-bg, oklch(0% 0 0 / 0.75));
        --_controls-text: var(--video-player-controls-text, #fff);
        --_radius: var(--video-player-radius, var(--radius-m, 0.5rem));
        --_border: var(--video-player-border, none);
        --_shadow: var(--video-player-shadow, none);
        --_controls-padding: var(--video-player-controls-padding, var(--size-xs, 0.5rem) var(--size-s, 0.75rem));
        --_overlay-bg: var(--video-player-overlay-bg, oklch(0% 0 0 / 0.4));
        --_timeline-height: var(--video-player-timeline-height, 4px);
        --_timeline-buffer: var(--video-player-timeline-buffer, oklch(100% 0 0 / 0.3));
      }

      .player {
        position: relative;
        container-type: normal;
        background: #000;
        border: var(--_border);
        border-radius: var(--_radius);
        box-shadow: var(--_shadow);
        overflow: hidden;
        line-height: 0;
      }

      /* \u2500\u2500 Slotted video \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      ::slotted(video) {
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;  /* fallback before metadata loads; intrinsic ratio overrides once known */
      }

      ::slotted(details) {
        line-height: 1.5;
      }

      /* \u2500\u2500 Play overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .play-overlay {
        all: unset;
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;
        transition: opacity var(--duration-fast, 200ms) var(--ease-default, ease);
      }

      .play-overlay svg {
        background: var(--_overlay-bg);
        border-radius: var(--radius-full, 50%);
        padding: 1rem;
        color: var(--_controls-text);
        transition: transform var(--duration-fast, 150ms) var(--ease-default, ease),
                    background var(--duration-fast, 150ms) var(--ease-default, ease);
      }

      .play-overlay:hover svg {
        transform: scale(1.1);
        background: oklch(0% 0 0 / 0.6);
      }

      .play-overlay:focus-visible svg {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 4px;
      }

      :host([data-state="playing"]) .play-overlay,
      :host([data-state="buffering"]) .play-overlay {
        opacity: 0;
        pointer-events: none;
      }

      :host([data-state="paused"]) .play-overlay {
        opacity: 0;
        pointer-events: none;
      }

      :host([data-state="ended"]) .play-overlay {
        opacity: 1;
        pointer-events: auto;
      }

      /* \u2500\u2500 Buffer indicator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .buffer-indicator {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 1;
        opacity: 0;
        color: var(--_controls-text);
        transition: opacity var(--duration-fast, 200ms) var(--ease-default, ease);
      }

      .buffer-indicator svg {
        animation: vp-spin 1s linear infinite;
      }

      :host([data-state="buffering"]) .buffer-indicator {
        opacity: 1;
      }

      @keyframes vp-spin {
        to { transform: rotate(360deg); }
      }

      /* \u2500\u2500 Controls gradient \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .controls-gradient {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(transparent, oklch(0% 0 0 / 0.7));
        pointer-events: none;
        z-index: 3;
        transition: opacity var(--duration-fast, 300ms) var(--ease-default, ease);
      }

      /* \u2500\u2500 Controls overlay \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 4;
        padding: var(--_controls-padding);
        color: var(--_controls-text);
        line-height: 1.4;
        transition: opacity var(--duration-fast, 300ms) var(--ease-default, ease),
                    visibility var(--duration-fast, 300ms);
      }

      /* Controls hidden state */
      :host([data-state="playing"]:not([data-controls-visible])) .controls,
      :host([data-state="playing"]:not([data-controls-visible])) .controls-gradient {
        opacity: 0;
        visibility: hidden;
      }

      :host([data-state="playing"]:not([data-controls-visible])) {
        cursor: none;
      }

      /* \u2500\u2500 Timeline \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .timeline-wrap {
        position: relative;
        height: 1.25rem;
        display: flex;
        align-items: center;
        margin-block-end: var(--size-3xs, 2px);
      }

      .timeline-fill {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: var(--_timeline-height);
        background: var(--_accent);
        pointer-events: none;
        border-radius: var(--radius-full, 2px);
        width: 0%;
        z-index: 2;
        transition: width var(--duration-instant, 50ms) linear;
      }

      .timeline-buffer {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: var(--_timeline-height);
        background: var(--_timeline-buffer);
        pointer-events: none;
        border-radius: var(--radius-full, 2px);
        width: 0%;
        z-index: 1;
      }

      .timeline {
        width: 100%;
        height: 1.25rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
        position: relative;
        z-index: 3;
      }

      .timeline::-webkit-slider-runnable-track {
        height: var(--_timeline-height);
        background: oklch(100% 0 0 / 0.2);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-moz-range-track {
        height: var(--_timeline-height);
        background: oklch(100% 0 0 / 0.2);
        border-radius: var(--radius-full, 2px);
      }

      .timeline::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: 2px solid var(--_controls-text);
        cursor: pointer;
        margin-top: -5px;
        transition: transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .timeline:hover::-webkit-slider-thumb {
        transform: scale(1.3);
      }

      .timeline::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: var(--radius-full, 50%);
        background: var(--_accent);
        border: 2px solid var(--_controls-text);
        cursor: pointer;
      }

      .timeline:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 4px;
        border-radius: var(--radius-s, 2px);
      }

      /* \u2500\u2500 Controls row \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .controls-row {
        display: flex;
        align-items: center;
        gap: var(--size-2xs, 4px);
      }

      .spacer { flex: 1; }

      /* \u2500\u2500 Shared button reset \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .controls-row button {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: var(--radius-s, 4px);
        cursor: pointer;
        color: var(--_controls-text);
        transition: background var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .controls-row button:hover {
        background: oklch(100% 0 0 / 0.15);
      }

      .controls-row button:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
      }

      /* \u2500\u2500 Play button (controls row) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-pause { display: none; }
      :host([data-state="playing"]) .icon-play { display: none; }
      :host([data-state="playing"]) .icon-pause { display: block; }

      /* \u2500\u2500 Fullscreen icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-fs-exit { display: none; }
      :host([data-fullscreen]) .icon-fs-enter { display: none; }
      :host([data-fullscreen]) .icon-fs-exit { display: block; }

      /* \u2500\u2500 Mute icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-muted { display: none; }
      :host([data-muted]) .icon-vol { display: none; }
      :host([data-muted]) .icon-muted { display: block; }

      /* \u2500\u2500 Volume \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .volume-wrap {
        display: flex;
        align-items: center;
        gap: 0;
        flex: 0 0 auto;
      }

      .volume {
        width: 60px;
        height: 1rem;
        appearance: none;
        background: transparent;
        cursor: pointer;
      }

      .volume::-webkit-slider-runnable-track {
        height: 3px;
        background: linear-gradient(to right,
          var(--_accent) calc(var(--_vol, 1) * 100%),
          oklch(100% 0 0 / 0.3) calc(var(--_vol, 1) * 100%));
        border-radius: var(--radius-full, 2px);
      }

      .volume::-moz-range-track {
        height: 3px;
        background: oklch(100% 0 0 / 0.3);
        border-radius: var(--radius-full, 2px);
      }

      .volume::-moz-range-progress {
        height: 3px;
        background: var(--_accent);
        border-radius: var(--radius-full, 2px);
      }

      .volume::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full, 50%);
        background: var(--_controls-text);
        border: none;
        cursor: pointer;
        margin-top: -3.5px;
        transition: transform var(--duration-fast, 100ms) var(--ease-default, ease);
      }

      .volume:hover::-webkit-slider-thumb {
        transform: scale(1.3);
      }

      .volume::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: var(--radius-full, 50%);
        background: var(--_controls-text);
        border: none;
        cursor: pointer;
      }

      .volume:focus-visible {
        outline: var(--focus-ring-width, 2px) solid var(--color-focus-ring, var(--_accent));
        outline-offset: 2px;
        border-radius: var(--radius-s, 2px);
      }

      /* \u2500\u2500 Time display \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .time-display {
        font-size: var(--text-xs, 0.75rem);
        font-family: var(--font-mono, ui-monospace, monospace);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        padding-inline: var(--size-2xs, 4px);
      }

      .time-sep { opacity: 0.6; }

      /* \u2500\u2500 Speed button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .speed-btn {
        font-size: var(--text-xs, 0.75rem);
        font-weight: 600;
        min-width: 2.5rem;
        width: auto !important;
      }

      /* \u2500\u2500 Captions button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      :host([data-captions-active]) .captions-btn {
        background: oklch(100% 0 0 / 0.2);
      }

      .captions-btn[hidden] { display: none; }

      /* \u2500\u2500 Screen reader only \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .sr-status {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* \u2500\u2500 Reduced motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      @media (prefers-reduced-motion: reduce) {
        .play-overlay svg,
        .buffer-indicator svg,
        .controls,
        .controls-gradient,
        .timeline-fill,
        .timeline::-webkit-slider-thumb,
        .volume::-webkit-slider-thumb,
        .controls-row button {
          transition: none;
        }

        .buffer-indicator svg {
          animation: none;
        }

        .play-overlay:hover svg,
        .timeline:hover::-webkit-slider-thumb,
        .volume:hover::-webkit-slider-thumb {
          transform: none;
        }

        /* Keep controls permanently visible */
        :host([data-state="playing"]:not([data-controls-visible])) .controls,
        :host([data-state="playing"]:not([data-controls-visible])) .controls-gradient {
          opacity: 1;
          visibility: visible;
        }

        :host([data-state="playing"]:not([data-controls-visible])) {
          cursor: auto;
        }
      }
    `}#E(){this.#t.addEventListener("timeupdate",()=>this.#S()),this.#t.addEventListener("loadedmetadata",()=>this.#T()),this.#t.addEventListener("progress",()=>this.#$()),this.#t.addEventListener("play",()=>{this.#i=!0,this.setAttribute("data-state","playing"),this.#o.setAttribute("aria-label","Pause"),this.#N("Playing"),this.#L("vb:video:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#i=!1,this.setAttribute("data-state","paused"),this.#o.setAttribute("aria-label","Play"),this.#x(),this.#N("Paused"),this.#L("vb:video:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#i=!1,this.setAttribute("data-state","ended"),this.#o.setAttribute("aria-label","Play"),this.#x();let t=this.#e?.querySelector("li[data-video-active]");t&&t.setAttribute("data-video-played",""),this.#e&&this.#F(),this.#N("Ended"),this.#L("vb:video:ended",{src:this.#t.currentSrc})}),this.#t.addEventListener("waiting",()=>{this.#i&&(this.setAttribute("data-state","buffering"),this.#N("Buffering"))}),this.#t.addEventListener("playing",()=>{this.getAttribute("data-state")==="buffering"&&this.setAttribute("data-state","playing")})}#k(){this.#n.addEventListener("click",o=>{o.stopPropagation(),this.#t.play().catch(()=>{})}),(this.shadowRoot?.querySelector(".player")).addEventListener("click",o=>{o.target.closest(".controls")||o.target.closest(".play-overlay")||(this.#i?this.#t.pause():this.#t.play().catch(()=>{}))}),this.#o.addEventListener("click",()=>{this.#i?this.#t.pause():this.#t.play().catch(()=>{})}),this.#s.addEventListener("input",()=>{this.#t.duration&&(this.#t.currentTime=Number(this.#s.value)/100*this.#t.duration)}),(this.shadowRoot?.querySelector(".skip-back-btn")).addEventListener("click",()=>{this.#t.currentTime=Math.max(0,this.#t.currentTime-10)}),(this.shadowRoot?.querySelector(".skip-forward-btn")).addEventListener("click",()=>{this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10)}),this.#c.addEventListener("input",()=>{this.#t.volume=Number(this.#c.value),this.#t.muted=!1,this.removeAttribute("data-muted"),this.#c.style.setProperty("--_vol",this.#c.value)}),(this.shadowRoot?.querySelector(".mute-btn")).addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.toggleAttribute("data-muted",this.#t.muted),this.#c.style.setProperty("--_vol",this.#t.muted?"0":this.#c.value)}),this.#f.addEventListener("click",()=>{this.#v=(this.#v+1)%wt.length;let o=wt[this.#v];this.#t.playbackRate=o;let a=this.#f.querySelector("span");a.textContent=`${o}x`,this.#f.setAttribute("aria-label",`Playback speed ${o}x`),this.#L("vb:video:speed",{rate:o})}),this.#d.addEventListener("click",()=>{let o=this.#q();if(!o)return;let a=o.mode==="showing";o.mode=a?"hidden":"showing";let n=!a;this.toggleAttribute("data-captions-active",n),this.#d.setAttribute("aria-pressed",String(n)),this.#L("vb:video:captions",{active:n,label:o.label})}),this.#g.addEventListener("click",()=>this.#I()),this.addEventListener("keydown",o=>this.#B(o)),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0")}#j(){let t=this.shadowRoot?.querySelector(".player"),e=()=>{this.#x(),this.#h!=null&&clearTimeout(this.#h),this.#i&&(this.#h=setTimeout(()=>this.#_(),Jt))};t.addEventListener("mousemove",e),t.addEventListener("mouseenter",e),t.addEventListener("mouseleave",()=>{this.#i&&(this.#h!=null&&clearTimeout(this.#h),this.#h=setTimeout(()=>this.#_(),500))}),t.addEventListener("touchstart",()=>{this.hasAttribute("data-controls-visible")?this.#_():e()},{passive:!0}),this.#a.addEventListener("mouseenter",()=>{this.#h!=null&&clearTimeout(this.#h),this.#x()}),this.#a.addEventListener("focusin",()=>{this.#h!=null&&clearTimeout(this.#h),this.#x()})}#x(){this.setAttribute("data-controls-visible","")}#_(){this.removeAttribute("data-controls-visible")}#P(){this.#e&&this.#e.addEventListener("click",t=>{let e=t.target.closest("a[href]");e&&(t.preventDefault(),this.#M(e.href,e.closest("li"),e))})}#M(t,e,i){this.#e.querySelectorAll("li").forEach(n=>n.removeAttribute("data-video-active")),e&&e.setAttribute("data-video-active",""),this.#t.src=t;let o=i?.getAttribute("data-poster");o&&(this.#t.poster=o);let a=i?.getAttribute("data-captions");this.#D(a),this.#t.play().catch(()=>{}),this.#L("vb:video:track-change",{src:t,title:i?.textContent??""})}#D(t){if(this.#t.querySelectorAll("track[data-dynamic]").forEach(r=>r.remove()),t){let r=document.createElement("track");r.kind="captions",r.src=t,r.default=!0,r.setAttribute("data-dynamic",""),this.#t.appendChild(r),this.hasAttribute("data-captions-active")&&(r.track.mode="showing")}let i=this.#t.querySelector('track[kind="captions"], track[kind="subtitles"]');this.#d.hidden=!i}#F(){if(!this.#e)return;let t=[...this.#e.querySelectorAll("li")],e=t.findIndex(r=>r.hasAttribute("data-video-active"));if(this.hasAttribute("data-shuffle")){let r=t.filter((o,a)=>a!==e);if(r.length){let o=r[Math.floor(Math.random()*r.length)],a=o.querySelector("a[href]");a&&this.#M(a.href,o,a)}return}let i=e+1;if(i<t.length){let r=t[i].querySelector("a[href]");r&&this.#M(r.href,t[i],r)}else if(this.hasAttribute("data-loop")){let r=t[0]?.querySelector("a[href]");r&&this.#M(r.href,t[0],r)}}#S(){let t=this.#t.currentTime,e=this.#t.duration||0,i=e?t/e*100:0;this.#l.textContent=this.#R(t),this.#s.value=String(i),this.#s.setAttribute("aria-valuetext",this.#z(t)),this.#r.style.width=`${i}%`}#T(){let t=this.#t.duration||0;this.#u.textContent=this.#R(t)}#$(){let t=this.#t.buffered,e=this.#t.duration||0;if(t.length>0&&e){let i=t.end(t.length-1);this.#m.style.width=`${i/e*100}%`}}#I(){document.fullscreenElement?document.exitFullscreen():this.requestFullscreen().catch(()=>{this.#t.requestFullscreen?.().catch(()=>{})})}#q(){let t=this.#t.textTracks;for(let e=0;e<t.length;e++)if(t[e].kind==="captions"||t[e].kind==="subtitles")return t[e];return null}#B(t){if(!(t.target.tagName==="INPUT"||t.target.tagName==="TEXTAREA"))switch(t.key){case" ":case"k":case"K":t.preventDefault(),this.#i?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":t.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10),this.#x();break;case"ArrowRight":t.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10),this.#x();break;case"ArrowUp":t.preventDefault(),this.#t.volume=Math.min(1,this.#t.volume+.05),this.#c.value=String(this.#t.volume),this.#c.style.setProperty("--_vol",String(this.#t.volume)),this.#x();break;case"ArrowDown":t.preventDefault(),this.#t.volume=Math.max(0,this.#t.volume-.05),this.#c.value=String(this.#t.volume),this.#c.style.setProperty("--_vol",String(this.#t.volume)),this.#x();break;case"m":case"M":this.#t.muted=!this.#t.muted,this.toggleAttribute("data-muted",this.#t.muted),this.#c.style.setProperty("--_vol",this.#t.muted?"0":this.#c.value);break;case"f":case"F":this.#I();break;case"c":case"C":this.#d.click();break;case"Escape":document.fullscreenElement&&document.exitFullscreen();break}}#R(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/3600),i=Math.floor(t%3600/60),r=Math.floor(t%60);return e>0?`${e}:${String(i).padStart(2,"0")}:${String(r).padStart(2,"0")}`:`${i}:${String(r).padStart(2,"0")}`}#z(t){if(!Number.isFinite(t))return"0 seconds";let e=Math.floor(t/3600),i=Math.floor(t%3600/60),r=Math.floor(t%60),o=[];return e>0&&o.push(`${e} hour${e!==1?"s":""}`),i>0&&o.push(`${i} minute${i!==1?"s":""}`),o.push(`${r} second${r!==1?"s":""}`),o.join(" ")}#N(t){this.#p&&(this.#p.textContent=t)}#L(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};m("video-player",V);var kt=`
:host {
  display: block;
  position: relative;
  overflow: hidden;
  height: var(--geo-map-height, 300px);
  border-radius: var(--geo-map-border-radius, 0.5rem);
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
  color-scheme: light dark;
}

[part="container"] {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Tile grid */
[part="tiles"] {
  position: absolute;
  display: grid;
  grid-template-columns: repeat(3, 256px);
  grid-template-rows: repeat(3, 256px);
}

[part="tiles"] img {
  display: block;
  width: 256px;
  height: 256px;
  -webkit-user-drag: none;
  user-select: none;
}

/* Marker */
[part="marker"] {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--geo-map-marker-size, 32px);
  height: var(--geo-map-marker-size, 32px);
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  pointer-events: none;
  z-index: 2;
}

/* Caption (slot projection) */
[part="caption"] {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--geo-map-caption-bg, rgba(255, 255, 255, 0.9));
  padding: var(--geo-map-caption-padding, 0.5rem 0.75rem);
  font-size: 0.875rem;
  z-index: 3;
}

[part="caption"]:empty,
[part="caption"]:not(:has(*)) {
  display: none;
}

@media (prefers-color-scheme: dark) {
  [part="caption"] {
    background: var(--geo-map-caption-bg, rgba(0, 0, 0, 0.75));
    color: #e0e0e0;
  }
}

/* Attribution */
[part="attribution"] {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 2px 5px;
  font-size: var(--geo-map-attribution-font-size, 0.625rem);
  background: rgba(255, 255, 255, 0.7);
  color: #333;
  z-index: 4;
  line-height: 1.4;
}

[part="attribution"] a {
  color: inherit;
  text-decoration: none;
}

[part="attribution"] a:hover {
  text-decoration: underline;
}

/* When caption is present, shift attribution above it */
:host([data-has-caption]) [part="attribution"] {
  bottom: auto;
  top: 0;
}

/* Overlay \u2014 full surface, appears on hover/focus */
[part="overlay"] {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--geo-map-overlay-bg, rgba(0, 0, 0, 0.35));
  color: var(--geo-map-overlay-color, #fff);
  opacity: 0;
  transition: opacity 0.2s ease;
}

[part="overlay"]:hover,
[part="overlay"]:focus-within {
  opacity: 1;
}

/* Activate button inside overlay */
[part="activate"] {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

[part="activate"]:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 4px;
}

/* Interactive mode \u2014 tiles become absolutely positioned for panning */
:host([data-interactive-active]) [part="tiles"] {
  display: block;
  cursor: grab;
  touch-action: none;
}

:host([data-interactive-active]) [part="tiles"] img {
  position: absolute;
}

:host([data-interactive-active]) [part="tiles"][data-dragging] {
  cursor: grabbing;
}

:host([data-interactive-active]) [part="overlay"] {
  display: none;
}

/* Static-only \u2014 hide overlay entirely */
:host([static-only]) [part="overlay"] {
  display: none;
}

/* Reduced motion \u2014 disable transitions */
@media (prefers-reduced-motion: reduce) {
  [part="overlay"] {
    transition: none;
  }
}

/* Error state */
[part="container"][data-state="error"] [part="tiles"] {
  display: none;
}

[part="container"][data-state="error"]::after {
  content: attr(data-error);
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.875rem;
  text-align: center;
  padding: 1rem;
}
`;G();function Yt(s){return`<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${s}"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`}var K=class extends HTMLElement{static get observedAttributes(){return["lat","lng","zoom","marker","marker-color","provider","interactive","static-only","src","place"]}#t=null;#e=!1;constructor(){super(),this.attachShadow({mode:"open"})}get lat(){return parseFloat(this.getAttribute("lat")??"")}get lng(){return parseFloat(this.getAttribute("lng")??"")}get zoom(){let t=parseInt(this.getAttribute("zoom")??"",10);return t>=1&&t<=19?t:15}get showMarker(){return this.getAttribute("marker")!=="false"}get markerColor(){return this.getAttribute("marker-color")||"#e74c3c"}get provider(){return this.getAttribute("provider")||"osm"}get interactive(){let t=this.getAttribute("interactive");return t==="eager"||t==="none"?t:"click"}get staticOnly(){return this.hasAttribute("static-only")}#i(){let t=parseFloat(this.getAttribute("lat")??""),e=parseFloat(this.getAttribute("lng")??"");if(!isNaN(t)&&!isNaN(e))return{lat:t,lng:e};let i=this.getAttribute("src");if(i){let n=this.#a(i);if(n)return n}let r=this.querySelector("address[data-lat][data-lng]");if(r){let n=parseFloat(r.dataset.lat??""),l=parseFloat(r.dataset.lng??"");if(!isNaN(n)&&!isNaN(l))return{lat:n,lng:l}}let o=this.getAttribute("place");if(o){let n=this.#o(o);if(n)return n}let a=document.querySelector('meta[name="geo.position"]');if(a){let l=(a.getAttribute("content")||"").split(";");if(l.length===2){let d=parseFloat(l[0]),c=parseFloat(l[1]);if(!isNaN(d)&&!isNaN(c))return{lat:d,lng:c}}}return null}#a(t){let e=document.getElementById(t);if(!e)return null;if(e.tagName==="ADDRESS"&&e.dataset.lat&&e.dataset.lng){let i=parseFloat(e.dataset.lat),r=parseFloat(e.dataset.lng);if(!isNaN(i)&&!isNaN(r))return{lat:i,lng:r}}return e.tagName==="SCRIPT"&&e.type==="application/ld+json"?this.#n(e):null}#o(t){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let i of e)try{let r=JSON.parse(i.textContent);if(r.name===t){let o=r.geo;if(o){let a=parseFloat(o.latitude),n=parseFloat(o.longitude);if(!isNaN(a)&&!isNaN(n))return{lat:a,lng:n}}}}catch{}return null}#n(t){try{let i=JSON.parse(t.textContent).geo;if(i){let r=parseFloat(i.latitude),o=parseFloat(i.longitude);if(!isNaN(r)&&!isNaN(o))return{lat:r,lng:o}}}catch{}return null}connectedCallback(){this.render(),this.loadTiles(),this.#s(),this.setAttribute("data-upgraded","")}attributeChangedCallback(t,e,i){e!==i&&this.isConnected&&(this.#t&&this.#c(),this.render(),this.loadTiles(),this.#s())}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.destroy(),this.#t=null)}render(){let t=this.#i(),e=t?.lat??NaN,i=t?.lng??NaN,r=!isNaN(e)&&!isNaN(i);this.children.length>0?this.setAttribute("data-has-caption",""):this.removeAttribute("data-has-caption");let a=r?`Map of ${e.toFixed(4)}, ${i.toFixed(4)}`:"Map",n=this.showMarker&&r?`<div part="marker" aria-hidden="true">${Yt(this.markerColor)}</div>`:"",d=r&&this.interactive!=="none"&&!this.staticOnly?'<div part="overlay"><button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button></div>':"";this.shadowRoot.innerHTML=`
            <style>${kt}</style>
            <div part="container">
                <div part="tiles" role="img" aria-label="${a}"></div>
                ${n}
                ${d}
                <div part="caption"><slot></slot></div>
                <div part="attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap</a>
                </div>
            </div>
        `}loadTiles(){let t=this.#i(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i)){this.handleError("Missing or invalid lat/lng coordinates");return}let r=this.zoom,o=this.provider,{tileX:a,tileY:n,pixelX:l,pixelY:d}=xt(e,i,r),c=this.shadowRoot.querySelector('[part="tiles"]');if(!c)return;c.innerHTML="";let h=this,u=h.offsetWidth||400,p=h.offsetHeight||300,g=Math.round(u/2-256-l),v=Math.round(p/2-256-d);c.style.transform=`translate(${g}px, ${v}px)`;let I=0,S=0,R=9;for(let $=-1;$<=1;$++)for(let q=-1;q<=1;q++){let Ut=a+q,Vt=n+$,Gt=j(o,r,Ut,Vt),w=document.createElement("img");w.src=Gt,w.alt="",w.loading="lazy",w.draggable=!1,w.addEventListener("load",()=>{I++,I+S===R&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:r}}))}),w.addEventListener("error",()=>{S++,S===R?this.handleError("Failed to load map tiles"):I+S===R&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:r}}))}),c.appendChild(w)}}#s(){let t=this.shadowRoot.querySelector('[part="overlay"]');if(!t)return;let e=t.querySelector('[part="activate"]');t.addEventListener("mouseenter",()=>this.#r(),{once:!0}),e&&e.addEventListener("focus",()=>this.#r(),{once:!0}),e&&e.addEventListener("click",()=>this.#m()),this.interactive==="eager"&&requestAnimationFrame(()=>this.#m())}#r(){if(this.#e)return;this.#e=!0;let t=this.provider,e;t==="carto-light"||t==="carto-dark"?e="https://basemaps.cartocdn.com":e="https://tile.openstreetmap.org";let i=document.createElement("link");i.rel="preconnect",i.href=e,i.crossOrigin="",document.head.appendChild(i)}async#m(){if(this.#t)return;let t=this.#i(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i))return;let{MapInteraction:r}=await Promise.resolve().then(()=>(Ct(),At));this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.focus(),this.setAttribute("data-interactive-active",""),this.#t=new r({shadow:this.shadowRoot,host:this,lat:e,lng:i,zoom:this.zoom,provider:this.provider,onDeactivate:()=>this.#c()}),this.dispatchEvent(new CustomEvent("geo-map:activate",{bubbles:!0,detail:{lat:e,lng:i,zoom:this.zoom}}))}#c(){this.#t&&(this.#t.destroy(),this.#t=null,this.removeAttribute("data-interactive-active"),this.render(),this.loadTiles(),this.#s())}handleError(t){let e=this.shadowRoot.querySelector('[part="container"]');e&&(e.setAttribute("data-state","error"),e.setAttribute("data-error",t)),this.dispatchEvent(new CustomEvent("geo-map:error",{bubbles:!0,detail:{message:t}}))}};m("geo-map",K);var T=null;async function re(){return T||(T=await Promise.resolve().then(()=>(J(),X)),T)}var Y=8,oe=150,jt="vb-emoji-recent",Q=class extends HTMLElement{#t;#e;#i;#a;#o;#n=!1;#s=[];#r=-1;#m=null;#c="";#l=null;async connectedCallback(){this.#l=await re(),this.#u(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#f()}#u(){this.#t=this.querySelector(":scope > [data-trigger]"),this.#t||(this.#t=this.querySelector(":scope > button")),this.#t||(this.#t=document.createElement("button"),this.#t.type="button",this.#t.textContent="\u{1F600}",this.#t.setAttribute("data-trigger",""),this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false"),this.#t.setAttribute("aria-label",this.#t.getAttribute("aria-label")||"Open emoji picker"),this.#d(),this.#t.addEventListener("click",this.#p),document.addEventListener("click",this.#h),document.addEventListener("keydown",this.#v)}#f(){this.#m&&clearTimeout(this.#m),this.#t?.removeEventListener("click",this.#p),document.removeEventListener("click",this.#h),document.removeEventListener("keydown",this.#v)}#d(){this.#e=document.createElement("div"),this.#e.classList.add("picker"),this.#e.setAttribute("role","dialog"),this.#e.setAttribute("aria-label","Emoji picker"),this.#e.hidden=!0,this.#i=document.createElement("input"),this.#i.type="search",this.#i.placeholder="Search emoji\u2026",this.#i.setAttribute("aria-label","Search emoji"),this.#i.addEventListener("input",this.#y),this.#i.addEventListener("keydown",this.#w),this.#e.appendChild(this.#i),this.#o=document.createElement("nav"),this.#o.classList.add("categories"),this.#o.setAttribute("role","tablist"),this.#o.setAttribute("aria-label","Emoji categories");for(let t of this.#l.EMOJI_GROUPS){let e=document.createElement("button");e.type="button",e.setAttribute("role","tab"),e.setAttribute("aria-selected",t===this.#l.EMOJI_GROUPS[0]?"true":"false"),e.setAttribute("data-group",t),e.setAttribute("aria-label",this.#l.EMOJI_GROUP_LABELS[t]),e.title=this.#l.EMOJI_GROUP_LABELS[t],e.textContent=this.#l.EMOJI_GROUP_ICONS[t],e.addEventListener("click",this.#A),this.#o.appendChild(e)}this.#e.appendChild(this.#o),this.#a=document.createElement("div"),this.#a.classList.add("grid"),this.#a.setAttribute("role","grid"),this.#a.setAttribute("aria-label","Emoji"),this.#a.addEventListener("keydown",this.#C),this.#e.appendChild(this.#a),this.appendChild(this.#e),this.#g()}#g(t=null){this.#a.innerHTML="",this.#s=[],this.#r=-1;let e=this.#x();if(!this.#c&&e.length>0){let r=document.createElement("div");r.classList.add("group-label"),r.textContent="Recently Used",r.setAttribute("data-group-heading","recent"),this.#a.appendChild(r);for(let o of e){let a=this.#l.EMOJI_MAP.get(o);a&&this.#b(a)}}let i=t||null;if(i)if(i.length===0){let r=document.createElement("div");r.classList.add("no-results"),r.textContent="No emoji found",this.#a.appendChild(r)}else for(let r of i)this.#b(r);else for(let r of this.#l.EMOJI_GROUPS){let o=document.createElement("div");o.classList.add("group-label"),o.textContent=this.#l.EMOJI_GROUP_LABELS[r],o.setAttribute("data-group-heading",r),this.#a.appendChild(o);let a=this.#l.getByGroup(r);for(let n of a)this.#b(n)}}#b(t){let e=document.createElement("button");e.type="button",e.setAttribute("role","gridcell"),e.setAttribute("tabindex","-1"),e.setAttribute("data-shortcode",t.shortcode),e.title=`${t.name} :${t.shortcode}:`,e.textContent=t.emoji,e.addEventListener("click",this.#E),this.#a.appendChild(e),this.#s.push(e)}#p=t=>{t.stopPropagation(),this.toggle()};#h=t=>{this.#n&&!this.contains(t.target)&&this.close()};#v=t=>{t.key==="Escape"&&this.#n&&(t.preventDefault(),this.close(),this.#t?.focus())};#y=()=>{this.#m&&clearTimeout(this.#m),this.#m=setTimeout(()=>{if(this.#c=this.#i.value.trim(),this.#c){let t=this.#l.searchEmoji(this.#c);this.#g(t)}else this.#g()},oe)};#w=t=>{t.key==="ArrowDown"&&(t.preventDefault(),this.#s.length>0&&this.#k(0))};#A=t=>{let e=t.currentTarget.getAttribute("data-group");for(let r of this.#o.querySelectorAll('[role="tab"]'))r.setAttribute("aria-selected",r===t.currentTarget?"true":"false");this.#c&&(this.#i.value="",this.#c="",this.#g());let i=this.#a.querySelector(`[data-group-heading="${e}"]`);i&&i.scrollIntoView({block:"start",behavior:"smooth"})};#C=t=>{let e=this.#s.length;if(e!==0)switch(t.key){case"ArrowRight":t.preventDefault(),this.#k(this.#r+1);break;case"ArrowLeft":t.preventDefault(),this.#k(this.#r-1);break;case"ArrowDown":t.preventDefault(),this.#k(this.#r+Y);break;case"ArrowUp":t.preventDefault(),this.#r<Y?(this.#i.focus(),this.#r=-1):this.#k(this.#r-Y);break;case"Home":t.preventDefault(),this.#k(0);break;case"End":t.preventDefault(),this.#k(e-1);break;case"Enter":case" ":t.preventDefault(),this.#r>=0&&this.#s[this.#r].click();break;case"Tab":this.close();break}};#E=t=>{let e=t.currentTarget.getAttribute("data-shortcode"),i=this.#l.EMOJI_MAP.get(e);i&&(this.#_(e),this.#j(i),this.dispatchEvent(new CustomEvent("emoji-picker:select",{bubbles:!0,detail:{shortcode:i.shortcode,emoji:i.emoji,name:i.name,keywords:i.keywords}})))};#k(t){let e=this.#s.length;e!==0&&(t<0&&(t=0),t>=e&&(t=e-1),this.#r=t,this.#s[t].focus())}#j(t){let e=this.getAttribute("for");if(!e)return;let i=document.getElementById(e);if(i){if(i.tagName==="INPUT"||i.tagName==="TEXTAREA"){let r=i,o=r.selectionStart??r.value.length,a=r.selectionEnd??o,n=r.value.slice(0,o),l=r.value.slice(a);r.value=n+t.emoji+l;let d=o+t.emoji.length;r.setSelectionRange(d,d),i.dispatchEvent(new Event("input",{bubbles:!0})),i.focus()}else if(i.isContentEditable){i.focus();let r=window.getSelection();if(r&&r.rangeCount>0){let o=r.getRangeAt(0);o.deleteContents(),o.insertNode(document.createTextNode(t.emoji)),o.collapse(!1)}}}}#x(){try{return JSON.parse(localStorage.getItem(jt)||"[]")}catch{return[]}}#_(t){let e=parseInt(this.getAttribute("recent-limit")??"24",10)||24,i=this.#x();i=i.filter(r=>r!==t),i.unshift(t),i.length>e&&(i.length=e);try{localStorage.setItem(jt,JSON.stringify(i))}catch{}}open(){this.#n||(this.#n=!0,this.setAttribute("data-open",""),this.#t?.setAttribute("aria-expanded","true"),this.#e.hidden=!1,this.#i.value="",this.#c="",this.#g(),requestAnimationFrame(()=>{this.#i.focus()}),this.dispatchEvent(new CustomEvent("emoji-picker:open",{bubbles:!0})))}close(){this.#n&&(this.#n=!1,this.removeAttribute("data-open"),this.#t?.setAttribute("aria-expanded","false"),this.#e.hidden=!0,this.dispatchEvent(new CustomEvent("emoji-picker:close",{bubbles:!0})))}toggle(){this.#n?this.close():this.open()}get isOpen(){return this.#n}};m("emoji-picker",Q);var Z=class s extends HTMLElement{#t=null;#e=null;#i=!1;#a=null;connectedCallback(){this.setAttribute("role","list"),this.#i=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.#n(),this.#r(),this.#d(),this.#o(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),s.#k?.source===this&&(s.#k=null)}get draggableChildren(){return[...this.querySelectorAll(':scope > [draggable="true"]')]}get group(){return this.dataset.group||null}get orientation(){return this.dataset.orientation||"vertical"}get sortedOrder(){return this.draggableChildren.map(t=>t.dataset.id)}#o(){for(let t of this.draggableChildren)t.getAttribute("role")||t.setAttribute("role","listitem"),t.hasAttribute("tabindex")||t.setAttribute("tabindex","0"),t.hasAttribute("aria-grabbed")||t.setAttribute("aria-grabbed","false")}#n(){this.#t=document.createElement("div"),this.#t.setAttribute("role","status"),this.#t.setAttribute("aria-live","polite"),this.#t.setAttribute("aria-atomic","true"),this.#t.style.cssText="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);",this.prepend(this.#t)}#s(t){let e=this.#t;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#r(){this.addEventListener("pointerdown",t=>{this.#a=t.target}),this.addEventListener("dragstart",this.#m.bind(this)),this.addEventListener("dragover",this.#c.bind(this)),this.addEventListener("dragleave",this.#l.bind(this)),this.addEventListener("drop",this.#u.bind(this)),this.addEventListener("dragend",this.#f.bind(this))}#m(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("data-drag-disabled"))return;let i=e.querySelector("[data-drag-handle]");if(i&&!i.contains(this.#a)){t.preventDefault();return}e.setAttribute("data-dragging",""),t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",e.dataset.id||""),t.dataTransfer.setData("application/x-drag-surface-group",this.group||"");let r=this.#v(e);s.#k={item:e,source:this,originalIndex:r},this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}#c(t){let e=s.#k;if(!e||(this.group||e.source.group)&&this.group!==e.source.group)return;t.preventDefault(),t.dataTransfer.dropEffect="move",this.setAttribute("data-drag-over","");let i=this.orientation==="horizontal"?t.clientX:t.clientY;this.#C(i)}#l(t){t.relatedTarget&&!this.contains(t.relatedTarget)&&(this.removeAttribute("data-drag-over"),this.#E())}#u(t){t.preventDefault(),this.removeAttribute("data-drag-over"),this.#E();let e=s.#k;if(!e)return;let{item:i,source:r,originalIndex:o}=e,a=this.orientation==="horizontal"?t.clientX:t.clientY,n=this.#A(a);if(r===this){this.#y(i,n),this.#w();let l=this.#v(i);this.#b(i),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:i,itemId:i.dataset.id,oldIndex:o,newIndex:l,order:this.sortedOrder}}))}else this.#y(i,n),this.#w(),r.#w(),this.#b(i),this.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:i,itemId:i.dataset.id,fromSurface:r,toSurface:this,newIndex:this.#v(i),fromOrder:r.sortedOrder,toOrder:this.sortedOrder}}))}#f(){let t=s.#k;t?.item&&t.item.removeAttribute("data-dragging"),this.removeAttribute("data-drag-over"),this.#E(),s.#k=null,this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0}))}#d(){this.addEventListener("keydown",this.#g.bind(this))}#g(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("data-drag-disabled"))return;let i=e.getAttribute("aria-grabbed")==="true",r=this.orientation==="horizontal",o=r?"ArrowLeft":"ArrowUp",a=r?"ArrowRight":"ArrowDown";if(t.key===" "||t.key==="Enter"){if(t.preventDefault(),i){e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#w(),this.#b(e);let d=this.#v(e),c=this.draggableChildren;this.#s(`${this.#h(e)}, dropped at position ${d+1} of ${c.length}`),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,oldIndex:this.#e,newIndex:d,order:this.sortedOrder}})),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#e=null}else{this.#e=this.#v(e),e.setAttribute("aria-grabbed","true"),this.setAttribute("data-reorder-mode","");let d=this.draggableChildren;this.#s(`${this.#h(e)}, grabbed. Position ${this.#e+1} of ${d.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`),this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}return}if(!i&&(t.key===o||t.key===a)){t.preventDefault();let d=this.draggableChildren,c=d.indexOf(e),h=t.key===o?Math.max(0,c-1):Math.min(d.length-1,c+1);h!==c&&d[h].focus();return}if(i&&(t.key===o||t.key===a)){t.preventDefault();let d=this.draggableChildren,c=d.indexOf(e),h=t.key===o?Math.max(0,c-1):Math.min(d.length-1,c+1);h!==c&&(this.#y(e,h),e.focus(),this.#s(`Position ${h+1} of ${d.length}`));return}let n=r?"ArrowUp":"ArrowLeft",l=r?"ArrowDown":"ArrowRight";if(i&&(t.key===n||t.key===l)){if(t.preventDefault(),!this.group)return;let d=t.key===l?1:-1,c=this.#p(d);if(!c)return;c.appendChild(e),c.#w(),this.#w(),c.#b(e),e.focus();let h=c.getAttribute("aria-label")||"next surface";c.#s(`Moved to ${h}`),c.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,fromSurface:this,toSurface:c,newIndex:c.draggableChildren.indexOf(e),fromOrder:this.sortedOrder,toOrder:c.sortedOrder}})),this.removeAttribute("data-reorder-mode"),c.setAttribute("data-reorder-mode",""),this.#e=null;return}if(i&&t.key==="Escape"){t.preventDefault(),e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#e!=null&&(this.#y(e,this.#e),e.focus()),this.#s("Reorder cancelled"),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#e=null;return}!i&&t.key==="Escape"&&(t.preventDefault(),e.blur())}#b(t){t.setAttribute("data-just-dropped",""),t.addEventListener("animationend",()=>{t.removeAttribute("data-just-dropped")},{once:!0}),setTimeout(()=>t.removeAttribute("data-just-dropped"),500)}#p(t){if(!this.group)return null;let e=[...document.querySelectorAll(`drag-surface[data-group="${this.group}"]`)];if(e.length<2)return null;e.sort((o,a)=>{let n=o.getBoundingClientRect(),l=a.getBoundingClientRect();return n.left-l.left||n.top-l.top});let i=e.indexOf(this);return e[i+t]||null}#h(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#v(t){return this.draggableChildren.indexOf(t)}#y(t,e){let r=this.draggableChildren.filter(o=>o!==t)[e]||null;r?this.insertBefore(t,r):this.appendChild(t)}#w(){this.draggableChildren.forEach((t,e)=>{t.dataset.sortOrder=String(e+1)})}#A(t){let e=this.orientation==="horizontal",i=this.draggableChildren.filter(r=>!r.hasAttribute("data-dragging"));for(let r=0;r<i.length;r++){let o=i[r].getBoundingClientRect(),a=e?o.left+o.width/2:o.top+o.height/2;if(t<a)return r}return i.length}#C(t){this.#E();let e=this.orientation==="horizontal",i=this.draggableChildren.filter(r=>!r.hasAttribute("data-dragging"));for(let r=0;r<i.length;r++){let o=i[r].getBoundingClientRect(),a=e?o.left+o.width/2:o.top+o.height/2;if(t<a){i[r].setAttribute("data-drop-target","before");return}}i.length>0&&i[i.length-1].setAttribute("data-drop-target","after")}#E(){for(let t of this.querySelectorAll("[data-drop-target]"))t.removeAttribute("data-drop-target")}static#k=null};m("drag-surface",Z);var tt=/Mac|iPhone|iPad|iPod/.test(navigator.platform??""),Lt={mac:{meta:"\u2318",cmd:"\u2318",alt:"\u2325",shift:"\u21E7",ctrl:"\u2303"},other:{meta:"Ctrl",cmd:"Ctrl",alt:"Alt",shift:"Shift",ctrl:"Ctrl"}};function A(s){let t=tt?Lt.mac:Lt.other;return s.split("+").map(e=>{let i=e.trim().toLowerCase();return t[i]??i.toUpperCase()}).join(tt?"":"+")}function Mt(s){let t=s.toLowerCase().split("+").map(i=>i.trim());return{key:t.pop()??"",meta:t.includes("meta")||t.includes("cmd"),ctrl:t.includes("ctrl"),shift:t.includes("shift"),alt:t.includes("alt")}}function Tt(s,t){if(s.key.toLowerCase()!==t.key)return!1;let e,i;return tt?(e=t.meta,i=t.ctrl):(e=!1,i=t.meta||t.ctrl),!(e!==s.metaKey||i!==s.ctrlKey||t.shift!==s.shiftKey||t.alt!==s.altKey)}var ae=new Set(["INPUT","TEXTAREA","SELECT"]),C=[],Nt=!1;function ne(s){let t=ae.has(s.target.tagName)||s.target.isContentEditable;for(let e of C)if(!(t&&!e.global)&&Tt(s,e.descriptor)){s.preventDefault(),e.callback(s);return}}function le(){Nt||(document.addEventListener("keydown",ne),Nt=!0)}function k(s,t,e={}){le();let i=Mt(s),r={combo:s,descriptor:i,callback:t,global:e.global===!0};return C.find(a=>a.combo===s)&&console.warn(`[hotkey-bind] Shortcut "${s}" already bound. Last-connected-wins.`),C.unshift(r),function(){let n=C.indexOf(r);n!==-1&&C.splice(n,1)}}var et=class extends HTMLElement{#t;#e;#i;#a=[];#o=-1;#n=[];#s=null;#r=[];connectedCallback(){this.#m(),this.#c(),this.hasAttribute("data-discover")&&this.#b(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#s?.(),document.removeEventListener("command-registry-change",this.#p)}#m(){this.#t=document.createElement("dialog"),this.#t.className="command-dialog",this.#t.addEventListener("click",i=>{i.target===this.#t&&this.close()});let t=document.createElement("div");t.className="command-search",this.#e=document.createElement("input"),this.#e.type="search",this.#e.placeholder=this.dataset.placeholder||"Type a command...",this.#e.setAttribute("aria-label","Search commands"),this.#e.autocomplete="off",this.#e.addEventListener("input",this.#l),this.#e.addEventListener("keydown",this.#u),t.appendChild(this.#e),this.#i=document.createElement("div"),this.#i.className="command-list",this.#i.setAttribute("role","listbox"),this.#n=Array.from(this.querySelectorAll("command-group")),this.#n.forEach(i=>{let r=document.createElement("div");r.className="command-group-header",r.textContent=i.getAttribute("label")||"",r.setAttribute("role","presentation");let o=Array.from(i.querySelectorAll("command-item"));this.#i.appendChild(r),o.forEach(a=>{let n=document.createElement("button");n.className="command-option",n.setAttribute("role","option"),n.dataset.value=a.getAttribute("value")||"",n.dataset.searchText=a.textContent.toLowerCase().trim();let l=a.querySelector('[slot="icon"]');if(l){let h=document.createElement("span");h.className="command-icon",h.appendChild(l.cloneNode(!0)),n.appendChild(h)}let d=document.createElement("span");d.className="command-label",d.textContent=a.textContent.trim(),n.appendChild(d);let c=a.getAttribute("data-hotkey");if(c){let h=document.createElement("kbd");h.className="command-kbd",h.textContent=A(c),n.appendChild(h)}n.addEventListener("click",()=>{this.#g(n.dataset.value)}),this.#i.appendChild(n),this.#a.push({btn:n,header:r,group:i})})});let e=document.createElement("div");e.className="command-empty",e.textContent="No results found.",e.hidden=!0,this.#i.appendChild(e),this.#t.appendChild(t),this.#t.appendChild(this.#i),this.appendChild(this.#t)}#c(){let t=this.dataset.hotkey||"meta+k";this.#s=k(t,()=>{this.#t.open?this.close():this.open()},{global:!0})}#l=()=>{let t=this.#e.value.toLowerCase().trim(),e=0,i=new Set;this.#a.forEach(({btn:o,header:a})=>{let n=!t||o.dataset.searchText.includes(t);o.hidden=!n,n&&(e++,i.add(a))}),this.#i.querySelectorAll(".command-group-header").forEach(o=>{o.hidden=!i.has(o)});let r=this.#i.querySelector(".command-empty");r&&(r.hidden=e>0),this.#o=-1,e>0&&this.#d(0)};#u=t=>{let e=this.#f();switch(t.key){case"ArrowDown":t.preventDefault(),this.#d(this.#o+1);break;case"ArrowUp":t.preventDefault(),this.#d(this.#o-1);break;case"Enter":t.preventDefault(),this.#o>=0&&e[this.#o]&&e[this.#o].btn.click();break;case"Escape":t.preventDefault(),this.close();break}};#f(){return this.#a.filter(({btn:t})=>!t.hidden)}#d(t){let e=this.#f();if(e.length===0)return;e.forEach(({btn:r})=>r.removeAttribute("data-active")),t<0&&(t=e.length-1),t>=e.length&&(t=0),this.#o=t;let{btn:i}=e[t];i.setAttribute("data-active",""),i.scrollIntoView({block:"nearest"})}#g(t){this.close(),this.dispatchEvent(new CustomEvent("command-palette:select",{bubbles:!0,detail:{value:t}}))}#b(){document.addEventListener("command-registry-change",this.#p)}#p=()=>{this.#t?.open&&(this.#h(),this.#l())};#h(){if(!this.hasAttribute("data-discover"))return;let{getRegisteredCommands:t,scanAutoDiscoverable:e}=window.__commandRegistry||{};if(!t)return;this.#a=this.#a.filter(o=>!o.discovered),this.#r.forEach(o=>o.remove()),this.#r=[];let i=this.#i.querySelector(".command-empty"),r=t();for(let[o,a]of r){let n=document.createElement("div");n.className="command-group-header",n.textContent=o,n.setAttribute("role","presentation"),this.#i.insertBefore(n,i),this.#r.push(n);for(let l of a){if(this.contains(l.element))continue;let d=this.#v(l.label,l.icon,l.shortcut);d.dataset.value=`__discovered:${l.label}`,d.addEventListener("click",()=>{this.close(),l.element.click()}),this.#i.insertBefore(d,i),this.#a.push({btn:d,header:n,group:null,discovered:!0})}}if(this.dataset.discover==="auto"&&e){let o=e(),a=new Map;for(let n of o){let l=a.get(n.group)||[];l.push(n),a.set(n.group,l)}for(let[n,l]of a){let d=document.createElement("div");d.className="command-group-header",d.textContent=n,d.setAttribute("role","presentation"),this.#i.insertBefore(d,i),this.#r.push(d);for(let c of l){if(this.contains(c.element))continue;let h=this.#v(c.label,c.icon,c.shortcut);h.dataset.value=`__auto:${c.label}`,h.dataset.auto="",h.addEventListener("click",()=>{this.close(),c.action?c.action():c.element.click()}),this.#i.insertBefore(h,i),this.#a.push({btn:h,header:d,group:null,discovered:!0})}}}}#v(t,e,i){let r=document.createElement("button");if(r.className="command-option",r.setAttribute("role","option"),r.dataset.searchText=t.toLowerCase(),e){let a=document.createElement("span");a.className="command-icon";let n=document.createElement("icon-wc");n.setAttribute("name",e),a.appendChild(n),r.appendChild(a)}let o=document.createElement("span");if(o.className="command-label",o.textContent=t,r.appendChild(o),i){let a=document.createElement("kbd");a.className="command-kbd",a.textContent=A(i),r.appendChild(a)}return r}open(){this.#t.open||(this.#h(),this.#t.showModal(),this.#e.value="",this.#l(),this.#e.focus(),this.dispatchEvent(new CustomEvent("command-palette:open",{bubbles:!0})))}close(){this.#t.open&&(this.#t.close(),this.dispatchEvent(new CustomEvent("command-palette:close",{bubbles:!0})))}get isOpen(){return this.#t?.open??!1}},it=class extends HTMLElement{},st=class extends HTMLElement{};m("command-palette",et);m("command-group",it);m("command-item",st);var rt=class extends HTMLElement{#t;#e=null;connectedCallback(){this.#i(),this.#e=k("shift+?",()=>{this.#t.open?this.#t.close():this.#a()}),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#e?.()}#i(){this.#t=document.createElement("dialog"),this.#t.className="shortcut-dialog",this.#t.addEventListener("click",t=>{t.target===this.#t&&this.#t.close()}),this.appendChild(this.#t)}#a(){this.#t.innerHTML="";let t=document.createElement("div");t.className="shortcut-header",t.innerHTML="<h2>Keyboard Shortcuts</h2>",this.#t.appendChild(t);let e=document.createElement("div");e.className="shortcut-body";let{getRegisteredCommands:i}=window.__commandRegistry||{},r=new Map;if(r.set("General",[{label:"Show keyboard shortcuts",shortcut:"shift+?"}]),i)for(let[o,a]of i())for(let n of a){if(!n.shortcut)continue;let l=r.get(o)||[];l.push({label:n.label,shortcut:n.shortcut}),r.set(o,l)}for(let[o,a]of r){let n=document.createElement("div");n.className="shortcut-group";let l=document.createElement("div");l.className="shortcut-group-header",l.textContent=o,n.appendChild(l);for(let d of a){let c=document.createElement("div");c.className="shortcut-row";let h=document.createElement("span");h.className="shortcut-label",h.textContent=d.label;let u=document.createElement("kbd");u.className="shortcut-kbd",u.textContent=A(d.shortcut),c.appendChild(h),c.appendChild(u),n.appendChild(c)}e.appendChild(n)}this.#t.appendChild(e),this.#t.showModal()}};m("short-cuts",rt);var ot=class extends HTMLElement{#t;#e=!1;connectedCallback(){if([...this.children].length<2)return;let e=Number(this.dataset.position)||50;this.#t=document.createElement("div"),this.#t.className="comparison-divider",this.#t.setAttribute("role","slider"),this.#t.setAttribute("aria-label","Comparison slider"),this.#t.setAttribute("aria-valuemin","0"),this.#t.setAttribute("aria-valuemax","100"),this.#t.setAttribute("aria-valuenow",String(e)),this.#t.setAttribute("tabindex","0"),this.appendChild(this.#t),this.#s(e),this.#t.addEventListener("pointerdown",this.#i),this.#t.addEventListener("keydown",this.#n),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.removeEventListener("pointerdown",this.#i),this.#t.removeEventListener("keydown",this.#n))}#i=t=>{t.preventDefault(),this.#e=!0,this.#t.setPointerCapture(t.pointerId),this.#t.addEventListener("pointermove",this.#a),this.#t.addEventListener("pointerup",this.#o)};#a=t=>{if(!this.#e)return;let e=this.getBoundingClientRect(),i=t.clientX-e.left,r=Math.min(100,Math.max(0,i/e.width*100));this.#s(r)};#o=t=>{this.#e=!1,this.#t.releasePointerCapture(t.pointerId),this.#t.removeEventListener("pointermove",this.#a),this.#t.removeEventListener("pointerup",this.#o)};#n=t=>{let e=t.shiftKey?10:1,i=Number(this.#t.getAttribute("aria-valuenow"));t.key==="ArrowLeft"||t.key==="ArrowDown"?(t.preventDefault(),this.#s(Math.max(0,i-e))):(t.key==="ArrowRight"||t.key==="ArrowUp")&&(t.preventDefault(),this.#s(Math.min(100,i+e)))};#s(t){this.style.setProperty("--_position",`${t}%`),this.#t.setAttribute("aria-valuenow",String(Math.round(t))),this.#t.style.left=`${t}%`,this.dispatchEvent(new CustomEvent("compare-surface:change",{detail:{position:t},bubbles:!0}))}};m("compare-surface",ot);var at=class extends HTMLElement{#t;#e;#i;#a=!1;#o=50;#n=!1;#s=50;get#r(){return this.dataset.direction==="vertical"}get#m(){return Number(this.dataset.min)||10}get#c(){return Number(this.dataset.max)||90}get position(){return this.#o}set position(t){this.#h(Number(t))}get collapsed(){return this.#n}set collapsed(t){t?this.#b():this.#p()}reset(){let t=Number(this.dataset.position)||50;this.#n=!1,this.#h(t),this.#w()}connectedCallback(){let t=[...this.children];if(t.length<2)return;this.#e=t[0],this.#i=t[1];let i=this.#v()??(Number(this.dataset.position)||50);this.#t=document.createElement("div"),this.#t.className="split-divider",this.#t.setAttribute("role","separator"),this.#t.setAttribute("aria-orientation",this.#r?"vertical":"horizontal"),this.#t.setAttribute("aria-valuenow",String(Math.round(i))),this.#t.setAttribute("aria-valuemin",String(this.#m)),this.#t.setAttribute("aria-valuemax",String(this.#c)),this.#t.setAttribute("aria-label","Resize panels"),this.#t.setAttribute("tabindex","0"),this.insertBefore(this.#t,this.#i),this.#h(i),this.#t.addEventListener("pointerdown",this.#l),this.#t.addEventListener("keydown",this.#d),this.hasAttribute("data-collapsible")&&this.#t.addEventListener("dblclick",this.#g),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.removeEventListener("pointerdown",this.#l),this.#t.removeEventListener("keydown",this.#d),this.#t.removeEventListener("dblclick",this.#g))}#l=t=>{t.preventDefault(),this.#a=!0,this.#t.setPointerCapture(t.pointerId),this.style.userSelect="none",this.#t.addEventListener("pointermove",this.#u),this.#t.addEventListener("pointerup",this.#f)};#u=t=>{if(!this.#a)return;let e=this.getBoundingClientRect(),i;this.#r?i=(t.clientY-e.top)/e.height*100:i=(t.clientX-e.left)/e.width*100,this.#n&&(this.#n=!1),this.#h(i)};#f=t=>{this.#a=!1,this.#t.releasePointerCapture(t.pointerId),this.style.userSelect="",this.#t.removeEventListener("pointermove",this.#u),this.#t.removeEventListener("pointerup",this.#f),this.#y()};#d=t=>{let e=t.shiftKey?10:1,i=this.#o,r=this.#r?["ArrowUp"]:["ArrowLeft"],o=this.#r?["ArrowDown"]:["ArrowRight"];r.includes(t.key)?(t.preventDefault(),this.#h(i-e),this.#y()):o.includes(t.key)?(t.preventDefault(),this.#h(i+e),this.#y()):t.key==="Home"?(t.preventDefault(),this.#h(this.#m),this.#y()):t.key==="End"&&(t.preventDefault(),this.#h(this.#c),this.#y())};#g=()=>{this.#n?this.#p():this.#b(),this.#y()};#b(){this.#s=this.#o,this.#n=!0,this.#e.style.flexBasis="0%",this.#e.style.overflow="hidden",this.#t.setAttribute("aria-valuenow","0"),this.#o=0,this.dispatchEvent(new CustomEvent("split-surface:collapse",{detail:{collapsed:!0},bubbles:!0}))}#p(){this.#n=!1,this.#e.style.overflow="auto",this.#h(this.#s),this.dispatchEvent(new CustomEvent("split-surface:collapse",{detail:{collapsed:!1},bubbles:!0}))}#h(t){let e=this.#n?0:Math.min(this.#c,Math.max(this.#m,t));this.#o=e,this.#e.style.flexBasis=`${e}%`,this.#e.style.flexGrow="0",this.#e.style.flexShrink="0",this.#e.style.overflow="auto",this.#i.style.flexGrow="1",this.#i.style.overflow="auto",this.#t.setAttribute("aria-valuenow",String(Math.round(e))),this.dispatchEvent(new CustomEvent("split-surface:resize",{detail:{position:e},bubbles:!0}))}#v(){let t=this.dataset.persist;if(!t)return null;try{let e=localStorage.getItem(`split-surface:${t}`);return e!==null?Number(e):null}catch{return null}}#y(){let t=this.dataset.persist;if(t)try{localStorage.setItem(`split-surface:${t}`,String(Math.round(this.#o)))}catch{}}#w(){let t=this.dataset.persist;if(t)try{localStorage.removeItem(`split-surface:${t}`)}catch{}}};m("split-surface",at);var nt=class extends HTMLElement{#t;connectedCallback(){let t=this.dataset.value||this.textContent.trim();if(!t)return;let e=parseInt(this.dataset.size??"200",10)||200,i=parseInt(this.dataset.errorCorrection??"1",10)||1;this.#t=document.createElement("canvas"),this.#t.width=e,this.#t.height=e,this.#t.setAttribute("role","img"),this.#t.setAttribute("aria-label",`QR code: ${t}`),this.#e(t,e,i),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}static get observedAttributes(){return["data-value","data-size"]}attributeChangedCallback(){if(!this.#t)return;let t=this.dataset.value||this.textContent.trim();if(!t)return;let e=parseInt(this.dataset.size??"200",10)||200,i=parseInt(this.dataset.errorCorrection??"1",10)||1;this.#t.width=e,this.#t.height=e,this.#t.setAttribute("aria-label",`QR code: ${t}`),this.#e(t,e,i)}#e(t,e,i){let r=de(t,i),o=this.#t.getContext("2d"),a=r.length,n=e/a,l=getComputedStyle(this),d=this.dataset.color||l.color||"#000",c=this.dataset.background||"transparent";o.clearRect(0,0,e,e),c!=="transparent"&&(o.fillStyle=c,o.fillRect(0,0,e,e)),o.fillStyle=d;for(let h=0;h<a;h++)for(let u=0;u<a;u++)r[h][u]&&o.fillRect(Math.round(u*n),Math.round(h*n),Math.ceil(n),Math.ceil(n));this.textContent="",this.appendChild(this.#t)}toDataURL(t="image/png"){return this.#t?.toDataURL(t)??""}},N=[[[26,7],[44,10],[70,15],[100,20],[134,26],[172,18],[196,20],[242,24],[292,30],[346,18]],[[26,10],[44,16],[70,26],[100,18],[134,24],[172,16],[196,18],[242,22],[292,22],[346,26]],[[26,13],[44,22],[70,18],[100,26],[134,18],[172,24],[196,18],[242,22],[292,20],[346,28]],[[26,17],[44,28],[70,22],[100,16],[134,22],[172,28],[196,26],[242,26],[292,24],[346,28]]],ce=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,52]];function de(s,t=1){let e=new TextEncoder().encode(s),i=he(e.length,t),r=N[t][i-1][0],o=N[t][i-1][1],a=r-o,n=ue(e,i,a),l=me(n,a,o),d=i*4+17,c=Array.from({length:d},()=>new Uint8Array(d)),h=Array.from({length:d},()=>new Uint8Array(d));return fe(c,h,d),ge(c,h,i),be(c,h,d),ve(h,d),ye(c,h,l,d),_e(c,h,d,t)}function he(s,t){for(let e=1;e<=10;e++){let i=N[t][e-1][0],r=N[t][e-1][1],o=i-r,a=e<=9?8:16,n=Math.ceil((4+a)/8);if(s<=o-n)return e}return 10}function ue(s,t,e){let i=[],r=(h,u)=>{for(let p=u-1;p>=0;p--)i.push(h>>p&1)};r(4,4);let o=t<=9?8:16;r(s.length,o);for(let h of s)r(h,8);let a=e*8,n=Math.min(4,a-i.length);for(r(0,n);i.length%8!==0;)i.push(0);let l=[236,17],d=0;for(;i.length<a;)r(l[d%2],8),d++;let c=[];for(let h=0;h<i.length;h+=8){let u=0;for(let p=0;p<8;p++)u=u<<1|(i[h+p]||0);c.push(u)}return c}function me(s,t,e){let i=pe(e),r=new Uint8Array(t+e);for(let a=0;a<t;a++)r[a]=s[a];for(let a=0;a<t;a++){let n=r[a];if(n===0)continue;let l=P[n];for(let d=0;d<i.length;d++)r[a+d]^=_[(l+P[i[d]])%255]}let o=[...s.slice(0,t)];for(let a=0;a<e;a++)o.push(r[t+a]);return o}var _=new Uint8Array(512),P=new Uint8Array(256);(function(){let t=1;for(let e=0;e<255;e++)_[e]=t,P[t]=e,t<<=1,t>=256&&(t^=285);for(let e=255;e<512;e++)_[e]=_[e-255]})();function pe(s){let t=new Uint8Array([1]);for(let e=0;e<s;e++){let i=new Uint8Array(t.length+1),r=e;for(let o=0;o<t.length;o++)i[o]^=t[o],i[o+1]^=_[(P[t[o]]+r)%255];t=i}return t}function fe(s,t,e){let i=[[0,0],[e-7,0],[0,e-7]];for(let[r,o]of i){for(let a=0;a<7;a++)for(let n=0;n<7;n++){let l=a===0||a===6||n===0||n===6||a>=2&&a<=4&&n>=2&&n<=4;s[r+a][o+n]=l?1:0,t[r+a][o+n]=1}for(let a=-1;a<=7;a++)for(let[n,l]of[[a,-1],[a,7],[-1,a],[7,a]]){let d=r+n,c=o+l;d>=0&&d<e&&c>=0&&c<e&&(s[d][c]=0,t[d][c]=1)}}}function ge(s,t,e){if(e<2)return;let i=ce[e-1];for(let r of i)for(let o of i)if(!t[r][o])for(let a=-2;a<=2;a++)for(let n=-2;n<=2;n++){let l=Math.abs(a)===2||Math.abs(n)===2||a===0&&n===0;s[r+a][o+n]=l?1:0,t[r+a][o+n]=1}}function be(s,t,e){for(let i=8;i<e-8;i++){let r=i%2===0?1:0;t[6][i]||(s[6][i]=r,t[6][i]=1),t[i][6]||(s[i][6]=r,t[i][6]=1)}}function ve(s,t){for(let e=0;e<=8;e++)e<t&&(s[8][e]=1),e<t&&(s[e][8]=1);for(let e=0;e<=7;e++)s[8][t-1-e]=1,s[t-1-e][8]=1;s[t-8][8]=1}function ye(s,t,e,i){let r=[];for(let n of e)for(let l=7;l>=0;l--)r.push(n>>l&1);let o=0,a=!0;for(let n=i-1;n>=1;n-=2){n===6&&(n=5);let l=a?Array.from({length:i},(d,c)=>i-1-c):Array.from({length:i},(d,c)=>c);for(let d of l)for(let c of[n,n-1])c<0||c>=i||t[d][c]||(s[d][c]=o<r.length?r[o]:0,o++);a=!a}}var we=[30660,29427,32170,30877,26159,25368,27713,26998,21522,20773,24188,23371,17913,16590,20375,19104,13663,12392,16177,14854,9396,8579,11994,11245,5769,5054,7399,6608,1890,597,3340,2107];function ke(s,t){let i=[1,0,3,2][s]*8+t;return we[i]}var xe=[(s,t)=>(s+t)%2===0,s=>s%2===0,(s,t)=>t%3===0,(s,t)=>(s+t)%3===0,(s,t)=>(Math.floor(s/2)+Math.floor(t/3))%2===0,(s,t)=>s*t%2+s*t%3===0,(s,t)=>(s*t%2+s*t%3)%2===0,(s,t)=>((s+t)%2+s*t%3)%2===0];function Ee(s,t,e,i){let r=s.map(a=>new Uint8Array(a)),o=xe[i];for(let a=0;a<e;a++)for(let n=0;n<e;n++)!t[a][n]&&o(a,n)&&(r[a][n]^=1);return r}function Ae(s,t,e,i){let r=ke(e,i),o=[[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]];for(let n=0;n<15;n++){let[l,d]=o[n];s[l][d]=r>>14-n&1}let a=[[8,t-1],[8,t-2],[8,t-3],[8,t-4],[8,t-5],[8,t-6],[8,t-7],[8,t-8],[t-7,8],[t-6,8],[t-5,8],[t-4,8],[t-3,8],[t-2,8],[t-1,8]];for(let n=0;n<15;n++){let[l,d]=a[n];s[l][d]=r>>14-n&1}s[t-8][8]=1}function Ce(s,t){let e=0;for(let i=0;i<t;i++){let r=1;for(let o=1;o<t;o++)s[i][o]===s[i][o-1]?(r++,r===5?e+=3:r>5&&(e+=1)):r=1}for(let i=0;i<t;i++){let r=1;for(let o=1;o<t;o++)s[o][i]===s[o-1][i]?(r++,r===5?e+=3:r>5&&(e+=1)):r=1}for(let i=0;i<t-1;i++)for(let r=0;r<t-1;r++){let o=s[i][r];o===s[i][r+1]&&o===s[i+1][r]&&o===s[i+1][r+1]&&(e+=3)}return e}function _e(s,t,e,i){let r=1/0,o=null;for(let a=0;a<8;a++){let n=Ee(s,t,e,a);Ae(n,e,i,a);let l=Ce(n,e);l<r&&(r=l,o=n)}return o}m("qr-code",nt);var lt=class extends HTMLElement{#t;#e;#i;#a=!1;#o=0;#n=0;#s=0;#r=!1;get activated(){return this.#r}get#m(){return Number(this.dataset.threshold)||90}connectedCallback(){this.#i=document.createElement("div"),this.#i.className="slide-track",this.#e=document.createElement("span"),this.#e.className="slide-label",this.#e.textContent=this.dataset.label||"Slide to confirm",this.#t=document.createElement("button"),this.#t.className="slide-handle",this.#t.setAttribute("role","slider"),this.#t.setAttribute("aria-valuemin","0"),this.#t.setAttribute("aria-valuemax","100"),this.#t.setAttribute("aria-valuenow","0"),this.#t.setAttribute("aria-label",this.dataset.label||"Slide to confirm"),this.#t.setAttribute("tabindex","0"),this.#t.innerHTML='<icon-wc name="chevrons-right" size="sm"></icon-wc>',this.#i.append(this.#e,this.#t),this.textContent="",this.appendChild(this.#i),this.#p(0),this.#t.addEventListener("pointerdown",this.#c),this.#t.addEventListener("keydown",this.#f),this.#t.addEventListener("transitionend",this.#d),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.removeEventListener("pointerdown",this.#c),this.#t.removeEventListener("keydown",this.#f),this.#t.removeEventListener("transitionend",this.#d))}reset(){this.#r=!1,this.removeAttribute("data-activated"),this.#e.textContent=this.dataset.label||"Slide to confirm",this.#t.disabled=!1,this.#p(0),this.dispatchEvent(new CustomEvent("slide-accept:reset",{bubbles:!0}))}#c=t=>{if(!this.#r){if(t.preventDefault(),this.hasAttribute("data-transitioning")){let e=getComputedStyle(this.#t),i=parseFloat(e.left),r=this.#i.getBoundingClientRect().width-this.#t.offsetWidth;this.removeAttribute("data-transitioning"),this.#o=r>0?i/r*100:0}this.#a=!0,this.#n=t.clientX,this.#s=this.#o,this.#t.setPointerCapture(t.pointerId),this.setAttribute("data-dragging",""),this.#t.addEventListener("pointermove",this.#l),this.#t.addEventListener("pointerup",this.#u),this.#t.addEventListener("pointercancel",this.#u)}};#l=t=>{if(!this.#a)return;let e=this.#i.getBoundingClientRect().width-this.#t.offsetWidth;if(e<=0)return;let r=(t.clientX-this.#n)/e*100,o=Math.min(100,Math.max(0,this.#s+r));this.#p(o)};#u=t=>{this.#a&&(this.#a=!1,this.removeAttribute("data-dragging"),this.#t.releasePointerCapture(t.pointerId),this.#t.removeEventListener("pointermove",this.#l),this.#t.removeEventListener("pointerup",this.#u),this.#t.removeEventListener("pointercancel",this.#u),this.#o>=this.#m?this.#g():this.#b())};#f=t=>{if(this.#r)return;let e=t.shiftKey?20:5;t.key==="ArrowRight"?(t.preventDefault(),this.#p(Math.min(100,this.#o+e))):t.key==="ArrowLeft"?(t.preventDefault(),this.#p(Math.max(0,this.#o-e))):t.key==="End"?(t.preventDefault(),this.#g()):t.key==="Home"&&(t.preventDefault(),this.#p(0)),t.key==="ArrowRight"&&this.#o>=this.#m&&this.#g()};#d=()=>{this.removeAttribute("data-transitioning")};#g(){this.#r=!0,this.#p(100),this.setAttribute("data-activated",""),this.#e.textContent=this.dataset.activatedLabel||"Confirmed!",this.#t.disabled=!0,this.dispatchEvent(new CustomEvent("slide-accept:accept",{bubbles:!0}))}#b(){this.setAttribute("data-transitioning",""),this.#p(0)}#p(t){this.#o=t,this.style.setProperty("--_slide-position",String(t)),this.#t.setAttribute("aria-valuenow",String(Math.round(t)))}};m("slide-accept",lt);var ct=class extends HTMLElement{static observedAttributes=["colors","names","layout","show-values","show-names","size"];connectedCallback(){this.#t(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(){this.isConnected&&this.#t()}#t(){let t=this.getAttribute("colors")||"",e=this.getAttribute("names")||"",i=this.getAttribute("layout")||"inline",r=this.getAttribute("size")||"md",o=this.hasAttribute("show-values"),a=this.hasAttribute("show-names"),n=this.#e(t),l=e?e.split(",").map(u=>u.trim()):[],c={sm:32,md:48,lg:72}[r]||48,h=n.map((u,p)=>{let g=l[p]||"",v=this.#i(u);return`<button type="button" class="swatch" data-index="${p}"
        style="background:${u};color:${v};width:${c}px;height:${c}px"
        title="${g?g+": ":""}${u}"
        aria-label="${g||"Color "+(p+1)}: ${u}">
        ${a&&g?`<span class="name">${g}</span>`:""}
        ${o?`<span class="value">${u}</span>`:""}
      </button>`}).join("");this.innerHTML=`<div class="palette ${i}" role="group" aria-label="Color palette">${h}</div>`,this.querySelectorAll(".swatch").forEach(u=>{u.addEventListener("click",()=>{let p=Number(u.dataset.index),g=n[p],v=l[p]||"";navigator.clipboard?.writeText(g),this.dispatchEvent(new CustomEvent("color-palette:select",{bubbles:!0,detail:{color:g,name:v,index:p}})),u.style.outline="3px solid currentColor",u.style.outlineOffset="2px",setTimeout(()=>{u.style.outline="",u.style.outlineOffset=""},400)})})}#e(t){if(!t)return[];let e=[],i=0,r="";for(let o of t)o==="("?i++:o===")"&&i--,o===","&&i===0?(e.push(r.trim()),r=""):r+=o;return r.trim()&&e.push(r.trim()),e}#i(t){let e=t.match(/oklch\(\s*([\d.]+)%?\s/);if(e){let i=parseFloat(e[1]);return(i>1?i/100:i)>.6?"#000":"#fff"}if(t.startsWith("#")){let i=t.replace("#",""),r=parseInt(i.substring(0,2),16)/255,o=parseInt(i.substring(2,4),16)/255,a=parseInt(i.substring(4,6),16)/255;return .2126*r+.7152*o+.0722*a>.4?"#000":"#fff"}return"#000"}};m("color-palette",ct);var dt=class extends HTMLElement{static observedAttributes=["font-family","label","sample","show-scale","show-weights","show-characters","weights"];connectedCallback(){this.#t(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(){this.isConnected&&this.#t()}#t(){let t=this.getAttribute("font-family")||"system-ui",e=this.getAttribute("label")||t.replace(/['"]/g,"").split(",")[0],i=this.getAttribute("sample")||"The quick brown fox jumps over the lazy dog",r=this.hasAttribute("show-scale"),o=this.hasAttribute("show-weights"),a=this.hasAttribute("show-characters"),l=(this.getAttribute("weights")||"300,400,500,600,700").split(",").map(c=>c.trim()),d="";if(d+=`<div class="specimen-header" style="font-family:${t}">
      <span class="specimen-label">${e}</span>
      <p class="specimen-sample" contenteditable="plaintext-only" spellcheck="false">${i}</p>
    </div>`,a&&(d+=`<div class="specimen-chars" style="font-family:${t}">
        <div class="char-row"><span class="char-label">Upper</span>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c=>`<span>${c}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Lower</span>${"abcdefghijklmnopqrstuvwxyz".split("").map(c=>`<span>${c}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Digits</span>${"0123456789".split("").map(c=>`<span>${c}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Punct</span>${"!@#$%^&*()_+-=[]{}|;:,.<>?".split("").map(c=>`<span>${c==="<"?"&lt;":c===">"?"&gt;":c==="&"?"&amp;":c}</span>`).join("")}</div>
      </div>`),o){d+='<div class="specimen-weights">';for(let c of l)d+=`<div class="weight-sample" style="font-family:${t};font-weight:${c}">
          <span class="weight-label">${c}</span>
          <span class="weight-text">Aa</span>
        </div>`;d+="</div>"}if(r){let c=[{name:"xs",rem:.75},{name:"sm",rem:.875},{name:"md",rem:1},{name:"lg",rem:1.125},{name:"xl",rem:1.25},{name:"2xl",rem:1.5},{name:"3xl",rem:1.875},{name:"4xl",rem:2.25},{name:"5xl",rem:3}];d+='<div class="specimen-scale">';for(let h of c)d+=`<div class="scale-step" style="font-family:${t};font-size:${h.rem}rem">
          <span class="scale-label">${h.name}</span>
          <span class="scale-text">${i.substring(0,30)}</span>
        </div>`;d+="</div>"}this.innerHTML=d}};m("type-specimen",dt);var ht=class extends HTMLElement{#t=null;static get observedAttributes(){return["data-position"]}get#e(){return this.dataset.persist||"consent-banner"}get#i(){let t=this.dataset.expires;return t==="0"||t==="never"?0:t?parseInt(t,10):365}connectedCallback(){if(this.#t=this.querySelector("dialog"),!this.#t)return;this.dataset.trigger&&document.addEventListener("click",this.#r);let t=this.#m();if(t&&!this.#l(t)){this.dataset.trigger?this.hidden=!0:this.remove();return}this.#a(),this.setAttribute("data-upgraded","")}disconnectedCallback(){document.removeEventListener("click",this.#r),this.removeAttribute("data-upgraded")}#a(){(this.dataset.position||"bottom")==="center"?(this.#t.showModal(),this.#t.addEventListener("cancel",this.#n)):this.#t.show(),this.addEventListener("click",this.#s)}#o(){this.#t.removeEventListener("cancel",this.#n),this.removeEventListener("click",this.#s),this.#t.close(),this.dataset.trigger?this.hidden=!0:this.remove()}#n=t=>{t.preventDefault()};#s=t=>{let e=t.target.closest("button[value]");if(!e)return;let i=e.value;if(!["accept","reject","save"].includes(i))return;let r=[...this.querySelectorAll('input[type="checkbox"]')],o={};i==="accept"?r.forEach(a=>{o[a.name]=!0}):i==="reject"?r.forEach(a=>{o[a.name]=!!a.disabled}):r.forEach(a=>{o[a.name]=a.checked}),this.#c({preferences:o,action:i,timestamp:Date.now()}),this.dispatchEvent(new CustomEvent("consent-banner:change",{bubbles:!0,detail:{preferences:o,action:i}})),this.#o()};#r=t=>{let e=this.dataset.trigger;if(!e||!t.target.closest(e))return;t.preventDefault();let r=this.#m();if(r?.preferences)for(let[o,a]of Object.entries(r.preferences)){let n=this.querySelector(`input[type="checkbox"][name="${CSS.escape(o)}"]`);n&&!n.disabled&&(n.checked=a)}this.hidden=!1,this.#a()};#m(){try{let t=localStorage.getItem(this.#e);return t?JSON.parse(t):null}catch{return null}}#c(t){try{localStorage.setItem(this.#e,JSON.stringify(t))}catch{}}#l(t){let e=this.#i;return e===0?!1:Date.now()-(t.timestamp||0)>e*864e5}static reset(t="consent-banner"){try{localStorage.removeItem(t)}catch{}}static getConsent(t="consent-banner"){try{let e=localStorage.getItem(t);return e?JSON.parse(e):null}catch{return null}}};m("consent-banner",ht);var Se='<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true" focusable="false"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="var(--color-danger, #f00)"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>',je={hq:"hqdefault",mq:"mqdefault",sd:"sddefault",maxres:"maxresdefault"},ut=class extends HTMLElement{#t;#e;connectedCallback(){if(this.#t=this.dataset.id,this.#e=this.dataset.title??"Play video",!this.#t){console.warn("youtube-player: missing required data-id attribute");return}this.hasAttribute("data-autoplay")?this.#r():this.#o()}#i(){let t=new URLSearchParams({autoplay:"1"}),e=this.dataset.start;e&&t.set("start",e);let i=this.dataset.list;return i&&t.set("list",i),this.dataset.params&&new URLSearchParams(this.dataset.params).forEach((r,o)=>t.set(o,r)),`https://www.youtube-nocookie.com/embed/${this.#t}?${t}`}#a(){let t=this.dataset.thumbnail??"hq";return`https://i.ytimg.com/vi/${this.#t}/${je[t]??"hqdefault"}.jpg`}#o(){this.dataset.state="ready",this.setAttribute("tabindex","0"),this.setAttribute("role","button"),this.setAttribute("aria-label",`Play ${this.#e}`),this.innerHTML=`<img src="${this.#a()}" alt="" loading="lazy" decoding="async"><button type="button" aria-label="Play ${this.#e}">${Se}</button>`,this.addEventListener("click",this.#n,{once:!0}),this.addEventListener("keydown",this.#s)}#n=()=>{this.removeEventListener("keydown",this.#s),this.#r()};#s=t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),this.removeEventListener("click",this.#n),this.#r())};#r(){this.dataset.state="active",this.removeAttribute("tabindex"),this.removeAttribute("role"),this.removeAttribute("aria-label"),this.innerHTML=`<iframe src="${this.#i()}" title="${this.#e}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`,this.querySelector("iframe")?.focus()}};m("youtube-player",ut);var mt='track[kind="chapters"][data-chapter-list]';function Pt(s=document){s.querySelectorAll(mt).forEach(t=>pt(t))}function pt(s){if(s.hasAttribute("data-chapter-list-init"))return;s.setAttribute("data-chapter-list-init","");let t=s.parentElement;if(!t||t.tagName!=="VIDEO")return;let e=s.track;e.mode==="disabled"&&(e.mode="hidden"),s.readyState>=2?Dt(t,e):s.addEventListener("load",()=>Dt(t,e),{once:!0})}function Dt(s,t){let e=t.cues;if(!e||e.length===0)return;let i=document.createElement("nav");i.setAttribute("aria-label","Video chapters"),i.classList.add("chapter-list");let r=document.createElement("ol");for(let a of e){let n=document.createElement("li"),l=document.createElement("button");l.type="button";let d=document.createElement("span");d.textContent=a.text;let c=document.createElement("time");c.textContent=Le(a.startTime),c.setAttribute("datetime",Me(a.startTime)),l.appendChild(d),l.appendChild(c),l.addEventListener("click",()=>{s.currentTime=a.startTime,s.paused&&s.play()}),n.appendChild(l),r.appendChild(n)}i.appendChild(r),s.insertAdjacentElement("afterend",i);let o=null;s.addEventListener("timeupdate",()=>{let a=s.currentTime,n=-1;for(let l=0;l<e.length;l++)if(a>=e[l].startTime&&a<e[l].endTime){n=l;break}o&&o.removeAttribute("data-active"),n>=0?(o=r.children[n],o.setAttribute("data-active","")):o=null})}function Le(s){let t=Math.floor(s/3600),e=Math.floor(s%3600/60),i=Math.floor(s%60);return t>0?`${t}:${String(e).padStart(2,"0")}:${String(i).padStart(2,"0")}`:`${e}:${String(i).padStart(2,"0")}`}function Me(s){let t=Math.floor(s/3600),e=Math.floor(s%3600/60),i=Math.floor(s%60);return`PT${t?t+"H":""}${e?e+"M":""}${i}S`}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>Pt()):Pt();var Te=new MutationObserver(s=>{for(let t of s)for(let e of t.addedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let i=e;i.matches?.(mt)&&pt(i),i.querySelectorAll?.(mt).forEach(r=>pt(r))}});Te.observe(document.documentElement,{childList:!0,subtree:!0});var x="[data-command], [commandfor]",Ne="Page Actions",b=new Map;function D(s){if(b.has(s)||s.hasAttribute("data-command-init"))return;s.setAttribute("data-command-init","");let t=s.getAttribute("data-command")||s.textContent.trim();if(!t)return;let e=s.getAttribute("data-command-group")||Ne,i=s.getAttribute("data-command-icon")||null,r=s.getAttribute("data-shortcut")||null,o=null;r&&(o=k(r,()=>s.click()));let a={element:s,label:t,group:e,icon:i,shortcut:r,unbind:o};b.set(s,a),document.dispatchEvent(new CustomEvent("command-registry-change",{detail:{action:"add",entry:a}}))}function ft(s){let t=b.get(s);t&&(t.unbind?.(),b.delete(s),s.removeAttribute("data-command-init"),document.dispatchEvent(new CustomEvent("command-registry-change",{detail:{action:"remove",element:s}})))}function Pe(){let s=new Map;for(let t of b.values()){if(t.element.hidden||t.element.closest("[hidden]"))continue;let e=s.get(t.group)||[];e.push(t),s.set(t.group,e)}return s}function Ft(s=document){s.querySelectorAll(x).forEach(D)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>Ft()):Ft();var De=new MutationObserver(s=>{for(let t of s){for(let e of t.addedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let i=e;i.matches(x)&&D(i),i.querySelectorAll(x).forEach(D)}for(let e of t.removedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let i=e;b.has(i)&&ft(i),i.querySelectorAll(x).forEach(r=>{b.has(r)&&ft(r)})}if(t.type==="attributes"&&t.target.nodeType===Node.ELEMENT_NODE){let e=t.target;e.matches(x)&&!b.has(e)?D(e):!e.matches(x)&&b.has(e)&&ft(e)}}});De.observe(document.documentElement,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-command","commandfor"]});function Fe(){let s='footer, aside, dialog, [hidden], [aria-hidden="true"]',e=[];return document.querySelectorAll("nav a[href]").forEach(i=>{if(i.closest(s)||b.has(i))return;let r=i.textContent.trim();!r||e.length>=50||e.push({element:i,label:r,group:"Navigation",icon:null,shortcut:null,auto:!0,action:null})}),document.querySelectorAll("h2[id], h3[id]").forEach(i=>{if(i.closest(s)||b.has(i))return;let r=i.textContent.trim();!r||e.length>=50||e.push({element:i,label:`Jump to: ${r}`,group:"On This Page",icon:null,shortcut:null,auto:!0,action:()=>i.scrollIntoView({behavior:"smooth"})})}),e}window.__commandRegistry={getRegisteredCommands:Pe,scanAutoDiscoverable:Fe};var Ie=window.matchMedia("(prefers-reduced-motion: reduce)");function It(){return Ie.matches||document.documentElement.hasAttribute("data-motion-reduced")}var Rt=0,f={_effects:new Map,_triggers:new Map,_transitions:new Map,_instances:new WeakMap,_triggerCleanups:new WeakMap,_transitionCleanups:new WeakMap,_observer:null,effect(s,t){this._effects.set(s,t),document.querySelectorAll("[data-effect]").forEach(e=>{(e.getAttribute("data-effect")||"").split(/\s+/).includes(s)&&this._initEffect(e,s)})},trigger(s,t){this._triggers.set(s,t)},transition(s,t){this._transitions.set(s,t)},uid(s){return s.id?s.id:(s._vbUid||(Rt++,s._vbUid=`vb-${Rt}`),s._vbUid)},theme(s,t){this._themes=this._themes||new Map,this._themes.set(s,t)},applyTheme(s,t=document.documentElement){let e=this._themes?.get(s);if(e)for(let[i,r]of Object.entries(e))t.style.setProperty(i,r)},swap(s){return document.startViewTransition?document.startViewTransition(s):s()},observe(s=document){if(s.querySelectorAll("[data-effect]").forEach(e=>this._processElement(e)),s.querySelectorAll("[data-stagger]").forEach(e=>this._processStagger(e)),s.querySelectorAll("[data-transition]").forEach(e=>this._processTransition(e)),this._observer)return;this._observer=new MutationObserver(e=>{for(let i of e){if(i.type==="childList"){for(let r of i.addedNodes)r.nodeType===Node.ELEMENT_NODE&&this._processTree(r);for(let r of i.removedNodes)r.nodeType===Node.ELEMENT_NODE&&this._cleanupTree(r)}if(i.type==="attributes"){let r=i.target;i.attributeName==="data-effect"&&this._reconcileEffects(r),i.attributeName==="data-trigger"&&this._reconcileTrigger(r),i.attributeName==="data-stagger"&&this._processStagger(r),i.attributeName==="data-transition"&&this._processTransition(r)}}});let t=s===document?document.body:s;this._observer.observe(t,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-effect","data-trigger","data-stagger","data-transition"]})},disconnect(){this._observer&&(this._observer.disconnect(),this._observer=null)},params(s){let t=getComputedStyle(s);return{get(e){return t.getPropertyValue(`--vb-${e}`).trim()},getNumber(e,i=0){let r=t.getPropertyValue(`--vb-${e}`).trim();return r?parseFloat(r):i},hasClass(e){return s.classList.contains(e)}}},emit(s,t,e={}){s.dispatchEvent(new CustomEvent(t,{bubbles:!0,detail:e}))},prefersReducedMotion:It,_processTree(s){s.hasAttribute?.("data-effect")&&this._processElement(s),s.hasAttribute?.("data-stagger")&&this._processStagger(s),s.hasAttribute?.("data-transition")&&this._processTransition(s),s.querySelectorAll?.("[data-effect]").forEach(t=>this._processElement(t)),s.querySelectorAll?.("[data-stagger]").forEach(t=>this._processStagger(t)),s.querySelectorAll?.("[data-transition]").forEach(t=>this._processTransition(t))},_cleanupTree(s){s.hasAttribute?.("data-effect")&&this._cleanupElement(s),s.hasAttribute?.("data-transition")&&this._cleanupTransition(s),s.querySelectorAll?.("[data-effect]").forEach(t=>this._cleanupElement(t)),s.querySelectorAll?.("[data-transition]").forEach(t=>this._cleanupTransition(t))},_processElement(s){if(s.hasAttribute("data-effect-processed"))return;s.setAttribute("data-effect-processed","");let t=s.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[];for(let e of t)this._initEffect(s,e);this._wireTrigger(s,t)},_initEffect(s,t){let e=this._effects.get(t);if(!e)return;let i=this._instances.get(s);if(i?.has(t))return;It();let r=e(s);r&&(i||(i=new Map,this._instances.set(s,i)),typeof r=="function"?i.set(t,{cleanup:r}):i.set(t,r))},_wireTrigger(s,t){let e=s.getAttribute("data-trigger");if(!e){this._activateEffects(s);return}let i=e.split(/\s+/).filter(Boolean);for(let r of i){let o=r.indexOf(":"),a=o>-1?r.slice(0,o):r,n=o>-1?r.slice(o+1):null,l=this._triggers.get(a);if(!l)continue;let d=l(s,()=>this._activateEffects(s),n);if(d){let c=this._triggerCleanups.get(s);if(c){let h=c;this._triggerCleanups.set(s,()=>{h(),d()})}else this._triggerCleanups.set(s,d)}}},_activateEffects(s){s.setAttribute("data-effect-active","");let t=this._instances.get(s);if(t)for(let[,e]of t)e.activate&&e.activate()},_cleanupElement(s){let t=this._instances.get(s);if(t){for(let[,i]of t)i.cleanup&&i.cleanup();this._instances.delete(s)}let e=this._triggerCleanups.get(s);e&&(e(),this._triggerCleanups.delete(s))},_reconcileEffects(s){let t=s.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[],e=this._instances.get(s);if(e)for(let[i,r]of e)t.includes(i)||(r.cleanup&&r.cleanup(),e.delete(i));for(let i of t)e?.has(i)||this._initEffect(s,i);s.hasAttribute("data-effect-processed")||(s.setAttribute("data-effect-processed",""),this._wireTrigger(s,t))},_reconcileTrigger(s){let t=this._triggerCleanups.get(s);t&&(t(),this._triggerCleanups.delete(s));let e=s.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[];this._wireTrigger(s,e)},_processStagger(s){let t=s.children;for(let e=0;e<t.length;e++)t[e].style.setProperty("--vb-stagger-index",String(e))},_processTransition(s){if(s.hasAttribute("data-transition-processed"))return;s.setAttribute("data-transition-processed","");let t=s.getAttribute("data-transition");if(!t)return;let e=this._transitions.get(t);if(e){let i=e(s);i&&this._transitionCleanups.set(s,i)}else s.style.viewTransitionName=`${t}-${this.uid(s)}`},_cleanupTransition(s){let t=this._transitionCleanups.get(s);t&&(t(),this._transitionCleanups.delete(s)),s.style.viewTransitionName=""}};typeof window<"u"&&(window.VB=f);f.effect("glitch",s=>{s.hasAttribute("data-effect-glitch-init")||(s.setAttribute("data-effect-glitch-init",""),s.setAttribute("data-glitch-text",s.textContent))});function Re(s){let t=s.textContent;s.setAttribute("aria-label",t),s.innerHTML="",t.split(/(\s+)/).forEach((i,r)=>{if(/^\s+$/.test(i)){s.appendChild(document.createTextNode(i));return}let o=document.createElement("span");o.className="vb-blur-chunk",o.textContent=i,o.style.setProperty("--i",String(Math.floor(r/2))),o.setAttribute("aria-hidden","true"),s.appendChild(o)})}function $e(s){let t=s.textContent;s.setAttribute("aria-label",t);let e=t.split(/\s+/).filter(Boolean),i=[],r="",o=s.offsetWidth,a=document.createElement("span");a.style.visibility="hidden",a.style.position="absolute",a.style.font=getComputedStyle(s).font,document.body.appendChild(a),e.forEach(n=>{let l=r?r+" "+n:n;a.textContent=l,a.offsetWidth>o&&r?(i.push(r),r=n):r=l}),r&&i.push(r),document.body.removeChild(a),i.length===0&&i.push(t),s.innerHTML="",i.forEach((n,l)=>{let d=document.createElement("span");d.className="vb-blur-chunk",d.textContent=n,d.style.setProperty("--i",String(l)),d.setAttribute("aria-hidden","true"),s.appendChild(d),l<i.length-1&&s.appendChild(document.createTextNode(" "))})}f.effect("blur-reveal",s=>{if(s.hasAttribute("data-effect-blur-reveal-init")||(s.setAttribute("data-effect-blur-reveal-init",""),f.prefersReducedMotion()))return;let t=s.classList.contains("line")?"line":"word",e=f.params(s).get("blur-reveal-delay")||"80ms";return s.style.setProperty("--blur-delay",e),t==="line"?$e(s):Re(s),{activate(){s.setAttribute("data-effect-active","")},cleanup(){}}});function qe(s,t,e,i){let r=0;function o(){r<=t.length?(s.firstChild.textContent=t.slice(0,r),r++,setTimeout(o,e)):i&&i()}o()}function Be(s,t,e){let i=s.firstChild.textContent,r=i.length;function o(){r>=0?(s.firstChild.textContent=i.slice(0,r),r--,setTimeout(o,t/2)):e&&e()}o()}function ze(s){let t=s.getAttribute("data-typewriter-text"),e=f.params(s),i=e.getNumber("typewriter-speed",50),r=e.getNumber("typewriter-delay",0),a=s.classList.contains("loop")?2e3:null;s.textContent="";let n=document.createTextNode("");if(s.appendChild(n),!s.classList.contains("no-cursor")){let c=document.createElement("span");c.className="vb-typewriter-cursor",c.textContent="|",c.setAttribute("aria-hidden","true"),s.appendChild(c)}function d(){qe(s,t,i,()=>{a!==null&&setTimeout(()=>{Be(s,i,()=>{setTimeout(d,400)})},a)})}setTimeout(d,r)}f.effect("typewriter",s=>{if(s.hasAttribute("data-effect-typewriter-init"))return;s.setAttribute("data-effect-typewriter-init","");let t=s.textContent.trim();if(s.setAttribute("data-typewriter-text",t),s.setAttribute("aria-label",t),!f.prefersReducedMotion())return s.textContent="",{activate(){ze(s)},cleanup(){}}});var $t="!<>-_\\/[]{}=+*^?#";function qt(s){return s[Math.floor(Math.random()*s.length)]}function Oe(s){let t=s.getAttribute("data-scramble-text"),e=f.params(s),i=e.getNumber("scramble-duration",1500),r=e.get("scramble-chars")||$t,o=e.getNumber("scramble-speed",30),a=t.length,n=0,l=Math.ceil(i/o);function d(){let c=n/l,h=Math.floor(c*a),u="";for(let p=0;p<a;p++)p<h?u+=t[p]:t[p]===" "?u+=" ":u+=qt(r);s.textContent=u,n++,n<=l?setTimeout(d,o):s.textContent=t}d()}f.effect("scramble",s=>{if(s.hasAttribute("data-effect-scramble-init"))return;s.setAttribute("data-effect-scramble-init","");let t=s.textContent.trim();if(s.setAttribute("data-scramble-text",t),s.setAttribute("aria-label",t),f.prefersReducedMotion())return;let e=f.params(s).get("scramble-chars")||$t;return s.textContent=t.replace(/\S/g,()=>qt(e)),{activate(){Oe(s)},cleanup(){}}});f.effect("animate-image",s=>{if(s.hasAttribute("data-effect-animate-image-init"))return;s.setAttribute("data-effect-animate-image-init","");let t=s,e=document.createElement("div");if(e.className="animate-image-wrapper",!t.parentNode)return;t.parentNode.insertBefore(e,t),e.appendChild(t);let i=document.createElement("button");i.type="button",i.className="animate-image-toggle",i.setAttribute("aria-label","Pause animation"),e.appendChild(i);let r=t.src,o=null,a=!1;function n(){let h=document.createElement("canvas");h.width=t.naturalWidth||t.width,h.height=t.naturalHeight||t.height;let u=h.getContext("2d");if(u){u.drawImage(t,0,0);try{o=h.toDataURL("image/png")}catch{o=null}}}function l(){a||(a=!0,t.setAttribute("data-animate-image-paused",""),i.setAttribute("aria-label","Play animation"),i.classList.add("paused"),o&&(t.src=o))}function d(){a&&(a=!1,t.removeAttribute("data-animate-image-paused"),i.setAttribute("aria-label","Pause animation"),i.classList.remove("paused"),t.src=r)}i.addEventListener("click",()=>a?d():l()),t.complete&&t.naturalWidth?n():t.addEventListener("load",n,{once:!0});let c=window.matchMedia("(prefers-reduced-motion: reduce)");return(c.matches||document.documentElement.dataset.motionReduced!==void 0)&&(t.complete?(n(),l()):t.addEventListener("load",()=>{n(),l()},{once:!0})),c.addEventListener("change",h=>{h.matches&&l()}),t.hasAttribute("data-animate-image-paused")&&(t.complete?(n(),a=!1,l()):t.addEventListener("load",()=>{n(),a=!1,l()},{once:!0})),{cleanup(){e.parentNode&&(e.parentNode.insertBefore(t,e),e.remove())}}});var F=null;async function Ot(){if(F)return;F=(await Promise.resolve().then(()=>(J(),X))).resolveEmoji}var bt="[data-emoji]",y=/:([a-z0-9_+-]+):/g,He=new Set(["SCRIPT","STYLE","CODE","PRE","TEXTAREA"]),Ue=new Set(["INPUT","TEXTAREA"]),Ve=100;async function Bt(s=document){let t=s.querySelectorAll(bt);t.length!==0&&(await Ot(),t.forEach(Ht))}function Ht(s){if(s.hasAttribute("data-emoji-init"))return;if(s.setAttribute("data-emoji-init",""),Ue.has(s.tagName)){Ge(s);return}let t=s.getAttribute("data-emoji-unknown")||"keep";if(zt(s,t),s.getAttribute("data-emoji-scan")==="observe"){let e=null;new MutationObserver(()=>{e&&clearTimeout(e),e=setTimeout(()=>{zt(s,t),e=null},Ve)}).observe(s,{childList:!0,subtree:!0,characterData:!0})}}function Ge(s){let t=!1;s.addEventListener("compositionstart",()=>{t=!0}),s.addEventListener("compositionend",()=>{t=!1,gt(s)}),s.addEventListener("input",()=>{t||gt(s)}),s.value&&y.test(s.value)&&(y.lastIndex=0,gt(s))}function gt(s){let t=s.value;y.lastIndex=0;let e,i="",r=0,o=0,a=s.selectionStart??t.length,n=!1;for(;(e=y.exec(t))!==null;){let d=e[0],c=e[1],h=F(c);if(i+=t.slice(r,e.index),h){i+=h.emoji,n=!0;let u=e.index+d.length;a>=u?o+=d.length-h.emoji.length:a>e.index&&(o+=a-e.index-h.emoji.length)}else i+=d;r=e.index+d.length}if(!n)return;i+=t.slice(r),s.value=i;let l=Math.max(0,a-o);s.setSelectionRange(l,l)}function zt(s,t){let e=document.createTreeWalker(s,NodeFilter.SHOW_TEXT,{acceptNode(r){let o=r.parentElement;return!o||He.has(o.tagName)||o.isContentEditable||o.hasAttribute("data-emoji-processed")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),i=[];for(;e.nextNode();)y.test(e.currentNode.textContent??"")&&i.push(e.currentNode),y.lastIndex=0;for(let r of i)We(r,t)}function We(s,t){let e=s.textContent;y.lastIndex=0;let i,r=0,o=[],a=!1;for(;(i=y.exec(e))!==null;){let n=i[1],l=F(n);i.index>r&&o.push(e.slice(r,i.index)),l?(o.push(l.emoji),a=!0):t==="strip"?a=!0:o.push(i[0]),r=i.index+i[0].length}a&&(r<e.length&&o.push(e.slice(r)),s.textContent=o.join(""))}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>Bt()):Bt();var Ke=new MutationObserver(s=>{let t=[];for(let e of s)for(let i of e.addedNodes){if(i.nodeType!==Node.ELEMENT_NODE)continue;let r=i;r.matches(bt)&&t.push(r),r.querySelectorAll(bt).forEach(o=>t.push(o))}t.length!==0&&Ot().then(()=>t.forEach(Ht))});Ke.observe(document.documentElement,{childList:!0,subtree:!0});
//# sourceMappingURL=vanilla-breeze-extras.js.map
