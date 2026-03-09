<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>datalist · Vanilla Breeze Exploration</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink:       #1a1612;
      --paper:     #f5f0e8;
      --cream:     #ede7d9;
      --accent:    #c84b2f;
      --muted:     #7a6e62;
      --rule:      #d4ccbf;
      --success:   #2d6a4f;
      --mono:      'DM Mono', monospace;
      --serif:     'Fraunces', Georgia, serif;
      --radius:    4px;
      --gap:       1.5rem;
    }

    html { font-size: 16px; }
    body {
      font-family: var(--mono);
      background: var(--paper);
      color: var(--ink);
      min-height: 100vh;
      padding: 2rem 1rem 4rem;
    }

    /* ── Layout ── */
    .page { max-width: 760px; margin-inline: auto; }

    header {
      border-bottom: 2px solid var(--ink);
      padding-bottom: 1.25rem;
      margin-bottom: 2.5rem;
    }

    header h1 {
      font-family: var(--serif);
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 300;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    header h1 em {
      font-style: italic;
      color: var(--accent);
    }

    header p {
      margin-top: .5rem;
      color: var(--muted);
      font-size: .8rem;
    }

    /* ── Demo cards ── */
    .demos { display: grid; gap: 2rem; }

    .demo {
      background: var(--cream);
      border: 1px solid var(--rule);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .demo-header {
      display: flex;
      align-items: baseline;
      gap: .75rem;
      padding: .9rem 1.25rem;
      border-bottom: 1px solid var(--rule);
      background: var(--paper);
    }

    .demo-header h2 {
      font-family: var(--serif);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .badge {
      font-size: .65rem;
      font-family: var(--mono);
      text-transform: uppercase;
      letter-spacing: .08em;
      padding: .15em .5em;
      border-radius: 2px;
      background: var(--ink);
      color: var(--paper);
    }
    .badge.server { background: var(--accent); }
    .badge.static { background: var(--muted); }

    .demo-body { padding: 1.25rem; }
    .demo-body p.note {
      font-size: .75rem;
      color: var(--muted);
      margin-top: .75rem;
      line-height: 1.5;
    }

    /* ── Form controls ── */
    label {
      display: block;
      font-size: .75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--muted);
      margin-bottom: .4rem;
    }

    input[type="text"],
    input[type="search"],
    input[type="number"],
    input[type="email"],
    input[type="url"] {
      width: 100%;
      padding: .6rem .8rem;
      border: 1px solid var(--rule);
      border-radius: var(--radius);
      background: var(--paper);
      color: var(--ink);
      font-family: var(--mono);
      font-size: .9rem;
      transition: border-color .15s, box-shadow .15s;
      outline: none;
    }

    input:focus {
      border-color: var(--ink);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--ink) 10%, transparent);
    }

    input[type="range"] {
      width: 100%;
      accent-color: var(--accent);
      cursor: pointer;
    }

    input[type="color"] {
      width: 100%;
      height: 3rem;
      padding: .2rem;
      border: 1px solid var(--rule);
      border-radius: var(--radius);
      cursor: pointer;
      background: var(--paper);
    }

    /* ── Output display ── */
    .output {
      margin-top: 1rem;
      padding: .75rem 1rem;
      background: var(--paper);
      border: 1px solid var(--rule);
      border-radius: var(--radius);
      font-size: .8rem;
      min-height: 2.5rem;
      display: flex;
      align-items: center;
      gap: .5rem;
      flex-wrap: wrap;
    }

    .output .label {
      color: var(--muted);
      font-size: .7rem;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    .output .value {
      font-weight: 500;
      color: var(--ink);
    }

    .output .indicator {
      font-size: .7rem;
      padding: .1em .4em;
      border-radius: 2px;
    }
    .indicator.match  { background: color-mix(in srgb, var(--success) 15%, transparent); color: var(--success); }
    .indicator.custom { background: color-mix(in srgb, var(--muted) 15%, transparent); color: var(--muted); }

    /* ── Range tick labels ── */
    .range-wrap { position: relative; }
    .tick-labels {
      display: flex;
      justify-content: space-between;
      margin-top: .3rem;
      font-size: .65rem;
      color: var(--muted);
    }

    /* ── Color swatches ── */
    .swatches {
      display: flex;
      gap: .5rem;
      flex-wrap: wrap;
      margin-top: .75rem;
    }

    .swatch {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius);
      border: 1px solid var(--rule);
      cursor: pointer;
      transition: transform .1s, box-shadow .1s;
      position: relative;
    }
    .swatch:hover { transform: scale(1.15); box-shadow: 0 2px 8px rgba(0,0,0,.15); }
    .swatch[aria-label]::after {
      content: attr(aria-label);
      position: absolute;
      bottom: calc(100% + 4px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--ink);
      color: var(--paper);
      font-size: .6rem;
      padding: .2em .4em;
      border-radius: 2px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity .15s;
    }
    .swatch:hover::after { opacity: 1; }

    /* ── Suggest component output ── */
    .suggestions-list {
      list-style: none;
      margin-top: .5rem;
      border: 1px solid var(--rule);
      border-radius: var(--radius);
      overflow: hidden;
      display: none;
    }
    .suggestions-list.visible { display: block; }
    .suggestions-list li {
      padding: .5rem .8rem;
      font-size: .85rem;
      cursor: pointer;
      border-bottom: 1px solid var(--rule);
      background: var(--paper);
      transition: background .1s;
    }
    .suggestions-list li:last-child { border-bottom: none; }
    .suggestions-list li:hover,
    .suggestions-list li[aria-selected="true"] { background: var(--cream); }
    .suggestions-list li mark {
      background: transparent;
      font-weight: 600;
      color: var(--accent);
    }

    /* ── Code block ── */
    details {
      margin-top: 1rem;
    }
    summary {
      font-size: .7rem;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--muted);
      cursor: pointer;
      user-select: none;
    }
    summary:hover { color: var(--ink); }
    pre {
      margin-top: .5rem;
      padding: .75rem 1rem;
      background: var(--ink);
      color: #d4ccbf;
      border-radius: var(--radius);
      font-size: .72rem;
      line-height: 1.6;
      overflow-x: auto;
      tab-size: 2;
    }
    pre .cm { color: #7a6e62; }
    pre .kw { color: #c9906b; }
    pre .st { color: #8fc48b; }
    pre .at { color: #7ab8d4; }

    /* ── Status bar ── */
    .status-bar {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-size: .7rem;
      color: var(--muted);
      margin-top: .75rem;
    }
    .status-dot {
      width: .5rem;
      height: .5rem;
      border-radius: 50%;
      background: var(--muted);
    }
    .status-dot.active { background: var(--success); }
    .status-dot.loading {
      background: var(--accent);
      animation: pulse .8s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .3; }
    }

    /* ── Grid for demo 4 ── */
    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 480px) {
      .field-row { grid-template-columns: 1fr; }
    }

  </style>
</head>
<body>
<div class="page">

  <header>
    <h1><em>datalist</em> exploration<br>for Vanilla Breeze</h1>
    <p>Four demos · Static, Dynamic, Range, Color · No framework · No dependencies</p>
  </header>

  <div class="demos">

    <!-- ══ DEMO 1: Static autocomplete ══ -->
    <article class="demo" id="demo-static">
      <div class="demo-header">
        <h2>Static autocomplete</h2>
        <span class="badge static">static</span>
      </div>
      <div class="demo-body">
        <label for="country-input">Country</label>
        <input
          type="text"
          id="country-input"
          list="country-list"
          placeholder="Start typing…"
          autocomplete="off"
        >
        <datalist id="country-list">
          <option value="Australia">
          <option value="Austria">
          <option value="Belgium">
          <option value="Brazil">
          <option value="Canada">
          <option value="Chile">
          <option value="China">
          <option value="Colombia">
          <option value="Denmark">
          <option value="Egypt">
          <option value="Finland">
          <option value="France">
          <option value="Germany">
          <option value="Greece">
          <option value="India">
          <option value="Indonesia">
          <option value="Ireland">
          <option value="Italy">
          <option value="Japan">
          <option value="Mexico">
          <option value="Netherlands">
          <option value="New Zealand">
          <option value="Nigeria">
          <option value="Norway">
          <option value="Portugal">
          <option value="South Africa">
          <option value="South Korea">
          <option value="Spain">
          <option value="Sweden">
          <option value="Switzerland">
          <option value="United Kingdom">
          <option value="United States">
        </datalist>
        <div class="output" id="country-output">
          <span class="label">Selected →</span>
          <span class="value" id="country-value">—</span>
          <span class="indicator" id="country-indicator"></span>
        </div>
        <p class="note">
          Zero JS needed for basic use. The output below is enhanced by a small listener
          that detects whether the value matches a datalist option (vs free text).
        </p>
        <details>
          <summary>View pattern</summary>
          <pre><span class="cm">/* HTML only — works without JS */</span>
&lt;input <span class="at">type</span>=<span class="st">"text"</span> <span class="at">list</span>=<span class="st">"country-list"</span>&gt;
&lt;datalist <span class="at">id</span>=<span class="st">"country-list"</span>&gt;
  &lt;option <span class="at">value</span>=<span class="st">"Australia"</span>&gt;
  &lt;option <span class="at">value</span>=<span class="st">"France"</span>&gt;
  <span class="cm">/* … */</span>
&lt;/datalist&gt;

<span class="cm">/* JS: detect list match vs free text */</span>
<span class="kw">const</span> isListValue = (input, datalistId) => {
  <span class="kw">const</span> opts = [...document.querySelectorAll(
    `#${datalistId} option`
  )].map(o => o.value);
  <span class="kw">return</span> opts.includes(input.value);
};</pre>
        </details>
      </div>
    </article>

    <!-- ══ DEMO 2: Dynamic / server-driven ══ -->
    <article class="demo" id="demo-dynamic">
      <div class="demo-header">
        <h2>Dynamic — server-driven suggestions</h2>
        <span class="badge server">fetch</span>
      </div>
      <div class="demo-body">
        <label for="city-input">City search</label>
        <input
          type="search"
          id="city-input"
          list="city-suggestions"
          placeholder="Type a city name…"
          autocomplete="off"
          data-src="cities"
          data-min="2"
        >
        <datalist id="city-suggestions"></datalist>

        <div class="status-bar">
          <div class="status-dot" id="city-status-dot"></div>
          <span id="city-status-text">Waiting for input…</span>
        </div>

        <div class="output" id="city-output" style="margin-top:.5rem">
          <span class="label">Selected →</span>
          <span class="value" id="city-value">—</span>
        </div>

        <p class="note">
          Simulates a debounced fetch (300ms). In production, replace
          <code>fetchSuggestions()</code> with a real endpoint. The
          <code>data-src</code> attribute drives which data set to query —
          matching the Vanilla Breeze <code>data-*</code> config convention.
        </p>
        <details>
          <summary>View pattern</summary>
          <pre><span class="cm">/* HTML */</span>
&lt;input <span class="at">list</span>=<span class="st">"city-suggestions"</span>
       <span class="at">data-src</span>=<span class="st">"/api/cities"</span>
       <span class="at">data-min</span>=<span class="st">"2"</span>&gt;
&lt;datalist <span class="at">id</span>=<span class="st">"city-suggestions"</span>&gt;&lt;/datalist&gt;

<span class="cm">/* JS — debounced fetch populates datalist */</span>
<span class="kw">function</span> initDynamicDatalist(input) {
  <span class="kw">const</span> datalist = document.getElementById(input.list.id);
  <span class="kw">const</span> min = +input.dataset.min || 2;
  <span class="kw">let</span> timer;

  input.addEventListener(<span class="st">'input'</span>, () => {
    clearTimeout(timer);
    <span class="kw">if</span> (input.value.length &lt; min) { datalist.innerHTML = <span class="st">''</span>; return; }
    timer = setTimeout(<span class="kw">async</span> () => {
      <span class="kw">const</span> results = <span class="kw">await</span> fetchSuggestions(input.dataset.src, input.value);
      datalist.innerHTML = results
        .map(r => `&lt;option value="${r}"&gt;`)
        .join(<span class="st">''</span>);
    }, 300);
  });
}</pre>
        </details>
      </div>
    </article>

    <!-- ══ DEMO 3: Range with tick marks ══ -->
    <article class="demo" id="demo-range">
      <div class="demo-header">
        <h2>Range — tick marks &amp; step labels</h2>
        <span class="badge static">static</span>
      </div>
      <div class="demo-body">
        <label for="budget-range">Budget range</label>
        <div class="range-wrap">
          <input
            type="range"
            id="budget-range"
            min="0"
            max="5000"
            step="500"
            value="2500"
            list="budget-ticks"
          >
          <datalist id="budget-ticks">
            <option value="0">
            <option value="500">
            <option value="1000">
            <option value="1500">
            <option value="2000">
            <option value="2500">
            <option value="3000">
            <option value="3500">
            <option value="4000">
            <option value="4500">
            <option value="5000">
          </datalist>
          <div class="tick-labels">
            <span>$0</span>
            <span>$1k</span>
            <span>$2k</span>
            <span>$3k</span>
            <span>$4k</span>
            <span>$5k</span>
          </div>
        </div>

        <div class="output" id="range-output">
          <span class="label">Budget →</span>
          <span class="value" id="range-value">$2,500</span>
        </div>

        <p class="note">
          Datalist on a range adds tick marks at each <code>&lt;option&gt;</code> value.
          No custom tick-mark CSS required. Snapping behavior comes from <code>step</code>.
          Combine with a visible output element for live feedback.
        </p>
        <details>
          <summary>View pattern</summary>
          <pre>&lt;input <span class="at">type</span>=<span class="st">"range"</span> <span class="at">min</span>=<span class="st">"0"</span> <span class="at">max</span>=<span class="st">"5000"</span>
       <span class="at">step</span>=<span class="st">"500"</span> <span class="at">list</span>=<span class="st">"budget-ticks"</span>&gt;
&lt;datalist <span class="at">id</span>=<span class="st">"budget-ticks"</span>&gt;
  &lt;option <span class="at">value</span>=<span class="st">"0"</span>&gt;
  &lt;option <span class="at">value</span>=<span class="st">"500"</span>&gt;
  <span class="cm">/* … */</span>
&lt;/datalist&gt;</pre>
        </details>
      </div>
    </article>

    <!-- ══ DEMO 4: Color palette ══ -->
    <article class="demo" id="demo-color">
      <div class="demo-header">
        <h2>Color — palette suggestions</h2>
        <span class="badge static">static</span>
      </div>
      <div class="demo-body">
        <div class="field-row">
          <div>
            <label for="color-picker">Theme color</label>
            <input
              type="color"
              id="color-picker"
              list="brand-palette"
              value="#c84b2f"
            >
            <datalist id="brand-palette">
              <option value="#c84b2f">
              <option value="#1a1612">
              <option value="#2d6a4f">
              <option value="#4a7fbd">
              <option value="#e8a838">
              <option value="#8b3a8b">
              <option value="#f5f0e8">
              <option value="#7a6e62">
            </datalist>
          </div>
          <div>
            <label>Brand palette (click to apply)</label>
            <div class="swatches" id="swatches" role="list" aria-label="Brand color swatches"></div>
          </div>
        </div>

        <div class="output" id="color-output">
          <span class="label">Color →</span>
          <span class="value" id="color-hex">#c84b2f</span>
          <span class="value" id="color-swatch" style="
            display:inline-block;
            width:1em;height:1em;
            border-radius:2px;
            background:#c84b2f;
            border:1px solid var(--rule);
          "></span>
        </div>

        <p class="note">
          Color inputs accept a datalist for palette suggestions shown as swatches
          in the native color picker (Chromium only). The JS-rendered swatches below
          the input work cross-browser and apply values directly — a useful progressive
          enhancement companion.
        </p>
        <details>
          <summary>View pattern</summary>
          <pre>&lt;input <span class="at">type</span>=<span class="st">"color"</span> <span class="at">list</span>=<span class="st">"brand-palette"</span>&gt;
&lt;datalist <span class="at">id</span>=<span class="st">"brand-palette"</span>&gt;
  &lt;option <span class="at">value</span>=<span class="st">"#c84b2f"</span>&gt;
  &lt;option <span class="at">value</span>=<span class="st">"#2d6a4f"</span>&gt;
  <span class="cm">/* … */</span>
&lt;/datalist&gt;

<span class="cm">/* Cross-browser swatch companion */</span>
<span class="kw">function</span> buildSwatches(datalistId, colorInput) {
  <span class="kw">const</span> colors = [...document.querySelectorAll(
    `#${datalistId} option`
  )].map(o => o.value);
  <span class="cm">/* render swatch buttons that set colorInput.value */</span>
}</pre>
        </details>
      </div>
    </article>

  </div><!-- /demos -->

</div><!-- /page -->

<script>
  /* ══════════════════════════════════════════
     FUNCTIONAL CORE — pure helpers
  ══════════════════════════════════════════ */

  /** Returns array of values from a datalist element */
  const getListValues = (datalistId) =>
    [...document.querySelectorAll(`#${datalistId} option`)].map(o => o.value);

  /** True if value exactly matches a datalist option */
  const isListMatch = (value, datalistId) =>
    getListValues(datalistId).includes(value);

  /** Format a number as USD */
  const formatUSD = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  /** Debounce */
  const debounce = (fn, ms) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  /** Simulated async city lookup (replace with real fetch in production) */
  const CITY_DATA = [
    'Amsterdam','Athens','Auckland','Bangkok','Barcelona',
    'Beijing','Berlin','Bogotá','Brisbane','Brussels',
    'Buenos Aires','Cairo','Cape Town','Chicago','Copenhagen',
    'Dallas','Delhi','Dublin','Dubai','Edinburgh',
    'Frankfurt','Helsinki','Ho Chi Minh City','Hong Kong','Istanbul',
    'Jakarta','Johannesburg','Karachi','Kuala Lumpur','Lagos',
    'Lima','Lisbon','London','Los Angeles','Madrid',
    'Manila','Melbourne','Mexico City','Miami','Milan',
    'Montreal','Moscow','Mumbai','Nairobi','New York',
    'Osaka','Oslo','Paris','Prague','Rome',
    'San Francisco','Santiago','São Paulo','Seoul','Shanghai',
    'Singapore','Stockholm','Sydney','Taipei','Tehran',
    'Tokyo','Toronto','Vancouver','Vienna','Warsaw',
    'Washington DC','Zurich'
  ];

  async function fetchCities(query) {
    // Simulate ~150ms network latency
    await new Promise(r => setTimeout(r, 150));
    const q = query.toLowerCase();
    return CITY_DATA.filter(c => c.toLowerCase().includes(q)).slice(0, 8);
  }


  /* ══════════════════════════════════════════
     DEMO 1 — Static country autocomplete
  ══════════════════════════════════════════ */

  (function initStaticDemo() {
    const input = document.getElementById('country-input');
    const valueEl = document.getElementById('country-value');
    const indicator = document.getElementById('country-indicator');

    input.addEventListener('input', () => {
      const v = input.value.trim();
      valueEl.textContent = v || '—';
      if (!v) { indicator.textContent = ''; indicator.className = 'indicator'; return; }

      if (isListMatch(v, 'country-list')) {
        indicator.textContent = '✓ list match';
        indicator.className = 'indicator match';
      } else {
        indicator.textContent = 'custom entry';
        indicator.className = 'indicator custom';
      }
    });
  })();


  /* ══════════════════════════════════════════
     DEMO 2 — Dynamic / fetch-driven
  ══════════════════════════════════════════ */

  (function initDynamicDemo() {
    const input     = document.getElementById('city-input');
    const datalist  = document.getElementById('city-suggestions');
    const dot       = document.getElementById('city-status-dot');
    const statusEl  = document.getElementById('city-status-text');
    const valueEl   = document.getElementById('city-value');
    const min       = +(input.dataset.min ?? 2);

    const setStatus = (state, text) => {
      dot.className = `status-dot ${state}`;
      statusEl.textContent = text;
    };

    const populate = debounce(async (q) => {
      setStatus('loading', 'Fetching…');
      const results = await fetchCities(q);
      datalist.innerHTML = results.map(r => `<option value="${r}">`).join('');
      setStatus('active', `${results.length} suggestion${results.length !== 1 ? 's' : ''} loaded`);
    }, 300);

    input.addEventListener('input', () => {
      const v = input.value.trim();
      valueEl.textContent = '—';

      if (v.length < min) {
        datalist.innerHTML = '';
        setStatus('', `Type at least ${min} characters…`);
        return;
      }
      populate(v);
    });

    // Detect when user picks a datalist option (change fires on selection)
    input.addEventListener('change', () => {
      valueEl.textContent = input.value || '—';
      setStatus('active', 'Value selected');
    });
  })();


  /* ══════════════════════════════════════════
     DEMO 3 — Range with tick marks
  ══════════════════════════════════════════ */

  (function initRangeDemo() {
    const range   = document.getElementById('budget-range');
    const valueEl = document.getElementById('range-value');

    const update = () => { valueEl.textContent = formatUSD(range.value); };
    range.addEventListener('input', update);
    update(); // init
  })();


  /* ══════════════════════════════════════════
     DEMO 4 — Color palette
  ══════════════════════════════════════════ */

  (function initColorDemo() {
    const picker  = document.getElementById('color-picker');
    const hexEl   = document.getElementById('color-hex');
    const swEl    = document.getElementById('color-swatch');
    const swatches = document.getElementById('swatches');

    // Name map for tooltips
    const names = {
      '#c84b2f': 'Accent red',
      '#1a1612': 'Ink',
      '#2d6a4f': 'Forest',
      '#4a7fbd': 'Slate blue',
      '#e8a838': 'Amber',
      '#8b3a8b': 'Plum',
      '#f5f0e8': 'Paper',
      '#7a6e62': 'Muted',
    };

    const updateOutput = (hex) => {
      hexEl.textContent = hex;
      swEl.style.background = hex;
    };

    // Build cross-browser swatch companion
    getListValues('brand-palette').forEach(hex => {
      const btn = document.createElement('button');
      btn.className = 'swatch';
      btn.style.background = hex;
      btn.setAttribute('aria-label', names[hex] ?? hex);
      btn.title = names[hex] ?? hex;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        picker.value = hex;
        updateOutput(hex);
      });
      swatches.appendChild(btn);
    });

    picker.addEventListener('input', () => updateOutput(picker.value));
    updateOutput(picker.value); // init
  })();
</script>
</body>
</html>