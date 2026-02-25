-- ARI Score Snapshots & Entity Mappings
-- Persisted ARI score snapshots for trending and workflow triggers

CREATE TABLE ari_score_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),
  ari_entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'company',
  category TEXT NOT NULL DEFAULT 'general',
  overall_score NUMERIC(5,1) NOT NULL,
  mention_rate NUMERIC(5,1) NOT NULL DEFAULT 0,
  mentions_count INTEGER NOT NULL DEFAULT 0,
  total_prompts INTEGER NOT NULL DEFAULT 0,
  avg_position_score NUMERIC(5,1) DEFAULT 0,
  provider_scores JSONB NOT NULL DEFAULT '{}',
  sample_responses JSONB DEFAULT '[]',
  previous_score NUMERIC(5,1),
  score_delta NUMERIC(5,1),
  scan_triggered_by TEXT DEFAULT 'manual',
  scan_completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity mappings: Renubu customers <-> ARI entities
CREATE TABLE ari_entity_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'company',
  category TEXT NOT NULL DEFAULT 'general',
  competitors JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, customer_id, entity_name)
);

-- Indexes
CREATE INDEX idx_ari_snapshots_company ON ari_score_snapshots(company_id);
CREATE INDEX idx_ari_snapshots_customer ON ari_score_snapshots(customer_id);
CREATE INDEX idx_ari_snapshots_entity ON ari_score_snapshots(ari_entity_name);
CREATE INDEX idx_ari_snapshots_date ON ari_score_snapshots(scan_completed_at DESC);
CREATE INDEX idx_ari_mappings_customer ON ari_entity_mappings(company_id, customer_id);

-- RLS
ALTER TABLE ari_score_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ari_entity_mappings ENABLE ROW LEVEL SECURITY;
