import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  participant_type: 'user' | 'ai' | 'system';
  participant_id?: string;
  message_type: 'text' | 'action' | 'decision' | 'link';
  content: string;
  confidence_score?: number;
  structured_data?: any;
  responds_to_message_id?: string;
  decision_outcome?: string;
  created_at: string;
}

export interface WorkflowConversation {
  id: string;
  renewal_id?: string;
  workflow_id?: string;
  renewal_task_id?: string;
  conversation_type: 'renewal_prep' | 'negotiation' | 'risk_assessment' | 'general';
  title?: string;
  status: 'active' | 'archived' | 'completed';
  privacy_level: 'private' | 'team' | 'company';
  created_by?: string;
  created_at: string;
  updated_at: string;
  messages?: ConversationMessage[];
  participant_count?: number;
  last_message_at?: string;
}

export interface ConversationFilters {
  conversation_type?: string;
  status?: string;
  privacy_level?: string;
  renewal_id?: string;
  created_by?: string;
}

export interface UseConversationsOptions {
  filters?: ConversationFilters;
  sortBy?: 'created_at' | 'updated_at' | 'last_message_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeMessages?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseConversationsReturn {
  conversations: WorkflowConversation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createConversation: (conversation: Omit<WorkflowConversation, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateConversation: (id: string, updates: Partial<WorkflowConversation>) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  getConversationById: (id: string) => WorkflowConversation | undefined;
  getConversationMessages: (conversationId: string) => Promise<ConversationMessage[]>;
  sendMessage: (conversationId: string, message: Omit<ConversationMessage, 'id' | 'conversation_id' | 'created_at'>) => Promise<void>;
  stats: {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    activeConversations: number;
    averageMessagesPerConversation: number;
  };
}

export const useConversations = (options: UseConversationsOptions = {}): UseConversationsReturn => {
  const {
    filters = {},
    sortBy = 'updated_at',
    sortOrder = 'desc',
    limit,
    includeMessages = false,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [conversations, setConversations] = useState<WorkflowConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('workflow_conversations')
        .select(`
          *,
          messages:conversation_messages(
            id,
            participant_type,
            participant_id,
            message_type,
            content,
            confidence_score,
            structured_data,
            responds_to_message_id,
            decision_outcome,
            created_at
          )
        `);

      // Apply filters
      if (filters.conversation_type) {
        query = query.eq('conversation_type', filters.conversation_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.privacy_level) {
        query = query.eq('privacy_level', filters.privacy_level);
      }
      if (filters.renewal_id) {
        query = query.eq('renewal_id', filters.renewal_id);
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Process conversations and add computed fields
      const processedConversations = (data || []).map(conv => {
        const messages = conv.messages || [];
        const lastMessage = messages.length > 0 
          ? messages[messages.length - 1] 
          : null;

        return {
          ...conv,
          participant_count: new Set(messages.map((m: any) => m.participant_id).filter(Boolean)).size,
          last_message_at: lastMessage?.created_at || conv.updated_at,
          messages: includeMessages ? messages : undefined
        };
      });

      setConversations(processedConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, limit, includeMessages, supabase]);

  const createConversation = useCallback(async (conversation: Omit<WorkflowConversation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('workflow_conversations')
        .insert([conversation])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setConversations(prev => [...prev, data]);
      return data.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, [supabase]);

  const updateConversation = useCallback(async (id: string, updates: Partial<WorkflowConversation>) => {
    try {
      const { error: updateError } = await supabase
        .from('workflow_conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setConversations(prev => 
        prev.map(conv => 
          conv.id === id 
            ? { ...conv, ...updates, updated_at: new Date().toISOString() }
            : conv
        )
      );
    } catch (err) {
      console.error('Error updating conversation:', err);
      throw err;
    }
  }, [supabase]);

  const archiveConversation = useCallback(async (id: string) => {
    await updateConversation(id, { status: 'archived' });
  }, [updateConversation]);

  const getConversationById = useCallback((id: string) => {
    return conversations.find(conv => conv.id === id);
  }, [conversations]);

  const getConversationMessages = useCallback(async (conversationId: string): Promise<ConversationMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      throw err;
    }
  }, [supabase]);

  const sendMessage = useCallback(async (conversationId: string, message: Omit<ConversationMessage, 'id' | 'conversation_id' | 'created_at'>) => {
    try {
      const { data, error: sendError } = await supabase
        .from('conversation_messages')
        .insert([{
          ...message,
          conversation_id: conversationId
        }])
        .select()
        .single();

      if (sendError) {
        throw sendError;
      }

      // Update conversation's updated_at timestamp
      await updateConversation(conversationId, {
        updated_at: new Date().toISOString()
      });

      // Update local state if we have the conversation loaded
      setConversations(prev => 
        prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              updated_at: new Date().toISOString(),
              last_message_at: data.created_at,
              messages: conv.messages ? [...conv.messages, data] : undefined
            };
          }
          return conv;
        })
      );
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [supabase, updateConversation]);

  // Computed stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalMessages = 0;

    conversations.forEach(conv => {
      // Count by type
      byType[conv.conversation_type] = (byType[conv.conversation_type] || 0) + 1;
      
      // Count by status
      byStatus[conv.status] = (byStatus[conv.status] || 0) + 1;
      
      // Count messages
      totalMessages += conv.messages?.length || 0;
    });

    return {
      total: conversations.length,
      byType,
      byStatus,
      activeConversations: byStatus['active'] || 0,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0
    };
  }, [conversations]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchConversations();

    if (autoRefresh) {
      const interval = setInterval(fetchConversations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchConversations, autoRefresh, refreshInterval]);

  // Real-time subscriptions
  useEffect(() => {
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_conversations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [...prev, payload.new as WorkflowConversation]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === payload.new.id 
                  ? payload.new as WorkflowConversation 
                  : conv
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setConversations(prev => 
              prev.filter(conv => conv.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const messageChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_messages'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ConversationMessage;
            setConversations(prev => 
              prev.map(conv => {
                if (conv.id === newMessage.conversation_id) {
                  return {
                    ...conv,
                    updated_at: new Date().toISOString(),
                    last_message_at: newMessage.created_at,
                    messages: conv.messages ? [...conv.messages, newMessage] : undefined
                  };
                }
                return conv;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [supabase]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    createConversation,
    updateConversation,
    archiveConversation,
    getConversationById,
    getConversationMessages,
    sendMessage,
    stats
  };
}; 