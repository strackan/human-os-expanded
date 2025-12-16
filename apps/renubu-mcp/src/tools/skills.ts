/**
 * Skills File Tools
 *
 * Query and read skills files from Human-OS.
 * Skills files follow Anthropic's preferred patterns (tools, programs, nestable).
 *
 * PERMISSION BOUNDARY:
 * - Renubu can read skills files in 'public' and 'renubu:*' layers
 * - Cannot access 'founder:*' layers (private personal skills)
 */

import { createClient } from '@supabase/supabase-js';

export interface SkillsTool {
  id: string;
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface SkillsProgram {
  id: string;
  name: string;
  description?: string;
  steps?: unknown[];
}

export interface SkillsFile {
  id: string;
  layer: string;
  file_path: string;
  entity_id?: string;
  frontmatter: Record<string, unknown>;
  tools_count: number;
  programs_count: number;
  source_system?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillsFileDetail extends SkillsFile {
  tools: SkillsTool[];
  programs: SkillsProgram[];
}

export interface ListSkillsFilesResult {
  files: SkillsFile[];
  total: number;
}

export interface SearchToolsResult {
  results: Array<{
    file_id: string;
    file_path: string;
    layer: string;
    tool_id: string;
    tool_name: string;
    tool_description?: string;
  }>;
}

/**
 * List skills files by layer
 */
export async function listSkillsFiles(
  supabaseUrl: string,
  supabaseKey: string,
  layer?: string,
  sourceSystem?: string,
  limit: number = 100
): Promise<ListSkillsFilesResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use the RPC function
  const { data, error } = await supabase.rpc('get_skills_files', {
    p_layer: layer || null,
    p_source_system: sourceSystem || null,
    p_limit: limit,
  });

  if (error) {
    console.error('Error listing skills files:', error);
    return { files: [], total: 0 };
  }

  return {
    files: data || [],
    total: data?.length || 0,
  };
}

/**
 * Get detailed skills file with tools and programs
 */
export async function getSkillsFileDetail(
  supabaseUrl: string,
  supabaseKey: string,
  fileId: string
): Promise<SkillsFileDetail | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use the RPC function
  const { data, error } = await supabase.rpc('get_skills_file_detail', {
    p_file_id: fileId,
  });

  if (error) {
    console.error('Error getting skills file detail:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as SkillsFileDetail;
}

/**
 * Search skills files by tool name
 */
export async function searchSkillsByTool(
  supabaseUrl: string,
  supabaseKey: string,
  toolName: string,
  layer?: string,
  limit: number = 20
): Promise<SearchToolsResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use the RPC function
  const { data, error } = await supabase.rpc('search_skills_by_tool', {
    p_tool_name: toolName,
    p_layer: layer || null,
    p_limit: limit,
  });

  if (error) {
    console.error('Error searching skills by tool:', error);
    return { results: [] };
  }

  return {
    results: data || [],
  };
}

/**
 * Get skills files linked to an entity
 */
export async function getEntitySkills(
  supabaseUrl: string,
  supabaseKey: string,
  entityId: string
): Promise<SkillsFile[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Use the RPC function
  const { data, error } = await supabase.rpc('get_entity_skills', {
    p_entity_id: entityId,
  });

  if (error) {
    console.error('Error getting entity skills:', error);
    return [];
  }

  return data || [];
}

/**
 * Get skills file by path
 */
export async function getSkillsFileByPath(
  supabaseUrl: string,
  supabaseKey: string,
  layer: string,
  filePath: string
): Promise<SkillsFile | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('context_files')
    .select(`
      id,
      layer,
      file_path,
      entity_id,
      frontmatter,
      tools_count,
      programs_count,
      source_system,
      created_at,
      updated_at
    `)
    .eq('layer', layer)
    .eq('file_path', filePath)
    .eq('file_type', 'skills')
    .single();

  if (error) {
    console.error('Error getting skills file by path:', error);
    return null;
  }

  return data as SkillsFile;
}

/**
 * Get available tools across all accessible skills files
 */
export async function listAvailableTools(
  supabaseUrl: string,
  supabaseKey: string,
  layer?: string,
  limit: number = 50
): Promise<Array<{
  tool_name: string;
  tool_description?: string;
  file_path: string;
  layer: string;
}>> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
    .from('skills_tools')
    .select(`
      name,
      description,
      context_files!inner (
        file_path,
        layer,
        file_type
      )
    `)
    .eq('context_files.file_type', 'skills')
    .limit(limit);

  if (layer) {
    query = query.eq('context_files.layer', layer);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing available tools:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const contextFile = row.context_files as { file_path: string; layer: string } | undefined;
    return {
      tool_name: row.name as string,
      tool_description: row.description as string | undefined,
      file_path: contextFile?.file_path || '',
      layer: contextFile?.layer || '',
    };
  });
}
