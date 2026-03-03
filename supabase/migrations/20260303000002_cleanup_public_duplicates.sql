-- ============================================================================
-- Cleanup: drop public.* duplicates that now live in proper schemas
-- Also drops x_human.* legacy tables superseded by human_os.*
--
-- IMPORTANT: Run this AFTER data has been verified in target schemas
-- This migration is intentionally separate so it can be deferred
-- ============================================================================

-- ============================================================================
-- Phase 1: Move remaining public tables to human_os (non-destructive)
-- These are tables that should be in human_os but were left in public
-- ============================================================================

-- claude_capture_queue → human_os
ALTER TABLE IF EXISTS public.claude_capture_queue SET SCHEMA human_os;

-- claude_conversations + conversation_turns → human_os
ALTER TABLE IF EXISTS public.conversation_turns SET SCHEMA human_os;
ALTER TABLE IF EXISTS public.claude_conversations SET SCHEMA human_os;

-- mcp_tool_calls → human_os
ALTER TABLE IF EXISTS public.mcp_tool_calls SET SCHEMA human_os;

-- glossary → human_os
ALTER TABLE IF EXISTS public.glossary SET SCHEMA human_os;

-- identity_packs → human_os
ALTER TABLE IF EXISTS public.identity_packs SET SCHEMA human_os;

-- intel_requests → human_os
ALTER TABLE IF EXISTS public.intel_requests SET SCHEMA human_os;

-- user_preferences → human_os
ALTER TABLE IF EXISTS public.user_preferences SET SCHEMA human_os;

-- user_tenants → human_os
ALTER TABLE IF EXISTS public.user_tenants SET SCHEMA human_os;

-- sculptor_* → human_os (already have some sculptor tables)
ALTER TABLE IF EXISTS public.sculptor_responses SET SCHEMA human_os;
ALTER TABLE IF EXISTS public.sculptor_sessions SET SCHEMA human_os;
ALTER TABLE IF EXISTS public.sculptor_templates SET SCHEMA human_os;

-- skills_* → human_os
ALTER TABLE IF EXISTS public.skills_programs SET SCHEMA human_os;
ALTER TABLE IF EXISTS public.skills_tools SET SCHEMA human_os;

-- relationship_context → human_os
ALTER TABLE IF EXISTS public.relationship_context SET SCHEMA human_os;

-- question framework → human_os
ALTER TABLE IF EXISTS public.questions SET SCHEMA human_os;
ALTER TABLE IF EXISTS public.question_sets SET SCHEMA human_os;
ALTER TABLE IF EXISTS public.question_set_questions SET SCHEMA human_os;

-- entity answers/dimensions → human_os
ALTER TABLE IF EXISTS public.entity_answers SET SCHEMA human_os;
ALTER TABLE IF EXISTS public.entity_dimensions SET SCHEMA human_os;

-- outreach_queue → crm
ALTER TABLE IF EXISTS public.outreach_queue SET SCHEMA crm;

-- pitch_messages → crm
ALTER TABLE IF EXISTS public.pitch_messages SET SCHEMA crm;

-- li_posts, li_post_engagements → gft (duplicates of gft.*)
-- These may have data, so only move if gft.* versions are empty
-- Otherwise drop after verifying data parity

-- ============================================================================
-- Phase 2: Drop true duplicates (same data exists in target schema)
-- ============================================================================

-- public.journal_* duplicates of human_os.journal_*
DROP TABLE IF EXISTS public.journal_entry_moods CASCADE;
DROP TABLE IF EXISTS public.journal_entity_mentions CASCADE;
DROP TABLE IF EXISTS public.journal_leads CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;

-- public.mood_definitions duplicate of human_os.mood_definitions
DROP TABLE IF EXISTS public.mood_definitions CASCADE;

-- public.campaigns — superseded by crm.campaigns
DROP TABLE IF EXISTS public.campaigns CASCADE;

-- ============================================================================
-- Phase 3: Drop x_human legacy (superseded by human_os.*)
-- ============================================================================

-- x_human.user_products → superseded by human_os.user_products
DROP TABLE IF EXISTS x_human.user_products CASCADE;

-- x_human.activation_keys → superseded by human_os.activation_keys
DROP TABLE IF EXISTS x_human.activation_keys CASCADE;

-- Drop x_ schemas if empty
DROP SCHEMA IF EXISTS x_human CASCADE;
DROP SCHEMA IF EXISTS x_goodhang CASCADE;
DROP SCHEMA IF EXISTS x_renubu CASCADE;

-- ============================================================================
-- Phase 4: Handle entity dedup (requires careful merge)
-- These are flagged but NOT dropped — need manual verification
-- ============================================================================

-- public.entities has (slug, privacy_scope, source_system, name_embedding)
-- human_os.entities has (entity_type, slug, canonical_name, domain)
-- global.entities has (linkedin_url, confidence_score, verified_at)
--
-- TODO: Merge public.entities unique cols into human_os.entities, then:
-- DROP TABLE IF EXISTS public.entities CASCADE;
--
-- public.entity_links has (layer, source_slug, target_slug, link_text, strength)
-- human_os.entity_links has (source_entity_id, target_entity_id, relationship_type)
--
-- TODO: Merge, then:
-- DROP TABLE IF EXISTS public.entity_links CASCADE;
--
-- public.context_files has (layer, file_path, storage_bucket, content_tsv, frontmatter, tools_count)
-- human_os.context_files has (entity_id, file_type, content, llm_summary, source)
--
-- TODO: Merge, then:
-- DROP TABLE IF EXISTS public.context_files CASCADE;
--
-- public.contacts — legacy simplified version, superseded by gft.contacts
-- TODO: Verify no unique data, then:
-- DROP TABLE IF EXISTS public.contacts CASCADE;
--
-- public.profiles — merge unique fields into human_os.users, then:
-- TODO: DROP TABLE IF EXISTS public.profiles CASCADE;
--
-- public.cs_assessment_sessions — merge with goodhang.cs_assessment_sessions
-- TODO: DROP TABLE IF EXISTS public.cs_assessment_sessions CASCADE;
--
-- public.api_keys / public.api_key_usage — merge with human_os.api_keys
-- TODO: DROP after merge

-- ============================================================================
-- Note: public.entity_scorecard and public.question_set_progress are likely
-- views, not tables. They'll continue to work if underlying tables move.
-- ============================================================================
