# Site Footer

## Description

Primary footer for site-wide information. Contains navigation links, contact info, legal notices, and optional newsletter signup. Responsive with stacked layout on mobile.

## Anatomy

- **footer**: Container element with semantic `<footer>` role
- **nav-sections**: Multiple navigation columns with grouped links
- **contact**: Contact information section
- **social**: Social media links
- **legal**: Copyright and legal links (privacy, terms)
- **newsletter**: Optional newsletter signup form

## States

| State | Description |
|-------|-------------|
| Default | Standard footer appearance |

## Variants

### Style

**Attribute:** `data-style`
**Values:** `minimal`, `default`, `extended`

## Baseline HTML

```html
<footer>
  <nav aria-label="Footer">
    <section>
      <h2>Company</h2>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/careers">Careers</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </section>

    <section>
      <h2>Resources</h2>
      <ul>
        <li><a href="/docs">Documentation</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/support">Support</a></li>
      </ul>
    </section>
  </nav>

  <div data-legal>
    <p>&copy; 2025 Company Name. All rights reserved.</p>
    <ul>
      <li><a href="/privacy">Privacy Policy</a></li>
      <li><a href="/terms">Terms of Service</a></li>
    </ul>
  </div>
</footer>
```

## Enhanced HTML

```html
<site-footer>
  <nav aria-label="Footer">
    <section>
      <h2>Company</h2>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/careers">Careers</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </section>

    <section>
      <h2>Resources</h2>
      <ul>
        <li><a href="/docs">Documentation</a></li>
        <li><a href="/blog">Blog</a></li>
        <li><a href="/support">Support</a></li>
      </ul>
    </section>

    <section>
      <h2>Legal</h2>
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/cookies">Cookie Policy</a></li>
      </ul>
    </section>
  </nav>

  <div data-social>
    <a href="https://twitter.com/company" aria-label="Twitter">
      <icon-wc name="twitter" />
    </a>
    <a href="https://github.com/company" aria-label="GitHub">
      <icon-wc name="github" />
    </a>
    <a href="https://linkedin.com/company/company" aria-label="LinkedIn">
      <icon-wc name="linkedin" />
    </a>
  </div>

  <form data-newsletter action="/newsletter" method="post">
    <label for="footer-email">Subscribe to our newsletter</label>
    <div>
      <input type="email" id="footer-email" name="email" placeholder="you@example.com" required />
      <button type="submit">Subscribe</button>
    </div>
  </form>

  <div data-legal>
    <p>&copy; 2025 Company Name. All rights reserved.</p>
  </div>
</site-footer>
```

## CSS

```css
@layer components {
  site-footer {
    display: grid;
    gap: var(--size-xl);
    padding: var(--size-xl) var(--size-l);
    background: var(--surface-alt);
    border-block-start: 1px solid var(--border);

    /* Navigation sections */
    & nav {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: var(--size-xl);
    }

    & nav section h2 {
      font-size: var(--text-sm);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-block-end: var(--size-m);
    }

    & nav ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--size-xs);
    }

    & nav a {
      color: var(--text);
      text-decoration: none;
      transition: color var(--transition-fast);

      &:hover {
        color: var(--primary);
      }
    }

    /* Social links */
    & [data-social] {
      display: flex;
      gap: var(--size-m);
      justify-content: center;
    }

    & [data-social] a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-full);
      background: var(--overlay-light);
      color: var(--text);
      transition: background var(--transition-fast), color var(--transition-fast);

      &:hover {
        background: var(--primary);
        color: var(--primary-contrast);
      }
    }

    /* Newsletter */
    & [data-newsletter] {
      max-width: 24rem;
      margin-inline: auto;
      text-align: center;
    }

    & [data-newsletter] label {
      display: block;
      margin-block-end: var(--size-xs);
      font-weight: var(--font-weight-medium);
    }

    & [data-newsletter] > div {
      display: flex;
      gap: var(--size-xs);
    }

    & [data-newsletter] input {
      flex: 1;
      padding: var(--size-xs) var(--size-m);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }

    & [data-newsletter] button {
      padding: var(--size-xs) var(--size-l);
      background: var(--primary);
      color: var(--primary-contrast);
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: var(--primary-hover);
      }
    }

    /* Legal section */
    & [data-legal] {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: var(--size-m);
      padding-block-start: var(--size-l);
      border-block-start: 1px solid var(--border);
      font-size: var(--text-sm);
      color: var(--text-muted);
    }

    & [data-legal] ul {
      display: flex;
      gap: var(--size-m);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    & [data-legal] a {
      color: var(--text-muted);
      text-decoration: none;

      &:hover {
        color: var(--text);
        text-decoration: underline;
      }
    }

    /* Style variants */
    &[data-style="minimal"] {
      padding: var(--size-l);

      & nav {
        display: none;
      }

      & [data-newsletter] {
        display: none;
      }
    }

    &[data-style="extended"] {
      padding: var(--size-2xl) var(--size-xl);
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    site-footer {
      & nav {
        grid-template-columns: repeat(2, 1fr);
      }

      & [data-newsletter] > div {
        flex-direction: column;
      }

      & [data-legal] {
        flex-direction: column;
        text-align: center;
      }
    }
  }

  @media (max-width: 480px) {
    site-footer nav {
      grid-template-columns: 1fr;
    }
  }
}
```

## Accessibility

- **Landmark**: Uses `<footer>` element for contentinfo landmark
- **Navigation Label**: `aria-label="Footer"` on nav element
- **Social Links**: Each social link has descriptive `aria-label`
- **Form Labels**: Newsletter form has associated label
- **Keyboard**: All links and form elements focusable

## Examples

### Basic Footer

```html
<site-footer>
  <nav aria-label="Footer">
    <section>
      <h2>Links</h2>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </section>
  </nav>
  <div data-legal>
    <p>&copy; 2025 Company</p>
  </div>
</site-footer>
```

### Full Footer with Newsletter

```html
<site-footer>
  <nav aria-label="Footer">
    <!-- Multiple sections -->
  </nav>
  <div data-social>
    <!-- Social links -->
  </div>
  <form data-newsletter action="/newsletter" method="post">
    <!-- Newsletter form -->
  </form>
  <div data-legal>
    <p>&copy; 2025 Company. All rights reserved.</p>
    <ul>
      <li><a href="/privacy">Privacy</a></li>
      <li><a href="/terms">Terms</a></li>
    </ul>
  </div>
</site-footer>
```

### Minimal Footer

```html
<site-footer data-style="minimal">
  <div data-social>
    <!-- Social links only -->
  </div>
  <div data-legal>
    <p>&copy; 2025 Company</p>
  </div>
</site-footer>
```

## Related Patterns

- [site-header](./site-header.md)
- [nav-menu](./nav-menu.md)
- [newsletter-form](../form/newsletter-form.md)
