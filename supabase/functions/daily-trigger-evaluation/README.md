# Daily Trigger Evaluation Cron Job

This Supabase Edge Function evaluates workflow triggers daily and surfaces workflows when triggers fire.

## Deployment

Deploy the Edge Function:

```bash
supabase functions deploy daily-trigger-evaluation
```

## Scheduling with pg_cron

To schedule this function to run daily at 8:00 AM UTC, run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the daily trigger evaluation
SELECT cron.schedule(
  'daily-trigger-evaluation',  -- Job name
  '0 8 * * *',                   -- Cron expression (8:00 AM UTC daily)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-trigger-evaluation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

## Manual Invocation

You can manually trigger the evaluation via HTTP POST:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-trigger-evaluation \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Response Format

Success response:
```json
{
  "success": true,
  "evaluated": 42,
  "surfaced": 5,
  "errors": 0,
  "timestamp": "2025-11-12T20:30:00.000Z"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-11-12T20:30:00.000Z"
}
```

## Performance

- Processes workflows in batches of 100
- Target: <10 seconds for 1000 workflows
- Uses database helper function: `get_snoozed_workflows_for_evaluation()`

## Monitoring

Check logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `daily-trigger-evaluation`
3. View logs tab

## Testing

Test the function locally:

```bash
supabase functions serve daily-trigger-evaluation
```

Then trigger it:

```bash
curl -X POST http://localhost:54321/functions/v1/daily-trigger-evaluation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```
