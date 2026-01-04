/**
 * Test streaming conversation capture
 *
 * This script tests that streaming Claude API calls are captured.
 * Usage: ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/test-streaming-capture.ts
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variable for service key
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zulowgscotdrqlccomht.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

async function testStreamingCapture() {
  console.log('=== Phase 2 Streaming Capture Test ===\n');

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    console.log('No API key provided - running simulated streaming test\n');
    return runSimulatedTest();
  }

  console.log('API key found - running live streaming test\n');
  return runLiveTest(apiKey);
}

async function runSimulatedTest() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Import capture functions
  const { queueCapture, generateConversationId } = await import('../packages/proxy/dist/capture.js');

  const conversationId = generateConversationId();
  console.log(`1. Simulating streaming capture...`);
  console.log(`   Conversation ID: ${conversationId}`);

  // Simulate streaming chunks
  const chunks = ['Hello', '! ', 'This ', 'is ', 'a ', 'streaming ', 'test.'];
  let accumulated = '';

  process.stdout.write('   Streaming: ');
  for (const chunk of chunks) {
    accumulated += chunk;
    process.stdout.write(chunk);
    await new Promise(r => setTimeout(r, 50)); // Simulate latency
  }
  console.log('\n');

  // Capture after stream completes with TTFT metrics
  const capturePayload = {
    conversation_id: conversationId,
    user_id: null,
    model: 'claude-haiku-4-5-20241022',
    messages: [{ role: 'user', content: 'Test streaming message' }],
    response: {
      content: accumulated,
      stop_reason: 'end_turn',
      usage: { input_tokens: 8, output_tokens: chunks.length },
    },
    latency_ms: chunks.length * 50,
    ttft_ms: 42, // Simulated time to first token
    streaming: true,
    timestamp: new Date().toISOString(),
  };

  queueCapture(capturePayload, {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    enabled: true,
  });

  console.log('2. Waiting for capture...');
  await new Promise(r => setTimeout(r, 3000));

  // Verify
  console.log('\n3. Verifying capture...');
  const { data: conv } = await supabase
    .from('claude_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (conv) {
    console.log('   ✓ Streaming conversation captured');
    console.log(`     - ID: ${conv.id}`);
    console.log(`     - Model: ${conv.model}`);
  } else {
    console.log('   ⚠ Conversation not found (may need more time)');
  }

  const { data: turns } = await supabase
    .from('conversation_turns')
    .select('*')
    .eq('conversation_id', conversationId);

  if (turns && turns.length > 0) {
    console.log(`   ✓ ${turns.length} turn(s) captured`);
    const assistantTurn = turns.find(t => t.role === 'assistant');
    if (assistantTurn) {
      console.log(`     - Response: "${assistantTurn.content}"`);
    }
  }

  console.log('\n=== Streaming Capture Test Complete ===');
}

async function runLiveTest(apiKey: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // We need to set env vars for the AnthropicService
  process.env.ANTHROPIC_API_KEY = apiKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;

  // Dynamic import to get env vars
  const { AnthropicService } = await import('../apps/renubu/src/lib/services/AnthropicService.js');

  console.log('1. Making live streaming API call...');
  const startTime = Date.now();

  let fullResponse = '';
  process.stdout.write('   Response: ');

  try {
    for await (const chunk of AnthropicService.generateStreamingCompletion({
      prompt: 'Say "Hello from streaming test!" in exactly those words.',
      maxTokens: 50,
    })) {
      fullResponse += chunk;
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error('\n   ❌ Streaming error:', error);
    return;
  }

  const latency = Date.now() - startTime;
  console.log(`\n   Latency: ${latency}ms`);

  console.log('\n2. Waiting for capture...');
  await new Promise(r => setTimeout(r, 3000));

  // Check for recent captures
  console.log('\n3. Checking recent captures...');
  const { data: recentConvs } = await supabase
    .from('claude_conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentConvs && recentConvs.length > 0) {
    console.log(`   ✓ Found ${recentConvs.length} recent conversation(s)`);
    const latest = recentConvs[0];
    console.log(`     - Latest ID: ${latest.id}`);
    console.log(`     - Model: ${latest.model}`);
    console.log(`     - Created: ${latest.created_at}`);

    // Check turns for latest
    const { data: turns } = await supabase
      .from('conversation_turns')
      .select('*')
      .eq('conversation_id', latest.id);

    if (turns && turns.length > 0) {
      console.log(`   ✓ ${turns.length} turn(s) in latest conversation`);
    }
  }

  console.log('\n=== Live Streaming Capture Test Complete ===');
}

testStreamingCapture().catch(console.error);
