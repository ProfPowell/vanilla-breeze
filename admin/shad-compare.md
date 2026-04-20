# shadcn-html vs. Vanilla Breeze — Comparative Review

**Source reviewed:** https://shadcn-html.com/documentation/ (and its homepage / installation page)
**Date:** 2026-04-20
**Scope:** Positioning, developer experience, AI-readiness, documentation, tokens, install flow.

---

## TL;DR

shadcn-html is a *much smaller* library than Vanilla Breeze (essentially a Button + Dialog + a handful of primitives at time of review), but it has **packaged its story better for the current moment**: "a UI component system that scales with AI," with per-component markdown "skill" files, shadcn-compatible semantic tokens, and a zero-build copy-paste flow.

Vanilla Breeze beats it on surface area (100+ components, multiple packs, themes, effects, UX-planning components that shadcn-html has no equivalent of), architectural maturity (cascade layers, `api.json`, layout primitives, conformance tests), and documentation volume. What we're missing is **the AI-native *narrative* and the per-component artifacts that make agents reach for us first**.

This is a positioning/DX/tooling gap — not a technical one. The fixes below are mostly additive.

---

## What shadcn-html does well (and what we should steal)

### 1. The "five-layer" explainer lands immediately
Homepage teaches the mental model in 30 seconds:

> Semantic Tokens → Component Skill docs → Component CSS → Semantic HTML → Vanilla JS

Every layer is optional, every layer is standards-based. We have all five layers already — but our pitch buries them under 100+ component links. First-time visitors don't know what VB *is* until three clicks in.

### 2. Component "skill" files as a first-class deliverable
Each component ships a `component-skill.md` with a fixed shape:

```
Pattern name
Native basis (what HTML element it wraps)
Native Web APIs used
Structure (minimal markup)
Variants table (data-attr → visual token)
Sizes / accessibility / notes
```

This markdown file is the thing you paste into Cursor/Claude/Copilot to get correct code. We have `api.json` (which is *better* for tooling) but we don't have a human+LLM-readable markdown skill file per component.

### 3. Explicit "AI-native" positioning
The phrase *"scales with AI"* is on the homepage. Installation docs say, verbatim, that "the folder has everything it needs: component skills to read, CSS to include, JS to wire up." That framing is the whole point of the project. We say "HTML-first" and "progressive enhancement" — correct but 2022-era.

### 4. shadcn token naming = free distribution
They inherit shadcn's semantic token names (`--primary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--radius`) in `oklch()`. Any agent trained on shadcn-react generates CSS that "just works." That's a massive, costless moat.

Our token names are ours (`--color-interactive`, `--color-surface`, `--size-s`, etc.). They're better-organized, but they mean an agent fluent in shadcn will produce broken VB code unless we map it.

### 5. Tight, single-purpose homepage
One pitch, one diagram, one example component, one CTA (Get Started). Ours is richer but doesn't force a first impression.

---

## Where Vanilla Breeze is already stronger

| Dimension | VB | shadcn-html |
|---|---|---|
| Component count | ~100+ (accordion → youtube-player) | ~5–10 visible |
| Machine-readable API | `api.json` + schema + registry | Markdown only |
| Layout primitives | `layout-stack/cluster/grid/sidebar` + `data-layout-*` | None apparent |
| Themes | 10 brand + 18 extreme + 4 a11y + packs | Light/dark only |
| Packs | kawaii, memphis, ui, prototype, effects, ux-planning | None |
| Conformance tests | `npm run conformance`, `htmlvalidate`, Playwright | Not mentioned |
| Bundle split | core / extras / per-pack / themes via package exports | Single CDN links |
| Framework integration docs | Astro, Eleventy | None |
| UX-planning verticals | user-persona, empathy-map, impact-effort, user-journey, story-map, work-item, gantt-chart | None |

**Takeaway:** we don't need to *become* shadcn-html. We need to package what we already have so the shadcn-html audience can see it.

---

## Actionable recommendations

Grouped by effort. Priorities are my opinion — reorder as you like.

### P0 — Cheap wins, high impact

**1. Add `component-skill.md` per component.**
For each folder in `src/web-components/<name>/`, add a `skill.md` generated from `api.json` + a hand-written "Structure / Accessibility / Notes" block. Script it: the generator reads `api.json`, emits a standardized skill file, and a human fills in the prose gaps. One deliverable, 100 wins.

