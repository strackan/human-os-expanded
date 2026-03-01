/**
 * React Query hooks for ARI data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

// Query keys
export const queryKeys = {
  entities: ['entities'] as const,
  entity: (id: string) => ['entity', id] as const,
  entityByName: (name: string) => ['entity', 'name', name] as const,
  score: (entityId: string) => ['score', entityId] as const,
  scoreHistory: (entityId: string) => ['score', 'history', entityId] as const,
  comparison: (aId: string, bId: string) => ['comparison', aId, bId] as const,
  calculationStatus: (jobId: string) => ['calculation', jobId] as const,
  promptTemplates: (entityType?: string) => ['prompts', entityType] as const,
}

// Entity hooks
export function useEntities(type?: string) {
  return useQuery({
    queryKey: [...queryKeys.entities, type],
    queryFn: () => apiClient.getEntities(type),
  })
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: queryKeys.entity(id),
    queryFn: () => apiClient.getEntity(id),
    enabled: !!id,
  })
}

export function useEntityByName(name: string) {
  return useQuery({
    queryKey: queryKeys.entityByName(name),
    queryFn: () => apiClient.getEntityByName(name),
    enabled: !!name,
  })
}

// Score hooks
export function useARIScore(entityId: string) {
  return useQuery({
    queryKey: queryKeys.score(entityId),
    queryFn: () => apiClient.getScore(entityId),
    enabled: !!entityId,
  })
}

export function useScoreHistory(entityId: string, limit = 10) {
  return useQuery({
    queryKey: [...queryKeys.scoreHistory(entityId), limit],
    queryFn: () => apiClient.getScoreHistory(entityId, limit),
    enabled: !!entityId,
  })
}

export function useComparison(entityAId: string, entityBId: string) {
  return useQuery({
    queryKey: queryKeys.comparison(entityAId, entityBId),
    queryFn: () => apiClient.compareEntities(entityAId, entityBId),
    enabled: !!entityAId && !!entityBId,
  })
}

// Calculation hooks
export function useCalculateScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entityId: string) => apiClient.calculateScore(entityId),
    onSuccess: (_data, entityId) => {
      // Invalidate score queries when calculation starts
      queryClient.invalidateQueries({ queryKey: queryKeys.score(entityId) })
    },
  })
}

export function useCalculationStatus(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.calculationStatus(jobId || ''),
    queryFn: () => apiClient.getCalculationStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll every 2 seconds while pending/running
      const status = query.state.data?.status
      if (status === 'pending' || status === 'running') {
        return 2000
      }
      return false
    },
  })
}

// Prompt hooks
export function usePromptTemplates(entityType?: string) {
  return useQuery({
    queryKey: queryKeys.promptTemplates(entityType),
    queryFn: () => apiClient.getPromptTemplates(entityType),
  })
}

// Combined hook for full ARI dashboard data
export function useARIDashboard(entityName: string, competitorName: string) {
  const entityQuery = useEntityByName(entityName)
  const competitorQuery = useEntityByName(competitorName)

  const entityId = entityQuery.data?.id
  const competitorId = competitorQuery.data?.id

  const scoreQuery = useARIScore(entityId || '')
  const competitorScoreQuery = useARIScore(competitorId || '')

  const comparisonQuery = useComparison(entityId || '', competitorId || '')

  return {
    entity: entityQuery.data,
    competitor: competitorQuery.data,
    score: scoreQuery.data,
    competitorScore: competitorScoreQuery.data,
    comparison: comparisonQuery.data,
    isLoading:
      entityQuery.isLoading ||
      competitorQuery.isLoading ||
      scoreQuery.isLoading ||
      competitorScoreQuery.isLoading,
    isError:
      entityQuery.isError ||
      competitorQuery.isError ||
      scoreQuery.isError ||
      competitorScoreQuery.isError,
    error:
      entityQuery.error ||
      competitorQuery.error ||
      scoreQuery.error ||
      competitorScoreQuery.error,
  }
}
