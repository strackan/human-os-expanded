const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3100;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Active Pieces webhook URL
const WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/t5lf6IkC96XmCXQnzifiE/test';

// Calculate days until renewal
function calculateDaysUntilRenewal(renewalDate) {
  const renewal = new Date(renewalDate + 'T00:00:00.000Z');
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const timeDifference = renewal.getTime() - todayUTC.getTime();
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
}

// Calculate renewal time urgency
function calculateRenewalTimeUrgency(daysUntilRenewal) {
  if (daysUntilRenewal < 90) {
    return 3; // critical
  } else if (daysUntilRenewal <= 105) {
    return 2; // monitor
  } else if (daysUntilRenewal <= 120) {
    return 1; // normal
  } else {
    return 0; // snooze
  }
}

// Get urgency label and status
function getUrgencyInfo(urgencyLevel) {
  const urgencyMap = {
    0: { label: 'SNOOZE', status: 'NORMAL', description: 'Long-term monitoring' },
    1: { label: 'NORMAL', status: 'NORMAL', description: 'Standard renewal timeline' },
    2: { label: 'MONITOR', status: 'MONITOR', description: 'Increase attention' },
    3: { label: 'CRITICAL', status: 'ESCALATED', description: 'Immediate action required' }
  };
  return urgencyMap[urgencyLevel];
}

