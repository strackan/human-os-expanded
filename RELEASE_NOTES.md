# Renubu Release Notes

## Overview

Renubu is an intelligent workflow orchestration platform for Customer Success teams. This document tracks all releases from initial development through production launch.

**Current Version:** 0.2.5-rc.0 (First Contact Onboarding)

---

## Release 0.2.5 - "First Contact Onboarding" (February 21, 2026)

**Status:** RC0
**Type:** Minor Release
**Tag:** `v0.2.5-rc.0`

### New Features

- **First Contact Onboarding** — Conversational onboarding powered by Claude
  - Sculptor persona greets new users with an ice-breaker question
  - SSE streaming for sculptor's opening message (real-time token delivery)
  - JSON + client-side typing animation for user message responses
  - `update_session_metadata` tool for phase tracking and transition signals
  - Option cards phase after conversation (4 workflow recommendations)
  - Session persistence with conversation log restore on refresh
  - Skip and reset flows

- **Tool-Use Continuation Pattern** — Handles Claude's tool_use-only responses
  - When Claude responds with `stopReason: "tool_use"` (metadata call, no text), sends tool results back automatically so Claude continues with its conversational text
  - Merges metadata from both initial and follow-up responses

### Enhancements

- Purple palette rebrand for onboarding UI
- Scoped CSS with semantic IDs and classes (replaces inline styles)
- Shared SSE helpers (`sseEvent`, `streamFromGenerator`, `SSE_HEADERS`)
- Tailwind v4 `@theme` block registration for dashboard colors
- Removed `@human-os/services` file: dependency (inlined identity queries)

### Files Changed

- `src/app/onboarding/OnboardingClient.tsx` — Main onboarding orchestrator
- `src/app/api/onboarding/init/route.ts` — SSE streaming init endpoint
- `src/app/api/onboarding/message/route.ts` — JSON message endpoint with tool-use continuation
- `src/app/api/onboarding/session/route.ts` — Session CRUD
- `src/app/api/onboarding/complete/route.ts` — Completion + option selection
- `src/app/api/onboarding/reset/route.ts` — Session reset
- `src/lib/onboarding/sculptor-prompt.ts` — System prompt + metadata tool definition
- `src/lib/onboarding/sse-helpers.ts` — Shared SSE utilities
- `src/components/onboarding/OnboardingChat.tsx` — Chat UI
- `src/components/onboarding/OnboardingHeader.tsx` — Header with skip/reset
- `src/components/onboarding/OnboardingOptionCards.tsx` — Option card selection

### Database Changes

- Table: `onboarding_sessions` — Session state, conversation log, phase tracking

---

## Release 0.2.4 - "Dashboard Polish & Theme" (February 20, 2026)

**Status:** Released
**Type:** Patch Release
**Tag:** `v0.2.4`

### Enhancements

- **Hero Card CSS Scoping** — Moved hero card styles to `#dashboard-hero` CSS scope
- **Centralized Dashboard Theme** — Unified dashboard styles into centralized theme system, fixed heading specificity bug
- **Dashboard Visual Polish** — White text fixes, bigger avatar, ARR styling improvements, streak message

### Files Changed

- `src/app/dashboard/` — Dashboard page styles
- `src/app/globals.css` — Centralized theme variables

---

## Release 0.2.3 - "Dashboard Revamp" (February 18, 2026)

**Status:** Released
**Type:** Minor Release
**Tag:** `v0.2.3`

### New Features

- **Bounty System** — Daily engagement tracking
  - `bounty_daily_log` table, BountyService, `/api/bounty` endpoints
  - Dashboard bounty card with streak tracking

- **Dashboard Layout v3** — Complete visual redesign
  - Hero card + 3 secondary cards layout
  - Fraunces serif for numbers, Nunito for headings, Inter for body
  - Orange palette matching reference design
  - Warm cream background (`#f8f7f4`)

- **Adventure Score** — Baseline-delta scoring model for edge function

### Bug Fixes

- Vercel Edge middleware fix for dashboard routes

### Files Changed

- `src/app/dashboard/DashboardClient.tsx` — New dashboard layout
- `src/lib/services/BountyService.ts` — Bounty tracking service
- `src/app/api/bounty/` — Bounty API endpoints
- `supabase/functions/adventure-score/` — Edge function update

---

## Release 0.2.2 - "Cleanup & Workflow UX Polish" (January 9 – February 12, 2026)

**Status:** Released
**Type:** Minor Release
**Tag:** `v0.2.2`

