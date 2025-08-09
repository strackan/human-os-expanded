# Schema Consolidation Backup - Pre-Migration State

## Current State Documentation
**Date**: $(date)
**Goal**: Consolidate from MVP + Public schemas to Public schema only

## Current Schema Structure

### MVP Schema Tables:
- `mvp.users` - User profiles with auth integration
- `mvp.customers` - Customer records with contact references
- `mvp.contacts` - Contact management system  
- `mvp.renewals` - Renewal tracking
- `mvp.tasks` - Task management linked to renewals
- `mvp.events` - Event tracking
- `mvp.notes` - Notes system for customers/renewals

### Public Schema Tables:
- `public.profiles` - User profiles (similar to mvp.users)
- `public.contracts` - Contract records (references mvp.customers)
- `public.renewals` - Enhanced renewal records (references mvp.customers)
- `public.events` - Enhanced event tracking (references mvp.customers)
- `public.alerts` - Alert system (references mvp.customers)

### Key Files Using Schema Configuration:
- `src/lib/schema-config.ts` - Main schema configuration
- `src/lib/services/CustomerService.ts` - Uses mvp_customers views
- `src/hooks/useCustomers.ts` - Mixed schema usage
- `src/app/customers/[customerKey]/page.tsx` - Uses CustomerService
- `supabase/seed-mvp.sql` - MVP schema seed data
- `supabase/seed.sql` - Public schema seed data

### Current Active Configuration:
- ACTIVE_SCHEMA: 'mvp'
- Using mvp_customers views in public schema
- CustomerService queries mvp_customers views
- MVP schema contains all customer and contact data

## Migration Goals:
1. Move all MVP tables to public schema
2. Remove schema configuration logic
3. Simplify all queries to use public schema only
4. Consolidate seed data into single public schema seed
5. Remove MVP schema entirely

## Rollback Plan:
If migration fails:
1. Restore from this backup documentation
2. Revert code changes using git
3. Keep existing MVP schema active
4. Restore schema-config.ts configuration

## Files to Backup Before Changes:
- All migration files in supabase/migrations/
- src/lib/schema-config.ts
- src/lib/services/CustomerService.ts
- src/hooks/useCustomers.ts
- supabase/seed-mvp.sql
- supabase/seed.sql
