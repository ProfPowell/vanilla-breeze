# Project Health Dashboard

Run a comprehensive health check across all validators and display a summary dashboard.

## Instructions

1. Run the health check script:
   ```bash
   npm run health
   ```

2. Review the dashboard output showing:
   - **HTML**: File count and validation errors
   - **CSS**: File count and stylelint issues
   - **JavaScript**: File count, ESLint errors and warnings
   - **Images**: File count and modern format coverage
   - **Spelling**: Unknown word count
   - **Links**: Broken internal links
   - **Security**: npm audit vulnerabilities
   - **Tests**: Pass/fail count

3. If issues are found:
   - For HTML errors: Run `npm run lint` for details
   - For CSS errors: Run `npm run lint:css` for details
   - For JS errors: Run `npm run lint:js` for details
   - For spelling: Run `npm run lint:spelling` for details
   - For images: Run `npm run lint:images` for details
   - For full output: Run `npm run lint:all`

## Options

```bash
# JSON output for automation
npm run health -- --json

# Quiet mode (summary only)
npm run health -- --quiet
```

## Status Indicators

| Icon | Meaning |
|------|---------|
| ✓ | All checks passed |
| ⚠ | Warnings present (non-blocking) |
| ✗ | Errors found (needs attention) |

## Overall Status

- **HEALTHY**: All checks pass with no warnings
- **GOOD (with warnings)**: Some warnings but no errors
- **NEEDS ATTENTION**: Errors found that should be fixed

## Usage Examples

```
/health                    # Run full health check
/health -- --json          # Get JSON output
/health -- --quiet         # Summary only
```
