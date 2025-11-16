/**
 * React hooks for Parking Lot API
 * Provides clean interface for UI components to interact with parking lot system
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ParkingLotItem,
  ParkingLotCategory,
  CreateParkingLotItemRequest,
  ListParkingLotItemsRequest,
  UpdateParkingLotItemRequest,
  ExpandParkingLotItemRequest,
  CaptureMode
} from '@/types/parking-lot';

// ============================================================================
// API CLIENT FUNCTIONS
// ============================================================================

async function fetchParkingLotItems(
  params: ListParkingLotItemsRequest = {}
): Promise<{ items: ParkingLotItem[]; total: number }> {
  const searchParams = new URLSearchParams();

  if (params.mode) searchParams.append('mode', params.mode);
  if (params.categories) searchParams.append('categories', params.categories.join(','));
  if (params.status) searchParams.append('status', params.status);
  if (params.minReadiness !== undefined) searchParams.append('minReadiness', params.minReadiness.toString());
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.offset) searchParams.append('offset', params.offset.toString());

  const response = await fetch(`/api/parking-lot?${searchParams.toString()}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch parking lot items');
  }

  return { items: data.items || [], total: data.total || 0 };
}

async function fetchParkingLotItem(id: string): Promise<ParkingLotItem> {
  const response = await fetch(`/api/parking-lot/${id}`);
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch parking lot item');
  }

  return data.item;
}

async function createParkingLotItem(
  request: CreateParkingLotItemRequest
): Promise<ParkingLotItem> {
  const response = await fetch('/api/parking-lot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create parking lot item');
  }

  return data.item;
}

async function updateParkingLotItem(
  id: string,
  updates: UpdateParkingLotItemRequest
): Promise<ParkingLotItem> {
  const response = await fetch(`/api/parking-lot/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to update parking lot item');
  }

  return data.item;
}

async function deleteParkingLotItem(id: string): Promise<void> {
  const response = await fetch(`/api/parking-lot/${id}`, {
    method: 'DELETE'
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to delete parking lot item');
  }
}

async function expandParkingLotItem(
  id: string,
  request?: ExpandParkingLotItemRequest
): Promise<{ expansion: any; artifact: any }> {
  const response = await fetch(`/api/parking-lot/${id}/expand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request || {})
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to expand parking lot item');
  }

  return { expansion: data.expansion, artifact: data.artifact };
}

async function submitBrainstormAnswers(
  id: string,
  answers: any[]
): Promise<{ expansion: any; nextAction: string }> {
  const response = await fetch(`/api/parking-lot/${id}/brainstorm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to submit brainstorm answers');
  }

  return { expansion: data.expansion, nextAction: data.nextAction };
}

async function convertToWorkflow(
  id: string,
  workflowConfigId: string,
  preFillData?: any
): Promise<{ workflowId: string }> {
  const response = await fetch(`/api/parking-lot/${id}/convert-to-workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflow_config_id: workflowConfigId,
      pre_fill_data: preFillData
    })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to convert to workflow');
  }

  return { workflowId: data.workflow_id };
}

async function fetchCategories(): Promise<ParkingLotCategory[]> {
  const response = await fetch('/api/parking-lot/categories');
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch categories');
  }

  return data.categories || [];
}

async function createCategory(
  name: string,
  description?: string,
  color?: string,
  icon?: string
): Promise<ParkingLotCategory> {
  const response = await fetch('/api/parking-lot/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, color, icon })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create category');
  }

  return data.category;
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Fetch list of parking lot items with filtering
 */
export function useParkingLotItems(params: ListParkingLotItemsRequest = {}) {
  return useQuery({
    queryKey: ['parking-lot-items', params],
    queryFn: () => fetchParkingLotItems(params),
    staleTime: 30000 // 30 seconds
  });
}

/**
 * Fetch a single parking lot item
 */
export function useParkingLotItem(id: string | null) {
  return useQuery({
    queryKey: ['parking-lot-item', id],
    queryFn: () => fetchParkingLotItem(id!),
    enabled: id !== null,
    staleTime: 30000
  });
}

/**
 * Create a new parking lot item
 */
export function useCreateParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createParkingLotItem,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['parking-lot-items'] });
    }
  });
}

/**
 * Update a parking lot item
 */
export function useUpdateParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateParkingLotItemRequest }) =>
      updateParkingLotItem(id, updates),
    onSuccess: (_, variables) => {
      // Invalidate specific item and list
      queryClient.invalidateQueries({ queryKey: ['parking-lot-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-lot-items'] });
    }
  });
}

/**
 * Delete a parking lot item
 */
export function useDeleteParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteParkingLotItem,
    onSuccess: () => {
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['parking-lot-items'] });
    }
  });
}

/**
 * Expand a parking lot item with LLM
 */
export function useExpandParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request?: ExpandParkingLotItemRequest }) =>
      expandParkingLotItem(id, request),
    onSuccess: (_, variables) => {
      // Invalidate specific item and list
      queryClient.invalidateQueries({ queryKey: ['parking-lot-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-lot-items'] });
    }
  });
}

/**
 * Archive (soft delete) a parking lot item
 */
export function useArchiveParkingLotItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateParkingLotItem(id, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parking-lot-items'] });
    }
  });
}

/**
 * Fetch user's categories
 */
export function useParkingLotCategories() {
  return useQuery({
    queryKey: ['parking-lot-categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000 // 5 minutes (categories change infrequently)
  });
}

/**
 * Create a custom category
 */
export function useCreateParkingLotCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description, color, icon }: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
    }) => createCategory(name, description, color, icon),
    onSuccess: () => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: ['parking-lot-categories'] });
    }
  });
}

/**
 * Filter items by mode
 */
export function useParkingLotItemsByMode(mode: CaptureMode) {
  return useParkingLotItems({ mode, sortBy: 'readiness' });
}

/**
 * Filter items by category
 */
export function useParkingLotItemsByCategory(categories: string[]) {
  return useParkingLotItems({ categories, sortBy: 'readiness' });
}

/**
 * Get items with high readiness (>= 70)
 */
export function useReadyParkingLotItems() {
  return useParkingLotItems({ minReadiness: 70, sortBy: 'readiness' });
}

/**
 * Get active items only
 */
export function useActiveParkingLotItems() {
  return useParkingLotItems({ status: 'active', sortBy: 'readiness' });
}

/**
 * Submit brainstorm answers and synthesize
 */
export function useSubmitBrainstormAnswers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: any[] }) =>
      submitBrainstormAnswers(id, answers),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-lot-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-lot-items'] });
    }
  });
}

/**
 * Convert parking lot item to workflow
 */
export function useConvertToWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, workflowConfigId, preFillData }: {
      id: string;
      workflowConfigId: string;
      preFillData?: any;
    }) => convertToWorkflow(id, workflowConfigId, preFillData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parking-lot-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['parking-lot-items'] });
    }
  });
}
