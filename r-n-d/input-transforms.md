# Input Transformations — Design Reference

> Status: R&D / future design reference
> Related: `data-emoji` (live input mode), `data-mask`

## Context

VB has several input-watching utilities that each solve one narrow problem:

| Utility | Target | Event | What it does |
|---------|--------|-------|-------------|
| `data-mask` | `<input>` | `input` | Character-level structural masks (phone, date, SSN) |
| `data-grow` | `<textarea>` | `input` | Auto-expand height |
| `data-count` | `<textarea>` | `input` | Live char/word counter |
| `data-stepper` | `<input type=number>` | `click` | +/- buttons around number input |
| `data-range` | `<input type=range>` | `input` | Value bubble + tick marks |
| `data-emoji` | any + input/textarea | `input` / TreeWalker | `:shortcode:` → emoji (static + live) |

They all follow the same init pattern (DOMContentLoaded + MutationObserver for dynamic elements) but share **zero** event-handling infrastructure.

## Three Tiers of Input Transformation

### Tier 1: Character Masks (have this — `data-mask`)
Fixed structural patterns. Every keystroke is constrained.
- `(###) ###-####` for phone
- `##/##/####` for date

**Key trait:** The mask is the shape. The input never contains "illegal" characters. Cursor management is critical because literal characters get injected.

### Tier 2: Token Replacement (have emoji, could generalize)
Watch for **delimited patterns** and replace them after completion.
- `:smile:` → 😄 (emoji shortcodes) — **implemented**
- Could also serve: `--` → em dash, `->` → →, `(c)` → ©

**Key trait:** The input is freeform. Replacement only happens when a complete token is detected. The rest of the value is untouched.

### Tier 3: Rich Transforms (out of scope)
Full syntax parsing — markdown rendering, code highlighting in contenteditable. This is editor territory (ProseMirror, CodeMirror). Not what a utility-attribute library should attempt.

## Future Design: Composable Token Replacement

### Option B: `data-replace` with pattern registry

```html
<!-- Built-in emoji tokens -->
<textarea data-replace="emoji">:smile: becomes 😄</textarea>

<!-- Built-in typographic tokens -->
<textarea data-replace="typography">-- becomes em dash, -> becomes arrow</textarea>

<!-- Multiple -->
<textarea data-replace="emoji typography">Both :smile: and -- work</textarea>
```

Each named set is a collection of `{ pattern, replacer }` pairs. A shared runner handles event binding, cursor save/restore, composition events, and debouncing.

**Pros:** One mechanism, many uses. Authors compose behaviors declaratively.
**Cons:** More upfront design. Pattern registry adds a concept. May be overengineered if emoji is the only real use case.

### Option C: Input pipeline architecture

```html
<textarea data-input-transform="emoji smartquotes trim">...</textarea>
```

Each transform is a pure function: `(value, cursorPos) → { value, cursorPos }`. A shared runner chains them.

**Pros:** Maximum composability. Shared cursor/composition handling written once.
**Cons:** Pipeline ordering complexity. Harder to reason about. Might violate VB's "simple" philosophy.

### Recommendation

Wait until there are 3+ concrete transform types before introducing the composable API. If/when smart quotes or em dashes emerge as real needs, extract the shared plumbing from `data-emoji` and `data-mask` into a tiny `input-transform-core.js`.

## Patterns Worth Watching

| Pattern | Trigger | Replacement | Demand |
|---------|---------|-------------|--------|
| Smart quotes | `"` or `'` | `"` `"` `'` `'` | Medium — typography nerds |
| Em/en dashes | `--` or `---` | `–` or `—` | Medium — common in writing tools |
| Arrows | `->` `<-` `=>` | `→` `←` `⇒` | Low |
| Fractions | `1/2` `1/4` | `½` `¼` | Low |
| Copyright/TM | `(c)` `(tm)` `(r)` | `©` `™` `®` | Low |

Smart quotes and em dashes are the most likely next candidates. If those emerge, that's the signal to extract shared infrastructure.

## Relationship to `data-mask`

These are **not** the same concept:

| | `data-mask` | Token replacement |
|---|---|---|
| **When** | Every keystroke | Only on completed tokens |
| **Scope** | Entire value | Local to the token |
| **Constraint** | Restrictive (rejects invalid chars) | Permissive (replaces, doesn't constrain) |
| **Cursor** | Always repositioned | Only shifted when replacement occurs |
| **Undo** | Can't type "wrong" characters | Could theoretically undo replacement |

They share implementation concerns (cursor management, composition events) but have fundamentally different UX models. Merging them into one system would muddy both. The shared infrastructure extraction (if it happens) should be limited to the mechanical parts: composition tracking, cursor save/restore helpers.
