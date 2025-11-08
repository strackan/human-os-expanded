# Renubu Product Roadmap

**Last Generated:** 2025-11-08
**Source:** Auto-generated from database (releases + features tables)

---

## 🚀 Current Release: 0.2 - MCP Registry & Integrations

**Status:** In Progress
**Timeline:** January 2026

Build out the MCP marketplace with essential integrations for customer workflows.

**Features:** 4 | **Total Effort:** 25h

- [ ] **MCP Registry Infrastructure** (3h) - Planned
  - Marketplace database schema
  - OAuth token storage
  - Admin approval workflow

- [ ] **Google Calendar Integration** (8h) - Planned
  - OAuth integration, read/write events
  - `findNextOpening()` algorithm

- [ ] **Slack Integration** (8h) - Planned
  - OAuth integration, send messages
  - Admin enable/disable controls

- [ ] **Gmail Integration** (6h) - Planned
  - OAuth integration, send/search emails
  - User confirmation for send operations

---

## 📋 Planned Releases

### 1.0 - Workflow Snoozing

**Status:** Planned
**Timeline:** Nov 25 - Dec 20, 2025

Core product promise: "I won't let you forget." Enables users to park workflows until specific dates or business conditions are met.

**Features:** 1 | **Total Effort:** 125h

- [ ] **Workflow Snoozing** (125h) - Planned
  - Condition-based wake logic
  - Database fields: snoozed_until, wake_conditions
  - Daily cron evaluation service
  - Smart surface algorithm

---

### 2.0 - Parking Lot

**Status:** Planned
**Timeline:** Jan 6-17, 2026

Quick capture for non-time-sensitive ideas and tasks. Provides peace of mind without cluttering active workflows.

**Features:** 1 | **Total Effort:** 16h

- [ ] **Parking Lot** (16h) - Planned
  - Simple table: parking_lot_items
  - Tag-based organization
  - Quick add UI (<5 sec capture)

---

### 3.0 - Human OS Check-Ins

**Status:** Planned
**Timeline:** Feb 3 - Mar 28, 2026

THE competitive moat. Creates learning loop where system discovers what works for each specific user. Justifies premium pricing.

**Features:** 1 | **Total Effort:** 64h

- [ ] **Human OS Check-Ins** (64h) - Planned
  - Post-completion check-in prompts
  - Pattern detection service
  - Recommendation engine
  - "This worked for YOU before" insights

---

## ✅ Completed Releases

### 0.1 - MCP Foundation & Documentation

**Status:** Complete
**Timeline:** Shipped Nov 8, 2025

MCP server with 8 core operations, documentation system, feature tracking, automation scripts.

**Features:** 5 | **Total Effort:** 92h

- Complete: 5
- Shipped: Nov 8, 2025

---

### 0.0 - Sprint 0: Auth & Infrastructure

**Status:** Complete
**Timeline:** Shipped Nov 5, 2025

Force-enable demo mode, auth debugging, timeout detection, signin redirect fixes.

**Features:** 2 | **Total Effort:** 20h

- Complete: 2
- Shipped: Nov 5, 2025

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

**Last Updated:** 2025-11-08

**Note:** This is a placeholder roadmap. Once database migrations are applied, run `npm run roadmap` to generate from database.
