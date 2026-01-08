# Generate Table of Contents

Generate a table of contents from markdown headings and insert it into the document.

## Arguments

- `$ARGUMENTS` - Optional: file path, max depth (e.g., `README.md 3` for H1-H3 only)

## Instructions

1. Determine the target file:
   - If a file path is provided in arguments, use that
   - Otherwise, ask the user which markdown file to process

2. Read the markdown file and extract all headings:
   - Find lines starting with `#` (H1), `##` (H2), etc.
   - Skip headings inside code blocks (between ``` markers)
   - Skip any existing "Table of Contents" or "Contents" heading

3. Generate anchor links for each heading:
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters except hyphens
   - Example: `## Getting Started` → `#getting-started`

4. Build the TOC with proper nesting:
   - Use 2-space indentation per level
   - Format: `- [Heading Text](#anchor-link)`
   - Respect max depth if specified (default: all levels)

5. Insert the TOC:
   - Look for `<!-- TOC -->` marker and replace content until `<!-- /TOC -->`
   - Or insert after the first H1 heading
   - Or ask user where to insert

6. Wrap the TOC with markers for future updates:
   ```markdown
   <!-- TOC -->
   ## Table of Contents

   - [Section One](#section-one)
     - [Subsection](#subsection)
   - [Section Two](#section-two)

   <!-- /TOC -->
   ```

## Usage Examples

```
/add-toc
/add-toc README.md
/add-toc docs/guide.md 2
```

## Output Format

```markdown
<!-- TOC -->
## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
- [Usage](#usage)
- [API Reference](#api-reference)

<!-- /TOC -->
```

## Notes

- The TOC markers allow easy regeneration with subsequent `/add-toc` calls
- Skips the H1 title (assumes it's the document title, not a section)
- For very long documents, consider using max depth of 2-3
