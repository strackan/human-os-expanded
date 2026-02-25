# Renubu Database System - Complete Guide

## 🎯 **Overview**

This comprehensive guide covers the entire database system for the Renubu application, including schema management, migrations, seeding, validation, and upgrade processes. This consolidates information from multiple documentation files into a single source of truth.

## 🏗️ **Current Architecture**

### **Schema Structure**
The Renubu application has undergone a schema consolidation process and now uses a **single public schema** approach:

- **Primary Schema**: `public` - Contains all production tables
- **Legacy Schema**: `mvp` - Deprecated, will be removed in future migrations
- **Seed Configuration**: Uses `seed.sql` for data seeding

### **Core Tables**
```sql
-- Primary entities
public.profiles         -- User profiles with auth integration
public.customers        -- Customer records with contact references
public.contacts         -- Contact management system
public.contracts        -- Contract records
public.renewals         -- Renewal tracking with AI insights
public.tasks           -- Task management linked to renewals
public.events          -- Event tracking
public.alerts          -- Alert system
public.notes           -- Notes system for customers/renewals

-- Supporting tables
public.task_templates          -- Workflow blueprints
public.renewal_tasks          -- Tasks linked to renewals
public.renewal_workflow_outcomes -- Workflow tracking
public.workflow_conversations  -- Conversation history
public.conversation_messages   -- Message details
```

## 🔄 **Database Upgrade Process Status**

### **✅ Current Upgrade System - INTACT**

The database upgrade process is **fully functional** and consists of:

#### **1. Schema Consolidation Migration**
- **File**: `supabase/migrations/20250625000001_optimized_public_schema_consolidation.sql`
- **Purpose**: Consolidates MVP and public schemas into single public schema
- **Status**: ✅ Active and working
- **Features**:
  - Drops conflicting structures
  - Creates comprehensive public schema tables
  - Enables RLS with proper policies
  - Creates performance indexes
  - Sets up triggers for user management

#### **2. Migration Chain**
```
20250101000000_create_schemas.sql           ✅ Creates base schemas
20250101000001_migrate_to_prod_schema.sql   ✅ Production schema setup
20250101000002_create_mvp_schema.sql        ✅ MVP schema (deprecated)
20250101000005_schema_configuration.sql     ✅ Schema config
20250618023605_remote_schema.sql            ✅ Remote schema sync
20250618023606_create_profiles_table.sql    ✅ User profiles
20250619182009_remote_schema.sql            ✅ Updated remote sync
20250619182010_create_essential_tables.sql  ✅ Essential tables
20250619190000_event_priority_and_workflow.sql ✅ Workflow system
20250619200000_customer_properties_and_date_monitoring.sql ✅ Customer enhancements
20250621171617_action_scoring_system.sql    ✅ Action scoring
20250621171618_get_next_priority_task.sql   ✅ Task functions
20250621171619_fix_extract_function.sql     ✅ Function fixes
20250623174451_create_workflow_conversation_tables.sql ✅ Conversation system
20250623174452_add_date_override_to_task_function.sql ✅ Task enhancements
20250623174453_fix_function_conflict.sql    ✅ Conflict resolution
20250624000000_fix_mvp_schema_contacts.sql  ✅ Contact system
20250624000001_migrate_existing_contact_data.sql ✅ Data migration
20250624000002_fix_foreign_key_constraints.sql ✅ Constraint fixes
20250625000001_optimized_public_schema_consolidation.sql ✅ Final consolidation
```

#### **3. Seed Data System**
- **Configuration**: `supabase/config.toml` - Fixed to use `seed.sql`
- **Seed File**: `supabase/seed.sql` - Contains comprehensive sample data
- **Status**: ✅ Working (recently fixed)

## 📋 **Schema Management Process**

### **Current Best Practices**

#### **1. Making Schema Changes**
```bash
# Step 1: Create migration file
# File: supabase/migrations/[timestamp]_description.sql
ALTER TABLE public.customers ADD COLUMN new_field TEXT;

# Step 2: Update centralized types
# File: src/types/customer.ts
export interface Customer {
  // ... existing fields
  new_field?: string;
}

# Step 3: Update schema validator
# File: src/lib/schema-validator.ts
private static optionalFields = [
  'current_arr',
  'renewal_date',
  'assigned_to',
  'new_field', // Add new field here
];

# Step 4: Apply and validate
npx supabase db push
npm run sync-schema      # Auto-generate from DB
npm run validate-schema  # Check all files
npm run type-check       # TypeScript validation
```

