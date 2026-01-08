# Scaffold Static Website

Generate a static multi-page website using the `.claude/starters/static-standard/` template.

## Template Location
`.claude/starters/static-standard/`

## Prompts to Collect

Read `.claude/starters/static-standard/manifest.yaml` for the full prompt configuration.

Key prompts:
- `PROJECT_NAME` - Folder name (required, lowercase with hyphens)
- `SITE_NAME` - Display name (required)
- `SITE_URL` - Production URL (required)
- `DESCRIPTION` - Site description (required, max 160 chars)
- `AUTHOR` - Author or organization
- `THEME_COLOR` - Theme color (default: #1e40af)
- `PAGES` - Comma-separated page names (default: index,about,contact)

## Instructions

1. Use AskUserQuestion to collect the required prompts
2. Copy files from `.claude/starters/static-standard/src/` to the project root (`./src/`)
3. Replace the starter's package.json name with PROJECT_NAME
4. Copy shared resources from `.claude/starters/_shared/`:
   - `styles/_reset.css` → `src/styles/_reset.css`
   - `styles/_tokens.css` → `src/styles/_tokens.css`
5. Copy `.claude/starters/static-standard/README.md.template` to `./README.md`
6. Replace all `{{PLACEHOLDER}}` values with collected prompts (including README.md)
7. Generate additional pages based on PAGES prompt
8. Run validation to ensure the generated site passes all checks

## Skills to Apply
- xhtml-author
- css-author
- metadata
- performance
- i18n
- accessibility-checker
