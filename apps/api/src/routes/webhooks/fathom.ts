/**
 * Fathom Webhook Handler
 *
 * POST /webhooks/fathom
 *
 * Receives Fathom webhook payloads when a meeting finishes processing.
 * Verifies signature using Standard Webhooks (Svix) scheme, deduplicates
 * by recording_id, and ingests via TranscriptService.
 *
 * IMPORTANT: This route must be registered BEFORE express.json() middleware
 * so it can access the raw request body for signature verification.
 */

import { Router } from 'express';
import crypto from 'crypto';
import express from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TranscriptService } from '@human-os/services';
import { fathomMeetingToTranscriptInput } from '@human-os/services';
import type { FathomMeeting } from '@human-os/services';
import type { Layer } from '@human-os/core';

// =============================================================================
// SIGNATURE VERIFICATION
// =============================================================================

const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Verify Standard Webhooks (Svix) signature
 *
 * Headers:
 *   webhook-id: unique message ID
 *   webhook-timestamp: unix timestamp (seconds)
 *   webhook-signature: v1,<base64-encoded-hmac>
 *
 * Signing input: `{webhook-id}.{webhook-timestamp}.{rawBody}`
 * Secret format: `whsec_<base64-encoded-key>` — strip prefix, base64-decode to get key
 */
function verifySignature(
  rawBody: Buffer,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: string
): boolean {
  // Validate timestamp is within tolerance
  const timestampSec = parseInt(webhookTimestamp, 10);
  if (isNaN(timestampSec)) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - timestampSec) > TIMESTAMP_TOLERANCE_SECONDS) {
    return false;
  }

  // Decode the signing key (strip whsec_ prefix, base64-decode)
  const keyBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const key = Buffer.from(keyBase64, 'base64');

  // Compute expected signature
  const signingInput = `${webhookId}.${webhookTimestamp}.${rawBody.toString('utf-8')}`;
  const expectedSig = crypto
    .createHmac('sha256', key)
    .update(signingInput)
    .digest('base64');

  // The header may contain multiple signatures separated by spaces (v1,sig1 v1,sig2)
  // We need to match at least one
  const signatures = webhookSignature.split(' ');
  for (const sig of signatures) {
    const parts = sig.split(',');
    if (parts.length !== 2 || parts[0] !== 'v1') continue;

    const providedSig = parts[1]!;
    const providedBuf = Buffer.from(providedSig, 'base64');
    const expectedBuf = Buffer.from(expectedSig, 'base64');

    if (providedBuf.length === expectedBuf.length &&
        crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// ROUTE FACTORY
// =============================================================================

/**
 * Create the Fathom webhook route
 *
 * Must be mounted BEFORE the global express.json() middleware.
 * Uses express.raw() to get the raw body for signature verification.
 */
export function createFathomWebhookRoutes(supabase: SupabaseClient): Router {
  const router = Router();

  // Parse body as raw buffer (not JSON) for signature verification
  router.use(express.raw({ type: 'application/json' }));

  router.post('/', async (req, res) => {
    const WEBHOOK_SECRET = process.env['FATHOM_WEBHOOK_SECRET'];
    const USER_ID = process.env['FATHOM_WEBHOOK_USER_ID'] || 'strackan@gmail.com';
    const layer = `founder:${USER_ID}` as Layer;

    try {
      // Get raw body as Buffer
      const rawBody = req.body as Buffer;

      if (!rawBody || rawBody.length === 0) {
        console.error('[Fathom Webhook] Empty body received');
        return res.status(200).json({ received: true });
      }

      // Verify signature if secret is configured
      if (WEBHOOK_SECRET) {
        const webhookId = req.headers['webhook-id'] as string | undefined;
        const webhookTimestamp = req.headers['webhook-timestamp'] as string | undefined;
        const webhookSignature = req.headers['webhook-signature'] as string | undefined;

        if (!webhookId || !webhookTimestamp || !webhookSignature) {
          console.error('[Fathom Webhook] Missing signature headers');
          return res.status(401).json({ error: 'Missing signature headers' });
        }

        const valid = verifySignature(
          rawBody,
          webhookId,
          webhookTimestamp,
          webhookSignature,
          WEBHOOK_SECRET
        );

        if (!valid) {
          console.error('[Fathom Webhook] Invalid signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Parse the JSON body
      const payload = JSON.parse(rawBody.toString('utf-8')) as FathomMeeting;

      // Extract recording ID for dedup
      const recordingId = payload.recording_id != null
        ? String(payload.recording_id)
        : null;

      if (!recordingId) {
        console.error('[Fathom Webhook] No recording_id in payload');
        return res.status(200).json({ received: true });
      }

      // Dedup: check if this recording was already ingested
      const { data: existing } = await supabase
        .schema('human_os')
        .from('transcripts')
        .select('id')
        .eq('labels->>fathom_recording_id', recordingId)
        .limit(1)
        .maybeSingle();

      if (existing) {
        console.log(`[Fathom Webhook] Skipping duplicate recording_id=${recordingId}`);
        return res.status(200).json({ received: true, skipped: true });
      }

      // Transform and ingest
      const transcriptInput = fathomMeetingToTranscriptInput(payload);
      const service = new TranscriptService(supabase, layer);
      const result = await service.ingest(transcriptInput);

      if (result.success) {
        console.log(
          `[Fathom Webhook] Ingested recording_id=${recordingId} as transcript_id=${result.data?.id}`
        );
      } else {
        console.error(`[Fathom Webhook] Ingest failed: ${result.error}`);
      }

      // Always return 200 to prevent Fathom retries
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('[Fathom Webhook] Error:', error);
      // Always return 200 to prevent Fathom retries
      return res.status(200).json({ received: true });
    }
  });

  return router;
}
