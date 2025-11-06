# Renubu Architecture Brief
## For Investors & Non-Technical Stakeholders

**Last Updated:** 2025-10-28
**Reading Time:** 5 minutes

---

## Executive Summary

Renubu is built on a modern, scalable architecture that enables rapid workflow creation without code deployments, supports customer-specific customizations, and positions us for AI integration and enterprise scale.

**Key Technical Advantages:**
- **Database-driven workflows** - Create new workflows in minutes vs. days
- **Multi-tenant ready** - One platform serves thousands of customers with custom workflows
- **Built for AI** - Architecture designed from day one for AI/ML integration
- **Production-proven stack** - Leveraging battle-tested technologies (PostgreSQL, Next.js)

---

## The Problem We Solve (Technical Angle)

### Traditional CSM Tools
- Dashboards show 100+ metrics with no guidance
- Generic, one-size-fits-all workflows
- Manual data entry across multiple systems
- No AI assistance or personalization

### Renubu's Innovation
- **One priority task** surfaced daily, powered by intelligent routing
- **Guided workflows** with step-by-step instructions
- **Single source of truth** - all customer data in context
- **AI-powered content** generation and recommendations

---

## Architecture Overview (Simple Terms)

Think of Renubu like a modern GPS for customer success managers:

```
┌─────────────────────────────────────────┐
│  DATABASE (Memory)                      │
│  Stores customer data, workflow         │
│  templates, and execution history       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  BUSINESS LOGIC (Brain)                 │
│  Assembles workflows, calculates        │
│  priorities, personalizes content       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  USER INTERFACE (Dashboard)             │
│  Beautiful, intuitive interface         │
│  CSMs interact with daily               │
└─────────────────────────────────────────┘
```

### What This Means for Business

**Traditional Approach:**
- Developer codes each workflow → 2-3 days
- Deploy to production → 1 day
- Customer wants customization → Start over
- **Total: 3-4 days per workflow**

**Renubu's Approach:**
- Create workflow in database → 5 minutes
- Instantly available → 0 deployment time
- Customer customization → Override in database
- **Total: 5 minutes per workflow**

**Impact:** 500x faster workflow creation, enabling rapid experimentation and customer-specific solutions.

---

## Key Technical Differentiators

### 1. Database-Driven Workflows (Our Secret Sauce)

**What it is:** Workflows are data, not code. They live in the database like customer records.

**Why it matters:**
- Launch new workflows without engineering deployment
- A/B test different approaches in real-time
- Customize workflows per customer without code changes
- Non-technical users can eventually build workflows (planned Q1 2026)

**Competitive Advantage:** Most competitors hardcode workflows. We store them as data. This is like the difference between writing a new program vs. filling out a form.

### 2. Template Library (Reusable Building Blocks)

**What it is:** Pre-built workflow "components" that can be mixed and matched.

**Why it matters:**
- Build complex 6-step workflow by listing 6 component IDs
- One component used across 100+ workflows
- Update one component, improve all workflows using it
- Drastically reduces development time

**Example:** Like having a LEGO set instead of sculpting each piece from clay.

### 3. Multi-Tenant Architecture (One Platform, Infinite Customization)

**What it is:** Single codebase serves all customers with isolated data and custom workflows.

**Why it matters:**
- Add new customer without deploying new infrastructure
- Customer-specific workflows coexist with standard templates
- Each customer's data 100% isolated for security
- Reduced operational costs (manage one system vs. thousands)

**Scaling Math:**
- Traditional: 1,000 customers = 1,000 deployments
- Renubu: 1,000 customers = 1 deployment + 1,000 database rows

### 4. Built for AI from Day One

**What it is:** Architecture designed to integrate AI at every layer, not bolted on afterward.

**Why it matters:**
- **Context-aware AI:** Every workflow has full customer history available
- **Streaming responses:** Real-time AI guidance as CSMs work
- **Personalization engine:** AI generates customer-specific emails, quotes, analysis
- **Learning loop:** Every interaction trains the system

**Roadmap:**
- Q4 2025: AI email generation
- Q1 2026: AI pricing recommendations
- Q2 2026: Predictive churn analysis
- Q3 2026: Autonomous workflow optimization

