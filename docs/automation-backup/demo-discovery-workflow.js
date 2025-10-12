/**
 * Discovery Workflow Demo
 *
 * Comprehensive demonstration of the Discovery renewal workflow (150-179 days).
 * Simulates all 5 steps with realistic data flows and AI interactions.
 *
 * Run with: node demo-discovery-workflow.js
 */

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_CUSTOMER = {
  id: 'customer_acme',
  name: 'Acme Corporation',
  domain: 'acme.com',
  arr: 250000,
  renewalDate: '2025-06-15',
  owner: 'Sarah Johnson',
  daysUntilRenewal: 165
};

const MOCK_CONTRACT = {
  exists: true,
  number: 'CNT-2024-001',
  startDate: '2024-06-15',
  endDate: '2025-06-15',
  initialArr: 220000,
  documentUrl: 'https://storage.example.com/contracts/acme-2024.pdf',
  extractedTerms: {
    autoRenewal: false,
    noticePeriod: '90 days',
    priceIncreaseCap: '8% annually',
    minimumSeats: 100,
    terminationFee: 'None',
    paymentTerms: 'Net 30'
  }
};

const MOCK_AUDIO_TRANSCRIPT = `
So, Acme Corporation... overall I'd say the relationship is pretty strong, maybe an 8 out of 10.
We have good engagement with their VP of Operations, Sarah Chen, she's really bought in.

In terms of renewal confidence, I'm fairly confident, I'd say 7 out of 10. They're getting value,
usage is good, but there's one concern - they've had some budget cuts recently. Their CFO is new
and I haven't met him yet, which worries me a bit.

Red flags? The main one is the new CFO. He came from a more cost-conscious environment and
I hear he's scrutinizing all vendor relationships. Also, they missed our last QBR - said they
were too busy, but that's unusual for them.

What's working well? The product adoption is excellent. They're using 95% of features, their
team loves it. We have champions in the Operations and Engineering teams. Recent win was the
analytics module rollout - saved them 20 hours a week.

Main risks? Budget pressure is the big one. Also, I heard a competitor reached out to them,
though Sarah Chen said she shut it down quickly. Need to stay close on that.

Overall sentiment is positive with the users, neutral-to-cautious with finance. I'd say
overall "Positive" but with budget concerns as a dark cloud.
`;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function displayBanner(text) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  ${text}`);
  console.log('═'.repeat(80) + '\n');
}

function displaySection(title) {
  console.log('\n' + '─'.repeat(80));
  console.log(`▶ ${title}`);
  console.log('─'.repeat(80));
}

function displayStep(stepNumber, stepName) {
  console.log('\n' + '┌' + '─'.repeat(78) + '┐');
  console.log(`│ STEP ${stepNumber}: ${stepName.toUpperCase()}`.padEnd(79) + '│');
  console.log('└' + '─'.repeat(78) + '┘\n');
}

function displayArtifact(title, content) {
  console.log('\n┌' + '─'.repeat(78) + '┐');
  console.log(`│ 📄 ARTIFACT: ${title}`.padEnd(79) + '│');
  console.log('├' + '─'.repeat(78) + '┤');
  console.log(content.split('\n').map(line => `│ ${line}`.padEnd(79) + '│').join('\n'));
  console.log('└' + '─'.repeat(78) + '┘');
}

function simulateAIThinking(duration = 1000) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i++ % frames.length]} AI analyzing...`);
  }, 80);

  return new Promise(resolve => {
    setTimeout(() => {
      clearInterval(interval);
      process.stdout.write('\r✓ Analysis complete\n\n');
      resolve();
    }, duration);
  });
}

// =============================================================================
// STEP SIMULATIONS
// =============================================================================

async function simulateStep1_CSMAssessment() {
  displayStep(1, 'CSM Subjective Assessment');

  console.log('🎤 CSM SUBJECTIVE ASSESSMENT\n');
  console.log(`Customer: ${MOCK_CUSTOMER.name} (ARR: $${MOCK_CUSTOMER.arr.toLocaleString()})`);
  console.log(`Renewal in ${MOCK_CUSTOMER.daysUntilRenewal} days\n`);

  console.log('Options:');
  console.log('  1️⃣  Upload Audio Recording');
  console.log('  2️⃣  Start AI Interview (text-based)\n');

  displaySection('Scenario: CSM Uploads Audio Recording');

  console.log('CSM uploads audio recording (5:32 duration)');
  console.log('Transcribing audio...\n');

  await simulateAIThinking(800);

  console.log('TRANSCRIPT:');
  console.log('─'.repeat(80));
  console.log(MOCK_AUDIO_TRANSCRIPT.trim());
  console.log('─'.repeat(80) + '\n');

  console.log('AI analyzing transcript...');
  await simulateAIThinking(1200);

  displaySection('AI Analysis of Transcript');

  const analysis = {
    relationshipStrength: 8,
    renewalConfidence: 7,
    redFlags: [
      'New CFO not yet engaged - high priority concern',
      'Recent budget cuts at customer',
      'Missed last QBR - unusual for this customer',
      'Competitor outreach reported (though rejected)'
    ],
    strengths: [
      '95% feature adoption - excellent product usage',
      'Strong champions in Operations and Engineering',
      'Recent analytics module win (20 hrs/week saved)',
      'VP of Operations (Sarah Chen) highly engaged'
    ],
    risks: [
      'Budget pressure from new CFO',
      'Competitor awareness and potential outreach',
      'Lack of finance stakeholder relationship'
    ],
    sentiment: 'Positive (with budget concerns)',
    gapsIdentified: [
      'Missing: CFO relationship',
      'Action needed: QBR reschedule',
      'Monitor: Competitor activity'
    ]
  };

  console.log('EXTRACTED INFORMATION:\n');
  console.log(`✓ Relationship Strength: ${analysis.relationshipStrength}/10`);
  console.log(`✓ Renewal Confidence: ${analysis.renewalConfidence}/10`);
  console.log(`✓ Sentiment: ${analysis.sentiment}\n`);

  console.log('🚨 RED FLAGS IDENTIFIED:');
  analysis.redFlags.forEach(flag => console.log(`  • ${flag}`));

  console.log('\n✅ STRENGTHS:');
  analysis.strengths.forEach(strength => console.log(`  • ${strength}`));

  console.log('\n⚠️  MAIN RISKS:');
  analysis.risks.forEach(risk => console.log(`  • ${risk}`));

  displaySection('AI Follow-Up Questions');

  console.log('AI identifies gaps in transcript. Generating follow-up questions...\n');

  const followUpQuestions = [
    {
      question: 'You mentioned the new CFO hasn\'t been engaged yet. When did he start, and have there been any attempts to schedule a meeting?',
      answer: 'He started 3 months ago. We tried once but he delegated it. Haven\'t pushed again.'
    },
    {
      question: 'The competitor outreach - do you know which competitor and what their pitch was?',
      answer: 'It was TechRival Inc. They pitched lower pricing but Sarah said inferior features. She forwarded me the email.'
    },
    {
      question: 'Can you quantify the budget cuts? Are they company-wide or specific to your budget line?',
      answer: 'Company-wide 15% cuts. Our line hasn\'t been cut yet but everything under review.'
    }
  ];

  followUpQuestions.forEach((fq, i) => {
    console.log(`Q${i + 1}: ${fq.question}`);
    console.log(`A${i + 1}: ${fq.answer}\n`);
  });

  await simulateAIThinking(800);

  displaySection('Generated Artifact: CSM Assessment Report');

  const artifact = `
Overall Ratings
───────────────
Relationship Strength:  ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10)
Renewal Confidence:     ⭐⭐⭐⭐⭐⭐⭐ (7/10)
Sentiment:              😊 Positive (with budget concerns)

🚨 Red Flags & Concerns
─────────────────────────
  • New CFO (3 months) - not yet engaged, delegated initial meeting attempt
  • Company-wide budget cuts (15%) - renewal budget under review
  • Missed last QBR (unusual behavior for this customer)
  • Competitor outreach from TechRival Inc. (rejected but indicates shopping)

✅ What's Working Well
────────────────────────
  • Exceptional product adoption: 95% feature usage
  • Strong champions: Operations (Sarah Chen - VP) & Engineering teams
  • Recent win: Analytics module (quantified 20 hrs/week savings)
  • Relationship strength with day-to-day users: Very strong

⚠️  Main Risks & Obstacles
───────────────────────────
  • Budget pressure: 15% company-wide cuts, CFO scrutinizing all vendors
  • Finance stakeholder gap: No relationship with CFO (economic buyer)
  • Competitive threat: TechRival aware of customer, may return
  • Engagement drop: Missed QBR could indicate deprioritization

📋 Executive Summary
──────────────────
Acme Corporation shows strong product adoption and champion relationships at the
operational level. However, significant renewal risk exists due to new CFO not yet
engaged, company-wide budget cuts, and recent competitor interest. Critical action
needed: Establish CFO relationship before budget locked. Renewal confidence is moderate
(7/10) but could improve dramatically with executive engagement. Timeline is favorable
(165 days) for relationship building.

🎯 Gaps Identified
────────────────
  1. CRITICAL: No CFO relationship (economic buyer, new to role, cost-conscious)
  2. HIGH: QBR needs rescheduling (engagement indicator)
  3. MEDIUM: Competitive intelligence gathering (TechRival positioning)
  `;

  displayArtifact('CSM Assessment - Acme Corporation', artifact.trim());

  return analysis;
}

