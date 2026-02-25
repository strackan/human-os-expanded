# Commit and Track Script

Commits code AND updates database tracking simultaneously to keep documentation in perfect sync with the codebase.

## Installation

Already configured! Just stage your changes with `git add` and use the script instead of `git commit`.

## Usage

### Standard Commit

Commits code and logs to database:

```bash
npm run commit -- -m "feat: add workflow snoozing UI"
npm run commit -- -m "fix: resolve auth timeout issue"
npm run commit -- -m "docs: update API documentation"
```

**What it does:**
- Commits to git with conventional commit format
- Logs commit metadata to `commits` table
- Extracts feature slugs from message (kebab-case words)
- Records git stats (files changed, insertions, deletions)

### Phase Completion

Mark current phase/release as complete when all features are shipped:

```bash
npm run commit -- -m "release: Phase 0.1 complete" --phase
```

**What it does:**
- Commits to git
- Finds current in-progress release
- Updates release status to 'complete'
- Sets `actual_shipped` timestamp
- Updates all features in release from 'underway/planned' → 'complete'
- Sets `shipped_at` timestamp on features

**When to use:**
- All features in the phase are complete
- Code is deployed to production
- Ready to move to next phase

### Create New Release

Create a new release entry in database:

```bash
npm run commit -- -m "feat: start release 0.2" --release 0.2
```

**What it does:**
- Commits to git
- Creates new release in database with status 'planning'
- Calculates phase number from version (0.2 → phase 0)
- Logs to console with next steps

**When to use:**
- Starting a new release/phase
- After completing previous phase
- Planning next batch of features

**Remember to:**
1. Update release name and description in database
2. Assign features to the release (`UPDATE features SET release_id = ...`)
3. Set `planned_start` and `planned_end` dates

### Dry Run

Test what would happen without making changes:

```bash
npm run commit -- -m "feat: test message" --dry-run
```

## Examples

### Typical Workflow

```bash
# Working on features
git add .
npm run commit -- -m "feat: workflow-snoozing implementation"

git add .
npm run commit -- -m "feat: add snooze UI components"

git add .
npm run commit -- -m "fix: snooze condition validation"

# Phase complete - all features shipped
git add .
npm run commit -- -m "release: Phase 1 complete - Workflow Snoozing shipped" --phase

# Start next phase
git add .
npm run commit -- -m "feat: start Phase 2" --release 2.0
```

### Commit Message Format

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

**Examples:**
```bash
npm run commit -- -m "feat(auth): add OAuth provider"
npm run commit -- -m "fix(workflow): resolve snooze condition bug"
npm run commit -- -m "docs(api): update MCP operations reference"
```

### Feature Slug Extraction

The script automatically extracts feature slugs (kebab-case words) from commit messages:

```bash
npm run commit -- -m "feat: workflow-snoozing and parking-lot implementation"
# Extracts: ["workflow-snoozing", "parking-lot"]

npm run commit -- -m "fix: google-calendar integration timeout"
# Extracts: ["google-calendar"]
```

These slugs link commits to features in the database.

## Database Schema

### Commits Table

```sql
CREATE TABLE commits (
  id UUID PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  type TEXT,  -- feat, fix, docs, etc.
  scope TEXT,
  breaking BOOLEAN,
  files_changed INTEGER,
  insertions INTEGER,
  deletions INTEGER,
  branch TEXT,
  feature_slugs TEXT[],  -- Extracted from message
  committed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

### Helper Functions

**Get commits for a feature:**
```sql
SELECT * FROM get_feature_commits('workflow-snoozing');
```

## Configuration

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for write access)

Falls back to `NEXT_PUBLIC_SUPABASE_ANON_KEY` if service role key not available (read-only operations may fail).

## Workflow Integration

### Phase 0.1 Complete Example

```bash
# All code complete and tested
git add .

# Commit and mark phase complete
npm run commit -- -m "release: Phase 0.1 - MCP Foundation & Documentation complete" --phase

# Push to remote
git push origin main

# Deploy to production (via Vercel, etc.)
```

**What happens in database:**
1. Release `0.1` status → 'complete'
2. Features in release → 'complete' with `shipped_at` timestamp
3. Commit logged with metadata
4. Feature update logs created for each status change

### Starting Phase 0.2 Example

```bash
# Create new release
npm run commit -- -m "feat: start Phase 0.2 - MCP Registry & Integrations" --release 0.2

# Then in database or via SQL:
UPDATE releases SET
  name = 'MCP Registry & Integrations',
  description = 'Google Calendar, Slack, Gmail integrations',
  planned_start = '2026-01-01',
  planned_end = '2026-01-31'
WHERE version = '0.2';

# Assign features to release
UPDATE features SET release_id = (SELECT id FROM releases WHERE version = '0.2')
WHERE slug IN ('google-calendar-integration', 'slack-integration', 'gmail-integration');
```

## Troubleshooting

### "Missing Supabase credentials"

Set environment variables:
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Or add to `.env.local`.

### "No in-progress release found" (--phase)

Ensure a release exists with status 'in_progress':

```sql
SELECT * FROM releases
JOIN release_statuses ON releases.status_id = release_statuses.id
WHERE release_statuses.slug = 'in_progress';
```

If none exist, update manually:
```sql
UPDATE releases SET status_id = (SELECT id FROM release_statuses WHERE slug = 'in_progress')
WHERE version = '0.1';
```

### Commits table doesn't exist

Run migrations:
```bash
npx supabase db push
```

Or apply migration `20251108000002_commits_tracking.sql`.

## Related Documentation

- [FEATURES.md](../docs/FEATURES.md) - Feature tracking system
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [PLAN.md](../docs/PLAN.md) - Development plan
