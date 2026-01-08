# First Heading

# Second H1 Heading

This document has multiple H1 headings which violates MD025.

#### Skipped to H4

This skipped from H1 to H4, violating MD001.

## Code Block Without Language

```
function noLanguage() {
  return 'no syntax highlighting';
}
```

## Bad Link

Click here: https://example.com

The above is a bare URL, violating MD034.

## Empty Image Alt

![ ](./image.png)

## Bad List Style

* Item using asterisk
* Another asterisk item

Should use dashes consistently.

**This looks like a heading but uses emphasis**

The above uses emphasis instead of a proper heading which violates MD036.
