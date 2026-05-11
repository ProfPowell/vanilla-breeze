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
| **Reference docs** | `admin/syntax.md`, `admin/global-vanilla-breeze.md` | Element/attribute catalog and project roadmap |
| **Stable contracts** | `admin/specs/` | Versioned specs (meta-tag contract v1, canonical-document v1) |
| **External handoffs** | `admin/handoffs/` | Onboarding docs for downstream consumers (e.g. vanilla-press) |

Each system has one owner. Do not duplicate across systems.

### Memory ownership (overrides bd guidance below)

The auto-memory directory at `~/.claude/projects/.../memory/` is the canonical persistent-knowledge store for this project. The Beads block below (auto-managed by `bd`) suggests `bd remember` instead — **ignore that line**. Do not write `MEMORY.md` content into beads, and do not call `bd remember` for project knowledge. The `claude-mem` plugin is intentionally uninstalled to avoid a third memory system.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