### New Features

- **Continue Buttons** — Improved workflow progression
  - Continue button in chat after all tabs reviewed
  - Continue button on intro planning checklist artifact
  - Continue button on tabbed review when all tabs complete

### Enhancements

- **Presentation Workflow UX** — Streamlined presentation workflow interactions
- **Documentation Consolidation** — Cleaned up redundant docs

### Bug Fixes

- User testing feedback — multiple UX bug fixes
- PostgREST schema configuration fix
- Removed sculptor code and dependencies (cleanup from 0.2.1)

---

## Release 0.2.1 - "Sculptor Sessions & Workflow Chat" (December 18, 2025 – January 5, 2026)

**Status:** Released
**Type:** Minor Release
**Tag:** `v0.2.1`

### New Features

- **Per-Workflow LLM Mode** — Database-driven control of LLM behavior per workflow
- **v0-Style Step Chat** — Collapsible chat layout within workflow steps
- **Theatrical Sculptor Sessions** — AI interview system with character personas
  - Hippie Sculptor (hippie-bill) with character resilience
  - Markdown rendering and visual polish
  - Standalone pages with hidden app layout
  - Human-OS database client for cross-platform features
  - Scott Leese prompt from SQL file with upsert pattern
- **API Client Layer** — Frontend-backend separation for workflow components
- **Pilot Tenants System** — Multi-tenant pilot with auto-cleanup
- **Staging Deploy Workflow** — GitHub Actions CI/CD for staging + admin CLI
- **LLM-Powered Talent Chat** — Conversational talent management interface
- **Enhanced TaskMode** — Step chat panel improvements

### Enhancements

- API-first architecture restoration for workflow components
- Middleware updated to allow API and sculptor routes without auth
- Misc service improvements and refactoring

---

## Release 0.2.0 - "Human-OS Integration & LLM Workflow Architecture" (December 18, 2025)

**Status:** Released
**Type:** Major Release
**Tag:** `v0.2.0`

---

## Release 0.1.13 - "Dark Mode Infrastructure" (December 7, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Dark Mode Infrastructure** - Class-based dark mode with toggle
  - ThemeProvider context with localStorage persistence
  - ThemeToggle component in header (sun/moon icons)
  - Tailwind configured for `darkMode: 'class'`
  - Dark mode styles for AppLayout, ChatRenderer, TaskMode
  - Defaults to light mode until dark theme is fully tested

- **Semantic DOM Structure** - Better element identification for testing/exploration
  - Added IDs: `task-mode-overlay`, `task-mode-container`, `task-mode-body`
  - Added IDs: `task-mode-chat`, `task-mode-divider`, `task-mode-artifacts`
  - Added `id="chat-messages"` container
  - Data attributes: `data-message-id`, `data-message-sender`, `data-message-type`
  - Data attributes: `data-button-value`, `data-button-index`

### Enhancements

- **Simplified Workflow Slides** - Reduced back-and-forth in deck/schedule flows
  - Meeting deck slide: single two-button choice (Looks Good / Edit Deck)
  - Schedule call slide: streamlined to immediate progression
  - Both slides now advance immediately on button click

- **Workflow Completion Buttons** - Added dual-action completion
  - "Complete" (green) - triggers confetti and closes workflow
  - "Next Task →" (purple) - advances to next customer workflow

### Bug Fixes

- Fixed `${schedulingSuggestion}` template variable not interpolating (single quotes → backticks)
- Fixed pricing slide button colors (hex → Tailwind classes)
- Fixed navigation buttons missing on pricing-strategy slide
- Fixed dark mode CSS causing light text on light background
- Security: Updated Next.js 15.5.2 → 15.5.7 (CVE-2025-55182)

### Files Changed

- `src/context/ThemeContext.tsx` - NEW: Theme provider
- `src/components/ui/ThemeToggle.tsx` - NEW: Toggle component
- `src/app/globals.css` - Dark mode CSS variables
- `tailwind.config.ts` - Dark mode configuration
- `src/components/layout/AppLayout.tsx` - Dark mode styles
- `src/components/workflows/sections/ChatRenderer.tsx` - Semantic IDs + dark mode
- `src/components/workflows/TaskMode/TaskModeFullscreenV2.tsx` - Semantic IDs
- `src/lib/workflows/slides/action/scheduleCallSlide.ts` - Simplified flow
- `src/lib/workflows/slides/renewal/prepareMeetingDeckSlide.ts` - Simplified flow
- `src/lib/workflows/slides/common/workflowSummarySlide.ts` - Dual completion buttons

