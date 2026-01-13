# Validation Templates

**Quick Reference**: Copy-paste these templates when creating new API routes that accept user input.

---

## Template 1: Simple POST API with Body Validation

**Use Case**: Creating a new resource (customer, task, workflow, etc.)

### Step 1: Create Schema

```typescript
// src/lib/validation/schemas/[your-domain].ts
import { z } from 'zod';
import { CommonValidators } from '../helpers';

export const CreateResourceSchema = z.object({
  name: CommonValidators.nonEmptyString(),
  email: CommonValidators.email().optional(),
  customerId: CommonValidators.uuid(),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Export the inferred type for use in your route
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
```

### Step 2: Apply in Route Handler

```typescript
// src/app/api/[your-domain]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, CreateResourceSchema } from '@/lib/validation';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  // 1. Validate request body
  const validation = await validateRequest(request, CreateResourceSchema);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // 2. Use validated data (fully typed!)
  const { name, email, customerId, description } = validation.data;

  // 3. Database operation with service role client
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('your_table')
    .insert({
      name,
      email: email || undefined,
      customer_id: customerId,
      description: description || undefined,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
```

---

## Template 2: GET API with Query Parameter Validation

**Use Case**: Listing/searching resources with filters

### Step 1: Create Query Schema

```typescript
// src/lib/validation/schemas/[your-domain].ts
import { z } from 'zod';
import { CommonValidators } from '../helpers';

export const ResourceQuerySchema = z.object({
  search: z.string().optional(),
  customerId: CommonValidators.uuid().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional().default('25'),
  sortBy: z.enum(['created_at', 'name', 'priority']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
```

### Step 2: Apply in GET Handler

```typescript
// src/app/api/[your-domain]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateQueryParams, ResourceQuerySchema } from '@/lib/validation';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  // 1. Validate query parameters
  const validation = validateQueryParams(request, ResourceQuerySchema);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // 2. Use validated query params
  const {
    search = '',
    customerId,
    status,
    page = 1,
    pageSize = 25,
    sortBy = 'created_at',
    order = 'desc'
  } = validation.data;

  // 3. Build database query
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('your_table')
    .select('*', { count: 'exact' });

  // Apply filters
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  // Apply sorting and pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .order(sortBy, { ascending: order === 'asc' })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  });
}
```

---

## Template 3: UPDATE/PATCH API

**Use Case**: Updating an existing resource

### Step 1: Create Update Schema

```typescript
// src/lib/validation/schemas/[your-domain].ts
import { z } from 'zod';
import { CommonValidators } from '../helpers';

// All fields optional for partial updates
export const UpdateResourceSchema = z.object({
  name: CommonValidators.nonEmptyString().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).strict(); // Reject unknown fields
```

### Step 2: Apply in PATCH Handler

```typescript
// src/app/api/[your-domain]/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, UpdateResourceSchema, CommonValidators } from '@/lib/validation';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validate resource ID from URL
  const idValidation = CommonValidators.uuid().safeParse(params.id);

  if (!idValidation.success) {
    return NextResponse.json(
      { error: 'Invalid resource ID' },
      { status: 400 }
    );
  }

  // 2. Validate request body
  const validation = await validateRequest(request, UpdateResourceSchema);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // 3. Update only provided fields
  const updates = validation.data;

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('your_table')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
```

---

## Template 4: Extended Schema (Route-Specific Fields)

**Use Case**: When you need additional fields beyond a base schema

```typescript
import { z } from 'zod';
import { CreateResourceSchema } from './base-schemas';

// Extend existing schema with additional fields
export const ExtendedResourceSchema = CreateResourceSchema.extend({
  workflowExecutionId: CommonValidators.uuid(),
  stepNumber: z.number().int().positive(),
  dueDate: CommonValidators.isoDate().optional(),
});

// Usage in route is identical to Template 1
```

---

## Template 5: Nested Object Validation

**Use Case**: Complex nested data structures

```typescript
import { z } from 'zod';
import { CommonValidators } from '../helpers';

const AddressSchema = z.object({
  street: CommonValidators.nonEmptyString(),
  city: CommonValidators.nonEmptyString(),
  state: z.string().length(2), // Two-letter state code
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const ContactSchema = z.object({
  name: CommonValidators.nonEmptyString(),
  email: CommonValidators.email(),
  phone: z.string().regex(/^\+?[\d\s()-]+$/).optional(),
});

export const CreateCompanySchema = z.object({
  name: CommonValidators.nonEmptyString(),
  domain: z.string().regex(/^[a-z0-9-]+\.[a-z]{2,}$/i),
  address: AddressSchema,
  primaryContact: ContactSchema,
  secondaryContacts: z.array(ContactSchema).optional(),
});
```

---

## Template 6: Array Validation

**Use Case**: Accepting arrays of items

