# Human OS Expanded API

Backend API for the expanded Human OS platform (monorepo workspace).

## Tech Stack
- Express 4.21, TypeScript 5.7
- Supabase (PostgreSQL) 2.39
- Zod 3.23 (validation)
- Part of human-os-expanded monorepo

## PM2
- **Name:** `humanos:human-os-expanded-api`
- **Dev port:** 4401
- **Start:** `pm2 start ecosystem.config.js --only humanos:human-os-expanded-api`

## Environment Variables
```
PORT=4401
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Local
This project's Supabase instance runs on offset ports to avoid conflict with renubu:
- API: 54331, DB: 54332, Studio: 54333, Inbucket: 54334, Analytics: 54337

## Commands
```bash
pm2 start ecosystem.config.js --only humanos:human-os-expanded-api  # Dev server (port 4401)
```
