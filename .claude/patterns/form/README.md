# Form Patterns

Interactive input components for data collection.

## Components

- `text-field` - Single-line input with label, validation
- `text-area` - Multi-line input
- `select-field` - Dropdown selection
- `checkbox-group` - Multiple choice
- `radio-group` - Single choice
- `toggle-switch` - On/off toggle
- `date-picker` - Date selection
- `file-upload` - File selection
- `range-slider` - Value range
- `search-field` - Search input

## Composite Forms

- `login-form` - Email/password + remember me + forgot link
- `signup-form` - Registration with validation
- `contact-form` - Name, email, message, submit
- `checkout-form` - Multi-step payment flow
- `settings-form` - Grouped preference sections
- `filter-form` - Inline filtering controls

## Guidelines

- All form patterns use `<form-field>` wrapper for consistent styling
- Labels are always visible (no placeholder-only inputs)
- Validation uses `:user-valid` / `:user-invalid` for post-interaction feedback
- Error messages use `<output>` element
