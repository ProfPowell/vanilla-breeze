# Contact Form Patterns

Contact form patterns with split layouts, contact information sidebars, and map integration. Accessible and responsive designs for customer communication.

- Documentation: https://vanilla-breeze.com/docs/patterns/forms/contact/
- Vanilla Breeze 0.7.4

## Overview

Contact forms are essential for user communication. These patterns demonstrate various layouts from simple centered forms to complex split designs with contact information and map placeholders.

Key features:
- `<form-field>` for consistent input styling and validation
- `<textarea>` with appropriate `rows` attribute for message input
- `<layout-sidebar>` for split layouts with contact information
- `<layout-card>` as the form surface
- `<address>` wrapping a `<dl data-variant="horizontal">` for contact details and opening hours
- `<icon-wc>` for visual contact method indicators
- Proper `autocomplete` attributes for form autofill
- Accessible validation with `<output>` and `aria-live`

## Simple Contact Form

A centered contact form using `data-layout="cover"` for vertical centering. Includes name, email, and message fields with validation support.

contact-simple.html:

```html
<body data-layout="cover" data-layout-min="xl" data-layout-padding="l">
  <layout-card data-max="narrow" data-padding="l" data-layout-principal>
    <form action="/contact" method="POST" data-layout="stack" data-layout-gap="l">
      <header data-layout="stack" data-layout-gap="s">
        <h1>Get in touch</h1>
        <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </header>

      <form-field>
        <label for="name">Name</label>
        <input type="text" id="name" name="name" required
               autocomplete="name" placeholder="Your name"
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
        <label for="message">Message</label>
        <textarea id="message" name="message" rows="5" required
                  placeholder="How can we help you?"
                  aria-describedby="message-error"></textarea>
        <output id="message-error" class="error" for="message" aria-live="polite">
          Please enter a message.
        </output>
      </form-field>

      <button type="submit">Send message</button>
    </form>
  </layout-card>
</body>
```

## Split Layout with Contact Info

A two-column layout using `<layout-sidebar>` with the form in a `<layout-card>` as the main content and contact information in the sidebar. Address, phone and email sit in an `<address>` as a horizontal description list; business hours use the same list. The list keeps label and value side by side even in the narrow sidebar, and only stacks below 16rem.

Fill out the form and our team will get back to you within 24 hours.

## Contact information

Reach out to us through any of these channels.

## Business hours

Contact information styling:

```css
body {
  margin: 0;
  background: var(--color-surface-raised);
}
/* Contact info sidebar: bespoke look for the address and hours lists */
.contact-info h2 {
  font-size: var(--font-size-l);
}
.contact-info :is(p, dd) {
  color: var(--color-text-muted);
}
.contact-info address {
  font-style: normal;
}
.contact-info dt {
  font-weight: var(--font-weight-medium);
}
.contact-info dd {
  font-size: var(--font-size-s);
}
.contact-info dt icon-wc {
  color: var(--color-interactive);
}
.contact-info dd a {
  color: inherit;
  text-decoration: none;
}
.contact-info dd a:hover {
  color: var(--color-interactive);
}
```

## With Map

Contact form with a `<geo-map>` component for displaying your location. Uses a centered header above a split layout with free OpenStreetMap tiles.

Have questions? We're here to help. Send us a message or visit our office.

## Send a message

Map styling:

```css
body {
  margin: 0;
}
aside geo-map {
  --geo-map-height: 100%;
  min-height: 400px;
}
```

## Configuration

Key configuration options for contact forms:

## Usage Notes

- Required fields: Mark essential fields with `required` attribute; `<form-field>` adds visual asterisk automatically
- Validation messages: Use `<output class="error">` with `aria-describedby` linking to the input
- Success states: Consider showing a success message or redirecting after submission
- Spam prevention: Add honeypot fields or CAPTCHA for production forms
- Map integration: The `<geo-map>` component uses free OpenStreetMap tiles &mdash; no API key needed
- Phone links: Use `tel:` protocol for clickable phone numbers on mobile
- Email links: Use `mailto:` protocol for email addresses
- Accessibility: All form fields have labels, icons have appropriate aria attributes

## Related

Login form patterns with validation

Form field element with validation

Sidebar layout for split designs

Icon component for contact indicators

Map component for location display
