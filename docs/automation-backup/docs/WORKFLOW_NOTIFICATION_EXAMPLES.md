# Workflow Notification Examples

## Overview

This document shows **complete examples** of how to add notifications to workflow configs. These notifications will appear in the reminder button (bell icon) in the app header.

---

## Example 1: Overdue Workflow with Day-Based Escalation Notifications

This example adds notifications to the Overdue workflow that trigger on specific days overdue.

### Adding Notifications to Grace Period Management Step

**Location**: `renewal-configs/10-Overdue.ts` → Step 1: Grace Period Management

**Add this `notifications` array** to the step config:

```typescript
{
  id: 'grace-period-management',
  name: 'Grace Period Management',
  type: 'decision',
  description: 'Track pending items and manage grace period',

  execution: {
    llmPrompt: `...existing prompt...`,
    processor: 'executors/dailyFollowUpExecutor.js',
    storeIn: 'daily_follow_up'
  },

  // ADD THIS: Notifications array
  notifications: [
    // Day 7: Manager FYI
    {
      condition: '{{eq workflow.daysOverdue 7}}',
      type: 'overdue_alert',
      title: '📧 Renewal 1 Week Overdue',
      message: '{{customer.name}} renewal is 1 week overdue. Your manager has been notified for awareness.',
      priority: 3,  // Normal priority
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        workflowStage: 'overdue',
        daysOverdue: 7,
        escalationLevel: 'manager_fyi'
      }
    },

    // Day 8: Manager Involvement
    {
      condition: '{{eq workflow.daysOverdue 8}}',
      type: 'key_task_pending',
      title: '👔 Manager Check-in Required',
      message: 'Schedule weekly check-in with manager to review {{customer.name}} renewal strategy',
      priority: 3,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        daysOverdue: 8,
        requiresManagerCheckIn: true
      }
    },

    // Day 15: VP CS Involvement
    {
      condition: '{{eq workflow.daysOverdue 15}}',
      type: 'escalation_required',
      title: '🚨 VP CS Involvement Required',
      message: '{{customer.name}} (${{customer.arr}}) is 15 days overdue. VP CS has been looped in for strategic guidance.',
      priority: 1,  // Urgent - pulsing red badge
      recipients: ['{{csm.email}}', '{{csm.manager}}', '{{company.vpCustomerSuccess}}'],
      metadata: {
        customerId: '{{customer.id}}',
        daysOverdue: 15,
        arr: '{{customer.arr}}',
        escalationLevel: 'vp_cs'
      }
    },

    // Day 22: Daily Team Sync
    {
      condition: '{{eq workflow.daysOverdue 22}}',
      type: 'task_requires_decision',
      title: '📅 Daily Team Sync Required',
      message: 'Create Slack channel and schedule daily standup for {{customer.name}} renewal completion',
      priority: 2,  // High priority
      recipients: ['{{csm.email}}', '{{csm.manager}}'],
      metadata: {
        customerId: '{{customer.id}}',
        daysOverdue: 22,
        requiresSlackChannel: true,
        slackChannelName: 'overdue-{{customer.slug}}'
      }
    },

    // Day 30: War Room
    {
      condition: '{{eq workflow.daysOverdue 30}}',
      type: 'task_requires_decision',
      title: '⚠️ War Room Activation Required',
      message: '{{customer.name}} is 30 days overdue. Immediate war room activation needed. Legal and Finance must be involved.',
      priority: 1,  // Urgent
      recipients: [
        '{{csm.email}}',
        '{{csm.manager}}',
        '{{company.vpCustomerSuccess}}',
        '{{#if (gte customer.arr 250000)}}{{company.ceo}}{{/if}}'
      ],
      metadata: {
        customerId: '{{customer.id}}',
        daysOverdue: 30,
        requiresWarRoom: true,
        serviceInterruptionRisk: true
      }
    },

    // Strategic Account: Accelerated Escalation (Day 8 instead of 15)
    {
      condition: '{{and (eq workflow.daysOverdue 8) customer.hasAccountPlan}}',
      type: 'escalation_required',
      title: '⭐ Strategic Account Requires Attention',
      message: 'Strategic account {{customer.name}} is 8 days overdue. Account team has been notified per account plan protocol.',
      priority: 1,
      recipients: ['{{csm.email}}', '{{accountTeam.allEmails}}'],
      metadata: {
        customerId: '{{customer.id}}',
        isStrategic: true,
        hasAccountPlan: true,
        daysOverdue: 8,
        accountPlanAcceleration: true
      }
    },

    // Strategic Account: VP CS Involvement (Day 8 instead of 15)
    {
      condition: '{{and (eq workflow.daysOverdue 8) customer.hasAccountPlan}}',
      type: 'escalation_required',
      title: '🚨 Strategic Account - VP CS Involvement',
      message: 'VP CS involvement required for strategic account {{customer.name}} (Day 8 - accelerated timeline)',
      priority: 1,
      recipients: ['{{company.vpCustomerSuccess}}', '{{csm.email}}', '{{csm.manager}}'],
      metadata: {
        customerId: '{{customer.id}}',
        isStrategic: true,
        daysOverdue: 8,
        escalationLevel: 'vp_cs',
        accountPlanAcceleration: true
      }
    }
  ],

  ui: {
    // ... existing UI config ...
  }
}
```

