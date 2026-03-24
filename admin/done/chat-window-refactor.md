# Chat Window Refactor Brief

## Objective

Keep `chat-window` aligned with Vanilla Breeze's actual philosophy:

- `chat-window` is a light-DOM shell that composes existing chat primitives
- `chat-thread`, `chat-message`, `chat-bubble`, and `chat-input` remain the real content structure
- launcher dialogs, history drawers, sidebars, and other application shell concerns stay outside the component

The refactor should make that shell more reliable and more honest about its contracts. It should not turn `chat-window` into a full chat application framework.

The next implementation should deliver all of the following before any extra polish work:

- The repo tells one clear authored-markup and baseline story.
- The shell has an explicit and composable transport contract.
- Participant identity assumptions are either documented clearly or made configurable.
- Public events and docs describe the real orchestration surface.
- Tests protect the main shell seams instead of only relying on demos.

## Files To Read First

- `src/web-components/chat-window/logic.js`
- `src/web-components/chat-window/styles.css`
- `src/web-components/chat-window/static.html`
- `site/src/pages/docs/elements/web-components/chat-window.njk`
- `site/src/pages/docs/patterns/application/chat.njk`
- `demos/examples/demos/chat-window-basic.html`
- `src/htmlvalidate/elements.cjs`

Also note:

- I did not find component-specific behavior tests for `chat-window`
- I did not find a `chat-window` entry in `tests/element-visual/compendium/compendium.json`

## What To Preserve

These parts are conceptually right and should survive the refactor:

- The component is a light-DOM orchestrator rather than a Shadow DOM widget.
- The consumer still sizes the container and `chat-window` fills it.
- Server-rendered messages can hydrate in place.
- Participant labels derived from `data-from` are a useful shell concern.
- The application-level shells shown in the chat pattern docs belong outside `chat-window`, not inside it.

The main problem is not that `chat-window` is compositional. The problem is that some of its repo contracts are still ambiguous.

## Current Failures

### 1. The repo tells two different baseline stories

Evidence:

- The component docs and demos use authored `chat-thread` + `chat-input` composition
- `site/src/pages/docs/elements/web-components/chat-window.njk`
- `site/src/pages/docs/patterns/application/chat.njk`
- `demos/examples/demos/chat-window-basic.html`
- The static artifact instead presents a plain ordered list plus a normal form as "the baseline"
- `src/web-components/chat-window/static.html`

Why this is bad:

- The static fallback idea is directionally good, but it is not the same markup contract the runtime docs are actually teaching.
- That makes it harder to reason about what should be preserved during refactor.
- In VB, the authored baseline story should be explicit, not half conceptual and half shipped.

### 2. The transport contract is too implicit for a component described as an orchestrating shell

Evidence:

- `#handleSend()` appends the user message, creates the typing message, disables input, and then fetches `endpoint` if present
- If no `endpoint` is present, the typing message is left in place for "consumer JS to handle"
- The docs only document `chat-window:model-change`
- `src/web-components/chat-window/logic.js`
- `site/src/pages/docs/elements/web-components/chat-window.njk`

Why this is bad:

- The component claims to be a shell, but the main orchestration path is still tightly shaped around one built-in `fetch()` flow.
- The alternative path is not a first-class documented contract.
- Streaming, WebSocket, worker, or custom transport integrations do not currently have a clear handoff surface.

This does not mean `chat-window` should become a networking framework. It does mean the shell needs one explicit way to hand control back to the consumer.

### 3. Participant identity currently depends on hidden assumptions

Evidence:

- User messages are always created with `fromId = "user"`
- Agent typing state resolves the first participant whose role is `"agent"`
- The docs describe participant keys as arbitrary IDs used in `data-from`
- `src/web-components/chat-window/logic.js`
- `site/src/pages/docs/elements/web-components/chat-window.njk`

Why this is bad:

- The docs imply a flexible participant map, but the runtime still assumes one canonical local user ID and one implicitly chosen agent.
- If a page uses a different local user key, the shell contract becomes surprising.
- This is a shell-level data-model leak, not just a naming nit.

### 4. The event contract is incomplete and slightly misaligned

Evidence:

- The docs only list `chat-window:model-change`
- The runtime dispatches `chat-input:error`
- The shell also consumes `chat-input:send` internally
- `site/src/pages/docs/elements/web-components/chat-window.njk`
- `src/web-components/chat-window/logic.js`

