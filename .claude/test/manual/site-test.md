# Site Test - Static Site Development

Test the frontend development workflow for building a static website.

**Duration**: ~30 minutes

**Prerequisites**: Complete `hello-test.md` first

---

## Test 1: Icon System Setup

**Goal**: Verify the Lucide icon system scaffolding works.

### Step 1.1: Scaffold the icon system

Prompt:
```
/scaffold-icons
```

**Expected**:
- `lucide-static` installed as devDependency
- Icons synced to `assets/icons/lucide/`
- `assets/icons/custom/` directory created
- `icon-wc` component copied to project
- `elements.json` updated with `icon-wc` definition

### Step 1.2: Verify icon count

```bash
ls assets/icons/lucide/*.svg | wc -l
```

**Expected**: ~1900+ icons

### Step 1.3: Use an icon in HTML

Prompt:
```
Create examples/icons.html that demonstrates using icon-wc with home, settings, and user icons
```

**Expected**:
```html
<script type="module" src="/assets/js/components/icon-wc/icon-wc.js"></script>
<icon-wc name="home"></icon-wc>
<icon-wc name="settings" size="lg"></icon-wc>
<icon-wc name="user" size="sm"></icon-wc>
```

**Pass Criteria**:
- [ ] Icons synced successfully
- [ ] icon-wc component available
- [ ] Icons render in HTML

---

## Test 2: Form Field Generation

**Goal**: Test accessible form field creation with the form-field custom element.

### Step 2.1: Generate an email field

Prompt:
```
/add-form-field email
```

**Expected**:
- `<form-field>` markup generated with:
  - `<label>` with `for` attribute
  - `<input type="email">` with matching `id`
  - Validation attributes (`required`, `pattern` if applicable)
  - Error message container

### Step 2.2: Generate a password field with validation

Prompt:
```
/add-form-field password with minimum 8 characters
```

**Expected**:
- Password field with `minlength="8"`
- Show/hide toggle pattern
- Strength indicator guidance

### Step 2.3: Create a complete form

Prompt:
```
Create examples/contact-form.html with a contact form using form-field elements for:
- Name (required)
- Email (required)
- Message (textarea, required)
- Submit button
```

**Expected**:
- All fields use `<form-field>` wrapper
- Labels properly associated
- Form has `action` and `method` attributes
- Validators should pass (WCAG2AA accessible)

### Step 2.4: Test accessibility validation

Prompt:
```
Edit examples/contact-form.html to remove the label from the email field
```

**Expected**:
- pa11y or html-validate should catch missing label
- Fix suggestion: "Add label with for attribute matching input id"

**Pass Criteria**:
- [ ] Form fields generated correctly
- [ ] Accessibility validators caught missing label
- [ ] Form structure follows patterns

---

## Test 3: Responsive Images

**Goal**: Test placeholder image generation and responsive image patterns.

### Step 3.1: Generate placeholder images

Prompt:
```
/placeholder-image hero 1920x600
```

**Expected**:
- SVG placeholder generated with:
  - Correct dimensions
  - Label text showing "1920x600"
  - Neutral background color

### Step 3.2: Generate a labeled placeholder

Prompt:
```
/placeholder-image product 400x400 "Product Photo"
```

**Expected**:
- SVG with custom label "Product Photo"
- Appropriate for product grid layouts

### Step 3.3: Convert to responsive picture element

Prompt:
```
/add-picture for a hero image that should be 1920px on desktop, 1200px on tablet, 800px on mobile
```

**Expected**:
```html
<picture>
  <source media="(min-width: 1200px)" srcset="hero-1920.webp 1920w"/>
  <source media="(min-width: 768px)" srcset="hero-1200.webp 1200w"/>
  <img src="hero-800.webp" alt="Hero image description" width="800" height="..."/>
</picture>
```

### Step 3.4: Test alt text validation

Prompt:
```
Create examples/gallery.html with a picture element missing alt text
```

**Expected**:
- Validator catches missing alt
- Fix suggestion: "Add descriptive alt text"

**Pass Criteria**:
- [ ] Placeholder images generated
- [ ] Picture element has correct structure
- [ ] Alt text validation works

---

## Test 4: CSS Design Tokens

**Goal**: Test CSS token system generation and @layer architecture.

### Step 4.1: Generate design tokens

Prompt:
```
/add-css-tokens
```

**Expected**:
- `tokens.css` or similar created with:
  - Color tokens (`--color-primary`, `--color-text`, etc.)
  - Spacing tokens (`--space-sm`, `--space-md`, etc.)
  - Typography tokens (`--font-size-base`, etc.)
  - Border/radius tokens

### Step 4.2: Create a component using tokens

Prompt:
```
Create examples/card.css that styles a card component using the design tokens
```

**Expected**:
- CSS uses `var(--token-name)` references
- Uses `@layer` for cascade control
- Modern CSS patterns (nesting, logical properties)

### Step 4.3: Test nesting depth limits

Prompt:
```
Edit examples/card.css to have 5 levels of nesting
```

**Expected**:
- Stylelint warns about nesting depth exceeding 3
- Fix suggestion: "Limit nesting to 3 levels or less"

### Step 4.4: Verify @layer structure

Check that CSS follows the layer order:
```css
@layer tokens, reset, base, components, utilities;
```

**Pass Criteria**:
- [ ] Tokens generated with semantic names
- [ ] Components use token references
- [ ] Nesting limits enforced
- [ ] @layer structure correct

---

## Test 5: Fake Content Generation

**Goal**: Test realistic content generation for prototyping.

### Step 5.1: Generate testimonials

