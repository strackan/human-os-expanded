/**
 * Checkpoint 3 Demo
 *
 * Quick demonstration of the recommendation and task system built so far.
 * Run with: node demo-checkpoint-3.js
 */

// Mock the TypeScript imports for demo purposes
const MOCK_RECOMMENDATIONS = {
  'monitor': [
    {
      id: 'rec_analytics_adoption',
      workflowId: 'monitor-renewal',
      customerId: 'customer_acme',
      category: 'FEATURE_ADOPTION',
      subcategory: 'underutilized_feature',
      title: 'Highlight Advanced Analytics Module',
      description: 'Customer is paying for Advanced Analytics but only using basic reporting features.',
      rationale: 'Usage data shows the team spends 12 hours per month creating manual reports. Advanced Analytics could automate 80% of this work.',
      dataPoints: [
        {
          label: 'Manual Reporting Time',
          value: '12 hrs/month',
          context: 'Time spent on manual report creation',
          source: 'data.usage.reportingTime'
        },
        {
          label: 'Advanced Analytics Adoption',
          value: '5%',
          context: 'Only basic features being used',
          source: 'data.usage.featureAdoption.advancedAnalytics'
        },
        {
          label: 'Potential Time Savings',
          value: '10 hrs/month',
          context: 'Based on similar customer usage patterns',
          source: 'intelligence.benchmarks.timeSavings'
        }
      ],
      priorityScore: 75,
      impact: 'high',
      urgency: 'medium',
      suggestedActions: ['send_email', 'schedule_meeting', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    },
    {
      id: 'rec_ceo_promotion',
      workflowId: 'monitor-renewal',
      customerId: 'customer_acme',
      category: 'EXECUTIVE_ENGAGEMENT',
      subcategory: 'personal_touchpoint',
      title: 'Congratulate CEO on Recent Promotion',
      description: 'CEO was recently promoted to Chief Operating Officer.',
      rationale: 'Personal congratulations can strengthen relationship before renewal discussions begin.',
      dataPoints: [
        {
          label: 'Promotion Date',
          value: '2 weeks ago',
          context: 'Recent change in leadership',
          source: 'data.engagement.linkedinUpdates'
        },
        {
          label: 'Last Executive Contact',
          value: '45 days ago',
          context: 'Overdue for executive touch-base',
          source: 'data.engagement.lastExecutiveContact'
        }
      ],
      priorityScore: 55,
      impact: 'medium',
      urgency: 'low',
      suggestedActions: ['send_email', 'skip', 'snooze'],
      createdAt: new Date(),
      status: 'pending'
    }
  ]
};

// Mock task examples
function createMockTasks() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const deadline = new Date(fiveDaysAgo);
  deadline.setDate(deadline.getDate() + 7);

  return [
    {
      id: 'task_1',
      workflowExecutionId: 'workflow_monitor_123',
      stepExecutionId: 'step_2',
      customerId: 'customer_acme',
      taskType: 'AI_TASK',
      owner: 'AI',
      action: 'send_email',
      description: 'Draft email about Advanced Analytics',
      recommendationId: 'rec_analytics_adoption',
      status: 'pending',
      snoozeCount: 0,
      priority: 2,
      metadata: {},
      createdAt: new Date(),
      requiresDecision: false,
      updatedAt: new Date()
    },
    {
      id: 'task_2',
      workflowExecutionId: 'workflow_monitor_123',
      stepExecutionId: 'step_2',
      customerId: 'customer_acme',
      taskType: 'CSM_TASK',
      owner: 'CSM',
      action: 'update_crm',
      description: 'Update CRM with usage growth data',
      status: 'snoozed',
      snoozedUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      snoozeCount: 1,
      firstSnoozedAt: fiveDaysAgo,
      snoozeDeadline: deadline,
      priority: 3,
      metadata: {},
      createdAt: fiveDaysAgo,
      requiresDecision: false,
      updatedAt: new Date()
    },
    {
      id: 'task_3',
      workflowExecutionId: 'workflow_prepare_456',
      stepExecutionId: 'step_1',
      customerId: 'customer_acme',
      taskType: 'AI_TASK',
      owner: 'AI',
      action: 'send_email',
      description: 'Send renewal kickoff email',
      status: 'snoozed',
      snoozedUntil: now,
      snoozeCount: 3,
      firstSnoozedAt: sevenDaysAgo,
      snoozeDeadline: now, // Deadline reached!
      priority: 1,
      metadata: {},
      createdAt: sevenDaysAgo,
      requiresDecision: true, // Force decision!
      updatedAt: new Date()
    }
  ];
}

