The CSS Shapes Module Level 1 specification defines a set of CSS properties that allow authors to create shapes and clip content to them.  The shape() function is now landed in all browsers so we should leverage it in Vanilla Breeze.  clip-path is also quite helpful.

Some initial thoughts are use of shapes was done by claude and I have provided version 1 and version 2 of this exploration below.

Generally I think this should work on <hr> likely in a special way and as a start end aspect data-* wise likely on things like <section>, <article>, <header>, <footer> etc.   Special cases like badges make sense as well.

Figures, Images and pictures are good for cut-outs with shapes.

A special case that I would like to focus on shortly will be for building chat components so callouts, speech bubbles, though bubbles and others might make a lot of sense.

Evaluate the idea of using the shape() function and create our useful shapes - likely evolving them up from https://css-shape.com/ and https://www.smashingmagazine.com/2024/05/modern-guide-making-css-shapes/ and
https://developer.chrome.com/blog/css-shape

Make the plan and then after I approve it create the tasks so we can explore it.  I'd imagine we would want to use some of these on an extreme theme and I propose cyber and kawaii as two test themes to do so.

-- Version 1 --

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CSS shape() Exploration — Vanilla Breeze Ideas</title>
<style>
  /* ── Tokens ── */
  :root {
    --primary:   oklch(55% 0.22 260);
    --accent:    oklch(65% 0.25 320);
    --surface:   oklch(98% 0.005 260);
    --surface-2: oklch(93% 0.01  260);
    --text:      oklch(20% 0.01  260);
    --text-muted:oklch(50% 0.01  260);
    --radius:    .5rem;
    --gap:       1.5rem;
    font-size: 18px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: system-ui, sans-serif;
    background: var(--surface);
    color: var(--text);
    line-height: 1.6;
  }

  /* ── Layout ── */
  .page-header {
    background: var(--primary);
    color: white;
    padding: 3rem 2rem 5rem;
    text-align: center;
    /* Demo: shape() on the header itself */
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 75%,
      curve to 50% 90% with 80% 105%,
      curve to 0% 75% with 20% 105%,
      close
    );
  }

  .page-header h1 { font-size: 2rem; font-weight: 700; }
  .page-header p  { opacity: .85; margin-top: .5rem; font-size: 1rem; }

  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem 4rem;
  }

  section {
    margin-block: 3rem;
  }

  section > h2 {
    font-size: 1.1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--text-muted);
    margin-block-end: .25rem;
  }
  section > p.desc {
    color: var(--text-muted);
    font-size: .875rem;
    margin-block-end: 1.5rem;
  }

  .grid {
    display: grid;
    gap: var(--gap);
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  /* ── Code callout ── */
  .code-note {
    background: oklch(15% 0.02 260);
    color: oklch(85% 0.05 260);
    font-family: monospace;
    font-size: .75rem;
    padding: .75rem 1rem;
    border-radius: var(--radius);
    margin-block-end: 1.5rem;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  /* ═══════════════════════════════════════
     1. SECTION DIVIDERS
     Data API: <section data-divider="wave|chevron|scallop|diagonal">
  ═══════════════════════════════════════ */

  .demo-section-block {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    color: white;
    font-size: .9rem;
  }

  .demo-section-block:nth-child(odd)  { background: var(--primary); }
  .demo-section-block:nth-child(even) { background: var(--accent);  }

  /* Wave — negative space overlap: the bottom block clips to reveal the top */
  [data-divider="wave"] {
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 70%,
      curve to 75% 85% with 87.5% 100%,
      curve to 50% 70% with 62.5% 70%,
      curve to 25% 85% with 37.5% 70%,
      curve to 0% 70%  with 12.5% 100%,
      close
    );
  }

  [data-divider="chevron"] {
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 75%,
      line to 50% 100%,
      line to 0% 75%,
      close
    );
  }

  [data-divider="scallop"] {
    --r: 12%;
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 72%,
      curve to 83.33% 72% with 91.66% 100%,
      curve to 66.66% 72% with 75% 100%,
      curve to 50%    72% with 58.33% 100%,
      curve to 33.33% 72% with 41.66% 100%,
      curve to 16.66% 72% with 25% 100%,
      curve to 0%     72% with 8.33% 100%,
      close
    );
  }

  [data-divider="diagonal"] {
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 100%,
      line to 0% 75%,
      close
    );
  }

  /* ═══════════════════════════════════════
     2. BADGES / TAGS
     Data API: <span data-badge="ribbon|notch|flag|pennant">
  ═══════════════════════════════════════ */

  .badge-demo {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem 2rem;
    align-items: center;
  }

  [data-badge] {
    display: inline-flex;
    align-items: center;
    padding: .4rem 1.2rem;
    background: var(--primary);
    color: white;
    font-size: .8rem;
    font-weight: 600;
    letter-spacing: .04em;
  }

  [data-badge="ribbon"] {
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 85% 50%,
      line to 100% 100%,
      line to 0% 100%,
      close
    );
    padding-inline-end: 1.8rem;
  }

  [data-badge="notch"] {
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 100%,
      line to 0% 100%,
      line to 12% 50%,
      close
    );
    padding-inline-start: 1.6rem;
  }

  [data-badge="flag"] {
    clip-path: shape(
      from 0% 0%,
      line to 87% 0%,
      line to 100% 50%,
      line to 87% 100%,
      line to 0% 100%,
      close
    );
    padding-inline-end: 1.8rem;
  }

  [data-badge="double-arrow"] {
    clip-path: shape(
      from 10% 0%,
      line to 90% 0%,
      line to 100% 50%,
      line to 90% 100%,
      line to 10% 100%,
      line to 0% 50%,
      close
    );
    padding-inline: 1.4rem;
  }

  [data-badge="stamp"] {
    border-radius: 4px;
    clip-path: shape(
      from 5% 0%,
      curve to 10% 0% with 5% 5%,
      line to 90% 0%,
      curve to 95% 5% with 95% 0%,
      line to 95% 95%,
      curve to 90% 100% with 95% 100%,
      line to 10% 100%,
      curve to 5% 95% with 5% 100%,
      close
    );
    /* Real stamp: scallop edge via repeating cuts — shown here simplified */
    outline: 2px dashed white;
    outline-offset: -6px;
  }

  /* ═══════════════════════════════════════
     3. MEDIA / HERO CLIPS
     Data API: <figure data-clip="arch|diagonal|hexagon|swoosh">
  ═══════════════════════════════════════ */

  [data-clip] {
    width: 220px;
    height: 220px;
    overflow: hidden;
    flex-shrink: 0;
  }

  [data-clip] img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Placeholder using gradient for demo */
  [data-clip] .img-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(in oklch 135deg, var(--primary), var(--accent));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: .8rem;
    font-weight: 600;
  }

  [data-clip="arch"] {
    clip-path: shape(
      from 0% 100%,
      line to 0% 35%,
      curve to 50% 0% with 0% 0%,
      curve to 100% 35% with 100% 0%,
      line to 100% 100%,
      close
    );
    width: 200px;
    height: 260px;
  }

  [data-clip="diagonal"] {
    clip-path: shape(
      from 0% 10%,
      line to 100% 0%,
      line to 100% 90%,
      line to 0% 100%,
      close
    );
  }

  [data-clip="hexagon"] {
    clip-path: shape(
      from 50%  0%,
      line to 100% 25%,
      line to 100% 75%,
      line to 50% 100%,
      line to 0% 75%,
      line to 0% 25%,
      close
    );
  }

  [data-clip="swoosh"] {
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 85%,
      curve to 0% 100% with 60% 65%,
      close
    );
  }

  [data-clip="leaf"] {
    clip-path: shape(
      from 50% 0%,
      curve to 100% 50% with 100% 0%,
      curve to 50% 100% with 100% 100%,
      curve to 0% 50% with 0% 100%,
      curve to 50% 0% with 0% 0%,
      close
    );
  }

  .clip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    align-items: flex-end;
  }

  .clip-label {
    text-align: center;
    font-size: .75rem;
    color: var(--text-muted);
    margin-top: .5rem;
    font-family: monospace;
  }

  /* ═══════════════════════════════════════
     4. CALLOUTS / SPEECH BUBBLES
     Data API: <blockquote data-callout="tip|warning|speech|thought">
  ═══════════════════════════════════════ */

  [data-callout] {
    background: var(--surface-2);
    padding: 1.25rem 1.5rem;
    font-size: .9rem;
    position: relative;
  }

  [data-callout] strong {
    display: block;
    font-size: .75rem;
    text-transform: uppercase;
    letter-spacing: .08em;
    margin-block-end: .25rem;
    color: var(--primary);
  }

  /* Speech bubble — uses clip-path on a pseudo for the tail */
  [data-callout="speech"] {
    background: var(--primary);
    color: white;
    border-radius: 1rem 1rem 1rem 0;
    clip-path: shape(
      from 0% 8%,
      curve to 8% 0% with 0% 0%,
      line to 92% 0%,
      curve to 100% 8% with 100% 0%,
      line to 100% 82%,
      curve to 92% 90% with 100% 90%,
      line to 20% 90%,
      line to 0% 100%,
      line to 8% 90%,
      curve to 0% 82% with 0% 90%,
      close
    );
    padding-block-end: 2rem;
  }

  [data-callout="tip"] {
    border-inline-start: 3px solid var(--primary);
    clip-path: shape(
      from 0% 0%,
      line to 100% 0%,
      line to 100% 100%,
      line to 0% 100%,
      close
    );
  }

  /* Notched corner callout */
  [data-callout="notched"] {
    clip-path: shape(
      from 0% 0%,
      line to calc(100% - 24px) 0%,
      line to 100% 24px,
      line to 100% 100%,
      line to 0% 100%,
      close
    );
    background: oklch(from var(--primary) 96% 0.03 h);
    border: 1px solid oklch(from var(--primary) 85% 0.08 h);
  }

  /* ═══════════════════════════════════════
     5. ANIMATED SHAPE
     Custom property animation — the real power
  ═══════════════════════════════════════ */

  .animated-demo {
    width: 280px;
    height: 200px;
    background: linear-gradient(in oklch 135deg, var(--primary), var(--accent));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: .9rem;
    cursor: pointer;
    animation: morph 4s ease-in-out infinite;
  }

  @keyframes morph {
    0%, 100% {
      clip-path: shape(
        from 0% 0%,
        line to 100% 0%,
        line to 100% 80%,
        curve to 50% 100% with 75% 115%,
        curve to 0% 80% with 25% 115%,
        close
      );
    }
    50% {
      clip-path: shape(
        from 0% 20%,
        curve to 50% 0% with 25% -15%,
        curve to 100% 20% with 75% -15%,
        line to 100% 100%,
        line to 0% 100%,
        close
      );
    }
  }

  .animated-demo-wrap { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }

  .morph-note {
    flex: 1;
    min-width: 220px;
    background: var(--surface-2);
    border-radius: var(--radius);
    padding: 1.25rem;
    font-size: .875rem;
  }
  .morph-note h3 { font-size: 1rem; margin-block-end: .5rem; }
  .morph-note ul { padding-inline-start: 1.25rem; }
  .morph-note li { margin-block: .25rem; }

  /* ═══════════════════════════════════════
     6. CUSTOM PROPERTY "KNOBS"
  ═══════════════════════════════════════ */

  .knob-demo {
    --bevel: 20px;
    --tail-depth: 15%;
    clip-path: shape(
      from var(--bevel) 0px,
      line to calc(100% - var(--bevel)) 0px,
      line to 100% var(--bevel),
      line to 100% 100%,
      line to 50% calc(100% - var(--tail-depth) * 2),
      line to 0% 100%,
      line to 0% var(--bevel),
      close
    );
    background: var(--accent);
    color: white;
    padding: 2rem;
    font-size: .9rem;
    text-align: center;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Interactive sliders */
  .knob-controls {
    display: flex;
    flex-direction: column;
    gap: .75rem;
    font-size: .85rem;
  }
  .knob-controls label { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
  .knob-controls input[type=range] { flex: 1; }

  /* ═══════════════════════════════════════
     7. FRAMEWORK TOKEN PROPOSAL
  ═══════════════════════════════════════ */

  .token-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .825rem;
  }
  .token-table th {
    background: var(--primary);
    color: white;
    padding: .5rem .75rem;
    text-align: start;
    font-weight: 600;
  }
  .token-table td {
    padding: .5rem .75rem;
    border-bottom: 1px solid var(--surface-2);
    vertical-align: top;
  }
  .token-table tr:nth-child(even) td { background: var(--surface-2); }
  .token-table code { font-size: .8rem; }

  /* ── @supports guard for shape() ── */
  @supports not (clip-path: shape(from 0% 0%, close)) {
    .shape-warning {
      display: block;
      background: oklch(75% 0.18 85);
      color: oklch(20% 0.1 85);
      padding: .75rem 1rem;
      border-radius: var(--radius);
      margin-block-end: 1rem;
      font-size: .875rem;
      font-weight: 600;
    }
  }
  .shape-warning { display: none; }
</style>
</head>
<body>

<header class="page-header">
  <h1>CSS <code>shape()</code> for Vanilla Breeze</h1>
  <p>Exploring framework-grade patterns — clip-path without SVG</p>
</header>

<main>

  <span class="shape-warning">⚠️ Your browser doesn't yet support shape() — Chrome 137+ / Safari 18.4+. Shapes appear as rectangles below.</span>

  <!-- ─────────────────────────────────── -->
  <section>
    <h2>1 — Section Dividers</h2>
    <p class="desc">The highest-value shape() use case for a framework. Replace SVG blobs with a data-attribute API on any block element. No JavaScript, no extra markup.</p>

    <div class="code-note">/* Usage */
&lt;section data-divider="wave"&gt;...&lt;/section&gt;

/* Framework CSS */
[data-divider="wave"] {
  clip-path: shape(from 0% 0%, line to 100% 0%,
    line to 100% 70%,
    curve to 75% 85% with 87.5% 105%,
    curve to 50% 70% with 62.5% 70%,
    curve to 25% 85% with 37.5% 70%,
    curve to 0% 70%  with 12.5% 105%, close);
}</div>

    <div class="grid">
      <div>
        <div class="demo-section-block" data-divider="wave">wave</div>
        <div class="demo-section-block">next section</div>
      </div>
      <div>
        <div class="demo-section-block" data-divider="chevron">chevron</div>
        <div class="demo-section-block">next section</div>
      </div>
      <div>
        <div class="demo-section-block" data-divider="scallop">scallop</div>
        <div class="demo-section-block">next section</div>
      </div>
      <div>
        <div class="demo-section-block" data-divider="diagonal">diagonal</div>
        <div class="demo-section-block">next section</div>
      </div>
    </div>
  </section>

  <!-- ─────────────────────────────────── -->
  <section>
    <h2>2 — Badges &amp; Tags</h2>
    <p class="desc">Pure CSS badge shapes — no pseudo-elements, no borders, no hacks. Works with any background color since it's a clip not a border trick.</p>

    <div class="code-note">/* Usage */
&lt;span data-badge="flag"&gt;New&lt;/span&gt;
&lt;span data-badge="ribbon"&gt;Sale&lt;/span&gt;</div>

    <div class="badge-demo">
      <div>
        <span data-badge="ribbon" style="background:var(--primary)">Ribbon</span>
        <div class="clip-label">ribbon</div>
      </div>
      <div>
        <span data-badge="notch" style="background:var(--accent)">Notch</span>
        <div class="clip-label">notch</div>
      </div>
      <div>
        <span data-badge="flag" style="background:oklch(55% 0.2 145)">Flag</span>
        <div class="clip-label">flag</div>
      </div>
      <div>
        <span data-badge="double-arrow" style="background:oklch(55% 0.22 25)">Step</span>
        <div class="clip-label">double-arrow</div>
      </div>
      <div>
        <span data-badge="stamp" style="background:oklch(60% 0.18 200)">Stamp</span>
        <div class="clip-label">stamp</div>
      </div>
    </div>
  </section>

  <!-- ─────────────────────────────────── -->
  <section>
    <h2>3 — Media Clips</h2>
    <p class="desc">Shape images and figures without SVG masks. Responsive — shape() uses percentage coordinates so it scales with the element.</p>

    <div class="code-note">/* Usage */
&lt;figure data-clip="hexagon"&gt;&lt;img ...&gt;&lt;/figure&gt;

/* All shapes are % — inherently responsive */</div>

    <div class="clip-grid">
      <div>
        <figure data-clip="arch">
          <div class="img-placeholder">arch</div>
        </figure>
        <div class="clip-label">arch</div>
      </div>
      <div>
        <figure data-clip="diagonal">
          <div class="img-placeholder">diagonal</div>
        </figure>
        <div class="clip-label">diagonal</div>
      </div>
      <div>
        <figure data-clip="hexagon">
          <div class="img-placeholder">hexagon</div>
        </figure>
        <div class="clip-label">hexagon</div>
      </div>
      <div>
        <figure data-clip="swoosh">
          <div class="img-placeholder">swoosh</div>
        </figure>
        <div class="clip-label">swoosh</div>
      </div>
      <div>
        <figure data-clip="leaf">
          <div class="img-placeholder">leaf</div>
        </figure>
        <div class="clip-label">leaf</div>
      </div>
    </div>
  </section>

  <!-- ─────────────────────────────────── -->
  <section>
    <h2>4 — Callouts &amp; UI Containers</h2>
    <p class="desc">Callout boxes with structural shape — especially the notched-corner which is impossible cleanly with border-radius alone.</p>

    <div class="code-note">/* Usage */
&lt;blockquote data-callout="notched"&gt;...&lt;/blockquote&gt;
&lt;div data-callout="speech"&gt;...&lt;/div&gt;</div>

    <div class="grid">
      <div data-callout="speech">
        <strong>Speech Bubble</strong>
        Shape includes the tail — no pseudo tricks needed.
      </div>
      <div data-callout="notched">
        <strong>Notched Corner</strong>
        Uses <code>calc()</code> inside shape() coords. Customizable via custom property.
      </div>
      <div data-callout="tip">
        <strong>Tip</strong>
        Simple rectangular callout — shape() can define even plain rects for consistency across a component API.
      </div>
    </div>
  </section>

  <!-- ─────────────────────────────────── -->
  <section>
    <h2>5 — Shape Morphing Animations</h2>
    <p class="desc">The killer feature: shape() supports interpolation. Same point count = smooth morphing. Custom properties inside shape() also animate via @property.</p>

    <div class="animated-demo-wrap">
      <div class="animated-demo">
        Morphing shape
      </div>

      <div class="morph-note">
        <h3>Why this matters for a framework</h3>
        <ul>
          <li>Replace JS-dependent blob animators</li>
          <li>Pair with <code>animation-timeline: scroll()</code> for scroll-driven morphs</li>
          <li>Register shape knobs via <code>@property</code> to animate individual control points</li>
          <li>Hover states: <code>:hover { clip-path: shape(...); transition: clip-path .3s; }</code></li>
        </ul>

        <div style="margin-top:1rem; font-size:.8rem; color:var(--text-muted)">
          ⚠️ Point count must match between keyframes for interpolation to work.
          Vanilla Breeze shapes should document their point count.
        </div>
      </div>
    </div>
  </section>

  <!-- ─────────────────────────────────── -->
  <section>
    <h2>6 — Custom Property "Knobs"</h2>
    <p class="desc">Design tokens as shape parameters — users tune shape geometry without touching the clip-path definition. Framework-friendly composability.</p>

    <div class="code-note">/* Framework defines the shape, user tunes the knobs */
[data-shape="pennant"] {
  --bevel:      20px;   /* corner cut size */
  --tail-depth: 15%;   /* downward point depth */
  clip-path: shape(
    from var(--bevel) 0px, ...
  );
}</div>

    <div class="grid" style="align-items:start">
      <div class="knob-demo" id="knobTarget">
        Tune the shape →
      </div>
      <div class="knob-controls">
        <label>
          Bevel <code id="bevelVal">20px</code>
          <input type="range" min="0" max="60" value="20" id="bevelRange">
        </label>
        <label>
          Tail Depth <code id="tailVal">15%</code>
          <input type="range" min="0" max="40" value="15" id="tailRange">
        </label>
      </div>
    </div>
  </section>

  <!-- ─────────────────────────────────── -->
  <section>
    <h2>7 — Proposed Vanilla Breeze Token API</h2>
    <p class="desc">Suggested attribute conventions and token names for the framework.</p>

    <table class="token-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Attribute / Token</th>
          <th>Values</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Section dividers</td>
          <td><code>data-divider</code></td>
          <td>wave, chevron, scallop, diagonal, arch</td>
          <td>On any block; overlap next sibling for seamless join</td>
        </tr>
        <tr>
          <td>Media clips</td>
          <td><code>data-clip</code></td>
          <td>hexagon, arch, swoosh, leaf, diagonal</td>
          <td>On <code>&lt;figure&gt;</code> or any sized box</td>
        </tr>
        <tr>
          <td>Badges</td>
          <td><code>data-badge</code></td>
          <td>ribbon, notch, flag, double-arrow</td>
          <td>Inline element; padding auto-adjusted</td>
        </tr>
        <tr>
          <td>Callouts</td>
          <td><code>data-callout</code></td>
          <td>speech, notched, tip</td>
          <td>Block containers; tail direction via modifier</td>
        </tr>
        <tr>
          <td>Geometry knobs</td>
          <td><code>--shape-bevel</code></td>
          <td>length (px, rem)</td>
          <td>Corner cut size; used across notch/callout/badge</td>
        </tr>
        <tr>
          <td></td>
          <td><code>--shape-curve</code></td>
          <td>percentage</td>
          <td>Curve aggressiveness for wave/swoosh dividers</td>
        </tr>
        <tr>
          <td></td>
          <td><code>--shape-depth</code></td>
          <td>percentage</td>
          <td>Point/tail depth for chevron/speech/pennant</td>
        </tr>
        <tr>
          <td>Progressive enhancement</td>
          <td>@supports guard</td>
          <td>—</td>
          <td><code>@supports (clip-path: shape(from 0% 0%, close))</code> wraps all shape() rules</td>
        </tr>
        <tr>
          <td>Animation</td>
          <td><code>data-morph</code></td>
          <td>pulse, breathe, wave</td>
          <td>Uses <code>@keyframes</code> between matching-point shapes</td>
        </tr>
      </tbody>
    </table>

    <div class="code-note" style="margin-top:1.5rem">/* Progressive enhancement wrapper — always ship this */
@supports (clip-path: shape(from 0% 0%, close)) {
  [data-divider],
  [data-clip],
  [data-badge],
  [data-callout="speech"],
  [data-callout="notched"] {
    /* shape() rules here */
  }
}</div>
  </section>

</main>

<script>
  // Knob demo — inline style update
  const target   = document.getElementById('knobTarget');
  const bevelR   = document.getElementById('bevelRange');
  const tailR    = document.getElementById('tailRange');
  const bevelVal = document.getElementById('bevelVal');
  const tailVal  = document.getElementById('tailVal');

  function updateShape() {
    const b = bevelR.value + 'px';
    const t = tailR.value + '%';
    target.style.setProperty('--bevel', b);
    target.style.setProperty('--tail-depth', t);
    bevelVal.textContent = b;
    tailVal.textContent  = t;
  }

  bevelR.addEventListener('input', updateShape);
  tailR.addEventListener('input', updateShape);
</script>

</body>
</html>


---Version 2---
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CSS shape() v2 — Vanilla Breeze</title>
<style>
/* ── Tokens ── */
:root {
  --primary:       oklch(55% 0.22 260);
  --primary-light: oklch(from var(--primary) calc(l + 0.2) c h);
  --primary-dark:  oklch(from var(--primary) calc(l - 0.12) c h);
  --accent:        oklch(62% 0.24 320);
  --success:       oklch(58% 0.2 145);
  --warning:       oklch(72% 0.18 80);
  --surface:       oklch(98% 0.005 260);
  --surface-2:     oklch(93% 0.01 260);
  --surface-3:     oklch(88% 0.015 260);
  --text:          oklch(18% 0.01 260);
  --text-muted:    oklch(52% 0.01 260);
  --border:        oklch(85% 0.015 260);
  --radius:        .5rem;
  --gap:           1.5rem;
  color-scheme: light dark;
  font-size: 17px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  background: var(--surface);
  color: var(--text);
  line-height: 1.6;
}

/* ── Page shell ── */
.page-header {
  background: var(--primary);
  color: white;
  padding: 2.5rem 2rem 4.5rem;
  text-align: center;
  clip-path: shape(
    from 0% 0%, line to 100% 0%, line to 100% 72%,
    curve to 50% 90% with 80% 108%,
    curve to 0% 72% with 20% 108%,
    close
  );
}
.page-header h1 { font-size: 2rem; font-weight: 700; }
.page-header p  { opacity: .82; margin-top: .4rem; font-size: .95rem; }
.version-tag {
  display: inline-block;
  background: white;
  color: var(--primary);
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .08em;
  padding: .15rem .6rem;
  border-radius: 2rem;
  margin-block-end: .5rem;
}

main {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
}

section { margin-block: 3.5rem; }

section > h2 {
  font-size: .8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--primary);
  margin-block-end: .2rem;
}
section > p.desc {
  color: var(--text-muted);
  font-size: .875rem;
  margin-block-end: 1.25rem;
  max-width: 65ch;
}
section > h2 + .desc { margin-top: .3rem; }

