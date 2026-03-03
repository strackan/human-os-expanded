-- ============================================================================
-- Consolidate Good Hang tables into goodhang.* schema
-- Source: standalone goodhang Supabase instance (zxzwlogjgawckfunhifb)
-- All IF NOT EXISTS for idempotency
-- ============================================================================

-- Schema + grants
CREATE SCHEMA IF NOT EXISTS goodhang;
GRANT USAGE ON SCHEMA goodhang TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA goodhang GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA goodhang GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- ============================================================================
-- PROFILES (app-specific extension of human_os.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role TEXT,
    company TEXT,
    linkedin_url TEXT,
    interests TEXT[],
    membership_tier TEXT,
    user_role TEXT,
    region_id UUID,
    assessment_status TEXT,
    invite_code_used TEXT,
    assessment_completed_at TIMESTAMPTZ,
    beacon_radius_miles NUMERIC,
    beacon_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_profiles_email ON goodhang.profiles(email);
CREATE INDEX IF NOT EXISTS idx_gh_profiles_region ON goodhang.profiles(region_id);
CREATE INDEX IF NOT EXISTS idx_gh_profiles_tier ON goodhang.profiles(membership_tier);

-- ============================================================================
-- REGIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    ambassador_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- APPLICATIONS (membership)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    linkedin_url TEXT,
    why_join TEXT,
    contribution TEXT,
    referral_source TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    region_id UUID
);

CREATE INDEX IF NOT EXISTS idx_gh_applications_status ON goodhang.applications(status);
CREATE INDEX IF NOT EXISTS idx_gh_applications_email ON goodhang.applications(email);

-- ============================================================================
-- CONTACTS (invite contacts, distinct from renubu/gft contacts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    company TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    invite_code TEXT,
    invite_sent_at TIMESTAMPTZ,
    invite_used_at TIMESTAMPTZ,
    user_id UUID,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_contacts_user ON goodhang.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_gh_contacts_email ON goodhang.contacts(email);

-- ============================================================================
-- INVITE CODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    generated_by UUID,
    used_by UUID,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_gh_invite_codes_code ON goodhang.invite_codes(code);

-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.pending_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT,
    invite_code TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    user_id UUID
);

-- ============================================================================
-- EVENTS + RSVPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    event_datetime TIMESTAMPTZ,
    capacity INTEGER,
    is_public BOOLEAN DEFAULT false,
    created_by UUID,
    region_id UUID,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_events_datetime ON goodhang.events(event_datetime);
CREATE INDEX IF NOT EXISTS idx_gh_events_region ON goodhang.events(region_id);

CREATE TABLE IF NOT EXISTS goodhang.rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES goodhang.events(id) ON DELETE CASCADE,
    user_id UUID,
    guest_name TEXT,
    guest_email TEXT,
    plus_ones INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_rsvps_event ON goodhang.rsvps(event_id);

-- ============================================================================
-- ASSESSMENT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.cs_assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    status TEXT DEFAULT 'in_progress',
    current_section_index INTEGER DEFAULT 0,
    current_question_index INTEGER DEFAULT 0,
    interview_transcript JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    archetype TEXT,
    archetype_confidence NUMERIC,
    overall_score NUMERIC,
    dimensions JSONB,
    tier TEXT,
    flags JSONB,
    recommendation TEXT,
    best_fit_roles TEXT[],
    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- GH-specific columns not in human-os version
    personality_type TEXT,
    personality_profile JSONB,
    public_summary TEXT,
    detailed_summary TEXT,
    career_level TEXT,
    years_experience INTEGER,
    badges JSONB,
    profile_slug TEXT,
    is_published BOOLEAN DEFAULT false,
    lightning_round_score INTEGER,
    lightning_round_difficulty TEXT,
    lightning_round_completed_at TIMESTAMPTZ,
    absurdist_questions_answered INTEGER,
    category_scores JSONB,
    ai_orchestration_scores JSONB
);

CREATE INDEX IF NOT EXISTS idx_gh_cs_sessions_user ON goodhang.cs_assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gh_cs_sessions_status ON goodhang.cs_assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_gh_cs_sessions_slug ON goodhang.cs_assessment_sessions(profile_slug);

