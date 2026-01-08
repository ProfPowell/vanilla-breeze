# Feedback Patterns

User communication and status indication.

## Components

- `alert` - Inline message
- `toast` - Temporary notification
- `banner` - Site-wide message
- `badge` - Status indicator
- `progress-bar` - Progress indicator
- `skeleton` - Loading placeholder
- `spinner` - Loading indicator
- `empty-state` - No content message
- `error-page` - Error display
- `tooltip` - Hover information
- `modal` - Dialog overlay
- `popover` - Contextual overlay
- `confirm` - Confirmation dialog

## Guidelines

- Status messages use appropriate ARIA roles (`alert`, `status`)
- Modals use native `<dialog>` element
- Popovers use `[popover]` attribute
- Loading states respect `prefers-reduced-motion`
