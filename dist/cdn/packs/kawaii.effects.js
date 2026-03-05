var s=new Map,a=null,u=window.matchMedia("(prefers-reduced-motion: reduce)");function c(){a||(a=new MutationObserver(e=>{for(let t of e){for(let n of t.addedNodes)n.nodeType===Node.ELEMENT_NODE&&(l(n),n.querySelectorAll?.("*").forEach(l));for(let n of t.removedNodes)n.nodeType===Node.ELEMENT_NODE&&(d(n),n.querySelectorAll?.("*").forEach(d))}}),a.observe(document.body,{childList:!0,subtree:!0}))}function l(e){for(let[,t]of s)e.matches?.(t.selector)&&(u.matches&&t.reducedMotionFallback?t.reducedMotionFallback(e):t.init(e))}function d(e){for(let[,t]of s)e.matches?.(t.selector)&&t.destroy&&t.destroy(e)}function f(e,t){s.set(e,t),document.querySelectorAll(t.selector).forEach(n=>{u.matches&&t.reducedMotionFallback?t.reducedMotionFallback(n):t.init(n)}),document.body?c():document.addEventListener("DOMContentLoaded",c,{once:!0})}var r=["\u2726","\u2727","\u22C6","\u2661","\u2606"],i=["oklch(75% 0.18 350)","oklch(70% 0.15 290)","oklch(75% 0.12 60)","oklch(70% 0.12 220)","oklch(65% 0.15 180)"];function p(e){if(e._sparkleInterval)return;getComputedStyle(e).position==="static"&&(e.style.position="relative"),e.style.overflow="hidden";function n(){let o=document.createElement("span");o.textContent=r[Math.floor(Math.random()*r.length)],o.setAttribute("aria-hidden","true"),o.style.cssText=`
      position: absolute;
      pointer-events: none;
      font-size: ${.6+Math.random()*.8}rem;
      color: ${i[Math.floor(Math.random()*i.length)]};
      left: ${Math.random()*100}%;
      top: ${80+Math.random()*20}%;
      opacity: 0;
      z-index: 0;
      animation: vb-kawaii-particle ${2+Math.random()*3}s ease-out forwards;
    `,e.appendChild(o),setTimeout(()=>o.remove(),5e3)}if(!document.getElementById("vb-kawaii-particle-style")){let o=document.createElement("style");o.id="vb-kawaii-particle-style",o.textContent=`
      @keyframes vb-kawaii-particle {
        0%   { opacity: 0; transform: translateY(0) rotate(0deg) scale(0.5); }
        20%  { opacity: 1; }
        80%  { opacity: 0.6; }
        100% { opacity: 0; transform: translateY(-120px) rotate(180deg) scale(0.3); }
      }
    `,document.head.appendChild(o)}e._sparkleInterval=setInterval(n,600);for(let o=0;o<3;o++)setTimeout(n,o*200)}function m(e){e._sparkleInterval&&(clearInterval(e._sparkleInterval),e._sparkleInterval=null),e.querySelectorAll('[aria-hidden="true"]').forEach(t=>{t.style.animation?.includes("vb-kawaii-particle")&&t.remove()})}f("particles",{selector:"[data-particles]",init:p,destroy:m,reducedMotionFallback(e){getComputedStyle(e).position==="static"&&(e.style.position="relative");for(let n=0;n<5;n++){let o=document.createElement("span");o.textContent=r[Math.floor(Math.random()*r.length)],o.setAttribute("aria-hidden","true"),o.style.cssText=`
        position: absolute;
        pointer-events: none;
        font-size: ${.5+Math.random()*.6}rem;
        color: ${i[Math.floor(Math.random()*i.length)]};
        left: ${10+Math.random()*80}%;
        top: ${10+Math.random()*80}%;
        opacity: 0.4;
        z-index: 0;
      `,e.appendChild(o)}}});
//# sourceMappingURL=kawaii.effects.js.map
