/**
 * Recommendation Engine
 *
 * Core LLM-based recommendation generation system.
 * Analyzes customer context and generates actionable recommendations
 * based on workflow stage and available data.
 */

const { getValidRecommendationTypes } = require('./recommendation-types');
const { RecommendationStatus } = require('./workflow-types');

/**
 * Generate recommendations for a customer at a specific workflow stage
 *
 * @param {Object} params - Generation parameters
 * @param {string} params.customerId - Customer ID
 * @param {string} params.workflowId - Workflow ID (e.g., 'monitor', 'prepare')
 * @param {Object} params.customerContext - Full customer context (from Active)
 * @param {Object} params.historicalActions - Previous recommendations and actions
 * @returns {Promise<Array<Recommendation>>} Array of recommendations (may be empty)
 */
async function generateRecommendations({
  customerId,
  workflowId,
  customerContext,
  historicalActions = []
}) {
  // Get valid recommendation types for this workflow stage
  const validTypes = getValidRecommendationTypes(workflowId);

  if (validTypes.length === 0) {
    console.log(`No valid recommendation types for workflow: ${workflowId}`);
    return [];
  }

  // Build LLM prompt
  const prompt = buildRecommendationPrompt({
    workflowId,
    customerContext,
    validTypes,
    historicalActions
  });

  // TODO: Call LLM (Claude) to analyze and generate recommendations
  // For now, return stub structure
  const llmResponse = await callLLM(prompt);

  // Parse LLM response into structured recommendations
  const recommendations = parseLLMRecommendations(llmResponse, customerId, workflowId);

  // Filter out low-priority recommendations (priorityScore < threshold)
  const actionableRecommendations = recommendations.filter(
    rec => rec.priorityScore >= 30 // Only surface if score >= 30
  );

  // Sort by priority score (descending)
  actionableRecommendations.sort((a, b) => b.priorityScore - a.priorityScore);

  return actionableRecommendations;
}

/**
 * Build LLM prompt for recommendation generation
 */
function buildRecommendationPrompt({ workflowId, customerContext, validTypes, historicalActions }) {
  const validTypesText = validTypes
    .map(t => `  - ${t.category}.${t.subcategory}: ${t.description}`)
    .join('\n');

  const historicalActionsText = historicalActions.length > 0
    ? historicalActions.map(a => `  - ${a.date}: ${a.action} (${a.recommendation})`).join('\n')
    : '  None';

  return `
You are analyzing a customer for renewal workflow recommendations.

WORKFLOW STAGE: ${workflowId}
CUSTOMER: ${customerContext.customer.name}
ARR: $${customerContext.customer.arr}
RENEWAL DATE: ${customerContext.customer.renewalDate}
DAYS UNTIL RENEWAL: ${customerContext.workflow.daysUntilRenewal}

CUSTOMER HEALTH:
- Health Score: ${customerContext.intelligence.healthScore}/100
- Risk Score: ${customerContext.intelligence.riskScore}/100
- Trend: ${customerContext.intelligence.trend}

USAGE DATA:
- Utilization Rate: ${customerContext.data.usage.utilizationRate}%
- Trend: ${customerContext.data.usage.trend} (${customerContext.data.usage.changePercent}%)
- Feature Adoption: ${JSON.stringify(customerContext.data.usage.featureAdoption)}

ENGAGEMENT:
- Last Meeting: ${customerContext.data.engagement.lastMeeting}
- Meeting Frequency: ${customerContext.data.engagement.meetingFrequency}
- Support Tickets: ${customerContext.data.engagement.supportTickets}

HISTORICAL ACTIONS (last 90 days):
${historicalActionsText}

VALID RECOMMENDATION TYPES for this workflow stage:
${validTypesText}

TASK:
Generate 0-5 recommendations for this customer. Only generate recommendations that are:
1. Highly actionable and specific
2. Supported by data points from the context above
3. Appropriate for the ${workflowId} workflow stage
4. NOT redundant with recent historical actions

For each recommendation, provide:
{
  "category": "FEATURE_ADOPTION | EXECUTIVE_ENGAGEMENT | PRICING_STRATEGY | PROCEDURAL",
  "subcategory": "<specific subcategory from valid types>",
  "title": "<short title (5-8 words)>",
  "description": "<1-2 sentence description of the recommendation>",
  "rationale": "<why this matters now, given the data>",
  "dataPoints": [
    {
      "label": "<data point label>",
      "value": "<value>",
      "context": "<why this data point matters>",
      "source": "<field from context, e.g., data.usage.trend>"
    }
  ],
  "impact": "low | medium | high",
  "urgency": "low | medium | high",
  "suggestedActions": ["send_email", "schedule_meeting", "skip", "snooze"]
}

Return a JSON array of recommendations. If no strong recommendations exist, return an empty array [].
Do not generate weak or generic recommendations just to fill space.
`;
}

