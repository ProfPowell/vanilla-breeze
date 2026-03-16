# Vanilla Breeze Code Review

## Scope

This review covered the package/build setup, runtime entry points, custom elements, enhancement utilities, and test infrastructure. I also ran targeted checks:

- `npm run typecheck` -> fails with a large backlog of errors across `src/lib/*` and several web components, especially `audio-player` and `video-player`.
- `npm run lint:js` -> fails on `src/packs/kawaii/kawaii.bundle.js:6` and reports a large warning backlog.
- `npx playwright test tests/components/video-player.spec.js tests/components/youtube-player.spec.js` -> times out waiting for `localhost:5173` while the configured docs dev server starts on `localhost:4321`.

## Fixes

- [Critical] Repair the Playwright harness before trusting UI coverage. `playwright.config.js:15-33` and `tests/element-visual/playwright.config.js:22-36` expect `http://localhost:5173` from `npm run dev`, but `site/package.json:7-10` serves Eleventy on port `4321`. On top of that, `tests/components/youtube-player.spec.js:4` points at `/docs/examples/demos/youtube-player-basic.html` while the demo source lives under `demos/examples/demos/youtube-player-basic.html`. Right now the component and visual suites are effectively broken.

- [Critical] Close the HTML/script injection hole in `src/web-components/include-file/logic.js:69-106`. The component fetches arbitrary HTML, injects it with `innerHTML` / `insertAdjacentHTML`, then re-executes every inline `<script>`. That turns a content include into code execution. Default behavior should be inert HTML only, with explicit opt-in if trusted script execution is ever allowed.

- [Critical] Stop piping chat responses straight into `innerHTML`. `src/web-components/chat-window/logic.js:144-145`, `src/web-components/chat-window/logic.js:178-195`, `src/web-components/chat-window/logic.js:226-295` treat `data.html`, `data.message`, or `data.content` from the endpoint as trusted markup. A compromised endpoint or reflected prompt can XSS the host page. Use text by default, or require a clearly documented trusted-HTML contract.

- [High] Make the main quality gate enforce the checks that currently fail. `package.json:57-67` defines `lint:js` and `typecheck`, but `package.json:63` only runs HTML linting and unit tests. That means the repo can look green while `npm run typecheck` is red and `npm run lint:js` is failing. Fold both into `check` or CI, then burn down the existing backlog.

- [High] Make media components reconnect-safe. `src/web-components/audio-player/logic.js:61-107`, `src/web-components/audio-visualizer/logic.js:66-103`, and `src/web-components/video-player/logic.js:77-146` call `attachShadow()` every time `connectedCallback()` runs. Reattaching or moving those elements will throw because the host already has a shadow root. Build once in the constructor or guard on `this.shadowRoot`.

- [Medium] Remove the CSP-breaking `new Function()` loader from search. `src/web-components/site-search/logic.js:208-211` requires `unsafe-eval` under common CSPs. The fallback guidance is stale too: `src/web-components/site-search/logic.js:216` tells users to run `npm run search:dev`, which does not exist, and `src/web-components/site-search/logic.js:277-280` points Pagefind at `dist` while the project actually indexes `site/_site` (`package.json:49-55`).

- [Medium] Either adopt `registerComponent()` or delete it and guard every `customElements.define()`. `src/main.js:15` exports `registerComponent`, and `src/lib/bundle-registry.js:83-125` implements bundle-aware registration, but the codebase still uses direct `customElements.define()` everywhere, for example `src/web-components/video-player/logic.js:1137`. With full/core/extras/component bundles exposed from `package.json:9-29`, mixed-loading scenarios are fragile and can fail with duplicate-definition errors.

- [Medium] Replace or strengthen the custom sanitizer in `src/web-components/card-list/logic.js:59-79` and `src/web-components/card-list/logic.js:220-224`. It strips obvious `script` and `javascript:` cases, but it is still an ad hoc sanitizer for a feature that explicitly renders HTML from data. If `data-field-html` is intended for untrusted input, move to a vetted sanitizer or make the trusted-only contract explicit.

- [Low] Align developer-facing messages with the actual project commands. Search is the clearest example, but this drift likely exists elsewhere. Mismatched docs, scripts, and test config are what produced the broken Playwright setup above.

## Extensions

- Export the autoload build as a real npm entry point. `scripts/build-cdn.js:479-489` emits `dist/cdn/vanilla-breeze-autoload.js`, and `src/main-autoload.js` documents it, but `package.json:9-29` does not export it. If autoload is public API, add `./autoload-js`; if not, remove the public-facing docs/comments around it.

- Introduce a shared trust-policy layer for HTML-bearing features. `include-file`, `chat-window`, `card-list`, `site-search`, `tool-tip`, `image-map`, and a few others all have their own markup insertion path. A common `renderTrustedHTML()` / sanitizer / policy hook would remove repeated security decisions from component code.

- Add a package-consumer smoke test that works from the published artifact, not the repo root. Running a small fixture from `npm pack` would catch export gaps, bad `sideEffects` metadata, and bundle-loading regressions earlier than the current repo-local scripts do.

- Add a generated component contract manifest: component tag, source file, demo path, docs page, and test file. The current path drift between demos, docs, and tests is exactly the sort of thing a machine-checked manifest can prevent.

- Turn theme/environment preferences into a typed public contract with migration tests. The current typecheck failures around `ThemeManager` and `EnvironmentManager` suggest the data model has outgrown its declared types.

## Missing Features

- Broader component integration coverage. There are 42 web-component directories in `src/web-components`, but only 17 Playwright specs under `tests/components`. Higher-risk components like `data-table`, `site-search`, `settings-panel`, `theme-picker`, `combo-box`, `page-toc`, `toast-msg`, `share-wc`, `chat-window`, and `geo-map` need behavior tests.

- Bundle-composition tests. The project ships full/core/extras/component/autoload variants, but there is no automated proof that common combinations can coexist without duplicate registrations or missing dependencies.

- CSP compatibility mode. Search currently needs `unsafe-eval`, and several components rely on string-based HTML insertion. A documented "strict CSP" compatibility target would force the right architecture decisions.

- Automated accessibility auditing across demos. The repo has a strong accessibility story, but I did not find a recurring axe/pa11y-style check in the main build/test path.

- Reconnect/lifecycle regression tests for custom elements. Media components already show why this matters; custom elements should be exercised through remove/reinsert, not just first render.

- Security/trust-model documentation for HTML-accepting APIs. Today the code often assumes trusted markup, but the docs and component contracts do not consistently say that.

## Recommended Order

1. Fix the Playwright server/path drift so browser tests can run again.
2. Lock down `include-file` and `chat-window` HTML injection paths.
3. Make `check` fail on `lint:js` and `typecheck`, then pay down the current failures.
4. Make media components reconnect-safe.
5. Clean up bundle registration and add bundle-composition tests.
