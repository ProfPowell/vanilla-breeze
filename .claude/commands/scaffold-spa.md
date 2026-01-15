# Scaffold PWA/SPA

Generate a single-page application with Web Components using the `.claude/starters/pwa-spa/` template.

## Template Location
`.claude/starters/pwa-spa/`

## Prompts to Collect

Read `.claude/starters/pwa-spa/manifest.yaml` for the full prompt configuration.

Key prompts:
- `PROJECT_NAME` - Folder name (required, lowercase with hyphens)
- `DISPLAY_NAME` - Application name (required)
- `DESCRIPTION` - App description (required, max 160 chars)
- `THEME_COLOR` - Theme color (default: #1e40af)
- `BACKGROUND_COLOR` - Background color (default: #ffffff)
- `API_BASE_URL` - API endpoint (default: /api)
- `ENABLE_AUTH` - Include authentication (default: false)
- `INITIAL_ROUTES` - Comma-separated routes (default: home,about,settings)

## Instructions

1. Use AskUserQuestion to collect the required prompts
2. Copy all files from `.claude/starters/pwa-spa/` to the project root (`./`)
3. Replace the starter's package.json name with PROJECT_NAME
4. Copy shared resources from `.claude/starters/_shared/`:
   - `styles/_reset.css` → `src/styles/_reset.css`
   - `styles/_tokens.css` → `src/styles/_tokens.css`
   - `components/icon-wc/` → `src/components/icon-wc/`
5. Copy `.claude/starters/pwa-spa/README.md.template` to `./README.md`
6. Replace all `{{PLACEHOLDER}}` values with collected prompts (including README.md)
7. Handle conditional sections `{{#IF_ENABLE_AUTH}}...{{/IF_ENABLE_AUTH}}`
8. Generate view components based on INITIAL_ROUTES
9. Register routes in main.js

## Skills to Apply
- javascript-author
- custom-elements
- service-worker
- api-client
- state-management
- accessibility-checker
