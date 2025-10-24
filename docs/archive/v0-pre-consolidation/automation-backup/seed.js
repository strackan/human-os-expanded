const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Helper function to generate random ARR between min and max
function generateARR(min = 25000, max = 200000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Helper function to generate future date within next 12 months
function generateRenewalDate() {
  const today = new Date();
  const daysInFuture = Math.floor(Math.random() * 365);
  const renewalDate = new Date(today);
  renewalDate.setDate(today.getDate() + daysInFuture);
  return renewalDate.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper to generate current timestamp
function now() {
  return new Date().toISOString();
}

function seedDatabase() {
  console.log('🗄️  Initializing SQLite database...\n');

  // Create/open database
  const db = new Database('renubu-test.db');

  // Read and execute schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  console.log('✅ Schema created successfully\n');

  // Clear existing data
  db.exec('DELETE FROM account_plan');
  db.exec('DELETE FROM customer_properties');
  db.exec('DELETE FROM renewals');
  db.exec('DELETE FROM contracts');
  db.exec('DELETE FROM customers');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM companies');

  console.log('🧹 Cleared existing data\n');

  // Seed Companies
  console.log('🏢 Seeding companies...');
  const companies = [
    {
      id: randomUUID(),
      name: 'Acme Corporation',
      domain: 'acme-corp.com',
      created_at: now(),
      updated_at: now()
    },
    {
      id: randomUUID(),
      name: 'TechStart Solutions',
      domain: 'techstart.io',
      created_at: now(),
      updated_at: now()
    },
    {
      id: randomUUID(),
      name: 'Global Enterprises',
      domain: 'globalent.com',
      created_at: now(),
      updated_at: now()
    }
  ];

  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, domain, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  companies.forEach(company => {
    insertCompany.run(company.id, company.name, company.domain, company.created_at, company.updated_at);
    console.log(`  ✓ ${company.name}`);
  });

  console.log('\n👥 Seeding users...');
  const users = [
    {
      id: randomUUID(),
      company_id: companies[0].id,
      email: 'sarah.johnson@acme-corp.com',
      full_name: 'Sarah Johnson',
      created_at: now(),
      updated_at: now()
    },
    {
      id: randomUUID(),
      company_id: companies[0].id,
      email: 'michael.chen@acme-corp.com',
      full_name: 'Michael Chen',
      created_at: now(),
      updated_at: now()
    },
    {
      id: randomUUID(),
      company_id: companies[1].id,
      email: 'emma.rodriguez@techstart.io',
      full_name: 'Emma Rodriguez',
      created_at: now(),
      updated_at: now()
    },
    {
      id: randomUUID(),
      company_id: companies[2].id,
      email: 'david.kim@globalent.com',
      full_name: 'David Kim',
      created_at: now(),
      updated_at: now()
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, company_id, email, full_name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(user.id, user.company_id, user.email, user.full_name, user.created_at, user.updated_at);
    console.log(`  ✓ ${user.full_name} (${user.email})`);
  });

  console.log('\n📊 Seeding customers...');
  const customerNames = [
    { name: 'Stellar Analytics', domain: 'stellaranalytics.com' },
    { name: 'CloudNine Systems', domain: 'cloudnine.io' },
    { name: 'DataFlow Inc', domain: 'dataflow.com' },
    { name: 'Vertex Solutions', domain: 'vertexsol.com' },
    { name: 'NexGen Software', domain: 'nexgensoft.com' },
    { name: 'Quantum Dynamics', domain: 'quantumdyn.com' },
    { name: 'Pixel Perfect Media', domain: 'pixelperfect.co' },
    { name: 'StreamLine Technologies', domain: 'streamlinetech.com' },
    { name: 'Innovative Systems', domain: 'innovativesys.com' },
    { name: 'FutureTech Ventures', domain: 'futuretech.vc' }
  ];

  const customers = [];
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, company_id, domain, arr, renewal_date, owner, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  customerNames.forEach((customerData, index) => {
    // Distribute customers across companies
    const companyId = companies[index % companies.length].id;

    // Distribute customers across users from the same company
    const companyUsers = users.filter(u => u.company_id === companyId);
    const owner = companyUsers[Math.floor(Math.random() * companyUsers.length)];

    const arr = generateARR();
    const customer = {
      id: randomUUID(),
      company_id: companyId,
      domain: customerData.domain,
      arr: arr,
      renewal_date: generateRenewalDate(),
      owner: owner.id,
      created_at: now(),
      updated_at: now()
    };

    customers.push({ ...customer, name: customerData.name });
    insertCustomer.run(
      customer.id,
      customer.company_id,
      customer.domain,
      customer.arr,
      customer.renewal_date,
      customer.owner,
      customer.created_at,
      customer.updated_at
    );

    console.log(`  ✓ ${customerData.name} - $${arr.toLocaleString()} ARR - Renewal: ${customer.renewal_date}`);
  });

  // Seed Contracts (one per customer)
  console.log('\n📄 Seeding contracts...');
  const contracts = [];
  const insertContract = db.prepare(`
    INSERT INTO contracts (id, customer_id, contract_number, start_date, end_date, initial_arr, initial_onetime, created_at, updated_at, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  customers.forEach((customer, index) => {
    // Each customer gets exactly one contract that started 2-3 years ago
    const yearsAgo = 2 + Math.floor(Math.random() * 2); // 2 or 3 years ago
    const contractStartYear = new Date().getFullYear() - yearsAgo;
    const startDate = new Date(contractStartYear, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));

    // Contract end date is far in the future (or evergreen)
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 10);

    // Initial ARR is lower than current (showing growth)
    const initialARR = Math.floor(customer.arr * 0.5); // Started at 50% of current ARR

    // Initial one-time fee (onboarding/setup)
    const onetimeFee = Math.floor(initialARR * (0.15 + Math.random() * 0.25));

    const contract = {
      id: randomUUID(),
      customer_id: customer.id,
      contract_number: `CNT-${contractStartYear}-${String(index + 1).padStart(4, '0')}`,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      initial_arr: initialARR,
      initial_onetime: onetimeFee,
      created_at: now(),
      updated_at: now(),
      active: 1
    };

    contracts.push({ ...contract, customer_arr: customer.arr, years_ago: yearsAgo });
    insertContract.run(
      contract.id,
      contract.customer_id,
      contract.contract_number,
      contract.start_date,
      contract.end_date,
      contract.initial_arr,
      contract.initial_onetime,
      contract.created_at,
      contract.updated_at,
      contract.active
    );

    console.log(`  ✓ ${contract.contract_number} - Started ${yearsAgo}y ago - Initial: $${initialARR.toLocaleString()} ARR + $${onetimeFee.toLocaleString()}`);
  });

  // Seed Renewals (multiple per contract showing growth trend)
  console.log('\n🔄 Seeding renewals...');
  const renewals = [];
  const renewalStatuses = ['completed', 'completed', 'in_progress', 'upcoming'];
  const activeStages = ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  const insertRenewal = db.prepare(`
    INSERT INTO renewals (id, contract_id, start_date, end_date, auto_renew_period, starting_arr, ending_arr, status, active_stage, opp_id, notes, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  contracts.forEach((contract, contractIndex) => {
    // Generate renewals for each year since contract started
    const numYears = contract.years_ago + 1; // Include current year

    for (let year = 0; year < numYears; year++) {
      const renewalStartDate = new Date(contract.start_date);
      renewalStartDate.setFullYear(renewalStartDate.getFullYear() + year);

      const renewalEndDate = new Date(renewalStartDate);
      renewalEndDate.setFullYear(renewalEndDate.getFullYear() + 1);

      // Calculate ARR growth over time (gradual increase from initial to current)
      const growthProgress = year / (numYears - 1);
      const startingARR = Math.floor(contract.initial_arr + (contract.customer_arr - contract.initial_arr) * growthProgress);

      // Determine if this is the active renewal (most recent one)
      const isActive = year === numYears - 1;

      // For completed renewals, show the ending ARR (what it grew to)
      // For active renewal, ending_arr is null (still open)
      let endingARR = null;
      let status = 'completed';
      let activeStage = 'closed_won';

      if (isActive) {
        status = 'in_progress';
        activeStage = 'negotiation';
        endingARR = null; // Still open
      } else {
        // Completed renewals - show growth to next year's starting ARR
        const nextYearProgress = (year + 1) / (numYears - 1);
        endingARR = Math.floor(contract.initial_arr + (contract.customer_arr - contract.initial_arr) * nextYearProgress);

        // Occasionally show a churn or flat renewal
        const outcome = Math.random();
        if (outcome < 0.05) { // 5% churn rate
          endingARR = 0;
          activeStage = 'closed_lost';
        } else if (outcome < 0.15) { // 10% flat renewals
          endingARR = startingARR;
        }
      }

      const renewal = {
        id: randomUUID(),
        contract_id: contract.id,
        start_date: renewalStartDate.toISOString().split('T')[0],
        end_date: renewalEndDate.toISOString().split('T')[0],
        auto_renew_period: 60,
        starting_arr: startingARR,
        ending_arr: endingARR,
        status: status,
        active_stage: activeStage,
        opp_id: `OPP-${renewalStartDate.getFullYear()}-${String(contractIndex + 1).padStart(4, '0')}-${year + 1}`,
        notes: isActive ? 'Current renewal period in negotiation' : 'Completed successfully',
        active: isActive ? 1 : 0,
        created_at: now(),
        updated_at: now()
      };

      renewals.push(renewal);
      insertRenewal.run(
        renewal.id,
        renewal.contract_id,
        renewal.start_date,
        renewal.end_date,
        renewal.auto_renew_period,
        renewal.starting_arr,
        renewal.ending_arr,
        renewal.status,
        renewal.active_stage,
        renewal.opp_id,
        renewal.notes,
        renewal.active,
        renewal.created_at,
        renewal.updated_at
      );

      const statusIcon = isActive ? '🟢' : '✅';
      const endingDisplay = endingARR === null ? 'OPEN' : `$${endingARR.toLocaleString()}`;
      const growth = endingARR && endingARR > 0 ? ((endingARR - startingARR) / startingARR * 100).toFixed(1) + '%' : 'N/A';

      console.log(`  ${statusIcon} ${renewal.opp_id} | ${renewal.start_date} → ${renewal.end_date} | $${startingARR.toLocaleString()} → ${endingDisplay} | Growth: ${growth} | ${status}`);
    }
  });

  // Seed Account Plans
  // Distribution: invest-3, manage-2, monitor-2, expand-3 = 10 plans for 10 customers
  console.log('\n📋 Seeding account plans...');
  const accountPlans = [];
  const planDistribution = [
    'invest',   // Customer 1
    'invest',   // Customer 2
    'invest',   // Customer 3
    'manage',   // Customer 4
    'manage',   // Customer 5
    'monitor',  // Customer 6
    'monitor',  // Customer 7
    'expand',   // Customer 8
    'expand',   // Customer 9
    'expand'    // Customer 10
  ];

  const insertAccountPlan = db.prepare(`
    INSERT INTO account_plan (id, customer_id, plan_type, active, start_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Each customer gets exactly 1 plan
  customers.forEach((customer, index) => {
    const planType = planDistribution[index];

    // Start date is 30-180 days ago
    const daysAgo = 30 + Math.floor(Math.random() * 150);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const plan = {
      id: randomUUID(),
      customer_id: customer.id,
      plan_type: planType,
      active: 1,
      start_date: startDate.toISOString().split('T')[0],
      created_at: now(),
      updated_at: now()
    };

    accountPlans.push(plan);
    insertAccountPlan.run(
      plan.id,
      plan.customer_id,
      plan.plan_type,
      plan.active,
      plan.start_date,
      plan.created_at,
      plan.updated_at
    );

    console.log(`  ✓ ${customer.name} - ${planType.toUpperCase()} (started ${plan.start_date})`);
  });


  // Calculate and display statistics
  console.log('\n📈 Database Statistics:');
  const totalARR = customers.reduce((sum, c) => sum + c.arr, 0);
  const avgARR = totalARR / customers.length;
  const minARR = Math.min(...customers.map(c => c.arr));
  const maxARR = Math.max(...customers.map(c => c.arr));

  const activeContracts = contracts.filter(c => c.active === 1).length;
  const totalContracts = contracts.length;
  const activeRenewals = renewals.filter(r => r.active === 1).length;
  const totalRenewals = renewals.length;

  console.log(`  Companies: ${companies.length}`);
  console.log(`  Users: ${users.length}`);
  console.log(`  Customers: ${customers.length}`);
  console.log(`  Contracts: ${totalContracts} (${activeContracts} active)`);
  console.log(`  Renewals: ${totalRenewals} (${activeRenewals} active)`);
  console.log(`  Account Plans: ${accountPlans.length}`);
  console.log(`  Total ARR: $${totalARR.toLocaleString()}`);
  console.log(`  Average ARR: $${avgARR.toLocaleString()}`);
  console.log(`  ARR Range: $${minARR.toLocaleString()} - $${maxARR.toLocaleString()}`);

  db.close();
  console.log('\n✅ Database seeded successfully!\n');
}

// Run the seed function
seedDatabase();