.rule { border: none; border-top: 1px solid var(--border); margin-block: 3rem; }

.grid {
  display: grid;
  gap: var(--gap);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.flex-wrap { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-end; }

.code-note {
  background: oklch(14% 0.02 260);
  color: oklch(83% 0.05 260);
  font-family: monospace;
  font-size: .72rem;
  padding: .75rem 1rem;
  border-radius: var(--radius);
  margin-block-end: 1.25rem;
  white-space: pre-wrap;
  line-height: 1.6;
}

.label {
  text-align: center;
  font-size: .72rem;
  font-family: monospace;
  color: var(--text-muted);
  margin-top: .5rem;
}

@supports not (clip-path: shape(from 0% 0%, close)) {
  .shape-warning { display: block !important; }
}
.shape-warning {
  display: none;
  background: oklch(78% 0.18 80);
  color: oklch(18% 0.1 80);
  padding: .75rem 1rem;
  border-radius: var(--radius);
  margin-block-end: 1.5rem;
  font-size: .875rem;
  font-weight: 600;
}


/* ═══════════════════════════════════════════════════════════
   1. HR THEMATIC BREAKS
   data-divider on <hr> — height + background + clip-path
   Falls back to a plain 1px line with no extra markup
═══════════════════════════════════════════════════════════ */

@supports (clip-path: shape(from 0% 0%, close)) {
  hr[data-divider] {
    border: none;
    height: 24px;
    background: var(--border);
  }

  hr[data-divider="wave"] {
    background: linear-gradient(in oklch to right, var(--primary), var(--accent));
    clip-path: shape(
      from 0% 0%,
      curve to 16.66% 100% with 8.33% -40%,
      curve to 33.33%  0%  with 25%   140%,
      curve to 50%    100% with 41.66% -40%,
      curve to 66.66%  0%  with 58.33% 140%,
      curve to 83.33% 100% with 75%   -40%,
      curve to 100%    0%  with 91.66% 140%,
      line to 100% 100%,
      line to 0%   100%,
      close
    );
    height: 16px;
  }

  hr[data-divider="zigzag"] {
    background: var(--primary);
    clip-path: shape(
      from 0% 50%,
      line to 5%   0%,
      line to 15%  100%,
      line to 25%  0%,
      line to 35%  100%,
      line to 45%  0%,
      line to 55%  100%,
      line to 65%  0%,
      line to 75%  100%,
      line to 85%  0%,
      line to 95%  100%,
      line to 100% 50%,
      line to 100% 100%,
      line to 0%   100%,
      close
    );
    height: 20px;
  }

  hr[data-divider="diamonds"] {
    background: var(--accent);
    clip-path: shape(
      from 0% 50%,
      line to 5%   0%,
      line to 10%  50%,
      line to 5%   100%,
      line to 0%   50%,
      line to 0%   100%,
      line to 10%  100%,
      line to 15%  50%,
      line to 20%  100%,
      line to 25%  50%,
      line to 20%  0%,
      line to 25%  50%,
      line to 30%  0%,
      line to 35%  50%,
      line to 30%  100%,
      line to 40%  100%,
      line to 45%  50%,
      line to 40%  0%,
      line to 45%  50%,
      line to 50%  0%,
      line to 55%  50%,
      line to 50%  100%,
      line to 60%  100%,
      line to 65%  50%,
      line to 60%  0%,
      line to 65%  50%,
      line to 70%  0%,
      line to 75%  50%,
      line to 70%  100%,
      line to 80%  100%,
      line to 85%  50%,
      line to 80%  0%,
      line to 85%  50%,
      line to 90%  0%,
      line to 95%  50%,
      line to 90%  100%,
      line to 100% 100%,
      line to 100% 50%,
      close
    );
    height: 22px;
  }

  hr[data-divider="scallop"] {
    background: var(--primary-dark);
    clip-path: shape(
      from 0%      100%,
      line to 0%   60%,
      curve to 14.28% 60% with 7.14%  -20%,
      curve to 28.57% 60% with 21.42% -20%,
      curve to 42.85% 60% with 35.7%  -20%,
      curve to 57.14% 60% with 50%    -20%,
      curve to 71.43% 60% with 64.28% -20%,
      curve to 85.71% 60% with 78.57% -20%,
      curve to 100%   60% with 92.85% -20%,
      line to 100% 100%,
      close
    );
    height: 28px;
  }

  hr[data-divider="dots"] {
    background: transparent;
    height: 20px;
    /* Dot chain via repeating shape cutouts — use gradient instead for broad support */
    background-image: radial-gradient(circle, var(--primary) 40%, transparent 40%);
    background-size: 28px 20px;
    background-repeat: repeat-x;
    background-position: center;
    clip-path: none;
  }
}

.hr-demo-zone {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--surface-2);
  padding: 1.5rem;
  border-radius: var(--radius);
}
.hr-demo-zone .label { text-align: start; margin-top: 0; font-size: .75rem; color: var(--text-muted); }


