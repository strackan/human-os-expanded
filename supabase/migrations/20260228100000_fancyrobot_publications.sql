-- Publications & Distributors — normalized schema for content distribution tracking
-- Supports CSV import from NewsUSA/PR Newswire, Gumshoe citation data, strategy recommendations,
-- and 7-tier Venn diagram recommendation engine (A=Inventory, B=Gumshoe, C=Strategy)

-- Distributors — content distribution companies
CREATE TABLE IF NOT EXISTS fancyrobot.distributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    website TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_distributors_slug ON fancyrobot.distributors(slug);

-- Publication groups — logical groupings (tier, industry, region, budget, client)
CREATE TABLE IF NOT EXISTS fancyrobot.publication_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    group_type TEXT NOT NULL,  -- tier, industry, region, budget, client
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_pubgroups_slug ON fancyrobot.publication_groups(slug);
CREATE INDEX IF NOT EXISTS idx_fr_pubgroups_type ON fancyrobot.publication_groups(group_type);

-- Publications — individual publications with metrics and list membership
CREATE TABLE IF NOT EXISTS fancyrobot.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distributor_id UUID REFERENCES fancyrobot.distributors(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    url TEXT,
    domain TEXT,
    domain_authority INT,
    domain_rating INT,
    ai_score FLOAT,
    ai_tier TEXT,
    common_crawl TEXT,
    price_usd INT,
    turnaround TEXT,
    region TEXT,
    dofollow BOOLEAN DEFAULT FALSE,
    publication_type TEXT DEFAULT 'news',       -- news, video, forum, blog, review, reference, government, academic, social, aggregator, industry
    category TEXT DEFAULT '',                   -- industry/specialty: financial_news, precious_metals, investment, consumer_review, etc.
    citation_count INT DEFAULT 0,              -- times cited by AI models (from Gumshoe sources)
    source_lists TEXT[] DEFAULT '{}',          -- which lists: newsusa, gumshoe, strategy
    recommendation_tier INT,                   -- 1-7, computed from Venn(A,B,C)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fr_publications_url ON fancyrobot.publications(url) WHERE url IS NOT NULL AND url != '';
CREATE INDEX IF NOT EXISTS idx_fr_publications_domain ON fancyrobot.publications(domain);
CREATE INDEX IF NOT EXISTS idx_fr_publications_distributor ON fancyrobot.publications(distributor_id);
CREATE INDEX IF NOT EXISTS idx_fr_publications_ai_tier ON fancyrobot.publications(ai_tier);
CREATE INDEX IF NOT EXISTS idx_fr_publications_ai_score ON fancyrobot.publications(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_fr_publications_region ON fancyrobot.publications(region);
CREATE INDEX IF NOT EXISTS idx_fr_publications_price ON fancyrobot.publications(price_usd);
CREATE INDEX IF NOT EXISTS idx_fr_publications_type ON fancyrobot.publications(publication_type);
CREATE INDEX IF NOT EXISTS idx_fr_publications_category ON fancyrobot.publications(category);
CREATE INDEX IF NOT EXISTS idx_fr_publications_citation_count ON fancyrobot.publications(citation_count DESC);
CREATE INDEX IF NOT EXISTS idx_fr_publications_tier ON fancyrobot.publications(recommendation_tier);

-- Publication citations — raw evidence of AI models citing a domain/URL
CREATE TABLE IF NOT EXISTS fancyrobot.publication_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES fancyrobot.publications(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    domain TEXT NOT NULL,
    model TEXT NOT NULL,
    persona TEXT,
    question TEXT,
    topics TEXT[] DEFAULT '{}',
    answer_id TEXT,
    prompt_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_pubcit_publication ON fancyrobot.publication_citations(publication_id);
CREATE INDEX IF NOT EXISTS idx_fr_pubcit_domain ON fancyrobot.publication_citations(domain);
CREATE INDEX IF NOT EXISTS idx_fr_pubcit_model ON fancyrobot.publication_citations(model);

-- Publication group members — many-to-many junction
CREATE TABLE IF NOT EXISTS fancyrobot.publication_group_members (
    publication_id UUID NOT NULL REFERENCES fancyrobot.publications(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES fancyrobot.publication_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (publication_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_fr_pgm_group ON fancyrobot.publication_group_members(group_id);

-- Article publications — track where articles get placed
CREATE TABLE IF NOT EXISTS fancyrobot.article_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_run_id UUID NOT NULL REFERENCES fancyrobot.article_runs(id) ON DELETE CASCADE,
    publication_id UUID NOT NULL REFERENCES fancyrobot.publications(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'planned',  -- planned, submitted, published, rejected
    published_url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fr_artpub_run ON fancyrobot.article_publications(article_run_id);
CREATE INDEX IF NOT EXISTS idx_fr_artpub_pub ON fancyrobot.article_publications(publication_id);
CREATE INDEX IF NOT EXISTS idx_fr_artpub_status ON fancyrobot.article_publications(status);

-- RLS — open policies matching existing fancyrobot tables
ALTER TABLE fancyrobot.distributors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_distributors" ON fancyrobot.distributors FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fancyrobot.publication_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_publication_groups" ON fancyrobot.publication_groups FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fancyrobot.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_publications" ON fancyrobot.publications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fancyrobot.publication_citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_publication_citations" ON fancyrobot.publication_citations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fancyrobot.publication_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_publication_group_members" ON fancyrobot.publication_group_members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE fancyrobot.article_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_article_publications" ON fancyrobot.article_publications FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON fancyrobot.distributors TO anon, authenticated;
GRANT ALL ON fancyrobot.publication_groups TO anon, authenticated;
GRANT ALL ON fancyrobot.publications TO anon, authenticated;
GRANT ALL ON fancyrobot.publication_citations TO anon, authenticated;
GRANT ALL ON fancyrobot.publication_group_members TO anon, authenticated;
GRANT ALL ON fancyrobot.article_publications TO anon, authenticated;
