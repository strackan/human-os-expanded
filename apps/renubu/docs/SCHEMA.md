# Schema - Renubu Database Design

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Engineers, Database)

---

## Overview

This document catalogs all database tables, their relationships, Row Level Security (RLS) policies, and migration principles.

---

## Core Principles

### 1. Row Level Security (RLS)
- **ALL tables use RLS** - No exceptions
- Users can only access their own data
- Admin role can access all data
- RLS policies enforce multi-tenancy at database level

### 2. Soft Deletes
- Use `deleted_at TIMESTAMPTZ` instead of hard deletes
- Allows recovery and audit trails
- Use `WHERE deleted_at IS NULL` in queries

### 3. Timestamps
- All tables have `created_at` and `updated_at`
- Use trigger `update_updated_at_column()` for automatic updates

### 4. UUIDs
- All primary keys use UUID (not serial integers)
- Generated via `uuid_generate_v4()`
- Prevents enumeration attacks

---

## Table Categories

### Authentication & Users

#### `auth.users`
- **Purpose:** Supabase Auth users (managed by Supabase)
- **Key Columns:** id, email, encrypted_password
- **RLS:** Managed by Supabase

#### `profiles`
- **Purpose:** Extended user profile data
- **Key Columns:** id (references auth.users), email, full_name, role
- **RLS:** Users can read own profile, admins can read all
- **Relationships:** 1:1 with auth.users

### Customers & Relationships

#### `customers`
- **Purpose:** Customer organizations
- **Key Columns:** id, name, arr, renewal_date, risk_score
- **RLS:** Users see only their assigned customers
- **Indexes:** name, renewal_date, risk_score

#### `contacts`
- **Purpose:** Individual contacts at customer organizations
- **Key Columns:** id, customer_id, email, name, role
- **RLS:** Based on customer access
- **Relationships:** Many contacts per customer

### Workflows & Executions

#### `workflow_executions`
- **Purpose:** Runtime instances of workflows
- **Key Columns:** id, user_id, workflow_type, status, current_slide_index
- **RLS:** Users see only their own executions
- **Status Values:** not_started, in_progress, completed, snoozed
- **Migration:** `20251007140440_workflow_execution_tracking.sql`

#### `workflow_tasks`
- **Purpose:** Individual tasks within workflow executions
- **Key Columns:** id, workflow_execution_id, title, status, assigned_to
- **RLS:** Based on workflow_execution access
- **Status Values:** pending, in_progress, snoozed, completed, skipped
- **Migration:** `20251007150000_workflow_tasks_system.sql`

#### `workflow_actions`
- **Purpose:** Actions taken during workflow execution
- **Key Columns:** id, workflow_execution_id, action_type, action_data
- **RLS:** Based on workflow_execution access
- **Migration:** `20251022000001_phase3e_workflow_actions.sql`

### Documentation System (Phase 0.1)

#### `documentation`
- **Purpose:** Versioned internal documentation
- **Key Columns:** id, slug, title, content, version, release_date
- **RLS:** Authenticated users can read, admins can write
- **Search:** Full-text search via `search_vector` tsvector
- **Migration:** `20251107000000_documentation_system.sql`

#### `documentation_versions`
- **Purpose:** Historical snapshots at each release
- **Key Columns:** id, doc_id, content, version_number, version_label
- **RLS:** Authenticated users can read
- **Migration:** `20251107000000_documentation_system.sql`

#### `help_articles`
- **Purpose:** Customer-facing help content (Phase 1+)
- **Key Columns:** id, doc_id, category, difficulty, view_count
- **RLS:** Public read for published articles
- **Migration:** `20251107000000_documentation_system.sql`

#### `releases`
- **Purpose:** Release tracking and versioning
- **Key Columns:** id, version, release_date, is_current
- **RLS:** Public read
- **Constraint:** Only one current release (unique index)
- **Migration:** `20251107000000_documentation_system.sql`

### Feature Tracking (Phase 0.1)

#### `features`
- **Purpose:** Product feature registry
- **Key Columns:** id, slug, title, status, phase, priority
- **RLS:** Authenticated users can read, admins/PMs can write
- **Status Values:** active, planned, backlog, deferred, shipped
- **Migration:** `20251107000001_features_tracking.sql`