#### **2. Single Source of Truth**
- **Types**: All TypeScript interfaces in `src/types/customer.ts`
- **Validation**: Runtime schema validation in `src/lib/schema-validator.ts`
- **Auto-Generation**: Schema sync tool in `scripts/sync-schema.ts`

## 🛠️ **Available Tools & Scripts**

### **Schema Management Scripts**
```bash
# Schema synchronization
npm run sync-schema      # Auto-generate types from database
npm run validate-schema  # Validate all files use correct types
npm run type-check       # TypeScript type checking

# Database operations
npx supabase db push     # Apply migrations to database
npx supabase db reset    # Reset database with migrations and seed
npx supabase db diff     # Generate schema differences
npx supabase status      # Check Supabase status
```

### **Development Scripts**
```bash
# Environment and configuration
npm run check-env        # Check environment variables
npm run check-oauth      # Check OAuth configuration
npm run clear-auth       # Clear authentication cookies

# Database utilities
node scripts/show-tables.js        # Show database tables
node scripts/show-tables-simple.js # Simple table listing
node scripts/validate-schema.js    # Comprehensive schema validation
```

### **Schema Management Tools**

#### **1. Schema Detection** (`npm run detect-schema`)
- Analyzes migration files to determine active schema
- Provides configuration recommendations
- Validates seed file existence

#### **2. Smart Seed Selector** (`npm run smart-seed`)
- Automatically selects appropriate seed file
- Updates Supabase configuration
- Validates seed file integrity

#### **3. Schema Diff Manager** (`npm run schema-diff`)
- Analyzes schema differences
- Detects conflicts and provides resolution
- Generates comprehensive reports

## 📊 **Current Schema Reference**

### **Customers Table Structure**
```sql
CREATE TABLE public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    industry TEXT,
    health_score INTEGER DEFAULT 50,
    primary_contact_id UUID REFERENCES public.contacts(id),
    primary_contact_name TEXT, -- Legacy field
    primary_contact_email TEXT, -- Legacy field
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **TypeScript Interface**
```typescript
export interface Customer {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  health_score?: number;
  primary_contact_id?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  current_arr?: number;
  renewal_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}
```

### **Extended Types**
```typescript
export interface CustomerWithContact extends Customer {
  primary_contact?: Contact;
}

export interface CustomerFilters {
  search?: string;
  industry?: string;
  health_score_min?: number;
  health_score_max?: number;
  renewal_date_from?: string;
  renewal_date_to?: string;
}

export interface CustomerSortOptions {
  field: keyof Customer;
  direction: 'asc' | 'desc';
}
```

## 🔧 **Configuration Files**

### **Supabase Configuration** (`supabase/config.toml`)
```toml
[db.seed]
enabled = true
sql_paths = ["./seed.sql"]  # Fixed to use correct seed file

[api]
schemas = ["public", "graphql_public", "mvp"]
extra_search_path = ["public", "extensions", "mvp"]
```

### **Environment Variables**
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🚨 **Common Issues & Solutions**

### **1. Seed Data Not Loading**
**Problem**: Customers page shows no data
**Solution**: 
```bash
# Check config.toml points to correct seed file
# Ensure seed.sql exists and has valid data
npx supabase db reset  # Apply migrations and seed data
```

### **2. Schema Validation Errors**
**Problem**: Type mismatches between database and TypeScript
**Solution**:
```bash
npm run sync-schema      # Regenerate types from database
npm run validate-schema  # Check for inconsistencies
npm run type-check       # Fix TypeScript errors
```

### **3. Migration Conflicts**
**Problem**: Conflicting table or constraint definitions
**Solution**:
- Use `IF NOT EXISTS` in CREATE statements
- Use `DROP IF EXISTS` before recreating
- Check the consolidation migration for examples

### **4. Foreign Key Constraint Errors**
**Problem**: References to non-existent tables
**Solution**:
- Ensure tables are created in correct order
- Use proper schema prefixes (`public.table_name`)
- Check constraint definitions in migration files

## 📝 **Development Workflow**

### **Daily Development**
```bash
# 1. Start development environment
npx supabase start       # Start local Supabase
npm run dev             # Start Next.js development server

