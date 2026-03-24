# Event Refactor Brief

## Objective

Review Vanilla Breeze's custom-event naming and define a clean-break refactor so the event surface is regular, predictable, and easier to document.

This is mostly a naming and contract problem, not a "rewrite all events" problem. Because the product is unreleased, this brief assumes direct renames and removals rather than compatibility aliases.

## Short Version

Vanilla Breeze already has one strong pattern:

- most host component events use `tag-name:action`

Examples:

- `combo-box:open`
- `context-menu:select`
- `drag-surface:reorder`
- `data-table:sort`
- `image-map:area-activate`

That should remain the default public pattern.

The main inconsistencies are:

1. global/shared events are not consistently namespaced
2. a few host components use `vb:` even though most host components use their tag name
3. some utility events still use legacy `feature-action` naming instead of `feature:action`
4. one event reuses a native event name (`copy`)
5. one event uses the wrong component prefix for the emitter (`chat-input:error` emitted by `chat-window`)
6. a few events leak undocumented or duplicate sub-APIs

## Recommended Naming Contract

### 1. Host custom elements

If an event is dispatched from a custom element host and intended for consumers, use:

- `tag-name:action`

Examples:

- `tab-set:change`
- `share-wc:success`
- `theme-picker:open`

This is already the dominant repo pattern. Keep it.

### 2. Framework-wide or shared global channels

If an event is dispatched on `window` or `document` as a shared framework bus, use:

- `vb:<feature>-<action>`

Examples:

- `vb:theme-change`
- `vb:extensions-change`
- `vb:a11y-themes-change`
- `vb:command-registry-change`

Reason:

- these are not tied to one host element
- they should be clearly distinguishable from local component events
- VB already uses this idea in `vb:locale-change` and `vb:submit`

### 3. Utility/enhancement events on arbitrary elements

If an event is dispatched from an arbitrary enhanced native element rather than a custom element host, prefer:

- `feature:action`

Examples:

- `highlights:added`
- `math:rendered`
- `wizard:step-change`

This is more regular than legacy forms like `rating-change` or `spoiler-toggle`.

### 4. Platform-compatibility exceptions

Events that intentionally mirror a platform or proposal API can remain exempt:

- `interest`
- `loseinterest`

Gesture primitives can also remain DOM-like if VB intentionally treats them as low-level interaction signals:

- `swipe-left`
- `swipe-right`
- `swipe-up`
- `swipe-down`
- `swipe-dismiss`
- `long-press`

These are better thought of as interaction primitives than component API events.

### 5. Collision rule

Do not invent bare custom event names that collide with native events or feel native-adjacent unless the goal is explicit polyfill compatibility.

The clearest current violation is:

- `copy`

## What Already Aligns Well

These public families are already consistent and should not be churned without a concrete reason:

- `accordion-wc:*`
- `carousel-wc:*`
- `combo-box:*`
- `command-palette:*`
- `compare-surface:*`
- `consent-banner:*`
- `content-swap:*`
- `context-menu:*`
- `data-table:*`
- `drag-surface:*`
- `drop-down:*`
- `emoji-picker:*`
- `geo-map:*`
- `heading-links:*`
- `image-map:*`
- `page-info:*`
- `page-toc:*`
- `share-wc:*`
- `site-search:*`
- `slide-accept:*`
- `split-surface:*`
- `tab-set:*`
- `theme-picker:*`
- `toast-msg:*`
- `text-reader:*`

`highlights:*` and `math:rendered` are also good examples for utility-style events.

## Findings

### 1. Global shared events are inconsistent

Current shared/global names include:

- `theme-change`
- `extensions-change`
- `a11y-themes-change`
- `command-registry-change`
- `vb:locale-change`
- `vb:submit`

This is the clearest repo-wide regularity problem.

Files:

- `src/lib/theme-manager.js`
- `src/web-components/settings-panel/logic.js`
- `src/web-components/theme-picker/logic.js`
- `src/utils/command-init.js`
- `src/lib/i18n.js`
- `src/lib/form-validation.js`

Recommendation:

- standardize shared channels on `vb:*`

Target names:

- `theme-change` -> `vb:theme-change`
- `extensions-change` -> `vb:extensions-change`
- `a11y-themes-change` -> `vb:a11y-themes-change`
- `command-registry-change` -> `vb:command-registry-change`

Keep:

- `vb:locale-change`
- `vb:submit`

### 2. Some host components use `vb:` while most host components use their tag name

Current host-level outliers:

- `vb:audio:*`
- `vb:video:*`
- `vb:reader:*`

Files:

- `src/web-components/audio-player/logic.js`
- `src/web-components/video-player/logic.js`
- `src/web-components/reader-view/logic.js`

These are fired from the component hosts themselves, not from a framework bus. That makes them inconsistent with the rest of the public component API.

Recommendation:

- move them to tag-prefixed host events

