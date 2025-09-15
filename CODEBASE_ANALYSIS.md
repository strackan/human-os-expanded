# Renubu Codebase Analysis & Navigation Guide

## 📋 **Executive Summary**

Renubu is a comprehensive contract renewal management platform built with Next.js 15, TypeScript, and Supabase. The application provides customer success teams with AI-powered workflow automation, renewal tracking, and business intelligence tools. The codebase is well-structured with multiple workflow types, comprehensive authentication, and a robust database system.

---

## 🏗️ **Architecture Overview**

### **Technology Stack**
- **Framework**: Next.js 15.3.1 (App Router)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Radix UI primitives
- **Charts**: Recharts
- **Icons**: Heroicons & Lucide React
- **State Management**: React Context API

### **Database Architecture**
- **Primary Schema**: `public` (consolidated)
- **Legacy Schema**: `mvp` (deprecated, being phased out)
- **ORM**: Supabase client with TypeScript types
- **Migration System**: Comprehensive with 20+ migration files
- **Seeding**: Automated via `seed.sql`

---

## 🗺️ **Application Structure**

### **Main Application Workflows**

#### **1. Revenue Architects** (`/revenue-architects`)
- **Purpose**: Identify renewal opportunities and surface upsell recommendations
- **Key Features**: Real-time data analysis, customer insights
- **Components**: Customer dashboards, revenue tracking

#### **2. AI-Powered** (`/ai-powered`)
- **Purpose**: Automate routine CSM tasks
- **Key Features**: Workflow automation, task management
- **Submodules**:
  - `/cloudforce`: Advanced AI workflows
  - Core AI workflows (Email, Contract, Negotiation, Meeting)

#### **3. Impact Engineers** (`/impact-engineers`)
- **Purpose**: Measure and communicate customer value
- **Key Features**: Value metrics, success tracking
- **Submodules**: TechVision analytics

#### **4. Original Workflow** (`/renewals-hq`)
- **Purpose**: Standard renewals management
- **Key Features**: Traditional renewal tracking

### **Core Pages & Navigation**

#### **Main Navigation Structure**
```
/ (Home/Landing)
├── /workflows (Main workflow selector)
├── /customers (Customer management)
│   ├── /manage (Customer administration)
│   ├── /view/[id] (Customer details)
│   ├── /acme-corporation (Demo customer)
│   ├── /risky-corp (Demo customer)
│   └── /initech (Demo customer)
├── /insights (Business analytics)
├── /scenarios (Scenario modeling)
│   ├── /monte-carlo (Monte Carlo analysis)
│   └── /modeling (Price scenario modeling)
├── /contracts (Contract management)
├── /reports (Reporting dashboard)
├── /events (Event tracking)
├── /alerts (Alert management)
├── /history (Audit trail)
├── /revenue (Revenue analytics)
├── /settings (App configuration)
└── /signin (Authentication)
```

#### **Authentication Flow**
- **Entry Point**: `/signin`
- **OAuth Provider**: Google (primary)
- **Email/Password**: Supported as fallback
- **Protection**: All routes protected except public paths
- **Middleware**: Server-side session management

---

## 🔌 **API Structure & Webhooks**

### **API Routes** (`/api/`)

