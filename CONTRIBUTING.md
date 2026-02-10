# Contributing to Human OS

## Git Worktree Workflow

This project uses git worktrees to isolate major feature development from the stable master branch.

### Current Worktrees

| Directory | Branch | Purpose |
|-----------|--------|---------|
| `human-os/` | `master` | Production-stable code |
| `human-os-convergence/` | `main` | Development branch (all active work) |

### Working with Worktrees

```bash
# List all worktrees
git worktree list

# Switch to convergence work
cd ../human-os-convergence

# Switch to stable/production work
cd ../human-os

# Create a new worktree for another feature
git worktree add ../human-os-<feature> feature/<feature-name>

# Remove a worktree when done
git worktree remove ../human-os-<feature>
```

### Branch Strategy

1. **master** (human-os) - Production-ready code. Protected. Cherry-pick when ready.
2. **main** (human-os-convergence) - Development branch. All active work happens here.
3. **feature/*** - Short-lived feature branches (branch from main)

### Committing Changes

When working in a worktree:

```bash
# You're automatically on the correct branch
git status  # Shows main

# Commit as normal
git add .
git commit -m "feat: description"

# Push to remote
git push origin main
```

### Cherry-picking Between Branches

If a fix in convergence needs to go to master:

```bash
# From the master worktree
cd ../human-os
git cherry-pick <commit-hash>
```

### Syncing with Master

Keep convergence branch up to date:

```bash
cd ../human-os-convergence
git fetch origin
git rebase origin/master
# Or merge if preferred:
# git merge origin/master
```

## Human-OS Monorepo Convergence

This development branch consolidates:
- Human OS (core platform)
- Founder OS (productivity)
- Voice OS (voice interface)
- Renubu (CS workflows)
- Guy For That (cross-org intelligence)

### Key Directories

```
apps/
├── renubu/          # Renubu platform (copied from ~/dev/renubu)
├── api/             # REST API gateway
├── founder-os/      # Founder OS MCP + creativityjournal
├── voice-packs/     # Voice OS
└── workflows/       # Python workflow server

packages/
├── proxy/           # Claude proxy (new - captures all interactions)
├── core/            # Shared types, context engine, knowledge graph
├── tools/           # Unified tool definitions
└── mcp-server/      # MCP server for Claude Desktop
```

### Cutover Criteria

Before merging to master:
- [ ] All existing Renubu functionality works
- [ ] Proxy integration tested
- [ ] Staging environment validated
- [ ] No regressions in existing apps

## Prompt Evals

LLM prompt changes must be validated against the eval suite. See [`evals/README.md`](evals/README.md) for running evals, writing new tests, and the prompt source map linking eval prompts to production sources.