```typescript
import { z } from 'zod';
import { CommonValidators } from '../helpers';

export const BulkCreateSchema = z.object({
  items: z.array(
    z.object({
      name: CommonValidators.nonEmptyString(),
      customerId: CommonValidators.uuid(),
      priority: z.enum(['low', 'medium', 'high']),
    })
  ).min(1).max(100), // Enforce limits
});

// Usage in route
const validation = await validateRequest(request, BulkCreateSchema);
const { items } = validation.data;

// Insert multiple rows
const { data, error } = await supabase
  .from('your_table')
  .insert(items.map(item => ({
    ...item,
    created_at: new Date().toISOString(),
  })))
  .select();
```

---

## Template 7: Conditional Validation

**Use Case**: Fields required based on other field values

```typescript
import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['manual', 'automated']),
  assigneeId: z.string().uuid().optional(),
  automationConfig: z.record(z.string(), z.any()).optional(),
}).refine(
  // If type is 'automated', automationConfig is required
  (data) => {
    if (data.type === 'automated') {
      return data.automationConfig !== undefined;
    }
    return true;
  },
  {
    message: 'automationConfig is required for automated tasks',
    path: ['automationConfig'],
  }
).refine(
  // If type is 'manual', assigneeId is required
  (data) => {
    if (data.type === 'manual') {
      return data.assigneeId !== undefined;
    }
    return true;
  },
  {
    message: 'assigneeId is required for manual tasks',
    path: ['assigneeId'],
  }
);
```

---

## Template 8: Security-First API (User Isolation)

**Use Case**: Ensuring users only access their own data

```typescript
// src/app/api/[your-domain]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, CreateResourceSchema } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Validate request
  const validation = await validateRequest(request, CreateResourceSchema);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const { name, description } = validation.data;

  // 3. Insert with user_id (CRITICAL for data isolation)
  const { data, error } = await supabase
    .from('your_table')
    .insert({
      name,
      description: description || undefined,
      user_id: user.id,  // 🔒 Always include user_id!
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function GET(request: NextRequest) {
  // 1. Get authenticated user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Query with user_id filter (CRITICAL for security!)
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', user.id);  // 🔒 Always filter by user_id!

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
```

---

## Common Validators Reference

```typescript
import { CommonValidators } from '@/lib/validation';

// String validators
CommonValidators.nonEmptyString()           // Required string
z.string().min(3).max(100)                 // Length constraints

// UUID validators
CommonValidators.uuid()                    // Strict UUID format

// Email validators
CommonValidators.email()                   // RFC-compliant email

// Date validators
CommonValidators.isoDate()                 // ISO 8601 format
z.string().datetime()                      // Alternative

// URL validators
CommonValidators.url()                     // Valid URL format

// Number validators
CommonValidators.positiveInt()             // Integer > 0
z.number().int().min(0).max(100)          // Constrained integer

// Enum validators
z.enum(['option1', 'option2', 'option3'])  // Fixed set of values

// Optional fields
z.string().optional()                      // Can be undefined
z.string().nullable()                      // Can be null
z.string().nullish()                       // Can be null or undefined

// Transforms
z.string().transform(s => s.toLowerCase()) // Normalize data
z.string().regex(/^\d+$/).transform(Number) // String to number
```

---

## Error Handling Best Practices

```typescript
// Always structure error responses consistently
if (!validation.success) {
  return NextResponse.json(
    {
      error: validation.error,
      errors: validation.errors // Detailed field-level errors
    },
    { status: 400 }
  );
}

// Database errors
if (error) {
  // Handle specific Postgres error codes
  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { error: 'Resource not found' },
      { status: 404 }
    );
  }

  if (error.code === '23505') { // Unique constraint violation
    return NextResponse.json(
      { error: 'Resource already exists' },
      { status: 409 }
    );
  }

  // Generic error
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}
```

---

## Quick Decision Tree

```
Need to validate input?
  ├─ Request body (POST/PUT/PATCH)
  │   └─ Use Template 1 or 3
  │
  ├─ Query parameters (GET)
  │   └─ Use Template 2
  │
  ├─ Complex nested data
  │   └─ Use Template 5
  │
  ├─ Array of items
  │   └─ Use Template 6
  │
  └─ User-isolated data
      └─ Use Template 8 (Security-First)
```

---

**Pro Tips:**

1. Always validate UUIDs with `CommonValidators.uuid()` - prevents injection
2. Always filter by `user_id` or `organization_id` - prevents data leaks
3. Use `.optional()` for optional fields, not `.nullable()`
4. Use `.strict()` to reject unknown fields in updates
5. Use `.transform()` to normalize data (lowercase emails, trim whitespace)
6. Test validation with invalid data before deploying

---

**Related Files:**
- `.claude/QA-GUIDE.md` - Complete QA guide for agents
- `src/lib/validation/helpers.ts` - Validation utilities
- `src/lib/validation/schemas/` - Existing schema examples