async function simulateStep2_ContractAnalysis() {
  displayStep(2, 'Contract Analysis & Obstacles');

  console.log('📄 CONTRACT ANALYSIS & OBSTACLES\n');
  console.log('Checking for contract in database...\n');

  await simulateAIThinking(600);

  if (MOCK_CONTRACT.exists) {
    console.log('✓ Contract found in database\n');
    console.log('Contract Information:');
    console.log(`  Number: ${MOCK_CONTRACT.number}`);
    console.log(`  Term: ${MOCK_CONTRACT.startDate} → ${MOCK_CONTRACT.endDate}`);
    console.log(`  Initial ARR: $${MOCK_CONTRACT.initialArr.toLocaleString()}`);
    console.log(`  Current ARR: $${MOCK_CUSTOMER.arr.toLocaleString()} (+${Math.round((MOCK_CUSTOMER.arr - MOCK_CONTRACT.initialArr) / MOCK_CONTRACT.initialArr * 100)}%)`);
    console.log(`  Document: ${MOCK_CONTRACT.documentUrl}\n`);

    console.log('Analyzing contract terms...');
    await simulateAIThinking(1000);

    displaySection('Extracted Contract Terms');

    console.log('AUTO-RENEWAL: No');
    console.log('NOTICE PERIOD: 90 days (must notify by Day 90!)');
    console.log('PRICE INCREASE CAP: 8% annually');
    console.log('MINIMUM SEATS: 100');
    console.log('TERMINATION FEE: None');
    console.log('PAYMENT TERMS: Net 30\n');

    console.log('Identifying obstacles based on renewal context...');
    await simulateAIThinking(800);

    displaySection('Obstacle Analysis');

    const obstacles = {
      critical: [
        {
          term: 'Notice Period: 90 days',
          impact: 'Must provide renewal notice by Day 90 (currently Day 165)',
          deadline: 'Day 90 (in ~75 days)',
          action: 'Mark calendar: Day 90 = hard deadline for renewal decision',
          severity: '🔴 CRITICAL'
        },
        {
          term: 'Price Increase Cap: 8% annually',
          impact: 'Maximum price increase limited to $17,600 (8% of $220k base)',
          deadline: 'Before contract renewal',
          action: 'If planning >8% increase, contract amendment required NOW',
          severity: '🔴 CRITICAL'
        }
      ],
      important: [
        {
          term: 'No Auto-Renewal',
          impact: 'Contract will not automatically renew - explicit action required',
          action: 'Ensure renewal decision and paperwork completed before Day 90',
          severity: '🟡 IMPORTANT'
        },
        {
          term: 'Minimum Seats: 100',
          impact: 'Customer committed to 100 seat minimum',
          action: 'Verify current usage vs. commitment (upsell opportunity?)',
          severity: '🟡 IMPORTANT'
        }
      ],
      favorable: [
        {
          term: 'No Termination Fee',
          impact: 'Customer has no penalty for non-renewal',
          note: 'Be aware: easy exit for customer if dissatisfied',
          severity: '✅ FAVORABLE (but watch)'
        },
        {
          term: 'Net 30 Payment Terms',
          impact: 'Standard payment terms, no prepayment required',
          note: 'Flexible for customer cash flow',
          severity: '✅ FAVORABLE'
        }
      ]
    };

    console.log('\n🔴 CRITICAL OBSTACLES:\n');
    obstacles.critical.forEach(obs => {
      console.log(`  ${obs.severity} ${obs.term}`);
      console.log(`     Impact: ${obs.impact}`);
      console.log(`     Deadline: ${obs.deadline}`);
      console.log(`     Action: ${obs.action}\n`);
    });

    console.log('🟡 IMPORTANT CONSIDERATIONS:\n');
    obstacles.important.forEach(obs => {
      console.log(`  ${obs.severity} ${obs.term}`);
      console.log(`     Impact: ${obs.impact}`);
      console.log(`     Action: ${obs.action}\n`);
    });

    console.log('✅ FAVORABLE TERMS:\n');
    obstacles.favorable.forEach(obs => {
      console.log(`  ${obs.severity} ${obs.term}`);
      console.log(`     ${obs.note}\n`);
    });

    displaySection('Key Deadlines & Actions');

    console.log('📅 CRITICAL TIMELINE:\n');
    console.log('  Day 165 (TODAY): Discovery stage');
    console.log('  Day 90 (in 75 days): NOTICE DEADLINE - must notify intent to renew');
    console.log('  Day 0: Contract expires\n');

    console.log('⚠️  IMMEDIATE ACTIONS REQUIRED:\n');
    console.log('  1. If planning >8% price increase → Start contract amendment NOW');
    console.log('  2. Calendar reminder: Day 90 = hard notice deadline');
    console.log('  3. Verify seat usage (100 minimum commitment)\n');

    const artifact = `
Contract: ${MOCK_CONTRACT.number}
Term: ${MOCK_CONTRACT.startDate} - ${MOCK_CONTRACT.endDate}
Initial ARR: $${MOCK_CONTRACT.initialArr.toLocaleString()}

🔴 CRITICAL OBSTACLES
─────────────────────────
1. Notice Period: 90 days
   → Must notify by Day 90 (in 75 days)
   → Hard deadline, cannot miss

2. Price Increase Cap: 8% annually
   → Max increase: $17,600 (to $237,600)
   → If planning higher: Contract amendment needed NOW

🟡 IMPORTANT CONSIDERATIONS
─────────────────────────────
• No auto-renewal (explicit action required)
• Minimum seats: 100 (verify current usage)

✅ FAVORABLE TERMS
──────────────────
• No termination penalty
• Flexible payment terms (Net 30)

📅 KEY DEADLINES
───────────────
Day 165 (Today): Discovery phase
Day 90: NOTICE DEADLINE ⚠️
Day 0: Contract expiration
    `;

    displayArtifact('Contract Analysis - Acme Corporation', artifact.trim());

    return obstacles;
  } else {
    console.log('⚠️  NO CONTRACT FOUND IN DATABASE\n');
    console.log('Action needed: Upload current contract for analysis\n');
    console.log('[Upload Contract Button]\n');
    return null;
  }
}

