# Scaffold REST API

Generate a Node.js REST API using the `.claude/starters/rest-api/` template.

## Template Location
`.claude/starters/rest-api/`

## Prompts to Collect

Read `.claude/starters/rest-api/manifest.yaml` for the full prompt configuration.

Key prompts:
- `PROJECT_NAME` - Folder name (required, lowercase with hyphens)
- `DESCRIPTION` - API description (required)
- `PORT` - Server port (default: 3000)
- `FRAMEWORK` - express/fastify (default: express)
- `DATABASE` - postgresql/none (default: postgresql)
- `ENABLE_AUTH` - Include JWT auth (default: true)
- `ENABLE_RATE_LIMIT` - Include rate limiting (default: true)
- `INITIAL_RESOURCES` - Comma-separated resources (default: users)

## Instructions

1. Use AskUserQuestion to collect the required prompts
2. Copy all files from `.claude/starters/rest-api/` to the project root (`./`)
3. Replace the starter's package.json name with PROJECT_NAME
4. Copy `.claude/starters/rest-api/README.md.template` to `./README.md`
5. Replace all `{{PLACEHOLDER}}` values with collected prompts (including README.md)
6. Handle conditional sections:
   - `{{#IF_ENABLE_AUTH}}...{{/IF_ENABLE_AUTH}}`
   - `{{#IF_DATABASE}}...{{/IF_DATABASE}}`
   - `{{#IF_ENABLE_RATE_LIMIT}}...{{/IF_ENABLE_RATE_LIMIT}}`
7. Generate resource handlers/services based on INITIAL_RESOURCES
8. Update routes.js with new resource routes
9. Run `npm install` in the generated project

## Skills to Apply
- nodejs-backend
- rest-api
- database
- authentication
- backend-testing
- security