// Helper: Calculate snooze eligibility
function calculateSnoozeEligibility(task) {
  const now = new Date();

  if (task.requiresDecision) {
    return {
      canSnooze: false,
      reason: 'Task has reached 7-day snooze limit and requires decision',
      deadlineReached: true,
      requiresDecision: true
    };
  }

  if (task.snoozeDeadline) {
    const deadline = new Date(task.snoozeDeadline);
    const msRemaining = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return {
        canSnooze: false,
        reason: 'Task has reached 7-day snooze limit',
        daysRemaining: 0,
        deadlineReached: true,
        requiresDecision: true
      };
    }

    return {
      canSnooze: true,
      daysRemaining: daysRemaining,
      deadlineReached: false,
      requiresDecision: false
    };
  }

  return {
    canSnooze: true,
    deadlineReached: false,
    requiresDecision: false
  };
}

// Helper: Get task statistics
function getTaskStatistics(tasks) {
  return {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    snoozedTasks: tasks.filter(t => t.status === 'snoozed').length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    skippedTasks: tasks.filter(t => t.status === 'skipped').length,
    tasksRequiringDecision: tasks.filter(t => t.requiresDecision).length
  };
}

// Helper: Sort tasks by priority
function sortTasksByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.requiresDecision !== b.requiresDecision) {
      return a.requiresDecision ? -1 : 1;
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

// Display functions
function displayBanner(text) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${text}`);
  console.log('='.repeat(70) + '\n');
}

function displayRecommendation(rec, index) {
  console.log(`${index + 1}. [${rec.category}] ${rec.title}`);
  console.log(`   Priority Score: ${rec.priorityScore} | Impact: ${rec.impact} | Urgency: ${rec.urgency}`);
  console.log(`   ${rec.description}`);
  console.log(`\n   WHY THIS MATTERS:`);
  console.log(`   ${rec.rationale}`);
  console.log(`\n   SUPPORTING DATA:`);
  rec.dataPoints.forEach(dp => {
    console.log(`   • ${dp.label}: ${dp.value}`);
    console.log(`     ${dp.context}`);
  });
  console.log(`\n   SUGGESTED ACTIONS: ${rec.suggestedActions.join(', ')}`);
  console.log('');
}

function displayTask(task, index) {
  const statusIcon = {
    'pending': '⭕',
    'in_progress': '🔄',
    'completed': '✅',
    'snoozed': '💤',
    'skipped': '⏭️'
  }[task.status] || '❓';

  const priorityLabel = ['', '🔴 URGENT', '🟠 HIGH', '🟡 MEDIUM', '🟢 LOW', '⚪ LOWEST'][task.priority];

  console.log(`${index + 1}. ${statusIcon} ${task.description}`);
  console.log(`   Status: ${task.status} | Priority: ${priorityLabel} | Owner: ${task.owner}`);
  console.log(`   Action: ${task.action}`);

  if (task.requiresDecision) {
    console.log(`   ⚠️  REQUIRES DECISION - 7-day snooze limit reached!`);
  }

  if (task.status === 'snoozed') {
    const eligibility = calculateSnoozeEligibility(task);
    console.log(`   Snooze count: ${task.snoozeCount}`);
    console.log(`   Days until deadline: ${eligibility.daysRemaining || 0}`);
    console.log(`   Can snooze again: ${eligibility.canSnooze ? 'Yes' : 'No'}`);
  }

  console.log('');
}

// Main demo
function runDemo() {
  displayBanner('CHECKPOINT 3 DEMO: Recommendation & Task System');

  console.log('This demo shows:');
  console.log('1. Mock recommendations for Monitor workflow');
  console.log('2. Sample tasks with snooze tracking');
  console.log('3. Snooze eligibility calculations');
  console.log('4. Task prioritization and statistics\n');

  // Section 1: Mock Recommendations
  displayBanner('SECTION 1: Mock Recommendations (Monitor Workflow)');

  const monitorRecs = MOCK_RECOMMENDATIONS['monitor'];
  console.log(`Found ${monitorRecs.length} recommendations for Monitor workflow (180+ days):\n`);

  monitorRecs.forEach((rec, idx) => displayRecommendation(rec, idx));

  // Section 2: Sample Tasks
  displayBanner('SECTION 2: Sample Tasks');

  const tasks = createMockTasks();
  console.log(`Created ${tasks.length} sample tasks:\n`);

  tasks.forEach((task, idx) => displayTask(task, idx));

  // Section 3: Snooze Eligibility
  displayBanner('SECTION 3: Snooze Eligibility Analysis');

  tasks.forEach((task, idx) => {
    const eligibility = calculateSnoozeEligibility(task);
    console.log(`Task ${idx + 1}: ${task.description}`);
    console.log(`  Can snooze: ${eligibility.canSnooze ? '✅ Yes' : '❌ No'}`);
    if (eligibility.daysRemaining !== undefined) {
      console.log(`  Days remaining: ${eligibility.daysRemaining}`);
    }
    if (eligibility.requiresDecision) {
      console.log(`  ⚠️  FORCED DECISION REQUIRED`);
    }
    if (eligibility.reason) {
      console.log(`  Reason: ${eligibility.reason}`);
    }
    console.log('');
  });

  // Section 4: Task Statistics
  displayBanner('SECTION 4: Task Statistics');

  const stats = getTaskStatistics(tasks);
  console.log('Task Counts:');
  console.log(`  Total Tasks: ${stats.totalTasks}`);
  console.log(`  Pending: ${stats.pendingTasks}`);
  console.log(`  Snoozed: ${stats.snoozedTasks}`);
  console.log(`  Completed: ${stats.completedTasks}`);
  console.log(`  Skipped: ${stats.skippedTasks}`);
  console.log(`  ⚠️  Requiring Decision: ${stats.tasksRequiringDecision}`);
  console.log('');

  // Section 5: Priority Sorting
  displayBanner('SECTION 5: Tasks Sorted by Priority');

  const sortedTasks = sortTasksByPriority(tasks);
  console.log('Tasks ordered by: 1) Requires Decision, 2) Priority, 3) Created Date\n');

  sortedTasks.forEach((task, idx) => {
    const badge = task.requiresDecision ? '🚨' : '';
    console.log(`${idx + 1}. ${badge} ${task.description} (Priority ${task.priority})`);
  });
  console.log('');

  // Section 6: Workflow Integration Preview
  displayBanner('SECTION 6: How This Works in a Workflow');

  console.log('Step-by-step workflow execution:');
  console.log('');
  console.log('1. WORKFLOW STARTS (Monitor, 180+ days out)');
  console.log('   └─ System checks: Does customer have pending tasks?');
  console.log('   └─ Found: 1 task requiring decision (from previous workflow)');
  console.log('   └─ Show: Step 0 - "Open Tasks from Previous Workflows"');
  console.log('');
  console.log('2. CSM SEES FORCED DECISION MODAL');
  console.log('   ┌─────────────────────────────────────────┐');
  console.log('   │ ⏰ Task Requires Decision               │');
  console.log('   ├─────────────────────────────────────────┤');
  console.log('   │ This task has been snoozed for 7 days. │');
  console.log('   │ You must take action or skip it.       │');
  console.log('   │                                         │');
  console.log('   │ Task: "Send renewal kickoff email"     │');
  console.log('   │                                         │');
  console.log('   │ [Send Email Now] [Skip Forever]        │');
  console.log('   │                                         │');
  console.log('   │ ❌ Cannot close without choosing        │');
  console.log('   └─────────────────────────────────────────┘');
  console.log('');
  console.log('3. CSM TAKES ACTION');
  console.log('   └─ Option A: Clicks "Send Email" → Task completes');
  console.log('   └─ Option B: Clicks "Skip" → Task marked as skipped');
  console.log('   └─ Option C: Closes modal → Auto-skip (per requirement)');
  console.log('');
  console.log('4. WORKFLOW CONTINUES');
  console.log('   └─ Step 1: Health Check Review');
  console.log('   └─ Step 2: Review Recommendations');
  console.log('        └─ Shows 2 new recommendations');
  console.log('        └─ CSM can: Send Email, Schedule Meeting, Skip, or Snooze');
  console.log('');
  console.log('5. CSM SNOOZES A RECOMMENDATION');
  console.log('   └─ Recommendation → Creates Task');
  console.log('   └─ Task snoozed for 1 week');
  console.log('   └─ firstSnoozedAt = NOW(), snoozeDeadline = NOW() + 7 days');
  console.log('   └─ Workflow continues, completes with "completed_with_pending_tasks"');
  console.log('');
  console.log('6. DAILY CRON EVALUATES (7 days later)');
  console.log('   └─ Finds task with snoozeDeadline <= NOW()');
  console.log('   └─ Sets requiresDecision = true');
  console.log('   └─ Creates notification: "High-priority task requires attention"');
  console.log('   └─ Task resurfaces in next workflow or daily queue');
  console.log('');

  displayBanner('DEMO COMPLETE');

  console.log('✅ Checkpoint 3 Foundation is Complete:');
  console.log('   • Mock recommendations system');
  console.log('   • Task type definitions');
  console.log('   • Snooze eligibility logic');
  console.log('   • 7-day limit with forced decision');
  console.log('   • Task prioritization and statistics');
  console.log('');
  console.log('🚧 Still to Build:');
  console.log('   • React components (RecommendationCard, TaskList, etc.)');
  console.log('   • Hooks (useTaskSnooze, useNotifications)');
  console.log('   • Backend APIs (task CRUD, notifications, cron)');
  console.log('');
  console.log('📋 Next: Review architecture with backend engineer');
  console.log('');
}

// Run the demo
runDemo();
