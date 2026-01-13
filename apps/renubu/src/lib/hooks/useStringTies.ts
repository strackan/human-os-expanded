'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  StringTie,
  CreateStringTieRequest,
  CreateStringTieResponse,
  UpdateStringTieRequest,
  UpdateStringTieResponse,
  GetStringTiesResponse,
  DeleteStringTieResponse,
  ParseStringTieRequest,
  ParseStringTieResponse,
  UserSettings,
  UpdateUserSettingsInput,
  StringTieFilters,
} from '@/types/string-ties';

/**
 * API Integration Hooks for String-Tie Reminders
 *
 * React Query hooks for managing string-tie reminders with:
 * - Automatic caching and background updates
 * - Optimistic updates
 * - Error handling
 */

// =====================================================
// Query Keys
// =====================================================

const QUERY_KEYS = {
  stringTies: (filters?: StringTieFilters) => ['string-ties', filters],
  stringTie: (id: string) => ['string-tie', id],
  settings: () => ['string-tie-settings'],
};

// =====================================================
// Fetch String Ties
// =====================================================

async function fetchStringTies(filters?: StringTieFilters): Promise<StringTie[]> {
  const params = new URLSearchParams();

  if (filters?.reminded !== undefined) params.append('reminded', String(filters.reminded));
  if (filters?.dismissed !== undefined) params.append('dismissed', String(filters.dismissed));
  if (filters?.source) params.append('source', filters.source);
  if (filters?.remindAfter) params.append('remindAfter', filters.remindAfter);
  if (filters?.remindBefore) params.append('remindBefore', filters.remindBefore);
  if (filters?.limit) params.append('limit', String(filters.limit));
  if (filters?.offset) params.append('offset', String(filters.offset));

  const queryString = params.toString();
  const url = `/api/string-ties${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch string ties');
  }

  const data: GetStringTiesResponse = await response.json();
  return data.stringTies;
}

export function useStringTies(filters?: StringTieFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.stringTies(filters),
    queryFn: () => fetchStringTies(filters),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// =====================================================
// Create String Tie
// =====================================================

async function createStringTie(input: CreateStringTieRequest): Promise<CreateStringTieResponse> {
  const response = await fetch('/api/string-ties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create string tie');
  }

  return response.json();
}

export function useCreateStringTie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStringTie,
    onSuccess: () => {
      // Invalidate all string-tie queries to refetch
      queryClient.invalidateQueries({ queryKey: ['string-ties'] });
    },
  });
}

// =====================================================
// Parse Reminder (Preview)
// =====================================================

async function parseReminder(input: ParseStringTieRequest): Promise<ParseStringTieResponse> {
  const response = await fetch('/api/string-ties/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse reminder');
  }

  return response.json();
}

export function useParseReminder() {
  return useMutation({
    mutationFn: parseReminder,
  });
}

// =====================================================
// Dismiss String Tie
// =====================================================

async function dismissStringTie(id: string): Promise<DeleteStringTieResponse> {
  const response = await fetch(`/api/string-ties/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to dismiss string tie');
  }

  return response.json();
}

export function useDismissStringTie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissStringTie,
    onSuccess: () => {
      // Invalidate all string-tie queries to refetch
      queryClient.invalidateQueries({ queryKey: ['string-ties'] });
    },
  });
}

// =====================================================
// Snooze String Tie
// =====================================================

interface SnoozeStringTieInput {
  id: string;
  minutes: number;
}

async function snoozeStringTie({ id, minutes }: SnoozeStringTieInput): Promise<UpdateStringTieResponse> {
  const response = await fetch(`/api/string-ties/${id}/snooze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to snooze string tie');
  }

  return response.json();
}

export function useSnoozeStringTie() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: snoozeStringTie,
    onSuccess: () => {
      // Invalidate all string-tie queries to refetch
      queryClient.invalidateQueries({ queryKey: ['string-ties'] });
    },
  });
}

// =====================================================
// User Settings
// =====================================================

async function fetchSettings(): Promise<UserSettings> {
  const response = await fetch('/api/string-ties/settings');

  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }

  return response.json();
}

export function useStringTieSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.settings(),
    queryFn: fetchSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

async function updateSettings(input: UpdateUserSettingsInput): Promise<UserSettings> {
  const response = await fetch('/api/string-ties/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update settings');
  }

  return response.json();
}

export function useUpdateStringTieSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      // Invalidate settings query to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings() });
    },
  });
}