---

## Release 0.1.12 - "TaskMode Encapsulation" (December 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **TaskModeEncapsulated** - Reusable workflow launcher with resume dialog
- **PricingAnalysisArtifact** - Pricing strategy visualization
- **Runtime Feature Flags** - Dynamic TaskMode routing

---

## Release 0.1.11 - "QBR Presentations" (November 28, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Presentation Artifact Type** - Editable slide decks within workflows
  - New `presentation` artifact type for QBR meeting decks
  - 5 slide types: Title, Metrics, Highlights, Recommendations, Next Steps
  - Carousel navigation with keyboard support
  - Edit mode for inline content modifications
  - Export to PDF via browser print

- **InHerSight 90-Day Presentation** - GrowthStack QBR deck
  - Replaced document artifact with full presentation
  - Brand performance metrics with trends
  - Key wins and performance highlights
  - Strategic recommendations with priorities
  - Action items with owners and due dates

### New Components

- `src/components/artifacts/PresentationArtifact.tsx` - Main presentation component
- `src/components/artifacts/presentation/slides/TitleSlide.tsx` - Title slide
- `src/components/artifacts/presentation/slides/MetricsSlide.tsx` - KPI metrics
- `src/components/artifacts/presentation/slides/HighlightsSlide.tsx` - Key wins
- `src/components/artifacts/presentation/slides/RecommendationsSlide.tsx` - Strategy
- `src/components/artifacts/presentation/slides/NextStepsSlide.tsx` - Action items

### Updated Files

- `src/components/artifacts/workflows/config/artifactTemplates.ts` - Added `createPresentationArtifact`
- `src/components/artifacts/workflows/components/ArtifactRendererRegistry.tsx` - Added presentation case
- `src/components/artifacts/componentRegistry.ts` - Registered PresentationArtifact
- `src/components/artifacts/workflows/configs/workflows/InHerSight90DayRenewal.ts` - Updated meeting-deck artifact

---

## Release 0.1.10 - "Workflow Persistence" (November 28, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Workflow State Persistence** - Never lose progress on in-flight workflows
  - Auto-save on every state change (debounced 500ms)
  - Automatic resume detection when reopening workflows
  - Cross-device/browser state sync via Supabase
  - localStorage cache for fast local reads

- **LLM Response Caching** - Faster workflow launches
  - Database-backed greeting cache (24hr TTL)
  - Cache key: `customerId + workflowType`
  - Zero LLM calls when reopening workflows for same customer
  - Console logging shows cache hits/misses

- **Auto-Resume UX** - Seamless workflow continuation
  - No confirmation dialog - workflows resume automatically
  - Toast notification "Resuming your progress..."
  - Centralized resume detection in TaskModeFullscreen
  - Works from any entry point (Dashboard, Customer View)

### Technical Infrastructure

- `src/lib/persistence/WorkflowPersistenceService.ts` - Core persistence logic
- `src/lib/persistence/LLMCacheService.ts` - LLM response caching
- `src/lib/persistence/types.ts` - Persistence type definitions
- `src/hooks/useWorkflowPersistence.ts` - React hook for components
- `supabase/migrations/20251129000000_workflow_state_persistence.sql`

### Database Changes

- New table: `workflow_state_snapshots` - Stores complete workflow state
- New table: `workflow_state_audit` - Tracks state changes (future use)
- New table: `llm_response_cache` - Caches LLM responses
- RLS policies for user data isolation

### Performance

- State save: <100ms (debounced)
- State restore: <200ms
- Greeting cache hit: <50ms (vs 2-5s for LLM generation)

---

## Release 0.1.9 - "InHerSight Integration" (January 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **InHerSight Customer Success Platform** - Complete CS tooling for employer branding
  - Database schema extensions for InHerSight-specific metrics
  - CSV import system for bulk data ingestion
  - 5 demo customers with realistic renewal scenarios
  - Brand Exposure Report artifact

- **Scoring Engine** - Data-driven risk/opportunity assessment
  - Rule-based scoring (free, <10ms, 75-80% accuracy)
  - Claude hybrid scoring (for high-value accounts)
  - ML-based POC (future training data collection)
  - Configurable scoring strategy by customer segment

- **90-Day Renewal Workflow** - Guided renewal planning
  - 9-step workflow matching Grace's actual process
  - Performance data review, contract analysis
  - Meeting prep, deck generation, email drafts
  - Time savings: 3-4 hours → <1 hour per renewal

