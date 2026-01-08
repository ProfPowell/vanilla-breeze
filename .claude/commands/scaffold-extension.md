# Scaffold Chrome Extension

Generate a Chrome extension using the `.claude/starters/chrome-extension/` template.

## Template Location
`.claude/starters/chrome-extension/`

## Prompts to Collect

Read `.claude/starters/chrome-extension/manifest.yaml` for the full prompt configuration.

Key prompts:
- `PROJECT_NAME` - Folder name (required, lowercase with hyphens)
- `DISPLAY_NAME` - Extension name (required)
- `DESCRIPTION` - Description (required, max 132 chars for Chrome Web Store)
- `VERSION` - Version number (default: 1.0.0)
- `FEATURES` - Components to include: popup, options, content-script, background
- `PERMISSIONS` - Chrome permissions: storage, tabs, activeTab, scripting, alarms
- `HOST_PERMISSIONS` - URL patterns for content script access

## Instructions

1. Use AskUserQuestion to collect the required prompts
2. Copy all files from `.claude/starters/chrome-extension/` to the project root (`./`)
3. Replace the starter's manifest.json name with DISPLAY_NAME
4. Copy `.claude/starters/chrome-extension/README.md.template` to `./README.md`
5. Replace all `{{PLACEHOLDER}}` values with collected prompts (including README.md)
6. Update manifest.json:
   - Set permissions based on PERMISSIONS prompt
   - Set host_permissions based on HOST_PERMISSIONS prompt
   - Remove unused features based on FEATURES prompt
7. Remove unused feature directories if not selected:
   - Remove `src/popup/` if popup not in FEATURES
   - Remove `src/options/` if options not in FEATURES
   - Remove `src/content/` if content-script not in FEATURES
   - Remove `src/background/` if background not in FEATURES
8. Update manifest.json to remove references to excluded features

## Loading the Extension

After scaffolding, instruct the user:
1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" toggle
3. Click "Load unpacked"
4. Select the generated extension directory

## Skills to Apply
- javascript-author
- data-storage
- i18n
- security
