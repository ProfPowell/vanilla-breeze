<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Semantic Elements — Vanilla Breeze Patterns</title>
  <style>
    /* ── Tokens ─────────────────────────────────────────────── */
    :root {
      --bg:           #0f1117;
      --surface:      #1a1d27;
      --surface-2:    #22263a;
      --border:       #2e3248;
      --text:         #e2e8f0;
      --text-muted:   #8892a4;
      --accent:       #6c8efb;
      --accent-dim:   #2d3a6e;
      --good:         #34d399;
      --warn:         #fbbf24;
      --danger:       #f87171;
      --radius:       10px;
      --font:         system-ui, sans-serif;
      --mono:         ui-monospace, monospace;

      /* meter token mapping */
      --meter-track:  var(--surface-2);
      --meter-good:   var(--good);
      --meter-warn:   var(--warn);
      --meter-danger: var(--danger);
    }

    /* ── Reset ───────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }

    /* ── Reading Progress Bar ────────────────────────────────── */
    #reading-progress {
      position: fixed;
      top: 0; left: 0;
      width: 100%;
      height: 4px;
      appearance: none;
      border: none;
      background: var(--surface-2);
      z-index: 100;

      &::-webkit-progress-bar   { background: transparent; }
      &::-webkit-progress-value { background: var(--accent); transition: width 0.1s; }
      &::-moz-progress-bar      { background: var(--accent); }
    }

    /* ── Layout ──────────────────────────────────────────────── */
    .page-wrap {
      max-width: 860px;
      margin: 0 auto;
      padding: 5rem 2rem 4rem;
    }

    h1 {
      font-size: clamp(1.6rem, 4vw, 2.4rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 0.25rem;
    }
    .subtitle {
      color: var(--text-muted);
      margin-bottom: 3rem;
      font-size: 1.05rem;
    }

    section { margin-bottom: 4rem; }

    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 0.4rem;
      letter-spacing: -0.01em;
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      max-width: 60ch;
    }

    .demo-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .demo-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    code {
      font-family: var(--mono);
      font-size: 0.8rem;
      background: var(--surface-2);
      color: var(--accent);
      padding: 0.15em 0.45em;
      border-radius: 4px;
    }
    .insight {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 0.75rem;
      padding: 0.6rem 0.9rem;
      border-left: 3px solid var(--accent-dim);
      background: color-mix(in srgb, var(--accent) 5%, transparent);
      border-radius: 0 6px 6px 0;
    }

    /* ═══════════════════════════════════════════════════════════
       SECTION 1 — <progress> Skeleton Loader
    ═══════════════════════════════════════════════════════════ */

    .skeleton-list { display: flex; flex-direction: column; gap: 1.25rem; }

    .skeleton-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      display: grid;
      grid-template-columns: 48px 1fr;
      gap: 1rem;
      align-items: start;
    }

    .skeleton-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      overflow: hidden;

      progress {
        width: 100%; height: 100%;
        appearance: none;
        display: block;
        border: none;

        &::-webkit-progress-bar   { background: var(--border); border-radius: 50%; }
        &::-webkit-progress-value { background: transparent; }
        &::-moz-progress-bar      { background: transparent; }
      }
    }

    .skeleton-lines { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.2rem; }

    .skeleton-line {
      height: 10px;
      border-radius: 6px;
      overflow: hidden;

      progress {
        width: 100%; height: 100%;
        appearance: none;
        display: block;
        border: none;

        &::-webkit-progress-bar   { background: var(--border); }
        &::-webkit-progress-value { background: transparent; }
        &::-moz-progress-bar      { background: transparent; }
      }

      &.short progress { }
    }

    /* indeterminate shimmer — only applies when no value attribute */
    progress:not([value]) {
      &::-webkit-progress-bar {
        background: linear-gradient(
          90deg,
          var(--surface-2) 0%,
          var(--border) 40%,
          color-mix(in srgb, var(--accent) 20%, var(--border)) 50%,
          var(--border) 60%,
          var(--surface-2) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.6s ease-in-out infinite;
      }
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Firefox indeterminate shimmer */
    @-moz-keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ═══════════════════════════════════════════════════════════
       SECTION 2 — <meter> Zero-JS Status System
    ═══════════════════════════════════════════════════════════ */

    .meter-grid {
      display: grid;
      gap: 1.25rem;
    }

    .meter-row {
      display: grid;
      grid-template-columns: 140px 1fr 3rem;
      align-items: center;
      gap: 1rem;
    }

    .meter-name {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    meter {
      width: 100%;
      height: 10px;
      appearance: none;
      border: none;
      border-radius: 99px;
      overflow: hidden;
      display: block;

      /* Track */
      &::-webkit-meter-bar {
        background: var(--meter-track);
        border: none;
        border-radius: 99px;
      }

      /* Green — value is near optimum */
      &::-webkit-meter-optimum-value {
        background: var(--meter-good);
        border-radius: 99px;
        transition: width 0.4s ease;
      }

      /* Yellow — value is suboptimum (one step from optimum) */
      &::-webkit-meter-suboptimum-value {
        background: var(--meter-warn);
        border-radius: 99px;
        transition: width 0.4s ease;
      }

      /* Red — value is in danger zone (two steps from optimum) */
      &::-webkit-meter-even-less-good-value {
        background: var(--meter-danger);
        border-radius: 99px;
        transition: width 0.4s ease;
      }

      /* Firefox */
      &::-moz-meter-bar              { border-radius: 99px; transition: width 0.4s ease; }
    }

    .meter-val {
      font-size: 0.8rem;
      font-family: var(--mono);
      color: var(--text-muted);
      text-align: right;
    }

    /* Status dots driven purely by meter zone — no JS */
    .meter-status-row {
      display: grid;
      grid-template-columns: 140px 1fr auto;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border);

      &:last-child { border-bottom: none; }
    }

    .status-label { font-size: 0.85rem; }

    .meter-badge-wrap {
      position: relative;

      meter { display: block; }

      /* Derive status label from pseudo-element color using data-* attrs on parent */
    }

    /* ═══════════════════════════════════════════════════════════
       SECTION 3 — <fieldset> Dashboard Panels
    ═══════════════════════════════════════════════════════════ */

    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    fieldset {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem;
      background: var(--surface);
      position: relative;
      min-width: 0;
    }

    legend {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-muted);
      background: var(--surface);
      padding: 0 0.6rem;
      margin-left: -0.25rem;
    }

    /* Disabled state — entire panel grays out, all inputs blocked */
    fieldset[disabled] {
      opacity: 0.45;
      pointer-events: none;
      filter: saturate(0);

      legend { color: var(--text-muted); }
    }

    /* Panel variant: accent border on status */
    fieldset[data-status="active"] { border-color: color-mix(in srgb, var(--good) 40%, var(--border)); }
    fieldset[data-status="warning"] { border-color: color-mix(in srgb, var(--warn) 40%, var(--border)); }

    /* Panel content */
    .panel-stat {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: var(--text);
      margin: 0.75rem 0 0.25rem;
    }
    .panel-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .panel-control {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    label {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    input[type="range"] {
      width: 100%;
      accent-color: var(--accent);
    }

    input[type="checkbox"] {
      accent-color: var(--accent);
      width: 1rem; height: 1rem;
    }

    select {
      width: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 6px;
      padding: 0.4rem 0.6rem;
      font-size: 0.85rem;
    }

    .toggle-disabled-btn {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;

      &:hover { border-color: var(--accent); color: var(--text); }
    }

    /* ── Article body (for scroll demo) ─────────────────────── */
    .article-body {
      font-size: 0.95rem;
      color: var(--text-muted);
      max-width: 60ch;
      line-height: 1.8;

      p { margin-bottom: 1rem; }
    }

  </style>
</head>
<body>

  <!-- Reading progress bar: no value = starts at 0%, JS will set it -->
  <progress id="reading-progress" max="100" value="0" aria-hidden="true"></progress>

  <div class="page-wrap">

    <h1>Semantic Elements</h1>
    <p class="subtitle">Vanilla Breeze patterns — <code>&lt;progress&gt;</code>, <code>&lt;meter&gt;</code>, <code>&lt;fieldset&gt;</code></p>

    <!-- ══════════════════════════════════════════════════════════
         1. PROGRESS — Skeleton Loader
    ══════════════════════════════════════════════════════════ -->
    <section id="skeleton-section">
      <h2>&lt;progress&gt; — Skeleton Loader</h2>
      <p class="section-desc">
        An indeterminate <code>&lt;progress&gt;</code> (no <code>value</code> attribute) triggers the browser's native animation.
        We override the pseudo-elements to get a shimmer — zero JS, zero canvas, zero extra DOM.
      </p>

      <div class="demo-card">
        <p class="demo-label">Loading state</p>
        <div class="skeleton-list">

          <div class="skeleton-card">
            <div class="skeleton-avatar">
              <progress aria-label="Loading avatar"></progress>
            </div>
            <div class="skeleton-lines">
              <div class="skeleton-line" style="width:70%"><progress aria-label="Loading content"></progress></div>
              <div class="skeleton-line" style="width:90%"><progress aria-label="Loading content"></progress></div>
              <div class="skeleton-line" style="width:50%"><progress aria-label="Loading content"></progress></div>
            </div>
          </div>

          <div class="skeleton-card">
            <div class="skeleton-avatar">
              <progress aria-label="Loading avatar"></progress>
            </div>
            <div class="skeleton-lines">
              <div class="skeleton-line" style="width:80%"><progress aria-label="Loading content"></progress></div>
              <div class="skeleton-line" style="width:60%"><progress aria-label="Loading content"></progress></div>
              <div class="skeleton-line" style="width:75%"><progress aria-label="Loading content"></progress></div>
            </div>
          </div>

        </div>
        <p class="insight">
          Key: omit <code>value</code> → indeterminate. Add <code>value</code> → determinate. Swap with one attribute when data arrives.
        </p>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         2. PROGRESS — Reading Indicator
    ══════════════════════════════════════════════════════════ -->
    <section id="reading-section">
      <h2>&lt;progress&gt; — Reading Progress</h2>
      <p class="section-desc">
        Fixed to the top of the page. One scroll listener, one attribute update.
        The fixed <code>&lt;progress&gt;</code> at top of this page is live — scroll to see it advance.
      </p>

      <div class="demo-card">
        <p class="demo-label">The implementation</p>
        <pre style="font-family:var(--mono);font-size:0.78rem;color:var(--text-muted);line-height:1.7;overflow-x:auto"><code style="background:none;padding:0;color:inherit">&lt;progress id="reading-progress" max="100" value="0" aria-hidden="true"&gt;&lt;/progress&gt;

const bar = document.getElementById('reading-progress');
document.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  bar.value = (scrollTop / (scrollHeight - clientHeight)) * 100;
}, { passive: true });</code></pre>
        <p class="insight">
          <code>aria-hidden="true"</code> keeps it decorative. The bar at the very top of this page is the live version.
        </p>
      </div>

      <div class="demo-card">
        <p class="demo-label">Long-form article (scroll content)</p>
        <div class="article-body">
          <p>The semantic web was a promise made early in the web's history — that machines and humans could share a common understanding of content through structured markup. That promise lives on in elements like <code>&lt;meter&gt;</code>, <code>&lt;progress&gt;</code>, and <code>&lt;fieldset&gt;</code>: elements designed not just for visual output, but to communicate intent.</p>
          <p>When a browser renders a <code>&lt;progress&gt;</code> element without a <code>value</code> attribute, something interesting happens. The element enters an indeterminate state — visually animated by the browser itself, with no JavaScript required. This is progressive enhancement in its purest form: the platform provides a baseline behavior, and we layer meaning on top.</p>
          <p>The <code>&lt;meter&gt;</code> element goes further. Its <code>low</code>, <code>high</code>, and <code>optimum</code> attributes encode domain knowledge into markup. A value within the optimum range renders green. A value that deviates renders yellow. A value in the danger zone renders red. This color logic lives in the element — not in a stylesheet, not in a script.</p>
          <p>Consider what this means for a design system. Instead of maintaining separate CSS classes for status colors, you encode the semantic range in HTML. The styling follows automatically. The logic is in the source of truth — the data — not scattered across presentation layers.</p>
          <p>Fieldsets have an underrated superpower: the <code>disabled</code> attribute cascades. Set <code>disabled</code> on a fieldset and every descendant control is disabled. This is native state management — no JavaScript loop, no class toggling on children. One attribute, one DOM node, total control.</p>
          <p>These elements are a reminder that the web platform has been quietly solving UI problems for decades. Before reaching for a React state machine or a CSS-in-JS library, it's worth asking: does the platform already have this?</p>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════
         3. METER — Zero-JS Status System
    ══════════════════════════════════════════════════════════ -->
    <section id="meter-section">
      <h2>&lt;meter&gt; — Zero-JS Status Colors</h2>
      <p class="section-desc">
        The browser maps <code>low</code>, <code>high</code>, and <code>optimum</code> to three pseudo-elements:
        optimum (green), suboptimum (yellow), even-less-good (red).
        No classes. No JavaScript. No conditional logic.
      </p>

      <div class="demo-card">
        <p class="demo-label">System health — optimum is high (more = better)</p>
        <div class="meter-grid">

          <div class="meter-row">
            <span class="meter-name">CPU Usage</span>
            <!-- optimum=low means HIGH values are bad -->
            <meter min="0" max="100" low="40" high="75" optimum="20" value="22" title="22% CPU usage"></meter>
            <span class="meter-val">22%</span>
          </div>

          <div class="meter-row">
            <span class="meter-name">Memory</span>
            <meter min="0" max="100" low="40" high="75" optimum="20" value="61" title="61% memory used"></meter>
            <span class="meter-val">61%</span>
          </div>

          <div class="meter-row">
            <span class="meter-name">Disk</span>
            <meter min="0" max="100" low="40" high="75" optimum="20" value="88" title="88% disk used"></meter>
            <span class="meter-val">88%</span>
          </div>

        </div>
        <p class="insight">
          <code>optimum="20"</code> puts the ideal in the low range, so high values become warnings/danger automatically.
          Flip <code>optimum</code> to the high end for "more is better" metrics like uptime or score.
        </p>
      </div>

      <div class="demo-card">
        <p class="demo-label">Skill proficiency — optimum is high (more = better)</p>
        <div class="meter-grid">

          <div class="meter-row">
            <span class="meter-name">HTML</span>
            <meter min="0" max="10" low="4" high="7" optimum="10" value="9" title="HTML: 9/10"></meter>
            <span class="meter-val">9/10</span>
          </div>

          <div class="meter-row">
            <span class="meter-name">CSS</span>
            <meter min="0" max="10" low="4" high="7" optimum="10" value="7" title="CSS: 7/10"></meter>
            <span class="meter-val">7/10</span>
          </div>

          <div class="meter-row">
            <span class="meter-name">JavaScript</span>
            <meter min="0" max="10" low="4" high="7" optimum="10" value="3" title="JS: 3/10"></meter>
            <span class="meter-val">3/10</span>
          </div>

        </div>
        <p class="insight">
          Same element, same CSS. Just flipping <code>optimum</code> to 10 reverses the color logic — green for high, red for low.
        </p>
      </div>

    </section>

    <!-- ══════════════════════════════════════════════════════════
         4. FIELDSET — Dashboard Panels
    ══════════════════════════════════════════════════════════ -->
    <section id="fieldset-section">
      <h2>&lt;fieldset&gt; — Dashboard Panels</h2>
      <p class="section-desc">
        The <code>disabled</code> attribute cascades to all descendant controls — one attribute disables an entire panel.
        The "Maintenance" panel below demonstrates this. <code>&lt;legend&gt;</code> provides accessible labeling for free.
      </p>

      <div class="demo-card">
        <p class="demo-label">Server configuration dashboard</p>
        <div class="dashboard">

          <fieldset data-status="active">
            <legend>Cache Settings</legend>
            <p class="panel-stat">2.4 GB</p>
            <p class="panel-sub">Cache used of 8 GB limit</p>
            <div class="panel-control">
              <label>
                TTL (seconds)
                <input type="range" min="60" max="3600" value="900">
              </label>
              <label>
                <input type="checkbox" checked>
                Enable compression
              </label>
            </div>
          </fieldset>

          <fieldset data-status="warning">
            <legend>Rate Limiting</legend>
            <p class="panel-stat">847</p>
            <p class="panel-sub">Requests / min (limit: 1000)</p>
            <div class="panel-control">
              <label>Strategy
                <select>
                  <option>Sliding window</option>
                  <option>Fixed window</option>
                  <option>Token bucket</option>
                </select>
              </label>
              <label>
                <input type="checkbox">
                Block on limit exceeded
              </label>
            </div>
          </fieldset>

          <fieldset id="maintenance-panel">
            <legend>Maintenance Mode</legend>
            <p class="panel-stat">Offline</p>
            <p class="panel-sub">Region: US-EAST-1</p>
            <div class="panel-control">
              <label>
                <input type="checkbox">
                Redirect to status page
              </label>
              <label>
                Duration
                <select>
                  <option>15 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                </select>
              </label>
            </div>
            <button class="toggle-disabled-btn" onclick="togglePanel()">Toggle disabled</button>
          </fieldset>

        </div>
        <p class="insight">
          <code>fieldset[disabled]</code> disables every input, select, button, and textarea inside — one attribute, zero JS loops over children.
          Combine with <code>pointer-events:none</code> and <code>opacity</code> for a visual lock.
        </p>
      </div>

    </section>

  </div><!-- /page-wrap -->

  <script>
    /* Reading progress — passive scroll, single attr update */
    const readingBar = document.getElementById('reading-progress');
    document.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      readingBar.value = (scrollTop / (scrollHeight - clientHeight)) * 100;
    }, { passive: true });

    /* Fieldset disabled toggle demo */
    function togglePanel() {
      const panel = document.getElementById('maintenance-panel');
      const btn = panel.querySelector('.toggle-disabled-btn');
      const isDisabled = panel.disabled;
      panel.disabled = !isDisabled;
      /* Re-enable the button itself so you can toggle back */
      btn.disabled = false;
      btn.textContent = isDisabled ? 'Toggle disabled' : 'Toggle disabled';
    }
  </script>

</body>
</html>