Template:
```markdown
# accordion-wc
Native basis: <details> / <summary>
Web APIs: details.open, details[name] exclusive groups
Structure: see below
Attributes: (table from api.json)
Required children: (from api.json structure)
Accessibility: (hand-written)
Do / Don't: (hand-written, 3 bullets each)
```

**2. Publish `llms.txt` and `llms-full.txt` at site root.**
Follow https://llmstxt.org. `llms.txt` = a curated index of key pages. `llms-full.txt` = concatenation of every `skill.md`. Agents that fetch the domain auto-discover usage. shadcn-html doesn't have this yet — we can be first.

**3. "Copy for LLM" button on every component doc page.**
One button, copies the component's `skill.md` + a minimal HTML example to clipboard. That single UX is what makes shadcn-react sticky in Cursor/Claude workflows.

**4. Ship a shadcn-compatible token layer.**
New pack: `@vanilla-breeze/shadcn-tokens` — a stylesheet that defines `--primary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--radius` as aliases of our semantic tokens. Cost: one CSS file. Benefit: every LLM fluent in shadcn generates code that works in VB.

**5. Rewrite the homepage hero.**
One sentence of positioning, one five-layer diagram, one code example, one CTA. Move the 100-component gallery to `/docs/elements/`. Current homepage sells depth; first-timers need a pitch first.

Proposed hero (for consideration, not final):
> **Vanilla Breeze** — HTML-first components that scale with AI.
> 100+ semantic components. Zero classes. Copy-paste friendly for Claude, Cursor, and Copilot.

### P1 — Medium effort, big story

**6. "AI Workflows" section in docs.**
A dedicated page: "Using Vanilla Breeze with Claude Code / Cursor / Copilot." Include: prompt snippets, how to point an agent at `llms-full.txt`, example prompts that produce correct VB markup. This is 100% story, 0% code, and it's the single biggest gap versus shadcn-html's positioning.

**7. MCP server for component lookup.**
`@vanilla-breeze/mcp` — one tool: `get_component(name) -> skill.md + api.json + example`. A developer adds VB's MCP to Claude Code and the agent can look up any component on demand. We already have `api.json` infrastructure and a component registry; this is mostly glue.

**8. `npx vanilla-breeze add <component>` CLI.**
shadcn-react's wedge was the CLI. shadcn-html doesn't have one. We should. It doesn't need to copy files locally (that fights our cascade-layer model) — it can instead emit the exact `<link>`/`<script>`/HTML snippet to paste, plus print the `skill.md`. One script, huge DX improvement for agents that prefer CLIs.

**9. Kitchen-sink demo per component in an isolated iframe, linked from the doc page.**
Several of our component pages already do this with `<browser-window>`. Audit and ensure every component has one. shadcn-html has nothing comparable — we're already ahead here but the coverage is inconsistent.

### P2 — Larger investments

**10. Structured skill registry.**
Formalize `skill.md` as a spec with JSON frontmatter validated against a schema (like `api.json` today). Then every doc page, every LLM-facing asset, and the MCP server render from the same source. This is the "agent-native architecture" play — we'd be the first component library built this way end-to-end.

**11. Figma library + token export parity with shadcn.**
If we ship the shadcn-compatible token layer (P0 #4), producing a Figma variables file that matches is a few hours of work and dramatically expands the "designer hands a mock to Claude" workflow.

**12. Short-form comparison page: "VB vs. shadcn-html vs. shadcn-react."**
Honest table. Where we win, where we don't, when to choose which. Builds credibility and captures search intent. Not in our docs today.

---

## Anti-recommendations (things *not* to copy)

- **Don't drop to 10 components to match shadcn-html's focus.** Surface area is an asset; we just need better navigation.
- **Don't throw away `api.json` in favor of markdown-only.** Machine-readable beats markdown-only. Generate the skill files *from* `api.json`, don't replace it.
- **Don't adopt oklch-only colors as our primary token layer.** Our current system is richer (brand themes, extreme themes, a11y themes). Offer shadcn parity as a compat layer, not a replacement.
- **Don't rebuild around data-variant everywhere.** Our `data-layout-*` + attribute conventions are more expressive. shadcn-html's `data-variant="destructive"` is a subset of what we can already do.

---

## Proposed sequence

Week 1 (P0): skill-file generator + `llms.txt` + Copy-for-LLM button + shadcn token compat pack.
Week 2 (P1): AI-workflows docs page + MCP server prototype + homepage rewrite.
Week 3+ (P2): CLI, skill schema formalization, Figma library, comparison page.

Most of this is *re-packaging existing strength* so the AI-assisted-dev audience can find and use us. The underlying library is already ahead — the story isn't.
