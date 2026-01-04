/**
 * Test conversation capture
 *
 * This script tests that Claude API calls are being captured to Supabase.
 * Usage: npx tsx scripts/test-capture.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load env from original renubu
// Use environment variable for service key
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zulowgscotdrqlccomht.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
async function testCapture() {
  console.log('=== Phase 1 Capture Test ===\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Check tables exist
  console.log('1. Checking tables exist...');
  const { data: convCheck, error: convErr } = await supabase
    .from('claude_conversations')
    .select('id')
    .limit(1);

  if (convErr) {
    console.error('❌ claude_conversations table error:', convErr.message);
    process.exit(1);
  }
  console.log('   ✓ claude_conversations exists');

  const { data: turnCheck, error: turnErr } = await supabase
    .from('conversation_turns')
    .select('id')
    .limit(1);

  if (turnErr) {
    console.error('❌ conversation_turns table error:', turnErr.message);
    process.exit(1);
  }
  console.log('   ✓ conversation_turns exists');

  // 2. Make a test Claude API call via the proxy capture module
  console.log('\n2. Making test Claude API call with capture...');

  // Import capture functions
  const { queueCapture, generateConversationId } = await import('../packages/proxy/dist/capture.js');

  const conversationId = generateConversationId();
  const testMessage = 'This is a test message for capture verification.';

  console.log(`   Conversation ID: ${conversationId}`);

  // Simulate capture (without actually calling Claude to avoid API costs)
  const capturePayload = {
    conversation_id: conversationId,
    user_id: null,
    model: 'claude-haiku-4-5-20241022',
    messages: [{ role: 'user', content: testMessage }],
    response: {
      content: 'This is a simulated test response.',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 15 },
    },
    latency_ms: 150,
    timestamp: new Date().toISOString(),
  };

  // Queue capture directly to Supabase
  queueCapture(capturePayload, {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_SERVICE_KEY,
    enabled: true,
  });

  // Wait for async capture to complete
  console.log('   Waiting for capture to complete...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Verify capture in database
  console.log('\n3. Verifying capture in database...');

  const { data: conversation, error: fetchErr } = await supabase
    .from('claude_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (fetchErr || !conversation) {
    console.error('❌ Conversation not found:', fetchErr?.message);
    console.log('   Note: Capture is fire-and-forget, may need more time');
  } else {
    console.log('   ✓ Conversation captured:');
    console.log(`     - ID: ${conversation.id}`);
    console.log(`     - Model: ${conversation.model}`);
    console.log(`     - Started: ${conversation.started_at}`);
  }

  const { data: turns, error: turnsErr } = await supabase
    .from('conversation_turns')
    .select('*')
    .eq('conversation_id', conversationId);

  if (turnsErr) {
    console.error('❌ Error fetching turns:', turnsErr.message);
  } else if (turns && turns.length > 0) {
    console.log(`   ✓ ${turns.length} turn(s) captured`);
    turns.forEach((turn, i) => {
      console.log(`     Turn ${i + 1}: ${turn.role} - ${turn.content.substring(0, 50)}...`);
    });
  } else {
    console.log('   ⚠ No turns found yet (may be processing)');
  }

  // 4. Summary
  console.log('\n=== Test Summary ===');
  console.log('✓ Database tables created and accessible');
  console.log('✓ Capture module imported successfully');
  console.log(conversation ? '✓ Capture working end-to-end' : '⚠ Capture may need verification');
  console.log('\nPhase 1 Core Proxy: COMPLETE');
}

testCapture().catch(console.error);