// API: Get all customers
app.get('/api/customers', (req, res) => {
  try {
    const db = new Database('renubu-test.db', { readonly: true });

    const customers = db.prepare(`
      SELECT
        c.id,
        c.domain,
        c.arr,
        c.renewal_date,
        c.created_at,
        c.updated_at,
        co.name as company_name,
        u.full_name as owner_name
      FROM customers c
      LEFT JOIN companies co ON c.company_id = co.id
      LEFT JOIN users u ON c.owner = u.id
      ORDER BY c.renewal_date ASC
    `).all();

    // Get account plans for each customer
    const accountPlans = db.prepare(`
      SELECT customer_id, plan_type, active, start_date
      FROM account_plan
      WHERE active = 1
    `).all();

    // Get active renewals for each customer
    const renewals = db.prepare(`
      SELECT
        r.id,
        r.contract_id,
        r.start_date,
        r.end_date,
        r.starting_arr,
        r.ending_arr,
        r.status,
        r.active_stage,
        ct.customer_id
      FROM renewals r
      LEFT JOIN contracts ct ON r.contract_id = ct.id
      WHERE r.active = 1
    `).all();

    // Get contracts for each customer
    const contracts = db.prepare(`
      SELECT
        id,
        customer_id,
        contract_number,
        start_date,
        end_date,
        initial_arr,
        active
      FROM contracts
      WHERE active = 1
    `).all();

    // Map plans, renewals, and contracts to customers
    const enrichedCustomers = customers.map(customer => {
      const customerPlans = accountPlans.filter(p => p.customer_id === customer.id);
      const customerContracts = contracts.filter(c => c.customer_id === customer.id);
      const customerRenewals = renewals.filter(r =>
        customerContracts.some(c => c.id === r.contract_id)
      );

      return {
        ...customer,
        account_plans: customerPlans,
        active_renewal: customerRenewals[0] || null,
        active_contract: customerContracts[0] || null
      };
    });

    db.close();

    res.json({
      success: true,
      customers: enrichedCustomers,
      count: enrichedCustomers.length
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
});

// API: Trigger webhook for a specific customer
app.post('/api/trigger-webhook/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const db = new Database('renubu-test.db', { readonly: true });

    // Get the specific customer from the database
    const customer = db.prepare(`
      SELECT
        c.id,
        c.domain,
        c.arr,
        c.renewal_date,
        co.name as company_name,
        u.full_name as owner_name
      FROM customers c
      LEFT JOIN companies co ON c.company_id = co.id
      LEFT JOIN users u ON c.owner = u.id
      WHERE c.id = ?
    `).get(customerId);

    if (!customer) {
      db.close();
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    if (!customer.renewal_date) {
      db.close();
      return res.status(400).json({
        success: false,
        error: 'Customer has no renewal date set'
      });
    }

    // Get account plans for this customer
    const accountPlans = db.prepare(`
      SELECT plan_type, active, start_date
      FROM account_plan
      WHERE customer_id = ? AND active = 1
    `).all(customerId);

    // Get active renewal for this customer
    const activeRenewal = db.prepare(`
      SELECT
        r.id,
        r.start_date,
        r.end_date,
        r.starting_arr,
        r.ending_arr,
        r.status,
        r.active_stage,
        r.auto_renew_period
      FROM renewals r
      LEFT JOIN contracts ct ON r.contract_id = ct.id
      WHERE ct.customer_id = ? AND r.active = 1
      LIMIT 1
    `).get(customerId);

    // Get active contract for this customer
    const activeContract = db.prepare(`
      SELECT
        id,
        contract_number,
        start_date,
        end_date,
        initial_arr,
        initial_onetime
      FROM contracts
      WHERE customer_id = ? AND active = 1
      LIMIT 1
    `).get(customerId);

    db.close();

    // Calculate urgency data
    const daysUntilRenewal = calculateDaysUntilRenewal(customer.renewal_date);
    const renewalTimeUrgency = calculateRenewalTimeUrgency(daysUntilRenewal);
    const urgencyInfo = getUrgencyInfo(renewalTimeUrgency);
    const todayDate = new Date().toISOString().split('T')[0];

    // Create payload - matching the format from the main app
    const payload = {
      // Original fields
      customer_id: customer.id,
      customer_name: customer.company_name,
      customer_domain: customer.domain,
      customer_arr: customer.arr,
      customer_owner: customer.owner_name,
      renewal_date: customer.renewal_date,
      triggered_at: new Date().toISOString(),
      source: "automation_manual_trigger",

      // Calculated fields
      today_date: todayDate,
      days_until_renewal: daysUntilRenewal,
      renewal_time_urgency: renewalTimeUrgency,
      renewal_status: urgencyInfo.status,
      urgency_label: urgencyInfo.label,
      urgency_description: urgencyInfo.description,
      calculated_at: new Date().toISOString(),

      // Account plans
      account_plans: accountPlans.map(p => p.plan_type),
      account_plans_count: accountPlans.length,

      // Active renewal data
      active_renewal: activeRenewal ? {
        renewal_id: activeRenewal.id,
        status: activeRenewal.status,
        active_stage: activeRenewal.active_stage,
        starting_arr: activeRenewal.starting_arr,
        renewal_period_start: activeRenewal.start_date,
        renewal_period_end: activeRenewal.end_date,
        auto_renew_period_days: activeRenewal.auto_renew_period
      } : null,

      // Active contract data
      active_contract: activeContract ? {
        contract_number: activeContract.contract_number,
        contract_start_date: activeContract.start_date,
        initial_arr: activeContract.initial_arr,
        initial_onetime: activeContract.initial_onetime
      } : null
    };

    // Debug log
    console.log('Sending payload to webhook:', JSON.stringify(payload, null, 2));

    // Send to Active Pieces webhook
    try {
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Automation-Manual-Trigger/1.0'
        },
        body: JSON.stringify(payload)
      });

      let responseText = '';
      let responseData = null;

      try {
        responseText = await webhookResponse.text();
        if (responseText) {
          responseData = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.log('Response is not valid JSON:', responseText);
        responseData = { raw_response: responseText };
      }

      return res.json({
        success: webhookResponse.ok,
        payload,
        webhook_status: webhookResponse.status,
        webhook_response: responseData || responseText,
        customer_source: 'specific_customer'
      });

    } catch (webhookError) {
      return res.json({
        success: false,
        payload,
        error: 'Failed to send webhook',
        details: webhookError.message,
        customer_source: 'specific_customer'
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Customer list: http://localhost:${PORT}`);
  console.log(`🔌 Webhook endpoint: http://localhost:${PORT}/api/trigger-webhook/:customerId`);
});
