# CHECKPOINT-001: Database Schema for Account Plans

**Date**: 2025-10-12
**Type**: Technical Review
**Engineer**: BE
**Status**: ⏸️ AWAITING JUSTIN APPROVAL

---

## What's Being Added

Add account plan support to the customers table:

```sql
-- Migration: 20251012000000_account_plans.sql

ALTER TABLE public.customers
  ADD COLUMN account_plan TEXT
  CHECK (account_plan IN ('invest', 'expand', 'manage', 'monitor'));

CREATE INDEX idx_customers_account_plan
  ON public.customers(account_plan);

ALTER TABLE public.customers
  ADD COLUMN risk_score NUMERIC(4,1),
  ADD COLUMN opportunity_score NUMERIC(4,1);

COMMENT ON COLUMN public.customers.account_plan IS
  'Strategic plan type: invest (1.5x), expand (1.3x), manage (1.0x), monitor (1.2x)';
COMMENT ON COLUMN public.customers.risk_score IS
  'Risk score 0-10 (demo data only, not calculated yet)';
COMMENT ON COLUMN public.customers.opportunity_score IS
  'Opportunity score 0-10 (demo data only, not calculated yet)';
```

---

## Questions for Justin

**Q1**: Are these the correct 4 plan types?
- invest (long-term strategic growth)
- expand (short-term revenue opportunity)
- manage (standard touch, high-threshold)
- monitor (at-risk, defensive attention)

**Q2**: Should account_plan be nullable or required?
- Recommendation: NULLABLE (customers without plans are valid)
- Can be set via "Establish Account Plan" workflow

**Q3**: Risk/opportunity scores - should these be INTEGER (0-10) or NUMERIC with decimals (7.2)?
- Recommendation: NUMERIC(4,1) allows 0.0-10.0 with one decimal

---

## PM Recommendation

✅ **Approve as written** - Schema matches automation backup structure, allows nullable account_plan for phased rollout.

---

## Approval

- [ ] **Justin Approved** - Date: ___________
- [ ] **Justin Requested Changes** - See notes below:

**Notes:**
