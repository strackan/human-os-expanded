# API Security Audit Report

**Date**: 2025-11-13
**Auditor**: Claude Code Agent
**Scope**: All API routes in `src/app/api/**/route.ts`

---

## Executive Summary

Comprehensive security audit revealed **CRITICAL SECURITY VULNERABILITIES** where API routes query the database without proper user/tenant isolation. This creates data leakage risks where users can access data from other tenants/organizations.

**Severity**: 🔴 CRITICAL - Immediate action required

---

## Critical Findings

### Root Cause
When using service role client (bypasses RLS), most routes do NOT implement application-level filtering by:
- `user_id`
- `tenant_id`
- `organization_id`

This allows cross-tenant data access through ID enumeration.

---

## 🔴 CRITICAL VULNERABILITIES

### 1. Customer Data Routes (HIGHEST PRIORITY)

**File**: `src/app/api/customers/[id]/route.ts`
**Lines**: GET (17-26), PUT (59-71), DELETE (86-97)
**Issue**: Uses `CustomerService` methods without tenant filtering

```typescript
// ❌ VULNERABLE
const customer = await CustomerService.getCustomerById(id, supabase);
// Any user can access ANY customer by guessing ID
```

**Impact**: Complete data breach - users can access/modify/delete ALL customers across ALL tenants

**Fix Required**:
```typescript
// ✅ SECURE
const { data: { user } } = await supabase.auth.getUser();
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .eq('id', id)
  .eq('tenant_id', userTenantId) // Add tenant isolation
  .single();
```

**Related Files**:
- `/api/customers/[id]/contacts/route.ts` - Lines 22-26
- `/api/customers/[id]/properties/route.ts` - Lines 22-26
- `/api/customers/[id]/metrics/route.ts` - Lines 17-24

---

### 2. Renewals & Contracts

**File**: `src/app/api/renewals/route.ts`
**Lines**: 40-53
**Issue**: Returns ALL renewals without tenant filtering

```typescript
// ❌ VULNERABLE - Returns ALL renewals in database
const { data } = await supabase
  .from('renewals')
  .select('*, customers (name, industry)') // No tenant_id filter
```

**Impact**: Users can see ALL renewals across ALL tenants

**Fix Required**:
```typescript
// ✅ SECURE
const { data } = await supabase
  .from('renewals')
  .select('*, customers!inner (name, tenant_id)')
  .eq('customers.tenant_id', userTenantId)
```

**Similar Issue**:
- `/api/contracts/route.ts` - Lines 39-51 (same vulnerability)

---

### 3. Workflow Task Deletion

**File**: `src/app/api/workflows/tasks/[id]/route.ts`
**Lines**: DELETE (173-176), UPDATE (120-133)
**Issue**: No verification that task belongs to user's tenant

```typescript
// ❌ VULNERABLE DELETE
const { error } = await supabase
  .from('workflow_tasks')
  .delete()
  .eq('id', taskId); // No ownership verification!
```

**Impact**: Users can delete ANY task by task ID

**Fix Required**:
```typescript
// ✅ SECURE - Verify ownership first
const { data: task } = await supabase
  .from('workflow_tasks')
  .select('customer_id')
  .eq('id', taskId)
  .single();

// Verify customer belongs to user's tenant
const { data: customer } = await supabase
  .from('customers')
  .select('tenant_id')
  .eq('id', task.customer_id)
  .eq('tenant_id', userTenantId)
  .single();

if (!customer) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Now safe to delete
await supabase.from('workflow_tasks').delete().eq('id', taskId);
```

---

### 4. Workflow Artifacts

**File**: `src/app/api/workflows/artifacts/[id]/route.ts`
**Lines**: GET (45-56), PATCH (141-154), DELETE (212-215)
**Issue**: No verification that artifact belongs to user

```typescript
// ❌ VULNERABLE
const { data: artifact } = await supabase
  .from('workflow_task_artifacts')
  .select('*')
  .eq('id', artifactId) // No ownership check
```

**Impact**: Users can access/modify/delete ANY artifact

---

### 5. Workflow Executions

**File**: `src/app/api/workflows/executions/[id]/route.ts`
**Lines**: PUT (80-89)
**Issue**: No tenant verification on updates

```typescript
// ❌ VULNERABLE
const { data } = await supabase
  .from('workflow_executions')
  .update({ status, current_step })
  .eq('id', executionId) // No tenant check
```

---

### 6. Orchestrator Status Updates

**File**: `src/app/api/orchestrator/executions/[id]/status/route.ts`
**Lines**: 78-83
**Issue**: No tenant verification

---

### 7. Notifications

**File**: `src/app/api/notifications/[id]/read/route.ts`
**Issue**: `NotificationService.markAsRead()` doesn't verify notification belongs to user

**Fix in Service**:
```typescript
// src/lib/services/NotificationService.ts
static async markAsRead(notificationId: string, userId: string, supabase: SupabaseClient) {
  await supabase
    .from('in_product_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId) // ✅ Add user verification
}
```

---

## ✅ SECURE ROUTES (Good Examples)

1. **`/api/notifications/route.ts`** (Lines 38-43)
   - ✅ Filters by `user.id`

2. **`/api/user/preferences/route.ts`** (Lines 75-79)
   - ✅ Filters by `user_id`

3. **`/api/workflows/tasks/pending/route.ts`** (Lines 42-48)
   - ✅ Filters by user when getting tasks

4. **`/api/workflows/[workflowId]/route.ts`** (Lines 147-152)
   - ✅ Filters by tenant_id

---

## Service Layer Vulnerabilities

### CustomerService (CRITICAL)

**File**: `src/lib/services/CustomerService.ts`

