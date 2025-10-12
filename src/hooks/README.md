# React Hooks for Renewal Optimization Platform

This directory contains a comprehensive set of React hooks designed specifically for the renewal optimization platform. These hooks provide optimal data management, real-time updates, and business logic for all core platform functionality.

## 🚀 Features

- **Real-time Updates**: All hooks include Supabase real-time subscriptions
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Error Handling**: Built-in error states and loading indicators
- **Auto-refresh**: Configurable automatic data refresh
- **Filtering & Sorting**: Advanced filtering and sorting capabilities
- **Optimistic Updates**: Immediate UI updates with background sync
- **Computed Stats**: Built-in analytics and statistics

## 📦 Available Hooks

### 1. `useRenewals` - Renewal Management
Comprehensive renewal data management with filtering, sorting, and real-time updates.

```typescript
import { useRenewals } from '@/hooks';

const RenewalsComponent = () => {
  const {
    renewals,
    loading,
    error,
    refetch,
    updateRenewal,
    createRenewal,
    stats
  } = useRenewals({
    filters: { stage: 'negotiation', risk_level: 'high' },
    sortBy: 'renewal_date',
    sortOrder: 'asc',
    autoRefresh: true
  });

  // Access computed stats
  console.log(`Total renewals: ${stats.total}`);
  console.log(`Total value: $${stats.totalValue.toLocaleString()}`);
};
```

**Key Features:**
- Filter by stage, risk level, assigned user, date range
- Sort by renewal date, ARR, probability, creation date
- Real-time updates for all renewal changes
- Automatic statistics calculation
- CRUD operations with optimistic updates

### 2. `useConversations` - Workflow Conversations
Manage workflow conversations and messages with real-time chat functionality.

```typescript
import { useConversations } from '@/hooks';

const ConversationsComponent = () => {
  const {
    conversations,
    loading,
    sendMessage,
    createConversation,
    getConversationMessages
  } = useConversations({
    filters: { conversation_type: 'renewal_prep' },
    includeMessages: true,
    autoRefresh: true
  });

  const handleSendMessage = async (conversationId: string, content: string) => {
    await sendMessage(conversationId, {
      participant_type: 'user',
      message_type: 'text',
      content
    });
  };
};
```

**Key Features:**
- Real-time message synchronization
- Conversation threading and replies
- Privacy levels (private, team, company)
- Message confidence scoring
- Structured data support

### 3. `useWorkflows` - Workflow Management
Complete workflow template and instance management with execution tracking.

```typescript
import { useWorkflows } from '@/hooks';

const WorkflowsComponent = () => {
  const {
    templates,
    instances,
    createTemplate,
    createInstance,
    executeStep,
    stats
  } = useWorkflows({
    includeTemplates: true,
    includeExecutions: true
  });

  const handleCreateWorkflow = async () => {
    const templateId = await createTemplate({
      name: 'Renewal Preparation',
      description: 'Standard renewal preparation workflow',
      trigger_type: 'manual',
      conditions: {},
      steps: [
        {
          id: 'step1',
          action_type: 'review_account',
          title: 'Review Account Data',
          description: 'Analyze customer usage and health metrics'
        }
      ],
      status: 'active'
    });

    const instanceId = await createInstance({
      template_id: templateId,
      renewal_id: 'renewal-123',
      status: 'pending'
    });
  };
};
```

**Key Features:**
- Workflow template creation and management
- Instance execution tracking
- Step-by-step workflow execution
- Progress monitoring
- Execution history and analytics

### 4. `useTasks` - Task Management
Priority-based task management with action scoring and deadline tracking.

```typescript
import { useTasks } from '@/hooks';

const TasksComponent = () => {
  const {
    tasks,
    templates,
    getNextPriorityTask,
    completeTask,
    assignTask,
    stats
  } = useTasks({
    filters: { status: 'pending', is_overdue: false },
    sortBy: 'action_score',
    sortOrder: 'desc'
  });

  const handleGetNextTask = async () => {
    const nextTask = await getNextPriorityTask();
    if (nextTask) {
      console.log(`Next priority task: ${nextTask.task_name}`);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId, true, 'Task completed successfully');
  };
};
```

