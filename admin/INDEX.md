# Admin Index

Topical map of everything in `admin/`. Lifecycle-organized (Plan A): folders tell you status, this index gives you the topic-first view.

## Lifecycle folders

- **`reference/`** — Living docs that should always be current. Snapshots of how things work today.
- **`specs/`** — Stable, versioned cross-component contracts (`*-v1.md`). Implementation must conform.
- **`research/`** — Active R&D and exploration. Not yet decided.
- **`plans/`** — Decided and scoped. Ready to start or in-flight. Many of these will become beads epics.
- **`shipped/`** — Implementation landed. Kept as the canonical "how we built X" doc.
- **`archive/`** — Superseded, killed, or completed-and-no-longer-relevant.
- **`related/`** — Cross-project / strategic thinking (not VB-specific work items).
- **`handoffs/`** — Onboarding docs for downstream consumers.
- **`reference-implementations/`** — Runnable backend starter kits (cloudflare, express, dev-stub).

Workflow note: when a `plans/` doc ships, move it to `shipped/`. When a `research/` doc graduates, move it to `plans/`. When a doc is superseded, move it to `archive/` and leave a one-line "why" at the top.

---

## Reference

| Doc | What it is |
|---|---|
| [overview.md](./reference/overview.md) | Project philosophy and core tenets |
| [global-overview.md](./reference/global-overview.md) | Cross-project orientation (zingsoft, ProfPowell, related repos) |
| [syntax.md](./reference/syntax.md) | Definitive catalog of every element, attribute, class, and data-attribute |
| [build-and-deploy.md](./reference/build-and-deploy.md) | The three deploys and what they're locked to |
| [llm-theme-reference.css](./reference/llm-theme-reference.css) | LLM-readable token/theme cheat sheet |
| [attribute-explainer.html](./reference/attribute-explainer.html) | Live attribute reference page |
| [decisions.md](./reference/decisions.md) | Standing decisions on R&D specs (SKOS adoption, etc.) |
| [form-validation.md](./reference/form-validation.md) | Current state of form validation in VB |
| [view-transitions.md](./reference/view-transitions.md) | What view-transition support actually does today |
| [touch.md](./reference/touch.md) | Current touch-input behavior |

## Specs (stable contracts)

| Doc | What it covers |
|---|---|
| [meta-tag-contract-v1.md](./specs/meta-tag-contract-v1.md) | Frontmatter → `<meta>` tag contract for provenance |
| [canonical-document-v1.md](./specs/canonical-document-v1.md) | Canonicalization format for signing |
| [ai-page-tools-v1.md](./specs/ai-page-tools-v1.md) | Cross-component contract for `<ai-*>` components |
| [analytics-viewcount-v1.md](./specs/analytics-viewcount-v1.md) | View-count contract for SKOS topic-index |
| [component-state-conventions.md](./specs/component-state-conventions.md) | Public attributes vs internal `:state()` |
| [data-api-audit.md](./specs/data-api-audit.md) | Per-component JS-first / HTML-first classification |
| [navbar.md](./specs/navbar.md) | `<nav-bar>` v1 spec |

## By topic

### Themes & tokens

- **Research**: [dtcg-tokens-rnd.md](./research/dtcg-tokens-rnd.md), [review-first/css-layout-future.md](./research/review-first/css-layout-future.md), [review-first/os-integration.md](./research/review-first/os-integration.md), [review-first/theme-consistency.md](./research/review-first/theme-consistency.md), [review-first/token-strategy.md](./research/review-first/token-strategy.md), [borders-cursors-scrollbars.html](./research/borders-cursors-scrollbars.html), [vb-theme-extensions.html](./research/vb-theme-extensions.html)
- **Plans**: [dtcg-theme-pipeline-plan.md](./plans/dtcg-theme-pipeline-plan.md), [overrides-demo.md](./plans/overrides-demo.md), [brand-theme/vanilla-breeze-brand-themes-spec.md](./plans/brand-theme/vanilla-breeze-brand-themes-spec.md), [brand-theme/vanilla-breeze-demo-site-spec.md](./plans/brand-theme/vanilla-breeze-demo-site-spec.md), [review-first/os-integration-plan.md](./research/review-first/os-integration-plan.md)
- **Reference**: [llm-theme-reference.css](./reference/llm-theme-reference.css)

### Forms & interactions

- **Research**: [editor-plan.md](./research/editor-plan.md), [form-bot-strategy.md](./research/form-bot-strategy.md)
- **Plans**: [customizable-select.md](./plans/customizable-select.md), [form-validation-pe.md](./plans/form-validation-pe.md), [page-tour-spec.md](./plans/page-tour-spec.md), [editor-component.md](./plans/editor-component.md), [progress-enhance.md](./plans/progress-enhance.md)
- **Shipped**: [stepper-wc.md](./shipped/stepper-wc.md), [wizard.md](./shipped/wizard.md), [comment-box.md](./shipped/comment-box.md)
- **Reference**: [form-validation.md](./reference/form-validation.md)

