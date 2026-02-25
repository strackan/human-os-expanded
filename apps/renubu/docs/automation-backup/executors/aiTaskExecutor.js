/**
 * AI Task Executor
 *
 * Background service that executes queued AI tasks.
 * Runs as a cron job (every 5 minutes) or on-demand.
 * Loads and executes processor scripts for each task.
 * Handles errors, retries, and notifications.
 *
 * Usage:
 * - Cron: node executors/aiTaskExecutor.js
 * - On-demand: const executor = new AITaskExecutor(); await executor.executePendingTasks();
 */

const path = require('path');
const fs = require('fs');
const {
  getQueuedTasks,
  updateTaskStatus,
  createNotification,
  getCustomer,
  getWorkflowExecution
} = require('../services/database');

class AITaskExecutor {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5 * 60 * 1000; // 5 minutes
    this.processorsPath = options.processorsPath || path.join(__dirname, '../processors');
    this.batchSize = options.batchSize || 10; // Process 10 tasks at a time
  }

  /**
   * Execute all pending AI tasks in the queue
   */
  async executePendingTasks() {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('🤖 AI TASK EXECUTOR - Starting Execution Cycle');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Time: ${new Date().toISOString()}`);

    try {
      // Fetch queued tasks
      const tasks = await this.fetchQueuedTasks();

      if (tasks.length === 0) {
        console.log('\n✅ No tasks in queue. Exiting.');
        return { executed: 0, succeeded: 0, failed: 0 };
      }

      console.log(`\n📊 Found ${tasks.length} queued AI tasks`);

      // Execute tasks in batches
      let executed = 0;
      let succeeded = 0;
      let failed = 0;

      for (let i = 0; i < tasks.length; i += this.batchSize) {
        const batch = tasks.slice(i, i + this.batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(tasks.length / this.batchSize)}`);

        const results = await Promise.allSettled(
          batch.map(task => this.executeTask(task))
        );

        results.forEach(result => {
          executed++;
          if (result.status === 'fulfilled' && result.value) {
            succeeded++;
          } else {
            failed++;
          }
        });
      }

      console.log('\n═══════════════════════════════════════════════════════════════════');
      console.log('📊 EXECUTION SUMMARY');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(`Total Executed: ${executed}`);
      console.log(`✅ Succeeded: ${succeeded}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`⏱️  Duration: ${new Date().toISOString()}`);

      return { executed, succeeded, failed };

    } catch (error) {
      console.error(`\n❌ Fatal error in execution cycle: ${error.message}`);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Fetch queued AI tasks from database
   */
  async fetchQueuedTasks() {
    return await getQueuedTasks({
      auto_execute: true,
      execution_status: 'queued',
      status: 'pending',
      orderBy: [
        { field: 'priority', direction: 'ASC' },
        { field: 'created_at', direction: 'ASC' }
      ],
      limit: 100 // Max 100 tasks per cycle
    });
  }

  /**
   * Execute a single AI task
   *
   * @param {Object} task - Task object from database
   * @returns {boolean} Success status
   */
  async executeTask(task) {
    console.log(`\n──────────────────────────────────────────────────────────────────`);
    console.log(`⚡ Executing Task: ${task.action}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Processor: ${task.processor}`);
    console.log(`   Customer: ${task.customer_id}`);

    try {
      // Update status to 'running'
      await updateTaskStatus(task.id, {
        execution_status: 'running',
        metadata: {
          ...task.metadata,
          executionStartedAt: new Date().toISOString()
        }
      });

      // Load customer and workflow context
      const customer = await getCustomer(task.customer_id);
      const workflow = await getWorkflowExecution(task.workflow_execution_id);

      console.log(`   Context: ${customer.name} - ${workflow.workflow_name}`);

      // Load processor
      const processor = await this.loadProcessor(task.processor);

      if (!processor || typeof processor.execute !== 'function') {
        throw new Error(`Invalid processor: ${task.processor} (missing execute function)`);
      }

      // Execute processor
      console.log(`   🔄 Running processor...`);
      const startTime = Date.now();

      const result = await processor.execute({
        task,
        customer,
        workflow
      });

      const duration = Date.now() - startTime;

      // Validate result
      if (!result || typeof result.success === 'undefined') {
        throw new Error('Processor must return { success: boolean, ... }');
      }

      if (!result.success) {
        throw new Error(result.error || 'Processor returned success: false');
      }

      console.log(`   ✅ Success (${duration}ms)`);
      if (result.message) {
        console.log(`   📝 ${result.message}`);
      }

      // Mark task as completed
      await updateTaskStatus(task.id, {
        status: 'completed',
        execution_status: 'success',
        executed_at: new Date(),
        completed_at: new Date(),
        execution_result: {
          success: true,
          duration,
          ...result
        },
        metadata: {
          ...task.metadata,
          executionCompletedAt: new Date().toISOString(),
          executionDuration: duration
        }
      });

      // Create success notification (optional, based on task priority)
      if (task.priority <= 2) {
        await createNotification({
          user_id: workflow.assigned_csm_id || 'system',
          task_id: task.id,
          type: 'ai_task_completed',
          title: 'AI Task Completed',
          message: `${task.action} completed successfully`,
          priority: 3,
          metadata: {
            taskAction: task.action,
            customerId: customer.id,
            customerName: customer.name,
            duration
          }
        });
      }

      return true;

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);

      const retryCount = (task.metadata?.retryCount || 0) + 1;
      const shouldRetry = retryCount < this.maxRetries;

      // Mark task as failed
      await updateTaskStatus(task.id, {
        execution_status: 'failed',
        execution_result: {
          success: false,
          error: error.message,
          errorStack: error.stack,
          retryable: shouldRetry,
          failedAt: new Date().toISOString()
        },
        metadata: {
          ...task.metadata,
          retryCount,
          lastErrorAt: new Date().toISOString()
        }
      });

      // Retry logic
      if (shouldRetry) {
        console.log(`   🔄 Will retry (attempt ${retryCount}/${this.maxRetries})`);

        // Re-queue task for retry
        await updateTaskStatus(task.id, {
          execution_status: 'queued',
          metadata: {
            ...task.metadata,
            retryCount,
            nextRetryAt: new Date(Date.now() + this.retryDelay).toISOString()
          }
        });
      } else {
        console.log(`   ⛔ Max retries reached. Marking as permanently failed.`);

        // Create failure notification
        await createNotification({
          user_id: 'system', // Notify admin/CSM
          task_id: task.id,
          type: 'ai_task_failed',
          title: 'AI Task Failed',
          message: `${task.action} failed after ${retryCount} attempts: ${error.message}`,
          priority: 1, // High priority for failures
          metadata: {
            taskAction: task.action,
            error: error.message,
            retryCount,
            customerId: task.customer_id
          }
        });
      }

      return false;
    }
  }

  /**
   * Load processor module
   *
   * @param {string} processorName - Processor filename (e.g., 'salesforce-contact-updater.js')
   * @returns {Object} Processor module with execute function
   */
  async loadProcessor(processorName) {
    const processorPath = path.join(this.processorsPath, processorName);

    // Check if processor file exists
    if (!fs.existsSync(processorPath)) {
      throw new Error(`Processor not found: ${processorPath}`);
    }

    // Load processor module
    try {
      // Clear require cache to ensure latest version
      delete require.cache[require.resolve(processorPath)];

      const processor = require(processorPath);
      return processor;
    } catch (error) {
      throw new Error(`Failed to load processor ${processorName}: ${error.message}`);
    }
  }

  /**
   * Execute a single task by ID (for manual/on-demand execution)
   *
   * @param {string} taskId - Task ID
   * @returns {boolean} Success status
   */
  async executeTaskById(taskId) {
    const task = await getTaskById(taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (!task.auto_execute) {
      throw new Error(`Task ${taskId} is not auto-executable`);
    }

    return await this.executeTask(task);
  }
}

/**
 * Cron job entry point
 *
 * Run this script via cron: */5 * * * * node executors/aiTaskExecutor.js
 */
async function main() {
  const executor = new AITaskExecutor();

  try {
    await executor.executePendingTasks();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// If run directly (not imported), execute main
if (require.main === module) {
  main();
}

module.exports = AITaskExecutor;
