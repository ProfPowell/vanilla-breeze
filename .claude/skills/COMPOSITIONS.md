# Skill Compositions

Common multi-skill patterns for complex features. When building these features, invoke ALL listed skills.

## Frontend Patterns

### Theme Toggle (Dark/Light Mode)

| Skill | Purpose |
|-------|---------|
| **css-author** | Design tokens, color schemes, @layer organization |
| **javascript-author** | State management, localStorage persistence |
| **data-storage** | Persistent preference storage patterns |
| **icons** | Sun/moon toggle icons with `<icon-wc>` |
| **progressive-enhancement** | CSS-only fallback, prefers-color-scheme |
| **accessibility-checker** | Contrast ratios for both themes |

**Key files to create:**
- `_tokens.css` - Light and dark token values
- `theme-switcher.js` - Web Component for toggle
- Theme icons: sun, moon, monitor (system)

---

### Contact Form

| Skill | Purpose |
|-------|---------|
| **xhtml-author** | Semantic form structure |
| **forms** | `<form-field>` pattern, validation |
| **accessibility-checker** | Labels, error messages, focus management |
| **javascript-author** | Optional: async submission, validation |

**Key elements:**
- `<form-field>` for each input
- `<output>` for validation messages
- `autocomplete` attributes
- `required` and `pattern` validation

---

### Product Card Grid

| Skill | Purpose |
|-------|---------|
| **xhtml-author** | `<article>` for each card, semantic structure |
| **css-author** | Grid layout, container queries |
| **responsive-images** | `<picture>` with srcset for product images |
| **icons** | Rating stars, cart icon, wishlist heart |
| **accessibility-checker** | Image alt text, interactive elements |

**Key patterns:**
- Use `<product-card>` custom element
- Container queries for responsive cards
- `data-*` attributes for state (in-cart, wishlist)

---

### Navigation Menu

| Skill | Purpose |
|-------|---------|
| **xhtml-author** | `<nav>` with proper structure |
| **css-author** | Responsive layout, hover states |
| **icons** | Menu toggle, dropdown arrows |
| **accessibility-checker** | Keyboard navigation, aria-expanded |
| **progressive-enhancement** | CSS-only mobile menu if possible |

**Key elements:**
- `<nav aria-label="Main">` wrapper
- `<icon-wc name="menu">` for mobile toggle
- `aria-current="page"` for current page

---

### Image Gallery

| Skill | Purpose |
|-------|---------|
| **xhtml-author** | `<figure>` and `<figcaption>` structure |
| **responsive-images** | Multiple sizes, modern formats |
| **css-author** | Grid layout, lightbox styles |
| **animation-motion** | Transitions, reduced-motion support |
| **accessibility-checker** | Alt text, keyboard navigation |

---

## TDD Patterns

### New Service with TDD

| Skill | Purpose |
|-------|---------|
| **tdd** | Ensures test-first workflow |
| **backend-testing** | Service testing patterns |
| **nodejs-backend** | Service implementation patterns |

**Workflow:**
1. TDD skill reminds to write test first
2. Create `test/services/my-service.test.js` with failing test
3. backend-testing skill provides test patterns
4. Run test (should fail - RED phase)
5. Create `src/services/my-service.js` implementation
6. Run test until green (GREEN phase)
7. Refactor while tests pass (REFACTOR phase)

---

### New Component with TDD

| Skill | Purpose |
|-------|---------|
| **tdd** | Ensures test-first workflow |
| **unit-testing** | Component test patterns |
| **javascript-author** | Component implementation |
| **custom-elements** | Web Component patterns |

**Workflow:**
1. Create `test/components/my-component.test.js`
2. Write test for expected behavior
3. Run test (should fail)
4. Create `src/components/my-component.js`
5. Implement until tests pass
6. Refactor while tests pass

---

### CLI Script with TDD

| Skill | Purpose |
|-------|---------|
| **tdd** | Ensures test-first workflow |
| **unit-testing** | CLI testing patterns with execSync |

**Workflow:**
1. Create `.claude/test/validators/my-script.test.js`
2. Write test using execSync pattern
3. Create `.claude/scripts/my-script.js`
4. Implement until tests pass

---

## Backend Patterns

### API Integration (Frontend)

| Skill | Purpose |
|-------|---------|
| **javascript-author** | Fetch wrapper, async patterns |
| **api-client** | Retry logic, timeout handling, caching |
| **error-handling** | Network error recovery, user feedback |
| **state-management** | Loading states, optimistic updates |

**Key patterns:**
- Wrapper function with retry logic
- Loading/error/success states
- AbortController for cancellation

---

### User Authentication

| Skill | Purpose |
|-------|---------|
| **authentication** | JWT/session patterns, token refresh |
| **security** | CSRF protection, secure headers |
| **forms** | Login/register forms |
| **javascript-author** | Auth state management |
| **api-client** | Token attachment, refresh flow |

**Key files:**
- `auth-service.js` - Token management
- `login-form.html` - Accessible login form
- Auth middleware for protected routes

---

### Database CRUD Operations

| Skill | Purpose |
|-------|---------|
| **database** | Schema design, migrations |
| **nodejs-backend** | Express/Fastify route handlers |
| **rest-api** | RESTful patterns, status codes |
| **backend-testing** | Integration tests |

**Key patterns:**
- Parameterized queries (never string interpolation)
- Proper error responses
- Pagination for list endpoints

---

## Full-Stack Patterns

### Blog/Article System

| Skill | Purpose |
|-------|---------|
| **xhtml-author** | Article semantic structure |
| **metadata** | Open Graph, structured data |
| **responsive-images** | Hero images, inline images |
| **css-author** | Typography, reading experience |
| **database** | Articles table, tags |
| **rest-api** | Article endpoints |

---

### E-commerce Product Page

| Skill | Purpose |
|-------|---------|
| **xhtml-author** | Product structure, schema.org |
| **forms** | Add-to-cart form, quantity |
| **responsive-images** | Product gallery |
| **icons** | Cart, wishlist, share icons |
| **state-management** | Cart state |
| **api-client** | Add-to-cart API calls |

---

## Usage

Reference this file from `pre-flight-check` when starting a complex feature:

```
/skill pre-flight-check
# Review COMPOSITIONS.md for your feature type
# Invoke ALL required skills before starting
```

When you identify a composition pattern:
1. Read this file
2. Invoke each skill listed
3. Follow patterns from each skill
4. Validate against each skill's checklist
