# Fancy Robot

AI-powered marketing site + ARI snapshot UI with email capabilities.

Now lives inside the HumanOS monorepo at `core/apps/fancy-robot/`.

## Tech Stack
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4, Radix UI
- Resend (transactional email)

## PM2
- **Name:** `fancyrobot:fancy-robot`
- **Dev port:** 4200
- **Start:** `dev start fancy-robot`

## Environment Variables
```
ANTHROPIC_API_KEY
RESEND_API_KEY
```

## Commands
```bash
dev start fancy-robot    # Dev server (port 4200)
npm run build            # Production build
```
