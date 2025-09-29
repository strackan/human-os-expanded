# New Worker Onboarding Guide - Renubu Application

## 🎯 **Welcome to Renubu!**

This guide provides everything you need to know to work effectively on our customer renewal management application. Please read through this entire document before starting any development work.

## 🏗️ **Technology Stack Overview**

### **Frontend Framework**
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Static type checking
- **TailwindCSS 4** - Utility-first CSS framework

### **Backend & Database**
- **Supabase** - PostgreSQL database with real-time features
- **Next.js API Routes** - Server-side API endpoints
- **Row Level Security (RLS)** - Database-level access control

### **Authentication & Security**
- **Supabase Auth** - OAuth integration (Google)
- **Middleware Protection** - Server-side route guards
- **Client-side Route Guards** - Additional protection layers

### **UI/UX Libraries**
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Heroicons** - Icon library
- **Recharts** - Chart components

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Turbopack** - Fast development builds

## 📁 **Project Structure**

```
renubu/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── customers/          # Customer management pages
│   │   ├── tasks/             # Task management system
│   │   ├── workflows/         # Workflow management
│   │   ├── api/               # API endpoints
│   │   └── auth/              # Authentication routes
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utility functions & services
│   ├── types/                 # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── styles/                # Global styles & CSS
├── supabase/                  # Database configuration
│   ├── migrations/            # Database schema changes
│   └── config.toml           # Supabase configuration
└── scripts/                   # Utility scripts
```

## 🗄️ **Database Architecture**

### **Dual Schema System**
We maintain two database schemas for flexibility:

1. **`renubu_prod`** - Full production schema (16 tables)
   - Advanced workflow management
   - AI-powered scoring
   - Multi-tenant support
   - Complex RLS policies

2. **`renubu_mvp`** - Simplified MVP schema (6 tables)
   - Basic customer management
   - Simple task tracking
   - Event management
   - Notes system

### **Current Active Schema**
- **Default**: `renubu_mvp` (simplified for rapid development)
- **Switch schemas**: Use `node scripts/switch-schema.js [prod|mvp|status]`

### **Key Tables (MVP Schema)**
- `users` - User profiles and authentication
- `customers` - Customer information and metrics
- `renewals` - Renewal contracts and dates
- `tasks` - Task management and tracking
- `events` - Customer events and milestones
- `notes` - Customer and renewal notes

## 🔐 **Authentication System**

### **Multi-Layer Protection**
1. **Server Middleware** (`middleware.ts`) - Runs on every request
2. **Client Route Guards** (`RouteGuard.tsx`) - Component-level protection
3. **API Route Protection** - Server-side validation

### **OAuth Flow**
- Google OAuth integration via Supabase
- Automatic redirect after authentication
- Session management and persistence

### **Protected vs Public Routes**
- **Protected**: All application pages (dashboard, customers, tasks, etc.)
- **Public**: Sign-in, OAuth callbacks, static files

## 🚀 **Development Workflow**

### **Getting Started**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check database status
npx supabase status

# Apply database migrations
npx supabase db push
```

### **Database Changes Process**
**IMPORTANT**: Never modify the database schema directly. Always follow this process:

1. **Create Migration File**
   ```bash
   # Create new migration
   npx supabase migration new description_of_change
   ```

2. **Update TypeScript Types**
   - Modify `src/types/customer.ts` (or relevant type file)
   - Update `src/lib/schema-validator.ts` if needed

3. **Apply Changes**
   ```bash
   # Apply migration
   npx supabase db push
   
   # Sync types (optional)
   npm run sync-schema
   
   # Validate schema
   npm run validate-schema
   ```

### **Schema Management Commands**
```bash
# Switch between schemas
node scripts/switch-schema.js prod    # Switch to production schema
node scripts/switch-schema.js mvp     # Switch to MVP schema
node scripts/switch-schema.js status  # Show current schema status

# Sync types from database
npm run sync-schema

