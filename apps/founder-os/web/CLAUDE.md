# FounderOS Web

Personal productivity intelligence dashboard.

## Tech Stack
- Next.js 15, React 19, TypeScript 5
- Tailwind CSS 4
- Supabase (shared HumanOS instance)

## PM2
- **Name:** `humanos:founder-os-web`
- **Dev port:** 4400
- **Start:** `dev start founder-os-web`

## Routes
- `/dashboard` — Productivity overview
- `/journal` — Creativity journal and reflection
- `/voice` — VoiceOS configuration and writing profiles

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```

## Commands
```bash
dev start founder-os-web  # Dev server (port 4400)
pnpm turbo build --filter=@human-os/founder-os-web  # Production build
```
