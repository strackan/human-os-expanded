# Contributing to Human OS

## Git Worktree Workflow

This project uses git worktrees to isolate major feature development from the stable master branch.

### Current Worktrees

| Directory | Branch | Purpose |
|-----------|--------|---------|
| `human-os/` | `master` | Production-stable code |
| `human-os-convergence/` | `feature/renubu-convergence` | Renubu platform convergence |

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

1. **master** - Production-ready code. Protected.
2. **feature/renubu-convergence** - Long-running convergence work
3. **feature/*** - Short-lived feature branches (branch from master or convergence)

### Committing Changes

When working in a worktree:

```bash
# You're automatically on the correct branch
git status  # Shows feature/renubu-convergence

# Commit as normal
git add .
git commit -m "feat: description"

# Push to remote
git push -u origin feature/renubu-convergence
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

## Renubu Convergence Project

This feature branch consolidates:
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
