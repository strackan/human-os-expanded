# Weekly Planner Testing Guide

## Quick Database Test

### 1. Start Supabase (if not running)
```bash
npx supabase start
```

### 2. Apply Migration
```bash
npx supabase migration up
```

### 3. Seed Test Data
```bash
npx supabase db execute -f supabase/seed_weekly_planner_test_data.sql
```

You should see output like:
```
NOTICE:  Using test user: abc-123-def-456
NOTICE:  =================================================================
NOTICE:  WEEKLY PLANNER SEED DATA SUMMARY
NOTICE:  =================================================================
NOTICE:  User Work Context entries: 3
NOTICE:  Calendar Preferences: 5
NOTICE:  Weekly Plans: 2
NOTICE:  Weekly Commitments: 8
NOTICE:  Scheduled Tasks: 7
NOTICE:  Recurring Workflows: 1
NOTICE:  =================================================================
```

### 4. Verify Tables
```bash
# Check user_work_context
npx supabase db execute --sql "SELECT context_type, jsonb_pretty(context_data) FROM user_work_context LIMIT 3;"

# Check weekly_plans
npx supabase db execute --sql "SELECT week_start_date, jsonb_pretty(plan_data) FROM weekly_plans;"

# Check calendar_preferences
npx supabase db execute --sql "SELECT preference_type, jsonb_pretty(preference_data) FROM user_calendar_preferences LIMIT 3;"

# Check scheduled_tasks
npx supabase db execute --sql "SELECT task_name, task_type, scheduled_start, was_completed FROM scheduled_tasks ORDER BY scheduled_start;"
```

---

## Test WorkloadAnalysisService

### Option 1: API Test (Once API endpoint exists)

Create test file: `src/app/api/test/workload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WorkloadAnalysisService } from '@/lib/services/WorkloadAnalysisService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get workload for next week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + (7 - weekStart.getDay())); // Next Monday

    const workload = await WorkloadAnalysisService.getUpcomingWorkload(
      user.id,
      weekStart,
      { supabaseClient: supabase }
    );

    return NextResponse.json({ workload }, { status: 200 });
  } catch (error: any) {
    console.error('Workload test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then visit: `http://localhost:3000/api/test/workload`

### Option 2: Direct SQL Test

```sql
-- Test getting snoozed workflows
SELECT
  we.id,
  we.workflow_name,
  we.status,
  we.snoozed_until,
  c.domain as customer_name
FROM workflow_executions we
JOIN customers c ON we.customer_id = c.id
WHERE we.status = 'snoozed'
  AND we.snoozed_until <= NOW() + INTERVAL '7 days'
ORDER BY we.snoozed_until;

-- Test getting upcoming renewals
SELECT
  id,
  domain,
  renewal_date,
  current_arr,
  (renewal_date - CURRENT_DATE) as days_until_renewal
FROM customers
WHERE renewal_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days')
ORDER BY renewal_date;

-- Test getting high priority customers
SELECT
  c.id,
  c.domain,
  c.current_arr,
  cp.risk_score,
  cp.opportunity_score
FROM customers c
LEFT JOIN customer_properties cp ON c.id = cp.customer_id
WHERE cp.risk_score >= 4 OR cp.opportunity_score >= 4
ORDER BY current_arr DESC
LIMIT 10;
```

---

## Test Scenarios

### Scenario 1: New User Weekly Planning

**Setup:**
1. Create new user (or use existing)
2. Seed with work context and preferences
3. Add some snoozed workflows and upcoming renewals

**Test:**
```typescript
const workload = await WorkloadAnalysisService.getUpcomingWorkload(userId, nextMonday);

// Should return:
// - snoozed: Array of workflows
// - renewals: Array of customers
// - priorities: Array of high-risk/opportunity customers
// - incomplete: Array of pending tasks
// - categorized: { urgent, important, routine, suggested }
// - summary: { total_items, estimated_hours, customer_count }
```

**Expected Result:**
- At least 3 snoozed workflows surfaced
- 5+ upcoming renewals
- 2+ high-priority customers
- Properly categorized by urgency
- Realistic time estimates

### Scenario 2: Pattern Recognition

**Setup:**
1. Seed 4 weeks of historical weekly_plans
2. Vary completion rates (50%, 75%, 80%, 60%)
3. Track commitment vs actual hours

**Test:**
```typescript
const patterns = await PatternAnalysisService.analyzeCommitmentPatterns(userId);

// Should detect:
// - Average completion rate
// - Over/under committing trends
// - Best days for certain tasks
// - Energy alignment patterns
```

### Scenario 3: Calendar Integration

**Setup:**
1. Mock calendar events for next week
2. Mix of meetings, focus blocks, personal time

**Test:**
```typescript
const availability = await CalendarService.getAvailability(userId, weekStart, weekEnd);
const nextSlot = await CalendarService.findNextOpening({
  userId,
  durationMinutes: 90,
  taskType: 'deep'
});

// Should return:
// - Available time blocks
// - Respects work hours preferences
// - Avoids buffer times
// - Prioritizes focus blocks for deep work
```

---

## Database Health Checks

### Check RLS Policies
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'user_%' OR tablename LIKE 'weekly_%' OR tablename LIKE 'scheduled_%';

-- Test RLS (should only see own data)
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';

SELECT * FROM user_work_context;
SELECT * FROM weekly_plans;
SELECT * FROM scheduled_tasks;
```

### Check Indexes
```sql
-- Verify indexes exist
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_work_context',
    'weekly_plans',
    'weekly_commitments',
    'recurring_workflows',
    'user_calendar_integrations',
    'user_calendar_preferences',
    'scheduled_tasks'
  )
ORDER BY tablename, indexname;
```

### Check Foreign Keys
```sql
-- Verify foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'user_work_context',
    'weekly_plans',
    'weekly_commitments',
    'recurring_workflows',
    'user_calendar_integrations',
    'user_calendar_preferences',
    'scheduled_tasks'
  )
ORDER BY tc.table_name, kcu.column_name;
```

---

## Performance Tests

### Query Performance
```sql
-- Test workload query performance
EXPLAIN ANALYZE
SELECT
  we.id,
  we.workflow_name,
  we.snoozed_until,
  c.domain
FROM workflow_executions we
JOIN customers c ON we.customer_id = c.id
WHERE we.user_id = 'test-user-id'
  AND we.status = 'snoozed'
  AND we.snoozed_until <= NOW() + INTERVAL '7 days';

-- Should use indexes and complete in < 10ms
```

---

## Troubleshooting

### Migration Failed
```bash
# Check current migration status
npx supabase migration list

# If stuck, reset and reapply
npx supabase db reset
```

### Seed Failed
```bash
# Check if user exists
npx supabase db execute --sql "SELECT id, email FROM profiles LIMIT 5;"

# If no users, create one via auth or UI
# Then re-run seed
```

### RLS Blocking Queries
```bash
# Check your auth.uid()
npx supabase db execute --sql "SELECT auth.uid();"

# If null, you're not authenticated
# Test queries should use service role or authenticated user
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Verify all 7 tables created
2. ✅ Seed data loads successfully
3. ✅ WorkloadAnalysisService queries work
4. ✅ RLS policies enforce security
5. ✅ Indexes improve query performance

Then proceed to:
- Build CalendarService
- Implement findNextOpening()
- Create weekly planning workflow
- Build context gathering slide

---

**Last Updated:** 2025-11-02