---

## Technology Stack (Investor-Friendly Translation)

### Frontend (What Users See)
- **Next.js + React** - Industry-standard web framework (used by Netflix, Uber, Nike)
- **TypeScript** - Prevents bugs before they reach production
- **TailwindCSS** - Modern, maintainable styling system

### Backend (What Powers It)
- **Supabase (PostgreSQL)** - Enterprise-grade database with built-in auth/security
- **Serverless Functions** - Scales automatically, pay-per-use (not per-server)
- **RESTful APIs** - Standard integration pattern for future partners

### AI/ML (Future)
- **Claude 3.5 Sonnet** - State-of-the-art language model
- **Streaming Architecture** - Real-time AI responses
- **Vector Database** - Semantic search over customer data (planned)

**Translation:** We use proven, modern technologies that Fortune 500 companies trust. Not bleeding-edge experimental tech.

---

## Scalability & Performance

### Current Performance
- **Dashboard load:** <200ms (server-side rendering)
- **Workflow launch:** <100ms (database insert)
- **Step navigation:** Instant (client-side state)
- **Database queries:** Optimized with proper indexes

### Scaling Projections

| Metric | Current | 1K Customers | 10K Customers | 100K Customers |
|--------|---------|--------------|---------------|----------------|
| Users | 50 | 1,000 | 10,000 | 100,000 |
| Daily Active | 10 | 200 | 2,000 | 20,000 |
| DB Size | 100MB | 2GB | 20GB | 200GB |
| Infrastructure Cost | $50/mo | $500/mo | $5K/mo | $50K/mo |
| Engineering Team | 2 | 4 | 8 | 15 |

**Key Point:** Linear scaling, not exponential. Standard playbook for SaaS companies.

### Infrastructure Strategy
- **Phase 1 (Now-1K users):** Supabase shared infrastructure ($50-500/mo)
- **Phase 2 (1K-10K users):** Dedicated database, load balancing ($5K-10K/mo)
- **Phase 3 (10K-100K users):** Multi-region deployment, CDN, caching ($50K-100K/mo)
- **Phase 4 (100K+ users):** Sharded database, microservices if needed ($100K+/mo)

---

## Security & Compliance

### Current Implementation
- **Authentication:** Enterprise OAuth (Google, Microsoft) + password
- **Authorization:** Row-level security (RLS) - users only see their data
- **Data Encryption:** At-rest and in-transit (TLS 1.3)
- **Database Backups:** Automated daily, 30-day retention

### Compliance Roadmap
- **Q4 2025:** SOC 2 Type I
- **Q1 2026:** SOC 2 Type II
- **Q2 2026:** GDPR compliance certification
- **Q3 2026:** ISO 27001 (if enterprise customers demand it)

### Data Residency
- **Now:** US-based (Supabase US-West region)
- **Q2 2026:** EU region option for European customers
- **Future:** Customer-choice data residency

---

## Competitive Technical Advantages

### vs. Salesforce (Gainsight)
- **Their approach:** Monolithic, complex, requires Salesforce admin
- **Our approach:** Standalone, simple, self-service
- **Advantage:** 10x faster implementation, 1/5th the cost

### vs. ChurnZero / Totango
- **Their approach:** Dashboard-heavy, analytics-focused
- **Our approach:** Action-first, workflow-driven, AI-powered
- **Advantage:** Proactive guidance vs. reactive dashboards

### vs. Spreadsheets (Status Quo)
- **Their approach:** Manual tracking, no automation, error-prone
- **Our approach:** Automated workflows, data-driven, intelligent
- **Advantage:** 75% time savings, zero missed renewals

---

## Development Velocity

### Our Current Pace
- **New workflow:** 5 minutes (database insert)
- **New feature:** 1-2 weeks (standard development)
- **Bug fix:** Same day (continuous deployment)
- **Customer customization:** <1 hour (database override)

### What This Enables
- **Rapid experimentation:** Test 10 workflow variations in a week
- **Customer feedback loop:** Implement feedback in days, not months
- **Competitive agility:** Respond to competitor features quickly
- **Investor demos:** Build new demo workflows on-demand