/* ═══════════════════════════════════════════════════════════
   2. SHAPED BORDERS (outline / frame effect)
   Stack: clipped background-colored wrapper over content
   The "border" is the gap between outer shape and inner content
═══════════════════════════════════════════════════════════ */

.shaped-border-wrap {
  position: relative;
  display: inline-grid;
}

/* The border layer: full-color shape behind the content */
.shaped-border-wrap::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;
}

[data-border-shape] {
  position: relative;
  z-index: 1;
  margin: 8px; /* gap = border thickness */
  background: var(--surface);
  padding: 1.25rem;
  min-width: 160px;
  text-align: center;
  font-size: .875rem;
}

/* Wrapper applies the shape + color to the ::before pseudo */
.shaped-border-wrap[data-border-shape="hexagon"]::before {
  background: var(--primary);
  clip-path: shape(
    from 50%  0%,  line to 100% 25%,
    line to 100% 75%, line to 50% 100%,
    line to 0% 75%, line to 0% 25%, close
  );
}
.shaped-border-wrap[data-border-shape="hexagon"] [data-border-shape] {
  clip-path: shape(
    from 50%  0%,  line to 100% 25%,
    line to 100% 75%, line to 50% 100%,
    line to 0% 75%, line to 0% 25%, close
  );
  margin: 7px;
}

