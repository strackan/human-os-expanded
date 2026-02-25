/**
 * Workflow Executor
 *
 * Main workflow execution engine that processes workflow steps and integrates with:
 * - Notification processor (for alerts)
 * - LLM execution (for AI-driven steps)
 * - Action handlers (for user actions)
 *
 * This file shows how to wire notifications into workflow execution.
 */

const { processNotifications, processActionNotification } = require('./notificationProcessor');
const db = require('../database/db');

/**
 * Build workflow context from customer and workflow data
 *
 * This context is passed to notification processor for template resolution
 */
async function buildWorkflowContext(customer, workflowExecution) {
  // Calculate workflow state
  const renewalDate = new Date(customer.renewal_date);
  const today = new Date();
  const daysUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
  const hoursUntilRenewal = Math.ceil((renewalDate - today) / (1000 * 60 * 60));

  // Fetch CSM details
  const csmResult = await db.query(`
    SELECT
      u.id, u.email, u.name, u.title,
      m.email as manager_email,
      m.name as manager_name,
      m.title as manager_title
    FROM users u
    LEFT JOIN users m ON u.manager_id = m.id
    WHERE u.id = $1
  `, [customer.csm_id]);

  const csm = csmResult.rows[0] || {};

  // Fetch company settings
  const companyResult = await db.query(`
    SELECT
      cs.company_name,
      vp.email as vp_customer_success_email,
      vp.name as vp_customer_success_name,
      ceo.email as ceo_email,
      ceo.name as ceo_name,
      cs.customer_success_team_email,
      cs.executive_team_email
    FROM company_settings cs
    LEFT JOIN users vp ON cs.vp_customer_success_id = vp.id
    LEFT JOIN users ceo ON cs.ceo_id = ceo.id
    LIMIT 1
  `);

  const company = companyResult.rows[0] || {};

  // Fetch account team (if has account plan)
  let accountTeam = {};
  if (customer.has_account_plan) {
    const teamResult = await db.query(`
      SELECT
        ae.email as account_executive_email,
        ae.name as account_executive_name,
        sa.email as solutions_architect_email,
        sa.name as solutions_architect_name,
        exec.email as executive_sponsor_email,
        exec.name as executive_sponsor_name
      FROM customers c
      LEFT JOIN users ae ON c.account_executive_id = ae.id
      LEFT JOIN users sa ON c.solutions_architect_id = sa.id
      LEFT JOIN users exec ON c.executive_sponsor_id = exec.id
      WHERE c.id = $1
    `, [customer.id]);

    const team = teamResult.rows[0] || {};

    accountTeam = {
      ae: team.account_executive_email,
      aeName: team.account_executive_name,
      sa: team.solutions_architect_email,
      saName: team.solutions_architect_name,
      executiveSponsor: team.executive_sponsor_email,
      executiveSponsorName: team.executive_sponsor_name,
      allEmails: [
        team.account_executive_email,
        team.solutions_architect_email,
        team.executive_sponsor_email,
        csm.email
      ].filter(Boolean).join(',')
    };
  }

  // Build context object (matches template variables)
  return {
    customer: {
      id: customer.id,
      name: customer.name,
      slug: customer.slug || customer.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      arr: customer.arr,
      renewalDate: customer.renewal_date,
      contractTerm: customer.contract_term,
      industry: customer.industry,
      employeeCount: customer.employee_count,
      hasAccountPlan: customer.has_account_plan || false,
      accountPlan: customer.has_account_plan ? {
        owner: customer.account_plan_owner_email,
        ownerName: customer.account_plan_owner_name,
        team: accountTeam.allEmails,
        lastUpdated: customer.account_plan_last_updated
      } : null
    },

    csm: {
      id: csm.id,
      email: csm.email,
      name: csm.name,
      title: csm.title,
      manager: csm.manager_email,
      managerName: csm.manager_name,
      managerTitle: csm.manager_title
    },

    workflow: {
      executionId: workflowExecution.id,
      currentStage: workflowExecution.workflow_name,
      daysUntilRenewal: daysUntilRenewal,
      hoursUntilRenewal: hoursUntilRenewal,
      renewalARR: customer.arr,
      currentDate: new Date().toISOString(),
      currentTimestamp: new Date().toISOString(),
      isOverdue: daysUntilRenewal < 0,
      daysOverdue: daysUntilRenewal < 0 ? Math.abs(daysUntilRenewal) : 0
    },

    company: {
      name: company.company_name,
      vpCustomerSuccess: company.vp_customer_success_email,
      vpCustomerSuccessName: company.vp_customer_success_name,
      ceo: company.ceo_email,
      ceoName: company.ceo_name,
      csTeamEmail: company.customer_success_team_email,
      execTeamEmail: company.executive_team_email
    },

    accountTeam: accountTeam,

    // Helper for Math operations in templates
    Math: Math
  };
}

/**
 * Execute a workflow step
 *
 * @param {object} step - Workflow step config
 * @param {object} context - Workflow context
 * @param {object} previousOutputs - Outputs from previous steps
 * @returns {Promise<object>} - Step execution result
 */