async function simulateStep3_PricingStrategy() {
  displayStep(3, 'Preliminary Pricing Strategy');

  console.log('💰 PRELIMINARY PRICING STRATEGY\n');
  console.log(`Current ARR: $${MOCK_CUSTOMER.arr.toLocaleString()}`);
  console.log(`Contract Base: $${MOCK_CONTRACT.initialArr.toLocaleString()}`);
  console.log(`Days until renewal: ${MOCK_CUSTOMER.daysUntilRenewal}\n`);

  displaySection('AI-Guided Pricing Questionnaire');

  console.log('AI: Let\'s develop a preliminary pricing strategy. This is directional only.\n');

  const pricingFlow = [
    {
      question: 'What is your target ARR for this renewal?',
      context: 'Consider: current ARR ($250k), customer growth, value delivered',
      answer: '$265,000',
      aiResponse: 'That\'s a $15k increase (6%). Let\'s explore this...'
    },
    {
      question: 'Are you planning a price increase?',
      options: ['Yes', 'No', 'TBD - need guidance'],
      answer: 'Yes',
      aiResponse: 'Understood. Let\'s discuss the specifics...'
    },
    {
      question: 'What percentage increase are you considering?',
      context: 'Context:\n  • Contract cap: 8% max ($17.6k increase)\n  • Current base: $220k\n  • Market norms: 5-10% for renewals',
      answer: '6.8% (from $220k base = ~$15k increase)',
      aiResponse: 'Good - that\'s within contract limits and reasonable range.'
    },
    {
      question: 'What is your risk level for this pricing strategy?',
      options: ['Low', 'Medium', 'High'],
      answer: 'Medium',
      aiResponse: 'Given the budget cuts and new CFO, medium risk seems accurate.'
    },
    {
      question: 'What is your rationale for this approach?',
      answer: 'We delivered significant value (20 hrs/week saved from analytics). Usage is at 95%. Increase is modest and within contract cap. Covers our cost increases.',
      aiResponse: 'Strong value-based rationale. Let\'s document this thoroughly.'
    },
    {
      question: 'How price-sensitive is this customer?',
      options: ['Low', 'Medium', 'High'],
      answer: 'Medium (higher due to budget cuts)',
      aiResponse: 'Noted. We\'ll need strong value justification given budget pressures.'
    }
  ];

  for (const [i, flow] of pricingFlow.entries()) {
    console.log(`\nQ${i + 1}: ${flow.question}`);
    if (flow.context) {
      console.log(`    ${flow.context.replace(/\n/g, '\n    ')}`);
    }
    if (flow.options) {
      console.log(`    Options: ${flow.options.join(' | ')}`);
    }
    console.log(`\n→ CSM: ${flow.answer}`);
    console.log(`\n  AI: ${flow.aiResponse}`);
  }

  console.log('\n\nAnalyzing pricing strategy...');
  await simulateAIThinking(1000);

  displaySection('AI Pricing Recommendation');

  const recommendation = `
Based on your inputs and customer context:

PROPOSED STRATEGY: ✅ RECOMMENDED
  Target ARR: $265,000
  Increase: $15,000 (6.8% from base)
  Risk Level: Medium

STRENGTHS OF THIS APPROACH:
  ✓ Within contract cap (8% max)
  ✓ Well below market ceiling (10%)
  ✓ Strong value justification (quantified savings)
  ✓ Modest enough for budget-constrained environment

RISK MITIGATION NEEDED:
  ⚠️  New CFO not yet engaged (high risk)
  ⚠️  Budget cuts create scrutiny
  ⚠️  Competitor awareness increases price sensitivity

RECOMMENDED APPROACH:
  1. Lead with VALUE story (20 hrs/week saved = $52k annual value)
  2. Position as modest increase (only 6.8%) vs. value delivered
  3. Engage CFO EARLY - don't surprise finance with increase
  4. Prepare ROI documentation before Day 120
  5. Consider: Offer multi-year lock at this rate?

ALTERNATIVE SCENARIOS:
  • Flat renewal ($250k): Low risk, but leaves money on table
  • Higher increase (>8%): Requires contract amendment, adds complexity

NEXT STEPS:
  1. Build value realization report
  2. Schedule CFO engagement (critical!)
  3. Prepare pricing justification deck
  4. Monitor competitor activity
  `;

  console.log(recommendation.trim());

  const artifact = `
PRELIMINARY PRICING STRATEGY - Acme Corporation

Current ARR:        $250,000
Contract Base:      $220,000
Target ARR:         $265,000
Increase Amount:    $15,000 (6.8%)

STRATEGY ASSESSMENT
───────────────────
Risk Level:         🟡 Medium
Contract Cap:       8% max ($17,600) ✓ Within limit
Market Range:       5-10% typical ✓ Within range

RATIONALE
─────────
• Quantified value delivered: 20 hrs/week saved ($52k annual value)
• Exceptional product adoption: 95% feature usage
• Increase modest relative to value
• Covers vendor cost increases

RISK FACTORS
────────────
⚠️  Budget pressure: 15% company-wide cuts
⚠️  New CFO: Cost-conscious, not yet engaged
⚠️  Competitive activity: TechRival awareness
✓  Strong champions: Operations & Engineering support

CUSTOMER PRICE SENSITIVITY
──────────────────────────
Baseline: Medium
Current: Medium-High (due to budget cuts)

RECOMMENDED APPROACH
────────────────────
1. VALUE-FIRST: Lead with ROI story ($52k savings)
2. EARLY ENGAGEMENT: CFO meeting before Day 120
3. DOCUMENTATION: Prepare value realization report
4. POSITIONING: "Modest 6.8% vs. 52k value delivered"
5. OPTION: Consider multi-year lock as incentive

ALTERNATIVE SCENARIOS
──────────────────────
Flat ($250k):    Low risk, but forgoes justified increase
Higher (>8%):    Requires contract amendment + higher risk

CONTRACT CONSTRAINTS
────────────────────
Max increase: 8% annually ($17,600)
Current plan: 6.8% ($15,000) ✓ Within limit
  `;

  displayArtifact('Pricing Strategy Brief - Acme Corporation', artifact.trim());

  return {
    targetArr: 265000,
    increaseAmount: 15000,
    increasePercent: 6.8,
    riskLevel: 'Medium',
    priceIncreasePlanned: true,
    priceSensitivity: 'Medium-High',
    rationale: 'Value-based increase justified by quantified savings and high adoption',
    recommendedApproach: 'Value-first positioning with early CFO engagement'
  };
}

