---
title: "feat: calendar-wc enhancements informed by cally competitive analysis"
type: feat
status: active
date: 2026-04-06
---

# feat: calendar-wc enhancements informed by cally competitive analysis

## Overview

Competitive analysis of [cally](https://github.com/WickyNilliams/cally) against VB's calendar-wc reveals several adoptable ideas that would strengthen the component. This plan identifies the highest-value improvements, prioritized by impact and alignment with VB's HTML-first philosophy.

## Problem Frame

VB's calendar-wc is a capable display calendar with events, theming, and selection modes. However, comparing against cally surfaces gaps in i18n, form integration, date constraints, multi-select, and API ergonomics. Several of cally's patterns use modern web platform APIs that VB could adopt to strengthen its progressive enhancement story and developer experience.

## Comparative Analysis

| Capability | cally | calendar-wc | Gap? |
|---|---|---|---|
| Single date selection | Yes | Yes | - |
| Range selection | Yes (2-click with hover preview) | Yes (2-click with hover preview) | - |
| Multi-select (non-contiguous) | Yes (`calendar-multi`) | No | **Gap** |
| Min/max date constraints | Yes (`min`/`max` attrs) | No (only individual disable) | **Gap** |
| `isDateDisallowed` callback | Yes (JS property) | No (attribute-only) | **Gap** |
| Locale-aware weekday headers | Yes (`Intl.DateTimeFormat`) | No (hardcoded English) | **Gap** |
| Locale-aware first-day-of-week | Yes (`Intl.Locale.weekInfo`) | Yes (via `Intl.Locale`) | - |
| Form association (ElementInternals) | No | No | **Both lack** |
| Event display (appointments) | No | Yes (dots, chips, day overlay) | VB advantage |
| Size variants | No | Yes (compact, default, large) | VB advantage |
| CSS theming tokens | 2 properties | 27 properties | VB advantage |
| Day detail overlay | No | Yes (dialog with hour grid) | VB advantage |
| `getDayParts` callback | Yes | No | **Gap** |
| `::part()` styling surface | Yes (20+ parts) | No (uses `@scope`) | Different approach |
| Temporal API alignment | Yes (internal PlainDate) | No | **Gap** |
| ISO 8601 range format | Yes (`YYYY-MM-DD/YYYY-MM-DD`) | No (separate start/end) | **Gap** |
| `tentative` range state | Yes (readable attribute) | No | **Gap** |
| Multi-month display | Yes (`months` attr) | No | **Gap** |
| Outside-day clicking | Some implementations | Disabled | Minor gap |
| Progressive enhancement | None (JS required) | None (JS required) | Both lack |
| Highlight categories | No | Yes | VB advantage |

## Requirements Trace

Prioritized by value and feasibility:

- R1. **Localize weekday headers** via `Intl.DateTimeFormat` — currently hardcoded English `Su Mo Tu...`
- R2. **Localize hour labels** in day detail overlay — currently hardcoded `9:00 AM`
- R3. **Add min/max date constraints** via `data-min-date` / `data-max-date` — disable navigation and dates outside range
- R4. **Add multi-select mode** (`data-selection="multi"`) — select non-contiguous dates
- R5. **Add `isDateDisallowed` JS callback** as an alternative to the attribute-only `data-disabled-dates`
- R6. **Add form association** via `ElementInternals` + `formAssociated` — participate in native form submission
- R7. **Adopt ISO 8601 interval format** for range values (`YYYY-MM-DD/YYYY-MM-DD`)
- R8. **Add `tentative` attribute** for range selection intermediate state
- R9. **Add `getDayParts` callback** for injecting custom CSS class/attribute per day
- R10. **Align internal date handling toward Temporal API** patterns for future migration
- R11. **Add multi-month display** (`data-months="2"`) for side-by-side month view

## Scope Boundaries

- **Not adopting cally's architecture** — cally splits into 6 separate elements composed together; VB's single-element approach with attributes is simpler and aligns with HTML-first philosophy
- **Not adopting Atomico** — VB uses VBElement, not a React-hooks model
- **Not adding `::part()`** — VB uses `@scope` for CSS encapsulation; `::part()` is a different model. The existing 27 CSS tokens provide sufficient theming surface
- **Not removing event support** — this is VB's key differentiator over cally
- **Not adding Popover API to calendar-wc itself** — that's date-picker's job (calendar-wc is display, date-picker is the form input)

## Key Technical Decisions

- **R1/R2: Use `Intl.DateTimeFormat`** for all user-visible text — replace the hardcoded `DAYS` and `HOURS` arrays with locale-derived strings. Use `navigator.language` as default, allow override via `lang` attribute on the element or ancestor
- **R3: Min/max constrains both navigation and selection** — prev/next buttons disabled at boundaries, dates outside range get `aria-disabled`, year dropdown range limited
- **R4: Multi-select stores as space-separated ISO dates** — matches cally's convention. Value accessible via `.value` property and `calendar:select` event detail
- **R5: `isDateDisallowed` is a JS-only property** — can't express functions in HTML attributes. Takes `(date: Date) => boolean`, checked during render alongside `data-disabled-dates`
- **R6: Form association uses the date-picker pattern** — calendar-wc gains `static formAssociated = true` and `ElementInternals`. When `data-selection` is not `"none"`, `setFormValue()` syncs with the selected date(s). Requires a `name` attribute
- **R9: `getDayParts` returns a string** that gets added as a `data-day-part` attribute on the day `<td>`, enabling CSS targeting like `td[data-day-part~="holiday"]`
- **R10: Lightweight Temporal alignment** — introduce an internal `CalendarDate` helper that mirrors `Temporal.PlainDate` for comparison/arithmetic, swappable when Temporal ships

## Implementation Units

- [ ] **Unit 1: Localize weekday headers and hour labels (R1, R2)**

  **Goal:** Replace hardcoded English day abbreviations and hour labels with `Intl.DateTimeFormat`-derived strings.

  **Dependencies:** None

  **Files:**
  - Modify: `src/web-components/calendar-wc/logic.js`
  - Test: `tests/unit/calendar-wc.test.js` (create if needed)

  **Approach:**
  - Replace `DAYS` array with a function that generates day names from `Intl.DateTimeFormat(locale, { weekday: 'short' })` for the 7 days of the week
  - Replace `DAYS_FULL` with `{ weekday: 'long' }` variant for `aria-label`
  - Replace `HOURS` array with `Intl.DateTimeFormat(locale, { hour: 'numeric' })` formatted strings
  - Locale derived from `this.closest('[lang]')?.lang || navigator.language`
  - Cache the formatted arrays per locale to avoid repeated `Intl` calls

  **Patterns to follow:**
  - Cally's use of `new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)`
  - VB's existing use of `Intl.DateTimeFormat` for month names in `#renderMonth()`

  **Test scenarios:**
  - Happy path: Default locale produces correct English abbreviations (Su/Mo/Tu...)
  - Happy path: Element with `lang="fr"` produces French day names (dim./lun./mar...)
  - Happy path: Hour labels respect locale (24h vs 12h format)
  - Edge case: Unknown locale falls back to browser default
  - Edge case: Ancestor `lang` attribute inherited correctly

  **Verification:** Weekday headers and hour labels localize when `lang` attribute is set

- [ ] **Unit 2: Add min/max date constraints (R3)**

  **Goal:** Support `data-min-date` and `data-max-date` attributes that constrain both navigation and selection.

  **Dependencies:** None

  **Files:**
  - Modify: `src/web-components/calendar-wc/logic.js`
  - Modify: `src/web-components/calendar-wc/api.json`
  - Test: `tests/unit/calendar-wc.test.js`

  **Approach:**
  - Parse ISO date strings from `data-min-date` / `data-max-date`
  - During render: dates outside range get `disabled` + `aria-disabled="true"`
  - Navigation: disable prev button when viewing min month, next button when viewing max month
  - Year dropdown: constrain year range to min.year–max.year instead of current +/- 10
  - Integrate with existing `data-disabled-dates` logic (additive — a date disabled by either mechanism is disabled)

  **Test scenarios:**
  - Happy path: `data-min-date="2026-03-01"` disables all February dates and prev button in March
  - Happy path: `data-max-date="2026-12-31"` disables next button in December 2026
  - Edge case: min > max is handled gracefully (no dates selectable, no crash)
  - Edge case: min/max in same month — only dates within range are enabled
  - Integration: min/max works alongside `data-disabled-dates`

  **Verification:** Dates outside range are disabled; navigation is constrained

- [ ] **Unit 3: Add multi-select mode (R4)**

  **Goal:** Support `data-selection="multi"` for selecting non-contiguous dates.

  **Dependencies:** None

  **Files:**
  - Modify: `src/web-components/calendar-wc/logic.js`
  - Modify: `src/web-components/calendar-wc/api.json`
  - Test: `tests/unit/calendar-wc.test.js`

  **Approach:**
  - New selection mode alongside existing `none`, `single`, `range`
  - Click toggles date in/out of selection set
  - Selected dates stored as a `Set<string>` of ISO dates
  - Value exposed as space-separated ISO string (matches cally convention)
  - `calendar:select` event detail includes `{ values: string[], dates: Date[] }`
  - Visual: selected dates get `data-selected` attribute (reuse existing styling)

  **Test scenarios:**
  - Happy path: Click three non-contiguous dates — all three get `data-selected`
  - Happy path: Click a selected date — deselects it
  - Happy path: `calendar:select` event contains all selected dates
  - Edge case: Navigate to different month and back — selections persist
  - Edge case: Selection across month boundaries

  **Verification:** Multiple dates can be independently toggled on/off

- [ ] **Unit 4: Add isDateDisallowed callback and form association (R5, R6)**

  **Goal:** Support a JS callback for dynamic date disabling, and add `ElementInternals` form participation.

  **Dependencies:** Unit 2 (shares disable logic)

  **Files:**
  - Modify: `src/web-components/calendar-wc/logic.js`
  - Modify: `src/web-components/calendar-wc/api.json`
  - Test: `tests/unit/calendar-wc.test.js`

  **Approach:**
  - **`isDateDisallowed`**: JS property (not attribute). `(date: Date) => boolean`. Called during render for each visible date. Result merged with attribute-based disable and min/max constraints.
  - **Form association**: Add `static formAssociated = true`, initialize `ElementInternals` in constructor. On selection change, call `this.#internals.setFormValue(value)`. Value format: ISO date (single), ISO interval (range), space-separated ISOs (multi). Requires `name` attribute. No-op when `data-selection="none"`.

  **Test scenarios:**
  - Happy path: `el.isDateDisallowed = (d) => d.getDay() === 0` disables all Sundays
  - Happy path: Form submission includes selected date when `name` is set
  - Edge case: Callback returns true for all dates — entire grid disabled
  - Edge case: Callback + `data-disabled-dates` + min/max all apply together
  - Edge case: No `name` attribute — form value not set, no error
  - Integration: Wrapping in `<form-field>` works for validation

  **Verification:** Dynamic disable works; form submission includes calendar value

- [ ] **Unit 5: ISO range format, tentative state, getDayParts (R7, R8, R9)**

  **Goal:** Adopt ISO 8601 range format, expose tentative range state, and add the getDayParts callback.

  **Dependencies:** Unit 3 (for consistent value format conventions)

  **Files:**
  - Modify: `src/web-components/calendar-wc/logic.js`
  - Modify: `src/web-components/calendar-wc/api.json`
  - Test: `tests/unit/calendar-wc.test.js`

  **Approach:**
  - **ISO range**: Change range selection event detail to include `value: "YYYY-MM-DD/YYYY-MM-DD"` (slash-separated per ISO 8601). Keep individual `start`/`end` in detail for convenience.
  - **`tentative`**: When range start is selected but end is not yet, set `data-tentative` attribute on the host with the start date ISO string. Clear on range completion or reset. Readable externally.
  - **`getDayParts`**: JS property `(date: Date) => string | string[]`. Called during render. Return value(s) added as `data-day-part` attribute on the `<td>`. Enables CSS like `calendar-wc td[data-day-part~="holiday"] { background: ... }`.

  **Test scenarios:**
  - Happy path: Range selection emits value in `YYYY-MM-DD/YYYY-MM-DD` format
  - Happy path: After first range click, `data-tentative` is set on host element
  - Happy path: `getDayParts` returning `"holiday"` adds `data-day-part="holiday"` to the cell
  - Edge case: `getDayParts` returning multiple values as array produces space-separated attribute
  - Edge case: Tentative cleared on range completion, Escape, or mode change

  **Verification:** Range uses ISO format; tentative state is externally observable; day parts render as data attributes

- [ ] **Unit 6: Multi-month display (R11)**

  **Goal:** Support `data-months="N"` to show N months side by side.

  **Dependencies:** Units 1-5 (all selection/constraint logic should be stable first)

  **Files:**
  - Modify: `src/web-components/calendar-wc/logic.js`
  - Modify: `src/web-components/calendar-wc/styles.css`
  - Modify: `src/web-components/calendar-wc/api.json`
  - Test: `tests/unit/calendar-wc.test.js`

  **Approach:**
  - `data-months="2"` renders two adjacent month grids in a horizontal flex layout
  - Navigation advances all months together (prev/next shifts by one month, not by `N`)
  - Selection, highlighting, and events work across all visible months
  - Range selection hover preview spans across months
  - Responsive: wraps to vertical stack on narrow containers via container query

  **Test scenarios:**
  - Happy path: `data-months="2"` renders two month grids (current and next)
  - Happy path: Navigation shifts both months by one
  - Happy path: Range selection across month boundary works
  - Edge case: `data-months="1"` behaves same as default
  - Edge case: Large value like `data-months="12"` renders all months (yearly view)
  - Edge case: Works with min/max constraints on the outer boundaries

  **Verification:** Multiple months render side-by-side; all existing features work across them

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Localization changes break existing demos/tests | Run visual regression on themed demos after i18n changes |
| `ElementInternals` support in older browsers | Feature-detect; no-op gracefully if not supported |
| Multi-month display complexity | Implement last, after all single-month features are stable |
| `getDayParts` performance on large calendars | Callback runs per visible day (~42 cells max), negligible |
| ISO range format is a breaking change | Pre-release — breaking changes are acceptable per project conventions |

## Future Considerations

- **Temporal API migration**: When `Temporal` lands in browsers, replace internal date arithmetic with `Temporal.PlainDate`. The current `Date`-based logic should be isolated to make this swap tractable.
- **Anchor Positioning**: When CSS anchor positioning is widely supported, `date-picker` could use it to position the calendar popover without JS coordinates.
- **Declarative Shadow DOM**: If VB adopts DSD (vanilla-breeze-i9c0), calendar-wc could benefit from server-rendered month grids.

## Sources & References

- External: [cally](https://github.com/WickyNilliams/cally) — MIT licensed calendar web component
- External: [cally docs](https://wicky.nillia.ms/cally/) — API documentation and examples
- Related code: `src/web-components/calendar-wc/logic.js`, `src/web-components/date-picker/logic.js`
- Related bead: `vanilla-breeze-i9c0` (declarative shadow DOM investigation)
