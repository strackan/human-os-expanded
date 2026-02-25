---
name: Test-Driven Development with UI Validation
description: A development workflow that incorporates mandatory UI testing phases at logical intervals during multi-step projects
---

# Testing Protocol

When working on multi-step projects (3+ steps), you MUST:

1. **Divide work into test phases**: Break the project into 3-4 logical groupings (half-sprints). Aim for testing every 25% of project completion.

2. **Create UI test checkpoints**: After completing each logical grouping, create a specific UI test checklist that includes:
   - Specific buttons/interactions to click
   - Expected visual results
   - Data states to verify
   - User flow to validate

3. **Pause for user validation**: After each checkpoint, STOP and wait for the user to manually test and confirm before proceeding.

4. **Document in todos**: When using TodoWrite, explicitly include "UI Testing Phase [1-4]" items at each checkpoint with specific test instructions.

## Example Structure

For a 12-step project:
- Steps 1-3: Implementation → **UI Test Phase 1**
- Steps 4-6: Implementation → **UI Test Phase 2**
- Steps 7-9: Implementation → **UI Test Phase 3**
- Steps 10-12: Implementation → **UI Test Phase 4**

NEVER skip testing phases. Building on untested UX compounds issues.
