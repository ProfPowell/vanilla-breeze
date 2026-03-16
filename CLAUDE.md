# Claude Instructions

This file tells Claude how to operate within this project or workspace.

## Task Tracking

This project uses **beads** (`bd`) for issue tracking. Issues live in `.beads/issues.jsonl`.

See `.claude/AGENTS.md` for the full workflow.

---

## Project Context

- **Tech stack**: HTML-first CSS framework with Web Components. 11ty + Nunjucks doc site.
- **Local dev**: Caddy at https://vb.test. `npm run build` from root.
- **JS entry**: Single bundled entry via `_data/site.js`. Components registered in `src/web-components/index.js`.
- **Key conventions**:
  - No `<div>` in demos — use semantic elements or VB custom elements
  - `<browser-window>` + `<code-block>` for doc page demos
  - Ship doc pages alongside new components — never defer
  - Demo files link to `/src/main.css` and `/src/main.js`
- **Quality**: `npm test`, `npm run conformance`, `npm run test:components`. CI quality-gate blocks deploy.
- **Doc layouts**: `.njk` in `site/src/_includes/layouts/`

---

## Working Style

- Prefer platform-native solutions over packages
- Ask before expanding scope
- Small focused commits — use conventional commit format
- If something is ambiguous, make your best call and note the decision

---

## System Map

| System | Location | Owns |
|--------|----------|------|
| **CLAUDE.md** | Repo root | Project facts, conventions, constraints |
| **AGENTS.md** | `.claude/AGENTS.md` | Session protocol, beads workflow, completion checklist |
| **Memory** | `~/.claude/projects/.../memory/` | Learned gotchas, user corrections, session notes |
| **Skills** | `.claude/skills/` | Domain expertise per file type / task |
| **Commands** | `.claude/commands/` | Slash commands for common operations |
| **Hooks** | `.claude/settings.json` | Auto-run validators on file edits |
| **Beads** | `.beads/` | Issue tracking (synced with git) |

Each system has one owner. Do not duplicate across systems.