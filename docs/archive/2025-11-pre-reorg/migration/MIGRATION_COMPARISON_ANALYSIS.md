# Migration Comparison Analysis

## Overview
This document compares the optimized SQL file (`20250101000099_optimized_public_schema_consolidation.sql`) with recent migration files to identify missing functionality and ensure the optimized version is up-to-date.

## Key Findings

### 1. Missing Tables in Optimized Version

#### A. Customer Properties Table
**Missing from optimized:** `customer_properties` table
**Found in:** Recent migrations and seed data
**Fields needed:**
- `customer_id` (UUID, references customers.id)
- `usage_score` (INTEGER)
- `health_score` (INTEGER) 
- `nps_score` (INTEGER)
- `current_arr` (DECIMAL)
- `revenue_impact_tier` (INTEGER, 1-5)
- `churn_risk_score` (INTEGER, 1-5)
- `created_at` (TIMESTAMPTZ)
- `last_updated` (TIMESTAMPTZ)

#### B. Action Scoring System Tables
**Missing from optimized:** Action scoring system tables
**Found in:** `20250621171617_action_scoring_system.sql`
**Tables needed:**
- `task_templates` (workflow blueprints)
- `renewal_tasks` (task instances)
- `renewal_workflow_outcomes` (phase-level tracking)

#### C. Workflow Conversation Tables
**Missing from optimized:** Workflow conversation system
**Found in:** `20250623174451_create_workflow_conversation_tables.sql`
**Tables needed:**
- `companies` (multi-tenant support)
- `workflow_conversations`
- `conversation_messages`

#### D. Local Authentication Support
**Missing from optimized:** Local authentication fields and functions
**Found in:** `20250625000003_add_local_authentication.sql`
**Fields needed in profiles:**
- `auth_type` (TEXT, 'oauth' or 'local')
- `password_hash` (TEXT)
- `is_local_user` (BOOLEAN)
- `local_auth_enabled` (BOOLEAN)

### 2. Schema Differences

#### A. Customer Name Unique Constraint
**Missing from optimized:** Unique constraint on customer names
**Found in:** `20250625000004_add_customer_name_unique_constraint.sql`
**Needed:** `ALTER TABLE customers ADD CONSTRAINT customers_name_unique UNIQUE (name);`

#### B. Contact Email Requirement
**Optimized version:** `email TEXT` (nullable)
**Recent migrations:** `email TEXT NOT NULL`
**Issue:** Recent migrations make email required, optimized version allows null

#### C. Foreign Key References
**Optimized version:** References `public.customers(id)`
**Recent migrations:** Some still reference `mvp.customers(id)`
**Status:** Recent migrations are updating these to public schema

### 3. Missing Functions

#### A. Action Scoring Functions
**Missing from optimized:**
- `generate_renewal_tasks(renewal_uuid UUID)`
- `update_action_scores()`

#### B. Local Authentication Functions
**Missing from optimized:**
- `create_local_user(user_email, user_password, user_full_name, user_company_name)`
- `authenticate_local_user(user_email, user_password)`
- `update_local_user_password(user_email, old_password, new_password)`

#### C. Task Management Functions
**Missing from optimized:**
- `get_next_priority_task()` (from `20250621171618_get_next_priority_task.sql`)
- Date override functions (from `20250623174452_add_date_override_to_task_function.sql`)

### 4. Missing Indexes

#### A. Action Scoring Indexes
**Missing from optimized:**
- `idx_renewal_tasks_action_score`
- `idx_renewal_tasks_status_pending`
- `idx_renewal_tasks_overdue`
- `idx_task_templates_phase`
- `idx_renewal_tasks_deadline`

#### B. Local Auth Indexes
**Missing from optimized:**
- `idx_profiles_email_auth_type`
- `idx_profiles_local_auth`

### 5. Missing RLS Policies

#### A. Action Scoring Policies
**Missing from optimized:** RLS policies for new action scoring tables

#### B. Local Auth Policies
**Missing from optimized:** Separate policies for local vs OAuth users

#### C. Multi-tenant Policies
**Missing from optimized:** Company isolation policies for multi-tenant support

## Recommendations

### 1. Update Optimized SQL File
The optimized SQL file needs to be updated to include:

1. **Add missing tables:**
   - `customer_properties`
   - `task_templates`
   - `renewal_tasks`
   - `renewal_workflow_outcomes`
   - `companies`
   - `workflow_conversations`
   - `conversation_messages`

2. **Add missing fields to existing tables:**
   - Local auth fields to `profiles`
   - Action scoring fields to `renewals`
   - Company ID fields for multi-tenant support

3. **Add missing constraints:**
   - Unique constraint on customer names
   - Required constraint on contact emails

4. **Add missing functions:**
   - All action scoring functions
   - Local authentication functions
   - Task management functions

5. **Add missing indexes:**
   - Action scoring indexes
   - Local auth indexes
   - Multi-tenant indexes

6. **Add missing RLS policies:**
   - Action scoring table policies
   - Local auth policies
   - Multi-tenant isolation policies

### 2. Migration Strategy
1. **Create updated optimized SQL file** with all missing components
2. **Test the updated file** in a clean environment
3. **Compare with current database state** to ensure no data loss
4. **Create a migration plan** to transition from current state to optimized state
5. **Test thoroughly** before applying to production

### 3. Data Migration Considerations
- Ensure all existing data is preserved
- Handle foreign key relationships properly
- Test seed data compatibility
- Verify RLS policies work correctly
- Test all functions and triggers

## Next Steps
1. Update the optimized SQL file with missing components
2. Create a test script to validate the updated file
3. Test the migration process
4. Document any additional issues found during testing
