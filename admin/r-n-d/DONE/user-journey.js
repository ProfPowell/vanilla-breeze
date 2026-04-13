/**
 * <user-journey> — User journey map component for the web-component-rnd suite.
 *
 * Matches the patterns of user-persona and user-story:
 *   - Single JS file, Shadow DOM, all CSS inlined
 *   - Attributes for metadata, slots for rich content
 *   - compact boolean attribute for compact mode
 *   - CSS vars: --bg, --text, --muted, --border, --card-bg
 *
 * Attribute-driven usage:
 *
 *   <user-journey
 *     title="API Platform Evaluation"
 *     persona="Sarah Chen"
 *     persona-id="persona-sarah-chen"
 *     summary="How a developer discovers, evaluates, and adopts our platform"
 *     story-ids="PROJ-142,PROJ-156">
 *   </user-journey>
 *
 * JSON src usage (recommended for complex journeys):
 *
 *   <user-journey src="/data/journey-api-evaluation.json"></user-journey>
 *
 * JSON schema:
 *   {
 *     "title": "...",
 *     "persona": "...",
 *     "personaId": "...",
 *     "summary": "...",
 *     "phases": [
 *       {
 *         "name": "Awareness",
 *         "emotion": "curious",
 *         "storyIds": ["PROJ-142"],
 *         "actions":       ["Searches for solutions", "Reads comparison articles"],
 *         "thoughts":      ["There must be a better way"],
 *         "touchpoints":   ["Google", "Hacker News"],
 *         "painPoints":    ["Too many options to compare"],
 *         "opportunities": ["Clear, developer-focused landing page"]
 *       }
 *     ]
 *   }
 *
 * Emotion values (drives curve y-position and dot color):
 *   delighted | satisfied | hopeful | curious | neutral |
 *   uncertain | confused | frustrated | angry
 */

const EMOTION_META = {
  delighted:  { emoji: '😄', score: 0.95, color: '#16a34a' },
  satisfied:  { emoji: '😊', score: 0.80, color: '#22c55e' },
  hopeful:    { emoji: '🙂', score: 0.68, color: '#84cc16' },
  curious:    { emoji: '🤔', score: 0.55, color: '#eab308' },
  neutral:    { emoji: '😐', score: 0.50, color: '#94a3b8' },
  uncertain:  { emoji: '😕', score: 0.40, color: '#f97316' },
  confused:   { emoji: '😵', score: 0.30, color: '#fb923c' },
  frustrated: { emoji: '😤', score: 0.18, color: '#ef4444' },
  angry:      { emoji: '😠', score: 0.05, color: '#dc2626' },
};

const ROWS = [
  { key: 'actions',       label: 'Actions'       },
  { key: 'thoughts',      label: 'Thoughts'      },
  { key: 'touchpoints',   label: 'Touchpoints'   },
  { key: 'painPoints',    label: 'Pain Points'   },
  { key: 'opportunities', label: 'Opportunities' },
];

