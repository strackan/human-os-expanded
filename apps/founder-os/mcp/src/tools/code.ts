/**
 * Code orchestration tools
 *
 * Provides:
 * - code_start: Start a Claude Code task in an isolated worktree with GitHub tracking
 * - code_status: Check status of a code task by issue number
 * - code_list: List all running code tasks
 * - code_merge: Merge a completed code task worktree into main branch
 * - code_discard: Discard a code task worktree without merging
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolContext } from '../lib/context.js';
import { spawn, exec as execCallback } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { DB_SCHEMAS } from '@human-os/core';

const exec = promisify(execCallback);

// GitHub Project config
const CODE_ORCHESTRATOR_PROJECT_TITLE = 'Code Orchestrator';
const CODE_ORCHESTRATOR_LABEL = 'code-orchestrator';

// Cache for project number (resolved on first use)
let cachedProjectNumber: number | null = null;

/**
 * Ensure the Code Orchestrator project and label exist
 * Creates them if missing (first-time setup)
 */
async function ensureProjectSetup(): Promise<number> {
  // Return cached project number if available
  if (cachedProjectNumber !== null) {
    return cachedProjectNumber;
  }

  // Check if project exists
  try {
    const { stdout: projectsJson } = await exec('gh project list --owner @me --format json');
    const projects = JSON.parse(projectsJson);
    const existing = projects.projects?.find(
      (p: { title: string; number: number }) => p.title === CODE_ORCHESTRATOR_PROJECT_TITLE
    );

    if (existing) {
      cachedProjectNumber = existing.number;
    } else {
      // Create project
      const { stdout: newProjectJson } = await exec(
        `gh project create --owner @me --title "${CODE_ORCHESTRATOR_PROJECT_TITLE}" --format json`
      );
      const newProject = JSON.parse(newProjectJson);
      cachedProjectNumber = newProject.number;

      // Add Phase field with options
      await exec(
        `gh project field-create ${cachedProjectNumber} --owner @me --name "Phase" --data-type SINGLE_SELECT --single-select-options "Planning,Implementation,Testing,Complete,Failed"`
      ).catch(() => {}); // Ignore if field already exists
    }
  } catch (error) {
    // Fallback to project #2 if we can't detect
    console.warn('Could not detect/create project, using default #2');
    cachedProjectNumber = 2;
  }

  // Ensure label exists
  await exec(
    `gh label create "${CODE_ORCHESTRATOR_LABEL}" --description "Tracks Claude Code orchestrated tasks" --color "0E8A16" --force`
  ).catch(() => {}); // Ignore if exists

  return cachedProjectNumber!; // Non-null assertion - we set it above or fallback to 2
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const codeTools: Tool[] = [
  {
    name: 'code_start',
    description: `Start a Claude Code task in an isolated git worktree with GitHub tracking.

Creates:
- A new branch: code/{task-slug}-{timestamp}
- An isolated worktree in .worktrees/
- A GitHub issue for tracking progress
- Spawns Claude Code to work in the worktree

Claude Code will post status updates as issue comments. Use code_status to check progress.`,
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The coding task to execute (e.g., "add dark mode to settings page")',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'code_status',
    description: 'Check status of a code task by its GitHub issue number.',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number to check',
        },
      },
      required: ['issueNumber'],
    },
  },
  {
    name: 'code_list',
    description: 'List all running code tasks.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'code_merge',
    description: 'Merge a completed code task worktree into the main branch and clean up.',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number of the task to merge',
        },
      },
      required: ['issueNumber'],
    },
  },
  {
    name: 'code_discard',
    description: 'Discard a code task worktree without merging. Removes the worktree and branch.',
    inputSchema: {
      type: 'object',
      properties: {
        issueNumber: {
          type: 'number',
          description: 'The GitHub issue number of the task to discard',
        },
      },
      required: ['issueNumber'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleCodeTools(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown | null> {
  switch (name) {
    case 'code_start': {
      const { task } = args as { task: string };
      return codeStart(ctx, task);
    }

    case 'code_status': {
      const { issueNumber } = args as { issueNumber: number };
      return codeStatus(ctx, issueNumber);
    }

    case 'code_list': {
      return codeList(ctx);
    }

    case 'code_merge': {
      const { issueNumber } = args as { issueNumber: number };
      return codeMerge(ctx, issueNumber);
    }

    case 'code_discard': {
      const { issueNumber } = args as { issueNumber: number };
      return codeDiscard(ctx, issueNumber);
    }

    default:
      return null;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert a task description to a URL-safe slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

/**
 * Build the prompt that includes status tracking instructions
 */
function buildPromptWithTracking(task: string, issueNumber: number, branchName: string): string {
  return `${task}

## Progress Tracking

This task is tracked via GitHub Issue #${issueNumber}.

At major phase transitions (planning complete, implementation started, testing, etc.), update your status:

\`\`\`bash
gh issue comment ${issueNumber} --body "Phase: [Current Phase]

**Completed:** [what you just did]
**Next:** [what you're about to do]
**Files touched:** [list]
"
\`\`\`

When the task is complete, close the issue:

\`\`\`bash
gh issue close ${issueNumber} --comment "Task complete

## Summary
[brief summary of what was done]

## Files created/modified
[list of files]

## How to verify
[test commands or verification steps]
"
\`\`\`

You are working in branch: ${branchName}
Commit your changes frequently with clear commit messages.`;
}

// =============================================================================
// TOOL IMPLEMENTATIONS
// =============================================================================

interface CodeExecution {
  id: string;
  task: string;
  repo_path: string;
  branch_name: string;
  worktree_path: string;
  github_issue_number: number;
  github_issue_url: string;
  status: string;
  started_at: string;
  completed_at?: string;
  merged_at?: string;
}

/**
 * Start a Claude Code task in an isolated worktree
 */
async function codeStart(
  ctx: ToolContext,
  task: string
): Promise<{
  success: boolean;
  executionId?: string;
  issueNumber?: number;
  issueUrl?: string;
  branchName?: string;
  worktreePath?: string;
  message: string;
  error?: string;
}> {
  try {
    // Ensure project and label exist (first-time setup)
    const projectNumber = await ensureProjectSetup();

    // Get repo root
    const { stdout: repoRoot } = await exec('git rev-parse --show-toplevel');
    const repoPath = repoRoot.trim();

    // Enable long paths on Windows
    await exec('git config core.longpaths true').catch(() => {});

    // Generate unique identifiers
    const timestamp = Date.now();
    const slug = slugify(task);
    const branchName = `code/${slug}-${timestamp}`;
    const worktreeDir = `${slug}-${timestamp}`;
    const worktreePath = path.join(repoPath, '.worktrees', worktreeDir);

    // Ensure .worktrees directory exists
    await exec(`mkdir -p "${path.join(repoPath, '.worktrees')}"`);

    // Create branch and worktree
    await exec(`git worktree add "${worktreePath}" -b "${branchName}"`);

    // Create GitHub issue
    const issueBody = `**Task:** ${task}

**Branch:** \`${branchName}\`
**Worktree:** \`${worktreePath}\`

---
_This issue tracks a Claude Code task. Status updates will be posted as comments._`;

    // Create issue - gh issue create returns the URL directly (not JSON)
    const { stdout: issueOutput } = await exec(
      `gh issue create --title "Code: ${task.slice(0, 60)}" --body "${issueBody.replace(/"/g, '\\"')}" --label "${CODE_ORCHESTRATOR_LABEL}"`
    );

    // Parse URL to get issue number
    const issueUrl = issueOutput.trim();
    const issueNumberMatch = issueUrl.match(/\/issues\/(\d+)$/);
    if (!issueNumberMatch || !issueNumberMatch[1]) {
      throw new Error(`Could not parse issue number from: ${issueUrl}`);
    }
    const issue = {
      number: parseInt(issueNumberMatch[1], 10),
      url: issueUrl,
    };

    // Add to Code Orchestrator project
    try {
      await exec(`gh project item-add ${projectNumber} --owner @me --url ${issue.url}`);
    } catch {
      // Project add is optional, continue if it fails
      console.warn('Failed to add issue to project, continuing...');
    }

    // Store execution in database
    const { data: execution, error: dbError } = await ctx
      .getClient()
      .schema(DB_SCHEMAS.HUMAN_OS)
      .from('code_executions')
      .insert({
        user_id: ctx.userUUID,
        task,
        repo_path: repoPath,
        branch_name: branchName,
        worktree_path: worktreePath,
        github_issue_number: issue.number,
        github_issue_url: issue.url,
        github_project_number: projectNumber,
        status: 'running',
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup on failure
      await exec(`git worktree remove "${worktreePath}" --force`).catch(() => {});
      await exec(`git branch -D "${branchName}"`).catch(() => {});
      await exec(`gh issue close ${issue.number} --comment "Failed to start: ${dbError.message}"`).catch(() => {});
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Build prompt with tracking instructions
    const fullPrompt = buildPromptWithTracking(task, issue.number, branchName);

    // Spawn Claude Code in worktree (fire and forget)
    const claudeProcess = spawn('claude', ['--print', fullPrompt], {
      cwd: worktreePath,
      detached: true,
      stdio: 'ignore',
      shell: true,
    });

    claudeProcess.unref();

    // Post initial status
    await exec(
      `gh issue comment ${issue.number} --body "Started Claude Code in worktree. Working on: ${task}"`
    ).catch(() => {});

    return {
      success: true,
      executionId: execution.id,
      issueNumber: issue.number,
      issueUrl: issue.url,
      branchName,
      worktreePath,
      message: `Task started in isolated worktree. Track progress: ${issue.url}`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check status of a code task
 */
async function codeStatus(
  ctx: ToolContext,
  issueNumber: number
): Promise<{
  issueNumber: number;
  state?: string;
  title?: string;
  branchName?: string;
  worktreePath?: string;
  dbStatus?: string;
  latestUpdate?: string;
  isComplete: boolean;
  error?: string;
}> {
  try {
    // Get issue details
    const { stdout: issueJson } = await exec(
      `gh issue view ${issueNumber} --json title,state,body,comments`
    );
    const issue = JSON.parse(issueJson);

    // Get execution from database
    const { data: execution } = await ctx
      .getClient()
      .schema(DB_SCHEMAS.HUMAN_OS)
      .from('code_executions')
      .select('*')
      .eq('github_issue_number', issueNumber)
      .single();

    const latestComment = issue.comments?.[issue.comments.length - 1];

    return {
      issueNumber,
      state: issue.state,
      title: issue.title,
      branchName: execution?.branch_name,
      worktreePath: execution?.worktree_path,
      dbStatus: execution?.status,
      latestUpdate: latestComment?.body,
      isComplete: issue.state === 'CLOSED',
    };
  } catch (error) {
    return {
      issueNumber,
      isComplete: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List all running code tasks
 */
async function codeList(ctx: ToolContext): Promise<{
  count: number;
  tasks: Array<{
    issueNumber: number;
    title: string;
    branchName?: string;
    status: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  try {
    // Get open issues with code-orchestrator label
    const { stdout: issuesJson } = await exec(
      `gh issue list --label "${CODE_ORCHESTRATOR_LABEL}" --state open --json number,title,createdAt`
    );
    const issues = JSON.parse(issuesJson);

    // Get database records for more details
    const { data: executions } = await ctx
      .getClient()
      .schema(DB_SCHEMAS.HUMAN_OS)
      .from('code_executions')
      .select('github_issue_number, branch_name, status')
      .eq('status', 'running');

    const executionMap = new Map(
      (executions || []).map((e: { github_issue_number: number; branch_name: string; status: string }) => [e.github_issue_number, e])
    );

    const tasks = issues.map((issue: { number: number; title: string; createdAt: string }) => {
      const execution = executionMap.get(issue.number);
      return {
        issueNumber: issue.number,
        title: issue.title,
        branchName: execution?.branch_name,
        status: execution?.status || 'unknown',
        createdAt: issue.createdAt,
      };
    });

    return {
      count: tasks.length,
      tasks,
    };
  } catch (error) {
    return {
      count: 0,
      tasks: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Merge a completed code task into main
 */
async function codeMerge(
  ctx: ToolContext,
  issueNumber: number
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    // Get execution from database
    const { data: execution, error: dbError } = await ctx
      .getClient()
      .schema(DB_SCHEMAS.HUMAN_OS)
      .from('code_executions')
      .select('*')
      .eq('github_issue_number', issueNumber)
      .single();

    if (dbError || !execution) {
      return {
        success: false,
        message: '',
        error: `Execution not found for issue #${issueNumber}`,
      };
    }

    // Merge branch into current branch (usually main/master)
    await exec(`git merge ${execution.branch_name} --no-ff -m "Merge ${execution.branch_name}

Closes #${issueNumber}"`);

    // Remove worktree
    await exec(`git worktree remove "${execution.worktree_path}"`);

    // Delete branch
    await exec(`git branch -d "${execution.branch_name}"`);

    // Update database
    await ctx
      .getClient()
      .schema(DB_SCHEMAS.HUMAN_OS)
      .from('code_executions')
      .update({
        status: 'merged',
        merged_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    // Close issue
    await exec(`gh issue close ${issueNumber} --comment "Merged to main branch"`);

    return {
      success: true,
      message: `Merged ${execution.branch_name} into main and cleaned up worktree`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Discard a code task without merging
 */
async function codeDiscard(
  ctx: ToolContext,
  issueNumber: number
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    // Get execution from database
    const { data: execution, error: dbError } = await ctx
      .getClient()
      .schema(DB_SCHEMAS.HUMAN_OS)
      .from('code_executions')
      .select('*')
      .eq('github_issue_number', issueNumber)
      .single();

    if (dbError || !execution) {
      return {
        success: false,
        message: '',
        error: `Execution not found for issue #${issueNumber}`,
      };
    }

    // Force remove worktree
    await exec(`git worktree remove "${execution.worktree_path}" --force`).catch(() => {});

    // Force delete branch
    await exec(`git branch -D "${execution.branch_name}"`).catch(() => {});

    // Update database
    await ctx
      .getClient()
      .schema(DB_SCHEMAS.HUMAN_OS)
      .from('code_executions')
      .update({
        status: 'discarded',
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    // Close issue
    await exec(`gh issue close ${issueNumber} --comment "Discarded without merge"`);

    return {
      success: true,
      message: `Discarded ${execution.branch_name} and cleaned up worktree`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
