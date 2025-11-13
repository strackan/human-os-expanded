# QA Guide for Agents

**Purpose**: This guide helps all agents working on the Renubu codebase maintain quality standards and find the right tools for validation, testing, and security.

---

## Quick Reference

**Before writing ANY new API route:**
1. Read `src/lib/validation/TEMPLATES.md` for copy-paste examples
2. Create a schema in `src/lib/validation/schemas/`
3. Apply validation using `validateRequest()` or `validateQueryParams()`
4. Run `npm run type-check` before committing
5. Pre-commit hook will auto-run ESLint

**Common QA Commands:**
```bash
npm run type-check    # TypeScript validation (no emit)
npm run lint          # ESLint check
npm run check         # All checks: type-check + lint + build
npm run build         # Production build test
```

---

## 1. Runtime Validation with Zod

### Why It Matters
TypeScript only validates at compile-time. Runtime validation prevents:
- Invalid data from reaching the database
- Security vulnerabilities (injection, XSS)
- Type mismatches at runtime
- Missing required fields

### How to Use

#### For API Request Bodies:
```typescript
import { validateRequest, CreateCustomerSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // Validate request body
  const validation = await validateRequest(request, CreateCustomerSchema);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // Use validated data (TypeScript knows the exact type!)
  const { name, domain, healthScore } = validation.data;

  // ... proceed with database operations
}
```

#### For Query Parameters:
```typescript
import { validateQueryParams, CustomerQuerySchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const validation = validateQueryParams(request, CustomerQuerySchema);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const { search, page, pageSize } = validation.data;
  // ... use validated query params
}
```

### Where to Find Tools

**Validation Helpers:**
- `src/lib/validation/helpers.ts` - `validateRequest()`, `validateQueryParams()`
- `src/lib/validation/index.ts` - Central exports

**Common Validators:**
```typescript
import { CommonValidators } from '@/lib/validation';

CommonValidators.uuid()           // UUID validation
CommonValidators.email()          // Email validation
CommonValidators.nonEmptyString() // Required string
CommonValidators.isoDate()        // ISO 8601 date
CommonValidators.url()            // Valid URL
CommonValidators.positiveInt()    // Integer > 0
```

**Existing Schemas:**
- `src/lib/validation/schemas/workflows.ts` - Workflow executions, tasks
- `src/lib/validation/schemas/customers.ts` - Customer operations
- `src/lib/validation/schemas/tasks.ts` - Task management
- `src/lib/validation/schemas/talent.ts` - Talent orchestration

**Templates:**
- `src/lib/validation/TEMPLATES.md` - Copy-paste examples for new APIs

---

## 2. Pre-commit Quality Gates

### What Runs Automatically

When you run `git commit`, these checks run automatically via Husky:

1. **lint-staged** - Only lints files you're committing (fast!)
2. **ESLint with auto-fix** - Fixes fixable issues automatically
3. **Strict Rules**:
   - `@typescript-eslint/no-unused-vars`: **error** (blocks commit)
   - `react/no-unescaped-entities`: **error** (blocks commit)

### How to Handle Pre-commit Failures

**If commit fails with unused variable:**
```bash
# The hook already tried to auto-fix. If it failed, you need to:
# 1. Remove the unused variable/import
# 2. Try commit again
```

**If you need to bypass (use sparingly!):**
```bash
git commit --no-verify -m "message"  # Use only in emergencies
```

**Best Practice:**
Run `npm run lint` before staging to catch issues early.

---

## 3. TypeScript Type Safety

### Before ANY Commit

Always run type checking:
```bash
npm run type-check
```

This runs `tsc --noEmit` and catches type errors without building.

### Common Type Issues

**❌ Avoid:**
```typescript
const data: any = await request.json();  // Unsafe!
```

**✅ Prefer:**
```typescript
const validation = await validateRequest(request, MySchema);
const data = validation.data;  // Fully typed!
```

**null vs undefined:**
- Database fields returning `null` should be typed as `| undefined` for consistency
- Use `|| undefined` instead of `|| null` for fallbacks

