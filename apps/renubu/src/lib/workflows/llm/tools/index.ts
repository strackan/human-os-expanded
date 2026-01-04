/**
 * INTEL Tools Registry
 *
 * Central registry for all INTEL skill tools available to the LLM.
 * These tools allow the LLM to read customer intelligence files
 * during workflow execution.
 */

import { getPreWorkflowContextTool, type INTELTool, type ToolDefinition } from './getPreWorkflowContext';
import { readFullINTELTool } from './readFullINTEL';
import { readContactProfileTool } from './readContactProfile';

/**
 * All available INTEL tools
 */
export const INTEL_TOOLS: INTELTool[] = [
  getPreWorkflowContextTool,
  readFullINTELTool,
  readContactProfileTool,
];

/**
 * Get tool definitions for LLM (Anthropic format)
 */
export function getINTELToolDefinitions(): ToolDefinition[] {
  return INTEL_TOOLS.map((tool) => tool.definition);
}

/**
 * Execute an INTEL tool by name
 */
export async function executeINTELTool(
  toolName: string,
  input: Record<string, any>
): Promise<string> {
  const tool = INTEL_TOOLS.find((t) => t.definition.name === toolName);

  if (!tool) {
    throw new Error(`Unknown INTEL tool: ${toolName}`);
  }

  return tool.execute(input);
}

/**
 * Check if a tool name is an INTEL tool
 */
export function isINTELTool(toolName: string): boolean {
  return INTEL_TOOLS.some((t) => t.definition.name === toolName);
}

// Re-export types
export type { INTELTool, ToolDefinition };
