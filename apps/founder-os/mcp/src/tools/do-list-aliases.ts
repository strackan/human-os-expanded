/**
 * Extracted list_aliases helper — used by invokeToolInternal
 * to handle list_aliases calls without importing handleDoTools (avoids recursion).
 */

import { AliasResolver, type ResolverConfig } from '@human-os/aliases';
import type { ToolContext } from '../lib/context.js';

export async function listAvailableAliases(
  params: Record<string, unknown>,
  ctx: ToolContext
): Promise<{
  aliases: Array<{
    pattern: string;
    description?: string;
    mode?: string;
    usageCount: number;
  }>;
  hint: string;
}> {
  const includeDescriptions = (params.includeDescriptions as boolean) ?? true;

  const resolverConfig: ResolverConfig = {
    supabaseUrl: ctx.supabaseUrl,
    supabaseKey: ctx.supabaseKey,
    defaultLayer: ctx.layer,
    enableSemanticFallback: false,
    semanticThreshold: 0.7,
  };

  const resolver = new AliasResolver(resolverConfig);
  const aliases = await resolver.listAliases(ctx.layer, includeDescriptions);

  return {
    aliases,
    hint: 'Use the do() tool with any of these patterns. Variables in {braces} will be extracted from your request.',
  };
}
