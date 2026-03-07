# /validate-component

Run defensive quality checks on a component directory.

Usage: /validate-component $ARGUMENTS
Example: /validate-component carousel-wc

## Checks

Run the following checks on `src/web-components/$ARGUMENTS/`:

### 1. Pre-upgrade CSS (Item 1)
- Does `styles.css` contain a `:not(:defined)` block?
- Is the `:not(:defined)` block before any enhanced styles?
- Does it use only `var(--*)` tokens? (grep for hardcoded hex, px values in color/font properties)

### 2. Static HTML form (Item 2)
- Does `static.html` exist?
- Does the file contain only standard HTML elements? (grep for any `-` in tag names)
- Does the file have a comment explaining the upgrade relationship?

### 3. Spec completeness (Item 3)
- Does `README.md` exist?
- Does it contain all required sections: Purpose, Static HTML Form, Enhanced Form, Attributes and API, Failure Modes, Accessibility, CSS Tokens, Examples?
- Does the Failure Modes section have entries for: No JavaScript, No CSS, Upgrade Delay, Keyboard Only, Screen Reader, RTL?

### 4. CSS token usage (Item 4)
- Does `styles.css` use `var(--*)` for colors, spacing, and typography?
- Are there hardcoded hex colors or font families?
- Flag any found.

### 5. Logical properties (Item 5)
- Run grep for physical directional properties:
  `margin-left|margin-right|padding-left|padding-right|border-left|border-right|text-align: left|text-align: right`
- Flag any found unless they have an intentional-exception comment.

### 6. Upgrade marker (Item 7)
- Does `logic.js` call `this.setAttribute('data-upgraded', '')` in connectedCallback?
- Does `logic.js` call `this.removeAttribute('data-upgraded')` in disconnectedCallback?
- Does `disconnectedCallback()` exist?

## Output

Produce a checklist with pass/fail/warning for each check.
List all failures with file and line number where possible.
Suggest fixes for each failure.
