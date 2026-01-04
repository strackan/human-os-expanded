/**
 * API Client Types
 *
 * Shared types for the API client layer.
 * These types define the contract between frontend and backend.
 */

// =====================================================
// Base Types
// =====================================================

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  count: number;
  totalPages: number;
}

// =====================================================
// User Types
// =====================================================

export interface UserProfile {
  id: string;
  firstName: string;
  fullName: string | null;
  email: string;
  role: string | null;
  companyId: string | null;
}

// =====================================================
// Customer Types
// =====================================================

export interface CustomerFilters {
  search?: string;
  industry?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
  minARR?: number;
}

export interface CustomerSortOptions {
  field: 'name' | 'health_score' | 'renewal_date' | 'current_arr';
  direction: 'asc' | 'desc';
}

export interface Customer {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  health_score: number;
  renewal_date: string | null;
  current_arr: number;
  assigned_to: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Workflow Types
// =====================================================

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  customer_id: string;
  status: string;
  current_step_id: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface WorkflowStepExecution {
  id: string;
  execution_id: string;
  step_id: string;
  status: string;
  data: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
}

// =====================================================
// Team Types
// =====================================================

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

// =====================================================
// Notification Types
// =====================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