/**
 * Call LLM (Claude) to analyze and generate recommendations
 * TODO: Implement actual API call to Claude
 */
async function callLLM(prompt) {
  // STUB: This will eventually call Claude API
  // For now, return mock response for testing

  console.log('[STUB] Would call LLM with prompt:', prompt.substring(0, 200) + '...');

  // Mock response - in real implementation, this comes from Claude
  return JSON.stringify([
    {
      category: 'FEATURE_ADOPTION',
      subcategory: 'underutilized_feature',
      title: 'Highlight Advanced Analytics Module',
      description: 'Customer is paying for Advanced Analytics but only using basic reports. Opportunity to demonstrate value and increase engagement.',
      rationale: 'Usage data shows customer spends 12 hrs/month on manual reporting. Advanced Analytics could automate 80% of this work.',
      dataPoints: [
        {
          label: 'Manual Reporting Time',
          value: '12 hrs/month',
          context: 'Time spent creating reports manually',
          source: 'data.usage.reportingTime'
        },
        {
          label: 'Advanced Analytics Adoption',
          value: '5%',
          context: 'Only using basic features',
          source: 'data.usage.featureAdoption.advancedAnalytics'
        }
      ],
      impact: 'high',
      urgency: 'medium',
      suggestedActions: ['send_email', 'schedule_meeting', 'skip', 'snooze']
    }
  ]);
}

/**
 * Parse LLM response into structured Recommendation objects
 */
function parseLLMRecommendations(llmResponse, customerId, workflowId) {
  try {
    const recommendations = JSON.parse(llmResponse);

    return recommendations.map(rec => {
      // Calculate priority score from impact + urgency
      const priorityScore = calculatePriorityScore(rec.impact, rec.urgency);

      return {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        customerId,
        category: rec.category,
        subcategory: rec.subcategory,
        title: rec.title,
        description: rec.description,
        rationale: rec.rationale,
        dataPoints: rec.dataPoints || [],
        priorityScore,
        impact: rec.impact,
        urgency: rec.urgency,
        suggestedActions: rec.suggestedActions || ['skip', 'snooze'],
        createdAt: new Date(),
        status: RecommendationStatus.PENDING
      };
    });
  } catch (error) {
    console.error('Failed to parse LLM recommendations:', error);
    return [];
  }
}

/**
 * Calculate priority score from impact and urgency
 */
function calculatePriorityScore(impact, urgency) {
  const impactScores = { low: 20, medium: 50, high: 80 };
  const urgencyScores = { low: 10, medium: 30, high: 50 };

  const impactValue = impactScores[impact] || 20;
  const urgencyValue = urgencyScores[urgency] || 10;

  // Simple additive model for now
  // Could be more sophisticated: (impact * urgency) / 2, etc.
  return Math.min(100, impactValue + urgencyValue);
}

/**
 * Evaluate whether a workflow should be created based on recommendations
 * (Used as pre-flight check before creating workflow instance)
 *
 * @param {Object} params - Evaluation parameters
 * @returns {Promise<Object>} { shouldCreate: boolean, recommendations: Array }
 */
async function shouldCreateWorkflow({
  customerId,
  workflowId,
  customerContext,
  historicalActions
}) {
  const recommendations = await generateRecommendations({
    customerId,
    workflowId,
    customerContext,
    historicalActions
  });

  return {
    shouldCreate: recommendations.length > 0,
    recommendations,
    reason: recommendations.length > 0
      ? `${recommendations.length} actionable recommendation(s) generated`
      : 'No actionable recommendations at this time'
  };
}

module.exports = {
  generateRecommendations,
  shouldCreateWorkflow,
  calculatePriorityScore
};
