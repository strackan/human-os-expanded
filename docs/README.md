# Renubu Documentation Hub

**Welcome!** This is your starting point for all Renubu documentation.

---

## 🎯 I want to...

### Understand the Product
- **[What is Renubu?](product/SYSTEM-OVERVIEW.md)** - Product overview for stakeholders (10 min read)
- **[User Guide](product/USER-GUIDE.md)** - How to use Renubu features *(coming soon)*

### Learn the Technical Architecture
- **[System Architecture](technical/ARCHITECTURE.md)** - Complete technical design & data flow (30 min read)
- **[Database Schema](technical/DATABASE.md)** - All tables, migrations, queries (reference)
- **[API Reference](technical/API-REFERENCE.md)** - Services, hooks, components *(coming soon)*

### Implement a Feature
- **[Step-Level Actions](guides/STEP-ACTIONS.md)** - Snooze/skip individual steps
- **[Workflow System](guides/WORKFLOWS.md)** - Creating database-driven workflows
- **[Contract Terms](guides/CONTRACT-TERMS.md)** - Using the contract_terms table

### Plan & Track Progress
- **[Roadmap](planning/ROADMAP.md)** - Current phase, what's next
- **[Changelog](planning/CHANGELOG.md)** - Version history, recent changes

---

## 📚 By Role

### Stakeholder / Product Manager
**Start here:**
1. [System Overview](product/SYSTEM-OVERVIEW.md) - Understand what Renubu does
2. [Roadmap](planning/ROADMAP.md) - See what's coming next

### New Developer
**Onboarding path:**
1. [System Overview](product/SYSTEM-OVERVIEW.md) - High-level understanding
2. [Architecture Guide](technical/ARCHITECTURE.md) - Deep technical dive
3. [Database Schema](technical/DATABASE.md) - Data structures
4. [Implementation Guides](guides/) - Start building

### Implementing a Feature
**Quick reference:**
1. Check [Guides](guides/) for your feature
2. Reference [Architecture](technical/ARCHITECTURE.md) for data flow
3. Reference [Database](technical/DATABASE.md) for schema
4. Update [Changelog](planning/CHANGELOG.md) when done

---

## 🗂️ Documentation Structure

```
docs/
├── README.md (you are here)
│
├── product/              Product documentation
│   ├── SYSTEM-OVERVIEW.md    What Renubu does
│   └── USER-GUIDE.md         How to use features
│
├── technical/            Technical reference
│   ├── ARCHITECTURE.md       System design & data flow
│   ├── DATABASE.md           Schema, tables, queries
│   └── API-REFERENCE.md      Services, hooks, components
│
├── guides/               Implementation how-tos
│   ├── STEP-ACTIONS.md       Step-level snooze/skip
│   ├── WORKFLOWS.md          Database-driven workflows
│   └── CONTRACT-TERMS.md     Contract terms table
│
├── planning/             Project management
│   ├── ROADMAP.md            What's next
│   └── CHANGELOG.md          Version history
│
└── archive/              Historical docs
    └── v0-pre-consolidation/ Old documentation (88 files)
```

---

## 🔍 Quick Finds

**Common Questions:**
- How does data flow through the system? → [Architecture: Data Flow](technical/ARCHITECTURE.md#data-flow-diagrams)
- What tables exist? → [Database Reference](technical/DATABASE.md#core-tables)
- How do I create a workflow? → [Workflow Guide](guides/WORKFLOWS.md)
- What's the current phase? → [Roadmap](planning/ROADMAP.md)

**Recent Features:**
- Step-level actions (Oct 2025) → [Guide](guides/STEP-ACTIONS.md)
- Contract terms table (Oct 2025) → [Guide](guides/CONTRACT-TERMS.md)
- Database-driven workflows (Phase 3) → [Architecture](technical/ARCHITECTURE.md#database-driven-workflows)

---

## 📝 Contributing to Documentation

### Updating Existing Docs
1. Find the relevant document using this README
2. Edit the document directly
3. Add entry to "Recent Changes" section at top
4. Update "Last Updated" date
5. Update [Changelog](planning/CHANGELOG.md)

### When to Create New Docs
✅ **Create new guide** if:
- Implementing substantial new feature
- Creating tutorial for complex workflow
- Documenting new API/service

❌ **Update existing doc** for:
- Architecture changes → Update `technical/ARCHITECTURE.md`
- Database changes → Update `technical/DATABASE.md`
- Feature modifications → Update relevant guide in `guides/`

### Cross-Referencing
Use relative links to connect documents:
```markdown
See [Database Schema](technical/DATABASE.md#workflow-tables) for details.
```

---

## 🏛️ Archive

Previous documentation (pre-consolidation) is preserved in:
- **[archive/v0-pre-consolidation/](archive/v0-pre-consolidation/)** - 88 original markdown files

These are kept for reference but are no longer maintained.

---

## 🆘 Need Help?

- **Can't find what you're looking for?** Check [archive/v0-pre-consolidation/](archive/v0-pre-consolidation/)
- **Found outdated content?** Please update it and add a changelog entry
- **Documentation issue?** Create an issue describing the problem

---

**Last Updated:** 2025-10-23
**Documentation Version:** 1.0 (Post-consolidation)
