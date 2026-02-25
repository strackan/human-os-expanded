# Salesforce Organizational Hierarchy Import Strategy

## Overview

This document outlines the strategy for importing organizational hierarchy from Salesforce into our system using the simple **ManagerId** approach.

## Salesforce Data Model

### Key Fields from Salesforce User Object

```javascript
// Salesforce User fields we import
{
  Id: "0051234567890ABCDE",           // 18-character Salesforce User ID
  Email: "carol.csm@acme.com",
  Name: "Carol CSM",
  Title: "Customer Success Manager",
  Department: "Customer Success",
  ManagerId: "0051234567890FGHIJ",    // Self-referential lookup to User
  IsActive: true
}
```

### Important: Manager Hierarchy vs. Role Hierarchy

Salesforce has **TWO** separate hierarchy systems:

1. **Manager Hierarchy** (ManagerId field) - **WE USE THIS**
   - Actual org chart / reporting structure
   - Self-referential User lookup
   - Used for approvals, territory inheritance, forecasting

2. **Role Hierarchy** (UserRoleId field) - **WE DO NOT USE THIS**
   - Controls data visibility and sharing
   - Used for permissions and record access
   - More complex, not needed for simple reporting structure

**We only import the Manager Hierarchy (ManagerId).**

## Import Process

### Step 1: Fetch Salesforce Users via API

Use Salesforce SOQL query to fetch all active users:

```sql
SELECT
  Id,
  Email,
  Name,
  Title,
  Department,
  ManagerId,
  Manager.Email,
  IsActive
FROM User
WHERE IsActive = true
ORDER BY ManagerId NULLS FIRST
```

**Ordering Strategy**: Fetch users with `ManagerId NULLS FIRST` to process top-level executives first, then walk down the tree.

### Step 2: Two-Pass Import Algorithm

Because manager relationships are circular (manager must exist before assigning subordinates), we use a **two-pass** import:

#### Pass 1: Create all users without manager assignments

```javascript
// Pseudo-code for Pass 1
for each salesforceUser in salesforceUsers {
  INSERT INTO users (
    email,
    name,
    title,
    department,
    role,
    oauth_provider,
    salesforce_user_id,
    salesforce_manager_id,  // Store Salesforce ID, don't resolve yet
    manager_id,              // NULL for now
    active
  ) VALUES (
    salesforceUser.Email,
    salesforceUser.Name,
    salesforceUser.Title,
    salesforceUser.Department,
    inferRole(salesforceUser.Title), // See role inference below
    'salesforce',
    salesforceUser.Id,
    salesforceUser.ManagerId,         // Store for Pass 2
    NULL,                             // Will resolve in Pass 2
    salesforceUser.IsActive
  );
}
```

#### Pass 2: Resolve manager relationships

```javascript
// Pseudo-code for Pass 2
for each user in users WHERE salesforce_manager_id IS NOT NULL {
  // Find the local user who matches the Salesforce manager
  const manager = SELECT id FROM users
                  WHERE salesforce_user_id = user.salesforce_manager_id;

  if (manager) {
    UPDATE users
    SET manager_id = manager.id
    WHERE id = user.id;
  } else {
    // Log warning: manager not found (inactive manager, etc.)
    console.warn(`Manager not found for ${user.email}: Salesforce Manager ID ${user.salesforce_manager_id}`);
  }
}
```

### Step 3: Role Inference

Since Salesforce doesn't have a direct "role" field matching our system, we infer from **Title**:

```javascript
function inferRole(title) {
  const titleLower = title.toLowerCase();

  // CEO
  if (titleLower.includes('ceo') || titleLower.includes('chief executive')) {
    return 'ceo';
  }

  // VP Customer Success
  if (titleLower.includes('vp') && titleLower.includes('customer success')) {
    return 'vp_cs';
  }

  // Director
  if (titleLower.includes('director')) {
    return 'director';
  }

  // Manager
  if (titleLower.includes('manager') && titleLower.includes('customer success')) {
    return 'manager';
  }

  // Default: CSM
  return 'csm';
}
```

**Override Capability**: Allow manual role assignment in UI after import for edge cases.

### Step 4: Identify Key Company Roles

After import, identify and set key organizational roles in `company_settings`:

```javascript
// Find VP Customer Success
const vpCS = SELECT id FROM users
             WHERE role = 'vp_cs'
             LIMIT 1;

// Find CEO
const ceo = SELECT id FROM users
            WHERE role = 'ceo'
            LIMIT 1;

UPDATE company_settings
SET vp_customer_success_id = vpCS.id,
    ceo_id = ceo.id;
```

## Import API Endpoint

### `POST /api/integrations/salesforce/import-users`

**Request:**

```json
{
  "access_token": "00D1234567890ABCDE!AQwAQEDFG...",
  "instance_url": "https://na1.salesforce.com",
  "import_inactive_users": false,
  "overwrite_existing": true
}
```

**Response:**

