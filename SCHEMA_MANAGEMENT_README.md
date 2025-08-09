# Intelligent Schema Management System for Supabase

This document describes the intelligent schema management system that automatically detects schemas, selects appropriate seed files, and manages database differences.

## Overview

The system provides three main capabilities:

1. **Schema Detection** - Automatically detects which schema is active
2. **Smart Seed Selection** - Chooses the appropriate seed file based on the active schema
3. **Diff Management** - Detects and manages schema differences and conflicts

## Configuration

### Enhanced config.toml

The `supabase/config.toml` file has been enhanced with intelligent schema management:

```toml
# Schema-specific configurations
[db.schemas]
# MVP Schema Configuration
[db.schemas.mvp]
enabled = true
seed_file = "./seed-mvp.sql"
migrations = ["20250101000002_create_mvp_schema.sql"]

# Production Schema Configuration  
[db.schemas.production]
enabled = false
seed_file = "./seed.sql"
migrations = ["20250101000001_migrate_to_prod_schema.sql"]

# Development Schema Configuration
[db.schemas.development]
enabled = true
seed_file = "./seed-mvp.sql"
migrations = ["20250101000002_create_mvp_schema.sql"]

# Diff detection and management
[db.diff]
enabled = true
auto_generate = true
output_format = "sql"
include_schema = true
include_data = false
rules = [
  "ignore_timestamps",
  "ignore_auto_increment",
  "preserve_comments"
]
```

## Available Scripts

### 1. Schema Detection (`npm run detect-schema`)

Analyzes migration files to determine which schema is active and provides recommendations.

**Features:**
- Detects MVP, Production, and Development schemas
- Analyzes migration files for schema indicators
- Validates seed file existence
- Provides configuration recommendations
- Checks for schema differences

**Usage:**
```bash
npm run detect-schema
```

**Output Example:**
```
🔍 Schema Analysis Results:
============================
✅ MVP Schema: ENABLED
   - Migrations: 3
   - Seed File: ./seed-mvp.sql
   - Status: active

📊 Recommended Actions:
=======================
1. Use MVP schema with seed-mvp.sql for development
```

### 2. Smart Seed Selector (`npm run smart-seed`)

Automatically selects and applies the appropriate seed file based on the detected schema.

**Features:**
- Automatically detects current schema
- Selects appropriate seed file (seed-mvp.sql vs seed.sql)
- Updates Supabase configuration
- Validates seed file integrity
- Provides application guidance

**Usage:**
```bash
npm run smart-seed
```

**Output Example:**
```
🧠 Smart Seed File Selector
============================

🔍 Detected Schema: mvp
📁 Selected Seed File: seed-mvp.sql
✅ Seed file seed-mvp.sql validated (2.45 KB)
✅ Updated config.toml to use seed-mvp.sql
🌱 Applying seed file: seed-mvp.sql
✅ Supabase is running, seed file will be applied on next reset
💡 Run "npx supabase db reset" to apply the seed file
```

### 3. Schema Diff Manager (`npm run schema-diff`)

Analyzes schema differences, detects conflicts, and provides resolution recommendations.

**Features:**
- Detects migration conflicts
- Identifies schema reference inconsistencies
- Generates diff reports
- Provides conflict resolution recommendations
- Analyzes RLS policy conflicts

**Usage:**
```bash
npm run schema-diff
```

**Output Example:**
```
🔍 Schema Diff Manager
======================

🔍 Analyzing current schema state...
📊 Generating diff report...
✅ No schema differences detected

💡 Recommendations
==================
🔧 General Recommendations:
1. Always use schema prefixes (e.g., mvp.customers) in migrations
2. Use IF NOT EXISTS for table and policy creation to avoid conflicts
3. Test migrations in isolation before applying to production
4. Use the schema detection tools to ensure correct seed file selection
5. Run "npx supabase db diff" regularly to track schema changes
```

### 4. Schema Diff Report (`npm run schema-diff-report`)

Generates a comprehensive JSON report of schema analysis.

**Usage:**
```bash
npm run schema-diff-report
```

**Output:**
- Saves detailed analysis to `supabase/schema-analysis-report.json`
- Includes migration conflicts, warnings, and recommendations
- Provides timestamped analysis for tracking changes

## Best Practices

### 1. Schema References

Always use explicit schema prefixes in migrations:

```sql
-- ✅ Good: Explicit schema reference
SELECT * FROM mvp.customers WHERE company_id = $1;

-- ❌ Bad: Implicit schema reference
SELECT * FROM customers WHERE company_id = $1;
```

### 2. Table Creation

Use `IF NOT EXISTS` to prevent conflicts:

```sql
-- ✅ Good: Safe table creation
CREATE TABLE IF NOT EXISTS mvp.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- ❌ Bad: May cause conflicts
CREATE TABLE mvp.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);
```

### 3. RLS Policies

Ensure RLS policies reference the correct schema:

```sql
-- ✅ Good: Correct schema references
CREATE POLICY "Company isolation - customers" ON mvp.customers FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
);

-- ❌ Bad: Wrong schema references
CREATE POLICY "Company isolation - customers" ON customers FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles 
    WHERE id = auth.uid()
  )
);
```

### 4. Seed File Management

- Use `seed-mvp.sql` for development and MVP schemas
- Use `seed.sql` for production schemas
- Keep seed files in sync with schema changes
- Test seed files after schema modifications

## Workflow

### Development Workflow

1. **Start Development:**
   ```bash
   npm run detect-schema    # Check current schema
   npm run smart-seed       # Select appropriate seed file
   npx supabase start       # Start Supabase
   npx supabase db reset    # Apply migrations and seed
   ```

2. **Make Schema Changes:**
   ```bash
   # Edit migration files
   npm run schema-diff      # Check for conflicts
   npx supabase db reset    # Apply changes
   ```

3. **Validate Changes:**
   ```bash
   npm run schema-diff-report  # Generate detailed report
   npm run detect-schema       # Verify schema state
   ```

### Production Deployment

1. **Pre-deployment Check:**
   ```bash
   npm run schema-diff      # Check for conflicts
   npm run detect-schema    # Verify schema state
   ```

2. **Deploy:**
   ```bash
   npx supabase db push     # Apply to production
   ```

3. **Post-deployment Validation:**
   ```bash
   npm run schema-diff      # Verify deployment
   ```

## Troubleshooting

### Common Issues

1. **Schema Reference Errors:**
   - Ensure all table references use proper schema prefixes
   - Check RLS policies for correct schema references
   - Use the schema detection tools to identify issues

2. **Seed File Mismatches:**
   - Run `npm run smart-seed` to auto-select correct seed file
   - Verify seed file content matches current schema
   - Check config.toml seed file configuration

3. **Migration Conflicts:**
   - Use `npm run schema-diff` to identify conflicts
   - Add `IF NOT EXISTS` clauses to prevent conflicts
   - Consolidate duplicate table or policy definitions

4. **RLS Policy Issues:**
   - Ensure policies reference correct schema tables
   - Check for policy name conflicts
   - Verify policy logic matches table structure

### Debug Commands

```bash
# Check Supabase status
npx supabase status

# View database logs
npx supabase logs

# Check specific service
npx supabase logs --service db

# Generate diff manually
npx supabase db diff

# Reset database (use with caution)
npx supabase db reset
```

## File Structure

```
supabase/
├── config.toml                    # Enhanced configuration
├── migrations/                    # Migration files
├── seed-mvp.sql                  # MVP schema seed data
├── seed.sql                      # Production schema seed data
└── schema-analysis-report.json   # Generated analysis reports

scripts/
├── detect-schema.js              # Schema detection tool
├── smart-seed-selector.js        # Smart seed file selector
└── schema-diff-manager.js        # Schema diff manager
```

## Integration with Existing Tools

The schema management system integrates with existing Supabase CLI commands:

- **`npx supabase start`** - Starts Supabase with enhanced configuration
- **`npx supabase db reset`** - Applies migrations and selected seed file
- **`npx supabase db diff`** - Generates schema differences
- **`npx supabase db push`** - Deploys schema changes

## Future Enhancements

- Database connection for real-time schema analysis
- Automatic migration conflict resolution
- Schema versioning and rollback capabilities
- Integration with CI/CD pipelines
- Real-time schema change notifications

## Support

For issues or questions:

1. Run the diagnostic scripts to identify problems
2. Check the generated reports for detailed analysis
3. Review migration files for common issues
4. Verify configuration file syntax
5. Check Supabase logs for detailed error information

---

*This system provides intelligent, automated schema management to prevent common database issues and ensure consistent development practices.* 