- **Workflow Template System** - Database-driven workflows
  - `workflow_templates` table with base journey definitions
  - `workflow_modifications` for scope-based inheritance
  - Priority system: global (100), company (200), customer (300)
  - Dual-mode deployment with feature flag

### Database Changes

- New tables: `workflow_templates`, `workflow_modifications`
- InHerSight-specific: engagement metrics, contract details, contact enhancements
- CSV import staging tables

### Documentation

- `docs/release-0.1.9-inhersight-summary.md` - Complete release guide
- `docs/release-0.1.9-workflow-template-system-COMPLETE.md` - Template system docs

---

## Release 0.1.8 - "Code Optimizations" (November 2025)

**Status:** Released
**Type:** Minor Release

### Enhancements

- **Trigger Evaluator Consolidation** - 59% code reduction
  - `BaseTriggerEvaluator` abstract class
  - `SkipTriggerEvaluatorV2`, `ReviewTriggerEvaluatorV2`, `EscalateTriggerEvaluatorV2`
  - Unified trigger evaluation pattern

- **TaskMode Modularization** - 1,151 lines → 6 focused components
  - Separated concerns: state, chat, navigation, artifacts
  - Improved maintainability and testability

- **INTEL Storage Migration** - Supabase Storage for customer intelligence
  - Moved from filesystem to cloud storage
  - Cross-environment data consistency

### Technical Infrastructure

- `src/lib/services/triggers/BaseTriggerEvaluator.ts`
- Integration tests for trigger evaluators
- Comprehensive test suite

---

## Release 0.1.7 - "MCP Foundation" (November 22, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Model Context Protocol (MCP) Phase 1** - Extensible AI tool integration framework
  - **Supabase MCP** - Direct AI queries to customer database with natural language → SQL translation
  - **PostgreSQL MCP** - Advanced SQL analytics queries with read-only enforcement
  - **Memory MCP** - Persistent conversation context across sessions with tag-based organization
  - **Sequential Thinking MCP** - Step-by-step reasoning for complex renewal decisions
  - 10 MCP tools registered and operational
  - Feature-flagged architecture (disabled by default in production)

- **Sequential Thinking for Complex Decisions** - Chain-of-thought reasoning
  - Transparent step-by-step analysis for renewal strategies
  - Confidence scoring for each reasoning step
  - Use cases: pricing decisions, risk assessments, contract analysis, stakeholder mapping
  - ThinkingProcess UI component with animated visualization

### Enhancements

- Webpack configuration for server-side-only PostgreSQL client bundling
- Graceful MCP degradation in LLMService (zero impact when disabled)
- MCP health monitoring with automatic checks every 60 seconds
- Comprehensive logging and metrics tracking for MCP operations
- Type-safe MCP tool definitions (MCPTool interface)

### Technical Infrastructure

- `src/lib/mcp/` - Complete MCP architecture
  - MCPManager for centralized client coordination
  - 4 MCP clients: Supabase, PostgreSQL, Memory, Sequential Thinking
  - MCP registry with feature flags
  - Type definitions in mcp.types.ts
- `src/components/mcp/ThinkingProcess.tsx` - Sequential Thinking visualization
- API endpoints: `/api/mcp/query`, `/api/mcp/health`, `/api/mcp/tools`
- Integration tests and verification scripts

### Database Changes

- New table: `mcp_memory` (for Memory MCP storage)
- No changes to existing workflow tables

### Environment Variables

```bash
# Global MCP Settings
MCP_ENABLED=true
MCP_LOG_LEVEL=info

# Phase 1 Servers
MCP_ENABLE_SUPABASE=true
MCP_ENABLE_POSTGRESQL=true
MCP_ENABLE_MEMORY=true
MCP_ENABLE_SEQUENTIAL_THINKING=true

# PostgreSQL Connection
MCP_POSTGRES_CONNECTION_STRING=postgresql://...

# Memory Storage
MCP_MEMORY_STORAGE_TYPE=database
MCP_MEMORY_TABLE=mcp_memory
MCP_MEMORY_TTL=86400
```

### Documentation

- `docs/MCP_INTEGRATION_GUIDE.md` - Comprehensive MCP usage guide
- `docs/CHAT_UX_IMPROVEMENTS.md` - Analysis of better-chatbot UX patterns
- `docs/VOICE_INTEGRATION_ANALYSIS.md` - Web Speech API vs OpenAI Realtime comparison
- `docs/MCP_MERGE_RISK_ANALYSIS.md` - Production merge safety analysis

