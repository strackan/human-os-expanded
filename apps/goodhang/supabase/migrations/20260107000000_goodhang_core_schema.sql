-- Good Hang Core Schema
-- Minimal schema for D&D personality assessment

-- =====================================================
-- 1. PROFILES TABLE (for assessment status tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  assessment_status TEXT DEFAULT 'not_started' CHECK (assessment_status IN ('not_started', 'in_progress', 'completed', 'pending_review', 'trial', 'approved', 'waitlist', 'rejected')),
  assessment_completed_at TIMESTAMPTZ,
  invite_code_used TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. CS_ASSESSMENT_SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cs_assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_section_index INTEGER NOT NULL DEFAULT 0,
  current_question_index INTEGER NOT NULL DEFAULT 0,

  -- Interview data
  interview_transcript JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- V2: D&D Character Profile
  character_profile JSONB, -- {tagline, alignment, race, class}
  attributes JSONB, -- {INT, WIS, CHA, CON, STR, DEX}
  signals JSONB, -- {enneagram_hint, interest_vectors, social_energy, relationship_style}
  matching JSONB, -- {ideal_group_size, connection_style, energy_pattern, good_match_with, avoid_match_with}
  question_scores JSONB, -- Per-question scoring details

  -- Legacy V1 fields (for backwards compat)
  archetype TEXT,
  archetype_confidence TEXT CHECK (archetype_confidence IN ('high', 'medium', 'low')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  dimensions JSONB,
  tier TEXT CHECK (tier IN ('top_1', 'benched', 'passed')),
  flags JSONB,
  recommendation TEXT,
  best_fit_roles TEXT[],
  badges TEXT[],

  -- Lightning round
  lightning_round_score INTEGER,
  lightning_round_percentile INTEGER,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_user_id ON public.cs_assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_status ON public.cs_assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cs_assessment_sessions_started_at ON public.cs_assessment_sessions(started_at DESC);

-- RLS
ALTER TABLE public.cs_assessment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.cs_assessment_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.cs_assessment_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.cs_assessment_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.cs_assessment_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_cs_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cs_sessions_updated_at ON public.cs_assessment_sessions;
CREATE TRIGGER trigger_cs_sessions_updated_at
  BEFORE UPDATE ON public.cs_assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION update_cs_sessions_updated_at();

-- =====================================================
-- 3. ACTIVATION_KEYS TABLE (for desktop app)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  product TEXT NOT NULL DEFAULT 'goodhang',
  session_id UUID REFERENCES public.cs_assessment_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activation_keys_code ON public.activation_keys(code);
CREATE INDEX IF NOT EXISTS idx_activation_keys_user_id ON public.activation_keys(user_id);

ALTER TABLE public.activation_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activation keys"
  ON public.activation_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Function to create activation key
CREATE OR REPLACE FUNCTION public.create_activation_key(
  p_product TEXT,
  p_session_id UUID,
  p_expires_in_days INTEGER DEFAULT 7,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (code TEXT, deep_link TEXT, expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user_id UUID;
BEGIN
  -- Generate unique code
  v_code := upper(substring(md5(random()::text) from 1 for 4) || '-' ||
                  substring(md5(random()::text) from 1 for 4) || '-' ||
                  substring(md5(random()::text) from 1 for 4));

  v_expires_at := NOW() + (p_expires_in_days || ' days')::interval;

  -- Get user_id from session
  SELECT cs.user_id INTO v_user_id
  FROM public.cs_assessment_sessions cs
  WHERE cs.id = p_session_id;

  INSERT INTO public.activation_keys (code, product, session_id, user_id, metadata, expires_at)
  VALUES (v_code, p_product, p_session_id, v_user_id, p_metadata, v_expires_at);

  RETURN QUERY SELECT
    v_code,
    'goodhang://activate?code=' || v_code,
    v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONE
-- =====================================================

COMMENT ON TABLE public.cs_assessment_sessions IS 'Good Hang D&D personality assessment sessions';
COMMENT ON COLUMN public.cs_assessment_sessions.character_profile IS 'D&D character: {tagline, alignment, race, class}';
COMMENT ON COLUMN public.cs_assessment_sessions.attributes IS 'D&D attributes: {INT, WIS, CHA, CON, STR, DEX} (1-10 scale)';
