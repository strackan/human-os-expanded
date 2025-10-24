# Renubu Documentation Index

> **📚 AUTHORITATIVE SOURCE OF TRUTH**
>
> This document is the **single source of truth** for navigating all Renubu documentation.
> **Last Updated:** 2025-10-07
> **Maintained By:** Development Team

---

## 🎯 For LLMs and New Developers: START HERE

**If you are an LLM assistant or new developer**, this index tells you which documentation to trust:

- ✅ **CURRENT** = Use this for understanding the system as it exists today
- 📅 **PLANNING** = Future architecture, NOT yet implemented
- 🗄️ **ARCHIVED** = Historical reference only, DO NOT use for current development

**When in doubt, refer to this index first.**

---

## 📋 Quick Navigation

| Topic | Current Documentation | Status |
|-------|----------------------|---------|
| **Authentication** | [`OAUTH_AUTHENTICATION_GUIDE.md`](../OAUTH_AUTHENTICATION_GUIDE.md) | ✅ Current |
| **Workflows** | [`src/components/artifacts/workflows/`](../src/components/artifacts/workflows/) | ✅ Current |
| **Styling** | [`src/styles/design-system.md`](../src/styles/design-system.md) | ✅ Current |
| **Database** | [`DATABASE_SYSTEM_GUIDE.md`](../DATABASE_SYSTEM_GUIDE.md) (if exists) | ✅ Current |
| **Getting Started** | [`README.md`](../README.md) | ✅ Current |

---

## ✅ CURRENT DOCUMENTATION (Use These)

### Core System Documentation

#### **1. Getting Started**
- **File:** [`README.md`](../README.md)
- **Purpose:** Project overview, quick start, technology stack
- **Use For:**
  - New developer onboarding
  - Understanding project structure
  - Available scripts and commands
  - Technology stack overview
- **Status:** ✅ Actively maintained

#### **2. Authentication System**
- **File:** [`OAUTH_AUTHENTICATION_GUIDE.md`](../OAUTH_AUTHENTICATION_GUIDE.md)
- **Purpose:** Complete authentication implementation guide
- **Use For:**
  - OAuth setup and configuration
  - Dual authentication (OAuth + email/password)
  - Smart fallback mechanisms
  - Password reset functionality
  - Account linking
  - Troubleshooting auth issues
- **Features:**
  - Google OAuth integration
  - Email/password fallback
  - Password reset flow
  - Multi-layer protection (middleware + client-side)
  - Session management
- **Status:** ✅ Current implementation
- **Supersedes:** All other authentication docs (see Archive section)

#### **3. Workflow System (Modular Architecture)**
- **Directory:** [`src/components/artifacts/workflows/`](../src/components/artifacts/workflows/)
- **Key Files:**
  - [`README.md`](../src/components/artifacts/workflows/README.md) - Quick start guide
  - [`ARCHITECTURE.md`](../src/components/artifacts/workflows/ARCHITECTURE.md) - Technical details
- **Purpose:** Configuration-driven, modular workflow system
- **Architecture:**
  - TaskModeAdvanced (modal container)
  - WorkflowWrapper (config bridge)
  - 4 independent quadrants (CustomerOverview, Analytics, ChatInterface, ArtifactsPanel)
  - Configuration-driven templates
- **Use For:**
  - Creating new customer workflows
  - Understanding component architecture
  - Extending workflow features
  - Adding custom artifacts
- **Status:** ✅ Current production system
- **Implementation:** Fully functional, in active use

#### **4. UI & Styling**
- **Files:**
  - [`src/styles/design-system.md`](../src/styles/design-system.md) - Design system guide
  - [`STYLE_MIGRATION_SUMMARY.md`](../STYLE_MIGRATION_SUMMARY.md) - Migration documentation
  - [`src/config/README.md`](../src/config/README.md) - UI text configuration
- **Purpose:** Consistent styling and UI patterns
- **Use For:**
  - Component styling guidelines
  - Color palette and typography
  - Animation system
  - Tailwind CSS v4 usage
  - UI text management
- **Status:** ✅ Current standards

#### **5. Data Layer & Hooks**
- **File:** [`src/hooks/README.md`](../src/hooks/README.md)
- **Purpose:** React hooks for data management
- **Features:**
  - Supabase real-time subscriptions
  - `useRenewals`, `useConversations`, `useWorkflows`, `useTasks`, `useCustomers`
  - Type-safe data access
  - Auto-refresh capabilities
- **Use For:**
  - Data fetching patterns
  - Real-time updates
  - Hook usage examples
- **Status:** ✅ If Supabase integration is active
- **Note:** Verify implementation status with actual codebase

---

## 📅 PLANNING DOCUMENTATION (Future Systems)

> **⚠️ WARNING:** These documents describe FUTURE architecture that is NOT YET IMPLEMENTED.
> **DO NOT** use these for understanding the current system.
> **DO** use these for planning, design discussions, and roadmap conversations.

### Future Architecture Plans

#### **1. Workflow API Contract**
- **File:** [`docs/planning/API-CONTRACT.md`](planning/API-CONTRACT.md)
- **Date:** October 7, 2025 (Target)
- **Purpose:** API contract for future 3-layer workflow orchestration system
- **Scope:**
  - `/workflows/queue/{csmId}` endpoints
  - Step completion tracking
  - Variable injection system
  - Context data structure
