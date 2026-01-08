# List Themes

Display all available themes and their configuration.

## Arguments
None required.

## Output Format

Read `/.claude/styles/tokens.json` and display:

```
Design Token Themes
===================

Modes (data-mode):
  auto     - Follow system preference (default)
  light    - Force light color scheme
  dark     - Force dark color scheme

Brand Themes (data-theme):
  default  - Neutral blue (hue: 250)
  ocean    - Calm teal-blue (hue: 200)
  forest   - Natural green (hue: 145)
  sunset   - Warm orange (hue: 25)

Usage:
  <html data-theme="ocean" data-mode="dark">

Token Files:
  .claude/styles/tokens/_base.css        - Neutral primitives
  .claude/styles/tokens/_semantic.css    - Purpose-driven aliases
  .claude/styles/tokens/_components.css  - Component tokens
  .claude/styles/tokens/themes/_*.css    - Theme overrides
  .claude/styles/tokens.json             - Programmatic access

Commands:
  /add-theme {name}     - Create new brand theme
  /switch-theme {name}  - Apply theme or generate toggle
  /list-themes          - Show this help
```

## Instructions

1. Read `.claude/styles/tokens.json` to get current theme list
2. Format output showing all available themes
3. Include hue values and descriptions
4. Show usage examples
5. List related files and commands
