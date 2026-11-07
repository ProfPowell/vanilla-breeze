# Add Callout Block

Insert a callout/admonition using Vanilla Breeze's one callout primitive, `data-callout` (docs: `/docs/attributes/data-callout/`).

## Arguments

- `$ARGUMENTS` - Callout kind, optionally followed by a shape: `note` (default), `info`, `tip`, `warning`, `danger`; shapes `speech`, `notched` (e.g. `warning notched`)

## Instructions

1. Determine the kind (and optional shape) from the arguments:
   - `note` - General information (default; bare `data-callout` is the same)
   - `info` - Background context
   - `tip` - Shortcuts and recommendations (success colour)
   - `warning` - Things that can go wrong
   - `danger` - Data loss, security, anything irreversible
   - Shapes: `speech` (rounded box with a tail), `notched` (bevelled corner)

2. **In HTML** (doc pages, demos), insert an `<aside>` with `role="note"` and a visible title. The title states the meaning in words, so the callout never relies on colour alone:

   ```html
   <aside data-callout="warning" role="note">
     <p data-callout-title><strong>Warning</strong></p>
     <p>Deleting a project also deletes its deploy history.</p>
   </aside>
   ```

   With a shape, add it as a second token:

   ```html
   <aside data-callout="info notched" role="note">
     <p data-callout-title><strong>Configuration</strong></p>
     <p>The bevel size follows --shape-bevel.</p>
   </aside>
   ```

   Use `<blockquote data-callout="speech">` for a quoted speech callout.

3. **In markdown rendered by `<markdown-viewer>`**, use a `:::kind [title]` block. It renders the same `<aside data-callout="kind" role="note">` markup:

   ```markdown
   :::warning Deploy history
   Deleting a project also deletes its deploy history.
   :::
   ```

   (Plain GitHub markdown has no callouts; there, fall back to `> **Warning:** …`.)

## Usage Examples

```
/add-callout
/add-callout tip
/add-callout warning notched
/add-callout danger
```

## Rules

- No `<div>`: use `<aside>` (or `<blockquote>` for speech).
- Do not use the removed `aside.callout[data-kind]` / `.callout-title` markup.
- Themes restyle callouts through `--callout-bg` / `--callout-accent`; don't hard-code colours.
- Keep callouts short and rare; too many reduce their effect.
