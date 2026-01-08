# Add Form Field

Generate an accessible form field using the `<form-field>` pattern with `<output>` for validation messages.

## Arguments
- `$ARGUMENTS` - Field type and name: `<type> <name>` (e.g., `email contact-email`, `text username`)

## Instructions

1. Parse the field type and name from arguments
2. Generate the appropriate `<form-field>` structure
3. Include proper accessibility attributes:
   - `id` on the input
   - `for` on the label matching the input id
   - `aria-describedby` linking to the output
   - `aria-live="polite"` on the output
4. Add appropriate HTML5 validation attributes
5. Include a sensible default validation message

## Output Template

```html
<form-field>
  <label for="field-id">Label Text</label>
  <input type="text"
         id="field-id"
         name="field-name"
         required
         aria-describedby="field-id-msg"/>
  <output id="field-id-msg"
          for="field-id"
          aria-live="polite">
    Validation message here
  </output>
</form-field>
```

## Field Type Templates

### Text Input
```html
<form-field>
  <label for="name">Name</label>
  <input type="text"
         id="name"
         name="name"
         required
         minlength="2"
         aria-describedby="name-msg"/>
  <output id="name-msg" for="name" aria-live="polite">
    At least 2 characters required
  </output>
</form-field>
```

### Email Input
```html
<form-field>
  <label for="email">Email</label>
  <input type="email"
         id="email"
         name="email"
         required
         aria-describedby="email-msg"/>
  <output id="email-msg" for="email" aria-live="polite">
    Please enter a valid email address
  </output>
</form-field>
```

### Textarea
```html
<form-field>
  <label for="message">Message</label>
  <textarea id="message"
            name="message"
            required
            minlength="10"
            aria-describedby="message-msg"></textarea>
  <output id="message-msg" for="message" aria-live="polite">
    At least 10 characters required
  </output>
</form-field>
```

### Select Dropdown
```html
<form-field>
  <label for="category">Category</label>
  <select id="category" name="category" required>
    <option value="" disabled selected>Select a category...</option>
    <option value="general">General Inquiry</option>
    <option value="support">Technical Support</option>
    <option value="sales">Sales</option>
  </select>
</form-field>
```

### Checkbox Group
```html
<form-field>
  <fieldset>
    <legend>Preferences</legend>
    <label>
      <input type="checkbox" name="prefs" value="newsletter"/>
      Subscribe to newsletter
    </label>
    <label>
      <input type="checkbox" name="prefs" value="updates"/>
      Receive product updates
    </label>
  </fieldset>
</form-field>
```

### Radio Group
```html
<form-field>
  <fieldset>
    <legend>Contact Method</legend>
    <label>
      <input type="radio" name="contact" value="email" required/>
      Email
    </label>
    <label>
      <input type="radio" name="contact" value="phone"/>
      Phone
    </label>
  </fieldset>
</form-field>
```

## CSS Support

The form-field element works with CSS-only validation:

```css
form-field:has(input:user-valid) output {
  color: var(--color-success);
}

form-field:has(input:user-invalid) output {
  color: var(--color-error);
}

form-field:has(input:required) label::after {
  content: " *";
  color: var(--color-error);
}
```

## Usage Examples

```
/add-form-field email contact-email
/add-form-field text full-name
/add-form-field textarea feedback
/add-form-field select country
```

## Notes

- The `<output>` element is semantically ideal for validation messages
- `aria-live="polite"` ensures screen readers announce changes
- Use `:user-valid` and `:user-invalid` for CSS-only validation styling
- The `for` attribute on `<output>` associates it with the input
