# Subgrid Exploration - Evaluation

## Summary

Evaluated CSS subgrid through 4 demos comparing traditional approaches vs subgrid. Results are mixed - clear benefits in specific use cases, marginal benefits in others.

## Demo Results

### 1. Card Grid Alignment (subgrid-cards.html)

**Verdict: BENEFICIAL - Add to core**

| Metric | Before | After |
|--------|--------|-------|
| Lines of CSS | ~8 | ~10 |
| Cross-card alignment | No | Yes |
| HTML changes | None | None |

- **Benefit**: True cross-card alignment impossible without subgrid
- **Cost**: Only 2 extra lines
- **Recommendation**: Add `[data-subgrid="rows"]` utility

### 2. Form Field Alignment (subgrid-form.html)

**Verdict: BENEFICIAL - Add as utility**

| Metric | Before | After |
|--------|--------|-------|
| Lines of CSS | ~5 | ~15 |
| Cross-fieldset alignment | No | Yes |
| Auto-sizing labels | No | Yes |

- **Benefit**: Perfect label alignment across fieldsets
- **Cost**: More CSS, requires understanding nested subgrid
- **Recommendation**: Add `[data-layout="form-grid"]` utility

### 3. Definition Lists (subgrid-dl.html)

**Verdict: MARGINAL - Document only**

| Metric | Before | After |
|--------|--------|-------|
| Lines of CSS | ~4 | ~8 |
| Cross-group alignment | No | Yes |
| Works without wrappers | Yes | Yes |

- **Benefit**: Alignment when div wrappers are used
- **Cost**: Extra CSS, only needed with wrappers
- **Note**: Most dl elements don't need wrappers
- **Recommendation**: Document as technique, don't add to core

### 4. Article Layout (subgrid-article.html)

**Verdict: MARGINAL - Document only**

| Metric | Before | After |
|--------|--------|-------|
| Lines of CSS | ~5 | ~12 |
| Shared vertical rhythm | No | Yes |
| Fixed row count needed | No | Yes |
| Dynamic content support | Full | Limited |

- **Benefit**: Visual elegance when structure is known
- **Cost**: Requires hardcoded row spans
- **Limitation**: Not suitable for dynamic/CMS content
- **Recommendation**: Document for fixed layouts, don't add to core

## Overall Decision

**Add to layout-attributes.css:**

```css
/* Subgrid utilities */
[data-subgrid="cols"] {
  display: grid;
  grid-template-columns: subgrid;
}

[data-subgrid="rows"] {
  display: grid;
  grid-template-rows: subgrid;
}

[data-subgrid="both"] {
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: subgrid;
}
```

**Document as techniques (not utilities):**
- Definition list alignment with wrappers
- Article/aside vertical rhythm

## Browser Support

Subgrid is Baseline 2023:
- Chrome 117+
- Firefox 71+
- Safari 16+
- Edge 117+

No fallbacks needed for modern browser targets.

## Conclusion

Subgrid provides meaningful complexity reduction for **card grids** and **form layouts** where cross-element alignment matters. For other use cases (dl, article), the benefits are marginal or require compromises that limit practical use.

**Recommended action**: Add subgrid utilities to layout-attributes.css for the common card grid use case.