**Key Features:**
- Action score-based prioritization
- Deadline urgency scoring
- Task template management
- Automatic task generation for renewals
- Overdue task tracking

### 5. `useCustomers` - Customer Management
Customer relationship management with health scoring and risk assessment.

```typescript
import { useCustomers } from '@/hooks';

const CustomersComponent = () => {
  const {
    customers,
    updateCustomerProperties,
    calculateHealthScore,
    assessRiskLevel,
    stats
  } = useCustomers({
    filters: { tier: 'enterprise' },
    includeProperties: true,
    includeRenewals: true
  });

  const handleUpdateHealthScore = async (customerId: string) => {
    const healthScore = await calculateHealthScore(customerId);
    const riskLevel = await assessRiskLevel(customerId);
    
    console.log(`Customer ${customerId}: Health ${healthScore}, Risk ${riskLevel}`);
  };
};
```

**Key Features:**
- Customer health scoring algorithm
- Risk level assessment
- Customer properties management
- Renewal summary integration
- Industry and tier-based analytics

## 🔧 Configuration Options

All hooks support common configuration options:

```typescript
interface HookOptions {
  filters?: Record<string, any>;        // Data filtering
  sortBy?: string;                      // Sort field
  sortOrder?: 'asc' | 'desc';           // Sort direction
  limit?: number;                       // Result limit
  autoRefresh?: boolean;                // Enable auto-refresh
  refreshInterval?: number;             // Refresh interval (ms)
}
```

## 📊 Real-time Features

All hooks include real-time subscriptions for immediate updates:

- **Database Changes**: Automatic UI updates when data changes
- **Optimistic Updates**: Immediate UI feedback with background sync
- **Error Recovery**: Automatic retry and error handling
- **Connection Management**: Automatic reconnection handling

## 🎯 Usage Patterns

### Basic Usage
```typescript
const { data, loading, error, refetch } = useHookName();
```

### With Filters
```typescript
const { data, loading } = useHookName({
  filters: { status: 'active', priority_min: 5 },
  sortBy: 'created_at',
  sortOrder: 'desc'
});
```

### With Auto-refresh
```typescript
const { data, loading } = useHookName({
  autoRefresh: true,
  refreshInterval: 60000 // Refresh every minute
});
```

### Error Handling
```typescript
const { data, loading, error, refetch } = useHookName();

if (error) {
  return <div>Error: {error}</div>;
}

if (loading) {
  return <div>Loading...</div>;
}
```

## 🚀 Performance Optimizations

- **Memoized Computations**: Stats and derived data are memoized
- **Selective Updates**: Only affected data is updated
- **Batch Operations**: Multiple operations are batched where possible
- **Connection Pooling**: Efficient database connection management

## 🔒 Security Features

- **Row Level Security**: All database queries respect RLS policies
- **Company Isolation**: Multi-tenant data isolation
- **User Permissions**: Role-based access control
- **Input Validation**: Type-safe input handling

## 📈 Analytics Integration

Each hook provides computed statistics:

```typescript
const { stats } = useRenewals();

// Access various metrics
console.log(`Total renewals: ${stats.total}`);
console.log(`By stage:`, stats.byStage);
console.log(`Average probability: ${stats.averageProbability}`);
```

## 🛠️ Development

### Adding New Hooks

1. Create a new hook file in the `src/hooks/` directory
2. Follow the established pattern with TypeScript interfaces
3. Include real-time subscriptions and error handling
4. Add to the index file for easy importing
5. Update this README with documentation

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useRenewals } from '@/hooks';

test('useRenewals loads data correctly', async () => {
  const { result } = renderHook(() => useRenewals());
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  
  expect(result.current.renewals).toBeDefined();
});
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

When adding new hooks or modifying existing ones:

1. Maintain TypeScript type safety
2. Include comprehensive error handling
3. Add real-time subscriptions where appropriate
4. Update documentation and examples
5. Follow the established naming conventions
6. Include unit tests for new functionality

---

These hooks provide a solid foundation for building a robust renewal optimization platform with real-time capabilities, type safety, and optimal performance. 