### Known Issues

- PostgreSQL MCP disabled by default (bundling complexity)
- MCP disabled in production until explicitly enabled via feature flag
- Sequential Thinking can take 10-30 seconds for complex analysis

### Performance

- First token latency: <500ms with streaming (planned for 0.2.0)
- MCP tool loading: ~50ms on first request
- Zero performance impact when MCP disabled (production default)

### Future Phases

- **Phase 2:** Communication MCPs (Slack, Email, Calendar)
- **Phase 3:** Integration MCPs (GitHub, Linear, Stripe, Twilio)
- **Phase 4:** Document MCPs (Playwright, OCR)

### Related Issues

- GitHub Issue #7: Release 0.2.0 planning (Human OS Check-Ins + Chat UX)

---

## Release 0.1.6 - "Workflow Templates" (November 17, 2025)

**Status:** Testing
**Type:** Minor Release

### New Features

- **Database-Driven Workflow Templates** - Template system with scope-based inheritance (global, company, customer levels)
- **Workflow Compilation Service** - Runtime compilation of templates with customer data hydration
- **Dual-Mode Deployment** - Feature flag system for safe migration from legacy workflows
- **Template Modifications** - Priority-based modification system (100=global, 200=company, 300=customer)
- **InHerSight Integration** - Customer-specific testing infrastructure

### Enhancements

- Workflow launch from customer detail pages
- Comprehensive artifact type mapping
- WorkflowConfigTransformer integration

### Bug Fixes

- TypeScript errors in workflow template system
- API client authentication for customer detail endpoints
- Demo mode authentication redirect issues
- Text contrast improvements for accessibility

### Database Changes

- New table: `workflow_templates`
- New table: `workflow_modifications`
- Enhanced: `workflow_executions` with template tracking

### Known Issues

- Template system disabled by default (feature flag: `USE_WORKFLOW_TEMPLATE_SYSTEM`)
- Legacy workflow system frozen for backward compatibility

---

## Release 0.1.5 - "String-Tie & Optimization" (November 15-16, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **String-Tie Natural Language Reminders** - Voice-first reminder system with Claude AI parsing
  - Natural language input: "remind me tomorrow at 9am", "in 2 hours", "next week"
  - Web Speech API integration for voice dictation
  - Business day awareness with holiday handling
  - Quick snooze options (15m, 30m, 1h, 2h, 1d)
- **Quick Capture Popover** - Global header quick capture with voice recording
- **Feature Flag Infrastructure** - Progressive feature rollout system

### Enhancements

- Code optimization across trigger evaluators (59% code reduction)
- TaskMode modularization (1,151 lines → 6 focused components)
- Workflow config modularization with reusable patterns
- Two-client auth pattern for demo mode
- AuthProvider performance optimization

### Bug Fixes

- Demo mode authentication infinite loop
- Missing dependencies in package.json

### Database Changes

- New table: `string_ties`
- New column: `user_settings.string_tie_default_offset_minutes`
- Migration: `20260202000001_string_ties_phase1_4.sql`

### API Endpoints

- `POST /api/string-ties` - Create reminder
- `GET /api/string-ties` - List reminders
- `POST /api/string-ties/parse` - Parse natural language
- `POST /api/string-ties/[id]/snooze` - Snooze reminder
- `GET /api/string-ties/settings` - User settings

---

## Release 0.1.4 - "Skip & Review Systems" (November 15, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Skip Trigger System** - Conditional workflow skipping with automatic reactivation
  - Four trigger conventions: DATE, EVENT, EVENT and DATE, EVENT or DATE
  - OR/AND logic combinations
  - Manual reactivation capability
  - Skipped workflows dashboard
- **Review Trigger System** - Approval workflow for quality gates
  - Trigger-based review requests
  - Reviewer assignment
  - Review status tracking (pending/approved/changes_requested)
  - Step-level and workflow-level reviews

### Enhancements

- Enhanced flow control modals (Skip, Review, Escalate)
- Test pages for skip and escalate functionality

### Database Changes

- New table: `workflow_skip_triggers`
- New table: `workflow_review_triggers`
- Enhanced: `workflow_executions` with skip/review columns
- Enhanced: `workflow_step_executions` with review tracking

### API Endpoints

