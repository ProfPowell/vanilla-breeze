var ee=Object.defineProperty;var O=(r,t)=>()=>(r&&(t=r(r=0)),t);var Lt=(r,t)=>{for(var e in t)ee(r,e,{get:t[e],enumerable:!0})};function Nt(r,t,e){let i=Math.pow(2,e),s=r*Math.PI/180,o=(t+180)/360*i,n=(1-Math.log(Math.tan(s)+1/Math.cos(s))/Math.PI)/2*i,a=Math.floor(o),l=Math.floor(n),c=Math.round((o-a)*256),h=Math.round((n-l)*256);return{tileX:a,tileY:l,pixelX:c,pixelY:h}}function Rt(r,t,e){let i=256*Math.pow(2,e),s=r/i*360-180;return{lat:Math.atan(Math.sinh(Math.PI*(1-2*t/i)))*180/Math.PI,lng:s}}function T(r,t,e,i){switch(r){case"carto-light":return`https://basemaps.cartocdn.com/light_all/${t}/${e}/${i}.png`;case"carto-dark":return`https://basemaps.cartocdn.com/dark_all/${t}/${e}/${i}.png`;default:return`https://tile.openstreetmap.org/${t}/${e}/${i}.png`}}var X=O(()=>{});var Pt={};Lt(Pt,{MapInteraction:()=>J});var J,It=O(()=>{X();J=class{#t;#i;#e;#r;#s;#a=0;#n=0;#o=15;#u=1;#l=19;#c=0;#m=0;#p=new Map;#h=null;#v=0;#b=0;#g=!1;#d=0;#f=0;constructor({shadow:t,host:e,lat:i,lng:s,zoom:o,provider:n,onDeactivate:a}){this.#t=t,this.#i=e,this.#r=n,this.#s=a,this.#o=o,this.#e=t.querySelector('[part="tiles"]'),this.#h=t.querySelector('[part="marker"]');let l=256*Math.pow(2,o),c=i*Math.PI/180;this.#a=(s+180)/360*l,this.#n=(1-Math.log(Math.tan(c)+1/Math.cos(c))/Math.PI)/2*l,this.#v=this.#a,this.#b=this.#n,this.#c=this.#i.offsetWidth||400,this.#m=this.#i.offsetHeight||300,this.#e.innerHTML="",this.#e.style.transform="",this.#h&&(this.#h.style.position="absolute",this.#h.style.top="",this.#h.style.left="",this.#e.appendChild(this.#h)),this.#y(),this.#k()}#y(){this.#e.addEventListener("pointerdown",this.#w),this.#e.addEventListener("wheel",this.#E,{passive:!1}),this.#i.addEventListener("keydown",this.#S)}#w=t=>{t.button===0&&(t.preventDefault(),this.#g=!0,this.#d=t.clientX,this.#f=t.clientY,this.#e.setPointerCapture(t.pointerId),this.#e.setAttribute("data-dragging",""),this.#e.addEventListener("pointermove",this.#A),this.#e.addEventListener("pointerup",this.#C))};#A=t=>{if(!this.#g)return;let e=t.clientX-this.#d,i=t.clientY-this.#f;this.#d=t.clientX,this.#f=t.clientY,this.#a-=e,this.#n-=i,this.#x(),this.#k()};#C=t=>{this.#g=!1,this.#e.releasePointerCapture(t.pointerId),this.#e.removeAttribute("data-dragging"),this.#e.removeEventListener("pointermove",this.#A),this.#e.removeEventListener("pointerup",this.#C),this.#M()};#E=t=>{t.preventDefault();let e=t.ctrlKey?-t.deltaY*.01:-Math.sign(t.deltaY),i=Math.round(Math.max(this.#u,Math.min(this.#l,this.#o+e)));if(i===this.#o)return;let s=this.#i.getBoundingClientRect(),o=t.clientX-s.left,n=t.clientY-s.top;this.#T(i,o,n)};#S=t=>{switch(t.key){case"ArrowLeft":t.preventDefault(),this.#a-=80,this.#x(),this.#k(),this.#M();break;case"ArrowRight":t.preventDefault(),this.#a+=80,this.#x(),this.#k(),this.#M();break;case"ArrowUp":t.preventDefault(),this.#n-=80,this.#x(),this.#k(),this.#M();break;case"ArrowDown":t.preventDefault(),this.#n+=80,this.#x(),this.#k(),this.#M();break;case"+":case"=":t.preventDefault(),this.#T(this.#o+1,this.#c/2,this.#m/2);break;case"-":t.preventDefault(),this.#T(this.#o-1,this.#c/2,this.#m/2);break;case"Escape":t.preventDefault(),this.#s();break}};#T(t,e,i){if(t=Math.max(this.#u,Math.min(this.#l,t)),t===this.#o)return;let s=this.#a-this.#c/2,o=this.#n-this.#m/2,n=s+e,a=o+i,l=Math.pow(2,t-this.#o);this.#a=n*l-e+this.#c/2,this.#n=a*l-i+this.#m/2,this.#v*=l,this.#b*=l,this.#o=t,this.#I(),this.#x(),this.#k(),this.#M()}#x(){let t=256*Math.pow(2,this.#o);this.#a=(this.#a%t+t)%t,this.#n=Math.max(this.#m/2,Math.min(t-this.#m/2,this.#n))}#k(){let t=-(this.#a-this.#c/2),e=-(this.#n-this.#m/2);this.#e.style.transform=`translate(${Math.round(t)}px, ${Math.round(e)}px)`,this.#R(),this.#j(),this.#P()}#R(){let t=this.#o,e=Math.pow(2,t),i=this.#a-this.#c/2,s=this.#n-this.#m/2,o=i+this.#c,n=s+this.#m,a=Math.floor(i/256)-1,l=Math.max(0,Math.floor(s/256)-1),c=Math.ceil(o/256)+1,h=Math.min(e,Math.ceil(n/256)+1);for(let d=l;d<h;d++)for(let p=a;p<c;p++){let m=(p%e+e)%e,f=`${t}/${m}/${d}`;this.#p.has(f)||this.#_(t,p,d,m)}}#_(t,e,i,s){let o=`${t}/${s}/${i}`;if(this.#p.has(o))return;let n=e*256,a=i*256,l=document.createElement("img");l.src=T(this.#r,t,s,i),l.alt="",l.draggable=!1,l.style.left=n+"px",l.style.top=a+"px",l.style.width="256px",l.style.height="256px",l._wx=n,l._wy=a,this.#p.set(o,l),this.#e.appendChild(l)}#j(){let t=this.#a-this.#c/2,e=this.#n-this.#m/2,i=512;for(let[s,o]of this.#p){let n=o._wx,a=o._wy;(n+256<t-i||n>t+this.#c+i||a+256<e-i||a>e+this.#m+i)&&(o.remove(),this.#p.delete(s))}}#P(){if(!this.#h)return;let t=this.#h.offsetWidth||32;this.#h.style.left=`${Math.round(this.#v-t/2)}px`,this.#h.style.top=`${Math.round(this.#b-t)}px`,this.#h.style.transform=""}#M(){let{lat:t,lng:e}=Rt(this.#a,this.#n,this.#o);this.#i.dispatchEvent(new CustomEvent("geo-map:move",{bubbles:!0,detail:{lat:+t.toFixed(6),lng:+e.toFixed(6),zoom:this.#o}}))}#I(){for(let t of this.#p.values())t.remove();this.#p.clear()}destroy(){if(this.#e.removeEventListener("pointerdown",this.#w),this.#e.removeEventListener("wheel",this.#E),this.#i.removeEventListener("keydown",this.#S),this.#e.removeEventListener("pointermove",this.#A),this.#e.removeEventListener("pointerup",this.#C),this.#h&&this.#h.parentNode===this.#e){let t=this.#t.querySelector('[part="container"]');t&&(t.insertBefore(this.#h,this.#e.nextSibling),this.#h.style.position="",this.#h.style.left="",this.#h.style.top="",this.#h.style.transform="")}this.#I(),this.#i.removeAttribute("data-interactive-active")}}});var Q={};Lt(Q,{EMOJI_ALIASES:()=>Ft,EMOJI_GROUPS:()=>ne,EMOJI_GROUP_ICONS:()=>le,EMOJI_GROUP_LABELS:()=>ae,EMOJI_MAP:()=>S,getByGroup:()=>he,resolveEmoji:()=>ce,searchEmoji:()=>de});function Dt(r){for(let[t,e,i,s]of r){if(S.has(t))continue;let o={shortcode:t,emoji:e,name:i,keywords:[],group:s};S.set(t,o),N.push(o)}}function ce(r){let t=S.get(r);if(t)return t;let e=Ft.get(r);return e&&S.get(e)||null}function he(r){let t=j.filter(i=>i.group===r),e=N.filter(i=>i.group===r);return e.length>0?t.concat(e):t}function de(r){let t=r.toLowerCase().trim(),e=N.length>0?j.concat(N):j;return t?e.filter(i=>i.shortcode.includes(t)||i.name.toLowerCase().includes(t)||i.keywords&&i.keywords.some(s=>s.includes(t))):e}var j,S,Ft,ne,ae,le,N,Z=O(()=>{j=[{shortcode:"smile",emoji:"\u{1F604}",name:"Smiling Face with Open Mouth",keywords:["happy","joy","laugh"],group:"smileys"},{shortcode:"grinning",emoji:"\u{1F600}",name:"Grinning Face",keywords:["happy","smile"],group:"smileys"},{shortcode:"laughing",emoji:"\u{1F606}",name:"Grinning Squinting Face",keywords:["happy","laugh"],group:"smileys"},{shortcode:"sweat_smile",emoji:"\u{1F605}",name:"Grinning Face with Sweat",keywords:["hot","relief"],group:"smileys"},{shortcode:"rofl",emoji:"\u{1F923}",name:"Rolling on the Floor Laughing",keywords:["lol","funny"],group:"smileys"},{shortcode:"joy",emoji:"\u{1F602}",name:"Face with Tears of Joy",keywords:["happy","cry","laugh"],group:"smileys"},{shortcode:"slightly_smiling_face",emoji:"\u{1F642}",name:"Slightly Smiling Face",keywords:["smile"],group:"smileys"},{shortcode:"upside_down_face",emoji:"\u{1F643}",name:"Upside-Down Face",keywords:["sarcasm","silly"],group:"smileys"},{shortcode:"wink",emoji:"\u{1F609}",name:"Winking Face",keywords:["flirt","joke"],group:"smileys"},{shortcode:"blush",emoji:"\u{1F60A}",name:"Smiling Face with Smiling Eyes",keywords:["happy","shy"],group:"smileys"},{shortcode:"innocent",emoji:"\u{1F607}",name:"Smiling Face with Halo",keywords:["angel","good"],group:"smileys"},{shortcode:"heart_eyes",emoji:"\u{1F60D}",name:"Smiling Face with Heart-Eyes",keywords:["love","crush"],group:"smileys"},{shortcode:"star_struck",emoji:"\u{1F929}",name:"Star-Struck",keywords:["wow","amazing"],group:"smileys"},{shortcode:"kissing_heart",emoji:"\u{1F618}",name:"Face Blowing a Kiss",keywords:["love","kiss"],group:"smileys"},{shortcode:"yum",emoji:"\u{1F60B}",name:"Face Savoring Food",keywords:["delicious","tasty"],group:"smileys"},{shortcode:"stuck_out_tongue",emoji:"\u{1F61B}",name:"Face with Tongue",keywords:["playful","silly"],group:"smileys"},{shortcode:"stuck_out_tongue_winking_eye",emoji:"\u{1F61C}",name:"Winking Face with Tongue",keywords:["silly","playful"],group:"smileys"},{shortcode:"zany_face",emoji:"\u{1F92A}",name:"Zany Face",keywords:["crazy","wild"],group:"smileys"},{shortcode:"hugs",emoji:"\u{1F917}",name:"Hugging Face",keywords:["hug","warm"],group:"smileys"},{shortcode:"thinking",emoji:"\u{1F914}",name:"Thinking Face",keywords:["hmm","consider"],group:"smileys"},{shortcode:"shushing_face",emoji:"\u{1F92B}",name:"Shushing Face",keywords:["quiet","secret"],group:"smileys"},{shortcode:"smirk",emoji:"\u{1F60F}",name:"Smirking Face",keywords:["sly","suggestive"],group:"smileys"},{shortcode:"unamused",emoji:"\u{1F612}",name:"Unamused Face",keywords:["bored","unimpressed"],group:"smileys"},{shortcode:"roll_eyes",emoji:"\u{1F644}",name:"Face with Rolling Eyes",keywords:["annoyed","whatever"],group:"smileys"},{shortcode:"grimacing",emoji:"\u{1F62C}",name:"Grimacing Face",keywords:["awkward","nervous"],group:"smileys"},{shortcode:"relieved",emoji:"\u{1F60C}",name:"Relieved Face",keywords:["calm","peaceful"],group:"smileys"},{shortcode:"pensive",emoji:"\u{1F614}",name:"Pensive Face",keywords:["sad","thoughtful"],group:"smileys"},{shortcode:"sleepy",emoji:"\u{1F62A}",name:"Sleepy Face",keywords:["tired","sleep"],group:"smileys"},{shortcode:"sleeping",emoji:"\u{1F634}",name:"Sleeping Face",keywords:["zzz","sleep"],group:"smileys"},{shortcode:"mask",emoji:"\u{1F637}",name:"Face with Medical Mask",keywords:["sick","health"],group:"smileys"},{shortcode:"nerd_face",emoji:"\u{1F913}",name:"Nerd Face",keywords:["geek","smart"],group:"smileys"},{shortcode:"sunglasses",emoji:"\u{1F60E}",name:"Smiling Face with Sunglasses",keywords:["cool","chill"],group:"smileys"},{shortcode:"confused",emoji:"\u{1F615}",name:"Confused Face",keywords:["puzzled","unsure"],group:"smileys"},{shortcode:"worried",emoji:"\u{1F61F}",name:"Worried Face",keywords:["anxious","concern"],group:"smileys"},{shortcode:"cry",emoji:"\u{1F622}",name:"Crying Face",keywords:["sad","tear"],group:"smileys"},{shortcode:"sob",emoji:"\u{1F62D}",name:"Loudly Crying Face",keywords:["sad","cry"],group:"smileys"},{shortcode:"angry",emoji:"\u{1F620}",name:"Angry Face",keywords:["mad","annoyed"],group:"smileys"},{shortcode:"rage",emoji:"\u{1F92C}",name:"Face with Symbols on Mouth",keywords:["angry","swear"],group:"smileys"},{shortcode:"exploding_head",emoji:"\u{1F92F}",name:"Exploding Head",keywords:["mind blown","shocked"],group:"smileys"},{shortcode:"flushed",emoji:"\u{1F633}",name:"Flushed Face",keywords:["embarrassed","shocked"],group:"smileys"},{shortcode:"scream",emoji:"\u{1F631}",name:"Face Screaming in Fear",keywords:["scared","horror"],group:"smileys"},{shortcode:"skull",emoji:"\u{1F480}",name:"Skull",keywords:["dead","death"],group:"smileys"},{shortcode:"clown_face",emoji:"\u{1F921}",name:"Clown Face",keywords:["joke","funny"],group:"smileys"},{shortcode:"ghost",emoji:"\u{1F47B}",name:"Ghost",keywords:["halloween","spooky"],group:"smileys"},{shortcode:"wave",emoji:"\u{1F44B}",name:"Waving Hand",keywords:["hello","goodbye"],group:"people"},{shortcode:"raised_hand",emoji:"\u270B",name:"Raised Hand",keywords:["stop","high five"],group:"people"},{shortcode:"ok_hand",emoji:"\u{1F44C}",name:"OK Hand",keywords:["perfect","nice"],group:"people"},{shortcode:"thumbsup",emoji:"\u{1F44D}",name:"Thumbs Up",keywords:["approve","good","yes"],group:"people"},{shortcode:"thumbsdown",emoji:"\u{1F44E}",name:"Thumbs Down",keywords:["disapprove","bad","no"],group:"people"},{shortcode:"clap",emoji:"\u{1F44F}",name:"Clapping Hands",keywords:["applause","bravo"],group:"people"},{shortcode:"raised_hands",emoji:"\u{1F64C}",name:"Raising Hands",keywords:["celebration","hooray"],group:"people"},{shortcode:"pray",emoji:"\u{1F64F}",name:"Folded Hands",keywords:["thanks","please","hope"],group:"people"},{shortcode:"handshake",emoji:"\u{1F91D}",name:"Handshake",keywords:["deal","agreement"],group:"people"},{shortcode:"point_up",emoji:"\u261D\uFE0F",name:"Index Pointing Up",keywords:["attention","important"],group:"people"},{shortcode:"point_right",emoji:"\u{1F449}",name:"Backhand Index Pointing Right",keywords:["direction","this"],group:"people"},{shortcode:"point_left",emoji:"\u{1F448}",name:"Backhand Index Pointing Left",keywords:["direction","that"],group:"people"},{shortcode:"point_down",emoji:"\u{1F447}",name:"Backhand Index Pointing Down",keywords:["direction","below"],group:"people"},{shortcode:"v",emoji:"\u270C\uFE0F",name:"Victory Hand",keywords:["peace","two"],group:"people"},{shortcode:"crossed_fingers",emoji:"\u{1F91E}",name:"Crossed Fingers",keywords:["luck","hope"],group:"people"},{shortcode:"muscle",emoji:"\u{1F4AA}",name:"Flexed Biceps",keywords:["strong","power"],group:"people"},{shortcode:"writing_hand",emoji:"\u270D\uFE0F",name:"Writing Hand",keywords:["write","note"],group:"people"},{shortcode:"eyes",emoji:"\u{1F440}",name:"Eyes",keywords:["look","see","watch"],group:"people"},{shortcode:"brain",emoji:"\u{1F9E0}",name:"Brain",keywords:["smart","think","mind"],group:"people"},{shortcode:"speaking_head",emoji:"\u{1F5E3}\uFE0F",name:"Speaking Head",keywords:["talk","announce"],group:"people"},{shortcode:"baby",emoji:"\u{1F476}",name:"Baby",keywords:["child","newborn"],group:"people"},{shortcode:"person_shrugging",emoji:"\u{1F937}",name:"Person Shrugging",keywords:["dunno","whatever"],group:"people"},{shortcode:"person_facepalming",emoji:"\u{1F926}",name:"Person Facepalming",keywords:["frustration","disbelief"],group:"people"},{shortcode:"person_raising_hand",emoji:"\u{1F64B}",name:"Person Raising Hand",keywords:["question","volunteer"],group:"people"},{shortcode:"ninja",emoji:"\u{1F977}",name:"Ninja",keywords:["stealth","hidden"],group:"people"},{shortcode:"dog",emoji:"\u{1F436}",name:"Dog Face",keywords:["puppy","pet"],group:"animals"},{shortcode:"cat",emoji:"\u{1F431}",name:"Cat Face",keywords:["kitten","pet"],group:"animals"},{shortcode:"mouse",emoji:"\u{1F42D}",name:"Mouse Face",keywords:["rodent"],group:"animals"},{shortcode:"rabbit",emoji:"\u{1F430}",name:"Rabbit Face",keywords:["bunny","easter"],group:"animals"},{shortcode:"fox",emoji:"\u{1F98A}",name:"Fox",keywords:["clever","sly"],group:"animals"},{shortcode:"bear",emoji:"\u{1F43B}",name:"Bear",keywords:["teddy","nature"],group:"animals"},{shortcode:"unicorn",emoji:"\u{1F984}",name:"Unicorn",keywords:["magic","fantasy"],group:"animals"},{shortcode:"bee",emoji:"\u{1F41D}",name:"Honeybee",keywords:["honey","buzz"],group:"animals"},{shortcode:"butterfly",emoji:"\u{1F98B}",name:"Butterfly",keywords:["pretty","nature"],group:"animals"},{shortcode:"turtle",emoji:"\u{1F422}",name:"Turtle",keywords:["slow","shell"],group:"animals"},{shortcode:"snake",emoji:"\u{1F40D}",name:"Snake",keywords:["reptile"],group:"animals"},{shortcode:"whale",emoji:"\u{1F433}",name:"Spouting Whale",keywords:["ocean","sea"],group:"animals"},{shortcode:"dolphin",emoji:"\u{1F42C}",name:"Dolphin",keywords:["ocean","smart"],group:"animals"},{shortcode:"eagle",emoji:"\u{1F985}",name:"Eagle",keywords:["bird","freedom"],group:"animals"},{shortcode:"owl",emoji:"\u{1F989}",name:"Owl",keywords:["wise","night"],group:"animals"},{shortcode:"penguin",emoji:"\u{1F427}",name:"Penguin",keywords:["cold","linux"],group:"animals"},{shortcode:"octopus",emoji:"\u{1F419}",name:"Octopus",keywords:["ocean","tentacle"],group:"animals"},{shortcode:"seedling",emoji:"\u{1F331}",name:"Seedling",keywords:["plant","grow"],group:"animals"},{shortcode:"evergreen_tree",emoji:"\u{1F332}",name:"Evergreen Tree",keywords:["nature","pine"],group:"animals"},{shortcode:"sunflower",emoji:"\u{1F33B}",name:"Sunflower",keywords:["flower","yellow"],group:"animals"},{shortcode:"rose",emoji:"\u{1F339}",name:"Rose",keywords:["flower","love"],group:"animals"},{shortcode:"apple",emoji:"\u{1F34E}",name:"Red Apple",keywords:["fruit","healthy"],group:"food"},{shortcode:"banana",emoji:"\u{1F34C}",name:"Banana",keywords:["fruit","yellow"],group:"food"},{shortcode:"grapes",emoji:"\u{1F347}",name:"Grapes",keywords:["fruit","wine"],group:"food"},{shortcode:"watermelon",emoji:"\u{1F349}",name:"Watermelon",keywords:["fruit","summer"],group:"food"},{shortcode:"avocado",emoji:"\u{1F951}",name:"Avocado",keywords:["guacamole","healthy"],group:"food"},{shortcode:"pizza",emoji:"\u{1F355}",name:"Pizza",keywords:["food","italian"],group:"food"},{shortcode:"hamburger",emoji:"\u{1F354}",name:"Hamburger",keywords:["burger","fast food"],group:"food"},{shortcode:"taco",emoji:"\u{1F32E}",name:"Taco",keywords:["mexican","food"],group:"food"},{shortcode:"sushi",emoji:"\u{1F363}",name:"Sushi",keywords:["japanese","fish"],group:"food"},{shortcode:"cookie",emoji:"\u{1F36A}",name:"Cookie",keywords:["sweet","biscuit"],group:"food"},{shortcode:"cake",emoji:"\u{1F382}",name:"Birthday Cake",keywords:["birthday","celebration"],group:"food"},{shortcode:"ice_cream",emoji:"\u{1F366}",name:"Soft Ice Cream",keywords:["dessert","cold"],group:"food"},{shortcode:"chocolate_bar",emoji:"\u{1F36B}",name:"Chocolate Bar",keywords:["sweet","candy"],group:"food"},{shortcode:"popcorn",emoji:"\u{1F37F}",name:"Popcorn",keywords:["movie","snack"],group:"food"},{shortcode:"coffee",emoji:"\u2615",name:"Hot Beverage",keywords:["tea","drink","morning"],group:"food"},{shortcode:"beer",emoji:"\u{1F37A}",name:"Beer Mug",keywords:["drink","bar"],group:"food"},{shortcode:"wine_glass",emoji:"\u{1F377}",name:"Wine Glass",keywords:["drink","alcohol"],group:"food"},{shortcode:"cocktail",emoji:"\u{1F378}",name:"Cocktail Glass",keywords:["drink","martini"],group:"food"},{shortcode:"hot_pepper",emoji:"\u{1F336}\uFE0F",name:"Hot Pepper",keywords:["spicy","chili"],group:"food"},{shortcode:"egg",emoji:"\u{1F95A}",name:"Egg",keywords:["breakfast","food"],group:"food"},{shortcode:"earth_americas",emoji:"\u{1F30E}",name:"Globe Americas",keywords:["world","planet"],group:"travel"},{shortcode:"earth_europe",emoji:"\u{1F30D}",name:"Globe Europe-Africa",keywords:["world","planet"],group:"travel"},{shortcode:"sun",emoji:"\u2600\uFE0F",name:"Sun",keywords:["weather","bright","warm"],group:"travel"},{shortcode:"moon",emoji:"\u{1F319}",name:"Crescent Moon",keywords:["night","sleep"],group:"travel"},{shortcode:"star",emoji:"\u2B50",name:"Star",keywords:["favorite","rating"],group:"travel"},{shortcode:"star2",emoji:"\u{1F31F}",name:"Glowing Star",keywords:["sparkle","shine"],group:"travel"},{shortcode:"cloud",emoji:"\u2601\uFE0F",name:"Cloud",keywords:["weather","sky"],group:"travel"},{shortcode:"rainbow",emoji:"\u{1F308}",name:"Rainbow",keywords:["colorful","weather"],group:"travel"},{shortcode:"snowflake",emoji:"\u2744\uFE0F",name:"Snowflake",keywords:["cold","winter"],group:"travel"},{shortcode:"zap",emoji:"\u26A1",name:"High Voltage",keywords:["lightning","electric","fast"],group:"travel"},{shortcode:"fire",emoji:"\u{1F525}",name:"Fire",keywords:["hot","flame","lit"],group:"travel"},{shortcode:"ocean",emoji:"\u{1F30A}",name:"Water Wave",keywords:["sea","wave","surf"],group:"travel"},{shortcode:"airplane",emoji:"\u2708\uFE0F",name:"Airplane",keywords:["travel","flight"],group:"travel"},{shortcode:"rocket",emoji:"\u{1F680}",name:"Rocket",keywords:["launch","space","fast"],group:"travel"},{shortcode:"car",emoji:"\u{1F697}",name:"Automobile",keywords:["drive","vehicle"],group:"travel"},{shortcode:"house",emoji:"\u{1F3E0}",name:"House",keywords:["home","building"],group:"travel"},{shortcode:"tent",emoji:"\u26FA",name:"Tent",keywords:["camping","outdoor"],group:"travel"},{shortcode:"mountain",emoji:"\u26F0\uFE0F",name:"Mountain",keywords:["nature","hike"],group:"travel"},{shortcode:"desert_island",emoji:"\u{1F3DD}\uFE0F",name:"Desert Island",keywords:["beach","vacation"],group:"travel"},{shortcode:"volcano",emoji:"\u{1F30B}",name:"Volcano",keywords:["eruption","nature"],group:"travel"},{shortcode:"soccer",emoji:"\u26BD",name:"Soccer Ball",keywords:["football","sport"],group:"activities"},{shortcode:"basketball",emoji:"\u{1F3C0}",name:"Basketball",keywords:["sport","hoop"],group:"activities"},{shortcode:"tennis",emoji:"\u{1F3BE}",name:"Tennis",keywords:["sport","ball"],group:"activities"},{shortcode:"video_game",emoji:"\u{1F3AE}",name:"Video Game",keywords:["gaming","controller"],group:"activities"},{shortcode:"dart",emoji:"\u{1F3AF}",name:"Bullseye",keywords:["target","goal"],group:"activities"},{shortcode:"trophy",emoji:"\u{1F3C6}",name:"Trophy",keywords:["winner","champion"],group:"activities"},{shortcode:"medal",emoji:"\u{1F947}",name:"Gold Medal",keywords:["first","winner"],group:"activities"},{shortcode:"tada",emoji:"\u{1F389}",name:"Party Popper",keywords:["celebration","party"],group:"activities"},{shortcode:"confetti_ball",emoji:"\u{1F38A}",name:"Confetti Ball",keywords:["party","celebration"],group:"activities"},{shortcode:"balloon",emoji:"\u{1F388}",name:"Balloon",keywords:["party","birthday"],group:"activities"},{shortcode:"art",emoji:"\u{1F3A8}",name:"Artist Palette",keywords:["paint","creative"],group:"activities"},{shortcode:"musical_note",emoji:"\u{1F3B5}",name:"Musical Note",keywords:["music","song"],group:"activities"},{shortcode:"microphone",emoji:"\u{1F3A4}",name:"Microphone",keywords:["sing","karaoke"],group:"activities"},{shortcode:"guitar",emoji:"\u{1F3B8}",name:"Guitar",keywords:["music","rock"],group:"activities"},{shortcode:"dice",emoji:"\u{1F3B2}",name:"Game Die",keywords:["chance","random"],group:"activities"},{shortcode:"bulb",emoji:"\u{1F4A1}",name:"Light Bulb",keywords:["idea","bright"],group:"objects"},{shortcode:"computer",emoji:"\u{1F4BB}",name:"Laptop",keywords:["tech","work"],group:"objects"},{shortcode:"keyboard",emoji:"\u2328\uFE0F",name:"Keyboard",keywords:["type","computer"],group:"objects"},{shortcode:"phone",emoji:"\u{1F4F1}",name:"Mobile Phone",keywords:["cell","call"],group:"objects"},{shortcode:"camera",emoji:"\u{1F4F7}",name:"Camera",keywords:["photo","picture"],group:"objects"},{shortcode:"tv",emoji:"\u{1F4FA}",name:"Television",keywords:["watch","screen"],group:"objects"},{shortcode:"battery",emoji:"\u{1F50B}",name:"Battery",keywords:["charge","power"],group:"objects"},{shortcode:"electric_plug",emoji:"\u{1F50C}",name:"Electric Plug",keywords:["power","connect"],group:"objects"},{shortcode:"mag",emoji:"\u{1F50D}",name:"Magnifying Glass Left",keywords:["search","find"],group:"objects"},{shortcode:"lock",emoji:"\u{1F512}",name:"Locked",keywords:["security","private"],group:"objects"},{shortcode:"unlock",emoji:"\u{1F513}",name:"Unlocked",keywords:["open","access"],group:"objects"},{shortcode:"key",emoji:"\u{1F511}",name:"Key",keywords:["access","password"],group:"objects"},{shortcode:"hammer",emoji:"\u{1F528}",name:"Hammer",keywords:["tool","build"],group:"objects"},{shortcode:"wrench",emoji:"\u{1F527}",name:"Wrench",keywords:["tool","fix"],group:"objects"},{shortcode:"gear",emoji:"\u2699\uFE0F",name:"Gear",keywords:["settings","config"],group:"objects"},{shortcode:"link",emoji:"\u{1F517}",name:"Link",keywords:["chain","url"],group:"objects"},{shortcode:"paperclip",emoji:"\u{1F4CE}",name:"Paperclip",keywords:["attach","clip"],group:"objects"},{shortcode:"scissors",emoji:"\u2702\uFE0F",name:"Scissors",keywords:["cut","snip"],group:"objects"},{shortcode:"pen",emoji:"\u{1F58A}\uFE0F",name:"Pen",keywords:["write","sign"],group:"objects"},{shortcode:"pencil",emoji:"\u270F\uFE0F",name:"Pencil",keywords:["write","draw"],group:"objects"},{shortcode:"book",emoji:"\u{1F4D6}",name:"Open Book",keywords:["read","study"],group:"objects"},{shortcode:"memo",emoji:"\u{1F4DD}",name:"Memo",keywords:["note","write"],group:"objects"},{shortcode:"package",emoji:"\u{1F4E6}",name:"Package",keywords:["box","delivery"],group:"objects"},{shortcode:"mailbox",emoji:"\u{1F4EC}",name:"Open Mailbox with Raised Flag",keywords:["mail","letter"],group:"objects"},{shortcode:"bell",emoji:"\u{1F514}",name:"Bell",keywords:["notification","alert"],group:"objects"},{shortcode:"red_heart",emoji:"\u2764\uFE0F",name:"Red Heart",keywords:["love","valentine"],group:"symbols"},{shortcode:"orange_heart",emoji:"\u{1F9E1}",name:"Orange Heart",keywords:["love"],group:"symbols"},{shortcode:"yellow_heart",emoji:"\u{1F49B}",name:"Yellow Heart",keywords:["love","friendship"],group:"symbols"},{shortcode:"green_heart",emoji:"\u{1F49A}",name:"Green Heart",keywords:["love","nature"],group:"symbols"},{shortcode:"blue_heart",emoji:"\u{1F499}",name:"Blue Heart",keywords:["love","trust"],group:"symbols"},{shortcode:"purple_heart",emoji:"\u{1F49C}",name:"Purple Heart",keywords:["love"],group:"symbols"},{shortcode:"broken_heart",emoji:"\u{1F494}",name:"Broken Heart",keywords:["sad","breakup"],group:"symbols"},{shortcode:"sparkles",emoji:"\u2728",name:"Sparkles",keywords:["shine","magic","new"],group:"symbols"},{shortcode:"hundred",emoji:"\u{1F4AF}",name:"Hundred Points",keywords:["perfect","score"],group:"symbols"},{shortcode:"boom",emoji:"\u{1F4A5}",name:"Collision",keywords:["explosion","impact"],group:"symbols"},{shortcode:"speech_balloon",emoji:"\u{1F4AC}",name:"Speech Balloon",keywords:["talk","chat","message"],group:"symbols"},{shortcode:"thought_balloon",emoji:"\u{1F4AD}",name:"Thought Balloon",keywords:["think","dream"],group:"symbols"},{shortcode:"check_mark",emoji:"\u2705",name:"Check Mark Button",keywords:["done","yes","complete"],group:"symbols"},{shortcode:"x",emoji:"\u274C",name:"Cross Mark",keywords:["no","wrong","delete"],group:"symbols"},{shortcode:"warning",emoji:"\u26A0\uFE0F",name:"Warning",keywords:["caution","alert"],group:"symbols"},{shortcode:"no_entry",emoji:"\u26D4",name:"No Entry",keywords:["stop","forbidden"],group:"symbols"},{shortcode:"question",emoji:"\u2753",name:"Question Mark",keywords:["help","what"],group:"symbols"},{shortcode:"exclamation",emoji:"\u2757",name:"Exclamation Mark",keywords:["important","attention"],group:"symbols"},{shortcode:"arrow_right",emoji:"\u27A1\uFE0F",name:"Right Arrow",keywords:["next","forward"],group:"symbols"},{shortcode:"arrow_left",emoji:"\u2B05\uFE0F",name:"Left Arrow",keywords:["back","previous"],group:"symbols"},{shortcode:"arrow_up",emoji:"\u2B06\uFE0F",name:"Up Arrow",keywords:["above"],group:"symbols"},{shortcode:"arrow_down",emoji:"\u2B07\uFE0F",name:"Down Arrow",keywords:["below"],group:"symbols"},{shortcode:"recycle",emoji:"\u267B\uFE0F",name:"Recycling Symbol",keywords:["environment","green"],group:"symbols"},{shortcode:"infinity",emoji:"\u267E\uFE0F",name:"Infinity",keywords:["forever","loop"],group:"symbols"},{shortcode:"checkered_flag",emoji:"\u{1F3C1}",name:"Chequered Flag",keywords:["finish","race"],group:"flags"},{shortcode:"triangular_flag",emoji:"\u{1F6A9}",name:"Triangular Flag",keywords:["red flag","warning"],group:"flags"},{shortcode:"white_flag",emoji:"\u{1F3F3}\uFE0F",name:"White Flag",keywords:["surrender","peace"],group:"flags"},{shortcode:"rainbow_flag",emoji:"\u{1F3F3}\uFE0F\u200D\u{1F308}",name:"Rainbow Flag",keywords:["pride","lgbtq"],group:"flags"},{shortcode:"pirate_flag",emoji:"\u{1F3F4}\u200D\u2620\uFE0F",name:"Pirate Flag",keywords:["jolly roger","skull"],group:"flags"},{shortcode:"flag_us",emoji:"\u{1F1FA}\u{1F1F8}",name:"Flag: United States",keywords:["usa","america"],group:"flags"},{shortcode:"flag_gb",emoji:"\u{1F1EC}\u{1F1E7}",name:"Flag: United Kingdom",keywords:["uk","britain"],group:"flags"},{shortcode:"flag_fr",emoji:"\u{1F1EB}\u{1F1F7}",name:"Flag: France",keywords:["french"],group:"flags"},{shortcode:"flag_de",emoji:"\u{1F1E9}\u{1F1EA}",name:"Flag: Germany",keywords:["german"],group:"flags"},{shortcode:"flag_jp",emoji:"\u{1F1EF}\u{1F1F5}",name:"Flag: Japan",keywords:["japanese"],group:"flags"},{shortcode:"flag_kr",emoji:"\u{1F1F0}\u{1F1F7}",name:"Flag: South Korea",keywords:["korean"],group:"flags"},{shortcode:"flag_br",emoji:"\u{1F1E7}\u{1F1F7}",name:"Flag: Brazil",keywords:["brazilian"],group:"flags"},{shortcode:"flag_in",emoji:"\u{1F1EE}\u{1F1F3}",name:"Flag: India",keywords:["indian"],group:"flags"},{shortcode:"flag_ca",emoji:"\u{1F1E8}\u{1F1E6}",name:"Flag: Canada",keywords:["canadian","maple"],group:"flags"},{shortcode:"flag_au",emoji:"\u{1F1E6}\u{1F1FA}",name:"Flag: Australia",keywords:["australian"],group:"flags"}],S=new Map(j.map(r=>[r.shortcode,r])),Ft=new Map([["+1","thumbsup"],["-1","thumbsdown"],["heart","red_heart"],["thumbs_up","thumbsup"],["thumbs_down","thumbsdown"],["grin","grinning"],["laughing_crying","joy"],["lol","rofl"],["smiley","smile"],["cool","sunglasses"],["nerd","nerd_face"],["kiss","kissing_heart"],["hug","hugs"],["think","thinking"],["sad","cry"],["mad","angry"],["shrug","person_shrugging"],["facepalm","person_facepalming"],["raised_fist","muscle"],["pray_hands","pray"],["hi","wave"],["bye","wave"],["lightning","zap"],["flame","fire"],["hot","fire"],["bomb","boom"],["idea","bulb"],["laptop","computer"],["search","mag"],["party","tada"],["celebrate","tada"],["congrats","tada"],["check","check_mark"],["done","check_mark"],["yes","check_mark"],["no","x"],["wrong","x"],["love","red_heart"],["star_eyes","star_struck"],["mindblown","exploding_head"],["poop","skull"],["memo_pad","memo"],["notes","memo"],["coffee_cup","coffee"],["tea","coffee"]]),ne=["smileys","people","animals","food","travel","activities","objects","symbols","flags"],ae={smileys:"Smileys & Emotion",people:"People & Body",animals:"Animals & Nature",food:"Food & Drink",travel:"Travel & Places",activities:"Activities",objects:"Objects",symbols:"Symbols",flags:"Flags"},le={smileys:"\u{1F600}",people:"\u{1F44B}",animals:"\u{1F436}",food:"\u{1F355}",travel:"\u{1F30D}",activities:"\u{1F389}",objects:"\u{1F4A1}",symbols:"\u2764\uFE0F",flags:"\u{1F3C1}"},N=[];globalThis.__vbEmojiRegister=Dt;globalThis.__vbEmojiExtended&&(Dt(globalThis.__vbEmojiExtended),delete globalThis.__vbEmojiExtended)});var fi=window.matchMedia("(prefers-reduced-motion: reduce)");var Mt=new Map;function u(r,t,e={}){let i=e.priority??10,s={impl:t,bundle:e.bundle,contract:e.contract,priority:i},o=Mt.get(r);if(customElements.get(r)){if(!o||o.priority>=i){o&&o.priority===i&&o.impl!==t&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${o.bundle}" (priority ${o.priority}). Skipping "${e.bundle}".`);return}console.warn(`[VB Bundle] Tag <${r}> defined by "${o.bundle}" cannot be replaced (customElements.define is permanent). "${e.bundle}" has higher priority but arrived late.`);return}if(o&&o.priority>=i){o.priority===i&&console.warn(`[VB Bundle] Tag <${r}> already registered by "${o.bundle}". Skipping "${e.bundle}" (first wins at equal priority).`);return}Mt.set(r,s),customElements.define(r,t)}var U=class extends HTMLElement{#t=null;#i=null;#e=!1;#r=null;#s=null;#a=null;#n=null;#o=null;#u=null;#l=null;#c=null;#m=null;connectedCallback(){if(this.#t=this.querySelector("audio"),!this.#t)return;this.#i=this.querySelector(".track-list"),this.#t.removeAttribute("controls");let t=!this.shadowRoot;this.#p(),t&&(this.#v(),this.#b(),this.#g()),this.#A(),this.hasAttribute("autoplay")&&this.#t.play().catch(()=>{}),this.#m=()=>{let e=this.shadowRoot?.querySelector(".player");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},window.addEventListener("vb:theme-change",this.#m),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&this.#t.setAttribute("controls",""),this.#m&&window.removeEventListener("vb:theme-change",this.#m)}#p(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
      <style>${this.#h()}</style>
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
    `,this.#r=t.querySelector(".controls"),this.#s=t.querySelector(".play-btn"),this.#a=t.querySelector(".timeline"),this.#n=t.querySelector(".timeline-fill"),this.#o=t.querySelector(".volume"),this.#u=t.querySelector(".current-time"),this.#l=t.querySelector(".duration"),this.#c=t.querySelector(".track-title")}#h(){return`
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
      :host([state="playing"]) .icon-play { display: none; }
      :host([state="playing"]) .icon-pause { display: block; }

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
        font-size: var(--font-size-xs, 0.75rem);
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
      :host([muted]) .icon-vol { display: none; }
      :host([muted]) .icon-muted { display: block; }

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
    `}#v(){this.#t.addEventListener("timeupdate",()=>this.#y()),this.#t.addEventListener("loadedmetadata",()=>this.#w()),this.#t.addEventListener("play",()=>{this.#e=!0,this.setAttribute("state","playing"),this.#s.setAttribute("aria-label","Pause"),this.#E("audio-player:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#e=!1,this.setAttribute("state","paused"),this.#s.setAttribute("aria-label","Play"),this.#E("audio-player:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#e=!1,this.setAttribute("state","ended"),this.#s.setAttribute("aria-label","Play");let t=this.#i?.querySelector("li[data-audio-active]");t&&t.setAttribute("data-audio-played",""),this.#i&&this.#f(),this.#E("audio-player:ended",{src:this.#t.currentSrc})})}#b(){this.#s.addEventListener("click",()=>{this.#e?this.#t.pause():this.#t.play().catch(()=>{})}),this.#a.addEventListener("input",()=>{this.#t.duration&&(this.#t.currentTime=Number(this.#a.value)/100*this.#t.duration)}),this.#o.addEventListener("input",()=>{this.#t.volume=Number(this.#o.value),this.#t.muted=!1,this.removeAttribute("muted"),this.#o.style.setProperty("--_vol",this.#o.value)});let t=this.shadowRoot?.querySelector(".mute-btn");t&&(t.addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#o.style.setProperty("--_vol",this.#t.muted?"0":this.#o.value)}),this.addEventListener("keydown",e=>{let i=e.target;if(!(i?.tagName==="INPUT"||i?.tagName==="TEXTAREA"))switch(e.key){case" ":e.preventDefault(),this.#e?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":e.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10);break;case"ArrowRight":e.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10);break;case"m":case"M":this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#o.style.setProperty("--_vol",this.#t.muted?"0":this.#o.value);break}}),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"))}#g(){this.#i&&this.#i.addEventListener("click",t=>{let i=t.target?.closest("a[href]");i&&(t.preventDefault(),this.#d(i.href,i.closest("li")))})}#d(t,e){if(!this.#i)return;this.#i.querySelectorAll("li").forEach(s=>s.removeAttribute("data-audio-active")),e&&e.setAttribute("data-audio-active",""),this.#t.src=t,this.#t.play().catch(()=>{}),this.#A(),this.#E("audio-player:track-change",{src:t,title:e?.querySelector("a")?.textContent??""})}#f(){if(!this.#i)return;let t=[...this.#i.querySelectorAll("li")],e=t.findIndex(s=>s.hasAttribute("data-audio-active"));if(this.hasAttribute("shuffle")){let s=t.filter((o,n)=>n!==e);if(s.length){let o=s[Math.floor(Math.random()*s.length)],n=o.querySelector("a[href]");n&&this.#d(n.href,o)}return}let i=e+1;if(i<t.length){let s=t[i].querySelector("a[href]");s&&this.#d(s.href,t[i])}else if(this.hasAttribute("loop")){let s=t[0]?.querySelector("a[href]");s&&this.#d(s.href,t[0])}}#y(){let t=this.#t.currentTime,e=this.#t.duration||0,i=e?t/e*100:0;this.#u.textContent=this.#C(t),this.#a.value=String(i),this.#n.style.width=`${i}%`}#w(){let t=this.#t.duration||0;this.#l.textContent=this.#C(t)}#A(){if(!this.#c)return;if(this.#i){let e=this.#i.querySelector("li[data-audio-active] a");if(e){this.#c.textContent=e.textContent;return}}let t=this.#t.currentSrc||this.#t.querySelector("source")?.src||"";if(t){let e=t.split("/").pop().split("?")[0];this.#c.textContent=e.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}}#C(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/60),i=Math.floor(t%60).toString().padStart(2,"0");return`${e}:${i}`}#E(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};u("audio-player",U);var V=new Map;function ie(){if(!V.has("default"))try{V.set("default",new AudioContext)}catch{return null}return V.get("default")}var G=new WeakMap;function se(r,t){if(G.has(r))return G.get(r);let e=t.createMediaElementSource(r);return G.set(r,e),e}var W=class extends HTMLElement{#t=null;#i=null;#e=null;#r=null;#s=null;#a=null;#n=null;#o=null;#u=!0;#l=!1;#c=!1;#m=null;static get observedAttributes(){return["for","data-mode","data-fft-size"]}connectedCallback(){this.#c=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let t=!this.shadowRoot;this.#p(),this.#h(),t&&(this.#A(),this.#C()),this.#m=()=>{let e=this.shadowRoot?.querySelector("canvas");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},window.addEventListener("vb:theme-change",this.#m),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#g(),this.#o?.disconnect(),this.#m&&window.removeEventListener("vb:theme-change",this.#m)}attributeChangedCallback(t){t==="for"&&this.#h()}#p(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
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
    `,this.#t=t.querySelector("canvas")}#h(){let t=this.getAttribute("for");t&&(this.#e=document.getElementById(t),!(!this.#e||this.#e.tagName!=="AUDIO")&&(this.#l||this.#e.addEventListener("play",()=>this.#v(),{once:!0})))}#v(){if(this.#l||(this.#l=!0,this.#r=ie(),!this.#r))return;this.#r.state==="suspended"&&this.#r.resume();let t=parseInt(this.getAttribute("data-fft-size")||"256",10);this.#s=this.#r.createAnalyser(),this.#s.fftSize=t,this.#s.smoothingTimeConstant=.8,this.#a=se(this.#e,this.#r),this.#a.connect(this.#s),this.#s.connect(this.#r.destination),this.#b()}#b(){if(this.#c)return;let t=()=>{if(!this.#u||this.#c){this.#n=null;return}this.#n=requestAnimationFrame(t),this.#d()};this.#n=requestAnimationFrame(t)}#g(){this.#n&&(cancelAnimationFrame(this.#n),this.#n=null)}#d(){let t=this.#t,e=t.getContext("2d");if(!e)return;let i=t.width=t.offsetWidth*(window.devicePixelRatio||1),s=t.height=t.offsetHeight*(window.devicePixelRatio||1),o=getComputedStyle(this),n=o.getPropertyValue("--_color").trim()||"oklch(55% 0.2 260)",a=o.getPropertyValue("--_bg").trim();if(e.clearRect(0,0,i,s),a&&a!=="transparent"&&(e.fillStyle=a,e.fillRect(0,0,i,s)),!this.#s)return;let l=this.getAttribute("data-mode")||"bars",c=this.#s.frequencyBinCount,h=new Uint8Array(c);l==="waveform"?(this.#s.getByteTimeDomainData(h),this.#y(e,i,s,n,h)):l==="circle"?(this.#s.getByteFrequencyData(h),this.#w(e,i,s,n,h)):(this.#s.getByteFrequencyData(h),this.#f(e,i,s,n,h))}#f(t,e,i,s,o){let n=Math.min(o.length,64),a=e/n-1;t.fillStyle=s;for(let l=0;l<n;l++){let h=o[l]/255*i,d=l*(e/n);t.fillRect(d,i-h,a,h)}}#y(t,e,i,s,o){let n=e/o.length;t.strokeStyle=s,t.lineWidth=2,t.beginPath();for(let a=0;a<o.length;a++){let c=o[a]/128*i/2;a===0?t.moveTo(0,c):t.lineTo(a*n,c)}t.stroke()}#w(t,e,i,s,o){let n=e/2,a=i/2,l=Math.min(e,i)*.25,c=o.length;t.strokeStyle=s,t.lineWidth=2,t.beginPath();for(let h=0;h<c;h++){let d=h/c*Math.PI*2,p=o[h]/255*(l*.8),m=l+p,f=n+m*Math.cos(d),b=a+m*Math.sin(d);h===0?t.moveTo(f,b):t.lineTo(f,b)}t.closePath(),t.stroke()}#A(){this.#o=new IntersectionObserver(([t])=>{this.#u=t.isIntersecting,this.#u&&this.#l&&!this.#n&&!this.#c&&this.#b()}),this.#o.observe(this)}#C(){window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",t=>{this.#c=t.matches,t.matches?this.#g():this.#l&&this.#u&&this.#b()})}};u("audio-visualizer",W);var Tt=[.5,.75,1,1.25,1.5,2],re=3e3,K=class extends HTMLElement{#t=null;#i=null;#e=!1;#r=null;#s=null;#a=null;#n=null;#o=null;#u=null;#l=null;#c=null;#m=null;#p=null;#h=null;#v=null;#b=null;#g=null;#d=null;#f=2;#y=null;#w=null;connectedCallback(){if(this.#t=this.querySelector("video"),!this.#t)return;this.#i=this.querySelector(".track-list"),this.#t.removeAttribute("controls");let t=!this.shadowRoot;this.#A(),t&&(this.#E(),this.#S(),this.#R(),this.#T()),this.hasAttribute("muted")&&(this.#t.muted=!0,this.setAttribute("muted","")),this.hasAttribute("autoplay")&&this.#t.play().catch(()=>{}),this.#x(),this.#y=()=>{let e=this.shadowRoot?.querySelector(".player");e&&(e.style.display="none",e.offsetHeight,e.style.display="")},window.addEventListener("vb:theme-change",this.#y),this.#w=()=>{let e=!!document.fullscreenElement;this.toggleAttribute("data-fullscreen",e),this.#v.setAttribute("aria-label",e?"Exit fullscreen":"Fullscreen"),this.#L("video-player:fullscreen",{active:e})},document.addEventListener("fullscreenchange",this.#w),this.setAttribute("data-upgraded",""),this.setAttribute("state","idle")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&this.#t.setAttribute("controls",""),this.#y&&window.removeEventListener("vb:theme-change",this.#y),this.#w&&document.removeEventListener("fullscreenchange",this.#w),this.#d!=null&&clearTimeout(this.#d)}#A(){if(this.shadowRoot)return;let t=this.attachShadow({mode:"open"});t.innerHTML=`
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
    `,this.#r=t.querySelector(".controls"),this.#s=t.querySelector(".play-btn"),this.#a=t.querySelector(".play-overlay"),this.#n=t.querySelector(".timeline"),this.#o=t.querySelector(".timeline-fill"),this.#u=t.querySelector(".timeline-buffer"),this.#l=t.querySelector(".volume"),this.#c=t.querySelector(".current-time"),this.#m=t.querySelector(".duration"),this.#p=t.querySelector(".speed-btn"),this.#h=t.querySelector(".captions-btn"),this.#v=t.querySelector(".fullscreen-btn"),this.#b=t.querySelector(".buffer-indicator"),this.#g=t.querySelector(".sr-status"),this.#t.querySelector('track[kind="captions"], track[kind="subtitles"]')||(this.#h.hidden=!0)}#C(){return`
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

      :host([state="playing"]) .play-overlay,
      :host([state="buffering"]) .play-overlay {
        opacity: 0;
        pointer-events: none;
      }

      :host([state="paused"]) .play-overlay {
        opacity: 0;
        pointer-events: none;
      }

      :host([state="ended"]) .play-overlay {
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

      :host([state="buffering"]) .buffer-indicator {
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
      :host([state="playing"]:not([controls])) .controls,
      :host([state="playing"]:not([controls])) .controls-gradient {
        opacity: 0;
        visibility: hidden;
      }

      :host([state="playing"]:not([controls])) {
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
      :host([state="playing"]) .icon-play { display: none; }
      :host([state="playing"]) .icon-pause { display: block; }

      /* \u2500\u2500 Fullscreen icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-fs-exit { display: none; }
      :host([data-fullscreen]) .icon-fs-enter { display: none; }
      :host([data-fullscreen]) .icon-fs-exit { display: block; }

      /* \u2500\u2500 Mute icons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .icon-muted { display: none; }
      :host([muted]) .icon-vol { display: none; }
      :host([muted]) .icon-muted { display: block; }

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
        font-size: var(--font-size-xs, 0.75rem);
        font-family: var(--font-mono, ui-monospace, monospace);
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        padding-inline: var(--size-2xs, 4px);
      }

      .time-sep { opacity: 0.6; }

      /* \u2500\u2500 Speed button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      .speed-btn {
        font-size: var(--font-size-xs, 0.75rem);
        font-weight: 600;
        min-width: 2.5rem;
        width: auto !important;
      }

      /* \u2500\u2500 Captions button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
      :host([captions]) .captions-btn {
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
        :host([state="playing"]:not([controls])) .controls,
        :host([state="playing"]:not([controls])) .controls-gradient {
          opacity: 1;
          visibility: visible;
        }

        :host([state="playing"]:not([controls])) {
          cursor: auto;
        }
      }
    `}#E(){this.#t.addEventListener("timeupdate",()=>this.#M()),this.#t.addEventListener("loadedmetadata",()=>this.#I()),this.#t.addEventListener("progress",()=>this.#$()),this.#t.addEventListener("play",()=>{this.#e=!0,this.setAttribute("state","playing"),this.#s.setAttribute("aria-label","Pause"),this.#N("Playing"),this.#L("video-player:play",{currentTime:this.#t.currentTime,src:this.#t.currentSrc})}),this.#t.addEventListener("pause",()=>{this.#e=!1,this.setAttribute("state","paused"),this.#s.setAttribute("aria-label","Play"),this.#x(),this.#N("Paused"),this.#L("video-player:pause",{currentTime:this.#t.currentTime})}),this.#t.addEventListener("ended",()=>{this.#e=!1,this.setAttribute("state","ended"),this.#s.setAttribute("aria-label","Play"),this.#x();let t=this.#i?.querySelector("li[data-video-active]");t&&t.setAttribute("data-video-played",""),this.#i&&this.#P(),this.#N("Ended"),this.#L("video-player:ended",{src:this.#t.currentSrc})}),this.#t.addEventListener("waiting",()=>{this.#e&&(this.setAttribute("state","buffering"),this.#N("Buffering"))}),this.#t.addEventListener("playing",()=>{this.getAttribute("state")==="buffering"&&this.setAttribute("state","playing")})}#S(){this.#a.addEventListener("click",o=>{o.stopPropagation(),this.#t.play().catch(()=>{})}),(this.shadowRoot?.querySelector(".player")).addEventListener("click",o=>{o.target.closest(".controls")||o.target.closest(".play-overlay")||(this.#e?this.#t.pause():this.#t.play().catch(()=>{}))}),this.#s.addEventListener("click",()=>{this.#e?this.#t.pause():this.#t.play().catch(()=>{})}),this.#n.addEventListener("input",()=>{this.#t.duration&&(this.#t.currentTime=Number(this.#n.value)/100*this.#t.duration)}),(this.shadowRoot?.querySelector(".skip-back-btn")).addEventListener("click",()=>{this.#t.currentTime=Math.max(0,this.#t.currentTime-10)}),(this.shadowRoot?.querySelector(".skip-forward-btn")).addEventListener("click",()=>{this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10)}),this.#l.addEventListener("input",()=>{this.#t.volume=Number(this.#l.value),this.#t.muted=!1,this.removeAttribute("muted"),this.#l.style.setProperty("--_vol",this.#l.value)}),(this.shadowRoot?.querySelector(".mute-btn")).addEventListener("click",()=>{this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#l.style.setProperty("--_vol",this.#t.muted?"0":this.#l.value)}),this.#p.addEventListener("click",()=>{this.#f=(this.#f+1)%Tt.length;let o=Tt[this.#f];this.#t.playbackRate=o;let n=this.#p.querySelector("span");n.textContent=`${o}x`,this.#p.setAttribute("aria-label",`Playback speed ${o}x`),this.#L("video-player:speed",{rate:o})}),this.#h.addEventListener("click",()=>{let o=this.#B();if(!o)return;let n=o.mode==="showing";o.mode=n?"hidden":"showing";let a=!n;this.toggleAttribute("captions",a),this.#h.setAttribute("aria-pressed",String(a)),this.#L("video-player:captions",{active:a,label:o.label})}),this.#v.addEventListener("click",()=>this.#q()),this.addEventListener("keydown",o=>this.#H(o)),this.hasAttribute("tabindex")||this.setAttribute("tabindex","0")}#T(){let t=this.shadowRoot?.querySelector(".player"),e=()=>{this.#x(),this.#d!=null&&clearTimeout(this.#d),this.#e&&(this.#d=setTimeout(()=>this.#k(),re))};t.addEventListener("mousemove",e),t.addEventListener("mouseenter",e),t.addEventListener("mouseleave",()=>{this.#e&&(this.#d!=null&&clearTimeout(this.#d),this.#d=setTimeout(()=>this.#k(),500))}),t.addEventListener("touchstart",()=>{this.hasAttribute("controls")?this.#k():e()},{passive:!0}),this.#r.addEventListener("mouseenter",()=>{this.#d!=null&&clearTimeout(this.#d),this.#x()}),this.#r.addEventListener("focusin",()=>{this.#d!=null&&clearTimeout(this.#d),this.#x()})}#x(){this.setAttribute("controls","")}#k(){this.removeAttribute("controls")}#R(){this.#i&&this.#i.addEventListener("click",t=>{let e=t.target.closest("a[href]");e&&(t.preventDefault(),this.#_(e.href,e.closest("li"),e))})}#_(t,e,i){this.#i.querySelectorAll("li").forEach(a=>a.removeAttribute("data-video-active")),e&&e.setAttribute("data-video-active",""),this.#t.src=t;let o=i?.getAttribute("data-poster");o&&(this.#t.poster=o);let n=i?.getAttribute("data-captions");this.#j(n),this.#t.play().catch(()=>{}),this.#L("video-player:track-change",{src:t,title:i?.textContent??""})}#j(t){if(this.#t.querySelectorAll("track[data-dynamic]").forEach(s=>s.remove()),t){let s=document.createElement("track");s.kind="captions",s.src=t,s.default=!0,s.setAttribute("data-dynamic",""),this.#t.appendChild(s),this.hasAttribute("captions")&&(s.track.mode="showing")}let i=this.#t.querySelector('track[kind="captions"], track[kind="subtitles"]');this.#h.hidden=!i}#P(){if(!this.#i)return;let t=[...this.#i.querySelectorAll("li")],e=t.findIndex(s=>s.hasAttribute("data-video-active"));if(this.hasAttribute("shuffle")){let s=t.filter((o,n)=>n!==e);if(s.length){let o=s[Math.floor(Math.random()*s.length)],n=o.querySelector("a[href]");n&&this.#_(n.href,o,n)}return}let i=e+1;if(i<t.length){let s=t[i].querySelector("a[href]");s&&this.#_(s.href,t[i],s)}else if(this.hasAttribute("loop")){let s=t[0]?.querySelector("a[href]");s&&this.#_(s.href,t[0],s)}}#M(){let t=this.#t.currentTime,e=this.#t.duration||0,i=e?t/e*100:0;this.#c.textContent=this.#D(t),this.#n.value=String(i),this.#n.setAttribute("aria-valuetext",this.#z(t)),this.#o.style.width=`${i}%`}#I(){let t=this.#t.duration||0;this.#m.textContent=this.#D(t)}#$(){let t=this.#t.buffered,e=this.#t.duration||0;if(t.length>0&&e){let i=t.end(t.length-1);this.#u.style.width=`${i/e*100}%`}}#q(){document.fullscreenElement?document.exitFullscreen():this.requestFullscreen().catch(()=>{this.#t.requestFullscreen?.().catch(()=>{})})}#B(){let t=this.#t.textTracks;for(let e=0;e<t.length;e++)if(t[e].kind==="captions"||t[e].kind==="subtitles")return t[e];return null}#H(t){if(!(t.target.tagName==="INPUT"||t.target.tagName==="TEXTAREA"))switch(t.key){case" ":case"k":case"K":t.preventDefault(),this.#e?this.#t.pause():this.#t.play().catch(()=>{});break;case"ArrowLeft":t.preventDefault(),this.#t.currentTime=Math.max(0,this.#t.currentTime-10),this.#x();break;case"ArrowRight":t.preventDefault(),this.#t.currentTime=Math.min(this.#t.duration||0,this.#t.currentTime+10),this.#x();break;case"ArrowUp":t.preventDefault(),this.#t.volume=Math.min(1,this.#t.volume+.05),this.#l.value=String(this.#t.volume),this.#l.style.setProperty("--_vol",String(this.#t.volume)),this.#x();break;case"ArrowDown":t.preventDefault(),this.#t.volume=Math.max(0,this.#t.volume-.05),this.#l.value=String(this.#t.volume),this.#l.style.setProperty("--_vol",String(this.#t.volume)),this.#x();break;case"m":case"M":this.#t.muted=!this.#t.muted,this.toggleAttribute("muted",this.#t.muted),this.#l.style.setProperty("--_vol",this.#t.muted?"0":this.#l.value);break;case"f":case"F":this.#q();break;case"c":case"C":this.#h.click();break;case"Escape":document.fullscreenElement&&document.exitFullscreen();break}}#D(t){if(!Number.isFinite(t))return"0:00";let e=Math.floor(t/3600),i=Math.floor(t%3600/60),s=Math.floor(t%60);return e>0?`${e}:${String(i).padStart(2,"0")}:${String(s).padStart(2,"0")}`:`${i}:${String(s).padStart(2,"0")}`}#z(t){if(!Number.isFinite(t))return"0 seconds";let e=Math.floor(t/3600),i=Math.floor(t%3600/60),s=Math.floor(t%60),o=[];return e>0&&o.push(`${e} hour${e!==1?"s":""}`),i>0&&o.push(`${i} minute${i!==1?"s":""}`),o.push(`${s} second${s!==1?"s":""}`),o.join(" ")}#N(t){this.#g&&(this.#g.textContent=t)}#L(t,e){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0,detail:e}))}};u("video-player",K);var jt=`
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
`;X();function oe(r){return`<svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24C24 5.373 18.627 0 12 0z" fill="${r}"/>
        <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`}var Y=class extends HTMLElement{static get observedAttributes(){return["lat","lng","zoom","marker","marker-color","provider","interactive","static-only","src","place"]}#t=null;#i=!1;constructor(){super(),this.attachShadow({mode:"open"})}get lat(){return parseFloat(this.getAttribute("lat")??"")}get lng(){return parseFloat(this.getAttribute("lng")??"")}get zoom(){let t=parseInt(this.getAttribute("zoom")??"",10);return t>=1&&t<=19?t:15}get showMarker(){return this.getAttribute("marker")!=="false"}get markerColor(){return this.getAttribute("marker-color")||"#e74c3c"}get provider(){return this.getAttribute("provider")||"osm"}get interactive(){let t=this.getAttribute("interactive");return t==="eager"||t==="none"?t:"click"}get staticOnly(){return this.hasAttribute("static-only")}#e(){let t=parseFloat(this.getAttribute("lat")??""),e=parseFloat(this.getAttribute("lng")??"");if(!isNaN(t)&&!isNaN(e))return{lat:t,lng:e};let i=this.getAttribute("src");if(i){let a=this.#r(i);if(a)return a}let s=this.querySelector("address[data-lat][data-lng]");if(s){let a=parseFloat(s.dataset.lat??""),l=parseFloat(s.dataset.lng??"");if(!isNaN(a)&&!isNaN(l))return{lat:a,lng:l}}let o=this.getAttribute("place");if(o){let a=this.#s(o);if(a)return a}let n=document.querySelector('meta[name="geo.position"]');if(n){let l=(n.getAttribute("content")||"").split(";");if(l.length===2){let c=parseFloat(l[0]),h=parseFloat(l[1]);if(!isNaN(c)&&!isNaN(h))return{lat:c,lng:h}}}return null}#r(t){let e=document.getElementById(t);if(!e)return null;if(e.tagName==="ADDRESS"&&e.dataset.lat&&e.dataset.lng){let i=parseFloat(e.dataset.lat),s=parseFloat(e.dataset.lng);if(!isNaN(i)&&!isNaN(s))return{lat:i,lng:s}}return e.tagName==="SCRIPT"&&e.type==="application/ld+json"?this.#a(e):null}#s(t){let e=document.querySelectorAll('script[type="application/ld+json"]');for(let i of e)try{let s=JSON.parse(i.textContent);if(s.name===t){let o=s.geo;if(o){let n=parseFloat(o.latitude),a=parseFloat(o.longitude);if(!isNaN(n)&&!isNaN(a))return{lat:n,lng:a}}}}catch{}return null}#a(t){try{let i=JSON.parse(t.textContent).geo;if(i){let s=parseFloat(i.latitude),o=parseFloat(i.longitude);if(!isNaN(s)&&!isNaN(o))return{lat:s,lng:o}}}catch{}return null}connectedCallback(){this.render(),this.loadTiles(),this.#n(),this.setAttribute("data-upgraded","")}attributeChangedCallback(t,e,i){e!==i&&this.isConnected&&(this.#t&&this.#l(),this.render(),this.loadTiles(),this.#n())}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.destroy(),this.#t=null)}render(){let t=this.#e(),e=t?.lat??NaN,i=t?.lng??NaN,s=!isNaN(e)&&!isNaN(i);this.children.length>0?this.setAttribute("data-has-caption",""):this.removeAttribute("data-has-caption");let n=s?`Map of ${e.toFixed(4)}, ${i.toFixed(4)}`:"Map",a=this.showMarker&&s?`<div part="marker" aria-hidden="true">${oe(this.markerColor)}</div>`:"",c=s&&this.interactive!=="none"&&!this.staticOnly?'<div part="overlay"><button part="activate" aria-label="Activate interactive map" tabindex="0">Click to interact</button></div>':"";this.shadowRoot.innerHTML=`
            <style>${jt}</style>
            <div part="container">
                <div part="tiles" role="img" aria-label="${n}"></div>
                ${a}
                ${c}
                <div part="caption"><slot></slot></div>
                <div part="attribution">
                    <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap</a>
                </div>
            </div>
        `}loadTiles(){let t=this.#e(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i)){this.handleError("Missing or invalid lat/lng coordinates");return}let s=this.zoom,o=this.provider,{tileX:n,tileY:a,pixelX:l,pixelY:c}=Nt(e,i,s),h=this.shadowRoot.querySelector('[part="tiles"]');if(!h)return;h.innerHTML="";let d=this,p=d.offsetWidth||400,m=d.offsetHeight||300,f=Math.round(p/2-256-l),b=Math.round(m/2-256-c);h.style.transform=`translate(${f}px, ${b}px)`;let w=0,x=0,A=9;for(let z=-1;z<=1;z++)for(let H=-1;H<=1;H++){let Qt=n+H,Zt=a+z,te=T(o,s,Qt,Zt),k=document.createElement("img");k.src=te,k.alt="",k.loading="lazy",k.draggable=!1,k.addEventListener("load",()=>{w++,w+x===A&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:s}}))}),k.addEventListener("error",()=>{x++,x===A?this.handleError("Failed to load map tiles"):w+x===A&&this.dispatchEvent(new CustomEvent("geo-map:ready",{bubbles:!0,detail:{lat:e,lng:i,zoom:s}}))}),h.appendChild(k)}}#n(){let t=this.shadowRoot.querySelector('[part="overlay"]');if(!t)return;let e=t.querySelector('[part="activate"]');t.addEventListener("mouseenter",()=>this.#o(),{once:!0}),e&&e.addEventListener("focus",()=>this.#o(),{once:!0}),e&&e.addEventListener("click",()=>this.#u()),this.interactive==="eager"&&requestAnimationFrame(()=>this.#u())}#o(){if(this.#i)return;this.#i=!0;let t=this.provider,e;t==="carto-light"||t==="carto-dark"?e="https://basemaps.cartocdn.com":e="https://tile.openstreetmap.org";let i=document.createElement("link");i.rel="preconnect",i.href=e,i.crossOrigin="",document.head.appendChild(i)}async#u(){if(this.#t)return;let t=this.#e(),e=t?.lat??NaN,i=t?.lng??NaN;if(isNaN(e)||isNaN(i))return;let{MapInteraction:s}=await Promise.resolve().then(()=>(It(),Pt));this.hasAttribute("tabindex")||this.setAttribute("tabindex","0"),this.focus(),this.setAttribute("data-interactive-active",""),this.#t=new s({shadow:this.shadowRoot,host:this,lat:e,lng:i,zoom:this.zoom,provider:this.provider,onDeactivate:()=>this.#l()}),this.dispatchEvent(new CustomEvent("geo-map:activate",{bubbles:!0,detail:{lat:e,lng:i,zoom:this.zoom}}))}#l(){this.#t&&(this.#t.destroy(),this.#t=null,this.removeAttribute("data-interactive-active"),this.render(),this.loadTiles(),this.#n())}handleError(t){let e=this.shadowRoot.querySelector('[part="container"]');e&&(e.setAttribute("data-state","error"),e.setAttribute("data-error",t)),this.dispatchEvent(new CustomEvent("geo-map:error",{bubbles:!0,detail:{message:t}}))}};u("geo-map",Y);var R=null;async function ue(){return R||(R=await Promise.resolve().then(()=>(Z(),Q)),R)}var tt=8,pe=150,$t="vb-emoji-recent",et=class extends HTMLElement{#t;#i;#e;#r;#s;#a=!1;#n=[];#o=-1;#u=null;#l="";#c=null;#m=!1;#p=null;#h=null;async connectedCallback(){this.#c=await ue(),this.#m||(this.#v(),this.#m=!0),this.#t?.addEventListener("click",this.#y),document.addEventListener("click",this.#w),document.addEventListener("keydown",this.#A),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#u&&clearTimeout(this.#u),this.#t?.removeEventListener("click",this.#y),document.removeEventListener("click",this.#w),document.removeEventListener("keydown",this.#A)}#v(){this.#t=this.querySelector(":scope > [data-trigger]")||this.querySelector(":scope > button"),this.#t||(this.#t=document.createElement("button"),this.#t.type="button",this.#t.textContent="\u{1F600}",this.#t.setAttribute("data-trigger",""),this.prepend(this.#t)),this.#t.setAttribute("aria-haspopup","dialog"),this.#t.setAttribute("aria-expanded","false"),this.#t.setAttribute("aria-label",this.#t.getAttribute("aria-label")||"Open emoji picker"),this.#b()}#b(){this.#i=document.createElement("div"),this.#i.classList.add("picker"),this.#i.setAttribute("role","dialog"),this.#i.setAttribute("aria-label","Emoji picker"),this.#i.hidden=!0,this.#e=document.createElement("input"),this.#e.type="search",this.#e.placeholder="Search emoji\u2026",this.#e.setAttribute("aria-label","Search emoji"),this.#e.addEventListener("input",this.#C),this.#e.addEventListener("keydown",this.#E),this.#i.appendChild(this.#e),this.#s=document.createElement("nav"),this.#s.classList.add("categories"),this.#s.setAttribute("role","tablist"),this.#s.setAttribute("aria-label","Emoji categories");for(let t of this.#c.EMOJI_GROUPS){let e=document.createElement("button");e.type="button",e.setAttribute("role","tab"),e.setAttribute("aria-selected",t===this.#c.EMOJI_GROUPS[0]?"true":"false"),e.setAttribute("data-group",t),e.setAttribute("aria-label",this.#c.EMOJI_GROUP_LABELS[t]),e.title=this.#c.EMOJI_GROUP_LABELS[t],e.textContent=this.#c.EMOJI_GROUP_ICONS[t],e.addEventListener("click",this.#S),this.#s.appendChild(e)}this.#i.appendChild(this.#s),this.#r=document.createElement("div"),this.#r.classList.add("grid"),this.#r.setAttribute("role","grid"),this.#r.setAttribute("aria-label","Emoji"),this.#r.addEventListener("keydown",this.#T),this.#i.appendChild(this.#r),this.appendChild(this.#i),this.#g()}#g(t=null){this.#r.innerHTML="",this.#n=[],this.#o=-1;let e=this.#j();if(!this.#l&&e.length>0){let s=document.createElement("div");s.classList.add("group-label"),s.textContent="Recently Used",s.setAttribute("data-group-heading","recent"),this.#r.appendChild(s);for(let o of e){let n=this.#c.EMOJI_MAP.get(o);n&&this.#d(n)}}let i=t||null;if(i)if(i.length===0){let s=document.createElement("div");s.classList.add("no-results"),s.textContent="No emoji found",this.#r.appendChild(s)}else for(let s of i)this.#d(s);else for(let s of this.#c.EMOJI_GROUPS){let o=document.createElement("div");o.classList.add("group-label"),o.textContent=this.#c.EMOJI_GROUP_LABELS[s],o.setAttribute("data-group-heading",s),this.#r.appendChild(o);let n=this.#c.getByGroup(s);for(let a of n)this.#d(a)}}#d(t){let e=document.createElement("button");e.type="button",e.setAttribute("role","gridcell"),e.setAttribute("tabindex","-1"),e.setAttribute("data-shortcode",t.shortcode),e.title=`${t.name} :${t.shortcode}:`,e.textContent=t.emoji,e.addEventListener("click",this.#x),this.#r.appendChild(e),this.#n.push(e)}#f(){let t=this.getAttribute("for");if(!t)return;let e=document.getElementById(t);if(e){if(e.tagName==="INPUT"||e.tagName==="TEXTAREA"){let i=e;this.#p={start:i.selectionStart??i.value.length,end:i.selectionEnd??i.value.length},this.#h=null}else if(e.isContentEditable){let i=window.getSelection();i&&i.rangeCount>0&&(this.#h=i.getRangeAt(0).cloneRange()),this.#p=null}}}#y=t=>{t.stopPropagation(),this.toggle()};#w=t=>{this.#a&&!this.contains(t.target)&&this.close()};#A=t=>{t.key==="Escape"&&this.#a&&(t.preventDefault(),this.close(),this.#t?.focus())};#C=()=>{this.#u&&clearTimeout(this.#u),this.#u=setTimeout(()=>{if(this.#l=this.#e.value.trim(),this.#l){let t=this.#c.searchEmoji(this.#l);this.#g(t)}else this.#g()},pe)};#E=t=>{t.key==="ArrowDown"&&(t.preventDefault(),this.#n.length>0&&this.#k(0))};#S=t=>{let e=t.currentTarget.getAttribute("data-group");for(let s of this.#s.querySelectorAll('[role="tab"]'))s.setAttribute("aria-selected",s===t.currentTarget?"true":"false");this.#l&&(this.#e.value="",this.#l="",this.#g());let i=this.#r.querySelector(`[data-group-heading="${e}"]`);i&&i.scrollIntoView({block:"start",behavior:"smooth"})};#T=t=>{let e=this.#n.length;if(e!==0)switch(t.key){case"ArrowRight":t.preventDefault(),this.#k(this.#o+1);break;case"ArrowLeft":t.preventDefault(),this.#k(this.#o-1);break;case"ArrowDown":t.preventDefault(),this.#k(this.#o+tt);break;case"ArrowUp":t.preventDefault(),this.#o<tt?(this.#e.focus(),this.#o=-1):this.#k(this.#o-tt);break;case"Home":t.preventDefault(),this.#k(0);break;case"End":t.preventDefault(),this.#k(e-1);break;case"Enter":case" ":t.preventDefault(),this.#o>=0&&this.#n[this.#o].click();break;case"Tab":this.close();break}};#x=t=>{let e=t.currentTarget.getAttribute("data-shortcode"),i=this.#c.EMOJI_MAP.get(e);i&&(this.#P(e),this.#R(i),this.dispatchEvent(new CustomEvent("emoji-picker:select",{bubbles:!0,detail:{shortcode:i.shortcode,emoji:i.emoji,name:i.name,keywords:i.keywords}})),this.close(),this.#_())};#k(t){let e=this.#n.length;e!==0&&(t<0&&(t=0),t>=e&&(t=e-1),this.#o=t,this.#n[t].focus())}#R(t){let e=this.getAttribute("for");if(!e)return;let i=document.getElementById(e);if(i){if(i.tagName==="INPUT"||i.tagName==="TEXTAREA"){let s=i,o=this.#p?.start??s.value.length,n=this.#p?.end??o,a=s.value.slice(0,o),l=s.value.slice(n);s.value=a+t.emoji+l;let c=o+t.emoji.length;s.setSelectionRange(c,c),this.#p={start:c,end:c},i.dispatchEvent(new Event("input",{bubbles:!0}))}else if(i.isContentEditable){i.focus();let s=window.getSelection();if(s&&this.#h){s.removeAllRanges(),s.addRange(this.#h);let o=s.getRangeAt(0);o.deleteContents();let n=document.createTextNode(t.emoji);o.insertNode(n),o.setStartAfter(n),o.collapse(!0),s.removeAllRanges(),s.addRange(o),this.#h=o.cloneRange()}else if(s){let o=document.createRange();o.selectNodeContents(i),o.collapse(!1);let n=document.createTextNode(t.emoji);o.insertNode(n),o.setStartAfter(n),o.collapse(!0),s.removeAllRanges(),s.addRange(o)}}}}#_(){let t=this.getAttribute("for");if(!t)return;let e=document.getElementById(t);e&&e.focus()}#j(){try{return JSON.parse(localStorage.getItem($t)||"[]")}catch{return[]}}#P(t){let e=parseInt(this.getAttribute("recent-limit")??"24",10)||24,i=this.#j();i=i.filter(s=>s!==t),i.unshift(t),i.length>e&&(i.length=e);try{localStorage.setItem($t,JSON.stringify(i))}catch{}}open(){this.#a||(this.#f(),this.#a=!0,this.setAttribute("open",""),this.#t?.setAttribute("aria-expanded","true"),this.#i.hidden=!1,this.#e.value="",this.#l="",this.#g(),requestAnimationFrame(()=>{this.#e.focus()}),this.dispatchEvent(new CustomEvent("emoji-picker:open",{bubbles:!0})))}close(){this.#a&&(this.#a=!1,this.removeAttribute("open"),this.#t?.setAttribute("aria-expanded","false"),this.#i.hidden=!0,this.dispatchEvent(new CustomEvent("emoji-picker:close",{bubbles:!0})))}toggle(){this.#a?this.close():this.open()}get isOpen(){return this.#a}};u("emoji-picker",et);var it=class r extends HTMLElement{#t=null;#i=null;#e=!1;#r=null;connectedCallback(){this.setAttribute("role","list"),this.#e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,this.#a(),this.#o(),this.#h(),this.#s(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),r.#S?.source===this&&(r.#S=null)}get draggableChildren(){return[...this.querySelectorAll(':scope > [draggable="true"]')]}get group(){return this.getAttribute("group")||null}get orientation(){return this.getAttribute("orientation")||"vertical"}get sortedOrder(){return this.draggableChildren.map(t=>t.dataset.id)}#s(){for(let t of this.draggableChildren)t.getAttribute("role")||t.setAttribute("role","listitem"),t.hasAttribute("tabindex")||t.setAttribute("tabindex","0"),t.hasAttribute("aria-grabbed")||t.setAttribute("aria-grabbed","false")}#a(){this.#t=document.createElement("div"),this.#t.setAttribute("role","status"),this.#t.setAttribute("aria-live","polite"),this.#t.setAttribute("aria-atomic","true"),this.#t.style.cssText="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);",this.prepend(this.#t)}#n(t){let e=this.#t;e&&(e.textContent="",requestAnimationFrame(()=>{e.textContent=t}))}#o(){this.addEventListener("pointerdown",t=>{this.#r=t.target}),this.addEventListener("dragstart",this.#u.bind(this)),this.addEventListener("dragover",this.#l.bind(this)),this.addEventListener("dragleave",this.#c.bind(this)),this.addEventListener("drop",this.#m.bind(this)),this.addEventListener("dragend",this.#p.bind(this))}#u(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let i=e.querySelector("[data-drag-handle]");if(i&&!i.contains(this.#r)){t.preventDefault();return}e.setAttribute("data-dragging",""),t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",e.dataset.id||""),t.dataTransfer.setData("application/x-drag-surface-group",this.group||"");let s=this.#f(e);r.#S={item:e,source:this,originalIndex:s},this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}#l(t){let e=r.#S;if(!e||(this.group||e.source.group)&&this.group!==e.source.group)return;t.preventDefault(),t.dataTransfer.dropEffect="move",this.setAttribute("data-drag-over","");let i=this.orientation==="horizontal"?t.clientX:t.clientY;this.#C(i)}#c(t){t.relatedTarget&&!this.contains(t.relatedTarget)&&(this.removeAttribute("data-drag-over"),this.#E())}#m(t){t.preventDefault(),this.removeAttribute("data-drag-over"),this.#E();let e=r.#S;if(!e)return;let{item:i,source:s,originalIndex:o}=e,n=this.orientation==="horizontal"?t.clientX:t.clientY,a=this.#A(n);if(s===this){this.#y(i,a),this.#w();let l=this.#f(i);this.#b(i),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:i,itemId:i.dataset.id,oldIndex:o,newIndex:l,order:this.sortedOrder}}))}else this.#y(i,a),this.#w(),s.#w(),this.#b(i),this.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:i,itemId:i.dataset.id,fromSurface:s,toSurface:this,newIndex:this.#f(i),fromOrder:s.sortedOrder,toOrder:this.sortedOrder}}))}#p(){let t=r.#S;t?.item&&t.item.removeAttribute("data-dragging"),this.removeAttribute("data-drag-over"),this.#E(),r.#S=null,this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0}))}#h(){this.addEventListener("keydown",this.#v.bind(this))}#v(t){let e=t.target.closest('[draggable="true"]');if(!e||e.parentElement!==this||this.hasAttribute("disabled"))return;let i=e.getAttribute("aria-grabbed")==="true",s=this.orientation==="horizontal",o=s?"ArrowLeft":"ArrowUp",n=s?"ArrowRight":"ArrowDown";if(t.key===" "||t.key==="Enter"){if(t.preventDefault(),i){e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#w(),this.#b(e);let c=this.#f(e),h=this.draggableChildren;this.#n(`${this.#d(e)}, dropped at position ${c+1} of ${h.length}`),this.dispatchEvent(new CustomEvent("drag-surface:reorder",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,oldIndex:this.#i,newIndex:c,order:this.sortedOrder}})),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#i=null}else{this.#i=this.#f(e),e.setAttribute("aria-grabbed","true"),this.setAttribute("data-reorder-mode","");let c=this.draggableChildren;this.#n(`${this.#d(e)}, grabbed. Position ${this.#i+1} of ${c.length}. Use arrow keys to move, Enter to drop, Escape to cancel.`),this.dispatchEvent(new CustomEvent("drag-surface:reorder-start",{bubbles:!0}))}return}if(!i&&(t.key===o||t.key===n)){t.preventDefault();let c=this.draggableChildren,h=c.indexOf(e),d=t.key===o?Math.max(0,h-1):Math.min(c.length-1,h+1);d!==h&&c[d].focus();return}if(i&&(t.key===o||t.key===n)){t.preventDefault();let c=this.draggableChildren,h=c.indexOf(e),d=t.key===o?Math.max(0,h-1):Math.min(c.length-1,h+1);d!==h&&(this.#y(e,d),e.focus(),this.#n(`Position ${d+1} of ${c.length}`));return}let a=s?"ArrowUp":"ArrowLeft",l=s?"ArrowDown":"ArrowRight";if(i&&(t.key===a||t.key===l)){if(t.preventDefault(),!this.group)return;let c=t.key===l?1:-1,h=this.#g(c);if(!h)return;h.appendChild(e),h.#w(),this.#w(),h.#b(e),e.focus();let d=h.getAttribute("aria-label")||"next surface";h.#n(`Moved to ${d}`),h.dispatchEvent(new CustomEvent("drag-surface:transfer",{bubbles:!0,detail:{item:e,itemId:e.dataset.id,fromSurface:this,toSurface:h,newIndex:h.draggableChildren.indexOf(e),fromOrder:this.sortedOrder,toOrder:h.sortedOrder}})),this.removeAttribute("data-reorder-mode"),h.setAttribute("data-reorder-mode",""),this.#i=null;return}if(i&&t.key==="Escape"){t.preventDefault(),e.setAttribute("aria-grabbed","false"),this.removeAttribute("data-reorder-mode"),this.#i!=null&&(this.#y(e,this.#i),e.focus()),this.#n("Reorder cancelled"),this.dispatchEvent(new CustomEvent("drag-surface:reorder-end",{bubbles:!0})),this.#i=null;return}!i&&t.key==="Escape"&&(t.preventDefault(),e.blur())}#b(t){t.setAttribute("data-just-dropped",""),t.addEventListener("animationend",()=>{t.removeAttribute("data-just-dropped")},{once:!0}),setTimeout(()=>t.removeAttribute("data-just-dropped"),500)}#g(t){if(!this.group)return null;let e=[...document.querySelectorAll(`drag-surface[group="${this.group}"]`)];if(e.length<2)return null;e.sort((o,n)=>{let a=o.getBoundingClientRect(),l=n.getBoundingClientRect();return a.left-l.left||a.top-l.top});let i=e.indexOf(this);return e[i+t]||null}#d(t){return t.dataset.id||t.textContent.trim().slice(0,40)}#f(t){return this.draggableChildren.indexOf(t)}#y(t,e){let s=this.draggableChildren.filter(o=>o!==t)[e]||null;s?this.insertBefore(t,s):this.appendChild(t)}#w(){this.draggableChildren.forEach((t,e)=>{t.dataset.sortOrder=String(e+1)})}#A(t){let e=this.orientation==="horizontal",i=this.draggableChildren.filter(s=>!s.hasAttribute("data-dragging"));for(let s=0;s<i.length;s++){let o=i[s].getBoundingClientRect(),n=e?o.left+o.width/2:o.top+o.height/2;if(t<n)return s}return i.length}#C(t){this.#E();let e=this.orientation==="horizontal",i=this.draggableChildren.filter(s=>!s.hasAttribute("data-dragging"));for(let s=0;s<i.length;s++){let o=i[s].getBoundingClientRect(),n=e?o.left+o.width/2:o.top+o.height/2;if(t<n){i[s].setAttribute("data-drop-target","before");return}}i.length>0&&i[i.length-1].setAttribute("data-drop-target","after")}#E(){for(let t of this.querySelectorAll("[data-drop-target]"))t.removeAttribute("data-drop-target")}static#S=null};u("drag-surface",it);var st=/Mac|iPhone|iPad|iPod/.test(navigator.platform??""),qt={mac:{meta:"\u2318",cmd:"\u2318",alt:"\u2325",shift:"\u21E7",ctrl:"\u2303"},other:{meta:"Ctrl",cmd:"Ctrl",alt:"Alt",shift:"Shift",ctrl:"Ctrl"}};function _(r){let t=st?qt.mac:qt.other;return r.split("+").map(e=>{let i=e.trim().toLowerCase();return t[i]??i.toUpperCase()}).join(st?"":"+")}function Bt(r){let t=r.toLowerCase().split("+").map(i=>i.trim());return{key:t.pop()??"",meta:t.includes("meta")||t.includes("cmd"),ctrl:t.includes("ctrl"),shift:t.includes("shift"),alt:t.includes("alt")}}function zt(r,t){if(r.key.toLowerCase()!==t.key)return!1;let e,i;return st?(e=t.meta,i=t.ctrl):(e=!1,i=t.meta||t.ctrl),!(e!==r.metaKey||i!==r.ctrlKey||t.shift!==r.shiftKey||t.alt!==r.altKey)}var me=new Set(["INPUT","TEXTAREA","SELECT"]),L=[],Ht=!1;function fe(r){let t=me.has(r.target.tagName)||r.target.isContentEditable;for(let e of L)if(!(t&&!e.global)&&zt(r,e.descriptor)){r.preventDefault(),e.callback(r);return}}function ge(){Ht||(document.addEventListener("keydown",fe),Ht=!0)}function E(r,t,e={}){ge();let i=Bt(r),s={combo:r,descriptor:i,callback:t,global:e.global===!0};return L.find(n=>n.combo===r)&&console.warn(`[hotkey-bind] Shortcut "${r}" already bound. Last-connected-wins.`),L.unshift(s),function(){let a=L.indexOf(s);a!==-1&&L.splice(a,1)}}var rt=class extends HTMLElement{#t;#i;#e;#r=[];#s=-1;#a=[];#n=null;#o=[];connectedCallback(){this.#u(),this.#l(),this.hasAttribute("discover")&&this.#b(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#n?.(),document.removeEventListener("vb:command-registry-change",this.#g)}#u(){this.#t=document.createElement("dialog"),this.#t.className="command-dialog",this.#t.addEventListener("click",i=>{i.target===this.#t&&this.close()});let t=document.createElement("div");t.className="command-search",this.#i=document.createElement("input"),this.#i.type="search",this.#i.placeholder=this.getAttribute("placeholder")||"Type a command...",this.#i.setAttribute("aria-label","Search commands"),this.#i.autocomplete="off",this.#i.addEventListener("input",this.#c),this.#i.addEventListener("keydown",this.#m),t.appendChild(this.#i),this.#e=document.createElement("div"),this.#e.className="command-list",this.#e.setAttribute("role","listbox"),this.#a=Array.from(this.querySelectorAll("command-group")),this.#a.forEach(i=>{let s=document.createElement("div");s.className="command-group-header",s.textContent=i.getAttribute("label")||"",s.setAttribute("role","presentation");let o=Array.from(i.querySelectorAll("command-item"));this.#e.appendChild(s),o.forEach(n=>{let a=document.createElement("button");a.className="command-option",a.setAttribute("role","option"),a.dataset.value=n.getAttribute("value")||"",a.dataset.searchText=n.textContent.toLowerCase().trim();let l=n.querySelector('[slot="icon"]');if(l){let d=document.createElement("span");d.className="command-icon",d.appendChild(l.cloneNode(!0)),a.appendChild(d)}let c=document.createElement("span");c.className="command-label",c.textContent=n.textContent.trim(),a.appendChild(c);let h=n.getAttribute("data-hotkey");if(h){let d=document.createElement("kbd");d.className="command-kbd",d.textContent=_(h),a.appendChild(d)}a.addEventListener("click",()=>{this.#v(a.dataset.value)}),this.#e.appendChild(a),this.#r.push({btn:a,header:s,group:i})})});let e=document.createElement("div");e.className="command-empty",e.textContent="No results found.",e.hidden=!0,this.#e.appendChild(e),this.#t.appendChild(t),this.#t.appendChild(this.#e),this.appendChild(this.#t)}#l(){let t=this.getAttribute("hotkey")||"meta+k";this.#n=E(t,()=>{this.#t.open?this.close():this.open()},{global:!0})}#c=()=>{let t=this.#i.value.toLowerCase().trim(),e=0,i=new Set;this.#r.forEach(({btn:o,header:n})=>{let a=!t||o.dataset.searchText.includes(t);o.hidden=!a,a&&(e++,i.add(n))}),this.#e.querySelectorAll(".command-group-header").forEach(o=>{o.hidden=!i.has(o)});let s=this.#e.querySelector(".command-empty");s&&(s.hidden=e>0),this.#s=-1,e>0&&this.#h(0)};#m=t=>{let e=this.#p();switch(t.key){case"ArrowDown":t.preventDefault(),this.#h(this.#s+1);break;case"ArrowUp":t.preventDefault(),this.#h(this.#s-1);break;case"Enter":t.preventDefault(),this.#s>=0&&e[this.#s]&&e[this.#s].btn.click();break;case"Escape":t.preventDefault(),this.close();break}};#p(){return this.#r.filter(({btn:t})=>!t.hidden)}#h(t){let e=this.#p();if(e.length===0)return;e.forEach(({btn:s})=>s.removeAttribute("data-active")),t<0&&(t=e.length-1),t>=e.length&&(t=0),this.#s=t;let{btn:i}=e[t];i.setAttribute("data-active",""),i.scrollIntoView({block:"nearest"})}#v(t){this.close(),this.dispatchEvent(new CustomEvent("command-palette:select",{bubbles:!0,detail:{value:t}}))}#b(){document.addEventListener("vb:command-registry-change",this.#g)}#g=()=>{this.#t?.open&&(this.#d(),this.#c())};#d(){if(!this.hasAttribute("discover"))return;let{getRegisteredCommands:t,scanAutoDiscoverable:e}=window.__commandRegistry||{};if(!t)return;this.#r=this.#r.filter(o=>!o.discovered),this.#o.forEach(o=>o.remove()),this.#o=[];let i=this.#e.querySelector(".command-empty"),s=t();for(let[o,n]of s){let a=document.createElement("div");a.className="command-group-header",a.textContent=o,a.setAttribute("role","presentation"),this.#e.insertBefore(a,i),this.#o.push(a);for(let l of n){if(this.contains(l.element))continue;let c=this.#f(l.label,l.icon,l.shortcut);c.dataset.value=`__discovered:${l.label}`,c.addEventListener("click",()=>{this.close(),l.element.click()}),this.#e.insertBefore(c,i),this.#r.push({btn:c,header:a,group:null,discovered:!0})}}if(this.getAttribute("discover")==="auto"&&e){let o=e(),n=new Map;for(let a of o){let l=n.get(a.group)||[];l.push(a),n.set(a.group,l)}for(let[a,l]of n){let c=document.createElement("div");c.className="command-group-header",c.textContent=a,c.setAttribute("role","presentation"),this.#e.insertBefore(c,i),this.#o.push(c);for(let h of l){if(this.contains(h.element))continue;let d=this.#f(h.label,h.icon,h.shortcut);d.dataset.value=`__auto:${h.label}`,d.dataset.auto="",d.addEventListener("click",()=>{this.close(),h.action?h.action():h.element.click()}),this.#e.insertBefore(d,i),this.#r.push({btn:d,header:c,group:null,discovered:!0})}}}}#f(t,e,i){let s=document.createElement("button");if(s.className="command-option",s.setAttribute("role","option"),s.dataset.searchText=t.toLowerCase(),e){let n=document.createElement("span");n.className="command-icon";let a=document.createElement("icon-wc");a.setAttribute("name",e),n.appendChild(a),s.appendChild(n)}let o=document.createElement("span");if(o.className="command-label",o.textContent=t,s.appendChild(o),i){let n=document.createElement("kbd");n.className="command-kbd",n.textContent=_(i),s.appendChild(n)}return s}open(){this.#t.open||(this.#d(),this.#t.showModal(),this.#i.value="",this.#c(),this.#i.focus(),this.dispatchEvent(new CustomEvent("command-palette:open",{bubbles:!0})))}close(){this.#t.open&&(this.#t.close(),this.dispatchEvent(new CustomEvent("command-palette:close",{bubbles:!0})))}get isOpen(){return this.#t?.open??!1}},ot=class extends HTMLElement{},nt=class extends HTMLElement{};u("command-palette",rt);u("command-group",ot);u("command-item",nt);var at=class extends HTMLElement{#t;#i=null;connectedCallback(){this.#e(),this.#i=E("shift+?",()=>{this.#t.open?this.#t.close():this.#r()}),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#i?.()}#e(){this.#t=document.createElement("dialog"),this.#t.className="shortcut-dialog",this.#t.addEventListener("click",t=>{t.target===this.#t&&this.#t.close()}),this.appendChild(this.#t)}#r(){this.#t.innerHTML="";let t=document.createElement("div");t.className="shortcut-header",t.innerHTML="<h2>Keyboard Shortcuts</h2>",this.#t.appendChild(t);let e=document.createElement("div");e.className="shortcut-body";let{getRegisteredCommands:i}=window.__commandRegistry||{},s=new Map;if(s.set("General",[{label:"Show keyboard shortcuts",shortcut:"shift+?"}]),i)for(let[o,n]of i())for(let a of n){if(!a.shortcut)continue;let l=s.get(o)||[];l.push({label:a.label,shortcut:a.shortcut}),s.set(o,l)}for(let[o,n]of s){let a=document.createElement("div");a.className="shortcut-group";let l=document.createElement("div");l.className="shortcut-group-header",l.textContent=o,a.appendChild(l);for(let c of n){let h=document.createElement("div");h.className="shortcut-row";let d=document.createElement("span");d.className="shortcut-label",d.textContent=c.label;let p=document.createElement("kbd");p.className="shortcut-kbd",p.textContent=_(c.shortcut),h.appendChild(d),h.appendChild(p),a.appendChild(h)}e.appendChild(a)}this.#t.appendChild(e),this.#t.showModal()}};u("short-cuts",at);var lt=class extends HTMLElement{#t;#i=!1;connectedCallback(){if([...this.children].length<2)return;let e=Number(this.getAttribute("position"))||50;this.#t=document.createElement("div"),this.#t.className="comparison-divider",this.#t.setAttribute("role","slider"),this.#t.setAttribute("aria-label","Comparison slider"),this.#t.setAttribute("aria-valuemin","0"),this.#t.setAttribute("aria-valuemax","100"),this.#t.setAttribute("aria-valuenow",String(e)),this.#t.setAttribute("tabindex","0"),this.appendChild(this.#t),this.#n(e),this.#t.addEventListener("pointerdown",this.#e),this.#t.addEventListener("keydown",this.#a),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.removeEventListener("pointerdown",this.#e),this.#t.removeEventListener("keydown",this.#a))}#e=t=>{t.preventDefault(),this.#i=!0,this.#t.setPointerCapture(t.pointerId),this.#t.addEventListener("pointermove",this.#r),this.#t.addEventListener("pointerup",this.#s)};#r=t=>{if(!this.#i)return;let e=this.getBoundingClientRect(),i=t.clientX-e.left,s=Math.min(100,Math.max(0,i/e.width*100));this.#n(s)};#s=t=>{this.#i=!1,this.#t.releasePointerCapture(t.pointerId),this.#t.removeEventListener("pointermove",this.#r),this.#t.removeEventListener("pointerup",this.#s)};#a=t=>{let e=t.shiftKey?10:1,i=Number(this.#t.getAttribute("aria-valuenow"));t.key==="ArrowLeft"||t.key==="ArrowDown"?(t.preventDefault(),this.#n(Math.max(0,i-e))):(t.key==="ArrowRight"||t.key==="ArrowUp")&&(t.preventDefault(),this.#n(Math.min(100,i+e)))};#n(t){this.style.setProperty("--_position",`${t}%`),this.#t.setAttribute("aria-valuenow",String(Math.round(t))),this.#t.style.left=`${t}%`,this.dispatchEvent(new CustomEvent("compare-surface:change",{detail:{position:t},bubbles:!0}))}};u("compare-surface",lt);var ct=class extends HTMLElement{#t;#i;#e;#r=!1;#s=50;#a=!1;#n=50;get#o(){return this.getAttribute("direction")==="vertical"}get#u(){return Number(this.getAttribute("min"))||10}get#l(){return Number(this.getAttribute("max"))||90}get position(){return this.#s}set position(t){this.#d(Number(t))}get collapsed(){return this.#a}set collapsed(t){t?this.#b():this.#g()}reset(){let t=Number(this.getAttribute("position"))||50;this.#a=!1,this.#d(t),this.#w()}connectedCallback(){let t=[...this.children];if(t.length<2)return;this.#i=t[0],this.#e=t[1];let i=this.#f()??(Number(this.getAttribute("position"))||50);this.#t=document.createElement("div"),this.#t.className="split-divider",this.#t.setAttribute("role","separator"),this.#t.setAttribute("aria-orientation",this.#o?"vertical":"horizontal"),this.#t.setAttribute("aria-valuenow",String(Math.round(i))),this.#t.setAttribute("aria-valuemin",String(this.#u)),this.#t.setAttribute("aria-valuemax",String(this.#l)),this.#t.setAttribute("aria-label","Resize panels"),this.#t.setAttribute("tabindex","0"),this.insertBefore(this.#t,this.#e),this.#d(i),this.#t.addEventListener("pointerdown",this.#c),this.#t.addEventListener("keydown",this.#h),this.hasAttribute("collapsible")&&this.#t.addEventListener("dblclick",this.#v),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.removeEventListener("pointerdown",this.#c),this.#t.removeEventListener("keydown",this.#h),this.#t.removeEventListener("dblclick",this.#v))}#c=t=>{t.preventDefault(),this.#r=!0,this.#t.setPointerCapture(t.pointerId),this.style.userSelect="none",this.#t.addEventListener("pointermove",this.#m),this.#t.addEventListener("pointerup",this.#p)};#m=t=>{if(!this.#r)return;let e=this.getBoundingClientRect(),i;this.#o?i=(t.clientY-e.top)/e.height*100:i=(t.clientX-e.left)/e.width*100,this.#a&&(this.#a=!1),this.#d(i)};#p=t=>{this.#r=!1,this.#t.releasePointerCapture(t.pointerId),this.style.userSelect="",this.#t.removeEventListener("pointermove",this.#m),this.#t.removeEventListener("pointerup",this.#p),this.#y()};#h=t=>{let e=t.shiftKey?10:1,i=this.#s,s=this.#o?["ArrowUp"]:["ArrowLeft"],o=this.#o?["ArrowDown"]:["ArrowRight"];s.includes(t.key)?(t.preventDefault(),this.#d(i-e),this.#y()):o.includes(t.key)?(t.preventDefault(),this.#d(i+e),this.#y()):t.key==="Home"?(t.preventDefault(),this.#d(this.#u),this.#y()):t.key==="End"&&(t.preventDefault(),this.#d(this.#l),this.#y())};#v=()=>{this.#a?this.#g():this.#b(),this.#y()};#b(){this.#n=this.#s,this.#a=!0,this.#i.style.flexBasis="0%",this.#i.style.overflow="hidden",this.#t.setAttribute("aria-valuenow","0"),this.#s=0,this.dispatchEvent(new CustomEvent("split-surface:collapse",{detail:{collapsed:!0},bubbles:!0}))}#g(){this.#a=!1,this.#i.style.overflow="auto",this.#d(this.#n),this.dispatchEvent(new CustomEvent("split-surface:collapse",{detail:{collapsed:!1},bubbles:!0}))}#d(t){let e=this.#a?0:Math.min(this.#l,Math.max(this.#u,t));this.#s=e,this.#i.style.flexBasis=`${e}%`,this.#i.style.flexGrow="0",this.#i.style.flexShrink="0",this.#i.style.overflow="auto",this.#e.style.flexGrow="1",this.#e.style.overflow="auto",this.#t.setAttribute("aria-valuenow",String(Math.round(e))),this.dispatchEvent(new CustomEvent("split-surface:resize",{detail:{position:e},bubbles:!0}))}#f(){let t=this.getAttribute("persist");if(!t)return null;try{let e=localStorage.getItem(`split-surface:${t}`);return e!==null?Number(e):null}catch{return null}}#y(){let t=this.getAttribute("persist");if(t)try{localStorage.setItem(`split-surface:${t}`,String(Math.round(this.#s)))}catch{}}#w(){let t=this.getAttribute("persist");if(t)try{localStorage.removeItem(`split-surface:${t}`)}catch{}}};u("split-surface",ct);var ht=class extends HTMLElement{#t;connectedCallback(){let t=this.getAttribute("value")||this.textContent.trim();if(!t)return;let e=parseInt(this.getAttribute("size")??"200",10)||200,i=parseInt(this.getAttribute("error-correction")??"1",10)||1;this.#t=document.createElement("canvas"),this.#t.width=e,this.#t.height=e,this.#t.setAttribute("role","img"),this.#t.setAttribute("aria-label",`QR code: ${t}`),this.#i(t,e,i),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}static get observedAttributes(){return["value","size"]}attributeChangedCallback(){if(!this.#t)return;let t=this.getAttribute("value")||this.textContent.trim();if(!t)return;let e=parseInt(this.getAttribute("size")??"200",10)||200,i=parseInt(this.getAttribute("error-correction")??"1",10)||1;this.#t.width=e,this.#t.height=e,this.#t.setAttribute("aria-label",`QR code: ${t}`),this.#i(t,e,i)}#i(t,e,i){let s=ve(t,i),o=this.#t.getContext("2d"),n=s.length,a=e/n,l=getComputedStyle(this),c=this.getAttribute("color")||l.color||"#000",h=this.getAttribute("background")||"transparent";o.clearRect(0,0,e,e),h!=="transparent"&&(o.fillStyle=h,o.fillRect(0,0,e,e)),o.fillStyle=c;for(let d=0;d<n;d++)for(let p=0;p<n;p++)s[d][p]&&o.fillRect(Math.round(p*a),Math.round(d*a),Math.ceil(a),Math.ceil(a));this.textContent="",this.appendChild(this.#t)}toDataURL(t="image/png"){return this.#t?.toDataURL(t)??""}},P=[[[26,7],[44,10],[70,15],[100,20],[134,26],[172,18],[196,20],[242,24],[292,30],[346,18]],[[26,10],[44,16],[70,26],[100,18],[134,24],[172,16],[196,18],[242,22],[292,22],[346,26]],[[26,13],[44,22],[70,18],[100,26],[134,18],[172,24],[196,18],[242,22],[292,20],[346,28]],[[26,17],[44,28],[70,22],[100,16],[134,22],[172,28],[196,26],[242,26],[292,24],[346,28]]],be=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,52]];function ve(r,t=1){let e=new TextEncoder().encode(r),i=ye(e.length,t),s=P[t][i-1][0],o=P[t][i-1][1],n=s-o,a=we(e,i,n),l=ke(a,n,o),c=i*4+17,h=Array.from({length:c},()=>new Uint8Array(c)),d=Array.from({length:c},()=>new Uint8Array(c));return Ae(h,d,c),Ee(h,d,i),Ce(h,d,c),Se(d,c),_e(h,d,l,c),Pe(h,d,c,t)}function ye(r,t){for(let e=1;e<=10;e++){let i=P[t][e-1][0],s=P[t][e-1][1],o=i-s,n=e<=9?8:16,a=Math.ceil((4+n)/8);if(r<=o-a)return e}return 10}function we(r,t,e){let i=[],s=(d,p)=>{for(let m=p-1;m>=0;m--)i.push(d>>m&1)};s(4,4);let o=t<=9?8:16;s(r.length,o);for(let d of r)s(d,8);let n=e*8,a=Math.min(4,n-i.length);for(s(0,a);i.length%8!==0;)i.push(0);let l=[236,17],c=0;for(;i.length<n;)s(l[c%2],8),c++;let h=[];for(let d=0;d<i.length;d+=8){let p=0;for(let m=0;m<8;m++)p=p<<1|(i[d+m]||0);h.push(p)}return h}function ke(r,t,e){let i=xe(e),s=new Uint8Array(t+e);for(let n=0;n<t;n++)s[n]=r[n];for(let n=0;n<t;n++){let a=s[n];if(a===0)continue;let l=I[a];for(let c=0;c<i.length;c++)s[n+c]^=M[(l+I[i[c]])%255]}let o=[...r.slice(0,t)];for(let n=0;n<e;n++)o.push(s[t+n]);return o}var M=new Uint8Array(512),I=new Uint8Array(256);(function(){let t=1;for(let e=0;e<255;e++)M[e]=t,I[t]=e,t<<=1,t>=256&&(t^=285);for(let e=255;e<512;e++)M[e]=M[e-255]})();function xe(r){let t=new Uint8Array([1]);for(let e=0;e<r;e++){let i=new Uint8Array(t.length+1),s=e;for(let o=0;o<t.length;o++)i[o]^=t[o],i[o+1]^=M[(I[t[o]]+s)%255];t=i}return t}function Ae(r,t,e){let i=[[0,0],[e-7,0],[0,e-7]];for(let[s,o]of i){for(let n=0;n<7;n++)for(let a=0;a<7;a++){let l=n===0||n===6||a===0||a===6||n>=2&&n<=4&&a>=2&&a<=4;r[s+n][o+a]=l?1:0,t[s+n][o+a]=1}for(let n=-1;n<=7;n++)for(let[a,l]of[[n,-1],[n,7],[-1,n],[7,n]]){let c=s+a,h=o+l;c>=0&&c<e&&h>=0&&h<e&&(r[c][h]=0,t[c][h]=1)}}}function Ee(r,t,e){if(e<2)return;let i=be[e-1];for(let s of i)for(let o of i)if(!t[s][o])for(let n=-2;n<=2;n++)for(let a=-2;a<=2;a++){let l=Math.abs(n)===2||Math.abs(a)===2||n===0&&a===0;r[s+n][o+a]=l?1:0,t[s+n][o+a]=1}}function Ce(r,t,e){for(let i=8;i<e-8;i++){let s=i%2===0?1:0;t[6][i]||(r[6][i]=s,t[6][i]=1),t[i][6]||(r[i][6]=s,t[i][6]=1)}}function Se(r,t){for(let e=0;e<=8;e++)e<t&&(r[8][e]=1),e<t&&(r[e][8]=1);for(let e=0;e<=7;e++)r[8][t-1-e]=1,r[t-1-e][8]=1;r[t-8][8]=1}function _e(r,t,e,i){let s=[];for(let a of e)for(let l=7;l>=0;l--)s.push(a>>l&1);let o=0,n=!0;for(let a=i-1;a>=1;a-=2){a===6&&(a=5);let l=n?Array.from({length:i},(c,h)=>i-1-h):Array.from({length:i},(c,h)=>h);for(let c of l)for(let h of[a,a-1])h<0||h>=i||t[c][h]||(r[c][h]=o<s.length?s[o]:0,o++);n=!n}}var Le=[30660,29427,32170,30877,26159,25368,27713,26998,21522,20773,24188,23371,17913,16590,20375,19104,13663,12392,16177,14854,9396,8579,11994,11245,5769,5054,7399,6608,1890,597,3340,2107];function Me(r,t){let i=[1,0,3,2][r]*8+t;return Le[i]}var Te=[(r,t)=>(r+t)%2===0,r=>r%2===0,(r,t)=>t%3===0,(r,t)=>(r+t)%3===0,(r,t)=>(Math.floor(r/2)+Math.floor(t/3))%2===0,(r,t)=>r*t%2+r*t%3===0,(r,t)=>(r*t%2+r*t%3)%2===0,(r,t)=>((r+t)%2+r*t%3)%2===0];function je(r,t,e,i){let s=r.map(n=>new Uint8Array(n)),o=Te[i];for(let n=0;n<e;n++)for(let a=0;a<e;a++)!t[n][a]&&o(n,a)&&(s[n][a]^=1);return s}function Ne(r,t,e,i){let s=Me(e,i),o=[[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]];for(let a=0;a<15;a++){let[l,c]=o[a];r[l][c]=s>>14-a&1}let n=[[8,t-1],[8,t-2],[8,t-3],[8,t-4],[8,t-5],[8,t-6],[8,t-7],[8,t-8],[t-7,8],[t-6,8],[t-5,8],[t-4,8],[t-3,8],[t-2,8],[t-1,8]];for(let a=0;a<15;a++){let[l,c]=n[a];r[l][c]=s>>14-a&1}r[t-8][8]=1}function Re(r,t){let e=0;for(let i=0;i<t;i++){let s=1;for(let o=1;o<t;o++)r[i][o]===r[i][o-1]?(s++,s===5?e+=3:s>5&&(e+=1)):s=1}for(let i=0;i<t;i++){let s=1;for(let o=1;o<t;o++)r[o][i]===r[o-1][i]?(s++,s===5?e+=3:s>5&&(e+=1)):s=1}for(let i=0;i<t-1;i++)for(let s=0;s<t-1;s++){let o=r[i][s];o===r[i][s+1]&&o===r[i+1][s]&&o===r[i+1][s+1]&&(e+=3)}return e}function Pe(r,t,e,i){let s=1/0,o=null;for(let n=0;n<8;n++){let a=je(r,t,e,n);Ne(a,e,i,n);let l=Re(a,e);l<s&&(s=l,o=a)}return o}u("qr-code",ht);var dt=class extends HTMLElement{#t;#i;#e;#r=!1;#s=0;#a=0;#n=0;#o=!1;#u=!1;get activated(){return this.#o}get#l(){let t=Number(this.getAttribute("threshold"));return Number.isNaN(t)||t<0?90:t>100?100:t}connectedCallback(){this.#u||(this.#c(),this.#u=!0),this.#t.addEventListener("pointerdown",this.#m),this.#t.addEventListener("keydown",this.#v),this.#t.addEventListener("transitionend",this.#b),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#t&&(this.#t.removeEventListener("pointerdown",this.#m),this.#t.removeEventListener("keydown",this.#v),this.#t.removeEventListener("transitionend",this.#b))}#c(){this.#e=document.createElement("div"),this.#e.className="slide-track",this.#i=document.createElement("span"),this.#i.className="slide-label",this.#i.textContent=this.getAttribute("label")||"Slide to confirm",this.#t=document.createElement("div"),this.#t.className="slide-handle",this.#t.setAttribute("role","slider"),this.#t.setAttribute("aria-valuemin","0"),this.#t.setAttribute("aria-valuemax","100"),this.#t.setAttribute("aria-valuenow","0"),this.#t.setAttribute("aria-label",this.getAttribute("label")||"Slide to confirm"),this.#t.setAttribute("tabindex","0"),this.#t.innerHTML='<icon-wc name="chevrons-right" size="sm"></icon-wc>',this.#e.append(this.#i,this.#t),this.textContent="",this.appendChild(this.#e),this.#f(0)}reset(){this.#o=!1,this.removeAttribute("data-activated"),this.#i.textContent=this.getAttribute("label")||"Slide to confirm",this.#t.removeAttribute("aria-disabled"),this.#t.setAttribute("tabindex","0"),this.#f(0),this.dispatchEvent(new CustomEvent("slide-accept:reset",{bubbles:!0}))}#m=t=>{if(!this.#o){if(t.preventDefault(),this.hasAttribute("transitioning")){let e=this.#t.getBoundingClientRect(),i=this.#e.getBoundingClientRect(),s=parseFloat(getComputedStyle(this.#e).getPropertyValue("--_handle-inset")||"0"),o=this.#t.offsetWidth,n=i.width-o-s*2,a=e.left-i.left-s;this.removeAttribute("transitioning"),this.#s=n>0?Math.max(0,Math.min(100,a/n*100)):0,this.#f(this.#s)}this.#r=!0,this.#a=t.clientX,this.#n=this.#s,this.#t.setPointerCapture(t.pointerId),this.setAttribute("data-dragging",""),this.#t.addEventListener("pointermove",this.#p),this.#t.addEventListener("pointerup",this.#h),this.#t.addEventListener("pointercancel",this.#h)}};#p=t=>{if(!this.#r)return;let e=this.#e.getBoundingClientRect().width-this.#t.offsetWidth;if(e<=0)return;let s=(t.clientX-this.#a)/e*100,o=Math.min(100,Math.max(0,this.#n+s));this.#f(o)};#h=t=>{this.#r&&(this.#r=!1,this.removeAttribute("data-dragging"),this.#t.releasePointerCapture(t.pointerId),this.#t.removeEventListener("pointermove",this.#p),this.#t.removeEventListener("pointerup",this.#h),this.#t.removeEventListener("pointercancel",this.#h),this.#s>=this.#l?this.#g():this.#d())};#v=t=>{if(this.#o)return;let e=t.shiftKey?20:5;t.key==="ArrowRight"?(t.preventDefault(),this.#f(Math.min(100,this.#s+e))):t.key==="ArrowLeft"?(t.preventDefault(),this.#f(Math.max(0,this.#s-e))):t.key==="End"?(t.preventDefault(),this.#g()):t.key==="Home"&&(t.preventDefault(),this.#f(0)),t.key==="ArrowRight"&&this.#s>=this.#l&&this.#g()};#b=()=>{this.removeAttribute("transitioning")};#g(){this.#o=!0,this.#f(100),this.setAttribute("data-activated",""),this.#i.textContent=this.getAttribute("activated-label")||"Confirmed!",this.#t.setAttribute("aria-disabled","true"),this.#t.removeAttribute("tabindex"),this.dispatchEvent(new CustomEvent("slide-accept:accept",{bubbles:!0}))}#d(){this.setAttribute("transitioning",""),this.#f(0),setTimeout(()=>{this.hasAttribute("transitioning")&&this.removeAttribute("transitioning")},500)}#f(t){this.#s=t,this.style.setProperty("--_slide-position",String(t)),this.#t.setAttribute("aria-valuenow",String(Math.round(t)))}};u("slide-accept",dt);var ut=class extends HTMLElement{static observedAttributes=["colors","names","layout","show-values","show-names","size"];connectedCallback(){this.#t(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(){this.isConnected&&this.#t()}#t(){let t=this.getAttribute("colors")||"",e=this.getAttribute("names")||"",i=this.getAttribute("layout")||"inline",s=this.getAttribute("size")||"md",o=this.hasAttribute("show-values"),n=this.hasAttribute("show-names")||e.length>0,a=this.#e(t),l=e?e.split(",").map(m=>m.trim()):[],h={sm:48,md:80,lg:120}[s]||80,d="display:flex;flex-wrap:wrap;gap:var(--size-xs,0.5rem)";i==="grid"?d=`display:grid;grid-template-columns:repeat(auto-fill,minmax(${h}px,1fr));gap:var(--size-xs,0.5rem)`:i==="list"&&(d="display:flex;flex-direction:column;gap:var(--size-xs,0.5rem)");let p=a.map((m,f)=>{let b=l[f]||"",w=this.#r(m),x=i==="list"?"display:flex;flex-direction:row;align-items:center;gap:0.75rem":`display:flex;flex-direction:column;align-items:center;gap:0.25rem;max-inline-size:${h}px`,A=i==="list"?36:h;return`<div class="swatch-wrap" role="listitem" style="${x}">
        <button type="button" class="color-box" data-index="${f}"
          style="background:${m};color:${w};width:${A}px;height:${A}px;border:1px solid oklch(0% 0 0/0.15);border-radius:var(--radius-s,0.25rem);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:var(--font-mono,monospace);position:relative;overflow:hidden;flex-shrink:0"
          title="Click to copy${b?": "+b:""}"
          aria-label="${b||"Color "+(f+1)}: ${m}">
          <span class="color-value" style="font-size:0.625rem;line-height:1.2;opacity:${o?"1":"0"};text-align:center;padding:2px 4px;word-break:break-all;transition:opacity 0.15s ease">${this.#i(m)}</span>
        </button>
        ${n&&b?`<span style="font-size:var(--font-size-xs,0.75rem);color:var(--color-text-muted,#666);text-align:center;max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b}</span>`:""}
      </div>`}).join("");this.innerHTML=`<div class="palette ${i}" role="list" aria-label="Color palette" style="${d}">${p}</div>`,this.querySelectorAll(".color-box").forEach(m=>{o||(m.addEventListener("pointerenter",()=>{let f=m.querySelector(".color-value");f&&(f.style.opacity="1")}),m.addEventListener("pointerleave",()=>{let f=m.querySelector(".color-value");f&&(f.style.opacity="0")})),m.addEventListener("click",()=>{let f=Number(m.dataset.index),b=a[f],w=l[f]||"";navigator.clipboard?.writeText(b),this.dispatchEvent(new CustomEvent("color-palette:select",{bubbles:!0,detail:{color:b,name:w,index:f}})),m.style.outline="3px solid currentColor",m.style.outlineOffset="2px",setTimeout(()=>{m.style.outline="",m.style.outlineOffset=""},600)})})}#i(t){if(t.startsWith("#"))return t;let e=t.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);return e?`${e[1]}% .${e[2].replace("0.","")}`:t.length>12?t.slice(0,12)+"\u2026":t}#e(t){if(!t)return[];let e=[],i=0,s="";for(let o of t)o==="("?i++:o===")"&&i--,o===","&&i===0?(e.push(s.trim()),s=""):s+=o;return s.trim()&&e.push(s.trim()),e}#r(t){let e=t.match(/oklch\(\s*([\d.]+)%?\s/);if(e){let i=parseFloat(e[1]);return(i>1?i/100:i)>.6?"#000":"#fff"}if(t.startsWith("#")){let i=t.replace("#",""),s=parseInt(i.substring(0,2),16)/255,o=parseInt(i.substring(2,4),16)/255,n=parseInt(i.substring(4,6),16)/255;return .2126*s+.7152*o+.0722*n>.4?"#000":"#fff"}return"#000"}};u("color-palette",ut);var pt=class extends HTMLElement{static observedAttributes=["font-family","label","sample","show-scale","show-weights","show-characters","weights"];connectedCallback(){this.#t(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(){this.isConnected&&this.#t()}#t(){let t=this.getAttribute("font-family")||"system-ui",e=this.getAttribute("label")||t.replace(/['"]/g,"").split(",")[0],i=this.getAttribute("sample")||"The quick brown fox jumps over the lazy dog",s=this.hasAttribute("show-scale"),o=this.hasAttribute("show-weights"),n=this.hasAttribute("show-characters"),l=(this.getAttribute("weights")||"300,400,500,600,700").split(",").map(h=>h.trim()),c="";if(c+=`<div class="specimen-header" style="font-family:${t}">
      <span class="specimen-label">${e}</span>
      <p class="specimen-sample" contenteditable="plaintext-only" spellcheck="false">${i}</p>
    </div>`,n&&(c+=`<div class="specimen-chars" style="font-family:${t}">
        <div class="char-row"><span class="char-label">Upper</span>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(h=>`<span>${h}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Lower</span>${"abcdefghijklmnopqrstuvwxyz".split("").map(h=>`<span>${h}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Digits</span>${"0123456789".split("").map(h=>`<span>${h}</span>`).join("")}</div>
        <div class="char-row"><span class="char-label">Punct</span>${"!@#$%^&*()_+-=[]{}|;:,.<>?".split("").map(h=>`<span>${h==="<"?"&lt;":h===">"?"&gt;":h==="&"?"&amp;":h}</span>`).join("")}</div>
      </div>`),o){c+='<div class="specimen-weights">';for(let h of l)c+=`<div class="weight-sample" style="font-family:${t};font-weight:${h}">
          <span class="weight-label">${h}</span>
          <span class="weight-text">Aa</span>
        </div>`;c+="</div>"}if(s){let h=[{name:"xs",rem:.75},{name:"sm",rem:.875},{name:"md",rem:1},{name:"lg",rem:1.125},{name:"xl",rem:1.25},{name:"2xl",rem:1.5},{name:"3xl",rem:1.875},{name:"4xl",rem:2.25},{name:"5xl",rem:3}];c+='<div class="specimen-scale">';for(let d of h)c+=`<div class="scale-step" style="font-family:${t};font-size:${d.rem}rem">
          <span class="scale-label">${d.name}</span>
          <span class="scale-text">${i.substring(0,30)}</span>
        </div>`;c+="</div>"}this.innerHTML=c}};u("type-specimen",pt);var mt=class extends HTMLElement{static observedAttributes=["tokens","prefix","show-values","label"];connectedCallback(){this.#t(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}attributeChangedCallback(){this.isConnected&&this.#t()}#t(){let t=this.getAttribute("tokens")||"3xs,2xs,xs,s,m,l,xl,2xl,3xl",e=this.getAttribute("prefix")||"--size-",i=this.getAttribute("show-values")!=="false",s=this.getAttribute("label")||"",o=t.split(",").map(a=>a.trim()),n="";s&&(n+=`<div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-text-muted,#666);margin-block-end:0.75rem;font-family:var(--font-sans,system-ui)">${s}</div>`),n+=`<div role="list" aria-label="${s||"Spacing scale"}" style="display:flex;flex-direction:column;gap:0.25rem">`;for(let a of o){let l=`${e}${a}`;n+=`<div role="listitem" style="display:grid;grid-template-columns:3rem 1fr auto;align-items:center;gap:0.75rem;min-block-size:1.75rem">
        <span style="font-family:var(--font-mono,monospace);font-size:0.875rem;color:var(--color-text-muted,#666);text-align:end">${a}</span>
        <div class="scale-bar" style="display:block;block-size:var(--size-m,1rem);min-inline-size:2px;inline-size:var(${l});background:var(--color-interactive,oklch(55% 0.2 260));border-radius:var(--radius-s,0.25rem)" aria-hidden="true"></div>
        ${i?'<span class="scale-value" style="font-family:var(--font-mono,monospace);font-size:0.75rem;color:var(--color-text-muted,#666);font-variant-numeric:tabular-nums;min-inline-size:3.5rem;text-align:end"></span>':""}
      </div>`}n+="</div>",this.innerHTML=n,i&&requestAnimationFrame(()=>{this.querySelectorAll(".scale-bar").forEach(a=>{let l=a.getBoundingClientRect().width,c=a.nextElementSibling;c&&(c.textContent=`${Math.round(l*100)/100}px`)})})}};u("spacing-specimen",mt);var ft=class extends HTMLElement{#t=null;static get observedAttributes(){return["position"]}get#i(){return this.getAttribute("persist")||"consent-banner"}get#e(){let t=this.getAttribute("expires");return t==="0"||t==="never"?0:t?parseInt(t,10):365}connectedCallback(){if(this.#t=this.querySelector("dialog"),!this.#t)return;this.getAttribute("trigger")&&document.addEventListener("click",this.#o);let t=this.#u();if(t&&!this.#c(t)){this.getAttribute("trigger")?this.hidden=!0:this.remove();return}this.#r(),this.setAttribute("data-upgraded","")}disconnectedCallback(){document.removeEventListener("click",this.#o),this.removeAttribute("data-upgraded")}#r(){(this.getAttribute("position")||"bottom")==="center"?(this.#t.showModal(),this.#t.addEventListener("cancel",this.#a)):this.#t.show(),this.addEventListener("click",this.#n)}#s(){this.#t.removeEventListener("cancel",this.#a),this.removeEventListener("click",this.#n),this.#t.close(),this.getAttribute("trigger")?this.hidden=!0:this.remove()}#a=t=>{t.preventDefault()};#n=t=>{let e=t.target.closest("button[value]");if(!e)return;let i=e.value;if(!["accept","reject","save"].includes(i))return;let s=[...this.querySelectorAll('input[type="checkbox"]')],o={};i==="accept"?s.forEach(n=>{o[n.name]=!0}):i==="reject"?s.forEach(n=>{o[n.name]=!!n.disabled}):s.forEach(n=>{o[n.name]=n.checked}),this.#l({preferences:o,action:i,timestamp:Date.now()}),this.dispatchEvent(new CustomEvent("consent-banner:change",{bubbles:!0,detail:{preferences:o,action:i}})),this.#s()};#o=t=>{let e=this.getAttribute("trigger");if(!e||!t.target.closest(e))return;t.preventDefault();let s=this.#u();if(s?.preferences)for(let[o,n]of Object.entries(s.preferences)){let a=this.querySelector(`input[type="checkbox"][name="${CSS.escape(o)}"]`);a&&!a.disabled&&(a.checked=n)}this.hidden=!1,this.#r()};#u(){try{let t=localStorage.getItem(this.#i);return t?JSON.parse(t):null}catch{return null}}#l(t){try{localStorage.setItem(this.#i,JSON.stringify(t))}catch{}}#c(t){let e=this.#e;return e===0?!1:Date.now()-(t.timestamp||0)>e*864e5}static reset(t="consent-banner"){try{localStorage.removeItem(t)}catch{}}static getConsent(t="consent-banner"){try{let e=localStorage.getItem(t);return e?JSON.parse(e):null}catch{return null}}};u("consent-banner",ft);var gt=class extends HTMLElement{#t=null;#i=null;#e=[];#r="";#s=0;#a=null;#n=null;#o=null;#u=null;#l=!1;#c=!1;#m=0;#p=null;#h=null;#v=null;#b=null;#g=null;#d=null;#f=null;static get observedAttributes(){return["speed","voice","for"]}attributeChangedCallback(t,e,i){if(e!==i&&(t==="for"&&(this.stop(),this.#C()),(t==="speed"||t==="voice")&&this.#l&&this.#k(),t==="speed"&&this.#g)){let s=this.#L(parseFloat(i)||1);this.#g.value=String(s),this.#d&&(this.#d.textContent=`${s}\xD7`)}}connectedCallback(){if(!("speechSynthesis"in window)){this.style.display="none";return}this.#y(),this.#C(),this.#j(),this.#u=this.#B(),this.#u.then(t=>this.#H(t)),window.addEventListener("beforeunload",this.#O),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.stop(),this.#P(),window.removeEventListener("beforeunload",this.#O)}play(){if(this.#c){this.resume();return}this.#l||this.#x(0)}pause(){!this.#l||this.#c||(speechSynthesis.pause(),this.#c=!0,this.#z(!0),this.#F("text-reader:pause"))}resume(){this.#c&&(speechSynthesis.resume(),this.#c=!1,this.#z(!1),this.#F("text-reader:resume"))}stop(){speechSynthesis.cancel(),this.#N(),this.#F("text-reader:stop")}get voices(){return this.#u||this.#B()}get speaking(){return this.#l}get paused(){return this.#c}get progress(){return this.#r.length?Math.min(this.#s/this.#r.length,1):0}#y(){let t=document.createElement("div");t.setAttribute("part","controls"),t.setAttribute("role","group"),t.setAttribute("aria-label","Article reader");let e=this.#w("play",this.getAttribute("label-play")||"Play","\u25B6");e.addEventListener("click",()=>this.play());let i=this.#w("pause",this.getAttribute("label-pause")||"Pause","\u23F8");i.hidden=!0,i.addEventListener("click",()=>this.pause());let s=this.#w("stop",this.getAttribute("label-stop")||"Stop","\u23F9");s.disabled=!0,s.addEventListener("click",()=>this.stop());let o=document.createElement("select");o.setAttribute("aria-label","Voice");let n=document.createElement("option");n.textContent="Loading voices\u2026",o.append(n),o.addEventListener("change",()=>{this.#l&&this.#k()});let a=document.createElement("label");a.setAttribute("data-speed-group","");let l=document.createElement("span");l.setAttribute("data-speed-value","");let c=this.#L(parseFloat(this.getAttribute("speed")??"1")||1);l.textContent=`${c}\xD7`;let h=document.createElement("input");h.type="range",h.min="0.5",h.max="2",h.step="0.1",h.value=String(c),h.setAttribute("aria-label","Speed"),h.addEventListener("input",()=>{let d=parseFloat(h.value);l.textContent=`${d}\xD7`,this.#l&&this.#k()}),a.append(l,h),this.#A("icon-play",e),this.#A("icon-pause",i),this.#A("icon-stop",s),t.append(e,i,s,o,a),this.prepend(t),this.#f=t,this.#p=e,this.#h=i,this.#v=s,this.#b=o,this.#g=h,this.#d=l}#w(t,e,i){let s=document.createElement("button");return s.type="button",s.setAttribute("part",`button ${t}`),s.setAttribute("aria-label",e),s.textContent=i,s}#A(t,e){let i=this.querySelector(`[slot="${t}"]`);i&&(i.removeAttribute("slot"),e.textContent="",e.append(i))}#C(){let t=this.getAttribute("for");if(!t){console.warn('<text-reader>: missing "for" attribute'),this.#E();return}if(this.#t=document.getElementById(t),!this.#t){console.warn(`<text-reader>: no element found with id="${t}"`),this.#E();return}this.#T(),this.#S()}#E(){this.#p&&(this.#p.disabled=!0),this.#v&&(this.#v.disabled=!0)}#S(){this.#p&&(this.#p.disabled=!1)}#T(){let t=this.#t;if(!t)return;let e=this.getAttribute("selectors")||"p,li",i=[...t.querySelectorAll(e)],s=n=>n.closest("pre")||n.closest("code")||n.closest('[aria-hidden="true"]');this.#e=[];let o=0;for(let n of i){if(s(n))continue;let a=n.textContent.trim();a&&(this.#e.push({element:n,text:a,speechStart:o,speechEnd:o+a.length}),o+=a.length+1)}this.#r=this.#e.map(n=>n.text).join(" ")}#x(t){if(!this.#r)return;let e=t>0?this.#r.slice(t):this.#r;if(!e.trim())return;let i=new SpeechSynthesisUtterance(e);i.rate=this.#L(parseFloat(this.#g?.value??"1")||1);let s=this.#b?.selectedOptions[0];if(s?.dataset.voiceUri){let o=speechSynthesis.getVoices().find(n=>n.voiceURI===s.dataset.voiceUri);o&&(i.voice=o)}i.onboundary=o=>{if(o.name!=="word")return;let n=t+o.charIndex;this.#s=n;let a=o.charLength;if(!a){let c=this.#r.slice(n).match(/^\S+/);a=c?c[0].length:1}this.#M(n,a),this.#F("text-reader:word",{word:this.#r.slice(n,n+a),charIndex:n,element:this.#$(n)?.element})},i.onend=()=>{let o=Date.now()-this.#m;this.#N(),this.#F("text-reader:end",{duration:o})},i.onerror=o=>{o.error==="interrupted"||o.error==="canceled"||(this.#N(),this.#F("text-reader:error",{error:o.error}))},this.#i=i,this.#l=!0,this.#c=!1,this.#m=Date.now(),this.#s=t,this.#D(!0),speechSynthesis.cancel(),speechSynthesis.speak(i),this.#R(),this.#F("text-reader:play",{voice:i.voice?.name,speed:i.rate})}#k(){let t=this.#s;speechSynthesis.cancel(),this.#_(),requestAnimationFrame(()=>this.#x(t))}#R(){this.#_(),this.#a=setInterval(()=>{if(!speechSynthesis.speaking){this.#_();return}speechSynthesis.pause(),speechSynthesis.resume()},1e4)}#_(){this.#a&&clearInterval(this.#a),this.#a=null}#j(){if(!CSS.highlights)return;let t=new CSSStyleSheet;t.replaceSync(`
      ::highlight(text-reader-word) {
        background-color: var(--text-reader-highlight, Mark);
        color: var(--text-reader-highlight-text, MarkText);
      }
    `),this.#n=t,document.adoptedStyleSheets=[...document.adoptedStyleSheets,t]}#P(){let t=this.#n;t&&(document.adoptedStyleSheets=document.adoptedStyleSheets.filter(e=>e!==t),this.#n=null),this.#I()}#M(t,e){if(!CSS.highlights||this.getAttribute("highlight")==="false")return;let i=this.#$(t);if(!i)return;let s=t-i.speechStart,o=this.#q(i.element,s,e);if(!o)return;let n=new Highlight(o);if(CSS.highlights.set("text-reader-word",n),this.#o=n,this.getAttribute("scroll")!=="false"){let a=o.getBoundingClientRect(),l=window.innerHeight;(a.top<0||a.bottom>l)&&i.element.scrollIntoView({behavior:"smooth",block:"nearest"})}}#I(){CSS.highlights&&CSS.highlights.delete("text-reader-word"),this.#o=null}#$(t){let e=this.#e,i=0,s=e.length-1;for(;i<=s;){let o=i+s>>>1,n=e[o];if(t<n.speechStart)s=o-1;else if(t>=n.speechEnd)i=o+1;else return n}return null}#q(t,e,i){let s=document.createTreeWalker(t,NodeFilter.SHOW_TEXT),o=0;for(;s.nextNode();){let n=s.currentNode,a=n.textContent??"";if(!a.trim())continue;let l=a.length;if(o+l>e){let c=e-o,h=document.createRange();h.setStart(n,Math.min(c,l));let d=c+i;return d<=l?h.setEnd(n,d):h.setEnd(n,l),h}o+=l}return null}async#B(){let t=speechSynthesis.getVoices();return t.length>0?t:new Promise(e=>{let i=()=>{speechSynthesis.removeEventListener("voiceschanged",i),e(speechSynthesis.getVoices())};speechSynthesis.addEventListener("voiceschanged",i),setTimeout(()=>{speechSynthesis.removeEventListener("voiceschanged",i),e(speechSynthesis.getVoices())},3e3)})}#H(t){if(!this.#b||!t.length)return;let e=this.#b;e.innerHTML="";let i=document.documentElement.lang||"en",s=t.filter(l=>l.lang.startsWith(i)),o=t.filter(l=>!l.lang.startsWith(i)),n=[...s,...o],a=this.getAttribute("voice");for(let l of n){let c=document.createElement("option");c.textContent=`${l.name} (${l.lang})`,c.dataset.voiceUri=l.voiceURI,a&&l.voiceURI===a&&(c.selected=!0),e.append(c)}if(!a){let l=s.find(c=>c.default)||s[0];if(l){let c=[...e.options].find(h=>h.dataset.voiceUri===l.voiceURI);c&&(c.selected=!0)}}}#D(t){!this.#p||!this.#h||!this.#v||(t?(this.#p.hidden=!0,this.#h.hidden=!1,this.#v.disabled=!1):(this.#p.hidden=!1,this.#h.hidden=!0,this.#v.disabled=!0))}#z(t){!this.#p||!this.#h||(this.#p.hidden=!t,this.#h.hidden=t)}#N(){this.#l=!1,this.#c=!1,this.#s=0,this.#i=null,this.#_(),this.#I(),this.#D(!1)}#L(t){return Math.round(Math.max(.5,Math.min(2,t))*10)/10}#F(t,e={}){this.dispatchEvent(new CustomEvent(t,{detail:e,bubbles:!0}))}#O=()=>{speechSynthesis.cancel()}};u("text-reader",gt);function bt(r){if(!r||typeof r!="string")return"";let t=document.createElement("template");return t.innerHTML=r,t.content.querySelectorAll("script, iframe, object, embed, form, base, link, meta, noscript").forEach(s=>s.remove()),t.content.querySelectorAll("*").forEach(s=>{for(let o of[...s.attributes]){if(o.name.startsWith("on")){s.removeAttribute(o.name);continue}if(["href","src","action","formaction","xlink:href"].includes(o.name)){let n=o.value.trim().toLowerCase();(n.startsWith("javascript:")||n.startsWith("data:text/html"))&&s.removeAttribute(o.name);continue}(o.name==="srcdoc"||o.name==="data"&&s.tagName==="OBJECT")&&s.removeAttribute(o.name)}}),t.innerHTML}var vt=class extends HTMLElement{#t=null;#i=null;#e=null;#r=new Map;#s=null;connectedCallback(){this.#a(),this.#n(),this.#l(),this.#o(),this.#d(),this.#c(),this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.removeEventListener("chat-input:send",this.#m),this.#e&&this.#e.removeEventListener("change",this.#p)}#a(){this.#t=this.querySelector(":scope > chat-thread"),this.#i=this.querySelector(":scope > chat-input"),this.#e=this.querySelector(":scope > header select[data-model-select]")}#n(){let t=this.querySelector(":scope > script[data-participants]");if(t)try{let e=JSON.parse(t.textContent);this.#r=new Map(Object.entries(e))}catch{console.warn("[chat-window] Invalid participant JSON")}}#o(){if(this.#t)for(let t of this.#t.querySelectorAll("chat-message[data-from]"))this.#u(t)}#u(t){let e=t.getAttribute("data-from");if(!e)return;let i=this.#r.get(e);i?.name?t.setAttribute("data-from-label",i.name):t.hasAttribute("data-from-label")||t.setAttribute("data-from-label",e)}#l(){if(!this.#e)return;let t=this.getAttribute("model");t?this.#e.value=t:this.#e.value&&this.setAttribute("model",this.#e.value)}#c(){this.addEventListener("chat-input:send",this.#m),this.#e&&this.#e.addEventListener("change",this.#p)}#m=async t=>{t.stopPropagation();let{message:e}=t.detail;if(!e||!this.#t)return;let i=this.#h("user",e,"user");this.#t.appendChild(i),this.#f(),this.#d();let s=this.#g(),o=this.#v(s);this.#t.appendChild(o),this.#f(),this.#i&&(this.#i.disabled=!0);let n=this.getAttribute("endpoint");if(n)try{let a=await this.#y(n,e);this.#b(o,a)}catch(a){this.#b(o,"<p>Sorry, something went wrong.</p>"),o.setAttribute("data-status","error"),this.dispatchEvent(new CustomEvent("chat-window:error",{bubbles:!0,detail:{error:a.message,status:a.status??0}}))}else this.dispatchEvent(new CustomEvent("chat-window:send",{bubbles:!0,detail:{message:e,typingElement:o}}));this.#i&&(this.#i.disabled=!1,this.#i.focus()),this.#f()};#p=()=>{let t=this.#e.value;this.setAttribute("model",t),this.dispatchEvent(new CustomEvent("chat-window:model-change",{bubbles:!0,detail:{model:t}}))};#h(t,e,i){let s=document.createElement("chat-message");s.setAttribute("data-role",t),i&&(s.setAttribute("data-from",i),this.#u(s));let o=document.createElement("chat-bubble");if(e.includes("<"))o.innerHTML=bt(e);else{let n=document.createElement("p");n.textContent=e,o.appendChild(n)}return s.appendChild(o),s}#v(t){let e=document.createElement("chat-message");if(e.setAttribute("data-role","agent"),e.setAttribute("data-status","typing"),t){e.setAttribute("data-from",t),this.#u(e);let n=this.#r.get(t)?.name??t;e.setAttribute("aria-label",`${n} is typing`)}else e.setAttribute("aria-label","Agent is typing");let i=this.getAttribute("model");i&&e.setAttribute("data-model",i);let s=document.createElement("chat-bubble");return e.appendChild(s),e}#b(t,e){let i=t.querySelector("chat-bubble");i&&(i.innerHTML=bt(e)),t.removeAttribute("data-status"),t.removeAttribute("aria-label")}#g(){for(let[t,e]of this.#r)if(e.role==="agent")return t;return null}#d(){if(!this.#t)return;this.#t.querySelector("chat-message")!==null?(this.#s&&(this.#s.remove(),this.#s=null),this.#t.hidden=!1):(this.#t.hidden=!0,this.#s||(this.#s=document.createElement("p"),this.#s.setAttribute("data-chat-empty",""),this.#s.textContent=this.getAttribute("empty-message")||"Send a message to start.",this.#t.insertAdjacentElement("afterend",this.#s)))}#f(){this.#t&&requestAnimationFrame(()=>{this.#t.scrollTop=this.#t.scrollHeight})}async#y(t,e){let i={message:e,model:this.getAttribute("model")||void 0},s=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});if(!s.ok){let n=new Error(`Chat request failed: ${s.status}`);throw n.status=s.status,n}let o=await s.json();return o.html??o.message??o.content??""}get model(){return this.getAttribute("model")??""}set model(t){this.setAttribute("model",t),this.#e&&(this.#e.value=t)}get participants(){return this.#r}set participants(t){this.#r=t instanceof Map?t:new Map(Object.entries(t)),this.#o()}clearThread(){if(this.#t){for(;this.#t.firstChild;)this.#t.removeChild(this.#t.firstChild);this.#d()}}appendMessage(t,e,i){if(!this.#t)return;let s=this.#h(t,e,i);this.#t.appendChild(s),this.#f(),this.#d()}};u("chat-window",vt);var yt=class extends HTMLElement{static formAssociated=!0;#t;#i;#e;#r;constructor(){super(),this.#t=this.attachInternals()}connectedCallback(){this.#i=this.querySelector(":scope > textarea, :scope textarea[data-grow]"),this.#e=this.querySelector("[data-send]"),this.#i&&(this.#i.addEventListener("keydown",this.#s),this.#i.addEventListener("input",this.#a),this.#e&&this.#e.addEventListener("click",this.#n),this.#u(),this.#l(),this.hasAttribute("autofocus")&&requestAnimationFrame(()=>this.#i.focus()),this.setAttribute("data-upgraded",""))}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#i&&(this.#i.removeEventListener("keydown",this.#s),this.#i.removeEventListener("input",this.#a)),this.#e&&this.#e.removeEventListener("click",this.#n),clearTimeout(this.#r)}#s=t=>{switch(t.key){case"Enter":t.shiftKey||(t.preventDefault(),this.#o());break;case"Escape":t.preventDefault(),this.reset();break}};#a=()=>{this.#u(),this.#l(),clearTimeout(this.#r),this.#r=setTimeout(()=>{this.dispatchEvent(new CustomEvent("chat-input:input",{bubbles:!0,detail:{value:this.value,length:this.value.length}}))},100)};#n=t=>{t.preventDefault(),this.#o()};#o(){let t=this.value.trim(),e=parseInt(this.getAttribute("minlength")??"1",10)||1;t.length<e||this.disabled||(this.dispatchEvent(new CustomEvent("chat-input:send",{bubbles:!0,detail:{message:t,from:null,model:null}})),this.reset())}#u(){let t=this.value;t?this.#t.setFormValue(t):this.#t.setFormValue(null)}#l(){let t=this.value,e=parseInt(this.getAttribute("maxlength")??"4000",10)||4e3;t.length>e?this.#t.setValidity({tooLong:!0},`Message exceeds ${e} characters`,this.#i):this.#t.setValidity({})}formResetCallback(){this.reset()}formStateRestoreCallback(t){!t||!this.#i||(this.#i.value=t,this.#u(),this.#l())}get value(){return this.#i?.value??""}set value(t){this.#i&&(this.#i.value=t,this.#i.dispatchEvent(new Event("input",{bubbles:!0})),this.#u(),this.#l())}get disabled(){return this.hasAttribute("disabled")}set disabled(t){t?(this.setAttribute("disabled",""),this.#i&&(this.#i.disabled=!0),this.#e&&(this.#e.disabled=!0)):(this.removeAttribute("disabled"),this.#i&&(this.#i.disabled=!1),this.#e&&(this.#e.disabled=!1))}focus(){this.#i?.focus()}reset(){this.#i&&(this.#i.value="",this.#i.dispatchEvent(new Event("input",{bubbles:!0})),this.#u(),this.#l())}static get observedAttributes(){return["disabled"]}attributeChangedCallback(t,e,i){if(t==="disabled"){let s=i!==null;this.#i&&(this.#i.disabled=s),this.#e&&(this.#e.disabled=s)}}};u("chat-input",yt);var F="http://www.w3.org/2000/svg";function Ie(r){return r.trim().split(/[\s,]+/).map(Number)}function Fe(r,t){let e=Ie(t);switch(r){case"rect":{let[i,s,o,n]=e;return{type:"rect",x:i,y:s,width:o-i,height:n-s}}case"circle":{let[i,s,o]=e;return{type:"circle",cx:i,cy:s,r:o}}case"poly":{let i=[];for(let s=0;s<e.length;s+=2)i.push([e[s],e[s+1]]);return{type:"poly",points:i}}default:return null}}function De(r){if(!r)return null;switch(r.type){case"rect":{let t=document.createElementNS(F,"rect");return t.setAttribute("x",String(r.x)),t.setAttribute("y",String(r.y)),t.setAttribute("width",String(r.width)),t.setAttribute("height",String(r.height)),t}case"circle":{let t=document.createElementNS(F,"circle");return t.setAttribute("cx",String(r.cx)),t.setAttribute("cy",String(r.cy)),t.setAttribute("r",String(r.r)),t}case"poly":{let t=document.createElementNS(F,"polygon");return t.setAttribute("points",r.points.map(e=>e.join(",")).join(" ")),t}default:return null}}function $e(r){if(!r)return{x:0,y:0,width:0,height:0};switch(r.type){case"rect":return{x:r.x,y:r.y,width:r.width,height:r.height};case"circle":return{x:r.cx-r.r,y:r.cy-r.r,width:r.r*2,height:r.r*2};case"poly":{let t=100,e=100,i=0,s=0;for(let[o,n]of r.points)o<t&&(t=o),n<e&&(e=n),o>i&&(i=o),n>s&&(s=n);return{x:t,y:e,width:i-t,height:s-e}}default:return{x:0,y:0,width:0,height:0}}}var wt=class extends HTMLElement{get shape(){return this.getAttribute("shape")||"rect"}get coords(){return this.getAttribute("coords")||""}get label(){return this.getAttribute("label")||""}get href(){return this.getAttribute("href")}get target(){return this.getAttribute("target")||""}get tooltipMode(){return this.getAttribute("tooltip")||"hover"}get disabled(){return this.hasAttribute("disabled")}connectedCallback(){this.setAttribute("data-upgraded","")}disconnectedCallback(){this.removeAttribute("data-upgraded")}},kt=class extends HTMLElement{#t=null;#i=null;#e=null;#r=[];#s=[];#a=null;#n=null;#o=null;connectedCallback(){if(this.#t=this.querySelector(":scope > img"),!this.#t){let t=this.getAttribute("src"),e=this.getAttribute("alt");if(t)this.#t=document.createElement("img"),this.#t.src=t,this.#t.alt=e||"",this.prepend(this.#t);else return}this.#t.classList.add("image-map-img"),this.#t.complete?this.#u():this.#t.addEventListener("load",()=>this.#u(),{once:!0})}disconnectedCallback(){this.removeAttribute("data-upgraded"),this.#n?.disconnect(),this.#c();for(let t of this.#s)t._onEnter&&t.svgShape?.removeEventListener("pointerenter",t._onEnter),t._onLeave&&t.svgShape?.removeEventListener("pointerleave",t._onLeave),t._onClick&&t.svgShape?.removeEventListener("click",t._onClick),t._onTouch&&t.svgShape?.removeEventListener("touchstart",t._onTouch),t._onFocus&&t.anchor?.removeEventListener("focus",t._onFocus),t._onBlur&&t.anchor?.removeEventListener("blur",t._onBlur);this.#i?.remove(),this.#e?.remove();for(let t of this.#s)t.anchor?.remove();this.#s=[],this.#r=[]}#u(){let t=[...this.querySelectorAll(":scope > map-area")];if(t.length===0){this.setAttribute("data-upgraded","");return}this.#i=document.createElementNS(F,"svg"),this.#i.setAttribute("viewBox","0 0 100 100"),this.#i.setAttribute("preserveAspectRatio","none"),this.#i.setAttribute("aria-hidden","true"),this.#i.classList.add("image-map-overlay"),this.#e=document.createElement("div"),this.#e.className="image-map-tooltip",this.#e.setAttribute("role","tooltip"),this.#e.setAttribute("aria-live","polite"),this.#e.id=`imap-tip-${crypto.randomUUID().slice(0,8)}`;for(let e of t){let i=e,s=i.shape,o=i.coords,n=Fe(s,o),a=De(n);if(!a)continue;let l=$e(n),c=i.href?document.createElement("a"):document.createElement("button");i.href&&(c.href=i.href,i.target&&(c.target=i.target)),c.className="image-map-anchor",c.setAttribute("aria-label",i.label),c.setAttribute("aria-describedby",this.#e.id),c.textContent=i.label,c.style.left=`${l.x}%`,c.style.top=`${l.y}%`,c.style.width=`${l.width}%`,c.style.height=`${l.height}%`,i.disabled&&(a.setAttribute("data-disabled",""),c.setAttribute("tabindex","-1"),c.setAttribute("aria-disabled","true"));let h=e.innerHTML,d={area:e,parsed:n,svgShape:a,anchor:c,contentHTML:h,_onEnter:null,_onLeave:null,_onClick:null,_onTouch:null,_onFocus:null,_onBlur:null};if(!i.disabled){let p=i.tooltipMode;d._onEnter=()=>{p==="hover"&&this.#l(d),a.setAttribute("data-hover",""),this.#h("image-map:area-enter",i)},d._onLeave=()=>{p==="hover"&&this.#c(),a.removeAttribute("data-hover"),this.#h("image-map:area-leave",i)},d._onClick=m=>{p==="click"&&(this.#a===d?this.#c():this.#l(d)),this.#h("image-map:area-activate",i),i.href&&p!=="click"&&(i.target==="_blank"?window.open(i.href,"_blank","noopener"):window.location.href=i.href)},d._onTouch=m=>{p==="hover"&&(this.#o!==d?(m.preventDefault(),this.#o=d,this.#l(d)):this.#o=null)},a.addEventListener("pointerenter",d._onEnter),a.addEventListener("pointerleave",d._onLeave),a.addEventListener("click",d._onClick),a.addEventListener("touchstart",d._onTouch,{passive:!1}),d._onFocus=()=>{this.#l(d),a.setAttribute("data-hover","")},d._onBlur=()=>{this.#c(),a.removeAttribute("data-hover")},c.addEventListener("focus",d._onFocus),c.addEventListener("blur",d._onBlur)}this.#i.appendChild(a),this.#s.push(d),this.#r.push(c)}this.appendChild(this.#i);for(let e of this.#r)this.appendChild(e);this.appendChild(this.#e),this.addEventListener("keydown",this.#p),this.#n=new ResizeObserver(()=>{this.#a&&this.#m(this.#a.svgShape)}),this.#n.observe(this.#t),this.setAttribute("role","group"),this.hasAttribute("aria-label")||this.setAttribute("aria-label",this.#t.alt||"Image map"),this.setAttribute("data-upgraded","")}#l(t){this.#e&&(this.#a=t,this.#e.innerHTML=t.contentHTML,this.#e.setAttribute("data-visible",""),this.#m(t.svgShape))}#c(){this.#e&&(this.#a=null,this.#e.removeAttribute("data-visible"))}#m(t){if(!this.#e||!t)return;let e=t.getBoundingClientRect(),i=this.#e.getBoundingClientRect(),s=8,o=8,n=window.innerWidth,a=window.innerHeight,l,c,h=e.top-i.height-s;h>=o?(l=h,c=e.left+(e.width-i.width)/2):e.bottom+s+i.height<=a-o?(l=e.bottom+s,c=e.left+(e.width-i.width)/2):e.right+s+i.width<=n-o?(l=e.top+(e.height-i.height)/2,c=e.right+s):(l=e.top+(e.height-i.height)/2,c=e.left-i.width-s),c=Math.max(o,Math.min(c,n-i.width-o)),l=Math.max(o,Math.min(l,a-i.height-o)),this.#e.style.top=`${l}px`,this.#e.style.left=`${c}px`}#p=t=>{let e=this.#r.filter(s=>!s.hasAttribute("aria-disabled")),i=e.indexOf(document.activeElement);switch(t.key){case"ArrowDown":case"ArrowRight":{t.preventDefault();let s=i<e.length-1?i+1:0;e[s]?.focus();break}case"ArrowUp":case"ArrowLeft":{t.preventDefault();let s=i>0?i-1:e.length-1;e[s]?.focus();break}case"Escape":this.#c(),this.#o=null;break}};#h(t,e){this.dispatchEvent(new CustomEvent(t,{detail:{area:e},bubbles:!0}))}};u("map-area",wt);u("image-map",kt);var qe='<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true" focusable="false"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="var(--color-danger, #f00)"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>',Be={hq:"hqdefault",mq:"mqdefault",sd:"sddefault",maxres:"maxresdefault"},xt=class extends HTMLElement{#t;#i;connectedCallback(){if(this.#t=this.getAttribute("video-id"),this.#i=this.getAttribute("title")??"Play video",!this.#t){console.warn("youtube-player: missing required video-id attribute");return}this.hasAttribute("autoplay")?this.#o():this.#s()}#e(){let t=new URLSearchParams({autoplay:"1"}),e=this.getAttribute("start");e&&t.set("start",e);let i=this.getAttribute("list");return i&&t.set("list",i),this.getAttribute("params")&&new URLSearchParams(this.getAttribute("params")).forEach((s,o)=>t.set(o,s)),`https://www.youtube-nocookie.com/embed/${this.#t}?${t}`}#r(){let t=this.getAttribute("thumbnail")??"hq";return`https://i.ytimg.com/vi/${this.#t}/${Be[t]??"hqdefault"}.jpg`}#s(){this.setAttribute("state","ready"),this.setAttribute("tabindex","0"),this.setAttribute("role","button"),this.setAttribute("aria-label",`Play ${this.#i}`),this.innerHTML=`<img src="${this.#r()}" alt="" loading="lazy" decoding="async"><button type="button" aria-label="Play ${this.#i}">${qe}</button>`,this.addEventListener("click",this.#a,{once:!0}),this.addEventListener("keydown",this.#n)}#a=()=>{this.removeEventListener("keydown",this.#n),this.#o()};#n=t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),this.removeEventListener("click",this.#a),this.#o())};#o(){this.setAttribute("state","active"),this.removeAttribute("tabindex"),this.removeAttribute("role"),this.removeAttribute("aria-label"),this.innerHTML=`<iframe src="${this.#e()}" title="${this.#i}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`,this.querySelector("iframe")?.focus()}};u("youtube-player",xt);var At='track[kind="chapters"][data-chapter-list]';function Ot(r=document){r.querySelectorAll(At).forEach(t=>Et(t))}function Et(r){if(r.hasAttribute("data-chapter-list-init"))return;r.setAttribute("data-chapter-list-init","");let t=r.parentElement;if(!t||t.tagName!=="VIDEO")return;let e=r.track;e.mode==="disabled"&&(e.mode="hidden"),r.readyState>=2?Ut(t,e):r.addEventListener("load",()=>Ut(t,e),{once:!0})}function Ut(r,t){let e=t.cues;if(!e||e.length===0)return;let i=document.createElement("nav");i.setAttribute("aria-label","Video chapters"),i.classList.add("chapter-list");let s=document.createElement("ol");for(let n of e){let a=document.createElement("li"),l=document.createElement("button");l.type="button";let c=document.createElement("span");c.textContent=n.text;let h=document.createElement("time");h.textContent=ze(n.startTime),h.setAttribute("datetime",He(n.startTime)),l.appendChild(c),l.appendChild(h),l.addEventListener("click",()=>{r.currentTime=n.startTime,r.paused&&r.play()}),a.appendChild(l),s.appendChild(a)}i.appendChild(s),r.insertAdjacentElement("afterend",i);let o=null;r.addEventListener("timeupdate",()=>{let n=r.currentTime,a=-1;for(let l=0;l<e.length;l++)if(n>=e[l].startTime&&n<e[l].endTime){a=l;break}o&&o.removeAttribute("data-active"),a>=0?(o=s.children[a],o.setAttribute("data-active","")):o=null})}function ze(r){let t=Math.floor(r/3600),e=Math.floor(r%3600/60),i=Math.floor(r%60);return t>0?`${t}:${String(e).padStart(2,"0")}:${String(i).padStart(2,"0")}`:`${e}:${String(i).padStart(2,"0")}`}function He(r){let t=Math.floor(r/3600),e=Math.floor(r%3600/60),i=Math.floor(r%60);return`PT${t?t+"H":""}${e?e+"M":""}${i}S`}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>Ot()):Ot();var Oe=new MutationObserver(r=>{for(let t of r)for(let e of t.addedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let i=e;i.matches?.(At)&&Et(i),i.querySelectorAll?.(At).forEach(s=>Et(s))}});Oe.observe(document.documentElement,{childList:!0,subtree:!0});var C="[data-command], [commandfor]",Ue="Page Actions",v=new Map;function D(r){if(v.has(r)||r.hasAttribute("data-command-init"))return;r.setAttribute("data-command-init","");let t=r.getAttribute("data-command")||r.textContent.trim();if(!t)return;let e=r.getAttribute("data-command-group")||Ue,i=r.getAttribute("data-command-icon")||null,s=r.getAttribute("data-shortcut")||null,o=null;s&&(o=E(s,()=>r.click()));let n={element:r,label:t,group:e,icon:i,shortcut:s,unbind:o};v.set(r,n),document.dispatchEvent(new CustomEvent("vb:command-registry-change",{detail:{action:"add",entry:n}}))}function Ct(r){let t=v.get(r);t&&(t.unbind?.(),v.delete(r),r.removeAttribute("data-command-init"),document.dispatchEvent(new CustomEvent("vb:command-registry-change",{detail:{action:"remove",element:r}})))}function Ve(){let r=new Map;for(let t of v.values()){if(t.element.hidden||t.element.closest("[hidden]"))continue;let e=r.get(t.group)||[];e.push(t),r.set(t.group,e)}return r}function Vt(r=document){r.querySelectorAll(C).forEach(D)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>Vt()):Vt();var Ge=new MutationObserver(r=>{for(let t of r){for(let e of t.addedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let i=e;i.matches(C)&&D(i),i.querySelectorAll(C).forEach(D)}for(let e of t.removedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let i=e;v.has(i)&&Ct(i),i.querySelectorAll(C).forEach(s=>{v.has(s)&&Ct(s)})}if(t.type==="attributes"&&t.target.nodeType===Node.ELEMENT_NODE){let e=t.target;e.matches(C)&&!v.has(e)?D(e):!e.matches(C)&&v.has(e)&&Ct(e)}}});Ge.observe(document.documentElement,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-command","commandfor"]});function We(){let r='footer, aside, dialog, [hidden], [aria-hidden="true"]',e=[];return document.querySelectorAll("nav a[href]").forEach(i=>{if(i.closest(r)||v.has(i))return;let s=i.textContent.trim();!s||e.length>=50||e.push({element:i,label:s,group:"Navigation",icon:null,shortcut:null,auto:!0,action:null})}),document.querySelectorAll("h2[id], h3[id]").forEach(i=>{if(i.closest(r)||v.has(i))return;let s=i.textContent.trim();!s||e.length>=50||e.push({element:i,label:`Jump to: ${s}`,group:"On This Page",icon:null,shortcut:null,auto:!0,action:()=>i.scrollIntoView({behavior:"smooth"})})}),e}window.__commandRegistry={getRegisteredCommands:Ve,scanAutoDiscoverable:We};var Ke=window.matchMedia("(prefers-reduced-motion: reduce)");function Gt(){return Ke.matches||document.documentElement.hasAttribute("data-motion-reduced")}var Wt=0,g={_effects:new Map,_triggers:new Map,_transitions:new Map,_instances:new WeakMap,_triggerCleanups:new WeakMap,_transitionCleanups:new WeakMap,_observer:null,effect(r,t){this._effects.set(r,t),document.querySelectorAll("[data-effect]").forEach(e=>{(e.getAttribute("data-effect")||"").split(/\s+/).includes(r)&&this._initEffect(e,r)})},trigger(r,t){this._triggers.set(r,t)},transition(r,t){this._transitions.set(r,t)},uid(r){return r.id?r.id:(r._vbUid||(Wt++,r._vbUid=`vb-${Wt}`),r._vbUid)},theme(r,t){this._themes=this._themes||new Map,this._themes.set(r,t)},applyTheme(r,t=document.documentElement){let e=this._themes?.get(r);if(e)for(let[i,s]of Object.entries(e))t.style.setProperty(i,s)},swap(r){return document.startViewTransition?document.startViewTransition(r):r()},observe(r=document){if(r.querySelectorAll("[data-effect]").forEach(e=>this._processElement(e)),r.querySelectorAll("[data-stagger]").forEach(e=>this._processStagger(e)),r.querySelectorAll("[data-transition]").forEach(e=>this._processTransition(e)),this._observer)return;this._observer=new MutationObserver(e=>{for(let i of e){if(i.type==="childList"){for(let s of i.addedNodes)s.nodeType===Node.ELEMENT_NODE&&this._processTree(s);for(let s of i.removedNodes)s.nodeType===Node.ELEMENT_NODE&&this._cleanupTree(s)}if(i.type==="attributes"){let s=i.target;i.attributeName==="data-effect"&&this._reconcileEffects(s),i.attributeName==="data-trigger"&&this._reconcileTrigger(s),i.attributeName==="data-stagger"&&this._processStagger(s),i.attributeName==="data-transition"&&this._processTransition(s)}}});let t=r===document?document.body:r;this._observer.observe(t,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-effect","data-trigger","data-stagger","data-transition"]})},disconnect(){this._observer&&(this._observer.disconnect(),this._observer=null)},params(r){let t=getComputedStyle(r);return{get(e){return t.getPropertyValue(`--vb-${e}`).trim()},getNumber(e,i=0){let s=t.getPropertyValue(`--vb-${e}`).trim();return s?parseFloat(s):i},hasClass(e){return r.classList.contains(e)}}},emit(r,t,e={}){r.dispatchEvent(new CustomEvent(t,{bubbles:!0,detail:e}))},prefersReducedMotion:Gt,_processTree(r){r.hasAttribute?.("data-effect")&&this._processElement(r),r.hasAttribute?.("data-stagger")&&this._processStagger(r),r.hasAttribute?.("data-transition")&&this._processTransition(r),r.querySelectorAll?.("[data-effect]").forEach(t=>this._processElement(t)),r.querySelectorAll?.("[data-stagger]").forEach(t=>this._processStagger(t)),r.querySelectorAll?.("[data-transition]").forEach(t=>this._processTransition(t))},_cleanupTree(r){r.hasAttribute?.("data-effect")&&this._cleanupElement(r),r.hasAttribute?.("data-transition")&&this._cleanupTransition(r),r.querySelectorAll?.("[data-effect]").forEach(t=>this._cleanupElement(t)),r.querySelectorAll?.("[data-transition]").forEach(t=>this._cleanupTransition(t))},_processElement(r){if(r.hasAttribute("data-effect-processed"))return;r.setAttribute("data-effect-processed","");let t=r.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[];for(let e of t)this._initEffect(r,e);this._wireTrigger(r,t)},_initEffect(r,t){let e=this._effects.get(t);if(!e)return;let i=this._instances.get(r);if(i?.has(t))return;Gt();let s=e(r);s&&(i||(i=new Map,this._instances.set(r,i)),typeof s=="function"?i.set(t,{cleanup:s}):i.set(t,s))},_wireTrigger(r,t){let e=r.getAttribute("data-trigger");if(!e){this._activateEffects(r);return}let i=e.split(/\s+/).filter(Boolean);for(let s of i){let o=s.indexOf(":"),n=o>-1?s.slice(0,o):s,a=o>-1?s.slice(o+1):null,l=this._triggers.get(n);if(!l)continue;let c=l(r,()=>this._activateEffects(r),a);if(c){let h=this._triggerCleanups.get(r);if(h){let d=h;this._triggerCleanups.set(r,()=>{d(),c()})}else this._triggerCleanups.set(r,c)}}},_activateEffects(r){r.setAttribute("data-effect-active","");let t=this._instances.get(r);if(t)for(let[,e]of t)e.activate&&e.activate()},_cleanupElement(r){let t=this._instances.get(r);if(t){for(let[,i]of t)i.cleanup&&i.cleanup();this._instances.delete(r)}let e=this._triggerCleanups.get(r);e&&(e(),this._triggerCleanups.delete(r))},_reconcileEffects(r){let t=r.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[],e=this._instances.get(r);if(e)for(let[i,s]of e)t.includes(i)||(s.cleanup&&s.cleanup(),e.delete(i));for(let i of t)e?.has(i)||this._initEffect(r,i);r.hasAttribute("data-effect-processed")||(r.setAttribute("data-effect-processed",""),this._wireTrigger(r,t))},_reconcileTrigger(r){let t=this._triggerCleanups.get(r);t&&(t(),this._triggerCleanups.delete(r));let e=r.getAttribute("data-effect")?.split(/\s+/).filter(Boolean)||[];this._wireTrigger(r,e)},_processStagger(r){let t=r.children;for(let e=0;e<t.length;e++)t[e].style.setProperty("--vb-stagger-index",String(e))},_processTransition(r){if(r.hasAttribute("data-transition-processed"))return;r.setAttribute("data-transition-processed","");let t=r.getAttribute("data-transition");if(!t)return;let e=this._transitions.get(t);if(e){let i=e(r);i&&this._transitionCleanups.set(r,i)}else r.style.viewTransitionName=`${t}-${this.uid(r)}`},_cleanupTransition(r){let t=this._transitionCleanups.get(r);t&&(t(),this._transitionCleanups.delete(r)),r.style.viewTransitionName=""}};typeof window<"u"&&(window.VB=g);g.effect("glitch",r=>{r.hasAttribute("data-effect-glitch-init")||(r.setAttribute("data-effect-glitch-init",""),r.setAttribute("data-glitch-text",r.textContent))});function Xe(r){let t=r.textContent;r.setAttribute("aria-label",t),r.innerHTML="",t.split(/(\s+)/).forEach((i,s)=>{if(/^\s+$/.test(i)){r.appendChild(document.createTextNode(i));return}let o=document.createElement("span");o.className="vb-blur-chunk",o.textContent=i,o.style.setProperty("--i",String(Math.floor(s/2))),o.setAttribute("aria-hidden","true"),r.appendChild(o)})}function Je(r){let t=r.textContent;r.setAttribute("aria-label",t);let e=t.split(/\s+/).filter(Boolean),i=[],s="",o=r.offsetWidth,n=document.createElement("span");n.style.visibility="hidden",n.style.position="absolute",n.style.font=getComputedStyle(r).font,document.body.appendChild(n),e.forEach(a=>{let l=s?s+" "+a:a;n.textContent=l,n.offsetWidth>o&&s?(i.push(s),s=a):s=l}),s&&i.push(s),document.body.removeChild(n),i.length===0&&i.push(t),r.innerHTML="",i.forEach((a,l)=>{let c=document.createElement("span");c.className="vb-blur-chunk",c.textContent=a,c.style.setProperty("--i",String(l)),c.setAttribute("aria-hidden","true"),r.appendChild(c),l<i.length-1&&r.appendChild(document.createTextNode(" "))})}g.effect("blur-reveal",r=>{if(r.hasAttribute("data-effect-blur-reveal-init")||(r.setAttribute("data-effect-blur-reveal-init",""),g.prefersReducedMotion()))return;let t=r.classList.contains("line")?"line":"word",e=g.params(r).get("blur-reveal-delay")||"80ms";return r.style.setProperty("--blur-delay",e),t==="line"?Je(r):Xe(r),{activate(){r.setAttribute("data-effect-active","")},cleanup(){}}});function Ye(r,t,e,i){let s=0;function o(){s<=t.length?(r.firstChild.textContent=t.slice(0,s),s++,setTimeout(o,e)):i&&i()}o()}function Qe(r,t,e){let i=r.firstChild.textContent,s=i.length;function o(){s>=0?(r.firstChild.textContent=i.slice(0,s),s--,setTimeout(o,t/2)):e&&e()}o()}function Ze(r){let t=r.getAttribute("data-typewriter-text"),e=g.params(r),i=e.getNumber("typewriter-speed",50),s=e.getNumber("typewriter-delay",0),n=r.classList.contains("loop")?2e3:null;r.textContent="";let a=document.createTextNode("");if(r.appendChild(a),!r.classList.contains("no-cursor")){let h=document.createElement("span");h.className="vb-typewriter-cursor",h.textContent="|",h.setAttribute("aria-hidden","true"),r.appendChild(h)}function c(){Ye(r,t,i,()=>{n!==null&&setTimeout(()=>{Qe(r,i,()=>{setTimeout(c,400)})},n)})}setTimeout(c,s)}g.effect("typewriter",r=>{if(r.hasAttribute("data-effect-typewriter-init"))return;r.setAttribute("data-effect-typewriter-init","");let t=r.textContent.trim();if(r.setAttribute("data-typewriter-text",t),r.setAttribute("aria-label",t),!g.prefersReducedMotion())return r.textContent="",{activate(){Ze(r)},cleanup(){}}});var Kt="!<>-_\\/[]{}=+*^?#";function Xt(r){return r[Math.floor(Math.random()*r.length)]}function ti(r){let t=r.getAttribute("data-scramble-text"),e=g.params(r),i=e.getNumber("scramble-duration",1500),s=e.get("scramble-chars")||Kt,o=e.getNumber("scramble-speed",30),n=t.length,a=0,l=Math.ceil(i/o);function c(){let h=a/l,d=Math.floor(h*n),p="";for(let m=0;m<n;m++)m<d?p+=t[m]:t[m]===" "?p+=" ":p+=Xt(s);r.textContent=p,a++,a<=l?setTimeout(c,o):r.textContent=t}c()}g.effect("scramble",r=>{if(r.hasAttribute("data-effect-scramble-init"))return;r.setAttribute("data-effect-scramble-init","");let t=r.textContent.trim();if(r.setAttribute("data-scramble-text",t),r.setAttribute("aria-label",t),g.prefersReducedMotion())return;let e=g.params(r).get("scramble-chars")||Kt;return r.textContent=t.replace(/\S/g,()=>Xt(e)),{activate(){ti(r)},cleanup(){}}});g.effect("animate-image",r=>{if(r.hasAttribute("data-effect-animate-image-init"))return;r.setAttribute("data-effect-animate-image-init","");let t=r,e=document.createElement("div");if(e.className="animate-image-wrapper",!t.parentNode)return;t.parentNode.insertBefore(e,t),e.appendChild(t);let i=document.createElement("button");i.type="button",i.className="animate-image-toggle",i.setAttribute("aria-label","Pause animation"),e.appendChild(i);let s=t.src,o=null,n=!1;function a(){let d=document.createElement("canvas");d.width=t.naturalWidth||t.width,d.height=t.naturalHeight||t.height;let p=d.getContext("2d");if(p){p.drawImage(t,0,0);try{o=d.toDataURL("image/png")}catch{o=null}}}function l(){n||(n=!0,t.setAttribute("data-animate-image-paused",""),i.setAttribute("aria-label","Play animation"),i.classList.add("paused"),o&&(t.src=o))}function c(){n&&(n=!1,t.removeAttribute("data-animate-image-paused"),i.setAttribute("aria-label","Pause animation"),i.classList.remove("paused"),t.src=s)}i.addEventListener("click",()=>n?c():l()),t.complete&&t.naturalWidth?a():t.addEventListener("load",a,{once:!0});let h=window.matchMedia("(prefers-reduced-motion: reduce)");return(h.matches||document.documentElement.dataset.motionReduced!==void 0)&&(t.complete?(a(),l()):t.addEventListener("load",()=>{a(),l()},{once:!0})),h.addEventListener("change",d=>{d.matches&&l()}),t.hasAttribute("data-animate-image-paused")&&(t.complete?(a(),n=!1,l()):t.addEventListener("load",()=>{a(),n=!1,l()},{once:!0})),{cleanup(){e.parentNode&&(e.parentNode.insertBefore(t,e),e.remove())}}});var $=new Map,St=null,q=!1;function ei(r){for(let[t,e]of $)r.querySelectorAll(t).forEach(e)}function ii(r){if(r.nodeType!==Node.ELEMENT_NODE)return;let t=r;for(let[e,i]of $)t.matches(e)&&i(t),t.querySelectorAll(e).forEach(i)}function si(){St||(St=new MutationObserver(r=>{for(let t of r)for(let e of t.addedNodes)ii(e)}),St.observe(document.documentElement,{childList:!0,subtree:!0}))}function ri(){q||(q=!0,ei(document))}function Jt(r,t){$.set(r,t),si(),q||document.readyState!=="loading"?(q=!0,document.querySelectorAll(r).forEach(t)):$.size===1&&document.addEventListener("DOMContentLoaded",ri)}var B=null;async function oi(){if(B)return;B=(await Promise.resolve().then(()=>(Z(),Q))).resolveEmoji}var ni="[data-emoji]",y=/:([a-z0-9_+-]+):/g,ai=new Set(["SCRIPT","STYLE","CODE","PRE","TEXTAREA"]),li=new Set(["INPUT","TEXTAREA"]),ci=100;function hi(r){if(r.hasAttribute("data-emoji-init"))return;if(r.setAttribute("data-emoji-init",""),li.has(r.tagName)){di(r);return}let t=r.getAttribute("data-emoji-unknown")||"keep";if(Yt(r,t),r.getAttribute("data-emoji-scan")==="observe"){let e=null;new MutationObserver(()=>{e&&clearTimeout(e),e=setTimeout(()=>{Yt(r,t),e=null},ci)}).observe(r,{childList:!0,subtree:!0,characterData:!0})}}function di(r){let t=!1;r.addEventListener("compositionstart",()=>{t=!0}),r.addEventListener("compositionend",()=>{t=!1,_t(r)}),r.addEventListener("input",()=>{t||_t(r)}),r.value&&y.test(r.value)&&(y.lastIndex=0,_t(r))}function _t(r){let t=r.value;y.lastIndex=0;let e,i="",s=0,o=0,n=r.selectionStart??t.length,a=!1;for(;(e=y.exec(t))!==null;){let c=e[0],h=e[1],d=B(h);if(i+=t.slice(s,e.index),d){i+=d.emoji,a=!0;let p=e.index+c.length;n>=p?o+=c.length-d.emoji.length:n>e.index&&(o+=n-e.index-d.emoji.length)}else i+=c;s=e.index+c.length}if(!a)return;i+=t.slice(s),r.value=i;let l=Math.max(0,n-o);r.setSelectionRange(l,l)}function Yt(r,t){let e=document.createTreeWalker(r,NodeFilter.SHOW_TEXT,{acceptNode(s){let o=s.parentElement;return!o||ai.has(o.tagName)||o.isContentEditable||o.hasAttribute("data-emoji-processed")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),i=[];for(;e.nextNode();)y.test(e.currentNode.textContent??"")&&i.push(e.currentNode),y.lastIndex=0;for(let s of i)ui(s,t)}function ui(r,t){let e=r.textContent;y.lastIndex=0;let i,s=0,o=[],n=!1;for(;(i=y.exec(e))!==null;){let a=i[1],l=B(a);i.index>s&&o.push(e.slice(s,i.index)),l?(o.push(l.emoji),n=!0):t==="strip"?n=!0:o.push(i[0]),s=i.index+i[0].length}n&&(s<e.length&&o.push(e.slice(s)),r.textContent=o.join(""))}function pi(r){oi().then(()=>hi(r))}Jt(ni,pi);
//# sourceMappingURL=vanilla-breeze-extras.js.map