.shaped-border-wrap[data-border-shape="diamond"]::before {
  background: var(--accent);
  clip-path: shape(
    from 50% 0%, line to 100% 50%,
    line to 50% 100%, line to 0% 50%, close
  );
}
.shaped-border-wrap[data-border-shape="diamond"] [data-border-shape] {
  clip-path: shape(
    from 50% 0%, line to 100% 50%,
    line to 50% 100%, line to 0% 50%, close
  );
  margin: 6px;
  min-width: 140px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shaped-border-wrap[data-border-shape="arch"]::before {
  background: var(--success);
  clip-path: shape(
    from 0% 100%, line to 0% 32%,
    curve to 50% 0% with 0% 0%,
    curve to 100% 32% with 100% 0%,
    line to 100% 100%, close
  );
  width: 160px;
  height: 200px;
}
.shaped-border-wrap[data-border-shape="arch"] [data-border-shape] {
  clip-path: shape(
    from 0% 100%, line to 0% 32%,
    curve to 50% 0% with 0% 0%,
    curve to 100% 32% with 100% 0%,
    line to 100% 100%, close
  );
  margin: 6px;
  width: 148px;
  height: 188px;
  display: flex;
  align-items: center;
  justify-content: center;
}


/* ═══════════════════════════════════════════════════════════
   3. PUNCHED-OUT / CUTOUT SHAPES
   clip-path: shape() supports fill-rule evenodd
   Outer path THEN inner path = hole
═══════════════════════════════════════════════════════════ */

[data-cutout] {
  width: 200px;
  height: 200px;
  position: relative;
  flex-shrink: 0;
}

[data-cutout] .cutout-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(in oklch 135deg, var(--primary), var(--accent));
}

