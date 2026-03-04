#!/usr/bin/env bash
# Creates a PR from main → demo for certification.
# The demo-certification pipeline will run on the PR.
#
# Usage:
#   ./scripts/promote-to-demo.sh
#   ./scripts/promote-to-demo.sh --dry-run

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

git fetch origin

BRANCH="promote/$(date +%Y%m%d-%H%M)"

echo "Creating promotion branch: $BRANCH"

if $DRY_RUN; then
  echo "[dry-run] Would create branch $BRANCH from origin/main"
  echo "[dry-run] Would push and create PR: main → demo"
  exit 0
fi

git checkout -b "$BRANCH" origin/main
git push -u origin "$BRANCH"

gh pr create \
  --base demo \
  --title "Promote main → demo $(date +%Y-%m-%d)" \
  --body "$(cat <<'EOF'
## Promotion

Automated promotion of `main` to `demo`. The certification pipeline will run all checks.

### What happens next
1. `demo-certification` workflow runs (typecheck, lint, build, seed validation, smoke tests)
2. If all checks pass, this PR can be merged
3. Merge triggers Vercel deploy to persistent demo URLs
4. Nightly reset (3 AM ET) will reseed the demo database

### Manual steps if needed
- Trigger manual reset: `Actions > Demo Nightly Reset > Run workflow`
- Check demo URLs after merge
EOF
)"

echo ""
echo "PR created. Certification pipeline will run automatically."
echo "Check: gh pr checks"
