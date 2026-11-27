# Registration Patterns

Sign up form patterns with multi-step flows, social authentication, and password requirements. Accessible and progressively enhanced.

- Documentation: https://vanilla-breeze.com/docs/patterns/forms/registration/
- Vanilla Breeze 0.7.4

## Overview

Registration forms are the gateway to your application. These patterns demonstrate best practices for collecting user information while maintaining a smooth, accessible experience using Vanilla Breeze's data-layout attributes and custom elements.

Key features:
- `data-layout` attributes for layout without wrapper elements
- `<form-field>` with validation messages using `<output>`
- `<text-divider>` for separating authentication methods
- Password confirmation with matching validation
- Terms of service checkbox with required validation
- Proper `autocomplete` attributes for form autofill
- Password toggle (auto-enhanced by JS)

## Simple Registration

A basic signup form using `data-layout="cover"` on the body for vertical centering, with `<layout-card>` constraining the width. Includes name, email, password with confirmation, and terms acceptance.

registration-simple.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <form action="/auth/register" method="POST" data-layout="stack" data-layout-gap="l">
      <header data-layout="stack" data-layout-gap="s">
        <h1>Create account</h1>
        <p>Sign up to get started with your account.</p>
      </header>

      <form-field>
        <label for="name">Full name</label>
        <input type="text" id="name" name="name" required
               autocomplete="name" placeholder="John Doe"
               aria-describedby="name-error"/>
        <output id="name-error" class="error" for="name" aria-live="polite">
          Please enter your name.
        </output>
      </form-field>

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
               autocomplete="new-password" placeholder="Create a password"
               minlength="8"
               aria-describedby="password-hint"/>
        <output id="password-hint" for="password" aria-live="polite">
          Must be at least 8 characters.
        </output>
      </form-field>

      <form-field>
        <label for="password-confirm">Confirm password</label>
        <input type="password" id="password-confirm" name="password_confirm" required
               autocomplete="new-password" placeholder="Confirm your password"
               aria-describedby="password-confirm-error"/>
        <output id="password-confirm-error" class="error" for="password-confirm" aria-live="polite">
          Passwords must match.
        </output>
      </form-field>

      <fieldset data-variant="minimal">
        <legend class="visually-hidden">Terms</legend>
        <label>
          <input type="checkbox" name="terms" required/>
          I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
        </label>
      </fieldset>

      <button type="submit">Create account</button>

      <footer>
        <p>Already have an account? <a href="/auth/login">Sign in</a></p>
      </footer>
    </form>
  </layout-card>
</body>
```

## Multi-Step Registration

A wizard-style registration flow with a visual step indicator. Uses the `nav.steps` CSS pattern for the progress indicator and breaks the form into manageable sections. Great for collecting more detailed information without overwhelming users.

registration-multi-step.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <layout-stack data-layout-gap="l">
      <header data-layout="stack" data-layout-gap="s">
        <h1>Create account</h1>
        <p>Step 1 of 3</p>
      </header>

      <!-- Step Indicator — uses nav.steps from VB core -->
      <nav class="steps" aria-label="Registration progress">
        <ol>
          <li aria-current="step">Account</li>
          <li>Profile</li>
          <li>Preferences</li>
        </ol>
      </nav>

      <!-- Step 1: Account Info -->
      <form action="/auth/register/step1" method="POST" data-layout="stack" data-layout-gap="l">
        <form-field>
          <label for="email">Email address</label>
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
                 autocomplete="new-password" placeholder="Create a password"
                 minlength="8"
                 aria-describedby="password-hint"/>
          <output id="password-hint" for="password" aria-live="polite">
            Must be at least 8 characters.
          </output>
        </form-field>

        <form-field>
          <label for="password-confirm">Confirm password</label>
          <input type="password" id="password-confirm" name="password_confirm" required
                 autocomplete="new-password" placeholder="Confirm your password"
                 aria-describedby="password-confirm-error"/>
          <output id="password-confirm-error" class="error" for="password-confirm" aria-live="polite">
            Passwords must match.
          </output>
        </form-field>

        <layout-cluster data-layout-justify="between" data-layout-gap="m">
          <button type="button" class="secondary" disabled>Back</button>
          <button type="submit">Next</button>
        </layout-cluster>
      </form>

      <footer>
        <p>Already have an account? <a href="/auth/login">Sign in</a></p>
      </footer>
    </layout-stack>
  </layout-card>
</body>
```

## With Social Signup

Registration form with social authentication buttons above traditional email/password fields. Uses the `<text-divider>` element to visually separate authentication methods. Reduces friction for users who prefer OAuth signup.

registration-social.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <layout-stack data-layout-gap="l">
      <header data-layout="stack" data-layout-gap="s">
        <h1>Create account</h1>
        <p>Choose your preferred sign-up method.</p>
      </header>

      <!-- Social Signup Buttons -->
      <layout-stack data-layout-gap="s">
        <button type="button" class="secondary">
          <icon-wc name="brand-google"></icon-wc>
          Sign up with Google
        </button>
        <button type="button" class="secondary">
          <icon-wc name="brand-github"></icon-wc>
          Sign up with GitHub
        </button>
      </layout-stack>

      <!-- Divider -->
      <text-divider>or continue with email</text-divider>

      <!-- Email/Password Form -->
      <form action="/auth/register" method="POST" data-layout="stack" data-layout-gap="l">
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
                 autocomplete="new-password" placeholder="Create a password"
                 minlength="8"
                 aria-describedby="password-hint"/>
          <output id="password-hint" for="password" aria-live="polite">
            Must be at least 8 characters.
          </output>
        </form-field>

        <fieldset data-variant="minimal">
          <legend class="visually-hidden">Terms</legend>
          <label>
            <input type="checkbox" name="terms" required/>
            I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
          </label>
        </fieldset>

        <button type="submit">Create account</button>
      </form>

      <footer>
        <p>Already have an account? <a href="/auth/login">Sign in</a></p>
      </footer>
    </layout-stack>
  </layout-card>
</body>
```

## Form Field Features

All these patterns use `<form-field>` which provides:
- Validation icons: Checkmark/X appear after user interaction (disable with `data-no-icon`)
- Password toggle: Show/hide button added automatically to password fields
- Error messages: Use `<output class="error">` with `aria-live="polite"`
- Hint messages: Use `<output>` without `class="error"` for helpful hints
- Required indicator: Asterisk added automatically to required field labels

## Usage Notes

- Use `minlength="8"` (or your minimum) for basic validation
- Provide clear requirements in a hint message using `<output>`
- Consider showing password strength indicator for better UX
- Always include password confirmation for new accounts
- Make the terms checkbox `required` to prevent form submission
- Link to both Terms of Service and Privacy Policy
- Use clear language about what the user is agreeing to
- `autocomplete="name"` for full name fields
- `autocomplete="email"` for email address
- `autocomplete="new-password"` for password creation (not `current-password`)
- These help password managers and browsers autofill correctly
- All inputs have associated labels
- Validation messages use `aria-live="polite"` for screen reader announcements
- Error messages are linked to inputs via `aria-describedby`
- Step indicators include `aria-current="step"` for the active step

## Related

Login forms with social auth and 2FA

Form field element with validation

Horizontal divider with text

Card container element