async function executeWorkflowStep(step, context, previousOutputs = {}) {
  console.log(`\n📋 Executing step: ${step.name}`);

  try {
    // 1. Execute step logic (LLM, processor, etc.)
    let stepOutput = {};

    if (step.execution) {
      if (step.execution.processor) {
        // Run processor
        const processor = require(`../${step.execution.processor}`);
        stepOutput = await processor.execute({
          step,
          context,
          previousOutputs
        });

        console.log(`✅ Step completed: ${step.name}`);
      }

      if (step.execution.llmPrompt) {
        // Would call LLM here (not implemented in this example)
        console.log(`🤖 LLM processing: ${step.name}`);
      }
    }

    // 2. Process notifications for this step
    if (step.notifications && step.notifications.length > 0) {
      console.log(`\n📧 Processing notifications for step: ${step.name}`);

      // Add step outputs to context for notification resolution
      const notificationContext = {
        ...context,
        outputs: stepOutput
      };

      const notificationCount = await processNotifications(step, notificationContext);
      console.log(`✅ Sent ${notificationCount} notification(s)`);
    }

    // 3. Store step output
    if (step.execution && step.execution.storeIn) {
      await db.query(
        `INSERT INTO workflow_step_outputs (
          workflow_execution_id, step_id, output_key, output_data
        ) VALUES ($1, $2, $3, $4)`,
        [
          context.workflow.executionId,
          step.id,
          step.execution.storeIn,
          JSON.stringify(stepOutput)
        ]
      );
    }

    return {
      success: true,
      stepId: step.id,
      output: stepOutput
    };

  } catch (error) {
    console.error(`❌ Error executing step ${step.name}:`, error);
    return {
      success: false,
      stepId: step.id,
      error: error.message
    };
  }
}

/**
 * Execute an action (from UI button click)
 *
 * @param {object} action - Action config
 * @param {object} context - Workflow context
 * @returns {Promise<object>} - Action execution result
 */
async function executeAction(action, context) {
  console.log(`\n🔘 Executing action: ${action.label}`);

  try {
    // 1. Call action API endpoint
    let actionResult = {};

    if (action.onExecute && action.onExecute.apiEndpoint) {
      // Would make API call here (not implemented in this example)
      console.log(`📞 Calling API: ${action.onExecute.apiEndpoint}`);
      actionResult = { success: true };
    }

    // 2. Process onSuccess notification
    if (actionResult.success && action.onExecute.onSuccess?.sendNotification) {
      console.log(`\n📧 Processing action notification: ${action.label}`);

      const notificationConfig = action.onExecute.onSuccess.sendNotification;
      const notificationCount = await processActionNotification(
        { sendNotification: notificationConfig },
        context
      );

      console.log(`✅ Sent ${notificationCount} notification(s) for action`);
    }

    return {
      success: true,
      actionId: action.id,
      result: actionResult
    };

  } catch (error) {
    console.error(`❌ Error executing action ${action.label}:`, error);
    return {
      success: false,
      actionId: action.id,
      error: error.message
    };
  }
}

/**
 * Execute entire workflow
 *
 * @param {object} workflowConfig - Full workflow config
 * @param {string} customerId - Customer UUID
 * @returns {Promise<object>} - Workflow execution result
 */
async function executeWorkflow(workflowConfig, customerId) {
  console.log(`\n🚀 Starting workflow: ${workflowConfig.name}`);

  try {
    // 1. Fetch customer data
    const customerResult = await db.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    const customer = customerResult.rows[0];

    // 2. Create workflow execution record
    const executionResult = await db.query(
      `INSERT INTO workflow_executions (
        customer_id, workflow_name, stage, status
      ) VALUES ($1, $2, $3, 'in_progress')
      RETURNING *`,
      [customerId, workflowConfig.name, workflowConfig.id]
    );

    const workflowExecution = executionResult.rows[0];

    // 3. Build workflow context
    const context = await buildWorkflowContext(customer, workflowExecution);

    console.log(`\n📊 Workflow context built:`);
    console.log(`  Customer: ${context.customer.name}`);
    console.log(`  CSM: ${context.csm.name}`);
    console.log(`  Days until renewal: ${context.workflow.daysUntilRenewal}`);
    console.log(`  Days overdue: ${context.workflow.daysOverdue}`);

    // 4. Execute workflow steps sequentially
    const outputs = {};

    for (const step of workflowConfig.steps) {
      const result = await executeWorkflowStep(step, context, outputs);

      if (result.success) {
        outputs[step.id] = result.output;
      } else {
        console.warn(`⚠️  Step failed: ${step.name}`);
      }
    }

    // 5. Mark workflow as completed
    await db.query(
      `UPDATE workflow_executions
       SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [workflowExecution.id]
    );

    console.log(`\n✅ Workflow completed: ${workflowConfig.name}`);

    return {
      success: true,
      workflowExecutionId: workflowExecution.id,
      outputs
    };

  } catch (error) {
    console.error(`\n❌ Workflow execution failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  executeWorkflow,
  executeWorkflowStep,
  executeAction,
  buildWorkflowContext
};