All methods missing tenant isolation:
- `getCustomers()` - Lines 10-97 ❌
- `getCustomerById()` - Lines 102-150 ❌
- `getCustomerByKey()` - Lines 155-272 ❌
- `updateCustomer()` - Lines 378-414 ❌
- `deleteCustomer()` - Lines 419-437 ❌
- `getCustomerStats()` - Lines 442-495 ❌

**Required**: Add `tenantId` parameter to ALL methods and filter queries.

---

### NotificationService

**File**: `src/lib/services/NotificationService.ts`
**Method**: `markAsRead()` - Lines 194-213 ❌

Missing user_id verification when marking notifications as read.

---

## Summary Table

| Route | Severity | Issue | Priority |
|-------|----------|-------|----------|
| `/api/customers/[id]` (all methods) | 🔴 CRITICAL | No tenant filter | P0 - Immediate |
| `/api/renewals` | 🔴 CRITICAL | No tenant filter | P0 - Immediate |
| `/api/contracts` | 🔴 CRITICAL | No tenant filter | P0 - Immediate |
| `/api/workflows/tasks/[id]` DELETE | 🔴 CRITICAL | No ownership check | P0 - Immediate |
| `/api/workflows/artifacts/[id]` | 🔴 CRITICAL | No ownership check | P0 - Immediate |
| `/api/workflows/executions/[id]` PUT | 🔴 CRITICAL | No tenant check | P0 - Immediate |
| `/api/orchestrator/executions/[id]/status` | 🔴 CRITICAL | No tenant check | P1 - High |
| `/api/notifications/[id]/read` | 🟠 HIGH | No user check | P1 - High |
| `/api/team/members` | 🟡 MEDIUM | Relies on company_id | P2 - Medium |

---

## Recommendations

### P0 - IMMEDIATE (Fix within 24-48 hours)

1. **Add tenant_id column to customers table** (if missing)
   ```sql
   ALTER TABLE customers ADD COLUMN tenant_id UUID REFERENCES tenants(id);
   UPDATE customers SET tenant_id = '...' WHERE tenant_id IS NULL; -- Set default
   ALTER TABLE customers ALTER COLUMN tenant_id SET NOT NULL;
   ```

2. **Update CustomerService to require tenant_id**
   ```typescript
   static async getCustomerById(
     id: string,
     tenantId: string, // Add tenant parameter
     supabase: SupabaseClient
   ) {
     const { data } = await supabase
       .from('customers')
       .select('*')
       .eq('id', id)
       .eq('tenant_id', tenantId) // Add tenant filter
       .single();
   }
   ```

3. **Fix all DELETE/UPDATE operations**:
   - Add ownership verification before DELETE
   - Add tenant verification before UPDATE
   - Return 403 Forbidden if verification fails

4. **Fix NotificationService.markAsRead()**
   - Add userId parameter
   - Filter by user_id in update query

### P1 - HIGH PRIORITY (Fix within 1 week)

5. **Add tenant filtering to renewals/contracts routes**
6. **Audit and fix remaining workflow execution routes**
7. **Enable RLS policies** for all tenant-scoped tables

### P2 - MEDIUM PRIORITY (Fix within 2 weeks)

8. **Add integration tests for tenant isolation**
9. **Add logging for cross-tenant access attempts**
10. **Review all RPC functions for tenant isolation**

---

## Testing Strategy

Create automated tests to verify tenant isolation:

```typescript
describe('Tenant Isolation Tests', () => {
  test('User cannot access other tenant\'s customers', async () => {
    const tenant1User = await createUser({ tenant_id: 'tenant-1' });
    const tenant2User = await createUser({ tenant_id: 'tenant-2' });

    const customer = await createCustomer({ tenant_id: 'tenant-1' });

    // Tenant 2 user should NOT be able to access tenant 1's customer
    const response = await fetch(`/api/customers/${customer.id}`, {
      headers: { Authorization: `Bearer ${tenant2User.token}` }
    });

    expect(response.status).toBe(403); // Should be Forbidden
  });

  test('User cannot delete other tenant\'s tasks', async () => {
    // Similar test for task deletion
  });
});
```

---

## Database Schema Recommendations

1. **Ensure tenant_id exists on ALL multi-tenant tables**:
   - customers
   - workflow_tasks
   - workflow_executions
   - workflow_task_artifacts
   - renewals
   - contracts

2. **Enable Row Level Security (RLS)**:
   ```sql
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "tenant_isolation_policy"
     ON customers FOR ALL
     USING (tenant_id = (
       SELECT tenant_id FROM users WHERE id = auth.uid()
     ));
   ```

3. **Add indexes for tenant_id**:
   ```sql
   CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
   CREATE INDEX idx_workflow_tasks_tenant ON workflow_tasks(tenant_id);
   ```

---

## Monitoring & Detection

Add logging to detect potential cross-tenant access attempts:

```typescript
// In API middleware
if (customer.tenant_id !== user.tenant_id) {
  logger.warn('Cross-tenant access attempt', {
    userId: user.id,
    userTenant: user.tenant_id,
    attemptedTenant: customer.tenant_id,
    resource: 'customer',
    resourceId: customer.id,
  });

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Next Steps

1. **Prioritize P0 fixes** - These are production security vulnerabilities
2. **Review database schema** - Ensure tenant_id columns exist
3. **Update service layer** - Add tenant filtering to all methods
4. **Add security tests** - Prevent regression
5. **Enable RLS policies** - Defense in depth
6. **Monitor logs** - Detect unauthorized access attempts

---

**Report Generated**: 2025-11-13
**Status**: CRITICAL VULNERABILITIES IDENTIFIED
**Action Required**: Immediate remediation of P0 issues