### Components (general)

- **Plans**: [animated-bg-spec.md](./plans/animated-bg-spec.md)
- **Shipped**: [activity-feed.md](./shipped/activity-feed.md), [comment-thread.md](./shipped/comment-thread.md), [poll-wc.md](./shipped/poll-wc.md), [reaction-bar.md](./shipped/reaction-bar.md), [status-wc.md](./shipped/status-wc.md), [version-switcher.md](./shipped/version-switcher.md), [social-embed-spec.md](./shipped/social-embed-spec.md)
- **Plans (integrations)**: [gl-wc-spec.md](./plans/gl-wc-spec.md)
- **Research**: [future-wc.md](./research/future-wc.md) (wishlist), [feed-reader/](./research/feed-reader/)

### Layout & CSS

- **Research**: [css-parts.md](./research/css-parts.md), [multi-stroke/](./research/multi-stroke/), [parallex.md](./research/parallex.md), [data-model-concept.md](./research/data-model-concept.md)
- **Plans**: [grid-composer-status.md](./plans/grid-composer-status.md), [utility-class-plan.md](./plans/utility-class-plan.md)

### Provenance & content trust

- **Research**: [data-provenance-april-24.md](./research/data-provenance-april-24.md)
- **Plans**: [nav-content-patterns-spec.md](./plans/nav-content-patterns-spec.md)
- **Shipped**: [document-provenance.md](./shipped/document-provenance.md), [page-info-provenance-spec.md](./shipped/page-info-provenance-spec.md)
- **Specs**: [meta-tag-contract-v1.md](./specs/meta-tag-contract-v1.md), [canonical-document-v1.md](./specs/canonical-document-v1.md)

### SKOS / glossary / topics

- **Shipped**: [glossary-system.md](./shipped/glossary-system.md), [topic-index-system.md](./shipped/topic-index-system.md)
- **Reference**: [decisions.md](./reference/decisions.md)
- **Specs**: [analytics-viewcount-v1.md](./specs/analytics-viewcount-v1.md)

### Analytics

- **Plans**: [analytics/analytics-master.md](./plans/analytics/analytics-master.md), [analytics/analytics-spec.md](./plans/analytics/analytics-spec.md), [analytics/analytics-backend-spec.md](./plans/analytics/analytics-backend-spec.md)

### `/go/` services & backend

- **Plans**: [april13-plan/](./plans/april13-plan/) (`go-convention`, `vb-service`, `vb-store`, `notification-wc`, `service-contracts`, `server-side-service-facade`, `go-notifications-plan`, `GOODURL`)
- **Reference implementations**: [cloudflare/](./reference-implementations/cloudflare/), [express/](./reference-implementations/express/), [dev-stub/](./reference-implementations/dev-stub/)

### Navigation & linking

- **Plans**: [a-rel-plan.md](./plans/a-rel-plan.md)
- **Reference**: [view-transitions.md](./reference/view-transitions.md)
- **Specs**: [navbar.md](./specs/navbar.md)

### Mobile & touch

- **Plans**: [mobile/mobile-strategy.md](./plans/mobile/mobile-strategy.md), [mobile/mobile-phases.md](./plans/mobile/mobile-phases.md), [mobile/example-mobile-biosite.html](./plans/mobile/example-mobile-biosite.html)
- **Reference**: [touch.md](./reference/touch.md)

### Canvas / meme / render-tag

- **Research**: [render-tag-rnd.md](./research/render-tag-rnd.md)
- **Plans**: [canvas-text-plan.md](./plans/canvas-text-plan.md), [meme-maker-plan.md](./plans/meme-maker-plan.md)

### AI page-tools

- **Specs**: [ai-page-tools-v1.md](./specs/ai-page-tools-v1.md)
- **Research**: [future-wc.md §AI](./research/future-wc.md)

### Tooling & audits

- **Research**: [pdf-viewer-token-audit.md](./research/pdf-viewer-token-audit.md), [page-diag-debug/](./research/page-diag-debug/)
- **Research (comparisons)**: [shad-compare.md](./research/shad-compare.md), [cult-compare.md](./research/cult-compare.md), [semtx-comparison.md](./research/semtx-comparison.md), [custom-state-set-research.md](./research/custom-state-set-research.md)

## Cross-cutting

- [related/four-layer-cascade.md](./related/four-layer-cascade.md) — Constraints/qualities/functions model
- [related/uucd-component-catalog.md](./related/uucd-component-catalog.md) — UUCD pre-code toolkit catalog
- [handoffs/vanilla-press-integration.md](./handoffs/vanilla-press-integration.md) — VanillaPress onboarding
- [handoffs/screen-saver-integration.md](./handoffs/screen-saver-integration.md) — screen-saver theming onboarding