---

## Risk Mitigation

### Technical Risks & Mitigations

**Risk:** Supabase dependency (vendor lock-in)
- **Mitigation:** Supabase is open-source PostgreSQL. Can migrate to AWS RDS, Azure, or on-prem in <1 week if needed.

**Risk:** Scaling database performance
- **Mitigation:** Standard PostgreSQL scaling patterns. Proven to billions of rows.

**Risk:** AI model costs (Claude API)
- **Mitigation:** Usage-based pricing. Cost per workflow: ~$0.10. At scale, consider self-hosted models.

**Risk:** Key person dependency (current team)
- **Mitigation:** Modern, well-documented stack. Hiring pool is massive (React/Next.js/PostgreSQL).

---

## Investment in Technical Infrastructure

### Current Spend
- **Infrastructure:** ~$50/month (Supabase, Vercel hosting)
- **Development Tools:** ~$200/month (GitHub, monitoring, etc.)
- **Total Tech Spend:** ~$250/month

### Projected Spend (with growth)
- **At 1K users:** ~$500-1K/month
- **At 10K users:** ~$5-10K/month
- **At 100K users:** ~$50-100K/month

**Gross Margin Implications:**
- Assume $100/user/month pricing
- At 10K users: $1M monthly revenue
- Infrastructure: $10K (1% of revenue)
- **Gross margin: 85-90%** (SaaS industry standard)

---

## Roadmap: Technical Evolution

### Q4 2025 (Current)
- ✅ Database-driven workflows
- ✅ Step-level workflow actions
- 🔄 AI email generation (in progress)
- 📅 Workflow sequences (chains)

### Q1 2026
- Visual workflow builder (no-code)
- Custom slide creator
- AI pricing recommendations
- Mobile responsive design

### Q2 2026
- Predictive analytics dashboard
- Multi-workflow orchestration
- CRM integrations (Salesforce, HubSpot)
- Advanced AI agents

### Q3-Q4 2026
- Integration marketplace
- White-label capabilities
- On-premise deployment option (enterprise)
- Advanced reporting & BI

---

## Why This Architecture Wins

1. **Speed to Market:** Deploy new features 10x faster than competitors
2. **Customer Flexibility:** Customize per customer without custom code
3. **AI-Ready:** Built for AI integration from day one, not retrofitted
4. **Scalable Economics:** Gross margins improve with scale (standard SaaS)
5. **Low Technical Risk:** Proven technologies, established scaling patterns
6. **Defensible Moat:** Database-driven workflow engine is proprietary IP

---

## Questions Investors Ask

**Q: Can this scale to 100K users?**
A: Yes. PostgreSQL powers systems with billions of rows. Standard scaling playbook.

**Q: What if Supabase goes away?**
A: Supabase is open-source PostgreSQL. We can migrate to any PostgreSQL host in days.

**Q: How much will infrastructure cost at scale?**
A: ~1-2% of revenue (industry standard). $50K/mo infrastructure at $5M/mo revenue.

**Q: Can customers self-host (on-premise)?**
A: Not currently, but architecture supports it. Planned for enterprise customers in 2026.

**Q: What's your technical moat?**
A: Database-driven workflow engine + AI personalization layer + template library = unique IP.

**Q: How quickly can you hire engineers?**
A: Large talent pool (React/TypeScript/PostgreSQL). Industry-standard stack.

---

## Bottom Line for Investors

Renubu's technical architecture is:
- ✅ **Modern** - Industry-standard technologies
- ✅ **Scalable** - Linear scaling economics
- ✅ **Fast** - 10x faster development than competitors
- ✅ **Flexible** - Multi-tenant, customizable, AI-ready
- ✅ **Low-risk** - Proven patterns, established scaling playbook

**Technical foundation supports aggressive growth without re-architecture.**

---

**For More Details:**
- [Product Overview](SYSTEM-OVERVIEW.md) - High-level product walkthrough
- [Technical Architecture](../technical/ARCHITECTURE.md) - Deep dive for engineers
- [Database Schema](../technical/DATABASE.md) - Data structure details

**Questions?** Contact the founding team.
