-- Quick script to create string_ties tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/amugmkrihnjsxlpwdzcy/sql/new

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  string_tie_default_offset_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create string_ties table
CREATE TABLE IF NOT EXISTS public.string_ties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reminder_text TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  reminded BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  source TEXT CHECK (source IN ('manual', 'chat_magic_snippet', 'voice')),
  default_offset_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.string_ties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own settings" ON public.user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for string_ties
CREATE POLICY "Users can view their own string ties" ON public.string_ties FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own string ties" ON public.string_ties FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NOT NULL);
CREATE POLICY "Users can update their own string ties" ON public.string_ties FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own string ties" ON public.string_ties FOR DELETE USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_string_ties_user_id ON public.string_ties(user_id);
CREATE INDEX IF NOT EXISTS idx_string_ties_remind_at ON public.string_ties(remind_at) WHERE NOT reminded;
CREATE INDEX IF NOT EXISTS idx_string_ties_user_active ON public.string_ties(user_id, reminded) WHERE NOT reminded;