class UserJourney extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'title', 'persona', 'persona-id', 'summary', 'story-ids', 'compact'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.__phases = null;
  }

  get phases() { return this.__phases; }

  set phases(data) {
    this.__phases = data;
    if (this.isConnected) this._render();
  }

  // Keep _phases as a convenience alias matching the demo script
  get _phases() { return this.__phases; }
  set _phases(data) { this.phases = data; }

  /* ── Lifecycle ─────────────────────────────── */

  connectedCallback() {
    if (this.hasAttribute('src')) {
      this._loadSrc(this.getAttribute('src'));
    } else {
      this._render();
    }
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    if (name === 'src') {
      this._loadSrc(this.getAttribute('src'));
    } else {
      this._render();
    }
  }

  /* ── JSON loading ──────────────────────────── */

  async _loadSrc(src) {
    if (!src) return;
    this.shadowRoot.innerHTML = this._css() + `<div class="state-msg">Loading…</div>`;
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.title)     this.setAttribute('title',      data.title);
      if (data.persona)   this.setAttribute('persona',    data.persona);
      if (data.personaId) this.setAttribute('persona-id', data.personaId);
      if (data.summary)   this.setAttribute('summary',    data.summary);
      this.__phases = data.phases || [];
      this._render();
    } catch (err) {
      this.shadowRoot.innerHTML = this._css() +
        `<div class="state-msg state-msg--error">Could not load journey: ${this._esc(err.message)}</div>`;
    }
  }

  /* ── Render ────────────────────────────────── */

  _render() {
    const title     = this.getAttribute('title')      || 'User Journey';
    const persona   = this.getAttribute('persona')    || '';
    const personaId = this.getAttribute('persona-id') || '';
    const summary   = this.getAttribute('summary')    || '';
    const storyIds  = (this.getAttribute('story-ids') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const compact   = this.hasAttribute('compact');
    const phases    = this.__phases;

    this.shadowRoot.innerHTML = this._css() + `
      <article class="journey${compact ? ' journey--compact' : ''}">

        <header class="journey__header">
          <div class="journey__header-top">
            <div class="journey__chips">
              <span class="chip chip--type">Journey Map</span>
              ${storyIds.map(id =>
                `<a class="chip chip--story" href="#${id}">${this._label(id)}</a>`
              ).join('')}
            </div>
            ${persona ? `
              <div class="journey__persona">
                ${personaId
                  ? `<a class="persona-ref" href="#${personaId}">👤 ${this._esc(persona)}</a>`
                  : `<span class="persona-ref">👤 ${this._esc(persona)}</span>`}
              </div>` : ''}
          </div>
          <h2 class="journey__title">${this._esc(title)}</h2>
          ${summary ? `<p class="journey__summary">${this._esc(summary)}</p>` : ''}
        </header>

        ${phases && phases.length
          ? this._curve(phases) + this._grid(phases)
          : `<div class="journey__placeholder">
               <p>Add phase data via <code>src</code> (JSON) or set <code>this._phases</code> programmatically.</p>
             </div>`
        }

      </article>`;
  }

  /* ── SVG curve ─────────────────────────────── */

  _curve(phases) {
    const W = 1000, H = 100, PX = 28, PY = 14;
    const uw = W - PX * 2, uh = H - PY * 2;
    const n  = phases.length;

    const toX = i  => PX + (n < 2 ? uw / 2 : (i / (n - 1)) * uw);
    const toY = ph => {
      const m = EMOTION_META[ph.emotion] || EMOTION_META.neutral;
      return PY + (1 - m.score) * uh;
    };

    const pts = phases.map((ph, i) => ({ x: toX(i), y: toY(ph), ph }));

    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], cx = (a.x + b.x) / 2;
      d += ` C ${cx},${a.y} ${cx},${b.y} ${b.x},${b.y}`;
    }

    const uid = `uj-${Math.random().toString(36).slice(2, 8)}`;
    const last = pts.at(-1);

    return `
      <div class="journey__curve" aria-hidden="true">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="curve-svg">
          <defs>
            <linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stop-color="#6366f1" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0"             y="0"          width="${W}" height="${H * 0.4}"  class="zone zone--pos"/>
          <rect x="0"             y="${H * 0.4}" width="${W}" height="${H * 0.2}"  class="zone zone--neu"/>
          <rect x="0"             y="${H * 0.6}" width="${W}" height="${H * 0.4}"  class="zone zone--neg"/>
          ${pts.map(({x}) => `<line x1="${x}" y1="0" x2="${x}" y2="${H}" class="vline"/>`).join('')}
          <path d="${d} L ${last.x},${H} L ${pts[0].x},${H} Z" fill="url(#${uid})"/>
          <path d="${d}" fill="none" class="curve-line"/>
          ${pts.map(({x, y, ph}) => {
            const m = EMOTION_META[ph.emotion] || EMOTION_META.neutral;
            return `<circle cx="${x}" cy="${y}" r="5" class="dot" style="fill:${m.color}"/>`;
          }).join('')}
        </svg>
      </div>`;
  }

  /* ── Phase grid ────────────────────────────── */

  _grid(phases) {
    const headCells = phases.map((ph, i) => {
      const m       = EMOTION_META[ph.emotion] || EMOTION_META.neutral;
      const stories = ph.storyIds || [];
      return `
        <th class="phase-head" data-emotion="${ph.emotion || 'neutral'}"
            style="--ec:${m.color}">
          <span class="ph-num">${i + 1}</span>
          <span class="ph-name">${this._esc(ph.name || '')}</span>
          <span class="ph-emoji" title="${ph.emotion || 'neutral'}">${m.emoji}</span>
          ${stories.length
            ? `<div class="ph-stories">${stories.map(id =>
                `<a class="chip chip--story" href="#${id}">${this._label(id)}</a>`
              ).join('')}</div>`
            : ''}
        </th>`;
    }).join('');

    const bodyRows = ROWS.map(({ key, label }) => {
      const cells = phases.map(ph => {
        const items = ph[key] || [];
        if (!items.length) return `<td class="data-cell data-cell--empty">—</td>`;
        return `<td class="data-cell data-cell--${key.toLowerCase()}">
          ${items.map(t => `<p>${this._esc(t)}</p>`).join('')}
        </td>`;
      }).join('');
      return `
        <tr class="grid-row grid-row--${key.toLowerCase()}">
          <th class="row-label">${label}</th>
          ${cells}
        </tr>`;
    }).join('');

    return `
      <div class="journey__grid-wrap">
        <table class="journey__grid"
               aria-label="${this._esc(this.getAttribute('title') || 'User Journey')} — phase breakdown">
          <thead>
            <tr>
              <th class="corner">Stage</th>
              ${headCells}
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
  }

  /* ── Helpers ───────────────────────────────── */

  _label(id) {
    return id.replace(/^(activity|persona|journey|story|user)-/, '')
             .replace(/-/g, ' ')
             .replace(/\b\w/g, c => c.toUpperCase());
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Inline CSS ────────────────────────────── */

  _css() {
    return `<style>
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text, #1a1a1a);
        container-type: inline-size;
      }

      /* Light */
      :host {
        --_bg:     var(--bg,      #f8f9fa);
        --_card:   var(--card-bg, #ffffff);
        --_border: var(--border,  #e0e0e0);
        --_muted:  var(--muted,   #666666);
        --_text:   var(--text,    #1a1a1a);
      }

      /* Dark */
      @media (prefers-color-scheme: dark) {
        :host {
          --_bg:     var(--bg,      #121212);
          --_card:   var(--card-bg, #1e1e1e);
          --_border: var(--border,  #333333);
          --_muted:  var(--muted,   #888888);
          --_text:   var(--text,    #e8e8e8);
        }
      }

      *, *::before, *::after { box-sizing: border-box; margin: 0; }

      /* Card */
      .journey {
        background: var(--_card);
        border: 1px solid var(--_border);
        border-radius: 12px;
        overflow: hidden;
      }

      /* Header */
      .journey__header {
        padding: 20px 24px 16px 28px;
        border-block-end: 1px solid var(--_border);
        position: relative;
      }

      /* Left accent bar — matches index.html h2::before gradient */
      .journey__header::before {
        content: '';
        position: absolute;
        inset-block: 0;
        inset-inline-start: 0;
        width: 4px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
      }

      .journey__header-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-block-end: 8px;
      }

      .journey__chips {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }

      /* Chips */
      .chip {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        padding: 2px 9px;
        border-radius: 99px;
        text-decoration: none;
        line-height: 1.6;
      }

      .chip--type {
        color: #6366f1;
        background: #ede9fe;
      }

      .chip--story {
        color: #0369a1;
        background: #e0f2fe;
      }

      .chip--story:hover { background: #bae6fd; }

      @media (prefers-color-scheme: dark) {
        .chip--type  { color: #a78bfa; background: #2e1065; }
        .chip--story { color: #38bdf8; background: #082f49; }
        .chip--story:hover { background: #0c4a6e; }
      }

      /* Persona ref */
      .persona-ref {
        font-size: 13px;
        font-weight: 600;
        color: var(--_muted);
        text-decoration: none;
        white-space: nowrap;
      }
      a.persona-ref:hover { color: #6366f1; text-decoration: underline; }

      /* Title & summary */
      .journey__title {
        font-size: 20px;
        font-weight: 700;
        color: var(--_text);
        margin-block-end: 4px;
      }

      .journey--compact .journey__title { font-size: 16px; }

      .journey__summary {
        font-size: 14px;
        color: var(--_muted);
        max-width: 72ch;
      }

      /* Emotion curve */
      .journey__curve {
        background: var(--_bg);
        border-block-end: 1px solid var(--_border);
        overflow: hidden;
      }

      .curve-svg {
        display: block;
        width: 100%;
        height: 80px;
      }

      .journey--compact .curve-svg { height: 54px; }

      .zone { opacity: 0.35; }
      .zone--pos { fill: #dcfce7; }
      .zone--neu { fill: #fef9c3; }
      .zone--neg { fill: #fee2e2; }

      @media (prefers-color-scheme: dark) {
        .zone--pos { fill: #14532d; }
        .zone--neu { fill: #713f12; }
        .zone--neg { fill: #7f1d1d; }
      }

      .vline      { stroke: var(--_border); stroke-width: 1; stroke-dasharray: 3 4; }
      .curve-line { stroke: #6366f1; stroke-width: 2.5; stroke-linecap: round; }
      .dot        { stroke: var(--_card); stroke-width: 2.5; }

      /* Grid */
      .journey__grid-wrap { overflow-x: auto; }

      .journey__grid {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      /* Head row */
      .journey__grid thead tr {
        background: #1e1b4b;
        color: #fff;
      }

      @media (prefers-color-scheme: dark) {
        .journey__grid thead tr { background: #0f0d30; }
      }

      .corner {
        padding: 10px 12px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.55;
        text-align: left;
        white-space: nowrap;
        min-width: 100px;
        position: sticky;
        left: 0;
        background: #1e1b4b;
        z-index: 2;
      }

      @media (prefers-color-scheme: dark) {
        .corner { background: #0f0d30; }
      }

      .phase-head {
        padding: 10px 14px;
        text-align: left;
        vertical-align: top;
        border-inline-start: 1px solid rgba(255 255 255 / 0.12);
        min-width: 160px;
        position: relative;
      }

      /* Emotion-coloured top accent per phase */
      .phase-head::before {
        content: '';
        position: absolute;
        inset-block-start: 0;
        inset-inline: 0;
        height: 3px;
        background: var(--ec, #6366f1);
      }

      .ph-num   { display: block; font-size: 10px; opacity: 0.5; margin-block-end: 2px; }
      .ph-name  { display: block; font-size: 14px; font-weight: 700; line-height: 1.2; }
      .ph-emoji { display: block; font-size: 20px; line-height: 1; margin-block: 4px 2px; }

      .ph-stories { display: flex; flex-wrap: wrap; gap: 4px; margin-block-start: 4px; }

      /* Body rows */
      .grid-row th,
      .grid-row td {
        padding: 10px 12px;
        border-block-end: 1px solid var(--_border);
        border-inline-start: 1px solid var(--_border);
        vertical-align: top;
      }

      .grid-row th:first-child { border-inline-start: none; }

      .row-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--_muted);
        white-space: nowrap;
        background: var(--_bg);
        text-align: left;
        position: sticky;
        left: 0;
        z-index: 1;
      }

      .data-cell          { font-size: 13px; line-height: 1.45; }
      .data-cell p        { margin-block: 0 4px; }
      .data-cell p:last-child { margin-block-end: 0; }
      .data-cell--empty   { color: var(--_muted); opacity: 0.35; }

      /* Semantic row tints */
      .grid-row--painpoints    .data-cell { background: #fff5f5; }
      .grid-row--opportunities .data-cell { background: #f0fdf4; }

      @media (prefers-color-scheme: dark) {
        .grid-row--painpoints    .data-cell { background: #2d0a0a; }
        .grid-row--opportunities .data-cell { background: #052e16; }
      }

      /* Compact */
      .journey--compact .phase-head { min-width: 120px; padding: 8px 10px; }
      .journey--compact .data-cell  { font-size: 12px; padding: 7px 10px; }
      .journey--compact .corner     { min-width: 80px; }

      /* Utility */
      .state-msg           { padding: 24px; font-size: 14px; color: var(--_muted); font-style: italic; }
      .state-msg--error    { color: #dc2626; }
      .journey__placeholder { padding: 20px 24px; font-size: 14px; color: var(--_muted); }
      code { font-family: Monaco, Menlo, monospace; font-size: 0.88em; }

      /* Responsive */
      @container (max-width: 500px) {
        .journey__header   { padding: 14px 16px 12px 20px; }
        .journey__title    { font-size: 17px; }
        .corner, .row-label { min-width: 72px; font-size: 9px; }
        .phase-head        { min-width: 110px; padding: 8px 10px; }
        .data-cell         { font-size: 12px; padding: 8px 10px; }
      }

      @media print {
        .journey__grid-wrap { overflow: visible; }
        .row-label, .corner { position: relative; }
      }
    </style>`;
  }
}

customElements.define('user-journey', UserJourney);