---

## Example 2: Emergency Workflow Manager Acknowledgment

Add notifications for emergency workflow manager acknowledgment gate.

**Location**: `renewal-configs/9-Emergency.ts` → Step 1.5: Mandatory Team Escalation

```typescript
{
  id: 'mandatory-team-escalation',
  name: 'Mandatory Team Escalation',
  type: 'action',
  description: 'Alert team and coordinate emergency response',

  execution: {
    llmPrompt: `...existing prompt...`,
    processor: 'executors/teamEscalationExecutor.js',
    storeIn: 'team_escalation'
  },

  // Notifications for emergency escalation
  notifications: [
    // Manager acknowledgment required (immediate)
    {
      type: 'approval_needed',
      title: 'Manager Acknowledgment Required',
      message: 'Emergency renewal for {{customer.name}} (${{customer.arr}}) requires your immediate acknowledgment. {{workflow.hoursUntilRenewal}} hours remaining until renewal.',
      priority: 1,  // Urgent - pulsing red badge
      recipients: ['{{csm.manager}}'],
      metadata: {
        customerId: '{{customer.id}}',
        workflowStage: 'emergency',
        hoursRemaining: '{{workflow.hoursUntilRenewal}}',
        arr: '{{customer.arr}}',
        requiresAcknowledgment: true,
        csmEmail: '{{csm.email}}',
        csmName: '{{csm.name}}'
      }
    },

    // CSM notification that manager was alerted
    {
      type: 'workflow_started',
      title: 'Emergency Team Escalation Initiated',
      message: 'Your manager has been notified about {{customer.name}} emergency renewal. They must acknowledge before proceeding.',
      priority: 2,  // High
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        managerNotified: true,
        managerEmail: '{{csm.manager}}'
      }
    },

    // High-value renewal: CEO notification
    {
      condition: '{{gte workflow.renewalARR 250000}}',
      type: 'escalation_required',
      title: 'High-Value Emergency Renewal',
      message: 'Emergency: ${{customer.arr}} renewal ({{customer.name}}) has {{workflow.hoursUntilRenewal}} hours remaining. Your visibility is requested.',
      priority: 1,
      recipients: ['{{company.ceo}}', '{{company.vpCustomerSuccess}}'],
      metadata: {
        customerId: '{{customer.id}}',
        arr: '{{customer.arr}}',
        hoursRemaining: '{{workflow.hoursUntilRenewal}}',
        highValue: true
      }
    },

    // Strategic account: Full team notification
    {
      condition: '{{customer.hasAccountPlan}}',
      type: 'escalation_required',
      title: 'Strategic Account Emergency',
      message: 'Strategic account {{customer.name}} in emergency status. Full account team has been alerted.',
      priority: 1,
      recipients: ['{{accountTeam.allEmails}}'],
      metadata: {
        customerId: '{{customer.id}}',
        isStrategic: true,
        hasAccountPlan: true,
        accountTeamNotified: true
      }
    }
  ],

  // Action notifications (sent when action is executed)
  ui: {
    actions: [
      {
        id: 'manager-acknowledge',
        label: 'Acknowledge Emergency (Manager)',
        type: 'primary',
        requiresRole: 'manager',

        onExecute: {
          apiEndpoint: 'POST /api/team-escalations/manager-acknowledge',
          payload: {
            customer_id: '{{customer.id}}',
            workflow_stage: 'emergency',
            manager_email: '{{csm.manager}}',
            acknowledged_at: '{{workflow.currentTimestamp}}'
          },

          // Send notification on successful acknowledgment
          onSuccess: {
            sendNotification: {
              type: 'workflow_started',
              title: 'Manager Acknowledged Emergency',
              message: '{{csm.managerName}} has acknowledged {{customer.name}} emergency renewal. You can now proceed with emergency actions.',
              priority: 2,
              recipients: ['{{csm.email}}', '{{company.vpCustomerSuccess}}'],
              metadata: {
                customerId: '{{customer.id}}',
                acknowledgedBy: '{{csm.managerName}}',
                acknowledgedAt: '{{workflow.currentTimestamp}}',
                managerEmail: '{{csm.manager}}'
              }
            }
          }
        }
      }
    ]
  }
}
```

