# Claude Instructions

This file tells Claude how to operate within this project or workspace.

## Task System

Tasks are managed as markdown files in `admin/tasks/`. This is the source of truth for all work.

### Directory Layout

```
/tasks
  _index.md          ← master backlog, check here first
  active/            ← tasks currently in progress
  done/              ← completed tasks (never delete, archive only)
  _template.md       ← copy this to start a new task
```

### Session Protocol

**At the start of every session:**

1. Read the task file you've been given (e.g. `tasks/active/my-task.md`)
2. If no task is specified, read `tasks/_index.md` and ask which task to work on
3. Review the **Session Log** section of the task file to understand where things left off

**During the session:**

- Work toward the **Acceptance Criteria** in the task file
- If you discover scope or blockers, note them in the task file under a `## Notes` section
- Do not silently expand scope — flag it

**At the end of every session:**

1. Append a new entry to the **Session Log** in the task file (date + what was done + what's next)
2. Update the task `status` in the frontmatter if it changed
3. If the task is complete:
	- Check all acceptance criteria
	- Move the file from `tasks/active/` to `tasks/done/`
	- Update `tasks/_index.md` — move row to "Recently Done"

### Creating New Tasks

```bash
cp tasks/_template.md tasks/active/my-new-task.md
```

Then fill in the frontmatter and sections. Add a row to `tasks/_index.md`.

### Status Values

| Status | Meaning |
|:-------|:--------|
| `backlog` | Defined but not started |
| `active` | Currently being worked |
| `blocked` | Waiting on something external |
| `done` | Complete and archived |

---

## Project Context

> **Edit this section** with project-specific context Claude should always know.

- Tech stack / constraints:
- Key conventions:
- Things to avoid:
- Relevant docs or links:

---

## Working Style

- Prefer platform-native solutions over packages
- Ask before expanding scope
- Small focused commits — use conventional commit format
- If something is ambiguous, make your best call and note the decision in the task file