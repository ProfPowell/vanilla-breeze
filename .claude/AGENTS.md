# Agent Instructions

This project uses **bd** (beads) for issue tracking.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Starting a Session

1. Check for in-progress work: `bd list --status in_progress`
2. If resuming: `bd show <id>` to get context
3. If starting fresh: `bd ready` for available work, or ask the user
4. Claim the issue: `bd update <id> --status in_progress`

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
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

## Memory Protocol

When closing an issue or ending a significant work session:

1. **Close with context**: Include what was learned, not just what was done:
   ```bash
   bd close <id> --reason "Implemented X. Learned: Y causes Z. Workaround: W."
   ```

2. **Update memory files** if the session revealed:
   - A non-obvious gotcha → add to relevant `memory/<topic>.md`
   - A user correction → add to `memory/workflow-feedback.md`
   - A new subsystem insight → create `memory/<subsystem>-notes.md`

3. **Don't duplicate** what is in CLAUDE.md. Memory is for *learned* knowledge.

## Resuming Work

1. `bd show <id>` — read description and close_reason of related issues
2. Check memory files for relevant gotchas
3. Check recent git log for prior commits on this work
