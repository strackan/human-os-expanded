-- Add priority and processed columns to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT false;

-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- RLS policy: authenticated users can view/insert/update workflows
CREATE POLICY "Authenticated users can view workflows" ON public.workflows
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert workflows" ON public.workflows
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update workflows" ON public.workflows
    FOR UPDATE USING (auth.role() = 'authenticated'); 