# Fancy Robot

AI-powered marketing site + ARI dashboard with email capabilities. Serves as the customer-facing SaaS for FancyRobot/ARI.

Now lives inside the HumanOS monorepo at `core/apps/fancy-robot/`.

## Tech Stack
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4, Radix UI
- @tanstack/react-query, Recharts, react-markdown
- Resend (transactional email), Stripe (billing)

## PM2
- **Name:** `fancyrobot:fancy-robot`
- **Dev port:** 4200
- **Start:** `dev start fancy-robot`

## Dashboard Features (from absorbed ari/frontend)

The authenticated dashboard at `/new-site/dashboard/` includes:
- **Brands** (`/brands`) — ARI score cards, competitor comparison, model breakdown charts
- **Audit** (`/audit`) — Full 8-dimension AI visibility audit with SSE streaming progress
- **Reports** (`/reports`) — Client deliverables viewer with PDF/PPTX export

API calls are proxied via `next.config.ts`: `/api/v1/*` → ARI backend (port 4250).

## Environment Variables
```
ANTHROPIC_API_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Commands
```bash
dev start fancy-robot    # Dev server (port 4200)
npm run build            # Production build
```
