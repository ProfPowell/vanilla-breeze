# Scaffold CLI Tool

Generate a Node.js CLI tool using the `.claude/starters/cli-tool/` template.

## Template Location

`.claude/starters/cli-tool/`

## Instructions

1. Read the manifest at `.claude/starters/cli-tool/manifest.yaml` to understand prompts

2. Use AskUserQuestion to collect required prompts:
   - `PROJECT_NAME` - Package/folder name (required, lowercase with hyphens)
   - `COMMAND_NAME` - CLI command name (required, lowercase with hyphens)
   - `DESCRIPTION` - Short description (required, max 80 chars)
   - `CLI_STYLE` - simple/multi-command/interactive (default: simple)
   - `ENABLE_CONFIG` - Config file support (default: true)
   - `ENABLE_COLOR` - Colored output (default: true)
   - `ENABLE_SPINNER` - Progress indicators (default: false)
   - `AUTHOR` - Author name (optional)
   - `LICENSE` - License type (default: MIT)

3. Create the project directory at `./{{PROJECT_NAME}}/`

4. Copy files from `.claude/starters/cli-tool/` to the project directory:
   - `package.json`
   - `README.md.template` -> `README.md`
   - `bin/{{COMMAND_NAME}}.js`
   - `src/index.js`
   - `src/lib/args.js`
   - `src/lib/cli.js`
   - `src/lib/prompts.js`
   - `test/cli.test.js`
   - `test/unit/args.test.js`
   - `.{{COMMAND_NAME}}rc.example`

5. Conditionally include files based on CLI_STYLE:
   - For `multi-command`: Include `src/commands/index.js` and `src/commands/help.js`
   - For `simple` or `interactive`: Skip commands directory

6. Conditionally include based on features:
   - If `ENABLE_CONFIG`: Include `src/lib/config.js`
   - If `ENABLE_SPINNER`: Include spinner code in cli.js

7. Replace all `{{PLACEHOLDER}}` values with collected prompts:
   - `{{PROJECT_NAME}}` - Package name
   - `{{COMMAND_NAME}}` - CLI command name
   - `{{DESCRIPTION}}` - Tool description
   - `{{AUTHOR}}` - Author name
   - `{{LICENSE}}` - License type
   - `{{CURRENT_YEAR}}` - Current year

8. Handle conditional sections based on CLI_STYLE:
   - `{{#IF_SIMPLE}}...{{/IF_SIMPLE}}` - Include for simple style
   - `{{#IF_MULTI_COMMAND}}...{{/IF_MULTI_COMMAND}}` - Include for multi-command
   - `{{#IF_INTERACTIVE}}...{{/IF_INTERACTIVE}}` - Include for interactive

9. Handle feature conditionals:
   - `{{#IF_ENABLE_CONFIG}}...{{/IF_ENABLE_CONFIG}}`
   - `{{#IF_ENABLE_SPINNER}}...{{/IF_ENABLE_SPINNER}}`

10. After scaffolding:
    - Run `npm install` in the project directory
    - Run `npm link` to make the command available globally
    - Test with `{{COMMAND_NAME}} --help`

## Skills to Apply

- cli-author
- javascript-author
- unit-testing
- error-handling

## Example Usage

```
User: /scaffold-cli
Assistant: I'll create a CLI tool for you. Let me gather some information...

[AskUserQuestion for PROJECT_NAME, COMMAND_NAME, DESCRIPTION, CLI_STYLE, etc.]

User: mytool, mytool, "A tool for processing files", simple