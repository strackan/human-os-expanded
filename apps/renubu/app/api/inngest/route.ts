/**
 * Inngest API Route
 *
 * Serves the Inngest functions for async processing.
 * POST /api/inngest - receives events from Inngest
 */

import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { functions } from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