[data-cutout="circle"] .cutout-inner {
  clip-path: shape(
    evenodd
    from 0% 0%, line to 100% 0%,
    line to 100% 100%, line to 0% 100%, close
    /* inner circle hole */
    from 50% 20%,
    curve to 80% 50% with 80% 20%,
    curve to 50% 80% with 80% 80%,
    curve to 20% 50% with 20% 80%,
    curve to 50% 20% with 20% 20%,
    close
  );
}

[data-cutout="star-ish"] .cutout-inner {
  clip-path: shape(
    evenodd
    from 0% 0%, line to 100% 0%,
    line to 100% 100%, line to 0% 100%, close
    /* inner rough diamond */
    from 50% 28%,
    line to 72% 50%, line to 50% 72%,
    line to 28% 50%, close
  );
}

[data-cutout="arch-window"] .cutout-inner {
  clip-path: shape(
    evenodd
    from 0% 0%, line to 100% 0%,
    line to 100% 100%, line to 0% 100%, close
    /* inner arch window */
    from 30% 90%, line to 30% 52%,
    curve to 50% 30% with 30% 30%,
    curve to 70% 52% with 70% 30%,
    line to 70% 90%, close
  );
}

[data-cutout="hexgrid"] .cutout-inner {
  clip-path: shape(
    evenodd
    from 0% 0%, line to 100% 0%,
    line to 100% 100%, line to 0% 100%, close
    /* single centered hex hole */
    from 50% 22%,
    line to 72% 36%, line to 72% 64%,
    line to 50% 78%, line to 28% 64%,
    line to 28% 36%, close
  );
}

/* Practical: img element with a punched-out corner badge space */
[data-cutout="badge-corner"] .cutout-inner {
  clip-path: shape(
    evenodd
    from 0% 0%, line to 100% 0%,
    line to 100% 100%, line to 0% 100%, close
    /* top-right circle for badge */
    from 72% 2%,
    curve to 98% 28% with 98% 2%,
    curve to 72% 2% with 98% 54%,
    curve to 72% 2% with 46% 2%,
    close
  );
}


/* ═══════════════════════════════════════════════════════════
   4. RAW <img> CLIPS
   Applied directly to <img> — no figure wrapper needed
═══════════════════════════════════════════════════════════ */

