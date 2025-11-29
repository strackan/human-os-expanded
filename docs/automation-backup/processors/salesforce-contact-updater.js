/**
 * Salesforce Contact Updater Processor
 *
 * Updates primary contact on Salesforce opportunity when contact changes.
 * Logs activity to Salesforce for audit trail.
 *
 * Expected task.metadata:
 * {
 *   oldContact: { name: string, salesforceId: string },
 *   newContact: { name: string, salesforceId: string }
 * }
 */

const { getSalesforceClient } = require('../services/salesforceService');

/**
 * Execute contact update in Salesforce
 *
 * @param {Object} context - Execution context
 * @param {Object} context.task - Task object
 * @param {Object} context.customer - Customer object
 * @param {Object} context.workflow - Workflow execution object
 * @returns {Object} Execution result
 */
async function execute({ task, customer, workflow }) {
  console.log(`   📞 Updating Salesforce contact for ${customer.name}...`);

  const { oldContact, newContact } = task.metadata;

  if (!oldContact || !newContact) {
    throw new Error('Missing required metadata: oldContact and newContact');
  }

  if (!customer.salesforce_opportunity_id) {
    throw new Error('Customer does not have Salesforce opportunity ID');
  }

  try {
    // Get Salesforce client
    const sfClient = await getSalesforceClient();

    // ─────────────────────────────────────────────────────────────────────
    // 1. Update Opportunity Primary Contact
    // ─────────────────────────────────────────────────────────────────────

    console.log(`      Old Contact: ${oldContact.name}`);
    console.log(`      New Contact: ${newContact.name}`);

    const updateResult = await sfClient.opportunity.update(
      customer.salesforce_opportunity_id,
      {
        Primary_Contact__c: newContact.salesforceId,
        Previous_Contact__c: oldContact.salesforceId,
        Contact_Changed_Date__c: new Date().toISOString(),
        Contact_Changed_Via__c: 'Automated Workflow',
        Last_Modified_By_System__c: true
      }
    );

    if (!updateResult.success) {
      throw new Error(`Salesforce update failed: ${updateResult.errors?.join(', ')}`);
    }

    console.log(`      ✅ Opportunity updated: ${customer.salesforce_opportunity_id}`);

    // ─────────────────────────────────────────────────────────────────────
    // 2. Log Activity/Task in Salesforce
    // ─────────────────────────────────────────────────────────────────────

    const activityResult = await sfClient.task.create({
      WhoId: newContact.salesforceId, // Contact ID
      WhatId: customer.salesforce_opportunity_id, // Opportunity ID
      Subject: 'Primary Contact Changed',
      Description: `
        Primary contact changed during ${workflow.workflow_name} workflow.

        Previous Contact: ${oldContact.name} (${oldContact.salesforceId})
        New Contact: ${newContact.name} (${newContact.salesforceId})

        Changed on: ${new Date().toLocaleString()}
        Changed by: Automated Workflow System
        Workflow: ${workflow.workflow_name}
        Workflow Stage: ${workflow.stage}
      `.trim(),
      Status: 'Completed',
      Priority: 'Normal',
      ActivityDate: new Date().toISOString().split('T')[0], // Today's date
      Type: 'Contact Change',
      TaskSubtype: 'Task'
    });

    if (!activityResult.success) {
      // Non-critical failure - log but don't fail task
      console.warn(`      ⚠️  Activity logging failed: ${activityResult.errors?.join(', ')}`);
    } else {
      console.log(`      ✅ Activity logged: ${activityResult.id}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. Update Internal Database (optional)
    // ─────────────────────────────────────────────────────────────────────

    // In production, you might also update your internal customer database
    // await updateCustomer(customer.id, {
    //   primary_contact_id: newContact.id,
    //   primary_contact_name: newContact.name
    // });

    // ─────────────────────────────────────────────────────────────────────
    // 4. Return Success
    // ─────────────────────────────────────────────────────────────────────

    return {
      success: true,
      message: `Contact updated from ${oldContact.name} to ${newContact.name}`,
      updatedFields: [
        'Primary_Contact__c',
        'Previous_Contact__c',
        'Contact_Changed_Date__c'
      ],
      salesforceOpportunityId: customer.salesforce_opportunity_id,
      activityLogged: activityResult.success,
      activityId: activityResult.id
    };

  } catch (error) {
    console.error(`      ❌ Salesforce error: ${error.message}`);

    // Check if retryable error
    const retryableCodes = ['UNABLE_TO_LOCK_ROW', 'TIMEOUT', 'SERVER_UNAVAILABLE'];
    const isRetryable = error.errorCode && retryableCodes.includes(error.errorCode);

    return {
      success: false,
      error: error.message,
      errorCode: error.errorCode,
      retryable: isRetryable
    };
  }
}

/**
 * Validate task metadata before execution
 *
 * @param {Object} task - Task object
 * @returns {boolean} Valid or not
 */
function validate(task) {
  const { metadata } = task;

  if (!metadata) {
    return { valid: false, error: 'Missing metadata' };
  }

  if (!metadata.oldContact || !metadata.newContact) {
    return { valid: false, error: 'Missing oldContact or newContact in metadata' };
  }

  if (!metadata.oldContact.salesforceId || !metadata.newContact.salesforceId) {
    return { valid: false, error: 'Missing Salesforce IDs in contacts' };
  }

  return { valid: true };
}

module.exports = {
  execute,
  validate
};
