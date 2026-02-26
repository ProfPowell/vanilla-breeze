# New Task

Interview the user and create a new task file from the template.

## Instructions

You are helping the user create a new task file. Follow these steps exactly.

### Step 1 — Interview

Ask these questions **one group at a time**. Wait for answers before continuing.

**Group 1:**
- What is the task? (one sentence)
- Which project does it belong to? (check `tasks/_index.md` for the project registry)

**Group 2:**
- Priority: p0 (critical), p1 (next up), p2 (queued), or p3 (someday)?
- Does this depend on any other tasks completing first?

**Group 3:**
- What's the context Claude needs to approach this correctly? (decisions made, constraints, links)
- What are the acceptance criteria? (list them — be specific and verifiable)
- Anything explicitly out of scope?

### Step 2 — Generate slug

Derive a short kebab-case slug from the task title. Max 4–5 words. Examples:
- "Add form validation to checkout" → `form-validation-checkout`
- "Fix anchor positioning in popover" → `fix-anchor-popover`

### Step 3 — Write the file

Create the file at `tasks/active/<slug>.md` using this exact structure:

```markdown
---
id: <slug>
project: <project>
status: backlog
priority: <priority>
depends: [<depends or empty>]
created: <today's date YYYY-MM-DD>
updated: <today's date YYYY-MM-DD>
---

# <Task Title>

<One sentence description from the interview.>

## Context

<Context from the interview.>

## Acceptance Criteria

<Checklist from the interview — each item as `- [ ] ...`>

## Out of Scope

<Out of scope items, or "Nothing identified yet." if none given.>

## Notes

> Add discoveries, decisions, or blockers here during work.

---

## Session Log

_No sessions yet._
```

### Step 4 — Update the index

Add a row to the **Backlog** table in `tasks/_index.md`:

```
| [<slug>](./active/<slug>.md) | <project> | <priority> | <one-line summary> |
```

### Step 5 — Confirm

Tell the user:
- The file path created
- The slug
- A summary of the acceptance criteria so they can verify it captured things correctly