img[data-clip] {
  display: block;
  object-fit: cover;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

img[data-clip="hexagon"] {
  clip-path: shape(
    from 50%  0%, line to 100% 25%,
    line to 100% 75%, line to 50% 100%,
    line to 0% 75%, line to 0% 25%, close
  );
}

img[data-clip="arch"] {
  width: 160px;
  height: 220px;
  clip-path: shape(
    from 0% 100%, line to 0% 35%,
    curve to 50% 0% with 0% 0%,
    curve to 100% 35% with 100% 0%,
    line to 100% 100%, close
  );
}

img[data-clip="swoosh"] {
  clip-path: shape(
    from 0% 0%, line to 100% 0%,
    line to 100% 80%,
    curve to 0% 100% with 55% 62%,
    close
  );
}

img[data-clip="leaf"] {
  border-radius: 0;
  clip-path: shape(
    from 50% 0%,
    curve to 100% 50% with 100% 0%,
    curve to 50% 100% with 100% 100%,
    curve to 0% 50% with 0% 100%,
    curve to 50% 0% with 0% 0%,
    close
  );
}

img[data-clip="diagonal-frame"] {
  clip-path: shape(
    from 8% 0%, line to 100% 0%,
    line to 92% 100%, line to 0% 100%, close
  );
}

img[data-clip="torn"] {
  clip-path: shape(
    from 0% 0%, line to 100% 0%,
    line to 100% 78%,
    line to 88%  85%, line to 92%  91%,
    line to 78%  88%, line to 82%  96%,
    line to 65%  90%, line to 70%  98%,
    line to 50%  92%, line to 55%  100%,
    line to 35%  94%, line to 40%  100%,
    line to 20%  92%, line to 25%  98%,
    line to 8%   94%, line to 12%  100%,
    line to 0%   95%,
    close
  );
}


/* Img placeholder gradient for demo */
.img-grad {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  background: linear-gradient(in oklch 135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: .75rem;
  font-weight: 600;
}

/* Apply same clips to .img-grad */
.img-grad[data-clip="hexagon"] {
  clip-path: shape(from 50% 0%, line to 100% 25%, line to 100% 75%, line to 50% 100%, line to 0% 75%, line to 0% 25%, close);
}
.img-grad[data-clip="arch"] {
  width: 160px; height: 220px;
  clip-path: shape(from 0% 100%, line to 0% 35%, curve to 50% 0% with 0% 0%, curve to 100% 35% with 100% 0%, line to 100% 100%, close);
}
.img-grad[data-clip="swoosh"] {
  clip-path: shape(from 0% 0%, line to 100% 0%, line to 100% 80%, curve to 0% 100% with 55% 62%, close);
}
.img-grad[data-clip="leaf"] {
  clip-path: shape(from 50% 0%, curve to 100% 50% with 100% 0%, curve to 50% 100% with 100% 100%, curve to 0% 50% with 0% 100%, curve to 50% 0% with 0% 0%, close);
}
.img-grad[data-clip="diagonal-frame"] {
  clip-path: shape(from 8% 0%, line to 100% 0%, line to 92% 100%, line to 0% 100%, close);
}
.img-grad[data-clip="torn"] {
  clip-path: shape(
    from 0% 0%, line to 100% 0%, line to 100% 78%,
    line to 88%  85%, line to 92%  91%, line to 78%  88%,
    line to 82%  96%, line to 65%  90%, line to 70%  98%,
    line to 50%  92%, line to 55%  100%, line to 35%  94%,
    line to 40%  100%, line to 20%  92%, line to 25%  98%,
    line to 8%   94%, line to 12%  100%, line to 0%   95%,
    close
  );
}


/* ═══════════════════════════════════════════════════════════
   5. CHAT / THOUGHT BUBBLES
   Prep for the chat widget — full taxonomy of balloon types
═══════════════════════════════════════════════════════════ */

.chat-demo {
  background: var(--surface-2);
  padding: 2rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 520px;
}

.chat-row {
  display: flex;
  gap: .75rem;
  align-items: flex-end;
}
.chat-row.outgoing { flex-direction: row-reverse; }

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: .7rem;
  font-weight: 700;
}
.avatar.bot { background: var(--accent); }

[data-bubble] {
  max-width: 280px;
  padding: .7rem 1rem;
  font-size: .875rem;
  line-height: 1.5;
  position: relative;
}

/* Incoming — tail bottom-left */
[data-bubble="incoming"] {
  background: white;
  color: var(--text);
  clip-path: shape(
    from 12px 0%,
    curve to 0% 12px with 0% 0%,
    line to 0% calc(100% - 20px),
    line to 0% 100%,
    line to 20px calc(100% - 6px),
    line to calc(100% - 12px) calc(100% - 6px),
    curve to 100% calc(100% - 18px) with 100% calc(100% - 6px),
    line to 100% 12px,
    curve to calc(100% - 12px) 0% with 100% 0%,
    close
  );
  padding-inline-start: 1.1rem;
  padding-block-end: 1.3rem;
  box-shadow: 0 1px 3px oklch(0% 0 0 / .1);
}

/* Outgoing — tail bottom-right */
[data-bubble="outgoing"] {
  background: var(--primary);
  color: white;
  clip-path: shape(
    from 12px 0%,
    curve to 0% 12px with 0% 0%,
    line to 0% calc(100% - 18px),
    curve to 12px calc(100% - 6px) with 0% calc(100% - 6px),
    line to calc(100% - 20px) calc(100% - 6px),
    line to 100% 100%,
    line to 100% calc(100% - 20px),
    line to 100% 12px,
    curve to calc(100% - 12px) 0% with 100% 0%,
    close
  );
  padding-inline-end: 1.1rem;
  padding-block-end: 1.3rem;
}

/* System / timestamp */
[data-bubble="system"] {
  background: transparent;
  color: var(--text-muted);
  font-size: .75rem;
  text-align: center;
  max-width: 100%;
  padding: .25rem .75rem;
  border: 1px solid var(--border);
  border-radius: 2rem;
  align-self: center;
}

/* Thought balloon — rounded cloud shape + bubbles below */
.thought-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  position: relative;
}
.thought-bubbles {
  display: flex;
  gap: 4px;
  padding-inline-start: 1rem;
  margin-block-start: 4px;
}
.thought-bubbles span {
  display: block;
  border-radius: 50%;
  background: white;
}
.thought-bubbles span:nth-child(1) { width: 8px; height: 8px; }
.thought-bubbles span:nth-child(2) { width: 12px; height: 12px; }
.thought-bubbles span:nth-child(3) { width: 6px; height: 6px; }

[data-bubble="thought"] {
  background: white;
  color: var(--text);
  clip-path: shape(
    from 20% 0%,
    curve to 50% 0% with 20% -8%,
    curve to 80% 0% with 50% -8%,
    curve to 100% 25% with 115% 0%,
    curve to 100% 70% with 115% 50%,
    curve to 80% 100% with 100% 115%,
    curve to 20% 100% with 50% 115%,
    curve to 0% 70% with -15% 115%,
    curve to 0% 25% with -15% 50%,
    curve to 20% 0% with -15% 0%,
    close
  );
  padding: 1rem 1.25rem;
  box-shadow: 0 2px 8px oklch(0% 0 0 / .12);
}

