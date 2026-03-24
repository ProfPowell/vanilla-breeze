# Color Tokens Review

## Objective

Review Vanilla Breeze's color token system against the ideas in:

- https://theadminbar.com/semantics-and-primitives-color-system/

The article's core point is simple and correct:

- primitives should be the single source of raw color values
- semantics should describe purpose and point to primitives
- one layer should not try to do both jobs

Vanilla Breeze partly matches this already, but it does not describe or enforce its actual model consistently enough across core tokens, themes, docs, components, and demos.

## Short Version

Vanilla Breeze is not a primitives-only system and not a semantics-only system. It is closer to a three-layer system:

1. raw primitives and parametric seeds
2. derived brand tokens
3. semantic UI tokens

That is a valid evolution of the article's two-layer model. The problem is not the architecture itself. The problem is that the repo does not define that architecture clearly or enforce it consistently.

The biggest gaps are:

- the public docs still flatten or mis-teach the model
- the base semantic contract is incomplete
- themes and packs introduce undeclared `--color-*` tokens
- many components and utilities still bypass semantics and reach for gray primitives or raw color values
- linting currently checks theme coverage, but not token-layer discipline

## What Vanilla Breeze Already Gets Right

### 1. Core already separates raw inputs from semantic usage

`src/tokens/colors.css` is not a random pile of colors. It has distinct layers:

- neutral primitives like `--color-gray-50` through `--color-gray-950`
- brand input seeds like `--hue-primary`, `--lightness-primary`, `--chroma-primary`
- derived brand tokens like `--color-primary`, `--color-primary-hover`, `--color-primary-subtle`
- semantic UI tokens like `--color-background`, `--color-surface`, `--color-text`, `--color-border`, `--color-interactive`

That is directionally aligned with the article. VB's brand system is more parametric than the article's examples, but it is not philosophically opposed to them.

### 2. Core themes mostly do the right thing

Brand themes like `src/tokens/themes/_brand-ocean.css` mostly override seeds, not every downstream token. That is good. It means:

- one theme change can cascade through the system
- hover and subtle states stay consistent
- light/dark behavior stays centralized

This is arguably stronger than the article's basic primitive layer because VB can derive multiple brand states from fewer declared inputs.

### 3. VB already has a useful semantic helper layer

`src/tokens/color-mix.css` adds derived semantic helpers like:

- `--surface-hover`
- `--surface-focus`
- `--status-success-bg`
- `--tint-primary-10`

This is good system design. It reduces repeated ad hoc `color-mix()` formulas in components.

### 4. There is already some governance

`src/tokens/index.css` and `src/main.css` describe an explicit token contract and layer order. `npm run lint:theme-tokens` already enforces dark/light coverage for themes.

So this is not a repo starting from chaos. It already has the beginnings of a real token discipline.

## Where Vanilla Breeze Diverges From The Article In A Good Way

The article describes a two-layer model:

- primitives
- semantics

VB is really closer to:

1. primitives
   - neutral values like `--color-gray-*`
   - theme input seeds like `--hue-*`, `--lightness-*`, `--chroma-*`
2. derived brand slots
   - `--color-primary`
   - `--color-secondary`
   - `--color-accent`
   - their hover/active/subtle states
3. semantic UI tokens
   - `--color-surface`
   - `--color-text`
   - `--color-border`
   - `--color-interactive`
4. optional component-local or helper tokens
   - `--surface-hover`
   - button-local `--_color`
   - component seeds like `--btn-color`

That is not a problem. In fact, it is often better for a themeable system. But the repo needs to explain this clearly. Right now the public docs mostly talk like the system is flat.

## Current Repo Failures

### 1. The public docs do not teach the actual architecture

The docs say semantic naming matters, which is correct:

- `site/src/pages/docs/principles.njk`

But the token and theme docs do not explain the real layering well enough:

- `site/src/pages/docs/tokens/index.njk`
- `site/src/pages/docs/themes/index.njk`

The most obvious mismatch is that the themes guide still shows a custom theme overriding derived tokens like `--color-primary` directly. That cuts across the seed-and-derive architecture the core files are actually built around.

Result:

- the architecture in code and the architecture in docs are not the same
- contributors can follow the docs and still weaken the system

### 2. The base semantic vocabulary is incomplete

This is the most concrete structural bug.

The base contract in `src/tokens/index.css` says theme bundles should override existing tokens, not invent new ones. But several tokens are treated like real semantic tokens across the repo without being defined in the base token layer:

- `--color-surface-alt`
- `--color-border-muted`

Evidence:

- used broadly in components, docs, demos, fixtures, and theme lab
- defined by many extreme themes and packs
- not defined in base core token files like `src/tokens/colors.css` or `src/tokens/color-mix.css`

This means the semantic layer is incomplete in default/core mode. Any component or pattern using those tokens without a fallback is depending on theme-only behavior.

