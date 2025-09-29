# Task Management System - Sandbox Implementation

## Overview

This is a sandbox implementation of a priority-driven task management system for Customer Success Managers (CSMs). The system displays the highest priority customer event with an appropriate workflow, allowing CSMs to efficiently process their task queue.

## 🎯 **Key Features**

### **Core Functionality**
- **Single Task Focus**: Displays one customer + workflow at a time based on highest priority event
- **Dynamic Customer Display**: Shows customer card with relevant details for the active event
- **Contextual Workflows**: Displays workflow UI based on event type (e.g., "30 days to renewal")
- **Task Completion**: Mark events as completed and automatically load next priority task
- **Queue Management**: Handle empty queue states gracefully

### **UI/UX Design**
- **Two-Panel Layout**: Customer information (left) + Workflow steps (right)
- **Resizable Panels**: Draggable divider for customizing panel sizes
- **Progress Tracking**: Visual progress bar and step completion indicators
- **Responsive Design**: Works on different screen sizes
- **Loading States**: Skeleton loaders during API calls
- **Error Handling**: Graceful error states with retry options

## 📁 **File Structure**

```
src/app/tasks/do/
├── page.tsx                    # Main task management page
└── api/
    ├── tasks/next/
    │   └── route.ts           # API endpoint for fetching next task
    └── tasks/[id]/complete/
        └── route.ts           # API endpoint for completing tasks
```

## 🏗️ **Architecture**

### **Page Component** (`/app/tasks/do/page.tsx`)
- **State Management**: Uses React hooks for task data, loading states, and UI interactions
- **API Integration**: Fetches tasks from `/api/tasks/next` and completes them via `/api/tasks/[id]/complete`
- **Component Structure**:
  - `CustomerCard`: Displays customer information and context
  - `WorkflowPanel`: Shows workflow steps with completion tracking
  - Main layout with resizable panels

### **API Routes**
- **`/api/tasks/next`**: Returns the highest priority active task
- **`/api/tasks/[id]/complete`**: Marks a task as completed

## 📊 **Data Models**

### **Task Interface**
```typescript
interface Task {
  id: string;
  event_type: string;
  priority_score: number;
  status: 'active' | 'completed' | 'archived';
  customer: Customer;
  workflow: Workflow;
  metadata: {
    days_until_renewal?: number;
    contract_value?: number;
    risk_factors?: string[];
    [key: string]: any;
  };
}
```

### **Customer Interface**
```typescript
interface Customer {
  id: string;
  name: string;
  industry: string;
  arr_value: number;
  health_score: number;
  renewal_date?: string;
  usage_percentage?: number;
  support_tickets?: number;
  last_engagement?: string;
}
```

### **Workflow Interface**
```typescript
interface Workflow {
  id: string;
  event_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  steps: WorkflowStep[];
}
```

## 🎨 **UI Components**

### **CustomerCard**
- Displays customer name, industry, and health score
- Shows key metrics (ARR, usage, renewal date, support tickets)
- Highlights task-specific context (days until renewal)
- Lists risk factors when present

### **WorkflowPanel**
- Progress bar showing completion percentage
- Interactive workflow steps with completion buttons
- Visual indicators for required vs optional steps
- Action buttons for saving progress and completing all tasks

## 🔄 **Event Type → Workflow Mapping**

### **Renewal Events**
- **`renewal_30_days`**: Standard renewal workflow (5 steps)
- **`renewal_7_days`**: Urgent renewal workflow (4 steps)

### **Workflow Steps Examples**
- Review Account Data
- Confirm Renewal Strategy
- Confirm Contacts
- Address Risk Factors
- Send Renewal Notice

## 🚀 **Usage**

### **Accessing the Page**
Navigate to `/tasks/do` to access the task management interface.

### **Task Flow**
1. Page loads and fetches the highest priority task
2. Customer information displays on the left panel
3. Workflow steps show on the right panel
4. Complete individual steps or the entire task
5. System automatically loads the next priority task

### **API Testing**
```bash
# Fetch next task
curl http://localhost:3000/api/tasks/next

# Complete a task
curl -X POST http://localhost:3000/api/tasks/{task-id}/complete
```

## 🧪 **Current Implementation Status**

### **✅ Completed**
- Basic page structure and layout
- Customer card component with dynamic data
- Workflow panel with step completion
- API routes for task management
- Loading and error states
- Resizable panels
- Mock data for testing

### **🔄 In Progress**
- Database integration (currently using mock data)
- Real customer data integration
- Workflow engine for priority calculation
- Multi-tenant support

### **📋 Future Enhancements**
- Database schema implementation
- Real-time task updates
- Advanced workflow customization
- Analytics and reporting
- Integration with existing customer data
- Multi-user task assignment

## 🎯 **Success Metrics**

### **Functional Requirements**
- ✅ Page loads and displays highest priority task
- ✅ Customer information displays correctly for active task
- ✅ Workflow content adapts based on event type
- ✅ "Complete Task" button marks event as completed
- ✅ Next task loads automatically after completion
- ✅ Empty queue state displays when no tasks available

### **UX Requirements**
- ✅ Consistent with existing design patterns
- ✅ Responsive layout works on different screen sizes
- ✅ Loading states provide clear feedback
- ✅ Error handling is user-friendly
- ✅ Task completion feels satisfying and efficient

## 🔧 **Technical Notes**

### **Dependencies**
- React 18+ with TypeScript
- Next.js 14+ App Router
- TailwindCSS for styling
- Heroicons for icons

### **Browser Compatibility**
- Modern browsers with ES6+ support
- Responsive design for mobile and desktop

### **Performance Considerations**
- Lazy loading of components
- Optimized re-renders with React hooks
- Efficient state management

## 📝 **Development Notes**

This implementation serves as a sandbox for testing the task management concept. It's designed to be easily extensible and can be integrated with the existing Renubu platform once the database schema and business logic are finalized.

The current mock data includes two sample tasks:
1. **Acme Corporation** (Priority: 85) - 30 days to renewal
2. **RiskyCorp** (Priority: 95) - 7 days to renewal (highest priority)

The system correctly prioritizes RiskyCorp due to its higher priority score and more urgent timeline. 