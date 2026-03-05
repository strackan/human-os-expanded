"use client";

/**
 * React Query hooks for ARI data fetching (trimmed to dashboard-only methods)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ariClient from "@/lib/ari-client";

export const queryKeys = {
  entities: ["entities"] as const,
  entity: (id: string) => ["entity", id] as const,
  entityByName: (name: string) => ["entity", "name", name] as const,
  score: (entityId: string) => ["score", entityId] as const,
  scoreHistory: (entityId: string) =>
    ["score", "history", entityId] as const,
  comparison: (aId: string, bId: string) =>
    ["comparison", aId, bId] as const,
  calculationStatus: (jobId: string) => ["calculation", jobId] as const,
};

export function useEntities(type?: string) {
  return useQuery({
    queryKey: [...queryKeys.entities, type],
    queryFn: () => ariClient.getEntities(type),
  });
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: queryKeys.entity(id),
    queryFn: () => ariClient.getEntity(id),
    enabled: !!id,
  });
}

export function useEntityByName(name: string) {
  return useQuery({
    queryKey: queryKeys.entityByName(name),
    queryFn: () => ariClient.getEntityByName(name),
    enabled: !!name,
  });
}

export function useARIScore(entityId: string) {
  return useQuery({
    queryKey: queryKeys.score(entityId),
    queryFn: () => ariClient.getScore(entityId),
    enabled: !!entityId,
  });
}

export function useScoreHistory(entityId: string, limit = 10) {
  return useQuery({
    queryKey: [...queryKeys.scoreHistory(entityId), limit],
    queryFn: () => ariClient.getScoreHistory(entityId, limit),
    enabled: !!entityId,
  });
}

export function useComparison(entityAId: string, entityBId: string) {
  return useQuery({
    queryKey: queryKeys.comparison(entityAId, entityBId),
    queryFn: () => ariClient.compareEntities(entityAId, entityBId),
    enabled: !!entityAId && !!entityBId,
  });
}

export function useCalculateScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entityId: string) => ariClient.calculateScore(entityId),
    onSuccess: (_data, entityId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.score(entityId) });
    },
  });
}

export function useCalculationStatus(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.calculationStatus(jobId || ""),
    queryFn: () => ariClient.getCalculationStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "running") {
        return 2000;
      }
      return false;
    },
  });
}
