# R&D Pattern Migration Status

This document tracks the status of experimental patterns from `zen-garden` being migrated to the main Vanilla Breeze codebase.

## Migration Criteria

Before migrating a pattern:
1. Pattern must be stable and well-tested
2. Must not break existing functionality
3. Should have fallbacks for older browsers (via `@supports`) if needed
4. Documentation must be updated

## Pattern Status

| Pattern | Priority | Status | Bead | Notes |
|---------|----------|--------|------|-------|
| Container queries expansion | P2 | **Planned** | `vanilla-breeze-tda7` | Baseline 2023, already started on cards |
| Grid identity system | P2 | **Planned** | `vanilla-breeze-tctp` | Opt-in module approach |
| Subgrid exploration | P3 | **Exploring** | `vanilla-breeze-0vpr` | Create demos first to evaluate |
| Three-tier token system | - | **Deferred** | - | High churn, low ROI |
| Layout templates | - | **Deferred** | - | Depends on grid identity |
| CSS @layer refactor | - | **Deferred** | - | Current structure works |

## Planning Documents

Detailed implementation plans with code samples:

- **Container Queries**: [container-queries-expansion.md](./container-queries-expansion.md)
- **Grid Identity**: [grid-identity-option.md](./grid-identity-option.md)
- **Subgrid**: [subgrid-exploration.md](./subgrid-exploration.md)

## Status Definitions

- **Planned**: Ready for migration, approach decided, bead created
- **Exploring**: Creating demos/spikes to evaluate approach
- **In Progress**: Actively being migrated
- **Completed**: Merged to main codebase
- **Deferred**: Postponed - not worth the complexity/risk

## Recent Activity

| Date | Pattern | Action |
|------|---------|--------|
| 2026-01-25 | Container queries | Added to semantic-card, layout-card |
| 2026-01-25 | @property | Added for --hue-primary/secondary/accent |
| 2026-01-25 | Future CSS assessment | Created future-changes.md |

## Migration Workflow

When ready to merge a pattern:

1. Check bead for full requirements
2. Read the planning document in r-n-d/
3. Create implementation
4. Test across themes and demos
5. Update this status document
6. Close the bead

## Notes

- Baseline 2023/2024 features don't need @supports fallbacks
- Opt-in modules preferred over changes to main bundle
- The zen-garden serves as a safe space for experimentation
- Patterns here may break or change frequently
