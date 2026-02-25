/**
 * Test Hybrid Workflow Composer
 *
 * Quick test to verify hybrid composition works
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Mock fetch for testing
(global as any).fetch = async (url: string, _options?: any): Promise<Response> => {
  console.log('[Mock Fetch] Called:', url);

  if (url === '/api/workflows/compile') {
    // Return mock compiled workflow
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: {
          compiledWorkflow: {
            template_id: 'test',
            steps: [
              {
                step_id: 'greeting',
                step_name: 'Start',
                step_type: 'intro',
                description: 'Test greeting',
                shows_artifacts: ['planning-checklist'],
                creates_tasks: [],
                metadata: {
                  buttons: [
                    { label: 'Start', value: 'start' }
                  ],
                  checklist_items: ['Item 1', 'Item 2']
                }
              }
            ],
            artifacts: [
              {
                artifact_id: 'planning-checklist',
                artifact_name: 'Planning Checklist',
                artifact_type: 'planning-checklist',
                config: {}
              }
            ],
            applied_modifications: []
          }
        }
      })
    } as any;
  }

  throw new Error(`Unexpected fetch to: ${url}`);
};

async function test() {
  console.log('Testing hybrid composer...\n');

  // Import after setting up mocks
  const { HybridWorkflowComposer } = await import('../src/lib/services/HybridWorkflowComposer');
  const _composeFromDatabase = await import('../src/lib/workflows/db-composer');

  // Test parameters
  const params = {
    workflowId: 'obsidian-black-renewal-v2',
    templateName: 'obsidian_black_renewal',
    customerId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '00000000-0000-0000-0000-000000000000',
    customerContext: {
      name: 'Obsidian Black',
      current_arr: 185000,
      health_score: 87,
      days_until_renewal: 365
    },
    useNewSlides: [0]
  };

  console.log('Parameters:', params);
  console.log('');

  try {
    const result = await HybridWorkflowComposer.compose(params);

    if (result) {
      console.log('✅ SUCCESS!');
      console.log('Total slides:', result.slides?.length);
      console.log('Hybrid info:', (result as any)._hybridInfo);
    } else {
      console.log('❌ FAILED: Returned null');
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

test();
