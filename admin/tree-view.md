# Tree Navigation, Site Map, and ARIA Direction

Date: 2026-04-03
Status: decision memo

## Why this document exists

Vanilla Breeze has a proposed `tree-view` web component in the wishlist, but the framework already supports expandable hierarchical navigation through `nav.tree` and the `site-map` web component.

The open question is not "can we add ARIA?" but "what pattern are we actually trying to build?"

That distinction matters:

- a disclosure-style navigation tree is one thing
- a true ARIA `tree` widget is another

Those patterns have different semantics, keyboard models, and implementation cost.

## Current state in VB

### `nav.tree`

VB already documents and styles a tree navigation pattern built on native `<nav>`, `<details>`, and `<summary>`.

Relevant local references:

- `site/src/pages/docs/elements/native/nav.html`
- `site/src/pages/docs/snippets/html/nav-tree.html`
- `site/src/pages/docs/elements/native/details.html`
- `src/native-elements/nav/styles.css`

Today this pattern gives us:

- real `nav` landmark semantics
- nested list structure
- native disclosure behavior without JavaScript
- native keyboard toggle behavior on `<summary>`
- `aria-current="page"` for the active link
- optional auto-open of the active branch in the docs site

### `site-map`

`site-map` already enhances a nested sitemap structure while keeping a static HTML fallback.

Relevant local references:

- `src/web-components/site-map/logic.js`
- `site/src/pages/docs/elements/web-components/site-map.html`

Today this component gives us:

- current-page marking
- ancestor auto-expand
- expand/collapse-all controls
- a no-JS nested navigation fallback

## What the standards say

The WAI-ARIA Authoring Practices make an important distinction:

1. The ARIA tree pattern is valid for hierarchical widgets.
2. It requires significantly more behavior than a typical expandable site navigation needs.
3. For most site navigation with expandable groups of links, the disclosure pattern is better suited than `role="tree"`.

External references:

- WAI-ARIA Tree View Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
- WAI-ARIA Navigation Treeview Example: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-navigation/
- WAI-ARIA Disclosure Navigation Example: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/

The key warning from the APG navigation treeview example is the one we should follow:

- correct implementation of `tree` requires complex functionality that typical site navigation does not need
- disclosure is better suited for most web sites

That aligns with VB's HTML-first and progressive-enhancement model.

## Decision

We should **not** retrofit `nav.tree` or `site-map` into a full ARIA `tree` widget.

Instead, we should:

1. Keep `nav.tree` as a native disclosure-navigation pattern.
2. Keep `site-map` as a progressive enhancement of nested navigation markup.
3. Improve both patterns so they are clearly accessible and semantically correct without over-applying ARIA.
4. Treat a true `tree-view` as a separate future component only if VB needs an application-style tree widget.

This is the cleanest fit with VB's current architecture and with the "no ARIA is better than bad ARIA" guidance from APG.

## Why not turn `nav.tree` into `role="tree"`

If we assign `role="tree"` to the current pattern, we take on the full tree widget contract:

- roving `tabindex`
- one focusable tree item in the tab order
- arrow-key traversal between visible nodes
- `Home` and `End`
- `aria-expanded` on parent nodes
- `treeitem` and `group` roles
- clear handling of focus vs selection
- likely typeahead for larger trees

That is a different product from "expandable navigation that works as HTML."

If we stop halfway, we make accessibility worse, not better.

## What we should do now

### 1. Reframe the pattern in docs

We should clarify in the docs that:

- `nav.tree` is a collapsible navigation pattern built from native disclosure elements
- it is not an ARIA tree widget
- it is appropriate for docs sidebars, nested nav, and many sitemap cases
- users wanting IDE-like or file-manager-like keyboard interaction need a separate component

This should be stated in:

- `site/src/pages/docs/elements/native/nav.html`
- `site/src/pages/docs/snippets/html/nav-tree.html`
- `site/src/pages/docs/elements/native/details.html`
- `admin/future-wc.md`

### 2. Tighten the `nav.tree` accessibility contract

`nav.tree` should remain mostly native, but we should make the intended contract explicit.

Recommended contract:

- Use `<nav aria-label="...">` for the landmark.
- Use `<ul>` / `<li>` for hierarchy.
- Use `<details>` / `<summary>` only for expandable groups.
- Use `aria-current="page"` on the active leaf link.
- Auto-open the ancestor chain for the active page when helpful.
- Preserve normal tab order across toggles and links.
- Do not add `role="tree"`, `role="treeitem"`, or roving `tabindex`.