#### `feature_updates`
- **Purpose:** Change log for feature status changes
- **Key Columns:** id, feature_id, update_type, old_value, new_value
- **RLS:** Authenticated users can read
- **Migration:** `20251107000001_features_tracking.sql`

### MCP Registry (Phase 0.2)

#### `mcp_integrations`
- **Purpose:** Registry of available MCP integrations in marketplace
- **Key Columns:** id, slug, name, category, connection_type, status
- **RLS:** Authenticated users can read enabled integrations, admins can manage all
- **Status Values:** disabled, enabled, deprecated
- **Connection Types:** oauth2, api_key, webhook
- **Migration:** `20251112000000_mcp_registry_infrastructure.sql`

#### `user_integrations`
- **Purpose:** Tracks which users have which integrations installed
- **Key Columns:** id, user_id, integration_id, status, installed_at
- **RLS:** Users see only their own integrations, admins see all
- **Status Values:** pending, active, error, revoked
- **Relationships:** References auth.users and mcp_integrations
- **Migration:** `20251112000000_mcp_registry_infrastructure.sql`

#### `oauth_tokens`
- **Purpose:** Encrypted storage for OAuth access and refresh tokens
- **Key Columns:** id, user_integration_id, access_token_encrypted, refresh_token_encrypted
- **RLS:** Users can only access their own tokens
- **Security:** Tokens encrypted at rest using pgcrypto (AES-256)
- **Relationships:** References user_integrations and auth.users
- **Migration:** `20251112000000_mcp_registry_infrastructure.sql`
- **Helper Functions:** `encrypt_oauth_token()`, `decrypt_oauth_token()`

---

## RLS Policy Patterns

### User Isolation Pattern
```sql
CREATE POLICY "Users see own data"
  ON table_name FOR SELECT
  USING (user_id = auth.uid());
```

### Admin Override Pattern
```sql
CREATE POLICY "Admins see all data"
  ON table_name FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Public Read Pattern
```sql
CREATE POLICY "Public can read published"
  ON table_name FOR SELECT
  USING (published = true);
```

---

## Migration Principles

### File Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Example: `20251107000000_documentation_system.sql`

### Migration Best Practices
1. **Always reversible** - Include rollback logic in comments
2. **Idempotent** - Can run multiple times safely
3. **Test locally first** - Use `npx supabase db reset`
4. **RLS from day one** - Enable RLS on new tables immediately
5. **Index strategically** - Add indexes for common queries

### Common Patterns

#### Creating a New Table
```sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  -- columns...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users see own data"
  ON my_table FOR SELECT
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_my_table_user_id ON my_table(user_id);

-- Updated_at trigger
CREATE TRIGGER my_table_updated_at
  BEFORE UPDATE ON my_table
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Database Functions

### `update_updated_at_column()`
- **Purpose:** Auto-update `updated_at` timestamp
- **Usage:** Trigger on BEFORE UPDATE
- **Location:** Core schema migration

### `create_release_snapshot(version, date, doc_slugs)`
- **Purpose:** Create versioned snapshots of documentation
- **Returns:** UUID of release record
- **Location:** `20251107000000_documentation_system.sql`

---

## Indexes Strategy

### When to Add Indexes
- Foreign keys (always)
- WHERE clause columns (high-frequency queries)
- ORDER BY columns
- Array columns (use GIN index)
- Full-text search (tsvector with GIN)

### When NOT to Index
- Low-cardinality columns (status with 2-3 values)
- Small tables (<1000 rows)
- Write-heavy tables with rare reads

---

## Performance Optimization

### Query Patterns
- Use `select('*')` sparingly - specify columns
- Use `.single()` when expecting one row
- Batch operations when possible
- Avoid N+1 queries (use joins or `in` clauses)

### RLS Performance
- RLS adds overhead but enforces security
- Keep RLS policies simple
- Index columns used in RLS policies

---

## Planned Schema Changes

### Phase 1: Workflow Snoozing
- Add `snoozed_until` to workflow_executions
- Add `wake_conditions` JSONB column
- Add `workflow_conditions` table

### Phase 2: Parking Lot
- Add `parking_lot_items` table

### Phase 3: Human OS Check-Ins
- Add `workflow_check_ins` table
- Add `user_patterns` table

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API.md](./API.md) - API reference
- [DEV-GUIDE.md](./DEV-GUIDE.md) - Development guide
- Migrations: `supabase/migrations/`

---

**Note:** This is a living document. Update when schema changes are made.
