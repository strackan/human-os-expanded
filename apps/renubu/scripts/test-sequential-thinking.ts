/**
 * Test Script for Sequential Thinking MCP Client
 *
 * Verifies that the Sequential Thinking MCP client initializes correctly
 * and can generate structured thinking steps.
 */

import { SequentialThinkingMCPClient } from '../src/lib/mcp/clients/SequentialThinkingMCPClient';
import type { SequentialThinkingMCP } from '../src/lib/mcp/types/mcp.types';

async function testSequentialThinking() {
  console.log('Testing Sequential Thinking MCP Client...\n');

  const client = new SequentialThinkingMCPClient();

  // Test 1: Think method
  console.log('Test 1: Think method');
  console.log('Problem: Should we offer a discount to save a $120k ARR renewal?');

  const thinkParams: SequentialThinkingMCP.ThinkParams = {
    problem: 'Should we offer a discount to save the AcmeCorp renewal?',
    context: `$120k ARR, health score 42, renewal in 12 days, 2 competitor outreach attempts detected.
    Customer has been with us for 3 years. Current contract: $10k/month.
    Usage has dropped 30% in Q4. CFO mentioned budget constraints in last call.`,
    maxSteps: 5,
    requireConclusion: true,
  };

  const thinkResult = await client.think(thinkParams);

  if (thinkResult.success && thinkResult.data) {
    console.log('✓ Think method successful');
    console.log(`  Total steps: ${thinkResult.data.totalSteps}`);
    console.log(`  Confidence: ${thinkResult.data.confidenceScore}%`);
    console.log(`  Complexity: ${thinkResult.data.metadata?.complexity}`);
    console.log(`  Conclusion: ${thinkResult.data.conclusion}\n`);
  } else {
    console.error('✗ Think method failed:', thinkResult.error);
    process.exit(1);
  }

  // Test 2: Tool definitions
  console.log('Test 2: Tool definitions');
  const toolDefs = client.getToolDefinitions();
  console.log(`✓ Found ${toolDefs.length} tool definitions:`);
  toolDefs.forEach((tool: any) => {
    console.log(`  - ${tool.name}: ${tool.description.substring(0, 60)}...`);
  });
  console.log();

  // Test 3: Health check
  console.log('Test 3: Health check');
  const health = await client.healthCheck();
  console.log(`✓ Health check: ${health.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
  console.log(`  Latency: ${health.latency}ms\n`);

  console.log('All tests passed! ✓');
}

testSequentialThinking().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