Target names:

- `vb:audio:play` -> `audio-player:play`
- `vb:audio:pause` -> `audio-player:pause`
- `vb:audio:ended` -> `audio-player:ended`
- `vb:audio:track-change` -> `audio-player:track-change`
- `vb:video:play` -> `video-player:play`
- `vb:video:pause` -> `video-player:pause`
- `vb:video:ended` -> `video-player:ended`
- `vb:video:track-change` -> `video-player:track-change`
- `vb:video:fullscreen` -> `video-player:fullscreen`
- `vb:video:speed` -> `video-player:speed`
- `vb:video:captions` -> `video-player:captions`
- `vb:reader:mode` -> `reader-view:mode`
- `vb:reader:page` -> `reader-view:page`
- `vb:reader:font` -> `reader-view:font`

This is a naming cleanup, not an event-model rewrite.

### 3. One component emits an event with the wrong prefix

`chat-window` currently emits:

- `chat-input:error`

File:

- `src/web-components/chat-window/logic.js`

That is the wrong public prefix for the emitter. `chat-window` is the component dispatching it, and the error is about its response/fetch flow, not `chat-input`'s local input behavior.

Recommendation:

- rename to `chat-window:error`

If more specificity is wanted:

- `chat-window:response-error`

But the minimum cleanup is to stop emitting a `chat-input:*` event from `chat-window`.

### 4. `copy` is a collision-prone bare custom event

`data-copy` currently dispatches:

- `copy`

Files:

- `src/utils/copy-init.js`
- `site/src/pages/docs/attributes/data-copy.njk`

Problem:

- `copy` is already a real browser event
- consumers reading `addEventListener('copy', ...)` cannot tell if they are handling clipboard-native behavior or VB's success signal
- the current name does not encode success/failure timing

Recommendation:

- rename to `copy:success`

If VB wants all generic enhancement events to use framework prefix instead:

- `vb:copy-success`

But do not keep bare `copy` as the long-term public name.

### 5. Utility event grammar is split between `feature:action` and `feature-action`

Current utility-style events include:

- `highlights:added`
- `math:rendered`
- `rating-change`
- `select-all-change`
- `spoiler-toggle`
- `wizard:stepchange`

This is not catastrophic, but it is inconsistent.

Recommendation:

- prefer `feature:action`
- hyphenate multiword actions after the colon

Target normalizations:

- `rating-change` -> `rating:change`
- `select-all-change` -> `select-all:change`
- `spoiler-toggle` -> `spoiler:toggle`
- `wizard:stepchange` -> `wizard:step-change`

Keep:

- `wizard:complete`
- `wizard:reset`

These are already fine.

This is a medium-priority normalization pass after the higher-value bus, host-prefix, and collision fixes.

### 6. A few event names do not match their timing

These currently fire after work is completed:

- `card-list:render`
- `include-file:load`

Files:

- `src/web-components/card-list/logic.js`
- `src/web-components/include-file/logic.js`

But the names read more like command or lifecycle hooks than post-completion notifications.

Recommendation:

- prefer completed-form names for completed async/render work

Possible targets:

- `card-list:render` -> `card-list:rendered`
- `include-file:load` -> `include-file:loaded`

This is lower priority than the prefix and collision fixes, but it would make the API surface more readable.

### 7. `tool-tip` currently leaks an undocumented side-channel

Public docs describe:

- `tool-tip:show`
- `tool-tip:hide`

But runtime also emits:

- `tool-tip:hover-show`
- `tool-tip:hover-hide`

File:

- `src/web-components/tool-tip/logic.js`

Problems:

- this creates two parallel naming families for the same host
- the extra pair is undocumented
- the implementation appears to dispatch show/hide events in both `show()` / `hide()` and the popover `toggle` handler, which likely duplicates notifications

Recommendation:

- keep one public family only
- either remove the hover-specific events entirely or make them internal-only
- ensure `tool-tip:show` / `tool-tip:hide` fire once per transition

### 8. Some event channels are effectively internal and should be treated that way

Examples:

- `command-registry-change`
- `composer:select`
- `composer:change`

If these remain event-based coordination channels, name them consistently. But only the first one currently looks like a framework-level shared contract.

Recommendation:

- `command-registry-change` should either become `vb:command-registry-change` and be documented as a real public bus event
- or remain internal and stop being treated like a casual public string literal

## High-Priority Cleanup

These are the changes worth doing first because they improve consistency without forcing large conceptual churn.

### 1. Normalize global/shared channels

- `theme-change` -> `vb:theme-change`
- `extensions-change` -> `vb:extensions-change`
- `a11y-themes-change` -> `vb:a11y-themes-change`
- `command-registry-change` -> `vb:command-registry-change`

Primary files:

- `src/lib/theme-manager.js`
- `src/lib/environment-manager.js`
- `src/utils/external-theme-sync.js`
- `src/web-components/settings-panel/logic.js`
- `src/web-components/theme-picker/logic.js`
- `src/web-components/command-palette/logic.js`
- `src/web-components/icon-wc/icon-wc.js`
- `src/web-components/audio-player/logic.js`
- `src/web-components/audio-visualizer/logic.js`
- `src/web-components/video-player/logic.js`

### 2. Normalize host-element outliers

- `vb:audio:*` -> `audio-player:*`
- `vb:video:*` -> `video-player:*`
- `vb:reader:*` -> `reader-view:*`

Primary files:

- `src/web-components/audio-player/logic.js`
- `src/web-components/video-player/logic.js`
- `src/web-components/reader-view/logic.js`
- related docs pages under `site/src/pages/docs/elements/web-components/`

### 3. Fix wrong-emitter prefix

- `chat-input:error` -> `chat-window:error`

Primary files:

- `src/web-components/chat-window/logic.js`
- `site/src/pages/docs/elements/web-components/chat-window.njk`

### 4. Remove native collision

- `copy` -> `copy:success`

Primary files:

- `src/utils/copy-init.js`
- `site/src/pages/docs/attributes/data-copy.njk`

### 5. Collapse `tool-tip` to one public event family

- keep `tool-tip:show`
- keep `tool-tip:hide`
- remove or internalize `tool-tip:hover-show`
- remove or internalize `tool-tip:hover-hide`
- fix duplicate firing while there

Primary files:

- `src/web-components/tool-tip/logic.js`
- `site/src/pages/docs/elements/web-components/tooltip.njk`

## Medium-Priority Normalization

These are good cleanup targets, but they should not block the higher-priority contract fixes.

- `rating-change` -> `rating:change`
- `select-all-change` -> `select-all:change`
- `spoiler-toggle` -> `spoiler:toggle`
- `wizard:stepchange` -> `wizard:step-change`
- `card-list:render` -> `card-list:rendered`
- `include-file:load` -> `include-file:loaded`

Because the product is unreleased, these should be renamed directly rather than preserved behind legacy aliases.

## Documentation And Test Sweep

Any rename pass needs a coordinated docs/tests update. The main public docs likely affected are:

- `site/src/pages/docs/elements/web-components/audio-player.njk`
- `site/src/pages/docs/elements/web-components/video-player.njk`
- `site/src/pages/docs/elements/web-components/reader-view.njk`
- `site/src/pages/docs/elements/web-components/theme-picker.njk`
- `site/src/pages/docs/elements/web-components/settings-panel.njk`
- `site/src/pages/docs/elements/native/html.njk`
- `site/src/pages/docs/attributes/data-copy.njk`
- `site/src/pages/docs/elements/web-components/chat-window.njk`
- `site/src/pages/docs/elements/web-components/tooltip.njk`
- `site/src/pages/docs/elements/web-components/card-list.njk`
- `site/src/pages/docs/elements/web-components/include-file.njk`
- `site/src/pages/docs/attributes/data-select-all.njk`
- `site/src/pages/docs/attributes/data-spoiler.njk`
- `site/src/pages/docs/attributes/data-wizard.njk`
- `site/src/pages/docs/elements/web-components/rating.njk`

Likely tests and fixtures affected:

- `tests/components/include-file.spec.js`
- `tests/components/lifecycle-reconnect.spec.js`
- `tests/components/consent-banner.spec.js`
- `tests/components/heading-links.spec.js`
- `tests/components/drag-surface.spec.js`
- `tests/unit/vb-gestures.test.js`
- any demos under `demos/examples/demos/` and `demos/snippets/demos/` listening for renamed events

## Clean-Break Rule

This should be treated as a direct contract cleanup.

Recommended approach:

1. Rename events to their canonical target names in runtime code.
2. Remove the old names instead of dual-dispatching aliases.
3. Update docs, demos, tests, and API metadata in the same pass.
4. Treat any listener still using the old names as broken and fix it immediately.
5. Reject new event names that do not follow the canonical patterns in this brief.

## Acceptance Criteria

The event surface should be considered aligned when:

- host component events consistently use `tag-name:action`
- shared global channels consistently use `vb:*`
- no public custom event reuses a native event name like `copy`
- no component emits an event with another component's prefix
- multiword action names are hyphenated consistently
- docs, demos, tests, and API metadata all describe the same canonical names
- old irregular names are removed rather than carried as aliases
- undocumented side-channel names like `tool-tip:hover-show` are either documented intentionally or removed from the public surface

## Bottom Line

The repo does not need a wholesale event redesign. Most of the public event surface is already in good shape.

The cleanup should focus on a small number of structural inconsistencies:

- global bus names
- host-component outliers using `vb:`
- one wrong-prefix emission
- one native collision
- a handful of legacy utility names

Fixing those will make the event model feel regular without destabilizing the parts of the API that are already coherent.