---

## Example 3: Critical Workflow War Room Creation

Send notification when war room is created.

**Location**: `renewal-configs/8-Critical.ts` → Actions

```typescript
{
  id: 'executive-escalation',
  name: 'Executive Escalation',

  ui: {
    actions: [
      {
        id: 'create-war-room',
        label: 'Create War Room',
        type: 'primary',

        onExecute: {
          apiEndpoint: 'POST /api/war-rooms/create',
          payload: {
            customer_id: '{{customer.id}}',
            workflow_stage: 'critical',
            arr: '{{customer.arr}}'
          },

          // Send notification on war room creation
          onSuccess: {
            sendNotification: {
              type: 'workflow_started',
              title: 'War Room Activated',
              message: 'War room created for {{customer.name}} (${{customer.arr}}) renewal. Daily standups begin tomorrow at 9am.',
              priority: 1,  // Urgent
              recipients: [
                '{{csm.email}}',
                '{{csm.manager}}',
                '{{company.vpCustomerSuccess}}',
                '{{#if customer.hasAccountPlan}}{{accountTeam.allEmails}}{{/if}}'
              ],
              metadata: {
                customerId: '{{customer.id}}',
                warRoomCreatedAt: '{{workflow.currentTimestamp}}',
                warRoomType: 'critical',
                dailyStandupTime: '9am',
                slackChannel: 'critical-{{customer.slug}}'
              }
            }
          }
        }
      },

      {
        id: 'create-team-slack-channel',
        label: 'Create Team Slack Channel',
        type: 'secondary',

        onExecute: {
          apiEndpoint: 'POST /api/collaboration/create-slack-channel',
          payload: {
            customer_id: '{{customer.id}}',
            channel_name: 'critical-{{customer.slug}}',
            members: [
              '{{csm.email}}',
              '{{csm.manager}}',
              '{{company.vpCustomerSuccess}}',
              '{{#if customer.hasAccountPlan}}{{accountTeam.allEmails}}{{/if}}'
            ]
          },

          onSuccess: {
            sendNotification: {
              type: 'workflow_started',
              title: 'Team Slack Channel Created',
              message: 'Slack channel #critical-{{customer.slug}} created for {{customer.name}} renewal. All team members have been added.',
              priority: 3,  // Normal
              recipients: [
                '{{csm.email}}',
                '{{csm.manager}}',
                '{{company.vpCustomerSuccess}}'
              ],
              metadata: {
                customerId: '{{customer.id}}',
                slackChannel: 'critical-{{customer.slug}}',
                channelCreatedAt: '{{workflow.currentTimestamp}}'
              }
            }
          }
        }
      }
    ]
  }
}
```

---

## Example 4: Task Deadline Approaching

Send notification when key task deadline is approaching.

**Location**: Any workflow with time-sensitive tasks

```typescript
{
  id: 'stakeholder-engagement',
  name: 'Stakeholder Engagement',

  notifications: [
    // QBR scheduled tomorrow
    {
      condition: '{{eq workflow.daysUntilQBR 1}}',
      type: 'task_deadline_approaching',
      title: 'QBR Scheduled Tomorrow',
      message: 'Quarterly Business Review with {{customer.name}} is tomorrow at 2pm. Ensure presentation deck is prepared and value metrics are updated.',
      priority: 3,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        eventType: 'qbr',
        daysUntil: 1,
        eventTime: '2pm'
      }
    },

    // No response for 5 days
    {
      condition: '{{eq workflow.daysSinceContact 5}}',
      type: 'key_task_pending',
      title: 'Follow-up Needed: No Response for 5 Days',
      message: 'No response from {{customer.name}} CFO after meeting request. Consider alternative outreach (phone call, text, LinkedIn).',
      priority: 3,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        daysSinceContact: 5,
        lastContactType: 'email',
        contactName: '{{customer.cfoPrimaryContact}}'
      }
    },

    // Contract ends in 48 hours
    {
      condition: '{{eq workflow.hoursUntilRenewal 48}}',
      type: 'task_deadline_approaching',
      title: '⏰ Contract Ends in 48 Hours',
      message: '{{customer.name}} contract ends in 48 hours. Ensure signatures are complete and payment is processed.',
      priority: 1,  // Urgent
      recipients: ['{{csm.email}}', '{{csm.manager}}'],
      metadata: {
        customerId: '{{customer.id}}',
        hoursRemaining: 48,
        criticalDeadline: true
      }
    }
  ]
}
```