Prompt:
```
/fake-testimonial 3
```

**Expected**:
- 3 realistic testimonials with:
  - Quote text (believable, varied)
  - Author name
  - Title/company
  - Optional avatar placeholder

### Step 5.2: Generate products

Prompt:
```
/fake-product 5
```

**Expected**:
- 5 product entries with:
  - Product name
  - Description
  - Price
  - Category
  - Image placeholder

### Step 5.3: Use generated content in HTML

Prompt:
```
Create examples/testimonials.html that displays the generated testimonials in a grid layout
```

**Expected**:
- Semantic HTML structure
- Accessible markup (blockquote, cite)
- Content looks realistic (not lorem ipsum)

### Step 5.4: Generate mixed content

Prompt:
```
/fake-content article with title, author, date, and 3 paragraphs
```

**Expected**:
- Article content that reads naturally
- Proper metadata structure
- Not generic placeholder text

**Pass Criteria**:
- [ ] Testimonials look realistic
- [ ] Products have complete data
- [ ] Content is NOT lorem ipsum
- [ ] HTML structure is semantic

---

## Test 6: Accessibility Audit

**Goal**: Verify accessibility validation catches real issues.

### Step 6.1: Create a page with accessibility issues

Prompt:
```
Create examples/bad-a11y.html with these intentional issues:
1. Low contrast text (light gray on white)
2. Image without alt text
3. Link with just "click here" text
4. Form input without label
5. Missing lang attribute on html
```

### Step 6.2: Run validation

The validators should automatically run and catch:

**Expected issues caught**:
- Color contrast ratio below 4.5:1
- Missing alt text on image
- Non-descriptive link text
- Missing label association
- Missing lang attribute

### Step 6.3: Fix each issue

Prompt:
```
Fix all accessibility issues in examples/bad-a11y.html
```

**Expected fixes**:
- Increased contrast or darker text color
- Descriptive alt text added
- Link text describes destination
- Label added with for attribute
- `lang="en"` added to html element

### Step 6.4: Verify all issues resolved

Run validation again - should pass with no errors.

**Pass Criteria**:
- [ ] Contrast issues caught
- [ ] Missing alt caught
- [ ] Link text issues caught
- [ ] Label issues caught
- [ ] Lang attribute issues caught
- [ ] All fixes verified

---

## Test 7: Semantic HTML Suggestions

**Goal**: Test that the semantic checker suggests proper HTML elements.

### Step 7.1: Create page with div-itis

Prompt:
```
Create examples/semantic-test.html with:
<div class="nav">Navigation links</div>
<div class="main">Main content</div>
<div class="footer">Footer content</div>
<div class="article">Article text</div>
<div class="sidebar">Sidebar content</div>
```

**Expected**:
- Semantic checker should suggest:
  - `<div class="nav">` → `<nav>`
  - `<div class="main">` → `<main>`
  - `<div class="footer">` → `<footer>`
  - `<div class="article">` → `<article>`
  - `<div class="sidebar">` → `<aside>`

### Step 7.2: Apply semantic fixes

Prompt:
```
Replace all the divs with their semantic equivalents
```

**Expected**:
- All suggestions applied
- Validators pass
- No more semantic warnings

### Step 7.3: Test time element suggestion

Prompt:
```
Edit the page to add "Published in 2024" as plain text
```

**Expected**:
- Semantic checker suggests wrapping year in `<time datetime="2024">`

**Pass Criteria**:
- [ ] Nav suggestion appeared
- [ ] Main suggestion appeared
- [ ] Footer suggestion appeared
- [ ] Article suggestion appeared
- [ ] Aside suggestion appeared
- [ ] Time suggestion appeared

---

## Test 8: Full Validation Suite

**Goal**: Run complete validation across all example files.

### Step 8.1: Run health check

Prompt:
```
/health
```

**Expected**:
- Dashboard showing all categories
- Most checks should pass (green ✓)
- Any warnings/errors clearly shown

### Step 8.2: Run full lint

```bash
npm run lint
```

**Expected**:
- HTML validation results
- CSS validation results
- JavaScript linting results
- Summary of issues

### Step 8.3: Fix any remaining issues

Prompt to fix any issues found in the lint run.

**Pass Criteria**:
- [ ] Health dashboard runs successfully
- [ ] All validators execute
- [ ] Issues are actionable
- [ ] Can achieve clean validation

---

## Summary Checklist

| Test | Commands Work | Validators | Patterns |
|------|---------------|------------|----------|
| Icons | [ ] | N/A | [ ] |
| Forms | [ ] | [ ] | [ ] |
| Images | [ ] | [ ] | [ ] |
| CSS Tokens | [ ] | [ ] | [ ] |
| Fake Content | [ ] | N/A | [ ] |
| Accessibility | N/A | [ ] | [ ] |
| Semantic HTML | N/A | [ ] | [ ] |
| Full Suite | [ ] | [ ] | N/A |

**Overall Result**: [ ] PASS / [ ] FAIL

---

## Troubleshooting

**Icons not syncing?**
- Check `lucide-static` is installed: `npm list lucide-static`
- Verify `scripts/sync-icons.js` exists

**Form validation not working?**
- Ensure `elements.json` has `form-field` definition
- Check `html-validate` configuration

**pa11y not catching issues?**
- Verify `pa11y` is installed: `npm list pa11y`
- Some checks require a running server

**Fake content generating lorem ipsum?**
- The skill should generate realistic content, not placeholders
- Check the fake-content command implementation

---

## Next Steps

Once all tests pass, proceed to:
- **app-test.md** - Test backend development features
