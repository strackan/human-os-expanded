# 🚀 Quick Schema Change Guide

## **For Future Threads: Use This Process!**

When modifying the database schema, follow this streamlined approach:

### **1. Create Migration**
```sql
-- File: supabase/migrations/[timestamp]_description.sql
ALTER TABLE renubu_mvp.customers ADD COLUMN new_field TEXT;
-- or
ALTER TABLE renubu_mvp.customers DROP COLUMN IF EXISTS old_field;
```

### **2. Update Centralized Types**
```typescript
// File: src/types/customer.ts
export interface Customer {
  // ... existing fields
  new_field?: string; // Add/remove as needed
}
```

### **3. Run Validation**
```bash
npx supabase db push
npm run validate-schema
npm run type-check
```

### **4. Import Types Correctly**
```typescript
// ✅ Always import from centralized location
import { Customer, CustomerFormData } from '@/types';

// ❌ Never define types locally
interface Customer { ... }
```

## **Key Files to Update:**
- `src/types/customer.ts` - **Single source of truth**
- `src/lib/schema-validator.ts` - Update field lists
- `scripts/sync-schema.ts` - Update validation checks

## **Available Commands:**
```bash
npm run sync-schema      # Auto-generate from DB
npm run validate-schema  # Check all files
npm run type-check       # TypeScript validation
```

## **Full Documentation:**
See [DATABASE_SCHEMA_GUIDE.md](DATABASE_SCHEMA_GUIDE.md) for complete details.

---

**Remember**: This approach prevents the "update 10+ files manually" problem we had before! 