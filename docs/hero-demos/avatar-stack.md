# Avatar Stack Magic

**Tagline:** "Overlapping avatars in one attribute."

## The Wow Factor

The `data-overlap` attribute on `layout-cluster` creates professional overlapping avatar groups (like GitHub/Slack) with pure CSS - no JavaScript positioning needed. Stack multiple user avatars with automatic spacing and elegant white borders between them, perfect for showing team members or contributors.

## How It Works

This CSS technique uses a clever combination of flexbox properties:

- **Flex Direction**: `flex-direction: row-reverse` with `justify-content: flex-end` reverses the layout order while maintaining proper alignment
- **Negative Margins**: Create the overlap effect by pulling avatars into each other's space
- **Box Shadow**: A `box-shadow` creates the white ring between avatars for visual separation
- **Z-Index**: Handled automatically by DOM order, so the last avatar appears on top

## Usage

```html
<layout-cluster data-overlap="s">
  <user-avatar data-ring>
    <img src="avatar1.jpg" alt="User 1"/>
  </user-avatar>
  <user-avatar data-ring>
    <img src="avatar2.jpg" alt="User 2"/>
  </user-avatar>
  <user-avatar data-ring>
    <span data-fallback>+5</span>
  </user-avatar>
</layout-cluster>
```

## Overlap Sizes

| Value | Overlap Amount |
|-------|---------------|
| xs | -0.25rem |
| s | -0.5rem (default) |
| m | -0.75rem |
| l | -1rem |

## Key Attributes

- `data-overlap`: Enable overlap mode on layout-cluster
- `data-ring`: Add white border ring to user-avatar

## See Also

[View Demo](./avatar-stack.html)
