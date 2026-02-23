# Vanilla Breeze i18n Philosophy

## Core Stance

Internationalization is not a feature you add — it is a constraint you respect from the start. Vanilla Breeze treats i18n as a first-class concern in the same way it treats semantic HTML and progressive enhancement: you build it in, not bolt it on.

The web platform already has most of what you need. The `lang` attribute, CSS `:lang()` pseudo-class, logical properties, the `Intl` API, the `translate` attribute, ruby HTML elements — these are not obscure specifications. They ship in every modern browser. Vanilla Breeze's job is to use them correctly and consistently, then get out of the way.

---

## The Three Levels of i18n

Vanilla Breeze thinks about i18n at three distinct levels, each with different responsibilities.

**Level 1 — Structure (HTML + CSS)**  
The framework layer. This is where VB ships defaults: logical CSS properties, `:lang()` typography rules, ruby element styling, `translate="no"` conventions. None of this requires JavaScript. A page using VB that sets `lang="ar"` on `<html>` should get correct RTL layout, appropriate line height, and right-to-left text rendering without any additional configuration.

**Level 2 — Behavior (Web Components)**  
Components that deal with formatted output — numbers, dates, times, currency — must be locale-aware. They read a locale from the nearest `<vb-settings>` component, falling back to `navigator.language`. They use `Intl.*` APIs directly, with no third-party formatting library required. The platform does the work.

**Level 3 — Content (User Territory)**  
Translation of actual text content is the application developer's responsibility, not VB's. VB provides a lightweight convention (`data-i18n` attributes) and a minimal swap mechanism, but it does not own translation strings, does not require a translation library, and does not dictate how messages are stored. This is an intentional boundary.

---

## Logical Properties Throughout

Every spacing, sizing, or positional value in VB internals uses CSS logical properties. This is non-negotiable.

```css
/* Never this */
.card { padding-left: 1rem; margin-right: auto; }

/* Always this */
.card { padding-inline-start: 1rem; margin-inline-end: auto; }
```

The payoff is that RTL layout requires zero additional CSS from VB. The `dir` attribute on `<html>` does the rest. This also applies to border-radius shorthand (`border-start-start-radius`), text alignment (`text-align: start`), and float/position offsets (`inset-inline-start`).

---

## Language as a CSS Selector

CSS `:lang()` is more powerful than it looks. Unlike `[lang="ja"]`, it inherits: a `<p>` inside a `<section lang="ja">` matches `:lang(ja)`. VB uses this for typography adaptation across scripts.

```css
/* Latin scripts */
:root { font-family: var(--vb-font-latin); line-height: 1.6; }

/* CJK: looser line height, no letter-spacing */
:lang(ja), :lang(zh), :lang(ko) {
  font-family: var(--vb-font-cjk);
  line-height: 1.8;
  letter-spacing: 0;
  word-break: break-all;
}

/* Arabic/Persian/Urdu: RTL, no letter-spacing, large line height */
:lang(ar), :lang(fa), :lang(ur) {
  font-family: var(--vb-font-arabic);
  line-height: 1.9;
  letter-spacing: normal;
}
```

VB ships a `vb-i18n.css` layer that provides these typography defaults. They are organized as a `@layer` so developers can override them without specificity battles.

---

## Ruby as a First-Class Element

The `<ruby>`, `<rt>`, and `<rp>` elements exist in HTML precisely for phonetic annotation of CJK text. Vanilla Breeze treats ruby as a standard typographic tool, not an exotic edge case.

VB ships built-in support for:

- **Visibility control** via `data-ruby` on `<html>`: `show`, `hide`, `auto`
- **Typography defaults** for ruby text size, spacing, and color
- **`<vb-ruby-annotate>`** as an optional module for programmatic annotation via external API

The `auto` mode uses `:lang()` — ruby text is shown for Japanese, Chinese, and Korean, hidden for other languages. This is the right default: a Japanese learning site shows furigana, a generic English site does not render empty ruby elements oddly.

See `vb-ruby.css` and `vb-ruby.js` for implementation.

---

## `translate` Attribute as Convention

Browser translation (Google Translate, Safari translation, Edge) and machine translation APIs respect the HTML `translate` attribute. VB components set `translate="no"` on content that should never be translated:

- Brand names and product names
- Code examples and technical identifiers
- `<kbd>`, `<code>`, `<samp>` elements globally
- User-provided untranslatable identifiers (email addresses, URLs, etc.)

VB documents this as a convention developers should follow in their own markup, and bakes it into relevant components by default.

---

## The `data-i18n` Convention

VB provides a minimal translation hook. Elements that carry user-facing text and need swapping when locale changes can use `data-i18n`:

```html
<button data-i18n="actions.close">Close</button>
<p data-i18n="welcome.message" data-i18n-attr="aria-label">…</p>
```

The `vb-i18n.js` module listens for `vb:locale-change` events from `<vb-settings>` and applies string replacements from a user-provided message map. By default it replaces `textContent`. The optional `data-i18n-attr` targets a specific attribute instead (useful for `aria-label`, `placeholder`, `title`).

VB does not ship or manage translation strings. It provides the wiring. The developer supplies the map.

---

## `<vb-settings>` as Runtime Controller

A single `<vb-settings>` element placed early in `<body>` owns all user preferences and broadcasts them as data attributes on `<html>`. Components read these passively via CSS or DOM observation — they do not need direct references to the settings component.

For i18n specifically, `<vb-settings>` manages:

| Setting | HTML Signal | What Reacts |
|---|---|---|
| `locale` | `<html lang="…">` | CSS `:lang()`, `Intl.*` in components, `data-i18n` swaps |
| `dir` | `<html dir="…">` | Logical properties (auto-correct), flex/grid direction |
| `ruby` | `<html data-ruby="…">` | `rt` visibility in `vb-i18n.css` |

Preferences persist to `localStorage` so they survive page load. They emit `vb:settings-change` so components and application code can react.

---

## What VB Does Not Do

- **Does not ship translation strings.** That is the application's domain.
- **Does not require a locale library.** `Intl.*` is the library.
- **Does not fork CSS for RTL.** Logical properties make RTL forks obsolete.
- **Does not auto-translate content.** The browser's translation layer handles that, and VB marks untranslatable regions correctly.
- **Does not dictate font loading.** VB provides `--vb-font-cjk`, `--vb-font-arabic` etc. as custom property slots. The developer fills them.

---

## Summary: The VB i18n Contract

| Responsibility | VB | Developer |
|---|---|---|
| Logical CSS properties | ✅ Ships them | Use VB components |
| RTL layout | ✅ Automatic via `dir` | Set `dir` or let `<vb-settings>` infer |
| Script-appropriate typography | ✅ `vb-i18n.css` layer | Override via custom properties |
| Ruby visibility | ✅ `data-ruby` system | Provide `<ruby>` markup or use annotator |
| Locale-aware formatting | ✅ Components use `Intl.*` | Set `locale` on `<vb-settings>` |
| `translate` conventions | ✅ Documented + applied in components | Follow convention in custom markup |
| Translation string swap | ✅ `data-i18n` mechanism | Provide message maps |
| Actual translation strings | ❌ | Developer owns these |
| Font files | ❌ | Developer loads per-script fonts |