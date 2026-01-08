# Hello Test - Basic System Verification

A quick test to verify the fundamental features of the project template work correctly.

**Duration**: ~15 minutes

---

## Prerequisites

1. Create a new project from the template:
   ```bash
   gh repo create my-test-project --template ProfPowell/project-template --clone
   cd my-test-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start your AI assistant in the project:
   ```bash
   claude
   ```

---

## Test 1: HTML Skill Injection + Validation

**Goal**: Verify that creating an HTML file triggers the xhtml-author skill and HTML validators.

### Step 1.1: Create a simple HTML file

Prompt:
```
Create a file examples/hello.html with a basic HTML5 page that says "Hello World"
```

**Expected**:
- You should see `=== XHTML-AUTHOR SKILL ACTIVE ===` in the output
- The file should be created with XHTML-strict syntax (self-closing tags like `<meta/>`, `<br/>`)

### Step 1.2: Verify the generated HTML

The file should look similar to:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hello World</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
```

### Step 1.3: Trigger validation errors (intentional)

Prompt:
```
Edit examples/hello.html to add an image without an alt attribute: <img src="photo.jpg">
```

**Expected**:
- Validator should catch missing `alt` attribute
- Fix suggestion: "Add descriptive alt text to images"

### Step 1.4: Fix and verify

Prompt:
```
Fix the image to have proper alt text
```

**Expected**: Image updated to `<img src="photo.jpg" alt="Description here"/>`

**Pass Criteria**:
- [ ] Skill injection message appeared
- [ ] Validators caught the missing alt
- [ ] Fix suggestion was actionable

---

## Test 2: CSS Skill Injection + Validation

**Goal**: Verify CSS authoring skill and stylelint validation.

### Step 2.1: Create a CSS file

Prompt:
```
Create examples/hello.css with styles for the hello.html page
```

**Expected**:
- You should see `=== CSS-AUTHOR SKILL ACTIVE ===` in the output
- CSS should use modern patterns (custom properties, logical properties)

### Step 2.2: Trigger nesting depth warning (intentional)

Prompt:
```
Edit examples/hello.css to add deeply nested selectors like:
.container {
  .wrapper {
    .inner {
      .content {
        .text {
          color: red;
        }
      }
    }
  }
}
```

**Expected**:
- Stylelint should warn about nesting depth (max 3 levels)
- Fix suggestion: "Limit nesting to 3 levels or less"

### Step 2.3: Fix and verify

Prompt:
```
Refactor the CSS to reduce nesting depth
```

**Expected**: CSS refactored to use flatter selectors or BEM-style naming

**Pass Criteria**:
- [ ] Skill injection message appeared
- [ ] Nesting depth warning triggered
- [ ] Fix suggestion was helpful

---

## Test 3: JavaScript Skill Injection + Validation

**Goal**: Verify JavaScript authoring skill and ESLint validation.

### Step 3.1: Create a JavaScript file

Prompt:
```
Create examples/hello.js with a simple function that logs a greeting
```

**Expected**:
- You should see `=== JAVASCRIPT-AUTHOR SKILL ACTIVE ===` in the output
- Code should follow functional patterns (named exports, const/let)

### Step 3.2: Trigger ESLint warnings (intentional)

Prompt:
```
Edit examples/hello.js to use var instead of const and add console.log:
var message = "Hello";
console.log(message);
```

**Expected**:
- ESLint should warn about `var` usage
- ESLint should warn about `console.log` in production code
- Fix suggestions should appear

### Step 3.3: Fix and verify

Prompt:
```
Fix the JavaScript to follow the project conventions
```

**Expected**:
- `var` replaced with `const`
- `console.log` replaced with structured logging or removed

**Pass Criteria**:
- [ ] Skill injection message appeared
- [ ] ESLint caught var and console.log
- [ ] Fix suggestions were provided

---

## Test 4: Markdown Validation

**Goal**: Verify markdown-author skill and markdownlint/cspell validation.

### Step 4.1: Create a markdown file

Prompt:
```
Create examples/hello.md with documentation about the hello example
```

**Expected**:
- Markdown should have proper heading structure (H1 first)
- ATX-style headings (# not underlines)

### Step 4.2: Trigger structure warning (intentional)

Prompt:
```
Edit examples/hello.md to start with an H2 heading instead of H1:
## Documentation
This is the hello example.
```

**Expected**:
- Markdownlint should warn about first line not being H1
- Fix suggestion: "First line should be a top-level heading (# Heading)"

### Step 4.3: Trigger spelling check

Prompt:
```
Add a paragraph with a misspelled word: "This is an exampel of hello world"
```

**Expected**:
- cspell should catch "exampel" as unknown word
- Fix suggestion: "Fix spelling or add to project-words.txt"

### Step 4.4: Fix with /add-word command

Prompt:
```
/add-word exampel
```

Wait, that would add the misspelling! Instead:
```
Fix the spelling of "exampel" to "example"
```

**Pass Criteria**:
- [ ] Heading structure warning appeared
- [ ] Spelling error caught
- [ ] Fixes were straightforward

---

## Test 5: Basic Commands

**Goal**: Verify slash commands work correctly.

### Step 5.1: Add a custom word to dictionary

Prompt:
```
/add-word MyProjectName
```

**Expected**:
- Word added to `project-words.txt`
- Confirmation message shown

### Step 5.2: Run health check

Prompt:
```
/health
```

**Expected**:
- Dashboard output showing status of:
  - HTML validation
  - CSS validation
  - JavaScript linting
  - Spelling
  - And other checks
- Status indicators (✓, ⚠, ✗) for each category

**Pass Criteria**:
- [ ] /add-word created/updated project-words.txt
- [ ] /health showed dashboard with all categories
- [ ] Status indicators were meaningful

---

## Test 6: Config File Validation

**Goal**: Verify JSON/YAML validation hooks work.

### Step 6.1: Create a JSON config with errors

Prompt:
```
Create examples/config.json with this content (note the trailing comma):
{
  "name": "test",
  "version": "1.0.0",
}
```

**Expected**:
- Validator should catch trailing comma (invalid JSON)
- Fix suggestion: "Remove trailing commas"

### Step 6.2: Fix and verify

Prompt:
```
Fix the JSON syntax error
```

**Expected**: Trailing comma removed

**Pass Criteria**:
- [ ] JSON syntax error was caught
- [ ] Fix suggestion was clear

---

## Summary Checklist

| Test | Skill Injection | Validator | Fix Suggestions |
|------|-----------------|-----------|-----------------|
| HTML | [ ] | [ ] | [ ] |
| CSS | [ ] | [ ] | [ ] |
| JavaScript | [ ] | [ ] | [ ] |
| Markdown | [ ] | [ ] | [ ] |
| Commands | N/A | N/A | [ ] |
| JSON Config | N/A | [ ] | [ ] |

**Overall Result**: [ ] PASS / [ ] FAIL

---

## Troubleshooting

**Skill injection not appearing?**
- Check `.claude/settings.json` has PostToolUse hooks configured
- Verify `scripts/skill-injector.js` exists

**Validators not running?**
- Run `npm install` to ensure dependencies are installed
- Check that `html-validate`, `stylelint`, `eslint` are in devDependencies

**Commands not recognized?**
- Ensure `.claude/commands/` directory exists
- Check command file has valid markdown structure

---

## Next Steps

Once all tests pass, proceed to:
- **site-test.md** - Test static site development features
- **app-test.md** - Test backend development features
