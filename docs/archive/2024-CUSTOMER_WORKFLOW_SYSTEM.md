# Customer Management & Workflow System

> **⚠️ DEPRECATED DOCUMENTATION**
>
> **Status:** Archived - Historical Reference Only
> **Date Archived:** 2025-10-07
> **Reason:** This document describes a legacy workflow system that has been superseded by the modular, configuration-driven workflow system.
>
> **Current Documentation:** See `docs/DOCUMENTATION_INDEX.md` for the authoritative source of truth.
>
> **Do not use this document for:**
> - Understanding the current system architecture
> - API integration guidance
> - Implementation decisions
>
> **This document is preserved for:**
> - Historical context
> - Understanding the evolution of the system
> - Reference for migration discussions

## 🎯 **Overview**

This system provides a comprehensive customer management platform with dynamic workflow generation based on customer parameters. It allows Customer Success Managers to:

1. **Manage customers** with renewal dates and key metrics
2. **Search customers** by date proximity to renewal
3. **Launch dynamic workflows** based on customer health, risk, and renewal timing
4. **Prioritize tasks** using an intelligent scoring algorithm

## 🏗️ **System Architecture**

### **Core Components**

1. **Customer Management Page** (`/customers/manage`)
   - Add new customers with comprehensive data
   - View all customers with priority indicators
   - Search by renewal date proximity
   - Launch workflows directly from customer cards

2. **Task Management Page** (`/tasks/do`)
   - Focused single-task interface
   - Dynamic workflow generation
   - Step-by-step task completion
   - Resizable customer/workflow panels

3. **Workflow Engine** (`/lib/workflowEngine.ts`)
   - Intelligent workflow generation based on customer parameters
   - Priority scoring algorithm
   - Multiple workflow types (renewal, health improvement, expansion)

4. **API Routes**
   - `/api/customers` - CRUD operations for customers
   - `/api/tasks/next` - Get highest priority task
   - `/api/tasks/[id]/complete` - Complete tasks

## 📊 **Customer Data Model**

```typescript
interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: 'standard' | 'premium' | 'enterprise';
  health_score: number; // 0-100
  primary_contact_name?: string;
  primary_contact_email?: string;
  renewal_date?: string; // ISO date string
  current_arr?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}
```

## 🎯 **Priority Scoring Algorithm**

The system calculates priority scores (0-100) based on multiple factors:

### **Health Score Impact** (30% weight)
- Lower health scores = higher priority
- Formula: `(100 - health_score) * 0.3`

### **Renewal Urgency** (40% max)
- 7 days or less: +40 points
- 30 days or less: +30 points  
- 90 days or less: +20 points
- 180 days or less: +10 points

### **Risk Level** (30% max)
- Critical: +30 points
- High: +20 points
- Medium: +10 points
- Low: +5 points

### **ARR Value** (25% max)
- $500K+: +25 points
- $250K+: +15 points
- $100K+: +10 points
- <$100K: +5 points

### **Tier Importance** (15% max)
- Enterprise: +15 points
- Premium: +10 points
- Standard: +5 points

## 🔄 **Workflow Types**

### **1. Renewal Workflows**
Generated when customers have upcoming renewal dates:

**Critical Renewal (≤7 days):**
- Immediate Contact Required
- Review Contract Terms
- Prepare Renewal Proposal
- Risk Factors: Critical renewal window, High risk of churn
- Recommendations: Offer immediate incentives, Schedule executive meeting

**High Priority Renewal (≤30 days):**
- Schedule Renewal Meeting
- Analyze Usage Patterns
- Prepare Business Review
- Risk Factors: Approaching renewal date, Competitive pressure
- Recommendations: Highlight value delivered, Identify expansion opportunities

**Standard Renewal (>30 days):**
- Send Renewal Reminder
- Review Customer Health
- Plan Engagement Strategy
- Risk Factors: Standard renewal process
- Recommendations: Maintain regular communication, Monitor usage patterns

### **2. Health Improvement Workflows**
Generated for customers with health scores <50:

- Health Assessment
- Root Cause Analysis
- Improvement Plan
- Risk Factors: Low health score, Engagement issues, Usage decline
- Recommendations: Increase support touchpoints, Provide additional training, Review product fit

### **3. Expansion Workflows**
Generated for high-value customers (ARR ≥$100K):