---

## Example 5: AI Recommendations

Send notification when AI identifies an opportunity.

**Location**: Workflows with AI analysis

```typescript
{
  id: 'ai-driven-analysis',
  name: 'AI-Driven Renewal Analysis',

  execution: {
    llmPrompt: `Analyze customer usage and identify opportunities...`,
    processor: 'executors/aiAnalysisExecutor.js'
  },

  notifications: [
    // AI recommends price increase
    {
      condition: '{{and outputs.priceIncreaseRecommendation (gte outputs.confidence 0.8)}}',
      type: 'recommendation_available',
      title: 'AI Recommends Price Increase Discussion',
      message: 'Based on {{customer.name}} usage patterns ({{outputs.usageGrowth}}% increase), AI recommends discussing a {{outputs.suggestedIncrease}}% price increase. Confidence: {{outputs.confidence}}',
      priority: 4,  // Low priority (informational)
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        recommendationType: 'pricing',
        suggestedIncrease: '{{outputs.suggestedIncrease}}',
        confidence: '{{outputs.confidence}}',
        usageGrowth: '{{outputs.usageGrowth}}'
      }
    },

    // AI detects upsell opportunity
    {
      condition: '{{outputs.upsellOpportunity}}',
      type: 'recommendation_available',
      title: 'Upsell Opportunity Detected',
      message: '{{customer.name}} is using {{outputs.featureUsage}}% of premium features. Consider upselling to next tier.',
      priority: 4,
      recipients: ['{{csm.email}}'],
      metadata: {
        customerId: '{{customer.id}}',
        recommendationType: 'upsell',
        featureUsage: '{{outputs.featureUsage}}',
        recommendedTier: '{{outputs.recommendedTier}}'
      }
    }
  ]
}
```

---

## Best Practices Summary

### 1. Use Conditions to Control Timing

```typescript
// ✅ GOOD: Only on day 15
condition: '{{eq workflow.daysOverdue 15}}'

// ❌ BAD: Sends every day (spam)
// No condition
```

### 2. Set Appropriate Priorities

```typescript
priority: 1  // Urgent: Manager ack, CEO notification, war room (pulsing red)
priority: 2  // High: Important escalations, deadlines
priority: 3  // Normal: Routine tasks, reminders
priority: 4  // Low: AI recommendations, nice-to-know
priority: 5  // Very low: Informational only
```

### 3. Include Rich Metadata

```typescript
metadata: {
  customerId: '{{customer.id}}',           // For navigation
  workflowStage: '{{workflow.currentStage}}',
  daysOverdue: '{{workflow.daysOverdue}}',
  arr: '{{customer.arr}}',
  escalationLevel: 'vp_cs',
  requiresAcknowledgment: true
}
```

### 4. Use Clear, Actionable Titles

```typescript
// ✅ GOOD
title: 'Manager Acknowledgment Required - 36 Hours Remaining'

// ❌ BAD
title: 'Renewal Update'
```

### 5. Conditional Recipients

```typescript
recipients: [
  '{{csm.email}}',
  '{{csm.manager}}',
  '{{#if (gte customer.arr 250000)}}{{company.ceo}}{{/if}}'
]
```

---

## Integration Testing

After adding notifications, test with:

1. **Manual Database Insert**:
   ```sql
   INSERT INTO notifications (user_id, type, title, message, priority)
   VALUES ('your-user-id', 'overdue_alert', 'Test', 'Testing notifications', 1);
   ```

2. **Trigger Workflow** with test customer

3. **Check Bell Icon** - should show badge count

4. **Click Notification** - should navigate to customer

5. **Mark as Read** - badge count should decrease

---

## Summary

**Notifications are flexible alerts** that:
- Can be added to ANY workflow step
- Use template variables for dynamic content
- Support conditional sending
- Are separate from business logic (escalations)
- Appear in the bell icon reminder button
- Support rich metadata for navigation

Add `notifications` arrays to your workflow steps following these examples!
