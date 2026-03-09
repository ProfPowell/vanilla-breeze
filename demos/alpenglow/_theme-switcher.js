/**
 * Theme Switcher — multi-mode theme switcher for Alpenglow demos.
 *
 * Modes: raw | vb | anthropic | mcdonalds | ibm
 *
 * Manages VB CSS, brand theme CSS, data-theme attribute, and lazy JS loading.
 * Uses a <theme-switcher> custom element to avoid VB style interference.
 */
(function () {
  var STORAGE_KEY = 'alpenglow-theme';
  var THEMES = [
    { value: 'raw',       label: 'Raw HTML' },
    { value: 'vb',        label: 'Vanilla Breeze' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'mcdonalds', label: "McDonald\u2019s" },
    { value: 'ibm',       label: 'IBM' }
  ];
  var BRAND_THEMES = ['anthropic', 'mcdonalds', 'ibm'];
  var BRAND_LOGOS = {
    anthropic: '/docs/alpenglow/themes/anthropic-logo.svg',
    mcdonalds: '/docs/alpenglow/themes/mcdonalds-logo.svg',
    ibm:       '/docs/alpenglow/themes/ibm-logo.svg'
  };

  var cssLink = document.getElementById('vb-css');
  if (!cssLink) return;

  /* ── Inject isolation styles ── */
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    'theme-switcher {',
    '  all: initial;',
    '  position: fixed !important;',
    '  bottom: 1.25rem !important;',
    '  right: 1.25rem !important;',
    '  z-index: 99999 !important;',
    '  display: block !important;',
    '  font-family: system-ui, -apple-system, sans-serif;',
    '  font-size: 14px;',
    '  line-height: 1.4;',
    '  color: #333;',
    '  background: #fff;',
    '  border: 1px solid #ccc;',
    '  border-radius: 10px;',
    '  box-shadow: 0 4px 20px rgba(0,0,0,0.18);',
    '  contain: layout style;',
    '  max-width: 200px;',
    '}',
    'theme-switcher *, theme-switcher *::before, theme-switcher *::after {',
    '  all: revert;',
    '  box-sizing: border-box;',
    '}',
    'theme-switcher .ts-btn {',
    '  display: block;',
    '  width: 100%;',
    '  padding: 0.5rem 1rem;',
    '  margin: 0;',
    '  border: none;',
    '  border-radius: 10px;',
    '  background: transparent;',
    '  cursor: pointer;',
    '  font: 600 14px/1.4 system-ui, -apple-system, sans-serif;',
    '  color: #333;',
    '  text-align: left;',
    '  white-space: nowrap;',
    '}',
    'theme-switcher .ts-btn:hover { background: #f5f5f5; }',
    'theme-switcher .ts-panel {',
    '  border-top: 1px solid #eee;',
    '  padding: 0.5rem 0.75rem 0.625rem;',
    '  margin: 0;',
    '  border-radius: 0;',
    '}',
    'theme-switcher .ts-panel[hidden] { display: none; }',
    'theme-switcher .ts-legend {',
    '  font: 600 11px/1 system-ui, sans-serif;',
    '  color: #999;',
    '  text-transform: uppercase;',
    '  letter-spacing: 0.05em;',
    '  padding: 0 0 0.375rem;',
    '  margin: 0;',
    '}',
    'theme-switcher .ts-label {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 0.5em;',
    '  padding: 0.25rem 0;',
    '  margin: 0;',
    '  cursor: pointer;',
    '  font: 400 14px/1.4 system-ui, -apple-system, sans-serif;',
    '  color: #333;',
    '  white-space: nowrap;',
    '}',
    'theme-switcher .ts-label:hover { color: #000; }',
    'theme-switcher input[type="radio"] {',
    '  margin: 0;',
    '  accent-color: #0066cc;',
    '}'
  ].join('\n');
  document.head.appendChild(styleEl);

  /* ── Ensure brand-theme <link> elements exist ── */
  BRAND_THEMES.forEach(function (name) {
    if (!document.getElementById('theme-' + name)) {
      var link = document.createElement('link');
      link.id = 'theme-' + name;
      link.rel = 'stylesheet';
      link.href = '/docs/alpenglow/themes/' + name + '.css';
      link.disabled = true;
      document.head.appendChild(link);
    }
  });

  /* ── Migrate from old _vb-toggle.js localStorage key ── */
  var oldKey = localStorage.getItem('alpenglow-vb');
  if (oldKey && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, oldKey === 'on' ? 'vb' : 'raw');
    localStorage.removeItem('alpenglow-vb');
  }

  var currentMode = localStorage.getItem(STORAGE_KEY) || 'raw';
  if (!THEMES.some(function (t) { return t.value === currentMode; })) {
    currentMode = 'raw';
  }

  /* ── Apply saved mode immediately ── */
  applyMode(currentMode);

  /* ── Build widget DOM ── */
  var switcher = document.createElement('theme-switcher');
  switcher.setAttribute('role', 'region');
  switcher.setAttribute('aria-label', 'Demo theme switcher');

  var btn = document.createElement('button');
  btn.className = 'ts-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'theme-options');
  btn.textContent = '\u25C6 Theme';

  var panel = document.createElement('fieldset');
  panel.id = 'theme-options';
  panel.className = 'ts-panel';
  panel.hidden = true;

  var legend = document.createElement('legend');
  legend.className = 'ts-legend';
  legend.textContent = 'Demo Theme';
  panel.appendChild(legend);

  THEMES.forEach(function (theme) {
    var label = document.createElement('label');
    label.className = 'ts-label';

    var radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'demo-theme';
    radio.value = theme.value;
    if (theme.value === currentMode) radio.checked = true;

    radio.addEventListener('change', function () {
      if (this.checked) {
        currentMode = this.value;
        applyMode(currentMode);
        localStorage.setItem(STORAGE_KEY, currentMode);
      }
    });

    label.appendChild(radio);
    label.appendChild(document.createTextNode(theme.label));
    panel.appendChild(label);
  });

  switcher.appendChild(btn);
  switcher.appendChild(panel);

  btn.addEventListener('click', function () {
    var expanded = panel.hidden;
    panel.hidden = !expanded;
    btn.setAttribute('aria-expanded', String(expanded));
  });

  /* Close when clicking outside */
  document.addEventListener('click', function (e) {
    if (!switcher.contains(e.target) && !panel.hidden) {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  /* Append to body */
  function mount() { document.body.appendChild(switcher); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  /* ── Core mode logic ── */
  function applyMode(mode) {
    var isVB = mode !== 'raw';
    var isBrand = BRAND_THEMES.indexOf(mode) !== -1;

    cssLink.disabled = !isVB;

    BRAND_THEMES.forEach(function (name) {
      var link = document.getElementById('theme-' + name);
      if (link) link.disabled = !(isBrand && name === mode);
    });

    if (isBrand) {
      document.documentElement.dataset.theme = mode;
    } else {
      delete document.documentElement.dataset.theme;
    }

    /* Update brand-mark logos */
    updateBrandMarks(isBrand ? mode : null);

    if (isVB) loadJS();
  }

  function updateBrandMarks(brandName) {
    var marks = document.querySelectorAll('brand-mark');
    marks.forEach(function (mark) {
      /* Cache text before any manipulation */
      if (!mark._switcherText) {
        mark._switcherText = mark.textContent.trim();
      }

      if (brandName && BRAND_LOGOS[brandName]) {
        mark.setAttribute('src', BRAND_LOGOS[brandName]);
        mark.setAttribute('wordmark', '');
        /* Also set _originalText so the component knows the brand name */
        mark._originalText = mark._switcherText;
      } else {
        mark.removeAttribute('src');
        mark.removeAttribute('wordmark');
        mark.removeAttribute('aria-label');
        /* Restore original text — component may not be upgraded yet */
        if (mark._switcherText) {
          mark.textContent = mark._switcherText;
          mark._originalText = mark._switcherText;
        }
      }
    });
  }

  function loadJS() {
    if (document.getElementById('vb-js')) return;
    var script = document.createElement('script');
    script.id = 'vb-js';
    script.type = 'module';
    script.src = '/src/main.js';
    document.head.appendChild(script);
  }
})();