- `POST /api/workflows/skip-with-triggers` - Skip workflow
- `GET /api/workflows/skipped` - List skipped workflows
- `POST /api/workflows/reactivate-now` - Reactivate workflow
- `POST /api/workflows/escalate-with-triggers` - Request review
- `GET /api/workflows/escalated` - List workflows pending review
- `POST /api/workflows/resolve-now` - Resolve review
- `POST /api/cron/evaluate-skip-triggers` - Cron job
- `POST /api/cron/evaluate-escalate-triggers` - Cron job

---

## Release 0.1.3 - "Parking Lot System" (November 15, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Parking Lot Event Detection** - AI-powered workflow intelligence system
  - Risk score threshold detection
  - Opportunity score threshold detection
  - Renewal proximity alerts
  - Workflow milestone completion tracking
  - Lighter day detection
  - Health score drop detection
- **Workflow Health Scoring** - Automated readiness assessment (0-100 scale)
- **LLM Analysis** - Claude Sonnet 4.5 integration for complex event patterns
- **Parking Lot Dashboard** - Quick capture with Cmd+Shift+P
  - 4 capture modes: project, expand, brainstorm, passive
  - Magic keyword hints
  - Advanced filtering
  - LLM expansion and brainstorming

### Enhancements

- Assessment framework with 26 markdown questions across 6 sections
- Scoring rubrics for 12 dimensions

### Database Changes

- New table: `parking_lot_items` (19+ columns)
- New table: `parking_lot_categories`
- 12 performance indexes
- Migration: `20251113000002_parking_lot_system.sql`

### API Endpoints

- `POST /api/parking-lot` - Create item
- `GET /api/parking-lot` - List items
- `GET /api/parking-lot/[id]` - Get item
- `PATCH /api/parking-lot/[id]` - Update item
- `POST /api/parking-lot/[id]/brainstorm` - AI brainstorm
- `POST /api/parking-lot/[id]/expand` - Expand item
- `POST /api/parking-lot/[id]/convert-to-workflow` - Convert to workflow
- `GET /api/parking-lot/categories` - Get categories

---

## Release 0.1.2 - "MCP Foundation" (November 7-12, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **MCP Registry Infrastructure** - Model Context Protocol integration platform
- **OAuth Integrations** - Google Calendar, Gmail, Slack
  - Google Calendar: OAuth + findNextOpening() algorithm
  - Gmail: Send/search with user confirmation
  - Slack: Messaging with admin controls
- **OAuth Token Encryption** - Application-layer security (migrated from database encryption)
- **Email Orchestration System** - AI-powered communication workflows
- **Feature Tracking System** - Database-driven feature catalog with status tracking

### Enhancements

- Workflow trigger framework foundation
- Agent-based development infrastructure
- Commit-and-track automation script
- Phase completion workflow

### Security

- Complete API security audit
- Company_id filtering for customer data isolation (P0)
- Company_id filtering for renewals, contracts, workflows, notifications

### Database Changes

- New table: `documentation`
- New table: `documentation_versions`
- Enhanced: `releases` with phase tracking
- Enhanced: `features` with dependencies and customer requests

### Known Issues

- OAuth popup blocker handling required for some browsers

---

## Release 0.1.1 - "Multi-Tenancy" (November 2-8, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Workspace Authentication** - Company_id isolation for multi-tenant architecture
- **Workspace Invitation System** - Team member onboarding (2-phase implementation)
- **Multi-Domain Workflow Support** - Modular architecture for domain-specific workflows
- **Weekly Planning Workflow** - Renubu Labs proof of concept (5-slide composition)
- **Email Orchestration** - AI-powered email generation and management

### Enhancements

- CalendarService with findNextOpening() algorithm
- Database seed for weekly planner
- Public access to talent application landing page

### Security

- Row-Level Security (RLS) policies for company isolation
- OAuth callback security improvements

---

## Release 0.1.0 - "Zen Dashboard" (October 21 - November 6, 2025)

**Status:** Released
**Type:** Minor Release

### New Features

- **Zen Dashboard Modernization** - Clean, professional interface redesign
- **Chat Integration UI** - Integrated messaging within workflow system
- **Living Documentation System** - Auto-generated, versioned documentation
- **GitHub Projects Integration** - Issue templates and evaluation framework
- **Production Build System** - Vercel deployment compatibility

### Enhancements

- React Hooks compliance fixes
- Database constants consolidation
- Status/priority enums in TypeScript
- API routes centralization
- Component registry standardization
- Customer list optimization (700 → 300 lines)

### Bug Fixes