/* Typing indicator */
[data-bubble="typing"] {
  background: white;
  clip-path: shape(
    from 12px 0%,
    curve to 0% 12px with 0% 0%,
    line to 0% calc(100% - 20px),
    line to 0% 100%,
    line to 20px calc(100% - 6px),
    line to calc(100% - 12px) calc(100% - 6px),
    curve to 100% calc(100% - 18px) with 100% calc(100% - 6px),
    line to 100% 12px,
    curve to calc(100% - 12px) 0% with 100% 0%,
    close
  );
  padding: .9rem 1.25rem 1.3rem;
  display: flex;
  gap: 5px;
  align-items: center;
}

.typing-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typing-bounce .9s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: .15s; }
.typing-dot:nth-child(3) { animation-delay: .3s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .4; }
  30%            { transform: translateY(-6px); opacity: 1; }
}

/* Error bubble */
[data-bubble="error"] {
  background: oklch(from oklch(55% 0.22 25) 95% 0.04 h);
  color: oklch(35% 0.18 25);
  border-inline-start: 3px solid oklch(55% 0.22 25);
  clip-path: shape(
    from 3px 0%, line to 100% 0%, line to 100% 100%,
    line to 3px 100%,
    line to 3px 0%, close
  );
  padding-inline-start: .75rem;
}

/* Info / assistant bubble with top-left tail */
[data-bubble="assistant"] {
  background: oklch(from var(--primary) 95% 0.04 h);
  color: var(--text);
  clip-path: shape(
    from 0% 20px,
    line to 0% 0%,
    line to 20px 14px,
    line to calc(100% - 12px) 14px,
    curve to 100% 26px with 100% 14px,
    line to 100% calc(100% - 12px),
    curve to calc(100% - 12px) 100% with 100% 100%,
    line to 12px 100%,
    curve to 0% calc(100% - 12px) with 0% 100%,
    close
  );
  padding: 1rem 1rem .9rem 1.2rem;
  padding-block-start: 1.3rem;
}

.chat-system-row {
  display: flex;
  justify-content: center;
}