Why this is bad:

- The component's public orchestration surface is underspecified.
- The emitted error event is named after `chat-input`, even though `chat-window` is the component dispatching it.
- Consumers trying to build richer shells have to infer too much from the code.

### 5. `model` sync is not a fully explicit public contract

Evidence:

- The docs say the select syncs bidirectionally with `model`
- Initial sync happens in `#syncModel()`
- User changes sync through `#handleModelChange()`
- The property setter updates the select
- There is no attribute observation path if `model` is mutated directly after connect
- `src/web-components/chat-window/logic.js`
- `site/src/pages/docs/elements/web-components/chat-window.njk`

Why this is bad:

- The code mostly supports a property-driven contract, but the docs read more like generic bidirectional host attr sync.
- In VB, this does not require framework-style reactivity.
- It does require the repo to say clearly whether `model` is a connect-time attribute, a property API, or both.

### 6. The test surface does not protect the important shell seams

Evidence:

- I did not find component behavior tests for `chat-window`
- I did not find compendium coverage for `chat-window`
- The current confidence surface is mostly docs and demos

Why this is bad:

- The main risk areas here are not purely visual.
- Participant resolution, transport handoff, event semantics, and empty-state behavior need automated coverage.

## Recommended Refactor Direction

## 1. Keep `chat-window` as a shell, not an app

Recommended direction:

- preserve light-DOM composition
- preserve external dialog/sidebar/history shells
- preserve the current sizing model

Do not fold launcher, history, or transport frameworks into this component.

## 2. Pick one honest baseline story and document it clearly

The repo should explicitly say one of these:

- the real shipped baseline is the composed custom-element structure, or
- the plain form/list in `static.html` is only a conceptual fallback reference

Either answer can work. The current ambiguity is the problem.

## 3. Make the transport seam explicit

The refactor should provide a documented shell contract for non-`fetch()` flows.

That could be:

- a documented outbound event from `chat-window`
- a documented "consumer owns response population" hook
- a small helper API for resolving or replacing the built typing state

The important part is not which shape wins. The important part is that endpoint-driven and consumer-driven flows stop feeling accidental.

## 4. Remove or document hidden participant assumptions

Required outcome:

- the local user identity is not silently hard-coded, or
- that contract is made explicit in docs and examples

The same applies to agent selection.

## 5. Align the public event and model contract

The docs should say clearly:

- what events `chat-window` emits
- which ones are public
- whether `model` is property-driven, attribute-driven, or both

That is a better VB outcome than adding a lot of generic reactive API surface.

## Suggested Implementation Sequence

1. Decide and document the real baseline story.
2. Define a clear public transport handoff contract for endpoint-less or custom transport flows.
3. Fix the participant identity assumptions.
4. Align the public event names and docs with the runtime.
5. Clarify the `model` contract.
6. Add behavior tests for transport, participant resolution, and empty-state behavior.

## Acceptance Criteria

Claude should not call the refactor done until all of these are true:

- The docs describe one clear authored baseline story for `chat-window`.
- Custom transport usage is possible through an explicit, documented shell seam.
- Participant ID expectations are not hidden.
- Public events are documented and named coherently.
- `model` behavior is clearly documented as attribute-driven, property-driven, or both.
- Tests cover the main orchestration seams instead of relying only on demos.

## Tests That Should Exist After The Refactor

At minimum add automated coverage for:

- SSR participant-label resolution
- empty state appearing and clearing correctly
- built-in `endpoint` flow success
- built-in `endpoint` flow failure
- custom transport / no-endpoint handoff behavior
- participant maps whose local user key is not literally `"user"`, if that flexibility remains supported
- `model` sync under the documented API contract

## Do Not Do This

- Do not turn `chat-window` into a full app shell with built-in launcher, history, and layout opinions.
- Do not collapse `chat-thread` and `chat-input` into a more monolithic widget.
- Do not leave the custom transport path implicit.
- Do not keep hidden participant-ID assumptions if the docs continue to present IDs as flexible.

## Bottom Line

The right refactor for `chat-window` is to keep it as a composition shell, then make its real contracts explicit: one baseline story, one transport seam, one participant model story, and real test coverage around those boundaries.