#### **Authentication APIs**
- `POST /api/auth/signin` - Email/password authentication
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/signout` - Sign out user
- `POST /api/auth/refresh` - Refresh session
- `POST /api/auth/create-user` - User creation
- `GET /api/auth/debug` - Authentication debugging

#### **Customer Management APIs**
- `GET /api/customers` - List customers
- `GET /api/customers/[id]` - Get customer details
- `POST /api/customers/[id]/manage` - Customer management actions
- `GET /api/customers/check` - Customer validation
- `GET /api/customers/debug` - Customer debugging

#### **Renewal & Task APIs**
- `GET /api/renewals` - List renewals
- `GET /api/renewals/test` - Test renewal data
- `GET /api/tasks/next` - Get next priority task
- `POST /api/tasks/[id]/complete` - Complete task

#### **System APIs**
- `GET /api/alerts` - Alert management
- `GET /api/events` - Event tracking
- `GET /api/workflows` - Workflow management
- `GET /api/supabase-status` - Database status
- `GET /api/check-config` - Configuration validation

#### **Automation & Webhooks**
- `POST /api/automations/trigger-webhook/[customerId]` - Trigger customer webhook
- `GET /api/automations/random-customer` - Get random customer for testing
- **Active Pieces Integration**: Webhook URL configured for workflow automation
- **Webhook Payload**: Comprehensive customer data with renewal urgency calculations

### **Webhook System**
- **Provider**: Active Pieces
- **Purpose**: Customer renewal workflow automation
- **Trigger**: Manual or automated based on renewal dates
- **Data**: Customer details, renewal urgency, calculated metrics
- **Status Tracking**: Response logging and error handling

---

## 🔐 **Authentication System**

### **Implementation Details**
- **Multi-layer Protection**: Server middleware + client route guard
- **Session Management**: Supabase-handled with automatic refresh
- **OAuth Flow**: Google OAuth with PKCE for security
- **Redirect Handling**: Proper next-parameter preservation
- **Demo Mode**: Environment-based demo access

### **Authentication Files**
```
middleware.ts                           # Server-side protection
src/components/auth/
├── AuthProvider.tsx                    # Context provider
├── AuthProviderWrapper.tsx            # Wrapper component
├── RouteGuard.tsx                     # Client-side protection
├── AuthButton.tsx                     # Sign in/out button
└── UserAvatarDropdown.tsx             # User menu
```

### **Public Routes**
- `/signin`, `/auth/callback`, `/auth/signout`
- Debug routes: `/debug-*`, `/test-*`, `/clear-auth`
- Static files: `favicon.ico`, `robots.txt`, etc.

---

## 🗃️ **Database System**

### **Current Schema Status**
- **Active Schema**: `public` (consolidated)
- **Deprecated Schema**: `mvp` (references being removed)
- **Migration Status**: ✅ Complete, 25+ migrations applied
- **Seed Data**: ✅ Working with comprehensive sample data

### **Core Tables**
```sql
public.profiles              -- User profiles & auth integration
public.customers             -- Customer records with contact refs
public.contacts              -- Contact management system
public.contracts             -- Contract records
public.renewals              -- Renewal tracking with AI insights
public.tasks                 -- Task management linked to renewals
public.task_templates        -- Workflow blueprints
public.events                -- Event tracking system
public.alerts                -- Alert management
public.notes                 -- Notes system
public.renewal_tasks         -- Tasks linked to renewals
public.workflow_conversations -- Conversation history
public.conversation_messages  -- Message details
```

### **Database Query Patterns**
- **Service Layer**: Centralized in `src/lib/services/`
- **Client Access**: Direct Supabase client calls
- **Server Access**: Server-side Supabase client
- **Type Safety**: Generated TypeScript types from database
- **Relationships**: Foreign key constraints with proper cascading

---

## 📁 **File Organization**

### **Source Structure**
```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication pages
│   ├── api/                      # API routes
│   ├── artifacts/                # 🟡 Artifact system (orphaned?)
│   ├── claude_files/             # 🔴 Claude-generated files (orphaned)
│   └── [workflow-types]/         # Main workflow pages
├── components/                   # Reusable components
│   ├── auth/                     # Authentication components
│   ├── customers/                # Customer-specific components
│   ├── layout/                   # Layout components
│   ├── ui/                       # Base UI components
│   ├── charts/                   # Chart components
│   ├── events/                   # Event components
│   └── artifacts/                # 🟡 Artifact components (14 files)
├── context/                      # React contexts
├── hooks/                        # Custom hooks
├── lib/                          # Utilities & services
│   ├── supabase/                 # Database clients
│   ├── services/                 # Business logic services
│   └── engines/                  # Processing engines
├── data/                         # Mock data
└── types/                        # TypeScript type definitions
```

### **Configuration Files**
```
├── package.json                  # Dependencies & scripts
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── middleware.ts                 # Authentication middleware
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── migrations/              # Database migrations (25+ files)
│   └── seed.sql                 # Sample data
└── scripts/                     # Utility scripts
```

---

## ⚠️ **Orphaned & Legacy Code**

### **🔴 Definitely Orphaned**
1. **`src/app/claude_files/`** - Development artifacts
   - Contains experimental components and modeling tools
   - Not linked to main navigation
   - **Recommendation**: Archive or remove

2. **`test.html`** - Large test file (1MB+)
   - Appears to be testing artifacts
   - **Recommendation**: Remove

### **🟡 Potentially Orphaned**
1. **`src/app/artifacts/`** & **`src/components/artifacts/`**
   - 14 artifact components in registry
   - Gallery system for component showcase
   - May be used for demo/showcase purposes
   - **Recommendation**: Verify usage or document purpose

2. **MVP Schema References**
   - Database types still reference `mvp` schema
   - Being actively migrated to `public` schema
   - **Recommendation**: Complete migration process

### **🟢 Legacy but Active**
1. **Individual Customer Pages**
   - `/customers/acme-corporation`, `/customers/risky-corp`, `/customers/initech`
   - Hard-coded demo customers
   - **Status**: Actively used for demonstrations

---

## 🔄 **Data Flow & Integration**

### **Authentication Flow**
```
User Request → Middleware → Session Check → Route Protection → Page Render
                    ↓
              Supabase Auth → Session Validation → User Context
