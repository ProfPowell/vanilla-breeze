# Social Embed Refactor Brief

## Objective

Keep `social-embed` aligned with Vanilla Breeze's actual philosophy:

- authored fallback content, usually a normal link, is the real baseline
- the component adds a privacy-conscious activation layer on top of that baseline
- provider-specific embedding stays in a small registry rather than turning the host into a generic third-party widget platform

The refactor should make that enhancement reliable and honest. It should not turn `social-embed` into a much larger embed framework.

The next implementation should deliver all of the following before any extra polish work:

- click-to-activate works without fighting the fallback link
- the original authored fallback survives errors, reconnects, and retries
- lifecycle is idempotent across connect, disconnect, and reconnect
- theme behavior matches the repo's actual theme model or is documented more narrowly
- docs and tests explain the privacy and trust boundary clearly

## Files To Read First

- `src/web-components/social-embed/logic.js`
- `src/web-components/social-embed/styles.css`
- `src/web-components/social-embed/providers/bluesky.js`
- `src/web-components/social-embed/providers/mastodon.js`
- `src/web-components/social-embed/providers/x.js`
- `src/web-components/social-embed/providers/instagram.js`
- `src/web-components/social-embed/providers/youtube.js`
- `site/src/pages/docs/elements/web-components/social-embed.njk`
- `demos/examples/demos/social-embed.html`
- `src/htmlvalidate/elements.cjs`
- `tests/element-visual/compendium/compendium.json`

Also note:

- I did not find `src/web-components/social-embed/static.html`
- I did not find component-specific behavior tests for `social-embed`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The authored fallback link is the correct baseline.
- Click-to-activate by default is the right privacy posture.
- The provider registry is a good small extension point.
- Delegation to `youtube-player` is the right move for YouTube.
- `figure` / `figcaption` composition should continue to work naturally.

The main problem is not the provider model. The problem is that the current activation layer fights the authored baseline in a few important places.

## Current Failures

### 1. Click-to-activate conflicts with the authored fallback link

Evidence:

- The docs and styles say the inner fallback link remains visible as the baseline
- In click mode the host adds a one-time click listener, `role="button"`, and `tabindex="0"`
- The activation click path does not prevent the fallback link's default navigation
- `site/src/pages/docs/elements/web-components/social-embed.njk`
- `src/web-components/social-embed/styles.css`
- `src/web-components/social-embed/logic.js`

Why this is bad:

- The visible fallback is usually an anchor.
- Clicking that visible anchor can navigate away instead of loading the embed.
- That means the main privacy-first enhancement path is fighting the baseline rather than upgrading it.

This is the most important functional issue in the component.

### 2. The original fallback is captured too late and is not preserved robustly

Evidence:

- `#fallback` is assigned from `this.innerHTML` inside `#init()`
- The same host also prepends a live region later
- Loaded providers replace `innerHTML`
- Error recovery restores `this.#fallback`
- `src/web-components/social-embed/logic.js`

Why this is bad:

- The fallback snapshot should represent the original authored content.
- Right now it represents whatever happens to be in the host at init time.
- On reconnect, repeated activation, or later failure, the restored fallback can drift away from the original authored link.

That weakens both the progressive-enhancement story and the privacy story.

### 3. Lifecycle is not idempotent

Evidence:

- `connectedCallback()` has no setup guard
- Click mode installs an anonymous one-time click listener that is not removed in `disconnectedCallback()`
- `disconnectedCallback()` only removes the keydown listener and disconnects the observer
- There is no explicit guard for already-loaded or already-initialized state
- `src/web-components/social-embed/logic.js`

Why this is bad:

- Reconnect can lead to duplicated activation wiring or re-entry into a state the host already passed through.
- A component whose whole purpose is stateful activation needs a cleaner lifecycle than this.

### 4. `theme="auto"` follows system preference, not the repo's actual theme state

Evidence:

- `resolveTheme()` reads only `prefers-color-scheme`
- VB theme state is otherwise managed at the document level through theme utilities
- `src/web-components/social-embed/logic.js`

Why this is bad:

- A VB site can be explicitly set to light or dark independent of OS preference.
- In that situation, `social-embed` can choose a theme that disagrees with the actual page.
- This is a repo-consistency problem, not a generic feature request.

### 5. Error state does not provide a clear retry path

