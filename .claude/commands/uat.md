# UAT (User Acceptance Testing) Command

Manage user acceptance testing workflow for features.

## Usage

```
/uat <action> <feature-name>
```

## Arguments

- `$ARGUMENTS` - Action and feature name in format: `<action> <feature-name>`
  - Action: `request`, `approve`, `deny`, or `status`
  - Feature name: kebab-case identifier (e.g., `dark-mode`, `incremental-validation`)

If no arguments provided, display usage help.

## Actions

### request
Request UAT for a completed feature. Creates a `uat-<feature>.md` file with testing instructions.

```
/uat request dark-mode
```

### approve
Human approves the feature after testing. Updates the UAT file and signals ready to merge.

```
/uat approve dark-mode
```

### deny
Human denies the feature - needs more work. Updates UAT file with feedback.

```
/uat deny dark-mode
```

### status
Check the current UAT status of a feature.

```
/uat status dark-mode
```

---

## Instructions

When this command is invoked, parse the action and feature name from the arguments.

### For `/uat request <feature>`:

1. Get the current issue ID from the branch name (format: `<type>/<issue-id>-description`)

2. Add the `uat:requested` label to track status:
   ```bash
   bd label add <issue-id> uat:requested
   ```

3. Create or update `.worklog/uat-<feature>.md` with:
   - Feature description (from recent worklog or commits)
   - Testing steps for the human
   - Expected results
   - How to approve/deny

4. Display a message asking the human to test and respond with `/uat approve <feature>` or `/uat deny <feature>`

### For `/uat approve <feature>`:

1. Get the current issue ID from the branch name

2. Update labels to reflect approval:
   ```bash
   bd label remove <issue-id> uat:requested
   bd label add <issue-id> uat:approved
   ```

3. Update `.worklog/uat-<feature>.md`:
   - Set status to "APPROVED"
   - Add approval timestamp
   - Note the approver

4. Display next steps:
   - Merge the feature branch
   - Close the issue with: `bd close <issue-id>`
   - Update version if needed

### For `/uat deny <feature>`:

1. Ask the human for feedback on what needs to change

2. Get the current issue ID from the branch name

3. Update labels to reflect denial:
   ```bash
   bd label remove <issue-id> uat:requested
   bd label add <issue-id> uat:denied
   ```

4. Update `.worklog/uat-<feature>.md`:
   - Set status to "DENIED"
   - Add denial timestamp
   - Include the feedback

5. Display next steps:
   - Review feedback
   - Make changes
   - Request UAT again when ready (will replace uat:denied with uat:requested)

### For `/uat status <feature>`:

1. Get the current issue ID from the branch name

2. Check issue labels for UAT status:
   ```bash
   bd show <issue-id>
   ```
   Look for labels: `uat:requested`, `uat:approved`, or `uat:denied`

3. Read `.worklog/uat-<feature>.md` if it exists

4. Display current status:
   - If `uat:approved`: "UAT approved - ready to merge and close"
   - If `uat:requested`: "UAT pending - waiting for human review"
   - If `uat:denied`: "UAT denied - see feedback below"
   - If no UAT labels: "No UAT requested yet - run /uat request <feature>"

5. Show any feedback if denied

---

## UAT File Template

When creating a UAT file, use this structure:

```markdown
# UAT: <Feature Name>

**Feature**: <feature-name>
**Issue**: <issue-id>
**Branch**: <branch-name>
**Requested**: <timestamp>
**Status**: PENDING | APPROVED | DENIED

---

## Summary

<What this feature does>

---

## Testing Instructions

1. <Step 1>
2. <Step 2>
3. <Step 3>

## Expected Results

- <Expected outcome 1>
- <Expected outcome 2>

---

## How to Respond

After testing, respond with one of:

- `/uat approve <feature>` - Feature works as expected
- `/uat deny <feature>` - Feature needs changes (you'll be asked for feedback)

---

## History

| Date | Action | Notes |
|------|--------|-------|
| <date> | Requested | Initial UAT request |
```

---

## Examples

```
/uat request incremental-validation
/uat approve incremental-validation
/uat deny dark-mode
/uat status git-workflow
```
