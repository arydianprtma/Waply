-- ==========================================================
-- SUPABASE SECURITY PATCH: DYNAMIC ROW LEVEL SECURITY (RLS)
-- Automatically enables RLS & creates policies for ALL existing tables in 'public'
-- ==========================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        -- 1. Enable RLS on existing table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
        
        -- 2. Drop old policy if exists
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access on %s" ON public.%I;', r.tablename, r.tablename);
        
        -- 3. Create safe full access policy for server/backend
        EXECUTE format('CREATE POLICY "Allow full access on %s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', r.tablename, r.tablename);
        
        RAISE NOTICE 'RLS successfully enabled for table: %', r.tablename;
    END LOOP;
END $$;
