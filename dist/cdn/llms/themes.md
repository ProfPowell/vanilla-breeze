# Vanilla Breeze 0.7.4: themes

A theme changes colour, type, shape and shadow for the whole page or for one element and its descendants. Pick one that suits the content; do not restyle components by hand to get a look a theme already provides.

## Use a theme

```html
<html lang="en" data-theme="modern">
```

Colour scheme is separate: `data-mode="light"` or `data-mode="dark"` on `<html>` forces one; without it the page follows the visitor's system setting. Every theme has both.

## Core themes (in the main stylesheet)

- `default`: The VB default — balanced blue-purple palette
- `modern`: Vibrant & elevated — tech-forward with bounce
- `minimal`: Clean & flat — content-focused restraint
- `classic`: Serif & elegant — timeless editorial feel
- `a11y-high-contrast`: AAA contrast (7:1+) for low vision
- `a11y-large-text`: 25% larger fonts and spacing
- `a11y-dyslexia`: Atkinson Hyperlegible with wide spacing

## Accents (in the main stylesheet)

An accent swaps the brand hues and keeps everything else. It is a separate attribute, so it combines with a theme: `<html data-theme="modern" data-accent="forest">`.

- `ocean`: Cool oceanic blues with teal undertones
- `forest`: Natural earthy greens with amber accent
- `sunset`: Warm energetic orange-red palette
- `rose`: Warm romantic pinks with ocean accent
- `lavender`: Soft calming purples with golden accent
- `coral`: Warm peachy tones with teal contrast
- `slate`: Cool professional gray-blue palette
- `emerald`: Rich vibrant green with warm accent
- `amber`: Golden warm tones with cool contrast
- `indigo`: Deep rich blues with violet depth

## Standalone themes (one extra stylesheet each)

Add the theme file after the main stylesheet, then set `data-theme`:

```html
<link rel="stylesheet" href="node_modules/vanilla-breeze/dist/cdn/vanilla-breeze.css">
<link rel="stylesheet" href="node_modules/vanilla-breeze/dist/cdn/themes/nord.css">
```

- `swiss`: Precision grid typography with Swiss red
- `brutalist`: Raw industrial — monospace, hard shadows
- `art-deco`: Gold + black, geometric shapes — 1920s luxury
- `editorial`: Magazine elegance — serif hierarchy, thin rules
- `genai`: AI startup aesthetic — purple gradients, glow, sparkle
- `glassmorphism`: Frosted glass surfaces — blur, gradients, translucency
- `startup`: Modern SaaS energy — electric indigo, gradient CTAs
- `organic`: Natural handcrafted — warm earthy curves
- `rough`: Hand-drawn sketchbook — pencil lines on warm paper
- `cyber`: Neon futuristic — glowing UI on dark void
- `journal`: Dot-grid paper, washi tape, and handmade warmth
- `vaporwave`: Hot pink/cyan on deep purple — neon glow, retro-dreamy
- `neumorphism`: Soft embossed surfaces — monochromatic double-shadow UI
- `bauhaus`: Geometric precision — primary colors, zero shadows, functional beauty
- `claymorphism`: 3D clay surfaces — puffy pastels, squish interactions
- `alpha1999`: Space retro-fi — amber CRT on deep void
- `super2026`: Supergraphic bold — warm paper, geometric red accents
- `magna`: Magnavox Odyssey 2 retro — rainbow spectrum, chrome text, deep space void
- `8bit`: Retro pixel art — chunky blocks, CRT glow
- `nes`: Console pixels — 4-color palette, beveled frames
- `win9x`: Classic desktop — 3D bevels, system gray
- `kawaii`: Cute aesthetic — pastel pink, bouncy pills
- `memphis`: 1980s bold playfulness — offset shadows, confetti, chaos
- `nord`: Arctic blue-gray — muted palette, calm professional
- `solarized`: Engineered 16-color precision — light/dark symmetry
- `dracula`: Purple bg, cyan/green/pink accents — dark-first elegance
- `catppuccin-mocha`: Warm pastels on tinted dark — cozy, unhurried
- `catppuccin-latte`: Warm pastels on light cream — cozy daytime Catppuccin
- `catppuccin-frappe`: Muted pastels on mid-dark blue — cool Catppuccin twilight
- `catppuccin-macchiato`: Rich pastels on deep blue — the darkest Catppuccin
- `gruvbox`: Earthy retro warmth — warm grays, red/green/yellow/aqua accents
- `tokyo-night`: Deep indigo night-owl — muted blue-purple, bright accent pops
- `rose-pine`: Muted rose/pine/gold — elegant, restrained, expensive
- `cottagecore`: Pastoral warmth — sage green, dusty rose, botanical dividers
- `terminal`: Retro CRT — green phosphor on black
- `clinical`: Sterile precision — medical blue, maximum clarity
- `financial`: Trustworthy authority — navy + gold, serif headings
- `government`: Official USWDS-inspired — navy + red, maximum legibility
- `dawn`: Golden morning light — warm peach/gold/cream, soft and inviting
- `dusk`: Twilight contemplation — purple-blue + warm amber, elongated shadows
- `midnight`: Deep night minimalism — near-black, muted blue, desaturated
- `high-noon`: Maximum brightness — vivid saturated colors, strong shadows

## Your own colours and spacing

When a page needs a rule of its own, write it in a stylesheet with design tokens, never literal values: `var(--color-primary)`, `var(--color-surface)`, `var(--color-text-muted)`, `var(--size-m)` (sizes run `3xs` to `3xl`), `var(--radius-m)`, `var(--shadow-m)`. Tokens follow the theme and the colour scheme.

Documentation: https://vanilla-breeze.com/docs/themes/ and https://vanilla-breeze.com/docs/tokens/
