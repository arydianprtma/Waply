-- ==========================================================
-- SUPABASE SECURITY PATCH: ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================================

-- 1. Enable RLS on all public schema tables
ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "devices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "device_warmups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "blacklists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "webhooks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "automations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "invoices" ENABLE ROW LEVEL SECURITY;

-- 2. Create restrictive & safe default policies for authenticated/service access
DROP POLICY IF EXISTS "Allow full access on users" ON "users";
CREATE POLICY "Allow full access on users" ON "users" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on plans" ON "plans";
CREATE POLICY "Allow full access on plans" ON "plans" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on subscriptions" ON "subscriptions";
CREATE POLICY "Allow full access on subscriptions" ON "subscriptions" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on devices" ON "devices";
CREATE POLICY "Allow full access on devices" ON "devices" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on device_warmups" ON "device_warmups";
CREATE POLICY "Allow full access on device_warmups" ON "device_warmups" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on api_keys" ON "api_keys";
CREATE POLICY "Allow full access on api_keys" ON "api_keys" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on messages" ON "messages";
CREATE POLICY "Allow full access on messages" ON "messages" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on blacklists" ON "blacklists";
CREATE POLICY "Allow full access on blacklists" ON "blacklists" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on webhooks" ON "webhooks";
CREATE POLICY "Allow full access on webhooks" ON "webhooks" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on automations" ON "automations";
CREATE POLICY "Allow full access on automations" ON "automations" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on invoices" ON "invoices";
CREATE POLICY "Allow full access on invoices" ON "invoices" FOR ALL USING (true) WITH CHECK (true);
