/**
 * VB Toggle — adds a fixed button to toggle Vanilla Breeze styling on/off.
 * Default state: VB OFF (raw semantic HTML with browser defaults).
 * Saves preference to localStorage.
 */
(function () {
  const STORAGE_KEY = 'alpenglow-vb';
  const cssLink = document.getElementById('vb-css');
  if (!cssLink) return;

  const saved = localStorage.getItem(STORAGE_KEY);
  let vbEnabled = saved === 'on';

  // Apply saved state immediately (before paint)
  if (vbEnabled) {
    cssLink.disabled = false;
    loadJS();
  } else {
    cssLink.disabled = true;
  }

  // Create toggle button
  const btn = document.createElement('button');
  btn.id = 'vb-toggle';
  btn.setAttribute('aria-label', 'Toggle Vanilla Breeze styling');
  updateButton();

  // Style the button so it looks decent in both raw and VB modes
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    zIndex: '10000',
    padding: '0.75rem 1.25rem',
    border: '2px solid #333',
    borderRadius: '6px',
    background: vbEnabled ? '#1a1a2e' : '#fff',
    color: vbEnabled ? '#e0e0e0' : '#333',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'background 0.2s, color 0.2s'
  });

  document.body.appendChild(btn);

  btn.addEventListener('click', function () {
    vbEnabled = !vbEnabled;
    cssLink.disabled = !vbEnabled;
    localStorage.setItem(STORAGE_KEY, vbEnabled ? 'on' : 'off');

    if (vbEnabled) loadJS();
    updateButton();
  });

  function updateButton() {
    btn.textContent = vbEnabled ? '✕ View Raw HTML' : '✦ Add Vanilla Breeze';
    btn.style.background = vbEnabled ? '#1a1a2e' : '#fff';
    btn.style.color = vbEnabled ? '#e0e0e0' : '#333';
  }

  function loadJS() {
    if (document.getElementById('vb-js')) return;
    const script = document.createElement('script');
    script.id = 'vb-js';
    script.type = 'module';
    script.src = '/src/main.js';
    document.head.appendChild(script);
  }
})();
