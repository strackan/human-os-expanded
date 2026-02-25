# Renubu Product Roadmap

**Last Generated:** 2025-12-10
**Source:** Auto-generated from database (releases + features tables)

---

## 📋 Planned Releases

### 0.3.0 - TBD

**Status:** Planning
**Timeline:** Mar 31 - Jun 29, 2026

Details to be announced

*No features assigned yet*

---

### 0.2.0 - Production Launch

**Status:** Planning
**Timeline:** Nov 30 - Dec 31, 2025

Human OS Check-In System with pattern recognition, personalized workflow suggestions, adaptive reminders, success tracking

**Key Update (Dec 10, 2025):** Human OS is now a production-ready external platform that Renubu will integrate with, rather than building these capabilities from scratch. This reduces the Human OS Check-Ins effort from 64h to 32h.

**Infrastructure:**
- Human OS Platform (external) - Production-ready with REST API & MCP servers
- Human OS Integration (16h) - Connect Renubu to Human OS for context storage, graph queries, entity management

**Features Enabled by Human OS:**
- Pattern detection via Knowledge Graph API
- Relationship tracking via wiki link parsing
- "This worked for YOU before" via backlink analysis
- Multi-tenant data isolation via `renubu:tenant-{id}` layers

See [HUMAN_OS_INTEGRATION.md](docs/HUMAN_OS_INTEGRATION.md) for technical details.

---

---

## How to Update This Roadmap

**This file is auto-generated.** Do not edit manually.

To update:
1. Update releases and features in database
2. Run: `npm run roadmap`

To see historical roadmap:
```bash
npm run roadmap -- --version 0.1  # Generate for specific version
npm run roadmap -- --all          # Show all releases
```

---

**Related Documentation:**
- [FEATURES.md](docs/FEATURES.md) - Complete feature catalog (auto-generated)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Strategic guardrails & decisions
- Database: `releases` and `features` tables

**Last Updated:** 2025-11-18