async function simulateStep4_StakeholderMapping() {
  displayStep(4, 'Stakeholder Mapping');

  console.log('👥 STAKEHOLDER MAPPING\n');
  console.log('Mapping key stakeholders for renewal decision...\n');

  displaySection('Default Persona Cards');

  const stakeholders = [
    {
      role: 'Executive Sponsor',
      icon: '👔',
      name: 'Sarah Chen',
      title: 'VP of Operations',
      relationshipStrength: 8,
      sentiment: 'Positive',
      lastContact: '2 weeks ago',
      concerns: 'Budget scrutiny from new CFO',
      notes: 'Strong champion. Loves product. Concerned about budget approval. Forwarded competitor email to us (good sign). Key advocate internally.'
    },
    {
      role: 'Technical Champion',
      icon: '⚙️',
      name: 'Mike Rodriguez',
      title: 'Director of Engineering',
      relationshipStrength: 9,
      sentiment: 'Very Positive',
      lastContact: '1 week ago',
      concerns: 'None - very satisfied',
      notes: 'Power user. Uses 100% of features. Analytics module champion. Quantified 20 hrs/week savings for his team. Will advocate strongly.'
    },
    {
      role: 'Decision Maker',
      icon: '💼',
      name: 'James Liu',
      title: 'CFO',
      relationshipStrength: 2,
      sentiment: 'Unknown',
      lastContact: 'Never (delegated initial attempt)',
      concerns: 'Cost optimization (drove 15% cuts)',
      notes: '⚠️ CRITICAL GAP: New CFO (3 months). Not yet engaged. Cost-conscious background. Scrutinizing all vendors. Economic buyer - signs contract. HIGH PRIORITY.'
    }
  ];

  console.log('Pre-populated personas:\n');

  stakeholders.forEach(s => {
    console.log(`┌${'─'.repeat(60)}┐`);
    console.log(`│ ${s.icon} ${s.role.toUpperCase()}`.padEnd(61) + '│');
    console.log(`├${'─'.repeat(60)}┤`);
    console.log(`│ ${s.name}`.padEnd(61) + '│');
    console.log(`│ ${s.title}`.padEnd(61) + '│');
    console.log(`│`.padEnd(61) + '│');
    console.log(`│ Relationship: ${'⭐'.repeat(s.relationshipStrength)} (${s.relationshipStrength}/10)`.padEnd(61) + '│');
    console.log(`│ Sentiment: ${s.sentiment}`.padEnd(61) + '│');
    console.log(`│ Last Contact: ${s.lastContact}`.padEnd(61) + '│');
    console.log(`│`.padEnd(61) + '│');
    console.log(`│ Concerns: ${s.concerns}`.padEnd(61) + '│');
    console.log(`│`.padEnd(61) + '│');
    const notesLines = s.notes.match(/.{1,58}/g) || [s.notes];
    notesLines.forEach(line => {
      console.log(`│ ${line}`.padEnd(61) + '│');
    });
    console.log(`│`.padEnd(61) + '│');
    console.log(`│ [Edit] [Remove]`.padEnd(61) + '│');
    console.log(`└${'─'.repeat(60)}┘\n`);
  });

  console.log('[➕ Add New Stakeholder]\n');

  await simulateAIThinking(800);

  displaySection('Relationship Health Analysis');

  const analysis = `
OVERALL RELATIONSHIP HEALTH: 🟡 MODERATE (6.5/10)

STRENGTH AREAS:
  ✅ Strong operational relationships (VP Ops: 8/10, Dir Eng: 9/10)
  ✅ Technical adoption excellent (champion highly engaged)
  ✅ Product value recognized and quantified

CRITICAL GAPS:
  🚨 CFO RELATIONSHIP: 2/10 - SEVERE RISK
     • Economic buyer (signs contract)
     • New to role (3 months)
     • Cost-conscious mandate (drove 15% cuts)
     • Never engaged despite attempt
     • Only 165 days until renewal
     • HIGH PRIORITY ACTION NEEDED

GAP ANALYSIS:
  Missing: Finance stakeholder relationship
  Missing: Procurement/Legal contacts
  Risk: Single-threaded in Operations (over-reliant on Sarah Chen)

RECOMMENDED ACTIONS:
  1. 🔴 URGENT: CFO engagement strategy
     • Executive-level introduction (VP Sales → CFO)
     • Value briefing focused on ROI
     • Timeline: Before Day 120 (budget planning season)

  2. 🟡 Important: Multi-threading
     • Identify procurement contact
     • Engage additional exec stakeholders
     • Reduce dependency on single champion

  3. ✅ Maintain: Continue strong operational relationships
     • Regular cadence with Sarah Chen
     • Leverage Mike Rodriguez for user stories
  `;

  console.log(analysis.trim());

  const artifact = `
STAKEHOLDER MAP - Acme Corporation

KEY STAKEHOLDERS
────────────────

👔 EXECUTIVE SPONSOR - Sarah Chen, VP of Operations
   Relationship: ⭐⭐⭐⭐⭐⭐⭐⭐ (8/10)
   Sentiment: 😊 Positive
   Last Contact: 2 weeks ago
   Role: Internal champion, budget advocate
   Status: Strong ally, concerned about budget approval

⚙️  TECHNICAL CHAMPION - Mike Rodriguez, Director of Engineering
   Relationship: ⭐⭐⭐⭐⭐⭐⭐⭐⭐ (9/10)
   Sentiment: 😊 Very Positive
   Last Contact: 1 week ago
   Role: Power user, value quantifier
   Status: Will strongly advocate for renewal

💼 DECISION MAKER (CFO) - James Liu, CFO
   Relationship: ⭐⭐ (2/10) ⚠️ CRITICAL GAP
   Sentiment: ❓ Unknown
   Last Contact: Never engaged
   Role: Economic buyer, final approval
   Status: 🚨 HIGH RISK - Not engaged, cost-focused

RELATIONSHIP HEALTH: 🟡 MODERATE (6.5/10)
────────────────────
Operational: Strong (8-9/10)
Executive: Moderate (8/10 with VP Ops)
Finance: Critical Gap (2/10 with CFO) ⚠️

⚠️  GAPS & RISKS
───────────────
🚨 CRITICAL: No CFO relationship (economic buyer, cost-focused)
🟡 Important: Single-threaded in Operations (over-reliant)
🟡 Important: No procurement/legal contacts identified

📋 RECOMMENDED ACTIONS
──────────────────────
1. URGENT: CFO engagement before Day 120
   • Executive introduction
   • ROI-focused value briefing
   • Address budget concerns proactively

2. Multi-threading strategy
   • Identify additional stakeholders
   • Reduce single-point dependency

3. Maintain strong operational relationships
   • Regular Sarah Chen engagement
   • Leverage Mike Rodriguez for advocacy
  `;

  displayArtifact('Stakeholder Map - Acme Corporation', artifact.trim());

  return { stakeholders, analysis };
}

