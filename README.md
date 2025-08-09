# renubu

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 **Quick Start for New Workers**

**📚 NEW WORKERS: Start here!** Read the comprehensive [New Worker Onboarding Guide](NEW_WORKER_ONBOARDING.md) before beginning any development work.

## 🏗️ **Project Overview**

Renubu is a customer renewal management application built with Next.js 15, React 19, TypeScript, and Supabase. The application features:

- **Customer Management System** - Comprehensive customer tracking and renewal management
- **Task Management** - Priority-based task queue with intelligent workflow generation
- **AI-Powered Features** - Contract analysis, email workflows, and meeting management
- **Authentication System** - Google OAuth integration with multi-layer security
- **Dual Database Schema** - Production and MVP schemas for flexible development

## 🛠️ **Technology Stack**

- **Frontend**: Next.js 15, React 19, TypeScript 5, TailwindCSS 4
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **UI Components**: Radix UI, Framer Motion, Heroicons, Recharts

## 📁 **Key Directories**

```
src/
├── app/                    # Next.js App Router pages
│   ├── customers/          # Customer management
│   ├── tasks/             # Task management system
│   ├── workflows/         # Workflow management
│   ├── ai-powered/        # AI-powered features
│   └── api/               # API endpoints
├── components/            # Reusable UI components
├── lib/                   # Services and utilities
├── types/                 # TypeScript definitions
└── hooks/                 # Custom React hooks
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm
- Supabase CLI (`npm install -g supabase`)

### **Installation**
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

### **Environment Setup**
```bash
# Check environment configuration
npm run check-env

# Validate schema consistency
npm run validate-schema

# Sync database types
npm run sync-schema
```

## 📚 **Essential Documentation**

### **For New Workers**
1. **[NEW WORKER ONBOARDING GUIDE](NEW_WORKER_ONBOARDING.md)** - Start here! Complete guide for new team members
2. **[AUTHENTICATION_SYSTEM_README.md](AUTHENTICATION_SYSTEM_README.md)** - Complete authentication system details
3. **[DATABASE_SYSTEM_GUIDE.md](DATABASE_SYSTEM_GUIDE.md)** - Complete database system, schema management, and migrations
4. **[CUSTOMER_WORKFLOW_SYSTEM_README.md](CUSTOMER_WORKFLOW_SYSTEM_README.md)** - Customer management system
5. **[TASK_MANAGEMENT_README.md](TASK_MANAGEMENT_README.md)** - Task management implementation

### **Development Resources**
- **Next.js Documentation**: https://nextjs.org/docs
- **Supabase Documentation**: https://supabase.com/docs
- **TailwindCSS Documentation**: https://tailwindcss.com/docs

## 🔧 **Available Scripts**

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code

# Database & Schema
npm run sync-schema      # Sync types from database
npm run validate-schema  # Validate schema consistency
npm run type-check       # TypeScript type checking

# Environment & Configuration
npm run check-env        # Check environment variables
npm run check-oauth      # Verify OAuth configuration
npm run clear-auth       # Clear authentication cookies
```

## 🗄️ **Database Management**

### **Schema System**
- **MVP Schema** (`renubu_mvp`) - Simplified schema for rapid development
- **Production Schema** (`renubu_prod`) - Full-featured production system

### **Schema Switching**
```bash
# Switch between schemas
node scripts/switch-schema.js prod    # Switch to production schema
node scripts/switch-schema.js mvp     # Switch to MVP schema
node scripts/switch-schema.js status  # Show current schema status
```

### **Migrations**
```bash
# Create new migration
npx supabase migration new description_of_change

# Apply migrations
npx supabase db push

# Reset database (⚠️ destroys local data)
npx supabase db reset
```

## 🚨 **Critical Development Rules**

### **Database Changes**
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

## 🎯 **Key Features**

### **Customer Management**
- Customer CRUD operations
- Renewal date tracking
- Health score monitoring
- Risk level assessment

### **Task Management**
- Priority-based task queue
- Dynamic workflow generation
- Step-by-step task completion
- Progress tracking

### **AI-Powered Workflows**
- Contract analysis
- Email workflow generation
- Meeting management
- Negotiation support

## 🔍 **Troubleshooting**

### **Common Issues**
```bash
# Database connection problems
npx supabase status
npx supabase restart

# Authentication issues
npm run clear-auth
npm run check-oauth

# Build problems
rm -rf .next
npm install
```

### **Getting Help**
- Check the documentation files above
- Review existing component implementations
- Use `cursor-tools` for AI assistance
- Ask questions when unsure about any process

## 🚀 **Deployment**

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 📝 **Customer Renewal Pages – Prototyping Guide**

This project uses a **shared, customizable layout** for customer renewal pages. All customer-specific details are provided via static data objects, making it easy to add or update customers during prototyping.

### **How to Add a New Customer Page**

1. **Create a Data Object**
   - Open `src/data/customers.ts`.
   - Copy an existing customer data object (e.g., `riskyCorpData` or `acmeCorpData`).
   - Update the fields (name, stats, insights, etc.) for your new customer.

2. **Create a New Page**
   - In `src/app/customers/`, create a new folder named after your customer (e.g., `new-co`).
   - Inside that folder, create a `page.tsx` file.
   - Import your data object and the shared layout.

3. **Customize as Needed**
   - You can further customize the chat dialog, workflow steps, or any section by editing the data object or passing additional props.

### **Example Directory Structure**
```
src/
  app/
    customers/
      new-co/
        page.tsx
  components/
    customers/
      CustomerRenewalLayout.tsx
      CustomerChatDialog.tsx
  data/
    customers.ts
```

---

**Happy coding! 🎉**

For comprehensive development guidance, start with the [New Worker Onboarding Guide](NEW_WORKER_ONBOARDING.md).
