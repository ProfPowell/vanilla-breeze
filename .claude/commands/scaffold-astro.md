# Scaffold Astro Site

Generate an Astro-powered static site using the `.claude/starters/static-astro/` template.

## Template Location
`.claude/starters/static-astro/`

## Prompts to Collect

Read `.claude/starters/static-astro/manifest.yaml` for the full prompt configuration.

Key prompts:
- `PROJECT_NAME` - Folder name (required, lowercase with hyphens)
- `SITE_NAME` - Display name (required)
- `SITE_URL` - Production URL (required)
- `DESCRIPTION` - Site description (required, max 160 chars)
- `OUTPUT_MODE` - static/server/hybrid (default: static)
- `ADAPTER` - none/cloudflare/node/netlify/vercel (default: none)
- `CONTENT_COLLECTIONS` - Comma-separated collection names (default: blog)

## Instructions

1. Use AskUserQuestion to collect the required prompts
2. Copy all files from `.claude/starters/static-astro/` to the project root (`./`)
3. Replace the starter's package.json name with PROJECT_NAME
4. Copy `.claude/starters/static-astro/README.md.template` to `./README.md`
5. Replace all `{{PLACEHOLDER}}` values with collected prompts (including README.md)
6. Configure astro.config.mjs based on OUTPUT_MODE and ADAPTER
7. Generate content collection directories based on CONTENT_COLLECTIONS
8. Run `npm install` in the generated project

## Skills to Apply
- xhtml-author
- css-author
- performance
- i18n
- accessibility-checker