Representative usage:

- `src/web-components/combo-box/styles.css`
- `src/web-components/theme-picker/styles.css`
- `src/web-components/context-menu/styles.css`
- `tests/element-visual/compendium/compendium.json`
- many `demos/` pattern files

This should be treated as a contract bug, not just a naming preference.

### 3. Theme files violate the stated token contract

`src/tokens/index.css` says theme bundles must not introduce new tokens not defined in core.

But many real themes do exactly that:

- `src/tokens/themes/_extreme-swiss.css`
- `src/tokens/themes/_extreme-kawaii.css`
- most other `src/tokens/themes/_extreme-*.css`
- `src/packs/kawaii/kawaii.theme.css`
- `src/packs/memphis/memphis.theme.css`

Examples of undeclared additions:

- `--color-surface-alt`
- `--color-border-muted`
- `--color-lavender`
- `--color-peach`
- `--color-sky`

There are only two coherent options:

- promote these to real public tokens by defining them in core and documenting them
- or mark them as theme-private and move them out of the public `--color-*` semantic namespace

Right now the repo is trying to do both at once.

### 4. Some components still bypass the semantic layer

A healthy token system depends on most component code staying on the semantic layer. VB is mixed here.

Good example:

- `src/native-elements/button/styles.css`

This uses a component seed `--btn-color`, defaults to `--color-interactive`, and derives local states from that seed. That is strong.

Less good examples:

- `src/native-elements/tooltip/styles.css`
  - uses `--color-gray-900` and `--color-gray-50` directly for tooltip surfaces instead of semantic tooltip/surface tokens
- `src/utils/loading.css`
  - builds loading and skeleton states directly from gray primitives
- `src/native-elements/output/styles.css`
  - hardcodes success/warning/error OKLCH values instead of using semantic status tokens and derived subtle backgrounds
- `src/custom-elements/status-message/styles.css`
  - partly good, but still hardcodes the warning foreground and uses gray primitives for neutral

This is exactly the kind of drift the article warns about. Once components reach down into primitives or raw values, color changes become less predictable and theme coverage becomes more fragile.

### 5. Brand slots and semantics are still blurred in some places

In the article's framing, semantics would be names like:

- button background
- link color
- border subtle

VB has some of that:

- `--color-interactive`
- `--color-border`
- `--color-surface`

But many styles still use brand slots directly:

- `--color-primary`
- `--color-primary-subtle`
- `--color-warning`

Direct use of a brand slot is not always wrong. Sometimes it is exactly the point. But it should be intentional:

- use brand slots when you mean brand identity
- use semantic UI tokens when you mean role

The repo does not currently enforce that distinction.

### 6. Metadata duplicates colors outside the token source

`src/lib/theme-data.js` contains many hard-coded swatch colors in HEX.

This is acceptable as display metadata, but it is not a token source of truth. The repo should be careful not to let these values become quasi-authoritative when theme CSS changes.

This is a smaller issue than the contract problems above, but it is still a source-of-truth smell.

## Representative Mismatches

### Mismatch A: Docs teach direct overrides while core wants derived behavior

- Core:
  - `src/tokens/colors.css`
  - `src/tokens/themes/_brand-template.css`
  - `src/tokens/themes/_theme-template.css`
- Docs:
  - `site/src/pages/docs/themes/index.njk`

Core says brand themes should usually set hue/lightness/chroma seeds and let the system derive states. The public docs still show direct overrides of `--color-primary` and related tokens as the primary custom theme pattern.

### Mismatch B: Base contract says "no new theme tokens", but real themes add many

- Contract:
  - `src/tokens/index.css`
- Violations:
  - `src/tokens/themes/_extreme-swiss.css`
  - `src/tokens/themes/_extreme-kawaii.css`
  - `src/packs/kawaii/kawaii.theme.css`

### Mismatch C: Semantic token missing from base but used like it is public

- missing in base:
  - `src/tokens/colors.css`
  - `src/tokens/color-mix.css`
- used as public:
  - `src/web-components/combo-box/styles.css`
  - `src/web-components/theme-picker/styles.css`
  - `site/src/pages/docs/tools/theme-lab/index.njk`
  - `tests/element-visual/compendium/compendium.json`

### Mismatch D: Utility and native layers still reach into primitives

- `src/native-elements/tooltip/styles.css`
- `src/utils/loading.css`
- `src/native-elements/output/styles.css`
- `src/native-elements/nav/styles.css`

## Advice

### 1. Officially document the real VB color model

Do not refactor toward the article's two-layer model literally if it means throwing away VB's seed-and-derive strengths.

Instead, document the real system as:

1. primitive neutrals and parametric brand seeds
2. derived brand slots
3. semantic UI tokens
4. component-local tokens

Make this explicit in:

- `site/src/pages/docs/tokens/index.njk`
- `site/src/pages/docs/themes/index.njk`
- `site/src/pages/docs/principles.njk`

