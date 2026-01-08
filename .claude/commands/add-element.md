# Add Custom Element

Add a new custom element to `elements.json` for use in HTML files.

## Arguments
- `$ARGUMENTS` - The element name (e.g., `card-component`, `user-profile`)

## Instructions

1. Read the current `elements.json` file
2. Add a new element entry with sensible defaults:
   - `flow: true` (block-level by default)
   - `phrasing: false` (not inline by default)
   - `permittedContent: ["@flow"]` (allows flow content inside)
3. Ask what attributes the element should have
4. Write the updated `elements.json`
5. Run `npx html-validate` on any HTML files to verify the configuration is valid

## Element Template

```json
{
  "element-name": {
    "flow": true,
    "phrasing": false,
    "permittedContent": ["@flow"],
    "attributes": {}
  }
}
```

## Common Patterns

- **Void element** (self-closing, like `<img/>`): Add `"void": true`
- **Inline element** (like `<span>`): Set `"phrasing": true`
- **Required attribute**: `"attr-name": { "required": true }`
- **Enum attribute**: `"attr-name": { "enum": ["value1", "value2"] }`
- **Boolean attribute**: `"attr-name": { "boolean": true }`

## Note

For quick prototyping, use the `x-*` pattern instead (e.g., `<x-temp-widget>`), which doesn't require definition.
