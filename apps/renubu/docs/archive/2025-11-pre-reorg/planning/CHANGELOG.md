# Changelog

**Last Updated:** 2025-10-23

All notable changes to the Renubu project are documented here.

---

## Recent Changes
- **2025-10-23:** Phase 3F Dashboard Integration complete
- **2025-10-23:** Initial consolidated changelog

---

## [2025-10-23] - Documentation Consolidation

### Added
- New documentation structure (product/, technical/, guides/, planning/)
- Navigation hub (README.md)
- Consolidated 88 files → 8 core documents
- Cross-referencing between documents
- Internal changelogs in each document

### Changed
- Moved old docs to archive/v0-pre-consolidation/
- Updated all documentation to Phase 3 architecture

---

## [2025-10-23] - Contract Terms Separation

### Added
- `contract_terms` table for business/legal terms
- `term_months` auto-calculated field in contracts
- `contract_matrix` view for reporting
- `is_in_auto_renewal_window()` helper function

### Changed
- Separated contract lifecycle from business terms
- Reduced duplication in contract data

### Documentation
- Added CONTRACT-TERMS-GUIDE.md (now in guides/CONTRACT-TERMS.md)

---

## [2025-10-23] - Phase 3F: Dashboard Integration

### Added
- `ContractTermsCard.tsx` component (282 lines) - displays contract business terms
- `WorkflowStatePanel.tsx` component (265 lines) - tab-based workflow state management
- `NotificationBanner.tsx` component (241 lines) - real-time notifications for due workflows
- `WorkflowAnalyticsDashboard.tsx` component (411 lines) - comprehensive analytics with AI insights
- Contract data now fetched from `contract_matrix` view (includes all business terms)

### Changed
- Extended `ContractData` interface with 15+ business term fields
- Updated `contractProvider.ts` to use `contract_matrix` view instead of `contracts` table
- WorkflowActionButtons and user selector verified as complete from Phase 3E

### Features
- Workflow state management (active, snoozed, escalated, completed tabs)
- Badge counts on workflow tabs with live data
- Real-time notifications (auto-refresh every 5 minutes)
- Analytics tracking: snooze patterns, escalation metrics, skip analysis, completion stats
- AI-powered insights from usage patterns
- Contract terms display with two modes (compact/full)
- Renewal window alerts and market position indicators

### Status
- Phase 3F complete (~1,200 lines of code)
- Phase 3 progress: 75% complete (6/8 phases)
- All components ready for integration into zen-dashboard

---

## [2025-10-22] - Step-Level Actions

### Added
- `workflow_step_states` table
- `workflow_step_actions` audit table
- `WorkflowStepActionService` class
- Step snooze/skip modals
- Auto-update triggers for workflow flags

### Changed
- Users can now snooze/skip individual steps
- Workflow progress more granular

### Status
- 90% complete (UI integration pending)

### Documentation
- Added STEP-LEVEL-ACTIONS-INTEGRATION.md
- Added STEP-LEVEL-ACTIONS-FIXES.md

---

## [2025-10-15] - Phase 3: Database-Driven Workflows

### Added
- `workflow_definitions` table
- `db-composer.ts` for runtime composition
- Template hydration system
- Multi-tenant workflow support

### Changed
- Workflows now stored in database (not code)
- Runtime composition from slide library
- No code deploys for new workflows

### Removed
- Hardcoded workflow config files (moved to archive)

### Migration
- Created migration: `20251015000000_workflow_definitions.sql`

---

## [2025-09-20] - Phase 2: Slide Library

### Added
- SLIDE_LIBRARY registry
- Reusable slide builders
- Composition patterns
- WorkflowComposition type

### Changed
- Workflows composed from reusable slides
- Reduced code duplication

---

## [2024] - Phase 1: Initial Development

### Added
- Basic workflow system
- Hardcoded TypeScript configs
- TaskMode UI
- Chat and artifact panels
- Customer dashboard

### Known Issues
- 910+ line config files
- Code deploy required for changes
- Heavy duplication

---

## Historical Context

See `archive/v0-pre-consolidation/automation-backup/` for detailed historical checkpoints:

- CHECKPOINT-1-SUMMARY.md - Early backend development
- CHECKPOINT-2-SUMMARY.md - Frontend integration
- CHECKPOINT-3-SUMMARY.md - Workflow system
- Various COMPLETE.md files - Feature completions
- BLUESOFT_DEMO_* - Demo preparation materials

---

## Version History

| Date | Phase | Key Feature |
|------|-------|-------------|
| 2025-10-23 | 3.2 | Doc consolidation + contract terms |
| 2025-10-22 | 3.1 | Step-level actions |
| 2025-10-15 | 3.0 | Database-driven workflows |
| 2025-09-20 | 2.0 | Slide library |
| 2024 | 1.0 | Initial release |

---

## Related Documentation

- [Roadmap](ROADMAP.md) - What's coming next
- [System Overview](../product/SYSTEM-OVERVIEW.md) - Product overview
- [Architecture Guide](../technical/ARCHITECTURE.md) - Technical details