```json
{
  "success": true,
  "imported_count": 47,
  "updated_count": 3,
  "skipped_count": 2,
  "errors": [
    {
      "salesforce_user_id": "0051234567890XXXXX",
      "email": "old-employee@acme.com",
      "error": "Manager not found in import batch (inactive manager)"
    }
  ],
  "hierarchy_resolved": true,
  "top_level_users": [
    {
      "name": "Jane CEO",
      "email": "ceo@acme.com",
      "direct_reports_count": 5
    }
  ]
}
```

## Ongoing Sync Strategy

### Option 1: Periodic Full Sync (Recommended for MVP)

- Run full import daily (overnight)
- Overwrite existing users
- Simple, reliable

### Option 2: Incremental Sync via Webhooks (Future)

- Subscribe to Salesforce Platform Events for User changes
- Update only changed users
- More complex, real-time

### Option 3: Manual Trigger

- Admin can trigger sync via UI button
- "Last synced: 2 hours ago" indicator
- Useful for testing

## Edge Cases

### 1. Circular Manager Relationships

**Problem**: Salesforce allows (accidentally) creating circular manager relationships.

**Solution**: Our database trigger `check_manager_cycle()` will catch this and raise error. Log error, skip that user's manager assignment.

### 2. Inactive Managers

**Problem**: User's manager is inactive in Salesforce (departed employee).

**Solution**: Import will skip manager assignment. CSM will appear to have no manager. Alert admin to manually reassign.

### 3. Missing Manager

**Problem**: ManagerId points to a user not in the import batch (e.g., contractor, external).

**Solution**: Same as inactive manager - skip assignment, alert admin.

### 4. Multiple VPs or CEOs

**Problem**: Role inference identifies multiple VPs of Customer Success.

**Solution**: `company_settings` allows only one. Admin must manually select the correct one via UI.

## HubSpot Import (Future Consideration)

HubSpot uses a similar approach:

```javascript
// HubSpot User properties
{
  id: "12345",
  email: "carol.csm@acme.com",
  firstName: "Carol",
  lastName: "CSM",
  jobTitle: "Customer Success Manager",
  managerId: "67890",  // Same concept as Salesforce ManagerId
  teamId: "999"        // HubSpot has additional "team" concept
}
```

**Import Strategy**: Same two-pass algorithm. HubSpot's API is RESTful, easier to integrate than Salesforce SOQL.

## Template Variable Resolution

Once users are imported, workflows can use template variables like:

```handlebars
{{csm.manager}}          → Resolves to csm_manager_email from customers_with_team view
{{csm.manager.name}}     → csm_manager_name
{{company.vpCustomerSuccess}} → Resolves via company_settings.vp_customer_success_id
{{company.ceo}}          → Resolves via company_settings.ceo_id
```

See `TEMPLATE_VARIABLES.md` for full reference.

## Database Schema Reference

See `database/migrations/003_organizational_hierarchy.sql` for:
- `users` table with `manager_id` (self-referential)
- `company_settings` table for key roles
- `users_with_manager` view for easy template resolution
- `customers_with_team` view for full CSM + manager + account team details

## Security Considerations

1. **OAuth Token Storage**: Never store Salesforce access tokens in database. Use session-only for import, then discard.

2. **Email Privacy**: Emails are PII. Ensure GDPR compliance if importing EU employees.

3. **Manager Visibility**: Assume all users can see their manager. No permissions needed for basic reporting structure.

4. **Role Assignment**: Role field is for workflow logic (who gets notified), NOT for application permissions. Keep separate from auth/authz system.

## Testing the Import

### Sample Salesforce Data

Create test Salesforce org with:
- 1 CEO (no manager)
- 1 VP CS (reports to CEO)
- 2 Managers (report to VP CS)
- 5 CSMs (split between 2 managers)

### Validation Queries

After import, run these queries to validate:

```sql
-- 1. All users have a manager except top-level executives
SELECT email, name, role
FROM users
WHERE manager_id IS NULL
AND role NOT IN ('ceo', 'vp_cs');
-- Should return 0 rows (or only VPs)

-- 2. No circular references (should complete without error)
SELECT id, email, manager_id FROM users;

-- 3. Hierarchy depth (should be reasonable, e.g., < 10 levels)
WITH RECURSIVE hierarchy AS (
  SELECT id, email, manager_id, 0 AS depth
  FROM users
  WHERE manager_id IS NULL

  UNION ALL

  SELECT u.id, u.email, u.manager_id, h.depth + 1
  FROM users u
  INNER JOIN hierarchy h ON u.manager_id = h.id
)
SELECT MAX(depth) AS max_hierarchy_depth FROM hierarchy;
-- Should be 3-5 for typical org

-- 4. Company settings populated
SELECT * FROM company_settings;
-- Should have vp_customer_success_id and ceo_id set
```

## Next Steps

1. Build import API endpoint (`/api/integrations/salesforce/import-users`)
2. Create UI for manual import trigger
3. Create UI for role override (fix incorrect role inferences)
4. Build template variable resolution engine
5. Add "last synced" indicator to settings page
