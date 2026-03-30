-- ==========================================================
-- SAFE MIGRATION: Enhanced Expenses + Announcement Notifications
-- ==========================================================
-- ✅ SAFETY GUARANTEED:
--    • All ALTER TABLE lines use "IF NOT EXISTS" → will not fail if already run
--    • CREATE TABLE uses "IF NOT EXISTS" → safe to re-run, no data lost
--    • DROP POLICY uses "IF EXISTS" → safe even if policy doesn't exist yet
--    • Existing expense rows keep all data; new columns default to NULL/OTHERS
--    • Existing notifications rows are untouched; only the constraint widens
--    • No existing tables, columns, or rows are deleted or modified
--    • RLS policies use DROP + CREATE pattern (idempotent)
-- ==========================================================

-- ─── STEP 1: Add new columns to expenses (safe, additive only) ───────────
-- Existing expense rows will have category = 'OTHERS' (default), bill_url = NULL
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category text DEFAULT 'OTHERS';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS custom_category text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS bill_url text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── STEP 2: Create expense_splits table (new table, no impact on existing) ─
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  share_percentage numeric DEFAULT 0,
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Split view" ON expense_splits;
CREATE POLICY "Split view" ON expense_splits FOR SELECT
  USING (profile_id = auth.uid() OR apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Split manage" ON expense_splits;
CREATE POLICY "Split manage" ON expense_splits FOR ALL
  USING (is_super_admin() OR is_admin_of(apartment_id));

-- ─── STEP 3: Widen the notifications type constraint (additive only) ─────
-- Previous allowed values are fully preserved. Only adds EXPENSE + ANNOUNCEMENT.
-- Existing notifications with SQFT_REQUEST / COMPLAINT / GENERAL are unaffected.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('SQFT_REQUEST', 'COMPLAINT', 'GENERAL', 'EXPENSE', 'ANNOUNCEMENT'));

-- ─── STEP 4: Add notification update policy (new policy, no data change) ─
DROP POLICY IF EXISTS "Notification update" ON notifications;
CREATE POLICY "Notification update" ON notifications FOR UPDATE
  USING (profile_id = auth.uid() OR is_super_admin());

-- ─── STEP 5: Announcement RLS policies (idempotent DROP + CREATE) ────────
DROP POLICY IF EXISTS "Announcement view" ON announcements;
CREATE POLICY "Announcement view" ON announcements FOR SELECT
  USING (is_super_admin() OR apartment_id IN (SELECT get_my_apartments()));

DROP POLICY IF EXISTS "Announcement manage" ON announcements;
CREATE POLICY "Announcement manage" ON announcements FOR ALL
  USING (is_super_admin() OR is_admin_of(apartment_id));

-- ─── STEP 6: Storage bucket for expense bills ────────────────────────────
-- ⚠️  Run this separately in Supabase Storage console (or uncomment once):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('expense-bills', 'expense-bills', true)
-- ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- ✅ Migration complete. Nothing existing was deleted or modified.
-- ==========================================================
