/**
 * Action Plan Generator
 *
 * Generates comprehensive action plans at the end of renewal workflows.
 * Creates AI tasks (auto-executable) and CSM tasks (human-required).
 * Supports sub-tasks for complex CSM tasks.
 * Schedules next workflow trigger.
 *
 * Usage: Called automatically by Action Plan workflow step
 */

const { generateLLMResponse } = require('../services/llmService');
const { createTask, createNotification } = require('../services/database');
const { scheduleWorkflow } = require('../services/workflowScheduler');

/**
 * Main action plan generation function
 *
 * @param {Object} context - Workflow execution context
 * @param {Object} context.workflowExecution - Current workflow execution
 * @param {Object} context.customer - Customer data
 * @param {Array} context.previousSteps - All previous workflow steps with outputs
 * @param {Object} context.llmPrompt - LLM prompt from step config
 * @returns {Object} Generated action plan
 */
async function generateActionPlan(context) {
  const { workflowExecution, customer, previousSteps, llmPrompt } = context;

  console.log(`\n🔧 Generating Action Plan for ${customer.name}...`);
  console.log(`   Workflow: ${workflowExecution.workflow_name} (${workflowExecution.stage})`);
  console.log(`   Steps Analyzed: ${previousSteps.length}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Generate Action Plan via LLM
  // ─────────────────────────────────────────────────────────────────────────

  console.log(`\n📊 Analyzing workflow outputs...`);

  const actionPlanJson = await generateLLMResponse({
    prompt: llmPrompt,
    context: {
      customer,
      workflow: workflowExecution,
      previousSteps
    },
    outputFormat: 'json',
    temperature: 0.3, // Lower temperature for structured output
    maxTokens: 4000
  });

  const actionPlan = JSON.parse(actionPlanJson);

  console.log(`\n✅ Action Plan Generated:`);
  console.log(`   - Completed Steps: ${actionPlan.summary.completedSteps.length}`);
  console.log(`   - AI Tasks: ${actionPlan.aiTasks.length}`);
  console.log(`   - CSM Tasks: ${actionPlan.csmTasks.length}`);
  console.log(`   - Timeline Events: ${actionPlan.timeline.length}`);
  console.log(`   - Next Workflow: ${actionPlan.nextWorkflow?.name || 'None'}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Create AI Tasks (Auto-Executable)
  // ─────────────────────────────────────────────────────────────────────────

  console.log(`\n🤖 Creating AI Tasks...`);

  const createdAITasks = [];

  for (const [index, aiTask] of actionPlan.aiTasks.entries()) {
    console.log(`   [${index + 1}/${actionPlan.aiTasks.length}] ${aiTask.action}`);

    try {
      const task = await createTask({
        workflow_execution_id: workflowExecution.id,
        customer_id: customer.id,
        task_type: 'AI_TASK',
        owner: 'AI',
        action: aiTask.action,
        description: aiTask.description,
        priority: aiTask.priority,
        status: 'pending',

        // Auto-execution fields
        auto_execute: true,
        processor: aiTask.processor,
        execution_status: 'queued',
        estimated_completion_time: aiTask.estimatedTime,

        // Metadata
        metadata: {
          executeImmediately: aiTask.executeImmediately || false,
          generatedBy: 'action-plan-generator',
          actionPlanContext: {
            workflow: workflowExecution.workflow_name,
            stage: workflowExecution.stage,
            generatedAt: new Date().toISOString()
          },
          ...aiTask.metadata
        },

        original_workflow_execution_id: workflowExecution.id
      });

      createdAITasks.push(task);

      // Queue for immediate execution if specified
      if (aiTask.executeImmediately) {
        console.log(`      ⚡ Queued for immediate execution`);
        // In production, this would add to execution queue
        // await taskExecutionQueue.add(task.id);
      }
    } catch (error) {
      console.error(`      ❌ Failed to create AI task: ${error.message}`);
      // Continue creating other tasks even if one fails
    }
  }

  console.log(`   ✅ Created ${createdAITasks.length} AI tasks`);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Create CSM Tasks (with Sub-Task Support)
  // ─────────────────────────────────────────────────────────────────────────

  console.log(`\n👤 Creating CSM Tasks...`);

  const createdCSMTasks = [];

  for (const [index, csmTask] of actionPlan.csmTasks.entries()) {
    console.log(`   [${index + 1}/${actionPlan.csmTasks.length}] ${csmTask.action}`);

    try {
      // Check if complex task with sub-tasks
      if (csmTask.complexity === 'complex' && csmTask.subTasks && csmTask.subTasks.length > 0) {
        console.log(`      📋 Complex task with ${csmTask.subTasks.length} sub-tasks`);

        // Create parent task
        const parentTask = await createTask({
          workflow_execution_id: workflowExecution.id,
          customer_id: customer.id,
          task_type: 'CSM_TASK',
          owner: 'CSM',
          action: csmTask.action,
          description: csmTask.description,
          priority: csmTask.priority,
          status: 'pending',
          complexity: 'complex',
          estimated_completion_time: csmTask.estimatedTime,
          metadata: {
            hasSubTasks: true,
            subTaskCount: csmTask.subTasks.length,
            dueDate: csmTask.dueDate,
            generatedBy: 'action-plan-generator'
          },
          original_workflow_execution_id: workflowExecution.id
        });

        createdCSMTasks.push(parentTask);

        // Create sub-tasks
        for (const [subIndex, subTask] of csmTask.subTasks.entries()) {
          console.log(`         ${subIndex + 1}. ${subTask.action}`);

          await createTask({
            workflow_execution_id: workflowExecution.id,
            customer_id: customer.id,
            task_type: 'CSM_TASK',
            owner: 'CSM',
            parent_task_id: parentTask.id,
            action: subTask.action,
            description: subTask.description || subTask.action,
            priority: csmTask.priority, // Inherit parent priority
            status: 'pending',
            complexity: 'simple',
            estimated_completion_time: subTask.estimatedTime,
            metadata: {
              parentTaskAction: csmTask.action,
              subTaskIndex: subIndex + 1,
              generatedBy: 'action-plan-generator'
            },
            original_workflow_execution_id: workflowExecution.id
          });
        }
      } else {
        // Simple or moderate task (no sub-tasks)
        const task = await createTask({
          workflow_execution_id: workflowExecution.id,
          customer_id: customer.id,
          task_type: 'CSM_TASK',
          owner: 'CSM',
          action: csmTask.action,
          description: csmTask.description,
          priority: csmTask.priority,
          status: 'pending',
          complexity: csmTask.complexity || 'simple',
          estimated_completion_time: csmTask.estimatedTime,
          metadata: {
            dueDate: csmTask.dueDate,
            generatedBy: 'action-plan-generator'
          },
          original_workflow_execution_id: workflowExecution.id
        });

        createdCSMTasks.push(task);
      }
    } catch (error) {
      console.error(`      ❌ Failed to create CSM task: ${error.message}`);
    }
  }

  console.log(`   ✅ Created ${createdCSMTasks.length} CSM tasks`);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Create Notification for CSM
  // ─────────────────────────────────────────────────────────────────────────

  console.log(`\n🔔 Creating notification...`);

  const totalTasks = createdAITasks.length + createdCSMTasks.length;

  await createNotification({
    user_id: customer.assigned_csm_id || 'system',
    workflow_execution_id: workflowExecution.id,
    type: 'action_plan_created',
    title: 'Action Plan Ready',
    message: `Action plan for ${customer.name} created: ${createdCSMTasks.length} tasks for you, ${createdAITasks.length} automated tasks.`,
    priority: 2,
    metadata: {
      customerId: customer.id,
      customerName: customer.name,
      workflowName: workflowExecution.workflow_name,
      workflowStage: workflowExecution.stage,
      aiTaskCount: createdAITasks.length,
      csmTaskCount: createdCSMTasks.length,
      totalTaskCount: totalTasks
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Schedule Next Workflow (if applicable)
  // ─────────────────────────────────────────────────────────────────────────

  let nextWorkflowScheduled = false;

  if (actionPlan.nextWorkflow && actionPlan.nextWorkflow.name) {
    console.log(`\n📅 Scheduling next workflow...`);
    console.log(`   Next: ${actionPlan.nextWorkflow.name} (${actionPlan.nextWorkflow.stage})`);
    console.log(`   Trigger Date: ${actionPlan.nextWorkflow.estimatedDate}`);
    console.log(`   Conditions: ${actionPlan.nextWorkflow.conditions.join(', ')}`);

    try {
      await scheduleWorkflow({
        customer_id: customer.id,
        workflow_type: 'renewal',
        workflow_stage: actionPlan.nextWorkflow.stage,
        trigger_date: new Date(actionPlan.nextWorkflow.estimatedDate),
        conditions: actionPlan.nextWorkflow.conditions,
        metadata: {
          previous_workflow_id: workflowExecution.id,
          scheduled_by: 'action-plan-generator',
          days_from_renewal: actionPlan.nextWorkflow.daysFromNow
        }
      });

      nextWorkflowScheduled = true;
      console.log(`   ✅ Next workflow scheduled`);
    } catch (error) {
      console.error(`   ❌ Failed to schedule next workflow: ${error.message}`);
    }
  } else {
    console.log(`\n📅 No next workflow to schedule (final stage or conditional trigger)`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Return Results
  // ─────────────────────────────────────────────────────────────────────────

  const result = {
    success: true,
    actionPlan,
    tasksCreated: {
      ai: createdAITasks.length,
      csm: createdCSMTasks.length,
      total: totalTasks
    },
    nextWorkflowScheduled,
    metadata: {
      generatedAt: new Date().toISOString(),
      workflowId: workflowExecution.id,
      customerId: customer.id
    }
  };

  console.log(`\n✅ Action Plan Generation Complete`);
  console.log(`   Total Tasks Created: ${totalTasks}`);
  console.log(`   Next Workflow Scheduled: ${nextWorkflowScheduled ? 'Yes' : 'No'}`);

  return result;
}

/**
 * Helper: Calculate next workflow trigger date
 *
 * @param {Object} customer - Customer data
 * @param {string} currentStage - Current workflow stage
 * @returns {Date|null} Next workflow trigger date
 */
function calculateNextWorkflowDate(customer, currentStage) {
  const { daysUntilRenewal } = customer;

  // Renewal stage boundaries
  const stages = {
    Monitor: { min: 180, max: Infinity },
    Discovery: { min: 150, max: 179 },
    Prepare: { min: 120, max: 149 },
    Engage: { min: 90, max: 119 },
    Negotiate: { min: 60, max: 89 },
    Finalize: { min: 30, max: 59 },
    Signature: { min: 15, max: 29 },
    Critical: { min: 7, max: 14 },
    Emergency: { min: 0, max: 6 },
    Overdue: { min: -Infinity, max: -1 }
  };

  const stageOrder = [
    'Monitor',
    'Discovery',
    'Prepare',
    'Engage',
    'Negotiate',
    'Finalize',
    'Signature',
    'Critical',
    'Emergency',
    'Overdue'
  ];

  // Find next stage
  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null; // Unknown stage or final stage
  }

  const nextStage = stageOrder[currentIndex + 1];
  const nextStageBounds = stages[nextStage];

  // Calculate trigger at midpoint of next stage
  const targetDays = Math.floor((nextStageBounds.min + nextStageBounds.max) / 2);

  // Calculate date
  const renewalDate = new Date(customer.renewalDate);
  const triggerDate = new Date(renewalDate);
  triggerDate.setDate(triggerDate.getDate() - targetDays);

  return triggerDate;
}

/**
 * Helper: Determine next workflow stage
 *
 * @param {string} currentStage - Current workflow stage
 * @returns {string|null} Next stage name
 */
function getNextWorkflowStage(currentStage) {
  const stageOrder = [
    'Monitor',
    'Discovery',
    'Prepare',
    'Engage',
    'Negotiate',
    'Finalize',
    'Signature',
    'Critical',
    'Emergency',
    'Overdue'
  ];

  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
    return null;
  }

  return stageOrder[currentIndex + 1];
}

module.exports = {
  generateActionPlan,
  calculateNextWorkflowDate,
  getNextWorkflowStage
};
