# TDD Mode Command

Manage Test-Driven Development mode for the current session.

## Usage

```
/tdd <action>
```

## Arguments

- `$ARGUMENTS` - Action to perform
  - `advisory` - Enable advisory mode (suggest tests, don't block)
  - `strict` - Enable strict mode (require tests before implementation)
  - `off` - Disable TDD checks for this session (prototyping mode)
  - `status` - Show current TDD mode and configuration
  - No argument - Show help

---

## Instructions

When this command is invoked, parse the action from the arguments.

### For `/tdd advisory`:

1. Update session state to advisory mode
2. Display confirmation:
   ```
   TDD Mode: Advisory

   - Tests will be suggested for new files
   - Implementation not blocked
   - Test file locations shown
   ```

### For `/tdd strict`:

1. Update session state to strict mode
2. Display confirmation:
   ```
   TDD Mode: Strict

   - Tests REQUIRED before implementation
   - New testable files will show blocking message
   - Must create test file first
   ```

### For `/tdd off`:

1. Update session state to disabled
2. Display confirmation:
   ```
   TDD Mode: Disabled (Prototyping Session)

   - No test reminders
   - Re-enable with /tdd advisory or /tdd strict
   ```

### For `/tdd status`:

1. Read project config from `.claude/config/tdd.json` if it exists
2. Check session override state
3. Display:
   ```
   TDD Configuration:

   - Project default: {config.mode or "advisory"}
   - Session override: {session.mode or "none"}
   - Active mode: {effective mode}
   - Test directory: {config.testDirectory or "test"}

   Files being watched:
   - src/**/*.{js,ts} -> test/**/*.test.{js,ts}
   - .claude/scripts/*.js -> .claude/test/validators/*.test.js

   Currently skipped:
   - Config files, type definitions, generated code
   ```

### For no arguments or help:

Display usage information:
```
TDD Mode Management

Commands:
  /tdd advisory  - Suggest tests (default, never blocks)
  /tdd strict    - Require tests before implementation
  /tdd off       - Disable for this session (prototyping)
  /tdd status    - Show current mode and config

The TDD skill auto-activates when creating new JS/TS files.
Use /tdd strict to enforce test-first development.
Use /tdd off when prototyping or exploring.
```

---

## Session State

Session mode is stored in conversation context and resets when starting a new conversation.

Project default in `.claude/config/tdd.json` persists across sessions.

---

## Examples

```
/tdd strict      # Require tests for this session
/tdd advisory    # Suggest tests (default)
/tdd off         # Prototyping - skip tests
/tdd status      # Show current settings
/tdd             # Show help
```
