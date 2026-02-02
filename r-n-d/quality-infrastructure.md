# Quality Infrastructure

This document describes the quality tooling available in vanilla-breeze.

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run lint:html` | Validate HTML in `docs/` and `dist/` |
| `npm run lint` | Run all linting |
| `npm run test` | Run unit tests |
| `npm run health` | Project health dashboard |
| `npm run check` | Run lint + test together |

## PostToolUse Hooks (Real-time Validation)

During Claude Code sessions, PostToolUse hooks in `.claude/settings.json` automatically run validators when files are edited:

- **HTML validation** - Runs on `.html` file changes
- **CSS validation** - Runs on `.css` file changes
- **JavaScript validation** - Runs on `.js` file changes
- **Accessibility checks** - Runs on HTML changes
- **Performance checks** - Analyzes resource loading patterns

These provide immediate feedback without manual `npm run` commands.

## Validation Scripts (38 total)

Located in `.claude/scripts/`, these cover:

**Core validators:**
- `validate-html.js` - HTML5 + XHTML strictness
- `validate-css.js` - CSS syntax and best practices
- `validate-js.js` - JavaScript patterns and security
- `validate-a11y.js` - WCAG 2.1 AA compliance

**Specialized:**
- `validate-performance.js` - Core Web Vitals patterns
- `validate-seo.js` - Meta tags and structured data
- `validate-security.js` - CSP, XSS, injection patterns
- `validate-custom-elements.js` - Web component conventions

**Health dashboard:**
- `health-check.js` - Aggregates all validators into project overview

## Test Files

Located in `.claude/test/`:

- Unit tests for validation scripts
- Fixtures for testing edge cases
- Run with `npm test` or `node --test .claude/test/`

## CI Integration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs quality checks before build:

1. **quality** job - Lints HTML, runs tests (warn-only initially)
2. **build** job - Builds site (depends on quality)
3. **deploy** job - Deploys to GitHub Pages

Quality failures are currently warnings (`continue-on-error: true`). Once stable, remove this flag to enforce gates.

## Running Individual Validators

```bash
# Direct script execution
node .claude/scripts/validate-html.js path/to/file.html

# Via npx (some validators)
npx html-validate 'docs/**/*.html'
```

## Future Improvements

- [ ] Remove `continue-on-error` from CI once stable
- [ ] Add eslint/stylelint as npm dependencies
- [ ] Expand CI with pa11y for accessibility
- [ ] Add Playwright visual regression testing
