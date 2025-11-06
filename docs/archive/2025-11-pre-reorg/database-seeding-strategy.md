# Database Seeding Strategy

## Overview

This document outlines the database seeding strategy for Renubu across different environments.

## Current Seed Data (`supabase/seed.sql`)

The current seed file contains:

### 1. Admin User
- **Email**: `admin`
- **Password**: `Renubu123`
- **Purpose**: Local development authentication
- **Created in**: `auth.users` table with corresponding `profiles` entry

### 2. Mock Customers (15 total)
Companies with realistic data for testing:
- Acme Corporation, RiskyCorp, TechStart Inc, Global Solutions, StartupXYZ
- Nimbus Analytics, Venture Partners, Horizon Systems, Quantum Soft, Apex Media
- Stellar Networks, FusionWare, Dynamic Ventures, Prime Holdings, BetaWorks

Each customer includes:
- Core customer record (name, domain, industry, health_score, ARR, renewal_date)
- Customer properties (usage_score, nps_score)
- Primary contact
- Renewals (where applicable)
- Related events and alerts

### 3. Renewal Dates
Dynamically calculated to be 15-150 days from the current date:
- **Urgent** (15-30 days): RiskyCorp, StartupXYZ, Horizon Systems, FusionWare
- **Warning** (31-90 days): Acme Corporation, TechStart Inc, Quantum Soft, Apex Media
- **Good** (91-150 days): Global Solutions, Nimbus Analytics, Venture Partners, Stellar Networks, Dynamic Ventures, Prime Holdings, BetaWorks

## Environment-Specific Strategy

### Local Development
**Keep full seed data**
- ✅ Admin user for authentication
- ✅ 15 mock customers for testing all features
- ✅ Contacts, renewals, and related data
- **Purpose**: Provides realistic data for development and testing

**Command**: `npx supabase db reset` (runs migrations + seed.sql)

### Staging Environment
**Keep full seed data**
- ✅ Admin user for testing authentication flows
- ✅ 15 mock customers for demos and testing
- ✅ Full relational data for integration testing
- **Purpose**: Mirrors production schema but with test data

**Setup**:
1. Migrations run automatically via Supabase CLI or dashboard
2. Seed data loaded manually or via CI/CD if needed
3. Safe to reset and reseed as needed

### Production Environment
**CLEAN DATABASE - NO SEED DATA**
- ❌ No admin user (use real OAuth accounts)
- ❌ No mock customers
- ❌ No test data
- **Purpose**: Start with empty tables for real customer data

**Exception**: If you need an emergency admin account:
```sql
-- Optional: Create real admin user with your email
INSERT INTO auth.users (...)
VALUES (...); -- Use real email and secure password
```

## Migration Path

### From Staging to Production

**Step 1: Run Migrations Only**
```bash
# Production Supabase project
npx supabase db push --linked
```
This runs **only** the migration files, NOT the seed.sql.

**Step 2: Verify Empty Tables**
```sql
SELECT COUNT(*) FROM customers; -- Should return 0
SELECT COUNT(*) FROM contracts; -- Should return 0
SELECT COUNT(*) FROM renewals;  -- Should return 0
```

**Step 3: Create First Real User**
- Use OAuth sign-in (Google, GitHub, etc.)
- First user becomes company admin
- No seed data needed

### Data Isolation

Production RLS (Row Level Security) policies ensure:
- Users only see their company's data
- No cross-tenant data leakage
- Customers table filtered by auth context

## Seed Data Scripts

### Additional Seed Scripts (for specific scenarios)

Located in `supabase/scripts/`:

1. **`seed_aco_demo_data.sql`** - American Companies Only demo data
2. **`seed_contacts_relationship_data.sql`** - Additional contact relationships
3. **`seed_obsidian_black_expansion_data.sql`** - Obsidian Black customer scenario
4. **`seed_demo_workflow_definitions.sql`** - Workflow templates
5. **`seed_techflow_expansion_data.sql`** - TechFlow customer scenario

These are **optional** and typically used for:
- Specific demo scenarios
- Feature-specific testing
- Customer success presentations

## Best Practices

### Development
- ✅ Reset database regularly to ensure seed data is current
- ✅ Test with full seed data to catch relational issues
- ✅ Use `TRUNCATE CASCADE` in seed.sql to clear old data

### Staging
- ✅ Keep seed data synchronized with development
- ✅ Use for integration testing and demos
- ✅ Safe to reset as needed

### Production
- ❌ **NEVER** run seed.sql in production
- ✅ Run migrations only
- ✅ Verify empty tables before go-live
- ✅ Use real OAuth for authentication
- ✅ Let customers create their own data organically

## Verification Commands

### Check if database is seeded:
```sql
SELECT
  (SELECT COUNT(*) FROM customers) as customer_count,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'admin') as has_admin_user,
  (SELECT COUNT(*) FROM renewals) as renewal_count;
```

**Expected results**:
- **Development/Staging**: `customer_count=15`, `has_admin_user=1`, `renewal_count>0`
- **Production**: `customer_count=0`, `has_admin_user=0`, `renewal_count=0`

### Reset local database:
```bash
# Drops all tables, reruns migrations, and reapplies seed data
npx supabase db reset
```

### Apply only migrations (production):
```bash
# Runs migrations without seed data
npx supabase db push --linked
```

## Future Considerations

### Seed Data Maintenance
- Update mock customer data to reflect new features
- Keep renewal dates dynamic (relative to current date)
- Add new relational data as schema evolves

### Production Data Management
- Consider automated backups before major migrations
- Plan for data migration scripts if restructuring schema
- Document any one-time data transformation scripts separately

## Summary

| Environment | Admin User | Mock Customers | Seed Data | Purpose |
|-------------|-----------|----------------|-----------|---------|
| **Development** | ✅ Yes | ✅ Yes (15) | ✅ Full | Testing & development |
| **Staging** | ✅ Yes | ✅ Yes (15) | ✅ Full | Integration testing & demos |
| **Production** | ❌ No | ❌ No | ❌ None | Real customer data only |

**Key Takeaway**: Production should always start with a clean database. Use migrations for schema, OAuth for authentication, and let real customers create their own data.