- FontAwesome loading strategy
- TypeScript strict mode errors (159 errors resolved)
- React Hooks rule violations
- Conditional rendering for optional props
- Supabase client initialization during build

### Infrastructure

- Pre-commit hooks with Husky and lint-staged
- ESLint rules upgraded to error level
- Zod validation infrastructure
- /verify command for automated quality checks

---

## Release 0.0.9 - "Pre-Production Polish" (November 1-6, 2025)

**Status:** Released
**Type:** Patch Release

### Enhancements

- Code consolidation across modules
- Architecture documentation complete
- Test coverage improvements
- Build configuration optimization

### Bug Fixes

- Demo mode security improvements
- Sign-out loop resolution
- Loading skeleton issues

---

## Release 0.0.8 - "Labs Launch" (October 28-31, 2025)

**Status:** Released
**Type:** Patch Release

### New Features

- **Renubu Labs** - Multi-domain workflow proof of concept
- Weekly Planner workflow (5-slide composition)
- Email orchestration prototype

### Enhancements

- Modular architecture for non-renewal workflows
- CalendarService algorithms

---

## Release 0.0.7 - "Orchestrator Birth" (October 3-27, 2025)

**Status:** Released
**Type:** Patch Release

### New Features

- **Step-Based Workflow System** - Complete architectural refactor
  - Replaced slide-based navigation with step progression
  - Workflow registry system
  - Workflow ID loading
  - 7-day snooze enforcement
- **WorkflowEngine Component** - Core orchestration engine
- **Markdown Rendering** - Rich content support in workflows
- **Database-Driven Launches** - Dynamic workflow initialization

### Enhancements

- Code modularization (main file reduced by 80%)
- Customer statistics from database
- Spa aesthetic redesign
- "Good Doctor" pattern for AI/User task separation

### Technical Details

- 57,000 lines added
- 47,000 lines deleted
- Net: +10,000 lines with improved architecture

---

## Release 0.0.6 - "Artifact Engine" (September 5-28, 2025)

**Status:** Released
**Type:** Patch Release

### New Features

- **Artifact Component System** - 100+ reusable workflow components
  - Charts (falling, flat, rising)
  - Contracts
  - Quotes
  - Planning checklists
  - Contract overviews
  - Emails
  - Summary plans
- **Configuration-Driven Workflows** - Template-based workflow generation
- **Template Groups** - Ordered workflow collections
- **Dynamic Artifact Loading** - Runtime artifact selection
- **Slide-Based Scenes** - Demo workflow composition
- **Progress Tracker** - Visual workflow progress

### Enhancements

- Task mode configuration files
- Landing page gallery
- Message delay simulation for realistic UX
- Subflows (reusable chat templates)

### Technical Details

- 35,000 lines of code added
- Multi-agent development adoption

---

## Release 0.0.5 - "Backend Breakthrough" (August 9-27, 2025)

**Status:** Released
**Type:** Patch Release

### New Features

- **Supabase Cloud Migration** - Production database infrastructure
- **Customers Page** - CRUD operations for customer management
- **Customer 360 View** - Comprehensive customer detail page
- **ActivePieces Integration** - Workflow automation platform connection
- **Demo Mode** - Authentication bypass for demonstrations

### Enhancements

- Server-side authentication architecture
- Consolidated database schema (single public schema)
- SQL migration optimization (20+ files → 1)
- Database seeding improvements

### API Additions

- 83 new API routes
- Customer detail endpoints
- ActivePieces push functionality

### Technical Details

- 20,000 lines of code added

---

## Release 0.0.4 - "Authentication Battle" (June 13 - July 28, 2025)

**Status:** Released
**Type:** Patch Release

### New Features

- **Supabase Integration** - Cloud database and authentication
- **Google OAuth** - Single sign-on support
- **Event Handling System** - Basic workflow event management
- **Database Conversation Handles** - React hooks for workflow conversations

### Bug Fixes

- Authentication flow (multiple iterations)
- Login/logout redirect issues
- JWT routing
- Session management

### Known Issues

- Extended development time due to OAuth complexity

---

## Release 0.0.3 - "Workflow Experiments" (May 4-24, 2025)

**Status:** Released
**Type:** Patch Release

### New Features

- **Multiple Renewal Workflows** - Planning workflow prototypes
- **Planning Workflow Alpha** - First complete workflow implementation
- **Customer Page Modularization** - Component-based architecture
- **Concept Files** - AI-Powered Impact Engineers, Revenue Architects

### Enhancements

- AI workflow scaffolding
- Chat workflow handling improvements
- Layout improvements

