-- Create alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renewal_id UUID REFERENCES renewals(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    alert_subtype TEXT,
    data_source TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    current_value JSONB NOT NULL,
    previous_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    metadata JSONB
);

-- Add RLS policies for alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their company's renewals"
    ON alerts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM renewals r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.id = alerts.renewal_id
            AND c.company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert alerts for their company's renewals"
    ON alerts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM renewals r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.id = alerts.renewal_id
            AND c.company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update alerts for their company's renewals"
    ON alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM renewals r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.id = alerts.renewal_id
            AND c.company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create action_scores table
CREATE TABLE action_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renewal_id UUID REFERENCES renewals(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    score_type TEXT NOT NULL,
    score_value DECIMAL(3,2) NOT NULL,
    factors JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Add RLS policies for action_scores
ALTER TABLE action_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action scores for their company's renewals"
    ON action_scores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM renewals r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.id = action_scores.renewal_id
            AND c.company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert action scores for their company's renewals"
    ON action_scores FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM renewals r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.id = action_scores.renewal_id
            AND c.company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renewal_id UUID REFERENCES renewals(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    total_action_score DECIMAL(3,2) NOT NULL,
    recommended_actions JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    metadata JSONB
);

-- Add RLS policies for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events for their company's renewals"
    ON events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM renewals r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.id = events.renewal_id
            AND c.company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert events for their company's renewals"
    ON events FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM renewals r
            JOIN customers c ON r.customer_id = c.id
            WHERE r.id = events.renewal_id
            AND c.company_id IN (
                SELECT company_id FROM user_companies
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create workflow_templates table
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    conditions JSONB NOT NULL,
    steps JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Add RLS policies for workflow_templates
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow templates"
    ON workflow_templates FOR SELECT
    USING (true);

CREATE POLICY "Users can insert workflow templates"
    ON workflow_templates FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update workflow templates"
    ON workflow_templates FOR UPDATE
    USING (true);

-- Add triggering_event_id to workflow_instances
ALTER TABLE workflow_instances 
ADD COLUMN triggering_event_id UUID REFERENCES events(id); 