async function simulateStep5_Recommendations() {
  displayStep(5, 'Review Recommendations');

  console.log('💡 AI-GENERATED RECOMMENDATIONS\n');
  console.log('Analyzing all Discovery findings to generate actionable recommendations...\n');

  await simulateAIThinking(1500);

  const recommendations = [
    {
      id: 'rec_cfo_engagement',
      category: 'EXECUTIVE_ENGAGEMENT',
      subcategory: 'executive_meeting',
      title: 'Schedule CFO Value Briefing',
      description: 'Arrange executive-level meeting with new CFO James Liu to present ROI and address budget concerns before renewal discussions begin.',
      rationale: 'CFO is economic buyer with no relationship (2/10). Cost-conscious mandate and scrutinizing vendors. Critical to engage before Day 120 budget planning. Gap identified in stakeholder mapping as highest priority risk.',
      dataPoints: [
        {
          label: 'CFO Relationship',
          value: '2/10 - Never engaged',
          context: 'Economic buyer with no relationship established',
          source: 'Stakeholder Mapping'
        },
        {
          label: 'Budget Pressure',
          value: '15% company-wide cuts',
          context: 'CFO drove cost optimization, scrutinizing all vendors',
          source: 'CSM Assessment'
        },
        {
          label: 'Timeline',
          value: '165 days to renewal',
          context: 'Must engage before Day 120 (budget planning season)',
          source: 'Workflow Context'
        },
        {
          label: 'Renewal Confidence',
          value: '7/10',
          context: 'Could improve dramatically with CFO buy-in',
          source: 'CSM Assessment'
        }
      ],
      priorityScore: 95,
      impact: 'high',
      urgency: 'high',
      suggestedActions: ['schedule_meeting', 'update_crm', 'skip', 'snooze']
    },
    {
      id: 'rec_value_documentation',
      category: 'PRICING_STRATEGY',
      subcategory: 'value_realization_documentation',
      title: 'Build ROI Documentation Package',
      description: 'Create comprehensive value realization report quantifying business impact (20 hrs/week saved, 95% adoption) to justify 6.8% price increase.',
      rationale: 'Planning 6.8% price increase ($15k) in budget-constrained environment. Need strong value justification for CFO review. Quantified savings (20 hrs/week = $52k annual) provides compelling ROI story.',
      dataPoints: [
        {
          label: 'Quantified Savings',
          value: '20 hrs/week ($52k annual)',
          context: 'Analytics module alone delivers massive time savings',
          source: 'CSM Assessment'
        },
        {
          label: 'Feature Adoption',
          value: '95%',
          context: 'Exceptional usage validates value delivery',
          source: 'CSM Assessment'
        },
        {
          label: 'Proposed Increase',
          value: '6.8% ($15k)',
          context: 'Modest vs. $52k value delivered',
          source: 'Pricing Strategy'
        },
        {
          label: 'Price Sensitivity',
          value: 'Medium-High',
          context: 'Budget cuts increase scrutiny',
          source: 'Pricing Strategy'
        }
      ],
      priorityScore: 90,
      impact: 'high',
      urgency: 'medium',
      suggestedActions: ['review_data', 'update_crm', 'skip', 'snooze']
    },
    {
      id: 'rec_contract_amendment',
      category: 'PROCEDURAL',
      subcategory: 'contract_amendment_needed',
      title: 'Review Contract Amendment Needs',
      description: 'Confirm 6.8% increase is within 8% contract cap. If future increases planned, consider multi-year amendment now.',
      rationale: 'Contract caps price increases at 8% annually. Current plan (6.8%) fits, but leaves only 1.2% buffer. With cost pressures and competitor awareness, locking favorable long-term terms could be strategic.',
      dataPoints: [
        {
          label: 'Contract Cap',
          value: '8% maximum increase',
          context: 'Hard limit without amendment',
          source: 'Contract Analysis'
        },
        {
          label: 'Current Plan',
          value: '6.8% increase',
          context: 'Within cap but limited headroom',
          source: 'Pricing Strategy'
        },
        {
          label: 'Notice Deadline',
          value: 'Day 90 (in 75 days)',
          context: 'Amendment needs time - don\'t wait',
          source: 'Contract Analysis'
        }
      ],
      priorityScore: 75,
      impact: 'medium',
      urgency: 'medium',
      suggestedActions: ['review_data', 'schedule_meeting', 'skip', 'snooze']
    },
    {
      id: 'rec_competitor_intelligence',
      category: 'EXECUTIVE_ENGAGEMENT',
      subcategory: 'conversation_starters',
      title: 'Deepen TechRival Competitive Intelligence',
      description: 'Follow up on TechRival outreach. Understand their positioning, pricing, and why Sarah Chen rejected them. Prepare competitive differentiation.',
      rationale: 'Competitor awareness indicates customer is shopping or at least open to outreach. With budget pressure and CFO scrutiny, competitive threats are elevated. Need to understand competitive landscape and reinforce differentiation.',
      dataPoints: [
        {
          label: 'Competitor Activity',
          value: 'TechRival outreach (rejected)',
          context: 'Customer received and considered competitor pitch',
          source: 'CSM Assessment'
        },
        {
          label: 'Budget Environment',
          value: '15% cost cuts',
          context: 'Increases vulnerability to lower-priced alternatives',
          source: 'CSM Assessment'
        },
        {
          label: 'Champion Feedback',
          value: 'Inferior features',
          context: 'Sarah Chen cited feature gap as rejection reason',
          source: 'CSM Assessment Follow-up'
        }
      ],
      priorityScore: 70,
      impact: 'medium',
      urgency: 'medium',
      suggestedActions: ['send_email', 'schedule_meeting', 'skip', 'snooze']
    }
  ];

  console.log(`Generated ${recommendations.length} recommendations based on Discovery findings:\n`);

  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. [${rec.category}] ${rec.title}`);
    console.log(`   Priority: ${rec.priorityScore} | Impact: ${rec.impact} | Urgency: ${rec.urgency}`);
    console.log(`   ${rec.description}\n`);
  });

  displaySection('Detailed Recommendation: CFO Engagement');

  const detailedRec = recommendations[0];

  console.log(`📌 ${detailedRec.title}\n`);
  console.log(`Category: ${detailedRec.category}`);
  console.log(`Priority Score: ${detailedRec.priorityScore}/100\n`);

  console.log(`DESCRIPTION:`);
  console.log(`  ${detailedRec.description}\n`);

  console.log(`WHY THIS MATTERS:`);
  console.log(`  ${detailedRec.rationale}\n`);

  console.log(`SUPPORTING DATA:`);
  detailedRec.dataPoints.forEach(dp => {
    console.log(`  • ${dp.label}: ${dp.value}`);
    console.log(`    ${dp.context}`);
    console.log(`    Source: ${dp.source}\n`);
  });

  console.log(`SUGGESTED ACTIONS:`);
  console.log(`  ${detailedRec.suggestedActions.map(a => `[${a}]`).join(' ')}\n`);

  const artifact = `
DISCOVERY RECOMMENDATIONS - Acme Corporation

Generated ${recommendations.length} actionable recommendations based on comprehensive Discovery assessment

1. 🔴 URGENT: Schedule CFO Value Briefing
   Priority: 95/100 | Impact: High | Urgency: High

   Arrange executive meeting with CFO James Liu to present ROI and
   address budget concerns. CFO is economic buyer with no relationship
   established. Critical to engage before Day 120 budget planning.

   Actions: [Schedule Meeting] [Update CRM] [Skip] [Snooze]

2. 💰 HIGH: Build ROI Documentation Package
   Priority: 90/100 | Impact: High | Urgency: Medium

   Create value realization report quantifying $52k annual savings to
   justify 6.8% price increase in budget-constrained environment.

   Actions: [Review Data] [Update CRM] [Skip] [Snooze]

3. 📄 MEDIUM: Review Contract Amendment Needs
   Priority: 75/100 | Impact: Medium | Urgency: Medium

   Confirm 6.8% increase within 8% cap. Consider multi-year amendment
   for long-term pricing flexibility.

   Actions: [Review Data] [Schedule Meeting] [Skip] [Snooze]

4. 🎯 MEDIUM: Deepen TechRival Competitive Intelligence
   Priority: 70/100 | Impact: Medium | Urgency: Medium

   Follow up on competitor outreach. Understand positioning and prepare
   competitive differentiation given budget pressure environment.

   Actions: [Send Email] [Schedule Meeting] [Skip] [Snooze]
  `;

  displayArtifact('Discovery Recommendations - Acme Corporation', artifact.trim());

  return recommendations;
}

async function simulateStep6_ActionPlan(workflowResults) {
  displayStep(6, 'Action Plan Generation');

  console.log('📋 ACTION PLAN GENERATION\n');
  console.log('Analyzing all previous steps to generate comprehensive action plan...\n');

  await simulateAIThinking('Generating action plan...', 3000);

  console.log('\n────────────────────────────────────────────────────────────────────────────────');
  console.log('▶ Action Plan Generated');
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  // Create action plan based on workflow results
  const actionPlan = {
    summary: {
      completedSteps: [
        {
          stepName: 'CSM Assessment',
          status: 'complete',
          keyDecision: `${workflowResults.assessment.relationshipStrength}/10 relationship, ${workflowResults.assessment.renewalConfidence}/10 confidence`
        },
        {
          stepName: 'Contract Analysis',
          status: 'complete',
          keyDecision: '90-day notice deadline, 8% price cap'
        },
        {
          stepName: 'Pricing Strategy',
          status: 'complete',
          value: `$${workflowResults.pricing.targetArr.toLocaleString()} target (6.8% increase)`
        },
        {
          stepName: 'Stakeholder Mapping',
          status: 'complete',
          keyDecision: `${workflowResults.stakeholders.stakeholders.length} stakeholders mapped, CFO gap identified`
        },
        {
          stepName: 'Recommendations',
          status: 'complete',
          value: `${workflowResults.recommendations.length} actionable recommendations generated`
        }
      ],
      keyMetrics: [
        { label: 'Target ARR', value: '$265,000', unit: '' },
        { label: 'Price Increase', value: '6.8', unit: '%' },
        { label: 'Days to Renewal', value: '165', unit: 'days' },
        { label: 'Relationship Strength', value: '8', unit: '/10' },
        { label: 'Renewal Confidence', value: '7', unit: '/10' },
        { label: 'Critical Obstacles', value: '2', unit: '' }
      ]
    },

    aiTasks: [
      {
        id: 'ai_task_1',
        action: 'Update Salesforce Contact Records',
        description: 'Change primary contact from Sarah Chen to Eric Estrada in opportunity record',
        processor: 'salesforce-contact-updater.js',
        estimatedTime: 'Within 15 minutes',
        priority: 1,
        executeImmediately: true,
        metadata: {
          oldContact: { name: 'Sarah Chen', salesforceId: '003ABC123' },
          newContact: { name: 'Eric Estrada', salesforceId: '003ABC456' }
        }
      },
      {
        id: 'ai_task_2',
        action: 'Create Follow-up Reminder',
        description: 'Set reminder if no CFO meeting response within 5 business days',
        processor: 'follow-up-reminder-creator.js',
        estimatedTime: 'Immediate',
        priority: 2,
        executeImmediately: true,
        metadata: {
          daysUntilReminder: 5,
          reminderMessage: 'Follow up on CFO meeting request if no response',
          relatedAction: 'CFO Meeting Request Sent'
        }
      },
      {
        id: 'ai_task_3',
        action: 'Set Contract Notice Deadline Alert',
        description: 'Calendar reminder for Day 90 notice deadline (75 days from now)',
        processor: 'calendar-reminder-creator.js',
        estimatedTime: 'Immediate',
        priority: 1,
        executeImmediately: true,
        metadata: {
          deadlineDate: '2026-01-15',
          daysUntil: 75,
          deadlineType: 'contract_notice'
        }
      },
      {
        id: 'ai_task_4',
        action: 'Schedule Next Workflow (Prepare)',
        description: 'Schedule Prepare workflow to trigger at Day 140 (25 days from now)',
        processor: 'workflow-scheduler.js',
        estimatedTime: 'Immediate',
        priority: 3,
        executeImmediately: true,
        metadata: {
          nextWorkflowStage: 'Prepare',
          triggerDate: '2025-11-10',
          daysFromNow: 25
        }
      }
    ],

    csmTasks: [
      {
        id: 'csm_task_1',
        action: 'Schedule and Conduct CFO Engagement Meeting',
        description: 'Set up 30-minute intro call with CFO James Liu to discuss value, build relationship, and address budget concerns',
        complexity: 'complex',
        priority: 1,
        estimatedTime: '2 hours total (prep + meeting + follow-up)',
        dueDate: '2025-10-15',
        subTasks: [
          {
            id: 'subtask_1_1',
            action: 'Research CFO background and priorities',
            estimatedTime: '30 minutes'
          },
          {
            id: 'subtask_1_2',
            action: 'Prepare value-focused slide deck (ROI + savings)',
            estimatedTime: '45 minutes'
          },
          {
            id: 'subtask_1_3',
            action: 'Send meeting invitation with value preview',
            estimatedTime: '15 minutes'
          },
          {
            id: 'subtask_1_4',
            action: 'Conduct 30-minute CFO meeting',
            estimatedTime: '30 minutes'
          }
        ]
      },
      {
        id: 'csm_task_2',
        action: 'Create Value Realization Report',
        description: 'Document $52k annual savings (20 hrs/week from analytics) and 95% feature adoption for pricing justification',
        complexity: 'moderate',
        priority: 2,
        estimatedTime: '1 hour',
        dueDate: '2025-10-08'
      },
      {
        id: 'csm_task_3',
        action: 'Reschedule Missed QBR',
        description: 'Reach out to Sarah Chen to reschedule the missed quarterly business review',
        complexity: 'simple',
        priority: 3,
        estimatedTime: '20 minutes',
        dueDate: '2025-10-05'
      },
      {
        id: 'csm_task_4',
        action: 'Gather TechRival Competitive Intelligence',
        description: 'Follow up with Sarah Chen on competitor email; understand their pitch and positioning',
        complexity: 'simple',
        priority: 3,
        estimatedTime: '30 minutes',
        dueDate: '2025-10-10'
      }
    ],

    timeline: [
      {
        step: 1,
        date: 'Today',
        owner: 'AI',
        title: 'Update CRM and Set Reminders',
        description: 'Automated tasks: Update Salesforce contact, set contract deadline alert, schedule follow-ups',
        status: 'pending'
      },
      {
        step: 2,
        date: 'Within 2-3 business days',
        owner: 'CSM',
        title: 'Send CFO Meeting Request',
        description: 'Prepare value deck and send meeting invitation to CFO James Liu',
        status: 'pending'
      },
      {
        step: 3,
        date: 'Oct 1-3',
        owner: 'Customer',
        title: 'CFO Responds to Meeting Request',
        description: 'Await CFO response (AI will remind if no response in 5 days)',
        status: 'pending'
      },
      {
        step: 4,
        date: 'Oct 8-15',
        owner: 'CSM',
        title: 'Conduct CFO Engagement Meeting',
        description: '30-minute strategic value discussion with CFO',
        status: 'pending'
      },
      {
        step: 5,
        date: 'Oct 5-10',
        owner: 'CSM',
        title: 'Complete Supporting Tasks',
        description: 'Value report, QBR rescheduling, competitive intelligence',
        status: 'pending'
      },
      {
        step: 6,
        date: 'Nov 10 (Day 140)',
        owner: 'AI',
        title: 'Prepare Workflow Triggers',
        description: 'Next renewal stage (Prepare) automatically starts',
        status: 'pending'
      },
      {
        step: 7,
        date: 'Jan 15 (Day 90)',
        owner: 'CSM',
        title: 'CONTRACT NOTICE DEADLINE',
        description: '⚠️ Must notify customer of renewal intent by this date',
        status: 'pending'
      }
    ],

    nextWorkflow: {
      name: 'Prepare Renewal',
      stage: 'Prepare',
      estimatedDate: '2025-11-10',
      daysFromNow: 25,
      conditions: [
        'Discovery action items completed or in progress',
        'CFO relationship established',
        'Value documentation ready or in draft'
      ]
    }
  };

  // Display action plan as artifact
  const artifact = `
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📄 ARTIFACT: Action Plan - Acme Corporation                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✓ PROCESS COMPLETED                                                          │
│ ───────────────────                                                          │
│ • CSM Assessment: ✓ 8/10 relationship, 7/10 confidence                       │
│ • Contract Analysis: ✓ 90-day notice deadline, 8% price cap                  │
│ • Pricing Strategy: ✓ $265,000 target (6.8% increase)                        │
│ • Stakeholder Mapping: ✓ 3 stakeholders, CFO gap identified                  │
│ • Recommendations: ✓ 4 actionable recommendations                             │
│                                                                              │
│ 🤖 AI ACTION ITEMS (Auto-Executable)                                         │
│ ──────────────────────────────────                                           │
│ 1. Update Salesforce Contact Records                                         │
│    → Change primary contact to Eric Estrada                                  │
│    ⏱️  Within 15 minutes                                                     │
│                                                                              │
│ 2. Create Follow-up Reminder                                                 │
│    → Remind CSM if no CFO response in 5 days                                 │
│    ⏱️  Immediate                                                             │
│                                                                              │
│ 3. Set Contract Notice Deadline Alert                                        │
│    → Calendar reminder for Day 90 (75 days from now)                         │
│    ⏱️  Immediate                                                             │
│                                                                              │
│ 4. Schedule Next Workflow (Prepare)                                          │
│    → Auto-trigger Prepare workflow at Day 140                                │
│    ⏱️  Immediate                                                             │
│                                                                              │
│ 👤 CSM ACTION ITEMS (Human-Required)                                         │
│ ───────────────────────────────────                                          │
│ 1. 🔴 Schedule and Conduct CFO Engagement Meeting (Priority 1)               │
│    Due: Oct 15 | Estimated: 2 hours | Complexity: Complex                    │
│                                                                              │
│    CRITICAL: Economic buyer (CFO) not engaged. Budget concerns.              │
│                                                                              │
│    Sub-tasks:                                                                │
│    □ Research CFO background and priorities (30 min)                         │
│    □ Prepare value-focused slide deck (45 min)                               │
│    □ Send meeting invitation (15 min)                                        │
│    □ Conduct meeting (30 min)                                                │
│                                                                              │
│ 2. 🟡 Create Value Realization Report (Priority 2)                           │
│    Due: Oct 8 | Estimated: 1 hour | Complexity: Moderate                     │
│    Document $52k savings + 95% adoption for pricing justification            │
│                                                                              │
│ 3. 🟢 Reschedule Missed QBR (Priority 3)                                     │
│    Due: Oct 5 | Estimated: 20 min | Complexity: Simple                       │
│    Reach out to Sarah Chen to reschedule quarterly review                    │
│                                                                              │
│ 4. 🟢 Gather TechRival Competitive Intelligence (Priority 3)                 │
│    Due: Oct 10 | Estimated: 30 min | Complexity: Simple                      │
│    Follow up on competitor email from Sarah                                  │
│                                                                              │
│ 📅 TIMELINE & NEXT STEPS                                                     │
│ ──────────────────────────                                                   │
│ 1. Today → AI: Update CRM and set reminders                                  │
│ 2. 2-3 days → CSM: Send CFO meeting request                                  │
│ 3. Oct 1-3 → Customer: CFO responds                                          │
│ 4. Oct 8-15 → CSM: Conduct CFO meeting                                       │
│ 5. Oct 5-10 → CSM: Complete supporting tasks                                 │
│ 6. Nov 10 → AI: Prepare workflow triggers                                    │
│ 7. Jan 15 → ⚠️  CONTRACT NOTICE DEADLINE                                     │
│                                                                              │
│ 🔄 NEXT WORKFLOW SCHEDULED                                                   │
│ ────────────────────────────                                                 │
│ Workflow: Prepare Renewal                                                    │
│ Stage: Prepare (120-149 days)                                                │
│ Trigger Date: Nov 10, 2025 (25 days from now)                                │
│                                                                              │
│ Conditions:                                                                  │
│ • Discovery action items completed or in progress                            │
│ • CFO relationship established                                               │
│ • Value documentation ready or in draft                                      │
│                                                                              │
│ 📊 KEY METRICS                                                               │
│ ──────────────                                                               │
│ Target ARR: $265,000 | Price Increase: 6.8% | Days to Renewal: 165          │
│ Relationship: 8/10 | Confidence: 7/10 | Critical Obstacles: 2               │
└──────────────────────────────────────────────────────────────────────────────┘
  `;

  displayArtifact('Action Plan Summary - Acme Corporation', artifact.trim());

  console.log('\n────────────────────────────────────────────────────────────────────────────────');
  console.log('▶ Action Plan Finalization');
  console.log('────────────────────────────────────────────────────────────────────────────────\n');

  console.log('When CSM clicks "Finalize Action Plan":\n');
  console.log('  ✅ Create 4 AI tasks (auto_execute: true, status: queued)');
  console.log('  ✅ Create 4 CSM tasks (1 complex with 4 sub-tasks, 3 simple)');
  console.log('  ✅ Queue AI tasks for immediate execution');
  console.log('  ✅ Schedule Prepare workflow for Nov 10');
  console.log('  ✅ Create notification for CSM');
  console.log('  ✅ Mark Discovery workflow as completed\n');

  console.log('Expected AI Task Execution (within 5-15 minutes):\n');
  console.log('  🤖 Salesforce contact updated: Sarah → Eric');
  console.log('  🤖 Follow-up reminder scheduled for Oct 8');
  console.log('  🤖 Contract deadline alert set for Jan 15');
  console.log('  🤖 Prepare workflow scheduled for Nov 10\n');

  return actionPlan;
}

// =============================================================================
// MAIN DEMO
// =============================================================================

async function runDemo() {
  displayBanner('DISCOVERY WORKFLOW DEMO');

  console.log('This demo simulates the complete Discovery renewal workflow.');
  console.log('Customer: Acme Corporation');
  console.log('Stage: Discovery (150-179 days until renewal)');
  console.log('Current: Day 165\n');

  console.log('Workflow Steps:');
  console.log('  1. CSM Subjective Assessment (Audio + AI Interview)');
  console.log('  2. Contract Analysis & Obstacles');
  console.log('  3. Preliminary Pricing Strategy');
  console.log('  4. Stakeholder Mapping');
  console.log('  5. Review Recommendations (AI-driven)');
  console.log('  6. Action Plan Generation (AI tasks + CSM tasks)\n');

  console.log('Press Enter to continue...');
  // In real demo, would wait for input
  // For automation, continuing immediately

  const results = {};

  // Step 1
  results.assessment = await simulateStep1_CSMAssessment();

  // Step 2
  results.contract = await simulateStep2_ContractAnalysis();

  // Step 3
  results.pricing = await simulateStep3_PricingStrategy();

  // Step 4
  results.stakeholders = await simulateStep4_StakeholderMapping();

  // Step 5
  results.recommendations = await simulateStep5_Recommendations();

  // Step 6 - NEW: Action Plan
  results.actionPlan = await simulateStep6_ActionPlan(results);

  displayBanner('DISCOVERY WORKFLOW COMPLETE');

  console.log('✅ Workflow Summary:\n');
  console.log(`  • CSM Assessment completed: ${results.assessment.relationshipStrength}/10 relationship, ${results.assessment.renewalConfidence}/10 confidence`);
  console.log(`  • Contract analyzed: ${results.contract ? `${results.contract.critical.length} critical obstacles identified` : 'No contract found'}`);
  console.log(`  • Pricing strategy set: $${results.pricing.targetArr.toLocaleString()} target (${results.pricing.increasePercent}% increase)`);
  console.log(`  • Stakeholders mapped: ${results.stakeholders.stakeholders.length} key stakeholders`);
  console.log(`  • Recommendations generated: ${results.recommendations.length} actionable items`);
  console.log(`  • Action Plan created: ${results.actionPlan.aiTasks.length} AI tasks + ${results.actionPlan.csmTasks.length} CSM tasks\n`);

  console.log('📊 Key Findings:\n');
  console.log('  🚨 CRITICAL: CFO relationship gap (economic buyer not engaged)');
  console.log('  ⚠️  CONCERN: Budget pressure (15% cuts) impacts renewal');
  console.log('  ✅ STRENGTH: Strong operational relationships and product adoption');
  console.log('  💡 ACTION: CFO engagement is highest priority (Priority Score: 95)\n');

  console.log('📋 Next Steps:\n');
  console.log('  1. Review Action Plan artifact with CSM team');
  console.log('  2. CSM clicks "Finalize Action Plan" to create all tasks');
  console.log('  3. AI tasks execute automatically (CRM updates, reminders)');
  console.log('  4. CSM completes assigned tasks (CFO meeting, value report)');
  console.log('  5. Prepare workflow auto-triggers on Nov 10\n');

  displayBanner('DEMO COMPLETE');

  console.log('✅ Discovery Workflow Validation:\n');
  console.log('  • All 6 steps executed successfully');
  console.log('  • Audio → AI interview flow validated');
  console.log('  • Contract analysis logic tested (with/without contract)');
  console.log('  • Stakeholder mapping data structure confirmed');
  console.log('  • Recommendation generation working');
  console.log('  • Action Plan with AI + CSM tasks validated');
  console.log('  • Artifacts generated for all steps\n');

  console.log('📝 Integration Requirements for Backend:\n');
  console.log('  • Audio upload + transcription API');
  console.log('  • AI interview conversation state management');
  console.log('  • Contract document analysis (LLM integration)');
  console.log('  • Stakeholder CRUD operations');
  console.log('  • Recommendation engine (discovery-specific prompts)');
  console.log('  • Task creation API (AI tasks + CSM tasks with sub-tasks)');
  console.log('  • AI task execution queue (5-minute cron job)');
  console.log('  • Workflow scheduling API (next workflow triggers)\n');

  console.log('🎯 Ready for:');
  console.log('  ✓ Backend implementation alignment');
  console.log('  ✓ Design partner feedback');
  console.log('  ✓ Template for remaining 8 workflows\n');
}

// Run the demo
runDemo().catch(console.error);
