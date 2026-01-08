# Add Callout Block

Insert a callout/admonition block for highlighting important information.

## Arguments

- `$ARGUMENTS` - Callout type: `note`, `tip`, `warning`, `danger`, `info`

## Instructions

1. Determine the callout type from arguments:
   - `note` - General information (default)
   - `tip` - Helpful suggestions
   - `warning` - Caution, potential issues
   - `danger` - Critical warnings, breaking changes
   - `info` - Informational context

2. Insert the callout at the current location using blockquote syntax:

   **Note:**
   ```markdown
   > **Note:** Your message here.
   ```

   **Tip:**
   ```markdown
   > **Tip:** Your helpful suggestion here.
   ```

   **Warning:**
   ```markdown
   > **Warning:** Your caution message here.
   ```

   **Danger:**
   ```markdown
   > **Danger:** Your critical warning here.
   ```

   **Info:**
   ```markdown
   > **Info:** Your informational content here.
   ```

3. For multi-line callouts:
   ```markdown
   > **Warning:** This is a longer callout.
   >
   > It can span multiple paragraphs.
   >
   > - And include lists
   > - Or other formatting
   ```

4. With emoji (optional, for visual distinction):
   ```markdown
   > 📝 **Note:** Information to highlight.

   > 💡 **Tip:** Helpful suggestion.

   > ⚠️ **Warning:** Proceed with caution.

   > 🚨 **Danger:** Critical warning.

   > ℹ️ **Info:** Additional context.
   ```

## Usage Examples

```
/add-callout
/add-callout note
/add-callout warning
/add-callout tip
/add-callout danger
```

## Callout Types Reference

| Type | Use Case | Emoji |
|------|----------|-------|
| `note` | General highlights, reminders | 📝 |
| `tip` | Best practices, shortcuts | 💡 |
| `warning` | Potential issues, deprecations | ⚠️ |
| `danger` | Breaking changes, security | 🚨 |
| `info` | Background context, explanations | ℹ️ |

## Accessibility Notes

- The bold label (Note:, Warning:, etc.) provides semantic meaning
- Screen readers announce the blockquote structure
- Emoji are decorative and have text alternatives in the label
- Avoid using color alone to convey meaning

## GFM Compatibility

This syntax works in:
- GitHub README files
- GitHub issues and pull requests
- Most markdown processors
- Documentation systems (Docusaurus, VuePress, etc.)

## Notes

- Keep callouts concise - use for important highlights only
- Too many callouts reduce their effectiveness
- Consider using `<details>` for longer supplementary content
- The emoji are optional - omit for a cleaner look