/* ═══════════════════════════════════════════════════════════
   Proposed token API table
═══════════════════════════════════════════════════════════ */
.token-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .8rem;
  margin-block-start: 1rem;
}
.token-table th {
  background: var(--primary);
  color: white;
  padding: .45rem .75rem;
  text-align: start;
  font-weight: 600;
}
.token-table td {
  padding: .45rem .75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
.token-table tr:nth-child(even) td { background: var(--surface-2); }
.token-table code { font-size: .78rem; }
</style>
</head>
<body>

<header class="page-header">
  <div class="version-tag">V2</div>
  <h1>CSS <code>shape()</code> — Vanilla Breeze</h1>
  <p>HR breaks · shaped borders · cutouts · img clips · chat bubbles</p>
</header>

<main>

  <span class="shape-warning">⚠️ Browser doesn't support shape() yet — Chrome 137+ / Safari 18.4+ required. Shapes appear rectangular below.</span>

  <!-- ═══════════════════════════════════ -->
  <section>
    <h2>1 — HR Thematic Breaks</h2>
    <p class="desc">
      <code>&lt;hr&gt;</code> is a semantic thematic break — shape() makes it a first-class visual tool.
      Falls back to a plain 1px line in unsupported browsers. No extra markup, no SVG.
    </p>

    <div class="code-note">/* Works directly on &lt;hr&gt; — semantic, zero extra markup */
hr[data-divider="wave"] {
  border: none;
  height: 16px;
  background: linear-gradient(in oklch to right, var(--primary), var(--accent));
  clip-path: shape(
    from 0% 0%,
    curve to 16.66% 100% with 8.33% -40%,
    curve to 33.33%   0%  with 25%   140%, /* ... */
    close
  );
}</div>

    <div class="hr-demo-zone">
      <div>
        <span class="label">wave (gradient)</span>
        <hr data-divider="wave">
      </div>
      <div>
        <span class="label">zigzag</span>
        <hr data-divider="zigzag">
      </div>
      <div>
        <span class="label">scallop</span>
        <hr data-divider="scallop">
      </div>
      <div>
        <span class="label">diamonds</span>
        <hr data-divider="diamonds">
      </div>
      <div>
        <span class="label">dots (gradient fallback — always works)</span>
        <hr data-divider="dots">
      </div>
    </div>
  </section>

  <hr class="rule">

  <!-- ═══════════════════════════════════ -->
  <section>
    <h2>2 — Shaped Borders / Frames</h2>
    <p class="desc">
      True shaped borders aren't possible with a single clip — but a two-layer approach (clipped background behind content, inner clip matching) gives the illusion cleanly.
      The "border thickness" is just the margin gap between the layers.
    </p>

    <div class="code-note">/* Two-layer technique: outer shape (color) + inner clip (surface) */
.shaped-border-wrap::before {
  content: ""; position: absolute; inset: 0; /* full shape, colored */
  clip-path: shape(...);
  background: var(--primary);
}
[data-border-shape] {
  margin: 7px;  /* ← border thickness */
  clip-path: shape(...); /* same shape */
  background: var(--surface);
}</div>

    <div class="flex-wrap">
      <div>
        <div class="shaped-border-wrap" data-border-shape="hexagon">
          <div data-border-shape="hexagon" style="width:160px;height:185px;display:flex;align-items:center;justify-content:center;font-size:.8rem;text-align:center">
            Hexagon<br>frame
          </div>
        </div>
        <div class="label">hexagon</div>
      </div>

      <div>
        <div class="shaped-border-wrap" data-border-shape="diamond">
          <div data-border-shape="diamond" style="font-size:.8rem;text-align:center">
            ◆
          </div>
        </div>
        <div class="label">diamond</div>
      </div>

      <div>
        <div class="shaped-border-wrap" data-border-shape="arch">
          <div data-border-shape="arch" style="font-size:.8rem;text-align:center;padding:.5rem">
            Arch<br>portrait<br>frame
          </div>
        </div>
        <div class="label">arch</div>
      </div>
    </div>
  </section>

  <hr class="rule">

  <!-- ═══════════════════════════════════ -->
  <section>
    <h2>3 — Punched-Out / Cutout Objects</h2>
    <p class="desc">
      The <code>evenodd</code> fill rule in shape() creates true holes. Define the outer boundary, then
      a second path as the hole. Great for decorative panels, icon containers, UI chrome, and showcase cards.
    </p>

    <div class="code-note">/* evenodd = second path punches a hole in the first */
clip-path: shape(
  evenodd
  from 0% 0%, line to 100% 0%, line to 100% 100%, line to 0% 100%, close
  /* ↑ outer rect */
  from 50% 20%, curve to 80% 50% with 80% 20%, /* ... */
  close
  /* ↑ inner circle = hole */
);</div>

    <div class="flex-wrap">
      <div>
        <div data-cutout="circle">
          <div class="cutout-inner"></div>
        </div>
        <div class="label">circle hole</div>
      </div>
      <div>
        <div data-cutout="star-ish">
          <div class="cutout-inner"></div>
        </div>
        <div class="label">diamond hole</div>
      </div>
      <div>
        <div data-cutout="arch-window">
          <div class="cutout-inner"></div>
        </div>
        <div class="label">arch window</div>
      </div>
      <div>
        <div data-cutout="hexgrid">
          <div class="cutout-inner"></div>
        </div>
        <div class="label">hex hole</div>
      </div>
      <div>
        <div data-cutout="badge-corner">
          <div class="cutout-inner"></div>
        </div>
        <div class="label">badge-corner cutout</div>
      </div>
    </div>
  </section>

  <hr class="rule">

  <!-- ═══════════════════════════════════ -->
  <section>
    <h2>4 — Raw <code>&lt;img&gt;</code> Clips</h2>
    <p class="desc">
      Apply directly to <code>&lt;img&gt;</code> — no wrapper, no figure, no JS.
      Percentage coords mean it's fully responsive. The torn-edge shape is a framework showcase piece.
    </p>

    <div class="code-note">/* Direct on &lt;img&gt; — responsive by default */
img[data-clip="torn"] {
  clip-path: shape(
    from 0% 0%, line to 100% 0%, line to 100% 78%,
    line to 88% 85%, line to 92% 91%, line to 78% 88%, ...
    close
  );
}</div>

    <div class="flex-wrap" style="align-items:flex-end">
      <div>
        <div class="img-grad" data-clip="hexagon">hex</div>
        <div class="label">hexagon</div>
      </div>
      <div>
        <div class="img-grad" data-clip="arch">arch</div>
        <div class="label">arch</div>
      </div>
      <div>
        <div class="img-grad" data-clip="swoosh">swoosh</div>
        <div class="label">swoosh</div>
      </div>
      <div>
        <div class="img-grad" data-clip="leaf">leaf</div>
        <div class="label">leaf</div>
      </div>
      <div>
        <div class="img-grad" data-clip="diagonal-frame">diag</div>
        <div class="label">diagonal-frame</div>
      </div>
      <div>
        <div class="img-grad" data-clip="torn">torn</div>
        <div class="label">torn edge ✦</div>
      </div>
    </div>
  </section>

  <hr class="rule">

  <!-- ═══════════════════════════════════ -->
  <section>
    <h2>5 — Chat &amp; Thought Bubbles</h2>
    <p class="desc">
      Full taxonomy for your chat widget — incoming, outgoing, assistant, thought balloon,
      typing indicator, error, and system messages. All pure CSS, no pseudo-element tricks.
    </p>

    <div class="code-note">/* Tail is part of the shape path — not a pseudo, not a border hack */
[data-bubble="outgoing"] {
  clip-path: shape(
    from 12px 0%, curve to 0% 12px with 0% 0%,
    line to 0% calc(100% - 18px),
    curve to 12px calc(100% - 6px) with 0% calc(100% - 6px),
    line to calc(100% - 20px) calc(100% - 6px),
    line to 100% 100%,             /* ← tail point */
    line to 100% calc(100% - 20px),
    line to 100% 12px,
    curve to calc(100% - 12px) 0% with 100% 0%,
    close
  );
}</div>

    <div class="chat-demo">

      <!-- System -->
      <div class="chat-system-row">
        <span data-bubble="system">Today, 9:41 AM</span>
      </div>

      <!-- Incoming -->
      <div class="chat-row incoming">
        <div class="avatar">AL</div>
        <div>
          <div data-bubble="incoming">Hey! Check out the new shape() feature — it's wild what you can do without SVG.</div>
        </div>
      </div>

      <!-- Thought balloon -->
      <div class="chat-row incoming">
        <div class="avatar bot">AI</div>
        <div class="thought-wrap">
          <div data-bubble="thought">Hmm, thinking about how to use this in Vanilla Breeze…</div>
          <div class="thought-bubbles">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Assistant bubble (top-left tail) -->
      <div class="chat-row incoming">
        <div class="avatar bot">AI</div>
        <div data-bubble="assistant">
          The hr + shape() combo is the best ergonomic win — semantic markup, zero extra DOM.
        </div>
      </div>

      <!-- Outgoing -->
      <div class="chat-row outgoing">
        <div class="avatar" style="background:var(--success)">TK</div>
        <div>
          <div data-bubble="outgoing">Agreed. The evenodd cutout approach is surprising — didn't know clip-path supported fill rules.</div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div class="chat-row incoming">
        <div class="avatar bot">AI</div>
        <div data-bubble="typing">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>

      <!-- Error -->
      <div class="chat-row incoming">
        <div class="avatar" style="background:oklch(55% 0.22 25)">!</div>
        <div data-bubble="error">Connection lost. Message not delivered.</div>
      </div>

    </div>
  </section>

  <hr class="rule">

  <!-- ═══════════════════════════════════ -->
  <section>
    <h2>V2 Framework API — Summary</h2>

    <table class="token-table">
      <thead>
        <tr><th>Element</th><th>Attribute</th><th>Values</th><th>Notes</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><code>&lt;hr&gt;</code></td>
          <td><code>data-divider</code></td>
          <td>wave, zigzag, scallop, diamonds, dots</td>
          <td>Semantic thematic break; falls back to 1px line</td>
        </tr>
        <tr>
          <td>Any block</td>
          <td><code>data-divider</code></td>
          <td>same set</td>
          <td>Section-level dividers from v1</td>
        </tr>
        <tr>
          <td>Wrapper + inner</td>
          <td><code>data-border-shape</code></td>
          <td>hexagon, diamond, arch, …</td>
          <td>Two-layer pseudo technique; "thickness" via margin token <code>--shape-border</code></td>
        </tr>
        <tr>
          <td>Any box</td>
          <td><code>data-cutout</code></td>
          <td>circle, diamond, arch-window, hex, badge-corner</td>
          <td>Uses <code>evenodd</code> fill rule; child sets gradient/image</td>
        </tr>
        <tr>
          <td><code>&lt;img&gt;</code>, <code>&lt;figure&gt;</code></td>
          <td><code>data-clip</code></td>
          <td>hexagon, arch, swoosh, leaf, diagonal-frame, torn</td>
          <td>% coords = responsive; <code>object-fit: cover</code> required on img</td>
        </tr>
        <tr>
          <td>Chat elements</td>
          <td><code>data-bubble</code></td>
          <td>incoming, outgoing, assistant, thought, typing, error, system</td>
          <td>Tail is part of shape path; system uses pill, thought uses cloud</td>
        </tr>
        <tr>
          <td>Global knobs</td>
          <td><code>--shape-border</code></td>
          <td>length</td>
          <td>Thickness of the border-frame technique</td>
        </tr>
        <tr>
          <td></td>
          <td><code>--shape-bevel</code></td>
          <td>length</td>
          <td>Corner cut depth (notch, callout, pennant)</td>
        </tr>
        <tr>
          <td></td>
          <td><code>--shape-depth</code></td>
          <td>%</td>
          <td>Tail / point depth (bubbles, chevron, badges)</td>
        </tr>
        <tr>
          <td>Compat guard</td>
          <td>—</td>
          <td>—</td>
          <td><code>@supports (clip-path: shape(from 0% 0%, close))</code> wraps all shape() blocks</td>
        </tr>
      </tbody>
    </table>
  </section>

</main>

</body>
</html>