- Usage Analysis
- Business Review
- Expansion Proposal
- Risk Factors: Market conditions, Budget constraints
- Recommendations: Focus on ROI, Leverage success stories, Offer pilot programs

## 🎨 **User Interface Features**

### **Customer Management Page**
- **Date-based Search**: Find customers near specific renewal dates
- **Priority Indicators**: Color-coded badges (critical, high, medium, low)
- **Health Score Visualization**: Color-coded health indicators
- **Quick Actions**: Launch workflow button for each customer
- **Add Customer Form**: Comprehensive form with all customer fields

### **Task Management Page**
- **Single Task Focus**: One customer + workflow at a time
- **Resizable Panels**: Drag to adjust customer/workflow panel sizes
- **Interactive Steps**: Click to complete individual workflow steps
- **Risk & Recommendations**: Prominent display of risk factors and recommendations
- **Progress Tracking**: Visual indicators for step completion

## 🚀 **Getting Started**

### **1. Access Customer Management**
Navigate to: `http://localhost:3001/customers/manage`

### **2. Add Sample Customers**
The system comes with 5 sample customers:
- **Acme Corporation** (Enterprise, 85 health, Aug 15 renewal)
- **RiskyCorp** (Premium, 45 health, Jul 30 renewal) ⚠️ **Highest Priority**
- **TechStart Inc** (Standard, 72 health, Sep 20 renewal)
- **Global Solutions** (Enterprise, 92 health, Oct 5 renewal)
- **StartupXYZ** (Standard, 35 health, Jul 15 renewal)

### **3. Search by Date**
Use the date picker to find customers near specific renewal dates. The system will sort customers by proximity to your selected date.

### **4. Launch Workflows**
Click "Launch Workflow" on any customer card to generate and start a dynamic workflow.

### **5. Complete Tasks**
Use the task management interface to:
- Review customer information
- Complete workflow steps
- Track progress
- Mark tasks as complete

## 🔧 **API Endpoints**

### **GET /api/customers**
Returns all customers with their data.

### **POST /api/customers**
Creates a new customer. Required fields:
```json
{
  "name": "Company Name",
  "industry": "Technology",
  "tier": "enterprise",
  "health_score": 85,
  "renewal_date": "2024-08-15",
  "current_arr": 450000,
  "risk_level": "low"
}
```

### **GET /api/tasks/next**
Returns the highest priority customer with their generated workflow.

### **POST /api/tasks/[id]/complete**
Marks a workflow as completed.

## 🎯 **Priority Examples**

### **Highest Priority Customer: RiskyCorp**
- **Health Score**: 45 (low)
- **Renewal Date**: July 30, 2024 (critical window)
- **Risk Level**: High
- **ARR**: $380,000
- **Tier**: Premium
- **Priority Score**: 100/100
- **Generated Workflow**: Health Improvement

### **Medium Priority Customer: Acme Corporation**
- **Health Score**: 85 (good)
- **Renewal Date**: August 15, 2024 (approaching)
- **Risk Level**: Low
- **ARR**: $450,000
- **Tier**: Enterprise
- **Priority Score**: ~65/100
- **Generated Workflow**: Renewal (standard)

## 🔮 **Future Enhancements**

1. **Database Integration**: Replace mock data with Supabase queries
2. **Real-time Updates**: WebSocket integration for live updates
3. **Advanced Analytics**: Customer health trends and predictions
4. **Workflow Templates**: Customizable workflow templates
5. **Team Collaboration**: Multi-user task assignment and tracking
6. **Integration APIs**: Connect with CRM and support systems
7. **AI Recommendations**: Machine learning for workflow optimization

## 🛠️ **Technical Stack**

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS with custom design system

## 📁 **File Structure**

```
src/
├── app/
│   ├── customers/
│   │   └── manage/
│   │       └── page.tsx          # Customer management interface
│   ├── tasks/
│   │   └── do/
│   │       └── page.tsx          # Task management interface
│   └── api/
│       ├── customers/
│       │   └── route.ts          # Customer CRUD operations
│       └── tasks/
│           ├── next/
│           │   └── route.ts      # Get next priority task
│           └── [id]/
│               └── complete/
│                   └── route.ts  # Complete task
└── lib/
    └── workflowEngine.ts         # Workflow generation logic
```

This system provides a solid foundation for customer success management with intelligent prioritization and dynamic workflow generation based on real customer data. 