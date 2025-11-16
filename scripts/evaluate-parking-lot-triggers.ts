#!/usr/bin/env tsx
/**
 * Evaluate Parking Lot Triggers
 * Cron job to check event-based wake triggers for parking lot items
 *
 * Usage:
 *   npm run parking-lot:evaluate
 *
 * Schedule: Daily (recommended: 9am local time)
 */

import { ParkingLotEventService } from '../src/lib/services/ParkingLotEventService';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  console.log('\n🎯 Parking Lot Trigger Evaluation');
  console.log('='.repeat(50));
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // Run evaluation
    const result = await ParkingLotEventService.evaluateAllTriggers();

    console.log('\n📊 Results:');
    console.log(`  • Evaluated: ${result.evaluated} items`);
    console.log(`  • Surfaced: ${result.surfaced} items`);
    console.log(`  • Errors: ${result.errors}`);

    if (result.errors > 0) {
      console.warn('\n⚠️  Some items failed to evaluate. Check logs for details.');
      process.exit(1);
    }

    console.log('\n✅ Evaluation complete\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Evaluation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
