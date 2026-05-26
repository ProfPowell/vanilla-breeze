// Opt-in cursor spotlight. Lazy-loaded by main.js when [data-spotlight] exists.
// JS only sets two CSS custom properties; CSS renders the gradient (cursors.css).
function wire(el) {
  if (el.__vbSpotlight) return;
  el.__vbSpotlight = true;
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spotlight-x', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    el.style.setProperty('--spotlight-y', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  };
  const onLeave = () => {
    el.style.setProperty('--spotlight-x', '50%');
    el.style.setProperty('--spotlight-y', '50%');
  };
  el.addEventListener('mousemove', onMove, { passive: true });
  el.addEventListener('mouseleave', onLeave, { passive: true });
}

export function initSpotlights(root = document) {
  root.querySelectorAll?.('[data-spotlight]').forEach(wire);
}

initSpotlights();
