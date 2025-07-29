# Schema Management for Renubu

This document explains the dual schema setup for Renubu, allowing you to maintain both a production-ready complex schema and a simplified MVP schema.

## Schema Overview

### 🏭 **Renubu Production Schema** (`renubu_prod`)
- **Purpose**: Full-featured production system with advanced workflow management
- **Complexity**: High - 16 tables with sophisticated relationships
- **Features**: 
  - Multi-tenant support with companies
  - Advanced workflow system with task templates
  - Action scoring and AI integration
  - Comprehensive conversation tracking
  - Date monitoring and alerting
  - Complex RLS policies

### 🚀 **Renubu MVP Schema** (`renubu_mvp`)
- **Purpose**: Simplified schema for rapid MVP development
- **Complexity**: Low - 6 core tables
- **Features**:
  - Basic user management
  - Simple customer and renewal tracking
  - Task management
  - Event tracking
  - Notes system
  - Simple RLS policies

## Schema Comparison

| Feature | Production Schema | MVP Schema |
|---------|------------------|------------|
| **Tables** | 16 tables | 6 tables |
| **Users** | `profiles` with company support | `users` (simplified) |
| **Customers** | Complex with properties, dates | Simple with basic fields |
| **Renewals** | Advanced with AI scoring | Basic with core fields |
| **Tasks** | Template-based with scoring | Simple with status/priority |
| **Workflows** | Multi-phase with outcomes | Not implemented |
| **Conversations** | Full conversation system | Notes system only |
| **Multi-tenancy** | Full company isolation | Not implemented |
| **AI Integration** | Risk scoring, recommendations | Not implemented |

## MVP Schema Structure

### Core Tables

#### 1. `users` (Simplified Profiles)
```sql
- id (UUID, PK) - References auth.users(id)
- email (TEXT, NOT NULL)
- full_name (TEXT)
- avatar_url (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 2. `customers` (Simplified)
```sql
- id (UUID, PK)
- name (TEXT, NOT NULL)
- domain (TEXT)
- industry (TEXT)
- health_score (INTEGER, DEFAULT 50)
- primary_contact_name (TEXT)
- primary_contact_email (TEXT)
- current_arr (DECIMAL(12,2), DEFAULT 0)
- renewal_date (DATE)
- assigned_to (UUID) - References users(id)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 3. `renewals` (Simplified)
```sql
- id (UUID, PK)
- customer_id (UUID) - References customers(id)
- renewal_date (DATE, NOT NULL)
- current_arr (DECIMAL(12,2), NOT NULL)
- proposed_arr (DECIMAL(12,2))
- probability (INTEGER, DEFAULT 50)
- stage (TEXT, DEFAULT 'discovery')
- risk_level (TEXT, DEFAULT 'medium')
- assigned_to (UUID) - References users(id)
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 4. `tasks` (Simplified)
```sql
- id (UUID, PK)
- renewal_id (UUID) - References renewals(id)
- title (TEXT, NOT NULL)
- description (TEXT)
- status (TEXT, DEFAULT 'pending')
- priority (TEXT, DEFAULT 'medium')
- assigned_to (UUID) - References users(id)
- due_date (DATE)
- completed_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 5. `events` (Simplified)
```sql
- id (UUID, PK)
- title (TEXT, NOT NULL)
- description (TEXT)
- event_type (TEXT, NOT NULL)
- customer_id (UUID) - References customers(id)
- user_id (UUID) - References users(id)
- event_date (TIMESTAMPTZ, NOT NULL)
- status (TEXT, DEFAULT 'scheduled')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### 6. `notes` (Simple Notes System)
```sql
- id (UUID, PK)
- customer_id (UUID) - References customers(id)
- renewal_id (UUID) - References renewals(id)
- user_id (UUID) - References users(id)
- content (TEXT, NOT NULL)
- note_type (TEXT, DEFAULT 'general')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## Usage

### Switching Between Schemas

Use the provided utility script to switch between schemas:

```bash
# Switch to production schema
node scripts/switch-schema.js prod

# Switch to MVP schema
node scripts/switch-schema.js mvp

# Show current schema status
node scripts/switch-schema.js status
```

### Database Access

Both schemas are accessible through views in the `public` schema:

- **Production tables**: `public.profiles`, `public.customers`, etc. (views to `renubu_prod.*`)
- **MVP tables**: `public.users`, `public.customers`, etc. (views to `renubu_mvp.*`)

### Application Development

For MVP development, focus on these tables:
- `users` (instead of `profiles`)
- `customers` (simplified version)
- `renewals` (simplified version)
- `tasks` (instead of complex task system)
- `events` (simplified version)
- `notes` (instead of conversation system)

## Migration Strategy

### Current State
1. ✅ Production schema created and populated
2. ✅ MVP schema created and ready
3. ✅ Utility scripts for schema management
4. ✅ Views for backward compatibility

### Next Steps
1. **Choose your development schema**: Decide whether to use MVP or production schema
2. **Update application code**: Modify your app to use the appropriate table names
3. **Test thoroughly**: Ensure all functionality works with your chosen schema
4. **Deploy**: Use the appropriate schema for your deployment

## Benefits of This Approach

### ✅ **Preserves Investment**
- Your complex production schema is preserved
- All existing data and relationships maintained
- Can switch back to production schema anytime

### ✅ **Accelerates Development**
- MVP schema is much simpler to work with
- Faster development cycles
- Easier to understand and debug

### ✅ **Flexible Deployment**
- Can deploy MVP version for testing
- Can deploy production version when ready
- Easy to migrate between versions

### ✅ **Risk Mitigation**
- No risk of losing complex schema
- Can experiment with MVP without affecting production
- Easy rollback if needed

## Recommendations

### For MVP Development
1. **Use the MVP schema** for rapid development
2. **Focus on core functionality**: customers, renewals, tasks, events
3. **Keep it simple**: Avoid complex workflows initially
4. **Iterate quickly**: Use the simplified structure to move fast

### For Production Deployment
1. **Use the production schema** when ready for full features
2. **Leverage advanced features**: AI scoring, workflows, conversations
3. **Implement multi-tenancy**: Use the company isolation features
4. **Scale with confidence**: Production schema is designed for scale

## Troubleshooting

### Common Issues

**Q: How do I know which schema I'm currently using?**
A: Run `node scripts/switch-schema.js status` to see current schema and table counts.

**Q: Can I access both schemas simultaneously?**
A: Yes, you can query both schemas directly using `renubu_prod.table_name` or `renubu_mvp.table_name`.

**Q: What if I need to migrate data between schemas?**
A: You can write migration scripts to copy data between schemas as needed.

**Q: How do I update my application code?**
A: Update your database queries to use the appropriate table names for your chosen schema.

## Schema Migration Commands

To apply the schema changes:

```bash
# Apply all migrations (including schema setup)
npx supabase db reset

# Or apply specific migrations
npx supabase migration up
```

This setup gives you the flexibility to develop rapidly with a simple schema while preserving your investment in the complex production-ready system. 