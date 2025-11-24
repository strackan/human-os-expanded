# Renubu Project - Claude Code Instructions

## Project Type
Next.js application with TypeScript

## Forbidden Directories
Do not read or search files in these directories unless explicitly requested:
- node_modules/
- .next/
- .git/
- .husky/
- .cursor/
- coverage/
- dist/
- build/
- out/

## Forbidden Files
Skip these files during searches:
- *.log
- *.lock
- package-lock.json
- .env.local (contains secrets)
- .env.vercel.*
- .env.preview.*
- .env.production.*

## Project Structure
- Next.js application with App Router
- TypeScript strict mode enabled
- Multiple environment configurations (staging, preview, production)
- Custom scripts for schema management and deployment

## Coding Preferences
- Use TypeScript strict mode
- Prefer functional React components
- Follow existing code style and patterns
- Use the project's npm scripts for build/test operations
- Respect environment separation (staging vs production)

## Common Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run check` - Full validation (type-check + lint + build)

## Important Notes
- Multiple .env files exist for different environments - be careful when modifying
- Use the env:staging and env:prod scripts to switch environments
- Schema sync scripts are critical - don't modify without understanding

## Workflow System Standard
**CRITICAL**: All workflow creation and launching must use the Phase 3 Modular Slide Library System.
- **Always use**: `composeFromDatabase()` from `@/lib/workflows/db-composer`
- **Never use**: `/api/workflows/compile`, `WorkflowConfigTransformer`, or static WorkflowConfig files
- **Reference**: See `docs/workflows/WORKFLOW_SYSTEM_STANDARD.md` for complete standard
- **Example**: `src/app/dashboard/DashboardClient.tsx:62-147` (correct implementation)