# 2. Check database status
npx supabase status     # Verify services are running
npm run validate-schema # Ensure schema consistency
```

### **Making Schema Changes**
```bash
# 1. Create migration file
# File: supabase/migrations/YYYYMMDD_description.sql

# 2. Update TypeScript types
# File: src/types/customer.ts

# 3. Apply changes
npx supabase db push    # Apply migration
npm run sync-schema     # Update types
npm run validate-schema # Validate consistency

# 4. Test changes
npm run type-check      # Check TypeScript
npm run dev            # Test in browser
```

### **Troubleshooting Database Issues**
```bash
# 1. Check Supabase status
npx supabase status

# 2. View logs
npx supabase logs

# 3. Reset if needed (caution: loses data)
npx supabase db reset

# 4. Validate schema
npm run validate-schema
```

## 🔍 **Monitoring & Validation**

### **Schema Validation Checklist**
- [ ] Migration file created with proper naming
- [ ] TypeScript types updated in `src/types/customer.ts`
- [ ] Schema validator updated in `src/lib/schema-validator.ts`
- [ ] API routes updated if needed
- [ ] Tests updated if needed
- [ ] Documentation updated

### **Health Check Commands**
```bash
# Database health
npx supabase status
npx supabase db diff

# Schema health
npm run validate-schema
npm run type-check

# Application health
npm run build
npm run lint
```

## 📚 **File Structure Reference**

### **Database Files**
```
supabase/
├── config.toml                    # Main configuration
├── seed.sql                      # Sample data (active)
├── migrations/                   # All database migrations
│   ├── 20250625000001_optimized_public_schema_consolidation.sql
│   └── ... (other migrations)
└── schema-analysis-report.json   # Generated analysis reports

scripts/
├── sync-schema.ts               # Type generation tool
├── validate-schema.js           # Schema validation
├── show-tables.js              # Database inspection
└── migrate-styles.js           # Style migration helper

src/
├── types/customer.ts           # Single source of truth for types
├── lib/
│   ├── schema-validator.ts     # Runtime validation
│   ├── supabase.ts            # Client configuration
│   └── supabase-server.ts     # Server configuration
└── lib/services/
    └── CustomerService.ts      # Database service layer
```

### **Key Import Pattern**
```typescript
// ✅ Always import from centralized types
import { Customer, CustomerWithContact, CustomerFilters } from '@/types';

// ❌ Never define types locally
interface Customer { ... } // Don't do this
```

## 🚀 **Future Enhancements**

### **Planned Improvements**
1. **Complete MVP Schema Removal**: Remove deprecated `mvp` schema
2. **Enhanced Validation**: Real-time schema validation
3. **Automated Testing**: Schema change testing pipeline
4. **Performance Monitoring**: Query performance tracking
5. **Backup System**: Automated backup and restore

### **Migration Roadmap**
1. ✅ Schema consolidation completed
2. ✅ Seed data system fixed
3. 🔄 Remove MVP schema dependencies
4. 📋 Implement automated schema testing
5. 📋 Add performance monitoring

## 🎯 **Quick Reference**

### **Emergency Commands**
```bash
# Database completely broken
npx supabase stop
npx supabase reset
npx supabase start

# Schema validation failed
npm run sync-schema
npm run validate-schema
npm run type-check

# Application won't start
npm run check-env
npm run clear-auth
npm run dev
```

### **Daily Commands**
```bash
# Check everything is working
npx supabase status
npm run validate-schema

# Apply changes
npx supabase db push
npm run sync-schema
```

---

## 📋 **Status Summary**

### **✅ Working Systems**
- Database migration chain
- Schema consolidation
- Seed data application
- Type generation and validation
- Customer data querying
- Development tools and scripts

### **🔧 Recently Fixed**
- Seed data configuration (`config.toml` now points to `seed.sql`)
- Customer page data loading
- Schema consolidation conflicts

### **📋 Maintenance Required**
- Remove deprecated MVP schema references
- Update any remaining hardcoded schema references
- Implement automated schema testing

---

**This guide represents the current state of the Renubu database system as of the latest consolidation. All upgrade processes are intact and functional.**
