"""Supabase database connection and utilities."""

from functools import lru_cache
from typing import Any

from supabase import create_client, Client

from app.config import get_settings


@lru_cache
def get_supabase_client() -> Client | None:
    """
    Get a cached Supabase client instance.

    Returns None if Supabase is not configured.
    """
    settings = get_settings()

    if not settings.has_supabase():
        return None

    return create_client(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_key,
    )


async def check_connection() -> bool:
    """Check if Supabase connection is working."""
    client = get_supabase_client()
    if not client:
        return False

    try:
        # Try a simple query to verify connection
        client.table("entities").select("id").limit(1).execute()
        return True
    except Exception:
        return False


# SQL schema for reference (run in Supabase SQL editor)
SCHEMA_SQL = """
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Entities table
CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('person', 'company', 'product')),
    category TEXT NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    template TEXT NOT NULL,
    intent TEXT NOT NULL,
    list_size INTEGER,
    entity_type TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt runs table (tracks analysis jobs)
CREATE TABLE IF NOT EXISTS prompt_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI responses table
CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_run_id UUID REFERENCES prompt_runs(id) ON DELETE CASCADE,
    prompt_template_id TEXT REFERENCES prompt_templates(id),
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'perplexity', 'gemini')),
    model_version TEXT,
    raw_response TEXT NOT NULL,
    parsed_mentions JSONB DEFAULT '[]',
    latency_ms INTEGER,
    tokens_used INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARI scores table
CREATE TABLE IF NOT EXISTS ari_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    prompt_run_id UUID REFERENCES prompt_runs(id) ON DELETE CASCADE,
    overall_score REAL NOT NULL,
    provider_scores JSONB NOT NULL DEFAULT '{}',
    mentions_count INTEGER DEFAULT 0,
    total_prompts INTEGER DEFAULT 0,
    mention_rate REAL DEFAULT 0,
    sample_responses JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_category ON entities(category);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_entity ON prompt_runs(entity_id);
CREATE INDEX IF NOT EXISTS idx_prompt_runs_status ON prompt_runs(status);
CREATE INDEX IF NOT EXISTS idx_ai_responses_prompt_run ON ai_responses(prompt_run_id);
CREATE INDEX IF NOT EXISTS idx_ari_scores_entity ON ari_scores(entity_id);
CREATE INDEX IF NOT EXISTS idx_ari_scores_calculated ON ari_scores(calculated_at DESC);

-- Row Level Security (optional, for multi-tenant support later)
-- ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prompt_runs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ari_scores ENABLE ROW LEVEL SECURITY;
"""


def get_schema_sql() -> str:
    """Return the SQL schema for reference."""
    return SCHEMA_SQL