CREATE TABLE IF NOT EXISTS goodhang.assessment_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    criteria JSONB,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goodhang.lightning_round_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    correct_answer TEXT,
    explanation TEXT,
    question_type TEXT,
    difficulty TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goodhang.public_profiles (
    user_id UUID,
    session_id UUID,
    profile_slug TEXT,
    name TEXT,
    email TEXT,
    career_level TEXT,
    years_experience INTEGER,
    self_description TEXT,
    personality_type TEXT,
    archetype TEXT,
    badges JSONB,
    best_fit_roles TEXT[],
    public_summary TEXT,
    video_url TEXT,
    show_scores BOOLEAN DEFAULT false,
    overall_score NUMERIC,
    category_scores JSONB,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_public_profiles_slug ON goodhang.public_profiles(profile_slug);

-- ============================================================================
-- MEMBER CHARACTERS (D&D-style)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.member_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    race TEXT,
    class TEXT,
    alignment TEXT,
    attr_strength INTEGER,
    attr_dexterity INTEGER,
    attr_constitution INTEGER,
    attr_intelligence INTEGER,
    attr_wisdom INTEGER,
    attr_charisma INTEGER,
    enneagram_type TEXT,
    avatar_seed TEXT,
    avatar_url TEXT,
    profile_summary TEXT,
    key_strengths TEXT[],
    summary_generated_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_characters_user ON goodhang.member_characters(user_id);

-- ============================================================================
-- BEACON SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.beacons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    lat NUMERIC,
    lng NUMERIC,
    venue_name TEXT,
    venue_address TEXT,
    vibe_text TEXT,
    duration_hint TEXT,
    tagged_member_ids UUID[],
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_beacons_user ON goodhang.beacons(user_id);
CREATE INDEX IF NOT EXISTS idx_gh_beacons_status ON goodhang.beacons(status);

CREATE TABLE IF NOT EXISTS goodhang.beacon_pings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beacon_id UUID REFERENCES goodhang.beacons(id) ON DELETE CASCADE,
    from_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goodhang.beacon_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beacon_id UUID REFERENCES goodhang.beacons(id) ON DELETE CASCADE,
    user_id UUID,
    response_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FAVOR SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.favor_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    visual_seed TEXT,
    signature_pattern TEXT,
    minted_at TIMESTAMPTZ DEFAULT NOW(),
    mint_source TEXT,
    mint_event_id UUID,
    current_owner_id UUID,
    original_owner_id UUID,
    favor_history JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goodhang.favor_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goodhang.favors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID REFERENCES goodhang.favor_tokens(id),
    requester_id UUID,
    recipient_id UUID,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completion_note TEXT,
    revision_request TEXT,
    current_proposal_id UUID,
    requester_confirmed BOOLEAN DEFAULT false,
    recipient_confirmed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS goodhang.favor_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    favor_id UUID REFERENCES goodhang.favors(id) ON DELETE CASCADE,
    proposer_id UUID,
    description TEXT,
    status TEXT DEFAULT 'pending',
    awaiting_response_from UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS goodhang.favor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    favor_id UUID REFERENCES goodhang.favors(id) ON DELETE CASCADE,
    sender_id UUID,
    message TEXT,
    message_type TEXT DEFAULT 'text',
    proposed_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goodhang.favor_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID,
    blocked_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL,
    subject_user_id UUID,
    target_user_id UUID,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EMAIL SUBSCRIBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.email_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    source TEXT,
    subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_email_subs_email ON goodhang.email_subscribers(email);

-- ============================================================================
-- ROADTRIP
-- ============================================================================

CREATE TABLE IF NOT EXISTS goodhang.roadtrip_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT,
    linkedin TEXT,
    stop_id TEXT,
    custom_city TEXT,
    custom_lat NUMERIC,
    custom_lng NUMERIC,
    interest_brainstorm BOOLEAN DEFAULT false,
    interest_renubu BOOLEAN DEFAULT false,
    interest_workshop BOOLEAN DEFAULT false,
    interest_happy_hour BOOLEAN DEFAULT false,
    interest_coffee BOOLEAN DEFAULT false,
    interest_dinner BOOLEAN DEFAULT false,
    interest_crash BOOLEAN DEFAULT false,
    interest_intro BOOLEAN DEFAULT false,
    interest_join_leg BOOLEAN DEFAULT false,
    interest_unknown BOOLEAN DEFAULT false,
    note TEXT
);

CREATE TABLE IF NOT EXISTS goodhang.roadtrip_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT,
    message TEXT
);

-- ============================================================================
-- RLS POLICIES — service_role full access, authenticated read/write
-- ============================================================================

DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'profiles', 'regions', 'applications', 'contacts', 'invite_codes',
        'pending_invites', 'events', 'rsvps', 'cs_assessment_sessions',
        'assessment_badges', 'lightning_round_questions', 'public_profiles',
        'member_characters', 'beacons', 'beacon_pings', 'beacon_responses',
        'favor_tokens', 'favor_listings', 'favors', 'favor_proposals',
        'favor_messages', 'favor_blocks', 'admin_notifications',
        'email_subscribers', 'roadtrip_interests', 'roadtrip_messages'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE goodhang.%I ENABLE ROW LEVEL SECURITY', t);

        EXECUTE format(
            'CREATE POLICY "service_role_all_%s" ON goodhang.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
            t, t
        );

        EXECUTE format(
            'CREATE POLICY "authenticated_all_%s" ON goodhang.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
            t, t
        );

        -- Public profiles and assessment badges readable by anon
        IF t IN ('public_profiles', 'assessment_badges', 'regions', 'events', 'email_subscribers', 'roadtrip_interests', 'roadtrip_messages') THEN
            EXECUTE format(
                'CREATE POLICY "anon_read_%s" ON goodhang.%I FOR SELECT TO anon USING (true)',
                t, t
            );
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- Expose schema to PostgREST
-- ============================================================================
-- NOTE: Must also add 'goodhang' to supabase/config.toml [api].schemas
-- and to the Supabase dashboard API settings for cloud
