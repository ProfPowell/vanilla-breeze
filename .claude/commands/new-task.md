# New Task

Interview the user and create a new beads issue.

## Instructions

You are helping the user create a new issue. Follow these steps exactly.

### Step 1 — Interview

Ask these questions **one group at a time**. Wait for answers before continuing.

**Group 1:**
- What is the task? (one sentence)
- Type: `feature`, `bug`, or `task`?

**Group 2:**
- Priority: 0 (critical), 1 (next up), 2 (queued), 3 (someday), or 4 (backlog)?
- Does this depend on any other issues completing first?

**Group 3:**
- What's the context Claude needs to approach this correctly? (decisions made, constraints, links)
- What are the acceptance criteria? (list them — be specific and verifiable)
- Anything explicitly out of scope?

### Step 2 — Create the issue

Build the description from the interview answers and create the issue:

```bash
bd create --title="<one sentence from Group 1>" --type=<type> --priority=<priority>
```

If dependencies were specified, add them:

```bash
bd dep add <new-issue-id> <depends-on-id>
```

### Step 3 — Confirm

Tell the user:
- The beads issue ID
- The title and type
- A summary of the acceptance criteria so they can verify it captured things correctly
