# Scaffold Design System Page

Generate a single-page design system documentation site using Vanilla Breeze Design System Pack components. The page is a living reference that reads theme tokens at runtime.

## Usage

```
/scaffold-design-system-page [brand-name]
```

## Arguments

- `brand-name` (optional): Brand or company name. If not provided, will prompt for it.

## Information to Collect

Prompt the user for these details (use sensible defaults if not provided):

| Field | Default | Used For |
|-------|---------|----------|
| Brand name | Required | Page title, hero section |
| Tagline | "Building better experiences" | Hero subtitle |
| Mission statement | (optional) | Brand identity section |
| Primary hue (OKLCH) | 260 | Color seeds |
| Accent hue (OKLCH) | 30 | Color seeds |
| Heading font | system-ui | `<type-specimen>` |
| Body font | system-ui | `<type-specimen>` |
| Mono font | monospace | `<type-specimen>` |
| Base theme | none | Theme CSS link (if extending an existing VB theme) |
| Output path | design-system.html | File location |

## What This Creates

A single HTML file containing:

### Required Sections
1. **Brand Identity** — `<brand-mark>` with name and tagline
2. **Color System** — `<color-palette>` for brand, semantic, and status colors
3. **Typography** — `<type-specimen>` for each font stack (heading, body, mono)
4. **Spacing** — `<spacing-specimen>` showing the full spacing scale
5. **Shape** — `<token-specimen type="radius">` and `<token-specimen type="shadow">`
6. **Component Showcase** — `<component-sampler>` showing themed UI elements

### Optional Sections (include if user provides content)
7. **Motion** — Duration and easing token tables
8. **Voice and Tone** — Do/don't lists using `<ul data-list="do-dont">`
9. **Brand Guidelines** — Logo usage rules, clear space, don'ts

## Template Structure

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{{brandName}} — Design System</title>
  <link rel="stylesheet" href="/cdn/vanilla-breeze.css"/>
  <link rel="stylesheet" href="/cdn/packs/design-system.full.css"/>
  {{#if baseTheme}}
  <link rel="stylesheet" href="/cdn/themes/{{baseTheme}}.css"/>
  {{/if}}
  <script type="module" src="/cdn/vanilla-breeze.js"></script>
  <script type="module" src="/cdn/packs/design-system.full.js"></script>
  <style>
    html { scroll-behavior: smooth; }
    body { background: var(--color-background); color: var(--color-text); }
    main > section {
      padding-block: var(--size-2xl);
      border-block-end: 1px solid var(--color-border);
    }
    main > section:last-child { border-block-end: none; }
  </style>
</head>
<body>
  <layout-center data-layout-max="wide">
    <main data-layout="stack" data-layout-gap="none">

      <!-- Hero -->
      <header style="text-align: center; padding-block: var(--size-3xl);">
        <brand-mark wordmark="{{brandName}}"></brand-mark>
        <p class="lead">{{tagline}}</p>
      </header>

      <!-- Section: Colors -->
      <section data-layout="stack" data-layout-gap="l">
        <h2>Color System</h2>
        <h3>Brand Palette</h3>
        <color-palette colors="
          Primary: var(--color-primary),
          Secondary: var(--color-secondary),
          Accent: var(--color-accent)
        " show-values></color-palette>
        <h3>Semantic Colors</h3>
        <color-palette colors="
          Surface: var(--color-surface),
          Text: var(--color-text),
          Border: var(--color-border),
          Interactive: var(--color-interactive)
        " show-values></color-palette>
        <h3>Status Colors</h3>
        <color-palette colors="
          Success: var(--color-success),
          Warning: var(--color-warning),
          Error: var(--color-error),
          Info: var(--color-info)
        " show-values></color-palette>
      </section>

      <!-- Section: Typography -->
      <section data-layout="stack" data-layout-gap="l">
        <h2>Typography</h2>
        <type-specimen font="var(--font-sans)" label="Body Font" show-scale></type-specimen>
        <type-specimen font="var(--font-mono)" label="Monospace Font"></type-specimen>
      </section>

      <!-- Section: Spacing -->
      <section data-layout="stack" data-layout-gap="l">
        <h2>Spacing</h2>
        <spacing-specimen></spacing-specimen>
      </section>

      <!-- Section: Shape -->
      <section data-layout="stack" data-layout-gap="l">
        <h2>Shape and Elevation</h2>
        <token-specimen type="radius" label="Border Radius"></token-specimen>
        <token-specimen type="shadow" label="Shadow Scale"></token-specimen>
        <token-specimen type="border" label="Border Widths"></token-specimen>
      </section>

      <!-- Section: Components -->
      <section data-layout="stack" data-layout-gap="l">
        <h2>Component Showcase</h2>
        <p>All standard UI elements rendered with the current theme tokens.</p>
        <component-sampler></component-sampler>
      </section>

    </main>
  </layout-center>
</body>
</html>
```

## Implementation Notes

- The template uses `{{placeholders}}` — replace them with collected values.
- All Design System Pack components read tokens at runtime, so the page automatically reflects any theme applied.
- If the user specifies a base theme, add the theme CSS link and set `data-theme` on `<html>`.
- If the user provides custom OKLCH hues, generate a `<style>` block with `:root` overrides for `--hue-primary` and `--hue-accent`.
- Include the `design-system/do-dont.css` and `design-system/token-table.css` if voice/tone section is included.
- Use the Meridian Labs example (`demos/examples/demos/design-system-meridian.html`) as the gold standard reference for what a complete page looks like.
