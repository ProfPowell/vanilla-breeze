# R&D Pattern Migration Status

This document tracks the status of experimental patterns from `zen-garden` being migrated to the main Vanilla Breeze codebase.

## Migration Criteria

Before migrating a pattern:
1. Pattern must be stable and well-tested
2. Must not break existing functionality
3. Should have fallbacks for older browsers (via `@supports`)
4. Documentation must be updated

## Pattern Status

| Pattern | Priority | Status | Target Location | Notes |
|---------|----------|--------|-----------------|-------|
| Three-tier token system | High | Planned | `src/tokens/` | Low risk, extends existing tokens |
| Grid identity system | Medium | Testing | `src/layouts/` | Needs feature queries for fallbacks |
| Layout templates | Medium | Planned | `src/layouts/` | CSS variable approach |
| Container queries | Medium | Exploring | `src/layouts/` | Good browser support now |
| CSS @layer refactor | Low | Exploring | `src/` | Higher risk, affects cascade |
| Subgrid layouts | Low | Exploring | `src/layouts/` | Limited browser support |

## Status Definitions

- **Planned**: Ready for migration, approach decided
- **Testing**: Being tested in zen-garden environment
- **Exploring**: Still experimenting with approach
- **In Progress**: Actively being migrated
- **Completed**: Merged to main codebase
- **Deferred**: Postponed for future consideration

## Migration Workflow

When ready to merge a pattern:

1. Create branch: `feature/migrate-{pattern}`
2. Copy CSS from `r-n-d/zen-garden/core/` to appropriate `src/` location
3. Add `@supports` feature queries for fallbacks
4. Update documentation
5. Test across themes
6. Update this status document
7. Create PR for review

## Recent Migrations

*No patterns have been migrated yet.*

## Notes

- The zen-garden serves as a safe space for experimentation
- Patterns here may break or change frequently
- Production migration only happens after thorough testing
