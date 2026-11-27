# Sign In Patterns

Login form patterns with social authentication, two-factor input, and responsive layouts. Accessible and progressively enhanced.

- Documentation: https://vanilla-breeze.com/docs/patterns/forms/sign-in/
- Vanilla Breeze 0.7.4

## Overview

Sign-in forms are critical user touchpoints that require careful attention to usability, accessibility, and security. These patterns demonstrate best practices using Vanilla Breeze's data-layout attributes and custom elements.

Key features:
- `data-layout` attributes for layout without wrapper elements
- `<form-field>` with validation messages using `<output>`
- `<text-divider>` for separating authentication methods
- `<brand-mark>` for consistent logo display
- Progressive OTP enhancement with `data-type="otp"`
- Proper `autocomplete` attributes for password managers
- Password toggle (auto-enhanced by JS)

## Simple Card Form

A centered login form using `data-layout="cover"` on the body for vertical centering, with `<layout-card>` constraining the width. The form itself uses `data-layout="stack"` for vertical spacing.

sign-in-simple.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <form action="/auth/login" method="POST" data-layout="stack" data-layout-gap="l">
      <header data-layout="stack" data-layout-gap="s">
        <h1>Sign in</h1>
        <p>Welcome back! Please enter your details.</p>
      </header>

      <form-field>
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required
               autocomplete="email" placeholder="you@example.com"
               aria-describedby="email-error"/>
        <output id="email-error" class="error" for="email" aria-live="polite">
          Please enter a valid email address.
        </output>
      </form-field>

      <form-field>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required
               autocomplete="current-password" placeholder="Enter your password"
               aria-describedby="password-error"/>
        <output id="password-error" class="error" for="password" aria-live="polite">
          Password is required.
        </output>
      </form-field>

      <fieldset data-variant="minimal" data-layout="cluster" data-layout-justify="between" data-layout-align="center">
        <legend class="visually-hidden">Sign-in options</legend>
        <label><input type="checkbox" name="remember"/> Remember me</label>
        <a href="/auth/forgot-password">Forgot password?</a>
      </fieldset>

      <button type="submit">Sign in</button>

      <footer>
        <p>Don't have an account? <a href="/auth/register">Sign up</a></p>
      </footer>
    </form>
  </layout-card>
</body>
```

## Split Screen Layout

A two-column layout using `data-layout="split"` with a branded panel alongside the form. The `<brand-mark>` element provides consistent logo display. Collapses to single column on mobile.

## Welcome back

Sign in to access your dashboard and continue where you left off.

Don't have an account? Create one

Brand panel customization:

```css
.brand-panel {
  background: linear-gradient(135deg, var(--color-interactive) 0%, var(--color-interactive-hover) 100%);
  color: white;
}
.brand-panel h2,
.brand-panel p {
  color: inherit;
}
```

## With Social Login

Sign-in form with social authentication buttons above traditional email/password fields. Uses the `<text-divider>` element to visually separate authentication methods.

sign-in-social.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <layout-stack data-layout-gap="l">
      <header data-layout="stack" data-layout-gap="s">
        <h1>Sign in</h1>
        <p>Choose your preferred sign-in method.</p>
      </header>

      <!-- Social Login Buttons -->
      <layout-stack data-layout-gap="s">
        <button type="button" class="secondary">
          <icon-wc name="brand-google"></icon-wc>
          Continue with Google
        </button>
        <button type="button" class="secondary">
          <icon-wc name="brand-github"></icon-wc>
          Continue with GitHub
        </button>
      </layout-stack>

      <!-- Divider using text-divider element -->
      <text-divider>or continue with email</text-divider>

      <!-- Email/Password Form -->
      <form action="/auth/login" method="POST" data-layout="stack" data-layout-gap="l">
        <form-field>
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required
                 autocomplete="email" placeholder="you@example.com"
                 aria-describedby="email-error"/>
          <output id="email-error" class="error" for="email" aria-live="polite">
            Please enter a valid email address.
          </output>
        </form-field>

        <form-field>
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required
                 autocomplete="current-password" placeholder="Enter your password"
                 aria-describedby="password-error"/>
          <output id="password-error" class="error" for="password" aria-live="polite">
            Password is required.
          </output>
        </form-field>

        <fieldset data-variant="minimal" data-layout="cluster" data-layout-justify="between" data-layout-align="center">
          <legend class="visually-hidden">Sign-in options</legend>
          <label><input type="checkbox" name="remember"/> Remember me</label>
          <a href="/auth/forgot-password">Forgot password?</a>
        </fieldset>

        <button type="submit">Sign in</button>
      </form>

      <footer>
        <p>Don't have an account? <a href="/auth/register">Sign up</a></p>
      </footer>
    </layout-stack>
  </layout-card>
</body>
```

## Two-Factor Authentication

A verification code input using the progressive OTP enhancement. The input uses `data-type="otp"` and `data-length="6"` to enable multi-box display with JavaScript, while working as a standard text input without it.

The OTP input pattern provides graceful degradation:
- Without JS: Standard text input accepting 6 digits
- With JS: Multi-box UI with automatic focus advance, backspace navigation, and paste support

No custom JavaScript required - the `<form-field>` enhancement handles everything automatically when it detects `data-type="otp"`.

sign-in-2fa.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <form action="/auth/verify" method="POST" data-layout="stack" data-layout-gap="l">
      <header data-layout="stack" data-layout-gap="s">
        <h1>Two-factor authentication</h1>
        <p>Enter the 6-digit code from your authenticator app.</p>
      </header>

      <!-- OTP Input - Progressive Enhancement Pattern -->
      <form-field data-no-icon>
        <label for="code">Verification code</label>
        <input type="text" id="code" name="code"
               data-type="otp" data-length="6"
               inputmode="numeric" pattern="[0-9]{6}"
               autocomplete="one-time-code" required
               aria-describedby="code-msg"/>
        <output id="code-msg" for="code" aria-live="polite">
          Enter the 6-digit code from your authenticator app
        </output>
      </form-field>

      <button type="submit">Verify</button>

      <footer data-layout="stack" data-layout-gap="s">
        <p>Didn't receive a code? <a href="#resend">Resend</a></p>
        <a href="/auth/login">&larr; Back to sign in</a>
      </footer>
    </form>
  </layout-card>
</body>
```

## Form Field Features

All these patterns use `<form-field>` which provides:
- Validation icons: Checkmark/X appear after user interaction (disable with `data-no-icon`)
- Password toggle: Show/hide button added automatically to password fields
- Error messages: Use `<output class="error">` with `aria-live="polite"`
- Required indicator: Asterisk added automatically to required field labels

## Usage Notes

- Autocomplete: Use `autocomplete="email"` and `autocomplete="current-password"` for password manager support
- OTP autocomplete: Use `autocomplete="one-time-code"` for SMS/app code autofill
- Remember me: Include a checkbox for persistent sessions
- Password recovery: Always provide a visible "Forgot password?" link
- Social login: Use `<icon-wc>` with brand icons for recognizable buttons
- Accessibility: All inputs have labels, validation messages use `aria-live`, and focus states are visible

## Related

Sign up forms with password requirements

Form field element with validation

Horizontal divider with text

Brand/logo display element