Evidence:

- Click activation uses `{ once: true }`
- On error, the fallback is restored and `state="error"` is set
- There is no explicit rebind or retry mechanism
- `src/web-components/social-embed/logic.js`

Why this is bad:

- A transient provider or network failure can leave the component stuck until reload.
- That is especially awkward for a component whose default behavior is opt-in activation.

### 6. The privacy story is stronger than the trust-boundary story in the docs

Evidence:

- Docs repeatedly describe the component as privacy-first
- Bluesky and Mastodon providers inject remote `oEmbed` HTML directly
- X and Instagram providers inject third-party scripts
- `site/src/pages/docs/elements/web-components/social-embed.njk`
- `src/web-components/social-embed/providers/*.js`

Why this is bad:

- The privacy posture is directionally good, but activation still consents to third-party HTML or script execution.
- The docs should say that more plainly.
- This component should not sound safer than it really is.

### 7. The test surface is too thin for the actual risk areas

Evidence:

- I found visual compendium coverage
- I did not find component-specific behavior tests

Why this is bad:

- The important bugs here are activation, fallback preservation, retry, and error recovery.
- Visual fixtures will not catch those seams reliably.

## Recommended Refactor Direction

## 1. Preserve the authored fallback as the real source of truth

Recommended direction:

- snapshot the original authored fallback once, early, and intentionally
- preserve that snapshot through load, error, disconnect, and reconnect
- treat the fallback as a stable authored contract, not temporary innerHTML

This is the core VB principle in this component.

## 2. Separate activation UI from fallback navigation semantics

The component needs one coherent answer for click mode.

Possible valid approaches:

- add an explicit activation affordance separate from the fallback link
- intercept and repurpose fallback-link activation deliberately
- render an activation button over the fallback surface while keeping the link available as a secondary option

Any of those can work. The current "visible link plus host click gate" conflict should not remain.

## 3. Make the lifecycle idempotent

Required fixes:

- connect should not stack activation wiring
- disconnect should remove what connect added
- reconnect should not lose the authored fallback or reinitialize the host accidentally

## 4. Decide what `theme="auto"` really means in VB

Pick one and document it clearly:

- auto follows the VB site theme state
- auto follows system preference only

The first option is usually more consistent with the rest of the repo. The important part is that the contract is deliberate.

## 5. Make retry behavior explicit

Error state should either:

- allow the user to retry activation, or
- document clearly that failure falls back to normal link navigation only

The current half-state is not strong enough.

## 6. Document the trust boundary as clearly as the privacy boundary

The docs should say plainly:

- when third-party requests begin
- when third-party scripts execute
- when remote HTML is injected

That is more important than adding more provider features.

## Suggested Implementation Sequence

1. Fix the click-gate vs fallback-link conflict.
2. Preserve the original authored fallback through a stable lifecycle snapshot.
3. Make connect / disconnect / reconnect idempotent.
4. Decide and implement the `theme="auto"` contract.
5. Add explicit retry behavior or document the no-retry choice.
6. Tighten docs around privacy, trust, and activation.
7. Add behavior tests for activation and error recovery.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- Click mode does not fight the authored fallback link.
- Error recovery restores the original authored fallback, not a mutated later snapshot.
- Reconnect does not stack listeners or reset the component into a confused state.
- `theme="auto"` matches a clearly documented source of truth.
- Error handling has a deliberate retry or fallback-navigation story.
- Docs describe both privacy posture and trust boundary honestly.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- click activation when the fallback content is an anchor
- visible activation
- eager activation
- error recovery restoring the original authored fallback
- reconnect after idle state
- reconnect after loaded state
- retry behavior after failure, if retry remains supported
- theme resolution under explicit light, explicit dark, and auto modes

## Do Not Do This

- Do not throw away the authored fallback link in favor of a widget-only baseline.
- Do not expand `social-embed` into a generic remote-content platform.
- Do not keep the current click-to-activate conflict with the visible anchor.
- Do not describe the component as privacy-safe without also documenting the third-party HTML/script boundary.

## Bottom Line

The right refactor for `social-embed` is to keep the current privacy-first shape, then make it actually behave like progressive enhancement: the fallback stays authoritative, activation is intentional, lifecycle is reversible, and the docs are honest about what gets loaded and executed.