# Validate schema consistency
npm run validate-schema
```

## 🎨 **UI/UX Standards**

### **Design System**
- **TailwindCSS Classes**: Use utility classes for styling
- **Component Library**: Leverage existing components in `src/components/ui/`
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Follow ARIA guidelines and keyboard navigation

### **Component Patterns**
- Use `const` instead of `function` for components
- Prefix event handlers with `handle` (e.g., `handleClick`)
- Implement proper loading and error states
- Use TypeScript interfaces for all props

### **Styling Guidelines**
- Prefer Tailwind classes over custom CSS
- Use `class:` instead of ternary operators when possible
- Maintain consistent spacing and typography
- Follow existing color schemes and design patterns

## 🔧 **Key Development Areas**

### **Customer Management System**
- **Location**: `src/app/customers/`
- **Features**: Customer CRUD, renewal tracking, health scoring
- **Data Source**: Static data objects in `src/data/customers.ts`

### **Task Management System**
- **Location**: `src/app/tasks/do/`
- **Features**: Priority-based task queue, workflow generation
- **API**: `/api/tasks/next` and `/api/tasks/[id]/complete`

### **Workflow Engine**
- **Location**: `src/lib/workflowEngine.ts`
- **Features**: Dynamic workflow generation, priority scoring
- **Integration**: Customer health, renewal dates, risk factors

### **AI-Powered Features**
- **Location**: `src/app/ai-powered/`
- **Features**: Contract analysis, email workflows, meeting management
- **Status**: Implementation in progress

## 📊 **Data Management**

### **Type Safety**
- All data structures defined in `src/types/`
- Runtime validation via `SchemaValidator` class
- Consistent interfaces across components

### **API Patterns**
- RESTful API routes in `src/app/api/`
- Consistent error handling and response formats
- Proper HTTP status codes and error messages

### **State Management**
- React hooks for local state
- Context API for global state (auth, chat, dates)
- Custom hooks for reusable logic

## 🧪 **Testing & Quality Assurance**

### **Code Quality**
```bash
# Lint code
npm run lint

# Type checking
npm run type-check

# Build verification
npm run build
```

### **Database Validation**
```bash
# Validate schema consistency
npm run validate-schema

# Check database status
npx supabase status

# View database logs
npx supabase logs
```

## 🚨 **Critical Rules & Warnings**

### **Database Schema Changes**
- **NEVER** modify database directly
- **ALWAYS** create migration files
- **ALWAYS** update TypeScript types
- **ALWAYS** run validation after changes

### **Authentication**
- **NEVER** bypass authentication middleware
- **ALWAYS** test protected routes
- **ALWAYS** verify OAuth configuration

### **Code Standards**
- **NEVER** commit with linting errors
- **ALWAYS** use TypeScript interfaces
- **ALWAYS** follow existing component patterns
- **ALWAYS** implement proper error handling

## 🔍 **Troubleshooting Common Issues**

### **Database Connection Issues**
```bash
# Check Supabase status
npx supabase status

# Restart Supabase
npx supabase stop
npx supabase start

# Reset database (⚠️ destroys local data)
npx supabase db reset
```

### **Authentication Problems**
```bash
# Clear auth cookies
npm run clear-auth

# Check environment variables
node scripts/check-env.js

# Verify OAuth configuration
node scripts/check-oauth-config.js
```

### **Build Issues**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 **Essential Documentation**

### **Must-Read Documents**
1. **`AUTHENTICATION_SYSTEM_README.md`** - Complete auth system details
2. **`DATABASE_SYSTEM_GUIDE.md`** - Complete database system, schema management, and migrations
3. **`CUSTOMER_WORKFLOW_SYSTEM_README.md`** - Customer management system
4. **`TASK_MANAGEMENT_README.md`** - Task management implementation

### **API Documentation**
- Check `src/app/api/` for endpoint implementations
- Review `src/types/` for data structures
- Examine `src/lib/` for service implementations

## 🎯 **Getting Help**

### **Development Resources**
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **TailwindCSS Docs**: https://tailwindcss.com/docs
- **TypeScript Docs**: https://www.typescriptlang.org/docs

### **Internal Resources**
- Check existing documentation files
- Review similar component implementations
- Examine database migrations for examples
- Use `cursor-tools` for AI assistance

## 🚀 **Next Steps**

1. **Read all documentation** thoroughly
2. **Set up development environment** with proper database
3. **Explore existing code** to understand patterns
4. **Start with small changes** to build familiarity
5. **Ask questions** when unsure about any process

---

**Remember**: This application is actively developed with a dual schema system. Always verify which schema you're working with and follow the established processes for any changes.

**Welcome to the team! 🎉** 