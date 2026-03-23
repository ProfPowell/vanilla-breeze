# Short Cuts Refactor Brief

## Objective

Keep `short-cuts` aligned with Vanilla Breeze's actual philosophy:

- the real baseline is the page's existing command affordances and labels
- `short-cuts` is an optional discoverability overlay over that command system
- the component should stay small: a `?` hotkey, a dialog, and a read-only view of registered shortcuts

The refactor should make that overlay reliable and honest. It should not turn `short-cuts` into a second command registry or a heavier application shell.

The next implementation should deliver all of the following before any extra polish work:

- the repo tells the real baseline story for the component
- connect, disconnect, and reconnect are idempotent
- the singleton nature of the overlay is either enforced or documented explicitly
- the dependency on the command registry is described as part of the intended layer model
- tests protect lifecycle and registry seams, not just visuals

## Files To Read First

- `src/web-components/short-cuts/logic.js`
- `src/web-components/short-cuts/styles.css`
- `src/web-components/short-cuts/static.html`
- `site/src/pages/docs/elements/web-components/shortcuts.njk`
- `demos/examples/demos/short-cuts-basic.html`
- `src/utils/hotkey-bind.js`
- `src/utils/command-init.js`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

Also note:

- I did not find component-specific behavior tests for `short-cuts`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The component is intentionally tiny.
- A native `dialog` is the right surface for the overlay.
- Platform-aware shortcut formatting belongs here.
- Reading from the command registry is better than inventing a second source of truth.
- The user should still be able to ignore this component entirely and use the page normally.

The main problem is not that `short-cuts` is small. The problem is that its baseline and lifecycle contracts are still blurry.

## Current Failures

### 1. The repo is not telling the real baseline story

Evidence:

- The docs say `short-cuts` renders nothing visible and only binds `?`
- The stylesheet hides `short-cuts:not(:defined)`
- The static artifact presents a fully rendered shortcuts table as "the baseline"
- `site/src/pages/docs/elements/web-components/shortcuts.njk`
- `src/web-components/short-cuts/styles.css`
- `src/web-components/short-cuts/static.html`

Why this is bad:

- The real baseline is not a hidden empty element plus a magically available table.
- The real baseline is that the page's commands still exist and remain usable without the overlay.
- In VB, the enhancement story should be honest about where the baseline actually lives.

### 2. Lifecycle is not idempotent

Evidence:

- `connectedCallback()` always calls `#build()`
- `#build()` always appends a new `dialog`
- `disconnectedCallback()` only unbinds the hotkey
- There is no teardown that removes the generated dialog
- `src/web-components/short-cuts/logic.js`

Why this is bad:

- Reconnect can duplicate the internal dialog structure.
- A small enhancement component should be especially easy to connect and disconnect safely.

### 3. The component is effectively singleton, but that constraint is only implied

Evidence:

- Docs say "place it once in your layout"
- The runtime binds one global `?` hotkey through `bindHotkey()`
- `bindHotkey()` uses a global binding list with last-connected-wins behavior
- `site/src/pages/docs/elements/web-components/shortcuts.njk`
- `src/web-components/short-cuts/logic.js`
- `src/utils/hotkey-bind.js`

Why this is bad:

- Multiple instances are not really a supported independent model.
- But the runtime does not enforce or clearly document that.
- Hidden singleton behavior is a real contract issue in VB too.

### 4. The registry dependency is architectural, but still feels implicit

Evidence:

- `short-cuts` reads `window.__commandRegistry`
- The command registry is populated by `command-init`
- The docs mention the command registry but do not frame `short-cuts` explicitly as a read-only view over the command system
- `src/web-components/short-cuts/logic.js`
- `src/utils/command-init.js`
- `site/src/pages/docs/elements/web-components/shortcuts.njk`

Why this is bad:

- The component is conceptually fine as a thin registry viewer.
- But the repo contract should say that directly.
- Otherwise future refactors can drift toward duplicating command discovery or ownership.

### 5. The test surface does not protect the real risk areas

Evidence:

- I found visual compendium coverage
- I did not find behavior tests for reconnect, multiple instances, or command-registry updates

Why this is bad:

- The main risks here are global hotkey ownership and lifecycle.
- Visual fixtures do not protect those seams.

## Recommended Refactor Direction

## 1. Treat `short-cuts` as a JS-only discoverability overlay

Recommended direction:

- preserve the overlay role
- preserve the invisible host
- stop implying that the host itself contains the no-JS baseline

The actual baseline lives in the page's commands, labels, menus, and help content.

## 2. Make build and teardown reversible

Required fixes:

- connect should not append duplicate dialogs
- disconnect should clean up generated DOM or reconnect should reuse it intentionally
- hotkey binding should remain one-per-instance and predictable

## 3. Decide whether the component is truly singleton

Pick one of these:

- enforce one instance and warn or no-op on extras
- support multiple instances intentionally

Given the global `?` overlay model, a deliberate singleton contract is probably the cleanest answer.

## 4. Document the layer model more explicitly

The docs should say clearly:

- `command-init` discovers commands and shortcuts
- the command registry is the source of truth
- `short-cuts` is only a viewer over that registry

That is a better VB explanation than pretending `short-cuts` owns keyboard shortcuts.

## Suggested Implementation Sequence

1. Fix the lifecycle so reconnect does not duplicate dialogs.
2. Decide and document the singleton model.
3. Tighten the docs around the real baseline story.
4. Tighten the docs around the command-registry dependency.
5. Add behavior tests for hotkey binding and reconnect.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- The repo describes the real no-JS baseline honestly.
- Reconnecting a `short-cuts` instance does not duplicate its internal dialog.
- Multiple instances are either prevented or deliberately supported.
- The docs explain that `short-cuts` is a view over the command registry.
- Tests cover lifecycle and global hotkey ownership.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- opening and closing via `?`
- not firing while focus is inside an input or editable region
- reconnect without duplicate dialog creation
- two `short-cuts` instances on one page under the chosen singleton policy
- command registry changes reflected on next open
- dialog close behavior via Escape and backdrop click

## Do Not Do This

- Do not turn `short-cuts` into a second command-discovery system.
- Do not keep the fake table-baseline story if the host is actually hidden before upgrade.
- Do not leave singleton behavior implicit.
- Do not overbuild this component into a larger command center.

## Bottom Line

The right refactor for `short-cuts` is to keep it tiny, then make its actual role explicit: it is an optional JS overlay over the command system, with singleton-like behavior and lifecycle that should be deliberate rather than accidental.
