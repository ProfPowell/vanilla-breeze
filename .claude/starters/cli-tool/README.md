# CLI Tool Starter

Node.js command-line tool with zero dependencies.

## Features

- **Zero dependencies** - Uses only Node.js built-ins
- **Native argument parsing** - `util.parseArgs` (Node.js 18+)
- **Flexible styles** - Simple, multi-command, or interactive
- **Colored output** - ANSI colors with NO_COLOR support
- **Config files** - Load from `.toolrc` or `package.json`
- **Progress indicators** - Optional spinners for async operations

## Usage

```bash
/scaffold-cli
```

Or use the interactive scaffold command:

```bash
/scaffold
# Select "CLI Tool"
```

## Prompts

| Prompt | Description | Default |
|--------|-------------|---------|
| PROJECT_NAME | Package/folder name | (required) |
| COMMAND_NAME | CLI command name | (required) |
| DESCRIPTION | Short description | (required) |
| CLI_STYLE | simple, multi-command, interactive | simple |
| ENABLE_CONFIG | Config file support | true |
| ENABLE_COLOR | Colored output | true |
| ENABLE_SPINNER | Progress indicators | false |
| AUTHOR | Author name | "" |
| LICENSE | License type | MIT |

## CLI Styles

### Simple

Single action tool like `grep`, `cat`, or `curl`:

```bash
mytool [options] <files...>
mytool --output result.txt input.txt
```

### Multi-Command

Git-style subcommand architecture:

```bash
mytool init
mytool build --output dist/
mytool help
```

### Interactive

Wizard-style with prompts:

```bash
mytool
# ? Project name: my-project
# ? Type (lib/app): lib
# Creating project...
```

## Generated Structure

```
project-name/
├── bin/
│   └── command-name.js      # Entry point with shebang
├── src/
│   ├── index.js             # Main logic
│   ├── commands/            # (multi-command only)
│   │   ├── index.js
│   │   └── help.js
│   └── lib/
│       ├── args.js          # Argument parsing
│       ├── cli.js           # Output helpers
│       ├── config.js        # Config loading
│       └── prompts.js       # Interactive prompts
├── test/
│   └── cli.test.js          # CLI tests
├── package.json
└── .command-namerc.example  # Example config
```

## After Scaffolding

```bash
# The tool is already linked globally via npm link
command-name --help

# Run tests
npm test

# Unlink when done developing
npm unlink
```

## Skills Applied

- **cli-author** - CLI patterns and conventions
- **javascript-author** - JavaScript coding patterns
- **unit-testing** - Node.js test runner
- **error-handling** - Error management