- **Status:** 📅 Planning phase
- **Timeline:** Target Week 5-6 integration (Oct 2025)

#### **2. Combined System Architecture**
- **File:** [`docs/planning/COMBINED-SYSTEM-ARCHITECTURE.md`](planning/COMBINED-SYSTEM-ARCHITECTURE.md)
- **Date:** October 7, 2025 (Target)
- **Purpose:** Complete vision for intelligent workflow system
- **Scope:**
  - Data ingestion & intelligence layer
  - Workflow orchestration layer
  - Presentation & UI layer
  - AI-powered insights
  - Salesforce integration
  - Priority scoring algorithm
- **Status:** 📅 Design phase
- **Timeline:** 8-week implementation plan
- **Note:** This represents the vision for the platform, not current state

---

## 🗄️ ARCHIVED DOCUMENTATION (Historical Reference Only)

> **⚠️ WARNING:** These documents are OUTDATED and should NOT be used for development.
> **Purpose:** Historical reference, understanding system evolution, migration context.

### Legacy System Documentation

#### **1. Customer Workflow System (Legacy)**
- **File:** [`docs/archive/2024-CUSTOMER_WORKFLOW_SYSTEM.md`](archive/2024-CUSTOMER_WORKFLOW_SYSTEM.md)
- **Date Archived:** 2025-01-XX
- **Why Archived:** Superseded by modular workflow system
- **Historical Context:**
  - Original customer management approach
  - Priority scoring algorithm (still conceptually relevant)
  - Workflow generation patterns
- **Do NOT Use For:** Current API endpoints, data models, or implementation

#### **2. Task Management (Sandbox)**
- **File:** [`docs/archive/2024-TASK_MANAGEMENT.md`](archive/2024-TASK_MANAGEMENT.md)
- **Date Archived:** 2025-01-XX
- **Why Archived:** Sandbox implementation, superseded by production system
- **Historical Context:**
  - Early task queue concepts
  - Initial UI/UX explorations
- **Do NOT Use For:** Current implementation guidance

#### **3. Authentication System (Early Version)**
- **File:** [`docs/archive/2024-AUTHENTICATION_SYSTEM.md`](archive/2024-AUTHENTICATION_SYSTEM.md)
- **Date Archived:** 2025-01-XX
- **Why Archived:** Superseded by comprehensive OAuth guide
- **Historical Context:**
  - Original multi-layer protection approach
  - RouteGuard component patterns
- **Do NOT Use For:** Current auth setup

#### **4. Auth Setup (Simplified Version)**
- **File:** [`docs/archive/2024-AUTH_SETUP.md`](archive/2024-AUTH_SETUP.md)
- **Date Archived:** 2025-01-XX
- **Why Archived:** Intermediate "clean implementation" approach
- **Historical Context:**
  - Attempt to simplify auth system
  - PKCE flow documentation
- **Do NOT Use For:** Current auth configuration

---

## 🔍 How to Use This Index

### For New Developers

1. **Start with:** `README.md` for project overview
2. **Then read:** Current documentation for your area of work
3. **Ignore:** Everything in `docs/archive/` and `docs/planning/`

### For LLMs (Claude, ChatGPT, etc.)

1. **Always check this index first** before referencing other documentation
2. **Only use CURRENT documentation** for code generation and guidance
3. **Never reference ARCHIVED docs** for implementation decisions
4. **Note PLANNING docs** but clarify they represent future, not current state
5. **When uncertain:** Ask the user which system they're working with

### For Documentation Maintainers

1. **Update this index** whenever documentation is created, moved, or archived
2. **Keep "Last Updated" date current** at the top of this file
3. **Add deprecation notices** to archived files (template below)
4. **Add planning notices** to future architecture docs (template below)
5. **Review quarterly** to ensure accuracy

---

## 📝 Documentation Templates

### Deprecation Notice Template

```markdown
> **⚠️ DEPRECATED DOCUMENTATION**
>
> **Status:** Archived - Historical Reference Only
> **Date Archived:** YYYY-MM-DD
> **Reason:** Brief explanation of why deprecated
>
> **Current Documentation:** Link to current docs
>
> **Do not use this document for:** Current development
> **This document is preserved for:** Historical context
```

### Planning Document Template

```markdown
> **📅 FUTURE PLANNING DOCUMENT**
>
> **Status:** Planning Phase - NOT YET IMPLEMENTED
> **Target Date:** When this is planned for implementation
> **Purpose:** What this planning doc covers
>
> **Important:**
> - This describes a FUTURE system
> - Current system uses different approach (link to current docs)
> - Do NOT use for current development
```

---

## 🚦 Status Legend

| Icon | Status | Meaning |
|------|--------|---------|
| ✅ | **CURRENT** | Actively maintained, use for development |
| 📅 | **PLANNING** | Future architecture, not yet implemented |
| 🗄️ | **ARCHIVED** | Historical only, do not use |
| ⚠️ | **WARNING** | Read carefully, may be outdated or future |

---

## 📞 Questions?

- **Documentation Issues:** Check this index first, then ask maintainers
- **Missing Documentation:** File an issue or update this index
- **Unclear Status:** When in doubt, assume ARCHIVED unless listed as CURRENT

---

**Last Reviewed:** 2025-10-07
**Next Review Due:** 2026-01-07 (Quarterly)
**Maintainer:** Development Team