Optional enhancement that is still compatible with the disclosure model:

- a small opt-in helper for opening the active branch
- possibly an optional arrow-key convenience mode behind an attribute, but only if it does not replace normal tab behavior and only if documented as additive behavior rather than tree-widget semantics

### 3. Clean up `site-map`

`site-map` is the area most likely to drift into ambiguous semantics.

Current issue:

- some examples place an `<a>` inside `<summary>`

That can create interaction ambiguity because the parent node is trying to be both:

- a disclosure toggle
- a navigation link

We should choose one of these patterns explicitly:

#### Preferred pattern

Parent section labels are toggles only.

- `<summary>` toggles the section
- child pages are links
- leaf nodes are plain links

This is the simpler and safer model.

#### Acceptable alternative

If a parent section must also be navigable, split the controls.

For example:

- one button-like summary/toggle control
- one separate link to the section landing page

But that requires a deliberate markup pattern and documentation. It should not be left implicit.

Recommended `site-map` direction:

- keep current-page marking
- keep ancestor auto-expand
- keep expand/collapse-all controls
- align generated markup and examples around one consistent disclosure-navigation model
- avoid pretending the component is a tree widget unless we build the full keyboard model

### 4. Add explicit accessibility acceptance criteria

For both `nav.tree` and `site-map`, the acceptance criteria should be:

### No JavaScript

- navigation is still usable
- branches can still be expanded and collapsed with native disclosure behavior
- links still navigate
- current page can still be identified when authored with `aria-current`

### Keyboard only

- `Tab` reaches summaries and links in normal document order
- `Enter` or `Space` toggles summaries natively
- focus styling is visible
- expand/collapse controls in `site-map` are reachable and labeled

### Screen reader

- the navigation region has a meaningful accessible name
- current page is exposed via `aria-current="page"`
- expanded and collapsed state is announced via native `<details>` behavior
- no conflicting widget roles are added

### Structure

- nested hierarchy remains valid HTML
- authoring examples do not require invalid or ambiguous interaction patterns

## What we should not do

We should not:

- add `role="tree"` to `nav.tree` without implementing the full tree pattern
- sprinkle `treeitem` / `group` roles onto native list markup as partial ARIA
- replace the current native pattern with a JavaScript-required widget for ordinary site navigation
- claim ARIA-tree compliance for a disclosure navigation pattern

## When a true `tree-view` component would make sense

A real `tree-view` component may still be worth building later, but only for application-style use cases such as:

- file managers
- IDE sidebars
- organizational explorers
- asset browsers
- permission or taxonomy editors

That component should be treated as a separate product with its own spec and tests.

Its contract should include:

- `role="tree"` semantics
- `treeitem` / `group` roles
- roving `tabindex`
- full arrow key navigation
- `Home` / `End`
- optional typeahead
- explicit focus management
- clear single-select or multi-select behavior
- progressive enhancement story documented up front

In other words, if we build `tree-view`, it should be because VB needs a true tree widget, not because `nav.tree` feels incomplete.

## Proposed work plan

### Phase 1: docs and positioning

1. Update `nav.tree` docs to describe it as disclosure navigation, not as an ARIA tree.
2. Update `site-map` docs to make the same distinction.
3. Add a short note to `admin/future-wc.md` clarifying that wishlist `tree-view` means a real app-style widget, not the existing nav pattern.

### Phase 2: markup and example cleanup

1. Review `site-map` examples and remove ambiguous "link inside summary" patterns unless intentionally supported.
2. Standardize `nav.tree` examples around one recommended structure.
3. Ensure all examples use `aria-label` and `aria-current` consistently.

### Phase 3: enhancement polish

1. Keep or generalize ancestor auto-open for active pages.
2. Audit focus-visible treatment for summaries and links.
3. Add regression tests for:
   - no-JS usability
   - current-page marking
   - ancestor auto-open
   - keyboard tab flow

### Phase 4: separate tree widget decision

Only after the disclosure-navigation work is finished:

1. decide whether VB actually needs a true `tree-view`
2. write a dedicated spec
3. build it as a separate component, not as a mutation of `nav.tree`

## Final recommendation

The right move for Vanilla Breeze is:

- improve `nav.tree`
- improve `site-map`
- keep both native-first
- avoid mislabeling disclosure navigation as an ARIA tree
- reserve `tree-view` for a future, explicit, application-style widget

That gives VB the most accessible result with the least architectural distortion.