---

## Release 0.0.2 - "Dashboard Core" (April 30 - May 3, 2025)

**Status:** Released
**Type:** Patch Release

### New Features

- **Renewals HQ v2 & v3** - Enhanced dashboard iterations
- **Snooze Functionality** - Workflow postponement
- **Actions Dropdown** - Contextual action menu
- **Resizable Columns** - Customizable table layout
- **Contracts Page** - Contract management interface

### Enhancements

- UX improvements across dashboard
- Multiple page prototypes

---

## Release 0.0.1 - "Genesis" (April 28-29, 2025)

**Status:** Released
**Type:** Initial Release

### New Features

- **Initial Application** - Next.js foundation with create-next-app
- **Renewals HQ Dashboard** - Basic renewal tracking interface
- **Timeline Toggle** - View switching for renewal timelines
- **Customer List** - Initial customer management

### Technical Details

- 2,000 lines of initial code
- Project initialization

---

## Upcoming Releases

### Release 0.2.6 - "Human-OS Enrichment" (Target: Q2 2026)

**Status:** Planning
**Type:** Minor Release

#### Planned Features

- **Human-OS External Enrichment** — Triangulated intelligence via MCP
  - Contact enrichment (LinkedIn profiles, headlines, recent posts)
  - Company enrichment (funding rounds, news, growth signals)
  - `HumanOSClient` MCP client implementation
- **External Wake Triggers** — 5 new trigger types from Human-OS
- **String-Tie Enrichment** — Reminders enriched with contact context
- **Workflow Greeting Refresh** — Triangulated insights in opening slides

#### Reference Documentation

- `docs/HUMAN_OS_INTEGRATION_GUIDE.md` - Complete implementation guide

---

### Release 0.3.0 (Target: Q2 2026)

**Status:** Roadmap
**Type:** Major Release

Details to be announced.

---

## Version History Summary

| Version | Release Date | Status | Type | Key Feature |
|---------|-------------|--------|------|-------------|
| **0.1.13** | **Dec 7, 2025** | **Released** | **Minor** | **Dark Mode Infrastructure** |
| 0.1.12 | Dec 2025 | Released | Minor | TaskMode Encapsulation |
| 0.1.11 | Nov 28, 2025 | Released | Minor | QBR Presentations |
| 0.1.10 | Nov 28, 2025 | Released | Minor | Workflow Persistence |
| 0.1.9 | Jan 2025 | Released | Minor | InHerSight Integration |
| 0.1.8 | Nov 2025 | Released | Minor | Code Optimizations |
| 0.1.7 | Nov 22, 2025 | Released | Minor | MCP Foundation |
| 0.1.6 | Nov 17, 2025 | Released | Minor | Workflow Templates |
| 0.1.5 | Nov 15-16, 2025 | Released | Minor | String-Tie + Optimization |
| 0.1.4 | Nov 15, 2025 | Released | Minor | Skip & Review Systems |
| 0.1.3 | Nov 15, 2025 | Released | Minor | Parking Lot System |
| 0.1.2 | Nov 7-12, 2025 | Released | Minor | MCP Registry |
| 0.1.1 | Nov 2-8, 2025 | Released | Minor | Multi-Tenancy |
| 0.1.0 | Oct 21 - Nov 6, 2025 | Released | Minor | Zen Dashboard |
| 0.0.9 | Nov 1-6, 2025 | Released | Patch | Pre-Production Polish |
| 0.0.8 | Oct 28-31, 2025 | Released | Patch | Labs Launch |
| 0.0.7 | Oct 3-27, 2025 | Released | Patch | Orchestrator Birth |
| 0.0.6 | Sep 5-28, 2025 | Released | Patch | Artifact Engine |
| 0.0.5 | Aug 9-27, 2025 | Released | Patch | Backend Breakthrough |
| 0.0.4 | Jun 13 - Jul 28, 2025 | Released | Patch | Authentication |
| 0.0.3 | May 4-24, 2025 | Released | Patch | Workflow Experiments |
| 0.0.2 | Apr 30 - May 3, 2025 | Released | Patch | Dashboard Core |
| 0.0.1 | Apr 28-29, 2025 | Released | Initial | Genesis |

---

## Support

For bug reports, feature requests, or questions:
- GitHub Issues: [renubu/issues](https://github.com/renubu/renubu/issues)
- Documentation: [docs/](docs/)

---

**Last Updated:** December 7, 2025
**Document Version:** 1.1
