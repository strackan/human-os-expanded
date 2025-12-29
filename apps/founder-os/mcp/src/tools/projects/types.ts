/**
 * Project Types
 */

export interface CreateProjectParams {
  name: string;
  slug?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  target_end_date?: string;
  readme_markdown?: string;
  github_repo_url?: string;
  claude_project_folder?: string;
}

export interface UpdateProjectParams {
  project_id?: string;
  slug?: string;
  name?: string;
  new_slug?: string;
  description?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  target_end_date?: string;
  readme_markdown?: string;
  github_repo_url?: string;
  claude_project_folder?: string;
}

export interface AddMilestoneParams {
  project_id?: string;
  project_slug?: string;
  name: string;
  description?: string;
  target_date?: string;
  order_index?: number;
}

export interface UpdateMilestoneParams {
  milestone_id: string;
  name?: string;
  description?: string;
  status?: string;
  target_date?: string;
  order_index?: number;
}

export interface AddProjectTaskParams {
  project_id?: string;
  project_slug?: string;
  title: string;
  milestone_id?: string;
  description?: string;
  priority?: string;
  due_date?: string;
  energy_level?: string;
  context_tags?: string[];
}

export interface UpdateProjectTaskParams {
  task_id: string;
  project_id?: string | null;
  milestone_id?: string | null;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}

export interface ListProjectTasksParams {
  project_id?: string;
  project_slug?: string;
  milestone_id?: string;
  status?: string;
}

export interface LinkToProjectParams {
  project_id?: string;
  project_slug?: string;
  linked_type: string;
  linked_id: string;
  relationship?: string;
}

export interface UnlinkFromProjectParams {
  project_id?: string;
  project_slug?: string;
  linked_type: string;
  linked_id: string;
}
