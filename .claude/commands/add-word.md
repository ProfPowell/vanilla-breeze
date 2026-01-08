# Add Word to Project Dictionary

Add a word to the project spelling dictionary (`project-words.txt`) so cspell won't flag it as misspelled.

## Arguments
- `$ARGUMENTS` - The word(s) to add (space-separated for multiple words)

## Instructions

1. Read the current `project-words.txt` file
2. For each word provided in the arguments:
   - Check if the word already exists (case-insensitive search)
   - If not present, append it to the end of the file
3. Write the updated `project-words.txt`
4. Run `npm run lint:spelling` on a sample file to verify the word is now accepted

## Usage Examples

```
/add-word Kubernetes
/add-word OAuth OpenID
/add-word MyCompanyName
```

## Notes

- Words are case-insensitive in cspell
- For temporary or one-off words, consider using `cspell:ignore` inline comment instead
- For words that appear in code/attributes, they may already be ignored by the regex patterns