### 2. Decide whether `surface-alt` and `border-muted` are real public semantic tokens

This should be the first implementation decision.

Recommended answer: yes.

Reason:

- they are already used broadly
- themes already override them
- demos and fixtures already depend on them
- they represent legitimate semantic concepts

If accepted, define them in base core tokens with sane defaults in `src/tokens/colors.css` or `src/tokens/color-mix.css`, then document them everywhere.

If not accepted, remove or replace usages with existing tokens and stop themes from defining them.

### 3. Separate public semantic tokens from theme-private decorative tokens

Tokens like these should not casually live in the public semantic namespace unless they are part of the official contract:

- `--color-lavender`
- `--color-peach`
- `--color-sky`

Recommended rule:

- public cross-theme tokens stay in the base `--color-*` contract
- theme-private decorative colors should use a theme or pack namespace
  - examples: `--kawaii-lavender`, `--memphis-paper`, `--theme-accent-2`

That keeps the semantic color namespace from turning into an unbounded palette bucket.

### 4. Tighten component-layer discipline

Preferred usage order inside components and utilities:

1. component-local token
2. semantic UI token
3. brand slot only if brand meaning is intentional
4. primitive only for very low-level infrastructure or explicit demos
5. raw color literal only in token files, theme files, or isolated static fallback artifacts

Concrete cleanup targets:

- migrate tooltip surfaces from gray primitives to semantic surface/text tokens
- migrate loading/skeleton states to declared neutral or subtle semantic tokens
- migrate output/status variants to `--status-*-bg` and semantic status colors
- remove hardcoded warning foregrounds where a token should exist

### 5. Use the existing lint pattern to enforce token discipline

The repo already has `npm run lint:theme-tokens`. Extend that approach.

Add checks for:

- use of undeclared `--color-*` tokens in themes and component layers
- use of raw `oklch()`, `hsl()`, `rgb()`, or hex in component and utility layers
- use of `var(--color-gray-*)` in components outside approved low-level files
- docs examples that teach direct overrides of derived tokens when a seed override should be used instead

This should be a structural rule, not a style suggestion.

### 6. Make the token docs honest about token categories

The current token docs emphasize:

- grays
- semantic colors
- brand colors
- status colors

That is not wrong, but it is incomplete.

The docs should explicitly show:

- seed inputs
- derived brand slots
- semantic UI tokens
- derived helper tokens from `src/tokens/color-mix.css`

Otherwise contributors will keep discovering the real system from source code instead of learning it from docs.

### 7. Treat static fallback artifacts as a separate category

Some `static.html` files and baseline artifacts use raw hex values. That is not the same category of issue as component-layer token drift.

Recommended rule:

- standalone no-framework fallback artifacts may use simple local colors if they are intentionally self-contained
- tokenized framework layers should not use raw colors unless they are defining tokens

That distinction keeps the cleanup pragmatic.

## Recommended Refactor Program

### Phase 1: Fix the contract

- define or remove `--color-surface-alt`
- define or remove `--color-border-muted`
- decide which other `--color-*` names are truly public
- update `src/tokens/index.css` so the written contract matches reality

### Phase 2: Fix the docs

- rewrite the themes docs to prefer seed overrides
- add a clear explanation of the three-layer model to token docs
- document which `--color-*` tokens are public and guaranteed
- document which tokens are theme-private and not portable

### Phase 3: Fix the worst layer violations

- `src/native-elements/tooltip/styles.css`
- `src/utils/loading.css`
- `src/native-elements/output/styles.css`
- `src/custom-elements/status-message/styles.css`
- `src/web-components/combo-box/styles.css`
- `src/web-components/theme-picker/styles.css`

### Phase 4: Add enforcement

- lint for undeclared semantic tokens
- lint for raw color literals in component layers
- lint for primitive-overuse in component layers
- keep `lint:theme-tokens`, but extend it beyond dark/light coverage

## Acceptance Criteria

The color system should be considered repaired when all of the following are true:

- every public `--color-*` token used in components, docs, or demos is defined in the base token contract
- public docs describe the real architecture, not a simplified but misleading one
- core brand themes primarily use seeds, not repeated direct overrides of derived brand tokens
- component and utility layers mostly consume semantic tokens or component-local tokens
- theme-private decorative colors no longer masquerade as public semantic tokens
- linting can catch contract drift automatically

## Bottom Line

Vanilla Breeze is already closer to the article's ideal than many systems. The repo clearly wants a disciplined primitive-to-semantic color architecture, and the core token files mostly reflect that.

The real problem is not that VB chose the wrong color philosophy. The real problem is that the repo now has three different stories at once:

- the architecture core CSS is actually using
- the architecture the docs say exists
- the architecture themes and components sometimes ignore

The refactor should focus on making those three stories match.