```

### **Database Query Flow**
```
Component → Service Layer → Supabase Client → PostgreSQL → Response
     ↓
Type Safety → Generated Types → Runtime Validation
```

### **Webhook Integration Flow**
```
Manual Trigger → API Route → Customer Data Fetch → Payload Creation → Active Pieces Webhook
```

---

## 📊 **Component Analysis**

### **Layout Components**
- **`AppLayout`**: Main application shell with sidebar
- **`Sidebar`**: Collapsible navigation with 8 main routes
- **`ClientLayout`**: Client-side layout wrapper
- **`PageTransition`**: Smooth page transitions

### **Business Components**
- **Customer Management**: 6 specialized components
- **Charts & Metrics**: Custom chart implementations
- **Workflow Components**: AI-powered workflow interfaces
- **Event Tracking**: Event display and management

### **UI Components**
- **Base Components**: Button, Card, StatusBadge, etc.
- **Form Components**: Input handling with validation
- **Modal System**: Popover and modal implementations
- **Loading States**: Spinner and transition components

---

## 🚀 **Development Workflow**

### **Environment Setup**
```bash
# Start local development
npx supabase start              # Start database
npm run dev                     # Start Next.js dev server

# Database management
npm run sync-schema             # Generate types from DB
npm run validate-schema         # Validate schema consistency
npx supabase db reset          # Reset with migrations + seed
```

### **Schema Management**
```bash
# Create migration
# File: supabase/migrations/YYYYMMDD_description.sql

# Update types
# File: src/types/customer.ts

# Apply changes
npx supabase db push           # Apply migration
npm run sync-schema            # Update TypeScript types
npm run validate-schema        # Validate consistency
```

### **Available Scripts**
```bash
# Development
npm run dev                    # Start development server
npm run build                  # Production build
npm run start                  # Production server
npm run lint                   # ESLint
npm run type-check             # TypeScript check

# Database
npm run sync-schema            # Generate DB types
npm run validate-schema        # Schema validation
npm run clear-auth             # Clear auth cookies
npm run check-env              # Environment check
npm run check-oauth            # OAuth config check
npm run detect-schema          # Schema analysis
npm run smart-seed             # Smart seed selection
npm run schema-diff            # Schema difference analysis
```

---

## 🎯 **Key Integration Points**

### **Active Pieces Integration**
- **Webhook URL**: `https://cloud.activepieces.com/api/v1/webhooks/t5lf6IkC96XmCXQnzifiE/test`
- **Purpose**: Automated workflow triggers based on customer renewal data
- **Payload**: Comprehensive customer data with calculated urgency metrics
- **Implementation**: `src/app/api/automations/trigger-webhook/[customerId]/route.ts`

