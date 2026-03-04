# Demo Environment

Persistent, resettable demo environment for the HumanOS platform.

## Architecture

```
main ──PR──> demo (certification gate) ──auto-deploy──> persistent demo URLs
  |                                                        |
  |── PR ──> main (normal dev, preview deploys)            |── nightly seed reset (3 AM ET)
                                                           |── manual reset endpoint
```

## Demo URLs

| App | Demo URL | Branch |
|-----|----------|--------|
| Renubu | `demo--human-os-convergence.vercel.app` | `demo` |
| GoodHang | `demo--goodhang.vercel.app` | `demo` |
| Fancy Robot | `demo--fancy-robot.vercel.app` | `demo` |

## Database

- **Project:** `humanos-demo` (dedicated Supabase instance, free tier)
- **Purpose:** Purely synthetic demo data, safe to nuke nightly
- **Schemas:** Same as production (`human_os`, `renubu`, `goodhang`, `fancyrobot`, `founder_os`)

## Seed Data Story

The demo environment tells a coherent cross-product story:

### Companies (8 total)
| Tier | Companies | ARI Score Range |
|------|-----------|----------------|
| Champions | Acme Corporation, Global Solutions | 80+ |
| Healthy | Stellar Networks, Quantum Soft | 60-79 |
| At-Risk | Horizon Systems, FusionWare | 40-59 |
| Declining | RiskyCorp, StartupXYZ | <40 |

### Cross-Product Links
- **15 contacts** across the 8 companies
- **5 contacts** also appear as GoodHang profiles (professional network overlap)
- **5 renewals** in Renubu with tasks and workflows
- **ARI score history** — 3 snapshots per company over 90 days showing trends
- **10 journal entries** in FounderOS, 3 referencing Renubu customers by name
- **25 GoodHang profiles** (5 linked to entity spine, 20 filler)

### Demo User
- ID: `d152cc6c-8d71-4816-9b96-eccf249ed0ac`
- Email: `justin@demo.humanos.ai`

## Operations

### Trigger Manual Reset

**Option 1: GitHub Actions**
```bash
gh workflow run demo-nightly-reset.yml
```

**Option 2: API Endpoint**
```bash
curl -X POST https://demo--human-os-convergence.vercel.app/api/demo/reset \
  -H "Authorization: Bearer $DEMO_RESET_SECRET"
```

**Option 3: CLI**
```bash
DEMO_SUPABASE_URL=... DEMO_SUPABASE_SERVICE_KEY=... pnpm demo:reset
```

### Dry Run (preview without writing)
```bash
DEMO_SUPABASE_URL=... DEMO_SUPABASE_SERVICE_KEY=... pnpm demo:seed:dry
```

### Promote main to demo
```bash
./scripts/promote-to-demo.sh
```

This creates a PR from `main` → `demo`. The certification pipeline runs all checks. Merge when green.

## Nightly Reset

- **Schedule:** 3 AM ET (7 AM UTC) daily
- **Mechanism:** GitHub Actions `demo-nightly-reset.yml` + Vercel Cron on `/api/demo/reset`
- **Process:** Runs seed orchestrator (upserts, not truncates), then smoke tests
- **On failure:** GitHub Actions step summary with details

## Certification Pipeline

PRs targeting the `demo` branch trigger `demo-certification.yml`:

1. **Typecheck & Lint** — `pnpm turbo typecheck && pnpm turbo lint`
2. **Build** — Matrix build of affected apps
3. **Seed Validation** — Dry-run seed script
4. **Smoke Tests** — Health endpoints + API shape checks + data verification

All checks must pass before merge.

## Environment Variables

Set these as GitHub repo secrets and Vercel env vars (branch-scoped to `demo`):

| Variable | Where | Purpose |
|----------|-------|---------|
| `DEMO_SUPABASE_URL` | GitHub Secrets + Vercel | Demo Supabase instance URL |
| `DEMO_SUPABASE_SERVICE_KEY` | GitHub Secrets + Vercel | Service role key for demo DB |
| `NEXT_PUBLIC_DEMO_MODE` | Vercel (preview, demo branch) | Enables demo mode in apps |
| `DEMO_RESET_SECRET` | Vercel (preview, demo branch) | Protects the reset endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (preview, demo branch) | Override to point at demo DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (preview, demo branch) | Demo DB anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (preview, demo branch) | Demo DB service key |

## Modifying Seed Data

All seed data lives in `scripts/demo-seed/`:

```
scripts/demo-seed/
  orchestrator.ts      # CLI entry point
  constants.ts         # Stable UUIDs, company names, scores
  modules/
    entity-spine.ts    # human_os.entities (runs first)
    renubu.ts          # Customers, contacts, renewals, tasks
    goodhang.ts        # Profiles, badges
    ari.ts             # ARI entities, score history
    founder-os.ts      # Journal entries
```

### Adding a new company
1. Add entry to `COMPANIES` in `constants.ts`
2. Add ARI score data to `ARI_SCORES`
3. Add contacts to `CONTACTS`
4. Update `CUSTOMER_DETAILS` in `modules/renubu.ts`
5. Run `pnpm demo:seed:dry` to verify

### Adding a new product module
1. Create `modules/<product>.ts` following the same pattern
2. Import and call it in `orchestrator.ts` (add to the parallel Promise.all)
3. Add to the demo reset route if applicable
