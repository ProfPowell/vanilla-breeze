# Add YAML Frontmatter

Add YAML frontmatter template to a markdown file based on content type.

## Arguments

- `$ARGUMENTS` - Template type: `blog`, `docs`, `changelog`, or `default`

## Instructions

1. Determine the target file:
   - If currently editing a markdown file, use that
   - Otherwise, ask the user which file to update

2. Check if frontmatter already exists:
   - Look for `---` at the very start of the file
   - If found, warn the user and ask if they want to replace it

3. Select the appropriate template based on argument:

   **blog** - Blog post or article:
   ```yaml
   ---
   title: "Article Title"
   description: "Brief description for SEO and previews"
   author: "Author Name"
   date: 2024-01-15
   updated: 2024-01-15
   tags:
     - topic
     - category
   image: /images/blog/cover.jpg
   draft: false
   ---
   ```

   **docs** - Documentation page:
   ```yaml
   ---
   title: "Page Title"
   description: "What this page covers"
   sidebar_position: 1
   ---
   ```

   **changelog** - Changelog or release notes:
   ```yaml
   ---
   version: "1.0.0"
   date: 2024-01-15
   title: "Release Title"
   breaking: false
   ---
   ```

   **default** - Minimal frontmatter:
   ```yaml
   ---
   title: "Document Title"
   description: "Brief description"
   ---
   ```

4. Insert the frontmatter:
   - Add at the very beginning of the file
   - Ensure a blank line after the closing `---`
   - Use today's date for date fields

5. Prompt user to fill in placeholder values

## Usage Examples

```
/add-frontmatter
/add-frontmatter blog
/add-frontmatter docs
/add-frontmatter changelog
```

## Template Details

### Blog Post Fields

| Field | Purpose | Required |
|-------|---------|----------|
| `title` | Article headline | Yes |
| `description` | SEO/social preview | Yes |
| `author` | Content author | Recommended |
| `date` | Publication date | Yes |
| `updated` | Last modified | Optional |
| `tags` | Categories | Recommended |
| `image` | Cover image path | Optional |
| `draft` | Publication status | Optional |

### Documentation Fields

| Field | Purpose | Required |
|-------|---------|----------|
| `title` | Page title | Yes |
| `description` | Page summary | Recommended |
| `sidebar_position` | Navigation order | Optional |

### Changelog Fields

| Field | Purpose | Required |
|-------|---------|----------|
| `version` | Semver version | Yes |
| `date` | Release date | Yes |
| `title` | Release name | Optional |
| `breaking` | Breaking changes flag | Optional |

## Notes

- Frontmatter must be the first thing in the file (no blank lines before)
- YAML requires proper indentation (2 spaces)
- Strings with colons or special chars need quotes
- Dates use ISO 8601 format (YYYY-MM-DD)
