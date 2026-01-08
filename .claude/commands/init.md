# Project Initialization

Initialize a new project from this template.

## Usage

```
/init
```

## What This Command Does

1. **Welcome and project type selection**
2. **Collect project configuration**
3. **Execute appropriate scaffold command**
4. **Clean up unused starter templates**
5. **Display next steps**

## Instructions

### Step 1: Welcome

Display a welcome message:

```
Welcome to Project Template!

This wizard will help you set up a new project.
We'll scaffold the appropriate files and configure
everything you need to start building.
```

### Step 2: Select Project Type

Use AskUserQuestion to ask which type of project:

```
What type of project would you like to create?
```

Options:
1. **Static Website** - Multi-page HTML/CSS/JS site with semantic structure
2. **Astro Site** - Static site with Astro framework and content collections
3. **PWA/SPA** - Single-page app with Web Components and offline support
4. **REST API** - Node.js backend with Express/Fastify and PostgreSQL
5. **Dashboard** - Admin interface with sidebar layout and charts
6. **Chrome Extension** - Browser extension with Manifest V3
7. **CLI Tool** - Node.js command-line tool with zero dependencies
8. **Documentation Site** - Static docs with sidebar, search, and code highlighting
9. **Blog** - Markdown blog with RSS, tags, and social sharing
10. **Form Builder** - Dynamic forms with validation and conditional logic
11. **Design System** - Web Component library with tokens and documentation
12. **E-commerce Storefront** - Product catalog with cart, checkout, and orders

### Step 3: Collect Configuration

Based on selection, use AskUserQuestion to collect:

**For all projects:**
- Project name (lowercase, hyphens only)
- Description (max 160 characters)

**For websites/apps:**
- Site/app name (display name)
- Theme color (default: #1e40af)

**For APIs:**
- Port number (default: 3000)
- Enable authentication (yes/no)

### Step 4: Execute Scaffold

Based on the selected project type, run the appropriate command:

| Selection | Command |
|-----------|---------|
| Static Website | `/scaffold-site` |
| Astro Site | `/scaffold-astro` |
| PWA/SPA | `/scaffold-spa` |
| REST API | `/scaffold-api` |
| Dashboard | `/scaffold-dashboard` |
| Chrome Extension | `/scaffold-extension` |
| CLI Tool | `/scaffold-cli` |
| Documentation Site | `/scaffold-docs` |
| Blog | `/scaffold-blog` |
| Form Builder | `/scaffold-form-builder` |
| Design System | `/scaffold-design-system` |
| E-commerce Storefront | `/scaffold-ecommerce` |

Pass the collected configuration to the scaffold command.

### Step 5: Clean Up

After scaffolding, remove unused starters from `.claude/starters/`:

```bash
# Keep only the used starter and _shared
# Remove other starter directories to reduce template size
```

Optionally offer to:
- Initialize git repository if not already done
- Install npm dependencies
- Run initial validation

### Step 6: Display Next Steps

Show the user what to do next:

```
Project initialized!

Next steps:
1. npm install
2. npm run dev (or appropriate start command)

Available commands:
- npm run lint     - Validate code
- npm run test     - Run tests
- npm run build    - Build for production

Skills available:
- /skill forms          - Build accessible forms
- /skill css-author     - CSS best practices
- /skill accessibility  - WCAG compliance
```

## Example Flow

```
User: /init

Claude: Welcome to Project Template!

What type of project would you like to create?
○ Static Website (Recommended)
○ Astro Site
○ PWA/SPA
○ REST API
○ Dashboard
○ Chrome Extension
○ CLI Tool
○ Documentation Site
○ Blog
○ Form Builder
○ Design System
○ E-commerce Storefront

User: Static Website

Claude: Project name (lowercase, hyphens):
User: my-company-site

Claude: Description (max 160 chars):
User: Company website with product pages and contact form

Claude: Site name (display name):
User: My Company

[Creates project using /scaffold-site]

Claude: Project initialized!

Your project structure:
├── src/
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   └── styles/
├── .assets/
├── package.json
└── README.md

Next steps:
1. npm install
2. Open src/index.html in browser

Run /help to see available skills and commands.
```

## Notes

- This command is the entry point for new users
- Keep the flow simple and focused
- Provide sensible defaults where possible
- Clean up after scaffolding to reduce clutter
