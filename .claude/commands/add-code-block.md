# Add Code Block

Insert a fenced code block with language identifier for syntax highlighting.

## Arguments

- `$ARGUMENTS` - Language identifier (e.g., `javascript`, `html`, `bash`)

## Instructions

1. Determine the language from arguments or prompt user:
   - If no argument provided, ask which language to use
   - Suggest common options: javascript, typescript, html, css, bash, json, yaml

2. Insert a fenced code block with the language:
   ```markdown
   ```javascript
   // Your code here
   ```
   ```

3. Optional: Include filename hint for context:
   ```markdown
   **`src/utils.js`**
   ```javascript
   export function formatDate(date) {
     return date.toISOString();
   }
   ```
   ```

4. For shell commands, use `bash` or `shell`:
   ```markdown
   ```bash
   npm install package-name
   ```
   ```

5. For terminal output (no highlighting needed):
   ```markdown
   ```text
   Output from command...
   ```
   ```

## Usage Examples

```
/add-code-block
/add-code-block javascript
/add-code-block html
/add-code-block bash
/add-code-block json
```

## Common Language Identifiers

| Language | Identifiers |
|----------|-------------|
| JavaScript | `javascript`, `js` |
| TypeScript | `typescript`, `ts` |
| HTML | `html` |
| CSS | `css` |
| JSON | `json` |
| YAML | `yaml`, `yml` |
| Bash/Shell | `bash`, `shell`, `sh` |
| Python | `python`, `py` |
| Markdown | `markdown`, `md` |
| Plain text | `text`, `plaintext` |
| Diff | `diff` |
| SQL | `sql` |
| Go | `go` |
| Rust | `rust` |
| Ruby | `ruby`, `rb` |

## Special Formats

### Diff (showing changes)
```markdown
```diff
- const old = "value";
+ const updated = "new value";
```
```

### Command with output
```markdown
```bash
$ npm run build
```

```text
Build completed successfully.
```
```

### Code with line numbers (some renderers)
```markdown
```javascript {1,3-5}
const a = 1;
const b = 2;
const c = 3;
const d = 4;
const e = 5;
```
```

## Accessibility Notes

- Always specify a language for syntax highlighting
- Screen readers benefit from properly structured code
- Use `text` for output to avoid confusing highlighting
- Include context before code blocks explaining what they do

## Notes

- Use backticks (```) not tildes (~~~) per project convention
- Always specify a language identifier
- For inline code, use single backticks: `code`
- Long code blocks should be in separate files, linked to