### **Google OAuth Setup**
- **Client Configuration**: Supabase manages OAuth flow
- **Redirect URI**: `http://127.0.0.1:54321/auth/v1/callback`
- **Environment Variables**: `SUPABASE_AUTH_EXTERNAL_GOOGLE_*`
- **Implementation**: Standard Supabase OAuth with PKCE

### **Database Integration**
- **Type Generation**: Automatic TypeScript type generation from schema
- **Service Layer**: Centralized business logic in `src/lib/services/`
- **Real-time**: Supabase subscriptions for live updates
- **Row Level Security**: Enabled with proper policies

---

## 📈 **Performance & Security**

### **Performance Optimizations**
- **Server Components**: Leveraging Next.js 15 server components
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Supabase client-side caching

### **Security Measures**
- **Server-side Authentication**: Middleware-based protection
- **Row Level Security**: Database-level access control
- **CSRF Protection**: Built into Next.js
- **Input Validation**: TypeScript + runtime validation
- **Environment Variables**: Secure configuration management

---

## 🔍 **Monitoring & Debugging**

### **Debug Routes**
- `/api/auth/debug` - Authentication state
- `/api/customers/debug` - Customer data debugging  
- `/api/debug-env` - Environment variable check
- `/debug-auth-state` - Client-side auth debugging

### **Logging Strategy**
- **Console Logging**: Development debugging
- **Error Handling**: Comprehensive try-catch blocks
- **Webhook Responses**: Detailed response logging
- **Authentication Events**: Auth state change logging

---

## 🎨 **UI/UX Design System**

### **Design Tokens**
- **Colors**: Tailwind CSS color palette
- **Typography**: Inter font family
- **Spacing**: Consistent Tailwind spacing scale
- **Shadows**: Subtle shadow system for depth

### **Component Patterns**
- **Card-based Layout**: Consistent card components
- **Gradient Headers**: Distinctive workflow identification
- **Icon Integration**: Heroicons throughout interface
- **Responsive Design**: Mobile-first approach

---

## 🚧 **Known Issues & Technical Debt**

### **Immediate Issues**
1. **MVP Schema Migration**: Complete removal of deprecated schema references
2. **Orphaned Code**: Clean up `claude_files` and unused artifacts
3. **Large Test File**: Remove or optimize `test.html` (1MB+)

### **Technical Debt**
1. **Duplicate Workflows**: Some AI workflow components are duplicated
2. **Hard-coded Demo Data**: Customer pages with embedded demo data
3. **Mixed Schema References**: Some components still reference old schema

### **Future Improvements**
1. **Component Library**: Formalize artifact component system
2. **Testing**: Add comprehensive test suite
3. **Documentation**: API documentation and component stories
4. **Performance**: Implement advanced caching strategies

---

## 📋 **Conclusion**

The Renubu codebase is a well-structured, modern Next.js application with comprehensive customer renewal management capabilities. The authentication system is robust, the database architecture is sound, and the component organization follows React best practices. 

**Key Strengths:**
- ✅ Comprehensive authentication with OAuth
- ✅ Well-structured database with proper migrations
- ✅ Modern Next.js 15 with TypeScript
- ✅ Multiple workflow types for different use cases
- ✅ Active webhook integrations for automation

**Areas for Cleanup:**
- 🔴 Remove orphaned `claude_files` directory
- 🟡 Verify artifact system usage or document purpose
- 🟡 Complete MVP schema migration
- 🔴 Remove large test files

**Overall Assessment**: The codebase is production-ready with minor cleanup needed for orphaned development artifacts. The architecture supports the business requirements effectively and provides a solid foundation for future enhancements.