---

## 4. API Security Checklist

### Critical Security Rules

**ALWAYS filter by user_id or team_id:**
```typescript
// ❌ WRONG - Returns ALL customers (security vulnerability!)
const { data } = await supabase
  .from('customers')
  .select('*');

// ✅ CORRECT - Only returns user's customers
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('user_id', userId);  // or organization_id, team_id
```

**ALWAYS validate UUIDs:**
```typescript
import { CommonValidators } from '@/lib/validation';

const schema = z.object({
  customerId: CommonValidators.uuid()  // Prevents injection
});
```

**NEVER trust client input:**
```typescript
// ❌ WRONG
const customerId = request.nextUrl.searchParams.get('customerId');
const { data } = await supabase.from('customers').select('*').eq('id', customerId);

// ✅ CORRECT
const validation = validateQueryParams(request, QuerySchema);
if (!validation.success) return error response;
const { customerId } = validation.data;  // Validated UUID
```

### Common Vulnerabilities to Prevent

1. **Missing user_id filters** → Data leak across accounts
2. **Unvalidated UUIDs** → SQL injection risk
3. **No input validation** → XSS, type errors
4. **Trusting query params** → Authorization bypass

---

## 5. Testing (Coming Soon)

**Status**: Vitest installation pending (Day 3)

Once configured, tests will be at:
- `src/__tests__/` - Test files
- Run with: `npm run test`

---

## 6. When to Create New Schemas

### Create a new schema file when:
- Adding a new API route with POST/PUT/PATCH
- Handling query parameters with multiple fields
- Accepting user input of any kind

### Schema Naming Convention:
- `Create[Entity]Schema` - For POST requests
- `Update[Entity]Schema` - For PUT/PATCH requests
- `[Entity]QuerySchema` - For GET query parameters

### Where to Put Schemas:
```
src/lib/validation/schemas/
  ├── workflows.ts      # Workflow-related
  ├── customers.ts      # Customer operations
  ├── tasks.ts          # Task management
  ├── talent.ts         # Talent orchestration
  └── [your-domain].ts  # New domain
```

---

## 7. Quick Troubleshooting

### "Validation failed: Must be a valid UUID"
→ Check that UUIDs are in correct format (8-4-4-4-12 hex digits)
→ Use `CommonValidators.uuid()` not `z.string()`

### "No access_token in response"
→ OAuth token endpoint returned unexpected format
→ Check `OAuthService.ts` for proper credential handling

### "Type 'X' is not assignable to type 'Y'"
→ Check for null vs undefined mismatches
→ Use `|| undefined` for database null fallbacks

### Pre-commit hook fails
→ Run `npm run lint` to see all errors
→ Fix errors one by one
→ Remove unused imports/variables

---

## 8. Agent Reminders

**For all agents working on this codebase:**

1. **NEW API route?** → Read `TEMPLATES.md` first
2. **Accepting user input?** → Validate with Zod schema
3. **Database query?** → Filter by user_id/team_id
4. **Before commit?** → Run `npm run type-check`
5. **Type error?** → Never use `any`, create proper types
6. **Unsure?** → Check existing implementations in `src/app/api/`

---

## 9. Quality Standards Summary

| Check | Tool | When | Enforcement |
|-------|------|------|-------------|
| Runtime validation | Zod | Every API route | Manual (required) |
| Type safety | TypeScript | Before commit | Manual (`npm run type-check`) |
| Code quality | ESLint | On commit | Automatic (pre-commit hook) |
| Unused vars | ESLint | On commit | **Error** (blocks commit) |
| Build success | Next.js | Before deploy | CI/CD |

---

## 10. Related Documentation

- `src/lib/validation/TEMPLATES.md` - Copy-paste validation examples
- `eslint.config.mjs` - ESLint rules and configuration
- `.husky/pre-commit` - Pre-commit hook setup
- `package.json` - lint-staged configuration

---

**Last Updated**: Day 3 of QA Infrastructure Implementation
**Maintainer**: Quality Assurance Team
