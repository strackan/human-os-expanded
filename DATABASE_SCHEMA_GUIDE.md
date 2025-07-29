# Database Schema Management Guide

## 🎯 **Overview**

This guide documents our streamlined approach to database schema changes in the Renubu MVP. Following this process ensures consistency, reduces errors, and makes schema changes much more manageable.

## 🏗️ **Architecture**

### **Single Source of Truth**
- **Types**: All TypeScript interfaces defined in `src/types/customer.ts`
- **Validation**: Runtime schema validation in `src/lib/schema-validator.ts`
- **Auto-Generation**: Schema sync tool in `scripts/sync-schema.ts`

### **Key Principles**
1. **Never define types locally** - Always import from `src/types`
2. **Use centralized validation** - Leverage `SchemaValidator` class
3. **Auto-sync when possible** - Run `npm run sync-schema` after migrations
4. **Validate everything** - Use `npm run validate-schema` to catch issues

## 📋 **Schema Change Process**

### **Step 1: Create Migration**
```sql
-- Create new migration file: supabase/migrations/[timestamp]_description.sql
-- Example: 20250101000005_add_new_field.sql

-- Add your schema changes here
ALTER TABLE renubu_mvp.customers ADD COLUMN new_field TEXT;

-- Update the public view
DROP VIEW IF EXISTS public.customers;
CREATE OR REPLACE VIEW public.customers AS SELECT * FROM renubu_mvp.customers;
```

### **Step 2: Update Centralized Types**
```typescript
// Update src/types/customer.ts
export interface Customer {
  id: string;
  name: string;
  domain: string;
  new_field?: string; // Add your new field here
  // ... other fields
}
```

### **Step 3: Update Schema Validator**
```typescript
// Update src/lib/schema-validator.ts
private static optionalFields = [
  'current_arr',
  'renewal_date',
  'assigned_to',
  'new_field', // Add your new field here
  // ... other fields
];
```

### **Step 4: Run Validation**
```bash
# Apply migration
npx supabase db push

# Auto-sync types (optional)
npm run sync-schema

# Validate everything
npm run validate-schema

# Type check
npm run type-check
```

## 🚨 **Common Mistakes to Avoid**

### **❌ Don't Do This:**
```typescript
// ❌ Defining types locally
interface Customer {
  id: string;
  name: string;
  // ... local definition
}

// ❌ Using old field references
const customer = {
  industry: 'tech', // ❌ This field was removed
  health_score: 85  // ❌ This field was removed
};
```

### **✅ Do This Instead:**
```typescript
// ✅ Import from centralized types
import { Customer, CustomerFormData } from '@/types';

// ✅ Use current fields only
const customer: Customer = {
  id: '123',
  name: 'Acme Corp',
  domain: 'acme.com',
  current_arr: 100000
};
```

## 🛠️ **Available Tools**

### **Schema Sync Tool**
```bash
# Auto-generate types from database
npm run sync-schema

# Validate all files use correct types
npm run validate-schema
```

### **Runtime Validation**
```typescript
import { SchemaValidator } from '@/lib/schema-validator';

// Validate customer data
const result = SchemaValidator.validateCustomer(customerData);
if (!result.isValid) {
  console.error('Schema validation failed:', result.errors);
}
```

### **Type Checking**
```bash
# Check for type errors
npm run type-check

# Lint for consistency
npm run lint
```

## 📊 **Current Schema Reference**

### **Customers Table**
```sql
CREATE TABLE renubu_mvp.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    current_arr DECIMAL(12,2) DEFAULT 0,
    renewal_date DATE,
    assigned_to UUID REFERENCES renubu_mvp.users(id),
    csm_id UUID REFERENCES renubu_mvp.users(id),
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **TypeScript Interface**
```typescript
export interface Customer {
  id: string;
  name: string;
  domain: string;
  current_arr?: number;
  renewal_date?: string;
  assigned_to?: string;
  csm_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}
```

## 🔄 **Migration Examples**

### **Adding a Field**
```sql
-- Migration: 20250101000006_add_status_field.sql
ALTER TABLE renubu_mvp.customers ADD COLUMN status TEXT DEFAULT 'active';
```

```typescript
// Update src/types/customer.ts
export interface Customer {
  // ... existing fields
  status?: string;
}
```

### **Removing a Field**
```sql
-- Migration: 20250101000007_remove_old_field.sql
ALTER TABLE renubu_mvp.customers DROP COLUMN IF EXISTS old_field;
```

```typescript
// Update src/types/customer.ts
export interface Customer {
  // ... existing fields (remove old_field)
}
```

### **Changing Field Type**
```sql
-- Migration: 20250101000008_change_field_type.sql
ALTER TABLE renubu_mvp.customers ALTER COLUMN amount TYPE DECIMAL(12,2);
```

## 🧪 **Testing Schema Changes**

### **1. Create Test Data**
```typescript
// Use the test API route
const response = await fetch('/api/customers/test', {
  method: 'POST'
});
```

### **2. Validate Schema**
```typescript
// Test schema validation
const testCustomer = {
  name: 'Test Corp',
  domain: 'test.com'
};

const validation = SchemaValidator.validateCustomer(testCustomer);
console.log('Validation result:', validation);
```

### **3. Check Type Safety**
```bash
npm run type-check
```

## 📝 **Documentation Checklist**

When making schema changes, ensure you've updated:

- [ ] Migration file created
- [ ] `src/types/customer.ts` updated
- [ ] `src/lib/schema-validator.ts` updated
- [ ] `scripts/sync-schema.ts` updated (if needed)
- [ ] API routes updated (if needed)
- [ ] Tests updated (if needed)
- [ ] Documentation updated (this file)

## 🚀 **Quick Reference**

### **Commands**
```bash
# Apply migrations
npx supabase db push

# Sync types from database
npm run sync-schema

# Validate schema consistency
npm run validate-schema

# Type check
npm run type-check

# Lint
npm run lint
```

### **Key Files**
- `src/types/customer.ts` - Single source of truth for types
- `src/lib/schema-validator.ts` - Runtime validation
- `scripts/sync-schema.ts` - Auto-generation tool
- `supabase/migrations/` - Database migrations

### **Import Pattern**
```typescript
// ✅ Always import from centralized types
import { Customer, CustomerFormData, CustomerFilters } from '@/types';
```

---

**Remember**: This streamlined approach exists to make schema changes easier and more reliable. Always follow this process to maintain consistency across the codebase. 