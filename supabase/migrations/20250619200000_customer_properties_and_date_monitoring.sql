-- Create customer_properties table for dynamic customer data
CREATE TABLE IF NOT EXISTS public.customer_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Usage and performance metrics
    usage_score INTEGER DEFAULT 0,
    health_score INTEGER DEFAULT 50,
    nps_score INTEGER,
    last_activity_date DATE,
    
    -- Key dates (these will trigger events when approaching)
    contract_renewal_date DATE,
    contract_end_date DATE,
    next_review_date DATE,
    expansion_opportunity_date DATE,
    
    -- Dynamic properties
    current_arr DECIMAL(12,2),
    expansion_potential DECIMAL(12,2) DEFAULT 0,
    risk_level TEXT DEFAULT 'medium',
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_customer_id UNIQUE (customer_id)
);

-- Create key_dates table for more flexible date tracking
CREATE TABLE IF NOT EXISTS public.key_dates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    date_type TEXT NOT NULL, -- 'renewal', 'end', 'review', 'expansion', etc.
    date_value DATE NOT NULL,
    description TEXT,
    alert_days INTEGER DEFAULT 30, -- Days before date to start alerting
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create date_monitoring_log table to track when we've checked dates
CREATE TABLE IF NOT EXISTS public.date_monitoring_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    key_date_id UUID REFERENCES public.key_dates(id) ON DELETE CASCADE,
    check_date DATE NOT NULL,
    days_until_date INTEGER NOT NULL,
    event_created BOOLEAN DEFAULT false,
    event_id UUID REFERENCES public.events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.customer_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_monitoring_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_properties
CREATE POLICY "Authenticated users can view customer_properties" ON public.customer_properties
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert customer_properties" ON public.customer_properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update customer_properties" ON public.customer_properties
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS policies for key_dates
CREATE POLICY "Authenticated users can view key_dates" ON public.key_dates
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert key_dates" ON public.key_dates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update key_dates" ON public.key_dates
    FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS policies for date_monitoring_log
CREATE POLICY "Authenticated users can view date_monitoring_log" ON public.date_monitoring_log
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert date_monitoring_log" ON public.date_monitoring_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update date_monitoring_log" ON public.date_monitoring_log
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_properties_customer_id ON public.customer_properties(customer_id);
CREATE INDEX IF NOT EXISTS idx_key_dates_customer_id ON public.key_dates(customer_id);
CREATE INDEX IF NOT EXISTS idx_key_dates_date_value ON public.key_dates(date_value);
CREATE INDEX IF NOT EXISTS idx_date_monitoring_log_check_date ON public.date_monitoring_log(check_date); 